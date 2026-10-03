/**
 * SLATE — dressed for the cold (from 2026-10-03;
 * `docs/research/world/research-clothing-warmth.json`).
 *
 * How long somebody can be out in the cold in what they have on, by ISO
 * 11079's duration limit at its high-strain criterion: the heat the body may
 * lose, 144 kJ a square meter, over the rate the clothes, the activity and
 * the hour's air let it go. Computed as d'Ambrosio Alfano and others print it
 * (2025, Appendix B), with their outer fabric's air permeability of 8 L/m²s
 * and moisture index of 0.38. The clothes are the outfit worn, in ASHRAE's
 * clo (`content/clo.ts`); the air is the hour's temperature and the day's
 * humidity; the wind on the body is the 10-meter wind over 1.5, the OFCM's
 * face height, and no less than ISO's 0.4 m/s. The sky's radiation isn't
 * kept, so the radiant temperature is the air's, SLATE's reading.
 *
 * It's asked below 10 °C, EU-OSHA's line under which the risk of cold
 * stress rises. Exposed skin is asked too: the minutes to frostbite for the
 * most susceptible at the air and the 10-meter wind, the OFCM's Table 3.2b
 * (2003), read at the next colder and windier cell; a wind under its first
 * row's 10 km/h as that row, and anything warmer than −15 °C unlikely.
 *
 * Until 2026-10-03 sitting out stopped below 10 °C and a run or a court below
 * freezing, SLATE's thresholds, whatever was worn. Now a coat, a sweater
 * over a shirt or thermals underneath is what lets a cold hour be had.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { CLO_SI, cloOf } from '../content/clo';
import { weatherAt } from './weather';
import { outfitFor, wornNow, type Garment } from './wardrobe';
import type { Item } from './items';

/** ISO 8996's metabolic unit: one MET, W/m². */
export const MET_W = 58.2;
/** The outer fabric's air permeability, L/m²s, and the moisture permeability index, as the published code takes them. */
export const FABRIC = { ap: 8, im: 0.38 } as const;
/** Sitting quietly, the 2024 Compendium's 07021: sitting out, or carried in a boat. */
export const SITTING_MET = 1.0;

const satP = (t: number) => 0.1333 * Math.exp(18.6686 - 4030.183 / (t + 235));

/**
 * ISO 11079's duration-limited exposure at the high-strain criterion, hours:
 * how long the clothes keep the body's heat loss under its limit. Infinity
 * where they keep up with it.
 */
export function coldHours(ta: number, tr: number, va: number, rh: number, M: number, iclClo: number): number {
  const W = 0;
  const Icl = iclClo * CLO_SI;
  const walk = Math.min(1.2, Math.max(0, 0.0052 * (M - 58)));
  const tsk = 33.34 - 0.0354 * M;
  const wetness = 0.06;
  const tex = 29 + 0.2 * ta;
  const pex = satP(tex);
  const psks = satP(tsk);
  const pa = ta >= 0 ? (rh / 100) * satP(ta) : (rh / 100) * 0.6105 * Math.exp((21.875 * ta) / (265.5 + ta));
  const Iar = 0.092 * Math.exp(-0.15 * va - 0.22 * walk) - 0.0045;
  let S = -40;
  let factor = 100;
  let Iclr = Icl;
  let balance = 1;
  // As the published code runs it: the balance checked before each step, the step taken after.
  for (let i = 0; Math.abs(balance) > 0.0001 && i < 400; i += 1) {
    const fcl = 1 + 1.97 * Iclr;
    Iclr = (Icl + 0.085 / fcl) * (0.54 * Math.exp(0.075 * Math.log(FABRIC.ap) - 0.15 * va - 0.22 * walk) - 0.06 * Math.log(FABRIC.ap) + 0.5) - Iar / fcl;
    const ReT = (0.06 / FABRIC.im) * (Iar / fcl + Iclr);
    const E = (wetness * (psks - pa)) / ReT;
    const Hres = 0.0173 * M * (pex - pa) + 0.0014 * M * (tex - ta);
    const tcl = tsk - Iclr * (M - W - E - Hres - S);
    const hr = tcl === tr ? 0 : (0.0000000567 * 0.97 * 0.77 * ((273 + tcl) ** 4 - (273 + tr) ** 4)) / (tcl - tr);
    const hc = 1 / Iar - hr;
    const R = fcl * hr * (tcl - tr);
    const C = fcl * hc * (tcl - ta);
    balance = M - W - E - Hres - R - C - S;
    if (balance > 0) { S += factor; factor /= 2; } else S -= factor;
  }
  return S < 0 ? -40 / S : Infinity;
}

/** EU-OSHA: below +10 °C the risk of cold stress rises. */
export const COLD_BELOW_C = 10;

/** The OFCM's Table 3.2b: minutes to frostbite, by the 10-meter wind (km/h) and the air (°C); null where it's unlikely. */
export const FROSTBITE = {
  airC: [-15, -20, -25, -30, -35, -40, -45, -50],
  byWindKmh: {
    10: [null, null, 22, 15, 11, 8, 7, 6], 20: [null, null, 14, 10, 7, 6, 5, 4], 30: [null, 18, 11, 8, 6, 4, 4, 3], 40: [42, 14, 9, 6, 5, 4, 3, 2],
    50: [27, 12, 8, 5, 4, 3, 2, 2], 60: [22, 10, 7, 5, 3, 3, 2, 2], 70: [18, 9, 6, 4, 3, 2, 2, 2], 80: [16, 8, 5, 4, 3, 2, 2, 1],
  } as Readonly<Record<number, readonly (number | null)[]>>,
} as const;

/** Minutes until exposed skin freezes, or Infinity where frostbite is unlikely. */
export function frostbiteMinutes(ta: number, windKmh: number): number {
  if (ta > FROSTBITE.airC[0]!) return Infinity;
  const rows = Object.keys(FROSTBITE.byWindKmh).map(Number).sort((a, b) => a - b);
  const row = rows.find((r) => r >= windKmh) ?? rows[rows.length - 1]!;
  let col = FROSTBITE.airC.findIndex((c) => c <= ta);
  if (col < 0) col = FROSTBITE.airC.length - 1;
  return FROSTBITE.byWindKmh[row]![col] ?? Infinity;
}

/** The outfit's insulation, clo: what they have on, or what they'd put on. */
export function outfitClo(sim: Simulation, person: Person): number {
  const on: (Item & { garment: Garment })[] = wornNow(person).length > 0 ? wornNow(person) : outfitFor(sim, person) ?? [];
  return Math.round(on.reduce((a, g) => a + cloOf(g.garment.kind, g.garment.slot, g.label), 0) * 100) / 100;
}

/** The hour's air where they are, as ISO 11079 takes it. */
export function airNow(sim: Simulation, person: Person): { ta: number; va: number; rh: number; windKph: number } | undefined {
  const w = weatherAt(sim, person.currentLocationId, sim.now);
  if (!w) return undefined;
  return { ta: w.temperatureC, va: Math.max(0.4, w.windKph / 3.6 / 1.5), rh: w.humidity, windKph: w.windKph };
}

/**
 * Why the cold stops it, or nothing: dressed as they are, the hour's air
 * allows fewer minutes out at this effort than it takes.
 */
export function coldRefusal(sim: Simulation, person: Person, met: number, minutes: number, doing: string): string | undefined {
  const air = airNow(sim, person);
  return air ? coldVerdict(air, outfitClo(sim, person), met, minutes, doing) : undefined;
}

/** The same, for an hour's air and an outfit's clo. */
export function coldVerdict(air: { ta: number; va: number; rh: number; windKph: number }, clo: number, met: number, minutes: number, doing: string): string | undefined {
  if (air.ta >= COLD_BELOW_C) return undefined;
  const skin = frostbiteMinutes(air.ta, air.windKph);
  if (skin < minutes) return `Exposed skin freezes in ${skin} minutes at ${Math.round(air.ta)} °C in this wind.`;
  const hours = coldHours(air.ta, air.ta, air.va, air.rh, met * MET_W, clo);
  if (hours * 60 >= minutes) return undefined;
  return `Dressed in ${clo} clo, ${Math.round(air.ta)} °C allows ${Math.floor(hours * 60)} minutes to ${doing}: put on more.`;
}
