<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepositSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'deposit_address_id',
        'memo',
        'amount_requested',
        'status',
        'confirmations_required',
        'confirmations',
        'credited_amount',
        'tx_hash',
        'expires_at',
        'processed_at',
    ];

    protected $casts = [
        'amount_requested' => 'decimal:8',
        'credited_amount' => 'decimal:8',
        'expires_at' => 'datetime',
        'processed_at' => 'datetime',
        'confirmations_required' => 'integer',
        'confirmations' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function address()
    {
        return $this->belongsTo(DepositAddress::class, 'deposit_address_id');
    }
}
