<?php

return [
    /*
    | Identity provider (bbos) usato per il "Accedi con bbos".
    | Vedi App\Http\Controllers\Auth\SsoLoginController.
    */
    'bbos' => [
        'base_url'      => rtrim((string) env('SSO_BBOS_BASE_URL', ''), '/'),
        'client_id'     => (string) env('SSO_CLIENT_ID', 'holidays'),
        'shared_secret' => (string) env('SSO_SHARED_SECRET'),
        'http_timeout'  => (int) env('SSO_HTTP_TIMEOUT', 10),
    ],
];
