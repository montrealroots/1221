/**
 * Packing by choice (`systems/luggage.ts`, from 2026-10-03): a new life packs
 * nothing on its own; bags go as they're packed, any number of them, an empty
 * one too; home, they're set down packed until unpacked; a room left without
 * repacking leaves its things held where they stayed, collected in person
 * before the hold runs out, gone after; and a save from before keeps the
 * shortcuts it had.
 */
import { describe, expect, it } from 'vitest';
import { EVERY_SHORTCUT } from '@/engine/systems/automation';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { HELD_DAYS, bagKg, bagRuleFor, bagsGoing, heldIn, moveTo, overweight, packedIn, suitcaseOf, weighIn, weightG } from '@/engine/systems/luggage';
import { CARRY_ON_KG, GARMENT_G } from '@/engine/content/baggage';
import { addItem, homeKeyOf } from '@/engine/systems/items';
import { garmentsOf } from '@/engine/systems/wardrobe';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('packing by choice', () => {
  it('a new life has no shortcut on but the day’s outfit and meals (from 2026-10-06), and an empty bag goes empty', () => {
    const sim = life('lc-empty');
    expect(sim.player.automation).toEqual({ chooseOutfit: true, eatLeftovers: true });
    moveTo(sim, sim.player, 'us-ca-losangeles');
    const bag = suitcaseOf(sim.player)!;
    expect(bag.at.kind).toBe('person');
    expect(packedIn(sim.player, bag)).toHaveLength(0);
  });

  it('takes any of the bags owned, and sets them down packed at home until unpacked', () => {
    const sim = life('lc-bags');
    sim.advanceBy(26 * 3_600_000);
    const home = homeKeyOf(sim.player.home)!;
    const first = suitcaseOf(sim.player)!;
    const duffel = addItem(sim, sim.player, { kind: 'luggage:test-duffel', label: 'Duffel', quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'storage' }, acquiredAt: sim.now, holdsL: 40, volumeL: 40 });
    sim.must({ kind: 'luggage.take', payload: { itemId: duffel.id, going: true } });
    expect(bagsGoing(sim.player).map((b) => b.id)).toEqual([first.id, duffel.id]);
    const shirt = garmentsOf(sim.player).find((g) => g.garment.slot === 'top' && g.at.kind === 'home')!;
    sim.must({ kind: 'items.move', payload: { itemId: shirt.id, to: { kind: 'inside', itemId: duffel.id } } });
    moveTo(sim, sim.player, 'us-ca-losangeles');
    expect(first.at.kind).toBe('person');
    expect(duffel.at.kind).toBe('person');
    moveTo(sim, sim.player, 'us-ny-newyork');
    // Home, set down still packed.
    expect(duffel.at).toMatchObject({ kind: 'home', spot: 'storage' });
    expect(packedIn(sim.player, duffel).map((i) => i.id)).toEqual([shirt.id]);
    expect(sim.must<{ unpacked: number }>({ kind: 'luggage.unpack', payload: { itemId: duffel.id } }).unpacked).toBe(1);
    expect(shirt.at).toMatchObject({ kind: 'home', spot: 'wardrobe' });
    // At least one goes.
    sim.must({ kind: 'luggage.take', payload: { itemId: first.id, going: false } });
    expect(sim.execute({ kind: 'luggage.take', payload: { itemId: duffel.id, going: false } }).error).toBe('At least one bag goes.');
  });
});

describe('a room left', () => {
  function away(seed: string) {
    const sim = life(seed);
    sim.advanceBy(26 * 3_600_000);
    const bag = suitcaseOf(sim.player)!;
    sim.must({ kind: 'luggage.pack', payload: {} });
    moveTo(sim, sim.player, 'us-ca-losangeles');
    sim.player.stay = { kind: 'hotel', cityId: 'us-ca-losangeles' } as never;
    sim.must({ kind: 'luggage.unpack', payload: {} });
    return { sim, bag };
  }

  it('repacked by hand goes with them', () => {
    const { sim, bag } = away('lc-repack');
    const out = sim.player.items!.filter((i) => i.at.kind === 'stay').length;
    expect(sim.must<{ packed: number; left: number }>({ kind: 'luggage.repack', payload: {} })).toEqual({ packed: out, left: 0 });
    delete sim.player.stay;
    moveTo(sim, sim.player, 'uk-eng-london');
    expect(packedIn(sim.player, bag)).toHaveLength(out);
    expect(sim.player.items!.some((i) => i.at.kind === 'held')).toBe(false);
  });

  it('left without repacking, its things are held there, collected in town before the hold runs out', () => {
    const { sim } = away('lc-forgot');
    const out = sim.player.items!.filter((i) => i.at.kind === 'stay').length;
    delete sim.player.stay;
    moveTo(sim, sim.player, 'uk-eng-london');
    expect(heldIn(sim.player, 'us-ca-losangeles')).toHaveLength(out);
    expect(sim.universe.notifications.at(-1)!.title).toBe('Left Behind');
    expect(sim.execute({ kind: 'items.recover', payload: { cityId: 'us-ca-losangeles' } }).error).toBe('It’s collected in Los Angeles.');
    // A save and a load in between keeps it held.
    const back = loadSave(deserialise(serialise(sim.universe)) as never);
    moveTo(back, back.player, 'us-ca-losangeles');
    expect(back.must<{ collected: number }>({ kind: 'items.recover', payload: {} }).collected).toBe(out);
    expect(back.player.items!.filter((i) => i.at.kind === 'person').length).toBeGreaterThanOrEqual(out);
  });

  it('not collected in time, it’s gone', () => {
    const { sim } = away('lc-gone');
    const owned = sim.player.items!.length;
    const out = sim.player.items!.filter((i) => i.at.kind === 'stay').length;
    delete sim.player.stay;
    moveTo(sim, sim.player, 'uk-eng-london');
    sim.advanceBy((HELD_DAYS + 1) * MS_DAY);
    expect(sim.player.items!.length).toBeLessThanOrEqual(owned - out);
    expect(sim.player.items!.some((i) => i.at.kind === 'held')).toBe(false);
    expect(sim.universe.notifications.some((n) => n.title === 'Not Collected')).toBe(true);
  });
});

describe('a save from before', () => {
  it('keeps the shortcuts it had, written down', () => {
    const sim = life('lc-old');
    delete sim.player.automation;
    const back = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(back.player.automation).toEqual(EVERY_SHORTCUT);
  });

  it('from before 2026-10-06 is given the day’s outfit and meals beside what it chose; one after keeps them off once turned off', () => {
    const sim = life('lc-day');
    sim.player.automation = { laundry: true };
    delete sim.player.dayShortcuts;
    const back = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(back.player.automation).toEqual({ laundry: true, chooseOutfit: true, eatLeftovers: true });
    back.must({ kind: 'life.set_automation', payload: { key: 'chooseOutfit', on: false } });
    const again = loadSave(deserialise(serialise(back.universe)) as never);
    expect(again.player.automation).toEqual({ laundry: true, eatLeftovers: true });
  });
});

describe('a checked bag weighed', () => {
  it('weighs its own kilograms and what’s in it, by the laundry tables’ grams', () => {
    const sim = life('lc-weigh');
    sim.advanceBy(26 * 3_600_000);
    const bag = suitcaseOf(sim.player)!;
    expect(bagKg(sim.player, bag)).toBeCloseTo(CARRY_ON_KG, 9);
    const jeans = garmentsOf(sim.player).find((g) => g.garment.slot === 'bottom' && g.at.kind === 'home')!;
    sim.must({ kind: 'items.move', payload: { itemId: jeans.id, to: { kind: 'inside', itemId: bag.id } } });
    expect(bagKg(sim.player, bag)).toBeCloseTo(CARRY_ON_KG + GARMENT_G.bottom / 1000, 9);
    expect(weightG(jeans)).toBe(625);
  });

  it('pays the departure country’s band past the allowance, and nothing over the most it takes goes', () => {
    const us = bagRuleFor('us-ny-newyork', 'us-ca-losangeles')!;
    expect([us.carrier, us.maxKg]).toEqual(['Delta', 45]);
    expect(overweight(us, 23)).toEqual({ fee: 0, over: false });
    expect(overweight(us, 30)).toEqual({ fee: 100, over: false });
    expect(overweight(us, 40)).toEqual({ fee: 200, over: false });
    expect(overweight(us, 46).over).toBe(true);
    expect(bagRuleFor('us-ny-newyork', 'uk-eng-london')!.maxKg).toBe(32);
    // Aer Lingus by the kilogram within Europe, by the band across the ocean.
    expect(overweight(bagRuleFor('ie-lei-dublin', 'uk-eng-london')!, 24.5)).toEqual({ fee: 50, over: false });
    expect(overweight(bagRuleFor('ie-lei-dublin', 'us-ny-newyork')!, 24.5)).toEqual({ fee: 75, over: false });
  });

  it('at the counter: the heaviest things out of a bag over the most, held at the airport', () => {
    const sim = life('lc-counter');
    sim.advanceBy(26 * 3_600_000);
    const bag = suitcaseOf(sim.player)!;
    bag.holdsL = 500;
    const home = homeKeyOf(sim.player.home)!;
    // Thirty-six kilograms of something into it, in four: one comes out, and what's left is over the allowance.
    for (let n = 0; n < 4; n += 1) addItem(sim, sim.player, { kind: `test:weight-${n}`, label: `Weight ${n}`, quantity: 1, condition: 1, at: { kind: 'inside', itemId: bag.id }, acquiredAt: sim.now, volumeL: 36 });
    expect(home).toBeDefined();
    bag.at = { kind: 'person' };
    const w = weighIn(sim, sim.player, 'us-ny-newyork', 'uk-eng-london', 1);
    expect(w.taken.length).toBe(1);
    expect(bagKg(sim.player, bag)).toBeLessThanOrEqual(32);
    expect(w.taken.every((i) => i.at.kind === 'held' && i.at.by === 'the airport')).toBe(true);
    expect(w.fees).toBeGreaterThan(0);
  });
});

describe('a flight with a heavy bag', () => {
  it('pays Delta’s band at the counter when it leaves', () => {
    const sim = life('lc-fly');
    sim.advanceBy(26 * 3_600_000);
    const bag = suitcaseOf(sim.player)!;
    bag.holdsL = 500;
    // Twenty-eight kilograms in it, with the bag's own: past 23, under 32.
    addItem(sim, sim.player, { kind: 'test:books', label: 'Books', quantity: 1, condition: 1, at: { kind: 'inside', itemId: bag.id }, acquiredAt: sim.now, volumeL: 100 });
    expect(bagKg(sim.player, bag)).toBeGreaterThan(23);
    expect(bagKg(sim.player, bag)).toBeLessThan(32);
    const p = zonedParts(sim.now + 14 * MS_DAY, sim.zone);
    const day = instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone);
    sim.must({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, nights: 2, bags: 1 } });
    sim.advanceTo(day + 2 * MS_DAY);
    const fee = Object.values(sim.universe.transactions).find((x) => x.memo === 'Overweight bags, Delta');
    expect(fee).toBeDefined();
    expect(sim.universe.notifications.some((n) => n.title === 'Overweight')).toBe(true);
  });
});
