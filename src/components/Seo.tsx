import { useEffect } from "react";
import defaults from "@/data/seo.json";
import { useLanguage } from "@/lib/language";
import { asset, useWebsite } from "@/lib/website";

export function Seo() {
  const language=useLanguage();const website=useWebsite();
  useEffect(()=>{
    const title=website.seo?.[language]?.title||defaults[language].title;
    const description=website.seo?.[language]?.description||defaults[language].description;
    document.title=title;
    const meta=(attribute:string,name:string,value:string)=>{
      const nodes=document.head.querySelectorAll<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
      if(nodes.length)nodes.forEach(node=>{node.content=value;});
      else{const node=document.createElement("meta");node.setAttribute(attribute,name);node.content=value;document.head.append(node);}
    };
    meta("name","description",description);meta("property","og:title",title);meta("property","og:description",description);
    meta("property","og:locale",language==="sv"?"sv_SE":"en_GB");meta("name","twitter:title",title);meta("name","twitter:description",description);
    const canonical=document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if(canonical){const url=new URL(canonical.href);url.search=`?lang=${language}`;canonical.href=url.href;meta("property","og:url",url.href);}
    let schema=document.getElementById("dj-business-schema") as HTMLScriptElement|null;
    if(!schema){schema=document.createElement("script");schema.id="dj-business-schema";schema.type="application/ld+json";document.head.append(schema);}
    const name=website.texts?.['DJ Wahid']?.[language]||'DJ Wahid';
    schema.textContent=JSON.stringify({"@context":"https://schema.org","@type":"ProfessionalService",name,legalName:`${name} AB`,description,telephone:asset('tel:+46736402445').replace(/^tel:/,''),address:{"@type":"PostalAddress",addressLocality:"Malmö",addressCountry:"SE"},areaServed:{"@type":"Country",name:"Sweden"},sameAs:[asset("https://www.instagram.com/dj.wahid2/"),asset("https://www.tiktok.com/@dj.wahid2/")].filter(url=>/^https?:/.test(url)),...(canonical?{url:canonical.href,image:new URL(asset("/images/dj-portrait-1.jpg"),canonical.href).href}:{})});
  },[language,website]);
  return null;
}
