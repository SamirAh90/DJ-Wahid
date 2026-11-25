import { useState } from "react";
import { artist, slides } from "./content";

export function Hero() {
  const [active, setActive] = useState(0);
  return (
    <section className="hero" id="home" aria-label="DJ Wahid">
      {slides.map(({ image, position }, index) => (
        <picture className={index === active ? "hero-image active" : "hero-image"} key={image}>
          <source media="(max-width: 640px)" srcSet={`/images/${image}-small.webp`} />
          <img
            src={`/images/${image}.webp`}
            style={{ objectPosition: position }}
            alt=""
            fetchPriority={index === 0 ? "high" : "low"}
            loading={index === 0 ? "eager" : "lazy"}
          />
        </picture>
      ))}
      <div className="hero-shade" />
      <div className="wrap hero-content">
        <p className="eyebrow" aria-live="polite">{slides[active].label}</p>
        <h1>{artist.name}</h1>
        <div className="actions">
          <a className="button" href="#contact">Book the DJ</a>
          <a className="button outline" href="#music">Explore music</a>
        </div>
      </div>
      <div className="wrap hero-controls" aria-label="Hero photographs">
        {slides.map(({ image, label }, index) => (
          <button key={image} type="button" aria-label={label}
            aria-pressed={index === active} onClick={() => setActive(index)} />
        ))}
      </div>
    </section>
  );
}
