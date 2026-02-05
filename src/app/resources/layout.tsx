import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academic Resources | Attendrix",
  description:
    "Access course materials and study resources tied to your enrolled classes.",
  keywords: ["resources", "courses", "study", "academic"],
  openGraph: {
    title: "Academic Resources | Attendrix",
    description: "Drive-backed study materials for enrolled courses",
    type: "website",
  },
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="min-h-screen">{children}</main>
    </>
  );
}
