<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BonusGrantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'amount' => (float) $this->amount,
            'type' => $this->type,
            'description' => $this->description,
            'expires_at' => $this->expires_at?->toISOString(),
            'is_used' => $this->is_used,
            'used_at' => $this->used_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            
            // Computed fields
            'is_expired' => $this->expires_at ? $this->expires_at->isPast() : false,
            'days_until_expiry' => $this->expires_at ? max(0, $this->expires_at->diffInDays(now())) : null,
            'is_expiring_soon' => $this->expires_at ? $this->expires_at->diffInDays(now()) <= 7 : false,
        ];
    }
}