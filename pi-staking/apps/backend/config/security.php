<?php

return [
    
    /*
    |--------------------------------------------------------------------------
    | Authentification à Deux Facteurs (2FA)
    |--------------------------------------------------------------------------
    |
    | Configuration pour l'authentification à deux facteurs
    |
    */

    '2fa' => [
        // Nom de l'application affiché dans Google Authenticator
        'app_name' => env('APP_NAME', 'Pi Staking'),
        
        // Fenêtre de tolérance pour les codes TOTP (en périodes de 30 secondes)
        'window' => 2,
        
        // Nombre de codes de récupération générés
        'backup_codes_count' => 8,
        
        // Durée de validité des codes de récupération (en jours)
        'backup_codes_expiry_days' => 365,
    ],

    /*
    |--------------------------------------------------------------------------
    | 2FA Obligatoire
    |--------------------------------------------------------------------------
    |
    | Actions et seuils qui nécessitent obligatoirement une vérification 2FA
    |
    */

    '2fa_required' => [
        // Seuils de montant pour transactions
        'withdrawal_threshold' => env('2FA_WITHDRAWAL_THRESHOLD', 100),
        'investment_threshold' => env('2FA_INVESTMENT_THRESHOLD', 1000),
        'transfer_threshold' => env('2FA_TRANSFER_THRESHOLD', 500),
        
        // Actions toujours protégées par 2FA
        'always_required' => [
            'disable_2fa',
            'change_password',
            'change_email',
            'export_data',
            'delete_account'
        ],
        
        // Actions protégées par 2FA selon le niveau utilisateur
        'level_based' => [
            'bronze' => ['withdrawal' => 50],
            'silver' => ['withdrawal' => 100],
            'gold' => ['withdrawal' => 500],
            'platinum' => ['withdrawal' => 1000],
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Vérifications Email/SMS
    |--------------------------------------------------------------------------
    |
    | Configuration pour les vérifications par email et SMS
    |
    */

    'verification' => [
        // Durée de validité des codes (en minutes)
        'code_expiry_minutes' => 5,
        
        // Nombre maximum de tentatives par code
        'max_attempts' => 3,
        
        // Longueur des codes de vérification
        'code_length' => 6,
        
        // Seuils pour vérification obligatoire
        'withdrawal_verification_threshold' => env('WITHDRAWAL_VERIFICATION_THRESHOLD', 50),
        
        // Rate limiting pour l'envoi de codes
        'rate_limits' => [
            'email' => ['count' => 5, 'period_minutes' => 60],
            'sms' => ['count' => 3, 'period_minutes' => 60],
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Limites de Retrait
    |--------------------------------------------------------------------------
    |
    | Limites de retrait journalières selon le niveau utilisateur
    |
    */

    'withdrawal_limits' => [
        'bronze' => [
            'daily' => 100,
            'monthly' => 2000,
        ],
        'silver' => [
            'daily' => 500,
            'monthly' => 10000,
        ],
        'gold' => [
            'daily' => 2000,
            'monthly' => 50000,
        ],
        'platinum' => [
            'daily' => 10000,
            'monthly' => 200000,
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Détection d'Activité Suspecte
    |--------------------------------------------------------------------------
    |
    | Paramètres pour l'analyse des risques et la détection d'anomalies
    |
    */

    'risk_detection' => [
        // Seuils de score de risque (0-1)
        'high_risk_threshold' => 0.8,
        'medium_risk_threshold' => 0.5,
        
        // Facteurs de risque et leurs poids
        'risk_factors' => [
            'new_ip' => 0.3,
            'vpn_detected' => 0.4,
            'suspicious_location' => 0.5,
            'multiple_failed_attempts' => 0.6,
            'unusual_time' => 0.2,
            'rapid_actions' => 0.3,
            'new_device' => 0.2,
            'suspicious_user_agent' => 0.3,
        ],
        
        // Limites pour détecter les actions suspectes
        'limits' => [
            'max_failed_logins_per_hour' => 5,
            'max_actions_per_minute' => 10,
            'max_different_ips_per_day' => 3,
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Verrouillage de Compte
    |--------------------------------------------------------------------------
    |
    | Configuration pour le verrouillage automatique des comptes
    |
    */

    'account_locking' => [
        // Nombre de tentatives de connexion échouées avant verrouillage
        'max_failed_login_attempts' => 5,
        
        // Durée de verrouillage (en minutes)
        'lockout_duration_minutes' => 30,
        
        // Progression du verrouillage (en minutes)
        'progressive_lockout' => [
            1 => 5,    // 1ère offense: 5 minutes
            2 => 15,   // 2ème offense: 15 minutes
            3 => 60,   // 3ème offense: 1 heure
            4 => 240,  // 4ème offense: 4 heures
            5 => 1440, // 5ème offense: 24 heures
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Notifications de Sécurité
    |--------------------------------------------------------------------------
    |
    | Configuration pour les notifications automatiques
    |
    */

    'notifications' => [
        // Types de notifications activées par défaut
        'default_enabled' => [
            'login_alerts' => true,
            'withdrawal_notifications' => true,
            'security_changes' => true,
            'suspicious_activity' => true,
            'weekly_summary' => false,
        ],
        
        // Templates d'email
        'email_templates' => [
            'security_alert' => 'emails.security-alert',
            'withdrawal_verification' => 'emails.withdrawal-verification',
            'suspicious_login' => 'emails.suspicious-login',
            'weekly_summary' => 'emails.security-weekly-summary',
        ],
        
        // Rate limiting des notifications
        'rate_limits' => [
            'security_alert' => ['count' => 5, 'period_hours' => 1],
            'login_alert' => ['count' => 3, 'period_hours' => 1],
            'withdrawal_notification' => ['count' => 10, 'period_hours' => 1],
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Services Externes
    |--------------------------------------------------------------------------
    |
    | Configuration pour les services de SMS et géolocalisation
    |
    */

    'services' => [
        // Configuration Twilio pour SMS
        'twilio' => [
            'enabled' => env('TWILIO_ENABLED', false),
            'sid' => env('TWILIO_SID'),
            'token' => env('TWILIO_TOKEN'),
            'from' => env('TWILIO_FROM'),
        ],
        
        // Services de géolocalisation IP
        'geolocation' => [
            'enabled' => env('GEOLOCATION_ENABLED', false),
            'service' => env('GEOLOCATION_SERVICE', 'ipapi'), // ipapi, maxmind, etc.
            'api_key' => env('GEOLOCATION_API_KEY'),
        ],
        
        // Détection de VPN/Proxy
        'vpn_detection' => [
            'enabled' => env('VPN_DETECTION_ENABLED', false),
            'service' => env('VPN_DETECTION_SERVICE', 'ipqualityscore'),
            'api_key' => env('VPN_DETECTION_API_KEY'),
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Logs et Audit
    |--------------------------------------------------------------------------
    |
    | Configuration pour le système de logs de sécurité
    |
    */

    'logging' => [
        // Durée de conservation des logs (en jours)
        'retention_days' => 365,
        
        // Niveaux de log à conserver
        'log_levels' => ['info', 'warning', 'critical'],
        
        // Actions à logger obligatoirement
        'always_log' => [
            'login', 'logout', 'failed_login',
            'setup_2fa', 'disable_2fa',
            'withdrawal', 'large_transaction',
            'password_change', 'email_change',
            'account_locked', 'suspicious_activity'
        ],
        
        // Compression automatique des anciens logs
        'auto_compress_after_days' => 30,
        
        // Export automatique pour compliance
        'auto_export' => [
            'enabled' => false,
            'format' => 'json', // json, csv
            'frequency' => 'monthly', // daily, weekly, monthly
            'destination' => 'storage/security-exports'
        ]
    ],

    /*
    |--------------------------------------------------------------------------
    | Maintenance et Nettoyage
    |--------------------------------------------------------------------------
    |
    | Configuration pour la maintenance automatique
    |
    */

    'maintenance' => [
        // Nettoyage automatique
        'auto_cleanup' => [
            'expired_codes' => true,
            'old_logs' => true,
            'used_tokens' => true,
        ],
        
        // Fréquence de nettoyage (cron expression)
        'cleanup_schedule' => '0 2 * * *', // Tous les jours à 2h du matin
        
        // Optimisation des performances
        'performance' => [
            'cache_security_stats' => true,
            'cache_duration_minutes' => 15,
            'batch_size_for_operations' => 1000,
        ]
    ]

];