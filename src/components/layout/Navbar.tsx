"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { UserMenu } from "@/components/layout/UserMenu";

// ============================================================================
// Animation Variants
// ============================================================================

const headerVariants = {
  top: {
    y: 0,
    borderRadius: 0,
  },
  scrolled: {
    y: 16,
    borderRadius: 0,
  },
};

// ============================================================================
// Scroll Spy Hook
// ============================================================================

function useScrollSpy(sectionIds: string[], offset = 100) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + offset;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const sectionHref = sectionIds[i];
        if (!sectionHref) continue;

        const sectionId = sectionHref.replace("#", "");
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop } = element;
          if (scrollPosition >= offsetTop) {
            setActiveSection(`#${sectionId}`);
            return;
          }
        }
      }

      setActiveSection(null);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sectionIds, offset]);

  return activeSection;
}

// ============================================================================
// Hydration-safe mounting hook
// ============================================================================

const emptySubscribe = () => () => {};
const returnTrue = () => true;
const returnFalse = () => false;

function useHasMounted() {
  return useSyncExternalStore(emptySubscribe, returnTrue, returnFalse);
}

// ============================================================================
// Skip Navigation Link Component
// ============================================================================

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        focus:absolute focus:top-4 focus:left-4 focus:z-100
        focus:px-4 focus:py-2 focus:bg-black focus:text-white
        focus:font-bold focus:uppercase focus:text-sm
        focus:border-2 focus:border-white focus:shadow-lg
        focus:outline-none
      "
    >
      Skip to main content
    </a>
  );
}

// ============================================================================
// Desktop Nav Link Component
// ============================================================================

interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

function NavLink({
  href,
  label,
  isActive,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      className="
        relative px-4 py-2 font-mono text-xs font-semibold tracking-wider
        text-black transition-colors duration-200 z-10
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
      "
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Hover/Active background pill */}
      <AnimatePresence>
        {(isHovered || isActive) && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 -z-10"
            style={{
              borderRadius: 0,
              backgroundColor: isActive ? "#FFD02F" : "#000000",
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
            }}
          />
        )}
      </AnimatePresence>

      {/* Link text */}
      <span
        className={`
          relative z-10 transition-colors duration-150
          ${isHovered ? "text-white" : isActive ? "text-black" : "text-black"}
        `}
      >
        {label}
      </span>

      {/* Active indicator dot */}
      {isActive && !isHovered && (
        <motion.span
          layoutId="active-dot"
          className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-black rounded-full"
          style={{ x: "-50%" }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
}

// ============================================================================
// Navbar Component
// ============================================================================

export default function Navbar() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const mounted = useHasMounted();
  const headerRef = useRef<HTMLElement>(null);

  const { scrollY } = useScroll();

  // Navigation links
  const navLinks = [
    { href: "#features", label: "FEATURES" },
    { href: "#how-it-works", label: "HOW IT WORKS" },
    { href: "#pricing", label: "PRICING" },
    { href: "#faq", label: "FAQ" },
  ];

  // Scroll spy for active section detection
  const activeSection = useScrollSpy(
    navLinks.map((link) => link.href),
    120,
  );

  // Scroll detection with hysteresis
  useMotionValueEvent(scrollY, "change", (latest) => {
    const threshold = 50;
    if (latest > threshold && !scrolled) {
      setScrolled(true);
    } else if (latest <= threshold - 10 && scrolled) {
      setScrolled(false);
    }
  });

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <>
        <SkipLink />
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
      </>
    );
  }

  return (
    <>
      <SkipLink />
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
        role="banner"
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
            borderBottomWidth: "2px",
            borderTopWidth: scrolled ? "2px" : "0px",
            borderLeftWidth: scrolled ? "2px" : "0px",
            borderRightWidth: scrolled ? "2px" : "0px",
            borderStyle: "solid",
            borderColor: "#000000",
            borderRadius: 0,
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
        >
          <div className="px-4 md:px-6">
            <div className="flex items-center justify-between h-14 md:h-16">
              {/* Logo */}
              <Link
                href="/"
                className="flex items-center gap-2 md:gap-3 group relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 rounded-sm"
                aria-label="Attendrix - Go to homepage"
              >
                <motion.div
                  className="w-8 h-8 md:w-10 md:h-10 bg-[#FFD02F] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000]"
                  whileHover={{
                    x: -2,
                    y: -2,
                    boxShadow: "4px 4px 0 #000",
                  }}
                  whileTap={{
                    x: 1,
                    y: 1,
                    boxShadow: "1px 1px 0 #000",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <span className="font-mono font-bold text-sm md:text-lg text-black">
                    A
                  </span>
                </motion.div>
                <span className="font-display font-bold text-lg md:text-xl tracking-tight text-black">
                  ATTENDRIX
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav
                className="hidden lg:flex items-center gap-1 relative"
                role="navigation"
                aria-label="Main navigation"
              >
                {navLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    isActive={activeSection === link.href}
                    isHovered={hoveredLink === link.href}
                    onMouseEnter={() => setHoveredLink(link.href)}
                    onMouseLeave={() => setHoveredLink(null)}
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(
                        link.href.replace("#", ""),
                      );
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  />
                ))}
              </nav>

              {/* CTA & User Menu */}
              <div className="flex items-center gap-3">
                {user ? (
                  <div className="lg:hidden">
                    <UserMenu />
                  </div>
                ) : (
                  <>
                    <motion.div
                      whileHover={{ x: -2, y: -2 }}
                      whileTap={{ x: 2, y: 2 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                    >
                      <Link
                        href="/auth/signup"
                        className="
                          inline-flex items-center justify-center 
                          px-6 py-2 bg-[#FFD02F] text-black 
                          border-2 border-black font-bold uppercase text-xs tracking-wider 
                          shadow-[4px_4px_0px_0px_#000] 
                          transition-shadow duration-200
                          hover:shadow-[6px_6px_0px_0px_#000]
                          active:shadow-none
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
                        "
                      >
                        Get Started
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.header>
    </>
  );
}
