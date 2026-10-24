/**
 * Mexico's IMSS pension under the 1997 law (`systems/imss.ts`, from
 * 2026-09-29): days contributed, the AFORE account, and the pension.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { IMSS, contribute, dayContribution, grownTo, imssMonthly, imssRefusal, weeksNeeded } from '@/engine/systems/imss';

const YEAR = 365.2425 * MS_DAY;

describe('the AFORE account', () => {
  it('puts in the band’s rate on a day’s wage and the cuota social, and nothing past 25 UMA', () => {
    // MXN 1,000 a day is 8.5 UMA: 10.638% and no cuota social.
    expect(dayContribution(1_000_00)).toBe(Math.round(1_000_00 * 0.10638));
    // The minimum wage: 6.275% and 12.16 pesos from the government.
    expect(dayContribution(315_04)).toBe(Math.round(315_04 * 0.06275) + 12_16);
    // 3 UMA: the 2.51 to 3 UMA band. (In 2026 the minimum wage, 2.69 UMA, is over the bands below it, so a wage at 2 UMA is in the first.)
    expect(dayContribution(3 * IMSS.umaDaily)).toBe(Math.round(3 * IMSS.umaDaily * 0.09151) + 8_77);
    expect(dayContribution(2 * IMSS.umaDaily)).toBe(Math.round(2 * IMSS.umaDaily * 0.06275) + 12_16);
    expect(dayContribution(100_000_00)).toBe(dayContribution(25 * IMSS.umaDaily));
  });

  it('counts days over seven as weeks, grows at 4% real less the fee, and asks 875 weeks in 2026 to 1,000 from 2031', () => {
    expect(weeksNeeded(2026)).toBe(875);
    expect(weeksNeeded(2029)).toBe(950);
    expect(weeksNeeded(2040)).toBe(1_000);
    const record = { days: 0, balance: 100_000_00, asOf: 0, recent: [] };
    expect(grownTo(record, YEAR)).toBe(Math.round(100_000_00 * 1.04 * (1 - 0.0054)));
  });
});

describe('the pension', () => {
  it('is paid from 65 on the year’s weeks, the Fondo topping it to the last year’s wage, and refused short of the weeks', () => {
    const sim = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'mx-cmx-mexicocity' }, 'imss-claim');
    const cur = saveCurrency(sim.universe);
    const pesos = (x: number) => (cur === 'MXN' ? x : exchange(x, 'MXN', cur)!);
    sim.player.birthInstant = sim.now - 65.2 * YEAR;
    // Three days' work in a week: three sevenths of a week.
    contribute(sim, sim.player, sim.now - 30 * MS_DAY, pesos(3 * 500_00), 3);
    expect(imssRefusal(sim, sim.player)).toMatch(/875 weeks this year, and your IMSS record has 0/);
    // A working life's weeks, the last year at 500 pesos a day.
    sim.player.imss!.days = 7 * 900;
    expect(imssRefusal(sim, sim.player)).toBeUndefined();
    const monthly = imssMonthly(sim.player.imss!, sim.now);
    // The account is small; the Fondo tops it to 500 pesos a day for a month, under its cap.
    expect(Math.abs(monthly - 500_00 * 30.4)).toBeLessThanOrEqual(100);
    const r = sim.execute<{ monthly: number }>({ kind: 'pension.imss', payload: {} });
    expect(r.ok, r.error).toBe(true);
    sim.advanceBy(35 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'IMSS pension, the month').length).toBe(1);
  });

  it('pays the guaranteed floor with no recent wage, and caps the Fondo at MXN 17,885.85', () => {
    expect(imssMonthly({ days: 7_000, balance: 0, asOf: 0, recent: [] }, YEAR)).toBe(IMSS.guaranteedFloor);
    expect(imssMonthly({ days: 7_000, balance: 0, asOf: 0, recent: [{ at: YEAR - MS_DAY, pesos: 5_000_00, days: 1 }] }, YEAR)).toBe(IMSS.fondoCap);
  });
});
