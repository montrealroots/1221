/**
 * SLATE — what happens to money that is sitting still.
 *
 * `content/banking.ts` says what the rates are and why they are ours. This is
 * the part that posts, and it does four things, each of which exists because a
 * twenty-five-year measurement found its absence:
 *
 *   1. **A deposit earns.** Money left in a savings or deposit account is worth
 *      more next month. Before this, a savings account was a number written once
 *      at character creation and never touched again in a quarter of a century.
 *   2. **A card is charged.** The rate was on the account from the first save
 *      this game ever wrote and nothing ever applied it, so a balance carried
 *      from before the game started was still exactly itself twenty-five years
 *      later. It is not any more.
 *   3. **Money can be moved.** `life.transfer` is the only way to get money from
 *      one account a person owns into another, which is also the only way to pay
 *      the card down, which is what makes 2 a decision rather than a leak.
 *   4. **Income tax falls due.** `content/tax.ts` has been real, correct and
 *      entirely unwired for the whole of this project — a table nobody was ever
 *      charged from. It is the missing outflow: the parents' accounts took three
 *      and four hundred postings across a career and every single one was money
 *      going in.
 *
 * ## The rule this file is written to
 *
 * **Interest is posted, never assigned.** Every figure here becomes a
 * transaction with two sides, so a balance is still the sum of its postings and
 * `ledger.audit()` still has an opinion about it. The cheap version of this file
 * would add a percent to a balance in place, and the ledger would have no record
 * of where the money came from — which is the one thing this engine is built not
 * to allow.
 *
 * **And it charges the world, not the player.** Everybody in the save with an
 * account gets the same treatment on the same day: the parents earn on their
 * deposits and pay tax on their board pay exactly as the player does. A rule
 * that applied only to the player would be a scoreboard rule rather than a fact
 * about the world, and the difference shows the moment somebody opens the
 * parents' accounts and finds them behaving differently.
 */

import type { Simulation } from '../core/simulation';
import type { Id, Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { isLiability } from '../core/ledger';
import type { Money } from '../core/money';
import { formatMoney } from '../core/money';
import type { Instant } from '../core/time';
import { instantFromZoned, zonedParts } from '../core/time';
import { CommandError } from '../core/simulation';
import { computeAnnualTax } from '../content/tax';
import {
  CARD_A_YEAR, CARD_LEAST_A_MONTH, CARD_LEAST_FLOOR,
  DEPOSIT_A_YEAR, INCOME_TAX_MEMO, INTEREST_CHARGED_MEMO,
  INTEREST_EARNED_MEMO, PERSONAL_RETURN_MONTH, TRANSFER_MEMO,
} from '../content/banking';

export const BANK_MONTH_KIND = 'bank.month';
export const BANK_RETURN_KIND = 'bank.return';

/** A month of a yearly rate. Twelfths, because the posting is monthly. */
const aMonthOf = (aYear: number): number => aYear / 12;

/** What is owed on a liability, as a positive number. */
const owedOn = (account: Account): Money => (isLiability(account.kind) ? Math.max(0, -account.balance) : 0);

/** Every account somebody owns that holds real money. */
export function accountsOf(sim: Simulation, ownerId: Id): Account[] {
  return Object.values(sim.universe.accounts)
    .filter((one) => one.ownerId === ownerId && !one.nominal && !one.closedAt);
}

/**
 * What a card holder would be asked for this month.
 *
 * Nothing enforces it. It is here so the screen can say what a person in this
 * position is actually being asked for, which is a different and more useful
 * thing than the balance.
 */
export function leastOnTheCard(account: Account): Money {
  const owed = owedOn(account);
  if (owed <= 0) return 0;
  return Math.min(owed, Math.max(CARD_LEAST_FLOOR, Math.round(owed * CARD_LEAST_A_MONTH)));
}

/**
 * A month of interest, everywhere at once.
 *
 * Deposits first and the card second, on the same day, because a month is one
 * event and splitting it would let a player who watched the clock arbitrage the
 * gap between them.
 */
export function aMonthOfInterest(sim: Simulation): { earned: Money; charged: Money } {
  let earned = 0;
  let charged = 0;

  for (const account of Object.values(sim.universe.accounts)) {
    if (account.nominal || account.closedAt) continue;

    // What a deposit pays. A current account pays `CURRENT_ACCOUNT_A_YEAR`,
    // which is nought and says why in the content, so it is simply not here.
    if (account.kind === 'savings' && account.balance > 0) {
      const paid = Math.round(account.balance * aMonthOf(DEPOSIT_A_YEAR));
      if (paid > 0) {
        sim.income(account.id, paid, INTEREST_EARNED_MEMO, 'personal');
        earned += paid;
      }
    }

    // A COMPANY'S CASH DOES NOT EARN HERE, AND IT WAS BUILT AND THEN TAKEN OUT.
    //
    // It is true of the world — a group holding two point eight billion in an
    // operating account is earning on it or is being badly run — and it fails the
    // only test that matters. Measured over twenty-five played years at three
    // percent with a month of payroll left as a float: EUR 1.33bn of interest,
    // taking the group from EUR 2.81bn to EUR 4.11bn.
    //
    // Nothing decides differently because of it. The group was never going to run
    // out at either figure, the film company is carried either way, and the one
    // thing the number does reach is `stillToCarry` — the family's remaining
    // patience, which the greenlight door reads — so the only effect of the line
    // was to make the ceiling on what the pictures may commit to forty-seven
    // percent higher for a reason no player chose. A figure that moves and decides
    // nothing, attached to the largest balance in the save, is worse than no
    // figure: it inflates the one number the film economics hang off.
    //
    // The group's hoard is the real finding here and it is not a banking problem.
    // Two point eight billion sits there because SLATE has nothing for a cane
    // group to do with its profit — no acquisition, no dividend beyond the board's
    // pay, no reinvestment in the estate. The day there is something, the money
    // should go there rather than into a rate.

    // What a card costs. On what is owed, so paying it down is worth
    // something the month after and not only in the abstract.
    if (isLiability(account.kind)) {
      const owed = owedOn(account);
      const rate = account.apr ?? CARD_A_YEAR;
      const due = Math.round(owed * aMonthOf(rate));
      if (due > 0) {
        // A charge on a card makes the card MORE negative, which is a posting
        // against the liability rather than an expense out of it — the money
        // never touches a cash account, which is the whole trouble with a card.
        const cost = sim.nominalAccount('expense', INTEREST_CHARGED_MEMO);
        sim.post({
          memo: INTEREST_CHARGED_MEMO,
          category: 'personal',
          postings: [
            { accountId: account.id, amount: -due },
            { accountId: cost.id, amount: due },
          ],
        });
        charged += due;
      }
    }
  }

  return { earned, charged };
}

/**
 * Why money cannot be moved between these two accounts, or nothing if it can.
 *
 * Exported and asked before the offer, the same shape as every other refusal in
 * this build, so a screen can say what the answer will be rather than finding
 * out by being refused.
 */
export function whyNotTransfer(
  sim: Simulation, fromId: Id, toId: Id, cents: Money,
): string | undefined {
  const from = sim.universe.accounts[fromId];
  const to = sim.universe.accounts[toId];
  if (!from || from.nominal || from.closedAt) return 'There’s no such account to move it out of.';
  if (!to || to.nominal || to.closedAt) return 'There’s no such account to move it into.';
  if (from.id === to.id) return 'That’s the same account.';
  const me = sim.universe.playerId;
  if (from.ownerId !== me || to.ownerId !== me) {
    return 'You can only move money between accounts you hold.';
  }
  if (!Number.isInteger(cents) || cents <= 0) return 'Say how much, in whole cents.';
  // Out of a card is borrowing against it, which is a cash advance and a
  // different product with a different rate. Not modeled, so not offered.
  if (isLiability(from.kind)) return 'You can’t take money out of a card. Paying one down is the other way.';
  if (from.balance < cents) {
    return `That’s ${formatMoney(cents)} and there’s ${formatMoney(Math.max(0, from.balance))} in it.`;
  }
  // Into a card, only as far as what is owed. Overpaying a card is a thing
  // banks allow and a thing nobody wants, and it would leave money in a place
  // that earns nothing and cannot be spent.
  if (isLiability(to.kind) && cents > owedOn(to)) {
    return owedOn(to) === 0
      ? `${to.name} is clear — there’s nothing on it to pay.`
      : `Only ${formatMoney(owedOn(to))} is owed on ${to.name}.`;
  }
  return undefined;
}

/** Moves money between two accounts the player holds. */
export function transfer(
  sim: Simulation, fromId: Id, toId: Id, cents: Money,
): { ok: boolean; error?: string } {
  const no = whyNotTransfer(sim, fromId, toId, cents);
  if (no) return { ok: false, error: no };
  const from = sim.universe.accounts[fromId]!;
  const to = sim.universe.accounts[toId]!;

  // One transaction with two postings, not two transactions. A transfer is a
  // single fact about money and the ledger should not be able to hold half of it.
  sim.post({
    memo: `${TRANSFER_MEMO}: ${from.name} to ${to.name}`,
    category: 'personal',
    postings: [
      { accountId: from.id, amount: -cents },
      { accountId: to.id, amount: cents },
    ],
  });
  return { ok: true };
}

/**
 * What somebody earned in a year, off the ledger rather than off a stored total.
 *
 * Read from the postings, because the alternative is a running total somebody
 * has to remember to update and this project has deleted several of those.
 *
 * The rule is one line and the first draft of it got the rule wrong, which is
 * worth keeping because the wrong version looked right. **Money arriving in an
 * account of mine is income unless the other side of the posting is also mine.**
 *
 * The draft said "income is money from an income nominal", which catches an
 * acting fee and misses a board draw entirely — `payTheBoard` is a
 * `sim.transfer` from the group's own cash account to a parent's purse, both of
 * them real accounts, so there is no nominal anywhere in it. Measured: over
 * twenty-five years the parents took EUR 26.6m in board pay between them and the
 * first version of this function assessed them for thirteen euros. The rule above
 * catches it, because the group's account is not theirs; and it still excludes a
 * transfer between two pockets of the same person, because both sides are.
 *
 * An opening balance is excluded for free — equity is a nominal, but it is not
 * an account anybody owns either, so what saves it is being at the start of the
 * save rather than in a year anybody is assessed for.
 */
export function earnedInTheYear(sim: Simulation, personId: Id, year: number): Money {
  const mine = new Set(accountsOf(sim, personId).map((one) => one.id));
  if (mine.size === 0) return 0;
  const zone = sim.homeZone;
  let gross = 0;
  for (const txn of sim.universe.transactions) {
    if (zonedParts(txn.at, zone).year !== year) continue;
    const intoMine = txn.postings.filter((one) => mine.has(one.accountId) && one.amount > 0);
    if (intoMine.length === 0) continue;
    // Somebody else's money arriving, rather than my own moving about. An
    // opening balance is equity, which is nobody's account, so it is caught by
    // the year rather than by this test.
    const fromElsewhere = txn.postings.some((one) => one.amount < 0 && !mine.has(one.accountId));
    if (!fromElsewhere) continue;
    for (const one of intoMine) gross += one.amount;
  }
  return gross;
}

/**
 * Settles one person's income tax for a year, out of the account they keep.
 *
 * Out of whichever account holds the most, because a person pays a tax bill out
 * of the account that can stand it, and because a bill that failed for being
 * pointed at the wrong pocket would be a rule about SLATE's data model rather
 * than about money. If nothing can cover it the balance goes under, which is
 * the correct outcome and is what a tax bill does.
 */
export function settleTheReturn(sim: Simulation, person: Person, year: number): Money {
  const gross = earnedInTheYear(sim, person.id, year);
  if (gross <= 0) return 0;
  const owed = computeAnnualTax(gross, person.currentLocationId, sim.now).total;
  if (owed <= 0) return 0;
  const accounts = accountsOf(sim, person.id)
    .filter((one) => !isLiability(one.kind))
    .sort((a, b) => b.balance - a.balance);
  const pocket = accounts[0];
  if (!pocket) return 0;
  sim.expense(pocket.id, owed, `${INCOME_TAX_MEMO} ${year}`, 'personal');
  return owed;
}

/** Everybody in the save who has money, settled for the year just gone. */
export function everybodySettles(sim: Simulation, year: number): { people: number; total: Money } {
  let people = 0;
  let total = 0;
  for (const person of Object.values(sim.universe.people)) {
    const paid = settleTheReturn(sim, person, year);
    if (paid > 0) { people += 1; total += paid; }
  }
  return { people, total };
}

function nextReturn(sim: Simulation, after: Instant): Instant {
  const zone = sim.homeZone;
  const here = zonedParts(after, zone);
  const year = here.month < PERSONAL_RETURN_MONTH ? here.year : here.year + 1;
  return instantFromZoned({ year, month: PERSONAL_RETURN_MONTH, day: 1, hour: 9, minute: 0 }, zone);
}

function nextMonth(sim: Simulation, after: Instant): Instant {
  const zone = sim.homeZone;
  const here = zonedParts(after, zone);
  const year = here.month === 12 ? here.year + 1 : here.year;
  const month = here.month === 12 ? 1 : here.month + 1;
  return instantFromZoned({ year, month, day: 1, hour: 6, minute: 0 }, zone);
}

/**
 * What a person does about a card without being told to, which is find the
 * minimum.
 *
 * This is here because the first measurement of the charge above was a trap
 * rather than a cost. A save opens with EUR 840 carried on the card at 22.49%,
 * nobody chose that balance, and over twenty-five played years of nobody
 * touching it the card reached **minus EUR 216,487** — a quarter of everything
 * the career earned, taken silently, from an opening condition the player was
 * handed. A mechanism that can only be escaped by knowing it is there is not a
 * decision, it is a tax on not having read the source.
 *
 * So the autopilot pays the minimum when the money is there, exactly as
 * `liveTheUnattendedDay` eats and sleeps for somebody who has not said
 * otherwise. What is left is the real decision and it still has teeth: paying
 * the minimum on 22.49% takes years and costs real money, and `life.transfer`
 * is how a player who has noticed clears it faster.
 *
 * It pays out of the largest account that is not itself a debt, and it pays
 * nothing at all when there is nothing to pay it with — a person with no money
 * does not make a minimum payment either, and the card goes on compounding,
 * which is what being short actually does.
 */
export function theMinimumGetsPaid(sim: Simulation): Money {
  let paid = 0;
  for (const person of Object.values(sim.universe.people)) {
    const mine = accountsOf(sim, person.id);
    const cards = mine.filter((one) => isLiability(one.kind) && owedOn(one) > 0);
    if (cards.length === 0) continue;
    for (const card of cards) {
      const pocket = mine
        .filter((one) => !isLiability(one.kind))
        .sort((a, b) => b.balance - a.balance)[0];
      if (!pocket) continue;
      // The `Math.min` is the whole rule and it is deliberately the only place
      // the rule lives. The filter above used to also say `one.balance > 0`,
      // which reads like a guard and can never change the answer — an empty
      // pocket makes `least` nought here and the line below returns. A mutation
      // that deleted it took nothing red, which is how it was found.
      const least = Math.min(leastOnTheCard(card), pocket.balance, owedOn(card));
      if (least <= 0) continue;
      sim.post({
        memo: `${TRANSFER_MEMO}: ${pocket.name} to ${card.name}`,
        category: 'personal',
        postings: [
          { accountId: pocket.id, amount: -least },
          { accountId: card.id, amount: least },
        ],
      });
      paid += least;
    }
  }
  return paid;
}

export function registerBanking(sim: Simulation): void {
  sim.onSchedule(BANK_MONTH_KIND, () => {
    const { earned, charged } = aMonthOfInterest(sim);
    theMinimumGetsPaid(sim);
    // Said only when it is the player's own card, and only when it is worth
    // saying. A notification a month about three euros of deposit interest is
    // the kind of noise that makes a player stop reading notifications.
    const mine = accountsOf(sim, sim.universe.playerId).filter((one) => isLiability(one.kind));
    const owed = mine.reduce((n, one) => n + owedOn(one), 0);
    if (charged > 0 && owed > 0 && mine.length > 0) {
      sim.notify({
        category: 'personal',
        title: 'The Card Charges For The Month',
        body: `${formatMoney(charged)} of interest, and ${formatMoney(owed)} on it now. `
          + `The least they’d ask for is ${formatMoney(leastOnTheCard(mine[0]!))}, `
          + 'and nothing here makes you pay it — it just keeps costing.',
        importance: 25,
      });
    }
    void earned;
    sim.schedule({
      at: nextMonth(sim, sim.now),
      kind: BANK_MONTH_KIND,
      label: 'A Month Of Interest',
      category: 'system',
      priority: 8,
    });
  });

  sim.onSchedule(BANK_RETURN_KIND, () => {
    const zone = sim.homeZone;
    const year = zonedParts(sim.now, zone).year - 1;
    const { people, total } = everybodySettles(sim, year);
    const me = sim.universe.people[sim.universe.playerId];
    const mine = me ? computeAnnualTax(
      earnedInTheYear(sim, me.id, year), me.currentLocationId, sim.now,
    ) : undefined;
    if (mine && mine.total > 0) {
      sim.notify({
        category: 'personal',
        title: `Your ${year} Assessment`,
        body: `${formatMoney(mine.total)} on ${formatMoney(mine.gross)} earned. That’s `
          + `${Math.round(mine.effectiveRate * 100)} percent of it. It’s assessed on the year gone `
          + 'and it leaves now, so a good year is paid for out of the one after it.',
        importance: 55,
      });
    }
    void people;
    void total;
    sim.schedule({
      at: nextReturn(sim, sim.now),
      kind: BANK_RETURN_KIND,
      label: 'The Personal Tax Return',
      category: 'system',
      priority: 7,
    });
  });

  sim.onCommand<{ from: Id; to: Id; cents: number }, { ok: boolean; error?: string }>(
    'life.transfer', (payload, { sim: s }) => {
      const out = transfer(s, payload.from, payload.to, Math.round(payload.cents));
      if (!out.ok) throw new CommandError(out.error ?? 'That can’t be moved.');
      return out;
    },
  );

  if (!sim.universe.scheduled.some((i) => i.kind === BANK_MONTH_KIND && i.status === 'pending')) {
    sim.schedule({
      at: nextMonth(sim, sim.now),
      kind: BANK_MONTH_KIND,
      label: 'A Month Of Interest',
      category: 'system',
      priority: 8,
    });
  }
  if (!sim.universe.scheduled.some((i) => i.kind === BANK_RETURN_KIND && i.status === 'pending')) {
    sim.schedule({
      at: nextReturn(sim, sim.now),
      kind: BANK_RETURN_KIND,
      label: 'The Personal Tax Return',
      category: 'system',
      priority: 7,
    });
  }
}
