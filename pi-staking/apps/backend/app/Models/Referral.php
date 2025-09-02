<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Referral extends Model
{
    protected $fillable = [
        'referrer_id',
        'referred_id', 
        'level',
        'bonus_amount',
        'bonus_paid',
        'bonus_paid_at',
        'status',
        'qualifying_investment',
        'qualified_at',
        'qualification_notes',
        'metadata',
    ];
    
    protected $casts = [
        'bonus_amount' => 'decimal:8',
        'qualifying_investment' => 'decimal:8',
        'bonus_paid' => 'boolean',
        'bonus_paid_at' => 'datetime',
        'qualified_at' => 'datetime',
        'metadata' => 'array',
    ];
    
    // Relations
    
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }
    
    public function referred(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_id');
    }
    
    // Scopes
    
    public function scopeQualified($query)
    {
        return $query->whereIn('status', ['qualified', 'paid']);
    }
    
    public function scopePaid($query)
    {
        return $query->where('bonus_paid', true);
    }
    
    public function scopeLevel($query, int $level)
    {
        return $query->where('level', $level);
    }
    
    public function scopeThisMonth($query)
    {
        return $query->whereBetween('created_at', [
            now()->startOfMonth(),
            now()->endOfMonth()
        ]);
    }
    
    // Méthodes utilitaires
    
    public function getFormattedBonusAttribute(): string
    {
        return number_format($this->bonus_amount, 4) . ' π';
    }
    
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'pending' => 'En attente',
            'qualified' => 'Qualifié',
            'paid' => 'Payé',
            'cancelled' => 'Annulé',
            default => 'Inconnu',
        };
    }
    
    public function getCommissionRateAttribute(): string
    {
        return match ($this->level) {
            1 => '5%',
            2 => '3%',
            3 => '1%',
            default => '0%',
        };
    }
}
