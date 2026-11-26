import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] ?? "http://127.0.0.1:8080";
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
await mkdir("artifacts/music", {recursive:true});

async function run(policy, allowed) {
  const browser = await chromium.launch({headless:true,
    ...(process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : {}), args:[`--autoplay-policy=${policy}`,
    "--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies"]});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:900}});
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base, {waitUntil:"domcontentloaded"});
    const audio = page.locator("[data-music-player] audio");
    await page.waitForFunction(() => document.querySelector("[data-music-player] audio")?.readyState >= 2);
    check((await audio.getAttribute("src")) === "/mp3/Bijan%20Mortazavi.mp3", "Selected Bijan Mortazavi track");
    check(await audio.evaluate(node => node.loop && node.volume === 0.35 && node.duration > 300), "Loaded looping five-minute track at moderate volume");
    if (!allowed) {
      check(await audio.evaluate(node => node.paused), "Restricted browser waits for interaction");
      check(await page.getByRole("button", {name:"Play background music",exact:true}).isVisible(), "Blocked autoplay offers Play");
      await page.getByRole("button", {name:"Next slide"}).click();
    }
    await page.getByRole("button", {name:"Pause background music",exact:true}).waitFor();
    await page.waitForFunction(() => document.querySelector("[data-music-player] audio").currentTime > 0.2);
    check(await audio.evaluate(node => !node.paused), "Autoplay or first interaction starts playback");
    check(await page.locator('.music-visualizer[data-playing="true"]').count() === 1, "Visualizer animates during playback");
    await page.getByRole("button", {name:"Mute background music",exact:true}).click();
    check(await audio.evaluate(node => node.muted && !node.paused), "Mute silences playback");
    check(await page.locator('.music-visualizer[data-playing="false"]').count() === 1, "Visualizer settles when muted");
    await page.reload({waitUntil:"domcontentloaded"});
    await page.getByRole("button", {name:"Unmute background music",exact:true}).waitFor();
    check(await audio.evaluate(node => node.muted), "Mute preference survives reload");
    await page.getByRole("button", {name:"Unmute background music",exact:true}).click();
    await page.getByRole("button", {name:"Pause background music",exact:true}).click();
    await page.getByRole("button", {name:"Play background music",exact:true}).waitFor();
    await page.getByRole("button", {name:"Next slide"}).click();
    check(await audio.evaluate(node => node.paused), "Manual pause persists through other interactions");
    await page.reload({waitUntil:"domcontentloaded"});
    check(await audio.evaluate(node => node.paused), "Manual pause survives reload");
    await page.getByRole("button", {name:"Play background music",exact:true}).click();
    await page.getByRole("button", {name:"Pause background music",exact:true}).waitFor();
    await page.getByRole("button", {name:"Play DJW - SUPERMIX PODCAST #1",exact:true}).click();
    check(await audio.evaluate(node => node.paused), "Podcast pauses background track");
    await page.getByRole("button", {name:"Pause DJW - SUPERMIX PODCAST #1",exact:true}).waitFor();
    await page.getByRole("button", {name:"Play background music",exact:true}).click();
    await page.getByRole("button", {name:"Play DJW - SUPERMIX PODCAST #1",exact:true}).waitFor();
    check(await audio.evaluate(node => !node.paused), "Background track stops podcast and resumes");
    await page.emulateMedia({reducedMotion:"reduce"});
    check(await page.locator(".music-visualizer-bar").first().evaluate(node => getComputedStyle(node).animationName === "none"), "Reduced-motion preference respected");
    await page.emulateMedia({reducedMotion:"no-preference"});
    await page.evaluate(() => window.scrollTo(0, 0));
    if (allowed) {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({path:"artifacts/music/desktop.png"});
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:"artifacts/music/mobile.png"});
      const overflow = await page.evaluate(() => ({width:innerWidth, scroll:document.documentElement.scrollWidth,
        elements:[...document.querySelectorAll("body *")].filter(node => {
          const bounds = node.getBoundingClientRect(); return bounds.width > 0 && bounds.right > innerWidth + 1;
        }).slice(0,12).map(node => ({tag:node.tagName,class:node.className}))}));
      check(overflow.scroll <= overflow.width, "No horizontal overflow on mobile: " + JSON.stringify(overflow));
      await page.locator("#services").getByRole("button").first().click();
      await page.getByRole("dialog").waitFor();
      await page.getByRole("dialog").evaluate(node => Promise.all(node.getAnimations().map(animation => animation.finished)));
      check(await page.getByRole("dialog").evaluate(node => {
        const bounds = node.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight;
      }), "Contact dialog fits mobile viewport");
      await page.screenshot({path:"artifacts/music/mobile-contact.png"});
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({state:"hidden"});
      await page.locator("footer").scrollIntoViewIfNeeded();
      await page.screenshot({path:"artifacts/music/mobile-footer.png"});
    }
    check(errors.length === 0, "No browser errors: " + errors.join("; "));
  } finally { await browser.close(); }
}

await run("no-user-gesture-required", true);
await run("user-gesture-required", false);
console.log(`${checks} music/autoplay/mobile checks passed.`);
