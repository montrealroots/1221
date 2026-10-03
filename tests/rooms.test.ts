/**
 * A home's rooms (`systems/rooms.ts`, from 2026-10-03): the floor that can
 * be furnished, built-in storage by England's space standard, and a
 * flat-share's bathroom.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, startOfDay } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { FURNISHABLE, KIVIK_M2, NDSS, TABLE_SET_M2, bathroomWait, closetUsedL, fitRefusal, footprintOf, furnishedM2, overflow, roomsOf } from '@/engine/systems/rooms';
import { addItem, homeKeyOf, itemsOf, moveRefusal } from '@/engine/systems/items';
import { pieceById, pieceRefusal } from '@/engine/systems/furnishings';
import { minutesFor } from '@/engine/systems/life';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { furnishRefusal } from '@/engine/systems/furniture';
import { purchaseItems } from '@/engine/systems/clothing';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';

const tee = CLOTHING_PRODUCTS.find((p) => p.id === 'us-uniqlo-supima-cotton-t-shirt')!;

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const unit = { type: 'condo' as const, size: 900, beds: 3, shared: true, fixtures: { bathtub: false, dishwasher: false, laundry: 'none' as const, cooling: 'none' as const, outdoor: 'none' as const, gym: 'none' as const } };
const flatShare = (sim: Simulation) => { sim.player.home = { ...sim.player.home!, kind: 'shared', unit }; };
const ownFlat = (sim: Simulation, size = 650, beds = 1) => { sim.player.home = { ...sim.player.home!, kind: 'own', unit: { ...unit, size, beds, shared: false } }; };
const clearFloor = (sim: Simulation) => { const home = homeKeyOf(sim.player.home); sim.player.items = itemsOf(sim.player).filter((i) => !(i.at.kind === 'home' && i.at.home === home && i.bulky)); };

describe('the rooms', () => {
  it('are a let room’s 11.5 m² in a flat-share, or the home’s own size; built-in storage by bedrooms', () => {
    const sim = life('us-ny-newyork', 'rooms-of');
    flatShare(sim);
    expect(roomsOf(sim, sim.player)).toEqual({ bedrooms: 1, floorM2: 11.5, closetL: 1.0 * 2.3 * 1_000, flatmates: 2 });
    ownFlat(sim, 650, 2);
    const r = roomsOf(sim, sim.player)!;
    expect(r.floorM2).toBeCloseTo(650 * 0.092903, 6);
    expect(r.closetL).toBeCloseTo(NDSS.storageM2[2]! * 2.3 * 1_000, 6);
    expect(r.flatmates).toBe(0);
  });

  it('take only so much furniture: a sofa and a bed fit a let room, a dining set beside them doesn’t', () => {
    const sim = life('us-ny-newyork', 'rooms-fit');
    flatShare(sim);
    clearFloor(sim);
    const home = homeKeyOf(sim.player.home)!;
    addItem(sim, sim.player, { kind: 'furniture:bed', label: 'Bed', quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'floor' }, acquiredAt: sim.now, bulky: true, bed: { country: 'us', size: 'queen' } });
    addItem(sim, sim.player, { kind: 'furniture:sofa', label: 'Sofa', quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'floor' }, acquiredAt: sim.now, bulky: true });
    const bed = (60 * 2.54 * 80 * 2.54) / 10_000;
    expect(furnishedM2(sim.player)).toBeCloseTo(bed + KIVIK_M2, 6);
    const table = pieceById('us-sandsberg-29420393')!;
    expect(pieceRefusal(sim.player, table.id, 1, sim)).toMatch(/^It won’t fit: /);
    // A home of their own has the room.
    ownFlat(sim, 650);
    expect(pieceRefusal(sim.player, table.id, 1, sim)).toBeUndefined();
    expect(fitRefusal(sim, sim.player, 650 * 0.092903 * FURNISHABLE + 0.1)).toMatch(/^It won’t fit/);
  });

  it('a furnished home’s own bed, sofa and table for four take their floor; a let room’s only its bed', () => {
    const sim = life('us-ny-newyork', 'rooms-furnished');
    const bed = (60 * 2.54 * 80 * 2.54) / 10_000;
    ownFlat(sim);
    clearFloor(sim);
    expect(furnishedM2(sim.player)).toBeCloseTo(bed + KIVIK_M2 + TABLE_SET_M2, 6);
    // A sofa of their own stands in for the one it came with.
    addItem(sim, sim.player, { kind: 'furniture:sofa', label: 'Sofa', quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'floor' }, acquiredAt: sim.now, bulky: true });
    expect(furnishedM2(sim.player)).toBeCloseTo(bed + KIVIK_M2 + TABLE_SET_M2, 6);
    // A home bought empty has only what's been put in it.
    const facts: HomeFacts = { type: 'house', address: 'Test House', beds: 3, baths: 2, size: 1_200, built: 2000, features: [], parts: {}, hoaUsd: 0 };
    const owned = ownBuilt(sim, sim.player, { cityId: 'us-ny-newyork', facts, price: 600_000_00, closing: 0 });
    owned.bare = true;
    sim.player.home = { kind: 'owned', cityId: 'us-ny-newyork', homeId: owned.id, since: sim.now };
    expect(furnishedM2(sim.player)).toBe(0);
    flatShare(sim);
    clearFloor(sim);
    expect(furnishedM2(sim.player)).toBeCloseTo(bed, 6);
  });

  it('a bulky piece brought out of storage needs the floor for it', () => {
    const sim = life('us-ny-newyork', 'rooms-storage');
    flatShare(sim);
    clearFloor(sim);
    const home = homeKeyOf(sim.player.home)!;
    const big = addItem(sim, sim.player, { kind: 'ikea:us-brimnes-00576139', label: 'Wardrobe', quantity: 12, condition: 1, at: { kind: 'home', home, spot: 'storage' }, acquiredAt: sim.now, bulky: true });
    expect(footprintOf(big)).toBeGreaterThan(11.5 * FURNISHABLE);
    expect(moveRefusal(sim, sim.player, big, { kind: 'home', home, spot: 'floor' })).toMatch(/^It won’t fit/);
  });
});

describe('a bed or a sofa', () => {
  it('isn’t furnished where it won’t fit', () => {
    const sim = life('us-ny-newyork', 'rooms-furnish');
    flatShare(sim);
    clearFloor(sim);
    const home = homeKeyOf(sim.player.home)!;
    addItem(sim, sim.player, { kind: 'ikea:us-brimnes-00576139', label: 'Wardrobe', quantity: 8, condition: 1, at: { kind: 'home', home, spot: 'floor' }, acquiredAt: sim.now, bulky: true });
    expect(furnishRefusal(sim, sim.player, 'sofa')).toMatch(/^It won’t fit: /);
  });
});

describe('built-in storage', () => {
  it('refuses what won’t go in, and what’s bought for it goes in the rooms when it’s full', () => {
    const sim = life('us-ny-newyork', 'rooms-closet');
    flatShare(sim);
    const home = homeKeyOf(sim.player.home)!;
    const left = roomsOf(sim, sim.player)!.closetL - closetUsedL(sim.player);
    const box = addItem(sim, sim.player, { kind: 'custom', label: 'A Box', quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'floor' }, acquiredAt: sim.now, volumeL: left + 1 });
    expect(moveRefusal(sim, sim.player, box, { kind: 'home', home, spot: 'wardrobe' })).toMatch(/^The built-in storage has \d+ liters left; the A Box needs/);
    box.volumeL = left - 0.5;
    expect(moveRefusal(sim, sim.player, box, { kind: 'home', home, spot: 'wardrobe' })).toBeUndefined();
    box.at = { kind: 'home', home, spot: 'wardrobe' };
    const shirt = overflow(sim, sim.player, addItem(sim, sim.player, { kind: 'custom', label: 'A Shirt', quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'wardrobe' }, acquiredAt: sim.now, volumeL: 1 }));
    expect(shirt.at).toEqual({ kind: 'home', home, spot: 'floor' });
    // Clothes bought then go in the rooms.
    sim.must({ kind: 'clothes.buy', payload: { productId: tee.id, how: 'store', size: 'M', color: tee.colors[0], quantity: 1 } });
    const bought = purchaseItems(sim.player, sim.player.clothesBought!.at(-1)!.id)[0]!;
    expect(bought.at).toEqual({ kind: 'home', home, spot: 'floor' });
  });
});

describe('a flat-share’s bathroom', () => {
  it('is busy some mornings for a flatmate’s 7.8 minutes, and never at noon or in a home of your own', () => {
    const sim = life('us-ny-newyork', 'rooms-bath');
    flatShare(sim);
    const zone = CITIES.require(sim.player.home!.cityId).timeZone;
    const day = startOfDay(sim.now, zone);
    let waited = 0;
    for (let m = 0; m < 120; m += 5) waited = Math.max(waited, bathroomWait(sim, sim.player, day + 6.5 * MS_HOUR + m * 60_000, 20));
    expect(waited).toBeGreaterThan(0);
    expect(bathroomWait(sim, sim.player, day + 12 * MS_HOUR, 20)).toBe(0);
    ownFlat(sim);
    for (let m = 0; m < 120; m += 5) expect(bathroomWait(sim, sim.player, day + 6.5 * MS_HOUR + m * 60_000, 20)).toBe(0);
  });

  it('a shower then takes the wait as well', () => {
    const sim = life('us-ny-newyork', 'rooms-shower');
    flatShare(sim);
    const zone = CITIES.require(sim.player.home!.cityId).timeZone;
    // Tomorrow from 6:30, five minutes at a time to a moment a flatmate is in there.
    sim.advanceTo(startOfDay(sim.now, zone) + 24 * MS_HOUR + 6.5 * MS_HOUR);
    for (let m = 0; m < 24 && bathroomWait(sim, sim.player, sim.now, 20) === 0; m += 1) sim.advanceBy(5 * 60_000);
    const wait = bathroomWait(sim, sim.player, sim.now, 20);
    expect(wait).toBeGreaterThan(0);
    expect(minutesFor(sim, 'wash')).toBe(20 + wait);
  });
});
