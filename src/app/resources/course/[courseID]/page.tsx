"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  File,
  FileArchive,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  MoreVertical,
  Presentation,
  RefreshCw,
  Search,
  Star,
  Tag,
  WifiOff,
} from "lucide-react";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import { RetroSkeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useDriveFolder, useResourceCourses } from "@/hooks/useResources";
import { useStudyMaterialsPreferences } from "@/hooks/useStudyMaterialsPreferences";
import { Menu } from "@/components/ui/Menu";
import { Drawer } from "@/components/ui/Drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { toast } from "sonner";
import {
  buildResourceId,
  buildResourcePath,
} from "@/lib/resources/resource-id";
import {
  cacheFile,
  isFileCached,
  readCachedFile,
  removeCachedFile,
} from "@/lib/resources/offline-cache";
import {
  getOfflineFolderHandle,
  readOfflineFolderFile,
  removeOfflineFolderFile,
  requestOfflineFolderAccess,
  writeOfflineFolderFile,
} from "@/lib/resources/offline-folder";
import { cn } from "@/lib/utils";
import {
  DRIVE_FOLDER_MIME,
  type DriveItem,
  type ResourceCourse,
} from "@/types/resources";

const isFolder = (mimeType?: string) => mimeType === DRIVE_FOLDER_MIME;

const GOOGLE_DOC = "application/vnd.google-apps.document";
const GOOGLE_SHEET = "application/vnd.google-apps.spreadsheet";
const GOOGLE_SLIDES = "application/vnd.google-apps.presentation";
const PDF_MIME = "application/pdf";

const MB = 1024 * 1024;

const ARCHIVE_MIMES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/x-7z-compressed",
  "application/x-rar-compressed",
  "application/x-tar",
  "application/gzip",
]);

const AI_PROVIDERS = [
  { id: "chatgpt", label: "ChatGPT", href: "https://chat.openai.com/" },
  { id: "gemini", label: "Gemini", href: "https://gemini.google.com/" },
  { id: "other", label: "Other", href: "https://www.google.com/" },
] as const;

const formatBytes = (size?: string | number) => {
  const value = typeof size === "number" ? size : Number(size ?? NaN);
  if (!Number.isFinite(value) || value <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let current = value;
  let idx = 0;
  while (current >= 1024 && idx < units.length - 1) {
    current /= 1024;
    idx += 1;
  }
  return `${current.toFixed(current >= 10 || idx === 0 ? 0 : 1)} ${
    units[idx]
  }`;
};

const formatModifiedDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getItemIcon = (mimeType?: string) => {
  if (mimeType === DRIVE_FOLDER_MIME) return Folder;
  if (mimeType === GOOGLE_SHEET) return FileSpreadsheet;
  if (mimeType === GOOGLE_SLIDES) return Presentation;
  if (mimeType === GOOGLE_DOC || mimeType === PDF_MIME) return FileText;
  if (ARCHIVE_MIMES.has(mimeType ?? "")) return FileArchive;
  return File;
};

const getExportMime = (mimeType?: string) => {
  if (mimeType === GOOGLE_DOC) return "application/pdf";
  if (mimeType === GOOGLE_SHEET) return "application/pdf";
  if (mimeType === GOOGLE_SLIDES) return "application/pdf";
  return null;
};

type ResourceCourseBrowserProps = {
  course: ResourceCourse;
  rootFolderId: string;
  userId: string | null;
  preferences: ReturnType<typeof useStudyMaterialsPreferences>;
};

function ResourceCourseBrowser({
  course,
  rootFolderId,
  userId,
  preferences,
}: ResourceCourseBrowserProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [offlinePending, setOfflinePending] = useState<Set<string>>(
    () => new Set(),
  );
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiTarget, setAiTarget] = useState<DriveItem | null>(null);
  const [aiChoice, setAiChoice] = useState<(typeof AI_PROVIDERS)[number] | null>(
    null,
  );
  const [tagEditor, setTagEditor] = useState<{
    resourceId: string;
    name: string;
    tags: string[];
  } | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [folderStack, setFolderStack] = useState<
    Array<{ id: string; name: string }>
  >([{ id: rootFolderId, name: course.courseName || course.courseID }]);
  const listVisibilityStyle = useMemo(
    () =>
      ({
        contentVisibility: "auto",
        containIntrinsicSize: "1px 720px",
      }) as React.CSSProperties,
    [],
  );

  const currentFolder = folderStack[folderStack.length - 1];
  const driveQuery = useDriveFolder(currentFolder?.id ?? null);
  const {
    favorites,
    tags,
    offlineFiles,
    cacheConfig,
    offlineStorageMode,
    toggleFavorite,
    setTags,
    markOpened,
    setOfflineFile,
    removeOfflineFiles,
    updateOfflineStorageMode,
  } = preferences;

  const pathKey = useMemo(
    () => buildResourcePath(folderStack.map((folder) => folder.id)),
    [folderStack],
  );

  const getResourceId = useCallback(
    (itemId: string) =>
      buildResourceId({
        courseId: course.courseID,
        path: pathKey,
        itemId,
      }),
    [course.courseID, pathKey],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = `resources.course.${course.courseID}.path`;
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Array<{ id: string; name: string }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const root = parsed[0];
        if (root && root.id === rootFolderId) {
          setFolderStack(parsed);
        }
      }
    } catch {
      return;
    }
  }, [course.courseID, rootFolderId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = `resources.course.${course.courseID}.path`;
    window.sessionStorage.setItem(storageKey, JSON.stringify(folderStack));
  }, [course.courseID, folderStack]);

  useEffect(() => {
    if (!currentFolder?.id) return;
    const resourceId = getResourceId(currentFolder.id);
    markOpened(resourceId);
  }, [currentFolder?.id, getResourceId, markOpened]);

  const tagSearchIndex = useMemo(() => {
    const index = new Map<string, string[]>();
    Object.entries(tags).forEach(([resourceId, list]) => {
      if (!list || list.length === 0) return;
      index.set(
        resourceId,
        list.map((tag) => tag.toLowerCase()),
      );
    });
    return index;
  }, [tags]);

  const filteredItems = useMemo(() => {
    const items = driveQuery.data ?? [];
    const query = deferredSearchTerm.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      if (item.name.toLowerCase().includes(query)) return true;
      const resourceId = getResourceId(item.id);
      const itemTags = tagSearchIndex.get(resourceId) ?? [];
      return itemTags.some((tag) => tag.includes(query));
    });
  }, [
    deferredSearchTerm,
    driveQuery.data,
    getResourceId,
    tagSearchIndex,
  ]);

  const { folders, files } = useMemo(() => {
    const nextFolders: typeof filteredItems = [];
    const nextFiles: typeof filteredItems = [];

    filteredItems.forEach((item) => {
      if (isFolder(item.mimeType)) {
        nextFolders.push(item);
      } else {
        nextFiles.push(item);
      }
    });

    return { folders: nextFolders, files: nextFiles };
  }, [filteredItems]);

  const itemLookup = useMemo(() => {
    return new Map((driveQuery.data ?? []).map((item) => [item.id, item]));
  }, [driveQuery.data]);

  const offlineItems = useMemo(() => {
    return Object.entries(offlineFiles)
      .map(([resourceId, meta]) => ({
        resourceId,
        meta,
        item: meta.fileId ? itemLookup.get(meta.fileId) : undefined,
      }))
      .filter((entry) => entry.meta.courseId === course.courseID);
  }, [course.courseID, itemLookup, offlineFiles]);

  const handleOpenFolder = useCallback(
    (id: string, name: string) => {
      const resourceId = getResourceId(id);
      markOpened(resourceId);
      setFolderStack((prev) => [...prev, { id, name }]);
    },
    [getResourceId, markOpened],
  );

  const handleBreadcrumb = useCallback((index: number) => {
    setFolderStack((prev) => prev.slice(0, index + 1));
  }, []);

  const openBlob = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, []);

  const openOfflineResource = useCallback(
    async (resourceId: string, fileId?: string) => {
      const storedMode = offlineFiles[resourceId]?.storageMode ?? offlineStorageMode;
      if (storedMode === "folder" && fileId) {
        const file = await readOfflineFolderFile(fileId);
        if (file) {
          openBlob(file);
          return true;
        }
      }

      const cached = await readCachedFile(resourceId);
      if (!cached) return false;
      const blob = await cached.blob();
      openBlob(blob);
      return true;
    },
    [offlineFiles, offlineStorageMode, openBlob],
  );

  const handleOpenFile = useCallback(
    async (item: DriveItem, resourceId: string) => {
      if (offlineFiles[resourceId]) {
        const opened = await openOfflineResource(
          resourceId,
          offlineFiles[resourceId]?.fileId ?? item.id,
        );
        if (opened) {
          markOpened(resourceId);
          return;
        }
      }

      if (item.webViewLink) {
        window.open(item.webViewLink, "_blank", "noopener,noreferrer");
        markOpened(resourceId);
      } else {
        toast.error("Preview link not available for this file.");
      }
    },
    [markOpened, offlineFiles, openOfflineResource],
  );

  const handleToggleOffline = useCallback(
    async (item: DriveItem, resourceId: string) => {
      if (!userId) return;
      if (offlinePending.has(resourceId)) return;

      setOfflinePending((prev) => new Set(prev).add(resourceId));

      try {
        const existing = offlineFiles[resourceId];
        if (existing) {
          if (existing.storageMode === "folder") {
            await removeOfflineFolderFile(existing.fileId ?? item.id);
          } else {
            await removeCachedFile(resourceId);
          }
          setOfflineFile(resourceId, null);
          return;
        }

        if (!isOnline) {
          toast.error("Connect to the internet to cache files offline.");
          return;
        }

        let storageMode = offlineStorageMode;
        if (storageMode === "folder") {
          if (!getOfflineFolderHandle()) {
            const handle = await requestOfflineFolderAccess();
            if (!handle) {
              toast.error("Folder access required. Using web cache instead.");
              updateOfflineStorageMode("web");
              storageMode = "web";
            }
          }
        }

        let size = Number(item.size ?? 0);
        let blob: Blob | null = null;
        let alreadyCached = false;

        if (storageMode === "folder") {
          const file = await readOfflineFolderFile(item.id);
          if (file) {
            alreadyCached = true;
            size = file.size;
          }
        } else {
          alreadyCached = await isFileCached(resourceId);
          if (alreadyCached) {
            const cached = await readCachedFile(resourceId);
            if (cached) {
              const cachedBlob = await cached.clone().blob();
              size = cachedBlob.size;
            }
          }
        }

        if (!alreadyCached) {
          const exportMime = getExportMime(item.mimeType);
          const params = new URLSearchParams();
          params.set("fileId", item.id);
          if (exportMime) {
            params.set("export", exportMime);
          }
          const response = await fetch(
            `/api/resources/drive/file?${params.toString()}`,
          );
          if (!response.ok) {
            toast.error("Unable to cache file. Please try again.");
            return;
          }
          blob = await response.blob();
          size = blob.size;
        }

        const limitMb = cacheConfig.limitMb ?? null;
        if (limitMb !== null && Number.isFinite(limitMb)) {
          const limitBytes = limitMb * MB;
          if (limitBytes > 0 && size > limitBytes) {
            toast.error("File exceeds current cache limit.");
            return;
          }

          const entries = Object.entries(offlineFiles)
            .map(([id, meta]) => ({
              id,
              meta,
              cachedAt: new Date(meta.cachedAt).getTime() || 0,
            }))
            .sort((a, b) => a.cachedAt - b.cachedAt);
          let total = entries.reduce(
            (sum, entry) => sum + (Number(entry.meta.size) || 0),
            0,
          );
          const evictIds: string[] = [];

          for (const entry of entries) {
            if (total + size <= limitBytes) break;
            total -= Number(entry.meta.size) || 0;
            evictIds.push(entry.id);
            if (entry.meta.storageMode === "folder") {
              await removeOfflineFolderFile(entry.meta.fileId ?? entry.id);
            } else {
              await removeCachedFile(entry.id);
            }
          }

          if (evictIds.length > 0) {
            removeOfflineFiles(evictIds);
          }
        }

        if (!alreadyCached) {
          if (storageMode === "folder") {
            const success = await writeOfflineFolderFile(
              item.id,
              blob ?? new Blob(),
            );
            if (!success) {
              toast.error("Unable to save to the selected folder.");
              return;
            }
          } else if (blob) {
            await cacheFile(
              resourceId,
              new Response(blob, {
                headers: {
                  "Content-Type":
                    blob.type || "application/octet-stream",
                },
              }),
            );
          }
        }

        setOfflineFile(resourceId, {
          fileId: item.id,
          size: Number.isFinite(size) ? size : 0,
          cachedAt: new Date().toISOString(),
          name: item.name,
          courseId: course.courseID,
          path: pathKey,
          mimeType: item.mimeType,
          storageMode,
        });
      } finally {
        setOfflinePending((prev) => {
          const next = new Set(prev);
          next.delete(resourceId);
          return next;
        });
      }
    },
    [
      course.courseID,
      isOnline,
      offlineFiles,
      offlinePending,
      pathKey,
      setOfflineFile,
      removeOfflineFiles,
      cacheConfig.limitMb,
      userId,
      offlineStorageMode,
      updateOfflineStorageMode,
    ],
  );

  const handleToggleFavorite = useCallback(
    (resourceId: string) => {
      toggleFavorite(resourceId);
    },
    [toggleFavorite],
  );

  const handleTagSave = useCallback(
    (resourceId: string, nextTags: string[]) => {
      setTags(resourceId, nextTags);
    },
    [setTags],
  );

  const startTagEditing = useCallback(
    (resourceId: string, name: string) => {
      setTagEditor({
        resourceId,
        name,
        tags: tags[resourceId] ?? [],
      });
      setTagInput("");
    },
    [tags],
  );

  const handleAddTag = useCallback(() => {
    if (!tagEditor) return;
    const normalized = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    if (normalized.length === 0) return;
    const nextTags = Array.from(
      new Set([...(tagEditor.tags ?? []), ...normalized]),
    );
    handleTagSave(tagEditor.resourceId, nextTags);
    setTagEditor((prev) =>
      prev ? { ...prev, tags: nextTags } : prev,
    );
    setTagInput("");
  }, [handleTagSave, tagEditor, tagInput]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      if (!tagEditor) return;
      const nextTags = (tagEditor.tags ?? []).filter((item) => item !== tag);
      handleTagSave(tagEditor.resourceId, nextTags);
      setTagEditor((prev) =>
        prev ? { ...prev, tags: nextTags } : prev,
      );
    },
    [handleTagSave, tagEditor],
  );

  const handleOpenWithAi = useCallback((item: DriveItem) => {
    setAiTarget(item);
    setAiChoice(null);
    setAiDrawerOpen(true);
  }, []);

  const handleConfirmAi = useCallback(() => {
    if (!aiChoice) return;
    window.open(aiChoice.href, "_blank", "noopener,noreferrer");
    setAiDrawerOpen(false);
    toast.message(
      "Opened AI assistant. You'll choose what content to share manually.",
    );
  }, [aiChoice]);

  return (
    <>
      <header className="sticky top-0 z-20 bg-white border-b-4 border-black px-4 py-4 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/resources")}
              aria-label="Back to resources"
              className="h-10 w-10 border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0_#0a0a0a] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0a0a0a] active:translate-y-0 active:shadow-[2px_2px_0_#0a0a0a]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-stone-900 tracking-tight">
                {course.courseName || course.courseID}
              </h1>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-stone-500">
                {course.courseID}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => driveQuery.refetch()}
              aria-label="Refresh folder"
              className="h-10 w-10 border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0_#0a0a0a] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0a0a0a] active:translate-y-0 active:shadow-[2px_2px_0_#0a0a0a]"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <Menu>
              <Menu.Trigger asChild>
                <button
                  type="button"
                  aria-label="Open course menu"
                  className="h-10 w-10 border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0_#0a0a0a] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0a0a0a] active:translate-y-0 active:shadow-[2px_2px_0_#0a0a0a]"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </Menu.Trigger>
              <Menu.Content
                align="end"
                sideOffset={6}
                className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] min-w-[180px]"
              >
                <Menu.Item
                  className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                  onSelect={() => {
                    const folderUrl =
                      course.syllabusAssets?.folderUrl ??
                      `https://drive.google.com/drive/folders/${rootFolderId}`;
                    window.open(folderUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  <FolderOpen className="h-4 w-4" />
                  Open in Drive
                </Menu.Item>
                <Menu.Item
                  className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                  onSelect={() => driveQuery.refetch()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Sync now
                </Menu.Item>
              </Menu.Content>
            </Menu>
          </div>
        </div>
      </header>

      <section className="bg-white border-b-4 border-black px-4 py-4 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
        <label className="text-xs font-black uppercase text-neutral-600 mb-2 block">
          Search materials
        </label>
        <div className="flex items-center gap-3 border-[3px] border-black bg-white px-3 py-2 shadow-[3px_3px_0px_0px_#000]">
          <Search className="h-4 w-4 text-neutral-600" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search through materials"
            aria-label="Search through materials"
            className="flex-1 bg-transparent text-sm font-bold outline-none"
          />
        </div>
      </section>

      <section className="bg-white border-b-4 border-black px-4 py-6 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase text-stone-600">
          {folderStack.map((folder, index) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => handleBreadcrumb(index)}
              className={cn(
                "flex items-center gap-1 border-2 border-black px-2 py-1 shadow-[2px_2px_0_#0a0a0a]",
                index === folderStack.length - 1
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-700 hover:bg-yellow-100",
              )}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="max-w-[140px] truncate">{folder.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white border-b-4 border-black px-4 py-6 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
        {!isOnline && (
          <div className="mb-4 flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase text-neutral-700 shadow-[3px_3px_0px_0px_#000]">
            <WifiOff className="h-4 w-4" />
            Offline mode enabled. Cached files remain available.
          </div>
        )}

        {offlineItems.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-black uppercase tracking-wide text-stone-600 mb-3">
              Available Offline
            </h4>
            <div className="space-y-3" style={listVisibilityStyle}>
              {offlineItems.map(({ resourceId, meta, item }) => {
                const Icon = getItemIcon(item?.mimeType ?? meta.mimeType);
                return (
                  <div
                    key={resourceId}
                    className="w-full flex items-center justify-between gap-3 border-2 border-black bg-white px-4 py-3 text-left shadow-[3px_3px_0px_0px_#000]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenFile(
                          item ?? {
                            id: meta.fileId,
                            name: meta.name ?? "Offline file",
                            mimeType: meta.mimeType ?? "",
                          },
                          resourceId,
                        )
                      }
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <span className="flex h-10 w-10 items-center justify-center border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-black uppercase text-stone-900 truncate">
                          {item?.name ?? meta.name ?? "Offline file"}
                        </p>
                        <p className="text-[11px] font-bold uppercase text-stone-500">
                          {formatBytes(meta.size)} • Cached{" "}
                          {formatModifiedDate(meta.cachedAt)}
                        </p>
                      </div>
                    </button>
                    <span className="flex items-center gap-1 border-2 border-black bg-white px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000]">
                      <Download className="h-3 w-3" />
                      Offline
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {driveQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <RetroSkeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : driveQuery.isError ? (
          <div className="border-2 border-black bg-red-50 p-6 shadow-[4px_4px_0px_0px_#000]">
            <p className="text-sm font-bold text-red-600 mb-4">
              Unable to load Drive materials. Please try again.
            </p>
            <button
              type="button"
              onClick={() => driveQuery.refetch()}
              className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0_#0a0a0a]"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000]">
            <p className="text-sm font-bold uppercase text-neutral-600">
              {searchTerm
                ? "No materials match your search."
                : "No files or folders found."}
            </p>
          </div>
        ) : (
          <div className="space-y-3" style={listVisibilityStyle}>
            {folders.map((item) => {
              const resourceId = getResourceId(item.id);
              const itemTags = tags[resourceId] ?? [];
              const isFavorite = Boolean(favorites[resourceId]);
              const Icon = getItemIcon(item.mimeType);
              return (
                <div
                  key={item.id}
                  className="group w-full flex items-center justify-between gap-3 border-2 border-black bg-white px-4 py-3 text-left shadow-[3px_3px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenFolder(item.id, item.name)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#FFD700] shadow-[3px_3px_0px_0px_#000]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase text-stone-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] font-bold uppercase text-stone-500">
                        Folder
                      </p>
                      {itemTags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {itemTags.map((tag) => (
                            <span
                              key={tag}
                              className="border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase text-stone-600 shadow-[2px_2px_0px_0px_#000]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto">
                      <button
                        type="button"
                        aria-label={isFavorite ? "Unstar folder" : "Star folder"}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleFavorite(resourceId);
                        }}
                        className="h-8 w-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000]"
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            isFavorite ? "text-yellow-500" : "text-black",
                          )}
                          fill={isFavorite ? "currentColor" : "none"}
                        />
                      </button>
                    </div>
                    <Menu>
                      <Menu.Trigger asChild>
                        <button
                          type="button"
                          aria-label="Folder actions"
                          className="h-8 w-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000]"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </Menu.Trigger>
                      <Menu.Content
                        align="end"
                        sideOffset={6}
                        className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] min-w-[180px]"
                      >
                        <Menu.Item
                          className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                          onSelect={() => handleOpenFolder(item.id, item.name)}
                        >
                          <FolderOpen className="h-4 w-4" />
                          Open folder
                        </Menu.Item>
                        <Menu.Item
                          className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                          onSelect={() => startTagEditing(resourceId, item.name)}
                        >
                          <Tag className="h-4 w-4" />
                          Manage tags
                        </Menu.Item>
                      </Menu.Content>
                    </Menu>
                  </div>
                </div>
              );
            })}

            {files.map((item) => {
              const resourceId = getResourceId(item.id);
              const itemTags = tags[resourceId] ?? [];
              const isFavorite = Boolean(favorites[resourceId]);
              const offlineMeta = offlineFiles[resourceId];
              const isOffline = Boolean(offlineMeta);
              const Icon = getItemIcon(item.mimeType);
              const sizeLabel = formatBytes(offlineMeta?.size ?? item.size);
              const modifiedLabel = formatModifiedDate(
                item.modifiedTime ?? offlineMeta?.cachedAt,
              );
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group w-full flex items-center justify-between gap-3 border-2 border-black bg-white px-4 py-3 text-left shadow-[3px_3px_0px_0px_#000] transition-all duration-150",
                    item.webViewLink
                      ? "hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                      : "opacity-80",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenFile(item, resourceId)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-10 w-10 items-center justify-center border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase text-stone-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] font-bold uppercase text-stone-500">
                        {sizeLabel} • {modifiedLabel}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {isOffline && (
                          <span className="border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase text-stone-600 shadow-[2px_2px_0px_0px_#000]">
                            Offline
                          </span>
                        )}
                        {itemTags.map((tag) => (
                          <span
                            key={tag}
                            className="border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase text-stone-600 shadow-[2px_2px_0px_0px_#000]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto">
                      <button
                        type="button"
                        aria-label={isFavorite ? "Unstar file" : "Star file"}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleFavorite(resourceId);
                        }}
                        className="h-8 w-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000]"
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            isFavorite ? "text-yellow-500" : "text-black",
                          )}
                          fill={isFavorite ? "currentColor" : "none"}
                        />
                      </button>
                      <button
                        type="button"
                        aria-label={
                          isOffline
                            ? "Remove offline access"
                            : "Make available offline"
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleOffline(item, resourceId);
                        }}
                        disabled={offlinePending.has(resourceId)}
                        className="h-8 w-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] disabled:opacity-60"
                      >
                        <Download
                          className={cn(
                            "h-4 w-4",
                            isOffline ? "text-stone-900" : "text-stone-500",
                          )}
                        />
                      </button>
                    </div>
                    <Menu>
                      <Menu.Trigger asChild>
                        <button
                          type="button"
                          aria-label="File actions"
                          className="h-8 w-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000]"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </Menu.Trigger>
                      <Menu.Content
                        align="end"
                        sideOffset={6}
                        className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] min-w-[190px]"
                      >
                        <Menu.Item
                          className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                          onSelect={() => handleOpenFile(item, resourceId)}
                        >
                          <FileText className="h-4 w-4" />
                          Open file
                        </Menu.Item>
                        <Menu.Item
                          className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                          onSelect={() => handleOpenWithAi(item)}
                        >
                          <File className="h-4 w-4" />
                          Open with AI
                        </Menu.Item>
                        <Menu.Item
                          className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                          onSelect={() => startTagEditing(resourceId, item.name)}
                        >
                          <Tag className="h-4 w-4" />
                          Manage tags
                        </Menu.Item>
                      </Menu.Content>
                    </Menu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Drawer
        open={aiDrawerOpen}
        onOpenChange={(open) => {
          setAiDrawerOpen(open);
          if (!open) {
            setAiChoice(null);
            setAiTarget(null);
          }
        }}
      >
        <Drawer.Content className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_#000]">
          <Drawer.Header>
            <Drawer.Title className="text-lg font-black uppercase">
              Open with AI
            </Drawer.Title>
            <Drawer.Description className="text-sm font-bold text-neutral-600">
              Choose an assistant. You will confirm before opening.
            </Drawer.Description>
          </Drawer.Header>
          <div className="px-4 pb-2 space-y-3">
            {AI_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => setAiChoice(provider)}
                className={cn(
                  "w-full border-2 border-black px-4 py-3 text-left font-black uppercase text-sm shadow-[3px_3px_0px_0px_#000] transition-all duration-150",
                  aiChoice?.id === provider.id
                    ? "bg-black text-white"
                    : "bg-white hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]",
                )}
              >
                {provider.label}
              </button>
            ))}
          </div>
          <Drawer.Footer>
            <div className="border-2 border-black bg-white px-4 py-3 text-xs font-black uppercase text-neutral-600 shadow-[3px_3px_0px_0px_#000]">
              {aiTarget?.name
                ? `Selected: ${aiTarget.name}`
                : "Select a file to continue."}
            </div>
            <button
              type="button"
              onClick={handleConfirmAi}
              disabled={!aiChoice}
              className="inline-flex items-center justify-center gap-2 border-2 border-black bg-[#FFD700] px-4 py-3 text-sm font-black uppercase shadow-[4px_4px_0px_0px_#000] disabled:opacity-60"
            >
              Confirm & Open
            </button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>

      <Dialog
        open={Boolean(tagEditor)}
        onOpenChange={(open) => {
          if (!open) setTagEditor(null);
        }}
      >
        <DialogContent className="max-w-lg border-2 border-black bg-white shadow-[6px_6px_0px_0px_#000]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase">
              Manage Tags
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm font-bold text-neutral-600">
            {tagEditor?.name ?? "Resource"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(tagEditor?.tags ?? []).length === 0 ? (
              <span className="text-xs font-bold uppercase text-neutral-500">
                No tags yet. Add one below.
              </span>
            ) : (
              tagEditor?.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="border-2 border-black bg-white px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                  aria-label={`Remove ${tag}`}
                >
                  {tag}
                </button>
              ))
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add tags, comma separated"
              className="flex-1 min-w-[200px] border-2 border-black px-3 py-2 text-sm font-bold uppercase shadow-[3px_3px_0px_0px_#000] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="border-2 border-black bg-[#FFD700] px-3 py-2 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000]"
            >
              Add
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ResourceCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseIdParam = params?.courseID;
  const courseId = Array.isArray(courseIdParam)
    ? courseIdParam[0]
    : courseIdParam;

  const { user, loading: authLoading } = useAuth();
  const coursesQuery = useResourceCourses(user?.uid ?? null);
  const preferences = useStudyMaterialsPreferences(user?.uid ?? null);

  const course = useMemo(() => {
    return (coursesQuery.data ?? []).find(
      (item) => item.courseID === courseId,
    );
  }, [coursesQuery.data, courseId]);

  const rootFolderId = course?.syllabusAssets?.folderId ?? null;

  useEffect(() => {
    if (!course?.courseID || !rootFolderId) return;
    const resourceId = buildResourceId({
      courseId: course.courseID,
      path: rootFolderId,
      itemId: rootFolderId,
    });
    preferences.markOpened(resourceId);
  }, [course?.courseID, preferences, rootFolderId]);


  if (authLoading) {
    return <div className="min-h-screen bg-neutral-50" />;
  }

  if (!user?.uid) {
    return (
      <div className="min-h-screen bg-[#fffdf5] flex items-center justify-center p-4">
        <div className="border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000] max-w-md">
          <h2 className="font-display text-2xl font-black uppercase mb-4">
            Authentication Required
          </h2>
          <p className="font-mono text-sm text-neutral-600 mb-6">
            Please sign in to access academic resources.
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

  if (coursesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-24 transition-colors duration-300 relative isolate">
        <DotPatternBackground />
        <div className="mx-auto max-w-5xl relative z-10">
          <header className="bg-white border-b-4 border-black px-4 py-4 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
            <RetroSkeleton className="h-10 w-64" />
          </header>
          <section className="bg-white border-b-4 border-black px-4 py-6 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <RetroSkeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!courseId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000]">
          <p className="text-sm font-bold uppercase text-neutral-600">
            Course not found.
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000]">
          <p className="text-sm font-bold uppercase text-neutral-600">
            Course resources are unavailable.
          </p>
        </div>
      </div>
    );
  }

  if (!rootFolderId) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-24 transition-colors duration-300 relative isolate">
        <DotPatternBackground />
        <div className="mx-auto max-w-5xl relative z-10">
          <header className="bg-white border-b-4 border-black px-4 py-4 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/resources")}
                aria-label="Back to resources"
                className="h-10 w-10 border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0_#0a0a0a] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0a0a0a] active:translate-y-0 active:shadow-[2px_2px_0_#0a0a0a]"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-stone-900 tracking-tight">
                  {course.courseName || course.courseID}
                </h1>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-stone-500">
                  {course.courseID}
                </p>
              </div>
            </div>
          </header>

          <section className="bg-white border-b-4 border-black px-4 py-6 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
            <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000]">
              <p className="text-sm font-bold uppercase text-neutral-600">
                Resources not available for this course.
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 transition-colors duration-300 relative isolate">
      <DotPatternBackground />

      <div className="mx-auto max-w-5xl relative z-10">
        <ResourceCourseBrowser
          key={rootFolderId}
          course={course}
          rootFolderId={rootFolderId}
          userId={user?.uid ?? null}
          preferences={preferences}
        />
      </div>
    </div>
  );
}
