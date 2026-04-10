<?php

namespace App\Notifications;

use App\Models\LeaveRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeaveRequestSubmitted extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly LeaveRequest $leaveRequest) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $req = $this->leaveRequest;
        $employee = $req->user;
        $name = $employee
            ? trim(($employee->first_name ?? '').' '.($employee->last_name ?? '')) ?: $employee->email
            : 'Dipendente';

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

        $mail = (new MailMessage)
            ->subject("Nuova richiesta di {$typeLabel} da {$name}")
            ->greeting("Ciao!")
            ->line("**{$name}** ha inviato una nuova richiesta di **{$typeLabel}**.")
            ->line("**Periodo:** {$period}")
            ->line("**Durata:** {$units}");

        if ($req->note_user) {
            $mail->line("**Nota:** {$req->note_user}");
        }

        return $mail
            ->action('Gestisci richiesta', url('/dashboard'))
            ->line('Accedi alla dashboard per approvare o rifiutare la richiesta.')
            ->salutation('Il sistema Ferie MVP');
    }
}
