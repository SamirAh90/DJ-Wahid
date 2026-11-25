<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/content.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function upload(): array
{
    $file = $_FILES['photo'] ?? null;
    if (!is_array($file) || $file['error'] !== UPLOAD_ERR_OK) throw new ApiError('Upload failed. Check the file size and try again.');
    $limit = (int)(settings()['upload_max_bytes'] ?? 15728640);
    if ($file['size'] < 1 || $file['size'] > $limit || !is_uploaded_file($file['tmp_name'])) throw new ApiError('Image is too large or invalid.', 413);
    $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp', 'image/avif' => 'avif', 'image/bmp' => 'bmp', 'image/tiff' => 'tiff', 'image/x-icon' => 'ico', 'image/vnd.microsoft.icon' => 'ico', 'image/svg+xml' => 'svg'];
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $image = @getimagesize($file['tmp_name']);
    $valid = str_starts_with($mime, 'image/') && (bool)$image;
    if ($mime === 'image/svg+xml') {
        $svg = new DOMDocument();
        $valid = @$svg->load($file['tmp_name'], LIBXML_NONET) && !$svg->doctype && $svg->documentElement?->localName === 'svg';
    }
    if (!$valid) throw new ApiError('Choose a valid image.');
    $name = bin2hex(random_bytes(16)) . '.' . ($types[$mime] ?? 'img');
    $destination = storageDirectory() . '/' . $name;
    if (!move_uploaded_file($file['tmp_name'], $destination)) throw new ApiError('Photo storage is unavailable.', 503);
    chmod($destination, 0600);
    return ['image_url' => 'storage://' . $name];
}

function media(): never
{
    $path = $_GET['path'] ?? '';
    $expires = $_GET['expires'] ?? '';
    $signature = $_GET['signature'] ?? '';
    if (!is_string($path) || !preg_match('/^[a-f0-9]{32}\.(jpg|png|gif|webp|avif|bmp|tiff|ico|svg|img)$/D', $path)
        || !is_string($expires) || !ctype_digit($expires) || !is_string($signature)) throw new ApiError('Photo not found.', 404);
    $key = settings()['media_signing_key'] ?? '';
    if (!is_string($key) || strlen($key) < 32) throw new ApiError('Media signing is not configured.', 503);
    if ((int)$expires < time() || (int)$expires > time() + 3600
        || !hash_equals(hash_hmac('sha256', $path . ':' . $expires, $key), $signature)) throw new ApiError('Photo link has expired.', 403);
    $file = storageDirectory() . '/' . $path;
    if (!is_file($file)) throw new ApiError('Photo not found.', 404);
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file);
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($file));
    header('Cache-Control: private, max-age=' . max(0, (int)$expires - time()));
    header("Content-Security-Policy: default-src 'none'; sandbox");
    readfile($file);
    exit;
}

try {
    $action = $_GET['action'] ?? '';
    if (!is_string($action)) throw new ApiError('Unknown API action.', 404);
    $getActions = ['content', 'admin-content', 'session', 'media', 'confirm'];
    $writeActions = ['signin', 'signup', 'signout', 'save-event', 'delete-event', 'save-photo', 'delete-photo', 'upload'];
    if (!in_array($action, [...$getActions, ...$writeActions], true)) throw new ApiError('Unknown API action.', 404);
    if (in_array($action, $getActions, true)) {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') throw new ApiError('Method not allowed.', 405);
    } else verifyWrite();

    if ($action === 'media') media();
    if ($action === 'confirm') confirmEmail();
    if (in_array($action, ['admin-content', 'save-event', 'delete-event', 'save-photo', 'delete-photo', 'upload'], true)) admin();

    $data = in_array($action, $writeActions, true) && $action !== 'upload' ? input() : [];
    $result = match ($action) {
        'session' => ['user' => user(), 'csrf_token' => csrf()],
        'content' => siteContent(),
        'admin-content' => siteContent(true),
        'signin' => signin($data),
        'signup' => signup($data),
        'upload' => upload(),
        default => null,
    };
    if ($action === 'signout') {
        query('DELETE FROM sessions WHERE token_hash = ?', [hash('sha256', $_COOKIE['dj_session'] ?? '')]);
        cookie('dj_session', '', time() - 3600);
        $result = ['ok' => true];
    } elseif ($action === 'save-event') {
        $result = saveRecord('events', eventFields($data), isset($data['id']) ? recordId($data) : null);
    } elseif ($action === 'delete-event') {
        query('DELETE FROM events WHERE id = ?', [recordId($data)]);
        $result = ['ok' => true];
    } elseif ($action === 'save-photo') {
        $id = isset($data['id']) ? recordId($data) : null;
        $old = $id ? query('SELECT image_url FROM gallery_photos WHERE id = ?', [$id])->fetchColumn() : null;
        $fields = [
            'image_url' => normalizeImage(textField($data, 'image_url', 4096), is_string($old) ? $old : null),
            'caption' => textField($data, 'caption'),
            'likes' => intField($data, 'likes', true), 'comments' => intField($data, 'comments', true),
            'sort_order' => intField($data, 'sort_order'), 'published' => boolField($data, 'published'),
        ];
        $result = saveRecord('gallery_photos', $fields, $id);
    } elseif ($action === 'delete-photo') {
        $id = recordId($data);
        $stored = query('SELECT image_url FROM gallery_photos WHERE id = ?', [$id])->fetchColumn();
        query('DELETE FROM gallery_photos WHERE id = ?', [$id]);
        if (is_string($stored) && preg_match('/^storage:\/\/([a-f0-9]{32}\.(jpg|png|gif|webp|avif|bmp|tiff|ico|svg|img))$/D', $stored, $match)
            && !query('SELECT 1 FROM gallery_photos WHERE image_url = ? LIMIT 1', [$stored])->fetchColumn()) {
            $file = storageDirectory() . '/' . $match[1];
            if (is_file($file)) unlink($file);
        }
        $result = ['ok' => true];
    }
    echo json_encode($result, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    $status = $error instanceof ApiError ? $error->status : 503;
    http_response_code($status);
    if ($status === 405) header('Allow: ' . (in_array($action ?? '', $getActions ?? [], true) ? 'GET' : 'POST'));
    if (!$error instanceof ApiError) error_log((string)$error);
    echo json_encode(['error' => $error instanceof ApiError ? $error->getMessage() : 'The backend is temporarily unavailable.'], JSON_UNESCAPED_SLASHES);
}
