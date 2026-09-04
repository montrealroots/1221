# SLATE — Base44 Dev Environment

## What this is
A life + film-industry simulator. Pure Vite + React + TypeScript SPA. The entire
simulation runs in the browser; saves go to local storage. No backend is needed
for local development — the Base44 persistence layer under `base44/` is optional
and only activates when deployed to the Base44 platform.

## Running
`docker compose -f docker-compose.base44.yml up -d` starts a Vite dev server on
host port 3000 (container port 5173). The source is bind-mounted, so edits hot-reload.

## No external secrets
The app needs no external credentials for local dev. The `base44/` functions
reference the Base44 SDK, which is only available on the platform — they are not
invoked in local dev.

## Verification
- `npm run validate` — typecheck + lint + tests. The gate before anything ships.
- The app serves at `/`; the preview should show the SLATE title screen.
