# SLATE — Base44 dev environment notes

## What this is
A pure frontend SPA (Vite + React 18 + TypeScript). The entire simulation runs in
the browser; saves persist to `localStorage`. There is **no backend required** to
run locally — the `base44/` directory (entities/functions) is for Base44 platform
deployment and is not used by the dev server.

## Running here
`docker compose -f docker-compose.base44.yml up -d` starts a `node:22` container
that bind-mounts the repo, runs `npm install`, and serves Vite on host port 3000
(container port 5173). Edits hot-reload live.

## Dev server config
`vite.config.ts` sets `server.host: true` + `allowedHosts: true` so the preview's
external hostname is accepted (Vite blocks unknown hosts by default).

## No secrets
The app needs no external credentials to run. `secrets: []` in
`.base44/environment.json`.

## Verification
- `curl -sf http://localhost:3000/` returns the Vite dev page (serves
  `/src/main.tsx`, not a prebuilt bundle).
- External-host check: `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/`
  must also return the page.
- `npm run validate` (typecheck + lint + tests) is the project's gate.
