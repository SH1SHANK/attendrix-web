import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-stone-200/80 border-2 border-transparent mix-blend-multiply", // Base elegant skeleton
        className,
      )}
      {...props}
    />
  );
}

function RetroSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse bg-neutral-200 border-2 border-black shadow-[4px_4px_0px_0px_#000] rounded-none",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton, RetroSkeleton };
