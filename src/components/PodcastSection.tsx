import { useEffect, useState } from "react";
import { Pause, Play, Radio } from "lucide-react";
import { DJ_NAME, PODCAST_TRACKS } from "@/data/dj-data";
import { clubAudio } from "@/lib/audio-synth";

const WAVEFORM_BARS = [32, 65, 48, 84, 52, 92, 40, 74, 88, 45, 68, 96, 54, 78, 60, 86, 42, 72, 90, 50, 64, 82, 46, 70];

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PodcastSection() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({
    "pod-1": 0,
    "pod-2": 0,
    "pod-3": 0,
  });

  useEffect(() => {
    if (!playingId) return;
    const track = PODCAST_TRACKS.find((t) => t.id === playingId);
    if (!track) return;

    const id = window.setInterval(() => {
      setProgress((prev) => {
        const next = (prev[playingId] ?? 0) + 1;
        if (next >= track.duration) {
          clubAudio.stop();
          setPlayingId(null);
          return { ...prev, [playingId]: 0 };
        }
        return { ...prev, [playingId]: next };
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [playingId]);

  useEffect(() => {
    const pauseForBackground = () => { clubAudio.stop(); setPlayingId(null); };
    window.addEventListener("dj:background-play", pauseForBackground);
    return () => {
      clubAudio.stop();
      window.removeEventListener("dj:background-play", pauseForBackground);
    };
  }, []);

  const toggleTrack = (track: (typeof PODCAST_TRACKS)[number]) => {
    if (playingId === track.id) {
      clubAudio.stop();
      setPlayingId(null);
    } else {
      window.dispatchEvent(new Event("dj:podcast-play"));
      clubAudio.start(track.bpm, track.rootHz);
      setPlayingId(track.id);
    }
  };

  const seekTrack = (trackId: string, duration: number, ratio: number) => {
    setProgress((prev) => ({ ...prev, [trackId]: Math.floor(duration * ratio) }));
  };

  return (
    <section id="podcast" className="bg-surface-deep py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="min-w-0 space-y-4 lg:col-span-7">
          {PODCAST_TRACKS.map((track) => {
            const isPlaying = playingId === track.id;
            const elapsed = progress[track.id] ?? 0;
            const pct = (elapsed / track.duration) * 100;

            return (
              <div
                key={track.id}
                className={`rounded-sm border p-5 transition-colors ${
                  isPlaying ? "border-primary bg-surface-elevated" : "border-border bg-card/70 hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => toggleTrack(track)}
                    aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                    className="btn-magenta grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-full"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-display text-sm font-bold tracking-wider uppercase text-foreground">
                        {track.title}
                      </h3>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {formatTime(elapsed)} / {formatTime(track.duration)}
                      </span>
                    </div>

                    <div
                      role="slider"
                      tabIndex={0}
                      aria-label={`Seek ${track.title}`}
                      aria-valuemin={0}
                      aria-valuemax={track.duration}
                      aria-valuenow={elapsed}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        seekTrack(track.id, track.duration, ratio);
                      }}
                      className="mt-3 flex h-8 cursor-pointer items-end gap-1"
                    >
                      {WAVEFORM_BARS.map((height, idx) => {
                        const barPct = ((idx + 1) / WAVEFORM_BARS.length) * 100;
                        const filled = barPct <= pct;
                        return (
                          <span
                            key={idx}
                            style={{ height: `${height}%` }}
                            className={`flex-1 rounded-xs transition-colors ${
                              filled ? "bg-primary" : isPlaying ? "bg-cyan-glow/45" : "bg-foreground/20"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="min-w-0 lg:col-span-5">
          <p className="section-eyebrow">Music</p>
          <h2 className="mt-3 font-display text-4xl font-black tracking-tight uppercase text-foreground sm:text-5xl">
            Podcast
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {DJ_NAME} knows how to move your mind, body and soul by delivering tracks that stand out from the norm. As if
            this impressive succession of high impact, floor-filling bombs wasn’t enough to sustain.
          </p>
          <a
            href="#podcast"
            className="btn-magenta mt-8 inline-flex items-center gap-2.5 rounded-sm px-7 py-3.5 font-display text-xs font-bold tracking-[0.2em] uppercase"
          >
            <Radio className="h-4 w-4" />
            Listen on SoundCloud
          </a>
        </div>
      </div>
    </section>
  );
}
