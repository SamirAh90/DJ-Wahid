import { copyFile, readFile, writeFile } from "node:fs/promises";
import { loadEnv } from "vite";

const output = new URL("../dist-strato/", import.meta.url);
await copyFile(
  new URL("../deployment/strato/.htaccess", import.meta.url),
  new URL(".htaccess", output),
);

const { SITE_URL } = loadEnv("strato", process.cwd(), "SITE_");
if (SITE_URL) {
  const site = new URL(SITE_URL);
  if (site.protocol !== "https:" || site.href !== site.origin + "/") {
    throw new Error("SITE_URL must be the HTTPS origin of the STRATO website");
  }
  const htmlFile = new URL("index.html", output);
  const html = await readFile(htmlFile, "utf8");
  const canonical = `    <link rel="canonical" href="${site.href}" />\n  </head>`;
  await writeFile(htmlFile, html
    .replace("</head>", canonical)
    .replace('content="/images/hero-neon.webp"', `content="${site.origin}/images/hero-neon.webp"`));
  await writeFile(new URL("sitemap.xml", output), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${site.href}</loc></url></urlset>\n`);
  await writeFile(new URL("robots.txt", output), `User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`);
}
