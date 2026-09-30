/**
 * Appliances fitted to a home owned (`systems/appliances.ts`, docs/WORLD.md
 * stage 6a, from 2026-09-29): each country's price fitted, what can't be
 * fitted and why, the fixtures each changes, and each giving out after its
 * published life.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import type { Fixtures } from '@/engine/content/homes';
import { applianceCost, fitRefusal, unitsRefusal } from '@/engine/systems/appliances';
import { drawRental, homePlace } from '@/engine/systems/dwelling';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';

const YEAR = 365.2425 * MS_DAY;
const save = (city: string, name: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const bare: Fixtures = { bathtub: false, dishwasher: false, laundry: 'none', cooling: 'none', outdoor: 'none', gym: 'none' };
const facts = (type: HomeFacts['type'], f: Partial<Fixtures> = {}): HomeFacts => ({ type, address: 'Test Home', beds: 2, baths: 1, size: 1_000, built: 2000, features: [], parts: {}, hoaUsd: 0, fixtures: { ...bare, ...f } });
const own = (sim: Simulation, city: string, type: HomeFacts['type'], f: Partial<Fixtures> = {}) => ownBuilt(sim, sim.player, { cityId: city, facts: facts(type, f), price: 400_000_00, closing: 0 });
const fund = (sim: Simulation) => { sim.universe.accounts[sim.player.primaryAccountId!]!.balance += 100_000_00; };

describe('what fitting one costs, and what can’t be fitted', () => {
  it('prices each country’s appliance with its fitting: America’s dishwasher $925, central air $8,750; Britain’s portable unit £463', () => {
    const ny = save('us-ny-newyork', 'fit-price');
    expect(applianceCost(ny, 'us-ny-newyork', 'dishwasher')).toBe(inSave(ny, 925_00, 'USD'));
    expect(applianceCost(ny, 'us-ny-newyork', 'central-air')).toBe(inSave(ny, 8_750_00, 'USD'));
    expect(applianceCost(ny, 'uk-eng-london', 'ac-units')).toBe(inSave(ny, 463_00, 'GBP'));
    expect(applianceCost(ny, 'uk-eng-london', 'central-air')).toBeUndefined();
    expect(applianceCost(ny, 'fr-idf-paris', 'dishwasher')).toBeUndefined();
  });

  it('refuses what isn’t priced, what’s there already, a dryer without a washer, central air in a flat, and what the bank can’t pay', () => {
    const sim = save('us-ny-newyork', 'fit-refuse');
    const flat = own(sim, 'us-ny-newyork', 'condo', { dishwasher: true });
    expect(fitRefusal(sim, sim.player, flat, 'dishwasher')).toMatch(/has one/);
    expect(fitRefusal(sim, sim.player, flat, 'dryer')).toMatch(/beside a washing machine/);
    expect(fitRefusal(sim, sim.player, flat, 'central-air')).toMatch(/fitted to a house/);
    const london = own(sim, 'uk-eng-london', 'house');
    expect(fitRefusal(sim, sim.player, london, 'central-air')).toMatch(/No one publishes a price/);
    const paris = own(sim, 'fr-idf-paris', 'house');
    expect(fitRefusal(sim, sim.player, paris, 'washer')).toMatch(/no appliance prices in this country/);
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0) a.balance = 0;
    expect(fitRefusal(sim, sim.player, flat, 'washer')).toMatch(/It costs/);
  });
});

describe('what one changes, and its end', () => {
  it('keeps a dishwasher nine years, then it gives out and the home is as it was', () => {
    const sim = save('us-ny-newyork', 'fit-dish');
    const home = own(sim, 'us-ny-newyork', 'house');
    fund(sim);
    const r = sim.execute<{ cost: number; lastsTo: number }>({ kind: 'home.fit', payload: { homeId: home.id, kind: 'dishwasher' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.cost).toBe(inSave(sim, 925_00, 'USD'));
    expect(r.value!.lastsTo).toBe(sim.now + 9 * YEAR);
    expect(home.facts.fixtures!.dishwasher).toBe(true);
    sim.advanceTo(r.value!.lastsTo - MS_DAY);
    expect(home.facts.fixtures!.dishwasher).toBe(true);
    sim.advanceBy(2 * MS_DAY);
    expect(home.facts.fixtures!.dishwasher).toBe(false);
    expect(sim.universe.notifications.some((n) => n.title === 'The Dishwasher Gave Out')).toBe(true);
  });

  it('does the laundry at home with a washer, and a dryer beside it; the washer’s end leaves the building’s machines', () => {
    const sim = save('uk-eng-london', 'fit-laundry');
    const flat = own(sim, 'uk-eng-london', 'condo', { laundry: 'building' });
    fund(sim);
    expect(sim.execute({ kind: 'home.fit', payload: { homeId: flat.id, kind: 'washer' } }).ok).toBe(true);
    expect(flat.facts.fixtures!.laundry).toBe('washer-only');
    const dryer = sim.execute<{ lastsTo: number }>({ kind: 'home.fit', payload: { homeId: flat.id, kind: 'dryer' } });
    expect(dryer.ok).toBe(true);
    expect(flat.facts.fixtures!.laundry).toBe('in-unit');
    // The washer lasts ten years, the dryer thirteen.
    sim.advanceBy(10 * YEAR + MS_DAY);
    expect(flat.facts.fixtures!.laundry).toBe('building');
    // The dryer's end, with no washer beside it, leaves it so.
    fund(sim);
    sim.advanceTo(dryer.value!.lastsTo + MS_DAY);
    expect(sim.universe.notifications.some((n) => n.title === 'The Dryer Gave Out')).toBe(true);
    expect(flat.facts.fixtures!.laundry).toBe('building');
  });

  it('cools a house with units, then central air, which outlasts the units’ end', () => {
    const sim = save('us-ca-losangeles', 'fit-cool');
    const home = own(sim, 'us-ca-losangeles', 'house');
    fund(sim);
    expect(sim.execute({ kind: 'home.fit', payload: { homeId: home.id, kind: 'ac-units' } }).ok).toBe(true);
    expect(home.facts.fixtures!.cooling).toBe('units');
    expect(sim.execute({ kind: 'home.fit', payload: { homeId: home.id, kind: 'central-air' } }).ok).toBe(true);
    expect(home.facts.fixtures!.cooling).toBe('central');
    sim.advanceBy(9 * YEAR + MS_DAY);
    expect(home.facts.fixtures!.cooling).toBe('central');
  });
});

describe('air conditioning units of one’s own', () => {
  /** A renter whose flat has no air conditioning. */
  const renter = (city: string, name: string) => {
    const sim = save(city, name);
    const home = sim.player.home!;
    expect(home.kind === 'own' || home.kind === 'shared').toBe(true);
    home.unit = { ...(home.unit ?? drawRental(sim, sim.player, home.cityId, home.kind === 'shared', home.since)), fixtures: { ...bare } };
    fund(sim);
    return sim;
  };

  it('sells a New York tenant window units at $580 fitted, cooling their flat, and theirs for nine years', () => {
    const sim = renter('us-ny-newyork', 'units-ny');
    expect(homePlace(sim, sim.player)!.fixtures.cooling).toBe('none');
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const r = sim.execute({ kind: 'home.buy_units', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(before - sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(inSave(sim, 580_00, 'USD'));
    expect(homePlace(sim, sim.player)!.fixtures.cooling).toBe('units');
    expect(unitsRefusal(sim, sim.player)).toMatch(/of your own/);
    sim.advanceBy(9 * YEAR - 30 * MS_DAY);
    expect(sim.player.acUnits).toBeDefined();
    sim.advanceBy(60 * MS_DAY);
    expect(sim.player.acUnits).toBeUndefined();
  });

  it('cools any home they move to without its own, and leaves one with its own as it is', () => {
    const sim = renter('us-ny-newyork', 'units-move');
    expect(sim.execute({ kind: 'home.buy_units', payload: {} }).ok).toBe(true);
    const home = sim.player.home!;
    home.unit = { ...home.unit!, fixtures: { ...bare, cooling: 'central' } };
    expect(homePlace(sim, sim.player)!.fixtures.cooling).toBe('central');
    home.unit = { ...home.unit!, fixtures: { ...bare } };
    expect(homePlace(sim, sim.player)!.fixtures.cooling).toBe('units');
  });

  it('refuses a Dublin tenant, whose kept price is a split system on the walls, and a home cooled already', () => {
    const ie = renter('ie-lei-dublin', 'units-ie3');
    expect(unitsRefusal(ie, ie.player)).toMatch(/landlord’s consent/);
    const cooled = renter('us-ny-newyork', 'units-cooled');
    cooled.player.home!.unit = { ...cooled.player.home!.unit!, fixtures: { ...bare, cooling: 'units' } };
    expect(unitsRefusal(cooled, cooled.player)).toMatch(/cooled already/);
    const broke = renter('uk-eng-london', 'units-broke');
    for (const a of Object.values(broke.universe.accounts)) if (a.ownerId === broke.player.id && !a.nominal && a.balance > 0) a.balance = 0;
    expect(unitsRefusal(broke, broke.player)).toMatch(/cost/);
  });
});
