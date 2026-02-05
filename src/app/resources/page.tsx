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
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Folder,
  GripVertical,
  MoreVertical,
  Search,
  Star,
} from "lucide-react";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import { Menu } from "@/components/ui/Menu";
import { RetroSkeleton } from "@/components/ui/skeleton";
import { OfflineFallbackButton } from "@/components/resources/OfflineFallbackButton";
import { ShortcutsSheet } from "@/components/resources/ShortcutsSheet";
import { useAuth } from "@/context/AuthContext";
import { useResourceCourses } from "@/hooks/useResources";
import { useStudyMaterialsPreferences } from "@/hooks/useStudyMaterialsPreferences";
import { useOnlineStatus } from "@/hooks/useOptimizations";
import { buildResourceId, parseResourceId } from "@/lib/resources/resource-id";
import { removeCachedFile } from "@/lib/resources/offline-cache";
import { removeOfflineFolderFile } from "@/lib/resources/offline-folder";
import { cn } from "@/lib/utils";
import type { ResourceCourse } from "@/types/resources";
import { CommandCenter, type CommandItem } from "@/components/resources/CommandCenter";

type ResourceTab = "academic" | "personal";

const TAB_ORDER: ResourceTab[] = ["academic", "personal"];
const SECTION_LABELS: Record<string, string> = {
  favorites: "Favorites",
  recent: "Recently Opened",
  offline: "Available Offline",
  tagged: "Tagged",
  all: "All Courses",
};

const COURSE_PALETTE = [
  { bg: "bg-[#E9DDFF]", accent: "bg-[#5B3DF3]" },
  { bg: "bg-[#FFD7D7]", accent: "bg-[#D92D20]" },
  { bg: "bg-[#D8F5E4]", accent: "bg-[#039855]" },
  { bg: "bg-[#DDEBFF]", accent: "bg-[#2E5AAC]" },
  { bg: "bg-[#FFE9B6]", accent: "bg-[#B54708]" },
  { bg: "bg-[#E8F1FF]", accent: "bg-[#3B82F6]" },
];

const hashCourseKey = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 2147483647;
  }
  return hash;
};

function buildSearchKey(course: ResourceCourse) {
  return `${course.courseName ?? ""} ${course.courseID}`.toLowerCase();
}

const ResourceFolderCard = memo(function ResourceFolderCard({
  course,
  resourceId,
  isFavorite,
  onOpenCourse,
  onToggleFavorite,
  variant = "grid",
}: {
  course: ResourceCourse;
  resourceId: string | null;
  isFavorite: boolean;
  onOpenCourse: (courseId: string) => void;
  onToggleFavorite: (resourceId: string) => void;
  variant?: "grid" | "row";
}) {
  const hasAssets = Boolean(course.syllabusAssets?.folderId);
  const paletteIndex =
    hashCourseKey(course.courseID || course.courseName || "course") %
    COURSE_PALETTE.length;
  const palette =
    COURSE_PALETTE[paletteIndex] ??
    COURSE_PALETTE[0] ?? {
      bg: "bg-white",
      accent: "bg-black",
    };
  const isGrid = variant === "grid";
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const handleOpen = useCallback(() => {
    if (!hasAssets) return;
    onOpenCourse(course.courseID);
  }, [course.courseID, hasAssets, onOpenCourse]);
  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);
  const handleLongPressStart = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType !== "touch") return;
      if (!hasAssets && !resourceId) return;
      clearLongPress();
      longPressTriggeredRef.current = false;
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        setMenuOpen(true);
      }, 450);
    },
    [clearLongPress, hasAssets, resourceId],
  );
  const handleLongPressCancel = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);
  const handleMenuOpenChange = useCallback((open: boolean) => {
    setMenuOpen(open);
    if (!open) {
      longPressTriggeredRef.current = false;
    }
  }, []);
  const menuItemClass =
    "flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100";

  const menuButtonClass = cn(
    "h-8 w-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] transition-colors duration-150 transition-transform active:scale-95 hover:bg-yellow-50 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
    isGrid ? "absolute right-2 top-2" : "ml-auto shrink-0",
    isGrid
      ? "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
      : "opacity-100 sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto",
    menuOpen && "opacity-100 pointer-events-auto",
  );

  return (
    <div
      role={hasAssets ? "button" : "group"}
      tabIndex={hasAssets ? 0 : -1}
      onClick={() => {
        if (longPressTriggeredRef.current) {
          longPressTriggeredRef.current = false;
          return;
        }
        handleOpen();
      }}
      onKeyDown={(event) => {
        if (!hasAssets) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
      onPointerDown={handleLongPressStart}
      onPointerUp={handleLongPressCancel}
      onPointerCancel={handleLongPressCancel}
      onPointerMove={handleLongPressCancel}
      aria-disabled={!hasAssets}
      className={cn(
        "group relative border-2 border-black p-4 shadow-[2px_2px_0px_0px_#000] transition-all duration-150 overflow-hidden active:scale-[0.99] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        hasAssets ? palette.bg : "bg-neutral-100 opacity-80 cursor-not-allowed",
        hasAssets &&
          "hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000]",
        isGrid ? "aspect-[4/3] sm:aspect-square" : "flex items-center gap-3",
      )}
    >
      {isGrid ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <span className="flex h-11 w-11 items-center justify-center border-2 border-black bg-[#FFD700] shadow-[3px_3px_0px_0px_#000]">
              <Folder className="h-5 w-5" />
            </span>
            {isFavorite && (
              <span className="border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase leading-none shadow-[2px_2px_0px_0px_#000]">
                Starred
              </span>
            )}
          </div>
          <div className="mt-auto pt-3 min-w-0">
            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-stone-900 line-clamp-3">
              {course.courseName || course.courseID}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn("h-2.5 w-2.5 border border-black", palette.accent)}
              />
              <p className="text-[10px] font-bold uppercase tracking-wide text-stone-600">
                {course.courseID}
              </p>
            </div>
            {!hasAssets && (
              <p className="mt-2 text-[10px] font-bold uppercase text-stone-400">
                Resources unavailable
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[#FFD700] shadow-[3px_3px_0px_0px_#000]">
              <Folder className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black uppercase tracking-tight text-stone-900 truncate">
                {course.courseName || course.courseID}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-wide text-stone-600">
                {course.courseID}
              </p>
              {!hasAssets && (
                <p className="mt-2 text-[10px] font-bold uppercase text-stone-400">
                  Resources unavailable
                </p>
              )}
            </div>
          </div>
          {isFavorite && (
            <span className="border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase leading-none shadow-[2px_2px_0px_0px_#000]">
              Starred
            </span>
          )}
        </>
      )}
      <Menu open={menuOpen} onOpenChange={handleMenuOpenChange}>
        <Menu.Trigger asChild>
          <button
            type="button"
            aria-label="Open folder actions"
            onClick={(event) => event.stopPropagation()}
            className={menuButtonClass}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </Menu.Trigger>
        <Menu.Content
          align="end"
          sideOffset={6}
          className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] min-w-[170px] max-w-[calc(100vw-2rem)] max-h-[min(60svh,320px)] overflow-y-auto"
        >
          <Menu.Item
            className={cn(menuItemClass, !hasAssets && "opacity-50")}
            disabled={!hasAssets}
            onSelect={() => {
              if (!hasAssets) return;
              handleOpen();
            }}
          >
            <Folder className="h-4 w-4" />
            Open folder
          </Menu.Item>
          <Menu.Item
            className={cn(menuItemClass, !resourceId && "opacity-50")}
            disabled={!resourceId}
            onSelect={() => {
              if (!resourceId) return;
              onToggleFavorite(resourceId);
            }}
          >
            <Star className="h-4 w-4" />
            {isFavorite ? "Unstar" : "Star"}
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </div>
  );
});

export default function ResourcesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ResourceTab>("academic");
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [commandOpen, setCommandOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(
    null,
  );
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(
    null,
  );
  const [reorderAnnouncement, setReorderAnnouncement] = useState("");
  const [canDragSections, setCanDragSections] = useState(true);
  const evictionRef = useRef(false);
  const isOnline = useOnlineStatus();

  const coursesQuery = useResourceCourses(user?.uid ?? null);
  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data]);
  const syncStatus = useMemo(() => {
    if (!isOnline) return "Offline";
    if (coursesQuery.isFetching || coursesQuery.isLoading) {
      return "Syncing";
    }
    return "Synced";
  }, [coursesQuery.isFetching, coursesQuery.isLoading, isOnline]);
  const {
    favorites,
    tags,
    lastOpened,
    offlineFiles,
    sectionOrder,
    cacheConfig,
    toggleFavorite,
    markOpened,
    removeOfflineFiles,
    updateSectionOrder,
  } = useStudyMaterialsPreferences(user?.uid ?? null);
  const cacheLimitMb = cacheConfig.limitMb ?? null;
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
  const gridClass = useMemo(
    () =>
      "grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    [],
  );
  const rowClass = useMemo(() => "space-y-3", []);
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

  const handleBackNavigation = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let timer: number | null = null;
    const update = () => {
      setCanDragSections(window.matchMedia("(pointer: fine)").matches);
    };
    const schedule = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(update, 150);
    };
    update();
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (commandOpen) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        setCommandOpen(true);
        return;
      }

      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandOpen]);

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

  const commandItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      {
        id: "nav-offline",
        label: "Go to Offline Study Materials",
        description: "See cached files only",
        group: "Navigation",
        onSelect: () => router.push("/resources/offline"),
      },
      {
        id: "nav-settings",
        label: "Open Study Materials Settings",
        description: "Cache limits and offline mode",
        group: "Navigation",
        onSelect: () => router.push("/resources/settings"),
      },
    ];

    courses.forEach((course) => {
      items.push({
        id: `course-${course.courseID}`,
        label: course.courseName || course.courseID,
        description: "Open course resources",
        group: "Courses",
        keywords: course.courseID,
        onSelect: () => handleOpenCourse(course.courseID),
      });
    });

    return items;
  }, [courses, handleOpenCourse, router]);

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

  const announceReorder = useCallback(
    (sectionId: string, nextIndex: number, total: number) => {
      const label = SECTION_LABELS[sectionId] ?? sectionId;
      setReorderAnnouncement(
        `${label} moved to position ${nextIndex + 1} of ${total}.`,
      );
    },
    [],
  );

  const moveSection = useCallback(
    (sectionId: string, direction: "up" | "down") => {
      const index = orderedSections.indexOf(sectionId);
      if (index === -1) return;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= orderedSections.length) return;
      const nextOrder = orderedSections.slice();
      nextOrder.splice(index, 1);
      nextOrder.splice(nextIndex, 0, sectionId);
      updateSectionOrder(nextOrder);
      announceReorder(sectionId, nextIndex, nextOrder.length);
    },
    [announceReorder, orderedSections, updateSectionOrder],
  );

  const handleReorderKeyDown = useCallback(
    (sectionId: string) => (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSection(sectionId, "up");
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSection(sectionId, "down");
      }
    },
    [moveSection],
  );

  const handleDragStart = useCallback(
    (sectionId: string) => (event: React.DragEvent<HTMLButtonElement>) => {
      if (!canDragSections) return;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", sectionId);
      setDraggingSectionId(sectionId);
    },
    [canDragSections],
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
      announceReorder(sourceId, toIndex, nextOrder.length);
    },
    [announceReorder, draggingSectionId, orderedSections, updateSectionOrder],
  );

  const handleDragOver = useCallback(
    (sectionId: string) => (event: React.DragEvent<HTMLDivElement>) => {
      if (!canDragSections) return;
      event.preventDefault();
      if (dragOverSectionId !== sectionId) {
        setDragOverSectionId(sectionId);
      }
    },
    [canDragSections, dragOverSectionId],
  );

  const offlineCourses = useMemo(() => {
    const offlineEntries = Object.values(offlineFiles);
    const courseIds = new Set(
      offlineEntries.map((entry) => entry.courseId).filter(Boolean) as string[],
    );
    if (courseIds.size === 0) return [];
    return filteredCourses.filter((course) => courseIds.has(course.courseID));
  }, [filteredCourses, offlineFiles]);

  const removeOfflineEntry = useCallback(
    async (resourceId: string, fileId?: string) => {
      await removeCachedFile(resourceId);
      if (fileId) {
        await removeOfflineFolderFile(fileId);
      }
    },
    [],
  );


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

  const getCourseResourceId = useCallback((course: ResourceCourse) => {
    return courseResourceIds.get(course.courseID) ?? null;
  }, [courseResourceIds]);

  const renderSectionHeader = useCallback(
    (label: string, sectionId: string) => {
      const index = orderedSections.indexOf(sectionId);
      const isFirst = index <= 0;
      const isLast = index === orderedSections.length - 1;
      return (
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              aria-label={`Reorder ${label} section`}
              aria-keyshortcuts="ArrowUp ArrowDown"
              draggable={canDragSections}
              onDragStart={handleDragStart(sectionId)}
              onDragEnd={handleDragEnd}
              onKeyDown={handleReorderKeyDown(sectionId)}
              className={cn(
                "h-7 w-7 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] transition-transform motion-reduce:transition-none",
                canDragSections
                  ? "cursor-grab active:cursor-grabbing active:scale-95"
                  : "cursor-default opacity-80",
              )}
              title="Drag or use arrow keys to reorder"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
            <h2 className="text-sm font-black uppercase tracking-wide text-stone-700 truncate">
              {label}
            </h2>
            {!canDragSections && (
              <span className="text-[10px] font-black uppercase text-stone-400">
                Tap arrows
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!canDragSections && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveSection(sectionId, "up")}
                  aria-label={`Move ${label} up`}
                  disabled={isFirst}
                  className="h-7 w-7 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] transition-transform active:scale-95 motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(sectionId, "down")}
                  aria-label={`Move ${label} down`}
                  disabled={isLast}
                  className="h-7 w-7 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] transition-transform active:scale-95 motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {draggingSectionId === sectionId && (
              <span className="text-[10px] font-black uppercase text-stone-500">
                Dragging
              </span>
            )}
          </div>
        </div>
      );
    },
    [
      canDragSections,
      draggingSectionId,
      handleDragEnd,
      handleDragStart,
      handleReorderKeyDown,
      moveSection,
      orderedSections,
    ],
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
    <div className="min-h-screen bg-neutral-50 pb-24 transition-colors duration-300 relative isolate overflow-x-hidden">
      <DotPatternBackground />

      <div className="mx-auto max-w-5xl relative z-10">
        <p className="sr-only" aria-live="polite">
          {reorderAnnouncement}
        </p>
        <header className="bg-white border-b-4 border-black px-4 py-4 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBackNavigation}
              aria-label="Go back"
              className="h-10 w-10 border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0_#0a0a0a] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0a0a0a] hover:bg-yellow-50 active:translate-y-0 active:shadow-[2px_2px_0_#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="flex-1 font-display text-xl sm:text-2xl font-black uppercase text-stone-900 tracking-tight truncate">
              Study Materials
            </h1>
            <Menu open={overflowOpen} onOpenChange={setOverflowOpen}>
              <Menu.Trigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="h-10 w-10 border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0_#0a0a0a] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0a0a0a] hover:bg-yellow-50 active:translate-y-0 active:shadow-[2px_2px_0_#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </Menu.Trigger>
              <Menu.Content
                align="end"
                sideOffset={8}
                className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] min-w-[200px] max-w-[calc(100vw-2rem)] max-h-[min(60svh,320px)] overflow-y-auto"
              >
                <div className="px-3 py-2 text-[10px] font-black uppercase text-stone-500 border-b border-stone-200">
                  Status: {syncStatus}
                </div>
                <Menu.Item
                  className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                  onSelect={() => router.push("/resources/offline")}
                >
                  Offline Materials
                </Menu.Item>
                <Menu.Item
                  className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                  onSelect={() => setCommandOpen(true)}
                >
                  Command Center
                </Menu.Item>
                <Menu.Item
                  className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                  onSelect={() => setShortcutsOpen(true)}
                >
                  Keyboard Shortcuts
                </Menu.Item>
                <Menu.Item
                  className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                  onSelect={() => router.push("/resources/settings")}
                >
                  Settings
                </Menu.Item>
              </Menu.Content>
            </Menu>
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
              ref={searchInputRef}
            />
          </div>
        </section>

        {activeTab === "academic" ? (
          <section className="bg-white border-b-4 border-black px-4 py-6 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
            {coursesQuery.isError ? (
              <div className="border-2 border-black bg-red-50 p-6 shadow-[4px_4px_0px_0px_#000]">
                <p className="text-sm font-bold text-red-600">
                  Unable to load resources. Please try again.
                </p>
                <div className="mt-4">
                  <OfflineFallbackButton />
                </div>
              </div>
            ) : coursesQuery.isLoading ? (
              <div className={gridClass}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <RetroSkeleton
                    key={index}
                    className="w-full aspect-[4/3] sm:aspect-square"
                  />
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
                      <div className={gridClass} style={listVisibilityStyle}>
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
                              onOpenCourse={handleOpenCourse}
                              onToggleFavorite={handleToggleFavorite}
                              variant="grid"
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
                          <div className={rowClass} style={listVisibilityStyle}>
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
                                  onOpenCourse={handleOpenCourse}
                                  onToggleFavorite={handleToggleFavorite}
                                  variant="row"
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
                          <div className={rowClass} style={listVisibilityStyle}>
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
                                  onOpenCourse={handleOpenCourse}
                                  onToggleFavorite={handleToggleFavorite}
                                  variant="row"
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
                          <div className={rowClass} style={listVisibilityStyle}>
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
                                  onOpenCourse={handleOpenCourse}
                                  onToggleFavorite={handleToggleFavorite}
                                  variant="row"
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
                          <div className={rowClass} style={listVisibilityStyle}>
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
                                  onOpenCourse={handleOpenCourse}
                                  onToggleFavorite={handleToggleFavorite}
                                  variant="row"
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

      <CommandCenter
        open={commandOpen}
        onOpenChange={setCommandOpen}
        items={commandItems}
        placeholder="Search courses or commands"
        emptyLabel="No matching courses."
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      <ShortcutsSheet
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        shortcuts={[
          { keys: "/", label: "Focus search" },
          { keys: "⌘K / Ctrl+K", label: "Open Command Center" },
        ]}
      />
    </div>
  );
}
