<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Log;

class Investment extends Model
{
    use HasFactory;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'user_id',
        'staking_package_id',
        'amount',
        'daily_rate',
        'start_at',
        'end_at',
        'status',
        'source',
        'last_claim_at',
        'total_claimed',
        'claims_count',
        'next_claim_at',
        'has_bonus_applied',
        'bonus_multiplier',
        'metadata',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:8',
        'daily_rate' => 'decimal:6',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'last_claim_at' => 'datetime',
        'next_claim_at' => 'datetime',
        'total_claimed' => 'decimal:8',
        'claims_count' => 'integer',
        'has_bonus_applied' => 'boolean',
        'bonus_multiplier' => 'decimal:4',
        'metadata' => 'array',
    ];

    // Relations

    /**
     * Utilisateur propriétaire de l'investissement
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Package de staking utilisé
     */
    public function stakingPackage(): BelongsTo
    {
        return $this->belongsTo(StakingPackage::class);
    }

    /**
     * Claims de cet investissement
     */
    public function claims(): HasMany
    {
        return $this->hasMany(Claim::class);
    }

    /**
     * Transactions liées à cet investissement
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    // Scopes

    /**
     * Scope pour les investissements actifs
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope pour les investissements terminés
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope pour les investissements avec claims disponibles
     */
    public function scopeClaimable($query)
    {
        return $query->where('status', 'active')
                    ->where(function ($q) {
                        $q->whereNull('last_claim_at')
                          ->orWhere('next_claim_at', '<=', now());
                    });
    }

    // Méthodes utilitaires

    /**
     * Vérifier si un claim est possible maintenant
     */
    public function canClaim(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->end_at && $this->end_at->isPast()) {
            return false;
        }

        // Premier claim
        if (!$this->last_claim_at) {
            return $this->start_at->isPast();
        }

        // Vérifier que 24h se sont écoulées
        return $this->next_claim_at && $this->next_claim_at->isPast();
    }

    /**
     * Calculer le montant du prochain claim
     */
    public function calculateNextClaimAmount(): float
    {
        $baseAmount = $this->amount * $this->daily_rate * $this->bonus_multiplier;
        
        // Appliquer les bonus de streak si éligible
        if ($this->stakingPackage->features['streak_bonus_eligible'] ?? false) {
            $streakBonus = $this->user->streak_bonus;
            $baseAmount *= (1 + $streakBonus);
        }

        return round($baseAmount, 8);
    }

    /**
     * Effectuer un claim
     */
    public function processClaim(): ?Claim
    {
        if (!$this->canClaim()) {
            return null;
        }

        $amount = $this->calculateNextClaimAmount();
        $today = now()->toDateString();

        // Créer le claim
        $claim = $this->claims()->create([
            'user_id' => $this->user_id,
            'claimed_for_day' => $today,
            'base_amount' => $this->amount * $this->daily_rate,
            'bonus_amount' => $amount - ($this->amount * $this->daily_rate),
            'final_amount' => $amount,
            'claimed_at' => now(),
            'status' => 'processed',
            'daily_rate_applied' => $this->daily_rate,
            'streak_bonus' => $this->user->streak_bonus,
            'calculation_details' => [
                'base_calculation' => $this->amount * $this->daily_rate,
                'bonus_multiplier' => $this->bonus_multiplier,
                'streak_bonus' => $this->user->streak_bonus,
                'final_amount' => $amount,
            ],
        ]);

        // Mettre à jour l'investissement
        $this->update([
            'last_claim_at' => now(),
            'next_claim_at' => now()->addDay(),
            'total_claimed' => $this->total_claimed + $amount,
            'claims_count' => $this->claims_count + 1,
        ]);

        // Créditer le solde de l'utilisateur
        $this->user->increment('balance_pi', $amount);
        $this->user->increment('total_claimed', $amount);

        // Vérifier si l'investissement est terminé
        if ($this->end_at && now()->isAfter($this->end_at)) {
            $this->transitionTo(self::STATUS_COMPLETED);
        }

        return $claim;
    }

    /**
     * Obtenir le nombre de jours restants
     */
    public function getRemainingDaysAttribute(): int
    {
        if (!$this->end_at) {
            return 0;
        }

        return max(0, now()->diffInDays($this->end_at, false));
    }

    /**
     * Obtenir le temps jusqu'au prochain claim
     */
    public function getTimeToNextClaimAttribute(): ?Carbon
    {
        if (!$this->next_claim_at) {
            return null;
        }

        return $this->next_claim_at->isPast() ? null : $this->next_claim_at;
    }

    /**
     * Obtenir le rendement total prévu
     */
    public function getExpectedTotalReturnAttribute(): float
    {
        if (!$this->end_at) {
            return 0;
        }

        $totalDays = $this->start_at->diffInDays($this->end_at);
        return $this->amount * $this->daily_rate * $totalDays * $this->bonus_multiplier;
    }

    /**
     * Obtenir le pourcentage de progression
     */
    public function getProgressPercentageAttribute(): float
    {
        if (!$this->end_at) {
            return 0;
        }

        $totalDays = $this->start_at->diffInDays($this->end_at);
        $elapsedDays = $this->start_at->diffInDays(now());

        return min(100, ($elapsedDays / $totalDays) * 100);
    }

    public function transitionTo(string $newStatus, ?int $actorId = null, array $metadata = []): bool
    {
        $current = $this->status;
        $allowed = [
            self::STATUS_ACTIVE => [self::STATUS_COMPLETED, self::STATUS_CANCELLED, self::STATUS_FAILED],
            self::STATUS_CANCELLED => [],
            self::STATUS_FAILED => [],
            self::STATUS_COMPLETED => [],
        ];

        if (!isset($allowed[$current]) || !in_array($newStatus, $allowed[$current], true)) {
            Log::channel('daily')->warning('Transition de statut investissement invalide', [
                'investment_id' => $this->id,
                'user_id' => $this->user_id,
                'status_before' => $current,
                'status_after' => $newStatus,
            ]);
            return false;
        }

        $this->update(['status' => $newStatus]);

        Log::channel('daily')->info('Changement de statut investissement', [
            'investment_id' => $this->id,
            'user_id' => $this->user_id,
            'status_before' => $current,
            'status_after' => $newStatus,
            'metadata' => $metadata,
        ]);

        if (class_exists(\App\Models\Audit::class)) {
            \App\Models\Audit::create([
                'actor_id' => $actorId,
                'action' => 'investment.status_change',
                'auditable_type' => self::class,
                'auditable_id' => $this->id,
                'event' => 'updated',
                'old_values' => ['status' => $current],
                'new_values' => ['status' => $newStatus],
                'metadata' => $metadata,
            ]);
        }

        return true;
    }
}
