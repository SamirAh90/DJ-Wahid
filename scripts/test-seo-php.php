<?php
declare(strict_types=1);
$file=tempnam(sys_get_temp_dir(),'dj-seo-');
file_put_contents($file,"<?php return ['origin'=>'https://djwahid.example.test'];");
putenv('SITE_CONFIG_PATH='.$file);
try {
    require __DIR__.'/../api/bootstrap.php';
    require __DIR__.'/../dist/seo.php';
    $template=file_get_contents(__DIR__.'/../dist/templates/home-sv.html');
    $config=['languages'=>['en'=>true,'sv'=>true,'default'=>'sv'],'seo'=>['sv'=>['title'=>'Bröllops-DJ & fest','description'=>'Boka musik till ditt bröllop.']]];
    $html=websiteSeo($template,$config,'sv');
    foreach (['<title>Bröllops-DJ &amp; fest</title>','rel="canonical" href="https://djwahid.example.test/?lang=sv"','hreflang="en" href="https://djwahid.example.test/?lang=en"','hreflang="sv" href="https://djwahid.example.test/?lang=sv"','hreflang="x-default" href="https://djwahid.example.test/?lang=sv"'] as $expected) {
        if(!str_contains($html,$expected))throw new RuntimeException('Missing SEO output: '.$expected);
    }
    $config['languages']['en']=false;
    if(str_contains(websiteSeo($template,$config,'sv'),'hreflang="en"'))throw new RuntimeException('Disabled language advertised to search engines.');
    if(str_contains(applyWebsiteContent($template,$config,'sv'),'data-public-language-switcher'))throw new RuntimeException('Single-language public navigation should be hidden.');
    echo "Production canonical URLs, hreflang, enabled languages and SEO overrides passed.\n";
} finally { unlink($file); }
