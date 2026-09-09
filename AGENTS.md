# SLATE — Base44 Dev Environment

## What this is

A Vite + React + TypeScript single-page app (life/film-industry simulator).
The entire simulation runs in the browser — no backend, no database, no external
services. Saves go to localStorage by default; server-checked persistence is an
optional Base44 deploy feature (under `base44/`).

## Running it

```bash
docker compose -f docker-compose.base44.yml up -d
```

- Vite dev server on port 5173, mapped to host port 3000.
- `npm install` runs automatically at container start.
- Live reload via Vite HMR (polling enabled for bind-mount compatibility).
- No credentials or secrets needed — the `.env.example` vars are only for the
  deploy smoke test (`tools/base44-smoke.mjs`), not the dev server.

## Verification

- `curl http://localhost:3000/` returns the HTML shell with `/@vite/client` (dev mode).
- `curl http://localhost:3000/src/main.tsx` returns transformed source (not a hashed bundle).
- Healthcheck: `GET /` on port 5173 inside the container.

## Project structure

- `src/` — app entry (`main.tsx`), UI components, simulation engine, styles.
- `base44/` — Base44 deploy config (entities, functions, shared guards).
- `tools/` — validation/coverage scripts (the `gate` script runs all of them).
- `tests/` — vitest test suite.

## Validation

```bash
npm run validate   # typecheck + lint + tests
npm run gate       # full content coverage gate (many tool scripts)
```
