import { build } from "vite";
import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";

// Only remove known generated output within this checkout.
const root = process.cwd();
const buildTarget = process.env.SITE_BUILD_TARGET ?? "strato";
if (buildTarget !== "strato" && buildTarget !== "netlify") {
  throw new Error(`Unsupported SITE_BUILD_TARGET: ${buildTarget}`);
}
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
const seedContent = JSON.parse(await readFile("database/content.json", "utf8"));
const staticContent = {
  events: seedContent.events.filter((event) => event.published),
  photos: seedContent.photos.filter((photo) => photo.published),
};
const serializedContent = JSON.stringify(staticContent)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026");
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
const staticHome = document(renderHome(staticContent))
  .replace("<!--SITE_BOOTSTRAP-->", `<script>window.__SITE_CONTENT__=${serializedContent};</script>`);
await writeFile("dist/index.html", staticHome);
if (buildTarget === "strato") {
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
  // Apache prioritizes index.php; index.html is the static-host fallback.
} else {
  await rm("dist/.htaccess", { force: true });
  await writeFile("dist/api-unavailable.json", JSON.stringify({
    error: "The PHP backend is available on the STRATO deployment, not on Netlify.",
  }));
  await writeFile("dist/_redirects", "/api/* /api-unavailable.json 503\n/* /index.html 200\n");
}
const { writeNotices } = await import("./license-notices.mjs");
await writeNotices();
const { checkDeployment } = await import("./check-deploy.mjs");
await checkDeployment(buildTarget);
console.log("Production files: " + resolve("dist"));
