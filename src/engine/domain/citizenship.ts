/**
 * SLATE — citizenship.
 *
 * A person is a citizen of one country: the one they were born in. It is not
 * asked. The place of birth decides it, creation says it back, and the save
 * keeps it on the person.
 *
 * There used to be a second passport here, for somebody naturalized where
 * they live now, and before that a work-permit rule. Neither decided
 * anything by the end, so both went.
 */

import { countryOfPlace } from '../content/geography';

/**
 * The country somebody born in this place is a citizen of, or undefined when
 * the place names no real country.
 */
export function citizenshipFor(birthplaceId: string): string | undefined {
  return countryOfPlace(birthplaceId);
}
