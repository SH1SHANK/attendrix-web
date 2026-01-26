import { Skeleton, RetroSkeleton } from "@/components/ui/skeleton";

export function ScheduleSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-6 w-6 rounded-full bg-stone-300" />
        <Skeleton className="h-6 w-48 rounded bg-stone-300" />
        <div className="flex-1 h-[2px] sm:h-[3px] bg-stone-200" />
        <Skeleton className="h-4 w-20 rounded bg-stone-300" />
      </div>

      {/* Cards */}
      {[1, 2, 3].map((i) => (
        <RetroSkeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}

export function ChallengeSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40 mb-4 bg-stone-300" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <RetroSkeleton className="h-64 w-full" />
            <Skeleton className="h-4 w-3/4 self-center mt-2 bg-stone-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b-2 border-black/10">
      <Skeleton className="h-12 w-12 rounded-full border-2 border-black bg-stone-200" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-32 bg-stone-300" />
        <Skeleton className="h-3 w-24 bg-stone-200" />
      </div>
      <RetroSkeleton className="h-10 w-24" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Greeting Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 md:w-96 bg-stone-300" />
          <Skeleton className="h-4 w-40 bg-stone-200" />
        </div>
      </div>

      {/* Main Hero Card (Next Up) */}
      <RetroSkeleton className="h-64 w-full border-4 shadow-[8px_8px_0px_0px_#000]" />

      {/* Schedule */}
      <ScheduleSkeleton />
    </div>
  );
}
