<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

function photoUrl(string $value): string
{
    if (!str_starts_with($value, 'storage://')) return $value;
    $path = substr($value, 10);
    $expires = time() + 3600;
    $key = settings()['media_signing_key'] ?? '';
    if (!is_string($key) || strlen($key) < 32) throw new ApiError('Media signing is not configured.', 503);
    $signature = hash_hmac('sha256', $path . ':' . $expires, $key);
    return '/api/index.php?action=media&path=' . rawurlencode($path) . '&expires=' . $expires . '&signature=' . $signature;
}

function siteContent(bool $all = false): array
{
    $where = $all ? '' : ' WHERE published = 1';
    $events = query('SELECT id, day_label, month_label, title, description, location, price, event_date, published
        FROM events' . $where . ' ORDER BY event_date IS NULL, event_date, created_at, id')->fetchAll();
    $photos = query('SELECT id, image_url, caption, likes, comments, sort_order, published
        FROM gallery_photos' . $where . ' ORDER BY sort_order, created_at, id')->fetchAll();
    foreach ($events as &$event) $event['published'] = (bool)$event['published'];
    foreach ($photos as &$photo) {
        $photo['published'] = (bool)$photo['published'];
        foreach (['likes', 'comments', 'sort_order'] as $key) $photo[$key] = (int)$photo[$key];
        $photo['image_url'] = photoUrl($photo['image_url']);
    }
    return ['events' => $events, 'photos' => $photos];
}

function normalizeImage(string $url, ?string $existing = null): string
{
    // Publishing a row from the admin feed must retain its stable private storage key.
    if ($existing !== null && str_starts_with($existing, 'storage://') && str_starts_with($url, '/api/index.php?action=media&')) {
        parse_str(parse_url($url, PHP_URL_QUERY) ?: '', $params);
        if (($params['path'] ?? '') === substr($existing, 10)) return $existing;
    }
    if (preg_match('/^storage:\/\/[a-f0-9]{32}\.(jpg|png|gif|webp|avif|bmp|tiff|ico|svg|img)$/D', $url)) {
        if (!is_file(storageDirectory() . '/' . substr($url, 10))) throw new ApiError('Upload a photo first.');
        return $url;
    }
    if (preg_match('~^/images/[a-zA-Z0-9_.-]+$~D', $url)) return $url;
    if (filter_var($url, FILTER_VALIDATE_URL) && in_array(parse_url($url, PHP_URL_SCHEME), ['http', 'https'], true)) return $url;
    throw new ApiError('Upload a photo first.');
}

function saveRecord(string $table, array $fields, ?string $id): array
{
    // Table and field names are defined by code; all user values are bound parameters.
    if ($id !== null) {
        if (!query("SELECT id FROM $table WHERE id = ?", [$id])->fetchColumn()) throw new ApiError('Record not found.', 404);
        $assignments = implode(', ', array_map(fn($field) => "$field = ?", array_keys($fields)));
        query("UPDATE $table SET $assignments WHERE id = ?", [...array_values($fields), $id]);
    } else {
        $id = uuid();
        $fields = ['id' => $id] + $fields;
        $columns = implode(', ', array_keys($fields));
        $placeholders = implode(', ', array_fill(0, count($fields), '?'));
        query("INSERT INTO $table ($columns) VALUES ($placeholders)", array_values($fields));
    }
    return ['id' => $id];
}

function eventFields(array $data): array
{
    $fields = [];
    foreach (['day_label' => 32, 'month_label' => 32, 'title' => 255, 'description' => 65535, 'location' => 255, 'price' => 255] as $key => $max) {
        $fields[$key] = textField($data, $key, $max);
    }
    if (!$fields['title']) throw new ApiError('Give the event a title.');
    if (!$fields['day_label'] || !$fields['month_label']) throw new ApiError('Add a day and a month.');
    $date = $data['event_date'] ?? null;
    if ($date !== null) {
        $parsed = is_string($date) ? DateTimeImmutable::createFromFormat('!Y-m-d', $date) : false;
        if (!$parsed || $parsed->format('Y-m-d') !== $date || $date < '1000-01-01') throw new ApiError('Invalid event date.');
    }
    $fields['event_date'] = $date;
    $fields['published'] = boolField($data, 'published');
    return $fields;
}
