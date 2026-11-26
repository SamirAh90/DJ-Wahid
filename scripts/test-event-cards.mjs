import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL??'msedge',args:['--autoplay-policy=no-user-gesture-required']});
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const events=Array.from({length:4},(_,i)=>({id:String(i),day_label:'25',month_label:'Nov',title:`Test event ${i+1}`,description:'Live music and dancing.',location:'Malmö',price:'250 SEK',event_date:null,published:true}));
  await page.route('**/api/index.php?action=content',route=>route.fulfill({json:{events,photos:[]}}));
  await page.addInitScript(()=>localStorage.setItem('dj-background-music-muted','true'));
  await page.addInitScript(events => Object.defineProperty(window, '__SITE_CONTENT__', {
    configurable:true, get:()=>({events,photos:[]}), set:()=>{},
  }), events);
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('[data-event-card]').length===4);
  assert.equal(await page.locator('[data-event-card]').count(),4);
  assert.equal(await page.locator('#events').getByText('250 SEK',{exact:true}).count(),4);
  assert.equal(await page.locator('#events').getByText('Malmö',{exact:true}).count(),4);
  if(viewport.width>1000){const boxes=await page.locator('[data-event-card]').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().top));assert.ok(boxes.every(y=>Math.abs(y-boxes[0])<1));}
  await page.waitForFunction(()=>{const a=document.querySelector('audio');return a&&!a.paused&&a.currentTime>0;});
  assert.ok(await page.locator('audio').evaluate(a=>!a.muted));
  await page.getByRole('button',{name:'Mute background music',exact:true}).click();
  assert.ok(await page.locator('audio').evaluate(a=>a.muted&&!a.paused));
  await page.getByRole('button',{name:'Svenska',exact:true}).click();
  await page.locator('#events').getByText('Biljetter',{exact:true}).first().waitFor();
  assert.equal(await page.locator('#events').getByText('Plats',{exact:true}).count(),4);
  assert.ok(await page.locator('audio').evaluate(a=>a.muted&&!a.paused));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Bilingual event cards, four-column layout, mobile layout and sound-on/manual-mute checks passed.');
}finally{await browser.close();}
