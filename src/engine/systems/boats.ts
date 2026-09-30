/**
 * SLATE — a boat of one's own (docs/WORLD.md, stage 7d), from 2026-09-30,
 * on the rules in `content/boats.ts`.
 *
 * Bought where one lives, in New York, Connecticut or California, with the
 * sales tax and the first registration; kept there. Each month: a twelfth of
 * its insurance; its slip, by the season each April in New York and
 * Connecticut and by the month in California, unless it stands on its
 * trailer at a house of one's own in its town, which costs nothing; its
 * registration renewed when it runs out. Owning asks nothing more; taking it
 * out asks the state's certificate, which Get A Boating Certificate buys, and
 * it goes out from its town for three hours at Mercury's 3.7 gallons an hour
 * of marina gas: time outside, as sitting out is (`systems/life.ts`). Held
 * at its price, as no depreciation series was researched, and sold for it.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { FUEL } from '../content/vehiclefees';
import { BOAT_INSURANCE_USD, BOAT_RULES, MARINA_MARKUP_USD, T18, VESSEL_TAX_CT, isBoatState, type BoatState } from '../content/boats';
import { inTheBank, owe, payFromBank } from './household';
import { livingIn } from './homes';
import { jurisdictionOf } from './vehicles';

export const BOAT_MONTH_KIND = 'boat.month';
const YEAR = 365.2425 * MS_DAY;
const GAL = 3.785411784;
const HOUSES = new Set(['house', 'townhouse', 'estate']);

export interface OwnedBoat { boughtAt: Instant; price: Money; cityId: string; state: BoatState; registeredUntil: Instant; seasonPaid?: number; soldAt?: Instant }

const usd = (sim: Simulation, units: number): Money => { const cur = saveCurrency(sim.universe); const c = Math.round(units * 100); return cur === 'USD' ? c : exchange(c, 'USD', cur) ?? c; };
const homeCity = (person: Person) => person.home?.cityId ?? person.currentLocationId;
export const boatOf = (person: Person): OwnedBoat | undefined => (person.boat && person.boat.soldAt === undefined ? person.boat : undefined);

/** What buying one costs where one lives, in the save's money: the price, the sales tax, the first registration. */
export function boatQuote(sim: Simulation, cityId: string): { price: Money; tax: Money; registration: Money } | undefined {
  const state = jurisdictionOf(cityId);
  if (!isBoatState(state)) return undefined;
  const rate = state === 'US-CT' ? VESSEL_TAX_CT : salesTaxRate(cityId, sim.now, 'goods');
  const year = zonedParts(sim.now, CITIES.require(cityId).timeZone).year;
  return { price: usd(sim, T18.priceUsd), tax: usd(sim, Math.round(T18.priceUsd * rate * 100) / 100), registration: usd(sim, BOAT_RULES[state].registration.first(year)) };
}

export function buyBoatRefusal(sim: Simulation, person: Person): string | undefined {
  if (boatOf(person)) return 'You own a boat.';
  const q = boatQuote(sim, homeCity(person));
  if (!q) return 'SLATE sells a boat in New York, Connecticut and California only yet.';
  const total = q.price + q.tax + q.registration;
  if (inTheBank(sim, person) < total) return `It costs ${formatMoney(total, saveCurrency(sim.universe), { cents: false })}, taxed and registered.`;
  return undefined;
}

/** Whether they hold the certificate the state asks of whoever operates a boat there. */
export const certified = (person: Person, state: BoatState): boolean => (person.boatCertificates ?? []).includes(state);

export function certifyRefusal(sim: Simulation, person: Person): string | undefined {
  const state = jurisdictionOf(homeCity(person));
  if (!isBoatState(state)) return 'SLATE keeps a boating certificate in New York, Connecticut and California only yet.';
  if (certified(person, state)) return 'You hold it.';
  if (inTheBank(sim, person) < usd(sim, BOAT_RULES[state].certificate.usd)) return `It costs ${formatMoney(usd(sim, BOAT_RULES[state].certificate.usd), saveCurrency(sim.universe))}.`;
  return undefined;
}

/** An outing's gas: three hours at 3.7 gallons an hour, the road's price where the boat is and the marina's markup. */
export function outingCost(sim: Simulation, boat: OwnedBoat): Money {
  const litre = FUEL[boat.state].petrol / 100;
  return usd(sim, T18.outingHours * T18.gph * (litre * GAL + MARINA_MARKUP_USD));
}

/** Why the boat can't go out now, or nothing where it can (the weather is `life.ts`'s, as sitting out's). */
export function outingRefusal(sim: Simulation, person: Person): string | undefined {
  const boat = boatOf(person);
  if (!boat) return 'You own no boat.';
  if (person.currentLocationId !== boat.cityId) return `Your boat is in ${CITIES.get(boat.cityId)?.name ?? 'its town'}.`;
  if (!certified(person, boat.state)) return `Operating it asks the state’s ${BOAT_RULES[boat.state].certificate.label}.`;
  if (inTheBank(sim, person) < outingCost(sim, boat)) return 'You can’t afford the gas.';
  return undefined;
}

/** Stood on its trailer at a house of one's own in its town, it needs no slip. */
export const onItsTrailer = (person: Person, boat: OwnedBoat): boolean => {
  const owned = livingIn(person);
  return Boolean(owned && owned.cityId === boat.cityId && HOUSES.has(owned.facts.type));
};

function scheduleBoat(sim: Simulation, person: Person): void {
  sim.schedule({ at: sim.now + 30 * MS_DAY, kind: BOAT_MONTH_KIND, label: 'The Boat’s Month', category: 'home', priority: 30, payload: { personId: person.id } });
}

export function registerBoats(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { paid: Money }>('boat.buy', (_p, { sim: s }) => {
    const person = s.player;
    const no = buyBoatRefusal(s, person);
    if (no) throw new CommandError(no);
    const city = homeCity(person);
    const q = boatQuote(s, city)!;
    const paid = q.price + q.tax + q.registration;
    if (!payFromBank(s, person, paid, `A ${T18.label}, taxed and registered`, 'vehicle')) throw new CommandError('The bank couldn’t pay.');
    const state = jurisdictionOf(city) as BoatState;
    person.boat = { boughtAt: s.now, price: q.price, cityId: city, state, registeredUntil: s.now + BOAT_RULES[state].registration.years * YEAR };
    scheduleBoat(s, person);
    return { paid };
  });

  sim.onCommand<Record<string, never>, { value: Money }>('boat.sell', (_p, { sim: s }) => {
    const person = s.player;
    const boat = boatOf(person);
    if (!boat) throw new CommandError('You own no boat.');
    s.post({ memo: `Sold the ${T18.label}`, category: 'vehicle', postings: [{ accountId: person.primaryAccountId!, amount: boat.price }, { accountId: s.nominalAccount('income', 'Boat Sold').id, amount: -boat.price }] });
    boat.soldAt = s.now;
    for (const item of s.universe.scheduled) if (item.status === 'pending' && item.kind === BOAT_MONTH_KIND && item.payload.personId === person.id) s.timeline.cancel(item.id, s.now);
    return { value: boat.price };
  });

  sim.onCommand<Record<string, never>, { paid: Money }>('boat.certify', (_p, { sim: s }) => {
    const person = s.player;
    const no = certifyRefusal(s, person);
    if (no) throw new CommandError(no);
    const state = jurisdictionOf(homeCity(person)) as BoatState;
    const paid = usd(s, BOAT_RULES[state].certificate.usd);
    if (paid > 0 && !payFromBank(s, person, paid, `The ${BOAT_RULES[state].certificate.label}`, 'vehicle')) throw new CommandError('The bank couldn’t pay.');
    person.boatCertificates = [...(person.boatCertificates ?? []), state];
    return { paid };
  });

  sim.onSchedule(BOAT_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    // A boat sold has its months canceled, so the one here is theirs still.
    const boat = person?.boat;
    if (!person || !boat) return;
    const rules = BOAT_RULES[boat.state];
    const pay = (units: number, memo: string) => { const due = usd(s, units); if (!payFromBank(s, person, due, memo, 'vehicle')) owe(s, person, due, memo, 'vehicle'); };
    pay(BOAT_INSURANCE_USD / 12, 'The boat’s insurance, a month');
    if (!onItsTrailer(person, boat)) {
      if (rules.slip.per === 'month') pay(rules.slip.usd, 'The boat’s slip, a month');
      else {
        const p = zonedParts(s.now, CITIES.require(boat.cityId).timeZone);
        if (p.month >= 4 && boat.seasonPaid !== p.year) { pay(rules.slip.usd, 'The boat’s slip, the season'); boat.seasonPaid = p.year; }
      }
    }
    if (s.now >= boat.registeredUntil) { pay(rules.registration.renewal, 'The boat’s registration renewed'); boat.registeredUntil += rules.registration.years * YEAR; }
    scheduleBoat(s, person);
  });
}
