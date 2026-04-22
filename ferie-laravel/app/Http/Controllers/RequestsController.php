<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RequestsController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isAdmin = $user->isAdmin();

        $status = strtoupper((string) $request->query('status', 'ALL'));
        $type = strtoupper((string) $request->query('type', 'ALL'));
        $search = trim((string) $request->query('q', ''));

        $query = LeaveRequest::query()->with(['user', 'leaveType']);

        if (! $isAdmin) {
            $query->where('user_id', $user->id);
        }

        if (in_array($status, ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'], true)) {
            $query->where('status', $status);
        }

        if ($type !== 'ALL' && $type !== '') {
            $query->where('leave_type_code', $type);
        }

        if ($search !== '') {
            $needle = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($needle) {
                $q->whereHas('user', function ($uq) use ($needle) {
                    $uq->where('first_name', 'like', $needle)
                        ->orWhere('last_name', 'like', $needle)
                        ->orWhere('email', 'like', $needle);
                })
                ->orWhere('leave_type_code', 'like', $needle)
                ->orWhere('note_user', 'like', $needle)
                ->orWhere('note_admin', 'like', $needle);
            });
        }

        $requests = $query->orderByDesc('created_at')
            ->limit(500)
            ->get()
            ->map(fn (LeaveRequest $r) => [
                'id' => (string) $r->id,
                'userId' => (string) $r->user_id,
                'userFullName' => $r->user
                    ? trim(($r->user->first_name ?? '').' '.($r->user->last_name ?? '')) ?: ($r->user->email ?? 'Dipendente')
                    : 'Dipendente',
                'userJobRole' => $r->user?->job_role ?? null,
                'userEmail' => $r->user?->email,
                'leaveType' => $r->leave_type_code,
                'leaveTypeLabel' => $r->leaveType?->description ?? $r->leave_type_code,
                'startDate' => $r->start_date?->format('Y-m-d'),
                'endDate' => $r->end_date?->format('Y-m-d'),
                'requestedUnits' => (int) $r->requested_units,
                'status' => $r->status,
                'noteUser' => $r->note_user,
                'noteAdmin' => $r->note_admin,
                'hasAttachment' => (bool) $r->attachment_path,
                'attachmentName' => $r->attachment_original_name,
                'sickCertificatePuc' => $r->sick_certificate_puc,
                'createdAt' => $r->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        $leaveTypes = LeaveType::where('active', true)
            ->orderBy('code')
            ->get()
            ->map(fn ($lt) => [
                'code' => $lt->code,
                'label' => $lt->description,
            ])
            ->values()
            ->all();

        return Inertia::render('Requests', [
            'isAdmin' => $isAdmin,
            'requests' => $requests,
            'leaveTypes' => $leaveTypes,
            'filters' => [
                'status' => $status,
                'type' => $type,
                'q' => $search,
            ],
        ]);
    }
}
