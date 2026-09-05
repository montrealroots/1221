/**
 * SLATE — where somebody is allowed to work.
 *
 * A person can hold two passports. Born in one country, naturalised in the one
 * they moved to and live in now, and they carry both for the rest of their
 * life — which is an ordinary biography in this business and was not something
 * the save could express.
 *
 * The reason it is in the engine rather than on a screen is that the creation
 * step has always said citizenship "affects where you can work without
 * arrangement", and until now nothing read it. A label that promises a rule
 * the game does not have is worse than no label, so here is the rule.
 */

import { CITIES, COUNTRIES } from '../content/geography';

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

/** The country a city sits in, or undefined if the city is not on record. */
export function countryOfCity(cityId: string): string | undefined {
  return CITIES.get(cityId)?.countryId;
}

/**
 * Whether they can take work in the country that city is in without an
 * arrangement — a visa, a sponsorship, a permit. Holding the passport is the
 * whole test; everything else is a matter for somebody's lawyer.
 */
export function canWorkIn(person: Citizen, cityId: string): boolean {
  const country = countryOfCity(cityId);
  if (!country) return true;
  return isCitizenOf(person, country);
}

/** Why they cannot, in the words the refusal will use. */
export function workRefusalFor(person: Citizen, cityId: string): string | undefined {
  if (canWorkIn(person, cityId)) return undefined;
  const country = countryOfCity(cityId);
  const name = COUNTRIES.get(country ?? '')?.name ?? 'that country';
  const held = citizenshipsOf(person)
    .map((id) => COUNTRIES.get(id)?.name ?? id)
    .join(' or ');
  return `You are not a citizen of ${name}, and you hold ${held}. Taking that work needs an arrangement nobody has made.`;
}

/** How the two passports read on a screen. */
export function citizenshipLabel(person: Citizen): string {
  return citizenshipsOf(person)
    .map((id) => COUNTRIES.get(id)?.name ?? id)
    .join(' And ');
}
