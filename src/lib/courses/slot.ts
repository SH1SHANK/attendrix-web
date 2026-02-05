export function getCourseSlot(courseId?: string | null): string {
  if (!courseId) return "";
  const trimmed = courseId.trim();
  if (!trimmed) return "";
  const slot = trimmed.length >= 2 ? trimmed.slice(-2) : trimmed;
  return slot.toUpperCase();
}

export function getCourseSlotLabel(courseId?: string | null): string {
  const slot = getCourseSlot(courseId);
  return slot ? `Slot ${slot}` : "";
}
