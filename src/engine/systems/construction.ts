/**
 * SLATE — building a house on a lot one owns (docs/WORLD.md, stage 5a), from
 * 2026-09-29, on the figures in `content/construction.ts`.
 *
 * A lot in New York, New Haven, Los Angeles or London takes a house of a
 * published size where it fits the zoning's bulk, and from stage 5b farmland
 * where the place allows a house on it, England not. The permit and every fee
 * of the place are paid when the work is started. The permit comes after the
 * place's wait, and the contractor builds in NAHB's seven stages, each
 * billed at its share of the contract when it's finished, the inspections
 * the place names at its end. A bill the bank can't pay stops the work until
 * Pay The Contractor pays it. Finished, the house is a home they own
 * (`homes.ts`), worth what the land and the building cost, the lot gone into
 * it; the Homes screen moves them in.
 *
 * Financed, from 2026-09-30, a construction loan pays its share of each
 * stage, interest only on what's been advanced, and becomes the house's
 * mortgage when it's finished (`BUILD_LOANS`). This said until 2026-10-02 that
 * delays, overruns, change orders, a structural warranty, builder's risk
 * insurance and a failed inspection weren't kept; each came in since but
 * delays and overruns on a new house, which no source sizes outside a
 * pandemic-peak poll. From 2026-10-02 the plans are paid at the start, a
 * registered professional's where the law asks one (`DESIGN`), and an
 * American house's contract carries CoConstruct's average change orders.
 *
 * From 2026-09-30, a stage's retention is held back where the law or the
 * contract sets one, and paid after completion (`RETENTION`), and a house
 * waits for its certificate of occupancy where a wait is published
 * (`OCCUPANCY_WAIT_DAYS`).
 *
 * From 2026-10-02, the weather (`weatherDelay`): an outdoor stage (the site,
 * the foundations, the frame, the outside, and the final steps' driveway and
 * landscaping) meets the wet days its months bring at the town's station,
 * days over 0.10 inch, as a contract counts them (NOAA, `content/wetdays.ts`),
 * drawn around their mean. The times above are measured, so they hold an
 * ordinary season's rain already; a wetter stretch than usual adds its extra
 * days, and no money, a weather delay being excusable but not compensable
 * (research-construction-process.json). A drier one doesn't finish early.
 *
 * From later on 2026-10-02, an inspection can fail (`buildInspectionFails`): each
 * visit at the odds Los Angeles's own records give its kind of inspection
 * (`content/inspectionodds.ts`), taken everywhere, no other place publishing
 * its results. Failed, the work waits for corrections and another visit, at
 * New York's measured days from asking to an inspector's visit (4.6 for
 * building work, 8.7 for electrical; Ontario's Building Code two working
 * days), and the reinspection's fee where one is published: New York City's
 * $225, Toronto's C$92.79 hour (research-construction-process.json).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { LAND_MARKETS } from '../content/land';
import { CHANGE_ORDERS_USD, DESIGN, OCCUPANCY_WAIT_DAYS, RETENTION, BC_PERMIT, BUILDERS_RISK_A_MONTH, BUILD_LOANS, BUILD_RULES, ENGLISH_WARRANTY, SERVICES, CIL_CLAWBACK_YEARS, INSPECTIONS, LA_FEES, LEINSTER_FEES, LONDON_BUILDING_CONTROL, LONDON_CIL, NEW_HAVEN_FEES, NO_HOUSE, NYC_FEES, ONTARIO_FEES, SQFT_PER_M2, STAGES, type BuildPlace, type Design } from '../content/construction';
import { parcelsOf, type Parcel } from './land';
import { HOME, ownBuilt, paymentFor } from './homes';
import { expenseFor, inTheBank, owe, payFromBank } from './household';
import { WET_DAYS } from '../content/wetdays';
import { INSPECTION_FAILS } from '../content/inspectionodds';
import { CITIES } from '../content/geography';

export const BUILD_STAGE_KIND = 'build.stage';
export const BUILD_LOAN_KIND = 'build.loan_month';
export const RETENTION_KIND = 'build.retention';
export const REINSPECT_KIND = 'build.reinspect';

/** Which of Los Angeles's kinds of inspection a stage's is, by the stage's index. */
const INSPECTION_KIND: Readonly<Record<number, keyof typeof INSPECTION_FAILS>> = { 1: 'foundation', 2: 'framing', 4: 'rough', 6: 'final' };
/** A reinspection: the days to the inspector's visit, and its fee and money where one is published. */
export function reinspection(place: BuildPlace, stage: number): { days: number; fee?: { amount: number; currency: string } } {
  if (place === 'ontario') return { days: 2, fee: { amount: 92.79, currency: 'CAD' } };
  return { days: stage === 4 ? 8.7 : 4.6, ...(place === 'nyc' ? { fee: { amount: 225, currency: 'USD' } } : {}) };
}

/** The fees for a stage's reinspections, in the save's money: none where none is published. */
export function reinspectionFee(sim: Simulation, place: BuildPlace, stage: number, fails: number): Money {
  const fee = reinspection(place, stage).fee;
  return fee ? inSave(sim, Math.round(fee.amount * 100) * fails, fee.currency) : 0;
}

/** How many times a stage's inspection fails before it passes, each visit at its kind's odds; none where it has none. */
export function buildInspectionFails(sim: Simulation, key: string, place: BuildPlace, stage: number): number {
  const kind = INSPECTION_KIND[stage];
  if (!kind || !INSPECTIONS[place][stage]) return 0;
  const rng = sim.rng('build.inspection', key, String(stage));
  let fails = 0;
  while (fails < 10 && rng.next() < INSPECTION_FAILS[kind]) fails += 1;
  return fails;
}
/** A built house's one feature kept: its yard, the lot around it (`homes.ts`'s ids, not words on a screen). */
const YARD = ['yard'] as const;
const MONTH_DAYS = 30.436875;
const YEAR_MS = 365.2425 * MS_DAY;

/** A house being built. Money is in the place's, cents. */
export interface Build {
  parcelId: string;
  place: BuildPlace;
  cityId: string;
  designId: string;
  live: boolean;
  startedAt: Instant;
  contract: Money;
  fees: Money;
  /** A levy spared on the promise of living in it. */
  spared: Money;
  amounts: Money[];
  days: number[];
  /** The stage under way; -1 while the permit's awaited. */
  stage: number;
  /** A construction loan (from 2026-09-30): its account, and the share of each stage it pays. */
  loan?: { accountId: string; share: number; rate: number; months: number };
  /** What's been held back of the stages' bills, in the place's money, cents (`RETENTION`, from 2026-09-30). */
  retained?: Money;
  /** A finished stage's bill the bank couldn't pay, and when the work stopped for it. */
  unpaid?: Money;
  stoppedAt?: Instant;
  log: { at: Instant; line: string }[];
  /** Days the weather has added, from 2026-10-02 (`weatherDelay`). */
  weatherDays?: number;
  /** Inspections failed and seen again (`buildInspectionFails`). */
  inspectionFails?: number;
}

const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };
const cents = (units: number) => Math.round(units * 100);

/** Where a parcel is built on, or nothing where no house is built. */
export function buildPlaceOf(p: Parcel): BuildPlace | undefined {
  const place = LAND_MARKETS[p.market]!.place;
  return place in BUILD_RULES ? (place as BuildPlace) : undefined;
}

/** The most floor a lot takes, square feet, or none where its zoning's bulk isn't kept. */
export function mostFloor(place: BuildPlace, acres: number): number | undefined {
  const bulk = BUILD_RULES[place].bulk;
  const lot = acres * 43_560;
  if (!bulk) return undefined;
  if ('most' in bulk) return bulk.most;
  return 'floorArea' in bulk ? lot * bulk.floorArea : lot * bulk.coverage * bulk.stories;
}

export interface BuildQuote {
  currency: string;
  design: Design;
  contract: Money;
  /** In the contract, America's average change orders (`CHANGE_ORDERS_USD`, from 2026-10-02). */
  changeOrders: Money;
  fees: { label: string; amount: Money }[];
  feesTotal: Money;
  /** A levy spared by living in it, owed if it's sold or let within three years. */
  spared: Money;
  total: Money;
  stages: { name: string; amount: Money; days: number }[];
  permitDays: number;
}

/** Each place's permit and fees on a house, in its money, cents. */
export function buildFees(place: BuildPlace, sqft: number, contract: Money, borough?: string): { lines: { label: string; amount: Money }[]; cil: Money } {
  const value = contract / 100;
  if (place === 'nyc') return { lines: [{ label: 'New Building Permit', amount: cents(Math.max(NYC_FEES.least, NYC_FEES.perSqft * Math.ceil(sqft))) }], cil: 0 };
  if (place === 'new-haven') {
    const f = NEW_HAVEN_FEES;
    return { lines: [
      { label: 'Building Permit', amount: cents(f.first + f.perThousand * Math.ceil(Math.max(0, value - 1_000) / 1_000) + f.processing) },
      { label: 'State Education Fee', amount: cents(f.education * value / 1_000) },
    ], cil: 0 };
  }
  if (place === 'los-angeles') {
    const f = LA_FEES;
    const valuation = f.valuationPerSqft * sqft;
    const [, base, rate] = f.table1A.find(([upTo]) => valuation <= upTo) ?? f.table1A[f.table1A.length - 1]!;
    const permit = base + rate * valuation;
    return { lines: [
      { label: 'Building Permit', amount: cents(permit) },
      { label: 'Plan Check', amount: cents(permit * f.planCheck) },
      { label: 'Strong-Motion Instrumentation Fee', amount: cents(Math.max(0.5, valuation * f.smip)) },
      { label: 'Building Standards Fee', amount: cents(Math.max(1, valuation * f.bsa)) },
      { label: 'Affordable Housing Linkage Fee', amount: cents(f.linkagePerSqft * sqft) },
      { label: 'School Developer Fee', amount: cents(f.schoolPerSqft * sqft) },
      { label: 'Certificate Of Occupancy', amount: cents(f.occupancy) },
    ], cil: 0 };
  }
  if (place === 'ny-state') return { lines: [], cil: 0 };
  if (place === 'ct-state') return { lines: [{ label: 'State Education Fee', amount: cents(NEW_HAVEN_FEES.education * value / 1_000) }], cil: 0 };
  if (place === 'ca-state') return { lines: [
    { label: 'Strong-Motion Instrumentation Fee', amount: cents(Math.max(0.5, value * LA_FEES.smip)) },
    { label: 'Building Standards Fee', amount: cents(Math.max(1, value * LA_FEES.bsa)) },
  ], cil: 0 };
  if (place === 'leinster') return { lines: [
    { label: 'Planning Application', amount: cents(LEINSTER_FEES.planning) },
    { label: 'Development Contribution', amount: cents(LEINSTER_FEES.contributionPerM2 * sqft / SQFT_PER_M2) },
    { label: 'Commencement Notice', amount: cents(LEINSTER_FEES.commencement) },
  ], cil: 0 };
  if (place === 'ontario') return { lines: [
    { label: 'Building Permit', amount: cents(Math.max(ONTARIO_FEES.least, ONTARIO_FEES.perSqft * sqft)) },
    { label: 'Development Charge', amount: cents(ONTARIO_FEES.charge) },
  ], cil: 0 };
  if (place === 'bc') {
    const [, base, per, over] = BC_PERMIT.find(([upTo]) => value <= upTo)!;
    return { lines: [{ label: 'Building Permit', amount: cents(base + per * (value - over) / 1_000) }], cil: 0 };
  }
  const rates = LONDON_CIL[borough ?? 'Croydon'] ?? LONDON_CIL.Croydon!;
  const m2 = sqft / SQFT_PER_M2;
  return { lines: [{ label: 'Building Control Charge', amount: cents(LONDON_BUILDING_CONTROL.fee * (1 + LONDON_BUILDING_CONTROL.vat)) }], cil: cents((rates.borough + rates.mayor) * m2) };
}

/** A house on a lot: the contract, the fees, the stages and their days. */
export function buildQuote(p: Parcel, designId: string, live: boolean): BuildQuote | string {
  const place = buildPlaceOf(p);
  if (!place) return NO_HOUSE[LAND_MARKETS[p.market]!.place] ?? 'SLATE builds no house there yet.';
  const rules = BUILD_RULES[place];
  const design = rules.designs.find((d) => d.id === designId);
  if (!design) return 'That isn’t a house built there.';
  const most = mostFloor(place, p.acres);
  if (most !== undefined && design.sqft > most) return `It doesn’t fit: the land takes ${Math.floor(most).toLocaleString('en-US')} sq ft at most, by ${rules.bulk!.basis}.`;
  const area = rules.unit === 'sqft' ? design.sqft : design.sqft / SQFT_PER_M2;
  // An American house's change orders, on average, by the stage (from 2026-10-02).
  const changeOrders = rules.currency === 'USD' ? cents(CHANGE_ORDERS_USD) : 0;
  const contract = cents(rules.rate * area) + changeOrders;
  const borough = LAND_MARKETS[p.market]!.label.match(/In (Hackney|Croydon|Havering)/)?.[1];
  // The permit is on the work as contracted, before its change orders.
  const f = buildFees(place, design.sqft, contract - changeOrders, borough);
  // The plans, a registered professional's where the law asks one (`DESIGN`, from 2026-10-02).
  const d = DESIGN[place];
  const lines = [{ label: d.label, amount: d.share !== undefined ? Math.round((contract - changeOrders) * d.share) : cents(d.flat!) }, ...f.lines];
  if (f.cil > 0) lines.push({ label: live ? 'Community Infrastructure Levy, Spared For A Self-Build' : 'Community Infrastructure Levy', amount: live ? 0 : f.cil });
  // Insured while it's built in America, and warranted in England (from 2026-10-01).
  if (rules.currency === 'USD') lines.push({ label: 'Builder’s Risk Insurance', amount: cents(BUILDERS_RISK_A_MONTH * Math.ceil(rules.buildMonths)) });
  if (place === 'london') lines.push({ label: 'A Structural Warranty', amount: cents(ENGLISH_WARRANTY) });
  // Land with no services: water, sewage and power brought to it (`SERVICES`, from 2026-09-30).
  for (const s of SERVICES[place] ?? []) lines.push({ label: s.label, amount: cents(s.amount) });
  const feesTotal = lines.reduce((a, l) => a + l.amount, 0);
  const whole = STAGES.reduce((a, s) => a + s.usd, 0);
  let paid = 0;
  const stages = STAGES.map((s, i) => {
    const amount = i === STAGES.length - 1 ? contract - paid : Math.round(contract * s.usd / whole);
    paid += amount;
    return { name: s.name, amount, days: Math.max(1, Math.round(rules.buildMonths * MONTH_DAYS * s.usd / whole)) };
  });
  return { currency: rules.currency, design, contract, changeOrders, fees: lines, feesTotal, spared: live ? f.cil : 0, total: contract + feesTotal, stages, permitDays: rules.permitDays ?? Math.round(rules.permitMonths * MONTH_DAYS) };
}

/** Why a house can't be started, or nothing. */
export function buildRefusal(sim: Simulation, person: Person, parcelId: string, designId: string, live: boolean, financed = false): string | undefined {
  if (person.building) return 'A house is being built already.';
  const p = parcelsOf(person).find((x) => x.id === parcelId && x.soldAt === undefined);
  if (!p) return 'That isn’t land you own.';
  if (p.selling) return 'It’s for sale.';
  const q = buildQuote(p, designId, live);
  if (typeof q === 'string') return q;
  const terms = financed ? BUILD_LOANS[buildPlaceOf(p)!] : undefined;
  if (financed && !terms) return 'SLATE keeps no construction lender’s terms here.';
  if (financed && (person.credit?.score ?? 650) < HOME.minScore) return 'A lender asks for a better credit record than yours.';
  const fees = inSave(sim, q.feesTotal + (terms ? cents(terms.fees(q.contract * (1 - terms.down) / 100)) : 0), q.currency);
  if (inTheBank(sim, person) < fees) return `The permit and fees${terms ? ' and the loan’s' : ''}, ${formatMoney(fees, saveCurrency(sim.universe), { cents: false })}, are more than the bank holds.`;
  return undefined;
}

const say = (sim: Simulation, person: Person, title: string, body: string, importance = 60) => { if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title, body, importance, route: '/workspace/land' }); };

/** The stages built outdoors, by index: the site, the foundations, the frame, the outside, the final steps. */
const OUTDOOR = new Set([0, 1, 2, 3, 6]);

/** A stage's days of a wetter stretch than its months usually bring: none indoors, none where no station is kept. */
export function weatherDelay(sim: Simulation, key: string, cityId: string, stage: number, days: number, from: Instant): number {
  const wet = WET_DAYS[cityId];
  if (!wet || !OUTDOOR.has(stage)) return 0;
  const zone = CITIES.require(cityId).timeZone;
  let expected = 0;
  for (let d = 0; d < days; d += 1) {
    const p = zonedParts(from + d * MS_DAY, zone);
    expected += wet.days[p.month - 1]! / new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
  }
  // Poisson around the mean (Knuth's way), the count of rare days in a span.
  const rng = sim.rng('build.weather', key, String(stage), String(from));
  const limit = Math.exp(-expected);
  let drawn = 0;
  for (let prod = rng.next(); prod > limit; prod *= rng.next()) drawn += 1;
  return Math.max(0, drawn - Math.round(expected));
}

function next(sim: Simulation, person: Person, b: Build): void {
  const delay = weatherDelay(sim, `${person.id}-${b.parcelId}`, b.cityId, b.stage, b.days[b.stage]!, sim.now);
  if (delay > 0) {
    b.weatherDays = (b.weatherDays ?? 0) + delay;
    b.log.push({ at: sim.now, line: `${STAGES[b.stage]!.name}: a wetter stretch than usual, ${delay} ${delay === 1 ? 'day' : 'days'} more` });
  }
  sim.schedule({ at: sim.now + (b.days[b.stage]! + delay) * MS_DAY, kind: BUILD_STAGE_KIND, label: `${STAGES[b.stage]!.name} Done`, category: 'home', priority: 30, payload: { personId: person.id } });
}

/** A stage's bill paid: its inspection, then the next stage, or the house finished. */
function advance(sim: Simulation, person: Person, b: Build, reinspected = false): void {
  const inspection = INSPECTIONS[b.place][b.stage];
  // Failed, corrected and seen again before the next stage begins.
  const fails = inspection && !reinspected ? buildInspectionFails(sim, `${person.id}-${b.parcelId}`, b.place, b.stage) : 0;
  if (fails > 0) {
    const r = reinspection(b.place, b.stage);
    const fee = reinspectionFee(sim, b.place, b.stage, fails);
    if (fee > 0 && !payFromBank(sim, person, fee, `${inspection!}, ${fails === 1 ? 'a reinspection' : `${fails} reinspections`}`, 'construction')) owe(sim, person, fee, 'A reinspection fee', 'construction');
    b.inspectionFails = (b.inspectionFails ?? 0) + fails;
    b.log.push({ at: sim.now, line: `${inspection!}, failed ${fails === 1 ? 'once' : `${fails} times`}; corrected and seen again` });
    say(sim, person, 'An Inspection Failed', `The ${inspection!.toLowerCase()} found corrections to make${fails > 1 ? `, ${fails} times over` : ''}. The work waits about ${Math.round(r.days * fails)} days for them and the inspector${fee > 0 ? `, and the reinspection costs ${formatMoney(fee, saveCurrency(sim.universe), { cents: false })}` : ''}.`, 55);
    sim.schedule({ at: sim.now + Math.round(r.days * fails * MS_DAY), kind: REINSPECT_KIND, label: `${inspection!}, Again`, category: 'home', priority: 30, payload: { personId: person.id } });
    return;
  }
  if (inspection) b.log.push({ at: sim.now, line: `${inspection}, passed` });
  if (b.stage === STAGES.length - 1) { finish(sim, person, b); return; }
  b.stage += 1;
  next(sim, person, b);
}

function finish(sim: Simulation, person: Person, b: Build): void {
  const p = parcelsOf(person).find((x) => x.id === b.parcelId)!;
  const m = LAND_MARKETS[p.market]!;
  const rules = BUILD_RULES[b.place];
  const design = rules.designs.find((d) => d.id === b.designId)!;
  const year = new Date(sim.now).getUTCFullYear();
  const parts = Object.fromEntries((['kitchen', 'bath', 'floors', 'paint', 'roof', 'windows', 'siding', 'door', 'hvac'] as const).map((k) => [k, year]));
  // A lot's house is in its place (Your House In Queens); a farm's is on the farmland (Your House On Farmland Upstate).
  const address = m.kind === 'lot' ? `Your House ${m.label.replace(/^A (Lot|Plot) /, '').replace(/, With Planning Permission$/, '')}` : `Your House On ${m.label}`;
  const owned = ownBuilt(sim, person, {
    cityId: b.cityId,
    facts: { type: 'house', address, beds: design.beds, baths: design.baths, size: design.sqft, lot: Math.round(p.acres * 43_560), built: year, features: [...YARD], parts, hoaUsd: 0 },
    price: inSave(sim, p.paid + b.contract, m.currency),
    closing: inSave(sim, b.fees, m.currency),
    ...(b.spared > 0 ? { clawback: { until: sim.now + CIL_CLAWBACK_YEARS * YEAR_MS, amount: inSave(sim, b.spared, m.currency), memo: 'Community Infrastructure Levy, the self-build exemption lost' } } : {}),
  });
  // The lot has gone into the house: its value is the home's now, and the home's property tax replaces the land's.
  p.soldAt = sim.now;
  p.builtOn = owned.id;
  for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.payload.parcelId === p.id) sim.timeline.cancel(one.id, sim.now);
  b.log.push({ at: sim.now, line: `${rules.occupancy} issued` });
  // The retention, paid at its time; and a wait before it may be lived in, where one is published.
  const r = RETENTION[b.place];
  if (r && (b.retained ?? 0) > 0) {
    const all = inSave(sim, b.retained!, BUILD_RULES[b.place].currency);
    const now = r.halfAtCompletion ? Math.round(all / 2) : 0;
    if (now > 0 && !payFromBank(sim, person, now, 'The contractor, half the retention at completion', 'construction')) owe(sim, person, now, 'The contractor’s retention', 'construction');
    sim.schedule({ at: sim.now + r.releaseDays * MS_DAY, kind: RETENTION_KIND, label: 'Retention Released', category: 'home', priority: 30, payload: { personId: person.id, amount: all - now } });
  }
  const wait = OCCUPANCY_WAIT_DAYS[b.place];
  if (wait) owned.occupiableFrom = sim.now + wait * MS_DAY;
  // The construction loan becomes the house's mortgage, its permanent loan.
  if (b.loan) {
    const building = sim.universe.accounts[b.loan.accountId]!;
    const balance = Math.max(0, -building.balance);
    if (balance > 0) {
      const account = sim.openAccount({ id: sim.nextId('account'), kind: 'mortgage', name: `Mortgage, ${address}`, ownerId: person.id, institution: BUILD_LOANS[b.place]!.lender, openedAt: sim.now, category: 'mortgage', apr: b.loan.rate });
      sim.post({ memo: `The construction loan made permanent, ${address}`, category: 'home', postings: [{ accountId: account.id, amount: -balance }, { accountId: building.id, amount: balance }] });
      owned.mortgage = { accountId: account.id, rate: b.loan.rate, payment: paymentFor(balance, b.loan.rate, b.loan.months), original: owned.price, pmi: CITIES.get(b.cityId)?.countryId === 'us' && balance > owned.price * HOME.pmiOver };
    }
    building.closedAt = sim.now;
  }
  delete person.building;
  say(sim, person, 'Your House Is Finished', `${address} is built, and yours. Move In on the Homes screen.`, 80);
}

export function registerConstruction(sim: Simulation): void {
  sim.onSchedule(RETENTION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const amount = Number(item.payload.amount);
    if (!person || !(amount > 0)) return;
    if (!payFromBank(s, person, amount, 'The contractor, the retention released', 'construction')) owe(s, person, amount, 'The contractor’s retention', 'construction');
  });

  sim.onCommand<{ parcelId: string; designId: string; live?: boolean; financed?: boolean }, { fees: Money; finishesBy: Instant }>('build.start', (p, { sim: s }) => {
    const person = s.player;
    const live = p?.live !== false;
    const financed = p?.financed === true;
    const no = buildRefusal(s, person, String(p?.parcelId), String(p?.designId), live, financed);
    if (no) throw new CommandError(no);
    const parcel = parcelsOf(person).find((x) => x.id === p.parcelId)!;
    const q = buildQuote(parcel, p.designId, live) as BuildQuote;
    const fees = inSave(s, q.feesTotal, q.currency);
    if (fees > 0 && !payFromBank(s, person, fees, `Permits and fees for building on ${LAND_MARKETS[parcel.market]!.label}`, 'construction')) throw new CommandError('The bank couldn’t pay the permit and fees.');
    const place = buildPlaceOf(parcel)!;
    const b: Build = {
      parcelId: parcel.id, place, cityId: LAND_MARKETS[parcel.market]!.town ?? LAND_MARKETS[parcel.market]!.cityId, designId: q.design.id, live, startedAt: s.now,
      contract: q.contract, fees: q.feesTotal, spared: q.spared, amounts: q.stages.map((x) => x.amount), days: q.stages.map((x) => x.days), stage: -1,
      log: [{ at: s.now, line: place === 'london' ? 'Building notice given' : place === 'leinster' ? 'Planning permission applied for' : 'Permit applied for' }],
    };
    // Financed: the loan's fees now, its account opened, and its interest monthly on what's advanced.
    const terms = financed ? BUILD_LOANS[place] : undefined;
    if (terms) {
      const loanFees = inSave(s, cents(terms.fees(q.contract * (1 - terms.down) / 100)), q.currency);
      if (!payFromBank(s, person, loanFees, `A construction loan’s fees, ${terms.lender}`, 'construction')) throw new CommandError('The bank couldn’t pay the loan’s fees.');
      const account = s.openAccount({ id: s.nextId('account'), kind: 'loan', name: 'Construction Loan', ownerId: person.id, institution: terms.lender, openedAt: s.now, category: 'construction-loan', apr: terms.rate });
      b.loan = { accountId: account.id, share: 1 - terms.down, rate: terms.rate, months: terms.months };
      s.schedule({ at: s.now + 30 * MS_DAY, kind: BUILD_LOAN_KIND, label: 'Construction Loan Interest', category: 'home', priority: 30, payload: { personId: person.id } });
    }
    person.building = b;
    s.schedule({ at: s.now + q.permitDays * MS_DAY, kind: BUILD_STAGE_KIND, label: place === 'london' ? 'Work Starts' : 'The Permit Is Issued', category: 'home', priority: 30, payload: { personId: person.id } });
    const finishesBy = s.now + (q.permitDays + q.stages.reduce((a, x) => a + x.days, 0)) * MS_DAY;
    return { fees, finishesBy };
  });

  sim.onCommand<Record<string, never>, { paid: Money }>('build.pay', (_p, { sim: s }) => {
    const person = s.player;
    const b = person.building;
    if (!b || b.unpaid === undefined) throw new CommandError('The contractor is owed no bill.');
    const due = inSave(s, b.unpaid, BUILD_RULES[b.place].currency);
    if (!payFromBank(s, person, due, `The contractor, ${STAGES[b.stage]!.name}`, 'construction')) throw new CommandError(`${formatMoney(due, saveCurrency(s.universe), { cents: false })} is more than the bank can pay.`);
    b.log.push({ at: s.now, line: `${STAGES[b.stage]!.name} paid; work resumed` });
    delete b.unpaid;
    delete b.stoppedAt;
    advance(s, person, b);
    return { paid: due };
  });

  sim.onSchedule(BUILD_LOAN_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const b = person?.building;
    if (!person || !b?.loan) return;
    const account = s.universe.accounts[b.loan.accountId];
    const interest = Math.round((Math.max(0, -(account?.balance ?? 0)) * b.loan.rate) / 12);
    if (interest > 0 && !payFromBank(s, person, interest, 'The construction loan’s interest, a month', 'construction')) owe(s, person, interest, 'The construction loan’s interest', 'construction');
    s.schedule({ at: s.now + 30 * MS_DAY, kind: BUILD_LOAN_KIND, label: 'Construction Loan Interest', category: 'home', priority: 30, payload: { personId: person.id } });
  });

  sim.onSchedule(REINSPECT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const b = person?.building;
    if (!person || !b) return;
    advance(s, person, b, true);
  });

  sim.onSchedule(BUILD_STAGE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const b = person?.building;
    if (!person || !b) return;
    if (b.stage === -1) {
      b.log.push({ at: s.now, line: b.place === 'london' ? 'Work started' : b.place === 'leinster' ? 'Permission granted, no appeal made, and the commencement notice run; work started' : 'Permit issued; work started' });
      b.stage = 0;
      next(s, person, b);
      return;
    }
    const bill = inSave(s, b.amounts[b.stage]!, BUILD_RULES[b.place].currency);
    // The lender advances its share of each stage; the rest is the owner's.
    const advanced = b.loan ? Math.round(bill * b.loan.share) : 0;
    if (advanced > 0) s.post({ memo: `The construction loan, ${STAGES[b.stage]!.name}`, category: 'construction', postings: [{ accountId: b.loan!.accountId, amount: -advanced }, { accountId: s.nominalAccount('expense', expenseFor('construction')).id, amount: advanced }] });
    // What the law or the contract holds back of the bill until the house is finished (`RETENTION`).
    const held = Math.round(b.amounts[b.stage]! * (RETENTION[b.place]?.share ?? 0));
    const due = bill - advanced - inSave(s, held, BUILD_RULES[b.place].currency);
    if (!payFromBank(s, person, due, `The contractor, ${STAGES[b.stage]!.name}`, 'construction')) {
      // The retention is held whether or not the rest is paid now.
      b.unpaid = b.amounts[b.stage]! - Math.round(b.amounts[b.stage]! * (b.loan?.share ?? 0)) - held;
      b.retained = (b.retained ?? 0) + held;
      b.stoppedAt = s.now;
      b.log.push({ at: s.now, line: `${STAGES[b.stage]!.name} done; its bill unpaid, work stopped` });
      say(s, person, 'Work Stopped', `The contractor finished the ${STAGES[b.stage]!.name.toLowerCase()} on ${formatDate(s.now, s.zone)} and stopped until ${formatMoney(due, saveCurrency(s.universe), { cents: false })} is paid.`, 80);
      return;
    }
    b.retained = (b.retained ?? 0) + held;
    b.log.push({ at: s.now, line: `${STAGES[b.stage]!.name} done and paid${held > 0 ? ', its retention held back' : ''}` });
    advance(s, person, b);
  });
}
