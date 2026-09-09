/**
 * SLATE — hiring the kit.
 *
 * The catalog will sell you a camera. Almost nobody buys one. The way the work
 * is actually done is a ticket at a rental house: you take the body, the glass,
 * the lamps and the recorder for the days you need them, you leave a deposit,
 * you either take the house's damage waiver or show them your own cover, you
 * collect it, you use it, and you take it back. If it is late it costs, and if
 * it comes back marked somebody pays for that.
 *
 * The counter is derived rather than stored: a house keeps a seeded slice of
 * the kit catalog, so nine houses across a city cost a save nothing. What is
 * stored is your ticket, because that is the part that is yours.
 *
 * Every rate, deposit, waiver and fee is SLATE's own calibration. Nothing here
 * is a quote from any house, and the note says so wherever a number is shown.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { HireLine, Id, InsurancePolicy, KitHire } from '../domain/model';
import { clamp } from '../core/rng';
import type { Instant } from '../core/time';
import { MS_DAY, MS_MINUTE, addDays, formatDate } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { plural } from '../core/text';
import { placesIn, type Place } from '../content/places';
import { REAL_KIT } from '../content/kit';
import type { RealGood } from '../content/goods';
import { costOfLiving } from '../content/tax';
import {
  COLLECT_MINUTES, DELIVERY_FLOOR, DELIVERY_SHARE, DEPOSIT_SHARE, INSURED_DEPOSIT_SHARE,
  LATE_SHARE, LINE_SUBCATEGORIES, LOST_AFTER_DAYS, RENTABLE, RENT_FLOOR, WAIVER_SHARE,
  CITIES_WITH_REAL_HOUSES, billedDays, dayRateOf, type RentalLine,
} from '../content/rental';

/** How many pieces a house has on the shelf, by how good the house is. */
const SHELF: Readonly<Record<'small' | 'mid' | 'deep', number>> = { small: 26, mid: 44, deep: 72 };

/** A house has to have something in every line it claims to keep. */
const PER_LINE_FLOOR = 6;

// ---------------------------------------------------------------------------
// The houses, and what is on their shelves
// ---------------------------------------------------------------------------

/** Every rental house in a city, real ones first. */
export function housesIn(sim: Simulation, cityId = sim.player.currentLocationId): Place[] {
  return placesIn(cityId).filter((place) => place.kind === 'rental_house');
}

export function houseById(sim: Simulation, houseId: string): Place | undefined {
  const cityId = houseId.includes(':') ? houseId.split(':')[0]! : undefined;
  if (cityId) return placesIn(cityId).find((place) => place.id === houseId);
  // A real house carries its own id rather than the city's, so look where the
  // player is first and then across the cities the roster reaches.
  const here = housesIn(sim).find((place) => place.id === houseId);
  if (here) return here;
  // Only the cities the real roster reaches can hold a house whose id does not
  // carry a city, so nothing here walks the whole world.
  for (const city of CITIES_WITH_REAL_HOUSES) {
    const found = placesIn(city).find((place) => place.id === houseId);
    if (found) return found;
  }
  return undefined;
}

/** What a house claims to keep. SLATE's own houses carry it on the place. */
export function linesOf(house: Place): readonly RentalLine[] {
  const lines = (house as Place & { lines?: readonly RentalLine[] }).lines;
  return lines && lines.length > 0 ? lines : ['camera'];
}

const STOCK_CACHE = new Map<string, RealGood[]>();

/**
 * What is on the shelf this week.
 *
 * Derived from the house's id, so it is the same every time it is opened and
 * nothing has to be written into a save. A better house carries more, and
 * carries the dear end of the catalog; a small one carries the working end.
 */
export function stockOf(sim: Simulation, house: Place): RealGood[] {
  const key = `${house.id}:${sim.universe.meta.id}`;
  const cached = STOCK_CACHE.get(key);
  if (cached) return cached;

  const quality = house.quality ?? 70;
  const depth = quality >= 90 ? 'deep' : quality >= 74 ? 'mid' : 'small';
  const want = SHELF[depth];
  const rng = sim.rng('rental.stock', house.id);
  const lines = linesOf(house);

  const out: RealGood[] = [];
  for (const line of lines) {
    const subs = LINE_SUBCATEGORIES[line];
    const pool = REAL_KIT
      .filter((good) => subs.includes(good.subcategory ?? ''))
      // Under the floor a thing is bought rather than hired, so it is not on
      // any shelf: nobody writes a ticket for a clamp.
      .filter((good) => good.basePrice >= RENT_FLOOR)
      // A house that is not one of the great ones does not have the
      // seventy thousand dollar body on the shelf.
      .filter((good) => good.basePrice <= (quality >= 90 ? Infinity : quality >= 74 ? 40_000_00 : 9_000_00))
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    if (pool.length === 0) continue;
    const take = Math.max(PER_LINE_FLOOR, Math.round((want / lines.length)));
    const seen = new Set<string>();
    for (let n = 0; n < take * 3 && seen.size < Math.min(take, pool.length); n += 1) {
      const good = pool[rng.int(0, pool.length - 1)]!;
      if (seen.has(good.id)) continue;
      seen.add(good.id);
      out.push(good);
    }
  }
  out.sort((a, b) => (a.subcategory ?? '').localeCompare(b.subcategory ?? '') || b.basePrice - a.basePrice);
  STOCK_CACHE.set(key, out);
  return out;
}

/** One piece, priced for this city. A house in London is not a house in Lagos. */
export function rateFor(sim: Simulation, house: Place, good: RealGood): Money {
  const living = costOfLiving(house.cityId ?? sim.player.currentLocationId);
  // A dearer house on the same street asks more for the same case.
  const tier = 0.86 + house.price * 0.07;
  return Math.max(1_00, Math.round((dayRateOf(good) * living * tier) / 100) * 100);
}

// ---------------------------------------------------------------------------
// The quote
// ---------------------------------------------------------------------------

export interface HireQuote {
  houseId: string;
  houseName: string;
  lines: HireLine[];
  days: number;
  billedDays: number;
  /** All the lines together for one billed day. */
  rate: Money;
  hire: Money;
  waiver: Money;
  deposit: Money;
  delivery: Money;
  /** Hire plus waiver plus delivery. The deposit is held, not spent. */
  dueNow: Money;
  /** The replacement value of everything on the ticket. */
  value: Money;
  /** Your own cover, where you have some. */
  policy?: InsurancePolicy;
  note: string;
}

/** The equipment policy that would answer for a claim, if you have one. */
export function equipmentCover(sim: Simulation): InsurancePolicy | undefined {
  return Object.values(sim.universe.insurancePolicies)
    .filter((policy) => policy.holderId === sim.player.id)
    .filter((policy) => policy.line === 'equipment' || policy.line === 'production')
    .find((policy) => policy.status === 'active' && policy.endsAt > sim.now);
}

/**
 * What a ticket would cost.
 *
 * The week bills as three days, which is why the number for seven days is not
 * seven times the number for one. The deposit is held rather than spent and
 * comes back when the kit does, less anything owed.
 */
export function quoteFor(
  sim: Simulation,
  house: Place,
  wanted: { catalogId: string; quantity?: number }[],
  days: number,
  options: { waiver?: boolean; delivery?: boolean } = {},
): HireQuote {
  const shelf = stockOf(sim, house);
  const lines: HireLine[] = [];
  for (const want of wanted) {
    const good = shelf.find((item) => item.id === want.catalogId);
    if (!good) continue;
    const quantity = clamp(Math.round(want.quantity ?? 1), 1, 12);
    lines.push({
      catalogId: good.id,
      name: good.name,
      brand: good.brand,
      subcategory: good.subcategory,
      dayRate: rateFor(sim, house, good),
      value: good.tags?.includes('day rate') ? good.basePrice * 40 : good.basePrice,
      quantity,
    });
  }

  const asked = clamp(Math.round(days), 1, 120);
  const billed = billedDays(asked);
  const rate = lines.reduce((sum, line) => sum + line.dayRate * line.quantity, 0);
  const hire = rate * billed;
  const value = lines.reduce((sum, line) => sum + line.value * line.quantity, 0);
  const policy = equipmentCover(sim);
  const waiver = options.waiver === false || policy ? 0 : Math.round(hire * WAIVER_SHARE);
  const deposit = Math.round(value * (policy ? INSURED_DEPOSIT_SHARE : DEPOSIT_SHARE));
  const delivery = options.delivery ? Math.max(DELIVERY_FLOOR, Math.round(hire * DELIVERY_SHARE)) : 0;

  return {
    houseId: house.id,
    houseName: house.name,
    lines,
    days: asked,
    billedDays: billed,
    rate,
    hire,
    waiver,
    deposit,
    delivery,
    dueNow: hire + waiver + delivery + deposit,
    value,
    policy,
    note: policy
      ? `Your own equipment cover is on file, so the house holds a smaller deposit and sells you no waiver.`
      : `No cover of your own on file. The house's damage waiver is ${formatMoney(Math.round(hire * WAIVER_SHARE))} and is optional.`,
  };
}

// ---------------------------------------------------------------------------
// Reading your tickets
// ---------------------------------------------------------------------------

export function hiresOf(sim: Simulation, personId: Id = sim.player.id): KitHire[] {
  return Object.values(sim.universe.kitHires)
    .filter((hire) => hire.personId === personId)
    .sort((a, b) => b.outAt - a.outAt);
}

/** What is in your hands right now, which is what you can shoot with. */
export function outNow(sim: Simulation, personId: Id = sim.player.id): KitHire[] {
  return hiresOf(sim, personId).filter((hire) => hire.status === 'out');
}

/** Everything a hire is worth per day, for the late fee. */
function dailyLate(hire: KitHire): Money {
  return Math.round(hire.rate * LATE_SHARE);
}

export function daysLate(sim: Simulation, hire: KitHire): number {
  if (hire.status === 'returned' || hire.status === 'lost') return hire.lateDays ?? 0;
  return Math.max(0, Math.floor((sim.now - hire.dueAt) / MS_DAY));
}

/** A sentence on where a ticket stands, for the panel and for a notification. */
export function describeHire(sim: Simulation, hire: KitHire): string {
  const pieces = hire.lines.reduce((sum, line) => sum + line.quantity, 0);
  const what = `${plural(pieces, 'piece')} from ${hire.houseName}`;
  if (hire.status === 'booked') return `${what}, ready to collect, back on ${formatDate(hire.dueAt, sim.homeZone)}.`;
  if (hire.status === 'out') {
    const late = daysLate(sim, hire);
    return late > 0
      ? `${what}, ${plural(late, 'day')} late at ${formatMoney(dailyLate(hire))} a day.`
      : `${what}, out until ${formatDate(hire.dueAt, sim.homeZone)}.`;
  }
  if (hire.status === 'lost') return `${what}, written off and charged to you.`;
  if (hire.status === 'cancelled') return `${what}, called off before it went out.`;
  return `${what}, back on ${formatDate(hire.returnedAt ?? hire.dueAt, sim.homeZone)}.`;
}

/**
 * Calling off a ticket nobody collected.
 *
 * The deposit comes back whole, because the house never had the risk. The hire
 * comes back too if the kit had not been pulled yet; once the day it was
 * wanted for has started, the house has built it, labeled it and kept it off
 * the shelf, so it keeps a day for the trouble.
 */
function closeUncollected(sim: Simulation, hire: KitHire, reason: string): { refund: Money; kept: Money } {
  const accountId = sim.player.primaryAccountId;
  const started = sim.now >= hire.outAt;
  const kept = started ? Math.min(hire.hire, hire.rate) : 0;
  const back = hire.deposit + (hire.hire - kept) + hire.waiver + hire.delivery;

  if (accountId && back > 0) {
    sim.income(accountId, back, `Kit hire called off — ${hire.houseName}`, 'production');
  }
  hire.status = 'cancelled';
  hire.returnedAt = sim.now;
  hire.refunded = back;
  hire.paid -= back;
  hire.lateDays = 0;
  hire.lateFee = 0;
  sim.emit('kit.cancelled', { hireId: hire.id, refund: back, kept, reason });
  return { refund: back, kept };
}

// ---------------------------------------------------------------------------
// The commands
// ---------------------------------------------------------------------------

function accountOf(sim: Simulation): Id {
  const accountId = sim.player.primaryAccountId;
  if (!accountId) throw new CommandError('You have no account to pay from.');
  return accountId;
}

export function registerRentalSystem(sim: Simulation): void {
  /**
   * The ticket. The hire, the waiver and the delivery are spent; the deposit
   * is held and comes back when the kit does, less anything owed by then.
   */
  sim.onCommand<
    {
      houseId: string;
      items: { catalogId: string; quantity?: number }[];
      days: number;
      waiver?: boolean;
      delivery?: boolean;
      startAt?: Instant;
    },
    { hireId: Id; dueNow: Money; dueAt: Instant }
  >(
    'kit.hire',
    (p, { sim: s }) => {
      const house = houseById(s, p.houseId);
      if (!house || house.kind !== 'rental_house') throw new CommandError('That isn’t a rental house.');
      if (house.cityId !== s.player.currentLocationId) {
        throw new CommandError(`${house.name} isn’t in the city you’re in.`);
      }
      const quote = quoteFor(s, house, p.items ?? [], p.days, { waiver: p.waiver, delivery: p.delivery });
      if (quote.lines.length === 0) throw new CommandError('Nothing on that list is on their shelf.');

      const accountId = accountOf(s);
      const available = s.ledger.availableFunds(accountId);
      if (available < quote.dueNow) {
        throw new CommandError(
          `The ticket is ${formatMoney(quote.dueNow)} with the deposit. You have ${formatMoney(available)}.`,
        );
      }

      const outAt = p.startAt && p.startAt > s.now ? p.startAt : s.now;
      const hire: KitHire = {
        id: s.nextId('hire'),
        saveId: s.universe.meta.id,
        personId: s.player.id,
        houseId: house.id,
        houseName: house.name,
        cityId: house.cityId,
        lines: quote.lines,
        days: quote.days,
        billedDays: quote.billedDays,
        outAt,
        dueAt: addDays(outAt, quote.days, s.homeZone),
        rate: quote.rate,
        hire: quote.hire,
        waiver: quote.waiver,
        deposit: quote.deposit,
        delivery: quote.delivery,
        paid: quote.hire + quote.waiver + quote.delivery + quote.deposit,
        status: 'booked',
        policyId: quote.policy?.id,
      };
      s.universe.kitHires[hire.id] = hire;

      s.expense(accountId, quote.hire + quote.waiver + quote.delivery, `Kit hire — ${house.name}`, 'production', { refType: 'hire', refId: hire.id });
      s.expense(accountId, quote.deposit, `Kit deposit — ${house.name}`, 'production', { refType: 'hire', refId: hire.id });

      s.schedule({
        at: hire.dueAt,
        kind: 'kit.due',
        label: `Kit Back To ${house.name}`,
        category: 'personal',
        payload: { hireId: hire.id },
        priority: 70,
        refType: 'hire', refId: hire.id,
      });

      s.emit('kit.hired', { hireId: hire.id, houseId: house.id, total: quote.hire, days: quote.days });
      return { hireId: hire.id, dueNow: quote.dueNow, dueAt: hire.dueAt };
    },
  );

  /** Going and getting it, which takes the morning it takes. */
  sim.onCommand<{ hireId: Id }, { collectedAt: Instant; minutes: number }>(
    'kit.collect',
    (p, { sim: s }) => {
      const hire = s.universe.kitHires[p.hireId];
      if (!hire) throw new CommandError('No such hire.');
      if (hire.status !== 'booked') throw new CommandError('That kit isn’t waiting to be collected.');
      if (s.now < hire.outAt) throw new CommandError(`That hire doesn’t start until ${formatDate(hire.outAt, s.homeZone)}.`);

      const minutes = hire.delivery > 0 ? 20 : COLLECT_MINUTES;
      s.advanceTo(s.now + minutes * MS_MINUTE);
      hire.status = 'out';
      hire.collectedAt = s.now;
      s.emit('kit.collected', { hireId: hire.id, delivered: hire.delivery > 0 });
      return { collectedAt: s.now, minutes };
    },
  );

  /**
   * Calling it off before it goes out, which the counter allows and which is
   * the only way a ticket nobody collected ever closes.
   */
  sim.onCommand<{ hireId: Id }, { refund: Money; kept: Money }>(
    'kit.cancel',
    (p, { sim: s }) => {
      const hire = s.universe.kitHires[p.hireId];
      if (!hire) throw new CommandError('No such hire.');
      if (hire.status === 'out') throw new CommandError('You have that kit. Take it back rather than calling it off.');
      if (hire.status !== 'booked') throw new CommandError('That ticket is already closed.');
      return closeUncollected(s, hire, 'called off');
    },
  );

  /** More days, billed the way the first days were. */
  sim.onCommand<{ hireId: Id; days: number }, { dueAt: Instant; charged: Money }>(
    'kit.extend',
    (p, { sim: s }) => {
      const hire = s.universe.kitHires[p.hireId];
      if (!hire) throw new CommandError('No such hire.');
      if (hire.status === 'returned' || hire.status === 'lost') throw new CommandError('That hire is closed.');
      const extra = clamp(Math.round(p.days), 1, 60);

      const before = hire.billedDays;
      const after = billedDays(hire.days + extra);
      const charged = hire.rate * (after - before);
      const accountId = accountOf(s);
      if (s.ledger.availableFunds(accountId) < charged) {
        throw new CommandError(`Another ${plural(extra, 'day')} is ${formatMoney(charged)}, and you don’t have it.`);
      }

      hire.days += extra;
      hire.billedDays = after;
      hire.dueAt = addDays(hire.dueAt, extra, s.homeZone);
      hire.hire += charged;
      hire.paid += charged;
      if (charged > 0) {
        s.expense(accountId, charged, `Kit hire extended — ${hire.houseName}`, 'production', { refType: 'hire', refId: hire.id });
      }

      s.schedule({
        at: hire.dueAt,
        kind: 'kit.due',
        label: `Kit Back To ${hire.houseName}`,
        category: 'personal',
        payload: { hireId: hire.id },
        priority: 70,
        refType: 'hire', refId: hire.id,
      });
      s.emit('kit.extended', { hireId: hire.id, days: extra, charged });
      return { dueAt: hire.dueAt, charged };
    },
  );

  /**
   * Taking it back.
   *
   * The counter checks every case. What is late costs the day rate and a
   * quarter; what is marked is paid for by the house's waiver, by your own
   * cover less its excess, or by you. What is left of the deposit comes back.
   */
  sim.onCommand<
    { hireId: Id },
    { refund: Money; lateFee: Money; damage: Money; paidBy?: string; note: string }
  >(
    'kit.return',
    (p, { sim: s }) => {
      const hire = s.universe.kitHires[p.hireId];
      if (!hire) throw new CommandError('No such hire.');
      if (hire.status === 'returned') throw new CommandError('That kit is already back.');
      if (hire.status === 'lost') throw new CommandError('The house has written that hire off.');
      if (hire.status === 'booked') throw new CommandError('You never collected that kit.');

      const accountId = accountOf(s);
      const minutes = COLLECT_MINUTES;
      s.advanceTo(s.now + minutes * MS_MINUTE);

      const late = Math.max(0, Math.floor((s.now - hire.dueAt) / MS_DAY));
      const lateFee = late > 0 ? dailyLate(hire) * late : 0;

      // What comes back marked. Longer hires and harder use mark more.
      const rng = s.rng('rental.damage', hire.id);
      const days = Math.max(1, Math.round((s.now - (hire.collectedAt ?? hire.outAt)) / MS_DAY));
      const shootDays = hire.shootDayIds?.length ?? 0;
      const chance = clamp(0.05 + days * 0.012 + shootDays * 0.03, 0, 0.45);
      let damage = 0;
      let paidBy: 'waiver' | 'policy' | 'you' | undefined;
      let note = 'Everything back, everything fine.';
      if (rng.float(0, 1) < chance) {
        const line = hire.lines[rng.int(0, hire.lines.length - 1)]!;
        const severity = rng.float(0.02, 0.22);
        damage = Math.max(25_00, Math.round((line.value * severity) / 100) * 100);
        const what = rng.pick([
          `${line.name} came back with a mark on the housing`,
          `${line.name} is missing a cap and has a scratch nobody owns up to`,
          `${line.name} took a knock and needs a service before it goes out again`,
          `${line.name} came back wet, and the house wants it looked at`,
        ]);
        if (hire.waiver > 0) {
          paidBy = 'waiver';
          note = `${what}. It’s on the waiver you took, so it costs you nothing.`;
        } else {
          const policy = hire.policyId ? s.universe.insurancePolicies[hire.policyId] : undefined;
          if (policy && policy.status === 'active') {
            paidBy = 'policy';
            const excess = Math.min(policy.deductible, damage);
            note = `${what}. Your own cover answers for it; the excess is ${formatMoney(excess)}.`;
            damage = excess;
          } else {
            paidBy = 'you';
            note = `${what}. Nothing covers it, so it comes off the deposit.`;
          }
        }
      }

      const owed = lateFee + (paidBy === 'waiver' ? 0 : damage);
      const refund = Math.max(0, hire.deposit - owed);
      const shortfall = Math.max(0, owed - hire.deposit);

      if (refund > 0) {
        s.income(accountId, refund, `Kit deposit returned — ${hire.houseName}`, 'production');
      }
      if (shortfall > 0) {
        s.expense(accountId, shortfall, `Kit charges — ${hire.houseName}`, 'production', { refType: 'hire', refId: hire.id });
      }

      hire.status = 'returned';
      hire.returnedAt = s.now;
      hire.lateDays = late;
      hire.lateFee = lateFee;
      hire.refunded = refund;
      hire.paid += shortfall;
      if (paidBy) {
        hire.damage = { note, cost: damage, paidBy, excess: paidBy === 'policy' ? damage : undefined };
      }

      s.emit('kit.returned', { hireId: hire.id, refund, lateFee, damage: paidBy === 'waiver' ? 0 : damage });
      return { refund, lateFee, damage: paidBy === 'waiver' ? 0 : damage, paidBy, note };
    },
  );

  // --- What the house does while you are not looking ------------------------

  /** The day it is due back. */
  sim.onSchedule('kit.due', (item, s) => {
    const hire = s.universe.kitHires[(item.payload as { hireId: Id }).hireId];
    if (!hire || hire.status === 'returned' || hire.status === 'lost') return;
    // A ticket that was extended has a later due date than this reminder, and
    // the reminder for that date is already in the diary.
    if (s.now < hire.dueAt) return;

    // Nobody ever came for it. The house puts it back on the shelf, keeps a
    // day for having built it, and returns the rest rather than sitting on a
    // deposit for a ticket that never went out.
    if (hire.status === 'booked') {
      const { refund: back } = closeUncollected(s, hire, 'never collected');
      s.notify({
        title: 'Kit Never Collected',
        body: `${hire.houseName} put the kit back on the shelf. ${formatMoney(back)} is back with you; they kept a day for building it.`,
        category: 'personal',
        importance: 52,
        route: '/workspace/film',
        refType: 'hire',
        refId: hire.id,
      });
      return;
    }

    s.notify({
      title: 'Kit Due Back',
      body: `${hire.houseName} wants ${plural(hire.lines.reduce((sum, l) => sum + l.quantity, 0), 'piece')} back today. After that it is ${formatMoney(dailyLate(hire))} a day.`,
      category: 'personal',
      importance: 58,
      route: '/workspace/film',
      refType: 'hire',
      refId: hire.id,
    });
    s.schedule({
      at: addDays(s.now, 1, s.homeZone),
      kind: 'kit.overdue',
      label: `Kit Overdue At ${hire.houseName}`,
      category: 'personal',
      payload: { hireId: hire.id },
      priority: 60,
      refType: 'hire', refId: hire.id,
    });
  });

  /**
   * A day late, and the next one after it.
   *
   * The fee is charged on the day it is earned rather than as a surprise at
   * the counter, and after three weeks the house stops waiting and writes the
   * kit off against you.
   */
  sim.onSchedule('kit.overdue', (item, s) => {
    const hire = s.universe.kitHires[(item.payload as { hireId: Id }).hireId];
    if (!hire || hire.status !== 'out') return;
    // Extended past this tick, so nothing is late and nothing is owed.
    if (s.now < hire.dueAt) return;
    const late = Math.max(1, Math.floor((s.now - hire.dueAt) / MS_DAY));

    if (late >= LOST_AFTER_DAYS) {
      const value = hire.lines.reduce((sum, line) => sum + line.value * line.quantity, 0);
      const owed = Math.max(0, value - hire.deposit);
      hire.status = 'lost';
      hire.lateDays = late;
      hire.lateFee = (hire.lateFee ?? 0);
      const accountId = s.player.primaryAccountId;
      if (accountId && owed > 0) {
        s.expense(accountId, owed, `Kit written off — ${hire.houseName}`, 'production', { refType: 'hire', refId: hire.id });
        hire.paid += owed;
      }
      s.notify({
        title: 'The House Has Written It Off',
        body: `${hire.houseName} has stopped waiting for the kit and charged you ${formatMoney(owed)} for it, less the deposit. They’ll remember.`,
        category: 'personal',
        importance: 80,
        route: '/workspace/film',
        refType: 'hire', refId: hire.id,
      });
      s.emit('kit.lost', { hireId: hire.id, charged: owed });
      return;
    }

    const fee = dailyLate(hire);
    const accountId = s.player.primaryAccountId;
    if (accountId) {
      s.expense(accountId, fee, `Kit late fee — ${hire.houseName}`, 'production', { refType: 'hire', refId: hire.id });
      hire.paid += fee;
    }
    hire.lateDays = late;
    hire.lateFee = (hire.lateFee ?? 0) + fee;

    s.schedule({
      at: addDays(s.now, 1, s.homeZone),
      kind: 'kit.overdue',
      label: `Kit Overdue At ${hire.houseName}`,
      category: 'personal',
      payload: { hireId: hire.id },
      priority: 60,
      refType: 'hire', refId: hire.id,
    });
  });
}

export { RENTABLE };
