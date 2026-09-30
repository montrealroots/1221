/**
 * SLATE — locks, lights and timers against a burglary (docs/WORLD.md, stage
 * 6f), from 2026-09-30, researched in `docs/research/world/research-home-effects.json`
 * and `research-ev-tint-security.json`.
 *
 * Tseloni and her colleagues measured, in the Crime Survey for England and
 * Wales, how much less likely a burglary with entry is in a home with each
 * combination of devices than in one with none (Security Journal 30(2), 2017,
 * Table 3): door deadlocks alone 2.8 times; window locks with them 12.54;
 * with outside lights too, 34.41; and with indoor lights on a timer as well,
 * the WIDE combination, 49.12. SLATE takes a home as found to have locks on
 * its doors, and the place's published burglary rate as that home's. So
 * window locks cut the risk to 2.8/12.54 of it, and so on up. A combination
 * the study didn't measure, such as outside lights without window locks,
 * counts as the best one it did that the home holds.
 *
 * Each device is priced at a named retailer's shelf in the country: The Home
 * Depot's in America, Canadian Tire's in Canada (both read from search
 * summaries), Screwfix's in Britain, Woodie's in Ireland and The Home Depot
 * México's. America's and Canada's prices are before sales tax, which is
 * added where they're bought, and the rest include VAT. A lock goes on each
 * window: a bedroom's and three in the rooms lived in, SLATE's estimate, and
 * four in a rented flat of one's own. Two timers, and one light. They're
 * screwed or plugged in, and no fitter is paid. The motion light goes on a
 * house, not a flat. Fitted to a home they own, they stay with it; in a rented
 * one, they're left behind on moving out. A shared home's windows and doors
 * are the landlord's to fit.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { payFromBank } from './household';
import { livingIn } from './homes';

export type Device = 'windows' | 'lights' | 'timers';

export const SECURITY: Readonly<Record<string, { window: number; timer: number; light: number; currency: string; taxIncluded: boolean; basis: string }>> = {
  us: { window: 2.93, timer: 5.96, light: 49.97, currency: 'USD', taxIncluded: false, basis: 'The Home Depot: an Everbilt sash lock, a Defiant plug-in timer and a Defiant motion flood light' },
  ca: { window: 5.99, timer: 5.25, light: 39.99, currency: 'CAD', taxIncluded: false, basis: 'Canadian Tire: a Hillman sash lock, NOMA timers at $10.49 a pair and a NOMA motion light' },
  uk: { window: 6.99, timer: 7.99, light: 8.48, currency: 'GBP', taxIncluded: true, basis: 'Screwfix: a Smith & Locke window lock, a Masterplug timer and a LAP floodlight with a sensor' },
  ie: { window: 19.99, timer: 5.16, light: 35, currency: 'EUR', taxIncluded: true, basis: 'Woodie’s: a Yale window lock, Masterplug timers at €15.49 for three and a Posta floodlight with a sensor' },
  mx: { window: 165, timer: 145, light: 445, currency: 'MXN', taxIncluded: true, basis: 'The Home Depot México: a Veker window lock, a Defiant timer and an Illux light with a sensor' },
};

/** Tseloni et al.'s security protection factors, by the devices beside a home's door locks. */
export const PROTECTION = { doors: 2.8, windows: 12.54, lights: 34.41, timers: 49.12, source: 'Tseloni, Thompson, Grove, Tilley and Farrell, “The effectiveness of burglary security devices”, Security Journal 30(2):646–664 (2017), Table 3' } as const;
export const TIMERS = 2;

const countryOf = (person: Person) => CITIES.get(person.home?.cityId ?? person.currentLocationId)?.countryId ?? '';

/** What's fitted where they live. */
export function devicesOf(person: Person): readonly Device[] {
  const owned = livingIn(person);
  return (owned ? owned.security : person.home?.security) ?? [];
}

/** How much of the place's burglary risk is left: the door locks' factor over the best measured set held. */
export function securityFactor(person: Person): number {
  const has = new Set(devicesOf(person));
  const spf = !has.has('windows') ? PROTECTION.doors : !has.has('lights') ? PROTECTION.windows : !has.has('timers') ? PROTECTION.lights : PROTECTION.timers;
  return PROTECTION.doors / spf;
}

/** How many of a device a home takes. */
export function countFor(person: Person, device: Device): number {
  if (device === 'timers') return TIMERS;
  if (device === 'lights') return 1;
  const owned = livingIn(person);
  return owned ? owned.facts.beds + 3 : 4;
}

/** What the devices cost where they live, in the save's money, sales tax on top where the shelf leaves it off. */
export function deviceCost(sim: Simulation, person: Person, device: Device): Money | undefined {
  const s = SECURITY[countryOf(person)];
  if (!s) return undefined;
  const each = device === 'windows' ? s.window : device === 'lights' ? s.light : s.timer;
  const shelf = Math.round(each * countFor(person, device) * 100);
  const taxed = s.taxIncluded ? shelf : Math.round(shelf * (1 + salesTaxRate(person.home?.cityId ?? person.currentLocationId, sim.now, 'goods')));
  const cur = saveCurrency(sim.universe);
  return cur === s.currency ? taxed : exchange(taxed, s.currency, cur) ?? taxed;
}

export function securityRefusal(person: Person, device: Device): string | undefined {
  const home = person.home;
  if (!home || home.kind === 'sofa') return 'Locks and lights go in a home of your own or one you rent.';
  if (home.kind === 'shared') return 'A shared home’s windows and doors are the landlord’s to fit.';
  if (!SECURITY[countryOf(person)]) return 'SLATE prices them in America, Canada, Britain, Ireland and Mexico.';
  if (devicesOf(person).includes(device)) return 'Your home has them.';
  if (device === 'lights' && !livingIn(person)?.facts.lot) return 'An outside light goes on a house, not a flat.';
  return undefined;
}

export function registerHomeSecurity(sim: Simulation): void {
  sim.onCommand<{ device: Device }, { paid: Money }>('home.security', (p, { sim: s }) => {
    const person = s.player;
    const device = p?.device;
    if (device !== 'windows' && device !== 'lights' && device !== 'timers') throw new CommandError('No such device.');
    const no = securityRefusal(person, device);
    if (no) throw new CommandError(no);
    const cost = deviceCost(s, person, device)!;
    const memo = device === 'windows' ? 'Window locks' : device === 'lights' ? 'An outside motion light' : 'Lamp timers';
    if (!payFromBank(s, person, cost, memo, 'household')) throw new CommandError(`${formatMoney(cost, saveCurrency(s.universe))} is more than the bank can cover.`);
    const owned = livingIn(person);
    if (owned) owned.security = [...(owned.security ?? []), device];
    else person.home!.security = [...(person.home!.security ?? []), device];
    return { paid: cost };
  });
}
