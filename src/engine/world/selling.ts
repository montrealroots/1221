/**
 * SLATE — selling a finished picture, and walking its money home.
 *
 * `content/selling.ts` says what the deals and the windows are. This sells a
 * delivered picture, opens it, pays its windows as the years pass, and runs
 * every receipt through the waterfall to work out who actually got anything.
 *
 * ## The waterfall is walked, not looked up
 *
 * Recoupment is an order of operations applied to dated money, so this walks
 * the receipts in the order they arrived. Interest on an unrecouped negative is
 * the reason the tier is worth modeling at all, and it cannot be computed from
 * a total: it accrues on what is *outstanding* between one receipt and the
 * next, and stops the moment the negative is covered. Charging the original
 * negative for the whole life of the picture turns a twenty million euro film
 * into a forty-seven million euro debt, which is how this was written the first
 * time and it was simply wrong.
 *
 * ## One stored fact
 *
 * A sold picture stores which windows have paid, and nothing else about the
 * money. The gross to date, what each tier took, what the company has seen and
 * what is still owed are all recomputed from that list and the deal's terms
 * every time anybody asks. A stored recoupment figure is a number that can
 * disagree with the receipts underneath it, and in this business that
 * disagreement is the whole genre of dispute.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../domain/model';
import type { Money } from '../core/money';
import type { Project } from '../domain/company';
import { formatMoneyCompact } from '../core/money';
import {
  DEALS, INTEREST_A_YEAR, RELEASE_WEEKS, TIERS, WINDOWS,
  type Deal, type ReleaseWindow, type TierId,
  dealById, ultimateFor, windowById,
} from '../content/selling';
import { MS_WEEK } from './lot';

export const WINDOW_KIND = 'project.window';

// ---------------------------------------------------------------------------
// What a picture is reckoned to take
// ---------------------------------------------------------------------------

export interface Prospects {
  negativeCents: Money;
  /** Which deal it is being sold on, by id. */
  dealId: string;
}

/**
 * What a picture will take across ten years, decided once at the sale.
 *
 * Two things move it and both are decisions somebody made. What it cost,
 * because scale buys audience sublinearly. And how it is being sold, because a
 * wide release across a decade of windows reaches an audience a buyout never
 * puts in a room. The draw only says where inside a wide band it lands, which
 * is honest: nobody in this business knows what a picture will take, and the
 * ones who claim to are selling something.
 */
export function decideTake(prospects: Prospects, roll: number): { cents: Money } {
  const deal = dealById(prospects.dealId);
  const pull = deal ? 0.6 + 0.4 * deal.reach : 1;
  const band = 0.45 + roll * 1.7;
  return { cents: Math.round(ultimateFor(prospects.negativeCents) * pull * band) };
}

// ---------------------------------------------------------------------------
// The waterfall
// ---------------------------------------------------------------------------

export interface Receipt {
  /** Weeks after release that it arrived. */
  weeksOut: number;
  cents: Money;
}

export interface Split {
  /** Gross taken to date, across every receipt. */
  grossCents: Money;
  /** What each tier has taken out of that, in order. */
  took: Record<TierId, Money>;
  /** What has come back to the company: its recoupment plus its share of the net. */
  toTheCompanyCents: Money;
  /** What is still outstanding on the negative, interest included. */
  stillOwedCents: Money;
}

/**
 * Runs every receipt through the tiers, in order, and says where it landed.
 *
 * Each receipt is applied the same way: the distributor's fee off the top, then
 * the marketing spend until it is whole, then the negative with whatever
 * interest it has accrued while waiting, then anything that survives.
 */
export function splitIt(receipts: readonly Receipt[], deal: Deal, negativeCents: Money): Split {
  const took: Record<TierId, Money> = { fee: 0, marketing: 0, negative: 0, net: 0 };
  const marketing = Math.round(negativeCents * deal.spendsOnSelling);
  let owed = negativeCents;
  let gross = 0;
  let lastWeek = 0;

  for (const receipt of [...receipts].sort((a, b) => a.weeksOut - b.weeksOut)) {
    gross += receipt.cents;

    // Interest on what is outstanding, for the time since the last receipt.
    if (owed > 0 && receipt.weeksOut > lastWeek) {
      owed = Math.round(owed * (1 + INTEREST_A_YEAR) ** ((receipt.weeksOut - lastWeek) / 52));
    }
    lastWeek = Math.max(lastWeek, receipt.weeksOut);

    const fee = Math.round(receipt.cents * deal.fee);
    took.fee += fee;
    let left = receipt.cents - fee;

    const toMarketing = Math.min(left, marketing - took.marketing);
    took.marketing += toMarketing;
    left -= toMarketing;

    const toNegative = Math.min(left, owed);
    took.negative += toNegative;
    owed -= toNegative;
    left -= toNegative;

    took.net += left;
  }

  return {
    grossCents: gross,
    took,
    toTheCompanyCents: took.negative + Math.round(took.net * deal.keepsNet),
    stillOwedCents: owed,
  };
}

/** Every receipt a picture has actually banked, built back from what has paid. */
function receiptsOf(project: Project, deal: Deal): Receipt[] {
  const negative = project.budgetCents ?? 0;
  const receipts: Receipt[] = [];
  if (deal.upFront > 0) receipts.push({ weeksOut: 0, cents: Math.round(negative * deal.upFront) });
  const take = project.takeCents ?? 0;
  for (const window of WINDOWS) {
    if (!project.windowsPaid?.includes(window.id)) continue;
    const cents = Math.round(take * deal.reach * window.share);
    if (cents > 0) receipts.push({ weeksOut: window.opensAt, cents });
  }
  return receipts;
}

/** Where a sold picture's money stands, recomputed from the windows that have paid. */
export function standingOf(project: Project): Split | undefined {
  const deal = project.dealId ? dealById(project.dealId) : undefined;
  if (!deal || project.takeCents === undefined) return undefined;
  return splitIt(receiptsOf(project, deal), deal, project.budgetCents ?? 0);
}

/** What a picture has taken in, across every window that has paid. */
export function grossSoFar(project: Project): Money {
  return standingOf(project)?.grossCents ?? 0;
}

// ---------------------------------------------------------------------------
// Selling it
// ---------------------------------------------------------------------------

/** What is on the table for a picture that is ready to sell. */
export const dealsOnTheTable = (): readonly Deal[] => DEALS;

/** The company's cash account, which is where anything that comes back lands. */
function cashFor(sim: Simulation, companyId: Id): Id | undefined {
  return Object.values(sim.universe.accounts)
    .find((a) => a.ownerId === companyId && a.kind === 'company_cash' && !a.closedAt)?.id;
}

/**
 * Pays the company the difference between what the waterfall now says it is
 * owed and what it was owed a moment ago.
 *
 * Taking the difference rather than the total is what keeps the ledger and the
 * waterfall the same number: every euro the company sees has a tier behind it,
 * and nothing is ever paid twice.
 */
function collect(sim: Simulation, project: Project, was: Money, memo: string): void {
  const now = standingOf(project)?.toTheCompanyCents ?? 0;
  const due = now - was;
  if (due <= 0) return;
  const account = cashFor(sim, project.companyId);
  if (!account) return;
  sim.income(account, due, `${project.title}: ${memo}`, 'business',
    { refType: 'project', refId: project.id });
}

export interface Sale {
  projectId: Id;
  dealId: string;
}

/**
 * Sells a delivered picture on one of the deals on the table.
 *
 * A picture that is not delivered cannot be sold, because a distributor buys a
 * list of elements and not a promise. That refusal is the whole reason the
 * delivery list exists.
 */
export function sellIt(sim: Simulation, sale: Sale): { ok: true } | { ok: false; error: string } {
  const project = sim.universe.projects[sale.projectId];
  if (!project) return { ok: false, error: 'There’s no such picture.' };
  if (project.dealId) return { ok: false, error: `${project.title} is already sold.` };
  if (project.stage !== 'delivered') {
    return { ok: false, error: `${project.title} isn’t delivered, and nobody buys a picture they can’t be handed.` };
  }
  const deal = dealById(sale.dealId);
  if (!deal) return { ok: false, error: 'There’s no such deal on the table.' };

  const roll = sim.rng('selling', 'take', project.id).next();
  project.dealId = deal.id;
  project.soldAt = sim.now;
  project.releasedAt = sim.now + RELEASE_WEEKS * MS_WEEK;
  project.takeCents = decideTake(
    { negativeCents: project.budgetCents ?? 0, dealId: deal.id }, roll,
  ).cents;
  project.windowsPaid = [];

  collect(sim, project, 0, 'The Sale');

  if (deal.reach > 0) {
    for (const window of WINDOWS) {
      sim.schedule({
        at: project.releasedAt + Math.round(window.opensAt * MS_WEEK),
        kind: WINDOW_KIND,
        label: `${project.title}: ${window.label}`,
        category: 'business',
        priority: 60,
        payload: { projectId: project.id, windowId: window.id },
        refType: 'project',
        refId: project.id,
      });
    }
  }

  sim.notify({
    category: 'business',
    title: `${project.title} Is Sold`,
    body: `${deal.label} — ${deal.said}`,
    importance: 72,
    refType: 'project',
    refId: project.id,
  });
  return { ok: true };
}

/** One window pays. */
function payWindow(sim: Simulation, project: Project, window: ReleaseWindow): void {
  if (!project.windowsPaid) project.windowsPaid = [];
  if (project.windowsPaid.includes(window.id)) return;
  const was = standingOf(project)?.toTheCompanyCents ?? 0;
  project.windowsPaid.push(window.id);
  collect(sim, project, was, window.label);
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

export function registerSelling(sim: Simulation): void {
  sim.onSchedule(WINDOW_KIND, (item) => {
    const projectId = String(item.payload?.projectId ?? '');
    const windowId = String(item.payload?.windowId ?? '');
    const project = sim.universe.projects[projectId];
    const window = windowById(windowId);
    if (!project || !window || project.shelvedAt) return;
    payWindow(sim, project, window);
  });

  sim.onCommand<Sale, { ok: boolean; error?: string }>(
    'company.sell', (payload, { sim: s }) => sellIt(s, payload),
  );
}

/** Where a sold picture's money stands, in a sentence. */
export function whereTheMoneyStands(project: Project): string {
  if (!project.dealId) {
    return project.stage === 'delivered'
      ? `${project.title} is delivered and nobody has bought it.`
      : `${project.title} isn’t finished, so there’s nothing to sell yet.`;
  }
  const deal = dealById(project.dealId);
  if (!deal) return `${project.title} is sold.`;
  if (deal.reach === 0) return `${project.title} was sold outright, so that check is all of it.`;
  const split = standingOf(project);
  if (!split) return `${project.title} is sold.`;
  return `${project.title} has taken ${formatMoneyCompact(split.grossCents)}`
    + `, and the company has seen ${formatMoneyCompact(split.toTheCompanyCents)} of it`
    + `${split.stillOwedCents > 0
      ? `, with ${formatMoneyCompact(split.stillOwedCents)} of what made it still outstanding`
      : ''}.`;
}

/** Every tier, with what it took, for a screen that wants the whole queue. */
export function tiersFor(project: Project): { tier: typeof TIERS[number]; cents: Money }[] {
  const split = standingOf(project);
  return TIERS.map((tier) => ({ tier, cents: split?.took[tier.id] ?? 0 }));
}
