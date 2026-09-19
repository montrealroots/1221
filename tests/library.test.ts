/**
 * The library market, held to the thing that nearly stopped it shipping.
 *
 * A first draft of this priced a sale as the remainder minus a fixed third. It passed
 * every test anybody would have written for it — the money moved, the tick stopped, the
 * ledger balanced — and it was still worthless, because the answer was always to keep
 * the picture. A mechanic whose correct play is never to use it is a sentence, not a
 * system.
 *
 * So the tests that matter here are the ones about **whether the decision has two
 * sides**: that a beloved picture sold to a studio that wants it clears more than
 * holding it would have paid, that a picture nobody liked fetches about half, and that
 * roughly half the listings on the market ask more than they will ever pay back. If any
 * of those three goes one-sided, the market has collapsed into a discount again and the
 * right response is to delete it rather than to loosen the test.
 *
 * The second group is about what selling costs beyond the money, because that is the
 * part a player has to be able to regret: the run stops paying us, and the ceremony
 * stops considering it.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Project } from '@/engine/domain/company';
import { cashAccountFor, parentCompany } from '@/engine/world/company';
import {
  APPETITE_BY_STUDIO, A_BUYER_KEEPS, A_RECORD_IS_WORTH, APPETITES, ASKING_STRAYS,
  SOONEST_WEEK, buyersOn, offerOn, titleFrom, whyNotQuote,
} from '@/engine/content/library';
import {
  bestQuote, buyTheTitle, onTheMarket, quotesOn, sellTheTitle, stillToPay, whyNotBuy,
  whyNotSellIt,
} from '@/engine/world/library';
import { payAWeek, type Opening } from '@/engine/world/run';
import { eligible } from '@/engine/world/awards';
import { receivedBy } from '@/engine/world/takings';
import { LAST_WEEK_ANYTHING_PAYS } from '@/engine/content/release';

// ---------------------------------------------------------------------------
// A company with money and one picture already out
// ---------------------------------------------------------------------------

/**
 * Money in the company, as postings rather than as a balance.
 *
 * The house rule applies to fixtures too: a test that assigns a balance is testing a
 * ledger it has already lied to.
 */
function aStudio(seed: string, cents = 40_000_000_00) {
  const sim = quickSave({}, seed);
  const company = parentCompany(sim.universe)!;
  let cash = cashAccountFor(sim.universe, company.id);
  if (!cash) {
    cash = sim.ledger.open({
      id: `acct:${company.id}:cash`,
      saveId: sim.universe.meta.id,
      kind: 'company_cash',
      name: 'Cash',
      ownerId: company.id,
      balance: 0,
      openedAt: sim.now,
      nominal: false,
      category: 'business',
    });
  }
  if (!sim.ledger.tryAccount('equity:capital')) {
    sim.ledger.open({
      id: 'equity:capital',
      saveId: sim.universe.meta.id,
      kind: 'equity',
      name: 'Capital',
      ownerId: 'world',
      balance: 0,
      openedAt: sim.now,
      nominal: true,
      category: 'business',
    });
  }
  const short = cents - cash.balance;
  if (short > 0) {
    sim.post({
      memo: 'Capital In',
      category: 'business',
      postings: [{ accountId: 'equity:capital', amount: -short }, { accountId: cash.id, amount: short }],
    });
  }
  return { sim, company, cash };
}

/**
 * A picture already out, put onto the save directly.
 *
 * Deliberately not played through the pipeline. What is under test here is what happens
 * to a finished run, and the pipeline that produces one is tested at length in
 * `tests/production.test.ts` — driving it again would make every case in this file
 * depend on casting.
 */
function aPictureOut(
  sim: Simulation,
  companyId: string,
  over: Partial<Opening> = {},
  formatId = 'feature',
): Project {
  const project: Project = {
    id: sim.nextId('project'),
    saveId: sim.universe.meta.id,
    companyId,
    title: 'The Weight of Water',
    medium: 'film',
    stage: 'delivered',
    startedAt: sim.now,
    spentCents: 0,
    delivered: [],
    formatId,
    secondsEach: 110 * 60,
    opening: {
      at: sim.now,
      channel: 'theatrical',
      campaignCents: 250_000_00,
      reckonedCents: 20_000_000_00,
      wordOfMouth: 0,
      weeksPaid: 6,
      ...over,
    },
  };
  sim.universe.projects[project.id] = project;
  return project;
}

// ---------------------------------------------------------------------------

describe('what is left to pay, which is the thing being sold', () => {
  it('falls every week, because a week that has paid cannot be sold twice', () => {
    const { sim, company } = aStudio('left-falls');
    const project = aPictureOut(sim, company.id);
    const opening = project.opening as Opening;
    let last = Infinity;
    for (const week of [1, 5, 10, 20, 40, 60]) {
      const left = stillToPay(opening, project.formatId, week);
      expect(left).toBeLessThan(last);
      last = left;
    }
  });

  it('is nothing at all once the last window has shut', () => {
    const { sim, company } = aStudio('left-none');
    const project = aPictureOut(sim, company.id);
    expect(stillToPay(project.opening as Opening, project.formatId, LAST_WEEK_ANYTHING_PAYS + 1)).toBe(0);
  });

  it('is the same arithmetic the tick pays, week for week', () => {
    // The property the whole file rests on. If these two drifted, a player could be
    // paid one figure and quoted another for the same weeks.
    const { sim, company } = aStudio('left-agrees');
    const project = aPictureOut(sim, company.id, { weeksPaid: 0 });
    const before = stillToPay(project.opening as Opening, project.formatId, 1);
    let paid = 0;
    for (let week = 1; week <= LAST_WEEK_ANYTHING_PAYS; week += 1) {
      const got = payAWeek(sim, project.id, week);
      if (!got) continue;
      paid += got.toUsCents + got.windows.reduce((sum, w) => sum + w.cents, 0);
    }
    // Rounding per week against rounding per total, over ninety weeks.
    expect(Math.abs(paid - before) / before).toBeLessThan(0.001);
  });
});

describe('the price, and whether it is a decision', () => {
  it('will not be quoted before the run has a shape', () => {
    const meridian = APPETITE_BY_STUDIO.meridian!;
    expect(whyNotQuote(meridian, 'theatrical', SOONEST_WEEK - 1)).toBeDefined();
    expect(whyNotQuote(meridian, 'theatrical', SOONEST_WEEK)).toBeUndefined();
  });

  it('refuses a channel the buyer does not work in, and says so', () => {
    expect(whyNotQuote(APPETITE_BY_STUDIO.halvard!, 'theatrical', 10)).toBeDefined();
    expect(buyersOn('broadcast').map((a) => a.studioId)).not.toContain('meridian');
    expect(buyersOn('theatrical').map((a) => a.studioId)).toContain('meridian');
  });

  it('pays more for a picture people liked, and much less for one they did not', () => {
    const one = APPETITE_BY_STUDIO.kestrel!;
    const loved = offerOn(one, 10_000_000_00, 1);
    const flat = offerOn(one, 10_000_000_00, 0);
    const hated = offerOn(one, 10_000_000_00, -1);
    expect(loved).toBeGreaterThan(flat);
    expect(flat).toBeGreaterThan(hated);
    expect(hated / loved).toBeLessThan(0.45);
  });

  it('can beat holding the picture, which is what makes selling a question', () => {
    // The test this mechanic exists to pass. A studio that wants cinema, a picture an
    // audience loved: the offer clears the remainder, so keeping it is the mistake.
    const over = offerOn(APPETITE_BY_STUDIO.meridian!, 10_000_000_00, 1);
    expect(over).toBeGreaterThan(10_000_000_00);
  });

  it('is about half for a picture nobody liked, which is the other side of it', () => {
    const under = offerOn(APPETITE_BY_STUDIO.northgate!, 10_000_000_00, -0.8);
    expect(under / 10_000_000_00).toBeLessThan(0.45);
  });

  it('lists all five, refusals included, so the market can be learned', () => {
    const { sim, company } = aStudio('quotes');
    const project = aPictureOut(sim, company.id);
    const quotes = quotesOn(sim, project.id);
    expect(quotes).toHaveLength(APPETITES.length);
    expect(quotes.filter((q) => q.why !== undefined).length).toBeGreaterThan(0);
    expect(quotes.filter((q) => q.why === undefined).length).toBeGreaterThan(0);
    for (const quote of quotes) {
      if (quote.why) expect(quote.cents).toBe(0);
      else expect(quote.cents).toBeGreaterThan(0);
    }
  });

  it('falls as the run goes on, so waiting has a cost as well as a gain', () => {
    const { sim, company } = aStudio('quote-falls');
    const early = aPictureOut(sim, company.id, { weeksPaid: 4 });
    const late = aPictureOut(sim, company.id, { weeksPaid: 40 });
    expect(bestQuote(sim, late.id)!.cents).toBeLessThan(bestQuote(sim, early.id)!.cents);
  });
});

describe('selling, and what it costs beyond the discount', () => {
  it('banks the money and stops the run paying us', () => {
    const { sim, company, cash } = aStudio('sell-stops');
    const project = aPictureOut(sim, company.id, { weeksPaid: 6 });
    const before = cash.balance;
    const done = sellTheTitle(sim, project.id, 'meridian');
    expect(done.ok).toBe(true);
    expect(done.cents).toBeGreaterThan(0);
    expect(cash.balance).toBe(before + done.cents);
    expect(project.opening!.soldAt).toBeDefined();
    // And the weeks after it pay nothing at all.
    expect(payAWeek(sim, project.id, 7)).toBeUndefined();
  });

  it('cannot be sold twice', () => {
    const { sim, company } = aStudio('sell-once');
    const project = aPictureOut(sim, company.id, { weeksPaid: 6 });
    expect(sellTheTitle(sim, project.id, 'kestrel').ok).toBe(true);
    expect(whyNotSellIt(sim, project.id, 'kestrel')).toBeDefined();
    expect(sellTheTitle(sim, project.id, 'kestrel').ok).toBe(false);
  });

  it('is refused before the run has a shape, and by a buyer in the wrong channel', () => {
    const { sim, company } = aStudio('sell-refused');
    const early = aPictureOut(sim, company.id, { weeksPaid: 1 });
    expect(whyNotSellIt(sim, early.id, 'meridian')).toBeDefined();
    const out = aPictureOut(sim, company.id, { weeksPaid: 8 });
    expect(whyNotSellIt(sim, out.id, 'halvard')).toBeDefined();
  });

  it('takes the picture out of the ceremony, which is the real price of the cash', () => {
    const { sim, company } = aStudio('sell-awards');
    const project = aPictureOut(sim, company.id, { weeksPaid: 6 });
    expect(eligible(sim, sim.now).map((p) => p.id)).toContain(project.id);
    sellTheTitle(sim, project.id, 'meridian');
    expect(eligible(sim, sim.now).map((p) => p.id)).not.toContain(project.id);
  });

  it('counts on the picture, so what it returned includes what it was sold for', () => {
    const { sim, company } = aStudio('sell-counts');
    const project = aPictureOut(sim, company.id, { weeksPaid: 6 });
    expect(receivedBy(sim, project.id)).toBe(0);
    const done = sellTheTitle(sim, project.id, 'meridian');
    expect(receivedBy(sim, project.id)).toBe(done.cents);
  });
});

describe('the other side: buying somebody else’s library', () => {
  it('is the same market every time it is asked inside a month', () => {
    const { sim } = aStudio('market-stable');
    const once = onTheMarket(sim);
    const again = onTheMarket(sim);
    expect(again.map((o) => o.id + o.askingCents)).toEqual(once.map((o) => o.id + o.askingCents));
  });

  it('is a different market the month after', () => {
    const { sim } = aStudio('market-moves');
    const months = [0, 1, 2, 3, 4, 5].map((i) => onTheMarket(sim, Date.UTC(2031, i, 8)));
    const shapes = new Set(months.map((m) => m.map((o) => o.title).join('|')));
    expect(shapes.size).toBeGreaterThan(1);
  });

  it('asks more than it will pay about as often as it asks less', () => {
    // If every listing were cheap, buying would be free money and the market would be
    // a faucet. If none were, nobody would ever buy. Both failures look the same from
    // inside a single month, which is why this reads a played decade.
    const { sim } = aStudio('market-spread');
    let dear = 0;
    let cheap = 0;
    for (let year = 2031; year < 2041; year += 1) {
      for (let month = 0; month < 12; month += 1) {
        for (const one of onTheMarket(sim, Date.UTC(year, month, 8))) {
          if (one.askingCents > one.leftCents) dear += 1; else cheap += 1;
        }
      }
    }
    expect(dear + cheap).toBeGreaterThan(40);
    expect(dear / (dear + cheap)).toBeGreaterThan(0.3);
    expect(dear / (dear + cheap)).toBeLessThan(0.7);
  });

  it('never strays further from the remainder than it says it does', () => {
    const { sim } = aStudio('market-bounds');
    for (let month = 0; month < 12; month += 1) {
      for (const one of onTheMarket(sim, Date.UTC(2033, month, 8))) {
        const strayed = Math.abs(one.askingCents - one.leftCents) / one.leftCents;
        expect(strayed).toBeLessThanOrEqual(ASKING_STRAYS + 0.001);
      }
    }
  });

  it('costs the cash and then pays its remaining windows, week by week', () => {
    const { sim, company, cash } = aStudio('buy-pays');
    const listing = firstListing(sim);
    const before = cash.balance;
    const done = buyTheTitle(sim, company.id, listing.id);
    expect(done.ok).toBe(true);
    expect(cash.balance).toBe(before - listing.askingCents);

    let paid = 0;
    for (let week = listing.weeksRun + 1; week <= LAST_WEEK_ANYTHING_PAYS; week += 1) {
      const got = payAWeek(sim, done.projectId!, week);
      if (!got) continue;
      paid += got.toUsCents + got.windows.reduce((sum, w) => sum + w.cents, 0);
    }
    expect(Math.abs(paid - listing.leftCents) / listing.leftCents).toBeLessThan(0.001);
  });

  it('cannot buy the same position twice', () => {
    const { sim, company } = aStudio('buy-once');
    const listing = firstListing(sim);
    expect(buyTheTitle(sim, company.id, listing.id).ok).toBe(true);
    expect(whyNotBuy(sim, company.id, listing.id)).toBeDefined();
  });

  it('cannot buy what the company cannot pay for', () => {
    const { sim, company } = aStudio('buy-broke', 1_00);
    const listing = firstListing(sim);
    expect(whyNotBuy(sim, company.id, listing.id)).toBeDefined();
  });

  it('is never in the running at the ceremony, because somebody else made it', () => {
    const { sim, company } = aStudio('buy-awards');
    const listing = firstListing(sim);
    const done = buyTheTitle(sim, company.id, listing.id);
    expect(eligible(sim, sim.now).map((p) => p.id)).not.toContain(done.projectId);
  });
});

describe('the terms themselves', () => {
  it('discounts before anybody haggles, so the two adjustments have a floor to move off', () => {
    expect(A_BUYER_KEEPS).toBeGreaterThan(0.2);
    expect(A_BUYER_KEEPS).toBeLessThan(0.5);
  });

  it('lets what people said move the price further than the discount takes it', () => {
    // The arithmetic that makes an over-the-odds offer reachable at all.
    const best = APPETITES.reduce((most, a) => Math.max(most, a.pays), 0);
    expect((1 - A_BUYER_KEEPS) * best * (1 + A_RECORD_IS_WORTH)).toBeGreaterThan(1);
  });

  it('names a title from both halves, so a played decade rarely repeats one', () => {
    const seen = new Set<string>();
    for (let a = 0; a < 20; a += 1) for (let b = 0; b < 20; b += 1) seen.add(titleFrom(a, b));
    expect(seen.size).toBe(400);
  });
});

/** The first listing in any month that has one, so a case is never empty by luck. */
function firstListing(sim: Simulation) {
  for (let month = 0; month < 24; month += 1) {
    const found = onTheMarket(sim, Date.UTC(2031 + Math.floor(month / 12), month % 12, 8));
    if (found.length > 0) return found[0]!;
  }
  throw new Error('Two played years with nothing on the market at all.');
}
