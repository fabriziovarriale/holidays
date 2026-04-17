<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\LeaveRequest;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $shared = [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'impersonation' => [
                'active' => false,
                'adminName' => null,
            ],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
                'warning' => fn () => $request->session()->get('warning'),
            ],
        ];

        $impersonatorId = (int) $request->session()->get('impersonator_admin_id', 0);
        if ($impersonatorId > 0) {
            $impersonator = User::find($impersonatorId);
            $shared['impersonation'] = [
                'active' => true,
                'adminName' => $impersonator?->name,
            ];
        }

        if ($user && $user->isAdmin()) {
            $year = (int) ($request->get('year') ?? now()->year);
            $employees = \App\Models\User::where('active', true)
                ->where('role', '!=', 'admin')
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get();
            $shared['adminEmployees'] = $employees->map(fn ($u) => [
                'id' => (string) $u->id,
                'label' => trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? '')) ?: $u->email,
            ])->values()->all();
            $balances = \App\Models\LeaveBalance::whereIn('user_id', $employees->pluck('id'))
                ->where('year', $year)
                ->get()
                ->keyBy('user_id');

            $approvedUsedDaysByUser = LeaveRequest::sumDeductibleApprovedDaysByUserForYear($year);

            $shared['adminEmployeesWithBalances'] = $employees->mapWithKeys(function ($u) use ($balances, $approvedUsedDaysByUser) {
                $allocated = (int) ($balances->get($u->id)?->allocated_days ?? 0);
                $used = (int) $approvedUsedDaysByUser->get($u->id, 0);

                return [
                    (string) $u->id => [
                        'total' => $allocated,
                        'used' => $used,
                        'remaining' => max(0, $allocated - $used),
                    ],
                ];
            })->all();
        } else {
            $shared['adminEmployees'] = [];
            $shared['adminEmployeesWithBalances'] = [];
        }

        return $shared;
    }
}
