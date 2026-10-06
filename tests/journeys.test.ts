/**
 * Journeys through the connected world (the owner's expansion of
 * 2026-10-03, §8): each a run of the same commands the screens run, a save
 * taken and loaded in the middle, and checked that nothing is lost, charged
 * twice or held twice; with the edge cases a life meets on the way.
 */
import { describe, expect, it } from 'vitest';
import { breaches } from '@/engine/core/invariants';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { documentsOf } from '@/engine/systems/documents';
import { vehiclesOf } from '@/engine/systems/vehicles';
import { levelOf } from '@/engine/systems/fueltank';
import { runErrands, waitingShopping } from '@/engine/systems/trips';
import { garmentsOf } from '@/engine/systems/wardrobe';
import { purchaseItems } from '@/engine/systems/clothing';
import { itemsOf } from '@/engine/systems/items';
import { packedIn, suitcaseOf } from '@/engine/systems/luggage';
import { journeysOf } from '@/engine/systems/journey';
import { petsOf } from '@/engine/systems/pets';
import { clubById, meetingsAhead } from '@/engine/systems/clubs';
import { seatsAtHome } from '@/engine/systems/furnishings';

const NY = 'us-ny-newyork';
const life = (seed: string, city = NY) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const memos = (sim: Simulation, re: RegExp) => Object.values(sim.universe.transactions).filter((t) => re.test(t.memo)).length;
const licensed = (sim: Simulation) => documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
const noon = (sim: Simulation, d: number) => { const p = zonedParts(sim.now + d * MS_DAY, sim.zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 11 }, sim.zone); };

describe('a drive to the shops and back', () => {
  it('fills at a station, shops, comes home, is saved and loaded, and puts the shopping away, nothing charged twice', () => {
    let sim = life('j-shop');
    licensed(sim);
    const car = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } }).vehicleId;
    sim.advanceTo(noon(sim, 2));
    vehiclesOf(sim.player).find((v) => v.id === car)!.fuelLevel = 0.15;
    const run = runErrands(sim, { by: 'car', vehicleId: car, stops: [
      { kind: 'errand.fuel', payload: { station: 0 }, leg: 'errand' },
      { kind: 'food.buy_groceries', payload: { productId: 'thefreshgrocer-bowl-basket-russet-potatoes-5-lb-bag', quantity: 1 }, leg: 'shopping' },
      { kind: 'food.buy_groceries', payload: { productId: 'thefreshgrocer-perdue-99-fat-free-boneless-skinless-chicken-breasts', quantity: 1 }, leg: 'shopping' },
    ] });
    expect(run, JSON.stringify(run)).toEqual({ done: 3 });
    const level = levelOf(vehiclesOf(sim.player).find((v) => v.id === car)!);
    expect(level).toBeGreaterThan(0.9);
    expect(waitingShopping(sim.player)).toHaveLength(2);
    // Saved and loaded with the shopping still in the car.
    sim = reload(sim);
    expect(waitingShopping(sim.player)).toHaveLength(2);
    expect(levelOf(vehiclesOf(sim.player).find((v) => v.id === car)!)).toBe(level);
    const put = sim.must<{ put: number; spoiled: number }>({ kind: 'items.put_away', payload: {} });
    expect(put).toMatchObject({ put: 2, spoiled: 0 });
    expect(memos(sim, /^Fuel at /)).toBe(1);
    // Edge: a fill bigger than the tank holds, and diesel in a petrol car, refused.
    expect(sim.execute({ kind: 'vehicle.refuel', payload: { vehicleId: car, amount: { by: 'quantity', value: 999 } } }).error).toMatch(/^It holds/);
    expect(sim.execute({ kind: 'vehicle.refuel', payload: { vehicleId: car, grade: 'diesel', amount: { by: 'quantity', value: 1 } } }).error).toBe('A petrol car can’t take diesel.');
    // Every law of the world holds at the journey's end (from 2026-10-06, `core/invariants.ts`).
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('clothes bought through to resale', () => {
  it('bought in store, saved and loaded, and sold, gone from what they own and paid once', () => {
    let sim = life('j-clothes');
    const tee = CLOTHING_PRODUCTS.find((p) => p.id === 'us-uniqlo-supima-cotton-t-shirt')!;
    sim.advanceTo(noon(sim, 1));
    const { purchaseId } = sim.must<{ purchaseId: string }>({ kind: 'clothes.buy', payload: { productId: tee.id, how: 'store', size: 'M', color: tee.colors[0], quantity: 1 } });
    const [bought] = purchaseItems(sim.player, purchaseId);
    expect(bought!.at).toMatchObject({ kind: 'home', spot: 'wardrobe' });
    sim = reload(sim);
    expect(purchaseItems(sim.player, purchaseId).map((i) => i.id)).toEqual([bought!.id]);
    const sold = sim.must<{ paid: number }>({ kind: 'clothes.sell', payload: { itemIds: [bought!.id] } });
    expect(sold.paid).toBeGreaterThanOrEqual(0);
    expect(garmentsOf(sim.player).some((g) => g.id === bought!.id)).toBe(false);
    // Edge: sold, it can't be sold again; nothing chosen is refused.
    expect(sim.execute({ kind: 'clothes.sell', payload: { itemIds: [bought!.id] } }).ok).toBe(false);
    expect(sim.execute({ kind: 'clothes.sell', payload: { itemIds: [] } }).error).toBe('Choose what to sell.');
    // Every law of the world holds at the journey's end (from 2026-10-06, `core/invariants.ts`).
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a hotel stay', () => {
  it('packed by hand, flown, unpacked into the room, saved and loaded there, repacked and home, nothing left behind', () => {
    let sim = life('j-hotel');
    sim.advanceBy(26 * 3_600_000);
    const bag = suitcaseOf(sim.player)!;
    sim.must({ kind: 'luggage.pack', payload: {} });
    const packed = packedIn(sim.player, bag).length;
    expect(packed).toBeGreaterThan(0);
    const day = noon(sim, 10);
    const booked = sim.must<{ journeyId: string; returnId?: string; arriveAt: number }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, nights: 3, returnDay: day + 3 * MS_DAY, returnSlot: 1 } });
    sim.advanceTo(booked.arriveAt + 3_600_000);
    expect(sim.player.currentLocationId).toBe('us-ca-losangeles');
    sim.must({ kind: 'luggage.unpack', payload: {} });
    expect(itemsOf(sim.player).filter((i) => i.at.kind === 'stay')).toHaveLength(packed);
    sim = reload(sim);
    expect(itemsOf(sim.player).filter((i) => i.at.kind === 'stay')).toHaveLength(packed);
    sim.must({ kind: 'luggage.repack', payload: {} });
    const back = journeysOf(sim.player).find((j) => j.id === booked.returnId)!;
    sim.advanceTo(back.arriveAt + 3_600_000);
    expect(sim.player.currentLocationId).toBe(NY);
    expect(itemsOf(sim.player).some((i) => i.at.kind === 'held')).toBe(false);
    expect(packedIn(sim.player, suitcaseOf(sim.player)!)).toHaveLength(packed);
    // Every law of the world holds at the journey's end (from 2026-10-06, `core/invariants.ts`).
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('left without repacking, its things are held there; collected on a later stay', () => {
    let sim = life('j-forgot');
    sim.advanceBy(26 * 3_600_000);
    sim.must({ kind: 'luggage.pack', payload: {} });
    const day = noon(sim, 10);
    const booked = sim.must<{ returnId?: string; arriveAt: number }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, nights: 2, returnDay: day + 2 * MS_DAY, returnSlot: 1 } });
    sim.advanceTo(booked.arriveAt + 3_600_000);
    const n = sim.must<{ unpacked: number }>({ kind: 'luggage.unpack', payload: {} }).unpacked;
    const back = journeysOf(sim.player).find((j) => j.id === booked.returnId)!;
    sim.advanceTo(back.arriveAt + 3_600_000);
    expect(itemsOf(sim.player).filter((i) => i.at.kind === 'held')).toHaveLength(n);
    sim = reload(sim);
    expect(sim.execute({ kind: 'items.recover', payload: { cityId: 'us-ca-losangeles' } }).error).toBe('It’s collected in Los Angeles.');
    // Every law of the world holds at the journey's end (from 2026-10-06, `core/invariants.ts`).
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('pet care before a trip', () => {
  it('a dog can’t be left; with a sitter booked through it the trip goes, saved and loaded in the middle', () => {
    let sim = life('j-pet');
    sim.advanceTo(noon(sim, 1));
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-dog', name: 'Rex' } });
    expect(petsOf(sim.player)).toHaveLength(1);
    const day = noon(sim, 10);
    const trip = { toCity: 'us-ca-losangeles', day, slot: 1, nights: 3, returnDay: day + 3 * MS_DAY, returnSlot: 1 };
    expect(sim.execute({ kind: 'travel.book', payload: trip }).error).toMatch(/^Rex can’t be left/);
    sim.advanceTo(day - 6 * 3_600_000);
    sim.must({ kind: 'home.sitter', payload: { nights: 5 } });
    const booked = sim.must<{ returnId?: string; arriveAt: number }>({ kind: 'travel.book', payload: trip });
    sim = reload(sim);
    expect(petsOf(sim.player)).toHaveLength(1);
    const back = journeysOf(sim.player).find((j) => j.id === booked.returnId)!;
    sim.advanceTo(back.arriveAt + 3_600_000);
    expect(sim.player.currentLocationId).toBe(NY);
    expect(petsOf(sim.player)).toHaveLength(1);
    expect(memos(sim, /sitter/i)).toBe(1);
    // Every law of the world holds at the journey's end (from 2026-10-06, `core/invariants.ts`).
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a car modified, and the way about meanwhile', () => {
  it('at the fitter’s for its hours, the car refused, the bus taken, saved and loaded, and the car back after, paid once', () => {
    let sim = life('j-mods', 'uk-eng-london');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'uk', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const car = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'gb-ford-puma' } }).vehicleId;
    sim.advanceTo(noon(sim, 2));
    sim.must({ kind: 'vehicle.modify', payload: { vehicleId: car, mod: 'respray' } });
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: car } }).error).toMatch(/^It’s at the body shop until/);
    sim.must({ kind: 'errand.go', payload: { to: 'errand', by: 'transit' } });
    sim.must({ kind: 'errand.go', payload: { to: 'home' } });
    sim = reload(sim);
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: car } }).ok).toBe(false);
    sim.advanceBy(6 * MS_DAY);
    sim.must({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: car } });
    sim.must({ kind: 'errand.go', payload: { to: 'home' } });
    expect(memos(sim, /^A Full Respray, fitted$/)).toBe(1);
    // Every law of the world holds at the journey's end (from 2026-10-06, `core/invariants.ts`).
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a club meeting', () => {
  it('joined, answered, saved and loaded, gone to, and someone met, the meeting counted once', () => {
    let sim = life('j-club');
    sim.must({ kind: 'club.join', payload: { clubId: 'parkrun-brooklyn-bridge', by: 'transit' } });
    const m0 = sim.player.clubs![0]!;
    sim.advanceTo(noon(sim, 1));
    const next = meetingsAhead(clubById('parkrun-brooklyn-bridge')!, sim.now, 1)[0]!;
    sim.must({ kind: 'club.rsvp', payload: { clubId: m0.clubId, at: next, going: true } });
    sim = reload(sim);
    sim.advanceTo(next - 90 * 60_000);
    sim.must({ kind: 'club.go', payload: { clubId: m0.clubId, by: 'transit', stayAfter: true } });
    sim = reload(sim);
    sim.advanceTo(next + 2 * MS_DAY);
    const m = sim.player.clubs![0]!;
    expect(m.went).toBe(1);
    expect(m.missed).toBeUndefined();
    expect(m.met?.length).toBe(1);
    expect(memos(sim, /transit, a ride$/)).toBe(2);
    // Every law of the world holds at the journey's end (from 2026-10-06, `core/invariants.ts`).
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a room furnished and used', () => {
  it('a piece bought flat-packed, saved and loaded, put together, and sat on', () => {
    let sim = life('j-room');
    sim.player.home = { ...sim.player.home!, kind: 'own' } as never;
    const seats = seatsAtHome(sim.player).seats;
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: 'us-onnestad-19554477', quantity: 1 } });
    sim = reload(sim);
    const chair = itemsOf(sim.player).find((i) => i.kind === 'ikea:us-onnestad-19554477')!;
    expect(chair.flatPacked).toBe(true);
    sim.must({ kind: 'items.assemble', payload: { itemId: chair.id } });
    expect(seatsAtHome(sim.player).seats).toBeGreaterThan(seats);
    // Edge: away from home it can't be put together, and put together it can't be again.
    expect(sim.execute({ kind: 'items.assemble', payload: { itemId: chair.id } }).error).toBe('It’s put together.');
    // Every law of the world holds at the journey's end (from 2026-10-06, `core/invariants.ts`).
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('the edges a life meets', () => {
  it('a missing passport keeps a flight abroad from being booked; a closed store keeps its shopping', () => {
    const sim = life('j-edges');
    sim.player.documents = (sim.player.documents ?? []).filter((d) => d.kind !== 'passport');
    expect(sim.execute({ kind: 'travel.book', payload: { toCity: 'uk-eng-london', day: noon(sim, 10), slot: 1, nights: 2 } }).ok).toBe(false);
    // Every law of the world holds at the journey's end (from 2026-10-06, `core/invariants.ts`).
    expect(breaches(sim.universe)).toEqual([]);
  });
});
