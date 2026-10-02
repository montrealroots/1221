/**
 * SLATE — clothes that fit, and a tailor who takes them in (Stage 3 of
 * `docs/BACKLOG.md`, from 2026-10-01; the tailors in `content/tailors.ts`).
 *
 * **Fit.** A garment fits the body it was bought for: SLATE keeps the
 * weight it was bought or last altered at, and reads a garment as a size
 * off once the weight is more than 7.5% either side of it, its estimate of
 * a size's step; no body measurements are kept to read a size by. Shoes,
 * socks and accessories don't change with weight. A garment that doesn't
 * fit isn't worn (`wearable` in `systems/wardrobe.ts`), and on a day with
 * time for the shops one grown out of is bought again as a worn-out one is.
 *
 * **Taking in.** A garment too big can be taken in by a tailor in the town
 * you're in, at its published price, and is ready after its stated days
 * (a week where none is stated, SLATE's estimate), to collect with the dry
 * cleaning. A garment grown out of can't be let out that far.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { TAILORS, type Tailor } from '../content/tailors';
import type { Slot } from '../content/garmentcare';
import { itemById, type Item } from './items';
import { spend } from './household';
import { bodyOf } from './body';
import { BMI_EDGES, BODY_BY_COUNTRY, BODY_DEFAULT } from '../content/body';
import { CITIES } from '../content/geography';
import type { Garment } from './wardrobe';
import { CLOTHING_RETAILERS } from '../content/clothingcatalog';
import { SHOE_CHARTS, SIZE_CHARTS, type ShoeRow } from '../content/sizecharts';

export const FIT = { band: 0.075, weekDays: 7 } as const;
const UNSIZED: ReadonlySet<Slot> = new Set(['shoes', 'socks', 'accessory']);

/**
 * Which of a garment's sizes is yours, and what a size off does (from
 * 2026-10-02; until then the size chosen was kept and nothing read it).
 *
 * No retailer's chart is kept, nor a body's chest and waist, so SLATE takes
 * where your body mass index sits among your country's adults (NCD-RisC's
 * bands, both sexes' sides together, `BODY_BY_COUNTRY`) as where your size
 * sits among the sizes a garment comes in, smallest to largest: the middle
 * of the country wears the middle of the run. A size step is twice the fit
 * band, so a garment a size too big is made for a body 15% heavier and hangs
 * off you until a tailor takes it in, and one a size too small can't be worn.
 * Both are SLATE's estimates. A garment in one size fits everybody.
 */
export const SIZE_STEP = 2 * FIT.band;

const ALPHA: Readonly<Record<string, number>> = {
  XXXS: -3, XXS: -2, XS: -1, 'X-SMALL': -1, ECH: -1, S: 0, SMALL: 0, CH: 0, M: 1, MEDIUM: 1, L: 2, LARGE: 2, G: 2, XL: 3, 'X-LARGE': 3, EG: 3,
  XXL: 4, '2XL': 4, '2X': 4, 'XX-LARGE': 4, EEG: 4, XXXL: 5, '3XL': 5, '3X': 5, XXXXL: 6, '4XL': 6, '4X': 6, '5XL': 7,
};
/** A size's place in a run: its letters', or its number's; unknown where it's neither. */
export function sizeRank(label: string): number | undefined {
  const u = label.trim().toUpperCase();
  if (ALPHA[u] !== undefined) return ALPHA[u];
  const m = u.replace('½', '.5').match(/^(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) + (/LONG|TALL/.test(u) ? 0.01 : 0) : undefined;
}

/** A garment's sizes, smallest first; nothing for one that comes in one size or a run SLATE can't order. */
export function sizeRun(sizes: readonly string[]): string[] {
  if (sizes.length < 2) return [];
  const ranked = sizes.map((s) => ({ s, r: sizeRank(s) }));
  if (ranked.some((x) => x.r === undefined)) return [];
  return ranked.sort((a, b) => a.r! - b.r!).map((x) => x.s);
}

/** Where a body mass index sits among a country's adults, nought to one. */
export function bmiShare(country: string, bmi: number): number {
  const norms = BODY_BY_COUNTRY[country] ?? BODY_DEFAULT;
  const bands = norms.bands[0].map((m, i) => (m + norms.bands[1][i]!) / 2);
  const total = bands.reduce((a, b) => a + b, 0);
  let below = 0;
  for (let i = 0; i < bands.length; i += 1) {
    const lo = BMI_EDGES[i]!; const hi = BMI_EDGES[i + 1]!;
    if (bmi >= hi) { below += bands[i]!; continue; }
    if (bmi > lo) below += bands[i]! * (bmi - lo) / (hi - lo);
    break;
  }
  return Math.min(1, Math.max(0, below / total));
}

/**
 * Your measurements, as you've given them, and the department whose charts
 * you size by (from 2026-10-02): a chest or bust, a waist and hips, in
 * centimeters. Given, a garment from a retailer whose own chart SLATE keeps
 * for its market and that department (`content/sizecharts.ts`) is your
 * size by the chart: the smallest size whose range reaches yours, by bust
 * or chest for a top and by waist for a bottom. Not given, or with no chart,
 * the size is read from your body mass index, as before.
 */
export interface Measures { department: 'women' | 'men'; chestCm?: number; waistCm?: number; hipCm?: number; /** A foot's length, heel to toe (from later on 2026-10-02). */ footCm?: number }

/** What a garment is, for its chart: its retailer and the slot it's worn in. */
export interface Sized { retailer: string; slot: Slot; brand?: string }

/** A market's shoe label on a brand's chart: America's and Canada's US sizes, Britain's and Ireland's UK, Mexico's own. */
const SHOE_LABEL: Readonly<Record<string, 'US' | 'UK' | 'MX'>> = { US: 'US', CA: 'US', GB: 'UK', IE: 'UK', MX: 'MX' };

/** A shoe's row on its brand's chart for a size, and the label matching; nothing without a chart. */
export function shoeRow(person: Person, p: Sized, size?: string): ShoeRow | undefined {
  const m = person.measures;
  const r = CLOTHING_RETAILERS.find((x) => x.id === p.retailer);
  if (!m || !r || p.slot !== 'shoes') return undefined;
  const chart = SHOE_CHARTS.find((c) => c.market === r.market && c.department === m.department && (c.brand === p.brand || c.brand === r.name));
  const key = SHOE_LABEL[r.market];
  if (!chart || !key) return undefined;
  if (size === undefined) return m.footCm === undefined ? undefined : chart.rows.find((row) => row.footCm >= m.footCm!);
  return chart.rows.find((row) => row[key] !== null && String(row[key]).trim().toUpperCase() === size.trim().toUpperCase());
}

/** Your size by a retailer's own chart, where you've given your measurements and it keeps one; nothing otherwise. */
export function chartSize(person: Person, p: Sized, sizes: readonly string[]): string | undefined {
  const m = person.measures;
  if (!m) return undefined;
  const r = CLOTHING_RETAILERS.find((x) => x.id === p.retailer);
  const group = p.slot === 'bottom' ? 'bottoms' : p.slot === 'top' || p.slot === 'outer' || p.slot === 'dress' || p.slot === 'active' ? 'tops' : undefined;
  // Shoes by foot length, on the brand's own chart.
  if (p.slot === 'shoes' && r) {
    const row = shoeRow(person, p);
    const key = SHOE_LABEL[r.market];
    const label = row && key && row[key] !== null ? String(row[key]).trim().toUpperCase() : undefined;
    return label ? sizes.find((s) => s.trim().toUpperCase() === label) : undefined;
  }
  if (!r || !group) return undefined;
  const chart = SIZE_CHARTS.find((c) => c.market === r.market && c.department === m.department && c.group === group && (c.retailer === r.name || c.retailer.startsWith(`${r.name} (`)));
  const mine = group === 'bottoms' ? m.waistCm : m.chestCm;
  if (!chart || mine === undefined) return undefined;
  const offered = new Map(sizes.map((s) => [s.trim().toUpperCase(), s]));
  for (const row of chart.rows) {
    const span = group === 'bottoms' ? row.waist : row.bust ?? row.chest;
    if (!span || span[1] < mine) continue;
    const label = row.labels.find((l) => offered.has(l));
    if (label) return offered.get(label);
  }
  return undefined;
}

/** Your size in a garment's run, or nothing where it comes in one size: by the retailer's chart where it can be, by body mass index otherwise. */
export function sizeFor(sim: Simulation, person: Person, sizes: readonly string[], p?: Sized): string | undefined {
  const run = sizeRun(sizes);
  if (run.length === 0) return undefined;
  const charted = p ? chartSize(person, p, run) : undefined;
  if (charted) return charted;
  const body = bodyOf(sim, person);
  const share = bmiShare(CITIES.get(person.homeRegionId)?.countryId ?? '', body.weightKg / (body.heightCm / 100) ** 2);
  return run[Math.min(run.length - 1, Math.floor(share * run.length))];
}

/** The weight a garment in a size is made for: yours in your size, a step either way for each size off. */
export function fitKgFor(sim: Simulation, person: Person, sizes: readonly string[], chosen: string | undefined, p?: Sized): number {
  const kg = bodyOf(sim, person).weightKg;
  const run = sizeRun(sizes);
  const mine = sizeFor(sim, person, sizes, p);
  if (!chosen || !mine || !run.includes(chosen)) return kg;
  return kg * (1 + SIZE_STEP) ** (run.indexOf(chosen) - run.indexOf(mine));
}

/** Why measurements can't be kept as given, or nothing: each in centimeters, within what a body measures. */
export function measuresRefusal(m: Partial<Measures>): string | undefined {
  if (m.department !== 'women' && m.department !== 'men') return 'Choose whose charts to size by.';
  for (const v of [m.chestCm, m.waistCm, m.hipCm]) if (v !== undefined && !(Number.isFinite(v) && v >= 40 && v <= 220)) return 'Each measurement in centimeters, from 40 to 220.';
  if (m.footCm !== undefined && !(Number.isFinite(m.footCm) && m.footCm >= 10 && m.footCm <= 40)) return 'A foot in centimeters, from 10 to 40.';
  return undefined;
}

export const tailorsIn = (cityId: string): Tailor[] => TAILORS.filter((t) => t.cityId === cityId);
export const tailorById = (id: string): Tailor | undefined => TAILORS.find((t) => t.id === id);

/** How a garment sits now: as it should, too big, or grown out of. */
export function fitOf(person: Person, g: Garment): 'fits' | 'big' | 'small' {
  // A shoe shorter than the foot doesn't go on (from later on 2026-10-02).
  if (g.slot === 'shoes') return g.footCm !== undefined && person.measures?.footCm !== undefined && person.measures.footCm > g.footCm ? 'small' : 'fits';
  const kg = person.body?.weightKg;
  if (g.fitKg === undefined || kg === undefined || UNSIZED.has(g.slot)) return 'fits';
  const ratio = kg / g.fitKg - 1;
  return ratio > FIT.band ? 'small' : ratio < -FIT.band ? 'big' : 'fits';
}

/** The weight a garment is made for now. */
export const fitKgOf = (person: Person): number | undefined => person.body?.weightKg;

export function alterRefusal(person: Person, itemId: string, tailorId: string): string | undefined {
  const item = itemById(person, itemId) as (Item & { garment?: Garment }) | undefined;
  if (!item?.garment) return 'That isn’t a garment of yours.';
  const fit = fitOf(person, item.garment);
  if (fit === 'fits') return 'It fits.';
  if (fit === 'small') return 'It can’t be let out that far.';
  const t = tailorById(tailorId);
  if (!t) return 'There’s no such tailor.';
  if (t.cityId !== person.currentLocationId) return 'The tailor is in another town.';
  if (item.at.kind === 'service') return 'It’s away already.';
  return undefined;
}

export const alterCost = (sim: Simulation, t: Tailor): Money => { const c = Math.round(t.takeIn * 100); const cur = saveCurrency(sim.universe); return cur === t.currency ? c : exchange(c, t.currency, cur) ?? c; };

export function registerTailoring(sim: Simulation): void {
  sim.onCommand<{ itemId: string; tailorId: string }, { readyAt: number; paid: Money }>('clothes.alter', (p, { sim: s }) => {
    const person = s.player;
    const no = alterRefusal(person, String(p?.itemId), String(p?.tailorId));
    if (no) throw new CommandError(no);
    const t = tailorById(String(p.tailorId))!;
    const item = itemById(person, String(p.itemId)) as Item & { garment: Garment };
    const paid = alterCost(s, t);
    if (!spend(s, person, paid, `${t.name}, taken in`, 'clothing')) throw new CommandError('The payment didn’t go through.');
    const readyAt = s.now + (t.turnaroundDays ?? FIT.weekDays) * MS_DAY;
    item.at = { kind: 'service', serviceId: `tailor:${t.cityId}:${t.id}`, readyAt };
    item.garment.fitKg = fitKgOf(person);
    return { readyAt, paid };
  });
}
