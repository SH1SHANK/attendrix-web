"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad"> {
  containerClassName?: string;
  showSkeleton?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  showSkeleton = true,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Skeleton loader */}
      {isLoading && showSkeleton && (
        <div className="absolute inset-0 bg-stone-200 animate-pulse" />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-stone-100 border-2 border-black flex items-center justify-center">
          <p className="text-sm font-semibold text-stone-600">Failed to load</p>
        </div>
      )}

      {/* Actual image */}
      <Image
        src={src}
        alt={alt}
        className={cn(
          "transition-opacity duration-500",
          isLoading ? "opacity-0" : "opacity-100",
          className,
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
