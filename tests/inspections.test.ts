/**
 * A car's periodic inspection (`systems/inspections.ts`, docs/WORLD.md stage
 * 7a, from 2026-09-29): each place's cycle and fee, none where the law asks
 * none, and the fee paid as the car's month comes round.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { INSPECTION_RULES, inspectIfDue, inspectionFails, nextInspection } from '@/engine/systems/inspections';
import { caYear, kept, modelById, quote, renewal, valueOf, type Quote } from '@/engine/systems/vehicles';
import { US_NEW_BELOW_STICKER } from '@/engine/content/vehiclefees';

const YEAR = 365.2425 * MS_DAY;
const at = Date.UTC(2026, 8, 29);
const car = (jurisdiction: 'US-NY' | 'US-CT' | 'US-CA' | 'GB' | 'IE' | 'CA-ON' | 'MX-CMX', ageAtPurchase = 0, cityId = 'us-ny-newyork') => ({ id: 'car', boughtAt: at, ageAtPurchase, jurisdiction, cityId });
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };

describe('when a car is inspected', () => {
  it('takes England’s first MOT on the third anniversary, then yearly; a used car’s next on its anniversary', () => {
    expect(nextInspection(car('GB'), at)).toBe(at + 3 * YEAR);
    expect(nextInspection(car('GB'), at + 3 * YEAR)).toBe(at + 4 * YEAR);
    // Five and a half years old when bought: its next is six years from registration.
    expect(nextInspection(car('GB', 5.5), at)).toBe(at + 0.5 * YEAR);
  });

  it('takes Ireland’s NCT at four years, every two to ten, then yearly', () => {
    const due = [nextInspection(car('IE'), at)!];
    for (let i = 0; i < 5; i += 1) due.push(nextInspection(car('IE'), due[due.length - 1]!)!);
    expect(due.map((d) => Math.round((d - at) / YEAR))).toEqual([4, 6, 8, 10, 11, 12]);
  });

  it('inspects New York’s cars yearly from the sale, Connecticut’s every two years from the fourth, Mexico City’s every six months, California’s every two from the eighth, and none in Ontario', () => {
    expect(nextInspection(car('US-NY'), at)).toBe(at + YEAR);
    expect(nextInspection(car('US-CT'), at)).toBe(at + 4 * YEAR);
    expect(nextInspection(car('US-CT'), at + 4 * YEAR)).toBe(at + 6 * YEAR);
    expect(nextInspection(car('MX-CMX'), at)).toBe(at + 0.5 * YEAR);
    expect(nextInspection(car('CA-ON'), at)).toBeUndefined();
    // California's smog check from later on 2026-09-30: every two years from the eighth model year, at BAR's $69.16 and the $8.25 certificate.
    expect(nextInspection(car('US-CA'), at)).toBe(at + 8 * YEAR);
    expect(nextInspection(car('US-CA'), at + 8 * YEAR)).toBe(at + 10 * YEAR);
    expect(INSPECTION_RULES['US-CA']!.fee('us-ca-losangeles')).toBeCloseTo(77.41, 6);
    expect(INSPECTION_RULES['US-CA']!.fails!.rate('us-ca-losangeles', 9)).toBe(0.076);
  });

  it('charges California’s smog abatement fee to a car’s eighth year, $20 and then $25, and not on an electric car', () => {
    const gas = modelById('us-toyota-camry')!;
    const ev = modelById('us-tesla-model-y')!;
    expect(caYear(gas, 30_000_00, 3) - caYear(gas, 30_000_00, 9)).toBe(20_00);
    expect(caYear(gas, 30_000_00, 7) - caYear(gas, 30_000_00, 9)).toBe(25_00);
    expect(caYear(ev, 30_000_00, 3)).toBe(caYear(ev, 30_000_00, 9));
    // The sale's registration line and a renewal each at the car's age.
    const reg = (age: number) => (quote(gas, 'us-ca-losangeles', at, { age }) as Quote).lines.find((l) => l.label === 'Registration, The Year')!.amount;
    const sold = (age: number) => Math.round((gas.price + (age ? 0 : gas.delivery)) * kept(age)) - (age ? 0 : Math.round((gas.price + gas.delivery) * US_NEW_BELOW_STICKER));
    expect(reg(0)).toBe(caYear(gas, sold(0), 0));
    expect(reg(9)).toBe(caYear(gas, sold(9), 9));
    const v = { id: 'r', modelId: gas.id, boughtAt: at, ageAtPurchase: 7, listPrice: gas.price, jurisdiction: 'US-CA' as const, cityId: 'us-ca-losangeles', coverage: 'full' as const, registrationDue: at };
    expect(renewal(v, at).amount).toBe(caYear(gas, valueOf(v, at), 7));
  });

  it('smog-checks a nine-year-old petrol car in Los Angeles within its two years, and never an electric one', () => {
    const drive = (modelId: string, seed: string) => {
      const sim = quickSave({ startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles', livesWhereBorn: true, wealth: 'wealthy' }, seed);
      const r = sim.execute({ kind: 'vehicle.buy', payload: { modelId, age: 10 } });
      expect(r.ok, r.error).toBe(true);
      sim.advanceBy(800 * MS_DAY);
      return sim.universe.transactions.some((t) => /Smog Check/.test(t.memo));
    };
    expect(drive('us-toyota-camry', 'smog-gas')).toBe(true);
    expect(drive('us-tesla-model-y', 'smog-ev')).toBe(false);
  });
});

describe('what it costs', () => {
  it('charges New York City’s $37 once it’s due, $21 outside the metropolitan area, and nothing before', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'inspect-ny');
    const v: Parameters<typeof inspectIfDue>[2] = { ...car('US-NY'), boughtAt: sim.now };
    expect(inspectIfDue(sim, sim.player, v)).toBe(false);
    sim.advanceBy(YEAR + MS_DAY);
    expect(inspectIfDue(sim, sim.player, v)).toBe(true);
    const paid = sim.universe.transactions.filter((t) => t.memo === 'The car’s State Inspection');
    expect(paid.at(-1)!.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0)).toBe(inSave(sim, 37_00, 'USD'));
    expect(inspectIfDue(sim, sim.player, v)).toBe(false);
    const upstate: Parameters<typeof inspectIfDue>[2] = { ...car('US-NY', 0, 'us-ny-hudson'), id: 'car2', boughtAt: sim.now - YEAR - MS_DAY };
    expect(inspectIfDue(sim, sim.player, upstate)).toBe(true);
    expect(sim.universe.transactions.filter((t) => t.memo === 'The car’s State Inspection').at(-1)!.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0)).toBe(inSave(sim, 21_00, 'USD'));
  });

  it('pays a used car’s MOT on the car’s month once it falls due', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy' }, 'inspect-gb');
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 30_000_00, 'GBP');
    const r = sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'gb-ford-puma', age: 5 } });
    expect(r.ok, r.error).toBe(true);
    sim.advanceBy(11 * 30 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo === 'The car’s MOT')).toBe(false);
    sim.advanceBy(60 * MS_DAY);
    const mot = sim.universe.transactions.filter((t) => t.memo === 'The car’s MOT');
    expect(mot).toHaveLength(1);
    expect(mot[0]!.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0)).toBe(inSave(sim, 54_85, 'GBP'));
  });
});

describe('a test failed', () => {
  const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy' }, 'inspect-fail');
  const share = (v: ReturnType<typeof car>) => {
    let n = 0;
    for (let i = 0; i < 4_000; i += 1) if (inspectionFails(sim, { ...v, id: `car${i}` }, at + YEAR)) n += 1;
    return n / 4_000;
  };

  it('fails each place’s published share: the MOT by the car’s age, the NCT 49.43%, New York City’s 6.0%, upstate 6.41%, Connecticut 7.4%, Mexico City none', () => {
    // From 2026-10-01 the MOT by age: 10.7% at three, 22.8% at ten, 30.5% at fifteen and past it.
    expect(Math.abs(share(car('GB', 2)) - 0.107)).toBeLessThan(0.02);
    expect(Math.abs(share(car('GB', 9)) - 0.228)).toBeLessThan(0.02);
    expect(Math.abs(share(car('GB', 20)) - 0.305)).toBeLessThan(0.02);
    expect([3, 4, 10, 15, 25, 1].map((age) => INSPECTION_RULES.GB!.fails!.rate('uk-eng-london', age))).toEqual([0.107, 0.111, 0.228, 0.305, 0.305, 0.107]);
    expect(share(car('IE'))).toBeCloseTo(0.4943, 1);
    expect(Math.abs(share(car('US-NY')) - 0.06)).toBeLessThan(0.012);
    expect(Math.abs(share(car('US-NY', 0, 'us-ny-hudson')) - 0.0641)).toBeLessThan(0.012);
    expect(Math.abs(share(car('US-CT')) - 0.074)).toBeLessThan(0.012);
    expect(share(car('MX-CMX'))).toBe(0);
    // Too near to tell apart by sampling: the rates themselves.
    expect(INSPECTION_RULES['US-NY']!.fails!.rate('us-ny-newyork', 5)).toBeCloseTo(0.06, 10);
    expect(INSPECTION_RULES['US-NY']!.fails!.rate('us-ny-hudson', 5)).toBeCloseTo(0.0641, 10);
  });

  it('prices the repair by the car’s age after an MOT, CarMD’s average in America, and the NCT’s €40 retest', () => {
    const failing = (v: ReturnType<typeof car>, due: number) => { for (let i = 0; i < 400; i += 1) { const f = inspectionFails(sim, { ...v, id: `f${i}` }, due); if (f) return f; } throw new Error('none failed'); };
    expect(failing(car('GB'), at + 5.9 * YEAR).repair).toBeCloseTo(332 - 54.85, 5);
    expect(failing(car('GB'), at + 6 * YEAR).repair).toBeCloseTo(425 - 54.85, 5);
    expect(failing(car('US-CT'), at + YEAR)).toEqual({ repair: 554.01, repairCurrency: 'USD', retest: 0 });
    expect(failing(car('IE'), at + YEAR)).toMatchObject({ repairCurrency: 'GBP', retest: 40 });
  });

  it('pays the repair and the retest when the car fails, and tells the player', () => {
    const ie = quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true, wealth: 'wealthy' }, 'inspect-ie');
    let v: Parameters<typeof inspectIfDue>[2] | undefined;
    for (let i = 0; i < 100 && !v; i += 1) { const c = { ...car('IE', 3.9, 'ie-lei-dublin'), id: `ie${i}`, boughtAt: ie.now - 0.2 * YEAR }; if (inspectionFails(ie, c, nextInspection(c, c.boughtAt)!)) v = c; }
    expect(inspectIfDue(ie, ie.player, v!)).toBe(true);
    const bill = ie.universe.transactions.filter((t) => t.memo === 'The car’s repair after its NCT, and the retest');
    expect(bill).toHaveLength(1);
    const want = exchange(Math.round((332 - 54.85) * 100), 'GBP', saveCurrency(ie.universe))! + inSave(ie, 40_00, 'EUR');
    expect(bill[0]!.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0)).toBe(want);
    expect(ie.universe.notifications.some((n) => n.title === 'The Car Failed Its NCT')).toBe(true);
  });
});
