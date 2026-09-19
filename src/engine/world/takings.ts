/**
 * SLATE — turning a run into postings, so that what a picture earned is a sum.
 *
 * The house rule is one line and it is why this file is separate from `boxoffice.ts`:
 * **a ledger balance is never a number somebody typed. It is the sum of postings.**
 * That file works out what a thing takes and touches no money. This puts the answer
 * into accounts, one window and one week at a time, and afterwards the company's cash
 * is arithmetic rather than assertion.
 *
 * The deleted system posted a picture's whole life in one transaction on its delivery
 * date with a memo that said `Distribution`. Two things were wrong and only one was
 * the date. The other was that a single posting cannot answer where the money came
 * from, so a player could never learn that the foreign sale was carrying a picture the
 * cinemas never had.
 *
 * ## An account per window, opened on demand
 *
 * Nominal accounts: they never hold the company's money, they exist so every cent has
 * a provenance and the far side of every posting names where it came from. Reading
 * income by window is then a filter over transactions rather than a stored total
 * anybody has to remember to update, and this project has deleted several of those.
 *
 * ## Points come out as the money arrives, not at the end
 *
 * The part that makes the deal in `content/talent.ts` real. Somebody who took a share
 * instead of a fee is paid out of each receipt as it lands, which means a picture's
 * cost is still running a year after its shoot finished, and a producer who covered a
 * cash shortfall by giving away the back end watches it leave in instalments. A single
 * settlement at the end would have made points a footnote.
 *
 * ## Why the exhibitor's half is never posted
 *
 * Because it never arrives. A theatrical gross is what an audience paid and roughly
 * half stays with the cinemas — not the company's money at any point, so posting it
 * and posting it back out would put two entries in the ledger for an event that did
 * not happen to this company. The gap between what a picture "made" and what its owner
 * banked is the most misunderstood number in the business being modeled, and it is
 * visible here rather than hidden in a rate.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../core/ids';
import { millions, type Money } from '../core/money';
import type { Deal } from '../content/talent';
import { pointsOutOf } from '../content/talent';
import { shareOutOf, type Offer } from '../content/ancillary';
import { CAMPAIGN_UPFRONT, DISTRIBUTION_FEE, EXHIBITOR_KEEPS } from '../content/release';
import type { Channel } from '../content/format';
import { cashAccountFor } from './company';

/** Where a window's money is credited from. Nominal, opened on demand. */
export const INCOME_PREFIX = 'income:release:';

/** Where a campaign is charged. */
export const CAMPAIGN_ACCOUNT = 'expense:campaign';

/** Where fees paid at the greenlight are charged. */
export const FEES_ACCOUNT = 'expense:fees';

/** Where a share of the back end going out to the people who took one is charged. */
export const POINTS_ACCOUNT = 'expense:points';

/** Where a partner's share of the picture is charged. */
export const SOLD_ACCOUNT = 'expense:sold';

/** Where a bonus that fell due on a runaway picture is charged. */
export const THRESHOLD_ACCOUNT = 'expense:threshold';

/** The statement category every posting here carries. */
export const CATEGORY = 'production';

function nominal(sim: Simulation, id: string, name: string, kind: 'income' | 'expense'): string {
  if (!sim.ledger.tryAccount(id)) {
    sim.ledger.open({
      id,
      saveId: sim.universe.meta.id,
      kind,
      name,
      ownerId: 'world',
      balance: 0,
      openedAt: sim.now,
      nominal: true,
      category: CATEGORY,
    });
  }
  return id;
}

/**
 * What reaches the company out of what an audience paid.
 *
 * Theatrical is the only channel with an exhibitor standing in front of it. A
 * broadcaster or a service buys the thing, so what was agreed is what arrives.
 */
export function reachesUs(grossCents: Money, channel: Channel): Money {
  const kept = channel === 'theatrical' ? 1 - EXHIBITOR_KEEPS : 1;
  return Math.round(Math.round(grossCents * kept) * (1 - DISTRIBUTION_FEE));
}

export interface Received {
  /** What was credited before the people on points took theirs. */
  grossToUsCents: Money;
  /** What went straight back out to them. */
  pointsPaidCents: Money;
  /** What the company actually kept. */
  keptCents: Money;
}

/**
 * Credits one receipt and pays the back end out of it in the same breath.
 *
 * One transaction, three postings where anybody is on points: the income account, the
 * points expense, and the cash that is left. One fact about money, so the ledger
 * should not be able to hold half of it — which is the same reason a transfer is one
 * transaction rather than two.
 *
 * Idempotent by key, because the tick can be asked to run a week twice and paying a
 * window twice is the failure the old pipeline had, to the tune of ninety-six per cent
 * over budget.
 */
export function receive(
  sim: Simulation,
  companyId: Id,
  projectId: Id,
  windowId: string,
  label: string,
  grossToUsCents: Money,
  deals: readonly Deal[],
  key: string,
  offers: readonly Offer[] = [],
): Received {
  const nothing = { grossToUsCents: 0, pointsPaidCents: 0, keptCents: 0 };
  if (grossToUsCents <= 0) return nothing;
  const cash = cashAccountFor(sim.universe, companyId);
  if (!cash) return nothing;

  const owed = pointsOutOf(deals, grossToUsCents);
  // And whatever was sold off the picture before it opened. A partner on a share
  // takes theirs out of the same receipt the back end comes out of, which is what
  // makes selling the merchandise a real cost rather than free money.
  const sold = shareOutOf(offers, grossToUsCents);
  const kept = grossToUsCents - owed - sold;
  const postings = [
    { accountId: nominal(sim, `${INCOME_PREFIX}${windowId}`, label, 'income'), amount: -grossToUsCents },
    { accountId: cash.id, amount: kept },
  ];
  if (owed > 0) {
    postings.push({ accountId: nominal(sim, POINTS_ACCOUNT, 'Back End', 'expense'), amount: owed });
  }
  if (sold > 0) {
    postings.push({ accountId: nominal(sim, SOLD_ACCOUNT, 'Sold Off It', 'expense'), amount: sold });
  }
  sim.post({
    memo: label,
    category: CATEGORY,
    postings,
    refType: 'project',
    refId: projectId,
    idempotencyKey: key,
  });
  return { grossToUsCents, pointsPaidCents: owed, keptCents: kept };
}

/**
 * Banks a guarantee the moment it is agreed.
 *
 * Not at the opening. The whole value of a guarantee is that somebody committed the
 * money while the outcome was unknown, so it arrives while the picture is still a
 * plan — which is exactly what makes it the cash a short company reaches for, and
 * why taking it is a decision rather than a formality.
 */
export function bankTheGuarantee(
  sim: Simulation,
  companyId: Id,
  projectId: Id,
  ancillaryId: string,
  label: string,
  cents: Money,
): { ok: boolean; error?: string } {
  const cash = cashAccountFor(sim.universe, companyId);
  if (!cash) return { ok: false, error: 'The company has no cash account.' };
  if (cents <= 0) return { ok: true };
  sim.post({
    memo: `${label}, guaranteed`,
    category: CATEGORY,
    postings: [
      { accountId: nominal(sim, `${INCOME_PREFIX}${ancillaryId}`, label, 'income'), amount: -cents },
      { accountId: cash.id, amount: cents },
    ],
    refType: 'project',
    refId: projectId,
    idempotencyKey: `${projectId}:${ancillaryId}:guarantee`,
  });
  return { ok: true };
}

/**
 * Charges a campaign, in the two pieces it is actually spent in.
 *
 * Most goes before the thing opens and the rest across the first weeks, which is why
 * this is two postings — and why moving a date forward cannot recover what was already
 * spent announcing the old one.
 */
export function chargeTheCampaign(
  sim: Simulation,
  companyId: Id,
  projectId: Id,
  campaignCents: Money,
): { ok: boolean; error?: string } {
  const cash = cashAccountFor(sim.universe, companyId);
  if (!cash) return { ok: false, error: 'The company has no cash account.' };
  if (campaignCents <= 0) return { ok: true };
  const account = nominal(sim, CAMPAIGN_ACCOUNT, 'Campaign', 'expense');
  const upfront = Math.round(campaignCents * CAMPAIGN_UPFRONT);
  for (const [cents, memo, tag] of [
    [upfront, 'Campaign, before opening', 'upfront'],
    [campaignCents - upfront, 'Campaign, across the run', 'across'],
  ] as const) {
    if (cents <= 0) continue;
    sim.post({
      memo,
      category: CATEGORY,
      postings: [{ accountId: cash.id, amount: -cents }, { accountId: account, amount: cents }],
      refType: 'project',
      refId: projectId,
      idempotencyKey: `${projectId}:campaign:${tag}`,
    });
  }
  return { ok: true };
}

/**
 * Pays everybody their fee at the greenlight.
 *
 * Here rather than at release, because that is when the money leaves — and because a
 * model where a crew is paid out of the takings would make a failure free, which is
 * the single most important thing a studio simulation has to get right.
 */
export function chargeTheFees(
  sim: Simulation,
  companyId: Id,
  projectId: Id,
  cents: Money,
): { ok: boolean; error?: string } {
  const cash = cashAccountFor(sim.universe, companyId);
  if (!cash) return { ok: false, error: 'The company has no cash account.' };
  if (cents <= 0) return { ok: true };
  if (cash.balance < cents) {
    return { ok: false, error: `The fees come to ${millions(cents)} and the company has ${millions(cash.balance)}.` };
  }
  sim.post({
    memo: 'Fees, at the greenlight',
    category: CATEGORY,
    postings: [
      { accountId: cash.id, amount: -cents },
      { accountId: nominal(sim, FEES_ACCOUNT, 'Fees', 'expense'), amount: cents },
    ],
    refType: 'project',
    refId: projectId,
    idempotencyKey: `${projectId}:fees`,
  });
  return { ok: true };
}

/**
 * What one project has brought in, read off the postings rather than off a total.
 *
 * The rule this file exists for, applied to itself: there is no `earnedCents` field on
 * a project anywhere, because the moment there is one it can disagree with the ledger
 * and then two numbers both claim to be the answer.
 */
export function receivedBy(sim: Simulation, projectId: Id): Money {
  let sum = 0;
  for (const txn of sim.universe.transactions) {
    if (txn.refType !== 'project' || txn.refId !== projectId) continue;
    for (const p of txn.postings) if (p.accountId.startsWith(INCOME_PREFIX)) sum += -p.amount;
  }
  return sum;
}

/** What one project has cost, the same way and for the same reason. */
export function costOf(sim: Simulation, projectId: Id): Money {
  const charged = new Set([CAMPAIGN_ACCOUNT, FEES_ACCOUNT, POINTS_ACCOUNT, SOLD_ACCOUNT, THRESHOLD_ACCOUNT]);
  let sum = 0;
  for (const txn of sim.universe.transactions) {
    if (txn.refType !== 'project' || txn.refId !== projectId) continue;
    for (const p of txn.postings) if (charged.has(p.accountId)) sum += p.amount;
  }
  return sum;
}

/**
 * What it returned against what it cost, which is the figure a line inherits.
 *
 * One means it washed its face. Read from the ledger on both sides, so a picture
 * cannot look profitable because somebody forgot to count the back end going out.
 */
export function returnedBy(sim: Simulation, projectId: Id): number {
  const cost = costOf(sim, projectId);
  if (cost <= 0) return 0;
  return receivedBy(sim, projectId) / cost;
}

/**
 * Pays a bonus that fell due because the picture ran away.
 *
 * Charged when the last window shuts rather than as the money arrives, because a
 * threshold is a fact about the whole life of a picture and cannot be known until
 * that life is over. It is the one cost in the model a producer cannot plan for,
 * which is exactly what makes agreeing one a decision.
 */
export function payTheThreshold(
  sim: Simulation,
  companyId: Id,
  projectId: Id,
  cents: Money,
): { ok: boolean; error?: string } {
  const cash = cashAccountFor(sim.universe, companyId);
  if (!cash) return { ok: false, error: 'The company has no cash account.' };
  if (cents <= 0) return { ok: true };
  sim.post({
    memo: 'Bonus, on the threshold',
    category: CATEGORY,
    postings: [
      { accountId: cash.id, amount: -cents },
      { accountId: nominal(sim, THRESHOLD_ACCOUNT, 'Thresholds', 'expense'), amount: cents },
    ],
    refType: 'project',
    refId: projectId,
    idempotencyKey: `${projectId}:threshold`,
  });
  return { ok: true };
}
