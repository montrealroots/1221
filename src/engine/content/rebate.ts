/**
 * SLATE — claiming Iceland's production reimbursement on your own picture.
 *
 * `content/incorporation.ts` holds the law: who runs it, what the two rates
 * are, the conditions on the higher one, and the date the whole scheme is
 * legislated to stop. This holds everything the law does not say and a
 * production has to know anyway — what a claim costs to make, what share of a
 * negative is bought outside the country whatever you do, and the reasons a
 * claim is refused.
 *
 * ## Why this exists at all
 *
 * The lot has weighed this reimbursement since the day it was built: every
 * enquiry from abroad sets what Iceland gives back against what coming here
 * costs, and books elsewhere when the arithmetic says to. The family's own
 * pictures, shot on the family's own stages by an Icelandic company, claimed
 * nothing. That was backwards. The people with the most straightforward claim
 * in the country were the only ones in the save not making it.
 *
 * ## The mechanism, which is the part worth having
 *
 * You apply before a foot of film is shot, or you do not apply. You spend. An
 * Icelandic auditor certifies what was spent in Iceland, at your cost. The
 * state pays a share of the certified figure back, months after the picture is
 * finished. Four things fall out of that and every one of them is a decision:
 *
 *   - A deadline that closes on the first day of photography and never reopens.
 *   - A cliff between twenty-five and thirty-five percent with three conditions
 *     under it and five things to test, one of which is a question about how
 *     many people the picture actually employs.
 *   - A reason to hire in the country beyond what the flights cost, because
 *     money paid where somebody lives is not money spent here.
 *   - A scheme with an end date, which every plan made against it is priced on.
 */

import type { Money } from '../core/money';

// ---------------------------------------------------------------------------
// What a claim costs to make
// ---------------------------------------------------------------------------

export const THE_CLAIM = {
  /**
   * The ministry's own name for the file, and what it is called on a screen.
   */
  label: 'The Reimbursement Claim',
  /**
   * What preparing the application costs, flat.
   *
   * A claim is a budget broken down by what will be spent in Iceland, a
   * schedule, and a company that can prove it exists — a fortnight of the
   * production accountant's time before the picture has shot a frame. Flat
   * because the work is the same on a small picture and a large one, which is
   * exactly why it weighs on a small picture and not on a large one.
   */
  filingCents: 6_000_00 as Money,
  /**
   * The auditor's fee, as a share of what they certify.
   *
   * Charged when the claim is filed and not when it is applied for, because
   * the audit is work done against a finished set of books. Applying is a form;
   * this is the bill.
   */
  auditedAt: 0.006,
  /** The smallest the auditor's fee gets, however little there is to certify. */
  auditFloorCents: 900_00 as Money,
  /**
   * The share of a negative bought outside the country whatever the production
   * does about it.
   *
   * A picture made on the family's own lot with an Icelandic crew still hires a
   * camera package from a rental house in London, still finishes somewhere with
   * a room that can do it, and still places its cover through a broker who is
   * not here. That share is never certified and no decision moves it, which is
   * why it is one number and not a system. Everything a decision does move is
   * counted separately below.
   */
  leaks: 0.14,
  /**
   * Of a fee paid to a performer who lives somewhere else, the share that
   * lands where they live.
   *
   * Their agent, their manager, their lawyer and the company the fee is
   * actually invoiced by are all at home, and none of it is spent in Iceland.
   * The rest is: they are working here, on an Icelandic payroll, for the run.
   * It is the second half of what local hire is worth — the flights are what
   * bringing them costs, and this is what bringing them fails to earn back.
   */
  awayOfAFee: 0.4,
} as const;

// ---------------------------------------------------------------------------
// The conditions on the higher rate
// ---------------------------------------------------------------------------

/**
 * What a production puts up against the higher rate's conditions.
 *
 * Three conditions in the law and five things to test, because two of the three
 * have two parts: days in the country of which some must be shooting days, and
 * people taxed here for a number of days each. `REBATE.higherNeeds` carries all
 * five and `shortOn` below tests all five, so five is the number this interface
 * has and the number a screen prints.
 *
 * Saying "four" would be the fault this project has already made once and
 * written into its own trap list: a count in a comment that no longer matches
 * the constant beside it. There is a test that holds these three numbers —
 * the fields on `higherNeeds`, the labels below, and what `shortOn` can push —
 * to the same value, because the one thing certain about a hand-written count
 * is that it will stop being true.
 *
 * One shape for both askers, because there is one rule. An enquiry from abroad
 * fills this in from what it says it will spend and how long it will be here;
 * the family's own picture fills it in from what it has actually done. The
 * crew limb reads differently for each and means the same thing either way:
 * fifty people on an Icelandic payroll for fifty days. A foreign production is
 * asking whether the country can supply them. A domestic one is asking whether
 * the picture is big enough to employ them.
 */
export interface Limbs {
  /** What will be spent in Iceland, in króna. */
  spendIsk: number;
  /** Working days in the country, across the whole of it. */
  workingDays: number;
  /** Of those, the days a camera runs. */
  shootingDays: number;
  /** People working on it and taxed here. */
  crew: number;
  /** For how long, in working days. */
  crewDays: number;
}

/**
 * Which limbs this production fails, in the order they are legislated.
 *
 * Returning the failures instead of a boolean is what lets a screen say which
 * one is in the way, and a producer who knows they are eight people short of
 * the higher rate has a decision. A producer told only that they did not
 * qualify has a shrug.
 */
export function shortOn(limbs: Limbs, needs: Limbs): (keyof Limbs)[] {
  const short: (keyof Limbs)[] = [];
  if (limbs.spendIsk < needs.spendIsk) short.push('spendIsk');
  if (limbs.workingDays < needs.workingDays) short.push('workingDays');
  if (limbs.shootingDays < needs.shootingDays) short.push('shootingDays');
  if (limbs.crew < needs.crew) short.push('crew');
  if (limbs.crewDays < needs.crewDays) short.push('crewDays');
  return short;
}

/** What each condition is called where one of them has to be named. */
export const LIMB_LABELS: Record<keyof Limbs, string> = {
  spendIsk: 'Icelandic Spend',
  workingDays: 'Working Days Here',
  shootingDays: 'Shooting Days',
  crew: 'Crew Taxed Here',
  crewDays: 'Days They Are On It',
};

// ---------------------------------------------------------------------------
// Why a claim cannot be made
// ---------------------------------------------------------------------------

export type WhyNot = 'no-books' | 'too-late' | 'scheme-ended' | 'already' | 'no-dates';

export interface Refusal {
  id: WhyNot;
  /** Said to the producer, in the world's words. */
  said: string;
}

/**
 * Every way a claim fails before it is made.
 *
 * `too-late` is the one that matters and the one a player will meet. It is not
 * a penalty invented to give the calendar teeth: the scheme genuinely will not
 * look at an application filed after photography has begun, on the grounds that
 * a reimbursement which did not change the decision to shoot here was never an
 * incentive. A quarter of the negative is the price of having forgotten.
 */
export const REFUSALS: readonly Refusal[] = [
  {
    id: 'no-books',
    said: 'The claim is audited, and the company can’t be audited yet.',
  },
  {
    id: 'too-late',
    said: 'The camera has turned over. The application closed on the first day of photography.',
  },
  {
    id: 'scheme-ended',
    said: 'The scheme has an end date in law, and this picture shoots after it.',
  },
  {
    id: 'already',
    said: 'This picture has already applied.',
  },
  {
    id: 'no-dates',
    said: 'There are no dates on this picture yet, and an application is a schedule.',
  },
];

export const refusalById = (id: WhyNot): Refusal | undefined =>
  REFUSALS.find((one) => one.id === id);
