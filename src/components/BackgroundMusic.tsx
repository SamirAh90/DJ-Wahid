import { asset, sectionEnabled } from "@/lib/website";
import { t, useLanguage } from "@/lib/language";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { BACKGROUND_MUSIC } from "@/data/dj-data";

const HEIGHTS = [18, 46, 28, 80, 34, 56, 92, 42, 26, 68, 36, 54, 23, 74, 96, 48, 31, 59, 38, 82, 52, 27, 66, 88, 40, 58, 22, 72, 45, 94, 63, 33];
const BARS = Array.from({ length: 96 }, (_, index) => HEIGHTS[index % HEIGHTS.length] ?? 32);

export function BackgroundMusic() {
  useLanguage();
  const musicEnabled = sectionEnabled("music") && sectionEnabled("home");
  const source = asset(BACKGROUND_MUSIC.src);
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
      // Audible autoplay may require a click/tap; retry on the first interaction.
      if (error instanceof Error && (error.name === "NotAllowedError" || error.name === "AbortError")) return;
      setUnavailable(true);
      setPlaying(false);
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !musicEnabled) return;
    mounted.current = true;
    wanted.current = true;
    audio.volume = 0.35;
    audio.muted = false;
    setMuted(audio.muted);

    const firstInteraction = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("[data-music-player]")) return;
      if (wanted.current && audio.paused) play();
    };
    const onVisible = () => { if (!document.hidden && wanted.current && audio.paused) play(); };
    document.addEventListener("pointerdown", firstInteraction, true);
    document.addEventListener("keydown", firstInteraction, true);
    document.addEventListener("visibilitychange", onVisible);
    if (!document.hidden) play();

    return () => {
      mounted.current = false;
      wanted.current = false;
      audio.pause();
      document.removeEventListener("pointerdown", firstInteraction, true);
      document.removeEventListener("keydown", firstInteraction, true);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [play, musicEnabled, source]);

  const toggleMuted = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
    if (wanted.current && audio.paused) play();
  };

  return (
    <aside hidden={!musicEnabled} data-music-player aria-label={t("Background music player")}
      className="absolute inset-x-0 bottom-24 z-20 mx-auto flex max-w-7xl items-end gap-3 px-4 text-foreground sm:gap-5 sm:px-6 lg:px-8">
      <audio ref={audioRef} src={source} preload="metadata" loop
        onPlaying={() => { setPlaying(true); setUnavailable(false); }} onPause={() => setPlaying(false)}
        onError={() => { wanted.current = false; setUnavailable(true); setPlaying(false); }} />
      <p className="sr-only" aria-live="polite">
        {t(unavailable ? "Audio unavailable" : `${BACKGROUND_MUSIC.title}${muted ? ", muted" : ""}`)}
      </p>
      <div className="music-visualizer" data-playing={playing} aria-hidden="true">
        {t(BARS.map((height, index) => (
          <span key={index} className="music-visualizer-bar" style={{
            "--bar-height": `${height}%`, "--bar-duration": `${0.5 + (index % 7) * 0.13}s`,
            "--bar-delay": `${-(index % 11) * 0.16}s`,
          } as CSSProperties} />
        )))}
      </div>
      <button type="button" onClick={toggleMuted} disabled={unavailable} aria-pressed={muted}
        aria-label={t(muted ? "Unmute background music" : "Mute background music")}
        title={t(muted ? "Unmute music" : "Mute music")}
        className="mb-1 grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-primary transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40">
        {t(muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />)}
      </button>
    </aside>
  );
}
