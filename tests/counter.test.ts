/**
 * Asking for more on an offer (`counterOffer` in `systems/career.ts`, from 2026-10-02).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { COUNTER, careerOf, counterOffer } from '@/engine/systems/career';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const offer = (id: string, roleId: string, rate?: number) => ({ id, roleId, cityId: 'us-ny-newyork', starts: Date.UTC(2027, 0, 4), units: 5, rehearsalWeeks: 0, status: 'offered', dueAt: Date.UTC(2027, 0, 1), offeredAt: Date.UTC(2026, 11, 20), worked: 0, owed: 0, ...(rate ? { rate } : {}) }) as never as ReturnType<typeof careerOf>['bookings'][number];

describe('asking for more', () => {
  it('is met at the field study’s 85%, raising the rate 12.45%, once an offer', () => {
    const sim = life('counter-met');
    const b = offer('b1', 'film-weekly', 1_000_00);
    expect(counterOffer(sim, sim.player, b, 1)).toEqual({ met: true, rate: Math.round(1_000_00 * (1 + COUNTER.raise)) });
    expect(counterOffer(sim, sim.player, b, 1)).toBe('You’ve asked once already.');
    const c = offer('b2', 'film-weekly', 1_000_00);
    expect(counterOffer(sim, sim.player, c, 0)).toEqual({ met: false });
    expect(c.rate).toBe(1_000_00);
    let met = 0;
    for (let k = 0; k < 2_000; k += 1) { const r = counterOffer(sim, sim.player, offer(`m${k}`, 'film-weekly', 1_000_00)); if (typeof r !== 'string' && r.met) met += 1; }
    expect(met / 2_000).toBeCloseTo(COUNTER.met, 1);
  });

  it('changes nothing below a series regular in television, or for a commercial', () => {
    const sim = life('counter-scale');
    for (const roleId of ['guest-hour', 'costar', 'recurring', 'commercial']) {
      const b = offer(`t-${roleId}`, roleId, 1_000_00);
      expect(counterOffer(sim, sim.player, b, 1)).toEqual({ met: false });
      expect(b.rate).toBe(1_000_00);
    }
    const lead = offer('series', 'series-hour', 10_000_00);
    expect(counterOffer(sim, sim.player, lead, 1)).toMatchObject({ met: true });
  });

  it('isn’t asked of an offer that’s gone, and the command re-offers at the new rate', () => {
    const sim = life('counter-cmd');
    const gone = offer('g', 'film-weekly', 1_000_00);
    (gone as { status: string }).status = 'lapsed';
    expect(counterOffer(sim, sim.player, gone, 1)).toBe('That isn’t an offer open to you.');
    const b = offer('c', 'film-weekly', 1_000_00);
    careerOf(sim.player).bookings.push(b);
    const r = sim.execute<{ met: boolean }>({ kind: 'career.counter', payload: { bookingId: 'c' } });
    expect(r.ok, r.error).toBe(true);
    expect(b.countered).toBe(true);
    expect(sim.execute({ kind: 'career.counter', payload: { bookingId: 'c' } }).error).toBe('You’ve asked once already.');
  });
});
