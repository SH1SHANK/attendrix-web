"use client";

import { memo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Calendar, User } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useTimeFormat } from "@/context/TimeFormatContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/classes", label: "Classes", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User },
];

export const DashboardNav = memo(function DashboardNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const { is24Hour, toggleTimeFormat } = useTimeFormat();

  // Scroll detection with hysteresis
  useMotionValueEvent(scrollY, "change", (latest) => {
    const threshold = 50;
    if (latest > threshold && !scrolled) {
      setScrolled(true);
    } else if (latest <= threshold - 10 && scrolled) {
      setScrolled(false);
    }
  });

  // Fix hydration mismatch by only rendering motion variants after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleButtonJsx = (
    <button
      onClick={toggleTimeFormat}
      className={cn(
        "relative flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-black font-bold uppercase text-xs sm:text-sm",
        "bg-white shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] active:shadow-[2px_2px_0_0_#000]",
        "transition-all duration-200 ease-out touch-manipulation group min-w-14",
        "hover:translate-y-1 active:translate-y-2 active:translate-x-1",
      )}
    >
      <span className="font-mono">{is24Hour ? "24H" : "12H"}</span>
    </button>
  );

  if (!mounted) {
    // Render a static version first to match server
    return (
      <>
        <nav
          className="fixed left-1/2 bottom-6 z-50 pointer-events-none"
          style={{ transform: "translateX(-50%)" }}
        >
          <div className="flex items-center gap-2 px-3 py-3 border-2 border-black pointer-events-auto bg-[#fffdf5] shadow-[8px_8px_0_0_#000]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 border-2 border-black font-bold uppercase text-xs sm:text-sm",
                  "bg-white shadow-[4px_4px_0_0_#000]",
                  pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href))
                    ? "bg-[#FFD02F] shadow-[4px_4px_0_0_#000]"
                    : "bg-white shadow-[4px_4px_0_0_#000]",
                )}
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
            {/* Toggle Button for Static View - matching style roughly but static */}
            <button
              className={cn(
                "relative flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-black font-bold uppercase text-xs sm:text-sm",
                "bg-white shadow-[4px_4px_0_0_#000] min-w-14",
              )}
            >
              <span className="font-mono">12H</span>
            </button>
          </div>
        </nav>
        <div className="h-20" />
      </>
    );
  }

  return (
    <>
      {/* Floating Dock Navigation */}
      <motion.nav
        className="fixed left-1/2 bottom-6 z-50 pointer-events-none"
        initial={{ y: 0, x: "-50%" }}
        animate={{
          y: scrolled ? 8 : 0,
          x: "-50%",
          scale: scrolled ? 0.95 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
      >
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-3 border-2 border-black pointer-events-auto",
            "transition-all duration-300 ease-out",
            scrolled
              ? "bg-[#fffdf5]/80 backdrop-blur-md shadow-[6px_6px_0_0_#000]"
              : "bg-[#fffdf5] shadow-[8px_8px_0_0_#000]",
          )}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 border-2 border-black font-bold uppercase text-xs sm:text-sm",
                  "transition-all duration-200 ease-out touch-manipulation group",
                  "hover:translate-y-1 active:translate-y-2 active:translate-x-1",
                  isActive
                    ? "bg-[#FFD02F] shadow-[4px_4px_0_0_#000]"
                    : "bg-white shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] active:shadow-[2px_2px_0_0_#000]",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200",
                    isActive && "scale-110",
                  )}
                />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
          {toggleButtonJsx}
        </div>
      </motion.nav>

      {/* Spacer for content below nav */}
      <div className="h-20" />
    </>
  );
});
