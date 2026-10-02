/**
 * A personal trainer (`systems/trainers.ts`, from 2026-10-02).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { SUPERVISED, sessionPrice, trainedSession, trainersIn } from '@/engine/systems/trainers';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a personal trainer', () => {
  it('is a town’s named studios, cheapest first, with the place’s tax where it’s added', () => {
    expect(trainersIn('uk-eng-london').map((t) => t.name)).toEqual(['A PureGym Trainer', 'Third Space']);
    expect(trainersIn('ca-on-toronto').map((t) => t.id)).toEqual(['studio-fitness', 'atom-athletics']);
    const sim = life('ca-on-toronto', 'trainer-tax');
    const cad = (n: number) => { const c = Math.round(n * 100); return saveCurrency(sim.universe) === 'CAD' ? c : exchange(c, 'CAD', saveCurrency(sim.universe))!; };
    expect(sessionPrice(sim, trainersIn('ca-on-toronto')[1]!)).toBe(cad(84 * 1.13));
  });

  it('makes a workout build 37% more, paid a session at a time, as many a week as booked, and only in their town', () => {
    const sim = life('us-ct-newhaven', 'trainer-week');
    expect(trainedSession(sim, sim.player, sim.now)).toBe(1);
    expect(sim.execute({ kind: 'gym.trainer', payload: { trainerId: 'north-haven-health-racquet', perWeek: 2 } }).ok).toBe(true);
    const before = sim.universe.transactions.length;
    expect(trainedSession(sim, sim.player, sim.now)).toBe(SUPERVISED);
    expect(trainedSession(sim, sim.player, sim.now + 1)).toBe(SUPERVISED);
    expect(trainedSession(sim, sim.player, sim.now + 2)).toBe(1);
    expect(sim.universe.transactions.slice(before).filter((t) => t.memo === 'North Haven Health & Racquet, a session')).toHaveLength(2);
    expect(trainedSession(sim, sim.player, sim.now + 7 * MS_DAY)).toBe(SUPERVISED);
    sim.player.currentLocationId = 'us-ny-newyork';
    expect(trainedSession(sim, sim.player, sim.now + 15 * MS_DAY)).toBe(1);
    expect(sim.execute({ kind: 'gym.trainer', payload: { trainerId: 'north-haven-health-racquet' } }).error).toBe('That trainer isn’t in the town you’re in.');
  });

  it('builds more on a workout than the gym alone', () => {
    const plain = life('us-ct-newhaven', 'trainer-build');
    const coached = life('us-ct-newhaven', 'trainer-build');
    coached.execute({ kind: 'gym.trainer', payload: { trainerId: 'north-haven-health-racquet', perWeek: 3 } });
    for (const s of [plain, coached]) Object.assign(s.player.wellbeing, { fitness: 40, energy: 90, stress: 30 });
    plain.execute({ kind: 'life.look_after', payload: { action: 'exercise' } });
    coached.execute({ kind: 'life.look_after', payload: { action: 'exercise' } });
    expect(coached.player.wellbeing.fitness).toBeGreaterThan(plain.player.wellbeing.fitness);
  });
});
