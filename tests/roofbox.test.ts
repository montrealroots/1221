/**
 * A roof rack and a roof box (`systems/roofbox.ts`, from 2026-10-03): the
 * box holds its liters beside the car's, costs fueleconomy.gov's fuel while
 * it's on, and comes off to be kept at home.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { inSaveMoney } from '@/engine/systems/banking';
import { runningCost, vehiclesOf } from '@/engine/systems/vehicles';
import { ROOF_BOX_FUEL, boxOn, rackRefusal, roofCatalog, roofFuelFactor } from '@/engine/systems/roofbox';
import { addItem, itemsOf } from '@/engine/systems/items';

const bought = (city: string, model: string, seed: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.must({ kind: 'vehicle.buy', payload: { modelId: model } });
  return { sim, v: vehiclesOf(sim.player)[0]! };
};

describe('a roof box', () => {
  it('goes on a rack bought first, cheapest first: Yakima’s SkyBox 12 at $469 in America', () => {
    const { sim, v } = bought('us-ny-newyork', 'us-honda-cr-v', 'roof-us');
    expect(sim.execute({ kind: 'vehicle.roof_box', payload: { vehicleId: v.id, boxId: 'yakima-skybox-12' } }).error).toBe('A box goes on a roof rack: fit one first.');
    const cat = roofCatalog(sim, v);
    expect(cat.rack!.price).toBe(inSaveMoney(sim, 444_90, 'USD'));
    expect(cat.boxes.map((b) => b.id)).toEqual(['yakima-skybox-12', 'yakima-skybox-16', 'thule-motion-3-l']);
    sim.must({ kind: 'vehicle.roof_rack', payload: { vehicleId: v.id } });
    expect(rackRefusal(v)).toBe('It has a rack.');
    sim.must({ kind: 'vehicle.roof_box', payload: { vehicleId: v.id, boxId: 'yakima-skybox-12' } });
    expect(v.roofBoxL).toBe(340);
    expect(boxOn(sim.player, v)!.label).toBe('Yakima SkyBox 12');
  });

  it('costs fuel while it’s on, more on the highway, and nothing once it’s off at home', () => {
    const { sim, v } = bought('us-ny-newyork', 'us-honda-cr-v', 'roof-fuel');
    const plain = runningCost(sim, v, 100);
    sim.must({ kind: 'vehicle.roof_rack', payload: { vehicleId: v.id } });
    sim.must({ kind: 'vehicle.roof_box', payload: { vehicleId: v.id, boxId: 'yakima-skybox-12' } });
    expect(roofFuelFactor(v)).toBe(1 + ROOF_BOX_FUEL.town);
    expect(roofFuelFactor(v, 'highway')).toBe(1 + ROOF_BOX_FUEL.highway);
    expect(runningCost(sim, v, 100)).toBeGreaterThan(plain);
    expect(runningCost(sim, v, 100, 0, 'highway')).toBeGreaterThan(runningCost(sim, v, 100));
    // Not taken off with things in it.
    const box = boxOn(sim.player, v)!;
    const bag = addItem(sim, sim.player, { kind: 'custom', label: 'A Bag', quantity: 1, condition: 1, at: { kind: 'inside', itemId: box.id }, acquiredAt: sim.now, volumeL: 20 });
    expect(sim.execute({ kind: 'vehicle.roof_box_fit', payload: { vehicleId: v.id, on: false } }).error).toBe('Empty it first.');
    sim.player.items = itemsOf(sim.player).filter((i) => i.id !== bag.id);
    sim.must({ kind: 'vehicle.roof_box_fit', payload: { vehicleId: v.id, on: false } });
    expect(v.roofBoxL).toBeUndefined();
    expect(runningCost(sim, v, 100)).toBe(plain);
    expect(itemsOf(sim.player).find((i) => i.kind.startsWith('roofbox:'))!.at.kind).toBe('home');
    sim.must({ kind: 'vehicle.roof_box_fit', payload: { vehicleId: v.id, on: true } });
    expect(v.roofBoxL).toBe(340);
  });

  it('isn’t sold where the maker lists no complete rack or box', () => {
    const mx = bought('mx-cmx-mexicocity', 'mx-nissan-versa', 'roof-mx');
    expect(rackRefusal(mx.v)).toBe('No complete roof rack is sold where it’s registered.');
    const ie = bought('ie-lei-dublin', 'ie-toyota-corolla', 'roof-ie');
    expect(roofCatalog(ie.sim, ie.v).boxes).toEqual([]);
  });
});
