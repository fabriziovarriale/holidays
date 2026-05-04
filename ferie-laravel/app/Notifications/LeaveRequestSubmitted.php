<?php

namespace App\Notifications;

use App\Models\LeaveRequest;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LeaveRequestSubmitted extends Notification
{

    public function __construct(public readonly LeaveRequest $leaveRequest) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    private function context(): array
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

        return compact('name', 'typeLabel', 'period', 'units');
    }

    public function toArray(object $notifiable): array
    {
        $req = $this->leaveRequest;
        $ctx = $this->context();

        return [
            'type'             => 'leave_request_submitted',
            'leave_request_id' => $req->id,
            'employee_name'    => $ctx['name'],
            'leave_type_code'  => $req->leave_type_code,
            'leave_type_label' => $ctx['typeLabel'],
            'period'           => $ctx['period'],
            'units'            => $ctx['units'],
            'title'            => "Nuova richiesta di {$ctx['typeLabel']} da {$ctx['name']}",
            'message'          => "{$ctx['period']} · {$ctx['units']}",
            'url'              => '/requests?status=ALL&request='.$req->id,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $req = $this->leaveRequest;
        $ctx = $this->context();
        $name = $ctx['name'];
        $typeLabel = $ctx['typeLabel'];
        $period = $ctx['period'];
        $units = $ctx['units'];

        $mail = (new MailMessage)
            ->subject("Nuova richiesta di {$typeLabel} da {$name}")
            ->greeting("Ciao!")
            ->line("**{$name}** ha inviato una nuova richiesta di **{$typeLabel}**.")
            ->line("**Periodo:** {$period}")
            ->line("**Durata:** {$units}");

        if ($req->leave_type_code === 'MALATTIA' && $req->sick_certificate_puc) {
            $mail->line("**PUC certificato:** {$req->sick_certificate_puc}");
        }

        if ($req->note_user) {
            $mail->line("**Nota:** {$req->note_user}");
        }

        return $mail
            ->action('Gestisci richiesta', url('/dashboard'))
            ->line('Accedi alla dashboard per approvare o rifiutare la richiesta.')
            ->salutation('Il sistema Ferie MVP');
    }
}
