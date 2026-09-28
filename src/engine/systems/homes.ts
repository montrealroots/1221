/**
 * SLATE — owning a home: fifty for sale in every town, bought with a
 * mortgage or cash, paid for every month, renovated for as long as it's
 * owned, and sold.
 *
 * Each town's fifty are drawn once a save, cheapest first, around the town's
 * typical value (`content/homes.ts`): a studio or a flat at the bottom, an
 * estate at the top, each with its rooms, its size, the year it was built,
 * what it has (a garage, a yard, a basement, a furnace or a heat pump, a
 * pool) and how old each of its parts is. Prices move with the town's market
 * from the figure's date, at its five years' pace.
 *
 * Buying is an offer accepted and a closing thirty days on, as it is: the
 * lender's approval is read on the offer, and the money on the day. A lender
 * asks what the country's lenders ask (SLATE's estimates by country, but for
 * two rules that are law or near it): a record of 620 and a debt-to-income
 * ratio of 43% in America, and in Britain and Ireland a loan within four and
 * a half and four times a year's income. Income is the last two years'
 * average, as a lender reads an actor's. Closing costs are SLATE's estimate
 * of a country's, but England's, which is its Stamp Duty Land Tax, bands and
 * first-time buyer's relief as they stand from April 2025.
 *
 * Owning costs the mortgage's principal and interest on the first, with the
 * property tax and the insurance in escrow beside it, as an American lender
 * collects them, and mortgage insurance while the loan is over 80% of what
 * the home cost, dropped at 78% as the Homeowners Protection Act has it. An
 * owner with no mortgage pays the property tax in two halves, in April and
 * October, and the insurance once a year. The property tax is the place's
 * rate (`content/tax.ts`) on the home's value, or, where the place caps how
 * fast an assessment may grow, as California's Proposition 13 does, on what
 * it cost grown at the cap.
 *
 * A payment that can't be made is owed, taken the first day the bank can pay
 * it. Fifteen days late costs the lender's fee, 5% of the principal and
 * interest; thirty days late is on the record. At 120 days the lender begins
 * foreclosure, as federal rules let it, and at 210 the home is sold: at a
 * forced sale's discount, the loan and what's owed paid from it, anything
 * left theirs, anything short with collections, and they're on a friend's
 * sofa.
 *
 * A renovation is paid when the work starts and done when it ends, and what
 * it adds to the home's value is its return at sale (SLATE's estimates) on a
 * part as worn as the one it replaces: a roof on a twenty-five-year-old roof
 * returns in full, on a two-year-old one next to nothing. Work that adds
 * something (a room, a bath, a deck, a pool) changes what else can be done:
 * a deck built can be rebuilt when it wears, a garage converted has no door
 * to replace. There's no end to it: every part wears, and every part can be
 * done again.
 *
 * Selling is listing it: the sale closes forty-five days on, at the value
 * then, less the agents' and the closing costs, the loan paid off, and they
 * move into a rented home in the same town.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, formatDate, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { exchange } from '../content/currency';
import { propertyTaxRate, PROPERTY_TAX_RULES, resolveRule } from '../content/tax';
import {
  FEATURE_LABEL, LIFESPAN, METAL_ROOF_LIFESPAN, OVERBUILT_AT, OVERBUILT_RECOUP, PROJECTS, SQM_PER_SQFT,
  addressOf, homeValueAt, streetsOf, usesFeet, type Feature, type HomeType, type HomeValue, type Part, type Project,
} from '../content/homes';
import { drawFromBank, inTheBank, move, moveRefusal, scheduleRentFor, type Housing } from './household';
import { earningsOf } from './earnings';

// ---------------------------------------------------------------------------
// Terms by country: SLATE's estimates, but where the header says otherwise

export interface LendingTerms {
  /** A 30-year fixed rate in America; the usual fixed or long-term rate elsewhere. */
  rate: number;
  years: number;
  /** The smallest down payment a lender takes, of the price. */
  minDown: number;
  /** A buyer's closing costs and a seller's, of the price. */
  closing: number;
  selling: number;
}

const TERMS: Readonly<Record<string, LendingTerms>> = {
  us: { rate: 0.0625, years: 30, minDown: 0.05, closing: 0.03, selling: 0.055 },
  uk: { rate: 0.046, years: 25, minDown: 0.05, closing: 0.01, selling: 0.02 },
  ie: { rate: 0.04, years: 30, minDown: 0.1, closing: 0.03, selling: 0.02 },
  ca: { rate: 0.046, years: 25, minDown: 0.05, closing: 0.02, selling: 0.05 },
  au: { rate: 0.06, years: 30, minDown: 0.05, closing: 0.045, selling: 0.025 },
  nz: { rate: 0.055, years: 30, minDown: 0.2, closing: 0.01, selling: 0.03 },
  de: { rate: 0.037, years: 25, minDown: 0.2, closing: 0.1, selling: 0.03 },
  fr: { rate: 0.033, years: 25, minDown: 0.1, closing: 0.08, selling: 0.05 },
  es: { rate: 0.03, years: 25, minDown: 0.2, closing: 0.1, selling: 0.04 },
  it: { rate: 0.034, years: 25, minDown: 0.2, closing: 0.09, selling: 0.04 },
  nl: { rate: 0.039, years: 30, minDown: 0.05, closing: 0.05, selling: 0.015 },
  jp: { rate: 0.019, years: 35, minDown: 0.1, closing: 0.07, selling: 0.04 },
  kr: { rate: 0.042, years: 30, minDown: 0.3, closing: 0.05, selling: 0.01 },
  is: { rate: 0.085, years: 40, minDown: 0.15, closing: 0.01, selling: 0.02 },
  mx: { rate: 0.11, years: 20, minDown: 0.1, closing: 0.06, selling: 0.05 },
  br: { rate: 0.115, years: 30, minDown: 0.2, closing: 0.04, selling: 0.06 },
};
const TERMS_DEFAULT: LendingTerms = { rate: 0.06, years: 25, minDown: 0.2, closing: 0.05, selling: 0.05 };

export const termsIn = (countryId: string): LendingTerms => TERMS[countryId] ?? TERMS_DEFAULT;

export const HOME = {
  /** An American lender's floor on the record, and its ceiling on debts over income. */
  minScore: 620,
  maxDebtToIncome: 0.43,
  /** A loan's ceiling over a year's income in Britain and in Ireland. */
  incomeMultiple: { uk: 4.5, ie: 4 } as Readonly<Record<string, number>>,
  /** Months of income a lender averages. */
  incomeMonths: 24,
  /** What the card and other loans are taken to cost a month, of what's owed on them: SLATE's estimate. */
  debtPayment: 0.03,
  /** A rate's rise for a record under these: SLATE's estimate of American pricing by score. */
  scoreBands: [{ from: 760, add: 0 }, { from: 700, add: 0.0025 }, { from: 660, add: 0.005 }, { from: 0, add: 0.01 }] as const,
  closingDays: 30,
  saleDays: 45,
  /** Mortgage insurance, a year, of the loan, while it's over 80% of the price; dropped at 78%. */
  pmi: 0.005,
  pmiOver: 0.8,
  pmiEnds: 0.78,
  /** Insurance, a year, of the value: SLATE's estimate, a flat's owner insuring only the inside. */
  insurance: 0.005,
  insuranceFlat: 0.002,
  /** The fee fifteen days late, of the principal and interest; the record's fall thirty days late. */
  graceDays: 15,
  lateFee: 0.05,
  reportDays: 30,
  reportedFall: 70,
  foreclosureStarts: 120,
  foreclosureSale: 210,
  forcedSale: 0.85,
  foreclosureFall: 120,
  /** A flat's or a house's shared charges a month, in dollars at an American cost of living: SLATE's estimates. */
  hoaPerSqft: 0.45,
  hoaTownhouse: 250,
};

// ---------------------------------------------------------------------------
// The fifty for sale

export interface HomeFacts {
  type: HomeType;
  address: string;
  beds: number;
  /** In halves: 1.5 is a full bath and a half. */
  baths: number;
  /** Square feet, shown in square meters outside America. */
  size: number;
  /** The lot, square feet, for a house; none for a flat. */
  lot?: number;
  built: number;
  features: Feature[];
  /** The year each part was last put in new. */
  parts: Partial<Record<Part, number>>;
  /** Shared charges a month, in dollars at the town's cost of living a hundred. */
  hoaUsd: number;
}

export interface Listing extends HomeFacts {
  id: string;
  cityId: string;
  /** 1 is the cheapest. */
  rank: number;
  /** In the save's currency, at the figure's date. */
  value: Money;
}

/** The inverse of the standard normal's distribution, near enough (Acklam's approximation). */
function normalAt(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155211639];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const tail = (t: number) => (((((c[0]! * t + c[1]!) * t + c[2]!) * t + c[3]!) * t + c[4]!) * t + c[5]!) / ((((d[0]! * t + d[1]!) * t + d[2]!) * t + d[3]!) * t + 1);
  if (p < 0.02425) return tail(Math.sqrt(-2 * Math.log(p)));
  if (p > 1 - 0.02425) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q / (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
}

/**
 * How widely prices spread about the typical home: SLATE's estimate, a
 * log-normal's spread, wider above than below, since a town's dearest homes
 * run further from its typical one than its cheapest do.
 */
const SPREAD = { below: 0.5, above: 0.7 };
export const LISTINGS = 50;
/** The year the figures are for, which parts' ages are counted from. */
const DATA_YEAR = 2026;

const cache = new WeakMap<Simulation, Map<string, Listing[]>>();

/** The fifty homes for sale in a town, cheapest first. */
export function listingsIn(sim: Simulation, cityId: string): Listing[] {
  let bySim = cache.get(sim);
  if (!bySim) { bySim = new Map(); cache.set(sim, bySim); }
  const known = bySim.get(cityId);
  if (known) return known;
  const made = drawListings(sim, cityId, homeValueAt(cityId, saveCurrency(sim.universe)));
  bySim.set(cityId, made);
  return made;
}

function drawListings(sim: Simulation, cityId: string, typical: HomeValue): Listing[] {
  const city = CITIES.require(cityId);
  const country = city.countryId;
  const rng = sim.rng('homes.listings', cityId);
  const dense = city.population >= 500_000 || city.kind === 'section';
  const cold = Math.abs(city.latitude) > 36;
  const warm = Math.abs(city.latitude) < 35;
  const streets = streetsOf(country);
  const used = new Set<string>();
  const out: Listing[] = [];
  for (let i = 0; i < LISTINGS; i++) {
    const q = (i + 0.5) / LISTINGS;
    const z = normalAt(q) + rng.float(-0.04, 0.04);
    const value = Math.round(typical.value * Math.exp(z * (z < 0 ? SPREAD.below : SPREAD.above)));
    const at = Math.min(0.999, Math.max(0, q + rng.float(-0.06, 0.06)));
    const type: HomeType = dense
      ? (at < 0.12 ? 'studio' : at < 0.55 ? 'condo' : at < 0.75 ? 'townhouse' : at < 0.95 ? 'house' : 'estate')
      : (at < 0.04 ? 'studio' : at < 0.2 ? 'condo' : at < 0.35 ? 'townhouse' : at < 0.93 ? 'house' : 'estate');
    const beds = type === 'studio' ? 0
      : type === 'condo' ? (rng.next() < 0.7 - q * 0.5 ? 1 : rng.next() < 0.8 ? 2 : 3)
      : type === 'townhouse' ? rng.int(2, 3)
      : type === 'house' ? Math.min(5, 2 + Math.floor(q * 2.5 + rng.next()))
      : rng.int(4, 7);
    const baths = type === 'studio' ? 1
      : type === 'condo' ? (beds === 1 ? 1 : rng.pick([1.5, 2, 2]))
      : type === 'townhouse' ? rng.pick([1.5, 2, 2.5])
      : type === 'house' ? Math.max(1, beds - 1) + (rng.next() < 0.5 ? 0.5 : 0)
      : beds + rng.pick([-0.5, 0.5, 1.5]);
    const size = Math.round((type === 'studio' ? rng.int(350, 550)
      : type === 'condo' ? 450 + 330 * beds + rng.int(-80, 150)
      : type === 'townhouse' ? 900 + 300 * beds + rng.int(-100, 250)
      : type === 'house' ? 700 + 420 * beds + rng.int(-150, 400) + q * 500
      : 2_200 + 650 * beds + rng.int(0, 1_500)) / 10) * 10;
    const flat = type === 'studio' || type === 'condo';
    const lot = flat ? undefined : Math.round((type === 'townhouse' ? rng.int(1_200, 2_500)
      : type === 'house' ? (dense ? rng.int(2_500, 6_000) : rng.int(5_000, 15_000))
      : rng.int(12_000, 80_000)) / 100) * 100;
    const built = type === 'estate' ? rng.int(1920, 2024) : rng.int(1900, 2025);
    const features: Feature[] = [];
    if (!flat) {
      if (type === 'estate' || rng.next() < (type === 'townhouse' ? 0.5 : dense ? 0.35 : 0.65)) features.push('garage');
      if (type !== 'townhouse' || rng.next() < 0.7) features.push('yard');
      const basements = (country === 'us' || country === 'ca') && cold ? 0.7 : 0.1;
      if (rng.next() < basements) features.push(rng.next() < 0.5 ? 'basement' : 'finishedBasement');
      if (type !== 'townhouse' && built < 1960 && rng.next() < 0.5) features.push('attic');
      features.push(cold && rng.next() < 0.7 ? 'furnace' : 'heatPump');
      if (features.includes('yard') && rng.next() < 0.4) features.push('deck');
      if (type !== 'townhouse' && rng.next() < (type === 'estate' ? 0.6 : 0.15)) features.push('patio');
      if (type !== 'townhouse' && rng.next() < (type === 'estate' ? 0.7 : warm ? 0.25 : 0.05)) features.push('pool');
      if (type !== 'townhouse' && rng.next() < 0.08) features.push('solar');
      if (type === 'estate' && rng.next() < 0.3) features.push('generator');
      if (rng.next() < 0.05) features.push('metalRoof');
      if (type === 'estate' && rng.next() < 0.4) features.push('stone');
    }
    const partsHere: Part[] = ['kitchen', 'bath', 'floors', 'paint', 'hvac'];
    if (!flat) partsHere.push('roof', 'windows', 'door');
    if (type === 'house' || type === 'estate') partsHere.push('siding');
    if (features.includes('garage')) partsHere.push('garageDoor');
    if (features.includes('deck')) partsHere.push('deck');
    if (features.includes('solar')) partsHere.push('solar');
    if (features.includes('pool')) partsHere.push('pool');
    const parts: Partial<Record<Part, number>> = {};
    for (const part of partsHere) {
      const life = part === 'roof' && features.includes('metalRoof') ? METAL_ROOF_LIFESPAN : LIFESPAN[part];
      parts[part] = Math.max(built, DATA_YEAR - Math.floor(rng.next() * life * (1.3 - 0.7 * q)));
    }
    const hoaUsd = flat ? Math.round(size * HOME.hoaPerSqft)
      : type === 'townhouse' ? (rng.next() < 0.5 ? HOME.hoaTownhouse : 0)
      : rng.next() < 0.15 ? 80 : 0;
    let address = '';
    for (let tries = 0; tries < 20 && (!address || used.has(address)); tries++) {
      const street = rng.pick(streets);
      const number = country === 'us' ? (flat ? rng.int(1, 999) : rng.int(100, 9_899)) : rng.int(1, flat ? 400 : 250);
      const unit = flat ? (country === 'us' || country === 'ca' ? `${rng.int(1, 30)}${'ABCDEF'[rng.int(0, 5)]}` : String(rng.int(1, 60))) : undefined;
      address = addressOf(country, street, number, unit, [rng.int(1, 7), rng.int(1, 30), rng.int(1, 25)]);
    }
    used.add(address);
    out.push({ id: `${cityId}~${i + 1}`, cityId, rank: i + 1, value, type, address, beds, baths, size, ...(lot !== undefined ? { lot } : {}), built, features, parts, hoaUsd });
  }
  return out.sort((x, y) => x.value - y.value).map((one, n) => ({ ...one, rank: n + 1, id: `${cityId}~${n + 1}` }));
}

export function listingById(sim: Simulation, id: string): Listing | undefined {
  const cityId = id.split('~')[0]!;
  return CITIES.get(cityId) ? listingsIn(sim, cityId).find((one) => one.id === id) : undefined;
}

// ---------------------------------------------------------------------------
// The market, and what a home is worth

const YEAR_MS = 365.25 * MS_DAY;

/** How far the town's market has moved from the figure's date to a moment. */
export function marketAt(cityId: string, currency: string, at: Instant): number {
  const typical = homeValueAt(cityId, currency);
  return Math.pow(1 + typical.growth, (at - typical.asOf) / YEAR_MS);
}

/** A listing's asking price now. */
export function askingPrice(sim: Simulation, listing: Listing, at = sim.now): Money {
  return Math.round(listing.value * marketAt(listing.cityId, saveCurrency(sim.universe), at) / 100) * 100;
}

/** A US or metric size, for the screens. */
export function sizeText(sqft: number, countryId: string): string {
  return usesFeet(countryId) ? `${sqft.toLocaleString('en-US')} sq ft` : `${Math.round(sqft * SQM_PER_SQFT).toLocaleString('en-US')} m²`;
}

export interface Improvement { projectId: string; at: Instant; value: Money }

export interface Works { projectId: string; startedAt: Instant; doneAt: Instant; cost: Money }

/** A payment falling due: a mortgage's, a half of the tax, a year's insurance, a month's shared charges. */
export interface Installment {
  kind: 'mortgage' | 'tax' | 'insurance' | 'hoa';
  dueAt: Instant;
  /** Principal and interest, for a mortgage's; the whole, for the rest. */
  amount: Money;
  /** A mortgage's escrow beside it: the tax, the insurance and the mortgage insurance. */
  escrow?: { tax: Money; insurance: Money; pmi: Money };
  feeCharged?: boolean;
  reported?: boolean;
}

export interface Mortgage {
  accountId: string;
  rate: number;
  months: number;
  /** Principal and interest a month. */
  payment: Money;
  original: Money;
  pmi: boolean;
}

export interface OwnedHome {
  listingId: string;
  cityId: string;
  facts: HomeFacts;
  boughtAt: Instant;
  price: Money;
  mortgage?: Mortgage;
  improvements: Improvement[];
  works: Works[];
  /** Payments due and not yet made, oldest first. */
  owed: Installment[];
  /** The last month billed, `YYYY-MM`. */
  billedThrough: string;
  foreclosureAt?: Instant;
  /** Listed for sale: the day it closes, and the rented home they move into. */
  selling?: { closesAt: Instant; then: Housing };
}

export interface Purchase {
  listingId: string;
  price: Money;
  /** Of the price: 1 is cash. */
  down: number;
  closesAt: Instant;
}

/** What their home is worth now: what it cost, and what the work added, each moved with the market since. */
export function homeValue(sim: Simulation, owned: OwnedHome, at = sim.now): Money {
  const cur = saveCurrency(sim.universe);
  const now = marketAt(owned.cityId, cur, at);
  const grown = (v: Money, from: Instant) => v * now / marketAt(owned.cityId, cur, from);
  return Math.round(grown(owned.price, owned.boughtAt) + owned.improvements.reduce((sum, one) => sum + grown(one.value, one.at), 0));
}

const mortgageAccount = (sim: Simulation, owned: OwnedHome): Account | undefined =>
  owned.mortgage ? sim.universe.accounts[owned.mortgage.accountId] : undefined;

/** What's left on the loan. */
export function loanBalance(sim: Simulation, owned: OwnedHome): Money {
  return Math.max(0, -(mortgageAccount(sim, owned)?.balance ?? 0));
}

/** Of the home's value, theirs. */
export function equityOf(sim: Simulation, person: Person): Money {
  const owned = person.owned;
  return owned ? homeValue(sim, owned) - loanBalance(sim, owned) : 0;
}

// ---------------------------------------------------------------------------
// What owning costs

const yearIn = (sim: Simulation, cityId: string, at = sim.now): number => zonedParts(at, CITIES.require(cityId).timeZone).year;

/** What an amount in dollars at an American cost of living a hundred is in a town, in the save's money. */
export function atTown(sim: Simulation, cityId: string, usd: number): Money {
  const city = CITIES.require(cityId);
  const cur = saveCurrency(sim.universe);
  const cents = Math.round(usd * 100 * city.costOfLivingIndex / 100);
  return Math.round((exchange(cents, 'USD', cur) ?? cents) / 100) * 100;
}

/** The value the property tax is on: the market's, or what it cost grown at the place's cap. */
export function assessedValue(sim: Simulation, owned: OwnedHome): Money {
  const market = homeValue(sim, owned);
  const cap = resolveRule(PROPERTY_TAX_RULES, owned.cityId, sim.now)?.assessmentGrowthCap;
  if (cap === undefined) return market;
  const years = Math.max(0, yearIn(sim, owned.cityId) - yearIn(sim, owned.cityId, owned.boughtAt));
  const base = owned.price + owned.improvements.reduce((sum, one) => sum + one.value, 0);
  return Math.min(market, Math.round(base * Math.pow(1 + cap, years)));
}

export interface OwnerMonth {
  mortgage: Money;
  tax: Money;
  insurance: Money;
  pmi: Money;
  hoa: Money;
  total: Money;
}

/** What a home costs a month, averaged: what the screens show and the lender weighs. */
export function monthOf(sim: Simulation, facts: HomeFacts, cityId: string, value: Money, mortgage?: Pick<Mortgage, 'payment' | 'pmi'> & { balance: Money }, assessed = value): OwnerMonth {
  const tax = Math.round(assessed * propertyTaxRate(cityId, sim.now) / 12);
  const flat = facts.type === 'studio' || facts.type === 'condo';
  const insurance = Math.round(value * (flat ? HOME.insuranceFlat : HOME.insurance) / 12);
  const pmi = mortgage?.pmi ? Math.round(mortgage.balance * HOME.pmi / 12) : 0;
  const hoa = atTown(sim, cityId, facts.hoaUsd);
  const pay = mortgage?.payment ?? 0;
  return { mortgage: pay, tax, insurance, pmi, hoa, total: pay + tax + insurance + pmi + hoa };
}

/** A loan's payment a month, principal and interest. */
export function paymentFor(loan: Money, rate: number, months: number): Money {
  const r = rate / 12;
  return Math.round(r === 0 ? loan / months : loan * r / (1 - Math.pow(1 + r, -months)));
}

/** The rate a lender here offers this record. */
export function rateFor(person: Person, countryId: string): number {
  const base = termsIn(countryId).rate;
  if (countryId !== 'us') return base;
  const score = person.credit?.score ?? 650;
  return base + HOME.scoreBands.find((band) => score >= band.from)!.add;
}

/**
 * What a buyer pays to close: SLATE's estimate of the country's, or in
 * England and Northern Ireland the Stamp Duty Land Tax on it, with the
 * first-time buyer's relief to £300,000 on a home of up to £500,000, and 1%
 * besides for the conveyancing and the survey.
 */
export function closingCost(sim: Simulation, cityId: string, price: Money, firstHome: boolean): Money {
  const city = CITIES.require(cityId);
  if (city.parentId === 'uk-eng' || city.parentId === 'uk-nir') {
    const cur = saveCurrency(sim.universe);
    const gbp = (exchange(price, cur, 'GBP') ?? price) / 100;
    const bands: [number, number][] = firstHome && gbp <= 500_000 ? [[300_000, 0], [500_000, 0.05]]
      : [[125_000, 0], [250_000, 0.02], [925_000, 0.05], [1_500_000, 0.1], [Number.POSITIVE_INFINITY, 0.12]];
    let tax = 0;
    let from = 0;
    for (const [to, rate] of bands) { if (gbp > from) tax += (Math.min(gbp, to) - from) * rate; from = to; }
    return Math.round(exchange(Math.round(tax * 100), 'GBP', cur) ?? tax * 100) + Math.round(price * 0.01);
  }
  return Math.round(price * termsIn(city.countryId).closing);
}

/** What a lender takes a month's income to be: the last two years' average. */
export function monthlyIncome(sim: Simulation, person: Person): Money {
  const months = earningsOf(person).months;
  const p = zonedParts(sim.now, sim.homeZone);
  let sum = 0;
  for (let n = 1; n <= HOME.incomeMonths; n++) {
    const m = ((p.month - 1 - n) % 12 + 12) % 12 + 1;
    const y = p.year + Math.floor((p.month - 1 - n) / 12);
    sum += months[`${y}-${String(m).padStart(2, '0')}`] ?? 0;
  }
  return Math.round(sum / HOME.incomeMonths);
}

/** What their other debts are taken to cost a month. */
function otherDebts(sim: Simulation, person: Person): Money {
  return Object.values(sim.universe.accounts)
    .filter((a) => a.ownerId === person.id && !a.nominal && !a.closedAt && (a.kind === 'credit_card' || a.kind === 'loan') && a.balance < 0)
    .reduce((sum, a) => sum + Math.round(-a.balance * HOME.debtPayment), 0);
}

export interface Offer {
  price: Money;
  down: Money;
  loan: Money;
  closing: Money;
  rate: number;
  payment: Money;
  month: OwnerMonth;
  /** What the bank must hold on the day: the down payment and the closing costs. */
  cash: Money;
}

/** An offer on a home at a down payment: what it costs and what it costs a month. */
export function offerFor(sim: Simulation, person: Person, listing: Listing, down: number): Offer {
  const country = CITIES.require(listing.cityId).countryId;
  const price = askingPrice(sim, listing);
  const downCash = Math.round(price * Math.min(1, down));
  const loan = price - downCash;
  const rate = rateFor(person, country);
  const months = termsIn(country).years * 12;
  const payment = loan > 0 ? paymentFor(loan, rate, months) : 0;
  const pmi = country === 'us' && loan > price * HOME.pmiOver;
  const closing = closingCost(sim, listing.cityId, price, !person.owned && !(person.homesOwned ?? 0));
  const month = monthOf(sim, listing, listing.cityId, price, loan > 0 ? { payment, pmi, balance: loan } : undefined);
  return { price, down: downCash, loan, closing, rate, payment, month, cash: downCash + closing };
}

/** The down payments a lender here takes, the country's least first, and cash. */
export function downChoices(countryId: string): number[] {
  const min = termsIn(countryId).minDown;
  return [...new Set([min, 0.1, 0.2].filter((d) => d >= min)), 1];
}

/** Why an offer on a home at a down payment can't be made, or nothing where it can. */
export function buyRefusal(sim: Simulation, person: Person, listingId: string, down: number): string | undefined {
  const listing = listingById(sim, listingId);
  if (!listing) return 'That home isn’t for sale.';
  const where = person.home?.cityId ?? person.currentLocationId;
  if (listing.cityId !== where) return 'You buy where you live.';
  if (person.owned) return 'You own a home already: sell it first.';
  if (person.buying) return 'You have an offer accepted already.';
  if (person.home?.noticeUntil !== undefined) return 'There’s a notice to pay or quit on your home: a lender won’t lend over it.';
  const country = CITIES.require(listing.cityId).countryId;
  if (!downChoices(country).includes(down)) return 'A lender here doesn’t take that down payment.';
  const cur = saveCurrency(sim.universe);
  const offer = offerFor(sim, person, listing, down);
  if (inTheBank(sim, person) < offer.cash) return `It takes ${formatMoney(offer.cash, cur, { cents: false })} on the day, the down payment and the closing costs.`;
  if (offer.loan === 0) return undefined;
  if ((person.credit?.score ?? 650) < HOME.minScore) return 'A lender asks for a better credit record than yours.';
  const income = monthlyIncome(sim, person);
  const multiple = HOME.incomeMultiple[country];
  if (multiple !== undefined) {
    if (offer.loan > income * 12 * multiple) return `A lender here lends up to ${multiple} times a year’s income, and yours has averaged ${formatMoney(income * 12, cur, { cents: false })} a year over two years.`;
  } else if (income <= 0 || (offer.month.total + otherDebts(sim, person)) / income > HOME.maxDebtToIncome) {
    return `A lender keeps what you owe each month under ${Math.round(HOME.maxDebtToIncome * 100)}% of your income, and yours has averaged ${formatMoney(income, cur, { cents: false })} a month over two years.`;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Renovations

/** A part's age in years, in their home. */
export function partAge(sim: Simulation, owned: OwnedHome, part: Part): number | undefined {
  const year = owned.facts.parts[part];
  return year === undefined ? undefined : Math.max(0, yearIn(sim, owned.cityId) - year);
}

export function lifeOf(facts: HomeFacts, part: Part): number {
  return part === 'roof' && facts.features.includes('metalRoof') ? METAL_ROOF_LIFESPAN : LIFESPAN[part];
}

/** Why a project can't be done to their home, or nothing where it can. */
export function projectRefusal(sim: Simulation, person: Person, project: Project): string | undefined {
  const owned = person.owned;
  if (!owned) return 'You don’t own a home.';
  const f = owned.facts;
  if (owned.selling) return 'It’s listed for sale.';
  if (!project.on.includes(f.type)) return 'Not on a home of this kind.';
  for (const need of project.needs ?? []) if (!f.features.includes(need)) return `It needs a ${FEATURE_LABEL[need].toLowerCase()}.`;
  for (const lack of project.lacks ?? []) if (f.features.includes(lack)) return `It has a ${FEATURE_LABEL[lack].toLowerCase()} already.`;
  if (project.lot !== undefined && (f.lot ?? 0) < project.lot) return 'The lot isn’t big enough.';
  if (project.bathsUpTo === 'bedsPlusOne' && f.baths >= Math.max(1, f.beds) + 1) return 'It has baths enough for its bedrooms.';
  if (project.bedsUpTo !== undefined && f.beds >= project.bedsUpTo) return 'It has bedrooms enough.';
  if (project.renews && f.parts[project.renews] === undefined) return 'It has none to replace.';
  const busy = owned.works.find((w) => {
    const other = PROJECTS.find((p) => p.id === w.projectId);
    return other && (other.id === project.id || (project.renews !== undefined && other.renews === project.renews));
  });
  if (busy) return 'That work is under way.';
  const cost = projectCost(sim, owned, project);
  if (inTheBank(sim, person) < cost) return `It costs ${formatMoney(cost, saveCurrency(sim.universe), { cents: false })}, paid when the work starts.`;
  return undefined;
}

/** What a project costs on their home: the job, by the size where it's done by the foot, at the town's cost of living. */
export function projectCost(sim: Simulation, owned: OwnedHome, project: Project): Money {
  const scale = project.perSize ? Math.max(0.5, owned.facts.size / project.perSize) : 1;
  return atTown(sim, owned.cityId, project.usd * scale);
}

/** What a project would add to the value: its return, on a part as worn as the one it replaces, and half past the street's. */
export function projectAdds(sim: Simulation, owned: OwnedHome, project: Project): Money {
  const cost = projectCost(sim, owned, project);
  const wear = project.renews ? Math.min(1, (partAge(sim, owned, project.renews) ?? 0) / lifeOf(owned.facts, project.renews)) : 1;
  const added = owned.improvements.reduce((sum, one) => sum + one.value, 0);
  const past = added >= owned.price * OVERBUILT_AT ? OVERBUILT_RECOUP : 1;
  return Math.round(cost * project.recoup * wear * past);
}

/** The projects their home can take now, and the ones it can't, with why. */
export function projectsFor(sim: Simulation, person: Person): { project: Project; cost: Money; adds: Money; refusal?: string }[] {
  const owned = person.owned;
  if (!owned) return [];
  return PROJECTS
    .filter((p) => p.on.includes(owned.facts.type))
    .map((project) => {
      const refusal = projectRefusal(sim, person, project);
      return { project, cost: projectCost(sim, owned, project), adds: projectAdds(sim, owned, project), ...(refusal ? { refusal } : {}) };
    });
}

function finishWorks(sim: Simulation, person: Person, works: Works): void {
  const owned = person.owned;
  if (!owned) return;
  owned.works = owned.works.filter((w) => w !== works);
  const project = PROJECTS.find((p) => p.id === works.projectId);
  if (!project) return;
  const adds = projectAdds(sim, owned, project);
  const f = owned.facts;
  const year = yearIn(sim, owned.cityId);
  if (project.renews) f.parts[project.renews] = year;
  const a = project.adds;
  if (a) {
    f.features = f.features.filter((one) => !(a.drops ?? []).includes(one));
    for (const one of a.features ?? []) if (!f.features.includes(one)) f.features.push(one);
    f.beds += a.beds ?? 0;
    f.baths += a.baths ?? 0;
    f.size += a.size ?? 0;
    // What it adds starts new: a deck, a pool, solar panels, a garage gone.
    for (const [feature, part] of [['deck', 'deck'], ['solar', 'solar'], ['pool', 'pool']] as const) if ((a.features ?? []).includes(feature)) f.parts[part] = year;
    if ((a.drops ?? []).includes('garage')) delete f.parts.garageDoor;
    if (a.features?.includes('heatPump')) f.parts.hvac = year;
  }
  owned.improvements.push({ projectId: project.id, at: sim.now, value: adds });
  if (person.id === sim.universe.playerId) {
    sim.notify({ category: 'home', title: 'The Work Is Done', body: `${project.label}: finished, and ${formatMoney(adds, saveCurrency(sim.universe), { cents: false })} on what the home is worth.`, importance: 60, route: '/workspace/homes' });
  }
}

// ---------------------------------------------------------------------------
// Buying, paying, selling

const CLOSING_KIND = 'home.closing';
const SALE_KIND = 'home.sale_closes';
const WORKS_KIND = 'home.works_done';

const monthKey = (sim: Simulation, cityId: string, at = sim.now) => {
  const p = zonedParts(at, CITIES.require(cityId).timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}`;
};

function close(sim: Simulation, person: Person): void {
  const buying = person.buying;
  if (!buying) return;
  delete person.buying;
  const listing = listingById(sim, buying.listingId);
  const refusal = listing ? buyRefusal(sim, person, buying.listingId, buying.down) : 'gone';
  const cur = saveCurrency(sim.universe);
  if (!listing || refusal) {
    if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'The Purchase Fell Through', body: refusal ?? 'The home is gone.', importance: 85, route: '/workspace/homes' });
    return;
  }
  const offer = offerFor(sim, person, listing, buying.down);
  const price = buying.price;
  const downCash = Math.round(price * Math.min(1, buying.down));
  const loan = price - downCash;
  const closing = closingCost(sim, listing.cityId, price, !(person.homesOwned ?? 0));
  const draw = drawFromBank(sim, person, downCash + closing, false, true);
  if (draw.short > 0) {
    if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'The Purchase Fell Through', body: `The bank didn’t hold the ${formatMoney(downCash + closing, cur, { cents: false })} it takes to close.`, importance: 85, route: '/workspace/homes' });
    return;
  }
  const country = CITIES.require(listing.cityId).countryId;
  let mortgage: Mortgage | undefined;
  const postings = [...draw.postings, { accountId: sim.nominalAccount('expense', 'Closing Costs').id, amount: closing }];
  if (loan > 0) {
    const account = sim.openAccount({
      id: sim.nextId('account'), kind: 'mortgage', name: 'Mortgage', ownerId: person.id,
      institution: 'Your Lender', openedAt: sim.now, category: 'mortgage', apr: offer.rate,
    });
    mortgage = { accountId: account.id, rate: offer.rate, months: termsIn(country).years * 12, payment: paymentFor(loan, offer.rate, termsIn(country).years * 12), original: price, pmi: country === 'us' && loan > price * HOME.pmiOver };
    postings.push({ accountId: account.id, amount: -loan });
  }
  // The home itself leaves the ledger at its price: the seller's, paid.
  postings.push({ accountId: sim.nominalAccount('asset_value', 'Homes Bought').id, amount: price });
  sim.post({ memo: `Bought ${listing.address}`, category: 'home', postings });
  // The lease ends: the deposit back, less what's owed on it.
  const { lease } = leaseEnds(sim, person);
  const cityId = listing.cityId;
  const facts: HomeFacts = structuredClone({
    type: listing.type, address: listing.address, beds: listing.beds, baths: listing.baths, size: listing.size,
    ...(listing.lot !== undefined ? { lot: listing.lot } : {}), built: listing.built, features: listing.features, parts: listing.parts, hoaUsd: listing.hoaUsd,
  });
  person.owned = {
    listingId: listing.id, cityId, facts, boughtAt: sim.now, price,
    ...(mortgage ? { mortgage } : {}), improvements: [], works: [], owed: [], billedThrough: monthKey(sim, cityId),
  };
  // Without a lender, the first year's insurance is bought at closing.
  if (!mortgage) person.owned.owed.push({ kind: 'insurance', dueAt: sim.now, amount: monthOf(sim, facts, cityId, price).insurance * 12 });
  person.homesOwned = (person.homesOwned ?? 0) + 1;
  person.home = { kind: 'owned', cityId, since: sim.now, ...(person.home?.fedOn !== undefined ? { fedOn: person.home.fedOn } : {}) };
  scheduleRentFor(sim, person);
  if (person.id === sim.universe.playerId) {
    sim.notify({ category: 'home', title: 'The Keys Are Yours', body: `You closed on ${listing.address}: ${formatMoney(price, cur, { cents: false })}${loan > 0 ? `, ${formatMoney(loan, cur, { cents: false })} of it on a mortgage at ${(offer.rate * 100).toFixed(2)}%` : ', in cash'}.${lease > 0 ? ` Your deposit came back: ${formatMoney(lease, cur, { cents: false })}.` : ''}`, importance: 85, route: '/workspace/homes' });
  }
}

/** Ends a lease: the deposit back, less what's owed. */
function leaseEnds(sim: Simulation, person: Person): { lease: Money } {
  const held = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.kind === 'escrow' && a.category === 'deposit' && !a.closedAt && a.balance > 0);
  const checking = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
  if (!held || !checking) return { lease: 0 };
  const owed = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.kind === 'loan' && a.category === 'arrears' && a.balance < 0);
  const against = Math.min(held.balance, owed ? -owed.balance : 0);
  const back = held.balance - against;
  const postings = [{ accountId: held.id, amount: -held.balance }, { accountId: checking.id, amount: back }];
  if (against > 0) postings.push({ accountId: owed!.id, amount: against });
  sim.post({ memo: 'Deposit back', category: 'rent', postings });
  return { lease: back };
}

/** Bills the month's payments on the first, and the year's where they fall. */
function bill(sim: Simulation, person: Person): void {
  const owned = person.owned;
  if (!owned) return;
  const key = monthKey(sim, owned.cityId);
  if (key <= owned.billedThrough) return;
  owned.billedThrough = key;
  const value = homeValue(sim, owned);
  const month = monthOf(sim, owned.facts, owned.cityId, value, owned.mortgage ? { payment: owned.mortgage.payment, pmi: owned.mortgage.pmi, balance: loanBalance(sim, owned) } : undefined, assessedValue(sim, owned));
  const due = sim.now;
  if (owned.mortgage && loanBalance(sim, owned) > 0) {
    owned.owed.push({ kind: 'mortgage', dueAt: due, amount: Math.min(owned.mortgage.payment, loanBalance(sim, owned) + Math.round(loanBalance(sim, owned) * owned.mortgage.rate / 12)), escrow: { tax: month.tax, insurance: month.insurance, pmi: month.pmi } });
  } else {
    // No lender to escrow them: the tax in halves, April and October, and the insurance a year at a time.
    const m = Number(key.slice(5));
    if (m === 4 || m === 10) owned.owed.push({ kind: 'tax', dueAt: due, amount: month.tax * 6 });
    if (m === zonedParts(owned.boughtAt, CITIES.require(owned.cityId).timeZone).month) owned.owed.push({ kind: 'insurance', dueAt: due, amount: month.insurance * 12 });
  }
  if (month.hoa > 0) owned.owed.push({ kind: 'hoa', dueAt: due, amount: month.hoa });
}

const EXPENSE: Record<Installment['kind'], string> = { mortgage: 'Mortgage Interest', tax: 'Property Tax', insurance: 'Home Insurance', hoa: 'Shared Charges' };

/** Pays what's owed, oldest first, while the bank can pay each in full. */
function payOwed(sim: Simulation, person: Person): void {
  const owned = person.owned;
  if (!owned) return;
  while (owned.owed.length > 0) {
    const one = owned.owed[0]!;
    const escrow = one.escrow ? one.escrow.tax + one.escrow.insurance + one.escrow.pmi : 0;
    const total = one.amount + escrow;
    const draw = drawFromBank(sim, person, total);
    if (draw.short > 0) return;
    const postings = [...draw.postings];
    if (one.kind === 'mortgage') {
      const account = mortgageAccount(sim, owned)!;
      const interest = Math.round(Math.max(0, -account.balance) * owned.mortgage!.rate / 12);
      const principal = one.amount - interest;
      postings.push({ accountId: account.id, amount: principal }, { accountId: sim.nominalAccount('expense', EXPENSE.mortgage).id, amount: interest });
      if (one.escrow!.tax > 0) postings.push({ accountId: sim.nominalAccount('expense', EXPENSE.tax).id, amount: one.escrow!.tax });
      if (one.escrow!.insurance > 0) postings.push({ accountId: sim.nominalAccount('expense', EXPENSE.insurance).id, amount: one.escrow!.insurance });
      if (one.escrow!.pmi > 0) postings.push({ accountId: sim.nominalAccount('expense', 'Mortgage Insurance').id, amount: one.escrow!.pmi });
    } else {
      postings.push({ accountId: sim.nominalAccount('expense', EXPENSE[one.kind]).id, amount: one.amount });
    }
    sim.post({ memo: one.kind === 'mortgage' ? 'Mortgage payment' : EXPENSE[one.kind], category: 'home', postings });
    owned.owed.shift();
    dropPmi(sim, owned);
  }
  if (owned.owed.length === 0) delete owned.foreclosureAt;
}

/** Mortgage insurance ends when the loan falls to 78% of what the home cost. */
function dropPmi(sim: Simulation, owned: OwnedHome): void {
  if (owned.mortgage?.pmi && loanBalance(sim, owned) <= owned.mortgage.original * HOME.pmiEnds) owned.mortgage.pmi = false;
}

/** The fee fifteen days late, the record at thirty, foreclosure begun at 120, and the sale at 210. */
function chase(sim: Simulation, person: Person): void {
  const owned = person.owned;
  if (!owned) return;
  const cur = saveCurrency(sim.universe);
  const player = person.id === sim.universe.playerId;
  for (const one of owned.owed) {
    const late = (sim.now - one.dueAt) / MS_DAY;
    if (late >= HOME.graceDays && !one.feeCharged) {
      one.feeCharged = true;
      const fee = Math.round(one.amount * HOME.lateFee);
      const account = one.kind === 'mortgage' ? mortgageAccount(sim, owned) : undefined;
      if (account && fee > 0) sim.post({ memo: 'Late fee', category: 'home', postings: [{ accountId: account.id, amount: -fee }, { accountId: sim.nominalAccount('expense', 'Late Fees').id, amount: fee }] });
      else if (fee > 0) one.amount += fee;
      if (player) sim.notify({ category: 'home', title: 'A Late Fee', body: `Your ${one.kind === 'mortgage' ? 'mortgage payment' : EXPENSE[one.kind].toLowerCase()} is fifteen days late: ${formatMoney(fee, cur)} on it.`, importance: 80, route: '/workspace/homes' });
    }
    if (one.kind === 'mortgage' && late >= HOME.reportDays && !one.reported) {
      one.reported = true;
      if (person.credit) person.credit.score = Math.max(300, person.credit.score - HOME.reportedFall);
      if (player) sim.notify({ category: 'home', title: 'A Late Mortgage Payment Is On Your Record', body: 'Thirty days late, the lender reported it.', importance: 85, route: '/workspace/homes' });
    }
  }
  const oldest = owned.owed.find((one) => one.kind === 'mortgage');
  if (!oldest) return;
  const late = (sim.now - oldest.dueAt) / MS_DAY;
  if (late >= HOME.foreclosureStarts && owned.foreclosureAt === undefined) {
    owned.foreclosureAt = oldest.dueAt + HOME.foreclosureSale * MS_DAY;
    if (player) sim.notify({ category: 'home', title: 'Foreclosure', body: `The lender has begun to foreclose. Pay what’s owed before ${formatDate(owned.foreclosureAt, CITIES.require(owned.cityId).timeZone)}, or the home is sold.`, importance: 95, route: '/workspace/homes' });
  }
  if (owned.foreclosureAt !== undefined && sim.now >= owned.foreclosureAt) foreclose(sim, person);
}

/** The home sold at a forced sale's discount; the loan and what's owed paid from it; the rest theirs, or short with collections. */
function foreclose(sim: Simulation, person: Person): void {
  const owned = person.owned!;
  const cur = saveCurrency(sim.universe);
  const sale = Math.round(homeValue(sim, owned) * HOME.forcedSale);
  const owedOther = owedBeyondLoan(sim, owned);
  const balance = loanBalance(sim, owned);
  const left = sale - balance - owedOther;
  settleSale(sim, person, sale, balance, owedOther, 'Foreclosure sale');
  if (person.credit) person.credit.score = Math.max(300, person.credit.score - HOME.foreclosureFall);
  delete person.owned;
  person.home = { kind: 'sofa', cityId: owned.cityId, since: sim.now };
  if (person.id === sim.universe.playerId) {
    sim.notify({ category: 'home', title: 'Your Home Was Sold', body: `The lender foreclosed and sold it for ${formatMoney(sale, cur, { cents: false })}. ${left >= 0 ? `${formatMoney(left, cur, { cents: false })} of it was yours.` : `It left ${formatMoney(-left, cur, { cents: false })} unpaid, which is with collections.`} It’s on your record, and you’re on a friend’s sofa.`, importance: 95, route: '/workspace/homes' });
  }
}

/** A sale's money: the loan paid off and what's owed, the rest to checking, anything short to collections. */
function settleSale(sim: Simulation, person: Person, sale: Money, balance: Money, owedOther: Money, memo: string, costs = 0): void {
  const owned = person.owned!;
  const checking = sim.universe.accounts[person.primaryAccountId!]!;
  const left = sale - costs - balance - owedOther;
  const postings: { accountId: string; amount: Money }[] = [{ accountId: sim.nominalAccount('asset_value', 'Homes Sold').id, amount: -sale }];
  if (costs > 0) postings.push({ accountId: sim.nominalAccount('expense', 'Selling Costs').id, amount: costs });
  const account = mortgageAccount(sim, owned);
  if (account && balance > 0) postings.push({ accountId: account.id, amount: balance });
  if (owedOther > 0) postings.push({ accountId: sim.nominalAccount('expense', 'Owed On The Home').id, amount: owedOther });
  if (left >= 0) postings.push({ accountId: checking.id, amount: left });
  else {
    const collections = sim.openAccount({ id: sim.nextId('account'), kind: 'loan', name: 'Mortgage Shortfall', ownerId: person.id, institution: 'A Collection Agency', openedAt: sim.now, category: 'collections', apr: 0 });
    postings.push({ accountId: collections.id, amount: left });
  }
  sim.post({ memo, category: 'home', postings });
  if (account) account.closedAt = sim.now;
}

/** Why listing their home can't be done, or nothing where it can. */
export function sellRefusal(sim: Simulation, person: Person): string | undefined {
  const owned = person.owned;
  if (!owned) return 'You don’t own a home.';
  if (owned.selling) return 'It’s listed already.';
  if (owned.works.length > 0) return 'Finish the work first.';
  if (owned.foreclosureAt !== undefined) return 'The lender is foreclosing.';
  const net = saleNet(sim, owned);
  if (net < 0 && inTheBank(sim, person) < -net) return `It would sell for less than you owe on it, by ${formatMoney(-net, saveCurrency(sim.universe), { cents: false })}, which the bank can’t make up.`;
  return undefined;
}

/** What's owed on the home beyond the loan's principal: the other payments whole, and a mortgage payment's interest and escrow. */
function owedBeyondLoan(sim: Simulation, owned: OwnedHome): Money {
  const interest = owned.mortgage ? Math.round(loanBalance(sim, owned) * owned.mortgage.rate / 12) : 0;
  return owned.owed.reduce((sum, one) => sum + (one.kind === 'mortgage' ? interest + one.escrow!.tax + one.escrow!.insurance + one.escrow!.pmi : one.amount), 0);
}

/** What a sale leaves now: the value, less the agents' and closing costs, the loan and what's owed. */
export function saleNet(sim: Simulation, owned: OwnedHome): Money {
  const value = homeValue(sim, owned);
  const costs = Math.round(value * termsIn(CITIES.require(owned.cityId).countryId).selling);
  const owedOther = owedBeyondLoan(sim, owned);
  return value - costs - loanBalance(sim, owned) - owedOther;
}

function saleCloses(sim: Simulation, person: Person): void {
  const owned = person.owned;
  if (!owned?.selling) return;
  const then = owned.selling.then;
  // What's owed on it is paid first, where the bank can.
  payOwed(sim, person);
  const value = homeValue(sim, owned);
  const costs = Math.round(value * termsIn(CITIES.require(owned.cityId).countryId).selling);
  const owedOther = owedBeyondLoan(sim, owned);
  const balance = loanBalance(sim, owned);
  const cur = saveCurrency(sim.universe);
  settleSale(sim, person, value, balance, owedOther, `Sold ${owned.facts.address}`, costs);
  const cityId = owned.cityId;
  delete person.owned;
  person.home = { kind: 'sofa', cityId, since: sim.now };
  const refusal = moveRefusal(sim, person, then, cityId);
  if (!refusal) move(sim, person, then, cityId);
  if (person.id === sim.universe.playerId) {
    sim.notify({ category: 'home', title: 'Your Home Is Sold', body: `It sold for ${formatMoney(value, cur, { cents: false })}; ${formatMoney(costs, cur, { cents: false })} went to the agents and the closing${balance > 0 ? `, and ${formatMoney(balance, cur, { cents: false })} paid off the mortgage` : ''}.${refusal ? ` You couldn’t rent yet: ${refusal}` : ''}`, importance: 85, route: '/workspace/homes' });
  }
}

/** What owning is weighing on them with: payments owed. */
export function owedOnHome(person: Person): Money {
  return (person.owned?.owed ?? []).reduce((sum, one) => sum + one.amount + (one.escrow ? one.escrow.tax + one.escrow.insurance + one.escrow.pmi : 0), 0);
}

export function registerHomes(sim: Simulation): void {
  sim.onSchedule(CLOSING_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (person) close(s, person);
  });
  sim.onSchedule(SALE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (person) saleCloses(s, person);
  });
  sim.onSchedule(WORKS_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const works = person?.owned?.works.find((w) => w.projectId === item.payload.projectId);
    if (person && works) finishWorks(s, person, works);
  });

  sim.onEvent('world.day_rollover', 'homes.day', (_event, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) {
      if (!person.owned) continue;
      bill(s, person);
      payOwed(s, person);
      chase(s, person);
    }
  });

  sim.onCommand<{ listingId: string; down: number }, { closesAt: Instant }>('home.buy', (p, { sim: s }) => {
    const person = s.player;
    const down = Number(p.down);
    const refusal = buyRefusal(s, person, String(p.listingId), down);
    if (refusal) throw new CommandError(refusal);
    const listing = listingById(s, String(p.listingId))!;
    const closesAt = s.now + HOME.closingDays * MS_DAY;
    person.buying = { listingId: listing.id, price: askingPrice(s, listing), down, closesAt };
    s.schedule({ at: closesAt, kind: CLOSING_KIND, label: `Closing On ${listing.address}`, category: 'home', priority: 30, payload: { personId: person.id } });
    return { closesAt };
  });

  sim.onCommand<Record<string, never>, { cancelled: 'purchase' | 'sale' }>('home.cancel', (_p, { sim: s }) => {
    const person = s.player;
    const kind = person.buying ? CLOSING_KIND : person.owned?.selling ? SALE_KIND : undefined;
    if (!kind) throw new CommandError('There’s no purchase or sale under way to call off.');
    for (const one of s.universe.scheduled) if (one.kind === kind && one.status === 'pending' && one.payload.personId === person.id) s.timeline.cancel(one.id, s.now);
    if (kind === CLOSING_KIND) { delete person.buying; return { cancelled: 'purchase' }; }
    delete person.owned!.selling;
    return { cancelled: 'sale' };
  });

  sim.onCommand<{ projectId: string }, { doneAt: Instant }>('home.renovate', (p, { sim: s }) => {
    const person = s.player;
    const project = PROJECTS.find((one) => one.id === p.projectId);
    if (!project) throw new CommandError('No such work.');
    const refusal = projectRefusal(s, person, project);
    if (refusal) throw new CommandError(refusal);
    const owned = person.owned!;
    const cost = projectCost(s, owned, project);
    const draw = drawFromBank(s, person, cost, false, true);
    s.post({ memo: project.label, category: 'home', postings: [...draw.postings, { accountId: s.nominalAccount('asset_value', 'Home Improvements').id, amount: cost }] });
    const doneAt = s.now + project.days * MS_DAY;
    owned.works.push({ projectId: project.id, startedAt: s.now, doneAt, cost });
    s.schedule({ at: doneAt, kind: WORKS_KIND, label: project.label, category: 'home', priority: 40, payload: { personId: person.id, projectId: project.id } });
    return { doneAt };
  });

  sim.onCommand<{ amount: Money }, { paid: Money }>('home.pay_mortgage', (p, { sim: s }) => {
    const person = s.player;
    const owned = person.owned;
    if (!owned?.mortgage || loanBalance(s, owned) === 0) throw new CommandError('You have no mortgage to pay.');
    const amount = Math.min(Math.round(Number(p.amount)), loanBalance(s, owned));
    if (!(amount > 0)) throw new CommandError('Say how much.');
    const draw = drawFromBank(s, person, amount);
    if (draw.short > 0) throw new CommandError('The bank can’t cover it.');
    s.post({ memo: 'Paid down the mortgage', category: 'home', postings: [...draw.postings, { accountId: owned.mortgage.accountId, amount }] });
    dropPmi(s, owned);
    return { paid: amount };
  });

  sim.onCommand<{ then: Housing }, { closesAt: Instant }>('home.sell', (p, { sim: s }) => {
    const person = s.player;
    if (p.then !== 'shared' && p.then !== 'own') throw new CommandError('A room in a shared flat, or a place of your own, after.');
    const refusal = sellRefusal(s, person);
    if (refusal) throw new CommandError(refusal);
    const closesAt = s.now + HOME.saleDays * MS_DAY;
    person.owned!.selling = { closesAt, then: p.then };
    s.schedule({ at: closesAt, kind: SALE_KIND, label: 'Your Home’s Sale Closes', category: 'home', priority: 30, payload: { personId: person.id } });
    return { closesAt };
  });
}
