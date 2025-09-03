<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
