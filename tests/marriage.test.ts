/**
 * A partner's earnings, the bills split, marriage, divorce and a married
 * person's tax (`systems/marriage.ts`, `content/household.ts`, from
 * 2026-10-01).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { EARNINGS, divorceRate } from '@/engine/content/household';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { beginCareer, careerOf } from '@/engine/systems/career';
import { evenCraft } from '@/engine/systems/school';
import { netWorth } from '@/engine/systems/finance';
import { figuresFor } from '@/engine/systems/taxreturn';
import { metAtWork, type Contact } from '@/engine/systems/people';
import { billShare, divorceTerms, incomeOf, marriageCost, marriedRelief, marryRefusal, mayDivorce } from '@/engine/systems/marriage';
import { computeAnnualTax } from '@/engine/content/tax';
import { paycheck, roleById } from '@/engine/systems/career';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, units: number, from: string) => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const partner = (sim: Simulation, city: string, income?: Contact['income']): Contact => {
  const c = metAtWork(sim, sim.player, city, `p-${city}`, 'A Job');
  c.hours = 300; c.single = true; c.interested = true;
  c.dating = { since: sim.now, dates: 9, couple: sim.now };
  if (income) c.income = income;
  return c;
};

describe('a partner’s pay', () => {
  it('is drawn once from their country’s spread, and kept', () => {
    const sim = life('us-ny-newyork', 'mr-pay');
    const pays = Array.from({ length: 400 }, (_, i) => { const c = metAtWork(sim, sim.player, 'us-ny-newyork', `x${i}`, 'A Job'); return incomeOf(sim, sim.player, c); });
    const employed = pays.filter((p) => p.employed);
    expect(employed.length / pays.length).toBeGreaterThan(0.74);
    expect(employed.length / pays.length).toBeLessThan(0.87);
    const sorted = employed.map((p) => p.annual).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)]!;
    expect(median).toBeGreaterThan(EARNINGS.us!.spread!.p25);
    expect(median).toBeLessThan(EARNINGS.us!.spread!.p75);
    expect(sorted[0]).toBeGreaterThanOrEqual(EARNINGS.us!.spread!.p10 / 2);
    // Kept: drawn again, the same.
    const c = metAtWork(sim, sim.player, 'us-ny-newyork', 'kept', 'A Job');
    const first = incomeOf(sim, sim.player, c);
    expect(incomeOf(sim, sim.player, c)).toBe(first);
    // Mexico City's in minimum wages, a year's at most eight.
    const mx = metAtWork(sim, sim.player, 'mx-cmx-mexicocity', 'mx', 'A Job');
    expect(incomeOf(sim, sim.player, mx).annual).toBeLessThanOrEqual(9_582.47 * 12 * 8);
    expect(incomeOf(sim, sim.player, mx).currency).toBe('MXN');
  });
});

describe('the bills', () => {
  it('are half yours, or your share of what you both earned last year', () => {
    const sim = life('us-ny-newyork', 'mr-bills');
    const c = partner(sim, 'us-ny-newyork', { annual: 60_000, currency: 'USD', employed: true });
    sim.player.home = { ...sim.player.home!, kind: 'own' };
    expect(billShare(sim, sim.player)).toBe(1);
    c.livesWith = sim.now;
    expect(billShare(sim, sim.player)).toBe(0.5);
    const last = zonedParts(sim.now, sim.homeZone).year - 1;
    recordWages(sim.player, instantFromZoned({ year: last, month: 6, day: 1, hour: 12, minute: 0 }, sim.homeZone), sim.homeZone, { gross: 20_000_00 });
    expect(sim.execute({ kind: 'social.split', payload: { how: 'income' } }).ok).toBe(true);
    const theirs = inSave(sim, 60_000, 'USD');
    expect(billShare(sim, sim.player)).toBeCloseTo(20_000_00 / (20_000_00 + theirs), 10);
    sim.execute({ kind: 'social.split', payload: { how: 'even' } });
    expect(billShare(sim, sim.player)).toBe(0.5);
  });
});

describe('marrying', () => {
  it('costs the place’s license and ceremony, after its wait, with a wedding shared as the bills are', () => {
    const ny = life('us-ny-newyork', 'mr-ny');
    expect(marriageCost(ny, ny.player, false)).toMatchObject({ fee: inSave(ny, 35, 'USD'), wedding: 0, waitDays: 1 });
    expect(marriageCost(ny, ny.player, true)!.wedding).toBe(inSave(ny, 34_200, 'USD'));
    const ldn = life('uk-eng-london', 'mr-ldn');
    expect(marriageCost(ldn, ldn.player, false)).toMatchObject({ fee: inSave(ldn, 2 * 46.5 + 62 + 12.5, 'GBP'), waitDays: 29 });
    const c = partner(ldn, 'uk-eng-london', { annual: 30_000, currency: 'GBP', employed: true });
    ldn.player.home = { ...ldn.player.home!, kind: 'own' };
    c.livesWith = ldn.now;
    expect(marriageCost(ldn, ldn.player, true)!.wedding).toBe(Math.round(inSave(ldn, 21_990, 'GBP') * 0.5));
  });

  it('is to your partner in your town, once set, and held when you come', () => {
    const sim = life('us-ny-newyork', 'mr-wed');
    const friend = metAtWork(sim, sim.player, 'us-ny-newyork', 'f', 'A Job');
    expect(marryRefusal(sim, sim.player, friend.id)).toBe('You can marry only your partner.');
    const c = partner(sim, 'us-ny-newyork', { annual: 50_000, currency: 'USD', employed: true });
    expect(marryRefusal(sim, sim.player, c.id)).toBeUndefined();
    const r = sim.execute<{ at: number }>({ kind: 'social.marry', payload: { contactId: c.id } });
    expect(r.ok, r.error).toBe(true);
    expect(marryRefusal(sim, sim.player, c.id)).toBe('Your wedding is already set.');
    expect(r.value!.at - sim.now).toBeGreaterThanOrEqual(MS_DAY - 24 * 3_600_000);
    sim.advanceTo(r.value!.at - 60_000);
    sim.player.currentLocationId = 'us-ny-newyork';
    const morale = (sim.player.wellbeing.morale = 50);
    sim.advanceTo(r.value!.at + 1);
    expect(sim.player.marriage).toMatchObject({ contactId: c.id, at: r.value!.at });
    expect(sim.player.wellbeing.morale).toBeGreaterThan(morale);
    // Missed, it doesn't happen.
    const away = life('us-ny-newyork', 'mr-miss');
    const d = partner(away, 'us-ny-newyork', { annual: 50_000, currency: 'USD', employed: true });
    const w = away.execute<{ at: number }>({ kind: 'social.marry', payload: { contactId: d.id } });
    away.advanceTo(w.value!.at - 60_000);
    away.player.currentLocationId = 'us-ct-newhaven';
    away.advanceTo(w.value!.at + 1);
    expect(away.player.marriage).toBeUndefined();
  });
});

describe('divorce', () => {
  const married = (city: string, seed: string, separate = false) => {
    const sim = life(city, seed);
    const c = partner(sim, city, { annual: 40_000, currency: 'USD', employed: true });
    sim.player.marriage = { contactId: c.id, at: sim.now, worthAt: netWorth(sim, sim.player.id).total - 100_000_00, ...(separate ? { separate: true } : {}) };
    return { sim, c };
  };

  it('divides half of what your worth gained, where the law halves or equalizes, and nothing under separate property', () => {
    const { sim } = married('us-ca-losangeles', 'dv-ca');
    expect(divorceTerms(sim, sim.player)).toMatchObject({ fee: inSave(sim, 435, 'USD'), settlement: 50_000_00, waitDays: 183 });
    const on = married('ca-on-toronto', 'dv-on');
    expect(divorceTerms(on.sim, on.sim.player)!.settlement).toBe(50_000_00);
    const mx = married('mx-cmx-mexicocity', 'dv-mx', true);
    expect(divorceTerms(mx.sim, mx.sim.player)!.settlement).toBe(0);
  });

  it('asked for, is final after the law’s wait, the division paid and the partner gone', () => {
    const { sim, c } = married('uk-eng-london', 'dv-final');
    const r = sim.execute<{ finalAt: number }>({ kind: 'social.divorce', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.finalAt - sim.now).toBe(26 * 7 * MS_DAY);
    expect(sim.execute({ kind: 'social.break_up', payload: { contactId: c.id } }).error).toMatch(/only a divorce/);
    const settled = divorceTerms(sim, sim.player)!.settlement;
    sim.advanceTo(r.value!.finalAt + 2 * 60_000);
    expect(sim.player.marriage).toBeUndefined();
    expect(c.dating).toBeUndefined();
    expect(sim.universe.transactions.some((t) => t.memo === 'The divorce’s division of property')).toBe(settled > 0);
  });

  it('is asked for by them at the place’s rate for the marriage’s length', () => {
    expect(divorceRate(3, 'ca')).toBeCloseTo(0.03, 10);
    expect(divorceRate(10, 'us')).toBeCloseTo(0.018, 10);
    expect(divorceRate(25, 'mx')).toBeCloseTo(0.01, 10);
    expect(divorceRate(5, 'uk')).toBeCloseTo(1 - Math.pow(0.832, 0.1), 10);
    const { sim } = married('us-ny-newyork', 'dv-them');
    expect(mayDivorce(sim, sim.player, 2, 0)).toBe(false);
    expect(mayDivorce(sim, sim.player, 2, 1)).toBe(true);
    expect(sim.player.marriage!.divorcing!.by).toBe('them');
  });
});

describe('a married person’s tax', () => {
  it('relieves by each country’s rule: Britain’s allowance, Canada’s spouse amount, Ireland’s band', () => {
    const at = (sim: Simulation) => sim.now;
    const ldn = life('uk-eng-london', 'tx-uk');
    const c = partner(ldn, 'uk-eng-london', { annual: 8_000, currency: 'GBP', employed: true });
    ldn.player.marriage = { contactId: c.id, at: ldn.now - MS_DAY, worthAt: 0 };
    expect(marriedRelief(ldn.player, 'uk-eng-london', at(ldn), 'GBP')).toEqual({ deductions: 1_260_00 });
    c.income = { annual: 20_000, currency: 'GBP', employed: true };
    expect(marriedRelief(ldn.player, 'uk-eng-london', at(ldn), 'GBP')).toBeUndefined();
    const to = life('ca-on-toronto', 'tx-ca');
    const d = partner(to, 'ca-on-toronto', { annual: 0, currency: 'CAD', employed: false });
    to.player.marriage = { contactId: d.id, at: to.now - MS_DAY, worthAt: 0 };
    expect(marriedRelief(to.player, 'ca-on-toronto', at(to), 'CAD')!.credit).toBe(Math.round((0.15 * 16_452 + 0.0505 * 11_029) * 100));
    const du = life('ie-lei-dublin', 'tx-ie');
    const e = partner(du, 'ie-lei-dublin', { annual: 0, currency: 'EUR', employed: false });
    du.player.marriage = { contactId: e.id, at: du.now - MS_DAY, worthAt: 0 };
    // No income last year: only the married credit's extra €2,000.
    expect(marriedRelief(du.player, 'ie-lei-dublin', at(du), 'EUR')!.credit).toBe(2_000_00);
  });

  it('in America, is the joint return’s, your share of twice the tax on half of what you both made', () => {
    const tax = (spouse?: number) => {
      const sim = life('us-ny-newyork', 'tx-us');
      const year = zonedParts(sim.now, sim.homeZone).year;
      recordWages(sim.player, instantFromZoned({ year, month: 3, day: 1, hour: 12, minute: 0 }, sim.homeZone), sim.homeZone, { gross: 150_000_00 });
      if (spouse !== undefined) {
        const c = partner(sim, 'us-ny-newyork', { annual: spouse, currency: 'USD', employed: spouse > 0 });
        sim.player.marriage = { contactId: c.id, at: sim.now, worthAt: 0 };
      }
      return figuresFor(sim.player, year).federal;
    };
    const single = tax();
    // A spouse who earns nothing: the marriage bonus, a lower federal tax.
    expect(tax(0)).toBeLessThan(single);
    // A spouse who earns as much: twice the tax on the same half, your share half of it, the same as single.
    expect(Math.abs(tax(150_000) - single)).toBeLessThanOrEqual(2);
  });
});

describe('the withholding', () => {
  it('takes the married relief: Britain’s allowance is £252 off a basic-rate earner’s year', () => {
    const at = instantFromZoned({ year: 2026, month: 10, day: 1, hour: 12, minute: 0 }, 'Europe/London');
    const plain = computeAnnualTax(30_000_00, 'uk-eng-london', at, { currency: 'GBP' });
    const relieved = computeAnnualTax(30_000_00, 'uk-eng-london', at, { currency: 'GBP', relief: { deductions: 1_260_00 } });
    expect(plain.federal - relieved.federal).toBe(252_00);
    const role = roleById('uk-tv');
    const check = (relief?: { deductions: number }) => paycheck({ scale: 5_000_00, role, rehearsal: false, represented: false, before: 12_000_00, cityId: 'uk-eng-london', at, currency: 'GBP', ...(relief ? { relief } : {}) }).withheld;
    // A week that takes the year across the personal allowance: £252 less withheld, the allowance's whole year.
    expect(check() - check({ deductions: 1_260_00 })).toBe(252_00);
  });

  it('is taken by a week’s pay: a married Londoner has less withheld on the same work', () => {
    const withheld = (married: boolean) => {
      const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy' }, 'mr-week');
      sim.player.craft = evenCraft(75);
      beginCareer(sim, sim.player);
      if (married) {
        const c = partner(sim, 'uk-eng-london', { annual: 5_000, currency: 'GBP', employed: true });
        sim.player.marriage = { contactId: c.id, at: sim.now - MS_DAY, worthAt: 0 };
      }
      const career = careerOf(sim.player);
      const zone = 'Europe/London';
      // Earned already this year to just under the personal allowance, so this job crosses it, where the transferred allowance tells.
      recordWages(sim.player, instantFromZoned({ year: 2026, month: 2, day: 1, hour: 12, minute: 0 }, zone), zone, { gross: 12_000_00 });
      const before = yearOf(sim.player, 2026).withheld;
      const starts = instantFromZoned({ year: 2026, month: 10, day: 5, hour: 8, minute: 0 }, zone);
      sim.advanceTo(instantFromZoned({ year: 2026, month: 10, day: 1, hour: 8, minute: 0 }, zone));
      career.bookings.push({ id: 'uk1', roleId: 'uk-tv', cityId: 'uk-eng-london', starts, units: 2, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 } as never);
      expect(sim.execute({ kind: 'career.accept', payload: { bookingId: 'uk1' } }).ok).toBe(true);
      const until = instantFromZoned({ year: 2026, month: 10, day: 20, hour: 18, minute: 0 }, zone);
      while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80 }); sim.advanceTo(Math.min(until, sim.now + 6 * 3_600_000), { stopOnPlayerRequired: true }); }
      return yearOf(sim.player, 2026).withheld - before;
    };
    expect(withheld(false)).toBeGreaterThan(0);
    expect(withheld(true)).toBeLessThan(withheld(false));
  });
});
