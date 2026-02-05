"use client";

import Link from "next/link";
import { Menu } from "@/components/ui/Menu";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { BookOpen, Home, LogOut, Menu as MenuIcon } from "lucide-react";

type DashboardHeaderMenuProps = {
  className?: string;
};

export function DashboardHeaderMenu({ className }: DashboardHeaderMenuProps) {
  const { logout } = useAuth();

  const menuItemClass =
    "flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100";

  return (
    <div className={cn("relative", className)}>
      <Menu>
        <Menu.Trigger asChild>
          <button
            type="button"
            aria-label="Open menu"
            className={
              "h-10 w-10 border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0_#0a0a0a] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0a0a0a] hover:bg-yellow-50 active:translate-y-0 active:shadow-[2px_2px_0_#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            }
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </Menu.Trigger>
        <Menu.Content
          align="start"
          sideOffset={10}
          className="border-2 border-black bg-white shadow-[4px_4px_0_#0a0a0a] min-w-[180px] duration-200 ease-out motion-reduce:animate-none"
        >
          <Menu.Item asChild className={menuItemClass}>
            <Link href="/resources">
              <BookOpen className="h-4 w-4" />
              Study Resources
            </Link>
          </Menu.Item>
          <Menu.Item
            className={cn(
              menuItemClass,
              "text-red-600 hover:bg-red-50 focus:bg-red-50",
            )}
            onSelect={async () => {
              await logout();
            }}
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Menu.Item>
          <Menu.Item asChild className={menuItemClass}>
            <Link href="/">
              <Home className="h-4 w-4" />
              Head Back to Home
            </Link>
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </div>
  );
}
