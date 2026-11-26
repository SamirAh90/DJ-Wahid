import { useEffect, useRef, useState } from "react";
import { applyWebsite } from "@/lib/website";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { HeroSlider } from "@/components/HeroSlider";
import { ClubSections } from "@/components/ClubSections";
import { PodcastSection } from "@/components/PodcastSection";
import { BookingModal, CommunityAndFooter } from "@/components/CommunityAndFooter";
import { siteContentQuery } from "@/data/site.queries";
import { ServiceContactModal } from "@/components/ServiceContactModal";
import { Seo } from "@/components/Seo";

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
      { title: "DJ Wahid | Afghan & Persian Wedding DJ in Malmö" },
      {
        name: "description",
        content:
          "Afghan, Persian and Kurdish wedding DJ based in Malmö. International music for weddings, birthdays, graduation parties and corporate events. Book DJ Wahid.",
      },
      { property: "og:title", content: "DJ Wahid | Afghan & Persian Wedding DJ in Malmö" },
      {
        property: "og:description",
        content:
          "Afghan, Persian and Kurdish wedding DJ based in Malmö. International music for weddings, birthdays, graduation parties and corporate events. Book DJ Wahid.",
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
  const [serviceContact, setServiceContact] = useState({ open: false, service: "" });
  const serviceTrigger = useRef<HTMLElement | null>(null);
  const { data } = useQuery(siteContentQuery);
  useEffect(() => {
    if (new URLSearchParams(location.search).get("preview") !== "1" && data?.website) applyWebsite(data.website.config);
  }, [data?.website]);
  const events = data?.events ?? [];
  const photos = data?.photos ?? [];

  const openModal = (subject: string) => {
    setModalSubject(subject);
    setModalOpen(true);
  };
  const openContact = (service: string) => {
    serviceTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setServiceContact({ open: true, service });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo />
      <Navbar cartCount={cartCount} onOpenBooking={() => openContact("Book Now")} />
      <main>
        <HeroSlider onGetTickets={() => openContact("Book Now")} />
        <ClubSections
          onGetTickets={(title) => openModal(`Tickets: ${title}`)}
          onBuyVinyl={() => setCartCount((c) => c + 1)}
          cartCount={cartCount}
          onBookService={openContact}
          events={events}
          photos={photos}
        />
        <PodcastSection />
        <CommunityAndFooter />
      </main>
      <BookingModal open={modalOpen} subject={modalSubject} onClose={() => setModalOpen(false)} />
      <ServiceContactModal open={serviceContact.open} service={serviceContact.service}
        onOpenChange={(open) => setServiceContact((current) => ({ ...current, open }))}
        onAfterClose={() => serviceTrigger.current?.focus()} />
    </div>
  );
}
