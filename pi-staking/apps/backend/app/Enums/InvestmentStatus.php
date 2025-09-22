<?php

declare(strict_types=1);

namespace App\Enums;

enum InvestmentStatus: string
{
    case active = 'active';
    case completed = 'completed';
    case cancelled = 'cancelled';
    case paused = 'paused';
    case failed = 'failed';
}
