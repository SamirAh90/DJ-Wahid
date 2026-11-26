import { t, useLanguage } from "@/lib/language";
interface IconProps {
  className?: string;
}

export function SwedenFlag({ className }: IconProps) {
  useLanguage();
  return (
    <svg viewBox="0 0 16 10" role="img" aria-label={t("Sweden")} focusable="false" className={className}>
      <rect width="16" height="10" fill="#006aa7" />
      <path d="M0 5h16M6 0v10" stroke="#fecc00" strokeWidth="2" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  useLanguage();
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.8a8.5 8.5 0 1 1 16.2-4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 7.3c-.3 0-.6.2-.8.5-.4.5-.7 1-.6 1.7.2 1.4 1.3 3 2.6 4.2 1.4 1.2 3.1 2.1 4.5 2.1.7 0 1.3-.4 1.7-.9.2-.3.3-.7.2-.9l-1.7-.9c-.2-.1-.4-.1-.6.2l-.7.8c-.2.1-.4.1-.6 0a7.3 7.3 0 0 1-3.1-2.7c-.1-.2-.1-.4 0-.5l.6-.8c.1-.2.2-.4.1-.6L9 7.5c-.1-.2-.3-.2-.8-.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** TikTok glyph — the icon library has no official TikTok mark. */
export function TikTokIcon({ className }: IconProps) {
  useLanguage();
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      className={className}
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.6 3.17-5.91 3.21-1.93.08-3.87-.51-5.34-1.79-1.43-1.26-2.28-3.11-2.32-5.01-.02-1.16.13-2.33.62-3.36C2.9 8.76 5.31 7.23 8.03 7.13c.85-.04 1.71.02 2.53.25v4.14c-.95-.36-2.03-.36-2.97.01-.95.37-1.71 1.17-2.04 2.15-.21.57-.26 1.19-.15 1.78.19 1.23 1.28 2.29 2.53 2.48.67.1 1.36.04 1.99-.21.74-.29 1.39-.8 1.79-1.46.35-.58.52-1.26.56-1.93.05-1.25.03-2.5.03-3.75V.02h.02z" />
    </svg>
  );
}
