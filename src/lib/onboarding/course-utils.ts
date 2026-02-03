import type { CourseRecord } from "@/types/supabase-academic";

export type CourseTypeMeta = {
  isLab: boolean;
  courseType: "core" | "elective" | "audit" | string;
  electiveCategory: string;
  slot?: string;
  section?: string;
  timing?: string;
};

export function parseCourseType(raw: unknown): CourseTypeMeta {
  const fallback: CourseTypeMeta = {
    isLab: false,
    courseType: "core",
    electiveCategory: "",
  };

  if (!raw) return fallback;

  try {
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw) as Partial<CourseTypeMeta>;
      return {
        isLab: Boolean(parsed.isLab),
        courseType: parsed.courseType || fallback.courseType,
        electiveCategory: parsed.electiveCategory || "",
        slot: parsed.slot,
        section: parsed.section,
        timing: parsed.timing,
      };
    }

    if (typeof raw === "object") {
      const parsed = raw as Partial<CourseTypeMeta>;
      return {
        isLab: Boolean(parsed.isLab),
        courseType: parsed.courseType || fallback.courseType,
        electiveCategory: parsed.electiveCategory || "",
        slot: parsed.slot,
        section: parsed.section,
        timing: parsed.timing,
      };
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function getCourseCategory(course: CourseRecord): string {
  const type = parseCourseType(course.courseType);
  if (type.electiveCategory) return type.electiveCategory;

  if (Array.isArray(course.electiveScope) && course.electiveScope.length === 1) {
    return course.electiveScope[0] || "";
  }

  return "";
}

export function isLabCourse(course: CourseRecord): boolean {
  const type = parseCourseType(course.courseType);
  const category = getCourseCategory(course).toUpperCase();
  return Boolean(type.isLab) || category.startsWith("LAB");
}

export function getCourseBadge(course: CourseRecord): string | null {
  const type = parseCourseType(course.courseType);
  if (type.slot) return `Slot ${type.slot}`;
  if (type.section) return `Section ${type.section}`;
  if (type.timing) return type.timing;
  return null;
}
