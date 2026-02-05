import { getCourseSlot, getCourseSlotLabel } from "@/lib/courses/slot";
import { cn } from "@/lib/utils";

type CourseSlotBadgeProps = {
  courseId?: string | null;
  className?: string;
  label?: string;
};

export function CourseSlotBadge({
  courseId,
  className,
  label = "Slot",
}: CourseSlotBadgeProps) {
  const slot = getCourseSlot(courseId);
  if (!slot) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border-2 border-black bg-black px-2 py-0.5 text-[9px] font-black uppercase leading-none text-white shadow-[2px_2px_0px_0px_#000]",
        className,
      )}
      aria-label={getCourseSlotLabel(courseId)}
    >
      <span className="text-[8px] tracking-[0.18em]">{label}</span>
      {slot}
    </span>
  );
}
