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
import { requiredFor, sceneOfMaterial, suitabilityOf } from '../src/engine/systems/interpretation';
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
  suit(side: Side): number;
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
    suit: (side) => suitabilityOf(side, m, scene).s,
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
  return {
    kind: 'night', id: `night:${m.id}`, work: workOf(m), family: familyOf(m), medium: 'stage', material: played,
    judge: (p, side, o = {}) => {
      const prepAt = o.prep ?? 1;
      const read = materialContext(task, played, side ? { scale: side, chosenAt: 0, prep: prepAt } : undefined);
      const prep = { lines: 1, blocking: 1, notes: 1, ...(side ? { approach: prepAt } : {}) };
      const required = { lines: 0.9, blocking: 0.9, notes: 0.9, ...(side ? { approach: read.required } : {}) };
      const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required, difficulty: NIGHT_DIFFICULTY.school.supporting, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: o.key ?? `st6r2:night:${m.id}`, ...(o.key ? {} : { expected: true }) };
      return judgePiece(SEED, p, ctx, spec);
    },
    suit: (side) => suitabilityOf(side, played, scene).s,
    required: (side) => requiredFor([side], played, scene),
    at: (c, level) => nightR2({ ...m, circumstances: { ...(m.circumstances ?? {}), [c]: level } }),
  };
}

/** A practice brief in one reading, as `preview` judges a reading played a way (`systems/briefs.ts`). */
function briefR2(b: Brief, reading: string): R2Case {
  const material = briefMaterial(b);
  const scene = sceneOf(b, readingOf(b, reading));
  return {
    kind: 'brief', id: `${b.id}/${reading}`, work: b.id, family: scene.genre ?? 'none', medium: 'tape', material,
    judge: (p, side, o = {}) => {
      const prepAt = o.prep ?? 1;
      const rec: BriefRecord = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [], ...(o.callback ? { callback: { axis: 'scale' as const, side: o.callback, why: '', at: 0 } } : {}) };
      const ctx = briefContext(nobody, b, rec, { reading, ...(side ? { playing: { scale: side, chosenAt: 0, prep: prepAt } } : {}), prep: { genre: 1, ...(side ? { approach: prepAt } : {}) }, ...(o.callback ? { callback: true } : {}) });
      return judgePiece(SEED, p, { ...ctx, condition: { readiness: 100 }, key: o.key ?? `st6r2:brief:${b.id}`, ...(o.key ? {} : { expected: true }) }, briefPiece(b, { ...rec, reading }, reading));
    },
    suit: (side) => suitabilityOf(side, material, scene).s,
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
  const first = <T,>(xs: readonly T[]) => xs.slice(0, 20);
  const verdict = {
    a: { met: !a1.length && !a2.length && !a3.length && !a4.length, a1: { met: !a1.length, of: contribution.length, failing: first(a1) }, a2: { met: !a2.length, of: contribution.length, failing: first(a2) }, a3: { met: !a3.length, of: dose.length, failing: first(a3) }, a4: { met: !a4.length, of: mastery.length, failing: first(a4) } },
    c: { met: !c1.length && !c2a.length && !c2b.length && !c3.length && c4a.length <= 0.01 * weakness.pairs.length && !c4b.length, c1: { met: !c1.length, of: preparation.length, failing: first(c1) }, c2: { met: !c2a.length && !c2b.length, circumstances: { of: circumstances.length, failing: first(c2a) }, grain: { of: grain.length, failing: first(c2b) } }, c3: { met: !c3.length, of: validity.length, failing: first(c3) }, c4: { met: c4a.length <= 0.01 * weakness.pairs.length && !c4b.length, pairs: weakness.pairs.length, ahead: c4a.length, aheadShare: r4(c4a.length / Math.max(1, weakness.pairs.length)), aheadFirst: first(c4a), nine: { of: weakness.nine.length, failing: first(c4b) } } },
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
    c4: { leastNineRise: lo(weakness.nine, (r) => r.rise) },
    e: { restrained: opp.restrained, expansive: opp.expansive, optionTwo: opp.optionTwo },
  };
  return {
    criterion: 'ST6-R2 (docs/verification/resolution-2026-10-17/acting-criteria.md)', heavy: o.heavy ?? 'all',
    cases: { heavy: count(heavy), every: count(every) },
    budgets: Object.fromEntries(Object.entries(A).map(([n, p]) => [n, budgetOf(p)])),
    verdict, met: verdict.a.met && verdict.c.met && verdict.e.met, figures,
  };
}
