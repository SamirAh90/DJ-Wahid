<?php
declare(strict_types=1);

function websiteSettings(): array {
    $rows = query("SELECT setting_key, setting_value FROM site_settings WHERE LEFT(setting_key, 4) = 'cms_' ORDER BY setting_key")->fetchAll();
    $encoded = ''; $version = '';
    foreach ($rows as $row) {
        if ($row['setting_key'] === 'cms_revision') $version = $row['setting_value'];
        else $encoded .= $row['setting_value'];
    }
    $data = $encoded ? json_decode(base64_decode($encoded, true) ?: '', true, 64, JSON_THROW_ON_ERROR) : [];
    return ['config' => $data, 'version' => $version];
}

function writeWebsiteDocument(array $config): array {
    $json = json_encode($config, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    query("DELETE FROM site_settings WHERE LEFT(setting_key, 4) = 'cms_'");
    foreach (str_split(base64_encode($json), 240) as $index => $chunk) query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)', ['cms_' . sprintf('%05d', $index), $chunk]);
    $version = hash('sha256', $json);
    query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)', ['cms_revision', $version]);
    return ['config'=>$config,'version'=>$version];
}

function initializeWebsiteContent(): array {
    $defaults=json_decode(file_get_contents(dirname(__DIR__).'/templates/editor-defaults.json'),true,32,JSON_THROW_ON_ERROR);
    db()->beginTransaction();
    try {
        query("SELECT setting_key FROM site_settings WHERE setting_key='admin_bootstrap' FOR UPDATE");
        $config=websiteSettings()['config'];$config['languages']??=['en'=>true,'sv'=>true,'default'=>'en'];
        foreach($defaults['texts'] as $key=>$translations)foreach($translations as $language=>$text)if(!isset($config['texts'][$key][$language]))$config['texts'][$key][$language]=$text;
        foreach($defaults['media'] as $key=>$url)if(!isset($config['media'][$key]))$config['media'][$key]=$url;
        foreach(($defaults['privacy']??[]) as $language=>$text)if(!isset($config['privacy'][$language]))$config['privacy'][$language]=$text;
        foreach(($defaults['privacyTitles']??[]) as $language=>$text)if(!isset($config['privacyTitles'][$language]))$config['privacyTitles'][$language]=$text;
        $config['seo']??=$defaults['seo'];
        $saved=writeWebsiteDocument($config);
        query("INSERT INTO site_settings (setting_key,setting_value) VALUES ('website_content_initialized','1') ON DUPLICATE KEY UPDATE setting_value='1'");
        db()->commit();return $saved;
    }catch(Throwable $error){db()->rollBack();throw $error;}
}

function saveWebsiteSettings(array $data): array {
    $config = $data['config'] ?? null;
    if (!is_array($config)) throw new ApiError('Invalid website settings.');
    foreach (['sections','texts','media','privacy','privacyTitles','seo'] as $key) if (isset($config[$key]) && !is_array($config[$key])) throw new ApiError('Invalid website settings.');
    foreach(($config['privacyTitles']??[]) as $language=>$text)if(!in_array($language,['en','sv'],true)||!is_string($text)||strlen($text)>1000)throw new ApiError('Invalid privacy policy.');
    foreach (($config['seo'] ?? []) as $lang => $copy) {
        if (!in_array($lang,['en','sv'],true) || !is_array($copy)) throw new ApiError('Invalid website settings.');
        foreach ($copy as $field => $text) if (!in_array($field,['title','description'],true) || !is_string($text) || preg_match_all('/./us', $text) > ($field === 'title' ? 120 : 400)) throw new ApiError('Invalid website settings.');
    }
    foreach (($config['privacy'] ?? []) as $lang => $text) if (!in_array($lang, ['en','sv'], true) || !is_string($text) || strlen($text) > 100000) throw new ApiError('Invalid privacy policy.');
    $languages = $config['languages'] ?? [];
    if (!is_array($languages) || !is_bool($languages['en'] ?? null) || !is_bool($languages['sv'] ?? null)
        || (!$languages['en'] && !$languages['sv']) || !in_array($languages['default'] ?? '', ['en', 'sv'], true)
        || !$languages[$languages['default']]) throw new ApiError('Enable at least one language and select an enabled default.');
    $allowedSections = ['home','biography','instagram','events','shop','services','podcast','music','community','news','contact'];
    foreach (($config['sections'] ?? []) as $key => $enabled) {
        if (!in_array($key, $allowedSections, true) || !is_bool($enabled)) throw new ApiError('Invalid section setting.');
    }
    foreach (($config['texts'] ?? []) as $key => $translations) {
        if (!is_string($key) || strlen($key) > 20000 || !is_array($translations)) throw new ApiError('Invalid text setting.');
        foreach ($translations as $lang => $value) if (!in_array($lang, ['en','sv'], true) || !is_string($value) || strlen($value) > 20000) throw new ApiError('Invalid translation.');
    }
    foreach (($config['media'] ?? []) as $source => $url) {
        if (!is_string($source) || !is_string($url) || strlen($source) > 4096 || strlen($url) > 4096
            || ($url !== '' && !preg_match('~^(https?://|/(?!/)|\#[a-zA-Z]|av:[a-f0-9]{32}$|library:[a-f0-9-]{36}$|storage://[a-f0-9]{32}\.(jpg|png|gif|webp|avif|mp4|mp3|webm|ogg)$|tel:\+?[0-9]+$|mailto:[^\s]+$)~i', $url))) throw new ApiError('Use a local path or an HTTP/HTTPS, telephone or email URL.');
        if(str_starts_with($url,'av:')&&!audiovisualRecord(substr($url,3)))throw new ApiError('Choose media from the library.');
        if (str_starts_with($url, 'library:') && !query('SELECT 1 FROM gallery_photos WHERE id = ?', [substr($url,8)])->fetchColumn()) throw new ApiError('Choose an image from the library.');
        if (str_starts_with($url, 'storage://') && !is_file(storageDirectory() . '/' . substr($url, 10))) throw new ApiError('Upload the media file first.');
    }
    $json = json_encode($config, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    if (strlen($json) > 250000) throw new ApiError('Website settings are too large.');
    db()->beginTransaction();
    try {
        query("SELECT setting_key FROM site_settings WHERE setting_key = 'admin_bootstrap' FOR UPDATE");
        $current = websiteSettings();
        if (($data['version'] ?? '') !== $current['version']) throw new ApiError('Settings changed in another window. Reload before saving.', 409);
        foreach (($config['media'] ?? []) as $url) if (str_starts_with($url,'library:') && !query('SELECT 1 FROM gallery_photos WHERE id = ?', [substr($url,8)])->fetchColumn()) throw new ApiError('Choose an image from the library.');
        foreach (($config['media'] ?? []) as $url) if (str_starts_with($url,'av:')&&!audiovisualRecord(substr($url,3)))throw new ApiError('Choose media from the library.');
        $saved = writeWebsiteDocument($config);
        db()->commit();
        return $saved;
    } catch (Throwable $error) { db()->rollBack(); throw $error; }
}
