/**
 * Writes brief 21's genre proof table (`genre-proof.json`, `genre-proof.md`) from the scenarios
 * `tests/b21-genre-proof.test.ts` asserts (`tests/setup/genre-proof.ts`): for every path and material, each seed's genre
 * part, the choices' preparation and quality, and the whole, at each record; and the spread over the seed set of what
 * the most that counts adds to the whole over knowing none. Run: npx vite-node docs/verification/genre-banking-2026-10-22/genre-proof.ts
 */

import { writeFileSync } from 'node:fs';
import {
  LEVELS, PATHS, PLAYS, PRO_PATHS, PROJECTS_READ, SCHOOL_PATHS, SEEDS, UNRELATED, actor, atLevel, casting, knowing, listed, rehearsalLines,
  type Known, type Material,
} from '../../../tests/setup/genre-proof';

const DIR = 'docs/verification/genre-banking-2026-10-22';
const records = (m: Material): Record<string, Known> => ({
  low: atLevel(m, LEVELS.low), medium: atLevel(m, LEVELS.medium), max: atLevel(m, LEVELS.max),
  'one mastered': { ...atLevel(m, 0), [m.needs[0]![0]]: 100 }, 'all mastered': atLevel(m, 100), unrelated: { [UNRELATED]: 100 },
});
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2; };
const r1 = (x: number) => Math.round(x * 10) / 10;
const r3 = (x: number) => Math.round(x * 1000) / 1000;

const sims = SEEDS.map((seed) => actor(seed));
const rows: unknown[] = [];
const md: string[] = [
  '# Brief 21\'s Genre Proof, The Table',
  '',
  'Written by `genre-proof.ts` from the scenarios `tests/b21-genre-proof.test.ts` asserts. The same actor on the same day,',
  'with the same preparation and the same draw, read with only the genres they know changed. Seeds: ' + SEEDS.map((s) => `\`${s}\``).join(', ') + '.',
  `Records: every relevant genre at ${LEVELS.low} (low), ${LEVELS.medium} (medium) and ${LEVELS.max} (the most that counts); the first`,
  'requirement at 100 and the rest at 0 (one mastered); all at 100; and only an unrelated genre (`' + UNRELATED + '`) at 100.',
  '',
  'Each cell is the whole (the overall, 0 to 100) over the six seeds, low to high; the genre part and the choices\'',
  'preparation are the first seed\'s, with the choices\' quality in brackets. "Adds" is what the most that counts adds to the',
  'whole over knowing none: the smallest, the median and the largest over the seeds.',
  '',
  '| Path | Material | Shape | Low | Medium | Max | One mastered | All mastered | Unrelated | Part at low, max | Prepared at low, max | Adds: least, median, most |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|',
];
const cases = [...SCHOOL_PATHS.flatMap((path) => PLAYS.map((m) => ({ path, m }))), ...PRO_PATHS.flatMap((path) => PROJECTS_READ.map((m) => ({ path, m })))];
for (const { path, m } of cases) {
  const by: Record<string, { part: number; prepared?: number; interpretation?: number; overall: number }[]> = {};
  for (const sim of sims) for (const [name, known] of Object.entries(records(m))) (by[name] ??= []).push(listed(m, () => knowing(sim.player, known, () => PATHS[path](sim, m))));
  const span = (name: string) => { const xs = by[name]!.map((r) => r.overall); return `${r1(Math.min(...xs))}–${r1(Math.max(...xs))}`; };
  const adds = by.max!.map((r, i) => r.overall - by.low![i]!.overall);
  const first = (name: string) => by[name]![0]!;
  rows.push({ path, material: m.name, shape: m.shape, needs: m.needs, bySeed: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, v.map((r, i) => ({ seed: SEEDS[i], ...r }))])), adds: { least: r1(Math.min(...adds)), median: r1(median(adds)), most: r1(Math.max(...adds)) } });
  const part = path === 'school casting' ? '(the fit)' : `${r3(first('low').part)}, ${r3(first('max').part)}`;
  const prep = path === 'school casting' ? '' : `${r3(first('low').prepared!)} (${first('low').interpretation}), ${r3(first('max').prepared!)} (${first('max').interpretation})`;
  md.push(`| ${path} | ${m.name} | ${m.shape} | ${span('low')} | ${span('medium')} | ${span('max')} | ${span('one mastered')} | ${span('all mastered')} | ${span('unrelated')} | ${part} | ${prep} | ${r1(Math.min(...adds))}, ${r1(median(adds))}, ${r1(Math.max(...adds))} |`);
}

md.push('', '## Casting\'s Reading And A Rehearsal Day', '', '| Project | Genre half, low / medium / max | Fit, low / max (first seed) | Chance of a Strong final round, low / max (first seed) | A rehearsal day\'s lines from none, low / max |', '|---|---|---|---|---|');
const castRows: unknown[] = [];
for (const m of PROJECTS_READ) listed(m, () => {
  const sim = sims[0]!;
  const at = (known: Known) => knowing(sim.player, known, () => casting(sim, m));
  const [low, med, max] = [at(atLevel(m, 0)), at(atLevel(m, LEVELS.medium)), at(atLevel(m, LEVELS.max))];
  const lines = [knowing(sim.player, atLevel(m, 0), () => rehearsalLines(sim, m)), knowing(sim.player, atLevel(m, LEVELS.max), () => rehearsalLines(sim, m))];
  castRows.push({ material: m.name, low, medium: med, max, lines });
  md.push(`| ${m.name} | ${low.genre} / ${med.genre} / ${max.genre} | ${low.fit} / ${max.fit} | ${low.chance} / ${max.chance} | ${lines[0]} / ${lines[1]} |`);
});

writeFileSync(`${DIR}/genre-proof.json`, `${JSON.stringify({ seeds: SEEDS, levels: LEVELS, unrelated: UNRELATED, paths: rows, casting: castRows }, null, 1)}\n`);
writeFileSync(`${DIR}/genre-proof.md`, `${md.join('\n')}\n`);
console.log(`Wrote ${DIR}/genre-proof.json and genre-proof.md: ${rows.length} path and material pairs, ${SEEDS.length} seeds.`);
