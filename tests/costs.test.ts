/**
 * What was built in on 2026-09-27's last round: what an actor's work costs
 * them, diabetes and arthritis carried, insulin's caps, stand-alone dental
 * plans, medical prices grown to the year they're paid, and Yale Health's
 * own cost-sharing (`systems/career.ts`, `systems/health.ts`,
 * `content/safetynet.ts`).
 */
import { createSave,quickSave } from '@/engine';
import { exchange } from '@/engine/content/currency';
import { CARE,CHRONIC,DENTAL_PLANS,DENTAL_VISION,INSULIN,PHARMACY,RECEIPTS,STATE_DEDUCTIONS,medicalGrowth } from '@/engine/content/safetynet';
import { computeAnnualTax } from '@/engine/content/tax';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY,instantFromZoned,zonedParts } from '@/engine/core/time';
import { recordJobCost,recordWages } from '@/engine/systems/earnings';
import { drawChronic,fillMedicine,grown,healthMonth,healthOf,illnessWeek,insulinShareOf,keepUp,monitorShareOf,rxShareOf,shareOf,teethAndEyesShareOf } from '@/engine/systems/health';
import { evenCraft } from '@/engine/systems/school';
import { figuresFor } from '@/engine/systems/taxreturn';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { describe,expect,it } from 'vitest';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
function pro(seed: string, city = 'us-ny-newyork'): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(50);
  return sim;
}

describe('tax on money that isn’t dollars', () => {
  it('is worked out on what it comes to in dollars, and said in its own money', () => {
    const at = Date.UTC(2027, 5, 1);
    const isk = 10_000_000_00;
    const inUsd = exchange(isk, 'ISK', 'USD')!;
    const theirs = computeAnnualTax(isk, 'us-ny-newyork', at, { currency: 'ISK' });
    const dollars = computeAnnualTax(inUsd, 'us-ny-newyork', at);
    expect(theirs.gross).toBe(isk);
    expect(theirs.federal).toBe(exchange(dollars.federal, 'USD', 'ISK'));
    expect(theirs.total).toBe(theirs.federal + theirs.regional + theirs.local + theirs.payroll);
    // Not the dollar table read in krónur: ten million krónur taxed as ten million dollars, at twice the rate.
    expect(theirs.total).toBeLessThan(computeAnnualTax(isk, 'us-ny-newyork', at).total * 0.6);
    // A deduction is money too, and converted with the rest.
    const off = 1_000_000_00;
    expect(computeAnnualTax(isk, 'us-ny-newyork', at, { currency: 'ISK', deductions: off }).regional).toBe(exchange(computeAnnualTax(inUsd, 'us-ny-newyork', at, { deductions: exchange(off, 'ISK', 'USD')! }).regional, 'USD', 'ISK'));
    // In dollars it's the same computation.
    expect(computeAnnualTax(inUsd, 'us-ny-newyork', at, { currency: 'USD' })).toEqual(dollars);
  });
});

describe('an actor’s working costs', () => {

  it('counts the work’s costs in New York’s itemized deduction, above 2% of income', () => {
    const sim = pro('itemize');
    recordWages(sim.player, at(2027, 3, 1), NY, { gross: 100_000_00, commission: 8_000_00 });
    recordJobCost(sim.player, at(2027, 5, 1), 12_000_00);
    // Four in five of the rest have a receipt, for somebody who doesn't keep accounts.
    const extra = 8_000_00 + 12_000_00 * RECEIPTS.kept - 0.02 * 100_000_00 - STATE_DEDUCTIONS.standard['us-ny']!;
    const ny = figuresFor(sim.player, 2027).states.find((s) => s.state === 'us-ny')!;
    expect(ny.tax).toBe(computeAnnualTax(100_000_00, 'us-ny-newyork', at(2027, 12, 31, 12), { deductions: extra }).regional);
  });
});

describe('diabetes and arthritis', () => {
  it('are drawn at a young adult’s rates, diabetes about a quarter type 1', () => {
    const sim = pro('draw');
    const n = 20_000;
    const count: Record<string, number> = {};
    let typeOne = 0;
    for (let i = 0; i < n; i += 1) {
      const person = { id: 'p' + i } as unknown as Parameters<typeof drawChronic>[1];
      drawChronic(sim, person);
      const c = person.health!.chronic!;
      for (const k of Object.keys(c)) count[k] = (count[k] ?? 0) + 1;
      if (c.diabetes?.typeOne) typeOne += 1;
      expect(c.diabetes === undefined || typeof c.diabetes.typeOne === 'boolean').toBe(true);
    }
    expect(count.diabetes! / n).toBeCloseTo(CHRONIC.share.diabetes, 2);
    expect(count.arthritis! / n).toBeCloseTo(CHRONIC.share.arthritis, 2);
    expect(typeOne / count.diabetes!).toBeGreaterThan(CHRONIC.typeOne - 0.08);
    expect(typeOne / count.diabetes!).toBeLessThan(CHRONIC.typeOne + 0.08);
  });


  it('caps insulin at the makers’ $35, and at nothing on a plan New York regulates from 2025', () => {
    const sim = pro('insulin');
    const when = at(2026, 3, 1);
    expect(insulinShareOf(sim.player, when)).toBe(INSULIN.cashCap);
    const h = healthOf(sim.player);
    h.marketplace = { from: at(2024, 1, 1, 0), state: 'ny' };
    expect(insulinShareOf(sim.player, when)).toBe(0);
    // Before the law, the plan's brand copay, under the makers' cap.
    expect(insulinShareOf(sim.player, at(2024, 6, 1))).toBe(Math.min(INSULIN.cashCap, rxShareOf(sim.player, true, at(2024, 6, 1))));
    delete h.marketplace;
    h.sag = { from: at(2026, 1, 1, 0), until: at(2027, 1, 1, 0) };
    expect(insulinShareOf(sim.player, when)).toBe(INSULIN.cashCap);
  });

  it('keep type 1 on insulin, a monitor and a visit a quarter, and arthritis on a generic', () => {
    const sim = pro('diabetes');
    const h = healthOf(sim.player);
    // The month's care and the month's fill of medicine (`fillMedicine`, from 2026-10-02).
    const month = (t: number) => keepUp(sim, sim.player, t) + fillMedicine(sim, sim.player, t);
    h.chronic = { diabetes: { treated: true, typeOne: true } };
    // January: insulin, the monitor on Abbott's program, and the quarter's visit, uninsured.
    const monthly = INSULIN.cashCap + INSULIN.monitor.program;
    expect(month(at(2026, 1, 1, 1))).toBe(monthly + shareOf(sim.player, 'visit', at(2026, 1, 1, 1)));
    expect(month(at(2026, 2, 1, 1))).toBe(monthly);
    // A plan's brand copay where it's less than the program; on Medicaid, its $1.
    h.sag = { from: at(2026, 1, 1, 0), until: at(2027, 1, 1, 0) };
    // SAG-AFTRA's first brand fill carries its $75 deductible, over the program; after it, 25% is under it.
    expect(monitorShareOf(sim.player, at(2026, 3, 1))).toBe(INSULIN.monitor.program);
    expect(monitorShareOf(sim.player, at(2026, 4, 1))).toBe(Math.round(0.25 * INSULIN.monitor.price));
    delete h.sag;
    h.program = { kind: 'medicaid', state: 'ny', from: at(2026, 1, 1, 0), band: 'low', renewAt: at(2027, 1, 1, 0) };
    expect(monitorShareOf(sim.player, at(2026, 3, 1))).toBe(1_00);
    delete h.program;
    h.chronic = { diabetes: { treated: true, typeOne: false } };
    expect(month(at(2026, 2, 1, 1))).toBe(rxShareOf(sim.player, false, at(2026, 2, 1, 1)));
    h.chronic = { arthritis: { treated: true } };
    expect(month(at(2026, 2, 1, 1)) % rxShareOf(sim.player, false, at(2026, 2, 1, 1))).toBeLessThanOrEqual(shareOf(sim.player, 'visit', at(2026, 2, 1, 1)));
  });

  it('left alone: type 1 quadruples the emergencies, diabetes wears the body down, and arthritis tires it', () => {
    const sim = pro('alone');
    const h = healthOf(sim.player);
    const emergencies = () => { let n = 0; for (let w = 0; w < 6000; w += 1) n += illnessWeek(sim, sim.player, sim.now + w * 7 * MS_DAY).filter((e) => e.care === 'emergency').length; return n; };
    h.chronic = {};
    const well = emergencies();
    h.chronic = { diabetes: { treated: false, typeOne: true } };
    const ill = emergencies();
    expect(ill / well).toBeGreaterThan(CHRONIC.untreated.diabetesEmergencies * 0.7);
    expect(ill / well).toBeLessThan(CHRONIC.untreated.diabetesEmergencies * 1.3);
    // Type 2 left alone brings no more.
    h.chronic = { diabetes: { treated: false, typeOne: false } };
    expect(emergencies()).toBe(well);

    const a = pro('body');
    const b = pro('body');
    healthOf(a.player).chronic = { diabetes: { treated: false, typeOne: false }, arthritis: { treated: false } };
    healthOf(b.player).chronic = {};
    for (const s of [a, b]) { s.player.wellbeing.condition = 60; s.player.wellbeing.energy = 60; }
    const week = a.universe.scheduled.find((i) => i.kind === 'health.week' && i.status === 'pending')!.at;
    for (const s of [a, b]) s.advanceTo(week + 60_000);
    expect(b.player.wellbeing.condition - a.player.wellbeing.condition).toBeGreaterThanOrEqual(CHRONIC.untreated.diabetesConditionAWeek - 0.5);
    expect(b.player.wellbeing.energy - a.player.wellbeing.energy).toBeGreaterThanOrEqual(CHRONIC.untreated.arthritisEnergyAWeek - 0.5);
  }, 60_000);
});

describe('a dental plan of their own', () => {
  it('in New York: cleanings in full, 80% of a filling after $50, to $1,500 a year, where the health plan pays nothing', () => {
    const sim = pro('dental');
    const when = at(2027, 3, 1);
    expect(sim.execute({ kind: 'health.dental', payload: { on: true } })).toMatchObject({ ok: true, value: { plan: 'ny' } });
    const d = DENTAL_PLANS.ny;
    const price = grown(DENTAL_VISION.price.filling, 'dental', when);
    expect(teethAndEyesShareOf(sim.player, 'cleaning', when)).toBe(0);
    expect(teethAndEyesShareOf(sim.player, 'filling', when)).toBe(price - Math.round((price - d.deductible) * d.basic));
    expect(teethAndEyesShareOf(sim.player, 'filling', when)).toBe(price - Math.round(price * d.basic));
    healthOf(sim.player).dental!.paid[2027] = d.max - 10_00;
    expect(teethAndEyesShareOf(sim.player, 'filling', when)).toBe(price - 10_00);
    expect(teethAndEyesShareOf(sim.player, 'filling', when)).toBe(price);
    // SAG-AFTRA's own dental pays first.
    healthOf(sim.player).sag = { from: at(2027, 1, 1, 0), until: at(2028, 1, 1, 0) };
    expect(teethAndEyesShareOf(sim.player, 'filling', when)).toBe(Math.round(price * 0.25));
    expect(sim.execute({ kind: 'health.dental', payload: { on: true } })).toMatchObject({ ok: false, error: 'You have a dental plan.' });
    expect(sim.execute({ kind: 'health.dental', payload: { on: false } }).ok).toBe(true);
  });

  it('in California, only beside Covered California’s plan, and ends with it', () => {
    const sim = pro('dental-ca', 'us-ca-losangeles');
    expect(sim.execute({ kind: 'health.dental', payload: { on: true } }).ok).toBe(false);
    const h = healthOf(sim.player);
    h.marketplace = { from: sim.now - MS_DAY, state: 'ca' };
    expect(sim.execute({ kind: 'health.dental', payload: { on: true } })).toMatchObject({ ok: true, value: { plan: 'ca' } });
    h.marketplace.until = sim.now;
    const next = zonedParts(sim.now + 40 * MS_DAY, NY);
    const month = at(next.year, next.month, 1, 1);
    healthMonth(sim, sim.player, month);
    expect(h.dental!.until).toBe(month);
  });
});

describe('medical prices', () => {
  it('grow by each kind of care’s own index to the year paid, straight between prints, and at its own rate past the last', () => {
    expect(medicalGrowth(2024, 2026, 'hospital')).toBeCloseTo(459.659 / 414.8, 10);
    expect(medicalGrowth(2026, 2028, 'drugs')).toBeCloseTo(1.0112 ** 2, 10);
    // Other professionals' 2025 wasn't published: halfway between 2024 and 2026.
    expect(medicalGrowth(2024, 2025, 'professionals')).toBeCloseTo((261.624 + (281.459 - 261.624) / 2) / 261.624, 10);
    expect(medicalGrowth(2016, 2018, 'dental')).toBe(1);
    expect(grown(CARE.price.visit, 'visit', at(2024, 6, 1))).toBe(CARE.price.visit);
    expect(grown(CARE.price.visit, 'visit', at(2026, 6, 1))).toBe(Math.round(CARE.price.visit * 439.389 / 417.93));
    expect(grown(CARE.price.emergency, 'emergency', at(2026, 6, 1))).toBe(Math.round(CARE.price.emergency * 459.659 / 338.814));
    expect(grown(CARE.price.stay, 'stay', at(2026, 6, 1))).toBe(Math.round(CARE.price.stay * 459.659 / 332.237));
    expect(grown(PHARMACY.price.brand, 'rx', at(2019, 6, 1))).toBe(PHARMACY.price.brand);
    // Drugs fell the year to August 2026.
    expect(grown(PHARMACY.price.brand, 'rx', at(2026, 6, 1))).toBeLessThan(grown(PHARMACY.price.brand, 'rx', at(2025, 6, 1)));
    expect(grown(DENTAL_VISION.price.cleaning, 'dental', at(2026, 6, 1))).toBe(Math.round(DENTAL_VISION.price.cleaning * 656.707 / 598.951));
    expect(grown(DENTAL_VISION.price.exam, 'vision', at(2026, 6, 1))).toBe(Math.round(DENTAL_VISION.price.exam * 220.071 / 209.017));
  });
});

describe('Yale Health', () => {
  it('leaves $50 an emergency, $200 an admission, nothing a visit, its drug tiers, and an eye exam a year free', () => {
    const sim = createSave(1, 'yale-plan', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const when = sim.now;
    expect(shareOf(sim.player, 'visit', when)).toBe(0);
    expect(shareOf(sim.player, 'urgent', when)).toBe(0);
    expect(shareOf(sim.player, 'emergency', when)).toBe(50_00);
    expect(shareOf(sim.player, 'stay', when)).toBe(200_00);
    // Admissions to $1,000 in a year, then nothing more for them.
    for (let n = 0; n < 4; n += 1) shareOf(sim.player, 'stay', when);
    expect(shareOf(sim.player, 'stay', when)).toBe(0);
    expect(monitorShareOf(sim.player, when)).toBe(30_00);
    expect(rxShareOf(sim.player, false, when)).toBe(10_00);
    expect(rxShareOf(sim.player, true, when)).toBe(30_00);
    expect(insulinShareOf(sim.player, when)).toBe(30_00);
    expect(teethAndEyesShareOf(sim.player, 'exam', when)).toBe(0);
    expect(teethAndEyesShareOf(sim.player, 'cleaning', when)).toBe(grown(DENTAL_VISION.price.cleaning, 'dental', when));
    // Yale's student dental, a year to 30 September, not canceled once paid.
    expect(sim.execute({ kind: 'health.dental', payload: { on: true } })).toMatchObject({ ok: true, value: { plan: 'yale' } });
    expect(teethAndEyesShareOf(sim.player, 'cleaning', when)).toBe(0);
    expect(sim.execute({ kind: 'health.dental', payload: { on: false } })).toMatchObject({ ok: false, error: 'Yale’s dental plan can’t be canceled once paid.' });
    expect(zonedParts(healthOf(sim.player).dental!.until!, NY)).toMatchObject({ month: 10, day: 1 });
  });
});
