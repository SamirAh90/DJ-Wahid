import { useEffect, useState } from "react";
import { ChevronDown, Facebook, Instagram, Menu, Phone, X } from "lucide-react";
import { DJ_NAME, DJ_PHONE_TEL, DJ_SHORT, SOCIAL_LINKS } from "@/data/dj-data";
import { TikTokIcon } from "@/components/SocialIcons";

interface NavbarProps {
  cartCount: number;
  onOpenBooking: () => void;
}

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Biography", href: "#biography" },
  { label: "Events", href: "#events" },
  { label: "Shop", href: "#shop" },
];

const PAGES_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Music", href: "#podcast" },
  { label: "Video", href: "#podcast" },
  { label: "Gallery", href: "#instagram" },
];

export function Navbar({ cartCount, onOpenBooking }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-surface-deep/95 py-3 backdrop-blur-md"
          : "bg-gradient-to-b from-surface-deep/90 to-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#home" className="flex shrink-0 items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-sm border border-primary/80 bg-primary/15 font-display text-xs font-black tracking-widest text-foreground">
            {DJ_SHORT}
          </span>
          <span className="font-display text-lg font-extrabold tracking-wider uppercase text-foreground">
            {DJ_NAME}
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="font-display text-xs font-bold tracking-[0.18em] uppercase text-foreground/85 transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setPagesOpen(true)}
            onMouseLeave={() => setPagesOpen(false)}
          >
            <button
              type="button"
              onClick={() => setPagesOpen((prev) => !prev)}
              className="flex items-center gap-1 font-display text-xs font-bold tracking-[0.18em] uppercase text-foreground/85 transition-colors hover:text-primary"
            >
              Pages <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {pagesOpen && (
              <div className="absolute left-0 top-full pt-3">
                <div className="w-44 rounded-sm border border-border bg-surface-elevated p-2 shadow-2xl">
                  {PAGES_LINKS.map((sub) => (
                    <a
                      key={sub.label}
                      href={sub.href}
                      onClick={() => setPagesOpen(false)}
                      className="block rounded-sm px-3 py-2 font-display text-xs font-semibold tracking-wider uppercase text-foreground/85 transition-colors hover:bg-primary/20 hover:text-primary"
                    >
                      {sub.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <a
            href="#news"
            className="font-display text-xs font-bold tracking-[0.18em] uppercase text-foreground/85 transition-colors hover:text-primary"
          >
            News
          </a>
          <a
            href="#contact"
            className="font-display text-xs font-bold tracking-[0.18em] uppercase text-foreground/85 transition-colors hover:text-primary"
          >
            Contact
          </a>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <div className="flex items-center gap-3 text-foreground/75">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="transition-colors hover:text-primary"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={SOCIAL_LINKS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="transition-colors hover:text-primary"
            >
              <TikTokIcon className="h-4 w-4" />
            </a>
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="transition-colors hover:text-primary"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={`tel:${DJ_PHONE_TEL}`}
              aria-label="Call DJ Wahid"
              className="transition-colors hover:text-primary"
            >
              <Phone className="h-4 w-4" />
            </a>
          </div>
          <button
            type="button"
            onClick={onOpenBooking}
            className="btn-magenta cursor-pointer rounded-sm px-5 py-2.5 font-display text-xs font-bold tracking-[0.18em] uppercase"
          >
            Book Now{cartCount > 0 ? ` (${cartCount})` : ""}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
          className="grid h-10 w-10 place-items-center rounded-sm border border-border text-foreground lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-surface-deep px-6 py-5 lg:hidden">
          <div className="flex flex-col gap-3">
            {[...NAV_LINKS, ...PAGES_LINKS, { label: "News", href: "#news" }, { label: "Contact", href: "#contact" }].map(
              (item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-1 font-display text-xs font-bold tracking-[0.18em] uppercase text-foreground/90 hover:text-primary"
                >
                  {item.label}
                </a>
              ),
            )}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenBooking();
              }}
              className="btn-magenta mt-2 w-full rounded-sm py-3 font-display text-xs font-bold tracking-[0.18em] uppercase"
            >
              Book Now
            </button>

            <div className="mt-3 flex items-center justify-center gap-4 text-foreground/75">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="transition-colors hover:text-primary"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="transition-colors hover:text-primary"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="transition-colors hover:text-primary"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={`tel:${DJ_PHONE_TEL}`}
                aria-label="Call DJ Wahid"
                className="transition-colors hover:text-primary"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}