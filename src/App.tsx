import { useState } from "react";
import { artist, events, mixes, services } from "./content";
import { Hero } from "./Hero";
import { Gallery } from "./Gallery";

const nav = [
  ["home", "Home"], ["about", "About"], ["services", "Services"],
  ["events", "Events"], ["music", "Music"], ["gallery", "Gallery"], ["contact", "Contact"],
];
const telephone = `tel:${artist.phone}`;
const whatsapp = `https://wa.me/${artist.phone.slice(1)}`;

function Wordmark() {
  return (
    <a className="wordmark" href="#home" aria-label="DJ Wahid home">
      <img src="/images/dj-wahid-mark.webp" width="43" height="43" alt="" />
      <span>DJ<b>W</b></span>
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Wordmark />
        <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="site-nav"
          onClick={() => setOpen(!open)}>{open ? "Close menu" : "Menu"}</button>
        <nav id="site-nav" className={open ? "navigation open" : "navigation"} aria-label="Main navigation">
          {nav.map(([id, title]) => <a href={`#${id}`} key={id} onClick={() => setOpen(false)}>{title}</a>)}
        </nav>
        <a className="button header-book" href="#contact">Booking</a>
      </div>
    </header>
  );
}

function Events() {
  return (
    <section className="section event-section" id="events">
      <div className="wrap">
        <h2>Upcoming events</h2>
        {events.length === 0 && <p>No public dates are currently listed.</p>}
        {events.map((event) => (
          <article className="event" key={`${event.date}-${event.name}`}>
            <time dateTime={event.date}>{event.date}</time>
            {event.image && <img src={event.image} alt="" loading="lazy" />}
            <div>
              <h3>{event.name}</h3>
              <p>{event.location}</p>
              <p>{event.description}</p>
            </div>
            {event.bookingUrl && <a className="button" href={event.bookingUrl}>Event booking</a>}
          </article>
        ))}
      </div>
    </section>
  );
}

function Music() {
  return (
    <section className="section wrap music" id="music">
      <div>
        <p className="eyebrow">From the booth</p>
        <h2>Music &amp; mixes</h2>
        {mixes.map((mix) => (
          <article key={mix.title}>
            <h3>{mix.title}</h3>
            {mix.audio && <audio controls preload="none" src={mix.audio} aria-label={mix.title} />}
            {mix.href && <a href={mix.href}>Listen on {mix.platform ?? "the artist’s channel"}</a>}
          </article>
        ))}
        <a className="button outline" href={artist.socials[0].href}>DJ Wahid on Instagram</a>
      </div>
      <video controls playsInline preload="none" poster="/videos/highlight-poster.webp"
        src="/videos/highlight.mp4" aria-label="Video highlight from DJ Wahid’s gallery" />
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <Wordmark />
        <nav aria-label="Footer navigation">
          <a href="#about">About</a><a href="#services">Services</a><a href="#contact">Contact</a>
        </nav>
        <div className="socials">
          {artist.socials.map(({ name, href }) => <a href={href} key={name}>{name}</a>)}
        </div>
        <details id="privacy">
          <summary>Privacy</summary>
          <p>This site has no booking form or analytics integration. If you use a contact or social link, the service you open handles any information you choose to share.</p>
        </details>
        <small>© {new Date().getFullYear()} {artist.name}</small>
      </div>
    </footer>
  );
}

export function App() {
  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <Header />
      <main id="content">
        <Hero />
        <section className="section wrap about" id="about">
          <img src="/images/portrait.webp" alt="DJ Wahid in purple stage lighting" loading="lazy" />
          <div>
            <p className="eyebrow">About the artist</p>
            <h2>Meet DJ Wahid</h2>
            <p>DJ Wahid plays electronic music and tailored sets for clubs, weddings and private events. His club sets span electro house and deep house.</p>
            <a href="#services" className="text-link">Explore DJ services</a>
          </div>
        </section>
        <section className="section services-section" id="services">
          <div className="wrap">
            <h2>DJ services</h2>
            <div className="services-grid">
              {services.map((service) => (
                <article key={service.title}>
                  {service.image && <img src={`/images/${service.image}`} alt="" loading="lazy" />}
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <Events />
        <Music />
        <Gallery />
        <section className="section booking" id="contact">
          <div className="wrap">
            <p className="eyebrow">Bookings</p>
            <h2>Book DJ Wahid</h2>
            <p>Get in touch with your date, venue and the kind of event you’re planning.</p>
            <div className="actions">
              <a className="button" href={telephone}>Call {artist.displayPhone}</a>
              <a className="button outline" href={whatsapp}>WhatsApp</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
