# Attendrix Web API Documentation

Last reviewed: 2026-02-05

## Conventions

- Auth: All `/api/*` routes require a valid Firebase session cookie unless noted.
- Success: `{ ok: true, data: ... }`.
- Error: `{ error: { code, message, details? } }`.
- User-specific responses use `Cache-Control: private, no-store`.

## Auth Endpoints

### POST `/api/auth/login`

Creates a server session cookie from a Firebase ID token.

Request JSON:

```json
{ "idToken": "string" }
```

Response JSON:

```json
{ "success": true, "uid": "string" }
```

Errors: 400 invalid body, 401 auth failed.

### POST `/api/auth/logout`

Clears session cookie and optionally revokes refresh tokens.

Request JSON (optional):

```json
{ "revokeAll": true }
```

Response JSON:

```json
{ "success": true }
```

## Attendance Endpoints

### GET `/api/attendance/summary`

Query params:

- `attendanceGoal` optional number 1-100

Response: attendance summary list from Supabase RPC `get_user_course_attendance_summary`.

### GET `/api/attendance/schedule`

Query params:

- `batchId` required
- `attendanceGoal` optional number 1-100 (default 75)
- `date` optional ISO date

Response JSON:

```json
{
  "ok": true,
  "data": {
    "todaySchedule": [ ... ],
    "upcomingClasses": [ ... ]
  }
}
```

### GET `/api/attendance/classes-by-date`

Query params:

- `batchId` required
- `date` required (string)

Response: list of class rows filtered by enrolled courses.

### GET `/api/attendance/past`

Query params:

- `filter`: `7d` | `14d` | `30d` | `all`

Response: list of past classes with `attendanceStatus` (`PRESENT`, `ABSENT`, `PENDING`).

### POST `/api/attendance/check-in`

Request JSON:

```json
{ "classID": "string", "classStartTime": "string" }
```

Response: Supabase RPC `class_check_in` payload.

### POST `/api/attendance/mark-absent`

Request JSON:

```json
{ "classID": "string" }
```

Response: Supabase RPC `mark_class_absent` payload.

### POST `/api/attendance/bulk-checkin`

Request JSON:

```json
{ "classIds": ["string"] }
```

Response: Supabase RPC `bulk_class_checkin` payload.

### POST `/api/attendance/evaluate-challenges`

Request JSON:

```json
{ "progressIds": ["string"], "currentStreak": 0, "courseIds": ["string"] }
```

Response: Supabase RPC `evaluate_user_challenges` payload.

## User and Profile Endpoints

### GET `/api/user/course-records`

Returns the `userCourseRecords` row for the authenticated user.

### POST `/api/user/update-courses`

Request JSON:

```json
{ "courseIds": ["string"] }
```

Response:

```json
{
  "ok": true,
  "data": {
    "addedCourseIds": ["string"],
    "removedCourseIds": ["string"],
    "enrolledCourseIds": ["string"]
  }
}
```

### GET `/api/user/calendars`

Query params:

- `batchID` optional (validated against user batch)

Response: list of `calendars` rows for the user batch.

### POST `/api/profile/resync`

Reconciles Supabase `userCourseRecords` with Firestore as source of truth.

Request JSON: `{}`

Response includes:

- `missingInSupabase`
- `extraInSupabase`
- `totalsMismatched`
- `updated`

### POST `/api/profile/deactivate`

Request JSON:

```json
{ "confirm": "DEACTIVATE" }
```

Disables Firebase user, revokes tokens, marks user as deactivated in Firestore.

### POST `/api/profile/delete`

Request JSON:

```json
{ "confirm": "DELETE" }
```

Deletes user data in Supabase and Firestore and deletes Firebase user.

## Tasks Endpoints

### GET `/api/tasks`

Returns all task records for the authenticated user based on enrolled courses.

## Resources Endpoints

### GET `/api/resources/courses`

Returns enrolled courses with their `syllabusAssets` metadata for the authenticated user.

Response JSON:

```json
{
  "ok": true,
  "data": [
    {
      "courseID": "string",
      "courseName": "string | null",
      "syllabusAssets": {
        "provider": "google-drive",
        "folderId": "string",
        "folderUrl": "string",
        "visibility": "string"
      }
    }
  ]
}
```

### GET `/api/resources/drive`

Proxies Google Drive API v3 folder listing for a given folder ID.

Query params:

- `folderId` required

Response JSON:

```json
{
  "ok": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "mimeType": "string",
      "modifiedTime": "string",
      "webViewLink": "string",
      "iconLink": "string"
    }
  ]
}
```

### GET `/api/resources/drive/file`

Proxies Google Drive API v3 file download (and export for Google Docs formats).

Query params:

- `fileId` required
- `export` optional mime type for export (e.g. `application/pdf`)

Response:

- Binary file response with the Drive file contents (or export output).

## Support and Issues

### POST `/api/issues/bug`

Multipart form-data fields:

- `title`, `summary` (required)
- `steps`, `expected`, `actual`, `pageUrl`, `email` (optional)
- `attachments` (optional images, max 5 files, 5MB each)

Creates a GitHub issue labeled `bug` with attachment links.

### POST `/api/issues/feature`

Multipart form-data fields:

- `title`, `summary` (required)
- `impact`, `useCase`, `pageUrl`, `email` (optional)
- `attachments` (optional images)

Creates a GitHub issue labeled `feature`.

### POST `/api/issues/moderation`

Multipart form-data fields:

- `title`, `summary`, `experience`, `availability` (required)
- `pageUrl`, `email` (optional)
- `attachments` (optional images)

Creates a GitHub issue labeled `moderation`.

### POST `/api/issues/batch-access`

Multipart form-data fields:

- `title`, `summary`, `batchId`, `reason` (required)
- `pageUrl`, `email` (optional)
- `attachments` (optional images)

Creates a GitHub issue labeled `batch-access`.

## Supabase RPCs

The app relies on these Supabase RPCs:

- `set_user_courses`
- `class_check_in`
- `bulk_class_checkin`
- `mark_class_absent`
- `get_user_course_attendance_summary`
- `get_user_past_classes`
- `get_today_schedule`
- `evaluate_user_challenges`
- `generate_user_challenges_v2`

## Authentication Requirements

- All routes under `/api/*` verify the Firebase session cookie via `verifySession`.
- Requests without valid sessions return `UNAUTHORIZED`.
