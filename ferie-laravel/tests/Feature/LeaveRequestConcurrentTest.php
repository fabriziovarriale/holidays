<?php

namespace Tests\Feature;

use App\Models\LeaveRequest;
use App\Models\User;
use Database\Seeders\LeaveTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveRequestConcurrentTest extends TestCase
{
    use RefreshDatabase;

    public function test_two_employees_may_have_overlapping_leave_on_same_dates(): void
    {
        $this->seed(LeaveTypeSeeder::class);

        $admin = User::factory()->create(['role' => 'admin']);
        $employeeA = User::factory()->create(['role' => 'user']);
        $employeeB = User::factory()->create(['role' => 'user']);

        $payload = [
            'leaveType' => 'MALATTIA',
            'startDate' => '2026-06-02',
            'endDate' => '2026-06-04',
            'requestedUnits' => '0',
            'sickCertificatePuc' => 'PUC-TEST-001',
            'note' => '',
        ];

        $this->actingAs($admin)->post(route('leave-request.store'), array_merge($payload, [
            'userId' => (string) $employeeA->id,
        ]))->assertSessionHasNoErrors()->assertRedirect(route('dashboard'));

        $this->actingAs($admin)->post(route('leave-request.store'), array_merge($payload, [
            'userId' => (string) $employeeB->id,
        ]))->assertSessionHasNoErrors()->assertRedirect(route('dashboard'));

        $this->assertSame(2, LeaveRequest::count());
        $this->assertSame(1, LeaveRequest::where('user_id', $employeeA->id)->count());
        $this->assertSame(1, LeaveRequest::where('user_id', $employeeB->id)->count());
    }
}
