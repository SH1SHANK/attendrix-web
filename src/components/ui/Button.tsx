import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React, { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";

// Neo-Brutalist Button Variants
export const buttonVariants = cva(
  "inline-flex items-center justify-center font-bold uppercase tracking-wide transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black border-2 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] active:scale-95",
        main: "bg-[#FFD02F] text-black border-2 border-black shadow-neo hover:bg-[#E5B800] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] active:scale-95",
        yellow:
          "bg-yellow-400 text-black border-2 border-black shadow-neo hover:bg-yellow-500 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] active:scale-95",
        ghost: "bg-transparent text-black hover:bg-black/5",
        outline:
          "border-2 border-black bg-transparent hover:bg-black hover:text-white",
        destructive:
          "bg-destructive text-white border-2 border-black shadow-neo hover:bg-red-600",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        default: "h-12 px-6 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
