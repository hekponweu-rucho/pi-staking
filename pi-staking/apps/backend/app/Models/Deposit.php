<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deposit extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_EXPIRED = 'expired';
    const STATUS_FAILED = 'failed';

    protected $fillable = [
        'user_id',
        'address_id',
        'amount',
        'tx_hash',
        'status',
        'confirmed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:8',
        'confirmed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(DepositAddress::class, 'address_id');
    }
}