<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StakingPackageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            
            // Package details
            'daily_rate' => (float) $this->daily_rate,
            'min_amount' => (float) $this->min_amount,
            'max_amount' => $this->max_amount ? (float) $this->max_amount : null,
            'duration_days' => $this->duration_days,
            
            // Requirements & features
            'required_level' => $this->required_level,
            'is_active' => $this->is_active,
            'is_discovery_bonus' => $this->is_discovery_bonus,
            'features' => $this->features ?? [],
            
            // Computed fields
            'daily_rate_percentage' => round($this->daily_rate * 100, 3),
            'annual_rate_percentage' => round($this->daily_rate * 365 * 100, 2),
            'total_return_percentage' => $this->duration_days ? 
                round($this->daily_rate * $this->duration_days * 100, 2) : null,
            
            // User-specific computed fields (when user is available in context)
            'can_be_used' => $this->when($request->user(), function () use ($request) {
                return $this->canBeUsedBy($request->user());
            }),
            'user_meets_level_requirement' => $this->when($request->user(), function () use ($request) {
                $user = $request->user();
                $levelOrder = ['discovery', 'bronze', 'silver', 'gold', 'diamond'];
                $requiredIndex = array_search($this->required_level, $levelOrder);
                $userIndex = array_search($user->current_level, $levelOrder);
                return $userIndex >= $requiredIndex;
            }),
            
            // Statistics (when loaded)
            'total_investments' => $this->whenLoaded('investments', function () {
                return $this->investments->count();
            }),
            'total_invested_amount' => $this->when(isset($this->investments_sum_amount), function () {
                return (float) $this->investments_sum_amount;
            }),
            'active_investments_count' => $this->whenLoaded('investments', function () {
                return $this->investments->where('status', 'active')->count();
            }),
            
            // Timestamps
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}