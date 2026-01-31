"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { NeoAvatar } from "@/components/ui/NeoAvatar";
import {
  ChevronDown,
  Rocket,
  Shield,
  Scale,
  LogOut,
  ExternalLink,
} from "lucide-react";

// ============================================================================
// Animation Variants
// ============================================================================

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 28,
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    transition: {
      duration: 0.15,
      ease: "easeOut" as const,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
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
// MenuItem Component
// ============================================================================

interface MenuItemProps {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  description?: string;
  variant?: "default" | "primary" | "destructive";
  isExternal?: boolean;
  isFocused?: boolean;
  onFocus?: () => void;
}

function MenuItem({
  href,
  onClick,
  icon,
  label,
  description,
  variant = "default",
  isExternal = false,
  isFocused = false,
  onFocus,
}: MenuItemProps) {
  const baseClasses = `
    w-full text-left px-4 py-3 flex items-center gap-3
    font-bold uppercase text-sm tracking-wide
    transition-all duration-150 outline-none
    focus-visible:ring-2 focus-visible:ring-offset-1
  `;

  const variantClasses = {
    default: `
      hover:bg-neutral-100 active:bg-neutral-200
      focus-visible:ring-black
      ${isFocused ? "bg-neutral-100" : ""}
    `,
    primary: `
      bg-[#FFD02F] text-black border-b-2 border-black
      hover:bg-[#ffdb5c] active:bg-[#f5c623]
      focus-visible:ring-[#FFD02F]
      ${isFocused ? "bg-[#ffdb5c]" : ""}
    `,
    destructive: `
      text-red-600 hover:bg-red-50 active:bg-red-100
      focus-visible:ring-red-500
      ${isFocused ? "bg-red-50" : ""}
    `,
  };

  const content = (
    <>
      <span
        className={`w-5 h-5 flex items-center justify-center shrink-0 ${variant === "destructive" ? "text-red-500" : variant === "primary" ? "text-black" : "text-neutral-500"}`}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block">{label}</span>
        {description && (
          <span className="block text-[10px] font-normal normal-case text-neutral-500 mt-0.5">
            {description}
          </span>
        )}
      </span>
      {isExternal && (
        <ExternalLink className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
      )}
    </>
  );

  if (href) {
    return (
      <motion.div variants={itemVariants}>
        <Link
          href={href}
          onClick={onClick}
          onFocus={onFocus}
          className={`${baseClasses} ${variantClasses[variant]}`}
          role="menuitem"
          tabIndex={isFocused ? 0 : -1}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
        >
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants}>
      <button
        onClick={onClick}
        onFocus={onFocus}
        className={`${baseClasses} ${variantClasses[variant]}`}
        role="menuitem"
        tabIndex={isFocused ? 0 : -1}
      >
        {content}
      </button>
    </motion.div>
  );
}

// ============================================================================
// MenuSection Component
// ============================================================================

interface MenuSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

function MenuSection({ title, children, className = "" }: MenuSectionProps) {
  return (
    <div className={className} role="group" aria-label={title}>
      {title && (
        <div className="px-4 py-1.5 text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ============================================================================
// UserMenu Component
// ============================================================================

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuItemsRef = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>(
    [],
  );

  // Total number of focusable menu items
  const MENU_ITEMS_COUNT = 4; // Primary action, 2 legal links, logout

  // Close menu and return focus to trigger
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          closeMenu();
          break;

        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex((prev) =>
            prev < MENU_ITEMS_COUNT - 1 ? prev + 1 : 0,
          );
          break;

        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : MENU_ITEMS_COUNT - 1,
          );
          break;

        case "Home":
          event.preventDefault();
          setFocusedIndex(0);
          break;

        case "End":
          event.preventDefault();
          setFocusedIndex(MENU_ITEMS_COUNT - 1);
          break;

        case "Tab":
          // Allow natural tab behavior but close menu
          closeMenu();
          break;
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeMenu, MENU_ITEMS_COUNT]);

  // Focus the appropriate menu item when focusedIndex changes
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && menuItemsRef.current[focusedIndex]) {
      menuItemsRef.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, isOpen]);

  // When menu opens, focus the first item
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow animation to start
      const timer = setTimeout(() => {
        setFocusedIndex(0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!user) return null;

  const displayName = user.displayName?.split(" ")[0] || "Pilot";
  const userEmail = user.email || "";

  const handleToggle = () => {
    if (isOpen) {
      closeMenu();
    } else {
      setIsOpen(true);
    }
  };

  const handleItemClick = () => {
    closeMenu();
  };

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <div ref={menuRef} className="relative">
      {/* ================================================================ */}
      {/* TRIGGER: Enhanced User Button */}
      {/* ================================================================ */}
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className={`
          group flex items-center gap-2.5 px-3 py-2 
          border-2 transition-all duration-200 ease-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
          ${
            isOpen
              ? "border-black bg-yellow-50 shadow-[2px_2px_0px_0px_#000] translate-x-px translate-y-px"
              : "border-transparent hover:border-black hover:bg-yellow-50 hover:-translate-y-px hover:-translate-x-px hover:shadow-[3px_3px_0px_0px_#000]"
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="user-menu"
        aria-label={`Account menu for ${displayName}`}
      >
        {/* Avatar with subtle scale on hover */}
        <motion.div
          className="relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <NeoAvatar name={user.displayName || user.email} />
        </motion.div>

        {/* User name - hidden on mobile */}
        <span className="font-bold uppercase text-sm tracking-wide hidden sm:block text-black">
          {displayName}
        </span>

        {/* Chevron with rotation animation */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <ChevronDown className="w-4 h-4 text-black" />
        </motion.div>
      </button>

      {/* ================================================================ */}
      {/* DROPDOWN MENU */}
      {/* ================================================================ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="user-menu"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              absolute top-full right-0 mt-2 w-72
              bg-white border-2 border-black shadow-[6px_6px_0px_0px_#000] 
              z-50 overflow-hidden
            "
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
          >
            {/* User Info Header */}
            <motion.div
              variants={itemVariants}
              className="px-4 py-3 bg-neutral-50 border-b-2 border-black flex items-center gap-3"
            >
              <NeoAvatar name={user.displayName || user.email} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-black truncate">
                  {user.displayName || displayName}
                </p>
                {userEmail && (
                  <p className="text-[10px] text-neutral-500 truncate">
                    {userEmail}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Primary Actions */}
            <MenuSection className="py-1">
              <MenuItem
                href="/app"
                icon={<Rocket className="w-4 h-4" />}
                label="Launch Web App"
                description="Access the full dashboard"
                variant="primary"
                onClick={handleItemClick}
                isFocused={focusedIndex === 0}
                onFocus={() => setFocusedIndex(0)}
              />
            </MenuSection>

            {/* Legal Section */}
            <MenuSection
              title="Legal"
              className="py-1 border-t border-neutral-200"
            >
              <MenuItem
                href="/privacy"
                icon={<Shield className="w-4 h-4" />}
                label="Privacy Policy"
                onClick={handleItemClick}
                isFocused={focusedIndex === 1}
                onFocus={() => setFocusedIndex(1)}
              />
              <MenuItem
                href="/terms"
                icon={<Scale className="w-4 h-4" />}
                label="Terms of Service"
                onClick={handleItemClick}
                isFocused={focusedIndex === 2}
                onFocus={() => setFocusedIndex(2)}
              />
            </MenuSection>

            {/* Logout Footer - Destructive Action Last */}
            <MenuSection className="border-t-2 border-black bg-neutral-50">
              <MenuItem
                onClick={handleLogout}
                icon={<LogOut className="w-4 h-4" />}
                label="Sign Out"
                variant="destructive"
                isFocused={focusedIndex === 3}
                onFocus={() => setFocusedIndex(3)}
              />
            </MenuSection>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
