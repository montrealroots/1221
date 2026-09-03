# SLATE — Base44 Dev Environment

## What this is

A single-page Vite + React + TypeScript app (`slate`). The entire simulation
runs in the browser; saves persist to `localStorage`. There is **no backend**
and **no external services** — no secrets are needed to boot.

The `base44/` directory contains deployment-only artifacts (entity schemas,
server functions) for when the app is deployed to the Base44 platform. They are
not used during local dev.

## Running it

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

- The `web` service uses `node:22`, bind-mounts the repo, runs `npm install`
  then `npm run dev -- --host 0.0.0.0` (Vite dev server with HMR).
- Host port **3000** maps to the container's 5173.
- `node_modules` is a named volume so installs survive container restarts.
- `CHOKIDAR_USEPOLLING=true` ensures file-watch fires under the bind mount.

## Verifying it works

```bash
curl -sf http://localhost:3000/                        # serves index.html
curl -sf -H "Host: x.example" http://localhost:3000/   # external host works
curl -sf http://localhost:3000/src/main.tsx            # live source served
```

`docker compose -f docker-compose.base44.yml ps` should show `web` as `healthy`.

## Validation gate

```bash
npm run validate   # typecheck + lint + tests (inside the container)
```

This must be clean before anything ships.

## Vite config note

`vite.config.ts` has `server.host: true` and `server.allowedHosts: true` so the
preview's external hostname is accepted. Do not remove these — the preview
serves through a proxy hostname that changes when the environment is recreated.
