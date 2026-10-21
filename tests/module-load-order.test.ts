/**
 * GUARD: the built app's modules load in the bundle's own order (from 2026-10-21, the app's fifth walk). The career's
 * systems import one another in a ring, `proagent.ts` → `school.ts` → `projobs.ts` → `proagent.ts`, and in the bundle a
 * module in a ring can run before one it imports has. On 40eab86a `projobs.ts` made a Set of `MEETING_KIND` as it loaded,
 * and the built app was blank on every page with `Cannot access 'MEETING_KIND' before initialization`. The suite passed:
 * its module runner hands a binding read too early back as undefined. `tools/load-order.mjs` bundles `src/main.tsx` as
 * the build does and imports it in node, so the modules run as the browser runs them.
 */
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';

describe('the built app’s modules', () => {
  it('load in the bundle’s own order, every module’s top level run before main.tsx reaches for the page', () => {
    const run = spawnSync(process.execPath, ['tools/load-order.mjs'], { encoding: 'utf8', timeout: 240_000 });
    expect(run.stdout.trim(), run.stderr).toMatch(/^modules loaded/);
    expect(run.status).toBe(0);
  }, 300_000);
});
