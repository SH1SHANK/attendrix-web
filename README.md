# Attendrix Web

Attendrix Web is a Neo-Brutalist attendance, classes, and tasks companion for students, built with Next.js, Firebase, and Supabase. It provides fast attendance actions, course management, calendar sync, tasks, and a profile hub with support tooling.

Last reviewed: 2026-02-05

## About

Attendrix Web combines a modern Next.js app router frontend with Firebase-authenticated, server-verified APIs that talk to Supabase. The app focuses on correctness, speed, and a cohesive visual system while keeping data fresh through React Query caching, short-lived server responses, and a buffered Firestore write strategy.

## Features

- Attendance: check in, mark absent, bulk check-in, past classes, and summaries.
- Classes: daily schedule, upcoming classes, and date-based views.
- Tasks: read-only assignments and exams list with filters.
- Academic resources: Drive-backed course folders with favorites, recents, tags, and offline access.
- Profile: course editing, export (CSV/Markdown/PDF), calendar sync, resync tools, deactivation and deletion flows.
- Support: bug and feature reporting with image attachments and GitHub issue creation.
- PWA: installable experience with manifest and service worker.
- Caching: React Query cache profiles with runtime overrides.

## Study Materials

- Drive-backed course folders and file browsing.
- Favorites, recently opened, tagged sections, and drag-and-drop section ordering.
- Slash-based tag search with pinned tags and a mobile-safe tag manager drawer.
- Inline quick actions for star/unstar and offline access; overflow menu for secondary actions.
- Command Center (⌘/Ctrl+K) and keyboard shortcuts for fast navigation.
- Dedicated study materials settings at `/resources/settings` with cache and offline controls.
- Offline-only view at `/resources/offline`, grouped by course, tags, and recent access.
- Offline cache with storage usage indicator, cache limit slider, cleanup assistant, and manual clear.
- Offline storage mode options: web app cache (default) or a dedicated device folder with explicit permission.
- Focus Mode to hide actions and filters for distraction-free browsing.
- Offline files remain on the client only; no file blobs are synced to Firebase.

## Documentation

- Architecture: `ARCHITECTURE.md`
- API reference: `API_DOCUMENTATION.md`
- Data models: `DATA_MODELS.md`
- Design system: `DESIGN_SYSTEM.md`
- Features: `FEATURES.md`
- Routes: `ROUTES.md`
- Caching strategy: `CACHE_STRATEGY.md`
- Contributing: `CONTRIBUTING.md`
- Security: `SECURITY.md`
- Runbook: `RUNBOOK.md`
- Changelog: `CHANGELOG.md`

## Requirements

- Node.js 20+
- npm 10+
- Firebase project with Admin SDK credentials
- Supabase project with anon and service role keys

## Quick Start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Use `.env.local.example` as the source of truth. Key variables include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_FIREBASE_*` (client)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (admin)
- `GOOGLE_DRIVE_API_KEY` (server-side Drive proxy for resources)
- `NEXT_PRIVATE_GITHUB_TOKEN` (issue creation)
- `NEXT_PUBLIC_CACHE_PROFILE` (balanced | fresh | relaxed)

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Deployment

Vercel is the recommended host.

```bash
vercel --prod
```

Ensure all environment variables from `.env.local.example` are configured in the Vercel project.

## PWA Install

- Manifest: `public/manifest.json`
- Service worker: `public/sw.js`
- Install prompt hook: `src/hooks/useInstallPrompt.ts`

## Caching and Performance

- Client caching profiles are defined in `src/lib/query/cache-config.ts`.
- User-specific API responses are `Cache-Control: private, no-store`.
- Firestore attendance writes are buffered and coalesced in `src/lib/attendance/firestore-write-buffer.ts`.

## Support and Community

- Bug reports: `/support/bug`
- Feature requests: `/support/feature`
- Contact support: `/support/contact`

## Contributing

See `CONTRIBUTING.md` for local setup, branch naming, and PR guidelines.

## License

No license is currently specified. Add a `LICENSE` file to make reuse explicit.
