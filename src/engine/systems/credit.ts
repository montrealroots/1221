/**
 * SLATE — the card, and the record a lender reads.
 *
 * The card used to be a balance and a rate written on it that nothing
 * charged, and the credit score was shown at creation and thrown away. Now
 * the card runs as a card does: a statement on the 20th, and a payment due on
 * the 15th of the next month, at least the 21 days after the statement a US
 * card must allow. Autopay pays the whole statement, as much of it as checking
 * holds, or only the minimum if the player says so, and anything more can be
 * paid whenever they like. It paid the minimum first, and a café worker in
 * Mosfellsbær ended the year with 931,000 krónur in checking and 126,000
 * still on the card at 28%, the record sliding for how much of it was used. A
 * statement paid in full keeps its grace period, and one that wasn't is
 * charged the month's interest at the card's rate. A payment short of the
 * minimum is late: a fee, and the record takes it.
 *
 * The record is kept as a score on the US scale, 300 to 850, which is how
 * American lenders read somebody and near enough how Canadian ones do. Most
 * of the world keeps no single number; the screen shows the score only in
 * those two countries and a plain word elsewhere. What moves it each month is
 * what moves a real one most: paying on time (it rises), how much of the card
 * is used (over thirty percent costs), a late payment, rent owed, and an
 * eviction. What it decides: the card's rate, repriced on each statement; the
 * card's limit, raised a fifth at a six-monthly review for a record of 700
 * with nothing late in a year and cut to 70% by a late payment; and the
 * deposit a landlord asks (`depositFor` in `systems/household.ts`). It
 * decided only the rate at first.
 *
 * The minimum, the fee and the rate bands are SLATE's estimates of typical
 * American card terms, and the score's monthly moves a simplification of a
 * model no lender publishes.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { CITIES, COUNTRIES } from '../content/geography';
import { exchange } from '../content/currency';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { instantFromZoned, zonedParts, type Instant } from '../core/time';
import { CommandError } from '../core/simulation';
import { arrearsOf } from './household';

export const STATEMENT_KIND = 'card.statement';
export const DUE_KIND = 'card.due';

export interface CreditState {
  /** 300 to 850, the US scale. */
  score: number;
  /** Late payments, by when. */
  late: Instant[];
  autopay: 'minimum' | 'full';
  /** What the last statement said was owed, and whether it has been paid in full. */
  statementBalance: Money;
  paidSinceStatement: Money;
  /** Whether the last statement was left partly unpaid, so this month's balance draws interest. */
  carrying: boolean;
  /** When the card's limit was last reviewed. */
  reviewedAt?: Instant;
}

const SCORE_MIN = 300;
const SCORE_MAX = 850;
/** The rate a score buys. SLATE's estimate of typical US card pricing. */
const RATE_BANDS: readonly { from: number; apr: number }[] = [
  { from: 800, apr: 0.1999 }, { from: 740, apr: 0.2199 }, { from: 670, apr: 0.2499 },
  { from: 580, apr: 0.2799 }, { from: 0, apr: 0.2999 },
];
const MINIMUM_USD = 25;
const MINIMUM_SHARE = 0.02;
const LATE_FEE_USD = 32;
/** How often the limit is reviewed, and the record that earns a raise. */
const REVIEW_EVERY = 182 * 86_400_000;
const RAISE_FROM = 700;

export function aprFor(score: number): number {
  return RATE_BANDS.find((band) => score >= band.from)!.apr;
}

/** Where the score is shown as a number: the United States and Canada. */
export function scoreIsANumberIn(cityId: string): boolean {
  const code = COUNTRIES.get(CITIES.get(cityId)?.countryId ?? '')?.jurisdictionCode;
  return code === 'US' || code === 'CA';
}

/** A score said in a word, for everywhere that doesn't keep one number. */
export function scoreWord(score: number): string {
  return score >= 800 ? 'Exceptional' : score >= 740 ? 'Very Good' : score >= 670 ? 'Good' : score >= 580 ? 'Fair' : 'Poor';
}

function cardOf(sim: Simulation, person: Person): Account | undefined {
  return Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.kind === 'credit_card' && !a.closedAt);
}

function usdIn(sim: Simulation, usd: number): Money {
  const cents = exchange(usd * 100, 'USD', saveCurrency(sim.universe)) ?? usd * 100;
  return Math.round(cents / 100) * 100;
}

/** The least that must be paid on a statement. */
export function minimumDue(sim: Simulation, statement: Money): Money {
  return Math.min(statement, Math.max(usdIn(sim, MINIMUM_USD), Math.round(statement * MINIMUM_SHARE)));
}

/** Pays the card from checking, as much of an amount as checking holds. Returns what was paid. */
function payCard(sim: Simulation, person: Person, amount: Money): Money {
  const card = cardOf(sim, person);
  const checking = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
  if (!card || !checking) return 0;
  const paid = Math.max(0, Math.min(amount, checking.balance, -card.balance));
  if (paid <= 0) return 0;
  sim.post({
    memo: `Paid ${card.name}`, category: 'card-payment',
    postings: [{ accountId: card.id, amount: paid }, { accountId: checking.id, amount: -paid }],
  });
  if (person.credit) person.credit.paidSinceStatement += paid;
  return paid;
}

function zoneOf(sim: Simulation, person: Person): string {
  return CITIES.get(person.currentLocationId)?.timeZone ?? sim.homeZone;
}

/** The next statement: the 20th at nine. */
function scheduleStatement(sim: Simulation, person: Person, after: Instant): void {
  const zone = zoneOf(sim, person);
  const p = zonedParts(after, zone);
  let at = instantFromZoned({ year: p.year, month: p.month, day: 20, hour: 9 }, zone);
  if (at <= after) at = instantFromZoned({ year: p.month === 12 ? p.year + 1 : p.year, month: p.month === 12 ? 1 : p.month + 1, day: 20, hour: 9 }, zone);
  sim.schedule({ at, kind: STATEMENT_KIND, label: 'Card Statement', category: 'home', priority: 36, payload: { personId: person.id } });
}

/** The payment due: the 15th of the month after a statement, at noon. */
function scheduleDue(sim: Simulation, person: Person, statementAt: Instant): void {
  const zone = zoneOf(sim, person);
  const p = zonedParts(statementAt, zone);
  const at = instantFromZoned({ year: p.month === 12 ? p.year + 1 : p.year, month: p.month === 12 ? 1 : p.month + 1, day: 15, hour: 12 }, zone);
  sim.schedule({ at, kind: DUE_KIND, label: 'Card Payment Due', category: 'home', priority: 36, payload: { personId: person.id } });
}

export function registerCredit(sim: Simulation): void {
  sim.onSchedule(STATEMENT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId ?? s.universe.playerId)];
    const credit = person?.credit;
    const card = person ? cardOf(s, person) : undefined;
    if (!person || !credit || !card) return;
    // Repriced from the record, then the month's interest if last month's
    // statement was carried.
    card.apr = aprFor(credit.score);
    const owed = Math.max(0, -card.balance);
    if (credit.carrying && owed > 0) {
      const interest = Math.round(owed * card.apr / 12);
      s.post({
        memo: 'Interest', category: 'interest',
        postings: [{ accountId: s.nominalAccount('expense', 'Card Interest').id, amount: interest }, { accountId: card.id, amount: -interest }],
      });
    }
    credit.statementBalance = Math.max(0, -card.balance);
    credit.paidSinceStatement = 0;
    // Every six months, a good record raises the limit.
    if (credit.reviewedAt === undefined || s.now - credit.reviewedAt >= REVIEW_EVERY) {
      credit.reviewedAt = s.now;
      const clean = !credit.late.some((when) => s.now - when < 365 * 86_400_000);
      if (credit.score >= RAISE_FROM && clean && (card.creditLimit ?? 0) > 0) {
        card.creditLimit = Math.round((card.creditLimit ?? 0) * 1.2 / 100) * 100;
        if (person.id === s.universe.playerId) {
          s.notify({ category: 'money', title: 'Your Card Limit Went Up', body: `It's ${formatMoney(card.creditLimit, saveCurrency(s.universe))} now, for a clean record.`, importance: 40 });
        }
      }
    }
    if (credit.statementBalance > 0) scheduleDue(s, person, item.at);
    scheduleStatement(s, person, item.at);
  });

  sim.onSchedule(DUE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId ?? s.universe.playerId)];
    const credit = person?.credit;
    const card = person ? cardOf(s, person) : undefined;
    if (!person || !credit || !card) return;
    const currency = saveCurrency(s.universe);
    const statement = credit.statementBalance;
    const minimum = minimumDue(s, statement);
    const want = credit.autopay === 'full' ? statement : minimum;
    payCard(s, person, Math.max(0, want - credit.paidSinceStatement));
    const paid = credit.paidSinceStatement;
    credit.carrying = paid < statement;

    let move = 0;
    if (paid < minimum) {
      const fee = usdIn(s, LATE_FEE_USD);
      s.post({
        memo: 'Late fee', category: 'fees',
        postings: [{ accountId: s.nominalAccount('expense', 'Card Fees').id, amount: fee }, { accountId: card.id, amount: -fee }],
      });
      credit.late = [...credit.late.filter((when) => s.now - when < 365 * 86_400_000), s.now];
      move -= 50;
      // And the lender cuts the line, never under what's owed on it.
      const cut = Math.max(Math.max(0, -card.balance), Math.round((card.creditLimit ?? 0) * 0.7 / 100) * 100);
      if (cut < (card.creditLimit ?? 0)) card.creditLimit = cut;
      s.notify({
        category: 'money',
        title: 'A Late Card Payment',
        body: `The minimum was ${formatMoney(minimum, currency)} and only ${formatMoney(paid, currency)} went in. A ${formatMoney(fee, currency)} fee, and it's on your record.`,
        importance: 80,
      });
    } else {
      move += 3;
    }
    const limit = card.creditLimit ?? 0;
    const used = limit > 0 ? Math.max(0, -card.balance) / limit : 0;
    if (used > 0.3) move -= Math.round((used - 0.3) * 20);
    if (arrearsOf(s, person) > 0) move -= 10;
    credit.score = Math.max(SCORE_MIN, Math.min(SCORE_MAX, credit.score + move));
  });

  sim.onCommand<{ amount: 'full' | 'minimum' | number }, { paid: Money }>('finance.pay_card', (p, { sim: s }) => {
    const person = s.player;
    const card = cardOf(s, person);
    if (!card) throw new CommandError('You don’t have a card.');
    const owed = Math.max(0, -card.balance);
    if (owed === 0) throw new CommandError('You don’t owe anything on it.');
    const want = p.amount === 'full' ? owed
      : p.amount === 'minimum' ? minimumDue(s, person.credit?.statementBalance ?? owed)
        : Math.round(Number(p.amount));
    if (!(want > 0)) throw new CommandError('Pay something, or nothing.');
    const paid = payCard(s, person, want);
    if (paid === 0) throw new CommandError('There’s nothing in checking to pay it with.');
    return { paid };
  });

  sim.onCommand<{ mode: 'minimum' | 'full' }, { mode: string }>('finance.set_autopay', (p, { sim: s }) => {
    if (p.mode !== 'minimum' && p.mode !== 'full') throw new CommandError('Autopay pays the minimum or the whole statement.');
    if (!s.player.credit) throw new CommandError('You don’t have a card.');
    s.player.credit.autopay = p.mode;
    return { mode: p.mode };
  });
}

/** Opens their record at a score, with the first statement on the calendar. */
export function openCredit(sim: Simulation, person: Person, score: number): void {
  person.credit = {
    score, late: [], autopay: 'full', statementBalance: 0, paidSinceStatement: 0, reviewedAt: sim.now,
    // A balance brought in from before is one the last statement didn't clear.
    carrying: (cardOf(sim, person)?.balance ?? 0) < 0,
  };
  const card = cardOf(sim, person);
  if (card) card.apr = aprFor(score);
  scheduleStatement(sim, person, sim.now);
}

/** A statement ahead for everybody with a record and a card, where none is. */
export function armCredit(sim: Simulation): void {
  for (const person of Object.values(sim.universe.people)) {
    if (!person.credit || !cardOf(sim, person)) continue;
    const due = sim.universe.scheduled.some((one) => one.kind === STATEMENT_KIND && one.status === 'pending'
      && one.payload.personId === person.id);
    if (!due) scheduleStatement(sim, person, sim.now);
  }
}
