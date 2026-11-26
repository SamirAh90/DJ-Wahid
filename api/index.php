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
    return ['image_url' => 'storage://' . $name, 'preview_url' => photoUrl('storage://' . $name)];
}

function serveWebsiteFile(string $path): never
{
    $file = storageDirectory() . '/' . $path;
    if (!is_file($file)) throw new ApiError('Photo not found.', 404);
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file);
    $size = filesize($file); $start = 0; $end = $size - 1;
    header('Content-Type: ' . $mime);
    header('Accept-Ranges: bytes');
    header('Cache-Control: private, no-cache');
    header("Content-Security-Policy: default-src 'none'; sandbox");
    $range = $_SERVER['HTTP_RANGE'] ?? '';
    if ($range !== '') {
        if (!preg_match('/^bytes=(\d*)-(\d*)$/D', $range, $match) || ($match[1] === '' && $match[2] === '')) {
            http_response_code(416); header('Content-Range: bytes */' . $size); exit;
        }
        if ($match[1] === '') $start = max(0, $size - (int)$match[2]);
        else { $start = (int)$match[1]; if ($match[2] !== '') $end = min($end, (int)$match[2]); }
        if ($start > $end || $start >= $size) { http_response_code(416); header('Content-Range: bytes */' . $size); exit; }
        http_response_code(206); header("Content-Range: bytes $start-$end/$size");
    }
    header('Content-Length: ' . ($end - $start + 1));
    $stream = fopen($file, 'rb'); fseek($stream, $start); $remaining = $end - $start + 1;
    while ($remaining > 0 && !feof($stream) && !connection_aborted()) { $chunk = fread($stream, min(65536, $remaining)); if ($chunk === false || $chunk === '') break; echo $chunk; $remaining -= strlen($chunk); }
    fclose($stream); exit;
}

function uploadWebsiteMedia(): array
{
    $file = $_FILES['media'] ?? null;
    if (!is_array($file) || $file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) throw new ApiError('Upload failed. Check the file size and try again.');
    if ($file['size'] < 1 || $file['size'] > (int)(settings()['upload_max_bytes'] ?? 15728640)) throw new ApiError('The media file exceeds the upload limit.', 413);
    $types = ['image/jpeg'=>'jpg','image/png'=>'png','image/gif'=>'gif','image/webp'=>'webp','image/avif'=>'avif','video/mp4'=>'mp4','application/mp4'=>'mp4','video/webm'=>'webm','audio/mpeg'=>'mp3','audio/ogg'=>'ogg'];
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!isset($types[$mime]) || (str_starts_with($mime, 'image/') && !@getimagesize($file['tmp_name']))) throw new ApiError('Choose an image, MP4/WebM video or MP3/Ogg audio file.');
    $name = bin2hex(random_bytes(16)) . '.' . $types[$mime];
    if (!move_uploaded_file($file['tmp_name'], storageDirectory() . '/' . $name)) throw new ApiError('Photo storage is unavailable.', 503);
    chmod(storageDirectory() . '/' . $name, 0600);
    if (str_starts_with($mime, 'image/')) {
        try { $saved = saveRecord('gallery_photos',['image_url'=>'storage://' . $name,'caption'=>basename($file['name']),'likes'=>0,'comments'=>0,'sort_order'=>0,'published'=>0],null); }
        catch (Throwable $error) { unlink(storageDirectory() . '/' . $name); throw $error; }
        return ['media_url'=>'library:' . $saved['id'], 'preview_url'=>photoUrl('storage://' . $name)];
    }
    $replace=$_POST['replace_media_id']??null;
    $old=null;$id=bin2hex(random_bytes(16));
    db()->beginTransaction();
    try {
        query("SELECT setting_key FROM site_settings WHERE setting_key='admin_bootstrap' FOR UPDATE");
        if($replace!==null){if(!is_string($replace)||!preg_match('/^[a-f0-9]{32}$/D',$replace)||!($old=audiovisualRecord($replace)))throw new ApiError('Media not found.',404);$id=$replace;}
        $type=str_starts_with($mime,'video/')||$mime==='application/mp4'?'video':'audio';
        if($old&&$old['type']!==$type)throw new ApiError('Choose the same media type as the original.');
        writeAudiovisual(['id'=>$id,'title'=>$old['title']??basename($file['name']),'url'=>'storage://'.$name,'type'=>$type]);
        db()->commit();
    }catch(Throwable $error){db()->rollBack();unlink(storageDirectory().'/'.$name);throw $error;}
    if($old&&preg_match('~^storage://([a-f0-9]{32}\.(mp4|webm|mp3|ogg))$~D',$old['url'],$match)){ $oldFile=storageDirectory().'/'.$match[1];if(is_file($oldFile))unlink($oldFile); }
    return ['media_url'=>'av:'.$id, 'preview_url'=>photoUrl('storage://' . $name)];
}

function publicWebsiteMedia(): never
{
    $slot = $_GET['slot'] ?? '';
    if (!is_string($slot) || !preg_match('/^[a-f0-9]{64}$/D', $slot)) throw new ApiError('Photo not found.', 404);
    foreach ((websiteSettings()['config']['media'] ?? []) as $key => $url) {
        if (hash_equals(hash('sha256', $key), $slot) && preg_match('~^storage://([a-f0-9]{32}\.(jpg|png|gif|webp|avif|mp4|mp3|webm|ogg))$~D', $url, $match)) serveWebsiteFile($match[1]);
    }
    throw new ApiError('Photo not found.', 404);
}

function media(): never
{
    $path = $_GET['path'] ?? '';
    $expires = $_GET['expires'] ?? '';
    $signature = $_GET['signature'] ?? '';
    if (!is_string($path) || !preg_match('/^[a-f0-9]{32}\.(jpg|png|gif|webp|avif|bmp|tiff|ico|svg|img|mp4|mp3|webm|ogg)$/D', $path)
        || !is_string($expires) || !ctype_digit($expires) || !is_string($signature)) throw new ApiError('Photo not found.', 404);
    $key = settings()['media_signing_key'] ?? '';
    if (!is_string($key) || strlen($key) < 32) throw new ApiError('Media signing is not configured.', 503);
    if ((int)$expires < time() || (int)$expires > time() + 3600
        || !hash_equals(hash_hmac('sha256', $path . ':' . $expires, $key), $signature)) throw new ApiError('Photo link has expired.', 403);
    serveWebsiteFile($path);
}

try {
    $action = $_GET['action'] ?? '';
    if (!is_string($action)) throw new ApiError('Unknown API action.', 404);
    $getActions = ['content', 'admin-content', 'session', 'media', 'confirm', 'website-media', 'library-image','library-media'];
    $writeActions = ['signin', 'signup', 'signout', 'save-event', 'delete-event', 'save-photo', 'delete-photo', 'upload', 'save-website', 'upload-site-media', 'import-library','import-av-library','delete-library-media','rename-library-media','initialize-website'];
    if (!in_array($action, [...$getActions, ...$writeActions], true)) throw new ApiError('Unknown API action.', 404);
    if (in_array($action, $getActions, true)) {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') throw new ApiError('Method not allowed.', 405);
    } else verifyWrite();

    if ($action === 'media') media();
    if ($action === 'website-media') publicWebsiteMedia();
    if ($action === 'library-image') serveLibraryImage();
    if ($action === 'library-media') serveAudiovisual();
    if ($action === 'confirm') confirmEmail();
    if (in_array($action, ['admin-content', 'save-event', 'delete-event', 'save-photo', 'delete-photo', 'upload', 'save-website', 'upload-site-media', 'import-library','import-av-library','delete-library-media','rename-library-media','initialize-website'], true)) admin();

    $data = in_array($action, $writeActions, true) && !in_array($action, ['upload','upload-site-media'], true) ? input($action === 'save-website' ? 300000 : 65536) : [];
    $result = match ($action) {
        'session' => ['user' => user(), 'csrf_token' => csrf()],
        'content' => siteContent(),
        'admin-content' => siteContent(true),
        'signin' => signin($data),
        'signup' => signup($data),
        'upload' => upload(),
        'save-website' => saveWebsiteSettings($data),
        'upload-site-media' => uploadWebsiteMedia(),
        'import-library' => importImageLibrary(),
        'import-av-library' => importAudiovisual(),
        'delete-library-media' => deleteAudiovisual($data),
        'rename-library-media' => renameAudiovisual($data),
        'initialize-website' => initializeWebsiteContent(),
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
        if (is_string($old) && $old !== $fields['image_url'] && preg_match('~^storage://([a-f0-9]{32}\.(jpg|png|gif|webp|avif|bmp|tiff|ico|svg|img))$~D', $old, $match)
            && !query('SELECT 1 FROM gallery_photos WHERE image_url = ? LIMIT 1',[$old])->fetchColumn()
            && !in_array($old, websiteSettings()['config']['media'] ?? [], true)) {
            $oldFile = storageDirectory() . '/' . $match[1]; if (is_file($oldFile)) unlink($oldFile);
        }
    } elseif ($action === 'delete-photo') {
        $id = recordId($data);
        db()->beginTransaction();
        try {
            query("SELECT setting_key FROM site_settings WHERE setting_key = 'admin_bootstrap' FOR UPDATE");
            $stored = query('SELECT image_url FROM gallery_photos WHERE id = ?', [$id])->fetchColumn();
            $uses = websiteSettings()['config']['media'] ?? [];
            if (in_array('library:' . $id, $uses, true) || ($stored && in_array($stored, $uses, true))) throw new ApiError('This image is used on the website. Choose a replacement before deleting it.');
            query('DELETE FROM gallery_photos WHERE id = ?', [$id]);
            db()->commit();
        } catch (Throwable $error) { db()->rollBack(); throw $error; }
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
