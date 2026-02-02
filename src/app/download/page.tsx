import { Suspense } from "react";
import { getReleases } from "@/lib/github";
import { ReleasesClient } from "@/components/release/ReleasesClient";
import {
  ReleasesSkeleton,
  HeroSkeleton,
} from "@/components/release/ReleasesSkeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { DownloadProvider } from "@/context/DownloadContext";
import { DynamicProgressModal } from "@/components/releases/DynamicProgressModal";

export const metadata = {
  title: "Release Hub | Attendrix",
  description:
    "Official download source for Attendrix Android packages alongside technical release notes, provenance, and checksums.",
};

export const revalidate = 3600; // Revalidate every hour (ISR)

// Main content component
async function ReleasesContent() {
  const releases = await getReleases();

  if (releases.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-neutral-300">
        <div className="bg-neutral-100 p-4 rounded-full mb-4 border-2 border-black">
          <AlertCircle className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-xl font-bold uppercase mb-2">No Releases Found</h3>
        <p className="text-neutral-500 max-w-md">
          We couldn&apos;t fetch the release history from GitHub. This might be
          due to rate limiting or an empty repository.
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2 bg-black text-white font-bold uppercase text-sm border-2 border-black hover:bg-neutral-800 transition-colors"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return <ReleasesClient releases={releases} />;
}

export default function DownloadsPage() {
  return (
    <DownloadProvider>
      <div className="min-h-screen bg-[#fffdf5]">
        <Navbar />
        <DynamicProgressModal />

        <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm font-medium">
              <li>
                <Link
                  href="/"
                  className="text-neutral-500 hover:text-black transition-colors"
                >
                  Home
                </Link>
              </li>
              <li className="text-neutral-300">/</li>
              <li className="text-black font-bold">Downloads</li>
            </ol>
          </nav>

          {/* Page Header - Simplified and cleaner */}
          <div className="mb-12">
            <div className="flex items-end justify-between flex-wrap gap-6 mb-4">
              <div className="flex-1">
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-2">
                  Release Hub
                </h1>
                <p className="text-base md:text-lg text-neutral-600 max-w-2xl">
                  Official downloads. Verified builds from our CI pipeline.
                </p>
              </div>

              {/* Compact Build Status */}
              <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black shadow-[4px_4px_0_#000]">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-mono font-bold text-sm">Active</span>
              </div>
            </div>
          </div>

          {/* Releases Section - Show skeleton while loading */}
          <Suspense
            fallback={
              <div className="space-y-8">
                <HeroSkeleton />
                <ReleasesSkeleton count={3} />
              </div>
            }
          >
            <ReleasesContent />
          </Suspense>
        </main>

        <Footer />
      </div>
    </DownloadProvider>
  );
}
