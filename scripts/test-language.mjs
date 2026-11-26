import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const base=process.argv[2]??'http://127.0.0.1:8080';
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL??'msedge',args:['--autoplay-policy=no-user-gesture-required']});
await mkdir('artifacts/languages',{recursive:true});
let checks=0;
function check(value,message){assert.ok(value,message);checks++;}
try {
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Svenska',exact:true}).click();
  await page.getByRole('heading',{name:'Min biografi',exact:true}).waitFor();
  check(await page.locator('html').getAttribute('lang')==='sv','Swedish document language');
  check(await page.getByRole('heading',{name:'Uthyrning',exact:true}).count()===1,'Swedish rentals');
  check(await page.getByRole('heading',{name:'Musiknyheter',exact:true}).count()===1,'Swedish news');
  check((await page.locator('#biography').innerText()).includes('Musik är inte bara mitt yrke'),'Complete translated biography');
  await page.locator('#biography').getByRole('button',{name:'Boka nu',exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.getByRole('heading',{name:'Vi planerar ditt evenemang'}).waitFor();
  check((await dialog.innerText()).includes('Planerar du bröllop'),'Translated booking introduction');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  await page.locator('#shop').getByRole('button',{name:'Boka nu',exact:true}).first().click();
  await dialog.getByRole('heading',{name:'Hyr: Standard Festpaket'}).waitFor();
  check((await dialog.innerText()).includes('tillgänglighet'),'Translated rental booking');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  await page.locator('#services').getByRole('button').first().click();
  await dialog.getByRole('heading',{name:'Boka tjänst: Bröllop'}).waitFor();
  check((await dialog.innerText()).includes('Skräddarsydd musik'),'Translated dynamic service description');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'Min biografi',exact:true}).waitFor();checks++;
  const audio=page.locator('[data-music-player] audio');
  await page.waitForFunction(()=>!document.querySelector('[data-music-player] audio').paused);
  const time=await audio.evaluate(n=>n.currentTime);
  await page.getByRole('button',{name:'English',exact:true}).click();
  await page.getByRole('heading',{name:'My Biography',exact:true}).waitFor();
  check(await audio.evaluate((n,previous)=>!n.paused&&n.currentTime>=previous,time),'Language changes preserve music');
  await page.getByRole('button',{name:'Svenska',exact:true}).click();
  await page.screenshot({path:`artifacts/languages/swedish-${viewport.width}.png`});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
  await page.getByRole('link',{name:'Integritet och lokal lagring',exact:true}).click();
  await page.getByRole('heading',{name:'Integritetspolicy och lokal lagring',exact:true}).waitFor();
  check(await page.getByRole('heading',{name:'Dina rättigheter',exact:true}).count()===1,'Swedish privacy policy');
  await page.getByRole('link',{name:'English',exact:true}).click();
  await page.getByRole('heading',{name:'Privacy policy and local storage',exact:true}).waitFor();checks++;
  await page.goto(base+'/admin?lang=sv',{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'Administratörsportal',exact:true}).waitFor();
  check(await page.getByRole('button',{name:'Logga in',exact:true}).isVisible(),'Swedish admin login');
  check(errors.length===0,'No browser errors: '+errors.join('; '));
  await page.close();
 }
 console.log(`${checks} bilingual desktop/mobile checks passed.`);
}finally{await browser.close();}
