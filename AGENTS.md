# AGENTS.md — SLATE on Base44

## What this app is

SLATE is a frontend-only Vite + React + TypeScript single-page app. The entire
simulation runs in the browser; saves go to localStorage by default. The
`base44/` directory contains entities and server functions for server-checked
persistence when deployed to Base44, but the app runs without any backend.

## Running it

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

- Node 22 (`node:22-slim`) with the repo bind-mounted at `/app`.
- `npm install` runs at container start, then `npx vite --host 0.0.0.0`.
- Vite dev server (live reload) on container port 5173, mapped to host port 3000.
- No database, no backend, no external secrets required.

## Verifying it works

- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200
- The page should include `<script type="module" src="/src/main.tsx">` and
  Vite's `@react-refresh` / `@vite/client` injection (confirms live dev server,
  not a prebuilt bundle).

## Project conventions

- `npm run validate` (typecheck + lint + tests) is the gate; it must be clean.
- `npm run gate` runs additional custom checks (title-case, label-sweep, etc.).
- TypeScript path alias `@` → `src/`.
- No `Date.now()` anywhere — the lint rules fail the build if it appears.
