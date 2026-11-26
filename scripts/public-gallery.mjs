import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const preferred = ["hero-dj-1.webp", "hero-dj-2.webp", "hero-dj-3.webp", "dj-portrait-1.jpg", "dj-portrait-2.jpg", "dj-decks-1.jpg", "dj-decks-2.jpg"];
const rank = (name) => { const index = preferred.indexOf(name); return index < 0 ? preferred.length : index; };
const encodeFilename = (name) => encodeURIComponent(name).replace(/[!'()*]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);

export async function readPublicGallery(directory = "public/images") {
  const entries = (await readdir(directory, { withFileTypes: true }))
    .filter(entry => entry.isFile() && !entry.name.startsWith(".") && /\.(jpe?g|png|webp|avif|gif|bmp|tiff?|ico|svg)$/i.test(entry.name))
    .sort((left, right) => rank(left.name) - rank(right.name) || Buffer.compare(Buffer.from(left.name), Buffer.from(right.name)));
  const seen = new Set();
  const photos = [];
  for (const entry of entries) {
    const content = await readFile(join(directory, entry.name));
    if (!content.length) continue;
    const hash = createHash("sha256").update(content).digest("hex");
    if (seen.has(hash)) continue;
    seen.add(hash);
    photos.push({ id: `public-${hash}`, image_url: `/images/${encodeFilename(entry.name)}`, caption: "",
      likes: 0, comments: 0, sort_order: photos.length + 1, published: true });
  }
  return photos;
}
