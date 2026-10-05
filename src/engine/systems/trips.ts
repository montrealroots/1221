/**
 * SLATE — a trip out on errands (Stage 7 of `docs/BACKLOG.md`, from
 * 2026-10-01; the figures in `content/errandtrips.ts`).
 *
 * A trip is a plan of stops in the town you're in, each the same command a
 * screen runs, a shop by its own hours, with a leg on the road before each
 * and one home at the end (`runErrands`). On foot a leg is England's
 * average walk at three miles an hour. By car it's the average trip of its
 * kind at the town's TomTom minutes a kilometer, with its fuel, which is
 * paid at a station: at a fuel stop on the way, or the town's first one at
 * the end. A car's errand kilometers come out of the month's everyday
 * driving, which is the rest of the place's average (`errandKm`), so no
 * kilometer's fuel is paid twice, and carry the road's risks as it does. A stop with the car parked pays its meter
 * for the minutes it took. People you know can come along: the trip's
 * hours are time together (`systems/people.ts`). In a car, as many as its
 * maker's seats hold beside the driver, a hired driver taking one (its
 * seats in `content/caroptions.ts`; one where they weren't read, as before
 * 2026-10-02, when only one could come); on foot, any number. One at work
 * then can't come (`systems/availability.ts`).
 *
 * **By transit** (from 2026-10-03): a ride on the town's own buses or
 * trains for each leg, at its adult fare (`content/transit.ts`), paid as
 * the leg sets out, and the half hour rail's station rides take, SLATE's
 * estimate; what's bought is carried, as on foot, and anybody along pays
 * their own fare. A town whose fare isn't kept has no transit trip.
 *
 * **Bringing it in** (from 2026-10-03, the owner's expansion; until then
 * it was put away the moment the trip was home): what was bought stays where
 * it rode, in the car or in your arms, until you put it away (`items.put_away`),
 * thing by thing or all at once, where it keeps or where you choose, the
 * home's room for it checked as any move is. Food that needed the fridge and
 * was out past USDA's two hours goes in the bin when it's brought in, and
 * food in the car isn't cooked from. Putting it all away on getting home is
 * a shortcut you can set (`life.set_automation`), on the same rules.
 *
 * Not kept: a ticket for an unpaid or overstayed meter, SLATE always
 * paying for the time; how often meters are checked isn't published.
 */

import type { Simulation, CommandResult } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { FUEL_STOP_MINUTES, LEG_KM, METER, MIN_PER_KM, STATIONS, WALK_KM, WALK_KMH, type LegKind } from '../content/errandtrips';
import { UNRATED_FUEL_USD_PER_KM } from '../content/vehiclefees';
import { spend } from './household';
import { meterFree } from './access';
import { inSaveMoney } from './banking';
import { GARAGES, type Garage } from '../content/garages';
import { atWork, atWorkReason } from './availability';
import { contactsOf } from './people';
import { laidUp } from './repairs';
import { stolenNow } from './theft';
import { mayDrive } from './documents';
import { classFor, forOutings, kindOf, modelById, runningCost, vehiclesOf, type OwnedVehicle } from './vehicles';
import { drive } from './driving';
import { standInFor } from './standin';
import { DRIVERS, type DriverService } from '../content/drivers';
import { formatDate, type Instant , zonedParts } from '../core/time';
import { tireFactor } from './tires';
import { homeKeyOf, itemById, itemsOf, moveRefusal, volumeOf, type Item, type Place, type Spot } from './items';
import { specOf } from './caroptions';
import { burn, capacityOf, levelOf, rangeKm } from './fueltank';
import { TRANSIT } from '../content/transit';
import { rateOn } from '../content/career';
import { STATION_RIDE_MINUTES } from './rail';

export type TripMode = 'car' | 'foot' | 'transit';

/** A ride's fare on the town's transit on a day, in the save's money, or nothing where the town's fare isn't kept. */
export function transitFare(sim: Simulation, cityId: string, at: Instant = sim.now): Money | undefined {
  const t = TRANSIT[cityId];
  if (!t) return undefined;
  const amount = rateOn(t.steps, new Date(at).toISOString().slice(0, 10));
  const cur = saveCurrency(sim.universe);
  return cur === t.currency ? amount : exchange(amount, t.currency, cur) ?? amount;
}

export interface Trip { /** What was bought on the way, carried or in the car until the trip is home (from 2026-10-02). */ shopping?: { itemId: string; spot?: Spot; at: Instant }[]; by: TripMode; vehicleId?: string; passengerId?: string; /** From 2026-10-02, everybody along; `passengerId` was the only one before. */ passengerIds?: string[]; fuel: Money; km: number; /** Out in the car's stand-in, its rental's id (`systems/standin.ts`). */ standInId?: string; /** A driver hired to drive it, and when they set out (`content/drivers.ts`, from 2026-10-01). */ driver?: { id: string; from: Instant } }
export interface Stop { kind: string; payload: Record<string, unknown>; leg: LegKind }

const market = (cityId: string): 'na' | 'eu' => (['us', 'ca'].includes(CITIES.get(cityId)?.countryId ?? '') ? 'na' : 'eu');

/** A leg's kilometers and minutes in a town, by car or on foot. */
export function leg(cityId: string, by: TripMode, kind: LegKind): { km: number; minutes: number } {
  if (by === 'foot') return { km: WALK_KM, minutes: (WALK_KM / WALK_KMH) * 60 };
  const km = LEG_KM[market(cityId)][kind];
  if (by === 'transit') return { km, minutes: STATION_RIDE_MINUTES };
  return { km, minutes: km * (MIN_PER_KM[cityId] ?? 58 / 60) };
}

/** What parking a stop costs in the save's money, or nothing where no rate is published. */
export function meterCost(sim: Simulation, cityId: string, minutes: number, person?: Person, at: Instant = sim.now): Money {
  const m = METER[cityId];
  if (!m || minutes <= 0) return 0;
  // Free with a disability permit where the town lets holders park free (`systems/access.ts`, from 2026-10-02).
  if (person && meterFree(person, cityId)) return 0;
  // Free on the days the town doesn't charge (from 2026-10-03).
  if (m.freeOn?.includes(zonedParts(at, CITIES.require(cityId).timeZone).weekday)) return 0;
  // Each hour at its own price where the town raises it hour by hour, as New York does.
  let units = 0;
  for (let h = 0; h * 60 < minutes; h += 1) units += (m.hourly?.[h] ?? m.hourly?.[m.hourly.length - 1] ?? m.perHour) * (Math.min(60, minutes - h * 60) / 60);
  const cents = Math.round(units * 100);
  const cur = saveCurrency(sim.universe);
  return cur === m.currency ? cents : exchange(cents, m.currency, cur) ?? cents;
}

/** Why the car can't stay at the meter that long, or nothing: the town's longest stay (from 2026-10-03). */
export function meterRefusal(cityId: string, minutes: number): string | undefined {
  const max = METER[cityId]?.maxHours;
  return max !== undefined && minutes > max * 60 ? `The meters here take ${max} ${max === 1 ? 'hour' : 'hours'} at most: a garage takes it longer.` : undefined;
}

/** The garages in a town an errand's car can be left at instead of the meter (`content/garages.ts`, from 2026-10-02). */
export const garagesIn = (cityId: string): Garage[] => GARAGES.filter((g) => g.cityId === cityId);

/** A garage's charge for so many minutes, by its own units up to its day's maximum, in the save's money. */
export function garageCost(sim: Simulation, g: Garage, minutes: number, ev = false): Money {
  if (minutes <= 0) return 0;
  const units = Math.ceil(minutes / g.unitMinutes - 1e-9);
  const local = Math.min(units * (ev && g.evUnitPrice !== undefined ? g.evUnitPrice : g.unitPrice), g.dailyMax ?? Infinity);
  return inSaveMoney(sim, Math.round(local * 100), g.currency);
}

/** The driver for hire in a town, if one publishes its price. */
export const driverIn = (cityId: string): DriverService | undefined => DRIVERS.find((d) => d.cityId === cityId);

/** What a hired driver costs for a trip's minutes and kilometers, with its tax, in the save's money. */
export function driverCost(sim: Simulation, d: DriverService, minutes: number, km: number): Money {
  const units = d.perHour !== undefined ? d.perHour * Math.max(d.minHours ?? 0, minutes / 60) : (d.pickup ?? 0) + (d.perKm ?? 0) * km;
  const cents = Math.round(units * (1 + d.tax) * 100);
  const cur = saveCurrency(sim.universe);
  return cur === d.currency ? cents : exchange(cents, d.currency, cur) ?? cents;
}

/** Why a trip can't start this way, or nothing. */
export function tripRefusal(sim: Simulation, person: Person, by: TripMode, vehicleId?: string, passengers?: string | readonly string[], driven = false): string | undefined {
  const along = passengers === undefined ? [] : typeof passengers === 'string' ? [passengers] : [...passengers];
  const here = person.currentLocationId;
  if (by === 'transit' && transitFare(sim, here) === undefined) return `${CITIES.get(here)?.name ?? 'This town'}’s transit fare isn’t kept, so it can’t be taken here.`;
  if (by === 'car') {
    const v = vehiclesOf(person).find((x) => x.id === vehicleId && x.soldAt === undefined);
    if (!v) return 'That isn’t a car you own.';
    const m = modelById(v.modelId)!;
    if (forOutings(m)) return 'A bicycle or an ATV isn’t for errands here.';
    if ((v.at ?? v.cityId) !== here) return `The car is in ${CITIES.require(v.at ?? v.cityId).name}.`;
    if (v.repossessed) return 'The lender has the car.';
    // Ordered from the factory, it isn't yours to drive until it comes (`systems/caroptions.ts`).
    if (v.deliveredAt !== undefined && v.deliveredAt > sim.now) return `It’s on order: it comes ${formatDate(v.deliveredAt, sim.zone)}.`;
    if (stolenNow(v, sim.now)) return 'It’s been stolen.';
    // In the shop with a stand-in, it's the stand-in that goes (`systems/standin.ts`, from 2026-10-01).
    const laid = standInFor(person, v) ? undefined : laidUp(v, sim.now);
    if (laid) return laid;
    // A hired driver drives it: your license and your blood alcohol don't come into it.
    if (driven) {
      if (!driverIn(here)) return 'Nobody here drives your own car for a published price.';
    } else {
      const may = mayDrive(person, here, sim.now, sim.now, classFor(m), m.cc);
      if (!may.ok) return may.why ?? 'You may not drive here.';
    }
  }
  if (by === 'car' && along.length > 0) {
    const v = vehiclesOf(person).find((x) => x.id === vehicleId)!;
    const seats = specOf(v.modelId)?.seats;
    const room = seats ? seats - 1 - (driven ? 1 : 0) : 1;
    if (along.length > room) return room <= 0 ? 'There’s no seat for anybody else.' : `It seats ${room} beside ${driven ? 'you and the driver' : 'you'}.`;
  }
  for (const id of along) {
    const c = contactsOf(person).find((x) => x.id === id);
    if (!c) return 'You don’t know them.';
    if (c.rival) return `${c.name.split(' ')[0]} would rather not.`;
    if (c.cityId !== here) return `${c.name.split(' ')[0]} lives in ${CITIES.require(c.cityId).name}.`;
    if (atWork(sim, c, sim.now, 60)) return atWorkReason(c);
  }
  return undefined;
}

/**
 * USDA's two-hour rule: food that keeps cold isn't safe after two hours out
 * of the fridge, so chilled or frozen shopping out longer than that on a trip
 * is thrown away when it's home. The one-hour rule over 90°F isn't kept.
 */
export const COLD_CHAIN_HOURS = 2;

/**
 * Something bought while out: in your own car on a car trip, or carried, until
 * the trip is home, then put away where it keeps (from 2026-10-02; until then
 * it was home the moment it was paid for). Bought with no trip, it's home now.
 */
export function stow(person: Person, item: Item, at: Instant): void {
  const trip = person.trip;
  if (!trip || item.at.kind !== 'home') return;
  const inCar = trip.by === 'car' && trip.vehicleId && !trip.standInId;
  // The car holds what its maker says it does, seats up, or a pickup's bed (`content/caroptions.ts`); what won't fit isn't bought.
  if (inCar) {
    const v = (person.vehicles ?? []).find((x) => x.id === trip.vehicleId);
    const spec = v ? specOf(v.modelId) : undefined;
    // And a roof box's liters where one's on (`systems/roofbox.ts`, from 2026-10-03).
    const own = spec?.cargoL ?? spec?.bedL;
    const holds = own === null || own === undefined ? own : own + (v?.roofBoxL ?? 0);
    if (holds !== null && holds !== undefined) {
      const used = itemsOf(person).filter((i) => i.at.kind === 'vehicle' && i.at.vehicleId === trip.vehicleId).reduce((a, i) => a + volumeOf(i) * i.quantity, 0);
      if (used + volumeOf(item) * item.quantity > holds + 1e-9) throw new CommandError(`It won’t fit in the car: ${Math.max(0, Math.floor(holds - used))} liters of its ${holds} are left.`);
    }
  }
  (trip.shopping ??= []).push({ itemId: item.id, ...(item.at.spot ? { spot: item.at.spot } : {}), at });
  if (item.at.spot) item.storeIn = item.at.spot;
  item.at = inCar ? { kind: 'vehicle', vehicleId: trip.vehicleId! } : { kind: 'person' };
}

/** Shopping not yet put away: bought on a trip, in a car or in their arms. */
export const waitingShopping = (person: Person): Item[] => itemsOf(person).filter((i) => i.storeIn !== undefined && (i.at.kind === 'vehicle' || i.at.kind === 'person'));

/** Out of the cold too long to keep: food that needs the fridge or freezer, bought more than USDA's two hours ago. */
export const outTooLong = (item: Item, now: Instant): boolean => (item.storeIn === 'fridge' || item.storeIn === 'freezer') && now - item.acquiredAt > COLD_CHAIN_HOURS * 3_600_000;

/**
 * Shopping put away at home, each where it keeps or where chosen, checked as
 * any move is; chilled food out past the two hours thrown out. What went
 * where, what was thrown out, and what couldn't go and why.
 */
export function putAway(sim: Simulation, person: Person, items: Item[], spot?: Spot): { put: number; spoiled: number; refused: { label: string; why: string }[] } {
  const home = homeKeyOf(person.home);
  let put = 0;
  let spoiled = 0;
  const refused: { label: string; why: string }[] = [];
  for (const item of items) {
    if (!home) { refused.push({ label: item.label, why: 'You have no home to put it in.' }); continue; }
    if (item.food && outTooLong(item, sim.now)) {
      person.items = (person.items ?? []).filter((i) => i.id !== item.id);
      spoiled += 1;
      continue;
    }
    const to: Place = { kind: 'home', home, ...(spot ?? item.storeIn ? { spot: spot ?? item.storeIn } : {}) };
    const no = moveRefusal(sim, person, item, to);
    if (no) { refused.push({ label: item.label, why: no }); continue; }
    item.at = to;
    delete item.storeIn;
    put += 1;
  }
  if (spoiled && person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'Shopping Left Out Too Long', body: `${spoiled} of what needed the fridge was out more than ${COLD_CHAIN_HOURS} hours, USDA's limit, and went in the bin.`, importance: 40, route: '/workspace/belongings' });
  return { put, spoiled, refused };
}

const carOf = (person: Person, trip: Trip): OwnedVehicle | undefined => (trip.vehicleId ? vehiclesOf(person).find((v) => v.id === trip.vehicleId) : undefined);

function payFuel(sim: Simulation, person: Person, trip: Trip, station: string): Money {
  const paid = trip.fuel;
  if (paid > 0) spend(sim, person, paid, `Fuel at ${station}`, 'vehicle', true);
  trip.fuel = 0;
  return paid;
}

export function registerTrips(sim: Simulation): void {
  // The shopping put away: these, or all that's waiting, where each keeps or where chosen.
  sim.onCommand<{ itemIds?: string[]; spot?: Spot }, { put: number; spoiled: number; refused: { label: string; why: string }[] }>('items.put_away', (p, { sim: s }) => {
    const person = s.player;
    const waiting = waitingShopping(person);
    const chosen = p?.itemIds?.length ? p.itemIds.map((id) => waiting.find((i) => i.id === id)).filter((x): x is Item => Boolean(x)) : waiting;
    if (!chosen.length) throw new CommandError('There’s no shopping waiting to be put away.');
    const r = putAway(s, person, chosen, p?.spot);
    if (r.put === 0 && r.spoiled === 0) throw new CommandError(r.refused[0]!.why);
    return r;
  });


  // A leg on the road: to the next stop, or home, which ends the trip.
  sim.onCommand<{ to: LegKind | 'home'; by?: TripMode; vehicleId?: string; passengerId?: string; passengerIds?: string[]; driven?: boolean }, { minutes: number; km: number }>('errand.go', (p, { sim: s }) => {
    const person = s.player;
    let trip = person.trip;
    if (!trip) {
      if (p?.to === 'home') throw new CommandError('You’re home already.');
      const by: TripMode = p?.by === 'car' ? 'car' : p?.by === 'transit' ? 'transit' : 'foot';
      const driven = by === 'car' && p?.driven === true;
      const along = p?.passengerIds?.map(String) ?? (p?.passengerId ? [String(p.passengerId)] : []);
      const no = tripRefusal(s, person, by, p?.vehicleId, along, driven);
      if (no) throw new CommandError(no);
      const own = by === 'car' ? vehiclesOf(person).find((x) => x.id === p!.vehicleId) : undefined;
      const standIn = own ? standInFor(person, own) : undefined;
      trip = person.trip = { by, ...(by === 'car' ? { vehicleId: String(p!.vehicleId) } : {}), ...(along.length ? { passengerIds: along } : {}), fuel: 0, km: 0, ...(standIn ? { standInId: standIn.id } : {}), ...(driven ? { driver: { id: driverIn(person.currentLocationId)!.id, from: s.now } } : {}) };
    }
    const here = person.currentLocationId;
    const l = leg(here, trip.by, p?.to === 'errand' ? 'errand' : 'shopping');
    // On transit, the leg's fare, paid as it sets out.
    if (trip.by === 'transit') {
      const fare = transitFare(s, here) ?? 0;
      if (fare > 0 && !spend(s, person, fare, `${CITIES.get(here)?.name ?? 'The town'}’s transit, a ride`, 'personal')) throw new CommandError('The fare can’t be paid.');
    }
    const v = carOf(person, trip);
    // Your own car runs on what's in its tank (`systems/fueltank.ts`, from 2026-10-02): a leg it can't make is refused
    // here, and the leg's upkeep is the month's. Until then each leg's fuel was charged, and paid at the end.
    const tanked = v && !trip.standInId && capacityOf(modelById(v.modelId)!) !== undefined;
    if (tanked && !burn(v, l.km)) throw new CommandError(`There isn’t enough in the tank to get there: ${Math.round(rangeKm(v) ?? 0)} km left, and the leg is ${l.km.toFixed(1)}. Stop for fuel first.`);
    if (v && tanked) {
      v.errandKm = (v.errandKm ?? 0) + l.km;
      v.km = (v.km ?? 0) + l.km;
      if (!trip.driver) drive(s, person, v.jurisdiction, l.km, s.now, `${v.id}-errand-${s.now}`, kindOf(modelById(v.modelId)!), tireFactor(v, s.now));
    } else if (v && trip.driver) {
      // Driven by the driver hired: the car's fuel and kilometers, and none of the road's risks to you.
      trip.fuel += runningCost(s, v, l.km);
      v.errandKm = (v.errandKm ?? 0) + l.km;
      v.km = (v.km ?? 0) + l.km;
    } else if (v && trip.standInId) {
      // The stand-in, at AAA's average fuel a mile; the car itself gains no kilometers.
      const usd = Math.round(UNRATED_FUEL_USD_PER_KM * l.km);
      const cur = saveCurrency(s.universe);
      trip.fuel += cur === 'USD' ? usd : exchange(usd, 'USD', cur) ?? usd;
      drive(s, person, v.jurisdiction, l.km, s.now, `${trip.standInId}-errand-${s.now}`, 'car');
    } else if (v) {
      trip.fuel += runningCost(s, v, l.km);
      v.errandKm = (v.errandKm ?? 0) + l.km;
      v.km = (v.km ?? 0) + l.km;
      // And what the road brings, as the month's driving does (`systems/driving.ts`).
      drive(s, person, v.jurisdiction, l.km, s.now, `${v.id}-errand-${s.now}`, kindOf(modelById(v.modelId)!), tireFactor(v, s.now));
    }
    trip.km += l.km;
    s.advanceTo(s.now + Math.round(l.minutes * 60_000));
    const along = (trip.passengerIds ?? (trip.passengerId ? [trip.passengerId] : [])).map((id) => contactsOf(person).find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => Boolean(x));
    for (const c of along) { c.hours += l.minutes / 60; c.lastSeen = s.now; }
    if (p?.to === 'home') {
      // Put away on getting home only where that's the shortcut chosen; otherwise it waits where it rode.
      const bought = (trip.shopping ?? []).map((x) => itemById(person, x.itemId)).filter((x): x is Item => Boolean(x) && x!.storeIn !== undefined);
      if (bought.length && person.automation?.unloadShopping) putAway(s, person, bought);
      else if (bought.length && person.id === s.universe.playerId) s.notify({ category: 'home', title: 'The Shopping Is Still Out', body: `${bought.length} ${bought.length === 1 ? 'thing is' : 'things are'} ${trip.by === 'car' ? 'in the car' : 'in your arms'}. Put ${bought.length === 1 ? 'it' : 'them'} away; what needs the fridge keeps two hours out.`, importance: 35, route: '/workspace/belongings' });
      if (trip.fuel > 0) payFuel(s, person, trip, (STATIONS[here] ?? ['a station'])[0]!);
      if (trip.driver) {
        const d = DRIVERS.find((x) => x.id === trip!.driver!.id)!;
        spend(s, person, driverCost(s, d, (s.now - trip.driver.from) / 60_000, trip.km), `${d.name}, driving your car`, 'vehicle', true);
      }
      for (const c of along) c.memory.unshift({ at: s.now, what: `Came along on your errands, ${trip.km.toFixed(1)} km` });
      delete person.trip;
    }
    return { minutes: l.minutes, km: l.km };
  });

  // The meter, for the minutes a stop took, with the car parked at it.
  sim.onCommand<{ minutes: number; garageId?: string }, { paid: Money; overstayed?: number }>('errand.park', (p, { sim: s }) => {
    const person = s.player;
    if (!person.trip || person.trip.by !== 'car') throw new CommandError('You aren’t out in the car.');
    const minutes = Math.max(0, Number(p?.minutes) || 0);
    // A garage of the town's, where one was chosen (from 2026-10-02); the meter otherwise.
    const garage = p?.garageId ? garagesIn(person.currentLocationId).find((g) => g.id === p.garageId) : undefined;
    if (p?.garageId && !garage) throw new CommandError('There’s no such garage in this town.');
    if (garage) {
      const ev = modelById(vehiclesOf(person).find((v) => v.id === person.trip!.vehicleId)?.modelId ?? '')?.fuel === 'ev';
      const paid = garageCost(s, garage, minutes, ev);
      if (paid > 0 && !spend(s, person, paid, `Parking, ${garage.name}`, 'vehicle')) throw new CommandError('The garage didn’t take the payment.');
      return { paid };
    }
    // A meter takes no more than its longest stay (from 2026-10-03): a stop past it is paid to the limit and overstayed, and a
    // ticket for it isn't charged, how often meters are checked being unpublished.
    const max = METER[person.currentLocationId]?.maxHours;
    const metered = max !== undefined ? Math.min(minutes, max * 60) : minutes;
    const paid = meterCost(s, person.currentLocationId, metered, person);
    if (paid > 0 && !spend(s, person, paid, `Parking, ${METER[person.currentLocationId]!.zone}`, 'vehicle')) throw new CommandError('The meter didn’t take the payment.');
    if (metered < minutes && person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'Over The Meter’s Limit', body: `${meterRefusal(person.currentLocationId, minutes)} The car stood ${Math.round(minutes - metered)} minutes past it.`, importance: 25, route: '/workspace/routines' });
    return { paid, ...(metered < minutes ? { overstayed: minutes - metered } : {}) };
  });

  // A stop for fuel, at one of the town's stations: the trip's fuel paid there.
  sim.onCommand<{ station?: number }, { paid: Money }>('errand.fuel', (p, { sim: s }) => {
    const person = s.player;
    const trip = person.trip;
    if (!trip || trip.by !== 'car') throw new CommandError('You aren’t out in the car.');
    const stations = STATIONS[person.currentLocationId] ?? [];
    const station = stations[Math.max(0, Math.min(stations.length - 1, Number(p?.station) || 0))] ?? 'a station';
    // Your own car's tank filled there, as Fill Up fills it (`systems/fueltank.ts`).
    const v = carOf(person, trip);
    if (v && !trip.standInId && capacityOf(modelById(v.modelId)!) !== undefined) {
      if (levelOf(v) >= 1 - 1e-6) { s.advanceTo(s.now + FUEL_STOP_MINUTES * 60_000); return { paid: payFuel(s, person, trip, station) }; }
      return s.execute<{ paid: Money }>({ kind: 'vehicle.refuel', payload: { vehicleId: v.id, station: Number(p?.station) || 0 } }).value ?? { paid: 0 };
    }
    s.advanceTo(s.now + FUEL_STOP_MINUTES * 60_000);
    return { paid: payFuel(s, person, trip, station) };
  });
}

export interface ErrandRun { done: number; stopped?: { step: number; error: string } }

/**
 * Runs a trip: a leg to each stop and the stop itself, the meter paid for
 * the time the stop took when by car, and the way home, through the
 * executor given. It stops at the first stop that can't be done, and still
 * comes home.
 */
export function runErrands(sim: Simulation, plan: { by: TripMode; vehicleId?: string; passengerId?: string; passengerIds?: string[]; driven?: boolean; garageId?: string; stops: Stop[] }, exec: (kind: string, payload: Record<string, unknown>) => CommandResult = (kind, payload) => sim.execute({ kind, payload })): ErrandRun {
  let done = 0;
  let stopped: ErrandRun['stopped'];
  for (const [i, stop] of plan.stops.entries()) {
    const go = exec('errand.go', { to: stop.leg, ...(i === 0 ? { by: plan.by, vehicleId: plan.vehicleId, passengerId: plan.passengerId, ...(plan.passengerIds ? { passengerIds: plan.passengerIds } : {}), ...(plan.driven ? { driven: true } : {}) } : {}) });
    if (!go.ok) return { done, stopped: { step: i, error: go.error ?? 'You couldn’t set out.' } };
    const before = sim.now;
    const r = exec(stop.kind, stop.payload);
    if (plan.by === 'car' && stop.kind !== 'errand.fuel') exec('errand.park', { minutes: (sim.now - before) / 60_000, ...(plan.garageId ? { garageId: plan.garageId } : {}) });
    if (!r.ok) { stopped = { step: i, error: r.error ?? 'It couldn’t be done.' }; break; }
    done += 1;
  }
  if (sim.player.trip) exec('errand.go', { to: 'home' });
  return { done, ...(stopped ? { stopped } : {}) };
}
