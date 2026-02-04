# Attendrix Web Security Best Practices Report

Date: 2026-02-04
Scope: Next.js (App Router), React client, Supabase + Firebase integrations.

## Executive Summary
I found **three high‑impact security risks** that require immediate attention. The most critical issue is that a real `.env` file with **live secrets** (Firebase Admin private key, Supabase service role key, Telegram bot token) is committed in the repo. Additionally, **client‑side Supabase RPC writes** appear to be performed with the **anon key** and **user‑supplied IDs**, which can allow cross‑user data access or tampering unless strict RLS/function checks exist. Finally, the **PWA service worker caches same‑origin and cross‑origin GET responses**, which can lead to stale or unintended exposure of authenticated content on shared devices.

---

## Critical Findings

### [1] NEXT-SECRETS-001 — Secrets committed in repo (.env)
- **Severity:** Critical
- **Location:** `.env` lines 10–30
- **Evidence (redacted):**
  - `FIREBASE_ADMIN_PRIVATE_KEY="***"`
  - `TELEGRAM_BOT_TOKEN=***`
  - `SUPABASE_SERVICE_ROLE_KEY=***`
- **Impact:** Anyone with repo access can take full control of Firebase Admin, Supabase service role (bypass RLS), and Telegram bot. This is a complete compromise of data and infrastructure.
- **Fix:**
  - Remove `.env` from the repo history.
  - Rotate all leaked keys immediately.
  - Store secrets in Vercel/hosting env vars or a secrets manager.
- **Mitigation:**
  - Add secret scanning in CI.
  - Keep `.env*` files ignored by git.
- **False positive notes:** None — the file is present in the repo and contains real secret values.

---

## High Findings

### [2] NEXT-AUTH-001 — Client-side Supabase RPC writes without verified server auth
- **Severity:** High
- **Location:**
  - `src/lib/attendance/attendance-service.ts` lines 38–113 (RPC writes & reads)
  - `src/lib/services/classes-service.ts` lines 24–121 (RPC reads with `user_id`/`uid`)
- **Evidence (snippets):**
  - `supabase.rpc("class_check_in", params)`
  - `supabase.rpc("mark_class_absent", params)`
  - `supabase.rpc("get_user_past_classes", { uid: userId, ... })`
- **Impact:** If RLS or RPC security checks are not strict, a malicious client can pass arbitrary `userId` and read or mutate other users’ attendance data. Even with RLS, using anon key from the client with user‑supplied IDs is a high‑risk pattern.
- **Fix:**
  - Move write operations to **server actions or route handlers** that verify the Firebase session cookie.
  - Alternatively, integrate Supabase Auth and enforce `auth.uid()` inside SQL/RPC functions and RLS policies.
- **Mitigation:**
  - Add server‑side verification inside RPCs (compare `p_user_id` to `auth.uid()` and reject mismatch).
  - Log and rate‑limit sensitive RPCs.
- **False positive notes:** If every RPC strictly checks `auth.uid()` and RLS is fully enforced, the risk is reduced. This should be verified at the database level.

---

## Medium Findings

### [3] NEXT-CACHE-001 / REACT-SW-001 — PWA service worker caches authenticated & cross‑origin GET responses
- **Severity:** Medium
- **Location:** `public/sw.js` line 1 (runtime caching rules)
- **Evidence (snippet):**
  - `registerRoute(... !a.startsWith("/api/auth/") && !!a.startsWith("/api/") ...)`
  - `registerRoute(({url:e})=>!(self.origin===e.origin), new NetworkFirst(...))`
- **Impact:** Cached responses can be served to a later session on the same device, causing stale or unintended exposure of user‑specific content. Cross‑origin GET caching can also store Supabase responses locally for longer than expected.
- **Fix:**
  - Update `next-pwa` runtimeCaching to **exclude Supabase domains** and authenticated routes from caching.
  - Use `NetworkOnly` for `/api/*` and `supabase.co` (and other private APIs).
- **Mitigation:**
  - Set `Cache-Control: no-store` on any sensitive endpoints.
  - Clear SW caches on logout.
- **False positive notes:** If all cached responses are strictly public and non‑sensitive, risk is reduced. Current rules are broad enough that this should be verified.

---

## Notes
- Next.js version is `16.1.4` (supported). Keep security patches current.
- No obvious XSS sinks (`dangerouslySetInnerHTML`) were found; markdown rendering uses `react-markdown` without raw HTML.

---

## Recommended Next Steps
1. **Immediately remove `.env` from the repo and rotate secrets.**
2. **Move Supabase write paths to server actions** and verify Firebase session cookies.
3. **Tighten PWA caching rules** for authenticated and Supabase traffic.
