/**
 * SLATE — the played harness F2-A reads (from 2026-10-16; docs/verification/advice-2026-10-16/criteria.md): a student who
 * tapes three briefs through the game's commands, and copies of the save that each train one input for twenty days.
 * `tools/advice.ts` runs it over the seeds; `tests/advice.test.ts` plays one case through it. From brief 10 (later on
 * 2026-10-16) it also builds F2-A10's cases (`buildCase`, below F2-A's own, which are unchanged): a band of ability, a
 * stage of the term, the 149 genres, and the realized gain over the work the advice reads (`worthOf`). From brief 12
 * (2026-10-17) it also names the fresh validation set (adv-v-0 to 119, refused without --fresh) and holds the workings
 * and detectors the clarified (f) and (h) are measured by (below `caseOf`'s sets, at the end of the file).
 */

import { createSave, loadSave } from '../src/engine';
import { newLifeConfig } from '../src/engine/world/bootstrap';
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY, instantFromZoned, zonedParts } from '../src/engine/core/time';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { ABILITY_DEFS, MASTERED, TECHNIQUES, type AbilityId } from '../src/engine/content/abilities';
import type { Skill } from '../src/engine/content/school';
import { BRIEFS, BRIEF_BY_ID } from '../src/engine/content/briefs';
import { exerciseFor } from '../src/engine/content/practice';
import { atFull, forecast, genreKnown } from '../src/engine/systems/briefs';
import { RULESET, TASK_PROFILES } from '../src/engine/content/tasks';
import { performerOf, replayAs, type WorkRecord } from '../src/engine/systems/evaluation';
import { forecastChange, trainingForecast, trained, type Forecast } from '../src/engine/systems/advice';
import type { Recommendation } from '../src/engine/systems/experience';
import { matchedTier } from '../src/engine/systems/practice';
import { CRAFT_ABILITY, abilityFull, attributesOf, isAbility, levelOf } from '../src/engine/systems/attributes';
import { inHospital } from '../src/engine/systems/health';

export const SESSIONS = 20;
const NY = 'America/New_York';

/** A seeded draw, the same for a seed every run. */
export function rng(seed: string) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return () => { h = (Math.imul(h, 1103515245) + 12345) >>> 0; return h / 4294967296; }; }

export const clear = (sim: Simulation) => { for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now); };
// TEST SETUP: rested before every command, so the day's condition is the same in every copy.
export const rest = (sim: Simulation) => { clear(sim); Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); };
export const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return sim.execute({ kind, payload }); };
export const clone = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)));
const nextDay = (sim: Simulation, hour: number) => { const p = zonedParts(sim.now + MS_DAY, NY); return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour }, NY); };

/** Twenty days, a session of the exercise each (or none, for the baseline), at the first free hour. `days` (from brief 12): fewer, for a player who follows the advice in part. */
export function live(sim: Simulation, exercise: string | undefined, days = SESSIONS) {
  for (let d = 0; d < days; d += 1) {
    sim.advanceTo(nextDay(sim, 7));
    if (!exercise) continue;
    for (const hour of [7, 8, 20, 21, 12, 17]) {
      rest(sim);
      const target = instantFromZoned({ ...zonedParts(sim.now, NY), hour, minute: 0 }, NY);
      if (target > sim.now) sim.advanceTo(target);
      const ex = exerciseFor(exercise as never)!;
      const r = go(sim, 'practice.exercise', { exercise: ex.id, tier: matchedTier(levelOf(sim, sim.player, exercise as never)), focus: 'steady' });
      if (r.ok) break;
    }
  }
  rest(sim);
}

/** The taped briefs' forecast, weighted to the latest as the advice weights its recent work. */
export const worth = (sim: Simulation, briefs: string[]) => { rest(sim); const w = briefs.map((_, i) => i + 1); return briefs.reduce((t, id, i) => t + forecast(sim, sim.player, BRIEF_BY_ID[id]!).overall * w[i]!, 0) / w.reduce((a, x) => a + x, 0); };


/** A case: the student, abilities and techniques drawn from the seed (TEST SETUP), three briefs taped through the commands. */
export function setUp(seed: string): { sim: Simulation; briefs: string[] } {
  const r = rng(seed);
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  clear(sim);
  sim.advanceTo(instantFromZoned({ year: 2026, month: 8, day: 29, hour: 9 }, NY));
  Object.assign(sim.player.attrs!, Object.fromEntries(ABILITY_DEFS.filter((d) => d.id !== 'stamina').map((d) => [d.id, Math.round(30 + 45 * r())])));
  Object.assign(sim.player.craft!, Object.fromEntries(TECHNIQUES.map((s) => [s, Math.round(25 + 50 * r())])));
  const briefs: string[] = [];
  while (briefs.length < 3) { const b = BRIEFS[Math.floor(r() * BRIEFS.length)]!; if (!briefs.includes(b.id) && b.medium === 'camera') briefs.push(b.id); }
  for (const id of briefs) {
    const b = BRIEF_BY_ID[id]!;
    go(sim, 'brief.choose', { brief: id, reading: b.readings[0]!.id });
    for (let i = 0; i < 2; i += 1) for (const step of ['read', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: id, step });
    go(sim, 'genre.study', { genre: b.kinds[0] });
    const t = go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: id });
    if (!t.ok) throw new Error(`${seed} ${id}: ${t.error}`);
  }
  rest(sim);
  return { sim, briefs };
}

/** What twenty days of each input's exercise brought, against a baseline copy that lived the same days without them. */
export function realize(sim: Simulation, briefs: string[], inputs: Iterable<string>): Record<string, number> {
  const base = clone(sim);
  live(base, undefined);
  const baseWorth = worth(base, briefs);
  const out: Record<string, number> = {};
  for (const id of inputs) { const c = clone(sim); live(c, id); out[id] = Math.round((worth(c, briefs) - baseWorth) * 100) / 100; }
  return out;
}

/*
 * F2-A10, the broadened proof (from 2026-10-16, brief 10; docs/verification/decisions-2026-10-16/criteria.md, section 2,
 * and docs/verification/remaining-10/advice-checklist.json, written before this). Everything above is F2-A's, kept as it
 * was so its forty cases are the same cases and tests/advice.test.ts plays adv-2 as it did. What follows builds the new
 * cases: four bands of ability, three stages of a term's work, every genre of the 149 open to a take, and the realized
 * gain read over the work the advice reads, at full precision.
 */

/** The bands (F2-A10 (a)): abilities and techniques drawn within each; near mastery has some inputs at full. */
export const BANDS = { beginner: [25, 45], developing: [40, 65], advanced: [60, 85], nearMastery: [80, 97] } as const;
export type Band = keyof typeof BANDS;
export const BAND_ORDER: readonly Band[] = ['beginner', 'developing', 'advanced', 'nearMastery'];
/** Near mastery: each input at full with this chance, and at least `fullLeast` of them. TEST SETUP. */
const NEAR_FULL = { chance: 0.25, least: 2 } as const;

/** The stages (F2-A10 (a)): how many takes, over how many days from 29 August, and the least share of distinct genres later. */
export const STAGES = { firstWeek: { takes: [1, 3], days: 6 }, midTerm: { takes: [6, 10], days: 45 }, later: { takes: [15, 20], days: 100 } } as const;
export type Stage = keyof typeof STAGES;
export const STAGE_ORDER: readonly Stage[] = ['firstWeek', 'midTerm', 'later'];
/** From mid-term on, a take after the second is another reading of a brief already taped with this chance. */
const AGAIN = 0.2;

/** How many of the latest pieces the realized gain reads, weighted (i + 1) / n: F2-A's weights, fixed here whatever the advice reads. */
export const RECENT = 12;

/** Every genre a brief is written for, the 149. */
export const GENRES: readonly string[] = [...new Set(BRIEFS.flatMap((b) => b.kinds))].sort();

export interface CaseSpec { seed: string; set: 'tuning' | 'held-out' | 'fresh'; design: 'F2-A' | 'F2-A10'; band?: Band; stage?: Stage }

/**
 * What each set is for, as a run's summary says it (from brief 12, 2026-10-17; docs/verification/resolution-2026-10-17/
 * advice-criteria.md). The held-out set was brief 10's unseen validation, run again in brief 11; its results informed brief
 * 12's clarifications, so from then it's regression coverage, reported as `regression`, and the fresh set is the unseen one.
 */
export const SET_ROLE = {
  tuning: 'tuning: played and read while the advice and its tests were made',
  'held-out': 'regression: brief 10’s held-out set, run in brief 10 and brief 11; it informed brief 12’s clarifications, so it isn’t unseen validation from then',
  fresh: 'unseen validation (brief 12): run once, on the tested commit, after the clarified criteria were written',
} as const;
/** The name a set's groups have in a summary: the held-out set's is `regression` from brief 12. */
export const SET_LABEL = { tuning: 'tuning', 'held-out': 'regression', fresh: 'fresh' } as const;

/**
 * A seed's case: F2-A's adv-0 to 9 (tuning) and 10 to 39 (held out), as F2-A built them; adv-t-0 to 19 (tuning) and
 * adv-h-0 to 119 (held out), F2-A10's, their band and stage from their number (the checklist's `seeds`); and from brief
 * 12, adv-v-0 to 119 (fresh), stratified as the held-out ones are and built the same way. Nothing in the advice reads
 * this: only the harness does, to build the case.
 */
export function caseOf(seed: string): CaseSpec | undefined {
  let m = /^adv-(\d+)$/.exec(seed);
  if (m && Number(m[1]) < 40) return { seed, set: Number(m[1]) < 10 ? 'tuning' : 'held-out', design: 'F2-A' };
  m = /^adv-t-(\d+)$/.exec(seed);
  if (m && Number(m[1]) < 20) { const n = Number(m[1]); return { seed, set: 'tuning', design: 'F2-A10', band: BAND_ORDER[n % 4]!, stage: STAGE_ORDER[Math.floor(n / 4) % 3]! }; }
  m = /^adv-([hv])-(\d+)$/.exec(seed);
  if (m && Number(m[2]) < 120) { const n = Number(m[2]); return { seed, set: m[1] === 'h' ? 'held-out' : 'fresh', design: 'F2-A10', band: BAND_ORDER[Math.floor(n / 30)]!, stage: STAGE_ORDER[Math.floor((n % 30) / 10)]! }; }
  return undefined;
}

/** A take as the harness taped it: the brief, its genre, the reading, and whether it was another reading of one taped before. */
export interface Take { brief: string; genre: string; reading: string; at: number; again: boolean }

/** Sets an ability or a technique where it's kept (TEST SETUP): the craft, the attributes, or the body's fitness, never past full. */
export function setLevel(sim: Simulation, id: string, level: number | 'full'): void {
  const p = sim.player;
  if (isAbility(id as never)) {
    const full = abilityFull(sim, p, id as AbilityId);
    const v = level === 'full' ? full : Math.min(full, level);
    const skill = CRAFT_ABILITY[id as AbilityId];
    if (skill) p.craft![skill] = v;
    else if (id === 'stamina') p.wellbeing.fitness = v;
    else (attributesOf(sim, p) as unknown as Record<string, number>)[id] = v;
  } else p.craft![id as Skill] = level === 'full' ? 100 : level;
}

/** Every ability and every technique, the inputs a band draws. */
export const INPUTS: readonly string[] = [...ABILITY_DEFS.map((d) => d.id), ...TECHNIQUES];

const dayAt = (start: number, day: number, hour: number) => { const p = zonedParts(start, NY); return instantFromZoned({ year: p.year, month: p.month, day: p.day + day, hour }, NY); };

/**
 * An F2-A10 case: a student created through `createSave`, every ability (stamina's fitness among them) and technique
 * drawn within the band (TEST SETUP, set where each is kept), then the stage's takes through the game's commands: each
 * new take's genre drawn from the 149 without repeating, its brief from that genre's, its reading drawn, one to three
 * rounds of each step and none to two studies of the genre; from mid-term on, a share of the takes another reading of a
 * brief taped before, one round of each step. Each take on its day at nine, rested (`go`), every calendar hour cleared.
 */
export function buildCase(seed: string, band: Band, stage: Stage): { sim: Simulation; takes: Take[]; full: string[]; drawn: Record<string, number | 'full'> } {
  const r = rng(seed);
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  clear(sim);
  const start = instantFromZoned({ year: 2026, month: 8, day: 29, hour: 9 }, NY);
  sim.advanceTo(start);
  const [lo, hi] = BANDS[band];
  const full = new Set<string>();
  // What each input was drawn at (from brief 11, 2026-10-17, for the gate test of the bands; the draw is unchanged).
  const drawn: Record<string, number | 'full'> = {};
  for (const id of INPUTS) {
    const v = Math.round(lo + (hi - lo) * r());
    const atFull = band === 'nearMastery' && r() < NEAR_FULL.chance;
    if (atFull) full.add(id);
    drawn[id] = atFull ? 'full' : v;
    setLevel(sim, id, atFull ? 'full' : v);
  }
  while (band === 'nearMastery' && full.size < NEAR_FULL.least) { const id = INPUTS[Math.floor(r() * INPUTS.length)]!; full.add(id); drawn[id] = 'full'; setLevel(sim, id, 'full'); }
  const { takes: [least, most], days } = STAGES[stage];
  const n = least + Math.floor(r() * (most - least + 1));
  const genres = [...GENRES];
  const takes: Take[] = [];
  for (let k = 0; k < n; k += 1) {
    const at = dayAt(start, n > 1 ? Math.round((k * days) / (n - 1)) : 0, 9);
    if (at > sim.now) sim.advanceTo(at);
    const taped = [...new Set(takes.map((t) => t.brief))].filter((id) => BRIEF_BY_ID[id]!.readings.length > 1);
    if (stage !== 'firstWeek' && k >= 2 && taped.length && r() < AGAIN) {
      const id = taped[Math.floor(r() * taped.length)]!;
      const b = BRIEF_BY_ID[id]!;
      const last = takes.filter((t) => t.brief === id).at(-1)!;
      const reading = b.readings.find((x) => x.id !== last.reading)!.id;
      const prepare = () => { go(sim, 'brief.choose', { brief: id, reading }); for (const step of ['read', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: id, step }); };
      prepare();
      tapeWaiting(sim, `${seed} ${id} again`, prepare, () => go(sim, 'practice.self_tape', { genre: last.genre, brief: id }));
      takes.push({ brief: id, genre: last.genre, reading, at: sim.now, again: true });
      continue;
    }
    const genre = genres.splice(Math.floor(r() * genres.length), 1)[0]!;
    const of = BRIEFS.filter((b) => b.kinds.includes(genre) && !takes.some((t) => t.brief === b.id));
    const b = of[Math.floor(r() * of.length)]!;
    const reading = b.readings[Math.floor(r() * b.readings.length)]!.id;
    const rounds = 1 + Math.floor(r() * 3);
    const studies = Math.floor(r() * 3);
    const prepare = () => {
      go(sim, 'brief.choose', { brief: b.id, reading });
      for (let i = 0; i < rounds; i += 1) for (const step of ['read', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: b.id, step });
      for (let i = 0; i < studies; i += 1) go(sim, 'genre.study', { genre });
    };
    prepare();
    tapeWaiting(sim, `${seed} ${b.id}`, prepare, () => go(sim, 'practice.self_tape', { genre, brief: b.id }));
    takes.push({ brief: b.id, genre, reading, at: sim.now, again: false });
  }
  rest(sim);
  if (sim.universe.meta.endedAt !== undefined) throw new Error(`${seed}: the life ended while its takes were taped`);
  // Every piece of work the case holds is one of its takes, in order: what the realized gain reads is what the advice reads.
  if ((sim.player.work ?? []).length !== takes.length) throw new Error(`${seed}: ${(sim.player.work ?? []).length} pieces of work for ${takes.length} takes`);
  return { sim, takes, full: [...full], drawn };
}

/**
 * A take, and where it's refused because she's in hospital (a stay the life's own health brought on), the stay waited
 * out a day at a time as a player waits it, the take's preparation done again and the take taped then (from brief 10's
 * held-out run, later on 2026-10-16, which met it on adv-h-10 and adv-h-57: until then the harness threw, and the case
 * was never built). Only a refused take waits, so a case that never met a stay is built exactly as it was. Exported from
 * brief 11 (2026-10-17), for the gate test that holds it (`tests/decisions-advice.test.ts`).
 */
export function tapeWaiting(sim: Simulation, what: string, prepare: () => void, tape: () => { ok: boolean; error?: string }): void {
  let t = tape();
  if (!t.ok && inHospital(sim.player, sim.now)) {
    for (let d = 0; d < 90 && inHospital(sim.player, sim.now) && sim.universe.meta.endedAt === undefined; d += 1) sim.advanceTo(nextDay(sim, 9));
    prepare();
    t = tape();
  }
  if (!t.ok) throw new Error(`${what}: ${t.error}`);
}

/**
 * The cases a `--cases` list names: `tuning`, `held-out`, `fresh` (from brief 12), a seed, or a range `adv-h-0..9`; an
 * unknown seed throws. Kept in `tools/advice.ts` until brief 11 (2026-10-17), and moved here unchanged with the refusal
 * below, so a gate test reads what the measure runs.
 */
export function casesOf(list: string): CaseSpec[] {
  const out: string[] = [];
  for (const item of list.split(',').map((x) => x.trim()).filter(Boolean)) {
    if (item === 'tuning') out.push(...Array.from({ length: 10 }, (_, i) => `adv-${i}`), ...Array.from({ length: 20 }, (_, i) => `adv-t-${i}`));
    else if (item === 'held-out') out.push(...Array.from({ length: 30 }, (_, i) => `adv-${i + 10}`), ...Array.from({ length: 120 }, (_, i) => `adv-h-${i}`));
    else if (item === 'fresh') out.push(...Array.from({ length: 120 }, (_, i) => `adv-v-${i}`));
    else {
      const m = /^(.*-)(\d+)\.\.(\d+)$/.exec(item);
      if (m) for (let n = Number(m[2]); n <= Number(m[3]); n += 1) out.push(`${m[1]}${n}`);
      else out.push(item);
    }
  }
  return out.map((seed) => { const c = caseOf(seed); if (!c) throw new Error(`${seed} is no case of F2-A or F2-A10`); return c; });
}

/**
 * Why a run is refused: a held-out seed asked for without `--held-out`, or a fresh one without `--fresh` (from brief 12).
 * Until brief 12 the held-out refusal said a held-out seed was run "once, on the code to be reported"; it was run in brief
 * 10 and again in brief 11, and from brief 12 it's regression coverage, still run only when asked for. The fresh set is
 * what's run once, on the tested commit (advice-criteria.md).
 */
export const heldOutRefusal = (specs: readonly CaseSpec[], heldOut: boolean, fresh = false): string | undefined => (specs.some((x) => x.set === 'held-out') && !heldOut ? 'A held-out seed (regression coverage from brief 12) is run only with --held-out, on the code to be reported.' : specs.some((x) => x.set === 'fresh') && !fresh ? 'A fresh validation seed is run only with --fresh, once, on the tested commit.' : undefined);

/** F2-A's case as takes: its three briefs, each at its first reading, as `setUp` taped them. */
export function f2aCase(seed: string): { sim: Simulation; takes: Take[] } {
  const { sim, briefs } = setUp(seed);
  const work = sim.player.work ?? [];
  return { sim, takes: briefs.map((id, i) => ({ brief: id, genre: BRIEF_BY_ID[id]!.kinds[0]!, reading: BRIEF_BY_ID[id]!.readings[0]!.id, at: work[i]?.at ?? 0, again: false })) };
}

/**
 * What the takes the advice reads are worth now, at full precision (`exact`): the latest `RECENT`, each forecast at the
 * reading it was taped at as its record stands, weighted (i + 1) / n. F2-A's `worth` read the shown tenth of three.
 */
export function worthOf(sim: Simulation, takes: readonly Take[]): number {
  rest(sim);
  const last = takes.slice(-RECENT);
  const w = last.map((_, i) => (i + 1) / last.length);
  return last.reduce((t, x, i) => { const e = forecast(sim, sim.player, BRIEF_BY_ID[x.brief]!, { reading: x.reading }); return t + (e.exact ?? e.overall) * w[i]!; }, 0) / w.reduce((a, x) => a + x, 0);
}

/**
 * The inputs a player could train for this work, by the game's own rules and not the advice's: every ability and
 * technique the latest `RECENT` pieces read that has an exercise and isn't at full (`atFull`: an ability at its full, a
 * technique at `MASTERED`).
 */
export function candidatesOf(sim: Simulation): string[] {
  const work = [...(sim.player.work ?? [])].sort((a, b) => a.at - b.at).slice(-RECENT);
  const ids = new Set<string>();
  for (const w of work) {
    for (const a of Object.keys(w.inputs.abilities)) ids.add(a);
    for (const [s, x] of Object.entries(w.inputs.techniques)) if ((x ?? 0) > 0 && TECHNIQUES.includes(s as Skill)) ids.add(s);
  }
  return [...ids].filter((id) => exerciseFor(id as never) && !isFull(sim, id)).sort();
}

/** Whether an input is at full by the game's own rule (`atFull`). */
export const isFull = (sim: Simulation, id: string): boolean => atFull(levelOf(sim, sim.player, id as never), id, isAbility(id as never) ? abilityFull(sim, sim.player, id as AbilityId) : 100);

/*
 * Brief 12 (2026-10-17; docs/verification/resolution-2026-10-17/advice-criteria.md, written before this): the detectors
 * and the independent workings the clarified F2-A10 (f) and (h) are measured by. Each is worked from the records, the
 * judge's own replay (`replayAs`) and the game's own growth, never from the advice's helper it checks, except where a
 * clause is about the advice reading itself the same way twice (S1, S2: a fresh forecast of the same save opened anew).
 */

/** A recent piece the forecast reads: judged under today's rules, replayable, the latest `RECENT` (as the advice keeps them, worked here apart). */
export const readWork = (sim: Simulation): WorkRecord[] => [...(sim.player.work ?? [])].filter((w) => w.ruleset === RULESET && w.inputs.seed !== undefined && TASK_PROFILES[w.task]).sort((a, b) => a.at - b.at).slice(-RECENT);
/** Whether a part of a piece's own preparation held it back most: its first limit a preparation, and not knowing the genre. */
export const heldOwn = (w: WorkRecord): boolean => w.limits[0]?.kind === 'preparation' && w.limits[0].what !== 'genre';
/** A piece with every part of its own preparation complete, its segments' too, knowing the genre as it stands. */
export const preparedCopy = (w: WorkRecord): WorkRecord => {
  const done = (prep: Record<string, number>) => Object.fromEntries(Object.entries(prep).map(([k, x]) => [k, k === 'genre' ? x : 1]));
  return { ...w, inputs: { ...w.inputs, prep: done(w.inputs.prep), ...(w.inputs.piece?.own ? { piece: { ...w.inputs.piece, own: w.inputs.piece.own.map((o) => (o?.prep ? { ...o, prep: done(o.prep) } : o)) } } : {}) } };
};
/** Each piece's genre part as known today, by the brief its take was and `genreKnown`, the function a take reads. */
export function genreToday(sim: Simulation): (w: WorkRecord) => WorkRecord {
  const of = new Map<string, string>();
  for (const [id, r] of Object.entries(sim.player.briefs ?? {})) for (const t of r.takes) of.set(t.key, id);
  return (w) => { const b = w.inputs.prep.genre !== undefined ? BRIEF_BY_ID[of.get(w.inputs.key) ?? ''] : undefined; return b ? { ...w, inputs: { ...w.inputs, prep: { ...w.inputs.prep, genre: genreKnown(sim.player, b) } } } : w; };
}
/** The judge's exact whole of a piece for a performer. */
const judged = (w: WorkRecord, p: ReturnType<typeof performerOf>): number => { const e = replayAs(w, TASK_PROFILES[w.task]!, p); return e ? e.exact ?? e.overall : 0; };
/** Weighted to the latest as the advice weights its recent work: (i + 1) / n, over their sum. */
const weighted = (xs: readonly number[]): number => { const n = xs.length; const W = xs.reduce((t, _x, i) => t + (i + 1) / n, 0); return xs.reduce((t, x, i) => t + (x * (i + 1)) / n, 0) / (W || 1); };

/** F2 and F4, from the records: what the forecast should say it assumes. */
export function assumedByRecords(sim: Simulation): { pieces: number; complete: number; short: number; prepared: string[]; genreCount: number; genreShort: number; genreBetter: number } {
  const work = readWork(sim);
  const today = work.map(genreToday(sim));
  const complete = (w: WorkRecord) => Object.entries(w.inputs.prep).every(([k, x]) => k === 'genre' || x >= (w.inputs.required[k] ?? 1));
  const prepared = work.filter(heldOwn);
  const done = work.filter((w) => !heldOwn(w) && complete(w)).length;
  const g = work.map((w, i) => ({ was: w.inputs.prep.genre, now: today[i]!.inputs.prep.genre, need: w.inputs.required.genre ?? 1 })).filter((x) => x.was !== undefined);
  return { pieces: work.length, complete: done, short: work.length - done - prepared.length, prepared: prepared.map((w) => w.what), genreCount: g.length, genreShort: g.filter((x) => x.now! < x.need).length, genreBetter: g.filter((x) => x.now! > x.was! + 1e-12).length };
}

/** F1 and F4, from the records: what completing the own preparation of the pieces it held back most would bring, as you are now. */
export function preparationByRecords(sim: Simulation): number {
  const me = performerOf(sim, sim.player);
  return weighted(readWork(sim).map(genreToday(sim)).map((w) => (heldOwn(w) ? judged(preparedCopy(w), me) - judged(w, me) : 0)));
}

/** F5, from the records: each piece's own preparation complete, then its genre known in full, against it as taped, as you are now. */
export function attentionByRecords(sim: Simulation, training: number | undefined): { own: number; genre: number; verdict: 'both' | 'preparation' | 'training' | 'neither' } {
  const me = performerOf(sim, sim.player);
  const work = readWork(sim).map(genreToday(sim));
  const own = weighted(work.map((w) => judged(preparedCopy(w), me) - judged(w, me)));
  const genre = weighted(work.map((w) => { const p = preparedCopy(w); return p.inputs.prep.genre === undefined ? 0 : judged({ ...p, inputs: { ...p.inputs, prep: { ...p.inputs.prep, genre: Math.max(p.inputs.prep.genre, w.inputs.required.genre ?? 1) } } }, me) - judged(p, me); }));
  const p = own + genre >= 0.1;
  const t = training !== undefined && training >= 0.1;
  return { own, genre, verdict: p && t ? 'both' : p ? 'preparation' : t ? 'training' : 'neither' };
}

/**
 * F4, from the records: an input's forecast worked here apart, on the pieces the forecast should read as it should read
 * them (each as taped, those its own preparation held back most as prepared unless `asTaped`, each genre as known today),
 * with the game's own growth for the twenty sessions (`trained`): the input's own share on the pieces that read it, and
 * the days' discipline on every piece, weighted to the latest.
 */
export function forecastByRecords(sim: Simulation, id: string, asTaped = false): number {
  const work = readWork(sim).map(genreToday(sim)).map((w) => (!asTaped && heldOwn(w) ? preparedCopy(w) : w));
  const me = performerOf(sim, sim.player);
  const t = trained(sim, sim.player, id as never);
  const to = levelOf(sim, t, id as never);
  const d = levelOf(sim, t, 'discipline');
  const at = (x: string, v: number): ReturnType<typeof performerOf> => (isAbility(x as never) ? { ...me, ability: (y) => (y === x ? v : me.ability(y)) } : { ...me, technique: (y) => (y === x ? v : me.technique(y)) });
  const reads = (w: WorkRecord) => (isAbility(id as never) ? w.inputs.abilities[id as AbilityId] !== undefined : (w.inputs.techniques[id as never] ?? 0) > 0);
  const own = weighted(work.map((w) => (reads(w) ? judged(w, at(id, to)) - judged(w, me) : 0)));
  const days = d === me.ability('discipline') ? 0 : weighted(work.map((w) => judged(w, at('discipline', d)) - judged(w, me)));
  return own + days;
}

/**
 * F3: what twenty sessions brought, read under the forecast's own assumptions: the pieces it read, as it read them (as
 * taped, the ones its own preparation held back most as prepared, each genre as known when the forecast was made), worked
 * by the judge for the trained copy's abilities less the baseline copy's, weighted as the forecast weights them.
 */
export function likeForLike(before: Simulation, trainedCopy: Simulation, baseCopy: Simulation): number {
  const work = readWork(before).map(genreToday(before)).map((w) => (heldOwn(w) ? preparedCopy(w) : w));
  const a = performerOf(trainedCopy, trainedCopy.player);
  const b = performerOf(baseCopy, baseCopy.player);
  return weighted(work.map((w) => judged(w, a) - judged(w, b)));
}

/** F6: the growth twenty sessions bring in the forecast (`trained`) at an input's level, a third and two thirds of the way to full. */
export function growthLadder(sim: Simulation, id: string): { rungs: number[]; growth: number[]; ok: boolean } {
  const from = levelOf(sim, sim.player, id as never);
  const to = isAbility(id as never) ? abilityFull(sim, sim.player, id as AbilityId) : MASTERED;
  const rungs = [0, 1, 2].map((k) => from + ((to - from) * k) / 3);
  const growth = rungs.map((r) => { const x = clone(sim); setLevel(x, id, r); return levelOf(x, trained(x, x.player, id as never), id as never) - r; });
  const ok = growth.every((g, i) => i === 0 || (g <= growth[i - 1]! + 1e-12 && (rungs[i - 1]! >= 75 || g < growth[i - 1]!)));
  return { rungs, growth, ok };
}

const r1 = (x: number) => Math.round(x * 10) / 10;
const signed4 = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(4)}`;
/** What each part of a change is said as, read here apart from the advice's own table: a test fails if either moves. */
export const PART_WORDS: Readonly<Record<string, string>> = { work: 'the work it’s forecast on', genre: 'how well you know its genres', others: 'your other abilities and techniques', own: 'its own level', discipline: 'discipline' };

/**
 * S1 to S3 (advice-criteria.md): a read of the advice against a fresh forecast of the same save opened anew. Returns each
 * reason it's stale; none where it isn't.
 */
export function staleOf(sim: Simulation, recs: readonly Recommendation[]): string[] {
  const fresh = clone(sim);
  const f = trainingForecast(fresh, fresh.player);
  const exactOf = (x: Forecast | undefined) => (x ? x.exact ?? x.points : undefined);
  const passing = [...f].filter(([, x]) => (x.own ?? exactOf(x)!) >= 0.1);
  const out: string[] = [];
  const training = recs.filter((r) => r.forecast);
  const first = training[0];
  if (!first && passing.length) out.push(`S1: nothing named first where ${passing.length} pass the floor`);
  if (first) {
    const top = passing.reduce((m, [k, x]) => (exactOf(x)! > m.v ? { k, v: exactOf(x)! } : m), { k: '', v: -Infinity });
    const mine = exactOf(f.get(first.target));
    if (mine === undefined || mine < top.v - 1e-12) out.push(`S1: ${first.target} named first at ${mine}, behind ${top.k} at ${top.v}`);
  }
  for (const r of training) {
    const x = f.get(r.target);
    if (!x || (x.own ?? exactOf(x)!) < 0.1) out.push(`S2: ${r.target} named, and the fresh forecast leaves it out`);
    else if (Math.abs(exactOf(x)! - exactOf(r.forecast)!) > 1e-12) out.push(`S2: ${r.target} said at ${exactOf(r.forecast)}, fresh ${exactOf(x)}`);
  }
  if (first?.standing) {
    const now = exactOf(f.get(first.target));
    const level = r1(levelOf(fresh, fresh.player, first.target as never));
    const at = (x: number) => [2, 3, 4].map((k) => x.toFixed(k));
    if (now === undefined) out.push(`S3: ${first.target} has no forecast now`);
    else if (first.standing.includes(', the last time the advice was noted, ')) { if (!first.standing.includes('has nothing left to forecast on your recent work') && !at(now).some((s) => first.standing!.includes(`${first.label.toLowerCase()}’s forecast, ${s}, is now the larger`))) out.push(`S3: ${first.target}’s forecast now, ${now}, isn’t what the standing says`); }
    else {
      if (!first.standing.includes(`it’s still at ${level}`) && !first.standing.includes(` to ${level}, and its forecast from`)) out.push(`S3: ${first.target}’s level now, ${level}, isn’t what the standing says`);
      if (!at(now).some((s) => first.standing!.includes(` to ${s} a piece`))) out.push(`S3: ${first.target}’s forecast now, ${now}, isn’t what the standing says`);
    }
  }
  return out;
}

/**
 * H3 to H5 on one read: each change of the noted input's forecast the standing speaks of (since it was first given, and
 * since the latest note where that's later; for another now first, since it was first given), worked out by the engine
 * (`forecastChange`), with whether it rose, its residual, and whether the standing says its parts. Unexplained where the
 * residual is 1e-9 or more, where a rise can't be worked out, or where a rise isn't said in its parts.
 */
export function changesOf(sim: Simulation, recs: readonly Recommendation[]): { since: string; rose: boolean; by: number; residual?: number; parts?: Record<string, number>; said: boolean; unexplained: boolean }[] {
  const was = sim.player.experience?.advised;
  const first = recs.find((r) => r.forecast);
  if (!was || !first) return [];
  const f = trainingForecast(sim, sim.player, sim.player.work ?? [], [was.target]).get(was.target);
  const now = f ? f.exact ?? f.points : undefined;
  if (now === undefined) return [];
  const notes = was.target === first.target ? [['first', was.first] as const, ...(was.last.at > was.since ? [['last', was.last] as const] : [])] : [['first', was.first] as const];
  const out: ReturnType<typeof changesOf> = [];
  for (const [since, note] of notes) {
    const by = now - note.forecast;
    if (Math.abs(by) <= 1e-12) continue;
    const ch = forecastChange(sim, sim.player, was.target, note);
    const shown = ch ? Object.entries(ch.parts).filter(([, x]) => Math.abs(x) >= 0.00005) : [];
    // The standing's own sentence for this change: since it was first given, or since the latest note's date.
    const sentences = (first.standing ?? '').split(/(?<=\.) (?=What moved)/).filter((x) => x.startsWith('What moved'));
    const mine = sentences.find((x) => (since === 'first') === x.includes('since the advice first named it:'));
    const said = ch !== undefined && (shown.length === 0 && Math.abs(ch.residual) < 0.00005 ? true : mine !== undefined && shown.every(([k, x]) => mine.includes(`${PART_WORDS[k]}, ${signed4(x)}`)) && (Math.abs(ch.residual) < 0.00005 || mine.includes(`${signed4(-ch.residual)} the advice can’t trace`)));
    out.push({ since, rose: by > 1e-12, by, ...(ch ? { residual: ch.residual, parts: ch.parts } : {}), said, unexplained: ch ? Math.abs(ch.residual) >= 1e-9 || (by > 1e-12 && !said) : by > 1e-12 });
  }
  return out;
}
