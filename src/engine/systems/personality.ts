/**
 * SLATE — what a personality does to a day.
 *
 * One number per knob, for one person: the product of what their traits
 * declare, times what their dispositions lean it. 1 is nobody in particular.
 * The life system asks for these where the knob bites, and nothing else does.
 *
 * The axes lean a knob from the middle of the slider, so 50 is no lean at all
 * and the ends are the most a disposition can do. Three of the seven lean
 * anything, and each leans only what it would in a person: emotional
 * stability how stress arrives and clears, ambition how much running on empty
 * costs, conscientiousness how orderly the nights are. The other four have no
 * knob to lean yet.
 */

import type { Person, Personality } from '../domain/model';
import {
  MAX_PERSONALITY_TRAITS, PERSONALITY_TRAIT_BY_ID, conflictingPersonalityTraits, personalityModifier,
  type PersonalityKnob,
} from '../content/personality-traits';

/** The disposition a character starts with before anybody moves a slider. */
export function defaultPersonality(): Personality {
  return {
    openness: 55, conscientiousness: 55, extraversion: 55,
    agreeableness: 55, emotionalStability: 55, ambition: 60, riskTolerance: 50,
  };
}

/** The slider's range. The ends are left off, because nobody is all one thing. */
export const AXIS_MIN = 5;
export const AXIS_MAX = 95;

/** A personality with every axis a number inside the slider's range. */
export function cleanPersonality(raw: Partial<Personality> | undefined): Personality {
  const base = defaultPersonality();
  const out = { ...base };
  for (const key of Object.keys(base) as (keyof Personality)[]) {
    const value = raw?.[key];
    out[key] = typeof value === 'number' && Number.isFinite(value)
      ? Math.round(Math.min(AXIS_MAX, Math.max(AXIS_MIN, value)))
      : base[key];
  }
  return out;
}

/**
 * The traits somebody can actually hold from a list: ones this build knows,
 * once each, never two that rule each other out (the first said wins), and no
 * more than four.
 */
export function cleanPersonalityTraits(ids: readonly string[] | undefined): string[] {
  const held: string[] = [];
  for (const id of ids ?? []) {
    if (held.length >= MAX_PERSONALITY_TRAITS) break;
    if (!PERSONALITY_TRAIT_BY_ID[id] || held.includes(id)) continue;
    if (conflictingPersonalityTraits(held, id).length > 0) continue;
    held.push(id);
  }
  return held;
}

/** Where an axis sits between its middle and either end, from -1 to 1. */
function lean(value: number | undefined): number {
  return Math.max(-1, Math.min(1, ((value ?? 50) - 50) / 45));
}

/** What the dispositions do to one knob. */
export function axisModifier(personality: Personality | undefined, knob: PersonalityKnob): number {
  if (!personality) return 1;
  const steady = lean(personality.emotionalStability);
  const driven = lean(personality.ambition);
  const ordered = lean(personality.conscientiousness);
  switch (knob) {
    case 'stressGain': return 1 - steady * 0.3 + driven * 0.15;
    case 'stressRecovery': return 1 + steady * 0.3;
    case 'sleepQuality': return 1 + ordered * 0.1;
    case 'energyRecovery': return 1 + ordered * 0.1;
    default: return 1;
  }
}

/**
 * How far one knob can be moved, all told.
 *
 * About what the single strongest trait on each does, so stacking four that
 * pull the same way reaches the worst sleeper or the calmest temper there is
 * and stops. Without a bound, four legal picks multiplied a night's rest down
 * to a quarter of anybody else's, and no amount of sleep paid for a day.
 */
const KNOB_RANGE: Readonly<Record<PersonalityKnob, readonly [number, number]>> = {
  stressGain: [0.55, 1.6],
  stressRecovery: [0.7, 1.4],
  sleepQuality: [0.8, 1.2],
  energyRecovery: [0.85, 1.2],
  hygieneDrift: [0.8, 1.3],
  moraleSwing: [0.7, 1.3],
};

/** One of this person's knobs: 1 unless their traits or dispositions move it. */
export function personalityOf(person: Pick<Person, 'personality' | 'personalityTraits'>, knob: PersonalityKnob): number {
  const [low, high] = KNOB_RANGE[knob];
  const value = personalityModifier(person.personalityTraits ?? [], knob) * axisModifier(person.personality, knob);
  return Math.min(high, Math.max(low, value));
}
