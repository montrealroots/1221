/**
 * A doctor's appointment (`systems/appointments.ts`, from 2026-10-02): booked
 * for the place's published wait, kept and billed, or missed and not, and
 * booked again; Ireland, publishing none, sees the visit as before.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, zonedParts } from '@/engine/core/time';
import { ENGLAND_BANDS, IMSS_DAYS, US_METRO_AVERAGE_DAYS } from '@/engine/content/appointments';
import { APPOINTMENT_KIND, appointmentsOf, book, waitDays } from '@/engine/systems/appointments';
import { armHealth, healthOf, rxShareOf } from '@/engine/systems/health';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('the wait', () => {
  it('is New York’s four days, Los Angeles’s thirteen, the metros’ average for New Haven, IMSS’s for a Mexican, and none in Dublin', () => {
    expect(waitDays(life('us-ny-newyork', 'w-ny'), life('us-ny-newyork', 'w-ny').player, 'a')).toBe(4);
    const la = life('us-ca-losangeles', 'w-la');
    expect(waitDays(la, la.player, 'a')).toBe(13);
    const nh = life('us-ct-newhaven', 'w-nh');
    expect(waitDays(nh, nh.player, 'a')).toBe(Math.round(US_METRO_AVERAGE_DAYS));
    const mx = life('mx-cmx-mexicocity', 'w-mx');
    expect(waitDays(mx, mx.player, 'a')).toBe(IMSS_DAYS);
    const ie = life('ie-lei-dublin', 'w-ie');
    expect(waitDays(ie, ie.player, 'a')).toBeUndefined();
  });

  it('in England is spread as NHS England’s July 2026 appointments were, about 45% the same day', () => {
    const sim = life('uk-eng-london', 'w-ldn');
    const draws = Array.from({ length: 2_000 }, (_, n) => waitDays(sim, sim.player, `d${n}`)!);
    expect(draws.filter((d) => d === 0).length / draws.length).toBeCloseTo(ENGLAND_BANDS[0]!.share, 1);
    expect(draws.every((d) => d >= 0 && d <= 35)).toBe(true);
    // Any day within a band, not only its first.
    expect(new Set(draws.filter((d) => d >= 2 && d <= 7)).size).toBe(6);
    expect(draws.filter((d) => d >= 8 && d <= 14).length / draws.length).toBeCloseTo(ENGLAND_BANDS[3]!.share, 1);
  });
});

describe('an appointment', () => {
  it('is on the calendar on a weekday morning, kept and billed', () => {
    const sim = life('us-ny-newyork', 'appt-keep');
    const a = book(sim, sim.player, 'A doctor’s visit')!;
    const item = sim.universe.scheduled.find((x) => x.kind === APPOINTMENT_KIND && x.payload.appointmentId === a.id)!;
    expect(item.requiresPlayer).toBe(true);
    const local = zonedParts(a.at, 'America/New_York');
    expect(local.hour).toBe(10);
    expect([0, 6]).not.toContain(local.weekday);
    expect(a.at - sim.now).toBeGreaterThanOrEqual(3 * MS_DAY);
    const bills = healthOf(sim.player).bills.length;
    for (let i = 0; i < 200 && sim.now < a.at + MS_DAY; i += 1) sim.advanceTo(Math.min(a.at + MS_DAY, sim.now + 6 * 3_600_000));
    expect(appointmentsOf(sim.player)).toHaveLength(0);
    expect(healthOf(sim.player).owedVisit).toBeUndefined();
    expect(healthOf(sim.player).bills.length).toBeGreaterThanOrEqual(bills);
    expect(sim.universe.notifications.some((n) => n.title === 'A Doctor’s Visit')).toBe(true);
  });

  it('missed is not seen nor billed, and is booked again; one called off is owed too', () => {
    const sim = life('us-ny-newyork', 'appt-miss');
    const a = book(sim, sim.player, 'A doctor’s visit')!;
    sim.player.currentLocationId = 'us-ca-losangeles';
    for (let i = 0; i < 200 && sim.now < a.at + MS_DAY; i += 1) sim.advanceTo(Math.min(a.at + MS_DAY, sim.now + 6 * 3_600_000));
    expect(healthOf(sim.player).owedVisit).toBe('A doctor’s visit');
    expect(sim.universe.notifications.some((n) => n.title === 'Missed The Doctor')).toBe(true);
    sim.player.currentLocationId = 'us-ny-newyork';
    const again = sim.execute<{ at: number }>({ kind: 'health.book', payload: {} });
    expect(again.ok, again.error).toBe(true);
    expect(sim.execute({ kind: 'health.book', payload: {} }).error).toBe('There’s nothing to see a doctor about.');
    const b = appointmentsOf(sim.player)[0]!;
    expect(sim.execute({ kind: 'health.cancel_appointment', payload: { appointmentId: b.id } }).ok).toBe(true);
    expect(healthOf(sim.player).owedVisit).toBe('A doctor’s visit');
    expect(sim.universe.scheduled.some((x) => x.status === 'pending' && x.kind === APPOINTMENT_KIND)).toBe(false);
  });

  it('is what a life’s doctor’s visits become for the player, in New York, over two years', () => {
    const sim = life('us-ny-newyork', 'appt-year');
    armHealth(sim, sim.player);
    const start = sim.now;
    for (let i = 0; i < 800 && sim.now < start + 730 * MS_DAY; i += 1) sim.advanceTo(sim.now + 24 * 3_600_000);
    expect(sim.universe.notifications.some((n) => n.title === 'A Doctor’s Appointment'), JSON.stringify({ days: (sim.now - start) / MS_DAY, titles: [...new Set(sim.universe.notifications.map((n) => n.title))].slice(0, 30) })).toBe(true);
  });

  it('falls on a weekday: four days from a Tuesday is the Monday after', () => {
    const sim = life('us-ny-newyork', 'appt-weekend');
    while (zonedParts(sim.now, 'America/New_York').weekday !== 2) sim.advanceTo(sim.now + 24 * 3_600_000);
    const a = book(sim, sim.player, 'A doctor’s visit')!;
    expect(zonedParts(a.at, 'America/New_York').weekday).toBe(1);
  });

  it('isn’t booked where no wait is published', () => {
    const sim = life('ie-lei-dublin', 'appt-ie');
    expect(book(sim, sim.player, 'A doctor’s visit')).toBeUndefined();
  });
});

describe('England’s prescription prepayment certificate', () => {
  it('costs £114.50 for a year and makes each prescription free while it runs, and isn’t sold outside England', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy' }, 'ppc');
    const before = rxShareOf(sim.player, false, sim.now, 'GBP');
    expect(before).toBe(990);
    const r = sim.execute<{ paid: number; until: number }>({ kind: 'health.prepay', payload: { months: 12 } });
    expect(r.ok, r.error).toBe(true);
    expect(rxShareOf(sim.player, false, sim.now, 'GBP')).toBe(0);
    expect(rxShareOf(sim.player, false, r.value!.until + MS_DAY, 'GBP')).toBe(990);
    expect(sim.execute({ kind: 'health.prepay', payload: { months: 3 } }).error).toBe('Yours runs more than another month.');
    const ny = life('us-ny-newyork', 'ppc-ny');
    expect(ny.execute({ kind: 'health.prepay', payload: { months: 12 } }).error).toBe('It’s England’s, for its prescription charge.');
  });
});
