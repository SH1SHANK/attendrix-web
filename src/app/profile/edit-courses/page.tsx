"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Search,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUserCourseRecords } from "@/hooks/useUserCourseRecords";
import {
  useUserOnboardingProfile,
  useBatchOnboardingData,
} from "@/hooks/useOnboardingData";
import { fetchJson } from "@/lib/api/fetch-json";
import {
  getCourseCategory,
  isLabCourse,
  parseCourseType,
} from "@/lib/onboarding/course-utils";
import { getCourseSlot } from "@/lib/courses/slot";
import { getCourseAttendanceSummaryRpc } from "@/lib/attendance/attendance-service";
import { enqueueFirestoreAttendanceUpdate } from "@/lib/attendance/firestore-write-buffer";
import { cn } from "@/lib/utils";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { CourseSlotBadge } from "@/components/ui/CourseSlotBadge";
import type { CourseRecord } from "@/types/supabase-academic";
import type { FirebaseCourseEnrollment } from "@/types/types-defination";

const SESSION_KEY = "attendrix.edits";

type UpdateCoursesResponse = {
  addedCourseIds: string[];
  removedCourseIds: string[];
  enrolledCourseIds: string[];
};

type SlotKind = "core" | "lab" | "elective";

type CourseSelection = {
  courseID: string;
  courseName: string;
  credits: number;
  courseType: {
    isLab: boolean;
    courseType: "core" | "elective" | "audit" | string;
    electiveCategory: string;
  };
  attendedClasses?: number;
  totalClasses?: number;
};

type SlotEntry = {
  key: string;
  kind: SlotKind;
  required: boolean;
  category?: string;
  originalCourseId?: string;
  courseId?: string | null;
  slot: string;
  course?: CourseSelection;
};

type SlotPickerState = {
  key: string;
  kind: SlotKind;
  required: boolean;
  category?: string;
  originalCourseId?: string;
};

const SLOT_LABELS: Record<SlotKind, string> = {
  core: "Select Core Course",
  lab: "Select Lab Course",
  elective: "Optional Elective",
};

const normalizeFirebaseCourse = (course: FirebaseCourseEnrollment): CourseSelection => {
  return {
    courseID: course.courseID,
    courseName: course.courseName,
    credits: course.credits ?? 0,
    courseType: {
      isLab: Boolean(course.courseType?.isLab),
      courseType: course.courseType?.courseType ?? "core",
      electiveCategory: course.courseType?.electiveCategory ?? "",
    },
    attendedClasses: course.attendedClasses ?? 0,
    totalClasses: course.totalClasses ?? 0,
  };
};

const normalizeCatalogCourse = (course: CourseRecord): CourseSelection => {
  const parsed = parseCourseType(course.courseType);
  const electiveCategory =
    parsed.electiveCategory || getCourseCategory(course) || "";
  const type = parsed.courseType || (course.isElective ? "elective" : "core");
  return {
    courseID: course.courseID,
    courseName: course.courseName,
    credits: course.credits ?? 0,
    courseType: {
      isLab: Boolean(parsed.isLab) || isLabCourse(course),
      courseType: type,
      electiveCategory,
    },
  };
};

const buildSearchKey = (course: CourseRecord) => {
  return `${course.courseName} ${course.courseID}`.toLowerCase();
};

const getTypeLabel = (course: CourseSelection) => {
  if (course.courseType.isLab) return "Lab";
  if (course.courseType.courseType === "elective") return "Elective";
  return "Core";
};

const hasAttendance = (course: CourseSelection) => {
  const attended = Number(course.attendedClasses ?? 0);
  const total = Number(course.totalClasses ?? 0);
  return attended > 0 || total > 0;
};

export default function EditCoursesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid ?? null;

  const courseRecordQuery = useUserCourseRecords(userId);
  const courseRecord = courseRecordQuery.data;
  const batchId = courseRecord?.batchID ?? null;

  const firebaseProfileQuery = useUserOnboardingProfile(userId);
  const firebaseCourses = firebaseProfileQuery.data?.coursesEnrolled ?? [];

  const [removedCourseIds, setRemovedCourseIds] = useState<Set<string>>(
    new Set(),
  );
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  const [activeSlot, setActiveSlot] = useState<SlotPickerState | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const deferredPickerSearch = useDeferredValue(pickerSearch);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const shouldFetchCatalog = Boolean(activeSlot);
  const batchQuery = useBatchOnboardingData(batchId, {
    enabled: shouldFetchCatalog,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/signin");
    }
  }, [authLoading, router, user]);

  const initialCourses = useMemo(() => {
    if (firebaseCourses.length > 0) return firebaseCourses;
    const fallbackIds = Array.isArray(courseRecord?.enrolledCourses)
      ? courseRecord?.enrolledCourses
      : [];
    return fallbackIds.map((courseID) => ({
      courseID,
      courseName: courseID,
      credits: 0,
      courseType: {
        isLab: false,
        courseType: "core",
        electiveCategory: "",
      },
      attendedClasses: 0,
      totalClasses: 0,
      isEditable: false,
    }));
  }, [courseRecord?.enrolledCourses, firebaseCourses]);

  const normalizedInitial = useMemo(
    () => initialCourses.map(normalizeFirebaseCourse),
    [initialCourses],
  );

  const initialIds = useMemo(
    () => normalizedInitial.map((course) => course.courseID),
    [normalizedInitial],
  );

  const initialIdSet = useMemo(() => new Set(initialIds), [initialIds]);

  const initialMap = useMemo(
    () => new Map(normalizedInitial.map((course) => [course.courseID, course])),
    [normalizedInitial],
  );

  const catalogCourses = useMemo(() => {
    if (!batchQuery.data) return [];
    return [
      ...(batchQuery.data.coreCourses ?? []),
      ...(batchQuery.data.electiveCourses ?? []),
    ];
  }, [batchQuery.data]);

  const catalogMap = useMemo(() => {
    if (catalogCourses.length === 0) return new Map<string, CourseSelection>();
    return new Map(
      catalogCourses.map((course) => [
        course.courseID,
        normalizeCatalogCourse(course),
      ]),
    );
  }, [catalogCourses]);

  const selectionMap = useMemo(() => {
    const map = new Map<string, CourseSelection>();
    initialMap.forEach((value, key) => map.set(key, value));
    catalogMap.forEach((value, key) => map.set(key, value));
    return map;
  }, [catalogMap, initialMap]);

  const resolveSlotCourseId = useCallback(
    (slotKey: string, originalCourseId?: string) => {
      const replacement = replacements[slotKey];
      if (replacement) return replacement;
      if (originalCourseId && removedCourseIds.has(originalCourseId)) {
        return null;
      }
      return originalCourseId ?? null;
    },
    [removedCourseIds, replacements],
  );

  const draftCourseIds = useMemo(() => {
    const ids = new Set(initialIds);
    removedCourseIds.forEach((id) => ids.delete(id));
    Object.values(replacements).forEach((courseId) => {
      if (courseId) ids.add(courseId);
    });
    return Array.from(ids);
  }, [initialIds, removedCourseIds, replacements]);

  const selectedCourseIdSet = useMemo(
    () => new Set(draftCourseIds),
    [draftCourseIds],
  );

  const coreSlots = useMemo(() => {
    return normalizedInitial
      .filter(
        (course) =>
          !course.courseType.isLab &&
          course.courseType.courseType !== "elective",
      )
      .map((course) => {
        const courseId = resolveSlotCourseId(course.courseID, course.courseID);
        return {
          key: course.courseID,
          kind: "core",
          required: true,
          originalCourseId: course.courseID,
          courseId,
          course: courseId ? selectionMap.get(courseId) : undefined,
          slot: getCourseSlot(courseId ?? course.courseID),
        } satisfies SlotEntry;
      });
  }, [normalizedInitial, resolveSlotCourseId, selectionMap]);

  const labSlots = useMemo(() => {
    return normalizedInitial
      .filter((course) => course.courseType.isLab)
      .map((course) => {
        const courseId = resolveSlotCourseId(course.courseID, course.courseID);
        return {
          key: course.courseID,
          kind: "lab",
          required: true,
          originalCourseId: course.courseID,
          courseId,
          course: courseId ? selectionMap.get(courseId) : undefined,
          slot: getCourseSlot(courseId ?? course.courseID),
        } satisfies SlotEntry;
      });
  }, [normalizedInitial, resolveSlotCourseId, selectionMap]);

  const electiveCategories = useMemo(() => {
    const raw = batchQuery.data?.batch.electiveCatalog ?? [];
    return raw.filter((category) => !category.toUpperCase().startsWith("LAB"));
  }, [batchQuery.data?.batch.electiveCatalog]);

  const electiveCategorySet = useMemo(() => {
    return new Set(electiveCategories.map((category) => category.toUpperCase()));
  }, [electiveCategories]);

  const electiveLimit = electiveCategories.length || 0;

  const electiveSlots = useMemo(() => {
    const electives = normalizedInitial.filter(
      (course) =>
        course.courseType.courseType === "elective" && !course.courseType.isLab,
    );

    if (electiveCategories.length === 0) {
      const slots = electives.map((course) => {
        const courseId = resolveSlotCourseId(course.courseID, course.courseID);
        return {
          key: `elective:${course.courseID}`,
          kind: "elective",
          required: false,
          originalCourseId: course.courseID,
          category: course.courseType.electiveCategory,
          courseId,
          course: courseId ? selectionMap.get(courseId) : undefined,
          slot: getCourseSlot(courseId ?? course.courseID),
        } satisfies SlotEntry;
      });

      if (slots.length === 0) {
        const courseId = resolveSlotCourseId("elective:open");
        slots.push({
          key: "elective:open",
          kind: "elective",
          required: false,
          courseId,
          course: courseId ? selectionMap.get(courseId) : undefined,
          slot: getCourseSlot(courseId ?? ""),
        });
      }

      return slots;
    }

    const assigned = new Map<string, CourseSelection>();
    const extras: CourseSelection[] = [];

    electives.forEach((course) => {
      const category = course.courseType.electiveCategory?.toUpperCase() ?? "";
      if (category && electiveCategorySet.has(category) && !assigned.has(category)) {
        assigned.set(category, course);
      } else {
        extras.push(course);
      }
    });

    const slots = electiveCategories.map((category) => {
      const normalized = category.toUpperCase();
      const assignedCourse = assigned.get(normalized);
      const originalCourseId = assignedCourse?.courseID;
      const slotKey = `elective:${normalized}`;
      const courseId = resolveSlotCourseId(slotKey, originalCourseId);
      return {
        key: slotKey,
        kind: "elective",
        required: false,
        category: normalized,
        originalCourseId,
        courseId,
        course: courseId ? selectionMap.get(courseId) : undefined,
        slot: getCourseSlot(courseId ?? originalCourseId ?? ""),
      } satisfies SlotEntry;
    });

    extras.forEach((course) => {
      const courseId = resolveSlotCourseId(course.courseID, course.courseID);
      slots.push({
        key: `elective-extra:${course.courseID}`,
        kind: "elective",
        required: false,
        originalCourseId: course.courseID,
        category: course.courseType.electiveCategory,
        courseId,
        course: courseId ? selectionMap.get(courseId) : undefined,
        slot: getCourseSlot(courseId ?? course.courseID),
      });
    });

    return slots;
  }, [
    electiveCategories,
    electiveCategorySet,
    normalizedInitial,
    resolveSlotCourseId,
    selectionMap,
  ]);

  const electiveSelectedCount = useMemo(() => {
    return draftCourseIds.reduce((count, courseId) => {
      const course = selectionMap.get(courseId);
      if (!course) return count;
      if (course.courseType.isLab) return count;
      return course.courseType.courseType === "elective" ? count + 1 : count;
    }, 0);
  }, [draftCourseIds, selectionMap]);

  const requiredSlotsFilled = useMemo(() => {
    return [...coreSlots, ...labSlots].every((slot) => Boolean(slot.courseId));
  }, [coreSlots, labSlots]);

  const canSave = requiredSlotsFilled;

  const summary = useMemo(() => {
    const currentIdSet = new Set(draftCourseIds);
    const added = draftCourseIds.filter((id) => !initialIdSet.has(id));
    const removed = initialIds.filter((id) => !currentIdSet.has(id));

    const slotChanges = [...coreSlots, ...labSlots, ...electiveSlots]
      .filter(
        (slot) =>
          slot.originalCourseId &&
          slot.courseId &&
          slot.courseId !== slot.originalCourseId,
      )
      .map((slot) => {
        const from = getCourseSlot(slot.originalCourseId);
        const to = getCourseSlot(slot.courseId);
        return {
          key: slot.key,
          from,
          to,
          name:
            selectionMap.get(slot.courseId)?.courseName ??
            slot.courseId ??
            "Course",
        };
      })
      .filter((entry) => entry.from && entry.to && entry.from !== entry.to);

    return {
      added,
      removed,
      slotChanges,
    };
  }, [
    coreSlots,
    draftCourseIds,
    electiveSlots,
    initialIdSet,
    initialIds,
    labSlots,
    selectionMap,
  ]);

  const mutation = useMutation({
    mutationFn: async (courseIds: string[]) =>
      fetchJson<UpdateCoursesResponse>("/api/user/update-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseIds }),
      }),
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
      }
      queryClient.invalidateQueries({ queryKey: ["user-course-records", userId] });
      queryClient.invalidateQueries({ queryKey: ["attendance-summary", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-schedule", userId] });
      queryClient.invalidateQueries({ queryKey: ["past-classes", userId] });

      if (userId) {
        void (async () => {
          try {
            const latestSummary = await getCourseAttendanceSummaryRpc(userId);
            if (latestSummary.length > 0) {
              enqueueFirestoreAttendanceUpdate(
                { uid: userId, summary: latestSummary, amplixDelta: 0 },
                { urgent: true },
              );
            }
          } catch (error) {
            console.error("Failed to refresh attendance totals", error);
          }
        })();
      }

      router.push("/courses/review-missed");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Update failed";
      toast.error(message);
    },
  });

  const openSlotPicker = useCallback((slot: SlotEntry) => {
    setActiveSlot({
      key: slot.key,
      kind: slot.kind,
      required: slot.required,
      category: slot.category,
      originalCourseId: slot.originalCourseId,
    });
    setPickerSearch("");
  }, []);

  const handleRemoveCourse = useCallback(
    (slot: SlotEntry) => {
      if (!slot.courseId) return;
      const course = slot.course ?? selectionMap.get(slot.courseId);
      if (course && hasAttendance(course)) {
        toast.message(
          "This course has attendance records. You can undo before saving.",
        );
      }

      if (slot.originalCourseId) {
        setRemovedCourseIds((prev) => {
          const next = new Set(prev);
          next.add(slot.originalCourseId as string);
          return next;
        });
      }

      setReplacements((prev) => {
        const next = { ...prev };
        if (next[slot.key]) {
          delete next[slot.key];
        }
        return next;
      });
    },
    [selectionMap],
  );

  const handleUndoSlot = useCallback((slot: SlotEntry) => {
    if (slot.originalCourseId) {
      setRemovedCourseIds((prev) => {
        const next = new Set(prev);
        next.delete(slot.originalCourseId as string);
        return next;
      });
    }

    setReplacements((prev) => {
      const next = { ...prev };
      if (next[slot.key]) {
        delete next[slot.key];
      }
      return next;
    });
  }, []);

  const handlePickCourse = useCallback(
    (slot: SlotPickerState, courseId: string) => {
      if (slot.originalCourseId && courseId === slot.originalCourseId) {
        handleUndoSlot({
          key: slot.key,
          kind: slot.kind,
          required: slot.required,
          category: slot.category,
          originalCourseId: slot.originalCourseId,
          courseId,
          slot: getCourseSlot(courseId),
        });
        setActiveSlot(null);
        return;
      }

      setReplacements((prev) => ({
        ...prev,
        [slot.key]: courseId,
      }));

      if (slot.originalCourseId) {
        setRemovedCourseIds((prev) => {
          const next = new Set(prev);
          next.add(slot.originalCourseId as string);
          return next;
        });
      }

      setActiveSlot(null);
    },
    [handleUndoSlot],
  );

  const handleSave = useCallback(() => {
    if (!canSave) {
      toast.error("Please select all required core and lab courses.");
      return;
    }
    setSummaryOpen(true);
  }, [canSave]);

  const handleConfirmSave = useCallback(() => {
    if (mutation.isPending) return;
    mutation.mutate(draftCourseIds);
    setSummaryOpen(false);
  }, [draftCourseIds, mutation]);

  const pickerCourses = useMemo(() => {
    if (!activeSlot || !batchQuery.data) return [];
    const { coreCourses = [], electiveCourses = [] } = batchQuery.data;

    const courses =
      activeSlot.kind === "core"
        ? coreCourses
        : activeSlot.kind === "lab"
          ? electiveCourses.filter((course) => isLabCourse(course))
          : electiveCourses.filter((course) => !isLabCourse(course));

    const targetCategory = activeSlot.category?.toUpperCase() ?? "";
    const filteredByCategory = targetCategory
      ? courses.filter((course) => {
          const category = getCourseCategory(course).toUpperCase();
          const scope = Array.isArray(course.electiveScope)
            ? course.electiveScope.map((item) => item.toUpperCase())
            : [];
          return category === targetCategory || scope.includes(targetCategory);
        })
      : courses;

    const search = deferredPickerSearch.trim().toLowerCase();
    const searchFiltered = search
      ? filteredByCategory.filter((course) =>
          buildSearchKey(course).includes(search),
        )
      : filteredByCategory;

    const currentSlotCourseId = resolveSlotCourseId(
      activeSlot.key,
      activeSlot.originalCourseId,
    );

    const occupiedSlots = new Set(
      draftCourseIds
        .filter((id) => id !== currentSlotCourseId)
        .map((id) => getCourseSlot(id))
        .filter(Boolean),
    );

    const electiveLimitReached =
      activeSlot.kind === "elective" &&
      electiveLimit > 0 &&
      electiveSelectedCount >= electiveLimit &&
      !currentSlotCourseId;

    return searchFiltered.map((course) => {
      const slot = getCourseSlot(course.courseID);
      const alreadySelected =
        selectedCourseIdSet.has(course.courseID) &&
        course.courseID !== currentSlotCourseId;
      const slotConflict = slot ? occupiedSlots.has(slot) : false;

      let disabledReason = "";
      if (alreadySelected) {
        disabledReason = "Already selected";
      } else if (electiveLimitReached) {
        disabledReason = "Elective limit reached";
      } else if (slotConflict) {
        disabledReason = `Slot ${slot} already used`;
      }

      return {
        course,
        disabledReason,
      };
    });
  }, [
    activeSlot,
    batchQuery.data,
    deferredPickerSearch,
    draftCourseIds,
    electiveLimit,
    electiveSelectedCount,
    resolveSlotCourseId,
    selectedCourseIdSet,
  ]);

  const isLoading =
    authLoading ||
    courseRecordQuery.isLoading ||
    firebaseProfileQuery.isLoading;

  const isCatalogLoading = batchQuery.isLoading;

  const slotSections: Array<{
    id: SlotKind;
    label: string;
    description: string;
    slots: SlotEntry[];
    optional?: boolean;
  }> = [
    {
      id: "core",
      label: "Core Courses",
      description: "Required courses for your semester.",
      slots: coreSlots,
    },
    {
      id: "lab",
      label: "Lab Courses",
      description: "Required labs tied to your curriculum.",
      slots: labSlots,
    },
    {
      id: "elective",
      label: "Elective Courses",
      description: "Optional add-ons to personalize your term.",
      slots: electiveSlots,
      optional: true,
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#fffdf5] pb-28">
      <DotPatternBackground />

      <div className="relative z-10 mx-auto max-w-3xl px-4 pt-6 pb-24">
        <header className="flex items-start gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            aria-label="Go back"
            className="h-10 w-10 border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-stone-900">
              Edit Enrolled Courses
            </h1>
            <p className="text-sm font-bold text-neutral-600">
              Manage your current courses by slot. Required items must be filled.
            </p>
          </div>
        </header>

        {isLoading ? (
          <div className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
            <p className="text-sm font-bold text-neutral-600">
              Loading your enrolled courses…
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {slotSections.map((section) => (
              <section
                key={section.id}
                className="border-[3px] border-black bg-white px-5 py-5 shadow-[5px_5px_0px_0px_#000]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight">
                      {section.label}
                    </h2>
                    <p className="text-xs font-bold uppercase text-neutral-500">
                      {section.description}
                    </p>
                  </div>
                  {section.id === "elective" ? (
                    <Badge variant="dark" size="default">
                      {electiveSelectedCount} of{" "}
                      {electiveLimit || electiveSelectedCount} selected
                    </Badge>
                  ) : (
                    <Badge variant="main" size="default">
                      Required
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {section.slots.length === 0 ? (
                    <div className="border-2 border-dashed border-black/60 bg-neutral-50 px-4 py-4 text-xs font-bold uppercase text-neutral-500">
                      No courses available.
                    </div>
                  ) : (
                    section.slots.map((slot) => {
                      const course = slot.course;
                      const slotLabel = slot.slot || "Open";
                      const slotCourseId =
                        slot.courseId ?? slot.originalCourseId ?? "";
                      const typeLabel = course ? getTypeLabel(course) : null;
                      const placeholderLabel =
                        slot.kind === "elective"
                          ? "Optional Elective"
                          : SLOT_LABELS[slot.kind];

                      return (
                        <div
                          key={slot.key}
                          className={cn(
                            "border-2 border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000] transition-all duration-150",
                            course
                              ? "hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                              : "bg-neutral-50 border-dashed",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => openSlotPicker(slot)}
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-black uppercase text-stone-900 truncate">
                                  {course ? course.courseName : placeholderLabel}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-bold uppercase text-stone-600">
                                    {course ? course.courseID : "Choose a course"}
                                  </span>
                                  {slotCourseId ? (
                                    <CourseSlotBadge courseId={slotCourseId} />
                                  ) : (
                                    <span className="inline-flex items-center border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_#000]">
                                      Slot {slotLabel}
                                    </span>
                                  )}
                                  {typeLabel && (
                                    <span className="inline-flex items-center border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_#000]">
                                      {typeLabel}
                                    </span>
                                  )}
                                </div>
                                {slot.kind === "elective" && slot.category && (
                                  <p className="mt-1 text-[10px] font-bold uppercase text-neutral-500">
                                    Category: {slot.category}
                                  </p>
                                )}
                                {!course && slot.required && (
                                  <p className="mt-2 text-[10px] font-bold uppercase text-amber-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Required slot missing
                                  </p>
                                )}
                              </div>
                              {course && (
                                <button
                                  type="button"
                                  aria-label="Remove course"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleRemoveCourse(slot);
                                  }}
                                  className="h-9 w-9 border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_#000] transition-colors duration-150 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </button>
                          {!course && slot.originalCourseId && (
                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-[10px] font-bold uppercase text-neutral-500">
                                Slot open — tap to replace.
                              </p>
                              <button
                                type="button"
                                onClick={() => handleUndoSlot(slot)}
                                className="text-[10px] font-black uppercase border-2 border-black bg-white px-2 py-1 shadow-[2px_2px_0px_0px_#000] hover:bg-yellow-50"
                              >
                                Undo
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t-4 border-black bg-[#fffdf5] px-4 py-3 shadow-[0_-6px_0px_0px_#000]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-5 py-3 text-xs font-black uppercase shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || mutation.isPending}
            className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-6 py-3 text-xs font-black uppercase text-white shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] disabled:opacity-60"
          >
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <Drawer open={Boolean(activeSlot)} onOpenChange={(open) => !open && setActiveSlot(null)}>
        <Drawer.Content className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000] w-full max-w-none max-h-[calc(100svh-1rem)] overflow-y-auto overflow-x-hidden pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <Drawer.Header>
            <Drawer.Title className="text-lg font-black uppercase">
              {activeSlot ? SLOT_LABELS[activeSlot.kind] : "Select Course"}
            </Drawer.Title>
            <Drawer.Description className="text-sm font-bold text-neutral-600">
              {activeSlot?.required
                ? "Required slot • choose a compatible course"
                : "Optional slot • choose any available course"}
            </Drawer.Description>
          </Drawer.Header>
          <div className="px-4 pb-4 space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-neutral-600 mb-2 block">
                Search courses
              </label>
              <div className="flex items-center gap-3 border-[3px] border-black bg-white px-3 py-2 shadow-[3px_3px_0px_0px_#000]">
                <Search className="h-4 w-4 text-neutral-600" />
                <input
                  value={pickerSearch}
                  onChange={(event) => setPickerSearch(event.target.value)}
                  placeholder="Search by name or ID"
                  className="flex-1 bg-transparent text-sm font-bold outline-none"
                />
              </div>
            </div>

            {isCatalogLoading ? (
              <div className="border-2 border-black bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-600">
                Loading course options…
              </div>
            ) : pickerCourses.length === 0 ? (
              <div className="border-2 border-black bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-600">
                No matching courses found.
              </div>
            ) : (
              <div className="space-y-3">
                {pickerCourses.map(({ course, disabledReason }) => {
                  const slot = getCourseSlot(course.courseID);
                  const parsed = normalizeCatalogCourse(course);
                  const typeLabel = getTypeLabel(parsed);
                  return (
                    <button
                      key={course.courseID}
                      type="button"
                      onClick={() =>
                        !disabledReason && activeSlot
                          ? handlePickCourse(activeSlot, course.courseID)
                          : null
                      }
                      disabled={Boolean(disabledReason)}
                      className={cn(
                        "w-full border-2 border-black bg-white px-4 py-3 text-left shadow-[3px_3px_0px_0px_#000] transition-all duration-150",
                        disabledReason
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-black uppercase text-stone-900 truncate">
                            {course.courseName}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold uppercase text-stone-600">
                              {course.courseID}
                            </span>
                            {slot && <CourseSlotBadge courseId={course.courseID} />}
                            <span className="text-[10px] font-black uppercase text-stone-600 border-2 border-black bg-white px-2 py-0.5 shadow-[2px_2px_0px_0px_#000]">
                              {typeLabel}
                            </span>
                          </div>
                          {parsed.courseType.electiveCategory && (
                            <p className="mt-1 text-[10px] font-bold uppercase text-neutral-500">
                              Category: {parsed.courseType.electiveCategory}
                            </p>
                          )}
                          {disabledReason && (
                            <p className="mt-2 text-[10px] font-bold uppercase text-rose-600">
                              {disabledReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer>

      <Drawer open={summaryOpen} onOpenChange={setSummaryOpen}>
        <Drawer.Content className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000] w-full max-w-none max-h-[calc(100svh-1rem)] overflow-y-auto overflow-x-hidden pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <Drawer.Header>
            <Drawer.Title className="text-lg font-black uppercase">
              Review Changes
            </Drawer.Title>
            <Drawer.Description className="text-sm font-bold text-neutral-600">
              Confirm your updates before saving.
            </Drawer.Description>
          </Drawer.Header>
          <div className="px-4 pb-4 space-y-4">
            <div className="border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_#000]">
              <p className="text-[10px] font-black uppercase text-stone-500 mb-2">
                Courses added
              </p>
              {summary.added.length === 0 ? (
                <p className="text-xs font-bold text-neutral-500">None</p>
              ) : (
                <div className="space-y-1">
                  {summary.added.map((id) => (
                    <p key={id} className="text-xs font-black uppercase text-stone-800">
                      {selectionMap.get(id)?.courseName ?? id}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_#000]">
              <p className="text-[10px] font-black uppercase text-stone-500 mb-2">
                Courses removed
              </p>
              {summary.removed.length === 0 ? (
                <p className="text-xs font-bold text-neutral-500">None</p>
              ) : (
                <div className="space-y-1">
                  {summary.removed.map((id) => (
                    <p key={id} className="text-xs font-black uppercase text-stone-800">
                      {initialMap.get(id)?.courseName ?? id}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_#000]">
              <p className="text-[10px] font-black uppercase text-stone-500 mb-2">
                Slot changes
              </p>
              {summary.slotChanges.length === 0 ? (
                <p className="text-xs font-bold text-neutral-500">None</p>
              ) : (
                <div className="space-y-1">
                  {summary.slotChanges.map((entry) => (
                    <p key={entry.key} className="text-xs font-black uppercase text-stone-800">
                      {entry.name} • {entry.from} → {entry.to}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_#000]">
              <p className="text-[10px] font-black uppercase text-stone-500 mb-2">
                Electives
              </p>
              <p className="text-xs font-bold text-neutral-600">
                {electiveSelectedCount} of {electiveLimit || electiveSelectedCount} selected
              </p>
              {electiveSelectedCount === 0 && (
                <p className="text-[10px] font-bold uppercase text-neutral-500 mt-1">
                  Electives skipped for now.
                </p>
              )}
            </div>
          </div>
          <Drawer.Footer>
            <div className="flex w-full items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="flex-1 border-2 border-black bg-white px-4 py-3 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={mutation.isPending}
                className="flex-1 border-2 border-black bg-black px-4 py-3 text-xs font-black uppercase text-white shadow-[3px_3px_0px_0px_#000] disabled:opacity-60"
              >
                Confirm Save
              </button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  );
}
