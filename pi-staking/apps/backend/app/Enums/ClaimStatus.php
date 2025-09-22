<?php

declare(strict_types=1);

namespace App\Enums;

enum ClaimStatus: string
{
    case pending = 'pending';
    case processed = 'processed';
    case failed = 'failed';
    case cancelled = 'cancelled';
}
