# Attendrix Web Runbook

Last reviewed: 2026-02-05

## Common Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Deployment (Vercel)

1. Ensure production environment variables are set in Vercel.
2. Push to the deployment branch or use Vercel CLI.
3. Verify `/` and `/dashboard` load and API routes respond.

## Smoke Tests

- Sign in and reach `/dashboard`.
- Load `/attendance` and verify schedule and summary.
- Load `/tasks` and confirm tasks fetch.
- Open `/profile` and verify calendar sync section.
- Submit a bug report form with an image attachment.

## Incidents

### Auth Failures

Symptoms:

- All API routes return `UNAUTHORIZED`.

Actions:

- Verify Firebase Admin env vars.
- Confirm session cookie in browser storage.
- Check `/api/auth/login` response.

### Supabase Errors

Symptoms:

- API routes return `SUPABASE_ERROR`.

Actions:

- Validate `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Check Supabase logs and RPC availability.
- Verify Row Level Security policies.

### PWA or Service Worker Issues

Symptoms:

- Install prompt not shown
- Stale assets

Actions:

- Check `public/manifest.json` and `public/sw.js`.
- Clear site data and retry.
- Ensure `next-pwa` is not disabled in production.

## Rollback Strategy

- Revert to a known good commit and redeploy.
- Clear cached assets in Vercel if needed.

## Data Safety

- Firestore is authoritative for user course enrollment.
- Use `/api/profile/resync` to reconcile Supabase user course records.
