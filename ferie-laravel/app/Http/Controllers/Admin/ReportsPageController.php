<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportsPageController extends Controller
{
    public function index(Request $request): Response
    {
        $year = (int) ($request->get('year') ?? now()->year);
        if ($year < 2020 || $year > 2100) {
            $year = (int) now()->year;
        }

        $approved = LeaveRequest::query()
            ->with(['leaveType', 'user'])
            ->whereYear('start_date', $year)
            ->where('status', 'APPROVED')
            ->get();

        $pending = LeaveRequest::where('status', 'PENDING')
            ->whereYear('start_date', $year)
            ->count();

        $rejected = LeaveRequest::where('status', 'REJECTED')
            ->whereYear('start_date', $year)
            ->count();

        $totalDecided = $approved->count() + $rejected;
        $approvalRate = $totalDecided > 0 ? round(($approved->count() / $totalDecided) * 100) : null;

        $totalFerieDays = 0;
        $totalMalattiaDays = 0;
        $totalPermessoHours = 0;

        $monthly = array_fill(0, 12, ['ferie' => 0, 'malattia' => 0, 'permesso' => 0]);

        $byRole = [];

        foreach ($approved as $r) {
            $month = (int) $r->start_date->format('n') - 1;
            $unit = $r->leaveType?->unit ?? 'days';
            $qty = (int) ($r->requested_units ?? 0);

            if ($r->leave_type_code === 'FERIE') {
                $totalFerieDays += $qty;
                $monthly[$month]['ferie'] += $qty;

                $role = $r->user?->job_role ?: 'Altro';
                if (! isset($byRole[$role])) {
                    $byRole[$role] = 0;
                }
                $byRole[$role] += $qty;
            } elseif ($r->leave_type_code === 'MALATTIA') {
                $totalMalattiaDays += $qty;
                $monthly[$month]['malattia'] += $qty;
            } elseif ($r->leave_type_code === 'PERMESSO') {
                if ($unit === 'hours') {
                    $totalPermessoHours += $qty;
                } else {
                    $totalPermessoHours += $qty * 8;
                }
                $monthly[$month]['permesso'] += $qty;
            }
        }

        $months = collect(range(0, 11))->map(fn ($m) => [
            'index' => $m,
            'label' => mb_strtolower(
                \Illuminate\Support\Carbon::create($year, $m + 1, 1)->locale('it')->shortMonthName
            ),
            'ferie' => $monthly[$m]['ferie'],
            'malattia' => $monthly[$m]['malattia'],
            'permesso' => $monthly[$m]['permesso'],
        ])->values()->all();

        $roleBreakdown = collect($byRole)
            ->map(fn ($days, $role) => ['role' => $role, 'days' => $days])
            ->sortByDesc('days')
            ->values()
            ->all();

        $activeEmployees = User::where('active', true)
            ->where('role', '!=', 'admin')
            ->count();

        $activity = LeaveRequest::query()
            ->with(['user', 'leaveType'])
            ->whereIn('status', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])
            ->orderByDesc('updated_at')
            ->limit(12)
            ->get()
            ->map(function (LeaveRequest $r) {
                $name = $r->user
                    ? trim(($r->user->first_name ?? '').' '.($r->user->last_name ?? '')) ?: ($r->user->email ?? 'Dipendente')
                    : 'Dipendente';
                $typeLabel = $r->leaveType?->description ?? $r->leave_type_code;
                $qty = (int) $r->requested_units;
                $unit = $r->leaveType?->unit === 'hours' ? 'h' : 'g';

                $kind = match ($r->status) {
                    'APPROVED' => 'approved',
                    'REJECTED' => 'rejected',
                    'CANCELLED' => 'cancelled',
                    default => 'pending',
                };

                $verb = match ($kind) {
                    'approved' => 'ha avuto approvata',
                    'rejected' => 'ha avuto rifiutata',
                    'cancelled' => 'ha annullato',
                    default => 'ha richiesto',
                };

                $text = "{$name} {$verb} {$qty}{$unit} di {$typeLabel}";

                return [
                    'id' => (string) $r->id,
                    'kind' => $kind,
                    'text' => $text,
                    'at' => ($r->updated_at ?? $r->created_at)?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Reports', [
            'year' => $year,
            'stats' => [
                'approvedCount' => $approved->count(),
                'pendingCount' => $pending,
                'rejectedCount' => $rejected,
                'ferieDays' => $totalFerieDays,
                'malattiaDays' => $totalMalattiaDays,
                'permessoHours' => $totalPermessoHours,
                'approvalRate' => $approvalRate,
                'activeEmployees' => $activeEmployees,
            ],
            'monthly' => $months,
            'roleBreakdown' => $roleBreakdown,
            'activity' => $activity,
        ]);
    }
}
