// Brief 23 (R3). Every older save brief 23's walk and tests open, loaded on this build: its schema as stored, after loading, a day
// played on, saved and loaded again. Run: npx vite-node docs/verification/ui-2026-10-23/app/save-compat.ts
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { loadSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { MS_DAY } from '@/engine/core/time';
const dirs = ['tests/fixtures', 'tests/fixtures/b22', 'docs/verification/career-genre-2026-10-22/app/saves', 'docs/verification/ui-2026-10-23/app/saves'];
for (const d of dirs) for (const f of readdirSync(d).filter((x) => x.endsWith('.json.gz'))) {
  const path = `${d}/${f}`;
  try {
    const text = gunzipSync(readFileSync(path)).toString('utf8');
    const raw = (JSON.parse(text) as { meta?: { schemaVersion?: number } }).meta ?? {};
    const sim = loadSave(deserialise(text) as never);
    const before = sim.now;
    sim.advanceTo(sim.now + MS_DAY, { stopOnPlayerRequired: false } as never);
    const again = loadSave(deserialise(serialise(sim.universe)) as never);
    console.log(`${path}: stored ${raw.schemaVersion ?? '?'}, now ${again.universe.meta.schemaVersion} (engine ${SAVE_SCHEMA_VERSION}); a day on ${again.now - before === MS_DAY ? 'played' : `moved ${(again.now - before) / 3600000} h`}, saved and loaded again`);
  } catch (e) { console.log(`${path}: FAILED ${String(e).slice(0, 200)}`); }
}
