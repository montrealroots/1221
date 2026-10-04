/**
 * SLATE — a raised bed and a greenhouse grown in (the master plan's §43j–l,
 * from 2026-10-04; what grows and when in `content/garden.ts`).
 *
 * A bed or a greenhouse at the home they live in is planted with one crop at
 * a time (`garden.plant`): outdoors only in the town's frost-free months, and
 * only where it would ripen before the first frost; a greenhouse at any time.
 * It ripens after its days, and is picked (`garden.harvest`) into the kitchen
 * as the food it is, its yield for the plot's square meters, keeping as the
 * same food bought does. Left outdoors past the first frost, the frost takes
 * it.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { CROPS, FROST_FREE, GARDEN_MINUTES, PLOT_M2, type Crop } from '../content/garden';
import { livingIn } from './homes';
import { atHome } from './dwelling';
import { addItem, homeKeyOf } from './items';

export type Plot = 'bed' | 'greenhouse';
export interface Planting { crop: Crop; plantedAt: Instant }
export const RIPE_KIND = 'garden.ripe';

const FEATURE: Readonly<Record<Plot, 'gardenBed' | 'greenhouse'>> = { bed: 'gardenBed', greenhouse: 'greenhouse' };
export const plotsOf = (person: Person): Plot[] => (['bed', 'greenhouse'] as const).filter((p) => livingIn(person)?.facts.features.includes(FEATURE[p]));
export const plantingIn = (person: Person, plot: Plot): Planting | undefined => livingIn(person)?.garden?.[plot];

/** The outdoor season's end after a moment, in the town's local time; none where it's the year round. */
export function seasonEnd(cityId: string, at: Instant): Instant | undefined {
  const s = FROST_FREE[cityId];
  if (!s || s === 'year') return undefined;
  const zone = CITIES.require(cityId).timeZone;
  const year = zonedParts(at, zone).year;
  const [m, d] = s.to.split('-').map(Number);
  return instantFromZoned({ year, month: m!, day: d!, hour: 0 }, zone);
}

/** Whether a moment is in the town's frost-free months. */
export function frostFree(cityId: string, at: Instant): boolean {
  const s = FROST_FREE[cityId];
  if (!s) return false;
  if (s === 'year') return true;
  const p = zonedParts(at, CITIES.require(cityId).timeZone);
  const md = `${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
  return md >= s.from && md < s.to;
}

export const ripeAt = (p: Planting): Instant => p.plantedAt + CROPS[p.crop].days * MS_DAY;

/** Why a crop can't be planted in a plot now, or nothing. */
export function plantRefusal(sim: Simulation, person: Person, plot: Plot, crop: Crop): string | undefined {
  if (!atHome(person)) return 'You plant at home.';
  if (!plotsOf(person).includes(plot)) return plot === 'bed' ? 'You have no garden bed.' : 'You have no greenhouse.';
  if (plantingIn(person, plot)) return `Something’s growing in it already.`;
  if (!CROPS[crop]) return 'That isn’t grown here.';
  if (plot === 'bed') {
    const cityId = person.currentLocationId;
    if (!FROST_FREE[cityId]) return 'No frost dates are kept for this town.';
    if (!frostFree(cityId, sim.now)) return 'It’s out of the frost-free months.';
    const end = seasonEnd(cityId, sim.now);
    if (end !== undefined && sim.now + CROPS[crop].days * MS_DAY > end) return `It wouldn’t ripen before the first frost, about ${formatDate(end, sim.zone)}.`;
  }
  return undefined;
}

/** Why a plot can't be picked now, or nothing. */
export function harvestRefusal(sim: Simulation, person: Person, plot: Plot): string | undefined {
  if (!atHome(person)) return 'You pick it at home.';
  const p = plantingIn(person, plot);
  if (!p) return 'It’s empty: plant something first.';
  if (sim.now < ripeAt(p)) return `It’s ripe about ${formatDate(ripeAt(p), sim.zone)}.`;
  return undefined;
}

/** What a plot's crop gives when picked: its yield for the plot, in the food's own unit. */
export function yieldOf(plot: Plot, crop: Crop): number {
  const c = CROPS[crop];
  const grams = c.kgPerM2 * PLOT_M2[plot] * 1_000;
  return c.unit === 'ct' ? Math.max(1, Math.round(grams / (c.gEach ?? 1))) : Math.round(grams);
}

export function registerGarden(sim: Simulation): void {
  sim.onCommand<{ plot: Plot; crop: Crop }, { ripeAt: Instant }>('garden.plant', (p, { sim: s }) => {
    const person = s.player;
    const plot: Plot = p?.plot === 'greenhouse' ? 'greenhouse' : 'bed';
    const no = plantRefusal(s, person, plot, p?.crop as Crop);
    if (no) throw new CommandError(no);
    s.advanceTo(s.now + GARDEN_MINUTES.plant * 60_000);
    const home = livingIn(person)!;
    const planting: Planting = { crop: p.crop, plantedAt: s.now };
    home.garden = { ...(home.garden ?? {}), [plot]: planting };
    s.schedule({ at: ripeAt(planting), kind: RIPE_KIND, label: `${CROPS[p.crop].label} Ripe`, category: 'home', priority: 30, payload: { personId: person.id, homeId: home.id, plot, plantedAt: planting.plantedAt } });
    return { ripeAt: ripeAt(planting) };
  });

  sim.onCommand<{ plot: Plot }, { food: string; amount: number }>('garden.harvest', (p, { sim: s }) => {
    const person = s.player;
    const plot: Plot = p?.plot === 'greenhouse' ? 'greenhouse' : 'bed';
    const no = harvestRefusal(s, person, plot);
    if (no) throw new CommandError(no);
    const home = livingIn(person)!;
    const planting = home.garden![plot]!;
    const c = CROPS[planting.crop];
    s.advanceTo(s.now + GARDEN_MINUTES.pick * 60_000);
    const amount = yieldOf(plot, planting.crop);
    addItem(s, person, {
      kind: `garden:${planting.crop}`, label: `${c.label} From The Garden`, quantity: 1, condition: 1,
      at: { kind: 'home', home: homeKeyOf(person.home)!, spot: c.storage }, acquiredAt: s.now,
      food: { key: c.food, unit: c.unit, left: amount, expiresAt: s.now + c.keepsDays * MS_DAY },
    });
    const { [plot]: _picked, ...rest } = home.garden!;
    home.garden = rest;
    return { food: c.food, amount };
  });

  // Ripe: said, and outdoors, taken by the frost if it's still there when it comes.
  sim.onSchedule(RIPE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const home = person?.homes?.find((h) => h.id === item.payload.homeId);
    const plot = item.payload.plot as Plot;
    const planting = home?.garden?.[plot];
    if (!person || !home || !planting || planting.plantedAt !== item.payload.plantedAt) return;
    if (person.id === s.universe.playerId) s.notify({ category: 'home', title: `${CROPS[planting.crop].label} Ripe`, body: `The ${plot === 'bed' ? 'garden bed' : 'greenhouse'} is ready to pick.`, importance: 30, route: '/workspace/homes' });
    const end = plot === 'bed' ? seasonEnd(home.cityId, item.at) : undefined;
    if (end !== undefined && end > item.at) s.schedule({ at: end, kind: 'garden.frost', label: 'The First Frost', category: 'system', priority: 20, payload: { personId: person.id, homeId: home.id, plantedAt: planting.plantedAt } });
  });
  sim.onSchedule('garden.frost', (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const home = person?.homes?.find((h) => h.id === item.payload.homeId);
    const planting = home?.garden?.bed;
    if (!person || !home || !planting || planting.plantedAt !== item.payload.plantedAt) return;
    const { bed: _lost, ...rest } = home.garden!;
    home.garden = rest;
    if (person.id === s.universe.playerId) s.notify({ category: 'home', title: 'The Frost Took It', body: `The ${CROPS[planting.crop].label.toLowerCase()} in the garden bed weren’t picked before the first frost.`, importance: 30, route: '/workspace/homes' });
  });
}
