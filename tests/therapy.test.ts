/**
 * A course of CBT for depression (`systems/therapy.ts`, from 2026-10-03):
 * NICE's eight weekly sessions at a named practice's price, NHS Talking
 * Therapies free after its wait, and the depression lifted at the published
 * rate.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { inSaveMoney } from '@/engine/systems/banking';
import { healthOf } from '@/engine/systems/health';
import { THERAPY, THERAPISTS, sessionPrice, therapyLifts, therapyRefusal } from '@/engine/systems/therapy';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const depressed = (sim: Simulation) => { (healthOf(sim.player).chronic ??= {}).depression = { treated: false }; };

describe('a course of therapy', () => {
  it('is for depression, at a practice where you live, at its price', () => {
    const sim = life('us-ny-newyork', 'therapy-ny');
    // Starting without depression: conditions are drawn at the start of every life since 2026-10-09.
    delete healthOf(sim.player).chronic?.depression;
    expect(therapyRefusal(sim.player, 'The Center for CBT')).toBe('A course of therapy here is for depression.');
    depressed(sim);
    expect(therapyRefusal(sim.player, 'Priory')).toBe('Choose a therapist where you live.');
    expect(sessionPrice(sim, THERAPISTS.find((t) => t.name === 'The Center for CBT')!)).toBe(inSaveMoney(sim, 322_50, 'USD'));
    const r = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: 'The Center for CBT' } });
    expect(r.first - sim.now).toBe(7 * MS_DAY);
    expect(sim.execute({ kind: 'health.therapy', payload: { therapist: 'The Center for CBT' } }).error).toBe('You’re in a course already.');
    // Eight weeks on, the course is done, paid session by session.
    sim.advanceBy(9 * 7 * MS_DAY);
    expect(sim.player.therapy).toBeUndefined();
    expect(sim.universe.transactions.filter((t) => t.memo === 'The Center for CBT, a session')).toHaveLength(THERAPY.sessions);
  });

  it('is free on the NHS in London after its six weeks, and lifts at its rate', () => {
    const sim = life('uk-eng-london', 'therapy-ldn');
    depressed(sim);
    const r = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: 'NHS Talking Therapies' } });
    expect(r.first - sim.now).toBe(42 * MS_DAY);
    expect(therapyLifts(sim, sim.player, true, 1, 1)).toBe(true);
    expect(therapyLifts(sim, sim.player, true, 1, 0)).toBe(false);
    // Over many courses, near its 48.5% and a private course's 36%.
    const nhs = Array.from({ length: 2_000 }, (_, n) => therapyLifts(sim, sim.player, true, n)).filter(Boolean).length / 2_000;
    const priv = Array.from({ length: 2_000 }, (_, n) => therapyLifts(sim, sim.player, false, n)).filter(Boolean).length / 2_000;
    expect(nhs).toBeGreaterThan(0.44);
    expect(nhs).toBeLessThan(0.53);
    expect(priv).toBeGreaterThan(0.32);
    expect(priv).toBeLessThan(0.40);
    sim.advanceBy(42 * MS_DAY + 8 * 7 * MS_DAY + MS_DAY);
    expect(sim.player.therapy).toBeUndefined();
    expect(sim.universe.transactions.some((t) => t.memo.startsWith('NHS Talking Therapies'))).toBe(false);
  });
});
