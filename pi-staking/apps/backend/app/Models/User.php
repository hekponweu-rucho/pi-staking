<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'role',
        'balance_pi',
        'bonus_balance',
        'total_invested',
        'total_earned',
        'total_claimed',
        'total_withdrawn',
        'current_level',
        'level_updated_at',
        'referral_code',
        'referred_by',
        'kyc_status',
        'kyc_verified_at',
        'loyalty_points',
        'streak_bonus',
        'total_referrals',
        'referral_earnings',
        'last_login_ip',
        'last_login_at',
        'notification_preferences',
        'timezone',
        'language',
        'welcome_bonus_claimed',
        'welcome_bonus_reinvested',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'level_updated_at' => 'datetime',
            'kyc_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'locked_until' => 'datetime',
            'balance_pi' => 'decimal:8',
            'bonus_balance' => 'decimal:8',
            'total_invested' => 'decimal:8',
            'total_earned' => 'decimal:8',
            'total_claimed' => 'decimal:8',
            'total_withdrawn' => 'decimal:8',
            'referral_earnings' => 'decimal:8',
            'streak_bonus' => 'decimal:4',
            'notification_preferences' => 'array',
            'failed_login_attempts' => 'integer',
            'loyalty_points' => 'integer',
            'total_referrals' => 'integer',
            'welcome_bonus_claimed' => 'boolean',
            'welcome_bonus_reinvested' => 'boolean',
        ];
    }

    // Relations
    
    /**
     * Utilisateur qui a parrainé cet utilisateur
     */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    /**
     * Utilisateurs parrainés par cet utilisateur
     */
    public function referrals(): HasMany
    {
        return $this->hasMany(User::class, 'referred_by');
    }

    /**
     * Investissements de l'utilisateur
     */
    public function investments(): HasMany
    {
        return $this->hasMany(Investment::class);
    }

    /**
     * Investments actifs de l'utilisateur
     */
    public function activeInvestments(): HasMany
    {
        return $this->hasMany(Investment::class)->where('status', 'active');
    }

    /**
     * Claims de l'utilisateur
     */
    public function claims(): HasMany
    {
        return $this->hasMany(Claim::class);
    }

    /**
     * Transactions de l'utilisateur
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Demandes de retrait de l'utilisateur
     */
    public function withdrawalRequests(): HasMany
    {
        return $this->hasMany(WithdrawalRequest::class);
    }

    /**
     * Bonus octroyés à l'utilisateur
     */
    public function bonusGrants(): HasMany
    {
        return $this->hasMany(BonusGrant::class);
    }

    /**
     * Streaks de l'utilisateur
     */
    public function streaks(): HasMany
    {
        return $this->hasMany(UserStreak::class);
    }

    /**
     * Points de fidélité de l'utilisateur
     */
    public function loyaltyPoints(): HasMany
    {
        return $this->hasMany(LoyaltyPoint::class);
    }

    /**
     * Historique d'audit pour cet utilisateur
     */
    public function auditHistory(): HasMany
    {
        return $this->hasMany(Audit::class, 'actor_id');
    }

    // Méthodes utilitaires

    /**
     * Vérifier si l'utilisateur peut investir un montant donné
     */
    public function canInvest(float $amount, string $source = 'funds'): bool
    {
        if ($source === 'funds') {
            return $this->balance_pi >= $amount;
        }
        
        if ($source === 'bonus') {
            return (float) $this->bonus_balance >= $amount;
        }
        
        return false;
    }

    /**
     * Obtenir le montant de bonus disponible
     */
    public function getAvailableBonusAmount(): float
    {
        return (float) $this->bonus_balance;
    }

    /**
     * Vérifier si l'utilisateur a le niveau requis
     */
    public function hasLevel(string $level): bool
    {
        $levels = ['discovery', 'bronze', 'silver', 'gold', 'diamond'];
        $currentLevelIndex = array_search($this->current_level, $levels);
        $requiredLevelIndex = array_search($level, $levels);
        
        return $currentLevelIndex >= $requiredLevelIndex;
    }

    /**
     * Obtenir le taux de rendement pour le niveau actuel
     */
    public function getCurrentLevelRate(): float
    {
        return match ($this->current_level) {
            'discovery' => config('staking.rates.discovery', 0.025),
            'bronze' => config('staking.rates.bronze', 0.008),
            'silver' => config('staking.rates.silver', 0.005),
            'gold' => config('staking.rates.gold', 0.003),
            'diamond' => config('staking.rates.diamond', 0.002),
            default => 0.0,
        };
    }

    /**
     * Mettre à jour le niveau de l'utilisateur basé sur son investissement total
     */
    public function updateLevel(): void
    {
        $oldLevel = $this->current_level;
        $newLevel = $this->calculateLevel();
        
        if ($oldLevel !== $newLevel) {
            $this->update([
                'current_level' => $newLevel,
                'level_updated_at' => now(),
            ]);
        }
    }

    /**
     * Calculer le niveau basé sur l'investissement total
     */
    private function calculateLevel(): string
    {
        return match (true) {
            $this->total_invested >= config('staking.levels.diamond', 50000) => 'diamond',
            $this->total_invested >= config('staking.levels.gold', 10000) => 'gold',
            $this->total_invested >= config('staking.levels.silver', 2500) => 'silver',
            $this->total_invested >= config('staking.levels.bronze', 500) => 'bronze',
            default => 'discovery',
        };
    }
}
