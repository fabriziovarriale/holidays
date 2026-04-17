<?php

namespace Tests\Feature;

use Database\Seeders\LeaveTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Tests\TestCase;

class LeaveRequestPucRequiredTest extends TestCase
{
    use RefreshDatabase;

    public function test_puc_is_required_for_malattia(): void
    {
        $this->seed(LeaveTypeSeeder::class);

        $admin = User::factory()->create(['role' => 'admin']);
        $employee = User::factory()->create(['role' => 'user']);

        $payload = [
            'leaveType' => 'MALATTIA',
            'startDate' => '2026-06-02',
            'endDate' => '2026-06-02',
            'requestedUnits' => '0',
            'note' => '',
        ];

        $this->actingAs($admin)
            ->post(route('leave-request.store'), array_merge($payload, [
                'userId' => (string) $employee->id,
            ]))
            ->assertSessionHasErrors(['sickCertificatePuc']);
    }
}

