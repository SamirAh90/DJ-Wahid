import { useSyncExternalStore } from "react";
export const STATIC_PREVIEW = import.meta.env['VITE_SITE_STATIC_ONLY'] === 'true';
export type WebsiteConfig = {
  seo?: Partial<Record<"en" | "sv", { title?: string; description?: string }>>;
  languages?: { en: boolean; sv: boolean; default: "en" | "sv" };
  sections?: Record<string, boolean>;
  texts?: Record<string, { en?: string; sv?: string }>;
  media?: Record<string, string>;
  privacy?: { en?: string; sv?: string };
  privacyTitles?: { en?:string;sv?:string };
};
export type WebsiteSettings = { config: WebsiteConfig; version: string };
let website: WebsiteConfig = {};
const listeners = new Set<() => void>();
export const getWebsite = () => website;
export function applyWebsite(config: WebsiteConfig) { website = config; listeners.forEach(listener => listener()); }
export function useWebsite() { return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, getWebsite, getWebsite); }
export function sectionEnabled(id: string) { return website.sections?.[id] !== false; }
export function asset(source: string) { return website.media?.[source] ?? source; }
