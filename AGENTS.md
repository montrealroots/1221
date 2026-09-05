# SLATE — Base44 dev environment

## What this is
A Vite + React + TypeScript single-page app ("SLATE", a life/film-industry
simulator). The whole simulation runs in the browser; saves go to local
storage. There is **no backend** for local play — the `base44/` directory
holds platform-side entities/functions for deployed persistence, but the
preview runs purely off the Vite dev server.

## Running it
- `docker compose -f docker-compose.base44.yml up -d` starts the Vite dev
  server (node:22 base image, repo bind-mounted at /app) on host port 3000.
- `npm install` runs inside the container on first boot; deps live in a named
  volume so they survive restarts.
- The dev server binds 0.0.0.0 and `allowedHosts: true` (set in vite.config.ts)
  so the preview's external hostname is accepted.

## Verifying it works
- `curl -sf http://localhost:3000/` returns the index.html with the Vite client
  injected (live source, not a prebuilt bundle).
- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/`
  must also succeed (external-host check).

## No secrets
No external-service credentials are required. Local storage is the only
persistence layer in the preview.

## Project gate
`npm run validate` (typecheck + lint + tests) must be clean before shipping.
