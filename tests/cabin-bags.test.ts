/**
 * A cabin bag at the gate (`cabinCheck` in `systems/luggage.ts`, from
 * 2026-10-05): weighed against the carrier's own cabin limit (Aer Lingus's
 * and Aeroméxico's 10 kg, British Airways' 23, none at Delta or Air Canada),
 * its heaviest things taken out and held by the airport until it's under.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { BAG_RULES } from '@/engine/content/baggage';
import { LIQUIDS, bagKg, cabinCheck, containerMl, securityCheck, suitcaseOf } from '@/engine/systems/luggage';
import { TOILETRIES } from '@/engine/content/hygiene';
import { CLEANING } from '@/engine/content/cleaning';
import { toiletryRefusal } from '@/engine/systems/hygiene';
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

describe('liquids at security', () => {
  const liquid = (sim: ReturnType<typeof life>, bagId: string, id: string, kind: string, ml: number) =>
    addItem(sim, sim.player, { kind: `test-${id}`, label: id, quantity: 1, condition: 1, at: { kind: 'inside', itemId: bagId }, acquiredAt: sim.now, supply: { kind, unit: 'ml', left: ml } } as never);

  it('surrenders a container over 100 ml carried on, and past the quart bag the biggest, leaving New York', () => {
    expect(LIQUIDS.us).toEqual({ containerMl: 100, bagMl: 946 });
    const sim = life('us-ny-newyork', 'liquids-us');
    const bag = suitcaseOf(sim.player)!;
    const big = liquid(sim, bag.id, 'Big Shampoo', 'shampoo', 400);
    const small = Array.from({ length: 10 }, (_, n) => liquid(sim, bag.id, `Mini ${n}`, 'body-wash', 100));
    const taken = securityCheck(sim.player, 'us-ny-newyork', 0);
    expect(taken).toContain(big);
    // Ten 100 ml bottles are 1,000 ml, past the quart's 946: one more goes.
    expect(taken.filter((i) => small.includes(i))).toHaveLength(1);
    expect(itemsOf(sim.player).some((i) => i.id === big.id)).toBe(false);
    // Checked, it isn't carried through security.
    liquid(sim, bag.id, 'Another', 'shampoo', 400);
    expect(securityCheck(sim.player, 'us-ny-newyork', 1)).toHaveLength(0);
  });

  it('takes containers to 2 liters at Heathrow, and treats a stick of deodorant as no liquid', () => {
    const sim = life('uk-eng-london', 'liquids-uk');
    const bag = suitcaseOf(sim.player)!;
    liquid(sim, bag.id, 'Shampoo', 'shampoo', 400);
    addItem(sim, sim.player, { kind: 'test-stick', label: 'Stick', quantity: 1, condition: 1, at: { kind: 'inside', itemId: bag.id }, acquiredAt: sim.now, supply: { kind: 'deodorant', unit: 'g', left: 50 } } as never);
    expect(securityCheck(sim.player, 'uk-eng-london', 0)).toHaveLength(0);
    expect(containerMl(itemsOf(sim.player).find((i) => i.kind === 'test-stick')!)).toBeUndefined();
  });

  it('leaves what was given up to be bought where they land, carried, though not the cleaning', () => {
    const sim = life('us-ny-newyork', 'liquids-away');
    sim.player.currentLocationId = 'us-ca-losangeles';
    const shampoo = TOILETRIES.find((t) => t.kind === 'shampoo' && t.market === 'US' && !toiletryRefusal(sim.player, t.id, 1))!;
    for (let h = 0; h < 24 && toiletryRefusal(sim.player, shampoo.id, 1, sim.now); h += 1) sim.universe.now += 3_600_000;
    sim.must({ kind: 'hygiene.buy', payload: { productId: shampoo.id, quantity: 1 } });
    expect(itemsOf(sim.player).find((i) => i.kind === shampoo.id)!.at).toEqual({ kind: 'person' });
    const detergent = CLEANING.find((t) => t.market === 'US')!;
    expect(toiletryRefusal(sim.player, detergent.id, 1)).toMatch(/^(Cleaning things go home|There’s no store)/);
  });
});
