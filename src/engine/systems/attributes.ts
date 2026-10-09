/**
 * SLATE — the actor's attributes.
 *
 * Two qualities beside what is already kept: the craft the training builds
 * (`systems/school.ts`), the temperament (`systems/personality.ts`) and the
 * day's dials (`systems/life.ts`). Each changes an outcome:
 *
 * - **Presence**, what a house sees beyond the technique. Largely given:
 *   drawn once (`attributes.presence`), and grown only a little by
 *   nights in front of a house. A night's reading weighs it beside the craft
 *   (`nightOf`), from 2026-10-09.
 * - **Composure**, how well nerves are held. It grows with exposure, as
 *   performance anxiety does fall with repetition. Before a performance,
 *   nerves add stress and take the edge off the work there, by how little of
 *   it there is.
 *
 * Reputation and recognition were here too until 2026-10-09: standing with
 * the casting offices, and the public's knowledge of the name. The school
 * added to reputation, and only the career read either (an agency's sends, a
 * showing, a quote over scale), so they went with it in the scope reset, as
 * the audition, the showcase and the set did from the nerves.
 *
 * None comes from the interests or the genres, which change what somebody
 * enjoys and never what they can do (`tests/cohesion.test.ts`). Every figure
 * below is SLATE's estimate unless it names a source: nothing published puts
 * a scale on either.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { clamp } from '../core/rng';
import { personalityOf } from './personality';

export interface Attributes {
  /** 0 to 100. Drawn once; the house's read. */
  presence: number;
  /** 0 to 100. Nerves held; grows with every performance. */
  composure: number;
}

export type AttributeKey = keyof Attributes;

/** SLATE's estimates, each named where it's read. */
export const ATTRIBUTES = {
  /** Presence drawn for a student the faculty chose first: 55 to 80, most near the middle. */
  presence: { from: 55, span: 25 },
  /** Composure at the start, by emotional stability (0-100): 25 to 60. */
  composureStart: { base: 25, perStability: 0.35 },
  /** Of a night's reading, the share presence makes about the middle of the draw (`nightOf`); of a showcase showing's until 2026-10-09. */
  showcaseShare: 0.2,
  /** Nerves before an event, by its weight: the stress added at composure 0, and the share of the work it takes off. */
  nerves: { focusCost: 0.18 },
  eventWeight: { performance: 6 },
  /** Composure a performance adds, as a share of what's left to 100. It was 0.012 until 2026-09-28, when all twelve of a batch of played lives reached 99 or 100 by the second year of work. */
  composureGain: { performance: 0.005 },
  /** Presence a performance adds, as a share of what's left: slow. */
  presenceGain: 0.0015,
} as const;

/**
 * A classmate's presence, drawn once as the player's is and kept on them.
 * Until 2026-09-28 every classmate was read at an ordinary 50, below the
 * least a Yale actor's draw can be.
 */
export function classmatePresence(sim: Simulation, person: Person, i: number): number {
  const mate = person.school?.classmates[i];
  if (!mate) return 50;
  if (mate.presence === undefined) {
    const rng = sim.rng('attributes.presence', person.id, `mate-${i}`);
    mate.presence = Math.round((ATTRIBUTES.presence.from + ATTRIBUTES.presence.span * (rng.next() + rng.next()) / 2) * 10) / 10;
  }
  return mate.presence;
}

/** A person's attributes, drawn the first time they're asked for. */
export function attributesOf(sim: Simulation, person: Person): Attributes {
  if (person.attrs) return person.attrs;
  const rng = sim.rng('attributes.presence', person.id, 'innate');
  const presence = ATTRIBUTES.presence.from + ATTRIBUTES.presence.span * (rng.next() + rng.next()) / 2;
  const stability = person.personality?.emotionalStability ?? 50;
  person.attrs = {
    presence: Math.round(presence * 10) / 10,
    composure: Math.round((ATTRIBUTES.composureStart.base + ATTRIBUTES.composureStart.perStability * stability) * 10) / 10,
  };
  return person.attrs;
}

/** Moves an attribute: a gain as a share of what's left to 100 when `share` is set, or plain points otherwise; always 0 to 100. */
export function nudge(sim: Simulation, person: Person, key: AttributeKey, amount: number, share = false): void {
  const a = attributesOf(sim, person);
  a[key] = clamp(share ? a[key] + (100 - a[key]) * amount : a[key] + amount, 0, 100);
}

export type Event = keyof typeof ATTRIBUTES.eventWeight;

/**
 * Nerves before an event: stress added, by the event's weight, how little
 * composure there is and how hard the person takes pressure; and the share of
 * the work left to them, which the event's reading multiplies. The event
 * then adds to composure, and a little to presence.
 */
export function nerves(sim: Simulation, person: Person, event: Event): number {
  const a = attributesOf(sim, person);
  const unsettled = 1 - a.composure / 100;
  person.wellbeing.stress = clamp(person.wellbeing.stress + ATTRIBUTES.eventWeight[event] * unsettled * personalityOf(person, 'stressGain'), 0, 100);
  const kept = 1 - ATTRIBUTES.nerves.focusCost * unsettled;
  nudge(sim, person, 'composure', ATTRIBUTES.composureGain[event], true);
  nudge(sim, person, 'presence', ATTRIBUTES.presenceGain, true);
  return kept;
}
