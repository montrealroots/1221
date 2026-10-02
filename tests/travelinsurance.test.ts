/**
 * Travel insurance (`systems/travelinsurance.ts`, `content/travelinsurance.ts`,
 * from 2026-10-01): its price by where the traveler lives, a trip lost to
 * illness or injury paid back, and care had away from home.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { hotelRefund, type Journey } from '@/engine/systems/journey';
import { healthOf } from '@/engine/systems/health';
import { careAway, claimCancellation, insuranceQuote, policyNow } from '@/engine/systems/travelinsurance';
import { careFor } from '@/engine/systems/health';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, units: number, from: string) => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const trip = (sim: Simulation, toCity: string, days = 7, total = 100_000): Journey => ({ id: 'j', fromCity: sim.player.currentLocationId, toCity, legs: [], status: 'booked', bookedAt: sim.now, bags: 0, total, leaveAt: sim.now + MS_DAY, arriveAt: sim.now + MS_DAY + 6 * 3_600_000, hotel: { nights: days, price: 0, basis: '', checkOutAt: 0 } });
const dayAhead = (sim: Simulation, n: number) => { const p = zonedParts(sim.now + n * MS_DAY, sim.zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone); };

describe('its price', () => {
  it('is a share of the trip in America, and a single trip’s price elsewhere, by age, destination or weeks', () => {
    const ny = life('us-ny-newyork', 'ti-us');
    expect(insuranceQuote(ny, ny.player, trip(ny, 'us-ca-losangeles'), ny.now)).toMatchObject({ premium: 6_000, market: 'us' });
    expect(insuranceQuote(ny, ny.player, { ...trip(ny, 'us-ca-losangeles'), paidBy: 'production' }, ny.now)).toMatch(/no cost of yours/);
    const ldn = life('uk-eng-london', 'ti-uk');
    const young = insuranceQuote(ldn, ldn.player, trip(ldn, 'ie-lei-dublin'), ldn.now);
    expect(young).toMatchObject({ premium: inSave(ldn, 21, 'GBP') });
    expect(insuranceQuote(ldn, ldn.player, trip(ldn, 'ie-lei-dublin'), ldn.player.birthInstant + 60 * 365.2425 * MS_DAY)).toMatchObject({ premium: inSave(ldn, 32, 'GBP') });
    expect(insuranceQuote(ldn, ldn.player, trip(ldn, 'ie-lei-dublin'), ldn.player.birthInstant + 80 * 365.2425 * MS_DAY)).toBe('No price past 79 is published.');
    const dub = life('ie-lei-dublin', 'ti-ie');
    expect(insuranceQuote(dub, dub.player, trip(dub, 'uk-eng-london'), dub.now)).toMatchObject({ premium: inSave(dub, 19.63, 'EUR') });
    expect(insuranceQuote(dub, dub.player, trip(dub, 'us-ny-newyork'), dub.now)).toMatchObject({ premium: inSave(dub, 70.16, 'EUR') });
    expect(insuranceQuote(dub, dub.player, trip(dub, 'uk-eng-london', 40), dub.now)).toBe('Aviva covers 31 days a trip at most.');
    const tor = life('ca-on-toronto', 'ti-ca');
    expect(insuranceQuote(tor, tor.player, trip(tor, 'us-ny-newyork', 10), tor.now)).toMatchObject({ premium: inSave(tor, 120, 'CAD') });
    const mex = life('mx-cmx-mexicocity', 'ti-mx');
    expect(insuranceQuote(mex, mex.player, trip(mex, 'us-ny-newyork'), mex.now)).toMatchObject({ premium: inSave(mex, 400, 'MXN') });
  });

  it('is paid once, for both halves of a round trip', () => {
    const sim = life('us-ny-newyork', 'ti-buy');
    const day = dayAhead(sim, 10);
    const b = sim.execute<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, returnDay: day + 4 * MS_DAY, returnSlot: 1 } });
    expect(b.ok, b.error).toBe(true);
    const out = sim.player.journeys!.find((x) => x.id === b.value!.journeyId)!;
    const back = sim.player.journeys!.find((x) => x.id === b.value!.returnId)!;
    const r = sim.execute<{ premium: number }>({ kind: 'travel.insure', payload: { journeyId: out.id } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.premium).toBe(Math.round((out.total + back.total) * 0.06));
    expect(back.insured).toBe(out.insured);
    expect(out.insured).toMatchObject({ from: out.leaveAt, to: back.arriveAt });
    expect(sim.execute({ kind: 'travel.insure', payload: { journeyId: back.id } }).error).toBe('It’s insured already.');
    expect(policyNow(sim.player, out.leaveAt + MS_DAY)).toBe(out.insured);
    expect(policyNow(sim.player, back.arriveAt + MS_DAY)).toBeUndefined();
    // Called off, it covers nothing.
    expect(sim.execute({ kind: 'travel.cancel', payload: { journeyId: out.id } }).ok).toBe(true);
    expect(policyNow(sim.player, out.leaveAt + MS_DAY)).toBeUndefined();
  });
});

describe('a trip lost to illness or injury', () => {
  const missed = (seed: string, insure: boolean) => {
    const sim = life('us-ny-newyork', seed);
    const day = dayAhead(sim, 10);
    const b = sim.execute<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, returnDay: day + 4 * MS_DAY, returnSlot: 1 } });
    const out = sim.player.journeys!.find((x) => x.id === b.value!.journeyId)!;
    const back = sim.player.journeys!.find((x) => x.id === b.value!.returnId)!;
    if (insure) expect(sim.execute({ kind: 'travel.insure', payload: { journeyId: out.id } }).ok).toBe(true);
    healthOf(sim.player).inHospitalUntil = out.leaveAt + 3 * MS_DAY;
    sim.advanceTo(out.leaveAt - 60_000);
    const before = sim.universe.transactions.length;
    sim.advanceTo(out.leaveAt + 60_000);
    const claim = sim.universe.transactions.slice(before).filter((t) => /a trip lost to illness or injury, claimed/.test(t.memo));
    return { gained: claim.reduce((x, t) => x + t.postings.find((q) => q.accountId === sim.player.primaryAccountId)!.amount, 0), out, back, sim };
  };

  it('is paid back by the insurer, missed from a hospital bed, and not without it', () => {
    const insured = missed('ti-miss', true);
    expect(insured.out.status).toBe('missed');
    // What the hotel didn’t return and both fares, the way home canceled with the way out.
    expect(insured.gained).toBe(insured.out.total + insured.back.total - hotelRefund(insured.out.hotel!, insured.out.arriveAt, insured.out.arriveAt));
    expect(insured.gained).toBeGreaterThan(0);
    // Missed, it covers nothing after.
    expect(policyNow(insured.sim.player, insured.out.leaveAt + MS_DAY)).toBeUndefined();
    expect(missed('ti-miss', false).gained).toBe(0);
  });

  it('is paid back when called off laid up, what the airline kept', () => {
    const sim = life('us-ny-newyork', 'ti-cancel');
    const day = dayAhead(sim, 10);
    const b = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, returnDay: day + 4 * MS_DAY, returnSlot: 1 } });
    const out = sim.player.journeys!.find((x) => x.id === b.value!.journeyId)!;
    sim.advanceTo(sim.now + 2 * MS_DAY);
    const paid = out.total + sim.player.journeys!.find((x) => x.tripId === out.tripId && x.id !== out.id)!.total;
    expect(sim.execute({ kind: 'travel.insure', payload: { journeyId: out.id } }).ok).toBe(true);
    healthOf(sim.player).inHospitalUntil = sim.now + 5 * MS_DAY;
    const r = sim.execute<{ refund: number }>({ kind: 'travel.cancel', payload: { journeyId: out.id } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.refund).toBe(paid);
  });

  it('isn’t paid for a trip called off well', () => {
    const sim = life('us-ny-newyork', 'ti-well');
    const day = dayAhead(sim, 10);
    const b = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, returnDay: day + 4 * MS_DAY, returnSlot: 1 } });
    const out = sim.player.journeys!.find((x) => x.id === b.value!.journeyId)!;
    sim.advanceTo(sim.now + 2 * MS_DAY);
    expect(sim.execute({ kind: 'travel.insure', payload: { journeyId: out.id } }).ok).toBe(true);
    const r = sim.execute<{ refund: number }>({ kind: 'travel.cancel', payload: { journeyId: out.id } });
    expect(r.value!.refund).toBe(hotelRefund(out.hotel!, out.arriveAt, sim.now));
  });

  it('is paid to the policy’s limit less its excess, and not where cancellation isn’t sold', () => {
    const ldn = life('uk-eng-london', 'ti-cap');
    healthOf(ldn.player).inHospitalUntil = ldn.now + MS_DAY;
    const j = { ...trip(ldn, 'ie-lei-dublin'), insured: { market: 'uk' as const, premium: 2_100, from: ldn.now, to: ldn.now + 7 * MS_DAY } };
    expect(claimCancellation(ldn, ldn.player, j, inSave(ldn, 10_000, 'GBP'), ldn.now)).toBe(inSave(ldn, 3_000, 'GBP') - inSave(ldn, 99, 'GBP'));
    expect(claimCancellation(ldn, ldn.player, j, inSave(ldn, 500, 'GBP'), ldn.now)).toBe(inSave(ldn, 500, 'GBP') - inSave(ldn, 99, 'GBP'));
    const tor = life('ca-on-toronto', 'ti-nocancel');
    healthOf(tor.player).inHospitalUntil = tor.now + MS_DAY;
    expect(claimCancellation(tor, tor.player, { ...j, insured: { ...j.insured, market: 'ca' } }, 100_000, tor.now)).toBe(0);
  });
});

describe('care away from home', () => {
  it('in America uninsured is America’s price, less OHIP’s day rate for an Ontarian; insured, the excess', () => {
    const ldn = life('uk-eng-london', 'ti-care');
    ldn.player.currentLocationId = 'us-ny-newyork';
    expect(careAway(ldn, ldn.player, 'emergency', 0, 300_000, 3, false, ldn.now)).toBe(300_000);
    ldn.player.journeys = [{ ...trip(ldn, 'us-ny-newyork'), insured: { market: 'uk', premium: 2_100, from: ldn.now - MS_DAY, to: ldn.now + MS_DAY } }];
    expect(careAway(ldn, ldn.player, 'emergency', 0, 300_000, 3, false, ldn.now)).toBe(inSave(ldn, 99, 'GBP'));
    // At home, nothing changes, insured or not.
    ldn.player.currentLocationId = 'uk-eng-london';
    expect(careAway(ldn, ldn.player, 'emergency', 0, 300_000, 3, false, ldn.now)).toBe(0);
    expect(careAway(ldn, ldn.player, 'visit', 50_000, 300_000, 3, false, ldn.now)).toBe(50_000);
    const tor = life('ca-on-toronto', 'ti-ohip');
    tor.player.currentLocationId = 'us-ny-newyork';
    expect(careAway(tor, tor.player, 'visit', 0, 30_000, 3, true, tor.now)).toBe(30_000 - inSave(tor, 50, 'CAD'));
    expect(careAway(tor, tor.player, 'stay', 0, 3_000_000, 3, true, tor.now)).toBe(3_000_000 - inSave(tor, 600, 'CAD'));
    expect(careAway(tor, tor.player, 'visit', 0, 30_000, 3, false, tor.now)).toBe(30_000);
    // British Columbia's MSP: no out-of-country rate kept.
    const van = life('ca-bc-vancouver', 'ti-msp');
    van.player.currentLocationId = 'us-ny-newyork';
    expect(careAway(van, van.player, 'visit', 0, 30_000, 3, true, van.now)).toBe(30_000);
  });

  it('is billed so: a Londoner’s emergency in New York, uninsured, at America’s price', () => {
    const ldn = life('uk-eng-london', 'ti-bill');
    expect(careFor(ldn, ldn.player, { care: 'emergency', what: 'The emergency room' }, ldn.now)).toBeUndefined();
    ldn.player.currentLocationId = 'us-ny-newyork';
    expect(careFor(ldn, ldn.player, { care: 'emergency', what: 'The emergency room' }, ldn.now)!.amount).toBeGreaterThan(inSave(ldn, 1_000, 'USD'));
  });

  it('in England is free at A&E and a GP, and a stay 150% of the tariff, an Irish resident’s free', () => {
    const ny = life('us-ny-newyork', 'ti-england');
    ny.player.currentLocationId = 'uk-eng-london';
    expect(careAway(ny, ny.player, 'emergency', 50_000, 300_000, 3, false, ny.now)).toBe(0);
    expect(careAway(ny, ny.player, 'visit', 20_000, 30_000, 3, false, ny.now)).toBe(0);
    expect(careAway(ny, ny.player, 'stay', 100_000, 3_000_000, 3, false, ny.now)).toBe(inSave(ny, 4_852 * 1.5, 'GBP'));
    const dub = life('ie-lei-dublin', 'ti-england-ie');
    dub.player.currentLocationId = 'uk-eng-london';
    expect(careAway(dub, dub.player, 'stay', 0, 3_000_000, 3, false, dub.now)).toBe(0);
    const tor = life('ca-on-toronto', 'ti-england-ca');
    tor.player.currentLocationId = 'uk-eng-london';
    expect(careAway(tor, tor.player, 'stay', 0, 3_000_000, 3, true, tor.now)).toBe(inSave(tor, 4_852 * 1.5, 'GBP') - inSave(tor, 600, 'CAD'));
    // Scotland keeps its own rules, not kept: the home share holds.
    ny.player.currentLocationId = 'uk-sct-edinburgh';
    expect(careAway(ny, ny.player, 'stay', 100_000, 3_000_000, 3, false, ny.now)).toBe(100_000);
  });

  it('beyond the policy’s medical limit is the traveler’s again', () => {
    const mex = life('mx-cmx-mexicocity', 'ti-limit');
    mex.player.currentLocationId = 'us-ny-newyork';
    mex.player.journeys = [{ ...trip(mex, 'us-ny-newyork'), insured: { market: 'mx', premium: 400, from: mex.now - MS_DAY, to: mex.now + MS_DAY } }];
    const bill = inSave(mex, 50_000, 'USD');
    expect(careAway(mex, mex.player, 'stay', 0, bill, 3, false, mex.now)).toBe(bill - inSave(mex, 35_000, 'USD'));
  });
});
