<?php
declare(strict_types=1);
// Copy to <parent-of-domain-document-root>/private/config.php; never to dist/.
return [
    'origin' => 'https://example.com',
    'database' => [
        'host' => 'YOUR_STRATO_DATABASE_HOST',
        'port' => 3306,
        'name' => 'YOUR_DATABASE_NAME',
        'user' => 'YOUR_DATABASE_USER',
        'password' => 'SET_ONLY_IN_PRIVATE_CONFIG',
    ],
    'storage_path' => __DIR__ . '/uploads',
    // Generate locally: php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
    'media_signing_key' => 'REPLACE_WITH_A_RANDOM_64_CHARACTER_HEX_KEY',
    // Set this to your own email before exposing the first-account registration.
    'bootstrap_admin_email' => 'owner@example.com',
    'confirm_email' => true,
    'mail_from' => 'website@example.com',
    'session_days' => 30,
    'upload_max_bytes' => 15 * 1024 * 1024,
];
