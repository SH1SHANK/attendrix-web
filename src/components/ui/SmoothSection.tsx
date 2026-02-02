"use client";

import { ReactNode, useRef } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

interface SmoothSectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  animate?: boolean;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

/**
 * Wrapper component that adds smooth scroll-triggered animations to sections
 * Uses IntersectionObserver for performance
 */
export function SmoothSection({
  children,
  id,
  className,
  animate = true,
  delay = 0,
  direction = "up",
}: SmoothSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { threshold: 0.1, triggerOnce: true });

  const directionClasses = {
    up: "translate-y-10",
    down: "-translate-y-10",
    left: "translate-x-10",
    right: "-translate-x-10",
  };

  const animationClass = animate
    ? isInView
      ? "opacity-100 translate-x-0 translate-y-0"
      : `opacity-0 ${directionClasses[direction]}`
    : "";

  return (
    <section
      ref={sectionRef}
      id={id}
      className={cn(
        "transition-all duration-700 ease-smooth",
        animationClass,
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}
