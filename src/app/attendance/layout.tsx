import type { Metadata } from "next";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const metadata: Metadata = {
  title: "Attendance | Attendrix - Smart Attendance Tracking",
  description:
    "Track course-wise attendance progress, analytics, and eligibility with Attendrix.",
  keywords: ["attendance", "analytics", "syllabus", "academic"],
  openGraph: {
    title: "Attendance | Attendrix",
    description: "Course-wise attendance insights and progress",
    type: "website",
  },
};

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardNav />
      <main className="min-h-screen">{children}</main>
    </>
  );
}
