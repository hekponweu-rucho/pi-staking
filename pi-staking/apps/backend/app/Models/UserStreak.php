<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class UserStreak extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'current_streak',
        'longest_streak',
        'last_activity_date',
        'streak_started_at',
        'streak_broken_at',
        'current_bonus_rate',
        'milestone_reached',
        'milestones_history',
        'metadata',
    ];

    protected $casts = [
        'current_streak' => 'integer',
        'longest_streak' => 'integer',
        'last_activity_date' => 'date',
        'streak_started_at' => 'datetime',
        'streak_broken_at' => 'datetime',
        'current_bonus_rate' => 'decimal:4',
        'milestone_reached' => 'integer',
        'milestones_history' => 'array',
        'metadata' => 'array',
    ];

    // Relations

    /**
     * Utilisateur propriétaire du streak
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes

    /**
     * Scope par type de streak
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope pour les streaks actifs
     */
    public function scopeActive($query)
    {
        return $query->where('current_streak', '>', 0);
    }

    // Méthodes utilitaires

    /**
     * Vérifier si le streak est actif
     */
    public function isActive(): bool
    {
        if ($this->current_streak <= 0) {
            return false;
        }

        // Vérifier si l'activité est récente (dépend du type)
        if (!$this->last_activity_date) {
            return false;
        }

        $maxGap = $this->type === 'daily_claim' ? 1 : 7; // 1 jour pour claim, 7 jours pour autres
        return $this->last_activity_date->diffInDays(now()) <= $maxGap;
    }

    /**
     * Calculer le prochain palier
     */
    public function getNextMilestone(): ?int
    {
        $milestones = [7, 14, 30, 60, 90, 180, 365];
        
        foreach ($milestones as $milestone) {
            if ($this->current_streak < $milestone) {
                return $milestone;
            }
        }
        
        return null;
    }

    /**
     * Calculer le bonus actuel basé sur le streak
     */
    public function calculateBonusRate(): float
    {
        if (!$this->isActive()) {
            return 0.0;
        }

        // Bonus progressif par paliers
        $bonusRates = [
            7 => 0.01,   // 1% après 7 jours
            14 => 0.02,  // 2% après 14 jours
            30 => 0.05,  // 5% après 30 jours
            60 => 0.08,  // 8% après 60 jours
            90 => 0.12,  // 12% après 90 jours
            180 => 0.18, // 18% après 180 jours
            365 => 0.25, // 25% après 365 jours
        ];

        $currentBonus = 0.0;
        foreach ($bonusRates as $milestone => $bonus) {
            if ($this->current_streak >= $milestone) {
                $currentBonus = $bonus;
            } else {
                break;
            }
        }

        return $currentBonus;
    }
}
