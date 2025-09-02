<?php

namespace App\Services;

use App\Models\User;
use App\Models\Referral;
use App\Models\Investment;
use App\Models\Transaction;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ReferralService
{
    // Configuration des taux de commission par niveau
    const COMMISSION_RATES = [
        1 => 0.05, // 5% niveau 1 (direct)
        2 => 0.03, // 3% niveau 2
        3 => 0.01, // 1% niveau 3
    ];
    
    const MAX_LEVELS = 3;
    const MIN_QUALIFYING_INVESTMENT = 50; // Minimum pour activer parrainage

    private NotificationService $notificationService;
    
    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    
    /**
     * Activer un parrainage lors du premier investissement
     */
    public function activateReferral(User $user, Investment $investment): void
    {
        // Vérifier si l'utilisateur a un parrain
        if (!$user->referred_by) {
            return;
        }
        
        // Vérifier montant minimum
        if ($investment->amount < self::MIN_QUALIFYING_INVESTMENT) {
            return;
        }
        
        // Vérifier si déjà qualifié
        $existingReferral = Referral::where('referred_id', $user->id)
            ->where('status', 'qualified')
            ->first();
            
        if ($existingReferral) {
            return;
        }
        
        DB::transaction(function () use ($user, $investment) {
            $this->processReferralActivation($user, $investment);
        });
    }
    
    /**
     * Traiter l'activation complète du parrainage
     */
    private function processReferralActivation(User $user, Investment $investment): void
    {
        $referrer = $user->referrer;
        $level = 1;
        
        while ($referrer && $level <= self::MAX_LEVELS) {
            // Créer ou mettre à jour l'enregistrement referral
            $referral = Referral::updateOrCreate([
                'referrer_id' => $referrer->id,
                'referred_id' => $user->id,
                'level' => $level,
            ], [
                'qualifying_investment' => $investment->amount,
                'qualified_at' => now(),
                'status' => 'qualified',
                'qualification_notes' => "Qualifié avec investissement de {$investment->amount} π",
            ]);
            
            // Calculer et créditer le bonus
            $bonus = $this->calculateReferralBonus($investment->amount, $level);
            $this->creditReferralBonus($referrer, $referral, $bonus, $user, $investment->amount);
            
            // Passer au niveau supérieur
            $referrer = $referrer->referrer;
            $level++;
        }
        
        // Mettre à jour les compteurs
        $this->updateReferralCounters($user);
        
        Log::info('Parrainage activé', [
            'user_id' => $user->id,
            'investment_id' => $investment->id,
            'investment_amount' => $investment->amount
        ]);
    }
    
    /**
     * Calculer le bonus de parrainage
     */
    public function calculateReferralBonus(float $investmentAmount, int $level): float
    {
        $rate = self::COMMISSION_RATES[$level] ?? 0;
        return round($investmentAmount * $rate, 8);
    }
    
    /**
     * Créditer le bonus au parrain
     */
    private function creditReferralBonus(User $referrer, Referral $referral, float $bonus, User $referred, float $investmentAmount): void
    {
        // Créditer le solde
        $referrer->increment('balance_pi', $bonus);
        $referrer->increment('referral_earnings', $bonus);
        
        // Mettre à jour le referral
        $referral->update([
            'bonus_amount' => $bonus,
            'bonus_paid' => true,
            'bonus_paid_at' => now(),
            'status' => 'paid',
        ]);
        
        // Créer transaction
        Transaction::create([
            'user_id' => $referrer->id,
            'type' => 'referral_bonus',
            'amount' => $bonus,
            'status' => 'completed',
            'description' => "Bonus parrainage niveau {$referral->level} - {$referred->username}",
            'metadata' => [
                'referral_id' => $referral->id,
                'referred_user_id' => $referred->id,
                'level' => $referral->level,
                'qualifying_investment' => $referral->qualifying_investment,
            ],
        ]);
        
        // Envoyer notification email
        $this->sendReferralBonusNotification($referrer, $referred, $bonus, $referral->level, $investmentAmount);
        
        Log::info("Bonus parrainage crédité", [
            'referrer_id' => $referrer->id,
            'referred_id' => $referred->id,
            'level' => $referral->level,
            'bonus' => $bonus,
        ]);
    }
    
    /**
     * Mettre à jour les compteurs de parrainage
     */
    private function updateReferralCounters(User $user): void
    {
        if (!$user->referrer) return;
        
        // Compter les referrals directs qualifiés
        $directReferrals = Referral::where('referrer_id', $user->referrer->id)
            ->where('level', 1)
            ->whereIn('status', ['qualified', 'paid'])
            ->count();
            
        $user->referrer->update(['total_referrals' => $directReferrals]);
    }
    
    /**
     * Obtenir l'arbre de parrainage d'un utilisateur
     */
    public function getReferralTree(User $user, int $levels = 3): array
    {
        $tree = [];
        
        for ($level = 1; $level <= $levels; $level++) {
            $referrals = Referral::with('referred')
                ->where('referrer_id', $user->id)
                ->where('level', $level)
                ->whereIn('status', ['qualified', 'paid'])
                ->orderBy('qualified_at', 'desc')
                ->get();
                
            $tree["level_{$level}"] = $referrals->map(function ($referral) {
                return [
                    'id' => $referral->referred->id,
                    'username' => $referral->referred->username,
                    'qualified_at' => $referral->qualified_at->format('d/m/Y'),
                    'qualifying_investment' => (float) $referral->qualifying_investment,
                    'bonus_earned' => (float) $referral->bonus_amount,
                    'status' => $referral->status,
                    'status_label' => $referral->status_label,
                    'total_invested' => (float) $referral->referred->total_invested,
                ];
            })->toArray();
        }
        
        return $tree;
    }
    
    /**
     * Obtenir les statistiques de parrainage
     */
    public function getReferralStatistics(User $user): array
    {
        $directReferrals = Referral::where('referrer_id', $user->id)
            ->where('level', 1)
            ->whereIn('status', ['qualified', 'paid'])
            ->count();
            
        $totalCommissions = Referral::where('referrer_id', $user->id)
            ->where('bonus_paid', true)
            ->sum('bonus_amount');
            
        $thisMonthCommissions = Referral::where('referrer_id', $user->id)
            ->where('bonus_paid', true)
            ->whereBetween('bonus_paid_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->sum('bonus_amount');
            
        $commissionsByLevel = [];
        for ($level = 1; $level <= self::MAX_LEVELS; $level++) {
            $commissionsByLevel["level_{$level}"] = (float) Referral::where('referrer_id', $user->id)
                ->where('level', $level)
                ->where('bonus_paid', true)
                ->sum('bonus_amount');
        }
        
        // Récentes activités de parrainage
        $recentEarnings = Transaction::where('user_id', $user->id)
            ->where('type', 'referral_bonus')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($transaction) {
                return [
                    'amount' => (float) $transaction->amount,
                    'level' => $transaction->metadata['level'] ?? 1,
                    'referred_user' => User::find($transaction->metadata['referred_user_id'] ?? null)?->username ?? 'Utilisateur inconnu',
                    'date' => $transaction->created_at->format('d/m/Y H:i'),
                ];
            })->toArray();
        
        return [
            'referral_code' => $user->referral_code,
            'referral_url' => config('app.frontend_url') . '/register?ref=' . $user->referral_code,
            'direct_referrals' => $directReferrals,
            'total_commissions' => (float) $totalCommissions,
            'this_month_commissions' => (float) $thisMonthCommissions,
            'commissions_by_level' => $commissionsByLevel,
            'recent_earnings' => $recentEarnings,
            'commission_rates' => [
                'level_1' => '5%',
                'level_2' => '3%',
                'level_3' => '1%',
            ],
            'min_qualifying_investment' => self::MIN_QUALIFYING_INVESTMENT,
        ];
    }
    
    /**
     * Générer un code de parrainage unique
     */
    public function generateUniqueReferralCode(): string
    {
        do {
            $code = 'PI-' . strtoupper(Str::random(6));
        } while (User::where('referral_code', $code)->exists());
        
        return $code;
    }
    
    /**
     * Valider un code de parrainage
     */
    public function validateReferralCode(string $code, ?User $excludeUser = null): ?User
    {
        $query = User::where('referral_code', $code);
        
        if ($excludeUser) {
            $query->where('id', '!=', $excludeUser->id);
        }
        
        return $query->first();
    }
    
    /**
     * Notifier lors d'un nouveau filleul
     */
    public function notifyNewReferral(User $referrer, User $referred): void
    {
        try {
            Mail::send('emails.new-referral', [
                'user' => $referrer,
                'referred' => $referred,
            ], function ($message) use ($referrer) {
                $message->to($referrer->email)
                        ->subject('[Pi Staking] 🎉 Nouveau filleul inscrit !');
            });
        } catch (\Exception $e) {
            Log::error('Erreur notification nouveau filleul: ' . $e->getMessage());
        }
    }
    
    /**
     * Notifier bonus de parrainage gagné
     */
    private function sendReferralBonusNotification(User $referrer, User $referred, float $bonus, int $level, float $investmentAmount): void
    {
        try {
            Mail::send('emails.referral-bonus', [
                'user' => $referrer,
                'referred' => $referred,
                'bonus' => $bonus,
                'level' => $level,
                'investment_amount' => $investmentAmount,
            ], function ($message) use ($referrer, $bonus) {
                $message->to($referrer->email)
                        ->subject("[Pi Staking] 💰 Bonus de parrainage gagné: {$bonus} π");
            });
        } catch (\Exception $e) {
            Log::error('Erreur notification bonus parrainage: ' . $e->getMessage());
        }
    }
}