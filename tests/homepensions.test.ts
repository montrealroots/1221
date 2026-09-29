/**
 * Ireland's State Pension (Contributory) and Mexico's Pensión para el
 * Bienestar (`systems/homepensions.ts`).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { recordWages } from '@/engine/systems/earnings';
import { bienestarRefusal, irishContributions, irishPensionRefusal, irishWeekly } from '@/engine/systems/homepensions';

const YEAR = 365.2425 * MS_DAY;

function at(place: string, seed: string) {
  const sim = quickSave({ startLocationId: place, homeRegionId: place, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  const cur = saveCurrency(sim.universe);
  const inCur = (x: number, from: string) => (cur === from ? x : exchange(x, from, cur)!);
  return { sim, cur, inCur };
}

describe('Ireland’s State Pension', () => {
  it('counts 52 contributions for a year of Irish earnings at €5,000, and none for a thinner year or London work', () => {
    const { sim, cur, inCur } = at('ie-lei-dublin', 'iep-record');
    recordWages(sim.player, Date.UTC(2031, 6, 1), 'Europe/Dublin', { gross: inCur(5_000_00, 'EUR'), where: 'ie-lei-dublin' });
    recordWages(sim.player, Date.UTC(2032, 6, 1), 'Europe/Dublin', { gross: inCur(4_000_00, 'EUR'), where: 'ie-lei-dublin' });
    recordWages(sim.player, Date.UTC(2033, 6, 1), 'Europe/Dublin', { gross: inCur(40_000_00, 'EUR'), where: 'uk-eng-london' });
    expect(irishContributions(sim.player, cur)).toBe(52);
    // A year after they turn 66 is past the record.
    sim.player.birthInstant = Date.UTC(1968, 0, 1);
    recordWages(sim.player, Date.UTC(2035, 6, 1), 'Europe/Dublin', { gross: inCur(9_000_00, 'EUR'), where: 'ie-lei-dublin' });
    expect(irishContributions(sim.player, cur)).toBe(52);
  });

  it('pays the full rate times contributions over 2,080, from 520, and more for waiting to 67 and 68', () => {
    expect(irishWeekly(519, 66)).toBe(0);
    expect(irishWeekly(1_040, 66)).toBe(Math.round(299_30 / 2));
    expect(irishWeekly(2_600, 66)).toBe(299_30);
    expect(irishWeekly(2_080, 67)).toBe(313_40);
    expect(irishWeekly(2_080, 69)).toBe(328_90);
  });

  it('is claimed from 66 on a record of ten years, and paid weekly', () => {
    const { sim, inCur } = at('ie-lei-dublin', 'iep-claim');
    sim.player.birthInstant = sim.now - 65.9 * YEAR;
    const born = new Date(sim.player.birthInstant).getUTCFullYear();
    for (let y = born + 30; y < born + 50; y += 1) recordWages(sim.player, Date.UTC(y, 6, 1), 'Europe/Dublin', { gross: inCur(30_000_00, 'EUR'), where: 'ie-lei-dublin' });
    expect(irishPensionRefusal(sim, sim.player)).toMatch(/From 66/);
    sim.player.birthInstant = sim.now - 66.05 * YEAR;
    const r = sim.execute<{ weekly: number }>({ kind: 'pension.ie_state', payload: {} });
    expect(r.ok, r.error).toBe(true);
    // Twenty years, 1,040 contributions: half the full rate.
    expect(r.value!.weekly).toBe(inCur(Math.round(299_30 / 2), 'EUR'));
    expect(irishPensionRefusal(sim, sim.player)).toBe('You’re drawing it.');
    sim.advanceBy(15 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'The State Pension (Contributory), the week').length).toBe(2);
  });
});

describe('the Pensión para el Bienestar', () => {
  it('pays a Mexican of 65 in Mexico City MXN 6,400 every two months, and not before 65', () => {
    const { sim, inCur } = at('mx-cmx-mexicocity', 'bien-claim');
    sim.player.citizenshipId = 'mx';
    sim.player.birthInstant = sim.now - 64.9 * YEAR;
    expect(bienestarRefusal(sim, sim.player)).toBe('From 65.');
    sim.player.birthInstant = sim.now - 65.05 * YEAR;
    const r = sim.execute<{ bimonthly: number }>({ kind: 'pension.bienestar', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.bimonthly).toBe(inCur(6_400_00, 'MXN'));
    sim.advanceBy(125 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Pensión para el Bienestar, two months').length).toBe(2);
    // Held while they live abroad.
    sim.player.home = { ...sim.player.home!, cityId: 'us-ny-newyork' };
    sim.advanceBy(125 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Pensión para el Bienestar, two months').length).toBe(2);
  });

  it('isn’t a Mexican’s living abroad, nor a foreigner’s in Mexico', () => {
    const { sim } = at('mx-cmx-mexicocity', 'bien-who');
    sim.player.birthInstant = sim.now - 70 * YEAR;
    sim.player.citizenshipId = 'us';
    expect(bienestarRefusal(sim, sim.player)).toMatch(/for Mexicans\./);
    const abroad = at('us-ny-newyork', 'bien-abroad').sim;
    abroad.player.citizenshipId = 'mx';
    abroad.player.birthInstant = abroad.now - 70 * YEAR;
    expect(bienestarRefusal(abroad, abroad.player)).toMatch(/living in Mexico/);
  });
});
