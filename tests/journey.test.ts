/**
 * A journey by air, and somewhere to stay (docs/WORLD.md, stage 2a): booked,
 * paid, kept on the calendar, taken or missed, late or canceled at the
 * published rates, and arrived at, with the town and the clock changing only
 * then; out and back across a border, and saved and opened on the way.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { documentsOf, type PersonDocument } from '@/engine/systems/documents';
import { flightFate, journeysOf, planJourney, type Journey } from '@/engine/systems/journey';
import { stayPrice } from '@/engine/systems/stays';
import { AIR } from '@/engine/content/air';
import { DOT_PAIRS } from '@/engine/content/airfares';

const YEAR = 365.25 * MS_DAY;
function life(seed: string, town = 'us-ny-newyork'): Simulation {
  const sim = quickSave({ startLocationId: town, homeRegionId: town, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.documents = [];
  return sim;
}
const papers = (sim: Simulation, issuer = 'US', extra: Partial<PersonDocument>[] = []) => {
  documentsOf(sim.player).push({ id: 'pp', kind: 'passport', issuer, name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - YEAR, expiresAt: sim.now + 8 * YEAR });
  for (const [n, d] of extra.entries()) documentsOf(sim.player).push({ id: `x${n}`, kind: 'authorization', issuer: 'GB', name: 'ETA', number: 'E', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 2 * YEAR, passportId: 'pp', ...d });
};
const bank = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && (a.kind === 'checking' || a.kind === 'savings')).reduce((x, a) => x + a.balance, 0);
/** Noon on the next Saturday at least some days on, in the save's zone: a day with no classes. */
function saturday(sim: Simulation, after: number): number {
  const p = zonedParts(sim.now + after * MS_DAY, sim.zone);
  for (let d = 0; d < 7; d += 1) {
    const at = instantFromZoned({ ...normalDate(p.year, p.month, p.day + d), hour: 12 }, sim.zone);
    if (zonedParts(at, sim.zone).weekday === 6) return at;
  }
  throw new Error('no saturday');
}
/** Lives to a moment as a person does, asleep from eleven each night. */
function liveTo(sim: Simulation, target: number): void {
  for (let guard = 0; sim.now < target && guard < 10_000; guard += 1) {
    const zone = sim.universe.currentZone;
    const p = zonedParts(sim.now, zone);
    let night = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 23 }, zone);
    if (night <= sim.now) night = instantFromZoned({ ...normalDate(p.year, p.month, p.day + 1), hour: 23 }, zone);
    if (night >= target) { sim.advanceBy(target - sim.now); return; }
    sim.advanceBy(night - sim.now);
    sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
  }
}
const book = (sim: Simulation, payload: Record<string, unknown>) => sim.execute<{ journeyId: string; returnId?: string; leaveAt: number; arriveAt: number; total: number }>({ kind: 'travel.book', payload });
const journey = (sim: Simulation, id: string): Journey => journeysOf(sim.player).find((j) => j.id === id)!;

describe('a journey out and back', () => {
  it('flies a New Yorker to London on the ETA, into a hotel for five nights, and home again, the town and the clock changing on arrival', () => {
    const sim = life('ny-london');
    papers(sim, 'US', [{ destination: 'GB' }]);
    const before = bank(sim);
    const out = book(sim, { toCity: 'uk-eng-london', day: saturday(sim, 10), slot: 2, bags: 1, nights: 5 });
    expect(out.ok, out.error).toBe(true);
    const j = journey(sim, out.value!.journeyId);
    expect(j.legs.map((l) => l.mode)).toEqual(['ground', 'check-in', 'flight', 'arrival', 'ground']);
    expect(j.legs[2]!.from).toBe('JFK');
    expect(j.legs[2]!.to).toBe('LHR');
    // Three hours before an international flight, and the first bag included across the ocean.
    expect(j.legs[1]!.arriveAt - j.legs[1]!.departAt).toBe(AIR.arriveBeforeInternationalMinutes * 60_000);
    expect(j.legs[1]!.fare).toBe(0);
    expect(before - bank(sim)).toBe(j.total);
    expect(j.hotel!.price).toBe(stayPrice(sim, 'uk-eng-london', 5)!.price);
    // On the calendar as one commitment.
    const item = sim.universe.scheduled.find((i) => i.kind === 'travel.leave' && i.status === 'pending')!;
    expect(item.requiresPlayer).toBe(true);
    expect(item.durationMinutes).toBe(Math.round((j.arriveAt - j.leaveAt) / 60_000));
    // Home until it lands.
    liveTo(sim, j.legs[2]!.departAt + MS_HOUR);
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    liveTo(sim, j.arriveAt + (j.lateMinutes ?? 0) * 60_000 + 6 * MS_HOUR);
    expect(j.status).toBe('arrived');
    expect(sim.player.currentLocationId).toBe('uk-eng-london');
    // Five hours out, the body still on New York's clock (`systems/jetlag.ts`).
    expect(Math.round(Math.abs(sim.player.bodyClock?.hours ?? 0))).toBeGreaterThanOrEqual(4);
    expect(sim.universe.currentZone).toBe('Europe/London');
    expect(sim.player.stay?.kind).toBe('hotel');
    // Home before check-out.
    const back = book(sim, { toCity: 'us-ny-newyork', day: j.hotel!.checkOutAt - 6 * MS_HOUR, slot: 1, bags: 1 });
    expect(back.ok, back.error).toBe(true);
    const b = journey(sim, back.value!.journeyId);
    expect(b.fromCity).toBe('uk-eng-london');
    liveTo(sim, b.arriveAt + (6 + 5) * MS_HOUR);
    expect(b.status).toBe('arrived');
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    expect(sim.player.stay).toBeUndefined();
  }, 120_000);

  it('prices a domestic flight at the DOT’s average for the markets, with the bag at $45', () => {
    const sim = life('ny-la');
    const legs = planJourney(sim, 'us-ny-newyork', 'us-ca-losangeles', saturday(sim, 10), 0, 1);
    if (typeof legs === 'string') throw new Error(legs);
    const flight = legs.find((l) => l.mode === 'flight')!;
    const pair = DOT_PAIRS['Los Angeles, CA (Metropolitan Area)|New York City, NY (Metropolitan Area)']!;
    expect(flight.fare).toBe(Math.round(pair.usd * 100));
    expect(legs.find((l) => l.mode === 'check-in')!.fare).toBe(45_00);
    expect(legs[1]!.arriveAt - legs[1]!.departAt).toBe(AIR.arriveBeforeDomesticMinutes * 60_000);
  });
});

describe('what a journey refuses', () => {
  it('won’t book without somewhere to sleep, past the bank, or over another commitment', () => {
    const sim = life('refuse');
    papers(sim);
    const day = saturday(sim, 10);
    expect(book(sim, { toCity: 'us-ca-losangeles', day }).error).toMatch(/Somewhere to sleep/);
    const ok = book(sim, { toCity: 'us-ca-losangeles', day, nights: 2 });
    expect(ok.ok, ok.error).toBe(true);
    expect(book(sim, { toCity: 'us-il-chicago', day, nights: 2 }).error).toMatch(/runs into/);
    const poor = life('poor');
    for (const a of Object.values(poor.universe.accounts)) if (a.ownerId === poor.player.id && !a.nominal) a.balance = Math.min(a.balance, 0);
    const was = bank(poor);
    expect(book(poor, { toCity: 'us-ca-losangeles', day: saturday(poor, 10), nights: 2 }).error).toMatch(/more than the bank/);
    expect(bank(poor)).toBe(was);
  });

  it('turns a passenger away at check-in when the passport was lost after booking, and the fare is gone', () => {
    const sim = life('lost-passport');
    papers(sim, 'US', [{ destination: 'GB' }]);
    const out = book(sim, { toCity: 'uk-eng-london', day: saturday(sim, 10), slot: 2, nights: 3 });
    expect(out.ok, out.error).toBe(true);
    expect(sim.execute({ kind: 'documents.report_lost', payload: { documentId: 'pp' } }).ok).toBe(true);
    liveTo(sim, out.value!.leaveAt + MS_HOUR);
    const j = journey(sim, out.value!.journeyId);
    expect(j.status).toBe('missed');
    expect(j.why).toMatch(/wouldn’t board/);
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
  }, 60_000);

  it('is missed by a player who isn’t there to leave', () => {
    const sim = life('not-there');
    const out = book(sim, { toCity: 'us-ca-losangeles', day: saturday(sim, 10), nights: 2 });
    sim.player.currentLocationId = 'us-ct-newhaven';
    liveTo(sim, out.value!.leaveAt + MS_HOUR);
    expect(journey(sim, out.value!.journeyId).status).toBe('missed');
  }, 60_000);

  it('refunds the whole booking within a day of it when it leaves a week or more on, and only the hotel later', () => {
    const sim = life('cancel');
    const out = book(sim, { toCity: 'us-ca-losangeles', day: saturday(sim, 10), nights: 2 });
    const a = sim.execute<{ refund: number }>({ kind: 'travel.cancel', payload: { journeyId: out.value!.journeyId } });
    expect(a.value!.refund).toBe(out.value!.total);
    const later = book(sim, { toCity: 'us-ca-losangeles', day: saturday(sim, 20), nights: 2 });
    sim.advanceBy(2 * MS_DAY);
    const b = sim.execute<{ refund: number }>({ kind: 'travel.cancel', payload: { journeyId: later.value!.journeyId } });
    expect(b.value!.refund).toBe(journey(sim, later.value!.journeyId).hotel!.price);
  });
});

describe('the flight itself', () => {
  it('is late, on time or canceled at BTS’s 2025 rates', () => {
    const sim = life('rates');
    const n = 20_000;
    let late = 0;
    let canceled = 0;
    let minutes = 0;
    for (let i = 0; i < n; i += 1) {
      const f = flightFate(sim, sim.player, `r${i}`);
      if (f === null) canceled += 1;
      else if (f > 0) { late += 1; minutes += f; }
    }
    expect(canceled / n).toBeGreaterThan(AIR.canceledShare - 0.004);
    expect(canceled / n).toBeLessThan(AIR.canceledShare + 0.004);
    expect(late / n).toBeGreaterThan(AIR.lateShare - 0.01);
    expect(late / n).toBeLessThan(AIR.lateShare + 0.01);
    expect(minutes / late).toBeGreaterThan(AIR.lateMinutesAverage * 0.9);
    expect(minutes / late).toBeLessThan(AIR.lateMinutesAverage * 1.1);
  });

  it('keeps a hotel night on at check-out for a guest still in town, at the rate', () => {
    const sim = life('stay-on');
    papers(sim);
    const out = book(sim, { toCity: 'us-ca-losangeles', day: saturday(sim, 10), slot: 1, nights: 1 });
    const j = journey(sim, out.value!.journeyId);
    liveTo(sim, j.hotel!.checkOutAt - MS_HOUR);
    expect(sim.player.currentLocationId).toBe('us-ca-losangeles');
    const was = bank(sim);
    liveTo(sim, j.hotel!.checkOutAt + MS_HOUR);
    expect(was - bank(sim)).toBeGreaterThanOrEqual(stayPrice(sim, 'us-ca-losangeles', 1)!.price);
    expect(sim.universe.notifications.some((x) => x.title === 'Another Night')).toBe(true);
  }, 60_000);

  it('carries a journey underway through saving and opening, and lands', () => {
    const sim = life('saved-air');
    const out = book(sim, { toCity: 'us-ca-losangeles', day: saturday(sim, 10), slot: 1, nights: 2 });
    const j = journey(sim, out.value!.journeyId);
    liveTo(sim, j.legs[2]!.departAt + MS_HOUR);
    expect(j.status).toBe('underway');
    const opened = loadSave(deserialise(serialise(sim.universe)));
    const again = journeysOf(opened.player).find((x) => x.id === j.id)!;
    liveTo(opened, again.arriveAt + (again.lateMinutes ?? 0) * 60_000 + 6 * MS_HOUR);
    expect(again.status).toBe('arrived');
    expect(opened.player.currentLocationId).toBe('us-ca-losangeles');
    expect(opened.universe.currentZone).toBe('America/Los_Angeles');
  }, 60_000);
});

describe('the rest of the rules', () => {
  it('won’t book over a plan of your own', () => {
    const sim = life('plan-clash');
    const day = saturday(sim, 10);
    const plan = sim.execute({ kind: 'calendar.schedule', payload: { title: 'Dinner', at: day + 2 * MS_HOUR, durationMinutes: 120 } });
    expect(plan.ok, plan.error).toBe(true);
    expect(book(sim, { toCity: 'us-ca-losangeles', day, slot: 1, nights: 2 }).error).toMatch(/runs into Dinner/);
  });

  it('books the way home ahead, from the town the outbound journey takes you to', () => {
    const sim = life('ahead');
    const out = book(sim, { toCity: 'us-ca-losangeles', day: saturday(sim, 10), slot: 1, nights: 3 });
    const home = book(sim, { toCity: 'us-ny-newyork', day: saturday(sim, 10) + 2 * MS_DAY, slot: 1 });
    expect(home.ok, home.error).toBe(true);
    expect(journey(sim, home.value!.journeyId).fromCity).toBe('us-ca-losangeles');
    expect(journey(sim, home.value!.journeyId).legs[2]!.from).toBe('LAX');
    expect(out.ok).toBe(true);
  });

  it('prices a New York night at its average rate with its taxes on top: $333.71, 14.75% and $3.50', () => {
    const sim = life('ny-night');
    expect(stayPrice(sim, 'us-ny-newyork', 1)!.price).toBe(Math.round((333.71 * 1.1475 + 3.5) * 100));
  });
});

describe('a round trip', () => {
  it('is one booking: both flights at BTS’s round-trip share, the hotel from the night it lands to the morning it flies home', () => {
    const sim = life('round');
    const day = saturday(sim, 10);
    const one = planJourney(sim, 'us-ny-newyork', 'us-ca-losangeles', day, 1, 0);
    if (typeof one === 'string') throw new Error(one);
    const a = book(sim, { toCity: 'us-ca-losangeles', day, slot: 1, returnDay: day + 4 * MS_DAY, returnSlot: 1 });
    expect(a.ok, a.error).toBe(true);
    const out = journey(sim, a.value!.journeyId);
    const back = journey(sim, a.value!.returnId!);
    expect(out.tripId).toBeDefined();
    expect(back.tripId).toBe(out.tripId);
    expect(back.fromCity).toBe('us-ca-losangeles');
    const flight = (legs: { mode: string; fare: number }[]) => legs.find((l) => l.mode === 'flight')!.fare;
    expect(flight(out.legs)).toBe(Math.round(flight(one) * AIR.roundTripShare));
    expect(AIR.roundTripShare).toBeCloseTo(535 / 614, 6);
    // Lands Saturday evening, flies home Wednesday afternoon: four nights.
    expect(out.hotel!.nights).toBe(4);
    expect(out.hotel!.price).toBe(stayPrice(sim, 'us-ca-losangeles', 4)!.price);
  });

  it('is canceled whole, either half, and refunded whole within the DOT’s day', () => {
    const sim = life('round-cancel');
    const day = saturday(sim, 10);
    const before = bank(sim);
    const a = book(sim, { toCity: 'us-ca-losangeles', day, slot: 1, returnDay: day + 3 * MS_DAY, returnSlot: 1 });
    const back = a.value!.returnId!;
    const c = sim.execute<{ refund: number }>({ kind: 'travel.cancel', payload: { journeyId: back } });
    expect(c.value!.refund).toBe(a.value!.total);
    expect(bank(sim)).toBe(before);
    expect(journeysOf(sim.player).every((j) => j.status === 'canceled')).toBe(true);
  });

  it('loses the way home when the way out goes unflown, as an airline cancels the rest of the ticket', () => {
    const sim = life('round-noshow');
    const day = saturday(sim, 10);
    const a = book(sim, { toCity: 'us-ca-losangeles', day, slot: 1, returnDay: day + 3 * MS_DAY, returnSlot: 1 });
    sim.player.currentLocationId = 'us-ct-newhaven';
    liveTo(sim, a.value!.leaveAt + MS_HOUR);
    const back = journey(sim, a.value!.returnId!);
    expect(journey(sim, a.value!.journeyId).status).toBe('missed');
    expect(back.status).toBe('canceled');
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.payload.journeyId === back.id)).toBe(false);
  }, 60_000);
});

describe('a cabin other than economy', () => {
  it('prices business or first at IATA’s five times economy, with two bags that come with it, and books it', () => {
    const sim = life('cabin-premium');
    papers(sim);
    const day = saturday(sim, 10);
    const economy = planJourney(sim, 'us-ny-newyork', 'us-ca-losangeles', day, 1, 2);
    const premium = planJourney(sim, 'us-ny-newyork', 'us-ca-losangeles', day, 1, 2, 'premium');
    if (typeof economy === 'string' || typeof premium === 'string') throw new Error('no plan');
    const flight = (legs: typeof economy) => legs.filter((l) => l.mode === 'flight').reduce((a, l) => a + l.fare, 0);
    const bags = (legs: typeof economy) => legs.find((l) => l.mode === 'check-in')!.fare;
    expect(AIR.premiumMultiple).toBe(5);
    expect(Math.abs(flight(premium) - flight(economy) * 5)).toBeLessThanOrEqual(5);
    expect(bags(economy)).toBeGreaterThan(0);
    expect(bags(premium)).toBe(0);
    const r = book(sim, { toCity: 'us-ca-losangeles', day, slot: 1, bags: 2, nights: 2, cabin: 'premium' });
    expect(r.ok, r.error).toBe(true);
    expect(journey(sim, r.value!.journeyId).cabin).toBe('premium');
    // A train takes no cabin: the Acela booked as business or first is booked as it comes.
    const other = life('cabin-train');
    papers(other);
    const t = book(other, { toCity: 'us-dc-washington', day, slot: 4, nights: 1, by: 'nec-nyp-was-acela', cabin: 'premium' });
    expect(t.ok, t.error).toBe(true);
    expect(journey(other, t.value!.journeyId).cabin).toBeUndefined();
  });
});
