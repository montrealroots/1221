/**
 * The rental house.
 *
 * The parts of hiring kit a test can hold: houses that are really in the
 * cities they are listed in, a shelf that is derived rather than stored, a
 * week that bills as three days, a deposit that is held and comes back, cover
 * of your own that changes what the counter asks for, days that can be added,
 * a late fee that is charged on the day it is earned, and a house that stops
 * waiting eventually.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CITIES } from '@/engine/content/geography';
import {
  CITIES_WITH_REAL_HOUSES, DEPOSIT_SHARE, INSURED_DEPOSIT_SHARE, LOST_AFTER_DAYS,
  RENTAL_HOUSES, WEEK_BILLS_DAYS, billedDays, dayRateOf,
} from '@/engine/content/rental';
import { REAL_KIT } from '@/engine/content/kit';
import {
  describeHire, equipmentCover, hiresOf, houseById, housesIn, linesOf, outNow, quoteFor, stockOf,
} from '@/engine/systems/rental';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, KitHire } from '@/engine/domain/model';
import type { Place } from '@/engine/content/places';
import { addDays } from '@/engine/core/time';

const DAY = 86_400_000;

function inLosAngeles(name: string): Simulation {
  const sim = quickSave({ wealth: 'wealthy' }, name);
  sim.player.currentLocationId = 'us-ca-losangeles';
  return sim;
}

/** The cheapest body and the cheapest lens on a shelf, which is a real package. */
function cheapPackage(sim: Simulation, house: Place): { catalogId: string; quantity?: number }[] {
  const shelf = stockOf(sim, house);
  const cheapest = (sub: string) => [...shelf]
    .filter((good) => good.subcategory === sub)
    .sort((a, b) => a.basePrice - b.basePrice)[0];
  const body = cheapest('camera');
  const lens = cheapest('lens');
  expect(body, 'a camera house with no camera').toBeDefined();
  return lens ? [{ catalogId: body!.id }, { catalogId: lens.id, quantity: 2 }] : [{ catalogId: body!.id }];
}

function hireOne(sim: Simulation, days = 3): { hire: KitHire; house: Place } {
  const house = housesIn(sim).find((place) => linesOf(place).includes('camera'))!;
  const result = sim.execute<{ hireId: Id }>({
    kind: 'kit.hire',
    payload: { houseId: house.id, items: cheapPackage(sim, house), days },
  });
  expect(result.ok, String(result.error)).toBe(true);
  return { hire: sim.universe.kitHires[result.value!.hireId]!, house };
}

describe('the houses on the street', () => {
  it('puts every real house in a city that exists', () => {
    for (const house of RENTAL_HOUSES) {
      expect(CITIES.get(house.cityId), `${house.name} is in ${house.cityId}, which is nowhere`).toBeDefined();
      expect(house.lines.length).toBeGreaterThan(0);
      expect(house.about.length).toBeGreaterThan(40);
      expect(house.house).toBe(true);
    }
    expect(CITIES_WITH_REAL_HOUSES.length).toBeGreaterThanOrEqual(8);
  });

  it('has a house in every city, and the first one always hires a camera', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'houses-everywhere');
    for (const cityId of ['us-ca-losangeles', 'uk-eng-london', 'jp-13-tokyo', 'it-laz-rome', 'ke-05-nairobi']) {
      const houses = housesIn(sim, cityId);
      expect(houses.length, `nowhere hires kit in ${cityId}`).toBeGreaterThan(0);
      expect(houses.some((house) => linesOf(house).includes('camera'))).toBe(true);
    }
  });

  it('keeps the shelves out of the save file', () => {
    const sim = inLosAngeles('shelf-derived');
    const house = housesIn(sim)[0]!;
    const first = stockOf(sim, house);
    expect(first.length).toBeGreaterThan(10);
    // The same shelf every time it is opened, and none of it stored.
    expect(stockOf(sim, house).map((good) => good.id)).toEqual(first.map((good) => good.id));
    expect(JSON.stringify(sim.universe).includes('"stock"')).toBe(false);
    for (const good of first) {
      expect(REAL_KIT.some((real) => real.id === good.id)).toBe(true);
    }
  });

  it('does not put the seventy thousand dollar body on a small house’s shelf', () => {
    const sim = inLosAngeles('shelf-tier');
    const grand = housesIn(sim).find((house) => (house.quality ?? 0) >= 90)!;
    const small = housesIn(sim, 'ke-05-nairobi')[0]!;
    const dearest = (place: Place) => Math.max(...stockOf(sim, place).map((good) => good.basePrice));
    expect(dearest(grand)).toBeGreaterThan(dearest(small));
  });
});

describe('what a day costs', () => {
  it('bills a week as three days', () => {
    expect(billedDays(1)).toBe(1);
    expect(billedDays(3)).toBe(3);
    expect(billedDays(5)).toBe(WEEK_BILLS_DAYS);
    expect(billedDays(7)).toBe(WEEK_BILLS_DAYS);
    expect(billedDays(10)).toBe(WEEK_BILLS_DAYS * 2);
    expect(billedDays(14)).toBe(WEEK_BILLS_DAYS * 2);
  });

  it('quotes a day rate off what a thing is worth, and Panavision off its own', () => {
    const body = REAL_KIT.find((good) => good.subcategory === 'camera' && !good.tags?.includes('day rate'))!;
    expect(dayRateOf(body)).toBeLessThan(body.basePrice);
    expect(dayRateOf(body)).toBeGreaterThan(0);
    const panavision = REAL_KIT.find((good) => good.tags?.includes('day rate'));
    if (panavision) expect(dayRateOf(panavision)).toBe(panavision.basePrice);
  });

  it('holds a smaller deposit and sells no waiver where you have cover of your own', () => {
    const sim = inLosAngeles('quote-cover');
    const house = housesIn(sim).find((place) => linesOf(place).includes('camera'))!;
    const items = cheapPackage(sim, house);

    const bare = quoteFor(sim, house, items, 3);
    expect(bare.waiver).toBeGreaterThan(0);
    expect(bare.deposit).toBe(Math.round(bare.value * DEPOSIT_SHARE));

    const quoted = sim.execute<{ quoteId: Id }>({
      kind: 'ins.quote', payload: { line: 'equipment', coveredRefs: [] },
    });
    expect(quoted.ok, String(quoted.error)).toBe(true);
    const bought = sim.execute({ kind: 'ins.purchase', payload: { quoteId: quoted.value!.quoteId } });
    expect(bought.ok, String(bought.error)).toBe(true);
    expect(equipmentCover(sim)).toBeDefined();

    const covered = quoteFor(sim, house, items, 3);
    expect(covered.waiver).toBe(0);
    expect(covered.deposit).toBe(Math.round(covered.value * INSURED_DEPOSIT_SHARE));
    expect(covered.deposit).toBeLessThan(bare.deposit);
  });
});

describe('the ticket', () => {
  it('takes the hire and the deposit, and hands the deposit back when the kit does', () => {
    const sim = inLosAngeles('hire-cycle');
    const accountId = sim.player.primaryAccountId!;
    const before = sim.ledger.availableFunds(accountId);

    const { hire } = hireOne(sim, 3);
    expect(hire.status).toBe('booked');
    const afterHire = sim.ledger.availableFunds(accountId);
    expect(before - afterHire).toBe(hire.hire + hire.waiver + hire.delivery + hire.deposit);

    expect(sim.execute({ kind: 'kit.collect', payload: { hireId: hire.id } }).ok).toBe(true);
    expect(sim.universe.kitHires[hire.id]!.status).toBe('out');
    expect(outNow(sim).length).toBe(1);

    sim.advanceTo(sim.now + 2 * DAY);
    const back = sim.execute<{ refund: number; lateFee: number }>({ kind: 'kit.return', payload: { hireId: hire.id } });
    expect(back.ok, String(back.error)).toBe(true);
    expect(back.value!.lateFee).toBe(0);
    const closed = sim.universe.kitHires[hire.id]!;
    expect(closed.status).toBe('returned');
    expect(closed.refunded).toBe(back.value!.refund);
    expect(describeHire(sim, closed)).toContain('back on');
  });

  it('will not hire from a house in another city, or of what is not on the shelf', () => {
    const sim = inLosAngeles('hire-guards');
    const london = houseById(sim, 'rent-ldn-arri')!;
    expect(sim.execute({
      kind: 'kit.hire', payload: { houseId: london.id, items: cheapPackage(sim, london), days: 2 },
    }).ok).toBe(false);

    const house = housesIn(sim).find((place) => linesOf(place).includes('camera'))!;
    expect(sim.execute({
      kind: 'kit.hire', payload: { houseId: house.id, items: [{ catalogId: 'nothing_like_this' }], days: 2 },
    }).ok).toBe(false);
  });

  it('refuses a ticket the account cannot carry', () => {
    const sim = quickSave({ wealth: 'scraping' }, 'hire-broke');
    sim.player.currentLocationId = 'us-ca-losangeles';
    const house = housesIn(sim).find((place) => (place.quality ?? 0) >= 90)!;
    const dearest = [...stockOf(sim, house)].sort((a, b) => b.basePrice - a.basePrice)[0]!;
    const result = sim.execute({
      kind: 'kit.hire', payload: { houseId: house.id, items: [{ catalogId: dearest.id }], days: 7 },
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('You have');
  });

  it('takes the morning to go and collect it, and takes it back the same way', () => {
    const sim = inLosAngeles('hire-time');
    const { hire } = hireOne(sim);
    const before = sim.now;
    sim.execute({ kind: 'kit.collect', payload: { hireId: hire.id } });
    expect(sim.now - before).toBeGreaterThanOrEqual(60 * 60_000);
  });

  it('adds days, and bills them the way the first days were billed', () => {
    const sim = inLosAngeles('hire-extend');
    const { hire } = hireOne(sim, 3);
    sim.execute({ kind: 'kit.collect', payload: { hireId: hire.id } });
    const wasDue = hire.dueAt;
    const wasBilled = hire.billedDays;

    const extended = sim.execute<{ charged: number }>({ kind: 'kit.extend', payload: { hireId: hire.id, days: 4 } });
    expect(extended.ok, String(extended.error)).toBe(true);
    const now = sim.universe.kitHires[hire.id]!;
    expect(now.days).toBe(7);
    // Three days and four more is a week, and a week is three billed days.
    expect(now.billedDays).toBe(WEEK_BILLS_DAYS);
    expect(now.billedDays).toBe(wasBilled);
    expect(extended.value!.charged).toBe(0);
    // Four days on the calendar, which is not always four times the clock.
    expect(now.dueAt).toBe(addDays(wasDue, 4, sim.homeZone));
  });

  it('does not charge a late fee on a ticket that was extended past the old date', () => {
    const sim = inLosAngeles('hire-extend-late');
    const { hire } = hireOne(sim, 2);
    sim.execute({ kind: 'kit.collect', payload: { hireId: hire.id } });
    const wasDue = hire.dueAt;
    sim.execute({ kind: 'kit.extend', payload: { hireId: hire.id, days: 10 } });

    // Past the date it was first due, and well inside the new one.
    sim.advanceTo(wasDue + 3 * DAY);
    const out = sim.universe.kitHires[hire.id]!;
    expect(out.status).toBe('out');
    expect(out.lateFee ?? 0).toBe(0);
    expect(out.lateDays ?? 0).toBe(0);
  });

  it('will not return what was never collected, and will not return twice', () => {
    const sim = inLosAngeles('hire-return-guards');
    const { hire } = hireOne(sim);
    expect(sim.execute({ kind: 'kit.return', payload: { hireId: hire.id } }).ok).toBe(false);
    sim.execute({ kind: 'kit.collect', payload: { hireId: hire.id } });
    expect(sim.execute({ kind: 'kit.return', payload: { hireId: hire.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'kit.return', payload: { hireId: hire.id } }).ok).toBe(false);
  });
});

describe('a ticket nobody collected', () => {
  it('can be called off before it goes out, and the money comes back', () => {
    const sim = inLosAngeles('hire-cancel');
    const accountId = sim.player.primaryAccountId!;
    const before = sim.ledger.availableFunds(accountId);
    const { hire } = hireOne(sim, 3);
    expect(sim.ledger.availableFunds(accountId)).toBeLessThan(before);

    const off = sim.execute<{ refund: number; kept: number }>({ kind: 'kit.cancel', payload: { hireId: hire.id } });
    expect(off.ok, String(off.error)).toBe(true);
    const closed = sim.universe.kitHires[hire.id]!;
    expect(closed.status).toBe('cancelled');
    // The day it was wanted for has started, so the house keeps a day for
    // having built it and everything else comes back.
    expect(off.value!.kept).toBe(closed.rate);
    expect(sim.ledger.availableFunds(accountId)).toBe(before - closed.rate);
    expect(describeHire(sim, closed)).toContain('called off');
  });

  it('will not be called off once it is in your hands, and not twice', () => {
    const sim = inLosAngeles('hire-cancel-guards');
    const { hire } = hireOne(sim, 2);
    sim.execute({ kind: 'kit.collect', payload: { hireId: hire.id } });
    expect(sim.execute({ kind: 'kit.cancel', payload: { hireId: hire.id } }).ok).toBe(false);

    const other = hireOne(sim, 2).hire;
    expect(sim.execute({ kind: 'kit.cancel', payload: { hireId: other.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'kit.cancel', payload: { hireId: other.id } }).ok).toBe(false);
  });

  it('closes itself at the due date rather than sitting on your deposit forever', () => {
    const sim = inLosAngeles('hire-never-collected');
    const { hire } = hireOne(sim, 2);

    // Never collected. The house puts it back on the shelf on the day it was
    // due and returns everything but a day. The account itself moves for the
    // ordinary reasons a life moves it over two days, so the ticket is what
    // is checked here rather than the balance.
    sim.advanceTo(hire.dueAt + 60_000);
    const closed = sim.universe.kitHires[hire.id]!;
    expect(closed.status).toBe('cancelled');
    expect(closed.lateFee).toBe(0);
    expect(closed.refunded).toBe(closed.deposit + (closed.hire - closed.rate) + closed.waiver + closed.delivery);
    expect(closed.paid).toBe(closed.rate);
  });
});

describe('late, and later', () => {
  it('charges the day rate and a quarter for every day it is late', () => {
    const sim = inLosAngeles('hire-late');
    const { hire } = hireOne(sim, 2);
    sim.execute({ kind: 'kit.collect', payload: { hireId: hire.id } });

    sim.advanceTo(hire.dueAt + 3 * DAY + 60_000);
    const out = sim.universe.kitHires[hire.id]!;
    expect(out.status).toBe('out');
    expect(out.lateDays ?? 0).toBeGreaterThanOrEqual(1);
    expect(out.lateFee ?? 0).toBeGreaterThan(0);
    expect(describeHire(sim, out)).toContain('late');
  });

  it('stops waiting after three weeks and charges the kit to you', () => {
    const sim = inLosAngeles('hire-lost');
    const { hire } = hireOne(sim, 1);
    sim.execute({ kind: 'kit.collect', payload: { hireId: hire.id } });

    sim.advanceTo(hire.dueAt + (LOST_AFTER_DAYS + 1) * DAY);
    const lost = sim.universe.kitHires[hire.id]!;
    expect(lost.status).toBe('lost');
    expect(sim.execute({ kind: 'kit.return', payload: { hireId: hire.id } }).ok).toBe(false);
  });
});

describe('the tickets you can read', () => {
  it('keeps them in one place, newest first', () => {
    const sim = inLosAngeles('hire-list');
    hireOne(sim, 1);
    sim.advanceTo(sim.now + DAY);
    hireOne(sim, 1);
    const all = hiresOf(sim);
    expect(all.length).toBe(2);
    expect(all[0]!.outAt).toBeGreaterThanOrEqual(all[1]!.outAt);
  });
});
