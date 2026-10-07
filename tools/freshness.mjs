/**
 * Freshness, measured on saves (from 2026-10-08): how often the drama
 * school's work, notes and classmates' moments repeat, by explicit criteria
 * (`freshnessOf` in `src/engine/systems/learning.ts`), and how much history
 * the record keeps. Read on a replay's snapshots, it measures a whole played
 * life's school, not only a test's year.
 *
 *   npx vite-node tools/freshness.mjs <save.json> [<save.json> ...]
 *
 * Prints one line of JSON a save. A save without a school prints so.
 */
import { readFileSync } from 'node:fs';
import { loadSave } from '../src/engine/index.ts';
import { deserialise } from '../src/engine/persistence/adapter.ts';
import { freshnessOf } from '../src/engine/systems/learning.ts';

for (const file of process.argv.slice(2)) {
  const sim = loadSave(deserialise(readFileSync(file, 'utf8')));
  const school = sim.player.school;
  const cw = school?.coursework;
  if (!cw) { console.log(JSON.stringify({ file, school: false })); continue; }
  const notes = cw.notes ?? [];
  const moments = cw.moments ?? [];
  const sameKind = moments.filter((m, i) => i > 0 && moments[i - 1].kind === m.kind).length;
  console.log(JSON.stringify({
    file,
    standing: school.standing,
    freshness: freshnessOf(cw.assignments),
    statuses: cw.assignments.reduce((m, a) => { m[a.status] = (m[a.status] ?? 0) + 1; return m; }, {}),
    notes: { subjects: notes.length, open: notes.filter((n) => n.status === 'open').length, taken: notes.filter((n) => n.status === 'resolved').length, mostGiven: Math.max(0, ...notes.map((n) => n.given)) },
    moments: { count: moments.length, kinds: moments.reduce((m, x) => { m[x.kind] = (m[x.kind] ?? 0) + 1; return m; }, {}), sameKindRunning: moments.length > 1 ? Math.round((sameKind / (moments.length - 1)) * 1000) / 1000 : 0 },
  }));
}
