/**
 * SLATE — the doors that shut behind a picture, in the order they shut.
 *
 * The production system this replaces had three locks. They were written by a `shut()`
 * that appended an id, nothing ever removed one, and each was justified by a sentence
 * about somebody having priced their deal against the thing they were told about. The
 * reasoning was right. The implementation was the crudest possible expression of it:
 * everything was permanent from the first commitment, so there was no soft period at
 * all and no decision about when to harden.
 *
 * ## Reversibility decays, and the player chooses when
 *
 * A lock here can be **undone at a stated price**, for as long as nothing downstream
 * depends on it. What ends that is not a timer — it is a later commitment. Certain
 * locks **foreclose** named earlier reversals, permanently, and say which ones before
 * they are taken.
 *
 * That shape is the whole idea. Early decisions stay soft because nothing rests on
 * them yet; the moment real money is committed, everything upstream has to harden,
 * because a department that has been told its budget is entitled to have that be
 * true. The fiction and the mechanic are the same sentence, which is the mark of a
 * rule worth having.
 *
 * ## Two links, and why not more yet
 *
 * A chain of one is not a chain, and a `forecloses` relation with nothing to relate is
 * a declared word with no reader — the defect this build fails its own gate on. So the
 * first two arrive together: the budget hardens, and the greenlight forecloses its
 * reopening because the money has gone out. Further links land with the systems that
 * justify them.
 */

import type { Money } from '../core/money';

export interface Lock {
  id: string;
  label: string;
  /**
   * Where it sits in the chain.
   *
   * A lock may only be taken once everything below it is shut, which is what makes
   * this a sequence rather than a set of independent switches.
   */
  order: number;
  /** What it freezes, named so a confirmation can list them rather than say "changes". */
  freezes: readonly string[];
  /**
   * Earlier locks whose reversal this one removes for good.
   *
   * Named rather than implied, because the player is told exactly which doors they
   * are closing before they close them — "these two specific reversals go" is a
   * briefing, and "this is permanent" is only a warning.
   */
  forecloses: readonly string[];
  /**
   * What undoing it costs, as a share of the picture's budget.
   *
   * A share rather than a figure, because going back on what a department was told
   * costs in proportion to what it was told. Zero means it cannot be undone at all,
   * which is what the last link in a chain means.
   */
  undoShare: number;
}

export const LOCKS: readonly Lock[] = [
  {
    id: 'budget',
    label: 'The Budget',
    order: 1,
    freezes: ['who is hired into each department', 'what the picture costs'],
    forecloses: [],
    // Reopening means going back to every department and saying the number moved.
    // Small enough to be worth doing when you were wrong, large enough that being
    // wrong twice is felt.
    undoShare: 0.02,
  },
  {
    id: 'greenlit',
    label: 'The Greenlight',
    order: 2,
    freezes: ['the schedule', 'the delivery date'],
    forecloses: ['budget'],
    // Nothing. The money has left the company; there is no version of this that a
    // fee reverses, and pretending otherwise would make the commitment a gesture.
    undoShare: 0,
  },
];

export const LOCK_BY_ID: Readonly<Record<string, Lock>> =
  Object.fromEntries(LOCKS.map((one) => [one.id, one]));

/** The locks in the order they have to be taken. */
export const inOrder = (): readonly Lock[] => [...LOCKS].sort((a, b) => a.order - b.order);

/** Whether every lock below this one has been shut. */
export function readyFor(lock: Lock, shut: readonly string[]): boolean {
  return inOrder()
    .filter((one) => one.order < lock.order)
    .every((one) => shut.includes(one.id));
}

/**
 * Whether a lock can still be reopened, given everything that is shut.
 *
 * Two ways to be unreopenable: it cannot be undone at any price, or something taken
 * later has foreclosed it. The second is the interesting one and is why this reads
 * the whole set rather than one entry.
 */
export function canReopen(lock: Lock, shut: readonly string[]): boolean {
  if (lock.undoShare <= 0) return false;
  return !LOCKS.some((one) => shut.includes(one.id) && one.forecloses.includes(lock.id));
}

/** Which shut locks would lose their reversal if this one were taken. */
export function wouldForeclose(lock: Lock, shut: readonly string[]): readonly Lock[] {
  return lock.forecloses
    .filter((id) => shut.includes(id))
    .map((id) => LOCK_BY_ID[id]!)
    .filter((one) => one.undoShare > 0);
}

/** What reopening one costs against a budget. */
export const undoCosts = (lock: Lock, budgetCents: Money): Money =>
  Math.round(budgetCents * lock.undoShare);
