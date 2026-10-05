/**
 * A friend from another town come to stay (`systems/houseguests.ts`, from
 * 2026-10-05): a spare bedroom made a guest room, ready with a bed in it; a
 * friend asked for some nights, who arrives, eats a day's groceries a day at
 * your cost, counts a visit's hours each day and a person's water; a stay
 * called off before it starts; a guest stood up who goes home.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, startOfDay } from '@/engine/core/time';
import type { Fixtures } from '@/engine/content/homes';
import { HALL, SOCIAL } from '@/engine/content/people';
import { letRefusal, moveIntoOwned, ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { roomList, spareRooms } from '@/engine/systems/rooms';
import { addItem, homeKeyOf } from '@/engine/systems/items';
import { contactsOf, type Contact } from '@/engine/systems/people';
import { STAY_NIGHTS, guestRooms, guestsOf, stayRefusal } from '@/engine/systems/houseguests';
import { foodOf } from '@/engine/systems/household';
import { livingOf } from '@/engine/systems/dwelling';
import { WATER_TARIFFS, litersUsed } from '@/engine/systems/water';

const NY = 'us-ny-newyork';
const bare: Fixtures = { bathtub: true, dishwasher: true, laundry: 'in-unit', cooling: 'central', outdoor: 'yard', gym: 'none' } as Fixtures;
function home(seed: string, beds = 3): Simulation {
  const sim = quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  const facts: HomeFacts = { type: 'house', address: 'Test Home', beds, baths: 2, size: 1_800, built: 2000, features: ['yard'], parts: {}, hoaUsd: 0, fixtures: bare, lot: 12_000 } as HomeFacts;
  moveIntoOwned(sim, sim.player, ownBuilt(sim, sim.player, { cityId: NY, facts, price: 900_000_00, closing: 0 }));
  sim.player.currentLocationId = NY;
  return sim;
}
const friend = (sim: Simulation, over: Partial<Contact> = {}): Contact => {
  const c: Contact = { id: `c-${contactsOf(sim.player).length}`, name: 'Ana Ruiz', cityId: 'us-ca-losangeles', born: sim.now - 30 * 365 * MS_DAY, met: { at: sim.now - 365 * MS_DAY, how: 'school' }, hours: HALL.friend, spends: 'mid', memory: [], ...over } as Contact;
  contactsOf(sim.player).push(c);
  return c;
};
const bedIn = (sim: Simulation, roomId: string) => addItem(sim, sim.player, { kind: 'furniture:bed', label: 'A Bed', quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, room: roomId }, acquiredAt: sim.now, bed: { country: 'us', size: 'twin' } } as never);
/** Two in the afternoon, some days on, where they live. */
const afternoon = (sim: Simulation, days: number) => startOfDay(sim.now, 'America/New_York') + days * MS_DAY + 14 * MS_HOUR;

describe('a guest room', () => {
  it('is a spare bedroom made one, ready only with a bed in it, kept from a lodger while another is free', () => {
    const sim = home('guest-room');
    const spare = roomList(sim, sim.player)[1]!;
    sim.must({ kind: 'home.room_use', payload: { roomId: spare.id, use: 'guest' } });
    expect(roomList(sim, sim.player)[1]!.use).toBe('guest');
    expect(guestRooms(sim, sim.player)).toHaveLength(0);
    bedIn(sim, spare.id);
    expect(guestRooms(sim, sim.player).map((r) => r.id)).toEqual([spare.id]);
    // A lodger takes the other spare, and the guest room stays one.
    sim.player.homes![0]!.lodgers = [{ id: 'l1' } as never];
    expect(roomList(sim, sim.player).map((r) => r.use).slice(0, 3)).toEqual(['yours', 'guest', 'lodger']);
    expect(spareRooms(sim, sim.player).map((r) => r.id)).toEqual([spare.id]);
  });
});

describe('a friend come to stay', () => {
  it('is asked only from another town, known well enough, into a ready guest room, for one to fourteen nights', () => {
    const sim = home('guest-ask');
    const c = friend(sim);
    const at = afternoon(sim, 3);
    expect(stayRefusal(sim, sim.player, c, at, 2)).toBe('You need a guest room with a bed in it.');
    const spare = roomList(sim, sim.player)[1]!;
    sim.must({ kind: 'home.room_use', payload: { roomId: spare.id, use: 'guest' } });
    bedIn(sim, spare.id);
    expect(stayRefusal(sim, sim.player, c, at, 2)).toBeUndefined();
    expect(stayRefusal(sim, sim.player, c, at, 0)).toBe(`From one night to ${STAY_NIGHTS}.`);
    expect(stayRefusal(sim, sim.player, c, at, STAY_NIGHTS + 1)).toBe(`From one night to ${STAY_NIGHTS}.`);
    expect(stayRefusal(sim, sim.player, c, at - 10 * MS_HOUR, 2)).toBe('That’s too early for Ana to arrive.');
    expect(stayRefusal(sim, sim.player, { ...c, cityId: NY }, at, 2)).toMatch(/ask them over instead/);
    expect(stayRefusal(sim, sim.player, { ...c, hours: HALL.friend - 1 }, at, 2)).toBe('Ana doesn’t know you well enough yet to come and stay.');
    expect(stayRefusal(sim, sim.player, { ...c, rival: true }, at, 2)).toBe('Ana would rather not.');
    // One guest a room: a second friend then finds it taken.
    sim.must({ kind: 'social.ask_to_stay', payload: { contactId: c.id, from: at, nights: 3 } });
    expect(stayRefusal(sim, sim.player, friend(sim, { name: 'Ben Ode' }), at + MS_DAY, 1)).toBe('Your guest rooms are taken then.');
    // Nor is the room given back while they're coming.
    expect(sim.execute({ kind: 'home.room_use', payload: { roomId: spare.id, use: 'spare' } }).error).toBe('A guest is staying in it, or coming to.');
  });

  it('arrives, and each day eats a day’s groceries at your cost, counts a visit’s hours and a person’s water, then goes home', () => {
    const sim = home('guest-stay');
    const spare = roomList(sim, sim.player)[1]!;
    sim.must({ kind: 'home.room_use', payload: { roomId: spare.id, use: 'guest' } });
    bedIn(sim, spare.id);
    const c = friend(sim);
    const at = afternoon(sim, 2);
    sim.must({ kind: 'social.ask_to_stay', payload: { contactId: c.id, from: at, nights: 3 } });
    expect(guestsOf(sim.player).map((g) => g.id)).toEqual([c.id]);
    const hours = c.hours;
    sim.advanceTo(at + SOCIAL.visitMinutes * 60_000 + 1);
    sim.player.currentLocationId = NY;
    expect(c.hours).toBeCloseTo(hours + SOCIAL.visitMinutes / 60, 9);
    const l = livingOf(sim.player);
    sim.advanceTo(at + MS_DAY + 1);
    expect(l.guestDays).toBe(1);
    const water = litersUsed(sim.player, NY, 1);
    l.guestDays = 0;
    expect(water - litersUsed(sim.player, NY, 1)).toBeCloseTo(WATER_TARIFFS[NY]!.perPersonLiters, 6);
    l.guestDays = 1;
    const food = sim.universe.transactions.find((t) => t.memo === 'Food for Ana, staying')!;
    expect(Math.max(...food.postings.map((p) => Math.abs(p.amount)))).toBe(foodOf(sim, sim.player));
    expect(c.hours).toBeCloseTo(hours + 2 * SOCIAL.visitMinutes / 60, 9);
    sim.advanceTo(at + 3 * MS_DAY + 1);
    expect(c.stay).toBeUndefined();
    expect(c.memory[0]!.what).toBe('Stayed 3 nights, and went home');
    expect(c.hours).toBeCloseTo(hours + 4 * SOCIAL.visitMinutes / 60, 9);
  });

  it('is called off before arriving, not after, and stood up goes home', () => {
    const sim = home('guest-off');
    const spare = roomList(sim, sim.player)[1]!;
    sim.must({ kind: 'home.room_use', payload: { roomId: spare.id, use: 'guest' } });
    bedIn(sim, spare.id);
    const c = friend(sim);
    const at = afternoon(sim, 2);
    sim.must({ kind: 'social.ask_to_stay', payload: { contactId: c.id, from: at, nights: 2 } });
    sim.must({ kind: 'social.cancel_stay', payload: { contactId: c.id } });
    expect(c.stay).toBeUndefined();
    expect(sim.universe.scheduled.some((x) => x.status === 'pending' && x.payload.contactId === c.id)).toBe(false);
    // Asked again, and nobody home when they come.
    sim.must({ kind: 'social.ask_to_stay', payload: { contactId: c.id, from: at, nights: 2 } });
    sim.player.currentLocationId = 'us-ca-losangeles';
    sim.advanceTo(at + 1);
    expect(c.stay).toBeUndefined();
    expect(c.stoodUp).toBe(at);
    expect(sim.execute({ kind: 'social.cancel_stay', payload: { contactId: c.id } }).error).toBe('Nobody’s coming to stay.');
  });
});

describe('a stay refused or changed', () => {
  const ready = (seed: string) => {
    const sim = home(seed);
    const spare = roomList(sim, sim.player)[1]!;
    sim.must({ kind: 'home.room_use', payload: { roomId: spare.id, use: 'guest' } });
    return { sim, spare };
  };

  it('isn’t made ready by a piece that isn’t a bed', () => {
    const { sim, spare } = ready('guest-nobed');
    addItem(sim, sim.player, { kind: 'furniture:sofa', label: 'A Sofa', quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, room: spare.id }, acquiredAt: sim.now } as never);
    expect(guestRooms(sim, sim.player)).toHaveLength(0);
  });

  it('is refused a week after being stood up, while coming already, and over something booked when they arrive', () => {
    const { sim, spare } = ready('guest-refuse');
    bedIn(sim, spare.id);
    const at = afternoon(sim, 3);
    expect(stayRefusal(sim, sim.player, friend(sim, { stoodUp: at - 6 * MS_DAY }), at, 1)).toBe('You didn’t come last time, and Ana isn’t making plans yet.');
    expect(stayRefusal(sim, sim.player, friend(sim, { stay: { from: at + 20 * MS_DAY, nights: 1, roomId: 'bedroom-3' } }), at, 1)).toMatch(/^Ana is coming to stay already/);
    sim.universe.scheduled.push({ id: 'busy', saveId: sim.universe.meta.id, at: at - 30 * 60_000, kind: 'test.busy', payload: {}, status: 'pending', createdAt: sim.now, priority: 0, label: 'A Shift', category: 'work', requiresPlayer: true, durationMinutes: 60 });
    expect(stayRefusal(sim, sim.player, friend(sim), at, 1)).toBe('You have A Shift when Ana arrives.');
  });

  it('counts no hours on a day you’re away, and can’t be called off once they’re here', () => {
    const { sim, spare } = ready('guest-away');
    bedIn(sim, spare.id);
    const c = friend(sim);
    const at = afternoon(sim, 2);
    sim.must({ kind: 'social.ask_to_stay', payload: { contactId: c.id, from: at, nights: 2 } });
    sim.advanceTo(at + SOCIAL.visitMinutes * 60_000 + 1);
    expect(sim.execute({ kind: 'social.cancel_stay', payload: { contactId: c.id } }).error).toBe('Ana is here already.');
    const hours = c.hours;
    sim.player.currentLocationId = 'us-ca-losangeles';
    sim.advanceTo(at + MS_DAY + 1);
    expect(c.hours).toBe(hours);
  });

  it('isn’t a guest room made from a storage room whose things the closets can’t hold without it', () => {
    const { sim, spare } = ready('guest-storage');
    sim.must({ kind: 'home.room_use', payload: { roomId: spare.id, use: 'storage' } });
    addItem(sim, sim.player, { kind: 'test:boxes', label: 'Boxes', quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'storage' }, acquiredAt: sim.now, volumeL: 1_000_000 } as never);
    expect(sim.execute({ kind: 'home.room_use', payload: { roomId: spare.id, use: 'guest' } }).error).toMatch(/^What’s stored wouldn’t fit/);
  });
});

describe('a backyard cottage', () => {
  it('is a place for a guest while it isn’t let, with a bed put in it, and isn’t let while one is coming', () => {
    const sim = home('guest-cottage');
    const owned = sim.player.homes![0]!;
    owned.facts.features = [...owned.facts.features, 'adu'];
    const cottage = roomList(sim, sim.player).find((r) => r.id === 'cottage')!;
    expect(cottage).toMatchObject({ kind: 'cottage', use: 'guest', m2: 37 });
    expect(guestRooms(sim, sim.player)).toHaveLength(0);
    bedIn(sim, 'cottage');
    expect(guestRooms(sim, sim.player).map((r) => r.id)).toEqual(['cottage']);
    const c = friend(sim);
    const r = sim.must<{ roomId: string }>({ kind: 'social.ask_to_stay', payload: { contactId: c.id, from: afternoon(sim, 3), nights: 2 } });
    expect(r.roomId).toBe('cottage');
    expect(letRefusal(sim, sim.player, owned, 'adu', 1_000_00)).toBe('A guest is staying in the cottage, or coming to.');
    // Let, it's the tenant's, not a guest's.
    sim.must({ kind: 'social.cancel_stay', payload: { contactId: c.id } });
    owned.tenancies = [{ unit: 'adu', rent: 1_000_00, status: 'let', since: sim.now }];
    expect(roomList(sim, sim.player).some((x) => x.id === 'cottage')).toBe(false);
  });
});
