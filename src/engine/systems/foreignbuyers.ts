/**
 * SLATE — buying a home in a country one isn't a citizen of (docs/WORLD.md,
 * stage 4d), from 2026-09-30, researched in `docs/research/world/research-land-2.json`.
 *
 * - Canada: the Prohibition on the Purchase of Residential Property by
 *   Non-Canadians Act bars a non-citizen who isn't a permanent resident from
 *   buying a home in a census metropolitan area or agglomeration until
 *   1 January 2027 (CMHC). SLATE keeps no permanent residents, and takes a
 *   Canadian town of 10,000 or more, an agglomeration's threshold, as one.
 *   After it, Ontario's Non-Resident Speculation Tax, 25% province-wide on a
 *   foreign national's purchase, and Toronto's 10% more from 2025; British
 *   Columbia's additional property transfer tax on a foreign national, 20%
 *   (not re-read on 2026-09-30).
 * - England: a buyer not resident in the UK pays 2% more Stamp Duty Land Tax
 *   on a home, from April 2021 (HMRC, not re-read). SLATE takes someone whose
 *   home isn't in Britain as not resident, the test being 183 days there in
 *   the year before.
 * - Mexico City lies outside the restricted zone, where a foreigner may own
 *   directly under a Calvo clause with the SRE, whose fee wasn't read; none is
 *   charged. Ireland and America don't restrict a foreign buyer.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';

export const FOREIGN_BUYERS = {
  canadaBanUntil: Date.UTC(2027, 0, 1),
  agglomerationPopulation: 10_000,
  ontarioNrst: 0.25,
  torontoNrst: 0.1,
  bcAptt: 0.2,
  englandSurcharge: 0.02,
} as const;

const isCanadian = (person: Person) => person.citizenshipId === 'ca';

/** Why a home here can't be bought by this person now, or nothing. */
export function foreignBuyerRefusal(sim: Simulation, person: Person, cityId: string): string | undefined {
  const city = CITIES.get(cityId);
  if (!city || city.countryId !== 'ca' || isCanadian(person)) return undefined;
  if (sim.now < FOREIGN_BUYERS.canadaBanUntil && city.population >= FOREIGN_BUYERS.agglomerationPopulation) {
    return 'Canada’s ban on non-Canadians buying a home in its cities runs to 1 January 2027.';
  }
  return undefined;
}

/** What a foreign or non-resident buyer pays on a home here beyond a resident's, in the save's money, cents. */
export function foreignBuyerTax(person: Person, cityId: string, price: Money): Money {
  const city = CITIES.get(cityId);
  if (!city) return 0;
  if (city.countryId === 'ca' && !isCanadian(person)) {
    if (city.parentId === 'ca-08') return Math.round(price * (FOREIGN_BUYERS.ontarioNrst + (cityId === 'ca-on-toronto' ? FOREIGN_BUYERS.torontoNrst : 0)));
    if (city.parentId === 'ca-02') return Math.round(price * FOREIGN_BUYERS.bcAptt);
  }
  if (city.parentId === 'uk-eng' && CITIES.get(person.home?.cityId ?? '')?.countryId !== 'uk') return Math.round(price * FOREIGN_BUYERS.englandSurcharge);
  return 0;
}
