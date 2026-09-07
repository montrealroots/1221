/**
 * SLATE — banks and what they sell.
 *
 * Two kinds of thing live here. SLATE's own high-street bank and private
 * bank, whose shapes are the ones retail banking actually uses — a fee
 * waived above a balance, a rate that rises with the tier, a card with a
 * statement and a due date, a certificate that punishes you for wanting
 * your money early — with no rate, fee or limit quoted from anybody. And
 * the real cards people talk about (content/wealth): the Centurion, the
 * Platinum, the Sapphire Reserve and the rest, with their published fees
 * and their invitation rules said to be reported where they are reported.
 * A real card is a product like any other on the shelf; what makes it real
 * is that its issuer, its fee and its network are public record.
 */

import type { Money } from '../core/money';
import type { AccountKind } from '../core/ledger';
import { REAL_CARDS, type CardNetwork, type RealCard } from './wealth';

export type ProductFamily = 'checking' | 'savings' | 'certificate' | 'card';

export interface BankInstitution {
  id: string;
  name: string;
  /** How hard it is to get in: a minimum opening deposit across the board. An issuer sells cards and nothing else. */
  standing: 'everyday' | 'private' | 'issuer';
  about: string;
  /** A real institution, named as itself. */
  real?: true;
}

export interface BankProduct {
  id: string;
  institutionId: string;
  name: string;
  family: ProductFamily;
  kind: AccountKind;
  /** What it takes to open. */
  minimumOpening: Money;
  /** Charged monthly unless the balance clears the waiver. */
  monthlyFee: Money;
  /** Above this, the fee is waived. Zero means it is always charged. */
  feeWaivedAbove: Money;
  /** Annual rate paid on a positive balance. */
  apy: number;
  /** A certificate's term, in months. */
  termMonths?: number;
  /** What breaking a certificate early costs, as a share of the interest earned. */
  earlyExitShare?: number;
  /** Withdrawals a month before a fee bites, on a savings product. */
  freeWithdrawals?: number;
  excessWithdrawalFee?: Money;
  /** What the bank will cover you for when the balance runs out, and what going there costs. */
  overdraftLimit?: Money;
  overdraftItemFee?: Money;
  /** A card's limit before your own credit is looked at, and the rate it carries. */
  baseCreditLimit?: Money;
  /** The lowest credit score that gets approved. */
  minimumScore?: number;
  /** A card's minimum payment: this share of the statement, or the floor, whichever is more. */
  minimumShare?: number;
  minimumFloor?: Money;
  /** What a late payment costs. */
  lateFee?: Money;
  perks: string[];
  about: string;
  /** A real card: the published annual fee, billed monthly in SLATE, and whatever else the issuer publishes. */
  real?: true;
  network?: CardNetwork;
  annualFee?: Money;
  /** A one-time fee on opening, where the issuer charges one. */
  initiationFee?: Money;
  /** Where it is issued. Absent: anywhere. */
  countryIds?: readonly string[];
  /** Not applied for. The rule SLATE uses for the invitation, labelled as reported. */
  invitation?: RealCard['invitation'];
}

export const BANK_NOTE = 'Northbank and Meridian are SLATE\'s own; every rate, fee and limit on them is a calibration, not an offer from anybody. The named cards are real, with their published fees.';

/** A real issuer's id, from its name. */
export function issuerId(issuer: string): string {
  return `issuer:${issuer.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
}

export const INSTITUTIONS: readonly BankInstitution[] = [
  { id: 'northbank', name: 'Northbank', standing: 'everyday', about: 'A high-street bank with a branch in most places and an app that mostly works.' },
  { id: 'meridian_private', name: 'Meridian Private', standing: 'private', about: 'A private bank for people with a lot to look after. They answer the telephone.' },
  ...[...new Set(REAL_CARDS.map((c) => c.issuer))].map((issuer): BankInstitution => ({ id: issuerId(issuer), name: issuer, standing: 'issuer', about: 'A real card issuer. The cards are named with the fees the issuer publishes.', real: true })),
];

/** A real card, on the shelf beside SLATE's own. The annual fee is billed monthly here, and says so. */
export function cardProduct(card: RealCard): BankProduct {
  return {
    id: card.id, institutionId: issuerId(card.issuer), name: card.name, family: 'card', kind: 'credit_card',
    minimumOpening: 0, monthlyFee: Math.round(card.annualFee / 12), feeWaivedAbove: 0, apy: 0,
    baseCreditLimit: card.baseCreditLimit, minimumScore: card.minimumScore, minimumShare: 0.02, minimumFloor: 40_00, lateFee: 40_00,
    perks: [...card.perks], about: card.about, real: true, network: card.network,
    annualFee: card.annualFee, initiationFee: card.initiationFee, countryIds: card.countryIds, invitation: card.invitation,
  };
}

const SLATE_PRODUCTS: readonly BankProduct[] = [
  // --- Everyday ------------------------------------------------------------
  {
    id: 'nb_everyday', institutionId: 'northbank', name: 'Everyday Checking', family: 'checking', kind: 'checking',
    minimumOpening: 25_00, monthlyFee: 12_00, feeWaivedAbove: 1_500_00, apy: 0,
    overdraftLimit: 200_00, overdraftItemFee: 35_00,
    perks: ['Debit Card', 'Two Hundred Of Cover', 'Thirty Five Each Time You Use It'],
    about: 'The account most people have. Twelve a month unless you keep fifteen hundred in it.',
  },
  {
    id: 'nb_signature', institutionId: 'northbank', name: 'Signature Checking', family: 'checking', kind: 'checking',
    minimumOpening: 2_500_00, monthlyFee: 30_00, feeWaivedAbove: 25_000_00, apy: 0.005,
    overdraftLimit: 2_500_00, overdraftItemFee: 15_00,
    perks: ['Debit Card', 'Interest On The Balance', 'Fee Waived Above Twenty Five Thousand', 'Two And A Half Thousand Of Cover At Fifteen A Time'],
    about: 'Pays a little, covers a lot, and costs thirty a month unless the balance is serious.',
  },
  {
    id: 'mp_reserve', institutionId: 'meridian_private', name: 'Reserve Account', family: 'checking', kind: 'checking',
    minimumOpening: 250_000_00, monthlyFee: 0, feeWaivedAbove: 0, apy: 0.012,
    overdraftLimit: 100_000_00, overdraftItemFee: 0,
    perks: ['No Fees At All', 'A Hundred Thousand Of Cover, No Fee', 'A Person Who Answers'],
    about: 'A quarter of a million to open. After that they stop charging you for things.',
  },

  // --- Savings ------------------------------------------------------------
  {
    id: 'nb_savings', institutionId: 'northbank', name: 'Savings', family: 'savings', kind: 'savings',
    minimumOpening: 0, monthlyFee: 0, feeWaivedAbove: 0, apy: 0.021,
    freeWithdrawals: 6, excessWithdrawalFee: 10_00,
    perks: ['Six Withdrawals A Month'],
    about: 'Somewhere to put it that is not the current account. Six withdrawals a month before they charge.',
  },
  {
    id: 'nb_high_yield', institutionId: 'northbank', name: 'High Yield Savings', family: 'savings', kind: 'savings',
    minimumOpening: 10_000_00, monthlyFee: 0, feeWaivedAbove: 0, apy: 0.043,
    freeWithdrawals: 3, excessWithdrawalFee: 25_00,
    perks: ['A Better Rate', 'Three Withdrawals A Month'],
    about: 'Ten thousand to open and a rate worth having, as long as you leave it alone.',
  },
  {
    id: 'mp_treasury', institutionId: 'meridian_private', name: 'Treasury Savings', family: 'savings', kind: 'savings',
    minimumOpening: 100_000_00, monthlyFee: 0, feeWaivedAbove: 0, apy: 0.052,
    freeWithdrawals: 12, excessWithdrawalFee: 0,
    perks: ['The Best Rate They Offer', 'Withdraw As You Like'],
    about: 'A hundred thousand to open. The rate is the reason people move their money here.',
  },

  // --- Certificates -------------------------------------------------------
  {
    id: 'nb_cd_12', institutionId: 'northbank', name: 'Twelve Month Certificate', family: 'certificate', kind: 'savings',
    minimumOpening: 1_000_00, monthlyFee: 0, feeWaivedAbove: 0, apy: 0.048, termMonths: 12, earlyExitShare: 0.5,
    perks: ['Locked For A Year', 'A Better Rate For Locking It'],
    about: 'A year, at a rate the savings account does not pay. Take it out early and half the interest goes.',
  },
  {
    id: 'nb_cd_36', institutionId: 'northbank', name: 'Three Year Certificate', family: 'certificate', kind: 'savings',
    minimumOpening: 5_000_00, monthlyFee: 0, feeWaivedAbove: 0, apy: 0.056, termMonths: 36, earlyExitShare: 0.75,
    perks: ['Locked For Three Years', 'The Best Rate On A Deposit'],
    about: 'Three years is a long time to promise. They pay you for the promise, and charge you for breaking it.',
  },

  // --- Cards ---------------------------------------------------------------
  {
    id: 'nb_card_everyday', institutionId: 'northbank', name: 'Everyday Card', family: 'card', kind: 'credit_card',
    minimumOpening: 0, monthlyFee: 0, feeWaivedAbove: 0, apy: 0,
    baseCreditLimit: 2_000_00, minimumScore: 560, minimumShare: 0.02, minimumFloor: 35_00, lateFee: 40_00,
    perks: ['No Annual Fee'],
    about: 'A first card. Small limit, ordinary rate, and it builds the history everything else asks for.',
  },
  {
    id: 'nb_card_rewards', institutionId: 'northbank', name: 'Rewards Card', family: 'card', kind: 'credit_card',
    minimumOpening: 0, monthlyFee: 8_00, feeWaivedAbove: 0, apy: 0,
    baseCreditLimit: 12_000_00, minimumScore: 680, minimumShare: 0.02, minimumFloor: 40_00, lateFee: 40_00,
    perks: ['Eight A Month', 'A Bigger Limit'],
    about: 'Costs eight a month and lends you rather more. Wants a score in the high six hundreds.',
  },
  {
    id: 'mp_card_reserve', institutionId: 'meridian_private', name: 'Reserve Card', family: 'card', kind: 'credit_card',
    minimumOpening: 0, monthlyFee: 65_00, feeWaivedAbove: 0, apy: 0,
    baseCreditLimit: 100_000_00, minimumScore: 760, minimumShare: 0.01, minimumFloor: 100_00, lateFee: 0,
    perks: ['Sixty Five A Month', 'A Limit That Clears A Car', 'No Late Fee, And They Call Instead'],
    about: 'The card that gets you a table. Sixty five a month, and a score that is not easy to have.',
  },
];

export const BANK_PRODUCTS: readonly BankProduct[] = [...SLATE_PRODUCTS, ...REAL_CARDS.map(cardProduct)];

export function productById(id: string): BankProduct | undefined {
  return BANK_PRODUCTS.find((p) => p.id === id);
}

export function institutionById(id: string): BankInstitution | undefined {
  return INSTITUTIONS.find((i) => i.id === id);
}

export function productsOf(family: ProductFamily): BankProduct[] {
  return BANK_PRODUCTS.filter((p) => p.family === family);
}

/** What a product is called on screen, with who sells it. */
export function productLabel(product: BankProduct): string {
  const issuer = institutionById(product.institutionId)?.name ?? 'A Bank';
  // "Coutts Silk Card" already says Coutts; "Everyday Card" does not say Northbank.
  return product.name.startsWith(issuer.split(' ')[0] ?? issuer) ? product.name : `${issuer} ${product.name}`;
}
