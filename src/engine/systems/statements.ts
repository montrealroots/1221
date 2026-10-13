/**
 * SLATE — statements: what went in and out of an account, and when.
 *
 * Until 2026-09-26 nothing showed a single transaction. The account look gave
 * thirty days' totals, net worth gave thirty days' spending by kind, and the
 * rent paid, the day's food, a fee or the interest the bank took tax off were
 * in the ledger and nowhere on screen. Every figure here is read from the
 * ledger's postings, so a statement can't disagree with a balance.
 *
 * - **An account's statement** (A87, A90, A92, A93, B22, B24 in
 *   `docs/BANKING-FUNCTIONS.md`) runs a calendar month where the bank sends
 *   one monthly, and a calendar quarter in Germany, where the account is
 *   closed each quarter (A88): what it opened at, every entry with the
 *   balance after it, what came in and went out, the interest and the fees,
 *   and what it closed at.
 * - **The card's statement** (C40) runs from one statement date to the next:
 *   the balance brought forward, payments, spending, fees and interest, the
 *   new balance, the minimum, the due date, what paying only the minimum
 *   would take (C93), and in Britain next month's interest (C44).
 * - **The year** (A100, A160): interest earned and the tax the bank took,
 *   and every fee paid, bank and card, by kind.
 * - **Alerts** (A147): each current account under a line the holder sets (the primary alone until 2026-10-10), an
 *   account short for a payment coming (`systems/obligations.ts`), a
 *   payment out over one, and a statement ready. A bank's app sets the
 *   statement alert on and leaves the others for the holder to set.
 */

import type { Simulation } from '../core/simulation';
import { accountAlerts } from './obligations';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency } from '../core/money';
import type { Account, LedgerTransaction } from '../core/ledger';
import { isLiability } from '../core/ledger';
import type { Money } from '../core/money';
import { MS_DAY, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { bankById } from '../content/banks';
import { cardTerms, minimumDue, stateOf, statementDayOf, type CardTerms } from './credit';
import { closesQuarterly } from './banking';

/** One entry, as the account saw it. */
export interface StatementLine {
  id: string;
  at: Instant;
  memo: string;
  category: string;
  /** What it did to the account: in is positive; on a card, a charge is positive (it adds to what's owed). */
  amount: Money;
  /** The account's balance after it, the same way round. */
  balance: Money;
  /** Authorized and not yet posted, and when it posts (A95). */
  pending?: boolean;
  postsAt?: Instant;
}

/** A statement's period. `rebuilt`: drawn on a statement day from before its cuts were kept, not the cut itself (from 2026-10-10). */
export interface Period { from: Instant; to: Instant; label: string; rebuilt?: boolean }

/** Statement-sense of a balance: what's in an account, what's owed on a card or loan. */
const sense = (account: Account) => (isLiability(account.kind) ? -1 : 1);

/** Every entry on an account between two instants, oldest first, each with the balance after it. */
export function activity(sim: Simulation, account: Account, from: Instant, to: Instant): { opening: Money; closing: Money; lines: StatementLine[] } {
  const k = sense(account);
  const list = sim.universe.transactions as LedgerTransaction[];
  // The balance now, walked back to the period's end and start.
  let atEnd = account.balance;
  const inside: { txn: LedgerTransaction; delta: Money }[] = [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const txn = list[i]!;
    if (txn.at < from) break;
    const delta = txn.postings.reduce((s, p) => (p.accountId === account.id ? s + p.amount : s), 0);
    if (delta === 0 && !txn.postings.some((p) => p.accountId === account.id)) continue;
    if (txn.at >= to) { atEnd -= delta; continue; }
    inside.push({ txn, delta });
  }
  inside.reverse();
  const opening = atEnd - inside.reduce((s, one) => s + one.delta, 0);
  let running = opening;
  const lines = inside.map(({ txn, delta }) => {
    running += delta;
    return { id: txn.id, at: txn.at, memo: txn.memo, category: txn.category, amount: delta * k, balance: running * k, ...(txn.postsAt !== undefined ? { postsAt: txn.postsAt, ...(txn.postsAt > sim.now ? { pending: true } : {}) } : {}) };
  });
  return { opening: opening * k, closing: atEnd * k, lines };
}


const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * An account's statement periods, newest first, from when it opened to now, or to its closing (from 2026-10-10: until
 * then a closed account went on having months, empty ones, to today); the current one is still open, a closed
 * account's last ends at its closing.
 */
export function periodsOf(sim: Simulation, account: Account): Period[] {
  // The bank's own zone, where its month ends and fees fall (from 2026-10-10: until then where the player was).
  const zone = sim.homeZone;
  const out: Period[] = [];
  const card = account.kind === 'credit_card';
  const owner = sim.universe.people[account.ownerId];
  const kept = card && owner?.credit ? stateOf(owner, account).cuts ?? [] : [];
  if (card && kept.length) return cardPeriods(sim, account, kept);
  const quarterly = closesQuarterly(account);
  const start = zonedParts(account.openedAt, zone);
  const end = account.closedAt ?? sim.now;
  const now = zonedParts(end, zone);
  // Cards run from the 20th to the 20th, at nine, as their statements do (`systems/credit.ts`).
  let y = now.year;
  let m = now.month;
  // A card states on its day, the 20th unless the holder moved it.
  const sday = statementDayOf(sim.universe.people[account.ownerId], card ? account : undefined);
  if (card && end >= instantFromZoned({ year: now.year, month: now.month, day: sday, hour: 9 }, zone)) m += 1;
  if (m > 12) { m -= 12; y += 1; }
  if (quarterly) m = Math.ceil(m / 3) * 3;
  for (let i = 0; i < 600; i += 1) {
    const endMonth = m;
    const step = quarterly ? 3 : 1;
    const startMonth = endMonth - step + 1;
    const to = card
      ? instantFromZoned({ year: y, month: endMonth, day: sday, hour: 9 }, zone)
      : instantFromZoned({ year: y, month: endMonth + 1, day: 1, hour: 0 }, zone);
    const from = card
      ? instantFromZoned({ year: y, month: endMonth - 1, day: sday, hour: 9 }, zone)
      : instantFromZoned({ year: y, month: startMonth, day: 1, hour: 0 }, zone);
    const endParts = zonedParts(to - 1, zone);
    const fromParts = zonedParts(from, zone);
    const label = card
      ? `Statement Of ${MONTHS[endParts.month - 1]} ${sday}, ${endParts.year}`
      : quarterly
        ? `${MONTHS[fromParts.month - 1]} To ${MONTHS[endParts.month - 1]} ${endParts.year}`
        : `${MONTHS[fromParts.month - 1]} ${fromParts.year}`;
    // A card's past statement drawn here has no cut kept (a save from before 2026-10-10): rebuilt, and said so.
    const closing = account.closedAt !== undefined && to > account.closedAt;
    out.push({ from, to: closing ? account.closedAt! : to, label: closing ? `${label}, To Its Closing` : to > sim.now ? `${label}, So Far` : card ? `${label} (Rebuilt)` : label, ...(card && to <= sim.now ? { rebuilt: true } : {}) });
    if (from <= account.openedAt || (fromParts.year < start.year - 1)) break;
    m -= step;
    while (m < 1) { m += 12; y -= 1; }
  }
  return out;
}

/**
 * A card's periods from its kept cuts (from 2026-10-10): the open one from the last cut to the next statement on the
 * calendar, each past one between two cuts, so a moved statement day moves only what comes after it. Before the first
 * cut kept, a save from before then: monthly on that first cut's day, back to the card's opening, each marked rebuilt.
 */
function cardPeriods(sim: Simulation, account: Account, kept: readonly Instant[]): Period[] {
  const zone = sim.zone;
  const cuts = [...kept].sort((a, b) => a - b);
  const labelOf = (to: Instant) => { const p = zonedParts(to, zone); return `Statement Of ${MONTHS[p.month - 1]} ${p.day}, ${p.year}`; };
  const next = sim.universe.scheduled
    .filter((i) => i.kind === 'card.statement' && i.status === 'pending' && (i.payload.personId ?? sim.universe.playerId) === account.ownerId
      && (i.payload.accountId === account.id || i.payload.accountId === undefined))
    .sort((a, b) => a.at - b.at)[0]?.at;
  const last = cuts[cuts.length - 1]!;
  const out: Period[] = [];
  if (!account.closedAt || account.closedAt > last) {
    // A card closed since its last cut ends there, as a closed account's last period does (from 2026-10-13: until then it
    // ran on past the closing, read "So Far"; found by the review of that day).
    const to = account.closedAt ?? next ?? last + 31 * MS_DAY;
    out.push({ from: last, to, label: `${labelOf(to)}, ${account.closedAt ? 'To Its Closing' : 'So Far'}` });
  }
  for (let i = cuts.length - 1; i >= 1; i -= 1) out.push({ from: cuts[i - 1]!, to: cuts[i]!, label: labelOf(cuts[i]!) });
  // Before the first kept cut: a month back at a time, on its day.
  const first = zonedParts(cuts[0]!, zone);
  let to = cuts[0]!;
  for (let n = 1; n < 600 && to > account.openedAt; n += 1) {
    const from = Math.max(account.openedAt, instantFromZoned({ year: first.year, month: first.month - n, day: first.day, hour: 9 }, zone));
    out.push({ from, to, label: `${labelOf(to)} (Rebuilt)`, rebuilt: true });
    to = from;
  }
  return out;
}

export interface AccountStatement {
  period: Period;
  opening: Money;
  closing: Money;
  moneyIn: Money;
  moneyOut: Money;
  interest: Money;
  fees: Money;
  lines: StatementLine[];
}

const FEE_CATEGORIES = new Set(['bank_fee', 'fees']);

/** The interest in a transaction: what the bank's interest paid, before any tax taken off it. */
function interestIn(sim: Simulation, txn: LedgerTransaction | undefined): { gross: Money; tax: Money } {
  if (!txn || txn.category !== 'interest') return { gross: 0, tax: 0 };
  let gross = 0;
  let tax = 0;
  for (const p of txn.postings) {
    const account = sim.universe.accounts[p.accountId];
    if (!account?.nominal) continue;
    // Only interest is paid from the books' income in an interest transaction.
    if (account.kind === 'income') gross += -p.amount;
    if (account.kind === 'expense' && account.name === 'Tax On Interest') tax += p.amount;
  }
  return { gross, tax };
}

function byId(sim: Simulation): Map<string, LedgerTransaction> {
  return new Map((sim.universe.transactions as LedgerTransaction[]).map((t) => [t.id, t]));
}

export function accountStatement(sim: Simulation, account: Account, period: Period): AccountStatement {
  const { opening, closing, lines } = activity(sim, account, period.from, period.to);
  let moneyIn = 0;
  let moneyOut = 0;
  let interest = 0;
  let fees = 0;
  const txns = byId(sim);
  for (const line of lines) {
    if (line.amount > 0) moneyIn += line.amount; else moneyOut += -line.amount;
    const paid = interestIn(sim, txns.get(line.id));
    interest += paid.gross - paid.tax;
    if (FEE_CATEGORIES.has(line.category)) fees += -line.amount;
  }
  return { period, opening, closing, moneyIn, moneyOut, interest, fees: Math.max(0, fees), lines };
}

export interface CardStatement {
  period: Period;
  previous: Money;
  payments: Money;
  spending: Money;
  fees: Money;
  interest: Money;
  newBalance: Money;
  /** The average of what the card owed each day of the period: the balance interest is worked on (C43). */
  averageDaily: Money;
  lines: StatementLine[];
  /** For the latest closed statement: the least to pay, and when. */
  minimum?: Money;
  /** What paying only the minimum each month would take, and cost in all; and the payment that clears it in three years. */
  minimumOnly?: { months: number; total: Money; threeYears: Money; threeYearsTotal: Money } | 'never';
  /** Britain: next month's interest on the new balance, if it's carried. */
  nextInterest?: Money;
  terms: CardTerms;
}

export function cardStatement(sim: Simulation, card: Account, period: Period): CardStatement {
  const { opening, closing, lines } = activity(sim, card, period.from, period.to);
  let payments = 0;
  let spending = 0;
  let fees = 0;
  let interest = 0;
  for (const line of lines) {
    if (line.amount < 0) payments += -line.amount;
    else if (line.category === 'interest') interest += line.amount;
    else if (FEE_CATEGORIES.has(line.category)) fees += line.amount;
    else spending += line.amount;
  }
  // A statement already cut reads its own terms and minimum as they were (`CardState.issued`, from 2026-10-10); the one
  // still open, and a statement from before the record was kept, today's, with its own holder's score.
  const owner = sim.universe.people[card.ownerId ?? ''];
  const kept = owner?.credit ? stateOf(owner, card).issued?.find((x) => Math.abs(x.at - period.to) < 60_000) : undefined;
  const terms = kept?.terms ?? cardTerms(sim, card, owner?.credit?.score ?? sim.player.credit?.score ?? 650);
  // What it owed over the period, weighted by how long it owed it.
  const end = Math.min(period.to, sim.now);
  let owedNow = Math.max(0, opening);
  let since = period.from;
  let weighted = 0;
  for (const line of lines) {
    weighted += owedNow * Math.max(0, line.at - since);
    owedNow = Math.max(0, line.balance);
    since = line.at;
  }
  weighted += owedNow * Math.max(0, end - since);
  const averageDaily = end > period.from ? Math.round(weighted / (end - period.from)) : 0;
  const out: CardStatement = { period, previous: opening, payments, spending, fees, interest, newBalance: Math.max(0, closing), averageDaily, lines, terms };
  if (period.to <= sim.now && out.newBalance > 0) {
    // The card's own plan months, not the everyday card's: until 2026-09-28 they were one card.
    out.minimum = kept?.minimum ?? minimumDue(sim, out.newBalance, terms, interest, owner?.credit ? stateOf(owner, card).statementPlanDue ?? 0 : 0);
    out.minimumOnly = payingTheMinimum(sim, out.newBalance, terms, kept?.at);
    const bank = card.bankId ? bankById(card.bankId) : undefined;
    if (bank?.iso === 'GB' && terms.kind === 'revolving') out.nextInterest = Math.round(out.newBalance * terms.apr / 12);
  }
  return out;
}

/**
 * The warning a statement carries (Reg Z §1026.7(b)(12) in the US; the UK and
 * others say the same in words): pay only the minimum each month, spending
 * nothing more, and how long it takes and what it costs in all; and the
 * monthly payment that clears it in three years, and its total. An
 * introductory rate is taken for the months it has left and the card's own
 * rate after, as Reg Z §1026.7(b)(12)(i)(D) has it; until 2026-09-26 SLATE
 * had no introductory rates.
 */
export function payingTheMinimum(sim: Simulation, balance: Money, terms: CardTerms, asOf: Instant = sim.now): { months: number; total: Money; threeYears: Money; threeYearsTotal: Money } | 'never' {
  if (terms.kind === 'charge') return { months: 1, total: balance, threeYears: balance, threeYearsTotal: balance };
  // The intro months left as of the statement's own day (from 2026-10-10: until then as of today).
  const introMonths = terms.standardApr !== undefined && terms.introUntil !== undefined ? Math.max(0, Math.round((terms.introUntil - asOf) / (30.44 * 86_400_000))) : 0;
  const rateIn = (month: number) => (month < introMonths ? terms.apr : terms.standardApr ?? terms.apr) / 12;
  const r = rateIn(introMonths);
  let left = balance;
  let total = 0;
  let months = 0;
  // A hundred years without clearing it is never.
  while (left > 0 && months < 1200) {
    const interest = Math.round(left * rateIn(months));
    left += interest;
    const pay = Math.min(left, minimumDue(sim, left, terms, interest, 0));
    left -= pay;
    total += pay;
    months += 1;
  }
  if (left > 0) return 'never';
  const threeYears = introMonths > 0 ? clearsIn36(balance, rateIn) : r > 0 ? Math.ceil(balance * r / (1 - (1 + r) ** -36)) : Math.ceil(balance / 36);
  return { months, total, threeYears, threeYearsTotal: threeYears * 36 };
}

/** The least equal monthly payment that clears a balance in 36 months, month by month at each month's rate. */
function clearsIn36(balance: Money, rateIn: (month: number) => number): Money {
  const clears = (payment: Money) => {
    let left = balance;
    for (let month = 0; month < 36; month += 1) left = left + left * rateIn(month) - payment;
    return left <= 0;
  };
  let low = Math.ceil(balance / 36);
  let high = balance;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (clears(mid)) high = mid; else low = mid + 1;
  }
  return low;
}

export interface YearSummary {
  year: number;
  interestEarned: Money;
  taxTaken: Money;
  bankFees: Money;
  cardFees: Money;
  cardInterest: Money;
  byFee: { memo: string; amount: Money }[];
}

/**
 * What a year cost and earned at the bank, as the bank reports it: interest
 * earned before tax and the tax taken off it, and every fee, by kind.
 */
export function yearSummary(sim: Simulation, ownerId: string, year: number): YearSummary {
  const zone = sim.zone;
  const from = instantFromZoned({ year, month: 1, day: 1, hour: 0 }, zone);
  const to = instantFromZoned({ year: year + 1, month: 1, day: 1, hour: 0 }, zone);
  const mine = new Map(Object.values(sim.universe.accounts).filter((a) => a.ownerId === ownerId && !a.nominal).map((a) => [a.id, a]));
  const out: YearSummary = { year, interestEarned: 0, taxTaken: 0, bankFees: 0, cardFees: 0, cardInterest: 0, byFee: [] };
  const byFee = new Map<string, Money>();
  for (const txn of sim.universe.transactions as LedgerTransaction[]) {
    if (txn.at < from || txn.at >= to) continue;
    const touches = txn.postings.filter((p) => mine.has(p.accountId));
    if (touches.length === 0) continue;
    const onCard = touches.some((p) => mine.get(p.accountId)!.kind === 'credit_card');
    if (txn.category === 'interest') {
      if (onCard) { out.cardInterest += touches.reduce((s, p) => s - p.amount, 0); continue; }
      const paid = interestIn(sim, txn);
      out.interestEarned += paid.gross;
      out.taxTaken += paid.tax;
      continue;
    }
    if (FEE_CATEGORIES.has(txn.category)) {
      const paid = touches.reduce((s, p) => s - p.amount, 0);
      if (paid <= 0) continue;
      if (onCard) out.cardFees += paid; else out.bankFees += paid;
      const kind = txn.memo.replace(/:.*$/, '');
      byFee.set(kind, (byFee.get(kind) ?? 0) + paid);
    }
  }
  out.byFee = [...byFee.entries()].map(([memo, amount]) => ({ memo, amount })).sort((a, b) => b.amount - a.amount);
  return out;
}

/** The annual percentage yield of a rate credited monthly: what a year earns with the interest left in. */
export function apyOf(rate: number, creditsPerYear = 12): number {
  return (1 + rate / creditsPerYear) ** creditsPerYear - 1;
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export interface AlertSettings {
  /** Tell them when a current account ends a day under this, each of them from 2026-10-10 (the primary alone until then); absent, off. */
  lowBalance?: Money;
  /** The accounts told they're under the line, until each is back above it (`accountAlerts`). */
  lowSentFor?: string[];
  /** Tell them when an account can't cover a payment due from it in the next days (`systems/obligations.ts`); absent, on. */
  upcoming?: boolean;
  /** The payments already told of as short, each once. */
  warned?: string[];
  /** Tell them of any payment out of the current account or onto the card over this; absent, off. */
  largePayment?: Money;
  /**
   * Tell them when a statement is ready. Off by default since 2026-09-28: a
   * statement with a payment due tells them anyway (`statementReady`), and a
   * current account's and a paid-off card's, two every month, buried what
   * wanted them in a played life, 117 of 305 notices.
   */
  statements: boolean;
  /** Whether the low-balance alert had fired for the primary account: a save from before 2026-10-10, read into `lowSentFor` once. */
  lowSent?: boolean;
  /** The last transaction the large-payment alert has looked at. */
  seenUpTo?: number;
}

export function alertsOf(person: Person): AlertSettings {
  return person.alerts ?? { statements: false };
}

/** A statement ready: always where there's a payment due, as a bill; otherwise where they asked to be told. */
export function statementReady(sim: Simulation, person: Person, account: Account, words: string, due = false): void {
  if (person.id !== sim.universe.playerId || (!due && !alertsOf(person).statements)) return;
  sim.notify({ category: 'bank', title: `Statement Ready: ${account.name}`, body: words, importance: due ? 50 : 20, route: '/workspace/bank' });
}

/**
 * What was paid, inside a sentence: its first letter made small, but not where it opens with a name of two capitalized
 * words (from 2026-10-13: until then all of it was made small, "yale delta dental basic, the year"; found by the review of
 * that day).
 */
const inSentence = (memo: string): string => (/^\S+ [A-Z]/.test(memo) ? memo : memo.charAt(0).toLowerCase() + memo.slice(1));

export function registerStatements(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'bank.alerts', (_event, { sim: s }) => {
    const person = s.player;
    // Each current account's low line, and each one short for a payment coming (`accountAlerts`, from 2026-10-10).
    accountAlerts(s, person);
    const alerts = person.alerts;
    if (!alerts) return;
    const cur = saveCurrency(s.universe);
    const list = s.universe.transactions as LedgerTransaction[];
    const from = Math.min(alerts.seenUpTo ?? list.length, list.length);
    if (alerts.largePayment !== undefined) {
      // Savings too, from 2026-10-10: until then a payment out of savings was never alerted.
      const watched = new Set(Object.values(s.universe.accounts).filter((a) => a.ownerId === person.id && (a.kind === 'checking' || a.kind === 'savings' || a.kind === 'credit_card') && !a.closedAt && !a.nominal).map((a) => a.id));
      for (let i = from; i < list.length; i += 1) {
        const txn = list[i]!;
        for (const p of txn.postings) {
          if (!watched.has(p.accountId) || p.amount >= 0 || -p.amount < alerts.largePayment) continue;
          // A stranger's charge is told of where it's taken (`somebodyElse`, systems/security.ts); until 2026-10-10 the alert said it twice.
          if (txn.category === 'transfer' || txn.category === 'card-fraud' || txn.category === 'account-fraud') continue;
          s.notify({ category: 'bank', title: 'A Large Payment', body: `${formatMoney(-p.amount, cur)} for ${inSentence(txn.memo)}, from ${s.universe.accounts[p.accountId]!.name}.`, importance: 45, route: '/workspace/bank' });
        }
      }
    }
    alerts.seenUpTo = list.length;
  });

  sim.onCommand<{ lowBalance?: Money | null; largePayment?: Money | null; statements?: boolean; upcoming?: boolean }, { alerts: AlertSettings }>('bank.set_alerts', (p, { sim: s }) => {
    const person = s.player;
    const next: AlertSettings = { ...alertsOf(person) };
    const line = (v: unknown, name: string): Money | undefined => {
      if (v === null) return undefined;
      const n = Math.round(Number(v));
      if (!(n >= 0)) throw new CommandError(`Set the ${name} as an amount, or turn it off.`);
      return n;
    };
    if ('lowBalance' in p) { next.lowBalance = line(p.lowBalance, 'low balance'); next.lowSentFor = []; delete next.lowSent; }
    if (p.upcoming !== undefined) next.upcoming = Boolean(p.upcoming);
    if ('largePayment' in p) next.largePayment = line(p.largePayment, 'large payment');
    if (p.statements !== undefined) next.statements = Boolean(p.statements);
    next.seenUpTo = (s.universe.transactions as LedgerTransaction[]).length;
    person.alerts = next;
    return { alerts: next };
  });
}
