<?php

namespace App\Models;

use App\Enums\LedgerAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LedgerEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'transaction_id',
        'line_no',
        'account',
        'delta',
        'currency',
        'reference_type',
        'reference_id',
        'meta',
        'occurred_at',
    ];

    protected $casts = [
        'delta' => 'decimal:8',
        'line_no' => 'integer',
        'meta' => 'array',
        'occurred_at' => 'datetime',
        'account' => LedgerAccount::class,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
