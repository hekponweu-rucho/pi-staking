<?php

declare(strict_types=1);

namespace App\Enums;

enum DepositStatus: string
{
    case pending = 'pending';
    case confirmed = 'confirmed';
    case expired = 'expired';
    case failed = 'failed';
}
