/**
 * SLATE — ST3-R and ST6-R measured as the owner's approved criteria write them (from 2026-10-16, brief 10;
 * docs/verification/decisions-2026-10-16/criteria.md, section 1, committed before any of this was run). Read by
 * `tools/interpretation.ts -- --st3 <file>` and `-- --st6 <file>`, which write each beside brief 09's case lists.
 *
 * Every case is a class scene or a play as a class scene (Scene Study's task and difficulty), fully prepared (every
 * part 1, the chosen way rehearsed in at 1), on a sufficient day (readiness 100), with no draw, as `--stage` judges it.
 * "Ahead" is ahead at full precision by more than 0.05, "behind" behind by more than 0.05. Every performer is TEST
 * SETUP (levels set directly), and every budget is printed beside the figures it gives.
 *
 * From 2026-10-17 (brief 12) also ST6-R2, the replacements of ST6-R (a), (c), (e) and (g)
 * (docs/verification/resolution-2026-10-17/acting-criteria.md, committed before any of it was written): `st6r2Cases`
 * builds every piece a player can play restrained (the class scenes and plays as class scenes, the plays as nights, the
 * briefs in their readings), `ST6R2` holds each clause's measure, which `tests/decisions-judge.test.ts` asserts, and
 * `measureST6R2` runs them all, read by `tools/interpretation.ts -- --st6r2 <file>`.
 */
import { ABILITY_DEFS, MASTERED, type AbilityId } from '../src/engine/content/abilities';
import { APPROACH_EFFECT, type Inputs } from '../src/engine/content/approaches';
import { CIRCUMSTANCE_AFFINITY, GRAIN } from '../src/engine/content/interpretation';
import { PIECE, TONE_LEAN } from '../src/engine/content/piece';
import { PLAY_MATERIAL, SCENE_MATERIAL, type MaterialProfile } from '../src/engine/content/material';
import { BRIEFS, type Brief } from '../src/engine/content/briefs';
import { SCENES, templateById } from '../src/engine/content/coursework';
import { EVALUATION, TASK_PROFILES, type Dimension } from '../src/engine/content/tasks';
import type { Person } from '../src/engine/domain/model';
import { difficultyOf } from '../src/engine/systems/coursework';
import { leanedWeights, replay, replayAs, frozenPerformer, type EvalContext, type Evaluation, type Limit, type Performer, type WorkRecord } from '../src/engine/systems/evaluation';
import { judgePiece, judgePieceExact, loadOf, nightPiece, unitSegments, type PieceSpec } from '../src/engine/systems/piece';
import { materialContext, misfitOf } from '../src/engine/systems/material';
import { requiredFor, sceneOfMaterial, stakesScale, suitabilityOf } from '../src/engine/systems/interpretation';
import { briefContext, briefMaterial, briefPiece, readingOf, sceneOf, type BriefRecord } from '../src/engine/systems/briefs';
import { runningOf, withPart } from '../src/engine/systems/workload';
import { NIGHT_DIFFICULTY } from '../src/engine/systems/school';
import { createSave, loadSave } from '../src/engine';
import { newLifeConfig } from '../src/engine/world/bootstrap';
import { deserialise, serialise } from '../src/engine/persistence/adapter';

const SEED = 'interpretation';
type Scale = 'restrained' | 'expansive';
const r1 = (x: number) => Math.round(x * 10) / 10;
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
const ABILITIES = ABILITY_DEFS.map((d) => d.id);
const actor = (ab: Partial<Record<string, number>>, fill: number, tech = 50): Performer => ({ ability: (id) => ab[id] ?? fill, full: () => 100, technique: () => tech });
/** What a profile's twelve abilities come to: its budget, printed with every figure it gives. */
export const budgetOf = (p: Performer) => ABILITIES.reduce((t, id) => t + p.ability(id as AbilityId), 0);
const MATS = (): MaterialProfile[] => [...SCENE_MATERIAL, ...PLAY_MATERIAL];

function scenePieceOf(m: MaterialProfile, scale: Scale | undefined, o: { key?: string; prep?: number } = {}) {
  const task = TASK_PROFILES.scene!;
  const prepAt = o.prep ?? 1;
  // With no way chosen (from 2026-10-17, ST6-R2's check against `tools/pieces.ts`), no choice's rehearsal is read.
  const read = materialContext(task, m, scale ? { scale, chosenAt: 0, prep: prepAt } : undefined);
  const prep = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1, ...(scale ? { approach: prepAt } : {}) };
  // The choice's rehearsal is complete at the scene's own mark (`read.required`: less with the grain, more against it),
  // as a showing reads it; the other parts at coursework's 0.9. At a choice rehearsed in at 1 the two are the same.
  const required = { familiarity: 0.9, memorization: 0.9, interpretation: 0.9, rehearsal: 0.9, partner: 0.9, ...(scale ? { approach: read.required } : {}) };
  const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required, difficulty: difficultyOf(templateById('scene-study')!), condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: o.key ?? `stage:${m.id}`, ...(o.key ? {} : { expected: true }) };
  const spec = { segments: unitSegments(m, 2), work: [] as number[], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') };
  return { task, ctx, spec };
}
const judgeOn = (m: MaterialProfile, p: Performer, scale: Scale | undefined, o: { key?: string; prep?: number } = {}): Evaluation => { const { ctx, spec } = scenePieceOf(m, scale, o); return judgePiece(SEED, p, ctx, spec); };
const exactOn = (m: MaterialProfile, p: Performer, scale: Scale): number => judgeOn(m, p, scale).exact!;
const defectsOf = (m: MaterialProfile, p: Performer, scale: Scale, shown: Evaluation): string[] => { const { ctx, spec } = scenePieceOf(m, scale); return roundingDefects(shown, judgePieceExact(SEED, p, ctx, spec), ctx, spec); };
const withGrain = <T,>(strength: number, f: () => T): T => { const s0 = GRAIN.strength; Object.assign(GRAIN as Record<string, number>, { strength }); try { return f(); } finally { Object.assign(GRAIN as Record<string, number>, { strength: s0 }); } };

/**
 * Every shown figure of a judged piece against its own exact value rounded once (ST3-R (d)): the whole, each dimension,
 * each limit's cost to its dimension and to the whole, the grain's points, and each segment's whole, dimensions and
 * named limits. Returns what didn't hold, empty where everything did.
 */
export function roundingDefects(shown: Evaluation, exact: ReturnType<typeof judgePieceExact>, ctx: EvalContext, spec: PieceSpec): string[] {
  const bad: string[] = [];
  const same = (what: string, s: number, x: number) => { if (s !== r1(x)) bad.push(`${what}: shown ${s}, exact ${x}`); };
  const ev = exact.evaluation;
  same('whole', shown.overall, ev.overall);
  if (shown.exact !== ev.overall) bad.push(`whole's exact kept ${shown.exact}, worked ${ev.overall}`);
  // The exact values are worked from their parts' exact values, by hand from the rule, so a whole worked from rounded
  // parts can't pass as exact: each segment's whole is `meanShare` of its dimensions' weighted mean and the rest their
  // least (`EVALUATION`), its weights the task's leant by the piece's lean and the segment's tones (`TONE_LEAN`, each to
  // the power of one over how many it holds), normalized; and the piece's whole is the segments' by their weights.
  const W = spec.segments.reduce((t, x) => t + x.weight, 0);
  const byHand = exact.segments.reduce((t, e, s) => t + e.overall * spec.segments[s]!.weight, 0) / W;
  if (Math.abs(byHand - ev.overall) > 1e-9) bad.push(`whole ${ev.overall} isn't its segments' exact wholes by weight, ${byHand}`);
  exact.segments.forEach((e, s) => {
    const tones = spec.segments[s]!.tones;
    const lean = Object.fromEntries(Object.keys(ctx.task.dims).map((d) => [d, (ctx.lean?.[d as Dimension] ?? 1) * tones.reduce((x, t) => x * (TONE_LEAN[t]?.[d as Dimension] ?? 1) ** (1 / tones.length), 1)]));
    const w = leanedWeights(ctx.task, [], lean);
    const qs = e.dimensions.map((d) => ({ q: d.quality, w: w[d.dimension] ?? 0 }));
    const whole = EVALUATION.meanShare * (qs.reduce((t, x) => t + x.q * x.w, 0) / qs.reduce((t, x) => t + x.w, 0)) + (1 - EVALUATION.meanShare) * Math.min(...qs.map((x) => x.q));
    if (Math.abs(whole - e.overall) > 1e-9) bad.push(`segment ${s + 1}'s whole ${e.overall} isn't worked from its dimensions' exact values, ${whole}`);
  });
  const limitsAgree = (where: string, s: readonly Limit[], x: readonly Limit[]) => {
    const kept = x.filter((l) => r1(l.by) > 0);
    if (s.length !== kept.length) bad.push(`${where}: ${s.length} limits shown, ${kept.length} worth a tenth`);
    for (const l of s) {
      const e = x.find((y) => y.kind === l.kind && y.what === l.what && y.dimension === l.dimension);
      if (!e) { bad.push(`${where}: ${l.kind}:${l.what} shown with no exact`); continue; }
      same(`${where} ${l.kind}:${l.what} by`, l.by, e.by);
      if (l.whole !== undefined) same(`${where} ${l.kind}:${l.what} whole`, l.whole, e.whole ?? 0);
    }
  };
  for (const d of shown.dimensions) {
    const x = ev.dimensions.find((y) => y.dimension === d.dimension)!;
    same(`${d.dimension}`, d.quality, x.quality);
    if (d.grain) same(`${d.dimension} grain`, d.grain.points, x.grain!.points);
    limitsAgree(d.dimension, d.limits, x.limits);
  }
  (shown.piece?.segments ?? []).forEach((seg, s) => {
    const x = exact.segments[s]!;
    same(`segment ${s + 1}`, seg.overall, x.overall);
    for (const [d, q] of Object.entries(seg.dims)) same(`segment ${s + 1} ${d}`, q!, x.dimensions.find((y) => y.dimension === d)!.quality);
    const all = x.dimensions.flatMap((y) => y.limits);
    if (seg.top) limitsAgree(`segment ${s + 1}`, seg.top, all.filter((l) => seg.top!.some((t) => t.kind === l.kind && t.what === l.what && t.dimension === l.dimension)));
  });
  return bad;
}

/**
 * ST3-R, (a) to (d), on every class scene and play as a class scene and every scale side that fits, the grain held at
 * nothing so the medium's own lean is compared, as ST3 measured. The performers:
 * - the criterion's even actor: abilities 55, techniques 50, stamina 55 (ST3's);
 * - even in everything read: abilities 55 of 100, techniques 49.5 of 90 (the same share), stamina 55; and undrained, the
 *   same with stamina 100;
 * - the voice-and-body specialist: vocal 85, physical 85, the other ten (600 − 170) / 10, techniques 50.
 */
export function measureST3R() {
  const at = (tech: number, stamina: number): Performer => ({ ability: (id) => (id === 'stamina' ? stamina : 55), full: () => 100, technique: () => tech });
  const CRITERION = at(50, 55), EVEN_READ = at(0.55 * MASTERED, 55), UNDRAINED = at(0.55 * MASTERED, 100), CRITERION_UNDRAINED = at(50, 100);
  const VOICE_BODY = actor({ vocal: 85, physical: 85 }, (600 - 170) / 10);
  const cases: Record<string, unknown>[] = [];
  const records: { rec: WorkRecord; exact: number; drawn: boolean; id: string }[] = [];
  withGrain(0, () => {
    for (const m of MATS()) for (const scale of ['restrained', 'expansive'] as const) {
      if (misfitOf('scale', scale, m)) continue;
      const cam: MaterialProfile = { ...m, medium: 'camera' };
      const id = `${m.id} ${scale}`;
      // (a) The same work judged twice; its record replayed; and the same with the draw, replayed under its seed.
      const s = judgeOn(m, CRITERION, scale), again = judgeOn(m, CRITERION, scale);
      const replayed = replayAs({ inputs: s.inputs, task: s.task, ruleset: s.ruleset }, TASK_PROFILES.scene!, frozenPerformer(s.inputs))!;
      const drawn = judgeOn(m, CRITERION, scale, { key: `st3r:${m.id}:${scale}:drawn` });
      const drawnReplayed = replay({ inputs: drawn.inputs, task: drawn.task, ruleset: drawn.ruleset }, TASK_PROFILES.scene!)!;
      const rec = (e: Evaluation, key: string): WorkRecord => ({ at: 0, task: e.task, taskLabel: e.taskLabel, what: id, overall: e.overall, dims: Object.fromEntries(e.dimensions.map((d) => [d.dimension, d.quality])), mastery: e.mastery, limits: e.limits.slice(0, 3), ruleset: e.ruleset, inputs: { ...e.inputs, key } });
      records.push({ rec: rec(s, `st3r:${m.id}:${scale}`), exact: s.exact!, drawn: false, id }, { rec: rec(drawn, `st3r:${m.id}:${scale}:drawn`), exact: drawn.exact!, drawn: true, id });
      const evenS = judgeOn(m, UNDRAINED, scale), evenC = judgeOn(cam, UNDRAINED, scale);
      // (b) The stage's demand, and stamina's.
      const vbS = exactOn(m, VOICE_BODY, scale), vbC = exactOn(cam, VOICE_BODY, scale);
      const drainStage = exactOn(m, CRITERION_UNDRAINED, scale) - s.exact!;
      const c = judgeOn(cam, CRITERION, scale);
      const drainClose = exactOn(cam, CRITERION_UNDRAINED, scale) - c.exact!;
      // (c) The criterion's even actor's difference, taken apart one input at a time.
      const diffOf = (p: Performer) => exactOn(m, p, scale) - exactOn(cam, p, scale);
      const exactApart = s.exact! - c.exact!, evenRead = diffOf(EVEN_READ), residual = diffOf(UNDRAINED);
      // (d) Every shown figure its own exact value rounded once, for the criterion's actor and the specialist, on both.
      const defects = [
        ...defectsOf(m, CRITERION, scale, s).map((x) => `stage, criterion: ${x}`),
        ...defectsOf(cam, CRITERION, scale, c).map((x) => `close, criterion: ${x}`),
        ...defectsOf(m, VOICE_BODY, scale, judgeOn(m, VOICE_BODY, scale)).map((x) => `stage, specialist: ${x}`),
        ...defectsOf(cam, VOICE_BODY, scale, judgeOn(cam, VOICE_BODY, scale)).map((x) => `close, specialist: ${x}`),
      ];
      const units = scenePieceOf(m, scale).spec.segments.length;
      cases.push({
        material: m.id, scale, units,
        a: { judgedTwice: Math.abs(again.exact! - s.exact!), replayed: Math.abs(replayed.exact! - s.exact!), drawnReplayed: Math.abs(drawnReplayed.exact! - drawn.exact!), evenUndrained: { stage: evenS.exact, close: evenC.exact, apart: evenS.exact! - evenC.exact!, shownSame: evenS.overall === evenC.overall } },
        b: { specialist: { stage: vbS, close: vbC, betterOnStage: vbS - vbC }, drain: { stage: drainStage, close: drainClose, partOfTheDifference: evenRead - residual } },
        c: { exactApart, techniques: exactApart - evenRead, stamina: evenRead - residual, residual, shown: { stage: s.overall, close: c.overall } },
        d: defects,
      });
    }
  });
  // (a) After a save and a load: the records kept in a played save, the save serialised, read back and opened as any
  // save is (`loadSave`, with its one-time steps), and each record replayed from the save that was read.
  const life = createSave(1, 'st3r', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  const afterLoad = new Map<string, number>();
  withGrain(0, () => { for (let i = 0; i < records.length; i += 150) {
    const batch = records.slice(i, i + 150);
    life.player.work = batch.map((x) => structuredClone(x.rec));
    const opened = loadSave(deserialise(serialise(life.universe)) as never);
    for (const x of batch) {
      const w = opened.player.work!.find((y) => y.inputs.key === x.rec.inputs.key)!;
      const again = x.drawn ? replay(w, TASK_PROFILES.scene!) : replayAs(w, TASK_PROFILES.scene!, frozenPerformer(w.inputs));
      afterLoad.set(x.rec.inputs.key, Math.abs((again?.exact ?? NaN) - x.exact));
    }
  } });
  for (const k of cases) { const key = `st3r:${k.material}:${k.scale}`; (k.a as Record<string, number>).afterSaveAndLoad = afterLoad.get(key)!; (k.a as Record<string, number>).drawnAfterSaveAndLoad = afterLoad.get(`${key}:drawn`)!; }
  type C = { material: string; scale: string; units: number; a: { judgedTwice: number; replayed: number; drawnReplayed: number; afterSaveAndLoad: number; drawnAfterSaveAndLoad: number; evenUndrained: { apart: number; shownSame: boolean } }; b: { specialist: { betterOnStage: number }; drain: { stage: number; close: number; partOfTheDifference: number } }; c: { exactApart: number; techniques: number; stamina: number; residual: number; shown: { stage: number; close: number } }; d: string[] };
  const cs = cases as unknown as C[];
  const most = (f: (x: C) => number) => Math.max(...cs.map((x) => Math.abs(f(x))));
  const least = (f: (x: C) => number) => Math.min(...cs.map(f));
  const withLater = cs.filter((x) => x.units > 1);
  const verdict = {
    a: { met: cs.every((x) => x.a.judgedTwice < 1e-12 && x.a.replayed < 1e-12 && x.a.drawnReplayed < 1e-12 && x.a.afterSaveAndLoad < 1e-12 && x.a.drawnAfterSaveAndLoad < 1e-12 && Math.abs(x.a.evenUndrained.apart) < 1e-9 && x.a.evenUndrained.shownSame), largest: { judgedTwice: most((x) => x.a.judgedTwice), replayed: most((x) => x.a.replayed), drawnReplayed: most((x) => x.a.drawnReplayed), afterSaveAndLoad: most((x) => x.a.afterSaveAndLoad), drawnAfterSaveAndLoad: most((x) => x.a.drawnAfterSaveAndLoad), evenUndrainedApart: most((x) => x.a.evenUndrained.apart) }, evenUndrainedShownSame: cs.filter((x) => x.a.evenUndrained.shownSame).length },
    b: { met: cs.every((x) => x.b.specialist.betterOnStage > 0) && withLater.every((x) => x.b.drain.stage > 1e-9 && x.b.drain.close > 1e-9), specialistBetterOnStage: cs.filter((x) => x.b.specialist.betterOnStage > 0).length, leastBetterOnStage: least((x) => x.b.specialist.betterOnStage), casesWithALaterUnit: withLater.length, drainOnBoth: withLater.filter((x) => x.b.drain.stage > 1e-9 && x.b.drain.close > 1e-9).length, leastDrain: { stage: least((x) => x.b.drain.stage), close: least((x) => x.b.drain.close) }, drainsPartOfTheDifferenceAbove1e9: withLater.filter((x) => Math.abs(x.b.drain.partOfTheDifference) > 1e-9).length, leastDrainPartOfTheDifference: Math.min(...withLater.map((x) => Math.abs(x.b.drain.partOfTheDifference))) },
    c: { met: cs.every((x) => Math.abs(x.c.residual) < 1e-9 && Math.abs(x.c.exactApart - (x.c.techniques + x.c.stamina + x.c.residual)) < 1e-12), largest: { exactApart: most((x) => x.c.exactApart), techniques: most((x) => x.c.techniques), stamina: most((x) => x.c.stamina), residual: most((x) => x.c.residual) } },
    d: { met: cs.every((x) => x.d.length === 0), casesWithADefect: cs.filter((x) => x.d.length).length, judgmentsChecked: 4 * cs.length, first: cs.flatMap((x) => x.d.map((y) => `${x.material} ${x.scale}: ${y}`)).slice(0, 10) },
  };
  const asWritten = { sameAsShown: cs.filter((x) => x.c.shown.stage === x.c.shown.close).length, aTenthApart: cs.filter((x) => x.c.shown.stage !== x.c.shown.close).length };
  return {
    criterion: 'ST3-R (docs/verification/decisions-2026-10-16/criteria.md)', cases: cs.length,
    budgets: { criterionEvenActor: budgetOf(CRITERION), evenInEverythingRead: budgetOf(EVEN_READ), undrained: budgetOf(UNDRAINED), voiceAndBodySpecialist: budgetOf(VOICE_BODY) },
    verdict, met: verdict.a.met && verdict.b.met && verdict.c.met && verdict.d.met,
    st3AsWritten: { ...asWritten, met: asWritten.aTenthApart === 0, note: 'ST3 as written, superseded by ST3-R and kept as the record: the criterion’s even actor the same on stage and at a close frame as shown' },
    list: cs.map((x) => ({ ...x, c: { ...x.c, exactApart: r4(x.c.exactApart) } })),
  };
}

/** The work a material comes from (a class scene's play, a play's own title), and the genre whose register it's read in. */
const SCENE_PLAY = new Map(SCENES.map((s) => [s.id, s.play]));
const norm = (t: string) => t.toLowerCase().replace(/’/g, "'").replace(/^the /, '');
export const workOf = (m: MaterialProfile) => norm(SCENE_PLAY.get(m.id) ?? m.title);
export const familyOf = (m: MaterialProfile) => sceneOfMaterial(m).genre ?? 'none';

/**
 * ST6-R, (a) to (f), on the class scenes and plays where both scale sides fit. Every ability not named shares what's left
 * of the even actor's 600 evenly; the budgets are printed. "Against the grain" is a material where expansive suits
 * better (its suitability over restrained's, `suitabilityOf`).
 */
export function measureST6R(budgetFill = (n: number) => (600 - n) / 9) {
  const RES = actor({ emotionalDepth: 85, composure: 75, focus: 75 }, budgetFill(235));
  const EXP = actor({ presence: 85, vocal: 75, physical: 75 }, budgetFill(235));
  const EVEN = actor({}, 50);
  const both = MATS().filter((m) => !misfitOf('scale', 'restrained', m) && !misfitOf('scale', 'expansive', m));
  const suit = (m: MaterialProfile) => { const sc = sceneOfMaterial(m); return { r: suitabilityOf('restrained', m, sc).s, e: suitabilityOf('expansive', m, sc).s }; };
  const X = new Map<string, number>();
  const x = (m: MaterialProfile, who: 'RES' | 'EXP' | 'EVEN', scale: Scale, prep = 1) => { const k = `${m.id}|${who}|${scale}|${prep}`; let v = X.get(k); if (v === undefined) { v = judgeOn(m, { RES, EXP, EVEN }[who], scale, { prep }).exact!; X.set(k, v); } return v; };
  const against = both.filter((m) => suit(m).e > suit(m).r).sort((a, b) => (suit(a).e - suit(a).r) - (suit(b).e - suit(b).r) || a.id.localeCompare(b.id));
  const withIt = both.filter((m) => suit(m).r > suit(m).e);
  const pct = (n: number, d: number) => (d ? n / d : 0);
  // (a) Viable.
  const wins = against.filter((m) => x(m, 'RES', 'restrained') - x(m, 'EVEN', 'expansive') > 0.05);
  const rateA = pct(wins.length, against.length);
  // (b) Restraint's own craft pays: the specialist's lift over the even actor larger playing restrained than expansive.
  const lifts = both.map((m) => ({ id: m.id, restrained: x(m, 'RES', 'restrained') - x(m, 'EVEN', 'restrained'), expansive: x(m, 'RES', 'expansive') - x(m, 'EVEN', 'expansive') }));
  const larger = lifts.filter((l) => l.restrained > l.expansive + 1e-9);
  // (c) Abilities, preparation, circumstances, interpretation.
  const evenWins = against.filter((m) => x(m, 'EVEN', 'restrained') - x(m, 'EVEN', 'expansive') > 0.05);
  const halfWins = against.filter((m) => x(m, 'RES', 'restrained', 0.5) - x(m, 'EVEN', 'expansive') > 0.05);
  const half = Math.floor(against.length / 2);
  const smaller = against.slice(0, half), largerGap = against.slice(against.length - half);
  const rateOn = (ms: MaterialProfile[]) => pct(ms.filter((m) => wins.includes(m)).length, ms.length);
  const allowed = wins.every((m) => !misfitOf('scale', 'restrained', m));
  // (d) Limits kept.
  const behind = against.filter((m) => x(m, 'RES', 'restrained') - x(m, 'EVEN', 'expansive') < -0.05);
  const sizeWorks = behind.filter((m) => x(m, 'EXP', 'expansive') - x(m, 'RES', 'restrained') > 0.05);
  // (e) Diverse, independent examples.
  const byWork = (ms: MaterialProfile[]) => ms.reduce((o, m) => { o[workOf(m)] = (o[workOf(m)] ?? 0) + 1; return o; }, {} as Record<string, number>);
  const winWorks = byWork(wins), limitWorks = byWork(behind);
  const families = [...new Set(wins.map(familyOf))];
  const mostFromOne = Math.max(0, ...Object.values(winWorks));
  // (f) The other half: the expansive specialist playing expansive against its own restrained take, where restraint suits.
  const expWins = withIt.filter((m) => x(m, 'EXP', 'expansive') - x(m, 'EXP', 'restrained') > 0.05);
  const expWinsShown = withIt.filter((m) => r1(x(m, 'EXP', 'expansive')) > r1(x(m, 'EXP', 'restrained')));
  const resWinsShown = against.filter((m) => r1(x(m, 'RES', 'restrained')) > r1(x(m, 'RES', 'expansive')));
  const verdict = {
    a: { met: rateA >= 0.25, wins: wins.length, of: against.length, rate: r4(rateA), materials: wins.map((m) => m.id) },
    b: { met: pct(larger.length, both.length) >= 0.9, larger: larger.length, of: both.length, rate: r4(pct(larger.length, both.length)), notLarger: lifts.filter((l) => !(l.restrained > l.expansive + 1e-9)).map((l) => `${l.id}: restrained ${r4(l.restrained)}, expansive ${r4(l.expansive)}`) },
    c: {
      met: pct(evenWins.length, against.length) <= rateA - 0.1 && halfWins.length < wins.length && rateOn(smaller) >= rateOn(largerGap) + 0.2 && allowed,
      abilities: { evenActorRestrainedAhead: evenWins.length, rate: r4(pct(evenWins.length, against.length)), atMost: r4(rateA - 0.1), met: pct(evenWins.length, against.length) <= rateA - 0.1 },
      preparation: { halfRehearsedWins: halfWins.length, fullyRehearsedWins: wins.length, met: halfWins.length < wins.length },
      circumstances: { half, smallerGapRate: r4(rateOn(smaller)), largerGapRate: r4(rateOn(largerGap)), smallerGapUpTo: smaller.length ? r4(suit(smaller.at(-1)!).e - suit(smaller.at(-1)!).r) : null, largerGapFrom: largerGap.length ? r4(suit(largerGap[0]!).e - suit(largerGap[0]!).r) : null, met: rateOn(smaller) >= rateOn(largerGap) + 0.2 },
      interpretation: { everyWinAllowed: allowed },
    },
    d: { met: pct(behind.length, against.length) >= 0.25 && pct(sizeWorks.length, behind.length) >= 0.5, behind: behind.length, of: against.length, rate: r4(pct(behind.length, against.length)), expansiveSpecialistAheadThere: sizeWorks.length, shareThere: r4(pct(sizeWorks.length, behind.length)), materials: behind.map((m) => m.id) },
    e: { met: Object.keys(winWorks).length >= 6 && families.length >= 3 && mostFromOne <= 0.25 * wins.length && Object.keys(limitWorks).length >= 4, winWorks, winFamilies: families, mostFromOneWork: mostFromOne, limitWorks },
    f: { met: pct(expWins.length, withIt.length) >= 0.25, wins: expWins.length, of: withIt.length, rate: r4(pct(expWins.length, withIt.length)), asShown: expWinsShown.length },
  };
  // Beside the verdicts, not part of them: where restraint suits better, whether the restrained specialist is ahead of the
  // even actor at all with both playing restrained; and how much of its restrained lift is restraint's own draws (the
  // lift with `APPROACH_EFFECT.restrained.inputs` as built, less with them taken out in this process and put back).
  const withItAhead = withIt.filter((m) => x(m, 'RES', 'restrained') - x(m, 'EVEN', 'restrained') > 0.05);
  const R = APPROACH_EFFECT.restrained as unknown as { inputs: unknown };
  const asBuilt = R.inputs;
  const liftR = (m: MaterialProfile) => judgeOn(m, RES, 'restrained').exact! - judgeOn(m, EVEN, 'restrained').exact!;
  const withDraws = both.map(liftR);
  R.inputs = {};
  let withoutDraws: number[];
  try { withoutDraws = both.map(liftR); } finally { R.inputs = asBuilt; }
  const drawsPart = withDraws.map((v, i) => v - withoutDraws[i]!);
  // ST6-R (b′), proposed and not counted (from 2026-10-16, brief 10, the judge area's second phase): (b) as the criteria
  // write it compares the specialist's lift playing restrained with its lift playing expansive, and restraint's lean on
  // believability makes the first larger with its draws taken out too (the mutation `st6-no-draws` survives it, 96 of 96).
  // What the owner's (g) asks it to catch is restraint drawing on nothing, so (b′) reads the draws' own part of the lift:
  // more than 0.05, half a shown tenth, on at least 90% of the materials where both sides fit, (b)'s floor kept.
  const paid = both.filter((_m, i) => drawsPart[i]! > 0.05);
  const proposedB = {
    clause: 'ST6-R (b′), proposed, not counted: on at least 90% of the materials where both sides fit, the restrained specialist’s lift over the even actor, both playing restrained, more than 0.05 larger with restraint’s draws (`APPROACH_EFFECT.restrained.inputs`) than with them taken out',
    met: pct(paid.length, both.length) >= 0.9, paid: paid.length, of: both.length, rate: r4(pct(paid.length, both.length)),
    least: r4(Math.min(...drawsPart)), notPaid: both.filter((_m, i) => !(drawsPart[i]! > 0.05)).map((m) => m.id),
  };
  const diagnostics = {
    restraintSuitsAndRestrainedSpecialistAhead: { ahead: withItAhead.length, of: withIt.length, note: 'both playing restrained, where restrained suits better: the specialist against the even actor at the criteria’s budget' },
    restraintsOwnDrawsPartOfTheLift: { mean: r4(drawsPart.reduce((t, v) => t + v, 0) / drawsPart.length), least: r4(Math.min(...drawsPart)), most: r4(Math.max(...drawsPart)), note: 'the restrained specialist’s lift over the even actor, both restrained, with restraint’s draws less without them' },
  };
  // From 2026-10-17 (brief 11, section 8): the failing clauses sorted, beside the verdicts and not part of them. The owner
  // asked which failures show missing gameplay (restraint's own abilities not read where the approved design says they
  // are) and which a criterion that contradicts the approved design. Every change is made in this process and put back.
  // - `ownAbilities`: the specialist against its twin, emotional depth, composure and focus at the even actor's 50 and the
  //   nine held (a budget of 515, printed: an ablation, not a fair-budget comparison).
  // - `share`: what restraint's three carry of a restrained take's ability effects, each +10 from the even actor.
  // - `grain`: (a) as the grain's strength rises from nothing to its own; `budget`: (a) as the nine rise from 40.56.
  // - `ownChoice`: against the grain, a restrained take ahead of the same actor's expansive one (ST6 as written's frame,
  //   at full precision by more than 0.05), for the specialist, its twin and the even actor; for the specialist, (c)'s and
  //   (e)'s questions asked of it in that frame, and its count with the grain at nothing and with restraint's draws out.
  const TWIN = actor({ emotionalDepth: 50, composure: 50, focus: 50 }, budgetFill(235));
  const take = (m: MaterialProfile, p: Performer, scale: Scale) => judgeOn(m, p, scale).exact!;
  const twinGap = both.map((m) => ({ id: m.id, r: take(m, RES, 'restrained') - take(m, TWIN, 'restrained'), e: take(m, RES, 'expansive') - take(m, TWIN, 'expansive') }));
  const grainCost = (m: MaterialProfile, p: Performer) => take(m, p, 'restrained') - withGrain(0, () => take(m, p, 'restrained'));
  const costsLess = against.filter((m) => grainCost(m, RES) > grainCost(m, TWIN) + 1e-9);
  const shareOf = (m: MaterialProfile) => {
    const base = take(m, EVEN, 'restrained');
    const eff = Object.fromEntries(ABILITIES.map((a) => [a, Math.max(0, take(m, actor({ [a]: 60 }, 50), 'restrained') - base)]));
    const total = ABILITIES.reduce((t, a) => t + eff[a]!, 0);
    return total > 0 ? (eff.emotionalDepth! + eff.composure! + eff.focus!) / total : 0;
  };
  const spread = (xs: number[]) => ({ mean: r4(xs.reduce((t, v) => t + v, 0) / xs.length), least: r4(Math.min(...xs)), most: r4(Math.max(...xs)) });
  const aAt = (p: Performer) => against.filter((m) => take(m, p, 'restrained') - take(m, EVEN, 'expansive') > 0.05);
  const strengths = [0, 0.1, 0.2, GRAIN.strength];
  const byStrength = against.map((m) => strengths.map((s) => withGrain(s, () => take(m, RES, 'restrained') - take(m, EVEN, 'expansive'))));
  const choiceOf = (p: Performer, prep = 1) => against.filter((m) => judgeOn(m, p, 'restrained', { prep }).exact! - take(m, p, 'expansive') > 0.05);
  const chosen = choiceOf(RES);
  const chosenWorks = byWork(chosen);
  const chosenRate = (ms: MaterialProfile[]) => r4(pct(ms.filter((m) => chosen.includes(m)).length, ms.length));
  const withoutDrawsChosen = (() => { R.inputs = {}; try { return choiceOf(RES).length; } finally { R.inputs = asBuilt; } })();
  const sorting = {
    budgets: { twin: budgetOf(TWIN) },
    ownAbilities: {
      restrainedBehindTheSpecialist: { ...spread(twinGap.map((g) => g.r)), of: twinGap.length },
      byMoreThanPlayingExpansive: { count: twinGap.filter((g) => g.r - g.e > 0.05).length, of: twinGap.length, not: twinGap.filter((g) => !(g.r - g.e > 0.05)).map((g) => `${g.id}: ${r4(g.r - g.e)}`) },
      theGrainCostsTheSpecialistLess: { count: costsLess.length, of: against.length },
      twinWinsInA: aAt(TWIN).length,
    },
    share: { restraintSuits: spread(withIt.map(shareOf)), againstTheGrain: spread(against.map(shareOf)) },
    grain: {
      wins: strengths.map((s, i) => ({ strength: s, wins: byStrength.filter((xs) => xs[i]! > 0.05).length })),
      nonIncreasing: byStrength.filter((xs) => xs.every((v, i) => i === 0 || v <= xs[i - 1]! + 1e-12)).length, of: against.length,
      winsWithNoGrain: against.filter((_m, i) => byStrength[i]![0]! > 0.05).map((m) => `${m.id} (${r4(suit(m).e - suit(m).r)})`),
    },
    budget: [(600 - 235) / 9, 41, 42, 43, 44, 45, (600 - 235) / 8].map((f) => { const P = actor({ emotionalDepth: 85, composure: 75, focus: 75 }, f); return { budget: r4(budgetOf(P)), winsInA: aAt(P).length, aheadBothRestrainedWhereRestraintSuits: withIt.filter((m) => take(m, P, 'restrained') - take(m, EVEN, 'restrained') > 0.05).length }; }),
    ownChoice: {
      specialist: chosen.length, twin: choiceOf(TWIN).length, evenActor: choiceOf(EVEN).length, of: against.length, materials: chosen.map((m) => m.id),
      halfRehearsed: choiceOf(RES, 0.5).length, smallerGapRate: chosenRate(smaller), largerGapRate: chosenRate(largerGap),
      works: Object.keys(chosenWorks).length, mostFromOneWork: Math.max(0, ...Object.values(chosenWorks)), families: [...new Set(chosen.map(familyOf))],
      withNoGrain: withGrain(0, () => choiceOf(RES).length), withoutRestraintsDraws: withoutDrawsChosen,
    },
  };
  return {
    criterion: 'ST6-R (docs/verification/decisions-2026-10-16/criteria.md)', diagnostics, sorting,
    budgets: { restrainedSpecialist: budgetOf(RES), expansiveSpecialist: budgetOf(EXP), evenActor: budgetOf(EVEN) },
    verdict, met: Object.values(verdict).every((v) => v.met), proposedB,
    st6AsWritten: { restrained: `${resWinsShown.length} of ${against.length}`, expansive: `${expWinsShown.length} of ${withIt.length}`, met: resWinsShown.length >= 0.25 * against.length && expWinsShown.length >= 0.25 * withIt.length, note: 'ST6 as written, superseded by ST6-R and kept as the record: each specialist’s own side against its other, as shown, on these budgets' },
    st6Prime: { restrainedAheadOfEvenBest: against.filter((m) => x(m, 'RES', 'restrained') - Math.max(x(m, 'EVEN', 'restrained'), x(m, 'EVEN', 'expansive')) > 0).length, of: against.length, note: 'ST6′ (brief 09, proposed): its own side ahead of the equal-budget even actor’s better side, at full precision' },
    cases: against.map((m) => ({ material: m.id, work: workOf(m), family: familyOf(m), gap: r4(suit(m).e - suit(m).r), resRestrainedLessEvenExpansive: r4(x(m, 'RES', 'restrained') - x(m, 'EVEN', 'expansive')), halfRehearsed: r4(x(m, 'RES', 'restrained', 0.5) - x(m, 'EVEN', 'expansive')), evenRestrainedLessExpansive: r4(x(m, 'EVEN', 'restrained') - x(m, 'EVEN', 'expansive')), expExpansiveLessResRestrained: r4(x(m, 'EXP', 'expansive') - x(m, 'RES', 'restrained')) })),
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// ST6-R2 (from 2026-10-17, brief 12): docs/verification/resolution-2026-10-17/acting-criteria.md, written and committed
// before this. Every change a clause makes (restraint's draws, the grain's strength, a circumstance's level) is made in
// this process and put back, or on a copy of the material.
// ---------------------------------------------------------------------------------------------------------------------

export type Side = 'restrained' | 'expansive';
export type Circumstance = keyof typeof CIRCUMSTANCE_AFFINITY;
export const CIRCUMSTANCES = Object.keys(CIRCUMSTANCE_AFFINITY) as Circumstance[];
/** Which way each circumstance argues for restraint, as the criteria name it: what's hidden and a private exchange for, speaking to many and a conflict out loud against. */
export const ARGUES_FOR_RESTRAINT: Readonly<Record<Circumstance, 1 | -1>> = { concealment: 1, intimacy: 1, address: -1, confrontation: -1 };

/** One piece a player can play restrained, judged as the game judges it: every part complete but the choice's rehearsal, at `prep`. */
export interface R2Case {
  kind: 'scene' | 'night' | 'brief';
  id: string;
  /** The source work it comes from, and the genre whose register it's read in (ST6-R (e)'s, kept). */
  work: string;
  family: string;
  /** Stage (a class scene, a play as one, a night) or tape (a brief, at a close frame or a microphone). */
  medium: 'stage' | 'tape';
  material: MaterialProfile;
  /** No `side`: no way chosen. No `key`: no draw. `callback`: a brief's callback asking for that side. */
  judge(p: Performer, side: Side | undefined, o?: { prep?: number; key?: string; callback?: Side }): Evaluation;
  /**
   * What `judge` hands the judge (from 2026-10-17, brief 13): the context and the piece, so a part can read what the take
   * reads (the dependency map) or hand it something else (TEST SETUP: a share of difficulty set directly).
   */
  context(side: Side | undefined, o?: { prep?: number; key?: string; callback?: Side }): { ctx: EvalContext; spec: PieceSpec };
  suit(side: Side): number;
  /** The side's whole suitability, its signals with it (from 2026-10-17, brief 13): its sum before the hold at ±1 is read from them. */
  suitability(side: Side): ReturnType<typeof suitabilityOf>;
  /** The rehearsal mark that completes the choice (`requiredFor`): under 0.9 with the scene's grain, over it against. */
  required(side: Side): number;
  /** The same piece with one circumstance at another level: a stage piece's (a brief has none). */
  at?(c: Circumstance, level: number): R2Case;
}

const nobody = { engagement: { byGenre: {} } } as unknown as Person;

/** A class scene or a play as a class scene, as ST6-R and `--stage` judge it. */
function sceneR2(m: MaterialProfile): R2Case {
  const scene = sceneOfMaterial(m);
  return {
    kind: 'scene', id: m.id, work: workOf(m), family: familyOf(m), medium: 'stage', material: m,
    judge: (p, side, o = {}) => judgeOn(m, p, side, { ...(o.prep !== undefined ? { prep: o.prep } : {}), ...(o.key ? { key: o.key } : {}) }),
    context: (side, o = {}) => scenePieceOf(m, side, { ...(o.prep !== undefined ? { prep: o.prep } : {}), ...(o.key ? { key: o.key } : {}) }),
    suit: (side) => suitabilityOf(side, m, scene).s,
    suitability: (side) => suitabilityOf(side, m, scene),
    required: (side) => requiredFor([side], m, scene),
    at: (c, level) => sceneR2({ ...m, circumstances: { ...(m.circumstances ?? {}), [c]: level } }),
  };
}

/**
 * A play as a supporting part's night at the School, as `tools/pieces.ts` builds one (its workload, its part's text and a
 * night's stakes), with the way it's played read as `nightEvaluation` reads it: its lean, its draws, its rehearsal and its
 * grain.
 */
function nightR2(m: MaterialProfile): R2Case {
  const task = TASK_PROFILES.performance!;
  const spec = nightPiece(m, runningOf({ play: m.id }), 'supporting');
  const played = withPart(m, spec.night!);
  const scene = sceneOfMaterial(played);
  const context: R2Case['context'] = (side, o = {}) => {
    const prepAt = o.prep ?? 1;
    const read = materialContext(task, played, side ? { scale: side, chosenAt: 0, prep: prepAt } : undefined);
    const prep = { lines: 1, blocking: 1, notes: 1, ...(side ? { approach: prepAt } : {}) };
    const required = { lines: 0.9, blocking: 0.9, notes: 0.9, ...(side ? { approach: read.required } : {}) };
    const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required, difficulty: NIGHT_DIFFICULTY.school.supporting, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: o.key ?? `st6r2:night:${m.id}`, ...(o.key ? {} : { expected: true }) };
    return { ctx, spec };
  };
  return {
    kind: 'night', id: `night:${m.id}`, work: workOf(m), family: familyOf(m), medium: 'stage', material: played,
    judge: (p, side, o = {}) => { const x = context(side, o); return judgePiece(SEED, p, x.ctx, x.spec); },
    context,
    suit: (side) => suitabilityOf(side, played, scene).s,
    suitability: (side) => suitabilityOf(side, played, scene),
    required: (side) => requiredFor([side], played, scene),
    at: (c, level) => nightR2({ ...m, circumstances: { ...(m.circumstances ?? {}), [c]: level } }),
  };
}

/** A practice brief in one reading, as `preview` judges a reading played a way (`systems/briefs.ts`). */
function briefR2(b: Brief, reading: string): R2Case {
  const material = briefMaterial(b);
  const scene = sceneOf(b, readingOf(b, reading));
  const context: R2Case['context'] = (side, o = {}) => {
    const prepAt = o.prep ?? 1;
    const rec: BriefRecord = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [], ...(o.callback ? { callback: { axis: 'scale' as const, side: o.callback, why: '', at: 0 } } : {}) };
    const ctx = briefContext(nobody, b, rec, { reading, ...(side ? { playing: { scale: side, chosenAt: 0, prep: prepAt } } : {}), prep: { genre: 1, ...(side ? { approach: prepAt } : {}) }, ...(o.callback ? { callback: true } : {}) });
    return { ctx: { ...ctx, condition: { readiness: 100 }, key: o.key ?? `st6r2:brief:${b.id}`, ...(o.key ? {} : { expected: true }) }, spec: briefPiece(b, { ...rec, reading }, reading) };
  };
  return {
    kind: 'brief', id: `${b.id}/${reading}`, work: b.id, family: scene.genre ?? 'none', medium: 'tape', material,
    judge: (p, side, o = {}) => { const x = context(side, o); return judgePiece(SEED, p, x.ctx, x.spec); },
    context,
    suit: (side) => suitabilityOf(side, material, scene).s,
    suitability: (side) => suitabilityOf(side, material, scene),
    required: (side) => requiredFor([side], material, scene),
  };
}

/**
 * Every piece a player can play restrained: the 97 class scenes and plays as class scenes, the 30 plays as nights, and the
 * 298 briefs in their first reading (`'first'`, what the gate carries for the clauses that judge many variants of each) or
 * in every reading (`'all'`, 657).
 */
export function st6r2Cases(readings: 'first' | 'all'): R2Case[] {
  return [
    ...MATS().map(sceneR2),
    ...PLAY_MATERIAL.map(nightR2),
    ...BRIEFS.flatMap((b) => (readings === 'all' ? b.readings : b.readings.slice(0, 1)).map((r) => briefR2(b, r.id))),
  ];
}

/** The five actors, named in the criteria before anything was measured. */
export const ST6R2_ACTORS = {
  beginner: actor({}, 35, 30),
  even: actor({}, 50),
  restrainedSpecialist: actor({ emotionalDepth: 85, composure: 75, focus: 75 }, (600 - 235) / 9),
  expansiveSpecialist: actor({ presence: 85, vocal: 75, physical: 75 }, (600 - 235) / 9),
  nearMaster: actor({}, 92, 85),
} satisfies Record<string, Performer>;
export type R2Actor = keyof typeof ST6R2_ACTORS;
export const ST6R2_MASTER: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };

/** Restraint's relevant abilities: the three its way of playing draws on. */
export const RESTRAINTS_OWN: readonly AbilityId[] = ['emotionalDepth', 'composure', 'focus'];
const RESTRAINT = APPROACH_EFFECT.restrained as unknown as { inputs: Inputs };
/** Restraint's draws set to `inputs` for the length of `f`, and put back. */
export const withRestraintDraws = <T,>(inputs: Inputs, f: () => T): T => { const was = RESTRAINT.inputs; RESTRAINT.inputs = inputs; try { return f(); } finally { RESTRAINT.inputs = was; } };
const withoutDraw = (a: AbilityId): Inputs => Object.fromEntries(Object.entries(RESTRAINT.inputs).map(([d, xs]) => [d, (xs ?? []).filter((y) => y.ability !== a)])) as Inputs;
const raised = (p: Performer, ids: readonly AbilityId[], by: number): Performer => ({ ...p, ability: (id) => (ids.includes(id) ? Math.min(100, p.ability(id) + by) : p.ability(id)) });
const setAt = (p: Performer, id: AbilityId, v: number): Performer => ({ ...p, ability: (y) => (y === id ? v : p.ability(y)) });
const take = (c: R2Case, p: Performer, side: Side = 'restrained', o?: { prep?: number }) => c.judge(p, side, o).exact!;
const entries = (actors: Partial<Record<R2Actor, Performer>>) => Object.entries(actors) as [R2Actor, Performer][];

/** Each clause's measure, case by case: what the gate asserts and `measureST6R2` summarizes. */
export const ST6R2 = {
  /** (a1) and (a2): the three raised by 10; the rise with restraint's draws less the rise without; each one's own +10 rise with its own draw less without it. */
  contribution(cases: readonly R2Case[], actors: Partial<Record<R2Actor, Performer>>) {
    const without = Object.fromEntries(RESTRAINTS_OWN.map((a) => [a, withoutDraw(a)])) as Record<string, Inputs>;
    return cases.flatMap((c) => entries(actors).map(([name, p]) => {
      const base = take(c, p), up = take(c, raised(p, RESTRAINTS_OWN, 10));
      const [baseNo, upNo] = withRestraintDraws({}, () => [take(c, p), take(c, raised(p, RESTRAINTS_OWN, 10))]);
      const own = Object.fromEntries(RESTRAINTS_OWN.map((a) => {
        const rise = take(c, raised(p, [a], 10)) - base;
        const riseWithout = withRestraintDraws(without[a]!, () => take(c, raised(p, [a], 10)) - take(c, p));
        return [a, { rise, drawsPart: rise - riseWithout }];
      })) as Record<string, { rise: number; drawsPart: number }>;
      return { id: c.id, kind: c.kind, actor: name, rise: up - base, drawsPart: up - base - (upNo! - baseNo!), own };
    }));
  },
  /** (a3): each of the three set to 0, 20, …, 100 and past its full (110), everything else held. */
  dose(cases: readonly R2Case[], actors: Partial<Record<R2Actor, Performer>>) {
    const levels = [0, 20, 40, 60, 80, 100, 110];
    return cases.flatMap((c) => entries(actors).flatMap(([name, p]) => RESTRAINTS_OWN.map((a) => {
      const v = levels.map((l) => take(c, setAt(p, a, l)));
      const steps = v.slice(1, 6).map((y, i) => y - v[i]!);
      return { id: c.id, kind: c.kind, actor: name, ability: a, least: Math.min(...steps), pastFull: v[6]! - v[5]! };
    })));
  },
  /** (a4): a mastered performer, fully prepared, played restrained, with no draw and with one. */
  mastery(cases: readonly R2Case[]) {
    return cases.map((c) => ({ id: c.id, kind: c.kind, noDraw: c.judge(ST6R2_MASTER, 'restrained').overall, drawn: c.judge(ST6R2_MASTER, 'restrained', { key: `st6r2-master:${c.id}` }).overall }));
  },
  /** (c1): the choice rehearsed in at 0 to 1; half against full, its limit named; rehearsed to coursework's 0.9 against full, beside the scene's mark. */
  preparation(cases: readonly R2Case[], actors: Partial<Record<R2Actor, Performer>>) {
    const rungs = [0, 0.25, 0.5, 0.75, 1];
    return cases.flatMap((c) => entries(actors).map(([name, p]) => {
      const e = rungs.map((r) => c.judge(p, 'restrained', { prep: r }));
      const v = e.map((y) => y.exact!);
      return {
        id: c.id, kind: c.kind, actor: name, least: Math.min(...v.slice(1).map((y, i) => y - v[i]!)), half: v[4]! - v[2]!,
        named: e[2]!.limits.some((l) => l.kind === 'preparation' && l.what === 'approach'),
        required: c.required('restrained'), s: c.suit('restrained'), short: v[4]! - take(c, p, 'restrained', { prep: 0.9 }),
      };
    }));
  },
  /** (c2) on stage: each circumstance a level up where it's under 3 and down where it's over 0, everything else held. */
  circumstances(cases: readonly R2Case[], actors: Partial<Record<R2Actor, Performer>>) {
    const floorHeld = (e: Evaluation) => e.dimensions.some((d) => d.grain && e.inputs.difficulty + d.grain.d <= GRAIN.floor - 1 + 1e-12);
    return cases.filter((c) => c.at).flatMap((c) => {
      const before = Object.fromEntries(entries(actors).map(([n, p]) => [n, { r: c.judge(p, 'restrained'), e: c.judge(p, 'expansive') }]));
      return CIRCUMSTANCES.flatMap((k) => {
        const level = c.material.circumstances?.[k] ?? 0;
        return ([1, -1] as const).filter((dir) => (dir > 0 ? level < 3 : level > 0)).flatMap((dir) => {
          const moved = c.at!(k, level + dir);
          // What the change should do to the restrained take: up for a circumstance that argues for restraint raised.
          const want = ARGUES_FOR_RESTRAINT[k] * dir;
          const sR = [c.suit('restrained'), moved.suit('restrained')] as const, sE = [c.suit('expansive'), moved.suit('expansive')] as const;
          return entries(actors).map(([n, p]) => {
            const r = moved.judge(p, 'restrained'), e = moved.judge(p, 'expansive');
            const b = before[n]!;
            return { id: c.id, kind: c.kind, actor: n, circumstance: k, dir, want, sR, sE, dR: want * (r.exact! - b.r.exact!), dE: -want * (e.exact! - b.e.exact!), floorHeld: [r, e, b.r, b.e].some(floorHeld) };
          });
        });
      });
    });
  },
  /** (c2) on every kind: the restrained take with the grain at its strength, less with it at nothing. */
  grain(cases: readonly R2Case[], actors: Partial<Record<R2Actor, Performer>>) {
    return cases.flatMap((c) => entries(actors).map(([name, p]) => ({ id: c.id, kind: c.kind, actor: name, s: c.suit('restrained'), d: take(c, p) - withGrain(0, () => take(c, p)) })));
  },
  /** (c3) on the briefs: under a callback asking for it expansive, against one asking for it restrained. */
  validity(cases: readonly R2Case[], actors: Partial<Record<R2Actor, Performer>>) {
    return cases.filter((c) => c.kind === 'brief').flatMap((c) => {
      const said = misfitOf('scale', 'restrained', c.material, { scale: 'expansive' });
      const master = c.judge(ST6R2_MASTER, 'restrained', { callback: 'expansive' }).overall;
      return entries(actors).map(([name, p]) => {
        const misfit = c.judge(p, 'restrained', { callback: 'expansive' }), fits = c.judge(p, 'restrained', { callback: 'restrained' });
        return { id: c.id, actor: name, gap: fits.exact! - misfit.exact!, named: misfit.limits.some((l) => l.kind === 'fit'), said, master };
      });
    });
  },
  /** (c4): H4-R (c)'s rule on restrained takes, for the twelve specialists; and the restrained specialist's nine raised to the even actor's 50. */
  weakness(cases: readonly R2Case[]) {
    const EVEN = actor({}, 50);
    const RES = ST6R2_ACTORS.restrainedSpecialist, RES50 = actor({ emotionalDepth: 85, composure: 75, focus: 75 }, 50);
    const pairs: { id: string; ability: string; share: number; ahead: number }[] = [];
    const nine = cases.map((c) => {
      const base = take(c, EVEN);
      const eff = Object.fromEntries(ABILITIES.map((a) => [a, Math.max(0, take(c, actor({ [a]: 60 }, 50)) - base)])) as Record<string, number>;
      const total = ABILITIES.reduce((t, a) => t + eff[a]!, 0);
      for (const a of ABILITIES) if (total > 0 && eff[a]! / total < 0.1) pairs.push({ id: c.id, ability: a, share: eff[a]! / total, ahead: take(c, actor({ [a]: 85 }, (600 - 85) / 11)) - base });
      return { id: c.id, kind: c.kind, rise: take(c, RES50) - take(c, RES) };
    });
    return { pairs, nine };
  },
  /** (e1) to (e3): on the cases suitable for each side, where each actor's take on that side is ahead of its own on the other. */
  opportunities(cases: readonly R2Case[], actors: Partial<Record<R2Actor, Performer>>) {
    const t = new Map(cases.map((c) => [c.id, Object.fromEntries(entries(actors).map(([n, p]) => [n, { restrained: take(c, p, 'restrained'), expansive: take(c, p, 'expansive') }]))]));
    const sides = (['restrained', 'expansive'] as const).map((side) => {
      const other: Side = side === 'restrained' ? 'expansive' : 'restrained';
      const suitable = cases.filter((c) => !misfitOf('scale', side, c.material) && c.suit(side) > c.suit(other));
      const byActor = Object.fromEntries(entries(actors).map(([n]) => [n, Object.fromEntries((['stage', 'tape'] as const).map((medium) => {
        const of = suitable.filter((c) => c.medium === medium);
        const opp = of.filter((c) => t.get(c.id)![n]![side] - t.get(c.id)![n]![other] > 0.05);
        const works = opp.reduce((o, c) => { o[c.work] = (o[c.work] ?? 0) + 1; return o; }, {} as Record<string, number>);
        return [medium, { count: opp.length, of: of.length, works: Object.keys(works).length, families: [...new Set(opp.map((c) => c.family))], mostFromOneWork: Math.max(0, ...Object.values(works)), ids: opp.map((c) => c.id) }];
      }))]));
      return [side, { suitable: { stage: suitable.filter((c) => c.medium === 'stage').length, tape: suitable.filter((c) => c.medium === 'tape').length }, byActor }] as const;
    });
    // Option 2's frame, kept as the record: against the grain, restraint the restrained specialist's better choice and not the even actor's.
    const againstTheGrain = cases.filter((c) => !misfitOf('scale', 'restrained', c.material) && c.suit('expansive') > c.suit('restrained'));
    const better = (n: R2Actor, c: R2Case) => t.get(c.id)![n] && t.get(c.id)![n]!.restrained - t.get(c.id)![n]!.expansive > 0.05;
    const optionTwo = Object.fromEntries((['stage', 'tape'] as const).map((medium) => {
      const of = againstTheGrain.filter((c) => c.medium === medium);
      return [medium, { of: of.length, restrainedSpecialist: of.filter((c) => better('restrainedSpecialist', c)).length, even: of.filter((c) => better('even', c)).length, specialistsAlone: of.filter((c) => better('restrainedSpecialist', c) && !better('even', c)).map((c) => c.id) }];
    }));
    return { ...Object.fromEntries(sides), optionTwo } as { restrained: (typeof sides)[number][1]; expansive: (typeof sides)[number][1]; optionTwo: typeof optionTwo };
  },
};

/** (e)'s floors, kept: at least 6 source works and 3 register families, no one work giving more than a quarter. */
export const variedEnough = (x: { count: number; works: number; families: readonly string[]; mostFromOneWork: number }) => x.works >= 6 && x.families.length >= 3 && x.mostFromOneWork <= 0.25 * x.count;

/**
 * ST6-R2, every clause, with its verdict and its figures: the clauses that judge many variants of each case on `heavy`'s
 * briefs (`'all'` by default, every reading; the gate carries `'first'`), the rest on every reading.
 */
export function measureST6R2(o: { heavy?: 'first' | 'all' } = {}) {
  const heavy = st6r2Cases(o.heavy ?? 'all'), every = st6r2Cases('all');
  const A = ST6R2_ACTORS;
  const count = (cs: readonly R2Case[]) => ({ cases: cs.length, scenes: cs.filter((c) => c.kind === 'scene').length, nights: cs.filter((c) => c.kind === 'night').length, briefReadings: cs.filter((c) => c.kind === 'brief').length });
  const lo = <T,>(xs: readonly T[], f: (x: T) => number) => (xs.length ? r4(Math.min(...xs.map(f))) : null);
  const contribution = ST6R2.contribution(heavy, A);
  const dose = ST6R2.dose(heavy, A);
  const mastery = ST6R2.mastery(every);
  const preparation = ST6R2.preparation(heavy, A);
  const circumstances = ST6R2.circumstances(heavy, A);
  const grain = ST6R2.grain(heavy, A);
  const validity = ST6R2.validity(every, A);
  const weakness = ST6R2.weakness(heavy);
  const opp = ST6R2.opportunities(every, A);
  const a1 = contribution.filter((r) => !(r.rise > 0.05));
  const a2 = contribution.filter((r) => !(r.drawsPart > 1e-9 && RESTRAINTS_OWN.every((a) => r.own[a]!.drawsPart > 1e-9)));
  const a3 = dose.filter((r) => !(r.least > 1e-9 && Math.abs(r.pastFull) <= 1e-9));
  const a4 = mastery.filter((r) => r.noDraw !== 100 || r.drawn !== 100);
  const c1 = preparation.filter((r) => !(r.least >= -1e-9 && r.half > 0.05 && r.named && (r.required > 0.9 ? r.short > 1e-9 : Math.abs(r.short) <= 1e-9) && (r.required > 0.9 ? r.s < 0 : r.required < 0.9 ? r.s > 0 : true)));
  const strictWhere = (r: (typeof circumstances)[number], side: 'R' | 'E') => (side === 'R' ? r.sR[0] !== r.sR[1] : r.sE[0] !== r.sE[1]) && !r.floorHeld;
  const c2a = circumstances.filter((r) => !(r.dR >= -1e-9 && r.dE >= -1e-9 && (!strictWhere(r, 'R') || r.dR > 1e-9) && (!strictWhere(r, 'E') || r.dE > 1e-9) && (r.sR[1] - r.sR[0]) * r.want >= 0));
  const c2b = grain.filter((r) => !(r.s > 0 ? r.d > 1e-9 : r.s < 0 ? r.d < -1e-9 : Math.abs(r.d) <= 1e-9));
  const c3 = validity.filter((r) => !(r.gap > 0.05 && r.named && r.said && r.master < 100));
  const c4a = weakness.pairs.filter((x) => x.ahead > 0.05);
  const c4b = weakness.nine.filter((r) => !(r.rise > 0.05));
  const mediums = ['stage', 'tape'] as const;
  const e1 = (['beginner', 'even', 'restrainedSpecialist', 'nearMaster'] as const).flatMap((n) => mediums.filter((m) => !variedEnough(opp.restrained.byActor[n]![m]!)).map((m) => `${n} ${m}`));
  const e2 = mediums.filter((m) => !(opp.restrained.byActor.restrainedSpecialist![m]!.count > opp.restrained.byActor.even![m]!.count));
  const e3 = [...(['beginner', 'even', 'expansiveSpecialist', 'nearMaster'] as const).flatMap((n) => mediums.filter((m) => !variedEnough(opp.expansive.byActor[n]![m]!)).map((m) => `${n} ${m}`)), ...mediums.filter((m) => !(opp.expansive.byActor.expansiveSpecialist![m]!.count > opp.expansive.byActor.even![m]!.count)).map((m) => `the expansive specialist not more than the even actor, ${m}`)];
  // The first 20 of each failure list, with its full count beside it.
  const first = <T,>(xs: readonly T[]) => xs.slice(0, 20);
  const verdict = {
    a: { met: !a1.length && !a2.length && !a3.length && !a4.length, a1: { met: !a1.length, of: contribution.length, failingCount: a1.length, failing: first(a1) }, a2: { met: !a2.length, of: contribution.length, failingCount: a2.length, failing: first(a2) }, a3: { met: !a3.length, of: dose.length, failingCount: a3.length, failing: first(a3) }, a4: { met: !a4.length, of: mastery.length, failingCount: a4.length, failing: first(a4) } },
    c: { met: !c1.length && !c2a.length && !c2b.length && !c3.length && c4a.length <= 0.01 * weakness.pairs.length && !c4b.length, c1: { met: !c1.length, of: preparation.length, failingCount: c1.length, failing: first(c1) }, c2: { met: !c2a.length && !c2b.length, circumstances: { of: circumstances.length, failingCount: c2a.length, failing: first(c2a) }, grain: { of: grain.length, failingCount: c2b.length, failing: first(c2b) } }, c3: { met: !c3.length, of: validity.length, failingCount: c3.length, failing: first(c3) }, c4: { met: c4a.length <= 0.01 * weakness.pairs.length && !c4b.length, pairs: weakness.pairs.length, ahead: c4a.length, aheadShare: r4(c4a.length / Math.max(1, weakness.pairs.length)), aheadFirst: first(c4a), nine: { of: weakness.nine.length, failingCount: c4b.length, failing: first(c4b) } } },
    e: { met: !e1.length && !e2.length && !e3.length, e1: { met: !e1.length, failing: e1 }, e2: { met: !e2.length, failing: e2 }, e3: { met: !e3.length, failing: e3 } },
  };
  const held = (rs: typeof circumstances, side: 'R' | 'E') => rs.filter((r) => !strictWhere(r, side)).length;
  const figures = {
    a1: { leastRise: lo(contribution, (r) => r.rise), byActor: Object.fromEntries(Object.keys(A).map((n) => [n, lo(contribution.filter((r) => r.actor === n), (r) => r.rise)])) },
    a2: { leastDrawsPart: lo(contribution, (r) => r.drawsPart), leastOwnDrawsPart: Object.fromEntries(RESTRAINTS_OWN.map((a) => [a, lo(contribution, (r) => r.own[a]!.drawsPart)])) },
    a3: { leastStep: Object.fromEntries(RESTRAINTS_OWN.map((a) => [a, lo(dose.filter((r) => r.ability === a), (r) => r.least)])), largestPastFull: dose.length ? Math.max(...dose.map((r) => Math.abs(r.pastFull))) : null },
    a4: { at100: mastery.filter((r) => r.noDraw === 100 && r.drawn === 100).length, of: mastery.length },
    c1: { leastHalf: lo(preparation, (r) => r.half), markOver09: preparation.filter((r) => r.required > 0.9).length / Object.keys(A).length, markUnder09: preparation.filter((r) => r.required < 0.9).length / Object.keys(A).length, leastShortWhereOver: lo(preparation.filter((r) => r.required > 0.9), (r) => r.short) },
    c2: { changes: circumstances.length, heldRestrained: held(circumstances, 'R'), heldExpansive: held(circumstances, 'E'), floorHeld: circumstances.filter((r) => r.floorHeld).length, leastMoveRestrained: lo(circumstances.filter((r) => strictWhere(r, 'R')), (r) => r.dR), leastMoveExpansive: lo(circumstances.filter((r) => strictWhere(r, 'E')), (r) => r.dE), grain: { over0: grain.filter((r) => r.s > 0).length, under0: grain.filter((r) => r.s < 0).length, at0: grain.filter((r) => r.s === 0).length } },
    c3: { leastGap: lo(validity, (r) => r.gap), masterMost: validity.length ? Math.max(...validity.map((r) => r.master)) : null },
    // Beside the verdicts, not part of them (from 2026-10-17, for the owner's decision on (c2) and (c4)): the pieces whose
    // grain didn't move strictly, by restraint's suitability, and any moved the wrong way; and the pairs H4-R (c)'s rule
    // counts split at the equal budget's even share, 1/12, where a specialist's +35 and the other eleven's −3.18 balance.
    c2grain: { notStrict: [...new Set(c2b.map((r) => r.id))], atSuitability: [...new Set(c2b.map((r) => r.s))], wrongWay: grain.filter((r) => (r.s > 0 && r.d < -1e-9) || (r.s < 0 && r.d > 1e-9)).length },
    c4: { leastNineRise: lo(weakness.nine, (r) => r.rise), ahead: { count: c4a.length, againstTheGrain: c4a.filter((x) => { const c = heavy.find((y) => y.id === x.id)!; return c.suit('expansive') > c.suit('restrained'); }).length, shareRange: c4a.length ? [r4(Math.min(...c4a.map((x) => x.share))), r4(Math.max(...c4a.map((x) => x.share)))] : null, most: c4a.length ? r4(Math.max(...c4a.map((x) => x.ahead))) : null }, underEvenShare: { pairs: weakness.pairs.filter((x) => x.share < 1 / 12).length, ahead: weakness.pairs.filter((x) => x.share < 1 / 12 && x.ahead > 0.05).length } },
    e: { restrained: opp.restrained, expansive: opp.expansive, optionTwo: opp.optionTwo },
  };
  return {
    criterion: 'ST6-R2 (docs/verification/resolution-2026-10-17/acting-criteria.md)', heavy: o.heavy ?? 'all',
    cases: { heavy: count(heavy), every: count(every) },
    budgets: Object.fromEntries(Object.entries(A).map(([n, p]) => [n, budgetOf(p)])),
    verdict, met: verdict.a.met && verdict.c.met && verdict.e.met, figures,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// ST6-R2.c and ST6-R2.e clarified (from 2026-10-17, brief 13): docs/verification/playthroughs-2026-10-17/acting-criteria.md,
// written and committed before this. Each part judges a piece as `judge` does, through the context it hands the judge
// (`context`); a change a part makes (the grain's strength, restraint's or size's draws) is made in this process and put
// back, and a share of difficulty set directly is said where it is (TEST SETUP).
// ---------------------------------------------------------------------------------------------------------------------

/** Where an ability reaches a restrained take: the four classes of the clarified criteria's dependency map. */
export type PathClass = 'direct' | 'small' | 'indirect' | 'none';
const RESTRAINT_DRAWS = (): ReadonlySet<AbilityId> => new Set(Object.values(RESTRAINT.inputs).flatMap((xs) => (xs ?? []).map((x) => x.ability)));
const SIZE = APPROACH_EFFECT.expansive as unknown as { inputs: Inputs };
/** Size's draws set to `inputs` for the length of `f`, and put back: the mirror of `withRestraintDraws`. */
export const withSizeDraws = <T,>(inputs: Inputs, f: () => T): T => { const was = SIZE.inputs; SIZE.inputs = inputs; try { return f(); } finally { SIZE.inputs = was; } };

/**
 * An ability's path into a case played restrained, read from the context the judge reads: each dimension's inputs, the
 * kind of work's own (stamina out: a piece reads it as the drain) and what the piece, its reading, reader and register and
 * restraint add. Direct where restraint draws on it, or a dimension reads it at least as much as the kind of work's own
 * profile reads that dimension's leading ability; small where a dimension reads it, but only under that; indirect where
 * only the drain does (stamina, on a piece with a later segment and a load); none where nothing does.
 */
export function pathOf(c: R2Case, a: AbilityId): { cls: PathClass; reads: { dimension: Dimension; weight: number; leading: number }[] } {
  const { ctx, spec } = c.context('restrained');
  const reads: { dimension: Dimension; weight: number; leading: number }[] = [];
  for (const [d, s] of Object.entries(ctx.task.dims) as [Dimension, NonNullable<(typeof ctx.task.dims)[Dimension]>][]) {
    const own = s.inputs.filter((i): i is { ability: AbilityId; weight: number } => 'ability' in i && i.ability !== 'stamina');
    const leading = Math.max(0, ...own.map((i) => i.weight));
    const w = own.filter((i) => i.ability === a).reduce((t, i) => t + i.weight, 0) + (ctx.inputs?.[d] ?? []).filter((x) => x.ability === a && x.ability !== 'stamina').reduce((t, x) => t + x.weight, 0);
    if (w > 0) reads.push({ dimension: d, weight: r4(w), leading });
  }
  const drains = spec.night ? true : spec.load > 0 && spec.segments.length > 1;
  const cls: PathClass = RESTRAINT_DRAWS().has(a) || reads.some((x) => x.weight >= x.leading - 1e-12) ? 'direct' : reads.length ? 'small' : a === 'stamina' && drains ? 'indirect' : 'none';
  return { cls, reads };
}

/** A performer with some abilities moved and each of the rest moved the other way by an equal share: the budget kept. */
export const shifted = (p: Performer, up: Partial<Record<AbilityId, number>>): Performer => {
  const others = ABILITIES.filter((a) => !(a in up));
  const down = Object.values(up).reduce((t, x) => t + (x ?? 0), 0) / others.length;
  return { ...p, ability: (id) => p.ability(id) + (up[id] ?? -down) };
};
/** Restraint's shift and size's: the restrained and the expansive specialists' own from the even actor. */
export const RESTRAINT_SHIFT: Partial<Record<AbilityId, number>> = { emotionalDepth: 35, composure: 25, focus: 25 };
export const SIZE_SHIFT: Partial<Record<AbilityId, number>> = { presence: 35, vocal: 25, physical: 25 };

/** The clarified (e)'s comparison actors, named in the criteria before any was measured (TEST SETUP). */
const leaning = (high: readonly AbilityId[], low: readonly AbilityId[], hi: number, lo: number, rest: number, tech: number): Performer => actor(Object.fromEntries([...high.map((a) => [a, hi]), ...low.map((a) => [a, lo])]), rest, tech);
const RESTRAINTS_THREE: readonly AbilityId[] = ['emotionalDepth', 'composure', 'focus'];
const SIZES_THREE: readonly AbilityId[] = ['presence', 'vocal', 'physical'];
export const ST6R2_COMPARISON = {
  /** Brief 12's, informing: ceiling cases on stage. */
  informing: { even: ST6R2_ACTORS.even, beginner: ST6R2_ACTORS.beginner },
  /** Fresh, for restraint: each leans toward size, where restraint has room to be the worse choice. */
  restraint: {
    V1: leaning(SIZES_THREE, RESTRAINTS_THREE, 60, 40, 50, 50),
    V2: leaning(SIZES_THREE, RESTRAINTS_THREE, 70, 30, 50, 50),
    V3: leaning(SIZES_THREE, RESTRAINTS_THREE, 75, 55, 65, 60),
    V4: leaning(SIZES_THREE, RESTRAINTS_THREE, 45, 25, 35, 30),
    V5: actor({}, 65, 60),
  },
  /** Fresh, for size: the mirror. */
  size: {
    'V1′': leaning(RESTRAINTS_THREE, SIZES_THREE, 60, 40, 50, 50),
    'V2′': leaning(RESTRAINTS_THREE, SIZES_THREE, 70, 30, 50, 50),
    'V3′': leaning(RESTRAINTS_THREE, SIZES_THREE, 75, 55, 65, 60),
    'V4′': leaning(RESTRAINTS_THREE, SIZES_THREE, 45, 25, 35, 30),
    V5: actor({}, 65, 60),
  },
} satisfies Record<string, Record<string, Performer>>;

/** The clarified (c4)'s specialists by budget: brief 12's, informing, and three fresh, each against its comparison actor. */
export const ST6R2_BUDGETS = {
  brief12: { strength: 85, fill: (600 - 85) / 11, tech: 50, against: ST6R2_ACTORS.even, level: 50 },
  beginner: { strength: 70, fill: (420 - 70) / 11, tech: 30, against: ST6R2_ACTORS.beginner, level: 35 },
  stronger: { strength: 95, fill: (600 - 95) / 11, tech: 50, against: ST6R2_ACTORS.even, level: 50 },
  nearMaster: { strength: 100, fill: (1104 - 100) / 11, tech: 85, against: ST6R2_ACTORS.nearMaster, level: 92 },
} as const;
export type R2Budget = keyof typeof ST6R2_BUDGETS;
export const specialistAt = (b: R2Budget, a: AbilityId): Performer => actor({ [a]: ST6R2_BUDGETS[b].strength }, ST6R2_BUDGETS[b].fill, ST6R2_BUDGETS[b].tech);

/** The grain's share on each dimension restraint leans on, worked by the rule at full precision from the side's suitability. */
export function shareByRule(c: R2Case, side: Side = 'restrained'): Partial<Record<Dimension, number>> {
  const e = APPROACH_EFFECT[side];
  const most = Math.max(...Object.values(e.lean)) - 1;
  const { ctx } = c.context(side);
  const s = c.suit(side), k = stakesScale(c.material.stakes);
  return Object.fromEntries((Object.entries(e.lean) as [Dimension, number][]).filter(([d, lean]) => lean > 1 && ctx.task.dims[d]).map(([d, lean]) => [d, -GRAIN.strength * s * k * ((lean - 1) / most)]));
}
/** `grainOf`'s precision: a share kept to a hundredth (`r2`), so one that rounds to nothing comes to nothing. */
export const keptByRule = (x: number) => Math.round(x * 100) / 100;

const judgeWith = (p: Performer, ctx: EvalContext, spec: PieceSpec) => judgePiece(SEED, p, ctx, spec);
const exactWith = (p: Performer, ctx: EvalContext, spec: PieceSpec) => judgePieceExact(SEED, p, ctx, spec).evaluation.exact!;

/** One case and actor's (c2.2): the grain read or not, what the rule keeps, and at full precision where it keeps nothing. */
export interface GrainRow {
  id: string; kind: R2Case['kind']; actor: string; s: number; kept: boolean; d: number; floorHeld: boolean; keptGrain: Record<string, number>;
  atFullPrecision?: number; shown?: { take: number; atFullPrecision: number };
}

/** Each clarified part's measure, case by case: what the gate asserts and `measureST6R2Clarified` summarizes. */
export const ST6R2C = {
  /**
   * (c2.2): the restrained take with the grain at its strength, less with it at nothing; whether the rule keeps a share on
   * some dimension; whether the floor held it; and on a case the rule keeps nothing of, the take with the share carried
   * at full precision (TEST SETUP), less the take with none, and its shown tenth beside the take's.
   */
  scene(cases: readonly R2Case[], actors: Partial<Record<string, Performer>>) {
    const floorHeld = (e: Evaluation) => e.dimensions.some((d) => d.grain && e.inputs.difficulty + d.grain.d <= GRAIN.floor - 1 + 1e-12);
    return cases.flatMap((c) => {
      const s = c.suit('restrained');
      const rule = shareByRule(c);
      const kept = Object.values(rule).some((x) => keptByRule(x!) !== 0);
      const { ctx, spec } = c.context('restrained');
      const full: EvalContext = { ...ctx, grain: Object.fromEntries(Object.entries(rule).map(([d, x]) => [d, { d: x!, label: 'at full precision' }])) };
      return (Object.entries(actors) as [string, Performer][]).map(([n, p]): GrainRow => {
        const e = c.judge(p, 'restrained');
        const none = withGrain(0, () => c.judge(p, 'restrained'));
        const at: GrainRow = { id: c.id, kind: c.kind, actor: n, s, kept, d: e.exact! - none.exact!, floorHeld: floorHeld(e), keptGrain: Object.fromEntries(Object.entries(e.inputs.grain ?? {}).map(([d, x]) => [d, x!.d])) };
        if (kept || s === 0) return at;
        return { ...at, atFullPrecision: exactWith(p, full, spec) - none.exact!, shown: { take: e.overall, atFullPrecision: judgeWith(p, full, spec).overall } };
      });
    });
  },
  /**
   * (c2.3): the judge handed a share of −0.01, 0 and +0.01 on believability, and the difficulty with a share coming to
   * −0.76, −0.75 and −0.74 against the floor (TEST SETUP, on `c`); and on stage, each circumstance's change sorted by
   * where the side's sum stands against the hold at ±1, before and after.
   */
  boundaries(c: R2Case, actors: Partial<Record<string, Performer>>, stage: readonly R2Case[]) {
    const { ctx, spec } = c.context('restrained');
    const handed = (d: number, difficulty = ctx.difficulty): EvalContext => ({ ...ctx, difficulty, grain: { believability: { d, label: 'set directly' } } });
    const judgeAt = (p: Performer, x: EvalContext) => exactWith(p, x, spec);
    const hundredth = (Object.entries(actors) as [string, Performer][]).map(([n, p]) => ({ actor: n, minus: judgeAt(p, handed(-0.01)), zero: judgeAt(p, handed(0)), plus: judgeAt(p, handed(0.01)) }));
    const floor = (Object.entries(actors) as [string, Performer][]).map(([n, p]) => ({ actor: n, below: judgeAt(p, handed(-0.26, -0.5)), at: judgeAt(p, handed(-0.25, -0.5)), above: judgeAt(p, handed(-0.24, -0.5)) }));
    const raw = (x: R2Case, side: Side) => x.suitability(side).signals.reduce((t, g) => t + g.v, 0) / 2;
    const hold = stage.filter((x) => x.at).flatMap((x) => CIRCUMSTANCES.flatMap((k) => {
      const level = x.material.circumstances?.[k] ?? 0;
      return ([1, -1] as const).filter((dir) => (dir > 0 ? level < 3 : level > 0)).flatMap((dir) => {
        const moved = x.at!(k, level + dir);
        return (['restrained', 'expansive'] as const).map((side) => {
          const before = raw(x, side), after = raw(moved, side);
          const where = Math.abs(before) < 1 && Math.abs(after) < 1 ? 'inside' : (Math.abs(before) >= 1) !== (Math.abs(after) >= 1) ? 'reaching' : Math.sign(before) === Math.sign(after) ? 'past' : 'across';
          const p = ST6R2_ACTORS.even;
          return { id: x.id, circumstance: k, dir, side, where, raw: [before, after], s: [x.suit(side), moved.suit(side)], take: moved.judge(p, side).exact! - x.judge(p, side).exact! };
        });
      });
    }));
    return { piece: c.id, hundredth, floor, hold };
  },
  /** (c4.1): each ability raised alone by 10 (to 100 at most), against its path. */
  map(cases: readonly R2Case[], actors: Partial<Record<string, Performer>>) {
    return cases.flatMap((c) => {
      const paths = Object.fromEntries(ABILITIES.map((a) => [a, pathOf(c, a as AbilityId).cls])) as Record<AbilityId, PathClass>;
      return (Object.entries(actors) as [string, Performer][]).flatMap(([n, p]) => {
        const base = take(c, p);
        return ABILITIES.map((a) => ({ id: c.id, kind: c.kind, actor: n, ability: a as AbilityId, cls: paths[a as AbilityId], moved: take(c, raised(p, [a as AbilityId], 10)) - base }));
      });
    });
  },
  /** (c4.2): every ability with no path, its specialist against its comparison actor, at each budget. */
  unrelated(cases: readonly R2Case[], budgets: readonly R2Budget[]) {
    return cases.flatMap((c) => ABILITIES.filter((a) => pathOf(c, a as AbilityId).cls === 'none').flatMap((a) => budgets.map((b) => ({ id: c.id, kind: c.kind, ability: a as AbilityId, budget: b, lead: take(c, specialistAt(b, a as AbilityId)) - take(c, ST6R2_BUDGETS[b].against) }))));
  },
  /** (c4.3): each specialist's eleven, each raised alone to its comparison actor's level, and all eleven together. */
  weaknesses(cases: readonly R2Case[], budgets: readonly R2Budget[]) {
    return cases.flatMap((c) => {
      const paths = Object.fromEntries(ABILITIES.map((a) => [a, pathOf(c, a as AbilityId).cls])) as Record<AbilityId, PathClass>;
      return budgets.flatMap((b) => ABILITIES.map((x) => {
        const S = specialistAt(b, x as AbilityId), base = take(c, S), level = ST6R2_BUDGETS[b].level;
        const each = ABILITIES.filter((y) => y !== x).map((y) => ({ ability: y as AbilityId, cls: paths[y as AbilityId], rise: take(c, setAt(S, y as AbilityId, level)) - base }));
        return { id: c.id, kind: c.kind, budget: b, specialist: x as AbilityId, each, together: take(c, actor({ [x]: ST6R2_BUDGETS[b].strength }, level, ST6R2_BUDGETS[b].tech)) - base };
      }));
    });
  },
  /**
   * (c4.4), kept apart and not asserted: brief 12's pairs (each ability under a tenth of the twelve's +10 effects on the
   * even actor's restrained take, its specialist at 85 against the even actor), each with its path; and each pair ahead by
   * more than 0.05 with its strength's own gain, its eleven's own cost and their interaction.
   */
  equalBudget(cases: readonly R2Case[]) {
    const EVEN = ST6R2_ACTORS.even, fill = ST6R2_BUDGETS.brief12.fill;
    return cases.flatMap((c) => {
      const base = take(c, EVEN);
      const eff = Object.fromEntries(ABILITIES.map((a) => [a, Math.max(0, take(c, actor({ [a]: 60 }, 50)) - base)])) as Record<string, number>;
      const total = ABILITIES.reduce((t, a) => t + eff[a]!, 0);
      return ABILITIES.filter((a) => total > 0 && eff[a]! / total < 0.1).map((a) => {
        const lead = take(c, specialistAt('brief12', a as AbilityId)) - base;
        const row = { id: c.id, kind: c.kind, ability: a as AbilityId, cls: pathOf(c, a as AbilityId).cls, share: eff[a]! / total, lead };
        if (!(lead > 0.05)) return row;
        const gain = take(c, actor({ [a]: 85 }, 50)) - base, cost = take(c, actor({ [a]: 50 }, fill)) - base;
        return { ...row, gain, cost, interaction: lead - gain - cost };
      });
    });
  },
};

/**
 * (e2′), (e3′) and (e4): for each comparison actor and its counterpart (S, restraint's shift; S′, size's), every case's
 * takes on both sides, fully prepared, and the side's draws taken out for the side under test. `side` is the side under
 * test: restraint for the restraint set, size for the size set.
 */
export function opportunitiesWithRoom(cases: readonly R2Case[], comparison: Partial<Record<string, Performer>>, side: Side) {
  const other: Side = side === 'restrained' ? 'expansive' : 'restrained';
  const shift = side === 'restrained' ? RESTRAINT_SHIFT : SIZE_SHIFT;
  const withoutDraws = <T,>(f: () => T): T => (side === 'restrained' ? withRestraintDraws({}, f) : withSizeDraws({}, f));
  const suitable = (s: Side) => cases.filter((c) => !misfitOf('scale', s, c.material) && c.suit(s) > c.suit(s === 'restrained' ? 'expansive' : 'restrained'));
  const forSide = suitable(side), forOther = suitable(other);
  const tally = (ids: readonly R2Case[]) => { const works = ids.reduce((o, c) => { o[c.work] = (o[c.work] ?? 0) + 1; return o; }, {} as Record<string, number>); return { count: ids.length, works: Object.keys(works).length, families: [...new Set(ids.map((c) => c.family))], mostFromOneWork: Math.max(0, ...Object.values(works)) }; };
  return (Object.entries(comparison) as [string, Performer][]).map(([name, C]) => {
    const S = shifted(C, shift);
    const t = (p: Performer, c: R2Case, s: Side) => take(c, p, s);
    // Beside the verdict, not part of it (from 2026-10-17, brief 13, added after the informing actors were checked and
    // before the fresh ones were run): each margin again with the scene's grain at nothing for both takes, the abilities'
    // part alone, since the grain's points depend on the capacity they meet.
    const noGrainMargin = (p: Performer, c: R2Case, a: Side, b: Side) => withGrain(0, () => t(p, c, a) - t(p, c, b));
    const rows = forSide.map((c) => {
      const mC = t(C, c, side) - t(C, c, other), mS = t(S, c, side) - t(S, c, other);
      const [rC0, rS0] = withoutDraws(() => [t(C, c, side), t(S, c, side)]);
      return { id: c.id, kind: c.kind, medium: c.medium, work: c.work, family: c.family, marginC: mC, marginS: mS, extra: mS - mC, drawsPart: (t(S, c, side) - t(C, c, side)) - (rS0! - rC0!), extraAtNoGrain: noGrainMargin(S, c, side, other) - noGrainMargin(C, c, side, other) };
    });
    const weak = forOther.map((c) => ({ id: c.id, medium: c.medium, marginC: t(C, c, other) - t(C, c, side), marginS: t(S, c, other) - t(S, c, side), fallAtNoGrain: noGrainMargin(C, c, other, side) - noGrainMargin(S, c, other, side) }));
    const media = Object.fromEntries((['stage', 'tape'] as const).map((m) => {
      const of = rows.filter((r) => r.medium === m);
      const oppC = of.filter((r) => r.marginC > 0.05), oppS = of.filter((r) => r.marginS > 0.05);
      const gained = oppS.filter((r) => !(r.marginC > 0.05));
      const byId = new Map(cases.map((c) => [c.id, c]));
      const w = weak.filter((r) => r.medium === m);
      return [m, {
        suitable: of.length, opportunities: { C: oppC.length, S: oppS.length }, room: oppC.length < of.length, gained: gained.map((r) => r.id),
        variedS: tally(oppS.map((r) => byId.get(r.id)!)), otherSide: { suitable: w.length, C: w.filter((r) => r.marginC > 0.05).length, S: w.filter((r) => r.marginS > 0.05).length },
      }];
    }));
    return { name, budget: { C: budgetOf(C), S: budgetOf(S) }, rows, weak, media };
  });
}

/**
 * ST6-R2.c and .e clarified, each part's verdict and figures. `part` runs the trace, (c) or (e) alone, each under ten
 * minutes; with none, all three. The informing actors are brief 12's five; the fresh ones are the criteria's.
 */
export function measureST6R2Clarified(o: { part?: 'trace' | 'c' | 'e' } = {}) {
  const every = st6r2Cases('all');
  const out: Record<string, unknown> = { criterion: 'ST6-R2.c and ST6-R2.e clarified (docs/verification/playthroughs-2026-10-17/acting-criteria.md)', cases: every.length };
  const first = <T,>(xs: readonly T[]) => xs.slice(0, 20);
  const fresh = { ...ST6R2_COMPARISON.restraint, ...ST6R2_COMPARISON.size };
  if (!o.part || o.part === 'trace') out.trace = traceST6R2(every);
  if (!o.part || o.part === 'c') {
    const actors = { ...ST6R2_ACTORS, ...fresh };
    const circumstances = ST6R2.circumstances(every, actors);
    const strictWhere = (r: (typeof circumstances)[number], side: 'R' | 'E') => (side === 'R' ? r.sR[0] !== r.sR[1] : r.sE[0] !== r.sE[1]) && !r.floorHeld;
    const c21 = circumstances.filter((r) => !(r.dR >= -1e-9 && r.dE >= -1e-9 && (!strictWhere(r, 'R') || r.dR > 1e-9) && (!strictWhere(r, 'E') || r.dE > 1e-9) && (r.sR[1] - r.sR[0]) * r.want >= 0));
    const scene = ST6R2C.scene(every, actors);
    const wrongWay = scene.filter((r) => (r.s > 0 && r.d < -1e-9) || (r.s < 0 && r.d > 1e-9) || (r.s === 0 && Math.abs(r.d) > 1e-9));
    const notStrict = scene.filter((r) => r.kept && !r.floorHeld && !(Math.sign(r.d) === Math.sign(r.s) && Math.abs(r.d) > 1e-9));
    const excused = scene.filter((r) => !r.kept && r.s !== 0);
    const excusedMoved = excused.filter((r) => Math.abs(r.d) > 1e-9);
    const excusedNotTheRule = excused.filter((r) => Math.abs(r.s) !== 0.01);
    const ruleMissed = scene.filter((r) => Math.abs(r.s) === 0.01 && r.kept);
    const disconnected = excused.filter((r) => r.atFullPrecision === undefined || !(Math.sign(r.atFullPrecision) === Math.sign(r.s) && Math.abs(r.atFullPrecision) > 1e-9));
    const piece = every.find((c) => c.id === 'brief-psychological_horror-2/together')!;
    const b = ST6R2C.boundaries(piece, actors, every.filter((c) => c.medium === 'stage'));
    const hundredthBad = b.hundredth.filter((r) => !(r.minus - r.zero > 1e-9 && r.zero - r.plus > 1e-9));
    const floorBad = b.floor.filter((r) => !(Math.abs(r.below - r.at) <= 1e-9 && r.at - r.above > 1e-9));
    const realBoundary = Object.fromEntries(['0', '0.01', '0.02'].map((k) => [k, scene.filter((r) => Math.abs(r.s).toFixed(2) === Number(k).toFixed(2))]));
    const realBad = [...realBoundary['0']!, ...realBoundary['0.01']!].filter((r) => Math.abs(r.d) > 1e-9).concat(realBoundary['0.02']!.filter((r) => !(Math.sign(r.d) === Math.sign(r.s) && Math.abs(r.d) > 1e-9)));
    const holdBy = (w: string) => b.hold.filter((r) => r.where === w);
    const holdBad = [...holdBy('inside').filter((r) => !(r.s[0] !== r.s[1] && Math.abs(r.take) > 1e-9)), ...holdBy('reaching').filter((r) => !(r.s[0] !== r.s[1] && Math.abs(r.take) > 1e-9)), ...holdBy('past').filter((r) => !(r.s[0] === r.s[1] && Math.abs(r.take) <= 1e-9))];
    const map = ST6R2C.map(every, { ...ST6R2_ACTORS, ...fresh });
    const mapBad = map.filter((r) => (r.cls === 'none' ? Math.abs(r.moved) > 1e-9 : !(r.moved > 1e-9)));
    const budgets = Object.keys(ST6R2_BUDGETS) as R2Budget[];
    const unrelated = ST6R2C.unrelated(every, budgets);
    const unrelatedBad = unrelated.filter((r) => !(r.lead < -1e-9));
    const weak = ST6R2C.weaknesses(every, budgets);
    const weakBad = weak.filter((r) => !(r.together > 1e-9 && r.each.every((y) => (y.cls === 'none' ? Math.abs(y.rise) <= 1e-9 : y.rise > 1e-9))));
    const nine = ST6R2.weakness(every).nine.filter((r) => !(r.rise > 0.05));
    const eq = ST6R2C.equalBudget(every);
    const ahead = eq.filter((r) => r.lead > 0.05) as (ReturnType<typeof ST6R2C.equalBudget>[number] & { gain: number; cost: number; interaction: number })[];
    const count = <T,>(xs: readonly T[], f: (x: T) => string) => xs.reduce((m, x) => { const k = f(x); m[k] = (m[k] ?? 0) + 1; return m; }, {} as Record<string, number>);
    const lo = <T,>(xs: readonly T[], f: (x: T) => number) => (xs.length ? r4(Math.min(...xs.map(f))) : null);
    const hi = <T,>(xs: readonly T[], f: (x: T) => number) => (xs.length ? r4(Math.max(...xs.map(f))) : null);
    const verdict = {
      c21: { met: !c21.length, of: circumstances.length, failingCount: c21.length, failing: first(c21) },
      c22: { met: !wrongWay.length && !notStrict.length && !excusedMoved.length && !excusedNotTheRule.length && !ruleMissed.length && !disconnected.length, of: scene.length, wrongWay: first(wrongWay), notStrict: first(notStrict), excusedMoved: first(excusedMoved), excusedNotTheRule: first(excusedNotTheRule), ruleMissed: first(ruleMissed), disconnected: first(disconnected) },
      c23: { met: !hundredthBad.length && !floorBad.length && !realBad.length && !holdBad.length && ['inside', 'reaching', 'past'].every((w) => holdBy(w).length > 0) && realBoundary['0.01']!.length > 0 && realBoundary['0.02']!.length > 0, hundredthBad, floorBad, realBad: first(realBad), holdBad: first(holdBad) },
      c41: { met: !mapBad.length, of: map.length, failingCount: mapBad.length, failing: first(mapBad) },
      c42: { met: !unrelatedBad.length && unrelated.length > 0, of: unrelated.length, failingCount: unrelatedBad.length, failing: first(unrelatedBad) },
      c43: { met: !weakBad.length && !nine.length, of: weak.length, failingCount: weakBad.length, failing: first(weakBad.map((r) => ({ id: r.id, budget: r.budget, specialist: r.specialist, together: r.together, bad: r.each.filter((y) => (y.cls === 'none' ? Math.abs(y.rise) > 1e-9 : !(y.rise > 1e-9))) }))), nineFailing: first(nine) },
    };
    out.c = {
      verdict, met: Object.values(verdict).every((v) => v.met),
      figures: {
        c21: { changes: circumstances.length, actors: Object.keys(actors).length },
        c22: { actorCases: scene.length, kept: scene.filter((r) => r.kept).length, atZero: scene.filter((r) => r.s === 0).length, excused: { count: excused.length, pieces: [...new Set(excused.map((r) => r.id))], atFullPrecision: { least: lo(excused, (r) => Math.abs(r.atFullPrecision ?? 0)), most: hi(excused, (r) => Math.abs(r.atFullPrecision ?? 0)), byActor: Object.fromEntries(Object.keys(actors).map((n) => [n, hi(excused.filter((r) => r.actor === n), (r) => Math.abs(r.atFullPrecision ?? 0))])), shownTenthMoved: excused.filter((r) => r.shown && r.shown.take !== r.shown.atFullPrecision).length } }, leastStrict: lo(scene.filter((r) => r.kept && !r.floorHeld), (r) => Math.abs(r.d)), floorHeld: scene.filter((r) => r.floorHeld).length },
        c23: { piece: b.piece, hundredth: b.hundredth.map((r) => ({ actor: r.actor, below: r4(r.minus - r.zero), above: r4(r.zero - r.plus) })), floor: b.floor.map((r) => ({ actor: r.actor, belowLessAt: r.below - r.at, atLessAbove: r4(r.at - r.above) })), real: Object.fromEntries(Object.entries(realBoundary).map(([k, xs]) => [k, { actorCases: xs.length, same: xs.filter((r) => Math.abs(r.d) <= 1e-9).length, strictRightWay: xs.filter((r) => Math.sign(r.d) === Math.sign(r.s) && Math.abs(r.d) > 1e-9).length, leastStrict: lo(xs.filter((r) => Math.abs(r.d) > 1e-9), (r) => Math.abs(r.d)) }])), hold: Object.fromEntries(['inside', 'reaching', 'past', 'across'].map((w) => [w, holdBy(w).length])) },
        c41: { checks: map.length, byClass: count(map, (r) => r.cls), leastMovedWithAPath: lo(map.filter((r) => r.cls !== 'none'), (r) => r.moved) },
        c42: { pairs: unrelated.length, byAbility: count(unrelated, (r) => `${r.ability} ${r.budget}`), mostLead: hi(unrelated, (r) => r.lead) },
        c43: { specialists: weak.length, leastTogether: Object.fromEntries(budgets.map((bu) => [bu, lo(weak.filter((r) => r.budget === bu), (r) => r.together)])), leastEach: lo(weak.flatMap((r) => r.each.filter((y) => y.cls !== 'none')), (y) => y.rise), leastNine: lo(ST6R2.weakness(every).nine, (r) => r.rise) },
        c44: { pairs: eq.length, ahead: ahead.length, aheadByClass: count(ahead, (r) => r.cls), pairsByClass: count(eq, (r) => r.cls), aheadByWay: count(ahead, (r) => { const c = every.find((x) => x.id === r.id)!; return c.suit('expansive') > c.suit('restrained') ? 'against' : c.suit('restrained') > c.suit('expansive') ? 'with' : 'level'; }), gain: [lo(ahead, (r) => r.gain), hi(ahead, (r) => r.gain)], cost: [lo(ahead, (r) => r.cost), hi(ahead, (r) => r.cost)], interaction: [lo(ahead, (r) => r.interaction), hi(ahead, (r) => r.interaction)], leastShareAhead: lo(ahead, (r) => r.share), underTwelfth: { pairs: eq.filter((r) => r.share < 1 / 12).length, aboveTheEvenActor: eq.filter((r) => r.share < 1 / 12 && r.lead > 1e-9).length } },
      },
    };
  }
  if (!o.part || o.part === 'e') out.e = verdictE(every);
  return out;
}

/** (e1) as brief 12 wrote it, and (e2′), (e3′) and (e4), each with its figures. */
export function verdictE(every: readonly R2Case[]) {
  const opp = ST6R2.opportunities(every, ST6R2_ACTORS);
  const e1 = [...(['beginner', 'even', 'restrainedSpecialist', 'nearMaster'] as const).flatMap((n) => (['stage', 'tape'] as const).filter((m) => !variedEnough(opp.restrained.byActor[n]![m]!)).map((m) => `restraint ${n} ${m}`)), ...(['beginner', 'even', 'expansiveSpecialist', 'nearMaster'] as const).flatMap((n) => (['stage', 'tape'] as const).filter((m) => !variedEnough(opp.expansive.byActor[n]![m]!)).map((m) => `size ${n} ${m}`))];
  const side = (s: Side, set: Partial<Record<string, Performer>>, freshNames: readonly string[]) => {
    const all = opportunitiesWithRoom(every, set, s);
    const bad: string[] = [];
    for (const x of all) {
      if (Math.abs(x.budget.C - x.budget.S) > 1e-9) bad.push(`${x.name}: budgets ${x.budget.C} and ${x.budget.S}`);
      for (const r of x.rows) {
        if (!(r.extra > 0.05)) bad.push(`${x.name} ${r.id}: extra margin ${r4(r.extra)}`);
        if (!(r.drawsPart > 1e-9)) bad.push(`${x.name} ${r.id}: the draws' part ${r.drawsPart}`);
      }
      for (const r of x.weak) if (!(r.marginS < r.marginC - 1e-9)) bad.push(`${x.name} ${r.id}: the other side's margin ${r4(r.marginS)} against ${r4(r.marginC)}`);
      for (const [m, v] of Object.entries(x.media)) {
        if (v.room && !(v.opportunities.S > v.opportunities.C)) bad.push(`${x.name} ${m}: ${v.opportunities.S} with room, against ${v.opportunities.C}`);
        if (!variedEnough(v.variedS)) bad.push(`${x.name} ${m}: the counterpart's opportunities not varied enough`);
        if (!(v.otherSide.S <= v.otherSide.C)) bad.push(`${x.name} ${m}: the other side's opportunities ${v.otherSide.S} against ${v.otherSide.C}`);
      }
    }
    const byMedium = Object.fromEntries((['stage', 'tape'] as const).map((m) => {
      const freshWithRoom = all.filter((x) => freshNames.includes(x.name) && x.media[m]!.room);
      const gained = [...new Set(freshWithRoom.flatMap((x) => x.media[m]!.gained))];
      const ids = new Map(every.map((c) => [c.id, c]));
      const works = gained.reduce((o2, id) => { const w = ids.get(id)!.work; o2[w] = (o2[w] ?? 0) + 1; return o2; }, {} as Record<string, number>);
      const g = { count: gained.length, works: Object.keys(works).length, families: [...new Set(gained.map((id) => ids.get(id)!.family))], mostFromOneWork: Math.max(0, ...Object.values(works)) };
      if (!freshWithRoom.length) bad.push(`${m}: no fresh comparison actor has room`);
      else if (!variedEnough(g)) bad.push(`${m}: the gains together not varied enough`);
      return [m, { freshWithRoom: freshWithRoom.map((x) => x.name), gained: { count: g.count, works: g.works, families: g.families.length, mostFromOneWork: g.mostFromOneWork } }];
    }));
    const lo = <T,>(xs: readonly T[], f: (x: T) => number) => (xs.length ? r4(Math.min(...xs.map(f))) : null);
    return {
      met: !bad.length, failingCount: bad.length, failing: bad.slice(0, 20), byMedium,
      actors: all.map((x) => ({ name: x.name, budget: x.budget.C, media: Object.fromEntries(Object.entries(x.media).map(([m, v]) => [m, { suitable: v.suitable, C: v.opportunities.C, S: v.opportunities.S, ceiling: !v.room, gained: v.gained.length, otherSide: v.otherSide }])), leastExtra: lo(x.rows, (r) => r.extra), leastDrawsPart: lo(x.rows, (r) => r.drawsPart), leastOtherSideFall: lo(x.weak, (r) => r.marginC - r.marginS), extraNotOver005: x.rows.filter((r) => !(r.extra > 0.05)).map((r) => ({ id: r.id, extra: r4(r.extra), marginC: r4(r.marginC), marginS: r4(r.marginS), extraAtNoGrain: r4(r.extraAtNoGrain) })), otherSideNotBehind: x.weak.filter((r) => !(r.marginS < r.marginC - 1e-9)).map((r) => ({ id: r.id, marginC: r4(r.marginC), marginS: r4(r.marginS), fallAtNoGrain: r4(r.fallAtNoGrain) })) })),
      // Beside the verdict, not part of it: (e2.3) and (e4) read on the abilities' part alone, the scene's grain at nothing.
      atNoGrain: { extraNotOver005: all.reduce((t, x) => t + x.rows.filter((r) => !(r.extraAtNoGrain > 0.05)).length, 0), leastExtra: lo(all.flatMap((x) => x.rows), (r) => r.extraAtNoGrain), otherSideNotBehind: all.reduce((t, x) => t + x.weak.filter((r) => !(r.fallAtNoGrain > 1e-9)).length, 0), leastFall: lo(all.flatMap((x) => x.weak), (r) => r.fallAtNoGrain), of: all.reduce((t, x) => t + x.rows.length, 0), weakOf: all.reduce((t, x) => t + x.weak.length, 0) },
    };
  };
  const restraint = side('restrained', { ...ST6R2_COMPARISON.informing, ...ST6R2_COMPARISON.restraint }, Object.keys(ST6R2_COMPARISON.restraint));
  const size = side('expansive', { ...ST6R2_COMPARISON.informing, ...ST6R2_COMPARISON.size }, Object.keys(ST6R2_COMPARISON.size));
  return { verdict: { e1: { met: !e1.length, failing: e1 }, e2: restraint, e3: size }, met: !e1.length && restraint.met && size.met };
}

/**
 * The trace the clarified criteria were written from (docs/verification/playthroughs-2026-10-17/acting/trace.json, made by
 * a probe before them): the ten readings, the boundary on the real readings, brief 12's pairs and the 65, the window
 * between 1/12 and a tenth, and the map with its check on the even actor. Made again here, so it can be repeated.
 */
export function traceST6R2(cases: readonly R2Case[]) {
  const EVEN = ST6R2_ACTORS.even;
  const ids = ['brief-grindhouse/terror', 'brief-isekai/nobody', 'brief-rockumentary/relief', 'brief-science_fantasy/wonder', 'brief-dance-2/two', 'brief-melodrama-2/pride', 'brief-musical-2/love', 'brief-mystery-2/cornered', 'brief-psychological_horror-2/together', 'brief-psychological_horror-2/loop'];
  const ten = ids.map((id) => {
    const c = cases.find((x) => x.id === id)!;
    const { ctx, spec } = c.context('restrained');
    const rule = shareByRule(c);
    const su = c.suitability('restrained');
    const unrounded: EvalContext = { ...ctx, grain: Object.fromEntries(Object.entries(rule).map(([d, x]) => [d, { d: x!, label: 'unrounded' }])) };
    const none: EvalContext = { ...ctx, grain: {} };
    return {
      id, medium: c.material.medium, stakes: c.material.stakes ?? 1, stakesScale: stakesScale(c.material.stakes), signals: su.signals, signalsSumHalved: r4(su.signals.reduce((t, x) => t + x.v, 0) / 2), s: su.s, grainEngine: ctx.grain, grainAtFullPrecision: Object.fromEntries(Object.entries(rule).map(([d, x]) => [d, r4(x!)])), required: c.required('restrained'),
      actors: Object.fromEntries(Object.entries(ST6R2_ACTORS).map(([n, p]) => [n, { grainReadMinusNot: exactWith(p, ctx, spec) - exactWith(p, none, spec), atFullPrecisionMinusNot: r4(exactWith(p, unrounded, spec) - exactWith(p, none, spec)), shown: { grainRead: judgeWith(p, ctx, spec).overall, notRead: judgeWith(p, none, spec).overall, atFullPrecision: judgeWith(p, unrounded, spec).overall } }])),
    };
  });
  const boundary: Record<string, { cases: number; strictRightWay: number; same: number; wrongWay: number; leastStrict: number | null }> = {};
  for (const c of cases) {
    const s = c.suit('restrained');
    if (Math.abs(s) > 0.05) continue;
    for (const p of Object.values(ST6R2_ACTORS)) {
      const d = take(c, p) - withGrain(0, () => take(c, p));
      const r = (boundary[s.toFixed(2)] ??= { cases: 0, strictRightWay: 0, same: 0, wrongWay: 0, leastStrict: null });
      r.cases += 1;
      if (Math.abs(d) <= 1e-9) r.same += 1; else if (Math.sign(d) === Math.sign(s)) { r.strictRightWay += 1; r.leastStrict = r4(Math.min(r.leastStrict ?? Infinity, Math.abs(d))); } else r.wrongWay += 1;
    }
  }
  const fill = ST6R2_BUDGETS.brief12.fill;
  const pairs: { id: string; kind: string; ability: AbilityId; share: number; lead: number; way: string }[] = [];
  const sixtyFive: Record<string, unknown>[] = [];
  const window: Record<string, unknown>[] = [];
  const weakest = (e: Evaluation) => (e.piece?.segments ?? []).map((s) => { const q = Object.entries(s.dims).sort((x, y) => x[1]! - y[1]!); return { weakest: q[0]![0], byNext: r4(q[1]![1]! - q[0]![1]!) }; });
  for (const c of cases) {
    const e0 = c.judge(EVEN, 'restrained');
    const base = e0.exact!;
    const eff = Object.fromEntries(ABILITIES.map((a) => [a, Math.max(0, take(c, actor({ [a]: 60 }, 50)) - base)])) as Record<AbilityId, number>;
    const total = ABILITIES.reduce((t, a) => t + eff[a as AbilityId], 0);
    const sR = c.suit('restrained'), sE = c.suit('expansive');
    const way = sE > sR ? 'against' : sR > sE ? 'with' : 'level';
    for (const a of ABILITIES as AbilityId[]) {
      if (!(total > 0 && eff[a] / total < 0.1)) continue;
      const share = eff[a] / total;
      const S = actor({ [a]: 85 }, fill);
      const lead = take(c, S) - base;
      pairs.push({ id: c.id, kind: c.kind, ability: a, share, lead, way });
      const inWindow = share >= 1 / 12;
      if (!(lead > 0.05) && !inWindow) continue;
      const gain = take(c, actor({ [a]: 85 }, 50)) - base;
      const cost = take(c, actor({ [a]: 50 }, fill)) - base;
      const row = { id: c.id, kind: c.kind, work: c.work, ability: a, way, sR, sE, share: r4(share), lead: r4(lead), gain: r4(gain), cost: r4(cost), interaction: r4(lead - gain - cost), costOverPredictedByShares: r4(cost / (-((50 - fill) / 10) * (total - eff[a]))), weakest: weakest(e0) };
      if (inWindow) window.push(row);
      if (lead > 0.05) {
        const p = pathOf(c, a);
        const why = RESTRAINT_DRAWS().has(a) ? 'restraint draws on it' : p.cls === 'direct' ? 'read in a dimension at least as much as the work’s own profile reads that dimension’s leading ability' : p.cls === 'small' ? 'read only under what the profile gives a dimension’s leading ability (a supporting read)' : p.cls === 'indirect' ? 'read through the drain alone (a later segment, a load over nothing)' : 'nothing reads it';
        sixtyFive.push({ ...row, shareAtTheSpecialistsLevels: r4(gain / (gain - cost)), leadWithTheGrainAtNothing: r4(withGrain(0, () => take(c, S) - take(c, EVEN))), leadNoWayChosen: r4(c.judge(S, undefined).exact! - c.judge(EVEN, undefined).exact!), leadPlayedExpansive: r4(take(c, S, 'expansive') - take(c, EVEN, 'expansive')), path: { cls: p.cls, why, reads: p.reads.map((x) => ({ dimension: x.dimension, weight: x.weight, leading: x.leading, direct: x.weight >= x.leading - 1e-12 })) } });
      }
    }
  }
  const ahead = pairs.filter((p) => p.lead > 0.05);
  const count = <T,>(xs: T[], f: (x: T) => string) => xs.reduce((o2, x) => { const k = f(x); o2[k] = (o2[k] ?? 0) + 1; return o2; }, {} as Record<string, number>);
  const windowSummary = Object.fromEntries(['against', 'with', 'level'].map((w) => {
    const xs = window.filter((r) => r.way === w) as { lead: number; costOverPredictedByShares: number; weakest: { weakest: string; byNext: number }[] }[];
    const med = (v: number[]) => { const s = [...v].sort((x, y) => x - y); return s.length ? r4(s[Math.floor(s.length / 2)]!) : null; };
    const aheadXs = xs.filter((r) => r.lead > 0.05), notXs = xs.filter((r) => !(r.lead > 0.05));
    const believabilityAlone = (r: (typeof xs)[number]) => r.weakest.every((s) => s.weakest === 'believability' && s.byNext > 0.05);
    return [w, { pairs: xs.length, ahead: aheadXs.length, costOverPredicted: { ahead: med(aheadXs.map((r) => r.costOverPredictedByShares)), notAhead: med(notXs.map((r) => r.costOverPredictedByShares)) }, believabilityAloneAtTheBottomOfEverySegment: { ahead: aheadXs.filter(believabilityAlone).length, notAhead: notXs.filter(believabilityAlone).length } }];
  }));
  const map: Record<string, Record<string, Record<string, number>>> = {};
  const mapCheck = { agree: 0, disagree: [] as string[] };
  for (const c of cases) {
    const base = take(c, EVEN);
    for (const a of ABILITIES as AbilityId[]) {
      const cls = pathOf(c, a).cls;
      ((map[c.kind] ??= {})[a] ??= {})[cls] = (map[c.kind]![a]![cls] ?? 0) + 1;
      const moved = Math.abs(take(c, actor({ [a]: 60 }, 50)) - base) > 1e-9;
      if (moved === (cls !== 'none')) mapCheck.agree += 1; else mapCheck.disagree.push(`${c.id} ${a} ${cls}`);
    }
  }
  return {
    note: 'Brief 13, acting: the trace made before the clarified criteria were written (probe, not a tool). No threshold here decides anything.',
    ten, boundary,
    pairs: { counted: pairs.length, ahead: ahead.length, aheadByWay: count(ahead, (p) => p.way), aheadByKind: count(ahead, (p) => p.kind), aheadByAbility: count(ahead, (p) => p.ability), aheadByPath: count(sixtyFive as { path: { cls: string } }[], (p) => p.path.cls), leastShareAhead: r4(Math.min(...ahead.map((p) => p.share))) },
    window: windowSummary, sixtyFive, map, mapCheck,
  };
}
