"use client";

import { ButtonHTMLAttributes, forwardRef, useRef, MouseEvent } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  ripple?: boolean;
}

const NeoBrutalButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      ripple = true,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (ripple && buttonRef.current) {
        const button = buttonRef.current;
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement("span");
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;

        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = `${e.clientX - rect.left - radius}px`;
        ripple.style.top = `${e.clientY - rect.top - radius}px`;
        ripple.classList.add("ripple");

        const existingRipple = button.getElementsByClassName("ripple")[0];
        if (existingRipple) {
          existingRipple.remove();
        }

        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
      }

      onClick?.(e);
    };

    const variants = {
      primary:
        "bg-yellow-400 text-black border-black hover:shadow-[8px_8px_0_#0a0a0a]",
      secondary:
        "bg-white text-black border-black hover:shadow-[8px_8px_0_#0a0a0a]",
      outline: "bg-transparent text-black border-black hover:bg-stone-50",
      ghost: "bg-transparent text-black border-transparent hover:bg-stone-100",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <button
        ref={(node) => {
          if (buttonRef) {
            (
              buttonRef as React.MutableRefObject<HTMLButtonElement | null>
            ).current = node;
          }
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          "relative overflow-hidden",
          "font-bold uppercase tracking-tight",
          "border-2 shadow-[6px_6px_0_#0a0a0a]",
          "transition-all duration-300 ease-smooth",
          "hover:-translate-x-0.75 hover:-translate-y-0.75",
          "active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#0a0a0a]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0",
          "touch-feedback tap-target",
          variants[variant],
          sizes[size],
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  },
);

NeoBrutalButton.displayName = "NeoBrutalButton";

export { NeoBrutalButton };
