<?php
declare(strict_types=1);
// Integration tests write ONLY to an explicitly configured loopback *_test database.
require_once __DIR__ . '/../api/bootstrap.php';
$config = settings();
if (!in_array(parse_url($config['origin'], PHP_URL_HOST), ['127.0.0.1', 'localhost'], true)
    || !str_ends_with($config['database']['name'], '_test') || ($config['confirm_email'] ?? true)) {
    fwrite(STDERR, "Use a disposable loopback *_test database with confirm_email=false.\n"); exit(1);
}
$base = rtrim($config['origin'], '/');
$cookies = [];
$csrf = '';
$checks = 0;
$createdEvents = [];
$createdPhotos = [];
$createdUsers = [];
$paths = [];

function check(bool $condition, string $message): void
{
    global $checks;
    if (!$condition) throw new RuntimeException($message);
    $checks++;
}

function request(string $action, mixed $data = null, array $extra = [], ?string $raw = null, ?string $type = null): array
{
    global $base, $cookies, $csrf;
    $headers = ['Origin' => $base, 'Cookie' => implode('; ', array_map(fn($k, $v) => "$k=$v", array_keys($cookies), $cookies))];
    if ($data !== null || $raw !== null) $headers += ['X-CSRF-Token' => $csrf, 'Content-Type' => $type ?? 'application/json'];
    $headers = array_replace($headers, $extra);
    $context = stream_context_create(['http' => [
        'method' => $data === null && $raw === null ? 'GET' : 'POST', 'ignore_errors' => true,
        'timeout' => 20, 'header' => implode("\r\n", array_map(fn($k, $v) => "$k: $v", array_keys($headers), $headers)),
        'content' => $raw ?? ($data !== null ? json_encode($data) : ''),
    ]]);
    $body = file_get_contents($base . '/api/index.php?action=' . $action, false, $context);
    $status = (int)explode(' ', $http_response_header[0])[1];
    foreach ($http_response_header as $header) {
        if (preg_match('/^Set-Cookie: ([^=]+)=([^;]*)/i', $header, $match)) $cookies[$match[1]] = $match[2];
    }
    return [$status, json_decode($body, true), $body, $http_response_header];
}

try {
    check((int)query('SELECT COUNT(*) FROM users')->fetchColumn() === 0, 'Start with an empty test users table.');
    [$status, $session] = request('session');
    check($status === 200 && $session['user'] === null, 'Anonymous session');
    $csrf = $session['csrf_token'];
    check(strlen($csrf) === 64, 'CSRF token length');
    check(request('admin-content')[0] === 401, 'Anonymous admin access blocked');
    check(request('signin', ['email' => 'x@example.test', 'password' => 'abcdef'], ['X-CSRF-Token' => ''])[0] === 403, 'CSRF enforced');
    check(request('signin', ['email' => 'x@example.test', 'password' => 'abcdef'], ['Origin' => 'https://attacker.invalid'])[0] === 403, 'Origin enforced');
    check(request('signup', ['email' => 'intruder@example.test', 'password' => 'abcdef'])[0] === 403, 'First admin restricted to configured owner');
    $email = $config['bootstrap_admin_email'];
    [$status, $signup] = request('signup', ['email' => $email, 'password' => 'migration-test-password']);
    check($status === 200 && $signup['session'], 'Owner signup and automatic sign-in');
    $createdUsers[] = $email;
    check((int)query("SELECT COUNT(*) FROM user_roles WHERE role='admin'")->fetchColumn() === 1, 'First account gets admin role');
    check(request('admin-content')[0] === 200, 'Admin authenticated');
    $event = ['day_label' => '01', 'month_label' => 'Jan', 'title' => "  Test <script>alert('x')</script>  ",
        'description' => "Quotes ' & \" and Unicode åäö 🎵", 'location' => 'Stockholm', 'price' => '$5', 'event_date' => '2027-01-01', 'published' => false];
    [$status, $saved] = request('save-event', $event);
    check($status === 200 && isset($saved['id']), 'Create hidden event');
    $id = $saved['id']; $createdEvents[] = $id;
    [$status, $feed] = request('content');
    check($status === 200 && !in_array($id, array_column($feed['events'], 'id')), 'Hidden event excluded from public feed');
    $event['id'] = $id; $event['published'] = true;
    check(request('save-event', $event)[0] === 200, 'Update/publish event');
    [, $feed] = request('content');
    $savedEvent = array_values(array_filter($feed['events'], fn($e) => $e['id'] === $id))[0];
    check($savedEvent['title'] === trim($event['title']) && $savedEvent['description'] === $event['description'], 'Trim and Unicode/quotes round trip');
    $home = file_get_contents($base . '/');
    check(str_contains($home, '&lt;script&gt;') && !str_contains($home, "<script>alert('x')</script>"), 'Server-rendered content escapes HTML');
    check(request('save-event', [...$event, 'event_date' => '2027-02-30'])[0] === 400, 'Invalid date rejected');
    check(request('save-event', [...$event, 'title' => ''])[0] === 400, 'Empty title rejected');
    check(request('delete-event', ['id' => "' OR 1=1 --"])[0] === 400, 'Invalid ID / SQL injection rejected');
    check(request('save-event', null, [], '{invalid')[0] === 400, 'Invalid JSON rejected');

    $boundary = 'migration-' . bin2hex(random_bytes(8));
    $jpg = file_get_contents(__DIR__ . '/../public/images/dj-portrait-1.jpg');
    $multipart = "--$boundary\r\nContent-Disposition: form-data; name=\"photo\"; filename=\"photo.php.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n$jpg\r\n--$boundary--\r\n";
    [$status, $uploaded] = request('upload', null, [], $multipart, "multipart/form-data; boundary=$boundary");
    check($status === 200 && str_starts_with($uploaded['image_url'], 'storage://'), 'Validated private image upload');
    $paths[] = substr($uploaded['image_url'], 10);
    $photo = ['image_url' => $uploaded['image_url'], 'caption' => 'Integration test', 'likes' => -3, 'comments' => 2.6, 'sort_order' => 9, 'published' => false];
    [$status, $saved] = request('save-photo', $photo);
    check($status === 200 && isset($saved['id']), 'Save private photo');
    $photoId = $saved['id']; $createdPhotos[] = $photoId;
    [, $public] = request('content');
    check(!in_array($photoId, array_column($public['photos'], 'id')), 'Hidden photo excluded from public feed');
    [, $admin] = request('admin-content');
    $stored = array_values(array_filter($admin['photos'], fn($p) => $p['id'] === $photoId))[0];
    check($stored['likes'] === 0 && $stored['comments'] === 3, 'Photo numeric normalization');
    check(str_contains($stored['image_url'], 'signature='), 'Private photo gets expiring signed URL');
    check(hash('sha256', file_get_contents($base . $stored['image_url'])) === hash('sha256', $jpg), 'Signed photo bytes preserved');
    check(request('media&path=..%2Fconfig.php&expires=0&signature=x')[0] === 404, 'Media traversal blocked');
    check(request('media&' . substr(strstr($stored['image_url'], '&path='), 1) . 'x')[0] === 403, 'Forged media signature blocked');
    check(request('save-photo', [...$stored, 'published' => true])[0] === 200, 'Publish photo from signed admin feed');
    check(query('SELECT image_url FROM gallery_photos WHERE id = ?', [$photoId])->fetchColumn() === $photo['image_url'], 'Publishing retains stable storage key');
    check(request('save-photo', [...$stored, 'published' => false])[0] === 200, 'Hide photo from signed admin feed');
    $bad = str_replace($jpg, '<?php echo 1; ?>', $multipart);
    check(request('upload', null, [], $bad, "multipart/form-data; boundary=$boundary")[0] === 400, 'Fake image upload rejected');
    check(request('delete-photo', ['id' => $photoId, 'image_url' => '/not-trusted'])[0] === 200, 'Photo deletion uses database storage key');
    check(!is_file($config['storage_path'] . '/' . $paths[0]), 'Deleted photo removed from private storage');
    check(request('delete-event', ['id' => $id])[0] === 200, 'Delete event');
    $oldSession = $cookies['dj_session'];
    check(request('signout', (object)[])[0] === 200 && request('session')[1]['user'] === null, 'Sign out');
    $cookies['dj_session'] = $oldSession;
    check(request('admin-content')[0] === 401, 'Revoked session cannot be reused');
    check(request('signin', ['email' => $email, 'password' => 'incorrect'])[0] === 401, 'Wrong password rejected');
    check(request('signin', ['email' => $email, 'password' => 'migration-test-password'])[0] === 200, 'Sign in with existing password');
    check(request('signup', ['email' => 'viewer@example.test', 'password' => 'viewer-test-password'])[0] === 200, 'Later user signup');
    $createdUsers[] = 'viewer@example.test';
    check(request('admin-content')[0] === 403, 'Non-admin account denied admin feed');
    check(request('save-event', $event)[0] === 403, 'Non-admin account denied mutations');
    echo "$checks API integration checks passed.\n";
} catch (Throwable $error) {
    fwrite(STDERR, "FAIL after $checks checks: " . $error->getMessage() . "\n");
    $failed = true;
} finally {
    foreach ($createdEvents as $id) query('DELETE FROM events WHERE id = ?', [$id]);
    foreach ($createdPhotos as $id) query('DELETE FROM gallery_photos WHERE id = ?', [$id]);
    foreach ($createdUsers as $email) query('DELETE FROM users WHERE email = ?', [$email]);
    foreach ($paths as $path) if (is_file($config['storage_path'] . '/' . $path)) unlink($config['storage_path'] . '/' . $path);
    query('DELETE FROM rate_limits');
}
exit(isset($failed) ? 1 : 0);
