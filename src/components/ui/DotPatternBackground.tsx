"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
}

export default function DotPatternBackground({
  className,
  dotColor = "#a3a3a3",
}: {
  className?: string;
  dotColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const ripplesRef = useRef<Ripple[]>([]);
  const timeRef = useRef(0);
  const dotsRef = useRef<
    Array<{
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      phase: number;
    }>
  >([]);
  const dprRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      alpha: true,
      // desynchronized can cause flickering on some setups, disabled for stability
      desynchronized: false,
    });
    if (!ctx) return;

    // Configuration
    const config = {
      dotSpacing: 24,
      dotRadius: 1,
      baseOpacity: 0.3,
      waveAmplitude: 1.5,
      waveSpeed: 0.006,
      rippleMaxRadius: 150,
      rippleSpeed: 2.5,
    };

    // Initialize canvas based on container
    const initCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      dprRef.current = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Set canvas size
      canvas.width = width * dprRef.current;
      canvas.height = height * dprRef.current;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      generateDots(width, height);
    };

    // Generate dot grid
    const generateDots = (width: number, height: number) => {
      dotsRef.current = [];

      // Add extra padding to ensure full coverage
      const padding = config.dotSpacing * 2;

      for (let x = -padding; x < width + padding; x += config.dotSpacing) {
        for (let y = -padding; y < height + padding; y += config.dotSpacing) {
          dotsRef.current.push({
            x,
            y,
            baseX: x,
            baseY: y,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    // Initial setup
    initCanvas();

    // Resize Observer Pattern
    const resizeObserver = new ResizeObserver(() => {
      initCanvas();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Handle interactions
    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      let clientX: number, clientY: number;

      if (e instanceof MouseEvent) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        const touch = e.touches[0] || e.changedTouches[0];
        if (!touch) return;
        clientX = touch.clientX;
        clientY = touch.clientY;
      }

      // Check if interaction is within bounds
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        // Calculate position relative to the local container
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ripplesRef.current.push({
          x,
          y,
          radius: 0,
          maxRadius: config.rippleMaxRadius,
          opacity: 1,
          speed: config.rippleSpeed,
        });

        if (ripplesRef.current.length > 5) {
          ripplesRef.current.shift();
        }
      }
    };

    // Event listeners attached to window to catch clicks through content
    window.addEventListener("click", handleInteraction);
    // Use passive listener for touch
    window.addEventListener("touchstart", handleInteraction, { passive: true });

    // Wave calculation
    const calculateWave = (
      x: number,
      y: number,
      time: number,
      phase: number,
    ): number => {
      return (
        Math.sin(x * 0.015 + time + phase) *
        Math.cos(y * 0.015 + time * 0.8 + phase) *
        config.waveAmplitude
      );
    };

    // Animation loop
    let lastFrameTime = 0;
    const targetFrameTime = 1000 / 60; // Cap at ~60fps

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTime;

      // Throttle FPS
      if (deltaTime < targetFrameTime) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      lastFrameTime = currentTime - (deltaTime % targetFrameTime);
      timeRef.current += config.waveSpeed;

      const time = timeRef.current;
      const dots = dotsRef.current;
      const ripples = ripplesRef.current;
      const dpr = dprRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(dpr, dpr);

      // Draw ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        if (!ripple) continue;
        ripple.radius += ripple.speed;
        ripple.opacity = 1 - ripple.radius / ripple.maxRadius;

        if (ripple.opacity <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        // Use standard stroke color/style
        ctx.strokeStyle = `rgba(163, 163, 163, ${ripple.opacity * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw dots
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        if (!dot) continue;

        const wave = calculateWave(dot.baseX, dot.baseY, time, dot.phase);
        dot.x = dot.baseX + wave;
        dot.y = dot.baseY + wave;

        const pulse = (Math.sin(time * 2 + dot.phase) + 1) * 0.04;
        let opacity = config.baseOpacity + pulse;
        let radius = config.dotRadius;

        // Interaction logic
        for (const ripple of ripples) {
          const dx = ripple.x - dot.baseX;
          const dy = ripple.y - dot.baseY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const rippleThickness = 25;
          const distanceFromRipple = Math.abs(distance - ripple.radius);

          if (distanceFromRipple < rippleThickness) {
            const influence =
              (1 - distanceFromRipple / rippleThickness) * ripple.opacity;

            const angle = Math.atan2(dy, dx);
            const pushStrength = influence * 6;
            dot.x +=
              Math.cos(angle) *
              pushStrength *
              (distance < ripple.radius ? -1 : 1);
            dot.y +=
              Math.sin(angle) *
              pushStrength *
              (distance < ripple.radius ? -1 : 1);

            opacity = Math.min(0.8, opacity + influence * 0.5);
            radius = config.dotRadius + influence * 1.2;
          }
        }

        ctx.fillStyle = dotColor;
        ctx.globalAlpha = opacity; // Use globalAlpha for simplified opacity handling
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset
      }

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [dotColor]); // Re-run if dotColor changes

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "absolute inset-0 -z-10 h-full w-full pointer-events-none",
        className,
      )}
      aria-hidden="true"
    />
  );
}
