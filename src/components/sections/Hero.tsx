"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  type Variants,
  useMotionValue,
  useTransform,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { Download, BookOpen } from "lucide-react";
import { HeroHighlight } from "@/components/ui/hero-highlight";

interface HeroProps {
  isVisible?: boolean;
}

// Animation variants for staggered entrance (typed properly)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const badgeVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

const attendanceVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const reimaginedVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -6 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: -2,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 12,
      mass: 1.2,
    },
  },
};

const descriptionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      delay: 0.1,
    },
  },
};

const buttonContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

// ============================================
// OPTIMIZED PROXIMITY EFFECT COMPONENTS
// ============================================

// ProximityWord: A single word that responds to cursor proximity via transforms
function ProximityWord({
  word,
  mouseX,
  mouseY,
}: {
  word: string;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [center, setCenter] = useState({ x: 0, y: 0 });

  // Measure position once on mount (and on resize for safety)
  useEffect(() => {
    const measure = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setCenter({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Map distance to visual properties
  // Distance range: 0px (close) to 200px (far)
  const distance = useTransform([mouseX, mouseY], ([x, y]: number[]) => {
    const dx = x - center.x;
    const dy = y - center.y;
    return Math.sqrt(dx * dx + dy * dy);
  });

  // COLOR-ONLY effect for guaranteed visibility (no opacity changes)
  // Base state: Neutral-500 (readable gray), Hover state: Black (highlighted)
  const color = useTransform(distance, [0, 150], ["#0a0a0a", "#737373"]); // Black to Neutral-500

  return (
    <motion.span
      ref={ref}
      style={{ color }}
      className="inline-block cursor-default select-none transition-colors duration-300"
    >
      {word}
    </motion.span>
  );
}

// ProximityHeading: Container that tracks mouse/touch into MotionValues
function ProximityHeading({ text }: { text: string }) {
  // Initialize far off-screen so text starts at base state
  const mouseX = useMotionValue(-5000);
  const mouseY = useMotionValue(-5000);

  // Smooth out the mouse movement slightly for butter feel
  const smoothX = useSpring(mouseX, { stiffness: 500, damping: 50 });
  const smoothY = useSpring(mouseY, { stiffness: 500, damping: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      mouseX.set(touch.clientX);
      mouseY.set(touch.clientY);
    }
  };

  // Reset mouse position to force all words back to base state
  const resetMousePosition = () => {
    mouseX.set(-5000);
    mouseY.set(-5000);
  };

  const words = text.split(" ");

  return (
    <div
      className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed touch-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={resetMousePosition}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchMove}
      onTouchEnd={resetMousePosition}
      onTouchCancel={resetMousePosition}
    >
      {words.map((word, index) => (
        <ProximityWord
          key={`${word}-${index}`}
          word={word}
          mouseX={smoothX}
          mouseY={smoothY}
        />
      ))}
    </div>
  );
}

// Neo-Bounce button component with tactile feel
function NeoButton({
  children,
  href,
  variant = "primary",
  ariaLabel,
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "secondary";
  ariaLabel: string;
}) {
  const isPrimary = variant === "primary";

  return (
    <motion.a
      href={href}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-3 ${
        isPrimary ? "bg-[#FFD02F]" : "bg-white"
      } text-black border-2 border-black font-bold uppercase tracking-wide h-14 px-8 text-base cursor-pointer select-none`}
      variants={buttonVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        y: -4,
        x: -2,
        boxShadow: "8px 8px 0px 0px #000",
      }}
      whileTap={{
        y: 2,
        x: 2,
        boxShadow: "0px 0px 0px 0px #000",
        scale: 0.98,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 15,
      }}
      style={{
        boxShadow: "4px 4px 0px 0px #000",
      }}
    >
      {children}
    </motion.a>
  );
}

export default function Hero({ isVisible = false }: HeroProps) {
  const [isReimaginedHovered, setIsReimaginedHovered] = useState(false);

  const subheadingText =
    "Subject-wise tracking for NITC students. Policy-compliant calculations. Know exactly how many classes you can skip—per subject.";

  return (
    <HeroHighlight
      containerClassName="min-h-screen w-screen border-b-2 border-black"
      className="w-full h-full"
    >
      <motion.section
        id="hero"
        className="relative w-full min-h-screen flex flex-col items-center justify-center py-16 md:py-0"
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={containerVariants}
      >
        {/* Inner Content Wrapper - Tighter vertical gap */}
        <div className="w-full max-w-7xl px-4 md:px-8 flex flex-col items-center text-center z-10">
          {/* Announcement Badge */}
          <motion.div
            variants={badgeVariants}
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer"
          >
            <div
              className="inline-flex items-center gap-2.5 bg-neutral-900 text-white px-4 py-1.5 border-2 border-black"
              style={{
                boxShadow: "3px 3px 0px 0px #000000",
              }}
            >
              {/* Pulsing Green Dot */}
              <span
                className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                aria-hidden="true"
              />
              <span className="text-xs font-bold uppercase tracking-wider">
                Introducing Attendrix v1.3.2
              </span>
            </div>
          </motion.div>

          {/* Headline Group - Logo Block */}
          <div className="flex flex-col items-center mt-4">
            <h1 className="flex flex-col items-center">
              {/* ATTENDANCE - Base layer with tight leading */}
              <motion.span
                variants={attendanceVariants}
                className="text-6xl sm:text-8xl lg:text-[8rem] font-black tracking-tighter text-black leading-[0.85] select-none"
              >
                ATTENDANCE
              </motion.span>

              {/* REIMAGINED - Sticker Box overlapping ATTENDANCE */}
              <motion.div
                variants={reimaginedVariants}
                className="relative z-10 inline-block px-6 sm:px-8 py-2 sm:py-3 -mt-4 sm:-mt-6 cursor-pointer"
                onMouseEnter={() => setIsReimaginedHovered(true)}
                onMouseLeave={() => setIsReimaginedHovered(false)}
                animate={{
                  rotate: isReimaginedHovered ? -6 : -2,
                  boxShadow: isReimaginedHovered
                    ? "10px 10px 0px 0px #000000"
                    : "6px 6px 0px 0px #000000",
                  y: isReimaginedHovered ? -4 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                }}
                style={{
                  backgroundColor: "#ffffff",
                  border: "3px solid black",
                  boxShadow: "6px 6px 0px 0px #000000",
                }}
              >
                <span className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-black leading-none select-none">
                  REIMAGINED
                </span>
              </motion.div>
            </h1>
          </div>

          {/* Supporting Paragraph with Proximity Effect */}
          <motion.div variants={descriptionVariants} className="mt-8">
            <ProximityHeading text={subheadingText} />
          </motion.div>

          {/* CTA Button Group */}
          <motion.div
            variants={buttonContainerVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full mt-10"
          >
            {/* Primary CTA - Download APK (YELLOW) */}
            <NeoButton
              href="#"
              variant="primary"
              ariaLabel="Download the Attendrix APK file"
            >
              DOWNLOAD APK
              <Download className="w-5 h-5" aria-hidden="true" />
            </NeoButton>

            {/* Secondary CTA - Read Docs (WHITE) */}
            <NeoButton
              href="#docs"
              variant="secondary"
              ariaLabel="Read the documentation"
            >
              READ THE DOCS
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </NeoButton>
          </motion.div>
        </div>
      </motion.section>
    </HeroHighlight>
  );
}
