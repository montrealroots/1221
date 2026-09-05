# SLATE — Base44 dev environment

## What this is
A pure frontend Vite + React + TypeScript SPA ("SLATE", a life and film-industry
simulator). No backend, no database, no external services. Saves go to browser
local storage. The `base44/` directory holds optional server-side persistence
for when deployed to Base44, but it is not needed to run locally.

## Running it
```
docker compose -f docker-compose.base44.yml up -d
```
- Web entry point: host port **3000** → container Vite dev server on 5173.
- `npm install` runs on every container start (fast; deps cached in the
  bind-mounted `node_modules` volume).
- Vite dev server with live reload — edits appear without rebuilding the image.
- `server.host: true` + `allowedHosts: true` in `vite.config.ts` so the preview's
  external hostname is accepted.

## No secrets
This app needs no external credentials. All data files (geo, holidays, industry)
are committed under `public/` and served statically.

## Verifying it works
- `curl -sf http://localhost:3000/` returns the HTML shell.
- `curl -sf http://localhost:3000/src/main.tsx` returns live (unhashed) source.
- The full gate before shipping anything: `npm run validate` (typecheck + lint + tests).
