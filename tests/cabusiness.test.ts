/**
 * The acting business in Toronto and Vancouver (from 2026-09-30): the IPA's
 * and the BCMPA's own rates, Canada's agencies and their 15%, ACTRA's
 * apprentice, member and dues, Casting Workbook, and no visitor's
 * withholding on work in the country an actor lives in.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import { ACTRA, AGENCIES, ROLES, WORK_COSTS, type CareerCity } from '@/engine/content/career';
import { actraRoom, beginCareer, careerOf, foreignWithholding, homeAbroadOf, offersFor, paycheck, rateOf, roleById, weekOfAuditions, workCity, type Booking } from '@/engine/systems/career';
import { evenCraft } from '@/engine/systems/school';
import { documentsOf } from '@/engine/systems/documents';

const TO: CareerCity = 'ca-on-toronto';
const VAN: CareerCity = 'ca-bc-vancouver';
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };

function canadian(city: CareerCity, seed: string): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(80);
  beginCareer(sim, sim.player);
  return sim;
}

/** A job offered in their city, starting in five days. */
function offer(sim: Simulation, id: string, roleId: string, city: CareerCity): Booking {
  const b: Booking = { id, roleId, cityId: city, starts: sim.now + 5 * MS_DAY, units: 1, rehearsalWeeks: roleById(roleId).medium === 'stage' ? 1 : 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
  careerOf(sim.player).bookings.push(b);
  return b;
}

describe('the business in Toronto and Vancouver', () => {
  it('pays the IPA’s principal day in Toronto and the BCMPA’s in Vancouver, in Canadian dollars, and draws each city’s own parts', () => {
    const at = Date.UTC(2026, 9, 1);
    expect(rateOf(roleById('ca-principal'), at, TO, 'CAD')).toBe(972_75);
    expect(rateOf(roleById('ca-principal'), Date.UTC(2025, 5, 1), TO, 'CAD')).toBe(935_25);
    expect(rateOf(roleById('bc-principal'), at, VAN, 'CAD')).toBe(954_40);
    // The BCMPA's step on 29 March 2026: the day before, 2025's.
    expect(rateOf(roleById('bc-principal'), Date.UTC(2026, 2, 28, 12), VAN, 'CAD')).toBe(917_69);
    expect(rateOf(roleById('ca-theater'), at, TO, 'CAD')).toBe(1_332_00);
    for (const city of [TO, VAN]) {
      const sim = canadian(city, `ca-parts-${city}`);
      expect(workCity(sim.player)).toBe(city);
      const agency = AGENCIES.find((a) => a.id === 'meridian-artists')!;
      const seen = new Set<string>();
      for (let w = 0; w < 30; w += 1) for (const a of weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, agency, city, 3)) seen.add(a.roleId);
      expect(seen.size).toBeGreaterThan(1);
      for (const id of seen) expect(roleById(id).cities).toContain(city);
    }
    expect(ROLES.filter((r) => r.cities.some((c) => c === TO || c === VAN)).every((r) => r.currency === 'CAD' && (r.union === 'actra' || r.union === 'caea'))).toBe(true);
  });

  it('brings Canada’s agencies to a showing there, at 15%', () => {
    const sim = canadian(TO, 'ca-agents');
    const ca = new Set<string>();
    for (let i = 0; i < 40; i += 1) for (const id of offersFor(sim, sim.player, 95, `k${i}`, [], 'ca')) ca.add(id);
    expect(ca.size).toBeGreaterThan(0);
    expect([...ca].every((id) => AGENCIES.find((a) => a.id === id)!.countryId === 'ca')).toBe(true);
    const check = paycheck({ scale: 1_000_00, role: roleById('ca-principal'), rehearsal: false, represented: true, before: 0, cityId: TO, at: Date.UTC(2026, 9, 1), currency: 'CAD', commission: AGENCIES.find((a) => a.id === 'characters')!.commission });
    expect(check.agent).toBe(150_00);
  });

  it('takes ACTRA’s 2.25% working dues, up to what’s left of the year’s $4,000', () => {
    const args = { scale: 10_000_00, role: roleById('ca-principal'), rehearsal: false, represented: false, before: 0, cityId: TO, at: Date.UTC(2026, 9, 1), currency: 'CAD' };
    expect(paycheck(args).dues).toBe(225_00);
    expect(paycheck({ ...args, actraRoom: 100_00 }).dues).toBe(100_00);
    expect(paycheck({ ...args, actraRoom: 0 }).dues).toBe(0);
    // Equity's stage work in Canada takes no ACTRA dues.
    expect(paycheck({ ...args, role: roleById('ca-theater') }).dues).toBe(0);
    const sim = canadian(TO, 'ca-room');
    // An apprentice, or no member, pays none.
    expect(actraRoom(sim.player, 2026, 'CAD')).toBe(0);
    careerOf(sim.player).unions.actra = { joinedAt: sim.now, credits: 3, fullAt: sim.now, duesBy: { 2026: 3_900_00 } };
    expect(actraRoom(sim.player, 2026, 'CAD')).toBe(100_00);
    expect(actraRoom(sim.player, 2027, 'CAD')).toBe(ACTRA.duesCap);
  });

  it('makes a first ACTRA job an apprentice’s, for $75, and a third credit a full member’s, for the initiation fee less it', () => {
    const sim = canadian(TO, 'ca-join');
    const fees = () => sim.universe.transactions.filter((t) => /ACTRA/.test(t.memo) && !/work permit/.test(t.memo));
    const permits = () => sim.universe.transactions.filter((t) => t.memo === 'ACTRA work permit');
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: offer(sim, 'one', 'ca-actor', TO).id } }).ok).toBe(true);
    const actra = careerOf(sim.player).unions.actra!;
    expect(actra.credits).toBe(1);
    expect(fees()).toHaveLength(1);
    expect(fees()[0]!.memo).toBe('ACTRA apprentice fee');
    // An apprentice pays the IPA's work permit a week of the job: $210 on an actor's part (from later on 2026-09-30).
    expect(permits()).toHaveLength(1);
    expect(permits()[0]!.postings.filter((p) => p.amount > 0).reduce((a, p) => a + p.amount, 0)).toBe(inSave(sim, 210_00, 'CAD'));
    sim.advanceBy(20 * MS_DAY);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: offer(sim, 'two', 'ca-actor', TO).id } }).ok).toBe(true);
    expect(actra.credits).toBe(2);
    expect(actra.fullAt).toBeUndefined();
    sim.advanceBy(20 * MS_DAY);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: offer(sim, 'three', 'ca-principal', TO).id } }).ok).toBe(true);
    expect(actra.fullAt).toBe(sim.now);
    const joined = fees().find((t) => t.memo === 'ACTRA initiation fee and dues')!;
    const paid = joined.postings.filter((p) => p.amount > 0).reduce((a, p) => a + p.amount, 0);
    expect(paid).toBe(inSave(sim, ACTRA.initiation - ACTRA.apprentice + ACTRA.basicDues / 2, 'CAD'));
    // Not American Equity's, for a Canadian stage job.
    sim.advanceBy(20 * MS_DAY);
    const stage = sim.execute({ kind: 'career.accept', payload: { bookingId: offer(sim, 'four', 'ca-theater', TO).id } });
    expect(stage.ok, stage.error).toBe(true);
    expect(careerOf(sim.player).unions.equity).toBeUndefined();
    // A full member pays no permit.
    const before = permits().length;
    sim.advanceBy(20 * MS_DAY);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: offer(sim, 'five', 'ca-actor', TO).id } }).ok).toBe(true);
    expect(permits()).toHaveLength(before);
  });

  it('withholds no visitor’s tax from a Canadian’s work in Canada, and 23% from an American’s', () => {
    const sim = canadian(TO, 'ca-withheld');
    expect(foreignWithholding(sim.player, TO, 1_000_00, sim.now, 'CAD')).toBe(0);
    expect(foreignWithholding(sim.player, VAN, 1_000_00, sim.now, 'CAD')).toBe(0);
    const ny = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'ca-withheld-us');
    expect(foreignWithholding(ny.player, TO, 1_000_00, ny.now, 'USD')).toBe(230_00);
    // A Londoner's British work neither.
    const ldn = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy' }, 'ca-withheld-uk');
    expect(foreignWithholding(ldn.player, 'uk-eng-london', 50_000_00, ldn.now, 'GBP', { id: 'x', expected: 50_000_00 })).toBe(0);
  });

  it('sends a Vancouver-born Canadian home to Vancouver, and Casting Workbook casts in Canada', () => {
    const sim = canadian(VAN, 'ca-home');
    expect(homeAbroadOf(sim.player)).toBe(VAN);
    expect(WORK_COSTS.sites['casting-workbook']).toMatchObject({ price: 155_88, currency: 'CAD', countryId: 'ca' });
  });

  it('pays an ACTRA animated part its fees with the producer’s 110% prepaid use, and asks a non-Canadian apprentice $260 and then $175 a week', () => {
    const sim = canadian(TO, 'ca-prepaid');
    const b = offer(sim, 'series', 'ca-animation', TO);
    b.units = 2;
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    const until = b.starts + 20 * MS_DAY;
    while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * 3_600_000));
    const wages = sim.universe.transactions.flatMap((t) => t.postings).filter((p) => p.accountId === sim.nominalAccount('income', 'Acting').id || p.accountId === sim.nominalAccount('income', 'Wages').id);
    const gross = -wages.reduce((a, p) => a + p.amount, 0);
    const day = rateOf(roleById('ca-animation'), b.starts, TO, saveCurrency(sim.universe));
    expect(b.worked).toBeGreaterThan(0);
    expect(gross).toBeGreaterThanOrEqual(Math.round(day * b.worked * 2.1) - 2);
    // A non-Canadian apprentice's permit: $260 the first week and $175 after.
    const us = quickSave({ startLocationId: TO, homeRegionId: 'us-ny-newyork', wealth: 'wealthy' }, 'ca-permit-us');
    us.player.craft = evenCraft(80);
    beginCareer(us, us.player);
    const feature = offer(us, 'feature', 'ca-feature', TO);
    feature.units = 10;
    // A Canadian work permit held, the job may be taken.
    documentsOf(us.player).push({ id: 'wp', kind: 'permit', issuer: 'CA', name: 'Work Permit', number: 'W1', status: 'valid', issuedAt: us.now, expiresAt: us.now + 3 * 365 * MS_DAY, destination: 'CA' });
    const r = us.execute({ kind: 'career.accept', payload: { bookingId: feature.id } });
    expect(r.ok, r.error).toBe(true);
    const permit = us.universe.transactions.find((t) => t.memo === 'ACTRA work permit')!;
    expect(permit.postings.filter((p) => p.amount > 0).reduce((a, p) => a + p.amount, 0)).toBe(inSave(us, (260 + 175) * 100, 'CAD'));
  });
});