"use client";

import { motion } from "framer-motion";
import { UserPlus, Zap, Trophy, ArrowRight, ArrowDown } from "lucide-react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

const arrowVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

// Step data
const steps = [
  {
    number: "01",
    title: "Instant Onboarding",
    description:
      "Log in via Firebase. Select your Batch & Semester. We auto-fetch your exact timetable and electives from Supabase. No manual entry.",
    icon: UserPlus,
  },
  {
    number: "02",
    title: "Mark & Sync",
    description:
      "Tap 'Mark Attendance'. Our RPC functions verify your location and update the central ledger instantly. Zero latency, 100% accuracy.",
    icon: Zap,
  },
  {
    number: "03",
    title: "Level Up Your Stats",
    description:
      "Every class attended feeds the Amplix Engine. Earn streaks, unlock badges, and compete on the leaderboard. Attendance is now a game.",
    icon: Trophy,
  },
];

// Step Card Component
function StepCard({ step }: { step: (typeof steps)[0] }) {
  const Icon = step.icon;

  return (
    <motion.div
      className="relative z-10 bg-white border-2 border-black p-6 md:p-8 h-full transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_#000]"
      style={{ boxShadow: "8px 8px 0px 0px #000000" }}
      variants={cardVariants}
    >
      {/* Header Row - Number Left, Icon Right */}
      <div className="flex items-start justify-between mb-6">
        {/* Number Badge */}
        <div className="w-12 h-12 bg-[#FFD02F] border-2 border-black flex items-center justify-center">
          <span className="font-black text-xl text-black">{step.number}</span>
        </div>
        {/* Icon */}
        <div className="w-10 h-10 border-2 border-black flex items-center justify-center">
          <Icon className="w-5 h-5 text-black" strokeWidth={2.5} />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black mb-3">
        {step.title}
      </h3>
      <p className="text-neutral-600 font-medium leading-relaxed text-sm md:text-base">
        {step.description}
      </p>
    </motion.div>
  );
}

// Arrow Connector Component
function ArrowConnector({
  direction = "right",
}: {
  direction?: "right" | "down";
}) {
  return (
    <motion.div
      className="relative z-20 bg-black flex items-center justify-center w-10 h-10 md:w-12 md:h-12 shrink-0"
      variants={arrowVariants}
    >
      {direction === "right" ? (
        <ArrowRight
          className="w-5 h-5 md:w-6 md:h-6 text-white"
          strokeWidth={3}
        />
      ) : (
        <ArrowDown
          className="w-5 h-5 md:w-6 md:h-6 text-white"
          strokeWidth={3}
        />
      )}
    </motion.div>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#fffdf5] py-20 md:py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-1.5 border-2 border-black mb-6 shadow-[3px_3px_0_#000]">
              <span className="text-xs font-bold uppercase tracking-wider">
                Simple Process
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-black mb-4">
              How It Works
            </h2>
            <p className="text-base md:text-lg text-neutral-600 font-medium max-w-2xl mx-auto">
              Three simple steps to never miss an attendance again.
            </p>
          </motion.div>
        </div>

        {/* Desktop Layout - Horizontal Pipeline */}
        <motion.div
          className="hidden md:block relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* The Dotted Pipeline Line (Behind Everything) */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-0 px-8">
            <div className="border-t-4 border-black border-dashed" />
          </div>

          {/* Cards + Arrows Container */}
          <div className="relative z-10 flex items-stretch gap-4">
            {/* Card 1 */}
            <div className="flex-1">
              <StepCard step={steps[0]!} />
            </div>

            {/* Arrow 1 */}
            <div className="flex items-center justify-center">
              <ArrowConnector direction="right" />
            </div>

            {/* Card 2 */}
            <div className="flex-1">
              <StepCard step={steps[1]!} />
            </div>

            {/* Arrow 2 */}
            <div className="flex items-center justify-center">
              <ArrowConnector direction="right" />
            </div>

            {/* Card 3 */}
            <div className="flex-1">
              <StepCard step={steps[2]!} />
            </div>
          </div>
        </motion.div>

        {/* Mobile Layout - Vertical Pipeline */}
        <motion.div
          className="md:hidden relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* The Dotted Pipeline Line (Behind Everything - Vertical) */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-0 py-8">
            <div className="h-full border-l-4 border-black border-dashed" />
          </div>

          {/* Cards + Arrows Container */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Card 1 */}
            <div className="w-full">
              <StepCard step={steps[0]!} />
            </div>

            {/* Arrow 1 */}
            <ArrowConnector direction="down" />

            {/* Card 2 */}
            <div className="w-full">
              <StepCard step={steps[1]!} />
            </div>

            {/* Arrow 2 */}
            <ArrowConnector direction="down" />

            {/* Card 3 */}
            <div className="w-full">
              <StepCard step={steps[2]!} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
