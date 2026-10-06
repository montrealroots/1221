/**
 * SLATE — a car by its model year (from 2026-10-05; `content/modelyears.ts`, the EPA's ratings): a used car is
 * the model year it is, built as that year was, not today's car made older, and a new one the model year on sale.
 *
 * - **A used car** of so many years old, listed this month, is of the model year the calendar year less its age.
 *   It's one of the configurations the EPA rated for that year (engine, transmission, drive, fuel and its
 *   consumption), drawn for the listing; a model with none rated that year has no car of that age on offer.
 *   Until 2026-10-05 any age was today's model, its economy today's.
 * - **A new car** is the latest model year on sale on the day: a model year is sold from 1 July of the year before
 *   it, SLATE's policy (makers release model years from the summer before, and no single date is published), and
 *   never before, so a model year not yet released isn't sold as stock.
 * - **Past the last year the EPA has rated**, a model's model years carry its last rated configuration forward,
 *   and say so (`basis: 'simulated'`): SLATE doesn't invent a maker's future cars.
 * - Only America's models are rated here; elsewhere a car is still its model's, its year the calendar's less its age,
 *   with no configuration of its own until a market's own ratings (Canada's NRCan, Britain's VCA) are read.
 *
 * What reads it: the fuel or charge a distance burns (`burnOf` in `systems/fueltank.ts`), the listing's and the
 * car's descriptions on Vehicles, and the search and comparison there.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { MODEL_YEARS, type ModelYearRow } from '../content/modelyears';

export interface Build {
  year: number;
  liters: number | null;
  cylinders: number | null;
  transmission: string | null;
  drive: string | null;
  fuel: string;
  per100km: number | null;
  kwhPer100km: number | null;
  rangeKm: number | null;
  turbo: boolean;
  sizeClass: string;
  /** Rated by the EPA, or carried forward past its last rated year. */
  basis: 'epa' | 'simulated';
}

const toBuild = (r: ModelYearRow, basis: Build['basis'] = 'epa', year = r[0]): Build => ({
  year, liters: r[1], cylinders: r[2], transmission: r[3], drive: r[4], fuel: r[5], per100km: r[6], kwhPer100km: r[7], rangeKm: r[8], turbo: r[9] === 1, sizeClass: r[10], basis,
});

/** Whether a model's model years are kept. */
export const hasModelYears = (modelId: string): boolean => (MODEL_YEARS[modelId]?.length ?? 0) > 0;
/** The model years rated for a model, earliest first. */
export const yearsOf = (modelId: string): number[] => [...new Set((MODEL_YEARS[modelId] ?? []).map((r) => r[0]))].sort((a, b) => a - b);
/** A model year's rated configurations; past the last rated year, the last year's, carried forward. */
export function buildsFor(modelId: string, year: number): Build[] {
  const rows = MODEL_YEARS[modelId] ?? [];
  const rated = rows.filter((r) => r[0] === year);
  if (rated.length) return rated.map((r) => toBuild(r));
  const last = Math.max(...rows.map((r) => r[0]));
  return rows.length && year > last ? rows.filter((r) => r[0] === last).map((r) => toBuild(r, 'simulated', year)) : [];
}

/** The calendar year on a day where a town is. */
export const yearAt = (cityId: string, at: Instant): number => zonedParts(at, CITIES.get(cityId)?.timeZone ?? 'UTC').year;

/** Whether a model year is sold new on a day: from 1 July of the year before it (SLATE's policy). */
export function onSaleNew(modelYear: number, cityId: string, at: Instant): boolean {
  const p = zonedParts(at, CITIES.get(cityId)?.timeZone ?? 'UTC');
  return p.year > modelYear - 1 || (p.year === modelYear - 1 && p.month >= 7);
}

/** The model year sold new on a day: the latest released, rated or carried forward; none where its first isn't out yet. */
export function newModelYear(modelId: string, cityId: string, at: Instant): number | undefined {
  const years = yearsOf(modelId);
  if (!years.length) return undefined;
  const now = yearAt(cityId, at);
  const latestReleased = onSaleNew(now + 1, cityId, at) ? now + 1 : now;
  const rated = years.filter((y) => y <= latestReleased);
  if (!rated.length) return undefined;
  const last = rated[rated.length - 1]!;
  // Past the ratings, the model year on sale is the calendar's, carried forward.
  return last < years[years.length - 1]! ? last : Math.max(last, latestReleased);
}

/** The configuration a car of a model year has: one of the year's, drawn for it (`vehicle.modelyear`). */
export function drawBuild(sim: Simulation, person: Person, modelId: string, year: number, key: string): Build | undefined {
  const builds = buildsFor(modelId, year);
  if (!builds.length) return undefined;
  const pick = sim.rng('vehicle.modelyear', person.id, `${modelId}-${year}-${key}`).next();
  return builds[Math.floor(pick * builds.length)];
}

/** A configuration in words: "2019, 2.5 L 4-cylinder, Automatic (S8), Front-Wheel Drive, 7.8 L/100 km". */
export function buildLabel(b: Build): string {
  const engine = b.fuel === 'ev' ? 'Electric' : [b.liters ? `${b.liters} L` : null, b.cylinders ? `${b.cylinders}-Cylinder` : null, b.turbo ? 'Turbo' : null].filter(Boolean).join(' ');
  const use = b.fuel === 'ev' ? (b.kwhPer100km ? `${b.kwhPer100km} kWh/100 km` : null) : b.per100km ? `${b.per100km} L/100 km` : null;
  return [String(b.year), engine || null, b.transmission, b.drive, use, b.basis === 'simulated' ? 'Simulated Model Year' : null].filter(Boolean).join(', ');
}
