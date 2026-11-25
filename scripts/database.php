<?php
declare(strict_types=1);
// CLI only. Credentials are loaded from the private config, never command arguments.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../api/bootstrap.php';
$command = $argv[1] ?? 'verify';
$root = dirname(__DIR__);
$connection = null;
try {
    $connection = db();
    if ($command === 'install') {
        if (query('SHOW TABLES')->fetch()) throw new RuntimeException('Use a new, empty database. Installation never overwrites existing tables.');
        $schema = preg_replace('/^\s*--[^\n]*$/m', '', file_get_contents($root . '/database/schema.sql'));
        foreach (explode(';', $schema) as $statement) {
            if (trim($statement) !== '') db()->exec($statement);
        }
        echo "Schema installed.\n";
    } elseif ($command === 'import') {
        $content = json_decode(file_get_contents($root . '/database/content.json'), true, 32, JSON_THROW_ON_ERROR);
        db()->beginTransaction();
        foreach (['events' => 'events', 'photos' => 'gallery_photos'] as $source => $table) {
            foreach ($content[$source] as $row) {
                $row['created_at'] = (new DateTimeImmutable($row['created_at']))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.u');
                $row['published'] = (int)$row['published'];
                $columns = implode(', ', array_keys($row));
                $placeholders = implode(', ', array_fill(0, count($row), '?'));
                query("INSERT INTO $table ($columns) VALUES ($placeholders)", array_values($row));
            }
        }
        db()->commit();
        echo "Imported the original 2 events and 8 gallery entries, including UUIDs and timestamps.\n";
    } elseif ($command === 'verify') {
        $content = json_decode(file_get_contents($root . '/database/content.json'), true, 32, JSON_THROW_ON_ERROR);
        foreach (['events' => 'events', 'photos' => 'gallery_photos'] as $source => $table) {
            $rows = query("SELECT * FROM $table ORDER BY id")->fetchAll();
            if (count($rows) !== count($content[$source])) throw new RuntimeException("Record count mismatch: $table");
            $expected = array_column($content[$source], null, 'id');
            foreach ($rows as $row) {
                if (!isset($expected[$row['id']])) throw new RuntimeException("Unexpected ID in $table");
                foreach ($expected[$row['id']] as $key => $value) {
                    $actual = $row[$key];
                    if ($key === 'created_at') {
                        $value = (new DateTimeImmutable($value))->format('U.u');
                        $actual = (new DateTimeImmutable($actual, new DateTimeZone('UTC')))->format('U.u');
                    }
                    if ((string)$actual !== (string)$value) throw new RuntimeException("Data mismatch: $table / {$row['id']} / $key");
                }
            }
            echo "$table: IDs, fields, timestamps and counts match.\n";
        }
        echo 'users: ' . query('SELECT COUNT(*) FROM users')->fetchColumn() . " (original export: 0)\n";
    } else throw new RuntimeException('Usage: php scripts/database.php install|import|verify');
} catch (Throwable $error) {
    if ($connection instanceof PDO && $connection->inTransaction()) $connection->rollBack();
    fwrite(STDERR, $error->getMessage() . "\n");
    exit(1);
}
