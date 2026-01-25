"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  User,
  Trophy,
} from "lucide-react";

// Navigation items configuration
const navItems = [
  {
    href: "/app",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/app/ledger",
    label: "Ledger",
    icon: BookOpen,
  },
  {
    href: "/app/calendar",
    label: "Calendar",
    icon: Calendar,
  },
  {
    href: "/app/challenges",
    label: "Challenges",
    icon: Trophy,
  },
  {
    href: "/app/profile",
    label: "Profile",
    icon: User,
  },
];

export function FloatingDock() {
  const pathname = usePathname();

  return (
    <motion.nav
      className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: 0.2,
      }}
    >
      {/* Dock Container */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-black shadow-[6px_6px_0px_0px_#000]">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/app" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <motion.div
                className={`
                  relative w-12 h-12 flex items-center justify-center
                  border-2 border-black cursor-pointer
                  transition-colors duration-200
                  ${
                    isActive
                      ? "bg-[#FFD02F] shadow-none translate-x-[2px] translate-y-[2px]"
                      : "bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100"
                  }
                `}
                whileHover={!isActive ? { scale: 1.08 } : {}}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-black" : "text-neutral-700"}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {/* Active Indicator Dot */}
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black"
                    layoutId="activeIndicator"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
