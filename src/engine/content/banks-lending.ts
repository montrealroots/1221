/**
 * SLATE — what the thirteen countries' banks lend, and hold for a term.
 *
 * From the same research as `banks-thirteen.ts` (2026-09-25): each bank's
 * overdraft as it runs it, its personal loan rates, and its twelve-month
 * term deposit or the nearest it offers. Where a bank publishes none of a
 * thing, it isn't here and the bank doesn't offer it in the game, except
 * where a country's central bank publishes the market's average rate, which
 * is used for its banks and says so (`market`).
 *
 * The limits a bank would set aren't published anywhere; those are SLATE's
 * estimates, in `systems/lending.ts`, and the screen says so.
 */

import type { Money } from '../core/money';

/**
 * What a bank does when an account goes below zero without an arrangement,
 * or past the one it has: it pays, and charges for it. A fee an item that
 * took it there (capped by the month), a higher rate on what's past the
 * limit (Germany's geduldete Überziehung), or a fee for a month in which the
 * account sat past it by more than a margin at so many midnights (New
 * Zealand's unarranged overdraft fee), not charged under an age.
 */
export interface Unarranged {
  fee?: Money;
  maxPerMonth?: number;
  rate?: number;
  monthlyFee?: Money;
  graceUpTo?: Money;
  afterDays?: number;
  freeUnder?: number;
}

export type Overdraft =
  /**
   * An overdraft arranged in advance, up to a limit: interest on what's
   * used, at one rate or a range priced by the record, and whatever fees
   * the bank charges for having one. A buffer is used without interest.
   */
  | {
    kind: 'arranged'; rate: number; rateTo?: number; monthlyFee?: Money; yearlyFee?: Money; setupFee?: Money; buffer?: Money; minLimit?: Money; maxLimit?: Money;
    /** Past the limit, which the bank still pays (France's commission d'intervention, Germany's higher rate). */
    beyond?: Unarranged;
    source: string;
  }
  /**
   * No arrangement: the bank pays what the account can't and charges a fee
   * for each item that takes it below zero, at most so many a day, and none
   * while it is overdrawn by less than a grace amount. Some charge interest
   * on the overdrawn balance as well. `atMidnight`: one fee for a day on which
   * a payment overdrew it and that ends overdrawn, not one an item, and none
   * for a day it only stays overdrawn (CommBank, Westpac). `nextDay`: the fees
   * wait until the end of the next business day, and aren't charged if the
   * account is back within the grace by then (Chase, Wells Fargo). Until
   * 2026-09-25 a rate on the terms was what made the fee a midnight one, so
   * a bank couldn't charge interest and a fee an item both. `debitCard`: a
   * US bank may not pay an everyday debit card purchase into an overdraft
   * unless the customer has opted in (Regulation E, 12 CFR 1005.17);
   * `'opt_in'` where the bank offers it, `'never'` where it doesn't.
   */
  | {
    kind: 'per_item'; fee: Money; maxPerDay?: number; maxPerMonth?: number; graceUpTo?: Money; rate?: number;
    atMidnight?: boolean; nextDay?: boolean; debitCard?: 'opt_in' | 'never'; source: string;
  }
  /**
   * Spain's descubierto: no arrangement, interest on what's overdrawn, and a
   * commission on the most the account was overdrawn in the month, a share
   * of it with a floor.
   */
  | {
    kind: 'tacit'; rate: number; commission: { share: number; min: Money };
    /** The most a month's interest and commission together may cost, as a yearly rate on what was overdrawn day by day. */
    cap?: { rate: number; source: string };
    source: string;
  }
  /** No arrangement offered on the account SLATE opens, but the bank pays and charges (BNZ). */
  | ({ kind: 'unarranged'; source: string } & Unarranged)
  /** Japan's general account: a loan against time deposits, a share of them up to a cap, at their rate plus a margin. */
  | { kind: 'secured'; share: number; max: Money; over: number; source: string };

export interface Loan {
  /** The lowest rate a year, and the highest where the bank publishes a range. */
  from: number;
  to?: number;
  minAmount?: Money;
  maxAmount?: Money;
  minMonths?: number;
  maxMonths?: number;
  /** The rate is the country's market average, not this bank's own. */
  market?: boolean;
  source: string;
}

export interface Term {
  rate: number;
  months: number;
  minAmount?: Money;
  /** What the product is called there. */
  called: string;
  market?: boolean;
  source: string;
}

export interface Lending { overdraft?: Overdraft; loan?: Loan; term?: Term }

const FR_LOAN: Loan = { from: 0.0607, market: true, source: 'Banque de France, the average rate on new consumer credit, July 2026' };
const FR_TERM: Term = { rate: 0.0238, months: 12, called: 'Dépôt à terme', market: true, source: 'ECB, the average rate on new household deposits of up to a year, July 2026' };
const DE_LOAN: Loan = { from: 0.0858, market: true, source: 'ECB, the average APRC on new consumer credit in Germany, July 2026' };
const DE_TERM: Term = { rate: 0.0222, months: 12, called: 'Festgeld', market: true, source: 'the market average for a 12-month Festgeld, July 2026' };
const ES_LOAN: Loan = { from: 0.0773, market: true, source: 'Banco de España, the average TAE on new consumer credit, July 2026' };
const ES_TERM: Term = { rate: 0.0202, months: 12, called: 'Depósito a plazo fijo', market: true, source: 'ECB, household deposits of up to a year in Spain, July 2026' };

/** By bank id. */
export const LENDING: Readonly<Record<string, Lending>> = {
  // --- United States
  'us-chase': {
    overdraft: { kind: 'per_item', fee: 34_00, maxPerDay: 3, graceUpTo: 50_00, nextDay: true, debitCard: 'opt_in', source: 'chase.com standard overdraft practice; Chase Debit Card Coverage, opted into or not; Chase Overdraft Assist, chase.com overdraft FAQs: no fee overdrawn by $50 or less at the end of the business day, or brought back to that by 11 PM ET the next business day' },
    term: { rate: 0.035, months: 7, called: 'CD', source: 'Chase 7-month CD, via fortune.com, 24 September 2026' },
  },
  'us-bank-of-america': {
    overdraft: { kind: 'per_item', fee: 10_00, debitCard: 'never', source: 'NerdWallet review of Bank of America; bankofamerica.com: everyday debit card purchases and ATM withdrawals aren’t authorized into an overdraft' },
    term: { rate: 0.0375, months: 7, called: 'CD', source: 'Bank of America 7-month CD, via fortune.com, 24 September 2026' },
  },
  'us-wells-fargo': {
    overdraft: { kind: 'per_item', fee: 35_00, maxPerDay: 3, graceUpTo: 10_00, nextDay: true, debitCard: 'opt_in', source: 'wellsfargo.com overdraft services; Debit Card Overdraft Service, opted into or not; Extra Day Grace Period: no fees if the balance is back by 11:59 PM ET the next business day' },
    loan: { from: 0.0674, minAmount: 3_000_00, maxAmount: 100_000_00, minMonths: 12, maxMonths: 84, source: 'wellsfargo.com personal loans: from 6.74% APR, $3,000 to $100,000, 12 to 84 months' },
    term: { rate: 0.0389, months: 11, called: 'CD', source: 'Wells Fargo 11-month CD, via fortune.com, 24 September 2026' },
  },
  'us-citi': {
    loan: { from: 0.0999, to: 0.1749, source: 'citi.com personal loans: 9.99% to 17.49% APR' },
    term: { rate: 0.0425, months: 12, called: 'CD', source: 'Citi 12-month CD, via fortune.com, 24 September 2026' },
  },
  'us-capital-one': {
    term: { rate: 0.043, months: 11, called: 'CD', source: 'Capital One 11-month CD, via fortune.com, 24 September 2026' },
  },
  // --- Canada
  'ca-rbc': {
    overdraft: { kind: 'arranged', rate: 0.22, monthlyFee: 5_00, minLimit: 500_00, maxLimit: 5_000_00, source: 'RBC overdraft protection: $5 a month, about 22%, $500 to $5,000, via savvynewcanadians.com' },
    term: { rate: 0.0245, months: 12, called: 'GIC', source: 'RBC 1-year non-redeemable GIC, via wowa.ca, 24 September 2026' },
  },
  'ca-td': {
    overdraft: { kind: 'arranged', rate: 0.21, monthlyFee: 5_00, minLimit: 300_00, maxLimit: 5_000_00, source: 'td.com overdraft protection: $5 a month, 21%, $300 to $5,000' },
    term: { rate: 0.03, months: 12, called: 'GIC', source: 'TD 1-year non-redeemable GIC, via wowa.ca, 24 September 2026' },
  },
  'ca-scotiabank': {
    overdraft: { kind: 'arranged', rate: 0.21, monthlyFee: 5_00, source: 'scotiabank.com overdraft protection: $5 a month, 21%' },
    term: { rate: 0.0245, months: 12, called: 'GIC', source: 'Scotiabank 1-year non-redeemable GIC, via wowa.ca, 24 September 2026' },
  },
  'ca-bmo': {
    overdraft: { kind: 'arranged', rate: 0.21, monthlyFee: 5_00, source: 'BMO overdraft protection: $5 a month, 21%, via finder.com/ca' },
    term: { rate: 0.03, months: 12, called: 'GIC', source: 'BMO 1-year non-redeemable GIC, via wowa.ca, 24 September 2026' },
  },
  'ca-cibc': {
    overdraft: { kind: 'arranged', rate: 0.21, monthlyFee: 5_00, source: 'CIBC overdraft protection: $5 a month, 21% (low confidence)' },
    term: { rate: 0.0245, months: 12, called: 'GIC', source: 'CIBC 1-year non-redeemable GIC, via wowa.ca, 24 September 2026' },
  },
  // --- United Kingdom
  'gb-barclays': {
    overdraft: { kind: 'arranged', rate: 0.35, buffer: 15_00, source: 'barclays.co.uk: 35.0% a year, no interest on the first £15' },
    loan: { from: 0.0705, minAmount: 7_500_00, source: 'Barclays: 7.05% APR representative, on £7,500 and up; the rate on less wasn’t found' },
  },
  'gb-lloyds': {
    overdraft: { kind: 'arranged', rate: 0.199, rateTo: 0.499, source: 'lloydsbank.com: priced by risk, 19.9% to 49.9% EAR' },
  },
  'gb-natwest': {
    overdraft: { kind: 'arranged', rate: 0.3949, source: 'natwest.com: 39.49% EAR representative' },
    loan: { from: 0.072, minAmount: 7_500_00, source: 'NatWest: 7.2% APR representative, on £7,500 and up; the rate on less wasn’t found' },
    term: { rate: 0.0411, months: 12, called: 'Fixed-Term Savings', source: 'natwest.com: 4.11% AER' },
  },
  'gb-hsbc': {
    overdraft: { kind: 'arranged', rate: 0.399, buffer: 25_00, source: 'hsbc.co.uk: 39.9% EAR above a £25 buffer' },
    loan: { from: 0.068, to: 0.229, source: 'HSBC UK: 6.8% APR representative, up to 22.9%' },
  },
  'gb-santander': {
    overdraft: { kind: 'arranged', rate: 0.3994, source: 'santander.co.uk: 39.94% EAR representative' },
  },
  'gb-nationwide': {
    overdraft: { kind: 'arranged', rate: 0.399, buffer: 50_00, source: 'nationwide.co.uk: the first £50 free, then 39.9% a year' },
  },
  // --- Ireland
  'ie-aib': {
    overdraft: { kind: 'arranged', rate: 0.1185, yearlyFee: 25_39, source: 'aib.ie: 11.85% variable, a €25.39 facility fee' },
    loan: { from: 0.0895, source: 'aib.ie: 8.95% APR, 22 September 2026' },
    term: { rate: 0.02, months: 12, called: 'Fixed Term Deposit', source: 'AIB 12-month fixed: 2.00%' },
  },
  'ie-bank-of-ireland': {
    overdraft: { kind: 'arranged', rate: 0.1325, yearlyFee: 30_00, source: 'bankofireland.com: 13.25% variable, €30 a year' },
    loan: { from: 0.071, to: 0.089, source: 'Bank of Ireland: 7.1% to 8.9% APR' },
    term: { rate: 0.0215, months: 12, called: 'Fixed Term Deposit', source: 'Bank of Ireland 12-month fixed: 2.15% AER' },
  },
  'ie-ptsb': {
    overdraft: { kind: 'arranged', rate: 0.15, setupFee: 25_00, yearlyFee: 25_00, source: 'ptsb.ie: 15% variable, €25 to set up and €25 a year' },
    loan: { from: 0.062, to: 0.088, source: 'PTSB: 6.20% to 8.80% APR' },
    term: { rate: 0.02, months: 12, called: 'Fixed Term Deposit', source: 'PTSB 12-month fixed: 2.00%' },
  },
  // --- Iceland
  'is-landsbankinn': {
    overdraft: { kind: 'arranged', rate: 0.1575, source: 'landsbankinn.is rate decision, 1 September 2026: 15.75%' },
    loan: { from: 0.103, to: 0.156, source: 'landsbankinn.is: 10.30% to 15.60% nominal, non-indexed' },
    term: { rate: 0.078, months: 12, called: 'Term Deposit', source: 'Landsbankinn 12-month fixed: 7.80%' },
  },
  'is-arion': {
    overdraft: { kind: 'arranged', rate: 0.1575, source: 'arionbanki.is rate table: 15.75%' },
    loan: { from: 0.121, to: 0.1485, source: 'arionbanki.is: 12.10% to 14.85% nominal, non-indexed' },
    term: { rate: 0.0805, months: 12, called: 'Term Deposit', source: 'Arion 12-month fixed: 8.05%' },
  },
  'is-islandsbanki': {
    overdraft: { kind: 'arranged', rate: 0.1575, source: 'islandsbanki.is rate table: 15.75%' },
    loan: { from: 0.1205, to: 0.1675, source: 'islandsbanki.is: 12.05% to 16.75% nominal, non-indexed' },
    term: { rate: 0.075, months: 12, called: 'Term Deposit', source: 'Íslandsbanki 12-month fixed: 7.50%' },
  },
  // --- France
  'fr-bnp-paribas': {
    overdraft: { kind: 'per_item', fee: 8_00, maxPerMonth: 10, rate: 0.184, source: 'an €8 commission d’intervention an operation, €80 a month at most (the legal cap), via moneyvox.fr; 18.40% past an arranged overdraft, or with none (15.90% and 2.50 more), via changer-la-banque.com' },
    loan: FR_LOAN, term: FR_TERM,
  },
  'fr-societe-generale': {
    overdraft: { kind: 'arranged', rate: 0.0873, rateTo: 0.2348, beyond: { fee: 8_00, maxPerMonth: 10 }, source: 'SG price list 2026: an authorized overdraft at 8.73% to 23.48% TAEG, and €8 an operation past it, €80 a month at most' },
    loan: FR_LOAN, term: FR_TERM,
  },
  'fr-lcl': {
    overdraft: { kind: 'per_item', fee: 8_00, maxPerMonth: 10, source: 'an €8 commission d’intervention an operation, €80 a month at most (the legal cap), via moneyvox.fr' },
    loan: FR_LOAN, term: FR_TERM,
  },
  'fr-credit-agricole': {
    overdraft: { kind: 'per_item', fee: 8_00, maxPerMonth: 10, source: 'an €8 commission d’intervention an operation, €80 a month at most (the legal cap), via moneyvox.fr' },
    loan: FR_LOAN, term: FR_TERM,
  },
  'fr-la-banque-postale': {
    overdraft: { kind: 'arranged', rate: 0.16, beyond: { fee: 8_00, maxPerMonth: 10, rate: 0.17 }, source: 'moneyvox.fr: an authorized overdraft at 16.00% TAEG, an unauthorized one at 17%, and €8 an operation past it, €80 a month at most' },
    loan: FR_LOAN, term: FR_TERM,
  },
  // --- Germany
  'de-deutsche-bank': {
    overdraft: { kind: 'arranged', rate: 0.116, beyond: { rate: 0.1305 }, source: 'deutsche-bank.de: the Dispo at 11.60%, and 13.05% on an overdraft beyond it' },
    loan: DE_LOAN,
    term: { rate: 0.023, months: 12, called: 'FestzinsSparen', source: 'Deutsche Bank FestzinsSparen: 2.30%' },
  },
  'de-commerzbank': { overdraft: { kind: 'arranged', rate: 0.119, beyond: { rate: 0.144 }, source: 'commerzbank.de: the Dispo at 11.90%, and 14.40% beyond it' }, loan: DE_LOAN, term: DE_TERM },
  'de-postbank': { overdraft: { kind: 'arranged', rate: 0.1104, beyond: { rate: 0.1285 }, source: 'postbank.de: the Dispo at 11.04%, and 12.85% beyond it' }, loan: DE_LOAN, term: DE_TERM },
  'de-ing': {
    overdraft: { kind: 'arranged', rate: 0.0914, source: 'ing.de: the Dispo at 9.14%' },
    loan: { from: 0.0369, to: 0.1099, source: 'ing.de Ratenkredit: 3.69% to 10.99% effective' },
    term: { rate: 0.026, months: 12, minAmount: 100_000_00, called: 'Festgeld', source: 'ing.de: 2.60%, from €100,000' },
  },
  'de-berliner-sparkasse': { overdraft: { kind: 'arranged', rate: 0.1311, source: 'berliner-sparkasse.de: the Dispo at 13.11%' }, loan: DE_LOAN, term: DE_TERM },
  // --- Spain
  'es-santander': {
    overdraft: { kind: 'tacit', rate: 0.0783, commission: { share: 0.05, min: 15_00 }, cap: { rate: 0.08125, source: 'Ley 16/2011 de contratos de crédito al consumo, art. 20.4: a tacit overdraft may not cost more than two and a half times the legal rate of interest (3.25% in 2026), counting its commission' }, source: 'bancosantander.es: a descubierto at 7.83% TIN, and a 5% commission on the most overdrawn, at least €15' },
    loan: ES_LOAN, term: ES_TERM,
  },
  'es-bbva': {
    overdraft: { kind: 'tacit', rate: 0.0725, commission: { share: 0.045, min: 15_00 }, cap: { rate: 0.08125, source: 'Ley 16/2011 de contratos de crédito al consumo, art. 20.4: a tacit overdraft may not cost more than two and a half times the legal rate of interest (3.25% in 2026), counting its commission' }, source: 'bbva.es via comparison sites: a descubierto at 7.25% TIN, and a 4.5% commission, at least €15' },
    loan: ES_LOAN, term: ES_TERM,
  },
  'es-caixabank': { loan: ES_LOAN, term: ES_TERM },
  'es-sabadell': { loan: ES_LOAN, term: ES_TERM },
  'es-bankinter': { loan: ES_LOAN, term: ES_TERM },
  // --- Japan
  'jp-mufg': {
    overdraft: { kind: 'secured', share: 0.9, max: 2_000_000_00, over: 0.005, source: 'bk.mufg.jp: 90% of time deposits up to ¥2 million, at their rate plus 0.50%' },
    loan: { from: 0.014, to: 0.146, source: 'MUFG Banquic card loan: 1.4% to 14.6%' },
    term: { rate: 0.005, months: 12, called: '定期預金 (Time Deposit)', source: 'bk.mufg.jp: 0.50% from 3 August 2026' },
  },
  'jp-smbc': {
    loan: { from: 0.015, to: 0.145, source: 'SMBC card loan: 1.5% to 14.5%' },
    term: { rate: 0.005, months: 12, called: '定期預金 (Time Deposit)', source: 'smbc.co.jp: 0.50% from 3 August 2026' },
  },
  'jp-mizuho': {
    loan: { from: 0.02, to: 0.14, source: 'Mizuho card loan: 2.0% to 14.0%' },
    term: { rate: 0.005, months: 12, called: '定期預金 (Time Deposit)', source: 'mizuhobank.co.jp: 0.50% from 3 August 2026' },
  },
  'jp-resona': { loan: { from: 0.017, to: 0.14, source: 'Resona card loan: 1.70% to 14.00%' } },
  'jp-japan-post-bank': { term: { rate: 0.005, months: 12, called: '定期貯金 (Time Savings)', source: 'jp-bank.japanpost.jp: 0.500%' } },
  // --- South Korea
  'kr-kb-kookmin': {
    overdraft: { kind: 'arranged', rate: 0.05, source: 'the big five banks’ average credit-line rate (마이너스통장), August 2026' },
    term: { rate: 0.035, months: 12, called: '정기예금 (Time Deposit)', source: 'KB 1-year: 3.5%, via biz.newdaily.co.kr, 21 September 2026' },
  },
  'kr-shinhan': {
    overdraft: { kind: 'arranged', rate: 0.05, source: 'the big five banks’ average credit-line rate, August 2026' },
    term: { rate: 0.034, months: 12, called: '정기예금 (Time Deposit)', source: 'Shinhan 1-year: 3.4%, 21 September 2026' },
  },
  'kr-hana': {
    overdraft: { kind: 'arranged', rate: 0.05, source: 'the big five banks’ average credit-line rate, August 2026' },
    term: { rate: 0.033, months: 12, called: '정기예금 (Time Deposit)', source: 'Hana 1-year: 3.3%, 21 September 2026' },
  },
  'kr-nh': {
    overdraft: { kind: 'arranged', rate: 0.05, source: 'the big five banks’ average credit-line rate, August 2026' },
    term: { rate: 0.0345, months: 12, called: '정기예금 (Time Deposit)', source: 'NH 1-year: 3.45%, 21 September 2026' },
  },
  'kr-kakaobank': {
    overdraft: { kind: 'arranged', rate: 0.0605, rateTo: 0.098, source: 'kakaobank.com credit line: 6.05% to 9.80%' },
    loan: { from: 0.049, to: 0.1324, source: 'kakaobank.com: 4.90% to 13.24%' },
    term: { rate: 0.036, months: 12, called: '정기예금 (Time Deposit)', source: 'KakaoBank 1-year: 3.60%' },
  },
  // --- Australia
  'au-commbank': {
    overdraft: { kind: 'per_item', fee: 15_00, maxPerDay: 1, rate: 0.149, atMidnight: true, source: 'commbank.com.au: a $15 fee when still overdrawn at midnight, and 14.90% a year' },
    loan: { from: 0.0699, to: 0.2199, source: 'commbank.com.au: 6.99% to 21.99% variable' },
    term: { rate: 0.049, months: 12, called: 'Term Deposit', source: 'commbank.com.au: 4.90% standard' },
  },
  'au-westpac': {
    overdraft: { kind: 'per_item', fee: 15_00, maxPerDay: 1, rate: 0.1501, atMidnight: true, source: 'westpac.com.au: a $15 overdrawn fee, 15.01% a year' },
    loan: { from: 0.0729, source: 'westpac.com.au: from 7.29%' },
    term: { rate: 0.053, months: 12, called: 'Term Deposit', source: 'Westpac 12-month: 5.30%, via savings.com.au, 21 September 2026' },
  },
  'au-nab': {
    loan: { from: 0.075, to: 0.22, source: 'nab.com.au: 7.50% to 22.00%' },
    term: { rate: 0.053, months: 12, called: 'Term Deposit', source: 'NAB 12-month: 5.30%, via savings.com.au, 21 September 2026' },
  },
  'au-anz': {
    term: { rate: 0.052, months: 12, called: 'Term Deposit', source: 'ANZ 12-month: 5.20%, via savings.com.au, 21 September 2026' },
  },
  // --- New Zealand
  'nz-anz': {
    overdraft: { kind: 'arranged', rate: 0.189, monthlyFee: 3_00, beyond: { rate: 0.199, monthlyFee: 3_00, graceUpTo: 10_00, afterDays: 2 }, source: 'anz.co.nz fees, 1 September 2026: 18.90%, $3 a month; past the limit or unarranged, 19.90% (the Consumer Overdraft Base Rate of 12.90% plus 7%), and a $3 unarranged overdraft fee for a month it is more than $10 over for more than a day (help.anz.co.nz)' },
    term: { rate: 0.04, months: 12, called: 'Term Deposit', source: 'interest.co.nz, 25 September 2026: 4.00%' },
  },
  'nz-asb': { term: { rate: 0.04, months: 12, called: 'Term Deposit', source: 'interest.co.nz, 25 September 2026: 4.00%' } },
  'nz-bnz': {
    overdraft: { kind: 'unarranged', monthlyFee: 2_00, graceUpTo: 20_00, afterDays: 1, freeUnder: 19, source: 'BNZ Personal account, service, and facility fees, 31 March 2026: on YouMoney an unarranged overdraft fee of $2 a Bank Month when more than $20 in debit, none under 19; interest at the Personal Overdraft Base Rate plus 10%, a base rate BNZ doesn’t publish' },
    term: { rate: 0.0405, months: 12, called: 'Term Deposit', source: 'interest.co.nz, 25 September 2026: 4.05%' },
  },
  'nz-westpac': { term: { rate: 0.04, months: 12, called: 'Term Deposit', source: 'interest.co.nz, 25 September 2026: 4.00%' } },
  'nz-kiwibank': { term: { rate: 0.0405, months: 12, called: 'Term Deposit', source: 'interest.co.nz, 25 September 2026: 4.05%' } },
};

/** The UK's Current Account Switch Service: the one country here with a set switching time. */
export const SWITCHING: Readonly<Record<string, { workingDays: number; scheme: string; source: string }>> = {
  GB: { workingDays: 7, scheme: 'Current Account Switch Service', source: 'currentaccountswitch.co.uk: "The process takes 7 working days"' },
};
