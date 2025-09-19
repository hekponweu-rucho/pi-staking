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
        'max_duration_days',
        'level',
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
        'max_duration_days' => 'integer',
        'level' => 'string',
        'is_active' => 'boolean',
        'is_discovery_bonus' => 'boolean',
        'max_concurrent' => 'integer',
        'features' => 'array',
        'sort_order' => 'integer',
    ];

    public function investments(): HasMany
    {
        return $this->hasMany(Investment::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeRegular($query)
    {
        return $query->where('is_discovery_bonus', false);
    }

    public function scopeDiscoveryBonus($query)
    {
        return $query->where('is_discovery_bonus', true);
    }

    public function scopeForLevel($query, string $level)
    {
        return $query->where('level', $level);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('min_amount');
    }

    public function canBeUsedBy(User $user): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->level && !$user->hasLevel($this->level)) {
            return false;
        }

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

    public function calculateDailyReturn(float $amount): float
    {
        return $amount * $this->daily_rate;
    }

    public function calculateTotalReturn(float $amount): float
    {
        return $this->calculateDailyReturn($amount) * $this->duration_days;
    }

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
