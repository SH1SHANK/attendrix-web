"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Bug,
  ChevronRight,
  Code2,
  Cookie,
  Lightbulb,
  LifeBuoy,
  LogOut,
  Scale,
  Shield,
  Info,
  KeyRound,
  Mail,
  Pencil,
  Save,
  ShieldCheck,
  Users,
  UserPlus,
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
import { useUserCourseRecords } from "@/hooks/useUserCourseRecords";
import { useUserCalendars } from "@/hooks/useUserCalendars";
import { useResyncUserRecords } from "@/hooks/useResyncUserRecords";
import { useAttendanceSummary } from "@/hooks/useAttendanceSummary";
import { usePastClasses } from "@/hooks/usePastClasses";
import { db } from "@/lib/firebase";
import { recordMetric } from "@/lib/metrics/client-metrics";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { SmoothSection } from "@/components/ui/SmoothSection";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
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
  const { user, loading: authLoading, logout } = useAuth();
  const { is24Hour, toggleTimeFormat, attendanceGoal, setAttendanceGoal } =
    useUserPreferences();
  const { data: firebaseData, isLoading: firebaseLoading } =
    useUserOnboardingProfile(user?.uid ?? null);
  const {
    data: courseRecord,
    isLoading: courseLoading,
    error: courseErrorRaw,
  } = useUserCourseRecords(user?.uid ?? null);
  const calendarsQuery = useUserCalendars(courseRecord?.batchID ?? null);
  const courseError = courseErrorRaw ? "Unable to load academic info." : null;
  const queryClient = useQueryClient();
  const resyncMutation = useResyncUserRecords();
  const attendanceSummaryQuery = useAttendanceSummary(
    user?.uid ?? null,
    attendanceGoal,
  );
  const pastClassesQuery = usePastClasses(user?.uid ?? null, "all");
  const attendanceSummary = useMemo(
    () => attendanceSummaryQuery.data ?? [],
    [attendanceSummaryQuery.data],
  );
  const exportCourses = firebaseData?.coursesEnrolled ?? [];
  const hasAttendanceData = attendanceSummary.length > 0;
  const hasCourseExportData = exportCourses.length > 0;

  const [isEditingName, setIsEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [namePending, setNamePending] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);
  const [isCalendarHelpOpen, setIsCalendarHelpOpen] = useState(false);
  const [isResyncConfirmOpen, setIsResyncConfirmOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [resyncSummary, setResyncSummary] = useState<{
    missingInSupabase: string[];
    extraInSupabase: string[];
    totalsMismatched: Array<{
      courseID: string;
      firebase: { attended: number; total: number };
      supabase: { attended: number; total: number };
    }>;
    updated: boolean;
  } | null>(null);

  const deactivateMutation = useMutation({
    mutationFn: () =>
      fetchJson("/api/profile/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DEACTIVATE" }),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetchJson("/api/profile/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      }),
  });

  useEffect(() => {
    if (!isDeactivateOpen) {
      setDeactivateConfirm("");
    }
  }, [isDeactivateOpen]);

  useEffect(() => {
    if (!isDeleteOpen) {
      setDeleteConfirm("");
    }
  }, [isDeleteOpen]);

  const [goalInput, setGoalInput] = useState(attendanceGoal.toString());
  const [settingsMounted, setSettingsMounted] = useState(false);
  const parsedGoal = Number.parseInt(goalInput, 10);
  const goalValue = Number.isFinite(parsedGoal) ? parsedGoal : attendanceGoal;
  const [exportFormat, setExportFormat] = useState<"csv" | "markdown" | "pdf">(
    "csv",
  );
  const [exportDataset, setExportDataset] = useState<
    "attendance" | "courses"
  >("attendance");

  useEffect(() => {
    setSettingsMounted(true);
  }, []);

  useEffect(() => {
    setGoalInput(attendanceGoal.toString());
  }, [attendanceGoal]);

  useEffect(() => {
    if (courseErrorRaw) {
      console.error("Failed to load userCourseRecords:", courseErrorRaw);
    }
  }, [courseErrorRaw]);

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

  const buildIcalUrl = (calendarId: string) => {
    const encoded = encodeURIComponent(calendarId);
    return `https://calendar.google.com/calendar/ical/${encoded}/public/basic.ics`;
  };

  const downloadBlob = (content: string, filename: string, type: string) => {
    if (typeof window === "undefined") return;
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener noreferrer";
    link.click();
    URL.revokeObjectURL(url);
  };

  const buildCsvRow = (values: Array<string | number | null | undefined>) =>
    values
      .map((value) => {
        const cell = value == null ? "" : String(value);
        const escaped = cell.replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(",");

  const exportAttendanceCsv = () => {
    if (attendanceSummary.length === 0) {
      toast.error("Attendance summary not available yet.");
      return;
    }
    const rows = [
      buildCsvRow([
        "Course ID",
        "Course Name",
        "Course Type",
        "Credits",
        "Attended",
        "Total",
        "Attendance %",
      ]),
      ...attendanceSummary.map((item) =>
        buildCsvRow([
          item.courseID,
          item.courseName,
          item.courseType,
          item.credits,
          item.attendedClasses,
          item.totalClasses,
          item.attendancePercentage,
        ]),
      ),
    ];
    recordMetric("profile.export.csv.attendance", 1);
    downloadBlob(rows.join("\n"), "attendrix-attendance.csv", "text/csv");
  };

  const exportCoursesCsv = () => {
    if (exportCourses.length === 0) {
      toast.error("No enrolled courses available.");
      return;
    }
    const rows = [
      buildCsvRow([
        "Course ID",
        "Course Name",
        "Course Type",
        "Credits",
        "Attended",
        "Total",
      ]),
      ...exportCourses.map((course) =>
        buildCsvRow([
          course.courseID,
          course.courseName,
          course.courseType?.courseType ?? "",
          course.credits,
          course.attendedClasses,
          course.totalClasses,
        ]),
      ),
    ];
    recordMetric("profile.export.csv.courses", 1);
    downloadBlob(rows.join("\n"), "attendrix-courses.csv", "text/csv");
  };

  const exportMarkdown = () => {
    const summary = attendanceSummary;
    const createdAt = new Date().toLocaleString();
    const header = `# Attendrix Attendance Export\n\nGenerated: ${createdAt}\n\nUser: ${
      user?.displayName || user?.email || "Student"
    }\n\nBatch: ${batchInfo.label}\n\n`;
    const tableHeader =
      "| Course ID | Course Name | Type | Credits | Attended | Total | % |\n|---|---|---|---|---|---|---|\n";
    const tableRows = summary
      .map(
        (item) =>
          `| ${item.courseID} | ${item.courseName} | ${item.courseType} | ${item.credits} | ${item.attendedClasses} | ${item.totalClasses} | ${item.attendancePercentage} |`,
      )
      .join("\n");
    const markdown = header + tableHeader + tableRows + "\n";
    recordMetric("profile.export.markdown", 1);
    downloadBlob(markdown, "attendrix-attendance.md", "text/markdown");
  };

  const exportPdf = () => {
    if (typeof window === "undefined") return;
    const summary = attendanceSummary;
    const pastClasses = pastClassesQuery.data ?? [];
    const createdAt = new Date();

    const escapeHtml = (
      value: string | number | null | undefined,
    ): string => {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const formatPercent = (value: number | null | undefined) => {
      const num = typeof value === "number" ? value : Number(value ?? NaN);
      return Number.isFinite(num) ? `${Math.round(num)}%` : "—";
    };

    const formatDateTime = (value: string | null | undefined) => {
      if (!value) return "—";
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return "—";
      return parsed.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const totalClasses = summary.reduce(
      (sum, item) => sum + (Number(item.totalClasses) || 0),
      0,
    );
    const attendedClasses = summary.reduce(
      (sum, item) => sum + (Number(item.attendedClasses) || 0),
      0,
    );
    const overallPercentage = totalClasses
      ? Math.round((attendedClasses / totalClasses) * 100)
      : 0;

    const summaryRows = [...summary]
      .sort((a, b) => (a.courseID ?? "").localeCompare(b.courseID ?? ""))
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.courseID)}</td>
            <td>${escapeHtml(item.courseName)}</td>
            <td>${escapeHtml(item.courseType)}</td>
            <td>${escapeHtml(item.credits)}</td>
            <td>${escapeHtml(item.attendedClasses)}</td>
            <td>${escapeHtml(item.totalClasses)}</td>
            <td>${escapeHtml(formatPercent(item.attendancePercentage))}</td>
          </tr>`,
      )
      .join("");

    const classRows = [...pastClasses]
      .sort(
        (a, b) => {
          const aTime = Date.parse(a.classStartTime ?? "");
          const bTime = Date.parse(b.classStartTime ?? "");
          const safeATime = Number.isNaN(aTime) ? 0 : aTime;
          const safeBTime = Number.isNaN(bTime) ? 0 : bTime;
          return safeATime - safeBTime;
        },
      )
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.courseID)}</td>
            <td>${escapeHtml(item.courseName)}</td>
            <td>${escapeHtml(item.attendanceStatus)}</td>
            <td>${escapeHtml(formatDateTime(item.classStartTime))}</td>
            <td>${escapeHtml(formatDateTime(item.classEndTime))}</td>
            <td>${escapeHtml(item.classVenue ?? "—")}</td>
          </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Attendrix Attendance Export</title>
  <style>
    :root {
      color-scheme: light;
    }
    body {
      font-family: "Helvetica Neue", Arial, sans-serif;
      margin: 28px;
      color: #000;
      background: #fff;
    }
    h1 {
      font-size: 30px;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    h2 {
      font-size: 18px;
      margin: 24px 0 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .brand {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border: 3px solid #000;
      padding: 16px;
      background: #fff2a8;
    }
    .brand-meta {
      font-size: 12px;
      text-align: right;
      line-height: 1.4;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 16px;
    }
    .summary-card {
      border: 2px solid #000;
      padding: 12px;
      background: #fff;
      font-size: 12px;
    }
    .summary-card .value {
      font-size: 20px;
      font-weight: 700;
      margin-top: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      table-layout: fixed;
    }
    th, td {
      border: 2px solid #000;
      padding: 8px;
      font-size: 12px;
      text-align: left;
      word-wrap: break-word;
    }
    th {
      background: #ffd23f;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .muted {
      font-size: 11px;
      color: #333;
    }
    .section {
      margin-top: 20px;
    }
    .empty-row {
      text-align: center;
      padding: 16px;
      font-style: italic;
    }
    @media print {
      body {
        margin: 18px;
      }
      .summary-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="brand">
    <div>
      <h1>Attendrix</h1>
      <div class="muted">Attendance Export</div>
    </div>
    <div class="brand-meta">
      <div>Generated: ${escapeHtml(createdAt.toLocaleString())}</div>
      <div>User: ${escapeHtml(user?.displayName || user?.email || "Student")}</div>
      <div>Batch: ${escapeHtml(batchInfo.label)}</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div>Total Courses</div>
      <div class="value">${escapeHtml(summary.length)}</div>
    </div>
    <div class="summary-card">
      <div>Classes Attended</div>
      <div class="value">${escapeHtml(attendedClasses)}</div>
    </div>
    <div class="summary-card">
      <div>Overall Attendance</div>
      <div class="value">${escapeHtml(overallPercentage)}%</div>
    </div>
  </div>

  <div class="section">
    <h2>Course Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Course ID</th>
          <th>Course Name</th>
          <th>Type</th>
          <th>Credits</th>
          <th>Attended</th>
          <th>Total</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        ${
          summaryRows ||
          `<tr><td class="empty-row" colspan="7">No course summary available.</td></tr>`
        }
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Class Details</h2>
    <table>
      <thead>
        <tr>
          <th>Course ID</th>
          <th>Course Name</th>
          <th>Status</th>
          <th>Start</th>
          <th>End</th>
          <th>Venue</th>
        </tr>
      </thead>
      <tbody>
        ${
          classRows ||
          `<tr><td class="empty-row" colspan="6">No class details available.</td></tr>`
        }
      </tbody>
    </table>
  </div>
</body>
</html>`;

    const pdfWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!pdfWindow) return;
    pdfWindow.document.write(html);
    pdfWindow.document.close();
    pdfWindow.focus();
    recordMetric("profile.export.pdf", 1);
    setTimeout(() => {
      pdfWindow.print();
    }, 250);
  };

  const handleResync = async () => {
    try {
      const result = await resyncMutation.mutateAsync();
      recordMetric("profile.resync.count", 1);
      setResyncSummary({
        missingInSupabase: result.missingInSupabase,
        extraInSupabase: result.extraInSupabase,
        totalsMismatched: result.totalsMismatched,
        updated: result.updated,
      });
      queryClient.invalidateQueries({ queryKey: ["user-course-records", user?.uid ?? null] });
      queryClient.invalidateQueries({ queryKey: ["attendance-summary", user?.uid ?? null] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-schedule", user?.uid ?? null] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resync failed";
      toast.error(message);
    } finally {
      setIsResyncConfirmOpen(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync();
      recordMetric("profile.account.deactivate", 1);
      await fetchJson("/api/auth/logout", { method: "POST" });
      window.location.href = "/auth/signin";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Deactivate failed";
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      recordMetric("profile.account.delete", 1);
      await fetchJson("/api/auth/logout", { method: "POST" });
      window.location.href = "/auth/signin";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      toast.error(message);
    }
  };

  const handleSignOut = async () => {
    try {
      recordMetric("profile.signout", 1);
      queryClient.clear();
      await logout();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign out failed";
      toast.error(message);
    }
  };

  const aboutLinks = [
    {
      label: "View Source Code",
      href: "https://github.com/SH1SHANK/attendrix-web",
      external: true,
      icon: <Code2 className="h-4 w-4" />,
    },
    {
      label: "Terms of Service",
      href: "/docs/terms",
      icon: <Scale className="h-4 w-4" />,
    },
    {
      label: "Privacy Policy",
      href: "/docs/privacy",
      icon: <Shield className="h-4 w-4" />,
    },
    {
      label: "Cookie Policy",
      href: "/docs/cookies",
      icon: <Cookie className="h-4 w-4" />,
    },
    {
      label: "Licence",
      href: "/docs/licence",
      icon: <BadgeCheck className="h-4 w-4" />,
    },
  ];

  const supportLinks = [
    {
      label: "Report a Bug",
      href: "/support/bug",
      icon: <Bug className="h-4 w-4" />,
    },
    {
      label: "Suggest / Request Feature",
      href: "/support/feature",
      icon: <Lightbulb className="h-4 w-4" />,
    },
    {
      label: "Contact Support",
      href:
        "mailto:support@attendrix.app?subject=" +
        encodeURIComponent("[Attendrix Web Support] Contact Support"),
      icon: <LifeBuoy className="h-4 w-4" />,
      external: true,
    },
    {
      label: "Join Attendrix Moderation",
      href: "/support/moderation",
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Request Batch Access",
      href: "/support/batch-access",
      icon: <UserPlus className="h-4 w-4" />,
    },
  ];

  const listVisibilityStyle = useMemo(
    () =>
      ({
      contentVisibility: "auto",
      containIntrinsicSize: "1px 720px",
      }) as React.CSSProperties,
    [],
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

  const handleTimeFormatChange = useCallback(
    (value: "12" | "24") => {
      const nextIs24 = value === "24";
      if (nextIs24 !== is24Hour) {
        toggleTimeFormat();
      }
    },
    [is24Hour, toggleTimeFormat],
  );

  const handleGoalSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setGoalInput(event.target.value);
    },
    [],
  );

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

  const handleClearLocalCache = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem("attendrix.cacheOverrides");
      window.localStorage.removeItem("attendrix.metrics");
      window.localStorage.removeItem("attendrix.installPrompt.dismissed");
      window.sessionStorage.removeItem("attendrix.edits");
      toast.success("Local cache cleared.");
    } catch (error) {
      console.error("Cache clear failed:", error);
      toast.error("Unable to clear cache.");
    }
  }, []);

  const exportSupportsSelection =
    exportFormat === "csv" || exportDataset === "attendance";
  const exportHasData =
    exportDataset === "attendance" ? hasAttendanceData : hasCourseExportData;
  const canExport = exportSupportsSelection && exportHasData;
  const exportHelper =
    exportFormat === "csv"
      ? "CSV exports download instantly."
      : exportFormat === "markdown"
        ? "Markdown exports attendance summary only."
        : "PDF export opens a print dialog for Save as PDF.";

  const handleExport = () => {
    if (!exportSupportsSelection) {
      toast.error("This format is available for attendance summary only.");
      return;
    }

    if (exportDataset === "attendance") {
      if (exportFormat === "markdown") {
        exportMarkdown();
        return;
      }
      if (exportFormat === "pdf") {
        exportPdf();
        return;
      }
      exportAttendanceCsv();
      return;
    }

    exportCoursesCsv();
  };

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

      <div className="mx-auto max-w-6xl relative z-10 px-4 sm:px-6 pt-3 pb-4 sm:pt-4 sm:pb-5">
        {/* Top Navigation */}
        <div className="mb-4 flex flex-col gap-3">
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
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase text-black tracking-tight">
              PROFILE
            </h1>
            <p className="text-xs sm:text-sm font-bold uppercase text-neutral-600 mt-1">
              Manage identity, academics, and preferences in one place.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="space-y-6">
        {/* Profile Card */}
        <SmoothSection className="border-[3px] border-black bg-white px-6 py-8 shadow-[5px_5px_0px_0px_#000]">
          <div className="mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight">
              PROFILE OVERVIEW
            </h3>
            <p className="text-sm font-bold text-neutral-600">
              Identity details, contact info, and security tools.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-[140px_minmax(0,1fr)]">
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
            <div className="flex-1 space-y-6">
              <div className="space-y-3">
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
                <p className="text-sm font-bold text-neutral-600">
                  This is your primary account identity across Attendrix.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-sm font-bold text-stone-800">
                <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000]">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-neutral-500">
                    <User className="h-4 w-4" />
                    Username
                  </div>
                  <p className="text-base font-black">@{username}</p>
                </div>
                <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000]">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-neutral-500">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <p className="text-base font-black break-all">{email}</p>
                </div>
              </div>

              {/* Edit Display Name Section */}
              <div className="border-t-[3px] border-black pt-5 space-y-3">
                <p className="text-xs font-black uppercase text-neutral-600">
                  Display name
                </p>
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
              <div className="border-t-[3px] border-black pt-5 space-y-3">
                <p className="text-xs font-black uppercase text-neutral-600">
                  Security
                </p>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm((prev) => !prev)}
                  className="inline-flex items-center gap-2 border-[3px] border-black bg-[#FFD700] px-4 py-3 text-sm font-black uppercase shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-[3px_3px_0px_0px_#000]"
                >
                  <KeyRound className="h-5 w-5" />
                  {hasPasswordProvider ? "CHANGE PASSWORD" : "ADD PASSWORD"}
                </button>
                {showPasswordForm && (
                  <div className="grid gap-4 sm:grid-cols-2">
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
        </SmoothSection>

        {/* Amplix Overview - Gamification Stats */}
        <SmoothSection className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#FFD700] p-2 border-[3px] border-black shadow-[3px_3px_0px_0px_#000]">
              <BadgeCheck className="h-6 w-6 text-black" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">
                AMPLIX OVERVIEW
              </h3>
              <p className="text-sm font-bold text-neutral-600">
                Track streaks and rewards tied to your attendance.
              </p>
            </div>
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
        </SmoothSection>

        {/* Academic Info */}
        <SmoothSection className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <div className="mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight">
              ACADEMIC INFO
            </h3>
            <p className="text-sm font-bold text-neutral-600">
              Verified batch and enrollment summary from your records.
            </p>
          </div>
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
        </SmoothSection>

        {/* Enrolled Courses List */}
        <SmoothSection className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">
                ENROLLED COURSES
              </h3>
              <p className="text-sm font-bold text-neutral-600">
                View current courses, credit types, and attendance counts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/profile/edit-courses")}
              className="inline-flex items-center gap-2 border-[3px] border-black bg-[#FFD700] px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000]"
            >
              Edit
            </button>
          </div>
          {firebaseLoading ? (
            <p className="text-base font-bold text-neutral-600">
              Loading courses...
            </p>
          ) : coursesToDisplay.length === 0 ? (
            <p className="text-base font-bold text-neutral-600">
              No enrolled courses found.
            </p>
          ) : (
            <div className="space-y-4" style={listVisibilityStyle}>
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
        </SmoothSection>

        {/* Sync Calendar */}
        <SmoothSection className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
            <div className="flex items-start gap-3">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  SYNC YOUR CALENDAR
                </h3>
                <p className="text-sm font-bold text-neutral-600">
                  Export your batch timetable to Google Calendar or iCal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarHelpOpen(true)}
                aria-label="How to sync calendar"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-black bg-white text-black shadow-[3px_3px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>

          {calendarsQuery.isLoading ? (
            <p className="text-base font-bold text-neutral-600">
              Loading calendars...
            </p>
          ) : calendarsQuery.isError ? (
            <p className="text-base font-bold text-red-600">
              Unable to load calendars. Please try again.
            </p>
          ) : (calendarsQuery.data ?? []).length === 0 ? (
            <p className="text-base font-bold text-neutral-600">
              No calendars available for your batch yet.
            </p>
          ) : (
            <div className="space-y-4" style={listVisibilityStyle}>
              {(calendarsQuery.data ?? []).map((calendar) => (
                <div
                  key={calendar.calendarID}
                  className="border-[3px] border-black bg-white px-5 py-4 shadow-[5px_5px_0px_0px_#000] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-base font-black uppercase text-black mb-1">
                      {calendar.calendar_name}
                    </p>
                    <p className="text-xs font-black uppercase text-black/70">
                      Batch {calendar.batchID}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        window.open(calendar.calendarUrl, "_blank", "noopener,noreferrer")
                      }
                      aria-label={`Sync ${calendar.calendar_name} to Google Calendar`}
                      className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-4 py-2 text-xs font-black uppercase text-white shadow-[3px_3px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                    >
                      Sync to Google
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = buildIcalUrl(calendar.calendarID);
                        link.download = `${calendar.calendar_name}.ics`;
                        link.rel = "noopener noreferrer";
                        link.target = "_blank";
                        link.click();
                      }}
                      aria-label={`Download ${calendar.calendar_name} iCal`}
                      className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                    >
                      Download iCal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs font-black uppercase text-neutral-600">
            Note: Google Calendar does not currently support electives or custom
            classes. This feature is work-in-progress and will be added soon!
          </p>
        </SmoothSection>

          </div>
          <div className="space-y-6 lg:sticky lg:top-6">
        {/* Settings */}
        <SmoothSection className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <div className="mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight">
              SETTINGS
            </h3>
            <p className="text-sm font-bold text-neutral-600">
              Tune the experience, attendance targets, and data sync tools.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Time Format */}
            <div className="border-[3px] border-black bg-white px-5 py-4 shadow-[5px_5px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-3">
                TIME FORMAT
              </p>
              <p className="text-sm font-bold text-neutral-600 mb-3">
                Choose how class times display throughout the app.
              </p>
              {settingsMounted && (
                <fieldset className="grid grid-cols-2 gap-2" aria-label="Time format">
                  <legend className="sr-only">Time format</legend>
                  <label
                    className={`flex items-center justify-center border-[3px] border-black px-4 py-2 text-sm font-black uppercase shadow-[3px_3px_0px_0px_#000] transition-all duration-150 ${
                      is24Hour
                        ? "bg-black text-white"
                        : "bg-white text-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="time-format"
                      className="sr-only"
                      checked={is24Hour}
                      onChange={() => handleTimeFormatChange("24")}
                    />
                    24H
                  </label>
                  <label
                    className={`flex items-center justify-center border-[3px] border-black px-4 py-2 text-sm font-black uppercase shadow-[3px_3px_0px_0px_#000] transition-all duration-150 ${
                      !is24Hour
                        ? "bg-black text-white"
                        : "bg-white text-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="time-format"
                      className="sr-only"
                      checked={!is24Hour}
                      onChange={() => handleTimeFormatChange("12")}
                    />
                    12H
                  </label>
                </fieldset>
              )}
            </div>
            {/* Attendance Goal */}
            <div className="border-[3px] border-black bg-white px-5 py-4 shadow-[5px_5px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-3">
                ATTENDANCE GOAL
              </p>
              <p className="text-sm font-bold text-neutral-600 mb-3">
                Set the minimum percentage you want to stay above.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={goalValue}
                    onChange={handleGoalSliderChange}
                    className="w-full accent-black"
                  />
                  <div className="border-[3px] border-black bg-white px-3 py-1 text-sm font-black uppercase shadow-[3px_3px_0px_0px_#000]">
                    {goalValue}%
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
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
            <div className="border-[3px] border-black bg-white px-5 py-4 shadow-[5px_5px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-3">
                USER RECORDS
              </p>
              <p className="text-sm font-bold text-neutral-600 mb-3">
                Re-evaluate Supabase records to match your Firebase data.
              </p>
              <button
                type="button"
                onClick={() => setIsResyncConfirmOpen(true)}
                disabled={resyncMutation.isPending}
                aria-label="Resync user records"
                className="inline-flex items-center gap-2 border-[3px] border-black bg-[#FFD700] px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] disabled:opacity-60"
              >
                {resyncMutation.isPending ? "Resyncing..." : "Resync User Records"}
              </button>
            </div>
          </div>
        </SmoothSection>

        {resyncSummary && (
          <SmoothSection className="border-[3px] border-black bg-white px-6 py-5 shadow-[5px_5px_0px_0px_#000]">
            <h3 className="text-lg font-black uppercase tracking-tight mb-4">
              Resync Summary
            </h3>
            <div className="grid gap-3 sm:grid-cols-3 text-sm font-bold uppercase text-neutral-700">
              <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000]">
                <p className="text-xs font-black uppercase text-neutral-600 mb-1">
                  Missing in Supabase
                </p>
                <p className="text-black">
                  {resyncSummary.missingInSupabase.length}
                </p>
              </div>
              <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000]">
                <p className="text-xs font-black uppercase text-neutral-600 mb-1">
                  Extra in Supabase
                </p>
                <p className="text-black">
                  {resyncSummary.extraInSupabase.length}
                </p>
              </div>
              <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000]">
                <p className="text-xs font-black uppercase text-neutral-600 mb-1">
                  Totals Mismatched
                </p>
                <p className="text-black">
                  {resyncSummary.totalsMismatched.length}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs font-black uppercase text-neutral-600">
              {resyncSummary.updated
                ? "Supabase enrollment updated to match Firebase."
                : "No enrollment updates were required."}
            </p>
          </SmoothSection>
        )}

        <SmoothSection>
          <details className="border-[3px] border-black bg-white px-6 py-5 shadow-[5px_5px_0px_0px_#000]">
            <summary className="cursor-pointer text-lg font-black uppercase tracking-tight">
              <span className="block">Additional Settings</span>
              <span className="mt-1 block text-xs font-bold uppercase text-neutral-500">
                Exports, installs, and account controls
              </span>
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000] opacity-60">
              <p className="text-xs font-black uppercase text-neutral-600 mb-2">
                Notification Preferences
              </p>
              <p className="text-sm font-bold text-neutral-600">
                Email and push reminders (coming soon)
              </p>
            </div>
            <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-2">
                Data Export
              </p>
              <p className="text-sm font-bold text-neutral-600">
                Pick a dataset and format, then export on demand.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-neutral-500 mb-2">
                    Export Format
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["csv", "markdown", "pdf"] as const).map((format) => (
                      <label
                        key={format}
                        className={`flex items-center justify-center border-[3px] border-black px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_#000] transition-all duration-150 ${
                          exportFormat === format
                            ? "bg-black text-white"
                            : "bg-white text-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="export-format"
                          className="sr-only"
                          checked={exportFormat === format}
                          onChange={() => setExportFormat(format)}
                        />
                        {format}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-neutral-500 mb-2">
                    Dataset
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: "attendance", label: "Attendance" },
                      { value: "courses", label: "Courses" },
                    ] as const).map((dataset) => (
                      <label
                        key={dataset.value}
                        className={`flex items-center justify-center border-[3px] border-black px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_#000] transition-all duration-150 ${
                          exportDataset === dataset.value
                            ? "bg-black text-white"
                            : "bg-white text-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="export-dataset"
                          className="sr-only"
                          checked={exportDataset === dataset.value}
                          onChange={() => setExportDataset(dataset.value)}
                        />
                        {dataset.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={!canExport}
                    className="inline-flex items-center gap-2 border-[3px] border-black bg-[#FFD700] px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000] disabled:opacity-60"
                  >
                    Export Now
                  </button>
                  <button
                    type="button"
                    onClick={exportAttendanceCsv}
                    className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                  >
                    Attendance CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportCoursesCsv}
                    className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                  >
                    Courses CSV
                  </button>
                </div>
                <p
                  className={`text-[10px] font-bold ${
                    !exportSupportsSelection
                      ? "text-red-600"
                      : !exportHasData
                        ? "text-neutral-500"
                        : "text-neutral-500"
                  }`}
                >
                  {!exportSupportsSelection
                    ? "Markdown/PDF support attendance summaries only."
                    : !exportHasData
                      ? "No data available for the selected dataset."
                      : exportHelper}
                </p>
              </div>
            </div>
            <InstallPrompt variant="card" />
            <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000] opacity-60">
              <p className="text-xs font-black uppercase text-neutral-600 mb-2">
                Theme Preferences
              </p>
              <p className="text-sm font-bold text-neutral-600">
                Reduced motion & dark mode (coming soon)
              </p>
            </div>
            <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000] opacity-60">
              <p className="text-xs font-black uppercase text-neutral-600 mb-2">
                Sync Frequency
              </p>
              <p className="text-sm font-bold text-neutral-600">
                Auto-sync interval (coming soon)
              </p>
            </div>
            <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-2">
                Account Controls
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeactivateOpen(true)}
                  className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                >
                  Deactivate
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(true)}
                  className="inline-flex items-center gap-2 border-[3px] border-black bg-red-500 px-3 py-2 text-[10px] font-black uppercase text-white shadow-[3px_3px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
                >
                  Delete
                </button>
              </div>
              <button
                type="button"
                onClick={handleClearLocalCache}
                className="mt-3 inline-flex items-center gap-2 border-[3px] border-black bg-white px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#000]"
              >
                Clear Local Cache
              </button>
            </div>
            <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0px_0px_#000]">
              <p className="text-xs font-black uppercase text-neutral-600 mb-2">
                Help & Feedback
              </p>
              <p className="text-sm font-bold text-neutral-600">
                support@attendrix.app
              </p>
            </div>
            </div>
          </details>
        </SmoothSection>

        <Dialog open={isCalendarHelpOpen} onOpenChange={setIsCalendarHelpOpen}>
          <DialogContent className="max-w-xl border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_#000]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                How to Sync Your Calendar
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm font-bold text-neutral-700">
              <p>
                Step 1: Tap <span className="font-black text-black">Sync to Google</span>.
              </p>
              <p>Step 2: Sign in to your Google account if prompted.</p>
              <p>
                Step 3: In the Google Calendar page, click{" "}
                <span className="font-black text-black">Add to calendar</span>.
              </p>
              <p>Step 4: Verify events appear in your Calendar app.</p>
              <p>
                Step 5: For iCal, choose{" "}
                <span className="font-black text-black">Download iCal</span> and
                import the .ics file into Apple or Outlook Calendar.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCalendarHelpOpen(false)}
                className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-5 py-2 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000]"
              >
                Got it
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isResyncConfirmOpen}
          onOpenChange={setIsResyncConfirmOpen}
        >
          <DialogContent className="max-w-xl border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_#000]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                Resync User Records
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm font-bold text-neutral-700">
              This will re-evaluate your course records and fix any data sync
              issues between Firebase and Supabase. Continue?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsResyncConfirmOpen(false)}
                className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResync}
                disabled={resyncMutation.isPending}
                className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-4 py-2 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] disabled:opacity-60"
              >
                {resyncMutation.isPending ? "Resyncing..." : "Continue"}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
          <DialogContent className="max-w-xl border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_#000]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                Deactivate Account
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm font-bold text-neutral-700 mb-4">
              Deactivation disables sign-in until reactivated by support. Type
              <span className="font-black text-black"> DEACTIVATE </span>
              to confirm.
            </p>
            <input
              value={deactivateConfirm}
              onChange={(event) => setDeactivateConfirm(event.target.value)}
              className="w-full border-[3px] border-black px-4 py-2 text-sm font-black uppercase shadow-[3px_3px_0px_0px_#000] focus:outline-none"
              placeholder="Type DEACTIVATE"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeactivateOpen(false)}
                className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_#000]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={
                  deactivateMutation.isPending || deactivateConfirm !== "DEACTIVATE"
                }
                className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-4 py-2 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_#000] disabled:opacity-60"
              >
                {deactivateMutation.isPending ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-xl border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_#000]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-red-600">
                Delete Account
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm font-bold text-neutral-700 mb-4">
              This permanently deletes your account and attendance history.
              Type <span className="font-black text-black">DELETE</span> to
              confirm.
            </p>
            <input
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              className="w-full border-[3px] border-black px-4 py-2 text-sm font-black uppercase shadow-[3px_3px_0px_0px_#000] focus:outline-none"
              placeholder="Type DELETE"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_#000]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending || deleteConfirm !== "DELETE"}
                className="inline-flex items-center gap-2 border-[3px] border-black bg-red-500 px-4 py-2 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_#000] disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen}>
          <DialogContent className="max-w-xl border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_#000]">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                Sign Out
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm font-bold text-neutral-700">
              Are you sure you want to sign out of Attendrix Web?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSignOutOpen(false)}
                className="inline-flex items-center gap-2 border-[3px] border-black bg-white px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_#000]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 border-[3px] border-black bg-black px-4 py-2 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_#000]"
              >
                Sign Out
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* System Info */}
        <SmoothSection className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <div className="mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight">
              SYSTEM INFO
            </h3>
            <p className="text-sm font-bold text-neutral-600">
              Internal identifiers for support and troubleshooting.
            </p>
          </div>
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
        </SmoothSection>

        {/* About Attendrix Web */}
        <SmoothSection className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <h3 className="text-xl font-black uppercase tracking-tight mb-4">
            ABOUT ATTENDRIX WEB
          </h3>
          <div className="grid gap-3">
            {aboutLinks.map((item) => {
              const row = (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_#000]">
                      {item.icon}
                    </span>
                    <span className="text-sm font-black uppercase text-black">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-black" />
                </div>
              );

              return item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="block border-[3px] border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000]"
                >
                  {row}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="block border-[3px] border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000]"
                >
                  {row}
                </Link>
              );
            })}
          </div>
        </SmoothSection>

        {/* Support */}
        <SmoothSection className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">
            SUPPORT
          </h3>
          <p className="text-sm font-bold text-neutral-600 mb-4">
            New here? Start with a quick report or request and we will help you
            get set up.
          </p>
          <div className="grid gap-3">
            {supportLinks.map((item) => {
              const row = (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_#000]">
                      {item.icon}
                    </span>
                    <span className="text-sm font-black uppercase text-black">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-black" />
                </div>
              );

              return item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="block border-[3px] border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000]"
                >
                  {row}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="block border-[3px] border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000]"
                >
                  {row}
                </Link>
              );
            })}
          </div>
        </SmoothSection>

        {/* Sign Out */}
        <SmoothSection className="border-[3px] border-black bg-white px-6 py-6 shadow-[5px_5px_0px_0px_#000]">
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">
            SIGN OUT
          </h3>
          <p className="text-sm font-bold text-neutral-600 mb-4">
            Sign out of Attendrix Web on this device.
          </p>
          <button
            type="button"
            onClick={() => setIsSignOutOpen(true)}
            aria-label="Sign Out"
            className="inline-flex items-center gap-2 border-[3px] border-black bg-[#FFD700] px-5 py-3 text-sm font-black uppercase shadow-[5px_5px_0px_0px_#000] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000]"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </SmoothSection>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <DashboardNav />
    </div>
  );
}
