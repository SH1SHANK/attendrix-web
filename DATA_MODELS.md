# Attendrix Data Models

Last reviewed: 2026-02-05

## Supabase Tables

### `attendanceRecords`

Tracks per-user attendance check-ins.

| Field | Type | Notes |
| --- | --- | --- |
| `rowID` | uuid | Primary key |
| `userID` | text | Firebase UID |
| `classID` | text | Timetable class ID |
| `courseID` | text | Optional course ID |
| `classTime` | timestamp | Optional |
| `checkinTime` | timestamp | Check-in time |

### `batchRecords`

Academic batch definitions.

| Field | Type | Notes |
| --- | --- | --- |
| `batchID` | text | Primary key |
| `batchCode` | text | Display code |
| `semester` | int | Optional |
| `semester_name` | text | Optional |
| `slot` | text | Optional |
| `department_id` | text | Optional |
| `courseCatalog` | text[] | Course IDs |
| `electiveCatalog` | text[] | Elective IDs |
| `enrollmentCapacity` | int | Optional |

### `courseRecords`

Course catalog.

| Field | Type | Notes |
| --- | --- | --- |
| `courseID` | text | Primary key |
| `semesterID` | int | Semester number |
| `courseName` | text | Optional |
| `credits` | int | Optional |
| `courseType` | jsonb | Includes lab and category flags |
| `isElective` | boolean | Elective flag |
| `electiveScope` | text[] | Optional categories |
| `department_id` | text | Optional |

### `timetableRecords`

Scheduled classes.

| Field | Type | Notes |
| --- | --- | --- |
| `classID` | text | Primary key |
| `courseID` | text | Course ID |
| `batchID` | text | Batch |
| `classDate` | text | Date string (D/M/YYYY) |
| `classStartTime` | timestamp | Start time |
| `classEndTime` | timestamp | End time |
| `classVenue` | text | Optional |
| `courseType` | jsonb | Optional |
| `classStatus` | jsonb | Optional |

### `taskRecords`

Read-only tasks and exams.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `courseID` | text | Course ID |
| `taskType` | enum | `assignment` or `exam` |
| `taskName` | text | Optional |
| `taskDescription` | text | Optional |
| `taskDueDate` | timestamp | Optional |
| `taskStartTime` | timestamp | Optional |
| `taskEndTime` | timestamp | Optional |
| `taskVenue` | text | Optional |
| `additional_info` | text | Optional |

### `userCourseRecords`

Per-user academic context.

| Field | Type | Notes |
| --- | --- | --- |
| `userID` | text | Primary key (Firebase UID) |
| `batchID` | text | Batch ID |
| `semesterID` | int | Semester ID |
| `enrolledCourses` | text[] | Course IDs |
| `metadata` | jsonb | Optional |
| `lastUpdated` | timestamp | Optional |

### `calendars`

Batch calendars for Google Calendar sync.

| Field | Type | Notes |
| --- | --- | --- |
| `calendarID` | text | Google calendar ID |
| `calendarUrl` | text | Embed URL |
| `calendar_name` | text | Display name |
| `batchID` | text | Batch ID |

### `amplixChallengeProgress`

Challenge progress tracking.

### `challengeTemplates`

Challenge definitions.

## Supabase RPCs

- `set_user_courses`
- `class_check_in`
- `bulk_class_checkin`
- `mark_class_absent`
- `get_user_course_attendance_summary`
- `get_user_past_classes`
- `get_today_schedule`
- `evaluate_user_challenges`
- `generate_user_challenges_v2`

## Firebase User Document

Firestore `users/{uid}` document shape is created during onboarding and updated over time.

Key fields:

- `uid`, `email`, `username`, `display_name`, `photo_url`
- `batchID`, `semesterID`, `userRole`
- `coursesEnrolled`: array of course objects
- `currentStreak`, `longestStreak`, `streakHistory`
- `amplix`, `currentWeekAmplixGained`
- `challengesAllotted`, `challengeKey`
- `consentTerms`, `consentPromotions`, `isOnboarded`
- `lastDataFetchTime`, `lastResyncAt`, `resyncCount`

### Course Object

Each `coursesEnrolled` entry contains:

- `courseID`
- `courseName`
- `credits`
- `courseType` (object with `isLab`, `courseType`, `electiveCategory`)
- `attendedClasses`
- `totalClasses`
- `isEditable`

## Attendance Mapping

- Supabase is the system of record for attendance check-ins.
- Firestore stores derived attendance totals for UI speed.
- `/api/profile/resync` uses Firestore as the authoritative source for enrolled courses and reconciles Supabase records.
