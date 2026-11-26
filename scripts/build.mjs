import { build } from "vite";
import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { readPublicGallery } from "./public-gallery.mjs";

// Only remove known generated output within this checkout.
const root = process.cwd();
const buildTarget = process.env.SITE_BUILD_TARGET ?? "strato";
process.env.VITE_SITE_STATIC_ONLY = buildTarget === "netlify" ? "true" : "false";
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
const seoDefaults = JSON.parse(await readFile("src/data/seo.json", "utf8"));
const seedContent = JSON.parse(await readFile("database/content.json", "utf8"));
let staticContent = {
  events: seedContent.events.filter((event) => event.published),
  photos: await readPublicGallery("dist/images"),
};
if(buildTarget === "netlify") {
  try { staticContent = JSON.parse(await readFile("database/netlify-content.json", "utf8")); }
  catch(error) { if(error.code !== "ENOENT")throw error; }
}
const serializedContent = JSON.stringify(staticContent)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026");
const emptyHome = renderHome({ events: [], photos: [] })
  .replace(/<article data-event-card=""[\s\S]*?<\/article>/, '<!--SITE_EVENTS-->')
  .replace('<div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"></div>', '<div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"><!--SITE_PHOTOS--></div>');
if (!emptyHome.includes('<!--SITE_EVENTS-->') || !emptyHome.includes('<!--SITE_PHOTOS-->')) throw new Error("Could not locate existing dynamic content slots.");
const document = (markup, admin = false) => {
  let html = shell.replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
    .replace('</head>', `${admin ? '<meta name="robots" content="noindex, nofollow" />' : ''}</head>`)
    .replace('</body>', '<!--SITE_BOOTSTRAP--></body>');
  if (admin) {
    html = html.replaceAll('DJ Wahid | Afghan &amp; Persian Wedding DJ in Malmö', 'Admin Portal — DJ Wahid')
      .replaceAll('Afghan, Persian and Kurdish wedding DJ based in Malmö. International music for weddings, birthdays, graduation parties and corporate events. Book DJ Wahid.', 'Sign in to manage DJ Wahid upcoming events and gallery photos.');
  }
  return html;
};
const staticHome = document(renderHome(staticContent))
  .replace("<!--SITE_BOOTSTRAP-->", `<script>window.__SITE_CONTENT__=${serializedContent};</script>`);
await writeFile("dist/index.html", staticHome);
if (buildTarget === "strato") {
  await mkdir("dist/templates", { recursive: true });
  await writeFile("dist/templates/home.html", document(emptyHome));
  const swedishHome = renderHome({events:[],photos:[]}, "sv")
    .replace(/<article data-event-card=""[\s\S]*?<\/article>/, '<!--SITE_EVENTS-->')
    .replace('<div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"></div>', '<div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"><!--SITE_PHOTOS--></div>');
  await writeFile("dist/templates/home-sv.html", document(swedishHome));
  await writeFile("dist/templates/seo.json", JSON.stringify(seoDefaults));
  await cp("src/data/editor-defaults.json", "dist/templates/editor-defaults.json");
  await writeFile("dist/templates/admin.html", document(renderAdmin(), true));
  await writeFile("dist/templates/not-found.html", document(renderNotFound()).replaceAll(
    'Afghan, Persian and Kurdish wedding DJ based in Malmö. International music for weddings, birthdays, graduation parties and corporate events. Book DJ Wahid.',
    'Afghan, Persian and Kurdish wedding DJ based in Malmö. International music for weddings, birthdays, graduation parties and corporate events. Book DJ Wahid.',
  ));
  const rows = rowTemplates();
  await writeFile("dist/templates/event.html", rows.event);
  const emptyEvent = renderHome({ events: [], photos: [] }).match(/<article data-event-card=""[\s\S]*?<\/article>/)?.[0];
  if (!emptyEvent) throw new Error("Missing empty event card template.");
  await writeFile("dist/templates/empty-event.html", emptyEvent);
  await writeFile("dist/templates/photo.html", rows.photo);
  const swedishRows = rowTemplates("sv");
  await writeFile("dist/templates/event-sv.html", swedishRows.event);
  await writeFile("dist/templates/photo-sv.html", swedishRows.photo);
  const emptySwedishEvent = renderHome({ events: [], photos: [] }, "sv").match(/<article data-event-card=""[\s\S]*?<\/article>/)?.[0];
  await writeFile("dist/templates/empty-event-sv.html", emptySwedishEvent);
  await cp("api", "dist/api", { recursive: true });
  await cp("server/index.php", "dist/index.php");
  await cp("server/seo.php", "dist/seo.php");
  // Apache prioritizes index.php; index.html is the static-host fallback.
} else {
  await rm("dist/.htaccess", { force: true });
  await writeFile("dist/api-unavailable.json", JSON.stringify({
    error: "The PHP backend is available on the STRATO deployment, not on Netlify.",
  }));
  await writeFile("dist/_redirects", "/api/* /api-unavailable.json 503\n/* /index.html 200\n");
  await writeFile("dist/site-content.json", JSON.stringify(staticContent));
  await mkdir("dist/admin", {recursive:true});
  await writeFile("dist/admin/index.html", document(renderAdmin(),true).replace("<!--SITE_BOOTSTRAP-->",""));
  const privacyScript=await readFile("dist/website-settings.js","utf8");
  await writeFile("dist/website-settings.js",privacyScript.replace("fetch('/api/index.php?action=content')","fetch('/site-content.json')"));
}
const { writeNotices } = await import("./license-notices.mjs");
await writeNotices();
const { checkDeployment } = await import("./check-deploy.mjs");
await checkDeployment(buildTarget);
console.log("Production files: " + resolve("dist"));
