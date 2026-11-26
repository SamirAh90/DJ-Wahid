import { useState, type FormEvent } from "react";
import { ArrowRight, Instagram, Phone, X } from "lucide-react";
import { BLOG_POSTS, DJ_NAME, DJ_PHONE_DISPLAY, DJ_PHONE_TEL, DJ_SHORT, SOCIAL_LINKS } from "@/data/dj-data";
import { TikTokIcon, WhatsAppIcon } from "@/components/SocialIcons";

interface BookingModalProps {
  open: boolean;
  subject: string;
  onClose: () => void;
}

export function BookingModal({ open, subject, onClose }: BookingModalProps) {
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
          aria-label="Close modal"
          className="absolute right-4 top-4 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="section-eyebrow">{DJ_NAME}</p>
        <h3 className="mt-2 font-display text-2xl font-black uppercase text-foreground">{subject}</h3>

        {submitted ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Thanks, {name}. Your request for <strong className="text-foreground">{subject}</strong> has been noted.
              Our booking team will follow up at {email}.
            </p>
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
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block font-display text-xs font-bold tracking-wider uppercase text-muted-foreground">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="mt-1.5 w-full rounded-sm border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-display text-xs font-bold tracking-wider uppercase text-muted-foreground">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-sm border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="btn-magenta w-full cursor-pointer rounded-sm py-3 font-display text-xs font-bold tracking-[0.2em] uppercase"
            >
              Confirm Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function CommunityAndFooter() {
  return (
    <>
      {/* 9. Community Banner */}
      <section className="relative overflow-hidden border-y border-primary/30 bg-gradient-to-r from-surface-deep via-primary/20 to-surface-deep py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black tracking-tight uppercase text-foreground sm:text-5xl">
            JOIN MY TRIBE <span className="text-primary">{DJ_SHORT}</span>
          </h2>
        </div>
      </section>

      {/* 10. Blog / Music News Section */}
      <section id="news" className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="section-eyebrow">Blog</p>
            <h2 className="mt-2 font-display text-4xl font-black tracking-tight uppercase text-foreground sm:text-5xl">
              Music News
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {BLOG_POSTS.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-sm border border-border bg-card/80 transition-colors hover:border-primary/60"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-primary">{post.date}</p>
                  <h3 className="mt-2 font-display text-xl font-extrabold uppercase text-foreground">{post.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                  <a
                    href="#news"
                    className="mt-5 inline-flex items-center gap-1.5 font-display text-xs font-bold tracking-[0.18em] uppercase text-foreground transition-colors hover:text-primary"
                  >
                    Read More <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a
              href="#news"
              className="btn-ghost-club inline-block rounded-sm px-8 py-3.5 font-display text-xs font-bold tracking-[0.2em] uppercase"
            >
              More Posts
            </a>
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer id="contact" className="border-t border-border bg-surface-deep py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 text-center sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-foreground/90">
            <a
              href={`tel:${DJ_PHONE_TEL}`}
              className="flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Phone className="h-4 w-4 text-primary" />
              {DJ_PHONE_DISPLAY}
            </a>
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Instagram className="h-4 w-4 text-primary" />
              @dj.wahid2
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground/80 transition-colors hover:border-primary hover:text-primary"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={SOCIAL_LINKS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground/80 transition-colors hover:border-primary hover:text-primary"
            >
              <TikTokIcon className="h-4 w-4" />
            </a>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground/80 transition-colors hover:border-primary hover:text-primary"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-sm border border-primary/80 bg-primary/15 font-display text-xs font-black tracking-widest text-foreground">
              {DJ_SHORT}
            </span>
            <span className="font-display text-lg font-extrabold tracking-wider uppercase text-foreground">
              {DJ_NAME}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">&copy; 2026. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
