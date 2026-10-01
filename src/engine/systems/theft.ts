/**
 * SLATE — a vehicle stolen (docs/WORLD.md, stage 3j), from 2026-09-30,
 * researched in `docs/research/world/research-custom-effects.json`.
 *
 * Each month a road vehicle is kept where a rate is published, it may be
 * stolen at that rate (decider `vehicle.theft`), thefts over vehicles
 * registered:
 * - New York City: the NYPD's 13,523 grand larcenies of an auto in 2025 over
 *   the DMV's 2,180,335 vehicles in the five boroughs, 620 in 100,000.
 * - The rest of New York State: NICB's 24,206 for the state less the city's,
 *   over the rest of its 11,377,388 vehicles, 116 in 100,000.
 * - Los Angeles: NICB's 53,911 in its metro area over Los Angeles's and
 *   Orange's vehicles, 502 in 100,000; the rest of California, NICB's 136,988
 *   over the DMV's 36,190,654, 379.
 * - Ontario: Équité Association's 19,319 over 8.8 million light vehicles
 *   (Statistics Canada, 2024), 220.
 * - A bicycle or an e-bike in Britain, from later on 2026-09-30
 *   (`research-vehicles5.json`): the Crime Survey for England and Wales's 17.6
 *   thefts a year per 1,000 households owning one (year to March 2026), taken
 *   as an owner's; found again at Toronto Police's 1% (2014 to 2025, the only
 *   share published), else gone. No other place's rate is published.
 * Connecticut's, British Columbia's, London's, Ireland's and Mexico City's
 * counts come without a count of vehicles to set them against, and none is
 * drawn there.
 *
 * Recovered at the published share (Ontario's 51%, Équité 2025), or Canada's
 * 59% for an American car, the US publishing none: SLATE's estimate. A car
 * recovered comes back a month on (no time to recovery is published, SLATE's
 * estimate) and nothing is paid. One not recovered is paid at its value under
 * full cover, the loan paid off from it first, as an insurer pays the lender;
 * liability cover pays nothing, and a loan on it is still owed, month by month.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import type { CarModel } from '../content/vehiclecatalog';
import type { OwnedVehicle } from './vehicles';

const NYC = new Set(['us-ny-newyork', 'us-ny-brooklyn', 'us-ny-queens', 'us-ny-manhattan', 'us-ny-thebronx', 'us-ny-statenisland']);

export const THEFT = {
  /** Thefts a year per 100,000 vehicles. */
  nyc: 13_523 / 2_180_335 * 1e5,
  nyRest: (24_206 - 13_523) / (11_377_388 - 2_180_335) * 1e5,
  losAngeles: 502,
  california: 136_988 / 36_190_654 * 1e5,
  ontario: 19_319 / 8_800_000 * 1e5,
  bicycleEngland: 17.6 / 1_000 * 1e5,
  recovered: { ontario: 0.51, canada: 0.59, bicycle: 0.01 },
  recoverDays: 30,
} as const;

/** Thefts a year per 100,000 where a vehicle is kept, or nothing where none is published with a count of vehicles. */
export function theftRate(v: Pick<OwnedVehicle, 'jurisdiction' | 'cityId' | 'at'>, m?: CarModel): number | undefined {
  const city = v.at ?? v.cityId;
  if (m && pedaled(m)) return v.jurisdiction === 'GB' ? THEFT.bicycleEngland : undefined;
  switch (v.jurisdiction) {
    case 'US-NY': return NYC.has(city) ? THEFT.nyc : THEFT.nyRest;
    case 'US-CA': return city === 'us-ca-losangeles' ? THEFT.losAngeles : THEFT.california;
    case 'CA-ON': return THEFT.ontario;
    default: return undefined;
  }
}

/** Whether a kind's thefts are counted: not an ATV's, whose aren't published. A bicycle's and an e-bike's are, in Britain. */
const counted = (m: CarModel) => (m.kind ?? 'car') !== 'atv';
const pedaled = (m: CarModel) => m.kind === 'bicycle' || m.kind === 'ebike';

/** A stolen vehicle off the books: nothing more is owed on it. */
export function gone(sim: Simulation, v: OwnedVehicle): void {
  v.soldAt = sim.now;
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.payload.vehicleId === v.id) sim.timeline.cancel(item.id, sim.now);
}

/** Whether a vehicle is gone, stolen and not yet back. */
export const stolenNow = (v: OwnedVehicle, at: number) => Boolean(v.stolen && (v.stolen.recoverAt === undefined || v.stolen.recoverAt > at));

/**
 * A month's chance of the vehicle stolen, drawn; what follows it. Returns
 * true when it was stolen this month. The odds are the published rates', a
 * test's where it gives them.
 */
export function mayBeStolen(sim: Simulation, person: Person, v: OwnedVehicle, m: CarModel, value: Money, currency: string, odds: { stolen?: number; recovered?: number } = {}): boolean {
  if (v.stolen || v.soldAt !== undefined || v.repossessed || !counted(m)) return false;
  const rate = theftRate(v, m);
  if (rate === undefined) return false;
  const rng = sim.rng('vehicle.theft', v.id, sim.now);
  if (rng.next() >= (odds.stolen ?? 1 - Math.exp(-rate / 1e5 / 12))) return false;
  const back = rng.next() < (odds.recovered ?? (pedaled(m) ? THEFT.recovered.bicycle : v.jurisdiction === 'CA-ON' ? THEFT.recovered.ontario : THEFT.recovered.canada));
  const label = `${m.make} ${m.model}`;
  const mine = person.id === sim.universe.playerId;
  if (back) {
    v.stolen = { at: sim.now, recoverAt: sim.now + THEFT.recoverDays * MS_DAY };
    if (mine) sim.notify({ category: 'home', title: 'Your Vehicle Was Stolen', body: `The ${label} was stolen. The police found it, and it’s yours again from ${formatDate(v.stolen.recoverAt!, sim.zone)}.`, importance: 75, route: '/workspace/vehicles' });
    return true;
  }
  v.stolen = { at: sim.now };
  const cur = saveCurrency(sim.universe);
  if (v.coverage === 'full') {
    // The insurer pays its value: the lender first, the rest to the owner.
    const paid = currency === cur ? value : exchange(value, currency, cur) ?? value;
    const owed = Math.min(paid, v.loan?.owed ?? 0);
    sim.post({ memo: `The ${label}, stolen, paid by the insurer`, category: 'vehicle', postings: [
      { accountId: person.primaryAccountId!, amount: paid - owed },
      ...(owed > 0 ? [{ accountId: sim.nominalAccount('liability_other', 'Car Loans').id, amount: owed }] : []),
      { accountId: sim.nominalAccount('income', 'Insurance Paid').id, amount: -paid },
    ] });
    if (v.loan) { v.loan.owed -= owed; if (v.loan.owed <= 0) delete v.loan; }
    // Gone for good; a loan bigger than the car is still owed, and its months run on (`systems/vehicles.ts`).
    if (!v.loan) gone(sim, v);
    if (mine) sim.notify({ category: 'home', title: 'Your Vehicle Was Stolen', body: `The ${label} was stolen and not found. Your full cover paid ${formatMoney(paid, cur)}${owed > 0 ? `, ${formatMoney(owed, cur)} of it to the lender` : ''}.`, importance: 80, route: '/workspace/vehicles' });
  } else if (mine) {
    sim.notify({ category: 'home', title: 'Your Vehicle Was Stolen', body: `The ${label} was stolen and not found. Liability cover pays nothing for it${v.loan ? ', and its loan is still owed' : ''}.`, importance: 85, route: '/workspace/vehicles' });
  }
  return true;
}
