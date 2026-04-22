<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(LeaveTypeSeeder::class);

        if (! User::where('email', 'admin@ferie.it')->exists()) {
            User::create([
                'name'       => 'Admin Bitboss',
                'first_name' => 'Admin',
                'last_name'  => 'Bitboss',
                'email'      => 'admin@ferie.it',
                'password'   => Hash::make('Bitboss123!'),
                'role'       => 'admin',
                'job_role'   => 'Socio',
                'active'     => true,
            ]);
        }

        // Demo data (6 dipendenti + saldo 2026 + 16 richieste esempio).
        // Attenzione: DevDataSeeder cancella e ricrea le richieste dei 6
        // utenti seed (giulia@, marco@, sara@, luca@, chiara@, alessio@)
        // a ogni esecuzione. I dati di altri utenti non vengono toccati.
        $this->call(DevDataSeeder::class);
    }
}
