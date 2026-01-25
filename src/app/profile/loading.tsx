export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      {/* Header Skeleton */}
      <div className="max-w-6xl mx-auto mb-8 bg-neutral-200 h-24 animate-pulse border-2 border-neutral-300" />

      {/* Main Grid Skeleton */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Identity Card Skeleton */}
        <div className="lg:col-span-4 bg-white border-2 border-neutral-300 h-[400px] animate-pulse shadow-[6px_6px_0px_0px_#e5e5e5]" />

        {/* Stats Grid Skeleton */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="bg-neutral-200 h-32 animate-pulse border-2 border-neutral-300" />
          <div className="bg-neutral-200 h-32 animate-pulse border-2 border-neutral-300" />
          <div className="col-span-2 bg-neutral-200 h-40 animate-pulse border-2 border-neutral-300" />
        </div>

        {/* Right Panel Skeleton */}
        <div className="lg:col-span-3 bg-neutral-200 h-[300px] animate-pulse border-2 border-neutral-300" />
      </div>

      {/* Matrix Skeleton */}
      <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white h-48 border-2 border-neutral-300 animate-pulse shadow-[4px_4px_0px_0px_#e5e5e5]"
          />
        ))}
      </div>
    </div>
  );
}
