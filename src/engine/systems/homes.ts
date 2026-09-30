/**
 * SLATE — homes: a market in every town, bought by offer, owned and lived
 * in or let, kept up, borrowed against, renovated without end, and sold.
 *
 * THE MARKET. Every town has fifty homes for sale, cheapest first, about its
 * typical value (`content/homes.ts`): a studio or a flat at the bottom, an
 * estate at the top, each with its rooms, size, lot, the year it was built,
 * what it has and how old each part is. Each of the fifty places sells on a
 * cycle of its own, a month to four, and a new home comes on in its place
 * (decider `homes.listings`); one that sits two months is cut 3%, and at
 * four months 3% again. Prices move with the town's market at its five
 * years' pace. None is a real listing.
 *
 * BUYING. An offer names a price, a down payment, whether they'll live in
 * it, and whether it's subject to an inspection. The seller reads it against
 * the asking price, how long the home has sat and how hot the town's market
 * is, and accepts, counters at halfway or turns it down (decider
 * `homes.market`); waiving the inspection makes it read a little better. The
 * lender's pre-approval and proof of the money come first. Accepted, 1% goes
 * into escrow as earnest money; the inspection's report comes five days on
 * with every part's age, and until the tenth day the buyer can walk away with
 * the earnest back. Closing is thirty days on. A loan the lender won't make
 * then gives the earnest back; money that isn't there loses it.
 *
 * A lender asks what the country's lenders ask (SLATE's estimates by country,
 * but for rules that are law or near it): a record of 620 and debts under 43%
 * of income in America, and in Britain and Ireland a loan within four and a
 * half and four times a year's income, income being the last two years'
 * average as a lender reads an actor's, with 75% of rent from homes let. A
 * home they won't live in is an investment: 15% down at least, and 0.625%
 * on the rate, SLATE's reading of American pricing. England's closing tax is
 * its Stamp Duty Land Tax, with the first-time buyer's relief.
 *
 * OWNING. The mortgage on the first, with the property tax and insurance in
 * escrow beside it and mortgage insurance until the loan is 78% of the price
 * (the Homeowners Protection Act); with no mortgage the tax in halves in April
 * and October and the insurance once a year. California's cap on how fast an
 * assessment grows is read. In England the property tax is council tax, by
 * band, charged to whoever lives there, a renter too. A payment the bank
 * can't make is owed and taken the first day it can: a fee at 15 days, the
 * record at 30, foreclosure begun at 120 and the home sold at 210. A
 * mortgage paid on time counts on the record as a card does.
 *
 * UPKEEP. A worn part can fail: the more worn, the likelier, and the repair
 * is a share of replacing it (decider `homes.upkeep`). A thunderstorm or a
 * gale can damage a roof, the worse the more worn it is, and a hard freeze
 * can burst the pipes of a home left empty or with its heating worn out. The
 * insurance pays storm and freeze damage over its deductible, never wear, and
 * each claim puts a fifth on the premium for three years; a policy with a
 * premium owed pays nothing.
 *
 * LETTING. A home they don't live in, and a backyard cottage, can be let at
 * what its bedrooms let for in the town. A tenant is found sooner the nearer
 * the rent is to the market's, pays a month's deposit and the rent on the
 * first, and at the year's end renews two times in three at the market rent
 * or leaves; the deposit goes back less any damage. The landlord pays the
 * repairs.
 *
 * RENOVATING. A job is paid when it starts and done when it ends; what it adds
 * is its return at sale times the wear of the part it replaces, so every part
 * can be done again and the work never runs out. Living through a big job
 * weighs on whoever lives there.
 *
 * BORROWING. A home equity loan up to 80% of the home's value, less what's
 * owed on it, over fifteen years at the mortgage rate and 1.5% more.
 *
 * SELLING. Listed, the sale closes forty-five days on at the value then, less
 * the agents' and the closing costs, the loans and what's owed; somebody
 * living in it moves into the rented home they chose.
 *
 * TAXES. What the federal return reads (`systems/taxreturn.ts`): the interest
 * and an American home's property tax on a home they live in or keep, the
 * rent and its costs and depreciation on one they let, and a sale's gain.
 */

import { carryCars } from './vehicles';
import { carryFurniture } from './furniture';
import { carryBoat } from './boats';
import { residenceRefusal } from './documents';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, dateKey, formatDate, zonedParts, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import { CITIES } from '../content/geography';
import { exchange } from '../content/currency';
import { rentAt } from '../content/rents';
import { propertyTaxRate, PROPERTY_TAX_RULES, resolveRule } from '../content/tax';
import {
  BEDROOM_RENT, COUNCIL_TAX, COUNCIL_TAX_NATIONS, drawFixtures, type CouncilTaxNation, isFlat, type Fixtures, FEATURE_LABEL, HOME_TAX, LIFESPAN, METAL_ROOF_LIFESPAN, OVERBUILT_AT, OVERBUILT_RECOUP, PROJECTS,
  SQM_PER_SQFT, addressOf, homeValueAt, streetsOf, usesFeet, type Feature, type HomeType, type Part, type Project,
} from '../content/homes';
import { worksPermit, type WorksPermit } from './permits';
import { atTown as townPrice, drawFromBank, inTheBank, leaveOwnedHome, move, moveRefusal, owe, payFromBank, refundRentAhead, rehome, rentOf, scheduleRentFor, spend, type Housing } from './household';
import { premiumOf } from './dwelling';
import { earningsOf, recordHome } from './earnings';
import { weatherOn } from './weather';
import { alarmFactor } from './alarm';
import { foreignBuyerRefusal, foreignBuyerTax } from './foreignbuyers';
import { markRecord } from './credit';

// ---------------------------------------------------------------------------
// Terms by country: SLATE's estimates, but where the header says otherwise.
// America's rate is Freddie Mac's 30-year average for the week of 24
// September 2026, 7.03%; Britain's the average five-year fix on 1 September
// 2026, 5.64% (Moneyfacts, via HomeOwners Alliance). Both then move with the
// months (`rateShift`).

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
  us: { rate: 0.0703, years: 30, minDown: 0.05, closing: 0.03, selling: 0.055 },
  uk: { rate: 0.0564, years: 25, minDown: 0.05, closing: 0.01, selling: 0.02 },
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
  /**
   * A lender's floor on the record and ceiling on debts over income: 620,
   * the floor conventional lenders have long kept (Fannie Mae dropped its
   * own for loans its system approves in November 2025; most lenders keep
   * one), and 45% of income, inside the 50% Fannie Mae's automated approval
   * allows. The 43% of the Qualified Mortgage rule went in 2021. SLATE's
   * reading of common practice.
   */
  minScore: 620,
  maxDebtToIncome: 0.45,
  /** A loan's ceiling over a year's income in Britain and in Ireland. */
  incomeMultiple: { uk: 4.5, ie: 4 } as Readonly<Record<string, number>>,
  /** Ireland's for somebody who has bought before: 3.5 times (the Central Bank's rules). */
  incomeMultipleAgain: { ie: 3.5 } as Readonly<Record<string, number>>,
  /** Months of income a lender averages, and the share of rent it counts. */
  incomeMonths: 24,
  rentCounted: 0.75,
  /** What the card and other loans are taken to cost a month, of what's owed on them: SLATE's estimate. */
  debtPayment: 0.03,
  /** A rate's rise for a record under these: SLATE's estimate of American pricing by score. */
  scoreBands: [{ from: 760, add: 0 }, { from: 700, add: 0.0025 }, { from: 660, add: 0.005 }, { from: 0, add: 0.01 }] as const,
  /** A home they won't live in. */
  investmentDown: 0.15,
  investmentRate: 0.00625,
  /** Earnest money, of the price; the inspection's report and its window; the closing. */
  earnest: 0.01,
  inspectionFeeUsd: 450,
  reportDays: 5,
  inspectionDays: 10,
  closingDays: 30,
  saleDays: 45,
  /** Mortgage insurance, a year, of the loan, while it's over 80% of the price; dropped at 78%. */
  pmi: 0.005,
  pmiOver: 0.8,
  pmiEnds: 0.78,
  /** Insurance, a year, of the value: SLATE's estimate, a flat's owner insuring only the inside. */
  insurance: 0.005,
  insuranceFlat: 0.002,
  /** A claim's deductible in dollars at an American cost of living, and what each claim puts on the premium, for how long. */
  deductibleUsd: 1_500,
  claimLoading: 0.2,
  claimYears: 3,
  /** The fee fifteen days late, of the payment; the record's fall thirty days late; a payment on time's rise. */
  graceDays: 15,
  lateFee: 0.05,
  reportLateDays: 30,
  reportedFall: 70,
  onTimeRise: 2,
  foreclosureStarts: 120,
  foreclosureSale: 210,
  forcedSale: 0.85,
  foreclosureFall: 120,
  /** A flat's or a house's shared charges a month, in dollars at an American cost of living: SLATE's estimates. */
  hoaPerSqft: 0.3,
  hoaTownhouse: 250,
  /** A home equity loan's ceiling on what's owed over the value, its rate over the mortgage's, its years, and the record it asks. */
  equityCeiling: 0.8,
  equityRate: 0.015,
  equityYears: 15,
  equityScore: 660,
  /** A refinance's closing costs, of the loan: SLATE's estimate inside the 2% to 5% Freddie Mac gives for closing costs. */
  refinanceCost: 0.03,
  /** A lease, the chance a tenant renews at its end, and the most a tenant's damage takes of the deposit: SLATE's estimates. */
  leaseMonths: 12,
  renewal: 2 / 3,
  damageMax: 0.3,
  /** The most over the market a rent can be asked. */
  rentCeiling: 1.3,
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
  /** What's inside it (`content/homes.ts`); a home bought before 2026-09-28's later build has none recorded, and `fixturesOf` draws them. */
  fixtures?: Fixtures;
}

export interface Listing extends HomeFacts {
  id: string;
  cityId: string;
  /** 1 is the cheapest. */
  rank: number;
  /** In the save's currency, at the figure's date. */
  value: Money;
  /** When it came on the market. */
  listedAt: Instant;
}

/** The inverse of the standard normal's distribution, near enough (Acklam's approximation). */
export function normalAt(p: number): number {
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
export const SPREAD = { below: 0.5, above: 0.7 };
export const LISTINGS = 50;
/** The year the figures are for, which parts' ages are counted from. */
const DATA_YEAR = 2026;
/** A place on the market sells in this many days, a month to six, most within three: SLATE's estimate. */
const CYCLE_DAYS = { least: 30, most: 180 };
/** Price cuts: this much, after each of these many days unsold. */
const PRICE_CUT = { rate: 0.03, afterDays: [60, 120] as const };

/** Where a place on the market is in its cycle at a moment: the home on it, and when that home was listed. */
function slotAt(sim: Simulation, cityId: string, slot: number, at: Instant, epoch: Instant): { generation: number; listedAt: Instant } {
  const r = sim.rng('homes.listings', cityId, slot);
  // Most sell within three months, some sit for six: long enough for the price cuts to fall.
  const cycle = CYCLE_DAYS.least + Math.floor(r.next() ** 2 * (CYCLE_DAYS.most - CYCLE_DAYS.least));
  const offset = Math.floor(r.next() * cycle);
  const day = Math.floor((at - epoch) / MS_DAY) + offset;
  const generation = Math.floor(day / cycle);
  return { generation, listedAt: epoch + (generation * cycle - offset) * MS_DAY };
}

const cache = new WeakMap<Simulation, Map<string, { key: string; list: Listing[] }>>();

/** The fifty homes for sale in a town at a moment, cheapest first: the ones they're buying or own are off the market. */
export function listingsIn(sim: Simulation, cityId: string, at = sim.now): Listing[] {
  const typical = homeValueAt(cityId, saveCurrency(sim.universe));
  const slots = Array.from({ length: LISTINGS }, (_, i) => slotAt(sim, cityId, i, at, typical.asOf));
  const key = slots.map((s) => s.generation).join(',');
  let bySim = cache.get(sim);
  if (!bySim) { bySim = new Map(); cache.set(sim, bySim); }
  let known = bySim.get(cityId);
  if (known?.key !== key) {
    known = { key, list: drawListings(sim, cityId, typical.value, slots) };
    bySim.set(cityId, known);
  }
  const taken = new Set([...(sim.player.homes ?? []).map((h) => h.listingId), ...(sim.player.buying ? [sim.player.buying.listingId] : [])]);
  // Cheapest first by what's asked today, cuts and all, ranked among what's still for sale.
  return known.list.filter((one) => !taken.has(one.id))
    .map((one) => ({ one, asking: askingPrice(sim, one, at) }))
    .sort((x, y) => x.asking - y.asking)
    .map(({ one }, n) => ({ ...one, rank: n + 1 }));
}

function drawListings(sim: Simulation, cityId: string, typical: Money, slots: { generation: number; listedAt: Instant }[]): Listing[] {
  const city = CITIES.require(cityId);
  const country = city.countryId;
  const dense = city.population >= 500_000 || city.kind === 'section';
  const cold = Math.abs(city.latitude) > 36;
  const warm = Math.abs(city.latitude) < 35;
  const streets = streetsOf(country);
  const used = new Set<string>();
  const out: Listing[] = [];
  for (let i = 0; i < LISTINGS; i++) {
    const { generation, listedAt } = slots[i]!;
    const rng = sim.rng('homes.listings', cityId, i, generation);
    const q = (i + 0.5) / LISTINGS;
    const z = normalAt(q) + rng.float(-0.04, 0.04);
    const value = Math.round(typical * Math.exp(z * (z < 0 ? SPREAD.below : SPREAD.above)));
    const at = Math.min(0.999, Math.max(0, q + rng.float(-0.06, 0.06)));
    const type: HomeType = dense
      ? (at < 0.12 ? 'studio' : at < 0.55 ? 'condo' : at < 0.75 ? 'townhouse' : at < 0.93 ? 'house' : at < 0.975 ? 'penthouse' : 'estate')
      : (at < 0.04 ? 'studio' : at < 0.2 ? 'condo' : at < 0.35 ? 'townhouse' : at < 0.93 ? 'house' : 'estate');
    const beds = type === 'studio' ? 0
      : type === 'condo' ? (rng.next() < 0.7 - q * 0.5 ? 1 : rng.next() < 0.8 ? 2 : 3)
      : type === 'penthouse' ? rng.int(2, 5)
      : type === 'townhouse' ? rng.int(2, 3)
      : type === 'house' ? Math.min(5, 2 + Math.floor(q * 2.5 + rng.next()))
      : rng.int(4, 7);
    const baths = type === 'studio' ? 1
      : type === 'condo' ? (beds === 1 ? 1 : rng.pick([1.5, 2, 2]))
      : type === 'penthouse' ? beds + 0.5
      : type === 'townhouse' ? rng.pick([1.5, 2, 2.5])
      : type === 'house' ? Math.max(1, beds - 1) + (rng.next() < 0.5 ? 0.5 : 0)
      : beds + rng.pick([-0.5, 0.5, 1.5]);
    const size = Math.round((type === 'studio' ? rng.int(350, 550)
      : type === 'condo' ? 450 + 330 * beds + rng.int(-80, 150)
      : type === 'penthouse' ? 1_400 + 600 * beds + rng.int(0, 1_000)
      : type === 'townhouse' ? 900 + 300 * beds + rng.int(-100, 250)
      : type === 'house' ? 700 + 420 * beds + rng.int(-150, 400) + q * 500
      : 3_000 + 650 * beds + rng.int(0, 1_500)) / 10) * 10;
    const flat = isFlat(type);
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
      if (type !== 'townhouse' && rng.next() < 0.04) features.push('solar');
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
    const fixtures = drawFixtures(rng, { countryId: country, latitude: city.latitude, longitude: city.longitude, dense }, type, q, features.includes('yard'));
    // What it has inside moves its price about the spread's (`premiumOf`).
    const priced = Math.round(value * premiumOf(fixtures));
    out.push({ id: `${cityId}~${i}~${generation}`, cityId, rank: 0, value: priced, listedAt, type, address, beds, baths, size, ...(lot !== undefined ? { lot } : {}), built, features, parts, hoaUsd, fixtures });
  }
  return out.sort((x, y) => x.value - y.value).map((one, n) => ({ ...one, rank: n + 1 }));
}

/** A home on the market now, by its id; one gone from it is undefined. */
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

/** How long a listing has been for sale, in days. */
export const daysListed = (sim: Simulation, listing: Listing, at = sim.now): number => Math.max(0, Math.floor((at - listing.listedAt) / MS_DAY));

/** A listing's asking price now: the market's, less a cut at two months unsold and another at four. */
export function askingPrice(sim: Simulation, listing: Listing, at = sim.now): Money {
  const days = daysListed(sim, listing, at);
  const cuts = PRICE_CUT.afterDays.filter((d) => days >= d).length;
  return Math.round(listing.value * marketAt(listing.cityId, saveCurrency(sim.universe), at) * Math.pow(1 - PRICE_CUT.rate, cuts) / 100) * 100;
}

/** A US or metric size, for the screens. */
export function sizeText(sqft: number, countryId: string): string {
  return usesFeet(countryId) ? `${sqft.toLocaleString('en-US')} sq ft` : `${Math.round(sqft * SQM_PER_SQFT).toLocaleString('en-US')} m²`;
}

export interface Improvement { projectId: string; at: Instant; value: Money; cost: Money }

export interface Works { projectId: string; startedAt: Instant; doneAt: Instant; cost: Money }

/** A payment falling due on a home. */
export interface Installment {
  kind: 'mortgage' | 'equity' | 'tax' | 'insurance' | 'hoa' | 'repair' | 'council';
  dueAt: Instant;
  /** Principal and interest, for a loan's; the whole, for the rest. */
  amount: Money;
  /** A mortgage's escrow beside it: the tax, the insurance and the mortgage insurance. */
  escrow?: { tax: Money; insurance: Money; pmi: Money };
  /** What a repair was for. */
  what?: string;
  feeCharged?: boolean;
  reported?: boolean;
}

export interface Loan {
  accountId: string;
  rate: number;
  /** Principal and interest a month. */
  payment: Money;
  original: Money;
  pmi: boolean;
  /** When it was paid off, if it has been. */
  paidOffAt?: Instant;
}

/** A home let, or offered to let: the whole of it, or its backyard cottage. */
export interface Tenancy {
  unit: 'main' | 'adu';
  rent: Money;
  /** Advertised, and when the tenant moves in; let, and when the lease ends; the landlord's notice given. */
  status: 'advertised' | 'let';
  since: Instant;
  tenantAt?: Instant;
  leaseEnds?: Instant;
  notice?: boolean;
  depositAccountId?: string;
}

export interface OwnedHome {
  id: string;
  /** A house just built, not to be lived in before its certificate of occupancy (`systems/construction.ts`, from 2026-09-30). */
  occupiableFrom?: Instant;
  /** A burglar alarm fitted, monitored, its discount on the premium (`systems/alarm.ts`, from 2026-09-30). */
  alarm?: boolean;
  listingId: string;
  cityId: string;
  facts: HomeFacts;
  boughtAt: Instant;
  price: Money;
  /** What closing cost the buyer, which is part of what the home cost them. */
  closing: Money;
  investment: boolean;
  mortgage?: Loan;
  equity?: Loan;
  improvements: Improvement[];
  works: Works[];
  /** Payments due and not yet made, oldest first. */
  owed: Installment[];
  /** The last month billed, `YYYY-MM`. */
  billedThrough: string;
  /** When they've lived in it. */
  occupied: { from: Instant; to?: Instant }[];
  tenancies: Tenancy[];
  /** Lodgers in its spare bedrooms (`systems/lodgers.ts`), from 2026-09-30. */
  lodgers?: import('./lodgers').Lodger[];
  /** Former tenants' deposits not yet all paid back, by account. */
  depositsOwed?: string[];
  /** Insurance claims paid, when. */
  claims: Instant[];
  /** Depreciation taken while it was let, which the sale's gain reads. */
  depreciated: Money;
  /** The months, `YYYY-MM`, a lender escrowed the tax and insurance: what a payoff mid-year leaves to pay. */
  escrowed?: string[];
  foreclosureAt?: Instant;
  /** Came empty: bought or built from 2026-09-29, as a real home does (`systems/furniture.ts`). A home owned before is furnished. */
  bare?: boolean;
  /** Appliances fitted, and when (`systems/appliances.ts`); the laundry it had before a washer was. */
  appliances?: Partial<Record<import('../content/appliances').ApplianceKind, Instant>>;
  laundryBefore?: 'building' | 'none';
  /** A levy the builder was spared on the promise of living in it, owed if it's sold or let before `until` (`systems/construction.ts`). */
  clawback?: { until: Instant; amount: Money; memo: string };
  /** Listed for sale: the day it closes, and the rented home somebody living in it moves into. */
  selling?: { closesAt: Instant; then?: Housing };
}

export interface Purchase {
  listingId: string;
  cityId: string;
  facts: HomeFacts;
  price: Money;
  /** Of the price: 1 is cash. */
  down: number;
  live: boolean;
  inspect: boolean;
  offeredAt: Instant;
  closesAt: Instant;
  earnest: Money;
  escrowAccountId: string;
  /** The inspection's window, and when its report came. */
  inspectionUntil?: Instant;
  inspectedAt?: Instant;
}

/** A seller's counter to an offer: the price, until when it stands. */
export interface Counter { listingId: string; price: Money; until: Instant }

export const homesOf = (person: Person): OwnedHome[] => (person.homes ??= []);
export const homeById = (person: Person, id: string): OwnedHome | undefined => (person.homes ?? []).find((h) => h.id === id);
/** The home they live in, where they own it. */
export const livingIn = (person: Person): OwnedHome | undefined =>
  person.home?.kind === 'owned' && person.home.homeId ? homeById(person, person.home.homeId) : undefined;

/** What a home is worth now: what it cost, and what the work added, each moved with the market since. */
export function homeValue(sim: Simulation, owned: OwnedHome, at = sim.now): Money {
  const cur = saveCurrency(sim.universe);
  const now = marketAt(owned.cityId, cur, at);
  const grown = (v: Money, from: Instant) => v * now / marketAt(owned.cityId, cur, from);
  return Math.round(grown(owned.price, owned.boughtAt) + owned.improvements.reduce((sum, one) => sum + grown(one.value, one.at), 0));
}

/** Every home they own, at what it's worth now. */
export function homesValue(sim: Simulation, person: Person): Money {
  return (person.homes ?? []).reduce((sum, h) => sum + homeValue(sim, h), 0);
}

const accountOf = (sim: Simulation, loan?: Loan): Account | undefined => (loan ? sim.universe.accounts[loan.accountId] : undefined);

/** What's left on a loan. */
export function owedOn(sim: Simulation, loan?: Loan): Money {
  return Math.max(0, -(accountOf(sim, loan)?.balance ?? 0));
}
export const loanBalance = (sim: Simulation, owned: OwnedHome): Money => owedOn(sim, owned.mortgage);

/** Of a home's value, theirs. */
export function equityIn(sim: Simulation, owned: OwnedHome): Money {
  return homeValue(sim, owned) - owedOn(sim, owned.mortgage) - owedOn(sim, owned.equity);
}

// ---------------------------------------------------------------------------
// What owning costs

const yearIn = (sim: Simulation, cityId: string, at = sim.now): number => zonedParts(at, CITIES.require(cityId).timeZone).year;
/** The council tax a town's nation charges, where it's one of Britain's that has it. */
export function councilNation(cityId: string): CouncilTaxNation | undefined {
  const region = CITIES.get(cityId)?.parentId;
  return region === 'uk-eng' || region === 'uk-sct' || region === 'uk-wls' ? COUNCIL_TAX_NATIONS[region] : undefined;
}
const inEngland = (cityId: string): boolean => councilNation(cityId) !== undefined;

/** What an amount in dollars at an American cost of living a hundred is in a town, in the save's money. */
export function atTown(sim: Simulation, cityId: string, usd: number): Money {
  return townPrice(cityId, usd, saveCurrency(sim.universe));
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

/** A home's council tax band, by its value in 1991 (SLATE's estimate of it), 0 for A to 7 for H. */
export function councilBand(sim: Simulation, value: Money, cityId: string): number {
  const nation = councilNation(cityId) ?? COUNCIL_TAX_NATIONS['uk-eng'];
  const gbp = (exchange(value, saveCurrency(sim.universe), 'GBP') ?? value) / 100 / nation.since;
  const at = nation.bands.findIndex((edge) => gbp <= edge);
  return at === -1 ? nation.bands.length : at;
}

/** A band's letter where a town is. */
export const councilLetter = (cityId: string, band: number): string => (councilNation(cityId) ?? COUNCIL_TAX_NATIONS['uk-eng']).letters[band] ?? '';

/** A year's council tax on a band, in the save's money, for somebody living alone or not, and shared a number of ways. */
export function councilTaxYear(sim: Simulation, band: number, alone: boolean, sharedBy = 1, cityId = 'uk-eng-london'): Money {
  const nation = councilNation(cityId) ?? COUNCIL_TAX_NATIONS['uk-eng'];
  const gbp = nation.bandD * nation.shares[band]! * (alone ? 1 - COUNCIL_TAX.livingAlone : 1) / sharedBy;
  return Math.round(exchange(Math.round(gbp), 'GBP', saveCurrency(sim.universe)) ?? gbp);
}

/** The premium's loading for claims in the last three years. */
const claimLoading = (sim: Simulation, owned: OwnedHome): number =>
  1 + HOME.claimLoading * owned.claims.filter((at) => sim.now - at < HOME.claimYears * YEAR_MS).length;

export interface OwnerMonth {
  mortgage: Money;
  equity: Money;
  tax: Money;
  insurance: Money;
  pmi: Money;
  hoa: Money;
  total: Money;
}

/**
 * What a home costs a month, averaged: what the screens show and the lender
 * weighs. England's tax here is council tax, which whoever lives in the home
 * pays; a tenant's is theirs.
 */
export function monthOf(sim: Simulation, facts: HomeFacts, cityId: string, value: Money, loans: { mortgage?: { payment: Money; pmi: boolean; balance: Money }; equity?: Money } = {}, assessed = value, loading = 1, let_ = false): OwnerMonth {
  const england = inEngland(cityId);
  const tax = england ? (let_ ? 0 : Math.round(councilTaxYear(sim, councilBand(sim, value, cityId), true, 1, cityId) / 12)) : Math.round(assessed * propertyTaxRate(cityId, sim.now) / 12);
  const flat = isFlat(facts.type);
  const insurance = Math.round(value * (flat ? HOME.insuranceFlat : HOME.insurance) * loading / 12);
  const pmi = loans.mortgage?.pmi ? Math.round(loans.mortgage.balance * HOME.pmi / 12) : 0;
  const hoa = atTown(sim, cityId, facts.hoaUsd);
  const pay = loans.mortgage?.payment ?? 0;
  const equity = loans.equity ?? 0;
  return { mortgage: pay, equity, tax, insurance, pmi, hoa, total: pay + equity + tax + insurance + pmi + hoa };
}

/** What a home they own costs a month now. */
export function ownedMonth(sim: Simulation, owned: OwnedHome): OwnerMonth {
  const value = homeValue(sim, owned);
  const main = owned.tenancies.find((t) => t.unit === 'main' && t.status === 'let');
  return monthOf(sim, owned.facts, owned.cityId, value, {
    ...(owned.mortgage && loanBalance(sim, owned) > 0 ? { mortgage: { payment: owned.mortgage.payment, pmi: owned.mortgage.pmi, balance: loanBalance(sim, owned) } } : {}),
    ...(owned.equity && owedOn(sim, owned.equity) > 0 ? { equity: owned.equity.payment } : {}),
  }, assessedValue(sim, owned), claimLoading(sim, owned) * alarmFactor(owned), Boolean(main));
}

/** A loan's payment a month, principal and interest. */
export function paymentFor(loan: Money, rate: number, months: number): Money {
  const r = rate / 12;
  return Math.round(r === 0 ? loan / months : loan * r / (1 - Math.pow(1 + r, -months)));
}

/** The rate a lender here offers this record, for a home they'll live in or not. */
/**
 * Where rates have gone since the figures' month: a month's move drawn about
 * nothing, a fifth of a point either way at most in an ordinary month, pulled
 * back a thirtieth of the way toward where they began (decider
 * `homes.rates`). Every country's moves together, as rates largely do. SLATE's
 * estimate of how rates wander; nobody publishes what they'll be.
 */
export const RATE_WALK = { step: 0.002, pull: 1 / 30, from: Date.UTC(2026, 8, 1) };
const rateCache = new WeakMap<Simulation, number[]>();
export function rateShift(sim: Simulation, at = sim.now): number {
  const months = Math.max(0, Math.floor((at - RATE_WALK.from) / (30.4375 * MS_DAY)));
  let path = rateCache.get(sim);
  if (!path) { path = [0]; rateCache.set(sim, path); }
  while (path.length <= months) {
    const last = path[path.length - 1]!;
    const move = (sim.rng('homes.rates', path.length).next() * 2 - 1) * RATE_WALK.step;
    path.push(Math.round((last * (1 - RATE_WALK.pull) + move) * 100_000) / 100_000);
  }
  return path[months]!;
}

export function rateFor(person: Person, countryId: string, investment = false, sim?: Simulation): number {
  const base = Math.max(0.005, termsIn(countryId).rate + (sim ? rateShift(sim) : 0)) + (investment ? HOME.investmentRate : 0);
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
/**
 * Scotland's Land and Buildings Transaction Tax (Revenue Scotland): 0% to
 * £145,000, 2% to £250,000, 5% to £325,000, 10% to £750,000 and 12% above,
 * a first-time buyer's 0% band to £175,000, and 8% more on the whole price of
 * a home bought beside one already owned (the Additional Dwelling Supplement,
 * from December 2024). Wales's Land Transaction Tax (the Welsh Revenue
 * Authority): 0% to £225,000, 6% to £400,000, 7.5% to £750,000, 10% to
 * £1.5 million and 12% above; a home beside another pays the higher rates,
 * 5%, 8.5%, 10%, 12.5%, 15% and 17% from nothing (from December 2024). 1%
 * besides for the conveyancing, as England's.
 */
const TRANSFER_TAX: Readonly<Record<'uk-sct' | 'uk-wls', { main: [number, number][]; first?: [number, number][]; additional: [number, number][] | number }>> = {
  'uk-sct': {
    main: [[145_000, 0], [250_000, 0.02], [325_000, 0.05], [750_000, 0.1], [Number.POSITIVE_INFINITY, 0.12]],
    first: [[175_000, 0], [250_000, 0.02], [325_000, 0.05], [750_000, 0.1], [Number.POSITIVE_INFINITY, 0.12]],
    additional: 0.08,
  },
  'uk-wls': {
    main: [[225_000, 0], [400_000, 0.06], [750_000, 0.075], [1_500_000, 0.1], [Number.POSITIVE_INFINITY, 0.12]],
    additional: [[180_000, 0.05], [250_000, 0.085], [400_000, 0.1], [750_000, 0.125], [1_500_000, 0.15], [Number.POSITIVE_INFINITY, 0.17]],
  },
};
const onBands = (gbp: number, bands: [number, number][]): number => {
  let tax = 0;
  let from = 0;
  for (const [to, rate] of bands) { if (gbp > from) tax += (Math.min(gbp, to) - from) * rate; from = to; }
  return tax;
};

export function closingCost(sim: Simulation, cityId: string, price: Money, firstHome: boolean, additional = false): Money {
  const city = CITIES.require(cityId);
  if (city.parentId === 'uk-sct' || city.parentId === 'uk-wls') {
    const cur = saveCurrency(sim.universe);
    const gbp = (exchange(price, cur, 'GBP') ?? price) / 100;
    const t = TRANSFER_TAX[city.parentId];
    let tax: number;
    if (additional) tax = typeof t.additional === 'number' ? onBands(gbp, t.main) + gbp * t.additional : onBands(gbp, t.additional);
    else tax = onBands(gbp, firstHome && t.first ? t.first : t.main);
    return Math.round(exchange(Math.round(tax * 100), 'GBP', cur) ?? tax * 100) + Math.round(price * 0.01);
  }
  if (city.parentId === 'uk-eng' || city.parentId === 'uk-nir') {
    const cur = saveCurrency(sim.universe);
    const gbp = (exchange(price, cur, 'GBP') ?? price) / 100;
    const bands: [number, number][] = firstHome && gbp <= 500_000 ? [[300_000, 0], [500_000, 0.05]]
      : [[125_000, 0], [250_000, 0.02], [925_000, 0.05], [1_500_000, 0.1], [Number.POSITIVE_INFINITY, 0.12]];
    let tax = 0;
    let from = 0;
    for (const [to, rate] of bands) { if (gbp > from) tax += (Math.min(gbp, to) - from) * rate; from = to; }
    // A home bought beside one already owned pays 5% more on all of it, from October 2024.
    if (additional) tax += gbp * 0.05;
    return Math.round(exchange(Math.round(tax * 100), 'GBP', cur) ?? tax * 100) + Math.round(price * 0.01);
  }
  return Math.round(price * termsIn(city.countryId).closing);
}

/** What a lender takes a month's income to be: the last two years' average, and 75% of the rent coming in. */
export function monthlyIncome(sim: Simulation, person: Person): Money {
  const months = earningsOf(person).months;
  const p = zonedParts(sim.now, sim.homeZone);
  let sum = 0;
  for (let n = 1; n <= HOME.incomeMonths; n++) {
    const m = ((p.month - 1 - n) % 12 + 12) % 12 + 1;
    const y = p.year + Math.floor((p.month - 1 - n) / 12);
    sum += months[`${y}-${String(m).padStart(2, '0')}`] ?? 0;
  }
  // The months carry rent received in full (`recordHome`); a lender counts three quarters of today's.
  const rents = (person.homes ?? []).flatMap((h) => h.tenancies).filter((t) => t.status === 'let').reduce((s, t) => s + t.rent, 0);
  return Math.round(sum / HOME.incomeMonths - rents * (1 - HOME.rentCounted));
}

/** What their other debts, the homes they own already, and the rent they'll go on paying, are taken to cost a month. */
function monthlyDebts(sim: Simulation, person: Person, except?: string, keepsRent = false): Money {
  const cards = Object.values(sim.universe.accounts)
    .filter((a) => a.ownerId === person.id && !a.nominal && !a.closedAt && (a.kind === 'credit_card' || a.kind === 'loan') && a.category !== 'tenant_deposit' && a.balance < 0)
    .reduce((sum, a) => sum + Math.round(-a.balance * HOME.debtPayment), 0);
  const homes = (person.homes ?? []).filter((h) => h.id !== except).reduce((sum, h) => sum + ownedMonth(sim, h).total, 0);
  return cards + homes + (keepsRent ? rentOf(sim, person) : 0);
}

export interface Offer {
  price: Money;
  down: Money;
  loan: Money;
  closing: Money;
  rate: number;
  payment: Money;
  month: OwnerMonth;
  earnest: Money;
  /** What the bank must hold: the down payment and the closing costs. */
  cash: Money;
}

/** An offer on a home at a price and a down payment: what it costs, and what it costs a month. */
export function offerFor(sim: Simulation, person: Person, listing: Listing, down: number, price = askingPrice(sim, listing), live = true): Offer {
  const country = CITIES.require(listing.cityId).countryId;
  const downCash = Math.round(price * Math.min(1, down));
  const loan = price - downCash;
  const rate = rateFor(person, country, !live, sim);
  const months = termsIn(country).years * 12;
  const payment = loan > 0 ? paymentFor(loan, rate, months) : 0;
  const pmi = country === 'us' && live && loan > price * HOME.pmiOver;
  // A foreign or non-resident buyer's taxes on top, where they're kept (`systems/foreignbuyers.ts`).
  const closing = closingCost(sim, listing.cityId, price, (person.homesOwned ?? 0) === 0 && live, (person.homes ?? []).length > 0) + foreignBuyerTax(person, listing.cityId, price);
  const month = monthOf(sim, listing, listing.cityId, price, loan > 0 ? { mortgage: { payment, pmi, balance: loan } } : {});
  return { price, down: downCash, loan, closing, rate, payment, month, earnest: Math.round(price * HOME.earnest), cash: downCash + closing };
}

/**
 * The least a lender here takes down, of the price, as the countries' rules
 * have it where they're law: Canada's 5% to C$500,000, 10% on the rest to
 * C$1.5 million and 20% past it, and 20% on a home to let; Ireland's and New
 * Zealand's 30% on a home to let (the Central Bank's and the Reserve Bank's
 * limits). Elsewhere the country's usual, and at least 15% on a home to let.
 */
export function minimumDown(sim: Simulation, countryId: string, price: Money, live: boolean): number {
  const base = termsIn(countryId).minDown;
  if (countryId === 'ca') {
    if (!live) return 0.2;
    const cad = (exchange(price, saveCurrency(sim.universe), 'CAD') ?? price) / 100;
    if (cad >= 1_500_000) return 0.2;
    return cad <= 500_000 ? 0.05 : (25_000 + (cad - 500_000) * 0.1) / cad;
  }
  if (!live && (countryId === 'ie' || countryId === 'nz')) return 0.3;
  return Math.max(base, live ? 0 : HOME.investmentDown);
}

/** The down payments a lender here takes for a home they'll live in or not, the least first, and cash. */
export function downChoices(countryId: string, live = true, least = Math.max(termsIn(countryId).minDown, live ? 0 : HOME.investmentDown)): number[] {
  const min = Math.ceil(least * 100) / 100;
  return [...new Set([min, 0.1, 0.2, 0.25, 0.3].filter((d) => d >= min))].concat(1);
}

/** Whether the lender would lend on an offer, and why not. */
function lenderRefusal(sim: Simulation, person: Person, cityId: string, offer: Offer, except?: string, keepsRent = false): string | undefined {
  if (offer.loan === 0) return undefined;
  const cur = saveCurrency(sim.universe);
  if ((person.credit?.score ?? 650) < HOME.minScore) return 'A lender asks for a better credit record than yours.';
  const income = monthlyIncome(sim, person);
  const country = CITIES.require(cityId).countryId;
  const multiple = ((person.homesOwned ?? 0) > 0 ? HOME.incomeMultipleAgain[country] : undefined) ?? HOME.incomeMultiple[country];
  if (multiple !== undefined) {
    if (offer.loan > income * 12 * multiple) return `A lender here lends up to ${multiple} times a year’s income, and yours has averaged ${formatMoney(income * 12, cur, { cents: false })} a year over two years.`;
  } else if (income <= 0 || (offer.month.total + monthlyDebts(sim, person, except, keepsRent)) / income > HOME.maxDebtToIncome) {
    return `A lender keeps what you owe each month under ${Math.round(HOME.maxDebtToIncome * 100)}% of your income, and yours has averaged ${formatMoney(income, cur, { cents: false })} a month over two years.`;
  }
  return undefined;
}

/** Why an offer can't be made, or nothing where it can. */
export function offerRefusal(sim: Simulation, person: Person, listingId: string, price: Money, down: number, live: boolean): string | undefined {
  const listing = listingById(sim, listingId);
  if (!listing) return 'That home isn’t for sale any more.';
  if (person.buying) return 'You have an offer accepted already.';
  if (live && listing.cityId !== (person.home?.cityId ?? person.currentLocationId)) return 'A home to live in is bought where you live; one elsewhere is bought to let.';
  const abroad = live ? residenceRefusal(person, listing.cityId, sim.now) : undefined;
  if (abroad) return abroad;
  const barred = foreignBuyerRefusal(sim, person, listing.cityId);
  if (barred) return barred;
  if (live && person.home?.noticeUntil !== undefined) return 'There’s a notice to pay or quit on your home: a lender won’t lend over it.';
  if (!(price >= askingPrice(sim, listing) * 0.5)) return 'The seller won’t read an offer under half the asking price.';
  const country = CITIES.require(listing.cityId).countryId;
  if (!downChoices(country, live, minimumDown(sim, country, price, live)).includes(down)) return 'A lender here doesn’t take that down payment.';
  const offer = offerFor(sim, person, listing, down, price, live);
  if (inTheBank(sim, person) < offer.cash) return `The seller asks to see ${formatMoney(offer.cash, saveCurrency(sim.universe), { cents: false })} in the bank, the down payment and the closing costs.`;
  return lenderRefusal(sim, person, listing.cityId, offer, undefined, !live);
}

/** The least a seller would take, as a share of the asking price. */
export function sellerFloor(sim: Simulation, listing: Listing, inspect: boolean): number {
  const growth = homeValueAt(listing.cityId, saveCurrency(sim.universe)).growth;
  return 0.93 - Math.min(0.08, daysListed(sim, listing) / 365 * 0.16) + (growth > 0.05 ? 0.03 : growth < 0.01 ? -0.02 : 0) - (inspect ? 0 : 0.01);
}

export type SellerAnswer = { answer: 'accepted' } | { answer: 'countered'; price: Money } | { answer: 'rejected' };

/**
 * How a seller reads an offer: the least they'd take, as a share of the
 * asking price, falls the longer the home has sat, rises in a town whose
 * market has grown fast, and gives a little to an offer with no inspection.
 * From it up they accept more often the nearer the asking price, always at it,
 * and counter at halfway otherwise; a little under it they counter; further
 * under they turn it down. SLATE's estimates of how sellers answer.
 */
export function sellerAnswer(sim: Simulation, person: Person, listing: Listing, price: Money, inspect: boolean, tries: number): SellerAnswer {
  const asking = askingPrice(sim, listing);
  const floor = sellerFloor(sim, listing, inspect);
  const ratio = price / asking;
  const halfway = Math.round((price + asking) / 2 / 100) * 100;
  if (ratio >= floor) {
    const odds = (ratio - floor) / (1 - floor);
    return sim.rng('homes.market', person.id, listing.id, 'offer', tries).next() < odds ? { answer: 'accepted' } : { answer: 'countered', price: halfway };
  }
  return ratio >= floor - 0.05 ? { answer: 'countered', price: halfway } : { answer: 'rejected' };
}

// ---------------------------------------------------------------------------
// Renovations

/** A part's age in years, in a home they own. */
export function partAge(sim: Simulation, owned: OwnedHome, part: Part): number | undefined {
  const year = owned.facts.parts[part];
  return year === undefined ? undefined : Math.max(0, yearIn(sim, owned.cityId) - year);
}

export function lifeOf(facts: HomeFacts, part: Part): number {
  return part === 'roof' && facts.features.includes('metalRoof') ? METAL_ROOF_LIFESPAN : LIFESPAN[part];
}

/** How worn a part is, its age over its life. */
const wearOf = (sim: Simulation, owned: OwnedHome, part: Part): number => (partAge(sim, owned, part) ?? 0) / lifeOf(owned.facts, part);

/** Why a project can't be done to a home, or nothing where it can. */
export function projectRefusal(sim: Simulation, person: Person, owned: OwnedHome, project: Project): string | undefined {
  const f = owned.facts;
  if (owned.selling) return 'It’s listed for sale.';
  if (!project.on.includes(f.type)) return 'Not on a home of this kind.';
  // "An" before a vowel: "It needs a unfinished basement" read until 2026-09-29.
  for (const need of project.needs ?? []) if (!f.features.includes(need)) { const word = FEATURE_LABEL[need].toLowerCase(); return `It needs ${/^[aeiou]/.test(word) ? 'an' : 'a'} ${word}.`; }
  for (const lack of project.lacks ?? []) if (f.features.includes(lack)) return `It has a ${FEATURE_LABEL[lack].toLowerCase()} already.`;
  if (project.lot !== undefined && (f.lot ?? 0) < project.lot) return 'The lot isn’t big enough.';
  if (project.bathsUpTo === 'bedsPlusOne' && f.baths >= Math.max(1, f.beds) + 1) return 'It has baths enough for its bedrooms.';
  if (project.bedsUpTo !== undefined && f.beds >= project.bedsUpTo) return 'It has bedrooms enough.';
  if (project.renews && f.parts[project.renews] === undefined) return 'It has none to replace.';
  if (project.adds?.beds && owned.tenancies.some((t) => t.unit === 'main' && t.status === 'let')) return 'Not with a tenant living in it.';
  const busy = owned.works.find((w) => {
    const other = PROJECTS.find((p) => p.id === w.projectId);
    return other && (other.id === project.id || (project.renews !== undefined && other.renews === project.renews));
  });
  if (busy) return 'That work is under way.';
  const cost = projectCost(sim, owned, project);
  // With the permit or planning it asks (`systems/permits.ts`), paid when it starts.
  const permit = (worksPermit(sim, owned.cityId, project, cost)?.lines ?? []).reduce((a, l) => a + l.amount, 0);
  if (inTheBank(sim, person) < cost + permit) return `It costs ${formatMoney(cost + permit, saveCurrency(sim.universe), { cents: false })}${permit > 0 ? ' with its permit' : ''}, paid when the work starts.`;
  return undefined;
}

/** What a project costs on a home: the job, by the size where it's done by the foot, at the town's cost of living. */
export function projectCost(sim: Simulation, owned: OwnedHome, project: Project): Money {
  const scale = project.perSize ? Math.max(0.5, owned.facts.size / project.perSize) : 1;
  return atTown(sim, owned.cityId, project.usd * scale);
}

/** What a project would add to the value: its return, on a part as worn as the one it replaces, and half past the street's. */
export function projectAdds(sim: Simulation, owned: OwnedHome, project: Project): Money {
  const cost = projectCost(sim, owned, project);
  const wear = project.renews ? Math.min(1, wearOf(sim, owned, project.renews)) : 1;
  const added = owned.improvements.reduce((sum, one) => sum + one.value, 0);
  const past = added >= owned.price * OVERBUILT_AT ? OVERBUILT_RECOUP : 1;
  return Math.round(cost * project.recoup * wear * past);
}

/** The projects a home can take now, and the ones it can't, with why. */
export function projectsFor(sim: Simulation, person: Person, owned: OwnedHome): { project: Project; cost: Money; adds: Money; permit?: WorksPermit; refusal?: string }[] {
  return PROJECTS
    .filter((p) => p.on.includes(owned.facts.type))
    .map((project) => {
      const refusal = projectRefusal(sim, person, owned, project);
      const cost = projectCost(sim, owned, project);
      const permit = worksPermit(sim, owned.cityId, project, cost);
      return { project, cost, adds: projectAdds(sim, owned, project), ...(permit ? { permit } : {}), ...(refusal ? { refusal } : {}) };
    });
}

/** Work this long, where they live, weighs on them every day of it: SLATE's estimate. */
const DISRUPTIVE_DAYS = 21;
const WORKS_STRESS = 1;

function finishWorks(sim: Simulation, person: Person, owned: OwnedHome, works: Works): void {
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
    for (const one of a.gains ?? []) if (!f.features.includes(one)) f.features.push(one);
    f.beds += a.beds ?? 0;
    f.baths += a.baths ?? 0;
    f.size += a.size ?? 0;
    // What it adds starts new: a deck, a pool, solar panels, a garage gone.
    for (const [feature, part] of [['deck', 'deck'], ['solar', 'solar'], ['pool', 'pool']] as const) if ((a.gains ?? []).includes(feature)) f.parts[part] = year;
    if ((a.drops ?? []).includes('garage')) delete f.parts.garageDoor;
    if (a.gains?.includes('heatPump')) f.parts.hvac = year;
    if (a.gains?.includes('garage')) f.parts.garageDoor = year;
  }
  owned.improvements.push({ projectId: project.id, at: sim.now, value: adds, cost: works.cost });
  if (person.id === sim.universe.playerId) {
    sim.notify({ category: 'home', title: 'The Work Is Done', body: `${project.label} at ${f.address}: finished, and ${formatMoney(adds, saveCurrency(sim.universe), { cents: false })} on what it’s worth.`, importance: 60, route: '/workspace/homes' });
  }
}

// ---------------------------------------------------------------------------
// Letting

/** What a home, or its backyard cottage, lets for in its town a month. */
export function marketRent(sim: Simulation, owned: Pick<OwnedHome, 'cityId' | 'facts'>, unit: Tenancy['unit']): Money {
  const oneBed = rentAt(owned.cityId, saveCurrency(sim.universe)).oneBed;
  const beds = unit === 'adu' ? 0 : Math.min(BEDROOM_RENT.length - 1, owned.facts.beds);
  const inside = unit === 'main' && owned.facts.fixtures ? premiumOf(owned.facts.fixtures) : 1;
  return Math.round(oneBed * BEDROOM_RENT[beds]! * inside / 100) * 100;
}

/** Why a unit can't be offered to let at a rent, or nothing where it can. */
export function letRefusal(sim: Simulation, person: Person, owned: OwnedHome, unit: Tenancy['unit'], rent: Money): string | undefined {
  if (unit === 'adu' && !owned.facts.features.includes('adu')) return 'It has no backyard cottage.';
  if (unit === 'main' && livingIn(person)?.id === owned.id) return 'You live in it: move out first, or let the cottage.';
  if (owned.tenancies.some((t) => t.unit === unit)) return 'It’s let or offered already.';
  if (owned.selling) return 'It’s listed for sale.';
  if (!(rent > 0)) return 'Say the rent.';
  if (rent > marketRent(sim, owned, unit) * HOME.rentCeiling) return `Nobody would pay that: it lets for about ${formatMoney(marketRent(sim, owned, unit), saveCurrency(sim.universe), { cents: false })}.`;
  return undefined;
}

/** When a tenant is found for a rent: sooner the nearer the market, three weeks or so at it. */
function tenantArrives(sim: Simulation, person: Person, owned: OwnedHome, t: Tenancy): Instant {
  const over = Math.max(0.8, t.rent / marketRent(sim, owned, t.unit));
  const days = Math.min(180, Math.round((7 + sim.rng('homes.market', person.id, owned.id, t.unit, 'tenant', t.since).next() * 28) * Math.pow(over, 6)));
  return t.since + days * MS_DAY;
}

function tenantMovesIn(sim: Simulation, person: Person, owned: OwnedHome, t: Tenancy): void {
  const checking = sim.universe.accounts[person.primaryAccountId!]!;
  const deposit = sim.openAccount({ id: sim.nextId('account'), kind: 'loan', name: `Tenant’s Deposit, ${owned.facts.address}`, ownerId: person.id, institution: 'Your Tenant', openedAt: sim.now, category: 'tenant_deposit', apr: 0 });
  sim.post({ memo: 'A tenant’s deposit', category: 'home', postings: [{ accountId: checking.id, amount: t.rent }, { accountId: deposit.id, amount: -t.rent }] });
  t.status = 'let';
  // Let, a levy spared on the promise of living in it is owed.
  claimClawback(sim, person, owned);
  delete t.tenantAt;
  t.since = sim.now;
  t.leaseEnds = sim.now + HOME.leaseMonths * 30.4375 * MS_DAY;
  t.depositAccountId = deposit.id;
  // The rest of this month's rent on moving in; the rent on the first after.
  const zone = CITIES.require(owned.cityId).timeZone;
  const p = zonedParts(sim.now, zone);
  const days = new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
  const rest = Math.round(t.rent * (days - p.day + 1) / days);
  if (rest > 0) {
    sim.post({ memo: `Rent to the month’s end, ${owned.facts.address}`, category: 'home', postings: [{ accountId: checking.id, amount: rest }, { accountId: sim.nominalAccount('income', 'Rent Received').id, amount: -rest }] });
    recordHome(person, sim.now, zone, 'rentalRent', rest);
  }
  if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'A Tenant Moved In', body: `${t.unit === 'adu' ? 'The cottage at ' : ''}${owned.facts.address}: ${formatMoney(t.rent, saveCurrency(sim.universe), { cents: false })} a month for a year, and a month’s deposit held.`, importance: 60, route: '/workspace/homes' });
}

/** A former tenant's deposit paid back, as far as the bank reaches; closed once it's all back. */
function repayDeposit(sim: Simulation, person: Person, accountId: string): void {
  const deposit = sim.universe.accounts[accountId];
  if (!deposit || deposit.balance >= 0) return;
  const draw = drawFromBank(sim, person, -deposit.balance, true);
  const paid = -deposit.balance - draw.short;
  if (paid > 0) sim.post({ memo: 'A tenant’s deposit back', category: 'home', postings: [...draw.postings, { accountId: deposit.id, amount: paid }] });
  if (deposit.balance === 0) deposit.closedAt = sim.now;
}

/** A tenant leaving: the deposit back, less any damage. */
function tenantLeaves(sim: Simulation, person: Person, owned: OwnedHome, t: Tenancy, tries: number): Money {
  const deposit = t.depositAccountId ? sim.universe.accounts[t.depositAccountId] : undefined;
  let damage = 0;
  if (deposit && deposit.balance < 0) {
    const held = -deposit.balance;
    damage = Math.round(held * HOME.damageMax * Math.max(0, sim.rng('homes.market', person.id, owned.id, t.unit, 'damage', tries).next() * 1.5 - 0.5));
    // Damage kept first; what's owed back, as far as the bank and the overdraft reach; the rest stays owed to them, paid when there's money.
    if (damage > 0) sim.post({ memo: 'Damage kept from a deposit', category: 'home', postings: [{ accountId: deposit.id, amount: damage }, { accountId: sim.nominalAccount('income', 'Damage Kept From A Deposit').id, amount: -damage }] });
    repayDeposit(sim, person, deposit.id);
    if (sim.universe.accounts[deposit.id]!.balance < 0) (owned.depositsOwed ??= []).push(deposit.id);
    if (damage > 0) owned.owed.push({ kind: 'repair', dueAt: sim.now, amount: damage, what: 'Damage A Tenant Left' });
  }
  return damage;
}

/** Each day: tenants found, rent in on the first, leases renewed or ended. */
function tenancies(sim: Simulation, person: Person, owned: OwnedHome, firstOfMonth: boolean): void {
  const cur = saveCurrency(sim.universe);
  for (const id of owned.depositsOwed ?? []) repayDeposit(sim, person, id);
  if (owned.depositsOwed) owned.depositsOwed = owned.depositsOwed.filter((id) => (sim.universe.accounts[id]?.balance ?? 0) < 0);
  const player = person.id === sim.universe.playerId;
  for (const t of [...owned.tenancies]) {
    if (t.status === 'advertised') {
      t.tenantAt ??= tenantArrives(sim, person, owned, t);
      if (sim.now >= t.tenantAt) tenantMovesIn(sim, person, owned, t);
      continue;
    }
    if (firstOfMonth && sim.now > t.since) {
      const checking = sim.universe.accounts[person.primaryAccountId!]!;
      sim.post({ memo: `Rent, ${owned.facts.address}`, category: 'home', postings: [{ accountId: checking.id, amount: t.rent }, { accountId: sim.nominalAccount('income', 'Rent Received').id, amount: -t.rent }] });
      recordHome(person, sim.now, CITIES.require(owned.cityId).timeZone, 'rentalRent', t.rent);
    }
    if (t.leaseEnds !== undefined && sim.now >= t.leaseEnds) {
      const market = marketRent(sim, owned, t.unit);
      const stays = !t.notice && t.rent <= market * 1.05 && sim.rng('homes.market', person.id, owned.id, t.unit, 'renew', t.leaseEnds).next() < HOME.renewal;
      if (stays) {
        t.rent = Math.max(t.rent, market);
        t.leaseEnds += HOME.leaseMonths * 30.4375 * MS_DAY;
        if (player) sim.notify({ category: 'home', title: 'Your Tenant Renewed', body: `${owned.facts.address}: another year at ${formatMoney(t.rent, cur, { cents: false })} a month.`, importance: 45, route: '/workspace/homes' });
        continue;
      }
      const damage = tenantLeaves(sim, person, owned, t, Math.round(t.leaseEnds / MS_DAY));
      owned.tenancies = owned.tenancies.filter((one) => one !== t);
      // A tenant leaving on their own, the landlord looks for another at the market's rent; one given notice leaves it empty.
      if (!t.notice) owned.tenancies.push({ unit: t.unit, rent: market, status: 'advertised', since: sim.now });
      if (player) sim.notify({ category: 'home', title: 'Your Tenant Moved Out', body: `${owned.facts.address}: the deposit went back${damage > 0 ? `, less ${formatMoney(damage, cur, { cents: false })} of damage` : ''}.${t.notice ? '' : ` It’s advertised again at ${formatMoney(market, cur, { cents: false })}.`}`, importance: 55, route: '/workspace/homes' });
    }
  }
}

// ---------------------------------------------------------------------------
// Upkeep

/** A worn part's chance of failing in a month, at a wear of one: it climbs with the cube of the wear. SLATE's estimates. */
const FAILURE = { monthly: 0.03, from: 0.75, cap: 0.2, repair: [0.12, 0.3] as const };
/**
 * Weather that damages, and fire, set to how often American homeowners
 * claim (the Triple-I, from ISO, 2019–2023): wind and hail 2.8 claims in a
 * hundred house-years at $14,747 on average, water and freezing 1.5 at
 * $15,400, fire 0.23 at $88,170. A storm or a gale damages a roof the
 * likelier the more worn it is, about three houses in a hundred a year at
 * middling wear on a town's twenty-odd stormy days; a hard freeze bursts the
 * pipes of an empty home or one whose heating is worn out. A roof's damage
 * is a quarter to three quarters of replacing it. They were forty times as
 * likely early on 2026-09-28, and a played year paid a house's arrears in claims.
 */
const STORM = { windKph: 55, chance: 0.0006, wornChance: 0.0012, share: [0.25, 0.75] as const };
const FREEZE = { lowC: -12, chance: 0.02, usd: [6_000, 25_000] as const };
const FIRE = { perYear: 0.0023, usd: [30_000, 150_000] as const, flat: 0.5 };

const PART_FAILS: Partial<Record<Part, string>> = {
  hvac: 'Your Heating And Cooling Failed', roof: 'Your Roof Leaked', kitchen: 'Your Kitchen Appliances Gave Out', bath: 'A Bathroom Leaked',
  windows: 'A Window Seal Failed', garageDoor: 'Your Garage Door Spring Broke', pool: 'Your Pool Pump Failed', solar: 'Your Solar Inverter Failed',
  deck: 'Your Deck Boards Rotted Through', siding: 'Your Siding Let Water In', floors: 'A Floor Buckled', door: 'Your Front Door Frame Rotted',
};

/**
 * Whether the policy is in force. A cash owner's premium owed stops it paying;
 * a mortgaged home's premium is paid from escrow by the lender even while
 * the owner is behind, as RESPA has servicers do (12 CFR 1024.17(k)), so it
 * stays in force.
 */
export const insured = (owned: OwnedHome): boolean => !owned.owed.some((one) => one.kind === 'insurance');

/** A home's day at a moment, and what it cost in repairs: the decider sweeps it. */
export function upkeepDay(sim: Simulation, person: Person, owned: OwnedHome, at: Instant): Money {
  const before = owned.owed.filter((one) => one.kind === 'repair').reduce((s, one) => s + one.amount, 0);
  upkeep(sim, person, owned, at);
  return owned.owed.filter((one) => one.kind === 'repair').reduce((s, one) => s + one.amount, 0) - before;
}

/** A home's day: worn parts that fail, and weather that damages. */
function upkeep(sim: Simulation, person: Person, owned: OwnedHome, at = sim.now): void {
  const city = CITIES.require(owned.cityId);
  const day = dateKey(at, city.timeZone);
  const cur = saveCurrency(sim.universe);
  const player = person.id === sim.universe.playerId;
  const report = (damage: Money, what: string) => claim(sim, person, owned, at, damage, what);
  const cheapest = (part: Part) => Math.min(...PROJECTS.filter((p) => p.renews === part).map((p) => projectCost(sim, owned, p)));
  for (const part of Object.keys(owned.facts.parts) as Part[]) {
    const wear = wearOf(sim, owned, part);
    if (wear < FAILURE.from || !PART_FAILS[part] || owned.works.some((w) => PROJECTS.find((p) => p.id === w.projectId)?.renews === part)) continue;
    const r = sim.rng('homes.upkeep', person.id, owned.id, day, part);
    if (r.next() >= Math.min(FAILURE.cap, FAILURE.monthly * wear ** 3) / 30) continue;
    const cost = Math.round(cheapest(part) * r.float(FAILURE.repair[0], FAILURE.repair[1]) / 100) * 100;
    owned.owed.push({ kind: 'repair', dueAt: at, amount: cost, what: PART_FAILS[part]! });
    if (player) sim.notify({ category: 'home', title: PART_FAILS[part]!, body: `At ${owned.facts.address}: ${formatMoney(cost, cur, { cents: false })} to repair, which the insurance doesn’t pay for wear. Replacing it would stop it happening again.`, importance: 70, route: '/workspace/homes' });
  }
  const flat = isFlat(owned.facts.type);
  // A fire, rare and dear: a flat's owner insures the inside, the building the rest.
  const fire = sim.rng('homes.upkeep', person.id, owned.id, day, 'fire');
  if (fire.next() < FIRE.perYear / 365) {
    report(atTown(sim, owned.cityId, fire.float(FIRE.usd[0], FIRE.usd[1]) * (flat ? FIRE.flat : 1)), 'A Fire Damaged Your Home');
  }
  if (flat) return;
  const w = weatherOn(sim, city, at);
  const r = sim.rng('homes.upkeep', person.id, owned.id, day, 'weather');
  let damage = 0;
  let what = '';
  if ((w.condition === 'Thunderstorm' || w.windKph >= STORM.windKph) && owned.facts.parts.roof !== undefined) {
    if (r.next() < STORM.chance + STORM.wornChance * Math.min(1.5, wearOf(sim, owned, 'roof'))) {
      damage = Math.round(cheapest('roof') * r.float(STORM.share[0], STORM.share[1]) / 100) * 100;
      what = w.condition === 'Thunderstorm' ? 'A Storm Damaged Your Roof' : 'A Gale Damaged Your Roof';
    }
  } else if (w.lowC <= FREEZE.lowC) {
    // Nobody there: not lived in, or its owner away, and no tenant.
    const away = livingIn(person)?.id === owned.id && person.currentLocationId !== owned.cityId;
    const empty = (away || !owned.occupied.some((o) => o.to === undefined)) && !owned.tenancies.some((t) => t.status === 'let');
    if ((empty || wearOf(sim, owned, 'hvac') >= 1) && r.next() < FREEZE.chance) {
      damage = atTown(sim, owned.cityId, r.float(FREEZE.usd[0], FREEZE.usd[1]));
      what = 'Your Pipes Froze And Burst';
    }
  }
  if (damage > 0) report(damage, what);
}

/** Damage that isn't wear: the repair owed, the insurance's share paid over the deductible, and a claim on the record. */
function claim(sim: Simulation, person: Person, owned: OwnedHome, at: Instant, damage: Money, what: string): void {
  const cur = saveCurrency(sim.universe);
  const player = person.id === sim.universe.playerId;
  owned.owed.push({ kind: 'repair', dueAt: at, amount: damage, what });
  const deductible = atTown(sim, owned.cityId, HOME.deductibleUsd);
  const pays = insured(owned) ? Math.max(0, damage - deductible) : 0;
  if (pays > 0) {
    const checking = sim.universe.accounts[person.primaryAccountId!]!;
    sim.post({ memo: `Insurance claim: ${what.toLowerCase()}`, category: 'home', postings: [{ accountId: checking.id, amount: pays }, { accountId: sim.nominalAccount('income', 'Insurance Claims').id, amount: -pays }] });
    owned.claims.push(sim.now);
    // The repair goes on a let home's costs when it's paid; what the insurer paid comes off them.
    if (letOut(owned)) recordHome(person, sim.now, CITIES.require(owned.cityId).timeZone, 'rentalCosts', -pays);
  }
  if (player) {
    sim.notify({
      category: 'home', title: what,
      body: `At ${owned.facts.address}: ${formatMoney(damage, cur, { cents: false })} of damage. ${pays > 0 ? `The insurance paid ${formatMoney(pays, cur, { cents: false })}, over its ${formatMoney(deductible, cur, { cents: false })} deductible, and the premium rises a fifth for three years.` : insured(owned) ? 'It’s under the deductible, so the insurance pays nothing.' : 'The premium is owed, so the policy paid nothing.'}`,
      importance: 80, route: '/workspace/homes',
    });
  }
}

// ---------------------------------------------------------------------------
// Buying, paying, selling

const INSPECTION_KIND = 'home.inspection';
const CLOSING_KIND = 'home.closing';
const SALE_KIND = 'home.sale_closes';
const WORKS_KIND = 'home.works_done';

const monthKey = (sim: Simulation, cityId: string, at = sim.now) => {
  const p = zonedParts(at, CITIES.require(cityId).timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}`;
};

/** Earnest money back, or kept by the seller. */
function releaseEarnest(sim: Simulation, person: Person, buying: Purchase, back: boolean): void {
  const escrow = sim.universe.accounts[buying.escrowAccountId];
  if (!escrow || escrow.balance <= 0) return;
  const to = back ? sim.universe.accounts[person.primaryAccountId!]!.id : sim.nominalAccount('expense', 'Earnest Money Forfeited').id;
  sim.post({ memo: back ? 'Earnest money back' : 'Earnest money kept by the seller', category: 'home', postings: [{ accountId: escrow.id, amount: -escrow.balance }, { accountId: to, amount: escrow.balance }] });
  escrow.closedAt = sim.now;
}

function cancelScheduled(sim: Simulation, person: Person, kinds: string[], homeId?: string): void {
  for (const one of sim.universe.scheduled) {
    if (one.status === 'pending' && kinds.includes(one.kind) && one.payload.personId === person.id && (homeId === undefined || one.payload.homeId === homeId)) sim.timeline.cancel(one.id, sim.now);
  }
}

/** An offer accepted: the earnest into escrow, the inspection and the closing on the calendar. */
function accept(sim: Simulation, person: Person, listing: Listing, price: Money, down: number, live: boolean, inspect: boolean): Purchase {
  const earnest = Math.round(price * HOME.earnest);
  const escrow = sim.openAccount({ id: sim.nextId('account'), kind: 'escrow', name: 'Earnest Money', ownerId: person.id, institution: 'The Title Company', openedAt: sim.now, category: 'earnest' });
  sim.post({ memo: `Earnest money on ${listing.address}`, category: 'home', postings: [...drawFromBank(sim, person, earnest, false, true).postings, { accountId: escrow.id, amount: earnest }] });
  const facts: HomeFacts = structuredClone({
    type: listing.type, address: listing.address, beds: listing.beds, baths: listing.baths, size: listing.size,
    ...(listing.lot !== undefined ? { lot: listing.lot } : {}), built: listing.built, features: listing.features, parts: listing.parts, hoaUsd: listing.hoaUsd,
    ...(listing.fixtures ? { fixtures: listing.fixtures } : {}),
  });
  const buying: Purchase = {
    listingId: listing.id, cityId: listing.cityId, facts, price, down, live, inspect, offeredAt: sim.now,
    closesAt: sim.now + HOME.closingDays * MS_DAY, earnest, escrowAccountId: escrow.id,
    ...(inspect ? { inspectionUntil: sim.now + HOME.inspectionDays * MS_DAY } : {}),
  };
  person.buying = buying;
  delete person.counter;
  if (inspect) sim.schedule({ at: sim.now + HOME.reportDays * MS_DAY, kind: INSPECTION_KIND, label: `The Inspection Of ${listing.address}`, category: 'home', priority: 30, payload: { personId: person.id } });
  sim.schedule({ at: buying.closesAt, kind: CLOSING_KIND, label: `Closing On ${listing.address}`, category: 'home', priority: 30, payload: { personId: person.id } });
  return buying;
}

function inspection(sim: Simulation, person: Person): void {
  const buying = person.buying;
  if (!buying) return;
  const fee = atTown(sim, buying.cityId, HOME.inspectionFeeUsd);
  // Paid the way anything is, the card where the bank can't; with neither, the inspector doesn't come.
  if (!spend(sim, person, fee, 'Home inspection', 'home')) {
    if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'The Inspection Didn’t Happen', body: `The inspector's ${formatMoney(fee, saveCurrency(sim.universe), { cents: false })} couldn't be paid, so there's no report. You can still call the purchase off before ${formatDate(buying.inspectionUntil!, CITIES.require(buying.cityId).timeZone)}.`, importance: 75, route: '/workspace/homes' });
    return;
  }
  buying.inspectedAt = sim.now;
  const year = yearIn(sim, buying.cityId);
  const worn = (Object.entries(buying.facts.parts) as [Part, number][]).filter(([part, put]) => (year - put) / lifeOf(buying.facts, part) >= 1).map(([part]) => part);
  if (person.id === sim.universe.playerId) {
    sim.notify({ category: 'home', title: 'The Inspection Report', body: `${buying.facts.address}: ${worn.length ? `worn out, ${worn.map((p) => p === 'hvac' ? 'the heating and cooling' : p === 'garageDoor' ? 'the garage door' : `the ${p === 'bath' ? 'bathrooms' : p}`).join(', ')}` : 'nothing worn out'}. Every part’s age is on the Homes screen. You can walk away with your earnest money back until ${formatDate(buying.inspectionUntil!, CITIES.require(buying.cityId).timeZone)}.`, importance: 75, route: '/workspace/homes' });
  }
}

/** Whether a home is the one they live in now, in the list of when they have. */
function occupy(sim: Simulation, owned: OwnedHome): void {
  owned.occupied.push({ from: sim.now });
}

function close(sim: Simulation, person: Person): void {
  const buying = person.buying;
  if (!buying) return;
  delete person.buying;
  const cur = saveCurrency(sim.universe);
  const player = person.id === sim.universe.playerId;
  const fail = (body: string, back: boolean) => {
    releaseEarnest(sim, person, buying, back);
    if (player) sim.notify({ category: 'home', title: 'The Purchase Fell Through', body: `${body} ${back ? 'Your earnest money came back.' : 'The seller kept your earnest money.'}`, importance: 85, route: '/workspace/homes' });
  };
  const price = buying.price;
  const pseudo = { ...buying.facts, id: buying.listingId, cityId: buying.cityId, rank: 0, value: price, listedAt: buying.offeredAt } satisfies Listing;
  const offer = offerFor(sim, person, pseudo, buying.down, price, buying.live);
  // The financing contingency: a loan the lender won't make gives the earnest back.
  const lender = lenderRefusal(sim, person, buying.cityId, offer, undefined, !buying.live);
  if (lender) { fail(`The lender wouldn’t lend: ${lender}`, true); return; }
  const escrow = sim.universe.accounts[buying.escrowAccountId];
  const earnest = Math.max(0, escrow?.balance ?? 0);
  const draw = drawFromBank(sim, person, offer.cash - earnest, false, true);
  if (draw.short > 0) { fail(`The bank didn’t hold the ${formatMoney(offer.cash, cur, { cents: false })} it takes to close.`, false); return; }
  const country = CITIES.require(buying.cityId).countryId;
  let mortgage: Loan | undefined;
  const postings = [...draw.postings, { accountId: sim.nominalAccount('expense', 'Closing Costs').id, amount: offer.closing }];
  if (escrow && earnest > 0) { postings.push({ accountId: escrow.id, amount: -earnest }); escrow.closedAt = sim.now; }
  if (offer.loan > 0) {
    const account = sim.openAccount({ id: sim.nextId('account'), kind: 'mortgage', name: `Mortgage, ${buying.facts.address}`, ownerId: person.id, institution: 'Your Lender', openedAt: sim.now, category: 'mortgage', apr: offer.rate });
    const months = termsIn(country).years * 12;
    mortgage = { accountId: account.id, rate: offer.rate, payment: paymentFor(offer.loan, offer.rate, months), original: price, pmi: country === 'us' && buying.live && offer.loan > price * HOME.pmiOver };
    postings.push({ accountId: account.id, amount: -offer.loan });
  }
  // The home leaves the ledger at its price: the seller's, paid.
  postings.push({ accountId: sim.nominalAccount('asset_value', 'Homes Bought').id, amount: price });
  sim.post({ memo: `Bought ${buying.facts.address}`, category: 'home', postings });
  const owned: OwnedHome = {
    // Numbered by how many they've bought: the first is home-1, which an older save's single home became.
    id: `home-${(person.homesOwned ?? 0) + 1}`, listingId: buying.listingId, cityId: buying.cityId, facts: buying.facts, boughtAt: sim.now, price, closing: offer.closing,
    investment: !buying.live, ...(mortgage ? { mortgage } : {}), improvements: [], works: [], owed: [], billedThrough: monthKey(sim, buying.cityId),
    occupied: [], tenancies: [], claims: [], depreciated: 0, bare: true,
  };
  // Without a lender, the first year's insurance is bought at closing.
  if (!mortgage) owned.owed.push({ kind: 'insurance', dueAt: sim.now, amount: ownedMonthFor(sim, owned).insurance * 12 });
  homesOf(person).push(owned);
  person.homesOwned = (person.homesOwned ?? 0) + 1;
  let back = 0;
  // Bought to live in, where they still live; a move to another city since leaves it standing empty.
  const stillHere = buying.cityId === (person.home?.cityId ?? person.currentLocationId);
  if (buying.live && stillHere) back = moveInto(sim, person, owned);
  if (player) {
    sim.notify({ category: 'home', title: 'The Keys Are Yours', body: `You closed on ${buying.facts.address}: ${formatMoney(price, cur, { cents: false })}${offer.loan > 0 ? `, ${formatMoney(offer.loan, cur, { cents: false })} of it on a mortgage at ${(offer.rate * 100).toFixed(3)}%` : ', in cash'}.${back > 0 ? ` Your rental deposit came back: ${formatMoney(back, cur, { cents: false })}.` : ''}`, importance: 85, route: '/workspace/homes' });
  }
}

/** A home's month, before it's on their list. */
const ownedMonthFor = (sim: Simulation, owned: OwnedHome): OwnerMonth => monthOf(sim, owned.facts, owned.cityId, owned.price);

/**
 * A house they built, owned from its completion (`systems/construction.ts`):
 * worth what the land and the building cost, moving with the town's market
 * from then, its permits and levies its closing costs, and its first year's
 * insurance bought then, as a cash buyer's is.
 */
export function ownBuilt(sim: Simulation, person: Person, spec: { cityId: string; facts: HomeFacts; price: Money; closing: Money; clawback?: OwnedHome['clawback'] }): OwnedHome {
  const owned: OwnedHome = {
    id: `home-${(person.homesOwned ?? 0) + 1}`, listingId: `built-${sim.now}`, cityId: spec.cityId, facts: spec.facts, boughtAt: sim.now, price: spec.price, closing: spec.closing,
    investment: false, improvements: [], works: [], owed: [], billedThrough: monthKey(sim, spec.cityId), occupied: [], tenancies: [], claims: [], depreciated: 0, bare: true,
    ...(spec.clawback ? { clawback: spec.clawback } : {}),
  };
  owned.owed.push({ kind: 'insurance', dueAt: sim.now, amount: ownedMonthFor(sim, owned).insurance * 12 });
  homesOf(person).push(owned);
  person.homesOwned = (person.homesOwned ?? 0) + 1;
  return owned;
}

/** A spared levy, owed now if the home is sold or let within its years. */
function claimClawback(sim: Simulation, person: Person, owned: OwnedHome): void {
  const c = owned.clawback;
  if (!c) return;
  delete owned.clawback;
  if (sim.now >= c.until) return;
  if (!payFromBank(sim, person, c.amount, c.memo, 'home')) owe(sim, person, c.amount, c.memo, 'home');
}

/** An empty home of theirs in a town, to move into before renting or a sofa: not let, not being sold, not the one they're in. */
export function emptyHomeIn(person: Person, cityId: string): OwnedHome | undefined {
  return (person.homes ?? []).find((h) => h.cityId === cityId && h.id !== livingIn(person)?.id && !h.selling && h.foreclosureAt === undefined
    && !h.tenancies.some((t) => t.unit === 'main' && t.status === 'let'));
}

/** Moves them into a home they own, from anywhere: `moveInto`, and the day on its clock. */
export function moveIntoOwned(sim: Simulation, person: Person, owned: OwnedHome): void {
  person.currentLocationId = owned.cityId;
  moveInto(sim, person, owned);
  if (person.id === sim.universe.playerId) rehome(sim, CITIES.require(owned.cityId).timeZone);
}

/** Moves them into a home they own: the lease on a rented one ends, a home they owned and lived in is left empty. */
function moveInto(sim: Simulation, person: Person, owned: OwnedHome): Money {
  refundRentAhead(sim, person);
  const back = person.home?.kind === 'shared' || person.home?.kind === 'own' ? leaseEnds(sim, person) : 0;
  leaveOwnedHome(sim, person);
  owned.tenancies = owned.tenancies.filter((t) => t.unit !== 'main');
  occupy(sim, owned);
  const left = person.home?.cityId;
  person.home = { kind: 'owned', cityId: owned.cityId, homeId: owned.id, since: sim.now, ...(person.home?.fedOn !== undefined ? { fedOn: person.home.fedOn } : {}) };
  // Movers, or one's own van, bring one's own bed and sofa (`systems/furniture.ts`), and then the car comes along where a road reaches (`systems/vehicles.ts`).
  if (left) { carryFurniture(sim, person, left, owned.cityId); carryCars(sim, person, left, owned.cityId); carryBoat(sim, person, left, owned.cityId); }
  scheduleRentFor(sim, person);
  return back;
}

/** Ends a lease: the deposit back, less what's owed. */
function leaseEnds(sim: Simulation, person: Person): Money {
  const held = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.kind === 'escrow' && a.category === 'deposit' && !a.closedAt && a.balance > 0);
  const checking = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
  if (!held || !checking) return 0;
  const owed = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.kind === 'loan' && a.category === 'arrears' && a.balance < 0);
  const against = Math.min(held.balance, owed ? -owed.balance : 0);
  const back = held.balance - against;
  const postings = [{ accountId: held.id, amount: -held.balance }, { accountId: checking.id, amount: back }];
  if (against > 0) postings.push({ accountId: owed!.id, amount: against });
  sim.post({ memo: 'Deposit back', category: 'rent', postings });
  return back;
}

/** Whether a home is let now, or offered to let, in the whole. */
const letOut = (owned: OwnedHome): boolean => owned.tenancies.some((t) => t.unit === 'main');

/** Bills the month's payments on the first, and the year's where they fall; and a let home's depreciation. */
/**
 * Of an American home its owner lives in, the share let to lodgers, from
 * 2026-10-01, as IRS Publication 527 (2025) divides one: by floor area, the
 * rented room's against the home's, its own example a 180 sq ft room in an
 * 1,800 sq ft house. SLATE keeps no room's size, so each lodger's room is
 * taken at the example's 180 sq ft. That share of the home's interest,
 * property tax, insurance and repairs is set against the rent on the return,
 * and that share of the building depreciated, rather than taken as a
 * homeowner's deduction. Until then the rent was taxed whole.
 */
export const LODGER_ROOM_SQFT = 180;
export function lodgerShare(owned: OwnedHome): number {
  const n = owned.lodgers?.length ?? 0;
  if (n === 0 || CITIES.get(owned.cityId)?.countryId !== 'us' || !(owned.facts.size > 0)) return 0;
  return Math.min(1, (n * LODGER_ROOM_SQFT) / owned.facts.size);
}

function bill(sim: Simulation, person: Person, owned: OwnedHome): void {
  const key = monthKey(sim, owned.cityId);
  if (key <= owned.billedThrough) return;
  owned.billedThrough = key;
  const month = ownedMonth(sim, owned);
  const due = sim.now;
  const m = Number(key.slice(5));
  if (owned.mortgage && loanBalance(sim, owned) > 0) {
    const balance = loanBalance(sim, owned);
    owned.owed.push({ kind: 'mortgage', dueAt: due, amount: Math.min(owned.mortgage.payment, balance + Math.round(balance * owned.mortgage.rate / 12)), escrow: { tax: inEngland(owned.cityId) ? 0 : month.tax, insurance: month.insurance, pmi: month.pmi } });
    // The months the lender escrowed, for the tax halves after a payoff; a year of them is all that's kept.
    owned.escrowed = [...(owned.escrowed ?? []).filter((k) => Number(k.slice(0, 4)) >= Number(key.slice(0, 4)) - 1), key];
  } else {
    // No lender to escrow them: the tax in halves, April and October, less the months a lender escrowed this half-year, and the insurance a year at a time.
    if (!inEngland(owned.cityId) && (m === 4 || m === 10)) {
      const half = m === 4 ? [1, 6] : [7, 12];
      const year = Number(key.slice(0, 4));
      const escrowed = (owned.escrowed ?? []).filter((k) => Number(k.slice(0, 4)) === year && Number(k.slice(5)) >= half[0]! && Number(k.slice(5)) <= half[1]!).length;
      if (6 - escrowed > 0) owned.owed.push({ kind: 'tax', dueAt: due, amount: month.tax * (6 - escrowed) });
    }
    if (m === zonedParts(owned.boughtAt, CITIES.require(owned.cityId).timeZone).month) owned.owed.push({ kind: 'insurance', dueAt: due, amount: month.insurance * 12 });
  }
  if (owned.equity && owedOn(sim, owned.equity) > 0) {
    const balance = owedOn(sim, owned.equity);
    owned.owed.push({ kind: 'equity', dueAt: due, amount: Math.min(owned.equity.payment, balance + Math.round(balance * owned.equity.rate / 12)) });
  }
  // England's council tax, ten instalments from April, on a home they live in or leave empty; a tenant pays their own.
  if (inEngland(owned.cityId) && (m >= 4 || m === 1) && !owned.tenancies.some((t) => t.unit === 'main' && t.status === 'let')) {
    owned.owed.push({ kind: 'council', dueAt: due, amount: Math.round(councilTaxYear(sim, councilBand(sim, homeValue(sim, owned), owned.cityId), true, 1, owned.cityId) / COUNCIL_TAX.instalments) });
  }
  if (month.hoa > 0) owned.owed.push({ kind: 'hoa', dueAt: due, amount: month.hoa });
  // A home let is depreciated a month at a time: its building, over 27.5 years; a cottage let, its own cost.
  const zone = CITIES.require(owned.cityId).timeZone;
  const cottage = owned.improvements.filter((i) => i.projectId === 'adu').reduce((s, i) => s + i.cost, 0);
  const basis = owned.price + owned.closing + owned.improvements.reduce((s, i) => s + i.cost, 0) - cottage;
  for (const t of owned.tenancies.filter((one) => one.status === 'let')) {
    const building = t.unit === 'main' ? basis * HOME_TAX.buildingShare : cottage;
    const month1 = Math.round(building / HOME_TAX.depreciationYears / 12);
    if (month1 <= 0) continue;
    owned.depreciated += month1;
    recordHome(person, sim.now, zone, 'rentalCosts', month1);
  }
  // The lodgers' rooms' share of the building, depreciated as a let home's is (from 2026-10-01).
  const lodged = letOut(owned) ? 0 : lodgerShare(owned);
  const roomMonth = Math.round((basis * HOME_TAX.buildingShare * lodged) / HOME_TAX.depreciationYears / 12);
  if (roomMonth > 0) {
    owned.depreciated += roomMonth;
    recordHome(person, sim.now, zone, 'rentalCosts', roomMonth);
  }
}

const EXPENSE: Record<Installment['kind'], string> = { mortgage: 'Mortgage Interest', equity: 'Home Equity Interest', tax: 'Property Tax', insurance: 'Home Insurance', hoa: 'Shared Charges', repair: 'Home Repairs', council: 'Council Tax' };
const LOANS: readonly Installment['kind'][] = ['mortgage', 'equity'];
const escrowOf = (one: Installment): Money => (one.escrow ? one.escrow.tax + one.escrow.insurance + one.escrow.pmi : 0);

/** Pays what's owed on a home, oldest first, while the bank can pay each in full: the return and the record read each. */
function payOwed(sim: Simulation, person: Person, owned: OwnedHome): void {
  const zone = CITIES.require(owned.cityId).timeZone;
  const american = CITIES.require(owned.cityId).countryId === 'us';
  const rental = letOut(owned);
  // The lender's first, oldest first, then the rest: a contractor's bill doesn't hold up the mortgage, and each is paid when the bank can pay it whole.
  const order = [...owned.owed].sort((x, y) => Number(!LOANS.includes(x.kind)) - Number(!LOANS.includes(y.kind)) || x.dueAt - y.dueAt);
  for (const one of order) {
    const total = one.amount + escrowOf(one);
    const draw = drawFromBank(sim, person, total);
    if (draw.short > 0) continue;
    const postings = [...draw.postings];
    let interest = 0;
    let deductible = 0;
    const loan = one.kind === 'mortgage' ? owned.mortgage : one.kind === 'equity' ? owned.equity : undefined;
    if (loan) {
      const account = accountOf(sim, loan)!;
      const balance = Math.max(0, -account.balance);
      interest = Math.round(balance * loan.rate / 12);
      // The return takes interest on up to $750,000 borrowed to buy a main home and one second home, all of it together.
      const cap = exchange(HOME_TAX.acquisitionCap, 'USD', saveCurrency(sim.universe)) ?? HOME_TAX.acquisitionCap;
      const kept = (person.homes ?? []).filter((h) => !letOut(h) && h.mortgage).sort((a, b) => Number(livingIn(person)?.id !== a.id) - Number(livingIn(person)?.id !== b.id)).slice(0, 2);
      const borrowed = kept.reduce((sum, h) => sum + owedOn(sim, h.mortgage), 0);
      deductible = kept.some((h) => h.id === owned.id) ? Math.round(interest * Math.min(1, cap / Math.max(1, borrowed))) : 0;
      postings.push({ accountId: account.id, amount: one.amount - interest }, { accountId: sim.nominalAccount('expense', EXPENSE[one.kind]).id, amount: interest });
      if (one.escrow?.tax) postings.push({ accountId: sim.nominalAccount('expense', EXPENSE.tax).id, amount: one.escrow.tax });
      if (one.escrow?.insurance) postings.push({ accountId: sim.nominalAccount('expense', EXPENSE.insurance).id, amount: one.escrow.insurance });
      if (one.escrow?.pmi) postings.push({ accountId: sim.nominalAccount('expense', 'Mortgage Insurance').id, amount: one.escrow.pmi });
      // On time, it counts on the record as a card's payment does.
      if (sim.now - one.dueAt < HOME.reportLateDays * MS_DAY && person.credit) person.credit.score = Math.min(850, person.credit.score + HOME.onTimeRise);
    } else {
      postings.push({ accountId: sim.nominalAccount('expense', EXPENSE[one.kind]).id, amount: one.amount });
    }
    sim.post({ memo: one.what ?? (loan ? `${one.kind === 'mortgage' ? 'Mortgage' : 'Home equity loan'} payment, ${owned.facts.address}` : `${EXPENSE[one.kind]}, ${owned.facts.address}`), category: 'home', postings });
    owned.owed = owned.owed.filter((x) => x !== one);
    // What the return reads: a let home's costs against its rent; a kept home's mortgage interest and American property tax.
    const tax = one.kind === 'tax' ? one.amount : one.escrow?.tax ?? 0;
    const costs = interest + tax + (one.escrow?.insurance ?? 0) + (one.escrow?.pmi ?? 0) + (loan ? 0 : one.kind === 'tax' ? 0 : one.amount);
    if (rental) {
      recordHome(person, sim.now, zone, 'rentalCosts', costs);
    } else {
      // A lodger's room takes its share against the rent, the rest a homeowner's (Publication 527, from 2026-10-01).
      const share = lodgerShare(owned);
      const kept = (x: number) => Math.round(x * (1 - share));
      if (share > 0) recordHome(person, sim.now, zone, 'rentalCosts', Math.round(costs * share));
      if (one.kind === 'mortgage') recordHome(person, sim.now, zone, 'homeInterest', kept(deductible));
      if (american && tax > 0) recordHome(person, sim.now, zone, 'homeTax', kept(tax));
      if (one.escrow?.pmi) recordHome(person, sim.now, zone, 'homePmi', kept(one.escrow.pmi));
    }
    dropPmi(sim, owned);
    paidOff(sim, owned);
  }
  if (!owned.owed.some((one) => LOANS.includes(one.kind))) delete owned.foreclosureAt;
}

/**
 * A mortgage paid off: escrow ends, so the insurance from now to the policy's
 * anniversary is paid by the owner, who pays it yearly from then on.
 */
function paidOff(sim: Simulation, owned: OwnedHome): void {
  if (!owned.mortgage || loanBalance(sim, owned) > 0 || owned.mortgage.paidOffAt !== undefined) return;
  owned.mortgage.paidOffAt = sim.now;
  const zone = CITIES.require(owned.cityId).timeZone;
  const now = zonedParts(sim.now, zone).month;
  const anniversary = zonedParts(owned.boughtAt, zone).month;
  const months = ((anniversary - now) % 12 + 12) % 12;
  if (months > 0) owned.owed.push({ kind: 'insurance', dueAt: sim.now, amount: ownedMonth(sim, owned).insurance * months });
}

/** Mortgage insurance ends when the loan falls to 78% of what the home cost. */
function dropPmi(sim: Simulation, owned: OwnedHome): void {
  if (owned.mortgage?.pmi && loanBalance(sim, owned) <= owned.mortgage.original * HOME.pmiEnds) owned.mortgage.pmi = false;
}

/** The fee fifteen days late, the record at thirty, foreclosure begun at 120, and the sale at 210. */
function chase(sim: Simulation, person: Person, owned: OwnedHome): void {
  const cur = saveCurrency(sim.universe);
  const player = person.id === sim.universe.playerId;
  for (const one of owned.owed) {
    const late = (sim.now - one.dueAt) / MS_DAY;
    if (late >= HOME.graceDays && !one.feeCharged && one.kind !== 'repair') {
      one.feeCharged = true;
      const fee = Math.round(one.amount * HOME.lateFee);
      const account = one.kind === 'mortgage' ? accountOf(sim, owned.mortgage) : one.kind === 'equity' ? accountOf(sim, owned.equity) : undefined;
      if (account && fee > 0) sim.post({ memo: 'Late fee', category: 'home', postings: [{ accountId: account.id, amount: -fee }, { accountId: sim.nominalAccount('expense', 'Late Fees').id, amount: fee }] });
      else if (fee > 0) one.amount += fee;
      if (player) sim.notify({ category: 'home', title: 'A Late Fee', body: `${EXPENSE[one.kind] === 'Mortgage Interest' ? 'Your mortgage payment' : one.kind === 'equity' ? 'Your home equity loan payment' : `The ${EXPENSE[one.kind].toLowerCase()}`} on ${owned.facts.address} is fifteen days late: ${formatMoney(fee, cur)} on it.`, importance: 80, route: '/workspace/homes' });
    }
    if ((one.kind === 'mortgage' || one.kind === 'equity') && late >= HOME.reportLateDays && !one.reported) {
      one.reported = true;
      if (person.credit) { markRecord(person, HOME.reportedFall, sim.now, owned.cityId); person.credit.late.push(sim.now); }
      if (player) sim.notify({ category: 'home', title: 'A Late Payment Is On Your Record', body: `Thirty days late on ${owned.facts.address}, the lender reported it.`, importance: 85, route: '/workspace/homes' });
    }
  }
  const oldest = owned.owed.find((one) => one.kind === 'mortgage' || one.kind === 'equity');
  if (!oldest) return;
  const late = (sim.now - oldest.dueAt) / MS_DAY;
  if (late >= HOME.foreclosureStarts && owned.foreclosureAt === undefined) {
    owned.foreclosureAt = oldest.dueAt + HOME.foreclosureSale * MS_DAY;
    if (player) sim.notify({ category: 'home', title: 'Foreclosure', body: `The lender has begun to foreclose on ${owned.facts.address}. Pay what’s owed before ${formatDate(owned.foreclosureAt, CITIES.require(owned.cityId).timeZone)}, or it’s sold.`, importance: 95, route: '/workspace/homes' });
  }
  if (owned.foreclosureAt !== undefined && sim.now >= owned.foreclosureAt) foreclose(sim, person, owned);
}

/** What's owed on a home beyond the loans' principal: the other payments whole, and a loan payment's interest and escrow. */
function owedBeyondLoans(sim: Simulation, owned: OwnedHome): Money {
  const interest = (loan?: Loan) => (loan ? Math.round(owedOn(sim, loan) * loan.rate / 12) : 0);
  return owned.owed.reduce((sum, one) => sum + (one.kind === 'mortgage' ? interest(owned.mortgage) + escrowOf(one) : one.kind === 'equity' ? interest(owned.equity) : one.amount), 0);
}

/** A tenant's deposit, which a sale pays back. */
const depositsHeld = (sim: Simulation, owned: OwnedHome): Money =>
  owned.tenancies.reduce((sum, t) => sum + Math.max(0, -(t.depositAccountId ? sim.universe.accounts[t.depositAccountId]?.balance ?? 0 : 0)), 0);

/** A sale's money: the loans paid off, what's owed and the tenants' deposits, the rest to checking, anything short to collections. */
function settleSale(sim: Simulation, person: Person, owned: OwnedHome, sale: Money, costs: Money, memo: string): Money {
  const checking = sim.universe.accounts[person.primaryAccountId!]!;
  const owedOther = owedBeyondLoans(sim, owned);
  const postings: { accountId: string; amount: Money }[] = [{ accountId: sim.nominalAccount('asset_value', 'Homes Sold').id, amount: -sale }];
  if (costs > 0) postings.push({ accountId: sim.nominalAccount('expense', 'Selling Costs').id, amount: costs });
  let left = sale - costs - owedOther;
  for (const loan of [owned.mortgage, owned.equity]) {
    const account = accountOf(sim, loan);
    const balance = owedOn(sim, loan);
    if (account && balance > 0) { postings.push({ accountId: account.id, amount: balance }); left -= balance; }
    if (account) account.closedAt = sim.now;
  }
  for (const t of owned.tenancies) {
    const deposit = t.depositAccountId ? sim.universe.accounts[t.depositAccountId] : undefined;
    if (deposit && deposit.balance < 0) { postings.push({ accountId: deposit.id, amount: -deposit.balance }); left -= -deposit.balance; deposit.closedAt = sim.now; }
  }
  if (owedOther > 0) postings.push({ accountId: sim.nominalAccount('expense', 'Owed On The Home').id, amount: owedOther });
  if (left >= 0) postings.push({ accountId: checking.id, amount: left });
  else {
    const collections = sim.openAccount({ id: sim.nextId('account'), kind: 'loan', name: 'Mortgage Shortfall', ownerId: person.id, institution: 'A Collection Agency', openedAt: sim.now, category: 'collections', apr: 0 });
    postings.push({ accountId: collections.id, amount: left });
  }
  sim.post({ memo, category: 'home', postings });
  return left;
}

/** Days they lived in a home in the five years to a moment. */
function livedDays(owned: OwnedHome, at: Instant): number {
  const from = at - HOME_TAX.exclusionWindowYears * YEAR_MS;
  return owned.occupied.reduce((sum, o) => sum + Math.max(0, Math.min(o.to ?? at, at) - Math.max(o.from, from)) / MS_DAY, 0);
}

/** A sale's gain on the return: what it realized less what the home cost them, less the gain a main home's owner keeps free. */
function recordGain(sim: Simulation, person: Person, owned: OwnedHome, sale: Money, costs: Money): void {
  if (CITIES.require(owned.cityId).countryId !== 'us') return;
  const basis = owned.price + owned.closing + owned.improvements.reduce((s, i) => s + i.cost, 0) - owned.depreciated;
  const gain = sale - costs - basis;
  if (gain <= 0) return;
  const owns2 = sim.now - owned.boughtAt >= HOME_TAX.exclusionDays * MS_DAY;
  const lastUsed = person.exclusionUsedAt;
  const may = owns2 && livedDays(owned, sim.now) >= HOME_TAX.exclusionDays && (lastUsed === undefined || sim.now - lastUsed >= HOME_TAX.exclusionDays * MS_DAY);
  const cur = saveCurrency(sim.universe);
  // The part of the gain that is depreciation taken while it was let isn't excluded (§121(d)(6)); and the share of
  // the years owned before they first lived in it, let or empty, isn't either (§121(b)(5), nonqualified use).
  const first = owned.occupied.length ? Math.min(...owned.occupied.map((o) => o.from)) : sim.now;
  const nonqualified = Math.min(1, Math.max(0, first - owned.boughtAt) / Math.max(1, sim.now - owned.boughtAt));
  const excludable = Math.max(0, (gain - owned.depreciated) * (1 - nonqualified));
  const free = may ? Math.min(excludable, exchange(HOME_TAX.exclusion, 'USD', cur) ?? HOME_TAX.exclusion) : 0;
  if (free > 0) person.exclusionUsedAt = sim.now;
  const zone = CITIES.require(owned.cityId).timeZone;
  if (free > 0) recordHome(person, sim.now, zone, 'homeGainExcluded', free);
  const taxable = gain - free;
  if (taxable <= 0) return;
  if (sim.now - owned.boughtAt <= YEAR_MS) { recordHome(person, sim.now, zone, 'homeGainShort', taxable); return; }
  // Of a long-term gain, the depreciation taken is taxed as income to 25% (§1(h)(6), unrecaptured §1250 gain), the rest at the gain rates.
  const recaptured = Math.min(taxable, owned.depreciated);
  if (recaptured > 0) recordHome(person, sim.now, zone, 'homeGain1250', recaptured);
  if (taxable > recaptured) recordHome(person, sim.now, zone, 'homeGain', taxable - recaptured);
}

/** The home sold at a forced sale's discount; the loans and what's owed paid from it; the rest theirs, or short with collections. */
function foreclose(sim: Simulation, person: Person, owned: OwnedHome): void {
  const cur = saveCurrency(sim.universe);
  const sale = Math.round(homeValue(sim, owned) * HOME.forcedSale);
  // A foreclosure is a sale, and its gain is on the return like any other's.
  recordGain(sim, person, owned, sale, 0);
  if (owned.depreciated > 0) recordHome(person, sim.now, CITIES.require(owned.cityId).timeZone, 'rentalDisposed', 1);
  const left = settleSale(sim, person, owned, sale, 0, `Foreclosure sale, ${owned.facts.address}`);
  markRecord(person, HOME.foreclosureFall, sim.now, owned.cityId);
  const lived = livingIn(person)?.id === owned.id;
  person.homes = homesOf(person).filter((h) => h !== owned);
  cancelScheduled(sim, person, [WORKS_KIND, SALE_KIND], owned.id);
  if (lived) {
    const own = emptyHomeIn(person, owned.cityId);
    if (own) moveInto(sim, person, own);
    else person.home = { kind: 'sofa', cityId: owned.cityId, since: sim.now };
  }
  if (person.id === sim.universe.playerId) {
    sim.notify({ category: 'home', title: 'Your Home Was Sold', body: `The lender foreclosed on ${owned.facts.address} and sold it for ${formatMoney(sale, cur, { cents: false })}. ${left >= 0 ? `${formatMoney(left, cur, { cents: false })} of it was yours.` : `It left ${formatMoney(-left, cur, { cents: false })} unpaid, which is with collections.`} It’s on your record${lived ? ', and you’re on a friend’s sofa' : ''}.`, importance: 95, route: '/workspace/homes' });
  }
}

/** Why listing a home can't be done, or nothing where it can. */
export function sellRefusal(sim: Simulation, person: Person, owned: OwnedHome): string | undefined {
  if (owned.selling) return 'It’s listed already.';
  if (owned.works.length > 0) return 'Finish the work first.';
  if (owned.foreclosureAt !== undefined) return 'The lender is foreclosing.';
  const net = saleNet(sim, owned);
  if (net < 0 && inTheBank(sim, person) < -net) return `It would sell for less than you owe on it, by ${formatMoney(-net, saveCurrency(sim.universe), { cents: false })}, which the bank can’t make up.`;
  return undefined;
}

/** What a sale leaves now: the value, less the agents' and closing costs, the loans, what's owed and the tenants' deposits. */
export function saleNet(sim: Simulation, owned: OwnedHome): Money {
  const value = homeValue(sim, owned);
  const costs = Math.round(value * termsIn(CITIES.require(owned.cityId).countryId).selling);
  return value - costs - owedOn(sim, owned.mortgage) - owedOn(sim, owned.equity) - owedBeyondLoans(sim, owned) - depositsHeld(sim, owned);
}

function saleCloses(sim: Simulation, person: Person, owned: OwnedHome): void {
  if (!owned.selling) return;
  const then = owned.selling.then;
  payOwed(sim, person, owned);
  const value = homeValue(sim, owned);
  const costs = Math.round(value * termsIn(CITIES.require(owned.cityId).countryId).selling);
  const loans = owedOn(sim, owned.mortgage) + owedOn(sim, owned.equity);
  const cur = saveCurrency(sim.universe);
  recordGain(sim, person, owned, value, costs);
  if (owned.depreciated > 0) recordHome(person, sim.now, CITIES.require(owned.cityId).timeZone, 'rentalDisposed', 1);
  settleSale(sim, person, owned, value, costs, `Sold ${owned.facts.address}`);
  const lived = livingIn(person)?.id === owned.id;
  person.homes = homesOf(person).filter((h) => h !== owned);
  let refusal: string | undefined;
  if (lived) {
    const own = emptyHomeIn(person, owned.cityId);
    if (own) moveInto(sim, person, own);
    else {
      person.home = { kind: 'sofa', cityId: owned.cityId, since: sim.now };
      refusal = moveRefusal(sim, person, then ?? 'own', owned.cityId);
      if (!refusal) move(sim, person, then ?? 'own', owned.cityId);
    }
  }
  if (person.id === sim.universe.playerId) {
    sim.notify({ category: 'home', title: 'Your Home Is Sold', body: `${owned.facts.address} sold for ${formatMoney(value, cur, { cents: false })}; ${formatMoney(costs, cur, { cents: false })} went to the agents and the closing${loans > 0 ? `, and ${formatMoney(loans, cur, { cents: false })} paid off what was borrowed on it` : ''}.${refusal ? ` You couldn’t rent yet: ${refusal}` : ''}`, importance: 85, route: '/workspace/homes' });
  }
}

// ---------------------------------------------------------------------------
// Borrowing against a home

/** The most a home equity loan on a home can be now. */
export function equityRoom(sim: Simulation, owned: OwnedHome): Money {
  if (owned.equity && owedOn(sim, owned.equity) > 0) return 0;
  return Math.max(0, Math.floor((homeValue(sim, owned) * HOME.equityCeiling - loanBalance(sim, owned)) / 100_00) * 100_00);
}

export function equityRate(person: Person, owned: OwnedHome, sim?: Simulation): number {
  return rateFor(person, CITIES.require(owned.cityId).countryId, owned.investment, sim) + HOME.equityRate;
}

/** Why a home equity loan of an amount can't be had, or nothing where it can. */
export function borrowRefusal(sim: Simulation, person: Person, owned: OwnedHome, amount: Money): string | undefined {
  if (owned.equity && owedOn(sim, owned.equity) > 0) return 'There’s a home equity loan on it already.';
  if (owned.selling || owned.foreclosureAt !== undefined) return 'Not while it’s being sold.';
  if (!(amount > 0)) return 'Say how much.';
  const room = equityRoom(sim, owned);
  if (amount > room) return `A lender lends up to ${Math.round(HOME.equityCeiling * 100)}% of its value, less the mortgage: ${formatMoney(room, saveCurrency(sim.universe), { cents: false })}.`;
  if ((person.credit?.score ?? 650) < HOME.equityScore) return 'A lender asks for a better credit record than yours.';
  const payment = paymentFor(amount, equityRate(person, owned, sim), HOME.equityYears * 12);
  const income = monthlyIncome(sim, person);
  if (income <= 0 || (monthlyDebts(sim, person) + payment) / income > HOME.maxDebtToIncome) return `A lender keeps what you owe each month under ${Math.round(HOME.maxDebtToIncome * 100)}% of your income.`;
  return undefined;
}

// ---------------------------------------------------------------------------
// England's council tax for somebody renting

/** A rented home's council tax a year, in England; nothing elsewhere or on a sofa. */
export function rentersCouncilTax(sim: Simulation, person: Person): Money {
  const home = person.home;
  if (!home || !inEngland(home.cityId) || (home.kind !== 'own' && home.kind !== 'shared')) return 0;
  const shared = home.kind === 'shared';
  // A shared flat's bill split between its bedrooms' tenants; the flat's band by its bedrooms.
  const flatmates = shared ? home.unit?.beds ?? COUNCIL_TAX.sharedBy : 1;
  return councilTaxYear(sim, COUNCIL_TAX.rentedBand[home.kind], !shared, flatmates, home.cityId);
}

function councilAccount(sim: Simulation, person: Person): Account {
  const found = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.kind === 'loan' && a.category === 'council' && !a.closedAt);
  return found ?? sim.openAccount({ id: sim.nextId('account'), kind: 'loan', name: 'Council Tax Owed', ownerId: person.id, institution: 'Your Council', openedAt: sim.now, category: 'council', apr: 0 });
}

/** A renter's instalment on the first, April to January; and what's owed paid when there's money. */
function renterCouncil(sim: Simulation, person: Person, firstOfMonth: boolean, month: number): void {
  if (firstOfMonth && (month >= 4 || month === 1)) {
    const instalment = Math.round(rentersCouncilTax(sim, person) / COUNCIL_TAX.instalments);
    if (instalment > 0) {
      const draw = drawFromBank(sim, person, instalment);
      const postings = [...draw.postings, { accountId: sim.nominalAccount('expense', 'Council Tax').id, amount: instalment }];
      if (draw.short > 0) postings.push({ accountId: councilAccount(sim, person).id, amount: -draw.short });
      sim.post({ memo: 'Council tax', category: 'home', postings });
    }
  }
  const owed = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.kind === 'loan' && a.category === 'council' && a.balance < 0);
  if (owed) {
    const draw = drawFromBank(sim, person, -owed.balance);
    if (draw.short === 0) sim.post({ memo: 'Council tax owed, paid', category: 'home', postings: [...draw.postings, { accountId: owed.id, amount: -owed.balance }] });
  }
}

// ---------------------------------------------------------------------------

/** What's owed on a person's homes, their payments behind. */
export function owedOnHomes(person: Person): Money {
  return (person.homes ?? []).reduce((sum, h) => sum + h.owed.reduce((s, one) => s + one.amount + escrowOf(one), 0), 0);
}

export function registerHomes(sim: Simulation): void {
  sim.onSchedule(INSPECTION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (person) inspection(s, person);
  });
  sim.onSchedule(CLOSING_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (person) close(s, person);
  });
  sim.onSchedule(SALE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const owned = person ? homeById(person, String(item.payload.homeId)) : undefined;
    if (person && owned) saleCloses(s, person, owned);
  });
  sim.onSchedule(WORKS_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const owned = person ? homeById(person, String(item.payload.homeId)) : undefined;
    const works = owned?.works.find((w) => w.projectId === item.payload.projectId);
    if (person && owned && works) finishWorks(s, person, owned, works);
  });

  sim.onEvent('world.day_rollover', 'homes.day', (_event, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) {
      const here = person.home?.cityId;
      const p = here ? zonedParts(s.now, CITIES.require(here).timeZone) : undefined;
      if (p) renterCouncil(s, person, p.day === 1, p.month);
      for (const owned of [...(person.homes ?? [])]) {
        const first = zonedParts(s.now, CITIES.require(owned.cityId).timeZone).day === 1;
        bill(s, person, owned);
        tenancies(s, person, owned, first);
        upkeep(s, person, owned);
        payOwed(s, person, owned);
        chase(s, person, owned);
      }
      // Living through big work weighs on whoever lives there.
      const home = livingIn(person);
      if (home?.works.some((w) => (w.doneAt - w.startedAt) / MS_DAY >= DISRUPTIVE_DAYS)) {
        person.wellbeing.stress = clamp(person.wellbeing.stress + WORKS_STRESS, 0, 100);
      }
    }
  });

  sim.onCommand<{ listingId: string; price: Money; down: number; live: boolean; inspect: boolean }, SellerAnswer>('home.offer', (p, { sim: s }) => {
    const person = s.player;
    const price = Math.round(Number(p.price));
    const down = Number(p.down);
    const live = p.live !== false;
    const inspect = p.inspect !== false;
    const refusal = offerRefusal(s, person, String(p.listingId), price, down, live);
    if (refusal) throw new CommandError(refusal);
    const listing = listingById(s, String(p.listingId))!;
    const counter = person.counter;
    const standing = counter && counter.listingId === listing.id && counter.until >= s.now && price >= counter.price;
    const tries = (person.offersMade ??= {})[listing.id] = (person.offersMade[listing.id] ?? 0) + 1;
    const answer: SellerAnswer = standing ? { answer: 'accepted' } : sellerAnswer(s, person, listing, price, inspect, tries);
    if (answer.answer === 'accepted') accept(s, person, listing, price, down, live, inspect);
    else if (answer.answer === 'countered') person.counter = { listingId: listing.id, price: answer.price, until: s.now + 2 * MS_DAY };
    else delete person.counter;
    return answer;
  });

  sim.onCommand<{ homeId?: string }, { cancelled: 'purchase' | 'sale' }>('home.cancel', (p, { sim: s }) => {
    const person = s.player;
    if (p.homeId !== undefined) {
      const owned = homeById(person, String(p.homeId));
      if (!owned?.selling) throw new CommandError('It isn’t listed.');
      cancelScheduled(s, person, [SALE_KIND], owned.id);
      delete owned.selling;
      return { cancelled: 'sale' };
    }
    const buying = person.buying;
    if (!buying) throw new CommandError('There’s no purchase under way to call off.');
    cancelScheduled(s, person, [CLOSING_KIND, INSPECTION_KIND]);
    // Inside the inspection's window, the earnest comes back; past it, the seller keeps it.
    releaseEarnest(s, person, buying, buying.inspectionUntil !== undefined && s.now <= buying.inspectionUntil);
    delete person.buying;
    return { cancelled: 'purchase' };
  });

  sim.onCommand<{ homeId: string; projectId: string }, { doneAt: Instant }>('home.renovate', (p, { sim: s }) => {
    const person = s.player;
    const owned = homeById(person, String(p.homeId));
    if (!owned) throw new CommandError('You don’t own that home.');
    const project = PROJECTS.find((one) => one.id === p.projectId);
    if (!project) throw new CommandError('No such work.');
    const refusal = projectRefusal(s, person, owned, project);
    if (refusal) throw new CommandError(refusal);
    const cost = projectCost(s, owned, project);
    const draw = drawFromBank(s, person, cost, false, true);
    s.post({ memo: `${project.label}, ${owned.facts.address}`, category: 'home', postings: [...draw.postings, { accountId: s.nominalAccount('asset_value', 'Home Improvements').id, amount: cost }] });
    // Its permit or planning, paid now; the work waits for a decision a law gives time to.
    const permit = worksPermit(s, owned.cityId, project, cost);
    const fees = (permit?.lines ?? []).reduce((a, l) => a + l.amount, 0);
    if (fees > 0) s.post({ memo: `${permit!.lines.map((l) => l.label).join(', ')}, ${project.label}`, category: 'home', postings: [...drawFromBank(s, person, fees, false, true).postings, { accountId: s.nominalAccount('expense', 'Permits').id, amount: fees }] });
    const doneAt = s.now + ((permit?.waitDays ?? 0) + project.days) * MS_DAY;
    owned.works.push({ projectId: project.id, startedAt: s.now, doneAt, cost });
    s.schedule({ at: doneAt, kind: WORKS_KIND, label: project.label, category: 'home', priority: 40, payload: { personId: person.id, homeId: owned.id, projectId: project.id } });
    return { doneAt };
  });

  sim.onCommand<{ homeId: string; amount: Money; loan?: 'mortgage' | 'equity' }, { paid: Money }>('home.pay_mortgage', (p, { sim: s }) => {
    const person = s.player;
    const owned = homeById(person, String(p.homeId));
    const loan = p.loan === 'equity' ? owned?.equity : owned?.mortgage;
    if (!owned || !loan || owedOn(s, loan) === 0) throw new CommandError('There’s no loan on it to pay.');
    const amount = Math.min(Math.round(Number(p.amount)), owedOn(s, loan));
    if (!(amount > 0)) throw new CommandError('Say how much.');
    const draw = drawFromBank(s, person, amount);
    if (draw.short > 0) throw new CommandError('The bank can’t cover it.');
    s.post({ memo: 'Paid down a loan on a home', category: 'home', postings: [...draw.postings, { accountId: loan.accountId, amount }] });
    dropPmi(s, owned);
    paidOff(s, owned);
    return { paid: amount };
  });

  sim.onCommand<{ homeId: string; then?: Housing }, { closesAt: Instant }>('home.sell', (p, { sim: s }) => {
    const person = s.player;
    const owned = homeById(person, String(p.homeId));
    if (!owned) throw new CommandError('You don’t own that home.');
    const lives = livingIn(person)?.id === owned.id;
    if (lives && p.then !== 'shared' && p.then !== 'own') throw new CommandError('A room in a shared flat, or a place of your own, after.');
    const refusal = sellRefusal(s, person, owned);
    if (refusal) throw new CommandError(refusal);
    const closesAt = s.now + HOME.saleDays * MS_DAY;
    claimClawback(s, person, owned);
    owned.selling = { closesAt, ...(lives ? { then: p.then } : {}) };
    // A home offered to let is taken off; a tenant's lease goes with the home to its buyer.
    owned.tenancies = owned.tenancies.filter((t) => t.status === 'let');
    s.schedule({ at: closesAt, kind: SALE_KIND, label: `The Sale Of ${owned.facts.address} Closes`, category: 'home', priority: 30, payload: { personId: person.id, homeId: owned.id } });
    return { closesAt };
  });

  sim.onCommand<{ homeId: string; unit?: Tenancy['unit']; rent: Money }, { advertised: Money }>('home.let', (p, { sim: s }) => {
    const person = s.player;
    const owned = homeById(person, String(p.homeId));
    if (!owned) throw new CommandError('You don’t own that home.');
    const unit = p.unit === 'adu' ? 'adu' : 'main';
    const rent = Math.round(Number(p.rent));
    const refusal = letRefusal(s, person, owned, unit, rent);
    if (refusal) throw new CommandError(refusal);
    owned.tenancies.push({ unit, rent, status: 'advertised', since: s.now });
    return { advertised: rent };
  });

  sim.onCommand<{ homeId: string; unit?: Tenancy['unit'] }, { ends: Instant | undefined }>('home.end_tenancy', (p, { sim: s }) => {
    const person = s.player;
    const owned = homeById(person, String(p.homeId));
    const unit = p.unit === 'adu' ? 'adu' : 'main';
    const t = owned?.tenancies.find((one) => one.unit === unit);
    if (!owned || !t) throw new CommandError('It isn’t let or offered.');
    // Offered and not yet let, it's simply taken off; let, the tenant leaves when the lease ends.
    if (t.status === 'advertised') { owned.tenancies = owned.tenancies.filter((one) => one !== t); return { ends: undefined }; }
    t.notice = true;
    return { ends: t.leaseEnds };
  });

  sim.onCommand<{ homeId: string }, { movedIn: string }>('home.move_in', (p, { sim: s }) => {
    const person = s.player;
    const owned = homeById(person, String(p.homeId));
    if (!owned) throw new CommandError('You don’t own that home.');
    const refusal = moveInRefusal(s, person, owned);
    if (refusal) throw new CommandError(refusal);
    moveInto(s, person, owned);
    return { movedIn: owned.id };
  });

  sim.onCommand<{ homeId: string }, { rate: number; payment: Money }>('home.refinance', (p, { sim: s }) => {
    const person = s.player;
    const owned = homeById(person, String(p.homeId));
    if (!owned) throw new CommandError('You don’t own that home.');
    const refusal = refinanceRefusal(s, person, owned);
    if (refusal) throw new CommandError(refusal);
    const offer = refinanceOffer(s, person, owned)!;
    const balance = loanBalance(s, owned);
    const old = accountOf(s, owned.mortgage)!;
    const account = s.openAccount({ id: s.nextId('account'), kind: 'mortgage', name: `Mortgage, ${owned.facts.address}`, ownerId: person.id, institution: 'Your Lender', openedAt: s.now, category: 'mortgage', apr: offer.rate });
    const draw = drawFromBank(s, person, offer.closing, false, true);
    s.post({ memo: `Refinanced ${owned.facts.address}`, category: 'home', postings: [
      { accountId: account.id, amount: -balance }, { accountId: old.id, amount: balance },
      ...draw.postings, { accountId: s.nominalAccount('expense', 'Closing Costs').id, amount: offer.closing },
    ] });
    old.closedAt = s.now;
    const months = termsIn(CITIES.require(owned.cityId).countryId).years * 12;
    owned.mortgage = { accountId: account.id, rate: offer.rate, payment: offer.payment, original: homeValue(s, owned), pmi: offer.pmi };
    void months;
    return { rate: offer.rate, payment: offer.payment };
  });

  sim.onCommand<{ homeId: string; amount: Money }, { payment: Money }>('home.borrow', (p, { sim: s }) => {
    const person = s.player;
    const owned = homeById(person, String(p.homeId));
    if (!owned) throw new CommandError('You don’t own that home.');
    const amount = Math.round(Number(p.amount));
    const refusal = borrowRefusal(s, person, owned, amount);
    if (refusal) throw new CommandError(refusal);
    const rate = equityRate(person, owned, s);
    const months = HOME.equityYears * 12;
    const account = s.openAccount({ id: s.nextId('account'), kind: 'mortgage', name: `Home Equity Loan, ${owned.facts.address}`, ownerId: person.id, institution: 'Your Lender', openedAt: s.now, category: 'equity', apr: rate });
    s.post({ memo: 'Home equity loan', category: 'home', postings: [{ accountId: account.id, amount: -amount }, { accountId: person.primaryAccountId!, amount }] });
    owned.equity = { accountId: account.id, rate, payment: paymentFor(amount, rate, months), original: amount, pmi: false };
    return { payment: owned.equity.payment };
  });
}

/**
 * A refinance: the mortgage paid off by a new one for what's owed, at today's
 * rate for their record, over a new full term, with closing costs from the
 * bank (`HOME.refinanceCost` of the loan), and mortgage insurance if the loan
 * is over 80% of what the home is worth now. The lender reads it as a new loan.
 */
export function refinanceOffer(sim: Simulation, person: Person, owned: OwnedHome): { rate: number; payment: Money; closing: Money; pmi: boolean } | undefined {
  if (!owned.mortgage || loanBalance(sim, owned) === 0) return undefined;
  const country = CITIES.require(owned.cityId).countryId;
  const balance = loanBalance(sim, owned);
  const rate = rateFor(person, country, owned.investment, sim);
  const months = termsIn(country).years * 12;
  return { rate, payment: paymentFor(balance, rate, months), closing: Math.round(balance * HOME.refinanceCost), pmi: country === 'us' && !owned.investment && balance > homeValue(sim, owned) * HOME.pmiOver };
}

export function refinanceRefusal(sim: Simulation, person: Person, owned: OwnedHome): string | undefined {
  const offer = refinanceOffer(sim, person, owned);
  if (!offer) return 'There’s no mortgage on it to refinance.';
  if (owned.selling || owned.foreclosureAt !== undefined || owned.owed.some((one) => LOANS.includes(one.kind))) return 'Not while it’s being sold or a payment is behind.';
  if ((person.credit?.score ?? 650) < HOME.minScore) return 'A lender asks for a better credit record than yours.';
  if (inTheBank(sim, person) < offer.closing) return `Closing it costs ${formatMoney(offer.closing, saveCurrency(sim.universe), { cents: false })}, which the bank can’t cover.`;
  const income = monthlyIncome(sim, person);
  const without = monthlyDebts(sim, person, owned.id);
  const month = ownedMonth(sim, owned);
  const newMonth = month.total - month.mortgage - month.pmi + offer.payment + (offer.pmi ? Math.round(loanBalance(sim, owned) * HOME.pmi / 12) : 0);
  if (income <= 0 || (without + newMonth) / income > HOME.maxDebtToIncome) return `A lender keeps what you owe each month under ${Math.round(HOME.maxDebtToIncome * 100)}% of your income.`;
  return undefined;
}

/** Why they can't move into a home they own, or nothing where they can. */
export function moveInRefusal(sim: Simulation, person: Person, owned: OwnedHome): string | undefined {
  if (livingIn(person)?.id === owned.id) return 'You live in it.';
  if (owned.cityId !== person.currentLocationId) return `You’re not in ${CITIES.get(owned.cityId)?.name ?? 'its town'}.`;
  if (owned.occupiableFrom !== undefined && sim.now < owned.occupiableFrom) return `Its certificate of occupancy comes ${formatDate(owned.occupiableFrom, sim.zone)}; it can’t be lived in before.`;
  // Until 2026-09-29 an actor on a shoot in London could move into a home they owned there, and live abroad on a visitor's stay.
  const abroad = residenceRefusal(person, owned.cityId, sim.now);
  if (abroad) return abroad;
  const main = owned.tenancies.find((t) => t.unit === 'main' && t.status === 'let');
  if (main) return `A tenant lives in it until ${formatDate(main.leaseEnds!, CITIES.require(owned.cityId).timeZone)}: end the tenancy, and move in when they've left.`;
  if (owned.selling) return 'It’s listed for sale.';
  if (person.home?.noticeUntil !== undefined) return 'There’s a notice to pay or quit on where you live: settle it first.';
  return undefined;
}
