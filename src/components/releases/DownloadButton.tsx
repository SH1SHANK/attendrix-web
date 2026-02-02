"use client";

import { useDownloadContext } from "@/context/DownloadContext";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  url: string;
  filename: string;
  size: string;
  className?: string;
  isHero?: boolean;
}

export function DownloadButton({
  url,
  filename,
  size,
  className,
  isHero = false,
}: DownloadButtonProps) {
  const { startDownload, state } = useDownloadContext();

  // If *this* specific file is downloading, we could show logic here,
  // but for global "single download at a time" simplicity,
  // we can check if *any* download is active or if *this* one is.
  // For now, let's keep it simple: button triggers start. Modal handles progress.
  const handleClick = () => {
    startDownload(url, filename);
  };

  return (
    <button
      onClick={handleClick}
      disabled={state.status === "downloading" || state.status === "preparing"}
      className={cn(
        "flex items-center justify-center gap-2 w-full py-4 font-bold uppercase tracking-wider border-2 border-black transition-all",
        // Neo-brutalist Shadow & Interaction
        "shadow-[4px_4px_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_#000]",
        // Colors
        isHero
          ? "bg-[#FF4F4F] text-white hover:bg-[#ff3333]"
          : "bg-white text-black hover:bg-neutral-50",
        // Disabled state
        (state.status === "downloading" || state.status === "preparing") &&
          "opacity-50 cursor-not-allowed shadow-none translate-x-0.5 translate-y-0.5",
        className,
      )}
    >
      {state.status === "preparing" && state.filename === filename ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Preparing...
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          Download APK ({size})
        </>
      )}
    </button>
  );
}
