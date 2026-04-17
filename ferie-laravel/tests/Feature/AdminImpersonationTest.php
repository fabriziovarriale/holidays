<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminImpersonationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_impersonate_employee(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $employee = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($admin)
            ->post(route('admin.users.impersonate', $employee));

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($employee);
        $this->assertSame($admin->id, session('impersonator_admin_id'));
    }

    public function test_admin_cannot_impersonate_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $otherAdmin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)
            ->post(route('admin.users.impersonate', $otherAdmin));

        $response->assertSessionHasErrors(['impersonate']);
        $this->assertAuthenticatedAs($admin);
    }

    public function test_stop_impersonation_restores_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $employee = User::factory()->create(['role' => 'user']);

        $this->actingAs($employee);
        session(['impersonator_admin_id' => $admin->id]);

        $response = $this->post(route('impersonation.stop'));

        $response->assertRedirect(route('admin.users.index'));
        $this->assertAuthenticatedAs($admin);
        $this->assertNull(session('impersonator_admin_id'));
    }
}

