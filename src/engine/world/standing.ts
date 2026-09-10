/**
 * SLATE — how you are getting on with somebody, and what moves it.
 *
 * A bond is one number between two people, and the whole point of it is that
 * nobody sets it. It moves because of what happened: you were there, or you
 * were not, or a month went by and neither of you did anything about it.
 *
 * The shape is a spring rather than a decay. People who share a house see
 * each other over breakfast whether they meant to or not, so a bond does not
 * fall to nothing when it is left alone — it falls back to what living
 * alongside somebody is worth on its own, and no further. Turning up pushes
 * it above that and it settles again over the following weeks. That is why a
 * standing you have worked at is worth something and cannot simply be banked.
 *
 * Missing somebody costs more than showing up earns. That is not pessimism,
 * it is the arithmetic that makes a plan mean anything: if the two were even,
 * a person could make a dozen plans, keep half of them and come out ahead.
 */

import type { Bond, Id, SaveUniverse } from '../domain/model';
import { bondKey } from '../domain/model';
import { clamp } from '../core/rng';
import { MS_DAY, type Instant } from '../core/time';

/**
 * What a bond settles at when nothing is happening to it.
 *
 * Sharing a roof is contact: you hear them on the stairs, you eat at the same
 * table, you know what kind of week they are having without being told. It is
 * not closeness, but it is not nothing, and it is why a bond with somebody in
 * the house never goes cold on its own.
 */
export const RESTING_UNDER_ONE_ROOF = 60;
export const RESTING_APART = 25;

/**
 * How much of the gap to the resting level closes in a day.
 *
 * Slow on purpose. At this rate a bond warmed by a good afternoon is halfway
 * back to ordinary in about five weeks, which is roughly how long it takes to
 * stop thinking about a good afternoon.
 */
export const DRIFT_PER_DAY = 0.02;

/** What turning up is worth, and what not turning up costs. */
export const TOGETHER_WARMS = 6;
export const MISSED_COOLS = 10;

/** The bond between two people, where there is one. */
export function bondFor(universe: SaveUniverse, a: Id, b: Id): Bond | undefined {
  return universe.bonds[bondKey(a, b)];
}

/** Every bond this person has, warmest first. */
export function bondsOf(universe: SaveUniverse, personId: Id): Bond[] {
  return Object.values(universe.bonds)
    .filter((bond) => bond.betweenIds.includes(personId))
    .sort((one, two) => two.closeness - one.closeness);
}

/** Who the other one is. */
export function otherIn(bond: Bond, personId: Id): Id {
  return bond.betweenIds[0] === personId ? bond.betweenIds[1] : bond.betweenIds[0];
}

/** Whether two people wake up in the same house. */
export function underOneRoof(universe: SaveUniverse, a: Id, b: Id): boolean {
  const one = universe.people[a];
  const two = universe.people[b];
  return Boolean(one?.householdId && one.householdId === two?.householdId);
}

/** Where a bond settles when neither of them does anything about it. */
export function restingLevel(universe: SaveUniverse, bond: Bond): number {
  return underOneRoof(universe, bond.betweenIds[0], bond.betweenIds[1])
    ? RESTING_UNDER_ONE_ROOF
    : RESTING_APART;
}

/**
 * Moves one bond and says how far it actually moved.
 *
 * The answer is the real change rather than the change asked for, because a
 * bond at a hundred cannot be warmed and a screen that says "+6" when nothing
 * happened is lying to the person reading it.
 */
export function moveBond(
  universe: SaveUniverse, a: Id, b: Id, by: number, now: Instant,
): number {
  const bond = bondFor(universe, a, b);
  if (!bond) return 0;
  const was = bond.closeness;
  bond.closeness = clamp(was + by, 0, 100);
  if (by > 0) bond.lastTogetherAt = now;
  return bond.closeness - was;
}

/**
 * A day of nobody doing anything, applied to every bond in the save.
 *
 * Called once at the day rollover. Whole days only: a bond must not drift
 * differently because the player skipped forward in one jump rather than two,
 * so the drift is anchored to `lastDriftedAt` and catches up in whole days.
 */
export function driftBonds(universe: SaveUniverse, now: Instant): void {
  for (const bond of Object.values(universe.bonds)) {
    const since = bond.lastDriftedAt ?? bond.formedAt;
    const days = Math.floor((now - since) / MS_DAY);
    if (days <= 0) continue;
    bond.lastDriftedAt = since + days * MS_DAY;

    const rest = restingLevel(universe, bond);
    // Compounded rather than multiplied out, so ten days of drift and ten
    // separate days of drift land on the same number.
    const remaining = (1 - DRIFT_PER_DAY) ** days;
    bond.closeness = clamp(rest + (bond.closeness - rest) * remaining, 0, 100);
  }
}

// ---------------------------------------------------------------------------
// What it is worth saying out loud
// ---------------------------------------------------------------------------

/** The bands a standing is described in, warmest first. */
export const STANDING_BANDS: readonly { from: number; word: string; said: string }[] = [
  { from: 85, word: 'Inseparable', said: 'You two are as close as it gets. It would be strange if you weren’t.' },
  { from: 70, word: 'Close', said: 'You’re close. You tell each other things before you tell anybody else.' },
  { from: 55, word: 'Warm', said: 'You get on. Nothing is wrong, and neither of you is working at it.' },
  { from: 40, word: 'Cordial', said: 'You’re fine with each other. Politely, and at a slight distance.' },
  { from: 25, word: 'Distant', said: 'You live alongside each other. That’s about the size of it.' },
  { from: 10, word: 'Cold', said: 'Something went wrong here, and neither of you has fixed it.' },
  { from: 0, word: 'Estranged', said: 'You’re in the same family and that’s the only thing left.' },
];

/** The one word for a closeness. */
export function standingWord(closeness: number): string {
  return (STANDING_BANDS.find((band) => closeness >= band.from) ?? STANDING_BANDS[STANDING_BANDS.length - 1]!).word;
}

/** The sentence for a closeness. */
export function standingSaid(closeness: number): string {
  return (STANDING_BANDS.find((band) => closeness >= band.from) ?? STANDING_BANDS[STANDING_BANDS.length - 1]!).said;
}

/** How long since the two of them were last together on purpose. */
export function daysSinceTogether(bond: Bond, now: Instant): number | undefined {
  return bond.lastTogetherAt === undefined
    ? undefined
    : Math.max(0, Math.floor((now - bond.lastTogetherAt) / MS_DAY));
}

// ---------------------------------------------------------------------------
// What it does to you
// ---------------------------------------------------------------------------

/**
 * How much of a day's morale the people around you account for.
 *
 * Small, and deliberately so. A person with a good family and a bad week is
 * still having a bad week; the family is what makes it survivable rather than
 * what makes it good. At the extremes this is worth about a point of morale a
 * day, which over a month is the difference between coping and not.
 */
export const MORALE_FROM_STANDING = 1.2;

/**
 * The pull the people around you put on your morale each day.
 *
 * Their average, not their best and not their worst: one person you are close
 * to does not cancel out a house you are not speaking to, and one row does not
 * undo everybody else. Nought when there is nobody, because having no people
 * is a different problem from having people you are not getting on with, and
 * the game does not yet model the first one.
 */
export function moralePullOf(universe: SaveUniverse, personId: Id): number {
  const bonds = bondsOf(universe, personId);
  if (bonds.length === 0) return 0;
  const average = bonds.reduce((sum, bond) => sum + bond.closeness, 0) / bonds.length;
  // Fifty is even. Above it the people around you carry you, below it they cost you.
  return ((average - 50) / 50) * MORALE_FROM_STANDING;
}
