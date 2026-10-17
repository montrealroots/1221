/**
 * The money area of brief 14 ("Complete Player-Facing Language And Tutorial Overhaul", 2026-10-17): the words the bank's
 * screens, its looks and its refusals give, read as the player reads them, in the variants a sentence built from parts
 * can take (a balance above zero, at zero and below it; one account and many; an estimate said at the foot).
 *
 * PLAYER JOURNEYS: a New York student at Chase, the screens rendered as the player has them, their buttons pressed as
 * the player presses them. TEST SETUP posts move a balance where a case needs it, as a fee or a purchase would.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, isValidElement, type FunctionComponent, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { formatMoney } from '@/engine/core/money';
import { bankById } from '@/engine/content/banks';
import { bankAccountsOf } from '@/engine/systems/banking';
import { checkingsOf } from '@/engine/systems/lending';
import { DEPOSIT_LEAD } from '@/engine/systems/routing';
import { cardsOf } from '@/engine/systems/credit';
import { instantFromZoned } from '@/engine/core/time';
import { waiverWords } from '@/ui/bank/feeWords';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as lookAt } from '@/ui/looks/subject';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; label: string; onClick?: () => void }[],
  toasts: [] as string[],
}));

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
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  const words = (c: unknown): string => (Array.isArray(c) ? c.map(words).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : '');
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.clicks.push({ feature: props.feature, label: words(props.children).trim(), onClick: props.onClick as never });
      return ce(real.Gated, props);
    },
  };
});

const { BankWorkspace } = await import('@/ui/workspaces/BankWorkspace');
const { BankMoves } = await import('@/ui/bank/BankMoves');
const { BankCard } = await import('@/ui/bank/BankCard');
const { BankCardOffers } = await import('@/ui/bank/BankCardOffers');
const { BankSecurity } = await import('@/ui/bank/BankSecurity');
const { BankPayments } = await import('@/ui/bank/BankPayments');
const { BankCash } = await import('@/ui/bank/BankCash');

const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1');
/** A screen as the player has it: its words, and the Gated buttons it drew. */
function drawn(sim: Simulation, component: FunctionComponent<{ bankId: string }>): string {
  h.sim = sim;
  h.clicks = [];
  return onScreen(renderToStaticMarkup(createElement(component, { bankId: 'us-chase' })));
}
/** The one Gated button of a feature with a label, pressed, and the toasts it gave. */
function press(feature: string, label: string): string[] {
  const b = h.clicks.filter((c) => c.feature === feature && c.label === label);
  expect(b, `one ${feature} ${label}`).toHaveLength(1);
  h.toasts = [];
  b[0]!.onClick!();
  return h.toasts;
}
/** The words a node shows. */
function text(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((n) => text(n as ReactNode)).join('');
  if (!isValidElement(node)) return '';
  return text((node.props as { children?: ReactNode }).children);
}
const look = (sim: Simulation, kind: 'bank' | 'transaction', id: string): Looked => {
  const found = resolveLook(sim, lookAt(kind, id));
  if (!found || 'gone' in found) throw new Error(`${kind}:${id} didn’t resolve`);
  return found;
};

const nyStudent = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase' });
const savingsOf = (sim: Simulation): Account => bankAccountsOf(sim, sim.player).find((a) => a.kind === 'savings' && a.bankId === 'us-chase')!;
const checkingOf = (sim: Simulation): Account => checkingsOf(sim, sim.player).find((a) => a.bankId === 'us-chase')!;
/** TEST SETUP: a balance set, as a fee or a purchase would set it. */
function setBalance(sim: Simulation, account: Account, to: number): void {
  const by = to - account.balance;
  if (by === 0) return;
  sim.post({ memo: 'TEST SETUP', category: 'transfer', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: -by }] });
}
const usd = (cents: number) => formatMoney(cents, 'USD');

describe('PLAYER JOURNEY: a New York student at Chase reads Accounts', () => {
  it('says what closing savings does, above zero, at zero and overdrawn, to the cent; and closing an overdrawn one takes what it says', () => {
    const sim = nyStudent('lang14-close');
    const savings = savingsOf(sim);
    const checking = checkingOf(sim);
    savings.accrued = 0;
    setBalance(sim, savings, 1_234_56);
    expect(drawn(sim, BankWorkspace)).toContain(`Closing it moves its $1,234.56 to ${checking.name}.`);
    setBalance(sim, savings, 0);
    expect(drawn(sim, BankWorkspace)).toContain('It’s empty, so closing it moves nothing.');
    // The missed-plan save's -$3.30, after a $5.00 monthly fee: until 2026-10-17, "Its -$3, moves to Chase Total Checking."
    setBalance(sim, savings, -3_30);
    const words = drawn(sim, BankWorkspace);
    expect(words).toContain(`It’s overdrawn by $3.30. Closing it takes $3.30 from ${checking.name} to clear it.`);
    expect(words).not.toMatch(/Its -\$/);
    // The balance tile's control reads its label and figure apart: until 2026-10-17 its name was "Balance-$3".
    expect(renderToStaticMarkup(createElement(BankWorkspace))).toMatch(/<span class="stat-label">Balance<\/span> <span class="stat-value mono">−\$3\.30<\/span>/);
    expect(words).toContain("Balance −$3.30 Overdrawn");
    drawn(sim, BankWorkspace);
    const before = checking.balance;
    expect(press('bank.close_savings', 'Close It')).toEqual([]);
    expect(savings.closedAt).toBeDefined();
    expect(checking.balance).toBe(before - 3_30);
  });

  it('says a fee’s conditions as what the player does in a month, and says what’s waived so far', () => {
    const sim = nyStudent('lang14-fee');
    const chase = bankById('us-chase')!;
    expect(waiverWords(chase.current, usd)).toBe(', waived in any month you have $500.00 of electronic deposits (wages, benefits or a tax refund) paid in, or keep $1,500.00 in it all month, or keep an average of $5,000.00 across your accounts at the bank');
    expect(waiverWords(chase.savings, usd)).toBe(', waived in any month you keep $300.00 in it all month');
    const words = drawn(sim, BankWorkspace);
    expect(words).toContain('Interest builds up daily and is paid on the last day of the month.');
    expect(words).toMatch(/\$15\.00 a month, waived in any month you have \$500 of electronic deposits \(wages, benefits or a tax refund\) paid in, or keep \$1,500 in it all month, or keep an average of \$5,000 across your accounts at the bank\. (It’s waived this month so far(, with \$[\d,]+ paid in)?\.|It isn’t waived this month so far\. Unless one of those conditions is met, it’s due [A-Z][a-z]+ \d{1,2}, \d{4}\.)/);
  });

  it('opens on the bank and on a statement line in words a player reads', () => {
    const sim = nyStudent('lang14-looks');
    const bank = look(sim, 'bank', 'us-chase');
    const accounts = Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && a.bankId === 'us-chase');
    expect(bank.kind).toBe('Your Everyday Bank');
    expect(bank.summary).toMatch(new RegExp(`^You have \\$[\\d,.]+ here, across ${accounts.length} accounts\\.$`));
    expect(text(bank.body)).toContain('Your primary account is here, so your everyday spending and your pay go through it.');
    expect(bank.provenance).toBe('Each balance is the total of every payment in and out of the account, added up again each time you look.');
    const checking = checkingOf(sim);
    const line = [...sim.universe.transactions].reverse().find((t) => t.postings.some((p) => p.accountId === checking.id) && (t.postsAt === undefined || t.postsAt <= sim.now))!;
    const entry = look(sim, 'transaction', line.id);
    expect(entry.kind).toBe('An Entry On A Statement');
    expect(text(entry.body)).toMatch(/It has posted\.|It was reversed later, so it no longer counts against you\./);
    expect(entry.provenance).toBe('Every entry has a matching one on the other side of the books, and the two add up to zero.');
  });
});

describe('PLAYER JOURNEY: a New York student at Chase opens an account at another bank', () => {
  it('says what the bank asks and how long each step takes, puts each estimate at the foot, and says what Apply did', () => {
    const sim = nyStudent('lang14-open');
    const words = drawn(sim, BankMoves);
    expect(words).toContain('Chase Total Checking at Chase,');
    expect(words).toContain('. This is your primary account.');
    expect(words).toContain(`Other payers take ${DEPOSIT_LEAD.days} days, which is estimated: employers say one to two pay cycles.`);
    expect(words).toContain('Your primary account is the one money comes from unless you say otherwise: your debit card’s everyday purchases come from it;');
    expect(words).not.toMatch(/SLATE’s estimate/);
    const sent = press('bank.open_current', 'Apply');
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatch(/^(Application sent\. [A-Z][\w ]+ decides by [A-Z][a-z]+ \d{1,2}, \d{4}\.|Your account at [A-Z][\w ]+ is open\.( The debit card arrives [A-Z][a-z]+ \d{1,2}, \d{4}\.)?)$/);
  });

  it('refuses in words that say why and what to do next', () => {
    const sim = nyStudent('lang14-refuse');
    const checking = checkingOf(sim);
    expect(sim.execute({ kind: 'bank.set_primary', payload: { accountId: checking.id } }).error).toBe(`${checking.name} is already your primary account.`);
    expect(sim.execute({ kind: 'bank.close_current', payload: { accountId: checking.id } }).error).toBe('It’s your only current account. Open another one first: you always need a current account to be paid into.');
    expect(sim.execute({ kind: 'bank.open_current', payload: { bankId: 'us-chase' } }).error).toBe('You already have a current account at Chase.');
  });
});

describe('PLAYER JOURNEY: a New York student closes Citi while its groceries are pending', () => {
  it('refuses what a closing account can’t take, saying why, and says where what it held went when it closes', () => {
    const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour, minute: 0 }, 'America/New_York');
    const sim = nyStudent('lang14-citi-close');
    const chase = checkingOf(sim).id;
    const opened = sim.execute<{ accountId: string; cardAt: number }>({ kind: 'bank.open_current', payload: { bankId: 'us-citi' } }).value!;
    const citi = opened.accountId;
    const sent = sim.execute<{ arrivesAt: number }>({ kind: 'bank.transfer', payload: { fromId: chase, toId: citi, amount: 1_000_00 } }).value!;
    sim.advanceTo(Math.max(opened.cardAt, sent.arrivesAt) + 60_000);
    expect(sim.execute({ kind: 'bank.set_primary', payload: { accountId: citi } }).ok).toBe(true);
    sim.advanceTo(at(2026, 9, 29, 8));
    // The nights’ groceries are on Citi and still pending; $50 is left in it.
    expect(sim.execute({ kind: 'cash.withdraw', payload: { amount: sim.universe.accounts[citi]!.balance - 50_00, from: 'counter' } }).ok).toBe(true);
    expect(sim.execute({ kind: 'bank.set_primary', payload: { accountId: chase } }).ok).toBe(true);
    const closing = sim.execute<{ closedAt: number }>({ kind: 'bank.close_current', payload: { accountId: citi, remainderTo: chase } }).value!;
    expect(closing.closedAt).toBeGreaterThan(sim.now);
    const card = cardsOf(sim, sim.player)[0]!;
    expect(sim.execute({ kind: 'card.set_autopay_from', payload: { cardId: card.id, accountId: citi } }).error).toBe('Citi Access Checking is closing, so autopay can’t pay from it.');
    expect(sim.execute({ kind: 'bank.redirect_deposits', payload: { accountId: citi } }).error).toBe('Citi Access Checking is closing, so wages can’t be paid into it.');
    sim.advanceTo(closing.closedAt + 60_000);
    const said = sim.universe.notifications.filter((n) => n.title === 'Citi Access Checking Closed').map((n) => n.body);
    expect(said).toHaveLength(1);
    expect(said[0]).toMatch(/^What it held is on its way to Chase Total Checking and arrives [A-Z][a-z]+ \d{1,2}, 2026\.$/);
  });
});

describe('PLAYER JOURNEY: Other Charges and the sources line, at banks around the world', () => {
  const lifeAt = (cityId: string, bankId: string, seed: string) => quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, wealth: 'comfortable', bankId }, seed);
  it('says a returned payment’s fee by the shortfall the bank reads, a dormant account’s and a quiet month’s, each with its source', () => {
    expect(drawn(lifeAt('ca-on-toronto', 'ca-rbc', 'lang14-rbc'), BankWorkspace)).toMatch(/A payment the bank returns unpaid costs [^.]*\$10(\.00)?, or nothing when the account is less than [^.]*\$10(\.00)? short, at most once every 2 business days\. Source: canada\.ca/);
    expect(drawn(lifeAt('jp-13-tokyo', 'jp-resona', 'lang14-resona'), BankWorkspace)).toMatch(/An account left unused for 2 years costs [^ ]+ a year while it holds less than [^ ]+\. Source: resona/);
    expect(drawn(lifeAt('mx-cmx-mexicocity', 'mx-santander', 'lang14-santander'), BankWorkspace)).toMatch(/A month with fewer than 2 transactions costs [^ ]+, unless wages are paid in\. Source: santand/);
  });

  it('says the debit card’s yearly fee and age, its timing, and its estimate after the source', () => {
    const words = drawn(lifeAt('is-39-mosfellsbr', 'is-arion', 'lang14-arion'), BankWorkspace);
    expect(words).toContain('The debit card costs 950 kr a year and 19 kr a purchase, or nothing at 23 and under. It’s paid for the year ahead, and what’s left of the year is refunded if the account closes. Source: Arion’s price list');
    expect(words).toMatch(/ or nothing at 23 and under\. It’s (paid for the year ahead, and what’s left of the year is refunded|charged at the end of each card year, and the days used so far are charged) if the account closes\. Source: Arion’s price list[^.]*\. Estimated: Arion’s price list and terms don’t say when in the year it’s charged\./);
    expect(words).toMatch(/ It’s paid here on [A-Z][a-z]+ \d{1,2}\. The day is estimated\./);
  });

  it('says how sure the research was of a bank’s figures, in the sources line', () => {
    const sim = nyStudent('lang14-confidence');
    const chase = bankById('us-chase')! as { confidence?: 'H' | 'M' | 'L' };
    const was = chase.confidence;
    try {
      chase.confidence = 'M'; // TEST SETUP: a bank outside the thirteen countries is held at its research's confidence
      expect(drawn(sim, BankWorkspace)).toContain(' Some of this bank’s figures couldn’t be fully confirmed.');
      chase.confidence = 'L';
      expect(drawn(sim, BankWorkspace)).toContain(' This bank’s figures couldn’t be confirmed.');
    } finally {
      if (was === undefined) delete chase.confidence; else chase.confidence = was;
    }
  });
});

describe('PLAYER JOURNEY: a New York student at Chase reads Cards and Payments And Cash', () => {
  it('says the card’s rate as set when it opened, its fees and its minimum, in the introductory months', () => {
    const sim = nyStudent('lang14-card');
    const card = cardsOf(sim, sim.player)[0]!;
    const words = drawn(sim, BankCard as FunctionComponent<{ bankId: string }>);
    // Until 2026-10-17 it said the card "opened at this", the 0% of its introductory months.
    expect(words).toMatch(new RegExp(`0% a year on any balance you carry during the introductory months, then 18\\.46%\\. Chase sets a new card’s rate between 18\\.24% and 27\\.74% from your credit record when it opens\\. Yours was set at ${(card.apr! * 100).toFixed(2).replace(/\\.?0+$/, '').replace('.', '\\.')}% when it opened, and the bank doesn’t reprice it\\.`));
    expect(words).toContain('Once a statement isn’t paid in full, interest builds up daily on what you owe, including the interest already added. Pay a statement in full, and new spending is charged no interest until the next one is due.');
    expect(words).toContain('If a payment is sixty days late, the rate goes up to 29.99% after 45 days’ notice. No yearly fee. Statements come on the 20th, and payment is due 21 days after each one.');
    expect(words).toContain('The minimum payment is 1% of the statement plus the month’s interest, or $40 if that’s more. Paying less than the minimum by the due date costs $30 the first time, and $40 if it happens again within 6 billing periods, but never more than the minimum itself.');
    expect(words).toContain('Owed $0 Left To Spend');
    expect(words).toContain('You can apply to any bank here, not only yours. It looks at your credit record and whether you have income or money to repay from, and if it says yes, the card arrives a week later. Applying takes a few points off your credit record, whether or not you’re approved.');
  });

  it('says the card’s offers, and that there’s nothing to put in a plan when there isn’t', () => {
    const words = drawn(nyStudent('lang14-offers'), BankCardOffers as FunctionComponent<{ bankId: string }>);
    expect(words).toMatch(/Rewards: 1\.5% back on every purchase, added up at each statement\. You have \$0 to redeem\. In the bank’s words: .*?\. Those categories are things a card doesn’t buy in the game, so you earn the base rate\./);
    expect(words).toMatch(/A plan made while the introductory rate lasts, until [A-Z][a-z]+ \d{1,2}, \d{4}, is free for its whole life\. One made after that costs 1\.72% of the plan a month, the most the bank says it charges\. There’s nothing on the card to put into one right now\./);
  });

  it('says what a new card costs and how long a card lasts, the estimate as one', () => {
    const words = drawn(nyStudent('lang14-security'), BankSecurity as FunctionComponent<{ bankId: string }>);
    expect(words).toContain('Your Cards Lock a card, report it lost or stolen, or report a payment that wasn’t yours');
    expect(words).toContain('A new card is free. A rushed one costs $15.00 more. Cards last 4 years here. That’s estimated: the bank doesn’t say.');
    expect(words).toContain('The bank lists no fee for a new card, so the game charges nothing for one.');
    expect(words).toContain('The law on the debit card: Under the Electronic Fund Transfer Act');
  });

  it('says how the day’s spending is paid and what savings covers, and what cash is in hand', () => {
    const sim = nyStudent('lang14-pay');
    expect(drawn(sim, BankPayments as FunctionComponent<{ bankId: string }>)).toContain('How the day’s spending is paid, and which account each payment comes from. How This Works The Day’s Spending In Cash, Then The Debit Card On The Credit Card On The Debit Card When this is on, a payment a current account can’t cover is taken from easy-access savings at the same bank, as far as the savings allows. Chase Savings covers Chase Total Checking, which pays the day’s spending and the Chase Freedom Unlimited’s autopay.');
    expect(drawn(sim, BankCash as FunctionComponent<{ bankId: string }>)).toContain('Cash You have $0.00 in cash. How This Works Amount To Take Out (USD)');
  });
});
