/**
 * SLATE — what each state does with income tax a resident return leaves unpaid (from the integration pass of
 * 2026-10-10; docs/research/world/research-state-tax-collection.json). Until then a return kept one balance, federal and
 * state together, and the IRS's rules ran on all of it: an IRS payment plan took Connecticut's tax in, and the IRS's
 * notices and levy collected it.
 *
 * Every number here is the state's own where a source was found, and said as SLATE's where none was (`assumed`). Until
 * the limitations pass of 2026-10-11 three states were researched, Connecticut, New York and California, and every other
 * state SLATE taxes kept a plain balance. Ten more were researched then (research-state-tax-collection-2a.json, Arizona,
 * Colorado, Georgia, Hawaii and Illinois; -2b.json, Louisiana, Massachusetts, North Carolina, New Mexico and Oregon,
 * with what Connecticut, New York and California do with a non-filer and with another state's debt): every state a
 * life can live or work in and owe, but Pennsylvania and Ohio, which have a city each, researched the same day
 * (-2c.json). New Jersey, Michigan and Utah have tax tables (`content/tax.ts`) and no city, so no life owes them; one
 * that did would keep its balance with no penalty, interest, notice or plan (`STATE_UNRESEARCHED`), and say so, rather
 * than the IRS's rules copied over.
 */
import type { Money } from '../core/money';

export type StateCode = 'us-ct' | 'us-ny' | 'us-ca' | 'us-az' | 'us-co' | 'us-ga' | 'us-hi' | 'us-il' | 'us-la' | 'us-ma' | 'us-nc' | 'us-nm' | 'us-or' | 'us-pa' | 'us-oh';

/** The parts a payment goes to, in order. */
export type Part = 'tax' | 'penalty' | 'interest';

/** A notice or a letter: its code, its title on the screen, what it says, and the days after the last before it comes. */
export interface StateNotice { code: string; title: string; words: string; days: number }

export interface StateRules {
  /** Who collects it, as a notice names it, and its short name. */
  agency: string;
  short: string;
  form: string;
  /**
   * Interest on unpaid tax: a yearly rate and how it runs. Compounded daily (`daily`); simple, by the day (`daily-simple`);
   * simple, a month or part at a time (`monthly-simple`); or simple within a calendar year and added to the principal
   * each 1 January (`yearly`, Arizona's). On penalties too where `onPenalty`. A higher rate from so many days after the
   * first notice (`raised`): Colorado's unless a plan was asked for by then, Oregon's on an assessment whatever.
   */
  interest: { yearly: number; how: 'daily' | 'daily-simple' | 'monthly-simple' | 'yearly'; onPenalty: boolean; raised?: { yearly: number; afterDays: number; unlessPlan: boolean };
    /** On penalties too once collection reaches this step (Ohio's, once the debt is certified to its Attorney General). */
    onPenaltyFromStep?: number };
  /**
   * The late-payment penalty, on tax unpaid at the due date: a one-time share, then a share a month or part, to a cap,
   * for at most so many months, and not less than `minimum` once it runs (Colorado's $5). Or by `steps`, the share
   * reached by days past the due date (Illinois's 2% then 10%, Hawaii's 20% at sixty days). Not on a return filed late
   * where `timelyOnly` (Hawaii's, which charges the late-filing penalty instead). A rule for returns due from a date
   * (`from`, North Carolina's from 1 July 2027).
   */
  payLate: {
    once: number; monthly: number; cap: number; months?: number; minimum?: Money;
    steps?: readonly { afterDays: number; rate: number }[];
    timelyOnly?: boolean;
    from?: { due: string; once: number; monthly: number; cap: number };
  };
  /**
   * The late-filing penalty on a return filed after its due date with tax unpaid: a share a month or part, to a cap, or
   * a share once (`once`), to an amount (`capMoney`), only past so many months late (`afterMonths`, counted from the due
   * date all the same); the minimum past 60 days (the lesser of it and the tax). How it meets the late-payment penalty:
   * New York's less it in the same months, California's the larger of the two, added to it, or the two together held
   * to `combinedCap` (Arizona's, Georgia's, Louisiana's), or none apart from it.
   */
  fileLate: {
    monthly: number; cap: number; once?: number; capMoney?: Money; afterMonths?: number; minimum?: Money; combine: 'reduced-by-payment' | 'greater-of' | 'added' | 'combined-cap' | 'none'; combinedCap?: number;
    /** The least it is once it applies (Pennsylvania's $5). */
    floor?: Money;
    /** An amount a month or part, to its cap, where it's more than the share (Ohio's $50 a month to $500). */
    monthlyFlat?: { amount: Money; cap: Money };
  };
  /** The order a part payment is applied in, and whether it's the state's or SLATE's. */
  order: readonly Part[];
  orderAssumed: boolean;
  /** Its notices, in order, each so many days after the last (the first after the bill at filing); then a levy on the bank. */
  notices: readonly StateNotice[];
  /** The levy: days after the last notice, then again while anything's owed; a fee the first time, and one each time. */
  levy: { title: string; afterDays: number; againDays: number; fee?: Money; feeEach?: Money };
  /** Whether a notice's timing is the state's (found) or SLATE's. */
  timingAssumed: boolean;
  /**
   * What collection adds as it goes: at the notice of index `step` (the first levy at the notices' length), a share of
   * the tax or of everything owed, or an amount, smaller below a balance (Illinois's $30 under $1,000, else $100).
   */
  charges?: readonly { step: number; share?: number; of?: 'tax' | 'owed'; flat?: Money; under?: { below: Money; flat: Money }; label: string }[];
  /** Its payment plan for an individual. */
  plan: {
    name: string;
    /** The most it takes, or nothing where none is published (SLATE sets none). */
    max?: Money;
    /** The least owed it takes (Hawaii's over $100). */
    min?: Money;
    minMonths: number; maxMonths: number; monthsAssumed?: boolean;
    /** The least a month (Georgia's and Massachusetts's $25). */
    minMonthly?: Money;
    /** Its fee, added to the balance, waived where the year's income is at most `feeWaivedAtMost` (Louisiana's). */
    fee: Money; feeAdded: boolean; feeWaivedAtMost?: Money;
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
    /** What the plan asks that SLATE doesn't model, said beside it. */
    beyond?: string;
    /** Offered only once collection reaches this step, and by whom (Ohio's Attorney General, once the debt is certified to it). */
    afterStep?: { step: number; who: string };
  };
  /** The share of a year's refund a state keeps for another year's balance first: all of it (each state's offset law). */
  offsetsOwnRefunds: true;
  /**
   * The states whose past-due income tax its refunds pay, by its published agreements (from 2026-10-11): New York's
   * five and California's three, those SLATE taxes among them; Connecticut's by its reciprocity law, read as the states
   * that name it. A state whose partners weren't found pays none.
   */
  offsetsFor: readonly StateCode[];
  offsetsAssumed?: boolean;
  /**
   * A return never filed that owes it (from 2026-10-11): the state's own estimate, from what employers reported, after
   * its letters, each so many days after the last, the first so many days after the due date (`firstDays`, SLATE's
   * year where the state's wasn't found, as the IRS's substitute return is); then assessed, with its late penalties and
   * interest from the due date, and what a non-filer's assessment adds (`adds`), and collected. Their own return
   * replaces it.
   */
  nonFiler: {
    firstDays: number; firstAssumed: boolean;
    letters: readonly StateNotice[];
    lettersAssumed: boolean;
    /** A share of the tax, held between `atLeast` and `atMost`; an amount; or a floor on the whole penalty (Connecticut's $50). */
    adds?: readonly { share?: number; atLeast?: Money; atMost?: Money; flat?: Money; minPenalty?: Money; label: string }[];
  };
  /** When a refund comes, SLATE's estimate where the state's wasn't researched. */
  refundDays: number;
  source: string;
}

/** SLATE's year before a state acts on a return never filed, where its own wasn't found: the IRS's substitute's (`SUBSTITUTE`). */
const YEAR = 365;

/**
 * The states SLATE has researched. A month is 30.4375 days, the IRS's in this engine; "or part of a month" is read as a
 * month begun, and Louisiana's thirty days as a month.
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
    offsetsOwnRefunds: true,
    // Reciprocal with a state that offers the same (12-35f); DRS lists no partners, and New York and California name it.
    offsetsFor: ['us-ny', 'us-ca'], offsetsAssumed: true,
    // DRS may make the return three months after the due date, with 10% of the tax or $50, the greater, and 1% a month
    // (12-735(b)); 60 days to protest (12-729, read for a DRS-made return). When it acts isn't published: the statute's
    // earliest, SLATE's.
    nonFiler: {
      firstDays: 92, firstAssumed: true,
      letters: [{ code: 'Failure to File Notice', title: 'Connecticut DRS Made Your Return', words: 'with no return from you, DRS worked out what you owe from what was reported. File your own within 60 days, or it’s assessed.', days: 60 }],
      lettersAssumed: false,
      adds: [{ minPenalty: 50_00, label: 'The penalty for a return DRS made: 10% or $50, the greater' }],
    },
    refundDays: 21,
    source: 'Conn. Gen. Stat. 12-735, 12-39h, 12-35, 12-35f, 12-729, 12-739; portal.ct.gov/drs (payment plans, refund offsets, non-filers); research-state-tax-collection.json and -2b.json',
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
    offsetsOwnRefunds: true,
    // Its partners in the Interstate Refund Offset: California, Connecticut, Delaware, Maryland and New Jersey; SLATE
    // taxes no life in the last three.
    offsetsFor: ['us-ca', 'us-ct'],
    // The AU-222 letter, 30 days; a Statement of Proposed Audit Change; then a Notice of Deficiency, 90 days to petition;
    // the late penalties as on any late return. When the AU-222 comes, and the days of the statement, weren't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'AU-222', title: 'New York Asks For Your Return', words: 'its records show income and no return. File within 30 days.', days: 30 },
        { code: 'Statement of Proposed Audit Change', title: 'New York Proposes What You Owe', words: 'with no return from you, it worked out the tax from what was reported.', days: 30 },
        { code: 'Notice of Deficiency', title: 'A Notice Of Deficiency From New York', words: 'it’s assessed in 90 days unless you file or petition.', days: 90 },
      ],
      lettersAssumed: true,
    },
    refundDays: 21,
    source: 'NY Tax Law 681, 685, 689, 697(j), 1312(a); tax.ny.gov (interest rates, IPA, collection, Pub 131, refund offsets, AU-222); research-state-tax-collection.json and -2b.json',
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
    offsetsOwnRefunds: true,
    // Its Interstate Offset partners: New York, Connecticut and New Jersey (FTB 4940 PC).
    offsetsFor: ['us-ny', 'us-ct'],
    // FTB 4600, then the Demand for Tax Return (FTB 4601), 30 days each; then a Notice of Proposed Assessment, 60 days to
    // protest, with the 25% demand penalty on top of the late-filing penalty and the $143 filing enforcement fee. When
    // the 4600 comes wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'FTB 4600', title: 'California Asks For Your Return', words: 'its records show income and no return. File within 30 days.', days: 30 },
        { code: 'FTB 4601', title: 'A Demand For Your California Return', words: 'file within 30 days, or it’s worked out for you with a 25% demand penalty.', days: 30 },
        { code: 'Notice of Proposed Assessment', title: 'California Proposes What You Owe', words: 'it’s assessed in 60 days unless you file or protest.', days: 60 },
      ],
      lettersAssumed: false,
      adds: [{ share: 0.25, label: 'The demand penalty, 25% of the tax (R&TC 19133)' }, { flat: 143_00, label: 'The filing enforcement fee' }],
    },
    refundDays: 21,
    source: 'Cal. R&TC 19101, 19131, 19132, 19133, 19254, 19521; ftb.ca.gov (interest rates, payment plans, collection, FTB 1102, FTB 4600, FTB 4940 PC); research-state-tax-collection.json and -2b.json',
  },
  'us-az': {
    agency: 'Arizona Department of Revenue', short: 'Arizona ADOR', form: '140',
    // 7% a year for July to December 2026, the federal short-term rate plus three, simple through the year and added to
    // the principal each 1 January (A.R.S. 42-1123). Whether it runs on penalties wasn't found: not, SLATE's.
    interest: { yearly: 0.07, how: 'yearly', onPenalty: false },
    // 0.5% a month or part, to 10% (42-1125(D)).
    payLate: { once: 0, monthly: 0.005, cap: 0.1 },
    // 4.5% a month or part, to 25%; the two together held to 25% (42-1125(A)).
    fileLate: { monthly: 0.045, cap: 0.25, combine: 'combined-cap', combinedCap: 0.25 },
    order: ['tax', 'penalty', 'interest'], orderAssumed: true,
    // A bill, the Final Demand, then a Notice of Levy (ADOR Pub 2, 2014, still posted). The days between weren't found.
    notices: [
      { code: 'ADOR bill', title: 'A Bill From Arizona', words: 'the tax, its penalties and interest are due.', days: 30 },
      { code: 'Final Demand', title: 'Arizona’s Final Demand', words: 'unpaid, ADOR may levy your bank accounts or file a lien.', days: 30 },
    ],
    levy: { title: 'Arizona Levied Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    // Asked on AZTaxes, set up within two weeks of a bill. No most, longest or fee is published: SLATE's three years and
    // none. A new liability or a missed payment ends it, and ADOR may levy without notice.
    plan: { name: 'Payment Plan', minMonths: 1, maxMonths: 36, monthsAssumed: true, fee: 0, feeAdded: false, decideDays: 14, decideAssumed: false, cure: { kind: 'none' }, cureAssumed: false, newBalance: 'default', newBalanceAssumed: false, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    // A written demand, then the estimate fifteen days on, with 25% more for not filing on demand (42-1109, 42-1125(B)).
    // When the demand comes, and the days to the assessment, weren't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'Demand to file', title: 'Arizona Demands Your Return', words: 'file within 15 days, or ADOR estimates what you owe.', days: 15 },
        { code: 'Proposed assessment', title: 'Arizona Proposes What You Owe', words: 'with no return from you, it estimated the tax from what was reported.', days: 45 },
      ],
      lettersAssumed: true,
      adds: [{ share: 0.25, label: 'The penalty for not filing on demand, 25% of the tax (42-1125(B))' }],
    },
    refundDays: 21,
    source: 'A.R.S. 42-1109, 42-1123, 42-1125; azdor.gov (payment arrangements, collections, Pub 2); research-state-tax-collection-2a.json',
  },
  'us-co': {
    agency: 'Colorado Department of Revenue', short: 'Colorado DOR', form: 'DR 0104',
    // 8% a year in 2026 where it's paid within 30 days of the Notice of Deficiency or a plan is asked for by then, 11%
    // after; simple, by the day, on the tax (C.R.S. 39-21-109; the CDOR summary, unconfirmed word for word).
    interest: { yearly: 0.08, how: 'daily-simple', onPenalty: false, raised: { yearly: 0.11, afterDays: 30, unlessPlan: true } },
    // One penalty for both: 5% and 0.5% for each month after the first, to 12%, at least $5 (39-22-621).
    payLate: { once: 0.045, monthly: 0.005, cap: 0.12, minimum: 5_00 },
    fileLate: { monthly: 0, cap: 0, combine: 'none' },
    order: ['tax', 'penalty', 'interest'], orderAssumed: true,
    // The Notice of Deficiency (30 days), the Final Determination and Demand, the Notice of Intent to Issue
    // Judgment/Lien (10 days), then a levy. The days after the demand weren't found.
    notices: [
      { code: 'Notice of Deficiency', title: 'A Notice Of Deficiency From Colorado', words: 'paid within 30 days, or a plan asked for, interest stays at 8%; after, it’s 11%.', days: 30 },
      { code: 'Final Determination and Demand', title: 'Colorado’s Final Determination And Demand', words: 'unpaid with no plan, a 15% collection penalty follows.', days: 30 },
      { code: 'Notice of Intent to Issue Judgment/Lien', title: 'Colorado Intends To File A Lien', words: 'in 10 days it may file a lien and levy your accounts.', days: 30 },
    ],
    levy: { title: 'Colorado Levied Your Accounts', afterDays: 10, againDays: 91 },
    timingAssumed: true,
    // The final demand unpaid, with no plan: 15% of the tax (39-21-118).
    charges: [{ step: 2, share: 0.15, of: 'tax', label: 'The collection penalty, 15% of the tax' }],
    // Up to 36 months, no fee; a default makes the whole due after a written notice, whose days weren't found; a new
    // balance can be added by asking (SLATE asks for them).
    plan: { name: 'Payment Plan', minMonths: 1, maxMonths: 36, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'notice', days: 30 }, cureAssumed: true, newBalance: 'joins', newBalanceAssumed: true, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    // The department files a return from what it has. When, and its letter, weren't found: a Notice of Deficiency, as on
    // any assessment.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [{ code: 'Notice of Deficiency', title: 'Colorado Filed A Return For You', words: 'with no return from you, it worked out the tax from what was reported. File your own within 30 days.', days: 30 }],
      lettersAssumed: true,
    },
    refundDays: 21,
    source: 'C.R.S. 39-21-109, 39-21-118, 39-22-621; tax.colorado.gov (interest rates, payment plans, collections, wage garnishments); research-state-tax-collection-2a.json',
  },
  'us-ga': {
    agency: 'Georgia Department of Revenue', short: 'Georgia DOR', form: '500',
    // 9.75% a year in 2026, prime plus three, accruing monthly (O.C.G.A. 48-2-40). On penalties, and compounding, weren't
    // found: on the tax, simple, SLATE's.
    interest: { yearly: 0.0975, how: 'monthly-simple', onPenalty: false },
    // 0.5% a month, to 25% (48-7-86).
    payLate: { once: 0, monthly: 0.005, cap: 0.25 },
    // 5% a month, to 25%; the two together held to 25% (48-7-57).
    fileLate: { monthly: 0.05, cap: 0.25, combine: 'combined-cap', combinedCap: 0.25 },
    // "In the best interests of the State": SLATE's, the tax first.
    order: ['tax', 'penalty', 'interest'], orderAssumed: true,
    // The Notice of Proposed Assessment (45 days), the Official Assessment and Demand (45 days), the State Tax Execution,
    // with its 20% fee, then a levy. The days after the execution weren't found.
    notices: [
      { code: 'Notice of Proposed Assessment', title: 'Georgia Proposes An Assessment', words: '45 days to pay or appeal.', days: 30 },
      { code: 'Official Assessment and Demand', title: 'Georgia’s Official Assessment And Demand', words: '45 days, then a state tax execution.', days: 45 },
      { code: 'State Tax Execution', title: 'Georgia Issued A State Tax Execution', words: 'a lien, with a 20% collection fee; a levy may follow.', days: 45 },
    ],
    levy: { title: 'Georgia Levied Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    charges: [{ step: 2, share: 0.2, of: 'owed', label: 'The collection fee with the execution, 20%' }],
    // Up to 60 months, at least $25 a month, a $50 fee by bank draft, about 30 days to decide. A late payment or a new
    // balance is a default, and the default letter's days weren't found. How the fee is paid wasn't found: added.
    plan: { name: 'Installment Payment Agreement', minMonths: 1, maxMonths: 60, minMonthly: 25_00, fee: 50_00, feeAdded: true, decideDays: 30, decideAssumed: false, cure: { kind: 'notice', days: 30 }, cureAssumed: true, newBalance: 'default', newBalanceAssumed: false, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    // A Notice to Submit Return, then an estimate assessed by a proposed assessment's 45 days. When it comes, and the
    // letter's own days, weren't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'Notice to Submit Return', title: 'Georgia Asks For Your Return', words: 'file by the date on the letter, or it’s estimated for you.', days: 30 },
        { code: 'Notice of Proposed Assessment', title: 'Georgia Proposes What You Owe', words: 'estimated from what was reported; 45 days to file or appeal.', days: 45 },
      ],
      lettersAssumed: true,
    },
    refundDays: 21,
    source: 'O.C.G.A. 48-2-40, 48-7-57, 48-7-86; dor.georgia.gov (payment plans, letters, taxpayer bill of rights); research-state-tax-collection-2a.json',
  },
  'us-hi': {
    agency: 'Hawaii Department of Taxation', short: 'Hawaii DOTAX', form: 'N-11',
    // Two-thirds of 1% a month or part, 8% a year, simple, on the tax and the penalties, never on interest (HRS 231-39(b)(4)).
    interest: { yearly: 0.08, how: 'monthly-simple', onPenalty: true },
    // 20% once, on a return filed on time still unpaid 60 days after the due date; not on a late return (231-39(b)(2)(A)).
    payLate: { once: 0, monthly: 0, cap: 0.2, steps: [{ afterDays: 60, rate: 0.2 }], timelyOnly: true },
    // 5% a month or part, to 25% (231-39(b)(1)).
    fileLate: { monthly: 0.05, cap: 0.25, combine: 'added' },
    order: ['penalty', 'tax', 'interest'], orderAssumed: true,
    // A bill, then a written demand at least ten days out; then a $50 fee and a levy, $15 each (231-23(d)). The bills'
    // names and days weren't found.
    notices: [
      { code: 'DOTAX bill', title: 'A Bill From Hawaii', words: 'the tax, its penalties and interest are due.', days: 30 },
      { code: 'Written demand', title: 'Hawaii Demands Payment', words: 'pay within 10 days, or a $50 fee and a levy follow.', days: 30 },
    ],
    levy: { title: 'Hawaii Levied Your Accounts', afterDays: 10, againDays: 91, feeEach: 15_00 },
    timingAssumed: true,
    charges: [{ step: 2, flat: 50_00, label: 'The delinquent account fee' }],
    // Over $100, a $50 fee; a new liability defaults it; notice before collection, whose days weren't found. The longest
    // wasn't found: SLATE's three years. Over twelve months a lien is filed, which SLATE doesn't model.
    plan: { name: 'Installment Agreement', min: 100_00, minMonths: 1, maxMonths: 36, monthsAssumed: true, fee: 50_00, feeAdded: true, decideDays: 0, decideAssumed: true, cure: { kind: 'notice', days: 30 }, cureAssumed: true, newBalance: 'default', newBalanceAssumed: false, notInCollection: false, beyond: 'Over twelve months it files a lien, which SLATE doesn’t model.' },
    offsetsOwnRefunds: true, offsetsFor: [],
    // The department makes the return from what it has (235-107), 30 days to object to the proposed assessment. When
    // wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [{ code: 'Proposed assessment', title: 'Hawaii Made Your Return', words: 'with no return from you, it worked out the tax from what was reported. 30 days to file your own or object.', days: 30 }],
      lettersAssumed: false,
    },
    refundDays: 21,
    source: 'HRS 231-23, 231-39, 231-53, 235-107; tax.hawaii.gov (payment plans, collections, wage levy, N-11 Taxpayer Bill of Rights); research-state-tax-collection-2a.json',
  },
  'us-il': {
    agency: 'Illinois Department of Revenue', short: 'Illinois IDOR', form: 'IL-1040',
    // 7% a year, the federal underpayment rate, simple, by the day, on the tax only (35 ILCS 735/3-2).
    interest: { yearly: 0.07, how: 'daily-simple', onPenalty: false },
    // 2% within 30 days of the due date, 10% after (735/3-3(b-20)).
    payLate: { once: 0, monthly: 0, cap: 0.1, steps: [{ afterDays: 0, rate: 0.02 }, { afterDays: 30, rate: 0.1 }] },
    // 2% of the tax, to $250, beside the late-payment penalty (3-3(a-10)). The second, after a nonfiling notice, is a
    // non-filer's (`nonFiler.adds`).
    fileLate: { monthly: 0, cap: 0.02, once: 0.02, capMoney: 250_00, combine: 'added' },
    order: ['tax', 'penalty', 'interest'], orderAssumed: true,
    // The Notice of Tax Due, then the Notice of Deficiency, then collection: a $30 fee under $1,000, $100 at or over,
    // 30 days after the final bill (Pub-103). The days between weren't found.
    notices: [
      { code: 'IDOR-2-BILL', title: 'A Notice Of Tax Due From Illinois', words: 'paid within 30 days, interest stops; unpaid, a deficiency notice follows.', days: 30 },
      { code: 'LTR-393-IPD', title: 'A Notice Of Deficiency From Illinois', words: 'unpaid in 30 days, a collection fee is added and IDOR may levy.', days: 30 },
    ],
    levy: { title: 'Illinois Levied Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    charges: [{ step: 2, flat: 100_00, under: { below: 1_000_00, flat: 30_00 }, label: 'The cost of collection fee' }],
    // No fee; a new balance joins; over $15,000 a financial statement, which SLATE doesn't model; the longest and what a
    // missed payment does beyond making the whole due weren't found.
    plan: { name: 'Installment Plan', max: 15_000_00, minMonths: 1, maxMonths: 36, monthsAssumed: true, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: false, newBalance: 'joins', newBalanceAssumed: false, notInCollection: false, beyond: 'Over $15,000 it asks a financial statement, which SLATE doesn’t model.' },
    offsetsOwnRefunds: true,
    // 35 ILCS 5/911.2 lets it trade refunds with states that return the favour; which do isn't published.
    offsetsFor: [],
    // Best judgment and information (5/904(b)): a nonfiling notice, 30 days, then a Notice of Deficiency, assessed in 60;
    // still unfiled 30 days after the nonfiling notice, a second penalty of 2%, at least $250, at most $5,000. When the
    // notice comes wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'Nonfiling notice', title: 'Illinois Asks For Your Return', words: 'file within 30 days, or a second late-filing penalty is added.', days: 30 },
        { code: 'Notice of Deficiency', title: 'Illinois Proposes What You Owe', words: 'worked out from what was reported; it’s assessed in 60 days.', days: 60 },
      ],
      lettersAssumed: false,
      adds: [{ share: 0.02, atLeast: 250_00, atMost: 5_000_00, label: 'The penalty for not filing after notice: 2%, at least $250, at most $5,000' }],
    },
    refundDays: 21,
    source: '35 ILCS 5/904, 5/909, 5/911.2, 5/911.3, 735/3-2, 735/3-3; tax.illinois.gov (letters, payment plans, Pub-103); research-state-tax-collection-2a.json',
  },
  'us-la': {
    agency: 'Louisiana Department of Revenue', short: 'Louisiana LDR', form: 'IT-540',
    // 10.5% a year in 2026, the judicial rate plus three, simple, by the day (R.S. 47:1601; RIB 26-001). On penalties
    // inferred not.
    interest: { yearly: 0.105, how: 'daily-simple', onPenalty: false },
    // 0.5% for each thirty days or part, to 25% (47:1602).
    payLate: { once: 0, monthly: 0.005, cap: 0.25 },
    // 5% for each thirty days or part, counted from the due date but only once the six-month extension has passed; the
    // two together held to 25% (47:1602).
    fileLate: { monthly: 0.05, cap: 0.25, afterMonths: 6, combine: 'combined-cap', combinedCap: 0.25 },
    // The department's discretion; tax, penalty, interest in its 2014 amnesty rule: SLATE's.
    order: ['tax', 'penalty', 'interest'], orderAssumed: true,
    // An assessment, its final, a Notice of Intent to Offset (60 days), then garnishment. The days are from a 2017 LDR
    // presentation; the days to a levy weren't found. A collection agency's fee of up to 25% isn't charged: the rate
    // LDR's contractor charges isn't published.
    notices: [
      { code: 'Notice of Assessment', title: 'A Notice Of Assessment From Louisiana', words: '60 days to pay or appeal before it’s final.', days: 30 },
      { code: 'Notice of Final Assessment', title: 'Louisiana’s Final Assessment', words: 'final; a notice of intent to offset and garnish follows.', days: 60 },
      { code: 'Notice of Intent to Offset', title: 'Louisiana Intends To Collect', words: 'in 60 days your refunds may be taken and your accounts garnished.', days: 30 },
    ],
    levy: { title: 'Louisiana Garnished Your Accounts', afterDays: 60, againDays: 91 },
    timingAssumed: true,
    // Under $25,000, up to 36 months, a $105 fee waived at $25,000 of income or less, by automatic debit; one missed
    // payment makes the whole due; a new balance unpaid is a default. Its 20% down payment isn't modelled.
    plan: { name: 'Installment Agreement', max: 24_999_99, minMonths: 1, maxMonths: 36, fee: 105_00, feeAdded: true, feeWaivedAtMost: 25_000_00, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: false, newBalance: 'default', newBalanceAssumed: false, notInCollection: false, beyond: 'LDR asks up to 20% down, which SLATE doesn’t model.' },
    offsetsOwnRefunds: true, offsetsFor: [],
    // An estimate from the federal match, by a proposed assessment's 30 days. When wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [{ code: 'Notice of Proposed Assessment', title: 'Louisiana Proposes What You Owe', words: 'with no return from you, it estimated the tax from what the IRS reported. 30 days to file or respond.', days: 30 }],
      lettersAssumed: false,
    },
    refundDays: 21,
    source: 'La. R.S. 47:1601, 47:1602; revenue.louisiana.gov (RIB 26-001, R-19026, collections; a 2017 LDR presentation); research-state-tax-collection-2b.json',
  },
  'us-ma': {
    agency: 'Massachusetts Department of Revenue', short: 'Massachusetts DOR', form: 'Form 1',
    // The federal short-term rate plus four, 8% for October to December 2026 (from a search summary of TIR 26-5),
    // compounded daily, on penalties too (G.L. c. 62C, s. 32).
    interest: { yearly: 0.08, how: 'daily', onPenalty: true },
    // 1% a month or part, to 25% (c. 62C, s. 33(b)).
    payLate: { once: 0, monthly: 0.01, cap: 0.25 },
    // 1% a month or part, to 25%, beside it (s. 33(a)).
    fileLate: { monthly: 0.01, cap: 0.25, combine: 'added' },
    // The tax, then penalties, then interest, the oldest period first (830 CMR 62C.33.1(9)).
    order: ['tax', 'penalty', 'interest'], orderAssumed: false,
    // The Notice of Assessment (30 days to pay), the Statement of Account, a demand, then the final notice; a levy ten
    // days after the demand; $30 for each demand unanswered. The days from the statement weren't found.
    notices: [
      { code: 'Notice of Assessment', title: 'A Notice Of Assessment From Massachusetts', words: '30 days to pay.', days: 30 },
      { code: 'Statement of Account', title: 'Massachusetts Demands Payment', words: 'unpaid, a $30 demand charge and collection follow.', days: 30 },
      { code: 'Final Notice', title: 'Massachusetts’s Final Notice', words: 'DOR may now levy your bank accounts.', days: 30 },
    ],
    levy: { title: 'Massachusetts Levied Your Accounts', afterDays: 10, againDays: 91 },
    timingAssumed: true,
    charges: [{ step: 2, flat: 30_00, label: 'The demand charge' }],
    // $10,000 or less online, up to 36 months, at least $25 a month; a missed payment brings a notice of intent to
    // cancel, whose days weren't found; a new balance must be paid or it's the same notice. No fee was found.
    plan: { name: 'Payment Agreement', max: 10_000_00, minMonths: 1, maxMonths: 36, minMonthly: 25_00, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'notice', days: 30 }, cureAssumed: true, newBalance: 'default', newBalanceAssumed: false, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    // Assessed at any time; up to double the tax where no return comes within 30 days of notice, at DOR's discretion,
    // which SLATE doesn't take: a Notice of Intent to Assess, 30 days. When the notice comes wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'Notice to file', title: 'Massachusetts Asks For Your Return', words: 'file within 30 days.', days: 30 },
        { code: 'Notice of Intent to Assess', title: 'Massachusetts Intends To Assess', words: 'worked out from what was reported; 30 days to file or ask for a conference.', days: 30 },
      ],
      lettersAssumed: true,
    },
    refundDays: 21,
    source: 'G.L. c. 62C, ss. 26, 32, 33; 830 CMR 62C.33.1; mass.gov (payment agreements, collections, TIR 26-5, AP 631; read from web.archive.org copies); research-state-tax-collection-2b.json',
  },
  'us-nc': {
    agency: 'North Carolina Department of Revenue', short: 'North Carolina DOR', form: 'D-400',
    // 7% in 2026, set each six months, on the tax only (G.S. 105-241.21). Simple by the day, SLATE's.
    interest: { yearly: 0.07, how: 'daily-simple', onPenalty: false },
    // 5% once, until returns due from 1 July 2027, which take 2% a month to 10% (105-236(a)(4); S.L. 2023).
    payLate: { once: 0.05, monthly: 0, cap: 0.05, from: { due: '2027-07-01', once: 0, monthly: 0.02, cap: 0.1 } },
    // 5% a month or part, to 25%, beside it (105-236(a)(3)).
    fileLate: { monthly: 0.05, cap: 0.25, combine: 'added' },
    order: ['tax', 'penalty', 'interest'], orderAssumed: true,
    // A Notice of Collection; collectible, a warrant may issue in 30 days; 60 days after, a 20% fee unless a plan stands
    // (105-243.1). The days between the notices weren't found.
    notices: [
      { code: 'Notice of Collection', title: 'A Notice Of Collection From North Carolina', words: 'the amount due isn’t paid in full.', days: 30 },
      { code: 'Notice of Collection, second', title: 'North Carolina’s Second Notice', words: 'a certificate of tax liability and garnishment may follow; past 60 days, a 20% collection fee.', days: 30 },
    ],
    levy: { title: 'North Carolina Garnished Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    charges: [{ step: 2, share: 0.2, of: 'owed', label: 'The collection assistance fee, 20%' }],
    // Up to 18 months, by bank draft; 30 days to cure a default. A fee wasn't stated; a new balance unpaid read as a
    // default, inferred.
    plan: { name: 'Installment Payment Agreement', minMonths: 1, maxMonths: 18, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'notice', days: 30 }, cureAssumed: false, newBalance: 'default', newBalanceAssumed: true, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    // A Notice to File, 30 days, then a Notice of Assessment, 45. When it comes wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'Notice to File', title: 'North Carolina Asks For Your Return', words: 'file within 30 days.', days: 30 },
        { code: 'Notice of Individual Income Tax Assessment', title: 'North Carolina Assesses What You Owe', words: 'worked out from what was reported; 45 days to file or respond.', days: 45 },
      ],
      lettersAssumed: false,
    },
    refundDays: 21,
    source: 'N.C.G.S. 105-236, 105-241.21, 105-243.1; ncdor.gov (installment agreements, notices, collection); research-state-tax-collection-2b.json',
  },
  'us-nm': {
    agency: 'New Mexico Taxation and Revenue Department', short: 'New Mexico TRD', form: 'PIT-1',
    // The federal underpayment rate, 7% for July to December 2026, simple, by the day, on the tax only (NMSA 7-1-67;
    // read on FindLaw).
    interest: { yearly: 0.07, how: 'daily-simple', onPenalty: false },
    // One penalty for filing or paying late: 2% a month or part, to 20% (7-1-69).
    payLate: { once: 0, monthly: 0.02, cap: 0.2 },
    fileLate: { monthly: 0, cap: 0, combine: 'none' },
    order: ['tax', 'penalty', 'interest'], orderAssumed: true,
    // A Notice of Assessment, delinquent after 90 days; a statement, then a final notice before seizure. The later days
    // weren't found.
    notices: [
      { code: 'Notice of Assessment', title: 'A Notice Of Assessment From New Mexico', words: '90 days to pay or protest.', days: 30 },
      { code: 'Statement of Account', title: 'New Mexico: Delinquent', words: 'the assessment is delinquent; a lien may follow.', days: 90 },
      { code: 'Final Notice Before Seizure', title: 'New Mexico’s Final Notice Before Seizure', words: 'TRD may now levy your bank accounts.', days: 30 },
    ],
    levy: { title: 'New Mexico Levied Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    // Up to 12 months on TAP without a lien; longer needs one, which SLATE doesn't model. A missed payment, a new debt or
    // a return not filed ends it.
    plan: { name: 'Installment Agreement', minMonths: 1, maxMonths: 12, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: false, newBalance: 'default', newBalanceAssumed: false, notInCollection: false, beyond: 'Thirteen to 72 months need a lien, which SLATE doesn’t model.' },
    offsetsOwnRefunds: true, offsetsFor: [],
    // Estimated from the IRS's data, seven years back. The demand's days weren't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [{ code: 'Demand to file', title: 'New Mexico Asks For Your Return', words: 'file, or it’s estimated from what the IRS reported.', days: 30 }],
      lettersAssumed: true,
    },
    refundDays: 21,
    source: 'NMSA 7-1-67, 7-1-69 (FindLaw); tax.newmexico.gov (installment agreements, collections, hearing decisions); research-state-tax-collection-2b.json',
  },
  'us-or': {
    agency: 'Oregon Department of Revenue', short: 'Oregon DOR', form: 'OR-40',
    // 8% a year in 2026, simple, by the day, not on penalties; 12% on an assessment unpaid 60 days after it (ORS 305.220,
    // 305.222; from DOR's non-binding bulletin).
    interest: { yearly: 0.08, how: 'daily-simple', onPenalty: false, raised: { yearly: 0.12, afterDays: 60, unlessPlan: false } },
    // 5% once (314.400(1)).
    payLate: { once: 0.05, monthly: 0, cap: 0.05 },
    // 20% more filed past three months late (314.400(2)); 100% for three years running unfiled, which SLATE doesn't
    // count.
    fileLate: { monthly: 0, cap: 0.2, once: 0.2, afterMonths: 3, combine: 'added' },
    // Penalty, then interest, then tax (305.265(13)).
    order: ['penalty', 'interest', 'tax'], orderAssumed: false,
    // A Notice of Assessment, a Notice and Demand, then a distraint warrant at least 30 days on, then a levy. The days
    // from the assessment weren't found.
    notices: [
      { code: 'Notice of Assessment', title: 'A Notice Of Assessment From Oregon', words: 'unpaid in 60 days, interest rises to 12%.', days: 30 },
      { code: 'Notice and Demand', title: 'Oregon Demands Payment', words: 'a distraint warrant may follow in 30 days.', days: 30 },
      { code: 'Distraint Warrant', title: 'Oregon Issued A Distraint Warrant', words: 'a lien on what you own; a levy may follow.', days: 30 },
    ],
    levy: { title: 'Oregon Levied Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    // Up to 36 months on Revenue Online. A missed payment and a new balance weren't found: SLATE's.
    plan: { name: 'Payment Plan', minMonths: 1, maxMonths: 36, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: true, newBalance: 'joins', newBalanceAssumed: true, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    // A demand to file within 30 days, then an estimated assessment with 25% more (314.400(3)). When the demand comes
    // wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'Demand to file', title: 'Oregon Demands Your Return', words: 'file within 30 days, or it’s estimated for you with 25% more.', days: 30 },
        { code: 'Notice of Determination and Assessment', title: 'Oregon Determines What You Owe', words: 'estimated from what was reported.', days: 30 },
      ],
      lettersAssumed: true,
      adds: [{ share: 0.25, label: 'The penalty for not filing on demand, 25% of the tax' }],
    },
    refundDays: 21,
    source: 'ORS 305.220, 305.222, 305.265, 314.400; oregon.gov/dor (payment plans, collections, bulletins); research-state-tax-collection-2b.json',
  },
  'us-pa': {
    agency: 'Pennsylvania Department of Revenue', short: 'Pennsylvania DOR', form: 'PA-40',
    // 7% in 2026, simple, by the day, on the tax only (REV-1611).
    interest: { yearly: 0.07, how: 'daily-simple', onPenalty: false },
    // 5% once (the PA Personal Income Tax Guide).
    payLate: { once: 0.05, monthly: 0, cap: 0.05 },
    // 5% a month or part, to 25%, at least $5, beside it (72 P.S. 7352(a), read on FindLaw).
    fileLate: { monthly: 0.05, cap: 0.25, floor: 5_00, combine: 'added' },
    // After use tax: the income tax, then interest, then penalties (the guide).
    order: ['tax', 'interest', 'penalty'], orderAssumed: false,
    // A bill (30 days to respond), a Notice of Assessment (90 days to appeal), a notice of intent to offset (60 days),
    // then a lien and a notice of intent to garnish, at least 30 days before it. The days between the notices weren't
    // found; a collection agency's cost of up to 25% isn't charged, its rate unpublished.
    notices: [
      { code: 'Billing Notice', title: 'A Bill From Pennsylvania', words: '30 days to pay or respond.', days: 30 },
      { code: 'Notice of Assessment', title: 'A Notice Of Assessment From Pennsylvania', words: '90 days to pay or appeal.', days: 30 },
      { code: 'Notice of Intent to Garnish', title: 'Pennsylvania Intends To Garnish', words: 'a lien is filed; in 30 days your pay or accounts may be garnished.', days: 90 },
    ],
    levy: { title: 'Pennsylvania Garnished Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    // Online, under $50,000 over up to twelve months, by automatic withdrawal, every return filed; not under a
    // garnishment order. Its fee, decision time and what a missed payment does weren't found.
    plan: { name: 'Payment Plan', max: 49_999_99, minMonths: 1, maxMonths: 12, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: true, newBalance: 'default', newBalanceAssumed: false, notInCollection: true, beyond: 'A larger or longer plan, or a new balance on one, needs its extended plan (REV-488), which SLATE doesn’t model.' },
    offsetsOwnRefunds: true, offsetsFor: [],
    // A Non-Filer Notice, 30 days to reply, then an estimated assessment, 90 days to pay or petition (72 P.S. 7338; the
    // reply's days from search excerpts of the department's answers). When the notice comes wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'Personal Income Tax Non-Filer Notice', title: 'Pennsylvania Asks For Your Return', words: 'its records show income and no return. Reply within 30 days.', days: 30 },
        { code: 'Notice of Estimated Assessment', title: 'Pennsylvania Estimates What You Owe', words: 'worked out from what was reported; 90 days to file, pay or petition.', days: 90 },
      ],
      lettersAssumed: false,
    },
    refundDays: 21,
    source: '72 P.S. 7338, 7352 (FindLaw); pa.gov/agencies/revenue (PA Personal Income Tax Guide, REV-1611, payment plans, wage garnishment, REV-554); research-state-tax-collection-2c.json',
  },
  'us-oh': {
    agency: 'Ohio Department of Taxation', short: 'Ohio ODT', form: 'IT 1040',
    // 7% in 2026, simple, by the day, on the tax; on the penalties too once the debt is certified to the Attorney
    // General (R.C. 5703.47; tax.ohio.gov).
    interest: { yearly: 0.07, how: 'daily-simple', onPenalty: false, onPenaltyFromStep: 5 },
    // Up to twice the interest (R.C. 5747.15(A)), at the commissioner's discretion: SLATE charges all of it, 14% a year,
    // a month or part at a time, with no cap past twice the interest.
    payLate: { once: 0, monthly: 0.14 / 12, cap: 1 },
    // The greater of $50 a month to $500 and 5% a month to 50%, beside it (5747.15(A)).
    fileLate: { monthly: 0.05, cap: 0.5, monthlyFlat: { amount: 50_00, cap: 500_00 }, combine: 'added' },
    order: ['tax', 'penalty', 'interest'], orderAssumed: true,
    // A bill (bL0001), the Notice of Assessment (bL0006, 60 days to appeal), the Post Appeal Notice (bL0008), the Top
    // Notice 45 days on, then the claim certified to the Attorney General, with its collection cost: up to 11% by
    // statute (R.C. 109.081), 10% as the Attorney General's pages were quoted, which SLATE charges. The days to the
    // assessment, and how the Attorney General garnishes, weren't found.
    notices: [
      { code: 'bL0001', title: 'A Billing Notice From Ohio', words: 'the tax, its penalties and interest are due.', days: 30 },
      { code: 'bL0006', title: 'A Notice Of Assessment From Ohio', words: '60 days to pay or appeal.', days: 30 },
      { code: 'bL0008', title: 'Ohio’s Post Appeal Notice', words: 'the assessment is final; pay now.', days: 60 },
      { code: 'Top Notice', title: 'Ohio’s Top Notice', words: 'in 45 days the claim goes to the Attorney General, and your federal refund may be taken.', days: 45 },
      { code: 'Certified claim', title: 'Your Ohio Tax Went To The Attorney General', words: 'the Attorney General collects it now, with its collection cost; interest runs on the penalties too.', days: 45 },
    ],
    levy: { title: 'The Ohio Attorney General Collected From Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    charges: [{ step: 4, share: 0.1, of: 'owed', label: 'The Attorney General’s collection cost, 10%' }],
    // The department offers none; the Attorney General up to twelve months once the claim is certified, by a signed
    // contract. Its fee and what a missed payment does weren't found.
    plan: { name: 'Payment Plan With The Attorney General', minMonths: 1, maxMonths: 12, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: true, newBalance: 'joins', newBalanceAssumed: true, notInCollection: false, afterStep: { step: 5, who: 'the Ohio Attorney General' } },
    offsetsOwnRefunds: true, offsetsFor: [],
    // A Failure to File notice (ITDQ0009), 21 days to reply (a 2019 explainer), then an assessment from the IRS's data.
    // When it comes wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'ITDQ0009', title: 'Ohio: A Failure To File Notice', words: 'its records show income and no return. Reply within 21 days.', days: 21 },
        { code: 'bL0006', title: 'Ohio Assesses What You Owe', words: 'worked out from what the IRS reported; 60 days to appeal, paid first.', days: 60 },
      ],
      lettersAssumed: false,
    },
    refundDays: 21,
    source: 'Ohio R.C. 109.081, 5703.47, 5747.15; tax.ohio.gov (interest rates, notices, assessments, refund offsets, ITDQ0009); research-state-tax-collection-2c.json',
  },
};

/** A state SLATE computes a tax for and hasn't researched: a balance kept, nothing added to it, and nothing assumed. */
export const STATE_UNRESEARCHED = 'SLATE hasn’t researched this state’s collection: the balance is kept with no penalty, interest, notice or plan added, rather than the IRS’s rules copied over.';

/**
 * The IRS's offset of a federal refund to a state's income tax debt (IRC 6402(e)): only the state on the return's
 * address, after its notice, after federal tax; SLATE reads "past due" as a debt a state has sent its notices for.
 */
export const FEDERAL_STATE_OFFSET = { afterNotices: 1, source: 'IRC 6402(e); research-state-tax-collection.json' } as const;
