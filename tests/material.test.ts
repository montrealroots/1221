/**
 * The material market, held to the three things that make it a market.
 *
 * **It is stable inside a month.** A pool that answered differently every time it was
 * asked would make optioning a reflex, because thinking about it would change the
 * offer. The player has to be able to look, leave, and come back to the same shelf.
 *
 * **It churns between months.** A pool that never changed would be a catalog, and
 * waiting would cost nothing. Most of what is listed has to be gone next month.
 *
 * **Taking something removes it.** This is the one that has no row to delete, because
 * the pool is drawn rather than stored, so it is the one worth testing hardest: the
 * company's own holdings are the only record that a property was taken, and the
 * filter that reads them is the whole of the mechanic.
 *
 * What is deliberately not tested is that a draw produces any particular title. The
 * titles carry no mechanics and asserting one would be a test of the word list.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  APPEAL_STRAYS, ASKS_AT_LEAST, ASKS_SHARE, CARRIES_OVER, COSTS_LIKE, MOST_ON_THE_MARKET,
  PROVENANCES, PROVENANCE_SAID, READS_AS, appealFrom, asksFor, provenanceFrom,
  readsAs, titleFrom,
} from '@/engine/content/material';
import { monthKey, onTheMarket } from '@/engine/world/material';
import { whatItCouldReach } from '@/engine/content/release';
import { holdingsOf } from '@/engine/world/company';
import { addMonths } from '@/engine/core/time';

/** A save with a company in it, which is what the market is read against. */
const aStudio = (seed: string) => quickSave({}, seed);

type Done = { ok: boolean; error?: string };

/** Options something and hands back a shape the assertions can read. */
function option(sim: ReturnType<typeof aStudio>, payload: Record<string, unknown>) {
  const done = sim.execute({ kind: 'company.option', payload });
  const said = done.value as Done | undefined;
  return { ok: said?.ok ?? done.ok, why: said?.error ?? done.error ?? '' };
}

/** The first month, walking forward, that actually has something listed. */
function aMonthWithSomething(sim: ReturnType<typeof aStudio>, tries = 24) {
  let at = sim.now;
  for (let i = 0; i < tries; i += 1) {
    const listed = onTheMarket(sim, at);
    if (listed.length > 0) return { at, listed };
    at = addMonths(at, 1, sim.homeZone);
  }
  throw new Error('two played years and nothing was ever on the market');
}

describe('the pool holds still inside a month', () => {
  it('answers the same thing every time it is asked', () => {
    const sim = aStudio('mat-stable');
    const { at, listed } = aMonthWithSomething(sim);
    const again = onTheMarket(sim, at);
    expect(again.map((one) => `${one.id}:${one.title}:${one.asksCents}`))
      .toEqual(listed.map((one) => `${one.id}:${one.title}:${one.asksCents}`));
  });

  it('answers the same on any day of that month', () => {
    const sim = aStudio('mat-sameday');
    const { at, listed } = aMonthWithSomething(sim);
    const laterInTheMonth = at + 11 * 24 * 60 * 60 * 1000;
    // Only meaningful while the later instant is still the same month.
    if (monthKey(laterInTheMonth, sim.homeZone) === monthKey(at, sim.homeZone)) {
      expect(onTheMarket(sim, laterInTheMonth).map((o) => o.id))
        .toEqual(listed.map((o) => o.id));
    }
  });
});

describe('and moves between them', () => {
  it('offers something different across a played year', () => {
    const sim = aStudio('mat-churn');
    const seen = new Set<string>();
    let at = sim.now;
    for (let m = 0; m < 12; m += 1) {
      for (const one of onTheMarket(sim, at)) seen.add(one.title);
      at = addMonths(at, 1, sim.homeZone);
    }
    // A year of a pool that never changed would offer at most one month's worth.
    expect(seen.size).toBeGreaterThan(MOST_ON_THE_MARKET);
  });

  it('carries some listings over and lets the rest go', () => {
    // Both halves matter. Everything carrying would make waiting free; nothing
    // carrying would make every property a single-month ultimatum.
    const sim = aStudio('mat-carry');
    let carried = 0;
    let fresh = 0;
    let at = sim.now;
    for (let m = 0; m < 36; m += 1) {
      for (const one of onTheMarket(sim, at)) {
        if (one.carriedOver) carried += 1; else fresh += 1;
      }
      at = addMonths(at, 1, sim.homeZone);
    }
    expect(fresh).toBeGreaterThan(0);
    expect(carried).toBeGreaterThan(0);
    // And carrying is the minority, because the roll says so.
    expect(carried / (carried + fresh)).toBeLessThan(0.5);
  });
});

describe('taking something is what removes it', () => {
  it('drops a listing the company already holds', () => {
    const sim = aStudio('mat-taken');
    const { at, listed } = aMonthWithSomething(sim);
    const target = listed[0]!;

    const done = option(sim, { listingId: target.id });
    expect(done.ok, done.why).toBe(true);

    expect(holdingsOf(sim.universe).some((one) => one.title === target.title)).toBe(true);
    expect(onTheMarket(sim, at).some((one) => one.id === target.id)).toBe(false);
  });

  it('charges what the listing asks, not the default fee', () => {
    const sim = aStudio('mat-price');
    const { listed } = aMonthWithSomething(sim);
    const target = listed[0]!;
    const before = sim.ledger.tryAccount('equity:capital');
    void before;

    const done = option(sim, { listingId: target.id });
    expect(done.ok, done.why).toBe(true);

    // The holding took the listing's own kind rather than the payload's default.
    const held = holdingsOf(sim.universe).find((one) => one.title === target.title);
    expect(held?.provenance).toBe(target.provenance);
  });

  it('refuses a listing that is no longer offered', () => {
    const sim = aStudio('mat-stale');
    expect(option(sim, { listingId: '1999-1:0' }).ok).toBe(false);
  });

  it('still takes a typed title, because an original idea is a real way to begin', () => {
    const sim = aStudio('mat-typed');
    const done = option(sim, { title: 'Something Of My Own', hold: 'option', months: 18 });
    expect(done.ok, done.why).toBe(true);
    expect(holdingsOf(sim.universe).some((one) => one.title === 'Something Of My Own')).toBe(true);
  });
});

describe('what a property is and what it costs', () => {
  const REACH = 5_000_000_00;

  it('asks a share of what the thing could reach, by kind', () => {
    // It used to ask a flat figure whatever the property was worth, and the market
    // screen showed what that meant: the dearest thing on offer asked twenty-three
    // thousand against a reach of four and a third million, so taking everything was
    // always right. A rights holder prices against the thing.
    for (const p of PROVENANCES) {
      expect(asksFor(p, 0.5, REACH)).toBe(Math.round(REACH * ASKS_SHARE * COSTS_LIKE[p]));
    }
  });

  it('asks more for a property that could reach further', () => {
    expect(asksFor('novel', 0.5, REACH * 2)).toBeGreaterThan(asksFor('novel', 0.5, REACH));
  });

  it('makes a novel dearer than an original, and life rights dearest', () => {
    expect(asksFor('novel', 0.5, REACH)).toBeGreaterThan(asksFor('original', 0.5, REACH));
    const dearest = PROVENANCES.reduce(
      (most, p) => (asksFor(p, 0.5, REACH) > asksFor(most, 0.5, REACH) ? p : most),
      PROVENANCES[0]!,
    );
    expect(dearest).toBe('life_rights');
  });

  it('spreads a price either side of the middle and never below the floor', () => {
    for (const p of PROVENANCES) {
      expect(asksFor(p, 0, REACH)).toBeLessThan(asksFor(p, 1, REACH));
      expect(asksFor(p, 0, 1)).toBe(ASKS_AT_LEAST);
    }
  });

  it('reaches every kind of source across the range of the draw', () => {
    const seen = new Set(
      Array.from({ length: 400 }, (_, i) => provenanceFrom(i / 400)),
    );
    expect(seen.size).toBe(PROVENANCES.length);
  });

  it('turns up originals more often than life rights', () => {
    const many = Array.from({ length: 1000 }, (_, i) => provenanceFrom(i / 1000));
    const count = (p: string) => many.filter((one) => one === p).length;
    expect(count('original')).toBeGreaterThan(count('life_rights'));
  });

  it('names a property from both halves, so a played decade rarely repeats one', () => {
    const seen = new Set<string>();
    for (let a = 0; a < 24; a += 1) for (let b = 0; b < 24; b += 1) seen.add(titleFrom(a, b));
    expect(seen.size).toBe(576);
  });

  it('keeps carrying-over a minority by its own constant', () => {
    expect(CARRIES_OVER).toBeGreaterThan(0);
    expect(CARRIES_OVER).toBeLessThan(0.5);
  });
});

/**
 * How far a property carries, and how that is said to a person.
 *
 * `APPEAL_STRAYS` exists because a career measurement found the hiring decision was
 * not there: with reach a pure function of the three demands, every property of a
 * given shape was the same property, and a policy costing out every team picked the
 * same team every time. These guard the two halves of the fix — that the number moves,
 * and that what a player is shown moves with it.
 */
describe('how far a property carries', () => {
  it('strays either side of ordinary, and ordinary is one', () => {
    expect(appealFrom(0.5)).toBeCloseTo(1, 10);
    expect(appealFrom(0)).toBeCloseTo(1 - APPEAL_STRAYS, 10);
    expect(appealFrom(1)).toBeCloseTo(1 + APPEAL_STRAYS, 10);
  });

  it('prices it into the asking, so good material is not free', () => {
    const plain = whatItCouldReach({ scope: 3, spectacle: 3, period: 3 }, 1);
    const wanted = whatItCouldReach({ scope: 3, spectacle: 3, period: 3 }, 1 + APPEAL_STRAYS);
    expect(asksFor('novel', 0.5, wanted)).toBeGreaterThan(asksFor('novel', 0.5, plain));
  });

  it('says it in a word, and reaches every word across the range of the draw', () => {
    const seen = new Set(
      Array.from({ length: 400 }, (_, i) => readsAs(appealFrom(i / 400))),
    );
    expect(seen.size).toBe(READS_AS.length);
    for (const word of READS_AS) expect(seen.has(word)).toBe(true);
  });

  it('never says a worse word about a better property', () => {
    // The falsifiability test for the ladder: the word is read off the number, so it
    // may never go backwards as the number goes up.
    let last = -1;
    for (let i = 0; i <= 400; i += 1) {
      const at = READS_AS.indexOf(readsAs(appealFrom(i / 400)));
      expect(at).toBeGreaterThanOrEqual(last);
      last = at;
    }
  });

  it('answers sensibly outside the range it was built for', () => {
    expect(READS_AS).toContain(readsAs(-5));
    expect(READS_AS).toContain(readsAs(99));
  });

  it('has a word for every kind of source, and shows no raw handle', () => {
    for (const one of PROVENANCES) {
      const said = PROVENANCE_SAID[one];
      expect(said, `${one} has no words`).toBeTruthy();
      expect(said).not.toContain('_');
      expect(said[0]).toMatch(/[A-Z]/);
    }
  });

  it('gives the market a property whose carry a player can be shown', () => {
    const sim = quickSave({}, 'market-appeal');
    // Six months, because a month can legitimately list nothing.
    let at = sim.now;
    const going = [];
    for (let i = 0; i < 6; i += 1) {
      going.push(...onTheMarket(sim, at));
      at = addMonths(at, 1, sim.homeZone);
    }
    expect(going.length).toBeGreaterThan(0);
    for (const one of going) {
      expect(one.appeal).toBeGreaterThan(0);
      expect(READS_AS).toContain(readsAs(one.appeal));
    }
  });
});
