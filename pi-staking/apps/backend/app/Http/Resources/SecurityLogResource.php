<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SecurityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'action' => $this->action,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'location' => $this->location,
            'device_type' => $this->device_type,
            'metadata' => $this->metadata ?? [],
            'risk_score' => (float) ($this->risk_score ?? 0),
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
