/**
 * SLATE — the genre signature, G1's replacement (from 2026-10-16; docs/verification/genres-2026-10-16/g1-replacement.md,
 * written before this was first run).
 *
 * Each genre's register is laid over each of a set of scenes, and what it changes is measured against the same scene
 * with no register: who it rewards (twelve specialists against the even actor), how it suits being played (the six
 * sides' suitability), and which preparation matters (each part of a brief's preparation at half). S1 to S3 are read
 * from those signatures, on the designed scenes and, apart, the held-out ones. `--blind` is the same measure with the
 * genre ignored: the register's lean, draw and suitability at 0. It should fail. S2 and S3 are also read as revised
 * later the same day ("Revision" in that file, defined before it was measured): contrasting genres share no concern and
 * their declared pulls are opposed. `--fresh` measures the briefs neither sample read.
 *
 *   npx vite-node tools/genre-signature.ts -- [--blind] [--fresh] [--diagnose] [--out file.json]
 */
import { writeFileSync } from 'node:fs';
import { BRIEFS, type Brief } from '../src/engine/content/briefs';
import { ABILITY_DEFS } from '../src/engine/content/abilities';
import { CONCERN_STRENGTH } from '../src/engine/content/concerns';
import { GENRE_REGISTER } from '../src/engine/content/genre-register';
import { CONCERN_AFFINITY, GRAIN } from '../src/engine/content/interpretation';
import type { AxisValue } from '../src/engine/content/material';
import type { Person } from '../src/engine/domain/model';
import { briefContext, briefMaterial, briefPiece, readingOf, sceneOf, type BriefRecord } from '../src/engine/systems/briefs';
import type { Performer } from '../src/engine/systems/evaluation';
import { judgePiece } from '../src/engine/systems/piece';
import { suitabilityOf } from '../src/engine/systems/interpretation';

const flag = (n: string) => process.argv.includes(`--${n}`);
const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1]! : d; };
if (flag('blind')) { Object.assign(CONCERN_STRENGTH as Record<string, number>, { lean: 0, draw: 0 }); Object.assign(GRAIN as Record<string, number>, { concern: 0 }); }

const SEED = 'signature';
const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const ABILITIES = ABILITY_DEFS.map((d) => d.id).filter((a) => a !== 'stamina');
const SIDES: AxisValue[] = ['measured', 'driven', 'restrained', 'expansive', 'set', 'open'];
const PARTS = ['interpretation', 'memorization', 'rehearsal'] as const;
const actor = (ab: Partial<Record<string, number>>, fill: number): Performer => ({ ability: (id) => ab[id] ?? fill, full: () => 100, technique: () => 50 });
const EVEN = actor({}, 50);
const SPECIALISTS = ABILITIES.map((a) => actor({ [a]: 85 }, (600 - 85) / 11));
const NONE = '__no_genre__';

/** A scene with a genre's register laid over it: the brief's own text, material, reader and reading, played as that genre. */
const as = (b: Brief, genre: string): Brief => ({ ...b, kinds: [genre] });
function score(b: Brief, p: Performer, prep: Partial<Record<(typeof PARTS)[number], number>> = {}): number {
  const reading = b.readings[0]!.id;
  const rec: BriefRecord = { prep: { interpretation: prep.interpretation ?? 1, memorization: prep.memorization ?? 1, rehearsal: prep.rehearsal ?? 1 }, takes: [] };
  const ctx = briefContext(nobody, b, rec, { reading, prep: { genre: 1 } });
  return judgePiece(SEED, p, { ...ctx, condition: { readiness: 100 }, key: `sig:${b.id}`, expected: true }, briefPiece(b, { ...rec, reading }, reading)).overall;
}
/** What a scene comes to as a genre: who it rewards, how it suits being played, which preparation matters. Kept per scene and genre: S2 and S3 read the same ones. */
const outcomes = new Map<string, number[]>();
function outcome(b: Brief): number[] {
  const key = `${b.id}|${b.kinds[0]}`;
  const had = outcomes.get(key);
  if (had) return had;
  const v = measureOutcome(b);
  outcomes.set(key, v);
  return v;
}
function measureOutcome(b: Brief): number[] {
  const even = score(b, EVEN);
  const scene = sceneOf(b, readingOf(b, b.readings[0]!.id));
  return [
    ...SPECIALISTS.map((p) => score(b, p) - even),
    ...SIDES.map((side) => suitabilityOf(side, briefMaterial(b), scene).s),
    ...PARTS.map((part) => even - score(b, EVEN, { [part]: 0.5 })),
  ];
}
/**
 * How alike two registers are, from what they declare and never from what they're measured to do: the sum of their
 * concerns' affinities for the six sides, compared by cosine. Read only by `--diagnose`.
 */
const affinityOf = (g: string) => SIDES.map((side) => GENRE_REGISTER[g]!.concerns.reduce((a, c) => a + (CONCERN_AFFINITY[c].affinity[side] ?? 0), 0));
function kinship(g: string, h: string): number { const x = affinityOf(g), y = affinityOf(h); const d = x.reduce((s, v, i) => s + v * y[i]!, 0); const n = Math.hypot(...x) * Math.hypot(...y); return n > 0 ? d / n : 0; }
const sub = (x: number[], y: number[]) => x.map((v, i) => v - y[i]!);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : 0);
const r3 = (x: number) => Math.round(x * 1000) / 1000;

// Every genre with a register; the scenes, designed and held out (every third, so each set is varied).
const genres = Object.keys(GENRE_REGISTER).sort();
const designed = BRIEFS.filter((b) => !/-\d+$/.test(b.id)).filter((_, i) => i % 3 === 0);
const heldOut = BRIEFS.filter((b) => /-\d+$/.test(b.id)).filter((_, i) => i % 3 === 0);

function measure(scenes: readonly Brief[]) {
  const base = new Map(scenes.map((b) => [b.id, outcome(as(b, NONE))]));
  // Raw signatures, then each component scaled by its standard deviation across every (scene, genre).
  const raw = new Map<string, number[][]>(genres.map((g) => [g, scenes.map((b) => sub(outcome(as(b, g)), base.get(b.id)!))]));
  const all = [...raw.values()].flat();
  const k = all[0]!.length;
  const sdOf = Array.from({ length: k }, (_, j) => { const xs = all.map((v) => v[j]!); const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))) || 1; });
  const sig = new Map([...raw].map(([g, vs]) => [g, vs.map((v) => v.map((x, j) => x / sdOf[j]!))]));
  const cos = (x: number[], y: number[]) => { const d = x.reduce((s, v, i) => s + v * y[i]!, 0); const n = Math.hypot(...x) * Math.hypot(...y); return n > 0 ? d / n : 0; };
  const dist = (x: number[], y: number[]) => Math.hypot(...x.map((v, i) => v - y[i]!));
  // S1: each genre's signatures on different scenes point the same way.
  const s1 = genres.map((g) => { const vs = sig.get(g)!; const cs: number[] = []; for (let i = 0; i < vs.length; i += 1) for (let j = i + 1; j < vs.length; j += 1) cs.push(cos(vs[i]!, vs[j]!)); return { g, cos: mean(cs) }; });
  // S2: the genre's mean signature; distances by concerns shared.
  const centroid = new Map([...sig].map(([g, vs]) => [g, Array.from({ length: k }, (_, j) => mean(vs.map((v) => v[j]!)))]));
  const shared = (a: string, b: string) => GENRE_REGISTER[a]!.concerns.filter((c) => GENRE_REGISTER[b]!.concerns.includes(c)).length;
  const byShared: Record<number, number[]> = {};
  const opposed: number[] = [];
  for (let i = 0; i < genres.length; i += 1) for (let j = i + 1; j < genres.length; j += 1) {
    const [g, h] = [genres[i]!, genres[j]!];
    const d = dist(centroid.get(g)!, centroid.get(h)!);
    (byShared[shared(g, h)] ??= []).push(d);
    if (shared(g, h) === 0 && kinship(g, h) < 0) opposed.push(d);
  }
  const nearestShares = genres.filter((g) => { let best = ''; let bd = Infinity; for (const h of genres) { if (h === g) continue; const d = dist(centroid.get(g)!, centroid.get(h)!); if (d < bd) { bd = d; best = h; } } return shared(g, best) > 0; }).length;
  // S3: on the same scene, two genres sharing no concern lead to a different best side on an axis or a different best-rewarded specialist.
  let s3n = 0, s3ok = 0;
  const pick = (v: number[]) => ({ spec: v.slice(0, SPECIALISTS.length).indexOf(Math.max(...v.slice(0, SPECIALISTS.length))), sides: [0, 2, 4].map((i) => (v[SPECIALISTS.length + i]! >= v[SPECIALISTS.length + i + 1]! ? 0 : 1)).join('') });
  const contrast: [string, string][] = [];
  for (let i = 0; i < genres.length; i += 3) for (let j = i + 1; j < genres.length; j += 5) if (shared(genres[i]!, genres[j]!) === 0) contrast.push([genres[i]!, genres[j]!]);
  // The revision (g1-replacement.md, "Revision"): contrasting is no concern shared and the declared pulls opposed.
  let r3n = 0, r3ok = 0;
  const missBy = { revised: {} as Record<string, [number, number]>, revisedScene: {} as Record<string, number>, scene: {} as Record<string, number>, pair: {} as Record<string, number>, kin: {} as Record<string, [number, number]>, what: {} as Record<string, number> };
  for (const b of scenes) for (const [g, h] of contrast) {
    const x = pick(outcome(as(b, g))), y = pick(outcome(as(b, h)));
    const differ = x.spec !== y.spec || x.sides !== y.sides;
    s3n += 1; if (differ) s3ok += 1;
    if (kinship(g, h) < 0) {
      r3n += 1; if (differ) r3ok += 1;
      const by = `${b.medium}, ${b.medium === 'voice' ? 'no reader' : `${b.readerPlays ?? 'steady'} reader`}`;
      const m = (missBy.revised[by] ??= [0, 0]); m[1] += 1; if (!differ) { m[0] += 1; missBy.revisedScene[b.id] = (missBy.revisedScene[b.id] ?? 0) + 1; }
    }
    const bin = (Math.round(kinship(g, h) * 2) / 2).toFixed(1);
    const kb = (missBy.kin[bin] ??= [0, 0]); kb[1] += 1;
    if (!differ) {
      kb[0] += 1;
      missBy.scene[b.id] = (missBy.scene[b.id] ?? 0) + 1;
      missBy.pair[`${g}/${h}`] = (missBy.pair[`${g}/${h}`] ?? 0) + 1;
      missBy.what[x.sides] = (missBy.what[x.sides] ?? 0) + 1;
    }
  }
  const top = (r: Record<string, number>, n: number) => Object.fromEntries(Object.entries(r).sort((a, b) => b[1] - a[1]).slice(0, n));
  const meanBy = Object.fromEntries(Object.entries(byShared).map(([n, xs]) => [n, r3(mean(xs))]));
  const one = meanBy['1'] ?? 0;
  return {
    scenes: scenes.length, genres: genres.length,
    S1: { meanCos: r3(mean(s1.map((x) => x.cos))), least: r3(Math.min(...s1.map((x) => x.cos))), under07: s1.filter((x) => x.cos < 0.7).map((x) => x.g), holds: s1.every((x) => x.cos >= 0.7) },
    S2: { meanDistanceBySharedConcerns: meanBy, pairs: Object.fromEntries(Object.entries(byShared).map(([n, xs]) => [n, xs.length])), noneOverOne: r3((meanBy['0'] ?? 0) / Math.max(1e-9, meanBy['1'] ?? 0)), nearestSharesAConcern: r3(nearestShares / genres.length), holds: (meanBy['0'] ?? 0) >= 1.5 * (meanBy['1'] ?? 0) && (meanBy['1'] ?? 0) > (meanBy['2'] ?? 0) && nearestShares / genres.length >= 0.9 },
    S2revised: { opposedPairs: opposed.length, opposed: r3(mean(opposed)), one, opposedOverOne: r3(mean(opposed) / Math.max(1e-9, one)), nearestSharesAConcern: r3(nearestShares / genres.length), holds: mean(opposed) >= 1.5 * one && one > (meanBy['2'] ?? 0) && nearestShares / genres.length >= 0.9 },
    S3revised: { cases: r3n, differ: r3(r3ok / Math.max(1, r3n)), holds: r3ok / Math.max(1, r3n) >= 0.8, ...(flag('diagnose') ? { missesByMediumAndReader: missBy.revised, missesByScene: top(missBy.revisedScene, 15) } : {}) },
    S3: { cases: s3n, differ: r3(s3ok / Math.max(1, s3n)), holds: s3ok / Math.max(1, s3n) >= 0.8,
      ...(flag('diagnose') ? { missesByKinship: missBy.kin, missedSides: top(missBy.what, 8), missesByScene: top(missBy.scene, 12), missesByPair: top(missBy.pair, 12) } : {}) },
  };
}

// `--fresh`: the briefs neither sample read, for validating the revision (every brief not every third).
const designedFresh = BRIEFS.filter((b) => !/-\d+$/.test(b.id)).filter((_, i) => i % 3 !== 0);
const heldOutFresh = BRIEFS.filter((b) => /-\d+$/.test(b.id)).filter((_, i) => i % 3 !== 0);
const out = flag('fresh')
  ? { blind: flag('blind'), designedFresh: measure(designedFresh), heldOutFresh: measure(heldOutFresh) }
  : { blind: flag('blind'), designed: measure(designed), heldOut: measure(heldOut) };
console.log(JSON.stringify(out, null, 1));
const o = arg('out', '');
if (o) writeFileSync(o, `${JSON.stringify(out, null, 1)}\n`);
