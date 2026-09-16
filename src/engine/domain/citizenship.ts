/**
 * SLATE — where somebody is allowed to work.
 *
 * A person can hold two passports. Born in one country, naturalised in the one
 * they moved to and live in now, and they carry both for the rest of their
 * life — which is an ordinary biography in this business and was not something
 * the save could express.
 *
 * There was a work-permit rule here once, written because the creation step
 * used to say citizenship "affects where you can work without arrangement".
 * That sentence is gone — the field is read-only and pinned to Iceland, and a
 * test enforces that there is no picker — so the rule it justified had nothing
 * asking it and nothing able to make it matter. It is deleted rather than kept
 * against a day somebody might want it, and what it claimed was not true
 * anyway: holding the passport is not the whole test inside the EEA, where the
 * right to work follows the treaty and not the nationality.
 *
 * What is left is what a screen and the casting side actually read: who holds
 * which passports, and how that reads out loud.
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

/** Whether they hold that country's passport. */
export function isCitizenOf(person: Citizen, countryId: string): boolean {
  return citizenshipsOf(person).includes(countryId);
}

/** How the two passports read on a screen. */
export function citizenshipLabel(person: Citizen): string {
  return citizenshipsOf(person)
    .map((id) => COUNTRIES.get(id)?.name ?? id)
    .join(' And ');
}
