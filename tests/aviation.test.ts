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
import { MEDICAL_KIND, NOT_VISUAL, OWN_172, buyAircraftRefusal, hiredPilotUsd, licensedIn, jetCharterUsd, ownHourCost, planCharterJet, planFlyYourself, trainRefusal, trainingCosts } from '@/engine/systems/aviation';
import { weatherOn } from '@/engine/systems/weather';
import { netWorth } from '@/engine/systems/finance';
import { journeysOf, slotOf } from '@/engine/systems/journey';
import { airportsFor } from '@/engine/systems/airports';
import { CITIES, distanceKm } from '@/engine/content/geography';

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

  it('refuses someone under 17, and where no school’s cost is kept', () => {
    const young = save('us-ny-newyork', 'fly-young2', 16);
    expect(trainRefusal(young, young.player)).toMatch(/from 17/);
    const mexico = save('mx-cmx-mexicocity', 'fly-mx');
    expect(trainRefusal(mexico, mexico.player)).toMatch(/America, Britain, Ireland and Canada only/);
  });

  it('trains a Londoner for the CAA’s license at the PPL Club’s middle over six months, and flies them within Britain on it, not in America', () => {
    const sim = save('uk-eng-london', 'fly-gb');
    fund(sim, 60_000);
    const costs = trainingCosts(sim, 'uk');
    expect(costs.total).toBe(6 * inSave(sim, Math.round((15_250 / 6) * 100), 'GBP'));
    expect(sim.execute({ kind: 'pilot.train', payload: {} }).ok).toBe(true);
    sim.advanceBy(6 * 30 * MS_DAY + 5 * MS_DAY);
    expect(licensedIn(sim.player, 'uk')).toBe(true);
    expect(licensedIn(sim.player, 'us')).toBe(false);
    expect(sim.player.pilotLicences).toHaveLength(1);
    let legs: ReturnType<typeof planFlyYourself> = 'none';
    for (let d = 10; d < 60 && typeof legs === 'string'; d += 1) legs = planFlyYourself(sim, sim.player, 'uk-eng-london', 'uk-sct-edinburgh', sim.now + d * MS_DAY, 2);
    if (typeof legs === 'string') throw new Error(legs);
    const leg = legs.find((l) => l.mode === 'fly')!;
    expect(Math.abs(leg.fare - inSave(sim, Math.round(((leg.arriveAt - leg.departAt) / 3_600_000) * 265 * 100), 'GBP'))).toBeLessThan(200);
    expect(planFlyYourself(sim, sim.player, 'us-ny-newyork', 'us-ct-newhaven', sim.now + 10 * MS_DAY, 2)).toMatch(/pilot certificate/);
    // An American certificate doesn't rent a plane in Britain.
    const us = save('uk-eng-london', 'fly-gb-faa');
    us.player.pilot = { issuedAt: us.now, authority: 'FAA' };
    expect(planFlyYourself(us, us.player, 'uk-eng-london', 'uk-sct-edinburgh', us.now + 10 * MS_DAY, 2)).toMatch(/UK Private Pilot Licence/);
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
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Flight training, a month'))).toHaveLength(6);
    // The medical with the first month, and the certificate's own months from the training's start.
    expect(sim.universe.transactions.filter((t) => t.memo === 'Flight training, a month, and the medical')).toHaveLength(1);
    const firstMonth = sim.universe.transactions.find((t) => t.memo === 'Flight training, a month, and the medical')!;
    expect(firstMonth.postings.filter((x) => x.amount > 0).reduce((q, x) => q + x.amount, 0)).toBe(trainingCosts(sim).month + inSave(sim, 142_50, 'USD'));
    expect(sim.player.pilot!.medicalUntil).toBeGreaterThan(sim.now);
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
    expect(legs.find((l) => l.mode === 'fly')!.fare).toBe(inSave(sim, Math.round(hours * 176 * 100), 'USD'));
    expect((legs.find((l) => l.mode === 'fly')!.arriveAt - legs.find((l) => l.mode === 'fly')!.departAt) / 60_000).toBe(Math.round(hours * 60));
    expect(legs.find((l) => l.mode === 'fly')!.mode).toBe('fly');
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

describe('a plane of one’s own', () => {
  it('is bought without a certificate and costs its keeping; its owner flies it for its fuel, or hires a pilot', () => {
    const sim = save('us-ny-newyork', 'own-plane');
    fund(sim, 200_000);
    const r = sim.execute<{ paid: number }>({ kind: 'aircraft.buy', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(inSave(sim, (121_847 + 5) * 100, 'USD'));
    expect(sim.execute({ kind: 'aircraft.buy', payload: {} }).error).toMatch(/own a plane/);
    expect(netWorth(sim, sim.player.id).vehicles).toBe(inSave(sim, 121_847_00, 'USD'));
    const day = sim.now + 10 * MS_DAY;
    // Not a pilot, its owner hires one: its fuel and the pilot's half day.
    const hired = planFlyYourself(sim, sim.player, 'us-ny-newyork', 'us-ct-newhaven', day, 2);
    if (typeof hired === 'string') throw new Error(hired);
    const flown = (hired.find((l) => l.mode === 'fly')!.arriveAt - hired.find((l) => l.mode === 'fly')!.departAt) / 3_600_000;
    expect(Math.abs(hired.find((l) => l.mode === 'fly')!.fare - Math.round(ownHourCost(sim, 'us-ny-newyork') * flown) - inSave(sim, 450_00, 'USD'))).toBeLessThan(100);
    expect(hiredPilotUsd(4)).toBe(450);
    expect(hiredPilotUsd(4.1)).toBe(900);
    expect(hiredPilotUsd(8.1)).toBe(1_350);
    // Nor a plane of their own here: nothing to hire a pilot for.
    expect(planFlyYourself(sim, sim.player, 'us-ct-newhaven', 'us-ny-newyork', day, 2)).toMatch(/pilot certificate/);
    sim.advanceBy(31 * MS_DAY);
    const paid = (memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).map((t) => t.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0));
    expect(paid('The plane’s tiedown, a month')).toEqual([inSave(sim, 100_00, 'USD')]);
    expect(paid('The plane’s insurance, a month')).toEqual([inSave(sim, Math.round(1_850_00 / 12), 'USD')]);
    sim.player.pilot = { issuedAt: sim.now, authority: 'FAA' };
    const legs = planFlyYourself(sim, sim.player, 'us-ny-newyork', 'us-ct-newhaven', sim.now + MS_DAY, 2);
    if (typeof legs === 'string') throw new Error(legs);
    const hours = (legs.find((l) => l.mode === 'fly')!.arriveAt - legs.find((l) => l.mode === 'fly')!.departAt) / 3_600_000;
    expect(legs.find((l) => l.mode === 'fly')!.routeId).toBe('own');
    expect(legs.find((l) => l.mode === 'fly')!.fare).toBeCloseTo(inSave(sim, Math.round(10.2 * 7.6 * 100), 'USD') * hours, -2);
  });

  it('pays the annual inspection each year, and overhauls the engine at 2,000 hours', () => {
    const sim = save('us-ny-newyork', 'own-plane-years');
    fund(sim, 300_000);
    expect(sim.execute({ kind: 'aircraft.buy', payload: {} }).ok).toBe(true);
    // Met at the month after it falls due.
    sim.advanceBy(395 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'The plane’s annual inspection')).toHaveLength(1);
    sim.player.aircraft!.hours = OWN_172.tboHours;
    sim.advanceBy(31 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'The plane’s engine overhauled')).toHaveLength(1);
    expect(sim.player.aircraft!.hours).toBe(0);
    const sold = sim.execute<{ value: number }>({ kind: 'aircraft.sell', payload: {} });
    expect(sold.value!.value).toBe(inSave(sim, 121_847_00, 'USD'));
    expect(netWorth(sim, sim.player.id).vehicles).toBe(0);
  });
});

describe('a light jet chartered', () => {
  it('bills the flight there and back at $3,975 an hour, two hours at least, with the 7.5% excise tax and the $5.30 segment fee', () => {
    expect(jetCharterUsd(0.5)).toBeCloseTo(2 * 3_975 * 1.075 + 5.3, 2);
    expect(jetCharterUsd(3)).toBeCloseTo(6 * 3_975 * 1.075 + 5.3, 2);
  });

  it('flies New York to Los Angeles with a stop for fuel, in about as many hours as Textron’s 416 knots make, and refuses what’s abroad', () => {
    const sim = save('us-ny-newyork', 'jet-plan');
    const day = sim.now + 10 * MS_DAY;
    const legs = planCharterJet(sim, 'us-ny-newyork', 'us-ca-losangeles', day, 3);
    if (typeof legs === 'string') throw new Error(legs);
    const a = airportsFor('us-ny-newyork')[0]!.airport;
    const b = airportsFor('us-ca-losangeles')[0]!.airport;
    // Past a CJ3's range with reserve: one stop for fuel, its taxi and climb twice, and 45 minutes on the ground unbilled.
    const hours = distanceKm(a, b) / 1.852 / 416 + 2 * 0.5;
    expect((legs.find((l) => l.mode === 'fly')!.arriveAt - legs.find((l) => l.mode === 'fly')!.departAt) / 3_600_000).toBeCloseTo(hours + 0.75, 1);
    expect(legs.find((l) => l.mode === 'fly')!.basis).toMatch(/a stop for fuel/);
    const near = planCharterJet(sim, 'us-ny-newyork', 'us-ct-newhaven', day, 3);
    if (typeof near === 'string') throw new Error(near);
    expect(near.find((l) => l.mode === 'fly')!.basis).not.toMatch(/stop for fuel/);
    expect(legs.find((l) => l.mode === 'fly')!.routeId).toBe('jet');
    // The taxi to Tweed and from Hawthorne or LAX, as an airline journey's.
    expect(legs[0]!.mode).toBe('ground');
    expect(legs[0]!.arriveAt).toBe(legs[1]!.departAt);
    expect(legs[2]!.mode).toBe('ground');
    expect(legs[2]!.departAt).toBe(legs[1]!.arriveAt);
    expect(legs[0]!.fare).toBeGreaterThan(0);
    expect(legs.find((l) => l.mode === 'fly')!.fare).toBe(inSave(sim, Math.round(jetCharterUsd(hours) * 100), 'USD'));
    expect(zonedParts(legs.find((l) => l.mode === 'fly')!.departAt, 'America/New_York').hour).toBe(10);
    expect(planCharterJet(sim, 'us-ny-newyork', 'uk-eng-london', day, 3)).toMatch(/within America, Britain or Canada/);
    // Across a border, even a short one, it isn't chartered here.
    expect(planCharterJet(sim, 'ca-on-toronto', 'us-ny-newyork', day, 3)).toMatch(/within America, Britain or Canada/);
    // Within Britain: ACC Aviation's £2,600 an hour there and back, with VAT; within Canada, Novajet's middle with Ontario's HST.
    const gb = planCharterJet(sim, 'uk-eng-london', 'uk-sct-edinburgh', day, 3);
    if (typeof gb === 'string') throw new Error(gb);
    const gbLeg = gb.find((l) => l.mode === 'fly')!;
    const gbHours = distanceKm(airportsFor('uk-eng-london')[0]!.airport, airportsFor('uk-sct-edinburgh')[0]!.airport) / 1.852 / 416 + 0.5;
    expect(gbLeg.fare).toBe(inSave(sim, Math.round(Math.max(2, gbHours * 2) * 2_600 * 1.2 * 100), 'GBP'));
    const ca = planCharterJet(sim, 'ca-on-toronto', 'ca-bc-vancouver', day, 3);
    if (typeof ca === 'string') throw new Error(ca);
    expect(ca.find((l) => l.mode === 'fly')!.basis).toMatch(/Novajet/);
    const back = planCharterJet(sim, 'ca-bc-vancouver', 'ca-on-toronto', day, 3);
    if (typeof back === 'string') throw new Error(back);
    // Leaving Ontario its 13% HST, leaving British Columbia the 5% GST.
    expect(ca.find((l) => l.mode === 'fly')!.fare / back.find((l) => l.mode === 'fly')!.fare).toBeCloseTo(1.13 / 1.05, 2);
    // Honolulu is past two of a light jet's legs.
    expect(planCharterJet(sim, 'us-ny-newyork', 'us-hi-honolulu', day, 3)).toMatch(/with one stop for fuel/);
  });

  it('is booked as a journey and paid, with no passport, as a flight within the country asks none', () => {
    const sim = save('us-ny-newyork', 'jet-book');
    fund(sim, 100_000);
    // A flight of one's own starts at an airport; until 2026-09-30 its code was read as another country.
    sim.player.documents = (sim.player.documents ?? []).filter((d) => d.kind !== 'passport');
    const r = sim.execute({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day: saturday(sim, 7), slot: 2, by: 'jet', nights: 1 } });
    expect(r.ok, r.error).toBe(true);
    expect(journeysOf(sim.player).some((j) => j.legs.some((l) => l.routeId === 'jet'))).toBe(true);
    // Its departure is the flight's, not the taxi's before it.
    expect(slotOf(journeysOf(sim.player).find((j) => j.legs.some((l) => l.routeId === 'jet'))!)).toBe(2);
  });
});

describe('a pilot’s medical, the weather, and a loan on a plane', () => {
  it('renews the medical when it runs out, paid; lapsed, a pilot doesn’t fly themselves', () => {
    const sim = save('us-ny-newyork', 'medical', 45);
    fund(sim, 50_000);
    sim.player.pilot = { issuedAt: sim.now, authority: 'FAA', medicalUntil: sim.now + 10 * MS_DAY };
    sim.schedule({ at: sim.player.pilot.medicalUntil!, kind: MEDICAL_KIND, label: 'Pilot’s Medical', category: 'personal', priority: 30, payload: { personId: sim.player.id } });
    sim.advanceBy(12 * MS_DAY);
    const renewed = sim.universe.transactions.filter((t) => t.memo === 'A pilot’s medical, renewed');
    expect(renewed).toHaveLength(1);
    expect(renewed[0]!.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0)).toBe(inSave(sim, 142_50, 'USD'));
    // At 45, two years.
    expect(Math.round((sim.player.pilot.medicalUntil! - sim.now) / (30.44 * MS_DAY))).toBe(24);
    sim.player.pilot.medicalUntil = sim.now - MS_DAY;
    expect(planFlyYourself(sim, sim.player, 'us-ny-newyork', 'us-ct-newhaven', sim.now + 5 * MS_DAY, 2)).toMatch(/medical has lapsed/);
  });

  it('refuses a visual flight on a day of fog or a thunderstorm at either end', () => {
    const sim = save('us-ny-newyork', 'vfr');
    sim.player.pilot = { issuedAt: sim.now, authority: 'FAA' };
    let found = false;
    for (let d = 1; d < 400 && !found; d += 1) {
      const day = sim.now + d * MS_DAY;
      const w = [weatherOn(sim, CITIES.require('us-ny-newyork'), day).condition, weatherOn(sim, CITIES.require('us-ct-newhaven'), day).condition];
      if (w.some((c) => NOT_VISUAL.has(c))) {
        expect(planFlyYourself(sim, sim.player, 'us-ny-newyork', 'us-ct-newhaven', day, 2)).toMatch(/no visual flight/);
        found = true;
      } else if (w.every((c) => c === 'Rain' || c === 'Snow') ) {
        expect(planFlyYourself(sim, sim.player, 'us-ny-newyork', 'us-ct-newhaven', day, 2)).not.toBeTypeOf('string');
      }
    }
    expect(found).toBe(true);
  });

  it('buys a 172 with 15% down on AOPA Finance’s middle rate over 20 years to a record of 700, and pays it off from a sale', () => {
    const sim = save('us-ny-newyork', 'plane-loan');
    fund(sim, 50_000);
    sim.player.credit = { ...sim.player.credit!, score: 699 };
    expect(buyAircraftRefusal(sim, sim.player, true)).toMatch(/record of 700/);
    sim.player.credit.score = 760;
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    expect(sim.execute({ kind: 'aircraft.buy', payload: { financed: true } }).ok).toBe(true);
    const price = inSave(sim, 121_847_00, 'USD');
    expect(before - sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(Math.round(price * 0.15) + inSave(sim, 5_00, 'USD'));
    const loan = { ...sim.player.aircraft!.loan! };
    expect(loan.owed).toBe(price - Math.round(price * 0.15));
    sim.advanceBy(65 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Loan payment on the plane')).toHaveLength(2);
    expect(sim.player.aircraft!.loan!.owed).toBeLessThan(loan.owed);
    const owed = sim.player.aircraft!.loan!.owed;
    const mid = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    expect(sim.execute({ kind: 'aircraft.sell', payload: {} }).ok).toBe(true);
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance - mid).toBe(price - owed);
  });
});
