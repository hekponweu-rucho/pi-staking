<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StakingPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'daily_rate',
        'min_amount',
        'max_amount',
        'duration_days',
        'level_requirement',
        'is_active',
        'is_discovery_bonus',
        'max_concurrent',
        'features',
        'sort_order',
    ];

    protected $casts = [
        'daily_rate' => 'decimal:6',
        'min_amount' => 'decimal:8',
        'max_amount' => 'decimal:8',
        'duration_days' => 'integer',
        'is_active' => 'boolean',
        'is_discovery_bonus' => 'boolean',
        'max_concurrent' => 'integer',
        'features' => 'array',
        'sort_order' => 'integer',
    ];

    // Relations

    /**
     * Investissements utilisant ce package
     */
    public function investments(): HasMany
    {
        return $this->hasMany(Investment::class);
    }

    // Scopes

    /**
     * Scope pour les packages actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour les packages non-bonus de découverte
     */
    public function scopeRegular($query)
    {
        return $query->where('is_discovery_bonus', false);
    }

    /**
     * Scope pour les packages bonus de découverte
     */
    public function scopeDiscoveryBonus($query)
    {
        return $query->where('is_discovery_bonus', true);
    }

    /**
     * Scope pour filtrer par niveau requis
     */
    public function scopeForLevel($query, string $level)
    {
        return $query->where('level_requirement', $level);
    }

    /**
     * Scope pour ordonner par ordre d'affichage
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    // Méthodes utilitaires

    /**
     * Vérifier si l'utilisateur peut utiliser ce package
     */
    public function canBeUsedBy(User $user): bool
    {
        if (!$this->is_active) {
            return false;
        }

        // Vérifier le niveau requis
        if ($this->level_requirement && !$user->hasLevel($this->level_requirement)) {
            return false;
        }

        // Vérifier le nombre maximum d'investissements simultanés
        if ($this->max_concurrent) {
            $activeInvestments = $user->investments()
                ->where('staking_package_id', $this->id)
                ->where('status', 'active')
                ->count();
            
            if ($activeInvestments >= $this->max_concurrent) {
                return false;
            }
        }

        return true;
    }

    /**
     * Vérifier si le montant est valide pour ce package
     */
    public function isValidAmount(float $amount): bool
    {
        if ($amount < $this->min_amount) {
            return false;
        }

        if ($this->max_amount && $amount > $this->max_amount) {
            return false;
        }

        return true;
    }

    /**
     * Calculer le rendement quotidien pour un montant donné
     */
    public function calculateDailyReturn(float $amount): float
    {
        return $amount * $this->daily_rate;
    }

    /**
     * Calculer le rendement total pour la durée complète
     */
    public function calculateTotalReturn(float $amount): float
    {
        return $this->calculateDailyReturn($amount) * $this->duration_days;
    }

    /**
     * Obtenir les fonctionnalités sous forme de texte lisible
     */
    public function getReadableFeaturesAttribute(): array
    {
        $features = $this->features ?? [];
        $readable = [];

        if ($features['uses_bonus_funds'] ?? false) {
            $readable[] = 'Utilise les fonds bonus';
        }
        if ($features['limited_duration'] ?? false) {
            $readable[] = 'Durée limitée';
        }
        if ($features['one_time_only'] ?? false) {
            $readable[] = 'Une seule fois';
        }
        if ($features['streak_bonus_eligible'] ?? false) {
            $readable[] = 'Eligible aux bonus streak';
        }
        if ($features['priority_support'] ?? false) {
            $readable[] = 'Support prioritaire';
        }

        return $readable;
    }
}
