/**
 * SLATE — applying for the reimbursement, and being paid it.
 *
 * `content/incorporation.ts` holds the law and `content/rebate.ts` holds what
 * making a claim costs. This is the claim itself: the door it goes through, the
 * deadline it dies on, the arithmetic of what was spent here, the cliff between
 * the two rates, and the money landing half a year after the picture is
 * finished.
 *
 * ## One rule, two askers
 *
 * `world/lot.ts` has weighed the higher rate's four conditions since the lot
 * was built, for productions enquiring from abroad. This weighs the same four
 * for the family's own pictures, through the same `shortOn` in content, so
 * there is one legislated test and not two implementations of it drifting
 * apart. What differs is what each asker puts up against the crew condition,
 * and the difference is real: a foreign production is asking whether Iceland
 * can supply fifty people, and a domestic one is asking whether its own picture
 * employs them.
 *
 * ## Why nothing here draws
 *
 * A player can compute this, exactly, before committing to it. That is
 * deliberate and it is the opposite of most of what SLATE models: a
 * reimbursement is a planning instrument, and an instrument whose value is
 * drawn at the last moment cannot be planned against. The uncertainty in the
 * real thing sits with the auditor, who disallows lines — which is a decision
 * somebody makes about your books, and it is named in the coverage matrix as
 * something this build does not have.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../domain/model';
import type { Money } from '../core/money';
import type { Instant } from '../core/time';
import type { Project } from '../domain/company';
import { instantFromZoned } from '../core/time';
import { REBATE } from '../content/incorporation';
import { LIMB_LABELS, THE_CLAIM, type Limbs, type WhyNot, refusalById, shortOn } from '../content/rebate';
import { formatMoney } from '../core/money';
import { ISK_A_EURO, MS_WEEK } from './lot';
import { baseWindowOf } from './periods';
import { capabilitiesOf } from './company';
import { crewDaysOf, headcountOf } from './crew';
import { fromWhere } from './casting';
import { estateCity } from '../content/estate';

export const CLAIM_KIND = 'project.rebate';

// ---------------------------------------------------------------------------
// The dates the claim turns on
// ---------------------------------------------------------------------------

/**
 * The first day a camera runs on this picture.
 *
 * The period the plan names as its base — the shoot on a feature, the field on
 * an unscripted season — because a season that never shoots a scripted page
 * still has a first day and still qualifies. This read the base off `per === 1`
 * for about an hour, which found the rig on a format season: the application
 * would have closed weeks before anybody pointed a camera at anything, on a
 * period that runs alongside casting.
 */
export function turnsOverOn(project: Project): Instant | undefined {
  return baseWindowOf(project)?.from;
}

/** The last day the scheme exists in law, as an instant. */
export function schemeEndsAt(): Instant {
  return instantFromZoned(
    { ...REBATE.endsOn, hour: 23, minute: 59 },
    estateCity().timeZone,
  );
}

// ---------------------------------------------------------------------------
// What was spent here
// ---------------------------------------------------------------------------

/**
 * Of what the cast has been paid, the share that lands where they live.
 *
 * The fee and only the fee. What it cost to fly somebody here is already
 * recorded on the picture as it left the country, and counting it again here
 * would take the flights off the certificate twice — which is what the first
 * version of this did, and what the arithmetic in the tests caught it doing.
 * One fact, one place.
 *
 * Read off the seats, so it moves with who was cast and with nothing else. A
 * part filled from Reykjavík contributes nought. A released seat still counts:
 * the money was paid and it still went where it went.
 */
export function awayOnTheCast(sim: Simulation, project: Project): Money {
  let away = 0;
  for (const seat of project.cast ?? []) {
    const person = sim.universe.people[seat.personId];
    if (!person) continue;
    const from = fromWhere(person);
    if (!from || from.travel === 0) continue;
    away += Math.round(seat.feeCents * THE_CLAIM.awayOfAFee);
  }
  return away;
}

/**
 * What an auditor would certify as Icelandic spend, as things stand today.
 *
 * Everything that has gone out, less the three things that are not Icelandic
 * spend: what was recorded leaving the country as it left, what the cast took
 * home, and the share of any negative that is bought abroad whatever anybody
 * decides. Built off `spentCents` and not off the budget, so a picture that has
 * spent half of what it was greenlit for can only claim on half.
 */
export function certifiable(sim: Simulation, project: Project): Money {
  const ordinary = Math.round((project.budgetCents ?? 0) * THE_CLAIM.leaks);
  const spent = project.spentCents
    - (project.notSpentHereCents ?? 0)
    - awayOnTheCast(sim, project)
    - ordinary;
  return Math.max(0, spent);
}

/** The same figure in króna, which is the unit the four conditions are written in. */
export const inKrona = (cents: Money): number => Math.round((cents / 100) * ISK_A_EURO);

// ---------------------------------------------------------------------------
// Which rate
// ---------------------------------------------------------------------------

/**
 * What this picture puts up against the higher rate's four conditions.
 *
 * The spend limb reads what is certifiable, which on a picture yet to shoot is
 * close to nothing — so an application is weighed against what the picture was
 * greenlit for, and the claim is paid on what it actually spent. That is how
 * the real thing works and it is where the risk in aiming at the higher rate
 * lives: the tier is stamped on a budget and the money arrives on a set of
 * books.
 */
export function limbsOf(sim: Simulation, project: Project, on: 'plan' | 'books'): Limbs {
  const budget = project.budgetCents ?? 0;
  const weeks = shootWeeksOf(project);
  const spend = on === 'plan'
    ? Math.max(0, budget - Math.round(budget * THE_CLAIM.leaks) - awayOnTheCast(sim, project))
    : certifiable(sim, project);
  return {
    spendIsk: inKrona(spend),
    workingDays: Math.round(wholeRunWeeks(project) * 5),
    shootingDays: Math.round(weeks * 5),
    crew: headcountOf(budget),
    crewDays: crewDaysOf(weeks),
  };
}

/** How many weeks the base period runs to, which is the number a producer chose. */
export function shootWeeksOf(project: Project): number {
  const window = baseWindowOf(project);
  if (!window) return 0;
  return Math.round((window.to - window.from) / MS_WEEK);
}

/** How long the whole picture is at work, from the first date on it to the last. */
export function wholeRunWeeks(project: Project): number {
  const periods = project.periods ?? [];
  if (periods.length === 0) return 0;
  const from = periods.reduce((n, one) => Math.min(n, one.from), periods[0]!.from);
  const to = periods.reduce((n, one) => Math.max(n, one.to), periods[0]!.to);
  return Math.round((to - from) / MS_WEEK);
}

/** Which conditions this picture is short on, if any. */
export function shortOnFor(sim: Simulation, project: Project, on: 'plan' | 'books'): (keyof Limbs)[] {
  return shortOn(limbsOf(sim, project, on), REBATE.higherNeeds);
}

/** The rate this picture would be accepted at today. */
export function rateFor(sim: Simulation, project: Project, on: 'plan' | 'books'): number {
  return shortOnFor(sim, project, on).length === 0 ? REBATE.higherShare : REBATE.share;
}

/** What the claim is worth, at the rate it holds and on the books as they stand. */
export function worthToday(sim: Simulation, project: Project): Money {
  const share = project.rebate?.shareAt ?? rateFor(sim, project, 'plan');
  return Math.round(certifiable(sim, project) * share);
}

/** What the auditor takes out of it. */
export function auditorsFee(certified: Money): Money {
  return Math.max(THE_CLAIM.auditFloorCents, Math.round(certified * THE_CLAIM.auditedAt));
}

// ---------------------------------------------------------------------------
// Applying
// ---------------------------------------------------------------------------

/** Whether this picture can still apply, and why if it cannot. */
export function whyNot(sim: Simulation, project: Project): WhyNot | undefined {
  if (project.rebate) return 'already';
  const turnsOver = turnsOverOn(project);
  if (turnsOver === undefined) return 'no-dates';
  if (sim.now >= turnsOver) return 'too-late';
  if (turnsOver > schemeEndsAt()) return 'scheme-ended';
  const door = capabilitiesOf(sim).find((one) => one.id === 'claim_rebate');
  if (door && !door.can) return 'no-books';
  return undefined;
}

/** The company's cash account, which is what the filing comes out of. */
function cashFor(sim: Simulation, companyId: Id): Id | undefined {
  return Object.values(sim.universe.accounts)
    .find((a) => a.ownerId === companyId && a.kind === 'company_cash' && !a.closedAt)?.id;
}

export interface Applied {
  shareAt: number;
  short: (keyof Limbs)[];
}

/**
 * Files an application, which stamps a rate on the picture and costs the office
 * a fortnight of the accountant.
 *
 * The rate is stamped here on the plan and not recomputed at payment. A
 * producer who wanted the higher rate had to have built a picture that reaches
 * all four conditions by the day the camera turns over, and finding out
 * afterwards is finding out too late.
 */
export function applyForRebate(
  sim: Simulation, projectId: Id,
): { ok: true; applied: Applied } | { ok: false; error: string } {
  const project = sim.universe.projects[projectId];
  if (!project) return { ok: false, error: 'There’s no such picture on the slate.' };
  const refused = whyNot(sim, project);
  if (refused) {
    const said = refusalById(refused)?.said ?? 'The claim cannot be made.';
    return { ok: false, error: `${project.title}: ${said}` };
  }

  const short = shortOnFor(sim, project, 'plan');
  const shareAt = short.length === 0 ? REBATE.higherShare : REBATE.share;
  project.rebate = { appliedAt: sim.now, shareAt };

  const account = cashFor(sim, project.companyId);
  if (account) {
    sim.expense(account, THE_CLAIM.filingCents, `${project.title}: ${THE_CLAIM.label}`, 'business',
      { refType: 'project', refId: project.id });
    project.spentCents += THE_CLAIM.filingCents;
  }

  sim.notify({
    category: 'business',
    title: `${project.title}: Applied For The Reimbursement`,
    body: short.length === 0
      ? `Accepted at ${Math.round(shareAt * 100)}%, the higher of the two rates. `
        + 'It’s paid on what an auditor certifies, months after the picture is finished.'
      : `Accepted at ${Math.round(shareAt * 100)}%. The higher rate wanted `
        + `${short.map((one) => LIMB_LABELS[one].toLowerCase()).join(' and ')}, and this picture is short.`,
    importance: 55,
    refType: 'project',
    refId: project.id,
  });
  return { ok: true, applied: { shareAt, short } };
}

// ---------------------------------------------------------------------------
// Being paid
// ---------------------------------------------------------------------------

/**
 * Puts the payment on the calendar, months after the picture was delivered.
 *
 * Called at delivery and nowhere else, because a claim is made against a
 * finished production. A picture that never applied has nothing scheduled and
 * that silence is correct: the deadline was the first day of photography and it
 * passed a long time ago.
 */
export function armTheClaim(sim: Simulation, project: Project): void {
  if (!project.rebate || project.rebate.paidAt !== undefined) return;
  // And never twice. A picture can reach delivery more than once — a withdrawn
  // consent sends a finished part back down the ladder and it is delivered
  // again — and a second entry on the calendar for one claim would be the state
  // paying for the same certificate twice.
  const already = sim.universe.scheduled.some(
    (one) => one.kind === CLAIM_KIND && one.status === 'pending' && one.refId === project.id,
  );
  if (already) return;
  const at = sim.now + Math.round(REBATE.paidAfterMonths * 4.345 * MS_WEEK);
  sim.schedule({
    at,
    kind: CLAIM_KIND,
    label: `${project.title}: ${THE_CLAIM.label}`,
    category: 'business',
    priority: 60,
    refType: 'project',
    refId: project.id,
    payload: { projectId: project.id },
  });
}

/**
 * Certifies the spend, pays the auditor and takes the state's money in.
 *
 * Both sides on the same day, because they are the same event: the certificate
 * is what the ministry pays against and the auditor is paid for producing it.
 * Netting them would hide the fee, and the fee is the reason a very small
 * picture's claim is barely worth making.
 */
export function payTheClaim(sim: Simulation, project: Project): Money {
  const claim = project.rebate;
  if (!claim || claim.paidAt !== undefined) return 0;
  const certified = certifiable(sim, project);
  const paid = Math.round(certified * claim.shareAt);
  const fee = auditorsFee(certified);

  claim.certifiedCents = certified;
  claim.paidCents = paid;
  claim.paidAt = sim.now;

  const account = cashFor(sim, project.companyId);
  if (account) {
    sim.expense(account, fee, `${project.title}: The Auditor’s Certificate`, 'business',
      { refType: 'project', refId: project.id });
    project.spentCents += fee;
    if (paid > 0) {
      sim.income(account, paid, `${project.title}: ${THE_CLAIM.label}`, 'business',
        { refType: 'project', refId: project.id });
    }
  }

  sim.notify({
    category: 'business',
    title: `${project.title}: The Reimbursement Lands`,
    body: `${formatMoney(certified, { cents: false })} certified as spent in Iceland, `
      + `${Math.round(claim.shareAt * 100)}% of it back, `
      + `less ${formatMoney(fee, { cents: false })} for the certificate.`,
    importance: 60,
    refType: 'project',
    refId: project.id,
  });
  return paid;
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

export function registerRebate(sim: Simulation): void {
  sim.onSchedule(CLAIM_KIND, (item) => {
    const projectId = String(item.payload?.projectId ?? '');
    const project = sim.universe.projects[projectId];
    if (!project) return;
    payTheClaim(sim, project);
  });

  sim.onCommand<{ projectId: Id }, { ok: boolean; shareAt?: number; error?: string }>(
    'company.claim_rebate', (payload, { sim: s }) => {
      const done = applyForRebate(s, payload.projectId);
      return done.ok ? { ok: true, shareAt: done.applied.shareAt } : { ok: false, error: done.error };
    },
  );
}

/** Where the claim stands, in a sentence. */
export function whereTheClaimStands(sim: Simulation, project: Project): string {
  const claim = project.rebate;
  if (!claim) {
    const refused = whyNot(sim, project);
    if (refused === 'too-late') {
      return `${project.title} never applied, and the camera has turned over. `
        + 'The state pays nothing on this one.';
    }
    if (refused) return `${project.title} hasn’t applied. ${refusalById(refused)?.said ?? ''}`.trim();
    const short = shortOnFor(sim, project, 'plan');
    const rate = short.length === 0 ? REBATE.higherShare : REBATE.share;
    return `${project.title} has not applied yet. As planned it would go in at `
      + `${Math.round(rate * 100)}%`
      + `${short.length === 0 ? ', the higher of the two rates' : ''}.`;
  }
  if (claim.paidAt !== undefined) {
    return `${formatMoney(claim.paidCents ?? 0, { cents: false })} came back on ${project.title}, `
      + `on ${formatMoney(claim.certifiedCents ?? 0, { cents: false })} certified.`;
  }
  return `${project.title} is in at ${Math.round(claim.shareAt * 100)}%, `
    + `worth ${formatMoney(worthToday(sim, project), { cents: false })} on the books so far.`;
}
