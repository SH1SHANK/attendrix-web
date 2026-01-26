import type { RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type HeroIntroConfig = {
  containerRef: RefObject<HTMLElement | null>;
  attendanceRef: RefObject<HTMLElement | null>;
  reimaginedRef: RefObject<HTMLElement | null>;
  brushRef?: RefObject<HTMLElement | null>;
  staggerSelector?: string;
  isActive?: boolean;
};

const defaultStaggerSelector = "[data-hero-stagger]";

/**
 * Orchestrates the hero headline slam + brush stroke intro.
 * Heavy desktop motion, simplified fade/slide on mobile via matchMedia.
 */
export function useHeroIntro({
  containerRef,
  attendanceRef,
  reimaginedRef,
  brushRef,
  staggerSelector = defaultStaggerSelector,
  isActive = true,
}: HeroIntroConfig) {
  useGSAP(
    () => {
      if (!isActive) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

        if (attendanceRef.current) {
          tl.fromTo(
            attendanceRef.current,
            { yPercent: -120, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 1.1 },
          );
        }

        if (reimaginedRef.current) {
          tl.fromTo(
            reimaginedRef.current,
            { yPercent: 120, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 1.1 },
            "<0.05",
          );
        }

        if (brushRef?.current) {
          tl.fromTo(
            brushRef.current,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.7,
              ease: "power2.out",
              transformOrigin: "0% 50%",
            },
            "<0.1",
          );
        }

        const staggerTargets =
          containerRef.current?.querySelectorAll(staggerSelector);

        if (staggerTargets?.length) {
          tl.from(
            staggerTargets,
            {
              y: 28,
              opacity: 0,
              stagger: 0.08,
              duration: 0.7,
              ease: "power3.out",
            },
            "-=0.2",
          );
        }
      });

      mm.add("(max-width: 767px)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        if (attendanceRef.current) {
          tl.fromTo(
            attendanceRef.current,
            { y: -30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6 },
          );
        }

        if (reimaginedRef.current) {
          tl.fromTo(
            reimaginedRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6 },
            "<0.05",
          );
        }

        if (brushRef?.current) {
          tl.fromTo(
            brushRef.current,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.5,
              ease: "power1.out",
              transformOrigin: "0% 50%",
            },
            "<0.1",
          );
        }

        const staggerTargets =
          containerRef.current?.querySelectorAll(staggerSelector);

        if (staggerTargets?.length) {
          tl.from(
            staggerTargets,
            {
              y: 18,
              opacity: 0,
              stagger: 0.08,
              duration: 0.55,
              ease: "power2.out",
            },
            "-=0.15",
          );
        }
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [isActive, staggerSelector] },
  );
}

/**
 * Generic staggered reveal helper for text/lines.
 */
type StaggerConfig = {
  containerRef: RefObject<HTMLElement | null>;
  targetSelector: string;
  offset?: number;
  ease?: string;
};

export function useStaggerReveal({
  containerRef,
  targetSelector,
  offset = 24,
  ease = "power3.out",
}: StaggerConfig) {
  useGSAP(
    () => {
      const targets = containerRef.current?.querySelectorAll(targetSelector);
      if (!targets?.length) return;

      gsap.from(targets, {
        y: offset,
        opacity: 0,
        stagger: 0.06,
        duration: 0.7,
        ease,
      });
    },
    { scope: containerRef, dependencies: [targetSelector, offset, ease] },
  );
}
