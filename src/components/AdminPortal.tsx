import { AdminDashboard } from "@/components/AdminDashboard";
import { STATIC_PREVIEW } from "@/lib/website";
import { MediaLibrary } from "@/components/MediaLibrary";
import { t, useLanguage, LanguageSwitcher } from "@/lib/language";
import { WebsiteEditor } from "@/components/WebsiteEditor";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, LogOut, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { getSession, signIn, signUp, signOut as endSession, uploadPhoto } from "@/lib/api";
import { adminContentQuery, siteContentQuery } from "@/data/site.queries";
import {
  deleteEvent,
  deletePhoto,
  saveEvent,
  savePhoto,
  type SiteEvent,
  type SitePhoto,
} from "@/data/site.functions";

type EventDraft = {
  id?: string;
  day_label: string;
  month_label: string;
  title: string;
  description: string;
  location: string;
  price: string;
  event_date: string;
  published: boolean;
};

type PhotoDraft = {
  image_url: string;
  caption: string;
  likes: string;
  comments: string;
  sort_order: string;
  published: boolean;
};

const EMPTY_EVENT: EventDraft = {
  day_label: "",
  month_label: "",
  title: "",
  description: "",
  location: "",
  price: "",
  event_date: "",
  published: true,
};

const EMPTY_PHOTO: PhotoDraft = {
  image_url: "",
  caption: "",
  likes: "0",
  comments: "0",
  sort_order: "0",
  published: true,
};

function toEventDraft(event: SiteEvent): EventDraft {
  return {
    id: event.id,
    day_label: event.day_label,
    month_label: event.month_label,
    title: event.title,
    description: event.description,
    location: event.location,
    price: event.price,
    event_date: event.event_date ?? "",
    published: event.published,
  };
}

const fieldClass =
  "w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
const labelClass = "block font-display text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground";

/* ------------------------------------------------------------------ */
/* Sign-in / sign-up                                                   */
/* ------------------------------------------------------------------ */

function AuthPanel() {
  useLanguage();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);

    if (mode === "signin") {
      const error = await signIn(email, password).then(() => null, (error: Error) => error);
      setBusy(false);
      if (error) toast.error(t(error.message));
      return;
    }

    const { data, error } = await signUp(email, password).then(
      (data) => ({ data, error: null }),
      (error: Error) => ({ data: null, error }),
    );
    setBusy(false);

    if (error) {
      toast.error(t(error.message));
      return;
    }

    if (!data?.session) {
      setNotice("Check your inbox and confirm the email, then sign in here.");
      setMode("signin");
      return;
    }

    toast.success(t("Account created — you are signed in."));
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-6 flex justify-end"><LanguageSwitcher /></div>
      <p className="section-eyebrow">{t("DJ Wahid")}</p>
      <h1 className="mt-2 font-display text-3xl font-black uppercase text-foreground">{t("Admin Portal")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {t("Sign in to add upcoming events and gallery photos. The first account created here becomes the admin. ")}</p>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-sm border border-border bg-card/70 p-6">
        <div>
          <label className={labelClass} htmlFor="admin-email">
            {t("Email ")}</label>
          <input
            id="admin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("you@example.com")}
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="admin-password">
            {t("Password ")}</label>
          <input
            id="admin-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("At least 6 characters")}
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn-magenta flex w-full items-center justify-center gap-2 rounded-sm py-3 font-display text-xs font-bold tracking-[0.2em] uppercase disabled:opacity-60"
        >
          {t(busy && <Loader2 className="h-4 w-4 animate-spin" />)}
          {t(mode === "signin" ? "Sign in" : "Create account")}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setNotice(null);
          }}
          className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          {t(mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in")}
        </button>

        {t(notice && <p className="text-sm font-medium text-cyan-glow">{t(notice)}</p>)}
      </form>

      <a href="/" className="mt-6 text-center text-xs text-muted-foreground hover:text-primary">
        {t("Back to the site ")}</a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Events panel                                                        */
/* ------------------------------------------------------------------ */

function EventsPanel() {
  useLanguage();
  const queryClient = useQueryClient();
  const writeEvent = saveEvent;
  const removeEvent = deleteEvent;
  const [draft, setDraft] = useState<EventDraft>(EMPTY_EVENT);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery(adminContentQuery);
  const events = data?.events ?? [];

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-content"] });
    queryClient.invalidateQueries({ queryKey: ["site-content"] });
  }, [queryClient]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const input = {
        day_label: draft.day_label,
        month_label: draft.month_label,
        title: draft.title,
        description: draft.description,
        location: draft.location,
        price: draft.price,
        event_date: draft.event_date.trim() || null,
        published: draft.published,
      };
      if (draft.id) Object.assign(input, { id: draft.id });

      await writeEvent({ data: input });
      toast.success(t(draft.id ? "Event updated" : "Event added"));
      setDraft(EMPTY_EVENT);
      refresh();
    } catch (error) {
      toast.error(t(error instanceof Error ? error.message : "Could not save the event."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (event: SiteEvent) => {
    if (!window.confirm(t(`Delete "${event.title}"?`))) return;
    try {
      await removeEvent({ data: { id: event.id } });
      toast.success(t("Event deleted"));
      if (draft.id === event.id) setDraft(EMPTY_EVENT);
      refresh();
    } catch (error) {
      toast.error(t(error instanceof Error ? error.message : "Could not delete the event."));
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <form onSubmit={save} className="space-y-4 rounded-sm border border-border bg-card/70 p-6 lg:col-span-5">
        <h2 className="font-display text-sm font-black tracking-[0.2em] uppercase text-foreground">
          {t(draft.id ? "Edit event" : "Add an event")}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t("Day")}</label>
            <input
              value={draft.day_label}
              onChange={(e) => setDraft({ ...draft, day_label: e.target.value })}
              placeholder={t("25")}
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
          <div>
            <label className={labelClass}>{t("Month")}</label>
            <input
              value={draft.month_label}
              onChange={(e) => setDraft({ ...draft, month_label: e.target.value })}
              placeholder={t("Nov")}
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t("Title")}</label>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder={t("Boiler Room Philadelphia")}
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>

        <div>
          <label className={labelClass}>{t("Description")}</label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t("Location")}</label>
            <input
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              placeholder={t("Philadelphia, PA")}
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
          <div>
            <label className={labelClass}>{t("Price")}</label>
            <input
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              placeholder={t("$45")}
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t("Exact date (optional)")}</label>
          <input
            type="date"
            value={draft.event_date}
            onChange={(e) => setDraft({ ...draft, event_date: e.target.value })}
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
            className="h-4 w-4 accent-primary"
          />
          {t("Show this event on the site ")}</label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={busy}
            className="btn-magenta flex flex-1 items-center justify-center gap-2 rounded-sm py-3 font-display text-xs font-bold tracking-[0.2em] uppercase disabled:opacity-60"
          >
            {t(busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />)}
            {t(draft.id ? "Save changes" : "Add event")}
          </button>
          {t(draft.id && (
            <button
              type="button"
              onClick={() => setDraft(EMPTY_EVENT)}
              className="rounded-sm border border-border px-4 font-display text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground"
            >
              {t("Cancel ")}</button>
          ))}
        </div>
      </form>

      <div className="space-y-3 lg:col-span-7">
        {t(isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("Loading events… ")}</p>
        ))}

        {t(!isLoading && events.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("No events yet — add your first one.")}</p>
        ))}

        {t(events.map((event) => (
          <div
            key={event.id}
            className="flex items-start justify-between gap-4 rounded-sm border border-border bg-card/70 p-4"
          >
            <div className="min-w-0">
              <p className="font-display text-sm font-extrabold uppercase text-foreground">
                {t(event.day_label)} {t(event.month_label)} {t("· ")}{t(event.title)}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {t([event.location, event.price].filter(Boolean).join(" · ") || "No location or price")}
              </p>
              {t(!event.published && (
                <p className="mt-1 font-display text-[10px] font-bold tracking-[0.18em] uppercase text-primary">
                  {t("Hidden from the site ")}</p>
              ))}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setDraft(toEventDraft(event))}
                className="rounded-sm border border-border px-3 py-1.5 font-display text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground hover:border-primary hover:text-primary"
              >
                {t("Edit ")}</button>
              <button
                type="button"
                onClick={() => remove(event)}
                aria-label={t(`Delete ${event.title}`)}
                className="grid h-8 w-8 place-items-center rounded-sm border border-border text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Photos panel                                                        */
/* ------------------------------------------------------------------ */

function PhotosPanel() { return <MediaLibrary />; }

/* ------------------------------------------------------------------ */
/* Portal shell                                                        */
/* ------------------------------------------------------------------ */

export function AdminPortal() {
  useLanguage();
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [tab, setTab] = useState<"website" | "events" | "photos">("website");

  useEffect(() => {
    if(STATIC_PREVIEW)return;
    let active = true;

    const refreshSession = () => {
      queryClient.removeQueries({ queryKey: ["admin-content"] });
      void getSession().then((session) => {
        if (!active) return;
        setSignedIn(Boolean(session.user));
        setReady(true);
      }).catch((error: Error) => {
        if (!active) return;
        setSignedIn(false);
        setReady(true);
        toast.error(t(error.message));
      });
    };
    window.addEventListener("site-auth-changed", refreshSession);
    refreshSession();

    return () => {
      active = false;
      window.removeEventListener("site-auth-changed", refreshSession);
    };
  }, [queryClient]);

  const signOut = async () => {
    try {
      await endSession();
      queryClient.removeQueries({ queryKey: ["admin-content"] });
      toast.success(t("Signed out"));
    } catch (error) {
      toast.error(t(error instanceof Error ? error.message : "Could not sign out."));
    }
  };

  if (STATIC_PREVIEW) return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 px-6"><h1 className="font-display text-3xl font-bold">{t("Customer preview")}</h1><p className="text-muted-foreground">{t("Administration is available on the STRATO deployment.")}</p><a href="/" className="text-primary">{t("Back to the site")}</a></main>;
  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!signedIn) return <AuthPanel />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface-deep/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-sm border border-primary/80 bg-primary/15 font-display text-xs font-black tracking-widest text-foreground">
              {t("DJW ")}</span>
            <span className="font-display text-base font-extrabold tracking-wider uppercase text-foreground">
              {t("DJ Wahid · Admin ")}</span>
          </a>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 rounded-sm border border-border px-4 py-2 font-display text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground hover:border-primary hover:text-primary"
          >
            <LogOut className="h-3.5 w-3.5" /> {t("Sign out ")}</button>
        </div>
      </header>

      <AdminDashboard eventsPanel={<EventsPanel />} />
    </div>
  );
}
