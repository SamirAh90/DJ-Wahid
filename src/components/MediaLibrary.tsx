import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminContentQuery } from "@/data/site.queries";
import { api, uploadPhoto } from "@/lib/api";
import { savePhoto, deletePhoto, type SitePhoto } from "@/data/site.functions";
import { t, useLanguage } from "@/lib/language";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

export function ImagePicker({open,onClose,onSelect}:{open:boolean;onClose:()=>void;onSelect:(photo:SitePhoto)=>void}) {
  useLanguage();const {data}=useQuery({...adminContentQuery,enabled:open});const [search,setSearch]=useState("");
  return <Dialog open={open} onOpenChange={value=>{if(!value)onClose();}}><DialogContent className="max-h-[85dvh] max-w-4xl overflow-y-auto bg-surface-elevated">
    <DialogTitle>{t("Choose an image")}</DialogTitle><DialogDescription>{t("Select a photo from your database image library.")}</DialogDescription>
    <input aria-label={t("Search images")} placeholder={t("Search images")} value={search} onChange={e=>setSearch(e.target.value)} className="rounded-sm border border-border bg-background px-3 py-2 text-sm" />
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{data?.photos.filter(photo=>photo.caption.toLowerCase().includes(search.toLowerCase())).map(photo=><button key={photo.id} type="button" aria-label={photo.caption||t("Photo")} onClick={()=>{onSelect(photo);onClose();}} className="overflow-hidden rounded-sm border border-border text-left hover:border-primary focus-visible:outline-2 focus-visible:outline-primary">
      <img src={photo.image_url} alt={photo.caption} loading="lazy" className="aspect-square w-full object-cover" /><span className="block truncate p-2 text-xs">{photo.caption||t("Photo")}</span>
    </button>)}</div>
    {data?.photos.length===0&&<p className="text-sm text-muted-foreground">{t("Upload images in the Photos tab first.")}</p>}
  </DialogContent></Dialog>;
}

export function MediaLibrary() {
  useLanguage();const {data,isLoading}=useQuery(adminContentQuery);const client=useQueryClient();const [busy,setBusy]=useState(false);const [search,setSearch]=useState("");
  const refresh=async()=>{await Promise.all([client.invalidateQueries({queryKey:["admin-content"]}),client.invalidateQueries({queryKey:["site-content"]})]);};
  const update=async(photo:SitePhoto,change:Partial<SitePhoto>)=>{try{await savePhoto({data:{...photo,...change}});await refresh();toast.success(t("Image updated."));}catch(error){toast.error(error instanceof Error?error.message:t("Could not save the photo."));}};
  const upload=async(files:FileList)=>{
    setBusy(true);
    try{for(const file of Array.from(files)){const uploaded=await uploadPhoto(file);await savePhoto({data:{image_url:uploaded.image_url,caption:file.name,likes:0,comments:0,sort_order:(data?.photos.length??0)+1,published:true}});}await refresh();toast.success(t("Images added to your library."));}
    catch(error){toast.error(error instanceof Error?error.message:t("Upload failed."));await refresh();}finally{setBusy(false);}
  };
  const remove=async(photo:SitePhoto)=>{
    if(!window.confirm(t("Delete this image from the library and gallery?")))return;
    try{await deletePhoto({data:{id:photo.id,image_url:photo.image_url}});await refresh();toast.success(t("Photo deleted"));}catch(error){toast.error(error instanceof Error?error.message:t("Could not delete the photo."));}
  };
  return <section className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-display text-2xl font-bold">{t("Image library")}</h2><p className="mt-2 text-sm text-muted-foreground">{t("Manage your images visually. Images used by the website must be replaced before they can be deleted.")}</p></div><label className="btn-magenta cursor-pointer rounded-sm px-5 py-3 text-sm font-bold">{t(busy?"Uploading…":"Add images")}<input type="file" accept="image/*" multiple disabled={busy} className="hidden" onChange={event=>{if(event.target.files)void upload(event.target.files);event.target.value="";}} /></label></div>
    {!data?.library_initialized&&<button type="button" disabled={busy} className="rounded-sm border border-primary px-4 py-3 text-sm" onClick={async()=>{setBusy(true);try{await api("import-library",{});await refresh();toast.success(t("Website images imported."));}catch(error){toast.error(error instanceof Error?error.message:t("Upload failed."));}finally{setBusy(false);}}}>{t("Import existing website images")}</button>}
    <input aria-label={t("Search images")} placeholder={t("Search images")} value={search} onChange={event=>setSearch(event.target.value)} className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm" />
    {isLoading&&<p>{t("Loading photos…")}</p>}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data?.photos.filter(photo=>photo.caption.toLowerCase().includes(search.toLowerCase())).map(photo=><article key={photo.id} data-library-image={photo.id} className="min-w-0 overflow-hidden rounded-sm border border-border bg-card">
      <img src={photo.image_url} alt={photo.caption||t("Photo")} loading="lazy" className="aspect-[4/3] w-full bg-surface-deep object-contain" />
      <div className="space-y-3 p-4"><label className="block text-xs text-muted-foreground">{t("Caption")}<input key={photo.caption} defaultValue={photo.caption} onBlur={event=>{if(event.target.value!==photo.caption)void update(photo,{caption:event.target.value});}} className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground" /></label>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={photo.published} onChange={event=>void update(photo,{published:event.target.checked})} />{t("Show in gallery")}</label>
      {photo.used_on_site&&<p className="text-xs text-cyan-glow">{t("Used on the website")}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><label className="cursor-pointer text-xs font-bold text-primary">{t("Replace image")}<input type="file" className="hidden" accept="image/*" onChange={async event=>{const file=event.target.files?.[0];event.target.value="";if(!file)return;try{const uploaded=await uploadPhoto(file);await update(photo,{image_url:uploaded.image_url});}catch(error){toast.error(error instanceof Error?error.message:t("Upload failed."));}}} /></label><button type="button" disabled={photo.used_on_site} onClick={()=>void remove(photo)} className="text-xs font-bold text-destructive disabled:opacity-40">{t("Delete image")}</button></div>
      </div>
    </article>)}</div>
    {!isLoading&&data?.photos.length===0&&<p className="text-sm text-muted-foreground">{t("No photos yet — upload your first one.")}</p>}
  </section>;
}
