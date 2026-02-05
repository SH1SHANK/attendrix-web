import type { Metadata } from "next";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const metadata: Metadata = {
  title: "Classes | Attendrix - Smart Attendance Tracking",
  description:
    "Review past classes, track attendance, and perform quick check-ins with Attendrix.",
  keywords: ["attendance", "classes", "check-in", "academic"],
  openGraph: {
    title: "Classes | Attendrix",
    description: "Fast, reliable attendance control for classes",
    type: "website",
  },
};

export default function ClassesLayout({
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
