"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cream border-b-2 border-black">
      <div className="container-tight">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-accent border-2 border-black flex items-center justify-center shadow-[1px_1px_0_#000] md:shadow-[2px_2px_0_#000] group-hover:shadow-[2px_2px_0_#000] md:group-hover:shadow-[3px_3px_0_#000] transition-all">
              <span className="font-mono font-bold text-sm md:text-lg text-black">
                A
              </span>
            </div>
            <span className="font-display font-bold text-lg md:text-xl tracking-tight text-black">
              ATTENDRIX
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "#features", label: "FEATURES" },
              { href: "#how-it-works", label: "HOW IT WORKS" },
              { href: "#pricing", label: "PRICING" },
              { href: "#faq", label: "FAQ" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 font-mono text-xs font-semibold tracking-wider text-muted-foreground hover:text-black hover:bg-paper border-2 border-transparent hover:border-black transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="default"
              size="sm"
              className="hidden sm:flex"
            >
              <a
                href="https://t.me/AttendrixBot"
                target="_blank"
                rel="noopener noreferrer"
              >
                GET ACCESS
              </a>
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 md:w-10 md:h-10 border-2 border-black flex items-center justify-center bg-surface shadow-[2px_2px_0_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              aria-label="Toggle menu"
            >
              <span className="font-mono font-bold text-sm text-black">
                {mobileMenuOpen ? "×" : "="}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-2 border-black bg-surface">
            <nav className="py-4 space-y-2">
              {[
                { href: "#features", label: "FEATURES" },
                { href: "#how-it-works", label: "HOW IT WORKS" },
                { href: "#pricing", label: "PRICING" },
                { href: "#faq", label: "FAQ" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 font-mono text-sm font-semibold tracking-wider border-b-2 border-border-light hover:bg-accent hover:border-black transition-all text-black"
                >
                  {link.label}
                </Link>
              ))}
              <div className="px-4 pt-4">
                <Button asChild className="w-full">
                  <a
                    href="https://t.me/HeyLumenBot"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GET ACCESS
                  </a>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
