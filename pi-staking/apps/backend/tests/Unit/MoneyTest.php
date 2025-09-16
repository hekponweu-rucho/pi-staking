<?php

namespace Tests\Unit;

use App\Support\Money;
use Tests\TestCase;

class MoneyTest extends TestCase
{
    public function test_round_half_even_ties(): void
    {
        $this->assertSame('1.00', Money::round('1.005', 2, 'half_even'));
        $this->assertSame('1.02', Money::round('1.015', 2, 'half_even'));
        $this->assertSame('2.00', Money::round('1.995', 2, 'half_even'));
        $this->assertSame('-1.00', Money::round('-1.005', 2, 'half_even'));
    }

    public function test_add_mul_div(): void
    {
        $sum = Money::add('0.1', '0.2');
        $this->assertSame('0.3000', substr($sum, 0, 6));

        $mul = Money::mul('1.23456789', '2');
        $this->assertSame('2.46913578', substr($mul, 0, 11));

        $div = Money::div('1', '3');
        $this->assertTrue(str_starts_with($div, '0.3333'));
    }
}
