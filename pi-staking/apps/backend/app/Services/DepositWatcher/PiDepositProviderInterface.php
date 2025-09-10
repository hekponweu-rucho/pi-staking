<?php

namespace App\Services\DepositWatcher;

interface PiDepositProviderInterface
{
    public function findIncomingForAddresses(array $addresses): array;
}