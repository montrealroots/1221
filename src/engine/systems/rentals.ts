/**
 * SLATE — a car rented at the far end of a journey (docs/WORLD.md, stage
 * 8a), from 2026-09-29, on the terms in `content/rentals.ts`.
 *
 * Booked on a journey out with its way home booked, the car is picked up at
 * the airport on arrival and returned when the way home leaves, the days
 * counted in 24 hours with the 29 minutes' grace the companies publish.
 * Prepaid when booked: the day's rent, a young driver's surcharge, a damage
 * waiver where the terms assume one, the place's rental taxes and charges.
 * The company's deposit is held on the card at pickup and released on
 * return. It's refused to someone under the company's age, whose license
 * hasn't been held long enough, or who may not drive there
 * (`documents.ts`).
 *
 * The car is driven by road from where it is (Travel's By), its fuel at
 * AAA's average a mile, and the road brings what it brings a car of one's
 * own (`driving.ts`); a crash that hurts charges the company's excess where
 * one is published, or, from 2026-10-01, the repair where the waiver offered
 * was declined. A journey that doesn't arrive, canceled or missed, gives
 * the rental back in full: no company publishes a no-show's charge.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts, startOfNextDay, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { RENTALS, RENTAL_CLASSES, RENTAL_CLASS_LABEL, RENTAL_CROSSINGS, type RentalClass, type RentalTerms } from '../content/rentals';
import { UNRATED_FUEL_USD_PER_KM } from '../content/vehiclefees';
import { ageOn } from './mortality';
import { licenseOf, mayDrive } from './documents';
import { ROAD, byRoad, drive, driveMinutes, roadKm, tollsUsd } from './driving';
import { jurisdictionOf } from './vehicles';
import { drawFromBank, owe, payFromBank } from './household';
import type { JourneyLeg } from './journey';

export const RENTAL_PICKUP_KIND = 'rental.pickup';
export const RENTAL_RETURN_KIND = 'rental.return';
export const RENTAL_DEPOSIT_KIND = 'travel.rental_deposit_due';
const GRACE_MS = 29 * 60_000;

export interface Rental {
  id: string;
  journeyId: string;
  returnJourneyId: string;
  cityId: string;
  pickupAt: Instant;
  returnAt: Instant;
  days: number;
  /** What was paid, in the save's money. */
  paid: Money;
  /** `held`: at the desk, the deposit not yet held (from 2026-10-02). */
  status: 'booked' | 'held' | 'out' | 'returned' | 'canceled';
  /** Where the car is while it's out. */
  at?: string;
  /** A deposit the bank couldn't cover at the desk, and when the hold ends (from 2026-10-02). */
  depositDue?: Money;
  heldUntil?: Instant;
  /** The damage waiver offered, taken. */
  waived?: boolean;
  /** Its class, from 2026-10-01; a small car before. */
  cls?: RentalClass;
  escrowAccountId?: string;
  /** Standing in for a car in the shop, a dealer's loaner or a rental, from 2026-10-01 (`systems/standin.ts`); no journey then. */
  standIn?: { vehicleId: string; loaner?: string };
}

export const rentalsOf = (person: Person): Rental[] => (person.rentals ??= []);
const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };
const c = (units: number) => Math.round(units * 100);

/** Days a rental is charged: 24 hours each, 29 minutes' grace on the last. */
export const rentalDays = (pickupAt: Instant, returnAt: Instant) => Math.max(1, Math.ceil((returnAt - pickupAt - GRACE_MS) / MS_DAY));

export interface RentalQuote { company: string; airport: string; days: number; lines: { label: string; amount: Money }[]; total: Money; deposit: Money; terms: RentalTerms }

/** A rental's price and deposit in the save's money, or why it can't be had. */
/** The classes a town's airport rents, the small car first. */
export function rentalClassesIn(cityId: string): RentalClass[] {
  return RENTALS[cityId] ? ['small', ...(Object.keys(RENTAL_CLASSES[cityId]?.daily ?? {}) as RentalClass[])] : [];
}

export function rentalQuote(sim: Simulation, person: Person, cityId: string, pickupAt: Instant, returnAt: Instant, withReturn: boolean, waived = false, cls: RentalClass = 'small'): RentalQuote | string {
  const t = RENTALS[cityId];
  if (!t) return 'SLATE keeps no rental cars there yet.';
  const classed = cls === 'small' ? undefined : RENTAL_CLASSES[cityId];
  const classDaily = cls === 'small' ? undefined : classed?.daily[cls];
  if (cls !== 'small' && classDaily === undefined) return `${t.company} at ${t.airport} has no average kept for ${RENTAL_CLASS_LABEL[cls].toLowerCase()}.`;
  const age = ageOn(sim, person, pickupAt);
  if (age < t.minAge) return `${t.company} rents at ${t.airport} from ${t.minAge}.`;
  const license = licenseOf(person, pickupAt);
  if (!license) return 'A rental asks for a driving license.';
  if ((pickupAt - (license.issuedAt ?? pickupAt)) / (365.2425 * MS_DAY) < t.licenseYears) return `${t.company} asks for a license held ${t.licenseYears} ${t.licenseYears === 1 ? 'year' : 'years'}.`;
  const may = mayDrive(person, cityId, pickupAt);
  if (!may.ok) return may.why ?? 'You may not drive there.';
  const days = rentalDays(pickupAt, returnAt);
  const terms = t.termsCurrency ?? t.currency;
  const lines: { label: string; amount: Money }[] = [{ label: `${t.company}, ${RENTAL_CLASS_LABEL[cls].replace(/^An? /, '')}, ${days} ${days === 1 ? 'Day' : 'Days'}`, amount: classDaily !== undefined ? inSave(sim, c(classDaily * days), classed!.currency) : inSave(sim, c(t.daily * days), t.currency) }];
  const band = t.young?.find((y) => age >= y.from && age <= y.to);
  if (band) lines.push({ label: 'Young Driver Surcharge', amount: inSave(sim, c(Math.min(band.perDay * days, t.youngCap ?? Infinity)), terms) });
  if (t.waiverPerDay) lines.push({ label: 'Damage Waiver', amount: inSave(sim, c(t.waiverPerDay * days), terms) });
  if (waived && t.waiverOffered) lines.push({ label: 'Damage Waiver', amount: inSave(sim, c(t.waiverOffered * days), terms) });
  const rate = t.taxFrom && pickupAt >= Date.parse(t.taxFrom.at) ? t.taxFrom.rate : t.taxRate;
  if (rate > 0) lines.push({ label: 'Rental Taxes', amount: Math.round(lines.reduce((a, l) => a + l.amount, 0) * rate) });
  if (t.perDay) lines.push({ label: t.perDay.label, amount: inSave(sim, c(t.perDay.amount * Math.min(days, t.perDay.capDays ?? days)), t.currency) });
  const deposit = t.deposit && !(t.depositWaivedWithReturn && withReturn) ? inSave(sim, c(t.deposit), terms) : 0;
  return { company: t.company, airport: t.airport, days, lines, total: lines.reduce((a, l) => a + l.amount, 0), deposit, terms: t };
}

/** A car rented and out, where a person is, at a moment. */
export function rentalAt(person: Person, cityId: string, at: Instant): Rental | undefined {
  return rentalsOf(person).find((r) => (r.status === 'out' || r.status === 'booked') && (r.at ?? r.cityId) === cityId && at >= r.pickupAt && at < r.returnAt);
}

/** A drive in a rented car (Travel's By): the road, AAA's fuel a mile, the tolls; it must be back before it's due. */
export function planRentalDrive(sim: Simulation, person: Person, fromCity: string, toCity: string, day: Instant, slot: number): JourneyLeg[] | string {
  const zone = CITIES.require(fromCity).timeZone;
  const p = zonedParts(day, zone);
  const depart = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 7 + Math.max(0, Math.min(14, slot)) }, zone);
  const r = rentalAt(person, fromCity, depart);
  if (!r) return 'You have no rental car here then.';
  if (!byRoad(fromCity, toCity)) return 'No road joins those towns.';
  // Across a border, as the company's terms allow (from 2026-10-01).
  const crossing = RENTAL_CROSSINGS[`${CITIES.get(r.cityId)?.countryId}>${CITIES.get(toCity)?.countryId}`];
  if (crossing && !crossing.allowed) return `${crossing.basis}.`;
  const may = mayDrive(person, fromCity, depart);
  if (!may.ok) return may.why ?? 'You may not drive there.';
  const km = roadKm(fromCity, toCity);
  const arrive = depart + driveMinutes(km) * 60_000;
  if (arrive > r.returnAt) return 'The rental is due back before you’d get there.';
  const tolls = tollsUsd(fromCity, toCity);
  const fare = inSave(sim, Math.round(UNRATED_FUEL_USD_PER_KM * km) + tolls, 'USD');
  return [{ mode: 'drive', from: fromCity, to: toCity, departAt: depart, arriveAt: arrive, fare, routeId: `rental:${r.id}`, basis: `${Math.round(km)} km by road in the rental: AAA’s average fuel a mile${tolls > 0 ? ', and the corridor’s tolls' : ''}. ${ROAD.source}.` }];
}

/** A rental driven on a journey arrives: the car is there, and the road brought what it brought. */
export function rentalDriven(sim: Simulation, person: Person, routeId: string, fromCity: string, toCity: string, key: string): void {
  const r = rentalsOf(person).find((x) => `rental:${x.id}` === routeId);
  if (!r) return;
  r.at = toCity;
  const j = jurisdictionOf(fromCity) ?? jurisdictionOf(r.cityId);
  if (!j) return;
  const { hurt } = drive(sim, person, j, roadKm(fromCity, toCity), sim.now, key);
  const t = RENTALS[r.cityId]!;
  const bill = crashBill(r);
  if (hurt && bill.amount > 0) {
    const due = inSave(sim, c(bill.amount), bill.currency);
    const what = t.excess ? 'excess' : 'repair bill';
    if (!payFromBank(sim, person, due, `${t.company}’s ${what}, the rental damaged`, 'travel')) owe(sim, person, due, `A rental car’s ${what}`, 'travel');
  }
}

/** The desk's deposit, held on the card until the car goes back; none held where the bank can't cover it. */
/** Holds a rental's deposit, and says whether it could. Until 2026-10-02 a deposit the bank couldn't cover went unheld, and the car went out anyway. */
export function holdDeposit(sim: Simulation, person: Person, r: Rental, deposit: Money): boolean {
  const t = RENTALS[r.cityId]!;
  const draw = drawFromBank(sim, person, deposit, false, true);
  if (draw.short !== 0) return false;
  const escrow = sim.openAccount({ id: sim.nextId('account'), kind: 'escrow', name: 'Rental Car Deposit', ownerId: person.id, institution: t.company, openedAt: sim.now, category: 'rental-deposit' });
  sim.post({ memo: `${t.company}’s deposit, held`, category: 'travel', postings: [...draw.postings, { accountId: escrow.id, amount: deposit }] });
  r.escrowAccountId = escrow.id;
  return true;
}

/** What a crash in this rental costs, in what money: a dealer's loaner is driven on your own cover, no desk's excess (`systems/standin.ts`). */
export function crashBill(r: Rental): { amount: number; currency: string } {
  return r.standIn?.loaner ? { amount: 0, currency: 'USD' } : damageBill(RENTALS[r.cityId]!, r.waived === true);
}

/** What a crash costs the renter and in what money: the excess in the terms', or the repair in its own. */
export function damageBill(t: RentalTerms, waived: boolean): { amount: number; currency: string } {
  return { amount: damageOwed(t, waived), currency: (t.excess ? undefined : t.unwaived?.currency) ?? t.termsCurrency ?? t.currency };
}

/** What a crash in a rented car costs the renter, in the terms' money: the excess where one's published, or the repair with the offered waiver declined. */
export function damageOwed(t: RentalTerms, waived: boolean): number {
  if (t.excess) return t.excess;
  return t.unwaived && !waived ? t.unwaived.repair + t.unwaived.admin : 0;
}

function release(sim: Simulation, person: Person, r: Rental): void {
  const escrow = r.escrowAccountId ? sim.universe.accounts[r.escrowAccountId] : undefined;
  if (!escrow || escrow.balance <= 0) return;
  sim.post({ memo: 'A rental car’s deposit released', category: 'travel', postings: [{ accountId: escrow.id, amount: -escrow.balance }, { accountId: person.primaryAccountId!, amount: escrow.balance }] });
  escrow.closedAt = sim.now;
}

export function registerRentals(sim: Simulation, journeys: { journeysOf: (p: Person) => import('./journey').Journey[]; partnerOf: (p: Person, j: import('./journey').Journey) => import('./journey').Journey | undefined }): void {
  sim.onCommand<{ journeyId: string; waiver?: boolean; cls?: RentalClass }, { rentalId: string; paid: Money; deposit: Money }>('travel.rent_car', (p, { sim: s }) => {
    const person = s.player;
    const j = journeys.journeysOf(person).find((x) => x.id === p?.journeyId);
    if (!j || j.status !== 'booked') throw new CommandError('That isn’t a journey you have booked.');
    const back = journeys.partnerOf(person, j);
    if (!back || back.leaveAt <= j.arriveAt) throw new CommandError('A rental is booked with the way home, which says when it goes back.');
    if (rentalsOf(person).some((r) => r.journeyId === j.id && r.status !== 'canceled')) throw new CommandError('A car is rented on it already.');
    const waived = p?.waiver === true;
    const cls: RentalClass = p?.cls ?? 'small';
    const q = rentalQuote(s, person, j.toCity, j.arriveAt, back.leaveAt, true, waived, cls);
    if (typeof q === 'string') throw new CommandError(q);
    if (!payFromBank(s, person, q.total, `A rental car at ${q.airport}, ${q.days} ${q.days === 1 ? 'day' : 'days'}, prepaid`, 'travel')) throw new CommandError(`${formatMoney(q.total, saveCurrency(s.universe))} is more than the bank can cover.`);
    const id = s.nextId('journey');
    rentalsOf(person).push({ id, journeyId: j.id, returnJourneyId: back.id, cityId: j.toCity, pickupAt: j.arriveAt, returnAt: back.leaveAt, days: q.days, paid: q.total, status: 'booked', ...(waived ? { waived } : {}), ...(cls !== 'small' ? { cls } : {}) });
    s.schedule({ at: j.arriveAt + MS_HOUR, kind: RENTAL_PICKUP_KIND, label: 'Rental Car Pickup', category: 'personal', priority: 27, payload: { personId: person.id, rentalId: id } });
    s.schedule({ at: back.leaveAt, kind: RENTAL_RETURN_KIND, label: 'Rental Car Return', category: 'personal', priority: 27, payload: { personId: person.id, rentalId: id } });
    return { rentalId: id, paid: q.total, deposit: q.deposit };
  });

  sim.onSchedule(RENTAL_PICKUP_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? rentalsOf(person).find((x) => x.id === item.payload.rentalId) : undefined;
    if (!person || !r || r.status !== 'booked') return;
    const j = journeys.journeysOf(person).find((x) => x.id === r.journeyId);
    // A late flight still in the air: the desk holds the car an hour more.
    if (j?.status === 'underway') { s.schedule({ at: s.now + MS_HOUR, kind: RENTAL_PICKUP_KIND, label: 'Rental Car Pickup', category: 'personal', priority: 27, payload: { personId: person.id, rentalId: r.id } }); return; }
    // Never arrived: the rental back in full, no company publishing a no-show's charge.
    if (!j || j.status !== 'arrived') {
      r.status = 'canceled';
      s.post({ memo: 'A rental car not picked up, refunded', category: 'travel', postings: [{ accountId: person.primaryAccountId!, amount: r.paid }, { accountId: s.nominalAccount('expense', 'Travel').id, amount: -r.paid }] });
      for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === RENTAL_RETURN_KIND && one.payload.rentalId === r.id) s.timeline.cancel(one.id, s.now);
      return;
    }
    const q = rentalQuote(s, person, r.cityId, r.pickupAt, r.returnAt, true, r.waived === true);
    const deposit = typeof q === 'string' ? 0 : q.deposit;
    if (deposit > 0 && !holdDeposit(s, person, r, deposit)) {
      // At the desk, not on the road: the car is held until the deposit is, or the day ends.
      r.status = 'held';
      r.depositDue = deposit;
      const until = startOfNextDay(s.now + 6 * MS_HOUR, CITIES.require(r.cityId).timeZone);
      r.heldUntil = until;
      s.schedule({ at: until, kind: RENTAL_DEPOSIT_KIND, label: 'The Rental Deposit, Due', category: 'personal', priority: 27, payload: { personId: person.id, rentalId: r.id } });
      if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'The Car Is Held At The Desk', body: `The desk needs a deposit of ${formatMoney(deposit, saveCurrency(s.universe))} the bank can’t cover. Pay it on Travel by the end of the day, or the booking is given up and refunded.`, importance: 80, route: '/workspace/travel' });
      return;
    }
    r.status = 'out';
    r.at = r.cityId;
  });

  sim.onCommand<{ rentalId: string }, { paid: Money }>('travel.pay_rental_deposit', (p, { sim: s }) => {
    const person = s.player;
    const r = rentalsOf(person).find((x) => x.id === p?.rentalId);
    if (!r || r.status !== 'held' || !r.depositDue) throw new CommandError('No car is held for a deposit.');
    if (r.heldUntil !== undefined && s.now >= r.heldUntil) throw new CommandError('The hold has run out.');
    const due = r.depositDue;
    if (!holdDeposit(s, person, r, due)) throw new CommandError(`The deposit is ${formatMoney(due, saveCurrency(s.universe))}, more than the bank holds.`);
    r.status = 'out';
    r.at = r.cityId;
    delete r.depositDue;
    delete r.heldUntil;
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === RENTAL_DEPOSIT_KIND && one.payload.rentalId === r.id) s.timeline.cancel(one.id, s.now);
    return { paid: due };
  });

  sim.onSchedule(RENTAL_DEPOSIT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? rentalsOf(person).find((x) => x.id === item.payload.rentalId) : undefined;
    if (!person || !r || r.status !== 'held') return;
    // Given up, and refunded as a car never picked up is: no company publishes a charge for it.
    r.status = 'canceled';
    delete r.depositDue;
    delete r.heldUntil;
    s.post({ memo: 'A rental car held for a deposit, given up and refunded', category: 'travel', postings: [{ accountId: person.primaryAccountId!, amount: r.paid }, { accountId: s.nominalAccount('expense', 'Travel').id, amount: -r.paid }] });
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === RENTAL_RETURN_KIND && one.payload.rentalId === r.id) s.timeline.cancel(one.id, s.now);
    if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'The Rental Is Given Up', body: `The deposit wasn’t paid, so the desk kept the car; ${formatMoney(r.paid, saveCurrency(s.universe))} came back.`, importance: 70, route: '/workspace/travel' });
  });

  sim.onSchedule(RENTAL_RETURN_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? rentalsOf(person).find((x) => x.id === item.payload.rentalId) : undefined;
    if (!person || !r || r.status !== 'out') return;
    r.status = 'returned';
    release(s, person, r);
  });
}
