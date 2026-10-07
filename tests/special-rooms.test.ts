/**
 * A home's special rooms put to their use (`content/specialrooms.ts`, from
 * 2026-10-04): a sauna taken, unwinding for its minutes and its heater on the
 * electricity bill; a walk-in closet's hanging; a library's thousand books;
 * a film night in the theater at its four seats; and a voice audition on
 * tape recorded in a soundproofed room at home, or at a booth at its rate.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Feature, Fixtures } from '@/engine/content/homes';
import { LIBRARY_BOOKS, SAUNA, THEATER, VO_BOOTHS, WALK_IN_L } from '@/engine/content/specialrooms';
import { moveIntoOwned, ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { lookAfterRefusal } from '@/engine/systems/life';
import { livingOf } from '@/engine/systems/dwelling';
import { electricityAdjustment } from '@/engine/systems/electricity';
import { roomsOf } from '@/engine/systems/rooms';
import { addItem, homeKeyOf } from '@/engine/systems/items';
import { hostRefusal } from '@/engine/systems/hosting';
import { contactsOf, newContact } from '@/engine/systems/people';
import { boothFee, quietAtHome } from '@/engine/systems/career';
import { inSaveMoney } from '@/engine/systems/banking';
import { SEAT_KIND, kitTheater, theaterAt } from '@/engine/systems/theater';
import { lovedIn } from '@/engine/systems/enjoyment';
import { watchRefusal } from '@/engine/systems/homelife';

const bare: Fixtures = { bathtub: false, dishwasher: false, laundry: 'none', cooling: 'none', outdoor: 'none', gym: 'none' };
const home = (features: Feature[], seed: string, city = 'us-ny-newyork') => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  const facts: HomeFacts = { type: 'house', address: 'Test Home', beds: 3, baths: 2, size: 1_800, built: 2000, features: ['yard', ...features], parts: {}, hoaUsd: 0, fixtures: bare, lot: 12_000 } as HomeFacts;
  moveIntoOwned(sim, sim.player, ownBuilt(sim, sim.player, { cityId: city, facts, price: 900_000_00, closing: 0 }));
  sim.player.currentLocationId = city;
  return sim;
};

describe('a sauna', () => {
  it('is taken where there is one: its minutes, and its heater’s kilowatt-hours on the month', () => {
    const none = home([], 'sauna-none');
    expect(lookAfterRefusal(none, 'sauna')).toBe('You have no sauna at home.');
    const sim = home(['sauna'], 'sauna-own');
    sim.player.wellbeing.stress = 60;
    const before = sim.now;
    sim.must({ kind: 'life.look_after', payload: { action: 'sauna' } });
    expect(sim.now - before).toBe(SAUNA.sessionMinutes * 60_000);
    expect(sim.player.wellbeing.stress).toBeLessThan(60);
    expect(livingOf(sim.player).extraKwh).toBeCloseTo(6 * (60 + 14) / 60, 9);
    // Fourteen minutes of unwinding, not an hour's.
    expect(60 - sim.player.wellbeing.stress).toBeLessThan(5);
    expect(60 - sim.player.wellbeing.stress).toBeGreaterThan(0);
  });

  it('puts the heater’s kilowatt-hours on the month’s electricity', () => {
    const sim = home(['sauna'], 'sauna-bill');
    const month = 1;
    const plain = electricityAdjustment(sim, sim.player, month);
    livingOf(sim.player).extraKwh = 100;
    expect(electricityAdjustment(sim, sim.player, month)).toBeGreaterThan(plain);
  });
});

describe('storage rooms', () => {
  it('a walk-in closet adds its hanging to the closets', () => {
    const plain = home([], 'closet-plain');
    const walk = home(['walkInCloset'], 'closet-walk');
    expect(roomsOf(walk, walk.player)!.closetL - roomsOf(plain, plain.player)!.closetL).toBe(WALK_IN_L);
  });

  it('a library’s shelves take books, a thousand, and only where there’s a library', () => {
    const sim = home(['library'], 'lib');
    const h = homeKeyOf(sim.player.home)!;
    const book = addItem(sim, sim.player, { kind: 'book:test', label: 'A Book', quantity: 1, condition: 1, at: { kind: 'home', home: h, spot: 'floor' }, acquiredAt: sim.now });
    sim.must({ kind: 'items.move', payload: { itemId: book.id, to: { kind: 'home', home: h, spot: 'shelves' } } });
    expect(book.at).toMatchObject({ spot: 'shelves' });
    const lots = addItem(sim, sim.player, { kind: 'book:many', label: 'Many Books', quantity: LIBRARY_BOOKS, condition: 1, at: { kind: 'home', home: h, spot: 'floor' }, acquiredAt: sim.now });
    expect(sim.execute({ kind: 'items.move', payload: { itemId: lots.id, to: { kind: 'home', home: h, spot: 'shelves' } } }).error).toBe(`The library’s shelves are full: ${LIBRARY_BOOKS} books.`);
    const mug = addItem(sim, sim.player, { kind: 'test:mug', label: 'Mug', quantity: 1, condition: 1, at: { kind: 'home', home: h, spot: 'floor' }, acquiredAt: sim.now });
    expect(sim.execute({ kind: 'items.move', payload: { itemId: mug.id, to: { kind: 'home', home: h, spot: 'shelves' } } }).error).toBe('The Library’s Shelves are for books.');
    const none = home([], 'lib-none');
    const h2 = homeKeyOf(none.player.home)!;
    const b2 = addItem(none, none.player, { kind: 'book:test', label: 'A Book', quantity: 1, condition: 1, at: { kind: 'home', home: h2, spot: 'floor' }, acquiredAt: none.now });
    expect(none.execute({ kind: 'items.move', payload: { itemId: b2.id, to: { kind: 'home', home: h2, spot: 'shelves' } } }).error).toBe('This home has no library.');
  });
});

describe('a home theater', () => {
  it('holds a film night for as many as its seats there, before its screen (from 2026-10-06 things of theirs)', () => {
    const sim = home(['homeTheater'], 'film');
    const friends = [0, 1, 2, 3].map((n) => { const c = newContact(sim, sim.player, 'us-ny-newyork', `f${n}`, { at: sim.now, how: 'work' }); contactsOf(sim.player).push(c); return c.id; });
    const at = sim.now + 3 * 86_400_000;
    // Built before its screen and seats were things, it has neither until they're given.
    expect(hostRefusal(sim, sim.player, friends.slice(0, 3), at, 'film')).toBe('The theater has no screen in it.');
    const owned = sim.player.homes![0]!;
    kitTheater(sim, sim.player, owned);
    kitTheater(sim, sim.player, owned);
    expect(theaterAt(sim.player)).toEqual({ screen: true, seats: THEATER.seats });
    expect(hostRefusal(sim, sim.player, friends.slice(0, 3), at, 'film')).toBeUndefined();
    expect(hostRefusal(sim, sim.player, friends, at, 'film')).toBe(`The theater seats ${THEATER.seats}, you among them.`);
    // Two of the seats gone: it seats two.
    const seats = sim.player.items!.find((i) => i.kind === SEAT_KIND)!;
    seats.quantity = 2;
    expect(hostRefusal(sim, sim.player, friends.slice(0, 2), at, 'film')).toBe('The theater seats 2, you among them.');
    expect(hostRefusal(sim, sim.player, friends.slice(0, 1), at, 'film')).toBeUndefined();
    const none = home([], 'film-none');
    const c = newContact(none, none.player, 'us-ny-newyork', 'f', { at: none.now, how: 'work' });
    contactsOf(none.player).push(c);
    expect(hostRefusal(none, none.player, [c.id], at, 'film')).toBe('You have no home theater.');
  });

  it('a theater without them is given its screen and seats at the next day’s turn, once', () => {
    const sim = home(['homeTheater'], 'film-turn');
    expect(theaterAt(sim.player).screen).toBe(false);
    sim.advanceTo(sim.now + 2 * 86_400_000);
    expect(theaterAt(sim.player)).toEqual({ screen: true, seats: THEATER.seats });
    sim.advanceTo(sim.now + 86_400_000);
    expect(sim.player.items!.filter((i) => i.kind === SEAT_KIND)).toHaveLength(1);
  });

  it('its screen is a film lover’s screen at home, and a streaming service’s, with no TV of their own', () => {
    const sim = home(['homeTheater'], 'film-lover');
    const p = sim.player;
    p.interests = ['film'];
    delete p.furniture;
    p.items = (p.items ?? []).filter((i) => i.kind !== 'furniture:tv');
    expect(lovedIn(p, 'unwind')).not.toContain('film');
    // Nothing else to watch a service on: no phone, no computer, a home bought empty.
    p.items = p.items.filter((i) => !i.device && !i.kind.startsWith('computer'));
    const nothing = watchRefusal(sim, p, 'netflix');
    kitTheater(sim, p, p.homes![0]!);
    expect(lovedIn(p, 'unwind')).toContain('film');
    expect(nothing).toBe('There’s nothing here to watch it on: a TV, a computer, a tablet or a phone.');
    expect(watchRefusal(sim, p, 'netflix')).not.toBe(nothing);
  });
});

describe('a voice audition on tape', () => {
  it('is recorded free in a soundproofed room at home, or at a booth at the town’s rate', () => {
    const quiet = home(['soundproofRoom'], 'vo-quiet');
    expect(quietAtHome(quiet.player)).toBe(true);
    const loud = home([], 'vo-loud');
    expect(quietAtHome(loud.player)).toBe(false);
    // Open Jar's $125 an hour, booked an hour.
    expect(boothFee(loud, 'us-ny-newyork')).toEqual({ fee: inSaveMoney(loud, 125_00, 'USD'), studio: VO_BOOTHS['us-ny-newyork']!.studio });
    // Voice Trax West books the half hour a session takes; Monarch two hours at the least.
    expect(boothFee(loud, 'us-ca-losangeles')!.fee).toBe(inSaveMoney(loud, 50_00, 'USD'));
    expect(boothFee(loud, 'ca-bc-vancouver')!.fee).toBe(inSaveMoney(loud, 500_00, 'CAD'));
    // Toronto's before its HST.
    expect(boothFee(loud, 'ca-on-toronto')!.fee).toBe(inSaveMoney(loud, Math.round(40 * 1.13 * 100), 'CAD'));
    expect(boothFee(loud, 'fr-idf-paris')).toBeUndefined();
  });
});
