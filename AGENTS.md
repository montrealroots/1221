# SLATE — Base44 dev environment

## What this is
A frontend-only Vite 5 + React 18 + TypeScript SPA. The entire simulation runs
in the browser; saves go to local storage. No backend, no database, no external
services required for local development.

## Running it
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
- Node 22 base image, source bind-mounted at `/app`, deps installed on startup.
- Vite dev server on port 5173 inside the container, mapped to host port 3000.
- Live reload is active; edits appear in the preview without a restart.

## No secrets needed
`.env.example` contains `SLATE_BASE44_URL` and `SLATE_BASE44_TOKEN` — these are
only for the smoke test (`tools/base44-smoke.mjs`) and deploy, not for running
the dev server. The app plays without a backend at all.

## Verification
- `curl -s http://localhost:3000/` returns the SLATE HTML shell.
- The Vite dev server logs show successful compilation.
- `npm run validate` runs typecheck, lint, and the full test suite.

## Notes
- `vite.config.ts` has `server.host: true` and `server.allowedHosts: true` so
  the dev server accepts the preview's external hostname.
- Vite 5.4.9 — `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` is passed but unused
  (that env var is for Vite >= 6.1); the config-level settings handle host access.
