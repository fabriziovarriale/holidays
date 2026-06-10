<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LeavesController extends Controller
{
    /**
     * GET /api/v1/leaves/approved
     *
     * Restituisce le richieste di ferie/malattia/permesso APPROVATE
     * aggiornate dopo `since`. Pensato per pull periodico dal gestionale
     * (es. cron orario): ad ogni chiamata si passa `since = ultima sync`
     * e si ottengono gli incrementi.
     *
     * Query params:
     *   - since   (ISO-8601, obbligatorio): es. 2026-06-10T09:00:00Z
     *   - until   (ISO-8601, opzionale, default: now): upper bound
     *   - types[] (opzionale): FERIE, MALATTIA, PERMESSO
     *   - limit   (opzionale, default 500, max 1000)
     */
    public function approved(Request $request): JsonResponse
    {
        $data = $request->validate([
            'since'   => ['required', 'date'],
            'until'   => ['nullable', 'date', 'after_or_equal:since'],
            'types'   => ['nullable', 'array'],
            'types.*' => ['in:FERIE,MALATTIA,PERMESSO'],
            'limit'   => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        $since = CarbonImmutable::parse($data['since']);
        $until = isset($data['until']) ? CarbonImmutable::parse($data['until']) : CarbonImmutable::now();

        if ($until->lt($since)) {
            throw ValidationException::withMessages(['until' => 'until must be >= since']);
        }

        $limit = $data['limit'] ?? 500;
        $types = $data['types'] ?? null;

        $query = LeaveRequest::query()
            ->with(['user', 'leaveType'])
            ->where('status', 'APPROVED')
            ->whereBetween('updated_at', [$since, $until])
            ->when($types, fn ($q) => $q->whereIn('leave_type_code', $types))
            ->orderBy('updated_at')
            ->limit($limit);

        $items = $query->get()->map(function (LeaveRequest $r) {
            $u = $r->user;
            $fullName = $u
                ? (trim(($u->first_name ?? '').' '.($u->last_name ?? '')) ?: ($u->email ?? ''))
                : '';

            return [
                'id'              => (string) $r->id,
                'leave_type_code' => $r->leave_type_code,
                'leave_type_label'=> $r->leaveType?->description ?? $r->leave_type_code,
                'unit'            => $r->leaveType?->unit ?? 'days',
                'requested_units' => (int) $r->requested_units,
                'start_date'      => $r->start_date?->toDateString(),
                'end_date'        => $r->end_date?->toDateString(),
                'note_user'       => $r->note_user,
                'note_admin'      => $r->note_admin,
                'sick_certificate_puc' => $r->sick_certificate_puc,
                'has_attachment'  => (bool) $r->attachment_path,
                'approved_at'     => $r->updated_at?->toIso8601String(),
                'created_at'      => $r->created_at?->toIso8601String(),
                'employee' => [
                    'id'         => $u ? (string) $u->id : null,
                    'email'      => $u?->email,
                    'first_name' => $u?->first_name,
                    'last_name'  => $u?->last_name,
                    'full_name'  => $fullName,
                    'job_role'   => $u?->job_role,
                ],
            ];
        })->values();

        // Cursor utile per la prossima chiamata: l'ultimo updated_at
        // restituito. Il client salva questo come "since" per il prossimo poll.
        $nextSince = $items->isEmpty()
            ? $until->toIso8601String()
            : (string) $items->last()['approved_at'];

        return response()->json([
            'data' => $items,
            'meta' => [
                'count'       => $items->count(),
                'since'       => $since->toIso8601String(),
                'until'       => $until->toIso8601String(),
                'next_since'  => $nextSince,
                'limit'       => $limit,
                'types'       => $types,
            ],
        ]);
    }
}
