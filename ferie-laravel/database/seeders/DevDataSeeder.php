<?php

namespace Database\Seeders;

use App\Models\LeaveAccrual;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DevDataSeeder extends Seeder
{
    public function run(): void
    {
        $year = (int) date('Y');

        $employees = [
            ['first_name' => 'Giulia',   'last_name' => 'Rossi',    'email' => 'giulia@holidays.test',   'job_role' => 'Designer'],
            ['first_name' => 'Marco',    'last_name' => 'Bianchi',  'email' => 'marco@holidays.test',    'job_role' => 'Developer'],
            ['first_name' => 'Sara',     'last_name' => 'Verdi',    'email' => 'sara@holidays.test',     'job_role' => 'PM'],
            ['first_name' => 'Luca',     'last_name' => 'Neri',     'email' => 'luca@holidays.test',     'job_role' => 'Developer'],
            ['first_name' => 'Chiara',   'last_name' => 'Gialli',   'email' => 'chiara@holidays.test',   'job_role' => 'Designer'],
            ['first_name' => 'Alessio',  'last_name' => 'Blu',      'email' => 'alessio@holidays.test',  'job_role' => 'Developer'],
        ];

        $users = [];
        foreach ($employees as $e) {
            $users[] = User::updateOrCreate(
                ['email' => $e['email']],
                [
                    'first_name'        => $e['first_name'],
                    'last_name'         => $e['last_name'],
                    'job_role'          => $e['job_role'],
                    'role'              => 'employee',
                    'password'          => Hash::make('password'),
                    'email_verified_at' => now(),
                    'active'            => true,
                ]
            );
        }

        // Saldo ferie (tabella letta da DashboardController / Admin\UsersController)
        foreach ($users as $u) {
            LeaveBalance::updateOrCreate(
                ['user_id' => $u->id, 'year' => $year],
                ['allocated_days' => 22, 'used_days' => 0]
            );
        }

        // Accruals (tabella parallela per regole di maturazione/carryover,
        // tenuta allineata ai budget annuali)
        foreach ($users as $i => $u) {
            LeaveAccrual::updateOrCreate(
                ['user_id' => $u->id, 'year' => $year],
                [
                    'total_days'                => 22,
                    'must_use_within_year_days' => 22,
                    'used_days_at_rollover'     => 0,
                    'carryover_days'            => $i === 0 ? 5 : 0,
                    'carryover_expires_at'      => $i === 0 ? Carbon::create($year, 6, 30) : null,
                ]
            );
        }

        // Pulisce richieste dev precedenti per questi utenti (idempotente)
        LeaveRequest::whereIn('user_id', collect($users)->pluck('id'))->delete();

        $today = Carbon::today();

        // Casistiche varie
        $this->makeRequest($users[0], 'FERIE',    $today->copy()->subDays(40), 5,  'APPROVED');
        $this->makeRequest($users[0], 'FERIE',    $today->copy()->addDays(20), 7,  'PENDING', noteUser: 'Vacanza estate');
        $this->makeRequest($users[0], 'PERMESSO', $today->copy()->subDays(15), 1,  'APPROVED', noteUser: 'Visita medica');

        $this->makeRequest($users[1], 'FERIE',    $today->copy()->subDays(80), 10, 'APPROVED');
        $this->makeRequest($users[1], 'MALATTIA', $today->copy()->subDays(5),  3,  'APPROVED', noteUser: 'Influenza');
        $this->makeRequest($users[1], 'FERIE',    $today->copy()->addDays(45), 5,  'PENDING');

        $this->makeRequest($users[2], 'FERIE',    $today->copy()->addDays(10), 3,  'PENDING',  noteUser: 'Weekend lungo');
        $this->makeRequest($users[2], 'FERIE',    $today->copy()->subDays(60), 4,  'REJECTED', noteAdmin: 'Troppa sovrapposizione con team');
        $this->makeRequest($users[2], 'PERMESSO', $today->copy()->addDays(3),  1,  'APPROVED');

        $this->makeRequest($users[3], 'FERIE',    $today->copy()->subDays(30), 8,  'APPROVED');
        $this->makeRequest($users[3], 'FERIE',    $today->copy()->addDays(60), 6,  'PENDING',  noteUser: 'Ponte agosto');

        $this->makeRequest($users[4], 'FERIE',    $today->copy()->subDays(90), 2,  'CANCELLED');
        $this->makeRequest($users[4], 'MALATTIA', $today->copy()->subDays(20), 2,  'APPROVED');
        $this->makeRequest($users[4], 'FERIE',    $today->copy()->addDays(15), 4,  'APPROVED');

        $this->makeRequest($users[5], 'FERIE',    $today->copy()->subDays(10), 5,  'APPROVED');
        $this->makeRequest($users[5], 'PERMESSO', $today->copy()->addDays(5),  1,  'PENDING',  noteUser: 'Assemblea scuola figli');
    }

    private function makeRequest(
        User $user,
        string $typeCode,
        Carbon $start,
        int $days,
        string $status,
        ?string $noteUser = null,
        ?string $noteAdmin = null,
    ): void {
        LeaveRequest::create([
            'user_id'         => $user->id,
            'leave_type_code' => $typeCode,
            'start_date'      => $start->toDateString(),
            'end_date'        => $start->copy()->addDays($days - 1)->toDateString(),
            'requested_units' => $days,
            'status'          => $status,
            'note_user'       => $noteUser,
            'note_admin'      => $noteAdmin,
        ]);
    }
}
