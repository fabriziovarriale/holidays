<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveAccrual extends Model
{
    protected $fillable = [
        'user_id',
        'year',
        'total_days',
        'must_use_within_year_days',
        'used_days_at_rollover',
        'carryover_days',
        'carryover_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'total_days' => 'integer',
            'must_use_within_year_days' => 'integer',
            'used_days_at_rollover' => 'integer',
            'carryover_days' => 'integer',
            'carryover_expires_at' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

