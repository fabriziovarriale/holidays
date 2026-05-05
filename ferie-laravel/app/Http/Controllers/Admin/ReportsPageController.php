<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\WorkingDays;
use App\Http\Controllers\Controller;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;
use Carbon\Carbon;
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

        foreach ($approved as $r) {
            $month = (int) $r->start_date->format('n') - 1;
            $unit = $r->leaveType?->unit ?? 'days';
            $qty = (int) ($r->requested_units ?? 0);

            if ($r->leave_type_code === 'FERIE') {
                $totalFerieDays += $qty;
                $monthly[$month]['ferie'] += $qty;
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

        $activeEmployeesCollection = User::where('active', true)
            ->where('role', '!=', 'admin')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();
        $activeEmployees = $activeEmployeesCollection->count();

        $today = now()->startOfDay();
        $absenceRate = [
            'daily'   => $this->computeAbsenceRate($today, $today, $activeEmployees),
            'weekly'  => $this->computeAbsenceRate(now()->startOfWeek(), now()->endOfWeek(), $activeEmployees),
            'monthly' => $this->computeAbsenceRate(now()->startOfMonth(), now()->endOfMonth(), $activeEmployees),
        ];

        $outToday = LeaveRequest::query()
            ->where('status', 'APPROVED')
            ->whereIn('leave_type_code', ['FERIE', 'MALATTIA'])
            ->where('start_date', '<=', $today->toDateString())
            ->where('end_date',   '>=', $today->toDateString())
            ->distinct('user_id')
            ->count('user_id');
        $inOfficeToday = max(0, $activeEmployees - $outToday);

        $balances = LeaveBalance::whereIn('user_id', $activeEmployeesCollection->pluck('id'))
            ->where('year', $year)
            ->get()
            ->keyBy('user_id');
        $usedByUser = LeaveRequest::sumDeductibleApprovedDaysByUserForYear($year);

        $remainingByEmployee = $activeEmployeesCollection
            ->map(function (User $u) use ($balances, $usedByUser) {
                $allocated = (int) ($balances->get($u->id)?->allocated_days ?? 0);
                $used      = (int) $usedByUser->get($u->id, 0);
                return [
                    'id'        => (string) $u->id,
                    'name'      => trim(($u->first_name ?? '').' '.($u->last_name ?? '')) ?: ($u->email ?? 'Dipendente'),
                    'role'      => $u->job_role ?: '—',
                    'allocated' => $allocated,
                    'used'      => $used,
                    'remaining' => max(0, $allocated - $used),
                ];
            })
            ->sortBy('remaining')
            ->values()
            ->all();

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

        $leaveTypesForExport = LeaveType::where('active', true)
            ->orderBy('code')
            ->get()
            ->map(fn ($lt) => [
                'value' => $lt->code,
                'label' => $lt->description,
            ])
            ->values()
            ->all();

        return Inertia::render('Reports', [
            'year' => $year,
            'leaveTypesForExport' => $leaveTypesForExport,
            'stats' => [
                'approvedCount' => $approved->count(),
                'pendingCount' => $pending,
                'rejectedCount' => $rejected,
                'ferieDays' => $totalFerieDays,
                'malattiaDays' => $totalMalattiaDays,
                'permessoHours' => $totalPermessoHours,
                'approvalRate' => $approvalRate,
                'activeEmployees' => $activeEmployees,
                'inOfficeToday' => $inOfficeToday,
                'outToday' => $outToday,
            ],
            'monthly' => $months,
            'absenceRate' => $absenceRate,
            'remainingByEmployee' => $remainingByEmployee,
            'activity' => $activity,
        ]);
    }

    private function computeAbsenceRate(Carbon $from, Carbon $to, int $activeEmployees): array
    {
        if ($activeEmployees === 0) {
            return ['rate' => 0.0, 'absentDays' => 0, 'totalDays' => 0];
        }

        $from = $from->copy()->startOfDay();
        $to   = $to->copy()->startOfDay();

        $workingDaysInPeriod = WorkingDays::between($from->toDateString(), $to->toDateString());
        $totalDays = $activeEmployees * $workingDaysInPeriod;

        if ($totalDays === 0) {
            return ['rate' => 0.0, 'absentDays' => 0, 'totalDays' => 0];
        }

        $requests = LeaveRequest::query()
            ->where('status', 'APPROVED')
            ->whereIn('leave_type_code', ['FERIE', 'MALATTIA'])
            ->where('start_date', '<=', $to->toDateString())
            ->where('end_date',   '>=', $from->toDateString())
            ->get(['user_id', 'start_date', 'end_date']);

        $absentDays = 0;
        foreach ($requests as $r) {
            $start = $r->start_date->lt($from) ? $from : $r->start_date->copy()->startOfDay();
            $end   = $r->end_date->gt($to)     ? $to   : $r->end_date->copy()->startOfDay();
            $absentDays += WorkingDays::between($start->toDateString(), $end->toDateString());
        }

        $rate = ($absentDays / $totalDays) * 100;

        return [
            'rate'       => round($rate, 1),
            'absentDays' => $absentDays,
            'totalDays'  => $totalDays,
        ];
    }
}
