<?php

declare(strict_types=1);

namespace App\Enums;

enum TransactionType: string
{
    case deposit = 'deposit';
    case withdrawal = 'withdrawal';
    case claim = 'claim';
    case bonus = 'bonus';
    case referral = 'referral';
    case adjustment = 'adjustment';
    case fee = 'fee';
    case investment = 'investment';
}
