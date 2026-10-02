/**
 * A later check-out (`systems/latecheckout.ts`, `content/latecheckout.ts`,
 * from 2026-10-02): bought the morning of it at the five hotels that publish
 * its price, flat, a share of the night or by the hour, free under the
 * Hoxton's Flexy Time; and once checked out, the room gone until leaving.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { exchange } from '@/engine/content/currency';
import { namedStayQuote } from '@/engine/systems/hotels';
import { lateQuote, roomGone } from '@/engine/systems/latecheckout';
import { lookAfterRefusal } from '@/engine/systems/life';
import { planJourney, type Journey } from '@/engine/systems/journey';

const life = (seed: string, from = 'us-ny-newyork') => quickSave({ startLocationId: from, homeRegionId: from, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const ZONES: Record<string, string> = { 'uk-eng-london': 'Europe/London', 'us-ca-losangeles': 'America/Los_Angeles', 'mx-cmx-mexicocity': 'America/Mexico_City' };

/** Books a stay at a named hotel some days ahead, with a way home the evening of check-out, and plays to the morning of it. */
function stay(sim: Simulation, toCity: string, hotelId: string, room: string, ahead: number, hoursBefore = 3): { out: Journey; back: Journey; zone: string } {
  const p = zonedParts(sim.now + ahead * MS_DAY, sim.zone);
  const day = instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone);
  const zone = ZONES[toCity]!;
  // The way home's latest departure that day, an evening's.
  const slots = Array.from({ length: 12 }, (_, i) => i).map((i) => ({ i, legs: planJourney(sim, toCity, sim.player.currentLocationId, day + 2 * MS_DAY, i, 0) }));
  const latest = slots.filter((x) => typeof x.legs !== 'string').sort((a, b) => zonedParts((b.legs as { departAt: number }[])[0]!.departAt, zone).hour - zonedParts((a.legs as { departAt: number }[])[0]!.departAt, zone).hour)[0]!.i;
  const r = sim.execute<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity, day, slot: 1, nights: 2, hotelId, room, returnDay: day + 2 * MS_DAY, returnSlot: latest } });
  expect(r.ok, r.error).toBe(true);
  const out = sim.player.journeys!.find((x) => x.id === r.value!.journeyId)!;
  const back = sim.player.journeys!.find((x) => x.id === r.value!.returnId)!;
  while (out.status !== 'arrived' && sim.now < out.arriveAt + 2 * MS_DAY) sim.advanceTo(sim.now + 30 * 60_000);
  sim.advanceTo(out.hotel!.checkOutAt - hoursBefore * 3_600_000);
  return { out, back, zone };
}

describe('a later check-out', () => {
  it('at Freehand: half the night’s own rate, to three; the check-out moves, and the room stays until then', () => {
    const sim = life('lc-freehand');
    const { out, back, zone } = stay(sim, 'us-ca-losangeles', 'freehand-los-angeles', 'Bunk Room', 10);
    expect(zonedParts(back.leaveAt, zone).hour).toBeGreaterThanOrEqual(15);
    const q = lateQuote(sim, sim.player, out.id);
    if (typeof q === 'string') throw new Error(q);
    const night = namedStayQuote(sim, 'freehand-los-angeles', 'Bunk Room', 'flexible', out.hotel!.checkOutAt - MS_DAY, 1)!.price;
    expect(q.price).toBe(Math.round(night * 0.5));
    expect(zonedParts(q.until, zone)).toMatchObject({ hour: 15, minute: 0 });
    const r = sim.execute({ kind: 'travel.late_checkout', payload: { journeyId: out.id } });
    expect(r.ok, r.error).toBe(true);
    expect(lateQuote(sim, sim.player, out.id)).toBe('You’re checking out late already.');
    // Past the usual hour, still in the room.
    sim.advanceTo(out.hotel!.checkOutAt + 60 * 60_000);
    expect(roomGone(sim.player)).toBe(false);
    sim.advanceTo(q.until + 60_000);
    expect(roomGone(sim.player)).toBe(true);
    sim.player.wellbeing.hygiene = 20;
    expect(lookAfterRefusal(sim, 'wash')).toBe('You’ve checked out, and the room is gone until you leave.');
    // A hotel publishing no price sells none.
    out.hotel!.named = { hotelId: 'hollywood-roosevelt', room: 'x' };
    delete out.hotel!.lateUntil;
    expect(lateQuote(sim, sim.player, out.id)).toBe('The Hollywood Roosevelt publishes no price for a later check-out; ask at the desk.');
  });

  it('at the Hoxton: free booked three days ahead, £10 an hour otherwise', () => {
    const ahead = life('lc-hox-ahead', 'ie-lei-dublin');
    const a = stay(ahead, 'uk-eng-london', 'hoxton-holborn', 'Shoebox', 10);
    expect(lateQuote(ahead, ahead.player, a.out.id)).toMatchObject({ price: 0 });
    const late = life('lc-hox-late', 'ie-lei-dublin');
    const b = stay(late, 'uk-eng-london', 'hoxton-holborn', 'Shoebox', 1);
    expect(b.out.arriveAt - b.out.bookedAt).toBeLessThan(72 * 3_600_000);
    expect(lateQuote(late, late.player, b.out.id)).toMatchObject({ price: exchange(40_00, 'GBP', 'EUR') });
  });

  it('at Hotel Catedral, a flat MX$553', () => {
    const sim = life('lc-catedral');
    const { out } = stay(sim, 'mx-cmx-mexicocity', 'hotel-catedral-cdmx', 'Standard Queen Room - Cathedral Tower', 10, 27);
    expect(lateQuote(sim, sim.player, out.id)).toBe('A later check-out is asked for on the morning you leave.');
    sim.advanceTo(out.hotel!.checkOutAt - 3 * 3_600_000);
    expect(lateQuote(sim, sim.player, out.id)).toMatchObject({ price: exchange(553_00, 'MXN', 'USD') });
  });
});
