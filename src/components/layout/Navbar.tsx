"use client";

import Link from "next/link";
import { useState, useRef, useSyncExternalStore } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { UserMenu } from "@/components/layout/UserMenu";

// Animation variants for the floating header
const headerVariants = {
  top: {
    y: 0,
    scale: 1,
    borderRadius: 0,
  },
  scrolled: {
    y: 16,
    scale: 0.95,
    borderRadius: 0,
  },
};

// Custom hook for hydration-safe mounting check
const emptySubscribe = () => () => {};
const returnTrue = () => true;
const returnFalse = () => false;

function useHasMounted() {
  return useSyncExternalStore(emptySubscribe, returnTrue, returnFalse);
}

export default function Navbar() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const mounted = useHasMounted();
  const headerRef = useRef<HTMLElement>(null);

  const { scrollY } = useScroll();

  // Robust scroll detection with useMotionValueEvent
  useMotionValueEvent(scrollY, "change", (latest) => {
    const threshold = 50;
    if (latest > threshold && !scrolled) {
      setScrolled(true);
    } else if (latest <= threshold - 10 && scrolled) {
      setScrolled(false);
    }
  });

  const navLinks = [
    { href: "#features", label: "FEATURES" },
    { href: "#how-it-works", label: "HOW IT WORKS" },
    { href: "#pricing", label: "PRICING" },
    { href: "#faq", label: "FAQ" },
  ];

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fffdf5] border-b-2 border-black">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FFD02F] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                <span className="font-mono font-bold text-sm md:text-lg text-black">
                  A
                </span>
              </div>
              <span className="font-display font-bold text-lg md:text-xl tracking-tight text-black">
                ATTENDRIX
              </span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <motion.header
      ref={headerRef}
      className="fixed z-50 pointer-events-auto"
      style={{
        top: 0,
        left: scrolled ? "50%" : 0,
        right: scrolled ? "auto" : 0,
        x: scrolled ? "-50%" : 0,
        width: scrolled ? "90%" : "100%",
        maxWidth: scrolled ? "64rem" : "none",
      }}
      initial={false}
      animate={scrolled ? "scrolled" : "top"}
      variants={headerVariants}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      <motion.div
        className="w-full h-full"
        initial={false}
        animate={{
          backgroundColor: scrolled ? "#ffffff" : "#fffdf5",
          boxShadow: scrolled
            ? "4px 4px 0px 0px #000000"
            : "0px 0px 0px 0px #000000",
        }}
        style={{
          border: scrolled ? "2px solid #000000" : "none",
          borderBottom: scrolled ? "2px solid #000000" : "2px solid #000000",
          borderRadius: 0,
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut" as const,
        }}
      >
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 md:gap-3 group relative z-10"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FFD02F] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:shadow-[4px_4px_0_#000] group-hover:-translate-x-[2px] group-hover:-translate-y-[2px]">
                <span className="font-mono font-bold text-sm md:text-lg text-black">
                  A
                </span>
              </div>
              <span className="font-display font-bold text-lg md:text-xl tracking-tight text-black">
                ATTENDRIX
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 relative">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 font-mono text-xs font-semibold tracking-wider text-black transition-colors duration-200 z-10"
                  onMouseEnter={() => setHoveredLink(link.href)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  {hoveredLink === link.href && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-black -z-10"
                      style={{ borderRadius: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span
                    className={`relative z-10 transition-colors duration-150 ${
                      hoveredLink === link.href ? "text-white" : "text-black"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* CTA & User Menu */}
            <div className="flex items-center gap-3">
              {user ? (
                <UserMenu />
              ) : (
                <div className="hidden sm:flex items-center gap-4">
                  <Link
                    href="/app"
                    className="group relative inline-flex items-center justify-center px-4 py-2 bg-white text-black border-2 border-black font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#000] transition-all duration-300 hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Launch Web
                      <span className="bg-[#FFD02F] text-[9px] px-1 py-0.5 border border-black leading-none">
                        BETA
                      </span>
                    </span>
                  </Link>
                  <Link
                    href="/download"
                    className="inline-flex items-center justify-center px-6 py-2 bg-[#FF4F4F] text-white border-2 border-black font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#000] transition-all duration-300 hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    Download App
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}
