# SLATE — Base44 Dev Environment

## What this is

SLATE is a Vite 5 + React 18 + TypeScript single-page app — an actor/actress life
simulator. The entire simulation runs in the browser; saves go to localStorage.
No backend is needed for local development.

## Running it

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

- The Vite dev server runs on port 5173 inside the container, mapped to host
  port 3000.
- `npm install` runs at container startup (node_modules in a named volume so
  the bind mount doesn't shadow them).
- Live reload is active — edits to source files appear in the preview without
  a rebuild.

## No secrets required

The app boots without any external credentials. The `.env.example` variables
(`SLATE_BASE44_URL`, `SLATE_BASE44_TOKEN`) are only used by the CLI smoke test
tool (`tools/base44-smoke.mjs`), not by the app itself.

## Vite host config

`vite.config.ts` has `server.host: true` and `server.allowedHosts: true` so the
preview proxy's external hostname is accepted. The `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`
env var is also passed through from the platform.

## Verification

- `curl localhost:3000` should return the SLATE HTML shell.
- The app renders a startup screen with three save slots.
- `npm run validate` runs typecheck + lint + tests.
- `npm run gate` is the full verification gate (validate + 15 doc/code checks; 16 until catalog-coverage left it on 2026-10-09).
