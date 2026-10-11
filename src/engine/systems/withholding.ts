/**
 * SLATE — what an employer withholds from a paycheck for a state, the District or a city, by each one's own published
 * method (from the remaining-gaps pass of 2026-10-11; research-state-tax-in-dc-ok.json, research-local-income-taxes.json):
 * Indiana's WH-4, its rate on the pay less $1,000 a year for the one exemption, and Marion County's 2.02% on the same;
 * the District's D-4, the pay annualized less one $4,150 allowance and taxed by its own table with no standard deduction;
 * Oklahoma's OW-2 table for a single filer, less one $1,000 allowance; Philadelphia's Wage Tax at the resident's or the
 * nonresident's rate in force on the day; Columbus's 2.5% where the work is done there, or the resident works where no
 * city taxes it. Kept by authority (`YearEarnings.withheldBy`) and reconciled on the return. In play a student's only
 * paychecks are New Haven's, so this serves the engine's saves elsewhere and its tests.
 */
import type { Money } from '../core/money';
import type { Instant } from '../core/time';
import { applyBrackets, INCOME_TAX_RULES, LOCAL_TAX } from '../content/tax';
import { stateOf } from './earnings';

/** Oklahoma's 2026 OW-2 annual table for a single filer: over each threshold (dollars), the tax to it and the rate above. */
const OW2_SINGLE: readonly (readonly [number, number, number])[] = [[0, 0, 0], [10_100, 0, 0.025], [11_250, 28.75, 0.035], [13_550, 109.25, 0.045]];
/** The District's withholding allowance, a year's (D-4). */
const DC_ALLOWANCE = 4_150_00;

/** Indiana's rate on a day: 3.0% in 2025, 2.95% in 2026, 2.9% from 2027 (IC 6-3-2-1). */
export function indianaRate(at: Instant): number {
  const y = new Date(at).getUTCFullYear();
  return y <= 2025 ? 0.03 : y === 2026 ? 0.0295 : 0.029;
}

/** Philadelphia's Wage Tax on the day: the resident's or the nonresident's, which change each 1 July. */
export function philadelphiaRate(at: Instant, resident: boolean): number {
  const d = new Date(at);
  const fy = d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  const by: Record<number, readonly [number, number]> = { 2024: [0.0375, 0.0344], 2025: [0.0374, 0.0343], 2026: [0.03735, 0.03425], 2027: [0.0373, 0.0342] };
  const [res, non] = by[Math.min(2027, Math.max(2024, fy))]!;
  return resident ? res : non;
}

/** What one paycheck of `gross` withholds for each state, district and city authority, paid `periods` times a year. */
export function paycheckWithholding(homeCity: string, workCity: string, gross: Money, periods: number, at: Instant): Record<string, Money> {
  const out: Record<string, Money> = {};
  const add = (who: string, v: number) => { const c = Math.round(v); if (c > 0) out[who] = (out[who] ?? 0) + c; };
  const home = stateOf(homeCity);
  const work = stateOf(workCity);
  const yearly = gross * periods;
  // Indiana: the state's rate for a resident, and Marion County's for one who lives or works there, on the pay less the
  // exemption's share. A resident of a reciprocal state working in Indiana owes the county's, not the state's.
  if (home === 'us-in') add('us-in', Math.max(0, gross - 1_000_00 / periods) * indianaRate(at));
  if (homeCity === 'us-in-indianapolis' || workCity === 'us-in-indianapolis') add('us-in', Math.max(0, gross - 1_000_00 / periods) * 0.0202);
  // The District: residents only, by its own table on the annualized pay less the allowance.
  if (home === 'us-dc') {
    const rule = INCOME_TAX_RULES.find((r) => r.jurisdictionCode === 'US-DC')!;
    add('us-dc', applyBrackets(Math.max(0, yearly - DC_ALLOWANCE), rule) / periods);
  }
  // Oklahoma: the OW-2 table, for a resident or work done there.
  if (home === 'us-ok' || work === 'us-ok') {
    const annual = Math.max(0, yearly - 1_000_00) / 100;
    const row = [...OW2_SINGLE].reverse().find(([over]) => annual > over) ?? OW2_SINGLE[0]!;
    add('us-ok', ((row[1] + (annual - row[0]) * row[2]) * 100) / periods);
  }
  // Philadelphia: its Wage Tax, resident or not.
  if (homeCity === 'us-pa-philadelphia' || workCity === 'us-pa-philadelphia') add('us-pa-philadelphia', gross * philadelphiaRate(at, homeCity === 'us-pa-philadelphia'));
  // Columbus: work done there, or a resident working where no city taxes the work.
  if (workCity === 'us-oh-columbus' || (homeCity === 'us-oh-columbus' && !LOCAL_TAX[workCity])) add('us-oh-columbus', gross * 0.025);
  return out;
}
