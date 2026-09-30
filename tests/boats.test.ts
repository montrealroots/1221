/**
 * A boat of one's own (`systems/boats.ts`, docs/WORLD.md stage 7d, from
 * 2026-09-30): Bayliner's Trophy T18 at its maker's price, each state's tax,
 * registration and certificate, its insurance and slip as the months come
 * round, and three hours on the water at Mercury's burn.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { CITIES } from '@/engine/content/geography';
import { salesTaxRate } from '@/engine/content/tax';
import { FUEL } from '@/engine/content/vehiclefees';
import { BOAT_INSURANCE_USD, BOAT_RULES } from '@/engine/content/boats';
import { boatQuote, buyBoatRefusal, carryBoat, outingCost, outingRefusal } from '@/engine/systems/boats';
import { applyLookingAfter, costFor, lookAfterRefusal } from '@/engine/systems/life';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { move } from '@/engine/systems/household';

const YEAR = 365.2425 * MS_DAY;
const save = (city: string, name: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);
  sim.universe.accounts[sim.player.primaryAccountId!]!.balance += usd(sim, 200_000_00);
  return sim;
};
const usd = (sim: Simulation, c: number) => { const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur)!; };
const paidFor = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).map((t) => t.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0));

describe('buying one', () => {
  it('quotes $33,543 with the state’s sales tax and first registration: Connecticut’s 2.99% on a vessel, California’s by the year', () => {
    const ny = save('us-ny-newyork', 'boat-q');
    const q = boatQuote(ny, 'us-ny-newyork')!;
    expect(q.price).toBe(usd(ny, 33_543_00));
    expect(q.tax).toBe(usd(ny, Math.round(33_543 * salesTaxRate('us-ny-newyork', ny.now, 'goods') * 100)));
    expect(q.registration).toBe(usd(ny, 45_00));
    expect(boatQuote(ny, 'us-ct-newhaven')!.tax).toBe(usd(ny, Math.round(33_543 * 0.0299 * 100)));
    const year = zonedParts(ny.now, CITIES.require('us-ca-losangeles').timeZone).year;
    expect(boatQuote(ny, 'us-ca-losangeles')!.registration).toBe(usd(ny, (year % 2 === 0 ? 37 : 65) * 100));
    expect(boatQuote(ny, 'uk-eng-london')).toBeUndefined();
    expect([2026, 2027].map((y) => BOAT_RULES['US-CA'].registration.first(y))).toEqual([37, 65]);
  });

  it('refuses one outside the three states, a second, and what the bank can’t pay', () => {
    expect(buyBoatRefusal(save('uk-eng-london', 'boat-uk'), save('uk-eng-london', 'boat-uk2').player)).toMatch(/only yet/);
    const sim = save('us-ny-newyork', 'boat-refuse');
    expect(sim.execute({ kind: 'boat.buy', payload: {} }).ok).toBe(true);
    expect(buyBoatRefusal(sim, sim.player)).toMatch(/own a boat/);
    const broke = save('us-ny-newyork', 'boat-broke');
    for (const a of Object.values(broke.universe.accounts)) if (a.ownerId === broke.player.id && !a.nominal && a.balance > 0) a.balance = 0;
    expect(buyBoatRefusal(broke, broke.player)).toMatch(/costs/);
  });
});

describe('keeping it', () => {
  it('pays a month’s insurance each month, New York’s slip once a season from April, and renews the registration after three years', () => {
    const sim = save('us-ny-newyork', 'boat-keep');
    expect(sim.execute({ kind: 'boat.buy', payload: {} }).ok).toBe(true);
    sim.advanceBy(6 * YEAR + 45 * MS_DAY);
    const months = paidFor(sim, 'The boat’s insurance, a month');
    expect(months.length).toBeGreaterThanOrEqual(72);
    expect(months[0]).toBe(usd(sim, Math.round(BOAT_INSURANCE_USD / 12 * 100)));
    const seasons = paidFor(sim, 'The boat’s slip, the season');
    expect(seasons.length).toBe(6);
    expect(seasons[0]).toBe(usd(sim, 1_325_00));
    expect(paidFor(sim, 'The boat’s registration renewed')).toEqual([usd(sim, 45_00), usd(sim, 45_00)]);
  });

  it('pays California’s slip by the month, and none for a boat on its trailer at a house of one’s own', () => {
    const ca = save('us-ca-losangeles', 'boat-ca');
    expect(ca.execute({ kind: 'boat.buy', payload: {} }).ok).toBe(true);
    ca.advanceBy(95 * MS_DAY);
    expect(paidFor(ca, 'The boat’s slip, a month')).toEqual([1, 2, 3].map(() => usd(ca, Math.round(17.69 * 25 * 100))));
    const house = save('us-ca-losangeles', 'boat-house');
    const facts: HomeFacts = { type: 'house', address: 'Test House', beds: 3, baths: 2, size: 1_600, built: 2000, features: [], parts: {}, hoaUsd: 0 };
    const owned = ownBuilt(house, house.player, { cityId: 'us-ca-losangeles', facts, price: 900_000_00, closing: 0 });
    house.player.home = { kind: 'owned', cityId: 'us-ca-losangeles', homeId: owned.id, since: house.now };
    expect(house.execute({ kind: 'boat.buy', payload: {} }).ok).toBe(true);
    house.advanceBy(95 * MS_DAY);
    expect(paidFor(house, 'The boat’s slip, a month')).toEqual([]);
  });

  it('sells for its price and stops its months', () => {
    const sim = save('us-ct-newhaven', 'boat-sell');
    expect(sim.execute({ kind: 'boat.buy', payload: {} }).ok).toBe(true);
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    expect(sim.execute({ kind: 'boat.sell', payload: {} }).ok).toBe(true);
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance - before).toBe(usd(sim, 33_543_00));
    sim.advanceBy(60 * MS_DAY);
    expect(paidFor(sim, 'The boat’s insurance, a month')).toEqual([]);
  });
});

describe('taking it out', () => {
  it('asks the state’s certificate, bought for its fee, and costs three hours at 3.7 gallons of marina gas', () => {
    const sim = save('us-ny-newyork', 'boat-out');
    expect(sim.execute({ kind: 'boat.buy', payload: {} }).ok).toBe(true);
    expect(outingRefusal(sim, sim.player)).toMatch(/Boating Safety Certificate/);
    expect(sim.execute({ kind: 'boat.certify', payload: {} }).ok).toBe(true);
    expect(paidFor(sim, 'The Boating Safety Certificate')).toEqual([usd(sim, BOAT_RULES['US-NY'].certificate.usd * 100)]);
    expect(outingRefusal(sim, sim.player)).toBeUndefined();
    const gallon = (FUEL['US-NY'].petrol / 100) * 3.785411784 + 1.175;
    expect(outingCost(sim, sim.player.boat!)).toBe(usd(sim, Math.round(3 * 3.7 * gallon * 100)));
    expect(costFor(sim, 'boat')).toBe(outingCost(sim, sim.player.boat!));
  });

  it('goes out on a fine day, the gas paid, calmer and in better spirits', () => {
    const sim = save('us-ny-newyork', 'boat-day');
    expect(sim.execute({ kind: 'boat.buy', payload: {} }).ok).toBe(true);
    expect(sim.execute({ kind: 'boat.certify', payload: {} }).ok).toBe(true);
    let tries = 0;
    while (lookAfterRefusal(sim, 'boat') && tries < 200) { sim.advanceBy(6 * 3_600_000); tries += 1; }
    expect(lookAfterRefusal(sim, 'boat')).toBeUndefined();
    sim.player.wellbeing.stress = 60;
    sim.player.wellbeing.morale = 40;
    const r = sim.execute<{ changed: Record<string, number> }>({ kind: 'life.look_after', payload: { action: 'boat' } });
    expect(r.ok, r.error).toBe(true);
    expect(paidFor(sim, 'Gas for the boat, at the marina')).toHaveLength(1);
    expect(r.value!.changed.stress ?? 0).toBeLessThan(0);
  });

  it('does for the mood what sitting out does', () => {
    const sim = save('us-ny-newyork', 'boat-mood');
    const dials = (action: 'boat' | 'outside' | 'wash') => { const p = structuredClone(sim.player); p.wellbeing.stress = 60; p.wellbeing.morale = 40; applyLookingAfter(p, action, sim.now); return [p.wellbeing.stress, p.wellbeing.morale]; };
    expect(dials('boat')).toEqual(dials('outside'));
    expect(dials('boat')).not.toEqual(dials('wash'));
  });

  it('stays home when its owner is elsewhere', () => {
    const sim = save('us-ny-newyork', 'boat-away');
    expect(sim.execute({ kind: 'boat.buy', payload: {} }).ok).toBe(true);
    sim.player.currentLocationId = 'us-ca-losangeles';
    expect(outingRefusal(sim, sim.player)).toMatch(/Your boat is in New York/);
  });
});

describe('Bayliner’s loan, and a boat moved', () => {
  it('lends the price less $1,500 at 6.5% over 144 months to a record of 740, the taxes paid at the sale, $321.05-ish a month', () => {
    const sim = save('us-ny-newyork', 'boat-loan');
    sim.player.credit = { ...sim.player.credit!, score: 739 };
    expect(buyBoatRefusal(sim, sim.player, true)).toMatch(/well-qualified/);
    sim.player.credit.score = 760;
    const q = boatQuote(sim, 'us-ny-newyork')!;
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    expect(sim.execute({ kind: 'boat.buy', payload: { financed: true } }).ok).toBe(true);
    expect(before - sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(usd(sim, 1_500_00) + q.tax + q.registration);
    const loan = { ...sim.player.boat!.loan! };
    expect(loan.owed).toBe(q.price - usd(sim, 1_500_00));
    expect(Math.abs(loan.monthly - usd(sim, 321_05))).toBeLessThan(usd(sim, 1_00));
    sim.advanceBy(95 * MS_DAY);
    expect(paidFor(sim, 'Boat loan payment')).toHaveLength(3);
    expect(sim.player.boat!.loan!.monthsLeft).toBe(141);
    expect(sim.player.boat!.loan!.owed).toBeLessThan(loan.owed);
  });

  it('pays the loan off from a sale', () => {
    const sim = save('us-ny-newyork', 'boat-loan-sell');
    sim.player.credit = { ...sim.player.credit!, score: 800 };
    expect(sim.execute({ kind: 'boat.buy', payload: { financed: true } }).ok).toBe(true);
    const owed = sim.player.boat!.loan!.owed;
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    expect(sim.execute({ kind: 'boat.sell', payload: {} }).ok).toBe(true);
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance - before).toBe(sim.player.boat!.price - owed);
  });

  it('comes along by road into another of the three states, registered there, and stays behind anywhere else', () => {
    const sim = save('us-ny-newyork', 'boat-carry');
    expect(sim.execute({ kind: 'boat.buy', payload: {} }).ok).toBe(true);
    carryBoat(sim, sim.player, 'us-ny-newyork', 'us-ct-newhaven');
    expect(sim.player.boat).toMatchObject({ cityId: 'us-ct-newhaven', state: 'US-CT' });
    expect(paidFor(sim, 'Registering the boat in its new home')).toEqual([usd(sim, 45_00)]);
    carryBoat(sim, sim.player, 'us-ct-newhaven', 'uk-eng-london');
    expect(sim.player.boat!.cityId).toBe('us-ct-newhaven');
    // By road, but into a province SLATE keeps no boat's rules for.
    carryBoat(sim, sim.player, 'us-ct-newhaven', 'ca-on-toronto');
    expect(sim.player.boat!.cityId).toBe('us-ct-newhaven');
  });

  it('moves within its state without registering it again, and comes along when its owner moves home', () => {
    const sim = save('us-ny-newyork', 'boat-move');
    expect(sim.execute({ kind: 'boat.buy', payload: {} }).ok).toBe(true);
    carryBoat(sim, sim.player, 'us-ny-newyork', 'us-ny-hudson');
    expect(sim.player.boat!.cityId).toBe('us-ny-hudson');
    expect(paidFor(sim, 'Registering the boat in its new home')).toEqual([]);
    const other = save('us-ny-newyork', 'boat-move-home');
    expect(other.execute({ kind: 'boat.buy', payload: {} }).ok).toBe(true);
    other.player.currentLocationId = 'us-ct-newhaven';
    move(other, other.player, 'own', 'us-ct-newhaven');
    expect(other.player.boat).toMatchObject({ cityId: 'us-ct-newhaven', state: 'US-CT' });
  });
});
