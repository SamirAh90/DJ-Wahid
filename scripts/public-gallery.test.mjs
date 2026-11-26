import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname, basename } from "node:path";
import { execFileSync } from "node:child_process";
import { readPublicGallery } from "./public-gallery.mjs";

async function removeFixture(directory) {
  const target = resolve(directory);
  if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith("dj-gallery-")) {
    throw new Error("Unexpected gallery test cleanup path");
  }
  await rm(target, { recursive: true, force: true });
}

test("PHP and the static build discover identical images, deduplicate copies and encode filenames", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dj-gallery-"));
  try {
    await writeFile(join(directory, "hero-dj-2.webp"), "same image bytes");
    await writeFile(join(directory, "duplicate.webp"), "same image bytes");
    await writeFile(join(directory, "Bröllop (1).jpg"), "another image");
    await writeFile(join(directory, "not-a-photo.mp4"), "video");
    await writeFile(join(directory, ".hidden.jpg"), "hidden");
    await writeFile(join(directory, "empty.jpg"), "");
    await mkdir(join(directory, "folder.png"));
    const photos = await readPublicGallery(directory);
    assert.equal(photos.length, 2);
    assert.equal(photos[0].image_url, "/images/hero-dj-2.webp");
    assert.equal(photos[1].image_url, "/images/Br%C3%B6llop%20%281%29.jpg");
    const php = JSON.parse(execFileSync("php", [resolve("scripts/gallery-json.php"), directory], { encoding: "utf8" }));
    assert.deepEqual(php, photos);
  } finally { await removeFixture(directory); }
});

test("an empty image directory produces no demo gallery records", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dj-gallery-"));
  try { assert.deepEqual(await readPublicGallery(directory), []); }
  finally { await removeFixture(directory); }
});
