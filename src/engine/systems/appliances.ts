/**
 * SLATE — fitting appliances to a home one owns (docs/WORLD.md, stage 6a),
 * from 2026-09-29, on the prices in `content/appliances.ts`.
 *
 * An appliance changes what the home's fixtures already decide: a dishwasher
 * keeps the place tidier; a washer, and a dryer beside it, do the laundry at
 * home instead of the laundromat; air conditioning units, or central air in
 * a house, cool the hot nights and run up the summer's bills
 * (`dwelling.ts`, `household.ts`). Bought and fitted where the country's
 * price is kept, paid from the bank. Each lasts its published life and then
 * gives out, the home back as it was without it, until another is fitted.
 *
 * Not kept, and said so: appliances in a rented home, what one adds to a
 * home's value, and a gas dryer's or a heat pump's hookups.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { APPLIANCES, APPLIANCE_LABEL, APPLIANCE_LIFE, type ApplianceKind } from '../content/appliances';
import type { Fixtures } from '../content/homes';
import { homeById, type OwnedHome } from './homes';
import { fixturesOf } from './dwelling';
import { inTheBank, payFromBank } from './household';

export const APPLIANCE_OUT_KIND = 'home.appliance_out';
const YEAR_MS = 365.2425 * MS_DAY;
const HOUSES = new Set(['house', 'townhouse', 'estate']);

const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };

/** A country's kept prices for a home in a town, or nothing. */
export const appliancesIn = (cityId: string) => APPLIANCES[CITIES.get(cityId)?.countryId ?? ''];

/** What fitting one costs, in the save's money, cents: its price and its fitting. */
export function applianceCost(sim: Simulation, cityId: string, kind: ApplianceKind): Money | undefined {
  const table = appliancesIn(cityId);
  const item = table?.items[kind];
  return item ? inSave(sim, Math.round((item.price + item.install) * 100), table!.currency) : undefined;
}

/** Whether a home has one now, by its fixtures. */
export function hasAppliance(f: Fixtures, kind: ApplianceKind): boolean {
  if (kind === 'dishwasher') return f.dishwasher;
  if (kind === 'washer') return f.laundry === 'in-unit' || f.laundry === 'washer-only';
  if (kind === 'dryer') return f.laundry === 'in-unit';
  if (kind === 'ac-units') return f.cooling !== 'none';
  return f.cooling === 'central';
}

/** Why one can't be fitted, or nothing. */
export function fitRefusal(sim: Simulation, person: Person, owned: OwnedHome, kind: ApplianceKind): string | undefined {
  const table = appliancesIn(owned.cityId);
  if (!table) return 'SLATE keeps no appliance prices in this country yet.';
  if (!table.items[kind]) return `No one publishes a price for ${APPLIANCE_LABEL[kind].toLowerCase()} here.`;
  const f = fixturesOf(sim, person, owned.cityId, owned.facts, owned.id);
  if (hasAppliance(f, kind)) return 'It has one.';
  if (kind === 'dryer' && !hasAppliance(f, 'washer')) return 'A dryer goes beside a washing machine.';
  if (kind === 'central-air' && !HOUSES.has(owned.facts.type)) return 'Central air is fitted to a house.';
  const cost = applianceCost(sim, owned.cityId, kind)!;
  if (inTheBank(sim, person) < cost) return `It costs ${formatMoney(cost, saveCurrency(sim.universe), { cents: false })}, fitted.`;
  return undefined;
}

/** The home's fixtures with one fitted, or given out. */
function change(f: Fixtures, kind: ApplianceKind, fitted: boolean, before: Fixtures['laundry'] = 'none'): Fixtures {
  if (kind === 'dishwasher') return { ...f, dishwasher: fitted };
  if (kind === 'washer') return { ...f, laundry: fitted ? (f.laundry === 'in-unit' ? 'in-unit' : 'washer-only') : before };
  if (kind === 'dryer') return { ...f, laundry: fitted ? 'in-unit' : f.laundry === 'in-unit' ? 'washer-only' : f.laundry };
  if (kind === 'ac-units') return { ...f, cooling: fitted ? (f.cooling === 'central' ? 'central' : 'units') : f.cooling === 'units' ? 'none' : f.cooling };
  return { ...f, cooling: fitted ? 'central' : 'none' };
}

export function registerAppliances(sim: Simulation): void {
  sim.onCommand<{ homeId: string; kind: ApplianceKind }, { cost: Money; lastsTo: Instant }>('home.fit', (p, { sim: s }) => {
    const person = s.player;
    const owned = homeById(person, String(p?.homeId));
    if (!owned) throw new CommandError('You don’t own that home.');
    const kind = p.kind;
    if (!(kind in APPLIANCE_LABEL)) throw new CommandError('No such appliance.');
    const no = fitRefusal(s, person, owned, kind);
    if (no) throw new CommandError(no);
    const cost = applianceCost(s, owned.cityId, kind)!;
    if (!payFromBank(s, person, cost, `${APPLIANCE_LABEL[kind]}, bought and fitted, ${owned.facts.address}`, 'home')) throw new CommandError('The bank couldn’t pay for it.');
    const f = fixturesOf(s, person, owned.cityId, owned.facts, owned.id);
    // A washer given out leaves the laundry as it was before one was fitted: the building's machines, or none.
    if (kind === 'washer') owned.laundryBefore = f.laundry === 'building' ? 'building' : 'none';
    owned.facts.fixtures = change(f, kind, true);
    (owned.appliances ??= {})[kind] = s.now;
    const lastsTo = s.now + APPLIANCE_LIFE[kind] * YEAR_MS;
    s.schedule({ at: lastsTo, kind: APPLIANCE_OUT_KIND, label: `${APPLIANCE_LABEL[kind]} Worn Out`, category: 'home', priority: 30, payload: { personId: person.id, homeId: owned.id, kind, fittedAt: s.now } });
    return { cost, lastsTo };
  });

  sim.onSchedule(APPLIANCE_OUT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const owned = person ? homeById(person, String(item.payload.homeId)) : undefined;
    const kind = item.payload.kind as ApplianceKind;
    // A home sold leaves its end unmet; one can't be refitted before it ends, so the one fitted is this one.
    if (!person || !owned) return;
    owned.facts.fixtures = change(fixturesOf(s, person, owned.cityId, owned.facts, owned.id), kind, false, owned.laundryBefore ?? 'none');
    if (owned.appliances) delete owned.appliances[kind];
    if (person.id === s.universe.playerId) s.notify({ category: 'home', title: `The ${APPLIANCE_LABEL[kind]} Gave Out`, body: `After ${APPLIANCE_LIFE[kind]} years, its published life, at ${owned.facts.address}. Another can be fitted on the Homes screen.`, importance: 50, route: '/workspace/homes' });
  });
}
