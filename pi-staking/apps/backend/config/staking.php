<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Staking Configuration - Progressive Rewards Model
    |--------------------------------------------------------------------------
    */

    'rates' => [
        'discovery' => env('RATE_DISCOVERY', 0.025),
        'bronze' => env('RATE_BRONZE', 0.008),
        'silver' => env('RATE_SILVER', 0.005),
        'gold' => env('RATE_GOLD', 0.003),
        'diamond' => env('RATE_DIAMOND', 0.002),
    ],

    'levels' => [
        'bronze' => env('LEVEL_BRONZE_THRESHOLD', 500),
        'silver' => env('LEVEL_SILVER_THRESHOLD', 2500),
        'gold' => env('LEVEL_GOLD_THRESHOLD', 10000),
        'diamond' => env('LEVEL_DIAMOND_THRESHOLD', 50000),
    ],

    'bonus' => [
        'discovery_amount' => env('BONUS_DISCOVERY_AMOUNT', 50),
        'discovery_days' => env('BONUS_DISCOVERY_DAYS', 30),
        'expiration_days' => env('BONUS_EXPIRATION_DAYS', 90),
    ],

    'withdrawals' => [
        'min_amount' => env('WITHDRAWAL_MIN_AMOUNT', 20),
        'max_daily' => env('WITHDRAWAL_MAX_DAILY', 10000),
    ],

    'referrals' => [
        'enabled' => env('REFERRAL_BONUS_ENABLED', true),
        'bonus_amount' => env('REFERRAL_BONUS_AMOUNT', 25),
        'bonus_percentage' => env('REFERRAL_BONUS_PERCENTAGE', 0.05),
    ],

    'monitoring' => [
        'enabled' => env('MONITORING_ENABLED', true),
        'interval' => env('MONITORING_INTERVAL', 300), // 5 minutes
        'liquidity_warning_threshold' => env('LIQUIDITY_WARNING_THRESHOLD', 0.15),
        'liquidity_critical_threshold' => env('LIQUIDITY_CRITICAL_THRESHOLD', 0.05),
    ],

    'security' => [
        'max_login_attempts' => env('MAX_LOGIN_ATTEMPTS', 5),
        'rate_limit_claims' => env('RATE_LIMIT_CLAIMS', 10),
        'rate_limit_api' => env('RATE_LIMIT_API', 60),
    ],

    'streak_bonuses' => [
        // Bonus appliqués selon la longueur du streak
        7 => 0.01,   // +1% après 7 jours consécutifs
        14 => 0.02,  // +2% après 14 jours
        30 => 0.03,  // +3% après 30 jours
        60 => 0.05,  // +5% après 60 jours
        90 => 0.07,  // +7% après 90 jours
        365 => 0.10, // +10% après 365 jours
    ],

    'loyalty_points' => [
        'per_claim' => 10,
        'per_referral' => 100,
        'per_investment_pi' => 1, // 1 point per Pi invested
    ],

    // Limites du système pour éviter l'abus
    'limits' => [
        'max_concurrent_investments' => 10,
        'max_daily_claims' => 50,
        'max_referrals_per_day' => 10,
    ],

    // Configuration pour les ajustements automatiques de taux
    'auto_adjustments' => [
        'enabled' => true,
        'max_decrease_per_adjustment' => 0.1, // Max 10% de réduction par ajustement
        'min_rate' => 0.001, // Taux minimum autorisé
        'cooldown_hours' => 6, // Temps minimum entre ajustements
    ],
];