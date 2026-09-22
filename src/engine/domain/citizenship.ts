/**
 * SLATE — where somebody is allowed to work.
 *
 * A person can hold two passports. Born in one country, naturalised in the one
 * they moved to and live in now, and they carry both for the rest of their
 * life — which is an ordinary biography and was not something the save could
 * express.
 *
 * There was a work-permit rule here once, and later a check that somebody
 * held a given passport. Nothing decides anything by either now, so both are
 * gone. What is left is what a screen reads: who holds which passports, and
 * how that reads out loud.
 */

import { COUNTRIES } from '../content/geography';

/** Somebody with one or two passports. */
export interface Citizen {
  citizenshipId: string;
  /** The second passport, if they hold one. Never the same as the first. */
  secondCitizenshipId?: string;
}

/** Every country they are a citizen of, in the order they are held. */
export function citizenshipsOf(person: Citizen): string[] {
  const held = [person.citizenshipId];
  if (person.secondCitizenshipId && person.secondCitizenshipId !== person.citizenshipId) {
    held.push(person.secondCitizenshipId);
  }
  return held;
}

/** How the two passports read on a screen. */
export function citizenshipLabel(person: Citizen): string {
  return citizenshipsOf(person)
    .map((id) => COUNTRIES.get(id)?.name ?? id)
    .join(' And ');
}
