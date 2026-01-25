"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Check, Lock, Sparkles, Award } from "lucide-react";

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// ============================================================================
// Sub-Components
// ============================================================================

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] cursor-default transition-all"
      whileHover={{ y: -4, boxShadow: "6px 6px 0px 0px #000" }}
    >
      <span className="font-mono font-black text-2xl md:text-3xl block">
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </span>
    </motion.div>
  );
}

function QuestItem({
  name,
  progress,
  total,
  status,
}: {
  name: string;
  progress?: number;
  total?: number;
  status: "progress" | "complete" | "locked";
}) {
  return (
    <motion.div
      className="flex items-center justify-between py-2.5 px-2 border-b-2 border-dashed border-neutral-300 last:border-b-0 cursor-pointer hover:bg-neutral-100 transition-colors"
      whileHover={{ x: 4 }}
    >
      <span className="font-mono text-sm font-bold uppercase">{name}</span>

      {status === "progress" &&
        progress !== undefined &&
        total !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-4 bg-neutral-100 border-2 border-black flex overflow-hidden">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 border-r border-black last:border-r-0 ${
                    i < progress ? "bg-black" : "bg-white"
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] text-neutral-500">
              {progress}/{total}
            </span>
          </div>
        )}

      {status === "complete" && (
        <div className="w-6 h-6 bg-green-500 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
      )}

      {status === "locked" && (
        <div className="w-6 h-6 bg-neutral-200 border-2 border-black flex items-center justify-center">
          <Lock className="w-3 h-3 text-neutral-400" />
        </div>
      )}
    </motion.div>
  );
}

function CharacterSheet() {
  const xpCurrent = 2200;
  const xpRequired = 2500;
  const xpPercentage = (xpCurrent / xpRequired) * 100;

  return (
    <motion.div
      className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_#000] p-0 overflow-hidden"
      whileHover={{ rotate: 1, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Header Strip */}
      <div className="bg-black px-5 py-3 flex items-center justify-between">
        <span className="font-mono text-xs text-white uppercase tracking-wider font-bold">
          Character Sheet
        </span>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FFD02F]" />
          <span className="font-mono text-[10px] text-[#FFD02F] font-bold">
            AMPLIX v2.0
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Identity Row */}
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 bg-[#8B5CF6] border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
            <span className="font-black text-3xl text-white">AK</span>
          </div>

          {/* Name & Rank */}
          <div>
            <h4 className="font-black text-2xl uppercase tracking-tight leading-none mb-2">
              Arjun Kumar
            </h4>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8B5CF6] border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              <span className="font-mono text-xs font-black text-white uppercase tracking-wide">
                One Star Mage
              </span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div>
          <div className="flex justify-between mb-2 items-end">
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
              Level 5 Progress
            </span>
            <span className="font-mono text-xs font-bold bg-neutral-100 px-2 py-0.5 border border-black">
              {xpCurrent.toLocaleString()} / {xpRequired.toLocaleString()} XP
            </span>
          </div>
          <div className="h-8 border-[3px] border-black bg-white overflow-hidden relative">
            {/* Striped Fill Animation */}
            <motion.div
              className="h-full border-r-[3px] border-black"
              style={{
                width: `${xpPercentage}%`,
                backgroundSize: "28px 28px",
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  #FFD02F,
                  #FFD02F 10px,
                  #2D2D2D 10px,
                  #2D2D2D 12px
                )`,
              }}
              initial={{ width: 0 }}
              whileInView={{ width: `${xpPercentage}%` }}
              animate={{
                backgroundPosition: ["0px 0px", "28px 0px"],
              }}
              transition={{
                width: { duration: 1, delay: 0.3, ease: "easeOut" },
                backgroundPosition: {
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
              viewport={{ once: true }}
            />
          </div>
          <p className="font-mono text-[10px] text-neutral-400 mt-1.5 text-right uppercase tracking-wide">
            {xpRequired - xpCurrent} XP to Level 6
          </p>
        </div>

        {/* Active Quests */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4" strokeWidth={2.5} />
            <span className="font-mono text-xs uppercase tracking-wider font-bold">
              Active Quests
            </span>
          </div>
          <div className="border-2 border-black p-2 bg-neutral-50">
            <QuestItem
              name="Busy Bee"
              progress={4}
              total={6}
              status="progress"
            />
            <QuestItem name="Early Bird" status="complete" />
            <QuestItem name="Streak God" status="locked" />
          </div>
        </div>

        {/* Footer - Streak */}
        <div className="flex items-center justify-center gap-3 p-4 bg-[#FFE8CC] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Flame className="w-7 h-7 text-[#FF4500]" fill="#FF4500" />
          </motion.div>
          <div>
            <span className="font-mono font-black text-2xl block leading-none">
              14 Days
            </span>
            <span className="font-mono text-[10px] text-[#FF4500] font-bold uppercase tracking-widest block">
              Current Streak
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Section
// ============================================================================

export default function Gamification() {
  return (
    <section
      id="gamification"
      className="relative bg-[#FDFBF7] py-20 md:py-28 px-4 overflow-hidden"
    >
      {/* Dot Pattern Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Left Column - Content */}
          <motion.div variants={itemVariants}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1.5 border-2 border-black mb-6 shadow-[3px_3px_0_#FFD02F]">
              <Sparkles className="w-4 h-4" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest">
                The Amplix Engine v2.0
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-black mb-6 leading-[0.9]">
              Attendance is no longer a chore.
              <br />
              <span className="text-[#FFD02F]">It&apos;s an RPG GAME.</span>
            </h2>

            {/* Body */}
            <div className="text-lg text-neutral-600 font-medium mb-8 max-w-lg leading-relaxed space-y-4">
              <p>
                Stop passive tracking. Amplix uses a{" "}
                <span className="font-bold text-black relative inline-block px-1">
                  <span className="absolute inset-0 bg-yellow-200 -rotate-1 skew-x-3 opacity-50"></span>
                  <span className="relative z-10">
                    Quadratic Difficulty Curve
                  </span>
                </span>{" "}
                <span className="font-mono text-sm bg-neutral-100 px-1.5 py-0.5 border border-neutral-300">
                  100 × Level²
                </span>{" "}
                to challenge your consistency.
              </p>
              <p>
                Earn <span className="font-bold text-black">XP</span> for every
                check-in, climb from <span className="font-bold">Novice</span>{" "}
                to <span className="font-bold">Master Mage</span>, and complete
                dynamic quests like{" "}
                <span className="font-bold text-purple-700 bg-purple-100 px-1 border border-purple-200">
                  Busy Bee
                </span>{" "}
                and{" "}
                <span className="font-bold text-orange-700 bg-orange-100 px-1 border border-orange-200">
                  Streak God
                </span>
                .
              </p>
              <p>
                <span className="font-bold text-black">System Status:</span>{" "}
                <span className="text-red-600 font-bold relative inline-block">
                  Anti-Cheat Protocol Active.
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600"></span>
                </span>{" "}
                Our rollback engine automatically revokes farmed XP if you
                delete attendance.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button className="px-6 py-3 bg-[#FF6B6B] text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0 active:shadow-none font-mono font-bold transition-all uppercase tracking-tight">
                Explore the Engine
              </button>
              <Link
                href="/docs/amplix"
                className="group px-6 py-3 bg-white border-2 border-black hover:bg-[#FFD02F] font-mono font-bold transition-all flex items-center gap-2 uppercase tracking-tight"
              >
                View Challenges
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            </div>

            {/* Stats Grid */}
            <motion.div
              className="grid grid-cols-3 gap-4"
              variants={itemVariants}
            >
              <StatBox value="12" label="Ranks to Unlock" />
              <StatBox value="Anti-Cheat" label="Rollback Engine" />
              <StatBox value="Daily" label="XP Challenges" />
            </motion.div>
          </motion.div>

          {/* Right Column - Character Sheet */}
          <motion.div variants={itemVariants}>
            <CharacterSheet />

            {/* Decorative Elements */}
            <div className="flex items-center gap-4 mt-6 justify-center">
              <motion.div
                className="w-4 h-4 bg-[#FFD02F] border-2 border-black"
                animate={{ rotate: [0, 90, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                Powered by Amplix Engine
              </span>
              <motion.div
                className="w-4 h-4 bg-[#8B5CF6] border-2 border-black"
                animate={{ rotate: [0, -90, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
