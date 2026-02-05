import type { Metadata } from "next";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const metadata: Metadata = {
  title: "Dashboard | Attendrix - Smart Attendance Tracking",
  description:
    "View your class schedule, track attendance, and manage your academic calendar with Attendrix.",
  keywords: ["attendance", "dashboard", "schedule", "classes", "academic"],
  openGraph: {
    title: "Dashboard | Attendrix",
    description: "Smart attendance tracking dashboard",
    type: "website",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="min-h-screen">{children}</main>
      <DashboardNav />
    </>
  );
}
