import { renderToString as renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Index } from "./routes/index";
import { ClubSections } from "./components/ClubSections";
import { AdminPortal } from "./components/AdminPortal";
import type { SiteContent, SiteEvent, SitePhoto } from "./data/site.functions";
import { RouterContextProvider, createMemoryHistory } from "@tanstack/react-router";
import { getRouter } from "./router";
import { NotFoundComponent } from "./routes/__root";
import { setRenderLanguage, type Language } from "./lib/language";

export function renderHome(content: SiteContent, language: Language = "en"): string {
  const client = new QueryClient();
  client.setQueryData(["site-content"], content);
  setRenderLanguage(language);
  try { return renderToStaticMarkup(<QueryClientProvider client={client}><Index /></QueryClientProvider>); }
  finally { setRenderLanguage("en"); }
}

export function renderAdmin(): string {
  return renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><AdminPortal /></QueryClientProvider>);
}

export function renderNotFound(): string {
  const router = getRouter();
  router.update({ ...router.options, history: createMemoryHistory({ initialEntries: ["/page-that-does-not-exist"] }) });
  return renderToStaticMarkup(<RouterContextProvider router={router}><NotFoundComponent /></RouterContextProvider>);
}

// Derive the PHP row templates from the approved React component itself.
// No duplicate hand-maintained presentation markup lives in the PHP backend.
export function rowTemplates(language: Language = "en") {
  const event: SiteEvent = {
    id: "template-event", day_label: "__DAY_LABEL__", month_label: "__MONTH_LABEL__",
    title: "__TITLE__", description: "__DESCRIPTION__", location: "__LOCATION__", price: "__PRICE__",
    event_date: null, published: true,
  };
  const photo: SitePhoto = {
    id: "template-photo", image_url: "__IMAGE_URL__", caption: "__CAPTION__",
    likes: 111111111, comments: 222222222, sort_order: 0, published: true,
  };
  setRenderLanguage(language);
  let markup: string;
  try { markup = renderToStaticMarkup(<ClubSections onGetTickets={() => {}} onBuyVinyl={() => {}}
    cartCount={0} onBookService={() => {}} events={[event]} photos={[photo]} />); }
  finally { setRenderLanguage("en"); }
  const eventMarker = '<article data-event-card=""';
  const eventStart = markup.indexOf(eventMarker);
  const eventEnd = markup.indexOf('</article>', eventStart) + '</article>'.length;
  const photoMarker = '<div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">';
  const photoStart = markup.indexOf(photoMarker) + photoMarker.length;
  const photoEnd = markup.indexOf('</div></div></section>', photoStart);
  if (eventStart < 0 || eventEnd < '</article>'.length || photoStart < photoMarker.length || photoEnd < 0) {
    throw new Error("Could not derive content templates from the existing layout.");
  }
  return {
    event: markup.slice(eventStart, eventEnd),
    photo: markup.slice(photoStart, photoEnd).replace("111111111", "__LIKES__").replace("222222222", "__COMMENTS__"),
  };
}
