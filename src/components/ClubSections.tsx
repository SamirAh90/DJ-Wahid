import { asset, sectionEnabled } from "@/lib/website";
import { EventCards } from "@/components/EventCards";
import { t, useLanguage } from "@/lib/language";
import { RentalSection } from "@/components/RentalSection";
import {
  Briefcase,
  Disc3,
  Heart,
  Headphones,
  Instagram,
  ListMusic,
  MessageCircle,
  Music,
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

export function ClubSections({ onGetTickets, onBookService, events, photos }: ClubSectionsProps) {
  useLanguage();
  return (
    <>
      {/* 3. Biography Section */}
      <section hidden={!sectionEnabled("biography")} id="biography" className="bg-background py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-sm border border-border bg-surface-elevated">
              <img
                src={asset(BIO_IMAGE)}
                alt={t(`${DJ_NAME} artist portrait`)}
                className="aspect-[4/5] w-full object-cover object-top"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-deep/65 via-transparent to-transparent" />
            </div>
          </div>
          <div className="lg:col-span-7">
            <p className="section-eyebrow">{t("Welcome")}</p>
            <h2 className="mt-3 font-display text-4xl font-black tracking-tight uppercase text-foreground sm:text-5xl">
              {t("My Biography ")}</h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-muted-foreground">
              <p>{t("I am an Afghan and Persian DJ based in Malmö, bringing Afghan, Persian, Kurdish and international music together for multicultural weddings, birthdays, graduation parties, corporate events and club nights.")}</p>
              <p>{t("My experience includes Afghan-Danish and Afghan-Kurdish weddings, Persian celebrations and family parties. From Malmö and Eslöv to Uppsala and live events in Berlin, I tailor every set to the people, cultures and energy on the dance floor.")}</p>
              <p>{t("Music is not just my profession – it's my passion. For me, being a DJ is about bringing people together, creating emotions and turning special occasions into unforgettable memories.")}</p>
              <p>{t("With years of experience behind the decks and an extensive music library, I offer professional DJ services for weddings, private parties, birthdays, corporate events and club nights.")}</p>
              <p>{t("My ability to read the crowd, feel the energy and play the right track at the right moment makes every performance unique. From timeless classics and international hits to oriental rhythms and modern beats, I tailor my music to your vision and the atmosphere of your event.")}</p>
              <p>{t("Throughout my journey, I have had the pleasure of meeting incredible people, building valuable collaborations and being part of countless memorable celebrations.")}</p>
              <p>{t("My musical journey continues, and I look forward to bringing my passion, energy and experience to your next event.")}</p>
              <p className="font-bold text-foreground">{t("You bring the people. I bring the music, the energy and the atmosphere.")}</p>
              <p>{t("See you on the dance floor!")}</p>
            </div>
            <button
              type="button"
              onClick={() => onBookService("Book Now")}
              className="btn-magenta mt-8 inline-flex items-center gap-2.5 rounded-sm px-7 py-3.5 font-display text-xs font-bold tracking-[0.2em] uppercase"
            >
              {t("Book Now ")}</button>
          </div>
        </div>
      </section>

      {/* 4. Instagram Feed Section (#DJR) */}
      <section hidden={!sectionEnabled("instagram")} id="instagram" className="bg-surface-deep py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-eyebrow">{t("Follow Me on Instagram")}</p>
              <h2 className="mt-2 font-display text-4xl font-black tracking-tight uppercase text-foreground sm:text-5xl">
                {t("#")}{t(DJ_SHORT)}
              </h2>
            </div>
            <div className="flex items-center gap-6 font-display text-xs font-bold tracking-[0.2em] uppercase">
              <a
                href={asset(SOCIAL_LINKS.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary transition-colors hover:text-foreground"
              >
                {t("Instagram ")}</a>
              <a href={asset("#instagram")} className="text-muted-foreground transition-colors hover:text-primary">
                {t("More Galleries ")}</a>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {t(photos.map((post) => (
              <div
                key={post.id}
                className="group relative aspect-square overflow-hidden rounded-sm border border-border bg-surface-elevated"
              >
                <img
                  src={asset(post.image_url)}
                  alt={t(post.caption || `${DJ_NAME} gallery photo`)}
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-deep/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Instagram className="h-6 w-6 text-primary" />
                  <div className="flex items-center gap-5 font-display text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Heart className="h-4 w-4 text-primary" />
                      {t(post.likes)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4 text-cyan-glow" />
                      {t(post.comments)}
                    </span>
                  </div>
                </div>
              </div>
            )))}
          </div>
        </div>
      </section>

      <EventCards events={events} onGetTickets={onGetTickets} onContact={onBookService} />

      <RentalSection onBook={onBookService} />

      {/* 7. Services ("Where Do I Play") */}
      <section hidden={!sectionEnabled("services")} id="services" className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="section-eyebrow">{t("Services")}</p>
            <h2 className="mt-2 font-display text-4xl font-black tracking-tight uppercase text-foreground sm:text-5xl">
              {t("Where Do I Play ")}</h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {t(SERVICES_LIST.map((service) => {
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
                    {t(service.title)}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{t(service.description)}</p>
                </button>
              );
            }))}
          </div>
        </div>
      </section>
    </>
  );
}
