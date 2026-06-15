<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $isPermesso = $this->input('leaveType') === 'PERMESSO';

        $rules = [
            'leaveType' => 'required|string|in:FERIE,MALATTIA,PERMESSO',
            'startDate' => 'required|date',
            // Per il PERMESSO il form invia solo `startDate` (giorno del permesso)
            // + startTime/endTime (orario del blocco di assenza). `endDate`
            // viene normalizzato a `startDate` nel controller.
            'endDate' => $isPermesso
                ? 'nullable|date'
                : 'required|date|after_or_equal:startDate',
            'startTime' => $isPermesso
                ? 'required|date_format:H:i'
                : 'nullable',
            'endTime' => $isPermesso
                ? 'required|date_format:H:i|after:startTime'
                : 'nullable',
            // Per PERMESSO le ore vengono calcolate in automatico dal
            // controller come (endTime - startTime), quindi non sono più
            // un input dell'utente. Tengo la regola nullable per non
            // rompere chi inviasse comunque il campo (es. API esterne).
            'requestedUnits' => 'nullable|integer|min:0',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
            'sickCertificatePuc' => 'nullable|string|max:50',
            'note' => 'nullable|string|max:1000',
        ];

        if ($this->user()?->isAdmin()) {
            $rules['userId'] = 'required|exists:users,id';
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'startDate.required' => 'Inserisci data.',
            'startDate.date' => 'Data non valida.',
            'endDate.required' => 'Inserisci data fine.',
            'endDate.date' => 'Data fine non valida.',
            'endDate.after_or_equal' => 'Data fine deve essere ≥ data inizio.',
            'startTime.required' => 'Inserisci l\'orario di inizio.',
            'startTime.date_format' => 'Orario di inizio non valido (formato HH:MM).',
            'endTime.required' => 'Inserisci l\'orario di fine.',
            'endTime.date_format' => 'Orario di fine non valido (formato HH:MM).',
            'endTime.after' => 'L\'orario di fine deve essere dopo l\'orario di inizio.',
            'leaveType.required' => 'Seleziona tipo assenza.',
            'leaveType.in' => 'Tipo assenza non valido. Valori ammessi: Ferie, Malattia, Permesso.',
            'requestedUnits.integer' => 'Ore non valide.',
            'requestedUnits.min' => 'Inserisci almeno 1 ora.',
            'attachment.file' => 'Allegato non valido.',
            'attachment.mimes' => 'Formato allegato non valido. Carica PDF o immagine (JPG/PNG).',
            'attachment.max' => 'Allegato troppo grande (max 2MB).',
            'sickCertificatePuc.max' => 'PUC troppo lungo.',
            'note.max' => 'Note troppo lunghe.',
            'userId.required' => 'Seleziona il dipendente.',
            'userId.exists' => 'Dipendente non valido.',
        ];
    }
}

