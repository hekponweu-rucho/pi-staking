<?php

namespace App\Support;

class Rate
{
    public static function dailyRateFromApy(float $apy, string $mode = 'simple'): float
    {
        $mode = strtolower($mode);
        if ($mode === 'compound') {
            return pow(1 + $apy, 1 / 365) - 1;
        }
        return $apy / 365;
    }
}
