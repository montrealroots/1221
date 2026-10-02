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
 *   company's, in the service charge or the rent.
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

/** LA Sanitation's Solid Resources Fee, a month, from each date. */
export const LA_SOLID_RESOURCES: readonly { from: string; usd: number }[] = [
  { from: '2025-11-21', usd: 55.95 }, { from: '2026-07-01', usd: 59.53 }, { from: '2027-07-01', usd: 60.44 }, { from: '2028-07-01', usd: 63.27 }, { from: '2029-07-01', usd: 65.93 },
];
/** A house's charge a month, in the town's money, where it isn't on a schedule. */
const MONTHLY: Readonly<Record<string, number>> = {
  'ca-on-toronto': 317.85 / 12,
  'ca-bc-vancouver': (117 + 189) / 12,
  'ie-lei-dublin': 24,
};

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
  if (home.cityId === 'us-ca-losangeles') {
    const p = zonedParts(sim.now, CITIES.require(home.cityId).timeZone);
    const today = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
    local = [...LA_SOLID_RESOURCES].reverse().find((r) => r.from <= today)?.usd;
  }
  return local === undefined ? 0 : inSaveMoney(sim, Math.round(local * 100), service.currency);
}
