"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-50 relative font-sans text-black">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#00000026_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-50" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-lg bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000] p-12 text-center">
        {/* Floating Icon */}
        <div className="mb-6 flex justify-center">
          <TriangleAlert className="w-24 h-24 text-black stroke-[1.5]" />
        </div>

        {/* Error Code */}
        <h1 className="text-8xl font-black text-[#FFD02F] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] select-none mb-2 tracking-tighter">
          500
        </h1>

        {/* Message */}
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
          System Malfunction
        </h2>
        <p className="text-neutral-600 font-medium text-lg leading-snug">
          Critical failure detected. Our engineers have been notified.
        </p>

        {/* Actions */}
        <div className="mt-10">
          <Link
            href="/dashboard"
            className="block w-full bg-black text-[#FFD02F] font-black uppercase py-4 border-2 border-black hover:bg-neutral-800 transition-colors"
          >
            Return to Dashboard
          </Link>

          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 w-full bg-white text-black font-bold uppercase py-4 border-2 border-black border-t-0 hover:bg-neutral-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
