<?php

declare(strict_types=1);

namespace App\Enums;

enum WithdrawalStatus: string
{
    case pending = 'pending';
    case reviewing = 'reviewing';
    case approved = 'approved';
    case processing = 'processing';
    case completed = 'completed';
    case rejected = 'rejected';
    case cancelled = 'cancelled';
}
