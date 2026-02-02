"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { AuthStatus, AUTH_MESSAGES } from "@/types/auth-state";

interface AuthLoadingScreenProps {
  status: AuthStatus;
  message?: string;
  isVisible: boolean;
}

/**
 * Loading screen displayed during authentication flow
 * Replaces the login form with smooth animations and clear status messaging
 */
const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  status,
  message,
  isVisible,
}) => {
  const displayMessage = message || AUTH_MESSAGES[status];

  const getIcon = () => {
    switch (status) {
      case "authenticating":
        return <Loader2 className="w-12 h-12 text-black animate-spin" />;
      case "authenticated":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </motion.div>
        );
      case "redirecting":
        return (
          <motion.div
            animate={{ x: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <ArrowRight className="w-12 h-12 text-black" />
          </motion.div>
        );
      default:
        return <Loader2 className="w-12 h-12 text-black animate-spin" />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="auth-loading"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#FFD02F] border-b-2 border-black p-6 md:p-8 text-center pt-8 md:pt-10">
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black mb-1">
              Please Wait
            </h1>
            <p className="text-neutral-900 font-bold text-base md:text-lg leading-tight">
              We&apos;re getting things ready...
            </p>
          </div>

          {/* Loading Content */}
          <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-70">
            {/* Icon Container */}
            <motion.div
              className="mb-6 p-4 bg-neutral-50 border-2 border-black"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {getIcon()}
            </motion.div>

            {/* Status Message */}
            <motion.p
              key={displayMessage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-black uppercase tracking-wide text-center"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {displayMessage}
            </motion.p>

            {/* Progress Dots */}
            <div className="flex gap-2 mt-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-black rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-neutral-100 border-t-2 border-black p-4 text-center">
            <p className="font-bold text-xs md:text-sm text-neutral-500">
              This should only take a moment
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthLoadingScreen;
