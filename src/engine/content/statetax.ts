/**
 * SLATE — what each state does with income tax a resident return leaves unpaid (from the integration pass of
 * 2026-10-10; docs/research/world/research-state-tax-collection.json). Until then a return kept one balance, federal and
 * state together, and the IRS's rules ran on all of it: an IRS payment plan took Connecticut's tax in, and the IRS's
 * notices and levy collected it.
 *
 * Every number here is the state's own where a source was found, and said as SLATE's where none was (`assumed`). A state
 * SLATE computes a tax for and has no researched rules for keeps its balance with no penalty, interest, notice or plan
 * (`STATE_UNRESEARCHED`), and says so: its rules aren't the IRS's copied over. In play a student lives and works in
 * Connecticut, and New York and California are reached by an unemployment claim or California's mandate.
 */
import type { Money } from '../core/money';

export type StateCode = 'us-ct' | 'us-ny' | 'us-ca';

/** The parts a payment goes to, in order. */
export type Part = 'tax' | 'penalty' | 'interest';

export interface StateRules {
  /** Who collects it, as a notice names it, and its short name. */
  agency: string;
  short: string;
  form: string;
  /** Interest on unpaid tax: a yearly rate, how it compounds, and whether it runs on penalties too. */
  interest: { yearly: number; how: 'daily' | 'monthly-simple'; onPenalty: boolean };
  /**
   * The late-payment penalty, on tax unpaid at the due date: a one-time share, then a share a month or part, to a cap,
   * for at most so many months.
   */
  payLate: { once: number; monthly: number; cap: number; months?: number };
  /** The late-filing penalty on a return filed after its due date with tax unpaid: a share a month or part, to a cap; the minimum past 60 days (the lesser of it and the tax); and how it meets the late-payment penalty. */
  fileLate: { monthly: number; cap: number; minimum?: Money; combine: 'reduced-by-payment' | 'greater-of' | 'none' };
  /** The order a part payment is applied in, and whether it's the state's or SLATE's. */
  order: readonly Part[];
  orderAssumed: boolean;
  /** Its notices, in order, each so many days after the last (the first after the bill at filing); then a levy on the bank. */
  notices: readonly { code: string; title: string; words: string; days: number }[];
  /** The levy: days after the last notice (the notice of intent's own days where it has them), then again while anything's owed. */
  levy: { title: string; afterDays: number; againDays: number; fee?: Money };
  /** Whether a notice's timing is the state's (found) or SLATE's. */
  timingAssumed: boolean;
  /** Its payment plan for an individual. */
  plan: {
    name: string; max: Money; minMonths: number; maxMonths: number; fee: Money; feeAdded: boolean;
    /** How long a decision takes; SLATE's where the state's wasn't found. */
    decideDays: number; decideAssumed: boolean;
    /** A missed payment: cured by the next due date (New York), or a notice and so many days before it ends (California), or ended at once (SLATE's where nothing was found). */
    cure: { kind: 'next-due' } | { kind: 'notice'; days: number } | { kind: 'none' };
    cureAssumed: boolean;
    /** A new balance while it stands puts it in default (California's terms), or joins it (SLATE's where nothing was found). */
    newBalance: 'default' | 'joins';
    newBalanceAssumed: boolean;
    /** Refusals: under a warrant or a levy already (Connecticut's), every return filed. */
    notInCollection: boolean;
  };
  /** The share of a year's refund a state keeps for another year's balance first: all of it (each state's offset law). */
  offsetsOwnRefunds: true;
  /** When a refund comes, SLATE's estimate where the state's wasn't researched. */
  refundDays: number;
  source: string;
}

/**
 * The three states SLATE has researched. A month is 30.4375 days, the IRS's in this engine; "or part of a month" is read
 * as a month begun.
 */
export const STATE_TAX: Readonly<Record<StateCode, StateRules>> = {
  'us-ct': {
    agency: 'Connecticut Department of Revenue Services', short: 'Connecticut DRS', form: 'CT-1040',
    // 1% a month or part, simple, on the tax only (Conn. Gen. Stat. 12-735(b)).
    interest: { yearly: 0.12, how: 'monthly-simple', onPenalty: false },
    // 10% of the tax unpaid by the due date, once; no monthly penalty and no further cap (12-735(a)).
    payLate: { once: 0.1, monthly: 0, cap: 0.1 },
    // No separate late-filing penalty on a return with tax due: the 10% covers both (DRS).
    fileLate: { monthly: 0, cap: 0, combine: 'none' },
    // Penalty, then interest, then tax, whatever the payer asks (12-39h).
    order: ['penalty', 'interest', 'tax'], orderAssumed: false,
    // DRS's bills before its notice of intent weren't found: SLATE's bill and reminder thirty days apart, then the
    // statute's thirty-day notice of intent before a bank levy (12-35).
    notices: [
      { code: 'DRS bill', title: 'A Bill From Connecticut DRS', words: 'the tax, its 10% penalty and 1% a month of interest are due.', days: 30 },
      { code: 'Notice of intent to levy', title: 'Connecticut DRS Intends To Levy', words: 'in 30 days it may take what you owe from your bank accounts by warrant.', days: 30 },
    ],
    levy: { title: 'Connecticut DRS Levied Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    // myconneCT: up to $50,000, two to twelve months, every return filed, not in collection or under warrant. Its fee,
    // decision time, what a missed payment does and whether a new balance joins weren't found: SLATE's, said.
    plan: { name: 'Installment Agreement', max: 50_000_00, minMonths: 2, maxMonths: 12, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: true, newBalance: 'joins', newBalanceAssumed: true, notInCollection: true },
    offsetsOwnRefunds: true, refundDays: 21,
    source: 'Conn. Gen. Stat. 12-735, 12-39h, 12-35, 12-739; portal.ct.gov/drs (payment plans, refund offsets); research-state-tax-collection.json',
  },
  'us-ny': {
    agency: 'New York State Department of Taxation and Finance', short: 'New York DTF', form: 'IT-201',
    // 9.5% a year for October to December 2026, compounded daily; on a penalty only after notice and demand, which
    // SLATE doesn't track to the day, so on the tax only (Tax Law 697(j)).
    interest: { yearly: 0.095, how: 'daily', onPenalty: false },
    // 0.5% a month or part, to 25% (685(a)(2)).
    payLate: { once: 0, monthly: 0.005, cap: 0.25 },
    // 5% a month or part to 25%, less the late-payment penalty in the same months; past 60 days at least the lesser of
    // $100 and the tax (685(a)(1), (a)(3)).
    fileLate: { monthly: 0.05, cap: 0.25, minimum: 100_00, combine: 'reduced-by-payment' },
    // The order a part payment goes in wasn't found: SLATE's, the tax first.
    order: ['tax', 'penalty', 'interest'], orderAssumed: true,
    // A bill, the Notice and Demand (DTF-966-E), a tax warrant, then an income execution or levy (DTF-978). The days
    // between weren't found: SLATE's.
    notices: [
      { code: 'DTF bill', title: 'A Bill From New York State', words: 'the tax, the penalty and interest are due.', days: 30 },
      { code: 'DTF-966-E', title: 'Notice And Demand From New York State', words: 'New York may now begin collection, a tax warrant first.', days: 30 },
      { code: 'Tax warrant', title: 'New York Filed A Tax Warrant', words: 'it’s a public lien on what you own; a levy on your bank accounts comes next.', days: 30 },
    ],
    levy: { title: 'New York Levied Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    // Online: $20,000 or less in 36 months or fewer, no fee; a missed payment is a default only if not made up by the
    // next due date, and a thirty-day notice comes before it ends. Penalty and interest go on. How long a decision takes
    // and whether a new balance joins weren't found: SLATE's.
    plan: { name: 'Installment Payment Agreement', max: 20_000_00, minMonths: 1, maxMonths: 36, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'next-due' }, cureAssumed: false, newBalance: 'joins', newBalanceAssumed: true, notInCollection: false },
    offsetsOwnRefunds: true, refundDays: 21,
    source: 'NY Tax Law 685, 697(j), 1312(a); tax.ny.gov (interest rates, IPA, collection, Pub 131); research-state-tax-collection.json',
  },
  'us-ca': {
    agency: 'California Franchise Tax Board', short: 'California FTB', form: '540',
    // 7% a year for July to December 2026, compounded daily, on tax, interest and penalties (R&TC 19101, 19521).
    interest: { yearly: 0.07, how: 'daily', onPenalty: true },
    // 5% once, then 0.5% a month or part for at most 40 months, to 25% (19132).
    payLate: { once: 0.05, monthly: 0.005, cap: 0.25, months: 40 },
    // 5% a month or part to 25%, at least the lesser of $135 and the tax; the larger of it and the late-payment penalty,
    // not both (19131, 19132).
    fileLate: { monthly: 0.05, cap: 0.25, minimum: 135_00, combine: 'greater-of' },
    order: ['tax', 'penalty', 'interest'], orderAssumed: true,
    // A Statement of Tax Due, then Income Tax Due (FTB 4963), then the Final Notice Before Levy (FTB 4966), thirty to
    // forty-five days apart; then an Order to Withhold on the bank, with its $362 collection fee (FTB's Collection
    // Procedure Manual, medium confidence).
    notices: [
      { code: 'Statement of Tax Due', title: 'A Statement Of Tax Due From California', words: 'the tax, the penalty and interest are due.', days: 35 },
      { code: 'FTB 4963', title: 'Income Tax Due: California', words: 'a second notice, the balance still unpaid.', days: 35 },
      { code: 'FTB 4966', title: 'California’s Final Notice Before Levy', words: 'the Franchise Tax Board may take what you owe from your bank accounts.', days: 35 },
    ],
    levy: { title: 'California Ordered Your Bank To Pay', afterDays: 30, againDays: 91, fee: 362_00 },
    timingAssumed: false,
    // $25,000 or less in 60 months or fewer, every return for five years filed; a $34 fee added to the balance; up to 90
    // days to decide (about two online); a missed payment or a new liability brings an Intent to Terminate and 30 days.
    plan: { name: 'Installment Agreement', max: 25_000_00, minMonths: 1, maxMonths: 60, fee: 34_00, feeAdded: true, decideDays: 2, decideAssumed: false, cure: { kind: 'notice', days: 30 }, cureAssumed: false, newBalance: 'default', newBalanceAssumed: false, notInCollection: false },
    offsetsOwnRefunds: true, refundDays: 21,
    source: 'Cal. R&TC 19101, 19131, 19132, 19521; ftb.ca.gov (interest rates, payment plans, collection, FTB 1102); research-state-tax-collection.json',
  },
};

/** A state SLATE computes a tax for and hasn't researched: a balance kept, nothing added to it, and nothing assumed. */
export const STATE_UNRESEARCHED = 'SLATE hasn’t researched this state’s collection: the balance is kept with no penalty, interest, notice or plan added, rather than the IRS’s rules copied over.';

/**
 * The IRS's offset of a federal refund to a state's income tax debt (IRC 6402(e)): only the state on the return's
 * address, after its notice, after federal tax; SLATE reads "past due" as a debt a state has sent its notices for.
 */
export const FEDERAL_STATE_OFFSET = { afterNotices: 1, source: 'IRC 6402(e); research-state-tax-collection.json' } as const;
