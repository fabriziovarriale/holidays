<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveType extends Model
{
    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'code',
        'description',
        'deducts_balance',
        'unit',
        'active',
        'requires_attachment',
        'max_consecutive_days',
        'notice_days_required',
        'accrual_rule',
    ];

    protected function casts(): array
    {
        return [
            'deducts_balance' => 'boolean',
            'active' => 'boolean',
            'requires_attachment' => 'boolean',
            'max_consecutive_days' => 'integer',
            'notice_days_required' => 'integer',
        ];
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'leave_type_code', 'code');
    }
}
