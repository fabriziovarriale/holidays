<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveBalance extends Model
{
    /** Giorni di ferie assegnati di default a ogni utente per l'anno. */
    public const DEFAULT_ALLOCATED_DAYS = 26;

    protected $fillable = [
        'user_id',
        'year',
        'allocated_days',
        'used_days',
    ];

    protected function casts(): array
    {
        return [
            'allocated_days' => 'integer',
            'used_days' => 'integer',
            'year' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getTotalAttribute(): int
    {
        return $this->allocated_days;
    }

    public function getRemainingAttribute(): int
    {
        return $this->allocated_days - $this->used_days;
    }
}
