/**
 * A doctor's visit that ends in a referral (`mayRefer` in
 * `systems/appointments.ts`, from 2026-10-02): the place's share, its
 * published wait to a specialist, and none where neither is published.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { REFERRAL_DAYS, REFERRAL_SHARE, SPECIALIST, appointmentsOf, book, mayRefer, referralDays } from '@/engine/systems/appointments';
import { healthOf } from '@/engine/systems/health';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a referral', () => {
  it('waits the place’s published time to the specialist', () => {
    expect(referralDays(life('us-ny-newyork', 'ref-ny').player)).toBe(31);
    expect(referralDays(life('uk-eng-london', 'ref-ldn').player)).toBe(84);
    expect(referralDays(life('ca-on-toronto', 'ref-to').player)).toBe(Math.round(REFERRAL_DAYS.ca['ca-08']));
    expect(referralDays(life('ca-bc-vancouver', 'ref-van').player)).toBe(Math.round(REFERRAL_DAYS.ca['ca-02']));
    expect(referralDays(life('ie-lei-dublin', 'ref-dub').player)).toBeUndefined();
  });

  it('is booked as an appointment the wait away, and refers no further', () => {
    const sim = life('us-ny-newyork', 'ref-book');
    const visit = { id: 'v1', at: sim.now, what: 'A checkup' };
    const a = mayRefer(sim, sim.player, visit, 1)!;
    expect(a.what).toBe(SPECIALIST);
    expect(a.at - sim.now).toBeGreaterThanOrEqual(31 * MS_DAY - MS_DAY);
    expect(a.at - sim.now).toBeLessThanOrEqual(34 * MS_DAY);
    expect(appointmentsOf(sim.player)).toContain(a);
    expect(sim.universe.scheduled.some((x) => x.status === 'pending' && x.label === 'A Specialist')).toBe(true);
    expect(mayRefer(sim, sim.player, a, 1)).toBeUndefined();
    expect(mayRefer(sim, sim.player, { ...visit, id: 'v2' }, 0)).toBeUndefined();
  });

  it('is drawn at about the place’s share, and not where none is published', () => {
    const sim = life('us-ny-newyork', 'ref-share');
    let n = 0;
    for (let i = 0; i < 1000; i += 1) if (mayRefer(sim, sim.player, { id: `s${i}`, at: sim.now + i, what: 'A checkup' })) n += 1;
    expect(n / 1000).toBeGreaterThan(REFERRAL_SHARE.us! - 0.03);
    expect(n / 1000).toBeLessThan(REFERRAL_SHARE.us! + 0.03);
    const dub = life('ie-lei-dublin', 'ref-none');
    expect(mayRefer(dub, dub.player, { id: 'd', at: dub.now, what: 'A checkup' }, 1)).toBeUndefined();
  });

  it('comes of a visit kept, and a missed one is booked again the specialist’s wait away', () => {
    const sim = life('us-ny-newyork', 'ref-kept');
    const p = sim.player;
    let referred = false;
    for (let i = 0; i < 80 && !referred; i += 1) {
      const a = book(sim, p, 'A checkup ' + i)!;
      const will = sim.rng('health.referral', p.id, a.id, a.at).next() < REFERRAL_SHARE.us!;
      if (!will) { sim.must({ kind: 'health.cancel_appointment', payload: { appointmentId: a.id } }); delete healthOf(p).owedVisit; continue; }
      for (let k = 0; k < 200 && sim.now < a.at + 3_600_000; k += 1) sim.advanceTo(Math.min(a.at + 3_600_000, sim.now + 6 * 3_600_000));
      referred = appointmentsOf(p).some((x) => x.what === SPECIALIST);
    }
    expect(referred).toBe(true);
    // Missed, it's booked again a month away, not the family doctor's four days.
    const s = appointmentsOf(p).find((x) => x.what === SPECIALIST)!;
    sim.must({ kind: 'health.cancel_appointment', payload: { appointmentId: s.id } });
    expect(healthOf(p).owedVisit).toBe(SPECIALIST);
    const r = sim.execute<{ at: number }>({ kind: 'health.book', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.at - sim.now).toBeGreaterThan(28 * MS_DAY);
  });
});
