/**
 * Learning to fly and flying oneself (`systems/aviation.ts`, docs/WORLD.md
 * stage 7b, from 2026-09-29): the training's cost to the cent, who can't
 * train, a month unpaid stopping it and its taking up again, the
 * certificate, and a flight of one's own within the Skyhawk's reach.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { planFlyYourself, trainRefusal, trainingCosts } from '@/engine/systems/aviation';
import { journeysOf } from '@/engine/systems/journey';
import { airportsFor } from '@/engine/systems/airports';
import { distanceKm } from '@/engine/content/geography';

const YEAR = 365.2425 * MS_DAY;
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const save = (city: string, name: string, age = 25) => { const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name); sim.player.birthInstant = sim.now - (age + 0.5) * YEAR; return sim; };
const fund = (sim: Simulation, usd: number) => { sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, usd * 100, 'USD'); };
function saturday(sim: Simulation, after: number): number {
  const p = zonedParts(sim.now + after * MS_DAY, sim.zone);
  for (let d = 0; d < 7; d += 1) {
    const at = instantFromZoned({ ...normalDate(p.year, p.month, p.day + d), hour: 12 }, sim.zone);
    if (zonedParts(at, sim.zone).weekday === 6) return at;
  }
  throw new Error('no saturday');
}

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

describe('learning to fly', () => {
  it('costs 60 hours at $176 and 20 with an instructor at $75 over six months, then $1,175 of tests', () => {
    const sim = save('us-ny-newyork', 'fly-cost');
    const c = trainingCosts(sim);
    expect(c.month).toBe(inSave(sim, 2_010_00, 'USD'));
    expect(c.tests).toBe(inSave(sim, 1_175_00, 'USD'));
    expect(c.total).toBe(inSave(sim, 2_010_00, 'USD') * 6 + inSave(sim, 1_175_00, 'USD'));
  });

  it('refuses someone under 17, and outside America', () => {
    const young = save('us-ny-newyork', 'fly-young2', 16);
    expect(trainRefusal(young, young.player)).toMatch(/from 17/);
    const london = save('uk-eng-london', 'fly-gb');
    expect(trainRefusal(london, london.player)).toMatch(/America only/);
  });

  it('certifies a pilot after six months paid and the tests; a month unpaid stops it, and it’s taken up again from there', () => {
    const sim = save('us-ny-newyork', 'fly-train');
    fund(sim, 30_000);
    expect(sim.execute({ kind: 'pilot.train', payload: {} }).ok).toBe(true);
    expect(sim.execute({ kind: 'pilot.train', payload: {} }).error).toMatch(/training already/);
    sim.advanceBy(61 * MS_DAY);
    expect(sim.player.pilotTraining!.monthsDone).toBe(3);
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0) a.balance = 0;
    sim.advanceBy(31 * MS_DAY);
    expect(sim.player.pilotTraining!.status).toBe('stopped');
    fund(sim, 30_000);
    expect(sim.execute({ kind: 'pilot.train', payload: {} }).ok).toBe(true);
    expect(sim.player.pilotTraining!.monthsDone).toBe(4);
    sim.advanceBy(100 * MS_DAY);
    expect(sim.player.pilot?.authority).toBe('FAA');
    expect(sim.player.pilotTraining!.status).toBe('certified');
    expect(sim.universe.transactions.filter((t) => t.memo === 'Flight training, a month')).toHaveLength(6);
    expect(sim.execute({ kind: 'pilot.train', payload: {} }).error).toMatch(/hold a private pilot certificate/);
  });
});

describe('flying oneself', () => {
  it('flies within the Skyhawk’s reach less a day flight’s reserve, by the hour, in America only, and not without a certificate', () => {
    const sim = save('us-ny-newyork', 'fly-plan');
    const day = sim.now + 10 * MS_DAY;
    expect(planFlyYourself(sim, sim.player, 'us-ny-newyork', 'us-ct-newhaven', day, 2)).toMatch(/pilot certificate/);
    sim.player.pilot = { issuedAt: sim.now, authority: 'FAA' };
    const legs = planFlyYourself(sim, sim.player, 'us-ny-newyork', 'us-ct-newhaven', day, 2);
    if (typeof legs === 'string') throw new Error(legs);
    const nm = distanceKm(airportsFor('us-ny-newyork')[0]!.airport, airportsFor('us-ct-newhaven')[0]!.airport) / 1.852;
    const hours = nm / 124 + 0.2;
    expect(legs[0]!.fare).toBe(inSave(sim, Math.round(hours * 176 * 100), 'USD'));
    expect((legs[0]!.arriveAt - legs[0]!.departAt) / 60_000).toBe(Math.round(hours * 60));
    expect(legs[0]!.mode).toBe('fly');
    expect(planFlyYourself(sim, sim.player, 'us-ny-newyork', 'us-ca-losangeles', day, 2)).toMatch(/past a Skyhawk’s 578/);
    expect(planFlyYourself(sim, sim.player, 'us-ny-newyork', 'uk-eng-london', day, 2)).toMatch(/America only/);
  });

  it('keeps no airline’s delays on a flight of one’s own', () => {
    const sim = save('us-ny-newyork', 'fly-go');
    sim.player.pilot = { issuedAt: sim.now, authority: 'FAA' };
    fund(sim, 5_000);
    const b = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ct-newhaven', day: saturday(sim, 7), slot: 2, by: 'fly', nights: 1 } });
    expect(b.ok, b.error).toBe(true);
    const j = journeysOf(sim.player).find((x) => x.id === b.value!.journeyId)!;
    liveTo(sim, j.leaveAt + 10 * 60_000);
    expect(['underway', 'arrived']).toContain(j.status);
    expect(j.lateMinutes).toBe(0);
  });
});
