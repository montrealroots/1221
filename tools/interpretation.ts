/**
 * SLATE — a way of playing read against the scene, measured against the criteria written before it was tuned (from
 * 2026-10-16; docs/verification/interpretation-2026-10-16/criteria.md, `systems/interpretation.ts`).
 *
 * Each criterion is reported on the briefs written for their genre first (`brief-<genre>`, the ones looked at while the
 * strengths were set) and, held out, on the further briefs (`brief-<genre>-2` and on), which weren't. `--off` sets the
 * grain's strength and its rehearsal shift to 0: the way of playing as it was before, which the criteria should fail.
 *
 *   npx vite-node tools/interpretation.ts -- [--off] [--out file.json] [--md file.md]
 */
import { writeFileSync } from 'node:fs';
import { BRIEFS, type Brief } from '../src/engine/content/briefs';
import { ABILITY_DEFS, MASTERED } from '../src/engine/content/abilities';
import { AXES } from '../src/engine/content/approaches';
import { GRAIN } from '../src/engine/content/interpretation';
import type { Axis, AxisValue } from '../src/engine/content/material';
import type { Person } from '../src/engine/domain/model';
import { briefContext, briefMaterial, briefPiece, sceneOf, readingOf, type BriefRecord } from '../src/engine/systems/briefs';
import type { Evaluation, Performer } from '../src/engine/systems/evaluation';
import { judgePiece } from '../src/engine/systems/piece';
import { misfitOf, type Playing } from '../src/engine/systems/material';
import { suitabilityOf } from '../src/engine/systems/interpretation';

const flag = (n: string) => process.argv.includes(`--${n}`);
const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1]! : d; };
if (flag('off')) Object.assign(GRAIN as Record<string, number>, { strength: 0, prep: 0 });

const SEED = 'interpretation';
const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const rec = (p: number): BriefRecord => ({ prep: { interpretation: p, memorization: p, rehearsal: p }, takes: [] });
const actor = (ab: Partial<Record<string, number>>, fill: number): Performer => ({ ability: (id) => ab[id] ?? fill, full: () => 100, technique: () => 50 });
const MASTER: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
const EVEN = actor({}, 55);
// What expansive draws on (`APPROACH_EFFECT.expansive`), high; the rest under the even actor.
const EXPANSIVE_SPECIALIST = actor({ presence: 80, vocal: 80, physical: 80 }, 45);
type Sides = Omit<Playing, 'chosenAt' | 'prep'>;

function score(b: Brief, p: Performer, reading: string, sides: Sides, prep = 1): Evaluation {
  const ctx = briefContext(nobody, b, rec(prep), { reading, playing: { ...sides, chosenAt: 0, prep }, prep: { genre: 1, approach: prep } });
  return judgePiece(SEED, p, { ...ctx, condition: { readiness: 100 }, key: `int:${b.id}`, expected: true }, briefPiece(b, { ...rec(prep), reading }, reading));
}
const fits = (b: Brief, sides: Sides) => (Object.entries(sides) as [Axis, AxisValue][]).every(([a, v]) => !misfitOf(a, v, briefMaterial(b)));
const combos: Sides[] = [];
for (const pace of [undefined, 'measured', 'driven'] as const) for (const scale of [undefined, 'restrained', 'expansive'] as const) for (const structure of [undefined, 'set', 'open'] as const) {
  combos.push({ ...(pace ? { pace } : {}), ...(scale ? { scale } : {}), ...(structure ? { structure } : {}) });
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : 0);
const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / Math.max(1, xs.length - 1)); };
const pct = (n: number, d: number) => (d ? Math.round((1000 * n) / d) / 10 : 0);
const r2 = (x: number) => Math.round(x * 100) / 100;

function measureI2(briefs: readonly Brief[]) {
  // I2: the better-suited side differs within a genre, and each side is better-suited somewhere.
  const better = (b: Brief, axis: Axis) => { const scene = sceneOf(b, readingOf(b, b.readings[0]!.id)); const [x, y] = AXES[axis].values.map((v) => suitabilityOf(v, briefMaterial(b), scene).s); return x! > y! ? AXES[axis].values[0] : y! > x! ? AXES[axis].values[1] : 'tie'; };
  const byGenre = new Map<string, Brief[]>();
  for (const b of briefs) byGenre.set(b.kinds[0]!, [...(byGenre.get(b.kinds[0]!) ?? []), b]);
  const multi = [...byGenre.values()].filter((xs) => xs.length > 1);
  const i2 = Object.fromEntries((['pace', 'scale', 'structure'] as Axis[]).map((axis) => {
    const differs = multi.filter((xs) => new Set(xs.map((b) => better(b, axis))).size > 1).length;
    const sides = Object.fromEntries(AXES[axis].values.map((v) => [v, pct(briefs.filter((b) => better(b, axis) === v).length, briefs.length)]));
    return [axis, { genresWithTwo: multi.length, differs: pct(differs, multi.length), betterSide: sides }];
  }));
  return i2;
}

function measure(briefs: readonly Brief[]) {
  // I1: mastery on every fitting combination, every reading.
  let i1n = 0, i1ok = 0;
  for (const b of briefs) for (const r of b.readings) for (const c of combos) if (fits(b, c)) { i1n += 1; if (score(b, MASTER, r.id, c).overall === 100) i1ok += 1; }
  // I3 and I4: restrained minus expansive, for an even actor and a specialist in what expansive draws on.
  const diffs: number[] = [];
  let i4n = 0, i4ok = 0, i4bn = 0, i4bok = 0;
  for (const b of briefs) {
    if (!fits(b, { scale: 'restrained' }) || !fits(b, { scale: 'expansive' })) continue;
    const r = b.readings[0]!.id;
    const d = score(b, EVEN, r, { scale: 'restrained' }).overall - score(b, EVEN, r, { scale: 'expansive' }).overall;
    diffs.push(r2(d));
    const scene = sceneOf(b, readingOf(b, r));
    const sr = suitabilityOf('restrained', briefMaterial(b), scene), se = suitabilityOf('expansive', briefMaterial(b), scene);
    if (sr.s > se.s) { i4n += 1; if (score(b, EXPANSIVE_SPECIALIST, r, { scale: 'expansive' }).overall > score(b, EXPANSIVE_SPECIALIST, r, { scale: 'restrained' }).overall) i4ok += 1; }
    if (Math.abs(sr.s - se.s) >= GRAIN.band) { i4bn += 1; if ((sr.s > se.s) === (d > 0)) i4bok += 1; }
  }
  // I5: at least two (reading, way) combinations within a point of the best.
  let i5ok = 0;
  for (const b of briefs) {
    const all: number[] = [];
    for (const r of b.readings) for (const c of combos) if (fits(b, c)) all.push(score(b, EVEN, r.id, c).overall);
    const best = Math.max(...all);
    if (all.filter((x) => x >= best - 1).length >= 2) i5ok += 1;
  }
  return {
    briefs: briefs.length,
    I1: { checked: i1n, at100: i1ok, holds: i1n === i1ok },
    I3: { n: diffs.length, sd: r2(sd(diffs)), restrainedAhead: pct(diffs.filter((d) => d > 0).length, diffs.length), expansiveAhead: pct(diffs.filter((d) => d < 0).length, diffs.length), min: Math.min(...diffs), max: Math.max(...diffs) },
    I4: { restrainedSuitsMore: i4n, specialistExpansiveWins: pct(i4ok, i4n), bandApart: i4bn, evenActorFollowsSuitability: pct(i4bok, i4bn) },
    I5: { atLeastTwoWithinAPoint: pct(i5ok, briefs.length) },
  };
}

const first = BRIEFS.filter((b) => !/-\d+$/.test(b.id));
const held = BRIEFS.filter((b) => /-\d+$/.test(b.id));
// I2 reads a genre's own briefs against each other, so it's measured on the whole catalog: each genre's first brief
// (designed) against its further ones (held out).
const out = { strength: GRAIN.strength, prep: GRAIN.prep, I2: measureI2(BRIEFS), designed: measure(first), heldOut: measure(held) };
console.log(JSON.stringify(out, null, 1));
const o = arg('out', '');
if (o) writeFileSync(o, `${JSON.stringify(out, null, 1)}\n`);
void ABILITY_DEFS;
