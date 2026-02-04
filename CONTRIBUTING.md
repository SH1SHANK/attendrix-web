# Contributing to Attendrix Web

Thanks for your interest in improving Attendrix Web.

## Development Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Branching

- Use short, descriptive branch names.
- Prefix automated or tool-created branches with `codex/`.

## Code Style

- TypeScript-first.
- Keep UI consistent with the Neo-Brutalist design system.
- Prefer React Query for data fetching.
- Keep API responses in `{ ok: true, data }` or `{ error: { code, message } }` format.

## Testing

```bash
npm run lint
npm run build
```

## Pull Requests

- Include a clear summary of changes.
- Link related issues when applicable.
- Note any new environment variables.

## Security

If you find a security issue, do not open a public issue. Use the guidance in `SECURITY.md`.
