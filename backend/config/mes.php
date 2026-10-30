<?php

declare(strict_types=1);

return [
    'timezone' => env('MES_TIMEZONE', 'Europe/Warsaw'),
    'hsts' => [
        'max_age' => (int) env('MES_HSTS_MAX_AGE', 31536000),
        'include_subdomains' => (bool) env('MES_HSTS_INCLUDE_SUBDOMAINS', false),
    ],
];
