"use client";

import { useRef } from "react";
import { useInView } from "@/hooks/useInView";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "lift" | "scale" | "slide";
}

export function AnimatedCard({
  children,
  className = "",
  delay = 0,
  variant = "lift",
}: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { threshold: 0.1 });

  const variants = {
    lift: "hover:hover-lift",
    scale: "hover:scale-105",
    slide: "hover:translate-x-1",
  };

  const animationClasses = isInView
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-10";

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-500 ease-smooth ${animationClasses} ${variants[variant]} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        transform: isInView ? "translateY(0)" : "translateY(40px)",
      }}
    >
      {children}
    </div>
  );
}

interface FadeInSectionProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}

export function FadeInSection({
  children,
  className = "",
  direction = "up",
}: FadeInSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { threshold: 0.1 });

  const directionClasses = {
    up: isInView ? "translate-y-0" : "translate-y-10",
    down: isInView ? "translate-y-0" : "-translate-y-10",
    left: isInView ? "translate-x-0" : "translate-x-10",
    right: isInView ? "translate-x-0" : "-translate-x-10",
  };

  return (
    <div
      ref={sectionRef}
      className={`transition-all duration-700 ease-smooth ${
        isInView ? "opacity-100" : "opacity-0"
      } ${directionClasses[direction]} ${className}`}
    >
      {children}
    </div>
  );
}
