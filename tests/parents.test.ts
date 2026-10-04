/**
 * Your parents: their ages, deaths and care (`systems/parents.ts`,
 * `content/parents.ts`, from 2026-10-02).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { CARE_VISIT_KIND, careMonthly, careOf, careRefusal, deathOf, meetParents, needsCare, parentsMonth, type Parent } from '@/engine/systems/parents';

const YEAR = 365.2425 * MS_DAY;
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, units: number, from: string) => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };

describe('your parents', () => {
  it('are born their country’s mean age before you, where you were born', () => {
    const ny = life('us-ny-newyork', 'parents-ny');
    const [mother, father] = meetParents(ny, ny.player, ny.now);
    expect((ny.player.birthInstant - mother!.born) / YEAR).toBeCloseTo(27.5, 6);
    expect((ny.player.birthInstant - father!.born) / YEAR).toBeCloseTo(27.5, 6);
    expect(mother!.cityId).toBe('us-ny-newyork');
    expect(meetParents(ny, ny.player, ny.now)).toBe(ny.player.parents);
    const ldn = life('uk-eng-london', 'parents-uk');
    expect((ldn.player.birthInstant - meetParents(ldn, ldn.player, ldn.now)[1]!.born) / YEAR).toBeCloseTo(33.9, 6);
  });

  it('die as the life table has it, longer lived where the country’s are', () => {
    const sim = life('us-ny-newyork', 'parents-death');
    const at = Date.UTC(2026, 0, 1);
    const born = at - 55 * YEAR;
    const mean = (country: string) => { let s = 0; for (let k = 0; k < 600; k += 1) s += (deathOf(sim, `k${k}`, born, country, at) - born) / YEAR; return s / 600; };
    expect(mean('us')).toBeGreaterThan(75);
    expect(mean('us')).toBeLessThan(88);
    expect(mean('ie')).toBeGreaterThan(mean('mx'));
    for (let k = 0; k < 50; k += 1) expect(deathOf(sim, `k${k}`, born, 'us', at)).toBeGreaterThanOrEqual(born + 55 * YEAR);
  });

  it('need care from 65 at the ACL’s 70%, a mother for 3.7 years on average, at home or in a facility', () => {
    const sim = life('us-ny-newyork', 'parents-care');
    const born = Date.UTC(1950, 0, 1);
    const dies = born + 90 * YEAR;
    let need = 0; let years = 0; let facility = 0;
    for (let k = 0; k < 3_000; k += 1) {
      const c = careOf(sim, `k${k}`, 'mother', born, dies);
      if (!c) continue;
      need += 1; years += (dies - c.from) / YEAR; if (c.kind === 'facility') facility += 1;
      expect(c.from).toBeGreaterThanOrEqual(born + 65 * YEAR);
    }
    expect(need / 3_000).toBeCloseTo(0.7, 1);
    expect(years / need).toBeCloseTo(3.7, 0);
    expect(facility / need).toBeCloseTo(0.37, 1);
    expect(careOf(sim, 'young', 'mother', born, born + 60 * YEAR)).toBeUndefined();
  });
});

describe('their care', () => {
  const parent = (cityId: string, kind: 'home' | 'facility', at: number): Parent => ({ role: 'mother', born: at - 80 * YEAR, cityId, dies: at + 2 * YEAR, care: { from: at - YEAR, kind } });

  it('costs what it costs where they live, and nothing where it isn’t the family’s to pay', () => {
    const sim = life('us-ny-newyork', 'care-cost');
    expect(careMonthly(sim, parent('us-ny-newyork', 'home', sim.now))).toBe(inSave(sim, (35 * 27 * 52) / 12, 'USD'));
    expect(careMonthly(sim, parent('us-ct-newhaven', 'facility', sim.now))).toBe(inSave(sim, 9_118, 'USD'));
    expect(careMonthly(sim, parent('uk-eng-london', 'facility', sim.now))).toBe(inSave(sim, (1_298 * 52) / 12, 'GBP'));
    expect(careMonthly(sim, parent('ca-on-toronto', 'facility', sim.now))).toBe(inSave(sim, 2_129.17, 'CAD'));
    expect(careMonthly(sim, parent('uk-eng-london', 'home', sim.now))).toBe(0);
    expect(careMonthly(sim, parent('ie-lei-dublin', 'facility', sim.now))).toBe(0);
  });

  it('paid for, is charged each month; given, wears on you in their town; a death weighs', () => {
    const sim = life('us-ny-newyork', 'care-month');
    const p = parent('us-ny-newyork', 'facility', sim.now);
    sim.player.parents = [p];
    expect(needsCare(p, sim.now)).toBe(true);
    expect(careRefusal(sim.player, p, 'give', sim.now)).toBeUndefined();
    expect(careRefusal(sim.player, { ...p, cityId: 'us-ca-losangeles' }, 'give', sim.now)).toBe('They live in Los Angeles.');
    expect(careRefusal(sim.player, { ...p, care: undefined }, 'pay', sim.now)).toBe('They don’t need care.');
    expect(sim.execute({ kind: 'family.care', payload: { role: 'mother', how: 'pay' } }).ok).toBe(true);
    const before = sim.universe.transactions.length;
    parentsMonth(sim, sim.player, sim.now);
    expect(sim.universe.transactions.slice(before).some((t) => t.memo === 'Your mother’s care')).toBe(true);
    sim.execute({ kind: 'family.care', payload: { role: 'mother', how: 'give' } });
    sim.player.wellbeing.stress = 10;
    parentsMonth(sim, sim.player, sim.now);
    expect(sim.player.wellbeing.stress).toBeGreaterThan(10);
    sim.player.wellbeing.morale = 80;
    parentsMonth(sim, sim.player, p.dies + MS_DAY);
    expect(p.died).toBe(true);
    expect(sim.player.wellbeing.morale).toBeLessThan(80);
  });
});

describe('care given as time', () => {
  const parent = (cityId: string, kind: 'home' | 'facility', at: number): Parent => ({ role: 'mother', born: at - 80 * YEAR, cityId, dies: at + 2 * YEAR, care: { from: at - YEAR, kind } });
  it('books an evening visit in their town, a seventh of the week’s hours, and stops when it’s no longer given', () => {
    const sim = life('us-ny-newyork', 'care-time');
    const p = parent('us-ny-newyork', 'home', sim.now);
    sim.player.parents = [p];
    sim.must({ kind: 'family.care', payload: { role: 'mother', how: 'give' } });
    const visits = () => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === CARE_VISIT_KIND);
    expect(visits()).toHaveLength(1);
    const v = visits()[0]!;
    expect(v.requiresPlayer).toBe(true);
    expect(v.durationMinutes).toBe(Math.round((27 * 60) / 7));
    expect(v.at - sim.now).toBeLessThan(2 * MS_DAY);
    // A week on, still one booked: each visit books the next.
    sim.advanceBy(7 * MS_DAY);
    expect(visits()).toHaveLength(1);
    sim.must({ kind: 'family.care', payload: { role: 'mother', how: 'pay' } });
    expect(visits()).toHaveLength(0);
  });
});
