"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
}

export function LoadingSpinner({
  size = "md",
  variant = "primary",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  const variantClasses = {
    primary: "border-black border-t-transparent",
    secondary: "border-yellow-400 border-t-transparent",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({
  message = "Loading...",
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/20 backdrop-blur-sm">
      <div className="bg-white border-2 border-black shadow-[8px_8px_0_#0a0a0a] p-8 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-lg font-bold uppercase tracking-tight">{message}</p>
      </div>
    </div>
  );
}

interface InlineLoaderProps {
  text?: string;
}

export function InlineLoader({ text = "Loading" }: InlineLoaderProps) {
  return (
    <div className="flex items-center gap-3">
      <LoadingSpinner size="sm" />
      <span className="text-sm font-semibold uppercase tracking-wide">
        {text}
      </span>
    </div>
  );
}
