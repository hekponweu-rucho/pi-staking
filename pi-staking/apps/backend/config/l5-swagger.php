<?php

return [
    'default' => 'default',

    'documentations' => [
        'default' => [
            'api' => [
                'title' => 'Pi Staking API',
                'version' => '1.0.0',
            ],

            'routes' => [
                'api' => 'api/documentation',
                'middleware' => ['web'],
            ],

            'paths' => [
                'use_absolute_path' => false,
                'docs_json' => 'api-docs/openapi.json',
                'docs_yaml' => false,
                'format_to_use_for_docs' => 'json',
                'annotations' => [
                    base_path('app'),
                ],
                'base' => env('L5_SWAGGER_BASE_PATH', null),
                'excludes' => [],
            ],

            'generate_always' => env('L5_SWAGGER_GENERATE_ALWAYS', false),
            'swagger_version' => '3.0',

            'proxy' => false,
        ],
    ],

    'defaults' => [
        'routes' => [
            'api' => 'api/documentation',
            'middleware' => ['web'],
        ],

        'paths' => [
            'docs' => storage_path('api-docs'),
            'docs_json' => 'openapi.json',
            'format_to_use_for_docs' => 'json',
            'annotations' => [
                base_path('app'),
            ],
        ],
    ],
];
