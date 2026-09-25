/**
 * SLATE — citizenship.
 *
 * A person is a citizen of one country: the one they were born in. It is not
 * asked. The place of birth decides it, creation says it back, and the save
 * keeps it on the person.
 *
 * "The country" means the state whose citizenship a place gives, which is not
 * always the entry the place is listed under. The gazetteer lists territories
 * beside countries, the way a map does, and somebody born in San Juan is a
 * citizen of the United States, not of Puerto Rico. `TERRITORY_CITIZENSHIP`
 * says which is which.
 *
 * There used to be a second passport here, for somebody naturalized where
 * they live now, and beside it a work-permit rule, which went first. Neither
 * decided anything by the end, so both went. The right to work came back with
 * the day job (`mayWorkIn`), because now it decides whether there is one.
 */

import { countryOfPlace } from '../content/geography';

/**
 * Territories whose people hold another country's citizenship, by the country
 * that gives it. Public reference: each territory's standing under the
 * nationality law of the state it belongs to.
 *
 * Two are not quite citizenship, and are here because the country is still
 * the right answer to which one somebody is under: American Samoa gives United
 * States nationality without citizenship, and Hong Kong and Macao issue their
 * own passports on Chinese nationality. The places with a nationality of their
 * own, recognized or not, are left as themselves: Taiwan, Kosovo, Palestine
 * and Western Sahara among them. So are the entries nobody can be born in,
 * such as Antarctica and the countries that have dissolved.
 */
export const TERRITORY_CITIZENSHIP: Readonly<Record<string, string>> = {
  // The United States.
  pr: 'us', gu: 'us', vi: 'us', mp: 'us', as: 'us', um: 'us',
  // France.
  re: 'fr', gp: 'fr', mq: 'fr', gf: 'fr', yt: 'fr', pf: 'fr', nc: 'fr',
  bl: 'fr', mf: 'fr', pm: 'fr', wf: 'fr', tf: 'fr',
  // The United Kingdom, its overseas territories and the Crown dependencies.
  ai: 'uk', bm: 'uk', io: 'uk', vg: 'uk', ky: 'uk', fk: 'uk', gi: 'uk',
  ms: 'uk', pn: 'uk', sh: 'uk', gs: 'uk', tc: 'uk', gg: 'uk', je: 'uk', im: 'uk',
  // The Netherlands.
  aw: 'nl', cw: 'nl', sx: 'nl', bq: 'nl',
  // Denmark, Finland and Norway.
  gl: 'dk', fo: 'dk', ax: 'fi', sj: 'no', bv: 'no',
  // Australia and New Zealand.
  cx: 'au', cc: 'au', nf: 'au', hm: 'au', ck: 'nz', nu: 'nz', tk: 'nz',
  // China.
  hk: 'cn', mo: 'cn',
};

/**
 * The country somebody born in this place is a citizen of, or undefined when
 * the place names no real country.
 */
export function citizenshipFor(birthplaceId: string): string | undefined {
  const listed = countryOfPlace(birthplaceId);
  return listed ? TERRITORY_CITIZENSHIP[listed] ?? listed : undefined;
}

/**
 * Where citizens of one country may work in another without a visa: the
 * European Economic Area and Switzerland, which share free movement of
 * workers; the United Kingdom and Ireland, the Common Travel Area; and
 * Australia and New Zealand, under the Trans-Tasman arrangement.
 */
const FREE_MOVEMENT: readonly (readonly string[])[] = [
  ['at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu', 'ie', 'it', 'lv', 'lt', 'lu',
    'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se', 'is', 'li', 'no', 'ch'],
  ['uk', 'ie'],
  ['au', 'nz'],
];

/**
 * Whether a citizen of a country may take ordinary work in a town, and the
 * country the town's work is under.
 *
 * Their own country, a territory of it, or a country their citizenship moves
 * freely to. Anywhere else takes a work visa, and the jobs actors fall back
 * on, a café counter or a bar, don't get one. The work-permit rule this file
 * once had went because nothing read it; whether a character gets a day job
 * reads this (`populateWorld` and `migrate` in `engine/index.ts`, and the
 * search for work in `systems/work.ts`), so a character from Reykjavík
 * starting out in Los Angeles keeps no day job there.
 */
export function mayWorkIn(citizenshipId: string, cityId: string): { may: boolean; countryId?: string } {
  const listed = countryOfPlace(cityId);
  const countryId = listed ? TERRITORY_CITIZENSHIP[listed] ?? listed : undefined;
  if (!countryId) return { may: false };
  if (countryId === citizenshipId) return { may: true, countryId };
  const may = FREE_MOVEMENT.some((bloc) => bloc.includes(citizenshipId) && bloc.includes(countryId));
  return { may, countryId };
}
