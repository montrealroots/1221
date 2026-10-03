/**
 * SLATE — a car's periodic inspection (docs/WORLD.md, stage 7a), from
 * 2026-09-29, researched in docs/research/world/research-vehiclework.json.
 *
 * Where the law asks one, on its own cycle, at its published fee, paid from
 * the bank as the month comes round (\`vehicle.month\` in \`vehicles.ts\`), or
 * owed where it can't be:
 * - New York, every 12 months: $10 for safety and $27 for the emissions test
 *   in the New York metropolitan area, $11 outside it (DMV VS-77), the
 *   sticker from its sale.
 * - Connecticut, an emissions test every two years from a car's fourth year,
 *   $20.
 * - England, Scotland and Wales, the MOT from the third anniversary of
 *   registration, then yearly, £54.85 at most (gov.uk).
 * - Ireland, the NCT at four years, every two until ten, then yearly, €60
 *   (NCTS, from 1 January 2025).
 * - Mexico City, the verificación every six months, 5.625 UMA with IVA,
 *   MX$765.45 from 1 February 2026, read secondhand and the arithmetic
 *   checked.
 * Ontario and British Columbia inspect a private car only on its sale, and
 * California's smog check, from later on 2026-09-30
 * (`docs/research/world/research-mods-smog.json`): every two years from a
 * car's eighth model year, at the average an initial test cost in August 2026
 * in BAR's own report, $69.16, and the $8.25 certificate; 7.60% of the OBD
 * tests on cars from 2000 fail it that month, and the repair is CarMD's, as
 * New York's; an electric car is exempt. Until then it was said to be priced
 * by each station and wasn't kept.
 * A test failed is drawn, from 2026-09-30, at each place's published rate
 * (`docs/research/world/research-upkeep.json`), the repair paid and any
 * retest's fee with it:
 * - New York: 4.94% fail the emissions test in the New York metropolitan
 *   area and 4.53% upstate, and 1.06% and 1.88% the safety one (DEC's 2024
 *   I/M report), taken together; a repair at CarMD's $554.01 average for a
 *   check-engine light, the nearest published figure (secondary), and the
 *   retest at the same station within 30 days, which SLATE doesn't charge.
 * - Connecticut: 7.4% of cars fail (the 2024 I/M report); CarMD's repair,
 *   and the one free retest within 60 days.
 * - Great Britain: by the car's age from 2026-10-01, motdata.uk's reading of
 *   DVSA's anonymized 2024 tests of cars (`docs/research/world/research-aviation-boats-credit-mot.json`, secondary):
 *   10.7% fail the first MOT at three, 22.8% at ten and 30.5% at fifteen,
 *   held there past it, as its later ages were read only from an excerpt.
 *   Until then 27.51% failed at any age, DVSA's rate for cars and vans
 *   together, which counts a defect fixed during the test as a failure;
 *   DVSA's own table by age is only of lorries and buses. The bill after a failure,
 *   BookMyGarage's invoices, £332 at three to five years and £425 from six,
 *   less the test fee they include (secondary); the partial retest free
 *   within ten working days.
 * - Ireland: 49.43% fail the full test (NCTS's 2024 pass rate of 50.57%),
 *   and the €40 retest that needs equipment. No repair figure is published
 *   in Ireland, so SLATE takes Britain's, in euros, its estimate.
 * - Mexico City publishes no rejection rate, and none is drawn.
 * Until 2026-09-30 no test was failed, the rates being thought unpublished.
 * From 2026-10-01 a car with its check engine light lit for a fault
 * (`systems/repairs.ts`) fails New York's, Connecticut's and California's
 * test whatever the draw, those tests reading the car's computer, and the
 * repair is that fault's.
 */

import type { Simulation } from '../core/simulation';
import { TIRE_SET, odometerOf, tiresWorn } from './tires';
import { HALOGENS_BACK_GBP } from './mods';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency } from '../core/money';
import { exchange } from '../content/currency';
import type { Jurisdiction } from '../content/vehiclefees';
import type { VehicleKind } from '../content/vehiclecatalog';
import { BIKE_FEES } from '../content/vehiclefees';
import { owe, payFromBank } from './household';
import { READS_THE_LIGHT } from './repairs';

const YEAR_MS = 365.2425 * MS_DAY;

/** What an inspection reads of a car. */
type Inspected = { id: string; boughtAt: Instant; ageAtPurchase: number; jurisdiction: Jurisdiction; cityId: string; fault?: { usd: number }; km?: number; odometerAtPurchase?: number; tiresAtKm?: number; mods?: readonly string[] };

export interface InspectionRule {
  label: string;
  currency: string;
  fee: (cityId: string) => number;
  /** From the sale, or from registration at the car's age. */
  from: 'sale' | 'registration';
  /** Years to the first, and then between, by the car's age. */
  first: number;
  every: (ageYears: number) => number;
  /** The share that fail, the repair in its money by the car's age, and the retest's fee. */
  fails?: { rate: (cityId: string, ageYears: number) => number; repair: { currency: string; amount: (ageYears: number) => number }; retest: number };
}

const CARMD = { currency: 'USD', amount: () => 554.01 };
const AFTER_MOT = { currency: 'GBP', amount: (age: number) => (age >= 6 ? 425 : 332) - 54.85 };
/** The share of cars failing the MOT at three years old, four and on to fifteen. */
export const MOT_FAIL_BY_AGE = [0.107, 0.111, 0.126, 0.142, 0.161, 0.183, 0.205, 0.228, 0.247, 0.264, 0.281, 0.297, 0.305] as const;
export const motFails = (age: number): number => MOT_FAIL_BY_AGE[Math.max(0, Math.min(MOT_FAIL_BY_AGE.length - 1, Math.floor(age) - 3))]!;

export const INSPECTION_RULES: Readonly<Partial<Record<Jurisdiction, InspectionRule>>> = {
  'US-NY': { label: 'State Inspection', currency: 'USD', fee: (city) => (city === 'us-ny-newyork' ? 37 : 21), from: 'sale', first: 1, every: () => 1, fails: { rate: (city) => (city === 'us-ny-newyork' ? 0.0494 + 0.0106 : 0.0453 + 0.0188), repair: CARMD, retest: 0 } },
  'US-CT': { label: 'Emissions Test', currency: 'USD', fee: () => 20, from: 'registration', first: 4, every: () => 2, fails: { rate: () => 0.074, repair: CARMD, retest: 0 } },
  GB: { label: 'MOT', currency: 'GBP', fee: () => 54.85, from: 'registration', first: 3, every: () => 1, fails: { rate: (_, age) => motFails(age), repair: AFTER_MOT, retest: 0 } },
  IE: { label: 'NCT', currency: 'EUR', fee: () => 60, from: 'registration', first: 4, every: (age) => (age >= 10 ? 1 : 2), fails: { rate: () => 1 - 0.5057, repair: AFTER_MOT, retest: 40 } },
  'US-CA': { label: 'Smog Check', currency: 'USD', fee: () => 69.16 + 8.25, from: 'registration', first: 8, every: () => 2, fails: { rate: () => 0.076, repair: CARMD, retest: 0 } },
  'MX-CMX': { label: 'Verificación', currency: 'MXN', fee: () => 765.45, from: 'sale', first: 0.5, every: () => 0.5 },
};

/** The car's inspections owed from its anchor, the first due after a moment; or nothing where none is kept. */
export function nextInspection(v: { boughtAt: Instant; ageAtPurchase: number; jurisdiction: Jurisdiction }, after: Instant): Instant | undefined {
  const rule = INSPECTION_RULES[v.jurisdiction];
  if (!rule) return undefined;
  const registered = v.boughtAt - v.ageAtPurchase * YEAR_MS;
  const anchor = rule.from === 'sale' ? v.boughtAt : registered;
  let due = anchor + rule.first * YEAR_MS;
  for (let guard = 0; due <= after && guard < 400; guard += 1) due += rule.every((due - registered) / YEAR_MS) * YEAR_MS;
  return due;
}

/** Any inspection come due since the last: paid, or owed; true if one was. */
export function inspectIfDue(sim: Simulation, person: Person, v: Inspected & { inspected?: Instant; soldAt?: Instant }, kind: VehicleKind = 'car'): boolean {
  if (v.soldAt !== undefined) return false;
  // A motorcycle's test is kept only in Britain, the MOT at its £29.65 (from 2026-09-30); elsewhere a motorcycle's isn't researched.
  if ((kind === 'motorcycle' || kind === 'scooter') && v.jurisdiction !== 'GB') return false;
  const rule = INSPECTION_RULES[v.jurisdiction];
  const due = nextInspection(v, v.inspected ?? v.boughtAt);
  if (!rule || due === undefined || due > sim.now) return false;
  const cur = saveCurrency(sim.universe);
  const cents = Math.round((kind === 'motorcycle' || kind === 'scooter' ? BIKE_FEES.GB.mot : rule.fee(v.cityId)) * 100);
  const amount = cur === rule.currency ? cents : exchange(cents, rule.currency, cur) ?? cents;
  if (!payFromBank(sim, person, amount, `The car’s ${rule.label}`, 'vehicle')) owe(sim, person, amount, `The car’s ${rule.label}`, 'vehicle');
  const failed = inspectionFails(sim, v, due);
  if (failed) {
    const inSave = (units: number, from: string) => { const c = Math.round(units * 100); return cur === from ? c : exchange(c, from, cur) ?? c; };
    const bill = inSave(failed.repair, failed.repairCurrency) + inSave(failed.retest, rule.currency);
    if (!payFromBank(sim, person, bill, `The car’s repair after its ${rule.label}, and the retest`, 'vehicle')) owe(sim, person, bill, `The car’s repair after its ${rule.label}`, 'vehicle');
    // The fault the light showed is the one mended (`systems/repairs.ts`).
    if (failed.light) delete v.fault;
    if (failed.tires) v.tiresAtKm = odometerOf(v);
    if (failed.led) v.mods = (v.mods ?? []).filter((m) => m !== 'led');
    if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: `The Car Failed Its ${rule.label}`, body: `Repaired and passed on the retest: ${formatMoney(bill, cur, { cents: false })}.`, importance: 55, route: '/workspace/vehicles' });
  }
  v.inspected = due;
  return true;
}

/** Whether the test due fails (decider `vehicle.inspection`), and what putting it right costs, in the repair's and the rule's money. */
export function inspectionFails(sim: Simulation, v: Inspected, due: Instant): { repair: number; repairCurrency: string; retest: number; light?: boolean; tires?: boolean; led?: boolean } | undefined {
  const fails = INSPECTION_RULES[v.jurisdiction]?.fails;
  // Tires past their life, at the legal limit, fail it, and a set is fitted (`tiresWorn`, from 2026-10-03).
  const set = TIRE_SET[v.jurisdiction];
  if (fails && set && tiresWorn(v)) return { repair: set.price, repairCurrency: set.currency, retest: fails.retest, tires: true };
  // LEDs in a halogen headlamp fail the MOT, and the halogens go back (`systems/mods.ts`, from 2026-10-03).
  if (fails && v.jurisdiction === 'GB' && v.mods?.includes('led')) return { repair: HALOGENS_BACK_GBP, repairCurrency: 'GBP', retest: fails.retest, led: true };
  // A lit check engine light fails a test that reads the car's computer, whatever the draw (`systems/repairs.ts`, from 2026-10-01).
  if (fails && v.fault && READS_THE_LIGHT.has(v.jurisdiction)) return { repair: v.fault.usd, repairCurrency: 'USD', retest: fails.retest, light: true };
  const age = (due - (v.boughtAt - v.ageAtPurchase * YEAR_MS)) / YEAR_MS;
  if (!fails || sim.rng('vehicle.inspection', v.id, due).next() >= fails.rate(v.cityId, age)) return undefined;
  return { repair: fails.repair.amount(age), repairCurrency: fails.repair.currency, retest: fails.retest };
}

export const INSPECTION_FEE_NOTE = (j: Jurisdiction, cityId: string): string | undefined => {
  const r = INSPECTION_RULES[j];
  return r ? `${r.label}, ${r.fee(cityId).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${r.currency}` : undefined;
};

