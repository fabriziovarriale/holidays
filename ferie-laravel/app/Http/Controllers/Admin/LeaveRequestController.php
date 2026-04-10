<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Notifications\LeaveRequestStatusChanged;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LeaveRequestController extends Controller
{
    public function approve(LeaveRequest $leaveRequest): RedirectResponse
    {
        $leaveRequest->load('leaveType');

        if ($leaveRequest->status !== 'PENDING') {
            return back()->with('status', 'Richiesta già elaborata.');
        }

        $leaveRequest->update([
            'status' => 'APPROVED',
            'approved_days' => (string) $leaveRequest->requested_units,
        ]);

        if ($leaveRequest->user) {
            try {
                $leaveRequest->user->notify(new LeaveRequestStatusChanged($leaveRequest));
            } catch (\Throwable $e) {
                logger()->error('LeaveRequestStatusChanged notification failed: '.$e->getMessage());
            }
        }

        return back()->with('status', 'Richiesta approvata.');
    }

    public function revoke(LeaveRequest $leaveRequest): RedirectResponse
    {
        if ($leaveRequest->status !== 'APPROVED') {
            return back()->with('status', 'Solo le richieste approvate possono essere revocate.');
        }

        $leaveRequest->update([
            'status' => 'PENDING',
            'approved_days' => null,
        ]);

        return back()->with('status', 'Approvazione revocata. La richiesta è tornata in attesa.');
    }

    public function destroy(LeaveRequest $leaveRequest): RedirectResponse
    {
        $leaveRequest->delete();

        return back()->with('status', 'Richiesta eliminata.');
    }

    public function reject(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        if ($leaveRequest->status !== 'PENDING') {
            return back()->with('status', 'Richiesta già elaborata.');
        }

        $validated = $request->validate([
            'note_admin' => 'nullable|string|max:1000',
        ]);

        $leaveRequest->update([
            'status' => 'REJECTED',
            'note_admin' => $validated['note_admin'] ?? null,
        ]);

        if ($leaveRequest->user) {
            try {
                $leaveRequest->user->notify(new LeaveRequestStatusChanged($leaveRequest->fresh()));
            } catch (\Throwable $e) {
                logger()->error('LeaveRequestStatusChanged notification failed: '.$e->getMessage());
            }
        }

        return back()->with('status', 'Richiesta rifiutata.');
    }
}
