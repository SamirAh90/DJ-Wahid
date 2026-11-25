import { access } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { artist, gallery, services, slides } from "./content";

describe("Static preview content", () => {
  it("includes the local media referenced by the site", async () => {
    const files = [
      ...slides.flatMap(({ image }) => [`images/${image}.webp`, `images/${image}-small.webp`]),
      ...services.filter(({ image }) => image).map(({ image }) => `images/${image}`),
      ...gallery.map(({ image }) => `images/${image}`),
      "images/portrait.webp",
      "images/dj-wahid-mark.webp",
      "videos/highlight.mp4",
      "videos/highlight-poster.webp",
    ];

    for (const file of new Set(files)) {
      await expect(access(new URL(`../public/${file}`, import.meta.url))).resolves.toBeUndefined();
    }
  });

  it("uses an international number and HTTPS social links", () => {
    expect(artist.phone).toMatch(/^\+[1-9]\d{7,14}$/);
    for (const { href } of artist.socials) expect(new URL(href).protocol).toBe("https:");
  });
});
