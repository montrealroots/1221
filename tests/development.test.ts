/**
 * Development (`develop` in `systems/attributes.ts`, `systems/practice.ts`):
 * each ability and technique grown by the work that trains it, ordinary work
 * levelling off at the reach and deliberate practice going on to full; the
 * same practice again the same day giving less, a day's practice stopping at
 * four hours, and nothing gained from anything but the hours themselves.
 */

import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { abilityGain, abilitiesOf, develop, developmentOf, levelOf } from '@/engine/systems/attributes';
import { DEVELOPMENT, MASTERED, ABILITY_DEFS, TECHNIQUES } from '@/engine/content/abilities';
import { EXERCISES, PRACTICE, exerciseFor } from '@/engine/content/practice';
import { practiceRefusal } from '@/engine/systems/practice';
import { reachOf } from '@/engine/systems/school';
import { MS_HOUR, MS_DAY, instantFromZoned } from '@/engine/core/time';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };

/** A free, rested hour: no call, no class, awake, at home in New Haven. */
function freeHour(sim: Simulation) {
  const p = sim.player;
  for (let tries = 0; tries < 200; tries += 1) {
    const busy = EXERCISES.length && practiceRefusal(sim, p, EXERCISES.find((e) => e.id === 'concentration'));
    if (!busy) break;
    play(sim, sim.now + MS_HOUR);
    p.awakeSince = Math.min(p.awakeSince ?? sim.now, sim.now - MS_HOUR);
  }
  Object.assign(p.wellbeing, { energy: 95, stress: 10, sleepDebt: 0, nourishment: 85, morale: 70 });
}

describe('the pace', () => {
  it('takes an ability from 55 to full in about 380 hours of deliberate practice, and a technique from its reach to mastery in about 115', () => {
    const hours = (from: number, to: number, reach: number) => { let level = from; let h = 0; while (level < to - 1e-9 && h < 5000) { level = Math.min(100, level + abilityGain(level, reach, { weight: 1, focus: 1, deliberate: true })); h += 1; } return h; };
    const ability = hours(55, 100, 81);
    const technique = hours(78, MASTERED, 78);
    expect(ability).toBeGreaterThan(300);
    expect(ability).toBeLessThan(450);
    expect(technique).toBeGreaterThan(80);
    expect(technique).toBeLessThan(150);
    // Ordinary work stops at the reach; deliberate practice reaches full.
    expect(abilityGain(78, 78, { weight: 1, focus: 1, deliberate: false })).toBe(0);
    expect(abilityGain(99.99, 78, { weight: 1, focus: 1, deliberate: true })).toBeGreaterThan(0);
    expect(abilityGain(100, 78, { weight: 1, focus: 1, deliberate: true })).toBe(0);
    expect(DEVELOPMENT.repeat).toBe(0.5);
  });
});

describe('growth from the right work', () => {
  it('grows an ordinary session toward the reach and no further, and a deliberate one past it to full and never over', () => {
    const sim = life('dev-reach');
    const p = sim.player;
    const reach = reachOf(p, 'listening');
    p.attrs!.listening = reach;
    expect(develop(sim, p, 'listening', { weight: 1, focus: 1, deliberate: false, source: 'test' }, reach)).toBe(0);
    expect(develop(sim, p, 'listening', { weight: 1, focus: 1, deliberate: true, source: 'test2' }, reach)).toBeGreaterThan(0);
    p.attrs!.listening = 99.99;
    develop(sim, p, 'listening', { weight: 1, focus: 1, deliberate: true, source: 'test3' }, reach);
    expect(p.attrs!.listening).toBe(100);
  });

  it('has an exercise for every ability practiced alone and every technique, and each grows what it names and is recorded', () => {
    const covered = new Set(EXERCISES.map((e) => e.trains));
    for (const t of TECHNIQUES) expect(covered.has(t), t).toBe(true);
    for (const d of ABILITY_DEFS) if (!['presence', 'composure', 'stamina', 'discipline'].includes(d.id)) expect(exerciseFor(d.id), d.id).toBeDefined();
    const sim = life('dev-every-exercise');
    play(sim, instantFromZoned({ year: 2026, month: 9, day: 5, hour: 9 }, 'America/New_York'));
    for (const e of EXERCISES) {
      freeHour(sim);
      const before = levelOf(sim, sim.player, e.trains);
      const r = sim.execute<{ gained: number }>({ kind: 'practice.exercise', payload: { exercise: e.id } });
      expect(r.ok, `${e.id}: ${r.ok ? '' : r.error}`).toBe(true);
      expect(levelOf(sim, sim.player, e.trains), e.id).toBeGreaterThan(before);
      expect(developmentOf(sim.player).history.some((h) => h.source === `practice:${e.id}`), e.id).toBe(true);
      // Past the day's four hours, a new day.
      if (developmentOf(sim.player).practice!.hours >= PRACTICE.dailyHours) play(sim, sim.now + 20 * MS_HOUR);
    }
  }, 120_000);
});

describe('what can’t be farmed', () => {
  it('gives half again for the same exercise the same day, all of it the next day, and stops the day at four hours', () => {
    const sim = life('dev-farm');
    play(sim, instantFromZoned({ year: 2026, month: 9, day: 6, hour: 17 }, 'America/New_York'));
    freeHour(sim);
    const gains: number[] = [];
    for (let n = 0; n < 4; n += 1) {
      Object.assign(sim.player.wellbeing, { energy: 95, stress: 10 });
      const r = sim.execute<{ gained: number }>({ kind: 'practice.exercise', payload: { exercise: 'given-circumstances' } });
      expect(r.ok, r.ok ? '' : r.error).toBe(true);
      gains.push(r.ok ? r.value!.gained : 0);
    }
    for (let i = 1; i < gains.length; i += 1) expect(gains[i]!).toBeLessThan(gains[i - 1]! * 0.6);
    const fifth = sim.execute({ kind: 'practice.exercise', payload: { exercise: 'concentration' } });
    expect(fifth.ok).toBe(false);
    expect(fifth.ok ? '' : fifth.error).toContain('4 hours');
    // Discipline once for the day, not four times.
    expect(developmentOf(sim.player).history.filter((h) => h.source === 'practice-day')).toHaveLength(1);
  });

  it('keeps the day’s count through a save and a load: reloading gives no fresh hours', () => {
    const sim = life('dev-reload');
    play(sim, instantFromZoned({ year: 2026, month: 9, day: 6, hour: 17 }, 'America/New_York'));
    freeHour(sim);
    const first = sim.execute<{ gained: number }>({ kind: 'practice.exercise', payload: { exercise: 'recall-drill' } });
    const reopened = loadSave(JSON.parse(JSON.stringify(sim.universe)));
    Object.assign(reopened.player.wellbeing, { energy: 95, stress: 10 });
    const again = reopened.execute<{ gained: number }>({ kind: 'practice.exercise', payload: { exercise: 'recall-drill' } });
    expect(first.ok && again.ok).toBe(true);
    if (first.ok && again.ok) expect(again.value!.gained).toBeLessThan(first.value!.gained * 0.6);
  });

  it('takes nothing away for resting: a fortnight idle leaves every ability but stamina where it was', () => {
    const sim = life('dev-rest');
    play(sim, instantFromZoned({ year: 2026, month: 8, day: 1, hour: 9 }, 'America/New_York'));
    const before = abilitiesOf(sim, sim.player);
    sim.advanceTo(sim.now + 14 * MS_DAY);
    const after = abilitiesOf(sim, sim.player);
    for (const d of ABILITY_DEFS) {
      if (d.id === 'stamina') continue;
      expect(after[d.id], d.id).toBeGreaterThanOrEqual(before[d.id]);
    }
  });
});
