/**
 * SLATE — the banks, country by country.
 *
 * Real banks under their own names, with their own account names, fees and
 * savings rates where they publish them, the deposit guarantee that covers
 * them and the central bank's rate, for the thirteen countries SLATE pays
 * and taxes a life in (`BANKING`). Every other country has its biggest banks
 * by name and its deposit guarantee (`WORLD_BANKS` in `banks-world.ts`), and
 * accounts there have no fee and pay the rate the table says, which is
 * none where nothing was found.
 *
 * Every figure says where it came from and when. A figure marked `estimate`
 * is SLATE's own, set from the figures around it, and the screen says so.
 * Rates and fees move; each is as the source had it on the date given.
 */

import type { Money } from '../core/money';
import { COUNTRIES } from './geography';
import { worldBanking } from './banks-world';
import { THIRTEEN } from './banks-thirteen';

export type NumberFormat =
  | 'us' | 'ca' | 'mx' | 'gb' | 'ie' | 'is' | 'de' | 'fr' | 'es' | 'jp' | 'kr' | 'au' | 'nz' | 'iban' | 'plain';

export interface Product {
  /** The account's name at the bank, as the bank sells it. */
  name: string;
  /** A month's fee, in the bank's currency's hundredths. Absent: none. */
  monthlyFee?: Money;
  /**
   * What waives the fee: wages paid in during the month, a balance kept all
   * month, or an age under a line, in the bank's currency's hundredths. With
   * `reducedTo`, meeting it lowers the fee to that rather than waiving it.
   */
  waiver?: { depositsAtLeast?: Money; balanceAtLeast?: Money; ageBelow?: number; reducedTo?: Money };
  /** What it pays a year, as a fraction. Absent: nothing. */
  rate?: number;
  /** The rate is paid only on a balance of at least this. */
  rateFrom?: Money;
  /** The rate is paid on the balance up to this, and nothing above it. */
  rateUpTo?: Money;
  /** Changes to the rate the bank has announced, from a date (YYYY-MM-DD) on. */
  changes?: readonly { from: string; rate: number }[];
  /** The months interest is paid in, where not every month: [2, 8] for February and August. */
  pays?: readonly number[];
  /**
   * A bonus rate on top, for a month that meets its condition: the balance
   * grew (by `growBy` at least, where given), or nothing was taken out.
   */
  bonus?: { rate: number; when: 'grows' | 'no_withdrawals'; growBy?: Money };
  /** Interest on it isn't taxed: France's Livret A. */
  taxFree?: boolean;
  /** The rate is SLATE's estimate, not the bank's published figure. */
  estimate?: boolean;
  source: string;
  asOf: string;
}

export interface Bank {
  id: string;
  name: string;
  /** ISO 3166 alpha-2, upper case. */
  iso: string;
  currency: string;
  format: NumberFormat;
  /** The bank's own code in the country's numbering: routing number, sort code prefix, BLZ, BSB prefix. */
  code: string;
  /** Iceland: the ledger codes a current and a savings account take. */
  currentLedger?: string;
  savingsLedger?: string;
  /** Korea: the account number's groups of digits, which differ by bank. */
  groups?: readonly number[];
  /** An IBAN country's IBAN, where it is another country's (French overseas, the Channel Islands). */
  ibanCountry?: string;
  /** A generic IBAN country's IBAN length. */
  ibanLength?: number;
  /** How sure the research was of the bank, where it said: high, medium or low. */
  confidence?: 'H' | 'M' | 'L';
  current: Product;
  savings: Product;
  /** How an overdraft works there, in a sentence, where it was found. */
  overdraft?: string;
}

export interface Guarantee {
  scheme: string;
  /** Per depositor, per bank, in the currency's hundredths, where it is one plain sum. */
  limit?: Money;
  currency?: string;
  /** The limit as the source put it, where it is more than a sum. */
  note?: string;
  source: string;
}

export interface CountryBanking {
  iso: string;
  banks: readonly Bank[];
  guarantee?: Guarantee;
  policy?: { name: string; rate: number; since: string; source: string };
  /**
   * Tax a bank takes off interest before paying it: a flat rate, above a
   * yearly allowance where there is one, or a rate by the saver's income.
   */
  interestTax?: {
    rate?: number;
    allowance?: Money;
    brackets?: readonly { upTo?: Money; rate: number }[];
    note: string;
    source: string;
  };
  /** How pay comes in and bills go out, in a line. */
  howMoneyMoves?: string;
}

export const BANKING: readonly CountryBanking[] = THIRTEEN;

const BY_ISO = new Map<string, CountryBanking>();
const BY_ID = new Map<string, Bank>();
export function addBanking(list: readonly CountryBanking[]): void {
  for (const country of list) {
    BY_ISO.set(country.iso, country);
    for (const bank of country.banks) BY_ID.set(bank.id, bank);
  }
}
addBanking(BANKING);
// Every other country, its banks by name, in its own money.
addBanking(worldBanking((iso) => COUNTRIES.all().find((c) => c.iso2?.toUpperCase() === iso)?.currency ?? 'USD'));

export function bankingIn(iso: string): CountryBanking | undefined {
  return BY_ISO.get(iso.toUpperCase());
}

export function banksIn(iso: string): readonly Bank[] {
  return bankingIn(iso)?.banks ?? [];
}

export function bankById(id: string): Bank | undefined {
  return BY_ID.get(id);
}
