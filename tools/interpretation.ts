/**
 * SLATE — a way of playing read against the scene, measured against the criteria written before it was tuned (from
 * 2026-10-16; docs/verification/interpretation-2026-10-16/criteria.md, `systems/interpretation.ts`).
 *
 * Each criterion is reported on the briefs written for their genre first (`brief-<genre>`, the ones looked at while the
 * strengths were set) and, held out, on the further briefs (`brief-<genre>-2` and on), which weren't. `--off` sets the
 * grain's strength and its rehearsal shift to 0: the way of playing as it was before, which the criteria should fail.
 *
 *   npx vite-node tools/interpretation.ts -- [--off] [--fresh] [--stage] [--out file.json] [--md file.md]
 */
import { writeFileSync } from 'node:fs';
import { BRIEFS, type Brief } from '../src/engine/content/briefs';
import { ABILITY_DEFS, MASTERED } from '../src/engine/content/abilities';
import { AXES } from '../src/engine/content/approaches';
import { GRAIN } from '../src/engine/content/interpretation';
import type { Axis, AxisValue } from '../src/engine/content/material';
import type { Person } from '../src/engine/domain/model';
import { briefContext, briefMaterial, briefPiece, sceneOf, readingOf, type BriefRecord } from '../src/engine/systems/briefs';
import type { EvalContext, Evaluation, Performer } from '../src/engine/systems/evaluation';
import { judgePiece, loadOf, toneSegments } from '../src/engine/systems/piece';
import { PIECE } from '../src/engine/content/piece';
import { PLAY_MATERIAL, SCENE_MATERIAL, type MaterialProfile } from '../src/engine/content/material';
import { TASK_PROFILES } from '../src/engine/content/tasks';
import { templateById } from '../src/engine/content/coursework';
import { difficultyOf } from '../src/engine/systems/coursework';
import { materialContext } from '../src/engine/systems/material';
import { misfitOf, type Playing } from '../src/engine/systems/material';
import { sceneOfMaterial, suitabilityOf } from '../src/engine/systems/interpretation';

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
/**
 * Fresh held-out (from 2026-10-16, later; `--fresh`): the class scenes and the plays, which no criterion or tuning had
 * looked at, judged as a scene shown in class (the scene task, every part complete, the scene study's difficulty) and
 * on stage, where the briefs are on camera or at a microphone. I1, I3, I4's second clause and I5 as the briefs read them.
 */
function measureFresh() {
  const task = TASK_PROFILES.scene!;
  const difficulty = difficultyOf(templateById('scene-study')!);
  const mats = [...SCENE_MATERIAL, ...PLAY_MATERIAL];
  const judgeM = (m: MaterialProfile, p: Performer, sides: Sides): Evaluation => {
    const read = materialContext(task, m, Object.keys(sides).length ? { ...sides, chosenAt: 0, prep: 1 } : undefined);
    const prep = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1, ...(Object.keys(sides).length ? { approach: 1 } : {}) };
    const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: `fresh:${m.id}`, expected: true };
    return judgePiece(SEED, p, ctx, { segments: toneSegments(m.tones, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') });
  };
  let i1n = 0, i1ok = 0;
  const diffs: number[] = [];
  let bn = 0, bok = 0, i5 = 0;
  for (const m of mats) {
    for (const c of combos) if ((Object.entries(c) as [Axis, AxisValue][]).every(([a, v]) => !misfitOf(a, v, m))) { i1n += 1; if (judgeM(m, MASTER, c).overall === 100) i1ok += 1; }
    if (!misfitOf('scale', 'restrained', m) && !misfitOf('scale', 'expansive', m)) {
      const d = judgeM(m, EVEN, { scale: 'restrained' }).overall - judgeM(m, EVEN, { scale: 'expansive' }).overall;
      diffs.push(r2(d));
      const sr = suitabilityOf('restrained', m, sceneOfMaterial(m)).s, se = suitabilityOf('expansive', m, sceneOfMaterial(m)).s;
      if (Math.abs(sr - se) >= GRAIN.band) { bn += 1; if ((sr > se) === (d > 0)) bok += 1; }
    }
    const all = combos.filter((c) => (Object.entries(c) as [Axis, AxisValue][]).every(([a, v]) => !misfitOf(a, v, m))).map((c) => judgeM(m, EVEN, c).overall);
    const best = Math.max(...all);
    if (all.filter((x) => x >= best - 1).length >= 2) i5 += 1;
  }
  return { materials: mats.length, I1: { checked: i1n, at100: i1ok, holds: i1n === i1ok }, I3: { n: diffs.length, sd: r2(sd(diffs)), restrainedAhead: pct(diffs.filter((d) => d > 0).length, diffs.length), expansiveAhead: pct(diffs.filter((d) => d < 0).length, diffs.length) }, I4: { bandApart: bn, evenActorFollowsSuitability: pct(bok, bn) }, I5: { atLeastTwoWithinAPoint: pct(i5, mats.length) } };
}

/**
 * `--stage` (from 2026-10-16, docs/verification/stage-2026-10-16/criteria.md, written before this was run): ST1 to ST8
 * on the class scenes and plays as class scenes (85 where both scales fit, and 89 from the integration pass of 2026-10-16,
 * which added four drama scenes), and the fresh sets F1 (the plays as a production's night, its own
 * task) and F2 (even actors at 40 and 75).
 */
function measureStage() {
  const sceneTask = TASK_PROFILES.scene!;
  const difficulty = difficultyOf(templateById('scene-study')!);
  const judgeAs = (task: typeof sceneTask, m: MaterialProfile, p: Performer, sides: Sides): number => {
    const read = materialContext(task, m, Object.keys(sides).length ? { ...sides, chosenAt: 0, prep: 1 } : undefined);
    const prep = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1, ...(Object.keys(sides).length ? { approach: 1 } : {}) };
    const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: `stage:${m.id}`, expected: true };
    return judgePiece(SEED, p, ctx, { segments: toneSegments(m.tones, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') }).overall;
  };
  const both = (m: MaterialProfile) => !misfitOf('scale', 'restrained', m) && !misfitOf('scale', 'expansive', m);
  const suit = (m: MaterialProfile) => { const sc = sceneOfMaterial(m); return { r: suitabilityOf('restrained', m, sc), e: suitabilityOf('expansive', m, sc) }; };
  const ahead = (task: typeof sceneTask, mats: readonly MaterialProfile[], p: Performer) => {
    let r = 0, e = 0, n = 0;
    for (const m of mats) { if (!both(m)) continue; n += 1; const d = judgeAs(task, m, p, { scale: 'restrained' }) - judgeAs(task, m, p, { scale: 'expansive' }); if (d > 0) r += 1; else if (d < 0) e += 1; }
    return { n, restrainedAhead: r, expansiveAhead: e, holds: r >= 0.25 * n && e >= 0.25 * n };
  };
  const follows = (task: typeof sceneTask, mats: readonly MaterialProfile[], p: Performer) => {
    let n = 0, ok = 0;
    for (const m of mats) { if (!both(m)) continue; const { r, e } = suit(m); if (Math.abs(r.s - e.s) < GRAIN.band) continue; n += 1; const d = judgeAs(task, m, p, { scale: 'restrained' }) - judgeAs(task, m, p, { scale: 'expansive' }); if ((r.s > e.s) === (d > 0)) ok += 1; }
    return { n, follow: ok, share: pct(ok, n), holds: ok >= 0.75 * n };
  };
  const mastery = (task: typeof sceneTask, mats: readonly MaterialProfile[]) => {
    let n = 0, ok = 0;
    for (const m of mats) for (const c of combos) if ((Object.entries(c) as [Axis, AxisValue][]).every(([a, v]) => !misfitOf(a, v, m))) { n += 1; if (judgeAs(task, m, MASTER, c) === 100) ok += 1; }
    return { checked: n, at100: ok, holds: n === ok };
  };
  const several = (task: typeof sceneTask, mats: readonly MaterialProfile[]) => {
    let ok = 0;
    for (const m of mats) { const all = combos.filter((c) => (Object.entries(c) as [Axis, AxisValue][]).every(([a, v]) => !misfitOf(a, v, m))).map((c) => judgeAs(task, m, EVEN, c)); const best = Math.max(...all); if (all.filter((x) => x >= best - 1).length >= 2) ok += 1; }
    return { materials: mats.length, atLeastTwoWithinAPoint: ok, share: pct(ok, mats.length), holds: ok >= 0.8 * mats.length };
  };
  const mats = [...SCENE_MATERIAL, ...PLAY_MATERIAL];
  // ST2: the house's own scale signal, and what the better side rests on.
  let st2n = 0, st2ok = 0;
  const house = mats.some((m) => [suit(m).r, suit(m).e].some((x) => x.signals.some((g) => g.source === 'A House To Reach')));
  for (const m of mats) { if (!both(m)) continue; const { r, e } = suit(m); if (Math.abs(r.s - e.s) < GRAIN.band) continue; st2n += 1; const better = r.s > e.s ? r : e; const top = better.signals.find((g) => g.v > 0); if (top && top.source !== 'A House To Reach') st2ok += 1; }
  // ST3: projection is a demand. With the grain held at 0 (so suitability, which differs by medium, isn't what's
  // compared), the voice-and-body specialist does better on stage than at a close frame; the even actor the same.
  const strength = GRAIN.strength;
  Object.assign(GRAIN as Record<string, number>, { strength: 0 });
  const VOICE_BODY = actor({ vocal: 85, physical: 85 }, (600 - 170) / 10);
  let st3n = 0, st3ok = 0, evenSame = 0;
  for (const m of mats) for (const scale of ['restrained', 'expansive'] as const) {
    if (misfitOf('scale', scale, m)) continue;
    const cam = { ...m, medium: 'camera' as const };
    st3n += 1;
    if (judgeAs(sceneTask, m, VOICE_BODY, { scale }) > judgeAs(sceneTask, cam, VOICE_BODY, { scale })) st3ok += 1;
    if (Math.abs(judgeAs(sceneTask, m, EVEN, { scale }) - judgeAs(sceneTask, cam, EVEN, { scale })) < 0.05) evenSame += 1;
  }
  Object.assign(GRAIN as Record<string, number>, { strength });
  // ST4: within each genre with five or more stage materials, both sides better-suited somewhere.
  const byGenre: Record<string, { r: number; e: number; n: number }> = {};
  for (const m of mats) { if (!both(m)) continue; const g = sceneOfMaterial(m).genre ?? 'none'; const { r, e } = suit(m); const x = (byGenre[g] ??= { r: 0, e: 0, n: 0 }); x.n += 1; if (r.s > e.s) x.r += 1; else if (e.s > r.s) x.e += 1; }
  const big = Object.entries(byGenre).filter(([, x]) => x.n >= 5);
  // ST6: strength carrying the harder side.
  const fill = (n: number) => (600 - n) / 8;
  const EXP = actor({ presence: 85, vocal: 75, physical: 75 }, fill(235));
  const RES = actor({ emotionalDepth: 85, composure: 75, focus: 75 }, fill(235));
  let st6a = 0, st6an = 0, st6b = 0, st6bn = 0;
  for (const m of mats) {
    if (!both(m)) continue;
    const { r, e } = suit(m);
    if (r.s > e.s) { st6an += 1; if (judgeAs(sceneTask, m, EXP, { scale: 'expansive' }) > judgeAs(sceneTask, m, EXP, { scale: 'restrained' })) st6a += 1; }
    if (e.s > r.s) { st6bn += 1; if (judgeAs(sceneTask, m, RES, { scale: 'restrained' }) > judgeAs(sceneTask, m, RES, { scale: 'expansive' })) st6b += 1; }
  }
  const perf = TASK_PROFILES.performance!;
  return {
    ST1: ahead(sceneTask, mats, EVEN),
    ST2: { houseSignalOnAnyMaterial: house, bandApart: st2n, restsOnTheScene: st2ok, holds: !house && st2ok === st2n },
    ST3: { cases: st3n, specialistBetterOnStage: st3ok, evenActorSame: evenSame, holds: st3ok === st3n && evenSame === st3n },
    ST4: { genres: Object.fromEntries(big.map(([g, x]) => [g, x])), holds: big.every(([, x]) => x.r >= 1 && x.e >= 1) },
    ST5: mastery(sceneTask, mats),
    ST6: { expansiveSpecialistWinsAgainstTheGrain: `${st6a} of ${st6an}`, restrainedSpecialistWinsAgainstTheGrain: `${st6b} of ${st6bn}`, holds: st6a >= 0.25 * st6an && st6b >= 0.25 * st6bn },
    ST7: several(sceneTask, mats),
    ST8: follows(sceneTask, mats, EVEN),
    F1: { task: 'performance', ST1: ahead(perf, PLAY_MATERIAL, EVEN), ST5: mastery(perf, PLAY_MATERIAL), ST7: several(perf, PLAY_MATERIAL), ST8: follows(perf, PLAY_MATERIAL, EVEN) },
    F2: { at40: { ST1: ahead(sceneTask, mats, actor({}, 40)), ST8: follows(sceneTask, mats, actor({}, 40)) }, at75: { ST1: ahead(sceneTask, mats, actor({}, 75)), ST8: follows(sceneTask, mats, actor({}, 75)) } },
    bySide: mats.filter(both).map((m) => { const { r, e } = suit(m); return `${m.id}: restrained ${r.s}, expansive ${e.s}`; }),
  };
}

const out = { strength: GRAIN.strength, prep: GRAIN.prep, I2: measureI2(BRIEFS), designed: measure(first), heldOut: measure(held), ...(flag('fresh') ? { freshHeldOut: measureFresh() } : {}), ...(flag('stage') ? { stage: measureStage() } : {}) };
console.log(JSON.stringify(out, null, 1));
const o = arg('out', '');
if (o) writeFileSync(o, `${JSON.stringify(out, null, 1)}\n`);
void ABILITY_DEFS;
