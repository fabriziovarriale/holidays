<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function exportLeaves(Request $request): StreamedResponse
    {
        $year = (int) ($request->get('year') ?? now()->year);
        if ($year < 2020 || $year > 2100) {
            abort(422, 'Anno non valido.');
        }

        $filename = "report_ferie_{$year}.csv";

        return response()->streamDownload(function () use ($year) {
            $file = fopen('php://output', 'w');
            if ($file === false) {
                return;
            }

            fputcsv($file, [
                'Dipendente',
                'Email',
                'Tipo',
                'Dal',
                'Al',
                'Unita',
                'Quantita',
                'Stato',
                'Allegato',
                'PUC',
            ]);

            LeaveRequest::query()
                ->with(['user', 'leaveType'])
                ->whereYear('start_date', $year)
                ->orderBy('start_date')
                ->chunk(200, function ($requests) use ($file) {
                    foreach ($requests as $req) {
                        $fullName = $req->user
                            ? trim(($req->user->first_name ?? '').' '.($req->user->last_name ?? '')) ?: ($req->user->name ?? '')
                            : '';
                        $email = $req->user?->email ?? '';

                        $unit = $req->leaveType?->unit ?? 'days';
                        $qty = $req->approved_days ?? $req->requested_units;

                        fputcsv($file, [
                            $fullName,
                            $email,
                            $req->leaveType?->description ?? $req->leave_type_code,
                            $req->start_date?->toDateString(),
                            $req->end_date?->toDateString(),
                            $unit,
                            $qty,
                            $req->status,
                            $req->attachment_path ? 'sì' : 'no',
                            $req->sick_certificate_puc ?? '',
                        ]);
                    }
                });

            fclose($file);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}

