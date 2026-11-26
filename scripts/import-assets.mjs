import { readFile, mkdir, copyFile, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
const source = process.argv[2];
if (!source) throw new Error("Usage: node scripts/import-assets.mjs <directory-with-original-images>");
const assets = JSON.parse(await readFile(new URL("../config/assets.json", import.meta.url), "utf8"));
await mkdir("public/images", { recursive: true });
for (const asset of assets) {
  const input = join(resolve(source), asset.filename);
  if (asset.bytes !== undefined && (await stat(input)).size !== asset.bytes) throw new Error(`Image size mismatch: ${asset.filename}`);
  if (asset.sha256 && createHash("sha256").update(await readFile(input)).digest("hex") !== asset.sha256) {
    throw new Error(`Original file checksum mismatch: ${asset.filename}`);
  }
  await copyFile(input, join("public/images", asset.filename));
  console.log(`Imported ${asset.filename}`);
}
