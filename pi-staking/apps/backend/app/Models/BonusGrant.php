<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BonusGrant extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'original_amount',
        'remaining_amount',
        'expires_at',
        'is_used',
        'used_at',
        'is_expired',
        'transferable',
        'withdrawable',
        'usage_rules',
        'grant_reason',
        'metadata',
    ];

    protected $casts = [
        'original_amount' => 'decimal:8',
        'remaining_amount' => 'decimal:8',
        'expires_at' => 'datetime',
        'is_used' => 'boolean',
        'used_at' => 'datetime',
        'is_expired' => 'boolean',
        'transferable' => 'boolean',
        'withdrawable' => 'boolean',
        'usage_rules' => 'array',
        'metadata' => 'array',
    ];

    // Relations

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes

    public function scopeAvailable($query)
    {
        return $query->where('is_used', false)
                    ->where('is_expired', false)
                    ->where(function ($q) {
                        $q->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                    });
    }

    // Méthodes utilitaires

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function use(float $amount): bool
    {
        if ($this->remaining_amount < $amount) {
            return false;
        }

        $this->decrement('remaining_amount', $amount);
        
        if ($this->remaining_amount <= 0) {
            $this->update([
                'is_used' => true,
                'used_at' => now(),
            ]);
        }

        return true;
    }
}
