/**
 * How a card charges interest (`systems/credit.ts`): module 5 of
 * `docs/BANKING-FUNCTIONS.md`. Until 2026-09-26 a month's interest was one
 * sum at the statement, on that day's balance, and the rate was repriced
 * from the record every month.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, startOfNextDay } from '@/engine/core/time';
import { CARDS, type CardProduct } from '@/engine/content/cards';
import { CANADA_PENALTY, cardOf, cardTerms, DUE_KIND, STATEMENT_KIND } from '@/engine/systems/credit';
import { cardStatement, periodsOf } from '@/engine/systems/statements';

const cards = CARDS as Record<string, CardProduct | { none: true; source: string }>;
const kept = new Map<string, unknown>();
function withCard(bankId: string, product: CardProduct) { if (!kept.has(bankId)) kept.set(bankId, cards[bankId]); cards[bankId] = product; }
afterEach(() => { for (const [k, v] of kept) { if (v) cards[k] = v as CardProduct; else delete cards[k]; } kept.clear(); });

const lifeIn = (cityId: string, extra: Record<string, unknown> = {}, seed = 'int') =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, wealth: 'scraping', ...extra }, seed);
const card = (sim: Simulation) => cardOf(sim, sim.player)!;
const give = (sim: Simulation, accountId: string, amount: number) => sim.post({ memo: 'test', category: 'test', postings: [{ accountId, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const next = (sim: Simulation, kind: string) => sim.timeline.pending().find((i) => i.kind === kind && i.payload.personId === sim.player.id)?.at;
/** The next statement, failing fast where none is ahead (a closed card has none). */
const statementAhead = (sim: Simulation) => { const at = next(sim, STATEMENT_KIND); if (at === undefined) throw new Error('no statement ahead'); return at; };
const interestOn = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'Interest' && t.postings.some((p) => p.accountId === card(sim).id));
/** To just past the next due date, with money in the bank to pay what autopay asks. */
function throughDue(sim: Simulation): void {
  let due = next(sim, DUE_KIND);
  // A card that owes nothing has no due date: three statements without one is a test that forgot to spend.
  for (let tries = 0; due === undefined; tries += 1) {
    if (tries === 3) throw new Error('no due date ahead: the card owes nothing');
    sim.advanceTo(statementAhead(sim) + 1000);
    due = next(sim, DUE_KIND);
  }
  give(sim, sim.player.primaryAccountId!, 50_000_000_00);
  sim.advanceTo(due + 1000);
}
const base: CardProduct = { name: 'Test', kind: 'revolving', apr: 0.24, minimumShare: 0.02, minimumFloor: 1_000_00, source: 'test', asOf: '2026-09-26' };

describe('the grace period', () => {
  it('charges nothing on a card paid in full each month', () => {
    const sim = lifeIn('is-39-mosfellsbr', {}, 'int-grace');
    withCard(card(sim).bankId!, base);
    sim.player.credit!.carrying = false;
    sim.player.credit!.autopay = 'full';
    for (let i = 0; i < 3; i += 1) { give(sim, card(sim).id, -20_000_00); throughDue(sim); }
    sim.advanceTo(statementAhead(sim) + 1000);
    expect(interestOn(sim)).toEqual([]);
    // Then one month carried: charged for that cycle alone, not for the months the grace period covered.
    sim.player.credit!.autopay = 'minimum';
    give(sim, card(sim).id, -20_000_00);
    const from = sim.now;
    throughDue(sim);
    sim.advanceTo(statementAhead(sim) + 1000);
    const charged = -interestOn(sim).at(-1)!.postings.find((p) => p.accountId === card(sim).id)!.amount;
    const days = (sim.now - from) / MS_DAY;
    expect(charged).toBeLessThan(Math.round(40_000_00 * card(sim).apr! * (days + 2) / 365));
  });

  it('is lost by a statement not paid in full, and the cycle is charged from the day the spending went on, compounded daily', () => {
    const sim = lifeIn('is-39-mosfellsbr', {}, 'int-lost');
    withCard(card(sim).bankId!, base);
    const c = card(sim);
    give(sim, c.id, -c.balance);
    sim.player.credit!.carrying = false;
    sim.player.credit!.autopay = 'minimum';
    give(sim, c.id, -100_000_00);
    const spentAt = sim.now;
    throughDue(sim);
    sim.advanceTo(statementAhead(sim) + 1000);
    const charged = -interestOn(sim).at(-1)!.postings.find((p) => p.accountId === c.id)!.amount;
    const days = (sim.now - spentAt) / MS_DAY;
    // At the card's own rate, set when it opened: a little under the whole balance for every day (the minimum came off at the due date), compounded.
    const apr = c.apr!;
    expect(charged).toBeGreaterThan(Math.round(90_000_00 * apr * days / 365));
    expect(charged).toBeLessThan(Math.round(100_000_00 * ((1 + apr / 365) ** days - 1)) + 1);
  });

  it('is regained by paying in full, with the interest up to that day charged once, as trailing interest', () => {
    const sim = lifeIn('is-39-mosfellsbr', {}, 'int-trailing');
    withCard(card(sim).bankId!, base);
    sim.player.credit!.carrying = true;
    sim.player.credit!.autopay = 'full';
    give(sim, card(sim).id, -50_000_00);
    throughDue(sim);
    expect(sim.player.credit!.carrying).toBe(false);
    expect(sim.player.credit!.trailing).toBeGreaterThan(0);
    sim.advanceTo(statementAhead(sim) + 1000);
    const before = interestOn(sim).length;
    expect(before).toBeGreaterThan(0);
    expect(sim.player.credit!.trailing).toBe(0);
    // Then paid in full with the grace back: nothing more.
    throughDue(sim);
    sim.advanceTo(statementAhead(sim) + 1000);
    expect(interestOn(sim).length).toBe(before);
  });
});

describe('daily compounding', () => {
  it('builds each day on the day before’s interest as well as the balance', () => {
    const sim = lifeIn('is-39-mosfellsbr', {}, 'int-compound');
    const c = card(sim);
    // Money in the bank so the day's groceries go on the debit card and the card's balance holds still.
    give(sim, sim.player.primaryAccountId!, 100_000_000_00);
    give(sim, c.id, -c.balance - 100_000_00);
    sim.player.credit!.carrying = true;
    sim.player.credit!.accrued = 0;
    const r = cardTerms(sim, c, sim.player.credit!.score).apr;
    // Thirty rollovers, none of them a statement's.
    const statement = statementAhead(sim);
    const start = sim.now;
    sim.advanceBy(Math.min(30 * MS_DAY, statement - start - MS_DAY));
    // One day's interest for each midnight crossed.
    let days = 0;
    for (let t = startOfNextDay(start, sim.zone); t <= sim.now; t = startOfNextDay(t, sim.zone)) days += 1;
    expect(days).toBeGreaterThan(5);
    expect(c.balance).toBe(-100_000_00);
    expect(sim.player.credit!.accrued).toBeCloseTo(100_000_00 * ((1 + r / 365) ** days - 1), -1);
  });
});

describe('the rate', () => {
  it('is held from the card’s opening, whatever the record does after', () => {
    const sim = lifeIn('is-39-mosfellsbr', {}, 'int-held');
    const opened = card(sim).apr;
    sim.player.credit!.score = 300;
    sim.advanceTo(statementAhead(sim) + 1000);
    expect(card(sim).apr).toBe(opened);
    expect(cardTerms(sim, card(sim), 300).apr).toBe(opened);
  });
});

describe('the US penalty rate', () => {
  /**
   * Until brief 21 (2026-10-22) it was noticed at the second due date missed in a row, about 30 days late; from then on
   * the 61st day after the due date of the minimum still short (Reg Z §1026.55(b)(4), comment 55(b)(4)-1: due March 15,
   * from May 15), and in force 45 days after the notice (§1026.9(g)).
   */
  it('comes 45 days after a minimum more than 60 days late, not at the second due date missed, and comes off after six on time in a row', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase' }, 'int-penalty');
    const c = card(sim);
    withCard(c.bankId!, { ...base, penaltyApr: 0.2999 });
    sim.player.credit!.autopay = 'minimum';
    const broke = () => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && (a.kind === 'checking' || a.kind === 'savings') && !a.closedAt && a.balance > 0) give(sim, a.id, -a.balance); };
    for (let i = 0; i < 2; i += 1) {
      let due = next(sim, DUE_KIND);
      while (due === undefined) { sim.advanceTo(statementAhead(sim) + 1000); due = next(sim, DUE_KIND); }
      broke();
      sim.advanceTo(due + 1000);
    }
    // Two due dates missed, about 30 days late: no notice yet.
    expect(sim.player.credit!.missed).toBe(2);
    expect(sim.player.credit!.penalty).toBeUndefined();
    const first = sim.player.credit!.pastDue![0]!.at;
    // The 60th day after it, still nothing; the 61st, at its first minute, the notice.
    broke();
    sim.advanceTo(first + 60 * MS_DAY);
    expect(sim.player.credit!.penalty).toBeUndefined();
    broke();
    sim.advanceTo(first + 61 * MS_DAY);
    const penalty = sim.player.credit!.penalty!;
    expect(penalty.noticeAt).toBe(startOfNextDay(first + 60 * MS_DAY, 'America/New_York'));
    expect(penalty.from - penalty.noticeAt).toBe(45 * MS_DAY);
    expect(sim.universe.notifications.some((n) => n.title === 'A Penalty Rate Is Coming')).toBe(true);
    expect(cardTerms(sim, c, 700).penaltyInForce).toBe(false);
    sim.advanceTo(penalty.from + 1000);
    expect(cardTerms(sim, c, 700).apr).toBe(0.2999);
    // Six on time in a row, spending a little each month so there's always a statement to pay: on at five, off at six.
    for (let i = 0; i < 5; i += 1) { give(sim, c.id, -200_00); throughDue(sim); }
    expect(sim.player.credit!.penalty).toBeDefined();
    give(sim, c.id, -200_00);
    throughDue(sim);
    expect(sim.player.credit!.penalty).toBeUndefined();
    expect(cardTerms(sim, c, 700).apr).toBe(c.apr);
    expect(sim.universe.notifications.some((n) => n.title === 'The Penalty Rate Is Off')).toBe(true);
  });
});

describe('Citi’s first late fee', () => {
  it('is $29, and $40 for another within six billing periods', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-citi' }, 'int-citi');
    const c = card(sim);
    expect(c.bankId).toBe('us-citi');
    sim.player.credit!.autopay = 'minimum';
    give(sim, c.id, -5_000_00);
    const broke = () => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && (a.kind === 'checking' || a.kind === 'savings') && !a.closedAt && a.balance > 0) give(sim, a.id, -a.balance); };
    const fees: number[] = [];
    for (let i = 0; i < 2; i += 1) {
      let due = next(sim, DUE_KIND);
      while (due === undefined) { sim.advanceTo(statementAhead(sim) + 1000); due = next(sim, DUE_KIND); }
      broke();
      sim.advanceTo(due + 1000);
      fees.push(-sim.universe.transactions.filter((t) => t.memo === 'Late fee').at(-1)!.postings.find((q) => q.accountId === c.id)!.amount);
    }
    expect(fees).toEqual([29_00, cardTerms(sim, c, 700).lateFee]);
    expect(fees[1]).toBeGreaterThan(fees[0]!);
  });
});

describe('Canada’s penalty rate', () => {
  it('rises at once after two missed minimums in twelve months, cash too at CIBC, and comes off after twelve on time', () => {
    const sim = lifeIn('ca-on-toronto', { bankId: 'ca-cibc' }, 'int-canada');
    const c = card(sim);
    expect(c.bankId).toBe('ca-cibc');
    sim.player.credit!.autopay = 'minimum';
    const broke = () => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && (a.kind === 'checking' || a.kind === 'savings') && !a.closedAt && a.balance > 0) give(sim, a.id, -a.balance); };
    give(sim, c.id, -500_00);
    let due = next(sim, DUE_KIND);
    while (due === undefined) { sim.advanceTo(statementAhead(sim) + 1000); due = next(sim, DUE_KIND); }
    broke();
    sim.advanceTo(due + 1000);
    expect(sim.player.credit!.penalty).toBeUndefined();
    due = next(sim, DUE_KIND);
    while (due === undefined) { sim.advanceTo(statementAhead(sim) + 1000); due = next(sim, DUE_KIND); }
    broke();
    sim.advanceTo(due + 1000);
    const penalty = sim.player.credit!.penalty!;
    expect(penalty.from).toBe(penalty.noticeAt);
    expect(cardTerms(sim, c, 700).apr).toBe(CANADA_PENALTY['ca-cibc']!.apr);
    expect(cardTerms(sim, c, 700).cashApr).toBe(CANADA_PENALTY['ca-cibc']!.cashApr);
    for (let i = 0; i < 11; i += 1) { give(sim, c.id, -200_00); throughDue(sim); }
    expect(sim.player.credit!.penalty).toBeDefined();
    give(sim, c.id, -200_00);
    throughDue(sim);
    expect(sim.player.credit!.penalty).toBeUndefined();
  }, 120_000);
});

describe('Britain’s default fees', () => {
  it('bear no interest for 28 days', () => {
    const sim = lifeIn('uk-eng-london', {}, 'int-uk');
    const c = card(sim);
    withCard(c.bankId!, { ...base, lateFee: 12_00 });
    give(sim, c.id, -c.balance);
    sim.player.credit!.carrying = true;
    sim.player.credit!.recentFees = [{ at: sim.now, amount: 1_000_00 }];
    give(sim, c.id, -1_000_00);
    const before = sim.player.credit!.accrued ?? 0;
    sim.advanceBy(3 * MS_DAY);
    // Only the fee is owed, and it's inside its 28 days: nothing built up.
    expect(sim.player.credit!.accrued ?? 0).toBe(before);
    sim.advanceBy(30 * MS_DAY);
    expect(sim.player.credit!.accrued ?? 0).toBeGreaterThan(before);
  });
});

describe('a credit balance', () => {
  it('is held when more is paid than owed, sent back on asking, and sent back after six months in the US', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase', wealth: 'comfortable' }, 'int-credit');
    const c = card(sim);
    give(sim, sim.player.primaryAccountId!, 10_000_00);
    expect(sim.execute({ kind: 'finance.pay_card', payload: { amount: -c.balance + 500_00 } }).ok).toBe(true);
    expect(c.balance).toBe(500_00);
    const current = sim.universe.accounts[sim.player.primaryAccountId!]!;
    const before = current.balance;
    expect(sim.execute({ kind: 'card.refund_credit', payload: {} }).ok).toBe(true);
    expect(current.balance - before).toBe(500_00);
    expect(sim.execute({ kind: 'card.refund_credit', payload: {} }).ok).toBe(false);
    // Left six months: sent back on its own.
    give(sim, c.id, 300_00);
    sim.advanceBy(200 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Credit refunded')).length).toBe(2);
  });
});

describe('the statement', () => {
  it('gives the average daily balance interest is worked on', () => {
    const sim = lifeIn('is-39-mosfellsbr', {}, 'int-adb');
    const c = card(sim);
    give(sim, sim.player.primaryAccountId!, 100_000_000_00);
    give(sim, c.id, -c.balance);
    sim.advanceTo(statementAhead(sim) + 1000);
    const period = periodsOf(sim, c)[0]!;
    // Owed nothing, then 30,000 halfway through the period's days so far.
    sim.advanceBy(10 * MS_DAY);
    give(sim, c.id, -30_000_00);
    const spentAt = sim.now;
    sim.advanceBy(10 * MS_DAY);
    const st = cardStatement(sim, c, period);
    // Nothing owed until the spending, 30,000 after it, weighted by time.
    expect(st.averageDaily).toBe(Math.round(30_000_00 * (sim.now - spentAt) / (sim.now - period.from)));
  });
});
