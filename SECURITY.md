# Security Policy

Last reviewed: 2026-02-05

## Reporting a Vulnerability

Please do not open public issues for security reports. Contact the maintainers privately.

Suggested report details:

- Steps to reproduce
- Impact
- Affected routes or components
- Proof of concept (if available)

## Supported Versions

This project is under active development. Only the latest commit on `main` is supported.

## Security Practices

- Firebase session cookies are verified server-side.
- Supabase service role key is server-only.
- API routes validate input with zod and return standardized error shapes.
- User-specific API responses are `Cache-Control: private, no-store`.
- Issue attachments accept only images under 5MB and use a dedicated Supabase storage bucket.

## Secrets

- Never commit secrets to the repository.
- Use `.env.local` for development.
- Store secrets in Vercel environment variables for production.

## Security Checklist

- Validate all inputs server-side.
- Keep service role keys and GitHub tokens server-only.
- Audit route handlers for `no-store` responses when data is user-specific.
