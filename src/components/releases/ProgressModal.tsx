"use client";

import { useDownloadContext } from "@/context/DownloadContext";
import {
  X,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
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

// Circular Progress Ring Component
function CircularProgress({
  progress,
  size = 120,
}: {
  progress: number;
  size?: number;
}) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e5e5"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#000"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          key={progress}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-black font-mono"
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
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

  // Memoize accent color to prevent re-calculations
  const accentColor = useMemo(() => {
    switch (state.status) {
      case "error":
      case "cancelled":
        return "bg-red-500";
      case "completed":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      default:
        return "bg-[#FFD02F]";
    }
  }, [state.status]);

  // Memoize title text
  const modalTitle = useMemo(() => {
    switch (state.status) {
      case "completed":
        return "Download Complete";
      case "error":
        return "Download Failed";
      case "paused":
        return "Download Paused";
      case "cancelled":
        return "Download Cancelled";
      case "browser-download":
        return "Download Started";
      default:
        return "Downloading File...";
    }
  }, [state.status]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-white border-4 border-black shadow-[12px_12px_0_#000] relative overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b-4 border-black bg-neutral-100">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      scale:
                        state.status === "downloading" ||
                        state.status === "paused"
                          ? [1, 1.2, 1]
                          : 1,
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={cn(
                      "w-3 h-3 border border-black shadow-[2px_2px_0_#000]",
                      accentColor,
                    )}
                  />
                  <h3 className="font-display font-black text-xl uppercase tracking-tighter">
                    {modalTitle}
                  </h3>
                </div>
                <motion.button
                  onClick={handleClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black rounded-sm"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </motion.button>
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

                {/* Browser Download Message (GitHub Releases) */}
                {state.status === "browser-download" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="bg-blue-100 border-2 border-black p-6 mb-8 shadow-[4px_4px_0_#000]"
                  >
                    <div className="flex items-start gap-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          damping: 10,
                          delay: 0.1,
                        }}
                        className="w-12 h-12 bg-blue-500 border-2 border-black flex items-center justify-center shrink-0"
                      >
                        <Download className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h4 className="font-black text-lg mb-2 uppercase tracking-tight">
                          Download Started in Browser
                        </h4>
                        <p className="text-sm text-neutral-700 mb-4 leading-relaxed">
                          Your download is now being handled by your
                          browser&apos;s download manager. Check the downloads
                          bar (usually at the bottom of your browser) or your
                          Downloads folder.
                        </p>
                        <div className="bg-white border-2 border-black p-4 mt-4">
                          <p className="font-bold text-xs uppercase mb-2 text-neutral-600">
                            💡 Quick Tip
                          </p>
                          <ul className="text-sm space-y-1 text-neutral-700">
                            <li>
                              • Look for the download progress in your
                              browser&apos;s toolbar
                            </li>
                            <li>
                              • The file will be saved to your default Downloads
                              folder
                            </li>
                            <li>
                              • You can close this dialog - the download will
                              continue
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      onClick={handleClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-6 px-6 py-3 bg-black text-white border-2 border-black font-bold uppercase text-sm shadow-[4px_4px_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                    >
                      Got it!
                    </motion.button>
                  </motion.div>
                )}

                {/* Progress Section */}
                {state.status !== "completed" &&
                  state.status !== "error" &&
                  state.status !== "cancelled" &&
                  state.status !== "browser-download" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6 mb-8"
                    >
                      {/* Circular Progress Ring */}
                      <div className="flex justify-center mb-6">
                        <CircularProgress progress={state.progress} />
                      </div>

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
                          {/* Animated stripe pattern */}
                          <motion.div
                            animate={{ x: [0, 40] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#fff_10px,#fff_20px)]"
                          />
                        </motion.div>
                      </div>

                      {/* Metrics Grid */}
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: { opacity: 0 },
                          visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.1 },
                          },
                        }}
                        className="grid grid-cols-3 gap-4 font-mono text-sm border-2 border-black p-4 bg-neutral-50"
                      >
                        {[
                          {
                            label: "Size",
                            value: `${formatBytes(state.downloadedBytes)} / ${formatBytes(state.totalBytes)}`,
                          },
                          {
                            label: "Speed",
                            value: `${formatBytes(state.speed)}/s`,
                          },
                          {
                            label: "Remaining",
                            value: formatTime(state.timeRemaining),
                          },
                        ].map((metric, idx) => (
                          <motion.div
                            key={idx}
                            variants={{
                              hidden: { opacity: 0, y: 10 },
                              visible: { opacity: 1, y: 0 },
                            }}
                          >
                            <span className="block text-neutral-500 text-[10px] uppercase font-bold mb-1">
                              {metric.label}
                            </span>
                            <motion.span
                              key={metric.value}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="font-bold"
                            >
                              {metric.value}
                            </motion.span>
                          </motion.div>
                        ))}
                      </motion.div>

                      {/* Chunk Progress */}
                      {state.totalChunks > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="font-mono text-xs text-neutral-500 text-center flex items-center justify-center gap-2"
                        >
                          <Download className="w-3 h-3" />
                          Chunks: {state.chunksCompleted} / {state.totalChunks}{" "}
                          completed
                        </motion.div>
                      )}

                      {/* Control Buttons */}
                      <div className="flex gap-3 justify-center mt-6">
                        {!isPaused ? (
                          <motion.button
                            onClick={pauseDownload}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-3 bg-yellow-400 border-2 border-black font-bold uppercase text-sm shadow-[4px_4px_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1 flex items-center gap-2 transition-all"
                          >
                            <Pause className="w-4 h-4" />
                            Pause
                          </motion.button>
                        ) : (
                          <motion.button
                            onClick={resumeDownload}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="px-6 py-3 bg-green-400 border-2 border-black font-bold uppercase text-sm shadow-[4px_4px_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1 flex items-center gap-2 transition-all"
                          >
                            <Play className="w-4 h-4" />
                            Resume
                          </motion.button>
                        )}
                        <motion.button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to cancel this download?",
                              )
                            ) {
                              cancelDownload();
                            }
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-3 bg-white border-2 border-black font-bold uppercase text-sm shadow-[4px_4px_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1 hover:bg-neutral-100 transition-all"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                {/* Completion State */}
                {state.status === "completed" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="bg-green-100 border-2 border-black p-6 mb-8 shadow-[4px_4px_0_#000]"
                  >
                    <div className="flex items-start gap-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.2,
                          type: "spring",
                          stiffness: 200,
                        }}
                      >
                        <CheckCircle2 className="w-8 h-8 text-black shrink-0" />
                      </motion.div>
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
                  </motion.div>
                )}

                {/* Error State */}
                {state.status === "error" && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-100 border-2 border-black p-6 mb-8 shadow-[4px_4px_0_#000]"
                  >
                    <div className="flex items-start gap-4">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <AlertCircle className="w-8 h-8 text-black shrink-0" />
                      </motion.div>
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
                  </motion.div>
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
        </>
      )}
    </AnimatePresence>
  );
}
