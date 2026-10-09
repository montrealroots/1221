/**
 * The acting and travel journey (the owner's audit of 2026-10-06, §5): a job
 * offered on location, accepted, the post held and a bag packed, flown out on
 * the production's ticket, unpacked at the hotel, saved and loaded there, the
 * calls worked, repacked and flown home; and at home, the pay in, the rent
 * charged while away, the bag's things back, the post given back, and every
 * law of the world holding.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { serialise, deserialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { beginCareer, careerOf, type Booking } from '@/engine/systems/career';
import { documentsOf, passportOf } from '@/engine/systems/documents';
import { journeysOf } from '@/engine/systems/journey';
import { itemsOf } from '@/engine/systems/items';
import { packedIn, suitcaseOf } from '@/engine/systems/luggage';
import { evenCraft } from '@/engine/systems/school';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
const walk = (sim: Simulation, to: number) => { while (sim.now < to) sim.advanceTo(Math.min(to, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };

describe('an acting job on location, there and home', () => {
  it('is offered, prepared for, flown to, worked, saved and loaded there, and come home from, with the life at home kept', () => {
    let sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'journey-acting-travel');
    // An actor's craft, as drama school leaves every new life with (`enroll`); a save made without the school has none, and a call is never worked without it.
    sim.player.craft = evenCraft(70);
    beginCareer(sim, sim.player);
    if (!passportOf(sim.player, sim.now)) documentsOf(sim.player).push({ id: 'pp', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const start = sim.now;
    const balance = () => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;

    // Offered: two days on location in Toronto.
    const b: Booking = { id: 'tor', roleId: 'costar', cityId: 'us-ny-newyork', location: 'ca-on-toronto', starts: at(2026, 10, 5, 8), units: 2, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    sim.must({ kind: 'career.accept', payload: { bookingId: b.id } });
    // SETUP: the production keeps its dates. Since series, voice and commercial work were given their own changes
    // (b014236b), this job's draw is a cut of its last day, which sends the actor home before the repack this journey
    // walks; `tests/rescheduling*.test.ts` hold what a change does.
    for (const x of sim.universe.scheduled) if (x.kind === 'career.schedule_change' && x.status === 'pending') sim.timeline.cancel(x.id, sim.now);
    const out = sim.universe.scheduled.find((i) => i.kind === 'career.travel' && i.payload.bookingId === 'tor' && i.payload.direction === 'out')!;
    expect(out).toBeDefined();

    // Prepared: the post held while away, a bag packed.
    walk(sim, out.at - 2 * MS_DAY);
    const hold = sim.must<{ from: number; releaseAt: number; paid: number }>({ kind: 'home.hold_mail', payload: { days: 10 } });
    expect(hold.releaseAt).toBeGreaterThan(out.at);
    const bag = suitcaseOf(sim.player)!;
    sim.must({ kind: 'luggage.pack', payload: {} });
    const packed = packedIn(sim.player, bag).length;
    expect(packed).toBeGreaterThan(0);

    // Flown out on the production's ticket, there when it lands, at a hotel.
    walk(sim, out.at + 60_000);
    const there = journeysOf(sim.player).find((x) => x.bookingId === 'tor')!;
    expect(there.paidBy).toBe('production');
    walk(sim, there.arriveAt + (there.lateMinutes ?? 0) * 60_000 + 60_000);
    expect(sim.player.currentLocationId).toBe('ca-on-toronto');
    expect(sim.player.stay?.kind).toBe('hotel');
    expect(sim.universe.transactions.some((t) => /fare/i.test(t.memo))).toBe(false);

    // Unpacked into the room, saved and loaded there, nothing lost.
    sim.must({ kind: 'luggage.unpack', payload: {} });
    expect(itemsOf(sim.player).filter((i) => i.at.kind === 'stay')).toHaveLength(packed);
    sim = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(sim.player.currentLocationId).toBe('ca-on-toronto');
    expect(itemsOf(sim.player).filter((i) => i.at.kind === 'stay')).toHaveLength(packed);
    expect(breaches(sim.universe)).toEqual([]);

    // The calls worked, repacked, and home.
    const calls = sim.universe.scheduled.filter((i) => i.kind === 'career.work' && i.payload.bookingId === 'tor');
    walk(sim, Math.max(...calls.map((c) => c.at)) + 12 * MS_HOUR);
    sim.must({ kind: 'luggage.repack', payload: {} });
    walk(sim, at(2026, 10, 12));
    const home = journeysOf(sim.player).find((x) => x.bookingId === 'tor' && x.toCity === 'us-ny-newyork')!;
    expect(home.status).toBe('arrived');
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    expect(itemsOf(sim.player).filter((i) => i.at.kind === 'stay' || i.at.kind === 'held')).toHaveLength(0);

    // The job's consequences: worked and paid, at the money's own memo.
    const booking = careerOf(sim.player).bookings.find((x) => x.id === 'tor')!;
    expect(booking.worked).toBe(2);
    expect(sim.universe.transactions.some((t) => t.at > start && /costar|co-star|wages|pay/i.test(t.memo) && t.postings.some((p) => p.accountId === sim.player.primaryAccountId && p.amount > 0))).toBe(true);
    // The life at home kept while away: the post given back, the rent charged in the absence.
    expect(sim.universe.transactions.some((t) => t.at >= out.at && t.at <= home.arriveAt && /rent/i.test(t.memo))).toBe(true);
    expect(balance()).toBeGreaterThan(0);
    expect(breaches(sim.universe)).toEqual([]);
  }, 120_000);
});
