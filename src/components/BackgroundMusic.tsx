import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { BACKGROUND_MUSIC } from "@/data/dj-data";

const BARS = [18, 46, 28, 80, 34, 56, 92, 42, 26, 68, 36, 54, 23, 74, 96, 48, 31, 59, 38, 82, 52, 27, 66, 88, 40, 58, 22, 72, 45, 94, 63, 33];
const ENABLED_KEY = "dj-background-music-enabled";
const MUTED_KEY = "dj-background-music-muted";

function remember(key: string, value: boolean) {
  try { localStorage.setItem(key, String(value)); } catch { /* Storage may be unavailable in private browsing. */ }
}

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const mounted = useRef(false);
  const wanted = useRef(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !wanted.current) return;
    window.dispatchEvent(new Event("dj:background-play"));
    void audio.play().catch((error: unknown) => {
      if (!mounted.current) return;
      // Audible autoplay may require a click/tap. Leave the play control ready.
      if (error instanceof Error && (error.name === "NotAllowedError" || error.name === "AbortError")) return;
      setUnavailable(true);
      setPlaying(false);
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    mounted.current = true;
    audio.volume = 0.35;
    try {
      wanted.current = localStorage.getItem(ENABLED_KEY) !== "false";
      audio.muted = localStorage.getItem(MUTED_KEY) === "true";
    } catch { /* Default preferences apply when storage is unavailable. */ }
    setMuted(audio.muted);

    const firstInteraction = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("[data-music-player]")) return;
      if (wanted.current && audio.paused) play();
    };
    const pauseForPodcast = () => { wanted.current = false; audio.pause(); };
    const onVisible = () => { if (!document.hidden && wanted.current && audio.paused) play(); };
    document.addEventListener("pointerdown", firstInteraction, true);
    document.addEventListener("keydown", firstInteraction, true);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("dj:podcast-play", pauseForPodcast);
    if (!document.hidden) play();

    return () => {
      mounted.current = false;
      wanted.current = false;
      audio.pause();
      document.removeEventListener("pointerdown", firstInteraction, true);
      document.removeEventListener("keydown", firstInteraction, true);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("dj:podcast-play", pauseForPodcast);
    };
  }, [play]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      wanted.current = false;
      remember(ENABLED_KEY, false);
      audio.pause();
    } else {
      wanted.current = true;
      remember(ENABLED_KEY, true);
      play();
    }
  };

  const toggleMuted = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
    remember(MUTED_KEY, audio.muted);
    if (wanted.current && audio.paused) play();
  };

  return (
    <aside data-music-player aria-label="Background music player"
      className="fixed right-4 bottom-4 z-40 w-[min(19rem,calc(100vw-2rem))] rounded-sm border border-primary/35 bg-surface-deep/95 px-3 py-2.5 text-foreground shadow-2xl backdrop-blur-md">
      <audio ref={audioRef} src={BACKGROUND_MUSIC.src} preload="metadata" loop
        onPlaying={() => { setPlaying(true); setUnavailable(false); }} onPause={() => setPlaying(false)}
        onError={() => { wanted.current = false; setUnavailable(true); setPlaying(false); }} />
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold">{BACKGROUND_MUSIC.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground" aria-live="polite">
            {unavailable ? "Audio unavailable" : playing ? muted ? "Muted" : "Now playing" : "Tap to play"}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button type="button" onClick={togglePlayback} disabled={unavailable}
            aria-label={playing ? "Pause background music" : "Play background music"}
            title={playing ? "Pause music" : "Play music"}
            className="grid h-8 w-8 place-items-center rounded-full border border-primary/45 text-primary transition-colors hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40">
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={toggleMuted} disabled={unavailable} aria-pressed={muted}
            aria-label={muted ? "Unmute background music" : "Mute background music"}
            title={muted ? "Unmute music" : "Mute music"}
            className="grid h-8 w-8 place-items-center rounded-full border border-border text-foreground/80 transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40">
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="music-visualizer" data-playing={playing && !muted} aria-hidden="true">
        {BARS.map((height, index) => (
          <span key={index} className="music-visualizer-bar" style={{
            "--bar-height": `${height}%`, "--bar-duration": `${0.5 + (index % 7) * 0.13}s`,
            "--bar-delay": `${-(index % 11) * 0.16}s`,
          } as CSSProperties} />
        ))}
      </div>
    </aside>
  );
}
