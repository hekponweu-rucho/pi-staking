<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepositAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'address',
        'label',
        'is_active',
        'usage_count',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'usage_count' => 'integer',
    ];

    public function sessions()
    {
        return $this->hasMany(DepositSession::class);
    }
}
