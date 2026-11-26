<?php
declare(strict_types=1);
function applyWebsiteContent(string $html,array $config,string $language): string {
    $enabled=array_filter(['en','sv'],fn($code)=>$config['languages'][$code]??true);
    if(count($enabled)<2)$html=preg_replace('~<div data-public-language-switcher=""[^>]*>.*?</div>~s','',$html);
    $defaults=json_decode(file_get_contents(__DIR__.'/templates/editor-defaults.json'),true,32,JSON_THROW_ON_ERROR);
    $replacements=[];
    foreach(($config['texts']??[]) as $key=>$translations){
        $baseline=$defaults['texts'][$key][$language]??$key;
        if(isset($translations[$language]))$replacements[preg_replace('/\s+/u',' ',trim($baseline))]=$translations[$language];
    }
    $phone=$config['media']['tel:+46736402445']??'';
    if(str_starts_with($phone,'tel:')&&($config['texts']['0046736402445'][$language]??'0046736402445')==='0046736402445')$replacements['0046736402445']=substr($phone,4);
    $escape=static fn(string $text):string=>htmlspecialchars($text,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
    $html=preg_replace_callback('~>([^<>]*)<~s',function($match)use($replacements,$escape){
        $decoded=html_entity_decode($match[1],ENT_QUOTES|ENT_HTML5,'UTF-8');$key=preg_replace('/\s+/u',' ',trim($decoded));
        if(!array_key_exists($key,$replacements))return $match[0];
        return '>'.(preg_match('/^\s/u',$decoded)?' ':'').$escape($replacements[$key]).(preg_match('/\s$/u',$decoded)?' ':'').'<';
    },$html);
    $assets=[];foreach(($config['media']??[]) as $source=>$url)foreach(['src','poster','href'] as $attribute)$assets[$attribute.'="'.$escape($source).'"']=$attribute.'="'.$escape($url).'"';
    return strtr($html,$assets);
}
function websiteSeo(string $html, array $config, string $language): string {
    $defaults = json_decode(file_get_contents(__DIR__ . '/templates/seo.json'), true, 8, JSON_THROW_ON_ERROR);
    $copy = $defaults[$language];
    foreach (['title','description'] as $field) if (!empty($config['seo'][$language][$field])) $copy[$field] = $config['seo'][$language][$field];
    $escape = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $html = preg_replace_callback('~<title>.*?</title>~s', fn() => '<title>' . $escape($copy['title']) . '</title>', $html);
    $html = preg_replace_callback('~<meta (name="description"|property="og:title"|property="og:description")[^>]*>~', fn($match) => '<meta ' . $match[1] . ' content="' . $escape(str_contains($match[1], 'title') ? $copy['title'] : $copy['description']) . '" />', $html);
    $html = preg_replace('~<html lang="[^"]+"~', '<html lang="' . $language . '"', $html);
    $tags = '<meta property="og:locale" content="' . ($language === 'sv' ? 'sv_SE' : 'en_GB') . '" />'
        . '<meta name="twitter:title" content="' . $escape($copy['title']) . '" /><meta name="twitter:description" content="' . $escape($copy['description']) . '" />';
    $origin = rtrim(settings()['origin'], '/'); $host = parse_url($origin, PHP_URL_HOST);
    $public = str_starts_with($origin, 'https://') && !in_array($host, ['localhost','127.0.0.1','example.com'], true);
    $schema = ['@context'=>'https://schema.org','@type'=>'ProfessionalService','name'=>'DJ Wahid','legalName'=>'DJ Wahid AB','description'=>$copy['description'],'telephone'=>'+46736402445','address'=>['@type'=>'PostalAddress','addressLocality'=>'Malmö','addressCountry'=>'SE'],'areaServed'=>['@type'=>'Country','name'=>'Sweden'],'sameAs'=>['https://www.instagram.com/dj.wahid2/','https://www.tiktok.com/@dj.wahid2/']];
    $schema['name']=$config['texts']['DJ Wahid'][$language]??'DJ Wahid';$schema['legalName']=$schema['name'].' AB';
    $schema['telephone']=preg_replace('/^tel:/','',$config['media']['tel:+46736402445']??'tel:+46736402445');
    $schema['sameAs']=array_values(array_filter(array_map(fn($source)=>$config['media'][$source]??$source,$schema['sameAs']),fn($url)=>preg_match('~^https?://~',$url)));
    if ($public) {
        $canonical = $origin . '/?lang=' . $language;
        $tags .= '<link rel="canonical" href="' . $escape($canonical) . '" /><meta property="og:url" content="' . $escape($canonical) . '" />';
        $languages = $config['languages'] ?? ['en'=>true,'sv'=>true,'default'=>'en'];
        foreach (['en','sv'] as $code) if ($languages[$code]) $tags .= '<link rel="alternate" hreflang="' . $code . '" href="' . $escape($origin . '/?lang=' . $code) . '" />';
        $tags .= '<link rel="alternate" hreflang="x-default" href="' . $escape($origin . '/?lang=' . ($languages['default'] ?? 'en')) . '" />';
        $image = $config['media']['/images/dj-portrait-1.jpg'] ?? '/images/dj-portrait-1.jpg';
        if (str_starts_with($image, '/')) $image = $origin . $image;
        if (preg_match('~^https?://~', $image)) $tags .= '<meta property="og:image" content="' . $escape($image) . '" />';
        $schema['url'] = $canonical;
    }
    $tags .= '<script type="application/ld+json" id="dj-business-schema">' . json_encode($schema, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . '</script>';
    return str_replace('</head>', $tags . '</head>', $html);
}
