<?php
declare(strict_types=1);

final class ApiError extends RuntimeException
{
    public function __construct(string $message, public readonly int $status = 400)
    {
        parent::__construct($message);
    }
}

function settings(): array
{
    static $settings;
    if (isset($settings)) return $settings;
    $file = getenv('SITE_CONFIG_PATH') ?: dirname(__DIR__, 2) . '/private/config.php';
    if (!is_file($file)) throw new ApiError('The backend is not configured yet.', 503);
    $settings = require $file;
    if (!is_array($settings) || !filter_var($settings['origin'] ?? '', FILTER_VALIDATE_URL)) {
        throw new ApiError('The backend is not configured yet.', 503);
    }
    return $settings;
}

function db(): PDO
{
    static $connection;
    if (isset($connection)) return $connection;
    $config = settings()['database'];
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $config['host'], $config['port'] ?? 3306, $config['name']);
    $connection = new PDO($dsn, $config['user'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $connection->exec("SET time_zone = '+00:00'");
    return $connection;
}

function query(string $sql, array $params = []): PDOStatement
{
    $statement = db()->prepare($sql);
    $statement->execute($params);
    return $statement;
}

function uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 15) | 64);
    $bytes[8] = chr((ord($bytes[8]) & 63) | 128);
    $hex = bin2hex($bytes);
    return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4)
        . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
}

function cookie(string $name, string $value, int $expires): void
{
    setcookie($name, $value, [
        'expires' => $expires, 'path' => '/',
        'secure' => parse_url(settings()['origin'], PHP_URL_SCHEME) === 'https',
        'httponly' => true, 'samesite' => 'Lax',
    ]);
}

function csrf(): string
{
    $token = $_COOKIE['dj_csrf'] ?? '';
    if (!preg_match('/^[a-f0-9]{64}$/D', $token)) {
        $token = bin2hex(random_bytes(32));
        cookie('dj_csrf', $token, time() + 30 * 86400);
    }
    return $token;
}

function verifyWrite(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new ApiError('Method not allowed.', 405);
    $expected = rtrim(settings()['origin'], '/');
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== $expected) throw new ApiError('Invalid request origin.', 403);
    if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') throw new ApiError('Invalid request origin.', 403);
    $token = $_COOKIE['dj_csrf'] ?? '';
    if (!preg_match('/^[a-f0-9]{64}$/D', $token)
        || !hash_equals($token, $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) {
        throw new ApiError('Invalid request token. Refresh the page and try again.', 403);
    }
}

function input(): array
{
    if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
        throw new ApiError('Expected a JSON request.', 415);
    }
    $raw = file_get_contents('php://input', false, null, 0, 65537);
    if ($raw === false || strlen($raw) > 65536) throw new ApiError('Request is too large.', 413);
    try { $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR); }
    catch (JsonException) { throw new ApiError('Invalid JSON request.'); }
    if (!is_array($data) || !str_starts_with(ltrim($raw), '{')) throw new ApiError('Invalid request.');
    return $data;
}

function user(): ?array
{
    $token = $_COOKIE['dj_session'] ?? '';
    if (!preg_match('/^[a-f0-9]{64}$/D', $token)) return null;
    $row = query('SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() AND u.confirmed = 1',
        [hash('sha256', $token)])->fetch();
    return $row ?: null;
}

function admin(): array
{
    $user = user();
    if (!$user) throw new ApiError('Unauthorized: Please sign in.', 401);
    if (!query("SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'", [$user['id']])->fetchColumn()) {
        throw new ApiError('Admin access is required for this action.', 403);
    }
    return $user;
}

function establishSession(string $id): void
{
    $expires = time() + max(1, min(90, (int)(settings()['session_days'] ?? 30))) * 86400;
    $old = $_COOKIE['dj_session'] ?? '';
    if ($old !== '') query('DELETE FROM sessions WHERE token_hash = ?', [hash('sha256', $old)]);
    $token = bin2hex(random_bytes(32));
    query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
        [hash('sha256', $token), $id, gmdate('Y-m-d H:i:s', $expires)]);
    query('DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()');
    cookie('dj_session', $token, $expires);
}

function throttle(string $scope, string $key, int $limit): void
{
    $hash = hash('sha256', $scope . ':' . $key);
    query('INSERT INTO rate_limits (key_hash, attempts, expires_at) VALUES (?, 1, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE))
        ON DUPLICATE KEY UPDATE attempts = IF(expires_at <= UTC_TIMESTAMP(), 1, attempts + 1),
        expires_at = IF(expires_at <= UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE), expires_at)', [$hash]);
    if ((int)query('SELECT attempts FROM rate_limits WHERE key_hash = ?', [$hash])->fetchColumn() > $limit) {
        throw new ApiError('Too many attempts. Please try again later.', 429);
    }
    query('DELETE FROM rate_limits WHERE expires_at <= UTC_TIMESTAMP()');
}

function credentials(array $data): array
{
    $email = strtolower(trim(is_string($data['email'] ?? null) ? $data['email'] : ''));
    $password = is_string($data['password'] ?? null) ? $data['password'] : '';
    if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) throw new ApiError('Enter a valid email address.');
    if (strlen($password) < 6 || strlen($password) > 72) throw new ApiError('Password must contain 6 to 72 bytes.');
    return [$email, $password];
}

function recordId(array $data): string
{
    $id = $data['id'] ?? '';
    if (!is_string($id) || !preg_match('/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/Di', $id)) {
        throw new ApiError('Invalid record ID.');
    }
    return $id;
}

function textField(array $data, string $key, int $max = 65535): string
{
    if (!is_string($data[$key] ?? null) || strlen($data[$key]) > $max) throw new ApiError('Invalid field: ' . $key);
    return trim($data[$key]);
}

function boolField(array $data, string $key): int
{
    if (!is_bool($data[$key] ?? null)) throw new ApiError('Invalid field: ' . $key);
    return (int)$data[$key];
}

function intField(array $data, string $key, bool $nonnegative = false): int
{
    $value = $data[$key] ?? null;
    if ((!is_float($value) && !is_int($value)) || !is_finite((float)$value) || abs($value) > 2147483647) {
        throw new ApiError('Invalid field: ' . $key);
    }
    $rounded = (int)floor($value + 0.5);
    return $nonnegative ? max(0, $rounded) : $rounded;
}

function storageDirectory(): string
{
    $directory = settings()['storage_path'] ?? '';
    if (!is_string($directory) || $directory === '') throw new ApiError('Photo storage is not configured.', 503);
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new ApiError('Photo storage is unavailable.', 503);
    }
    $real = realpath($directory);
    $public = realpath(dirname(__DIR__));
    if ($real === false || $public === false || str_starts_with(strtolower(str_replace('\\', '/', $real)) . '/', strtolower(str_replace('\\', '/', $public)) . '/')) {
        throw new ApiError('Photo storage must be outside the document root.', 503);
    }
    return $real;
}
