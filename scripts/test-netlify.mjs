import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const root=resolve(process.argv[2]??'dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.mp3':'audio/mpeg','.mp4':'video/mp4'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=resolve(root,'.'+path);if(!file.startsWith(root+sep)&&file!==root){res.writeHead(403);res.end();return;}
  if(path.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});res.end(await readFile(resolve(root,'api-unavailable.json')));return;}
  try{if((await stat(file)).isDirectory())file=resolve(file,'index.html');await stat(file);}catch{file=resolve(root,'index.html');}
  const bytes=await readFile(file);const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range??'');
  const headers={'Content-Type':mime[extname(file)]??'application/octet-stream','Accept-Ranges':'bytes'};
  if(range){const start=Number(range[1]),end=Math.min(Number(range[2]||bytes.length-1),bytes.length-1);res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':end-start+1});res.end(bytes.subarray(start,end+1));}
  else{res.writeHead(200,{...headers,'Content-Length':bytes.length});res.end(bytes);}
 }catch(error){res.writeHead(500);res.end(String(error));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;const content=JSON.parse(await readFile(resolve(root,'site-content.json'),'utf8'));
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL??'msedge',args:['--autoplay-policy=no-user-gesture-required']});
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport});const errors=[],apiCalls=[],failed=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.url().includes('/api/'))apiCalls.push(request.url());});page.on('response',response=>{if(response.status()>=400)failed.push(response.url());});
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('#home h1').waitFor();
  await page.waitForFunction(()=>{const audio=document.querySelector('[data-music-player] audio');return audio&&!audio.paused&&audio.currentTime>0;});
  assert.equal(await page.locator('footer a[href="/admin"]').count(),0);
  assert.equal(await page.locator('#instagram img').count(),content.photos.length);
  await page.locator('#news video').first().evaluate(video=>video.play());assert.ok(await page.locator('#news video').first().evaluate(video=>!video.paused));await page.locator('#news video').first().evaluate(video=>video.pause());
  if(content.website.config.languages.en&&content.website.config.languages.sv){await page.getByRole('button',{name:'Svenska',exact:true}).click();await page.waitForFunction(()=>document.documentElement.lang==='sv');}
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const language=await page.locator('html').getAttribute('lang');const privacy=language==='sv'?'/integritet/sv.html?lang=sv':'/integritet/index.html?lang=en';await page.goto(base+privacy,{waitUntil:'domcontentloaded'});await page.locator('#privacy-content h2').first().waitFor();
  await page.goto(base+'/admin',{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:/Customer preview|Kundförhandsvisning/}).waitFor();assert.equal(await page.locator('form').count(),0);
  assert.deepEqual(apiCalls,[]);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await page.close();
 }
 console.log('Netlify static desktop/mobile preview passed: photos, video, music, languages, privacy and safe admin fallback; no backend requests or failed assets.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
