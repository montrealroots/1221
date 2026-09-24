/**
 * The layout audit, end to end: serves the built app with Vite's preview
 * server, runs tools/ui-audit.mjs against it, and stops the server.
 *
 *   npm run audit        (builds first, then runs this)
 *
 * It was one shell line, `npx vite preview --port 4173 & sleep 3; node
 * tools/ui-audit.mjs ui-audit; ... kill %1`, which only bash could run: under
 * cmd.exe, where npm runs scripts on Windows, it hung. The server is started
 * in this process now, and is listening before the audit starts rather than
 * three seconds after it was asked to.
 */

import { spawn } from 'node:child_process';
import { preview } from 'vite';

const PORT = 4173;

const server = await preview({ preview: { port: PORT, strictPort: true, open: false } });
const url = (server.resolvedUrls?.local?.[0] ?? `http://localhost:${PORT}/`).replace(/\/$/, '');

const code = await new Promise((resolve) => {
  const audit = spawn(process.execPath, ['tools/ui-audit.mjs', 'ui-audit'], {
    stdio: 'inherit',
    env: { ...process.env, SLATE_URL: url },
  });
  audit.on('error', () => resolve(1));
  audit.on('exit', (exit) => resolve(exit ?? 1));
});

await server.close();
process.exit(code);
