import type { RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ParallaxItem = {
  target: RefObject<HTMLElement>;
  y?: number | string;
  start?: string;
  end?: string;
  scrub?: boolean | number;
};

type ParallaxConfig = {
  triggerRef: RefObject<HTMLElement>;
  items: ParallaxItem[];
  mediaQuery?: string;
  mobileFade?: boolean;
};

/**
 * Parallax helper with ScrollTrigger + matchMedia fallbacks.
 */
export function useScrollParallax({
  triggerRef,
  items,
  mediaQuery = "(min-width: 768px)",
  mobileFade = true,
}: ParallaxConfig) {
  useGSAP(
    () => {
      if (!items.length) return;

      const mm = gsap.matchMedia();

      mm.add(mediaQuery, () => {
        items.forEach((item) => {
          if (!item.target.current || !triggerRef.current) return;

          gsap.fromTo(
            item.target.current,
            { y: 0 },
            {
              y: item.y ?? "-12%",
              ease: "none",
              scrollTrigger: {
                trigger: triggerRef.current,
                start: item.start ?? "top bottom",
                end: item.end ?? "bottom top",
                scrub: item.scrub ?? true,
              },
            },
          );
        });
      });

      if (mobileFade) {
        mm.add("(max-width: 767px)", () => {
          items.forEach((item) => {
            if (!item.target.current || !triggerRef.current) return;

            gsap.from(item.target.current, {
              opacity: 0,
              y: 16,
              ease: "power2.out",
              duration: 0.5,
              scrollTrigger: {
                trigger: triggerRef.current,
                start: "top 85%",
              },
            });
          });
        });
      }

      return () => mm.revert();
    },
    { scope: triggerRef, dependencies: [items, mediaQuery, mobileFade] },
  );
}

type HorizontalPinConfig = {
  containerRef: RefObject<HTMLElement>;
  panelSelector?: string;
  snap?: boolean | number;
  endMultiplier?: number;
};

/**
 * Horizontal pin-and-scroll for character progression / bento galleries.
 */
export function useHorizontalPin({
  containerRef,
  panelSelector = "[data-pin-panel]",
  snap = 1,
  endMultiplier = 1.2,
}: HorizontalPinConfig) {
  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        const panels = gsap.utils.toArray<HTMLElement>(
          panelSelector,
          container,
        );

        if (panels.length < 2) return;

        const totalShift = -100 * (panels.length - 1);
        const endDistance = () => `+=${container.offsetWidth * endMultiplier}`;

        gsap.to(panels, {
          xPercent: totalShift,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            pin: true,
            scrub: 1,
            start: "top top",
            end: endDistance,
            snap: snap ? 1 / (panels.length - 1) : undefined,
          },
        });
      });

      mm.add("(max-width: 767px)", () => {
        const panels = gsap.utils.toArray<HTMLElement>(
          panelSelector,
          container,
        );

        panels.forEach((panel) => {
          gsap.from(panel, {
            opacity: 0,
            y: 20,
            duration: 0.4,
            ease: "power2.out",
            scrollTrigger: {
              trigger: panel,
              start: "top 90%",
            },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [panelSelector, snap, endMultiplier] },
  );
}
