/**
 * Crossing a border with the papers held (docs/WORLD.md, stage 1b): a job
 * abroad is taken only if the actor could go and come back, the flight out
 * turns back an actor whose papers have gone since, and a home abroad is
 * lived in only with the right to live there.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { acceptRefusal, beginCareer, careerOf, type Booking } from '@/engine/systems/career';
import { documentsOf, passportOf, residenceRefusal, type PersonDocument } from '@/engine/systems/documents';
import { askingPrice, listingsIn, moveInRefusal, offerRefusal, type OwnedHome } from '@/engine/systems/homes';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
const YEAR = 365.25 * MS_DAY;

/** A working actor living where they were born, holding no papers. */
function pro(seed: string, city = 'us-ny-newyork'): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  beginCareer(sim, sim.player);
  sim.player.documents = [];
  return sim;
}
const passport = (sim: Simulation, issuer = 'US'): PersonDocument => {
  const d: PersonDocument = { id: `p${documentsOf(sim.player).length}`, kind: 'passport', issuer, name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - YEAR, expiresAt: sim.now + 6 * YEAR };
  documentsOf(sim.player).push(d);
  return d;
};
const job = (sim: Simulation, id: string, location: string): Booking => {
  const b: Booking = { id, roleId: 'costar', cityId: 'us-ny-newyork', location, starts: at(2026, 10, 5, 8), units: 5, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
  careerOf(sim.player).bookings.push(b);
  return b;
};

describe('a job abroad', () => {
  it('is refused without a passport, then without the UK’s ETA, and taken with both', () => {
    const sim = pro('border-london');
    const b = job(sim, 'ldn', 'uk-eng-london');
    expect(acceptRefusal(sim, sim.player, b)).toMatch(/passport/i);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(false);
    passport(sim);
    expect(acceptRefusal(sim, sim.player, b)).toMatch(/ETA/);
    expect(sim.execute({ kind: 'documents.apply_authorization', payload: { destination: 'GB' } }).ok).toBe(true);
    sim.advanceBy(2 * MS_HOUR);
    expect(acceptRefusal(sim, sim.player, b)).toBeUndefined();
    // A job at home asks nothing of the papers.
    sim.player.documents = [];
    const home = { ...job(sim, 'nyc', 'us-ny-newyork'), location: undefined };
    careerOf(sim.player).bookings.push(home);
    expect(acceptRefusal(sim, sim.player, home)).toBeUndefined();
  });

  it('turns an actor back on the travel day when the passport was lost after the job was taken, and the production recasts', () => {
    const sim = pro('border-lost');
    const p = passport(sim);
    const b = job(sim, 'tor', 'ca-on-toronto');
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'documents.report_lost', payload: { documentId: p.id } }).ok).toBe(true);
    while (sim.now < at(2026, 10, 5, 12)) sim.advanceTo(Math.min(at(2026, 10, 5, 12), sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true });
    expect(b.status).toBe('released');
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.payload.bookingId === 'tor')).toBe(false);
    expect(sim.universe.notifications.some((n) => n.title === 'Turned Back At The Border' && /passport/i.test(n.body))).toBe(true);
  }, 60_000);
});

describe('a job in New York for an actor who lives in Dublin', () => {
  it('asks the ESTA an Irish citizen enters on and the O-1 they work on, and turns them back if the passport goes before the flight', () => {
    const sim = pro('border-dublin', 'ie-lei-dublin');
    const p = passport(sim, 'IE');
    const b: Booking = { id: 'nyc', roleId: 'costar', cityId: 'us-ny-newyork', starts: at(2026, 10, 5, 8), units: 5, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    expect(acceptRefusal(sim, sim.player, b)).toMatch(/ESTA/);
    documentsOf(sim.player).push({ id: 'esta', kind: 'authorization', issuer: 'US', name: 'ESTA', number: 'E1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + YEAR, destination: 'US', passportId: p.id });
    // In as a visitor, but a visitor doesn't work: an O-1 does.
    expect(acceptRefusal(sim, sim.player, b)).toMatch(/Work in the United States needs permission/);
    documentsOf(sim.player).push({ id: 'o1', kind: 'permit', issuer: 'US', name: 'O-1B Status', number: 'O1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 3 * YEAR, destination: 'US' });
    expect(acceptRefusal(sim, sim.player, b)).toBeUndefined();
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'documents.report_lost', payload: { documentId: p.id } }).ok).toBe(true);
    while (sim.now < at(2026, 10, 5, 12)) sim.advanceTo(Math.min(at(2026, 10, 5, 12), sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true });
    expect(b.status).toBe('released');
    expect(sim.player.currentLocationId).toBe('ie-lei-dublin');
  }, 60_000);
});

describe('living across a border', () => {
  const home = (cityId: string) => ({ id: 'h1', cityId, tenancies: [], selling: false }) as unknown as OwnedHome;

  it('keeps a US citizen from moving into a London home they own, and lets an Irish citizen, and a student on an F-1 in New York', () => {
    const us = pro('live-us');
    passport(us);
    us.player.currentLocationId = 'uk-eng-london';
    expect(moveInRefusal(us, us.player, home('uk-eng-london'))).toMatch(/permission to live there/);
    const ie = pro('live-ie', 'ie-lei-dublin');
    ie.player.currentLocationId = 'uk-eng-london';
    expect(residenceRefusal(ie.player, 'uk-eng-london', ie.now)).toBeUndefined();
    expect(moveInRefusal(ie, ie.player, home('uk-eng-london'))).toBeUndefined();
    const gb = pro('live-gb', 'uk-eng-london');
    expect(residenceRefusal(gb.player, 'us-ny-newyork', gb.now)).toMatch(/permission/);
    documentsOf(gb.player).push({ id: 'f1', kind: 'visa', issuer: 'US', name: 'F-1 Student Visa', number: 'F1', status: 'valid', issuedAt: gb.now - MS_DAY, expiresAt: gb.now + YEAR, destination: 'US' });
    expect(residenceRefusal(gb.player, 'us-ny-newyork', gb.now)).toBeUndefined();
    // Its visa run out, a home in New York isn't bought to live in, though one can be bought to let.
    documentsOf(gb.player).find((d) => d.id === 'f1')!.expiresAt = gb.now - MS_DAY;
    gb.player.currentLocationId = 'us-ny-newyork';
    gb.player.home = { ...gb.player.home!, cityId: 'us-ny-newyork' };
    const listing = listingsIn(gb, 'us-ny-newyork')[0]!;
    expect(offerRefusal(gb, gb.player, listing.id, askingPrice(gb, listing), 0.2, true)).toMatch(/permission to live there/);
    expect(offerRefusal(gb, gb.player, listing.id, askingPrice(gb, listing), 0.2, false) ?? '').not.toMatch(/permission to live there/);
    // A citizen at home, whatever papers.
    expect(passportOf(pro('live-home').player, us.now)).toBeUndefined();
    expect(residenceRefusal(pro('live-home2').player, 'us-ca-losangeles', us.now)).toBeUndefined();
  }, 60_000);
});
