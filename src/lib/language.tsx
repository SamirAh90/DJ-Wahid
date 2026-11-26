import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { swedish } from "@/data/swedish";
import { getWebsite, useWebsite } from "@/lib/website";

export type Language = "en" | "sv";
let language: Language = "en";
export function setRenderLanguage(next: Language) { language = next; }
const listeners = new Set<() => void>();
export function setLanguage(next: Language) {
  const options = getWebsite().languages;
  if (options && !options[next]) next = options.default;
  language = next;
  document.documentElement.lang = next;
  try { localStorage.setItem("dj-language", next); } catch { /* Optional browser preference. */ }
  listeners.forEach((listener) => listener());
}
export function useLanguage() {
  useWebsite();
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, () => language, () => language);
}

/** Translate presentation strings without changing user input or stored content. */
export function t<T>(value: T): T {
  if (typeof value !== "string") return value;
  const key = value.replace(/\s+/g, " ").trim();
  const custom = getWebsite().texts?.[key]?.[language];
  if(key==='0046736402445') {const phone=getWebsite().media?.['tel:+46736402445'];if(phone?.startsWith('tel:')&&phone!=='tel:+46736402445'&&(!custom||custom===key))return phone.slice(4) as T;}
  if (custom !== undefined) return (custom ? `${/^\s/.test(value)?" ":""}${custom}${/\s$/.test(value)?" ":""}` : "") as T;
  if (language !== "sv") return value;
  const translated = swedish[key];
  if (translated) return value.replace(key, translated) as T;
  const slide = /^Go to slide (\d+)$/.exec(key);
  if (slide) return `Gå till bild ${slide[1]}` as T;
  if (key === "DJ Wahid artist portrait") return "Artistporträtt av DJ Wahid" as T;
  if (key === "DJ Wahid gallery photo") return "Galleribild av DJ Wahid" as T;
  if (key.endsWith(", muted")) return `${key.slice(0, -7)}, ljud av` as T;
  // Labels assembled from a service name or track title keep the name intact.
  for (const prefix of ["Event photo: ", "News video ", "Video poster ", "Book Service: ", "Rent: ", "Tickets: ", "Play ", "Pause ", "Seek ", "Delete ", "Illustration: "]) {
    if (key.startsWith(prefix)) return `${swedish[prefix.trim()] ?? prefix.trim()} ${t(key.slice(prefix.length))}` as T;
  }
  // Service descriptions are assembled into one accessible dialog description.
  const contact = "You can contact me by phone, Instagram, WhatsApp or TikTok to discuss your event and book this service.";
  if (key.endsWith(contact)) return `${t(key.slice(0, -contact.length).trim())} ${swedish[contact]}`.trim() as T;
  return value;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const website = useWebsite();
  useEffect(() => {
    const requested = new URLSearchParams(location.search).get("lang");
    let saved: string | null = null;
    try { saved = localStorage.getItem("dj-language"); } catch { /* English remains the default. */ }
    setLanguage(requested === "sv" || requested === "en" ? requested : saved === "sv" || saved === "en" ? saved : website.languages?.default ?? "en");
  }, [website.languages]);
  return children;
}

export function LanguageSwitcher({ hideWhenSingle = false }: { hideWhenSingle?: boolean } = {}) {
  const selected = useLanguage();
  const enabled = (["en", "sv"] as const).filter(code => getWebsite().languages?.[code] !== false);
  if (hideWhenSingle && enabled.length < 2) return null;
  return <div data-public-language-switcher={hideWhenSingle ? "" : undefined} role="group" aria-label={selected === "sv" ? "Välj språk" : "Choose language"} className="flex shrink-0 items-center gap-1 font-display text-xs font-bold">
    {enabled.map((code) => <button key={code} type="button" lang={code}
      aria-label={code === "sv" ? "Svenska" : "English"} aria-pressed={selected === code}
      onClick={() => setLanguage(code)}
      className={`min-h-9 min-w-9 cursor-pointer rounded-sm px-2 focus-visible:outline-2 focus-visible:outline-primary ${selected === code ? "bg-primary text-white" : "text-foreground/70 hover:text-primary"}`}>
      {code.toUpperCase()}
    </button>)}
  </div>;
}
