/**
 * SLATE — a boat of one's own (docs/WORLD.md, stage 7d), from 2026-09-30,
 * on the rules in `content/boats.ts`.
 *
 * Bought where one lives, in New York, Connecticut or California, and from
 * later on 2026-09-30 in London or Toronto, with the sales tax and the first
 * registration where there is one; kept there, each place's boat priced in
 * its own money (`BOAT_RULES`). Each month: a twelfth of
 * its insurance; its slip, by the season each April in New York and
 * Connecticut and by the month in California, unless it stands on its
 * trailer at a house of one's own in its town, which costs nothing; its
 * registration renewed when it runs out. Owning asks nothing more; taking it
 * out asks the state's certificate, which Get A Boating Certificate buys, and
 * it goes out from its town for three hours at Mercury's 3.7 gallons an hour
 * of marina gas: time outside, as sitting out is (`systems/life.ts`). Held
 * at its price, as no depreciation series was researched, and sold for it.
 * Bought on Bayliner's own financing where the record allows, and brought
 * along on its trailer on moving home (below), from 2026-09-30.
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
import { BOAT_LOAN, BOAT_REPO, BOAT_RULES, BOAT_WINTER, CHARTERS, MARINA_MARKUP_USD, T18, VESSEL_TAX_CT, isBoatState, laidUp, type BoatState, type Charter } from '../content/boats';
import { REPOSSESSED_ON_RECORD, REPO_FEES_USD } from '../content/repossession';
import { markRecord } from './credit';
import { inTheBank, owe, payFromBank } from './household';
import { livingIn } from './homes';
import { amortized, jurisdictionOf } from './vehicles';
import { byRoad } from './driving';

export const BOAT_MONTH_KIND = 'boat.month';
export const BOAT_REPO_SALE_KIND = 'boat.repo_sale';
const YEAR = 365.2425 * MS_DAY;
const GAL = 3.785411784;
const HOUSES = new Set(['house', 'townhouse', 'estate']);

export interface OwnedBoat { boughtAt: Instant; price: Money; cityId: string; state: BoatState; registeredUntil: Instant; seasonPaid?: number; winterPaid?: number; soldAt?: Instant; loan?: { owed: Money; monthly: Money; monthsLeft: number; missed?: number }; repossessed?: { at: Instant; saleAt: Instant } }

const local = (sim: Simulation, units: number, currency: string): Money => { const cur = saveCurrency(sim.universe); const c = Math.round(units * 100); return cur === currency ? c : exchange(c, currency, cur) ?? c; };
const usd = (sim: Simulation, units: number): Money => local(sim, units, 'USD');
/** An amount in a boat's place's money, in the save's. */
const inPlace = (sim: Simulation, state: BoatState, units: number): Money => local(sim, units, BOAT_RULES[state].currency);
const homeCity = (person: Person) => person.home?.cityId ?? person.currentLocationId;
export const boatOf = (person: Person): OwnedBoat | undefined => (person.boat && person.boat.soldAt === undefined ? person.boat : undefined);

/** What buying one costs where one lives, in the save's money: the price, the sales tax, the first registration. */
export function boatQuote(sim: Simulation, cityId: string): { price: Money; tax: Money; registration: Money } | undefined {
  const state = jurisdictionOf(cityId);
  if (!isBoatState(state)) return undefined;
  const rules = BOAT_RULES[state];
  const rate = !rules.taxAdded ? 0 : state === 'US-CT' ? VESSEL_TAX_CT : salesTaxRate(cityId, sim.now, 'goods');
  const year = zonedParts(sim.now, CITIES.require(cityId).timeZone).year;
  return { price: inPlace(sim, state, rules.model.price), tax: inPlace(sim, state, Math.round(rules.model.price * rate * 100) / 100), registration: inPlace(sim, state, rules.registration?.first(year) ?? 0) };
}

export function buyBoatRefusal(sim: Simulation, person: Person, financed = false): string | undefined {
  if (boatOf(person)) return 'You own a boat.';
  const q = boatQuote(sim, homeCity(person));
  if (!q) return 'SLATE sells a boat in New York, Connecticut, California, London and Toronto only yet.';
  if (financed && !jurisdictionOf(homeCity(person))?.startsWith('US')) return 'Bayliner’s loan is American; none is kept here.';
  if (financed && (person.credit?.score ?? 0) < BOAT_LOAN.minScore) return 'Bayliner lends to a well-qualified record, which yours isn’t yet.';
  const total = (financed ? usd(sim, BOAT_LOAN.downUsd) : q.price) + q.tax + q.registration;
  if (inTheBank(sim, person) < total) return `It costs ${formatMoney(total, saveCurrency(sim.universe), { cents: false })}, taxed and registered.`;
  return undefined;
}

/** Whether they hold the certificate the state asks of whoever operates a boat there. */
export const certified = (person: Person, state: BoatState): boolean => !BOAT_RULES[state].certificate || (person.boatCertificates ?? []).includes(state);

export function certifyRefusal(sim: Simulation, person: Person): string | undefined {
  const state = jurisdictionOf(homeCity(person));
  if (!isBoatState(state)) return 'SLATE keeps a boating certificate in New York, Connecticut, California and Toronto only yet.';
  const cert = BOAT_RULES[state].certificate;
  if (!cert) return 'None is asked here.';
  if (certified(person, state)) return 'You hold it.';
  if (inTheBank(sim, person) < inPlace(sim, state, cert.amount)) return `It costs ${formatMoney(inPlace(sim, state, cert.amount), saveCurrency(sim.universe))}.`;
  return undefined;
}

/** An outing's fuel: three hours at its engine's burn, a marina's published price, or in America the road's with the marina's markup. */
export function outingCost(sim: Simulation, boat: OwnedBoat): Money {
  const rules = BOAT_RULES[boat.state];
  const liters = T18.outingHours * rules.model.litersPerHour;
  if (rules.model.fuelPerLiter !== undefined) return inPlace(sim, boat.state, liters * rules.model.fuelPerLiter);
  const litre = FUEL[boat.state].petrol / 100;
  return usd(sim, (liters / GAL) * (litre * GAL + MARINA_MARKUP_USD));
}

/** Why the boat can't go out now, or nothing where it can (the weather is `life.ts`'s, as sitting out's). */
export function outingRefusal(sim: Simulation, person: Person): string | undefined {
  const boat = boatOf(person);
  if (!boat) return 'You own no boat.';
  if (person.currentLocationId !== boat.cityId) return `Your boat is in ${CITIES.get(boat.cityId)?.name ?? 'its town'}.`;
  if (boat.repossessed) return 'The lender has your boat.';
  const winter = BOAT_WINTER[boat.state];
  if (winter && laidUp(zonedParts(sim.now, CITIES.require(boat.cityId).timeZone).month, winter.lastMonth)) return winter.lastMonth === 3 ? 'It’s laid up for the winter until April, as its insurance asks.' : 'It’s laid up for the winter until May, as its marina’s season runs.';
  if (!certified(person, boat.state)) return `Operating it asks the ${BOAT_RULES[boat.state].certificate!.label}.`;
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
  sim.onCommand<{ financed?: boolean }, { paid: Money }>('boat.buy', (p, { sim: s }) => {
    const person = s.player;
    const financed = p?.financed === true;
    const no = buyBoatRefusal(s, person, financed);
    if (no) throw new CommandError(no);
    const city = homeCity(person);
    const q = boatQuote(s, city)!;
    // Financed, the price less the down payment is lent, and the taxes and registration paid at the sale.
    const lent = financed ? q.price - usd(s, BOAT_LOAN.downUsd) : 0;
    const paid = q.price - lent + q.tax + q.registration;
    if (!payFromBank(s, person, paid, `A ${BOAT_RULES[jurisdictionOf(city) as BoatState].model.label}, taxed and registered${financed ? ', the down payment' : ''}`, 'vehicle')) throw new CommandError('The bank couldn’t pay.');
    const state = jurisdictionOf(city) as BoatState;
    person.boat = { boughtAt: s.now, price: q.price, cityId: city, state, registeredUntil: s.now + (BOAT_RULES[state].registration?.years ?? 1_000) * YEAR };
    if (lent > 0) {
      person.boat.loan = { owed: lent, monthly: amortized(lent, BOAT_LOAN.apr, BOAT_LOAN.months), monthsLeft: BOAT_LOAN.months };
      s.post({ memo: `A boat loan, the ${T18.label}`, category: 'vehicle', postings: [{ accountId: s.nominalAccount('expense', 'Vehicles').id, amount: lent }, { accountId: s.nominalAccount('liability_other', 'Boat Loans').id, amount: -lent }] });
    }
    scheduleBoat(s, person);
    return { paid };
  });

  sim.onCommand<Record<string, never>, { value: Money }>('boat.sell', (_p, { sim: s }) => {
    const person = s.player;
    const boat = boatOf(person);
    if (!boat) throw new CommandError('You own no boat.');
    // Its loan paid off from the sale first.
    const payoff = boat.loan?.owed ?? 0;
    s.post({ memo: `Sold the ${BOAT_RULES[boat.state].model.label}`, category: 'vehicle', postings: [{ accountId: person.primaryAccountId!, amount: boat.price - payoff }, ...(payoff > 0 ? [{ accountId: s.nominalAccount('liability_other', 'Boat Loans').id, amount: payoff }] : []), { accountId: s.nominalAccount('income', 'Boat Sold').id, amount: -boat.price }] });
    delete boat.loan;
    boat.soldAt = s.now;
    for (const item of s.universe.scheduled) if (item.status === 'pending' && item.kind === BOAT_MONTH_KIND && item.payload.personId === person.id) s.timeline.cancel(item.id, s.now);
    return { value: boat.price };
  });

  sim.onCommand<Record<string, never>, { paid: Money }>('boat.certify', (_p, { sim: s }) => {
    const person = s.player;
    const no = certifyRefusal(s, person);
    if (no) throw new CommandError(no);
    const state = jurisdictionOf(homeCity(person)) as BoatState;
    const cert = BOAT_RULES[state].certificate!;
    const paid = inPlace(s, state, cert.amount);
    if (paid > 0 && !payFromBank(s, person, paid, `The ${cert.label}`, 'vehicle')) throw new CommandError('The bank couldn’t pay.');
    person.boatCertificates = [...(person.boatCertificates ?? []), state];
    return { paid };
  });

  sim.onSchedule(BOAT_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    // A boat sold has its months canceled, so the one here is theirs still.
    const boat = person?.boat;
    if (!person || !boat) return;
    const rules = BOAT_RULES[boat.state];
    const pay = (units: number, memo: string) => { const due = inPlace(s, boat.state, units); if (!payFromBank(s, person, due, memo, 'vehicle')) owe(s, person, due, memo, 'vehicle'); };
    pay(rules.insuranceYear / 12, 'The boat’s insurance, a month');
    if (!onItsTrailer(person, boat)) {
      if (rules.slip.per === 'month') pay(rules.slip.amount, 'The boat’s slip, a month');
      else {
        const p = zonedParts(s.now, CITIES.require(boat.cityId).timeZone);
        if (p.month >= (rules.slip.from ?? 1) && boat.seasonPaid !== p.year) { pay(rules.slip.amount, rules.slip.per === 'year' ? 'The boat’s storage, the year' : 'The boat’s slip, the season'); boat.seasonPaid = p.year; }
      }
    }
    // The loan: interest on what's owed, the rest off it, what the bank can't pay owed.
    if (boat.loan) {
      const interest = Math.round((boat.loan.owed * BOAT_LOAN.apr) / 12);
      const payment = Math.min(boat.loan.monthly, boat.loan.owed + interest);
      const principal = payment - interest;
      const paid = payFromBank(s, person, payment, 'Boat loan payment', 'vehicle');
      if (!paid) owe(s, person, payment, 'Boat loan payment', 'vehicle');
      // Three missed running, and the lender takes it back.
      boat.loan.missed = paid ? 0 : (boat.loan.missed ?? 0) + 1;
      if (!paid && boat.loan.missed >= 3 && !boat.repossessed) {
        const saleAt = s.now + BOAT_REPO[boat.state]!.noticeDays * MS_DAY;
        boat.repossessed = { at: s.now, saleAt };
        markRecord(person, REPOSSESSED_ON_RECORD, s.now, boat.cityId);
        s.schedule({ at: saleAt, kind: BOAT_REPO_SALE_KIND, label: 'Repossessed Boat Sold', category: 'home', priority: 30, payload: { personId: person.id } });
        if (person.id === s.universe.playerId) s.notify({ category: 'home', title: 'Your Boat Was Repossessed', body: 'Three payments missed, the lender took the boat. It’s sold after its notice, and it’s on your record.', importance: 85, route: '/workspace/vehicles' });
      }
      s.post({ memo: 'Boat loan, principal repaid', category: 'vehicle', postings: [{ accountId: s.nominalAccount('liability_other', 'Boat Loans').id, amount: principal }, { accountId: s.nominalAccount('expense', 'Vehicles').id, amount: -principal }] });
      boat.loan.owed -= principal;
      boat.loan.monthsLeft -= 1;
      if (boat.loan.owed <= 0 || boat.loan.monthsLeft <= 0) delete boat.loan;
    }
    if (rules.registration && s.now >= boat.registeredUntil) { pay(rules.registration.renewal, 'Boat registration renewed'); boat.registeredUntil += rules.registration.years * YEAR; }
    // The Northeast's winter: stored at the marina each November, or winterized on its trailer at home.
    const winter = BOAT_WINTER[boat.state];
    const p = zonedParts(s.now, CITIES.require(boat.cityId).timeZone);
    if (winter && p.month === 11 && boat.winterPaid !== p.year && !boat.repossessed) {
      if (onItsTrailer(person, boat)) { if (winter.winterize !== undefined) pay(winter.winterize, 'Boat winterized on its trailer'); }
      else pay(winter.storage(rules.model.lengthFt), 'Boat hauled and stored for the winter');
      boat.winterPaid = p.year;
    }
    scheduleBoat(s, person);
  });

  sim.onSchedule(BOAT_REPO_SALE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const boat = person?.boat;
    if (!person || !boat?.repossessed) return;
    // Sold at what it's held at, less the tow; the loan paid from it, a surplus back, the shortfall owed as the law has it.
    const owed = boat.loan?.owed ?? 0;
    const proceeds = Math.max(0, boat.price - usd(s, REPO_FEES_USD.tow));
    const credited = BOAT_REPO[boat.state]!.shortfall === 'past-value' ? Math.max(proceeds, boat.price) : proceeds;
    if (owed > 0) s.post({ memo: 'Boat repossessed and sold', category: 'vehicle', postings: [{ accountId: s.nominalAccount('liability_other', 'Boat Loans').id, amount: owed }, { accountId: s.nominalAccount('income', 'Boat Repossessed').id, amount: -owed }] });
    const surplus = proceeds - owed;
    if (surplus > 0) s.post({ memo: 'What the boat’s sale left over', category: 'vehicle', postings: [{ accountId: person.primaryAccountId!, amount: surplus }, { accountId: s.nominalAccount('income', 'Boat Repossessed').id, amount: -surplus }] });
    const shortfall = Math.max(0, owed - credited);
    if (shortfall > 0) owe(s, person, shortfall, 'Boat loan short after its sale', 'vehicle');
    boat.soldAt = s.now;
    delete boat.loan;
    delete boat.repossessed;
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === BOAT_MONTH_KIND && one.payload.personId === person.id) s.timeline.cancel(one.id, s.now);
  });
}

/**
 * Moving home, the boat comes on its trailer where a road reaches and the
 * new home is in one of the boat's places, registered there when the state
 * changes; otherwise it stays where it was kept. From 2026-09-30; until then
 * a boat stayed where it was bought.
 */
export function carryBoat(sim: Simulation, person: Person, fromCity: string, toCity: string): void {
  const boat = boatOf(person);
  if (!boat || boat.cityId !== fromCity || fromCity === toCity || !byRoad(fromCity, toCity)) return;
  const state = jurisdictionOf(toCity);
  // Within a country only: importing a boat across a border isn't kept.
  if (!isBoatState(state) || CITIES.get(fromCity)?.countryId !== CITIES.get(toCity)?.countryId) return;
  boat.cityId = toCity;
  if (state === boat.state) return;
  const year = zonedParts(sim.now, CITIES.require(toCity).timeZone).year;
  const due = inPlace(sim, state, BOAT_RULES[state].registration?.first(year) ?? 0);
  if (!payFromBank(sim, person, due, 'Registering the boat in its new home', 'vehicle')) owe(sim, person, due, 'Registering the boat', 'vehicle');
  boat.state = state;
  boat.registeredUntil = sim.now + (BOAT_RULES[state].registration?.years ?? 1_000) * YEAR;
  delete boat.seasonPaid;
}

/** A crewed charter where one is (`CHARTERS`): by the town, or by its state. */
export function charterAt(cityId: string): Charter | undefined {
  return CHARTERS[cityId] ?? CHARTERS[CITIES.get(cityId)?.parentId ?? ''];
}

/** What a charter costs where they are, its gratuity with it, in the save's money. */
export function charterCost(sim: Simulation, cityId: string): Money | undefined {
  const c = charterAt(cityId);
  if (!c) return undefined;
  const cur = saveCurrency(sim.universe);
  const cents = Math.round(c.amount * (1 + c.tip) * 100);
  return cur === c.currency ? cents : exchange(cents, c.currency, cur) ?? cents;
}

/** Why a boat can't be chartered now, or nothing where it can (the weather is `life.ts`'s). */
export function charterRefusal(sim: Simulation, person: Person): string | undefined {
  const cost = charterCost(sim, person.currentLocationId);
  if (cost === undefined) return 'No captain’s charter is kept where you are.';
  if (inTheBank(sim, person) < cost) return 'You can’t afford it.';
  return undefined;
}
