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
  Check,
  RefreshCw,
  X,
  Filter,
  ChevronDown,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import { useAuth } from "@/context/AuthContext";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { useAttendanceActions } from "@/hooks/useAttendanceActions";
import {
  bulkCheckInRpc,
  getUserCourseRecords,
  markClassAbsentRpc,
} from "@/lib/attendance/attendance-service";
import { ClassesService } from "@/lib/services/classes-service";
import { getISTDateString, parseTimestampAsIST } from "@/lib/time/ist";
import type {
  AttendanceStatus,
  FilterPeriod,
  PastClass,
} from "@/types/types-defination";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TabType = "all" | "missed";

type DateRangeOption = {
  value: FilterPeriod;
  label: string;
  displayLabel: string;
};

type ClassesByDate = Record<string, PastClass[]>;

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classesByDate, setClassesByDate] = useState<ClassesByDate>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dialogClassId, setDialogClassId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] =
    useState<CSSProperties | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(
    new Set(),
  );
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(
    new Set(),
  );
  const [fadeOutState, setFadeOutState] = useState<Record<string, "hold" | "fade">>(
    {},
  );
  const [openDateMenu, setOpenDateMenu] = useState<string | null>(null);
  const [dateActionDialog, setDateActionDialog] = useState<{
    dateKey: string;
    action: "present" | "absent";
  } | null>(null);
  const [dateActionPending, setDateActionPending] = useState(false);
  const dateMenuRef = useRef<HTMLDivElement | null>(null);
  const dateMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [dateMenuStyle, setDateMenuStyle] =
    useState<CSSProperties | null>(null);

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

  const fetchPastClasses = useCallback(
    async (options?: {
      reason?: "init" | "filter" | "refresh";
      filterOverride?: FilterPeriod;
    }) => {
      if (!userId) {
        setClassesByDate({});
        setLoading(false);
        setError(null);
        return;
      }

      if (options?.reason === "refresh") {
        setIsRefreshing(true);
      }

      try {
        setLoading(true);
        setError(null);

        const filterToUse = options?.filterOverride ?? activeFilter;
        const data = await ClassesService.getUserPastClasses(
          userId,
          filterToUse,
        );
        const grouped = buildClassesByDate(data);
        setClassesByDate(grouped);
      } catch (err) {
        console.error("Failed to load past classes:", err);
        setError("Unable to load past classes. Please try again.");
        toast.error("Unable to load past classes. Please try again.");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeFilter, userId],
  );

  const { checkIn, markAbsent, pendingByClassId } = useAttendanceActions({
    userId,
    onAfterSuccess: async () => {
      await fetchPastClasses({ reason: "refresh" });
    },
  });

  useEffect(() => {
    if (authLoading) return;
    void fetchPastClasses({ reason: "filter" });
  }, [authLoading, fetchPastClasses]);

  const sortedGroupKeys = useMemo(
    () => Object.keys(classesByDate).sort((a, b) => (a < b ? 1 : -1)),
    [classesByDate],
  );

  const allClasses = useMemo(
    () =>
      sortedGroupKeys.flatMap((dateKey) => classesByDate[dateKey] ?? []),
    [sortedGroupKeys, classesByDate],
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

  const isEligibleForBulk = useCallback((item: PastClass) => {
    return item.attendanceStatus === "ABSENT";
  }, []);

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

  const activeDialogClass = useMemo(
    () => allClasses.find((item) => item.classID === dialogClassId) ?? null,
    [allClasses, dialogClassId],
  );

  const updateClassAttendance = useCallback(
    (classIds: Set<string>, status: AttendanceStatus) => {
      setClassesByDate((prev) => {
        const next: ClassesByDate = {};
        Object.entries(prev).forEach(([dateKey, items]) => {
          next[dateKey] = items.map((item) =>
            classIds.has(item.classID)
              ? { ...item, attendanceStatus: status }
              : item,
          );
        });
        return next;
      });
    },
    [],
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
  }, [activeDialogClass, markAbsent, markRecentlyUpdated, updateClassAttendance]);

  const handleConfirmDateAction = async () => {
    if (!dateActionDialog || !userId) return;

    const { dateKey, action } = dateActionDialog;
    const dayClasses = classesByDate[dateKey] ?? [];
    const targets = dayClasses.filter((item) =>
      action === "present"
        ? item.attendanceStatus === "ABSENT"
        : item.attendanceStatus === "PRESENT",
    );

    if (targets.length === 0) {
      toast.error("No classes to update for this date.");
      setDateActionDialog(null);
      return;
    }

    setDateActionPending(true);

    try {
      const courseRecord = await getUserCourseRecords(userId);
      const enrolledCourses = courseRecord?.enrolledCourses || [];

      if (enrolledCourses.length === 0) {
        toast.error("No enrolled courses found for attendance");
        setDateActionPending(false);
        return;
      }

      if (action === "present") {
        const classIds = targets.map((item) => item.classID);
        const response = await bulkCheckInRpc({
          p_user_id: userId,
          p_class_ids: classIds,
          p_enrolled_courses: enrolledCourses,
        });

        const status = String(response.status ?? "").toLowerCase();
        if (status !== "success") {
          toast.error(String(response.message ?? "Bulk check-in failed"));
          return;
        }

        const successIds = new Set<string>();
        const successfulResults = response
          .successful_results as Array<{ class_id?: string }> | undefined;
        const alreadyRecorded = response
          .already_recorded_results as Array<{ class_id?: string }> | undefined;

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

        toast.success(
          String(
            response.message ??
              `Marked ${successIds.size} classes present.`,
          ),
        );
      } else {
        const results = await Promise.all(
          targets.map(async (item) => {
            try {
              const response = await markClassAbsentRpc({
                p_user_id: userId,
                p_class_id: item.classID,
                p_enrolled_courses: enrolledCourses,
              });
              return {
                classID: item.classID,
                ok: response.status === "success",
                message: response.message,
              };
            } catch (error) {
              console.error(
                "Date action failed for class:",
                item.classID,
                error,
              );
              const message =
                error instanceof Error ? error.message : "Unknown error";
              return { classID: item.classID, ok: false, message };
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
          toast.success(
            `Marked ${succeeded.length} classes absent.`,
          );
        }
      }

      await fetchPastClasses({ reason: "refresh" });
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
    void fetchPastClasses({ reason: "refresh" });
  };

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
      const courseRecord = await getUserCourseRecords(userId);
      const enrolledCourses = courseRecord?.enrolledCourses || [];

      if (enrolledCourses.length === 0) {
        toast.error("No enrolled courses found for attendance");
        return;
      }

      const classIds = targets.map((item) => item.classID);
      const response = await bulkCheckInRpc({
        p_user_id: userId,
        p_class_ids: classIds,
        p_enrolled_courses: enrolledCourses,
      });

      const status = String(response.status ?? "").toLowerCase();
      if (status !== "success") {
        toast.error(String(response.message ?? "Bulk check-in failed"));
        return;
      }

      const successIds = new Set<string>();
      const successfulResults = response
        .successful_results as Array<{ class_id?: string }> | undefined;
      const alreadyRecorded = response
        .already_recorded_results as Array<{ class_id?: string }> | undefined;

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

      toast.success(
        String(
          response.message ??
            `Checked in ${successIds.size} ${successIds.size === 1 ? "class" : "classes"}.`,
        ),
      );

      setSelectedClasses(new Set());
      setIsMultiSelectMode(false);
      await fetchPastClasses({ reason: "refresh" });
    } catch (error) {
      console.error("Bulk check-in failed:", error);
      toast.error("Bulk check-in failed. Please try again.");
    } finally {
      setIsBulkPending(false);
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inButton =
        dropdownRef.current && dropdownRef.current.contains(target);
      const inMenu =
        dropdownMenuRef.current && dropdownMenuRef.current.contains(target);

      if (!inButton && !inMenu) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (!isDropdownOpen) return;

    const updatePosition = () => {
      const button = dropdownButtonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      setDropdownStyle({
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
  }, [isDropdownOpen]);

  const showEmptyState =
    activeTab === "missed" ? missedClasses.length === 0 : allClasses.length === 0;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 transition-colors duration-300 relative isolate">
      <DotPatternBackground />

      <div className="mx-auto max-w-3xl relative z-10">
        <header className="bg-white border-b-4 border-black px-4 py-3 sm:px-6 shadow-[0_6px_0_#0a0a0a]">
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleBackNavigation}
                className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-xs sm:text-sm font-bold uppercase shadow-[4px_4px_0_#000] transition-all duration-200 hover:translate-y-1 active:translate-y-2 active:translate-x-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
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
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-stone-900 tracking-tight">
              Classes
            </h1>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`group relative flex-1 px-5 py-3 font-black text-sm uppercase tracking-wide border-2 border-black transition-all duration-300 overflow-hidden ${
                activeTab === "all"
                  ? "bg-stone-900 text-white shadow-[5px_5px_0_#0a0a0a] -translate-y-0.5"
                  : "bg-white text-stone-600 shadow-[4px_4px_0_#0a0a0a] hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 hover:text-stone-900 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
              }`}
            >
              <span className="relative z-10 transition-transform duration-300 group-hover:scale-105">
                All Classes
              </span>
              {activeTab !== "all" && (
                <span className="absolute inset-0 bg-yellow-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-0" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("missed")}
              className={`group relative flex-1 px-5 py-3 font-black text-sm uppercase tracking-wide border-2 border-black transition-all duration-300 overflow-hidden ${
                activeTab === "missed"
                  ? "bg-stone-900 text-white shadow-[5px_5px_0_#0a0a0a] -translate-y-0.5"
                  : "bg-white text-stone-600 shadow-[4px_4px_0_#0a0a0a] hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 hover:text-stone-900 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
              }`}
            >
              <span className="relative z-10 transition-transform duration-300 group-hover:scale-105">
                Missed
              </span>
              {activeTab !== "missed" && (
                <span className="absolute inset-0 bg-red-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left -z-0" />
              )}
            </button>
          </div>
        </header>

        <section className="bg-white border-b-4 border-black px-4 py-3 sm:px-6 sticky top-0 z-10 shadow-[0_6px_0_#0a0a0a] backdrop-blur-sm bg-white/95">
          <div className="flex items-center gap-2.5 overflow-x-auto overflow-y-visible scrollbar-hide">
            <div ref={dropdownRef} className="relative">
              <button
                ref={dropdownButtonRef}
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 h-11 px-3.5 py-2.5 bg-stone-900 text-white border-2 border-black text-xs font-black uppercase whitespace-nowrap shadow-[4px_4px_0_#0a0a0a] transition-all duration-200 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-1 active:translate-y-1 active:shadow-[2px_2px_0_#0a0a0a]"
              >
                <Filter className="h-4 w-4" />
                <span>
                  {DATE_RANGES.find((r) => r.value === activeFilter)
                    ?.displayLabel}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isMounted &&
                isDropdownOpen &&
                dropdownStyle &&
                createPortal(
                  <div
                    ref={dropdownMenuRef}
                    className="bg-stone-800 border-2 border-black shadow-[6px_6px_0_#0a0a0a] animate-in slide-in-from-top-2 duration-200"
                    style={dropdownStyle}
                  >
                    {DATE_RANGES.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setActiveFilter(option.value);
                          setIsDropdownOpen(false);
                          void fetchPastClasses({
                            reason: "filter",
                            filterOverride: option.value,
                          });
                        }}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-xs font-black uppercase tracking-wide transition-all duration-150 border-b border-stone-700 last:border-b-0 ${
                          activeFilter === option.value
                            ? "bg-blue-600 text-white"
                            : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                        }`}
                      >
                        <span>{option.displayLabel}</span>
                        {activeFilter === option.value && (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>,
                  document.body,
                )}
            </div>

            {activeTab === "missed" && missedClasses.length > 0 && (
              <button
                type="button"
                onClick={handleToggleMultiSelect}
                className={`flex items-center gap-2 h-11 px-3.5 py-2.5 border-2 border-black text-xs font-black uppercase whitespace-nowrap transition-all duration-300 ${
                  isMultiSelectMode
                    ? "bg-yellow-400 text-stone-900 shadow-[4px_4px_0_#0a0a0a] -translate-y-0.5"
                    : "bg-white text-stone-900 shadow-[4px_4px_0_#0a0a0a] hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]"
                }`}
              >
                {isMultiSelectMode ? (
                  <>
                    <X className="h-4 w-4" />
                    <span>Exit Multi-Select</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Multi-Select</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh classes"
              className={`group ml-auto flex items-center justify-center h-11 w-11 border-2 border-black text-xs font-black uppercase whitespace-nowrap transition-all duration-300 ${
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
                        className="px-3 py-1.5 bg-stone-900 text-white border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Check className="h-3 w-3 inline mr-1" />
                        {isBulkPending
                          ? "Checking In..."
                          : `Check In (${selectedClasses.size})`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                {missedClasses.map((item, index) => {
                  const isSelected = selectedClasses.has(item.classID);
                  const isMissed = item.attendanceStatus === "ABSENT";
                  const fadePhase = fadeOutState[item.classID];
                  const isFadingOut = !!fadePhase;
                  const dateKey = getISTDateString(
                    parseTimestampAsIST(item.classStartTime),
                  );
                  const timeRange = `${formatTime(
                    item.classStartTime,
                  )} – ${formatTime(item.classEndTime)}`;
                  const canSelect = eligibleMissedIds.has(item.classID);
                  const isPending =
                    pendingByClassId?.has(item.classID) ?? false;
                  const isRecentlyUpdated = recentlyUpdated.has(item.classID);
                  const cardKey = `${item.classID}-${item.classStartTime}`;

                  return (
                    <div
                      key={cardKey}
                      className={`group relative px-4 py-4 border-2 border-black transition-all duration-300 ease-out transform ${
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
                        animationDelay: `${index * 20}ms`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {isMultiSelectMode && (
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
                          onClick={() =>
                            !isMultiSelectMode && setDialogClassId(item.classID)
                          }
                          disabled={isMultiSelectMode}
                          className="flex-1 text-left min-w-0 disabled:cursor-default"
                        >
                          <div className="space-y-2">
                            <h3 className="font-black text-base sm:text-lg uppercase tracking-wide truncate text-stone-900 transition-all duration-300 group-hover:tracking-wider leading-tight">
                              {item.courseName}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 text-sm font-bold text-stone-800">
                              <span className="font-mono text-sm">
                                {timeRange}
                              </span>
                              <span className="hidden sm:inline text-xs">•</span>
                              <span className="text-xs opacity-90">
                                {formatDateLabel(dateKey)}
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedGroupKeys.map((dateKey, dateIndex) => {
                return (
                  <div key={dateKey} className="space-y-2">
                  <div
                    className="border-2 border-black bg-yellow-400 px-4 py-2.5 shadow-[4px_4px_0_#0a0a0a] transition-all duration-200 hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[2px_2px_0_#0a0a0a] flex items-center justify-between gap-3"
                    style={{
                      animationDelay: `${dateIndex * 50}ms`,
                    }}
                  >
                    <h2 className="text-xs font-black uppercase tracking-wider text-stone-900">
                      {formatDateHeader(dateKey)}
                    </h2>
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
                        className="h-8 w-8 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0_#0a0a0a] transition-all duration-200 hover:shadow-[3px_3px_0_#0a0a0a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#0a0a0a]"
                        aria-label="Date actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {classesByDate[dateKey]?.map((item, itemIndex) => {
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
                          className={`group w-full text-left px-5 py-4 border-2 border-black transition-all duration-300 ease-out transform hover:scale-[1.02] ${
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
                  {(() => {
                    const dayClasses =
                      classesByDate[dateActionDialog.dateKey] ?? [];
                    const count =
                      dateActionDialog.action === "present"
                        ? dayClasses.filter(
                            (item) => item.attendanceStatus === "ABSENT",
                          ).length
                        : dayClasses.filter(
                            (item) => item.attendanceStatus === "PRESENT",
                          ).length;
                    return (
                      <>
                        <span className="font-black text-stone-900">
                          {count}
                        </span>{" "}
                        {count === 1 ? "class" : "classes"}
                      </>
                    );
                  })()}{" "}
                  for the selected date.
                </p>
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
    </div>
  );
}
