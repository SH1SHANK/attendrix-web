"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useDownload, DownloadState } from "@/hooks/useDownload";

interface DownloadContextType {
  state: DownloadState;
  startDownload: (url: string, filename: string, totalSize?: number) => void;
  pauseDownload: () => void;
  resumeDownload: () => void;
  cancelDownload: () => void;
  resetDownload: () => void;
  isDownloading: boolean;
  isPaused: boolean;
}

const DownloadContext = createContext<DownloadContextType | undefined>(
  undefined,
);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const { state, download, pause, resume, cancel, reset } = useDownload();

  const isDownloading =
    state.status === "preparing" || state.status === "downloading";
  const isPaused = state.status === "paused";

  return (
    <DownloadContext.Provider
      value={{
        state,
        startDownload: download,
        pauseDownload: pause,
        resumeDownload: resume,
        cancelDownload: cancel,
        resetDownload: reset,
        isDownloading,
        isPaused,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownloadContext() {
  const context = useContext(DownloadContext);
  if (context === undefined) {
    throw new Error(
      "useDownloadContext must be used within a DownloadProvider",
    );
  }
  return context;
}
