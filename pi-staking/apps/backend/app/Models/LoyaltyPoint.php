<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyPoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'points_earned',
        'points_spent',
        'points_balance',
        'description',
        'investment_id',
        'claim_id',
        'referral_id',
        'metadata',
    ];

    protected $casts = [
        'points_earned' => 'integer',
        'points_spent' => 'integer',
        'points_balance' => 'integer',
        'metadata' => 'array',
    ];

    // Relations

    /**
     * Utilisateur propriétaire des points
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Investissement lié (optionnel)
     */
    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class);
    }

    /**
     * Claim lié (optionnel)
     */
    public function claim(): BelongsTo
    {
        return $this->belongsTo(Claim::class);
    }

    /**
     * Parrainage lié (optionnel)
     */
    public function referral(): BelongsTo
    {
        return $this->belongsTo(Referral::class);
    }

    // Scopes

    /**
     * Scope pour les points gagnés
     */
    public function scopeEarned($query)
    {
        return $query->where('points_earned', '>', 0);
    }

    /**
     * Scope pour les points dépensés
     */
    public function scopeSpent($query)
    {
        return $query->where('points_spent', '>', 0);
    }

    /**
     * Scope par action
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }
}
