/**
 * Journeys by train (`content/rail.ts`, `systems/rail.ts`, from 2026-09-29):
 * the operators' times, fares and punctuality, and a train booked, taken,
 * canceled and ridden by the career.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { AMTRAK_PER_MILE, NEC_MILES, RAIL_ROUTES } from '@/engine/content/rail';
import { departureHours, fareAt, fareOf, headwayMinutes, necStretch, planTrain, railRouteById, railRoutes, routeMiles, trainFate, trainFateOf } from '@/engine/systems/rail';
import { journeysOf, startCareerJourney } from '@/engine/systems/journey';
import { documentsOf, passportOf } from '@/engine/systems/documents';

const NY = 'America/New_York';
const route = (id: string) => railRouteById(id)!;

function at(city: string, seed: string) {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  if (!passportOf(sim.player, sim.now)) documentsOf(sim.player).push({ id: 'pp', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  return sim;
}

describe('the routes', () => {
  it('prices Amtrak by its own FY2025 ticket revenue per passenger-mile, Acela dearer than the Regional', () => {
    expect(fareOf(route('nec-nyp-was-acela')).amount).toBe(Math.round((569.7 / 639.1) * 226 * 100));
    expect(fareOf(route('nec-nyp-was-ner')).amount).toBe(Math.round((970.2 / 2062.0) * 226 * 100));
    expect(AMTRAK_PER_MILE.acela).toBeGreaterThan(AMTRAK_PER_MILE.regional);
    // Boston to Washington is both segments.
    expect(routeMiles(route('nec-bos-was-ner'))).toBe(NEC_MILES.newYorkBoston + NEC_MILES.newYorkWashington);
    // Philadelphia: the straight line, stretched as the corridor's segments are.
    const phl = routeMiles(route('nec-nyp-phl-ner'));
    expect(necStretch()).toBeGreaterThan(1);
    // About 91 by the timetables' own mileage; the straight line is about 80.
    expect(phl).toBeGreaterThan(86);
    expect(phl).toBeLessThan(96);
    expect(fareOf(route('nec-nyp-phl-ner')).amount).toBe(Math.round(AMTRAK_PER_MILE.regional * phl * 100));
  });

  it('charges Metro-North’s peak fare on a weekday morning toward New York, and the off-peak otherwise', () => {
    const r = route('mnr-nhv-gct');
    const tuesday7 = instantFromZoned({ year: 2026, month: 10, day: 6, hour: 7 }, NY);
    const tuesday11 = instantFromZoned({ year: 2026, month: 10, day: 6, hour: 11 }, NY);
    const saturday7 = instantFromZoned({ year: 2026, month: 10, day: 10, hour: 7 }, NY);
    expect(fareAt(r, 'us-ct-newhaven', tuesday7).amount).toBe(27_25);
    expect(fareAt(r, 'us-ct-newhaven', tuesday11).amount).toBe(20_25);
    expect(fareAt(r, 'us-ct-newhaven', saturday7).amount).toBe(20_25);
    // Out of New York in the morning isn't the peak.
    expect(fareAt(r, 'us-ny-newyork', tuesday7).amount).toBe(20_25);
  });

  it('runs every route between two of SLATE’s towns, both ways, with its trains spread over the day', () => {
    for (const r of RAIL_ROUTES) {
      expect(railRoutes(r.to, r.from)).toContain(r);
      const hours = departureHours(r);
      expect(hours).toHaveLength(r.perDay);
      expect(hours[0]).toBe(6);
      if (r.perDay > 1) expect(hours[hours.length - 1]).toBe(21);
    }
  });
});

describe('a train’s legs', () => {
  it('puts a traveler at St Pancras 75 minutes before the Paris train, which takes 2 hours 16, at €100 in the save’s money', () => {
    const sim = at('uk-eng-london', 'rail-eurostar');
    const r = route('eurostar-lon-par');
    const legs = planTrain(sim, r, 'uk-eng-london', sim.now + 10 * MS_DAY, 3);
    if (typeof legs === 'string') throw new Error(legs);
    const train = legs.find((l) => l.mode === 'train')!;
    expect(train.arriveAt - train.departAt).toBe(136 * 60_000);
    const board = legs.find((l) => l.mode === 'check-in')!;
    expect(board.arriveAt - board.departAt).toBe(75 * 60_000);
    const cur = saveCurrency(sim.universe);
    expect(train.fare).toBe(cur === 'EUR' ? 100_00 : exchange(100_00, 'EUR', cur));
    expect(train.routeId).toBe('eurostar-lon-par');
    // The way back runs from Paris.
    const back = planTrain(sim, r, 'fr-idf-paris', sim.now + 12 * MS_DAY, 0);
    expect(typeof back === 'string' ? back : back[back.length - 1]!.to).toBe('uk-eng-london');
    expect(planTrain(sim, r, 'us-ny-newyork', sim.now, 0)).toMatch(/doesn’t run from there/);
  });

  it('is late at the operator’s rate, past its own line when it is', () => {
    const sim = at('us-ny-newyork', 'rail-late');
    const r = route('nec-nyp-was-acela');
    let late = 0;
    const N = 20_000;
    for (let i = 0; i < N; i += 1) {
      const m = trainFate(sim, sim.player, r, `t${i}`);
      if (m > 0) { late += 1; expect(m).toBeGreaterThanOrEqual(r.onTime.withinMinutes); }
    }
    expect(Math.abs(late / N - (1 - r.onTime.share))).toBeLessThan(0.01);
  });
});

describe('a train, booked and taken', () => {
  it('runs a journey’s train late at its operator’s rate', () => {
    const sim = at('us-ny-newyork', 'rail-journeys-late');
    const r = route('nec-nyp-was-acela');
    let late = 0;
    const N = 400;
    for (let i = 0; i < N; i += 1) {
      sim.player.currentLocationId = 'us-ny-newyork';
      const j = startCareerJourney(sim, sim.player, 'us-dc-washington', sim.now + MS_DAY, 5, { bookingId: `b${i}`, paidBy: 'production', by: r.id })!;
      if ((j.lateMinutes ?? 0) > 0) late += 1;
    }
    expect(Math.abs(late / N - (1 - r.onTime.share))).toBeLessThan(0.07);
  });

  it('takes a New Yorker to Washington on the Acela, the town changing when it arrives, and charges the fare', () => {
    const sim = at('us-ny-newyork', 'rail-book');
    const p = zonedParts(sim.now + 5 * MS_DAY, NY);
    const day = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 12 }, NY);
    const before = sim.universe.transactions.length;
    const r = sim.execute<{ journeyId: string; leaveAt: number; arriveAt: number; total: number }>({ kind: 'travel.book', payload: { toCity: 'us-dc-washington', day, slot: 8, by: 'nec-nyp-was-acela', nights: 2 } });
    expect(r.ok, r.error).toBe(true);
    expect(sim.universe.transactions.length).toBeGreaterThan(before);
    const j = journeysOf(sim.player).find((x) => x.id === r.value!.journeyId)!;
    expect(j.by).toBe('nec-nyp-was-acela');
    expect(j.legs.some((l) => l.mode === 'flight')).toBe(false);
    // Awake for it: the traveler is up and about.
    sim.player.awakeSince = j.leaveAt - 2 * MS_HOUR;
    let t = sim.now;
    while (t < j.arriveAt + 3 * MS_HOUR) { t = Math.min(j.arriveAt + 3 * MS_HOUR, t + 4 * MS_HOUR); sim.advanceTo(t); if (sim.now < j.leaveAt) sim.player.awakeSince = sim.now; }
    expect(['arrived', 'underway']).toContain(j.status);
    sim.advanceTo(Math.max(sim.now, j.arriveAt + (j.lateMinutes ?? 0) * 60_000 + 60_000));
    expect(j.status).toBe('arrived');
    expect(sim.player.currentLocationId).toBe('us-dc-washington');
  });

  it('refunds Amtrak’s Value fare but 30% on a cancel after a day, and all of it within 24 hours of buying', () => {
    const sim = at('us-ny-newyork', 'rail-cancel');
    const day = sim.now + 20 * MS_DAY;
    const a = sim.execute<{ journeyId: string; total: number }>({ kind: 'travel.book', payload: { toCity: 'us-dc-washington', day, slot: 5, by: 'nec-nyp-was-ner', nights: 1 } });
    expect(a.ok, a.error).toBe(true);
    const fast = sim.execute<{ refund: number }>({ kind: 'travel.cancel', payload: { journeyId: a.value!.journeyId } });
    expect(fast.value!.refund).toBe(a.value!.total);
    const b = sim.execute<{ journeyId: string; total: number }>({ kind: 'travel.book', payload: { toCity: 'us-dc-washington', day, slot: 5, by: 'nec-nyp-was-ner', nights: 1 } });
    const j = journeysOf(sim.player).find((x) => x.id === b.value!.journeyId)!;
    const fare = j.legs.reduce((s, l) => s + l.fare, 0);
    sim.advanceTo(sim.now + 2 * MS_DAY);
    const late = sim.execute<{ refund: number }>({ kind: 'travel.cancel', payload: { journeyId: b.value!.journeyId } });
    // The fare less the 30% kept, and the hotel back, being more than a day out.
    expect(late.value!.refund).toBe(Math.round(fare * 0.7) + (j.hotel?.price ?? 0));
  });
});

describe('coaches, the rides to the station, and cancellations', () => {
  it('runs a coach as a coach leg at the operator’s lowest fare, and charges each town’s own transit to and from the stand', () => {
    const sim = at('us-ny-newyork', 'coach-legs');
    const legs = planTrain(sim, route('flix-nyc-was'), 'us-ny-newyork', sim.now + 5 * MS_DAY, 10);
    if (typeof legs === 'string') throw new Error(legs);
    expect(legs.find((l) => l.routeId === 'flix-nyc-was')!.mode).toBe('bus');
    const cur = saveCurrency(sim.universe);
    const usd = (c: number) => (cur === 'USD' ? c : exchange(c, 'USD', cur)!);
    expect(legs.find((l) => l.mode === 'bus')!.fare).toBe(usd(31_48));
    // The subway in New York, $3.00; the Metro in Washington, $2.25.
    expect(legs[0]!.fare).toBe(usd(3_00));
    expect(legs[legs.length - 1]!.fare).toBe(usd(2_25));
    // A town whose transit isn't kept rides free, and says so.
    const tol = planTrain(sim, route('insurgente-obs-tol'), 'mx-cmx-mexicocity', sim.now + 5 * MS_DAY, 3);
    if (typeof tol === 'string') throw new Error(tol);
    expect(tol[tol.length - 1]!.fare).toBe(0);
    expect(tol[tol.length - 1]!.basis).toMatch(/not kept yet/);
  });

  it('reaches Belfast, Edinburgh and Toluca by train and by coach', () => {
    expect(railRoutes('ie-lei-dublin', 'uk-nir-belfast').map((r) => r.id).sort()).toEqual(['dx-dub-bfs', 'enterprise-dub-bfs']);
    expect(railRoutes('uk-eng-london', 'uk-sct-edinburgh').map((r) => r.id).sort()).toEqual(['lner-kgx-edb', 'nx-lon-edb']);
    expect(railRoutes('mx-cmx-mexicocity', 'mx-15-toluca').length).toBe(2);
  });

  it('cancels Avanti’s trains at ORR’s 5.6%, and the traveler waits for the next', () => {
    const sim = at('uk-eng-london', 'rail-cancel-avanti');
    const r = route('avanti-eus-man');
    let canceled = 0;
    const N = 20_000;
    for (let i = 0; i < N; i += 1) {
      const f = trainFateOf(sim, sim.player, r, `c${i}`);
      if (f.canceled) { canceled += 1; expect(f.late).toBe(Math.round(headwayMinutes(r))); }
    }
    expect(Math.abs(canceled / N - 0.056)).toBeLessThan(0.006);
    // Amtrak publishes no share: none canceled.
    const acela = route('nec-nyp-was-acela');
    for (let i = 0; i < 2_000; i += 1) expect(trainFateOf(sim, sim.player, acela, `a${i}`).canceled).toBe(false);
  });
});
