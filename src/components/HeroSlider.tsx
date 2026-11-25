import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HERO_SLIDES } from "@/data/dj-data";

interface HeroSliderProps {
  onGetTickets: (title: string) => void;
}

export function HeroSlider({ onGetTickets }: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, []);

  const slide = HERO_SLIDES[activeIndex] ?? HERO_SLIDES[0];

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);

  return (
    <section id="home" className="relative flex min-h-screen items-center overflow-hidden bg-surface-deep pt-20">
      {HERO_SLIDES.map((item, idx) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <img
            src={item.image}
            alt={item.heading}
            className="h-full w-full object-cover object-[70%_20%] sm:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-deep/95 via-surface-deep/65 to-surface-deep/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-surface-deep/50" />
        </div>
      ))}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="font-display text-xs font-bold tracking-[0.3em] uppercase text-cyan-glow sm:text-sm">
            {slide.subtitle}
          </p>
          <h1 className="mt-4 font-display text-4xl font-black leading-[1.04] tracking-tight uppercase text-foreground sm:text-6xl lg:text-7xl">
            {slide.heading}
          </h1>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#events"
              className="btn-ghost-club rounded-sm px-7 py-3.5 font-display text-xs font-bold tracking-[0.2em] uppercase"
            >
              More Information
            </a>
            <button
              type="button"
              onClick={() => onGetTickets(slide.heading)}
              className="btn-magenta cursor-pointer rounded-sm px-8 py-3.5 font-display text-xs font-bold tracking-[0.2em] uppercase"
            >
              Get Tickets
            </button>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-8 z-20 mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {HERO_SLIDES.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Go to slide ${idx + 1}`}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 cursor-pointer rounded-full transition-all ${
                idx === activeIndex ? "w-10 bg-primary" : "w-4 bg-foreground/35 hover:bg-foreground/60"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-sm border border-foreground/25 bg-surface-deep/60 text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-sm border border-foreground/25 bg-surface-deep/60 text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}