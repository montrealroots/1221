/**
 * A guest room (`systems/rooms.ts`, from 2026-10-04): a spare bedroom kept
 * for guests, a bed delivered for it at the place's usual bed's price where
 * none stands there, and a friend from another town asked home coming to
 * stay the night in it, where without it they'd say they live elsewhere. One
 * room sleeps one friend, so a gathering of several isn't put up.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import type { Fixtures } from '@/engine/content/homes';
import { HALL } from '@/engine/content/people';
import { CITIES } from '@/engine/content/geography';
import { RESTAURANTS } from '@/engine/content/restaurants';
import { moveIntoOwned, ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { GUEST_BED, guestBedCost, guestRoom, roomList, spareRooms } from '@/engine/systems/rooms';
import { owns, pieceCost } from '@/engine/systems/furniture';
import { itemsOf } from '@/engine/systems/items';
import { inTheBank } from '@/engine/systems/household';
import { declines, metAtWork, type Contact, type Invitation } from '@/engine/systems/people';

const NY = 'us-ny-newyork';
const fixtures = { bathtub: true, dishwasher: true, laundry: 'in-unit', cooling: 'central', outdoor: 'yard', gym: 'none' } as Fixtures;
/** A three-bedroom house of their own in New York, lived in: 1,800 square feet unless said. */
const home = (seed: string, size = 1_800): Simulation => {
  const sim = quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  const facts = { type: 'house', address: 'Test Home', beds: 3, baths: 2, size, built: 2000, features: ['yard'], parts: {}, hoaUsd: 0, fixtures, lot: 12_000 } as HomeFacts;
  moveIntoOwned(sim, sim.player, ownBuilt(sim, sim.player, { cityId: NY, facts, price: 900_000_00, closing: 0 }));
  sim.player.currentLocationId = NY;
  return sim;
};
const use = (sim: Simulation, roomId: string) => roomList(sim, sim.player).find((r) => r.id === roomId)!.use;
const ZONE = CITIES.require(NY).timeZone;
const evening = (sim: Simulation, days: number) => { const p = zonedParts(sim.now + days * MS_DAY, ZONE); return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 19, minute: 0 }, ZONE); };
/** A friend from a job in Los Angeles, known well enough to come to your home. */
const farFriend = (sim: Simulation): Contact => { const c = metAtWork(sim, sim.player, 'us-ca-losangeles', 'b-far', 'A Job'); c.hours = HALL.friend; return c; };

describe('making a room up for guests', () => {
  it('delivers the place’s usual bed into it at the bed’s price, and needs none once one stands there', () => {
    const sim = home('guest-make');
    const cost = pieceCost(sim, NY, 'bed')!.amount;
    expect(guestBedCost(sim, sim.player, 'bedroom-2')).toBe(cost);
    const before = inTheBank(sim, sim.player);
    const r = sim.must<{ use: string; paid: number }>({ kind: 'home.room_use', payload: { roomId: 'bedroom-2', use: 'guest' } });
    expect(r.paid).toBe(cost);
    expect(before - inTheBank(sim, sim.player)).toBe(cost);
    expect(itemsOf(sim.player).find((i) => i.kind === GUEST_BED)?.at).toMatchObject({ kind: 'home', spot: 'floor', room: 'bedroom-2' });
    expect(use(sim, 'bedroom-2')).toBe('guest');
    expect(guestRoom(sim, sim.player)?.id).toBe('bedroom-2');
    // The guest's bed isn't the one slept in.
    expect(owns(sim.player, 'bed')).toBe(false);
    // Kept spare, it isn't made up; for guests again, its bed is there.
    sim.must({ kind: 'home.room_use', payload: { roomId: 'bedroom-2', use: 'spare' } });
    expect(guestRoom(sim, sim.player)).toBeUndefined();
    expect(sim.must<{ paid: number }>({ kind: 'home.room_use', payload: { roomId: 'bedroom-2', use: 'guest' } }).paid).toBe(0);
  });

  it('leaves the room as it was where the bank can’t pay for its bed', () => {
    const sim = home('guest-broke');
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0) a.balance = 0;
    expect(sim.execute({ kind: 'home.room_use', payload: { roomId: 'bedroom-2', use: 'guest' } }).error).toBe('The bank couldn’t pay for a bed for it.');
    expect(use(sim, 'bedroom-2')).toBe('spare');
    expect(itemsOf(sim.player).some((i) => i.kind === GUEST_BED)).toBe(false);
  });

  it('buys no bed that won’t fit the room’s floor, and leaves the room and the bank as they were', () => {
    // 400 square feet in three bedrooms: the second's furnishable floor is under a queen's 3.1 m².
    const sim = home('guest-tight', 400);
    const before = inTheBank(sim, sim.player);
    expect(sim.execute({ kind: 'home.room_use', payload: { roomId: 'bedroom-2', use: 'guest' } }).error).toMatch(/won’t fit in Bedroom 2/);
    expect(use(sim, 'bedroom-2')).toBe('spare');
    expect(inTheBank(sim, sim.player)).toBe(before);
    expect(itemsOf(sim.player).some((i) => i.kind === GUEST_BED)).toBe(false);
  });

  it('is a room a lodger or a room given over takes first, as one kept for storage is', () => {
    const sim = home('guest-lodger');
    sim.must({ kind: 'home.room_use', payload: { roomId: 'bedroom-2', use: 'guest' } });
    expect(spareRooms(sim, sim.player).map((r) => r.id)).toContain('bedroom-2');
  });
});

describe('a friend from another town', () => {
  it('comes to stay where a guest room is made up, and says they live elsewhere without it or its bed', () => {
    const sim = home('guest-stay');
    const c = farFriend(sim);
    const first = c.name.split(' ')[0];
    const visit: Invitation = { contactId: c.id, at: evening(sim, 3), what: 'visit' };
    expect(declines(sim.player, c, visit, sim)).toBe(`${first} lives in Los Angeles.`);
    sim.must({ kind: 'home.room_use', payload: { roomId: 'bedroom-2', use: 'guest' } });
    expect(declines(sim.player, c, visit, sim)).toBeUndefined();
    expect(sim.must<{ accepted: boolean }>({ kind: 'social.invite', payload: { ...visit } }).accepted).toBe(true);
    // A meal out is in a restaurant, not at home: the guest room changes nothing there.
    const r = RESTAURANTS.find((x) => x.cityId === NY && x.tier === 'casual' && x.menu.some((m) => m.price !== null))!;
    expect(declines(sim.player, c, { contactId: c.id, at: visit.at, what: 'meal', restaurantId: r.id, item: r.menu.find((m) => m.price !== null)!.item }, sim)).toBe(`${first} lives in Los Angeles.`);
    // A gathering of several isn't put up: hosting asks without the simulation.
    expect(declines(sim.player, c, visit)).toBe(`${first} lives in Los Angeles.`);
    // Its bed moved to another room, it isn't made up.
    const bed = itemsOf(sim.player).find((i) => i.kind === GUEST_BED)!;
    bed.at = { kind: 'home', home: bed.at.kind === 'home' ? bed.at.home : '', spot: 'floor', room: 'bedroom-3' };
    expect(declines(sim.player, c, { ...visit, at: evening(sim, 5) }, sim)).toBe(`${first} lives in Los Angeles.`);
  });
});
