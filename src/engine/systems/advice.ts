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
 * reach after `ADVICE.sessions` hours of its own exercise, and the recent work worked out again (`replayAs`) with you as
 * you are now and with that one input at the level it would reach. The difference, weighted to the latest, is what those
 * hours are worth. Every input the work read is a candidate, not only the costliest three. It reads the records and the
 * person's levels only: nothing is changed, and the same save gives the same advice.
 *
 * From brief 10 (later on 2026-10-16; F2-A10, docs/verification/decisions-2026-10-16/criteria.md section 2), measured on
 * its tuning cases (docs/verification/decisions-2026-10-16/advice/tuning-before.json) before each change:
 * - **The engine's own growth** (`trained`): the twenty sessions are grown through `develop` on a scratch copy of the
 *   person, the function an hour of practice grows by, discipline kept once a day as the hour keeps it. Until then the
 *   advice ran its own copy of the curve (`levelAfter`, kept for a performer with no save), with discipline held where
 *   it stood, and twenty days of practice grow it: every realized gain came out about a quarter of a point over its
 *   forecast (0.28 on the thirty tuning cases), and 10 of 30 forecasts missed by more than 0.3 and a quarter.
 * - **What the days bring beside the input** (`Forecast.days`): discipline's growth over twenty days kept, said apart.
 *   The input's own share (`Forecast.own`) is what ranks, ties and passes the floor, so a technique past mastery isn't
 *   advised for the discipline any exercise would bring.
 * - **At full precision**: each replay's exact whole. Until then each was its shown tenth, so one piece's forecast came in
 *   tenths (0.7, 0.5, 0.3) and two inputs a hundredth apart could swap.
 * - **A take its own preparation held back, as prepared** (`asPrepared`): where a take's chief limit, what held it back
 *   most, is a step of its own preparation (the breakdown, the lines, the rehearsal, the way of playing rehearsed in) and
 *   not an ability, those steps complete; knowing the genre stays as it stood. Until then such a take, one taped cold,
 *   was forecast on dimensions its unlearned lines had scaled toward the floor; its preparation keeps its own advice, as
 *   it did ("that's preparation, not training"). Measured first on the tuning cases, every take read with every part
 *   complete named the best input to train in 18 of 30 where the takes as they stood named it in 28, and a take read so
 *   wherever its chief limit was any preparation, the genre's included, in 27, two of the five near mastery missed: the
 *   genre is short in nearly every take (0.08 of 0.9 in each of F2-A's; every chief limit of preparation in the thirty
 *   cases was the genre's, 37 of 37 pieces), it's what makes interpretation the weakest dimension, and familiarity with a
 *   genre isn't prepared piece by piece: the next take, in another genre, is short of it again. A take an ability held
 *   back most is read as it was.
 * - **Knowing the genre as it is now** (`genreNow`): a taped brief's genre part read from what you know of its genres
 *   today (`genreKnown`), as your abilities are, where until then it was what you knew when you taped it. A take is
 *   practice in its genre, so the genre is known better after the take than at it, and the next take in it reads it so;
 *   on the tuning case adv-t-14, one take, listening's twenty hours realized 0.46 where the forecast at the take's own
 *   knowing of the genre said 0.25, and imagination's 0.33 where it said 0.40.
 * - **A technique at full at `MASTERED`**, as the game's own `atFull` says: past it no piece reads more.
 * - **The work it read** (`Forecast.of`, `most`): how many of the recent pieces, and the piece it gains most on.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { DEVELOPMENT, MASTERED, TECHNIQUES, type AbilityId } from '../content/abilities';
import { PRACTICE, TIER, exerciseFor } from '../content/practice';
import type { Skill } from '../content/school';
import { TASK_PROFILES } from '../content/tasks';
import { abilityFull, abilityGain, abilityOf, develop, isAbility, levelOf } from './attributes';
import { RULESET } from '../content/tasks';
import { replayAs, type Performer, type WorkRecord } from './evaluation';
import { BRIEF_BY_ID } from '../content/briefs';
import { genreKnown } from './briefs';

/**
 * `sessions`: the hours forecast, one session of an exercise a day for about three weeks (SLATE's horizon: long enough
 * that growth shows in a result, short enough that the advice is about now). `recent`: the pieces read, as
 * `recommendations` reads. `tie`: two options within this many points, or `tieShare` of the larger, are said to be about
 * as useful as each other; a result is rounded to a tenth, so a tenth apart is no difference anyone could act on.
 * `focus` (from brief 10): the day's focus the hours are forecast at, an ordinary day's, readiness 80 (`focusOf`), the
 * engine's own reference for a session's gain; a rested morning gives more, a tired night less, the same for every
 * input, so the order doesn't move with the hour the advice is read at. All SLATE's.
 */
export const ADVICE = { sessions: 20, recent: 12, tie: 0.1, tieShare: 0.1, focus: 1 } as const;

export interface Forecast {
  /** The points a piece those hours would be worth, weighted to the latest of the recent work: the input's own and the days', to a hundredth. */
  points: number;
  /** The same at full precision (from brief 10): what's said is `points`, what's compared is this and `own`. The four fields from brief 10 are absent on a forecast built before it, which a test's own map may be. */
  exact?: number;
  /** The input's own share (from brief 10): the recent work worked out again with that input alone at the level it would reach. */
  own?: number;
  /** What the days of practice bring beside it (from brief 10): discipline, grown once for each day kept, on every recent piece, the input's own share added to it. */
  days?: number;
  /** The level now, and what the hours would bring it to. */
  from: number;
  to: number;
  hours: number;
  /** How many of the recent pieces it was forecast on, and of how many (`of`, from brief 10). */
  pieces: number;
  of?: number;
  /** The piece of the recent work it gains most on, and by how much (from brief 10): the work the advice read, by name. */
  most?: { what: string; points: number };
  /** How many of the recent pieces it read as prepared, their own preparation what held them back most (from brief 10). */
  prepared?: number;
}

/**
 * A level after `sessions` hours of its own exercise at the matched tier, on a rested day: the growth curve, session by
 * session, with discipline held where it is. For a performer with no save (`forecastFor`'s callers in tests and tools);
 * the player's own advice grows through the engine (`trained`, from brief 10).
 */
export function levelAfter(level: number, full: number, sessions: number, discipline: number, isDiscipline: boolean): number {
  const lift = isDiscipline ? 1 : 1 + (DEVELOPMENT.disciplineLift * (discipline - 50)) / 50;
  let at = level;
  for (let i = 0; i < sessions && at < full; i += 1) at = Math.min(full, at + abilityGain(at, full, { weight: TIER.matched, focus: ADVICE.focus, deliberate: true }) * lift);
  return at;
}

/**
 * A scratch copy of a person as `sessions` hours of one exercise would leave them (from brief 10): each a day, the
 * matched tier (`TIER.matched`), steady, at `ADVICE.focus`, grown through `develop` as `practiceHour` grows it, and then
 * discipline for the day kept (`PRACTICE.disciplineDay`), as the hour keeps it. Nothing of the save is touched: the
 * levels, the body's fitness and the development ledger are the copy's.
 */
export function trained(sim: Simulation, person: Person, id: AbilityId | Skill, sessions = ADVICE.sessions): Person {
  const p: Person = { ...person, craft: { ...person.craft! }, ...(person.attrs ? { attrs: { ...person.attrs } } : {}), wellbeing: { ...person.wellbeing }, development: { day: '', counts: {}, history: [] } };
  const e = exerciseFor(id)!;
  for (let i = 0; i < sessions; i += 1) {
    // A new day for each session: the same exercise isn't a repeat of yesterday's (`DEVELOPMENT.repeat`).
    p.development = { day: '', counts: {}, history: [] };
    develop(sim, p, e.trains, { weight: TIER.matched, focus: ADVICE.focus, deliberate: true, source: `practice:${e.id}` });
    develop(sim, p, 'discipline', { weight: PRACTICE.disciplineDay, focus: 1, deliberate: true, source: 'practice-day' });
  }
  return p;
}

/** A person's levels as a performer, read from where each is kept. */
const performerFor = (sim: Simulation, person: Person): Performer => ({ ability: (id) => abilityOf(sim, person, id), full: (id) => abilityFull(sim, person, id), technique: (s) => person.craft?.[s] ?? 0 });

/** The recent work a forecast reads (from brief 10, kept in one place): judged under today's rules, replayable, the latest `ADVICE.recent`. */
export const forecastWork = (work: readonly WorkRecord[]): WorkRecord[] => [...work].filter((w) => w.ruleset === RULESET && w.inputs.seed !== undefined && TASK_PROFILES[w.task]).sort((a, b) => a.at - b.at).slice(-ADVICE.recent);

/**
 * A piece of work as prepared (from brief 10): every step of its own preparation complete, a segment's own parts too,
 * knowing the genre as it stood (`ACROSS_PIECES`), so a forecast of what training is worth isn't scaled by what the
 * preparation held back, which has its own advice. Read where a step of its own preparation is what held a piece back
 * most (`heldByPreparation`).
 */
export function asPrepared(w: WorkRecord): WorkRecord {
  const full = (prep: Record<string, number>) => Object.fromEntries(Object.entries(prep).map(([k, x]) => [k, ACROSS_PIECES.includes(k) ? x : 1]));
  const piece = w.inputs.piece;
  return { ...w, inputs: { ...w.inputs, prep: full(w.inputs.prep), ...(piece?.own ? { piece: { ...piece, own: piece.own.map((o) => (o?.prep ? { ...o, prep: full(o.prep) } : o)) } } : {}) } };
}

/** The parts of preparation a piece doesn't prepare for itself (from brief 10): knowing the genre, built across pieces by study and work in it. */
export const ACROSS_PIECES: readonly string[] = ['genre'];

/** Whether a piece's chief limit, what held it back most (`chiefLimit`, its first), is a step of its own preparation and not an ability (from brief 10). */
export const heldByPreparation = (w: Pick<WorkRecord, 'limits'>): boolean => w.limits[0]?.kind === 'preparation' && !ACROSS_PIECES.includes(w.limits[0].what);

/**
 * Each kept take's knowing of its genre as it is now (from brief 10): the brief a piece was is found by its take's own key
 * in the brief's record (`BriefRecord.takes[].key`, the work's `inputs.key`), and its genre part read by `genreKnown`, the
 * function a take reads. A piece that isn't a brief's take, or whose take the record no longer keeps, stays as it was.
 */
export function genreNow(person: Person): (w: WorkRecord) => WorkRecord {
  const brief = new Map<string, string>();
  for (const [id, r] of Object.entries(person.briefs ?? {})) for (const t of r.takes) brief.set(t.key, id);
  return (w) => {
    const b = w.inputs.prep.genre !== undefined ? BRIEF_BY_ID[brief.get(w.inputs.key) ?? ''] : undefined;
    return b ? { ...w, inputs: { ...w.inputs, prep: { ...w.inputs.prep, genre: genreKnown(person, b) } } } : w;
  };
}

/** The candidates' forecasts for a person, from their recent work: what `ADVICE.sessions` hours of each would be worth, grown through the engine. */
export function trainingForecast(sim: Simulation, person: Person, work: readonly WorkRecord[] = person.work ?? []): Map<string, Forecast> {
  return forecastFor(performerFor(sim, person), work.map(genreNow(person)), (id) => {
    const p = trained(sim, person, id as AbilityId | Skill);
    return { to: levelOf(sim, p, id as AbilityId | Skill), discipline: abilityOf(sim, p, 'discipline') };
  });
}

/** What an input's hours bring it to, and discipline with it: the engine's (`trained`), or with no save the curve alone (`levelAfter`). */
export type Grow = (id: string, from: number, full: number) => { to: number; discipline: number };

/** Every input the recent work read (from brief 10): abilities, and techniques it read at all. */
export function readOf(latest: readonly WorkRecord[]): string[] {
  const ids = new Set<string>();
  for (const w of latest) {
    for (const a of Object.keys(w.inputs.abilities)) ids.add(a);
    for (const [s, x] of Object.entries(w.inputs.techniques)) if ((x ?? 0) > 0 && TECHNIQUES.includes(s as Skill)) ids.add(s);
  }
  return [...ids];
}

/** The level an input counts full at for the work: an ability's full, a technique's `MASTERED` (as `atFull` reads it). */
const workFull = (now: Performer, id: string) => (isAbility(id as never) ? now.full(id as AbilityId) : MASTERED);

/** The same, for any performer: the pure part, which tools and tests read with an actor of their own. */
export function forecastFor(now: Performer, work: readonly WorkRecord[], grow?: Grow): Map<string, Forecast> {
  const kept = forecastWork(work);
  const latest = kept.map((w) => (heldByPreparation(w) ? asPrepared(w) : w));
  const prepared = kept.filter(heldByPreparation).length;
  const out = new Map<string, Forecast>();
  if (!latest.length) return out;
  const weights = latest.map((_, i) => (i + 1) / latest.length);
  const W = weights.reduce((a, x) => a + x, 0);
  const exact = (w: WorkRecord, p: Performer) => { const e = replayAs(w, TASK_PROFILES[w.task]!, p); return e ? e.exact ?? e.overall : undefined; };
  const base = latest.map((w) => exact(w, now));
  const growth: Grow = grow ?? ((id, from, full) => ({ to: levelAfter(from, full, ADVICE.sessions, now.ability('discipline'), id === 'discipline'), discipline: now.ability('discipline') }));
  const set = (p: Performer, x: string, v: number): Performer => (isAbility(x as never) ? { ...p, ability: (y) => (y === x ? v : p.ability(y)) } : { ...p, technique: (y) => (y === x ? v : p.technique(y)) });
  // What the days' discipline brings, on every recent piece, whatever is trained (a day kept grows it the same for any
  // exercise): worked once for each level it reaches, and added to each input's own share.
  const daysAt = new Map<number, number>();
  const daysOf = (discipline: number): number => {
    if (discipline === now.ability('discipline')) return 0;
    if (!daysAt.has(discipline)) {
      const p = set(now, 'discipline', discipline);
      daysAt.set(discipline, latest.reduce((t, w, i) => { const b = base[i]; const e = b === undefined ? undefined : exact(w, p); return e === undefined ? t : t + ((e - b!) * weights[i]!) / W; }, 0));
    }
    return daysAt.get(discipline)!;
  };
  for (const id of readOf(latest).sort()) {
    if (!exerciseFor(id as AbilityId | Skill)) continue;
    const ability = isAbility(id as never);
    const from = ability ? now.ability(id as AbilityId) : now.technique(id as Skill);
    if (from >= workFull(now, id)) continue;
    const { to, discipline } = growth(id, from, ability ? now.full(id as AbilityId) : 100);
    const alone = set(now, id, to);
    let own = 0;
    let pieces = 0;
    let most: Forecast['most'];
    latest.forEach((w, i) => {
      const b = base[i];
      if (b === undefined) return;
      const reads = ability ? w.inputs.abilities[id as AbilityId] !== undefined : (w.inputs.techniques[id as Skill] ?? 0) > 0;
      if (!reads) return;
      const a = exact(w, alone);
      if (a === undefined) return;
      own += ((a - b) * weights[i]!) / W;
      pieces += 1;
      if (!most || a - b > most.points) most = { what: w.what, points: a - b };
    });
    const days = daysOf(discipline);
    const all = own + days;
    out.set(id, { points: Math.round(all * 100) / 100, exact: all, own, days, from, to: Math.round(to * 10) / 10, hours: ADVICE.sessions, pieces, of: latest.length, ...(most ? { most: { what: most.what, points: Math.round(most.points * 100) / 100 } } : {}), prepared });
  }
  return out;
}

/**
 * Whether the recent work is all at full where training reaches it (from brief 10): work kept under today's rules, and
 * every input it read that an exercise trains at full (an ability at its full, a technique at `MASTERED`). What's still
 * short is what no exercise trains: stamina (workouts) and discipline (practice on days running), which the advice names.
 */
export function atFullRead(sim: Simulation, person: Person): { all: boolean; short: AbilityId[] } {
  const latest = forecastWork(person.work ?? []);
  const now = performerFor(sim, person);
  const read = readOf(latest);
  const level = (id: string) => (isAbility(id as never) ? now.ability(id as AbilityId) : now.technique(id as Skill));
  const all = latest.length > 0 && read.filter((id) => exerciseFor(id as never)).every((id) => level(id) >= workFull(now, id));
  return { all, short: read.filter((id): id is AbilityId => !exerciseFor(id as never) && isAbility(id as never) && level(id) < workFull(now, id)) };
}

/** Whether two forecasts are about as useful as each other: within `ADVICE.tie` points, or `tieShare` of the larger. */
export const tied = (a: number, b: number): boolean => Math.abs(a - b) <= Math.max(ADVICE.tie, ADVICE.tieShare * Math.max(Math.abs(a), Math.abs(b)));
