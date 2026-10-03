/**
 * IKEA's pieces and friends over (`systems/furnishings.ts`,
 * `systems/hosting.ts`, from 2026-10-02): a piece at its price, its seats,
 * its table places and its storage; friends asked home to what there are
 * seats and a table for; dinner paid, drinks poured from the kitchen, and a
 * mess noticed.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { HALL } from '@/engine/content/people';
import { FURNITURE_CATALOG } from '@/engine/content/furniturecatalog';
import { FURNISHED, piecePrice, piecesCatalog, pieceRefusal, seatsAtHome } from '@/engine/systems/furnishings';
import { HOST_KIND, hostRefusal } from '@/engine/systems/hosting';
import { contactsOf, newContact } from '@/engine/systems/people';
import { livingOf } from '@/engine/systems/dwelling';
import { foodOf } from '@/engine/systems/pantry';
import { followTheMove, leavingHome, moveRefusal } from '@/engine/systems/items';
import { ownBuilt } from '@/engine/systems/homes';
import { salesTaxRate } from '@/engine/content/tax';
import { FURNITURE } from '@/engine/content/furniture';
import { inSaveMoney } from '@/engine/systems/banking';
import { mealOf } from '@/engine/systems/household';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const friend = (sim: Simulation, seed: string, hours: number = HALL.friend) => { const c = newContact(sim, sim.player, sim.player.home!.cityId, seed, { at: sim.now, how: 'school' }); c.hours = hours; contactsOf(sim.player).push(c); return c; };
const evening = (sim: Simulation, days = 2, hour = 19) => { const p = zonedParts(sim.now + days * MS_DAY, 'America/New_York'); return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour, minute: 0 }, 'America/New_York'); };

describe('IKEA’s pieces', () => {
  it('are where you live, cheapest first, at IKEA’s price taxed and delivered', () => {
    const sim = life('us-ny-newyork', 'ikea-cat');
    const cat = piecesCatalog(sim, sim.player);
    expect(cat.every((e) => e.value.country === 'us')).toBe(true);
    expect(cat.map((e) => e.price)).toEqual([...cat.map((e) => e.price)].sort((a, b) => a! - b!));
    const chair = FURNITURE_CATALOG.find((p) => p.country === 'us' && p.kind === 'diningChair')!;
    expect(piecePrice(sim, 'us-ny-newyork', chair)).toBe(inSaveMoney(sim, Math.round((chair.price * (1 + salesTaxRate('us-ny-newyork', sim.now, 'furniture')) + FURNITURE.us!.items.sofa!.delivery) * 100), 'USD'));
    expect(pieceRefusal(sim.player, FURNITURE_CATALOG.find((p) => p.country === 'uk')!.id, 1)).toBe('IKEA sells that in another country.');
  });

  it('add seats, table places and storage at home', () => {
    const sim = life('us-ny-newyork', 'ikea-seats');
    const before = seatsAtHome(sim.player);
    expect(before).toEqual({ seats: FURNISHED.seats, table: FURNISHED.table });
    const chair = FURNITURE_CATALOG.find((p) => p.country === 'us' && p.kind === 'diningChair')!;
    const table = FURNITURE_CATALOG.find((p) => p.country === 'us' && p.kind === 'diningTable' && p.seats)!;
    // Put together by IKEA's service, from 2026-10-03; flat-packed they'd seat and hold nothing (tests/assembly.test.ts).
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: chair.id, quantity: 4, assembly: true } });
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: table.id, assembly: true } });
    expect(seatsAtHome(sim.player)).toEqual({ seats: FURNISHED.seats + 4, table: FURNISHED.table + table.seats! });
    const wardrobe = FURNITURE_CATALOG.find((p) => p.country === 'us' && p.kind === 'wardrobe' && p.holdsL)!;
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: wardrobe.id, assembly: true } });
    const w = (sim.player.items ?? []).find((i) => i.kind === `ikea:${wardrobe.id}`)!;
    expect(w.holdsL).toBe(wardrobe.holdsL);
    const shirt = (sim.player.items ?? []).find((i) => i.garment && i.at.kind === 'home')!;
    expect(moveRefusal(sim, sim.player, shirt, { kind: 'inside', itemId: w.id })).toBeUndefined();
    expect(moveRefusal(sim, sim.player, { ...shirt, volumeL: wardrobe.holdsL! + 1 }, { kind: 'inside', itemId: w.id })).toMatch(/liters left/);
  });
});

describe('an empty home', () => {
  it('has only the seats bought: none, then a sofa’s three', () => {
    const sim = life('us-ny-newyork', 'ikea-bare');
    const owned = ownBuilt(sim, sim.player, { cityId: 'us-ny-newyork', facts: { type: 'house', address: 'Test House', beds: 3, baths: 2, size: 1_600, built: 2000, features: [], parts: {}, hoaUsd: 0 }, price: 400_000_00, closing: 0 });
    const from = leavingHome(sim.player);
    sim.player.home = { kind: 'owned', cityId: 'us-ny-newyork', homeId: owned.id, since: sim.now };
    followTheMove(sim.player, from);
    expect(seatsAtHome(sim.player)).toEqual({ seats: 0, table: 0 });
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += 10_000_00;
    sim.must({ kind: 'home.furnish', payload: { piece: 'sofa' } });
    expect(seatsAtHome(sim.player)).toEqual({ seats: 3, table: 0 });
  });
});

describe('friends over', () => {
  it('only to what there are seats for, a dinner at a table', () => {
    const sim = life('us-ny-newyork', 'host-seats');
    const at = evening(sim);
    const many = Array.from({ length: FURNISHED.seats }, (_, i) => friend(sim, `host-seat-${i}`).id);
    expect(hostRefusal(sim, sim.player, many, at, 'drinks')).toBe(`You have seats for ${FURNISHED.seats}, you among them.`);
    expect(hostRefusal(sim, sim.player, many.slice(0, FURNISHED.seats - 1), at, 'drinks')).toBeUndefined();
    expect(hostRefusal(sim, sim.player, many.slice(0, FURNISHED.table), at, 'dinner')).toBe(`Your table sits ${FURNISHED.table}.`);
    expect(hostRefusal(sim, sim.player, many.slice(0, FURNISHED.table - 1), at, 'dinner')).toBeUndefined();
    expect(hostRefusal(sim, sim.player, [], at, 'dinner')).toBe('Choose who to ask.');
    expect(hostRefusal(sim, sim.player, [many[0]!, many[0]!], at, 'dinner')).toBe('Ask each of them once.');
  });

  it('each says yes or no for their own reasons; dinner is paid, drinks poured, the hours counted', () => {
    const sim = life('us-ny-newyork', 'host-dinner');
    const a = friend(sim, 'host-a');
    const b = friend(sim, 'host-b');
    const stranger = friend(sim, 'host-c', HALL.casual - 1);
    const at = evening(sim);
    const r = sim.execute<{ coming: string[]; declined: { contactId: string; reason: string }[] }>({ kind: 'social.host', payload: { contactIds: [a.id, b.id, stranger.id], at, what: 'dinner' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.coming).toEqual([a.id, b.id]);
    expect(r.value!.declined.map((d) => d.contactId)).toEqual([stranger.id]);
    // A bottle of wine in the kitchen: two glasses for the guests and one for you.
    const wine = { id: 'wine', kind: 'wine', label: 'Wine', quantity: 1, condition: 1, at: { kind: 'home' as const, home: (sim.player.items ?? []).find((i) => i.at.kind === 'home')!.at.kind === 'home' ? ((sim.player.items ?? []).find((i) => i.at.kind === 'home')!.at as { home: string }).home : '', spot: 'pantry' as const }, acquiredAt: sim.now, food: { key: 'wine', unit: 'ml' as const, left: 750 } };
    sim.player.items = [...(sim.player.items ?? []), wine as never];
    livingOf(sim.player).tidy = 90;
    const hoursA = a.hours;
    for (let i = 0; i < 100 && sim.universe.scheduled.some((x) => x.kind === HOST_KIND && x.status === 'pending'); i += 1) sim.advanceTo(Math.min(at + 4 * 3_600_000, sim.now + 6 * 3_600_000));
    expect(a.hours).toBeGreaterThan(hoursA);
    const bill = sim.universe.transactions.find((t) => t.memo === 'Dinner at home for 3')!;
    expect(bill.postings.filter((q) => q.amount > 0).reduce((t, q) => t + q.amount, 0)).toBe(mealOf(sim, sim.player) * 3);
    expect(a.memory[0]!.what).toBe('dinner at yours'.replace(/^d/, 'D'));
    const left = foodOf(sim.player).find((i) => i.id === 'wine')?.food.left ?? 0;
    expect(left).toBeCloseTo(750 - 3 * 148, 6);
    expect(stranger.memory[0]!.what).toMatch(/^Said no to dinner at yours/);
  });

  it('a mess is noticed, and nothing to drink', () => {
    const sim = life('us-ny-newyork', 'host-mess');
    const a = friend(sim, 'mess-a');
    const at = evening(sim);
    sim.must({ kind: 'social.host', payload: { contactIds: [a.id], at, what: 'drinks' } });
    sim.player.items = (sim.player.items ?? []).filter((i) => i.food?.key !== 'beer' && i.food?.key !== 'wine');
    for (let i = 0; i < 100 && sim.universe.scheduled.some((x) => x.kind === HOST_KIND && x.status === 'pending'); i += 1) {
      livingOf(sim.player).tidy = 10;
      sim.advanceTo(Math.min(at + 4 * 3_600_000, sim.now + 3_600_000));
    }
    expect(a.memory[0]!.what).toBe('Drinks at yours, the place a mess, not much to drink');
  });

  it('nobody home, they were stood up', () => {
    const sim = life('us-ny-newyork', 'host-away');
    const a = friend(sim, 'away-a');
    const at = evening(sim);
    sim.must({ kind: 'social.host', payload: { contactIds: [a.id], at, what: 'drinks' } });
    sim.player.currentLocationId = 'us-ca-losangeles';
    for (let i = 0; i < 100 && sim.universe.scheduled.some((x) => x.kind === HOST_KIND && x.status === 'pending'); i += 1) sim.advanceTo(Math.min(at + 4 * 3_600_000, sim.now + 6 * 3_600_000));
    expect(a.stoodUp).toBe(at);
  });
});
