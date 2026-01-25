"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  X,
  ChevronRight,
  BookOpen,
  Layers,
  Code2,
  Trophy,
  Database,
  Activity,
} from "lucide-react";
import DocsTOC from "@/components/docs/DocsTOC";

// ============================================
// TYPES
// ============================================

interface NavItem {
  title: string;
  href: string;
  isNew?: boolean;
}

interface NavSection {
  title: string;
  icon: typeof BookOpen;
  items: NavItem[];
}

// ============================================
// NAVIGATION DATA
// ============================================

const docsNavigation: NavSection[] = [
  {
    title: "Getting Started",
    icon: BookOpen,
    items: [{ title: "Introduction", href: "/docs/introduction" }],
  },
  {
    title: "Core Infrastructure",
    icon: Database,
    items: [
      { title: "Data Layer (Firebase)", href: "/docs/data-layer" },
      { title: "Logic Layer (Supabase)", href: "/docs/logic-layer" },
    ],
  },
  {
    title: "Gamification",
    icon: Trophy,
    items: [
      { title: "Gamification Rules", href: "/docs/gamification", isNew: true },
      { title: "Amplix System", href: "/docs/amplix" },
    ],
  },
  {
    title: "Features",
    icon: Layers,
    items: [
      { title: "Lumen AI", href: "/docs/features/lumen-ai", isNew: true },
      {
        title: "Marking Attendance",
        href: "/docs/features/marking-attendance",
      },
    ],
  },
  {
    title: "API Reference",
    icon: Code2,
    items: [
      { title: "Authentication", href: "/docs/api/auth" },
      { title: "Attendance RPC", href: "/docs/api/attendance" },
    ],
  },
];

// ============================================
// KEYBOARD SHORTCUT COMPONENT
// ============================================

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 bg-neutral-100 border-2 border-neutral-300 text-[10px] font-mono font-bold text-neutral-600 shadow-[1px_1px_0_0_#a3a3a3]">
      {children}
    </kbd>
  );
}

// ============================================
// SIDEBAR COMPONENT
// ============================================

function Sidebar({
  isOpen,
  onClose,
  onSearchOpen,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSearchOpen: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 lg:top-20 left-0 z-50 lg:z-auto
          w-72 lg:w-64 h-screen lg:h-[calc(100vh-6rem)]
          bg-[#fffdf5] lg:bg-transparent
          border-r-2 border-black lg:border-r-0
          overflow-y-auto
          transition-transform duration-300 lg:transition-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black lg:hidden bg-main">
          <span className="font-bold text-lg">Documentation</span>
          <button
            onClick={onClose}
            className="w-8 h-8 border-2 border-black flex items-center justify-center bg-white shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 pl-0 lg:pr-4 space-y-8">
          {/* Search Button (Mobile/Tablet) */}
          <div className="lg:hidden">
            <button
              onClick={onSearchOpen}
              className="w-full border-2 border-black bg-white px-3 py-2.5 flex justify-between items-center cursor-pointer shadow-[4px_4px_0_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
            >
              <div className="flex items-center gap-2 text-neutral-500">
                <Search className="w-4 h-4" />
                <span className="text-sm font-bold">Search docs...</span>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-8">
            {docsNavigation.map((section) => (
              <div key={section.title}>
                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black mb-4 border-b-2 border-black/10 pb-2">
                  <section.icon className="w-4 h-4" />
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => {
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={`
                            group flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200 border-2
                            ${
                              isActive
                                ? "bg-main border-black shadow-[4px_4px_0_#000] translate-x-[-2px] -translate-y-[2px]"
                                : "border-transparent hover:border-black hover:bg-white hover:shadow-[3px_3px_0_#000] text-neutral-600 hover:text-black"
                            }
                          `}
                        >
                          <ChevronRight
                            className={`w-3 h-3 transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`}
                          />
                          {item.title}
                          {item.isNew && (
                            <span className="ml-auto px-1.5 py-0.5 bg-black text-white text-[9px] font-bold uppercase tracking-wider">
                              New
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

// ============================================
// COMMAND DIALOG (SEARCH)
// ============================================

function CommandDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[101]"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, type: "spring" }}
          >
            <div className="bg-paper border-2 border-black shadow-[8px_8px_0_#000] mx-4 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b-2 border-black bg-white">
                <Search className="w-5 h-5 text-black" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="flex-1 bg-transparent outline-none text-base font-bold placeholder:text-neutral-400 font-mono"
                  autoFocus
                />
                <button
                  onClick={onClose}
                  className="px-2 py-1 bg-neutral-100 border-2 border-neutral-300 text-xs font-bold hover:bg-neutral-200"
                >
                  ESC
                </button>
              </div>

              {/* Results */}
              <div className="p-2 max-h-80 overflow-y-auto bg-paper">
                <p className="px-3 py-2 text-xs font-black uppercase tracking-wider text-neutral-400">
                  Quick Links
                </p>
                {[
                  { title: "Introduction", href: "/docs/introduction" },
                  { title: "Data Layer", href: "/docs/data-layer" },
                  { title: "Logic Layer", href: "/docs/logic-layer" },
                  { title: "Gamification", href: "/docs/gamification" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-main hover:border-2 hover:border-black hover:shadow-[2px_2px_0_#000] transition-all border-2 border-transparent"
                    onClick={onClose}
                  >
                    <BookOpen className="w-4 h-4 text-black" />
                    <span className="text-sm font-bold">{item.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// MAIN LAYOUT COMPONENT
// ============================================

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ⌘K keyboard shortcut handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setIsSearchOpen((prev) => !prev);
    }
    if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-[#fffdf5] font-sans text-neutral-900 selection:bg-main selection:text-black">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#fffdf5] border-b-2 border-black shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 border-2 border-black flex items-center justify-center bg-white shadow-[2px_2px_0_#000] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-main border-2 border-black flex items-center justify-center shadow-[4px_4px_0_#000] group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-[2px_2px_0_#000] transition-all">
                <span className="font-mono font-black text-xl text-black">
                  A
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-tight uppercase leading-none">
                  Attendrix
                </span>
                <span className="font-mono text-[10px] font-bold tracking-widest text-neutral-500 uppercase">
                  Developers
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Search Shortcut */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center gap-3 bg-white border-2 border-black px-4 py-2 shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
          >
            <Search className="w-4 h-4 text-neutral-500 group-hover:text-black" />
            <span className="text-sm font-bold text-neutral-600 group-hover:text-black">
              Search docs...
            </span>
            <div className="flex items-center gap-1 ml-2">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </div>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-8 py-8 relative">
          {/* Left Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onSearchOpen={() => {
              setIsSidebarOpen(false);
              setIsSearchOpen(true);
            }}
          />

          {/* Center Content */}
          <main className="flex-1 min-w-0 prose prose-neutral prose-lg lg:prose-xl max-w-none pt-2 pb-20">
            {children}
          </main>

          {/* Right TOC (Desktop Only) */}
          <DocsTOC />
        </div>
      </div>

      {/* Command Dialog */}
      <CommandDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
