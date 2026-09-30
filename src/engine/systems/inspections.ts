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
 * A test failed isn't drawn: no pass rate is published for these.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { saveCurrency } from '../core/money';
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
}

export const INSPECTION_RULES: Readonly<Partial<Record<Jurisdiction, InspectionRule>>> = {
  'US-NY': { label: 'State Inspection', currency: 'USD', fee: (city) => (city === 'us-ny-newyork' ? 37 : 21), from: 'sale', first: 1, every: () => 1 },
  'US-CT': { label: 'Emissions Test', currency: 'USD', fee: () => 20, from: 'registration', first: 4, every: () => 2 },
  GB: { label: 'MOT', currency: 'GBP', fee: () => 54.85, from: 'registration', first: 3, every: () => 1 },
  IE: { label: 'NCT', currency: 'EUR', fee: () => 60, from: 'registration', first: 4, every: (age) => (age >= 10 ? 1 : 2) },
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
  v.inspected = due;
  return true;
}

export const INSPECTION_FEE_NOTE = (j: Jurisdiction, cityId: string): string | undefined => {
  const r = INSPECTION_RULES[j];
  return r ? `${r.label}, ${r.fee(cityId).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${r.currency}` : undefined;
};

