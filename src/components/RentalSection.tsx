import { asset, sectionEnabled, getWebsite } from "@/lib/website";
import { t, useLanguage } from "@/lib/language";
import { ArrowRight, CalendarDays } from "lucide-react";

const packages = [
  { title: "Standard Party Package", tag: "Package", price: "1 990", description: "Sound and atmospheric lighting for birthdays, graduation parties and after-work events. An easy way to bring extra energy to your celebration.", type: "standard" },
  { title: "Large Party Package", tag: "Package", price: "4 990", description: "For larger parties and events. A bigger sound system paired with striking lighting brings the dance floor to life.", type: "large" },
  { title: "4 × Moving Head Wash", tag: "Lighting", price: "1 490", description: "Colourful moving lights for parties, stages and events. Energise the dance floor and transform the atmosphere of your venue.", type: "lights" },
  { title: "Classic Wedding Package", tag: "Wedding", price: "2 495", description: "Elegant sound and lighting for your special day. From speeches and dinner to an unforgettable wedding celebration with dancing late into the evening.", type: "wedding" },
];

function EquipmentIllustration({ type, title }: { type: string; title: string }) {
  useLanguage();
  const lightsOnly = type === "lights";
  return (
    <svg viewBox="0 0 400 260" role="img" aria-label={t(`Illustration: ${title}`)} className="h-full w-full">
      <defs>
        <linearGradient id={`beam-${type}`} x2="0" y2="1">
          <stop stopColor={type === "wedding" ? "#fff1d0" : "#ec008c"} stopOpacity=".35" />
          <stop offset="1" stopColor="#00b9ec" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="#100923" />
      <ellipse cx="200" cy="227" rx="160" ry="14" fill="#00b9ec" opacity=".08" />
      {t((lightsOnly ? [65, 145, 225, 305] : [142, 228]).map((x) => (
        <g key={x}>
          <path d={`M${x + 15} 137 L${x - 20} 25 L${x + 70} 25 Z`} fill={`url(#beam-${type})`} />
          <rect x={x} y="149" width="42" height="13" rx="4" fill="#353147" />
          <path d={`M${x + 5} 149 L${x} 114 L${x + 38} 104 L${x + 40} 146`} fill="#222033" stroke="#615472" strokeWidth="2" />
          <ellipse cx={x + 18} cy="112" rx="18" ry="9" fill="#ec008c" />
          <ellipse cx={x + 18} cy="112" rx="10" ry="5" fill="#62d6ed" />
          <path d={`M${x + 21} 162 V220 M${x + 21} 203 L${x + 2} 226 M${x + 21} 203 L${x + 41} 226`} stroke="#786d88" strokeWidth="3" />
        </g>
      )))}
      {t(!lightsOnly && [50, 294].map((x) => (
        <g key={x}>
          <rect x={x} y="64" width="56" height="101" rx="6" fill="#211d30" stroke="#685676" strokeWidth="2" />
          <circle cx={x + 28} cy="126" r="22" fill="#0a0812" stroke="#454055" strokeWidth="3" />
          <circle cx={x + 28} cy="126" r="10" fill="#292237" />
          <rect x={x + 15} y="76" width="26" height="13" rx="4" fill="#0a0812" />
          <path d={`M${x + 28} 166 V221 M${x + 28} 204 L${x + 4} 229 M${x + 28} 204 L${x + 52} 229`} stroke="#786d88" strokeWidth="3" />
          {t(type === "large" && <rect x={x - 7} y="172" width="70" height="57" rx="5" fill="#211d30" stroke="#685676" strokeWidth="2" />)}
        </g>
      )))}
      {t(!lightsOnly && <g><rect x="155" y="190" width="91" height="39" rx="5" fill="#292237" stroke="#685676" /><path d="M164 201h72M164 209h72M164 217h72" stroke="#ec008c" strokeWidth="2" strokeDasharray="3 7" /></g>)}
    </svg>
  );
}

export function RentalSection({ onBook }: { onBook: (service: string) => void }) {
  useLanguage();
  return (
    <section hidden={!sectionEnabled("shop")} id="shop" className="border-y border-border bg-surface-deep py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="section-eyebrow">{t("Sound & lighting for your event")}</p>
          <h2 className="mt-3 font-display text-4xl font-black uppercase text-foreground sm:text-5xl">{t("Equipment Rental")}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("Set the mood with the right sound and lighting. Contact us for availability and help choosing a package for your event.")}</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t(packages.map((item) => (
            <article key={item.type} className="flex min-w-0 flex-col overflow-hidden rounded-sm border border-border bg-card/80 transition-colors hover:border-primary/60">
              <div className="aspect-[400/260]">{getWebsite().media?.[`rental:${item.type}`] ? <img src={asset(`rental:${item.type}`)} alt={t(item.title)} className="h-full w-full object-cover" /> : <EquipmentIllustration type={item.type} title={t(item.title)} />}</div>
              <div className="flex flex-1 flex-col p-5">
                <span className="w-fit border border-primary/35 px-2 py-1 text-[10px] font-bold text-cyan-glow">{t(item.tag)}</span>
                <h3 className="mt-4 font-display text-lg font-extrabold text-foreground">{t(item.title)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(item.description)}</p>
                <div className="mt-auto pt-7">
                  <p className="font-display text-2xl font-black text-foreground">{t(item.price)} {t("SEK")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("incl. VAT · per day")}</p>
                  <button type="button" onClick={() => onBook(`Rent: ${item.title}`)} className="btn-magenta mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm px-3 py-3 text-xs font-bold">
                    <CalendarDays className="h-4 w-4" />{t("Book now")}<ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          )))}
        </div>
      </div>
    </section>
  );
}
