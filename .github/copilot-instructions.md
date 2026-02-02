# Copilot Instructions (Attendrix)

## Big picture

- Next.js 15 App Router with React 19 + Tailwind 4; global providers live in src/app/layout.tsx (TanStack Query, AuthProvider, Toaster, CookieConsent).
- Landing page is a client component in src/app/page.tsx using GSAP and dynamic imports for below-the-fold sections.

## Auth/session model (hybrid Firebase + Supabase)

- Client auth flows are orchestrated in src/context/AuthContext.tsx: Firebase sign-in -> POST /api/auth/login -> redirect.
- Server is source of truth: session cookie is \_\_session; created/cleared in src/app/api/auth/login/route.ts and src/app/api/auth/logout/route.ts.
- Use server utilities in src/lib/auth-session.ts and src/lib/auth-guard.ts for verification; middleware.ts only checks cookie presence and only runs on protected matchers.
- Onboarding checks read Firestore (src/lib/auth-utils.ts) and redirect logic lives in AuthContext.

## Data access patterns

- Browser Supabase client is created in src/utils/supabase/client.ts (anon key only).
- Server actions use Supabase service role key for admin queries; see src/app/actions/onboarding.ts.

## UI/structure conventions

- Feature sections in src/components/sections; shared Neo‑Brutalist primitives in src/components/retroui.
- Animations are centralized under src/animations and GSAP is registered in page-level components.

## Workflows & env

- Primary commands: npm run dev | build | start | lint (see README.md).
- Required env vars are in .env.local (Firebase client + admin creds, Supabase URL/keys). Firebase private key must preserve newlines.
