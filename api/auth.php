<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

function signup(array $data): array
{
    [$email, $password] = credentials($data);
    throttle('signup-ip', $_SERVER['REMOTE_ADDR'] ?? 'unknown', 20);
    $config = settings();
    $confirm = (bool)($config['confirm_email'] ?? true);
    $from = $config['mail_from'] ?? '';
    if ($confirm && !filter_var($from, FILTER_VALIDATE_EMAIL)) throw new ApiError('Email delivery is not configured.', 503);
    $id = uuid();
    $token = bin2hex(random_bytes(32));
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    db()->beginTransaction();
    try {
        // Serializes first-admin creation, including simultaneous requests.
        query("SELECT setting_value FROM site_settings WHERE setting_key = 'admin_bootstrap' FOR UPDATE");
        $hasAdmin = (bool)query("SELECT 1 FROM user_roles WHERE role = 'admin' LIMIT 1")->fetchColumn();
        if (!$hasAdmin) {
            $owner = strtolower(trim($config['bootstrap_admin_email'] ?? ''));
            if (!filter_var($owner, FILTER_VALIDATE_EMAIL) || !hash_equals($owner, $email)) {
                throw new ApiError('Use the configured owner email to create the first admin account.', 403);
            }
        }
        if (query('SELECT 1 FROM users WHERE email = ?', [$email])->fetchColumn()) throw new ApiError('An account with this email already exists.');
        query('INSERT INTO users (id, email, password_hash, confirmed, confirmation_hash, confirmation_expires)
            VALUES (?, ?, ?, ?, ?, ?)', [$id, $email, $passwordHash, (int)!$confirm,
            $confirm ? hash('sha256', $token) : null, $confirm ? gmdate('Y-m-d H:i:s', time() + 86400) : null]);
        if (!$hasAdmin) query("INSERT INTO user_roles (user_id, role) VALUES (?, 'admin')", [$id]);
        // Do not leave an unusable first admin account after a local mail failure.
        if ($confirm) {
            $link = rtrim($config['origin'], '/') . '/api/index.php?action=confirm&token=' . $token;
            if (!mail($email, 'Confirm your DJ Wahid account', "Confirm your email address:\n\n$link\n\nThis link expires in 24 hours.",
                ['From' => $from, 'Content-Type' => 'text/plain; charset=UTF-8'])) {
                throw new ApiError('Could not send the confirmation email. Please try again later.', 503);
            }
        }
        db()->commit();
    } catch (Throwable $error) {
        if (db()->inTransaction()) db()->rollBack();
        throw $error;
    }
    if (!$confirm) establishSession($id);
    return ['session' => !$confirm];
}

function signin(array $data): array
{
    [$email, $password] = credentials($data);
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    throttle('signin-ip', $ip, 200);
    throttle('signin-account', $email, 20);
    $row = query('SELECT id, password_hash, confirmed FROM users WHERE email = ?', [$email])->fetch();
    // Use the same password verification work for unknown accounts.
    $dummy = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi';
    $valid = password_verify($password, $row['password_hash'] ?? $dummy);
    if (!$row || !$valid) throw new ApiError('Invalid login credentials.', 401);
    if (!(bool)$row['confirmed']) throw new ApiError('Email not confirmed.', 403);
    if (password_needs_rehash($row['password_hash'], PASSWORD_DEFAULT)) {
        query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $row['id']]);
    }
    establishSession($row['id']);
    return ['ok' => true];
}

function confirmEmail(): never
{
    $token = $_GET['token'] ?? '';
    if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/D', $token)) throw new ApiError('Invalid confirmation link.');
    $statement = query('UPDATE users SET confirmed = 1, confirmation_hash = NULL, confirmation_expires = NULL
        WHERE confirmation_hash = ? AND confirmation_expires > UTC_TIMESTAMP()', [hash('sha256', $token)]);
    if (!$statement->rowCount()) throw new ApiError('This confirmation link is invalid or expired.');
    header('Location: /admin', true, 303);
    exit;
}
