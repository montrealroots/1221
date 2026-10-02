/**
 * Cleaning supplies and the rubbish collection (`systems/hygiene.ts` and
 * `systems/waste.ts`, from 2026-10-02): a home's starting detergents, a
 * load's detergent each, a dishwasher's tablets a day, going without, and
 * each town's charge for its bins in the month's bills.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { instantFromZoned, zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { CLEANING } from '@/engine/content/cleaning';
import { DISHWASHER_CYCLES_A_DAY, dishwasherRuns, keepsCleaning, restock, shortfallBuy, starterCleaning, suppliesOf, toiletryCatalog } from '@/engine/systems/hygiene';
import { doLaundry, homePlace } from '@/engine/systems/dwelling';
import { inSaveMoney } from '@/engine/systems/banking';
import { LA_SOLID_RESOURCES, wasteFeeOf } from '@/engine/systems/waste';
import { GARMENTS_PER_LOAD, garmentsOf, washableDirty } from '@/engine/systems/wardrobe';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const left = (sim: Simulation, kind: string) => suppliesOf(sim.player).filter((i) => i.supply.kind === kind).reduce((a, i) => a + i.supply.left, 0);
const without = (sim: Simulation, kind: string) => { sim.player.items = (sim.player.items ?? []).filter((i) => i.supply?.kind !== kind); };
const fee = (sim: Simulation) => wasteFeeOf(sim, sim.player);

describe('detergents', () => {
  it('a home starts with laundry detergent, counted in washes, kept in storage', () => {
    const sim = life('us-ny-newyork', 'clean-start');
    expect(keepsCleaning(sim.player)).toBe(true);
    const det = suppliesOf(sim.player).filter((i) => i.supply.kind === 'laundry-detergent');
    expect(det).toHaveLength(1);
    expect(det[0]!.supply.unit).toBe('ct');
    expect(det[0]!.at).toMatchObject({ kind: 'home', spot: 'storage' });
    expect(suppliesOf(sim.player).some((i) => i.supply.kind === 'dishwasher-detergent')).toBe(homePlace(sim, sim.player)!.fixtures.dishwasher);
    // A home without a dishwasher starts without its tablets.
    without(sim, 'laundry-detergent');
    without(sim, 'dishwasher-detergent');
    sim.player.cleaningSince = undefined;
    expect(starterCleaning(sim, sim.player, false)).toBe(true);
    expect(suppliesOf(sim.player).map((i) => i.supply.kind).filter((k) => k.endsWith('-detergent'))).toEqual(['laundry-detergent']);
  });

  it('a wash uses a load of detergent each; without enough it won’t go', () => {
    const sim = life('us-ny-newyork', 'clean-wash');
    for (const g of garmentsOf(sim.player)) g.garment.dirty = true;
    const loads = Math.ceil(washableDirty(sim, sim.player).length / GARMENTS_PER_LOAD);
    expect(loads).toBeGreaterThan(0);
    const before = left(sim, 'laundry-detergent');
    sim.must({ kind: 'life.look_after', payload: { action: 'laundry' } });
    expect(left(sim, 'laundry-detergent')).toBeCloseTo(before - loads, 9);
    for (const g of garmentsOf(sim.player)) g.garment.dirty = true;
    without(sim, 'laundry-detergent');
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'laundry' } }).error).toBe('There isn’t enough laundry detergent at home for it.');
    // Nor on a free day's own washing.
    expect(doLaundry(sim, sim.player, sim.now)).toBe(false);
    expect(washableDirty(sim, sim.player).length).toBeGreaterThan(0);
  });

  it('a dishwasher uses the DOE’s 184 cycles a year of tablets; without them the dishes are by hand', () => {
    const sim = life('us-ny-newyork', 'clean-dish');
    const p = sim.player;
    const t = CLEANING.find((x) => x.kind === 'dishwasher-detergent' && x.market === 'US')!;
    const at = suppliesOf(p).find((i) => i.supply.kind === 'laundry-detergent')!.at;
    without(sim, 'dishwasher-detergent');
    p.items = [...(p.items ?? []), { id: 'tabs', kind: t.id, label: t.name, quantity: 1, condition: 1, at, acquiredAt: sim.now, supply: { kind: 'dishwasher-detergent', unit: 'ct', left: 10 } }];
    expect(dishwasherRuns(sim, p)).toBe(true);
    expect(left(sim, 'dishwasher-detergent')).toBeCloseTo(10 - DISHWASHER_CYCLES_A_DAY, 9);
    without(sim, 'dishwasher-detergent');
    expect(dishwasherRuns(sim, p)).toBe(false);
  });

  it('what’s run out is bought again, the dishwasher’s only where there is one', () => {
    const sim = life('us-ny-newyork', 'clean-restock');
    without(sim, 'laundry-detergent');
    without(sim, 'dishwasher-detergent');
    expect(restock(sim, sim.player, false)).toBe(1);
    expect(left(sim, 'laundry-detergent')).toBeGreaterThan(0);
    expect(left(sim, 'dishwasher-detergent')).toBe(0);
    expect(restock(sim, sim.player, true)).toBe(1);
    expect(left(sim, 'dishwasher-detergent')).toBeGreaterThan(0);
  });

  it('the chains’ cleaning shelves are in the catalog, by kind', () => {
    const sim = life('us-ny-newyork', 'clean-cat');
    const kinds = new Set(toiletryCatalog(sim, 'us-ny-newyork').map((e) => e.facets?.kind));
    for (const k of ['Dish Soap', 'Laundry Detergent', 'Dishwasher Detergent', 'Bleach', 'Paper Towels', 'Trash Bags', 'Sponges', 'All-Purpose Cleaner']) expect(kinds).toContain(k);
  });
});

describe('the bins', () => {
  const inHouse = (city: string, seed: string, type: 'house' | 'condo') => {
    const sim = life(city, seed);
    const home = sim.player.home!;
    const place = homePlace(sim, sim.player)!;
    home.kind = 'own';
    home.unit = { ...(home.unit ?? { size: place.size, fixtures: place.fixtures }), type, shared: false } as typeof home.unit;
    return sim;
  };

  it('Los Angeles charges a house its Solid Resources Fee by LA Sanitation’s schedule', () => {
    const sim = inHouse('us-ca-losangeles', 'bins-la', 'house');
    const zone = CITIES.require('us-ca-losangeles').timeZone;
    const at = (year: number, month: number, day: number) => instantFromZoned({ year, month, day, hour: 12, minute: 0, second: 0 }, zone);
    sim.universe.now = at(2026, 6, 30);
    expect(fee(sim)).toBe(inSaveMoney(sim, 5595, 'USD'));
    sim.universe.now = at(2026, 7, 1);
    expect(fee(sim)).toBe(inSaveMoney(sim, 5953, 'USD'));
    sim.universe.now = at(2029, 7, 1);
    expect(fee(sim)).toBe(inSaveMoney(sim, Math.round(LA_SOLID_RESOURCES.at(-1)!.usd * 100), 'USD'));
  });

  it('a flat’s bins are the building’s, a room’s in the rent, London’s in the council tax and Mexico City’s free', () => {
    expect(fee(inHouse('us-ca-losangeles', 'bins-flat', 'condo'))).toBe(0);
    const room = inHouse('ie-lei-dublin', 'bins-room', 'house');
    room.player.home!.kind = 'shared';
    expect(fee(room)).toBe(0);
    expect(fee(inHouse('uk-eng-london', 'bins-london', 'house'))).toBe(0);
    expect(fee(inHouse('mx-cmx-mexicocity', 'bins-cdmx', 'house'))).toBe(0);
  });

  it('Toronto, Vancouver and Dublin charge a house the least of their plans, a month, in the bills', () => {
    const to = inHouse('ca-on-toronto', 'bins-to', 'house');
    expect(fee(to)).toBe(inSaveMoney(to, Math.round((317.85 / 12) * 100), 'CAD'));
    const van = inHouse('ca-bc-vancouver', 'bins-van', 'house');
    expect(fee(van)).toBe(inSaveMoney(van, Math.round(((117 + 189) / 12) * 100), 'CAD'));
    const dub = inHouse('ie-lei-dublin', 'bins-dub', 'house');
    expect(fee(dub)).toBe(inSaveMoney(dub, 2400, 'EUR'));
  });
});

describe('bought again', () => {
  it('with a week’s use left, not only once it’s out', () => {
    const sim = life('us-ny-newyork', 'clean-low');
    const det = suppliesOf(sim.player).find((i) => i.supply.kind === 'laundry-detergent')!;
    det.supply.left = 10;
    expect(restock(sim, sim.player, false)).toBe(0);
    det.supply.left = 1;
    expect(restock(sim, sim.player, false)).toBe(1);
    expect(left(sim, 'laundry-detergent')).toBeGreaterThan(1);
  });
});

describe('a shortfall bought in place', () => {
  it('is the cheapest here while a store is open, and nothing while none is', () => {
    const sim = life('us-ny-newyork', 'clean-short');
    const zone = 'America/New_York';
    const p = zonedParts(sim.now + 86_400_000, zone);
    sim.universe.now = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 12, minute: 0, second: 0 }, zone);
    const buy = shortfallBuy(sim, sim.player, 'laundry-detergent');
    expect(buy).toBeDefined();
    expect(buy!.toiletry.kind).toBe('laundry-detergent');
    sim.universe.now = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 3, minute: 0, second: 0 }, zone);
    expect(shortfallBuy(sim, sim.player, 'laundry-detergent')).toBeUndefined();
  });
});
