<?php

namespace App\Services\DepositWatcher;

class SdkProvider implements PiDepositProviderInterface
{
    public function findIncomingForAddresses(array $addresses): array
    {
        return [];
    }
}