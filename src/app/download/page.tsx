import { getReleases } from "@/lib/github";
import { ReleaseCard } from "@/components/release/ReleaseCard";
import { Timeline } from "@/components/release/Timeline";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Release Hub | Attendrix",
  description:
    "Official download source for Attendrix Android packages alongside technical release notes, provenance, and checksums.",
};

export default async function DownloadsPage() {
  const releases = await getReleases();

  // Logic:
  // 1. Find the latest STABLE release for the Hero.
  // 2. If no stable release exists, just take the absolute latest.
  const latestStable =
    releases.find((r) => r.status === "stable") || releases[0];

  // 3. Filter out the Hero release from the timeline to avoid duplication
  const timelineReleases = releases.filter(
    (r) => r.releaseId !== latestStable?.releaseId,
  );

  return (
    <div className="min-h-screen bg-[#fffdf5]">
      <Navbar />

      <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">
            Release Hub
          </h1>
          <p className="text-lg md:text-xl font-medium text-neutral-600 max-w-2xl">
            Official artifact repository. Verified builds directly from our CI
            pipeline.
          </p>
        </div>

        {releases.length > 0 && latestStable ? (
          <>
            {/* HER SECTION: Latest Build */}
            <section className="mb-20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="font-mono text-sm font-bold uppercase tracking-wider text-black">
                  Latest Release
                </span>
              </div>
              <ReleaseCard release={latestStable} isHero />
            </section>

            {/* TIMELINE SECTION: History */}
            {timelineReleases.length > 0 && (
              <section>
                <h2 className="text-2xl font-black uppercase tracking-tight mb-8 border-b-2 border-black inline-block pb-1">
                  Release History
                </h2>
                <Timeline releases={timelineReleases} />
              </section>
            )}
          </>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-neutral-300 rounded-lg">
            <div className="bg-neutral-100 p-4 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-xl font-bold uppercase mb-2">
              No Releases Found
            </h3>
            <p className="text-neutral-500 max-w-md">
              We couldn&apos;t fetch the release history from GitHub. This might
              be due to rate limiting or an empty repository.
            </p>
            <Link
              href="/"
              className="mt-6 px-6 py-2 bg-black text-white font-bold uppercase text-sm"
            >
              Return Home
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
