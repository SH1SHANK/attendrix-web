import type { RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type MagneticOptions = {
  strength?: number;
  restDuration?: number;
  disableBelow?: number;
};

type WiggleOptions = {
  rotation?: number;
};

/**
 * Magnetic hover with quick GSAP setters. Disabled on small screens by default.
 */
export function useMagneticHover(
  ref: RefObject<HTMLElement | null>,
  {
    strength = 14,
    restDuration = 0.25,
    disableBelow = 768,
  }: MagneticOptions = {},
) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return; // Safety: exit early if ref is null
      if (typeof window !== "undefined") {
        const prefersReduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (prefersReduced) return;
        if (window.matchMedia("(pointer: coarse)").matches) return;
      }

      const mm = gsap.matchMedia();

      mm.add(`(min-width: ${disableBelow}px)`, () => {
        // Verify element still exists before creating quickTo functions
        if (!el || !el.isConnected) return;

        const xTo = gsap.quickTo(el, "x", {
          duration: 0.4,
          ease: "power3.out",
        });
        const yTo = gsap.quickTo(el, "y", {
          duration: 0.4,
          ease: "power3.out",
        });
        const rTo = gsap.quickTo(el, "rotate", {
          duration: 0.5,
          ease: "power2.out",
        });

        const handleMove = (event: PointerEvent) => {
          if (!el.isConnected) return; // Safety: element removed from DOM
          const bounds = el.getBoundingClientRect();
          const relX = event.clientX - (bounds.left + bounds.width / 2);
          const relY = event.clientY - (bounds.top + bounds.height / 2);

          xTo(relX / strength);
          yTo(relY / strength);
          rTo(relX / (strength * 2));
        };

        const reset = () => {
          xTo(0);
          yTo(0);
          rTo(0);
        };

        el.addEventListener("pointermove", handleMove);
        el.addEventListener("pointerleave", reset);

        return () => {
          el.removeEventListener("pointermove", handleMove);
          el.removeEventListener("pointerleave", reset);
          if (el.isConnected) {
            gsap.to(el, { x: 0, y: 0, rotate: 0, duration: restDuration });
          }
        };
      });

      return () => mm.revert();
    },
    { dependencies: [strength, restDuration, disableBelow] },
  );
}

/**
 * Quick wiggle on hover for primary CTAs.
 */
export function useWiggleOnHover(
  ref: RefObject<HTMLElement | null>,
  { rotation = 1.5 }: WiggleOptions = {},
) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return; // Safety: exit early if ref is null
      if (typeof window !== "undefined") {
        const prefersReduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (prefersReduced) return;
        if (window.matchMedia("(pointer: coarse)").matches) return;
      }

      const shake = () => {
        if (!el.isConnected) return; // Safety: element removed from DOM
        gsap.fromTo(
          el,
          { rotate: 0 },
          {
            keyframes: [
              { rotate: rotation, x: -1 },
              { rotate: -rotation, x: 1 },
              { rotate: 0, x: 0 },
            ],
            duration: 0.35,
            ease: "sine.inOut",
          },
        );
      };

      el.addEventListener("pointerenter", shake);

      return () => {
        el.removeEventListener("pointerenter", shake);
        if (el.isConnected) {
          gsap.to(el, { rotate: 0, x: 0, duration: 0.2 });
        }
      };
    },
    { dependencies: [rotation] },
  );
}
