<?php

declare(strict_types=1);

namespace App\Enums;

enum TransactionStatus: string
{
    case pending = 'pending';
    case processing = 'processing';
    case completed = 'completed';
    case failed = 'failed';
    case cancelled = 'cancelled';
    case reversed = 'reversed';
    case rejected = 'rejected';
}
