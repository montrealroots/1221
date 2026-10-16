/**
 * SLATE — the actor's abilities (from the connected attributes of 2026-10-09).
 *
 * Twelve abilities on one 0 to 100 scale, each with exactly one place it's
 * kept, so it is never counted twice wherever it's shown:
 *
 * - **Emotional Depth**, **Memory**, **Vocal Expression** and **Physical
 *   Expression** are the craft's Emotional Access, Memorization, Voice and
 *   Movement (`person.craft`), which the classes, the plays and the casting
 *   already read. They're presented as abilities and kept off the list of
 *   learned techniques, so voice and movement aren't counted once as an
 *   ability and again as a technique.
 * - **Presence** and **Composure** are where they were (`person.attrs`).
 * - **Listening And Responsiveness**, **Imagination**, **Focus**,
 *   **Adaptability** and **Discipline** are new, kept beside them
 *   (`person.attrs`): each drawn for a new life from what's already true of
 *   it, and given to an older save by the same rule (`migrate`, 92).
 * - **Stamina** is the body's fitness (`wellbeing.fitness`), built by
 *   workouts and lost without them by the body's own rules
 *   (`systems/life.ts`); it counts as full at the most a body that age can
 *   be brought to (`abilityFull`, `ceilingAt`), 99.3 at twenty-five.
 *
 * The other seventeen craft skills are learned techniques (`TECHNIQUES` in
 * `content/abilities.ts`). An ability is a capacity that underlies many
 * tasks; a technique is the method of one kind of work. Neither is
 * preparation for a task (an assignment's parts, a part's lines), a condition
 * of the day (readiness, illness, an injury, nerves), or the quality of work
 * shown, each of which is kept apart (`systems/evaluation.ts`).
 *
 * How each grows (`growAbility`): a session's gain falls as the level rises,
 * the power law of practice; ordinary classes level off at the student's own
 * reach (`CEILING` in `systems/school.ts`), and deliberate, effortful
 * practice keeps going past it to 100, more slowly the higher it goes. The
 * same kind of practice repeated in one day gives less each time
 * (`DEVELOPMENT.repeat`), so it can't be farmed, and nothing is lost by
 * resting. The sources are in `content/abilities.ts`.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { clamp } from '../core/rng';
import { personalityOf } from './personality';
import { ABILITY_DEFS, ABILITY_KIN, DEVELOPMENT, STEP_SPEED, type AbilityId } from '../content/abilities';
import type { Skill } from '../content/school';
import { zonedParts, type Instant } from '../core/time';
import { takeTheHouse } from './enjoyment';
import { ceilingAt } from '../content/lifespan';
import { yearsSince } from './life';

export type { AbilityId } from '../content/abilities';

export interface Attributes {
  /** 0 to 100. Drawn once; grown by nights in front of a house. */
  presence: number;
  /** 0 to 100. Nerves held; grows with every performance. */
  composure: number;
  /** The six kept here from 2026-10-09 (`content/abilities.ts`): optional for a save from before, which `attributesOf` fills. */
  listening?: number;
  imagination?: number;
  focus?: number;
  adaptability?: number;
  discipline?: number;
}

export type AttributeKey = keyof Attributes;

/** SLATE's estimates, each named where it's read. */
export const ATTRIBUTES = {
  /** Presence drawn for a student the faculty chose first: 55 to 80, most near the middle. */
  presence: { from: 55, span: 25 },
  /** Composure at the start, by emotional stability (0-100): 25 to 60. */
  composureStart: { base: 25, perStability: 0.35 },
  /** Nerves before an event, by its weight: the stress added at composure 0. Until 2026-10-09 nerves took up to 0.18 off a night's focus too (`nerves`). */
  eventWeight: { performance: 6 },
  /** Composure a performance adds, as a share of what's left to 100. It was 0.012 until 2026-09-28, when all twelve of a batch of played lives reached 99 or 100 by the second year of work. */
  composureGain: { performance: 0.005 },
  /** Presence a performance adds, as a share of what's left: slow. */
  presenceGain: 0.0015,
} as const;

/** The abilities kept in the craft, by the craft skill that holds each. */
export const CRAFT_ABILITY: Readonly<Partial<Record<AbilityId, Skill>>> = { emotionalDepth: 'emotion', memory: 'memorization', vocal: 'voice', physical: 'movement' };

/**
 * A classmate's presence, drawn once as the player's is and kept on them.
 * Until 2026-09-28 every classmate was read at an ordinary 50, below the
 * least a Yale actor's draw can be.
 */
export function classmatePresence(sim: Simulation, person: Person, i: number): number {
  const mate = person.school?.classmates[i];
  if (!mate) return 50;
  return presenceFor(sim, person, mate, `mate-${i}`);
}

/** A classmate's presence under a draw key of its own: the first class's by place, a later class's by its year (`drawCohort`). */
export function presenceFor(sim: Simulation, person: Person, mate: { presence?: number }, key: string): number {
  if (mate.presence === undefined) {
    const rng = sim.rng('attributes.presence', person.id, key);
    mate.presence = Math.round((ATTRIBUTES.presence.from + ATTRIBUTES.presence.span * (rng.next() + rng.next()) / 2) * 10) / 10;
  }
  return mate.presence;
}

const r1 = (x: number) => Math.round(x * 10) / 10;
const mean = (...xs: (number | undefined)[]) => { const v = xs.filter((x): x is number => typeof x === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined; };

/**
 * The six new abilities, from what is already true of somebody, for a new life and an older save alike
 * (`ABILITY_DEFS[].derivedFrom` says each rule): no past experience invented. Deterministic, so a save opened twice
 * gets the same.
 */
export function derivedAbilities(person: Person): Required<Pick<Attributes, 'listening' | 'imagination' | 'focus' | 'adaptability' | 'discipline'>> {
  const c = person.craft;
  const fallback = 50;
  const conscientious = person.personality?.conscientiousness ?? 50;
  const kin = (id: AbilityId) => r1(mean(...(ABILITY_KIN[id] ?? []).map((k) => c?.[k])) ?? fallback);
  return {
    listening: kin('listening'),
    imagination: kin('imagination'),
    focus: kin('focus'),
    adaptability: kin('adaptability'),
    discipline: r1(clamp(30 + conscientious * 0.5, 0, 100)),
  };
}

/** A person's attributes, drawn the first time they're asked for, and the six new ones filled where missing. */
export function attributesOf(sim: Simulation, person: Person): Required<Attributes> {
  if (!person.attrs) {
    const rng = sim.rng('attributes.presence', person.id, 'innate');
    const presence = ATTRIBUTES.presence.from + ATTRIBUTES.presence.span * (rng.next() + rng.next()) / 2;
    const stability = person.personality?.emotionalStability ?? 50;
    person.attrs = {
      presence: r1(presence),
      composure: r1(ATTRIBUTES.composureStart.base + ATTRIBUTES.composureStart.perStability * stability),
    };
  }
  const a = person.attrs;
  if (a.listening === undefined || a.imagination === undefined || a.focus === undefined || a.adaptability === undefined || a.discipline === undefined) {
    const d = derivedAbilities(person);
    a.listening ??= d.listening; a.imagination ??= d.imagination; a.focus ??= d.focus;
    a.adaptability ??= d.adaptability; a.discipline ??= d.discipline;
  }
  return a as Required<Attributes>;
}

/** An ability's level, 0 to 100, from the one place it's kept. */
export function abilityOf(sim: Simulation, person: Person, id: AbilityId): number {
  const skill = CRAFT_ABILITY[id];
  if (skill) return person.craft?.[skill] ?? 0;
  if (id === 'stamina') return person.wellbeing.fitness;
  return attributesOf(sim, person)[id as keyof Attributes] as number;
}

/** The level at which an ability counts as full: 100, and for stamina the most a body this age can be brought to (`ceilingAt`). */
export function abilityFull(sim: Simulation, person: Person, id: AbilityId): number {
  if (id !== 'stamina') return 100;
  return ceilingAt(yearsSince(person.birthInstant, sim.now)).fitness;
}

/** Every ability, for a panel or a calculation. */
export function abilitiesOf(sim: Simulation, person: Person): Record<AbilityId, number> {
  return Object.fromEntries(ABILITY_DEFS.map((d) => [d.id, abilityOf(sim, person, d.id)])) as Record<AbilityId, number>;
}

/**
 * Grows an attribute by a share of what's left to full when `share` is set, or plain points otherwise, through `grown`
 * (from 2026-10-16): discipline's lift, half again for the same source the same day, and the history. Until then it
 * set the level directly and only recorded it (from 2026-10-10: a house's nerves grew composure and presence unrecorded
 * before that), so two houses in a day grew composure twice in full, and discipline never reached it.
 */
export function nudge(sim: Simulation, person: Person, key: AttributeKey, amount: number, share: boolean, source: string): number {
  return grown(sim, person, key, (level, full) => (share ? (full - level) * amount : amount), source);
}

/** Where development is counted against farming (`DEVELOPMENT.repeat`), the day it's for, and what moved lately. */
export interface DevelopmentLedger {
  day: string;
  /** Sessions of each source on each ability or technique today. */
  counts: Record<string, number>;
  /** The latest changes, newest last: what moved, by how much, from what, and when (bounded). */
  history: { at: number; id: string; delta: number; source: string }[];
  /**
   * The ids of actions already applied (from 2026-10-10, the latest `ACTIONS_KEPT`): an hour sent again with the same
   * `actionId`, a retry after a lost answer, is refused rather than lived twice.
   */
  applied?: string[];
  /** Deliberate practice: today's hours, the days practised, and the last (`systems/practice.ts`). */
  practice?: { day: string; hours: number; days: number; last: string };
  /**
   * The last workout (from 2026-10-10), or from 2026-10-16 the last class that trains the body as hard (`classTrains`,
   * systems/life.ts): fitness holds for `FITNESS.heldDays` after it (`settleTheBody`). A save from before has none, and
   * detrains as it did until its first.
   */
  workout?: { at: number };
}

export function developmentOf(person: Person): DevelopmentLedger {
  person.development ??= { day: '', counts: {}, history: [] };
  return person.development;
}

/** One growth event's terms: how much it bears, how ready they came, whether it's deliberate practice, and its source. */
export interface GrowthTerms { weight: number; focus: number; deliberate: boolean; source: string }

/** The gain a session gives at a level: ordinary practice toward the reach, deliberate practice past it to 100. */
export function abilityGain(level: number, reach: number, t: Pick<GrowthTerms, 'weight' | 'focus' | 'deliberate'>): number {
  const d = DEVELOPMENT;
  const ordinary = d.sessionGain * t.weight * t.focus * Math.max(0, 1 - level / reach) ** d.exponent;
  if (!t.deliberate) return ordinary;
  const past = d.sessionGain * d.deliberate * t.weight * t.focus * Math.max(d.floor, 1 - level / 100) * (level < 100 ? 1 : 0);
  return Math.max(ordinary, past);
}

const dayAt = (sim: Simulation, at: Instant = sim.now) => { const p = zonedParts(at, sim.homeZone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };

/** Today's count of a source on an id, advanced by one: the same practice again today gives less (`DEVELOPMENT.repeat`). */
export function repeatsToday(sim: Simulation, person: Person, key: string): number {
  const led = developmentOf(person);
  const day = dayAt(sim);
  if (led.day !== day) { led.day = day; led.counts = {}; }
  const n = led.counts[key] ?? 0;
  led.counts[key] = n + 1;
  return n;
}

/**
 * The count `repeatsToday` would give for the day an instant falls in, counting nothing (from 2026-10-12): what a
 * preview reads, where `repeatsToday` would count the preview as a repeat.
 */
export function repeatsSoFar(sim: Simulation, person: Person, key: string, at: Instant = sim.now): number {
  const led = person.development;
  return led && led.day === dayAt(sim, at) ? led.counts[key] ?? 0 : 0;
}

/** How many applied action ids are kept. */
export const ACTIONS_KEPT = 200;

/** Why an action can't be applied again, or nothing; and once it's applied (`markApplied`), it never is again. */
export function alreadyApplied(person: Person, actionId: unknown): string | undefined {
  if (typeof actionId !== 'string' || !actionId) return undefined;
  return developmentOf(person).applied?.includes(actionId) ? 'That was already done.' : undefined;
}
export function markApplied(person: Person, actionId: unknown): void {
  if (typeof actionId !== 'string' || !actionId) return;
  const led = developmentOf(person);
  (led.applied ??= []).push(actionId);
  if (led.applied.length > ACTIONS_KEPT) led.applied.splice(0, led.applied.length - ACTIONS_KEPT);
}

/** Records a change, for the profile's history and an ability's look. */
export function recordDevelopment(sim: Simulation, person: Person, id: string, delta: number, source: string): void {
  if (delta <= 0) return;
  const led = developmentOf(person);
  led.history.push({ at: sim.now, id, delta: Math.round(delta * 1000) / 1000, source });
  if (led.history.length > DEVELOPMENT.historyKept) led.history.splice(0, led.history.length - DEVELOPMENT.historyKept);
}

/** What development reaches: an ability, or a technique kept in the craft. */
export type Target = AbilityId | Skill;

const ABILITY_IDS = new Set<string>(ABILITY_DEFS.map((d) => d.id));
/** The craft skills kept as abilities, back to the ability each is. */
const SKILL_ABILITY: Readonly<Partial<Record<Skill, AbilityId>>> = Object.fromEntries(Object.entries(CRAFT_ABILITY).map(([a, s]) => [s, a]));
/** An ability by its id, or a craft skill named by the ability it is: the one name a change is recorded under. */
export const targetId = (t: Target): Target => SKILL_ABILITY[t as Skill] ?? t;
export const isAbility = (t: Target): t is AbilityId => ABILITY_IDS.has(t);

/** A target's level, from the one place it's kept. */
export function levelOf(sim: Simulation, person: Person, t: Target): number {
  const id = targetId(t);
  return isAbility(id) ? abilityOf(sim, person, id) : person.craft?.[id as Skill] ?? 0;
}

/**
 * Grows an ability or a technique from a session, once, and records it: the gain by the level, the reach and the
 * terms, less for the same source again today, a little more for the disciplined; never past full. Ordinary work
 * (a class, a step of preparation, a call) is capped at the reach the caller names (a craft skill's `ceilingOf`);
 * deliberate practice goes on past it. Returns what it moved.
 */
export function develop(sim: Simulation, person: Person, target: Target, terms: GrowthTerms, reach = 100): number {
  return grown(sim, person, target, (level, full) => abilityGain(level, Math.min(reach, full), terms), terms.source);
}

/**
 * What a session's raw gain comes to, once: the discipline lift (not on discipline itself), half again for each earlier
 * session of the same source on the same target today (`n`), and never past full. One formula for the growth itself
 * (`grown`) and for what a preview says it will be (`previewGrowth`, from 2026-10-16), so the two can't drift apart.
 */
export function gainAfter(sim: Simulation, person: Person, target: Target, raw: (level: number, full: number) => number, n: number): number {
  const id = targetId(target);
  const level = levelOf(sim, person, id);
  const full = isAbility(id) ? abilityFull(sim, person, id) : 100;
  if (level >= full) return 0;
  const disciplined = id === 'discipline' ? 1 : 1 + DEVELOPMENT.disciplineLift * (abilityOf(sim, person, 'discipline') - 50) / 50;
  const g = raw(level, full) * disciplined * DEVELOPMENT.repeat ** n;
  if (g <= 0) return 0;
  // Arriving at full sets it exactly, so floating point never leaves it a hair under (from 2026-10-10).
  return g >= full - level ? full - level : g;
}

/**
 * The one way anything grows (from 2026-10-16): today's count of the source on the target advanced (`repeatsToday`),
 * the gain worked out by `gainAfter`, set in the one place the target is kept, and recorded. `develop` grows by the
 * practice curve; a house's nerves grow composure and presence by a share of what's left (`nudge`). Until 2026-10-16
 * a class's, a night's, a call's and a lab's craft grew through `grow` in `systems/school.ts`, and the nerves through
 * `nudge` alone: neither halved a repeat the same day, and neither read discipline.
 */
export function grown(sim: Simulation, person: Person, target: Target, raw: (level: number, full: number) => number, source: string): number {
  const id = targetId(target);
  const n = repeatsToday(sim, person, `${id}<${source}`);
  const gain = gainAfter(sim, person, id, raw, n);
  if (gain <= 0) return 0;
  const level = levelOf(sim, person, id);
  const full = isAbility(id) ? abilityFull(sim, person, id) : 100;
  const next = gain >= full - level ? full : level + gain;
  const skill = isAbility(id) ? CRAFT_ABILITY[id] : (id as Skill);
  if (skill) person.craft![skill] = next;
  else if (id === 'stamina') person.wellbeing.fitness = next;
  else (attributesOf(sim, person) as unknown as Record<string, number>)[id] = next;
  recordDevelopment(sim, person, id, next - level, source);
  return next - level;
}

/**
 * What `develop` would give now, counting nothing (from 2026-10-16): the same formula, with today's sessions of the source
 * so far (`repeatsSoFar`, at `at`, the instant the session would land). What a practice control shows before the hour.
 */
export function previewGrowth(sim: Simulation, person: Person, target: Target, terms: GrowthTerms, reach = 100, at: Instant = sim.now): number {
  const id = targetId(target);
  return gainAfter(sim, person, id, (level, full) => abilityGain(level, Math.min(reach, full), terms), repeatsSoFar(sim, person, `${id}<${terms.source}`, at));
}

/** An ability grown (`develop`), by its id. */
export const growAbility = (sim: Simulation, person: Person, id: AbilityId, terms: GrowthTerms, reach = 100): number => develop(sim, person, id, terms, reach);

export type Event = keyof typeof ATTRIBUTES.eventWeight;

/**
 * Nerves before an event: stress added, by the event's weight, how little composure there is and how hard the
 * person takes pressure; then composure and presence grow a little, as performance anxiety falls with exposure.
 * Until 2026-10-09 it also returned the share of the work nerves left, which each night multiplied in; what
 * composure does to the work is the evaluation's since (`systems/evaluation.ts`), read once there.
 */
export function nerves(sim: Simulation, person: Person, event: Event): void {
  const a = attributesOf(sim, person);
  const unsettled = 1 - a.composure / 100;
  person.wellbeing.stress = clamp(person.wellbeing.stress + ATTRIBUTES.eventWeight[event] * unsettled * personalityOf(person, 'stressGain'), 0, 100);
  takeTheHouse(person);
  nudge(sim, person, 'composure', ATTRIBUTES.composureGain[event], true, `nerves:${event}`);
  nudge(sim, person, 'presence', ATTRIBUTES.presenceGain, true, `nerves:${event}`);
}

/** An ability's definition, for its look and the profile. */
export const abilityDef = (id: AbilityId) => ABILITY_DEFS.find((d) => d.id === id)!;

/**
 * How far a step of preparation goes by the ability it's practice in (`STEP_SPEED`, from 2026-10-16): `least` at 0,
 * 1 at 50, `most` at full. A multiplier on the step's move, beside the day's focus, the trait and familiarity, each of
 * which says something else.
 */
export function stepSpeed(sim: Simulation, person: Person, id: AbilityId): number {
  const n = clamp(abilityOf(sim, person, id) / Math.max(1, abilityFull(sim, person, id)), 0, 1);
  return STEP_SPEED.least + (STEP_SPEED.most - STEP_SPEED.least) * n;
}
