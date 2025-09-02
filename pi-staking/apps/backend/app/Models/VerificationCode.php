<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationCode extends Model
{
    protected $fillable = [
        'user_id',
        'method',
        'code',
        'action',
        'amount',
        'expires_at',
        'used_at',
        'attempts',
        'max_attempts',
        'metadata'
    ];

    protected $casts = [
        'amount' => 'decimal:8',
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected $hidden = [
        'code' // Ne jamais exposer le code hashé
    ];

    /**
     * Relation avec le modèle User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scopes pour filtrer les codes
     */
    public function scopeActive($query)
    {
        return $query->whereNull('used_at')
                    ->where('expires_at', '>', now())
                    ->where('attempts', '<', 'max_attempts');
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    public function scopeUsed($query)
    {
        return $query->whereNotNull('used_at');
    }

    public function scopeByMethod($query, $method)
    {
        return $query->where('method', $method);
    }

    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    public function scopeForWithdrawal($query)
    {
        return $query->where('action', 'withdrawal');
    }

    public function scopeForLogin($query)
    {
        return $query->where('action', 'login_verification');
    }

    /**
     * Vérifier si le code est encore valide
     */
    public function isValid(): bool
    {
        return $this->used_at === null &&
               $this->expires_at > now() &&
               $this->attempts < $this->max_attempts;
    }

    /**
     * Vérifier si le code a expiré
     */
    public function isExpired(): bool
    {
        return $this->expires_at <= now();
    }

    /**
     * Vérifier si le code a été utilisé
     */
    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }

    /**
     * Vérifier si le nombre maximum de tentatives a été atteint
     */
    public function hasMaxAttemptsReached(): bool
    {
        return $this->attempts >= $this->max_attempts;
    }

    /**
     * Marquer le code comme utilisé
     */
    public function markAsUsed(): bool
    {
        $this->used_at = now();
        return $this->save();
    }

    /**
     * Incrémenter le nombre de tentatives
     */
    public function incrementAttempts(): bool
    {
        $this->attempts++;
        return $this->save();
    }

    /**
     * Obtenir le temps restant avant expiration (en secondes)
     */
    public function getTimeRemainingAttribute(): int
    {
        if ($this->isExpired()) {
            return 0;
        }
        
        return max(0, $this->expires_at->diffInSeconds(now()));
    }

    /**
     * Obtenir le statut du code
     */
    public function getStatusAttribute(): string
    {
        if ($this->isUsed()) {
            return 'used';
        } elseif ($this->isExpired()) {
            return 'expired';
        } elseif ($this->hasMaxAttemptsReached()) {
            return 'max_attempts_reached';
        } elseif ($this->isValid()) {
            return 'active';
        } else {
            return 'inactive';
        }
    }

    /**
     * Obtenir la description de l'action
     */
    public function getActionDescriptionAttribute(): string
    {
        $descriptions = [
            'withdrawal' => 'Retrait de fonds',
            'login_verification' => 'Vérification de connexion',
            'password_reset' => 'Réinitialisation de mot de passe',
            'email_change' => 'Changement d\'email',
            'phone_verification' => 'Vérification de téléphone',
            'large_transaction' => 'Transaction importante',
            'security_check' => 'Vérification de sécurité'
        ];

        return $descriptions[$this->action] ?? ucfirst(str_replace('_', ' ', $this->action));
    }

    /**
     * Obtenir la méthode de vérification formatée
     */
    public function getMethodDisplayAttribute(): string
    {
        $methods = [
            'email' => 'Email',
            'sms' => 'SMS',
            'voice' => 'Appel vocal',
            'push' => 'Notification push'
        ];

        return $methods[$this->method] ?? ucfirst($this->method);
    }

    /**
     * Créer un nouveau code de vérification
     */
    public static function createCode(
        int $userId,
        string $method,
        string $action,
        array $options = []
    ): self {
        // Invalider les codes existants pour cette action
        self::where('user_id', $userId)
            ->where('method', $method)
            ->where('action', $action)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->update(['used_at' => now()]);

        // Générer le nouveau code
        $codeLength = $options['code_length'] ?? ($method === 'sms' ? 6 : 6);
        $plainCode = self::generateCode($codeLength);

        return self::create([
            'user_id' => $userId,
            'method' => $method,
            'code' => bcrypt($plainCode),
            'action' => $action,
            'amount' => $options['amount'] ?? null,
            'expires_at' => now()->addMinutes($options['expires_in_minutes'] ?? 5),
            'attempts' => 0,
            'max_attempts' => $options['max_attempts'] ?? 3,
            'metadata' => [
                'plain_code' => $plainCode, // Temporairement pour l'envoi, sera supprimé après
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_reason' => $options['reason'] ?? null
            ]
        ]);
    }

    /**
     * Vérifier un code
     */
    public static function verifyCode(
        int $userId,
        string $method,
        string $action,
        string $code
    ): bool {
        $verification = self::where('user_id', $userId)
            ->where('method', $method)
            ->where('action', $action)
            ->active()
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$verification) {
            return false;
        }

        // Incrémenter les tentatives
        $verification->incrementAttempts();

        // Vérifier le code
        if (!password_verify($code, $verification->code)) {
            // Log de la tentative échouée
            UserSecurityLog::createSecurityLog($userId, "failed_{$action}_verification", [
                'method' => $method,
                'attempts' => $verification->attempts,
                'max_attempts_reached' => $verification->hasMaxAttemptsReached()
            ]);

            return false;
        }

        // Marquer comme utilisé
        $verification->markAsUsed();

        // Log du succès
        UserSecurityLog::createSecurityLog($userId, "successful_{$action}_verification", [
            'method' => $method,
            'attempts_used' => $verification->attempts
        ]);

        return true;
    }

    /**
     * Nettoyer les codes expirés
     */
    public static function cleanupExpiredCodes(): int
    {
        return self::where('expires_at', '<=', now()->subHours(24))->delete();
    }

    /**
     * Obtenir les statistiques d'utilisation des codes
     */
    public static function getUsageStats(int $days = 30): array
    {
        $since = now()->subDays($days);

        return [
            'total_codes_generated' => self::where('created_at', '>=', $since)->count(),
            'codes_used' => self::where('created_at', '>=', $since)
                               ->whereNotNull('used_at')->count(),
            'codes_expired' => self::where('created_at', '>=', $since)
                                  ->where('expires_at', '<=', now())
                                  ->whereNull('used_at')->count(),
            'success_rate' => self::calculateSuccessRate($since),
            'by_method' => self::getStatsByMethod($since),
            'by_action' => self::getStatsByAction($since)
        ];
    }

    /**
     * Calculer le taux de succès
     */
    private static function calculateSuccessRate($since): float
    {
        $total = self::where('created_at', '>=', $since)->count();
        if ($total === 0) return 0;

        $successful = self::where('created_at', '>=', $since)
                         ->whereNotNull('used_at')->count();
        
        return round(($successful / $total) * 100, 2);
    }

    /**
     * Obtenir les statistiques par méthode
     */
    private static function getStatsByMethod($since): array
    {
        return self::where('created_at', '>=', $since)
                  ->groupBy('method')
                  ->selectRaw('method, count(*) as total, count(used_at) as used')
                  ->get()
                  ->mapWithKeys(function ($item) {
                      return [
                          $item->method => [
                              'total' => $item->total,
                              'used' => $item->used,
                              'success_rate' => $item->total > 0 ? round(($item->used / $item->total) * 100, 2) : 0
                          ]
                      ];
                  })
                  ->toArray();
    }

    /**
     * Obtenir les statistiques par action
     */
    private static function getStatsByAction($since): array
    {
        return self::where('created_at', '>=', $since)
                  ->groupBy('action')
                  ->selectRaw('action, count(*) as total, count(used_at) as used')
                  ->get()
                  ->mapWithKeys(function ($item) {
                      return [
                          $item->action => [
                              'total' => $item->total,
                              'used' => $item->used,
                              'success_rate' => $item->total > 0 ? round(($item->used / $item->total) * 100, 2) : 0
                          ]
                      ];
                  })
                  ->toArray();
    }

    /**
     * Générer un code numérique aléatoire
     */
    private static function generateCode(int $length = 6): string
    {
        $min = pow(10, $length - 1);
        $max = pow(10, $length) - 1;
        
        return str_pad((string) random_int($min, $max), $length, '0', STR_PAD_LEFT);
    }

    /**
     * Boot method pour nettoyer automatiquement
     */
    protected static function boot()
    {
        parent::boot();

        // Nettoyer les métadonnées sensibles après création
        static::created(function ($verificationCode) {
            if (isset($verificationCode->metadata['plain_code'])) {
                $metadata = $verificationCode->metadata;
                unset($metadata['plain_code']);
                $verificationCode->metadata = $metadata;
                $verificationCode->saveQuietly();
            }
        });
    }
}