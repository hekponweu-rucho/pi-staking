<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserSecurityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'ip_address',
        'user_agent',
        'location',
        'device_type',
        'metadata',
        'risk_score',
        'status',
    ];

    protected $casts = [
        'metadata' => 'array',
        'risk_score' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
