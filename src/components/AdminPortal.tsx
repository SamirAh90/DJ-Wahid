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
      if (error) toast.error(error.message);
      return;
    }

    const { data, error } = await signUp(email, password).then(
      (data) => ({ data, error: null }),
      (error: Error) => ({ data: null, error }),
    );
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data?.session) {
      setNotice("Check your inbox and confirm the email, then sign in here.");
      setMode("signin");
      return;
    }

    toast.success("Account created — you are signed in.");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <p className="section-eyebrow">DJ Wahid</p>
      <h1 className="mt-2 font-display text-3xl font-black uppercase text-foreground">Admin Portal</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Sign in to add upcoming events and gallery photos. The first account created here becomes the admin.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-sm border border-border bg-card/70 p-6">
        <div>
          <label className={labelClass} htmlFor="admin-email">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn-magenta flex w-full items-center justify-center gap-2 rounded-sm py-3 font-display text-xs font-bold tracking-[0.2em] uppercase disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setNotice(null);
          }}
          className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          {mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"}
        </button>

        {notice && <p className="text-sm font-medium text-cyan-glow">{notice}</p>}
      </form>

      <a href="/" className="mt-6 text-center text-xs text-muted-foreground hover:text-primary">
        Back to the site
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Events panel                                                        */
/* ------------------------------------------------------------------ */

function EventsPanel() {
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
      toast.success(draft.id ? "Event updated" : "Event added");
      setDraft(EMPTY_EVENT);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the event.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (event: SiteEvent) => {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    try {
      await removeEvent({ data: { id: event.id } });
      toast.success("Event deleted");
      if (draft.id === event.id) setDraft(EMPTY_EVENT);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the event.");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <form onSubmit={save} className="space-y-4 rounded-sm border border-border bg-card/70 p-6 lg:col-span-5">
        <h2 className="font-display text-sm font-black tracking-[0.2em] uppercase text-foreground">
          {draft.id ? "Edit event" : "Add an event"}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Day</label>
            <input
              value={draft.day_label}
              onChange={(e) => setDraft({ ...draft, day_label: e.target.value })}
              placeholder="25"
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
          <div>
            <label className={labelClass}>Month</label>
            <input
              value={draft.month_label}
              onChange={(e) => setDraft({ ...draft, month_label: e.target.value })}
              placeholder="Nov"
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Title</label>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Boiler Room Philadelphia"
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Location</label>
            <input
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              placeholder="Philadelphia, PA"
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
          <div>
            <label className={labelClass}>Price</label>
            <input
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              placeholder="$45"
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Exact date (optional)</label>
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
          Show this event on the site
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={busy}
            className="btn-magenta flex flex-1 items-center justify-center gap-2 rounded-sm py-3 font-display text-xs font-bold tracking-[0.2em] uppercase disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {draft.id ? "Save changes" : "Add event"}
          </button>
          {draft.id && (
            <button
              type="button"
              onClick={() => setDraft(EMPTY_EVENT)}
              className="rounded-sm border border-border px-4 font-display text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3 lg:col-span-7">
        {isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading events…
          </p>
        )}

        {!isLoading && events.length === 0 && (
          <p className="text-sm text-muted-foreground">No events yet — add your first one.</p>
        )}

        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start justify-between gap-4 rounded-sm border border-border bg-card/70 p-4"
          >
            <div className="min-w-0">
              <p className="font-display text-sm font-extrabold uppercase text-foreground">
                {event.day_label} {event.month_label} · {event.title}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {[event.location, event.price].filter(Boolean).join(" · ") || "No location or price"}
              </p>
              {!event.published && (
                <p className="mt-1 font-display text-[10px] font-bold tracking-[0.18em] uppercase text-primary">
                  Hidden from the site
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setDraft(toEventDraft(event))}
                className="rounded-sm border border-border px-3 py-1.5 font-display text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground hover:border-primary hover:text-primary"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(event)}
                aria-label={`Delete ${event.title}`}
                className="grid h-8 w-8 place-items-center rounded-sm border border-border text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Photos panel                                                        */
/* ------------------------------------------------------------------ */

function PhotosPanel() {
  const queryClient = useQueryClient();
  const writePhoto = savePhoto;
  const removePhoto = deletePhoto;
  const [draft, setDraft] = useState<PhotoDraft>(EMPTY_PHOTO);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery(adminContentQuery);
  const photos = data?.photos ?? [];

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-content"] });
    queryClient.invalidateQueries({ queryKey: ["site-content"] });
  }, [queryClient]);

  const nextOrder = useMemo(() => {
    const highest = photos.reduce((max, photo) => Math.max(max, photo.sort_order), 0);
    return String(highest + 1);
  }, [photos]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const uploaded = await uploadPhoto(file);

      setDraft((prev) => ({
        ...prev,
        image_url: uploaded.image_url,
        sort_order: prev.sort_order === "0" ? nextOrder : prev.sort_order,
      }));
      toast.success("Photo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await writePhoto({
        data: {
          image_url: draft.image_url,
          caption: draft.caption,
          likes: Number(draft.likes) || 0,
          comments: Number(draft.comments) || 0,
          sort_order: Number(draft.sort_order) || 0,
          published: draft.published,
        },
      });
      toast.success("Photo added to the gallery");
      setDraft(EMPTY_PHOTO);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the photo.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (photo: SitePhoto) => {
    if (!window.confirm("Delete this photo from the gallery?")) return;
    try {
      await removePhoto({ data: { id: photo.id, image_url: photo.image_url } });
      toast.success("Photo deleted");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the photo.");
    }
  };

  const togglePublished = async (photo: SitePhoto) => {
    try {
      await writePhoto({
        data: {
          id: photo.id,
          image_url: photo.image_url,
          caption: photo.caption,
          likes: photo.likes,
          comments: photo.comments,
          sort_order: photo.sort_order,
          published: !photo.published,
        },
      });
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the photo.");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <form onSubmit={save} className="space-y-4 rounded-sm border border-border bg-card/70 p-6 lg:col-span-5">
        <h2 className="font-display text-sm font-black tracking-[0.2em] uppercase text-foreground">Add a photo</h2>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-surface-deep/60 px-4 py-8 text-center text-xs text-muted-foreground hover:border-primary">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          <span>{uploading ? "Uploading…" : "Choose an image from your device"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </label>

        {draft.image_url && (
          <div className="relative overflow-hidden rounded-sm border border-border">
            <img src={draft.image_url} alt="Preview of the photo being added" className="aspect-square w-full object-cover" />
            <button
              type="button"
              onClick={() => setDraft({ ...draft, image_url: "" })}
              aria-label="Remove the uploaded photo"
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-surface-deep/90 text-foreground hover:text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div>
          <label className={labelClass}>Caption</label>
          <input
            value={draft.caption}
            onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
            placeholder="Live club set in white blazer"
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Likes</label>
            <input
              type="number"
              min="0"
              value={draft.likes}
              onChange={(e) => setDraft({ ...draft, likes: e.target.value })}
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
          <div>
            <label className={labelClass}>Comments</label>
            <input
              type="number"
              min="0"
              value={draft.comments}
              onChange={(e) => setDraft({ ...draft, comments: e.target.value })}
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
          <div>
            <label className={labelClass}>Order</label>
            <input
              type="number"
              min="0"
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })}
              className={`mt-1.5 ${fieldClass}`}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
            className="h-4 w-4 accent-primary"
          />
          Show this photo on the site
        </label>

        <button
          type="submit"
          disabled={busy || !draft.image_url}
          className="btn-magenta flex w-full items-center justify-center gap-2 rounded-sm py-3 font-display text-xs font-bold tracking-[0.2em] uppercase disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add photo
        </button>
      </form>

      <div className="lg:col-span-7">
        {isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading photos…
          </p>
        )}

        {!isLoading && photos.length === 0 && (
          <p className="text-sm text-muted-foreground">No photos yet — upload your first one.</p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-sm border border-border bg-card/70">
              <div className="relative aspect-square">
                <img src={photo.image_url} alt={photo.caption} className="h-full w-full object-cover" />
                {!photo.published && (
                  <span className="absolute inset-x-0 bottom-0 bg-surface-deep/90 py-1 text-center font-display text-[9px] font-bold tracking-[0.18em] uppercase text-primary">
                    Hidden
                  </span>
                )}
              </div>
              <div className="space-y-2 p-3">
                <input
                  value={photo.caption}
                  onChange={(e) => {
                    const caption = e.target.value;
                    queryClient.setQueryData(adminContentQuery.queryKey, (old: typeof data) =>
                      old
                        ? {
                            ...old,
                            photos: old.photos.map((p) => (p.id === photo.id ? { ...p, caption } : p)),
                          }
                        : old,
                    );
                  }}
                  onBlur={() => {
                    void writePhoto({
                      data: {
                        id: photo.id,
                        image_url: photo.image_url,
                        caption: photo.caption,
                        likes: photo.likes,
                        comments: photo.comments,
                        sort_order: photo.sort_order,
                        published: photo.published,
                      },
                    }).then(refresh);
                  }}
                  className="w-full rounded-sm border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                />
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => togglePublished(photo)}
                    className="font-display text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground hover:text-primary"
                  >
                    {photo.published ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(photo)}
                    aria-label="Delete this photo"
                    className="grid h-7 w-7 place-items-center rounded-sm border border-border text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Portal shell                                                        */
/* ------------------------------------------------------------------ */

export function AdminPortal() {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [tab, setTab] = useState<"events" | "photos">("events");

  useEffect(() => {
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
        toast.error(error.message);
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
      toast.success("Signed out");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out.");
    }
  };

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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-sm border border-primary/80 bg-primary/15 font-display text-xs font-black tracking-widest text-foreground">
              DJW
            </span>
            <span className="font-display text-base font-extrabold tracking-wider uppercase text-foreground">
              DJ Wahid · Admin
            </span>
          </a>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 rounded-sm border border-border px-4 py-2 font-display text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground hover:border-primary hover:text-primary"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex gap-2">
          {(["events", "photos"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-sm border px-5 py-2 font-display text-xs font-bold tracking-[0.18em] uppercase transition-colors ${
                tab === key
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {key === "events" ? "Events" : "Photos"}
            </button>
          ))}
        </div>

        {tab === "events" ? <EventsPanel /> : <PhotosPanel />}
      </main>
    </div>
  );
}
