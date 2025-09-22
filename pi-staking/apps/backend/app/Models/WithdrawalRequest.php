<?php

namespace App\Models;

use App\Enums\WithdrawalStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class WithdrawalRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'amount',
        'fee_amount',
        'net_amount',
        'status',
        'destination_address',
        'destination_type',
        'reviewed_at',
        'reviewed_by',
        'processed_at',
        'processed_by',
        'transaction_hash',
        'confirmation_count',
        'is_confirmed',
        'rejection_reason',
        'admin_notes',
        'request_ip',
        'user_agent',
        'security_checks',
            'withdrawal_address',
            'note',
            'requested_at',
    ];

    protected $casts = [
        'amount' => 'decimal:8',
        'fee_amount' => 'decimal:8',
        'net_amount' => 'decimal:8',
        'reviewed_at' => 'datetime',
        'processed_at' => 'datetime',
        'requested_at' => 'datetime',
        'is_confirmed' => 'boolean',
        'security_checks' => 'array',
        'status' => WithdrawalStatus::class,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transaction(): HasOne
    {
        return $this->hasOne(Transaction::class);
    }
}
