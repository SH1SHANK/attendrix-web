"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, LogOut, History } from "lucide-react";
// import { cn } from "@/lib/utils"; // Removed unused cn

// Define the root tabs where we show the specific title or logo instead of a back button
const ROOT_TABS = ["/app", "/app/ledger", "/app/profile", "/app/calendar"];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // Determine if we are on a root tab
  const isRootTab = ROOT_TABS.includes(pathname);

  // Determine Page Title
  let title = "Attendrix";
  if (pathname.includes("/ledger")) title = "Subject Ledger";
  else if (pathname.includes("/profile")) title = "My Profile";
  else if (pathname.includes("/calendar")) title = "Calendar";
  else if (pathname === "/app") title = "Dashboard";

  return (
    <header className="sticky top-0 z-40 w-full bg-[#fffdf5]/80 backdrop-blur-md border-b-2 border-black transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* LEFT: Navigation Action */}
        <div className="flex-1 flex items-center justify-start">
          {isRootTab ? (
            // Option A: Root Tab -> Show Mini Brand or nothing (User request said "AttendrixLite Logo" linking to /)
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-[#FFD02F] border-2 border-black flex items-center justify-center shadow-[1px_1px_0_#000] group-hover:translate-x-px group-hover:translate-y-px group-hover:shadow-none transition-all">
                <span className="font-mono font-bold text-xs text-black">
                  A
                </span>
              </div>
              <div className="flex flex-col gap-0 leading-none">
                <span className="hidden sm:block font-black text-sm tracking-tight">
                  ATTENDRIXWEB
                </span>
              </div>
              <div className="hidden md:flex items-center border border-black bg-rose-500 text-white px-1 py-0.5 shadow-[1px_1px_0_#000]">
                <span className="text-[9px] font-bold font-mono leading-none uppercase">
                  ALPHA-PREVIEW
                </span>
              </div>
            </Link>
          ) : (
            // Option B: Sub-Page -> Show Back Button
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-none hover:bg-black/5 active:translate-y-px transition-colors group"
              aria-label="Go Back"
            >
              <div className="flex items-center gap-1 font-bold text-sm uppercase">
                <ChevronLeft className="w-5 h-5 group-active:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back</span>
              </div>
            </button>
          )}
        </div>

        {/* CENTER: Context Title */}
        <div className="flex-1 flex items-center justify-center">
          <h1 className="font-display font-bold text-lg md:text-xl uppercase tracking-tight text-center truncate">
            {title}
          </h1>
        </div>

        {/* RIGHT: Exit / Home */}
        <div className="flex-1 flex items-center justify-end gap-1">
          <Link
            href="/app/changelog"
            className="p-2 text-neutral-400 hover:text-black transition-colors"
            title="System Logs"
          >
            <History className="w-5 h-5" />
          </Link>
          <Link
            href="/"
            className="p-2 -mr-2 text-neutral-500 hover:text-black transition-colors flex items-center gap-2 group"
            title="Exit App"
          >
            <span className="hidden sm:inline font-mono text-xs font-bold uppercase">
              Exit
            </span>
            <LogOut className="w-5 h-5 group-hover:translate-x-px transition-transform" />
          </Link>
        </div>
      </div>
    </header>
  );
}
