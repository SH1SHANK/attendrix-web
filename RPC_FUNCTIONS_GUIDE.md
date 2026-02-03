# Supabase RPC Functions Implementation Guide

This guide provides the PostgreSQL stored procedures that need to be created in your Supabase database to support the refactored dashboard.

## Prerequisites

- Supabase project set up with PostgreSQL
- Access to SQL editor or migration tools
- Tables: `timetableRecords`, `attendanceRecords`, `userCourseRecords`

## RPC Functions to Create

### 1. get_today_schedule

Fetches today's schedule with attendance data and calculated metrics for a user.

```sql
CREATE OR REPLACE FUNCTION get_today_schedule(
  user_id TEXT,
  batch_id TEXT,
  attendance_goal_percentage NUMERIC DEFAULT 75,
  date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  classID TEXT,
  courseID TEXT,
  courseName TEXT,
  classStartTime TIMESTAMP,
  classEndTime TIMESTAMP,
  classVenue TEXT,
  isCancelled BOOLEAN,
  userAttended BOOLEAN,
  userCheckinTime TIMESTAMP,
  totalClasses BIGINT,
  attendedClasses BIGINT,
  currentAttendancePercentage NUMERIC,
  classesRequiredToReachGoal BIGINT,
  classesCanSkipAndStayAboveGoal BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats_records AS (
    -- Get all non-cancelled classes up to now for the user's batch
    SELECT
      t.classID,
      t.courseID,
      COUNT(*) as total_count
    FROM timetableRecords t
    WHERE t.batchID = batch_id
      AND t.classStartTime <= NOW()
      AND (t.classStatus ->> 'status' NOT IN ('cancelled', 'canceled')
           OR t.classStatus IS NULL)
    GROUP BY t.classID, t.courseID
  ),
  attendance_counts AS (
    -- Count attended classes per course
    SELECT
      t.courseID,
      COUNT(*) as attended_count
    FROM attendanceRecords ar
    JOIN timetableRecords t ON ar.classID = t.classID
    WHERE ar.userID = user_id
      AND t.batchID = batch_id
      AND ar.checkinTime IS NOT NULL
      AND (t.classStatus ->> 'status' NOT IN ('cancelled', 'canceled')
           OR t.classStatus IS NULL)
    GROUP BY t.courseID
  ),
  today_classes AS (
    -- Get today's schedule for the batch
    SELECT
      t.classID,
      t.courseID,
      t.courseName,
      t.classStartTime,
      t.classEndTime,
      t.classVenue,
      COALESCE((t.classStatus ->> 'status') = 'cancelled' OR (t.classStatus ->> 'status') = 'canceled', false) as is_cancelled,
      ar.checkinTime IS NOT NULL as user_attended
    FROM timetableRecords t
    LEFT JOIN attendanceRecords ar ON t.classID = ar.classID AND ar.userID = user_id
    WHERE t.batchID = batch_id
      AND DATE(t.classStartTime) = date
      AND (t.classStatus ->> 'status' NOT IN ('cancelled', 'canceled')
           OR t.classStatus IS NULL)
  )
  SELECT
    tc.classID,
    tc.courseID,
    tc.courseName,
    tc.classStartTime,
    tc.classEndTime,
    tc.classVenue,
    tc.is_cancelled,
    tc.user_attended,
    ar.checkinTime,
    COALESCE(sr.total_count, 0)::BIGINT as total_classes,
    COALESCE(ac.attended_count, 0)::BIGINT as attended_classes,
    CASE
      WHEN COALESCE(sr.total_count, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(ac.attended_count, 0)::NUMERIC / sr.total_count) * 100, 2)
    END as current_attendance_percentage,
    CASE
      WHEN COALESCE(sr.total_count, 0) = 0 THEN 0
      WHEN (COALESCE(ac.attended_count, 0)::NUMERIC / sr.total_count) * 100 >= attendance_goal_percentage THEN 0
      ELSE CEILING(
        (attendance_goal_percentage * sr.total_count - 100.0 * COALESCE(ac.attended_count, 0)) /
        (100.0 - attendance_goal_percentage)
      )::BIGINT
    END as classes_required_to_reach_goal,
    CASE
      WHEN COALESCE(sr.total_count, 0) = 0 THEN 0
      WHEN (COALESCE(ac.attended_count, 0)::NUMERIC / sr.total_count) * 100 <= attendance_goal_percentage THEN 0
      ELSE FLOOR(
        (100.0 * COALESCE(ac.attended_count, 0) - attendance_goal_percentage * sr.total_count) /
        attendance_goal_percentage
      )::BIGINT
    END as classes_can_skip_and_stay_above_goal
  FROM today_classes tc
  LEFT JOIN stats_records sr ON tc.courseID = sr.courseID
  LEFT JOIN attendance_counts ac ON tc.courseID = ac.courseID
  LEFT JOIN attendanceRecords ar ON tc.classID = ar.classID AND ar.userID = user_id
  ORDER BY tc.classStartTime ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
```

### 2. get_upcoming_classes

Fetches upcoming classes for the next working day.

```sql
CREATE OR REPLACE FUNCTION get_upcoming_classes(user_id TEXT)
RETURNS TABLE (
  classID TEXT,
  courseID TEXT,
  courseName TEXT,
  classStartTime TIMESTAMP,
  classEndTime TIMESTAMP,
  classVenue TEXT,
  classDate TEXT
) AS $$
DECLARE
  next_date DATE;
BEGIN
  -- Get user's enrolled courses
  WITH user_courses AS (
    SELECT ucr.enrolledCourses
    FROM userCourseRecords ucr
    WHERE ucr.userID = user_id
    LIMIT 1
  ),
  course_ids AS (
    -- Extract course IDs from JSON array
    SELECT jsonb_array_elements_text(uc.enrolledCourses) as courseID
    FROM user_courses uc
    WHERE uc.enrolledCourses IS NOT NULL
  ),
  future_classes AS (
    -- Get all future classes for user's courses
    SELECT
      t.classID,
      t.courseID,
      t.courseName,
      t.classStartTime,
      t.classEndTime,
      t.classVenue,
      DATE(t.classStartTime) as class_date,
      ROW_NUMBER() OVER (ORDER BY DATE(t.classStartTime), t.classStartTime) as date_rank
    FROM timetableRecords t
    JOIN course_ids ci ON t.courseID = ci.courseID
    WHERE t.classStartTime > NOW()
      AND (t.classStatus ->> 'status' NOT IN ('cancelled', 'canceled')
           OR t.classStatus IS NULL)
  ),
  next_working_day_classes AS (
    SELECT * FROM future_classes
    WHERE date_rank <= 1 -- Get the first date
  )
  RETURN QUERY
  SELECT
    nwd.classID,
    nwd.courseID,
    nwd.courseName,
    nwd.classStartTime,
    nwd.classEndTime,
    nwd.classVenue,
    TO_CHAR(nwd.class_date, 'DD/MM/YYYY') as classDate
  FROM next_working_day_classes nwd
  ORDER BY nwd.classStartTime ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
```

### 3. get_classes_by_date

Fetches classes for a specific date in D/M/YYYY format.

```sql
CREATE OR REPLACE FUNCTION get_classes_by_date(
  user_id TEXT,
  date TEXT -- Format: D/M/YYYY
)
RETURNS TABLE (
  classID TEXT,
  courseID TEXT,
  courseName TEXT,
  classStartTime TIMESTAMP,
  classEndTime TIMESTAMP,
  classVenue TEXT,
  classDate TEXT,
  classStatus JSONB,
  courseType JSONB,
  isPlusSlot BOOLEAN
) AS $$
DECLARE
  parsed_date DATE;
BEGIN
  -- Parse the date from D/M/YYYY format
  parsed_date := TO_DATE(date, 'DD/MM/YYYY');

  RETURN QUERY
  WITH user_courses AS (
    SELECT ucr.enrolledCourses
    FROM userCourseRecords ucr
    WHERE ucr.userID = user_id
    LIMIT 1
  ),
  course_ids AS (
    -- Extract course IDs from JSON array
    SELECT jsonb_array_elements_text(uc.enrolledCourses) as courseID
    FROM user_courses uc
    WHERE uc.enrolledCourses IS NOT NULL
  )
  SELECT
    t.classID,
    t.courseID,
    t.courseName,
    t.classStartTime,
    t.classEndTime,
    t.classVenue,
    COALESCE(t.classDate, TO_CHAR(DATE(t.classStartTime), 'DD/MM/YYYY')) as classDate,
    COALESCE(t.classStatus, '{}'::JSONB) as classStatus,
    COALESCE(t.courseType, '{}'::JSONB) as courseType,
    COALESCE(t.isPlusSlot, false) as isPlusSlot
  FROM timetableRecords t
  JOIN course_ids ci ON t.courseID = ci.courseID
  WHERE DATE(t.classStartTime) = parsed_date
    AND (t.classStatus ->> 'status' NOT IN ('cancelled', 'canceled')
         OR t.classStatus IS NULL)
  ORDER BY t.classStartTime ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
```

## Deployment Instructions

### Option 1: Using Supabase Dashboard

1. Go to SQL Editor in your Supabase dashboard
2. Copy each function definition above
3. Paste and execute each one sequentially
4. Verify functions appear in Database → Functions

### Option 2: Using Supabase CLI (Recommended)

1. Create migration file:

```bash
supabase migration new add_dashboard_rpc_functions
```

2. Add the function definitions to the migration file

3. Apply migration:

```bash
supabase migration up
```

### Option 3: Direct PostgreSQL

```bash
psql "postgresql://[user]:[password]@[host]:[port]/[database]" < functions.sql
```

## Testing the Functions

### Test get_today_schedule

```sql
SELECT * FROM get_today_schedule(
  'user-id-123',
  'batch-id-456',
  75,
  CURRENT_DATE
);
```

### Test get_upcoming_classes

```sql
SELECT * FROM get_upcoming_classes('user-id-123');
```

### Test get_classes_by_date

```sql
SELECT * FROM get_classes_by_date(
  'user-id-123',
  '3/2/2026'
);
```

## Error Handling

If you encounter errors:

1. **Function not found**: Ensure you're executing all three CREATE FUNCTION statements
2. **JSON parsing errors**: Verify enrolledCourses column contains valid JSON arrays
3. **Type mismatches**: Check that classStartTime, classEndTime are TIMESTAMP type

## Performance Optimization

To improve query performance, consider adding indexes:

```sql
-- Indexes for RPC functions
CREATE INDEX idx_timetable_batch_datetime ON timetableRecords(batchID, classStartTime);
CREATE INDEX idx_timetable_date ON timetableRecords(classDate);
CREATE INDEX idx_attendance_user ON attendanceRecords(userID, classID);
CREATE INDEX idx_userCourseRecords_user ON userCourseRecords(userID);
```

## Rollback

To remove the functions:

```sql
DROP FUNCTION IF EXISTS get_today_schedule(TEXT, TEXT, NUMERIC, DATE);
DROP FUNCTION IF EXISTS get_upcoming_classes(TEXT);
DROP FUNCTION IF EXISTS get_classes_by_date(TEXT, TEXT);
```

## Next Steps

1. Deploy the RPC functions to your Supabase database
2. Test each function with sample data
3. Verify the dashboard loads correctly with the new RPC calls
4. Monitor query performance and optimize as needed
5. Set up alerts for function errors in production
