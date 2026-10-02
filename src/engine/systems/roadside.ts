/**
 * SLATE — breakdown cover, a tow, and a car that breaks down on the road
 * (the master plan's §40h, from 2026-10-02; the clubs and the prices in
 * `content/roadside.ts`).
 *
 * **Cover.** Join a club where you live, at its dues, a month or a year
 * ahead, renewed until you leave; a renewal the bank can't pay lets it
 * lapse. Its calls a year are counted from the day you joined. A tow is
 * free to the tier's kilometers, or anywhere in the country on a tier that
 * recovers you home; one longer tow a year on a tier that has it; past
 * that, the kilometers over are paid at the market's rate a kilometer, or in
 * Britain the statutory £192. AAA and CAA come out to each other's members
 * across North America; the British and Irish clubs only at home.
 *
 * **A tow.** A car that breaks down badly is towed: from home to the
 * garage, the town's average errand of a drive away (`content/errandtrips.ts`),
 * when its repair is booked; or on the road, onward to where it was going.
 * Without cover it's the market's tow, all of it; a bill the bank can't pay
 * is owed.
 *
 * **On the road.** A journey's own kilometers are driving on top of the
 * month's everyday driving, whose faults are drawn monthly
 * (`systems/repairs.ts`): so each driven journey draws a fault at its
 * model's RepairPal visits a year, over the kilometers a year a car is
 * driven there, for the journey's kilometers (decider `vehicle.roadfault`),
 * and where on the road it happens. An ordinary fault lights the check
 * engine light and the car goes on; a severe one stops it there, and it's
 * towed the rest of the way. How long the truck takes to come isn't kept:
 * no club publishes its waiting time for this research, so the arrival
 * stands.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, addMonths, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { KM_A_YEAR, type Jurisdiction } from '../content/vehiclefees';
import { LEG_KM } from '../content/errandtrips';
import { COVERAGE_OF, MX_CITY_TOW, ROADSIDE_TIERS, TOW_PRICES, type RoadsideTier } from '../content/roadside';
import { inSaveMoney } from './banking';
import { owe, spend } from './household';
import { reliabilityOf, repairUsd, faultCost } from './repairs';
import { jurisdictionOf, modelById, type OwnedVehicle } from './vehicles';
import type { Journey } from './journey';

export const ROADSIDE_RENEW_KIND = 'roadside.renew';

export interface Roadside {
  tierId: string;
  since: Instant;
  /** When the dues paid run out, and the next are taken. */
  renewAt: Instant;
  /** The membership year's start, and its calls and longer tows used. */
  yearFrom: Instant;
  used: number;
  longUsed: number;
}

export const tierById = (id: string): RoadsideTier | undefined => ROADSIDE_TIERS.find((t) => t.id === id);
export const membershipOf = (person: Person): Roadside | undefined => person.roadside;

/** The tiers a member living where they live can join, cheapest a year first. */
export function tiersFor(sim: Simulation, person: Person): RoadsideTier[] {
  const j = person.home ? jurisdictionOf(person.home.cityId) : undefined;
  if (!j) return [];
  return ROADSIDE_TIERS.filter((t) => t.homes.includes(j)).sort((a, b) => yearOf(sim, person, a) - yearOf(sim, person, b));
}

/** A period's dues, with tax where it's added, in the save's money; and the first's with joining's fee. */
export function duesOf(sim: Simulation, person: Person, t: RoadsideTier): { period: 'month' | 'year'; each: Money; first: Money } {
  const tax = t.plusTax && person.home ? salesTaxRate(person.home.cityId, sim.now, 'general') : 0;
  const local = (t.monthly ?? t.yearly ?? 0) * (1 + tax);
  const each = inSaveMoney(sim, Math.round(local * 100), t.currency);
  return { period: t.monthly !== undefined ? 'month' : 'year', each, first: each + inSaveMoney(sim, Math.round((t.enrollment ?? 0) * 100), t.currency) };
}
const yearOf = (sim: Simulation, person: Person, t: RoadsideTier): Money => { const d = duesOf(sim, person, t); return d.period === 'month' ? d.each * 12 : d.each; };

export function joinRefusal(sim: Simulation, person: Person, tierId: string): string | undefined {
  const t = tierById(tierId);
  if (!t) return 'There’s no such cover.';
  if (person.roadside) return `You’re a member of ${tierById(person.roadside.tierId)?.club ?? 'a club'} already.`;
  if (!tiersFor(sim, person).includes(t)) return `${t.club} is for members living in its area.`;
  return undefined;
}

const nextRenewal = (sim: Simulation, t: RoadsideTier, from: Instant): Instant => addMonths(from, t.monthly !== undefined ? 1 : 12, sim.homeZone);

/** The cover for a tow in a jurisdiction now: the tier, and what's left of it this year; nothing where none. */
function coverFor(sim: Simulation, person: Person, where: Jurisdiction): { tier: RoadsideTier; m: Roadside } | undefined {
  const m = person.roadside;
  const tier = m ? tierById(m.tierId) : undefined;
  if (!m || !tier || COVERAGE_OF[where] !== tier.covers) return undefined;
  // A new membership year, its calls afresh.
  while (sim.now >= addMonths(m.yearFrom, 12, sim.homeZone)) { m.yearFrom = addMonths(m.yearFrom, 12, sim.homeZone); m.used = 0; m.longUsed = 0; }
  if (tier.calls !== null && m.used >= tier.calls) return undefined;
  return { tier, m };
}

/** A tow without cover, in the save's money. */
export function towPrice(sim: Simulation, where: Jurisdiction, cityId: string, km: number, onTheRoad: boolean): Money {
  if (where === 'MX-CMX' && !onTheRoad) return inSaveMoney(sim, MX_CITY_TOW * 100, 'MXN');
  const p = TOW_PRICES[where];
  // The SCT counts a part of a kilometer over 500 meters as a kilometer.
  const over = where === 'MX-CMX' ? Math.round(km) : Math.max(0, km - p.includedKm);
  const tax = p.plusTax ? salesTaxRate(cityId, sim.now, 'general') : 0;
  return inSaveMoney(sim, Math.round((p.fee + over * p.perKm) * (1 + tax) * 100), p.currency);
}

/**
 * A tow of so many kilometers, in a jurisdiction: covered, in part or
 * whole, or paid; a call used where cover came out. What it cost, and how.
 */
export function tow(sim: Simulation, person: Person, where: Jurisdiction, cityId: string, km: number, onTheRoad: boolean, what: string): { paid: Money; covered: boolean; basis: string } {
  const cover = coverFor(sim, person, where);
  let paid: Money;
  let basis: string;
  if (cover) {
    const { tier, m } = cover;
    // A tier that recovers you anywhere; one that tows to a nearby garage, in town; or its kilometers, and its longer one once a year.
    const long = tier.longTowKm !== undefined && m.longUsed === 0 && km > (tier.towKm ?? 0);
    const free = tier.towKm === null ? Infinity : tier.towKm === 0 && tier.covers === 'gb' && !onTheRoad ? Infinity : long ? tier.longTowKm! : tier.towKm;
    m.used += 1;
    if (long && km > (tier.towKm ?? 0)) m.longUsed += 1;
    const over = Math.max(0, km - free);
    const p = TOW_PRICES[where];
    paid = over <= 0 ? 0 : where === 'GB' ? towPrice(sim, where, cityId, over, onTheRoad) : inSaveMoney(sim, Math.round(over * p.perKm * (1 + (p.plusTax ? salesTaxRate(cityId, sim.now, 'general') : 0)) * 100), p.currency);
    basis = over <= 0 ? `${tier.club} towed it` : `${tier.club} towed it ${Math.round(free)} km, and the ${Math.round(over)} km over were paid`;
  } else {
    paid = towPrice(sim, where, cityId, km, onTheRoad);
    basis = TOW_PRICES[where].basis;
  }
  if (paid > 0 && !spend(sim, person, paid, `A tow, ${what}`, 'vehicle')) owe(sim, person, paid, `A tow, ${what}`, 'vehicle');
  return { paid, covered: Boolean(cover), basis };
}

/** The tow from home to the garage, for a severe fault not towed already: the town's average errand of a drive. */
export function townTow(sim: Simulation, person: Person, v: OwnedVehicle, what: string): Money {
  if (!v.fault?.severe || v.fault.towed) return 0;
  const cityId = v.at ?? v.cityId;
  const where = jurisdictionOf(cityId) ?? v.jurisdiction;
  const km = LEG_KM[where.startsWith('US') || where.startsWith('CA') ? 'na' : 'eu'].errand;
  v.fault.towed = true;
  return tow(sim, person, where, cityId, km, false, what).paid;
}

/** A driven journey's own kilometers: a fault drawn on the road, and a severe one towed onward. True where one happened. */
export function onTheRoad(sim: Simulation, person: Person, car: OwnedVehicle, j: Journey, km: number, odds?: number): boolean {
  const m = modelById(car.modelId);
  const r = m ? reliabilityOf(m) : undefined;
  if (!m || !r || car.fault) return false;
  const rng = sim.rng('vehicle.roadfault', car.id, j.id);
  if (rng.next() >= (odds ?? 1 - Math.exp(-r.visits * km / KM_A_YEAR[car.jurisdiction]))) return false;
  const severe = rng.next() < r.severe;
  const along = rng.next();
  car.fault = { at: j.leaveAt + along * (j.arriveAt - j.leaveAt), severe, usd: repairUsd(r, severe) };
  const name = `the ${m.make} ${m.model}`;
  const mine = person.id === sim.universe.playerId;
  const cur = saveCurrency(sim.universe);
  const to = CITIES.require(j.toCity).name;
  if (!severe) {
    if (mine) sim.notify({ category: 'home', title: 'The Check Engine Light Came On', body: `On the road to ${to}, ${name} lit its light and kept going; the repair is about ${formatMoney(faultCost(car, cur), cur, { cents: false })}.`, importance: 45, route: '/workspace/vehicles' });
    return true;
  }
  // Stopped where it broke; towed the rest of the way, in the jurisdiction it's going to where the road's isn't known.
  const rest = (1 - along) * km;
  const where = jurisdictionOf(j.toCity) ?? car.jurisdiction;
  car.fault.towed = true;
  const t = tow(sim, person, where, j.toCity, rest, true, `${Math.round(rest)} km to ${to}`);
  if (mine) sim.notify({ category: 'home', title: 'Broken Down On The Road', body: `${name[0]!.toUpperCase()}${name.slice(1)} stopped ${Math.round(rest)} km from ${to}, and was towed there: ${t.paid > 0 ? formatMoney(t.paid, cur, { cents: false }) : 'nothing to pay'}, ${t.basis}. The repair is about ${formatMoney(faultCost(car, cur), cur, { cents: false })}.`, importance: 75, route: '/workspace/vehicles' });
  return true;
}

export function registerRoadside(sim: Simulation): void {
  sim.onCommand<{ tierId: string }, { paid: Money; renewAt: Instant }>('roadside.join', (p, { sim: s }) => {
    const person = s.player;
    const no = joinRefusal(s, person, String(p?.tierId));
    if (no) throw new CommandError(no);
    const t = tierById(String(p.tierId))!;
    const d = duesOf(s, person, t);
    if (!spend(s, person, d.first, `${t.club}, ${t.tier}`, 'vehicle')) throw new CommandError('The payment didn’t go through.');
    const renewAt = nextRenewal(s, t, s.now);
    person.roadside = { tierId: t.id, since: s.now, renewAt, yearFrom: s.now, used: 0, longUsed: 0 };
    s.schedule({ at: renewAt, kind: ROADSIDE_RENEW_KIND, label: `${t.club} Renews`, category: 'finance', priority: 20, payload: { personId: person.id, tierId: t.id } });
    return { paid: d.first, renewAt };
  });

  sim.onCommand<Record<string, never>, { left: true }>('roadside.leave', (_p, { sim: s }) => {
    const person = s.player;
    if (!person.roadside) throw new CommandError('You aren’t a member of a club.');
    // What's paid runs to its end, as the clubs' terms have it, but nothing more is taken.
    delete person.roadside;
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === ROADSIDE_RENEW_KIND && one.payload.personId === person.id) s.timeline.cancel(one.id, s.now);
    return { left: true };
  });

  sim.onSchedule(ROADSIDE_RENEW_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const m = person?.roadside;
    const t = m ? tierById(m.tierId) : undefined;
    if (!person || !m || !t || m.tierId !== item.payload.tierId) return;
    const d = duesOf(s, person, t);
    if (!spend(s, person, d.each, `${t.club}, ${t.tier}`, 'vehicle')) {
      delete person.roadside;
      if (person.id === s.universe.playerId) s.notify({ category: 'finance', title: 'Breakdown Cover Lapsed', body: `${t.club} couldn’t take ${formatMoney(d.each, saveCurrency(s.universe))}, and your cover ended.`, importance: 60, route: '/workspace/vehicles' });
      return;
    }
    m.renewAt = nextRenewal(s, t, item.at);
    s.schedule({ at: m.renewAt, kind: ROADSIDE_RENEW_KIND, label: `${t.club} Renews`, category: 'finance', priority: 20, payload: { personId: person.id, tierId: t.id } });
  });
}

/** Days left on the dues paid, for the screen. */
export const daysPaid = (sim: Simulation, m: Roadside): number => Math.max(0, Math.ceil((m.renewAt - sim.now) / MS_DAY));
