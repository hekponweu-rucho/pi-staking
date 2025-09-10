<?php

namespace App\Services\DepositWatcher;

use App\Models\DepositAddress;
use App\Services\DepositService;

class DepositWatcherService
{
    public function __construct(private DepositService $depositService)
    {
    }

    public function scan(): void
    {
        $addresses = DepositAddress::query()
            ->where('is_active', true)
            ->whereNotNull('assigned_to_user_id')
            ->where('expires_at', '>', now())
            ->pluck('address')
            ->all();

        if (empty($addresses)) {
            return;
        }

        $provider = $this->makeProvider();
        $hits = $provider->findIncomingForAddresses($addresses);

        foreach ($hits as $hit) {
            $addr = $hit['address'] ?? null;
            $tx = $hit['tx_hash'] ?? null;
            $amount = (string) ($hit['amount'] ?? '0');
            $conf = (int) ($hit['confirmations'] ?? 0);
            if ($addr && $tx) {
                $this->depositService->handleDetectedTransaction($addr, $tx, $amount, $conf);
            }
        }
    }

    private function makeProvider(): PiDepositProviderInterface
    {
        $key = config('deposits.provider', 'testnet');
        return match ($key) {
            'sdk' => new SdkProvider(),
            'api' => new ApiProvider(),
            default => new TestnetProvider(),
        };
    }
}