"use client";

import { useId } from "react";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { NeoBrutalButton } from "@/components/ui/NeoBrutalButton";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { cn } from "@/lib/utils";
import type { UsernameStatus } from "@/context/OnboardingContext";

interface Props {
  username: string;
  status: UsernameStatus;
  errorMessage: string | null;
  onUsernameChange: (value: string) => void;
  onContinue: () => void;
  isSaving: boolean;
}

export default function OnboardingStepUsername({
  username,
  status,
  errorMessage,
  onUsernameChange,
  onContinue,
  isSaving,
}: Props) {
  const inputId = useId();
  const helpId = useId();

  const showSuccess = status === "available";
  const showError =
    status === "invalid" || status === "reserved" || status === "taken";
  const isChecking = status === "checking";

  const inputStateClass = showError
    ? "bg-red-50 ring-2 ring-red-400"
    : showSuccess
      ? "bg-green-50 ring-2 ring-green-400"
      : isChecking
        ? "bg-blue-50 ring-2 ring-blue-400"
        : "bg-white";

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-2 sm:space-y-3">
      {/* Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="space-y-1 sm:space-y-2"
      >
        <h2 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-black text-balance">
          Username
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-neutral-600 bg-neutral-50 border-2 border-black p-2 sm:p-3">
          Create a unique username that represents your identity on Attendrix
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <label
          htmlFor={inputId}
          className="text-xs sm:text-sm font-bold uppercase tracking-wide text-black"
        >
          Username
        </label>

        <div className="relative">
          <input
            id={inputId}
            type="text"
            name="username"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            placeholder="your_awesome_username…"
            autoComplete="username"
            spellCheck={false}
            aria-describedby={helpId}
            aria-invalid={showError}
            className={cn(
              "w-full h-10 sm:h-12 border-2 sm:border-3 border-black p-2 sm:p-3 pr-14 font-bold text-sm sm:text-base outline-none placeholder:text-neutral-500 shadow-[3px_3px_0_#0a0a0a] hover:shadow-[4px_4px_0_#0a0a0a] focus-visible:shadow-[6px_6px_0_#0a0a0a] focus-visible:bg-neutral-50 transition-shadow transition-colors duration-300 touch-manipulation",
              inputStateClass,
            )}
          />
          {/* Status Indicator */}
          <AnimatePresence>
            {isChecking && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-400 border-2 border-black p-2 shadow-[4px_4px_0_#0a0a0a]"
              >
                <Loader2
                  className="w-6 h-6 animate-spin text-white"
                  aria-hidden="true"
                />
              </motion.div>
            )}
            {showSuccess && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-400 border-2 border-black p-2 shadow-[4px_4px_0_#0a0a0a]"
              >
                <CheckCircle2 className="w-6 h-6 text-white" aria-hidden="true" />
              </motion.div>
            )}
            {showError && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-400 border-2 border-black p-2 shadow-[4px_4px_0_#0a0a0a]"
              >
                <AlertTriangle className="w-6 h-6 text-white" aria-hidden="true" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            id={helpId}
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wide p-2 sm:p-3 border-2 border-black"
          >
            {isChecking && (
              <div className="flex items-center gap-1 sm:gap-2 bg-neutral-50 p-2 w-full">
                <Loader2
                  className="w-4 h-4 animate-spin text-neutral-600 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-neutral-600 text-xs sm:text-sm">Checking availability…</span>
              </div>
            )}
            {showSuccess && (
              <div className="flex items-center gap-1 sm:gap-2 bg-neutral-50 p-2 w-full">
                <CheckCircle2
                  className="w-4 h-4 text-neutral-600 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-neutral-600 text-xs sm:text-sm">Username is available</span>
              </div>
            )}
            {showError && (
              <div className="flex items-center gap-1 sm:gap-2 bg-neutral-50 p-2 w-full">
                <AlertTriangle
                  className="w-4 h-4 text-neutral-600 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-neutral-600 text-xs sm:text-sm">
                  {errorMessage || "This username is not available"}
                </span>
              </div>
            )}
            {!username && (
              <div className="flex items-center gap-1 sm:gap-2 bg-neutral-50 p-2 w-full">
                <span className="text-neutral-500 text-xs sm:text-sm">
                  3-20 characters: letters, numbers, underscores only
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Rules Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="border-2 border-black bg-neutral-50 p-2 sm:p-3"
      >
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-black mb-2">
          Requirements
        </p>
        <ul className="space-y-1 text-[10px] sm:text-xs font-semibold text-neutral-700">
          {[
            "3-20 characters long",
            "Letters, numbers, and underscores only",
            "Must be unique",
            "Cannot be changed later",
          ].map((rule, idx) => (
            <motion.li
              key={idx}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              className="flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 bg-black" />
              {rule}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Action Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end pt-2 sm:pt-3 border-t-2 sm:border-t-3 border-black gap-2"
      >
        <NeoBrutalButton
          variant="primary"
          size="sm"
          onClick={onContinue}
          disabled={isSaving || status !== "available" || Boolean(errorMessage)}
          className="min-w-[140px] touch-manipulation"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin mr-1" aria-hidden="true" />
              Saving…
            </>
          ) : (
            <>Save Username →</>
          )}
        </NeoBrutalButton>
      </motion.div>
      </div>
    </MotionConfig>
  );
}
