/**
 * SLATE — what to improve next, forecast (from 2026-10-16; `systems/experience.ts`'s `recommendations` reads it).
 *
 * Until then a recommendation ranked each input by what it had cost recent work, made whole, one dimension at a time
 * (`Limit.whole`), out of the three costliest limits a piece kept. Measured on 2026-10-16 that named the input whose
 * training paid most in 303 of 447 cases (criterion F2, docs/verification/advice-2026-10-16/README.md): an ability read by
 * three dimensions came second to one read by one; an ability with more room to full came first though its growth would
 * come slower; and anything past a piece's third limit was never seen.
 *
 * What it does from then: what held a piece back most (`chiefLimit`, the take's own line) and what to improve next are
 * two things. For what to improve next, each ability and technique the recent work read is forecast: the levels it would
 * reach after `ADVICE.sessions` hours of its own exercise, on the growth curve the hours really follow (`abilityGain`, its
 * diminishing returns, the discipline lift), and the recent work worked out again (`replayAs`) with you as you are now
 * and with that one input at the level it would reach. The difference, weighted to the latest, is what those hours are
 * worth. Every input the work read is a candidate, not only the costliest three. It reads the records and the person's
 * levels only: nothing is changed, and the same save gives the same advice.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { DEVELOPMENT, MASTERED, TECHNIQUES, type AbilityId } from '../content/abilities';
import { TIER, exerciseFor } from '../content/practice';
import type { Skill } from '../content/school';
import { TASK_PROFILES } from '../content/tasks';
import { abilityFull, abilityGain, abilityOf, isAbility } from './attributes';
import { RULESET } from '../content/tasks';
import { replayAs, type Performer, type WorkRecord } from './evaluation';

/**
 * `sessions`: the hours forecast, one session of an exercise a day for about three weeks (SLATE's horizon: long enough
 * that growth shows in a result, short enough that the advice is about now). `recent`: the pieces read, as
 * `recommendations` reads. `tie`: two options within this many points, or `tieShare` of the larger, are said to be about
 * as useful as each other; a result is rounded to a tenth, so a tenth apart is no difference anyone could act on.
 */
export const ADVICE = { sessions: 20, recent: 12, tie: 0.1, tieShare: 0.1 } as const;

export interface Forecast {
  /** The points a piece those hours would be worth, weighted to the latest of the recent work. */
  points: number;
  /** The level now, and what the hours would bring it to. */
  from: number;
  to: number;
  hours: number;
  /** How many of the recent pieces it was forecast on. */
  pieces: number;
}

/** A level after `sessions` hours of its own exercise at the matched tier, on a rested day: the growth curve, session by session. */
export function levelAfter(level: number, full: number, sessions: number, discipline: number, isDiscipline: boolean): number {
  const lift = isDiscipline ? 1 : 1 + (DEVELOPMENT.disciplineLift * (discipline - 50)) / 50;
  let at = level;
  for (let i = 0; i < sessions && at < full; i += 1) at = Math.min(full, at + abilityGain(at, full, { weight: TIER.matched, focus: 1, deliberate: true }) * lift);
  return at;
}

/** The candidates' forecasts for a person, from their recent work: what `ADVICE.sessions` hours of each would be worth. */
export function trainingForecast(sim: Simulation, person: Person, work: readonly WorkRecord[] = person.work ?? []): Map<string, Forecast> {
  const now: Performer = { ability: (id) => abilityOf(sim, person, id), full: (id) => abilityFull(sim, person, id), technique: (s) => person.craft?.[s] ?? 0 };
  return forecastFor(now, work);
}

/** The same, for any performer: the pure part, which tools and tests read with an actor of their own. */
export function forecastFor(now: Performer, work: readonly WorkRecord[]): Map<string, Forecast> {
  const latest = [...work].filter((w) => w.ruleset === RULESET && w.inputs.seed !== undefined && TASK_PROFILES[w.task]).sort((a, b) => a.at - b.at).slice(-ADVICE.recent);
  const out = new Map<string, Forecast>();
  if (!latest.length) return out;
  const weights = latest.map((_, i) => (i + 1) / latest.length);
  const W = weights.reduce((a, x) => a + x, 0);
  const base = latest.map((w) => replayAs(w, TASK_PROFILES[w.task]!, now)?.overall);
  const candidates = new Set<string>();
  for (const w of latest) {
    for (const a of Object.keys(w.inputs.abilities)) candidates.add(a);
    for (const [s, x] of Object.entries(w.inputs.techniques)) if ((x ?? 0) > 0 && TECHNIQUES.includes(s as Skill)) candidates.add(s);
  }
  for (const id of candidates) {
    if (!exerciseFor(id as AbilityId | Skill)) continue;
    const ability = isAbility(id as never);
    const from = ability ? now.ability(id as AbilityId) : now.technique(id as Skill);
    const full = ability ? now.full(id as AbilityId) : 100;
    if (from >= full) continue;
    const to = levelAfter(from, full, ADVICE.sessions, now.ability('discipline'), id === 'discipline');
    const after: Performer = ability ? { ...now, ability: (x) => (x === id ? to : now.ability(x)) } : { ...now, technique: (x) => (x === id ? to : now.technique(x)) };
    let points = 0;
    let pieces = 0;
    latest.forEach((w, i) => {
      const b = base[i];
      if (b === undefined) return;
      const reads = ability ? w.inputs.abilities[id as AbilityId] !== undefined : (w.inputs.techniques[id as Skill] ?? 0) > 0;
      if (!reads) return;
      const e = replayAs(w, TASK_PROFILES[w.task]!, after);
      if (!e) return;
      points += ((e.overall - b) * weights[i]!) / W;
      pieces += 1;
    });
    out.set(id, { points: Math.round(points * 100) / 100, from, to: Math.round(to * 10) / 10, hours: ADVICE.sessions, pieces });
  }
  return out;
}

/** Whether two forecasts are about as useful as each other: within `ADVICE.tie` points, or `tieShare` of the larger. */
export const tied = (a: number, b: number): boolean => Math.abs(a - b) <= Math.max(ADVICE.tie, ADVICE.tieShare * Math.max(Math.abs(a), Math.abs(b)));

void MASTERED;
