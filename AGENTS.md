# SLATE — Base44 Dev Environment

## What this is

A single-page Vite + React + TypeScript app. The entire simulation runs in the
browser; saves go to localStorage. There is **no backend** required for local
development — the `base44/` directory contains server-side functions/entities
used only when deployed to the Base44 platform.

## Running it here

```bash
docker compose -f docker-compose.base44.yml up -d
```

- Web entry point: host port **3000** → container port 5173 (Vite dev server).
- The container runs `npm install` then `npx vite --host 0.0.0.0 --port 5173`.
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` is set because Playwright is a dev
  dependency used only by the screenshot/audit tools, not the dev server.
  Skipping its browser download saves significant startup time.
- Node modules live in a named volume (`node_modules`) so they persist across
  restarts.

## No secrets needed

The app is fully client-side for local dev. No external API keys or database
credentials are required to boot.

## Vite config note

`vite.config.ts` has `server.host: true` and `server.allowedHosts: true` so the
preview's external hostname is accepted. Without `allowedHosts: true`, Vite
blocks the preview proxy hostname.

## Validation gate

```bash
npm run validate   # typecheck + lint + tests — must be clean before shipping
```
