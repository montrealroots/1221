# AGENTS.md — SLATE on Base44

## What this is

SLATE is a browser-only Vite + React + TypeScript SPA — an actor/actress life
simulator. The entire simulation runs client-side; saves go to local storage.
There is **no backend, no database, and no external service** needed for the
preview. The `base44/` directory contains server-side functions and entity
schemas for Base44 deployment, but they are not used during local dev.

## Running it

```bash
docker compose -f docker-compose.base44.yml up -d
```

- Node 22 image, source bind-mounted at `/app`.
- Vite dev server on port 5173, mapped to host port 3000.
- `npm install` runs on container start; live reload is active.
- `vite.config.ts` has `server.host: true` and `allowedHosts: true` so the
  preview proxy can reach the dev server (the sandbox hostname rotates).

## No secrets

The app needs no external credentials to run. `.env.example` contains
`SLATE_BASE44_URL` and `SLATE_BASE44_TOKEN`, but those are only for the
deploy smoke test (`tools/base44-smoke.mjs`), not for the game itself.

## Verification

- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` → 200
- The HTML includes `/@vite/client` and `/src/main.tsx` (live source, not a
  prebuilt bundle).

## Project conventions

- `npm run validate` (typecheck + lint + tests) is the gate before shipping.
- `npm run gate` runs the full verification suite (slower).
- The `@` alias points to `./src`.
- See `CLAUDE.md` for the project's permanent development blueprint.
