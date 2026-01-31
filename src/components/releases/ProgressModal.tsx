"use client";

import { useDownloadContext } from "@/context/DownloadContext";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { InstallationGuide } from "./InstallationGuide";
import { TroubleshootingPanel } from "./TroubleshootingPanel";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatTime(seconds: number) {
  if (!seconds || !isFinite(seconds)) return "--";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export function ProgressModal() {
  const {
    state,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    resetDownload,
    isPaused,
  } = useDownloadContext();
  const [isOpen, setIsOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  useEffect(() => {
    // Always defer setState to avoid synchronous updates
    let t: ReturnType<typeof setTimeout> | undefined;
    if (state.status !== "idle") {
      t = setTimeout(() => setIsOpen(true), 0);
    } else {
      t = setTimeout(() => setIsOpen(false), 0);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [state.status]);

  // Auto-show guide on completion (deferred)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (state.status === "completed") {
      t = setTimeout(() => setShowGuide(true), 0);
    } else {
      t = setTimeout(() => setShowGuide(false), 0);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [state.status]);

  const handleClose = () => {
    if (
      state.status === "downloading" ||
      state.status === "preparing" ||
      state.status === "paused"
    ) {
      if (confirm("Cancel current download?")) {
        cancelDownload();
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
      resetDownload();
      setShowGuide(false);
    }
  };

  // Determine accent color based on status
  const getAccentColor = () => {
    switch (state.status) {
      case "error":
      case "cancelled":
        return "bg-red-500";
      case "completed":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      default:
        return "bg-[#FFD02F]"; // yellow default
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-white border-4 border-black shadow-[8px_8px_0_#000] relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-4 border-black bg-neutral-100">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-3 h-3 border border-black shadow-[2px_2px_0_#000]",
                    getAccentColor(),
                    (state.status === "downloading" ||
                      state.status === "paused") &&
                      "animate-pulse",
                  )}
                />
                <h3 className="font-display font-black text-xl uppercase tracking-tighter">
                  {state.status === "completed"
                    ? "Download Ready"
                    : state.status === "error"
                      ? "Download Failed"
                      : state.status === "paused"
                        ? "Download Paused"
                        : "Downloading File..."}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* File Info */}
              <div className="mb-8">
                <p className="font-mono text-sm text-neutral-500 mb-1 uppercase tracking-wider">
                  Target File
                </p>
                <div className="font-bold text-lg break-all border-b-2 border-black/10 pb-2">
                  {state.filename || "attendrix-release.apk"}
                </div>
              </div>

              {/* Progress Section */}
              {state.status !== "completed" &&
                state.status !== "error" &&
                state.status !== "cancelled" && (
                  <div className="space-y-4 mb-8">
                    {/* Progress Bar Container */}
                    <div className="h-8 w-full border-2 border-black p-1 bg-white shadow-[4px_4px_0_#000]">
                      <motion.div
                        className="h-full bg-black relative overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: `${state.progress}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 100,
                          damping: 20,
                        }}
                      >
                        {/* Stripe pattern overlay */}
                        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#fff_10px,#fff_20px)]" />
                      </motion.div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-4 font-mono text-sm border-2 border-black p-4 bg-neutral-50">
                      <div>
                        <span className="block text-neutral-500 text-[10px] uppercase font-bold mb-1">
                          Size
                        </span>
                        <span className="font-bold">
                          {formatBytes(state.downloadedBytes)} /{" "}
                          {formatBytes(state.totalBytes)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-neutral-500 text-[10px] uppercase font-bold mb-1">
                          Speed
                        </span>
                        <span className="font-bold">
                          {formatBytes(state.speed)}/s
                        </span>
                      </div>
                      <div>
                        <span className="block text-neutral-500 text-[10px] uppercase font-bold mb-1">
                          Remaining
                        </span>
                        <span className="font-bold">
                          {formatTime(state.timeRemaining)}
                        </span>
                      </div>
                    </div>

                    {/* Chunk Progress */}
                    {state.totalChunks > 0 && (
                      <div className="font-mono text-xs text-neutral-500 text-center">
                        Chunks: {state.chunksCompleted} / {state.totalChunks}{" "}
                        completed
                      </div>
                    )}
                  </div>
                )}

              {/* Completion State */}
              {state.status === "completed" && (
                <div className="bg-green-100 border-2 border-black p-6 mb-8 shadow-[4px_4px_0_#000]">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-8 h-8 text-black shrink-0" />
                    <div>
                      <h4 className="font-black text-xl uppercase mb-2">
                        Successfully Downloaded
                      </h4>
                      <p className="font-medium">
                        You can now install the application. Follow the guide
                        below or open the file from your notifications.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {state.status === "error" && (
                <div className="bg-red-100 border-2 border-black p-6 mb-8 shadow-[4px_4px_0_#000]">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-8 h-8 text-black shrink-0" />
                    <div>
                      <h4 className="font-black text-xl uppercase mb-2">
                        Download Error
                      </h4>
                      <p className="font-medium font-mono text-sm mb-4">
                        {state.error?.message ||
                          "Unknown network error occured"}
                      </p>
                      <button
                        onClick={() =>
                          setShowTroubleshooting(!showTroubleshooting)
                        }
                        className="text-sm font-bold underline hover:no-underline"
                      >
                        View Troubleshooting Guide
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Installation Guide Toggle */}
              {(state.status === "completed" || showGuide) && (
                <div className="mt-8 border-t-4 border-black pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display font-black text-2xl uppercase">
                      Installation Guide
                    </h3>
                  </div>
                  <InstallationGuide />
                </div>
              )}

              {/* Troubleshooting Toggle (Visible on error or demand) */}
              {(showTroubleshooting || state.status === "error") && (
                <div className="mt-8 border-t-4 border-black pt-8">
                  <h3 className="font-display font-black text-2xl uppercase mb-6">
                    Troubleshooting
                  </h3>
                  <TroubleshootingPanel />
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t-4 border-black p-4 bg-neutral-50 flex justify-between items-center z-10">
              <button
                onClick={() => setShowTroubleshooting((prev) => !prev)}
                className="text-xs font-bold uppercase underline hover:no-underline"
              >
                Having Trouble?
              </button>

              {state.status === "downloading" || state.status === "paused" ? (
                <div className="flex gap-2">
                  {isPaused ? (
                    <button
                      onClick={resumeDownload}
                      className="px-6 py-2 border-2 border-black bg-green-400 font-bold uppercase shadow-[4px_4px_0_#000] hover:bg-green-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={pauseDownload}
                      className="px-6 py-2 border-2 border-black bg-yellow-400 font-bold uppercase shadow-[4px_4px_0_#000] hover:bg-yellow-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      Pause
                    </button>
                  )}
                  <button
                    onClick={cancelDownload}
                    className="px-6 py-2 border-2 border-black bg-white font-bold uppercase shadow-[4px_4px_0_#000] hover:bg-neutral-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleClose}
                  className="px-6 py-2 border-2 border-black bg-black text-white font-bold uppercase shadow-[4px_4px_0_#000] hover:bg-neutral-800 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
