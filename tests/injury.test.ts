/**
 * Getting hurt (2026-09-28): at each thing's published rate, its care, its
 * time to mend and off work, and workers' compensation for one at work.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { INJURY, INJURY_KIND, WORKERS_COMP } from '@/engine/content/injury';
import { chanceOver, compWeek, compWeekly, everydayInjury, injuryOf, laidUp, mayHurt, trainingRefusal } from '@/engine/systems/injury';
import { healthOf } from '@/engine/systems/health';

const life = (seed: string, city = 'us-ny-newyork') => quickSave({ startLocationId: city, homeRegionId: city, wealth: 'wealthy' }, seed);

describe('getting hurt', () => {
  it('comes in everyday life at the NHIS’s 94 a thousand a year', { timeout: 300_000 }, () => {
    const sim = life('hurt-everyday');
    let hurt = 0;
    const days = 365 * 1500;
    for (let d = 0; d < days; d += 1) {
      delete healthOf(sim.player).injury;
      if (everydayInjury(sim, sim.player, sim.now + d * MS_DAY)) hurt += 1;
    }
    const expected = (days / 365) * Object.values(INJURY.everydayYearly).reduce((a, b) => a + b, 0) / 1000;
    expect(hurt).toBeGreaterThan(expected * 0.75);
    expect(hurt).toBeLessThan(expected * 1.25);
    // A thousand hours of running at its rate: 7.7 in a thousand.
    expect(chanceOver(INJURY.perThousandHours.run, 1000)).toBeCloseTo(1 - Math.exp(-7.7), 6);
  });

  it('keeps a hurt body from training till it mends, and a broken bone or a concussion off work too', () => {
    const sim = life('hurt-kinds');
    const hurt = mayHurt(sim, sim.player, 'struck', 1, sim.now)!;
    expect(hurt).toBeDefined();
    expect(injuryOf(sim.player, sim.now)).toBe(hurt);
    expect(laidUp(sim.player, sim.now)).toBe(INJURY_KIND[hurt.kind].offWork);
    healthOf(sim.player).injury = { kind: 'fracture', at: sim.now, until: sim.now + 50 * MS_DAY, offWorkUntil: sim.now + 50 * MS_DAY };
    expect(laidUp(sim.player, sim.now + MS_DAY)).toBe(true);
    expect(trainingRefusal(sim.player, sim.now)).toMatch(/broken bone/);
    expect(laidUp(sim.player, sim.now + 51 * MS_DAY)).toBe(false);
    healthOf(sim.player).injury = { kind: 'cut', at: sim.now, until: sim.now + 5 * MS_DAY };
    expect(trainingRefusal(sim.player, sim.now)).toBeUndefined();
    // Not twice at once.
    healthOf(sim.player).injury = { kind: 'sprain', at: sim.now, until: sim.now + 5 * MS_DAY };
    expect(mayHurt(sim, sim.player, 'fall', 1, sim.now)).toBeUndefined();
  });

  it('bills its care away from work, and at work leaves it to workers’ compensation', () => {
    const home = life('hurt-bill');
    const before = healthOf(home.player).bills.length;
    mayHurt(home, home.player, 'cutting', 1, home.now);
    expect(healthOf(home.player).bills.length).toBe(before + 1);
    const work = life('hurt-work');
    const b = healthOf(work.player).bills.length;
    mayHurt(work, work.player, 'cutting', 1, work.now, { cityId: 'us-ny-newyork', weeklyWage: 2_000_00 });
    expect(healthOf(work.player).bills.length).toBe(b);
  });

  it('pays two-thirds of the week’s wage off work, between New York’s floor and ceiling, the first week only past fourteen days', () => {
    const sim = life('hurt-comp');
    const start = sim.now;
    const ny = WORKERS_COMP.states['us-ny']!;
    // Thirty days off at $3,000 a week: the ceiling, from the first day.
    healthOf(sim.player).injury = { kind: 'fracture', at: start, until: start + 30 * MS_DAY, offWorkUntil: start + 30 * MS_DAY, atWork: { stateId: 'us-ny', weeklyWage: 3_000_00, paidDays: 0 } };
    expect(compWeek(sim, sim.player, start + 7 * MS_DAY)).toBe(Math.round((ny.max * 7) / 7));
    expect(compWeek(sim, sim.player, start + 30 * MS_DAY)).toBe(Math.round((ny.max * 23) / 7));
    // Ten days off at $900 a week: two-thirds, the first seven unpaid.
    healthOf(sim.player).injury = { kind: 'concussion', at: start, until: start + 10 * MS_DAY, offWorkUntil: start + 10 * MS_DAY, atWork: { stateId: 'us-ny', weeklyWage: 900_00, paidDays: 0 } };
    expect(compWeek(sim, sim.player, start + 7 * MS_DAY)).toBe(0);
    expect(compWeek(sim, sim.player, start + 10 * MS_DAY)).toBe(Math.round((600_00 * 3) / 7));
  });

  it('in Connecticut, where the school is, pays 75% of the wage after tax from the fourth day, or the first past six, never above 75% of the wage (from 2026-10-10)', () => {
    const sim = life('hurt-comp-ct');
    const start = sim.now;
    // The Summer Cabaret's $375 a week, five days off: three waiting days unpaid, two paid at 75% of it after tax.
    healthOf(sim.player).injury = { kind: 'sprain', at: start, until: start + 5 * MS_DAY, offWorkUntil: start + 5 * MS_DAY, atWork: { stateId: 'us-ct', weeklyWage: 375_00, paidDays: 0 } };
    const weekly = compWeekly(sim, WORKERS_COMP.states['us-ct']!, 375_00, start);
    expect(weekly).toBeLessThanOrEqual(Math.round(375_00 * 0.75));
    expect(weekly).toBeGreaterThan(Math.round(375_00 * 0.6));
    expect(compWeek(sim, sim.player, start + 3 * MS_DAY)).toBe(0);
    expect(compWeek(sim, sim.player, start + 5 * MS_DAY)).toBe(Math.round((weekly * 2) / 7));
    // Eight days off: paid from the first.
    healthOf(sim.player).injury = { kind: 'sprain', at: start, until: start + 8 * MS_DAY, offWorkUntil: start + 8 * MS_DAY, atWork: { stateId: 'us-ct', weeklyWage: 375_00, paidDays: 0 } };
    expect(compWeek(sim, sim.player, start + 8 * MS_DAY)).toBe(Math.round((weekly * 8) / 7));
  });
});
