import { asset, sectionEnabled, getWebsite } from "@/lib/website";
import { CalendarDays, ImageIcon, MapPin, Ticket } from "lucide-react";
import type { SiteEvent } from "@/data/site.functions";
import { t, useLanguage } from "@/lib/language";

export function EventCards({ events, onGetTickets, onContact }: {
  events: SiteEvent[]; onGetTickets: (title: string) => void; onContact: (service: string) => void;
}) {
  useLanguage();
  return <section hidden={!sectionEnabled("events")} id="events" className="bg-background py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="section-eyebrow">{t("Events")}</p>
        <h2 className="mt-2 font-display text-4xl font-black uppercase text-foreground sm:text-5xl">{t("Upcoming Dates")}</h2>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {(events.length ? events : [null]).map((event) => <article data-event-card="" key={event?.id ?? "upcoming"} className="flex min-w-0 flex-col overflow-hidden rounded-sm border border-border bg-card/80 transition-colors hover:border-primary/60">
          <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-primary/20 via-surface-elevated to-cyan-glow/15">
            {event && getWebsite().media?.[`event:${event.id}`] ? <img src={asset(`event:${event.id}`)} alt={t(event.title)} className="absolute inset-0 h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-3 text-muted-foreground"><ImageIcon className="h-12 w-12 text-primary/65" /><span className="text-xs">{t("Event photo coming soon")}</span></div>}
            {event && <span className="absolute left-4 top-4 rounded-sm bg-surface-deep/90 px-3 py-2 font-display text-sm font-bold text-foreground">{event.day_label} {t(event.month_label)}</span>}
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h3 className="font-display text-xl font-extrabold text-foreground">{t(event?.title ?? "Next event")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(event?.description || "New dates and event details will be announced here. Contact us for upcoming performances and bookings.")}</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div><dt className="flex items-center gap-2 font-bold text-foreground"><CalendarDays className="h-4 w-4 text-primary" />{t("Date")}</dt><dd className="mt-1 text-muted-foreground">{event ? `${event.day_label} ${t(event.month_label)}` : t("To be announced")}</dd></div>
              <div><dt className="flex items-center gap-2 font-bold text-foreground"><MapPin className="h-4 w-4 text-primary" />{t("Venue")}</dt><dd className="mt-1 text-muted-foreground">{t(event?.location || "To be announced")}</dd></div>
              <div><dt className="flex items-center gap-2 font-bold text-foreground"><Ticket className="h-4 w-4 text-primary" />{t("Tickets")}</dt><dd className="mt-1 text-muted-foreground">{t(event?.price || "Ticket details coming soon")}</dd></div>
            </dl>
            <button type="button" onClick={() => event ? onGetTickets(event.title) : onContact("Book Now")} className="btn-magenta mt-auto w-full cursor-pointer rounded-sm px-3 py-3 text-xs font-bold"><span className="block py-1">{t(event ? "Get Tickets" : "Contact us")}</span></button>
          </div>
        </article>)}
      </div>
    </div>
  </section>;
}
