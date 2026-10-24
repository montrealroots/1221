/**
 * SLATE — citizenship.
 *
 * A person is a citizen of one country, and the player says which at creation (from 2026-10-24, the owner's brief 27:
 * "Birthplace alone must not grant residency, an existing bank account, citizenship, or work eligibility"). Until then it
 * wasn't asked: from 2026-09-22 (schema 82, the owner's "whatever you put your place of birth it generates what country
 * citizenship you're under") the place of birth decided it, creation said it back, and every opening put it back to
 * the birthplace's. The birthplace still suggests one, and a life made by a test or a tool without a citizenship takes
 * the birthplace's (`citizenshipOf`), but nothing the player chose is changed by it.
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
 * the day job (`mayWorkIn`), which it decided, and went with it on
 * 2026-09-26: free movement in the EEA, the Common Travel Area and across the
 * Tasman, and a work visa anywhere else.
 */

import { COUNTRIES, countryOfPlace } from '../content/geography';

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
 * The citizenship a place suggests: the country it belongs to, a territory's being the country's. Creation offers it as
 * Same As Your Place Of Birth, and a life made without a chosen citizenship takes it (`citizenshipOf`). Undefined when
 * the place names no real country.
 */
export function citizenshipFor(birthplaceId: string): string | undefined {
  const listed = countryOfPlace(birthplaceId);
  return listed ? TERRITORY_CITIZENSHIP[listed] ?? listed : undefined;
}

/** Entries nobody is a citizen of: the continent with no people of its own (the uninhabited territories are their country's above). */
const NO_CITIZENS = new Set(['aq']);

/** Every citizenship a person can hold, by the gazetteer's country id: every country that isn't a territory of another. */
export function citizenships(): string[] {
  return COUNTRIES.all().map((c) => c.id).filter((id) => !TERRITORY_CITIZENSHIP[id] && !NO_CITIZENS.has(id));
}

/** Whether an id names a citizenship a person can hold. */
export function isCitizenship(id: string | undefined): boolean {
  return id !== undefined && COUNTRIES.get(id) !== undefined && !TERRITORY_CITIZENSHIP[id] && !NO_CITIZENS.has(id);
}

/** A new life's citizenship: the one chosen, or, for a life a test or a tool makes without one, the birthplace's. */
export function citizenshipOf(config: { citizenshipId?: string; homeRegionId: string }): string | undefined {
  return isCitizenship(config.citizenshipId) ? config.citizenshipId : config.citizenshipId === undefined ? citizenshipFor(config.homeRegionId) : undefined;
}
