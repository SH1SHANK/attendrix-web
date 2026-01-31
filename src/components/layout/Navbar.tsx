"use client";

import Link from "next/link";
import {
  useState,
  useRef,
  useEffect,
  useSyncExternalStore,
  useCallback,
} from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { UserMenu } from "@/components/layout/UserMenu";
import { Menu, X, LogOut, ChevronRight } from "lucide-react";
import { NeoAvatar } from "@/components/ui/NeoAvatar";

// ============================================================================
// Animation Variants
// ============================================================================

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

const mobileMenuVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
    },
  },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const mobileItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 28,
    },
  },
};

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
// Scroll Spy Hook
// ============================================================================

function useScrollSpy(sectionIds: string[], offset = 100) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + offset;

      // Find the section that's currently in view
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

      // If no section is in view, set to null (top of page)
      setActiveSection(null);
    };

    handleScroll(); // Initial check
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sectionIds, offset]);

  return activeSection;
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
// Mobile Nav Link Component
// ============================================================================

interface MobileNavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function MobileNavLink({ href, label, isActive, onClick }: MobileNavLinkProps) {
  return (
    <motion.div variants={mobileItemVariants}>
      <Link
        href={href}
        onClick={onClick}
        className={`
          flex items-center justify-between px-4 py-3
          font-mono text-sm font-semibold tracking-wider
          border-2 transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
          ${
            isActive
              ? "bg-[#FFD02F] text-black border-black shadow-[2px_2px_0_#000]"
              : "bg-white text-black border-transparent hover:border-black hover:bg-yellow-50"
          }
        `}
        aria-current={isActive ? "page" : undefined}
      >
        <span>{label}</span>
        {isActive && <ChevronRight className="w-4 h-4" />}
      </Link>
    </motion.div>
  );
}

// ============================================================================
// Navbar Component
// ============================================================================

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close mobile menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Note: Mobile menu is closed via handleMobileNavClick when user clicks nav links
  // No need for pathname-based effect since all navigation already closes the menu

  const handleMobileNavClick = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

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
                  <UserMenu />
                ) : (
                  <motion.div
                    whileHover={{ x: -2, y: -2 }}
                    whileTap={{ x: 2, y: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Link
                      href="/auth/signup"
                      className="
                        hidden sm:inline-flex items-center justify-center 
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
                )}

                {/* Mobile Menu Toggle */}
                <motion.button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="
                    lg:hidden p-2.5 min-w-[44px] min-h-[44px]
                    flex items-center justify-center
                    border-2 transition-all duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
                  "
                  style={{
                    borderColor: mobileMenuOpen ? "#000" : "transparent",
                    backgroundColor: mobileMenuOpen ? "#FEF3C7" : "transparent",
                    boxShadow: mobileMenuOpen ? "2px 2px 0px 0px #000" : "none",
                  }}
                  whileHover={{
                    borderColor: "#000",
                    backgroundColor: "#FEF3C7",
                  }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {mobileMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.15 }}
                      >
                        <X className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ opacity: 0, rotate: 90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: -90 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Menu className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>

            {/* Mobile Navigation Menu */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  id="mobile-menu"
                  variants={mobileMenuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="lg:hidden border-t-2 border-black bg-stone-50 overflow-hidden"
                  role="navigation"
                  aria-label="Mobile navigation"
                >
                  <div className="px-4 py-4 space-y-2">
                    {/* Mobile Nav Links */}
                    {navLinks.map((link) => (
                      <MobileNavLink
                        key={link.href}
                        href={link.href}
                        label={link.label}
                        isActive={activeSection === link.href}
                        onClick={() => {
                          handleMobileNavClick();
                          const element = document.getElementById(
                            link.href.replace("#", ""),
                          );
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                      />
                    ))}

                    {/* User Profile Row or Get Started Button */}
                    <motion.div
                      variants={mobileItemVariants}
                      className="border-t-2 border-dashed border-neutral-300 pt-4 mt-4"
                    >
                      {user ? (
                        <div className="flex items-center justify-between px-4 py-3 border-2 border-black bg-white shadow-[2px_2px_0_#0a0a0a]">
                          <div className="flex items-center gap-3">
                            <NeoAvatar name={user.displayName || user.email} />
                            <div>
                              <span className="font-bold text-sm text-black block">
                                {user.displayName?.split(" ")[0] || "Pilot"}
                              </span>
                              {user.email && (
                                <span className="text-[10px] text-neutral-500 block truncate max-w-[150px]">
                                  {user.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <motion.button
                            onClick={() => {
                              logout();
                              setMobileMenuOpen(false);
                            }}
                            className="
                              p-2.5 min-w-[44px] min-h-[44px]
                              flex items-center justify-center
                              hover:bg-red-100 border-2 border-transparent
                              hover:border-red-200 transition-all duration-200
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
                            "
                            whileTap={{ scale: 0.95 }}
                            title="Sign out"
                            aria-label="Sign out"
                          >
                            <LogOut className="w-5 h-5 text-red-600" />
                          </motion.button>
                        </div>
                      ) : (
                        <motion.div
                          whileHover={{ x: -2, y: -2 }}
                          whileTap={{ x: 2, y: 2 }}
                        >
                          <Link
                            href="/auth/signup"
                            onClick={handleMobileNavClick}
                            className="
                              block w-full py-3.5 bg-[#FFD02F] text-black 
                              border-2 border-black font-bold uppercase text-sm tracking-wider 
                              shadow-[4px_4px_0px_0px_#000] text-center
                              transition-shadow duration-200
                              hover:shadow-[6px_6px_0px_0px_#000]
                              active:shadow-none
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
                            "
                          >
                            Get Started
                          </Link>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.header>
    </>
  );
}
