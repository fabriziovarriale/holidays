<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call(LeaveTypeSeeder::class);

        // Idempotente: crea l'admin solo se non esiste già
        User::firstOrCreate(
            ['email' => 'admin@ferie.it'],
            [
                'first_name' => 'Admin',
                'last_name'  => 'Bitboss',
                'password'   => bcrypt('Admin1234!'),
                'role'       => 'admin',
                'job_role'   => 'Socio',
                'active'     => true,
            ]
        );
    }
}
