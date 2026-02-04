# Attendrix Cache Strategy

Last updated: 2026-02-04

## Goals
- Reduce duplicate Supabase reads and Firestore writes.
- Keep user-visible data fresh without aggressive polling.
- Provide safe defaults with tunable TTLs at runtime.

## Profiles
Cache profile is selected via `NEXT_PUBLIC_CACHE_PROFILE`:
- `balanced` (default)
- `fresh`
- `relaxed`

### Balanced (default)
- Dashboard schedule: 60–120s (default 90s)
- Attendance summary: 2–3 min (default 150s)
- User course records: 30–60 min (default 45 min)
- Past classes: 2–5 min (default 3 min)
- Classes by date: 2–5 min (default 3 min)

### Fresh
- Dashboard schedule: 15–30s
- Attendance summary: ~1 min
- User course records: 10–20 min
- Past classes / classes-by-date: ~90s

### Relaxed
- Dashboard schedule: 3–5 min
- Attendance summary: 5–10 min
- User course records: 2–4 hours
- Past classes / classes-by-date: 6–10 min

## Runtime Overrides (Dev Only)
To experiment without recompiling, set:
```
localStorage.setItem(
  "attendrix.cacheOverrides",
  JSON.stringify({
    dashboardSchedule: { staleTimeMs: 60000 },
    attendanceSummary: { staleTimeMs: 120000 },
  })
)
```
Overrides are ignored in production.

## When to Use `no-store`
- User-specific endpoints (`/api/attendance/*`, `/api/user/*`) always return `Cache-Control: private, no-store`.
- Client-side cache handles short-lived staleness; server responses are not shared.

## Rationale by Query Type
- **Dashboard schedule**: time-sensitive + realtime invalidation; short staleTime prevents frequent refetch while keeping UI current.
- **Attendance summary**: derived from authoritative records; cached briefly, refreshed after attendance actions.
- **User course records**: rarely change after onboarding; long staleTime and large GC window.
- **Past classes / Classes by date**: moderate churn; keep previous data during filter changes and revalidate in background.

## Testing Sync Conflicts (Offline → Reconnect)
1. Open DevTools → Network → Offline.
2. Trigger a check-in or mark absent.
3. Confirm UI updates optimistically.
4. Set network back to Online.
5. Confirm buffered flush logs + data sync.

## Notes
- Firestore write buffer uses a short coalescing window and an urgent flush path for attendance actions.
- Metrics are stored in a bounded localStorage ring buffer (`attendrix.metrics`) and in-memory counters.
