/**
 * What was left open in housing, finished (2026-09-28): rates that move and
 * refinancing at them; Scotland's and Wales's council tax and taxes on
 * buying; what a home's fixtures do to its rent and price; air conditioning
 * and the machines in the bills; and renters insurance against a burglary.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { addCountryCities } from '@/engine/content/geography';
import { billsFactor } from '@/engine/systems/seasons';
import { billsOf } from '@/engine/systems/household';
import { homeValueAt } from '@/engine/content/homes';
import { saveCurrency } from '@/engine/core/money';
import {
  HOME, LISTINGS, RATE_WALK, SPREAD, normalAt, rateFor, askingPrice, closingCost, councilBand, councilTaxYear, listingsIn, loanBalance, marketRent, rateShift,
  refinanceOffer, type OwnedHome,
} from '@/engine/systems/homes';
import { BELONGINGS, MACHINES, belongingsDay, coveredInside, doLaundry, machineUsd, premiumOf } from '@/engine/systems/dwelling';

function save(seed: string, city = 'us-ct-newhaven'): Simulation {
  return quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
}

function earning(sim: Simulation, perMonth: number): void {
  const months: Record<string, number> = {};
  const now = new Date(sim.now);
  for (let n = 1; n <= 24; n++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, 15));
    months[`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`] = perMonth;
  }
  sim.player.earnings = { years: {}, quarters: {}, equityWeeks: [], months, ukYears: {} };
}

function give(sim: Simulation, amount: number): void {
  sim.post({ memo: 'Test money', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -amount }] });
}

function mortgaged(seed: string): { sim: Simulation; owned: OwnedHome } {
  const sim = save(seed);
  earning(sim, 40_000_00);
  sim.player.credit!.score = 780;
  const listing = listingsIn(sim, 'us-ct-newhaven').find((h) => h.type === 'house')!;
  give(sim, askingPrice(sim, listing) * 1.2);
  sim.must({ kind: 'home.offer', payload: { listingId: listing.id, price: askingPrice(sim, listing), down: 0.2, live: true, inspect: true } });
  sim.advanceBy(HOME.closingDays * MS_DAY + MS_DAY);
  return { sim, owned: sim.player.homes![0]! };
}

describe('mortgage rates', () => {
  it('wander month by month, each save its own, and not far', () => {
    const a = save('rates-a');
    const b = save('rates-b');
    const at = (months: number) => RATE_WALK.from + months * 30.4375 * MS_DAY;
    const pathA = Array.from({ length: 60 }, (_, m) => rateShift(a, at(m)));
    const pathB = Array.from({ length: 60 }, (_, m) => rateShift(b, at(m)));
    expect(pathA).not.toEqual(pathB);
    expect(new Set(pathA).size).toBeGreaterThan(30);
    for (let m = 1; m < 60; m++) expect(Math.abs(pathA[m]! - pathA[m - 1]!)).toBeLessThanOrEqual(RATE_WALK.step + 0.0001);
    // Pulled back: five years on, no more than a few points either way.
    for (const s of pathA) expect(Math.abs(s)).toBeLessThan(0.05);
    // Pulled back over a century, where a walk left alone drifts several points.
    for (const sim of [a, b]) {
      const far = Array.from({ length: 600 }, (_, m) => Math.abs(rateShift(sim, at(600 + m))));
      expect(Math.max(...far)).toBeLessThan(0.02);
    }
  });

  it('are what a mortgage is offered at', () => {
    const sim = save('rates-offered');
    sim.universe.now += 400 * MS_DAY;
    const shift = rateShift(sim);
    expect(shift).not.toBe(0);
    expect(rateFor(sim.player, 'us', false, sim) - rateFor(sim.player, 'us')).toBeCloseTo(shift, 6);
  });

  it('can be refinanced to, for closing costs, the loan paid off by a new one at today’s rate', () => {
    const { sim, owned } = mortgaged('refi');
    sim.advanceBy(400 * MS_DAY);
    const offer = refinanceOffer(sim, sim.player, owned)!;
    const balance = loanBalance(sim, owned);
    const old = owned.mortgage!.accountId;
    give(sim, offer.closing * 2);
    sim.must({ kind: 'home.refinance', payload: { homeId: owned.id } });
    expect(owned.mortgage!.accountId).not.toBe(old);
    expect(owned.mortgage!.rate).toBeCloseTo(offer.rate, 6);
    expect(loanBalance(sim, owned)).toBe(balance);
    expect(sim.universe.accounts[old]!.closedAt).toBeDefined();
    expect(offer.closing).toBe(Math.round(balance * HOME.refinanceCost));
  }, 60_000);
});

describe('Scotland and Wales', () => {
  it('charge council tax on their own bands and Band D, England’s on its own', () => {
    addCountryCities('uk', readFileSync('public/geo/uk.tsv', 'utf8'));
    const sim = save('nations', 'uk-eng-london');
    const edinburgh = 'uk-sct-edinburgh';
    const cardiff = 'uk-wls-cardiff';
    const london = 'uk-eng-london';
    // Band D at each nation's own average, and H at Scotland's 882/360 against England's 18/9.
    const d = (city: string) => councilTaxYear(sim, 3, false, 1, city);
    expect(d(edinburgh)).toBeLessThan(d(london));
    expect(councilTaxYear(sim, 7, false, 1, edinburgh) / d(edinburgh)).toBeCloseTo(882 / 360, 3);
    expect(councilTaxYear(sim, 7, false, 1, london) / d(london)).toBeCloseTo(2, 3);
    // Wales has a ninth band, I.
    expect(councilBand(sim, 1_000_000_000_00, cardiff)).toBe(8);
    expect(councilBand(sim, 1_000_000_000_00, london)).toBe(7);
  });

  it('tax a purchase by their own rules: Scotland from £145,000, Wales from £225,000, each more on a home beside another', () => {
    addCountryCities('uk', readFileSync('public/geo/uk.tsv', 'utf8'));
    const sim = save('transfer', 'uk-eng-london');
    const gbp = (n: number) => n * 100;
    const fee = (price: number) => Math.round(price * 0.01);
    // £300,000 in Scotland: 2% of 105,000 and 5% of 50,000.
    expect(closingCost(sim, 'uk-sct-edinburgh', gbp(300_000), false) - fee(gbp(300_000))).toBe(gbp(2_100 + 2_500));
    // In Wales: 6% of 75,000.
    expect(closingCost(sim, 'uk-wls-cardiff', gbp(300_000), false) - fee(gbp(300_000))).toBe(gbp(4_500));
    expect(closingCost(sim, 'uk-sct-edinburgh', gbp(300_000), false, true)).toBeGreaterThan(closingCost(sim, 'uk-sct-edinburgh', gbp(300_000), false));
    expect(closingCost(sim, 'uk-wls-cardiff', gbp(300_000), false, true)).toBeGreaterThan(closingCost(sim, 'uk-wls-cardiff', gbp(300_000), false));
  });
});

describe('what a home has inside', () => {
  it('moves what it lets and sells for: its own washer and dryer most', () => {
    const base = { bathtub: false, dishwasher: false, laundry: 'none' as const, cooling: 'none' as const, outdoor: 'none' as const, gym: 'none' as const };
    expect(premiumOf({ ...base, laundry: 'in-unit' })).toBeGreaterThan(premiumOf({ ...base, dishwasher: true }));
    expect(premiumOf({ ...base, laundry: 'in-unit' }) / premiumOf(base)).toBeCloseTo(1.0557, 4);
    const sim = save('premium');
    const facts = { ...listingsIn(sim, 'us-ct-newhaven')[20]! };
    const bare = marketRent(sim, { cityId: 'us-ct-newhaven', facts: { ...facts, fixtures: base } }, 'main');
    const fitted = marketRent(sim, { cityId: 'us-ct-newhaven', facts: { ...facts, fixtures: { ...base, laundry: 'in-unit', cooling: 'central' } } }, 'main');
    expect(fitted).toBeGreaterThan(bare);
    // And what it sells for: every listing, less its fixtures' premium, is where its place on the town's curve puts it, to the draw's ±0.04.
    const typical = homeValueAt('us-ct-newhaven', saveCurrency(sim.universe)).value;
    for (const h of listingsIn(sim, 'us-ct-newhaven')) {
      const slot = Number(h.id.split('~')[1]);
      const z = normalAt((slot + 0.5) / LISTINGS);
      const base = h.value / premiumOf(h.fixtures!) / typical;
      const drawn = Math.log(base) / (z < 0 ? SPREAD.below : SPREAD.above) - z;
      expect(Math.abs(drawn)).toBeLessThan(0.0401 + 0.001);
    }
  });

  it('pays no summer’s cooling without air conditioning, less with units, and the machines’ loads on the bills', () => {
    const july = 7;
    const central = billsFactor('us-ny-newyork', july, 'central');
    const units = billsFactor('us-ny-newyork', july, 'units');
    const none = billsFactor('us-ny-newyork', july, 'none');
    expect(none).toBeLessThan(units);
    expect(units).toBeLessThan(central);
    // January has no cooling to leave out.
    expect(billsFactor('us-ny-newyork', 1, 'none')).toBeCloseTo(billsFactor('us-ny-newyork', 1, 'central'), 6);
    const sim = save('machines');
    sim.player.home!.unit!.fixtures = { ...sim.player.home!.unit!.fixtures, laundry: 'in-unit' };
    sim.player.living = { clean: 0, dirty: 14, drying: [], tidy: 80 };
    doLaundry(sim, sim.player, sim.now);
    expect(machineUsd(sim.player)).toBeCloseTo(2 * (MACHINES.washerUsd + MACHINES.dryerUsd), 6);
    const withLoads = billsOf(sim, sim.player);
    sim.player.living.loads = { washer: 0, dryer: 0 };
    expect(withLoads - billsOf(sim, sim.player)).toBeGreaterThan(0);
  });
});

describe('what’s inside, insured', () => {
  it('comes at its rate, and renters insurance pays over its deductible', () => {
    const sim = save('renters');
    expect(coveredInside(sim, sim.player)).toBeUndefined();
    sim.must({ kind: 'home.renters_insurance', payload: { on: true } });
    expect(coveredInside(sim, sim.player)).toBeGreaterThan(0);
    // Over enough days a burglary comes at its rate, and the insurance pays.
    const paid = () => Object.values(sim.universe.transactions).filter((t) => t.memo.startsWith('Insurance claim: a')).length;
    const fires = () => Object.values(sim.universe.transactions).filter((t) => t.memo === 'Replacing what burned').length;
    let events = 0;
    for (let d = 0; d < 365 * 2000; d += 1) {
      sim.universe.now += MS_DAY;
      sim.player.wellbeing.stress = 0;
      belongingsDay(sim, sim.player, false);
      if (sim.player.wellbeing.stress > 0) events += 1;
    }
    // About 21 expected in 2,000 years at 8.2 burglaries and 2.35 fires a thousand homes a year.
    const expected = 2000 * (BELONGINGS.burglaryYear + BELONGINGS.fireYear);
    expect(events).toBeGreaterThan(expected * 0.4);
    expect(events).toBeLessThan(expected * 1.8);
    expect(paid()).toBeGreaterThan(0);
    // A renter's building catches fire now and then, about 4.7 times in 2,000 years.
    expect(fires()).toBeGreaterThan(0);
  }, 120_000);
});
