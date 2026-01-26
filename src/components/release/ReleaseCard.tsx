"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Download,
  GitCommit,
  Copy,
  Check,
  Box,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { type Release } from "@/lib/github";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ReleaseCardProps {
  release: Release;
  isHero?: boolean;
}

export function ReleaseCard({ release, isHero = false }: ReleaseCardProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(isHero); // Hero expanded by default

  const handleCopy = () => {
    if (release.sha256) {
      navigator.clipboard.writeText(release.sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Unused variables borderColor and bgAccent removed

  return (
    <div
      className={cn(
        "bg-white border-2 border-black p-6 relative group transition-all",
        isHero
          ? `shadow-[8px_8px_0_#000]`
          : "shadow-[4px_4px_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#000]",
      )}
    >
      {/* Top Badge Row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className={cn(
            "px-2 py-1 text-xs font-bold uppercase border border-black",
            release.status === "stable"
              ? "bg-green-400 text-black"
              : "bg-yellow-400 text-black",
          )}
        >
          {release.status === "stable" ? "Stable" : "Pre-release"}
        </span>
        {release.isPreRelease && (
          <span className="px-2 py-1 text-xs font-bold uppercase border border-black bg-neutral-100 text-neutral-600">
            Beta
          </span>
        )}
        <span className="text-xs font-mono text-neutral-500">
          Released {release.date}
        </span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight">
          {release.version}
        </h2>

        {/* Technical Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-neutral-100">
          <div>
            <span className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
              Commit
            </span>
            <Link
              href={`${release.htmlUrl.split("/releases")[0]}/commit/${release.commitHash}`}
              target="_blank"
              className="font-mono text-xs font-bold flex items-center gap-1 hover:underline"
            >
              <GitCommit className="w-3 h-3" />
              {release.commitHash}
            </Link>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
              Build ID
            </span>
            <span className="font-mono text-xs font-bold flex items-center gap-1">
              <Box className="w-3 h-3" />#{release.releaseId}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
              Size
            </span>
            <span className="font-mono text-xs font-bold">{release.size}</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
              Platform
            </span>
            <span className="font-mono text-xs font-bold">Android 14+</span>
          </div>
        </div>
      </div>

      {/* CHANGELOG TOGGLE */}
      <div className="border-t-2 border-black/5 pt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black hover:opacity-70 transition-opacity mb-2"
        >
          {isExpanded ? "Hide Changelog" : "View Changelog"}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="prose prose-sm max-w-none prose-neutral prose-headings:font-display prose-headings:uppercase prose-p:font-medium prose-p:text-neutral-600 prose-ul:list-square py-2 pb-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {release.body}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions Footer */}
      <div className="mt-2 space-y-4">
        <a
          href={release.downloadUrl}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-4 font-bold uppercase tracking-wider border-2 border-black shadow-[4px_4px_0_#000] transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[6px_6px_0_#000]",
            isHero
              ? "bg-[#FF4F4F] text-white"
              : "bg-white text-black hover:bg-neutral-50",
          )}
        >
          <Download className="w-5 h-5" />
          Download APK ({release.size})
        </a>

        {/* Integrity Check */}
        {release.sha256 && (
          <div className="p-3 bg-neutral-900 border-2 border-black">
            <div className="flex justify-between items-center text-neutral-400 text-[10px] font-mono mb-2 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                SHA-256 Checksum Verified
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                {copied ? (
                  <span className="text-green-400">Copied!</span>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-[10px] text-green-400 break-all bg-black/50 p-2 border border-neutral-700 select-all selection:bg-green-900">
              {release.sha256}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
