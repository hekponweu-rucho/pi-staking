<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'email' => $this->email,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => trim($this->first_name . ' ' . $this->last_name),
            'avatar_url' => $this->avatar_url,
            
            // Financial data
            'balance_pi' => (float) $this->balance_pi,
            'bonus_balance' => (float) $this->bonus_balance,
            'total_invested' => (float) $this->total_invested,
            'total_claimed' => (float) $this->total_claimed,
            
            // Level system
            'current_level' => $this->current_level,
            'level_updated_at' => $this->level_updated_at?->toISOString(),
            
            // Referral system
            'referral_code' => $this->referral_code,
            'referred_by' => $this->referred_by,
            
            // Status
            'kyc_status' => $this->kyc_status,
            'is_active' => $this->is_active,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            
            // Gamification
            'loyalty_points' => $this->loyalty_points,
            'achievement_badges' => $this->achievement_badges,
            
            // Timestamps
            'created_at' => $this->created_at->toISOString(),
            'last_login_at' => $this->last_login_at?->toISOString(),
            
            // Computed fields
            'days_since_registration' => $this->created_at->diffInDays(now()),
            'net_profit' => (float) ($this->total_claimed - $this->total_invested),
            'roi_percentage' => $this->total_invested > 0 ? 
                round(($this->total_claimed / $this->total_invested) * 100, 2) : 0,
            
            // Relationships (when loaded)
            'active_investments' => InvestmentResource::collection($this->whenLoaded('activeInvestments')),
            'bonus_grants' => BonusGrantResource::collection($this->whenLoaded('bonusGrants')),
            'referrals' => ReferralResource::collection($this->whenLoaded('referrals')),
            'current_streak' => new UserStreakResource($this->whenLoaded('currentStreak')),
        ];
    }
}