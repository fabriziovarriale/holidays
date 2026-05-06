<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    private const DATASET_COLUMNS = [
        'richieste' => [
            'id'              => 'ID richiesta',
            'dipendente'      => 'Dipendente',
            'email'           => 'Email',
            'ruolo'           => 'Ruolo professionale',
            'tipo'            => 'Tipo assenza',
            'inizio'          => 'Data inizio',
            'fine'            => 'Data fine',
            'unita'           => 'Unità',
            'quantita'        => 'Quantità',
            'stato'           => 'Stato',
            'inviata_il'      => 'Data invio',
            'decisione_il'    => 'Data decisione',
            'nota_dipendente' => 'Nota dipendente',
            'nota_admin'      => 'Nota admin',
            'allegato'        => 'Allegato',
            'nome_allegato'   => 'Nome allegato',
            'puc'             => 'PUC malattia',
        ],
        'saldi' => [
            'dipendente' => 'Dipendente',
            'email'      => 'Email',
            'ruolo'      => 'Ruolo professionale',
            'allocati'   => 'Giorni allocati',
            'usati'      => 'Giorni usati',
            'residui'    => 'Giorni residui',
        ],
        'mensile' => [
            'mese'              => 'Mese',
            'ferie_giorni'      => 'Ferie (giorni)',
            'malattia_giorni'   => 'Malattia (giorni)',
            'permesso_ore'      => 'Permessi (ore)',
            'richieste_totali'  => 'Totale richieste approvate',
        ],
    ];

    public function exportLeaves(Request $request): StreamedResponse
    {
        $dataset = (string) $request->get('dataset', 'richieste');
        if (! isset(self::DATASET_COLUMNS[$dataset])) {
            abort(422, 'Dataset non valido.');
        }

        $year = (int) ($request->get('year') ?? now()->year);
        if ($year < 2020 || $year > 2100) {
            abort(422, 'Anno non valido.');
        }

        $requestedColumns = array_values(array_filter(
            (array) $request->get('columns', []),
            fn ($c) => isset(self::DATASET_COLUMNS[$dataset][$c])
        ));
        if (empty($requestedColumns)) {
            $requestedColumns = array_keys(self::DATASET_COLUMNS[$dataset]);
        }

        $filename = "report_{$dataset}_{$year}.csv";

        return match ($dataset) {
            'saldi'   => $this->streamSaldi($year, $requestedColumns, $filename),
            'mensile' => $this->streamMensile($year, $requestedColumns, $filename),
            default   => $this->streamRichieste(
                $year,
                $requestedColumns,
                array_values((array) $request->get('statuses', [])),
                array_values((array) $request->get('types', [])),
                $filename
            ),
        };
    }

    /**
     * Defuses formula injection (CSV injection / "Excel macro") by prefixing
     * any cell whose first character would make a spreadsheet treat it as a
     * formula. Single quote is the standard "this is text" hint that Excel /
     * Numbers / LibreOffice all honor and strip on display.
     */
    private static function sanitizeCsvCell(string $value): string
    {
        if ($value === '') {
            return $value;
        }

        $first = $value[0];
        if (in_array($first, ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }

    private static function safeFputcsv($file, array $row): void
    {
        fputcsv($file, array_map([self::class, 'sanitizeCsvCell'], $row));
    }

    private function streamRichieste(int $year, array $cols, array $statuses, array $types, string $filename): StreamedResponse
    {
        $headers = array_map(fn ($c) => self::DATASET_COLUMNS['richieste'][$c], $cols);

        return response()->streamDownload(function () use ($year, $cols, $statuses, $types, $headers) {
            $file = fopen('php://output', 'w');
            if ($file === false) {
                return;
            }

            fputcsv($file, $headers);

            LeaveRequest::query()
                ->with(['user', 'leaveType'])
                ->whereYear('start_date', $year)
                ->when(! empty($statuses), fn ($q) => $q->whereIn('status', $statuses))
                ->when(! empty($types), fn ($q) => $q->whereIn('leave_type_code', $types))
                ->orderBy('start_date')
                ->chunk(200, function ($requests) use ($file, $cols) {
                    foreach ($requests as $req) {
                        $row = [];
                        foreach ($cols as $col) {
                            $row[] = $this->richiestaValue($col, $req);
                        }
                        self::safeFputcsv($file, $row);
                    }
                });

            fclose($file);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function richiestaValue(string $col, LeaveRequest $req): string
    {
        return match ($col) {
            'id'         => (string) $req->id,
            'dipendente' => $req->user
                ? (trim(($req->user->first_name ?? '').' '.($req->user->last_name ?? '')) ?: ($req->user->name ?? ''))
                : '',
            'email'           => (string) ($req->user?->email ?? ''),
            'ruolo'           => (string) ($req->user?->job_role ?? ''),
            'tipo'            => (string) ($req->leaveType?->description ?? $req->leave_type_code),
            'inizio'          => (string) $req->start_date?->toDateString(),
            'fine'            => (string) $req->end_date?->toDateString(),
            'unita'           => (string) ($req->leaveType?->unit ?? 'days'),
            'quantita'        => (string) ($req->approved_days ?? $req->requested_units),
            'stato'           => (string) $req->status,
            'inviata_il'      => (string) ($req->created_at?->toDateTimeString() ?? ''),
            'decisione_il'    => (string) (in_array($req->status, ['APPROVED', 'REJECTED', 'CANCELLED'], true)
                ? ($req->updated_at?->toDateTimeString() ?? '')
                : ''),
            'nota_dipendente' => (string) ($req->note_user ?? ''),
            'nota_admin'      => (string) ($req->note_admin ?? ''),
            'allegato'        => $req->attachment_path ? 'sì' : 'no',
            'nome_allegato'   => (string) ($req->attachment_original_name ?? ''),
            'puc'             => (string) ($req->sick_certificate_puc ?? ''),
            default           => '',
        };
    }

    private function streamSaldi(int $year, array $cols, string $filename): StreamedResponse
    {
        $headers = array_map(fn ($c) => self::DATASET_COLUMNS['saldi'][$c], $cols);

        return response()->streamDownload(function () use ($year, $cols, $headers) {
            $file = fopen('php://output', 'w');
            if ($file === false) {
                return;
            }

            fputcsv($file, $headers);

            $users = User::where('active', true)
                ->where('role', '!=', 'admin')
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get();

            $balances = LeaveBalance::whereIn('user_id', $users->pluck('id'))
                ->where('year', $year)
                ->get()
                ->keyBy('user_id');

            $used = LeaveRequest::sumDeductibleApprovedDaysByUserForYear($year);

            foreach ($users as $u) {
                $bal = $balances->get($u->id);
                $allocated = (int) ($bal?->allocated_days ?? 0);
                $usedDays = (int) $used->get($u->id, 0);
                $remaining = max(0, $allocated - $usedDays);

                $row = [];
                foreach ($cols as $col) {
                    $row[] = match ($col) {
                        'dipendente' => trim(($u->first_name ?? '').' '.($u->last_name ?? '')) ?: ($u->name ?? $u->email),
                        'email'      => (string) $u->email,
                        'ruolo'      => (string) ($u->job_role ?? ''),
                        'allocati'   => (string) $allocated,
                        'usati'      => (string) $usedDays,
                        'residui'    => (string) $remaining,
                        default      => '',
                    };
                }
                self::safeFputcsv($file, $row);
            }

            fclose($file);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function streamMensile(int $year, array $cols, string $filename): StreamedResponse
    {
        $headers = array_map(fn ($c) => self::DATASET_COLUMNS['mensile'][$c], $cols);

        $approved = LeaveRequest::with('leaveType')
            ->whereYear('start_date', $year)
            ->where('status', 'APPROVED')
            ->get();

        $monthly = array_fill(0, 12, ['ferie' => 0, 'malattia' => 0, 'permesso_h' => 0, 'tot' => 0]);
        foreach ($approved as $r) {
            $m = (int) $r->start_date->format('n') - 1;
            $qty = (int) ($r->requested_units ?? 0);
            $unit = $r->leaveType?->unit ?? 'days';
            $monthly[$m]['tot']++;

            if ($r->leave_type_code === 'FERIE') {
                $monthly[$m]['ferie'] += $qty;
            } elseif ($r->leave_type_code === 'MALATTIA') {
                $monthly[$m]['malattia'] += $qty;
            } elseif ($r->leave_type_code === 'PERMESSO') {
                $monthly[$m]['permesso_h'] += ($unit === 'hours' ? $qty : $qty * 8);
            }
        }

        return response()->streamDownload(function () use ($year, $cols, $headers, $monthly) {
            $file = fopen('php://output', 'w');
            if ($file === false) {
                return;
            }

            fputcsv($file, $headers);

            for ($m = 0; $m < 12; $m++) {
                $row = [];
                $monthLabel = Carbon::create($year, $m + 1, 1)->locale('it')->isoFormat('MMMM YYYY');
                foreach ($cols as $col) {
                    $row[] = match ($col) {
                        'mese'              => ucfirst($monthLabel),
                        'ferie_giorni'      => (string) $monthly[$m]['ferie'],
                        'malattia_giorni'   => (string) $monthly[$m]['malattia'],
                        'permesso_ore'      => (string) $monthly[$m]['permesso_h'],
                        'richieste_totali'  => (string) $monthly[$m]['tot'],
                        default             => '',
                    };
                }
                self::safeFputcsv($file, $row);
            }

            fclose($file);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
