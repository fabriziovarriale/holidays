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

        return Inertia::render('Reports', [
            'year' => $year,
            'stats' => [
                'ferieDays' => $totalFerieDays,
                'malattiaDays' => $totalMalattiaDays,
                'permessoHours' => $totalPermessoHours,
                'approvalRate' => $approvalRate,
                'approvedCount' => $approved->count(),
                'pendingCount' => $pending,
                'rejectedCount' => $rejected,
                'activeEmployees' => $activeEmployees,
            ],
            'monthly' => $months,
            'roleBreakdown' => $roleBreakdown,
        ]);
    }
}
