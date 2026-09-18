/**
 * SLATE — which period a picture's dates hang off.
 *
 * One question, asked from six places: when does the camera run? The crew's
 * offsets count back from it, the casting office works to it, an offer cannot
 * be made behind it, the player's own availability is blocked out across it,
 * and the reimbursement's application closes on it.
 *
 * It lives in its own file because of who has to ask. `world/crew.ts` is called
 * by `world/making.ts` at the greenlight, so crew cannot import making back
 * without a cycle, and for a long time it carried its own copy of the lookup
 * with a comment explaining why. Six copies of a lookup is five chances to
 * answer the same question differently, and that is exactly what happened: two
 * readers hard-coded 'shooting' with 'field' behind it, two inferred the base
 * from `per === 1` and got the rig, and one hard-coded 'shooting' alone and so
 * hired nobody onto an unscripted season at all. A season was made by nobody
 * for as long as that stood, and every screen reported it as a season that had
 * not started hiring yet.
 *
 * So the plan names its base period, and this is the only thing that reads it.
 */

import type { Instant } from '../core/time';
import type { Project } from '../domain/company';
import { type Period, type Plan, planById } from '../content/making';

/** The period a plan is measured against, where the plan names one it has. */
export function basePeriodOf(plan: Plan | undefined): Period | undefined {
  if (!plan) return undefined;
  return plan.periods.find((one) => one.id === plan.basePeriod);
}

/** The same, for a project, by the plan it is being made to. */
export function basePeriodFor(project: Project): Period | undefined {
  return basePeriodOf(project.planId ? planById(project.planId) : undefined);
}

/**
 * The dates a picture's base period actually runs across.
 *
 * Nothing for a picture nobody has said yes to, which is the honest answer:
 * a title on the slate has no dates, and every caller here has to mean
 * something sensible by that rather than reach for a default.
 */
export function baseWindowOf(project: Project): { id: string; from: Instant; to: Instant } | undefined {
  const base = basePeriodFor(project);
  if (!base) return undefined;
  return project.periods?.find((one) => one.id === base.id);
}
