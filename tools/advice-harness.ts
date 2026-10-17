/**
 * SLATE — the played harness F2-A reads (from 2026-10-16; docs/verification/advice-2026-10-16/criteria.md): a student who
 * tapes three briefs through the game's commands, and copies of the save that each train one input for twenty days.
 * `tools/advice.ts` runs it over the seeds; `tests/advice.test.ts` plays one case through it. From brief 10 (later on
 * 2026-10-16) it also builds F2-A10's cases (`buildCase`, below F2-A's own, which are unchanged): a band of ability, a
 * stage of the term, the 149 genres, and the realized gain over the work the advice reads (`worthOf`).
 */

import { createSave, loadSave } from '../src/engine';
import { newLifeConfig } from '../src/engine/world/bootstrap';
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY, instantFromZoned, zonedParts } from '../src/engine/core/time';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { ABILITY_DEFS, TECHNIQUES, type AbilityId } from '../src/engine/content/abilities';
import type { Skill } from '../src/engine/content/school';
import { BRIEFS, BRIEF_BY_ID } from '../src/engine/content/briefs';
import { exerciseFor } from '../src/engine/content/practice';
import { atFull, forecast } from '../src/engine/systems/briefs';
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

/** Twenty days, a session of the exercise each (or none, for the baseline), at the first free hour. */
export function live(sim: Simulation, exercise: string | undefined) {
  for (let d = 0; d < SESSIONS; d += 1) {
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

export interface CaseSpec { seed: string; set: 'tuning' | 'held-out'; design: 'F2-A' | 'F2-A10'; band?: Band; stage?: Stage }

/**
 * A seed's case: F2-A's adv-0 to 9 (tuning) and 10 to 39 (held out), as F2-A built them; adv-t-0 to 19 (tuning) and
 * adv-h-0 to 119 (held out), F2-A10's, their band and stage from their number (the checklist's `seeds`). Nothing in the
 * advice reads this: only the harness does, to build the case.
 */
export function caseOf(seed: string): CaseSpec | undefined {
  let m = /^adv-(\d+)$/.exec(seed);
  if (m && Number(m[1]) < 40) return { seed, set: Number(m[1]) < 10 ? 'tuning' : 'held-out', design: 'F2-A' };
  m = /^adv-t-(\d+)$/.exec(seed);
  if (m && Number(m[1]) < 20) { const n = Number(m[1]); return { seed, set: 'tuning', design: 'F2-A10', band: BAND_ORDER[n % 4]!, stage: STAGE_ORDER[Math.floor(n / 4) % 3]! }; }
  m = /^adv-h-(\d+)$/.exec(seed);
  if (m && Number(m[1]) < 120) { const n = Number(m[1]); return { seed, set: 'held-out', design: 'F2-A10', band: BAND_ORDER[Math.floor(n / 30)]!, stage: STAGE_ORDER[Math.floor((n % 30) / 10)]! }; }
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
 * The cases a `--cases` list names: `tuning`, `held-out`, a seed, or a range `adv-h-0..9`; an unknown seed throws. Kept in
 * `tools/advice.ts` until brief 11 (2026-10-17), and moved here unchanged with the refusal below, so a gate test reads
 * what the measure runs.
 */
export function casesOf(list: string): CaseSpec[] {
  const out: string[] = [];
  for (const item of list.split(',').map((x) => x.trim()).filter(Boolean)) {
    if (item === 'tuning') out.push(...Array.from({ length: 10 }, (_, i) => `adv-${i}`), ...Array.from({ length: 20 }, (_, i) => `adv-t-${i}`));
    else if (item === 'held-out') out.push(...Array.from({ length: 30 }, (_, i) => `adv-${i + 10}`), ...Array.from({ length: 120 }, (_, i) => `adv-h-${i}`));
    else {
      const m = /^(.*-)(\d+)\.\.(\d+)$/.exec(item);
      if (m) for (let n = Number(m[2]); n <= Number(m[3]); n += 1) out.push(`${m[1]}${n}`);
      else out.push(item);
    }
  }
  return out.map((seed) => { const c = caseOf(seed); if (!c) throw new Error(`${seed} is no case of F2-A or F2-A10`); return c; });
}

/** Why a run is refused: a held-out seed asked for without `--held-out` (F2-A10 (a): run once, on the code to be reported). */
export const heldOutRefusal = (specs: readonly CaseSpec[], heldOut: boolean): string | undefined => (specs.some((x) => x.set === 'held-out') && !heldOut ? 'A held-out seed is run only with --held-out, once, on the code to be reported.' : undefined);

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
