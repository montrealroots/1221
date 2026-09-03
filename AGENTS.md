# SLATE — Base44 Dev Notes

## What this is

A Vite + React + TypeScript single-page app — a life and film-industry simulator.
The entire simulation runs in the browser; saves go to local storage by default
and to Base44 entities when the SDK is present (it is not in local dev).

## Running it

```bash
docker compose -f docker-compose.base44.yml up -d
```

- Node 22 base image, source bind-mounted at `/app`.
- `npm install` runs at container startup, then `vite` dev server on port 5173.
- Host port 3000 maps to container port 5173.
- `vite.config.ts` has `server.host: true` and `allowedHosts: true` so the
  preview's external hostname is accepted.
- File-watch polling is enabled (`CHOKIDAR_USEPOLLING=true`) for bind mounts.

## No external secrets

The app needs no credentials for local development. It degrades to local storage
when the Base44 SDK is absent (which it is in this dev environment).

## Validation

```bash
npm run validate   # typecheck + lint + tests — the gate before shipping
```

## Structure

- `src/engine/` — the simulation (core, domain, systems, persistence).
- `src/ui/` — React components.
- `src/app/` — top-level app shell and game context.
- `base44/` — Base44 entity schemas and backend functions (not used in local dev).
- `tests/` — test suite.
