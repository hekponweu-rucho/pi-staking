<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvestmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'staking_package_id' => $this->staking_package_id,
            
            // Investment details
            'amount' => (float) $this->amount,
            'daily_rate' => (float) $this->daily_rate,
            'source' => $this->source,
            'status' => $this->status,
            'bonus_multiplier' => (float) $this->bonus_multiplier,
            
            // Dates
            'start_at' => $this->start_at->toISOString(),
            'end_at' => $this->end_at?->toISOString(),
            'next_claim_at' => $this->next_claim_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            
            // Computed fields
            'can_claim_now' => $this->canClaim(),
            'next_claim_amount' => (float) $this->calculateNextClaimAmount(),
            'daily_return' => (float) $this->calculateDailyReturn(),
            'total_claimed' => (float) $this->whenLoaded('claims', function () {
                return $this->claims->sum('amount');
            }, 0),
            'progress_percentage' => $this->progress_percentage,
            'remaining_days' => $this->remaining_days,
            'is_expired' => $this->end_at ? $this->end_at->isPast() : false,
            'duration_days' => $this->start_at && $this->end_at ? 
                $this->start_at->diffInDays($this->end_at) : null,
            
            // Relationships
            'staking_package' => new StakingPackageResource($this->whenLoaded('stakingPackage')),
            'claims' => ClaimResource::collection($this->whenLoaded('claims')),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}