<?php

namespace App\Support;

class Money
{
    public static function formatPi(float $amount, int $decimals = 8): string
    {
        return number_format($amount, $decimals) . ' Pi';
    }
}
