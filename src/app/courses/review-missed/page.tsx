"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePastClasses } from "@/hooks/usePastClasses";
import { bulkCheckInRpc, getCourseAttendanceSummaryRpc } from "@/lib/attendance/attendance-service";
import { enqueueFirestoreAttendanceUpdate, flushNow } from "@/lib/attendance/firestore-write-buffer";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { toast } from "sonner";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import type { PastClass } from "@/types/types-defination";

const SESSION_KEY = "attendrix.edits";

type EditSession = {
  addedCourseIds: string[];
  removedCourseIds: string[];
  enrolledCourseIds: string[];
};

type CourseGroup = {
  courseId: string;
  classes: PastClass[];
};

export default function ReviewMissedPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid ?? null;

  const [session, setSession] = useState<EditSession | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      router.push("/profile");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as EditSession;
      if (!parsed?.addedCourseIds) {
        router.push("/profile");
        return;
      }
      setSession(parsed);
    } catch {
      router.push("/profile");
    }
  }, [authLoading, router, user]);

  const pastClassesQuery = usePastClasses(userId, "all");
  const pastClasses = pastClassesQuery.data ?? [];

  const relevantClasses = useMemo(() => {
    if (!session) return [] as PastClass[];
    const added = new Set(session.addedCourseIds);
    return pastClasses.filter(
      (cls) => added.has(cls.courseID) && cls.attendanceStatus !== "PRESENT",
    );
  }, [pastClasses, session]);

  const grouped = useMemo(() => {
    const map = new Map<string, PastClass[]>();
    relevantClasses.forEach((cls) => {
      const list = map.get(cls.courseID) ?? [];
      list.push(cls);
      map.set(cls.courseID, list);
    });
    return Array.from(map.entries()).map(([courseId, classes]) => ({
      courseId,
      classes,
    })) as CourseGroup[];
  }, [relevantClasses]);

  const toggleClass = (classId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  const handleSkip = () => {
    router.push("/courses/completed");
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error("Please sign in again.");
      return;
    }

    const classIds = Array.from(selectedIds).filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
    if (classIds.length === 0) {
      router.push("/courses/completed");
      return;
    }

    setSubmitting(true);
    try {
      const response = (await bulkCheckInRpc({ classIds })) as {
        status?: string;
        message?: string;
        total_amplix_gained?: number;
      };
      if (response.status !== "success") {
        const message =
          typeof response.message === "string"
            ? response.message
            : "Unable to update classes";
        toast.error(message);
        setSubmitting(false);
        return;
      }

      const summary = await getCourseAttendanceSummaryRpc(userId);
      const totalAmplix = Number(response.total_amplix_gained ?? 0);

      enqueueFirestoreAttendanceUpdate(
        {
          uid: userId,
          summary,
          amplixDelta: totalAmplix,
        },
        { urgent: true },
      );
      await flushNow();

      queryClient.invalidateQueries({
        queryKey: queryKeys.attendanceSummary(userId, undefined),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pastClasses(userId, "all"),
      });

      toast.success("Attendance updated.");
      router.push("/courses/completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Update failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fffdf5]">
      <DotPatternBackground />
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-20 pb-16">
        <div className="mb-6 border-[3px] border-black bg-white px-6 py-5 shadow-[5px_5px_0px_0px_#000]">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
            Mark Missed Classes
          </h1>
          <p className="text-sm font-bold text-neutral-600">
            Would you like to mark any missed classes for the newly added courses?
          </p>
        </div>

        {pastClassesQuery.isLoading ? (
          <div className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
            <p className="text-sm font-bold text-neutral-600">Loading classes…</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
            <p className="text-sm font-bold text-neutral-600">
              No missed classes detected for newly added courses.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <section
                key={group.courseId}
                className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]"
              >
                <h2 className="text-lg font-black uppercase tracking-tight mb-4">
                  {group.courseId}
                </h2>
                <div className="space-y-3">
                  {group.classes.map((cls) => {
                    const checked = selectedIds.has(cls.classID);
                    return (
                      <button
                        key={cls.classID}
                        type="button"
                        onClick={() => toggleClass(cls.classID)}
                        className={`w-full border-[3px] border-black px-4 py-3 text-left shadow-[4px_4px_0px_0px_#000] transition-all duration-150 ${
                          checked
                            ? "bg-[#22c55e]"
                            : "bg-white hover:-translate-y-0.5"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black uppercase text-black">
                              {cls.courseName}
                            </p>
                            <p className="text-xs font-bold text-black/70">
                              {new Date(cls.classStartTime).toLocaleString()}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="h-4 w-4 border-[2px] border-black"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-5 py-3 text-sm font-black uppercase shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000]"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-6 py-3 text-sm font-black uppercase text-white shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
