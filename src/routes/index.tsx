import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { HeroSlider } from "@/components/HeroSlider";
import { ClubSections } from "@/components/ClubSections";
import { PodcastSection } from "@/components/PodcastSection";
import { BookingModal, CommunityAndFooter } from "@/components/CommunityAndFooter";
import { siteContentQuery } from "@/data/site.queries";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(siteContentQuery);
    } catch (error) {
      console.error("Could not load site content", error);
    }
  },
  head: () => ({
    meta: [
      { title: "DJ Wahid — Electronic Music, Live Events & Podcasts" },
      {
        name: "description",
        content:
          "Official DJ Wahid (DJW) site featuring live club dates, Supermix podcasts, 12-inch vinyl releases, and booking.",
      },
      { property: "og:title", content: "DJ Wahid — Electronic Music, Live Events & Podcasts" },
      {
        property: "og:description",
        content:
          "Official DJ Wahid (DJW) site featuring live club dates, Supermix podcasts, 12-inch vinyl releases, and booking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

export function Index() {
  const [cartCount, setCartCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubject, setModalSubject] = useState("Book DJ Wahid");
  const { data } = useQuery(siteContentQuery);
  const events = data?.events ?? [];
  const photos = data?.photos ?? [];

  const openModal = (subject: string) => {
    setModalSubject(subject);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar cartCount={cartCount} onOpenBooking={() => openModal("Book DJ Wahid")} />
      <main>
        <HeroSlider onGetTickets={(title) => openModal(`Tickets: ${title}`)} />
        <ClubSections
          onGetTickets={(title) => openModal(`Tickets: ${title}`)}
          onBuyVinyl={() => setCartCount((c) => c + 1)}
          cartCount={cartCount}
          onBookService={(service) => openModal(`Book Service: ${service}`)}
          events={events}
          photos={photos}
        />
        <PodcastSection />
        <CommunityAndFooter />
      </main>
      <BookingModal open={modalOpen} subject={modalSubject} onClose={() => setModalOpen(false)} />
    </div>
  );
}
