<?php

namespace App\Http\Controllers;

use App\Helpers\WorkingDays;
use App\Http\Requests\StoreLeaveRequest;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Notifications\LeaveRequestSubmitted;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class LeaveRequestController extends Controller
{
    public function store(StoreLeaveRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $targetUserId = $request->user()->isAdmin()
            ? (int) $validated['userId']
            : $request->user()->id;

        // Più dipendenti possono avere assenze sugli stessi giorni (nessuna esclusività “globale” sul periodo).

        $leaveType = LeaveType::where('code', $validated['leaveType'])->first();
        if (! $leaveType) {
            return back()->withErrors(['leaveType' => 'Tipo non valido.']);
        }

        $start = Carbon::parse($validated['startDate'])->startOfDay();
        $end = Carbon::parse($validated['endDate'])->startOfDay();

        if (in_array($validated['leaveType'], ['FERIE', 'PERMESSO'], true)
            && $this->periodOverlapsPendingOrApprovedSickLeave($targetUserId, $start, $end)) {
            return back()->withErrors([
                'startDate' => 'Non puoi richiedere ferie o permesso in giorni per cui esiste già una richiesta di malattia (in attesa o approvata).',
            ]);
        }

        $noticeDays = (int) ($leaveType->notice_days_required ?? 0);
        if ($noticeDays > 0) {
            $minStart = now()->startOfDay()->addDays($noticeDays);
            if ($start->lt($minStart)) {
                return back()->withErrors([
                    'startDate' => "Serve un preavviso di {$noticeDays} giorni.",
                ]);
            }
        }

        $requestedUnits = (int) ($validated['requestedUnits'] ?? 0);

        if ($leaveType->unit === 'days') {
            $days = WorkingDays::between($start->toDateString(), $end->toDateString());
            $requestedUnits = $days;

            $maxConsecutiveDays = $leaveType->max_consecutive_days !== null
                ? (int) $leaveType->max_consecutive_days
                : null;
            if ($maxConsecutiveDays !== null && $days > $maxConsecutiveDays) {
                return back()->withErrors([
                    'startDate' => "Massimo consentito: {$maxConsecutiveDays} giorni consecutivi.",
                ]);
            }

            if ($leaveType->deducts_balance) {
                $currentYear = now()->year;
                $balance = LeaveBalance::where('user_id', $targetUserId)
                    ->where('year', $currentYear)
                    ->first();

                if (! $balance) {
                    return back()->withErrors([
                        'startDate' => 'Budget ferie non impostato. Contatta l\'admin.',
                    ]);
                }

                $usedDays = (int) LeaveRequest::sumDeductibleApprovedDaysByUserForYear($currentYear)
                    ->get($targetUserId, 0);
                $remaining = max(0, $balance->allocated_days - $usedDays);

                if ($days > $remaining) {
                    return back()->withErrors([
                        'startDate' => "Giorni richiesti ({$days}) > residui ({$remaining}).",
                    ]);
                }
            }
        } elseif ($leaveType->unit === 'hours' && $requestedUnits < 1) {
            return back()->withErrors(['requestedUnits' => 'Minimo 1 ora.']);
        }

        if ($leaveType->requires_attachment && ! $request->hasFile('attachment')) {
            return back()->withErrors([
                'attachment' => 'Allegato obbligatorio per questo tipo di assenza.',
            ]);
        }

        $puc = isset($validated['sickCertificatePuc']) ? trim((string) $validated['sickCertificatePuc']) : '';
        if ($validated['leaveType'] === 'MALATTIA' && $puc === '') {
            return back()->withErrors([
                'sickCertificatePuc' => 'Inserisci il numero di protocollo (PUC) del certificato.',
            ]);
        }

        $attachmentPath = null;
        $attachmentOriginalName = null;
        $attachmentMime = null;
        $attachmentSize = null;
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentPath = $file->store('private/leave_attachments');
            $attachmentOriginalName = $file->getClientOriginalName();
            $attachmentMime = $file->getClientMimeType();
            $attachmentSize = $file->getSize();
        }

        $leaveRequest = LeaveRequest::create([
            'user_id' => $targetUserId,
            'leave_type_code' => $validated['leaveType'],
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'requested_units' => $requestedUnits,
            'status' => 'PENDING',
            'note_user' => $validated['note'] ?? null,
            'attachment_path' => $attachmentPath,
            'attachment_original_name' => $attachmentOriginalName,
            'attachment_mime' => $attachmentMime,
            'attachment_size' => $attachmentSize,
            'sick_certificate_puc' => $puc !== '' ? $puc : null,
        ]);

        $admins = User::where('role', 'admin')->where('active', true)->get();
        try {
            Notification::send($admins, new LeaveRequestSubmitted($leaveRequest->load('user')));
        } catch (\Throwable $e) {
            logger()->error('LeaveRequestSubmitted notification failed: '.$e->getMessage());
        }

        $warning = $this->checkJobRoleOverlap(
            $targetUserId,
            $validated['startDate'],
            $validated['endDate']
        );

        return redirect()->route('dashboard')
            ->with('status', 'Richiesta inviata con successo.')
            ->with('warning', $warning);
    }

    private function periodOverlapsPendingOrApprovedSickLeave(int $userId, Carbon $start, Carbon $end): bool
    {
        return LeaveRequest::query()
            ->where('user_id', $userId)
            ->where('leave_type_code', 'MALATTIA')
            ->whereIn('status', ['PENDING', 'APPROVED'])
            ->whereDate('start_date', '<=', $end)
            ->whereDate('end_date', '>=', $start)
            ->exists();
    }

    private function checkJobRoleOverlap(int $userId, string $startDate, string $endDate): ?string
    {
        $user = User::find($userId);

        if (! $user || ! $user->job_role) {
            return null;
        }

        $conflict = LeaveRequest::query()
            ->where('status', 'APPROVED')
            ->where('user_id', '!=', $userId)
            ->where('start_date', '<=', $endDate)
            ->where('end_date', '>=', $startDate)
            ->whereHas('user', fn ($q) => $q->where('job_role', $user->job_role)->where('active', true))
            ->with('user')
            ->first();

        if (! $conflict) {
            return null;
        }

        $colName = trim(($conflict->user->first_name ?? '').' '.($conflict->user->last_name ?? ''))
            ?: $conflict->user->email;

        return "un altro {$user->job_role} ({$colName}) è già in ferie nel periodo selezionato.";
    }

    public function cancel(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        if ($leaveRequest->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($leaveRequest->status !== 'PENDING') {
            return back()->with('status', 'Solo le richieste in attesa possono essere annullate.');
        }

        $leaveRequest->update(['status' => 'CANCELLED']);

        return back()->with('status', 'Richiesta annullata.');
    }
}
