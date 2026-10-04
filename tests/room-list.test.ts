/**
 * A home room by room (`roomList` in `systems/rooms.ts`, from 2026-10-04):
 * each bedroom one use, the rooms given over and a lodger never sharing one;
 * a spare room used for storage adding to the closets; and furniture put in
 * a room by what the room is for and its own floor.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Feature, Fixtures } from '@/engine/content/homes';
import { moveIntoOwned, ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { BATHROOM_M2, NDSS, SINGLE_M2, STORAGE_ROOM_SHARE, roomList, roomsOf } from '@/engine/systems/rooms';
import { addItem, homeKeyOf } from '@/engine/systems/items';
import { lodgerRefusal } from '@/engine/systems/lodgers';
import { PROJECTS } from '@/engine/content/homes';
import { projectRefusal } from '@/engine/systems/homes';

const bare: Fixtures = { bathtub: true, dishwasher: true, laundry: 'in-unit', cooling: 'central', outdoor: 'yard', gym: 'none' } as Fixtures;
const NY = 'us-ny-newyork';
const home = (features: Feature[], seed: string, beds = 3) => {
  const sim = quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  const facts: HomeFacts = { type: 'house', address: 'Test Home', beds, baths: 2, size: 1_800, built: 2000, features: ['yard', ...features], parts: {}, hoaUsd: 0, fixtures: bare, lot: 12_000 } as HomeFacts;
  moveIntoOwned(sim, sim.player, ownBuilt(sim, sim.player, { cityId: NY, facts, price: 900_000_00, closing: 0 }));
  sim.player.currentLocationId = NY;
  return sim;
};

describe('a home room by room', () => {
  it('has its bedrooms, bathrooms, living room and kitchen, sized to its floor', () => {
    const sim = home([], 'rooms-plain');
    const rooms = roomList(sim, sim.player);
    expect(rooms.map((r) => r.id)).toEqual(['bedroom-1', 'bedroom-2', 'bedroom-3', 'bathroom-1', 'bathroom-2', 'living', 'kitchen']);
    expect(rooms.map((r) => r.use).slice(0, 3)).toEqual(['yours', 'spare', 'spare']);
    const total = rooms.reduce((n, r) => n + r.m2, 0);
    expect(total).toBeCloseTo(1_800 * 0.092903, 6);
    // The main bedroom a double's to a single's, scaled alike.
    expect(rooms[0]!.m2 / rooms[1]!.m2).toBeCloseTo(NDSS.doubleM2 / SINGLE_M2, 9);
    expect(rooms[3]!.fixtures).toEqual(['A Bathtub']);
    expect(rooms.find((r) => r.id === 'kitchen')!.fixtures).toEqual(['A Dishwasher', 'A Washer And Dryer']);
    expect(BATHROOM_M2).toBe(4);
  });

  it('gives a spare bedroom to each room given over, and a lodger only one still spare', () => {
    const sim = home(['library'], 'rooms-library', 2);
    expect(roomList(sim, sim.player)[1]!.use).toBe('library');
    expect(lodgerRefusal(sim, sim.player, sim.player.homes![0]!)).toBe('There’s no spare bedroom.');
    const roomy = home(['library'], 'rooms-roomy', 3);
    expect(lodgerRefusal(roomy, roomy.player, roomy.player.homes![0]!)).toBeUndefined();
  });

  it('uses a spare room for storage, adding half its volume to the closets, and back to spare while what’s stored fits', () => {
    const sim = home([], 'rooms-storage');
    const before = roomsOf(sim, sim.player)!.closetL;
    const spare = roomList(sim, sim.player)[1]!;
    sim.must({ kind: 'home.room_use', payload: { roomId: spare.id, use: 'storage' } });
    expect(roomsOf(sim, sim.player)!.closetL - before).toBeCloseTo(spare.m2 * NDSS.ceilingM * STORAGE_ROOM_SHARE * 1_000, 6);
    // Filled past what the closets hold without it: it can't be made spare again.
    const h = homeKeyOf(sim.player.home)!;
    addItem(sim, sim.player, { kind: 'test:boxes', label: 'Boxes', quantity: 1, condition: 1, at: { kind: 'home', home: h, spot: 'storage' }, acquiredAt: sim.now, volumeL: before + 10 });
    expect(sim.execute({ kind: 'home.room_use', payload: { roomId: spare.id, use: 'spare' } }).error).toMatch(/^What’s stored wouldn’t fit/);
    expect(sim.execute({ kind: 'home.room_use', payload: { roomId: 'kitchen', use: 'storage' } }).error).toBe('That isn’t a spare bedroom.');
  });
});

describe('furniture put in a room', () => {
  it('a bed in a bedroom, never the kitchen; and only in the floor the room has', () => {
    const sim = home([], 'rooms-place');
    const h = homeKeyOf(sim.player.home)!;
    const bed = addItem(sim, sim.player, { kind: 'furniture:bed', label: 'A Bed', quantity: 1, condition: 1, at: { kind: 'home', home: h, spot: 'floor' }, acquiredAt: sim.now, bulky: true });
    expect(sim.execute({ kind: 'items.move', payload: { itemId: bed.id, to: { kind: 'home', home: h, spot: 'floor', room: 'kitchen' } } }).error).toBe('A bed goes in a bedroom.');
    sim.must({ kind: 'items.move', payload: { itemId: bed.id, to: { kind: 'home', home: h, spot: 'floor', room: 'bedroom-2' } } });
    expect(bed.at).toMatchObject({ room: 'bedroom-2' });
    const crate = addItem(sim, sim.player, { kind: 'test:crate', label: 'Crate', quantity: 1, condition: 1, at: { kind: 'home', home: h, spot: 'floor' }, acquiredAt: sim.now, volumeL: 5 });
    expect(sim.execute({ kind: 'items.move', payload: { itemId: crate.id, to: { kind: 'home', home: h, spot: 'floor', room: 'bathroom-1' } } }).error).toBe('Furniture doesn’t go in a bathroom.');
    expect(sim.execute({ kind: 'items.move', payload: { itemId: crate.id, to: { kind: 'home', home: h, spot: 'floor', room: 'attic' } } }).error).toBe('There’s no such room here.');
  });

  it('only in the floor the room has to furnish', () => {
    const sim = home([], 'rooms-full');
    const h = homeKeyOf(sim.player.home)!;
    let refused: string | undefined;
    for (let n = 0; n < 10 && !refused; n += 1) {
      const sofa = addItem(sim, sim.player, { kind: 'furniture:sofa', label: `Sofa ${n}`, quantity: 1, condition: 1, at: { kind: 'home', home: h, spot: 'floor' }, acquiredAt: sim.now, bulky: true });
      refused = sim.execute({ kind: 'items.move', payload: { itemId: sofa.id, to: { kind: 'home', home: h, spot: 'floor', room: 'bedroom-3' } } }).error;
    }
    expect(refused).toMatch(/^It won’t fit in Bedroom 3/);
  });

  it('works giving over a spare bedroom count a lodger’s room as taken', () => {
    const sim = home([], 'rooms-lodger', 2);
    const owned = sim.player.homes![0]!;
    owned.lodgers = [{ id: 'l1', since: sim.now } as never];
    const library = PROJECTS.find((p) => p.id === 'library')!;
    expect(projectRefusal(sim, sim.player, owned, library)).toBe('It has no spare bedroom.');
  });
});
