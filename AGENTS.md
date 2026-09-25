# AGENTS.md — Base44 dev environment for SLATE

## What this is
SLATE is a Vite + React + TypeScript single-page app (a life simulator). The
entire simulation runs in the browser; saves go to `localStorage`. There is no
backend required for local development — the `base44/` directory holds
server-side functions and entities that only matter when deployed to the
Base44 platform.

## Running it here
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Uses `node:22-slim`, bind-mounts the repo at `/app`, installs deps on startup,
  and runs `vite --host 0.0.0.0 --port 5173` with live reload.
- Host port 3000 maps to container port 5173 (the Vite dev server).
- `node_modules` lives in a named volume so host/container don't clobber each other.

## Secrets
None required for local dev. The `.env.example` variables
(`SLATE_BASE44_URL`, `SLATE_BASE44_TOKEN`) are only for the deploy smoke test
(`tools/base44-smoke.mjs`), not for the dev server.

## Verification
- `curl http://localhost:3000/` should return the Vite-served `index.html` with
  `/src/main.tsx` as an unhashed module (dev mode, not a prebuilt bundle).
- `docker compose -f docker-compose.base44.yml ps` should show the `web` service
  as `healthy`.
- The project's own gate: `npm run gate` (typecheck + lint + tests + 12 doc/code
  checks). Run it inside the container:
  `docker compose -f docker-compose.base44.yml exec -T web npm run gate`.

## Notes
- Vite 5.x — `--host 0.0.0.0` is sufficient; no `allowedHosts` config needed.
- TypeScript project references (`tsconfig.json` → `tsconfig.app.json` +
  `tsconfig.node.json`); `@` alias resolves to `./src`.
