"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
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
import { DownloadButton } from "@/components/releases/DownloadButton";
import { QRCodeDownload } from "@/components/release/QRCodeDownload";

interface ReleaseCardProps {
  release: Release;
  isHero?: boolean;
}

export function ReleaseCard({ release, isHero = false }: ReleaseCardProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(isHero); // Hero expanded by default

  // Check if release is new (within 7 days)
  const isNew = () => {
    const releaseDate = new Date(release.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - releaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const handleCopy = () => {
    if (release.sha256) {
      navigator.clipboard.writeText(release.sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Keyboard support for expand/collapse
  const handleToggleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  // Unused variables borderColor and bgAccent removed

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: isHero ? 0 : -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "bg-white border-2 border-black relative group transition-all duration-200 overflow-hidden",
        isHero
          ? `shadow-[8px_8px_0_#000] p-8`
          : "shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] p-6",
      )}
    >
      {/* Status Badge - Absolute positioned in corner */}
      <motion.div
        initial={{ x: 100 }}
        animate={{ x: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="absolute top-0 right-0"
      >
        <span
          className={cn(
            "px-4 py-2 text-xs font-black uppercase border-2 border-black border-t-0 border-r-0 inline-flex items-center gap-2",
            release.status === "stable"
              ? "bg-green-400 text-black"
              : "bg-yellow-400 text-black",
          )}
        >
          {release.status === "stable" ? "✓ Stable" : "⚡ Pre-release"}
          {isNew() && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="ml-1 px-2 py-0.5 bg-red-500 text-white text-[10px] border border-black"
            >
              NEW
            </motion.span>
          )}
        </span>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={cn("mb-6", isHero ? "mt-2" : "mt-10")}
      >
        <div className="flex items-baseline gap-3 mb-3">
          <h2
            className={cn(
              "font-display font-black uppercase tracking-tighter",
              isHero ? "text-5xl md:text-6xl" : "text-3xl md:text-4xl",
            )}
          >
            {release.version}
          </h2>
          <span className="text-sm font-mono text-neutral-400">
            {release.date}
          </span>
        </div>

        {/* Simplified Metadata Row */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
                delayChildren: 0.3,
              },
            },
          }}
          className={cn("flex flex-wrap gap-x-6 gap-y-3", isHero && "pb-4")}
        >
          {[
            {
              label: "Size",
              icon: null,
              content: release.size,
              href: null,
            },
            {
              label: "Platform",
              icon: null,
              content: "Android 14+",
              href: null,
            },
            {
              label: "Commit",
              icon: GitCommit,
              content: release.commitHash,
              href: `${release.htmlUrl.split("/releases")[0]}/commit/${release.commitHash}`,
            },
            {
              label: "Build ID",
              icon: Box,
              content: `#${release.releaseId}`,
              href: null,
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
              className="flex items-center gap-2"
            >
              {item.icon && <item.icon className="w-4 h-4 text-neutral-400" />}
              <div>
                <span className="text-[10px] font-bold uppercase text-neutral-400 block leading-none">
                  {item.label}
                </span>
                {item.href ? (
                  <Link
                    href={item.href}
                    target="_blank"
                    className="font-mono text-sm font-bold hover:underline transition-all hover:text-blue-600 inline-block mt-0.5"
                  >
                    {item.content}
                  </Link>
                ) : (
                  <span className="font-mono text-sm font-bold inline-block mt-0.5">
                    {item.content}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* CHANGELOG TOGGLE */}
      <div className="border-t-2 border-black/5 pt-4">
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          onKeyDown={handleToggleKeyDown}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          aria-expanded={isExpanded}
          aria-controls={`changelog-${release.releaseId}`}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black hover:opacity-70 transition-opacity mb-2 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </motion.div>
          {isExpanded ? "Hide Changelog" : "View Changelog"}
        </motion.button>

        {/* Expandable Content */}
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              id={`changelog-${release.releaseId}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
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
      <div className={cn("space-y-4", isHero ? "mt-8" : "mt-6")}>
        {/* Download Button - Full width, more prominent */}
        <DownloadButton
          url={release.downloadUrl}
          filename={`attendrix-${release.version}.apk`}
          size={release.size}
          isHero={isHero}
        />

        {/* Secondary actions row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <QRCodeDownload
              url={release.downloadUrl}
              version={release.version}
            />
          </div>
        </div>

        {/* Integrity Check */}
        {release.sha256 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="p-3 bg-neutral-900 border-2 border-black"
          >
            <div className="flex justify-between items-center text-neutral-400 text-[10px] font-mono mb-2 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <motion.div
                  animate={{
                    scale: copied ? [1, 1.2, 1] : 1,
                    color: copied ? "#22c55e" : "#10b981",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Check className="w-3 h-3" />
                </motion.div>
                SHA-256 Checksum Verified
              </span>
              <motion.button
                onClick={handleCopy}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Copy checksum"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="text-green-400"
                    >
                      Copied!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
            <div className="font-mono text-[10px] text-green-400 break-all bg-black/50 p-2 border border-neutral-700 select-all selection:bg-green-900">
              {release.sha256}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
