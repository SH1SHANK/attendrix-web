"use client";

import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Folder,
  GripVertical,
  HardDrive,
  MoreVertical,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import { Menu } from "@/components/ui/Menu";
import { RetroSkeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { useAuth } from "@/context/AuthContext";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { useResourceCourses } from "@/hooks/useResources";
import { useStudyMaterialsPreferences } from "@/hooks/useStudyMaterialsPreferences";
import { useOfflineStorageUsage } from "@/hooks/useOfflineStorageUsage";
import { buildResourceId, parseResourceId } from "@/lib/resources/resource-id";
import { removeCachedFile } from "@/lib/resources/offline-cache";
import {
  hasFolderAccessSupport,
  removeOfflineFolderFile,
  requestOfflineFolderAccess,
} from "@/lib/resources/offline-folder";
import { cn } from "@/lib/utils";
import type { ResourceCourse } from "@/types/resources";
import { toast } from "sonner";

type ResourceTab = "academic" | "personal";

const TAB_ORDER: ResourceTab[] = ["academic", "personal"];

function formatLastOpened(value?: string) {
  if (!value) return "Not opened yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not opened yet";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Last opened just now";
  if (minutes < 60) return `Last opened ${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Last opened ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `Last opened ${days} day${days === 1 ? "" : "s"} ago`;
  }

  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `Last opened ${label}`;
}

function buildSearchKey(course: ResourceCourse) {
  return `${course.courseName ?? ""} ${course.courseID}`.toLowerCase();
}

const ResourceFolderCard = memo(function ResourceFolderCard({
  course,
  resourceId,
  isFavorite,
  lastOpenedAt,
  onOpenCourse,
  onToggleFavorite,
}: {
  course: ResourceCourse;
  resourceId: string | null;
  isFavorite: boolean;
  lastOpenedAt?: string;
  onOpenCourse: (courseId: string) => void;
  onToggleFavorite: (resourceId: string) => void;
}) {
  const hasAssets = Boolean(course.syllabusAssets?.folderId);
  const handleOpen = useCallback(() => {
    if (!hasAssets) return;
    onOpenCourse(course.courseID);
  }, [course.courseID, hasAssets, onOpenCourse]);
  const menuItemClass =
    "flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100";

  return (
    <div
      role={hasAssets ? "button" : "group"}
      tabIndex={hasAssets ? 0 : -1}
      onClick={() => {
        handleOpen();
      }}
      onKeyDown={(event) => {
        if (!hasAssets) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
      aria-disabled={!hasAssets}
      className={cn(
        "group relative border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] transition-all duration-200",
        hasAssets
          ? "hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000]"
          : "opacity-80 cursor-not-allowed",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#FFD700] shadow-[3px_3px_0px_0px_#000]">
            <Folder className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm sm:text-base font-black uppercase tracking-wide text-stone-900">
                {course.courseName || course.courseID}
              </h3>
              {isFavorite && (
                <Star
                  className="h-4 w-4 text-yellow-500"
                  fill="currentColor"
                  aria-label="Favorite folder"
                />
              )}
            </div>
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              {course.courseID}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase text-stone-500">
              {hasAssets
                ? formatLastOpened(lastOpenedAt)
                : "Resources not available for this course"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto">
            <button
              type="button"
              aria-label={isFavorite ? "Unstar folder" : "Star folder"}
              onClick={(event) => {
                event.stopPropagation();
                if (!resourceId) return;
                onToggleFavorite(resourceId);
              }}
              className="h-9 w-9 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000]"
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
                aria-label="Open folder menu"
                onClick={(event) => event.stopPropagation()}
                className="h-9 w-9 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000]"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </Menu.Trigger>
            <Menu.Content
              align="end"
              sideOffset={6}
              className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] min-w-[170px]"
            >
              <Menu.Item
                className={cn(
                  menuItemClass,
                  !hasAssets && "opacity-50",
                )}
                disabled={!hasAssets}
                onSelect={() => {
                  if (!hasAssets) return;
                  handleOpen();
                }}
              >
                <Folder className="h-4 w-4" />
                Open folder
              </Menu.Item>
            </Menu.Content>
          </Menu>
        </div>
      </div>
    </div>
  );
});

export default function ResourcesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ResourceTab>("academic");
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(
    null,
  );
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(
    null,
  );
  const [folderConfirmOpen, setFolderConfirmOpen] = useState(false);
  const [folderConfirmLoading, setFolderConfirmLoading] = useState(false);
  const evictionRef = useRef(false);

  const coursesQuery = useResourceCourses(user?.uid ?? null);
  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data]);
  const {
    favorites,
    tags,
    lastOpened,
    offlineFiles,
    sectionOrder,
    cacheConfig,
    offlineStorageMode,
    toggleFavorite,
    markOpened,
    removeOfflineFiles,
    updateSectionOrder,
    updateCacheConfig,
    updateOfflineStorageMode,
  } = useStudyMaterialsPreferences(user?.uid ?? null);
  const cacheLimitMb = cacheConfig.limitMb ?? null;
  const storageUsage = useOfflineStorageUsage(offlineFiles, cacheLimitMb);
  const favoritesSet = useMemo(
    () => new Set(Object.keys(favorites)),
    [favorites],
  );
  const listVisibilityStyle = useMemo(
    () =>
      ({
        contentVisibility: "auto",
        containIntrinsicSize: "1px 520px",
      }) as React.CSSProperties,
    [],
  );
  const courseSearchIndex = useMemo(() => {
    return new Map(
      courses.map((course) => [course.courseID, buildSearchKey(course)]),
    );
  }, [courses]);
  const courseResourceIds = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach((course) => {
      const folderId = course.syllabusAssets?.folderId ?? "";
      if (!folderId) return;
      map.set(
        course.courseID,
        buildResourceId({
          courseId: course.courseID,
          path: folderId,
          itemId: folderId,
        }),
      );
    });
    return map;
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((course) => {
      const key =
        courseSearchIndex.get(course.courseID) ?? buildSearchKey(course);
      return key.includes(query);
    });
  }, [courses, courseSearchIndex, deferredSearchTerm]);

  const favoriteCourses = useMemo(
    () =>
      filteredCourses.filter((course) => {
        const resourceId = courseResourceIds.get(course.courseID);
        return resourceId ? favoritesSet.has(resourceId) : false;
      }),
    [filteredCourses, favoritesSet, courseResourceIds],
  );

  const taggedCourseIds = useMemo(() => {
    const ids = new Set<string>();
    Object.keys(tags).forEach((resourceId) => {
      const parsed = parseResourceId(resourceId);
      if (parsed?.courseId) {
        ids.add(parsed.courseId);
      }
    });
    return ids;
  }, [tags]);

  const taggedCourses = useMemo(() => {
    if (taggedCourseIds.size === 0) return [];
    return filteredCourses.filter((course) =>
      taggedCourseIds.has(course.courseID),
    );
  }, [filteredCourses, taggedCourseIds]);

  const recentCourses = useMemo(() => {
    const withDates = filteredCourses
      .map((course) => ({
        course,
        openedAt: (() => {
          const resourceId = courseResourceIds.get(course.courseID);
          return resourceId ? lastOpened[resourceId] : undefined;
        })(),
      }))
      .filter((entry) => Boolean(entry.openedAt)) as Array<{
      course: ResourceCourse;
      openedAt: string;
    }>;

    return withDates
      .sort(
        (a, b) =>
          new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
      )
      .map((entry) => entry.course);
  }, [filteredCourses, lastOpened, courseResourceIds]);

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % TAB_ORDER.length;
      const nextTab = TAB_ORDER[nextIndex];
      if (nextTab) {
        setActiveTab(nextTab);
        tabRefs.current[nextIndex]?.focus();
      }
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const nextIndex =
        (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
      const nextTab = TAB_ORDER[nextIndex];
      if (nextTab) {
        setActiveTab(nextTab);
        tabRefs.current[nextIndex]?.focus();
      }
    }
  };

  const handleOpenCourse = useCallback(
    (courseId: string) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "resources.scrollY",
          String(window.scrollY),
        );
      }
      const resourceId = courseResourceIds.get(courseId);
      if (resourceId) markOpened(resourceId);
      router.push(`/resources/course/${courseId}`);
    },
    [courseResourceIds, markOpened, router],
  );

  const handleToggleFavorite = useCallback(
    (resourceId: string) => {
      toggleFavorite(resourceId);
    },
    [toggleFavorite],
  );

  const orderedSections = useMemo(() => {
    const defaultOrder = ["favorites", "recent", "offline", "tagged", "all"];
    const incoming = sectionOrder.length ? sectionOrder : defaultOrder;
    const unique = Array.from(new Set(incoming)).filter((item) =>
      defaultOrder.includes(item),
    );
    defaultOrder.forEach((section) => {
      if (!unique.includes(section)) unique.push(section);
    });
    return unique;
  }, [sectionOrder]);

  const handleDragStart = useCallback(
    (sectionId: string) => (event: React.DragEvent<HTMLButtonElement>) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", sectionId);
      setDraggingSectionId(sectionId);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingSectionId(null);
    setDragOverSectionId(null);
  }, []);

  const handleDrop = useCallback(
    (sectionId: string) => (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const sourceId =
        event.dataTransfer.getData("text/plain") || draggingSectionId;
      setDragOverSectionId(null);
      if (!sourceId || sourceId === sectionId) return;
      const nextOrder = orderedSections.slice();
      const fromIndex = nextOrder.indexOf(sourceId);
      const toIndex = nextOrder.indexOf(sectionId);
      if (fromIndex === -1 || toIndex === -1) return;
      nextOrder.splice(fromIndex, 1);
      nextOrder.splice(toIndex, 0, sourceId);
      updateSectionOrder(nextOrder);
    },
    [draggingSectionId, orderedSections, updateSectionOrder],
  );

  const handleDragOver = useCallback(
    (sectionId: string) => (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (dragOverSectionId !== sectionId) {
        setDragOverSectionId(sectionId);
      }
    },
    [dragOverSectionId],
  );

  const offlineCourses = useMemo(() => {
    const offlineEntries = Object.values(offlineFiles);
    const courseIds = new Set(
      offlineEntries.map((entry) => entry.courseId).filter(Boolean) as string[],
    );
    if (courseIds.size === 0) return [];
    return filteredCourses.filter((course) => courseIds.has(course.courseID));
  }, [filteredCourses, offlineFiles]);

  const handleCacheLimitChange = useCallback(
    (nextLimit: number | null) => {
      updateCacheConfig(nextLimit);
    },
    [updateCacheConfig],
  );

  const handleStorageModeChange = useCallback(
    async (nextMode: "web" | "folder") => {
      if (nextMode === "folder") {
        if (!hasFolderAccessSupport()) {
          toast.error("Dedicated folders are not supported in this browser.");
          return;
        }
        setFolderConfirmOpen(true);
        return;
      }
      updateOfflineStorageMode("web");
    },
    [updateOfflineStorageMode],
  );

  const handleConfirmFolderMode = useCallback(async () => {
    if (folderConfirmLoading) return;
    setFolderConfirmLoading(true);
    try {
      const handle = await requestOfflineFolderAccess();
      if (!handle) {
        toast.error("Folder access was denied. Staying on web cache.");
        updateOfflineStorageMode("web");
        return;
      }
      updateOfflineStorageMode("folder");
      toast.message("Dedicated folder access enabled.");
    } finally {
      setFolderConfirmLoading(false);
      setFolderConfirmOpen(false);
    }
  }, [folderConfirmLoading, updateOfflineStorageMode]);

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
    if (evictionRef.current) return;
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

    evictionRef.current = true;
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
      evictionRef.current = false;
    };
    void evict();
  }, [cacheLimitMb, offlineFiles, removeOfflineEntry, removeOfflineFiles]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem("resources.scrollY");
    if (!saved) return;
    window.sessionStorage.removeItem("resources.scrollY");
    const position = Number(saved);
    if (Number.isFinite(position)) {
      window.requestAnimationFrame(() => window.scrollTo(0, position));
    }
  }, []);

  const getCourseResourceId = useCallback((course: ResourceCourse) => {
    return courseResourceIds.get(course.courseID) ?? null;
  }, [courseResourceIds]);

  const renderSectionHeader = useCallback(
    (label: string, sectionId: string) => (
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Reorder ${label} section`}
            draggable
            onDragStart={handleDragStart(sectionId)}
            onDragEnd={handleDragEnd}
            className="h-7 w-7 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <h2 className="text-sm font-black uppercase tracking-wide text-stone-700">
            {label}
          </h2>
        </div>
        {draggingSectionId === sectionId && (
          <span className="text-[10px] font-black uppercase text-stone-500">
            Dragging
          </span>
        )}
      </div>
    ),
    [draggingSectionId, handleDragEnd, handleDragStart],
  );

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

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 transition-colors duration-300 relative isolate">
      <DotPatternBackground />

      <div className="mx-auto max-w-5xl relative z-10">
        <header className="bg-white border-b-4 border-black px-4 py-4 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 items-center justify-center border-2 border-black bg-[#FFD700] shadow-[3px_3px_0px_0px_#000]">
              <BookOpen className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-stone-900 tracking-tight">
                Academic Resources
              </h1>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-stone-500">
                Study materials for your enrolled courses
              </p>
            </div>
          </div>
        </header>

        <section className="bg-white border-b-4 border-black px-4 py-4 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div
            role="tablist"
            aria-label="Resource repositories"
            className="flex items-center border-2 border-black bg-white shadow-[4px_4px_0_#0a0a0a] overflow-hidden"
            onKeyDown={handleTabKeyDown}
          >
            {TAB_ORDER.map((tab, index) => {
              const label =
                tab === "academic" ? "Academic Repository" : "Personal Repository";
              return (
                <button
                  key={tab}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  tabIndex={activeTab === tab ? 0 : -1}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-xs font-black uppercase tracking-wide transition-all duration-200",
                    activeTab === tab
                      ? "bg-stone-900 text-white"
                      : "bg-white text-stone-700 hover:bg-yellow-100",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

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

        {activeTab === "academic" && (
          <section className="bg-white border-b-4 border-black px-4 py-5 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-stone-700">
                    Study Materials Settings
                  </p>
                  <p className="text-[11px] font-bold uppercase text-stone-500">
                    Offline cache preferences
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000]">
                <p className="text-xs font-black uppercase text-stone-700 mb-3">
                  Cache limit
                </p>
                <div className="space-y-2">
                  {[
                    { label: "250 MB", value: 250 },
                    { label: "500 MB", value: 500 },
                    { label: "Unlimited", value: null },
                  ].map((option) => {
                    const id = `cache-${option.label.replace(/\s+/g, "-")}`;
                    return (
                      <label
                        key={option.label}
                        htmlFor={id}
                        className="flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                      >
                        <input
                          id={id}
                          type="radio"
                          name="cache-limit"
                          checked={cacheLimitMb === option.value}
                          onChange={() => handleCacheLimitChange(option.value)}
                          className="h-3.5 w-3.5 border-2 border-black"
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000]">
                <p className="text-xs font-black uppercase text-stone-700 mb-3">
                  Offline storage mode
                </p>
                <div className="space-y-2">
                  <label
                    htmlFor="offline-web"
                    className="flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer"
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
                      "flex items-center gap-2 border-2 border-black px-3 py-2 text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer",
                      hasFolderAccessSupport()
                        ? "bg-white"
                        : "bg-neutral-100 text-neutral-400 cursor-not-allowed",
                      folderConfirmOpen &&
                        "bg-yellow-50 border-dashed shadow-[1px_1px_0px_0px_#000]",
                    )}
                  >
                    <input
                      id="offline-folder"
                      type="radio"
                      name="offline-mode"
                      checked={offlineStorageMode === "folder"}
                      onChange={() => handleStorageModeChange("folder")}
                      disabled={!hasFolderAccessSupport()}
                      className="h-3.5 w-3.5 border-2 border-black"
                    />
                    Dedicated device folder
                    {folderConfirmOpen && (
                      <span className="ml-auto text-[9px] font-black uppercase text-stone-500">
                        Pending
                      </span>
                    )}
                  </label>
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase text-stone-500">
                  Folder mode stores files locally (not synced) and
                  requests permission before saving.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleClearOfflineCache}
                className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-[11px] font-black uppercase shadow-[3px_3px_0px_0px_#000]"
              >
                <Trash2 className="h-4 w-4" />
                Clear offline cache
              </button>
            </div>
          </section>
        )}

        {activeTab === "academic" ? (
          <section className="bg-white border-b-4 border-black px-4 py-6 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
            {coursesQuery.isError ? (
              <div className="border-2 border-black bg-red-50 p-6 shadow-[4px_4px_0px_0px_#000]">
                <p className="text-sm font-bold text-red-600">
                  Unable to load resources. Please try again.
                </p>
              </div>
            ) : coursesQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <RetroSkeleton key={index} className="h-28 w-full" />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000]">
                <p className="text-sm font-bold text-neutral-600">
                  {searchTerm
                    ? "No materials match your search."
                    : "No enrolled courses found."}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {orderedSections.map((sectionId) => {
                  if (sectionId === "all") {
                    return (
                      <div
                        key={sectionId}
                        onDragOver={handleDragOver(sectionId)}
                        onDrop={handleDrop(sectionId)}
                      >
                        {renderSectionHeader("All Courses", sectionId)}
                        <div
                          className="grid gap-4 sm:grid-cols-2"
                          style={listVisibilityStyle}
                        >
                          {filteredCourses.map((course) => {
                            const resourceId = getCourseResourceId(course);
                            return (
                              <ResourceFolderCard
                                key={course.courseID}
                                course={course}
                                resourceId={resourceId}
                                isFavorite={
                                  resourceId
                                    ? favoritesSet.has(resourceId)
                                    : false
                                }
                                lastOpenedAt={
                                  resourceId ? lastOpened[resourceId] : undefined
                                }
                                onOpenCourse={handleOpenCourse}
                                onToggleFavorite={handleToggleFavorite}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (sectionId === "favorites") {
                    return (
                      <div
                        key={sectionId}
                        onDragOver={handleDragOver(sectionId)}
                        onDrop={handleDrop(sectionId)}
                      >
                        {renderSectionHeader("Favorites", sectionId)}
                        {favoriteCourses.length === 0 ? (
                          <p className="text-xs font-bold uppercase text-stone-500">
                            Star folders to pin them here.
                          </p>
                        ) : (
                          <div
                            className="grid gap-4 sm:grid-cols-2"
                            style={listVisibilityStyle}
                          >
                            {favoriteCourses.map((course) => {
                              const resourceId = getCourseResourceId(course);
                              return (
                                <ResourceFolderCard
                                  key={course.courseID}
                                  course={course}
                                  resourceId={resourceId}
                                  isFavorite={
                                    resourceId
                                      ? favoritesSet.has(resourceId)
                                      : false
                                  }
                                  lastOpenedAt={
                                    resourceId
                                      ? lastOpened[resourceId]
                                      : undefined
                                  }
                                  onOpenCourse={handleOpenCourse}
                                  onToggleFavorite={handleToggleFavorite}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (sectionId === "recent") {
                    return (
                      <div
                        key={sectionId}
                        onDragOver={handleDragOver(sectionId)}
                        onDrop={handleDrop(sectionId)}
                      >
                        {renderSectionHeader("Recently Opened", sectionId)}
                        {recentCourses.length === 0 ? (
                          <p className="text-xs font-bold uppercase text-stone-500">
                            Open a folder to see it here.
                          </p>
                        ) : (
                          <div
                            className="grid gap-4 sm:grid-cols-2"
                            style={listVisibilityStyle}
                          >
                            {recentCourses.map((course) => {
                              const resourceId = getCourseResourceId(course);
                              return (
                                <ResourceFolderCard
                                  key={course.courseID}
                                  course={course}
                                  resourceId={resourceId}
                                  isFavorite={
                                    resourceId
                                      ? favoritesSet.has(resourceId)
                                      : false
                                  }
                                  lastOpenedAt={
                                    resourceId
                                      ? lastOpened[resourceId]
                                      : undefined
                                  }
                                  onOpenCourse={handleOpenCourse}
                                  onToggleFavorite={handleToggleFavorite}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (sectionId === "offline") {
                    return (
                      <div
                        key={sectionId}
                        onDragOver={handleDragOver(sectionId)}
                        onDrop={handleDrop(sectionId)}
                      >
                        {renderSectionHeader("Available Offline", sectionId)}
                        {offlineCourses.length === 0 ? (
                          <p className="text-xs font-bold uppercase text-stone-500">
                            Mark files for offline access to list courses here.
                          </p>
                        ) : (
                          <div
                            className="grid gap-4 sm:grid-cols-2"
                            style={listVisibilityStyle}
                          >
                            {offlineCourses.map((course) => {
                              const resourceId = getCourseResourceId(course);
                              return (
                                <ResourceFolderCard
                                  key={course.courseID}
                                  course={course}
                                  resourceId={resourceId}
                                  isFavorite={
                                    resourceId
                                      ? favoritesSet.has(resourceId)
                                      : false
                                  }
                                  lastOpenedAt={
                                    resourceId
                                      ? lastOpened[resourceId]
                                      : undefined
                                  }
                                  onOpenCourse={handleOpenCourse}
                                  onToggleFavorite={handleToggleFavorite}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (sectionId === "tagged") {
                    return (
                      <div
                        key={sectionId}
                        onDragOver={handleDragOver(sectionId)}
                        onDrop={handleDrop(sectionId)}
                      >
                        {renderSectionHeader("Tagged", sectionId)}
                        {taggedCourses.length === 0 ? (
                          <p className="text-xs font-bold uppercase text-stone-500">
                            Tag files to surface related courses here.
                          </p>
                        ) : (
                          <div
                            className="grid gap-4 sm:grid-cols-2"
                            style={listVisibilityStyle}
                          >
                            {taggedCourses.map((course) => {
                              const resourceId = getCourseResourceId(course);
                              return (
                                <ResourceFolderCard
                                  key={course.courseID}
                                  course={course}
                                  resourceId={resourceId}
                                  isFavorite={
                                    resourceId
                                      ? favoritesSet.has(resourceId)
                                      : false
                                  }
                                  lastOpenedAt={
                                    resourceId
                                      ? lastOpened[resourceId]
                                      : undefined
                                  }
                                  onOpenCourse={handleOpenCourse}
                                  onToggleFavorite={handleToggleFavorite}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="bg-white border-b-4 border-black px-4 py-8 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
            <div className="border-2 border-dashed border-black bg-neutral-50 p-6 text-center">
              <p className="text-sm font-bold uppercase text-stone-600">
                Currently in development, coming soon!
              </p>
            </div>
          </section>
        )}
      </div>

      <DashboardNav />

      <Dialog
        open={folderConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !folderConfirmLoading) {
            setFolderConfirmOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Enable Dedicated Folder?
            </DialogTitle>
            <DialogDescription>
              Choose a local folder on this device to store offline files.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 text-sm font-semibold text-neutral-700 space-y-3">
            <p>
              This keeps files on your device only. They are not synced to the
              cloud and won&apos;t appear on other devices.
            </p>
            <p>
              You can revoke access any time in your browser settings. If
              permission is denied, we will keep using the web app cache.
            </p>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setFolderConfirmOpen(false)}
              disabled={folderConfirmLoading}
              className="inline-flex items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmFolderMode}
              disabled={folderConfirmLoading}
              className="inline-flex items-center justify-center gap-2 border-2 border-black bg-[#FFD700] px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] disabled:opacity-60"
            >
              Continue
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
