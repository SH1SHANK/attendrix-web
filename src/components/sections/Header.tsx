"use client";

import Link from "next/link";
import {
  useState,
  useCallback,
  useRef,
  useSyncExternalStore,
  useEffect,
} from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import {
  Github,
  Twitter,
  Send,
  BookOpen,
  FileText,
  Activity,
  Code2,
  Shield,
  Scale,
} from "lucide-react";

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

// Mobile menu animation variants - Full Screen Slide Down
const menuVariants = {
  hidden: {
    y: "-100%",
    transition: {
      duration: 0.5,
      ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
    },
  },
  visible: {
    y: "0%",
    transition: {
      duration: 0.6,
      ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
  exit: {
    y: "-100%",
    transition: {
      duration: 0.5,
      ease: [0.76, 0, 0.24, 1] as [number, number, number, number],
    },
  },
};

const menuItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

// Custom hook for hydration-safe mounting check
const emptySubscribe = () => () => {};
const returnTrue = () => true;
const returnFalse = () => false;

function useHasMounted() {
  return useSyncExternalStore(emptySubscribe, returnTrue, returnFalse);
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const mounted = useHasMounted();
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();

  // Robust scroll detection with useMotionValueEvent (prevents hydration mismatch)
  useMotionValueEvent(scrollY, "change", (latest) => {
    // Use threshold with hysteresis to prevent flickering
    const threshold = 50;
    if (latest > threshold && !scrolled) {
      setScrolled(true);
    } else if (latest <= threshold - 10 && scrolled) {
      // Hysteresis: Only unset when significantly below threshold
      setScrolled(false);
    }
  });

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  // Close menu handler
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

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
    <>
      {/* Main Header */}
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
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <div className="px-4 md:px-6">
            <div className="flex items-center justify-between h-14 md:h-16">
              {/* Logo */}
              <Link
                href="/"
                className="flex items-center gap-2 md:gap-3 group relative z-10"
                onClick={closeMobileMenu}
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
              <nav className="hidden md:flex items-center gap-1 relative">
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

              {/* CTA & Mobile Toggle */}
              <div className="flex items-center gap-3">
                {/* Desktop CTA */}
                <a
                  href="https://t.me/AttendrixBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center justify-center px-6 py-2 bg-[#FFD02F] text-black border-2 border-black font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  GET ACCESS
                </a>

                {/* Mobile Hamburger Button - Large touch target (48x48, icon inside) */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden w-12 h-12 flex items-center justify-center relative z-10"
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={mobileMenuOpen}
                >
                  <div className="w-10 h-10 border-2 border-black flex flex-col items-center justify-center gap-1.5 bg-white shadow-[2px_2px_0_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                    <motion.span
                      className="w-5 h-0.5 bg-black origin-center"
                      animate={{
                        rotate: mobileMenuOpen ? 45 : 0,
                        y: mobileMenuOpen ? 4 : 0,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    />
                    <motion.span
                      className="w-5 h-0.5 bg-black"
                      animate={{
                        opacity: mobileMenuOpen ? 0 : 1,
                        scaleX: mobileMenuOpen ? 0 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.span
                      className="w-5 h-0.5 bg-black origin-center"
                      animate={{
                        rotate: mobileMenuOpen ? -45 : 0,
                        y: mobileMenuOpen ? -4 : 0,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.header>

      {/* Mobile Menu - Full Screen Takeover */}
      <AnimatePresence mode="wait">
        {mobileMenuOpen && (
          <motion.div
            ref={menuRef}
            className="fixed inset-0 z-[999] md:hidden bg-[#fffdf5] overflow-y-auto"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Replicated Header Row */}
            <div className="flex items-center justify-between h-14 px-4 border-b-2 border-black bg-[#fffdf5]">
              {/* Logo */}
              <Link
                href="/"
                className="flex items-center gap-2 group"
                onClick={closeMobileMenu}
              >
                <div className="w-8 h-8 bg-[#FFD02F] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                  <span className="font-mono font-bold text-sm text-black">
                    A
                  </span>
                </div>
                <span className="font-display font-bold text-lg tracking-tight text-black">
                  ATTENDRIX
                </span>
              </Link>

              {/* Close Button */}
              <button
                onClick={closeMobileMenu}
                className="w-12 h-12 flex items-center justify-center"
                aria-label="Close menu"
              >
                <div className="w-10 h-10 border-2 border-black flex items-center justify-center bg-white shadow-[2px_2px_0_#000] transition-all duration-300 hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="square"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Content Container - Full Height Flex Distribution */}
            <div className="h-[calc(100vh-3.5rem)] flex flex-col">
              {/* ZONE A: Main Navigation Links (Top) */}
              <motion.nav
                className="px-6 pt-10"
                role="navigation"
                aria-label="Mobile navigation"
                variants={menuItemVariants}
              >
                <div className="flex flex-col gap-7">
                  {navLinks.map((link) => (
                    <motion.div key={link.href} variants={menuItemVariants}>
                      <Link
                        href={link.href}
                        onClick={closeMobileMenu}
                        className="text-4xl font-black uppercase tracking-tight text-black hover:text-[#FFD02F] transition-colors duration-200 block"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.nav>

              {/* ZONE B: Resources Grid (Middle - Flex Grow) */}
              <motion.div
                className="px-6 py-8 flex-grow flex flex-col justify-center"
                variants={menuItemVariants}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-5">
                  Resources
                </p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <Link
                    href="/docs"
                    onClick={closeMobileMenu}
                    className="text-sm font-bold text-neutral-500 hover:text-black transition-colors"
                  >
                    Documentation
                  </Link>
                  <Link
                    href="/changelog"
                    onClick={closeMobileMenu}
                    className="text-sm font-bold text-neutral-500 hover:text-black transition-colors"
                  >
                    Changelog
                  </Link>
                  <Link
                    href="/status"
                    onClick={closeMobileMenu}
                    className="text-sm font-bold text-neutral-500 hover:text-black transition-colors"
                  >
                    System Status
                  </Link>
                  <Link
                    href="/api"
                    onClick={closeMobileMenu}
                    className="text-sm font-bold text-neutral-500 hover:text-black transition-colors"
                  >
                    API Reference
                  </Link>
                </div>
              </motion.div>

              {/* ZONE C & D: Footer Section (Bottom) */}
              <motion.div className="px-6 pb-6" variants={menuItemVariants}>
                {/* Socials + Legal Row */}
                <div className="flex items-center justify-between mb-6">
                  {/* Social Icons */}
                  <div className="flex items-center gap-3">
                    <a
                      href="https://twitter.com/attendrix"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0_#000] transition-all duration-200 hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[4px_4px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      aria-label="Twitter"
                    >
                      <Twitter className="w-5 h-5 text-black" />
                    </a>
                    <a
                      href="https://github.com/attendrix"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0_#000] transition-all duration-200 hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[4px_4px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      aria-label="GitHub"
                    >
                      <Github className="w-5 h-5 text-black" />
                    </a>
                    <a
                      href="https://t.me/AttendrixBot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0_#000] transition-all duration-200 hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[4px_4px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      aria-label="Telegram"
                    >
                      <Send className="w-5 h-5 text-black" />
                    </a>
                  </div>

                  {/* Legal Links */}
                  <div className="flex items-center gap-4">
                    <Link
                      href="/privacy"
                      onClick={closeMobileMenu}
                      className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      Privacy
                    </Link>
                    <Link
                      href="/terms"
                      onClick={closeMobileMenu}
                      className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      Terms
                    </Link>
                  </div>
                </div>

                {/* CTA Button */}
                <a
                  href="https://t.me/AttendrixBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMobileMenu}
                  className="w-full flex items-center justify-center h-14 bg-[#FFD02F] text-black border-2 border-black font-bold uppercase text-base tracking-wider shadow-[4px_4px_0px_0px_#000] transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  GET ACCESS
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
