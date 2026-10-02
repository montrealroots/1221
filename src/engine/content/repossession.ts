/**
 * SLATE — a car loan in default, and the car taken back (docs/WORLD.md, stage
 * 3e), from 2026-09-29, researched in docs/research/world/research-repossession.json.
 *
 * Only a loan secured on the car is taken back. SLATE's British and Irish car
 * loans are priced at the Bank of England's and the Central Bank's personal
 * loan rates, which are unsecured: there the arrears run, as any unsecured
 * debt's do. Mexico's secured loans are enforced before a notary or a court,
 * not by seizure, with no day counts found: none is kept. Where it is, by the
 * place's own law:
 * - New York (UCC 9-609): taken without a court; redeemed only by paying the
 *   whole balance (9-623); a sale's notice "reasonable" (9-612, SLATE's ten
 *   days for a consumer); the shortfall owed (9-615(d)).
 * - Connecticut (Gen. Stat. 36a-785): with no notice before, redeemed within
 *   15 days by paying only what's missed; sold no sooner than 15 days after;
 *   a shortfall owed only past the car's fair market value, SLATE's value
 *   standing in for NADA's.
 * - California (Civ. Code 2983.2, 2983.3): reinstated within 15 days by
 *   paying what's missed, once a year; the shortfall owed.
 * - Ontario (PPSA ss. 63, 64, 66): 15 days' notice of sale; redeemed by
 *   paying the balance; the shortfall owed. The Consumer Protection Act's
 *   two-thirds rule covers a dealer's financing, not a bank's loan.
 * - British Columbia (PPSA ss. 58, 59, 62, 67): not seized once two-thirds of
 *   the loan is paid; 20 days' notice; reinstated by paying what's missed;
 *   and seizing ends the debt, "seize or sue."
 * A surplus over what's owed comes back to the borrower. Default is three
 * payments missed running, SLATE's, a contract and not a law setting it; a
 * tow's $300 and $47.50 a day in storage are the middles of consumer sites'
 * ranges, secondary.
 */

import type { Jurisdiction } from './vehiclefees';

export interface RepoRule {
  noticeDays: number;
  /** What redeems it: what's missed, or the whole balance. */
  redeemBy: 'missed' | 'balance';
  /** The shortfall after a sale: owed, owed only past the car's value, or none. */
  shortfall: 'owed' | 'past-value' | 'none';
  /** No seizure once this share of the loan is paid. */
  protectedAt?: number;
  basis: string;
}

export const REPOSSESSION: Readonly<Partial<Record<Jurisdiction, RepoRule>>> = {
  'US-NY': { noticeDays: 10, redeemBy: 'balance', shortfall: 'owed', basis: 'New York’s UCC 9-609, 9-612, 9-615 and 9-623' },
  'US-CT': { noticeDays: 15, redeemBy: 'missed', shortfall: 'past-value', basis: 'Connecticut General Statutes 36a-785' },
  'US-CA': { noticeDays: 15, redeemBy: 'missed', shortfall: 'owed', basis: 'California Civil Code 2983.2 and 2983.3' },
  'CA-ON': { noticeDays: 15, redeemBy: 'balance', shortfall: 'owed', basis: 'Ontario’s Personal Property Security Act, ss. 63, 64 and 66' },
  'CA-BC': { noticeDays: 20, redeemBy: 'missed', shortfall: 'none', protectedAt: 2 / 3, basis: 'British Columbia’s Personal Property Security Act, ss. 58, 59, 62 and 67' },
};

export const DEFAULT_AFTER_MISSED = 3;
export const REPO_FEES_USD = { tow: 300, storagePerDay: 47.5 } as const;

/**
 * What the record takes. A car payment thirty days late is reported as a
 * mortgage's is, SLATE's same 70 points (`HOME.reportedFall`). A repossession
 * is reported for seven years (FCRA, 15 U.S.C. 1681c); myFICO publishes no
 * figure for what it costs a score, and the consumer sites' "about 100
 * points" is secondary, so SLATE takes it, the same as its charge-off.
 * Until 2026-09-29 neither touched the record.
 */
export const LOAN_LATE_ON_RECORD = 70;
export const REPOSSESSED_ON_RECORD = 100;
