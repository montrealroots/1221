/**
 * SLATE — L3-R judged from the journeys' traces (from 2026-10-16, brief 10; docs/verification/decisions-2026-10-16/
 * criteria.md, L3-R). `tools/brief-journeys.ts -- --trace` measures each journey; `tools/monotonicity.ts` sweeps (d); this
 * reads every `l3-trace-<profile>-<seed>.json` and `monotonicity.json` in a folder and applies each clause as written.
 *
 *   node tools/l3r.mjs <folder>
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('node tools/l3r.mjs <folder>'); process.exit(2); }
const traces = readdirSync(dir).filter((f) => /^l3-trace-.+\.json$/.test(f)).map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8'))).filter((t) => t.l3r);
const r3 = (x) => Math.round(x * 1000) / 1000;
const journeys = traces.map((t) => ({
  profile: t.profile, seed: t.seed, days: t.days,
  fixedSetMean: t.l3r.fixedSet.byPoint, growth: r3(t.l3r.fixedSet.growth), growthMet: t.profile === 'mastered' || t.l3r.fixedSet.growth >= 1.0,
  falls: t.l3r.falls.falls, unexplained: t.l3r.falls.unexplained, steps: t.l3r.falls.steps, fellAbilities: [...new Set(t.l3r.falls.list.flatMap((f) => f.fell))],
  replayedTakes: { start: t.controlled[0]?.meanOfEveryTake, end: t.controlled.at(-1)?.meanOfEveryTake },
  journeyMetric: t.l3r.journeyMetric, mix: t.l3r.mix,
}));
const profiles = [...new Set(journeys.map((j) => j.profile))];
const seedsOf = (p) => new Set(journeys.filter((j) => j.profile === p).map((j) => j.seed)).size;
const mono = existsSync(join(dir, 'monotonicity.json')) ? JSON.parse(readFileSync(join(dir, 'monotonicity.json'), 'utf8')) : undefined;
const verdict = {
  a: { met: traces.every((t) => t.l3r.fixedSet.pieces === 24), pieces: [...new Set(traces.map((t) => t.l3r.fixedSet.pieces))] },
  b: { met: ['beginner', 'developing', 'specialist', 'generalist'].every((p) => profiles.includes(p) && seedsOf(p) >= 2) && journeys.every((j) => j.days >= 120), journeys: journeys.length, profiles: Object.fromEntries(profiles.map((p) => [p, seedsOf(p)])) },
  c: { met: journeys.every((j) => j.growthMet && j.unexplained === 0), growth: Object.fromEntries(journeys.map((j) => [`${j.profile} ${j.seed}`, j.growth])), least: r3(Math.min(...journeys.filter((j) => j.profile !== 'mastered').map((j) => j.growth))), falls: journeys.reduce((t, j) => t + j.falls, 0), unexplained: journeys.reduce((t, j) => t + j.unexplained, 0), fellAbilities: [...new Set(journeys.flatMap((j) => j.fellAbilities))] },
  d: mono ? { met: mono.met, checks: mono.checks, pieces: mono.pieces, falls: mono.falls, worst: mono.worst } : { met: null, note: 'no monotonicity.json in this folder' },
  e: { met: journeys.every((j) => j.journeyMetric && Object.keys(j.mix).length > 0), l3AsWritten: Object.fromEntries(journeys.map((j) => [`${j.profile} ${j.seed}`, `${j.journeyMetric.firstMonth?.mean} → ${j.journeyMetric.lastMonth?.mean}: ${j.journeyMetric.l3AsWritten}`])) },
};
const out = { criterion: 'L3-R (docs/verification/decisions-2026-10-16/criteria.md)', verdict, met: Object.values(verdict).every((v) => v.met === true), journeys };
writeFileSync(join(dir, 'l3r.json'), `${JSON.stringify(out, null, 1)}\n`);
for (const [k, v] of Object.entries(verdict)) console.log(`L3-R (${k}) ${v.met === null ? '—' : v.met ? 'Meets' : 'FAILS'}  ${JSON.stringify(v).slice(0, 400)}`);
console.log(`L3-R ${out.met ? 'Meets' : 'FAILS'}`);
