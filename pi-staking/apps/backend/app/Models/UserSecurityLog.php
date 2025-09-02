<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class UserSecurityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'ip_address',
        'user_agent',
        'device_type',
        'location',
        'risk_score',
        'severity_level',
        'action_description',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'risk_score' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Statistiques de sécurité agrégées pour un utilisateur
     */
    public static function getSecurityStats(int $userId, int $days = 30): array
    {
        $startDate = now()->subDays($days);

        $logs = static::where('user_id', $userId)
            ->where('created_at', '>=', $startDate)
            ->get();

        $byDay = static::where('user_id', $userId)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count, AVG(COALESCE(risk_score,0)) as avg_risk')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $byAction = static::where('user_id', $userId)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('action, COUNT(*) as count')
            ->groupBy('action')
            ->orderByDesc('count')
            ->get();

        $failedLogins = static::where('user_id', $userId)
            ->where('created_at', '>=', $startDate)
            ->where('action', 'failed_login')
            ->count();

        $highSeverity = static::where('user_id', $userId)
            ->where('created_at', '>=', $startDate)
            ->where('severity_level', 'high')
            ->count();

        return [
            'period_days' => $days,
            'totals' => [
                'events' => $logs->count(),
                'failed_logins' => $failedLogins,
                'high_severity_events' => $highSeverity,
                'avg_risk_score' => round((float) $logs->avg('risk_score'), 3),
            ],
            'by_day' => $byDay,
            'by_action' => $byAction,
            'recent_ips' => $logs->pluck('ip_address')->filter()->unique()->values(),
            'recent_devices' => $logs->pluck('device_type')->filter()->unique()->values(),
        ];
    }
}
