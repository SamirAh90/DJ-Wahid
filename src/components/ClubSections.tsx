import {
  Briefcase,
  Disc3,
  Download,
  Heart,
  Headphones,
  Instagram,
  ListMusic,
  MessageCircle,
  Music,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { BIO_IMAGE, DJ_NAME, DJ_SHORT, SERVICES_LIST, SOCIAL_LINKS } from "@/data/dj-data";
import type { SiteEvent, SitePhoto } from "@/data/site.functions";

interface ClubSectionsProps {
  onGetTickets: (title: string) => void;
  onBuyVinyl: () => void;
  cartCount: number;
  onBookService: (service: string) => void;
  events: SiteEvent[];
  photos: SitePhoto[];
}

const SERVICE_ICONS = {
  weddings: Sparkles,
  clubs: Disc3,
  corporate: Briefcase,
  playlists: ListMusic,
  lessons: Headphones,
} as const;

export function ClubSections({ onGetTickets, onBuyVinyl, cartCount, onBookService, events, photos }: ClubSectionsProps) {
  return (
    <>
      {/* 3. Biography Section */}
      <section id="biography" className="bg-background py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-sm border border-border bg-surface-elevated">
              <img
                src={BIO_IMAGE}
                alt={`${DJ_NAME} artist portrait`}
                className="aspect-[4/5] w-full object-cover object-top"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-deep/65 via-transparent to-transparent" />
            </div>
          </div>
          <div className="lg:col-span-7">
            <p className="section-eyebrow">Welcome</p>
            <h2 className="mt-3 font-display text-4xl font-black tracking-tight uppercase text-foreground sm:text-5xl">
              My Biography
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Having enjoyed a breathlessly successful season, there can be no doubting {DJ_NAME}&apos;s position as one of
              the most influential electronic artists of the moment. Continues to transition rapidly from the techno
              underground.
            </p>
            <a
              href="#contact"
              className="btn-magenta mt-8 inline-flex items-center gap-2.5 rounded-sm px-7 py-3.5 font-display text-xs font-bold tracking-[0.2em] uppercase"
            >
              <Download className="h-4 w-4" />
              Presskit Here
            </a>
          </div>
        </div>
      </section>

      {/* 4. Instagram Feed Section (#DJR) */}
      <section id="instagram" className="bg-surface-deep py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-eyebrow">Follow Me on Instagram</p>
              <h2 className="mt-2 font-display text-4xl font-black tracking-tight uppercase text-foreground sm:text-5xl">
                #{DJ_SHORT}
              </h2>
            </div>
            <div className="flex items-center gap-6 font-display text-xs font-bold tracking-[0.2em] uppercase">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary transition-colors hover:text-foreground"
              >
                Instagram
              </a>
              <a href="#instagram" className="text-muted-foreground transition-colors hover:text-primary">
                More Galleries
              </a>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((post) => (
              <div
                key={post.id}
                className="group relative aspect-square overflow-hidden rounded-sm border border-border bg-surface-elevated"
              >
                <img
                  src={post.image_url}
                  alt={post.caption || `${DJ_NAME} gallery photo`}
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-deep/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Instagram className="h-6 w-6 text-primary" />
                  <div className="flex items-center gap-5 font-display text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Heart className="h-4 w-4 text-primary" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4 text-cyan-glow" />
                      {post.comments}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Events / Upcoming Dates Section */}
      <section id="events" className="bg-background py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="section-eyebrow">Events</p>
            <h2 className="mt-2 font-display text-4xl font-black tracking-tight uppercase text-foreground sm:text-5xl">
              Upcoming Dates
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="flex flex-col justify-between gap-6 rounded-sm border border-border bg-card/80 p-6 transition-colors hover:border-primary/60 sm:flex-row sm:items-center sm:p-8"
              >
                <div className="flex items-center gap-6">
                  <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-sm border border-primary/50 bg-primary/15">
                    <span className="font-display text-3xl font-black leading-none text-foreground">{evt.day_label}</span>
                    <span className="mt-1 font-display text-xs font-bold tracking-widest uppercase text-primary">
                      {evt.month_label}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-extrabold tracking-wide uppercase text-foreground">
                      {evt.title}
                    </h3>
                    <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{evt.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onGetTickets(evt.title)}
                  className="btn-magenta shrink-0 cursor-pointer rounded-sm px-6 py-3 font-display text-xs font-bold tracking-[0.2em] uppercase"
                >
                  Get Tickets
                </button>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => onGetTickets("Upcoming Club Tour")}
              className="btn-ghost-club cursor-pointer rounded-sm px-8 py-3.5 font-display text-xs font-bold tracking-[0.2em] uppercase"
            >
              More Events
            </button>
          </div>
        </div>
      </section>

      {/* 6. Merch & Vinyl Product Callout */}
      <section id="shop" className="relative overflow-hidden border-y border-border bg-surface-deep py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="flex items-center justify-center lg:col-span-6">
            <div className="relative flex items-center">
              <div className="relative z-10 flex h-56 w-56 flex-col justify-between rounded-sm border border-primary/40 bg-gradient-to-br from-surface-elevated via-background to-primary/25 p-5 shadow-2xl sm:h-64 sm:w-64">
                <span className="font-display text-xs font-bold tracking-[0.25em] uppercase text-cyan-glow">
                  {DJ_SHORT} Limited Edition
                </span>
                <div>
                  <p className="font-display text-2xl font-black leading-tight uppercase text-foreground">SUPERMIX</p>
                  <p className="font-display text-xs font-bold tracking-[0.2em] uppercase text-primary">
                    12&Prime; Club Vinyl
                  </p>
                </div>
              </div>
              <div className="vinyl-spin -ml-20 grid h-52 w-52 place-items-center rounded-full border-4 border-foreground/15 bg-surface-deep shadow-2xl sm:h-60 sm:w-60">
                <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-primary bg-primary/25 font-display text-xs font-black tracking-widest text-foreground">
                  {DJ_SHORT}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center lg:col-span-6 lg:text-left">
            <p className="font-display text-4xl font-black text-primary sm:text-5xl">$21</p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-tight uppercase text-foreground sm:text-4xl">
              SUPERMIX ENTERTAINMENT 12&Prime; Vinyl
            </h2>
            <p className="mt-4 max-w-md text-sm text-muted-foreground lg:mx-0 mx-auto">
              180-gram heavyweight club pressing featuring extended electro house and deep house mixes.
            </p>
            <button
              type="button"
              onClick={onBuyVinyl}
              className="btn-magenta mt-8 inline-flex cursor-pointer items-center gap-3 rounded-sm px-8 py-4 font-display text-xs font-bold tracking-[0.2em] uppercase"
            >
              <ShoppingCart className="h-4 w-4" />
              Buy Now
              {cartCount > 0 && (
                <span className="rounded-full bg-surface-deep px-2 py-0.5 text-[11px] font-extrabold text-foreground">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 7. Services ("Where Do I Play") */}
      <section id="services" className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="section-eyebrow">Services</p>
            <h2 className="mt-2 font-display text-4xl font-black tracking-tight uppercase text-foreground sm:text-5xl">
              Where Do I Play
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SERVICES_LIST.map((service) => {
              const Icon = SERVICE_ICONS[service.id] ?? Music;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => onBookService(service.title)}
                  className="group flex cursor-pointer flex-col items-center rounded-sm border border-border bg-card/75 p-7 text-center transition-all hover:-translate-y-1 hover:border-primary hover:bg-surface-elevated"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 font-display text-sm font-extrabold tracking-wider uppercase text-foreground">
                    {service.title}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{service.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}