/**
 * SLATE — the land the family holds, and what stands on it.
 *
 * The premise the rest of the game hangs off. You do not arrive with nothing
 * and work your way in: you are born onto two thousand acres outside
 * Reykjavík, and the family has just built a studio lot on it and started a
 * production company that makes television and film and carries the family
 * name.
 *
 * The family name, not yours. It comes off the surname because that is where
 * a surname comes from, but nothing on that gate was put there for the
 * player. It was there first.
 *
 * Which means the usual sources of pressure are not there. No rent, no
 * landlord, no day job, nobody to audition for to get in the door. What is
 * there instead: a company nobody has heard of, in a country with no film
 * business to speak of, and a name on the gate that everybody will assume is
 * the only reason you are standing on the lot.
 */

import { CITIES, COUNTRIES, REGIONS, type City } from '@/engine/content/geography';

/** Home base. Not a choice — it is where the family land is. */
export const ESTATE_CITY_ID = 'is-39-reykjavik';

/** The country the land is in. Everybody in the family holds its passport. */
export const ESTATE_COUNTRY_ID = 'is';

export const ESTATE_ACRES = 2_000;

export function estateCity(): City {
  const city = CITIES.get(ESTATE_CITY_ID);
  if (!city) throw new Error(`the estate sits in a city the gazetteer doesn’t have: ${ESTATE_CITY_ID}`);
  return city;
}

/** "Reykjavík, Capital Region · Iceland", from the gazetteer rather than typed out. */
export function estatePlaceLine(): string {
  const city = estateCity();
  const region = REGIONS.get(city.parentId)?.name;
  const country = COUNTRIES.get(city.countryId)?.name;
  return [[city.name, region].filter(Boolean).join(', '), country].filter(Boolean).join(' · ');
}

/**
 * The company, which carries the family name.
 *
 * Built from the surname because the surname is the family name — the same
 * fact read from the only field that already holds it — so the company names
 * itself and there is nothing extra to fill in.
 */
export function studioName(lastName: string): string {
  const surname = lastName.trim();
  return surname ? `${surname} Pictures` : 'The Family Company';
}

export interface Holding {
  id: string;
  label: (lastName: string) => string;
  detail: string;
}

/** What stands on the land. Three things, and the third is the whole game. */
export const HOLDINGS: readonly Holding[] = [
  {
    id: 'house',
    label: () => 'The House',
    detail: 'Where you live. No rent, no lease, no landlord, and nobody to answer to about it.',
  },
  {
    id: 'lot',
    label: () => 'The Studio Lot',
    detail: 'Newly built, on the same land, and close enough to walk to from the house. Stages for television and film both.',
  },
  {
    id: 'company',
    label: () => 'The Company',
    // Named in its own card below rather than here, so the name is not printed
    // twice on one page under two different headings.
    detail: 'Television and film, out of the lot. It carries the family name and it has no record yet.',
  },
];

/**
 * Why Iceland is not an odd choice but the point of it.
 *
 * The gazetteer scores Reykjavík at nothing for film industry presence, which
 * is correct and is exactly the situation: there is no business here to join.
 */
export const ESTATE_NOTE =
  'There’s no television or film industry in Iceland to walk into. That’s the point of it: the family '
  + 'isn’t '
  + 'buying a way into somebody else’s business, it’s building one where there was none, and you '
  + 'are standing on it before anybody outside the country knows it exists.';
