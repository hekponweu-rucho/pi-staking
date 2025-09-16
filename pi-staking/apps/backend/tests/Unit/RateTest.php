<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Support\Rate;

class RateTest extends TestCase
{
    public function test_daily_rate_from_apy_simple(): void
    {
        $apy = 0.04; // 4%
        $expected = $apy / 365;
        $actual = Rate::dailyRateFromApy($apy, 'simple');
        $this->assertEqualsWithDelta($expected, $actual, 1e-12);
    }

    public function test_daily_rate_from_apy_compound(): void
    {
        $apy = 0.07; // 7%
        $expected = pow(1 + $apy, 1/365) - 1;
        $actual = Rate::dailyRateFromApy($apy, 'compound');
        $this->assertEqualsWithDelta($expected, $actual, 1e-12);
    }
}
