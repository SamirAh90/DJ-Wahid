<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once dirname(__DIR__) . '/api/public-gallery.php';
echo json_encode(readPublicGallery($argv[1] ?? dirname(__DIR__) . '/public/images'), JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
