/**
 * SLATE — a delivered picture, sold, and the money walking home.
 *
 * The test that matters most is the one the research set: if changing a term
 * does not change who gets paid what in a downside case, the waterfall is
 * decoration. Several below exist only to hold that line.
 *
 * The fact underneath all of them: a picture can take in more money than it
 * cost and return nothing to the people who paid for it. That is not a bug to
 * be fixed, it is how an ordered recoupment behaves, and a game that rounds it
 * off to "made back its budget" has thrown away the most interesting number in
 * the business.
 *
 * Two of these pin bugs that a live save-probe caught and the tests had not:
 * interest charged on the whole original negative forever, and an outright sale
 * reporting a tiered split it does not have.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { projectsOf } from '@/engine/world/company';
import { MS_WEEK } from '@/engine/world/lot';
import { DEALS, TIERS, WINDOWS, dealById, ultimateFor } from '@/engine/content/selling';
import {
  decideTake, grossSoFar, splitIt, standingOf, whereTheMoneyStands,
} from '@/engine/world/selling';
import { finishesBy, heldUpBy } from '@/engine/world/making';

interface Done { ok: boolean; id?: string; error?: string }

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

const world = (seed = 'selling'): Simulation => quickSave({}, seed);

const STUDIO = dealById('studio')!;
const STREAMER = dealById('streamer')!;

/**
 * One receipt of everything, arriving at a given age.
 *
 * The waterfall walks receipts with dates on them, because interest accrues on
 * what is outstanding between one and the next. A test that wants to reason
 * about a single total says so with this.
 */
const oneLump = (cents: number, yearsOut: number) => [{ weeksOut: yearsOut * 52, cents }];

/** Takes a picture all the way to delivered, so it can be sold. */
function deliverOne(sim: Simulation, title = 'Hvítserkur'): string {
  run(sim, 'company.develop', { title, medium: 'film' });
  const id = projectsOf(sim.universe).find((one) => one.title === title)!.id;
  expect(run(sim, 'company.greenlight', {
    projectId: id, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 6,
  }).error).toBeUndefined();

  for (let i = 0; i < 8; i += 1) {
    const done = finishesBy(sim.universe.projects[id]!)!;
    if (sim.now > done) break;
    sim.advanceTo(done + MS_DAY);
  }
  for (const element of heldUpBy(sim.universe.projects[id]!)) {
    expect(run(sim, 'company.deliver', { projectId: id, elementId: element.id }).ok).toBe(true);
  }
  expect(sim.universe.projects[id]!.stage).toBe('delivered');
  return id;
}

/** The company's cash account, which is where anything coming back lands. */
function purse(sim: Simulation, projectId: string): string {
  const companyId = sim.universe.projects[projectId]!.companyId;
  return Object.values(sim.universe.accounts)
    .find((a) => a.ownerId === companyId && a.kind === 'company_cash' && !a.closedAt)!.id;
}

/** Only what this picture actually put into the company's account. */
function banked(sim: Simulation, projectId: string): number {
  const account = purse(sim, projectId);
  return sim.universe.transactions
    .filter((t) => t.refType === 'project' && t.refId === projectId)
    .flatMap((t) => t.postings)
    .filter((p) => p.accountId === account && p.amount > 0)
    .reduce((sum, p) => sum + p.amount, 0);
}

// ---------------------------------------------------------------------------

describe('the waterfall, which is the whole of film accounting', () => {
  it('pays the tiers in order, and the people who paid for it are third', () => {
    const negative = 20_000_000_00;
    const split = splitIt(oneLump(100_000_000_00, 1), STUDIO, negative);
    // The fee comes off the top of everything, before any recoupment.
    expect(split.took.fee).toBe(Math.round(100_000_000_00 * STUDIO.fee));
    // Then the marketing, in full, before the money that made the picture.
    expect(split.took.marketing).toBe(Math.round(negative * STUDIO.spendsOnSelling));
    // Only then the negative.
    expect(split.took.negative).toBeGreaterThan(0);
    expect(split.stillOwedCents).toBe(0);
    // And nothing invented along the way.
    const out = TIERS.reduce((sum, tier) => sum + split.took[tier.id], 0);
    expect(out).toBe(split.grossCents);
  });

  it('returns nothing on a picture that grossed exactly what it cost', () => {
    const negative = 20_000_000_00;
    const split = splitIt(oneLump(negative, 1), STUDIO, negative);
    // Grossing your budget back pays the fee, most of the marketing, and
    // nothing else. This is the fact the whole file exists for.
    expect(split.took.negative).toBe(0);
    expect(split.toTheCompanyCents).toBe(0);
    expect(split.stillOwedCents).toBeGreaterThan(0);
  });

  it('still returns nothing at twice the budget, which surprises people', () => {
    const negative = 20_000_000_00;
    const split = splitIt(oneLump(2 * negative, 1), STUDIO, negative);
    expect(split.toTheCompanyCents).toBeLessThan(negative);
    expect(split.stillOwedCents).toBeGreaterThan(0);
  });

  it('moves who gets paid when the distribution fee moves, in a downside case', () => {
    // The bar the research set. A term that does not change a downside outcome
    // is a term the model is only pretending to have.
    const negative = 20_000_000_00;
    const gross = oneLump(30_000_000_00, 1);
    const hungry = splitIt(gross, { ...STUDIO, fee: 0.4 }, negative);
    const lean = splitIt(gross, { ...STUDIO, fee: 0.2 }, negative);
    expect(lean.took.negative).toBeGreaterThan(hungry.took.negative);
    expect(lean.stillOwedCents).toBeLessThan(hungry.stillOwedCents);
  });

  it('moves who gets paid when the marketing spend moves, in a downside case', () => {
    const negative = 20_000_000_00;
    const gross = oneLump(40_000_000_00, 1);
    const loud = splitIt(gross, { ...STUDIO, spendsOnSelling: 1.4 }, negative);
    const quiet = splitIt(gross, { ...STUDIO, spendsOnSelling: 0.3 }, negative);
    expect(quiet.took.negative).toBeGreaterThan(loud.took.negative);
  });

  it('moves who gets paid when the picture sits unrecouped for longer', () => {
    const negative = 20_000_000_00;
    // Enough that the negative tier actually fills — below that both cases are
    // capped by what came in and the interest term cannot show.
    const gross = 140_000_000_00;
    const soon = splitIt(oneLump(gross, 1), STUDIO, negative);
    const late = splitIt(oneLump(gross, 8), STUDIO, negative);
    // Interest accrues on money the financier has not got back, so waiting
    // costs the net and not the financier.
    expect(late.took.negative).toBeGreaterThan(soon.took.negative);
    expect(late.took.net).toBeLessThan(soon.took.net);
  });

  it('charges interest on what is outstanding, not on the whole negative forever', () => {
    // The bug a live probe caught: a flat charge against the original negative
    // for the picture's whole life turned a twenty million euro film into a
    // forty-seven million euro debt.
    const negative = 20_000_000_00;
    // Paid off early, then nothing for a decade. Once the negative is covered
    // the clock has to stop.
    const early = splitIt(
      [{ weeksOut: 1, cents: 80_000_000_00 }, { weeksOut: 520, cents: 10_000_000_00 }],
      STUDIO, negative,
    );
    expect(early.stillOwedCents).toBe(0);
    // Ten years of waiting never charged: the negative tier took the principal
    // plus a week, and nothing like a decade of interest.
    expect(early.took.negative).toBeLessThan(Math.round(negative * 1.05));
    expect(early.took.negative).toBeGreaterThanOrEqual(negative);
  });

  it('never pays out more than came in, on any terms', () => {
    const negative = 20_000_000_00;
    for (const deal of DEALS) {
      for (const years of [0, 1, 5, 12]) {
        for (const gross of [0, negative, 3 * negative, 20 * negative]) {
          const split = splitIt(oneLump(gross, years), deal, negative);
          const out = TIERS.reduce((sum, tier) => sum + split.took[tier.id], 0);
          expect(out, `${deal.id} at ${years}y on ${gross}`).toBe(gross);
          expect(split.toTheCompanyCents).toBeLessThanOrEqual(gross);
        }
      }
    }
  });
});

describe('the rule of thumb everybody in the business quotes', () => {
  it('needs about three times its budget to pay its financier back in full', () => {
    const negative = 20_000_000_00;
    // Walk the gross up until the negative is whole. Nothing told the model to
    // land near 3x — it falls out of a 32.5% fee taken off the top and a
    // marketing spend of 85% of the negative recouped ahead of it, which is
    // what makes the agreement with the trade's own rule worth checking.
    let whole = 0;
    for (let x = 1; x <= 80; x += 1) {
      const at = Math.round(negative * x * 0.1);
      if (splitIt(oneLump(at, 0), STUDIO, negative).stillOwedCents === 0) { whole = x * 0.1; break; }
    }
    expect(whole).toBeGreaterThan(2.4);
    expect(whole).toBeLessThan(3.6);
  });

  it('starts paying it back far earlier than that, which is a different question', () => {
    const negative = 20_000_000_00;
    let first = 0;
    for (let x = 1; x <= 80; x += 1) {
      const at = Math.round(negative * x * 0.1);
      if (splitIt(oneLump(at, 0), STUDIO, negative).took.negative > 0) { first = x * 0.1; break; }
    }
    // The first euro back arrives once the fee and the marketing are covered,
    // which is a long way before the financier is whole.
    expect(first).toBeGreaterThan(1);
    expect(first).toBeLessThan(2);
  });

  it('lets a picture recoup on a deal with no fee and no marketing to repay', () => {
    const negative = 20_000_000_00;
    const outright = splitIt(oneLump(Math.round(negative * 1.2), 0), STREAMER, negative);
    expect(outright.stillOwedCents).toBe(0);
    expect(outright.toTheCompanyCents).toBe(Math.round(negative * 1.2));
  });
});

describe('what a picture is reckoned to take', () => {
  it('climbs with budget, and climbs slower than the budget does', () => {
    const small = ultimateFor(2_000_000_00);
    const big = ultimateFor(100_000_000_00);
    expect(big).toBeGreaterThan(small);
    expect(big / small).toBeLessThan(100_000_000_00 / 2_000_000_00);
  });

  it('reckons a buyout reaches less of a decade than a wide release', () => {
    const of = (dealId: string): number =>
      decideTake({ negativeCents: 20_000_000_00, dealId }, 0.5).cents;
    expect(of('studio')).toBeGreaterThan(of('agent'));
    expect(of('agent')).toBeGreaterThan(of('streamer'));
  });

  it('lands inside a wide band, because nobody knows what a picture will take', () => {
    const worst = decideTake({ negativeCents: 20_000_000_00, dealId: 'studio' }, 0).cents;
    const best = decideTake({ negativeCents: 20_000_000_00, dealId: 'studio' }, 1).cents;
    expect(best).toBeGreaterThan(3 * worst);
  });
});

describe('selling a picture', () => {
  it('refuses one that is not delivered, because a buyer buys the elements', () => {
    const sim = world('unfinished');
    run(sim, 'company.develop', { title: 'Hvítserkur', medium: 'film' });
    const id = projectsOf(sim.universe).find((one) => one.title === 'Hvítserkur')!.id;
    const done = run(sim, 'company.sell', { projectId: id, dealId: 'studio' });
    expect(done.ok).toBe(false);
    expect(done.error).toContain('isn’t delivered');
  });

  it('refuses to sell the same picture twice', () => {
    const sim = world('twice');
    const id = deliverOne(sim);
    expect(run(sim, 'company.sell', { projectId: id, dealId: 'studio' }).ok).toBe(true);
    const again = run(sim, 'company.sell', { projectId: id, dealId: 'streamer' });
    expect(again.ok).toBe(false);
    expect(again.error).toContain('already sold');
  });

  it('refuses a deal nobody has offered', () => {
    const sim = world('nodeal');
    const id = deliverOne(sim);
    expect(run(sim, 'company.sell', { projectId: id, dealId: 'handshake' }).ok).toBe(false);
  });

  it('pays a buyout at signature and never again', () => {
    const sim = world('outright');
    const id = deliverOne(sim);
    const project = () => sim.universe.projects[id]!;
    expect(run(sim, 'company.sell', { projectId: id, dealId: 'streamer' }).ok).toBe(true);
    const atOnce = banked(sim, id);
    expect(atOnce).toBe(Math.round((project().budgetCents ?? 0) * STREAMER.upFront));
    // Not the balance — the lot charges its overhead every month regardless.
    // What must never happen is another euro arriving from the picture.
    sim.advanceTo(sim.now + 5 * 365 * MS_DAY);
    expect(banked(sim, id), 'an outright sale kept paying').toBe(atOnce);
    expect(project().windowsPaid).toEqual([]);
  });

  it('pays nothing at signature on a studio deal, and pays as the windows open', () => {
    const sim = world('windows');
    const id = deliverOne(sim);
    const project = () => sim.universe.projects[id]!;
    expect(run(sim, 'company.sell', { projectId: id, dealId: 'studio' }).ok).toBe(true);
    expect(banked(sim, id)).toBe(0);
    sim.advanceTo(project().releasedAt! + 5 * MS_WEEK);
    expect(project().windowsPaid!.length).toBeGreaterThan(0);
    expect(project().windowsPaid!.length).toBeLessThan(WINDOWS.length);
  });

  it('pays every window across a decade, and the gross sums to the whole take', () => {
    const sim = world('decade');
    const id = deliverOne(sim);
    const project = () => sim.universe.projects[id]!;
    run(sim, 'company.sell', { projectId: id, dealId: 'studio' });
    sim.advanceTo(project().releasedAt! + 300 * MS_WEEK);
    expect(project().windowsPaid).toHaveLength(WINDOWS.length);
    // Each window rounds its own share, so the sum can miss the total by a
    // cent per window in either direction. Anything wider is a real leak.
    expect(Math.abs(grossSoFar(project()) - project().takeCents!))
      .toBeLessThanOrEqual(WINDOWS.length);
  });

  it('never pays the company more than the waterfall says it is owed', () => {
    const sim = world('owed');
    const id = deliverOne(sim);
    const project = () => sim.universe.projects[id]!;
    run(sim, 'company.sell', { projectId: id, dealId: 'studio' });
    sim.advanceTo(project().releasedAt! + 300 * MS_WEEK);
    const split = standingOf(project())!;
    expect(banked(sim, id)).toBe(split.toTheCompanyCents);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
  });

  it('stores which windows have paid and nothing else about the money', () => {
    const sim = world('stored');
    const id = deliverOne(sim);
    const project = () => sim.universe.projects[id]!;
    run(sim, 'company.sell', { projectId: id, dealId: 'studio' });
    sim.advanceTo(project().releasedAt! + 60 * MS_WEEK);
    // Drop a window back off the list and every derived figure moves with it,
    // because none of them are stored.
    const before = standingOf(project())!.grossCents;
    project().windowsPaid = project().windowsPaid!.slice(0, -1);
    expect(standingOf(project())!.grossCents).toBeLessThan(before);
  });
});

describe('where the money stands, said out loud', () => {
  it('says nobody has bought it, before anybody has', () => {
    const sim = world('sentence');
    const id = deliverOne(sim);
    expect(whereTheMoneyStands(sim.universe.projects[id]!)).toContain('nobody has bought it');
  });

  it('says what it has taken and what the company has seen', () => {
    const sim = world('said');
    const id = deliverOne(sim);
    const project = () => sim.universe.projects[id]!;
    run(sim, 'company.sell', { projectId: id, dealId: 'studio' });
    sim.advanceTo(project().releasedAt! + 5 * MS_WEEK);
    const said = whereTheMoneyStands(project());
    expect(said).toContain('has taken');
    expect(said).toContain('the company has seen');
  });

  it('does not describe a split an outright sale does not have', () => {
    // The second bug the probe caught: a buyout has no tiers to report, and
    // describing one was describing a deal somebody did not sign.
    const sim = world('buyout-said');
    const id = deliverOne(sim);
    run(sim, 'company.sell', { projectId: id, dealId: 'streamer' });
    const said = whereTheMoneyStands(sim.universe.projects[id]!);
    expect(said).toContain('that check is all of it');
    expect(said).not.toContain('the company has seen');
  });
});

describe('the terms themselves', () => {
  it('splits the whole take across the windows and loses none of it', () => {
    const total = WINDOWS.reduce((sum, w) => sum + w.share, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('opens the windows in order, starting with the theatrical run', () => {
    expect(WINDOWS[0]!.id).toBe('theatrical');
    for (const [i, window] of WINDOWS.entries()) {
      if (i > 0) expect(window.opensAt).toBeGreaterThan(WINDOWS[i - 1]!.opensAt);
    }
  });

  it('keeps the home window at the seventeen days the business moved to', () => {
    // Ninety days until 2020, seventeen after it. A game modeling the old hold
    // is modeling a business that stopped existing.
    expect(WINDOWS.find((w) => w.id === 'home')!.opensAt).toBeLessThan(3);
  });

  it('offers deals that fail in different ways, not three sizes of one deal', () => {
    expect(new Set(DEALS.map((d) => d.reach)).size).toBe(DEALS.length);
    expect(DEALS.filter((d) => d.upFront > 0)).toHaveLength(1);
    expect(DEALS.filter((d) => d.reach === 0)).toHaveLength(1);
  });
});
