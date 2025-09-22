<?php

declare(strict_types=1);

namespace App\Enums;

enum InvestmentSource: string
{
    case funds = 'funds';
    case bonus = 'bonus';
    case referral = 'referral';
    case claimable = 'claimable';
    case claimable_bonus = 'claimable_bonus';
}
