import { asset, sectionEnabled, STATIC_PREVIEW } from "@/lib/website";
import { t, useLanguage } from "@/lib/language";
import { useState, type FormEvent } from "react";
import { ArrowRight, Facebook, Instagram, Phone, X } from "lucide-react";
import { BLOG_POSTS, DJ_NAME, DJ_PHONE_DISPLAY, DJ_PHONE_TEL, DJ_SHORT, SOCIAL_LINKS } from "@/data/dj-data";
import { SwedenFlag, TikTokIcon, WhatsAppIcon } from "@/components/SocialIcons";

interface BookingModalProps {
  open: boolean;
  subject: string;
  onClose: () => void;
}

export function BookingModal({ open, subject, onClose }: BookingModalProps) {
  useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-deep/85 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-sm border border-primary/50 bg-surface-elevated p-7 shadow-2xl">
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            onClose();
          }}
          aria-label={t("Close modal")}
          className="absolute right-4 top-4 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="section-eyebrow">{t(DJ_NAME)}</p>
        <h3 className="mt-2 font-display text-2xl font-black uppercase text-foreground">{t(subject)}</h3>

        {t(submitted ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("Thanks, ")}{t(name)}{t(". Your request for ")}<strong className="text-foreground">{t(subject)}</strong> {t("has been noted. Our booking team will follow up at ")}{t(email)}{t(". ")}</p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setName("");
                setEmail("");
                onClose();
              }}
              className="btn-magenta w-full cursor-pointer rounded-sm py-3 font-display text-xs font-bold tracking-[0.2em] uppercase"
            >
              {t("Done ")}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block font-display text-xs font-bold tracking-wider uppercase text-muted-foreground">
                {t("Your Name ")}</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("Alex Rivera")}
                className="mt-1.5 w-full rounded-sm border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-display text-xs font-bold tracking-wider uppercase text-muted-foreground">
                {t("Email Address ")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("you@example.com")}
                className="mt-1.5 w-full rounded-sm border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="btn-magenta w-full cursor-pointer rounded-sm py-3 font-display text-xs font-bold tracking-[0.2em] uppercase"
            >
              {t("Confirm Request ")}</button>
          </form>
        ))}
      </div>
    </div>
  );
}

export function CommunityAndFooter() {
  const language = useLanguage();
  return (
    <>
      {/* 9. Community Banner */}
      <section id="community" hidden={!sectionEnabled("community")} className="relative overflow-hidden border-y border-primary/30 bg-gradient-to-r from-surface-deep via-primary/20 to-surface-deep py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black tracking-tight uppercase text-foreground sm:text-5xl">
            {t("JOIN MY TRIBE ")}<span className="text-primary">{t(DJ_SHORT)}</span>
          </h2>
        </div>
      </section>

      {/* 10. Blog / Music News Section */}
      <section hidden={!sectionEnabled("news")} id="news" className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="section-eyebrow">{t("Blog")}</p>
            <h2 className="mt-2 font-display text-4xl font-black tracking-tight uppercase text-foreground sm:text-5xl">
              {t("Music News ")}</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {t(BLOG_POSTS.map((post, index) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-sm border border-border bg-card/80 transition-colors hover:border-primary/60"
              >
                <div className="aspect-[9/16] overflow-hidden">
                  <video
                    src={asset(`/videos/news-${index + 1}.mp4`)}
                    poster={asset(`/videos/news-${index + 1}.jpg`)}
                    aria-label={t(post.title)}
                    controls playsInline preload="metadata"
                    className="h-full w-full bg-black object-contain"
                    onPlay={(event) => {
                      window.dispatchEvent(new Event("dj:podcast-play"));
                      document.querySelectorAll("video").forEach((video) => {
                        if (video !== event.currentTarget) video.pause();
                      });
                    }}
                    onEnded={() => window.dispatchEvent(new Event("dj:podcast-stop"))}
                  />
                </div>
                <div className="p-6">
                  <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-primary">{t(post.date)}</p>
                  <h3 className="mt-2 font-display text-xl font-extrabold uppercase text-foreground">{t(post.title)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(post.excerpt)}</p>
                  <a
                    href={asset("#news")}
                    className="mt-5 inline-flex items-center gap-1.5 font-display text-xs font-bold tracking-[0.18em] uppercase text-foreground transition-colors hover:text-primary"
                  >
                    {t("Read More ")}<ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            )))}
          </div>

          <div className="mt-12 text-center">
            <a
              href={asset("#news")}
              className="btn-ghost-club inline-block rounded-sm px-8 py-3.5 font-display text-xs font-bold tracking-[0.2em] uppercase"
            >
              {t("More Posts ")}</a>
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer hidden={!sectionEnabled("contact")} id="contact" className="border-t border-border bg-surface-deep py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 text-center sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-foreground/90">
            <a
              href={asset(`tel:${DJ_PHONE_TEL}`)}
              className="flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Phone className="h-4 w-4 text-primary" />
              <SwedenFlag className="h-3.5 w-5 shrink-0 rounded-[1px]" />
              {t(DJ_PHONE_DISPLAY)}
            </a>
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t("We welcome artists, event organisers, sponsors, venues and other creative collaborations. ")}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={asset("https://www.instagram.com/arya_entertainment.se/")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("Instagram")}
              className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground/80 transition-colors hover:border-primary hover:text-primary"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a href={asset("https://www.facebook.com/p/Arya-Entertainment-AB-100083463424063/")}
              target="_blank" rel="noopener noreferrer" aria-label={t("Facebook")}
              className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground/80 transition-colors hover:border-primary hover:text-primary">
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={asset(SOCIAL_LINKS.tiktok)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("TikTok")}
              className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground/80 transition-colors hover:border-primary hover:text-primary"
            >
              <TikTokIcon className="h-4 w-4" />
            </a>
            <a
              href={asset(SOCIAL_LINKS.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("WhatsApp")}
              className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground/80 transition-colors hover:border-primary hover:text-primary"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-sm border border-primary/80 bg-primary/15 font-display text-xs font-black tracking-widest text-foreground">
              {t(DJ_SHORT)}
            </span>
            <span className="font-display text-lg font-extrabold tracking-wider uppercase text-foreground">
              {t(DJ_NAME)}
            </span>
          </div>

          {!STATIC_PREVIEW && <a href={asset("/admin")} className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("Admin")}</a>}
          <a href={asset(language === "sv" ? "/integritet/sv.html" : "/integritet/index.html?lang=en")} className="text-sm text-muted-foreground transition-colors hover:text-primary">{t("Privacy & local storage")}</a>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("© 2026 ")}<strong className="font-bold text-foreground">{t("DJ Wahid")}</strong> {t("AB powered by")}{t(" ")}
            <a href={asset("https://daladana.se/")} target="_blank" rel="noopener noreferrer" className="font-bold text-foreground transition-colors hover:text-primary">{t("DALADANA")}</a>
          </p>
        </div>
      </footer>
    </>
  );
}
