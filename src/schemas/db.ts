import { z } from "zod";

// ============================================================================
// Database Schemas (Supabase)
// ============================================================================

export const AttendanceRecordSchema = z.object({
  classID: z.string(),
  checkinTime: z.string().nullable(), // timestamp
  courseID: z.string(),
  userID: z.string(),
  classTime: z.string(), // timestamp
  rowID: z.string().uuid(),
});

export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;

export const TimetableRecordSchema = z.object({
  classID: z.string(),
  courseID: z.string(),
  batchID: z.string(),
  createdTime: z.string(),
  courseName: z.string(),
  classStartTime: z.string(),
  classEndTime: z.string(),
  isPlusSlot: z.boolean().nullable().optional(),
  courseType: z
    .union([z.record(z.string(), z.any()), z.string()])
    .nullable()
    .optional(), // jsonb may arrive stringified
  classStatus: z
    .union([z.record(z.string(), z.any()), z.string()])
    .nullable()
    .optional(),
  classVenue: z.string().nullable().optional(),
  classDate: z.string(), // Text date D/MM/YYYY
  updated_at: z.string().optional(),
  eventid: z.string().optional(),
});

export type TimetableRecord = z.infer<typeof TimetableRecordSchema>;

export const AmplixLogSchema = z.object({
  id: z.string().uuid(),
  userID: z.string(),
  classID: z.string(),
  classDate: z.string(),
  amplixObtained: z.number().int(),
  source: z.string(),
  full_day_attendance: z.boolean().optional(),
  currentAmplixScore: z.number().int(),
  lastUpdatedAt: z.string(),
});

export type AmplixLog = z.infer<typeof AmplixLogSchema>;

// ============================================================================
// Derived Types
// ============================================================================

export const ClassWithAttendanceSchema = TimetableRecordSchema.extend({
  attendance: AttendanceRecordSchema.nullable().optional(),
  status: z
    .enum(["present", "absent", "upcoming", "cancelled"])
    .default("upcoming"),
});

export type ClassWithAttendance = z.infer<typeof ClassWithAttendanceSchema>;
