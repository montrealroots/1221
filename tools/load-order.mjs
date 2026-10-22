/**
 * The built app's modules, loaded in the order the app's own bundle loads them (from 2026-10-21, the app's fifth walk).
 * Vite bundles `src/main.tsx` for the server as `npm run build` bundles it for the browser, and node imports the bundle:
 * every module's top level runs before `main.tsx`'s own, which then stops at `document`, there being no page. Any other
 * error is the bundle's, such as a constant read across an import cycle before it exists ("Cannot access … before
 * initialization"), which the suite's module runner hands back as undefined and so never sees. On 40eab86a the built app
 * was blank on every page for that reason (`projobs.ts` made a Set of `proagent.ts`'s `MEETING_KIND` as it loaded), and
 * the suite passed. Exits 0 when the modules loaded, 1 when they didn't.
 *
 * It takes an entry other than `src/main.tsx` (from 2026-10-21, brief 20's School area): a module bundled as the only
 * entry loads its own imports first, so a ring the app's own order happens to enter at a safe point is entered at
 * another. Until then only `main.tsx` was bundled, and `projobs.ts` bundled alone stopped at `coursework.ts`'s
 * `PARTNER_KIND` (read by `world/clock.ts` as it loaded, across the ring proagent → school → projobs → proagent), which
 * the handoff recorded and nothing held. An entry that isn't `main.tsx` has no page to reach for, so any error fails it.
 *
 *   node tools/load-order.mjs                                   the app's own bundle
 *   node tools/load-order.mjs src/engine/systems/projobs.ts     one module as the bundle's entry
 */
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const entry = resolve(root, process.argv[2] ?? 'src/main.tsx');
const page = /[\\/]src[\\/]main\.tsx$/.test(entry);
const { build } = await import(pathToFileURL(resolve(root, 'node_modules/vite/dist/node/index.js')).href);
// Inside the repository's node_modules, so the bundle's own imports (react and the rest) resolve from it.
const cache = resolve(root, 'node_modules/.cache');
mkdirSync(cache, { recursive: true });
const out = mkdtempSync(join(cache, 'load-order-'));
try {
  await build({
    configFile: false, logLevel: 'error',
    resolve: { alias: { '@': resolve(root, 'src') } },
    build: { ssr: entry, outDir: out, emptyOutDir: false, target: 'es2022', minify: false, rollupOptions: { output: { format: 'es', entryFileNames: 'bundle.mjs' } } },
  });
  let why;
  try { await import(pathToFileURL(join(out, 'bundle.mjs')).href); } catch (e) { why = e; }
  const loaded = !why || (page && why instanceof ReferenceError && /\b(document|window) is not defined\b/.test(why.message));
  console.log(loaded ? `modules loaded${why ? `: main.tsx stopped at "${why.message}", there being no page` : ''}` : `modules didn't load: ${why}`);
  process.exitCode = loaded ? 0 : 1;
} finally {
  rmSync(out, { recursive: true, force: true });
}
