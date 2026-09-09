# SLATE — Base44 Dev Environment

## What this is
A pure frontend Vite + React + TypeScript single-page app (an actor/actress life
simulator). The entire simulation runs in the browser; saves go to local storage.
No backend is needed to run the preview.

## Running it
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
The Vite dev server listens on port 5173 inside the container, mapped to host
port 3000. The first boot runs `npm install` then `npm run dev`.

## Key facts
- **No external secrets required.** The app runs standalone in the browser.
  `SLATE_BASE44_URL` and `SLATE_BASE44_TOKEN` in `.env.example` are for the
  deploy smoke test only, not for the dev server.
- **Vite host config:** `vite.config.ts` sets `server.host: true` and
  `allowedHosts: true` so the preview proxy's hostname is accepted.
- **Node modules** are stored in a named volume (`node_modules`) to avoid
  clobbering the bind mount.
- `npm run validate` is the project gate (typecheck, lint, tests).

## Verifying it works
```bash
docker compose -f docker-compose.base44.yml ps
curl -s http://localhost:3000/ | head -5
```
The page should serve the SLATE `index.html` with the Vite client script.
