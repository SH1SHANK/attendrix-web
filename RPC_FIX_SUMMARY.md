# RPC Function Fixes - Summary

## Issue Identified

The deployed Supabase RPC functions had **different parameter names** than what was documented and implemented in the code, causing PGRST202 errors.

## Root Causes

### 1. Parameter Name Mismatch

- **Code sent**: `target_date`
- **Function expected**: `date`
- **Error**: `PGRST202: Could not find the function public.get_today_schedule(attendance_goal_percentage, batch_id, target_date, user_id)`

### 2. Date Formatting Issue

- **Problem**: `formatDateForRPC()` could return `null`, which was stringified to `"null"` and sent to RPC
- **Result**: Invalid dates like `"NaN/NaN/NaN"` being sent to `get_classes_by_date`

## Fixes Applied

### Code Changes

#### 1. classes-service.ts

Updated RPC parameter names to match deployed functions:

```typescript
// BEFORE
await supabase.rpc("get_today_schedule", {
  user_id: userId,
  batch_id: batchId,
  attendance_goal_percentage: attendanceGoalPercentage,
  target_date: targetDate.toISOString().split("T")[0], // ❌
});

// AFTER
await supabase.rpc("get_today_schedule", {
  user_id: userId,
  batch_id: batchId,
  attendance_goal_percentage: attendanceGoalPercentage,
  date: targetDate.toISOString().split("T")[0], // ✅
});
```

```typescript
// BEFORE
await supabase.rpc("get_classes_by_date", {
  user_id: userId,
  target_date: targetDate, // ❌
});

// AFTER
await supabase.rpc("get_classes_by_date", {
  user_id: userId,
  date: targetDate, // ✅
});
```

#### 2. UpcomingClasses.tsx

Added fallback for null date formatting:

```typescript
// BEFORE
const targetDateString = formatDateForRPC(selectedDate);

// AFTER
const targetDateString =
  formatDateForRPC(selectedDate) || formatDateForRPC(new Date());
```

This ensures that even if `selectedDate` is invalid, we always have a valid date string to send to the RPC function.

### Documentation Changes

#### RPC_FUNCTIONS_GUIDE.md

Updated parameter names to match deployed functions:

**Function 1: get_today_schedule**

```sql
-- BEFORE
CREATE OR REPLACE FUNCTION get_today_schedule(
  user_id TEXT,
  batch_id TEXT,
  attendance_goal_percentage NUMERIC DEFAULT 75,
  target_date DATE DEFAULT CURRENT_DATE -- ❌
)

-- AFTER
CREATE OR REPLACE FUNCTION get_today_schedule(
  user_id TEXT,
  batch_id TEXT,
  attendance_goal_percentage NUMERIC DEFAULT 75,
  date DATE DEFAULT CURRENT_DATE -- ✅
)
```

**Function 3: get_classes_by_date**

```sql
-- BEFORE
CREATE OR REPLACE FUNCTION get_classes_by_date(
  user_id TEXT,
  target_date TEXT -- ❌
)

-- AFTER
CREATE OR REPLACE FUNCTION get_classes_by_date(
  user_id TEXT,
  date TEXT -- ✅
)
```

## Files Modified

1. **src/lib/services/classes-service.ts** - Updated RPC parameter names (2 functions)
2. **src/components/dashboard/UpcomingClasses.tsx** - Added null date fallback
3. **RPC_FUNCTIONS_GUIDE.md** - Updated documentation to match deployed functions

## Verification

✅ All TypeScript files compile without errors
✅ Parameter names match deployed RPC function signatures
✅ Date formatting has proper null handling
✅ Documentation updated to reflect actual deployed functions

## Testing Checklist

After deploying these fixes, verify:

- [ ] `get_today_schedule` returns data without PGRST202 errors
- [ ] `get_upcoming_classes` returns next working day classes
- [ ] `get_classes_by_date` returns classes for selected date
- [ ] Date picker in UpcomingClasses works correctly
- [ ] No "NaN/NaN/NaN" dates appear in network requests
- [ ] Dashboard displays all classes correctly

## Key Takeaway

**Always verify deployed function signatures match your code implementation**. The Supabase error hint was crucial:

> "Perhaps you meant to call the function public.get_today_schedule(attendance_goal_percentage, batch_id, **date**, user_id)"

This indicated the deployed function used `date` not `target_date`, allowing us to quickly identify and fix the issue.
