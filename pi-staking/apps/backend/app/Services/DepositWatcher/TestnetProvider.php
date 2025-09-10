<?php

namespace App\Services\DepositWatcher;

class TestnetProvider implements PiDepositProviderInterface
{
    public function findIncomingForAddresses(array $addresses): array
    {
        return [];
    }
}