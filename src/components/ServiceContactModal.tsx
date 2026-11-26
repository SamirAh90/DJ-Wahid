import { asset, sectionEnabled } from "@/lib/website";
import { t, useLanguage } from "@/lib/language";
import { Instagram, Phone } from "lucide-react";
import { DJ_NAME, DJ_PHONE_DISPLAY, DJ_PHONE_TEL, SERVICES_LIST, SOCIAL_LINKS } from "@/data/dj-data";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SwedenFlag, TikTokIcon, WhatsAppIcon } from "@/components/SocialIcons";

interface ServiceContactModalProps {
  open: boolean;
  service: string;
  onOpenChange: (open: boolean) => void;
  onAfterClose: () => void;
}

export function ServiceContactModal({ open, service, onOpenChange, onAfterClose }: ServiceContactModalProps) {
  useLanguage();
  const description = SERVICES_LIST.find((entry) => entry.title === service)?.description;
  const introduction = service.startsWith("Rent:")
    ? t("Contact us by phone, Instagram, WhatsApp or TikTok to check availability and book this package. Tell us your event date, venue and equipment needs, and we will help you plan the next steps.")
    : service === "Book Now"
      ? t("Planning a wedding, private party, birthday, corporate event or club night? Contact me by phone, Instagram, WhatsApp or TikTok. Tell me about your event, your music preferences and the atmosphere you have in mind, and let's create an unforgettable celebration together.")
      : [t(description ?? ""), t("You can contact me by phone, Instagram, WhatsApp or TikTok to discuss your event and book this service.")].filter(Boolean).join(" ");
  const contacts = [
    { label: "Phone", detail: DJ_PHONE_DISPLAY, href: `tel:${DJ_PHONE_TEL}`, icon: Phone, external: false },
    { label: "Instagram", detail: socialHandle(asset(SOCIAL_LINKS.instagram)), href: SOCIAL_LINKS.instagram, icon: Instagram, external: true },
    { label: "WhatsApp", detail: "Message me", href: SOCIAL_LINKS.whatsapp, icon: WhatsAppIcon, external: true },
    { label: "TikTok", detail: socialHandle(asset(SOCIAL_LINKS.tiktok)), href: SOCIAL_LINKS.tiktok, icon: TikTokIcon, external: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-sm border-primary/50 bg-surface-elevated p-7 shadow-2xl sm:rounded-sm"
        onCloseAutoFocus={(event) => { event.preventDefault(); onAfterClose(); }}
      >
        <div className="pr-5">
          <p className="section-eyebrow">{t(DJ_NAME)}</p>
          <DialogTitle className="mt-2 font-display text-2xl font-black uppercase text-foreground">
            {t(service.startsWith("Rent:") ? service : service === "Book Now" ? "Let's Plan Your Event" : `Book Service: ${service}`)}
          </DialogTitle>
        </div>
        <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
          {introduction}
        </DialogDescription>
        <div className="grid gap-2">
          {t(contacts.map(({ label, detail, href, icon: Icon, external }) => (
            <a key={label} href={asset(href)} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex items-center gap-3 rounded-sm border border-border bg-surface-deep/60 px-4 py-3 text-foreground transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <Icon className="h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block font-display text-sm font-bold">{t(label)}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  {t(!external && <SwedenFlag className="h-3 w-4 shrink-0" />)}{t(detail)}
                </span>
              </span>
            </a>
          )))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function socialHandle(url:string) { try {const name=new URL(url).pathname.split('/').filter(Boolean).pop()??'';return name.startsWith('@')?name:`@${name}`;}catch{return url;} }
