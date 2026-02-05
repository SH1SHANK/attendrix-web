"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  HardDrive,
  Settings,
  Trash2,
} from "lucide-react";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import { useAuth } from "@/context/AuthContext";
import { useStudyMaterialsPreferences } from "@/hooks/useStudyMaterialsPreferences";
import { useOfflineStorageUsage } from "@/hooks/useOfflineStorageUsage";
import { removeCachedFile } from "@/lib/resources/offline-cache";
import {
  hasFolderAccessSupport,
  removeOfflineFolderFile,
  requestOfflineFolderAccess,
} from "@/lib/resources/offline-folder";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CACHE_LIMIT_MIN_MB = 50;
const CACHE_LIMIT_MAX_MB = 2000;
const CACHE_LIMIT_STEP_MB = 10;
const CACHE_LIMIT_DEFAULT_MB = 500;

export default function ResourcesSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    offlineFiles,
    cacheConfig,
    offlineStorageMode,
    updateCacheConfig,
    updateOfflineStorageMode,
    removeOfflineFiles,
  } = useStudyMaterialsPreferences(user?.uid ?? null);
  const cacheLimitMb = cacheConfig.limitMb ?? null;
  const isUnlimited = cacheLimitMb === null;
  const storageUsage = useOfflineStorageUsage(offlineFiles, cacheLimitMb);
  const [showFolderConfirm, setShowFolderConfirm] = useState(false);
  const [folderPending, setFolderPending] = useState(false);
  const [pendingLimit, setPendingLimit] = useState(() => {
    if (cacheLimitMb && Number.isFinite(cacheLimitMb)) {
      return Math.min(
        CACHE_LIMIT_MAX_MB,
        Math.max(CACHE_LIMIT_MIN_MB, Math.round(cacheLimitMb)),
      );
    }
    return CACHE_LIMIT_DEFAULT_MB;
  });
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evictionRef = useRef({ active: false });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (cacheLimitMb === null || !Number.isFinite(cacheLimitMb)) return;
    setPendingLimit(
      Math.min(
        CACHE_LIMIT_MAX_MB,
        Math.max(CACHE_LIMIT_MIN_MB, Math.round(cacheLimitMb)),
      ),
    );
  }, [cacheLimitMb]);

  useEffect(() => {
    if (cacheLimitMb === null) return;
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    updateTimerRef.current = setTimeout(() => {
      updateCacheConfig(pendingLimit);
    }, 250);
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, [cacheLimitMb, pendingLimit, updateCacheConfig]);

  const handleSliderChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setPendingLimit(Number(event.target.value));
    },
    [],
  );

  const handleUnlimitedToggle = useCallback(() => {
    if (cacheLimitMb === null) {
      updateCacheConfig(pendingLimit);
    } else {
      updateCacheConfig(null);
    }
  }, [cacheLimitMb, pendingLimit, updateCacheConfig]);

  const handleStorageModeChange = useCallback(
    (nextMode: "web" | "folder") => {
      if (nextMode === "folder") {
        if (!hasFolderAccessSupport()) {
          toast.error("Dedicated folders are not supported in this browser.");
          return;
        }
        setShowFolderConfirm(true);
        return;
      }
      setShowFolderConfirm(false);
      updateOfflineStorageMode("web");
    },
    [updateOfflineStorageMode],
  );

  const handleConfirmFolderMode = useCallback(async () => {
    if (folderPending) return;
    setFolderPending(true);
    try {
      const handle = await requestOfflineFolderAccess();
      if (!handle) {
        toast.error("Folder access was denied. Staying on web cache.");
        updateOfflineStorageMode("web");
        return;
      }
      updateOfflineStorageMode("folder");
      toast.message("Dedicated folder access enabled.");
      setShowFolderConfirm(false);
    } finally {
      setFolderPending(false);
    }
  }, [folderPending, updateOfflineStorageMode]);

  const handleKeepWebCache = useCallback(() => {
    setShowFolderConfirm(false);
    updateOfflineStorageMode("web");
  }, [updateOfflineStorageMode]);

  const removeOfflineEntry = useCallback(
    async (resourceId: string, fileId?: string) => {
      await removeCachedFile(resourceId);
      if (fileId) {
        await removeOfflineFolderFile(fileId);
      }
    },
    [],
  );

  const handleClearOfflineCache = useCallback(async () => {
    if (Object.keys(offlineFiles).length === 0) {
      toast.message("No offline files to clear.");
      return;
    }
    const entries = Object.entries(offlineFiles);
    for (const [resourceId, meta] of entries) {
      await removeOfflineEntry(resourceId, meta.fileId);
    }
    removeOfflineFiles(entries.map(([resourceId]) => resourceId));
    toast.message("Offline cache cleared.");
  }, [offlineFiles, removeOfflineEntry, removeOfflineFiles]);

  useEffect(() => {
    if (cacheLimitMb === null || !Number.isFinite(cacheLimitMb)) return;
    if (cacheLimitMb <= 0) return;
    if (evictionRef.current.active) return;
    const limitBytes = cacheLimitMb * 1024 * 1024;
    const entries = Object.entries(offlineFiles)
      .map(([resourceId, meta]) => ({
        resourceId,
        meta,
        cachedAt: new Date(meta.cachedAt).getTime() || 0,
      }))
      .sort((a, b) => a.cachedAt - b.cachedAt);
    const total = entries.reduce(
      (sum, entry) => sum + (Number(entry.meta.size) || 0),
      0,
    );
    if (total <= limitBytes) return;

    evictionRef.current.active = true;
    let remaining = total;
    const evictIds: string[] = [];
    const evict = async () => {
      for (const entry of entries) {
        if (remaining <= limitBytes) break;
        remaining -= Number(entry.meta.size) || 0;
        evictIds.push(entry.resourceId);
        await removeOfflineEntry(entry.resourceId, entry.meta.fileId);
      }
      if (evictIds.length > 0) {
        removeOfflineFiles(evictIds);
      }
      evictionRef.current.active = false;
    };
    void evict();
  }, [cacheLimitMb, offlineFiles, removeOfflineEntry, removeOfflineFiles]);

  if (authLoading) {
    return <div className="min-h-screen bg-neutral-50" />;
  }

  if (!user?.uid) {
    return (
      <div className="min-h-screen bg-[#fffdf5] flex items-center justify-center p-4">
        <div className="border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000] max-w-md">
          <h2 className="font-display text-2xl font-black uppercase mb-4">
            Sign In to Manage Settings
          </h2>
          <p className="font-mono text-sm text-neutral-600 mb-6">
            Study Materials is accessible without sign-in, but settings and
            offline cache controls are tied to your account.
          </p>
          <button
            onClick={() => router.push("/auth/signin")}
            className="w-full bg-black text-white font-bold py-3 px-4 uppercase border-2 border-black hover:bg-neutral-800 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 transition-colors duration-300 relative isolate">
      <DotPatternBackground />

      <div className="mx-auto max-w-4xl relative z-10 px-4 sm:px-6 pt-4 pb-6">
        <header className="bg-white border-b-4 border-black px-4 py-3 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                aria-label="Back to resources"
                className="h-10 w-10 border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0_#0a0a0a] transition-colors duration-150 transition-transform hover:bg-yellow-50 active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#FFD700] shadow-[3px_3px_0px_0px_#000]">
                    <Settings className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-stone-900 tracking-tight">
                      Study Materials Settings
                    </h1>
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-stone-500">
                      Offline cache and storage preferences
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <span className="flex h-10 w-10 items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
              <BookOpen className="h-4 w-4" />
            </span>
          </div>
        </header>

        <section className="bg-white border-b-4 border-black px-4 py-5 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
                <HardDrive className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-stone-700">
                  Storage Usage
                </p>
                <p className="text-[11px] font-bold uppercase text-stone-500">
                  Cached files on this device
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000]">
              <HardDrive className="h-3.5 w-3.5" />
              <span>
                {storageUsage.usedMb} MB /{" "}
                {storageUsage.limitMb === null
                  ? "Unlimited"
                  : `${storageUsage.limitMb} MB`}
              </span>
            </div>
          </div>
        </section>

        <section className="bg-white border-b-4 border-black px-4 py-5 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-stone-700 mb-3">
                Cache limit
              </p>
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-stone-500">
                <span>Used {storageUsage.usedMb} MB</span>
                <span>
                  {isUnlimited ? "Unlimited" : `${pendingLimit} MB`}
                </span>
              </div>
              <div className="mt-3">
                <input
                  type="range"
                  min={CACHE_LIMIT_MIN_MB}
                  max={CACHE_LIMIT_MAX_MB}
                  step={CACHE_LIMIT_STEP_MB}
                  value={pendingLimit}
                  onChange={handleSliderChange}
                  disabled={isUnlimited}
                  aria-label="Cache limit"
                  className="w-full accent-black disabled:opacity-60"
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label
                  htmlFor="cache-unlimited"
                  className="flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-colors duration-150 hover:bg-yellow-50"
                >
                  <input
                    id="cache-unlimited"
                    type="checkbox"
                    checked={isUnlimited}
                    onChange={handleUnlimitedToggle}
                    className="h-3.5 w-3.5 border-2 border-black"
                  />
                  Unlimited
                </label>
                {!isUnlimited && (
                  <span className="text-[10px] font-black uppercase text-stone-500">
                    +{CACHE_LIMIT_STEP_MB}MB steps
                  </span>
                )}
              </div>
            </div>

            <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-stone-700 mb-3">
                Offline storage mode
              </p>
              <div className="space-y-2">
                <label
                  htmlFor="offline-web"
                  className="flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-colors duration-150 hover:bg-yellow-50"
                >
                  <input
                    id="offline-web"
                    type="radio"
                    name="offline-mode"
                    checked={offlineStorageMode === "web"}
                    onChange={() => handleStorageModeChange("web")}
                    className="h-3.5 w-3.5 border-2 border-black"
                  />
                  Web app cache
                </label>
                <label
                  htmlFor="offline-folder"
                  className={cn(
                    "flex items-center gap-2 border-2 border-black px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-colors duration-150",
                    hasFolderAccessSupport()
                      ? "bg-white hover:bg-yellow-50"
                      : "bg-neutral-100 text-neutral-400 cursor-not-allowed",
                    showFolderConfirm &&
                      offlineStorageMode !== "folder" &&
                      "bg-yellow-50 ring-2 ring-black/30",
                  )}
                  aria-busy={
                    showFolderConfirm && offlineStorageMode !== "folder"
                  }
                >
                  <input
                    id="offline-folder"
                    type="radio"
                    name="offline-mode"
                    checked={offlineStorageMode === "folder"}
                    onChange={() => handleStorageModeChange("folder")}
                    disabled={!hasFolderAccessSupport()}
                    className={cn(
                      "h-3.5 w-3.5 border-2 border-black",
                      showFolderConfirm &&
                        offlineStorageMode !== "folder" &&
                        "ring-2 ring-black/30 ring-offset-2 ring-offset-yellow-50",
                    )}
                  />
                  Dedicated device folder
                  {showFolderConfirm &&
                    offlineStorageMode !== "folder" && (
                      <span className="ml-auto border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_#000]">
                        Pending
                      </span>
                    )}
                </label>
              </div>
              <p className="mt-3 text-[10px] font-bold uppercase text-stone-500">
                Folder mode stores files locally (not synced) and requests
                permission before saving.
              </p>
              {showFolderConfirm && offlineStorageMode !== "folder" && (
                <div className="mt-3 border-2 border-black bg-yellow-50 px-3 py-3 text-[11px] font-bold uppercase text-stone-600 shadow-[2px_2px_0px_0px_#000]">
                  <p className="mb-3">
                    Choose a local folder on this device to store offline files.
                    If permission is denied, we will keep using web cache.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmFolderMode}
                      disabled={folderPending}
                      className="inline-flex items-center gap-2 border-2 border-black bg-[#FFD700] px-3 py-2 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-transform active:scale-95 disabled:opacity-60 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    >
                      Enable folder access
                    </button>
                    <button
                      type="button"
                      onClick={handleKeepWebCache}
                      disabled={folderPending}
                      className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-transform active:scale-95 disabled:opacity-60 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    >
                      Keep web cache
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white border-b-4 border-black px-4 py-5 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-stone-700">
                Offline Cache Controls
              </p>
              <p className="text-[11px] font-bold uppercase text-stone-500">
                Clear cached files on this device
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearOfflineCache}
              className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-[11px] font-black uppercase shadow-[3px_3px_0px_0px_#000] transition-colors duration-150 transition-transform hover:bg-yellow-50 active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear offline cache
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
