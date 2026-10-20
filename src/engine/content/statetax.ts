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

export type StateCode = 'us-ct' | 'us-ny' | 'us-ca' | 'us-az' | 'us-co' | 'us-ga' | 'us-hi' | 'us-il' | 'us-la' | 'us-ma' | 'us-nc' | 'us-nm' | 'us-or' | 'us-pa' | 'us-oh' | 'us-in' | 'us-dc' | 'us-ok' | 'us-pa-philadelphia' | 'us-oh-columbus' | 'us-or-portland';

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
    onPenaltyFromStep?: number;
    /** A rate for a calendar year, where it changes by year (Indiana's 6%, 7%, 6% for 2025 to 2027), simple by the day. */
    byYear?: Readonly<Record<number, number>> };
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
   * the tax or of everything owed, or an amount, smaller below a balance (Illinois's $30 under $1,000, else $100). Its
   * `words` name it inside the notice's sentence. Until 2026-10-20 (brief 17) they were a Title Case `label`, and the
   * notice read "The Collection Penalty, 15% Of The Tax, $201.17, is added."
   */
  charges?: readonly { step: number; share?: number; of?: 'tax' | 'owed'; flat?: Money; under?: { below: Money; flat: Money }; atLeast?: Money; atMost?: Money; words: string }[];
  /**
   * A lien for unpaid tax (from the remaining-gaps pass of 2026-10-11; research-state-tax-liens-a.json, -b.json), recorded
   * where it says, at the collection step it says (`atStep`, the notices' index; the first levy at their length), after a
   * notice of intent where there is one; or when a plan asks it (`plan`). Its fees are the taxpayer's where published;
   * none is charged where none was found. Released so many days after payment in full (`releaseDays`, SLATE's 30 where
   * the state's wasn't found), or on the taxpayer's request where they must ask or record it. One filed on an assessment
   * their own return shows was nothing is withdrawn as filed in error on request, its fees back. No credit score is kept,
   * so it has none; the effect named is the state's own words.
   */
  lien?: {
    name: string;
    atStep?: number;
    intent?: { title: string; days: number };
    recordedAt: string;
    fee?: Money; releaseFee?: Money;
    releaseDays: number; releaseAssumed: boolean;
    releaseOnRequest?: string;
    plan?: { monthsOver?: number; over?: Money };
    error: { how: string; days: number; daysAssumed: boolean };
    effect: string;
  };
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
    /** The most months by what's owed (Indiana's 12 to $1,000, 24 to $5,000, 36 above). */
    tiers?: readonly { upTo?: Money; maxMonths: number }[];
    /**
     * A share paid down with the request: the District's 10%, required; Louisiana's 20%, which "may be required" at the
     * secretary's discretion, so the taxpayer's to offer and never asked by SLATE; Pennsylvania's and New Mexico's
     * optional, any amount.
     */
    downPayment?: { share?: number; required: boolean; why: string };
    /**
     * A longer arrangement beyond the plan's own terms (from 2026-10-11): Pennsylvania's extended plan on its REV-488,
     * Louisiana's formal agreement, New Mexico's thirteen to 72 months. Asked for where the plan refuses by its length, its
     * balance, or (Pennsylvania's) a plan already in force; with the financial statement the state asks, which SLATE fills
     * from the player's own records, and the lien it requires.
     */
    long?: {
      name: string; maxMonths: number; maxAssumed: boolean; over?: Money; alreadyOnPlan?: boolean;
      statement?: string; lien?: boolean; decideDays: number; decideAssumed: boolean; how: string;
    };
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
    /**
     * A share of the tax, held between `atLeast` and `atMost`; an amount; or a floor on the whole penalty (Connecticut's
     * $50), each named by its `words` in the assessment's notice. Until 2026-10-20 (brief 17) a Title Case `label` was,
     * and Connecticut's read "…, and The Penalty For A Return DRS Made, 10% Or $50, The Greater."
     */
    adds?: readonly { share?: number; atLeast?: Money; atMost?: Money; flat?: Money; minPenalty?: Money; words: string }[];
  };
  /**
   * Oregon's penalty for three years running unfiled (ORS 305.992, from the remaining-gaps pass of 2026-10-11;
   * research-state-tax-arrangements.json): no return of their own for three consecutive years with tax to file for, by the
   * third's due date with its extension, adds this share of each year's net tax, a year's penalties together held to its
   * tax; a state's own assessment isn't a return. Waived on a written request, before full payment or within a year
   * after, by its schedule: 70% filed before any notice, 50% after a demand, 25% after an assessment (OAR 150-305-0068).
   */
  threeYear?: { share: number; extensionMonths: number; waiver: { beforeNotice: number; afterDemand: number; afterAssessment: number }; windowDays: number };
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
      { code: 'DRS Bill', title: 'A Bill From Connecticut DRS', words: 'the tax, its 10% penalty and 1% a month of interest are due.', days: 30 },
      { code: 'Notice Of Intent To Levy', title: 'Connecticut DRS Intends To Levy', words: 'in 30 days it may take what you owe from your bank accounts by warrant.', days: 30 },
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
      letters: [{ code: 'Failure To File Notice', title: 'Connecticut DRS Made Your Return', words: 'you didn’t file, so DRS worked out what you owe from what was reported. File your own within 60 days, or it’s assessed.', days: 60 }],
      lettersAssumed: false,
      adds: [{ minPenalty: 50_00, words: 'the penalty for a return DRS made, 10% or $50, whichever is greater' }],
    },
    refundDays: 21,
    lien: { name: 'Connecticut Tax Lien', atStep: 1, recordedAt: 'the town clerk’s land records and the Secretary of the State’s UCC filings', releaseDays: 30, releaseAssumed: true, releaseOnRequest: 'DRS issues a release certificate on request, for you to record', error: { how: 'DRS releases it with a statement that it was filed in error', days: 30, daysAssumed: true }, effect: 'It takes priority over liens recorded after it.' },
    source: 'Conn. Gen. Stat. 12-735, 12-39h, 12-35, 12-35f, 12-729, 12-739; portal.ct.gov/drs (payment plans, refund offsets, non-filers)',
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
      { code: 'DTF Bill', title: 'A Bill From New York State', words: 'the tax, the penalty and interest are due.', days: 30 },
      { code: 'DTF-966-E', title: 'Notice And Demand From New York State', words: 'New York may now begin collection, a tax warrant first.', days: 30 },
      { code: 'Tax Warrant', title: 'New York Filed A Tax Warrant', words: 'it’s a public lien on what you own. A levy on your bank accounts comes next.', days: 30 },
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
        { code: 'Statement Of Proposed Audit Change', title: 'New York Proposes What You Owe', words: 'you didn’t file, so it worked out the tax from what was reported.', days: 30 },
        { code: 'Notice Of Deficiency', title: 'A Notice Of Deficiency From New York', words: 'it’s assessed in 90 days unless you file or petition.', days: 90 },
      ],
      lettersAssumed: true,
    },
    refundDays: 21,
    lien: { name: 'New York Tax Warrant', atStep: 2, recordedAt: 'the Department of State’s statewide filing, with a copy to the county clerk', fee: 0, releaseDays: 30, releaseAssumed: true, error: { how: 'the warrant is vacated', days: 30, daysAssumed: true }, effect: 'It may affect buying or selling real property.' },
    source: 'NY Tax Law 681, 685, 689, 697(j), 1312(a); tax.ny.gov (interest rates, IPA, collection, Pub 131, refund offsets, AU-222)',
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
      { code: 'Statement Of Tax Due', title: 'A Statement Of Tax Due From California', words: 'the tax, the penalty and interest are due.', days: 35 },
      { code: 'FTB 4963', title: 'Income Tax Due: California', words: 'this is a second notice, because the balance is still unpaid.', days: 35 },
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
        { code: 'Notice Of Proposed Assessment', title: 'California Proposes What You Owe', words: 'it’s assessed in 60 days unless you file or protest.', days: 60 },
      ],
      lettersAssumed: false,
      adds: [{ share: 0.25, words: 'the demand penalty, 25% of the tax (R&TC 19133)' }, { flat: 143_00, words: 'the filing enforcement fee' }],
    },
    refundDays: 21,
    lien: { name: 'Notice Of State Tax Lien', atStep: 2, intent: { title: 'California Intends To File A Lien', days: 30 }, recordedAt: 'the county recorder and the Secretary of State', fee: 1000, releaseDays: 40, releaseAssumed: false, error: { how: 'released with a statement of error where the balance was resolved before it was recorded', days: 30, daysAssumed: true }, effect: 'It may affect buying, selling or refinancing property, and getting a loan.' },
    source: 'Cal. R&TC 19101, 19131, 19132, 19133, 19254, 19521; ftb.ca.gov (interest rates, payment plans, collection, FTB 1102, FTB 4600, FTB 4940 PC)',
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
      { code: 'ADOR Bill', title: 'A Bill From Arizona', words: 'the tax, its penalties and interest are due.', days: 30 },
      { code: 'Final Demand', title: 'Arizona’s Final Demand', words: 'if it stays unpaid, ADOR may levy your bank accounts or file a lien.', days: 30 },
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
        { code: 'Demand To File', title: 'Arizona Demands Your Return', words: 'file within 15 days, or ADOR estimates what you owe.', days: 15 },
        { code: 'Proposed Assessment', title: 'Arizona Proposes What You Owe', words: 'you didn’t file, so it estimated the tax from what was reported.', days: 45 },
      ],
      lettersAssumed: true,
      adds: [{ share: 0.25, words: 'the penalty for not filing on demand, 25% of the tax (42-1125(B))' }],
    },
    refundDays: 21,
    lien: { name: 'Arizona Tax Lien', atStep: 1, recordedAt: 'the county recorder', releaseDays: 21, releaseAssumed: false, error: { how: 'withdrawn where it was filed prematurely (A.R.S. 42-1153(B))', days: 30, daysAssumed: true }, effect: 'It takes priority against later purchasers and creditors.' },
    source: 'A.R.S. 42-1109, 42-1123, 42-1125; azdor.gov (payment arrangements, collections, Pub 2)',
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
      { code: 'Notice Of Deficiency', title: 'A Notice Of Deficiency From Colorado', words: 'if you pay within 30 days or ask for a plan, interest stays at 8%. After that, it’s 11%.', days: 30 },
      { code: 'Final Determination And Demand', title: 'Colorado’s Final Determination And Demand', words: 'if it stays unpaid with no plan, a 15% collection penalty follows.', days: 30 },
      { code: 'Notice Of Intent To Issue Judgment/Lien', title: 'Colorado Intends To File A Lien', words: 'in 10 days it may file a lien and levy your accounts.', days: 30 },
    ],
    levy: { title: 'Colorado Levied Your Accounts', afterDays: 10, againDays: 91 },
    timingAssumed: true,
    // The final demand unpaid, with no plan: 15% of the tax (39-21-118).
    charges: [{ step: 2, share: 0.15, of: 'tax', words: 'the collection penalty, 15% of the tax' }],
    // Up to 36 months, no fee; a default makes the whole due after a written notice, whose days weren't found; a new
    // balance can be added by asking (SLATE asks for them).
    plan: { name: 'Payment Plan', minMonths: 1, maxMonths: 36, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'notice', days: 30 }, cureAssumed: true, newBalance: 'joins', newBalanceAssumed: true, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    // The department files a return from what it has. When, and its letter, weren't found: a Notice of Deficiency, as on
    // any assessment.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [{ code: 'Notice Of Deficiency', title: 'Colorado Filed A Return For You', words: 'you didn’t file, so it worked out the tax from what was reported. File your own within 30 days.', days: 30 }],
      lettersAssumed: true,
    },
    refundDays: 21,
    lien: { name: 'Colorado Judgment Lien', atStep: 3, recordedAt: 'the county clerk and recorder, by a district court judgment', releaseDays: 30, releaseAssumed: true, releaseOnRequest: 'DOR gives you a Release of Lien to record', error: { how: 'Colorado’s process for a lien filed in error isn’t published, so in the game its review takes 30 days', days: 30, daysAssumed: true }, effect: 'Assets can’t be sold until the debt is paid.' },
    source: 'C.R.S. 39-21-109, 39-21-118, 39-22-621; tax.colorado.gov (interest rates, payment plans, collections, wage garnishments)',
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
      { code: 'Notice Of Proposed Assessment', title: 'Georgia Proposes An Assessment', words: 'you have 45 days to pay or appeal.', days: 30 },
      { code: 'Official Assessment And Demand', title: 'Georgia’s Official Assessment And Demand', words: 'you have 45 days before a state tax execution.', days: 45 },
      { code: 'State Tax Execution', title: 'Georgia Issued A State Tax Execution', words: 'it’s a lien, with a 20% collection fee. A levy may follow.', days: 45 },
    ],
    levy: { title: 'Georgia Levied Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    charges: [{ step: 2, share: 0.2, of: 'owed', words: 'the collection fee with the execution, 20% of what you owe' }],
    // Up to 60 months, at least $25 a month, a $50 fee by bank draft, about 30 days to decide. A late payment or a new
    // balance is a default, and the default letter's days weren't found. How the fee is paid wasn't found: added.
    plan: { name: 'Installment Payment Agreement', minMonths: 1, maxMonths: 60, minMonthly: 25_00, fee: 50_00, feeAdded: true, decideDays: 30, decideAssumed: false, cure: { kind: 'notice', days: 30 }, cureAssumed: true, newBalance: 'default', newBalanceAssumed: false, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    // A Notice to Submit Return, then an estimate assessed by a proposed assessment's 45 days. When it comes, and the
    // letter's own days, weren't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'Notice To Submit Return', title: 'Georgia Asks For Your Return', words: 'file by the date on the letter, or it’s estimated for you.', days: 30 },
        { code: 'Notice Of Proposed Assessment', title: 'Georgia Proposes What You Owe', words: 'it’s estimated from what was reported. You have 45 days to file or appeal.', days: 45 },
      ],
      lettersAssumed: true,
    },
    refundDays: 21,
    lien: { name: 'State Tax Execution', atStep: 2, recordedAt: 'the clerk of superior court', releaseDays: 5, releaseAssumed: false, error: { how: 'the execution is withdrawn', days: 30, daysAssumed: true }, effect: 'It hampers transferring property.' },
    source: 'O.C.G.A. 48-2-40, 48-7-57, 48-7-86; dor.georgia.gov (payment plans, letters, taxpayer bill of rights)',
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
      { code: 'DOTAX Bill', title: 'A Bill From Hawaii', words: 'the tax, its penalties and interest are due.', days: 30 },
      { code: 'Written Demand', title: 'Hawaii Demands Payment', words: 'pay within 10 days, or a $50 fee and a levy follow.', days: 30 },
    ],
    levy: { title: 'Hawaii Levied Your Accounts', afterDays: 10, againDays: 91, feeEach: 15_00 },
    timingAssumed: true,
    charges: [{ step: 2, flat: 50_00, words: 'the delinquent account fee' }],
    // Over $100, a $50 fee; a new liability defaults it; notice before collection, whose days weren't found. The longest
    // wasn't found: SLATE's three years. Over twelve months a lien is filed, which SLATE didn't model until 2026-10-11:
    // it's `lien.plan` below.
    plan: { name: 'Installment Agreement', min: 100_00, minMonths: 1, maxMonths: 36, monthsAssumed: true, fee: 50_00, feeAdded: true, decideDays: 0, decideAssumed: true, cure: { kind: 'notice', days: 30 }, cureAssumed: true, newBalance: 'default', newBalanceAssumed: false, notInCollection: false, beyond: 'Over twelve months it files a lien.' },
    offsetsOwnRefunds: true, offsetsFor: [],
    // The department makes the return from what it has (235-107), 30 days to object to the proposed assessment. When
    // wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [{ code: 'Proposed Assessment', title: 'Hawaii Made Your Return', words: 'you didn’t file, so it worked out the tax from what was reported. You have 30 days to file your own or object.', days: 30 }],
      lettersAssumed: false,
    },
    refundDays: 21,
    lien: { name: 'Hawaii Tax Lien', atStep: 2, recordedAt: 'the Bureau of Conveyances', fee: 2500, releaseFee: 2500, releaseDays: 30, releaseAssumed: true, plan: { monthsOver: 12 }, error: { how: 'Hawaii’s process for a lien filed in error isn’t published, so in the game its review takes 30 days', days: 30, daysAssumed: true }, effect: 'It takes priority, and reaches Land Court registered land.' },
    source: 'HRS 231-23, 231-39, 231-53, 235-107; tax.hawaii.gov (payment plans, collections, wage levy, N-11 Taxpayer Bill of Rights)',
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
      { code: 'IDOR-2-BILL', title: 'A Notice Of Tax Due From Illinois', words: 'if you pay within 30 days, interest stops. If not, a deficiency notice follows.', days: 30 },
      { code: 'LTR-393-IPD', title: 'A Notice Of Deficiency From Illinois', words: 'if it’s unpaid in 30 days, a collection fee is added and IDOR may levy.', days: 30 },
    ],
    levy: { title: 'Illinois Levied Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    charges: [{ step: 2, flat: 100_00, under: { below: 1_000_00, flat: 30_00 }, words: 'the cost of collection fee' }],
    // No fee; a new balance joins; over $15,000 a financial statement, which SLATE doesn't model; the longest and what a
    // missed payment does beyond making the whole due weren't found.
    plan: { name: 'Installment Plan', max: 15_000_00, minMonths: 1, maxMonths: 36, monthsAssumed: true, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: false, newBalance: 'joins', newBalanceAssumed: false, notInCollection: false, beyond: 'Over $15,000 it asks for a financial statement, which the game doesn’t offer.' },
    offsetsOwnRefunds: true,
    // 35 ILCS 5/911.2 lets it trade refunds with states that return the favor; which do isn't published.
    offsetsFor: [],
    // Best judgment and information (5/904(b)): a nonfiling notice, 30 days, then a Notice of Deficiency, assessed in 60;
    // still unfiled 30 days after the nonfiling notice, a second penalty of 2%, at least $250, at most $5,000. When the
    // notice comes wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'Nonfiling Notice', title: 'Illinois Asks For Your Return', words: 'file within 30 days, or a second late-filing penalty is added.', days: 30 },
        { code: 'Notice Of Deficiency', title: 'Illinois Proposes What You Owe', words: 'it’s based on what was reported, and assessed in 60 days.', days: 60 },
      ],
      lettersAssumed: false,
      adds: [{ share: 0.02, atLeast: 250_00, atMost: 5_000_00, words: 'the penalty for not filing after notice, 2% of the tax, at least $250 and at most $5,000' }],
    },
    refundDays: 21,
    lien: { name: 'State Tax Lien Registry Notice', atStep: 2, recordedAt: 'the State Tax Lien Registry', releaseDays: 30, releaseAssumed: true, error: { how: 'a release is issued for a lien filed in error', days: 30, daysAssumed: true }, effect: 'In most cases the property can’t be sold or transferred.' },
    source: '35 ILCS 5/904, 5/909, 5/911.2, 5/911.3, 735/3-2, 735/3-3; tax.illinois.gov (letters, payment plans, Pub-103)',
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
      { code: 'Notice Of Assessment', title: 'A Notice Of Assessment From Louisiana', words: 'you have 60 days to pay or appeal before it’s final.', days: 30 },
      { code: 'Notice Of Final Assessment', title: 'Louisiana’s Final Assessment', words: 'the assessment is final. A notice of intent to offset and garnish follows.', days: 60 },
      { code: 'Notice Of Intent To Offset', title: 'Louisiana Intends To Collect', words: 'in 60 days your refunds may be taken and your accounts garnished.', days: 30 },
    ],
    levy: { title: 'Louisiana Garnished Your Accounts', afterDays: 60, againDays: 91 },
    timingAssumed: true,
    // Under $25,000, up to 36 months, a $105 fee waived at $25,000 of income or less, by automatic debit; one missed
    // payment makes the whole due; a new balance unpaid is a default. Its 20% down payment wasn't modeled until
    // 2026-10-11: it's offered, never required (`plan.downPayment`).
    // Under $50,000 and up to 60 months informally, since the rule of September 2024 (LR 50:1293; until then $25,000 and
    // 36 months, as SLATE had it until 2026-10-11); beyond, a formal agreement with financial information on request
    // (R-20223), whose longest isn't published. 20% down "may be required" at the secretary's discretion (LAC
    // 61:I.4919(B)(6)): offered, never asked by SLATE.
    plan: { name: 'Installment Agreement', max: 49_999_99, minMonths: 1, maxMonths: 60, fee: 105_00, feeAdded: true, feeWaivedAtMost: 25_000_00, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: false, newBalance: 'default', newBalanceAssumed: false, notInCollection: false,
      downPayment: { share: 0.2, required: false, why: 'LDR’s form works out a 20% down payment, which “may be required” at the secretary’s discretion. No rule for when is published, so the game never requires it.' },
      long: { name: 'Formal Installment Agreement', maxMonths: 84, maxAssumed: true, over: 50_000_00, statement: 'financial information on request (R-20223)', decideDays: 30, decideAssumed: true, how: 'LDR doesn’t publish how it decides a formal agreement. In the game, it approves one whose monthly payment fits what your financial statement leaves over each month, for up to 84 months.' } },
    offsetsOwnRefunds: true, offsetsFor: [],
    // An estimate from the federal match, by a proposed assessment's 30 days. When wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [{ code: 'Notice Of Proposed Assessment', title: 'Louisiana Proposes What You Owe', words: 'you didn’t file, so it estimated the tax from what the IRS reported. You have 30 days to file or respond.', days: 30 }],
      lettersAssumed: false,
    },
    refundDays: 21,
    lien: { name: 'Louisiana Tax Lien', atStep: 1, recordedAt: 'the parish recorder of mortgages and clerk of court', releaseDays: 30, releaseAssumed: true, releaseOnRequest: 'the secretary may authorize its cancellation once it’s paid and you ask. The parish charges a cancellation fee, and its amount isn’t published', error: { how: 'Louisiana’s process for a lien filed in error isn’t published, so in the game its review takes 30 days', days: 30, daysAssumed: true }, effect: 'It may affect selling, refinancing or transferring property.' },
    source: 'La. R.S. 47:1601, 47:1602; revenue.louisiana.gov (RIB 26-001, R-19026, collections; a 2017 LDR presentation)',
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
      { code: 'Notice Of Assessment', title: 'A Notice Of Assessment From Massachusetts', words: 'you have 30 days to pay.', days: 30 },
      { code: 'Statement Of Account', title: 'Massachusetts Demands Payment', words: 'if it stays unpaid, a $30 demand charge and collection follow.', days: 30 },
      { code: 'Final Notice', title: 'Massachusetts’s Final Notice', words: 'DOR may now levy your bank accounts.', days: 30 },
    ],
    levy: { title: 'Massachusetts Levied Your Accounts', afterDays: 10, againDays: 91 },
    timingAssumed: true,
    charges: [{ step: 2, flat: 30_00, words: 'the demand charge' }],
    // $10,000 or less online, up to 36 months, at least $25 a month; a missed payment brings a notice of intent to
    // cancel, whose days weren't found; a new balance must be paid or it's the same notice. No fee was found.
    plan: { name: 'Payment Agreement', max: 10_000_00, minMonths: 1, maxMonths: 36, minMonthly: 25_00, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'notice', days: 30 }, cureAssumed: true, newBalance: 'default', newBalanceAssumed: false, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    // Assessed at any time; up to double the tax where no return comes within 30 days of notice, at DOR's discretion,
    // which SLATE doesn't take: a Notice of Intent to Assess, 30 days. When the notice comes wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'Notice Of Failure To File', title: 'Massachusetts Asks For Your Return', words: 'file a proper return within 30 days. If you don’t, DOR may assess up to double the tax (G.L. c. 62C, s. 28). That’s at DOR’s discretion, with no published rule for when, so the game doesn’t do it.', days: 30 },
        { code: 'Notice Of Intent To Assess', title: 'Massachusetts Intends To Assess', words: 'it’s based on what was reported. You have 30 days to file or ask for a conference.', days: 30 },
      ],
      lettersAssumed: true,
    },
    refundDays: 21,
    lien: { name: 'Massachusetts Tax Lien', atStep: 2, recordedAt: 'the registry of deeds and the Secretary of the Commonwealth', fee: 0, releaseDays: 20, releaseAssumed: false, error: { how: 'Massachusetts’s process for a lien filed in error isn’t published, so in the game its review takes 30 days', days: 30, daysAssumed: true }, effect: 'It may prevent the sale or transfer of property.' },
    source: 'G.L. c. 62C, ss. 26, 32, 33; 830 CMR 62C.33.1; mass.gov (payment agreements, collections, TIR 26-5, AP 631; read from web.archive.org copies)',
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
      { code: 'Notice Of Collection', title: 'A Notice Of Collection From North Carolina', words: 'the amount due isn’t paid in full.', days: 30 },
      { code: 'Notice Of Collection, Second', title: 'North Carolina’s Second Notice', words: 'a certificate of tax liability and garnishment may follow, and after 60 days a 20% collection fee is added.', days: 30 },
    ],
    levy: { title: 'North Carolina Garnished Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    charges: [{ step: 2, share: 0.2, of: 'owed', words: 'the collection assistance fee, 20% of what you owe' }],
    // Up to 18 months, by bank draft; 30 days to cure a default. A fee wasn't stated; a new balance unpaid read as a
    // default, inferred.
    plan: { name: 'Installment Payment Agreement', minMonths: 1, maxMonths: 18, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'notice', days: 30 }, cureAssumed: false, newBalance: 'default', newBalanceAssumed: true, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    // A Notice to File, 30 days, then a Notice of Assessment, 45. When it comes wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'Notice To File', title: 'North Carolina Asks For Your Return', words: 'file within 30 days.', days: 30 },
        { code: 'Notice Of Individual Income Tax Assessment', title: 'North Carolina Assesses What You Owe', words: 'it’s based on what was reported. You have 45 days to file or respond.', days: 45 },
      ],
      lettersAssumed: false,
    },
    refundDays: 21,
    lien: { name: 'Certificate Of Tax Liability', atStep: 2, recordedAt: 'the clerk of superior court, as a judgment', releaseDays: 30, releaseAssumed: true, error: { how: 'an appeal to the Secretary (G.S. 105-242(g)), and it’s withdrawn as quickly as possible', days: 30, daysAssumed: true }, effect: 'It must be resolved for a clear title.' },
    source: 'N.C.G.S. 105-236, 105-241.21, 105-243.1; ncdor.gov (installment agreements, notices, collection)',
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
      { code: 'Notice Of Assessment', title: 'A Notice Of Assessment From New Mexico', words: 'you have 90 days to pay or protest.', days: 30 },
      { code: 'Statement Of Account', title: 'New Mexico: Delinquent', words: 'the assessment is delinquent, and a lien may follow.', days: 90 },
      { code: 'Final Notice Before Seizure', title: 'New Mexico’s Final Notice Before Seizure', words: 'TRD may now levy your bank accounts.', days: 30 },
    ],
    levy: { title: 'New Mexico Levied Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    // Up to 12 months on TAP without a lien; longer needs one, which SLATE didn't model until 2026-10-11 (`plan.long`).
    // A missed payment, a new debt or a return not filed ends it.
    // Twelve installments or fewer with no lien; thirteen to 72 with a lien or security (NMSA 7-1-21; TRD's page): from
    // 2026-10-11 the longer one too, its lien filed with it. Approved online, many automatically.
    plan: { name: 'Installment Agreement', minMonths: 1, maxMonths: 12, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: false, newBalance: 'default', newBalanceAssumed: false, notInCollection: false,
      downPayment: { required: false, why: 'TRD’s online agreement takes a down payment of your choosing.' },
      long: { name: 'Long-Term Installment Agreement', maxMonths: 72, maxAssumed: false, lien: true, decideDays: 0, decideAssumed: true, how: 'It runs 13 to 72 months, with a lien filed as its security, and it’s approved online.' } },
    offsetsOwnRefunds: true, offsetsFor: [],
    // Estimated from the IRS's data, seven years back. The demand's days weren't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [{ code: 'Demand To File', title: 'New Mexico Asks For Your Return', words: 'file, or it’s estimated from what the IRS reported.', days: 30 }],
      lettersAssumed: true,
    },
    refundDays: 21,
    lien: { name: 'Notice Of Claim Of Tax Lien', atStep: 2, recordedAt: 'the county clerk or the Secretary of State', fee: 0, releaseDays: 0, releaseAssumed: false, plan: { monthsOver: 12 }, error: { how: 'released where it was filed prematurely or improperly', days: 30, daysAssumed: true }, effect: 'It establishes the state’s priority among creditors.' },
    source: 'NMSA 7-1-67, 7-1-69 (FindLaw); tax.newmexico.gov (installment agreements, collections, hearing decisions)',
  },
  'us-or': {
    agency: 'Oregon Department of Revenue', short: 'Oregon DOR', form: 'OR-40',
    // 8% a year in 2026, simple, by the day, not on penalties; 12% on an assessment unpaid 60 days after it (ORS 305.220,
    // 305.222; from DOR's non-binding bulletin).
    interest: { yearly: 0.08, how: 'daily-simple', onPenalty: false, raised: { yearly: 0.12, afterDays: 60, unlessPlan: false } },
    // 5% once (314.400(1)).
    payLate: { once: 0.05, monthly: 0, cap: 0.05 },
    // 20% more filed past three months late (314.400(2)). The 100% for three years running unfiled (314.400(5)) wasn't
    // counted until 2026-10-11: it's threeYear below.
    fileLate: { monthly: 0, cap: 0.2, once: 0.2, afterMonths: 3, combine: 'added' },
    // Penalty, then interest, then tax (305.265(13)).
    order: ['penalty', 'interest', 'tax'], orderAssumed: false,
    // A Notice of Assessment, a Notice and Demand, then a distraint warrant at least 30 days on, then a levy. The days
    // from the assessment weren't found.
    notices: [
      { code: 'Notice Of Assessment', title: 'A Notice Of Assessment From Oregon', words: 'if it’s unpaid in 60 days, interest rises to 12%.', days: 30 },
      { code: 'Notice And Demand', title: 'Oregon Demands Payment', words: 'a distraint warrant may follow in 30 days.', days: 30 },
      { code: 'Distraint Warrant', title: 'Oregon Issued A Distraint Warrant', words: 'it’s a lien on what you own. A levy may follow.', days: 30 },
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
        { code: 'Demand To File', title: 'Oregon Demands Your Return', words: 'file within 30 days, or it’s estimated for you with 25% more.', days: 30 },
        { code: 'Notice Of Determination And Assessment', title: 'Oregon Determines What You Owe', words: 'it’s estimated from what was reported.', days: 30 },
      ],
      lettersAssumed: true,
      adds: [{ share: 0.25, words: 'the penalty for not filing on demand, 25% of the tax' }],
    },
    refundDays: 21,
    threeYear: { share: 1, extensionMonths: 6, waiver: { beforeNotice: 0.7, afterDemand: 0.5, afterAssessment: 0.25 }, windowDays: 365 },
    lien: { name: 'Distraint Warrant', atStep: 2, recordedAt: 'the county clerk’s lien record', releaseDays: 30, releaseAssumed: false, error: { how: 'Oregon’s process for a warrant filed in error isn’t published, so in the game its review takes 30 days', days: 30, daysAssumed: true }, effect: 'It’s the public notice of debt that attaches to real property.' },
    source: 'ORS 305.220, 305.222, 305.265, 314.400; oregon.gov/dor (payment plans, collections, bulletins)',
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
      { code: 'Billing Notice', title: 'A Bill From Pennsylvania', words: 'you have 30 days to pay or respond.', days: 30 },
      { code: 'Notice Of Assessment', title: 'A Notice Of Assessment From Pennsylvania', words: 'you have 90 days to pay or appeal.', days: 30 },
      { code: 'Notice Of Intent To Garnish', title: 'Pennsylvania Intends To Garnish', words: 'a lien is filed, and in 30 days your pay or accounts may be garnished.', days: 90 },
    ],
    levy: { title: 'Pennsylvania Garnished Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    // Online, under $50,000 over up to twelve months, by automatic withdrawal, every return filed; not under a
    // garnishment order. Its fee, decision time and what a missed payment does weren't found.
    // From 2026-10-11 its extended plan too (REV-488, the Statement of Financial Condition): over 12 months, over $50,000,
    // or with a plan already in force. Its longest, fee and decision time aren't published (72 P.S. 3310-205 sets none).
    plan: { name: 'Payment Plan', max: 49_999_99, minMonths: 1, maxMonths: 12, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: true, newBalance: 'default', newBalanceAssumed: false, notInCollection: true,
      downPayment: { required: false, why: 'A down payment is optional (myPATH), paid within 30 days of the request.' },
      long: { name: 'Extended Payment Plan', maxMonths: 60, maxAssumed: true, over: 50_000_00, alreadyOnPlan: true, statement: 'a REV-488 Statement of Financial Condition', decideDays: 14, decideAssumed: true, how: 'Pennsylvania doesn’t publish how it decides an extended plan, its longest term or how long it takes. In the game, it approves one whose monthly payment fits what your financial statement leaves over each month, for up to 60 months, and decides in 14 days.' } },
    offsetsOwnRefunds: true, offsetsFor: [],
    // A Non-Filer Notice, 30 days to reply, then an estimated assessment, 90 days to pay or petition (72 P.S. 7338; the
    // reply's days from search excerpts of the department's answers). When the notice comes wasn't found.
    nonFiler: {
      firstDays: YEAR, firstAssumed: true,
      letters: [
        { code: 'Personal Income Tax Non-Filer Notice', title: 'Pennsylvania Asks For Your Return', words: 'its records show income and no return. Reply within 30 days.', days: 30 },
        { code: 'Notice Of Estimated Assessment', title: 'Pennsylvania Estimates What You Owe', words: 'it’s based on what was reported. You have 90 days to file, pay or petition.', days: 90 },
      ],
      lettersAssumed: false,
    },
    refundDays: 21,
    lien: { name: 'Pennsylvania Tax Lien', atStep: 2, recordedAt: 'the county prothonotary', releaseDays: 45, releaseAssumed: false, error: { how: 'an appeal of the assessment within 90 days', days: 30, daysAssumed: true }, effect: 'It’s a public court record, on the monthly Lien Publication List.' },
    source: '72 P.S. 7338, 7352 (FindLaw); pa.gov/agencies/revenue (PA Personal Income Tax Guide, REV-1611, payment plans, wage garnishment, REV-554)',
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
      { code: 'bL0006', title: 'A Notice Of Assessment From Ohio', words: 'you have 60 days to pay or appeal.', days: 30 },
      { code: 'bL0008', title: 'Ohio’s Post Appeal Notice', words: 'the assessment is final. Pay it now.', days: 60 },
      { code: 'Top Notice', title: 'Ohio’s Top Notice', words: 'in 45 days the claim goes to the Attorney General, and your federal refund may be taken.', days: 45 },
      { code: 'Certified Claim', title: 'Your Ohio Tax Went To The Attorney General', words: 'the Attorney General collects it now, with its collection cost, and interest runs on the penalties too.', days: 45 },
    ],
    levy: { title: 'The Ohio Attorney General Collected From Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    charges: [{ step: 4, share: 0.1, of: 'owed', words: 'the Attorney General’s collection cost, 10% of what you owe' }],
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
        { code: 'bL0006', title: 'Ohio Assesses What You Owe', words: 'it’s based on what the IRS reported. You have 60 days to appeal, and must pay it first.', days: 60 },
      ],
      lettersAssumed: false,
    },
    refundDays: 21,
    lien: { name: 'Judgment Lien', atStep: 4, recordedAt: 'the clerk of the court of common pleas', releaseDays: 14, releaseAssumed: false, releaseOnRequest: 'the Attorney General mails the release, and you file it with the county', error: { how: 'Ohio’s process for a lien filed in error isn’t published, so in the game its review takes 30 days', days: 30, daysAssumed: true }, effect: 'It lets the state execute on property and offset refunds.' },
    source: 'Ohio R.C. 109.081, 5703.47, 5747.15; tax.ohio.gov (interest rates, notices, assessments, refund offsets, ITDQ0009)',
  },
  // From the remaining-gaps pass of 2026-10-11 (research-state-tax-in-dc-ok.json, research-local-income-taxes.json,
  // research-state-tax-liens-a.json, -b.json): Indiana, the District and Oklahoma, which had a city each and no rule;
  // and the three cities that collect their own tax, each an authority apart from its state.
  'us-in': {
    agency: 'Indiana Department of Revenue', short: 'Indiana DOR', form: 'IT-40',
    // 6% for 2025, 7% for 2026, 6% for 2027 (Departmental Notice #3), on the tax only; simple by the day, SLATE's where
    // the daily or monthly reckoning wasn't found.
    interest: { yearly: 0.07, how: 'daily-simple', onPenalty: false, byYear: { 2025: 0.06, 2026: 0.07, 2027: 0.06 } },
    // 10% once, at least $5, for paying or filing late, one penalty not two (IC 6-8.1-10-2.1).
    payLate: { once: 0.1, monthly: 0, cap: 0.1, minimum: 5_00 },
    fileLate: { monthly: 0, cap: 0, combine: 'none' },
    // Tax, then penalty, then interest, for periods from 2021 (IC 6-8.1-8-1.5).
    order: ['tax', 'penalty', 'interest'], orderAssumed: false,
    // The Notice of Proposed Assessment (60 days), the Demand for Payment (20 days), then the Tax Warrant with its 10%
    // collection fee, which is a judgment and a lien; then the sheriff. The days before the first weren't found.
    notices: [
      { code: 'Notice Of Proposed Assessment', title: 'Indiana Proposes An Assessment', words: 'you have 60 days to pay or protest.', days: 30 },
      { code: 'Demand For Payment', title: 'Indiana Demands Payment', words: 'pay within 20 days, or a tax warrant follows with a 10% collection fee.', days: 60 },
      { code: 'Tax Warrant', title: 'Indiana Issued A Tax Warrant', words: 'it’s a judgment and a lien, with a 10% collection fee, and the sheriff may levy.', days: 20 },
    ],
    levy: { title: 'Indiana Levied Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    charges: [{ step: 2, share: 0.1, of: 'tax', words: 'the tax warrant’s collection fee, 10% of the tax' }],
    lien: { name: 'Tax Warrant', atStep: 2, recordedAt: 'the circuit court clerk', releaseDays: 30, releaseAssumed: true, error: { how: 'released and expunged within 7 days', days: 7, daysAssumed: false }, effect: 'A title search finds it, and it reaches vehicle titles.' },
    // Over $100, through INTIME: 12 months to $1,000, 24 to $5,000, 36 above; little or nothing down; a missed payment
    // may cancel it; a new liability doesn't join on its own. Fee and decision time weren't found.
    plan: { name: 'Payment Plan', min: 100_00, minMonths: 1, maxMonths: 36, tiers: [{ upTo: 1_000_00, maxMonths: 12 }, { upTo: 5_000_00, maxMonths: 24 }, { maxMonths: 36 }], fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: true, newBalance: 'default', newBalanceAssumed: true, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    // A notice to file, 30 days; then DOR's own return with a 20% penalty in place of the 10%, 60 days to protest (IC
    // 6-8.1-10-3). The letters' names weren't found.
    nonFiler: {
      firstDays: 365, firstAssumed: true,
      letters: [
        { code: 'Notice To File', title: 'Indiana Asks For Your Return', words: 'file within 30 days, or DOR files one for you with a 20% penalty.', days: 30 },
        { code: 'Proposed Assessment', title: 'Indiana Made Your Return', words: 'you didn’t file, so DOR worked it out. You have 60 days to protest.', days: 60 },
      ],
      lettersAssumed: false,
      adds: [{ share: 0.1, words: 'the penalty on a return DOR made, 20% in place of 10%' }],
    },
    refundDays: 20,
    source: 'IC 6-3-2-1, 6-8.1-8-1.5, 6-8.1-10-1, 6-8.1-10-2.1, 6-8.1-10-3; in.gov/dor (Departmental Notices 1 and 3, payment plans, collections)',
  },
  'us-dc': {
    agency: 'District of Columbia Office of Tax and Revenue', short: 'DC OTR', form: 'D-40',
    // 10% a year, compounded daily, on penalties too (DC Code 47-4201).
    interest: { yearly: 0.1, how: 'daily', onPenalty: true },
    // 5% a month or part, to 25%; filing late the same, less the paying-late penalty in the same months (47-4213, 47-4211).
    payLate: { once: 0, monthly: 0.05, cap: 0.25 },
    fileLate: { monthly: 0.05, cap: 0.25, combine: 'reduced-by-payment' },
    // The collection fee, then penalty, then interest, then tax, once the fee applies; before it, not published: the
    // same, SLATE's.
    order: ['penalty', 'interest', 'tax'], orderAssumed: true,
    // The Notice of Tax Due (15 days), the Notice of Enforcement by certified mail (10 days), the 10% collection fee at 90
    // days unpaid, a levy, and a lien recorded once the first notice is 10 days unpaid.
    notices: [
      { code: 'Notice Of Tax, Penalty And/Or Interest Due', title: 'A Notice Of Tax Due From The District', words: 'pay within 15 days.', days: 30 },
      { code: 'Notice Of Enforcement', title: 'The District’s Notice Of Enforcement', words: 'if it’s unpaid in 10 days, a levy and a lien follow, and at 90 days a 10% collection fee.', days: 15 },
    ],
    levy: { title: 'The District Levied Your Accounts', afterDays: 45, againDays: 91 },
    timingAssumed: false,
    charges: [{ step: 2, share: 0.1, of: 'owed', words: 'the collection fee, 10% of what you owe' }],
    lien: { name: 'District Tax Lien', atStep: 1, recordedAt: 'the Recorder of Deeds', releaseDays: 30, releaseAssumed: true, plan: { monthsOver: 12, over: 25_000_00 }, error: { how: 'a protest of the assessment, then the Office of Administrative Hearings', days: 30, daysAssumed: true }, effect: 'It’s a preferred claim over other creditors, and can block a loan or a sale.' },
    // Under $100,000 and up to 24 months, 10% down, by direct debit, every return filed; a lien where it's over $25,000 or
    // over 12 months. A missed payment cancels it. Fee and decision time weren't found.
    plan: { name: 'Installment Agreement', max: 99_999_99, minMonths: 1, maxMonths: 24, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: false, newBalance: 'default', newBalanceAssumed: true, notInCollection: false,
      downPayment: { share: 0.1, required: true, why: 'OTR asks 10% down with the agreement.' } },
    offsetsOwnRefunds: true,
    // Other states' tax by reciprocal agreement; which states isn't published.
    offsetsFor: [],
    // An Information Request for the period (60 days), then a Notice of Proposed Assessment (30 days to protest).
    nonFiler: {
      firstDays: 365, firstAssumed: true,
      letters: [
        { code: 'Information Request For Non-Filed Period', title: 'The District Asks About Your Return', words: 'its records show income and no return. Answer within 60 days.', days: 60 },
        { code: 'Notice Of Proposed Assessment', title: 'The District Proposes What You Owe', words: 'you have 30 days to protest.', days: 30 },
      ],
      lettersAssumed: false,
    },
    refundDays: 56,
    source: 'DC Code 47-1806.03, 47-4201, 47-4211, 47-4213, 47-4421; otr.cfo.dc.gov (collections, installment agreements, refunds)',
  },
  'us-ok': {
    agency: 'Oklahoma Tax Commission', short: 'Oklahoma OTC', form: '511',
    // 1.25% a month, simple, on penalties too (68 O.S. 217); counted by months begun, SLATE's.
    interest: { yearly: 0.15, how: 'monthly-simple', onPenalty: true },
    // 5% once (68 O.S. 2375); no separate late-filing penalty.
    payLate: { once: 0.05, monthly: 0, cap: 0.05 },
    fileLate: { monthly: 0, cap: 0, combine: 'none' },
    // Tax, oldest first, then interest, then penalties (OAC 710:1-5-27).
    order: ['tax', 'interest', 'penalty'], orderAssumed: false,
    // A bill, a proposed assessment (60 days to protest), then a tax warrant filed with the county clerk, a lien for ten
    // years with its charge, the greater of $15 and 10%, at most $200 (68 O.S. 231.1). The days between weren't found.
    notices: [
      { code: 'Billing Notice', title: 'A Bill From Oklahoma', words: 'the tax, its penalty and interest are due.', days: 30 },
      { code: 'Proposed Assessment', title: 'Oklahoma Proposes An Assessment', words: 'you have 60 days to pay or protest.', days: 30 },
      { code: 'Tax Warrant', title: 'Oklahoma Issued A Tax Warrant', words: 'it’s a lien filed with the county clerk, with its charge, and garnishment may follow.', days: 60 },
    ],
    levy: { title: 'Oklahoma Garnished Your Accounts', afterDays: 30, againDays: 91 },
    timingAssumed: true,
    charges: [{ step: 2, share: 0.1, of: 'owed', atLeast: 15_00, atMost: 200_00, words: 'the tax warrant’s charge, 10% of what you owe, between $15 and $200' }],
    lien: { name: 'Tax Warrant', atStep: 2, recordedAt: 'the county clerk', fee: 8_00, releaseFee: 8_00, releaseDays: 30, releaseAssumed: true, error: { how: 'a warrant filed in error is released at no cost', days: 30, daysAssumed: true }, effect: 'It’s on the public warrant register, and must be resolved to sell or refinance.' },
    // Two to twelve months, $100 or more, nothing down (taxcure.com, a secondary source: the rule found is a business's).
    plan: { name: 'Payment Plan', min: 100_00, minMonths: 2, maxMonths: 12, monthsAssumed: true, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: true, newBalance: 'default', newBalanceAssumed: true, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    // A written demand to file within 10 days, then OTC's estimate, 60 days to protest. Its 25% on a refusal is "may":
    // discretionary, with no criterion published, so SLATE's OTC doesn't add it.
    nonFiler: {
      firstDays: 365, firstAssumed: true,
      letters: [
        { code: 'Demand To File', title: 'Oklahoma Demands Your Return', words: 'file within 10 days. OTC may add 25% if you refuse, but it publishes no rule for when, so the game doesn’t add it.', days: 10 },
        { code: 'Proposed Assessment', title: 'Oklahoma Estimates What You Owe', words: 'it’s based on what was reported. You have 60 days to protest.', days: 60 },
      ],
      lettersAssumed: false,
    },
    refundDays: 35,
    source: '68 O.S. 217, 231, 231.1, 2355, 2375; OAC 710:1-5-27; oklahoma.gov/tax (OW-2, Form 511, collections)',
  },
  'us-pa-philadelphia': {
    agency: 'City of Philadelphia Department of Revenue', short: 'Philadelphia Revenue', form: 'Earnings Tax Return',
    // 0.75% a month, 9% a year in 2025 and 2026; counted by months begun.
    interest: { yearly: 0.09, how: 'monthly-simple', onPenalty: false },
    // 1.25% a month; its cap wasn't found: SLATE holds it at 25%.
    payLate: { once: 0, monthly: 0.0125, cap: 0.25 },
    fileLate: { monthly: 0, cap: 0, combine: 'none' },
    order: ['tax', 'penalty', 'interest'], orderAssumed: true,
    // A past-due bill, then referral to an outside agency or law firm, court action and a lien; the days weren't found.
    notices: [
      { code: 'Past-Due Bill', title: 'A Past-Due Bill From Philadelphia', words: 'the Earnings Tax, its penalty and interest are due.', days: 30 },
      { code: 'Referral Notice', title: 'Philadelphia Sends Your Account To Collection', words: 'an outside agency or law firm collects it now, and court action and a lien may follow.', days: 60 },
    ],
    levy: { title: 'Philadelphia Collected By Court Action', afterDays: 60, againDays: 91 },
    timingAssumed: true,
    lien: { name: 'Philadelphia Tax Lien', atStep: 2, recordedAt: 'the court of common pleas', releaseDays: 30, releaseAssumed: true, error: { how: 'Philadelphia’s process for a lien filed in error isn’t published, so in the game its review takes 30 days', days: 30, daysAssumed: true }, effect: 'It’s a lien on property.' },
    // Up to 48 months, 60 preferred; a down payment is required and its amount isn't published (SLATE asks none).
    plan: { name: 'Payment Agreement', minMonths: 1, maxMonths: 48, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: true, newBalance: 'default', newBalanceAssumed: true, notInCollection: false, beyond: 'Philadelphia asks for a down payment, but its amount isn’t published, so the game asks for none.' },
    offsetsOwnRefunds: true, offsetsFor: [],
    // The resident who files assesses the Earnings Tax themselves; the city's own assessment of one who doesn't isn't
    // published: SLATE's, a bill a year on.
    nonFiler: {
      firstDays: 365, firstAssumed: true,
      letters: [{ code: 'Earnings Tax Assessment', title: 'Philadelphia Assessed Your Earnings Tax', words: 'you didn’t file, so Revenue worked it out from your wages.', days: 30 }],
      lettersAssumed: true,
    },
    refundDays: 60,
    source: 'Philadelphia Code 19-1500; phila.gov/revenue (Wage and Earnings Tax, payment agreements, collections)',
  },
  'us-oh-columbus': {
    agency: 'City of Columbus Income Tax Division', short: 'Columbus Income Tax', form: 'BR-25',
    // The federal short-term rate plus 5%: 9% for 2026, 10% for 2025 (ORC 718.27); by months begun. SLATE holds 9%, its
    // returns being 2026's and later.
    interest: { yearly: 0.09, how: 'monthly-simple', onPenalty: false },
    // Paying late to 15% (ORC 718.27); filing late $25 a month to $150.
    payLate: { once: 0.15, monthly: 0, cap: 0.15 },
    fileLate: { monthly: 0, cap: 0, combine: 'added', monthlyFlat: { amount: 25_00, cap: 150_00 } },
    order: ['tax', 'penalty', 'interest'], orderAssumed: true,
    // A bill with penalty and interest, the Delinquent Section, then the City Attorney's civil suit and a judgment; the
    // days weren't found.
    notices: [
      { code: 'Bill', title: 'A Bill From Columbus', words: 'the city income tax, its penalty and interest are due.', days: 30 },
      { code: 'Delinquent Notice', title: 'Columbus: Your Account Is Delinquent', words: 'if it stays unpaid, the City Attorney may sue for it.', days: 60 },
    ],
    levy: { title: 'Columbus Collected By Judgment', afterDays: 60, againDays: 91 },
    timingAssumed: true,
    lien: { name: 'Judgment Lien', atStep: 2, recordedAt: 'the court of common pleas, by the City Attorney’s suit', releaseDays: 30, releaseAssumed: true, error: { how: 'Columbus’s process for a lien filed in error isn’t published, so in the game its review takes 30 days', days: 30, daysAssumed: true }, effect: 'It’s a judgment against you.' },
    // Its plans' terms weren't found: SLATE's twelve months, said.
    plan: { name: 'Payment Plan', minMonths: 1, maxMonths: 12, monthsAssumed: true, fee: 0, feeAdded: false, decideDays: 0, decideAssumed: true, cure: { kind: 'none' }, cureAssumed: true, newBalance: 'default', newBalanceAssumed: true, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    nonFiler: {
      firstDays: 365, firstAssumed: true,
      letters: [{ code: 'Notice To File', title: 'Columbus Asks For Your Return', words: 'file within 30 days.', days: 30 }],
      lettersAssumed: true,
    },
    refundDays: 60,
    source: 'Ohio R.C. 718.27; Columbus City Code 361; columbus.gov/incometax',
  },
  'us-or-portland': {
    agency: 'City of Portland Revenue Division', short: 'Portland Revenue', form: 'MET-40 And MC-40',
    // 9% to 15 April 2026, 8% after (simple, monthly, 0.75% then 0.667%): SLATE holds 8%, a balance of 2026 or later's
    // never having owed at 9%.
    interest: { yearly: 0.08, how: 'monthly-simple', onPenalty: false },
    // 5% for filing or paying late, at least $5, only one of the two.
    payLate: { once: 0.05, monthly: 0, cap: 0.05, minimum: 5_00 },
    fileLate: { monthly: 0, cap: 0, combine: 'none' },
    order: ['tax', 'penalty', 'interest'], orderAssumed: true,
    notices: [
      { code: 'Bill', title: 'A Bill From Portland Revenue', words: 'the SHS and PFA taxes, their penalty and interest are due.', days: 30 },
      { code: 'Final Notice', title: 'Portland Revenue’s Final Notice', words: 'if it stays unpaid, it goes to a collection agency with up to 25% added.', days: 60 },
    ],
    levy: { title: 'Portland Revenue Collected Your Balance', afterDays: 60, againDays: 91 },
    timingAssumed: true,
    // Twelve months, 24 over $10,000; $25 to set up, $50 over 24 months; penalties stop while it holds.
    plan: { name: 'Payment Plan', minMonths: 1, maxMonths: 24, tiers: [{ upTo: 10_000_00, maxMonths: 12 }, { maxMonths: 24 }], fee: 25_00, feeAdded: true, decideDays: 0, decideAssumed: true, cure: { kind: 'notice', days: 30 }, cureAssumed: true, newBalance: 'default', newBalanceAssumed: true, notInCollection: false },
    offsetsOwnRefunds: true, offsetsFor: [],
    nonFiler: {
      firstDays: 365, firstAssumed: true,
      letters: [{ code: 'Notice To File', title: 'Portland Revenue Asks For Your Returns', words: 'file within 30 days.', days: 30 }],
      lettersAssumed: true,
    },
    refundDays: 60,
    source: 'Metro Code 7.05; Multnomah County Code 11.500; portland.gov/revenue',
  },
};

/** A state SLATE computes a tax for and hasn't researched: a balance kept, nothing added to it, and nothing assumed. */
export const STATE_UNRESEARCHED = 'The game doesn’t have this state’s collection rules, so the balance is kept with no penalty, interest, notice or plan added.';

/**
 * The IRS's offset of a federal refund to a state's income tax debt (IRC 6402(e)): only the state on the return's
 * address, after its notice, after federal tax; SLATE reads "past due" as a debt a state has sent its notices for.
 */
export const FEDERAL_STATE_OFFSET = { afterNotices: 1, source: 'IRC 6402(e)' } as const;
