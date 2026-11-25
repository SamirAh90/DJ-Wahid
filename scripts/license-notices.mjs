import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function writeNotices() {
  const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
  const notices = ["THIRD-PARTY SOFTWARE NOTICES\n\nFont licenses are also supplied in fonts/.\n"];
  for (const [directory, entry] of Object.entries(lock.packages).sort()) {
    if (!directory || entry.dev) continue;
    let manifest;
    try { manifest = JSON.parse(await readFile(join(directory, "package.json"), "utf8")); }
    catch { continue; }
    const files = (await readdir(directory)).filter(name => /^(licen[cs]e|copying|notice)(\.(txt|md))?$/i.test(name));
    notices.push(`\n${"=".repeat(72)}\n${manifest.name} ${manifest.version}\nLicense: ${JSON.stringify(manifest.license ?? entry.license ?? "See package")}`);
    for (const file of files) notices.push(`\n${file}\n\n${await readFile(join(directory,file),"utf8")}`);
  }
  await writeFile("dist/THIRD-PARTY-NOTICES.txt", notices.join("\n"));
}
