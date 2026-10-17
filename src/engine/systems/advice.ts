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
 *
 * From brief 11 (2026-10-17; docs/verification/completion-2026-10-16/clarifications.md, F2-A10 (f) and (h)):
 * - **Preparation's figure, apart** (`Forecast.preparation`): what completing their own preparation would bring the pieces
 *   read as prepared, as you are now, weighted as the work is. Until then a take read as prepared was only counted
 *   (`prepared`), and what its preparation was worth was said nowhere beside training's; it's never added to training's.
 * - **One input's forecast at another discipline** (`forecastAtDiscipline`): what the advice reads to say how much of a
 *   change since it was first given is discipline's lift (`DEVELOPMENT.disciplineLift`) and how much the input's own.
 *
 * From brief 12 (2026-10-17; docs/verification/resolution-2026-10-17/advice-criteria.md, F2-A10 (f) and (h) as the owner
 * resolved them):
 * - **What a forecast assumes** (`assumedOf`): of the pieces it reads, how many were taped with their own preparation
 *   complete, how many short and read as taped, which are read as prepared and how far short each part was; and how many
 *   pieces' genres, read as known today, are short of complete or known better than when taped. Until then a take read
 *   as prepared was counted on the screen and named nowhere, and the genre read as known today was said only in the guide.
 * - **The counterfactual's own effect** (`trainingForecast`'s `asTaped`): an input's forecast with every piece read as
 *   taped, so the advice can say what reading a take as prepared did to the figure.
 * - **Preparation's figures beside training's** (`preparationWorth`): what each recent piece's own preparation complete,
 *   and then its genre known in full, would bring as you are now, against each as taped, for whether preparation,
 *   ability development or both deserve attention.
 * - **A forecast change, worked out in parts** (`forecastChange`): a note keeps the state it was made in (`stateOf`), so a
 *   change since is worked out one input at a time: the work read, knowing its genres, the other abilities and
 *   techniques, the input's own level, and discipline. What the parts don't account for is the residual, which is what
 *   an unexplained change is. Until then only discipline's part was worked out: adv-t-5's composure, still at 42, read
 *   "its forecast from 1.00 to 1.28" with nothing to say why.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { ABILITY_DEFS, DEVELOPMENT, MASTERED, TECHNIQUES, type AbilityId } from '../content/abilities';
import { PRACTICE, TIER, exerciseFor } from '../content/practice';
import type { Skill } from '../content/school';
import { TASK_PROFILES } from '../content/tasks';
import { CRAFT_ABILITY, abilityFull, abilityGain, abilityOf, attributesOf, develop, isAbility, levelOf } from './attributes';
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
  /**
   * What completing their own preparation would bring those pieces, as you are now, in points a piece weighted to the
   * latest as the rest is (from brief 11): preparation's figure, the same for every input, never part of `points`.
   */
  preparation?: number;
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
export function trained(sim: Simulation, person: Person, id: AbilityId | Skill, sessions: number = ADVICE.sessions): Person {
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

/** The candidates' forecasts for a person, from their recent work: what `ADVICE.sessions` hours of each would be worth, grown through the engine. `only` (from brief 11) forecasts those inputs alone. */
export function trainingForecast(sim: Simulation, person: Person, work: readonly WorkRecord[] = person.work ?? [], only?: readonly string[], asTaped = false): Map<string, Forecast> {
  return forecastIn(sim, person, performerFor(sim, person), work.map(genreNow(person)), only, asTaped);
}

/** The forecast for a person as given (a scratch copy where it's a state worked again), on work already read. `asTaped` (from brief 12): every piece as taped. */
function forecastIn(sim: Simulation, person: Person, now: Performer, work: readonly WorkRecord[], only?: readonly string[], asTaped = false): Map<string, Forecast> {
  return forecastFor(now, work, (id) => {
    const p = trained(sim, person, id as AbilityId | Skill);
    return { to: levelOf(sim, p, id as AbilityId | Skill), discipline: abilityOf(sim, p, 'discipline') };
  }, only, asTaped);
}

/**
 * One input's forecast as it would be at another discipline, everything else as it is (from brief 11): a scratch copy of
 * the person with discipline set there, forecast as `trainingForecast` forecasts. Nothing of the save is touched.
 */
export function forecastAtDiscipline(sim: Simulation, person: Person, id: string, discipline: number): Forecast | undefined {
  const p: Person = { ...person, ...(person.attrs ? { attrs: { ...person.attrs } } : {}), craft: person.craft ? { ...person.craft } : person.craft, wellbeing: { ...person.wellbeing } };
  setAbility(sim, p, 'discipline', discipline);
  return trainingForecast(sim, p, p.work ?? [], [id]).get(id);
}

/** An ability set where it's kept, on a scratch copy (as `grown` sets it). */
function setAbility(sim: Simulation, p: Person, id: AbilityId, v: number): void {
  const skill = CRAFT_ABILITY[id];
  if (skill) p.craft![skill] = v;
  else if (id === 'stamina') p.wellbeing.fitness = v;
  else (attributesOf(sim, p) as unknown as Record<string, number>)[id] = v;
}

/** A scratch copy of a person: what's set on it never reaches the save. */
const scratchOf = (person: Person): Person => ({ ...person, ...(person.attrs ? { attrs: { ...person.attrs } } : {}), craft: person.craft ? { ...person.craft } : person.craft, wellbeing: { ...person.wellbeing } });

/**
 * The state a forecast was made in, as a note keeps it (from brief 12): every ability and technique, stamina's full (which
 * age sets), how well each genre was known (the better of studied and worked in, as `genreKnown` reads it, where it was
 * known at all), and the latest piece of work, by its key. Everything a forecast reads but the records themselves, which
 * stay in the save.
 */
// Its genre knowledge is `genreKnowledge`, not `genres`, which on a person is the genres they love and only enjoyment
// reads (tests/cohesion.test.ts).
export interface ForecastState { levels: Record<string, number>; staminaFull: number; genreKnowledge: Record<string, number>; key?: string }

/** The inputs a state keeps: every ability and every technique. */
const STATE_INPUTS: readonly string[] = [...ABILITY_DEFS.map((d) => d.id), ...TECHNIQUES];

export function stateOf(sim: Simulation, person: Person): ForecastState {
  const genreKnowledge: Record<string, number> = {};
  for (const [g, x] of Object.entries(person.engagement?.byGenre ?? {})) { const v = Math.max(x.familiarity ?? 0, x.practice ?? 0); if (v > 0) genreKnowledge[g] = v; }
  const key = [...(person.work ?? [])].sort((a, b) => a.at - b.at).at(-1)?.inputs.key;
  return { levels: Object.fromEntries(STATE_INPUTS.map((id) => [id, levelOf(sim, person, id as AbilityId | Skill)])), staminaFull: abilityFull(sim, person, 'stamina'), genreKnowledge, ...(key ? { key } : {}) };
}

/** What a change in a forecast is made of, one input at a time from the noted state to now (from brief 12). */
export type ChangePart = 'work' | 'genre' | 'others' | 'own' | 'discipline';
export const CHANGE_ORDER: readonly ChangePart[] = ['work', 'genre', 'others', 'own', 'discipline'];

/**
 * One input's forecast with the parts named in `now` as they are, and the rest as the state kept them (from brief 12): a
 * scratch copy of the person with the kept levels set, stamina's full as kept, the work read up to the kept latest piece,
 * and each genre known as kept. Undefined where the work then is no longer kept, or the input has no forecast.
 */
function forecastAs(sim: Simulation, person: Person, id: string, s: ForecastState, now: ReadonlySet<ChangePart>): number | undefined {
  const p = scratchOf(person);
  for (const [x, v] of Object.entries(s.levels)) {
    const part: ChangePart = x === id ? 'own' : x === 'discipline' ? 'discipline' : 'others';
    if (now.has(part)) continue;
    if (isAbility(x as never)) setAbility(sim, p, x as AbilityId, v); else p.craft = { ...p.craft!, [x]: v };
  }
  const performer = performerFor(sim, p);
  const at = now.has('others') ? performer : { ...performer, full: (x: AbilityId) => (x === 'stamina' ? s.staminaFull : performer.full(x)) };
  const sorted = [...(person.work ?? [])].sort((a, b) => a.at - b.at);
  const upTo = s.key === undefined ? -1 : sorted.findIndex((w) => w.inputs.key === s.key);
  if (!now.has('work') && upTo < 0) return undefined;
  const work = now.has('work') ? sorted : sorted.slice(0, upTo + 1);
  // Knowing each genre as kept: a person whose engagement is the kept one, so `genreKnown` reads it as it read it then.
  const known: Person = now.has('genre') ? p : { ...p, engagement: { byGenre: Object.fromEntries(Object.entries(s.genreKnowledge).map(([g, v]) => [g, { familiarity: v, practice: v }])) } };
  const f = forecastIn(sim, p, at, work.map(genreNow(known)), [id]).get(id);
  return f ? f.exact ?? f.points : undefined;
}

/**
 * A forecast's change since a note, in parts (from brief 12; advice-criteria.md, H3 to H5): from the state the note kept to
 * the present, one input at a time in `CHANGE_ORDER` (the work read, knowing its genres, the other abilities and
 * techniques with stamina's full, the input's own level, and discipline last, so its part is the forecast now less the
 * forecast now at the discipline it had, as brief 11 worked it). A part whose input didn't change is exactly 0. The parts
 * sum to the change from the forecast worked again from the kept state (`then`); `residual` is the forecast the note kept
 * less that one, what nothing the forecast reads accounts for. Undefined where the note kept no state (one from before
 * brief 12), the work it read is no longer kept, or the input has no forecast now.
 */
export interface ForecastChange { noted: number; then: number; now: number; parts: Record<ChangePart, number>; residual: number }
export function forecastChange(sim: Simulation, person: Person, id: string, noted: { forecast: number; state?: ForecastState }): ForecastChange | undefined {
  const s = noted.state;
  if (!s) return undefined;
  const steps: number[] = [];
  const now = new Set<ChangePart>();
  for (let k = 0; k <= CHANGE_ORDER.length; k += 1) {
    const x = forecastAs(sim, person, id, s, now);
    if (x === undefined) return undefined;
    steps.push(x);
    if (k < CHANGE_ORDER.length) now.add(CHANGE_ORDER[k]!);
  }
  const parts = Object.fromEntries(CHANGE_ORDER.map((part, k) => [part, steps[k + 1]! - steps[k]!])) as Record<ChangePart, number>;
  return { noted: noted.forecast, then: steps[0]!, now: steps.at(-1)!, parts, residual: noted.forecast - steps[0]! };
}

/**
 * What every input's forecast assumes of the pieces it reads (from brief 12; advice-criteria.md, F2 and F4): of their own
 * preparation (every part but knowing the genre, against what completes it), how many were complete as taped, how many
 * short and read as taped, and each read as prepared, its own preparation what held it back most, with how far each part
 * fell short; of knowing their genres, read as known today, how many are short of complete and how many are known better
 * than when taped (of the pieces with a genre part).
 */
export interface Assumed {
  pieces: number;
  complete: number;
  short: number;
  prepared: { what: string; key: string; task: string; parts: { part: string; share: number }[] }[];
  genreCount: number;
  genreShort: number;
  genreBetter: number;
}
export function assumedOf(person: Person): Assumed | undefined {
  const kept = forecastWork(person.work ?? []);
  if (!kept.length) return undefined;
  const today = kept.map(genreNow(person));
  const own = (w: WorkRecord) => Object.entries(w.inputs.prep).filter(([k]) => !ACROSS_PIECES.includes(k)).map(([part, x]) => ({ part, share: Math.min(1, (w.inputs.required[part] ?? 1) > 0 ? x / (w.inputs.required[part] ?? 1) : 1) }));
  const prepared = kept.filter(heldByPreparation).map((w) => ({ what: w.what, key: w.inputs.key, task: w.task, parts: own(w).filter((x) => x.share < 1) }));
  const complete = kept.filter((w) => !heldByPreparation(w) && own(w).every((x) => x.share >= 1)).length;
  const withGenre = kept.map((w, i) => ({ was: w.inputs.prep.genre, now: today[i]!.inputs.prep.genre, need: w.inputs.required.genre ?? 1 })).filter((x) => x.was !== undefined && x.now !== undefined);
  return { pieces: kept.length, complete, short: kept.length - complete - prepared.length, prepared, genreCount: withGenre.length, genreShort: withGenre.filter((x) => x.now! < x.need).length, genreBetter: withGenre.filter((x) => x.now! > x.was! + 1e-12).length };
}

/**
 * What preparation would bring the recent work, as you are now (from brief 12; advice-criteria.md, F5): each piece with its
 * own preparation complete against it as taped (`own`), and then its genre known in full beside that (`genre`), each
 * piece's genre read as known today, weighted to the latest as a forecast is. In points a piece, as training's forecast is.
 */
export function preparationWorth(sim: Simulation, person: Person): { own: number; genre: number } | undefined {
  const latest = forecastWork(person.work ?? []).map(genreNow(person));
  if (!latest.length) return undefined;
  const me = performerFor(sim, person);
  const exact = (w: WorkRecord) => { const e = replayAs(w, TASK_PROFILES[w.task]!, me); return e ? e.exact ?? e.overall : undefined; };
  const W = latest.reduce((t, _w, i) => t + (i + 1) / latest.length, 0);
  let own = 0;
  let genre = 0;
  latest.forEach((w, i) => {
    const prepared = asPrepared(w);
    const known = prepared.inputs.prep.genre === undefined ? prepared : { ...prepared, inputs: { ...prepared.inputs, prep: { ...prepared.inputs.prep, genre: Math.max(prepared.inputs.prep.genre, w.inputs.required.genre ?? 1) } } };
    const [a, b, c] = [exact(w), exact(prepared), exact(known)];
    if (a === undefined || b === undefined || c === undefined) return;
    own += ((b - a) * (i + 1)) / latest.length / W;
    genre += ((c - b) * (i + 1)) / latest.length / W;
  });
  return { own, genre };
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

/** The same, for any performer: the pure part, which tools and tests read with an actor of their own. `only` (from brief 11): those inputs alone. */
export function forecastFor(now: Performer, work: readonly WorkRecord[], grow?: Grow, only?: readonly string[], asTaped = false): Map<string, Forecast> {
  const kept = forecastWork(work);
  // `asTaped` (from brief 12): every piece as its record keeps it, the counterfactual the advice says beside the forecast.
  const held = (w: WorkRecord) => !asTaped && heldByPreparation(w);
  const latest = kept.map((w) => (held(w) ? asPrepared(w) : w));
  const prepared = kept.filter(held).length;
  const out = new Map<string, Forecast>();
  if (!latest.length) return out;
  const weights = latest.map((_, i) => (i + 1) / latest.length);
  const W = weights.reduce((a, x) => a + x, 0);
  const exact = (w: WorkRecord, p: Performer) => { const e = replayAs(w, TASK_PROFILES[w.task]!, p); return e ? e.exact ?? e.overall : undefined; };
  const base = latest.map((w) => exact(w, now));
  // Preparation's figure (from brief 11): each piece read as prepared, as prepared against as it was taped, both as you
  // are now and weighted as the rest; said apart, and never in what training brings.
  const preparation = prepared ? kept.reduce((t, w, i) => { if (!held(w)) return t; const a = base[i]; const b = exact(w, now); return a === undefined || b === undefined ? t : t + ((a - b) * weights[i]!) / W; }, 0) : undefined;
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
    if (only && !only.includes(id)) continue;
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
    out.set(id, { points: Math.round(all * 100) / 100, exact: all, own, days, from, to: Math.round(to * 10) / 10, hours: ADVICE.sessions, pieces, of: latest.length, ...(most ? { most: { what: most.what, points: Math.round(most.points * 100) / 100 } } : {}), prepared, ...(preparation !== undefined ? { preparation } : {}) });
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
