/**
 * SLATE — the attributes-and-genres baseline (from 2026-10-16; phase 1 of the owner's brief "Perfect The Attributes,
 * Genres, And Their Integration Through Demonstrable Gameplay"). A read-only harness: it imports the engine's own
 * evaluation (`judge`, `judgePiece`, `briefContext`, `materialContext`, `abilityGain`, `sharedOf`), sets no save, plays
 * no command and writes nothing but its own JSON. Every figure in
 * docs/verification/attributes-genres-2026-10-16/baseline.md comes from here or from a played tool named there.
 *
 *   npx vite-node tools/ag-baseline.ts -- --out docs/verification/attributes-genres-2026-10-16/baseline.json
 *
 * The actors are TEST SETUP, levels set directly, as `tools/specialists.ts` sets them: twelve abilities summing 600
 * (even, 50 each) and seventeen techniques at 50; a specialist at 85 on one ability, the other eleven lowered evenly
 * to keep the sum. Every piece is fully prepared, on a sufficient day (readiness 100), with no draw (`expected`),
 * unless the section says otherwise. The draw sections key the evaluation's own bounded draw by `ag-<n>`.
 *
 * The pieces: every practice brief (judged in its beats, each reading, no way of playing), every scene a course can set
 * (`SCENE_MATERIAL`, as Scene Study pitches it), every play as a supporting part at the School (`PLAY_MATERIAL`),
 * casting's read of every play, and each coursework template not judged as a scene (its task anything but `scene`), as `judgeWork`
 * judges one with its template's reads and par.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { BRIEFS, briefsOf, type Brief } from '../src/engine/content/briefs';
import { ABILITY_DEFS, MASTERED, TECHNIQUES, DEVELOPMENT } from '../src/engine/content/abilities';
import { AXES } from '../src/engine/content/approaches';
import { PLAY_MATERIAL, SCENE_MATERIAL, type Axis, type AxisValue, type MaterialProfile } from '../src/engine/content/material';
import { TASK_PROFILES, TEMPLATE_TASK, type Dimension } from '../src/engine/content/tasks';
import { TEMPLATES, templateById } from '../src/engine/content/coursework';
import { PIECE } from '../src/engine/content/piece';
import { GENRE_DEFS } from '../src/engine/content/genres';
import { ENGAGEMENT } from '../src/engine/content/engagement';
import { TIER } from '../src/engine/content/practice';
import type { Person } from '../src/engine/domain/model';
import { briefContext, briefPiece, tapeReadsOf, BRIEF, type BriefRecord } from '../src/engine/systems/briefs';
import { judge, type EvalContext, type Evaluation, type Performer } from '../src/engine/systems/evaluation';
import { judgePiece, loadOf, pieceWeights, toneSegments, type PieceSpec } from '../src/engine/systems/piece';
import { materialContext, misfitOf, type Playing } from '../src/engine/systems/material';
import { castingPerformer, NIGHT_DIFFICULTY } from '../src/engine/systems/school';
import { difficultyOf, partnerPart as ownPartnerPart, READER, type Assignment } from '../src/engine/systems/coursework';
import { abilityGain } from '../src/engine/systems/attributes';
import { sharedOf } from '../src/engine/systems/ensemble';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1]! : d; };
const OUT = arg('out', 'docs/verification/attributes-genres-2026-10-16/baseline.json');
const DRAWS = Number(arg('draws', '60'));

const ABILITIES = ABILITY_DEFS.map((d) => d.id);
type Ab = (typeof ABILITIES)[number];
const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const SEED = 'ag-baseline';
const r2 = (x: number) => Math.round(x * 100) / 100;
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : 0);
const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / Math.max(1, xs.length - 1)); };
const stats = (xs: number[]) => ({ n: xs.length, mean: r2(mean(xs)), sd: r2(sd(xs)), min: r2(xs.length ? Math.min(...xs) : 0), max: r2(xs.length ? Math.max(...xs) : 0) });

/** An actor: abilities by id (others at `fill`), techniques by skill (others at `tFill`). */
const actor = (ab: Partial<Record<Ab, number>>, fill: number, te: Partial<Record<string, number>> = {}, tFill = 50): Performer => ({ ability: (id) => ab[id as Ab] ?? fill, full: () => 100, technique: (s) => te[s] ?? tFill });
const EVEN = actor({}, 50);
const MASTER: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
const specialist = (a: Ab, budget = 600, at = 85): Performer => actor({ [a]: at }, (budget - at) / (ABILITIES.length - 1));
const bump = (p: Performer, a: Ab, by: number): Performer => ({ ...p, ability: (id) => (id === a ? Math.min(100, p.ability(id) + by) : p.ability(id)) });
const bumpT = (p: Performer, s: string, by: number): Performer => ({ ...p, technique: (k) => (k === s ? Math.min(100, p.technique(k) + by) : p.technique(k)) });

// ---------------------------------------------------------------------------------------------------------------
// The pieces
// ---------------------------------------------------------------------------------------------------------------
type Kind = 'brief' | 'scene' | 'night' | 'casting' | 'coursework';
interface Piece { kind: Kind; id: string; genre?: string; judge: (p: Performer, o?: { key?: string; prep?: number; genre?: number; reading?: string }) => Evaluation; material?: MaterialProfile }

const rec = (p: number): BriefRecord => ({ prep: { interpretation: p, memorization: p, rehearsal: p }, takes: [] });
function briefScore(b: Brief, p: Performer, o: { key?: string; prep?: number; genre?: number; reading?: string; sides?: Omit<Playing, 'chosenAt' | 'prep'> } = {}): Evaluation {
  const prep = o.prep ?? 1;
  const reading = o.reading ?? b.readings[0]!.id;
  const sides = o.sides ?? {};
  const ctx = briefContext(nobody, b, rec(prep), { reading, ...(Object.keys(sides).length ? { playing: { ...sides, chosenAt: 0, prep } } : {}), prep: { genre: o.genre ?? prep, ...(Object.keys(sides).length ? { approach: prep } : {}) } });
  return judgePiece(SEED, p, { ...ctx, condition: { readiness: 100 }, key: o.key ?? `ag:${b.id}`, ...(o.key ? {} : { expected: true }) }, briefPiece(b, { ...rec(prep), reading }));
}
/** Every reading's mean: what a random choice of reading would come to (the effect matrix reads this). */
const briefMean = (b: Brief, p: Performer, o: { key?: string; prep?: number; genre?: number } = {}): Evaluation => {
  const es = b.readings.map((r) => briefScore(b, p, { ...o, reading: r.id }));
  // The mean at full precision beside it (from 2026-10-16, brief 09), for the account of H4 that reads exact effects.
  return { ...es[0]!, overall: r2(mean(es.map((e) => e.overall))), exact: mean(es.map((e) => e.exact ?? e.overall)) };
};

function workPiece(m: MaterialProfile, kind: 'scene' | 'night' | 'casting'): Piece {
  const task = kind === 'scene' ? TASK_PROFILES.scene! : TASK_PROFILES.performance!;
  const read = materialContext(task, m);
  const prep: Record<string, number> = kind === 'scene' ? { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1 } : kind === 'night' ? { lines: 1, blocking: 1, notes: 1 } : {};
  const difficulty = kind === 'scene' ? difficultyOf(templateById('scene-study')!) : kind === 'night' ? NIGHT_DIFFICULTY.school.supporting : 0;
  const spec: PieceSpec = { segments: toneSegments(m.tones, 2), work: [], part: kind === 'scene' ? 'rehearsal' : 'blocking', perTurn: kind === 'scene' ? PIECE.scene.perTurn : 0, perBlend: 0, most: kind === 'scene' ? PIECE.scene.most : 1, load: loadOf(m, kind === 'scene' ? 'scene' : 'night') };
  return {
    kind, id: m.id, material: m,
    judge: (p, o = {}) => {
      const pr = o.prep ?? 1;
      const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep: Object.fromEntries(Object.keys(prep).map((k) => [k, pr])), required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, key: o.key ?? `ag:${kind}:${m.id}`, ...(o.key ? {} : { expected: true }) };
      // Until 2026-10-16 a class scene of fewer than two tones was judged whole here, as `scenePiece` judged it; from then
      // every scene is its tones, or two halves, as a play is.
      return judgePiece(SEED, kind === 'casting' ? castingPerformer(p) : p, ctx, spec);
    },
  };
}

function courseworkPiece(id: string): Piece {
  const t = templateById(id)!;
  const task = TASK_PROFILES[TEMPLATE_TASK[id] ?? 'scene']!;
  const parts = [...new Set(Object.values(task.dims).flatMap((d) => d!.prep ?? []))];
  return {
    kind: 'coursework', id,
    judge: (p, o = {}) => {
      const pr = o.prep ?? 1;
      return judge(SEED, p, { task, techniques: { ...t.reads }, prep: Object.fromEntries(parts.map((k) => [k, pr])), required: Object.fromEntries(parts.map((k) => [k, 0.9])), difficulty: difficultyOf(t), condition: { readiness: 100 }, key: o.key ?? `ag:cw:${id}`, ...(o.key ? {} : { expected: true }) });
    },
  };
}

const PIECES: Piece[] = [
  ...BRIEFS.map((b): Piece => ({ kind: 'brief', id: b.id, genre: b.kinds[0], judge: (p, o) => briefMean(b, p, o) })),
  ...SCENE_MATERIAL.map((m) => workPiece(m, 'scene')),
  ...PLAY_MATERIAL.map((m) => workPiece(m, 'night')),
  ...PLAY_MATERIAL.map((m) => workPiece(m, 'casting')),
  ...TEMPLATES.filter((t) => (TEMPLATE_TASK[t.id] ?? 'scene') !== 'scene').map((t) => courseworkPiece(t.id)),
];
const KINDS: Kind[] = ['brief', 'scene', 'night', 'casting', 'coursework'];
const out: Record<string, unknown> = {
  measured: 'tools/ag-baseline.ts',
  pieces: Object.fromEntries(KINDS.map((k) => [k, PIECES.filter((x) => x.kind === k).length])),
  courseworkTemplates: TEMPLATES.filter((t) => (TEMPLATE_TASK[t.id] ?? 'scene') !== 'scene').map((t) => `${t.id} (${TEMPLATE_TASK[t.id]})`),
};

const log = (s: string) => console.log(s);

const evenScore = new Map<Piece, number>();
const evenOf = (pc: Piece) => { let x = evenScore.get(pc); if (x === undefined) { x = pc.judge(EVEN).overall; evenScore.set(pc, x); } return x; };

// ---------------------------------------------------------------------------------------------------------------
// 1. Each ability's causal effect: +10 from the even actor, every piece (criterion A1, A2, A3)
// ---------------------------------------------------------------------------------------------------------------
log('1. ability effects');
const effect: Record<string, number[]> = {};
for (const a of ABILITIES) effect[a] = PIECES.map((pc) => r3(pc.judge(bump(EVEN, a, 10)).overall - evenOf(pc)));
const abilityEffects = Object.fromEntries(ABILITIES.map((a) => {
  const d = effect[a]!;
  const byKind = Object.fromEntries(KINDS.map((k) => {
    const xs = PIECES.map((pc, i) => [pc, d[i]!] as const).filter(([pc]) => pc.kind === k).map(([, x]) => x);
    const moved = xs.filter((x) => Math.abs(x) >= 0.05);
    return [k, { n: xs.length, moved: moved.length, mean: r2(mean(xs)), max: r2(Math.max(...xs)), cvMoved: moved.length > 1 ? r2(sd(moved) / Math.max(1e-9, mean(moved))) : null }];
  }));
  const moved = d.filter((x) => Math.abs(x) >= 0.05);
  return [a, { all: { n: d.length, moved: moved.length, movedShare: r2(moved.length / d.length), mean: r2(mean(d)), cvMoved: moved.length > 1 ? r2(sd(moved) / mean(moved)) : null }, byKind }];
}));
out.abilityEffects = abilityEffects;

// Distinctness: the correlation of two abilities' effects across every piece.
const corr = (x: number[], y: number[]) => { const mx = mean(x), my = mean(y); const n = x.reduce((a, v, i) => a + (v - mx) * (y[i]! - my), 0); const d = Math.sqrt(x.reduce((a, v) => a + (v - mx) ** 2, 0) * y.reduce((a, v) => a + (v - my) ** 2, 0)); return d > 0 ? n / d : 0; };
const pairs: { a: string; b: string; r: number }[] = [];
for (let i = 0; i < ABILITIES.length; i += 1) for (let j = i + 1; j < ABILITIES.length; j += 1) pairs.push({ a: ABILITIES[i]!, b: ABILITIES[j]!, r: r3(corr(effect[ABILITIES[i]!]!, effect[ABILITIES[j]!]!)) });
pairs.sort((p, q) => q.r - p.r);
out.abilityCorrelation = { top: pairs.slice(0, 10), over095: pairs.filter((p) => p.r >= 0.95).length, over090: pairs.filter((p) => p.r >= 0.9).length };

// Techniques: +10 from 50 on each.
log('1b. technique effects');
const techEffects = Object.fromEntries(TECHNIQUES.map((s) => {
  const d = PIECES.map((pc) => r3(pc.judge(bumpT(EVEN, s, 10)).overall - evenOf(pc)));
  const byKind = Object.fromEntries(KINDS.map((k) => { const xs = PIECES.map((pc, i) => [pc, d[i]!] as const).filter(([pc]) => pc.kind === k).map(([, x]) => x); return [k, { moved: xs.filter((x) => Math.abs(x) >= 0.05).length, mean: r2(mean(xs)) }]; }));
  return [s, { moved: d.filter((x) => Math.abs(x) >= 0.05).length, mean: r2(mean(d)), byKind }];
}));
out.techniqueEffects = techEffects;
// Past mastery: a technique at 100 against one at 90, the mastered actor (must be 0 by `craft / MASTERED` capped at 1).
out.techniquePast90 = { pieces: PIECES.length, moved: PIECES.filter((pc) => Math.abs(pc.judge({ ...MASTER, technique: () => 100 }).overall - pc.judge(MASTER).overall) >= 0.05).length };

// ---------------------------------------------------------------------------------------------------------------
// 2. Specialists against the even actor, and which allocation is best where (criteria H2, H3, H4)
// ---------------------------------------------------------------------------------------------------------------
log('2. specialists');
const ACTORS: Record<string, Performer> = { even: EVEN, ...Object.fromEntries(ABILITIES.map((a) => [`${a} specialist`, specialist(a)])) };
const scoreOf: Record<string, number[]> = {};
for (const [name, p] of Object.entries(ACTORS)) scoreOf[name] = name === 'even' ? PIECES.map(evenOf) : PIECES.map((pc) => pc.judge(p).overall);
const suitable = (a: Ab) => { const d = effect[a]!; const nz = d.filter((x) => x >= 0.05).sort((x, y) => x - y); const med = nz.length ? nz[Math.floor(nz.length / 2)]! : Infinity; return d.map((x) => x >= med && x >= 0.05); };
out.specialists = Object.fromEntries(ABILITIES.map((a) => {
  const s = scoreOf[`${a} specialist`]!;
  const suit = suitable(a);
  const diff = s.map((x, i) => x - scoreOf.even![i]!);
  const on = diff.filter((_, i) => suit[i]);
  const off = diff.filter((_, i) => !suit[i]);
  return [a, { suitable: on.length, aheadOnSuitable: on.filter((x) => x > 0.05).length, meanOnSuitable: r2(mean(on)), rest: off.length, aheadOnRest: off.filter((x) => x > 0.05).length, meanOnRest: r2(mean(off)), byKind: Object.fromEntries(KINDS.map((k) => { const xs = diff.filter((_, i) => PIECES[i]!.kind === k); return [k, { ahead: xs.filter((x) => x > 0.05).length, n: xs.length, mean: r2(mean(xs)) }]; })) }];
}));
// The best of the thirteen allocations on each piece.
const names = Object.keys(ACTORS);
const bestCount: Record<string, Record<string, number>> = {};
PIECES.forEach((pc, i) => { const top = names.reduce((b, n) => (scoreOf[n]![i]! > scoreOf[b]![i]! + 1e-9 ? n : b), 'even'); (bestCount[pc.kind] ??= {})[top] = (bestCount[pc.kind]![top] ?? 0) + 1; (bestCount.all ??= {})[top] = (bestCount.all![top] ?? 0) + 1; });
out.bestAllocation = bestCount;
// The generalist against the best of the twelve specialists on each piece: how far behind, and how often within a point.
out.generalist = Object.fromEntries([...KINDS, 'all' as const].map((k) => {
  const idx = PIECES.map((pc, i) => [pc, i] as const).filter(([pc]) => k === 'all' || pc.kind === k).map(([, i]) => i);
  const gap = idx.map((i) => Math.max(...names.map((n) => scoreOf[n]![i]!)) - scoreOf.even![i]!);
  const beatsHalf = idx.filter((i) => names.filter((n) => n !== 'even' && scoreOf[n]![i]! < scoreOf.even![i]! - 0.05).length >= 6).length;
  return [k, { n: idx.length, behindBest: stats(gap), withinOnePoint: gap.filter((x) => x <= 1).length, aheadOfHalfTheSpecialists: beatsHalf }];
}));

// ---------------------------------------------------------------------------------------------------------------
// 3. The genres: each genre's briefs as a profile, how far apart (criteria G1, G2, G3)
// ---------------------------------------------------------------------------------------------------------------
log('3. genres');
const GENRES = Object.keys(GENRE_DEFS);
const DIMS: Dimension[] = ['believability', 'interpretation', 'connection', 'execution', 'consistency', 'responsiveness'];
/** A brief's profile: its dimensions' weights (mean over readings) and each ability's and technique's +10 effect for the even actor. */
const briefIndex = new Map(BRIEFS.map((b, i) => [b.id, i]));
const profileOfBrief = (b: Brief) => {
  const ws = b.readings.map((r) => { const ctx = briefContext(nobody, b, rec(1), { reading: r.id }); const w = pieceWeights(ctx.task, ctx.lean, briefPiece(b, { ...rec(1), reading: r.id })); const t = Object.values(w).reduce((a, x) => a + (x ?? 0), 0); return DIMS.map((d) => (w[d] ?? 0) / t); });
  const dims = DIMS.map((_, i) => mean(ws.map((w) => w[i]!)));
  const i = briefIndex.get(b.id)!;
  const abil = ABILITIES.map((a) => effect[a]![i]!);
  return [...dims.map((x) => x * 10), ...abil];
};
const BRIEF_PROFILE = new Map(BRIEFS.map((b) => [b.id, profileOfBrief(b)]));
const genreBriefs = (g: string) => briefsOf(g).filter((b) => b.kinds[0] === g);
const genreProfile = (g: string) => { const ps = genreBriefs(g).map((b) => BRIEF_PROFILE.get(b.id)!); return ps[0]!.map((_, i) => mean(ps.map((p) => p[i]!))); };
const GP = new Map(GENRES.map((g) => [g, genreProfile(g)]));
const l1 = (x: number[], y: number[]) => x.reduce((a, v, i) => a + Math.abs(v - y[i]!), 0);
const nearest = GENRES.map((g) => { let best = { g: '', d: Infinity }; for (const h of GENRES) if (h !== g) { const d = l1(GP.get(g)!, GP.get(h)!); if (d < best.d) best = { g: h, d }; } return { genre: g, nearest: best.g, distance: r3(best.d) }; }).sort((a, b) => a.distance - b.distance);
// The same distance between the two briefs of one genre, for scale: how far apart a genre's own briefs are.
const within = GENRES.map((g) => { const bs = genreBriefs(g); return bs.length >= 2 ? l1(BRIEF_PROFILE.get(bs[0]!.id)!, BRIEF_PROFILE.get(bs[1]!.id)!) : 0; });
const allPairs: number[] = [];
for (let i = 0; i < GENRES.length; i += 1) for (let j = i + 1; j < GENRES.length; j += 1) allPairs.push(l1(GP.get(GENRES[i]!)!, GP.get(GENRES[j]!)!));
allPairs.sort((a, b) => a - b);
const q = (xs: number[], p: number) => xs[Math.min(xs.length - 1, Math.floor(p * xs.length))]!;
// Material signature: what the engine reads of a brief, with the words taken out.
const sig = (b: Brief) => JSON.stringify([b.medium, b.size, b.stakes ?? 1, b.readerPlays ?? 'steady', b.language, b.timing, b.physical, b.partner, b.vocal, b.improvisation, Object.entries(tapeReadsOf(b)).sort(), b.allows ?? {}, b.beats.map((x) => [...x.tones].sort().join('+')), b.readings.map((r) => [Object.entries(r.lean).sort(), r.draws.map((d) => `${d.dim}:${d.ability}:${d.weight}`).sort()]).sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)))]);
const sigNoReadings = (b: Brief) => JSON.stringify([b.medium, b.size, b.stakes ?? 1, b.readerPlays ?? 'steady', b.language, b.timing, b.physical, b.partner, b.vocal, b.improvisation, Object.entries(tapeReadsOf(b)).sort(), b.beats.map((x) => [...x.tones].sort().join('+'))]);
const bySig = new Map<string, string[]>();
for (const b of BRIEFS) bySig.set(sig(b), [...(bySig.get(sig(b)) ?? []), b.id]);
const byFeat = new Map<string, string[]>();
for (const b of BRIEFS) byFeat.set(sigNoReadings(b), [...(byFeat.get(sigNoReadings(b)) ?? []), b.id]);
// Which allocation is best on each genre's briefs (mean of its briefs).
const genreWinner = Object.fromEntries(GENRES.map((g) => {
  const idx = genreBriefs(g).map((b) => PIECES.findIndex((pc) => pc.kind === 'brief' && pc.id === b.id));
  const m = names.map((n) => ({ n, s: mean(idx.map((i) => scoreOf[n]![i]!)) })).sort((a, b) => b.s - a.s);
  return [g, { winner: m[0]!.n, margin: r2(m[0]!.s - m[1]!.s), even: r2(m.find((x) => x.n === 'even')!.s) }];
}));
const winners: Record<string, number> = {};
for (const v of Object.values(genreWinner)) winners[v.winner] = (winners[v.winner] ?? 0) + 1;
// Readings per genre, and how far the best and worst reading are apart for actors who differ.
const READ_ACTORS = { even: EVEN, 'emotionalDepth specialist': ACTORS['emotionalDepth specialist']!, 'listening specialist': ACTORS['listening specialist']!, 'physical specialist': ACTORS['physical specialist']! };
const readingSpread = Object.fromEntries(Object.entries(READ_ACTORS).map(([n, p]) => { const xs = BRIEFS.map((b) => { const s = b.readings.map((r) => briefScore(b, p, { reading: r.id }).overall); return Math.max(...s) - Math.min(...s); }); return [n, { ...stats(xs), overOnePoint: xs.filter((x) => x >= 1).length }]; }));
const bestReadingDiffers = BRIEFS.filter((b) => { const best = (p: Performer) => b.readings.map((r) => ({ r: r.id, s: briefScore(b, p, { reading: r.id }).overall })).sort((x, y) => y.s - x.s)[0]!.r; return best(READ_ACTORS['emotionalDepth specialist']) !== best(READ_ACTORS['listening specialist']); }).length;
out.genres = {
  genres: GENRES.length,
  briefsPerGenre: stats(GENRES.map((g) => genreBriefs(g).length)),
  briefsListingGenre: stats(GENRES.map((g) => briefsOf(g).length)),
  readingsPerGenre: stats(GENRES.map((g) => genreBriefs(g).reduce((a, b) => a + b.readings.length, 0))),
  readingsPerBrief: stats(BRIEFS.map((b) => b.readings.length)),
  beatsPerBrief: stats(BRIEFS.map((b) => b.beats.length)),
  readerPlays: BRIEFS.reduce((m, b) => { const k = b.medium === 'voice' ? 'voice (none)' : b.readerPlays ?? 'steady'; m[k] = (m[k] ?? 0) + 1; return m; }, {} as Record<string, number>),
  stakes: BRIEFS.reduce((m, b) => { const k = String(b.stakes ?? 1); m[k] = (m[k] ?? 0) + 1; return m; }, {} as Record<string, number>),
  sizes: BRIEFS.reduce((m, b) => { m[b.size] = (m[b.size] ?? 0) + 1; return m; }, {} as Record<string, number>),
  mediums: BRIEFS.reduce((m, b) => { m[b.medium] = (m[b.medium] ?? 0) + 1; return m; }, {} as Record<string, number>),
  withTechniques: BRIEFS.filter((b) => Object.keys(b.techniques ?? {}).length).length,
  distance: { note: 'L1 over 6 dimension shares ×10 and 12 ability effects (+10, even actor), a genre the mean of the briefs written for it', allPairs: { n: allPairs.length, p05: r3(q(allPairs, 0.05)), median: r3(q(allPairs, 0.5)), p95: r3(q(allPairs, 0.95)) }, withinGenre: stats(within), nearestClosest: nearest.slice(0, 15), nearestAll: nearest.map((x) => ({ ...x, withinOwnBriefs: r3(within[GENRES.indexOf(x.genre)]!) })), nearestStats: stats(nearest.map((x) => x.distance)), genresNearerThanOwnBriefs: GENRES.filter((g, i) => nearest.find((x) => x.genre === g)!.distance < within[i]!).length },
  identicalSignature: [...bySig.values()].filter((v) => v.length > 1),
  identicalMaterialIgnoringReadings: { groups: [...byFeat.values()].filter((v) => v.length > 1).length, briefsInThem: [...byFeat.values()].filter((v) => v.length > 1).reduce((a, v) => a + v.length, 0), crossGenreGroups: [...byFeat.values()].filter((v) => v.length > 1 && new Set(v.map((id) => BRIEFS.find((b) => b.id === id)!.kinds[0])).size > 1).length, largest: [...byFeat.values()].sort((a, b) => b.length - a.length).slice(0, 5) },
  winners, genreWinner,
  readingSpread, bestReadingDiffersFeelingVsListening: bestReadingDiffers,
};

// ---------------------------------------------------------------------------------------------------------------
// 4. The mastery guarantee and outcomes kept apart (criteria M1, M2, O1, O2)
// ---------------------------------------------------------------------------------------------------------------
log('4. mastery');
const fitting = (b: Brief): Omit<Playing, 'chosenAt' | 'prep'>[] => { const o: Omit<Playing, 'chosenAt' | 'prep'>[] = [{}]; for (const ax of Object.keys(AXES) as Axis[]) for (const side of AXES[ax].values) if (!misfitOf(ax, side as AxisValue, { ...b, tones: [], turns: 0, why: {} } as unknown as MaterialProfile)) o.push({ [ax]: side } as Omit<Playing, 'chosenAt' | 'prep'>); return o; };
let cases = 0, hundred = 0, mastered = 0; const misses: string[] = [];
for (const b of BRIEFS) for (const r of b.readings) for (const s of fitting(b)) { cases += 1; const e = briefScore(b, MASTER, { reading: r.id, sides: s }); if (e.overall === 100) hundred += 1; else if (misses.length < 5) misses.push(`${b.id}/${r.id}/${JSON.stringify(s)}: ${e.overall}`); if (e.mastery) mastered += 1; }
const otherMastery = Object.fromEntries((['scene', 'night', 'casting', 'coursework'] as Kind[]).map((k) => { const ps = PIECES.filter((pc) => pc.kind === k); return [k, { n: ps.length, at100: ps.filter((pc) => pc.judge(MASTER).overall === 100).length }]; }));
// Drawn keys at mastery: the draw is nothing at full capacity.
const drawnAtMastery = BRIEFS.slice(0, 60).flatMap((b) => [0, 1, 2].map((k) => briefScore(b, MASTER, { key: `ag-m-${k}` }).overall)).filter((x) => x !== 100).length;
// A reader's quality against your own result (taped briefs with a reader): own stays, together moves.
const readers = [{ name: 'A Recording', prep: 1, timing: BRIEF.reader.recording, agree: 1, reliability: 1 }, { name: 'Unprepared, Distracted', prep: 0, timing: 0.5, agree: 1, reliability: 0.5 }, { name: 'Prepared, Attentive', prep: 1, timing: 1, agree: 1, reliability: 1 }];
const partnered = BRIEFS.filter((b) => b.medium !== 'voice' && b.partner > 0);
const togetherRows = readers.map((rd) => { const own: number[] = []; const tog: number[] = []; for (const b of partnered) { const e = briefScore(b, MASTER); const ctx = briefContext(nobody, b, rec(1), { reading: b.readings[0]!.id }); const s = sharedOf(e, { ...rd, level: b.partner }, SEED, `ag:${b.id}`, 1, pieceWeights(ctx.task, ctx.lean, briefPiece(b, { ...rec(1), reading: b.readings[0]!.id }))); own.push(e.overall); tog.push(s.overall); } return { reader: rd.name, own: stats(own), together: stats(tog) }; });
// A class scene whose partner never came to rehearse: your own result with the partner part of preparation at 0.
// Every scene in its tones or two halves from 2026-10-16 (`scenePiece`); until then one of a single tone was judged whole here.
const partnerPart = SCENE_MATERIAL.map((m) => { const task = TASK_PROFILES.scene!; const read = materialContext(task, m); const spec: PieceSpec = { segments: toneSegments(m.tones, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') }; const ctx = (partner: number): EvalContext => ({ task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep: { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner }, required: { familiarity: 0.9, memorization: 0.9, interpretation: 0.9, rehearsal: 0.9, partner: 0.9 }, difficulty: difficultyOf(templateById('scene-study')!), condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, key: 'ag', expected: true }); const j = (c: EvalContext) => judgePiece(SEED, MASTER, c, spec).overall; return { none: j(ctx(0)), half: j(ctx(0.45)) }; });
// From 2026-10-16 (phase 2a): the same partner never coming, with your own side worked with a reader (`READER`,
// `partnerPart`): the evenings a reader takes to complete the part at a day's focus of 1, your own result then, and the
// scene together with that partner absent from every rehearsal (their preparation only what they did alone, here 0)
// against one who came to all of them (1), at an ordinary classmate's timing and reliability.
const readerEvenings = (() => { let r = 0, n = 0; while (r < 0.9 && n < 50) { r += READER.gain * (1 - r); n += 1; } return { n, reader: r }; })();
const readerRoute = SCENE_MATERIAL.map((m) => {
  const task = TASK_PROFILES.scene!; const read = materialContext(task, m);
  const spec: PieceSpec = { segments: toneSegments(m.tones, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') };
  const own = ownPartnerPart({ prep: { partner: 0 }, reader: readerEvenings.reader } as unknown as Assignment);
  const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep: { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: own }, required: { familiarity: 0.9, memorization: 0.9, interpretation: 0.9, rehearsal: 0.9, partner: 0.9 }, difficulty: difficultyOf(templateById('scene-study')!), condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, key: 'ag', expected: true };
  const e = judgePiece(SEED, MASTER, ctx, spec);
  const weights = pieceWeights(task, read.lean, spec);
  const together = (prep: number) => sharedOf(e, { name: 'A Classmate', prep, timing: 0.75, agree: 1, reliability: 0.85, level: m.partner }, SEED, `ag:${m.id}`, 1, weights).overall;
  return { own: e.overall, absent: together(0), present: together(1) };
});
out.mastery = {
  classSceneMasteredPartnerNeverCameReaderRoute: { evenings: readerEvenings.n, readerPart: r3(readerEvenings.reader), n: readerRoute.length, own: stats(readerRoute.map((x) => x.own)), togetherPartnerAbsent: stats(readerRoute.map((x) => x.absent)), togetherPartnerPresent: stats(readerRoute.map((x) => x.present)) },
  briefs: { cases, at100: hundred, mastery: mastered, misses },
  ...otherMastery,
  drawnAtMasteryNot100: drawnAtMastery,
  readerAgainstOwn: togetherRows,
  classSceneMasteredPartnerNeverCame: { n: partnerPart.length, ownWithPartnerPart0: stats(partnerPart.map((x) => x.none)), ownWithPartnerPartHalf: stats(partnerPart.map((x) => x.half)) },
};

// ---------------------------------------------------------------------------------------------------------------
// 5. Preparation, genre known, and the weakest dimension (criteria P1, P2, O3)
// ---------------------------------------------------------------------------------------------------------------
log('5. preparation');
const DEV = actor({}, 50, {}, 40);
const prepRows = Object.fromEntries([0, 0.25, 0.5, 0.75, 1].map((p) => [String(p), stats(BRIEFS.map((b) => briefScore(b, DEV, { prep: p, genre: 1 }).overall))]));
const genreRows = Object.fromEntries([0, 0.1, 0.2, 0.3, 0.6, 1].map((g) => [String(g), stats(BRIEFS.map((b) => briefScore(b, DEV, { prep: 1, genre: g }).overall))]));
const MASTERGENRE = Object.fromEntries([0, 0.15, 0.3].map((g) => [String(g), stats(BRIEFS.map((b) => briefScore(b, MASTER, { prep: 1, genre: g }).overall))]));
const prepOther = Object.fromEntries((['scene', 'night', 'coursework'] as Kind[]).map((k) => [k, Object.fromEntries([0, 0.5, 1].map((p) => [String(p), stats(PIECES.filter((pc) => pc.kind === k).map((pc) => pc.judge(DEV, { prep: p }).overall))]))]));
out.preparation = { developingBriefsByPrep: prepRows, developingBriefsByGenreKnown: genreRows, masteredBriefsByGenreKnown: MASTERGENRE, developingOtherByPrep: prepOther, genreComplete: BRIEF.complete.genre };

// ---------------------------------------------------------------------------------------------------------------
// 6. Growth: the curves, the caps, the day (criteria T1, T2, T3, H5)
// ---------------------------------------------------------------------------------------------------------------
log('6. growth');
const hoursBetween = (from: number, to: number, deliberate: boolean, reach = 100, weight = 1) => { let l = from, h = 0; while (l < to && h < 20000) { const g = abilityGain(l, reach, { weight, focus: 1, deliberate }); if (g <= 1e-9) return null; l += g; h += 1; } return h; };
const bands = [[20, 30], [30, 40], [40, 50], [50, 60], [60, 70], [70, 80], [80, 90], [90, 95], [95, 100]];
out.growth = {
  constants: DEVELOPMENT,
  perHourDeliberate: Object.fromEntries([10, 30, 50, 70, 80, 90, 95, 99].map((l) => [l, r3(abilityGain(l, 100, { weight: 1, focus: 1, deliberate: true }))])),
  perHourOrdinaryReach76: Object.fromEntries([30, 50, 60, 70, 75].map((l) => [l, r3(abilityGain(l, 76, { weight: 1, focus: 1, deliberate: false }))])),
  hoursDeliberateByBand: Object.fromEntries(bands.map(([a, b]) => [`${a}-${b}`, hoursBetween(a!, b!, true)])),
  hoursOrdinaryToReach76: Object.fromEntries([[30, 50], [50, 70], [70, 75]].map(([a, b]) => [`${a}-${b}`, hoursBetween(a!, b!, false, 76)])),
  sameExerciseFourHoursAsSessions: 1 + 0.5 + 0.25 + 0.125,
  fourExercisesAsSessions: 4,
  tierBands: TIER.bands,
  genreStudySessionsTo: Object.fromEntries([30, 60, 90].map((t) => { let f = 0, n = 0; while (f < t && n < 500) { f += 100 * ENGAGEMENT.genre.study * (1 - f / 100); n += 1; } return [t, n]; })),
  genreTapesTo30: (() => { let f = 0, n = 0; while (f < 30 && n < 500) { f += 100 * ENGAGEMENT.genre.practice * (1 - f / 100); n += 1; } return n; })(),
};

// ---------------------------------------------------------------------------------------------------------------
// 7. Randomness against skill (criterion H6)
// ---------------------------------------------------------------------------------------------------------------
log('7. draws');
const drawRows: Record<string, unknown> = {};
for (const [lo, hi, label] of [[30, 40, 'beginner 30 against 40'], [50, 60, 'developing 50 against 60'], [70, 80, 'advanced 70 against 80']] as const) {
  const A = actor({}, lo, {}, lo), B = actor({}, hi, {}, hi);
  const sample = BRIEFS.filter((_, i) => i % 3 === 0);
  let losses = 0, n = 0; const sds: number[] = []; const gaps: number[] = []; const swings: number[] = [];
  for (const b of sample) {
    const a = Array.from({ length: DRAWS }, (_, k) => briefScore(b, A, { key: `ag-a-${k}` }).overall);
    const c = Array.from({ length: DRAWS }, (_, k) => briefScore(b, B, { key: `ag-b-${k}` }).overall);
    sds.push(sd(a)); swings.push(Math.max(...a) - Math.min(...a));
    gaps.push(briefScore(b, B).overall - briefScore(b, A).overall);
    for (let k = 0; k < DRAWS; k += 1) { n += 1; if (c[k]! < a[k]!) losses += 1; }
  }
  drawRows[label] = { briefs: sample.length, draws: DRAWS, sdOfTake: stats(sds), rangeOfTake: stats(swings), expectedGap: stats(gaps), betterLosesShare: r3(losses / n) };
}
out.draws = drawRows;

// ---------------------------------------------------------------------------------------------------------------
// 8. Feedback from evidence: what the evaluation names first, trained (criteria F1, H1)
// ---------------------------------------------------------------------------------------------------------------
log('8. feedback');
let rngState = 12345; const rnd = () => { rngState = (rngState * 1103515245 + 12345) % 2147483648; return rngState / 2147483648; };
const drawn = Array.from({ length: 6 }, () => { const ab = Object.fromEntries(ABILITIES.map((a) => [a, Math.round(30 + 45 * rnd())])) as Record<Ab, number>; const te = Object.fromEntries(TECHNIQUES.map((s) => [s, Math.round(25 + 50 * rnd())])); return actor(ab, 50, te, 50); });
const fb = { named: [] as number[], randomRead: [] as number[], unread: [] as number[], namedIsLargest: 0, n: 0, kinds: {} as Record<string, number> };
for (const [ai, p] of drawn.entries()) for (const [bi, b] of BRIEFS.entries()) {
  if ((bi + ai) % 4) continue;
  const e = briefScore(b, p, { prep: 0.6, genre: 1 });
  const first = e.limits.find((l) => l.kind === 'ability' || l.kind === 'technique');
  if (!first) continue;
  const bumpIt = (kind: string, what: string) => (kind === 'ability' ? bump(p, what as Ab, 20) : bumpT(p, what, 20));
  const after = (kind: string, what: string) => briefScore(b, bumpIt(kind, what), { prep: 0.6, genre: 1 }).overall - e.overall;
  const reads = new Set(Object.keys(e.inputs.abilities));
  const readAbs = ABILITIES.filter((a) => reads.has(a) && a !== 'stamina');
  const unreadAbs = ABILITIES.filter((a) => !reads.has(a));
  const namedGain = after(first.kind, first.what);
  const all = readAbs.map((a) => after('ability', a));
  fb.named.push(namedGain); fb.randomRead.push(mean(all)); if (unreadAbs.length) fb.unread.push(after('ability', unreadAbs[0]!));
  if (namedGain >= Math.max(...all) - 0.05) fb.namedIsLargest += 1;
  fb.n += 1; fb.kinds[e.limits[0]!.kind] = (fb.kinds[e.limits[0]!.kind] ?? 0) + 1;
}
out.feedback = { cases: fb.n, firstLimitKind: fb.kinds, namedTrainedPlus20: stats(fb.named), meanReadAbilityPlus20: stats(fb.randomRead), unreadPlus20: stats(fb.unread), namedWasTheLargestGain: fb.namedIsLargest };

// ---------------------------------------------------------------------------------------------------------------
// 9. Where stamina and the condition reach (criterion C1)
// ---------------------------------------------------------------------------------------------------------------
log('9. condition');
const cond = (kind: Kind, c: { readiness: number; ill?: boolean; injured?: boolean }) => {
  const ps = PIECES.filter((pc) => pc.kind === kind);
  return stats(ps.map((pc) => {
    if (pc.kind === 'brief') { const b = BRIEFS.find((x) => x.id === pc.id)!; const ctx = briefContext(nobody, b, rec(1), { reading: b.readings[0]!.id, prep: { genre: 1 } }); return judgePiece(SEED, MASTER, { ...ctx, condition: c, key: 'ag', expected: true }, briefPiece(b, { ...rec(1), reading: b.readings[0]!.id })).overall; }
    return pc.judge(MASTER).overall; // the other kinds' conditions are measured by tools/condition.ts in play
  }));
};
out.condition = { masteredBriefs: { sufficient: cond('brief', { readiness: 100 }), tired30: cond('brief', { readiness: 30 }), ill: cond('brief', { readiness: 100, ill: true }), injured: cond('brief', { readiness: 100, injured: true }) } };
const staminaEffect = Object.fromEntries(KINDS.map((k) => { const xs = PIECES.map((pc, i) => [pc, effect.stamina![i]!] as const).filter(([pc]) => pc.kind === k).map(([, x]) => x); return [k, stats(xs)]; }));
out.staminaPlus10 = staminaEffect;

// ---------------------------------------------------------------------------------------------------------------
// 10. H4 taken apart, at full precision (from 2026-10-16, brief 09; docs/verification/integration-2026-10-16/h4.md)
// ---------------------------------------------------------------------------------------------------------------
// For each ability: its share of what a piece's abilities move (its +10 effect over the twelve's positive effects), on
// H4's own set of its pieces and everywhere; the pieces where it's the largest of the twelve (its own work), and whether
// its specialist is ahead there; and the share above which specialists come out ahead. Stamina, read only as the drain
// through a piece, is also measured on what it's named for: the last segment of a night. H4' (proposed, not counted)
// reads `ownWork` and `staminaLastSegment`; H4 as written is section 2's, unchanged.
log('10. H4 taken apart');
{
  const exactOf = (e: Evaluation) => e.exact ?? e.overall;
  const evenX = PIECES.map((pc) => exactOf(pc.judge(EVEN)));
  const effX = Object.fromEntries(ABILITIES.map((a) => [a, PIECES.map((pc, i) => exactOf(pc.judge(bump(EVEN, a, 10))) - evenX[i]!)]));
  const total = PIECES.map((_, i) => ABILITIES.reduce((t, a) => t + Math.max(0, effX[a]![i]!), 0));
  const shareOf = (a: Ab, i: number) => (total[i]! > 0 ? Math.max(0, effX[a]![i]!) / total[i]! : 0);
  const specX = Object.fromEntries(ABILITIES.map((a) => [a, PIECES.map((pc, i) => exactOf(pc.judge(specialist(a))) - evenX[i]!)]));
  const bandEdges = [0, 0.1, 0.125, 0.15, 0.2, 0.3, 1.01];
  const bands = bandEdges.slice(0, -1).map((lo, k) => ({ from: lo, to: bandEdges[k + 1]!, pairs: 0, ahead: 0 }));
  const q = (xs: number[], p: number) => (xs.length ? [...xs].sort((x, y) => x - y)[Math.min(xs.length - 1, Math.floor(p * xs.length))]! : 0);
  const kindsOf = (idx: number[]) => idx.reduce((m, i) => { m[PIECES[i]!.kind] = (m[PIECES[i]!.kind] ?? 0) + 1; return m; }, {} as Record<string, number>);
  const abilities = Object.fromEntries(ABILITIES.map((a) => {
    PIECES.forEach((_, i) => { const b = bands.find((x) => shareOf(a, i) >= x.from && shareOf(a, i) < x.to)!; b.pairs += 1; if (specX[a]![i]! > 0.05) b.ahead += 1; });
    const suit = suitable(a);
    const h4 = PIECES.map((_, i) => i).filter((i) => suit[i]);
    const own = PIECES.map((_, i) => i).filter((i) => effX[a]![i]! >= 0.05 && ABILITIES.every((b) => b === a || effX[b]![i]! < effX[a]![i]!));
    return [a, {
      h4Set: { n: h4.length, shareMedian: r3(q(h4.map((i) => shareOf(a, i)), 0.5)), shareP90: r3(q(h4.map((i) => shareOf(a, i)), 0.9)), underATenth: h4.filter((i) => shareOf(a, i) < 0.1).length, kinds: kindsOf(h4) },
      ownWork: { n: own.length, ahead: own.filter((i) => specX[a]![i]! > 0.05).length, kinds: kindsOf(own), pieces: own.map((i) => `${PIECES[i]!.kind}:${PIECES[i]!.id} share ${r3(shareOf(a, i))} specialist ${r2(specX[a]![i]!)}`) },
      shareAQuarterOrMore: PIECES.filter((_, i) => shareOf(a, i) >= 0.25).length,
    }];
  }));
  const S = specialist('stamina');
  const nights = PIECES.filter((pc) => pc.kind === 'night');
  const last = nights.map((pc) => { const s = pc.judge(S), e = pc.judge(EVEN); return { id: pc.id, lastSegment: r2(s.piece!.segments.at(-1)!.overall - e.piece!.segments.at(-1)!.overall), whole: r2(exactOf(s) - exactOf(e)) }; });
  out.h4Account = {
    note: 'At full precision. A specialist is ahead where its result is more than 0.05 over the even actor’s. Own work: the pieces where the ability’s +10 effect is the largest of the twelve.',
    aheadByShare: bands.map((b) => ({ ...b, share: b.pairs ? r3(b.ahead / b.pairs) : null })),
    abilities,
    staminaLastSegment: { nights: last.length, aheadOnTheLast: last.filter((x) => x.lastSegment > 0.05).length, aheadOnTheWhole: last.filter((x) => x.whole > 0.05).length, rows: last },
  };
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
log(`wrote ${OUT}`);
