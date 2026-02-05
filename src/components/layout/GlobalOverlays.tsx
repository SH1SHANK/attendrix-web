"use client";

import { usePathname } from "next/navigation";
import CookieConsent from "@/components/legal/CookieConsent";
import ScrollToTop from "@/components/ui/ScrollToTop";

const HIDDEN_ROUTES = ["/attendance", "/resources"];

export default function GlobalOverlays() {
  const pathname = usePathname();
  const shouldHide = HIDDEN_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );

  if (shouldHide) return null;

  return (
    <>
      <CookieConsent />
      <ScrollToTop />
    </>
  );
}
