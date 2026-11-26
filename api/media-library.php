<?php
declare(strict_types=1);

function libraryInitialized(): bool {
    return (bool)query("SELECT setting_value FROM site_settings WHERE setting_key = 'media_library_initialized'")->fetchColumn();
}

function importImageLibrary(): array {
    $directory = realpath(getenv('SITE_PUBLIC_IMAGES_PATH') ?: dirname(__DIR__) . '/images');
    if (!$directory) throw new ApiError('The website image folder is unavailable.');
    $files = array_map(fn($photo)=>['photo'=>$photo,'directory'=>$directory,'gallery'=>true],readPublicGallery($directory));
    $posters=realpath((getenv('SITE_PUBLIC_MEDIA_PATH')?:dirname(__DIR__)).'/videos');
    if($posters)foreach(readPublicGallery($posters) as $photo){$photo['image_url']=str_replace('/images/','/videos/',$photo['image_url']);$files[]=['photo'=>$photo,'directory'=>$posters,'gallery'=>false];}
    $created = []; $count = 0;
    db()->beginTransaction();
    try {
        query("SELECT setting_key FROM site_settings WHERE setting_key = 'admin_bootstrap' FOR UPDATE");
        $current = websiteSettings(); $config = $current['config'];
        $config['languages'] ??= ['en'=>true,'sv'=>true,'default'=>'en'];
        foreach ($files as $entry) {
            $photo=$entry['photo'];$folder=$entry['directory'];
            $source = $photo['image_url'];
            $mapping = 'lib_' . substr(hash('sha256', $source), 0, 56);
            if (query('SELECT setting_value FROM site_settings WHERE setting_key = ?', [$mapping])->fetchColumn()) continue;
            $name = basename(rawurldecode($source));
            $file = realpath($folder . '/' . $name);
            if (!$file || dirname($file) !== $folder || is_link($folder . '/' . $name)) continue;
            $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file);
            $types = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif','image/avif'=>'avif','image/bmp'=>'bmp','image/tiff'=>'tiff','image/x-icon'=>'ico','image/vnd.microsoft.icon'=>'ico','image/svg+xml'=>'svg'];
            if (!isset($types[$mime])) continue;
            $stored = bin2hex(random_bytes(16)) . '.' . $types[$mime];
            $target = storageDirectory() . '/' . $stored;
            if (!copy($file, $target)) throw new ApiError('Could not import a website image.');
            chmod($target, 0600); $created[] = $target;
            $saved = saveRecord('gallery_photos', ['image_url'=>'storage://' . $stored,'caption'=>pathinfo($name, PATHINFO_FILENAME),'likes'=>0,'comments'=>0,'sort_order'=>$photo['sort_order'],'published'=>$entry['gallery']?1:0], null);
            query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)', [$mapping, $saved['id']]);
            // Connect current site images to their database records without changing their appearance.
            $core = ['/images/hero-dj-1.webp','/images/hero-dj-2.webp','/images/hero-dj-3.webp','/images/dj-portrait-1.jpg','/videos/news-1.jpg','/videos/news-2.jpg','/videos/news-3.jpg'];
            if (in_array($source, $core, true) && (empty($config['media'][$source]) || $config['media'][$source] === $source)) $config['media'][$source] = 'library:' . $saved['id'];
            $count++;
        }
        query("INSERT INTO site_settings (setting_key, setting_value) VALUES ('media_library_initialized', '1') ON DUPLICATE KEY UPDATE setting_value = '1'");
        writeWebsiteDocument($config);
        db()->commit();
        return ['imported'=>$count];
    } catch (Throwable $error) {
        db()->rollBack();
        foreach ($created as $file) if (is_file($file)) unlink($file);
        throw $error;
    }
}

function libraryImageUrl(string $id): string { return '/api/index.php?action=library-image&id=' . rawurlencode($id); }
function serveLibraryImage(): never {
    $id = $_GET['id'] ?? '';
    if (!is_string($id) || !preg_match('/^[a-f0-9-]{36}$/D', $id)) throw new ApiError('Photo not found.',404);
    $photo = query('SELECT image_url, published FROM gallery_photos WHERE id = ?',[$id])->fetch();
    $used = in_array('library:' . $id, websiteSettings()['config']['media'] ?? [], true);
    if (!$photo || (!$photo['published'] && !$used)) throw new ApiError('Photo not found.',404);
    if (!preg_match('~^storage://([a-f0-9]{32}\.(jpg|png|gif|webp|avif|bmp|tiff|ico|svg|img))$~D',$photo['image_url'],$match)) throw new ApiError('Photo not found.',404);
    serveWebsiteFile($match[1]);
}
