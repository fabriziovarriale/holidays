<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class IssueApiToken extends Command
{
    protected $signature = 'api:issue-token
        {name : Etichetta umana del token (es. "gestionale-prod")}
        {--user= : Email di un utente esistente a cui legare il token. Se omesso, viene creato/usato un service account dedicato.}
        {--service-account=api@holidays.app : Email del service account dedicato (usato quando --user non è fornito)}';

    protected $description = 'Emette un Sanctum personal access token per un client API (es. il gestionale).';

    public function handle(): int
    {
        $name = (string) $this->argument('name');

        if ($userEmail = $this->option('user')) {
            $user = User::where('email', $userEmail)->first();
            if (! $user) {
                $this->error("Utente {$userEmail} non trovato.");
                return self::FAILURE;
            }
        } else {
            $svcEmail = (string) $this->option('service-account');
            $user = User::firstWhere('email', $svcEmail);
            if (! $user) {
                $user = User::create([
                    'name'       => 'API Service',
                    'first_name' => 'API',
                    'last_name'  => 'Service',
                    'email'      => $svcEmail,
                    'password'   => Hash::make(Str::random(40)),
                    'job_role'   => 'Service',
                ]);
                // Service account: ruolo dedicato, attivo. Non è admin.
                $user->role = 'service';
                $user->active = true;
                $user->save();
                $this->info("Service account creato: {$svcEmail}");
            }
        }

        // Revoke eventuali token con lo stesso nome per evitare duplicati.
        $user->tokens()->where('name', $name)->delete();

        $plain = $user->createToken($name)->plainTextToken;

        $this->newLine();
        $this->info('Token emesso. Copialo SUBITO, non potrai più rivederlo.');
        $this->line('');
        $this->line($plain);
        $this->line('');
        $this->comment("Utente: {$user->email}");
        $this->comment("Label : {$name}");
        $this->comment("Usalo come: Authorization: Bearer <token>");

        return self::SUCCESS;
    }
}
