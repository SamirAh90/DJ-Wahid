<?php
declare(strict_types=1);

function readPublicGallery(string $directory): array
{
    if (!is_dir($directory)) return [];
    $preferred = ['hero-dj-1.webp', 'hero-dj-2.webp', 'hero-dj-3.webp', 'dj-portrait-1.jpg', 'dj-portrait-2.jpg', 'dj-decks-1.jpg', 'dj-decks-2.jpg'];
    $rank = static function(string $name) use ($preferred): int {
        $index = array_search($name, $preferred, true);
        return $index === false ? count($preferred) : $index;
    };
    $names = array_values(array_filter(scandir($directory) ?: [], static function(string $name) use ($directory): bool {
        return !str_starts_with($name, '.') && !is_link($directory . '/' . $name) && is_file($directory . '/' . $name)
            && preg_match('/\.(jpe?g|png|webp|avif|gif|bmp|tiff?|ico|svg)$/iD', $name);
    }));
    usort($names, static fn(string $left, string $right): int => $rank($left) - $rank($right) ?: strcmp($left, $right));
    $seen = [];
    $photos = [];
    foreach ($names as $name) {
        $file = $directory . '/' . $name;
        if (filesize($file) === 0) continue;
        $hash = hash_file('sha256', $file);
        if ($hash === false || isset($seen[$hash])) continue;
        $seen[$hash] = true;
        $photos[] = ['id' => 'public-' . $hash, 'image_url' => '/images/' . rawurlencode($name), 'caption' => '',
            'likes' => 0, 'comments' => 0, 'sort_order' => count($photos) + 1, 'published' => true];
    }
    return $photos;
}
