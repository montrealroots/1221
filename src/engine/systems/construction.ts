/**
 * SLATE — building a house on a lot one owns (docs/WORLD.md, stage 5a), from
 * 2026-09-29, on the figures in `content/construction.ts`.
 *
 * A lot in New York, New Haven, Los Angeles or London takes a house of a
 * published size where it fits the zoning's bulk. The permit and every fee
 * of the place are paid when the work is started. The permit comes after the
 * place's wait, and the contractor builds in NAHB's seven stages, each
 * billed at its share of the contract when it's finished, the inspections
 * the place names at its end. A bill the bank can't pay stops the work until
 * Pay The Contractor pays it. Finished, the house is a home they own
 * (`homes.ts`), worth what the land and the building cost, the lot gone into
 * it; the Homes screen moves them in.
 *
 * Not kept, and said so: a construction loan, delays and overruns (no
 * authority publishes a rate for a house), change orders, a structural
 * warranty, builder's risk insurance, and a failed inspection.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { LAND_MARKETS } from '../content/land';
import { BUILD_RULES, CIL_CLAWBACK_YEARS, INSPECTIONS, LA_FEES, LONDON_BUILDING_CONTROL, LONDON_CIL, NEW_HAVEN_FEES, NYC_FEES, SQFT_PER_M2, STAGES, type BuildPlace, type Design } from '../content/construction';
import { parcelsOf, type Parcel } from './land';
import { ownBuilt } from './homes';
import { inTheBank, payFromBank } from './household';

export const BUILD_STAGE_KIND = 'build.stage';
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
  /** A finished stage's bill the bank couldn't pay, and when the work stopped for it. */
  unpaid?: Money;
  stoppedAt?: Instant;
  log: { at: Instant; line: string }[];
}

const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };
const cents = (units: number) => Math.round(units * 100);

/** Where a parcel is built on, or nothing where SLATE builds nothing yet. */
export function buildPlaceOf(p: Parcel): BuildPlace | undefined {
  const m = LAND_MARKETS[p.market]!;
  if (m.kind !== 'lot') return undefined;
  return m.place === 'nyc' || m.place === 'new-haven' || m.place === 'los-angeles' || m.place === 'london' ? m.place : undefined;
}

/** The most floor a lot takes, square feet, or none where its zoning's bulk isn't kept. */
export function mostFloor(place: BuildPlace, acres: number): number | undefined {
  const bulk = BUILD_RULES[place].bulk;
  const lot = acres * 43_560;
  if (!bulk) return undefined;
  return 'floorArea' in bulk ? lot * bulk.floorArea : lot * bulk.coverage * bulk.stories;
}

export interface BuildQuote {
  currency: string;
  design: Design;
  contract: Money;
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
  const rates = LONDON_CIL[borough ?? 'Croydon'] ?? LONDON_CIL.Croydon!;
  const m2 = sqft / SQFT_PER_M2;
  return { lines: [{ label: 'Building Control Charge', amount: cents(LONDON_BUILDING_CONTROL.fee * (1 + LONDON_BUILDING_CONTROL.vat)) }], cil: cents((rates.borough + rates.mayor) * m2) };
}

/** A house on a lot: the contract, the fees, the stages and their days. */
export function buildQuote(p: Parcel, designId: string, live: boolean): BuildQuote | string {
  const place = buildPlaceOf(p);
  if (!place) return 'SLATE builds only on a town lot in New York, New Haven, Los Angeles or London yet; a house on farmland waits for a planning permission it doesn’t take.';
  const rules = BUILD_RULES[place];
  const design = rules.designs.find((d) => d.id === designId);
  if (!design) return 'That isn’t a house built there.';
  const most = mostFloor(place, p.acres);
  if (most !== undefined && design.sqft > most) return `It doesn’t fit: the lot takes ${Math.floor(most).toLocaleString('en-US')} sq ft at most, by ${rules.bulk!.basis}.`;
  const area = rules.unit === 'sqft' ? design.sqft : design.sqft / SQFT_PER_M2;
  const contract = cents(rules.rate * area);
  const borough = LAND_MARKETS[p.market]!.label.match(/In (Hackney|Croydon|Havering)/)?.[1];
  const f = buildFees(place, design.sqft, contract, borough);
  const lines = [...f.lines];
  if (f.cil > 0) lines.push({ label: live ? 'Community Infrastructure Levy, Spared For A Self-Build' : 'Community Infrastructure Levy', amount: live ? 0 : f.cil });
  const feesTotal = lines.reduce((a, l) => a + l.amount, 0);
  const whole = STAGES.reduce((a, s) => a + s.usd, 0);
  let paid = 0;
  const stages = STAGES.map((s, i) => {
    const amount = i === STAGES.length - 1 ? contract - paid : Math.round(contract * s.usd / whole);
    paid += amount;
    return { name: s.name, amount, days: Math.max(1, Math.round(rules.buildMonths * MONTH_DAYS * s.usd / whole)) };
  });
  return { currency: rules.currency, design, contract, fees: lines, feesTotal, spared: live ? f.cil : 0, total: contract + feesTotal, stages, permitDays: Math.round(rules.permitMonths * MONTH_DAYS) };
}

/** Why a house can't be started, or nothing. */
export function buildRefusal(sim: Simulation, person: Person, parcelId: string, designId: string, live: boolean): string | undefined {
  if (person.building) return 'A house is being built already.';
  const p = parcelsOf(person).find((x) => x.id === parcelId && x.soldAt === undefined);
  if (!p) return 'That isn’t land you own.';
  if (p.selling) return 'It’s for sale.';
  const q = buildQuote(p, designId, live);
  if (typeof q === 'string') return q;
  const fees = inSave(sim, q.feesTotal, q.currency);
  if (inTheBank(sim, person) < fees) return `The permit and fees, ${formatMoney(fees, saveCurrency(sim.universe), { cents: false })}, are more than the bank holds.`;
  return undefined;
}

const say = (sim: Simulation, person: Person, title: string, body: string, importance = 60) => { if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title, body, importance, route: '/workspace/land' }); };

function next(sim: Simulation, person: Person, b: Build): void {
  sim.schedule({ at: sim.now + b.days[b.stage]! * MS_DAY, kind: BUILD_STAGE_KIND, label: `${STAGES[b.stage]!.name} Done`, category: 'home', priority: 30, payload: { personId: person.id } });
}

/** A stage's bill paid: its inspection, then the next stage, or the house finished. */
function advance(sim: Simulation, person: Person, b: Build): void {
  const inspection = INSPECTIONS[b.place][b.stage];
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
  const address = `Your House ${m.label.replace(/^A (Lot|Plot) /, '').replace(/, With Planning Permission$/, '')}`;
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
  delete person.building;
  say(sim, person, 'Your House Is Finished', `${address} is built, and yours. Move In on the Homes screen.`, 80);
}

export function registerConstruction(sim: Simulation): void {
  sim.onCommand<{ parcelId: string; designId: string; live?: boolean }, { fees: Money; finishesBy: Instant }>('build.start', (p, { sim: s }) => {
    const person = s.player;
    const live = p?.live !== false;
    const no = buildRefusal(s, person, String(p?.parcelId), String(p?.designId), live);
    if (no) throw new CommandError(no);
    const parcel = parcelsOf(person).find((x) => x.id === p.parcelId)!;
    const q = buildQuote(parcel, p.designId, live) as BuildQuote;
    const fees = inSave(s, q.feesTotal, q.currency);
    if (fees > 0 && !payFromBank(s, person, fees, `Permits and fees for building on ${LAND_MARKETS[parcel.market]!.label}`, 'construction')) throw new CommandError('The bank couldn’t pay the permit and fees.');
    const place = buildPlaceOf(parcel)!;
    const b: Build = {
      parcelId: parcel.id, place, cityId: LAND_MARKETS[parcel.market]!.cityId, designId: q.design.id, live, startedAt: s.now,
      contract: q.contract, fees: q.feesTotal, spared: q.spared, amounts: q.stages.map((x) => x.amount), days: q.stages.map((x) => x.days), stage: -1,
      log: [{ at: s.now, line: place === 'london' ? 'Building notice given' : 'Permit applied for' }],
    };
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

  sim.onSchedule(BUILD_STAGE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const b = person?.building;
    if (!person || !b) return;
    if (b.stage === -1) {
      b.log.push({ at: s.now, line: b.place === 'london' ? 'Work started' : 'Permit issued; work started' });
      b.stage = 0;
      next(s, person, b);
      return;
    }
    const due = inSave(s, b.amounts[b.stage]!, BUILD_RULES[b.place].currency);
    if (!payFromBank(s, person, due, `The contractor, ${STAGES[b.stage]!.name}`, 'construction')) {
      b.unpaid = b.amounts[b.stage]!;
      b.stoppedAt = s.now;
      b.log.push({ at: s.now, line: `${STAGES[b.stage]!.name} done; its bill unpaid, work stopped` });
      say(s, person, 'Work Stopped', `The contractor finished the ${STAGES[b.stage]!.name.toLowerCase()} on ${formatDate(s.now, s.zone)} and stopped until ${formatMoney(due, saveCurrency(s.universe), { cents: false })} is paid.`, 80);
      return;
    }
    b.log.push({ at: s.now, line: `${STAGES[b.stage]!.name} done and paid` });
    advance(s, person, b);
  });
}
