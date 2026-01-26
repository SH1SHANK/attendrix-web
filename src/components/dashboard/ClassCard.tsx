import { motion } from "framer-motion";
import { BookOpen, FlaskConical, GraduationCap, MapPin } from "lucide-react";
import { RetroToggle } from "@/components/app/RetroToggle";
import type { ParsedClass } from "@/hooks/queries/useNextClass";
import type { AttendanceStat } from "@/types/dashboard";
import { AttendanceStatus } from "@/hooks/queries/useAttendance";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function ClassCard({
  classItem,
  onToggle,
  isPast,
  attendanceStat,
  onOpenCalculator,
  attendanceGoal = 80,
}: {
  classItem: ParsedClass;
  onToggle: () => void;
  isPast: boolean;
  attendanceStat?: AttendanceStat;
  onOpenCalculator: () => void;
  attendanceGoal?: number;
}) {
  const TypeIcon =
    classItem.type === "lab"
      ? FlaskConical
      : classItem.type === "tutorial"
        ? GraduationCap
        : BookOpen;

  const toggleStatus: AttendanceStatus =
    classItem.status === "present"
      ? "present"
      : classItem.status === "absent"
        ? "absent"
        : "pending";

  // Extract slot from courseID
  // Rule: Try to grab the last 2-3 alphanumeric chars if identifier is long enough.
  // Fallback to slice(8) if logical.
  const extractSlot = (id: string) => {
    // Regex for ending with 2-3 chars (e.g. B1, TB1)
    const match = id.match(/([A-Z]{1,2}[0-9]{1})$/);
    if (match) return match[1];
    // Fallback: If length > 8, return substring from 8
    if (id.length > 8) return id.slice(8);
    return id;
  };

  const slot = classItem.courseID ? extractSlot(classItem.courseID) : "";

  // Attendance Insights (Can skip / Must attend)
  let insight = null;
  if (attendanceStat) {
    const { attendedClasses, totalClasses } = attendanceStat;
    const currentPct =
      totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

    if (currentPct >= attendanceGoal) {
      // Calculate how many can skip:
      // (attended) / (total + x) >= 0.75 (using 75 as standard min, or goal)
      // Let's use 75% as the "Safe" threshold typically, or pass it in. User said "Can skip based on status".
      // Usually goal is personal (80%), but university rule is often 75%.
      // Let's use attendanceGoal for consistency.

      let skippable = 0;
      while (true) {
        const newTotal = totalClasses + skippable + 1;
        const newPct = (attendedClasses / newTotal) * 100;
        if (newPct < attendanceGoal) break; // Crossing the line
        skippable++;
        if (skippable > 20) break; // Safety break
      }
      if (skippable > 0) {
        insight = { type: "good", text: `Can skip ${skippable} classes` };
      }
    } else {
      // Must attend
      // (attended + x) / (total + x) >= goal
      let needed = 0;
      while (true) {
        const newAttended = attendedClasses + needed + 1;
        const newTotal = totalClasses + needed + 1;
        const newPct = (newAttended / newTotal) * 100;
        if (newPct >= attendanceGoal) {
          needed++;
          break;
        }
        needed++;
        if (needed > 20) break;
      }
      if (needed > 0) {
        insight = { type: "bad", text: `Must attend ${needed} classes` };
      }
    }
  }

  return (
    <motion.div
      className={`relative flex items-center gap-3 rounded border-2 border-black bg-white p-3 sm:p-4 pb-8 shadow-[4px_4px_0px_0px_#000] ${isPast ? "opacity-70" : ""}`}
      variants={itemVariants}
      layout
      onClick={onOpenCalculator}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Time Column */}
      <div className="flex flex-col items-center min-w-[50px] sm:min-w-[60px]">
        <span className="font-mono text-base sm:text-lg font-bold leading-none">
          {classItem.startTime}
        </span>
        <div className="my-1 h-px w-full bg-neutral-200" />
        <span className="text-[10px] sm:text-xs font-mono text-neutral-500 leading-none">
          {classItem.endTime}
        </span>
      </div>

      <div className="h-10 border-l border-neutral-200" />

      {/* Main Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-0.5">
          <TypeIcon className="w-3 h-3 text-neutral-500" />
          <span className="font-mono text-[10px] sm:text-xs font-bold text-neutral-500">
            {slot && (
              <span className="bg-neutral-100 px-1 rounded mr-1 text-black">
                {slot}
              </span>
            )}
            {classItem.courseID}
          </span>
          {classItem.type !== "lecture" && (
            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-purple-700">
              {classItem.type}
            </span>
          )}
        </div>

        <h4 className="font-bold text-sm sm:text-base truncate leading-tight">
          {classItem.courseName}
        </h4>

        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center gap-1 text-neutral-500">
            <MapPin className="w-3 h-3" />
            <span className="font-mono text-[10px] sm:text-xs">
              {classItem.classVenue || "TBA"}
            </span>
          </div>
          {insight && (
            <div className="flex">
              <span
                className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${insight.type === "good" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {insight.text}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Action - Stop propagation to prevent opening modal if just toggling */}
      <div onClick={(e) => e.stopPropagation()} className="self-center">
        <RetroToggle
          status={toggleStatus}
          onCycle={onToggle}
          disabled={classItem.status === "upcoming"}
        />
      </div>
    </motion.div>
  );
}
