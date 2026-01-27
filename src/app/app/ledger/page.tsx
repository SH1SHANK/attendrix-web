"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  FlaskConical,
  AlertTriangle,
  Shield,
  Flame,
} from "lucide-react";
import { useMemo } from "react";
import {
  useSubjectLedger,
  type LedgerStatus,
  type SubjectLedgerItem,
} from "@/hooks/queries/useSubjectLedger";
import { RetroSkeleton } from "@/components/ui/RetroSkeleton";

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

// ============================================================================
// Sub-Components
// ============================================================================

function StatusDot({ level }: { level: "safe" | "warning" | "critical" }) {
  const colors = {
    safe: "bg-green-500",
    warning: "bg-yellow-500",
    critical: "bg-red-500",
  };

  return (
    <motion.div
      className={`w-3 h-3 ${colors[level]} border border-black`}
      animate={level === "critical" ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 1, repeat: Infinity }}
    />
  );
}

const statusMeta: Record<
  LedgerStatus,
  {
    level: "safe" | "warning" | "critical";
    label: string;
    color: { bg: string; text: string; border: string };
  }
> = {
  safe: {
    level: "safe",
    label: "Safe",
    color: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-500",
    },
  },
  condonation: {
    level: "warning",
    label: "Condonation Zone",
    color: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-500",
    },
  },
  critical: {
    level: "critical",
    label: "Critical",
    color: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-500",
    },
  },
};

function SubjectCard({ subject }: { subject: SubjectLedgerItem }) {
  const meta = statusMeta[subject.status];
  const { level, label, color } = meta;
  const safeCutsLeft = subject.safeSkip;
  const percentage = subject.percentage;
  const isLab = false;

  const borderColors = {
    safe: "border-green-500",
    warning: "border-yellow-500",
    critical: "border-red-500",
  };

  const bgAccent = level === "critical" ? "bg-red-50" : "bg-white";

  return (
    <motion.div
      className={`
        relative p-5 border-2 ${borderColors[level]} ${bgAccent}
        shadow-[6px_6px_0px_0px_#000]
        transition-all duration-200 cursor-pointer
        hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_#000]
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]
      `}
      variants={cardVariants}
      whileHover={{ scale: 1.02 }}
      layout
    >
      {/* Status Indicator - Top Right */}
      <div className="absolute top-3 right-3">
        <StatusDot level={level} />
      </div>

      {/* Primary Metric: Safe Cuts Left */}
      <div className="mb-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block mb-1">
          {safeCutsLeft > 0
            ? "Safe Cuts Left"
            : level === "critical"
              ? "Under Critical"
              : "At Threshold"}
        </span>
        <div className="flex items-baseline gap-1">
          <span
            className={`font-black text-5xl leading-none ${
              safeCutsLeft > 0
                ? "text-green-600"
                : level === "critical"
                  ? "text-red-600"
                  : "text-yellow-600"
            }`}
          >
            {safeCutsLeft > 0
              ? `+${safeCutsLeft}`
              : safeCutsLeft === 0 && level !== "critical"
                ? "0"
                : "!"}
          </span>
          {safeCutsLeft > 0 && (
            <span className="font-mono text-sm text-neutral-500">classes</span>
          )}
        </div>
      </div>

      {/* Course Details */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          {isLab ? (
            <FlaskConical className="w-4 h-4 text-purple-600" />
          ) : (
            <BookOpen className="w-4 h-4 text-neutral-500" />
          )}
          <span className="font-mono text-xs font-bold text-neutral-600">
            {subject.courseID}
          </span>
          {isLab && (
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 font-mono text-[9px] font-bold uppercase">
              Lab
            </span>
          )}
        </div>
        <h3 className="font-bold text-base leading-tight line-clamp-2">
          {subject.courseName}
        </h3>
      </div>

      {/* Status Label */}
      <div className="mb-3">
        <span
          className={`
            inline-flex items-center gap-1.5 px-2 py-1
            ${color.bg} ${color.text}
            font-mono text-[10px] font-bold uppercase tracking-wider
            border ${color.border}
          `}
        >
          {level === "safe" && <Shield className="w-3 h-3" />}
          {level === "warning" && <AlertTriangle className="w-3 h-3" />}
          {level === "critical" && <Flame className="w-3 h-3" />}
          {label}
        </span>
      </div>

      {/* Progress Bar Footer */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline">
          <span className="font-mono text-xs text-neutral-500">
            {subject.attendedClasses}/{subject.totalClasses} attended
          </span>
          <span className="font-mono text-sm font-bold">
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-neutral-200 border-2 border-black overflow-hidden">
          <motion.div
            className={`h-full ${
              level === "safe"
                ? "bg-green-500"
                : level === "warning"
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function StatsBar({
  stats,
}: {
  stats: { safe: number; warning: number; critical: number; total: number };
}) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-neutral-100 border-2 border-black">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 border border-black" />
        <span className="font-mono text-xs uppercase">
          Safe: <span className="font-bold">{stats.safe}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-yellow-500 border border-black" />
        <span className="font-mono text-xs uppercase">
          Warning: <span className="font-bold">{stats.warning}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-red-500 border border-black" />
        <span className="font-mono text-xs uppercase">
          Critical: <span className="font-bold">{stats.critical}</span>
        </span>
      </div>
      <div className="ml-auto">
        <span className="font-mono text-xs text-neutral-500">
          {stats.total} subjects tracked
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Main Ledger Page
// ============================================================================

export default function LedgerPage() {
  const { ledger, summary, isLoading, error } = useSubjectLedger();

  const stats = useMemo(() => {
    if (!summary) return { safe: 0, warning: 0, critical: 0, total: 0 };
    return {
      safe: summary.safeCount,
      warning: summary.condonationCount,
      critical: summary.criticalCount,
      total: summary.totalCourses,
    };
  }, [summary]);

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.header variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-400 border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
            <BookOpen className="w-5 h-5" />
          </div>
          <h1 className="font-black text-3xl md:text-4xl uppercase tracking-tight">
            Subject Ledger
          </h1>
        </div>
        <p className="font-medium text-neutral-600 max-w-xl">
          Health check for each subject. Focus on what needs attention.
        </p>
      </motion.header>

      {/* Stats Summary Bar */}
      <motion.section variants={itemVariants}>
        <StatsBar stats={stats} />
      </motion.section>

      {/* Subject Cards Grid */}
      <motion.section variants={itemVariants}>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <RetroSkeleton key={idx} className="h-64" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 border-2 border-red-500 bg-red-50 text-red-700 font-mono text-sm">
            Failed to load ledger. Please retry.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(ledger ?? [])
              .sort((a, b) => {
                const order = { critical: 0, condonation: 1, safe: 2 } as const;
                return order[a.status] - order[b.status];
              })
              .map((subject) => (
                <SubjectCard key={subject.courseID} subject={subject} />
              ))}
          </div>
        )}
      </motion.section>

      {/* Legend Note */}
      <motion.section variants={itemVariants}>
        <div className="p-4 bg-yellow-50 border-2 border-dashed border-yellow-400">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-yellow-800 mb-1">
                Medical Condonation Zone (65-80%)
              </p>
              <p className="text-xs text-yellow-700">
                Subjects in the yellow zone may be eligible for attendance
                condonation with valid medical documentation. Contact your
                department for guidelines.
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
