<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeNotification extends Notification
{

    /**
     * @param bool $createdByAdmin  true = account creato da un admin, false = auto-registrazione
     */
    public function __construct(
        public readonly User $user,
        public readonly bool $createdByAdmin = false,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toArray(object $notifiable): array
    {
        $name = trim(($this->user->first_name ?? '').' '.($this->user->last_name ?? ''))
            ?: $this->user->email;

        return [
            'type'    => 'welcome',
            'user_id' => $this->user->id,
            'title'   => "Benvenuto su Ferie MVP, {$name}!",
            'message' => 'Il tuo account è stato creato. Puoi richiedere ferie e consultare il tuo saldo.',
            'url'     => '/dashboard',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $name = trim(($this->user->first_name ?? '').' '.($this->user->last_name ?? ''))
            ?: $this->user->email;

        $mail = (new MailMessage)
            ->subject('Benvenuto su Ferie MVP')
            ->greeting("Ciao {$name}!")
            ->line('Il tuo account sulla piattaforma **Ferie MVP** è stato creato con successo.');

        if ($this->createdByAdmin) {
            $mail->line("Puoi accedere con il tuo indirizzo email **{$this->user->email}** e la password che ti è stata comunicata dall'amministratore.");
        } else {
            $mail->line("Puoi accedere con il tuo indirizzo email **{$this->user->email}**.");
        }

        return $mail
            ->line("Il tuo ruolo è: **{$this->user->job_role}**.")
            ->action('Accedi alla piattaforma', url('/dashboard'))
            ->line('Da qui potrai richiedere ferie, permessi e consultare il tuo saldo.')
            ->salutation('A presto, il team Ferie MVP');
    }
}
