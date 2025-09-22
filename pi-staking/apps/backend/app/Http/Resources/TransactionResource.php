<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'type' => $this->type,
            'category' => $this->category,
            'amount' => (float) $this->amount,
            'balance_before' => (float) $this->balance_before,
            'balance_after' => (float) $this->balance_after,
            'status' => $this->status,
            'reference_id' => $this->reference_id,
            'external_reference' => $this->external_reference,
            'transaction_hash' => $this->transaction_hash,
            'description' => $this->description,
            'admin_notes' => $this->admin_notes,
            'processed_at' => $this->processed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'metadata' => $this->metadata ?? [],

            'investment' => new InvestmentResource($this->whenLoaded('investment')),
            'withdrawal_request' => $this->whenLoaded('withdrawalRequest', function () {
                $wr = $this->withdrawalRequest;
                return [
                    'id' => $wr->id,
                    'amount' => (float) $wr->amount,
                    'status' => $wr->status,
                    'requested_at' => $wr->requested_at?->toISOString(),
                    'processed_at' => $wr->processed_at?->toISOString(),
                ];
            }),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
