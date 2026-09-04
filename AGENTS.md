# SLATE — Base44 dev environment

SLATE is a single-page app: Vite + React 18 + TypeScript. The entire simulation
runs in the browser. There is no backend and no external-service dependency —
saves persist to local storage. No secrets are required.

## Running

```bash
docker compose -f docker-compose.base44.yml up -d
```

- Web entry point is host port **3000** → container 5173 (Vite dev server).
- `vite.config.ts` sets `server.host: true` and `allowedHosts: true` so the
  preview's external hostname is accepted.
- `node_modules` lives in a named volume; `npm install` runs on container start.
- Live reload is enabled (polling via `CHOKIDAR_USEPOLLING=1` for bind mounts).

## Verify it works

```bash
curl -sf -H "Host: external-preview.example.com" http://localhost:3000/
```

Should return the HTML with `/src/main.tsx` (live source, not a built bundle).

## Validation gate

```bash
docker compose -f docker-compose.base44.yml exec web npm run validate
```

Runs typecheck, lint, and the vitest suite. Must be clean before shipping.

## Notes

- Static data (`public/industry`, `public/geo`, `public/holidays`) is fetched
  at runtime via `import.meta.env.BASE_URL`.
- The `base44/` directory holds Base44 entity/function definitions for deployed
  persistence; they are not used by the local dev server.
