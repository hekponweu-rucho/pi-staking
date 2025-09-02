<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserStreakResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'current_streak' => $this->current_streak,
            'longest_streak' => $this->longest_streak,
            'last_claim_date' => $this->last_claim_date,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            
            // Computed fields
            'is_active' => $this->last_claim_date && $this->last_claim_date === today()->toDateString(),
            'days_since_last_claim' => $this->last_claim_date ? 
                now()->diffInDays($this->last_claim_date) : null,
        ];
    }
}