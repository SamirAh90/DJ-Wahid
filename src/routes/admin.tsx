import { createFileRoute } from "@tanstack/react-router";
import { AdminPortal } from "@/components/AdminPortal";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — DJ Wahid" },
      {
        name: "description",
        content: "Sign in to manage DJ Wahid upcoming events and gallery photos.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin Portal — DJ Wahid" },
      {
        property: "og:description",
        content: "Sign in to manage DJ Wahid upcoming events and gallery photos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPortal,
});
