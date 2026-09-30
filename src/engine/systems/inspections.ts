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
 * California's smog check is priced by each station, so none is kept there.
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
 * - Great Britain: 27.51% fail first time (DVSA, 2025 to 2026, cars and vans
 *   together, which is how it's published); the bill after a failure,
 *   BookMyGarage's invoices, £332 at three to five years and £425 from six,
 *   less the test fee they include (secondary); the partial retest free
 *   within ten working days.
 * - Ireland: 49.43% fail the full test (NCTS's 2024 pass rate of 50.57%),
 *   and the €40 retest that needs equipment. No repair figure is published
 *   in Ireland, so SLATE takes Britain's, in euros, its estimate.
 * - Mexico City publishes no rejection rate, and none is drawn.
 * Until 2026-09-30 no test was failed, the rates being thought unpublished.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency } from '../core/money';
import { exchange } from '../content/currency';
import type { Jurisdiction } from '../content/vehiclefees';
import { owe, payFromBank } from './household';

const YEAR_MS = 365.2425 * MS_DAY;

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
  fails?: { rate: (cityId: string) => number; repair: { currency: string; amount: (ageYears: number) => number }; retest: number };
}

const CARMD = { currency: 'USD', amount: () => 554.01 };
const AFTER_MOT = { currency: 'GBP', amount: (age: number) => (age >= 6 ? 425 : 332) - 54.85 };

export const INSPECTION_RULES: Readonly<Partial<Record<Jurisdiction, InspectionRule>>> = {
  'US-NY': { label: 'State Inspection', currency: 'USD', fee: (city) => (city === 'us-ny-newyork' ? 37 : 21), from: 'sale', first: 1, every: () => 1, fails: { rate: (city) => (city === 'us-ny-newyork' ? 0.0494 + 0.0106 : 0.0453 + 0.0188), repair: CARMD, retest: 0 } },
  'US-CT': { label: 'Emissions Test', currency: 'USD', fee: () => 20, from: 'registration', first: 4, every: () => 2, fails: { rate: () => 0.074, repair: CARMD, retest: 0 } },
  GB: { label: 'MOT', currency: 'GBP', fee: () => 54.85, from: 'registration', first: 3, every: () => 1, fails: { rate: () => 0.2751, repair: AFTER_MOT, retest: 0 } },
  IE: { label: 'NCT', currency: 'EUR', fee: () => 60, from: 'registration', first: 4, every: (age) => (age >= 10 ? 1 : 2), fails: { rate: () => 1 - 0.5057, repair: AFTER_MOT, retest: 40 } },
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
export function inspectIfDue(sim: Simulation, person: Person, v: { id: string; boughtAt: Instant; ageAtPurchase: number; jurisdiction: Jurisdiction; cityId: string; inspected?: Instant; soldAt?: Instant }): boolean {
  if (v.soldAt !== undefined) return false;
  const rule = INSPECTION_RULES[v.jurisdiction];
  const due = nextInspection(v, v.inspected ?? v.boughtAt);
  if (!rule || due === undefined || due > sim.now) return false;
  const cur = saveCurrency(sim.universe);
  const cents = Math.round(rule.fee(v.cityId) * 100);
  const amount = cur === rule.currency ? cents : exchange(cents, rule.currency, cur) ?? cents;
  if (!payFromBank(sim, person, amount, `The car’s ${rule.label}`, 'vehicle')) owe(sim, person, amount, `The car’s ${rule.label}`, 'vehicle');
  const failed = inspectionFails(sim, v, due);
  if (failed) {
    const inSave = (units: number, from: string) => { const c = Math.round(units * 100); return cur === from ? c : exchange(c, from, cur) ?? c; };
    const bill = inSave(failed.repair, failed.repairCurrency) + inSave(failed.retest, rule.currency);
    if (!payFromBank(sim, person, bill, `The car’s repair after its ${rule.label}, and the retest`, 'vehicle')) owe(sim, person, bill, `The car’s repair after its ${rule.label}`, 'vehicle');
    if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: `The Car Failed Its ${rule.label}`, body: `Repaired and passed on the retest: ${formatMoney(bill, cur, { cents: false })}.`, importance: 55, route: '/workspace/vehicles' });
  }
  v.inspected = due;
  return true;
}

/** Whether the test due fails (decider `vehicle.inspection`), and what putting it right costs, in the repair's and the rule's money. */
export function inspectionFails(sim: Simulation, v: { id: string; boughtAt: Instant; ageAtPurchase: number; jurisdiction: Jurisdiction; cityId: string }, due: Instant): { repair: number; repairCurrency: string; retest: number } | undefined {
  const fails = INSPECTION_RULES[v.jurisdiction]?.fails;
  if (!fails || sim.rng('vehicle.inspection', v.id, due).next() >= fails.rate(v.cityId)) return undefined;
  const age = (due - (v.boughtAt - v.ageAtPurchase * YEAR_MS)) / YEAR_MS;
  return { repair: fails.repair.amount(age), repairCurrency: fails.repair.currency, retest: fails.retest };
}

export const INSPECTION_FEE_NOTE = (j: Jurisdiction, cityId: string): string | undefined => {
  const r = INSPECTION_RULES[j];
  return r ? `${r.label}, ${r.fee(cityId).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${r.currency}` : undefined;
};

