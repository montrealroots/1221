/**
 * Owning a home (`systems/homes.ts`): fifty for sale in a town, cheapest
 * first around its typical value; bought with a mortgage or cash and closed
 * thirty days on; paid for on the first, late fees, the record and
 * foreclosure; renovations whose worth follows the wear of what they
 * replace; and a sale that moves them into a rented home.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { homeValueAt, PROJECTS } from '@/engine/content/homes';
import { addCountryCities } from '@/engine/content/geography';
import { rentOf } from '@/engine/systems/household';
import {
  HOME, askingPrice, assessedValue, buyRefusal, closingCost, homeValue, listingsIn, loanBalance, offerFor, projectAdds,
  projectRefusal, saleNet, type Listing,
} from '@/engine/systems/homes';

function save(seed: string, city = 'us-ct-newhaven'): Simulation {
  return quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
}

/** Money into their current account, from outside the story. */
function give(sim: Simulation, amount: number): void {
  sim.post({ memo: 'Test money', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -amount }] });
}

/** Two years of a steady income on the record a lender reads. */
function earning(sim: Simulation, perMonth: number): void {
  const months: Record<string, number> = {};
  const now = new Date(sim.now);
  for (let n = 1; n <= 24; n++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, 15));
    months[`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`] = perMonth;
  }
  sim.player.earnings = { years: {}, quarters: {}, equityWeeks: [], months, ukYears: {} };
}

const house = (sim: Simulation, city = 'us-ct-newhaven'): Listing => listingsIn(sim, city).find((h) => h.type === 'house' && h.parts.roof !== undefined)!;

function bought(seed: string, down: number): { sim: Simulation; listing: Listing } {
  const sim = save(seed);
  earning(sim, 30_000_00);
  const listing = house(sim);
  give(sim, askingPrice(sim, listing) * 1.2);
  sim.player.credit!.score = 780;
  expect(sim.execute({ kind: 'home.buy', payload: { listingId: listing.id, down } }).ok).toBe(true);
  sim.advanceBy(HOME.closingDays * MS_DAY + MS_DAY);
  expect(sim.player.owned?.listingId).toBe(listing.id);
  return { sim, listing };
}

describe('homes for sale', () => {
  it('are fifty in a town, cheapest first, spread about Zillow’s typical value', () => {
    const sim = save('homes-fifty');
    const homes = listingsIn(sim, 'us-ct-newhaven');
    expect(homes).toHaveLength(50);
    for (let n = 1; n < 50; n++) expect(homes[n]!.value).toBeGreaterThanOrEqual(homes[n - 1]!.value);
    const typical = homeValueAt('us-ct-newhaven', 'USD');
    expect(typical.kind).toBe('zillow');
    const middle = (homes[24]!.value + homes[25]!.value) / 2;
    expect(middle / typical.value).toBeGreaterThan(0.9);
    expect(middle / typical.value).toBeLessThan(1.1);
    expect(new Set(homes.map((h) => h.address)).size).toBe(50);
    // A flat at the bottom, a house or an estate at the top.
    expect(['studio', 'condo']).toContain(homes[0]!.type);
    expect(['house', 'estate']).toContain(homes[49]!.type);
  });

  it('are the game’s own each save, but the town’s prices', () => {
    const one = listingsIn(save('homes-a'), 'us-ct-newhaven');
    const two = listingsIn(save('homes-b'), 'us-ct-newhaven');
    expect(one.map((h) => h.address)).not.toEqual(two.map((h) => h.address));
    expect(one[25]!.value / two[25]!.value).toBeGreaterThan(0.9);
    expect(one[25]!.value / two[25]!.value).toBeLessThan(1.1);
  });

  it('are priced from rent at an estimate outside America, and called flats in London', () => {
    const london = homeValueAt('uk-eng-london', 'GBP');
    expect(london.kind).toBe('estimate');
    const sim = save('homes-london', 'uk-eng-london');
    expect(listingsIn(sim, 'uk-eng-london').some((h) => /^Flat \d+, /.test(h.address))).toBe(true);
  });
});

describe('buying', () => {
  it('needs two years’ income for a mortgage, and closes thirty days on', () => {
    const sim = save('homes-buy');
    const listing = house(sim);
    give(sim, askingPrice(sim, listing));
    expect(buyRefusal(sim, sim.player, listing.id, 0.2)).toMatch(/income/);
    earning(sim, 30_000_00);
    sim.player.credit!.score = 780;
    expect(buyRefusal(sim, sim.player, listing.id, 0.2)).toBeUndefined();
    sim.player.credit!.score = 600;
    expect(buyRefusal(sim, sim.player, listing.id, 0.2)).toMatch(/credit record/);
    sim.player.credit!.score = 780;
    const offer = offerFor(sim, sim.player, listing, 0.2);
    expect(Object.values(sim.universe.accounts).some((x) => x.ownerId === sim.player.id && x.category === 'deposit' && x.balance > 0)).toBe(true);
    sim.execute({ kind: 'home.buy', payload: { listingId: listing.id, down: 0.2 } });
    expect(sim.player.owned).toBeUndefined();
    sim.advanceBy(HOME.closingDays * MS_DAY + MS_DAY);
    const owned = sim.player.owned!;
    expect(owned.price).toBe(offer.price);
    expect(loanBalance(sim, owned)).toBe(offer.loan);
    expect(sim.player.home?.kind).toBe('owned');
    expect(rentOf(sim, sim.player)).toBe(0);
    // The lease ended with it, and the landlord gave the deposit back.
    expect(Object.values(sim.universe.accounts).filter((x) => x.ownerId === sim.player.id && x.category === 'deposit').every((x) => x.balance === 0)).toBe(true);
  });

  it('pays England’s stamp duty, with a first-time buyer’s relief', () => {
    const sim = save('homes-sdlt', 'uk-eng-london');
    // £400,000: 5% over £300,000 for a first home; 2% and 5% over the bands for anyone else. And 1% besides.
    expect(closingCost(sim, 'uk-eng-london', 400_000_00, true)).toBe(5_000_00 + 4_000_00);
    expect(closingCost(sim, 'uk-eng-london', 400_000_00, false)).toBe(10_000_00 + 4_000_00);
  });
});

describe('owning', () => {
  it('pays the mortgage on the first, principal off the loan', () => {
    const { sim } = bought('homes-pay', 0.2);
    const owned = sim.player.owned!;
    const before = loanBalance(sim, owned);
    sim.advanceBy(62 * MS_DAY);
    expect(owned.owed).toHaveLength(0);
    expect(loanBalance(sim, owned)).toBeLessThan(before);
    // Principal is what's left of the payment after a month's interest.
    const r = owned.mortgage!.rate / 12;
    expect(before - loanBalance(sim, owned)).toBeGreaterThan((owned.mortgage!.payment - before * r) * 1.9);
  });

  it('charges mortgage insurance under 20% down, and drops it when the loan falls to 78% of the price', () => {
    const quoted = save('homes-pmi-quote');
    const one = house(quoted);
    expect(offerFor(quoted, quoted.player, one, 0.05).month.pmi).toBeGreaterThan(0);
    expect(offerFor(quoted, quoted.player, one, 0.2).month.pmi).toBe(0);
    const { sim } = bought('homes-pmi', 0.05);
    const owned = sim.player.owned!;
    expect(owned.mortgage!.pmi).toBe(true);
    const over = loanBalance(sim, owned) - Math.floor(owned.mortgage!.original * HOME.pmiEnds);
    give(sim, over);
    sim.execute({ kind: 'home.pay_mortgage', payload: { amount: over - 100 } });
    expect(owned.mortgage!.pmi).toBe(true);
    sim.execute({ kind: 'home.pay_mortgage', payload: { amount: 100 } });
    expect(owned.mortgage!.pmi).toBe(false);
  });

  it('charges a fee at fifteen days, reports it at thirty, and forecloses', () => {
    const { sim } = bought('homes-late', 0.05);
    // The bank emptied.
    const checking = sim.universe.accounts[sim.player.primaryAccountId!]!;
    give(sim, -checking.balance);
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'savings' && a.balance > 0) sim.post({ memo: 'gone', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: a.balance }] });
    const score = sim.player.credit!.score;
    sim.advanceBy(75 * MS_DAY);
    expect(sim.player.owned!.owed.some((one) => one.feeCharged)).toBe(true);
    expect(sim.player.owned!.owed.some((one) => one.reported)).toBe(true);
    expect(sim.player.credit!.score).toBeLessThan(score - HOME.reportedFall + 20);
    sim.advanceBy(240 * MS_DAY);
    expect(sim.player.owned).toBeUndefined();
    expect(sim.player.home?.kind).toBe('sofa');
  }, 60_000);

  it('taxes a California home on what it cost, grown at 2% at most, where the market grew faster', () => {
    addCountryCities('us', readFileSync('public/geo/us.tsv', 'utf8'));
    const sim = save('homes-prop13', 'us-ca-irvine');
    earning(sim, 60_000_00);
    const listing = listingsIn(sim, 'us-ca-irvine')[30]!;
    give(sim, askingPrice(sim, listing) * 1.2);
    sim.player.credit!.score = 780;
    sim.execute({ kind: 'home.buy', payload: { listingId: listing.id, down: 1 } });
    sim.advanceBy(31 * MS_DAY);
    const owned = sim.player.owned!;
    owned.boughtAt -= 10 * 365 * MS_DAY;
    // Irvine's market has grown near 9% a year: the assessment, 2% at most.
    expect(assessedValue(sim, owned)).toBeLessThanOrEqual(Math.round(owned.price * 1.02 ** 11));
    expect(assessedValue(sim, owned)).toBeGreaterThanOrEqual(Math.round(owned.price * 1.02 ** 9));
    expect(assessedValue(sim, owned)).toBeLessThan(homeValue(sim, owned) * 0.7);
  });
});

describe('renovating', () => {
  it('adds what a job returns on a worn part, and next to nothing on a new one', () => {
    const { sim } = bought('homes-reno', 1);
    const owned = sim.player.owned!;
    const roof = PROJECTS.find((p) => p.id === 'roof-asphalt')!;
    const year = new Date(sim.now).getUTCFullYear();
    owned.facts.parts.roof = year - 30;
    const worn = projectAdds(sim, owned, roof);
    owned.facts.parts.roof = year;
    expect(projectAdds(sim, owned, roof)).toBe(0);
    owned.facts.parts.roof = year - 30;
    const value = homeValue(sim, owned);
    expect(sim.execute({ kind: 'home.renovate', payload: { projectId: 'roof-asphalt' } }).ok).toBe(true);
    sim.advanceBy((roof.days + 1) * MS_DAY);
    expect(owned.facts.parts.roof).toBeGreaterThanOrEqual(year);
    expect(homeValue(sim, owned) - value).toBeGreaterThanOrEqual(worn * 0.99);
  });

  it('opens and closes work by what the home has, and has no end', () => {
    const { sim } = bought('homes-deck', 1);
    const owned = sim.player.owned!;
    owned.facts.features = owned.facts.features.filter((f) => f !== 'deck');
    delete owned.facts.parts.deck;
    if (!owned.facts.features.includes('yard')) owned.facts.features.push('yard');
    const deck = PROJECTS.find((p) => p.id === 'deck-wood')!;
    const rebuild = PROJECTS.find((p) => p.id === 'deck-renew')!;
    expect(projectRefusal(sim, sim.player, rebuild)).toMatch(/deck/);
    sim.execute({ kind: 'home.renovate', payload: { projectId: 'deck-wood' } });
    sim.advanceBy((deck.days + 1) * MS_DAY);
    expect(projectRefusal(sim, sim.player, deck)).toMatch(/has a deck/);
    expect(projectRefusal(sim, sim.player, rebuild)).toBeUndefined();
    // Baths only to one more than the bedrooms.
    owned.facts.baths = owned.facts.beds + 1;
    expect(projectRefusal(sim, sim.player, PROJECTS.find((p) => p.id === 'bath-add')!)).toMatch(/baths enough/);
  });
});

describe('selling', () => {
  it('closes forty-five days on, pays off the loan, and moves them into a rented home', () => {
    const { sim } = bought('homes-sell', 0.2);
    const owned = sim.player.owned!;
    const net = saleNet(sim, owned);
    const checking = () => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const before = checking();
    expect(sim.execute({ kind: 'home.sell', payload: { then: 'own' } }).ok).toBe(true);
    sim.advanceBy((HOME.saleDays + 1) * MS_DAY);
    expect(sim.player.owned).toBeUndefined();
    expect(sim.player.home?.kind).toBe('own');
    expect(sim.universe.accounts[owned.mortgage!.accountId]!.balance).toBe(0);
    // What the sale left, less the move's deposit and the rest of the month, and the months' payments between.
    expect(checking() - before).toBeGreaterThan(net * 0.8);
  }, 60_000);
});
