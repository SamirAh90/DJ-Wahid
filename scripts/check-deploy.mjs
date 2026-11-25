import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

export async function checkDeployment() {
  const failures = [];
  const assets = JSON.parse(await readFile("config/assets.json", "utf8"));
  for (const {filename, bytes, sha256} of assets) {
    try {
      if ((await stat(join("dist/images", filename))).size !== bytes) failures.push(`Original image size mismatch: ${filename}`);
      if (sha256 && createHash("sha256").update(await readFile(join("dist/images", filename))).digest("hex") !== sha256) {
        failures.push(`Original image checksum mismatch: ${filename}`);
      }
    } catch { failures.push(`Missing original image: public/images/${filename}`); }
  }
  for (const file of ["dist/.htaccess", "dist/index.php", "dist/api/index.php", "dist/templates/home.html", "dist/fonts/fonts.css", "dist/favicon.ico", "dist/robots.txt"]) {
    try { await stat(file); } catch { failures.push(`Missing deployment file: ${file}`); }
  }
  const visit = async (directory) => {
    for (const entry of await readdir(directory, {withFileTypes:true})) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", ".git", "src", "private", "database"].includes(entry.name)) failures.push(`Private directory in deployment: ${file}`);
        await visit(file);
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
