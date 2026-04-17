<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeaveRequestAttachmentController extends Controller
{
    public function download(Request $request, LeaveRequest $leaveRequest): StreamedResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(401);
        }

        if (! $user->isAdmin() && (int) $leaveRequest->user_id !== (int) $user->id) {
            abort(403);
        }

        if (! $leaveRequest->attachment_path) {
            abort(404);
        }

        $filename = $leaveRequest->attachment_original_name ?: 'allegato';

        return Storage::download($leaveRequest->attachment_path, $filename);
    }
}

