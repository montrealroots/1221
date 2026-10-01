/**
 * The acting business in Mexico City (from 2026-09-29): SLATE's estimate of
 * its rates, ANDA's tabuladores being confidential, its agencies, and ANDA's
 * dues.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import { AGENCIES, MEXICO_SCALE, ROLES } from '@/engine/content/career';
import { QUERY, beginCareer, careerOf, offersFor, paycheck, queryRefusal, rateOf, roleById, weekOfAuditions, workCity, type Booking } from '@/engine/systems/career';
import { evenCraft } from '@/engine/systems/school';

const MXC = 'mx-cmx-mexicocity';

function capitalino(seed: string): Simulation {
  const sim = quickSave({ startLocationId: MXC, homeRegionId: MXC, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(80);
  beginCareer(sim, sim.player);
  return sim;
}

describe('the business in Mexico City', () => {
  it('scales the American minimum by IMSS’s average wage against SSA’s, and draws Mexico City’s parts for someone living there', () => {
    // A year at MXN 662.80 a day, in dollars, over $69,846.57.
    expect(MEXICO_SCALE).toBeCloseTo(exchange(662_80 * 365, 'MXN', 'USD')! / 69_846_57, 10);
    const tele = roleById('mx-telenovela');
    // Dubbing is still SLATE's estimate; the telenovela is Televisa's tabulador, two half-hour chapters a day and 6% in bonuses.
    expect(Math.abs(roleById('mx-dubbing').steps[0]![1] - exchange(1_246_00, 'USD', 'MXN')! * MEXICO_SCALE)).toBeLessThanOrEqual(100);
    expect(tele.steps[0]![1]).toBe(2_317_16);
    expect(roleById('mx-streaming').steps.map(([, c]) => c)).toEqual([2_873_87, 2_885_65]);
    expect(roleById('mx-theater').steps[0]![1]).toBe(2_769_23);
    const sim = capitalino('mx-parts');
    expect(workCity(sim.player)).toBe(MXC);
    const agency = AGENCIES.find((a) => a.id === 'shoot-management')!;
    const seen = new Set<string>();
    for (let w = 0; w < 30; w += 1) for (const a of weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, agency, MXC, 3)) seen.add(a.roleId);
    expect(seen.size).toBeGreaterThan(1);
    for (const id of seen) expect(roleById(id).cities).toContain(MXC);
    const cur = saveCurrency(sim.universe);
    expect(rateOf(tele, Date.UTC(2026, 9, 1), MXC, cur)).toBe(cur === 'MXN' ? tele.steps[0]![1] : exchange(tele.steps[0]![1], 'MXN', cur));
    expect(ROLES.filter((r) => r.cities.includes(MXC)).every((r) => r.currency === 'MXN' && r.union === 'anda')).toBe(true);
  });

  it('brings Mexico City’s agencies to a showing there', () => {
    const sim = capitalino('mx-agents');
    const mx = new Set<string>();
    for (let i = 0; i < 40; i += 1) for (const id of offersFor(sim, sim.player, 95, `k${i}`, [], 'mx')) mx.add(id);
    expect(mx.size).toBeGreaterThan(0);
    expect([...mx].every((id) => AGENCIES.find((a) => a.id === id)!.countryId === 'mx')).toBe(true);
  });

  it('takes ANDA’s 15% dues from a check, and none from a SAG-AFTRA one', () => {
    const at = Date.UTC(2026, 9, 1);
    const anda = paycheck({ scale: 10_000_00, role: roleById('mx-telenovela'), rehearsal: false, represented: false, before: 0, cityId: MXC, at, currency: 'MXN' });
    expect(anda.dues).toBe(1_500_00);
    expect(paycheck({ scale: 10_000_00, role: roleById('costar'), rehearsal: false, represented: false, before: 0, cityId: 'us-ny-newyork', at }).dues).toBe(0);
  });

  it('registers a rehearsal day in a Mexico City theater with IMSS, seven sixths of a day, and pays into the AFORE account', () => {
    const sim = capitalino('mx-imss');
    const p = zonedParts(sim.now + 5 * MS_DAY, 'America/Mexico_City');
    const starts = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 8 }, 'America/Mexico_City');
    const b: Booking = { id: 'obra', roleId: 'mx-theater', cityId: MXC, starts, units: 1, rehearsalWeeks: 1, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: 'obra' } }).ok).toBe(true);
    const until = starts + 31 * 3_600_000;
    while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * 3_600_000));
    expect(b.worked).toBeGreaterThanOrEqual(1);
    expect(sim.player.imss!.days).toBeCloseTo((7 / 6) * b.worked, 6);
    expect(sim.player.imss!.balance).toBeGreaterThan(0);
  });
});

describe('writing to the agencies', () => {
  it('sends a Mexico City actor’s submission to its agencies, who answer in four weeks with offers from those whose bar they clear', () => {
    const sim = capitalino('mx-query');
    sim.player.craft = evenCraft(95);
    expect(queryRefusal(sim, sim.player)).toMatch(/headshots/);
    careerOf(sim.player).headshotsAt = sim.now;
    expect(queryRefusal(sim, sim.player)).toBeUndefined();
    const r = sim.execute<{ answersBy: number }>({ kind: 'career.query_agencies', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.answersBy - sim.now).toBe(28 * MS_DAY);
    // Six months before it's sent again.
    expect(queryRefusal(sim, sim.player)).toMatch(/six months on/);
    sim.advanceBy(QUERY.answerDays * MS_DAY + MS_DAY);
    const offers = careerOf(sim.player).offers;
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((o) => AGENCIES.find((a) => a.id === o.agencyId)!.countryId === 'mx' && o.cityId === MXC)).toBe(true);
    expect(Object.values(sim.universe.decisions).some((d) => /Having read your submission/.test(d.detail))).toBe(true);
    sim.advanceBy((QUERY.againDays - QUERY.answerDays) * MS_DAY);
    expect(queryRefusal(sim, sim.player)).toBeUndefined();
  });

  it('tells a submission no agency answered, below every bar; and isn’t sent with an agency, or before the career begins', () => {
    const sim = capitalino('mx-query-low');
    sim.player.craft = evenCraft(20);
    careerOf(sim.player).headshotsAt = sim.now;
    expect(sim.execute({ kind: 'career.query_agencies', payload: {} }).ok).toBe(true);
    sim.advanceBy(QUERY.answerDays * MS_DAY + MS_DAY);
    expect(careerOf(sim.player).offers).toHaveLength(0);
    expect(sim.universe.notifications.some((n) => n.title === 'No Agency Answered')).toBe(true);
    careerOf(sim.player).agencyId = 'shoot-management';
    expect(queryRefusal(sim, sim.player)).toMatch(/have an agency/);
    const student = quickSave({ startLocationId: MXC, homeRegionId: MXC, livesWhereBorn: true, wealth: 'wealthy' }, 'mx-query-student');
    careerOf(student.player).headshotsAt = student.now;
    expect(queryRefusal(student, student.player)).toMatch(/career has begun/);
    // Signed by another way before the answers come, they bring nothing.
    const signed = capitalino('mx-query-signed');
    signed.player.craft = evenCraft(95);
    careerOf(signed.player).headshotsAt = signed.now;
    expect(signed.execute({ kind: 'career.query_agencies', payload: {} }).ok).toBe(true);
    careerOf(signed.player).agencyId = 'look-management';
    signed.advanceBy(QUERY.answerDays * MS_DAY + MS_DAY);
    expect(careerOf(signed.player).offers).toHaveLength(0);
  });
});
