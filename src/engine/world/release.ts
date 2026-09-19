/**
 * SLATE — letting a finished picture out, and taking the money as it comes.
 *
 * `content/release.ts` holds what a run is worth and over how long. This puts it into
 * the ledger, a month at a time, and decides when a picture may open at all.
 *
 * ## How much has been paid is a question for the ledger
 *
 * There is no `paidMonths` on a project and there deliberately is not going to be.
 * What a picture has been paid is **counted from its own postings**, which is the same
 * rule the rest of this build follows about money: a balance is the sum of what was
 * posted, never a figure maintained alongside it.
 *
 * A counter would work until the first time a tick was missed, replayed, or a save was
 * loaded mid-run, and then there would be two answers. Reading the postings cannot
 * disagree with the postings.
 *
 * ## What a release reads, and what it does not
 *
 * Two things: the reach of the **material**, and the craft that went into making it.
 * What the picture cost is deliberately not one of them. It used to be — the take was
 * a multiple of the budget — and that made spending money on a crew unconditionally
 * correct, which `tools/career.mjs` demonstrated over five-year careers. An audience
 * has no opinion about a budget, and now neither does this.
 *
 * It is still thin and honest about being thin: there is no rating, no campaign, no
 * season and no word of mouth. Each is a real thing to add, each will move this figure,
 * and each of them belongs on the reach side rather than the spending side.
 *
 * What matters is that both inputs **bite**, and that they now pull against each
 * other. Better craft collects more of the reach and costs more to hire, so the same
 * team is right on one property and wrong on another — which is what makes hiring a
 * decision rather than a formality.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../core/ids';
import type { Money } from '../core/money';
import type { Instant } from '../core/time';
import { startOfNextMonth, zonedParts } from '../core/time';
import type { Project } from '../domain/company';
import { BEST_TEAM, LEAST_TEAM } from '../content/departments';
import { PAYS_FOR_MONTHS, paysInMonth, reckon, whatItCouldReach } from '../content/release';
import { layOut } from './schedule';
import { cashAccountFor, parentCompany, projectsOf } from './company';

export const RELEASE_MONTH_KIND = 'release.month';

/** Where a picture's takings are credited from. Nominal, opened when first needed. */
export const TAKINGS_ACCOUNT = 'income:takings';

/**
 * The craft that went into a picture, from nought to one.
 *
 * Weighted by how long each department worked, because a team hired for six months
 * shapes the thing more than one hired for one. A picture nobody was hired onto sits
 * at the floor rather than at nothing, since every department a picture needs is
 * staffed by somebody — choosing is choosing to do better than that.
 */
export function craftOf(sim: Simulation, project: Project): number {
  const holding = project.holdingId ? sim.universe.holdings[project.holdingId] : undefined;
  if (!holding || project.greenlitAt === undefined) return 0;
  const laid = layOut(holding.demands, project.levels ?? {}, project.greenlitAt, sim.homeZone);

  let months = 0;
  let weighted = 0;
  for (const phase of laid.phases) {
    for (const line of phase.lines) {
      months += line.months;
      weighted += line.months * (line.level - LEAST_TEAM);
    }
  }
  if (months === 0) return 0;
  return weighted / months / (BEST_TEAM - LEAST_TEAM);
}

/** Everything out and still paying. */
export const onRelease = (sim: Simulation): readonly Project[] =>
  projectsOf(sim.universe).filter((one) => one.releasedAt !== undefined);

/**
 * How many months of a run have been paid, counted off the ledger.
 *
 * One transaction per month paid, tagged to the project, so counting them is counting
 * what actually happened rather than what something thinks happened.
 */
export function monthsPaid(sim: Simulation, projectId: Id): number {
  let paid = 0;
  for (const txn of sim.universe.transactions) {
    if (txn.refType !== 'project' || txn.refId !== projectId) continue;
    if (txn.postings.some((one) => one.accountId === TAKINGS_ACCOUNT)) paid += 1;
  }
  return paid;
}

/** What a picture has taken so far, likewise off the postings. */
export function takenSoFar(sim: Simulation, projectId: Id): Money {
  let sum = 0;
  for (const txn of sim.universe.transactions) {
    if (txn.refType !== 'project' || txn.refId !== projectId) continue;
    for (const one of txn.postings) if (one.accountId === TAKINGS_ACCOUNT) sum += -one.amount;
  }
  return sum;
}

/** Opens the nominal account the takings are credited from. */
function takings(sim: Simulation): string {
  if (!sim.ledger.tryAccount(TAKINGS_ACCOUNT)) {
    sim.ledger.open({
      id: TAKINGS_ACCOUNT,
      saveId: sim.universe.meta.id,
      kind: 'income',
      name: 'Takings',
      ownerId: 'world',
      balance: 0,
      openedAt: sim.now,
      nominal: true,
      category: 'business',
    });
  }
  return TAKINGS_ACCOUNT;
}

/**
 * Pays whatever months of a run have come due and not yet been paid.
 *
 * Catches up rather than paying one month per call, so a tick that was missed does not
 * lose a picture's money — the run is a function of how long it has been out, and this
 * settles the difference between that and what the ledger says.
 */
export function payWhatIsDue(sim: Simulation, project: Project, at: Instant = sim.now): Money {
  if (project.releasedAt === undefined || project.takeCents === undefined) return 0;
  const company = parentCompany(sim.universe);
  const cash = company ? cashAccountFor(sim.universe, company.id) : undefined;
  if (!cash) return 0;

  // Whole months out, counting the opening month as the first.
  const out = Math.min(PAYS_FOR_MONTHS, monthsOut(project.releasedAt, at, sim.homeZone) + 1);
  let posted = 0;
  for (let month = monthsPaid(sim, project.id) + 1; month <= out; month += 1) {
    const owed = paysInMonth(project.takeCents, month);
    if (owed <= 0) continue;
    sim.post({
      memo: `${project.title}, month ${month}`,
      category: 'business',
      postings: [
        { accountId: takings(sim), amount: -owed },
        { accountId: cash.id, amount: owed },
      ],
      refType: 'project',
      refId: project.id,
    });
    posted += owed;
  }
  return posted;
}

/**
 * Whole calendar months between two instants.
 *
 * Counted rather than divided. The first version divided the gap by an average month
 * length, which disagreed with `addMonths` — the helper the rest of this build uses
 * for exactly this — by up to a day per month, and a test walking five months forward
 * got four. Over a ten-month run the drift is a whole payment.
 */
function monthsOut(from: Instant, to: Instant, zone: string): number {
  if (to <= from) return 0;
  const a = zonedParts(from, zone);
  const b = zonedParts(to, zone);
  const months = (b.year - a.year) * 12 + (b.month - a.month);
  // Not a whole month until the day of the month comes round again.
  return Math.max(0, b.day >= a.day ? months : months - 1);
}

/** Whether a run still has anything left to pay. */
export const stillPaying = (sim: Simulation, project: Project): boolean =>
  project.releasedAt !== undefined && monthsPaid(sim, project.id) < PAYS_FOR_MONTHS;

export function registerRelease(sim: Simulation): void {
  sim.onSchedule(RELEASE_MONTH_KIND, (item, s) => {
    for (const project of onRelease(s)) {
      const paid = payWhatIsDue(s, project, item.at);
      if (paid > 0 && monthsPaid(s, project.id) >= PAYS_FOR_MONTHS) {
        s.notify({
          category: 'business',
          title: `${project.title} Has Finished Paying`,
          body: `${project.title} took what it was going to take. What it cost and what it `
            + 'returned are both in the books now.',
          importance: 55,
        });
      }
    }
    s.schedule({
      at: startOfNextMonth(item.at, s.homeZone),
      kind: RELEASE_MONTH_KIND,
      label: 'What Is Still Paying',
      category: 'system',
      priority: 9,
    });
  });

  if (!sim.universe.scheduled.some((one) => one.kind === RELEASE_MONTH_KIND && one.status === 'pending')) {
    sim.schedule({
      at: startOfNextMonth(sim.now, sim.homeZone),
      kind: RELEASE_MONTH_KIND,
      label: 'What Is Still Paying',
      category: 'system',
      priority: 9,
    });
  }
}

/**
 * What a picture would take if it opened now, for a screen that wants to say so.
 *
 * The ceiling comes from the material it was made from, not from the project, because
 * an audience was never going to care what the studio spent. A project with no holding
 * behind it reaches nobody — which cannot happen through the commands, since
 * developing requires a property, and is the honest answer if it ever did.
 */
export function wouldTake(sim: Simulation, project: Project): Money {
  const holding = project.holdingId ? sim.universe.holdings[project.holdingId] : undefined;
  const reach = holding ? whatItCouldReach(holding.demands, holding.appeal) : 0;
  const rng = sim.rng('release', project.id);
  return reckon(reach, craftOf(sim, project), rng.next());
}
