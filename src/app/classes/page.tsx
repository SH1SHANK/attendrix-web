"use client";

import {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  Check,
  ListChecks,
  RefreshCw,
  X,
  ChevronDown,
  Menu,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import { useAuth } from "@/context/AuthContext";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { useAttendanceActions } from "@/hooks/useAttendanceActions";
import { usePastClasses } from "@/hooks/usePastClasses";
import {
  bulkCheckInRpc,
  computeAmplixDelta,
  getCourseAttendanceSummaryRpc,
  markClassAbsentRpc,
} from "@/lib/attendance/attendance-service";
import {
  enqueueFirestoreAttendanceUpdate,
  flushNow,
} from "@/lib/attendance/firestore-write-buffer";
import { queryKeys } from "@/lib/query/keys";
import { getISTDateString, parseTimestampAsIST } from "@/lib/time/ist";
import { useQueryClient } from "@tanstack/react-query";
import type {
  AttendanceStatus,
  FilterPeriod,
  PastClass,
} from "@/types/types-defination";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TabType = "all" | "missed";
type MissedViewMode = "list" | "date" | "class";
type SortDirection = "asc" | "desc";
type MissedGroupAction = { mode: "date" | "class"; key: string };

type DateRangeOption = {
  value: FilterPeriod;
  label: string;
  displayLabel: string;
};

type ClassesByDate = Record<string, PastClass[]>;
type ClassesByCourse = Record<string, { name: string; classes: PastClass[] }>;

const DATE_RANGES: DateRangeOption[] = [
  { value: "7d", label: "Past 7 days", displayLabel: "Last 7 Days" },
  { value: "14d", label: "Past 14 days", displayLabel: "Last 14 Days" },
  { value: "30d", label: "Past 30 days", displayLabel: "Last 30 Days" },
  { value: "all", label: "All time", displayLabel: "All Time" },
];

const formatDateLabel = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00+05:30`);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const formatDateHeader = (dateString: string) => formatDateLabel(dateString);

const getClassStartMs = (item: PastClass) =>
  parseTimestampAsIST(item.classStartTime).getTime();

function buildClassesByDate(classes: PastClass[]): ClassesByDate {
  const grouped: ClassesByDate = {};

  classes.forEach((item) => {
    const dateKey = getISTDateString(parseTimestampAsIST(item.classStartTime));
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey]?.push(item);
  });

  Object.values(grouped).forEach((items) => {
    items.sort(
      (a, b) =>
        parseTimestampAsIST(b.classStartTime).getTime() -
        parseTimestampAsIST(a.classStartTime).getTime(),
    );
  });

  return grouped;
}

export default function ClassesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { formatTime } = useUserPreferences();
  const userId = user?.uid ?? null;

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [activeFilter, setActiveFilter] = useState<FilterPeriod>("7d");
  const queryClient = useQueryClient();
  const [dialogClassId, setDialogClassId] = useState<string | null>(null);
  const [isControlsMenuOpen, setIsControlsMenuOpen] = useState(false);
  const controlsMenuWrapperRef = useRef<HTMLDivElement>(null);
  const controlsMenuButtonRef = useRef<HTMLButtonElement>(null);
  const controlsMenuRef = useRef<HTMLDivElement>(null);
  const [controlsMenuStyle, setControlsMenuStyle] =
    useState<CSSProperties | null>(null);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuButtonRef = useRef<HTMLButtonElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [sortMenuStyle, setSortMenuStyle] = useState<CSSProperties | null>(
    null,
  );
  const [isMounted, setIsMounted] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(
    new Set(),
  );
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [missedViewMode, setMissedViewMode] =
    useState<MissedViewMode>("list");
  const [missedSortDirection, setMissedSortDirection] =
    useState<SortDirection>("desc");
  const [missedGroupDialog, setMissedGroupDialog] =
    useState<MissedGroupAction | null>(null);
  const [missedGroupPending, setMissedGroupPending] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(
    new Set(),
  );
  const [fadeOutState, setFadeOutState] = useState<
    Record<string, "hold" | "fade">
  >({});
  const [openDateMenu, setOpenDateMenu] = useState<string | null>(null);
  const [dateActionDialog, setDateActionDialog] = useState<{
    dateKey: string;
    action: "present" | "absent";
  } | null>(null);
  const [dateActionPending, setDateActionPending] = useState(false);
  const dateMenuRef = useRef<HTMLDivElement | null>(null);
  const dateMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [dateMenuStyle, setDateMenuStyle] = useState<CSSProperties | null>(
    null,
  );

  const pastClassesQuery = usePastClasses(userId, activeFilter);
  const pastClasses = pastClassesQuery.data ?? [];
  const loading = authLoading || pastClassesQuery.isLoading;
  const isRefreshing =
    pastClassesQuery.isFetching && !pastClassesQuery.isLoading;
  const error = pastClassesQuery.error
    ? "Unable to load past classes. Please try again."
    : null;

  useEffect(() => {
    if (pastClassesQuery.error) {
      toast.error("Unable to load past classes. Please try again.");
    }
  }, [pastClassesQuery.error]);

  const markRecentlyUpdated = useCallback((classId: string) => {
    setRecentlyUpdated((prev) => {
      const next = new Set(prev);
      next.add(classId);
      return next;
    });

    window.setTimeout(() => {
      setRecentlyUpdated((prev) => {
        const next = new Set(prev);
        next.delete(classId);
        return next;
      });
    }, 1200);
  }, []);

  const startFadeOut = useCallback((classIds: Set<string>) => {
    if (classIds.size === 0) return;

    setFadeOutState((prev) => {
      const next = { ...prev };
      classIds.forEach((id) => {
        if (!next[id]) {
          next[id] = "hold";
        }
      });
      return next;
    });

    classIds.forEach((id) => {
      window.setTimeout(() => {
        setFadeOutState((prev) => {
          if (!prev[id] || prev[id] === "fade") return prev;
          return { ...prev, [id]: "fade" };
        });
      }, 200);

      window.setTimeout(() => {
        setFadeOutState((prev) => {
          if (!prev[id]) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 900);
    });
  }, []);

  const { checkIn, markAbsent, pendingByClassId } = useAttendanceActions({
    userId,
    onAfterSuccess: async () => {
      await pastClassesQuery.refetch();
    },
  });

  const classesByDate = useMemo(
    () => buildClassesByDate(pastClasses),
    [pastClasses],
  );

  const sortedGroupKeys = useMemo(
    () => Object.keys(classesByDate).sort((a, b) => (a < b ? 1 : -1)),
    [classesByDate],
  );

  const allClasses = useMemo(
    () => sortedGroupKeys.flatMap((dateKey) => classesByDate[dateKey] ?? []),
    [sortedGroupKeys, classesByDate],
  );

  const activeFilterLabel = useMemo(
    () =>
      DATE_RANGES.find((range) => range.value === activeFilter)?.displayLabel ??
      "All Time",
    [activeFilter],
  );

  const totalCount = useMemo(() => allClasses.length, [allClasses]);

  const missedCount = useMemo(
    () =>
      allClasses.filter((item) => item.attendanceStatus === "ABSENT").length,
    [allClasses],
  );

  const todayKey = useMemo(() => getISTDateString(new Date()), [classesByDate]);

  const canJumpToToday = useMemo(
    () => activeTab === "all" && sortedGroupKeys.includes(todayKey),
    [activeTab, sortedGroupKeys, todayKey],
  );

  const listPerfStyle = useMemo(
    () =>
      ({
        contentVisibility: "auto",
        containIntrinsicSize: "1px 800px",
      }) as CSSProperties,
    [],
  );

  const classById = useMemo(() => {
    const map = new Map<string, PastClass>();
    allClasses.forEach((item) => map.set(item.classID, item));
    return map;
  }, [allClasses]);

  const describeClass = useCallback(
    (classId: string) => {
      const item = classById.get(classId);
      if (!item) return classId;
      const timeRange = `${formatTime(item.classStartTime)} – ${formatTime(
        item.classEndTime,
      )}`;
      return `${item.courseName} (${timeRange})`;
    },
    [classById, formatTime],
  );

  const notifyBulkErrors = useCallback(
    (
      label: string,
      errors: Array<{ class_id?: string; error?: string }> | undefined,
    ) => {
      if (!errors || errors.length === 0) return;
      const formatted = errors.map((entry) => {
        const classId = entry.class_id ?? "Unknown class";
        const message = entry.error ?? "Unknown error";
        return `${describeClass(classId)}: ${message}`;
      });

      console.error(`[${label}] per-class errors`, formatted, errors);

      const preview = formatted.slice(0, 2).join(" | ");
      const remaining = formatted.length - 2;
      const tail = remaining > 0 ? ` (+${remaining} more)` : "";

      toast.error(
        `${label} failed for ${errors.length} ${errors.length === 1 ? "class" : "classes"}. ${preview}${tail}`,
      );
    },
    [describeClass],
  );

  const missedClasses = useMemo(
    () =>
      allClasses.filter(
        (item) =>
          item.attendanceStatus === "ABSENT" || fadeOutState[item.classID],
      ),
    [allClasses, fadeOutState],
  );

  const missedClassesSorted = useMemo(() => {
    const items = [...missedClasses];
    items.sort((a, b) =>
      missedSortDirection === "asc"
        ? getClassStartMs(a) - getClassStartMs(b)
        : getClassStartMs(b) - getClassStartMs(a),
    );
    return items;
  }, [missedClasses, missedSortDirection]);

  const isEligibleForBulk = useCallback((item: PastClass) => {
    return item.attendanceStatus === "ABSENT";
  }, []);

  const missedClassesByDate = useMemo(() => {
    const grouped: ClassesByDate = {};

    missedClassesSorted.forEach((item) => {
      const dateKey = getISTDateString(parseTimestampAsIST(item.classStartTime));
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey]?.push(item);
    });

    Object.values(grouped).forEach((items) => {
      items.sort((a, b) =>
        missedSortDirection === "asc"
          ? getClassStartMs(a) - getClassStartMs(b)
          : getClassStartMs(b) - getClassStartMs(a),
      );
    });

    return grouped;
  }, [missedClassesSorted, missedSortDirection]);

  const missedDateKeys = useMemo(() => {
    const keys = Object.keys(missedClassesByDate);
    return keys.sort((a, b) => {
      if (a === b) return 0;
      if (missedSortDirection === "asc") {
        return a > b ? 1 : -1;
      }
      return a < b ? 1 : -1;
    });
  }, [missedClassesByDate, missedSortDirection]);

  const missedClassesByCourse = useMemo(() => {
    const grouped: ClassesByCourse = {};

    missedClassesSorted.forEach((item) => {
      if (!grouped[item.courseID]) {
        grouped[item.courseID] = { name: item.courseName, classes: [] };
      }
      grouped[item.courseID]?.classes.push(item);
    });

    Object.values(grouped).forEach((group) => {
      group.classes.sort((a, b) =>
        missedSortDirection === "asc"
          ? getClassStartMs(a) - getClassStartMs(b)
          : getClassStartMs(b) - getClassStartMs(a),
      );
    });

    return grouped;
  }, [missedClassesSorted, missedSortDirection]);

  const missedCourseKeys = useMemo(() => {
    const keys = Object.keys(missedClassesByCourse);
    return keys.sort((a, b) => {
      const nameA = missedClassesByCourse[a]?.name ?? "";
      const nameB = missedClassesByCourse[b]?.name ?? "";
      return nameA.localeCompare(nameB);
    });
  }, [missedClassesByCourse]);

  const eligibleMissedClasses = useMemo(
    () => missedClasses.filter(isEligibleForBulk),
    [missedClasses, isEligibleForBulk],
  );

  const eligibleMissedIds = useMemo(
    () => new Set(eligibleMissedClasses.map((item) => item.classID)),
    [eligibleMissedClasses],
  );

  useEffect(() => {
    if (activeTab !== "missed") {
      setIsMultiSelectMode(false);
      setSelectedClasses(new Set());
      return;
    }

    if (selectedClasses.size === 0) return;

    setSelectedClasses((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (eligibleMissedIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [activeTab, eligibleMissedIds, selectedClasses.size]);

  useEffect(() => {
    if (activeTab !== "missed") return;
    if (missedViewMode === "list") return;
    setIsMultiSelectMode(false);
    setSelectedClasses(new Set());
  }, [activeTab, missedViewMode]);

  useEffect(() => {
    if (activeTab !== "missed" || missedClasses.length === 0) {
      setIsControlsMenuOpen(false);
      setIsSortMenuOpen(false);
    }
  }, [activeTab, missedClasses.length]);

  const activeDialogClass = useMemo(
    () => allClasses.find((item) => item.classID === dialogClassId) ?? null,
    [allClasses, dialogClassId],
  );

  const dateActionTargets = useMemo(() => {
    if (!dateActionDialog) return [];
    const dayClasses = classesByDate[dateActionDialog.dateKey] ?? [];
    return dayClasses.filter((item) =>
      dateActionDialog.action === "present"
        ? item.attendanceStatus === "ABSENT"
        : item.attendanceStatus === "PRESENT",
    );
  }, [classesByDate, dateActionDialog]);

  const dateActionPreview = useMemo(() => {
    const previewItems = dateActionTargets.slice(0, 2);
    return {
      items: previewItems,
      remaining: Math.max(0, dateActionTargets.length - previewItems.length),
      count: dateActionTargets.length,
    };
  }, [dateActionTargets]);

  const missedGroupTargets = useMemo(() => {
    if (!missedGroupDialog) return [];
    if (missedGroupDialog.mode === "date") {
      return (missedClassesByDate[missedGroupDialog.key] ?? []).filter(
        isEligibleForBulk,
      );
    }
    return (
      missedClassesByCourse[missedGroupDialog.key]?.classes ?? []
    ).filter(isEligibleForBulk);
  }, [
    missedGroupDialog,
    missedClassesByDate,
    missedClassesByCourse,
    isEligibleForBulk,
  ]);

  const missedGroupLabel = useMemo(() => {
    if (!missedGroupDialog) return "";
    if (missedGroupDialog.mode === "date") {
      return formatDateHeader(missedGroupDialog.key);
    }
    return missedClassesByCourse[missedGroupDialog.key]?.name ?? "Class";
  }, [missedGroupDialog, missedClassesByCourse]);

  const missedGroupPreview = useMemo(() => {
    const previewItems = missedGroupTargets.slice(0, 2);
    return {
      items: previewItems,
      remaining: Math.max(0, missedGroupTargets.length - previewItems.length),
      count: missedGroupTargets.length,
    };
  }, [missedGroupTargets]);

  const updateClassAttendance = useCallback(
    (classIds: Set<string>, status: AttendanceStatus) => {
      if (!userId) return;
      queryClient.setQueryData<PastClass[]>(
        queryKeys.pastClasses(userId, activeFilter),
        (prev = []) =>
          prev.map((item) =>
            classIds.has(item.classID)
              ? { ...item, attendanceStatus: status }
              : item,
          ),
      );
    },
    [activeFilter, queryClient, userId],
  );

  const handleDialogCheckIn = useCallback(async () => {
    if (!activeDialogClass) return;

    if (activeDialogClass.attendanceStatus !== "ABSENT") {
      return;
    }

    const result = await checkIn({
      classID: activeDialogClass.classID,
      classStartTime: activeDialogClass.classStartTime,
    });

    if (result.success) {
      updateClassAttendance(new Set([activeDialogClass.classID]), "PRESENT");
      markRecentlyUpdated(activeDialogClass.classID);
      startFadeOut(new Set([activeDialogClass.classID]));
      setDialogClassId(null);
    }
  }, [
    activeDialogClass,
    checkIn,
    markRecentlyUpdated,
    startFadeOut,
    updateClassAttendance,
  ]);

  const handleDialogMarkAbsent = useCallback(async () => {
    if (!activeDialogClass) return;

    if (activeDialogClass.attendanceStatus !== "PRESENT") return;

    const result = await markAbsent({
      classID: activeDialogClass.classID,
      classStartTime: activeDialogClass.classStartTime,
    });

    if (result.success) {
      updateClassAttendance(new Set([activeDialogClass.classID]), "ABSENT");
      markRecentlyUpdated(activeDialogClass.classID);
      setDialogClassId(null);
    }
  }, [
    activeDialogClass,
    markAbsent,
    markRecentlyUpdated,
    updateClassAttendance,
  ]);

  const handleConfirmDateAction = async () => {
    if (!dateActionDialog || !userId) return;

    const { dateKey, action } = dateActionDialog;
    const targets = dateActionTargets;

    if (targets.length === 0) {
      toast.error("No classes to update for this date.");
      setDateActionDialog(null);
      return;
    }

    setDateActionPending(true);

    try {
      if (action === "present") {
        const classIds = targets.map((item) => item.classID);
        const response = await bulkCheckInRpc({ classIds });

        const status = String(response.status ?? "").toLowerCase();
        if (status !== "success") {
          toast.error(String(response.message ?? "Bulk check-in failed"));
          return;
        }

        const successIds = new Set<string>();
        const successfulResults = response.successful_results as
          | Array<{ class_id?: string }>
          | undefined;
        const alreadyRecorded = response.already_recorded_results as
          | Array<{ class_id?: string }>
          | undefined;

        successfulResults?.forEach((item) => {
          if (item?.class_id) successIds.add(item.class_id);
        });
        alreadyRecorded?.forEach((item) => {
          if (item?.class_id) successIds.add(item.class_id);
        });

        if (successIds.size > 0) {
          updateClassAttendance(successIds, "PRESENT");
          successIds.forEach((id) => markRecentlyUpdated(id));
        }

        const failedCount = Number(response.failed_checkins ?? 0);
        if (failedCount > 0) {
          toast.error(
            `Failed to update ${failedCount} ${failedCount === 1 ? "class" : "classes"}.`,
          );
        }
        notifyBulkErrors(
          "Mark all present",
          response.error_results as
            | Array<{ class_id?: string; error?: string }>
            | undefined,
        );

        const totalAmplix = Number(response.total_amplix_gained ?? 0);
        if (successIds.size > 0 || totalAmplix !== 0) {
          await syncAttendanceTotals(totalAmplix);
        }

        toast.success(
          String(
            response.message ?? `Marked ${successIds.size} classes present.`,
          ),
        );
      } else {
        const results = await Promise.all(
          targets.map(async (item) => {
            try {
              const response = await markClassAbsentRpc({
                classID: item.classID,
              });
              return {
                classID: item.classID,
                ok: response.status === "success",
                message: response.message,
                delta: computeAmplixDelta({
                  amplix_gained: response.amplix_gained,
                  amplix_lost: response.amplix_lost,
                }),
              };
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Unknown error";
              return { classID: item.classID, ok: false, message, delta: 0 };
            }
          }),
        );

        const succeeded = results.filter((item) => item.ok);
        const failed = results.filter((item) => !item.ok);

        if (succeeded.length > 0) {
          updateClassAttendance(
            new Set(succeeded.map((item) => item.classID)),
            "ABSENT",
          );
          succeeded.forEach((item) => markRecentlyUpdated(item.classID));
        }

        if (failed.length > 0) {
          toast.error(
            `Failed to update ${failed.length} ${failed.length === 1 ? "class" : "classes"}.`,
          );
          notifyBulkErrors(
            "Mark all absent",
            failed.map((item) => ({
              class_id: item.classID,
              error: item.message ?? "Unknown error",
            })),
          );
        }

        if (succeeded.length > 0) {
          toast.success(`Marked ${succeeded.length} classes absent.`);
          const totalDelta = succeeded.reduce(
            (sum, item) => sum + (item.delta || 0),
            0,
          );
          await syncAttendanceTotals(totalDelta);
        }
      }

      await pastClassesQuery.refetch();
      setDateActionDialog(null);
    } finally {
      setDateActionPending(false);
    }
  };

  const handleBackNavigation = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard");
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    void pastClassesQuery.refetch();
  };

  const syncAttendanceTotals = useCallback(
    async (amplixDelta: number) => {
      if (!userId) return;
      try {
        const summary = await getCourseAttendanceSummaryRpc(userId);
        enqueueFirestoreAttendanceUpdate(
          {
            uid: userId,
            summary,
            amplixDelta,
          },
          { urgent: true },
        );
        await flushNow();
      } catch {
        toast.error("Unable to sync attendance totals.");
      }
    },
    [userId],
  );

  const handleJumpToToday = useCallback(() => {
    if (typeof window === "undefined") return;
    const target = document.getElementById(`date-${todayKey}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [todayKey]);

  const handleToggleClass = (classId: string) => {
    if (!eligibleMissedIds.has(classId)) return;

    setSelectedClasses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedClasses(
      new Set(eligibleMissedClasses.map((item) => item.classID)),
    );
  };

  const handleClearSelection = () => {
    setSelectedClasses(new Set());
  };

  const handleInvertSelection = () => {
    setSelectedClasses((prev) => {
      const newSet = new Set<string>();
      eligibleMissedClasses.forEach((item) => {
        if (!prev.has(item.classID)) {
          newSet.add(item.classID);
        }
      });
      return newSet;
    });
  };

  const handleBulkCheckIn = async () => {
    if (isBulkPending) return;

    if (!userId) {
      toast.error("Please sign in to mark attendance");
      return;
    }

    const targets = eligibleMissedClasses.filter((item) =>
      selectedClasses.has(item.classID),
    );

    if (targets.length === 0) {
      toast.error("No eligible classes selected");
      return;
    }

    setIsBulkPending(true);

    try {
      const classIds = targets.map((item) => item.classID);
      const response = await bulkCheckInRpc({ classIds });

      const status = String(response.status ?? "").toLowerCase();
      if (status !== "success") {
        toast.error(String(response.message ?? "Bulk check-in failed"));
        return;
      }

      const successIds = new Set<string>();
      const successfulResults = response.successful_results as
        | Array<{ class_id?: string }>
        | undefined;
      const alreadyRecorded = response.already_recorded_results as
        | Array<{ class_id?: string }>
        | undefined;

      successfulResults?.forEach((item) => {
        if (item?.class_id) successIds.add(item.class_id);
      });
      alreadyRecorded?.forEach((item) => {
        if (item?.class_id) successIds.add(item.class_id);
      });

      if (successIds.size > 0) {
        updateClassAttendance(successIds, "PRESENT");
        successIds.forEach((id) => markRecentlyUpdated(id));
        startFadeOut(successIds);
      }

      const failedCount = Number(response.failed_checkins ?? 0);
      if (failedCount > 0) {
        toast.error(
          `Failed to check in ${failedCount} ${failedCount === 1 ? "class" : "classes"}.`,
        );
      }
      notifyBulkErrors(
        "Bulk check-in",
        response.error_results as
          | Array<{ class_id?: string; error?: string }>
          | undefined,
      );

      const totalAmplix = Number(response.total_amplix_gained ?? 0);
      if (successIds.size > 0 || totalAmplix !== 0) {
        await syncAttendanceTotals(totalAmplix);
      }

      toast.success(
        String(
          response.message ??
            `Checked in ${successIds.size} ${successIds.size === 1 ? "class" : "classes"}.`,
        ),
      );

      setSelectedClasses(new Set());
      setIsMultiSelectMode(false);
      await pastClassesQuery.refetch();
    } catch (error) {
      console.error("Bulk check-in failed:", error);
      toast.error("Bulk check-in failed. Please try again.");
    } finally {
      setIsBulkPending(false);
    }
  };

  const handleConfirmMissedGroupCheckIn = async () => {
    if (missedGroupPending) return;
    if (!missedGroupDialog || !userId) return;

    if (missedGroupTargets.length === 0) {
      toast.error("No eligible classes to check in.");
      setMissedGroupDialog(null);
      return;
    }

    setMissedGroupPending(true);
    let didSucceed = false;

    try {
      const classIds = missedGroupTargets.map((item) => item.classID);
      const response = await bulkCheckInRpc({ classIds });

      const status = String(response.status ?? "").toLowerCase();
      if (status !== "success") {
        toast.error(String(response.message ?? "Bulk check-in failed"));
        return;
      }

      const successIds = new Set<string>();
      const successfulResults = response.successful_results as
        | Array<{ class_id?: string }>
        | undefined;
      const alreadyRecorded = response.already_recorded_results as
        | Array<{ class_id?: string }>
        | undefined;

      successfulResults?.forEach((item) => {
        if (item?.class_id) successIds.add(item.class_id);
      });
      alreadyRecorded?.forEach((item) => {
        if (item?.class_id) successIds.add(item.class_id);
      });

      if (successIds.size > 0) {
        updateClassAttendance(successIds, "PRESENT");
        successIds.forEach((id) => markRecentlyUpdated(id));
        startFadeOut(successIds);
      }

      const failedCount = Number(response.failed_checkins ?? 0);
      if (failedCount > 0) {
        toast.error(
          `Failed to check in ${failedCount} ${failedCount === 1 ? "class" : "classes"}.`,
        );
      }
      notifyBulkErrors(
        "Bulk check-in",
        response.error_results as
          | Array<{ class_id?: string; error?: string }>
          | undefined,
      );

      const totalAmplix = Number(response.total_amplix_gained ?? 0);
      if (successIds.size > 0 || totalAmplix !== 0) {
        await syncAttendanceTotals(totalAmplix);
      }

      toast.success(
        String(
          response.message ??
            `Checked in ${successIds.size} ${successIds.size === 1 ? "class" : "classes"}.`,
        ),
      );

      didSucceed = true;
      await pastClassesQuery.refetch();
    } catch (error) {
      console.error("Bulk check-in failed:", error);
      toast.error("Bulk check-in failed. Please try again.");
    } finally {
      setMissedGroupPending(false);
      if (didSucceed) {
        setMissedGroupDialog(null);
      }
    }
  };

  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedClasses(new Set());
      }
      return next;
    });
  };

  const handleSetMissedViewMode = (mode: MissedViewMode) => {
    setMissedViewMode(mode);
  };

  const handleControlsMenuKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (!controlsMenuRef.current) return;
    const items = Array.from(
      controlsMenuRef.current.querySelectorAll<HTMLButtonElement>(
        "[role^='menuitem']",
      ),
    );
    if (items.length === 0) return;

    const currentIndex = items.findIndex(
      (item) => item === document.activeElement,
    );

    if (event.key === "Escape") {
      event.preventDefault();
      setIsControlsMenuOpen(false);
      controlsMenuButtonRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
      items[nextIndex]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex =
        currentIndex < 0
          ? items.length - 1
          : (currentIndex - 1 + items.length) % items.length;
      items[nextIndex]?.focus();
    }

    if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    }

    if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  const handleControlsMenuButtonKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsControlsMenuOpen(true);
      setIsSortMenuOpen(false);
      window.setTimeout(() => {
        const firstItem = controlsMenuRef.current?.querySelector<
          HTMLButtonElement
        >("[role^='menuitem']");
        firstItem?.focus();
      }, 0);
    }
  };

  const handleSortMenuKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (!sortMenuRef.current) return;
    const items = Array.from(
      sortMenuRef.current.querySelectorAll<HTMLButtonElement>(
        "[role^='menuitem']",
      ),
    );
    if (items.length === 0) return;
    const currentIndex = items.findIndex(
      (item) => item === document.activeElement,
    );

    if (event.key === "Escape") {
      event.preventDefault();
      setIsSortMenuOpen(false);
      sortMenuButtonRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
      items[nextIndex]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex =
        currentIndex < 0
          ? items.length - 1
          : (currentIndex - 1 + items.length) % items.length;
      items[nextIndex]?.focus();
    }
  };

  const handleSortMenuButtonKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsSortMenuOpen(true);
      setIsControlsMenuOpen(false);
      window.setTimeout(() => {
        const firstItem = sortMenuRef.current?.querySelector<HTMLButtonElement>(
          "[role^='menuitem']",
        );
        firstItem?.focus();
      }, 0);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inButton =
        controlsMenuWrapperRef.current &&
        controlsMenuWrapperRef.current.contains(target);
      const inMenu =
        controlsMenuRef.current && controlsMenuRef.current.contains(target);

      if (!inButton && !inMenu) {
        setIsControlsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isSortMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inButton =
        sortMenuButtonRef.current &&
        sortMenuButtonRef.current.contains(target);
      const inMenu = sortMenuRef.current && sortMenuRef.current.contains(target);
      if (!inButton && !inMenu) {
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSortMenuOpen]);

  useEffect(() => {
    if (!openDateMenu) return;
    const handleMenuClose = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dateMenuRef.current?.contains(target)) return;
      if (dateMenuButtonRef.current?.contains(target)) return;
      setOpenDateMenu(null);
    };
    document.addEventListener("mousedown", handleMenuClose);
    return () => document.removeEventListener("mousedown", handleMenuClose);
  }, [openDateMenu]);

  useEffect(() => {
    if (!openDateMenu) return;

    const updatePosition = () => {
      const button = dateMenuButtonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const menuWidth = 192;
      const left = Math.max(12, rect.right + window.scrollX - menuWidth);
      setDateMenuStyle({
        position: "absolute",
        left,
        top: rect.bottom + window.scrollY + 8,
        minWidth: menuWidth,
        zIndex: 220,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [openDateMenu]);

  useEffect(() => {
    if (!isControlsMenuOpen) return;

    const updatePosition = () => {
      const button = controlsMenuButtonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      setControlsMenuStyle({
        position: "absolute",
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY + 8,
        minWidth: Math.max(200, rect.width),
        zIndex: 200,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isControlsMenuOpen]);

  useEffect(() => {
    if (!isSortMenuOpen) return;
    const updatePosition = () => {
      const button = sortMenuButtonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      setSortMenuStyle({
        position: "absolute",
        left: rect.left + window.scrollX,
        top: rect.bottom + window.scrollY + 8,
        minWidth: 200,
        zIndex: 205,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isSortMenuOpen]);

  const showEmptyState =
    activeTab === "missed"
      ? missedClasses.length === 0
      : allClasses.length === 0;

  const renderMissedClassCard = (
    item: PastClass,
    index: number,
    options?: {
      showSelection?: boolean;
      showDateLabel?: boolean;
      animationDelayMs?: number;
    },
  ) => {
    const showSelection = options?.showSelection ?? isMultiSelectMode;
    const isSelected = showSelection && selectedClasses.has(item.classID);
    const isMissed = item.attendanceStatus === "ABSENT";
    const fadePhase = fadeOutState[item.classID];
    const isFadingOut = !!fadePhase;
    const dateKey = getISTDateString(
      parseTimestampAsIST(item.classStartTime),
    );
    const timeRange = `${formatTime(item.classStartTime)} – ${formatTime(
      item.classEndTime,
    )}`;
    const canSelect = eligibleMissedIds.has(item.classID);
    const isPending = pendingByClassId?.has(item.classID) ?? false;
    const isRecentlyUpdated = recentlyUpdated.has(item.classID);
    const cardKey = `${item.classID}-${item.classStartTime}`;
    const showDateLabel = options?.showDateLabel ?? true;

    return (
      <div
        key={cardKey}
        className={`group relative px-4 py-4 border-2 border-black transition-all duration-300 ease-out transform animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:transform-none ${
          isSelected
            ? "bg-yellow-400 shadow-[5px_5px_0_#0a0a0a] scale-[1.01]"
            : isMissed && !isFadingOut
              ? "bg-red-500 shadow-[5px_5px_0_#0a0a0a] hover:shadow-[7px_7px_0_#0a0a0a] hover:-translate-y-1 hover:brightness-105"
              : "bg-green-400 shadow-[5px_5px_0_#0a0a0a] hover:shadow-[7px_7px_0_#0a0a0a] hover:-translate-y-1 hover:brightness-105"
        } ${isPending ? "opacity-70 animate-pulse" : ""} ${
          isRecentlyUpdated ? "ring-4 ring-yellow-300" : ""
        } ${
          fadePhase === "fade"
            ? "opacity-0 -translate-y-2 scale-[0.98] pointer-events-none"
            : ""
        }`}
        style={{
          animationDelay: `${options?.animationDelayMs ?? index * 20}ms`,
        }}
      >
        <div className="flex items-start gap-3">
          {showSelection && (
            <button
              type="button"
              onClick={() => handleToggleClass(item.classID)}
              disabled={!canSelect}
              className="shrink-0 mt-0.5 h-5 w-5 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSelected && (
                <Check className="h-3.5 w-3.5 text-stone-900 font-black" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => !showSelection && setDialogClassId(item.classID)}
            disabled={showSelection}
            className="flex-1 text-left min-w-0 disabled:cursor-default"
          >
            <div className="space-y-2">
              <h3 className="font-black text-base sm:text-lg uppercase tracking-wide truncate text-stone-900 transition-all duration-300 group-hover:tracking-wider leading-tight">
                {item.courseName}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-sm font-bold text-stone-800">
                <span className="font-mono text-sm">{timeRange}</span>
                {showDateLabel && (
                  <>
                    <span className="hidden sm:inline text-xs">•</span>
                    <span className="text-xs opacity-90">
                      {formatDateLabel(dateKey)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 transition-colors duration-300 relative isolate">
      <DotPatternBackground />

      <div className="mx-auto max-w-3xl relative z-10">
        <header className="bg-white border-b-4 border-black px-4 py-3 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div className="mb-4 flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-4 py-3 text-sm font-black uppercase shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-[3px_3px_0px_0px_#000] self-start"
            >
              <ArrowLeft className="h-5 w-5" />
              BACK TO HOME
            </Link>
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase">
                <li>
                  <Link
                    href="/"
                    className="text-neutral-500 hover:text-black transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li className="text-neutral-300">/</li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-neutral-500 hover:text-black transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="text-neutral-300">/</li>
                <li className="text-black">Classes</li>
              </ol>
            </nav>
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-stone-900 tracking-tight">
              Classes
            </h1>
          </div>

          <div
            role="tablist"
            aria-label="View mode"
            className="flex items-center border-2 border-black bg-white shadow-[4px_4px_0_#0a0a0a] overflow-hidden"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "all"}
              tabIndex={activeTab === "all" ? 0 : -1}
              onClick={() => setActiveTab("all")}
              className={`flex-1 px-4 py-2.5 text-xs font-black uppercase tracking-wide transition-all duration-200 ${
                activeTab === "all"
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-700 hover:bg-yellow-100"
              }`}
            >
              All Classes
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "missed"}
              tabIndex={activeTab === "missed" ? 0 : -1}
              onClick={() => setActiveTab("missed")}
              className={`flex-1 px-4 py-2.5 text-xs font-black uppercase tracking-wide transition-all duration-200 border-l-2 border-black ${
                activeTab === "missed"
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-700 hover:bg-red-100"
              }`}
            >
              Missed
            </button>
          </div>

          {isMounted && (
            <div
              role="group"
              aria-label="Status summary"
              className="mt-4 flex flex-wrap items-center gap-2 border-2 border-black bg-white px-3 py-2 shadow-[3px_3px_0_#0a0a0a]"
            >
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-stone-600">
                <span>Status Summary</span>
                <span className="h-4 w-px bg-black/40" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-black uppercase tracking-wide">
                <div className="flex items-center gap-2 border-2 border-black bg-white px-2.5 py-1 shadow-[2px_2px_0_#0a0a0a]">
                  <span className="h-2 w-2 rounded-full bg-stone-900" />
                  <span>Range: {activeFilterLabel}</span>
                </div>
                <div className="flex items-center gap-2 border-2 border-black bg-yellow-100 px-2.5 py-1 shadow-[2px_2px_0_#0a0a0a]">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span>Total: {totalCount}</span>
                </div>
                <div className="flex items-center gap-2 border-2 border-black bg-red-100 px-2.5 py-1 shadow-[2px_2px_0_#0a0a0a]">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Missed: {missedCount}</span>
                </div>
                {activeTab === "missed" && isMultiSelectMode && (
                  <div className="flex items-center gap-2 border-2 border-black bg-green-100 px-2.5 py-1 shadow-[2px_2px_0_#0a0a0a]">
                    <span className="h-2 w-2 rounded-full bg-green-600" />
                    <span>Selected: {selectedClasses.size}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        <section className="bg-white border-b-4 border-black px-4 py-3 sm:px-6 sticky top-0 z-10 shadow-[0_6px_0_#0a0a0a] backdrop-blur-sm bg-white/95">
          <div
            role="menubar"
            aria-label="Classes controls"
            className="flex flex-wrap items-center gap-2.5"
          >
            <div
              role="tablist"
              aria-label="View mode"
              className="hidden sm:inline-flex items-center border-2 border-black bg-white shadow-[4px_4px_0_#0a0a0a] overflow-hidden"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "all"}
                tabIndex={activeTab === "all" ? 0 : -1}
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-wide transition-all duration-200 ${
                  activeTab === "all"
                    ? "bg-stone-900 text-white"
                    : "bg-white text-stone-700 hover:bg-yellow-100"
                }`}
              >
                All Classes
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "missed"}
                tabIndex={activeTab === "missed" ? 0 : -1}
                onClick={() => setActiveTab("missed")}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-wide transition-all duration-200 border-l-2 border-black ${
                  activeTab === "missed"
                    ? "bg-stone-900 text-white"
                    : "bg-white text-stone-700 hover:bg-red-100"
                }`}
              >
                Missed
              </button>
            </div>

            <div ref={controlsMenuWrapperRef} className="relative">
              <button
                ref={controlsMenuButtonRef}
                type="button"
                onClick={() => {
                  setIsControlsMenuOpen((prev) => !prev);
                  setIsSortMenuOpen(false);
                }}
                onKeyDown={handleControlsMenuButtonKeyDown}
                aria-expanded={isControlsMenuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 h-11 px-3.5 py-2.5 bg-stone-900 text-white border-2 border-black text-xs font-black uppercase whitespace-nowrap shadow-[4px_4px_0_#0a0a0a] transition-all duration-200 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-1 active:translate-y-1 active:shadow-[2px_2px_0_#0a0a0a]"
              >
                <Menu className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">Filters</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isControlsMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {activeTab === "missed" && missedClasses.length > 0 && (
                <>
                  <div className="relative">
                    <button
                      ref={sortMenuButtonRef}
                      type="button"
                      onClick={() => {
                        setIsSortMenuOpen((prev) => !prev);
                        setIsControlsMenuOpen(false);
                      }}
                      onKeyDown={handleSortMenuButtonKeyDown}
                      aria-expanded={isSortMenuOpen}
                      aria-haspopup="menu"
                      className="flex items-center gap-2 h-11 px-3.5 py-2.5 border-2 border-black text-xs font-black uppercase whitespace-nowrap bg-white text-stone-900 shadow-[4px_4px_0_#0a0a0a] transition-all duration-300 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="hidden sm:inline">Sort & Group</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${isSortMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>

                  {missedViewMode === "list" && (
                    <button
                      type="button"
                      onClick={handleToggleMultiSelect}
                      aria-pressed={isMultiSelectMode}
                      className={`flex items-center justify-center h-11 w-11 border-2 border-black text-xs font-black uppercase whitespace-nowrap transition-all duration-300 ${
                        isMultiSelectMode
                          ? "bg-yellow-400 text-stone-900 shadow-[4px_4px_0_#0a0a0a] -translate-y-0.5"
                          : "bg-white text-stone-900 shadow-[4px_4px_0_#0a0a0a] hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
                      }`}
                      aria-label={
                        isMultiSelectMode
                          ? "Exit multi-select"
                          : "Enable multi-select"
                      }
                    >
                      {isMultiSelectMode ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <ListChecks className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </>
              )}

              {canJumpToToday && (
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="flex items-center gap-2 h-11 px-3.5 py-2.5 border-2 border-black text-xs font-black uppercase whitespace-nowrap bg-white text-stone-900 shadow-[4px_4px_0_#0a0a0a] transition-all duration-300 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Jump to Today</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="Refresh classes"
                aria-busy={isRefreshing}
                className={`group flex items-center justify-center h-11 w-11 border-2 border-black text-xs font-black uppercase whitespace-nowrap transition-all duration-300 ${
                  isRefreshing
                    ? "bg-yellow-400 text-stone-900 shadow-[3px_3px_0_#0a0a0a] scale-95"
                    : "bg-white text-stone-900 shadow-[4px_4px_0_#0a0a0a] hover:shadow-[6px_6px_0_#0a0a0a] hover:-translate-y-1 hover:bg-yellow-50 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
                } disabled:cursor-not-allowed`}
              >
                <RefreshCw
                  className={`h-4 w-4 transition-transform duration-700 ${isRefreshing ? "animate-spin" : "group-hover:rotate-180"}`}
                />
              </button>
            </div>
          </div>
        </section>

        <section className="px-4 py-3 sm:px-6">
          {error && (
            <div className="mb-4 border-2 border-black bg-red-100 px-4 py-3 shadow-[4px_4px_0_#0a0a0a]">
              <p className="text-xs font-black uppercase text-red-700">
                {error}
              </p>
            </div>
          )}

          {loading && allClasses.length === 0 ? (
            <div className="mt-8">
              <div className="border-2 border-black bg-white px-6 py-8 shadow-[6px_6px_0_#0a0a0a]">
                <p className="text-lg font-black uppercase text-stone-900 mb-2">
                  Loading classes...
                </p>
                <p className="text-sm font-bold text-stone-600">
                  Pulling your past sessions from Supabase.
                </p>
              </div>
            </div>
          ) : showEmptyState ? (
            <div className="mt-8">
              <div className="border-2 border-black bg-white px-6 py-8 shadow-[6px_6px_0_#0a0a0a] transition-all duration-200 hover:shadow-[7px_7px_0_#0a0a0a] hover:-translate-y-1">
                <p className="text-lg font-black uppercase text-stone-900 mb-2">
                  Nothing to See here...
                </p>
                <p className="text-sm font-bold text-stone-600">
                  Looks like no classes yet — maybe it&apos;s a holiday, or
                  maybe admin&apos;s still asleep 😴
                </p>
              </div>
            </div>
          ) : activeTab === "missed" ? (
            missedViewMode === "list" ? (
              <div className="space-y-3">
                {isMultiSelectMode && missedClasses.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="text-xs font-black uppercase text-stone-600">
                      {selectedClasses.size} selected
                    </div>
                    <div className="flex gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="px-2.5 py-1.5 bg-white border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a]"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleInvertSelection}
                        className="px-2.5 py-1.5 bg-white border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a]"
                      >
                        Invert
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="px-2.5 py-1.5 bg-white border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a]"
                      >
                        Clear
                      </button>
                      {selectedClasses.size > 0 && (
                        <button
                          type="button"
                          onClick={handleBulkCheckIn}
                          disabled={isBulkPending}
                          aria-busy={isBulkPending}
                          className="px-3 py-1.5 bg-stone-900 text-white border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isBulkPending ? (
                            <RefreshCw className="h-3 w-3 inline mr-1 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3 inline mr-1" />
                          )}
                          {isBulkPending
                            ? "Checking In..."
                            : `Check In (${selectedClasses.size})`}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5" style={listPerfStyle}>
                  {missedClassesSorted.map((item, index) =>
                    renderMissedClassCard(item, index, {
                      showSelection: isMultiSelectMode,
                      showDateLabel: true,
                    }),
                  )}
                </div>
              </div>
            ) : missedViewMode === "date" ? (
              <div className="space-y-4" style={listPerfStyle}>
                {missedDateKeys.map((dateKey, dateIndex) => {
                  const dayClasses = missedClassesByDate[dateKey] ?? [];
                  const eligibleCount = dayClasses.filter(isEligibleForBulk)
                    .length;

                  return (
                    <div
                      key={dateKey}
                      className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none motion-reduce:opacity-100"
                      style={
                        {
                          animationDelay: `${dateIndex * 80}ms`,
                          contentVisibility: "auto",
                          containIntrinsicSize: "1px 320px",
                        } as CSSProperties
                      }
                    >
                      <div className="border-2 border-black bg-yellow-300 px-4 py-2.5 shadow-[4px_4px_0_#0a0a0a] transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[2px_2px_0_#0a0a0a]">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <h2 className="text-xs font-black uppercase tracking-wider text-stone-900">
                            {formatDateHeader(dateKey)}
                          </h2>
                          <span className="text-[10px] font-black uppercase tracking-wide text-stone-700 border-2 border-black bg-white px-2 py-0.5 shadow-[2px_2px_0_#0a0a0a]">
                            {dayClasses.length}{" "}
                            {dayClasses.length === 1 ? "class" : "classes"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setMissedGroupDialog({
                              mode: "date",
                              key: dateKey,
                            })
                          }
                          disabled={missedGroupPending || eligibleCount === 0}
                          aria-busy={missedGroupPending}
                          className="flex items-center justify-center gap-2 h-8 w-full sm:w-auto px-2.5 border-2 border-black bg-white text-[10px] font-black uppercase shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="h-4 w-4 border-2 border-black bg-white flex items-center justify-center">
                            <Check className="h-3 w-3 text-stone-900" />
                          </span>
                          <span>Check In All</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {dayClasses.map((item, itemIndex) =>
                          renderMissedClassCard(item, itemIndex, {
                            showSelection: false,
                            showDateLabel: false,
                            animationDelayMs: dateIndex * 80 + itemIndex * 25,
                          }),
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4" style={listPerfStyle}>
                {missedCourseKeys.map((courseId, courseIndex) => {
                  const group = missedClassesByCourse[courseId];
                  const classItems = group?.classes ?? [];
                  const eligibleCount = classItems.filter(isEligibleForBulk)
                    .length;

                  return (
                    <div
                      key={courseId}
                      className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none motion-reduce:opacity-100"
                      style={
                        {
                          animationDelay: `${courseIndex * 80}ms`,
                          contentVisibility: "auto",
                          containIntrinsicSize: "1px 320px",
                        } as CSSProperties
                      }
                    >
                      <div className="border-2 border-black bg-blue-200 px-4 py-2.5 shadow-[4px_4px_0_#0a0a0a] transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[2px_2px_0_#0a0a0a]">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <h2 className="text-xs font-black uppercase tracking-wider text-stone-900 break-words sm:truncate">
                            {group?.name ?? "Class"}
                          </h2>
                          <span className="text-[10px] font-black uppercase tracking-wide text-stone-700 border-2 border-black bg-white px-2 py-0.5 shadow-[2px_2px_0_#0a0a0a]">
                            {classItems.length}{" "}
                            {classItems.length === 1 ? "class" : "classes"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setMissedGroupDialog({
                              mode: "class",
                              key: courseId,
                            })
                          }
                          disabled={missedGroupPending || eligibleCount === 0}
                          aria-busy={missedGroupPending}
                          className="flex items-center justify-center gap-2 h-8 w-full sm:w-auto px-2.5 border-2 border-black bg-white text-[10px] font-black uppercase shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="h-4 w-4 border-2 border-black bg-white flex items-center justify-center">
                            <Check className="h-3 w-3 text-stone-900" />
                          </span>
                          <span>Check In All</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {classItems.map((item, itemIndex) =>
                          renderMissedClassCard(item, itemIndex, {
                            showSelection: false,
                            showDateLabel: true,
                            animationDelayMs: courseIndex * 80 + itemIndex * 25,
                          }),
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="space-y-4" style={listPerfStyle}>
              {sortedGroupKeys.map((dateKey, dateIndex) => {
                const dayClasses = classesByDate[dateKey] ?? [];
                const isMenuOpen = openDateMenu === dateKey;

                return (
                  <div
                    key={dateKey}
                    id={`date-${dateKey}`}
                    className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none motion-reduce:opacity-100"
                    style={
                      {
                        animationDelay: `${dateIndex * 80}ms`,
                        contentVisibility: "auto",
                        containIntrinsicSize: "1px 360px",
                        scrollMarginTop: "140px",
                      } as CSSProperties
                    }
                  >
                    <div
                      className={`border-2 border-black bg-yellow-400 px-4 py-2.5 shadow-[4px_4px_0_#0a0a0a] transition-all duration-200 flex items-center justify-between gap-3 ${
                        isMenuOpen
                          ? "ring-2 ring-black/40 shadow-[5px_5px_0_#0a0a0a] -translate-y-0.5"
                          : "hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[2px_2px_0_#0a0a0a]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <h2 className="text-xs font-black uppercase tracking-wider text-stone-900">
                          {formatDateHeader(dateKey)}
                        </h2>
                        <span className="text-[10px] font-black uppercase tracking-wide text-stone-700 border-2 border-black bg-white px-2 py-0.5 shadow-[2px_2px_0_#0a0a0a]">
                          {dayClasses.length}{" "}
                          {dayClasses.length === 1 ? "class" : "classes"}
                        </span>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (openDateMenu === dateKey) {
                              setOpenDateMenu(null);
                              return;
                            }
                            dateMenuButtonRef.current = event.currentTarget;
                            setOpenDateMenu(dateKey);
                          }}
                          className={`h-8 w-8 border-2 border-black flex items-center justify-center transition-all duration-200 ${
                            isMenuOpen
                              ? "bg-stone-900 text-white shadow-[3px_3px_0_#0a0a0a]"
                              : "bg-white shadow-[2px_2px_0_#0a0a0a] hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a]"
                          }`}
                          aria-label="Date actions"
                          aria-expanded={isMenuOpen}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {dayClasses.map((item, itemIndex) => {
                        const isMissed = item.attendanceStatus === "ABSENT";
                        const timeRange = `${formatTime(
                          item.classStartTime,
                        )} – ${formatTime(item.classEndTime)}`;
                        const isPending =
                          pendingByClassId?.has(item.classID) ?? false;
                        const isRecentlyUpdated = recentlyUpdated.has(
                          item.classID,
                        );
                        const cardKey = `${item.classID}-${item.classStartTime}`;

                        return (
                          <button
                            key={cardKey}
                            type="button"
                            onClick={() => setDialogClassId(item.classID)}
                            className={`group w-full text-left px-5 py-4 border-2 border-black transition-all duration-300 ease-out transform hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:transform-none ${
                              isMissed
                                ? "bg-red-500 shadow-[5px_5px_0_#0a0a0a] hover:shadow-[7px_7px_0_#0a0a0a] hover:-translate-y-1 hover:brightness-105 active:translate-y-0.5 active:shadow-[3px_3px_0_#0a0a0a] active:scale-100"
                                : "bg-green-400 shadow-[5px_5px_0_#0a0a0a] hover:shadow-[7px_7px_0_#0a0a0a] hover:-translate-y-1 hover:brightness-105 active:translate-y-0.5 active:shadow-[3px_3px_0_#0a0a0a] active:scale-100"
                            } ${isPending ? "opacity-70 animate-pulse" : ""} ${
                              isRecentlyUpdated ? "ring-4 ring-yellow-300" : ""
                            }`}
                            style={{
                              animationDelay: `${dateIndex * 50 + itemIndex * 30}ms`,
                            }}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-black text-base uppercase tracking-wide mb-1 truncate text-stone-900 transition-all duration-300 group-hover:tracking-wider">
                                  {item.courseName}
                                </h3>
                                <p className="text-sm font-bold font-mono text-stone-800 transition-all duration-300 group-hover:text-stone-900">
                                  {timeRange}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {activeDialogClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md border-3 border-black bg-white shadow-[8px_8px_0_#0a0a0a] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="bg-yellow-400 border-b-3 border-black px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black uppercase text-stone-900 leading-tight tracking-tight truncate">
                    {activeDialogClass.courseName}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDialogClassId(null)}
                  className="h-9 w-9 border-2 border-black bg-white flex items-center justify-center font-black text-xl shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a]"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="bg-white px-6 py-6">
              <div className="mb-6 pb-5 border-b-2 border-stone-200">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">
                  Scheduled Time
                </p>
                <p className="text-sm font-bold text-stone-700 mb-1">
                  {formatDateLabel(
                    getISTDateString(
                      parseTimestampAsIST(activeDialogClass.classStartTime),
                    ),
                  )}
                </p>
                <p className="font-mono text-base font-black text-stone-900">
                  {formatTime(activeDialogClass.classStartTime)} –{" "}
                  {formatTime(activeDialogClass.classEndTime)}
                </p>
                {activeDialogClass.classVenue && (
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-stone-500">
                    Venue: {activeDialogClass.classVenue}
                  </p>
                )}
                <p className="mt-2 text-xs font-black uppercase tracking-wide text-stone-700">
                  Status: {activeDialogClass.attendanceStatus}
                </p>
              </div>

              <div className="space-y-3">
                {activeDialogClass.attendanceStatus === "ABSENT" && (
                  <button
                    type="button"
                    onClick={handleDialogCheckIn}
                    disabled={
                      pendingByClassId?.has(activeDialogClass.classID) ?? false
                    }
                    aria-busy={
                      pendingByClassId?.has(activeDialogClass.classID) ?? false
                    }
                    className={`w-full flex items-center justify-center gap-2 h-12 border-2 border-black px-4 text-sm font-black uppercase tracking-wide text-white shadow-[4px_4px_0_#0a0a0a] transition-all duration-300 ${
                      pendingByClassId?.has(activeDialogClass.classID)
                        ? "bg-stone-700 animate-pulse scale-[0.99]"
                        : "bg-stone-900 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {pendingByClassId?.has(activeDialogClass.classID) ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Mark as Attended
                      </>
                    )}
                  </button>
                )}
                {activeDialogClass.attendanceStatus === "PRESENT" && (
                  <button
                    type="button"
                    onClick={handleDialogMarkAbsent}
                    disabled={
                      pendingByClassId?.has(activeDialogClass.classID) ?? false
                    }
                    aria-busy={
                      pendingByClassId?.has(activeDialogClass.classID) ?? false
                    }
                    className={`w-full flex items-center justify-center gap-2 h-12 border-2 border-black px-4 text-sm font-black uppercase tracking-wide text-white shadow-[4px_4px_0_#0a0a0a] transition-all duration-300 ${
                      pendingByClassId?.has(activeDialogClass.classID)
                        ? "bg-red-400 animate-pulse scale-[0.99]"
                        : "bg-red-500 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {pendingByClassId?.has(activeDialogClass.classID) ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        Mark as Absent
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDialogClassId(null)}
                  className="w-full flex items-center justify-center gap-2 h-11 border-2 border-black bg-white px-4 text-sm font-black uppercase tracking-wide text-stone-900 shadow-[4px_4px_0_#0a0a0a] transition-all duration-300 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMounted &&
        openDateMenu &&
        dateMenuStyle &&
        (() => {
          const dayClasses = classesByDate[openDateMenu] ?? [];
          const canMarkPresent = dayClasses.some(
            (item) => item.attendanceStatus === "ABSENT",
          );
          const canMarkAbsent = dayClasses.some(
            (item) => item.attendanceStatus === "PRESENT",
          );

          return createPortal(
            <div
              ref={dateMenuRef}
              className="bg-white border-2 border-black shadow-[6px_6px_0_#0a0a0a]"
              style={dateMenuStyle}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenDateMenu(null);
                  setDateActionDialog({
                    dateKey: openDateMenu,
                    action: "present",
                  });
                }}
                disabled={!canMarkPresent}
                className={`w-full px-4 py-3 text-xs font-black uppercase text-left border-b border-stone-200 transition-colors ${
                  canMarkPresent
                    ? "hover:bg-green-100"
                    : "text-stone-400 cursor-not-allowed bg-stone-50"
                }`}
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenDateMenu(null);
                  setDateActionDialog({
                    dateKey: openDateMenu,
                    action: "absent",
                  });
                }}
                disabled={!canMarkAbsent}
                className={`w-full px-4 py-3 text-xs font-black uppercase text-left transition-colors ${
                  canMarkAbsent
                    ? "hover:bg-red-100"
                    : "text-stone-400 cursor-not-allowed bg-stone-50"
                }`}
              >
                Mark All Absent
              </button>
            </div>,
            document.body,
          );
        })()}

      {isMounted &&
        isControlsMenuOpen &&
        controlsMenuStyle &&
        createPortal(
          <div
            ref={controlsMenuRef}
            role="menu"
            aria-label="Range filters"
            onKeyDown={handleControlsMenuKeyDown}
            className="bg-stone-800 border-2 border-black shadow-[6px_6px_0_#0a0a0a] animate-in slide-in-from-top-2 duration-200"
            style={controlsMenuStyle}
          >
            <div className="border-b border-stone-700">
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-stone-300">
                Range
              </div>
              {DATE_RANGES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={activeFilter === option.value}
                  onClick={() => {
                    setActiveFilter(option.value);
                    setIsControlsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-xs font-black uppercase tracking-wide transition-all duration-150 border-b border-stone-700 last:border-b-0 ${
                    activeFilter === option.value
                      ? "bg-blue-600 text-white"
                      : "bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white"
                  }`}
                >
                  <span>{option.displayLabel}</span>
                  {activeFilter === option.value && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>

          </div>,
          document.body,
        )}

      {isMounted &&
        isSortMenuOpen &&
        sortMenuStyle &&
        createPortal(
          <div
            ref={sortMenuRef}
            role="menu"
            aria-label="Sort options"
            onKeyDown={handleSortMenuKeyDown}
            className="bg-stone-800 border-2 border-black shadow-[6px_6px_0_#0a0a0a] animate-in slide-in-from-top-2 duration-200"
            style={sortMenuStyle}
          >
            <div className="border-b border-stone-700">
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-stone-300">
                View Mode
              </div>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={missedViewMode === "list"}
                onClick={() => {
                  handleSetMissedViewMode("list");
                  setIsSortMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-xs font-black uppercase tracking-wide transition-all duration-150 border-b border-stone-700 ${
                  missedViewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white"
                }`}
              >
                <span>List View</span>
                {missedViewMode === "list" && <Check className="h-4 w-4" />}
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={missedViewMode === "date"}
                onClick={() => {
                  handleSetMissedViewMode("date");
                  setIsSortMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-xs font-black uppercase tracking-wide transition-all duration-150 border-b border-stone-700 ${
                  missedViewMode === "date"
                    ? "bg-blue-600 text-white"
                    : "bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white"
                }`}
              >
                <span>Group by Date</span>
                {missedViewMode === "date" && <Check className="h-4 w-4" />}
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={missedViewMode === "class"}
                onClick={() => {
                  handleSetMissedViewMode("class");
                  setIsSortMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-xs font-black uppercase tracking-wide transition-all duration-150 ${
                  missedViewMode === "class"
                    ? "bg-blue-600 text-white"
                    : "bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white"
                }`}
              >
                <span>Group by Class</span>
                {missedViewMode === "class" && <Check className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={missedSortDirection === "desc"}
              onClick={() => {
                setMissedSortDirection("desc");
                setIsSortMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-xs font-black uppercase tracking-wide transition-all duration-150 border-b border-stone-700 ${
                missedSortDirection === "desc"
                  ? "bg-blue-600 text-white"
                  : "bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white"
              }`}
            >
              <span>Newest First</span>
              {missedSortDirection === "desc" && <Check className="h-4 w-4" />}
            </button>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={missedSortDirection === "asc"}
              onClick={() => {
                setMissedSortDirection("asc");
                setIsSortMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-xs font-black uppercase tracking-wide transition-all duration-150 ${
                missedSortDirection === "asc"
                  ? "bg-blue-600 text-white"
                  : "bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white"
              }`}
            >
              <span>Oldest First</span>
              {missedSortDirection === "asc" && <Check className="h-4 w-4" />}
            </button>
          </div>,
          document.body,
        )}

      {dateActionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md border-3 border-black bg-white shadow-[8px_8px_0_#0a0a0a] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="bg-yellow-400 border-b-3 border-black px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black uppercase text-stone-900 leading-tight tracking-tight truncate">
                    {dateActionDialog.action === "present"
                      ? "Mark All Present"
                      : "Mark All Absent"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDateActionDialog(null)}
                  className="h-9 w-9 border-2 border-black bg-white flex items-center justify-center font-black text-xl shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a]"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="bg-white px-6 py-6">
              <div className="mb-6 pb-5 border-b-2 border-stone-200">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">
                  {formatDateHeader(dateActionDialog.dateKey)}
                </p>
                <p className="text-sm font-bold text-stone-700">
                  This will update{" "}
                  <span className="font-black text-stone-900">
                    {dateActionPreview.count}
                  </span>{" "}
                  {dateActionPreview.count === 1 ? "class" : "classes"} for the
                  selected date.
                </p>
                {dateActionPreview.count > 0 && (
                  <div className="mt-3 text-xs font-bold uppercase tracking-wide text-stone-500">
                    Preview:{" "}
                    <span className="text-stone-900">
                      {dateActionPreview.items
                        .map((item) => item.courseName)
                        .join(" • ")}
                    </span>
                    {dateActionPreview.remaining > 0 && (
                      <span className="text-stone-500">
                        {" "}
                        +{dateActionPreview.remaining} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleConfirmDateAction}
                  disabled={dateActionPending}
                  aria-busy={dateActionPending}
                  className={`w-full flex items-center justify-center gap-2 h-12 border-2 border-black px-4 text-sm font-black uppercase tracking-wide text-white shadow-[4px_4px_0_#0a0a0a] transition-all duration-300 ${
                    dateActionPending
                      ? "bg-stone-700 animate-pulse scale-[0.99]"
                      : dateActionDialog.action === "present"
                        ? "bg-stone-900 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
                        : "bg-red-500 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {dateActionPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : dateActionDialog.action === "present" ? (
                    <>
                      <Check className="h-4 w-4" />
                      Confirm Present
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      Confirm Absent
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDateActionDialog(null)}
                  className="w-full flex items-center justify-center gap-2 h-11 border-2 border-black bg-white px-4 text-sm font-black uppercase tracking-wide text-stone-900 shadow-[4px_4px_0_#0a0a0a] transition-all duration-300 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {missedGroupDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md border-3 border-black bg-white shadow-[8px_8px_0_#0a0a0a] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="bg-yellow-400 border-b-3 border-black px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black uppercase text-stone-900 leading-tight tracking-tight truncate">
                    Check In Group
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMissedGroupDialog(null)}
                  className="h-9 w-9 border-2 border-black bg-white flex items-center justify-center font-black text-xl shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a]"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="bg-white px-6 py-6">
              <div className="mb-6 pb-5 border-b-2 border-stone-200">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">
                  {missedGroupDialog.mode === "date" ? "Date" : "Class"}
                </p>
                <p className="text-sm font-bold text-stone-700 mb-2">
                  {missedGroupLabel}
                </p>
                <p className="text-sm font-bold text-stone-700">
                  This will check in{" "}
                  <span className="font-black text-stone-900">
                    {missedGroupPreview.count}
                  </span>{" "}
                  {missedGroupPreview.count === 1 ? "class" : "classes"} for
                  this group.
                </p>
                {missedGroupPreview.count > 0 && (
                  <div className="mt-3 text-xs font-bold uppercase tracking-wide text-stone-500">
                    Preview:{" "}
                    <span className="text-stone-900">
                      {missedGroupPreview.items
                        .map((item) => item.courseName)
                        .join(" • ")}
                    </span>
                    {missedGroupPreview.remaining > 0 && (
                      <span className="text-stone-500">
                        {" "}
                        +{missedGroupPreview.remaining} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleConfirmMissedGroupCheckIn}
                  disabled={missedGroupPending}
                  aria-busy={missedGroupPending}
                  className={`w-full flex items-center justify-center gap-2 h-12 border-2 border-black px-4 text-sm font-black uppercase tracking-wide text-white shadow-[4px_4px_0_#0a0a0a] transition-all duration-300 ${
                    missedGroupPending
                      ? "bg-stone-700 animate-pulse scale-[0.99]"
                      : "bg-stone-900 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {missedGroupPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirm Check In
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMissedGroupDialog(null)}
                  className="w-full flex items-center justify-center gap-2 h-11 border-2 border-black bg-white px-4 text-sm font-black uppercase tracking-wide text-stone-900 shadow-[4px_4px_0_#0a0a0a] transition-all duration-300 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
