<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Audit extends Model
{
    protected $fillable = [
        'actor_id',
        'action',
        'auditable_type',
        'auditable_id',
        'event',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'session_id',
        'request_id',
        'risk_level',
        'requires_review',
        'is_suspicious',
        'metadata',
        'notes',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
        'requires_review' => 'boolean',
        'is_suspicious' => 'boolean',
    ];
}
