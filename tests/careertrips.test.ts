/**
 * The career's own trips as journeys (from 2026-09-29): the production's
 * flight to a location and home, and an actor's own fare to a job in
 * another city, each on the airline's schedule, arriving when it lands.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { beginCareer, careerOf, type Booking } from '@/engine/systems/career';
import { documentsOf, passportOf } from '@/engine/systems/documents';
import { earningsOf } from '@/engine/systems/earnings';
import { careerTrip, journeysOf } from '@/engine/systems/journey';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);

function pro(seed: string, city = 'us-ny-newyork'): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  beginCareer(sim, sim.player);
  if (!passportOf(sim.player, sim.now)) documentsOf(sim.player).push({ id: 'pp', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  return sim;
}
const walk = (sim: Simulation, to: number) => { while (sim.now < to) sim.advanceTo(Math.min(to, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };

describe('a job’s trip, flown', () => {
  it('takes the latest flight that lands ten hours before the call, overnight to London the day before, and a train for New Haven to New York', () => {
    const sim = pro('trip-plan');
    const call = at(2026, 11, 10, 8);
    const london = careerTrip(sim, 'us-ny-newyork', 'uk-eng-london', call, 'out')!;
    expect(london.legs[london.legs.length - 1]!.arriveAt).toBeLessThanOrEqual(call - 10 * MS_HOUR);
    // The latest such: the one after it lands too late.
    const later = careerTrip(sim, 'us-ny-newyork', 'uk-eng-london', call + 12 * MS_HOUR, 'out')!;
    expect(later.legs[0]!.departAt).toBeGreaterThan(london.legs[0]!.departAt);
    // None that would have left already.
    expect(careerTrip(sim, 'us-ny-newyork', 'uk-eng-london', sim.now + 20 * MS_HOUR, 'out')).toBeUndefined();
    // New Haven to New York is a train: the Regional on the production’s ticket, Metro-North on the actor’s own.
    expect(careerTrip(sim, 'us-ct-newhaven', 'us-ny-newyork', call, 'out')!.by).toBe('nec-nyp-nhv-ner');
    expect(careerTrip(sim, 'us-ct-newhaven', 'us-ny-newyork', call, 'out', 'self')!.by).toBe('mnr-nhv-gct');
    // Too near to fly, with no train: none.
    expect(careerTrip(sim, 'us-ny-newyork', 'us-ny-brooklyn', call, 'out')).toBeUndefined();
    // Home, the first that leaves after.
    const back = careerTrip(sim, 'uk-eng-london', 'us-ny-newyork', call, 'back')!;
    expect(back.legs[0]!.departAt).toBeGreaterThanOrEqual(call);
    expect(back.legs[0]!.departAt - call).toBeLessThan(MS_DAY);
  });

  it('flies an actor to a location on the production’s ticket, there when it lands and ten hours before the first call, and home again', () => {
    const sim = pro('trip-production');
    const b: Booking = { id: 'tor', roleId: 'costar', cityId: 'us-ny-newyork', location: 'ca-on-toronto', starts: at(2026, 10, 5, 8), units: 2, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    const out = sim.universe.scheduled.find((i) => i.kind === 'career.travel' && i.payload.bookingId === 'tor' && i.payload.direction === 'out')!;
    expect(out.payload.slot).toBeDefined();
    const call = sim.universe.scheduled.find((i) => i.kind === 'career.work' && i.payload.bookingId === 'tor')!;
    walk(sim, out.at + 60_000);
    const j = journeysOf(sim.player).find((x) => x.bookingId === 'tor')!;
    expect(j.paidBy).toBe('production');
    expect(j.leaveAt).toBe(out.at);
    expect(j.arriveAt).toBeLessThanOrEqual(call.at - 10 * MS_HOUR);
    // Underway, not there yet.
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    walk(sim, j.arriveAt + (j.lateMinutes ?? 0) * 60_000 + 60_000);
    expect(sim.player.currentLocationId).toBe('ca-on-toronto');
    expect(sim.player.stay?.kind).toBe('hotel');
    // The production's ticket: nothing of it from the actor's bank.
    expect(sim.universe.transactions.some((t) => /fare/i.test(t.memo))).toBe(false);
    walk(sim, call.at + 5 * MS_DAY);
    const home = journeysOf(sim.player).find((x) => x.bookingId === 'tor' && x.toCity === 'us-ny-newyork')!;
    expect(home.status).toBe('arrived');
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
  }, 60_000);

  it('has an actor from Los Angeles pay their own fare to a job in New York, a cost of the work, and home again', () => {
    const sim = pro('trip-self', 'us-ca-losangeles');
    const b: Booking = { id: 'ny', roleId: 'costar', cityId: 'us-ny-newyork', starts: at(2026, 10, 5, 8), units: 2, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    const out = sim.universe.scheduled.find((i) => i.kind === 'career.stay' && i.payload.bookingId === 'ny' && i.payload.direction === 'out')!;
    expect(out.payload.slot).toBeDefined();
    walk(sim, out.at + 60_000);
    const fare = sim.universe.transactions.find((t) => t.memo === 'The fare to New York, for the job')!;
    expect(fare).toBeDefined();
    const paid = fare.postings.find((p) => p.amount > 0)!.amount;
    expect(earningsOf(sim.player).years[2026]!.jobCosts).toBeGreaterThanOrEqual(paid);
    const j = journeysOf(sim.player).find((x) => x.bookingId === 'ny')!;
    expect(j.paidBy).toBe('self');
    expect(sim.player.currentLocationId).toBe('us-ca-losangeles');
    walk(sim, j.arriveAt + (j.lateMinutes ?? 0) * 60_000 + 60_000);
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    walk(sim, at(2026, 10, 10));
    expect(sim.universe.transactions.some((t) => t.memo === 'The fare home from New York, for the job')).toBe(true);
    expect(sim.player.currentLocationId).toBe('us-ca-losangeles');
  }, 60_000);
});
