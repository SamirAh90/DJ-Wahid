import { build } from "vite";
import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";

// Only remove known generated output within this checkout.
const root = process.cwd();
for (const name of ["dist", ".build"]) {
  const target = resolve(root, name);
  if (relative(root, target) !== name) throw new Error("Unsafe build output path.");
  await rm(target, { recursive: true, force: true });
}
await build({ configLoader: "runner" });
await build({
  configLoader: "runner", publicDir: false,
  build: { ssr: "src/prerender.tsx", outDir: ".build", sourcemap: false,
    rollupOptions: { output: { entryFileNames: "prerender.mjs" } } },
});
const { renderHome, renderAdmin, renderNotFound, rowTemplates } = await import(pathToFileURL(resolve(".build/prerender.mjs")).href);
const shell = await readFile("dist/index.html", "utf8");
const emptyHome = renderHome({ events: [], photos: [] })
  .replace('<div class="mt-12 space-y-4"></div>', '<div class="mt-12 space-y-4"><!--SITE_EVENTS--></div>')
  .replace('<div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"></div>', '<div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"><!--SITE_PHOTOS--></div>');
if (!emptyHome.includes('<!--SITE_EVENTS-->') || !emptyHome.includes('<!--SITE_PHOTOS-->')) throw new Error("Could not locate existing dynamic content slots.");
const document = (markup, admin = false) => {
  let html = shell.replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
    .replace('</head>', `${admin ? '<meta name="robots" content="noindex, nofollow" />' : ''}</head>`)
    .replace('</body>', '<!--SITE_BOOTSTRAP--></body>');
  if (admin) {
    html = html.replaceAll('DJ Wahid — Electronic Music, Live Events &amp; Podcasts', 'Admin Portal — DJ Wahid')
      .replaceAll('Official DJ Wahid (DJW) site featuring live club dates, Supermix podcasts, 12-inch vinyl releases, and booking.', 'Sign in to manage DJ Wahid upcoming events and gallery photos.');
  }
  return html;
};
await mkdir("dist/templates", { recursive: true });
await writeFile("dist/templates/home.html", document(emptyHome));
await writeFile("dist/templates/admin.html", document(renderAdmin(), true));
await writeFile("dist/templates/not-found.html", document(renderNotFound()).replaceAll(
  'Official DJ Wahid (DJW) site featuring live club dates, Supermix podcasts, 12-inch vinyl releases, and booking.',
  'Official website of DJ Wahid (DJW). Upcoming club dates, Supermix podcasts, vinyl releases, and booking.',
));
const rows = rowTemplates();
await writeFile("dist/templates/event.html", rows.event);
await writeFile("dist/templates/photo.html", rows.photo);
await cp("api", "dist/api", { recursive: true });
await cp("server/index.php", "dist/index.php");
// index.php serves the live database through the pre-rendered React templates.
// A bare index.html must not bypass the live feed or admin metadata.
await rm("dist/index.html");
const { writeNotices } = await import("./license-notices.mjs");
await writeNotices();
const { checkDeployment } = await import("./check-deploy.mjs");
await checkDeployment();
console.log("Production files: " + resolve("dist"));
