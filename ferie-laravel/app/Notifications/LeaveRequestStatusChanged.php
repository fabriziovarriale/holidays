<?php

namespace App\Notifications;

use App\Models\LeaveRequest;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeaveRequestStatusChanged extends Notification
{

    public function __construct(public readonly LeaveRequest $leaveRequest) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $req = $this->leaveRequest;
        $isApproved = $req->status === 'APPROVED';

        $typeLabel = match ($req->leave_type_code) {
            'FERIE'    => 'Ferie',
            'MALATTIA' => 'Malattia',
            'PERMESSO' => 'Permesso',
            default    => $req->leave_type_code,
        };

        $startFmt = $req->start_date->format('d/m/Y');
        $endFmt   = $req->end_date->format('d/m/Y');
        $isSameDay = $startFmt === $endFmt;
        $period = $isSameDay ? $startFmt : "{$startFmt} — {$endFmt}";

        $units = $req->leave_type_code === 'PERMESSO'
            ? "{$req->requested_units} ore"
            : "{$req->requested_units} ".($req->requested_units === 1 ? 'giorno' : 'giorni');

        $statusLabel = $isApproved ? 'approvata ✓' : 'rifiutata ✗';
        $subject = $isApproved
            ? "La tua richiesta di {$typeLabel} è stata approvata"
            : "La tua richiesta di {$typeLabel} è stata rifiutata";

        $mail = (new MailMessage)
            ->subject($subject)
            ->greeting("Ciao!")
            ->line("La tua richiesta di **{$typeLabel}** è stata **{$statusLabel}**.")
            ->line("**Periodo:** {$period}")
            ->line("**Durata:** {$units}");

        if (! $isApproved && $req->note_admin) {
            $mail->line("**Motivazione:** {$req->note_admin}");
        }

        return $mail
            ->action('Vai alla dashboard', url('/dashboard'))
            ->line('Accedi per consultare il tuo saldo e lo storico delle richieste.')
            ->salutation('Il sistema Ferie MVP');
    }
}
