<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClaimResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'investment_id' => $this->investment_id,
            'user_id' => $this->user_id,
            
            // Claim details
            'amount' => (float) $this->amount,
            'claimed_for_day' => $this->claimed_for_day,
            'status' => $this->status,
            'bonus_amount' => (float) ($this->bonus_amount ?? 0),
            'effective_rate' => (float) ($this->effective_rate ?? 0),
            
            // Timestamps
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            
            // Computed fields
            'days_since_claim' => $this->created_at->diffInDays(now()),
            'is_recent' => $this->created_at->isToday(),
            
            // Relationships
            'investment' => new InvestmentResource($this->whenLoaded('investment')),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}