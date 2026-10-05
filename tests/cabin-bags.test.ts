/**
 * A cabin bag at the gate (`cabinCheck` in `systems/luggage.ts`, from
 * 2026-10-05): weighed against the carrier's own cabin limit (Aer Lingus's
 * and Aeroméxico's 10 kg, British Airways' 23, none at Delta or Air Canada),
 * its heaviest things taken out and held by the airport until it's under.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { BAG_RULES } from '@/engine/content/baggage';
import { bagKg, cabinCheck, suitcaseOf } from '@/engine/systems/luggage';
import { addItem, itemsOf } from '@/engine/systems/items';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
/** A carry-on packed with coats, each 1.15 kg. */
const packed = (sim: ReturnType<typeof life>, coats: number) => {
  const bag = suitcaseOf(sim.player)!;
  for (let n = 0; n < coats; n += 1) addItem(sim, sim.player, { kind: `coat-${n}`, label: 'A Coat', quantity: 1, condition: 1, at: { kind: 'inside', itemId: bag.id }, acquiredAt: sim.now, garment: { kind: 'coat', slot: 'outer', care: 'wash', wears: 0, washes: 0 } } as never);
  return bag;
};

describe('a cabin bag at the gate', () => {
  it('is held to the carrier’s own limit: Aer Lingus’s 10 kg, its heaviest things out until it’s under', () => {
    expect([BAG_RULES.ie!.domestic.cabinKg, BAG_RULES.mx!.domestic.cabinKg, BAG_RULES.uk!.domestic.cabinKg]).toEqual([10, 10, 23]);
    const sim = life('ie-lei-dublin', 'cabin-ie');
    const bag = packed(sim, 10);
    expect(bagKg(sim.player, bag)).toBeGreaterThan(10);
    const { taken } = cabinCheck(sim, sim.player, 'ie-lei-dublin', 'uk-eng-london', 0);
    expect(taken.length).toBeGreaterThan(0);
    expect(bagKg(sim.player, bag)).toBeLessThanOrEqual(10);
    expect(taken.every((i) => i.at.kind === 'held' && i.at.cityId === 'ie-lei-dublin')).toBe(true);
    // Checked, it isn't the cabin's: nothing comes out.
    expect(cabinCheck(sim, sim.player, 'ie-lei-dublin', 'uk-eng-london', 1).taken).toHaveLength(0);
  });

  it('isn’t weighed where the carrier sets no limit', () => {
    expect(BAG_RULES.us!.domestic.cabinKg).toBeUndefined();
    const sim = life('us-ny-newyork', 'cabin-us');
    const bag = packed(sim, 12);
    expect(cabinCheck(sim, sim.player, 'us-ny-newyork', 'us-ca-losangeles', 0).taken).toHaveLength(0);
    expect(itemsOf(sim.player).filter((i) => i.at.kind === 'inside' && i.at.itemId === bag.id)).toHaveLength(12);
  });
});
