/**
 * SLATE — what the holder does with the card over its life (module 4 of
 * `docs/BANKING-FUNCTIONS.md`).
 *
 * - **Apply** for the bank's card (C1, C2, C4, C5): the bank reads the record
 *   and what the applicant has to repay from, sets a limit, and the card
 *   arrives in a week. A US applicant under 21 needs means of their own,
 *   which money in the bank is. The score a bank approves at and the limits
 *   it sets are SLATE's estimates; no bank publishes them.
 * - **Apply with a balance transfer** (C31) from a card at another bank, the
 *   old card taking nothing new until the new one arrives and the balance
 *   moves (`systems/cardoffers.ts`).
 * - **Close** it (C10): nothing new goes on it, and what's owed is paid down
 *   and then it's closed.
 * - **Move the statement day** (C25), which moves the due date with it.
 * - **Ask for a higher limit or a lower one** (C79, C80), and ask the bank
 *   never to raise it unasked (C79).
 * - **Opt in to going over the limit** (US, C60), and out again.
 * - **Ask for help** (C76): a hardship plan that freezes the interest and sets
 *   a payment that clears the card in four years, with the card suspended
 *   until it's paid (SLATE's estimate of such a plan's shape).
 *
 * The bank's side of it, the suspension, the default and the charge-off,
 * persistent debt and the fee caps, is in `systems/credit.ts`.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY } from '../core/time';
import { exchange } from '../content/currency';
import { bankById } from '../content/banks';
import { CARDS } from '../content/cards';
import { ageOn } from './mortality';
import { inTheBank } from './household';
import { cardOf, cardTerms, scheduleStatement, STATEMENT_KIND } from './credit';
import { transferOnArrival, transferRefusal } from './cardoffers';
import { last4For } from './security';
import { bankOf } from './banking';

export const ARRIVES_KIND = 'card.arrives';

/** The least record a bank approves a card at: SLATE's estimate. */
const APPROVE_FROM = 620;
/** The limit a record opens with, in US dollars: SLATE's estimate. */
const OPENING_LIMITS: readonly { from: number; usd: number }[] = [{ from: 740, usd: 5_000 }, { from: 670, usd: 2_500 }, { from: 0, usd: 1_000 }];
/** What an application costs the record, a hard inquiry: SLATE's estimate, FICO's "fewer than five points" for most. */
const INQUIRY = 5;
/** How long a new card takes to arrive: SLATE's estimate. */
const ARRIVES_IN = 7 * MS_DAY;
/** A requested raise the bank grants at most, as a share of the limit: the six-monthly review's fifth. */
const RAISE_SHARE = 1.2;

/** The limit a record opens a card with. */
export function limitFor(sim: Simulation, score: number): Money {
  const band = OPENING_LIMITS.find((one) => score >= one.from)!;
  return Math.round(usd(sim, band.usd) / 100) * 100;
}

function usd(sim: Simulation, dollars: number): Money {
  return exchange(dollars * 100, 'USD', saveCurrency(sim.universe)) ?? dollars * 100;
}

export function registerCardLife(sim: Simulation): void {
  sim.onSchedule(ARRIVES_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const applied = person?.credit?.applied;
    if (!person || !applied) return;
    const bank = bankById(applied.bankId);
    const product = bank ? CARDS[bank.id] : undefined;
    const name = product && !('none' in product) ? product.name : (bank?.name ?? 'Bank') + ' Credit Card';
    const old = applied.transfer ? cardOf(s, person) : undefined;
    const card = s.openAccount({ id: s.nextId('account'), kind: 'credit_card', name, ownerId: person.id, institution: bank?.name, bankId: bank?.id, openedAt: s.now, creditLimit: applied.limit });
    // The last four the bank prints on it, from the account's own number in the books.
    card.last4 = last4For(card.id);
    // A new card starts clean: the old one's closing, suspension, plan, missed payments and penalty were its own.
    const fresh = person.credit!;
    delete fresh.applied;
    delete fresh.closing;
    delete fresh.suspended;
    delete fresh.hardship;
    delete fresh.penalty;
    fresh.missed = 0;
    fresh.accrued = 0;
    fresh.trailing = 0;
    fresh.cashOwed = 0;
    fresh.cashAccrued = 0;
    fresh.transfers = [];
    fresh.plans = [];
    fresh.statementPlanDue = 0;
    fresh.rewards = 0;
    delete fresh.rewardsFrom;
    delete fresh.introLost;
    const terms = cardTerms(s, card, person.credit!.score);
    // The rate the record buys today, held from here on.
    card.apr = terms.priced;
    person.credit!.statementBalance = 0;
    person.credit!.paidSinceStatement = 0;
    person.credit!.carrying = false;
    if (terms.kind === 'charge') person.credit!.autopay = 'full';
    if (old) transferOnArrival(s, person, card, old);
    const armed = s.universe.scheduled.some((one) => one.kind === STATEMENT_KIND && one.status === 'pending' && one.payload.personId === person.id);
    if (!armed) scheduleStatement(s, person, s.now);
    if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: 'Your New Card Arrived', body: `The ${name}, with a ${formatMoney(applied.limit, saveCurrency(s.universe))} limit.`, importance: 50, route: '/workspace/bank' });
  });

  sim.onCommand<{ transfer?: boolean }, { approved: boolean; limit?: Money }>('card.apply', (p, { sim: s }) => {
    const person = s.player;
    const credit = person.credit;
    if (!credit) throw new CommandError('You have no credit record to apply with.');
    if (credit.applied) throw new CommandError('A card is already on its way.');
    const bank = bankOf(s, person);
    if (!bank) throw new CommandError('You need a bank to apply to.');
    const product = CARDS[bank.id];
    if (product && 'none' in product) throw new CommandError(`${bank.name} doesn’t issue a credit card.`);
    // A card held already stays the only one, unless its balance moves onto the new one (C31).
    const transfer = Boolean(p?.transfer);
    if (cardOf(s, person) && !transfer) throw new CommandError('You have a card already; close it first, or move its balance onto the new one.');
    if (transfer) {
      const refused = transferRefusal(s, person, bank.id, limitFor(s, Math.max(300, credit.score - INQUIRY)));
      if (refused) throw new CommandError(refused);
    }
    // A hard inquiry, approved or not.
    credit.score = Math.max(300, credit.score - INQUIRY);
    const cur = saveCurrency(s.universe);
    const means = inTheBank(s, person);
    const collections = Object.values(s.universe.accounts).some((a) => a.ownerId === person.id && !a.closedAt && a.category === 'collections' && a.balance < 0);
    const age = ageOn(s, person, s.now);
    let reason = '';
    if (credit.score < APPROVE_FROM) reason = 'your record isn’t strong enough';
    else if (collections) reason = 'you have a debt in collections';
    else if (means <= 0) reason = bank.iso === 'US' && age < 21 ? 'under 21 you need income or money of your own' : 'you have nothing to repay it from';
    if (reason) {
      s.notify({ category: 'bank', title: 'Card Application Declined', body: `${bank.name} said no: ${reason}.`, importance: 50 });
      return { approved: false };
    }
    const limit = limitFor(s, credit.score);
    credit.applied = { bankId: bank.id, arrivesAt: s.now + ARRIVES_IN, limit, ...(transfer ? { transfer: true } : {}) };
    // The old card takes nothing new while the balance waits to move.
    if (transfer) credit.closing = s.now;
    s.schedule({ at: credit.applied.arrivesAt, kind: ARRIVES_KIND, label: 'Your New Card Arrives', category: 'home', priority: 38, payload: { personId: person.id } });
    s.notify({ category: 'bank', title: 'Card Approved', body: `${bank.name} approved a card with a ${formatMoney(limit, cur)} limit. It arrives in a week.`, importance: 50 });
    return { approved: true, limit };
  });

  sim.onCommand<Record<string, never>, { closing: boolean }>('card.close', (_p, { sim: s }) => {
    const person = s.player;
    const card = cardOf(s, person);
    if (!card || !person.credit) throw new CommandError('You don’t have a card.');
    if (person.credit.closing !== undefined) throw new CommandError('It’s already being closed.');
    person.credit.closing = s.now;
    if (card.balance >= 0) card.closedAt = s.now;
    return { closing: true };
  });

  sim.onCommand<{ day: number }, { day: number }>('card.set_statement_day', (p, { sim: s }) => {
    const person = s.player;
    if (!cardOf(s, person) || !person.credit) throw new CommandError('You don’t have a card.');
    const day = Math.round(Number(p.day));
    if (!(day >= 1 && day <= 28)) throw new CommandError('Pick a day from the 1st to the 28th.');
    person.credit.statementDay = day;
    for (const item of s.universe.scheduled) {
      if (item.kind === STATEMENT_KIND && item.status === 'pending' && item.payload.personId === person.id) s.timeline.cancel(item.id, s.now);
    }
    scheduleStatement(s, person, s.now);
    return { day };
  });

  sim.onCommand<{ limit: Money }, { limit: Money; granted: boolean }>('card.request_limit', (p, { sim: s }) => {
    const person = s.player;
    const card = cardOf(s, person);
    const credit = person.credit;
    if (!card || !credit) throw new CommandError('You don’t have a card.');
    const want = Math.round(Number(p.limit));
    const now = card.creditLimit ?? 0;
    if (!(want > 0) || want === now) throw new CommandError('Say the limit you want.');
    const cur = saveCurrency(s.universe);
    if (want < now) {
      // A lower limit is always granted, never under what's owed.
      const owed = Math.max(0, -card.balance);
      card.creditLimit = Math.max(want, owed);
      return { limit: card.creditLimit, granted: true };
    }
    const clean = !credit.late.some((when) => s.now - when < 365 * 86_400_000);
    if (credit.score < 700 || !clean || credit.suspended || inTheBank(s, person) <= 0) {
      s.notify({ category: 'bank', title: 'Limit Increase Declined', body: `The bank kept the limit at ${formatMoney(now, cur)}: it raises one for a record of 700 or more, nothing late in a year, and means to repay.`, importance: 40 });
      return { limit: now, granted: false };
    }
    card.creditLimit = Math.min(want, Math.round(now * RAISE_SHARE / 100) * 100);
    return { limit: card.creditLimit, granted: true };
  });

  sim.onCommand<{ on: boolean }, { on: boolean }>('card.set_auto_raise', (p, { sim: s }) => {
    if (!s.player.credit) throw new CommandError('You don’t have a card.');
    s.player.credit.noAutoRaise = !p.on;
    return { on: Boolean(p.on) };
  });

  sim.onCommand<{ on: boolean }, { on: boolean }>('card.set_over_limit', (p, { sim: s }) => {
    const person = s.player;
    const card = cardOf(s, person);
    if (!card || !person.credit) throw new CommandError('You don’t have a card.');
    if (bankById(card.bankId ?? '')?.iso !== 'US') throw new CommandError('Opting in to going over the limit is a US card’s choice.');
    person.credit.overLimitOptIn = Boolean(p.on);
    if (!p.on) person.credit.overLimitCycles = 0;
    return { on: Boolean(p.on) };
  });

  sim.onCommand<Record<string, never>, { payment: Money }>('card.request_hardship', (_p, { sim: s }) => {
    const person = s.player;
    const card = cardOf(s, person);
    const credit = person.credit;
    if (!card || !credit) throw new CommandError('You don’t have a card.');
    if (credit.hardship) throw new CommandError('You’re on a plan already.');
    const owed = Math.max(0, -card.balance);
    if (owed === 0) throw new CommandError('The card owes nothing.');
    credit.hardship = { payment: Math.ceil(owed / 48 / 100) * 100, since: s.now };
    credit.suspended = 'hardship';
    return { payment: credit.hardship.payment };
  });
}

/** A card on its way's arrival, for a save opened again. */
export function armCardLife(sim: Simulation): void {
  const person = sim.universe.people[sim.universe.playerId];
  const applied = person?.credit?.applied;
  if (!person || !applied) return;
  const armed = sim.universe.scheduled.some((one) => one.kind === ARRIVES_KIND && one.status === 'pending' && one.payload.personId === person.id);
  if (!armed) sim.schedule({ at: Math.max(applied.arrivesAt, sim.now + 60_000), kind: ARRIVES_KIND, label: 'Your New Card Arrives', category: 'home', priority: 38, payload: { personId: person.id } });
}
