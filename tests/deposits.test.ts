/**
 * A deposit the bank can't cover on arrival (from 2026-10-02): a named
 * hotel's room and a rental car are held until it's paid or the day ends,
 * then given up. Until then the room and the car were handed over whether
 * the deposit was held or not.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { depositFor } from '@/engine/systems/hotels';
import { journeysOf } from '@/engine/systems/journey';
import { rentalsOf } from '@/engine/systems/rentals';
import { roomGone } from '@/engine/systems/latecheckout';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const noon = (sim: Simulation, after: number) => { const p = zonedParts(sim.now + after * MS_DAY, sim.zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone); };
/** Everything in checking and savings, gone, and what was there. */
function drain(sim: Simulation): number {
  let had = 0;
  for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && (a.kind === 'checking' || a.kind === 'savings')) { had += a.balance; a.balance = 0; }
  return had;
}
const topUp = (sim: Simulation, amount: number) => { sim.universe.accounts[sim.player.primaryAccountId!]!.balance += amount; };
const until = (sim: Simulation, done: () => boolean, limit: number) => { while (!done() && sim.now < limit) sim.advanceTo(sim.now + 30 * 60_000); };

describe('a hotel deposit the bank can’t cover', () => {
  function arrive(seed: string) {
    const sim = life('us-ct-newhaven', seed);
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day: noon(sim, 10), slot: 2, nights: 2, hotelId: 'pod-times-square', room: 'Bunk Pod' } });
    expect(r.ok, r.error).toBe(true);
    const j = journeysOf(sim.player).find((x) => x.id === r.value!.journeyId)!;
    sim.advanceTo(j.leaveAt - MS_HOUR);
    const had = drain(sim);
    until(sim, () => j.status === 'arrived', j.arriveAt + 2 * MS_DAY);
    return { sim, j, had, deposit: depositFor(sim, 'pod-times-square', 2) };
  }

  it('holds the room without its key, and paid, gives it', () => {
    const { sim, j, had, deposit } = arrive('dep-hotel-pay');
    expect(deposit).toBeGreaterThan(0);
    expect(j.hotel!.deposit).toBeUndefined();
    expect(j.hotel!.depositDue).toBe(deposit);
    expect(sim.player.stay).toMatchObject({ kind: 'hotel', out: true });
    expect(roomGone(sim.player)).toBe(true);
    expect(sim.execute({ kind: 'travel.pay_deposit', payload: { journeyId: j.id } }).error).toMatch(/more than the bank holds/);
    topUp(sim, had);
    const paid = sim.execute<{ paid: number }>({ kind: 'travel.pay_deposit', payload: { journeyId: j.id } });
    expect(paid.ok, paid.error).toBe(true);
    expect(j.hotel!.deposit).toBe(deposit);
    expect(j.hotel!.depositDue).toBeUndefined();
    expect(roomGone(sim.player)).toBe(false);
    expect(sim.universe.scheduled.some((s) => s.status === 'pending' && s.kind === 'travel.deposit_due')).toBe(false);
    expect(sim.execute({ kind: 'travel.pay_deposit', payload: { journeyId: j.id } }).error).toMatch(/No deposit is due/);
  });

  it('unpaid by the end of the day, gives the stay up', () => {
    const { sim, j } = arrive('dep-hotel-lapse');
    expect(j.hotel!.depositDue).toBeGreaterThan(0);
    const end = j.hotel!.heldUntil!;
    sim.advanceTo(end + MS_HOUR);
    expect(j.hotel!.forfeited).toBe(true);
    expect(j.hotel!.depositDue).toBeUndefined();
    expect(sim.player.stay?.kind).toBe('sofa');
    expect(sim.universe.scheduled.some((s) => s.status === 'pending' && s.kind === 'travel.checkout' && s.payload.journeyId === j.id)).toBe(false);
    expect(sim.universe.notifications.some((n) => n.title === 'Hotel Stay Given Up')).toBe(true);
  });
});

describe('a rental deposit the bank can’t cover', () => {
  function atTheDesk(seed: string) {
    const sim = life('us-ny-newyork', seed);
    const day = noon(sim, 14);
    const booked = sim.execute<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 2, returnDay: day + 7 * MS_DAY, returnSlot: 2 } });
    expect(booked.ok, booked.error).toBe(true);
    const rent = sim.execute<{ rentalId: string; paid: number; deposit: number }>({ kind: 'travel.rent_car', payload: { journeyId: booked.value!.journeyId } });
    expect(rent.ok, rent.error).toBe(true);
    const out = journeysOf(sim.player).find((x) => x.id === booked.value!.journeyId)!;
    sim.advanceTo(out.leaveAt - MS_HOUR);
    const had = drain(sim);
    const r = rentalsOf(sim.player)[0]!;
    until(sim, () => r.status !== 'booked', out.arriveAt + 2 * MS_DAY);
    return { sim, r, had, deposit: rent.value!.deposit };
  }

  it('keeps the car at the desk, and paid, lets it out', () => {
    const { sim, r, had, deposit } = atTheDesk('dep-car-pay');
    expect(r.status).toBe('held');
    expect(r.depositDue).toBe(deposit);
    expect(sim.execute({ kind: 'travel.pay_rental_deposit', payload: { rentalId: r.id } }).error).toMatch(/more than the bank holds/);
    topUp(sim, had);
    const paid = sim.execute({ kind: 'travel.pay_rental_deposit', payload: { rentalId: r.id } });
    expect(paid.ok, paid.error).toBe(true);
    expect(r.status).toBe('out');
    expect(sim.universe.accounts[r.escrowAccountId!]!.balance).toBe(deposit);
  });

  it('unpaid by the end of the day, gives the booking up and refunds it', () => {
    const { sim, r } = atTheDesk('dep-car-lapse');
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    sim.advanceTo(r.heldUntil! + MS_HOUR);
    expect(r.status).toBe('canceled');
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance - before).toBeGreaterThanOrEqual(r.paid);
    expect(sim.universe.scheduled.some((s) => s.status === 'pending' && s.kind === 'rental.return' && s.payload.rentalId === r.id)).toBe(false);
  });
});
