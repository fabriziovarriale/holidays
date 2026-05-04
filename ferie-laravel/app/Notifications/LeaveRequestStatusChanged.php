<?php

namespace App\Notifications;

use App\Models\LeaveRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeaveRequestStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly LeaveRequest $leaveRequest) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    private function context(): array
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

        return compact('isApproved', 'typeLabel', 'period', 'units');
    }

    public function toArray(object $notifiable): array
    {
        $req = $this->leaveRequest;
        $ctx = $this->context();
        $statusLabel = $ctx['isApproved'] ? 'approvata' : 'rifiutata';

        return [
            'type'             => 'leave_request_status_changed',
            'leave_request_id' => $req->id,
            'status'           => $req->status,
            'leave_type_code'  => $req->leave_type_code,
            'leave_type_label' => $ctx['typeLabel'],
            'period'           => $ctx['period'],
            'units'            => $ctx['units'],
            'note_admin'       => $req->note_admin,
            'title'            => "Richiesta di {$ctx['typeLabel']} {$statusLabel}",
            'message'          => "{$ctx['period']} · {$ctx['units']}",
            'url'              => '/requests?status=ALL&request='.$req->id,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $req = $this->leaveRequest;
        $ctx = $this->context();
        $isApproved = $ctx['isApproved'];
        $typeLabel = $ctx['typeLabel'];
        $period = $ctx['period'];
        $units = $ctx['units'];

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
