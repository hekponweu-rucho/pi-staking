<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Deposit extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'address',
        'amount',
        'status',
        'tx_hash',
        'detected_at',
        'confirmed_at',
        'expires_at',
        'provider',
        'metadata',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:8',
        'detected_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'expires_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transaction(): HasOne
    {
        return $this->hasOne(Transaction::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && now()->greaterThan($this->expires_at);
    }

    public static function allowedStatuses(): array
    {
        return ['pending', 'confirmed', 'expired', 'failed'];
    }
}
