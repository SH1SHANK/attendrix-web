"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckSquare,
  Download,
  FileText,
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileVideo2,
  Folder,
  FolderOpen,
  MoreVertical,
  Pin,
  Settings,
  Presentation,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Star,
  Tag,
  WifiOff,
} from "lucide-react";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import { RetroSkeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useDriveFolder, useResourceCourses } from "@/hooks/useResources";
import { useStudyMaterialsPreferences } from "@/hooks/useStudyMaterialsPreferences";
import { useOfflineStorageUsage } from "@/hooks/useOfflineStorageUsage";
import { Menu } from "@/components/ui/Menu";
import { Drawer } from "@/components/ui/Drawer";
import { toast } from "sonner";
import {
  buildResourceId,
  buildResourcePath,
  parseResourceId,
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
import { OfflineFallbackButton } from "@/components/resources/OfflineFallbackButton";
import { CommandCenter, type CommandItem } from "@/components/resources/CommandCenter";
import { ShortcutsSheet } from "@/components/resources/ShortcutsSheet";

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

const DOC_MIMES = new Set([
  GOOGLE_DOC,
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const SHEET_MIMES = new Set([
  GOOGLE_SHEET,
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const SLIDE_MIMES = new Set([
  GOOGLE_SLIDES,
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const TAG_COLORS = [
  { id: "sun", label: "Sun", value: "#FDE68A" },
  { id: "mint", label: "Mint", value: "#BBF7D0" },
  { id: "sky", label: "Sky", value: "#BFDBFE" },
  { id: "rose", label: "Rose", value: "#FBCFE8" },
  { id: "violet", label: "Violet", value: "#DDD6FE" },
  { id: "apricot", label: "Apricot", value: "#FED7AA" },
  { id: "lemon", label: "Lemon", value: "#FEF9C3" },
  { id: "slate", label: "Slate", value: "#E2E8F0" },
  { id: "teal", label: "Teal", value: "#CCFBF1" },
  { id: "peach", label: "Peach", value: "#FFE4E6" },
];

const AI_PROVIDERS = [
  { id: "chatgpt", label: "ChatGPT", href: "https://chat.openai.com/" },
  { id: "gemini", label: "Gemini", href: "https://gemini.google.com/" },
  { id: "other", label: "Other", href: "https://www.google.com/" },
] as const;

const normalizeTagKey = (value: string) => value.trim().toLowerCase();

const hashTag = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 2147483647;
  }
  return hash;
};

const pickTagColor = (value: string) => {
  const index = Math.abs(hashTag(value)) % TAG_COLORS.length;
  return TAG_COLORS[index]?.value ?? "#E2E8F0";
};

const buildDriveLink = (link?: string, email?: string | null) => {
  if (!link) return null;
  if (!email) return link;
  try {
    const url = new URL(link);
    url.searchParams.set("authuser", email);
    return url.toString();
  } catch {
    return link;
  }
};

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

const getMimeLabel = (mimeType?: string, name?: string) => {
  if (mimeType === DRIVE_FOLDER_MIME) return "Folder";
  if (DOC_MIMES.has(mimeType ?? "")) return "DOC";
  if (SHEET_MIMES.has(mimeType ?? "")) return "XLSX";
  if (SLIDE_MIMES.has(mimeType ?? "")) return "PPTX";
  if (mimeType === PDF_MIME) return "PDF";
  if ((mimeType ?? "").startsWith("image/")) return "Image";
  if ((mimeType ?? "").startsWith("video/")) return "Video";
  if ((mimeType ?? "").startsWith("audio/")) return "Audio";
  if (ARCHIVE_MIMES.has(mimeType ?? "")) return "Archive";
  if ((mimeType ?? "").includes("json")) return "JSON";
  if ((mimeType ?? "").startsWith("text/")) return "Text";
  if (name && name.includes(".")) {
    const ext = name.split(".").pop();
    if (ext) return ext.toUpperCase();
  }
  return "File";
};

const getItemIcon = (mimeType?: string) => {
  if (mimeType === DRIVE_FOLDER_MIME) return Folder;
  if (DOC_MIMES.has(mimeType ?? "") || mimeType === PDF_MIME) return FileText;
  if (SHEET_MIMES.has(mimeType ?? "")) return FileSpreadsheet;
  if (SLIDE_MIMES.has(mimeType ?? "")) return Presentation;
  if ((mimeType ?? "").startsWith("image/")) return FileImage;
  if ((mimeType ?? "").startsWith("video/")) return FileVideo2;
  if ((mimeType ?? "").startsWith("audio/")) return FileAudio;
  if ((mimeType ?? "").includes("json") || (mimeType ?? "").includes("xml")) {
    return FileCode;
  }
  if (ARCHIVE_MIMES.has(mimeType ?? "")) return FileArchive;
  return FileIcon;
};

const ROW_TONES = {
  folder: {
    row: "bg-[linear-gradient(90deg,#FDE68A_0,#FDE68A_8px,transparent_8px)]",
    icon: "bg-[#FFD700]",
  },
  pdf: {
    row: "bg-[linear-gradient(90deg,#FECACA_0,#FECACA_8px,transparent_8px)]",
    icon: "bg-[#FEE2E2]",
  },
  slides: {
    row: "bg-[linear-gradient(90deg,#DDD6FE_0,#DDD6FE_8px,transparent_8px)]",
    icon: "bg-[#E9D5FF]",
  },
  docs: {
    row: "bg-[linear-gradient(90deg,#BFDBFE_0,#BFDBFE_8px,transparent_8px)]",
    icon: "bg-[#DBEAFE]",
  },
  archives: {
    row: "bg-[linear-gradient(90deg,#FED7AA_0,#FED7AA_8px,transparent_8px)]",
    icon: "bg-[#FFEDD5]",
  },
  default: {
    row: "bg-[linear-gradient(90deg,#E5E7EB_0,#E5E7EB_8px,transparent_8px)]",
    icon: "bg-white",
  },
};

const getRowTone = (mimeType?: string) => {
  if (mimeType === DRIVE_FOLDER_MIME) return ROW_TONES.folder;
  if (mimeType === PDF_MIME) return ROW_TONES.pdf;
  if (SLIDE_MIMES.has(mimeType ?? "")) return ROW_TONES.slides;
  if (DOC_MIMES.has(mimeType ?? "")) return ROW_TONES.docs;
  if (ARCHIVE_MIMES.has(mimeType ?? "")) return ROW_TONES.archives;
  return ROW_TONES.default;
};

const parseSearchQuery = (input: string) => {
  const [text = "", ...tagSegments] = input.split("/");
  const tags = tagSegments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  return { text: text.trim(), tags };
};

const buildSearchValue = (text: string, tags: string[]) => {
  const tagPart = tags.map((tag) => `/${tag}`).join(" ");
  return [text.trim(), tagPart].filter(Boolean).join(" ").trim();
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
  userEmail?: string | null;
  courses?: ResourceCourse[];
  preferences: ReturnType<typeof useStudyMaterialsPreferences>;
};

type TagOption = {
  key: string;
  label: string;
  color: string;
};

type TagDrawerState = {
  mode: "single" | "bulk";
  action?: "add" | "remove";
  resourceIds: string[];
  name: string;
};

function ResourceCourseBrowser({
  course,
  rootFolderId,
  userId,
  userEmail,
  courses,
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
  const [aiTarget, setAiTarget] = useState<{
    item: DriveItem;
    resourceId: string;
  } | null>(null);
  const [aiChoice, setAiChoice] = useState<(typeof AI_PROVIDERS)[number] | null>(
    null,
  );
  const [aiBusy, setAiBusy] = useState(false);
  const [accountNotice, setAccountNotice] = useState<{
    link: string;
    email: string;
  } | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [mimeFilter, setMimeFilter] = useState<
    "all" | "pdf" | "slides" | "docs" | "archives"
  >("all");
  const [courseFilter, setCourseFilter] = useState<
    "all" | "pyq" | "offline" | "starred"
  >("all");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    () => new Set(),
  );
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<string | null>(null);
  const [tagDrawer, setTagDrawer] = useState<TagDrawerState | null>(null);
  const [tagSelection, setTagSelection] = useState<Set<string>>(
    () => new Set(),
  );
  const [tagSearch, setTagSearch] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(
    TAG_COLORS[0]?.value ?? "#E2E8F0",
  );
  const [duplicateTagKey, setDuplicateTagKey] = useState<string | null>(null);
  const accessStatsRef = useRef<Record<
    string,
    { count: number; lastAccessed: string }
  >>({});
  const [accessStatsTick, setAccessStatsTick] = useState(0);
  const [cleanupDismissed, setCleanupDismissed] = useState(false);
  const [folderStack, setFolderStack] = useState<
    Array<{ id: string; name: string }>
  >([{ id: rootFolderId, name: course.courseName || course.courseID }]);
  const [isCompactBreadcrumb, setIsCompactBreadcrumb] = useState(false);
  const breadcrumbRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const previousDepthRef = useRef(1);
  const courseList = useMemo(() => courses ?? [], [courses]);
  const clampStyle = useMemo(
    () =>
      ({
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }) as React.CSSProperties,
    [],
  );
  const listVisibilityStyle = useMemo(
    () =>
      ({
        contentVisibility: "auto",
        containIntrinsicSize: "1px 720px",
      }) as React.CSSProperties,
    [],
  );
  const quickFiltersBase = useMemo(
    () =>
      [
        { id: "all", label: "All" },
        { id: "pdf", label: "PDFs", mime: "pdf" },
        { id: "slides", label: "Slides", mime: "slides" },
        { id: "docs", label: "Docs", mime: "docs" },
        { id: "archives", label: "Archives", mime: "archives" },
        { id: "pyq", label: "PYQs", course: "pyq" },
        { id: "offline", label: "Offline", course: "offline" },
        { id: "starred", label: "Starred", course: "starred" },
      ] as const,
    [],
  );

  const currentFolder = folderStack[folderStack.length - 1];
  const driveQuery = useDriveFolder(currentFolder?.id ?? null);
  const {
    favorites,
    tags,
    tagPalette,
    tagPins,
    lastOpened,
    offlineFiles,
    cacheConfig,
    offlineStorageMode,
    toggleFavorite,
    setTags,
    setTagsBatch,
    upsertTagPalette,
    toggleTagPin,
    markOpened,
    setOfflineFile,
    removeOfflineFiles,
    updateOfflineStorageMode,
  } = preferences;
  const storageUsage = useOfflineStorageUsage(
    offlineFiles,
    cacheConfig.limitMb ?? null,
  );

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

  const tagLibrary = useMemo(() => {
    const library = new Map<string, TagOption>();
    Object.entries(tagPalette ?? {}).forEach(([key, meta]) => {
      if (!meta) return;
      const normalized = normalizeTagKey(key);
      library.set(normalized, {
        key: normalized,
        label: meta.label,
        color: meta.color,
      });
    });
    Object.values(tags).forEach((list) => {
      list?.forEach((tag) => {
        const normalized = normalizeTagKey(tag);
        if (library.has(normalized)) return;
        library.set(normalized, {
          key: normalized,
          label: tag,
          color: pickTagColor(normalized),
        });
      });
    });
    return library;
  }, [tagPalette, tags]);

  const pinnedTagSet = useMemo(() => new Set(tagPins), [tagPins]);

  const tagOptions = useMemo(() => {
    return Array.from(tagLibrary.values()).sort((a, b) => {
      const aPinned = pinnedTagSet.has(a.key);
      const bPinned = pinnedTagSet.has(b.key);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return a.label.localeCompare(b.label);
    });
  }, [pinnedTagSet, tagLibrary]);

  const resolveTagOption = useCallback(
    (tag: string) => {
      const normalized = normalizeTagKey(tag);
      return (
        tagLibrary.get(normalized) ?? {
          key: normalized,
          label: tag,
          color: pickTagColor(normalized),
        }
      );
    },
    [tagLibrary],
  );

  const storeScrollPosition = useCallback(() => {
    if (typeof window === "undefined") return;
    scrollPositionsRef.current[pathKey] = window.scrollY;
  }, [pathKey]);

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
    let timer: number | null = null;
    const update = () => {
      setIsCompactBreadcrumb(
        window.matchMedia("(max-width: 640px)").matches,
      );
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
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [rootFolderId]);

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
    const currentDepth = folderStack.length;
    const previousDepth = previousDepthRef.current;
    if (currentDepth > previousDepth) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } else if (currentDepth < previousDepth) {
      const stored = scrollPositionsRef.current[pathKey];
      window.scrollTo({
        top: typeof stored === "number" ? stored : 0,
        left: 0,
        behavior: "auto",
      });
    }
    previousDepthRef.current = currentDepth;
  }, [folderStack.length, pathKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = `resources.course.${course.courseID}.path`;
    window.sessionStorage.setItem(storageKey, JSON.stringify(folderStack));
  }, [course.courseID, folderStack]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const statsKey = `resources.course.${course.courseID}.accessStats`;
    try {
      const raw = window.sessionStorage.getItem(statsKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<
          string,
          { count: number; lastAccessed: string }
        >;
        if (parsed && typeof parsed === "object") {
          accessStatsRef.current = parsed;
        }
      }
    } catch {
      accessStatsRef.current = {};
    }
  }, [course.courseID]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissKey = `resources.course.${course.courseID}.cleanupDismissed`;
    setCleanupDismissed(window.sessionStorage.getItem(dismissKey) === "1");
  }, [course.courseID]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissKey = `resources.course.${course.courseID}.cleanupDismissed`;
    if (cleanupDismissed) {
      window.sessionStorage.setItem(dismissKey, "1");
    } else {
      window.sessionStorage.removeItem(dismissKey);
    }
  }, [cleanupDismissed, course.courseID]);

  useEffect(() => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  }, [pathKey]);

  useEffect(() => {
    if (!currentFolder?.id) return;
    const resourceId = getResourceId(currentFolder.id);
    markOpened(resourceId);
  }, [currentFolder?.id, getResourceId, markOpened]);

  const tagSearchIndex = useMemo(() => {
    const index = new Map<string, Set<string>>();
    Object.entries(tags).forEach(([resourceId, list]) => {
      if (!list || list.length === 0) return;
      index.set(
        resourceId,
        new Set(list.map((tag) => normalizeTagKey(tag))),
      );
    });
    return index;
  }, [tags]);

  const parsedSearch = useMemo(() => {
    const parsed = parseSearchQuery(deferredSearchTerm);
    return {
      text: parsed.text.trim().toLowerCase(),
      tagKeys: parsed.tags.map((tag) => normalizeTagKey(tag)),
    };
  }, [deferredSearchTerm]);

  const baseItems = useMemo(() => {
    const items = driveQuery.data ?? [];
    const { text, tagKeys } = parsedSearch;
    if (!text && tagKeys.length === 0) return items;
    return items.filter((item) => {
      const resourceId = getResourceId(item.id);
      const itemTags = tagSearchIndex.get(resourceId) ?? new Set();
      const matchesText = !text || item.name.toLowerCase().includes(text);
      const matchesTags =
        tagKeys.length === 0 ||
        tagKeys.every((tag) => itemTags.has(tag));
      return matchesText && matchesTags;
    });
  }, [driveQuery.data, getResourceId, parsedSearch, tagSearchIndex]);

  const availableFilters = useMemo(() => {
    const availability = {
      pdf: false,
      slides: false,
      docs: false,
      archives: false,
      pyq: false,
      offline: false,
      starred: false,
    };
    baseItems.forEach((item) => {
      const resourceId = getResourceId(item.id);
      const name = item.name.toLowerCase();
      if (name.includes("pyq") || name.includes("previous year")) {
        availability.pyq = true;
      }
      if (offlineFiles[resourceId]) {
        availability.offline = true;
      }
      if (favorites[resourceId]) {
        availability.starred = true;
      }
      if (item.mimeType === DRIVE_FOLDER_MIME) return;
      if (item.mimeType === PDF_MIME) availability.pdf = true;
      if (SLIDE_MIMES.has(item.mimeType)) availability.slides = true;
      if (DOC_MIMES.has(item.mimeType)) availability.docs = true;
      if (ARCHIVE_MIMES.has(item.mimeType)) availability.archives = true;
    });
    return availability;
  }, [baseItems, favorites, getResourceId, offlineFiles]);

  const quickFilters = useMemo(() => {
    return quickFiltersBase.filter((option) => {
      if (option.id === "all") return true;
      if ("mime" in option) {
        return availableFilters[option.mime];
      }
      if ("course" in option) {
        return availableFilters[option.course];
      }
      return false;
    });
  }, [availableFilters, quickFiltersBase]);

  const activeMimeFilter = useMemo(() => {
    if (mimeFilter === "all") return "all";
    return availableFilters[mimeFilter] ? mimeFilter : "all";
  }, [availableFilters, mimeFilter]);

  const activeCourseFilter = useMemo(() => {
    if (courseFilter === "all") return "all";
    return availableFilters[courseFilter] ? courseFilter : "all";
  }, [availableFilters, courseFilter]);

  const matchesMimeFilter = useCallback(
    (item: DriveItem) => {
      if (activeMimeFilter === "all") return true;
      if (item.mimeType === DRIVE_FOLDER_MIME) return false;
      if (activeMimeFilter === "pdf") return item.mimeType === PDF_MIME;
      if (activeMimeFilter === "slides") return SLIDE_MIMES.has(item.mimeType);
      if (activeMimeFilter === "docs") return DOC_MIMES.has(item.mimeType);
      if (activeMimeFilter === "archives") return ARCHIVE_MIMES.has(item.mimeType);
      return true;
    },
    [activeMimeFilter],
  );

  const matchesCourseFilter = useCallback(
    (item: DriveItem, resourceId: string) => {
      if (activeCourseFilter === "all") return true;
      if (activeCourseFilter === "offline") {
        return Boolean(offlineFiles[resourceId]);
      }
      if (activeCourseFilter === "starred") {
        return Boolean(favorites[resourceId]);
      }
      if (activeCourseFilter === "pyq") {
        const name = item.name.toLowerCase();
        return name.includes("pyq") || name.includes("previous year");
      }
      return true;
    },
    [activeCourseFilter, favorites, offlineFiles],
  );

  const filteredItems = useMemo(() => {
    const items = baseItems;
    const hasFilters =
      activeMimeFilter !== "all" || activeCourseFilter !== "all";
    if (!hasFilters) return items;
    return items.filter((item) => {
      const resourceId = getResourceId(item.id);
      const matchesMime = matchesMimeFilter(item);
      const matchesCourse = matchesCourseFilter(item, resourceId);
      return matchesMime && matchesCourse;
    });
  }, [
    baseItems,
    getResourceId,
    matchesCourseFilter,
    matchesMimeFilter,
    activeCourseFilter,
    activeMimeFilter,
  ]);

  const liveSearch = useMemo(
    () => parseSearchQuery(searchTerm),
    [searchTerm],
  );
  const activeSearchTags = useMemo(
    () => liveSearch.tags.map((tag) => resolveTagOption(tag)),
    [liveSearch.tags, resolveTagOption],
  );
  const activeSearchKeys = useMemo(
    () => new Set(liveSearch.tags.map((tag) => normalizeTagKey(tag))),
    [liveSearch.tags],
  );
  const tagQueryFragment = useMemo(() => {
    if (!searchTerm.includes("/")) return "";
    const parts = searchTerm.split("/");
    return (parts[parts.length - 1] ?? "").trim().toLowerCase();
  }, [searchTerm]);
  const showTagSuggestions = searchFocused && searchTerm.includes("/");
  const filteredTagSuggestions = useMemo(() => {
    if (tagOptions.length === 0) return [];
    if (!tagQueryFragment) return tagOptions;
    return tagOptions.filter((option) =>
      option.label.toLowerCase().includes(tagQueryFragment),
    );
  }, [tagOptions, tagQueryFragment]);

  const toggleSearchTag = useCallback(
    (option: TagOption) => {
      setSearchTerm((prev) => {
        const parsed = parseSearchQuery(prev);
        const existing = parsed.tags;
        const existingKeys = existing.map((tag) => normalizeTagKey(tag));
        const hasPartial =
          existing.length > 0 &&
          !tagLibrary.has(normalizeTagKey(existing[existing.length - 1] ?? ""));
        const baseTags = hasPartial ? existing.slice(0, -1) : existing;
        let nextTags: string[] = [];
        if (existingKeys.includes(option.key)) {
          nextTags = baseTags.filter(
            (tag) => normalizeTagKey(tag) !== option.key,
          );
        } else {
          nextTags = [...baseTags, option.label];
        }
        return buildSearchValue(parsed.text, nextTags);
      });
    },
    [tagLibrary],
  );

  const tagDrawerPool = useMemo(() => {
    if (!tagDrawer || tagDrawer.mode !== "bulk") return null;
    const pool = new Set<string>();
    tagDrawer.resourceIds.forEach((resourceId) => {
      (tags[resourceId] ?? []).forEach((tag) => {
        pool.add(normalizeTagKey(tag));
      });
    });
    return pool;
  }, [tagDrawer, tags]);

  const filteredDrawerTags = useMemo(() => {
    if (!tagDrawer) return [];
    let options = tagOptions;
    if (tagDrawer.mode === "bulk" && tagDrawer.action === "remove") {
      options = options.filter((option) => tagDrawerPool?.has(option.key));
    }
    if (tagSearch.trim()) {
      const query = tagSearch.trim().toLowerCase();
      options = options.filter((option) =>
        option.label.toLowerCase().includes(query),
      );
    }
    return options;
  }, [tagDrawer, tagOptions, tagDrawerPool, tagSearch]);

  const selectedDrawerTags = useMemo(() => {
    return Array.from(tagSelection).map((key) =>
      tagLibrary.get(key) ?? {
        key,
        label: key,
        color: pickTagColor(key),
      },
    );
  }, [tagLibrary, tagSelection]);

  const itemLookup = useMemo(() => {
    return new Map((driveQuery.data ?? []).map((item) => [item.id, item]));
  }, [driveQuery.data]);

  const suggestedTags = useMemo(() => {
    if (!tagDrawer || tagDrawer.mode !== "single") return [];
    const resourceId = tagDrawer.resourceIds[0];
    if (!resourceId) return [];
    const parsed = parseResourceId(resourceId);
    const item =
      parsed?.itemId && itemLookup.has(parsed.itemId)
        ? itemLookup.get(parsed.itemId)
        : null;
    const name = (item?.name ?? tagDrawer.name ?? "").toLowerCase();
    const mimeType = item?.mimeType ?? "";
    const folderContext = folderStack
      .map((folder) => folder.name.toLowerCase())
      .join(" ");
    const suggestions = new Set<string>();

    if (name.includes("pyq") || name.includes("previous year")) {
      suggestions.add("PYQ");
    }
    if (name.includes("assignment") || name.includes("homework") || name.includes("hw")) {
      suggestions.add("Assignment");
    }
    if (folderContext.includes("lab")) {
      suggestions.add("Lab");
    }
    if (folderContext.includes("exam") || folderContext.includes("midsem")) {
      suggestions.add("Exam");
    }
    if (DOC_MIMES.has(mimeType) || mimeType === GOOGLE_DOC) {
      suggestions.add("Notes");
    }
    if (SHEET_MIMES.has(mimeType)) {
      suggestions.add("Sheets");
    }
    if (SLIDE_MIMES.has(mimeType)) {
      suggestions.add("Slides");
    }
    if (mimeType === PDF_MIME) {
      suggestions.add("PDF");
    }
    if (ARCHIVE_MIMES.has(mimeType)) {
      suggestions.add("Archive");
    }

    return Array.from(suggestions)
      .map((label) => resolveTagOption(label))
      .filter((tag) => !tagSelection.has(tag.key));
  }, [
    folderStack,
    itemLookup,
    resolveTagOption,
    tagDrawer,
    tagSelection,
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

  const resolveResourceLabel = useCallback(
    (resourceId: string) => {
      const parsed = parseResourceId(resourceId);
      const itemId = parsed?.itemId;
      const item = itemId ? itemLookup.get(itemId) : undefined;
      return item?.name ?? offlineFiles[resourceId]?.name ?? "Offline file";
    },
    [itemLookup, offlineFiles],
  );

  const offlineItems = useMemo(() => {
    return Object.entries(offlineFiles)
      .map(([resourceId, meta]) => ({
        resourceId,
        meta,
        item: meta.fileId ? itemLookup.get(meta.fileId) : undefined,
      }))
      .filter((entry) => entry.meta.courseId === course.courseID);
  }, [course.courseID, itemLookup, offlineFiles]);

  const syncStatus = useMemo(() => {
    if (!isOnline) return "Offline";
    if (driveQuery.isFetching || driveQuery.isLoading || offlinePending.size > 0) {
      return "Syncing";
    }
    return "Synced";
  }, [driveQuery.isFetching, driveQuery.isLoading, isOnline, offlinePending.size]);

  const cleanupSummary = useMemo(() => {
    if (storageUsage.limitBytes === Infinity) return null;
    if (!Number.isFinite(storageUsage.limitBytes)) return null;
    if (storageUsage.limitBytes <= 0) return null;
    const usageRatio =
      storageUsage.usedBytes / storageUsage.limitBytes + accessStatsTick * 0;
    if (usageRatio < 0.85) return null;

    const entries = Object.entries(offlineFiles).map(
      ([resourceId, meta]) => ({
        resourceId,
        meta,
        size: Number(meta.size) || 0,
        lastUsed:
          accessStatsRef.current[resourceId]?.lastAccessed ||
          lastOpened[resourceId] ||
          meta.cachedAt,
      }),
    );
    if (entries.length === 0) return null;

    const largest = entries
      .slice()
      .sort((a, b) => b.size - a.size)
      .slice(0, 3);
    const leastUsed = entries
      .slice()
      .sort(
        (a, b) =>
          new Date(a.lastUsed).getTime() - new Date(b.lastUsed).getTime(),
      )
      .slice(0, 3);

    return {
      usageRatio,
      largest,
      leastUsed,
    };
  }, [
    accessStatsTick,
    lastOpened,
    offlineFiles,
    storageUsage.limitBytes,
    storageUsage.usedBytes,
  ]);

  const shouldCollapseBreadcrumb =
    isCompactBreadcrumb && folderStack.length > 3;
  const breadcrumbMiddle = useMemo(
    () => folderStack.slice(1, -2),
    [folderStack],
  );
  const breadcrumbTail = useMemo(
    () => folderStack.slice(-2),
    [folderStack],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = breadcrumbRef.current;
    if (!target) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target.scrollTo({
      left: target.scrollWidth,
      behavior: prefersReduced ? "auto" : "smooth",
    });
  }, [folderStack.length]);

  const handleOpenFolder = useCallback(
    (id: string, name: string) => {
      storeScrollPosition();
      const resourceId = getResourceId(id);
      markOpened(resourceId);
      setFolderStack((prev) => [...prev, { id, name }]);
    },
    [getResourceId, markOpened, storeScrollPosition],
  );

  const handleBreadcrumb = useCallback(
    (index: number) => {
      storeScrollPosition();
      setFolderStack((prev) => prev.slice(0, index + 1));
    },
    [storeScrollPosition],
  );

  const handleCourseBack = useCallback(() => {
    if (folderStack.length > 1) {
      handleBreadcrumb(folderStack.length - 2);
      return;
    }
    router.push("/dashboard");
  }, [folderStack.length, handleBreadcrumb, router]);

  const openDriveLink = useCallback(
    (link?: string) => {
      const target = buildDriveLink(link, userEmail);
      if (!target) return false;
      const opened = window.open(target, "_blank", "noopener,noreferrer");
      if (!opened && userEmail) {
        setAccountNotice({ link: target, email: userEmail });
      } else if (userEmail && !accountNotice) {
        setAccountNotice({ link: target, email: userEmail });
      }
      return Boolean(opened);
    },
    [accountNotice, userEmail],
  );

  const toggleSelection = useCallback((resourceId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedItems(new Set());
  }, []);

  const handleSelectionToggle = useCallback(() => {
    if (selectionMode) {
      exitSelectionMode();
    } else {
      setSelectionMode(true);
    }
  }, [exitSelectionMode, selectionMode]);

  useEffect(() => {
    if (focusMode) {
      exitSelectionMode();
    }
  }, [exitSelectionMode, focusMode]);

  const handleLongPressStart = useCallback(
    (resourceId: string) => (event: React.PointerEvent) => {
      if (event.pointerType !== "touch") return;
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = resourceId;
        setSelectionMode(true);
        setSelectedItems((prev) => {
          const next = new Set(prev);
          next.add(resourceId);
          return next;
        });
      }, 450);
    },
    [],
  );

  const handleLongPressCancel = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handlePrimaryAction = useCallback(
    (resourceId: string, action: () => void) => (event: React.PointerEvent | React.MouseEvent) => {
      if (longPressTriggeredRef.current === resourceId) {
        longPressTriggeredRef.current = null;
        event.preventDefault();
        return;
      }
      if (selectionMode) {
        event.preventDefault();
        toggleSelection(resourceId);
        return;
      }
      action();
    },
    [selectionMode, toggleSelection],
  );

  const recordAccess = useCallback(
    (resourceId: string) => {
      if (typeof window === "undefined") return;
      const statsKey = `resources.course.${course.courseID}.accessStats`;
      const now = new Date().toISOString();
      const current = accessStatsRef.current[resourceId];
      accessStatsRef.current[resourceId] = {
        count: current ? current.count + 1 : 1,
        lastAccessed: now,
      };
      try {
        window.sessionStorage.setItem(
          statsKey,
          JSON.stringify(accessStatsRef.current),
        );
      } catch {
        return;
      }
      setAccessStatsTick((prev) => prev + 1);
    },
    [course.courseID],
  );

  const triggerHaptic = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!("vibrate" in navigator)) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    navigator.vibrate(10);
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
          recordAccess(resourceId);
          return true;
        }
      }

      const cached = await readCachedFile(resourceId);
      if (!cached) return false;
      const blob = await cached.blob();
      openBlob(blob);
      recordAccess(resourceId);
      return true;
    },
    [offlineFiles, offlineStorageMode, openBlob, recordAccess],
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

      const baseLink =
        item.webViewLink ??
        `https://drive.google.com/file/d/${item.id}/view`;
      if (openDriveLink(baseLink)) {
        recordAccess(resourceId);
        markOpened(resourceId);
      } else {
        toast.error("Preview link not available for this file.");
      }
    },
    [markOpened, offlineFiles, openDriveLink, openOfflineResource, recordAccess],
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
          triggerHaptic();
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
        triggerHaptic();
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
      triggerHaptic,
    ],
  );

  const removeOfflineEntry = useCallback(
    async (resourceId: string) => {
      const meta = offlineFiles[resourceId];
      if (!meta) return;
      if (meta.storageMode === "folder") {
        await removeOfflineFolderFile(meta.fileId ?? resourceId);
      } else {
        await removeCachedFile(resourceId);
      }
    },
    [offlineFiles],
  );

  const handleCleanupRemove = useCallback(
    async (resourceId: string) => {
      await removeOfflineEntry(resourceId);
      removeOfflineFiles([resourceId]);
      triggerHaptic();
    },
    [removeOfflineEntry, removeOfflineFiles, triggerHaptic],
  );

  const handleCleanupBulk = useCallback(async () => {
    if (!cleanupSummary) return;
    const ids = new Set<string>();
    cleanupSummary.largest.forEach((entry) => ids.add(entry.resourceId));
    cleanupSummary.leastUsed.forEach((entry) => ids.add(entry.resourceId));
    for (const id of ids) {
      await removeOfflineEntry(id);
    }
    if (ids.size > 0) {
      removeOfflineFiles(Array.from(ids));
      triggerHaptic();
    }
  }, [cleanupSummary, removeOfflineEntry, removeOfflineFiles, triggerHaptic]);

  const handleToggleFavorite = useCallback(
    (resourceId: string) => {
      triggerHaptic();
      toggleFavorite(resourceId);
    },
    [toggleFavorite, triggerHaptic],
  );

  const openTagDrawerForResource = useCallback(
    (resourceId: string, name: string) => {
      const existingTags = tags[resourceId] ?? [];
      setTagDrawer({
        mode: "single",
        resourceIds: [resourceId],
        name,
      });
      setTagSelection(
        new Set(existingTags.map((tag) => normalizeTagKey(tag))),
      );
      setTagSearch("");
      setNewTagName("");
      setNewTagColor(TAG_COLORS[0]?.value ?? "#E2E8F0");
      setDuplicateTagKey(null);
    },
    [tags],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (commandOpen || aiDrawerOpen || tagDrawer) return;
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
        return;
      }

      if (focusMode) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (selectedItems.size === 0) return;

      const resourceId = Array.from(selectedItems)[0];
      if (!resourceId) return;

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        handleToggleFavorite(resourceId);
        return;
      }

      if (event.key.toLowerCase() === "o") {
        event.preventDefault();
        const parsed = parseResourceId(resourceId);
        const itemId = parsed?.itemId;
        const item = itemId ? itemLookup.get(itemId) : undefined;
        if (item && !isFolder(item.mimeType)) {
          handleToggleOffline(item, resourceId);
        }
        return;
      }

      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        openTagDrawerForResource(resourceId, resolveResourceLabel(resourceId));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    aiDrawerOpen,
    commandOpen,
    focusMode,
    handleToggleFavorite,
    handleToggleOffline,
    itemLookup,
    openTagDrawerForResource,
    resolveResourceLabel,
    selectedItems,
    tagDrawer,
  ]);

  const openBulkTagDrawer = useCallback(
    (action: "add" | "remove") => {
      const ids = Array.from(selectedItems);
      if (ids.length === 0) return;
      setTagDrawer({
        mode: "bulk",
        action,
        resourceIds: ids,
        name: `${ids.length} items`,
      });
      setTagSelection(new Set());
      setTagSearch("");
      setNewTagName("");
      setNewTagColor(TAG_COLORS[0]?.value ?? "#E2E8F0");
      setDuplicateTagKey(null);
    },
    [selectedItems],
  );

  const toggleTagSelection = useCallback((key: string) => {
    setDuplicateTagKey(null);
    setTagSelection((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleCreateTag = useCallback(() => {
    const raw = newTagName.trim();
    if (!raw) return;
    const normalized = normalizeTagKey(raw);
    if (tagLibrary.has(normalized)) {
      setDuplicateTagKey(normalized);
      setTagSelection((prev) => {
        const next = new Set(prev);
        next.add(normalized);
        return next;
      });
      return;
    }
    upsertTagPalette(normalized, {
      label: raw,
      color: newTagColor,
    });
    setTagSelection((prev) => {
      const next = new Set(prev);
      next.add(normalized);
      return next;
    });
    setNewTagName("");
    setDuplicateTagKey(null);
  }, [newTagColor, newTagName, tagLibrary, upsertTagPalette]);

  const handleApplyTags = useCallback(() => {
    if (!tagDrawer) return;
    const selectedKeys = Array.from(tagSelection);
    const selectedLabels = selectedKeys.map(
      (key) => tagLibrary.get(key)?.label ?? key,
    );

    if (tagDrawer.mode === "single") {
      const resourceId = tagDrawer.resourceIds[0];
      if (resourceId) {
        setTags(resourceId, selectedLabels);
      }
      triggerHaptic();
      setTagDrawer(null);
      return;
    }

    const updates: Record<string, string[]> = {};
    if (tagDrawer.action === "remove") {
      const removeSet = new Set(selectedKeys);
      tagDrawer.resourceIds.forEach((resourceId) => {
        const current = tags[resourceId] ?? [];
        updates[resourceId] = current.filter(
          (tag) => !removeSet.has(normalizeTagKey(tag)),
        );
      });
    } else {
      tagDrawer.resourceIds.forEach((resourceId) => {
        const current = tags[resourceId] ?? [];
        const nextMap = new Map(
          current.map((tag) => [normalizeTagKey(tag), tag]),
        );
        selectedKeys.forEach((key) => {
          nextMap.set(key, tagLibrary.get(key)?.label ?? key);
        });
        updates[resourceId] = Array.from(nextMap.values());
      });
    }
    setTagsBatch(updates);
    triggerHaptic();
    setTagDrawer(null);
  }, [
    setTags,
    setTagsBatch,
    tagDrawer,
    tagLibrary,
    tagSelection,
    tags,
    triggerHaptic,
  ]);

  const handleOpenWithAi = useCallback((item: DriveItem, resourceId: string) => {
    setAiTarget({ item, resourceId });
    setAiChoice(null);
    setAiDrawerOpen(true);
  }, []);

  const buildAiFilename = useCallback(
    (item: DriveItem, exportMime?: string | null) => {
      const fallback = item.name || "study-material";
      if (exportMime === "application/pdf" && !fallback.toLowerCase().endsWith(".pdf")) {
        return `${fallback}.pdf`;
      }
      return fallback;
    },
    [],
  );

  const getAiFileBlob = useCallback(
    async (item: DriveItem, resourceId: string) => {
      const storedMode =
        offlineFiles[resourceId]?.storageMode ?? offlineStorageMode;

      if (offlineFiles[resourceId]) {
        if (storedMode === "folder") {
          const file = await readOfflineFolderFile(
            offlineFiles[resourceId]?.fileId ?? item.id,
          );
          if (file) return file;
        } else {
          const cached = await readCachedFile(resourceId);
          if (cached) return cached.blob();
        }
      }

      if (!isOnline) {
        toast.error("Connect to the internet to share this file.");
        return null;
      }

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
        toast.error("Unable to fetch the file for sharing.");
        return null;
      }
      return response.blob();
    },
    [isOnline, offlineFiles, offlineStorageMode],
  );

  const handleShareFile = useCallback(
    async (item: DriveItem) => {
      const baseLink =
        item.webViewLink ??
        `https://drive.google.com/file/d/${item.id}/view`;
      const shareLink = buildDriveLink(baseLink, userEmail);
      if (!shareLink) {
        toast.error("Share link not available for this file.");
        return;
      }

      if (typeof navigator !== "undefined" && "share" in navigator) {
        try {
          await navigator.share({
            title: item.name,
            url: shareLink,
          });
          return;
        } catch (error) {
          if ((error as Error)?.name === "AbortError") return;
        }
      }

      try {
        await navigator.clipboard.writeText(shareLink);
        toast.message("Link copied to clipboard.");
      } catch {
        toast.error("Unable to share file. Please try again.");
      }
    },
    [userEmail],
  );

  const commandItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      {
        id: "nav-resources",
        label: "Go to Study Materials",
        description: "Return to the resources hub",
        group: "Navigation",
        onSelect: () => router.push("/resources"),
      },
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
      {
        id: "focus-toggle",
        label: focusMode ? "Exit Focus Mode" : "Enter Focus Mode",
        description: "Hide actions and filters",
        group: "Navigation",
        onSelect: () => setFocusMode((prev) => !prev),
      },
    ];

    [
      { id: "all", label: "All Types", value: "all" },
      { id: "pdf", label: "PDFs", value: "pdf" },
      { id: "slides", label: "Slides", value: "slides" },
      { id: "docs", label: "Docs", value: "docs" },
      { id: "archives", label: "Archives", value: "archives" },
    ].forEach((option) => {
      items.push({
        id: `filter-mime-${option.id}`,
        label: `Filter: ${option.label}`,
        description: "Quick MIME filter",
        group: "Filters",
        keywords: option.label,
        onSelect: () =>
          setMimeFilter(
            option.value as "all" | "pdf" | "slides" | "docs" | "archives",
          ),
      });
    });

    [
      { id: "all", label: "All", value: "all" },
      { id: "pyq", label: "PYQs", value: "pyq" },
      { id: "offline", label: "Offline", value: "offline" },
      { id: "starred", label: "Starred", value: "starred" },
    ].forEach((option) => {
      items.push({
        id: `filter-course-${option.id}`,
        label: `Quick Filter: ${option.label}`,
        description: "Course scoped filter",
        group: "Filters",
        keywords: option.label,
        onSelect: () =>
          setCourseFilter(
            option.value as "all" | "pyq" | "offline" | "starred",
          ),
      });
    });

    tagOptions.forEach((tag) => {
      items.push({
        id: `tag-${tag.key}`,
        label: `Tag: ${tag.label}`,
        description: "Filter by tag",
        group: "Tags",
        keywords: tag.label,
        onSelect: () =>
          setSearchTerm((prev) => {
            const parsed = parseSearchQuery(prev);
            return buildSearchValue(parsed.text, [tag.label]);
          }),
      });
    });

    folders.forEach((item) => {
      items.push({
        id: `folder-${item.id}`,
        label: item.name,
        description: "Open folder",
        group: "Folders",
        keywords: item.name,
        onSelect: () => handleOpenFolder(item.id, item.name),
      });
    });

    files.forEach((item) => {
      const resourceId = getResourceId(item.id);
      items.push({
        id: `file-${item.id}`,
        label: item.name,
        description: "Open file",
        group: "Files",
        keywords: `${item.name} ${getMimeLabel(item.mimeType, item.name)}`,
        onSelect: () => handleOpenFile(item, resourceId),
      });
    });

    offlineItems.forEach(({ resourceId, meta, item }) => {
      const label = item?.name ?? meta.name ?? "Offline file";
      items.push({
        id: `offline-${resourceId}`,
        label,
        description: "Open offline file",
        group: "Offline",
        keywords: label,
        onSelect: () =>
          openOfflineResource(resourceId, meta.fileId ?? item?.id),
      });
    });

    courseList.forEach((courseItem) => {
      items.push({
        id: `course-${courseItem.courseID}`,
        label: courseItem.courseName || courseItem.courseID,
        description: "Jump to course",
        group: "Courses",
        keywords: courseItem.courseID,
        onSelect: () => router.push(`/resources/course/${courseItem.courseID}`),
      });
    });

    return items;
  }, [
    courseList,
    files,
    folders,
    focusMode,
    getResourceId,
    handleOpenFile,
    handleOpenFolder,
    offlineItems,
    openOfflineResource,
    router,
    setCourseFilter,
    setMimeFilter,
    tagOptions,
  ]);

  const handleConfirmAi = useCallback(async () => {
    if (!aiChoice || !aiTarget) return;
    if (aiBusy) return;
    setAiBusy(true);

    try {
      const { item, resourceId } = aiTarget;
      const exportMime = getExportMime(item.mimeType);
      const filename = buildAiFilename(item, exportMime);
      const blob = await getAiFileBlob(item, resourceId);

      if (blob && typeof navigator !== "undefined" && "share" in navigator) {
        const file = new File([blob], filename, {
          type: blob.type || exportMime || "application/octet-stream",
        });
        const canShareFiles =
          "canShare" in navigator &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [file] });

        if (canShareFiles) {
          try {
            await navigator.share({
              files: [file],
              title: item.name || filename,
              text: `Open with ${aiChoice.label}`,
            });
            toast.message("Shared file. Choose your AI assistant.");
            setAiDrawerOpen(false);
            return;
          } catch (error) {
            if ((error as Error)?.name === "AbortError") {
              return;
            }
          }
        }
      }

      const baseLink =
        item.webViewLink ??
        `https://drive.google.com/file/d/${item.id}/view`;
      const shareLink = buildDriveLink(baseLink, userEmail);

      window.open(aiChoice.href, "_blank", "noopener,noreferrer");

      if (shareLink) {
        try {
          await navigator.clipboard.writeText(shareLink);
          toast.message(
            "Opened assistant and copied the file link. Upload or paste it there.",
          );
        } catch {
          toast.message(
            "Opened assistant. Upload the file manually or paste its link.",
          );
        }
      } else {
        toast.message("Opened assistant. Upload the file manually.");
      }

      setAiDrawerOpen(false);
    } finally {
      setAiBusy(false);
    }
  }, [
    aiBusy,
    aiChoice,
    aiTarget,
    buildAiFilename,
    getAiFileBlob,
    userEmail,
  ]);

  return (
    <>
      <header className="sticky top-0 z-20 bg-white border-b-4 border-black px-4 py-4 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCourseBack}
            aria-label="Go back"
            className="h-10 w-10 border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0_#0a0a0a] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0a0a0a] hover:bg-yellow-50 active:translate-y-0 active:shadow-[2px_2px_0_#0a0a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-stone-900 tracking-tight truncate">
              {course.courseName || course.courseID}
              {course.courseName && (
                <span className="ml-2 text-xs sm:text-sm font-black uppercase tracking-wide text-stone-500">
                  {course.courseID}
                </span>
              )}
            </h1>
          </div>
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
              className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] min-w-[220px] max-w-[calc(100vw-2rem)] max-h-[min(60svh,320px)] overflow-y-auto"
            >
              <div className="px-3 py-2 text-[10px] font-black uppercase text-stone-500 border-b border-stone-200">
                Status: {syncStatus}
              </div>
              <Menu.Item
                className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                onSelect={() => driveQuery.refetch()}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh folder
              </Menu.Item>
              <Menu.Item
                className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                onSelect={() => {
                  const folderUrl =
                    course.syllabusAssets?.folderUrl ??
                    `https://drive.google.com/drive/folders/${rootFolderId}`;
                  openDriveLink(folderUrl);
                }}
              >
                <FolderOpen className="h-4 w-4" />
                Open in Drive
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
                onSelect={() => setFocusMode((prev) => !prev)}
              >
                {focusMode ? "Exit Focus Mode" : "Focus Mode"}
              </Menu.Item>
              <Menu.Item
                className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                onSelect={() => router.push("/resources/offline")}
              >
                Offline Materials
              </Menu.Item>
              <Menu.Item
                className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                onSelect={() => router.push("/resources/settings")}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Menu.Item>
            </Menu.Content>
          </Menu>
        </div>
      </header>

      {!focusMode && (
        <section className="sticky top-[72px] sm:top-[80px] z-10 bg-white border-b-4 border-black px-4 py-2 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
            {quickFilters.map((option) => {
              const hasMime = "mime" in option;
              const hasCourse = "course" in option;
              const isActive =
                option.id === "all"
                  ? activeMimeFilter === "all" && activeCourseFilter === "all"
                  : hasMime
                    ? activeMimeFilter === option.mime
                    : hasCourse
                      ? activeCourseFilter === option.course
                      : false;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (option.id === "all") {
                      setMimeFilter("all");
                      setCourseFilter("all");
                      return;
                    }
                    if (hasMime) {
                      setMimeFilter((prev) =>
                        prev === option.mime ? "all" : option.mime,
                      );
                      return;
                    }
                    if (hasCourse) {
                      setCourseFilter((prev) =>
                        prev === option.course ? "all" : option.course,
                      );
                    }
                  }}
                  className={cn(
                    "shrink-0 border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-colors duration-150 transition-transform active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                    isActive ? "bg-black text-white" : "bg-white hover:bg-yellow-50",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="bg-white border-b-4 border-black px-4 py-4 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
        <label className="text-xs font-black uppercase text-neutral-600 mb-2 block">
          Search materials
        </label>
        <div className="relative">
          <div className="flex items-center gap-3 border-[3px] border-black bg-white px-3 py-2 shadow-[3px_3px_0px_0px_#000]">
            <Search className="h-4 w-4 text-neutral-600" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setSearchFocused(false), 120);
              }}
              placeholder="Search or type / for tags"
              aria-label="Search through materials"
              className="flex-1 bg-transparent text-sm font-bold outline-none"
              ref={searchInputRef}
            />
            {!focusMode && (
              <button
                type="button"
                onClick={handleSelectionToggle}
                aria-pressed={selectionMode}
                className={cn(
                  "h-9 w-9 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] transition-transform active:scale-95 motion-reduce:transition-none",
                  selectionMode ? "bg-black text-white" : "bg-white",
                )}
              >
                <CheckSquare className="h-4 w-4" />
              </button>
            )}
          </div>
          {showTagSuggestions && !focusMode && (
            <div className="absolute left-0 right-0 mt-2 border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] max-h-[min(50svh,280px)] overflow-y-auto z-20">
              <div className="px-3 py-2 text-[10px] font-black uppercase text-stone-500 border-b border-stone-200">
                Tag filters
              </div>
              {filteredTagSuggestions.length === 0 ? (
                <div className="px-3 py-3 text-xs font-bold uppercase text-stone-500">
                  No tags found yet.
                </div>
              ) : (
                filteredTagSuggestions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => toggleSearchTag(option)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 py-2 text-xs font-black uppercase tracking-wide text-left border-b border-stone-200 last:border-b-0 hover:bg-yellow-100",
                      activeSearchKeys.has(option.key) && "bg-yellow-50",
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                      <span className="truncate">{option.label}</span>
                      {pinnedTagSet.has(option.key) && (
                        <span className="border border-black px-1 text-[8px] uppercase bg-white">
                          Pinned
                        </span>
                      )}
                    </span>
                    {activeSearchKeys.has(option.key) && (
                      <Check className="h-3.5 w-3.5 text-black" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {!focusMode && activeSearchTags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeSearchTags.map((tag) => (
              <span
                key={tag.key}
                className="inline-flex items-center gap-2 border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase leading-none shadow-[2px_2px_0px_0px_#000]"
                style={{ backgroundColor: tag.color }}
              >
                <span className="h-2 w-2 rounded-full border border-black bg-white" />
                {tag.label}
              </span>
            ))}
          </div>
        )}
        {selectionMode && !focusMode && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-2 border-black bg-white px-3 py-2 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000]">
            <span>{selectedItems.size} selected</span>
            <span className="h-3 w-px bg-black/40" />
            <button
              type="button"
              onClick={() => openBulkTagDrawer("add")}
              className="px-2 py-1 border-2 border-black bg-[#FFD700] text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-colors duration-150 transition-transform active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Add tags
            </button>
            <button
              type="button"
              onClick={() => openBulkTagDrawer("remove")}
              className="px-2 py-1 border-2 border-black bg-white text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-colors duration-150 transition-transform hover:bg-yellow-50 active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Remove tags
            </button>
            <button
              type="button"
              onClick={exitSelectionMode}
              className="ml-auto px-2 py-1 border-2 border-black bg-white text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-colors duration-150 transition-transform hover:bg-yellow-50 active:scale-95 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Clear selection
            </button>
          </div>
        )}
      </section>

      <section className="bg-white border-b-4 border-black px-4 py-5 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
        <div
          ref={breadcrumbRef}
          className="flex items-center gap-2 text-xs font-black uppercase text-stone-600 overflow-x-auto whitespace-nowrap pr-2"
        >
          {!shouldCollapseBreadcrumb &&
            folderStack.map((folder, index) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => handleBreadcrumb(index)}
                aria-current={
                  index === folderStack.length - 1 ? "page" : undefined
                }
                className={cn(
                  "shrink-0 flex items-center gap-1 border-2 border-black px-2 py-1 shadow-[2px_2px_0_#0a0a0a] transition-transform active:scale-95 motion-reduce:transition-none",
                  index === folderStack.length - 1
                    ? "bg-stone-900 text-white"
                    : "bg-white text-stone-700 hover:bg-yellow-100",
                )}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span className="max-w-[160px] truncate">{folder.name}</span>
              </button>
            ))}
          {shouldCollapseBreadcrumb && (
            <>
              <button
                type="button"
                onClick={() => handleBreadcrumb(0)}
                className="shrink-0 flex items-center gap-1 border-2 border-black px-2 py-1 shadow-[2px_2px_0_#0a0a0a] bg-white text-stone-700 hover:bg-yellow-100 transition-transform active:scale-95 motion-reduce:transition-none"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span className="max-w-[120px] truncate">
                  {folderStack[0]?.name ?? "Root"}
                </span>
              </button>
              {breadcrumbMiddle.length > 0 && (
                <Menu>
                  <Menu.Trigger asChild>
                    <button
                      type="button"
                      aria-label="Show all folders"
                      className="shrink-0 flex items-center gap-1 border-2 border-black px-2 py-1 shadow-[2px_2px_0_#0a0a0a] bg-white text-stone-700 hover:bg-yellow-100 transition-transform active:scale-95 motion-reduce:transition-none"
                    >
                      <span className="text-base leading-none">…</span>
                    </button>
                  </Menu.Trigger>
                  <Menu.Content
                    align="start"
                    sideOffset={6}
                    className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] min-w-[180px] max-w-[calc(100vw-2rem)] max-h-[min(60svh,320px)] overflow-y-auto"
                  >
                    {breadcrumbMiddle.map((folder, idx) => (
                      <Menu.Item
                        key={folder.id}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                        onSelect={() => handleBreadcrumb(idx + 1)}
                      >
                        <FolderOpen className="h-4 w-4" />
                        <span className="max-w-[220px] truncate">
                          {folder.name}
                        </span>
                      </Menu.Item>
                    ))}
                  </Menu.Content>
                </Menu>
              )}
              {breadcrumbTail.map((folder, index) => {
                const offset = folderStack.length - breadcrumbTail.length;
                const actualIndex = offset + index;
                const isCurrent = actualIndex === folderStack.length - 1;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleBreadcrumb(actualIndex)}
                    aria-current={isCurrent ? "page" : undefined}
                    className={cn(
                      "shrink-0 flex items-center gap-1 border-2 border-black px-2 py-1 shadow-[2px_2px_0_#0a0a0a] transition-transform active:scale-95 motion-reduce:transition-none",
                      isCurrent
                        ? "bg-stone-900 text-white"
                        : "bg-white text-stone-700 hover:bg-yellow-100",
                    )}
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span className="max-w-[160px] truncate">
                      {folder.name}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </section>

      <section className="bg-white border-b-4 border-black px-4 py-6 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
        {!isOnline && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase text-neutral-700 shadow-[3px_3px_0px_0px_#000]">
            <span className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              Offline mode on. Cached files are still available.
            </span>
            <OfflineFallbackButton className="text-[10px] px-3 py-1.5" />
          </div>
        )}

        {accountNotice && (
          <div className="mb-4 border-2 border-black bg-yellow-50 px-4 py-3 text-xs font-black uppercase text-neutral-700 shadow-[3px_3px_0px_0px_#000]">
            <p className="mb-2">
              If you&apos;re seeing the wrong Google account, we tried{" "}
              <span className="text-neutral-900">{accountNotice.email}</span>.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openDriveLink(accountNotice.link)}
                className="border-2 border-black bg-[#FFD700] px-2.5 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000]"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() =>
                  window.open(
                    "https://support.google.com/accounts/answer/1721977",
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                className="border-2 border-black bg-white px-2.5 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000]"
              >
                Help
              </button>
              <button
                type="button"
                onClick={() => setAccountNotice(null)}
                className="border-2 border-black bg-white px-2.5 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] ml-auto"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {!focusMode && cleanupSummary && !cleanupDismissed && (
          <div className="mb-6 border-2 border-black bg-yellow-50 px-4 py-4 shadow-[3px_3px_0px_0px_#000]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-stone-700">
                  Storage Cleanup
                </p>
                <p className="text-[11px] font-bold uppercase text-stone-600">
                  {storageUsage.usedMb} MB used •{" "}
                  {storageUsage.limitMb === null
                    ? "Unlimited"
                    : `${storageUsage.limitMb} MB limit`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCleanupDismissed(true)}
                className="border-2 border-black bg-white px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000]"
              >
                Dismiss
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="border-2 border-black bg-white px-3 py-3 shadow-[2px_2px_0px_0px_#000]">
                <p className="text-[10px] font-black uppercase text-stone-600 mb-2">
                  Largest cached
                </p>
                <div className="space-y-2">
                  {cleanupSummary.largest.map((entry) => (
                    <div
                      key={entry.resourceId}
                      className="flex items-center justify-between gap-2 text-[10px] font-black uppercase"
                    >
                      <span className="truncate">
                        {resolveResourceLabel(entry.resourceId)}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span>{formatBytes(entry.size)}</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCleanupRemove(entry.resourceId)
                          }
                          className="border border-black bg-white px-1.5 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-2 border-black bg-white px-3 py-3 shadow-[2px_2px_0px_0px_#000]">
                <p className="text-[10px] font-black uppercase text-stone-600 mb-2">
                  Least used
                </p>
                <div className="space-y-2">
                  {cleanupSummary.leastUsed.map((entry) => (
                    <div
                      key={entry.resourceId}
                      className="flex items-center justify-between gap-2 text-[10px] font-black uppercase"
                    >
                      <span className="truncate">
                        {resolveResourceLabel(entry.resourceId)}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span>{formatModifiedDate(entry.lastUsed)}</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCleanupRemove(entry.resourceId)
                          }
                          className="border border-black bg-white px-1.5 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCleanupBulk}
                className="border-2 border-black bg-black px-3 py-2 text-[10px] font-black uppercase text-white shadow-[3px_3px_0px_0px_#000]"
              >
                Free up space
              </button>
              <button
                type="button"
                onClick={() => router.push("/resources/settings")}
                className="border-2 border-black bg-white px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_#000]"
              >
                Review limits
              </button>
            </div>
          </div>
        )}

        {offlineItems.length > 0 && (
          <div className="mb-6">
            <h4 className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-stone-700 mb-3 bg-yellow-50/70 border border-yellow-200/80 px-2 py-1">
              <span className="h-2 w-2 border border-black bg-yellow-300" />
              Available Offline
            </h4>
            <div className="space-y-3" style={listVisibilityStyle}>
              {offlineItems.map(({ resourceId, meta, item }) => {
                const Icon = getItemIcon(item?.mimeType ?? meta.mimeType);
                const mimeLabel = getMimeLabel(
                  item?.mimeType ?? meta.mimeType,
                  item?.name ?? meta.name,
                );
                const tone = getRowTone(item?.mimeType ?? meta.mimeType);
                return (
                  <div
                    key={resourceId}
                    className={cn(
                      "group w-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 border-2 border-black px-4 py-3 text-left shadow-[2px_2px_0px_0px_#000] transition-all duration-150 bg-white even:bg-[#FFFCF3] hover:bg-yellow-50/40 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000]",
                      tone.row,
                    )}
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
                      className="flex flex-1 min-w-0 items-center gap-3 text-left transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 items-center justify-center border-2 border-black shadow-[3px_3px_0px_0px_#000]",
                          tone.icon,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-black uppercase text-stone-900"
                          style={clampStyle}
                        >
                          {item?.name ?? meta.name ?? "Offline file"}
                        </p>
                        <p className="text-[11px] font-bold uppercase text-stone-500/80">
                          {mimeLabel} • {formatBytes(meta.size)} • Cached{" "}
                          {formatModifiedDate(meta.cachedAt)}
                        </p>
                      </div>
                    </button>
                    <span className="mt-2 sm:mt-0 flex items-center gap-1 border-2 border-black bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase leading-none shadow-[2px_2px_0px_0px_#000] shrink-0">
                      <Download className="h-3 w-3 text-emerald-700" />
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
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => driveQuery.refetch()}
                className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0_#0a0a0a]"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
              <OfflineFallbackButton />
            </div>
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
              const tone = getRowTone(item.mimeType);
              const itemTags = tags[resourceId] ?? [];
              const tagChips = itemTags.map((tag) => resolveTagOption(tag));
              const isFavorite = Boolean(favorites[resourceId]);
              const isSelected = selectedItems.has(resourceId);
              const Icon = getItemIcon(item.mimeType);
              const mimeLabel = getMimeLabel(item.mimeType, item.name);
              const modifiedLabel = formatModifiedDate(item.modifiedTime);
              const detailLine = [mimeLabel, modifiedLabel !== "—"
                ? `Updated ${modifiedLabel}`
                : null].filter(Boolean).join(" • ");
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-black px-4 py-3 text-left shadow-[2px_2px_0px_0px_#000] transition-all duration-150 bg-white even:bg-[#FFFCF3]",
                    tone.row,
                    isSelected && selectionMode && "bg-yellow-50 ring-2 ring-black",
                    "hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-50/40 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000]",
                  )}
                >
                  <button
                    type="button"
                    onClick={handlePrimaryAction(resourceId, () =>
                      handleOpenFolder(item.id, item.name),
                    )}
                    onPointerDown={handleLongPressStart(resourceId)}
                    onPointerUp={handleLongPressCancel}
                    onPointerCancel={handleLongPressCancel}
                    onPointerMove={handleLongPressCancel}
                    className="flex flex-1 min-w-0 items-center gap-3 text-left transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    {selectionMode && (
                      <span className="flex h-6 w-6 items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] shrink-0">
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center border-2 border-black shadow-[3px_3px_0px_0px_#000]",
                        tone.icon,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-black uppercase text-stone-900"
                        style={clampStyle}
                      >
                        {item.name}
                      </p>
                      <p className="text-[11px] font-bold uppercase text-stone-500/80">
                        {detailLine || "Folder"}
                      </p>
                      {!focusMode && (isFavorite || tagChips.length > 0) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {isFavorite && (
                            <span className="border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase leading-none text-stone-700 shadow-[2px_2px_0px_0px_#000]">
                              Starred
                            </span>
                          )}
                          {tagChips.map((tag) => (
                            <span
                              key={tag.key}
                              className="border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase leading-none text-stone-700 shadow-[2px_2px_0px_0px_#000]"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                  {!focusMode && (
                    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0">
                      <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto">
                        <button
                          type="button"
                          aria-label={isFavorite ? "Unstar folder" : "Star folder"}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleFavorite(resourceId);
                          }}
                          className={cn(
                            "h-9 w-9 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] transition-colors duration-150 hover:bg-yellow-50/70 active:bg-yellow-100/70 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                            isFavorite ? "bg-yellow-50" : "bg-white",
                          )}
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              isFavorite ? "text-yellow-600" : "text-black",
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
                            className="h-9 w-9 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] transition-colors duration-150 hover:bg-yellow-50/70 active:bg-yellow-100/70 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </Menu.Trigger>
                        <Menu.Content
                          align="end"
                          sideOffset={6}
                          className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] min-w-[180px] max-w-[calc(100vw-2rem)] max-h-[min(60svh,320px)] overflow-y-auto"
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
                            onSelect={() =>
                              openTagDrawerForResource(resourceId, item.name)
                            }
                          >
                            <Tag className="h-4 w-4" />
                            Manage tags
                          </Menu.Item>
                        </Menu.Content>
                      </Menu>
                    </div>
                  )}
                </div>
              );
            })}

            {files.map((item, index) => {
              const resourceId = getResourceId(item.id);
              const tone = getRowTone(item.mimeType);
              const itemTags = tags[resourceId] ?? [];
              const tagChips = itemTags.map((tag) => resolveTagOption(tag));
              const isFavorite = Boolean(favorites[resourceId]);
              const offlineMeta = offlineFiles[resourceId];
              const isOffline = Boolean(offlineMeta);
              const isSelected = selectedItems.has(resourceId);
              const Icon = getItemIcon(item.mimeType);
              const mimeLabel = getMimeLabel(item.mimeType, item.name);
              const sizeLabel = formatBytes(offlineMeta?.size ?? item.size);
              const modifiedLabel = formatModifiedDate(
                item.modifiedTime ?? offlineMeta?.cachedAt,
              );
              const detailLine = [
                mimeLabel,
                sizeLabel !== "—" ? sizeLabel : null,
                modifiedLabel !== "—" ? modifiedLabel : null,
              ]
                .filter(Boolean)
                .join(" • ");
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-black px-4 py-3 text-left shadow-[2px_2px_0px_0px_#000] transition-all duration-150 bg-white even:bg-[#FFFCF3]",
                    tone.row,
                    isSelected && selectionMode && "bg-yellow-50 ring-2 ring-black",
                    item.webViewLink
                      ? "hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-50/40 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000]"
                      : "opacity-80",
                    index === 0 && folders.length > 0 && "mt-3",
                  )}
                >
                  <button
                    type="button"
                    onClick={handlePrimaryAction(resourceId, () =>
                      handleOpenFile(item, resourceId),
                    )}
                    onPointerDown={handleLongPressStart(resourceId)}
                    onPointerUp={handleLongPressCancel}
                    onPointerCancel={handleLongPressCancel}
                    onPointerMove={handleLongPressCancel}
                    className="flex flex-1 min-w-0 items-center gap-3 text-left transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    {selectionMode && (
                      <span className="flex h-6 w-6 items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] shrink-0">
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center border-2 border-black shadow-[3px_3px_0px_0px_#000]",
                        tone.icon,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-black uppercase text-stone-900"
                        style={clampStyle}
                      >
                        {item.name}
                      </p>
                      <p className="text-[11px] font-bold uppercase text-stone-500/80">
                        {detailLine}
                      </p>
                      {!focusMode && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {isFavorite && (
                            <span className="border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase leading-none text-stone-700 shadow-[2px_2px_0px_0px_#000]">
                              Starred
                            </span>
                          )}
                          {isOffline && (
                            <span className="border-2 border-black bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase leading-none text-emerald-700 shadow-[2px_2px_0px_0px_#000]">
                              Offline
                            </span>
                          )}
                          {tagChips.map((tag) => (
                            <span
                              key={tag.key}
                              className="border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase leading-none text-stone-700 shadow-[2px_2px_0px_0px_#000]"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                  {!focusMode && (
                    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0">
                      <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto">
                        <button
                          type="button"
                          aria-label={isFavorite ? "Unstar file" : "Star file"}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleFavorite(resourceId);
                          }}
                          className={cn(
                            "h-9 w-9 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] transition-colors duration-150 hover:bg-yellow-50/70 active:bg-yellow-100/70 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                            isFavorite ? "bg-yellow-50" : "bg-white",
                          )}
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              isFavorite ? "text-yellow-600" : "text-black",
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
                          className={cn(
                            "h-9 w-9 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] disabled:opacity-60 transition-colors duration-150 hover:bg-yellow-50/70 active:bg-yellow-100/70 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                            isOffline ? "bg-emerald-50" : "bg-white",
                            offlinePending.has(resourceId) && "bg-neutral-100",
                          )}
                        >
                          <Download
                            className={cn(
                              "h-4 w-4",
                              isOffline ? "text-emerald-600" : "text-stone-500",
                            )}
                          />
                        </button>
                      </div>
                      <Menu>
                        <Menu.Trigger asChild>
                          <button
                            type="button"
                            aria-label="File actions"
                            className="h-9 w-9 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] transition-colors duration-150 hover:bg-yellow-50/70 active:bg-yellow-100/70 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </Menu.Trigger>
                        <Menu.Content
                          align="end"
                          sideOffset={6}
                          className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] min-w-[190px] max-w-[calc(100vw-2rem)] max-h-[min(60svh,320px)] overflow-y-auto"
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
                            onSelect={() => handleOpenWithAi(item, resourceId)}
                          >
                            <FileIcon className="h-4 w-4" />
                            Open with AI
                          </Menu.Item>
                          <Menu.Item
                            className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                            onSelect={() => handleShareFile(item)}
                          >
                            <Share2 className="h-4 w-4" />
                            Share file
                          </Menu.Item>
                          <Menu.Item
                            className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-yellow-100 focus:bg-yellow-100"
                            onSelect={() =>
                              openTagDrawerForResource(resourceId, item.name)
                            }
                          >
                            <Tag className="h-4 w-4" />
                            Manage tags
                          </Menu.Item>
                        </Menu.Content>
                      </Menu>
                    </div>
                  )}
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
      <Drawer.Content className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000] w-full max-w-none max-h-[calc(100svh-1rem)] overflow-y-auto overflow-x-hidden pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <Drawer.Header>
            <Drawer.Title className="text-lg font-black uppercase">
              Open with AI
            </Drawer.Title>
            <Drawer.Description className="text-sm font-bold text-neutral-600">
              On mobile, we’ll open the share sheet with the file attached. On
              desktop, we’ll open the assistant and copy the file link.
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
              {aiTarget?.item?.name
                ? `Selected: ${aiTarget.item.name}`
                : "Select a file to continue."}
            </div>
            <button
              type="button"
              onClick={handleConfirmAi}
              disabled={!aiChoice || aiBusy}
              className="inline-flex items-center justify-center gap-2 border-2 border-black bg-[#FFD700] px-4 py-3 text-sm font-black uppercase shadow-[4px_4px_0px_0px_#000] disabled:opacity-60"
            >
              {aiBusy ? "Preparing..." : "Confirm & Open"}
            </button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>

      <Drawer
        open={Boolean(tagDrawer)}
        onOpenChange={(open) => {
          if (!open) {
            setTagDrawer(null);
            setTagSelection(new Set());
            setTagSearch("");
            setNewTagName("");
            setDuplicateTagKey(null);
          }
        }}
      >
        <Drawer.Content className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000] w-full max-w-none max-h-[calc(100svh-1rem)] overflow-y-auto overflow-x-hidden pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <Drawer.Header>
            <Drawer.Title className="text-lg font-black uppercase">
              {tagDrawer?.mode === "bulk"
                ? tagDrawer.action === "remove"
                  ? "Remove Tags"
                  : "Add Tags"
                : "Manage Tags"}
            </Drawer.Title>
            <Drawer.Description className="text-sm font-bold text-neutral-600">
              {tagDrawer?.mode === "bulk"
                ? `Apply to ${tagDrawer.resourceIds.length} items`
                : tagDrawer?.name ?? "Resource"}
            </Drawer.Description>
          </Drawer.Header>
          <div className="px-4 pb-2 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-stone-600">
                Search tags
              </label>
              <input
                value={tagSearch}
                onChange={(event) => setTagSearch(event.target.value)}
                placeholder="Type to filter tags"
                className="w-full border-2 border-black px-3 py-2 text-xs font-bold uppercase shadow-[3px_3px_0px_0px_#000] focus:outline-none"
              />
            </div>

            {selectedDrawerTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedDrawerTags.map((tag) => (
                  <span
                    key={tag.key}
                    className="border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            )}

            {suggestedTags.length > 0 && (
              <div className="border-2 border-black bg-white px-3 py-2 shadow-[2px_2px_0px_0px_#000]">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-stone-600 mb-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggested tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag.key}
                      type="button"
                      onClick={() => toggleTagSelection(tag.key)}
                      className="border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {filteredDrawerTags.length === 0 ? (
                <div className="border-2 border-black bg-white px-3 py-2 text-[10px] font-black uppercase text-stone-500 shadow-[2px_2px_0px_0px_#000]">
                  No matching tags.
                </div>
              ) : (
                filteredDrawerTags.map((tag) => (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={() => toggleTagSelection(tag.key)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 border-2 border-black px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-transform active:scale-[0.99] motion-reduce:transition-none",
                      tagSelection.has(tag.key)
                        ? "bg-yellow-100"
                        : "bg-white",
                      duplicateTagKey === tag.key && "ring-2 ring-black",
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate">{tag.label}</span>
                      {pinnedTagSet.has(tag.key) && (
                        <span className="border border-black px-1 text-[8px] uppercase bg-white">
                          Pinned
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleTagPin(tag.key);
                        }}
                        className="h-7 w-7 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000]"
                        aria-label={
                          pinnedTagSet.has(tag.key)
                            ? `Unpin ${tag.label}`
                            : `Pin ${tag.label}`
                        }
                      >
                        <Pin
                          className={cn(
                            "h-3.5 w-3.5",
                            pinnedTagSet.has(tag.key)
                              ? "text-black"
                              : "text-stone-400",
                          )}
                          fill={
                            pinnedTagSet.has(tag.key)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                      {tagSelection.has(tag.key) && (
                        <Check className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>

            {tagDrawer?.action !== "remove" && (
              <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000] space-y-3">
                <div className="text-[10px] font-black uppercase text-stone-600">
                  Create new tag
                </div>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setNewTagColor(color.value)}
                      aria-label={`Select ${color.label}`}
                      className={cn(
                        "h-7 w-7 border-2 border-black shadow-[2px_2px_0px_0px_#000]",
                        newTagColor === color.value && "ring-2 ring-black",
                      )}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={newTagName}
                    onChange={(event) => setNewTagName(event.target.value)}
                    placeholder="New tag name"
                    className="flex-1 min-w-0 w-full sm:min-w-[180px] border-2 border-black px-3 py-2 text-xs font-bold uppercase shadow-[3px_3px_0px_0px_#000] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    className="w-full sm:w-auto border-2 border-black bg-[#FFD700] px-3 py-2 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                  >
                    Create
                  </button>
                </div>
                {duplicateTagKey && (
                  <p className="text-[10px] font-black uppercase text-stone-500">
                    Tag already exists — tap it above to apply.
                  </p>
                )}
              </div>
            )}
          </div>
          <Drawer.Footer>
            <button
              type="button"
              onClick={handleApplyTags}
              disabled={
                tagDrawer?.mode === "bulk" && tagSelection.size === 0
              }
              className="inline-flex items-center justify-center gap-2 border-2 border-black bg-[#FFD700] px-4 py-3 text-sm font-black uppercase shadow-[4px_4px_0px_0px_#000] disabled:opacity-60"
            >
              Apply tags
            </button>
            <button
              type="button"
              onClick={() => {
                setTagDrawer(null);
                setTagSelection(new Set());
                setTagSearch("");
                setNewTagName("");
                setDuplicateTagKey(null);
              }}
              className="inline-flex items-center justify-center gap-2 border-2 border-black bg-white px-4 py-3 text-sm font-black uppercase shadow-[3px_3px_0px_0px_#000]"
            >
              Cancel
            </button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>

      <CommandCenter
        open={commandOpen}
        onOpenChange={setCommandOpen}
        items={commandItems}
        placeholder="Search files, tags, or commands"
        emptyLabel="No matching resources."
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      <ShortcutsSheet
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        shortcuts={[
          { keys: "/", label: "Focus search" },
          { keys: "⌘K / Ctrl+K", label: "Open Command Center" },
          { keys: "f", label: "Star selected item" },
          { keys: "o", label: "Toggle offline" },
          { keys: "t", label: "Manage tags" },
        ]}
      />
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
            Guest Access
          </h2>
          <p className="font-mono text-sm text-neutral-600 mb-6">
            Sign in to load your course materials and Drive sync. You can still
            browse the Study Materials hub without an account.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/auth/signin")}
              className="w-full bg-black text-white font-bold py-3 px-4 uppercase border-2 border-black hover:bg-neutral-800 transition-colors"
            >
              Sign In to Sync
            </button>
            <button
              onClick={() => router.push("/resources")}
              className="w-full bg-white text-black font-bold py-3 px-4 uppercase border-2 border-black hover:bg-neutral-100 transition-colors"
            >
              Back to Study Materials
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (coursesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-24 transition-colors duration-300 relative isolate overflow-x-hidden">
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
          <div className="mt-4">
            <OfflineFallbackButton />
          </div>
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
          <div className="mt-4">
            <OfflineFallbackButton />
          </div>
        </div>
      </div>
    );
  }

  if (!rootFolderId) {
    return (
      <div className="min-h-screen bg-neutral-50 pb-24 transition-colors duration-300 relative isolate overflow-x-hidden">
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
              <div className="mt-4">
                <OfflineFallbackButton />
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 transition-colors duration-300 relative isolate overflow-x-hidden">
      <DotPatternBackground />

      <div className="mx-auto max-w-5xl relative z-10">
        <ResourceCourseBrowser
          key={rootFolderId}
          course={course}
          rootFolderId={rootFolderId}
          userId={user?.uid ?? null}
          userEmail={user?.email ?? null}
          courses={coursesQuery.data ?? []}
          preferences={preferences}
        />
      </div>
    </div>
  );
}
