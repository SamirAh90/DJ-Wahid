export const artist = {
  name: "DJ Wahid",
  phone: "+46736402445",
  displayPhone: "+46 73 640 24 45",
  socials: [
    { name: "Instagram", href: "https://www.instagram.com/dj.wahid2/" },
    { name: "TikTok", href: "https://www.tiktok.com/@afgentertainment.se" },
    { name: "Facebook", href: "https://www.facebook.com/FOE2020" },
  ],
};

export const slides = [
  { image: "hero-neon", position: "center 42%", label: "Clubs · Weddings · Events" },
  { image: "hero-haze", position: "center 36%", label: "DJ sets for private events" },
  { image: "hero-stage", position: "center 36%", label: "Electronic music and club sets" },
];

export const services = [
  { title: "Weddings", description: "Music for the reception, from dinner through the last dance.", image: "hero-neon.webp" },
  { title: "Clubs & bars", description: "Electronic sets spanning electro house and deep house.", image: "hero-stage.webp" },
  { title: "Corporate & private events", description: "DJ sets tailored to your event and guests.", image: "hero-haze.webp" },
  { title: "Playlist creation", description: "Custom playlists and curated mixes for venues and events." },
  { title: "DJ lessons", description: "One-on-one sessions on beatmatching, harmonic mixing and performance." },
];

type Event = {
  date: string;
  name: string;
  location: string;
  description: string;
  image?: string;
  bookingUrl?: string;
};
export const events: Event[] = [];

type Mix = { title: string; audio?: string; href?: string; platform?: string };
export const mixes: Mix[] = [];

export const gallery = [
  { image: "gallery-01.jpg", alt: "DJ Wahid seated in a black suit" },
  { image: "gallery-02.jpg", alt: "DJ Wahid adjusting his black jacket" },
  { image: "gallery-03.jpg", alt: "DJ Wahid performing under purple lights" },
  { image: "gallery-04.jpg", alt: "DJ Wahid mixing on Pioneer decks" },
  { image: "gallery-05.jpg", alt: "DJ Wahid in a pinstripe suit" },
  { image: "gallery-06.jpg", alt: "DJ Wahid cueing a track beside a laptop" },
  { image: "gallery-07.jpg", alt: "DJ Wahid looking up from the mixer" },
];
