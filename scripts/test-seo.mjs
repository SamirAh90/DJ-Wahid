import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const defaults=JSON.parse(await readFile('src/data/seo.json','utf8'));
const base='http://127.0.0.1:8080';
for(const language of ['en','sv']){
 const response=await fetch(`${base}/?lang=${language}`);assert.equal(response.status,200);const html=await response.text();
 assert.ok(html.includes(`<html lang="${language}"`));
 assert.ok(html.includes(language==='en'?'AFGHAN, PERSIAN &amp; INTERNATIONAL DJ':'AFGHANSK, PERSISK OCH INTERNATIONELL DJ'));
 assert.ok(html.includes(language==='en'?'multicultural weddings':'mångkulturella bröllop'));
 const title=/<title>(.*?)<\/title>/.exec(html)[1].replaceAll('&amp;','&');assert.equal(title,defaults[language].title);
 const schema=JSON.parse(/<script type="application\/ld\+json" id="dj-business-schema">(.*?)<\/script>/.exec(html)[1]);
 assert.equal(schema['@type'],'ProfessionalService');assert.equal(schema.address.addressLocality,'Malmö');assert.equal(schema.telephone,'+46736402445');
 assert.ok(!html.includes('rel="canonical"'),'No localhost canonical');
}
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL??'msedge'});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/?lang=en',{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'AFGHAN, PERSIAN & INTERNATIONAL DJ',exact:true}).waitFor();
 assert.equal(await page.title(),defaults.en.title);
 await page.getByRole('button',{name:'Svenska',exact:true}).click();
 await page.getByRole('heading',{name:'AFGHANSK, PERSISK OCH INTERNATIONELL DJ',exact:true}).waitFor();
 await page.waitForFunction(title=>document.title===title,defaults.sv.title);
 assert.equal(await page.locator('meta[name="description"]').first().getAttribute('content'),defaults.sv.description);
 assert.equal(await page.locator('meta[property="og:locale"]').first().getAttribute('content'),'sv_SE');
 assert.equal(await page.locator('#dj-business-schema').count(),1);
 assert.ok((await page.locator('#biography').innerText()).includes('afghansk-danska'));
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
console.log('English/Swedish initial HTML, metadata, language switching and structured data checks passed.');
