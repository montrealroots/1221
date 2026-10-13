/**
 * SLATE — the card, and the record a lender reads.
 *
 * The card used to be a balance and a rate written on it that nothing
 * charged, and the credit score was shown at creation and thrown away. Now
 * the card runs as a card does: a statement on the 20th, and a payment due on
 * the 15th of the next month, at least the 21 days after the statement a US
 * card must allow. Autopay pays the whole statement, as much of it as checking
 * holds, or only the minimum if the player says so, and anything more can be
 * paid whenever they like. It paid the minimum first, and a café worker in
 * Mosfellsbær ended the year with 931,000 krónur in checking and 126,000
 * still on the card at 28%, the record sliding for how much of it was used. A
 * statement paid in full keeps its grace period, and one that wasn't is
 * charged the month's interest at the card's rate. A payment short of the
 * minimum is late: a fee, and the record takes it.
 *
 * The record is kept as a score on the US scale, 300 to 850, which is how
 * American lenders read somebody and near enough how Canadian ones do. Most
 * of the world keeps no single number; the screen shows the score only in
 * those two countries and a plain word elsewhere. What moves it each month is
 * what moves a real one most: paying on time (it rises), how much of the card
 * is used (over thirty percent costs), a late payment, rent owed, and an
 * eviction. A month is reported whether the card owes anything or not: a
 * card kept at zero is an account paid as agreed. Until 2026-09-25 the
 * record moved only on a statement that owed something, and two years of
 * played careers that cleared the card ended at 693, where they began,
 * with rent owed in those months never counted either. What it decides: the card's rate, set by the record when the card opens and held there (it was repriced on each statement until 2026-09-26, which a US card may not be, Reg Z §1026.55); the
 * card's limit, raised a fifth at a six-monthly review for a record of 700
 * with nothing late in a year and cut to 70% by a late payment; and the
 * deposit a landlord asks (`depositFor` in `systems/household.ts`). It
 * decided only the rate at first.
 *
 * The card is the bank's (`content/cards.ts`): its name, whether a balance
 * can be carried or the whole statement is taken each month, its rate or the
 * range it prices a record within, its yearly fee, minimum payment, late fee
 * and the days to the due date, held to the country's caps. Until 2026-09-26
 * every card in the world ran on one set of American terms under the bank's
 * name, and the bank's own screen didn't show it. Where a bank's card isn't
 * on record, each term missing is SLATE's estimate of typical American card
 * terms (`cardTerms` says which), and the score's monthly moves are a
 * simplification of a model no lender publishes.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { CITIES, COUNTRIES } from '../content/geography';
import { exchange } from '../content/currency';
import { bankById } from '../content/banks';
import { CARDS, CARD_LAW, type CardProduct } from '../content/cards';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { addMonths, formatDate, instantFromZoned, zonedParts, MS_DAY, type Instant } from '../core/time';
import { CommandError } from '../core/simulation';
import { drawFromBank, inTheBank } from './spending';
import { statementReady } from './statements';
import { paymentsOf } from './payments';
import { allocatePayment, cashOwedOn } from './cash';
import { planLeftOf, statementOffers, transferRate, transfersOwedOn } from './cardoffers';
import { PENDING } from '../content/pending';
import { FIRST_LATE_FEE, LATE_FEE_RULES, US_SAFE_HARBOR, lateFeeByRule, type LateFeeRule } from '../content/latefees';
import { REVOLVING_COURSE, coursePayment, type RevolvingCourse } from '../content/revolving';

/**
 * Cards whose terms end a promotional rate at one missed minimum: Barclaycard
 * ("if you ... don't make your minimum payment in time – your interest rate
 * goes up to the purchase rate", barclaycard.co.uk, promotional rates). Bank
 * of Ireland's terms have no such clause and it keeps its rate (Personal
 * Credit Card terms, 06-26, condition 8(e)); the other British and Irish
 * cards' terms weren't read for it, and keep theirs. Until 2026-09-28 no card
 * outside the US ended an offer for a missed payment.
 */
export const INTRO_ENDS_ON_MISS: ReadonlySet<string> = new Set(['gb-barclays']);

export const STATEMENT_KIND = 'card.statement';
export const DUE_KIND = 'card.due';

/** One card's own state: its statement, its interest, its plans and transfers, its standing with its bank. */
export interface CardState {
  autopay: 'minimum' | 'full';
  /** What the last statement said was owed, and whether it has been paid in full. */
  statementBalance: Money;
  paidSinceStatement: Money;
  /** Whether the last statement was left partly unpaid, so this month's balance draws interest. */
  carrying: boolean;
  /** When the card's limit was last reviewed. */
  reviewedAt?: Instant;
  /** The interest the last statement charged, which a minimum can add. */
  statementInterest?: Money;
  /** The day of the month the statement comes, which moves the due date with it (C25). Absent, the 20th. */
  statementDay?: number;
  /** When the last statement came (from 2026-10-10), which a moved statement day can't bring the next one sooner than `MIN_CYCLE_DAYS` after. */
  statementAt?: Instant;
  /** The account its autopay pays from (from 2026-10-10, `autopaySource`): the one it was set up on, not whichever is primary. */
  autopayFrom?: string;
  /**
   * When each statement was cut, oldest first, the last sixty (from 2026-10-10): the past statements' periods, which
   * until then were redrawn on today's statement day, so a moved day moved every statement before it too.
   */
  cuts?: Instant[];
  /**
   * What each statement said when it was cut (from 2026-10-10): its minimum and its terms, the last sixty. Until then a
   * past statement was redrawn from today's terms, score and intro months, so a cleared intro rate rewrote old ones.
   */
  issued?: { at: Instant; minimum: Money; terms: CardTerms }[];
  /** When the yearly fee was last charged (from 2026-10-10), so a month with two statements charges it once. */
  feeAt?: Instant;
  /** Due dates in a row with less than the minimum paid. */
  missed?: number;
  /** Why the card can't be used: payments missed, a hardship plan, persistent debt (A149, C11, C86). */
  suspended?: 'late' | 'hardship' | 'persistent';
  /** The holder closed the card: nothing new on it, and what's owed is paid down (C10). */
  closing?: Instant;
  /** US: the holder opted in to transactions over the limit, and how many cycles in a row have been charged for it (C60). */
  overLimitOptIn?: boolean;
  overLimitCycles?: number;
  /** The holder asked the bank never to raise the limit unasked (C79). */
  noAutoRaise?: boolean;
  /** A hardship plan: the interest frozen and a fixed payment (C75, C76). */
  hardship?: { payment: Money; since: Instant };
  /** When Britain's persistent-debt notice went (C75). */
  persistentNoticeAt?: Instant;
  /** When a late fee was last charged, for a bank whose first costs less (`FIRST_LATE_FEE`). */
  lateFeeAt?: Instant;
  /** Credit a payment from another bank freed, held back until a day (`PENDING.paymentHoldDays`). */
  paymentHolds?: { amount: Money; until: Instant }[];
  /** Interest built up day by day, compounded daily (C43, C50): charged at the statement once the grace period is lost, dropped at the due date where it holds. */
  accrued?: number;
  /** Interest from a carried balance up to the day it was paid in full, charged on the next statement (C48). */
  trailing?: number;
  /** The US penalty rate: noticed, and in force from 45 days on (C52, C53, C90); payments on time since it began. */
  penalty?: { noticeAt: Instant; from: Instant; onTime: number };
  /** Britain: default fees charged in the last 28 days, which bear no interest yet (C64). */
  recentFees?: { at: Instant; amount: Money }[];
  /** Since when the card has held a credit balance, for the US six-month refund (C23). */
  creditSince?: Instant;
  /** The part of what's owed that's cash advances, and the interest built on it, which has no grace period (C29, C49). */
  cashOwed?: Money;
  cashAccrued?: number;
  /** Balances moved onto the card, a balance transfer or a money transfer, each at its own rate (C31, C32). */
  transfers?: CardTransfer[];
  /** Purchases being paid off in equal months for a fixed fee, not interest (C34, C62), and what the last statement asked of them. */
  plans?: CardPlan[];
  statementPlanDue?: Money;
  /** Rewards earned and not yet redeemed, and since when purchases count toward the next (C39). */
  rewards?: Money;
  rewardsFrom?: Instant;
  /** What a card's bonus caps have taken this period, by category and period. */
  bonusUsed?: Record<string, Money>;
  /** A US card's introductory rates, lost for a payment sixty days late (Reg Z §1026.55(b)(4)). */
  introLost?: boolean;
}

/**
 * The record a lender reads, the person's: the score, the late payments, a
 * card on its way; and beside them the everyday card's own state, the card
 * the day's spending goes on (`primaryId`). Every other card's state is its
 * own, by its account (`cards`). Until 2026-09-28 a person held one card,
 * and this was all of it.
 */
export interface CreditState extends CardState {
  /** 300 to 850, the US scale. */
  score: number;
  /** Late payments, by when. */
  late: Instant[];
  /** What's on the record against them, from 2026-09-30: when, what it took, and the country whose rule says how long it stays (`markRecord`). */
  marks?: { at: Instant; points: number; country: string; /** In Mexico, the debt's size in UDIs, which decides how long it stays (from 2026-10-01). */ udis?: number }[];
  /** A card applied for and on its way (C1, C5): from which bank, and, moving a balance onto it, from which card. */
  applied?: { bankId: string; arrivesAt: Instant; limit: Money; transfer?: boolean; fromId?: string };
  /** The everyday card, whose state is the record's own fields. */
  primaryId?: string;
  /** Every other open card's state, by its account. */
  cards?: Record<string, CardState>;
}

/** The fields that are a card's own, which move when another card becomes the everyday one. */
const CARD_KEYS: readonly (keyof CardState)[] = [
  'autopay', 'statementBalance', 'paidSinceStatement', 'carrying', 'reviewedAt', 'statementInterest', 'statementDay', 'statementAt', 'cuts', 'issued', 'feeAt', 'autopayFrom', 'missed', 'suspended', 'closing',
  'overLimitOptIn', 'overLimitCycles', 'noAutoRaise', 'hardship', 'persistentNoticeAt', 'lateFeeAt', 'paymentHolds', 'accrued', 'trailing', 'penalty',
  'recentFees', 'creditSince', 'cashOwed', 'cashAccrued', 'transfers', 'plans', 'statementPlanDue', 'rewards', 'rewardsFrom', 'bonusUsed', 'introLost',
];

/** A new card's state: nothing owed, nothing carried, paid by autopay as the holder pays their others. */
export function freshCardState(autopay: CardState['autopay'], at: Instant): CardState {
  return { autopay, statementBalance: 0, paidSinceStatement: 0, carrying: false, reviewedAt: at, missed: 0, transfers: [], plans: [], statementPlanDue: 0, rewards: 0 };
}

/** Every open card a person holds, the everyday one first. */
export function cardsOf(sim: Simulation, person: Person): Account[] {
  const open = Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && a.kind === 'credit_card' && !a.closedAt);
  const primary = person.credit?.primaryId;
  return primary ? [...open.filter((a) => a.id === primary), ...open.filter((a) => a.id !== primary)] : open;
}

/** A card's own state: the everyday card's is the record's; another's is kept by its account. */
export function stateOf(person: Person, card: Account): CardState {
  const credit = person.credit!;
  if (!credit.primaryId || credit.primaryId === card.id) return credit;
  credit.cards ??= {};
  return (credit.cards[card.id] ??= freshCardState(credit.autopay, card.openedAt));
}

/**
 * The everyday card closed while another stays open: the next becomes the
 * everyday one, its state moved into the record's fields. Or none open, and
 * the record keeps the last one's till another comes.
 */
export function ensurePrimary(sim: Simulation, person: Person): void {
  const credit = person.credit;
  if (!credit) return;
  const open = Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && a.kind === 'credit_card' && !a.closedAt);
  if (credit.primaryId && open.some((a) => a.id === credit.primaryId)) return;
  const next = open.find((a) => credit.cards?.[a.id]) ?? open[0];
  if (!next) return;
  if (!credit.primaryId || !credit.cards?.[next.id]) { credit.primaryId = next.id; return; }
  // The closed card owed nothing, or its debt went to collections: its state is finished.
  makeEveryday(person, next, false);
}

/** Swaps a card in as the everyday one: its state into the record's fields, the old everyday card's into its own where it's kept. */
export function makeEveryday(person: Person, card: Account, keepOld = true): void {
  const credit = person.credit!;
  if (credit.primaryId === card.id) return;
  credit.cards ??= {};
  const incoming = credit.cards[card.id] ?? freshCardState(credit.autopay, card.openedAt);
  if (credit.primaryId && keepOld) {
    const outgoing: Partial<CardState> = {};
    for (const key of CARD_KEYS) if (credit[key] !== undefined) (outgoing as Record<string, unknown>)[key] = credit[key];
    credit.cards[credit.primaryId] = outgoing as CardState;
  }
  adoptEveryday(person, card, incoming);
}

/** A card's state written into the record's fields, the card the everyday one. */
export function adoptEveryday(person: Person, card: Account, state: CardState): void {
  const credit = person.credit!;
  for (const key of CARD_KEYS) {
    if (state[key] !== undefined) (credit as unknown as Record<string, unknown>)[key] = state[key];
    else delete (credit as unknown as Record<string, unknown>)[key];
  }
  delete credit.cards?.[card.id];
  credit.primaryId = card.id;
}

/** The card a command or a scheduled item names, open and theirs, or the everyday card where it names none. */
export function cardFor(sim: Simulation, person: Person, accountId: unknown): Account | undefined {
  if (accountId === undefined || accountId === null || accountId === '') return cardOf(sim, person);
  const card = sim.universe.accounts[String(accountId)];
  return card && card.ownerId === person.id && card.kind === 'credit_card' && !card.closedAt ? card : undefined;
}

export interface CardTransfer {
  kind: 'balance' | 'money';
  owed: Money;
  accrued: number;
  /** The rate once any introductory rate ends, and that rate and its end. */
  apr: number;
  introApr?: number;
  introUntil?: Instant;
}

export interface CardPlan {
  /** What's left of the purchase to pay, the part due each month, the month's fee, and months to go. */
  left: Money;
  monthly: Money;
  fee: Money;
  monthsLeft: number;
  /** A plan charged as interest (`content/plans.ts`): its yearly rate on what's left, the equal month then paying it and the principal. */
  apr?: number;
}

const SCORE_MIN = 300;
const SCORE_MAX = 850;
/** The rate a score buys where the bank's card isn't on record. SLATE's estimate of typical US card pricing. */
const RATE_BANDS: readonly { from: number; apr: number }[] = [
  { from: 800, apr: 0.1999 }, { from: 740, apr: 0.2199 }, { from: 670, apr: 0.2499 },
  { from: 580, apr: 0.2799 }, { from: 0, apr: 0.2999 },
];
const MINIMUM_USD = 25;
const MINIMUM_SHARE = 0.02;
const LATE_FEE_USD = 32;
/** What a card charges for a payment that bounces, where its own fee wasn't found: SLATE's estimate, Chase's $40. */
const RETURNED_PAYMENT_USD = 40;
/** A cash advance's fee where the card's own wasn't found: SLATE's estimate, Chase's 5% or $10. */
const CASH_FEE_SHARE = 0.05;
const CASH_FEE_USD = 10;
/** Where a card may go over its limit for someone who opted in: SLATE's estimate, a tenth over. */
const OVER_LIMIT_SHARE = 0.1;
/** Due dates missed in a row before the bank suspends the card: SLATE's estimate, sixty days late. */
const SUSPEND_AFTER = 2;
/** And before it charges the card off to collections: 180 days, the FFIEC's rule for open-end credit in the US, used everywhere. */
const CHARGE_OFF_AFTER = 6;
/** How often the limit is reviewed, and the record that earns a raise. */
const REVIEW_EVERY = 182 * 86_400_000;
const RAISE_FROM = 700;

/**
 * How long a mark stays on the record, by the country it was reported in
 * (`docs/research/world/research-credit-damage-movers.json`): seven years in
 * America under the FCRA, six in Britain, as Experian UK keeps a default or
 * a judgment, and five in Ireland, as the Central Credit Register keeps a
 * loan after it's settled (taken here from the mark). Canada's six, from
 * 2026-10-01, is how long Equifax Canada and TransUnion keep a late payment
 * or a collection (`docs/research/world/research-aviation-boats-credit-mot.json`). In Mexico no period was
 * researched and a mark stayed until later on 2026-10-01; now it goes by the
 * debt's size in UDIs (`docs/research/world/research-open-final.json`):
 * seventy-two months under article 23 of the law on credit bureaus, which
 * leaves the smaller debts to Banxico, whose Circular 27/2008 deletes one of
 * 25 UDIs or less after a year, to 500 after two and to 1,000 after four.
 * A UDI is the 8.834094 pesos the DOF published for 30 September 2026. A
 * mark whose debt SLATE doesn't know, a late payment's, stays the law's six
 * years. Its weight fades before it goes, as myFICO
 * says, which the months paid on time already carry; when it goes, the one
 * measured figure is the CFPB's, 25 points on average when the last medical
 * collection came off (2023), taken for every kind. From 2026-09-30; until
 * then a mark never left the record.
 */
export const MARK_YEARS: Readonly<Record<string, number>> = { us: 7, uk: 6, ie: 5, ca: 6, mx: 6 };
/** Mexico's tiers: a debt to so many UDIs leaves the record after so many years. */
export const MX_TIERS: readonly (readonly [number, number])[] = [[25, 1], [500, 2], [1_000, 4]];
export const UDI_MXN = 8.834094;
/** An amount in the save's money, in pesos: a Mexican debt's size. */
const pesos = (sim: Simulation, cents: Money): number => { const cur = saveCurrency(sim.universe); return (cur === 'MXN' ? cents : exchange(cents, cur, 'MXN') ?? cents) / 100; };
const markYears = (m: { country: string; udis?: number }): number | undefined => (m.country === 'mx' && m.udis !== undefined ? MX_TIERS.find(([upTo]) => m.udis! <= upTo)?.[1] ?? MARK_YEARS.mx : MARK_YEARS[m.country]);
export const MARK_GONE_GIVES = 25;

/** A mark on the record: the score falls by it, and it's kept until its country's years are up; in Mexico, by the debt charged off, in pesos. */
export function markRecord(person: Person, points: number, at: Instant, where: string, owedMxn?: number): void {
  const record = person.credit;
  if (!record) return;
  record.score = Math.max(SCORE_MIN, record.score - points);
  const country = CITIES.get(where)?.countryId ?? '';
  (record.marks ??= []).push({ at, points, country, ...(country === 'mx' && owedMxn !== undefined ? { udis: owedMxn / UDI_MXN } : {}) });
}

/** Marks past their country's years leave the record, and give back what the CFPB measured. */
export function marksFallOff(person: Person, at: Instant): number {
  const record = person.credit;
  if (!record?.marks?.length) return 0;
  const year = 365.2425 * 86_400_000;
  const gone = record.marks.filter((m) => { const years = markYears(m); return years !== undefined && at - m.at >= years * year; });
  if (!gone.length) return 0;
  record.marks = record.marks.filter((m) => !gone.includes(m));
  record.score = Math.min(SCORE_MAX, record.score + gone.length * MARK_GONE_GIVES);
  return gone.length;
}

export function aprFor(score: number): number {
  return RATE_BANDS.find((band) => score >= band.from)!.apr;
}

/** Where a bank prices a record within a range: the best record at the bottom, the worst at the top. */
const BEST = 800;
const WORST = 580;
export function priceWithin(from: number, to: number, score: number): number {
  const t = Math.min(1, Math.max(0, (BEST - score) / (BEST - WORST)));
  return Math.round((from + (to - from) * t) * 10_000) / 10_000;
}

/** A term of the card: the bank's, or SLATE's estimate. */
export type CardTerm = 'card' | 'rate' | 'minimum' | 'lateFee' | 'annualFee' | 'returnedPaymentFee' | 'cashAdvance';

/** What a card charges and asks, for a record, in the save's money. */
export interface CardTerms {
  name: string;
  /** The bank that issued it, which switching banks doesn't change. */
  bankId?: string;
  issuer?: string;
  kind: 'revolving' | 'charge';
  /** The rate on the account now: set by the record when it opened, the penalty rate where one is in force. */
  apr: number;
  /** What the bank would price a card at for this record, today. */
  priced: number;
  /** The US penalty rate, where the card has one, and whether it's in force. */
  penaltyApr?: number;
  penaltyInForce?: boolean;
  aprFrom?: number;
  aprTo?: number;
  annualFee: Money;
  minimumShare: number;
  minimumFloor: Money;
  minimumPlusInterest: boolean;
  /** Mexico's: never under a share of the limit (`MEXICO_MINIMUM`). */
  minimumOfLimit?: Money;
  /** A revolving course that sets the minimum by a table (`content/revolving.ts`), and the record it reads. */
  course?: RevolvingCourse;
  score?: number;
  lateFee: Money;
  /** What a bounced payment costs. */
  returnedPaymentFee: Money;
  /** A US card's over-limit fee, for someone who opted in, where it charges one. */
  overLimitFee?: Money;
  /** A cash advance's fee (a share, never under a minimum), its rate, and the most of the limit it may use. */
  cashFeeShare: number;
  cashFeeMin: Money;
  cashApr: number;
  cashLimit?: Money;
  /** Days from the statement to the due date; absent, the 15th of the next month. */
  graceDays?: number;
  /** An introductory purchase rate, and when it ends; in force while the rate is below the card's own. */
  introApr?: number;
  introUntil?: Instant;
  /** While an introductory rate is in force, the card's own rate after it. */
  standardApr?: number;
  /** A balance transfer's terms, where the card's were found: its fee, its rate, and its introductory rate for so many months from opening. */
  transfer?: { feeShare: number; feeMin: Money; apr: number; introApr?: number; introMonths?: number };
  /** A money transfer's fee as a share, where the card offers one. */
  moneyTransferFee?: number;
  /** A plan's monthly fee as a share, the most the bank says it charges, and the bank's words. */
  planFeeShare?: number;
  planWords?: string;
  /** Rewards at the card's base rate, and the bank's words for them. */
  rewardsRate?: number;
  rewardsWords?: string;
  /** The country's cap on a card's rate, where it has one. */
  aprCap?: number;
  /** A late fee set as a share (`LATE_FEE_RULES`), its sums in the save's money; `lateFee` is then its least. */
  lateRule?: LateFeeRule;
  /** The country's law, where it capped a term. */
  capped?: { apr?: number; lateFee?: Money; law: string; source: string };
  /** The terms that are SLATE's estimate, not the bank's. */
  estimated: CardTerm[];
  source?: string;
  asOf?: string;
}

function inSave(sim: Simulation, amount: Money, currency: string): Money {
  const into = saveCurrency(sim.universe);
  return into === currency ? amount : exchange(amount, currency, into) ?? amount;
}

/** The card's terms: the bank's where on record, each one missing SLATE's estimate, held to the country's caps. */
export function cardTerms(sim: Simulation, card: Account, score: number): CardTerms {
  const bank = card.bankId ? bankById(card.bankId) : undefined;
  const found = bank ? CARDS[bank.id] : undefined;
  const product: CardProduct | undefined = found && !('none' in found) ? found : undefined;
  const law = bank ? CARD_LAW[bank.iso] : undefined;
  const money = product?.currency ?? bank?.currency ?? saveCurrency(sim.universe);
  const estimated: CardTerm[] = [];
  if (!product) estimated.push('card');
  const range = product?.aprFrom !== undefined && product.aprTo !== undefined;
  let priced = range ? priceWithin(product!.aprFrom!, product!.aprTo!, score) : product?.apr;
  if (priced === undefined) { priced = aprFor(score); estimated.push('rate'); }
  // The account's own rate, set when it opened; the penalty rate over it once in force.
  const owner = sim.universe.people[card.ownerId];
  const canada = bank ? CANADA_PENALTY[bank.id] : undefined;
  const penaltyApr = product?.penaltyApr ?? canada?.apr;
  const own = owner?.credit ? stateOf(owner, card) : undefined;
  const penaltyInForce = Boolean(penaltyApr && own?.penalty && sim.now >= own.penalty.from);
  let apr = card.apr ?? priced;
  if (penaltyInForce) apr = Math.max(apr, penaltyApr!);
  // An introductory rate from opening, lost for a US payment sixty days late,
  // which a penalty rate needs first.
  const introUntil = product?.introMonths ? addMonths(card.openedAt, product.introMonths, sim.homeZone) : undefined;
  const standardApr = apr;
  if (introUntil !== undefined && sim.now < introUntil && !own?.introLost) apr = Math.min(apr, product!.introApr!);
  const course = bank ? REVOLVING_COURSE[bank.id] : undefined;
  const minimumKnown = product?.minimumShare !== undefined || product?.minimumFloor !== undefined || course !== undefined;
  if (!minimumKnown && product?.kind !== 'charge') estimated.push('minimum');
  const rule = bank ? LATE_FEE_RULES[bank.id] : undefined;
  const lateRule: LateFeeRule | undefined = rule ? {
    ...rule,
    ...(rule.fixed !== undefined ? { fixed: inSave(sim, rule.fixed, money) } : {}),
    ...(rule.min !== undefined ? { min: inSave(sim, rule.min, money) } : {}),
    ...(rule.max !== undefined ? { max: inSave(sim, rule.max, money) } : {}),
  } : undefined;
  let lateFee = lateRule ? (lateRule.fixed ?? 0) + (lateRule.min ?? 0) : product?.lateFee !== undefined ? inSave(sim, product.lateFee, money) : undefined;
  if (lateFee === undefined) { lateFee = usdIn(sim, LATE_FEE_USD); estimated.push('lateFee'); }
  if (product && product.annualFee === undefined) estimated.push('annualFee');
  // A cash advance: the card's own terms, or SLATE's estimate of a US card's, 5% or $10 at the purchase rate.
  const cashKnown = product?.cashFeeShare !== undefined || product?.cashApr !== undefined;
  if (!cashKnown) estimated.push('cashAdvance');
  const cashFeeShare = product?.cashFeeShare ?? CASH_FEE_SHARE;
  const cashFeeMin = product?.cashFeeMin !== undefined ? inSave(sim, product.cashFeeMin, money) : product?.cashFeeShare !== undefined ? 0 : usdIn(sim, CASH_FEE_USD);
  const cashLimit = product?.cashLimit !== undefined ? inSave(sim, product.cashLimit, money) : product?.cashLimitShare !== undefined ? Math.round((card.creditLimit ?? 0) * product.cashLimitShare) : undefined;
  let returnedPaymentFee = product?.returnedPaymentFee !== undefined ? inSave(sim, product.returnedPaymentFee, money) : undefined;
  if (returnedPaymentFee === undefined) { returnedPaymentFee = usdIn(sim, RETURNED_PAYMENT_USD); estimated.push('returnedPaymentFee'); }
  let capped: CardTerms['capped'];
  if (law?.aprCap !== undefined && apr > law.aprCap) { apr = law.aprCap; capped = { apr: law.aprCap, law: law.law, source: law.source }; }
  if (law?.aprCap !== undefined && priced > law.aprCap) priced = law.aprCap;
  if (law?.lateFeeCap !== undefined) {
    const cap = inSave(sim, law.lateFeeCap, bank!.currency);
    if (lateFee > cap) { lateFee = cap; capped = { ...(capped ?? { law: law.law, source: law.source }), lateFee: cap }; }
  }
  return {
    name: product?.name ?? card.name,
    ...(bank ? { bankId: bank.id, issuer: bank.name } : {}),
    kind: product?.kind ?? 'revolving',
    apr,
    priced,
    ...(penaltyApr ? { penaltyApr, penaltyInForce } : {}),
    ...(range ? { aprFrom: product!.aprFrom, aprTo: product!.aprTo } : {}),
    annualFee: product?.annualFee ? inSave(sim, product.annualFee, money) : 0,
    minimumShare: minimumKnown ? product!.minimumShare ?? 0 : MINIMUM_SHARE,
    minimumFloor: minimumKnown ? (product!.minimumFloor !== undefined ? inSave(sim, product!.minimumFloor, money) : 0) : usdIn(sim, MINIMUM_USD),
    minimumPlusInterest: course ? course.plusInterest === true : product?.minimumPlusInterest ?? false,
    ...(course ? { course, score } : {}),
    ...(bank?.iso === 'MX' ? { minimumOfLimit: Math.round((card.creditLimit ?? 0) * MEXICO_MINIMUM.ofLimit) } : {}),
    lateFee,
    returnedPaymentFee,
    cashFeeShare,
    cashFeeMin,
    cashApr: Math.min(Math.max(product?.cashApr ?? apr, penaltyInForce && canada?.cashApr ? canada.cashApr : 0), law?.aprCap ?? Number.POSITIVE_INFINITY),
    ...(cashLimit !== undefined ? { cashLimit } : {}),
    ...(product?.overLimitFee ? { overLimitFee: inSave(sim, product.overLimitFee, money) } : {}),
    ...(product?.graceDays !== undefined ? { graceDays: product.graceDays } : {}),
    ...(introUntil !== undefined ? { introApr: product!.introApr, introUntil } : {}),
    ...(apr < standardApr ? { standardApr: Math.min(standardApr, law?.aprCap ?? Number.POSITIVE_INFINITY) } : {}),
    ...(product?.transfer ? {
      transfer: {
        feeShare: product.transfer.feeShare ?? 0,
        feeMin: product.transfer.feeMin !== undefined ? inSave(sim, product.transfer.feeMin, money) : 0,
        apr: Math.min(product.transfer.apr ?? card.apr ?? priced, law?.aprCap ?? Number.POSITIVE_INFINITY),
        ...(product.transfer.introMonths !== undefined ? { introApr: product.transfer.introApr, introMonths: product.transfer.introMonths } : {}),
      },
    } : {}),
    ...(product?.moneyTransferFee ? { moneyTransferFee: product.moneyTransferFee } : {}),
    ...(product?.planFeeShare ? { planFeeShare: product.planFeeShare } : {}),
    ...(product?.planWords ? { planWords: product.planWords } : {}),
    ...(product?.rewardsRate ? { rewardsRate: product.rewardsRate } : {}),
    ...(product?.rewardsWords ? { rewardsWords: product.rewardsWords } : {}),
    ...(law?.aprCap !== undefined ? { aprCap: law.aprCap } : {}),
    ...(capped ? { capped } : {}),
    ...(lateRule ? { lateRule } : {}),
    estimated,
    ...(product ? { source: product.source, asOf: product.asOf } : {}),
  };
}

/** The player's card's terms, where they have one. */
export function playerCardTerms(sim: Simulation): CardTerms | undefined {
  const card = cardOf(sim, sim.player);
  return card ? cardTerms(sim, card, sim.player.credit?.score ?? 650) : undefined;
}

/** Where the score is shown as a number: the United States and Canada. */
export function scoreIsANumberIn(cityId: string): boolean {
  const code = COUNTRIES.get(CITIES.get(cityId)?.countryId ?? '')?.jurisdictionCode;
  return code === 'US' || code === 'CA';
}

/** A score said in a word, for everywhere that doesn't keep one number. */
export function scoreWord(score: number): string {
  return score >= 800 ? 'Exceptional' : score >= 740 ? 'Very Good' : score >= 670 ? 'Good' : score >= 580 ? 'Fair' : 'Poor';
}

/**
 * What can go on the card now: nothing while it's suspended, closing or not
 * yet arrived; its free limit otherwise, and a tenth more for somebody in the
 * US who opted in to going over it (C38, C60).
 */
export function cardRoom(person: Person, card: Account | undefined): Money {
  const credit = person.credit && card ? stateOf(person, card) : undefined;
  if (!card || card.closedAt || credit?.suspended || credit?.closing !== undefined) return 0;
  // Locked, lost or stolen: nothing new on it (`systems/security.ts`). A bill already on it went on while it was locked
  // until 2026-10-09, when nothing charged a card as a bill any more.
  const p = card.plastic;
  if (p?.stopped || p?.locked) return 0;
  // Only a US holder can opt in (`card.set_over_limit`).
  const over = credit?.overLimitOptIn ? Math.round((card.creditLimit ?? 0) * OVER_LIMIT_SHARE) : 0;
  const held = (credit?.paymentHolds ?? []).reduce((sum, one) => sum + one.amount, 0);
  return Math.max(0, (card.creditLimit ?? 0) + card.balance + over - held);
}

/** The everyday card: the one the day's spending goes on, where they hold one. */
export function cardOf(sim: Simulation, person: Person): Account | undefined {
  const primary = person.credit?.primaryId;
  const own = primary ? sim.universe.accounts[primary] : undefined;
  if (own && !own.closedAt) return own;
  return Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.kind === 'credit_card' && !a.closedAt);
}

function usdIn(sim: Simulation, usd: number): Money {
  const cents = exchange(usd * 100, 'USD', saveCurrency(sim.universe)) ?? usd * 100;
  return Math.round(cents / 100) * 100;
}

/**
 * The least that must be paid on a statement: the card's share of it, plus
 * the month's interest where the bank adds it, never under its floor, and
 * never more than the statement. A charge card asks for all of it.
 */
export function minimumDue(sim: Simulation, statement: Money, terms = playerCardTerms(sim), interest = sim.player.credit?.statementInterest ?? 0, planDue = sim.player.credit?.statementPlanDue ?? 0): Money {
  if (!terms) return Math.min(statement, Math.max(usdIn(sim, MINIMUM_USD), Math.round(statement * MINIMUM_SHARE)));
  if (terms.kind === 'charge') return statement;
  // A plan's month is asked in full, on top of the rest's share (C34); a revolving course asks its table's payment instead of the share.
  const money = terms.bankId ? bankById(terms.bankId)?.currency : undefined;
  const share = terms.course
    ? coursePayment(terms.course, statement - planDue, terms.score ?? 650, (m) => (money ? inSave(sim, m, money) : m)) + (terms.minimumPlusInterest ? interest : 0)
    : Math.round((statement - planDue) * terms.minimumShare) + (terms.minimumPlusInterest ? interest : 0);
  return Math.min(statement, Math.max(terms.minimumFloor, share, terms.minimumOfLimit ?? 0) + planDue);
}

/** Pays the card from the bank, as much of an amount as checking and savings hold. Returns what was paid. */
function payCard(sim: Simulation, person: Person, amount: Money, byHand = false, card = cardOf(sim, person)): Money {
  if (!card) return 0;
  // Autopay from the account it was set up on (`autopaySource`) and savings linked to it; by hand, from the primary
  // account and its savings.
  const from = byHand ? undefined : autopaySource(sim, person, card);
  if (!byHand && (!from || from.closedAt)) return 0;
  const inCurrent = Math.max(0, (from ?? sim.universe.accounts[person.primaryAccountId ?? ''])?.balance ?? 0);
  // Linked savings is the easy-access savings at the bank of the account it's paid from, as every payment draws it
  // (`drawFromBank`). From 2026-10-12: until then autopay from another account than the primary drew none, while a loan
  // repaid from that account did, and How You Pay said the link covered both; a card's autopay bounced, savings full.
  const linked = byHand || paymentsOf(person).linkSavings;
  const reach = linked ? inTheBank(sim, person, from) : inCurrent;
  // By hand the holder may pay more than is owed, and the card holds the credit (C23).
  const paid = Math.max(0, Math.min(amount, reach, byHand ? amount : -card.balance));
  if (paid <= 0) return 0;
  sim.post({
    memo: `Paid ${card.name}`, category: 'card-payment',
    postings: [{ accountId: card.id, amount: paid }, ...drawFromBank(sim, person, paid, false, linked, from).postings],
  });
  if (person.credit) {
    const state = stateOf(person, card);
    state.paidSinceStatement += paid;
    // Paid from another bank, the card's bank may hold back the credit it frees
    // for its days while the payment clears; paid from its own, it doesn't. The bank is the drawn account's: autopay's
    // own account, or the primary by hand. Until 2026-10-12 it was always the primary's, so autopay from the card's
    // bank with the primary elsewhere was held, and autopay from elsewhere with the primary at the card's bank wasn't.
    const days = card.bankId ? PENDING[card.bankId]?.paymentHoldDays : undefined;
    const drawnAt = (from ?? sim.universe.accounts[person.primaryAccountId ?? ''])?.bankId;
    if (days && drawnAt !== card.bankId) (state.paymentHolds ??= []).push({ amount: paid, until: sim.now + days * MS_DAY });
    const terms = cardTerms(sim, card, person.credit.score);
    allocatePayment(sim, person, card, paid, minimumDue(sim, state.statementBalance, terms, state.statementInterest ?? 0, state.statementPlanDue ?? 0), { cash: terms.cashApr, purchases: terms.apr });
  }
  return paid;
}

function zoneOf(sim: Simulation, person: Person): string {
  return CITIES.get(person.currentLocationId)?.timeZone ?? sim.homeZone;
}

/**
 * Canada's penalty rates, from each bank's cost-of-borrowing disclosure (read
 * 2026-09-26 into `probe/cards/out-1.jsonl`): two missed minimums in twelve
 * months, and the rate rises, RBC's purchases to 24.99%, BMO's to 25.99%,
 * CIBC's to 25.99% and its cash to 27.99%, "for at least 12 months". It comes
 * off after twelve payments on time in a row; RBC's box doesn't say how long,
 * and twelve is SLATE's estimate for it. Researched and run by nothing until
 * 2026-09-27, when only the US penalty rate ran.
 */
/**
 * Mexico's minimum payment, Banco de México Circular 13/2011, for every
 * issuer: the greater of 1.5% of the balance plus the period's interest, as
 * the banks' own terms have it, and 1.25% of the credit limit, never more than
 * what's owed. Researched on 2026-09-26 and not run until 2026-09-27, when the
 * minimum was the share of the balance alone.
 */
export const MEXICO_MINIMUM = {
  ofLimit: 0.0125,
  source: 'https://www.banxico.org.mx/marco-normativo/normativa-emitida-por-el-banco-de-mexico/circular-13-2011/%7BBA4CBC28-A468-16C9-6F17-9EA9D7B03318%7D.pdf',
} as const;

export const CANADA_PENALTY: Readonly<Record<string, { apr: number; cashApr?: number }>> = {
  'ca-rbc': { apr: 0.2499 },
  'ca-bmo': { apr: 0.2599 },
  'ca-cibc': { apr: 0.2599, cashApr: 0.2799 },
};
const CANADA_PENALTY_ON_TIME = 12;

/** The day a card states: the 20th, or the day they moved it to; the everyday card's where none is named. */
export function statementDayOf(person: Person | undefined, card?: Account): number {
  if (person?.credit && card) return stateOf(person, card).statementDay ?? 20;
  return person?.credit?.statementDay ?? 20;
}

/** A card's next statement: its day at nine. */
/**
 * The shortest billing cycle a moved statement day makes: a month less the four days Reg Z lets a cycle vary
 * (§1026.2(a)(4), "approximately equal intervals"), so the change makes one longer cycle, never a short one. Until
 * 2026-10-10 the next statement came at the new day's next date however soon, and moving the day each day cut a
 * statement each day: a month paid as agreed on the record each time, and the yearly fee twice in its month.
 */
export const MIN_CYCLE_DAYS = 27;

export function scheduleStatement(sim: Simulation, person: Person, after: Instant, card = cardOf(sim, person)): void {
  const zone = zoneOf(sim, person);
  const p = zonedParts(after, zone);
  const day = statementDayOf(person, card);
  let at = instantFromZoned({ year: p.year, month: p.month, day, hour: 9 }, zone);
  if (at <= after) at = instantFromZoned({ year: p.month === 12 ? p.year + 1 : p.year, month: p.month === 12 ? 1 : p.month + 1, day, hour: 9 }, zone);
  sim.schedule({ at, kind: STATEMENT_KIND, label: 'Card Statement', category: 'home', priority: 36, payload: { personId: person.id, ...(card ? { accountId: card.id } : {}) } });
}

/**
 * The payment due, at noon: so many days after the statement where the bank
 * says, else the 15th of the month after it.
 */
export function dueAt(zone: string, statementAt: Instant, graceDays?: number): Instant {
  const p = zonedParts(statementAt, zone);
  return graceDays !== undefined
    ? instantFromZoned({ year: p.year, month: p.month, day: p.day + graceDays, hour: 12 }, zone)
    : instantFromZoned({ year: p.month === 12 ? p.year + 1 : p.year, month: p.month === 12 ? 1 : p.month + 1, day: 15, hour: 12 }, zone);
}

function scheduleDue(sim: Simulation, person: Person, statementAt: Instant, graceDays: number | undefined, card: Account): void {
  const at = dueAt(zoneOf(sim, person), statementAt, graceDays);
  sim.schedule({ at, kind: DUE_KIND, label: 'Card Payment Due', category: 'home', priority: 36, payload: { personId: person.id, accountId: card.id } });
}

export function registerCredit(sim: Simulation): void {
  sim.onSchedule(STATEMENT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId ?? s.universe.playerId)];
    const record = person?.credit;
    const card = person ? cardFor(s, person, item.payload.accountId) : undefined;
    if (!person || !record || !card) return;
    const credit = stateOf(person, card);
    credit.statementAt = s.now;
    (credit.cuts ??= []).push(s.now);
    if (credit.cuts.length > 60) credit.cuts.splice(0, credit.cuts.length - 60);
    // Repriced from the record by the bank's own terms, then the month's
    // interest if last month's statement was carried.
    const terms = cardTerms(s, card, record.score);
    // The interest built up day by day: charged where the grace period is lost
    // (the last statement wasn't paid in full), with any trailing interest
    // from a carried balance paid off; where it holds, it waits for the due date.
    const cashInterest = Math.round(credit.cashAccrued ?? 0);
    credit.cashAccrued = 0;
    if (cashInterest > 0) {
      s.post({ memo: 'Cash advance interest', category: 'interest', postings: [{ accountId: s.nominalAccount('expense', 'Card Interest').id, amount: cashInterest }, { accountId: card.id, amount: -cashInterest }] });
      credit.cashOwed = (credit.cashOwed ?? 0) + cashInterest;
    }
    // Each transfer's interest, a plan's month and fee, and the cycle's rewards (module 8).
    statementOffers(s, card, credit, terms);
    const interest = Math.round((credit.carrying ? credit.accrued ?? 0 : 0) + (credit.trailing ?? 0));
    if (credit.carrying) credit.accrued = 0;
    credit.trailing = 0;
    credit.statementInterest = 0;
    if (interest > 0) {
      credit.statementInterest = interest;
      s.post({
        memo: 'Interest', category: 'interest',
        postings: [{ accountId: s.nominalAccount('expense', 'Card Interest').id, amount: interest }, { accountId: card.id, amount: -interest }],
      });
    }
    // A credit balance left six months is sent back to a US holder (Reg Z §1026.11).
    if (card.balance > 0 && credit.creditSince !== undefined && s.now - credit.creditSince >= 182 * 86_400_000 && bankById(card.bankId ?? '')?.iso === 'US') refundCredit(s, person, card);
    // The yearly fee, on the statement in the month the card was opened.
    // Once in that month: a moved statement day can give the month two statements, and until 2026-10-10 both charged it.
    // In its first year a US card's fees, penalties aside, may not pass a
    // quarter of the limit it opened with (Reg Z §1026.52(a)).
    const firstYearUs = bankById(card.bankId ?? '')?.iso === 'US' && s.now - card.openedAt < 365 * 86_400_000;
    const annualFee = firstYearUs ? Math.min(terms.annualFee, Math.round((card.creditLimit ?? 0) * 0.25)) : terms.annualFee;
    if (annualFee > 0 && credit.closing === undefined && zonedParts(s.now, zoneOf(s, person)).month === zonedParts(card.openedAt, zoneOf(s, person)).month
      && (credit.feeAt === undefined || s.now - credit.feeAt > 60 * 86_400_000)) {
      credit.feeAt = s.now;
      s.post({
        memo: `Yearly fee: ${card.name}`, category: 'fees',
        postings: [{ accountId: s.nominalAccount('expense', 'Card Fees').id, amount: annualFee }, { accountId: card.id, amount: -annualFee }],
      });
    }
    // Over the limit for somebody who opted in: the card's fee, once a cycle,
    // three cycles in a row at most (Reg Z §1026.56(j)).
    const overBy = Math.max(0, -card.balance) - (card.creditLimit ?? 0);
    if (overBy > 0 && credit.overLimitOptIn && terms.overLimitFee && (credit.overLimitCycles ?? 0) < 3) {
      credit.overLimitCycles = (credit.overLimitCycles ?? 0) + 1;
      s.post({ memo: 'Over-limit fee', category: 'fees', postings: [{ accountId: s.nominalAccount('expense', 'Card Fees').id, amount: terms.overLimitFee }, { accountId: card.id, amount: -terms.overLimitFee }] });
    } else if (overBy <= 0) credit.overLimitCycles = 0;
    persistentDebt(s, person, card, credit);
    credit.statementBalance = Math.max(0, -card.balance);
    credit.paidSinceStatement = 0;
    // Every six months, a good record raises the limit, unless the holder asked it never to be raised unasked.
    if (!credit.noAutoRaise && !credit.suspended && credit.closing === undefined && (credit.reviewedAt === undefined || s.now - credit.reviewedAt >= REVIEW_EVERY)) {
      credit.reviewedAt = s.now;
      const clean = !record.late.some((when) => s.now - when < 365 * 86_400_000);
      if (record.score >= RAISE_FROM && clean && (card.creditLimit ?? 0) > 0) {
        card.creditLimit = Math.round((card.creditLimit ?? 0) * 1.2 / 100) * 100;
        if (person.id === s.universe.playerId) {
          s.notify({ category: 'bank', title: 'Your Card Limit Went Up', body: `It's ${formatMoney(card.creditLimit, saveCurrency(s.universe))} now, for a clean record.`, importance: 40 });
        }
      }
    }
    // What this statement says, kept as it said it.
    (credit.issued ??= []).push({ at: s.now, minimum: credit.statementBalance > 0 ? minimumDue(s, credit.statementBalance, terms, credit.statementInterest ?? 0, credit.statementPlanDue ?? 0) : 0, terms });
    if (credit.issued.length > 60) credit.issued.splice(0, credit.issued.length - 60);
    if (credit.statementBalance > 0) scheduleDue(s, person, item.at, terms.graceDays, card);
    // Nothing owed: the month is reported now, paid as agreed.
    else reportMonth(s, person, ON_TIME);
    // A card the holder closed is finished once nothing is owed on it.
    if (credit.closing !== undefined && card.balance >= 0) {
      card.closedAt = s.now;
      ensurePrimary(s, person);
      if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: 'Card Closed', body: `The ${card.name} is paid off and closed.`, importance: 40 });
      return;
    }
    statementReady(s, person, card, credit.statementBalance > 0
      ? `${formatMoney(credit.statementBalance, saveCurrency(s.universe))} to pay, at least ${formatMoney(minimumDue(s, credit.statementBalance, terms, credit.statementInterest ?? 0, credit.statementPlanDue ?? 0), saveCurrency(s.universe))}.`
      : 'The card owes nothing this month.', credit.statementBalance > 0);
    scheduleStatement(s, person, item.at, card);
  });

  sim.onSchedule(DUE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId ?? s.universe.playerId)];
    const record = person?.credit;
    const card = person ? cardFor(s, person, item.payload.accountId) : undefined;
    if (!person || !record || !card) return;
    const credit = stateOf(person, card);
    const currency = saveCurrency(s.universe);
    const terms = cardTerms(s, card, record.score);
    const statement = credit.statementBalance;
    const { asked, due, minimum } = autopayAsk(s, person, card);
    // Autopay asks the bank for the whole amount; a current account that
    // can't cover it sends it back, and the card charges for that (C59).
    if (asked > 0) {
      if (autopayReach(s, person, card) >= asked) payCard(s, person, asked, false, card);
      else {
        // One penalty fee for one event on a US card (Reg Z §1026.52(b)(2)(ii)): a bounce that leaves the minimum
        // unpaid is charged the late fee below, and not the returned payment's as well, as until 2026-10-10 it was.
        const lateToo = bankById(card.bankId ?? '')?.iso === 'US' && credit.paidSinceStatement < due;
        const returned = lateToo ? 0 : terms.returnedPaymentFee;
        if (returned > 0) s.post({ memo: 'Returned payment fee', category: 'fees', postings: [{ accountId: s.nominalAccount('expense', 'Card Fees').id, amount: returned }, { accountId: card.id, amount: -returned }] });
        if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: 'A Card Payment Bounced', body: `Autopay asked for ${formatMoney(asked, currency)} and the current account couldn't cover it. ${returned > 0 ? `The card charged ${formatMoney(returned, currency)} for that.` : 'It’s late now, and the late fee is the one fee for it.'}`, importance: 75 });
      }
    }
    const paid = credit.paidSinceStatement;
    // Paid in full: a card that wasn't carrying keeps its grace period and the
    // cycle's interest is dropped; one that was carrying regains it, and what
    // built up to today is charged on the next statement, as trailing interest.
    // Not paid in full: the grace period is lost, and it all stands (C48).
    const wasCarrying = credit.carrying;
    credit.carrying = paid < statement;
    if (!credit.carrying) {
      if (wasCarrying) credit.trailing = (credit.trailing ?? 0) + (credit.accrued ?? 0);
      credit.accrued = 0;
    }

    let move = 0;
    if (paid < due) {
      // A US late fee may not be more than the minimum it was late on (Reg Z §1026.52(b)(2)(i)(B)).
      // Or the bank's share of the minimum, the balance or what went unpaid, held to any cap the law sets.
      const byRule = terms.lateRule ? Math.min(lateFeeByRule(terms.lateRule, due, paid, statement), terms.capped?.lateFee ?? Number.POSITIVE_INFINITY) : undefined;
      // A first late fee lower than a repeat one, where the bank sets it so: until 2026-09-27 Citi's $29 was researched and never charged.
      const tiered = card.bankId ? FIRST_LATE_FEE[card.bankId] : undefined;
      const us = bankById(card.bankId ?? '')?.iso === 'US';
      const within = (tiered?.withinPeriods ?? (us ? US_SAFE_HARBOR.withinPeriods : 0)) * 31 * 86_400_000;
      const repeat = credit.lateFeeAt !== undefined && s.now - credit.lateFeeAt < within;
      let flat = tiered && !repeat ? Math.min(terms.lateFee, inSave(s, tiered.first, bankById(card.bankId!)!.currency)) : terms.lateFee;
      // Every US card held to the safe harbor: $30, or $41 for a repeat within six cycles.
      if (us) flat = Math.min(flat, inSave(s, repeat ? US_SAFE_HARBOR.repeat : US_SAFE_HARBOR.first, 'USD'));
      const fee = byRule ?? (us ? Math.min(flat, due) : flat);
      credit.lateFeeAt = s.now;
      s.post({
        memo: 'Late fee', category: 'fees',
        postings: [{ accountId: s.nominalAccount('expense', 'Card Fees').id, amount: fee }, { accountId: card.id, amount: -fee }],
      });
      credit.missed = (credit.missed ?? 0) + 1;
      // A US lender reports a payment late to the bureaus once it's thirty
      // days past due, at the next due date still short; elsewhere the month's
      // report carries it. Until 2026-09-27 a US payment a day short was on
      // the record at once. On the record, the lender cuts the line too,
      // never under what's owed on it.
      const reported = bankById(card.bankId ?? '')?.iso !== 'US' || credit.missed >= 2;
      if (reported) {
        record.late = [...record.late.filter((when) => s.now - when < 365 * 86_400_000), s.now];
        move -= 50;
        (record.marks ??= []).push({ at: s.now, points: 50, country: CITIES.get(person.currentLocationId)?.countryId ?? '' });
        const cut = Math.max(Math.max(0, -card.balance), Math.round((card.creditLimit ?? 0) * 0.7 / 100) * 100);
        if (cut < (card.creditLimit ?? 0)) card.creditLimit = cut;
      }
      s.notify({
        category: 'bank',
        title: 'A Late Card Payment',
        body: `The minimum was ${formatMoney(minimum, currency)} and only ${formatMoney(paid, currency)} went in. A ${formatMoney(fee, currency)} fee, and ${reported ? 'it’s on your record' : 'it goes on your record if it’s still short at the next due date, thirty days past due'}.`,
        importance: 80,
      });
      if (credit.penalty) credit.penalty.onTime = 0;
      if (bankById(card.bankId ?? '')?.iso === 'GB') credit.recentFees = [...(credit.recentFees ?? []).filter((one) => s.now - one.at < 28 * 86_400_000), { at: s.now, amount: fee }];
      afterMissed(s, person, card, credit, due - paid);
      // Sixty days late on a US card: its introductory rates end (Reg Z §1026.55(b)(4)). A card whose terms end it at one missed minimum, at once.
      if ((credit.missed ?? 0) >= 2 && bankById(card.bankId ?? '')?.iso === 'US') credit.introLost = true;
      if (card.bankId && INTRO_ENDS_ON_MISS.has(card.bankId)) credit.introLost = true;
      // Sixty days late on a US card with a penalty rate: 45 days' notice, then the penalty rate (Reg Z §1026.9(g), §1026.55(b)(4)).
      if ((credit.missed ?? 0) >= 2 && !credit.penalty && terms.penaltyApr && bankById(card.bankId ?? '')?.iso === 'US' && !card.closedAt) {
        credit.penalty = { noticeAt: s.now, from: s.now + 45 * 86_400_000, onTime: 0 };
        if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: 'A Penalty Rate Is Coming', body: `Sixty days late. From ${formatDate(credit.penalty.from, zoneOf(s, person))} the ${card.name} charges ${(terms.penaltyApr * 100).toFixed(2)}% on what's owed. Six payments on time in a row takes it off.`, importance: 85 });
      }
      // Two missed minimums in twelve months on a Canadian card with a penalty rate: it rises at once (`CANADA_PENALTY`).
      const recentMisses = record.late.filter((when) => s.now - when < 365 * 86_400_000).length;
      if (recentMisses >= 2 && !credit.penalty && card.bankId && CANADA_PENALTY[card.bankId] && !card.closedAt) {
        credit.penalty = { noticeAt: s.now, from: s.now, onTime: 0 };
        if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: 'A Penalty Rate', body: `Two missed minimums in twelve months. The ${card.name} charges ${(CANADA_PENALTY[card.bankId]!.apr * 100).toFixed(2)}% on purchases from today, until twelve payments in a row are on time.`, importance: 85 });
      }
    } else {
      move += ON_TIME;
      credit.missed = 0;
      // Six on time in a row after the penalty began, and it comes off (Reg Z §1026.55(b)(4)(ii)).
      if (credit.penalty && s.now >= credit.penalty.from) {
        credit.penalty.onTime += 1;
        const needed = card.bankId && CANADA_PENALTY[card.bankId] ? CANADA_PENALTY_ON_TIME : 6;
        if (credit.penalty.onTime >= needed) {
          delete credit.penalty;
          if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: 'The Penalty Rate Is Off', body: `${needed === 6 ? 'Six' : 'Twelve'} payments on time. The ${card.name} is back to ${((card.apr ?? terms.priced) * 100).toFixed(2)}%.`, importance: 50 });
        }
      }
      if (credit.suspended === 'late') {
        delete credit.suspended;
        if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: 'Your Card Works Again', body: `Payments are back on time, and ${terms.issuer ?? 'the bank'} has lifted the suspension.`, importance: 50 });
      }
      if (credit.hardship && card.balance >= 0) {
        delete credit.hardship;
        if (credit.suspended === 'hardship' || credit.suspended === 'persistent') delete credit.suspended;
      }
    }
    reportMonth(s, person, move);
  });

  // Each day: interest builds on what the card owes that day, the interest
  // before it included (daily compounding, C50), apart from a British card's
  // default fees in their first 28 days (C64). Whether it's charged is
  // settled at the statement and the due date (C48). Until 2026-09-26 a
  // month's interest was charged in one sum at the statement, on that day's
  // balance, and only after a statement had gone unpaid.
  sim.onEvent('world.day_rollover', 'credit.no_card', (_event, { sim: s }) => {
    if (zonedParts(s.now, s.homeZone).day !== 1) return;
    for (const person of Object.values(s.universe.people)) reportWithoutCard(s, person);
  });

  sim.onEvent('world.day_rollover', 'card.interest', (_event, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) {
      if (!person.credit) continue;
      ensurePrimary(s, person);
      for (const card of cardsOf(s, person)) {
      const credit = stateOf(person, card);
      // The credit balance's age, for the US refund.
      if (card.balance > 0) credit.creditSince ??= s.now; else delete credit.creditSince;
      // Held credit comes back on its day.
      if (credit.paymentHolds) { credit.paymentHolds = credit.paymentHolds.filter((one) => one.until > s.now); if (!credit.paymentHolds.length) delete credit.paymentHolds; }
      if (credit.hardship || card.balance >= 0) continue;
      const terms = cardTerms(s, card, person.credit.score);
      const freeFees = bankById(card.bankId ?? '')?.iso === 'GB'
        ? (credit.recentFees ?? []).filter((one) => s.now - one.at < 28 * 86_400_000).reduce((a, one) => a + one.amount, 0)
        : 0;
      // Cash advances draw their own rate from the day they're taken, grace period or none (C49).
      const cash = cashOwedOn(person, card);
      if (cash > 0) credit.cashAccrued = (credit.cashAccrued ?? 0) + (cash + (credit.cashAccrued ?? 0)) * terms.cashApr / 365;
      // Transfers draw their own rates from the day they're made; a plan draws a fee, not interest.
      for (const one of credit.transfers ?? []) {
        if (one.owed > 0) one.accrued += (one.owed + one.accrued) * transferRate(s, credit, one) / 365;
      }
      const bearing = Math.max(0, -card.balance - cash - transfersOwedOn(person, card) - planLeftOf(credit) - freeFees) + (credit.accrued ?? 0);
      credit.accrued = (credit.accrued ?? 0) + bearing * terms.apr / 365;
      }
    }
  });

  sim.onCommand<{ accountId?: string }, { refunded: Money }>('card.refund_credit', (p, { sim: s }) => {
    const person = s.player;
    const card = cardFor(s, person, p?.accountId);
    if (!card || card.balance <= 0) throw new CommandError('The card holds no credit to send back.');
    return { refunded: refundCredit(s, person, card) };
  });

  sim.onCommand<{ amount: 'full' | 'minimum' | number; accountId?: string }, { paid: Money }>('finance.pay_card', (p, { sim: s }) => {
    const person = s.player;
    const card = cardFor(s, person, p.accountId);
    if (!card || !person.credit) throw new CommandError('You don’t have a card.');
    const owed = Math.max(0, -card.balance);
    if (owed === 0 && typeof p.amount !== 'number') throw new CommandError('You don’t owe anything on it.');
    const state = stateOf(person, card);
    const want = p.amount === 'full' ? owed
      : p.amount === 'minimum' ? minimumDue(s, state.statementBalance ?? owed, cardTerms(s, card, person.credit.score), state.statementInterest ?? 0, state.statementPlanDue ?? 0)
        : Math.round(Number(p.amount));
    if (!(want > 0)) throw new CommandError('Pay something, or nothing.');
    const paid = payCard(s, person, want, true, card);
    if (paid === 0) throw new CommandError('There’s nothing in the bank to pay it with.');
    return { paid };
  });

  sim.onCommand<{ mode: 'minimum' | 'full'; accountId?: string }, { mode: string }>('finance.set_autopay', (p, { sim: s }) => {
    if (p.mode !== 'minimum' && p.mode !== 'full') throw new CommandError('Autopay pays the minimum or the whole statement.');
    if (!s.player.credit) throw new CommandError('You don’t have a card.');
    const card = cardFor(s, s.player, p.accountId);
    const terms = card ? cardTerms(s, card, s.player.credit.score) : undefined;
    if (terms?.kind === 'charge' && p.mode === 'minimum') {
      throw new CommandError(`${terms.issuer ?? 'The bank'} takes the whole statement from your account each month; the ${terms.name} can’t carry a balance.`);
    }
    (card ? stateOf(s.player, card) : s.player.credit).autopay = p.mode;
    return { mode: p.mode };
  });

  sim.onCommand<{ accountId: string }, { everyday: string }>('card.set_everyday', (p, { sim: s }) => {
    const person = s.player;
    const card = cardFor(s, person, p.accountId);
    if (!card || !person.credit || !p.accountId) throw new CommandError('You don’t hold that card.');
    makeEveryday(person, card);
    return { everyday: card.id };
  });
}

/** A month paid as agreed. */
const ON_TIME = 3;

/**
 * A month on the record with no card open: SLATE's estimate. The bureaus
 * score every month from the whole file, and a closed card, a charge-off
 * or collections stay on it; with no card reporting there is no payment
 * history to build on, but negatives age. So the score climbs `aging` a
 * month while nothing is owed in collections and no payment has been late
 * in a year, and a thin file stops at `ceiling`.
 * Until 2026-09-27 the score moved only at a card's statement, and after a
 * charge-off, or a card closed, it never moved again.
 */
export const NO_CARD = { aging: 2, ceiling: 680 } as const;

/** The 1st of the month's report for somebody with no card open. */
export function reportWithoutCard(sim: Simulation, person: Person): void {
  const credit = person.credit;
  if (!credit || cardOf(sim, person)) return;
  const inCollections = Object.values(sim.universe.accounts).some((a) => a.ownerId === person.id && !a.closedAt && a.category === 'collections' && a.balance < 0);
  const lateThisYear = credit.late.some((at) => sim.now - at < 365 * 86_400_000);
  if (inCollections || lateThisYear || credit.score >= NO_CARD.ceiling) return;
  credit.score = Math.min(NO_CARD.ceiling, credit.score + NO_CARD.aging);
}

/** A card's credit balance sent back to the current account (C23). */
function refundCredit(sim: Simulation, person: Person, card: Account): Money {
  const credit = Math.max(0, card.balance);
  const current = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
  if (credit <= 0 || !current) return 0;
  sim.post({ memo: `Credit refunded from ${card.name}`, category: 'transfer', postings: [{ accountId: card.id, amount: -credit }, { accountId: current.id, amount: credit }] });
  if (person.credit) delete stateOf(person, card).creditSince;
  return credit;
}

/** What autopay can take: the current account, and savings where it's linked to it. */
/**
 * The account a card's autopay pays from: the one it was set up on (from 2026-10-10; a card from before is pinned to
 * the primary account the first time it's asked). Until then it was whichever account was primary on the due date.
 */
export function autopaySource(sim: Simulation, person: Person, card: Account): Account | undefined {
  const state = stateOf(person, card);
  if (state.autopayFrom === undefined && person.primaryAccountId) state.autopayFrom = person.primaryAccountId;
  return state.autopayFrom ? sim.universe.accounts[state.autopayFrom] : undefined;
}

/**
 * What a card's autopay will ask its account for on the due date, and the minimum due: a charge card's minimum is the
 * whole statement, and a hardship plan's payment stands in for both (from 2026-10-10 a function of its own, which the
 * account alerts read ahead of the day, `systems/statements.ts`).
 */
export function autopayAsk(sim: Simulation, person: Person, card: Account): { asked: Money; due: Money; minimum: Money } {
  const credit = stateOf(person, card);
  const terms = cardTerms(sim, card, person.credit!.score);
  const statement = credit.statementBalance;
  const minimum = minimumDue(sim, statement, terms, credit.statementInterest ?? 0, credit.statementPlanDue ?? 0);
  const plan = credit.hardship ? Math.min(statement, credit.hardship.payment) : undefined;
  const want = plan ?? (credit.autopay === 'full' ? statement : minimum);
  return { asked: Math.max(0, want - credit.paidSinceStatement), due: plan ?? minimum, minimum };
}

function autopayReach(sim: Simulation, person: Person, card: Account): Money {
  const from = autopaySource(sim, person, card);
  if (!from || from.closedAt) return 0;
  // The link reaches savings at the autopay account's own bank, as `payCard` draws it (from 2026-10-12: until then only
  // where that account was the primary).
  return paymentsOf(person).linkSavings ? inTheBank(sim, person, from) : Math.max(0, from.balance);
}

/**
 * After a due date with less than the minimum paid: a British bank takes
 * what was missed from the holder's other accounts with it (C26); two in a
 * row and the card is suspended (C86); five and a default notice goes, as
 * the Consumer Credit Act's section 87 asks before a default; six, 180 days,
 * and the card is closed and what's owed is charged off to collections
 * (C12, C15).
 */
function afterMissed(sim: Simulation, person: Person, card: Account, credit: CardState, short: Money): void {
  const currency = saveCurrency(sim.universe);
  const bank = card.bankId ? bankById(card.bankId) : undefined;
  if (bank?.iso === 'GB' && short > 0) {
    const theirs = Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && !a.closedAt && a.bankId === bank.id && (a.kind === 'checking' || a.kind === 'savings') && a.balance > 0);
    let left = short;
    const postings: { accountId: string; amount: Money }[] = [];
    for (const account of theirs) {
      const take = Math.min(left, account.balance);
      if (take <= 0) continue;
      postings.push({ accountId: account.id, amount: -take });
      left -= take;
    }
    const taken = short - left;
    if (taken > 0) {
      sim.post({ memo: `Set off against ${card.name}`, category: 'card-payment', postings: [...postings, { accountId: card.id, amount: taken }] });
      credit.paidSinceStatement += taken;
    }
  }
  const missed = credit.missed ?? 0;
  if (missed >= SUSPEND_AFTER && !credit.suspended) {
    credit.suspended = 'late';
    if (person.id === sim.universe.playerId) sim.notify({ category: 'bank', title: 'Your Card Is Suspended', body: `${missed} payments missed in a row. ${bank?.name ?? 'The bank'} has stopped the ${card.name} until it's brought up to date.`, importance: 85 });
  }
  if (missed === CHARGE_OFF_AFTER - 1 && person.id === sim.universe.playerId) {
    sim.notify({ category: 'bank', title: 'A Default Notice', body: `The ${card.name} is ${missed * 30} days behind. Pay at least ${formatMoney(minimumDue(sim, Math.max(0, -card.balance), cardTerms(sim, card, person.credit!.score), credit.statementInterest ?? 0, credit.statementPlanDue ?? 0), currency)} before the next due date, or the whole balance falls due and goes to collections.`, importance: 95 });
  }
  if (missed >= CHARGE_OFF_AFTER) chargeOff(sim, person, card, credit);
}

/** The card closed, and what's owed on it charged off to collections, owed to the bank. */
function chargeOff(sim: Simulation, person: Person, card: Account, credit: CardState): void {
  const owed = Math.max(0, -card.balance);
  const bank = card.bankId ? bankById(card.bankId) : undefined;
  const name = `Owed To ${bank?.name ?? card.institution ?? 'The Bank'}, In Collections`;
  const debt = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && !a.closedAt && a.kind === 'loan' && a.category === 'collections' && a.institution === (bank?.name ?? card.institution))
    ?? sim.openAccount({ id: sim.nextId('account'), kind: 'loan', category: 'collections', name, ownerId: person.id, institution: bank?.name ?? card.institution, openedAt: sim.now });
  if (owed > 0) sim.post({ memo: `Charged off: ${card.name}`, category: 'transfer', postings: [{ accountId: card.id, amount: owed }, { accountId: debt.id, amount: -owed }] });
  card.closedAt = sim.now;
  credit.cashOwed = 0;
  credit.cashAccrued = 0;
  credit.transfers = [];
  credit.plans = [];
  markRecord(person, CHARGED_OFF, sim.now, person.currentLocationId, pesos(sim, owed));
  delete credit.suspended;
  delete credit.hardship;
  credit.missed = 0;
  ensurePrimary(sim, person);
  if (person.id === sim.universe.playerId) sim.notify({ category: 'bank', title: 'Your Card Was Charged Off', body: `${formatMoney(owed, saveCurrency(sim.universe))} on the ${card.name} is with collections now, and the card is closed. It's on your record.`, importance: 95 });
}

/** What a charge-off costs the record: SLATE's estimate, heavier than an eviction's sixty. */
const CHARGED_OFF = 100;

/**
 * Britain's persistent debt (FCA CONC 6.7.27–6.7.40): eighteen months in
 * which more went to interest and fees than to paying the card down, and the
 * bank must write; thirty-six, and it must offer a way to pay it off in a
 * reasonable time and may suspend the card. SLATE's plan freezes the
 * interest and asks a forty-eighth of the balance a month, four years, the
 * longest the rules' examples run.
 */
function persistentDebt(sim: Simulation, person: Person, card: Account, credit: CardState): void {
  if (bankById(card.bankId ?? '')?.iso !== 'GB' || credit.hardship) return;
  const month = 30 * 86_400_000;
  const over = (months: number) => {
    const since = sim.now - months * month;
    if (card.openedAt > since) return false;
    let charges = 0;
    let paid = 0;
    for (const txn of sim.universe.transactions) {
      if (txn.at < since) continue;
      const on = txn.postings.filter((p) => p.accountId === card.id).reduce((a, p) => a + p.amount, 0);
      if (on === 0) continue;
      if (txn.category === 'interest' || txn.category === 'fees') charges += -on;
      else if (on > 0) paid += on;
    }
    return charges > 0 && charges > paid - charges;
  };
  if (over(36)) {
    const owed = Math.max(0, -card.balance);
    credit.hardship = { payment: Math.ceil(owed / 48 / 100) * 100, since: sim.now };
    credit.suspended = 'persistent';
    if (person.id === sim.universe.playerId) sim.notify({ category: 'bank', title: 'A Plan To Clear The Card', body: `Three years in which more went to interest and fees than to the card itself. The bank has frozen the interest and set ${formatMoney(credit.hardship.payment, saveCurrency(sim.universe))} a month to clear it in four years, and suspended the card.`, importance: 80 });
  } else if (over(18) && (credit.persistentNoticeAt === undefined || sim.now - credit.persistentNoticeAt > 365 * 86_400_000)) {
    credit.persistentNoticeAt = sim.now;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'bank', title: 'Persistent Debt', body: `Over eighteen months more of what you paid the ${card.name} went to interest and fees than to the card. Paying more than the minimum would clear it sooner; the bank can help if you can't.`, importance: 60 });
  }
}

/**
 * A card's month on the record: how it was paid, and how much of all the
 * cards is used, as a bureau reads utilization across every revolving
 * account. Each card reports its own month: a late payment on any of them
 * is the whole mark, and a month paid as agreed, and what's used, count once
 * however many cards report them, each card a share (the record holds the
 * share's fraction, and a screen shows the score whole);
 * until 2026-09-28 one card was all there was. Rent owed to a
 * private landlord isn't reported to the bureaus; an eviction or a debt sent
 * to collections is. Until 2026-09-27 rent owed cost ten points every month
 * it stood.
 */
function reportMonth(sim: Simulation, person: Person, paid: number): void {
  const record = person.credit;
  if (!record) return;
  const cards = cardsOf(sim, person);
  const limit = cards.reduce((sum, c) => sum + (c.creditLimit ?? 0), 0);
  const owed = cards.reduce((sum, c) => sum + Math.max(0, -c.balance), 0);
  const used = limit > 0 ? owed / limit : 0;
  const share = Math.max(1, cards.length);
  let move = paid < 0 ? paid : paid / share;
  if (used > 0.3) move -= Math.round((used - 0.3) * 20) / share;
  record.score = Math.max(SCORE_MIN, Math.min(SCORE_MAX, record.score + move));
}

/**
 * Somebody this comfortable with risk carries a card balance rather than clear
 * it: their autopay starts on the minimum. Risk tolerance is, in the first
 * place, willingness to carry financial risk; the slider was read by nothing
 * until the card, and the player can change the autopay whenever they like.
 */
const CARRIES_A_BALANCE = 65;

/** Opens their record at a score, with the first statement on the calendar. */
export function openCredit(sim: Simulation, person: Person, score: number): void {
  const autopay = (person.personality?.riskTolerance ?? 50) > CARRIES_A_BALANCE ? 'minimum' : 'full';
  person.credit = {
    score, late: [], autopay, statementBalance: 0, paidSinceStatement: 0, reviewedAt: sim.now,
    // A balance brought in from before is one the last statement didn't clear.
    carrying: (cardOf(sim, person)?.balance ?? 0) < 0,
  };
  const card = cardOf(sim, person);
  if (card) {
    person.credit.primaryId = card.id;
    const terms = cardTerms(sim, { ...card, apr: undefined }, score);
    // The rate the record bought, held from here on.
    card.apr = terms.priced;
    // A charge card is paid in full; nobody's autopay can say otherwise.
    if (terms.kind === 'charge') person.credit.autopay = 'full';
  }
  scheduleStatement(sim, person, sim.now);
}

/** A statement ahead for each card of everybody with a record, where none is: one naming the card, or, the everyday card, one from before cards were named. */
export function armCredit(sim: Simulation): void {
  for (const person of Object.values(sim.universe.people)) {
    if (!person.credit) continue;
    ensurePrimary(sim, person);
    const primary = cardOf(sim, person);
    for (const card of cardsOf(sim, person)) {
      const due = sim.universe.scheduled.some((one) => one.kind === STATEMENT_KIND && one.status === 'pending'
        && one.payload.personId === person.id && (one.payload.accountId === card.id || (one.payload.accountId === undefined && card.id === primary?.id)));
      if (!due) scheduleStatement(sim, person, sim.now, card);
    }
  }
}
