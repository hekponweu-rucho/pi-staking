<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DepositAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'address',
        'is_active',
        'assigned_to_user_id',
        'assigned_at',
        'expires_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'assigned_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function deposits(): HasMany
    {
        return $this->hasMany(Deposit::class, 'address_id');
    }

    public function scopeFree($query)
    {
        return $query->where('is_active', true)->whereNull('assigned_to_user_id');
    }

    public function scopeExpiredReservations($query)
    {
        return $query->where('is_active', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now());
    }
}