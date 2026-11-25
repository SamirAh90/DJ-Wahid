<?php
declare(strict_types=1);
// PHP's local server does not read .htaccess. This router approximates its paths;
// Apache rewrite, compression and HTTPS behavior still need a hosting smoke test.
$root = realpath($_SERVER['DOCUMENT_ROOT']);
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
if (str_contains($path, "\0") || str_contains($path, '\\') || preg_match('~(^|/)\.~', $path)
    || preg_match('~^/(templates|private|src|database|node_modules|server|scripts|config)(/|$)~', $path)
    || preg_match('~^/api/(bootstrap|content|auth)\.php$~', $path)
    || preg_match('~\.(env|ini|log|sql|bak|map|json)$~', $path)) {
    http_response_code(403); exit;
}
if (preg_match('~^/__l5e/assets-v1/[^/]+/(hero-dj-[123]\.png|dj-portrait-[12]\.jpg|dj-decks-[12]\.jpg)$~', $path, $match)) {
    $filename = str_starts_with($match[1], 'hero-dj-') ? str_replace('.png', '.webp', $match[1]) : $match[1];
    $file = $root . '/images/' . $filename;
    if (!is_file($file)) { http_response_code(404); exit; }
    header('Content-Type: ' . (str_ends_with($file, '.webp') ? 'image/webp' : 'image/jpeg'));
    readfile($file); return true;
}
if (str_starts_with($path, '/api/')) {
    if ($path !== '/api/index.php') { http_response_code(404); exit; }
    require $root . '/api/index.php'; return true;
}
$file = realpath($root . $path);
if ($file && str_starts_with($file, $root . DIRECTORY_SEPARATOR) && is_file($file) && !str_ends_with($file, '.php')) return false;
if (preg_match('~^/(assets|images|fonts|__l5e)(/|$)~', $path)) { http_response_code(404); exit; }
if (is_file($root . '/index.php')) { require $root . '/index.php'; return true; }
http_response_code(404);
