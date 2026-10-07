/**
 * SLATE — the rubbish collection, at what each town charges a household for
 * it (the master plan's household supplies, from 2026-10-02; the collectors
 * in `content/cleaning.ts`, the figures from
 * `docs/research/world/research-household-supplies.json`).
 *
 * - **Los Angeles** charges a house its Solid Resources Fee on the water and
 *   power bill, by LA Sanitation's schedule: $55.95 a month from 21 November
 *   2025, $59.53 from 1 July 2026, then $60.44, $63.27 and $65.93 each July
 *   to 2029. A building of flats has a private hauler, paid by its owners.
 * - **Toronto** bills a house by its garbage bin on the city utility bill,
 *   C$317.85 a year for the small bin in 2026, the least of its four sizes.
 * - **Vancouver** puts a house's garbage cart and green bin on its property
 *   tax notice, C$117 and C$189 a year for the smallest of each in 2026 (the
 *   city's pages as search shows them; it blocks a direct read).
 * - **Dublin** leaves a household to contract a permitted operator; the
 *   least of the monthly plans read is The City Bin Co.'s City Lite, €24 a
 *   month for 30 kg of general waste. A flat's bins are its management
 *   company's, in the service charge or the rent. Until 2026-10-06 every
 *   house paid City Lite's €24 whoever lived there; from then the household's
 *   black bin is weighed: the EPA's 372 kg of household waste a person in
 *   2020, 39% of it in the black bin (Panda citing the EPA,
 *   `research-household-supplies.json`), a month of it for each of the
 *   household, on whichever of The City Bin Co.'s three plans (City Lite,
 *   Essential, Extra: 30, 42 and 65 kg) costs least with its 30c a kg over
 *   the allowance. One or two people stay under City Lite's 30 kg; a
 *   household of four pays City Essential's €26.49 and 6.4 kg over.
 *   (`research-household-waste.json`'s CSO 320 kg of 2019 has no black-bin
 *   share, so the EPA's 2020 figure is the one read.)
 * - **London** collects with the council tax, **Mexico City** free by law,
 *   and **New York** and **New Haven** charge no household fee their pages
 *   show. Nothing extra in any of them.
 *
 * A room in a shared house, or a sofa, has its bins in the rent. Elsewhere
 * SLATE doesn't have a town's charge and adds none. The month's is billed
 * with the bills on the first.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { zonedParts } from '../core/time';
import { CITIES } from '../content/geography';
import { isFlat } from '../content/homes';
import { WASTE_SERVICES, type WasteService } from '../content/cleaning';
import { inSaveMoney } from './banking';
import { homePlace } from './dwelling';
import { householdOf } from './water';

/** LA Sanitation's Solid Resources Fee, a month, from each date. */
export const LA_SOLID_RESOURCES: readonly { from: string; usd: number }[] = [
  { from: '2025-11-21', usd: 55.95 }, { from: '2026-07-01', usd: 59.53 }, { from: '2027-07-01', usd: 60.44 }, { from: '2028-07-01', usd: 63.27 }, { from: '2029-07-01', usd: 65.93 },
];
/** A house's charge a month, in the town's money, where it isn't on a schedule. */
const MONTHLY: Readonly<Record<string, number>> = {
  'ca-on-toronto': 317.85 / 12,
  'ca-bc-vancouver': (117 + 189) / 12,
};

/** The EPA's household waste a person in Ireland in 2020, kg a year, and the share of it in the black bin (Panda citing the EPA). */
export const IE_HOUSEHOLD_WASTE_KG = 372;
export const IE_BLACK_BIN_SHARE = 0.39;
/** The City Bin Co.'s Dublin plans: a month's price, its general-waste allowance in kg, and 30c a kg over it. */
export const DUBLIN_BIN_PLANS: readonly { plan: string; eur: number; kg: number }[] = [
  { plan: 'City Lite', eur: 24, kg: 30 }, { plan: 'City Essential', eur: 26.49, kg: 42 }, { plan: 'City Extra', eur: 30.49, kg: 65 },
];
export const DUBLIN_EXCESS_PER_KG = 0.3;

/** A Dublin household's month of black-bin waste, in kg: each of them a twelfth of the EPA's 39% of 372 kg. */
export const dublinBlackBinKg = (people: number): number => (people * IE_HOUSEHOLD_WASTE_KG * IE_BLACK_BIN_SHARE) / 12;

/** The least a Dublin household pays a month in euros, over The City Bin Co.'s plans, for its black bin's kg. */
export function dublinBinEur(kg: number): number {
  return Math.min(...DUBLIN_BIN_PLANS.map((p) => p.eur + Math.max(0, kg - p.kg) * DUBLIN_EXCESS_PER_KG));
}

export const wasteServiceIn = (cityId: string): WasteService | undefined => WASTE_SERVICES.find((w) => w.cityId === cityId);

/** The month's rubbish collection for their home, in the save's money; nothing where it's in something else or not known. */
export function wasteFeeOf(sim: Simulation, person: Person): Money {
  const home = person.home;
  if (!home || home.kind === 'sofa' || home.kind === 'shared') return 0;
  const place = homePlace(sim, person);
  if (!place || place.shared || isFlat(place.type)) return 0;
  const service = wasteServiceIn(home.cityId);
  if (!service) return 0;
  let local = MONTHLY[home.cityId];
  if (home.cityId === 'ie-lei-dublin') local = dublinBinEur(dublinBlackBinKg(householdOf(person)));
  if (home.cityId === 'us-ca-losangeles') {
    const p = zonedParts(sim.now, CITIES.require(home.cityId).timeZone);
    const today = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
    local = [...LA_SOLID_RESOURCES].reverse().find((r) => r.from <= today)?.usd;
  }
  return local === undefined ? 0 : inSaveMoney(sim, Math.round(local * 100), service.currency);
}
