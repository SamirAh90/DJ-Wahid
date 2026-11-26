import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://127.0.0.1:8080";
const browser = await chromium.launch({headless:true,
  ...(process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : {})});
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
try {
  for (const viewport of [{width:1440,height:900},{width:390,height:844}]) {
    const page = await browser.newPage({viewport});
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    check((await page.goto(base, {waitUntil:"networkidle"})).status() === 200, "Homepage response");
    await page.getByRole("button", {name:"Next slide"}).click();
    await page.getByRole("heading", {name:"TRACKS DRUM & BASS"}).waitFor(); checks++;
    await page.getByRole("button", {name:"Previous slide"}).click();
    await page.getByRole("heading", {name:"SUPERMIX ELECTRO HOUSE"}).waitFor(); checks++;
    if (viewport.width < 1000) await page.getByRole("button", {name:"Toggle menu"}).click();
    await page.getByRole("button", {name:"Book Now",exact:true}).filter({visible:true}).click();
    await page.getByRole("heading", {name:"Book DJ Wahid",exact:true}).waitFor(); checks++;
    const modal = page.locator("div.fixed.inset-0.z-50");
    await modal.getByPlaceholder("Alex Rivera").fill("Visual QA");
    await modal.getByPlaceholder("you@example.com").fill("visitor@example.test");
    await modal.getByRole("button", {name:"Confirm Request"}).click();
    await modal.getByText("Thanks, Visual QA.", {exact:false}).waitFor(); checks++;
    await modal.getByRole("button", {name:"Done",exact:true}).click();
    check(await modal.count() === 0, "Booking dialog closes");
    await page.locator("#events").getByRole("button", {name:"More Events",exact:true}).click();
    await modal.getByRole("heading", {name:/Tickets:/}).waitFor(); checks++;
    await modal.getByRole("button", {name:"Close modal"}).click();
    await page.locator("#shop").getByRole("button", {name:/Buy Now/}).click();
    check((await page.locator("#shop").getByRole("button", {name:/Buy Now/}).innerText()).includes("1"), "Vinyl cart count");
    for (const service of ["Weddings", "Clubs and Bars", "Corporate Events", "Playlist Creation", "DJ Lessons"]) {
      const trigger = page.locator("#services").getByRole("button", {name:new RegExp(`^${service} `, "i")});
      await trigger.click();
      const contact = page.getByRole("dialog");
      await contact.getByRole("heading", {name:`Book Service: ${service}`, exact:true}).waitFor(); checks++;
      check(await contact.locator("form, input").count() === 0, "Service contacts have no booking form");
      for (const href of ["tel:+46736402445", "https://www.instagram.com/dj.wahid2/", "https://wa.me/46736402445", "https://www.tiktok.com/@dj.wahid2/"]) {
        check(await contact.locator(`a[href="${href}"]`).isVisible(), `${service} contact ${href}`);
      }
      check((await contact.innerText()).includes("You can contact me by phone"), "Service contact description");
      await page.keyboard.press("Escape");
      await contact.waitFor({state:"hidden"});
      check(await trigger.evaluate(node => document.activeElement === node), "Service trigger regains keyboard focus");
    }
    check(await page.locator('footer a[href="tel:+46736402445"]').getByRole("img", {name:"Sweden"}).isVisible(), "Sweden flag beside footer telephone");
    await page.getByRole("button", {name:"Play DJW - SUPERMIX PODCAST #1"}).click();
    await page.getByRole("button", {name:"Pause DJW - SUPERMIX PODCAST #1"}).waitFor(); checks++;
    await page.getByRole("button", {name:"Pause DJW - SUPERMIX PODCAST #1"}).click();
    check(await page.getByRole("button", {name:"Subscribe",exact:true}).count() === 0, "Subscription button removed");
    check(await page.getByPlaceholder("Enter your email address").count() === 0, "Subscription email field removed");
    check(!(await page.locator("body").innerText()).includes("Enter your email and be the first to know about events!"), "Subscription prompt removed");
    check(!(await page.locator("body").innerText()).includes("I have read and agree to the terms & conditions"), "Subscription terms removed");
    check(await page.getByRole("link", {name:"Facebook",exact:true}).count() === 0, "Facebook links removed");
    check(await page.locator('a[href="https://www.tiktok.com/@dj.wahid2/"]').count() > 0, "Updated TikTok account");
    check(await page.locator('footer a[aria-label="WhatsApp"]').getAttribute("href") === "https://wa.me/46736402445", "Footer WhatsApp link");
    if (viewport.width < 1000) await page.getByRole("button", {name:"Toggle menu"}).click();
    check(await page.locator('header a[aria-label="WhatsApp"]').filter({visible:true}).getAttribute("href") === "https://wa.me/46736402445", "Desktop/mobile WhatsApp link");
    if (viewport.width < 1000) await page.getByRole("button", {name:"Toggle menu"}).click();
    check(await page.locator('a[href="tel:+46736402445"]').count() > 0, "Existing telephone URL");
    check(await page.locator('a[href="https://www.instagram.com/dj.wahid2/"]').count() > 0, "Existing social URL");
    check((await page.goto(base + "/admin", {waitUntil:"networkidle"})).status() === 200, "Admin direct navigation");
    await page.getByRole("heading", {name:"Admin Portal"}).waitFor(); checks++;
    check(await page.locator('meta[name="robots"]').first().getAttribute("content") === "noindex, nofollow", "Admin noindex metadata");
    await page.getByRole("button", {name:"No account yet? Create one"}).click();
    await page.getByRole("button", {name:"Create account",exact:true}).waitFor(); checks++;
    await page.reload({waitUntil:"networkidle"});
    await page.getByRole("button", {name:"Sign in",exact:true}).waitFor(); checks++;
    check((await page.goto(base + "/page-that-does-not-exist", {waitUntil:"networkidle"})).status() === 404, "Unknown page HTTP 404");
    await page.getByRole("heading", {name:"Page not found"}).waitFor(); checks++;
    check(errors.length === 0, "No browser page errors: " + errors.join("; "));
    await page.close();
  }
  console.log(`${checks} desktop/mobile browser checks passed.`);
} finally { await browser.close(); }
