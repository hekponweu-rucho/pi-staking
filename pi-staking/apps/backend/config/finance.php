<?php

return [
    'rounding_mode' => env('FINANCE_ROUNDING_MODE', 'half_even'),
    'scale' => (int) env('FINANCE_SCALE', 8),
];
