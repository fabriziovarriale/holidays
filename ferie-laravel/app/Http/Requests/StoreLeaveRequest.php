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
        $rules = [
            'leaveType' => 'required|string|in:FERIE,MALATTIA,PERMESSO',
            'startDate' => 'required|date',
            'endDate' => 'required|date|after_or_equal:startDate',
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
            'startDate.required' => 'Inserisci data inizio.',
            'startDate.date' => 'Data inizio non valida.',
            'endDate.required' => 'Inserisci data fine.',
            'endDate.date' => 'Data fine non valida.',
            'endDate.after_or_equal' => 'Data fine deve essere ≥ data inizio.',
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

