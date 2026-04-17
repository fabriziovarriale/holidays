<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

class LeaveRequest extends Model
{
    protected $fillable = [
        'user_id',
        'leave_type_code',
        'start_date',
        'end_date',
        'requested_units',
        'status',
        'note_user',
        'note_admin',
        'approved_days',
        'attachment_path',
        'attachment_original_name',
        'attachment_mime',
        'attachment_size',
        'sick_certificate_puc',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'requested_units' => 'integer',
            'attachment_size' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_code', 'code');
    }

    /**
     * Somma giorni lavorativi (requested_units) per utente e anno: solo richieste APPROVED
     * con tipologia che scala il budget in giorni (allineato a Admin\LeaveRequestController::approve).
     *
     * @return Collection<int|string, int|float|string>
     */
    public static function sumDeductibleApprovedDaysByUserForYear(int $year): Collection
    {
        return static::query()
            ->selectRaw('leave_requests.user_id, COALESCE(SUM(leave_requests.requested_units), 0) as used_sum')
            ->join('leave_types', 'leave_requests.leave_type_code', '=', 'leave_types.code')
            ->where('leave_requests.status', 'APPROVED')
            ->whereYear('leave_requests.start_date', $year)
            ->where('leave_types.deducts_balance', true)
            ->where('leave_types.unit', 'days')
            ->groupBy('leave_requests.user_id')
            ->pluck('used_sum', 'user_id');
    }
}
