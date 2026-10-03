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
 * cleaning.
 *
 * **Letting out, and how far either way** (from 2026-10-02, until when a
 * garment grown out of was never let out). Proper Cloth's own reference
 * gives what a seam's spare cloth allows: a trouser waist let out 1.5 inches
 * around and taken in 2; a jacket's chest and middle let out 0.8 and taken
 * in 2. SLATE reads a size step as 2 inches around, as trouser waists and
 * jacket chests are numbered, so a bottom lets out three quarters of a size
 * and a suit or a coat two fifths, once, its spare cloth then used; each is
 * taken in a size at most. Proper Cloth gives no shirt's or dress's figure;
 * until 2026-10-03 those were only taken in, and since they let out half a
 * size, SLATE's reading of the trade's 'an inch or two' at a shirt's chest,
 * and take in a size at most. Letting out costs what the
 * tailor charges to take in the waist, as Nordstrom, Stitch It and Paul
 * Henry Tailoring each price a waist the same either way.
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
export interface Measures { department: 'women' | 'men'; chestCm?: number; waistCm?: number; hipCm?: number; /** A foot's length, heel to toe (from later on 2026-10-02). */ footCm?: number; /** A ring finger's circumference, millimeters (from 2026-10-03). */ fingerMm?: number }

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

/** A retailer's own chart for a garment, in a department (yours where given, else women's then men's), for the product page (from 2026-10-02). */
export function chartFor(person: Person, p: Sized): import('../content/sizecharts').SizeChart | undefined {
  const r = CLOTHING_RETAILERS.find((x) => x.id === p.retailer);
  const group = p.slot === 'bottom' ? 'bottoms' : p.slot === 'top' || p.slot === 'outer' || p.slot === 'dress' || p.slot === 'active' ? 'tops' : undefined;
  if (!r || !group) return undefined;
  const departments = person.measures ? [person.measures.department] : (['women', 'men'] as const);
  for (const d of departments) {
    const chart = SIZE_CHARTS.find((c) => c.market === r.market && c.department === d && c.group === group && (c.retailer === r.name || c.retailer.startsWith(`${r.name} (`)));
    if (chart) return chart;
  }
  return undefined;
}

/**
 * Ring sizes (from 2026-10-03; `research-clothing-gaps.json`, H.Samuel's
 * own chart): each UK letter's US and EU size and the inside circumference
 * it fits, millimeters.
 */
export const RING_SIZES: readonly { uk: string; us: number; eu: number; mm: number }[] = [
  { uk: 'H', us: 3.75, eu: 46.5, mm: 46.02 }, { uk: 'I', us: 4.25, eu: 47.75, mm: 47.25 }, { uk: 'J', us: 4.625, eu: 49, mm: 48.38 }, { uk: 'K', us: 5.125, eu: 50, mm: 49.64 },
  { uk: 'L', us: 5.5, eu: 51.75, mm: 50.58 }, { uk: 'M', us: 6, eu: 52.75, mm: 51.87 }, { uk: 'N', us: 6.5, eu: 54, mm: 53.16 }, { uk: 'O', us: 7, eu: 55.25, mm: 54.51 },
  { uk: 'P', us: 7.5, eu: 56.5, mm: 55.76 }, { uk: 'Q', us: 8, eu: 57.75, mm: 57.15 }, { uk: 'R', us: 8.625, eu: 59, mm: 58.47 }, { uk: 'S', us: 9.125, eu: 60.25, mm: 60 },
  { uk: 'T', us: 9.625, eu: 61.5, mm: 61.29 }, { uk: 'U', us: 10.25, eu: 62.75, mm: 62.89 }, { uk: 'V', us: 10.625, eu: 63, mm: 63.84 }, { uk: 'W', us: 11.125, eu: 65, mm: 65.22 },
  { uk: 'X', us: 11.625, eu: 66.25, mm: 66.54 }, { uk: 'Y', us: 12, eu: 67.5, mm: 67.51 }, { uk: 'Z', us: 12.5, eu: 68.75, mm: 68.77 },
];

/** The smallest ring on offer that goes round a finger, by its US number or UK letter; nothing where the sizes are S, M and L or one size. */
export function ringSize(fingerMm: number, sizes: readonly string[]): string | undefined {
  // S, M and L are a garment's sizes as often as a ring's letters: letters are read as a ring's only where the run has another.
  const lettered = sizes.some((x) => /^[A-Z]$/.test(x.trim().toUpperCase()) && !'SML'.includes(x.trim().toUpperCase()));
  for (const row of RING_SIZES) {
    if (row.mm < fingerMm) continue;
    const hit = sizes.find((x) => (lettered && x.trim().toUpperCase() === row.uk) || Number(x) === row.us);
    if (hit) return hit;
  }
  return undefined;
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
  // A ring by the finger's circumference, on H.Samuel's chart of US, UK and EU sizes (from 2026-10-03): the first that goes round it.
  if (p.slot === 'accessory') return m.fingerMm === undefined ? undefined : ringSize(m.fingerMm, sizes);
  if (!r || !group) return undefined;
  const chart = SIZE_CHARTS.find((c) => c.market === r.market && c.department === m.department && c.group === group && (c.retailer === r.name || c.retailer.startsWith(`${r.name} (`)));
  const mine = group === 'bottoms' ? m.waistCm : m.chestCm;
  if (!chart || mine === undefined) return undefined;
  const offered = new Map(sizes.map((s) => [s.trim().toUpperCase(), s]));
  // A bottom or a dress by the hips too, where the chart gives them and you have: the size that covers both (from 2026-10-03).
  const hips = (group === 'bottoms' || p.slot === 'dress') ? m.hipCm : undefined;
  for (const row of chart.rows) {
    const span = group === 'bottoms' ? row.waist : row.bust ?? row.chest;
    if (!span || span[1] < mine) continue;
    if (hips !== undefined && row.hip && row.hip[1] < hips) continue;
    const label = row.labels.find((l) => offered.has(l));
    if (label) return offered.get(label);
  }
  return undefined;
}

/** Your size in a garment's run, or nothing where it comes in one size: by the retailer's chart where it can be, by body mass index otherwise. */
/**
 * A listing's lengths (from 2026-10-03): its regular sizes, and its petite and
 * tall cuts where it lists them as "PETITE 4" or "TALL 4", as J.Crew does.
 * Petite is Marks & Spencer's own: a woman 160 cm tall or shorter. No
 * retailer's own page gave a height for tall that was read, so a tall cut is
 * chosen by hand.
 */
export const PETITE_CM = 160;
export function cutOf(sizes: readonly string[], cut: 'regular' | 'petite' | 'tall'): string[] {
  const prefix = /^(PETITE|TALL)\s+/i;
  if (cut === 'regular') return sizes.filter((s) => !prefix.test(s));
  return sizes.filter((s) => s.toUpperCase().startsWith(`${cut.toUpperCase()} `));
}
const bare = (s: string) => s.replace(/^(PETITE|TALL)\s+/i, '');

/** Your size in a listing: the petite cut where you're petite and it has one, by its chart or your body mass index. */
export function sizeFor(sim: Simulation, person: Person, sizes: readonly string[], p?: Sized): string | undefined {
  const petite = cutOf(sizes, 'petite');
  if (petite.length > 0 && person.measures?.department !== 'men' && bodyOf(sim, person).heightCm <= PETITE_CM) {
    const mine = sizeFor(sim, person, petite.map(bare), p);
    return mine === undefined ? undefined : petite.find((s) => bare(s) === mine);
  }
  if (petite.length > 0 || cutOf(sizes, 'tall').length > 0) return sizeFor(sim, person, cutOf(sizes, 'regular'), p);
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
  // A petite or tall cut is sized within its own run, as a regular one is.
  const cut = chosen && /^PETITE\s/i.test(chosen) ? 'petite' : chosen && /^TALL\s/i.test(chosen) ? 'tall' : undefined;
  if (cut) return fitKgFor(sim, person, cutOf(sizes, cut).map(bare), bare(chosen!), p);
  if (cutOf(sizes, 'regular').length < sizes.length) return fitKgFor(sim, person, cutOf(sizes, 'regular'), chosen, p);
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
  if (m.fingerMm !== undefined && !(Number.isFinite(m.fingerMm) && m.fingerMm >= 35 && m.fingerMm <= 80)) return 'A finger in millimeters around, from 35 to 80.';
  return undefined;
}

export const tailorsIn = (cityId: string): Tailor[] => TAILORS.filter((t) => t.cityId === cityId);
export const tailorById = (id: string): Tailor | undefined => TAILORS.find((t) => t.id === id);

/** How a garment sits now: as it should, too big, or grown out of. */
export function fitOf(person: Person, g: Garment): 'fits' | 'big' | 'small' {
  // A shoe shorter than the foot doesn't go on (from later on 2026-10-02).
  if (g.slot === 'shoes') return g.footCm !== undefined && person.measures?.footCm !== undefined && person.measures.footCm > g.footCm ? 'small' : 'fits';
  // A pregnancy's gain makes clothes tight, but not a maternity garment, cut for it (from 2026-10-03).
  const kg = person.body ? person.body.weightKg + (g.maternity ? 0 : person.body.bumpKg ?? 0) : undefined;
  if (g.fitKg === undefined || kg === undefined || UNSIZED.has(g.slot)) return 'fits';
  const ratio = kg / g.fitKg - 1;
  return ratio > FIT.band ? 'small' : ratio < -FIT.band ? 'big' : 'fits';
}

/** The weight a garment is made for now. */
export const fitKgOf = (person: Person): number | undefined => person.body?.weightKg;

/** How far a garment lets out and takes in, in size steps, by its slot: Proper Cloth's figures for trousers and jackets; a shirt's or a dress's half a size out, SLATE's reading of the trade's 'an inch or two' at a shirt's chest (from 2026-10-03; until then neither let out at all). */
export const ALTER_STEPS: Readonly<Partial<Record<Slot, { out: number; in: number }>>> = { top: { out: 0.5, in: 1 }, dress: { out: 0.5, in: 1 }, bottom: { out: 0.75, in: 1 }, suit: { out: 0.4, in: 1 }, outer: { out: 0.4, in: 1 } };

/** The weight a garment is altered to for this body: as far as it goes toward it. */
export function alteredKg(person: Person, g: Garment): number | undefined {
  const kg = person.body?.weightKg;
  if (kg === undefined || g.fitKg === undefined) return kg;
  const steps = ALTER_STEPS[g.slot];
  if (!steps) return kg;
  return Math.min(Math.max(kg, g.fitKg * (1 - steps.in * SIZE_STEP)), g.fitKg * (1 + steps.out * SIZE_STEP));
}

export function alterRefusal(person: Person, itemId: string, tailorId: string): string | undefined {
  const item = itemById(person, itemId) as (Item & { garment?: Garment }) | undefined;
  if (!item?.garment) return 'That isn’t a garment of yours.';
  const g = item.garment;
  const fit = fitOf(person, g);
  if (fit === 'fits') return 'It fits.';
  if (fit === 'small') {
    if (!ALTER_STEPS[g.slot]) return 'A tailor can’t let it out.';
    if (g.letOut) return 'It’s been let out as far as its seams go.';
  }
  // Altered as far as it goes, it must fit.
  if (fitOf(person, { ...g, fitKg: alteredKg(person, g) }) !== 'fits') return fit === 'small' ? 'It can’t be let out that far.' : 'It can’t be taken in that far.';
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
    const out = fitOf(person, item.garment) === 'small';
    if (!spend(s, person, paid, `${t.name}, ${out ? 'let out' : 'taken in'}`, 'clothing')) throw new CommandError('The payment didn’t go through.');
    const readyAt = s.now + (t.turnaroundDays ?? FIT.weekDays) * MS_DAY;
    item.at = { kind: 'service', serviceId: `tailor:${t.cityId}:${t.id}`, readyAt };
    item.garment.fitKg = alteredKg(person, item.garment);
    if (out) item.garment.letOut = true;
    return { readyAt, paid };
  });
}
