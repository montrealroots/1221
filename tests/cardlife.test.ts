/**
 * The card's life (`systems/cardlife.ts`, and the bank's side in
 * `systems/credit.ts`): module 4 of `docs/BANKING-FUNCTIONS.md`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, zonedParts } from '@/engine/core/time';
import { CARDS, type CardProduct } from '@/engine/content/cards';
import { cardOf, cardTerms, DUE_KIND, NO_CARD, reportWithoutCard, STATEMENT_KIND } from '@/engine/systems/credit';
import { canPay } from '@/engine/systems/household';

const cards = CARDS as Record<string, CardProduct | { none: true; source: string }>;
const kept = new Map<string, unknown>();
function withCard(bankId: string, product: CardProduct | { none: true; source: string }) { if (!kept.has(bankId)) kept.set(bankId, cards[bankId]); cards[bankId] = product; }
afterEach(() => { for (const [k, v] of kept) { if (v) cards[k] = v as CardProduct; else delete cards[k]; } kept.clear(); });

const lifeIn = (cityId: string, extra: Record<string, unknown> = {}, seed = 'cl') =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, ...extra }, seed);
const card = (sim: Simulation) => cardOf(sim, sim.player);
const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => {
  const answer = sim.execute({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer;
};
const give = (sim: Simulation, accountId: string, amount: number) => sim.post({ memo: 'test', category: 'test', postings: [{ accountId, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
/** Every account of theirs but the card emptied, so nothing can pay it. */
function broke(sim: Simulation): void {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal || a.closedAt || (a.kind !== 'checking' && a.kind !== 'savings')) continue;
    if (a.balance !== 0) give(sim, a.id, -a.balance);
  }
}
const nextDue = (sim: Simulation) => sim.timeline.pending().find((i) => i.kind === DUE_KIND && i.payload.personId === sim.player.id)?.at;
const nextStatement = (sim: Simulation) => sim.timeline.pending().find((i) => i.kind === STATEMENT_KIND && i.payload.personId === sim.player.id)!.at;
/** Through the next due date, with nothing in the bank to pay it. */
function missOne(sim: Simulation): void {
  let due = nextDue(sim);
  while (due === undefined) { sim.advanceTo(nextStatement(sim) + 1000); due = nextDue(sim); }
  broke(sim);
  sim.advanceTo(due + 1000);
}

describe('a record with no card open', () => {
  it('ages back a little each month while nothing is in collections, stops at a thin file’s ceiling, and holds while anything is', () => {
    const sim = lifeIn('us-ny-newyork', { wealth: 'comfortable' }, 'cl-nocard');
    const old = card(sim)!;
    give(sim, old.id, -old.balance);
    run(sim, 'card.close');
    const credit = sim.player.credit!;
    credit.score = 560;
    credit.late = [];
    // Three 1sts on the clock, two points each.
    const firsts = () => { const p = zonedParts(sim.now, sim.homeZone); return p.day; };
    let turned = 0;
    let last = firsts();
    while (turned < 3) { sim.advanceBy(MS_DAY); const d = firsts(); if (d === 1 && last !== 1) turned += 1; last = d; }
    expect(credit.score).toBe(560 + 3 * NO_CARD.aging);
    // A late payment in the last year holds it, and so does a debt in collections.
    credit.late = [sim.now - 30 * MS_DAY];
    reportWithoutCard(sim, sim.player);
    expect(credit.score).toBe(566);
    credit.late = [sim.now - 400 * MS_DAY];
    reportWithoutCard(sim, sim.player);
    expect(credit.score).toBe(568);
    const debt = sim.openAccount({ id: sim.nextId('account'), kind: 'loan', category: 'collections', name: 'Owed', ownerId: sim.player.id, institution: 'Chase', openedAt: sim.now });
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: debt.id, amount: -100_00 }, { accountId: sim.nominalAccount('income', 'Test').id, amount: 100_00 }] });
    reportWithoutCard(sim, sim.player);
    expect(credit.score).toBe(568);
    // Paid off, it ages again, up to the ceiling and no further.
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: debt.id, amount: 100_00 }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -100_00 }] });
    credit.score = NO_CARD.ceiling - 1;
    reportWithoutCard(sim, sim.player);
    expect(credit.score).toBe(NO_CARD.ceiling);
    reportWithoutCard(sim, sim.player);
    expect(credit.score).toBe(NO_CARD.ceiling);
    // A score above it isn't pulled down.
    credit.score = 760;
    reportWithoutCard(sim, sim.player);
    expect(credit.score).toBe(760);
    // Rent owed to a landlord isn't reported: it ages as before.
    const owed = sim.openAccount({ id: sim.nextId('account'), kind: 'loan', category: 'arrears', name: 'Rent And Bills Owed', ownerId: sim.player.id, institution: 'Your Landlord', openedAt: sim.now });
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: owed.id, amount: -100_00 }, { accountId: sim.nominalAccount('income', 'Test').id, amount: 100_00 }] });
    credit.score = 600;
    reportWithoutCard(sim, sim.player);
    expect(credit.score).toBe(600 + NO_CARD.aging);
    // With a card open, the card's statement reports the month, not this.
    const other = lifeIn('us-ny-newyork', { wealth: 'comfortable' }, 'cl-nocard-has');
    other.player.credit!.score = 560;
    other.player.credit!.late = [];
    reportWithoutCard(other, other.player);
    expect(other.player.credit!.score).toBe(560);
  });
});

describe('applying for a card', () => {
  it('is approved for a record that earns it, costs the record a few points, and the bank’s card arrives in a week', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'cl-apply');
    const old = card(sim)!;
    give(sim, old.id, -old.balance);
    run(sim, 'card.close');
    expect(card(sim)).toBeUndefined();
    sim.player.credit!.score = 760;
    const answer = run(sim, 'card.apply').value as { approved: boolean; limit: number };
    expect(answer.approved).toBe(true);
    expect(sim.player.credit!.score).toBe(755);
    expect(sim.execute({ kind: 'card.apply', payload: {} }).ok).toBe(false);
    sim.advanceBy(8 * MS_DAY);
    const fresh = card(sim)!;
    expect(fresh.bankId).toBe(old.bankId);
    expect(fresh.creditLimit).toBe(answer.limit);
    expect(fresh.name).not.toMatch(/Credit Card$/);
  });

  it('is declined for a poor record, and refused where the bank issues no card or one is held', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'cl-declined');
    expect(sim.execute({ kind: 'card.apply', payload: {} }).ok).toBe(false);
    const old = card(sim)!;
    give(sim, old.id, -old.balance);
    run(sim, 'card.close');
    sim.player.credit!.score = 560;
    expect((run(sim, 'card.apply').value as { approved: boolean }).approved).toBe(false);
    expect(sim.universe.notifications.some((n) => n.title === 'Card Application Declined')).toBe(true);
    withCard(old.bankId!, { none: true, source: 'test' });
    expect(sim.execute({ kind: 'card.apply', payload: {} }).ok).toBe(false);
  });
});

describe('closing the card', () => {
  it('takes nothing new, and closes once it owes nothing', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'cl-close');
    const c = card(sim)!;
    // Something owed on it, so it stays open to be paid down.
    give(sim, c.id, -50_000_00);
    const owedBefore = -c.balance;
    run(sim, 'card.close');
    expect(canPay(sim, sim.player)).toBeLessThan(canPay(sim, sim.player) + 1);
    expect(sim.player.credit!.closing).not.toBeUndefined();
    expect(c.closedAt).toBeUndefined();
    const room = canPay(sim, sim.player, false);
    // The card's room is gone from what can pay.
    const bank = Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && (a.kind === 'checking' || a.kind === 'savings') && !a.closedAt && a.category !== 'term' && (a.kind === 'checking' || sim.player.payments?.linkSavings)).reduce((s, a) => s + Math.max(0, a.balance), 0);
    expect(room).toBe(bank);
    if (owedBefore > 0) give(sim, c.id, owedBefore);
    sim.advanceTo(nextStatement(sim) + 1000);
    expect(c.closedAt).not.toBeUndefined();
  });
});

describe('the statement day', () => {
  it('moves, and the statement and its due date come with it', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'cl-day');
    run(sim, 'card.set_statement_day', { day: 5 });
    expect(zonedParts(nextStatement(sim), sim.zone).day).toBe(5);
    expect(sim.execute({ kind: 'card.set_statement_day', payload: { day: 30 } }).ok).toBe(false);
  });
});

describe('the limit', () => {
  it('lowers on asking, never under what’s owed, and rises only for a record that earns it, by a fifth at most', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'cl-limit');
    const c = card(sim)!;
    give(sim, c.id, -30_000_00);
    const owed = -c.balance;
    expect(owed).toBeGreaterThan(1_00);
    run(sim, 'card.request_limit', { limit: 1_00 });
    expect(c.creditLimit).toBe(owed);
    const now = c.creditLimit!;
    sim.player.credit!.score = 650;
    expect((run(sim, 'card.request_limit', { limit: now * 10 }).value as { granted: boolean }).granted).toBe(false);
    sim.player.credit!.score = 760;
    const up = run(sim, 'card.request_limit', { limit: now * 10 }).value as { granted: boolean; limit: number };
    expect(up.granted).toBe(true);
    expect(up.limit).toBe(Math.round(now * 1.2 / 100) * 100);
  });

  it('isn’t raised unasked once the holder says never', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'inherited' }, 'cl-noraise');
    sim.player.credit!.score = 800;
    sim.player.credit!.reviewedAt = sim.now - 400 * MS_DAY;
    run(sim, 'card.set_auto_raise', { on: false });
    const before = card(sim)!.creditLimit;
    sim.advanceTo(nextStatement(sim) + 1000);
    expect(card(sim)!.creditLimit).toBe(before);
  });
});

describe('going over the limit', () => {
  it('is a US card’s choice, lets a tenth over for someone who opted in, and charges the card’s fee three cycles at most', () => {
    const is = lifeIn('is-39-mosfellsbr', {}, 'cl-over-is');
    expect(is.execute({ kind: 'card.set_over_limit', payload: { on: true } }).ok).toBe(false);
    const sim = lifeIn('us-ny-newyork', { wealth: 'inherited', bankId: 'us-chase' }, 'cl-over');
    const c = card(sim)!;
    withCard(c.bankId!, { name: 'Test', kind: 'revolving', apr: 0.2, overLimitFee: 25_00, source: 'test', asOf: '2026-09-26' });
    broke(sim);
    const before = canPay(sim, sim.player, false);
    run(sim, 'card.set_over_limit', { on: true });
    expect(canPay(sim, sim.player, false) - before).toBe(Math.round((c.creditLimit ?? 0) * 0.1));
    // Taken over its limit, and left there for four statements.
    give(sim, c.id, -((c.creditLimit ?? 0) + c.balance) - 10_00);
    sim.player.credit!.autopay = 'minimum';
    const fees = () => sim.universe.transactions.filter((t) => t.memo === 'Over-limit fee').length;
    for (let i = 0; i < 4; i += 1) { sim.advanceTo(nextStatement(sim) + 1000); give(sim, c.id, -10_00); }
    expect(fees()).toBe(3);
  });
});

describe('help with payments', () => {
  it('freezes the interest, sets a payment that clears it in four years, and stops the card', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'comfortable' }, 'cl-hardship');
    const c = card(sim)!;
    give(sim, c.id, -80_000_00);
    const owed = -c.balance;
    const plan = run(sim, 'card.request_hardship').value as { payment: number };
    expect(plan.payment).toBe(Math.ceil(owed / 48 / 100) * 100);
    expect(sim.player.credit!.suspended).toBe('hardship');
    sim.player.credit!.carrying = true;
    sim.advanceTo(nextStatement(sim) + 1000);
    expect(sim.universe.transactions.some((t) => t.memo === 'Interest' && t.postings.some((p) => p.accountId === c.id))).toBe(false);
  });
});

describe('a late payment on the record', () => {
  it('is reported by a US lender at thirty days past due, the next due date still short, and at once elsewhere', () => {
    const us = lifeIn('us-ny-newyork', { wealth: 'comfortable', bankId: 'us-chase' }, 'cl-thirty');
    const c = card(us)!;
    give(us, c.id, -500_00);
    const limit = c.creditLimit;
    const score = us.player.credit!.score;
    missOne(us);
    // A fee, and nothing on the record yet: the line stands.
    expect(us.universe.transactions.some((t) => t.memo === 'Late fee')).toBe(true);
    expect(us.player.credit!.late).toHaveLength(0);
    expect(us.player.credit!.score).toBeGreaterThan(score - 50);
    expect(c.creditLimit).toBe(limit);
    // Still short a month on: thirty days past due, on the record, and the line cut.
    const before = us.player.credit!.score;
    missOne(us);
    expect(us.player.credit!.late).toHaveLength(1);
    expect(us.player.credit!.score).toBeLessThanOrEqual(before - 50);
    expect(c.creditLimit).toBeLessThan(limit!);
    // Iceland's card is on the month's report at once.
    const is = lifeIn('is-39-mosfellsbr', { wealth: 'scraping' }, 'cl-thirty-is');
    missOne(is);
    expect(is.player.credit!.late).toHaveLength(1);
  });
});

describe('missed payments', () => {
  it('suspend the card after two, lift it after one on time, and six charge it off to collections', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'scraping' }, 'cl-missed');
    const c = card(sim)!;
    missOne(sim);
    expect(sim.player.credit!.missed).toBe(1);
    expect(sim.player.credit!.suspended).toBeUndefined();
    missOne(sim);
    expect(sim.player.credit!.suspended).toBe('late');
    // One on time.
    let due = nextDue(sim);
    while (due === undefined) { sim.advanceTo(nextStatement(sim) + 1000); due = nextDue(sim); }
    give(sim, sim.player.primaryAccountId!, 100_000_000_00);
    sim.advanceTo(due + 1000);
    expect(sim.player.credit!.suspended).toBeUndefined();
    expect(sim.player.credit!.missed).toBe(0);
    // Then six in a row.
    const score = () => sim.player.credit!.score;
    for (let i = 0; i < 5; i += 1) missOne(sim);
    expect(sim.universe.notifications.some((n) => n.title === 'A Default Notice')).toBe(true);
    // A record with room to fall, so the charge-off's cost shows.
    sim.player.credit!.score = 700;
    const before = score();
    const owed = -c.balance;
    missOne(sim);
    expect(c.closedAt).not.toBeUndefined();
    const debt = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.category === 'collections' && !a.closedAt)!;
    expect(-debt.balance).toBeGreaterThanOrEqual(owed);
    expect(score()).toBeLessThanOrEqual(before - 100);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('bounce autopay with the card’s returned payment fee where the account can’t cover it', () => {
    const sim = lifeIn('is-39-mosfellsbr', { wealth: 'scraping' }, 'cl-bounce');
    missOne(sim);
    expect(sim.universe.transactions.some((t) => t.memo === 'Returned payment fee')).toBe(true);
    expect(sim.universe.notifications.some((n) => n.title === 'A Card Payment Bounced')).toBe(true);
  });

  it('cost a US holder a late fee no more than the minimum it was late on', () => {
    const sim = lifeIn('us-ny-newyork', { wealth: 'scraping', bankId: 'us-chase' }, 'cl-us-late');
    const c = card(sim)!;
    withCard(c.bankId!, { name: 'Test', kind: 'revolving', apr: 0.2, lateFee: 400_00, minimumShare: 0.01, minimumFloor: 5_00, source: 'test', asOf: '2026-09-26' });
    // A small balance, so the minimum is small.
    give(sim, c.id, -c.balance - 100_00);
    missOne(sim);
    const late = sim.universe.transactions.filter((t) => t.memo === 'Late fee').at(-1)!;
    expect(late.postings.find((p) => p.accountId === c.id)!.amount).toBeGreaterThanOrEqual(-5_00);
  });

  it('are taken from the holder’s other accounts at the same bank in Britain', () => {
    const sim = lifeIn('uk-eng-london', { wealth: 'scraping' }, 'cl-setoff');
    const c = card(sim)!;
    let due = nextDue(sim);
    while (due === undefined) { sim.advanceTo(nextStatement(sim) + 1000); due = nextDue(sim); }
    broke(sim);
    sim.player.credit!.autopay = 'minimum';
    // Savings at the same bank, unlinked, and the current account empty.
    const savings = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'savings' && !a.closedAt);
    expect(savings).toBeDefined();
    expect(savings!.bankId).toBe(c.bankId);
    give(sim, savings!.id, 100_000_00);
    sim.advanceTo(due + 1000);
    expect(sim.universe.transactions.some((t) => t.memo.startsWith('Set off against'))).toBe(true);
  });
});

describe('persistent debt in Britain', () => {
  it('writes at eighteen months of paying more in interest and fees than off the card, and at thirty-six sets a plan and stops it', () => {
    const sim = lifeIn('uk-eng-london', { wealth: 'inherited' }, 'cl-persistent');
    const c = card(sim)!;
    // A dear card paid at Britain's floor, a hundredth plus the interest: most of each payment is interest.
    withCard(c.bankId!, { name: 'Test', kind: 'revolving', apr: 0.4, minimumShare: 0.01, minimumPlusInterest: true, minimumFloor: 5_00, source: 'test', asOf: '2026-09-26' });
    run(sim, 'card.set_auto_raise', { on: false });
    // A card near its limit, carried on the minimum for three years, with money in the bank to pay the minimum.
    give(sim, c.id, -((c.creditLimit ?? 0) + c.balance) + 10_00);
    sim.player.credit!.autopay = 'minimum';
    sim.player.credit!.carrying = true;
    run(sim, 'bank.set_payments', { everyday: 'debit', bills: 'auto' });
    // Nothing comes in, so three years of rent and minimums are put in the bank first.
    give(sim, sim.player.primaryAccountId!, 100_000_000_00);
    const notice = () => sim.universe.notifications.some((n) => n.title === 'Persistent Debt');
    sim.advanceBy(19 * 30 * MS_DAY);
    expect(notice()).toBe(true);
    expect(sim.player.credit!.hardship).toBeUndefined();
    sim.advanceBy(18 * 30 * MS_DAY);
    expect(sim.player.credit!.suspended).toBe('persistent');
    expect(sim.player.credit!.hardship!.payment).toBeGreaterThan(0);
  });
});

describe('the fee caps', () => {
  it('hold a US card’s first-year yearly fee to a quarter of its limit', () => {
    const sim = lifeIn('us-ny-newyork', { wealth: 'inherited', bankId: 'us-chase' }, 'cl-cap');
    const c = card(sim)!;
    // Opened days before the next statement, in its month: the yearly fee falls on it, in the first year.
    const statement = nextStatement(sim);
    c.openedAt = statement - 5 * MS_DAY;
    expect(zonedParts(c.openedAt, sim.zone).month).toBe(zonedParts(statement, sim.zone).month);
    withCard(c.bankId!, { name: 'Test', kind: 'revolving', apr: 0.2, annualFee: 1_000_000_00, source: 'test', asOf: '2026-09-26' });
    sim.advanceTo(statement + 1000);
    const fee = sim.universe.transactions.find((t) => t.memo.startsWith('Yearly fee'))!;
    expect(-fee.postings.find((p) => p.accountId === c.id)!.amount).toBe(Math.round((c.creditLimit ?? 0) * 0.25));
    expect(cardTerms(sim, c, 700).annualFee).toBe(1_000_000_00);
  });
});
