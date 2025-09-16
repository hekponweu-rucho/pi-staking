<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LedgerEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
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
        'meta' => 'array',
        'occurred_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
