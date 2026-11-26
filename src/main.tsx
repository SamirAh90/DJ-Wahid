import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";
import { LanguageProvider } from "./lib/language";
import { applyWebsite } from "./lib/website";
applyWebsite(window.__SITE_CONTENT__?.website?.config ?? {});
if (new URLSearchParams(location.search).get("preview") === "1") {
  try { const draft = sessionStorage.getItem("dj-website-preview"); if (draft) applyWebsite(JSON.parse(draft)); } catch { /* Invalid previews fall back to saved content. */ }
}

const router = getRouter();
await router.load();
const root = document.getElementById("root")!;
const application = <LanguageProvider><RouterProvider router={router} /></LanguageProvider>;
// PHP supplies readable initial HTML. Mount the client router after its initial
// data is ready; its Suspense boundaries do not share an SSR router runtime.
createRoot(root).render(application);
