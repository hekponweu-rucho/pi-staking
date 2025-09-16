<?php

namespace App\Services;

use App\Models\LedgerEntry;
use App\Models\User;
use App\Support\Money;
use Illuminate\Support\Carbon;

class LedgerService
{
    public function post(null|int|User $user, string $account, string|float|int $delta, string $referenceType, string|int $referenceId, array $meta = [], ?Carbon $occurredAt = null): LedgerEntry
    {
        $userId = $user instanceof User ? $user->id : $user;
        return LedgerEntry::create([
            'user_id' => $userId,
            'account' => $account,
            'delta' => Money::round($delta),
            'currency' => 'PI',
            'reference_type' => $referenceType,
            'reference_id' => (string) $referenceId,
            'meta' => $meta,
            'occurred_at' => $occurredAt ?? now(),
        ]);
    }

    public function move(null|int|User $fromUser, string $fromAccount, null|int|User $toUser, string $toAccount, string|float|int $amount, string $referenceType, string|int $referenceId, array $meta = [], ?Carbon $occurredAt = null): array
    {
        $amt = Money::round($amount);
        $entries = [];
        $entries[] = $this->post($fromUser, $fromAccount, Money::mul($amt, -1), $referenceType, $referenceId, array_merge($meta, ['side' => 'debit']), $occurredAt);
        $entries[] = $this->post($toUser, $toAccount, $amt, $referenceType, $referenceId, array_merge($meta, ['side' => 'credit']), $occurredAt);
        return $entries;
    }

    public function moveExternalToUser(int|User $toUser, string $toAccount, string|float|int $amount, string $referenceType, string|int $referenceId, array $meta = [], ?Carbon $occurredAt = null): array
    {
        return $this->move(null, 'external', $toUser, $toAccount, $amount, $referenceType, $referenceId, $meta, $occurredAt);
    }

    public function moveUserToExternal(int|User $fromUser, string $fromAccount, string|float|int $amount, string $referenceType, string|int $referenceId, array $meta = [], ?Carbon $occurredAt = null): array
    {
        return $this->move($fromUser, $fromAccount, null, 'external', $amount, $referenceType, $referenceId, $meta, $occurredAt);
    }
}
