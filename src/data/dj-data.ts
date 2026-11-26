import heroDj1 from "@/assets/hero-dj-1.png.asset.json";
import heroDj2 from "@/assets/hero-dj-2.png.asset.json";
import heroDj3 from "@/assets/hero-dj-3.png.asset.json";
import djPortrait1 from "@/assets/dj-portrait-1.jpg.asset.json";
import djPortrait2 from "@/assets/dj-portrait-2.jpg.asset.json";
import djDecks1 from "@/assets/dj-decks-1.jpg.asset.json";
import djDecks2 from "@/assets/dj-decks-2.jpg.asset.json";

// ============= Artist identity: edit here to rebrand the whole site =============
export const DJ_NAME = "DJ Wahid";
export const DJ_SHORT = "DJW";
export const DJ_PHONE_DISPLAY = "0046736402445";
export const DJ_PHONE_TEL = "+46736402445";

export const BACKGROUND_MUSIC = {
  title: "Bijan Mortazavi",
  src: "/mp3/Bijan%20Mortazavi.mp3",
} as const;

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/dj.wahid2/",
  tiktok: "https://www.tiktok.com/@dj.wahid2/",
  whatsapp: `https://wa.me/${DJ_PHONE_TEL.replace(/\D/g, "")}`,
} as const;

export const HERO_SLIDES = [
  {
    id: "slide-1",
    subtitle: "Weddings · Parties · Events in Malmö & Sweden",
    heading: "AFGHAN, PERSIAN & INTERNATIONAL DJ",
    image: heroDj1.url,
  },
  {
    id: "slide-2",
    subtitle: "Your people. Your celebration.",
    heading: "THE MUSIC, THE ENERGY, THE ATMOSPHERE",
    image: heroDj2.url,
  },
  {
    id: "slide-3",
    subtitle: "Timeless classics · International hits · Oriental rhythms",
    heading: "UNFORGETTABLE MOMENTS START HERE",
    image: heroDj3.url,
  },
] as const;

export const BIO_IMAGE = djPortrait1.url;

// Easy-to-replace Instagram photo slots: swap any `image` URL below with your own photo.
export const INSTAGRAM_POSTS = [
  { id: "ig-1", image: heroDj1.url, alt: "Live club set in white blazer", likes: 87, comments: 15 },
  { id: "ig-2", image: djPortrait2.url, alt: "Studio portrait in black suit", likes: 74, comments: 8 },
  { id: "ig-3", image: djDecks1.url, alt: "Mixing on Pioneer DJ decks", likes: 82, comments: 45 },
  { id: "ig-4", image: heroDj2.url, alt: "Neon club night performance", likes: 112, comments: 19 },
  { id: "ig-5", image: djDecks2.url, alt: "Focused on the booth mix", likes: 95, comments: 12 },
  { id: "ig-6", image: heroDj3.url, alt: "Late night electro house session", likes: 134, comments: 27 },
  { id: "ig-7", image: djPortrait1.url, alt: "Editorial artist portrait", likes: 68, comments: 11 },
  { id: "ig-8", image: djDecks1.url, alt: "Backstage warmup set", likes: 91, comments: 16 },
];

export const UPCOMING_EVENTS = [
  {
    id: "evt-1",
    day: "25",
    month: "Nov",
    title: "Boiler Room Philadelphia",
    description: "Make way for one of Boiler Room’s biggest and greatest dates in the calendar.",
    location: "Philadelphia, PA",
    price: "$45",
  },
  {
    id: "evt-2",
    day: "30",
    month: "Dec",
    title: "Bubble Charlotte",
    description: "Finally! A three-day music gateway unlike anything that’s come before at Charlotte.",
    location: "Charlotte, NC",
    price: "$60",
  },
];

export const SERVICES_LIST = [
  { id: "weddings", title: "Weddings", description: "Tailored reception sets and seamless transitions from dinner to midnight." },
  { id: "clubs", title: "Clubs and Bars", description: "High-energy electro house, deep house, and peak-hour club residencies." },
  { id: "corporate", title: "Corporate Events", description: "Polished sound curation for launches, galas, and private brand nights." },
  { id: "playlists", title: "Playlist Creation", description: "Custom sonic identities and curated mixes built for venues and labels." },
  { id: "lessons", title: "DJ Lessons", description: "One-on-one beatmatching, harmonic mixing, and live performance coaching." },
] as const;

export const PODCAST_TRACKS = [
  { id: "pod-1", title: "DJW - SUPERMIX PODCAST #1", duration: 184, bpm: 126, rootHz: 55 },
  { id: "pod-2", title: "DJW - SUPERMIX PODCAST #2", duration: 216, bpm: 128, rootHz: 65.4 },
  { id: "pod-3", title: "DJW - SUPERMIX PODCAST #3", duration: 198, bpm: 124, rootHz: 49 },
] as const;

export const BLOG_POSTS = [
  {
    id: "post-1",
    title: "Endless Remix",
    date: "March 29",
    image: heroDj1.url,
    excerpt: "Exploring the analog basslines and driving percussion behind the brand-new Endless club remix.",
  },
  {
    id: "post-2",
    title: "Burning Man",
    date: "March 29",
    image: heroDj2.url,
    excerpt: "Sunrise sets on the playa, dusty sound systems, and unforgettable moments from this year’s desert run.",
  },
  {
    id: "post-3",
    title: "“Vento EP” ENDLESS",
    date: "March 13",
    image: heroDj3.url,
    excerpt: "Three late-night deep house cuts pressed to 180g vinyl and streaming worldwide this spring.",
  },
] as const;
