<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Assume investments and claims are eager loaded and counts are withCount
        $activeInvestments = $this->whenLoaded('investments', function () {
            return $this->investments->where('status', 'active');
        }, collect());
        $totalClaimed = $this->whenLoaded('claims', function () {
            return (float) $this->claims->where('status', 'processed')->sum('final_amount');
        }, (float) ($this->total_claimed ?? 0));

        return [
            'id' => $this->id,
            'username' => $this->username,
            'email' => $this->email,
            'current_level' => $this->current_level,
            'balance_pi' => (float) $this->balance_pi,
            'total_invested' => (float) $this->total_invested,
            'total_claimed' => $totalClaimed,
            'active_investments' => $activeInvestments ? $activeInvestments->count() : 0,
            'investments_count' => $this->investments_count ?? null,
            'claims_count' => $this->claims_count ?? null,
            'last_activity' => $this->last_activity,
            'created_at' => $this->created_at,
            'kyc_status' => $this->kyc_status ?? 'pending',
            'is_active' => $this->last_activity ? $this->last_activity >= now()->subDays(30) : false,
            'referral_code' => $this->referral_code,
            'loyalty_points' => $this->loyalty_points,
        ];
    }
}
