"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { NeoAvatar } from "@/components/ui/NeoAvatar";
import {
  BookOpen,
  Bug,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  Cookie,
  LayoutDashboard,
  LifeBuoy,
  Lightbulb,
  Rocket,
  Shield,
  Scale,
  LogOut,
  ExternalLink,
  User,
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
  itemRef?: React.Ref<HTMLAnchorElement | HTMLButtonElement>;
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
  itemRef,
}: MenuItemProps) {
  const reduceMotion = useReducedMotion() ?? false;
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
      <motion.div
        variants={itemVariants}
        whileHover={reduceMotion ? undefined : { x: 2 }}
        whileTap={reduceMotion ? undefined : { x: 0 }}
      >
        <Link
          href={href}
          onClick={onClick}
          onFocus={onFocus}
          className={`${baseClasses} ${variantClasses[variant]}`}
          role="menuitem"
          tabIndex={isFocused ? 0 : -1}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          ref={itemRef as React.Ref<HTMLAnchorElement>}
        >
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={itemVariants}
      whileHover={reduceMotion ? undefined : { x: 2 }}
      whileTap={reduceMotion ? undefined : { x: 0 }}
    >
      <button
        onClick={onClick}
        onFocus={onFocus}
        className={`${baseClasses} ${variantClasses[variant]}`}
        role="menuitem"
        tabIndex={isFocused ? 0 : -1}
        ref={itemRef as React.Ref<HTMLButtonElement>}
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
  const reduceMotion = useReducedMotion() ?? false;
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuItemsRef = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>(
    [],
  );

  const primaryItems = [
    {
      key: "dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      label: "Dashboard",
      description: "Home base overview",
      variant: "primary" as const,
    },
    {
      key: "attendance",
      href: "/attendance",
      icon: <CalendarCheck className="w-4 h-4" />,
      label: "Attendance",
      description: "Track subject-wise status",
    },
    {
      key: "classes",
      href: "/classes",
      icon: <Rocket className="w-4 h-4" />,
      label: "Classes",
      description: "Today + upcoming schedule",
    },
    {
      key: "tasks",
      href: "/tasks",
      icon: <ClipboardList className="w-4 h-4" />,
      label: "Assignments & Exams",
      description: "Deadlines and next-up",
    },
    {
      key: "resources",
      href: "/resources",
      icon: <BookOpen className="w-4 h-4" />,
      label: "Study Materials",
      description: "Drive-linked course library",
    },
  ];

  const accountItems = [
    {
      key: "profile",
      href: "/profile",
      icon: <User className="w-4 h-4" />,
      label: "Profile",
      description: "Settings and exports",
    },
    {
      key: "support",
      href: "/support/contact",
      icon: <LifeBuoy className="w-4 h-4" />,
      label: "Support",
      description: "Get help fast",
    },
  ];

  const feedbackItems = [
    {
      key: "feature",
      href: "/support/feature",
      icon: <Lightbulb className="w-4 h-4" />,
      label: "Request Feature",
      description: "Shape the roadmap",
    },
    {
      key: "bug",
      href: "/support/bug",
      icon: <Bug className="w-4 h-4" />,
      label: "Report Bug",
      description: "Help us fix issues",
    },
  ];

  const legalItems = [
    {
      key: "privacy",
      href: "/privacy",
      icon: <Shield className="w-4 h-4" />,
      label: "Privacy Policy",
    },
    {
      key: "terms",
      href: "/terms",
      icon: <Scale className="w-4 h-4" />,
      label: "Terms of Service",
    },
    {
      key: "cookies",
      href: "/cookies",
      icon: <Cookie className="w-4 h-4" />,
      label: "Cookie Policy",
    },
  ];

  const allMenuItems = [
    ...primaryItems,
    ...accountItems,
    ...feedbackItems,
    ...legalItems,
    { key: "logout" },
  ];

  const MENU_ITEMS_COUNT = allMenuItems.length;

  // Close menu and return focus to trigger
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Guard against null ref to prevent "contains on null" error
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
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
        id="user-menu-button"
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
            variants={reduceMotion ? undefined : dropdownVariants}
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? undefined : "visible"}
            exit={reduceMotion ? undefined : "exit"}
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
            <MenuSection className="py-1" title="Academics">
              {primaryItems.map((item, index) => {
                const absoluteIndex = index;
                return (
                  <MenuItem
                    key={item.key}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    variant={item.variant}
                    onClick={handleItemClick}
                    isFocused={focusedIndex === absoluteIndex}
                    onFocus={() => setFocusedIndex(absoluteIndex)}
                    itemRef={(el) => {
                      menuItemsRef.current[absoluteIndex] = el;
                    }}
                  />
                );
              })}
            </MenuSection>

            <MenuSection title="Account" className="py-1 border-t border-neutral-200">
              {accountItems.map((item, index) => {
                const absoluteIndex = primaryItems.length + index;
                return (
                  <MenuItem
                    key={item.key}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    onClick={handleItemClick}
                    isFocused={focusedIndex === absoluteIndex}
                    onFocus={() => setFocusedIndex(absoluteIndex)}
                    itemRef={(el) => {
                      menuItemsRef.current[absoluteIndex] = el;
                    }}
                  />
                );
              })}
            </MenuSection>

            <MenuSection title="Feedback" className="py-1 border-t border-neutral-200">
              {feedbackItems.map((item, index) => {
                const absoluteIndex =
                  primaryItems.length + accountItems.length + index;
                return (
                  <MenuItem
                    key={item.key}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    onClick={handleItemClick}
                    isFocused={focusedIndex === absoluteIndex}
                    onFocus={() => setFocusedIndex(absoluteIndex)}
                    itemRef={(el) => {
                      menuItemsRef.current[absoluteIndex] = el;
                    }}
                  />
                );
              })}
            </MenuSection>

            <MenuSection
              title="Legal"
              className="py-1 border-t border-neutral-200"
            >
              {legalItems.map((item, index) => {
                const absoluteIndex =
                  primaryItems.length +
                  accountItems.length +
                  feedbackItems.length +
                  index;
                return (
                  <MenuItem
                    key={item.key}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    onClick={handleItemClick}
                    isFocused={focusedIndex === absoluteIndex}
                    onFocus={() => setFocusedIndex(absoluteIndex)}
                    itemRef={(el) => {
                      menuItemsRef.current[absoluteIndex] = el;
                    }}
                  />
                );
              })}
            </MenuSection>

            {/* Logout Footer - Destructive Action Last */}
            <MenuSection className="border-t-2 border-black bg-neutral-50">
              <MenuItem
                onClick={handleLogout}
                icon={<LogOut className="w-4 h-4" />}
                label="Sign Out"
                variant="destructive"
                isFocused={focusedIndex === MENU_ITEMS_COUNT - 1}
                onFocus={() => setFocusedIndex(MENU_ITEMS_COUNT - 1)}
                itemRef={(el) => {
                  menuItemsRef.current[MENU_ITEMS_COUNT - 1] = el;
                }}
              />
            </MenuSection>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
