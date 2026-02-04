"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUserCourseRecords } from "@/hooks/useUserCourseRecords";
import { useUserOnboardingProfile, useBatchOnboardingData } from "@/hooks/useOnboardingData";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import { isLabCourse, parseCourseType } from "@/lib/onboarding/course-utils";
import type { CourseRecord } from "@/types/supabase-academic";
import { toast } from "sonner";
import { Search } from "lucide-react";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import { Badge } from "@/components/ui/Badge";

const SESSION_KEY = "attendrix.edits";

type UpdateCoursesResponse = {
  addedCourseIds: string[];
  removedCourseIds: string[];
  enrolledCourseIds: string[];
};

function filterCourses(courses: CourseRecord[], term: string) {
  if (!term) return courses;
  const q = term.toLowerCase();
  return courses.filter(
    (course) =>
      course.courseName.toLowerCase().includes(q) ||
      course.courseID.toLowerCase().includes(q),
  );
}

function sortCourses(courses: CourseRecord[]) {
  return [...courses].sort((a, b) =>
    `${a.courseName}${a.courseID}`.localeCompare(`${b.courseName}${b.courseID}`),
  );
}

export default function EditCoursesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.uid ?? null;

  const courseRecordQuery = useUserCourseRecords(userId);
  const courseRecord = courseRecordQuery.data;
  const batchId = courseRecord?.batchID ?? null;

  const firebaseProfileQuery = useUserOnboardingProfile(userId);
  const batchQuery = useBatchOnboardingData(batchId);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/signin");
    }
  }, [authLoading, router, user]);

  const initialSelection = useMemo(() => {
    const firebaseCourses = firebaseProfileQuery.data?.coursesEnrolled ?? [];
    if (firebaseCourses.length > 0) {
      return firebaseCourses.map((course) => course.courseID);
    }
    return Array.isArray(courseRecord?.enrolledCourses)
      ? courseRecord?.enrolledCourses
      : [];
  }, [courseRecord?.enrolledCourses, firebaseProfileQuery.data?.coursesEnrolled]);

  useEffect(() => {
    if (initialized) return;
    if (initialSelection.length === 0) return;
    setSelectedIds(new Set(initialSelection));
    setInitialized(true);
  }, [initialSelection, initialized]);

  const coreCourses = useMemo(
    () => sortCourses(batchQuery.data?.coreCourses ?? []),
    [batchQuery.data?.coreCourses],
  );

  const electiveCourses = useMemo(
    () => batchQuery.data?.electiveCourses ?? [],
    [batchQuery.data?.electiveCourses],
  );

  const labCourses = useMemo(
    () => sortCourses(electiveCourses.filter((course) => isLabCourse(course))),
    [electiveCourses],
  );

  const nonLabElectives = useMemo(
    () =>
      sortCourses(electiveCourses.filter((course) => !isLabCourse(course))),
    [electiveCourses],
  );

  const filteredCore = useMemo(
    () => filterCourses(coreCourses, searchTerm),
    [coreCourses, searchTerm],
  );

  const filteredLab = useMemo(
    () => filterCourses(labCourses, searchTerm),
    [labCourses, searchTerm],
  );

  const filteredElectives = useMemo(
    () => filterCourses(nonLabElectives, searchTerm),
    [nonLabElectives, searchTerm],
  );

  const toggleCourse = (courseId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

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
      router.push("/courses/review-missed");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Update failed";
      toast.error(message);
    },
  });

  const handleSave = () => {
    const courseIds = Array.from(selectedIds);
    if (courseIds.length === 0) {
      toast.error("Please select at least one course.");
      return;
    }
    mutation.mutate(courseIds);
  };

  const isLoading =
    authLoading ||
    courseRecordQuery.isLoading ||
    firebaseProfileQuery.isLoading ||
    batchQuery.isLoading;

  return (
    <div className="relative min-h-screen bg-[#fffdf5]">
      <DotPatternBackground />
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 pt-20 pb-16">
        <div className="mb-6 border-[3px] border-black bg-white px-6 py-5 shadow-[5px_5px_0px_0px_#000]">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
            Edit Enrolled Courses
          </h1>
          <p className="text-sm font-bold text-neutral-600">
            Select the courses you&apos;re currently enrolled in.
          </p>
        </div>

        <div className="mb-6 border-[3px] border-black bg-white px-6 py-4 shadow-[5px_5px_0px_0px_#000]">
          <label className="text-xs font-black uppercase text-neutral-600 mb-2 block">
            Search Courses
          </label>
          <div className="flex items-center gap-3 border-[3px] border-black bg-white px-3 py-2 shadow-[3px_3px_0px_0px_#000]">
            <Search className="h-4 w-4 text-neutral-600" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by course name or ID"
              className="flex-1 bg-transparent text-sm font-bold outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
            <p className="text-sm font-bold text-neutral-600">Loading courses…</p>
          </div>
        ) : batchQuery.isError ? (
          <div className="border-[3px] border-black bg-red-50 px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
            <p className="text-sm font-bold text-red-600">
              Unable to load course catalog. Please try again.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {[
              { label: "Core Courses", courses: filteredCore },
              { label: "Lab Courses", courses: filteredLab },
              { label: "Elective Courses", courses: filteredElectives },
            ].map((group) => (
              <section
                key={group.label}
                className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h2 className="text-lg font-black uppercase tracking-tight">
                    {group.label}
                  </h2>
                  <Badge variant="dark" size="default">
                    {group.courses.length} options
                  </Badge>
                </div>

                {group.courses.length === 0 ? (
                  <p className="text-sm font-bold text-neutral-500">
                    No courses available.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.courses.map((course) => {
                      const type = parseCourseType(course.courseType);
                      const isSelected = selectedIds.has(course.courseID);
                      return (
                        <button
                          key={course.courseID}
                          type="button"
                          onClick={() => toggleCourse(course.courseID)}
                          className={`border-[3px] border-black px-4 py-3 text-left shadow-[4px_4px_0px_0px_#000] transition-all duration-150 ${
                            isSelected
                              ? "bg-[#22c55e]"
                              : "bg-white hover:-translate-y-0.5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-black uppercase text-black mb-1 truncate">
                                {course.courseName}
                              </p>
                              <p className="text-xs font-bold text-black/70">
                                {course.courseID}
                              </p>
                              <p className="text-[10px] font-black uppercase text-black/70 mt-1">
                                {type.isLab ? "Lab" : type.courseType}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="h-4 w-4 border-[2px] border-black"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-5 py-3 text-sm font-black uppercase shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-6 py-3 text-sm font-black uppercase text-white shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] disabled:opacity-60"
          >
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
