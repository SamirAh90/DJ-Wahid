import { useEffect, useState, type RefObject } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminContentQuery, siteContentQuery } from "@/data/site.queries";
import sectionCatalog from "@/data/editor-sections.json";
import { AudiovisualPicker } from "@/components/AudiovisualLibrary";
import { swedish } from "@/data/swedish";
import seoDefaults from "@/data/seo.json";
import privacyDefaults from "@/data/privacy-defaults.json";
import { api } from "@/lib/api";
import { asset, applyWebsite, type WebsiteConfig, type WebsiteSettings } from "@/lib/website";
import { t, useLanguage } from "@/lib/language";
import { toast } from "sonner";
import { ImagePicker } from "@/components/MediaLibrary";

const sections = ["home", "biography", "instagram", "events", "shop", "services", "podcast", "music", "community", "news", "contact"];
const labels: Record<string, string> = { home:"Hero", biography:"Biography", instagram:"Gallery", events:"Events", shop:"Equipment Rental", services:"Services", podcast:"Podcast", music:"Background music", community:"Community banner", news:"Music News", contact:"Footer" };
const mediaDefaults = [
  ["Hero image 1", "/images/hero-dj-1.webp"], ["Hero image 2", "/images/hero-dj-2.webp"], ["Hero image 3", "/images/hero-dj-3.webp"], ["Biography portrait", "/images/dj-portrait-1.jpg"],
  ["Background music", "/mp3/Bijan%20Mortazavi.mp3"],
  ["Podcast track 1","podcast:pod-1"], ["Podcast track 2","podcast:pod-2"], ["Podcast track 3","podcast:pod-3"],
  ...[1,2,3].flatMap(i=>[[`News video ${i}`,`/videos/news-${i}.mp4`],[`Video poster ${i}`,`/videos/news-${i}.jpg`]]),
  ["Instagram (header and contact)","https://www.instagram.com/dj.wahid2/"], ["Instagram (footer)","https://www.instagram.com/arya_entertainment.se/"],
  ["Facebook","https://www.facebook.com/p/Arya-Entertainment-AB-100083463424063/"], ["TikTok","https://www.tiktok.com/@dj.wahid2/"], ["WhatsApp","https://wa.me/46736402445"], ["Phone link","tel:+46736402445"],
  ["Standard rental image","rental:standard"], ["Large rental image","rental:large"], ["Lighting rental image","rental:lights"], ["Wedding rental image","rental:wedding"],
  ["Admin link","/admin"], ["Developer link","https://daladana.se/"],
  ["Home link","#home"], ["Biography link","#biography"], ["Events link","#events"], ["Rental link","#shop"], ["Services link","#services"], ["Music link","#podcast"], ["Gallery link","#instagram"], ["News link","#news"], ["Contact link","#contact"],
];
const field = "w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary outline-none";
const groupLabels: Record<string,string> = { Navbar:"Navigation", HeroSlider:"Hero", ClubSections:"Biography, gallery and services", RentalSection:"Equipment Rental", PodcastSection:"Podcast", CommunityAndFooter:"Community, news and footer", ServiceContactModal:"Booking contacts", BackgroundMusic:"Background music", EventCards:"Events", Identity:"Identity", "Event content":"Event content" };
const initial = (config: WebsiteConfig = {}): WebsiteConfig => ({...config,languages:config.languages??{en:true,sv:true,default:"en"}});

export type EditorActions = {save:()=>Promise<void>;preview:()=>void;discard:()=>void};
export function WebsiteEditor({section="home",onDirtyChange,onBusyChange,actionsRef}:{section?:string;onDirtyChange?:(dirty:boolean)=>void;onBusyChange?:(busy:boolean)=>void;actionsRef?:RefObject<EditorActions|null>}) {
  useLanguage();
  const {data,isLoading}=useQuery(adminContentQuery);
  const {data:published}=useQuery(siteContentQuery);
  const client=useQueryClient();
  const [draft,setDraft]=useState<WebsiteConfig>(()=>initial());
  const [version,setVersion]=useState("");
  const [dirty,setDirty]=useState(false);
  const [busy,setBusy]=useState(false);
  const [uploading,setUploading]=useState<string|null>(null);
  const [previewMedia,setPreviewMedia]=useState<Record<string,string>>({});
  const [imageSlot,setImageSlot]=useState<string|null>(null);
  const [avSlot,setAvSlot]=useState<string|null>(null);
  useEffect(()=>{onDirtyChange?.(dirty);},[dirty,onDirtyChange]);
  useEffect(()=>{onBusyChange?.(busy||Boolean(uploading));},[busy,uploading,onBusyChange]);
  useEffect(()=>{setFilter("");},[section]);
  const [filter,setFilter]=useState("");
  useEffect(()=>{
    if(!data||dirty)return;
    setDraft(initial(data.website?.config));setVersion(data.website?.version??"");
  },[data,dirty]);
  useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();}};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[dirty]);
  const update=(value:WebsiteConfig)=>{setDraft(value);setDirty(true);};
  const upload=async(source:string,file:File)=>{
    setUploading(source);
    try { const form=new FormData();form.append("media",file);const result=await api<{media_url:string;preview_url:string}>("upload-site-media",form);setPreviewMedia(current=>({...current,[result.media_url]:result.preview_url}));setDraft(current=>({...current,media:{...current.media,[source]:result.media_url}}));setDirty(true);await client.invalidateQueries({queryKey:["admin-content"]});toast.success(t("Media uploaded. Save changes to publish it.")); }
    catch(error){toast.error(error instanceof Error?error.message:t("Upload failed."));}
    finally{setUploading(null);}
  };
  const save=async()=>{
    setBusy(true);
    try{
      const result=await api<WebsiteSettings>("save-website",{config:draft,version});
      setVersion(result.version);setDirty(false);applyWebsite(result.config);
      await Promise.all([client.invalidateQueries({queryKey:["admin-content"]}),client.invalidateQueries({queryKey:["site-content"]})]);
      toast.success(t("Website settings saved."));
    }catch(error){toast.error(error instanceof Error?error.message:t("Could not save website settings."));}
    finally{setBusy(false);}
  };
  const preview=()=>{const config={...draft,media:Object.fromEntries(Object.entries(draft.media??{}).map(([slot,url])=>[slot,/^(storage|library|av):/.test(url)?previewMedia[url]??data?.photos.find(photo=>url===`library:${photo.id}`)?.image_url??data?.media_library?.find(record=>url===`av:${record.id}`)?.preview_url??published?.website?.config.media?.[slot]??url:url]))};sessionStorage.setItem("dj-website-preview",JSON.stringify(config));window.open("/?preview=1","_blank");};
  useEffect(()=>{if(actionsRef)actionsRef.current={save,preview,discard:()=>{setDraft(initial(data?.website?.config));setDirty(false);}};});
  if(isLoading)return <p>{t("Loading website settings…")}</p>;
  const languages=draft.languages??{en:true,sv:true,default:"en" as const};
  const eventTexts=(data?.events??[]).flatMap(event=>[event.title,event.description,event.location,event.price]).filter(Boolean);
  const sectionKeys=(sectionCatalog as Record<string,string[]>)[section]??[];
  const keys=[...new Set([...sectionKeys,...(section==="events"?eventTexts:[])])].filter(key=>!filter||key.toLowerCase().includes(filter.toLowerCase()));
  const mediaGroups:Record<string,string[]>={home:["/images/hero-dj-1.webp","/images/hero-dj-2.webp","/images/hero-dj-3.webp"],biography:["/images/dj-portrait-1.jpg"],news:[1,2,3].flatMap(i=>[`/videos/news-${i}.mp4`,`/videos/news-${i}.jpg`]),music:["/mp3/Bijan%20Mortazavi.mp3"],podcast:["podcast:pod-1","podcast:pod-2","podcast:pod-3"],shop:["rental:standard","rental:large","rental:lights","rental:wedding"]};
  const visibleMedia=[...mediaDefaults,...(data?.events??[]).map(event=>[`Event photo: ${event.title}`,`event:${event.id}`])].filter(([,source])=>source&&(section==="social"?/^https?:|^tel:/.test(source):section==="navigation"?source.startsWith('#'):section==="contact"?['/admin','https://daladana.se/'].includes(source):section==="events"?source.startsWith("event:"):mediaGroups[section]?.includes(source)));
  const editableSections=["navigation","home","biography","instagram","events","shop","services","podcast","music","community","news","contact","social","booking","identity","languages","seo","privacy"];

  return <div hidden={!editableSections.includes(section)} className="space-y-8">
    <ImagePicker open={imageSlot!==null} onClose={()=>setImageSlot(null)} onSelect={photo=>{if(imageSlot){setPreviewMedia(current=>({...current,[`library:${photo.id}`]:photo.image_url}));update({...draft,media:{...draft.media,[imageSlot]:`library:${photo.id}`}});}}} />
    <AudiovisualPicker open={avSlot!==null} type={avSlot?.endsWith(".mp3")||avSlot?.startsWith('podcast:')?"audio":"video"} onClose={()=>setAvSlot(null)} onSelect={record=>{if(avSlot){setPreviewMedia(current=>({...current,[`av:${record.id}`]:record.preview_url}));update({...draft,media:{...draft.media,[avSlot]:`av:${record.id}`}});}}} />
    <section hidden={section!=="languages"} className="rounded-sm border border-border bg-card/70 p-6">
      <h3 className="font-display text-lg font-bold">{t("Languages")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t("Enable the languages visitors can use and choose the default for new visitors. At least one language must remain enabled.")}</p>
      <div className="mt-5 flex flex-wrap items-center gap-6">
        {(["en","sv"] as const).map(lang=><label key={lang} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={languages[lang]} onChange={event=>{const next={...languages,[lang]:event.target.checked};if(!next.en&&!next.sv)return;if(!next[next.default])next.default=next.en?"en":"sv";update({...draft,languages:next});}} />{lang==="en"?"English":"Svenska"}</label>)}
        <label className="text-sm">{t("Default language")}<select className={`${field} mt-2`} value={languages.default} onChange={event=>update({...draft,languages:{...languages,default:event.target.value as "en"|"sv"}})}>{languages.en&&<option value="en">English</option>}{languages.sv&&<option value="sv">Svenska</option>}</select></label>
      </div>
    </section>
    <section hidden={!sections.includes(section)} className="rounded-sm border border-border bg-card/70 p-6">
      <h3 className="font-display text-lg font-bold">{t("Visible sections")}</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sections.filter(id=>id===section).map(id=><label key={id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={draft.sections?.[id]!==false} onChange={event=>update({...draft,sections:{...draft.sections,[id]:event.target.checked}})} />{t(labels[id]??id)}</label>)}</div>
    </section>
    <section hidden={section!=="seo"} className="rounded-sm border border-border bg-card/70 p-6">
      <h3 className="font-display text-lg font-bold">{t("Search engine settings")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t("Edit the page title and description for each language. Leave empty to use the recommended defaults.")}</p>
      <div className="mt-5 grid gap-6 md:grid-cols-2">{(["en","sv"] as const).map(lang=><div key={lang}><h4 className="font-bold">{lang==="en"?"English":"Svenska"}</h4><label className="mt-3 block text-sm">{t("SEO title")}<input maxLength={120} className={`${field} mt-2`} value={draft.seo?.[lang]?.title??seoDefaults[lang].title} onChange={event=>update({...draft,seo:{...draft.seo,[lang]:{...draft.seo?.[lang],title:event.target.value}}})} /></label><label className="mt-4 block text-sm">{t("SEO description")}<textarea maxLength={400} rows={4} className={`${field} mt-2`} value={draft.seo?.[lang]?.description??seoDefaults[lang].description} onChange={event=>update({...draft,seo:{...draft.seo,[lang]:{...draft.seo?.[lang],description:event.target.value}}})} /></label></div>)}</div>
    </section>
    <section hidden={sectionKeys.length===0&&section!=="events"} className="rounded-sm border border-border bg-card/70 p-6">
      <h3 className="font-display text-lg font-bold">{t("Text and translations")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t("Edit English and Swedish independently. Text is displayed as plain text. Empty fields intentionally hide that text.")}</p>
      <label className="mt-5 block text-sm">{t("Search text")}<input className={`${field} mt-2`} value={filter} onChange={e=>setFilter(e.target.value)} /></label>
      <div className="mt-6 space-y-6">{keys.map(key=><div key={key} className="border-t border-border pt-5"><p className="mb-3 break-words text-xs text-muted-foreground">{key}</p><div className="grid gap-4 md:grid-cols-2">{(["en","sv"] as const).map(lang=><label key={lang} className="text-xs font-bold">{lang==="en"?"English":"Svenska"}<textarea rows={key.length>160?5:2} className={`${field} mt-2 font-normal`} value={draft.texts?.[key]?.[lang]??(lang==="en"?key:swedish[key]??key)} onChange={event=>update({...draft,texts:{...draft.texts,[key]:{...draft.texts?.[key],[lang]:event.target.value}}})} /></label>)}</div></div>)}</div>
    </section>
    <section hidden={visibleMedia.length===0} className="rounded-sm border border-border bg-card/70 p-6">
      <h3 className="font-display text-lg font-bold">{t(section==="social"?"Social media and contact links":"Images, videos, music and links")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t("Upload an image, video or music file, or enter a public file path or HTTPS URL. Save changes to publish uploaded files. Event photos can be assigned below.")}</p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">{visibleMedia.map(([label,source])=>{
        if(!source)return null;
        const value=draft.media?.[source]??(/^(event|rental|podcast):/.test(source)?"":source);
        const audioField=source.endsWith('.mp3')||source.startsWith('podcast:');
        const linkField=/^https?:|^tel:|^#/.test(source)||source==='/admin';
        const imageField=!linkField&&!source.endsWith(".mp4")&&!audioField;
        const preview=previewMedia[value]??data?.photos.find(photo=>value===`library:${photo.id}`)?.image_url??data?.media_library?.find(record=>value===`av:${record.id}`)?.preview_url??(value.startsWith("storage://")?published?.website?.config.media?.[source]:value);
        return <div key={source} data-media-slot={source} className="min-w-0 rounded-sm border border-border p-4 text-sm">
          <h4 className="mb-3 font-bold">{t(label??source)}</h4>
          {imageField&&<><div className="mb-3 aspect-[4/3] overflow-hidden rounded-sm bg-surface-deep">{preview?<img src={preview} alt={t(label??source)} className="h-full w-full object-contain" />:<p className="grid h-full place-items-center text-xs text-muted-foreground">{t("No image selected")}</p>}</div><button type="button" className="mb-3 w-full rounded-sm border border-primary px-3 py-2 font-bold text-primary" onClick={()=>setImageSlot(source)}>{t("Choose from image library")}</button></>}
          {!imageField&&source.endsWith(".mp4")&&<video src={preview} controls playsInline preload="metadata" className="mb-3 aspect-video w-full bg-black object-contain" />}
          {!imageField&&audioField&&<audio src={preview} controls preload="metadata" className="mb-3 w-full" />}
          {!imageField&&!linkField&&<button type="button" onClick={()=>setAvSlot(source)} className="mb-3 w-full rounded-sm border border-primary px-3 py-2 font-bold text-primary">{t(audioField?"Choose audio":"Choose a video")}</button>}
          {imageField?<details><summary className="cursor-pointer text-xs text-muted-foreground">{t("Advanced image address")}</summary><input aria-label={t(label??source)} className={`${field} mt-2`} value={value} onChange={event=>update({...draft,media:{...draft.media,[source]:event.target.value}})} /></details>:<input aria-label={t(label??source)} className={field} value={value} onChange={event=>update({...draft,media:{...draft.media,[source]:event.target.value}})} />}
          {!linkField&&<label className="mt-3 block text-xs text-primary">{t(uploading===source?"Uploading…":"Upload file")}<input type="file" className="mt-1 block w-full text-xs text-muted-foreground" disabled={Boolean(uploading)||busy} accept={source.endsWith(".mp4")?"video/mp4,video/webm":audioField?"audio/mpeg,audio/ogg":"image/jpeg,image/png,image/webp,image/gif,image/avif"} onChange={event=>{const file=event.target.files?.[0];if(file)void upload(source,file);event.target.value="";}} /></label>}
        </div>;
      })}</div>
      <button type="button" className="mt-6 text-sm text-primary underline" onClick={()=>{if(window.confirm(t("Restore all website settings to defaults? Save to apply.")))update(initial());}}>{t("Restore defaults")}</button>
    </section>
    <section hidden={section!=="privacy"} className="rounded-sm border border-border bg-card/70 p-6">
      <h3 className="font-display text-lg font-bold">{t("Privacy policy")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t("Optional replacement policy text. Separate paragraphs with a blank line. Leave empty to keep the existing policy.")}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{(["en","sv"] as const).map(lang=><div key={lang}><h4 className="font-bold">{lang==="en"?"English":"Svenska"}</h4><label className="mt-3 block text-sm">{t("Policy heading")}<input className={`${field} mt-2`} value={draft.privacyTitles?.[lang]??privacyDefaults.titles[lang]} onChange={event=>update({...draft,privacyTitles:{...draft.privacyTitles,[lang]:event.target.value}})} /></label><label className="mt-4 block text-sm">{t("Policy contents")}<textarea rows={18} className={`${field} mt-2`} value={draft.privacy?.[lang]??privacyDefaults.body[lang]} onChange={event=>update({...draft,privacy:{...draft.privacy,[lang]:event.target.value}})} /></label></div>)}</div>
    </section>
    <button type="button" disabled={!dirty||busy||Boolean(uploading)} onClick={()=>void save()} className="btn-magenta rounded-sm px-6 py-3 text-sm font-bold disabled:opacity-50">{t("Save changes")}</button>
  </div>;
}
