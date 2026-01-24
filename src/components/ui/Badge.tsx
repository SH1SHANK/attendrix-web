import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import React from "react";

const badgeVariants = cva(
  "inline-flex items-center border-2 border-black font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-white text-black shadow-neo",
        main: "bg-main text-black shadow-neo",
        rose: "bg-[#ff4d79] text-white shadow-neo", // Specific "Most Popular" brand color
        dark: "bg-dark text-white shadow-neo",
        outline: "text-foreground shadow-none hover:bg-black hover:text-white",
      },
      size: {
        default: "px-3 py-1 text-xs",
        lg: "px-4 py-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
