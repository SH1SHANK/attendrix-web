# Attendrix Web Caching, Efficiency & Data-Load Analysis

Date: 2026-02-04
Scope: `/src`, `next.config.ts`, `middleware.ts`, `public/sw.js`, `package.json`

## Executive Summary
Attendrix Web currently relies on **client-side Supabase reads/writes** and **Firebase Firestore** for user profile/attendance metadata. The heaviest load comes from **repeated Supabase RPC reads**, **duplicate timetable queries**, and **periodic Firestore writes** that run even when data does not change. There is existing caching (React Query for onboarding, Next ISR for downloads, PWA service worker, and localStorage helpers) but it is **inconsistent** and **not applied to core academic data**.

The fastest wins are:
1. **Eliminate redundant Supabase requests** by consolidating dashboard schedule queries and deduping with React Query/SWR.
2. **Stop periodic Firestore writes** in `useCourseTotalsSync` unless data actually changed.
3. **Move high‑frequency Supabase reads to server actions with caching** (where safe), and **avoid caching for user‑specific data** unless using private cache keys.
4. **Tighten PWA runtime caching** to avoid caching authenticated/API/Supabase responses.

---

## 1) Current Data Flow & Network Usage

### Core user flows
- **Authentication:** Firebase client auth → `POST /api/auth/login` → session cookie.
- **Dashboard:**
  - Supabase `userCourseRecords` read (client) in `src/app/dashboard/page.tsx`.
  - Timetable data via `src/hooks/useDashboardData.ts` → `src/lib/services/classes-service.ts` (multiple RPC/queries) + realtime subscriptions.
  - Periodic Supabase summary + Firestore write via `src/hooks/useCourseTotalsSync.ts`.
- **Attendance:**
  - Supabase attendance summary RPC (`get_user_course_attendance_summary`) from `src/app/attendance/page.tsx`.
  - Attendance actions (`class_check_in`, `bulk_class_checkin`, `mark_class_absent`) from `src/hooks/useAttendanceActions.ts` (client) → Firestore transaction updates.
- **Classes:**
  - Past classes RPC (`get_user_past_classes`) from `src/app/classes/page.tsx`.
  - Bulk attendance ops also call summary RPC + Firestore update.
- **Profile:**
  - Firestore user doc read via `useUserOnboardingProfile`.
  - Supabase `userCourseRecords` read.
- **Onboarding:**
  - Server actions query Supabase (service role) for batch + course data.

### Current caching/storage
- **React Query** (staleTime default 5m) for onboarding data and username availability.
- **In‑memory cache**: onboarding status in `src/lib/auth-utils.ts` (30s TTL).
- **localStorage**: preferences, download history, release cache (unused), cookie consent.
- **Next ISR**: `/download` page (revalidate = 3600s).
- **Next fetch cache**: GitHub releases (`revalidate: 3600`).
- **PWA Service Worker**: caches static assets + **GET** for `/api/*` and cross‑origin requests (see `public/sw.js`).

---

## 2) Pain Points: Excessive Reads/Writes

### Excessive Supabase reads
1. **Dashboard timetable is fetched 3x**:
   - `useTodaySchedule`, `useUpcomingClasses`, `useNextEnrolledClass` all query `timetableRecords` or RPCs and all subscribe to realtime changes.
   - Result: multiple round‑trips for the same dataset and multiple refetches per realtime event.
   - Files: `src/hooks/useDashboardData.ts`, `src/lib/services/classes-service.ts`.
2. **Attendance summary RPC is called in multiple places**:
   - `useCourseTotalsSync` (every 5 minutes + focus), `useAttendanceActions` after check‑in/absent, `src/app/attendance/page.tsx`, and bulk operations in `src/app/classes/page.tsx`.
   - Files: `src/hooks/useCourseTotalsSync.ts`, `src/hooks/useAttendanceActions.ts`, `src/app/attendance/page.tsx`, `src/app/classes/page.tsx`.
3. **`userCourseRecords` fetched repeatedly**:
   - Dashboard, Profile, Attendance actions (per check‑in/absent).
   - File: `src/lib/attendance/attendance-service.ts`, `src/app/dashboard/page.tsx`, `src/app/profile/page.tsx`.
4. **`select('*')` on large tables**:
   - `timetableRecords` and `courseRecords` are fetched with `select('*')` even when only a subset of fields are used.
   - File: `src/lib/services/classes-service.ts`.

### Excessive Firebase writes
1. **Periodic Firestore writes every 5 minutes** (and on focus) in `useCourseTotalsSync`.
   - Each write updates `coursesEnrolled` array even if no data changed.
   - File: `src/hooks/useCourseTotalsSync.ts` → `src/lib/attendance/attendance-service.ts`.
2. **Post‑action Firestore syncs** after every attendance action, even when summary values are unchanged.
   - File: `src/hooks/useAttendanceActions.ts`.

---

## 3) Caching Opportunities (By Layer)

### A) Client‑Side Caching
**High value, low complexity**
1. **React Query for Supabase data**
   - Use React Query for `userCourseRecords`, `todaySchedule`, `upcomingClasses`, and attendance summaries.
   - Provide `staleTime` (e.g., 1–5 min for schedules, 5–15 min for `userCourseRecords`).
   - Deduplicate fetches across dashboard, profile, and attendance pages.
   - Use `queryClient.invalidateQueries` on attendance actions instead of manual `refetch` calls.
2. **In‑memory cache for dashboard schedule**
   - Pull once, derive `today`, `next`, `upcoming` from the same dataset in memory.
   - One realtime subscription should update a single cache key.
3. **IndexedDB/localStorage for non‑sensitive static data**
   - Batch metadata, course catalog, elective lists (rarely change) can be stored with TTL.
   - Avoid storing attendance or user‑specific PII in localStorage.
4. **Firestore offline persistence (optional)**
   - If needed for profile data and onboarding, enable IndexedDB persistence; throttle writes to avoid sync storms.

### B) Edge / SSR Caching
**Best for public or shared data**
1. **Batch/course catalog server‑side cache**
   - Wrap `getAvailableBatches` / `getBatchOnboardingData` in `unstable_cache` or `cache()` with revalidate (e.g., 6–24h).
2. **Download page already uses ISR**
   - Keep; consider increasing revalidate if release cadence is low.
3. **Avoid shared caching for user‑specific data**
   - If server actions are added for user data, set `Cache-Control: private, max-age=...` and cache per user key.

### C) API‑Level / Data Source Caching
1. **Supabase RPC changes**
   - Add server actions that call Supabase with service role + session validation for high‑frequency data.
   - Use `unstable_cache` for public data and **per‑user** cache keys for private data.
2. **Supabase DB indexing & query optimization**
   - Add indexes for `timetableRecords(batchID, classStartTime)`, `timetableRecords(batchID, classDate)`, `attendanceRecords(userID, classID)`, `userCourseRecords(userID)`.
   - Use JSONB/array GIN index on `courseRecords.electiveScope` for `.overlaps` queries.
3. **Firebase offline mode**
   - For read‑heavy profile data, enable Firestore client persistence and reduce repeated `getDoc` calls.

### D) Data Normalization / Duplication Reduction
1. **Reduce duplicate state between Supabase & Firestore**
   - Attendance totals are maintained in both systems, with expensive sync writes.
   - Choose one source of truth and compute projections from it.
2. **Move `coursesEnrolled` totals to a dedicated collection**
   - Avoid rewriting the entire array; update only the changed course entry.
3. **Consider Supabase‑only for attendance totals**
   - Firestore could store only profile and preferences, not derived attendance summaries.

---

## 4) Repeated Fetch Hotspots (Examples)

- **Dashboard**: `useTodaySchedule`, `useUpcomingClasses`, `useNextEnrolledClass` (same table, same batch, three subscriptions).
- **Attendance summary**: called in `AttendancePage`, `ClassesPage`, `useCourseTotalsSync`, `useAttendanceActions`.
- **User course records**: fetched in Dashboard, Profile, and every attendance action.

---

## 5) Caching Options Comparison (Pros/Cons)

### React Query vs SWR
- **React Query**
  - Pros: dedupe, retries, cache invalidation, devtools, per‑query staleTime.
  - Cons: slightly more setup; must define query keys carefully.
- **SWR**
  - Pros: minimal API, great for read‑heavy fetches.
  - Cons: less structured cache invalidation for multi‑source writes.

### localStorage vs IndexedDB
- **localStorage**
  - Pros: simple, synchronous, low overhead.
  - Cons: blocking, small size, not suitable for large datasets.
- **IndexedDB**
  - Pros: async, larger storage, good for offline mode.
  - Cons: more complex, extra dependency.

### Next ISR / Route Cache
- **ISR**
  - Pros: great for public content, shared cache, edge‑friendly.
  - Cons: not safe for user‑specific data unless per‑user keying.
- **Route cache**
  - Pros: can use `cache()`/`unstable_cache` for shared backend data.
  - Cons: risk of stale sensitive data if mis‑scoped.

### Supabase caching
- **SQL/materialized views**
  - Pros: fast read models, reduces CPU‑heavy RPCs.
  - Cons: requires refresh strategy, increased complexity.

---

## 6) Priority Ranking

### High
1. **Consolidate dashboard schedule fetches** into a single cache and realtime subscription.
2. **Stop periodic Firestore sync writes unless data changed** (`useCourseTotalsSync`).
3. **Deduplicate `userCourseRecords` and attendance summary reads** using a shared client cache.
4. **Tighten PWA runtime caching** to exclude Supabase and authenticated endpoints.

### Medium
1. **Optimize Supabase queries** (avoid `select('*')`, add indexes).
2. **Add server‑side caching for onboarding batch/course data.**
3. **Use per‑user cache keys for user data if moved server‑side.**

### Low
1. **Remove unused release cache helper** or wire it into releases UI.
2. **Enable Firestore offline persistence** for profile data if offline UX matters.

---

## 7) Rough Implementation Outline (No Code)

### Phase 1: Data Dedup & Write Reduction
1. Create a `useUserCourseRecords` React Query hook with long `staleTime` and reuse across pages.
2. Replace `useTodaySchedule`, `useUpcomingClasses`, `useNextEnrolledClass` with a single cached schedule query + derived selectors.
3. Change `useCourseTotalsSync` to only write when summary changed (hash or compare fields).
4. Update attendance actions to reuse cached `userCourseRecords` and summary when possible.

### Phase 2: Query & Payload Optimization
1. Replace `select('*')` with explicit field lists for timetable/course queries.
2. Adjust Supabase RPCs to accept `enrolledCourses` server‑side filtering (no client‑side filter).
3. Add DB indexes based on the frequent filters.

### Phase 3: Edge/SSR & API Caching
1. Add `unstable_cache` around batch/course catalog server actions.
2. Add per‑user cache key if moving user data to server actions.
3. Modify `next-pwa` runtime caching to exclude Supabase domains and authenticated routes.

---

## 8) Benchmarking & Validation Plan

### Baseline metrics to capture
- Supabase query count per page load (Dashboard, Attendance, Classes).
- Firestore writes per session (should drop after Phase 1).
- TTFB and JS hydration time for Dashboard.
- Realtime event → UI refresh latency.

### How to measure
- Supabase: enable Postgres logs or Supabase query stats dashboard.
- Firebase: Firestore usage dashboard (writes/reads per day).
- Client: `performance.mark` + DevTools Performance panel.
- Add temporary logging for query counts during a test session.

---

## 9) Suggested Points of Implementation

- `src/hooks/useDashboardData.ts`: consolidate schedule hooks.
- `src/lib/services/classes-service.ts`: reduce queries + select lists.
- `src/hooks/useCourseTotalsSync.ts`: conditional updates and throttling.
- `src/hooks/useAttendanceActions.ts`: use cached `userCourseRecords` + summary.
- `src/app/actions/onboarding.ts`: add server cache for batch/course lists.
- `next.config.ts` + `public/sw.js`: adjust runtime caching policies.

---

## Appendix: Current Cache/Storage Map

- React Query: `src/providers/QueryProvider.tsx`, `src/hooks/useOnboardingData.ts`.
- In‑memory Map cache: `src/lib/auth-utils.ts`.
- localStorage: preferences, cookie consent, release/download caches.
- ISR: `src/app/download/page.tsx`.
- PWA runtime caching: `public/sw.js` (generated via `next-pwa`).
