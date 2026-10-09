/**
 * Claims and care at home in Ireland and Mexico City
 * (`systems/homebenefits.ts`, `publicCareShareOf`).
 */
import { quickSave } from '@/engine';
import { exchange } from '@/engine/content/currency';
import { saveCurrency } from '@/engine/core/money';
import { MS_DAY } from '@/engine/core/time';
import { publicCareShareOf } from '@/engine/systems/health';
import { capitalMeans,desempleoRefusal,jobseekerRefusal,jobseekerWeek } from '@/engine/systems/homebenefits';
import { describe,expect,it } from 'vitest';

describe('Jobseeker’s Allowance', () => {
  it('takes Citizens Information’s means from savings: €55,000 is €90 a week', () => {
    expect(capitalMeans(55_000_00)).toBe(90_00);
    expect(capitalMeans(20_000_00)).toBe(0);
    expect(capitalMeans(30_000_00)).toBe(10_00);
  });

  it('pays €254 a week for days out of work, a fifth a day worked, after three unpaid days', () => {
    expect(jobseekerWeek(0, 3, 0)).toEqual({ due: Math.round((254_00 * 2) / 5), waited: 3 });
    expect(jobseekerWeek(0, 0, 0).due).toBe(254_00);
    expect(jobseekerWeek(2, 0, 0).due).toBe(Math.round((254_00 * 3) / 5));
    expect(jobseekerWeek(0, 0, 55_000_00).due).toBe(254_00 - 90_00);
  });

  it('is claimed by an Irish citizen living in Dublin, and paid weekly', () => {
    const sim = quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true, wealth: 'modest' }, 'ja');
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal) a.balance = Math.min(a.balance, 1_000_00);
    expect(jobseekerRefusal(sim, sim.player)).toBeUndefined();
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).ok).toBe(true);
    sim.advanceBy(15 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Jobseeker’s Allowance, the week').length).toBeGreaterThanOrEqual(1);
    const ny = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'ja-ny');
    expect(jobseekerRefusal(ny, ny.player)).toMatch(/living in Ireland/);
  });
});

describe('care at home', () => {
  it('charges a Dubliner €100 for the emergency department, nothing for a stay, €55 for a GP and at most €80 for prescriptions', () => {
    const sim = quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true }, 'ie-care');
    const cur = saveCurrency(sim.universe);
    const eur = (x: number) => (cur === 'EUR' ? x : exchange(x, 'EUR', cur)!);
    expect(publicCareShareOf(sim.player, 'stay', sim.now, cur)).toBe(0);
    expect(publicCareShareOf(sim.player, 'emergency', sim.now, cur)).toBe(eur(100_00));
    expect(publicCareShareOf(sim.player, 'visit', sim.now, cur)).toBe(eur(55_00));
    expect(publicCareShareOf(sim.player, 'rx-brand', sim.now, cur)).toBe(eur(80_00));
  });

  it('charges a Canadian in Toronto or Vancouver nothing for a doctor, the emergency department or a stay, and prescriptions only past OHIP+’s 25', () => {
    for (const city of ['ca-on-toronto', 'ca-bc-vancouver']) {
      const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true }, `ca-care-${city}`);
      const cur = saveCurrency(sim.universe);
      for (const care of ['stay', 'emergency', 'urgent', 'visit'] as const) expect(publicCareShareOf(sim.player, care, sim.now, cur)).toBe(0);
      expect(publicCareShareOf(sim.player, 'cleaning', sim.now, cur)).toBeUndefined();
      const age = (sim.now - sim.player.birthInstant) / (365.25 * MS_DAY);
      const under25 = city === 'ca-on-toronto' && age < 25;
      expect(publicCareShareOf(sim.player, 'rx-generic', sim.now, cur)).toBe(under25 ? 0 : undefined);
      // Past 25 in Ontario, private.
      expect(publicCareShareOf(sim.player, 'rx-brand', sim.player.birthInstant + 30 * 365.25 * MS_DAY, cur)).toBeUndefined();
    }
    const young = quickSave({ startLocationId: 'ca-on-toronto', homeRegionId: 'ca-on-toronto', livesWhereBorn: true }, 'ca-care-young');
    expect(publicCareShareOf(young.player, 'rx-brand', young.player.birthInstant + 20 * 365.25 * MS_DAY, saveCurrency(young.universe))).toBe(0);
    // An American living in Toronto isn't insured by OHIP.
    const us = quickSave({ startLocationId: 'ca-on-toronto', homeRegionId: 'us-ny-newyork' }, 'ca-care-us');
    expect(us.player.citizenshipId).toBe('us');
    expect(publicCareShareOf(us.player, 'stay', us.now, saveCurrency(us.universe))).toBeUndefined();
  });

  it('charges a Mexican in Mexico City nothing on IMSS-Bienestar, and a foreigner there as before', () => {
    const sim = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'mx-cmx-mexicocity', livesWhereBorn: true }, 'mx-care');
    expect(publicCareShareOf(sim.player, 'stay', sim.now, 'USD')).toBe(0);
    expect(publicCareShareOf(sim.player, 'rx-generic', sim.now, 'USD')).toBe(0);
    sim.player.citizenshipId = 'us';
    expect(publicCareShareOf(sim.player, 'stay', sim.now, 'USD')).toBeUndefined();
  });
});

describe('the Seguro de Desempleo', () => {
  // Filing for a Mexican come home was tested here until 2026-10-09: nothing comes home since the career's move went.
  it('isn’t filed for now, and a claim a save already holds is paid its three months, once', () => {
    const sim = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'mx-cmx-mexicocity', livesWhereBorn: true }, 'desempleo');
    const filed = sim.execute({ kind: 'benefits.claim', payload: {} });
    expect(filed.ok).toBe(false);
    expect(filed.error).toBe(desempleoRefusal());
    // Test setup: a claim an older save filed, and its first month on the calendar, as filing left them.
    sim.player.desempleo = { filedAt: sim.now, payments: 0 };
    sim.schedule({ at: sim.now + 30 * MS_DAY, kind: 'benefits.desempleo_month', label: 'Seguro De Desempleo', category: 'system', priority: 12, payload: { personId: sim.player.id } });
    sim.advanceBy(100 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Seguro de Desempleo, the month').length).toBe(3);
    // Nothing left on the calendar after the third.
    expect(sim.universe.scheduled.some((i) => i.kind === 'benefits.desempleo_month' && i.status === 'pending')).toBe(false);
  }, 60_000);
});
