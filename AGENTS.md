# SLATE — Base44 Dev Environment

## What this is
A Vite + React + TypeScript SPA ("SLATE" — a life and film/television universe simulator). The entire simulation runs in the browser; saves go to local storage. No backend is needed for local play. The `base44/` directory contains optional server-side functions for deployed persistence, but they are not required for the dev preview.

## Running it
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Node 22 base image, source bind-mounted at `/app`.
- `npm install` runs on container start, then `npx vite --host 0.0.0.0 --port 5173`.
- Vite dev server (with HMR) is mapped to host port 3000.
- `npm install` takes ~5 minutes on first boot (playwright is a heavy devDependency).

## Vite config
`vite.config.ts` has `server.host: true` and `server.allowedHosts: true` so the preview's external hostname is accepted.

## No secrets required
The app runs entirely client-side. No external service credentials are needed.

## Verification
- `curl -sf http://localhost:3000/` returns the Vite-served HTML with `/src/main.tsx`.
- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` also works (host check passes).

## Tests
```bash
npm test          # vitest run
npm run validate  # typecheck + lint + tests
```
