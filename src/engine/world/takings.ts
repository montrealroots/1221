/**
 * SLATE — turning a run into postings, so that what a picture earned is a sum.
 *
 * The house rule is one line and it is the reason this file is separate from
 * `boxoffice.ts`: **a ledger balance is never a number somebody typed. It is the
 * sum of postings.** `boxoffice.ts` works out what a thing took. It does not touch
 * money. This puts the answer into accounts, one window at a time, and after it has
 * run the company's cash is arithmetic rather than assertion.
 *
 * The deleted system posted a picture's whole life in a single transaction on its
 * delivery date, with a memo that said `Distribution`. Two things were wrong with
 * that and only one of them was the date. The other was that a single posting
 * cannot answer where the money came from, so the statement showed one line and the
 * player had no way to learn that the foreign sale was carrying the picture and the
 * cinemas never had.
 *
 * ## An account per window
 *
 * Seven nominal income accounts, opened on demand. They are nominal — they never
 * hold the company's money, they exist so that every cent has a provenance and the
 * other half of every posting names where it came from. Reading the company's
 * income by window is then a filter over transactions rather than a stored total
 * anybody has to remember to update, and this project has deleted several of those.
 *
 * ## Why the exhibitor's half is never posted
 *
 * Because it never arrives. A theatrical gross is what the audience paid, and about
 * half of it stays with the cinemas — it is not the company's money at any point,
 * so posting it and then posting it back out would put two entries in the ledger to
 * describe an event that did not happen to this company. `Run.grossCents` is
 * reported and `Run.rentalCents` is posted, and the gap between them is the single
 * most misunderstood number in the business being modeled.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../core/ids';
import { millions, type Money } from '../core/money';
import type { Run } from './boxoffice';
import { CAMPAIGN_UPFRONT } from '../content/release';
import { cashAccountFor } from './company';

/** The account a window's money is credited against. Nominal, opened on demand. */
export const INCOME_PREFIX = 'income:release:';

/** Where a campaign's cost is charged. */
export const CAMPAIGN_ACCOUNT = 'expense:campaign';

/** Where the heads' fees are charged. */
export const HEADS_ACCOUNT = 'expense:heads';

/** The statement category every posting here carries. */
export const CATEGORY = 'production';

/**
 * Opens a nominal account if it is not already there, and hands it back.
 *
 * Nominal accounts are invisible to the player's account list and exist purely as
 * the balancing partner of a real posting. Opening on demand rather than at save
 * creation keeps the chart of accounts to what a save has actually done.
 */
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
 * Why this run cannot be banked.
 *
 * One reason, and it is the one that would otherwise throw deep inside the ledger
 * with a message about a missing account: a company with no cash account has
 * nowhere to put the money. Caught here so the refusal names the company.
 */
export function whyNotBank(sim: Simulation, companyId: Id): string | undefined {
  const cash = cashAccountFor(sim.universe, companyId);
  if (!cash) return 'That company has no cash account to pay into.';
  return undefined;
}

export interface Banked {
  ok: boolean;
  error?: string;
  /** What actually reached the company, in cents. */
  cents: Money;
  /** One line per posting made, for the report. */
  lines: readonly string[];
}

/**
 * Posts a whole run: the opening channel, then every window that follows it.
 *
 * One transaction per window rather than one for the lot, because the windows land
 * on different dates and a transaction carries a single instant. Batching them
 * would mean choosing which date to lie about.
 *
 * Idempotency is by key, built from the project and the window, so calling this
 * twice for the same release cannot pay twice — which is the failure the deleted
 * system had, to the tune of ninety-six per cent over budget, and it is worth
 * spending a string on preventing.
 */
export function bankTheRun(
  sim: Simulation,
  companyId: Id,
  projectId: Id,
  run: Run,
): Banked {
  const no = whyNotBank(sim, companyId);
  if (no) return { ok: false, error: no, cents: 0, lines: [] };
  const cash = cashAccountFor(sim.universe, companyId)!;
  const lines: string[] = [];
  let total = 0;

  const pay = (label: string, cents: Money, key: string, accountId: string) => {
    if (cents <= 0) return;
    sim.ledger.post({
      id: sim.nextId('txn'),
      saveId: sim.universe.meta.id,
      at: sim.now,
      memo: label,
      category: CATEGORY,
      postings: [
        { accountId: accountId, amount: -cents },
        { accountId: cash.id, amount: cents },
      ],
      refType: 'project',
      refId: projectId,
      idempotencyKey: key,
    });
    total += cents;
    lines.push(`${label}: ${millions(cents)}`);
  };

  pay(
    'Rental',
    run.rentalCents,
    `${projectId}:rental`,
    nominal(sim, `${INCOME_PREFIX}rental`, 'Rental', 'income'),
  );
  for (const take of run.takes) {
    pay(
      take.label,
      take.cents,
      `${projectId}:${take.id}`,
      nominal(sim, `${INCOME_PREFIX}${take.id}`, take.label, 'income'),
    );
  }

  return { ok: true, cents: total, lines };
}

/**
 * Charges a campaign, in the two pieces it is actually spent in.
 *
 * Most of it goes before the thing opens and the rest goes out across the run,
 * which is why this is two postings and not one — and why pulling a release
 * forward cannot recover what was already spent announcing the old date. The
 * second posting is dated at the caller's instant rather than scheduled, because
 * a campaign that is still running when the company is wound up should still
 * have been paid for.
 */
export function chargeTheCampaign(
  sim: Simulation,
  companyId: Id,
  projectId: Id,
  campaignCents: Money,
): { ok: boolean; error?: string; upfrontCents: Money; acrossCents: Money } {
  const cash = cashAccountFor(sim.universe, companyId);
  if (!cash) return { ok: false, error: 'That company has no cash account.', upfrontCents: 0, acrossCents: 0 };
  if (campaignCents <= 0) return { ok: true, upfrontCents: 0, acrossCents: 0 };
  const upfront = Math.round(campaignCents * CAMPAIGN_UPFRONT);
  const across = campaignCents - upfront;
  const account = nominal(sim, CAMPAIGN_ACCOUNT, 'Campaign', 'expense');

  const charge = (cents: Money, memo: string, key: string) => {
    if (cents <= 0) return;
    sim.ledger.post({
      id: sim.nextId('txn'),
      saveId: sim.universe.meta.id,
      at: sim.now,
      memo,
      category: CATEGORY,
      postings: [
        { accountId: cash.id, amount: -cents },
        { accountId: account, amount: cents },
      ],
      refType: 'project',
      refId: projectId,
      idempotencyKey: key,
    });
  };
  charge(upfront, 'Campaign, before opening', `${projectId}:campaign:upfront`);
  charge(across, 'Campaign, across the run', `${projectId}:campaign:across`);
  return { ok: true, upfrontCents: upfront, acrossCents: across };
}

/**
 * Charges the department heads.
 *
 * Separate from the campaign because it is a different kind of money and the
 * statement should say so: one is what the thing cost to make and the other is
 * what it cost to tell anybody about. Folding them into a single production
 * expense is how a studio loses the ability to notice it is overspending on one
 * of them.
 */
export function chargeTheHeads(
  sim: Simulation,
  companyId: Id,
  projectId: Id,
  cents: Money,
): { ok: boolean; error?: string } {
  const cash = cashAccountFor(sim.universe, companyId);
  if (!cash) return { ok: false, error: 'That company has no cash account.' };
  if (cents <= 0) return { ok: true };
  sim.post({
    memo: 'Department heads',
    category: CATEGORY,
    postings: [
      { accountId: cash.id, amount: -cents },
      { accountId: nominal(sim, HEADS_ACCOUNT, 'Department Heads', 'expense'), amount: cents },
    ],
    refType: 'project',
    refId: projectId,
    idempotencyKey: `${projectId}:heads`,
  });
  return { ok: true };
}

/**
 * What one project has earned, read off the postings rather than off a total.
 *
 * The rule this file exists for, applied to itself: there is no `earnedCents`
 * field anywhere on a project, because the moment there is one it can disagree
 * with the ledger and then two numbers both claim to be the answer.
 */
export function earnedBy(sim: Simulation, projectId: Id): Money {
  let sum = 0;
  for (const txn of sim.universe.transactions) {
    if (txn.refType !== 'project' || txn.refId !== projectId) continue;
    for (const posting of txn.postings) {
      if (posting.accountId.startsWith(INCOME_PREFIX)) sum += -posting.amount;
    }
  }
  return sum;
}

/** What one project has cost, the same way and for the same reason. */
export function spentOn(sim: Simulation, projectId: Id): Money {
  let sum = 0;
  for (const txn of sim.universe.transactions) {
    if (txn.refType !== 'project' || txn.refId !== projectId) continue;
    for (const posting of txn.postings) {
      if (posting.accountId === CAMPAIGN_ACCOUNT || posting.accountId === HEADS_ACCOUNT) {
        sum += posting.amount;
      }
    }
  }
  return sum;
}
