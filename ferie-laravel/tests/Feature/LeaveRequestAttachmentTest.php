<?php

namespace Tests\Feature;

use App\Models\LeaveRequest;
use App\Models\User;
use Database\Seeders\LeaveTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LeaveRequestAttachmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_download_attachment(): void
    {
        $this->seed(LeaveTypeSeeder::class);

        Storage::fake();

        $user = User::factory()->create();

        Storage::put('private/leave_attachments/test.pdf', 'hello');

        $leaveRequest = LeaveRequest::create([
            'user_id' => $user->id,
            'leave_type_code' => 'MALATTIA',
            'start_date' => '2026-06-02',
            'end_date' => '2026-06-02',
            'requested_units' => 1,
            'status' => 'PENDING',
            'attachment_path' => 'private/leave_attachments/test.pdf',
            'attachment_original_name' => 'certificato.pdf',
            'attachment_mime' => 'application/pdf',
            'attachment_size' => 5,
            'sick_certificate_puc' => 'PUC-TEST-001',
        ]);

        $this->actingAs($user)
            ->get(route('leave-request.attachment', $leaveRequest))
            ->assertOk();
    }

    public function test_other_user_cannot_download_attachment(): void
    {
        $this->seed(LeaveTypeSeeder::class);

        Storage::fake();

        $owner = User::factory()->create();
        $other = User::factory()->create();

        Storage::put('private/leave_attachments/test.pdf', 'hello');

        $leaveRequest = LeaveRequest::create([
            'user_id' => $owner->id,
            'leave_type_code' => 'MALATTIA',
            'start_date' => '2026-06-02',
            'end_date' => '2026-06-02',
            'requested_units' => 1,
            'status' => 'PENDING',
            'attachment_path' => 'private/leave_attachments/test.pdf',
            'sick_certificate_puc' => 'PUC-TEST-001',
        ]);

        $this->actingAs($other)
            ->get(route('leave-request.attachment', $leaveRequest))
            ->assertForbidden();
    }

    public function test_missing_attachment_returns_404(): void
    {
        $this->seed(LeaveTypeSeeder::class);

        $user = User::factory()->create();

        $leaveRequest = LeaveRequest::create([
            'user_id' => $user->id,
            'leave_type_code' => 'MALATTIA',
            'start_date' => '2026-06-02',
            'end_date' => '2026-06-02',
            'requested_units' => 1,
            'status' => 'PENDING',
            'sick_certificate_puc' => 'PUC-TEST-001',
        ]);

        $this->actingAs($user)
            ->get(route('leave-request.attachment', $leaveRequest))
            ->assertNotFound();
    }
}

