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
 * Connecticut's, British Columbia's, Ireland's and Mexico City's counts come
 * without a count of vehicles to set them against, and none is drawn there.
 *
 * **England and Wales, by where it's kept**, from 2026-10-03
 * (`research-watches-pawn-parking.json`): the Crime Survey's thefts of
 * vehicles, 3.42 a year per 1,000 vehicle-owning households, and thefts
 * from them, 19.05 (year to March 2026), taken as a car's; the share of the
 * year before's incidents at home off the street (50.9% of thefts of, 41%
 * of thefts from) and on the street at home (16.1%, 39.1%), over the share
 * of cars kept there overnight (the National Travel Survey's NTS0908,
 * England 2024: 72.4% off the street, a garage or a drive, and 24.6% on
 * it), and the incidents away from home at their own share for every car.
 * Kept off the street, a car is stolen at 3.54 a 1,000 and broken into at
 * 14.6; on the street, 3.37 and 34.1. A garage and a drive are taken
 * together, the survey's garage alone resting on some fourteen incidents.
 * A car is kept in its owner's garage where their home has one, on the
 * street otherwise, or where they say. Broken into, it loses what's fitted
 * worth taking, its stereo and the speakers and amplifier with it, paid
 * under full cover to the stereo's cap; one with nothing fitted isn't drawn,
 * nothing of the owner's being in it to take.
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
import { stereoCover } from './caraudio';
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
  /** England and Wales, a year per 1,000, and the shares that place them: theft of a vehicle and from one. */
  englandWales: {
    of: { perYear: 3.42, offStreet: 0.509, street: 0.161 },
    from: { perYear: 19.05, offStreet: 0.033 + 0.377, street: 0.391 },
    kept: { offStreet: 0.088 + 0.636, street: 0.246 },
  },
  recovered: { ontario: 0.51, canada: 0.59, bicycle: 0.01 },
  recoverDays: 30,
} as const;

export type KeptIn = 'garage' | 'street';
/** Where a car is kept overnight: where its owner says, or their garage where their home has one, else the street. */
export function keptIn(person: Person | undefined, v: Pick<OwnedVehicle, 'keptIn'>): KeptIn {
  if (v.keptIn) return v.keptIn;
  return person && hasGarage(person) ? 'garage' : 'street';
}
/** Whether the home they own and live in has a garage. */
export const hasGarage = (person: Person): boolean => {
  const h = person.home;
  return Boolean(h && h.kind === 'owned' && (person.homes ?? []).some((o) => o.id === h.homeId && o.facts.features.includes('garage')));
};
const englandOrWales = (city: string) => /^uk-(eng|wls)-/.test(city);
/** A year's thefts of or from a car per 100,000 in England and Wales where it's kept: the place's own share and the share away from home. */
export function englandRate(which: 'of' | 'from', where: KeptIn): number {
  const e = THEFT.englandWales;
  const r = e[which];
  const away = 1 - r.offStreet - r.street;
  const here = where === 'garage' ? r.offStreet / e.kept.offStreet : r.street / e.kept.street;
  return (r.perYear / 1_000) * (away + here) * 1e5;
}

/** Thefts a year per 100,000 where a vehicle is kept, or nothing where none is published with a count of vehicles. */
export function theftRate(v: Pick<OwnedVehicle, 'jurisdiction' | 'cityId' | 'at' | 'keptIn'>, m?: CarModel, person?: Person): number | undefined {
  const city = v.at ?? v.cityId;
  if (m && pedaled(m)) return v.jurisdiction === 'GB' ? THEFT.bicycleEngland : undefined;
  switch (v.jurisdiction) {
    case 'GB': return englandOrWales(city) ? englandRate('of', keptIn(person, v)) : undefined;
    case 'US-NY': return NYC.has(city) ? THEFT.nyc : THEFT.nyRest;
    case 'US-CA': return city === 'us-ca-losangeles' ? THEFT.losAngeles : THEFT.california;
    case 'CA-ON': return THEFT.ontario;
    default: return undefined;
  }
}

/** Whether a kind's thefts are counted: not an ATV's, whose aren't published. A bicycle's and an e-bike's are, in Britain. */
const counted = (m: CarModel) => (m.kind ?? 'car') !== 'atv';
const pedaled = (m: CarModel) => m.kind === 'bicycle' || m.kind === 'ebike';

/**
 * A month's chance of a car in England or Wales broken into where it's kept,
 * drawn (decider `vehicle.break_in`), for what's fitted worth taking: its
 * stereo and the parts with it gone, paid to the stereo's cap under full
 * cover. Whether it was broken into.
 */
export function mayBeBrokenInto(sim: Simulation, person: Person, v: OwnedVehicle, m: CarModel, value: Money, currency: string, odds?: number): boolean {
  if (v.stolen || v.soldAt !== undefined || !englandOrWales(v.at ?? v.cityId) || pedaled(m) || !(v.stereo || v.audio?.length)) return false;
  const rate = englandRate('from', keptIn(person, v));
  if (sim.rng('vehicle.break_in', v.id, sim.now).next() >= (odds ?? 1 - Math.exp(-rate / 1e5 / 12))) return false;
  const cur = saveCurrency(sim.universe);
  const paid = stereoCover(sim, v, currency === cur ? value : exchange(value, currency, cur) ?? value);
  delete v.stereo;
  delete v.audio;
  if (paid > 0) sim.post({ memo: `The ${m.make} ${m.model}’s stereo, stolen, paid by the insurer`, category: 'vehicle', postings: [{ accountId: person.primaryAccountId!, amount: paid }, { accountId: sim.nominalAccount('income', 'Insurance Paid').id, amount: -paid }] });
  if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'Your Car Was Broken Into', body: `The ${m.make} ${m.model}’s stereo was taken${keptIn(person, v) === 'street' ? ' where it was parked on the street' : ''}.${paid > 0 ? ` Your full cover paid ${formatMoney(paid, cur)}.` : ' Liability cover pays nothing for it.'}`, importance: 60, route: '/workspace/vehicles' });
  return true;
}

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
  const rate = theftRate(v, m, person);
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
    const car = currency === cur ? value : exchange(value, currency, cur) ?? value;
    // And a stereo fitted, to its cap (`stereoCover`, from 2026-10-02).
    const paid = car + stereoCover(sim, v, car);
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
