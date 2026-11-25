<?php
declare(strict_types=1);
require_once __DIR__ . '/api/content.php';
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$known = in_array($path, ['/', '/admin', '/admin/'], true);
if (!$known) http_response_code(404);
$content = ['events' => [], 'photos' => []];
$home = $path === '/';
if ($home) {
    try { $content = siteContent(); }
    catch (Throwable $error) {
        error_log((string)$error);
        // Preserve the original empty-feed error state without returning stale records.
        http_response_code(503);
    }
}
$template = file_get_contents(__DIR__ . '/templates/' . ($home ? 'home.html' : ($known ? 'admin.html' : 'not-found.html')));
if ($home) {
    $escape = static fn($value): string => htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $eventTemplate = file_get_contents(__DIR__ . '/templates/event.html');
    $photoTemplate = file_get_contents(__DIR__ . '/templates/photo.html');
    $events = '';
    foreach ($content['events'] as $event) {
        $replacements = [];
        foreach (['day_label', 'month_label', 'title', 'description'] as $field) $replacements['__' . strtoupper($field) . '__'] = $escape($event[$field]);
        $events .= strtr($eventTemplate, $replacements);
    }
    $photos = '';
    foreach ($content['photos'] as $photo) {
        $photos .= strtr($photoTemplate, [
            '__IMAGE_URL__' => $escape($photo['image_url']),
            '__CAPTION__' => $escape($photo['caption'] ?: 'DJ Wahid gallery photo'),
            '__LIKES__' => $escape($photo['likes']), '__COMMENTS__' => $escape($photo['comments']),
        ]);
    }
    $template = strtr($template, ['<!--SITE_EVENTS-->' => $events, '<!--SITE_PHOTOS-->' => $photos]);
}
$bootstrap = '<script>window.__SITE_CONTENT__=' . json_encode($content, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR) . ';</script>';
echo str_replace('<!--SITE_BOOTSTRAP-->', $bootstrap, $template);
