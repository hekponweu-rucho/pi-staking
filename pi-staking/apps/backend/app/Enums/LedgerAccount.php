<?php

declare(strict_types=1);

namespace App\Enums;

enum LedgerAccount: string
{
    case principal = 'principal';
    case bonus = 'bonus';
    case claimable = 'claimable';
    case claimable_bonus = 'claimable_bonus';
    case pending_withdrawal = 'pending_withdrawal';
    case fees = 'fees';
    case external = 'external';
}
