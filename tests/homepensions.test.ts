/**
 * Ireland's State Pension (Contributory) and Mexico's Pensión para el
 * Bienestar (`systems/homepensions.ts`).
 */
import { quickSave } from '@/engine';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import { MS_DAY } from '@/engine/core/time';
import { recordWages } from '@/engine/systems/earnings';
import { bienestarRefusal,irishContributions,irishPensionRefusal,irishWeekPaid,irishWeekly,nonContributoryWeekly } from '@/engine/systems/homepensions';
import { describe,expect,it } from 'vitest';

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

describe('Ireland’s means-tested pension', () => {
  it('pays €288 less every euro of means over €30, by €2.50, and €298 from 80', () => {
    expect(nonContributoryWeekly(70, 0)).toBe(288_00);
    expect(nonContributoryWeekly(70, 30_00)).toBe(288_00);
    expect(nonContributoryWeekly(70, 31_00)).toBe(285_50);
    expect(nonContributoryWeekly(70, 130_00)).toBe(188_00);
    expect(nonContributoryWeekly(82, 0)).toBe(298_00);
    expect(nonContributoryWeekly(70, 400_00)).toBe(0);
  });

  it('isn’t paid to someone living abroad without an Irish record', () => {
    const { sim } = at('us-ny-newyork', 'ncp-abroad');
    sim.player.citizenshipId = 'ie';
    sim.player.birthInstant = sim.now - 70 * YEAR;
    expect(irishPensionRefusal(sim, sim.player)).toMatch(/living in Ireland/);
    // And a week of it, paid abroad on a contributory pension of nothing, is nothing.
    for (const acct of Object.values(sim.universe.accounts)) if (acct.ownerId === sim.player.id && (acct.kind === 'checking' || acct.kind === 'savings')) acct.balance = 0;
    expect(irishWeekPaid(sim, sim.player, 0, sim.now).total).toBe(0);
  });
});

describe('the Pensión para el Bienestar', () => {

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
