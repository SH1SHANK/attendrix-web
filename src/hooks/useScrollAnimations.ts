"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface SmoothScrollOptions {
  duration?: number;
  offset?: number;
  easing?: string;
}

/**
 * Smooth scroll to section with offset for fixed headers
 */
export function useSmoothScroll(options: SmoothScrollOptions = {}) {
  const { duration = 1, offset = 100, easing = "power2.inOut" } = options;

  const scrollToSection = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const targetPosition =
      target.getBoundingClientRect().top + window.pageYOffset - offset;

    gsap.to(window, {
      scrollTo: { y: targetPosition, autoKill: false },
      duration,
      ease: easing,
    });
  };

  return scrollToSection;
}

/**
 * Hook for parallax scroll effects
 */
export function useParallax(
  elementRef: React.RefObject<HTMLElement>,
  speed: number = 0.5,
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Skip parallax on mobile or if reduced motion is preferred
    if (
      window.innerWidth < 768 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + scrolled;

      if (
        scrolled + window.innerHeight > elementTop &&
        scrolled < elementTop + rect.height
      ) {
        const yPos = -(scrolled - elementTop) * speed;
        gsap.set(element, { y: yPos, force3D: true });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [elementRef, speed]);
}

/**
 * Hook for scroll-triggered animations with IntersectionObserver
 */
export function useScrollReveal(
  elementRef: React.RefObject<HTMLElement>,
  animationConfig: gsap.TweenVars = {},
) {
  const hasAnimated = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasAnimated.current) return;

    // Skip if reduced motion is preferred
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(element, { opacity: 1, y: 0 });
      return;
    }

    const defaultConfig: gsap.TweenVars = {
      opacity: 0,
      y: 50,
      duration: 0.8,
      ease: "power3.out",
      ...animationConfig,
    };

    // Set initial state
    gsap.set(element, { opacity: 0, y: defaultConfig.y });

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !hasAnimated.current) {
          gsap.to(element, {
            opacity: 1,
            y: 0,
            duration: defaultConfig.duration,
            ease: defaultConfig.ease,
            ...animationConfig,
          });
          hasAnimated.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, animationConfig]);
}

/**
 * Hook for staggered children reveal animations
 */
export function useStaggerReveal(
  containerRef: React.RefObject<HTMLElement>,
  childSelector: string = ".stagger-item",
  staggerAmount: number = 0.1,
) {
  const hasAnimated = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || hasAnimated.current) return;

    const children = container.querySelectorAll(childSelector);
    if (!children.length) return;

    // Skip if reduced motion is preferred
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(children, { opacity: 1, y: 0 });
      return;
    }

    // Set initial state
    gsap.set(children, { opacity: 0, y: 30 });

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !hasAnimated.current) {
          gsap.to(children, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: staggerAmount,
            ease: "power2.out",
          });
          hasAnimated.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [containerRef, childSelector, staggerAmount]);
}
