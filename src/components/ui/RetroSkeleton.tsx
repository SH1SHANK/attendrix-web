import { cn } from "@/lib/utils";

interface RetroSkeletonProps {
  className?: string;
}

export function RetroSkeleton({ className }: RetroSkeletonProps) {
  return (
    <div
      className={cn(
        "border-2 border-black bg-neutral-200 shadow-[4px_4px_0px_0px_#000] animate-pulse",
        className,
      )}
    />
  );
}
