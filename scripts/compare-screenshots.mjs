import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const [before, after, out = "artifacts/comparison"] = process.argv.slice(2);
if (!before || !after) throw new Error("Usage: node scripts/compare-screenshots.mjs <before-dir> <after-dir> [output-dir]");
await mkdir(out, {recursive:true});
const results = [];
for (const name of await readdir(before)) {
  if (!name.endsWith(".png")) continue;
  const a = PNG.sync.read(await readFile(`${before}/${name}`));
  const b = PNG.sync.read(await readFile(`${after}/${name}`));
  if (a.width !== b.width || a.height !== b.height) {
    results.push({name,sizeBefore:[a.width,a.height],sizeAfter:[b.width,b.height]}); continue;
  }
  const diff = new PNG({width:a.width,height:a.height});
  const differentPixels = pixelmatch(a.data,b.data,diff.data,a.width,a.height,{threshold:0,includeAA:true});
  await writeFile(`${out}/diff-${name}`,PNG.sync.write(diff));
  results.push({name,width:a.width,height:a.height,differentPixels,totalPixels:a.width*a.height});
}
await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
if (!results.length || results.some(result => result.differentPixels !== 0)) process.exitCode = 1;
