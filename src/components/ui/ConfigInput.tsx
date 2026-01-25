import React from "react";
import { cn } from "@/lib/utils";

interface ConfigInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const ConfigInput = React.forwardRef<HTMLInputElement, ConfigInputProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-bold uppercase tracking-wider text-neutral-600">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full border-2 border-black bg-white p-3 font-bold text-black outline-none transition-all placeholder:text-neutral-400 focus:bg-yellow-50 focus:ring-0 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

ConfigInput.displayName = "ConfigInput";
