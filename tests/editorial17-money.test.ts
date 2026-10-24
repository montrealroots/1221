/**
 * Brief 17, the money area (`docs/text/surfaces/money.json`): what banking says first, and what it says before a
 * deadline, a fee or an irreversible outcome rather than after it. Each case holds a claim a player relies on, and each
 * was run with the claim taken out and failed (the brief's check). A New York student at Yale banking with Chase unless a
 * case says otherwise; TEST SETUP lines set a balance where the case needs one the play doesn't give.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig, newLifeFrom, type NewSaveConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { MS_DAY, formatDate, instantFromZoned } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import { cardsOf, stateOf } from '@/engine/systems/credit';
import { LOAN_DUE_KIND } from '@/engine/systems/lending';
import { roundUpChoiceRefusal } from '@/engine/systems/roundups';
import { ROUND_UPS } from '@/engine/content/roundups';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** FIXTURE: what a screen's first useStates start at, in place of their own initial values (a chosen bank, From, To). */
  states: [] as unknown[],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    return h.states.length ? [h.states.shift(), set] : [value, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { BankCard } = await import('@/ui/bank/BankCard');
const { BankCardOffers } = await import('@/ui/bank/BankCardOffers');
const { BankLending } = await import('@/ui/bank/BankLending');
const { BankMoves } = await import('@/ui/bank/BankMoves');
const { BankAccountLife } = await import('@/ui/bank/BankAccountLife');
const { BankStatements } = await import('@/ui/bank/BankStatements');
const { BankWorkspace } = await import('@/ui/workspaces/BankWorkspace');
const { bankById } = await import('@/engine/content/banks');

const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1');
function drawn(sim: Simulation, component: FunctionComponent<Record<string, unknown>>, props: Record<string, unknown> = {}, states: unknown[] = []): { html: string; text: string } {
  h.sim = sim;
  h.states = [...states];
  const html = renderToStaticMarkup(createElement(component, props));
  h.states = [];
  return { html, text: onScreen(html) };
}
const setTo = (sim: Simulation, account: Account, to: number) => {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
};
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title).map((n) => n.body);
const ada = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' } as NewSaveConfig);
const nextDue = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === 'card.due').sort((a, b) => a.at - b.at)[0];

/**
 * The day's spending on the card, and the checking account emptied into savings four days before each due date, for as
 * many due dates as asked: autopay bounces and the minimum goes unpaid each time, as a player who empties the account
 * meets it. Nothing is marked read, so a notice said word for word again would be brought up to its day, not added.
 */
function missEach(sim: Simulation, times: number): void {
  sim.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
  const checking = sim.universe.accounts[sim.player.primaryAccountId!]!;
  const savings = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'savings')!;
  for (let i = 0; i < times; i += 1) {
    for (let d = 0; d < 40 && !nextDue(sim); d += 1) sim.advanceTo(sim.now + MS_DAY);
    const due = nextDue(sim)!;
    sim.advanceTo(due.at - 4 * MS_DAY);
    if (checking.balance > 0) sim.must({ kind: 'bank.transfer', payload: { fromId: checking.id, toId: savings.id, amount: checking.balance } });
    sim.advanceTo(due.at + 60_000);
    sim.advanceTo(sim.now + 2 * MS_DAY);
  }
}

describe('a card’s missed payments, read in the order they come', () => {
  /**
   * Until brief 21 (2026-10-22) Chase's due date was the statement's plus 21 days, the 11th, the 10th or the 11th by the
   * month, and the sixth due date missed charged the card off, about 150 days on; the penalty notice came at the second.
   * From then it's due on the 13th every month (Reg Z §1026.7(b)(11)), the notice on the 61st day after the first missed
   * (13 December), the penalty rate 45 days after it (27 January), the last notice on the 150th (12 March) and the
   * charge-off on the 180th (11 April), each worked here from the first due date, 13 October 2026.
   */
  it('PLAYER JOURNEY: six due dates missed at Chase: each late notice names its own date and what the next miss brings, the statements between say what the due date decides, the counts are payments missed, and the day that charges the card off, 180 days after the first, sends nobody to the card', () => {
    const sim = ada('b17-money-late');
    missEach(sim, 6);
    const late = titled(sim, 'A Late Card Payment');
    // Six, each its own: until 2026-10-20 the third to the sixth said the second's words, and each unread one was brought
    // up to the day in its place, one notice for four late fees.
    expect(late).toHaveLength(6);
    expect(new Set(late).size).toBe(6);
    expect(late[0]).toBe('The minimum payment on the Chase Freedom Unlimited, $40.00, was due October 13, 2026, and nothing was paid. That costs a $30.00 late fee. If the payment is still short at the next due date, thirty days late, it goes on your credit record and Chase suspends the card. Pay the card on Money, under Cards.');
    // The minimum payment due takes in each minimum past due, a payment going to the oldest first (from 2026-10-22,
    // brief 21: until then each said the month's own $40, and $40 paid then made the card current again).
    expect(late[1]).toBe('The minimum payment on the Chase Freedom Unlimited, $80.00, $40.00 of it past due, was due November 13, 2026, and nothing was paid. That costs a $40.00 late fee, and it’s on your credit record now. Pay the card on Money, under Cards.');
    // The sixth no longer charges it off, so it sends the player to the card, as its bounce does.
    expect(late[5]).toBe('The minimum payment on the Chase Freedom Unlimited, $240.00, $200.00 of it past due, was due March 13, 2027, and nothing was paid. That costs a $40.00 late fee, and it’s on your credit record now. Pay the card on Money, under Cards.');
    const bounced = titled(sim, 'A Card Payment Bounced');
    expect(bounced).toHaveLength(6);
    expect(bounced.every((b) => b.endsWith('then pay the card on Money, under Cards.'))).toBe(true);
    expect(titled(sim, 'Your Card Was Charged Off')).toHaveLength(0);

    const statements = titled(sim, 'Statement Ready: Chase Freedom Unlimited');
    expect(statements[0]).toBe('The statement comes to $270.00, due October 13, 2026. The minimum payment is $40.00. Autopay pays the whole $270.00 from Chase Total Checking that day, if there’s enough in it.');
    expect(statements[1]).toBe('The statement comes to $600.00, due November 13, 2026. The minimum payment is $80.00, $40.00 of it past due. Autopay pays the whole $600.00 from Chase Total Checking that day, if there’s enough in it. The last payment was missed. If this one is short too, Chase suspends the card, and it goes on your credit record.');
    expect(statements[2]).toMatch(/^The statement comes to \$[\d,]+\.\d\d, due December 13, 2026\. The minimum payment is \$120\.00, \$80\.00 of it past due\. Autopay pays the whole \$[\d,]+\.\d\d from Chase Total Checking that day, if there’s enough in it\. The card works again if at least \$120\.00 is paid by then\.$/);

    expect(titled(sim, 'Your Card Is Suspended')).toEqual(['You’ve missed two payments in a row, so Chase has suspended the Chase Freedom Unlimited. It works again once you pay at least the minimum by a due date, or pay the card off.']);
    // By days from the first missed due date, 13 October 2026: 61 is 13 December, and 45 more 27 January.
    expect(titled(sim, 'A Penalty Rate Is Coming')).toEqual(['The Chase Freedom Unlimited’s minimum payment, due October 13, 2026, is more than 60 days late. From January 27, 2027, the card charges 29.99% on what’s owed. Six minimum payments on time in a row take the penalty rate off.']);
    // 150 days is 12 March, and 180 the day it's charged off, 11 April.
    expect(titled(sim, 'A Default Notice')).toEqual(['The Chase Freedom Unlimited’s minimum payment, due October 13, 2026, is 150 days late. Pay at least the $40.00 of it still unpaid before April 11, 2027, or the card is closed and what’s owed goes to collections.']);
    sim.advanceTo(instantFromZoned({ year: 2027, month: 4, day: 10, hour: 23 }, 'America/New_York'));
    expect(titled(sim, 'Your Card Was Charged Off')).toHaveLength(0);
    sim.advanceTo(instantFromZoned({ year: 2027, month: 4, day: 11, hour: 1 }, 'America/New_York'));
    expect(titled(sim, 'Your Card Was Charged Off')).toHaveLength(1);

    // Short For A Payment at nothing and below: until 2026-10-20 “it has $0.00 available” and “it has -$12.00 available”.
    const short = titled(sim, 'Short For A Payment: Chase Total Checking');
    expect(short).toContain('The Chase Freedom Unlimited’s autopay, $600.00, comes from Chase Total Checking at Chase on November 13, 2026, and it has nothing available. Move money into it, pay the card by hand, or have autopay pay from another account.');
    expect(short.some((x) => /comes from Chase Total Checking at Chase on January 13, 2027, and it’s overdrawn by \$12\.00\./.test(x))).toBe(true);
    expect(short.join(' ')).not.toMatch(/\$0\.00 available|-\$/);
  }, 600_000);

  it('Britain: Barclays puts the first miss on the record, so its late notice and the statement after say what the second brings', () => {
    const sim = quickSave({ homeRegionId: 'uk-eng-london', startLocationId: 'uk-eng-london', wealth: 'comfortable', bankId: 'gb-barclays' }, 'b17-gb');
    expect(cardsOf(sim, sim.player)[0]!.name).toBe('Barclaycard Forward');
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
    const mine = () => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && (a.kind === 'checking' || a.kind === 'savings') && !a.closedAt);
    // TEST SETUP: every account kept at nothing, each day, so each autopay and minimum goes unpaid.
    for (let d = 0; d < 60; d += 1) { for (const a of mine()) if (a.balance > 0) setTo(sim, a, 0); sim.advanceTo(sim.now + MS_DAY); }
    const late = titled(sim, 'A Late Card Payment');
    expect(late[0]).toBe('The minimum payment on the Barclaycard Forward, £5.00, was due February 15, 2026, and nothing was paid. That costs a £12.00 late fee, and it’s on your credit record now. If the next payment is short too, Barclays suspends the card. Pay the card on Money, under Cards.');
    expect(titled(sim, 'Statement Ready: Barclaycard Forward')[1]).toMatch(/ The last payment was missed\. If this one is short too, Barclays suspends the card, and it goes on your credit record again\.$/);
  }, 300_000);
});

describe('Low Balance, with the account overdrawn', () => {
  it('says how far below zero it is, not a balance with a hyphen for its sign', () => {
    const sim = quickSave({ homeRegionId: 'us-ny-newyork', startLocationId: 'us-ny-newyork', wealth: 'comfortable', bankId: 'us-chase' }, 'b17-low');
    sim.must({ kind: 'bank.set_alerts', payload: { lowBalance: 100_00 } });
    const checking = sim.universe.accounts[sim.player.primaryAccountId!]!;
    setTo(sim, checking, -12_00);
    sim.advanceTo(sim.now + MS_DAY);
    const said = titled(sim, 'Low Balance: Chase Total Checking');
    expect(said).toHaveLength(1);
    expect(said[0]).toMatch(/^Chase Total Checking at Chase is overdrawn by \$\d+\.\d\d, under the \$100\.00 you set\.$/);
  });
});

describe('the card’s panel says the next payment and what it costs first, and folds its standing terms', () => {
  it('a statement owed: the due date, the statement and its minimum first, the late fee and the penalty rule next, then The Card’s Terms', () => {
    const sim = ada('b17-card-panel');
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
    for (let d = 0; d < 40 && !nextDue(sim); d += 1) sim.advanceTo(sim.now + MS_DAY);
    const card = cardsOf(sim, sim.player)[0]!;
    const due = nextDue(sim)!;
    const { html, text } = drawn(sim, BankCard as FunctionComponent<Record<string, unknown>>, { bankId: 'us-chase' });
    const first = `The next payment is due ${formatDate(due.at, sim.zone)}. The statement is ${formatMoney(stateOf(sim.player, card).statementBalance, 'USD', { cents: false })}, and the minimum payment is $40.`;
    expect(text).toContain(first);
    const at = (s: string) => { const i = text.indexOf(s); expect(i, s).toBeGreaterThanOrEqual(0); return i; };
    expect(at(first)).toBeLessThan(at('Paying less than the minimum by the due date costs $30 the first time'));
    // The penalty rule by days from the due date (from 2026-10-22, brief 21: until then "Miss two payments in a row, and the
    // rate goes up to 29.99% after 45 days’ notice.").
    expect(at('Paying less than the minimum by the due date costs $30 the first time')).toBeLessThan(at('A minimum payment more than 60 days late raises the rate to 29.99%, 45 days after the bank’s notice, until six minimum payments in a row are on time.'));
    expect(at('A minimum payment more than 60 days late raises the rate to 29.99%, 45 days after the bank’s notice, until six minimum payments in a row are on time.')).toBeLessThan(at('The Card’s Terms'));
    // A US card's due day each month (from 2026-10-22, brief 21: until then "payment is due 21 days after each one").
    expect(at('The Card’s Terms')).toBeLessThan(at('Statements come on the 20th, and payment is due on the 13th of the next month, at least 21 days after each one.'));
    // The terms are a native disclosure, shut until opened, with the minimum's rule and the rate inside it.
    expect(html).toMatch(/<details[^>]*data-card-terms=""[^>]*><summary>The Card’s Terms<\/summary>.*Statements come on the 20th.*The minimum payment is 1% of the statement plus the month’s interest, or \$40 if that’s more\..*<\/details>/s);
    expect(text).not.toContain('sixty days late');
    expect(text).not.toContain('On this statement it’s');
  });

  it('suspended: what lifts it, as the due date and the statement lift it', () => {
    const sim = ada('b17-card-suspended');
    missEach(sim, 2);
    const card = cardsOf(sim, sim.player)[0]!;
    expect(stateOf(sim.player, card).suspended).toBe('late');
    // The charge-off by days from the oldest minimum short, its day named (from 2026-10-22, brief 21: until then "Miss six
    // in a row, and what’s owed is charged off to collections.").
    expect(drawn(sim, BankCard as FunctionComponent<Record<string, unknown>>, { bankId: 'us-chase' }).text).toContain('Suspended: you’ve missed two payments in a row. It works again once you pay at least the minimum by a due date, or pay the card off. The oldest minimum still short was due October 13, 2026. Pay it before April 11, 2027, 180 days after it was due, or what’s owed is charged off to collections.');
  }, 300_000);
});

describe('applying for a card says what it would come with, before Apply For This Card', () => {
  it('at Bank of America, from Chase: its rate for your record, its introductory rate, no yearly fee, the limit, and who the bank approves', () => {
    const sim = ada('b17-apply-us');
    // FIXTURE: the Chase card's own panel's two states, then Bank of America chosen and no balance moved.
    const { html, text } = drawn(sim, BankCard as FunctionComponent<Record<string, unknown>>, { bankId: 'us-chase' }, ['', 0, 'us-bank-of-america', '']);
    expect(text).toContain('In the game a bank approves a credit score of 620 or more, counted after the few points applying takes off it, with money in the bank to repay from and no debt in collections.');
    expect(text).toMatch(/Bank of America Customized Cash Rewards credit card: Bank of America sets its rate between 17\.49% and 27\.49% from your credit record when the card opens, about \d+\.\d+% with your record today\. It charges 0% on purchases for its first 15 months\./);
    expect(text).toMatch(/It has no yearly fee\. If Bank of America approves you, the card’s limit is \$[\d,]+, set by your credit score\./);
    // All of it before the button.
    expect(html.indexOf('data-card-offer')).toBeGreaterThan(0);
    expect(html.indexOf('data-card-offer')).toBeLessThan(html.indexOf('Apply For This Card'));
  });

  it('in Dublin, from AIB: Bank of Ireland’s €30 yearly fee, said before the button', () => {
    const sim = quickSave({ homeRegionId: 'ie-lei-dublin', startLocationId: 'ie-lei-dublin', wealth: 'comfortable', bankId: 'ie-aib' }, 'b17-apply-ie');
    const held = cardsOf(sim, sim.player).length;
    const { html, text } = drawn(sim, BankCard as FunctionComponent<Record<string, unknown>>, { bankId: 'ie-aib' }, [...Array.from({ length: held }, () => ['', 0]).flat(), 'ie-bank-of-ireland', '']);
    expect(text).toMatch(/Bank of Ireland Classic Credit Card: 16\.12% a year on any balance you carry\./);
    expect(text).toMatch(/Its yearly fee is €30\. If Bank of Ireland approves you, the card’s limit is €[\d,]+, set by your credit score\./);
    expect(html.indexOf('Its yearly fee is €30')).toBeLessThan(html.indexOf('Apply For This Card'));
  });
});

describe('an introductory rate says what ends it early, by the game’s own count', () => {
  /** Until brief 21 (2026-10-22) "Missing two payments in a row ends it early.", the second due date missed. */
  it('Chase: a minimum more than 60 days late, 45 days after the notice', () => {
    const sim = ada('b17-intro-us');
    const card = cardsOf(sim, sim.player)[0]!;
    // TEST SETUP: a new card, its fifteen months ahead of it.
    card.openedAt = sim.now;
    expect(drawn(sim, BankCardOffers as FunctionComponent<Record<string, unknown>>, { bankId: 'us-chase' }).text).toMatch(/0% on purchases until [A-Z][a-z]+ \d+, \d{4}, then \d+\.\d+%\. A minimum payment more than 60 days late ends it early, 45 days after the bank’s notice\./);
  });

  it('Barclaycard: one minimum payment missed, as its terms end it, where until 2026-10-20 the panel said nothing of it, and “sixty days late” once it had', () => {
    const sim = quickSave({ homeRegionId: 'uk-eng-london', startLocationId: 'uk-eng-london', wealth: 'comfortable', bankId: 'gb-barclays' }, 'b17-intro-gb');
    const card = cardsOf(sim, sim.player)[0]!;
    // TEST SETUP: a new card, its six months ahead of it.
    card.openedAt = sim.now;
    const offers = () => drawn(sim, BankCardOffers as FunctionComponent<Record<string, unknown>>, { bankId: 'gb-barclays' }).text;
    expect(offers()).toMatch(/ on purchases until [A-Z][a-z]+ \d+, \d{4}, then \d+\.\d+%\. Missing a minimum payment ends it early\./);
    // TEST SETUP: the introduction ended as a missed minimum ends it (`INTRO_ENDS_ON_MISS`).
    stateOf(sim.player, card).introLost = true;
    expect(offers()).toContain('Its introductory rate ended because a minimum payment was missed.');
  });
});

describe('the overdraft: what it charges and when it charges nothing, then the day the bank acts', () => {
  it('Chase: the fee and its cap in one sentence, when it charges nothing in the next, and the next business day’s wait in a third', () => {
    const sim = quickSave({ homeRegionId: 'us-ny-newyork', startLocationId: 'us-ny-newyork', wealth: 'comfortable', bankId: 'us-chase' }, 'b17-od-words');
    const text = drawn(sim, BankLending as FunctionComponent<Record<string, unknown>>, { bank: bankById('us-chase')!, show: ['borrowing'] }).text;
    expect(text).toContain('Chase pays what the account can’t cover without an arrangement, and charges $34.00 for each item that overdraws it, at most 3 a day. There’s no fee on an item of $5.00 or less, or while the account is overdrawn by $50 or less. A fee waits until the end of the next business day, and if the account is back to −$50.00 or better by then, there’s none. Payments at the same moment post largest first. It covers up to about $500.');
  });

  it('PLAYER JOURNEY: an account left overdrawn names the day before the bank closes it, and the bank closes it the midnight after', () => {
    const sim = quickSave({ homeRegionId: 'us-ny-newyork', startLocationId: 'us-ny-newyork', wealth: 'comfortable', bankId: 'us-chase' }, 'b17-od-day');
    const checking = sim.universe.accounts[sim.player.primaryAccountId!]!;
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'savings') setTo(sim, a, 0);
    // TEST SETUP: the account taken $600 below zero, past Chase's $50 grace.
    setTo(sim, checking, -600_00);
    const panel = () => drawn(sim, BankLending as FunctionComponent<Record<string, unknown>>, { bank: bankById('us-chase')!, show: ['borrowing'] }).text;
    expect(panel()).not.toContain('takes what it’s owed');
    sim.advanceTo(sim.now + MS_DAY);
    expect(checking.negativeSince).toBeDefined();
    const said = panel().match(/If Chase Total Checking is still overdrawn at the end of ([A-Z][a-z]+ \d+, \d{4}), Chase takes what it’s owed from your other money there\. If that isn’t enough, it closes the account, and the rest goes to collections and onto your credit record\./);
    expect(said).not.toBeNull();
    const day = said![1]!;
    // TEST SETUP: kept below zero each day, as a player who never pays it in would leave it.
    while (formatDate(sim.now, sim.zone) !== day) { if (checking.balance > -600_00) setTo(sim, checking, -600_00); sim.advanceTo(sim.now + MS_DAY / 4); }
    expect(titled(sim, 'Chase Closed Your Account')).toEqual([]);
    for (let i = 0; i < 6 && titled(sim, 'Chase Closed Your Account').length === 0; i += 1) sim.advanceTo(sim.now + MS_DAY / 4);
    expect(titled(sim, 'Chase Closed Your Account')).toHaveLength(1);
  }, 300_000);
});

describe('a term deposit says what breaking it costs before the money is locked, and beside the button that breaks it', () => {
  it('Chase’s CD: the bank’s rule for its seven months before Put It Away, and today’s cost beside Break It Early, not folded under Sources And Estimates', () => {
    const sim = quickSave({ homeRegionId: 'us-ny-newyork', startLocationId: 'us-ny-newyork', wealth: 'comfortable', bankId: 'us-chase' }, 'b17-cd');
    const offer = drawn(sim, BankLending as FunctionComponent<Record<string, unknown>>, { bank: bankById('us-chase')!, show: ['term'] });
    const rule = 'Breaking it early costs 180 days’ interest on it, never more than it has earned, and at least 7 days’ interest in its first week. Once it’s open, Break It Early is under Your Accounts Over Time.';
    expect(offer.text).toContain(`Locked for 7 months at a fixed 3.5%. At its end it renews for the same term at the bank’s rate on the day, unless you choose another way the bank allows. ${rule}`);
    expect(offer.html.indexOf('Breaking it early costs')).toBeLessThan(offer.html.indexOf('Put It Away'));
    expect(sim.execute({ kind: 'bank.open_term', payload: { amount: 1_000_00, bankId: 'us-chase' } }).ok).toBe(true);
    sim.advanceTo(sim.now + 20 * MS_DAY);
    const held = drawn(sim, BankAccountLife as FunctionComponent<Record<string, unknown>>, { bankId: 'us-chase' });
    expect(held.html).toMatch(/<p[^>]*data-break-cost=""[^>]*>Breaking it now costs \$\d+\.\d\d\.<\/p>/);
    expect(held.html.indexOf('data-break-cost')).toBeLessThan(held.html.indexOf('Break It Early'));
  });

  it('RBC: it can’t be broken, said before Put It Away, with no button to send the player to', () => {
    const sim = quickSave({ homeRegionId: 'ca-on-toronto', startLocationId: 'ca-on-toronto', wealth: 'comfortable', bankId: 'ca-rbc' }, 'b17-cd-ca');
    const offer = drawn(sim, BankLending as FunctionComponent<Record<string, unknown>>, { bank: bankById('ca-rbc')!, show: ['term'] }).text;
    expect(offer).toContain('RBC Royal Bank doesn’t let a term deposit be broken before its end.');
    expect(offer).not.toContain('Once it’s open');
  });
});

describe('an overdrawn account, wherever Money writes its balance', () => {
  it('has its minus sign and its cents in the head, Your Banks and Statements, never a hyphen', () => {
    const sim = quickSave({ homeRegionId: 'us-ny-newyork', startLocationId: 'us-ny-newyork', wealth: 'comfortable', bankId: 'us-chase' }, 'b17-minus');
    const checking = sim.universe.accounts[sim.player.primaryAccountId!]!;
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'savings') setTo(sim, a, 0);
    // TEST SETUP: the account $600 below zero.
    setTo(sim, checking, -600_00);
    const head = drawn(sim, BankWorkspace as FunctionComponent<Record<string, unknown>>).text;
    expect(head).toMatch(/−\$600\.00 held here, in 2 accounts\./);
    expect(drawn(sim, BankMoves as FunctionComponent<Record<string, unknown>>).text).toContain('Chase Total Checking at Chase, overdrawn by $600.00. This is your primary account.');
    const statements = drawn(sim, BankStatements as FunctionComponent<Record<string, unknown>>).text;
    expect(statements).toMatch(/Available Now −\$600\.00/);
    for (const text of [head, statements]) expect(text).not.toMatch(/-\$\d/);
  });
});

describe('a missed loan payment says the fee the bank charged for it', () => {
  it('RBC: the returned payment fee named in the notice that says the payment was missed', () => {
    const sim = quickSave({ homeRegionId: 'ca-on-toronto', startLocationId: 'ca-on-toronto', wealth: 'comfortable', bankId: 'ca-rbc' }, 'b17-loan');
    const checking = sim.universe.accounts[sim.player.primaryAccountId!]!;
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'savings') setTo(sim, a, 0);
    // TEST SETUP: a loan as bank.borrow opens one, its first payment due tomorrow, and nothing to pay it with.
    const loan = sim.openAccount({ id: sim.nextId('account'), kind: 'loan', category: 'personal', name: 'RBC Royal Bank Personal Loan', ownerId: sim.player.id, institution: 'RBC Royal Bank', bankId: 'ca-rbc', openedAt: sim.now, apr: 0.1, loanPayment: 200_00, loanMonths: 24, repayFromId: checking.id });
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: loan.id, amount: -3_000_00 }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: 3_000_00 }] });
    sim.schedule({ at: sim.now + MS_DAY, kind: LOAN_DUE_KIND, label: 'World Simulation', category: 'system', priority: 85, refType: 'account', refId: loan.id, payload: { accountId: loan.id } });
    setTo(sim, checking, 0);
    sim.advanceTo(sim.now + 2 * MS_DAY);
    const said = titled(sim, 'A Missed Loan Payment');
    expect(said).toHaveLength(1);
    expect(said[0]).toMatch(/^Your RBC Royal Bank Personal Loan payment of .+ was due [A-Z][a-z]+ \d{1,2}, \d{4}, and .+\. RBC Royal Bank charged a .*10\.00 returned payment fee for it\. It’s on your credit record, and what’s left is still owed\.$/);
  });
});

describe('Your Banks and Open An Account At Another Bank', () => {
  it('says once where the wages go, and what the bank asks before its deposit and Apply', () => {
    const sim = ada('b17-banks');
    const { html, text } = drawn(sim, BankMoves as FunctionComponent<Record<string, unknown>>);
    expect(text).toContain('Your wages and other payments are paid into it.');
    expect(text).not.toContain('Your wages and other payments go to');
    expect(text).toContain('Have Wages Paid Here, on another account, moves your wages and other payments to it. Yale’s payroll starts paying the new account after 7 days');
    // What the bank needs and costs comes before the button that applies.
    const apply = html.indexOf('>Apply<');
    expect(apply).toBeGreaterThan(0);
    for (const said of ['It decides an application within 2 business days', 'It asks for an opening deposit of $100, sent from another of your accounts as you apply.', 'Its Advantage Plus Banking costs $12.00 a month', 'Money it sends to another bank takes']) {
      expect(html.indexOf(said), said).toBeGreaterThan(0);
      expect(html.indexOf(said), said).toBeLessThan(apply);
    }
  });
});

describe('Move Money between two banks says when it arrives, before Move It', () => {
  it('Chase to Capital One: out now, in on the day `arrivalOf` gives, not available in between', async () => {
    const sim = createSave(1, 'b17-move', newLifeFrom({ homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth: 'modest', bankId: 'us-chase' } as Partial<NewSaveConfig>));
    const chase = sim.universe.accounts[sim.player.primaryAccountId!]!;
    const opened = sim.execute({ kind: 'bank.open_current', payload: { bankId: 'us-capital-one' } });
    expect(opened.ok).toBe(true);
    const cap = sim.universe.accounts[(opened.value as { accountId: string }).accountId]!;
    const { arrivalOf } = await import('@/engine/systems/bankmoves');
    const { html, text } = drawn(sim, BankWorkspace as FunctionComponent<Record<string, unknown>>, {}, [chase.id, cap.id, '']);
    expect(text).toContain(`Sent now, it leaves ${chase.name} at once and arrives in ${cap.name} on ${formatDate(arrivalOf(sim, chase, sim.player), sim.zone)}. It isn’t available to spend in between.`);
    expect(html.indexOf('data-arrives')).toBeLessThan(html.indexOf('>Move It<'));
  });
});

describe('round-ups: the choices a refusal names, and the reason a tally didn’t move', () => {
  it('names the choices with “or”, not a list of commas', () => {
    expect(roundUpChoiceRefusal('us-citi', ROUND_UPS['us-citi']!, {})).toBe('Choose how often it moves: daily or weekly.');
    expect(roundUpChoiceRefusal('fr-lcl', ROUND_UPS['fr-lcl']!, {})).toBe('Choose what to round up to: €1.00 or €5.00.');
  });
});
