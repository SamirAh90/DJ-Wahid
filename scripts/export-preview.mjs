import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const origin=process.argv[2]??'http://127.0.0.1:8080';
if(new URL(origin).hostname!=='127.0.0.1'&&new URL(origin).hostname!=='localhost')throw new Error('Export only from the local preview.');
const response=await fetch(origin+'/api/index.php?action=content');if(!response.ok)throw new Error('Local public content unavailable.');
const source=await response.json();
const data={events:source.events,photos:source.photos,website:source.website,library_initialized:true};
await mkdir('public/site-media',{recursive:true});const copied=new Map();
async function localAsset(url){
 if(!url.startsWith('/api/index.php?'))return url;
 if(copied.has(url))return copied.get(url);
 const response=await fetch(origin+url);if(!response.ok)throw new Error('Could not export a published media file.');
 const type=response.headers.get('content-type')?.split(';')[0];
 const extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/avif':'avif','image/svg+xml':'svg','image/x-icon':'ico','video/mp4':'mp4','video/webm':'webm','audio/mpeg':'mp3','audio/ogg':'ogg'};
 if(!extensions[type])throw new Error('Unexpected public media type: '+type);
 const bytes=Buffer.from(await response.arrayBuffer());const name=createHash('sha256').update(bytes).digest('hex').slice(0,24)+'.'+extensions[type];
 await writeFile('public/site-media/'+name,bytes);const target='/site-media/'+name;copied.set(url,target);return target;
}
for(const photo of data.photos)photo.image_url=await localAsset(photo.image_url);
for(const [key,value] of Object.entries(data.website?.config.media??{}))data.website.config.media[key]=await localAsset(value);
await writeFile('database/netlify-content.json',JSON.stringify(data,null,2)+'\n');
console.log(`Exported public preview: ${data.photos.length} photos and ${copied.size} published media references. No accounts or private configuration exported.`);
