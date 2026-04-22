<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(Request $request): Response
    {
        $role = trim((string) $request->query('role', ''));

        $from = Carbon::today();
        $to = Carbon::today()->addDays(60);

        $usersQuery = User::where('active', true)
            ->where('role', '!=', 'admin')
            ->orderBy('last_name')
            ->orderBy('first_name');

        if ($role !== '' && $role !== 'ALL') {
            $usersQuery->where('job_role', $role);
        }

        $users = $usersQuery->get();

        $requests = LeaveRequest::query()
            ->with(['user', 'leaveType'])
            ->where('status', 'APPROVED')
            ->where('start_date', '<=', $to->toDateString())
            ->where('end_date', '>=', $from->toDateString())
            ->when($role !== '' && $role !== 'ALL', fn ($q) => $q->whereHas('user', fn ($uq) => $uq->where('job_role', $role)))
            ->orderBy('start_date')
            ->limit(300)
            ->get();

        $today = Carbon::today();

        $todayOff = $requests
            ->filter(fn (LeaveRequest $r) => $r->start_date <= $today && $r->end_date >= $today)
            ->map(function (LeaveRequest $r) {
                $returnDate = $r->end_date?->copy()->addDay();

                return [
                    'id' => (string) $r->id,
                    'userFullName' => $r->user
                        ? trim(($r->user->first_name ?? '').' '.($r->user->last_name ?? '')) ?: $r->user->email
                        : 'Dipendente',
                    'userJobRole' => $r->user?->job_role,
                    'leaveType' => $r->leave_type_code,
                    'startDate' => $r->start_date?->format('Y-m-d'),
                    'endDate' => $r->end_date?->format('Y-m-d'),
                    'returnsOn' => $returnDate?->format('Y-m-d'),
                ];
            })
            ->values()
            ->all();

        $upcoming = $requests
            ->filter(fn (LeaveRequest $r) => $r->start_date > $today)
            ->map(fn (LeaveRequest $r) => [
                'id' => (string) $r->id,
                'userId' => (string) $r->user_id,
                'userFullName' => $r->user
                    ? trim(($r->user->first_name ?? '').' '.($r->user->last_name ?? '')) ?: $r->user->email
                    : 'Dipendente',
                'userJobRole' => $r->user?->job_role,
                'leaveType' => $r->leave_type_code,
                'startDate' => $r->start_date?->format('Y-m-d'),
                'endDate' => $r->end_date?->format('Y-m-d'),
                'requestedUnits' => (int) $r->requested_units,
            ])
            ->values()
            ->all();

        $teamList = $users->map(fn (User $u) => [
            'id' => (string) $u->id,
            'firstName' => $u->first_name ?? '',
            'lastName' => $u->last_name ?? '',
            'fullName' => trim(($u->first_name ?? '').' '.($u->last_name ?? '')) ?: $u->email,
            'email' => $u->email,
            'jobRole' => $u->job_role,
            'onLeaveToday' => $requests->contains(
                fn (LeaveRequest $r) => $r->user_id === $u->id
                    && $r->start_date <= $today && $r->end_date >= $today
            ),
        ])->values()->all();

        $roles = User::where('active', true)
            ->where('role', '!=', 'admin')
            ->whereNotNull('job_role')
            ->pluck('job_role')
            ->unique()
            ->values()
            ->all();

        return Inertia::render('Team', [
            'team' => $teamList,
            'todayOff' => $todayOff,
            'upcoming' => $upcoming,
            'windowFrom' => $from->toDateString(),
            'windowTo' => $to->toDateString(),
            'roles' => $roles,
            'filters' => [
                'role' => $role,
            ],
        ]);
    }
}
