<?php

return [
    'enabled' => env('METRICS_ENABLED', true),
    'token' => env('METRICS_TOKEN', null),
    'histogram_buckets_ms' => [50, 100, 250, 500, 1000, 2500, 5000, 10000],
];
