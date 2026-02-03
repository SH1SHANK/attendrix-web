"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  KeyRound,
  Mail,
  Pencil,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import {
  EmailAuthProvider,
  linkWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import DotPatternBackground from "@/components/ui/DotPatternBackground";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { useAuth } from "@/context/AuthContext";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { useUserOnboardingProfile } from "@/hooks/useOnboardingData";
import { getUserCourseRecords } from "@/lib/attendance/attendance-service";
import { db } from "@/lib/firebase";
import type {
  FirebaseCourseEnrollment,
  UserCourseRecord,
} from "@/types/types-defination";

type AuthProvider = "google" | "email";

const BRANCH_LABELS: Record<string, string> = {
  ME: "Mechanical Engineering",
  CE: "Civil Engineering",
  EE: "Electrical Engineering",
  EC: "Electronics & Communication",
  CS: "Computer Science",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

function parseBatchLabel(
  batchID?: string,
  semesterID?: string | number | null,
) {
  if (!batchID) return { label: "—", branch: "—" };
  const code = batchID.slice(0, 2).toUpperCase();
  const batchNum = batchID.slice(2, 4);
  const sem = batchID.slice(4, 6) || String(semesterID ?? "").padStart(2, "0");
  const semesterNumber = sem ? parseInt(sem, 10) : NaN;
  const semesterLabel = Number.isNaN(semesterNumber)
    ? "Semester —"
    : `Semester ${semesterNumber}`;
  const label = `${code}${batchNum || ""} - ${semesterLabel}`;
  return { label, branch: BRANCH_LABELS[code] ?? code };
}

function parseSupabaseCourses(
  raw: UserCourseRecord["enrolledCourses"] | string | null | undefined,
) {
  if (!raw) return [] as string[];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { is24Hour, toggleTimeFormat, attendanceGoal, setAttendanceGoal } =
    useUserPreferences();
  const { data: firebaseData, isLoading: firebaseLoading } =
    useUserOnboardingProfile(user?.uid ?? null);

  const [courseRecord, setCourseRecord] = useState<UserCourseRecord | null>(
    null,
  );
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [namePending, setNamePending] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);

  const [goalInput, setGoalInput] = useState(attendanceGoal.toString());
  const [settingsMounted, setSettingsMounted] = useState(false);

  useEffect(() => {
    setSettingsMounted(true);
  }, []);

  useEffect(() => {
    setGoalInput(attendanceGoal.toString());
  }, [attendanceGoal]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    setCourseLoading(true);
    setCourseError(null);

    getUserCourseRecords(user.uid)
      .then((record) => {
        if (!active) return;
        setCourseRecord(record);
      })
      .catch((error) => {
        console.error("Failed to load userCourseRecords:", error);
        if (!active) return;
        setCourseError("Unable to load academic info.");
      })
      .finally(() => {
        if (!active) return;
        setCourseLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.uid]);

  const displayName =
    firebaseData?.display_name || user?.displayName || "Student";

  useEffect(() => {
    if (!isEditingName) {
      setDisplayNameInput(displayName);
    }
  }, [displayName, isEditingName]);

  const username = firebaseData?.username || "student";
  const email = firebaseData?.email || user?.email || "—";
  const role = firebaseData?.userRole || "student";
  const photoUrl = firebaseData?.photo_url || user?.photoURL || "";

  const providerIds =
    user?.providerData?.map((provider) => provider.providerId) ?? [];
  const hasGoogleProvider = providerIds.includes("google.com");
  const hasPasswordProvider = providerIds.includes("password");

  const authProvider: AuthProvider = hasGoogleProvider ? "google" : "email";
  const authProviderLabel = authProvider === "google" ? "Google" : "Email";

  const enrolledCourseIds = useMemo(
    () => parseSupabaseCourses(courseRecord?.enrolledCourses),
    [courseRecord?.enrolledCourses],
  );

  const coursesById = useMemo(() => {
    const map = new Map<string, FirebaseCourseEnrollment>();
    (firebaseData?.coursesEnrolled ?? []).forEach((course) => {
      map.set(course.courseID, course);
    });
    return map;
  }, [firebaseData?.coursesEnrolled]);

  const coursesToDisplay = useMemo(() => {
    if (enrolledCourseIds.length === 0) return [];
    return enrolledCourseIds.map((courseID) => {
      const firebaseCourse = coursesById.get(courseID);
      return {
        courseID,
        courseName: firebaseCourse?.courseName ?? courseID,
        credits: firebaseCourse?.credits ?? 0,
        courseType: firebaseCourse?.courseType,
        attendedClasses: firebaseCourse?.attendedClasses ?? 0,
        totalClasses: firebaseCourse?.totalClasses ?? 0,
      };
    });
  }, [coursesById, enrolledCourseIds]);

  const amplixStats = useMemo(
    () => ({
      amplix: firebaseData?.amplix ?? 0,
      currentStreak: firebaseData?.currentStreak ?? 0,
      longestStreak: firebaseData?.longestStreak ?? 0,
    }),
    [
      firebaseData?.amplix,
      firebaseData?.currentStreak,
      firebaseData?.longestStreak,
    ],
  );

  const batchInfo = useMemo(() => {
    return parseBatchLabel(
      courseRecord?.batchID || firebaseData?.batchID,
      courseRecord?.semesterID ?? firebaseData?.semesterID,
    );
  }, [
    courseRecord?.batchID,
    courseRecord?.semesterID,
    firebaseData?.batchID,
    firebaseData?.semesterID,
  ]);

  const accountCreatedAt = useMemo(() => {
    const source = firebaseData?.created_time || user?.metadata?.creationTime;
    if (!source) return "—";
    const date = new Date(source);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }, [firebaseData?.created_time, user?.metadata?.creationTime]);

  const handleBackNavigation = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard");
  }, [router]);

  const handleSaveDisplayName = useCallback(async () => {
    if (!user || !displayNameInput.trim()) return;
    if (displayNameInput.trim() === displayName) {
      setIsEditingName(false);
      return;
    }

    setNamePending(true);
    try {
      await updateProfile(user, { displayName: displayNameInput.trim() });
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, { display_name: displayNameInput.trim() });
      toast.success("Display name updated.");
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update display name:", error);
      toast.error("Unable to update display name. Please try again.");
    } finally {
      setNamePending(false);
    }
  }, [displayName, displayNameInput, user]);

  const handlePasswordSubmit = useCallback(async () => {
    if (!user || !user.email) return;
    if (passwordInput.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (passwordInput !== passwordConfirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setPasswordPending(true);
    try {
      if (hasPasswordProvider) {
        await updatePassword(user, passwordInput);
        toast.success("Password updated.");
      } else {
        const credential = EmailAuthProvider.credential(
          user.email,
          passwordInput,
        );
        await linkWithCredential(user, credential);
        toast.success("Password added to your account.");
      }
      setPasswordInput("");
      setPasswordConfirm("");
      setShowPasswordForm(false);
    } catch (error) {
      console.error("Password update failed:", error);
      toast.error("Unable to update password. Please re-authenticate.");
    } finally {
      setPasswordPending(false);
    }
  }, [hasPasswordProvider, passwordConfirm, passwordInput, user]);

  const handleGoalSave = useCallback(() => {
    const parsed = parseInt(goalInput, 10);
    if (Number.isNaN(parsed) || parsed < 50 || parsed > 100) {
      toast.error("Attendance goal must be between 50 and 100.");
      setGoalInput(attendanceGoal.toString());
      return;
    }
    setAttendanceGoal(parsed);
    toast.success("Attendance goal updated.");
  }, [attendanceGoal, goalInput, setAttendanceGoal]);

  if (authLoading) {
    return <div className="min-h-screen bg-[#f5f5f5]" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6 relative isolate">
        <DotPatternBackground />
        <div className="relative z-10 border-[3px] border-black bg-white px-8 py-10 shadow-[6px_6px_0px_0px_#000] max-w-md">
          <h2 className="text-2xl font-black uppercase mb-4">
            SIGN IN REQUIRED
          </h2>
          <p className="text-base font-bold text-neutral-700 mb-6">
            Please sign in to view your profile.
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 border-[3px] border-black bg-[#FFD700] px-6 py-3 text-sm font-black uppercase shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-[3px_3px_0px_0px_#000]"
          >
            SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-24 relative isolate">
      <DotPatternBackground />

      <div className="mx-auto max-w-4xl relative z-10 px-4 sm:px-6 py-6">
        {/* Top Navigation */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-4 py-3 text-sm font-black uppercase shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-[3px_3px_0px_0px_#000]"
            >
              <ArrowLeft className="h-5 w-5" />
              BACK TO HOME
            </Link>
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm font-black uppercase">
                <li>
                  <Link
                    href="/"
                    className="text-neutral-600 hover:text-black underline decoration-2 transition-colors"
                  >
                    HOME
                  </Link>
                </li>
                <li className="text-neutral-400">/</li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-neutral-600 hover:text-black underline decoration-2 transition-colors"
                  >
                    DASHBOARD
                  </Link>
                </li>
                <li className="text-neutral-400">/</li>
                <li className="text-black underline decoration-2">PROFILE</li>
              </ol>
            </nav>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase text-black tracking-tight">
            PROFILE
          </h1>
        </div>

        {/* Profile Card */}
        <section className="mb-6 border-[3px] border-black bg-white px-6 py-8 shadow-[5px_5px_0px_0px_#000]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="shrink-0">
              {photoUrl ? (
                <div className="border-[3px] border-black shadow-[5px_5px_0px_0px_#000] overflow-hidden">
                  <Image
                    src={photoUrl}
                    alt="Profile photo"
                    width={120}
                    height={120}
                    className="h-[120px] w-[120px] object-cover"
                  />
                </div>
              ) : (
                <div className="h-[120px] w-[120px] border-[3px] border-black bg-[#FFD700] flex items-center justify-center shadow-[5px_5px_0px_0px_#000]">
                  <span className="text-4xl font-black text-black">
                    {getInitials(displayName)}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-black uppercase text-black">
                  {displayName}
                </h2>
                <span className="border-[3px] border-black bg-black px-3 py-1 text-xs font-black uppercase text-white shadow-[3px_3px_0px_0px_#000]">
                  {authProviderLabel}
                </span>
                <span className="border-[3px] border-black bg-[#FFD700] px-3 py-1 text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000]">
                  {role}
                </span>
              </div>

              <div className="space-y-3 text-sm font-bold text-stone-800">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  <span className="text-base">@{username}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  <span className="text-base">{email}</span>
                </div>
              </div>

              {/* Edit Display Name Section */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!isEditingName ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="inline-flex items-center gap-2 border-[3px] border-black bg-[#FFD700] px-4 py-3 text-sm font-black uppercase shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-[3px_3px_0px_0px_#000]"
                  >
                    <Pencil className="h-5 w-5" />
                    EDIT DISPLAY NAME
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 w-full">
                    <input
                      value={displayNameInput}
                      onChange={(event) =>
                        setDisplayNameInput(event.target.value)
                      }
                      className="flex-1 min-w-[200px] border-[3px] border-black px-4 py-3 text-base font-bold uppercase shadow-[5px_5px_0px_0px_#000] placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-black/20"
                      placeholder="ENTER DISPLAY NAME"
                    />
                    <button
                      type="button"
                      onClick={handleSaveDisplayName}
                      disabled={namePending}
                      className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-4 py-3 text-sm font-black uppercase text-white shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-[3px_3px_0px_0px_#000] disabled:opacity-60"
                    >
                      <Save className="h-5 w-5" />
                      {namePending ? "SAVING" : "SAVE"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-4 py-3 text-sm font-black uppercase shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-[3px_3px_0px_0px_#000]"
                    >
                      <X className="h-5 w-5" />
                      CANCEL
                    </button>
                  </div>
                )}
              </div>

              {/* Password Section */}
              <div className="border-t-[3px] border-black pt-5">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm((prev) => !prev)}
                  className="inline-flex items-center gap-2 border-[3px] border-black bg-[#FFD700] px-4 py-3 text-sm font-black uppercase shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-[3px_3px_0px_0px_#000]"
                >
                  <KeyRound className="h-5 w-5" />
                  {hasPasswordProvider ? "CHANGE PASSWORD" : "ADD PASSWORD"}
                </button>
                {showPasswordForm && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(event) => setPasswordInput(event.target.value)}
                      className="border-[3px] border-black px-4 py-3 text-base font-bold uppercase shadow-[5px_5px_0px_0px_#000] placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-black/20"
                      placeholder="NEW PASSWORD"
                    />
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(event) =>
                        setPasswordConfirm(event.target.value)
                      }
                      className="border-[3px] border-black px-4 py-3 text-base font-bold uppercase shadow-[5px_5px_0px_0px_#000] placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-black/20"
                      placeholder="CONFIRM PASSWORD"
                    />
                    <button
                      type="button"
                      onClick={handlePasswordSubmit}
                      disabled={passwordPending}
                      className="sm:col-span-2 inline-flex items-center justify-center gap-2 border-[3px] border-black bg-black px-4 py-3 text-sm font-black uppercase text-white shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-[3px_3px_0px_0px_#000] disabled:opacity-60"
                    >
                      <ShieldCheck className="h-5 w-5" />
                      {passwordPending ? "UPDATING" : "CONFIRM PASSWORD"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Amplix Overview - Gamification Stats */}
        <section className="mb-6 border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#FFD700] p-2 border-[3px] border-black shadow-[3px_3px_0px_0px_#000]">
              <BadgeCheck className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">
              AMPLIX OVERVIEW
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Amplix Score - Yellow highlight like dashboard */}
            <div className="border-[3px] border-black bg-[#FFD700] px-5 py-5 shadow-[5px_5px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-black mb-2">
                AMPLIX SCORE
              </p>
              <p className="text-4xl font-black text-black">
                {amplixStats.amplix}
              </p>
            </div>
            {/* Current Streak - Green for success state */}
            <div className="border-[3px] border-black bg-[#22c55e] px-5 py-5 shadow-[5px_5px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-black mb-2">
                STREAK
              </p>
              <p className="text-4xl font-black text-black">
                {amplixStats.currentStreak}
              </p>
              <p className="text-xs font-black uppercase text-black">DAYS</p>
            </div>
            {/* Longest Streak - White box */}
            <div className="border-[3px] border-black bg-white px-5 py-5 shadow-[5px_5px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-2">
                LONGEST STREAK
              </p>
              <p className="text-4xl font-black text-black">
                {amplixStats.longestStreak}
              </p>
              <p className="text-xs font-black uppercase text-neutral-600">
                DAYS
              </p>
            </div>
          </div>
        </section>

        {/* Academic Info */}
        <section className="mb-6 border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <h3 className="text-xl font-black uppercase tracking-tight mb-6">
            ACADEMIC INFO
          </h3>
          {courseLoading ? (
            <p className="text-base font-bold text-neutral-600">Loading...</p>
          ) : courseError ? (
            <p className="text-base font-bold text-red-600">{courseError}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-[3px] border-black bg-white px-5 py-4 shadow-[5px_5px_0px_0px_#000]">
                <p className="text-xs font-black uppercase text-neutral-600 mb-2">
                  BATCH
                </p>
                <p className="text-base font-black uppercase text-black">
                  {batchInfo.label}
                </p>
                <p className="text-sm font-bold text-neutral-600 mt-1">
                  {batchInfo.branch}
                </p>
              </div>
              <div className="border-[3px] border-black bg-white px-5 py-4 shadow-[5px_5px_0px_0px_#000]">
                <p className="text-xs font-black uppercase text-neutral-600 mb-2">
                  ENROLLED COURSES
                </p>
                <p className="text-base font-black uppercase text-black">
                  {enrolledCourseIds.length}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Enrolled Courses List */}
        <section className="mb-6 border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <h3 className="text-xl font-black uppercase tracking-tight mb-6">
            ENROLLED COURSES
          </h3>
          {firebaseLoading ? (
            <p className="text-base font-bold text-neutral-600">
              Loading courses...
            </p>
          ) : coursesToDisplay.length === 0 ? (
            <p className="text-base font-bold text-neutral-600">
              No enrolled courses found.
            </p>
          ) : (
            <div className="space-y-4">
              {coursesToDisplay.map((course) => {
                const typeLabel = course.courseType?.isLab
                  ? "Lab"
                  : course.courseType?.courseType === "elective"
                    ? "Elective"
                    : "Core";
                const attendanceLabel =
                  course.totalClasses > 0
                    ? `${course.attendedClasses} / ${course.totalClasses}`
                    : "—";

                return (
                  <div
                    key={course.courseID}
                    className="border-[3px] border-black bg-[#22c55e] px-5 py-4 shadow-[5px_5px_0px_0px_#000] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-base font-black uppercase text-black mb-1">
                        {course.courseName}
                      </p>
                      <div className="text-xs font-black uppercase text-black/80 flex flex-wrap gap-2">
                        <span>{course.courseID}</span>
                        <span>• {typeLabel}</span>
                        <span>• {course.credits} credits</span>
                      </div>
                    </div>
                    <div className="text-xs font-black uppercase text-black border-[3px] border-black bg-white px-4 py-2 shadow-[3px_3px_0px_0px_#000] shrink-0">
                      ATTENDED {attendanceLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Settings */}
        <section className="mb-6 border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <h3 className="text-xl font-black uppercase tracking-tight mb-6">
            SETTINGS
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Time Format */}
            <div className="border-[3px] border-black bg-white px-5 py-4 shadow-[5px_5px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-3">
                TIME FORMAT
              </p>
              {settingsMounted && (
                <button
                  type="button"
                  onClick={toggleTimeFormat}
                  className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-4 py-3 text-sm font-black uppercase text-white shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-[3px_3px_0px_0px_#000]"
                >
                  {is24Hour ? "24H" : "12H"}
                </button>
              )}
            </div>
            {/* Attendance Goal */}
            <div className="border-[3px] border-black bg-white px-5 py-4 shadow-[5px_5px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-3">
                ATTENDANCE GOAL
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={goalInput}
                  onChange={(event) => setGoalInput(event.target.value)}
                  className="w-24 border-[3px] border-black px-3 py-2 text-base font-black uppercase shadow-[3px_3px_0px_0px_#000] focus:outline-none focus:ring-4 focus:ring-black/20"
                />
                <span className="text-base font-black uppercase text-neutral-600">
                  %
                </span>
                <button
                  type="button"
                  onClick={handleGoalSave}
                  className="ml-auto inline-flex items-center gap-2 border-[3px] border-black bg-[#FFD700] px-4 py-2 text-sm font-black uppercase shadow-[3px_3px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000]"
                >
                  SAVE
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* System Info */}
        <section className="mb-6 border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <h3 className="text-xl font-black uppercase tracking-tight mb-6">
            SYSTEM INFO
          </h3>
          <div className="grid gap-4 sm:grid-cols-3 text-sm font-bold uppercase text-neutral-700">
            <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-1">
                USER ID
              </p>
              <p className="text-black break-all text-xs">
                {firebaseData?.uid ?? "—"}
              </p>
            </div>
            <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-1">
                AUTH UID
              </p>
              <p className="text-black break-all text-xs">{user.uid}</p>
            </div>
            <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-1">
                CREATED
              </p>
              <p className="text-black text-xs">{accountCreatedAt}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Navigation */}
      <DashboardNav />
    </div>
  );
}
