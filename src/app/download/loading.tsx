import { RetroSkeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

export default function DownloadsLoading() {
  return (
    <div className="min-h-screen bg-[#fffdf5]">
      <Navbar />

      <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Page Header Skeleton */}
        <div className="mb-12 space-y-4">
          <RetroSkeleton className="h-16 w-64 md:w-96" />
          <RetroSkeleton className="h-6 w-full max-w-2xl" />
        </div>

        {/* Hero Release Card Skeleton */}
        <section className="mb-20">
          <div className="flex items-center gap-2 mb-4">
            <RetroSkeleton className="w-3 h-3 rounded-full" />
            <RetroSkeleton className="h-4 w-32" />
          </div>

          <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0_#000]">
            {/* Top Badge Row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <RetroSkeleton className="h-6 w-20" />
              <RetroSkeleton className="h-6 w-32" />
            </div>

            {/* Header */}
            <div className="mb-6 space-y-4">
              <RetroSkeleton className="h-10 w-48" />

              {/* Technical Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4">
                <div className="space-y-2">
                  <RetroSkeleton className="h-3 w-12" />
                  <RetroSkeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2">
                  <RetroSkeleton className="h-3 w-12" />
                  <RetroSkeleton className="h-4 w-16" />
                </div>
                <div className="space-y-2">
                  <RetroSkeleton className="h-3 w-12" />
                  <RetroSkeleton className="h-4 w-14" />
                </div>
                <div className="space-y-2">
                  <RetroSkeleton className="h-3 w-12" />
                  <RetroSkeleton className="h-4 w-24" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-4 border-t-2 border-black/5">
              <RetroSkeleton className="h-14 w-full" />
              <RetroSkeleton className="h-20 w-full" />
            </div>
          </div>
        </section>

        {/* Timeline Section Skeleton */}
        <section>
          <RetroSkeleton className="h-8 w-48 mb-8" />

          <div className="relative border-l-2 border-black/20 ml-4 md:ml-8 space-y-12 py-8">
            {/* Timeline Item 1 */}
            <div className="relative pl-8 md:pl-12">
              <div className="absolute left-[-9px] top-8 w-4 h-4 rounded-full bg-white border-4 border-black box-content" />
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0_#000]">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <RetroSkeleton className="h-6 w-20" />
                  <RetroSkeleton className="h-6 w-32" />
                </div>
                <RetroSkeleton className="h-8 w-40 mb-4" />
                <RetroSkeleton className="h-14 w-full" />
              </div>
            </div>

            {/* Timeline Item 2 */}
            <div className="relative pl-8 md:pl-12">
              <div className="absolute left-[-9px] top-8 w-4 h-4 rounded-full bg-white border-4 border-black box-content" />
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0_#000]">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <RetroSkeleton className="h-6 w-20" />
                  <RetroSkeleton className="h-6 w-32" />
                </div>
                <RetroSkeleton className="h-8 w-40 mb-4" />
                <RetroSkeleton className="h-14 w-full" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
