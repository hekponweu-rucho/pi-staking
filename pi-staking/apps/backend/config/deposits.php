<?php

return [
    'provider' => env('DEPOSITS_PROVIDER', 'testnet'),
    'reservation_ttl_minutes' => (int) env('DEPOSITS_RESERVATION_TTL', 15),
    'confirmations_required' => (int) env('DEPOSITS_CONFIRMATIONS', 1),
    'deposit_min' => (float) env('DEPOSITS_MIN', 10),
    'deposit_max' => (float) env('DEPOSITS_MAX', 5000),
    'policy_on_rerequest' => env('DEPOSITS_POLICY_ON_REREQUEST', 'refuse'),
    'pi_api_url' => env('PI_API_URL'),
    'pi_api_key' => env('PI_API_KEY'),
];