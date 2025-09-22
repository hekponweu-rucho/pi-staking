<?php

namespace App\Models;

use App\Enums\ClaimStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Claim extends Model
{
    use HasFactory;

    protected $fillable = [
        'investment_id',
        'user_id',
        'claimed_for_day',
        'base_amount',
        'bonus_amount',
        'final_amount',
        'claimed_at',
        'status',
        'daily_rate_applied',
        'streak_bonus',
        'streak_days',
        'ip_address',
        'user_agent',
        'session_id',
        'calculation_details',
        'notes',
    ];

    protected $casts = [
        'claimed_for_day' => 'date',
        'base_amount' => 'decimal:8',
        'bonus_amount' => 'decimal:8',
        'final_amount' => 'decimal:8',
        'claimed_at' => 'datetime',
        'daily_rate_applied' => 'decimal:6',
        'streak_bonus' => 'decimal:4',
        'streak_days' => 'integer',
        'calculation_details' => 'array',
        'status' => ClaimStatus::class,
    ];

    // Relations

    /**
     * Investissement lié à ce claim
     */
    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class);
    }

    /**
     * Utilisateur qui a effectué le claim
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Transactions liées à ce claim
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Points de fidélité liés à ce claim
     */
    public function loyaltyPoints(): HasMany
    {
        return $this->hasMany(LoyaltyPoint::class);
    }

    // Scopes

    /**
     * Scope pour les claims réussis
     */
    public function scopeProcessed($query)
    {
        return $query->where('status', 'processed');
    }

    /**
     * Scope pour les claims d'aujourd'hui
     */
    public function scopeToday($query)
    {
        return $query->whereDate('claimed_at', today());
    }

    /**
     * Scope pour une période donnée
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('claimed_at', [$startDate, $endDate]);
    }

    // Méthodes utilitaires

    /**
     * Vérifier si le claim peut être annulé
     */
    public function canBeCancelled(): bool
    {
        return $this->status === 'pending' && 
               $this->claimed_at->diffInMinutes(now()) <= 10; // 10 minutes max
    }

    /**
     * Obtenir le détail du calcul sous forme lisible
     */
    public function getReadableCalculationAttribute(): array
    {
        $details = $this->calculation_details ?? [];
        
        return [
            'Montant de base' => number_format($details['base_calculation'] ?? 0, 8) . ' Pi',
            'Multiplicateur bonus' => ($details['bonus_multiplier'] ?? 1) . 'x',
            'Bonus streak' => (($details['streak_bonus'] ?? 0) * 100) . '%',
            'Montant final' => number_format($this->final_amount, 8) . ' Pi',
        ];
    }

    /**
     * Obtenir le taux de rendement effectif
     */
    public function getEffectiveRateAttribute(): float
    {
        if (!$this->investment) {
            return 0;
        }

        return $this->final_amount / $this->investment->amount;
    }

    /**
     * Vérifier si c'est un claim consécutif (streak)
     */
    public function isConsecutiveClaimAttribute(): bool
    {
        if (!$this->investment) {
            return false;
        }

        $previousClaim = $this->investment->claims()
            ->where('id', '<', $this->id)
            ->where('status', 'processed')
            ->orderBy('claimed_for_day', 'desc')
            ->first();

        if (!$previousClaim) {
            return true; // Premier claim
        }

        return $previousClaim->claimed_for_day->addDay()->isSameDay($this->claimed_for_day);
    }
}
