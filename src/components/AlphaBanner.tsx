"use client";

import { usePathname } from "next/navigation";
import { AlertTriangle, Github, FileText } from "lucide-react";
import Link from "next/link";
import { WEB_STAGE } from "@/lib/version";

const ISSUE_TEMPLATE_URL =
  "https://github.com/SH1SHANK/attendrixweb/issues/new?labels=bug,alpha&template=bug_report.md&title=[ALPHA]+Bug+Report:";

export default function AlphaBanner() {
  const pathname = usePathname();

  // Show only on /app pages
  if (!pathname.startsWith("/app")) return null;

  return (
    <div className="bg-rose-100 border-b-2 border-rose-500 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        {/* Warning Message */}
        <div className="flex items-center gap-3 text-rose-900">
          <div className="p-1.5 bg-rose-500 border border-black shadow-[2px_2px_0_#9f1239] shrink-0">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold uppercase tracking-wide mr-2">
              {WEB_STAGE}
            </span>
            <span className="font-medium hidden md:inline">
              System instability and data desyncs are expected.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <a
            href={ISSUE_TEMPLATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-rose-900 text-rose-900 font-bold uppercase text-xs hover:bg-rose-50 shadow-[2px_2px_0_#9f1239] active:translate-x-px active:translate-y-px active:shadow-none transition-all"
          >
            <Github className="w-3 h-3" />
            Report Bug
          </a>
          <Link
            href="/app/changelog"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 bg-rose-900 text-white border border-black font-bold uppercase text-xs hover:bg-rose-800 shadow-[2px_2px_0_#000] active:translate-x-px active:translate-y-px active:shadow-none transition-all"
          >
            <FileText className="w-3 h-3" />
            Changelog
          </Link>
        </div>
      </div>

      {/* Striped Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)",
        }}
      />
    </div>
  );
}
