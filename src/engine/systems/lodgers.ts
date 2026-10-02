/**
 * SLATE — a lodger in a spare bedroom (docs/WORLD.md, stage 6d), from
 * 2026-09-30, researched in docs/research/world/research-lodgers.json.
 *
 * Bedrooms held nobody: SLATE keeps no household. A home one owns and lives
 * in can let a spare bedroom to a lodger, as owners do, at the average a room
 * rents for in its town (`ROOM_RENT`), paid monthly. At most two, the
 * number of boarders New York City's Housing Maintenance Code allows an
 * owner, taken everywhere; and no more than the spare bedrooms. Taxed as each
 * country taxes it:
 * - America: rental income, on the return (`rentalRent`); a room's share of
 *   the home's costs wasn't kept until 2026-10-01, and is now set against it
 *   (`lodgerShare` in `homes.ts`).
 * - Britain: the Rent a Room Scheme's £7,500 a year free of tax, the rest
 *   taxed as income, the scheme's alternative way.
 * - Ireland: Rent-a-Room Relief's €14,000 a year free, and all of it taxed
 *   once the year passes it, as the relief is lost whole.
 * - Canada: rental income, taxed.
 * What isn't in it is taxed as it's paid, as SLATE taxes other income there.
 * A lodger ends when the owner says, or leaves when they no longer live
 * there. Britain's room rents include the bills, and a lodger's use of them
 * isn't added to the home's; how long a room sits empty isn't published, so
 * a lodger is found when one is asked for.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, zonedParts, type Instant } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { computeAnnualTax } from '../content/tax';
import { homeById, livingIn, type OwnedHome } from './homes';
import { recordHome, yearOf } from './earnings';

export const LODGER_MONTH_KIND = 'home.lodger_month';

/** A room's rent a month in a town, and whether its bills come with it. */
export const ROOM_RENT: Readonly<Record<string, { amount: number; currency: string; basis: string }>> = {
  'uk-eng-london': { amount: 915, currency: 'GBP', basis: 'SpareRoom’s Greater London average, Q2 2026, bills included' },
  'ie-lei-dublin': { amount: 914, currency: 'EUR', basis: 'Daft.ie’s double room in a Dublin house, Q1 2026' },
  'us-ny-newyork': { amount: 1_515, currency: 'USD', basis: 'SpareRoom’s New York metro average, July 2026' },
  'us-ca-losangeles': { amount: 1_338, currency: 'USD', basis: 'SpareRoom’s Los Angeles metro average, July 2026' },
  'ca-on-toronto': { amount: 1_127, currency: 'CAD', basis: 'Rentals.ca’s shared accommodation, May 2026, read from a search’s summary' },
  'ca-bc-vancouver': { amount: 1_115, currency: 'CAD', basis: 'Rentals.ca’s shared accommodation, May 2026, read from a search’s summary' },
};
/** The most lodgers: New York City's two boarders, taken everywhere. */
export const MOST_LODGERS = 2;
/** What a year's room rent is free of tax to: Britain's Rent a Room Scheme, Ireland's Rent-a-Room Relief. */
export const RENT_A_ROOM: Readonly<Record<string, { free: number; currency: string; cliff: boolean }>> = {
  uk: { free: 7_500, currency: 'GBP', cliff: false },
  ie: { free: 14_000, currency: 'EUR', cliff: true },
};

export interface Lodger { since: Instant }

const inSave = (sim: Simulation, units: number, currency: string): Money => { const cur = saveCurrency(sim.universe); const c = Math.round(units * 100); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

/** A room's month in the save's money, or nothing where no rent is kept. */
export function roomRent(sim: Simulation, cityId: string): Money | undefined {
  const r = ROOM_RENT[cityId];
  return r ? inSave(sim, r.amount, r.currency) : undefined;
}

export const lodgersIn = (owned: OwnedHome): Lodger[] => (owned.lodgers ??= []);

/** Why a lodger can't be taken now, or nothing. */
export function lodgerRefusal(sim: Simulation, person: Person, owned: OwnedHome): string | undefined {
  if (livingIn(person)?.id !== owned.id) return 'A lodger lives in a home you live in.';
  if (roomRent(sim, owned.cityId) === undefined) return 'No room’s rent is published for this town.';
  const spare = Math.max(0, owned.facts.beds - 1);
  if (spare === 0) return 'There’s no spare bedroom.';
  if (lodgersIn(owned).length >= Math.min(spare, MOST_LODGERS)) return lodgersIn(owned).length >= MOST_LODGERS ? 'Two lodgers is the most.' : 'Every spare bedroom has a lodger.';
  return undefined;
}

/**
 * A month's rent in and the tax on it where it's taken as it's paid: in
 * Britain what's past the year's £7,500, in Ireland all of it once the year
 * passes €14,000, in Canada all of it. America's is the return's.
 */
function collect(sim: Simulation, person: Person, owned: OwnedHome, rent: Money): void {
  const zone = CITIES.require(owned.cityId).timeZone;
  const year = zonedParts(sim.now, zone).year;
  const y = yearOf(person, year);
  const before = y.lodgerRent ?? 0;
  y.lodgerRent = before + rent;
  const country = CITIES.get(owned.cityId)?.countryId ?? '';
  const checking = person.primaryAccountId!;
  let taxable = 0;
  if (country === 'us') recordHome(person, sim.now, zone, 'rentalRent', rent);
  else if (country === 'ca') taxable = rent;
  else {
    const relief = RENT_A_ROOM[country];
    if (relief) {
      const free = inSave(sim, relief.free, relief.currency);
      // Ireland's relief is lost whole: the month that passes it brings all the year's before it in.
      taxable = relief.cliff ? (y.lodgerRent > free ? (before > free ? rent : y.lodgerRent) : 0) : Math.max(0, y.lodgerRent - Math.max(free, before));
    }
  }
  const money = { currency: saveCurrency(sim.universe) };
  const base = y.acting + (y.lodgerTaxed ?? 0);
  const tax = taxable > 0 ? computeAnnualTax(base + taxable, owned.cityId, sim.now, money).total - computeAnnualTax(base, owned.cityId, sim.now, money).total : 0;
  y.lodgerTaxed = (y.lodgerTaxed ?? 0) + taxable;
  sim.post({
    memo: `A lodger’s rent, ${owned.facts.address}`, category: 'home',
    postings: [
      { accountId: checking, amount: rent - tax },
      { accountId: sim.nominalAccount('income', 'Lodgers’ Rent').id, amount: -rent },
      ...(tax > 0 ? [{ accountId: sim.nominalAccount('expense', 'Tax On A Lodger’s Rent').id, amount: tax }] : []),
    ],
  });
}

function scheduleMonth(sim: Simulation, person: Person, owned: OwnedHome): void {
  sim.schedule({ at: sim.now + 30 * MS_DAY, kind: LODGER_MONTH_KIND, label: 'The Lodgers’ Rent', category: 'home', priority: 30, payload: { personId: person.id, homeId: owned.id } });
}

export function registerLodgers(sim: Simulation): void {
  sim.onCommand<{ homeId: string }, { rent: Money }>('home.take_lodger', (p, { sim: s }) => {
    const person = s.player;
    const owned = homeById(person, String(p?.homeId));
    if (!owned) throw new CommandError('You don’t own that home.');
    const no = lodgerRefusal(s, person, owned);
    if (no) throw new CommandError(no);
    const first = lodgersIn(owned).length === 0;
    lodgersIn(owned).push({ since: s.now });
    const rent = roomRent(s, owned.cityId)!;
    // The first month is paid on moving in, and each after it.
    collect(s, person, owned, rent);
    if (first) scheduleMonth(s, person, owned);
    return { rent };
  });

  sim.onCommand<{ homeId: string }, { left: number }>('home.end_lodger', (p, { sim: s }) => {
    const person = s.player;
    const owned = homeById(person, String(p?.homeId));
    if (!owned || lodgersIn(owned).length === 0) throw new CommandError('No lodger lives there.');
    lodgersIn(owned).pop();
    // The last one gone, the month's rent is too, so one taken again starts its own.
    if (lodgersIn(owned).length === 0) for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === LODGER_MONTH_KIND && one.payload.homeId === owned.id) s.timeline.cancel(one.id, s.now);
    return { left: lodgersIn(owned).length };
  });

  sim.onSchedule(LODGER_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const owned = person ? homeById(person, String(item.payload.homeId)) : undefined;
    if (!person || !owned || lodgersIn(owned).length === 0) return;
    // They leave with the owner: a lodger lives with the one whose home it is.
    if (livingIn(person)?.id !== owned.id) { owned.lodgers = []; return; }
    const rent = roomRent(s, owned.cityId);
    if (rent === undefined) return;
    for (let i = 0; i < lodgersIn(owned).length; i += 1) collect(s, person, owned, rent);
    scheduleMonth(s, person, owned);
  });
}
