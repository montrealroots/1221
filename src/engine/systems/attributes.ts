/**
 * SLATE — the actor's attributes.
 *
 * Four qualities beside what is already kept: the craft the training builds
 * (`systems/school.ts`), the temperament (`systems/personality.ts`) and the
 * day's dials (`systems/life.ts`). Each is what the business actually weighs,
 * and each changes an outcome:
 *
 * - **Presence**, what a room or a camera sees beyond the technique. Largely
 *   given: drawn once (`attributes.presence`), and grown only a little by
 *   years in front of audiences. The showcase and every audition read it.
 * - **Composure**, how well nerves are held. It grows with exposure, as
 *   performance anxiety does fall with repetition. Before an audition, a
 *   performance or the showcase, nerves add stress and take the edge off the
 *   work there, by how little of it there is.
 * - **Reputation**, standing with the casting offices and agencies: work
 *   done, calls kept, the degree. Missed days, firings and missed auditions
 *   cost it. It sets how often the agency and the casting sites send an
 *   actor in, and how an agency reads a showing.
 * - **Recognition**, the public's knowledge of the name, from screen work
 *   that airs. It fades without new work, and an actor the public knows is
 *   paid above scale.
 *
 * None comes from the interests or the genres, which change what somebody
 * enjoys and never what they can do (`tests/cohesion.test.ts`). Every figure
 * below is SLATE's estimate unless it names a source: the trades publish no
 * scale for any of the four.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { clamp } from '../core/rng';
import { personalityOf } from './personality';

export interface Attributes {
  /** 0 to 100. Drawn once; the room's and the camera's read. */
  presence: number;
  /** 0 to 100. Nerves held; grows with every performance and audition. */
  composure: number;
  /** 0 to 100. Standing with casting offices and agencies. */
  reputation: number;
  /** 0 to 100. The public's knowledge of the name. */
  recognition: number;
}

export type AttributeKey = keyof Attributes;

/** SLATE's estimates, each named where it's read. */
export const ATTRIBUTES = {
  /** Presence drawn for a student the faculty chose first: 55 to 80, most near the middle. */
  presence: { from: 55, span: 25 },
  /** Composure at the start, by emotional stability (0-100): 25 to 60. */
  composureStart: { base: 25, perStability: 0.35 },
  /** Of a showing's score, the share presence makes. */
  showcaseShare: 0.2,
  /** Points of a part's bar presence moves an audition, at 0 and at 100: ±6 in the room, half on tape. */
  auditionSwing: 6,
  /** Nerves before an event, by its weight: the stress added at composure 0, and the share of the work it takes off. */
  nerves: { focusCost: 0.18 },
  eventWeight: { audition: 10, showcase: 18, performance: 6, set: 4 },
  /** Composure a performance, an audition and the showcase each add, as a share of what's left to 100. It was 0.012, 0.01, 0.04 and 0.006 until 2026-09-28, when all twelve of a batch of played lives reached 99 or 100 by the second year of work. */
  composureGain: { performance: 0.005, audition: 0.004, showcase: 0.03, set: 0.003 },
  /** Presence a performance adds, as a share of what's left: slow. */
  presenceGain: 0.0015,
  /** Reputation earned and lost: points, as a share of what's left to earn where it's a gain. */
  reputation: { day: 0.2, job: 3, degree: 8, repPerformance: 0.4, fired: -8, missedAudition: -3, dismissed: -5, showcasePer: 0.2 },
  /** How reputation scales the auditions an actor is sent: 0.75 at none to 1.25 at the most. */
  reputationSends: { at0: 0.75, at100: 1.25 },
  /** Points of a showing reputation adds, at 100. */
  reputationShowing: 8,
  /** Recognition from a finished screen job, by the part; and the month's fade. */
  recognition: { series: 12, arc: 4, guest: 2, costar: 0.5, film: 3, studioFilm: 7, commercial: 0.5, broadway: 3, fadePerMonth: 0.03 },
  /**
   * Building them on purpose: a scene-study week's composure and presence; an
   * improv session's; a casting director workshop's reputation; a coached
   * audition's nerves halved; a publicist's month of press, by the credits
   * there are to sell, and the fade it slows; a festival premiere's
   * recognition and standing, less if the film premieres without them.
   */
  build: {
    sceneWeek: { composure: 0.01, presence: 0.001 },
    improvSession: { composure: 0.025, presence: 0.002 },
    workshop: 1.5,
    coachedNerves: 0.5,
    publicity: { base: 1, perCredit: 0.5, most: 4, fadeKept: 0.5 },
    festival: { indie: 2, studio: 3, reputation: 1, absent: 0.5 },
  },
  /** Recognition past which the public knows the name, and the most above scale it pays at 100. */
  overscale: { from: 20, most: 1.0 },
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
    reputation: 0,
    recognition: 0,
  };
  return person.attrs;
}

/** Moves an attribute: a gain as a share of what's left to 100 when `share` is set, or plain points otherwise; always 0 to 100. */
export function nudge(sim: Simulation, person: Person, key: AttributeKey, amount: number, share = false): void {
  const a = attributesOf(sim, person);
  a[key] = clamp(share ? a[key] + (100 - a[key]) * amount : a[key] + amount, 0, 100);
}

/** Reputation earned: points, less the nearer it already is to the top. */
export function earn(sim: Simulation, person: Person, points: number): void {
  const a = attributesOf(sim, person);
  a.reputation = clamp(points > 0 ? a.reputation + points * (1 - a.reputation / 100) : a.reputation + points, 0, 100);
}

export type Event = keyof typeof ATTRIBUTES.eventWeight;

/**
 * Nerves before an event: stress added, by the event's weight, how little
 * composure there is and how hard the person takes pressure; and the share of
 * the work left to them, which the event's reading multiplies. The event
 * then adds to composure, and a performance a little to presence.
 */
export function nerves(sim: Simulation, person: Person, event: Event, steadied = 1): number {
  const a = attributesOf(sim, person);
  // Worked on with a coach first, half the nerves.
  const unsettled = (1 - a.composure / 100) * steadied;
  person.wellbeing.stress = clamp(person.wellbeing.stress + ATTRIBUTES.eventWeight[event] * unsettled * personalityOf(person, 'stressGain'), 0, 100);
  const kept = 1 - ATTRIBUTES.nerves.focusCost * unsettled;
  nudge(sim, person, 'composure', ATTRIBUTES.composureGain[event], true);
  if (event === 'performance') nudge(sim, person, 'presence', ATTRIBUTES.presenceGain, true);
  return kept;
}

/** Points presence moves a part's bar at an audition: in the room fully, on tape half. */
export function presenceSwing(presence: number, mode: 'tape' | 'room'): number {
  return ATTRIBUTES.auditionSwing * ((presence - 50) / 50) * (mode === 'tape' ? 0.5 : 1);
}

/** How reputation scales the auditions an actor is sent. */
export function sendsFactor(reputation: number): number {
  const { at0, at100 } = ATTRIBUTES.reputationSends;
  return at0 + (at100 - at0) * reputation / 100;
}

/** What a known name is paid, as a multiple of scale: 1 until the public knows it. */
export function overscaleOf(recognition: number): number {
  const { from, most } = ATTRIBUTES.overscale;
  return 1 + most * Math.max(0, recognition - from) / (100 - from);
}

/** A month without new screen work: recognition fades, half as fast with a publicist keeping the name out. */
export function fadeRecognition(sim: Simulation, person: Person, kept = false): void {
  const a = attributesOf(sim, person);
  const fade = ATTRIBUTES.recognition.fadePerMonth * (kept ? ATTRIBUTES.build.publicity.fadeKept : 1);
  a.recognition = Math.round(a.recognition * (1 - fade) * 100) / 100;
}
