/**
 * Somebody you know along on a journey (`systems/companions.ts`, from
 * 2026-10-02): a friend or partner from where you set out, each paying their
 * own fare, a room shared and split, and the trip's waking hours together.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { HALL } from '@/engine/content/people';
import { contactsOf, newContact } from '@/engine/systems/people';
import { journeysOf } from '@/engine/systems/journey';
import { AWAKE_SHARE, sleepsOf } from '@/engine/systems/companions';

function trip(seed: string, hours: number) {
  const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  const c = newContact(sim, sim.player, 'us-ct-newhaven', `${seed}-friend`, { at: sim.now, how: 'school' });
  c.hours = hours;
  contactsOf(sim.player).push(c);
  const p = zonedParts(sim.now + 10 * MS_DAY, sim.zone);
  const day = instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone);
  const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day, slot: 2, returnDay: day + 3 * MS_DAY, returnSlot: 2, hotelId: 'pod-times-square', room: 'Bunk Pod' } });
  expect(r.ok, r.error).toBe(true);
  return { sim, c, out: journeysOf(sim.player).find((j) => j.id === r.value!.journeyId)! };
}

describe('somebody along', () => {
  it('a friend says yes, pays back half the room, and the trip’s waking hours are time together', () => {
    const { sim, c, out } = trip('along-yes', 120);
    const cash = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const r = sim.execute<{ accepted: boolean; repaid?: number }>({ kind: 'travel.companion', payload: { journeyId: out.id, contactId: c.id } });
    expect(r.value).toMatchObject({ accepted: true });
    expect(r.value!.repaid).toBe(Math.floor(out.hotel!.price / 2));
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance - cash).toBe(r.value!.repaid);
    expect(sim.execute({ kind: 'travel.companion', payload: { journeyId: out.id, contactId: c.id } }).error).toBe('They’re coming already.');
    const back = journeysOf(sim.player).find((j) => j.tripId === out.tripId && j.id !== out.id)!;
    for (let i = 0; i < 400 && sim.now < back.arriveAt + 3_600_000; i += 1) sim.advanceTo(Math.min(back.arriveAt + 3_600_000, sim.now + 6 * 3_600_000));
    expect(c.hours).toBeCloseTo(120 + ((back.arriveAt - out.leaveAt) / 3_600_000) * AWAKE_SHARE, 6);
    expect(c.memory[0]!.what).toMatch(/^A trip to New York together/);
  });

  it('somebody hardly known says no, and why', () => {
    const { sim, c, out } = trip('along-no', HALL.friend - 1);
    const r = sim.execute<{ accepted: boolean; reason?: string }>({ kind: 'travel.companion', payload: { journeyId: out.id, contactId: c.id } });
    expect(r.value).toEqual({ accepted: false, reason: `${c.name.split(' ')[0]} doesn’t know you well enough yet to go away together.` });
  });
});

describe('nobody along', () => {
  it('from another town, nor counted when the trip is called off', () => {
    const { sim, c, out } = trip('along-off', 150);
    const far = newContact(sim, sim.player, 'us-ca-losangeles', 'along-far', { at: sim.now, how: 'school' });
    far.hours = 300;
    contactsOf(sim.player).push(far);
    expect(sim.execute<{ accepted: boolean; reason?: string }>({ kind: 'travel.companion', payload: { journeyId: out.id, contactId: far.id } }).value!.reason).toMatch(/lives in Los Angeles/);
    sim.must({ kind: 'travel.companion', payload: { journeyId: out.id, contactId: c.id } });
    sim.must({ kind: 'travel.cancel', payload: { journeyId: out.id } });
    sim.advanceBy(10 * MS_DAY);
    expect(c.hours).toBe(150);
  });
});

describe('a missed departure', () => {
  it('isn’t a trip together', () => {
    const { sim, c, out } = trip('along-missed', 150);
    sim.must({ kind: 'travel.companion', payload: { journeyId: out.id, contactId: c.id } });
    sim.advanceTo(out.leaveAt - 3_600_000);
    sim.player.currentLocationId = 'us-ca-losangeles';
    for (let i = 0; i < 200 && sim.now < out.leaveAt + 6 * MS_DAY; i += 1) sim.advanceTo(Math.min(out.leaveAt + 6 * MS_DAY, sim.now + 6 * 3_600_000));
    expect(['missed', 'canceled']).toContain(out.status);
    expect(c.hours).toBe(150);
  });
});

describe('several along', () => {
  it('as many as the room sleeps, each paying back their share as the room is split again', () => {
    expect(sleepsOf('2 Twin')).toBe(2);
    expect(sleepsOf('2 Queen size bed(s) and 1 Double sofa bed(s)')).toBe(6);
    expect(sleepsOf('1 King')).toBe(2);
    expect(sleepsOf('2 Bunks or 4 Twins')).toBe(2);
    expect(sleepsOf('Various Bed Types')).toBeUndefined();
    expect(sleepsOf(null)).toBeUndefined();
    // Pod's Bunk Pod, two twins: one along, and no more.
    const { sim, c, out } = trip('along-two', 120);
    sim.must({ kind: 'travel.companion', payload: { journeyId: out.id, contactId: c.id } });
    const d = newContact(sim, sim.player, 'us-ct-newhaven', 'along-two-b', { at: sim.now, how: 'school' });
    d.hours = 120;
    contactsOf(sim.player).push(d);
    expect(sim.execute({ kind: 'travel.companion', payload: { journeyId: out.id, contactId: d.id } }).error).toBe('The room sleeps no more.');
  });
});

describe('a room for four', () => {
  it('takes three along, each paying back so the room comes out in quarters', () => {
    const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth: 'wealthy' }, 'along-four');
    const friends = ['a', 'b', 'c', 'd'].map((x) => { const c = newContact(sim, sim.player, 'us-ct-newhaven', `four-${x}`, { at: sim.now, how: 'school' }); c.hours = 150; contactsOf(sim.player).push(c); return c; });
    const p = zonedParts(sim.now + 10 * MS_DAY, sim.zone);
    const day = instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone);
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day, slot: 2, returnDay: day + 3 * MS_DAY, returnSlot: 2, hotelId: 'ace-hotel-brooklyn', room: 'Double' } });
    expect(r.ok, r.error).toBe(true);
    const out = journeysOf(sim.player).find((j) => j.id === r.value!.journeyId)!;
    const room = out.hotel!.price;
    const paid = friends.slice(0, 3).map((c) => sim.execute<{ accepted: boolean; repaid?: number }>({ kind: 'travel.companion', payload: { journeyId: out.id, contactId: c.id } }).value!.repaid ?? 0);
    expect(paid.reduce((a, b) => a + b, 0)).toBe(Math.floor((room * 3) / 4));
    expect(paid[0]).toBe(Math.floor(room / 2));
    expect(sim.execute({ kind: 'travel.companion', payload: { journeyId: out.id, contactId: friends[3]!.id } }).error).toBe('The room sleeps no more.');
  });
});

describe('the town’s average hotel', () => {
  it('is taken to sleep two: one along, and no more', () => {
    const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth: 'wealthy' }, 'along-avg');
    const friends = ['a', 'b'].map((x) => { const c = newContact(sim, sim.player, 'us-ct-newhaven', `avg-${x}`, { at: sim.now, how: 'school' }); c.hours = 150; contactsOf(sim.player).push(c); return c; });
    const p = zonedParts(sim.now + 10 * MS_DAY, sim.zone);
    const day = instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone);
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day, slot: 2, returnDay: day + 3 * MS_DAY, returnSlot: 2 } });
    expect(r.ok, r.error).toBe(true);
    sim.must({ kind: 'travel.companion', payload: { journeyId: r.value!.journeyId, contactId: friends[0]!.id } });
    expect(sim.execute({ kind: 'travel.companion', payload: { journeyId: r.value!.journeyId, contactId: friends[1]!.id } }).error).toBe('The room sleeps no more.');
  });
});
