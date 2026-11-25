import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import type { SiteContent } from "./data/site.functions";

declare global {
  interface Window { __SITE_CONTENT__?: SiteContent }
}

export const getRouter = () => {
  // Keep the cache scoped to this router instance.
  const queryClient = new QueryClient();
  if (typeof window !== "undefined" && window.__SITE_CONTENT__) {
    queryClient.setQueryData(["site-content"], window.__SITE_CONTENT__);
  }

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Lets Query own freshness; set caching defaults on the QueryClient, not the router.
    defaultPreloadStaleTime: 0,
  });

  return router;
};
