/**
 * Claims and care at home in Ireland and Mexico City
 * (`systems/homebenefits.ts`, `publicCareShareOf`).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { capitalMeans, desempleoRefusal, jobseekerRefusal, jobseekerWeek , differentialRent, hapRefusal, hapSplit } from '@/engine/systems/homebenefits';
import { publicCareShareOf } from '@/engine/systems/health';

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

  it('charges a Mexican in Mexico City nothing on IMSS-Bienestar, and a foreigner there as before', () => {
    const sim = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'mx-cmx-mexicocity', livesWhereBorn: true }, 'mx-care');
    expect(publicCareShareOf(sim.player, 'stay', sim.now, 'USD')).toBe(0);
    expect(publicCareShareOf(sim.player, 'rx-generic', sim.now, 'USD')).toBe(0);
    sim.player.citizenshipId = 'us';
    expect(publicCareShareOf(sim.player, 'stay', sim.now, 'USD')).toBeUndefined();
  });
});

describe('the Seguro de Desempleo', () => {
  it('pays a Mexican come home to the city three months of the UMA, once, and not one who never left', () => {
    const sim = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'mx-cmx-mexicocity', livesWhereBorn: true }, 'desempleo');
    expect(desempleoRefusal(sim, sim.player)).toMatch(/come home from abroad/);
    sim.player.returnedHomeAt = sim.now - 30 * MS_DAY;
    expect(desempleoRefusal(sim, sim.player)).toBeUndefined();
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).ok).toBe(true);
    sim.advanceBy(100 * MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Seguro de Desempleo, the month').length).toBe(3);
    expect(desempleoRefusal(sim, sim.player)).toMatch(/once in a life/);
    // Nothing left on the calendar after the third.
    expect(sim.universe.scheduled.some((i) => i.kind === 'benefits.desempleo_month' && i.status === 'pending')).toBe(false);
  }, 60_000);
});

describe('Dublin’s Housing Assistance Payment', () => {
  it('has the tenant pay 18% of net weekly income over €55, at least €35.82 a week, and the council the rest to its limit and 35%', () => {
    expect(differentialRent(0)).toBe(Math.round((35_82 * 52) / 12));
    expect(differentialRent(355_00)).toBe(Math.round((Math.round(300_00 * 0.18) * 52) / 12));
    // A room at €600: under €500 and 35% (€675), so the council pays all but the differential rent.
    const room = hapSplit(600_00, false, 0);
    expect(room.tenant).toBe(differentialRent(0));
    expect(room.council).toBe(600_00 - differentialRent(0));
    // A place at €1,200: the council to €891, and the tenant the rest besides.
    const own = hapSplit(1_200_00, true, 0);
    expect(own.council).toBe(891_00 - differentialRent(0));
    expect(own.tenant).toBe(differentialRent(0) + 1_200_00 - 891_00);
  });

  it('pays a low-income Dubliner’s landlord its part from the next month’s rent, and refuses someone not renting in Dublin', () => {
    const sim = quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true }, 'hap-rent');
    sim.player.citizenshipId = 'ie';
    expect(sim.player.home?.kind === 'own' || sim.player.home?.kind === 'shared').toBe(true);
    const r = sim.execute({ kind: 'benefits.hap', payload: {} });
    expect(r.ok, r.error).toBe(true);
    const rent = sim.universe.scheduled.find((i) => i.kind === 'home.rent' && i.status === 'pending')!;
    sim.advanceTo(rent.at + 60_000);
    expect(sim.universe.transactions.some((t) => t.memo === 'Housing Assistance Payment: Dublin City Council paid the landlord')).toBe(true);
    const cork = quickSave({ startLocationId: 'ie-m-cork', homeRegionId: 'ie-m-cork', livesWhereBorn: true }, 'hap-cork');
    expect(hapRefusal(cork, cork.player)).toMatch(/renting in Dublin/);
  });
});
