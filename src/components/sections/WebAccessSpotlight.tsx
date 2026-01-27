"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, ExternalLink, Check, Clock, MapPin } from "lucide-react";

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

// ============================================================================
// Mock Dashboard Content
// ============================================================================

function MockTimelineRow({
  code,
  time,
  status,
}: {
  code: string;
  time: string;
  status: "present" | "absent" | "pending";
}) {
  const statusColors = {
    present: "bg-green-400",
    absent: "bg-red-400",
    pending: "bg-neutral-200",
  };

  return (
    <div className="flex items-center justify-between p-2 border-b border-neutral-200 last:border-b-0">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-neutral-100 border border-neutral-300 flex items-center justify-center">
          <Clock className="w-3 h-3 text-neutral-500" />
        </div>
        <div>
          <span className="font-mono text-[10px] font-bold block">{code}</span>
          <span className="font-mono text-[8px] text-neutral-400">{time}</span>
        </div>
      </div>
      <div
        className={`w-5 h-5 border border-black flex items-center justify-center ${statusColors[status]}`}
      >
        {status === "present" && <Check className="w-3 h-3 text-white" />}
        {status === "pending" && (
          <span className="text-[8px] font-mono text-neutral-500">?</span>
        )}
      </div>
    </div>
  );
}

function MockDashboard() {
  return (
    <div className="bg-[#fffdf5] h-full p-3 space-y-3 relative group/dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[9px] text-neutral-500 uppercase">
            Welcome back
          </span>
          <h3 className="font-black text-sm uppercase">Good Morning, User</h3>
        </div>
        <div className="px-2 py-0.5 bg-purple-100 border border-purple-300">
          <span className="font-mono text-[8px] text-purple-700 uppercase">
            Lvl 4
          </span>
        </div>
      </div>

      {/* Next Up Card - PARALLAX EFFECT */}
      <motion.div
        className="p-2.5 bg-[#FFD02F] border-2 border-black shadow-[3px_3px_0px_0px_#000] relative cursor-default transition-all"
        whileHover={{
          y: -2,
          x: -2,
          boxShadow: "5px 5px 0px 0px #000",
        }}
      >
        <span className="font-mono text-[8px] uppercase text-neutral-800 block mb-0.5 font-bold">
          Next Up
        </span>
        <span className="font-bold text-xs block">Thermodynamics II</span>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5 text-black" />
            <span className="font-mono text-[8px] font-bold">in 14 mins</span>
          </div>
          <div className="flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5 text-black" />
            <span className="font-mono text-[8px] font-bold">LH-2</span>
          </div>
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="bg-white border border-neutral-200">
        <div className="px-2 py-1.5 bg-neutral-50 border-b border-neutral-200">
          <span className="font-mono text-[8px] font-bold uppercase text-neutral-500">
            Today&apos;s Classes
          </span>
        </div>
        <MockTimelineRow code="CS301" time="09:00" status="present" />
        <MockTimelineRow code="ME204" time="10:00" status="present" />
        <MockTimelineRow code="THERMO" time="11:00" status="pending" />
      </div>
    </div>
  );
}

// ============================================================================
// Interactive Browser Window
// ============================================================================

function BrowserWindow() {
  return (
    <motion.div
      className="relative perspective-1000 group"
      initial={{ rotateY: -5, rotateX: 5 }}
      whileHover={{ rotateY: 0, rotateX: 0, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.div
        className="bg-[#E5E7EB] border-[3px] border-black shadow-[12px_12px_0px_0px_#000] overflow-hidden relative z-10"
        whileHover={{ boxShadow: "6px 6px 0px 0px #000" }}
        transition={{ duration: 0.2 }}
      >
        {/* Window Chrome */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b-[3px] border-black bg-[#E5E7EB]">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-3 h-3 bg-red-500 border-2 border-black rounded-full cursor-pointer"
            />
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-3 h-3 bg-yellow-400 border-2 border-black rounded-full cursor-pointer"
            />
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="w-3 h-3 bg-green-500 border-2 border-black rounded-full cursor-pointer"
            />
          </div>

          {/* Address Bar */}
          <div className="flex-1 ml-4">
            <div className="bg-white border-2 border-black px-3 py-1 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]">
              <Globe className="w-3 h-3 text-neutral-400" />
              <span className="font-mono text-xs text-neutral-600">
                attendrix.site/app
              </span>
            </div>
          </div>
        </div>

        {/* Window Content */}
        <div className="h-[280px] md:h-[320px] overflow-hidden bg-[#fffdf5] p-3 space-y-3 relative">
          <MockDashboard />

          {/* Mouse Follower for Dashboard (Visual decoration) */}
          <motion.div
            className="absolute pointer-events-none w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -z-10"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Decorative Floating Elements */}
      <motion.div
        className="absolute -top-6 -right-6 w-12 h-12 border-4 border-black bg-white flex items-center justify-center z-20 shadow-[4px_4px_0px_0px_#000]"
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Globe className="w-6 h-6 text-black" />
      </motion.div>

      <motion.div
        className="absolute -bottom-4 -left-8 w-16 h-8 bg-[#FFD02F] border-2 border-black z-20 flex items-center justify-center shadow-[4px_4px_0px_0px_#000]"
        animate={{ x: [0, 5, 0], rotate: [0, -3, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          delay: 1,
          ease: "easeInOut",
        }}
      >
        <span className="font-mono text-[10px] font-bold">v2.4</span>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Main Section
// ============================================================================

export default function WebAccessSpotlight() {
  return (
    <section
      id="web-access"
      className="relative bg-[#FFFDF5] py-20 md:py-32 px-4 border-y-[3px] border-black overflow-hidden"
    >
      {/* Dynamic Animated Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Floating Background Shapes */}
        <motion.div
          className="absolute top-20 left-10 w-4 h-4 border-2 border-black bg-[#FFD02F]"
          animate={{ y: [0, 20, 0], rotate: [0, 45, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-40 right-20 w-6 h-6 border-2 border-black rounded-full bg-transparent"
          animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Left Column - Content */}
          <motion.div className="order-2 lg:order-1" variants={itemVariants}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#FFD02F] text-black px-4 py-1.5 border-2 border-black mb-6 shadow-[3px_3px_0_#000]">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Public Beta
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black mb-6 leading-[0.95]">
              Introducing
              <br />
              <span className="text-[#FFD02F] bg-black px-2 py-1 inline-block mt-2">
                AttendrixWeb v2.1
              </span>
            </h2>

            {/* Subhead */}
            <h3 className="text-xl font-bold font-mono uppercase tracking-tight mb-4 text-neutral-800">
              Neo-Brutalist Command Center
            </h3>

            {/* Body */}
            <div className="text-lg text-neutral-600 font-medium mb-8 max-w-lg leading-relaxed space-y-4">
              <p>
                The high-density, desktop-optimized tactical dashboard for deep
                academic analysis. Built with{" "}
                <span className="font-bold text-black bg-yellow-100 px-1">
                  HTTP-Only Sessions
                </span>
                ,{" "}
                <span className="font-bold text-black bg-yellow-100 px-1">
                  SSR rendering
                </span>
                , and Supabase sync.
              </p>

              {/* Feature Bullets */}
              <ul className="space-y-2 mt-4 ml-1">
                <li className="flex items-center gap-2 font-mono text-sm font-bold text-neutral-700">
                  <div className="w-4 h-4 bg-black flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  Bento grid subject-wise status visualization
                </li>
                <li className="flex items-center gap-2 font-mono text-sm font-bold text-neutral-700">
                  <div className="w-4 h-4 bg-black flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  What-If attendance simulator with live projections
                </li>
                <li className="flex items-center gap-2 font-mono text-sm font-bold text-neutral-700">
                  <div className="w-4 h-4 bg-black flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  Lumen AI with syllabus RAG & PDFs
                </li>
              </ul>
            </div>

            {/* CTA Group */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Primary Button */}
              <motion.a
                href="/app/dashboard"
                className="inline-flex items-center gap-3 px-8 py-4 bg-black text-[#FFD02F] border-[3px] border-black font-bold uppercase tracking-wider shadow-[6px_6px_0px_0px_#FFD02F] transition-all"
                whileHover={{
                  x: -2,
                  y: -2,
                  boxShadow: "8px 8px 0px 0px #FFD02F",
                }}
                whileTap={{
                  x: 4,
                  y: 4,
                  boxShadow: "0px 0px 0px 0px #FFD02F",
                }}
              >
                <Globe className="w-5 h-5" />
                Launch App
              </motion.a>

              {/* Secondary Link */}
              <Link
                href="/docs/web"
                className="inline-flex items-center gap-2 px-6 py-4 bg-white border-[3px] border-black font-bold font-mono uppercase tracking-tight hover:bg-neutral-50 transition-colors"
              >
                Requirements
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column - Browser Window */}
          <motion.div className="order-1 lg:order-2" variants={itemVariants}>
            <BrowserWindow />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
