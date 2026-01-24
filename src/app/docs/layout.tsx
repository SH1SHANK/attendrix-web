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
} from "lucide-react";

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
    <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 text-[10px] font-mono font-bold text-neutral-600 shadow-[0_1px_0_1px_rgba(0,0,0,0.1)]">
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
          w-72 lg:w-64 h-screen lg:h-[calc(100vh-5rem)]
          bg-[#fffdf5] lg:bg-transparent
          border-r-2 border-black lg:border-0
          overflow-y-auto
          transition-transform duration-300 lg:transition-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black lg:hidden">
          <span className="font-bold text-lg">Documentation</span>
          <button
            onClick={onClose}
            className="w-10 h-10 border-2 border-black flex items-center justify-center bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 lg:p-0">
          {/* Search Button */}
          <button
            onClick={onSearchOpen}
            className="w-full border-2 border-black bg-white px-3 py-2.5 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-colors mb-6"
          >
            <div className="flex items-center gap-2 text-neutral-500">
              <Search className="w-4 h-4" />
              <span className="text-sm">Search docs...</span>
            </div>
            <div className="flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-6">
            {docsNavigation.map((section) => (
              <div key={section.title}>
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">
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
                          className={`
                            flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors
                            ${
                              isActive
                                ? "bg-[#FFD02F] border-2 border-black font-bold text-black"
                                : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                            }
                          `}
                        >
                          <ChevronRight
                            className={`w-3 h-3 ${isActive ? "opacity-100" : "opacity-0"}`}
                          />
                          {item.title}
                          {item.isNew && (
                            <span className="ml-auto px-1.5 py-0.5 bg-black text-white text-[10px] font-bold uppercase">
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
            className="fixed inset-0 bg-black/50 z-[100]"
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
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white border-2 border-black shadow-[8px_8px_0_#000] mx-4">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-black">
                <Search className="w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="flex-1 bg-transparent outline-none text-base font-medium placeholder:text-neutral-400"
                  autoFocus
                />
                <button
                  onClick={onClose}
                  className="px-2 py-1 bg-neutral-100 border border-neutral-300 text-xs font-bold"
                >
                  ESC
                </button>
              </div>

              {/* Results */}
              <div className="p-2 max-h-80 overflow-y-auto">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Quick Links
                </p>
                {[
                  { title: "Introduction", href: "/docs/introduction" },
                  { title: "Lumen AI", href: "/docs/features/lumen-ai" },
                  {
                    title: "Marking Attendance",
                    href: "/docs/features/marking-attendance",
                  },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#FFD02F] transition-colors"
                    onClick={onClose}
                  >
                    <BookOpen className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm font-medium">{item.title}</span>
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
    <div className="min-h-screen bg-[#fffdf5]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#fffdf5] border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 border-2 border-black flex items-center justify-center bg-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#FFD02F] border-2 border-black flex items-center justify-center shadow-[2px_2px_0_#000]">
                <span className="font-mono font-bold text-sm text-black">
                  A
                </span>
              </div>
              <span className="font-bold text-lg tracking-tight uppercase">
                Attendrix Docs
              </span>
            </Link>
          </div>

          {/* Desktop Search Shortcut */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center gap-2 text-sm text-neutral-500 hover:text-black"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
            <div className="flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </div>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-8 py-8">
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
          <main className="flex-1 min-w-0">{children}</main>
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
