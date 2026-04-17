<?php

namespace Tests\Feature;

use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\LeaveTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveRequestSickOverlapTest extends TestCase
{
    use RefreshDatabase;

    private function seedFerieBalance(User $user, int $year = 2026): void
    {
        LeaveBalance::create([
            'user_id' => $user->id,
            'year' => $year,
            'allocated_days' => 25,
            'used_days' => 0,
        ]);
    }

    public function test_ferie_cannot_overlap_pending_or_approved_malattia(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-01-10'));

        try {
            $this->seed(LeaveTypeSeeder::class);

            $employee = User::factory()->create(['role' => 'user']);
            $this->seedFerieBalance($employee);

            LeaveRequest::create([
                'user_id' => $employee->id,
                'leave_type_code' => 'MALATTIA',
                'start_date' => '2026-06-02',
                'end_date' => '2026-06-06',
                'requested_units' => 0,
                'status' => 'APPROVED',
            ]);

            $this->actingAs($employee)->post(route('leave-request.store'), [
                'leaveType' => 'FERIE',
                'startDate' => '2026-06-04',
                'endDate' => '2026-06-04',
                'requestedUnits' => '0',
                'note' => '',
            ])->assertSessionHasErrors(['startDate']);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_permesso_cannot_overlap_malattia(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-01-10'));

        try {
            $this->seed(LeaveTypeSeeder::class);

            $employee = User::factory()->create(['role' => 'user']);

            LeaveRequest::create([
                'user_id' => $employee->id,
                'leave_type_code' => 'MALATTIA',
                'start_date' => '2026-06-10',
                'end_date' => '2026-06-10',
                'requested_units' => 0,
                'status' => 'PENDING',
            ]);

            $this->actingAs($employee)->post(route('leave-request.store'), [
                'leaveType' => 'PERMESSO',
                'startDate' => '2026-06-10',
                'endDate' => '2026-06-10',
                'requestedUnits' => '2',
                'note' => '',
            ])->assertSessionHasErrors(['startDate']);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_ferie_allowed_when_malattia_is_rejected(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-01-10'));

        try {
            $this->seed(LeaveTypeSeeder::class);

            $employee = User::factory()->create(['role' => 'user']);
            $this->seedFerieBalance($employee);

            LeaveRequest::create([
                'user_id' => $employee->id,
                'leave_type_code' => 'MALATTIA',
                'start_date' => '2026-06-04',
                'end_date' => '2026-06-04',
                'requested_units' => 0,
                'status' => 'REJECTED',
            ]);

            $this->actingAs($employee)->post(route('leave-request.store'), [
                'leaveType' => 'FERIE',
                'startDate' => '2026-06-04',
                'endDate' => '2026-06-04',
                'requestedUnits' => '0',
                'note' => '',
            ])->assertSessionHasNoErrors();
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_malattia_can_overlap_existing_ferie_period(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-01-10'));

        try {
            $this->seed(LeaveTypeSeeder::class);

            $employee = User::factory()->create(['role' => 'user']);
            $this->seedFerieBalance($employee);

            LeaveRequest::create([
                'user_id' => $employee->id,
                'leave_type_code' => 'FERIE',
                'start_date' => '2026-06-02',
                'end_date' => '2026-06-06',
                'requested_units' => 5,
                'status' => 'PENDING',
            ]);

            $this->actingAs($employee)->post(route('leave-request.store'), [
                'leaveType' => 'MALATTIA',
                'startDate' => '2026-06-04',
                'endDate' => '2026-06-04',
                'requestedUnits' => '0',
                'sickCertificatePuc' => 'PUC-999',
                'note' => '',
            ])->assertSessionHasNoErrors();
        } finally {
            Carbon::setTestNow();
        }
    }
}
