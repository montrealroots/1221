/**
 * A child along (`travel.child` in `systems/companions.ts`, from 2026-10-03):
 * on a lap under two at the airlines' rules, a seat from two, both ways on a
 * round trip, and a place in the room.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { journeysOf, planJourney, type Journey } from '@/engine/systems/journey';
import { LAP_CHILD, childFare, childRefusal, companionRefusal } from '@/engine/systems/companions';
import { childrenOf, type Child } from '@/engine/systems/children';
import { childBorderRefusal, childPassportTerms } from '@/engine/systems/childpassports';
import { CHILD_PASSPORTS } from '@/engine/content/childpassports';
import { contactsOf } from '@/engine/systems/people';

const YEAR = 365.2425 * MS_DAY;
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const life = (city: string, seed: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 50_000_00, 'USD');
  return sim;
};
function saturday(sim: Simulation, after: number): number {
  const p = zonedParts(sim.now + after * MS_DAY, sim.zone);
  for (let d = 0; d < 7; d += 1) {
    const at = instantFromZoned({ ...normalDate(p.year, p.month, p.day + d), hour: 12 }, sim.zone);
    if (zonedParts(at, sim.zone).weekday === 6) return at;
  }
  throw new Error('no saturday');
}
const book = (sim: Simulation, toCity: string, extra: Record<string, unknown> = {}) => {
  const day = saturday(sim, 14);
  const r = sim.execute<{ journeyId: string; returnId?: string }>({ kind: 'travel.book', payload: { toCity, day, slot: 1, returnDay: day + 4 * MS_DAY, returnSlot: 1, ...extra } });
  expect(r.ok, r.error).toBe(true);
  const find = (id: string | undefined) => journeysOf(sim.player).find((j) => j.id === id);
  return { out: find(r.value!.journeyId)!, back: find(r.value!.returnId) };
};
const flights = (j: Journey) => j.legs.filter((l) => l.mode === 'flight');
const kid = (sim: Simulation, years: number, extra: Record<string, unknown> = {}) => {
  const k: Child = { id: `k${years}`, name: `Kit ${years}`, born: sim.now - years * YEAR, ...extra };
  childrenOf(sim.player).push(k);
  return k;
};

describe('a child along', () => {
  it('under two flies on your lap free within America, and takes no bed', () => {
    const sim = life('us-ny-newyork', 'kid-lap-us');
    const baby = kid(sim, 1);
    const { out, back } = book(sim, 'us-ca-losangeles');
    expect(childFare(sim, out, baby)).toBe(0);
    const r = sim.execute<{ paid: number }>({ kind: 'travel.child', payload: { journeyId: out.id, childId: baby.id } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(0);
    expect(out.childIds).toEqual([baby.id]);
    expect(back!.childIds).toEqual([baby.id]);
    // The room's other place is still free for a child of five.
    const five = kid(sim, 5);
    expect(childRefusal(sim, sim.player, out.id, five.id)).toBeUndefined();
    expect(sim.execute({ kind: 'travel.child', payload: { journeyId: out.id, childId: five.id } }).ok).toBe(true);
    const friend = contactsOf(sim.player)[0];
    if (friend) expect(companionRefusal(sim.player, out.id, friend.id).refused).toBe('The room sleeps no more.');
  });

  it('from two, a seat at the fare both ways, and a place in the room', () => {
    const sim = life('us-ny-newyork', 'kid-seat');
    const five = kid(sim, 5);
    const { out, back } = book(sim, 'us-ca-losangeles');
    const fares = [...flights(out), ...flights(back!)].reduce((a, l) => a + l.fare, 0);
    const bank = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const total = out.total;
    const r = sim.execute<{ paid: number }>({ kind: 'travel.child', payload: { journeyId: out.id, childId: five.id } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(fares);
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(bank - fares);
    expect(out.total - total).toBe(flights(out).reduce((a, l) => a + l.fare, 0));
    // The town's room sleeps two: the child takes the other place.
    const seven = kid(sim, 7);
    expect(childRefusal(sim, sim.player, out.id, seven.id)).toBe('The room sleeps no more.');
    expect(childRefusal(sim, sim.player, out.id, five.id)).toBe('They’re coming already.');
    expect(childRefusal(sim, sim.player, back!.id, seven.id)).toBe('Bring them on the way out.');
  });

  it('on a lap within Europe at Aer Lingus’s €25 a flight; across the Atlantic a tenth of the fare', () => {
    const ie = life('ie-lei-dublin', 'kid-lap-ie');
    const baby = kid(ie, 1);
    const { out } = book(ie, 'uk-eng-london');
    expect(childFare(ie, out, baby)).toBe(flights(out).length * inSave(ie, LAP_CHILD.europeEur * 100, 'EUR'));
    const ny = life('us-ny-newyork', 'kid-lap-abroad');
    const infant = kid(ny, 1);
    const legs = planJourney(ny, 'us-ny-newyork', 'uk-eng-london', saturday(ny, 14), 1, 0);
    if (typeof legs === 'string') throw new Error(legs);
    const far = { legs, leaveAt: legs[0]!.departAt } as Journey;
    expect(childFare(ny, far, infant)).toBe(flights(far).reduce((a, l) => a + Math.round(l.fare * 0.1), 0));
    expect(childFare(ny, far, infant)).toBeGreaterThan(0);
  });

  it('only a child who lives with you', () => {
    const sim = life('us-ny-newyork', 'kid-away');
    const theirs = kid(sim, 9, { livesWith: 'them' });
    const grown = kid(sim, 19);
    const { out } = book(sim, 'us-ca-losangeles');
    expect(childRefusal(sim, sim.player, out.id, theirs.id)).toBe('Kit lives with their other parent.');
    expect(childRefusal(sim, sim.player, out.id, grown.id)).toBe('That isn’t a child of yours.');
    // A train's child fare wasn't read; a car takes them for nothing.
    expect(childFare(sim, { ...out, by: 'nec-nyp-was-acela' }, theirs)).toBe('SLATE keeps no child’s fare for the train, so a child goes by air or by road.');
    expect(childFare(sim, { ...out, by: 'car:v1' }, theirs)).toBe(0);
  });
});

describe('a child’s passport (requirement 47m, from 2026-10-05)', () => {
  it('is needed to cross a border, applied for at the child fee, and ready after its office’s days', () => {
    const sim = life('us-ny-newyork', 'kid-passport');
    const child = kid(sim, 8);
    const { out } = book(sim, 'ca-on-toronto');
    expect(childRefusal(sim, sim.player, out.id, child.id)).toBe('Kit has no passport for crossing a border.');
    const terms = childPassportTerms(sim.player, child, sim.now) as { fee: number; days: number; years: number; adult: boolean };
    expect(terms).toMatchObject({ fee: 135, currency: 'USD', years: 5, days: 42, adult: false });
    const r = sim.must<{ paid: number; readyAt: number }>({ kind: 'children.passport', payload: { childId: child.id } });
    expect(r.paid).toBe(inSave(sim, 135_00, 'USD'));
    expect(r.readyAt - sim.now).toBe(42 * MS_DAY);
    // Booked for two weeks out, it won't be ready by then.
    expect(childRefusal(sim, sim.player, out.id, child.id)).toBe('Kit’s passport won’t be ready by then.');
    // Ready in time for a trip two months out, it goes.
    child.passport!.readyAt = sim.now;
    expect(childRefusal(sim, sim.player, out.id, child.id)).toBeUndefined();
    // Within the country, none is asked for.
    expect(childBorderRefusal(kid(sim, 9), 'us-ny-newyork', 'us-ca-losangeles', out.leaveAt, undefined)).toBeUndefined();
  });

  it('is the adult’s past the child’s ages, and Mexico’s one-year passport under three', () => {
    const sim = life('us-ny-newyork', 'kid-passport-ages');
    expect(childPassportTerms(sim.player, kid(sim, 17), sim.now)).toMatchObject({ adult: true, years: 10 });
    expect(CHILD_PASSPORTS.MX!.infant).toEqual({ under: 3, fee: 920, years: 1 });
    expect(CHILD_PASSPORTS.GB!.fee).toBe(66.5);
  });
});
