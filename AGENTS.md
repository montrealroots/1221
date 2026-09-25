# SLATE — Base44 Dev Environment

## What this is
A Vite + React + TypeScript single-page app (a life simulator). The entire simulation runs in the browser; saves go to localStorage. No backend is needed for local play.

## Running it
- `docker compose -f docker-compose.base44.yml up -d` starts the Vite dev server on host port 3000 (container port 5173).
- The container uses `node:22-slim`, bind-mounts the repo, runs `npm install` then `npx vite --host 0.0.0.0 --port 5173`.
- Live reload is active — edits to source files appear in the preview without a rebuild.

## No external secrets
The app needs no credentials to run. The `.env.example` variables (`SLATE_BASE44_URL`, `SLATE_BASE44_TOKEN`) are for the CLI smoke test and deploy only, not for the dev server.

## Vite config
`vite.config.ts` has `server.host: true` and `server.allowedHosts: true` so the preview proxy can reach the dev server.

## Verification
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` should return 200.
- The served HTML includes `/@vite/client` and `/src/main.tsx` (dev server, not prebuilt).
- `npm run validate` runs typecheck, lint, and tests inside the container if needed.
