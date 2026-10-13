/**
 * SLATE — an account's life: savings and term deposits over time, and what
 * happens to an account nobody uses (module 7 of `docs/BANKING-FUNCTIONS.md`).
 *
 * From each bank's own terms (`content/accountlife.ts`):
 *
 * - **A term deposit's end** (B7, B41): the bank writes before it, and at it
 *   the deposit does what its holder told the bank, among what the bank
 *   allows and with the notice it needs, or else the bank's default: renews
 *   for the same term at the bank's rate, with any days' grace to take the
 *   money without penalty; moves into the bank's easy-access savings; or is
 *   paid out.
 * - **Breaking one early** (B16): for the bank's penalty in days of interest
 *   where it states it so (the US's and Britain's banks), never more than
 *   the interest earned where the bank caps it there (Chase, NatWest, HSBC),
 *   and at least a week's interest in a term's first week where it says so;
 *   taken from the deposit itself if the interest won't cover it; where the bank words its
 *   penalty another way (a reduced rate in Japan, a rate cut in France, a
 *   share of the amount in Spain), the interest built so far is forfeited,
 *   SLATE's estimate, and the bank's own words are shown; where the bank
 *   doesn't allow it, it can't be, except in a grace window or a
 *   cooling-off period.
 * - **Interest taken during the term** (B18), where the bank allows it.
 * - **Savings withdrawals** (B12, B33): free up to the bank's number a month,
 *   and its fee for each after (Canada's banks, New Zealand's).
 * - **Round-ups** (B9): each debit card purchase rounded up to the next
 *   whole unit, or the bank's flat amount a purchase where its words say so
 *   (Wells Fargo's, from 2026-10-12), moved at the day's end to savings at
 *   the current account's bank (from 2026-10-12: savings at any bank until
 *   then), skipped on a day the current account is short, where the bank
 *   offers it.
 * - **An idle account** (A19, A20, B35): inactive after the bank's months,
 *   dormant after more, blocked until the holder uses it again, and earning
 *   nothing where the bank says so.
 * - **Unclaimed money** (A21): after the country's years untouched, the
 *   balance goes to the state or its scheme, and can be claimed back.
 * - **Changing one's mind** (A12, C6): a savings account, a term deposit or
 *   a card opened in the last 14 days (the country's cooling-off period)
 *   canceled, the deposit's money back in full; Britain's fixed-rate
 *   deposits excepted, as its rules except them.
 */

import type { Simulation } from '../core/simulation';
import { linkedTo } from './routing';
import { CommandError } from '../core/simulation';
import type { Person, RoundUpChoice } from '../domain/model';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { addMonths, formatDate, instantFromZoned, zonedParts, MS_DAY, type Instant } from '../core/time';
import { bankById } from '../content/banks';
import { ACCOUNT_LIFE, UNCLAIMED, type BankAccountLife, type TermEnd } from '../content/accountlife';
import { moveRoundUps, setRoundUps } from './roundups';
import { dropPaymentsFor, inSaveMoney, interestTaxFor, openOne, rateOn } from './banking';
import { savingsLeftThisMonth } from './cash';
import { lendingOf } from './lending';
import { ensurePrimary, stateOf } from './credit';
import { recordInterest } from './earnings';

/** The months to its end a term deposit was opened for. */
function termMonths(term: Account): number {
  if (term.maturesAt === undefined) return 12;
  return Math.max(1, Math.round((term.maturesAt - (term.renewedAt ?? term.openedAt)) / (30.44 * MS_DAY)));
}

function currentOf(sim: Simulation, person: Person): Account | undefined {
  return person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
}

function isoOfAccount(account: Account): string | undefined {
  return account.bankId ? bankById(account.bankId)?.iso : undefined;
}

/** What breaking a term deposit now would cost, or why it can't be broken. */
export function breakQuote(sim: Simulation, term: Account): { penalty: Money; estimate: boolean; refused?: string; words?: string } {
  const rules = term.bankId ? ACCOUNT_LIFE[term.bankId] : undefined;
  const earned = Math.floor(term.accrued ?? 0);
  // In its grace window after renewing, or its cooling-off period, it comes out whole.
  if ((term.graceUntil !== undefined && sim.now <= term.graceUntil) || inCoolingOff(sim, term)) return { penalty: 0, estimate: false };
  if (rules?.early === false) return { penalty: 0, estimate: false, refused: `${term.institution ?? 'The bank'} doesn’t let a term deposit be broken before its end.`, ...(rules.penaltyWords ? { words: rules.penaltyWords } : {}) };
  if (rules?.penaltyDays) {
    const months = termMonths(term);
    const band = rules.penaltyDays.find((one) => one.underMonths === undefined || months < one.underMonths) ?? rules.penaltyDays.at(-1)!;
    const daysOf = (days: number) => Math.round(Math.max(0, term.balance) * (term.fixedRate ?? 0) * days / 365);
    let penalty = daysOf(band.days);
    if (rules.penaltyCapped) penalty = Math.min(penalty, earned);
    // In the term's first week, a week's interest at least, whatever the cap.
    if (rules.penaltyFirstWeekDays && sim.now - (term.renewedAt ?? term.openedAt) < 7 * MS_DAY) penalty = Math.max(penalty, daysOf(rules.penaltyFirstWeekDays));
    return { penalty, estimate: false, ...(rules.penaltyWords ? { words: rules.penaltyWords } : {}) };
  }
  const early = term.bankId ? EARLY_RATE[term.bankId] : undefined;
  if (early) {
    const bank = bankById(term.bankId!)!;
    const ordinary = rateOn(bank.savings, sim.now, sim.homeZone);
    const from = term.renewedAt ?? term.openedAt;
    const months = (sim.now - from) / (30.4375 * MS_DAY);
    const rate = months < early.underMonths ? ordinary : Math.max(ordinary, (term.fixedRate ?? 0) * early.share);
    const paid = Math.round(Math.max(0, term.balance) * rate * ((sim.now - from) / MS_DAY) / 365);
    return { penalty: Math.max(0, earned - paid), estimate: false, ...(rules?.penaltyWords ? { words: rules.penaltyWords } : {}) };
  }
  // Worded another way, or not found: the interest so far is forfeited, SLATE's estimate.
  return { penalty: earned, estimate: true, ...(rules?.penaltyWords ? { words: rules.penaltyWords } : {}) };
}

/** Whether an account or card is still within its country's cooling-off period. */
export function inCoolingOff(sim: Simulation, account: Account): boolean {
  const iso = isoOfAccount(account);
  const days = iso ? UNCLAIMED[iso]?.coolingOffDays : undefined;
  if (days === undefined) return false;
  // Britain's rules except fixed-rate deposits.
  if (iso === 'GB' && account.category === 'term') return false;
  return sim.now - account.openedAt <= days * MS_DAY;
}

/**
 * Withdrawals from savings this month, for the bank's free count: every
 * payment out, not the bank's own interest tax or fees. Until 2026-09-27 it
 * counted only a move by hand, in the clock's zone rather than the bank's
 * month, and a payment the linked savings made was never counted or charged.
 */
function withdrawalsThisMonth(sim: Simulation, account: Account): number {
  const p = zonedParts(sim.now, sim.homeZone);
  const since = instantFromZoned({ year: p.year, month: p.month, day: 1, hour: 0 }, sim.homeZone);
  let n = 0;
  const list = sim.universe.transactions;
  for (let i = list.length - 1; i >= 0 && list[i]!.at >= since; i -= 1) {
    const t = list[i]!;
    if (t.category !== 'interest' && t.category !== 'bank_fee' && t.postings.some((q) => q.accountId === account.id && q.amount < 0)) n += 1;
  }
  return n;
}

/** The fee a withdrawal from savings costs now, past the bank's free ones a month (B12, B33). */
export function savingsWithdrawalFee(sim: Simulation, account: Account): Money {
  if (account.kind !== 'savings' || account.category === 'term' || !account.bankId) return 0;
  const rules = ACCOUNT_LIFE[account.bankId];
  if (rules?.freeWithdrawals === undefined || !rules.withdrawalFee) return 0;
  // In the save's money: until 2026-09-27 a Canadian or New Zealand fee was taken in the bank's own hundredths.
  return withdrawalsThisMonth(sim, account) >= rules.freeWithdrawals ? inSaveMoney(sim, rules.withdrawalFee, bankById(account.bankId)!.currency) : 0;
}

/**
 * What can come out of easy-access savings now, and what the next
 * withdrawal costs: the balance less the fee, and no more than Germany's
 * monthly allowance without notice. Every way money leaves savings reads
 * it: a move by hand, the linked sweep, a scheduled payment, the card paid
 * from the bank.
 */
export function savingsDebit(sim: Simulation, account: Account): { room: Money; fee: Money } {
  const fee = savingsWithdrawalFee(sim, account);
  const left = savingsLeftThisMonth(sim, account);
  return { room: Math.max(0, Math.min(account.balance - fee, left ?? Infinity)), fee };
}

/**
 * The days' notice a bank needs before it closes a term deposit early, where
 * its terms ask for it: NatWest's Fixed Term Savings, 35 (its own words are
 * kept in `penaltyWords`). Until 2026-09-27 SLATE broke it at once.
 */
export const BREAK_NOTICE: Readonly<Record<string, number>> = { 'gb-natwest': 35 };

/**
 * A bank whose early rate is a rule rather than days of interest: MUFG's
 * 期限前解約利率 pays the ordinary deposit's rate on a time deposit broken in
 * its first six months, and 70% of the posted rate for the time it's run
 * after, never less than the ordinary rate (bk.mufg.jp, スーパー定期 rules,
 * 12 September 2022). SLATE carries only the twelve-month rate and takes it
 * for the six-month one. Until 2026-09-28 MUFG's term forfeited all its
 * interest, as a bank's whose rule wasn't read does.
 */
export const EARLY_RATE: Readonly<Record<string, { underMonths: number; share: number }>> = { 'jp-mufg': { underMonths: 6, share: 0.7 } };

/** A term deposit broken now: the penalty from its interest, and from the deposit where that won't cover it. */
function breakTerm(s: Simulation, person: Person, term: Account): { paid: Money; penalty: Money } {
  const quote = breakQuote(s, term);
  const into = currentOf(s, person)!;
  const earned = Math.floor(term.accrued ?? 0);
  const kept = Math.max(0, earned - quote.penalty);
  const fromPrincipal = Math.max(0, quote.penalty - earned);
  const tax = interestTaxFor(s, term, kept);
  const paid = term.balance - fromPrincipal + kept - tax;
  const postings = [
    { accountId: into.id, amount: paid },
    { accountId: term.id, amount: -term.balance },
  ];
  if (kept > 0) postings.push({ accountId: s.nominalAccount('income', 'Interest').id, amount: -kept });
  if (tax > 0) postings.push({ accountId: s.nominalAccount('expense', 'Tax On Interest').id, amount: tax });
  if (fromPrincipal > 0) postings.push({ accountId: s.nominalAccount('expense', 'Early Withdrawal Penalty').id, amount: fromPrincipal });
  s.post({ memo: `${term.name} broken early`, category: kept > 0 ? 'interest' : 'transfer', postings });
  term.accrued = 0;
  term.closedAt = s.now;
  delete term.breakAt;
  return { paid, penalty: quote.penalty };
}

export function registerAccountLife(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'bank.account_life', (_event, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) {
      // Round-ups, by the bank's own rule (`systems/roundups.ts`, from 2026-10-13): until then the day's change moved
      // every night at every bank, into easy-access savings at the current account's bank (from 2026-10-12; the first
      // savings found at any bank before), and stayed in the current account on a day it was short.
      moveRoundUps(s, person);
      for (const account of Object.values(s.universe.accounts)) {
        if (account.ownerId !== person.id || account.closedAt || !account.bankId) continue;
        const rules = ACCOUNT_LIFE[account.bankId];
        // An early close on notice, once the notice has run.
        if (account.category === 'term' && account.breakAt !== undefined && account.breakAt <= s.now && currentOf(s, person)) {
          const done = breakTerm(s, person, account);
          if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: `Your ${account.name} Closed`, body: `On the notice given: ${formatMoney(done.paid, saveCurrency(s.universe))} to your current account, less ${formatMoney(done.penalty, saveCurrency(s.universe))} for closing early.`, importance: 50, route: '/workspace/bank' });
          continue;
        }
        // A term deposit's end: the bank writes a month before, or in time
        // for any notice it needs to change what happens (B41).
        if (account.category === 'term' && account.maturesAt !== undefined && rules?.atEnd && !account.maturityNoticed && account.maturesAt - s.now <= noticeLead(rules) * MS_DAY) {
          account.maturityNoticed = true;
          if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: `Your ${account.name} Ends Soon`, body: `On ${formatDate(account.maturesAt, s.zone)} it ${END_WORDS[termEndOf(account)]}.${(rules.endChoices?.length ?? 0) > 1 ? ` You can change that${rules.endNoticeDays ? ` until ${rules.endNoticeDays} days before` : ''}.` : ''}${rules.graceDays && termEndOf(account) === 'renews' ? ` After it renews you have ${rules.graceDays} days to take the money without a penalty.` : ''}`, importance: 45, route: '/workspace/bank' });
        }
      }
    }
  });

  sim.onCommand<{ accountId: string; atEnd: TermEnd }, { atEnd: TermEnd }>('bank.set_term_end', (p, { sim: s }) => {
    const term = s.universe.accounts[p.accountId];
    if (!term || term.ownerId !== s.player.id || term.closedAt || term.category !== 'term') throw new CommandError('That isn’t one of your term deposits.');
    const rules = ACCOUNT_LIFE[term.bankId ?? ''];
    const choices = rules?.endChoices ?? ['paid_out'];
    if (!choices.includes(p.atEnd)) throw new CommandError(`${term.institution ?? 'The bank'} doesn’t let a term deposit end that way.`);
    const notice = rules?.endNoticeDays ?? 0;
    if (term.maturesAt !== undefined && term.maturesAt - s.now < notice * MS_DAY) throw new CommandError(`${term.institution ?? 'The bank'} needs ${notice} days’ notice before the end to change it.`);
    if (p.atEnd === (rules?.atEnd ?? 'paid_out')) delete term.atEnd;
    else term.atEnd = p.atEnd;
    return { atEnd: p.atEnd };
  });

  sim.onCommand<{ accountId: string }, { paid: Money; penalty: Money; at?: Instant }>('bank.break_term', (p, { sim: s }) => {
    const person = s.player;
    const term = s.universe.accounts[p.accountId];
    if (!term || term.ownerId !== person.id || term.closedAt || term.category !== 'term') throw new CommandError('That isn’t one of your term deposits.');
    const quote = breakQuote(s, term);
    if (quote.refused) throw new CommandError(quote.refused);
    if (!currentOf(s, person)) throw new CommandError('You need a current account for the money.');
    // A bank that needs notice closes it when the notice has run, at the penalty then.
    const notice = BREAK_NOTICE[term.bankId ?? ''];
    if (notice) {
      if (term.breakAt !== undefined) throw new CommandError(`It closes on ${formatDate(term.breakAt, s.zone)}, on the notice given.`);
      term.breakAt = s.now + notice * MS_DAY;
      return { paid: 0, penalty: quote.penalty, at: term.breakAt };
    }
    return breakTerm(s, person, term);
  });

  sim.onCommand<{ accountId: string }, { paid: Money }>('bank.take_term_interest', (p, { sim: s }) => {
    const person = s.player;
    const term = s.universe.accounts[p.accountId];
    if (!term || term.ownerId !== person.id || term.closedAt || term.category !== 'term') throw new CommandError('That isn’t one of your term deposits.');
    if (!ACCOUNT_LIFE[term.bankId ?? '']?.interestDuringTerm) throw new CommandError(`${term.institution ?? 'The bank'} pays a term deposit’s interest at its end.`);
    const earned = Math.floor(term.accrued ?? 0);
    const into = currentOf(s, person);
    if (earned <= 0 || !into) throw new CommandError('It hasn’t earned anything to take yet.');
    const tax = interestTaxFor(s, term, earned);
    const postings = [{ accountId: into.id, amount: earned - tax }, { accountId: s.nominalAccount('income', 'Interest').id, amount: -earned }];
    if (tax > 0) postings.push({ accountId: s.nominalAccount('expense', 'Tax On Interest').id, amount: tax });
    s.post({ memo: `Interest: ${term.name}`, category: 'interest', postings });
    term.accrued = (term.accrued ?? 0) - earned;
    recordInterest(person, s.now, s.homeZone, earned);
    return { paid: earned - tax };
  });

  sim.onCommand<{ on: boolean } & RoundUpChoice, { on: boolean }>('bank.set_round_ups', (p, { sim: s }) => setRoundUps(s, p));

  sim.onCommand<{ accountId: string }, { accountId: string }>('bank.reactivate', (p, { sim: s }) => {
    const account = s.universe.accounts[p.accountId];
    // A dormant account, or one the bank has written about before handing it to the state: getting in touch keeps it.
    if (!account || account.ownerId !== s.player.id || (!account.dormant && account.escheatWarned === undefined)) throw new CommandError('That account isn’t dormant.');
    delete account.dormant;
    delete account.inactive;
    delete account.escheatWarned;
    account.reactivatedAt = s.now;
    for (const d of Object.values(s.universe.decisions)) if (d.refType === 'unclaimed-notice' && d.refId === account.id && !d.resolvedAt) d.resolvedAt = s.now;
    return { accountId: account.id };
  });

  sim.onCommand<{ accountId: string }, { refunded: Money }>('bank.cancel_new', (p, { sim: s }) => {
    const person = s.player;
    const account = s.universe.accounts[p.accountId];
    if (!account || account.ownerId !== person.id || account.closedAt) throw new CommandError('That isn’t one of your accounts.');
    if (!inCoolingOff(s, account)) throw new CommandError('Its cooling-off period has passed, or there isn’t one here for it.');
    const into = currentOf(s, person);
    if (account.kind === 'credit_card') {
      // Canceled, with anything spent still to repay (C6).
      if (!person.credit) throw new CommandError('You don’t have a card.');
      stateOf(person, account).closing = s.now;
      if (account.balance >= 0) { account.closedAt = s.now; ensurePrimary(s, person); }
      return { refunded: 0 };
    }
    if (!into || into.id === account.id) throw new CommandError('Your primary current account can’t be canceled. Make another primary first.');
    // A current account canceled like any close: nothing may still use it (from 2026-10-10, `linkedTo`). A savings
    // account's orders into it go with it, as they always have (`dropPaymentsFor`).
    const links = account.kind === 'checking' ? linkedTo(s, person, account.id) : [];
    if (links.length > 0) throw new CommandError(`${links.join('. ')}. Move ${links.length === 1 ? 'it' : 'them'} first.`);
    // The deposit's money back whole: no interest, no penalty.
    const back = Math.max(0, account.balance);
    if (back > 0) s.post({ memo: `${account.name} canceled`, category: 'transfer', postings: [{ accountId: account.id, amount: -back }, { accountId: into.id, amount: back }] });
    account.accrued = 0;
    account.closedAt = s.now;
    dropPaymentsFor(s, person, account);
    return { refunded: back };
  });

  sim.onCommand<Record<string, never>, { claimed: Money }>('bank.claim_unclaimed', (_p, { sim: s }) => {
    const person = s.player;
    const held = person.unclaimed ?? [];
    const into = currentOf(s, person);
    if (held.length === 0 || !into) throw new CommandError('No money of yours is held as unclaimed.');
    let claimed = 0;
    for (const one of held) {
      s.post({ memo: `Unclaimed money returned from ${one.to}`, category: 'transfer', postings: [{ accountId: s.nominalAccount('liability_other', 'Unclaimed Money').id, amount: -one.amount }, { accountId: into.id, amount: one.amount }] });
      claimed += one.amount;
    }
    person.unclaimed = [];
    return { claimed };
  });
}

/**
 * How far ahead a bank writes before it hands an untouched balance to the
 * state: the US Revised Uniform Unclaimed Property Act asks for a notice 60
 * to 120 days before the report, and states that adopt it keep the window.
 * SLATE writes at 90, inside it, for every country, where the rest publish
 * no single figure. Until 2026-09-28 nothing was written, and a wealthy
 * student's untouched savings went to the state without a word beforehand.
 */
export const ESCHEAT_NOTICE_DAYS = 90;

/**
 * At a month's end, for each of a person's accounts: dormant or inactive by
 * the bank's months untouched, and after the country's years, the balance
 * gone to the state or its scheme.
 */
export function idleAccounts(sim: Simulation, person: Person, lastUsed: (account: Account) => Instant): void {
  for (const account of Object.values(sim.universe.accounts)) {
    if (account.ownerId !== person.id || account.closedAt || !account.bankId || (account.kind !== 'checking' && account.kind !== 'savings') || account.category === 'term') continue;
    const rules = ACCOUNT_LIFE[account.bankId];
    const idle = sim.now - Math.max(lastUsed(account), account.reactivatedAt ?? 0);
    const month = 30.44 * MS_DAY;
    if (rules?.inactiveMonths !== undefined) account.inactive = idle >= rules.inactiveMonths * month;
    if (rules?.dormantMonths !== undefined && idle >= rules.dormantMonths * month && !account.dormant) {
      account.dormant = true;
      if (person.id === sim.universe.playerId) sim.notify({ category: 'bank', title: `${account.name} Is Dormant`, body: `Untouched for ${rules.dormantMonths} months. ${account.institution ?? 'The bank'} has blocked it until you use it again.`, importance: 55, route: '/workspace/bank' });
    }
    const iso = bankById(account.bankId)?.iso;
    const law = iso ? UNCLAIMED[iso] : undefined;
    // The years guard also narrows the type; without it NaN compares false the same.
    // The bank writes first: the balance goes to the state unless the holder gets in touch.
    const due = law?.years !== undefined ? law.years * 365.25 * MS_DAY : Infinity;
    if (law && account.escheatWarned === undefined && idle >= due - ESCHEAT_NOTICE_DAYS * MS_DAY && idle < due && account.balance > 0 && account.id !== person.primaryAccountId) {
      account.escheatWarned = sim.now;
      if (person.id === sim.universe.playerId) {
        const by = sim.now + (due - idle);
        sim.requireDecision({
          urgency: 85, category: 'bank', title: `${account.institution ?? 'Your Bank'} Is About To Hand ${account.name} To The State`,
          detail: `${formatMoney(account.balance, saveCurrency(sim.universe))} in ${account.name} has been untouched for nearly ${law.years} years. Unless you get in touch by ${formatDate(by, sim.zone)}, it goes to ${law.to ?? 'the state'} as unclaimed money.`,
          route: '/workspace/bank', dueAt: by, refType: 'unclaimed-notice', refId: account.id,
          actions: [{ label: 'Keep The Account', commandKind: 'bank.reactivate', payload: { accountId: account.id } }],
        });
      }
    }
    if (law?.years !== undefined && idle >= law.years * 365.25 * MS_DAY && account.balance > 0 && account.id !== person.primaryAccountId) {
      const amount = account.balance;
      sim.post({ memo: `Unclaimed, to ${law.to ?? 'the state'}`, category: 'transfer', postings: [{ accountId: account.id, amount: -amount }, { accountId: sim.nominalAccount('liability_other', 'Unclaimed Money').id, amount }] });
      account.closedAt = sim.now;
      dropPaymentsFor(sim, person, account);
      person.unclaimed = [...(person.unclaimed ?? []), { amount, to: law.to ?? 'the state', at: sim.now }];
      if (person.id === sim.universe.playerId) sim.notify({ category: 'bank', title: 'Unclaimed Money', body: `${formatMoney(amount, saveCurrency(sim.universe))} left untouched in ${account.name} for ${law.years} years went to ${law.to ?? 'the state'}. ${law.claimBack ?? ''}`, importance: 60, route: '/workspace/bank' });
    }
  }
}

/** What a term deposit will do at its end: its holder's instruction, or the bank's default, or paid out where the bank's isn't known. */
export function termEndOf(term: Account): TermEnd {
  return term.atEnd ?? (term.bankId ? ACCOUNT_LIFE[term.bankId]?.atEnd : undefined) ?? 'paid_out';
}

export const END_WORDS: Record<TermEnd, string> = {
  renews: 'renews for the same term at the bank’s rate on the day',
  savings: 'moves, with its interest, into the bank’s easy-access savings',
  paid_out: 'is paid, with its interest, into your current account',
};

/** Days before a term deposit's end the bank writes: a month, or two weeks more than any notice it needs. */
function noticeLead(rules: BankAccountLife): number {
  return Math.max(30, (rules.endNoticeDays ?? 0) + 14);
}

/** The interest a term deposit built, credited to it after tax, at its end. */
function creditInterest(sim: Simulation, term: Account, memo: string): void {
  const earned = Math.floor(term.accrued ?? 0);
  const tax = interestTaxFor(sim, term, earned);
  if (earned > 0) {
    const postings = [{ accountId: term.id, amount: earned - tax }, { accountId: sim.nominalAccount('income', 'Interest').id, amount: -earned }];
    if (tax > 0) postings.push({ accountId: sim.nominalAccount('expense', 'Tax On Interest').id, amount: tax });
    sim.post({ memo, category: 'interest', postings });
  }
  term.accrued = 0;
}

/**
 * A term deposit at its end, where it doesn't pay out (B7): renewed for the
 * same term at the bank's rate on the day, or moved into the bank's
 * easy-access savings, opened for it if the holder has none there. Returns
 * what it did, or 'paid_out' for the caller to pay it out.
 */
export function endTerm(sim: Simulation, person: Person, term: Account): TermEnd {
  const end = termEndOf(term);
  if (end === 'paid_out' || term.maturesAt === undefined) return 'paid_out';
  const bank = bankById(term.bankId!);
  if (!bank) return 'paid_out';
  const rules = ACCOUNT_LIFE[bank.id];
  if (end === 'savings') {
    creditInterest(sim, term, `Interest: ${term.name}`);
    const savings = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.kind === 'savings' && a.category !== 'term' && !a.closedAt && a.bankId === bank.id)
      ?? openOne(sim, person, bank, 'savings', 0);
    sim.post({ memo: `${term.name} ended, into ${savings.name}`, category: 'transfer', postings: [{ accountId: term.id, amount: -term.balance }, { accountId: savings.id, amount: term.balance }] });
    term.closedAt = sim.now;
    return 'savings';
  }
  const offer = lendingOf(bank).term;
  const months = termMonths(term);
  // Principal and interest reinvested, at the bank's rate on the day.
  creditInterest(sim, term, `Interest: ${term.name}, reinvested`);
  // Its opening day stays. A draft moved it, and a renewed deposit at a bank
  // with no grace days, AIB's, could be broken free for a fortnight after
  // every renewal as if new.
  term.renewedAt = sim.now;
  term.maturesAt = addMonths(sim.now, months, sim.homeZone);
  if (offer?.rate !== undefined) term.fixedRate = offer.rate;
  term.maturityNoticed = false;
  if (rules?.graceDays) term.graceUntil = sim.now + rules.graceDays * MS_DAY;
  return 'renews';
}
