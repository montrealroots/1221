/**
 * SLATE — a home's lawn: it grows, it's mown or a gardener mows it, and where
 * a town sets a height, it's enforced (Stage 11 of `docs/BACKLOG.md`, from
 * 2026-10-02), from `docs/research/world/research-gaps-services.json` and
 * `research-hired-services.json`.
 *
 * **Growing.** A lawn measured in late spring grew 1.25 to 1.46 mm a day,
 * about 1 cm a week (Grass and Forage Science, a ryegrass and bluegrass
 * mix); SLATE grows it 1 cm a week through the town's growing season and not
 * outside it: the frost-free season by NOAA's and Environment Canada's
 * 1991-2020 normals in New York (3 April to 14 November), New Haven (22 April
 * to 20 October), Toronto (20 April to 1 November) and Vancouver (15 March to
 * 30 November); London's mowing season, late March to late October; Los
 * Angeles's bermudagrass, April to September (UC IPM); Mexico City's rainy
 * season, 15 May to 15 November, by inference; in Dublin grass grows every
 * month (Teagasc). Growth is two to five times faster in spring than autumn,
 * which a single rate doesn't keep. It's mown to 5 cm, Penn State's two
 * inches.
 *
 * **Mowing it.** Mow The Lawn takes 1.9 hours, what Americans who did lawn
 * and garden care on a day spent on it (ATUS, 2025). Or a gardener, by the
 * visit, cheapest named first: New Haven's LawnGuru, $52.75 a cut on average,
 * 20% off weekly; Toronto's Trim Gym Lawn Care, C$45 a weekly cut on a small
 * lot plus HST, May to October; Vancouver's Harry's Lawn Care, C$65 a visit
 * every two weeks; London's Urban Gardeners, £80 for the first hour; Dublin's
 * Grasshopper Services, about €30 an hour; and where no firm publishes a
 * price, the market's middle: Los Angeles's mow-edge-blow, $35 to $80; a
 * Brooklyn yard visit, about $100; Mexico City's basic visit for a small
 * garden, MX$350 to MX$700.
 *
 * **A mower** (from 2026-10-05, `systems/mowers.ts`): mowing by hand needs one
 * to push, and a robot rated for the lawn keeps it cut through the season.
 *
 * **The rules.** Toronto's turfgrass by-law caps it at 20 cm (Chapter 489),
 * and New Haven's anti-blight ordinance at a foot. Over it, a notice; ten
 * days later, still over, the city does the work at the owner's expense
 * (New Haven's ten days of written notice, taken for Toronto too, whose
 * period isn't published), at the town's one-off cut: Trim Gym's C$90, and
 * LawnGuru's average in New Haven. The fines are maxima on conviction, not
 * tickets, and none is drawn. New York, Los Angeles's flat basin, London,
 * Dublin, Vancouver and Mexico City set no height for a lived-in lawn. A
 * home let to a tenant is the tenant's to mow, and isn't kept.
 *
 * **Water** (from 2026-10-06, `research-lawn-watering.json`). A lawn wants "approximately 1 inch of water each week,
 * either from rainfall, irrigation, or a combination of both" (Wisconsin Extension), the Sports Turf Managers
 * Association's acre-inch a week for a grass field. A day of rain is taken for the week's inch, SLATE's reading, its
 * weather keeping whether it rained and not how much. Seven days in the season without rain or a watering and it stops
 * growing ("Kentucky bluegrass can start turning brown after about 7 days without water", Minnesota Extension); watered
 * again, it grows only after ten days ("once sufficient water is supplied for an extended period of time (10 days and
 * longer)", Wisconsin). Water The Lawn pours the inch over it, 25.4 liters a square meter of the lot less the house
 * (`lawnM2`), onto the month's water bill; sprinklers (`irrigation`) pour it themselves on the day a week has gone dry,
 * at the home lived in, whose water is billed. Until then the grass grew a centimeter a week in its season whatever
 * fell on it, and sprinklers were bought and read by nothing.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { spend } from './household';
import { livingIn, type OwnedHome } from './homes';
import { lawnM2, robotFor } from './mowers';
import { weatherOn } from './weather';
import { livingOf } from './dwelling';

export const GROWS_CM_A_WEEK = 1;
export const MOWN_CM = 5;
export const MOW_MINUTES = Math.round(1.9 * 60);

interface Gardener { name: string; perCut: number; currency: string; everyDays: number; tax?: number; season?: [number, number] }
interface LawnPlace { season?: [number, number, number, number]; gardener: Gardener; limitCm?: number; oneOff?: number }

export const LAWNS: Readonly<Record<string, LawnPlace>> = {
  'us-ny-newyork': { season: [4, 3, 11, 14], gardener: { name: 'A Brooklyn Yard Visit, At The Market Rate', perCut: 100, currency: 'USD', everyDays: 7 } },
  'us-ct-newhaven': { season: [4, 22, 10, 20], gardener: { name: 'LawnGuru', perCut: 52.75 * 0.8, currency: 'USD', everyDays: 7 }, limitCm: 30.48, oneOff: 52.75 },
  'us-ca-losangeles': { season: [4, 1, 9, 30], gardener: { name: 'A Mow-Edge-Blow Crew, At The Market Rate', perCut: (35 + 80) / 2, currency: 'USD', everyDays: 7 } },
  'uk-eng-london': { season: [3, 25, 10, 25], gardener: { name: 'Urban Gardeners', perCut: 80, currency: 'GBP', everyDays: 14 } },
  'ie-lei-dublin': { gardener: { name: 'Grasshopper Services', perCut: 30, currency: 'EUR', everyDays: 14 } },
  'ca-on-toronto': { season: [4, 20, 11, 1], gardener: { name: 'Trim Gym Lawn Care', perCut: 45, currency: 'CAD', everyDays: 7, tax: 0.13, season: [5, 10] }, limitCm: 20, oneOff: 90 * 1.13 },
  'ca-bc-vancouver': { season: [3, 15, 11, 30], gardener: { name: 'Harry’s Lawn Care', perCut: 65, currency: 'CAD', everyDays: 14 } },
  'mx-cmx-mexicocity': { season: [5, 15, 11, 15], gardener: { name: 'A Gardener, At The Market Rate', perCut: (350 + 700) / 2, currency: 'MXN', everyDays: 14 } },
};
export const NOTICE_DAYS = 10;

/** The week's inch, a lawn's days without water before it stops growing, and the days watered before it grows again. */
export const INCH_L_PER_M2 = 25.4;
export const DRY_DAYS = 7;
export const WAKE_DAYS = 10;

/** A lawn's height; from 2026-10-06 when it last had water, rain or poured, and when a lawn gone dry grows again. */
export interface Lawn { cm: number; gardener?: boolean; lastCut?: Instant; noticeAt?: Instant; wetAt?: Instant; wakesAt?: Instant }

/** A week without rain or a watering: it isn't growing. */
export const parched = (lawn: Lawn, at: Instant): boolean => lawn.wetAt !== undefined && at - lawn.wetAt >= DRY_DAYS * MS_DAY;

/** Water on it, rain or poured: a lawn gone dry starts its ten days. */
export function wetLawn(lawn: Lawn, at: Instant): void {
  if (parched(lawn, at)) lawn.wakesAt = at + WAKE_DAYS * MS_DAY;
  lawn.wetAt = at;
}

/** Whether it grows today, water-wise: not parched, and past any ten days of coming back. */
export const greening = (lawn: Lawn, at: Instant): boolean => !parched(lawn, at) && (lawn.wakesAt === undefined || at >= lawn.wakesAt);

/** The inch over a home's lawn, liters; nothing where its lot isn't known. */
export const inchOf = (owned: OwnedHome): number | undefined => { const m2 = lawnM2(owned); return m2 === undefined ? undefined : m2 * INCH_L_PER_M2; };

/** Why the lawn can't be watered now, or nothing. */
export function waterRefusal(person: Person): string | undefined {
  const owned = livingIn(person);
  const lawn = owned ? lawnOf(owned) : undefined;
  if (!owned || !lawn) return 'There’s no lawn of yours here.';
  if (person.currentLocationId !== owned.cityId) return 'You’re away from home.';
  if (!inchOf(owned)) return 'SLATE doesn’t know how big the lawn is.';
  return undefined;
}

/** The inch poured on the lawn of the home they live in, onto the month's water: by hand, or by sprinklers on the day the week runs out, before it's dry. */
function pour(person: Person, owned: OwnedHome, lawn: Lawn, at: Instant, sprinklers = false): void {
  const l = livingOf(person);
  l.lawnL = (l.lawnL ?? 0) + (inchOf(owned) ?? 0);
  // On the week's last day it hasn't gone dry yet; a lawn dry longer, sprinklers just put in, still takes its ten days.
  if (sprinklers && lawn.wetAt !== undefined && at - lawn.wetAt < (DRY_DAYS + 1) * MS_DAY) lawn.wetAt = at; else wetLawn(lawn, at);
}

const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };
const md = (m: number, d: number) => m * 100 + d;

/** Whether the grass grows in a town on a day. */
export function growing(cityId: string, at: Instant): boolean {
  const s = LAWNS[cityId]?.season;
  if (!s) return LAWNS[cityId] !== undefined;
  const p = zonedParts(at, CITIES.require(cityId).timeZone);
  return md(p.month, p.day) >= md(s[0], s[1]) && md(p.month, p.day) <= md(s[2], s[3]);
}

/** A home's lawn, where it has a yard in a town SLATE keeps lawns for and isn't let out. */
export function lawnOf(owned: OwnedHome): Lawn | undefined {
  if (!owned.facts.features.includes('yard') || !LAWNS[owned.cityId] || owned.tenancies.some((t) => t.unit === 'main' && t.status === 'let')) return undefined;
  return (owned.lawn ??= { cm: MOWN_CM });
}

export const gardenerPrice = (sim: Simulation, cityId: string): Money => { const g = LAWNS[cityId]!.gardener; return inSave(sim, g.perCut * (1 + (g.tax ?? 0)), g.currency); };

/** A day of the lawn: it grows, the gardener comes when due, and a town with a height enforces it. */
export function lawnDay(sim: Simulation, person: Person, owned: OwnedHome, at: Instant): void {
  const lawn = lawnOf(owned);
  if (!lawn) return;
  const place = LAWNS[owned.cityId]!;
  const mine = person.id === sim.universe.playerId;
  // Water (from 2026-10-06): out of the season it's taken as watered, drought being a growing lawn's; a first day, as watered.
  const season = growing(owned.cityId, at);
  if (!season || lawn.wetAt === undefined) lawn.wetAt = at;
  else if (weatherOn(sim, CITIES.require(owned.cityId), at).precipitation !== 'none') wetLawn(lawn, at);
  else if (owned.facts.features.includes('irrigation') && parched(lawn, at) && livingIn(person) === owned && inchOf(owned)) pour(person, owned, lawn, at, true);
  if (season && greening(lawn, at)) lawn.cm += GROWS_CM_A_WEEK / 7;
  // A robot rated for the lawn keeps it at its height through the season (`systems/mowers.ts`, from 2026-10-05).
  if (growing(owned.cityId, at) && robotFor(person, owned)) { lawn.cm = MOWN_CM; lawn.lastCut = at; }
  const g = place.gardener;
  const month = zonedParts(at, CITIES.require(owned.cityId).timeZone).month;
  const working = !g.season || (month >= g.season[0] && month <= g.season[1]);
  if (lawn.gardener && working && growing(owned.cityId, at) && (lawn.lastCut === undefined || at - lawn.lastCut >= g.everyDays * MS_DAY)) {
    if (spend(sim, person, gardenerPrice(sim, owned.cityId), `${g.name}, the lawn`, 'home')) { lawn.cm = MOWN_CM; lawn.lastCut = at; delete lawn.noticeAt; }
  }
  if (place.limitCm === undefined || lawn.cm <= place.limitCm) { delete lawn.noticeAt; return; }
  if (lawn.noticeAt === undefined) {
    lawn.noticeAt = at;
    if (mine) sim.notify({ category: 'home', title: 'A Notice About The Lawn', body: `${owned.facts.address}: the grass is over the city’s ${Math.round(place.limitCm)} cm. Cut it within ${NOTICE_DAYS} days, or the city will, at your expense.`, importance: 60, route: '/workspace/homes' });
    return;
  }
  if (at - lawn.noticeAt < NOTICE_DAYS * MS_DAY) return;
  const bill = inSave(sim, place.oneOff!, g.currency);
  spend(sim, person, bill, 'The city, cutting the lawn', 'home');
  lawn.cm = MOWN_CM;
  lawn.lastCut = at;
  delete lawn.noticeAt;
  if (mine) sim.notify({ category: 'home', title: 'The City Cut The Lawn', body: `${owned.facts.address}: ${formatMoney(bill, saveCurrency(sim.universe), { cents: false })}.`, importance: 60, route: '/workspace/homes' });
}

/** Mown by hand, at home. */
export function mow(owned: OwnedHome, at: Instant): void {
  const lawn = lawnOf(owned);
  if (!lawn) return;
  lawn.cm = MOWN_CM;
  lawn.lastCut = at;
  delete lawn.noticeAt;
}

export function registerLawns(sim: Simulation, homeOf: (person: Person, id: string) => OwnedHome | undefined): void {
  sim.onEvent('world.day_rollover', 'lawns.day', (_e, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) for (const owned of person.homes ?? []) lawnDay(s, person, owned, s.now);
  });
  sim.onCommand<{ homeId: string; on: boolean }, { on: boolean }>('home.gardener', (p, { sim: s }) => {
    const owned = homeOf(s.player, String(p?.homeId));
    if (!owned) throw new CommandError('You don’t own that home.');
    const lawn = lawnOf(owned);
    if (!lawn) throw new CommandError('It has no lawn of yours to keep.');
    lawn.gardener = p?.on === true;
    return { on: lawn.gardener };
  });
  // The week's inch poured over the lawn of the home lived in (from 2026-10-06), billed with the month's water.
  sim.onCommand<Record<string, never>, { liters: number }>('home.water_lawn', (_p, { sim: s }) => {
    const person = s.player;
    const no = waterRefusal(person);
    if (no) throw new CommandError(no);
    const owned = livingIn(person)!;
    pour(person, owned, lawnOf(owned)!, s.now);
    return { liters: Math.round(inchOf(owned)!) };
  });
}
