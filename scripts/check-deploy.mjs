import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

export async function checkDeployment(target = process.env.SITE_BUILD_TARGET ?? "strato") {
  if (target !== "strato" && target !== "netlify") {
    throw new Error(`Unsupported deployment target: ${target}`);
  }
  const failures = [];
  const assets = JSON.parse(await readFile("config/assets.json", "utf8"));
  for (const {filename, bytes, sha256} of assets) {
    try {
      const size = (await stat(join("dist/images", filename))).size;
      if (!size) failures.push(`Required image is empty: ${filename}`);
      if (bytes !== undefined && size !== bytes) failures.push(`Image size mismatch: ${filename}`);
      if (sha256 && createHash("sha256").update(await readFile(join("dist/images", filename))).digest("hex") !== sha256) {
        failures.push(`Original image checksum mismatch: ${filename}`);
      }
    } catch { failures.push(`Missing required image: public/images/${filename}`); }
  }
  const requiredFiles = ["dist/index.html", "dist/fonts/fonts.css", "dist/favicon.ico", "dist/robots.txt", "dist/mp3/Bijan Mortazavi.mp3"];
  if (target === "strato") {
    requiredFiles.push("dist/.htaccess", "dist/index.php", "dist/api/index.php", "dist/templates/home.html");
  } else {
    requiredFiles.push("dist/_redirects", "dist/api-unavailable.json");
    let redirects = "";
    try {
      redirects = await readFile("dist/_redirects", "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (!redirects.includes("/api/* /api-unavailable.json 503") || !redirects.includes("/* /index.html 200")) {
      failures.push("Netlify redirects must preserve API errors and provide the SPA fallback.");
    }
  }
  for (const file of requiredFiles) {
    try { await stat(file); } catch { failures.push(`Missing deployment file: ${file}`); }
  }
  const visit = async (directory) => {
    for (const entry of await readdir(directory, {withFileTypes:true})) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", ".git", "src", "private", "database"].includes(entry.name)) failures.push(`Private directory in deployment: ${file}`);
        await visit(file);
      } else if (target === "netlify" && (entry.name.endsWith(".php") || entry.name === ".htaccess")) {
        failures.push(`STRATO-only file in Netlify deployment: ${file}`);
      } else if (/\.map$|^\.env|^config\.php$|\.sql$/.test(entry.name)) failures.push(`Private/development file in deployment: ${file}`);
      else if (/\.(js|html|php|css)$/.test(entry.name)) {
        const content = await readFile(file, "utf8");
        if (/@lovable|lovable\.dev|lovable\.app|SUPABASE_|LOVABLE_|sourceMappingURL=/.test(content)) failures.push(`Platform reference or source map in deployment: ${file}`);
      }
    }
  };
  await visit("dist");
  if (failures.length) throw new Error("Deployment checks failed:\n" + failures.map(f=>"- " + f).join("\n"));
  console.log("Deployment structure, required asset sizes/checksums and platform/secret checks passed.");
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await checkDeployment();
