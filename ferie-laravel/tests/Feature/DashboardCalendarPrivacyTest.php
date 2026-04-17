<?php

namespace Tests\Feature;

use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\LeaveTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class DashboardCalendarPrivacyTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_dashboard_calendar_lists_only_own_approved_leave(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-15'));

        try {
            $this->seed(LeaveTypeSeeder::class);

            $employeeA = User::factory()->create([
                'role' => 'user',
                'first_name' => 'Alice',
                'last_name' => 'Alpha',
            ]);
            $employeeB = User::factory()->create([
                'role' => 'user',
                'first_name' => 'Bob',
                'last_name' => 'BetaSecret',
            ]);

            LeaveRequest::create([
                'user_id' => $employeeA->id,
                'leave_type_code' => 'MALATTIA',
                'start_date' => '2026-07-02',
                'end_date' => '2026-07-04',
                'requested_units' => 0,
                'status' => 'APPROVED',
            ]);

            LeaveRequest::create([
                'user_id' => $employeeB->id,
                'leave_type_code' => 'MALATTIA',
                'start_date' => '2026-08-01',
                'end_date' => '2026-08-03',
                'requested_units' => 0,
                'status' => 'APPROVED',
            ]);

            $this->actingAs($employeeA)->get(route('dashboard'))
                ->assertOk()
                ->assertInertia(function (AssertableInertia $page) {
                    $page->component('Dashboard')
                        ->has('approvedLeaveCalendar', 1)
                        ->where('approvedLeaveCalendar.0.userFullName', 'Alice Alpha');
                });
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_admin_dashboard_calendar_includes_all_users_approved_leave(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-15'));

        try {
            $this->seed(LeaveTypeSeeder::class);

            $admin = User::factory()->create(['role' => 'admin']);
            $employeeA = User::factory()->create(['role' => 'user', 'first_name' => 'Alice', 'last_name' => 'Alpha']);
            $employeeB = User::factory()->create(['role' => 'user', 'first_name' => 'Bob', 'last_name' => 'Beta']);

            LeaveRequest::create([
                'user_id' => $employeeA->id,
                'leave_type_code' => 'MALATTIA',
                'start_date' => '2026-07-02',
                'end_date' => '2026-07-04',
                'requested_units' => 0,
                'status' => 'APPROVED',
            ]);

            LeaveRequest::create([
                'user_id' => $employeeB->id,
                'leave_type_code' => 'MALATTIA',
                'start_date' => '2026-08-01',
                'end_date' => '2026-08-03',
                'requested_units' => 0,
                'status' => 'APPROVED',
            ]);

            $this->actingAs($admin)->get(route('dashboard'))
                ->assertOk()
                ->assertInertia(function (AssertableInertia $page) {
                    $page->component('Dashboard')
                        ->has('approvedLeaveCalendar', 2);
                });
        } finally {
            Carbon::setTestNow();
        }
    }
}
