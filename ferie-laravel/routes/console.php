<?php

use App\Helpers\ItalianNationalHolidays;
use App\Models\LeaveAccrual;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('holidays:seed-it {--year=} {--from=} {--to=} {--dry-run}', function () {
    $singleYear = $this->option('year');
    $from = $this->option('from');
    $to = $this->option('to');
    $dryRun = (bool) $this->option('dry-run');

    if ($singleYear !== null && ($from !== null || $to !== null)) {
        $this->error('Usa --year oppure --from/--to, non insieme.');
        return self::FAILURE;
    }

    if ($singleYear !== null) {
        $fromYear = (int) $singleYear;
        $toYear = (int) $singleYear;
    } else {
        $fromYear = $from !== null ? (int) $from : (int) now()->year;
        $toYear = $to !== null ? (int) $to : $fromYear;
    }

    if ($fromYear < 1900 || $toYear > 2100 || $fromYear > $toYear) {
        $this->error('Intervallo anni non valido. Usa valori tra 1900 e 2100.');
        return self::FAILURE;
    }

    $rows = [];
    for ($year = $fromYear; $year <= $toYear; $year++) {
        foreach (ItalianNationalHolidays::forYear($year) as $holiday) {
            $rows[] = [
                'date' => $holiday['date'],
                'description' => $holiday['description'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
    }

    $total = count($rows);
    if ($total === 0) {
        $this->warn('Nessuna festività da elaborare.');
        return self::SUCCESS;
    }

    if ($dryRun) {
        $this->info("Dry-run: verrebbero elaborate {$total} festività ({$fromYear}-{$toYear}).");
        return self::SUCCESS;
    }

    $inserted = DB::table('company_holidays')->insertOrIgnore($rows);
    $skipped = $total - $inserted;

    $this->info("Completato: {$inserted} aggiunte, {$skipped} già presenti ({$fromYear}-{$toYear}).");
    return self::SUCCESS;
})->purpose('Pre-carica festività nazionali italiane su uno o più anni');

Artisan::command('leaves:rollover {--year=} {--dry-run}', function () {
    $yearOpt = $this->option('year');
    $year = $yearOpt !== null ? (int) $yearOpt : (int) now()->subYear()->year;
    $dryRun = (bool) $this->option('dry-run');

    if ($year < 2020 || $year > 2100) {
        $this->error('Anno non valido. Usa valori tra 2020 e 2100.');
        return self::FAILURE;
    }

    $policyTotalDaysDefault = 20;
    $policyMustUseWithinYearDays = 10;
    $carryoverExpiresAt = Carbon::create($year, 12, 31)->addMonthsNoOverflow(18)->toDateString();

    $users = User::query()
        ->where('active', true)
        ->where('role', '!=', 'admin')
        ->get();

    $usedByUser = LeaveRequest::sumDeductibleApprovedDaysByUserForYear($year);

    $rows = [];
    $mandatoryMisses = 0;
    foreach ($users as $u) {
        $balance = LeaveBalance::where('user_id', $u->id)->where('year', $year)->first();
        $total = (int) ($balance?->allocated_days ?? $policyTotalDaysDefault);

        $mustUse = min($policyMustUseWithinYearDays, $total);
        $used = (int) $usedByUser->get($u->id, 0);

        $mandatoryNotUsed = max(0, $mustUse - $used);
        if ($mandatoryNotUsed > 0) {
            $mandatoryMisses++;
        }

        $carryover = max(0, $total - max($used, $mustUse));

        $rows[] = [
            'user_id' => $u->id,
            'year' => $year,
            'total_days' => $total,
            'must_use_within_year_days' => $mustUse,
            'used_days_at_rollover' => $used,
            'carryover_days' => $carryover,
            'carryover_expires_at' => $carryover > 0 ? $carryoverExpiresAt : null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    $count = count($rows);
    if ($count === 0) {
        $this->warn('Nessun utente da processare.');
        return self::SUCCESS;
    }

    $this->info("Rollover anno {$year}: {$count} utenti, carryover scade il {$carryoverExpiresAt} (policy default).");
    if ($mandatoryMisses > 0) {
        $this->warn("Attenzione: {$mandatoryMisses} utenti non hanno fruito della quota minima ({$policyMustUseWithinYearDays} giorni).");
    }

    if ($dryRun) {
        $this->info('Dry-run: nessuna scrittura su database.');
        return self::SUCCESS;
    }

    foreach ($rows as $row) {
        LeaveAccrual::updateOrCreate(
            ['user_id' => $row['user_id'], 'year' => $row['year']],
            [
                'total_days' => $row['total_days'],
                'must_use_within_year_days' => $row['must_use_within_year_days'],
                'used_days_at_rollover' => $row['used_days_at_rollover'],
                'carryover_days' => $row['carryover_days'],
                'carryover_expires_at' => $row['carryover_expires_at'],
            ]
        );
    }

    $this->info('Completato: leave_accruals aggiornato.');
    return self::SUCCESS;
})->purpose('Calcola carry-over ferie e scadenza 18 mesi (policy default)');
