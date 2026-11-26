import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const [base = "http://127.0.0.1:8080", out = "artifacts/screenshots"] = process.argv.slice(2);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
  headless: true,
  args: ["--force-color-profile=srgb", "--disable-gpu"],
});
const results = [];
try {
  for (const [name, width, height] of [["desktop",1920,1080],["laptop",1440,900],["tablet",768,1024],["mobile",390,844]]) {
    for (const route of ["/", "/admin"]) {
      const context = await browser.newContext({ viewport: {width,height}, deviceScaleFactor: 1,
        colorScheme: "light", locale: "en-US", timezoneId: "Europe/Stockholm" });
      const page = await context.newPage();
      const errors = [], failed = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("response", response => { if(response.status() >= 400) failed.push({url:response.url(),status:response.status()}); });
      await page.clock.install({ time: new Date("2026-11-25T12:00:00Z") });
      const response = await page.goto(base + route, {waitUntil:"networkidle", timeout:60000});
      if (route === "/") {
        await page.waitForFunction(count => document.querySelectorAll("#instagram img").length === (count ?? window.__SITE_CONTENT__?.photos.length),
          process.env.EXPECTED_GALLERY_COUNT ? Number(process.env.EXPECTED_GALLERY_COUNT) : null);
      } else await page.getByRole("heading", {name:"Admin Portal"}).waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 100));
      if (route === "/") await page.getByRole("button", {name:"Go to slide 1"}).click();
      await page.mouse.move(0,0);
      await page.screenshot({path:`${out}/${route === "/" ? "home" : "admin"}-${name}.png`, fullPage:true, animations:"disabled"});
      results.push({route,name,width,height,status:response.status(),errors,failed,
        ...await page.evaluate(() => ({title:document.title,text:document.body.innerText,
          images:[...document.images].map(i=>({src:i.getAttribute("src"),complete:i.complete,width:i.naturalWidth}))}))});
      await context.close();
      console.log(route, name, response.status());
    }
  }
  await writeFile(`${out}/results.json`, JSON.stringify(results,null,2));
} finally { await browser.close(); }
