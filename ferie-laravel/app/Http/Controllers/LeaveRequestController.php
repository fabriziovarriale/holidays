<?php

namespace App\Http\Controllers;

use App\Helpers\WorkingDays;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use App\Notifications\LeaveRequestSubmitted;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class LeaveRequestController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $rules = [
            'leaveType' => 'required|string|in:FERIE,MALATTIA,PERMESSO',
            'startDate' => 'required|date',
            'endDate' => 'required|date|after_or_equal:startDate',
            'requestedUnits' => 'nullable|integer|min:0',
            'note' => 'nullable|string|max:1000',
        ];

        if ($request->user()->isAdmin()) {
            $rules['userId'] = 'required|exists:users,id';
        }

        $validated = $request->validate($rules, [
            'startDate.required' => 'Inserisci data inizio.',
            'startDate.date' => 'Data inizio non valida.',
            'endDate.required' => 'Inserisci data fine.',
            'endDate.date' => 'Data fine non valida.',
            'endDate.after_or_equal' => 'Data fine deve essere ≥ data inizio.',
            'leaveType.required' => 'Seleziona tipo assenza.',
            'leaveType.in' => 'Tipo assenza non valido. Valori ammessi: Ferie, Malattia, Permesso.',
            'requestedUnits.integer' => 'Ore non valide.',
            'requestedUnits.min' => 'Inserisci almeno 1 ora.',
            'note.max' => 'Note troppo lunghe.',
            'userId.required' => 'Seleziona il dipendente.',
            'userId.exists' => 'Dipendente non valido.',
        ]);

        $targetUserId = $request->user()->isAdmin()
            ? (int) $validated['userId']
            : $request->user()->id;

        // Più dipendenti possono avere assenze sugli stessi giorni (nessuna esclusività “globale” sul periodo).

        $leaveType = LeaveType::where('code', $validated['leaveType'])->first();
        if (! $leaveType) {
            return back()->withErrors(['leaveType' => 'Tipo non valido.']);
        }

        $requestedUnits = (int) ($validated['requestedUnits'] ?? 0);

        if ($leaveType->unit === 'days') {
            $days = WorkingDays::between($validated['startDate'], $validated['endDate']);
            $requestedUnits = $days;

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

        $leaveRequest = LeaveRequest::create([
            'user_id' => $targetUserId,
            'leave_type_code' => $validated['leaveType'],
            'start_date' => $validated['startDate'],
            'end_date' => $validated['endDate'],
            'requested_units' => $requestedUnits,
            'status' => 'PENDING',
            'note_user' => $validated['note'] ?? null,
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
