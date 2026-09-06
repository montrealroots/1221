# SLATE — Base44 dev notes

## What this is
Vite + React + TypeScript single-page app (`slate`). A life and film-industry
simulator. The whole simulation runs in the browser; saves go to local storage.
There is **no backend** in dev mode — the `base44/` functions/entities are for
server-checked persistence when deployed to Base44, and are not needed to run
the preview.

## Running it
`docker compose -f docker-compose.base44.yml up -d` brings up a single `web`
service: `node:22` base image, repo bind-mounted at `/app`, runs
`npm install && npm run dev -- --host 0.0.0.0 --port 5173`. Host port 3000 maps
to container 5173. Vite live-reloads on edit (polling enabled for the bind mount).

No external secrets are required — the app is fully client-side.

## Vite config
`vite.config.ts` sets `server.host: true`, `server.allowedHosts: true`, and
`server.watch.usePolling: true` so the preview's external hostname is accepted
and edits hot-reload through the bind mount. Do not remove these.

## Verifying
- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/`
  must return the app HTML (not a Vite "blocked request" page).
- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/src/main.tsx`
  must return 200 — confirms the dev server serves live source, not a prebuilt bundle.

## Repo gate
`npm run validate` (typecheck + lint + tests) is the project's gate. Run it
inside the container if you want to check before shipping:
`docker compose -f docker-compose.base44.yml exec web npm run validate`.
