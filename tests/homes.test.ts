/**
 * Homes (`systems/homes.ts`): the market in a town and its turnover; offers,
 * counters, earnest money and the inspection; the lender; owning, paying,
 * late fees and foreclosure; the parts that wear and fail; renovations;
 * letting; borrowing against a home; council tax; selling; and what the
 * return reads from all of it.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quickSave, migrate } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { COUNCIL_TAX, homeValueAt, PROJECTS } from '@/engine/content/homes';
import { addCountryCities } from '@/engine/content/geography';
import { rentOf } from '@/engine/systems/household';
import { yearOf } from '@/engine/systems/earnings';
import { figuresFor } from '@/engine/systems/taxreturn';
import {
  HOME, askingPrice, assessedValue, borrowRefusal, closingCost, councilBand, councilTaxYear, daysListed, equityRoom, homeValue, listingsIn,
  lifeOf, livingIn, loanBalance, sellerFloor, offerFor, offerRefusal, owedOn, projectAdds, projectRefusal, rentersCouncilTax, saleNet, upkeepDay,
  type Listing, type OwnedHome,
} from '@/engine/systems/homes';

function save(seed: string, city = 'us-ct-newhaven'): Simulation {
  return quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
}

/** Money into their current account, from outside the story. */
function give(sim: Simulation, amount: number): void {
  sim.post({ memo: 'Test money', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -amount }] });
}

/** Everything out of the bank. */
function empty(sim: Simulation): void {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId === sim.player.id && (a.kind === 'checking' || a.kind === 'savings') && a.balance > 0) {
      sim.post({ memo: 'gone', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: a.balance }] });
    }
  }
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

/** An offer at the asking price, accepted. */
function offer(sim: Simulation, listing: Listing, down: number, live = true, inspect = true): void {
  const answer = sim.must<{ answer: string }>({ kind: 'home.offer', payload: { listingId: listing.id, price: askingPrice(sim, listing), down, live, inspect } });
  expect(answer.answer).toBe('accepted');
}

function bought(seed: string, down: number, live = true): { sim: Simulation; owned: OwnedHome } {
  const sim = save(seed);
  earning(sim, 40_000_00);
  const listing = house(sim);
  give(sim, askingPrice(sim, listing) * 1.2);
  sim.player.credit!.score = 780;
  offer(sim, listing, down, live);
  sim.advanceBy(HOME.closingDays * MS_DAY + MS_DAY);
  const owned = sim.player.homes?.find((h) => h.listingId === listing.id);
  expect(owned).toBeDefined();
  return { sim, owned: owned! };
}

describe('the market', () => {
  it('has fifty homes in a town, cheapest first, spread about Zillow’s typical value', () => {
    const sim = save('homes-fifty');
    const homes = listingsIn(sim, 'us-ct-newhaven');
    expect(homes).toHaveLength(50);
    for (let n = 1; n < 50; n++) expect(askingPrice(sim, homes[n]!)).toBeGreaterThanOrEqual(askingPrice(sim, homes[n - 1]!));
    homes.forEach((h, n) => expect(h.rank).toBe(n + 1));
    const typical = homeValueAt('us-ct-newhaven', 'USD');
    expect(typical.kind).toBe('zillow');
    const middle = (homes[24]!.value + homes[25]!.value) / 2;
    expect(middle / typical.value).toBeGreaterThan(0.85);
    expect(middle / typical.value).toBeLessThan(1.15);
    expect(new Set(homes.map((h) => h.address)).size).toBe(50);
    expect(['studio', 'condo']).toContain(homes[0]!.type);
    expect(['house', 'estate']).toContain(homes[49]!.type);
  });

  it('turns over: homes sell and others come on, and one that sits is cut in price', () => {
    const sim = save('homes-turnover');
    const now = listingsIn(sim, 'us-ct-newhaven').map((h) => h.id);
    const later = listingsIn(sim, 'us-ct-newhaven', sim.now + 130 * MS_DAY).map((h) => h.id);
    expect(later.filter((id) => !now.includes(id)).length).toBeGreaterThan(40);
    const one = listingsIn(sim, 'us-ct-newhaven')[20]!;
    const at = one.listedAt + 70 * MS_DAY;
    expect(daysListed(sim, one, at)).toBe(70);
    const before = askingPrice(sim, one, one.listedAt + 59 * MS_DAY);
    expect(askingPrice(sim, one, at) / before).toBeLessThan(0.975);
  });

  it('is the game’s own each save, at the town’s prices', () => {
    const one = listingsIn(save('homes-a'), 'us-ct-newhaven');
    const two = listingsIn(save('homes-b'), 'us-ct-newhaven');
    expect(one.map((h) => h.address)).not.toEqual(two.map((h) => h.address));
    expect(one[25]!.value / two[25]!.value).toBeGreaterThan(0.85);
    expect(one[25]!.value / two[25]!.value).toBeLessThan(1.15);
  });

  it('prices from rent at an estimate outside America, and calls a flat a flat in London', () => {
    expect(homeValueAt('uk-eng-london', 'GBP').kind).toBe('estimate');
    const sim = save('homes-london', 'uk-eng-london');
    expect(listingsIn(sim, 'uk-eng-london').some((h) => /^Flat \d+, /.test(h.address))).toBe(true);
  });
});

describe('an offer', () => {
  it('is turned down far under the asking price, countered near it, and the counter taken', () => {
    const sim = save('homes-offer');
    earning(sim, 40_000_00);
    sim.player.credit!.score = 780;
    const listing = house(sim);
    const asking = askingPrice(sim, listing);
    give(sim, asking);
    expect(sim.must<{ answer: string }>({ kind: 'home.offer', payload: { listingId: listing.id, price: Math.round(asking * 0.7), down: 0.2, live: true, inspect: true } }).answer).toBe('rejected');
    const under = Math.round(asking * (sellerFloor(sim, listing, true) - 0.02));
    const counter = sim.must<{ answer: string; price?: number }>({ kind: 'home.offer', payload: { listingId: listing.id, price: under, down: 0.2, live: true, inspect: true } });
    expect(counter.answer).toBe('countered');
    expect(counter.price).toBeGreaterThan(under);
    expect(sim.must<{ answer: string }>({ kind: 'home.offer', payload: { listingId: listing.id, price: counter.price, down: 0.2, live: true, inspect: true } }).answer).toBe('accepted');
    expect(sim.player.buying?.price).toBe(counter.price);
    expect(listingsIn(sim, 'us-ct-newhaven').some((h) => h.id === listing.id)).toBe(false);
  });

  it('puts earnest money in escrow, which comes back inside the inspection’s window and is kept after it', () => {
    for (const late of [false, true]) {
      const sim = save(`homes-earnest-${late}`);
      earning(sim, 40_000_00);
      sim.player.credit!.score = 780;
      const listing = house(sim);
      give(sim, askingPrice(sim, listing));
      offer(sim, listing, 0.2);
      const escrow = () => Object.values(sim.universe.accounts).find((a) => a.category === 'earnest')!;
      expect(escrow().balance).toBe(Math.round(askingPrice(sim, listing) * HOME.earnest));
      sim.advanceBy((late ? HOME.inspectionDays + 2 : HOME.reportDays + 1) * MS_DAY);
      expect(sim.player.buying!.inspectedAt).toBeDefined();
      const bank = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
      const earnest = escrow().balance;
      sim.must({ kind: 'home.cancel', payload: {} });
      expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance - bank).toBe(late ? 0 : earnest);
    }
  });

  it('needs two years’ income for a mortgage and a fair record, and 15% down on a home to let', () => {
    const sim = save('homes-lender');
    const listing = house(sim);
    const asking = askingPrice(sim, listing);
    give(sim, asking);
    expect(offerRefusal(sim, sim.player, listing.id, asking, 0.2, true)).toMatch(/income/);
    earning(sim, 40_000_00);
    sim.player.credit!.score = 780;
    expect(offerRefusal(sim, sim.player, listing.id, asking, 0.2, true)).toBeUndefined();
    sim.player.credit!.score = 600;
    expect(offerRefusal(sim, sim.player, listing.id, asking, 0.2, true)).toMatch(/credit record/);
    sim.player.credit!.score = 780;
    expect(offerRefusal(sim, sim.player, listing.id, asking, 0.1, false)).toMatch(/down payment/);
    expect(offerFor(sim, sim.player, listing, 0.2, asking, false).rate).toBeGreaterThan(offerFor(sim, sim.player, listing, 0.2, asking, true).rate);
  });

  it('pays England’s stamp duty, with a first-time buyer’s relief', () => {
    const sim = save('homes-sdlt', 'uk-eng-london');
    expect(closingCost(sim, 'uk-eng-london', 400_000_00, true)).toBe(5_000_00 + 4_000_00);
    expect(closingCost(sim, 'uk-eng-london', 400_000_00, false)).toBe(10_000_00 + 4_000_00);
  });
});

describe('owning', () => {
  it('closes into the home, ending the lease with the deposit back', () => {
    const { sim, owned } = bought('homes-close', 0.2);
    expect(livingIn(sim.player)?.id).toBe(owned.id);
    expect(rentOf(sim, sim.player)).toBe(0);
    expect(Object.values(sim.universe.accounts).filter((x) => x.ownerId === sim.player.id && x.category === 'deposit').every((x) => x.balance === 0)).toBe(true);
  });

  it('bought to let, leaves them where they live', () => {
    const { sim, owned } = bought('homes-invest', 0.25, false);
    expect(livingIn(sim.player)).toBeUndefined();
    expect(sim.player.home?.kind).not.toBe('owned');
    expect(owned.investment).toBe(true);
  });

  it('pays the mortgage on the first, principal off the loan, counted on the record and the return', () => {
    const { sim, owned } = bought('homes-pay', 0.2);
    const cash = bought('homes-pay', 1).sim;
    const before = loanBalance(sim, owned);
    sim.advanceBy(62 * MS_DAY);
    cash.advanceBy(62 * MS_DAY);
    expect(owned.owed.filter((one) => one.kind === 'mortgage')).toHaveLength(0);
    expect(loanBalance(sim, owned)).toBeLessThan(before);
    // Two payments on time, on the record, over the same months paid in cash.
    expect(sim.player.credit!.score - cash.player.credit!.score).toBeGreaterThanOrEqual(2 * HOME.onTimeRise);
    const year = new Date(sim.now).getUTCFullYear();
    expect((yearOf(sim.player, year).homeInterest ?? 0) + (yearOf(sim.player, year - 1).homeInterest ?? 0)).toBeGreaterThan(0);
  });

  it('charges mortgage insurance under 20% down, and drops it at 78% of the price', () => {
    const quoted = save('homes-pmi-quote');
    const one = house(quoted);
    expect(offerFor(quoted, quoted.player, one, 0.05).month.pmi).toBeGreaterThan(0);
    expect(offerFor(quoted, quoted.player, one, 0.2).month.pmi).toBe(0);
    const { sim, owned } = bought('homes-pmi', 0.05);
    expect(owned.mortgage!.pmi).toBe(true);
    const over = loanBalance(sim, owned) - Math.floor(owned.mortgage!.original * HOME.pmiEnds);
    give(sim, over);
    sim.must({ kind: 'home.pay_mortgage', payload: { homeId: owned.id, amount: over - 100 } });
    expect(owned.mortgage!.pmi).toBe(true);
    sim.must({ kind: 'home.pay_mortgage', payload: { homeId: owned.id, amount: 100 } });
    expect(owned.mortgage!.pmi).toBe(false);
  });

  it('charges a fee at fifteen days, reports it at thirty, and forecloses', () => {
    const { sim } = bought('homes-late', 0.05);
    const broke = (days: number) => { for (let d = 0; d < days; d += 5) { empty(sim); sim.advanceBy(5 * MS_DAY); } };
    empty(sim);
    const score = sim.player.credit!.score;
    broke(75);
    const owned = sim.player.homes![0]!;
    expect(owned.owed.some((one) => one.feeCharged)).toBe(true);
    expect(owned.owed.some((one) => one.reported)).toBe(true);
    expect(sim.player.credit!.score).toBeLessThan(score - HOME.reportedFall + 20);
    broke(240);
    expect(sim.player.homes).toHaveLength(0);
    expect(sim.player.home?.kind).toBe('sofa');
  }, 60_000);

  it('taxes a California home on what it cost, grown at 2% at most, where the market grew faster', () => {
    addCountryCities('us', readFileSync('public/geo/us.tsv', 'utf8'));
    const sim = save('homes-prop13', 'us-ca-irvine');
    earning(sim, 60_000_00);
    const listing = listingsIn(sim, 'us-ca-irvine')[30]!;
    give(sim, askingPrice(sim, listing) * 1.2);
    sim.player.credit!.score = 780;
    offer(sim, listing, 1);
    sim.advanceBy(31 * MS_DAY);
    const owned = sim.player.homes![0]!;
    owned.boughtAt -= 10 * 365 * MS_DAY;
    expect(assessedValue(sim, owned)).toBeLessThanOrEqual(Math.round(owned.price * 1.02 ** 11));
    expect(assessedValue(sim, owned)).toBeGreaterThanOrEqual(Math.round(owned.price * 1.02 ** 9));
    expect(assessedValue(sim, owned)).toBeLessThan(homeValue(sim, owned) * 0.7);
  });
});

describe('upkeep', () => {
  it('fails parts the more often the more worn they are', () => {
    const { sim, owned } = bought('homes-wear', 1);
    const year = new Date(sim.now).getUTCFullYear();
    const parts = owned.facts.parts;
    const count = (wear: number) => {
      for (const p of Object.keys(parts) as (keyof typeof parts)[]) parts[p] = year - Math.round(lifeOf(owned.facts, p) * wear);
      owned.owed = [];
      for (let d = 0; d < 730; d++) upkeepDay(sim, sim.player, owned, sim.now + d * MS_DAY);
      return owned.owed.filter((one) => one.kind === 'repair').length;
    };
    expect(count(1.6)).toBeGreaterThan(count(0.8) * 2);
  });

  it('pays the lender before a contractor when the bank holds enough for one', () => {
    const { sim, owned } = bought('homes-order', 0.2);
    sim.advanceBy(40 * MS_DAY);
    empty(sim);
    const payment = owned.mortgage!.payment;
    owned.owed = [
      { kind: 'repair', dueAt: sim.now - 5 * MS_DAY, amount: payment - 10_000, what: 'Your Roof Leaked' },
      { kind: 'mortgage', dueAt: sim.now - MS_DAY, amount: payment, escrow: { tax: 0, insurance: 0, pmi: 0 } },
    ];
    give(sim, payment + 10_000);
    sim.advanceBy(MS_DAY);
    expect(owned.owed.map((one) => one.kind)).toEqual(['repair']);
  });

  it('fails worn parts over a year, and new ones not at all', () => {
    const { sim, owned } = bought('homes-upkeep', 1);
    const year = new Date(sim.now).getUTCFullYear();
    const parts = owned.facts.parts;
    for (const p of Object.keys(parts) as (keyof typeof parts)[]) parts[p] = year;
    let fresh = 0;
    for (let d = 0; d < 365; d++) fresh += upkeepDay(sim, sim.player, owned, sim.now + d * MS_DAY);
    for (const p of Object.keys(parts) as (keyof typeof parts)[]) parts[p] = year - 40;
    let worn = 0;
    for (let d = 0; d < 365; d++) worn += upkeepDay(sim, sim.player, owned, sim.now + d * MS_DAY);
    expect(worn).toBeGreaterThan(fresh);
    expect(worn).toBeGreaterThan(0);
  });
});

describe('renovating', () => {
  it('adds what a job returns on a worn part, and next to nothing on a new one', () => {
    const { sim, owned } = bought('homes-reno', 1);
    const roof = PROJECTS.find((p) => p.id === 'roof-asphalt')!;
    const year = new Date(sim.now).getUTCFullYear();
    owned.facts.parts.roof = year - 30;
    const worn = projectAdds(sim, owned, roof);
    owned.facts.parts.roof = year;
    expect(projectAdds(sim, owned, roof)).toBe(0);
    owned.facts.parts.roof = year - 30;
    give(sim, 100_000_00);
    const value = homeValue(sim, owned);
    sim.must({ kind: 'home.renovate', payload: { homeId: owned.id, projectId: 'roof-asphalt' } });
    sim.advanceBy((roof.days + 1) * MS_DAY);
    expect(owned.facts.parts.roof).toBeGreaterThanOrEqual(year);
    expect(homeValue(sim, owned) - value).toBeGreaterThanOrEqual(worn * 0.99);
  });

  it('opens and closes work by what the home has', () => {
    const { sim, owned } = bought('homes-deck', 1);
    give(sim, 100_000_00);
    owned.facts.features = owned.facts.features.filter((f) => f !== 'deck');
    delete owned.facts.parts.deck;
    if (!owned.facts.features.includes('yard')) owned.facts.features.push('yard');
    const deck = PROJECTS.find((p) => p.id === 'deck-wood')!;
    const rebuild = PROJECTS.find((p) => p.id === 'deck-renew')!;
    expect(projectRefusal(sim, sim.player, owned, rebuild)).toMatch(/deck/);
    sim.must({ kind: 'home.renovate', payload: { homeId: owned.id, projectId: 'deck-wood' } });
    sim.advanceBy((deck.days + 1) * MS_DAY);
    expect(projectRefusal(sim, sim.player, owned, deck)).toMatch(/has a deck/);
    expect(projectRefusal(sim, sim.player, owned, rebuild)).toBeUndefined();
    owned.facts.baths = owned.facts.beds + 1;
    expect(projectRefusal(sim, sim.player, owned, PROJECTS.find((p) => p.id === 'bath-add')!)).toMatch(/baths enough/);
  });
});

describe('letting', () => {
  it('finds a tenant, takes the deposit and the rent, and the return reads it', () => {
    const { sim, owned } = bought('homes-let', 0.25, false);
    sim.must({ kind: 'home.let', payload: { homeId: owned.id, rent: 2_000_00 } });
    sim.advanceBy(120 * MS_DAY);
    const t = owned.tenancies.find((one) => one.unit === 'main')!;
    expect(t.status).toBe('let');
    const deposit = sim.universe.accounts[t.depositAccountId!]!;
    expect(deposit.balance).toBe(-2_000_00);
    const got = Object.values(sim.player.earnings!.years).reduce((s, y) => s + (y.rentalRent ?? 0), 0);
    expect(got).toBeGreaterThanOrEqual(2_000_00);
  }, 60_000);

  it('asks no more than the market bears, and not of a home they live in', () => {
    const { sim, owned } = bought('homes-let-refuse', 0.2);
    expect(sim.execute({ kind: 'home.let', payload: { homeId: owned.id, rent: 1_000_00 } }).ok).toBe(false);
    const other = bought('homes-let-high', 0.25, false);
    expect(other.sim.execute({ kind: 'home.let', payload: { homeId: other.owned.id, rent: 1_000_000_00 } }).ok).toBe(false);
  });
});

describe('borrowing against it', () => {
  it('lends to 80% of the value less the mortgage, and paid monthly', () => {
    const { sim, owned } = bought('homes-heloc', 1);
    const room = equityRoom(sim, owned);
    expect(room).toBeLessThanOrEqual(homeValue(sim, owned) * HOME.equityCeiling - loanBalance(sim, owned));
    expect(borrowRefusal(sim, sim.player, owned, room + 100_000_00)).toMatch(/80%/);
    const amount = Math.min(room, 20_000_00);
    sim.must({ kind: 'home.borrow', payload: { homeId: owned.id, amount } });
    expect(owedOn(sim, owned.equity)).toBe(amount);
    sim.advanceBy(40 * MS_DAY);
    expect(owedOn(sim, owned.equity)).toBeLessThan(amount);
  });
});

describe('council tax', () => {
  it('bands a home by its 1991 value and takes a quarter off for somebody alone', () => {
    const sim = save('homes-council', 'uk-eng-london');
    expect(councilBand(sim, 0)).toBe(0);
    const d = councilTaxYear(sim, 3, false);
    expect(councilTaxYear(sim, 7, false) / d).toBeCloseTo(2, 5);
    expect(councilTaxYear(sim, 3, true) / d).toBeCloseTo(1 - COUNCIL_TAX.livingAlone, 5);
    expect(rentersCouncilTax(sim, sim.player)).toBeGreaterThan(0);
    expect(rentersCouncilTax(save('homes-council-ny', 'us-ny-newyork'), save('homes-council-ny2', 'us-ny-newyork').player)).toBe(0);
  });
});

describe('selling', () => {
  it('closes forty-five days on, pays off the loan, and moves them into a rented home', () => {
    const { sim, owned } = bought('homes-sell', 0.2);
    const net = saleNet(sim, owned);
    const checking = () => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const before = checking();
    sim.must({ kind: 'home.sell', payload: { homeId: owned.id, then: 'own' } });
    sim.advanceBy((HOME.saleDays + 1) * MS_DAY);
    expect(sim.player.homes).toHaveLength(0);
    expect(sim.player.home?.kind).toBe('own');
    expect(sim.universe.accounts[owned.mortgage!.accountId]!.balance).toBe(0);
    expect(checking() - before).toBeGreaterThan(net * 0.8);
  }, 60_000);

  it('keeps a lived-in home’s gain free of tax after two years, and taxes a quick flip’s', () => {
    const { sim, owned } = bought('homes-gain', 1);
    owned.price = Math.round(owned.price / 3);
    owned.boughtAt -= 3 * 365 * MS_DAY;
    owned.occupied[0]!.from -= 3 * 365 * MS_DAY;
    sim.must({ kind: 'home.sell', payload: { homeId: owned.id, then: 'own' } });
    sim.advanceBy((HOME.saleDays + 1) * MS_DAY);
    const year = new Date(sim.now).getUTCFullYear();
    const y = yearOf(sim.player, year);
    expect(y.homeGainExcluded ?? 0).toBeGreaterThan(0);
    const flip = bought('homes-flip', 1, false);
    // Worth half as much again as it cost, on the day.
    flip.owned.improvements.push({ projectId: 'paint', at: flip.sim.now, value: Math.round(flip.owned.price / 2), cost: 0 });
    flip.sim.must({ kind: 'home.sell', payload: { homeId: flip.owned.id } });
    flip.sim.advanceBy((HOME.saleDays + 1) * MS_DAY);
    const fy = yearOf(flip.sim.player, new Date(flip.sim.now).getUTCFullYear());
    expect(fy.homeGainShort ?? 0).toBeGreaterThan(0);
    expect(fy.homeGainExcluded ?? 0).toBe(0);
    expect(figuresFor(flip.sim.player, new Date(flip.sim.now).getUTCFullYear()).income).toBeGreaterThanOrEqual(fy.homeGainShort ?? 0);
  }, 60_000);
});

describe('the return', () => {
  it('itemizes when a home’s interest and taxes beat the standard deduction, and not otherwise', () => {
    const sim = save('homes-itemize');
    const year = new Date(sim.now).getUTCFullYear();
    const y = yearOf(sim.player, year);
    y.acting = 150_000_00;
    const plain = figuresFor(sim.player, year);
    expect(plain.itemized).toBe(0);
    y.homeInterest = 30_000_00;
    y.homeTax = 8_000_00;
    const itemized = figuresFor(sim.player, year);
    expect(itemized.itemized).toBeGreaterThanOrEqual(38_000_00);
    expect(itemized.federal).toBeLessThan(plain.federal);
  });

  it('allows a rental loss only to $25,000 less half of income over $100,000', () => {
    const sim = save('homes-passive');
    const year = new Date(sim.now).getUTCFullYear();
    const y = yearOf(sim.player, year);
    y.rentalRent = 10_000_00;
    y.rentalCosts = 50_000_00;
    y.acting = 90_000_00;
    expect(figuresFor(sim.player, year).rental).toBe(-25_000_00);
    y.acting = 140_000_00;
    expect(figuresFor(sim.player, year).rental).toBe(-5_000_00);
  });
});

describe('an older save', () => {
  it('has its one home moved into the list of homes', () => {
    const { sim } = bought('homes-migrate', 1);
    const universe = structuredClone(sim.universe);
    const person = universe.people[universe.playerId]! as unknown as Record<string, unknown>;
    const [home] = person.homes as OwnedHome[];
    person.owned = { ...home, id: undefined };
    delete person.homes;
    migrate(universe);
    expect((universe.people[universe.playerId]!.homes ?? [])[0]?.id).toBe('home-1');
  });
});
