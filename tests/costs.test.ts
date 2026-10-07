/**
 * What was built in on 2026-09-27's last round: what an actor's work costs
 * them, diabetes and arthritis carried, insulin's caps, stand-alone dental
 * plans, medical prices grown to the year they're paid, and Yale Health's
 * own cost-sharing (`systems/career.ts`, `systems/health.ts`,
 * `content/safetynet.ts`).
 */
import { describe, expect, it } from 'vitest';
import { evenCraft } from '@/engine/systems/school';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { computeAnnualTax, salesTaxRate } from '@/engine/content/tax';
import { attributesOf } from '@/engine/systems/attributes';
import { exchange } from '@/engine/content/currency';
import { AGENCIES, ROLES, WORK_COSTS } from '@/engine/content/career';
import { CARE, CHRONIC, DENTAL_PLANS, DENTAL_VISION, INSULIN, PHARMACY, RECEIPTS, STATE_DEDUCTIONS, medicalGrowth } from '@/engine/content/safetynet';
import { ESTIMATE, beginCareer, bookingChance, careerOf, staleHeadshots, submissionsAWeek, weekOfAuditions, withSalesTax, workCostsWeek } from '@/engine/systems/career';
import { recordJobCost, recordWages, yearOf } from '@/engine/systems/earnings';
import { drawChronic, grown, healthMonth, monitorShareOf, healthOf, illnessWeek, insulinShareOf, keepUp, fillMedicine, rxShareOf, shareOf, teethAndEyesShareOf } from '@/engine/systems/health';
import { figuresFor } from '@/engine/systems/taxreturn';
import type { Simulation } from '@/engine/core/simulation';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
function pro(seed: string, city = 'us-ny-newyork'): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(50);
  beginCareer(sim, sim.player);
  return sim;
}
const yearNow = (sim: Simulation) => zonedParts(sim.now, NY).year;

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
  it('pays a casting site a year from the bank, counts it for the return, and renews it unless told not to', () => {
    const sim = pro('site');
    expect(sim.execute({ kind: 'career.subscribe', payload: { site: 'actors-access', on: true } }).ok).toBe(true);
    expect(yearOf(sim.player, yearNow(sim)).jobCosts).toBe(WORK_COSTS.sites['actors-access'].price);
    const held = careerOf(sim.player).sites!['actors-access']!;
    expect(held).toEqual({ until: sim.now + 365 * MS_DAY, renews: true });
    // A year on, it renews for another.
    const year = held.until;
    workCostsWeek(sim, sim.player, year + MS_DAY);
    expect(held.until).toBe(year + 365 * MS_DAY);
    expect(sim.execute({ kind: 'career.subscribe', payload: { site: 'actors-access', on: false } }).ok).toBe(true);
    workCostsWeek(sim, sim.player, held.until + MS_DAY);
    expect(held.until).toBe(year + 365 * MS_DAY);
    expect(sim.execute({ kind: 'career.subscribe', payload: { site: 'nowhere', on: true } })).toMatchObject({ ok: false, error: 'No such site.' });
  });

  it('has a paid site’s submissions seen twice as often, the reel’s breakdowns shut without one, the sites’ own listings take more, and old headshots cost a fifth of auditions', () => {
    const sim = pro('seen');
    // A middling reputation: the sites' own rates, neither raised nor cut by it.
    attributesOf(sim, sim.player).reputation = 50;
    const career = careerOf(sim.player);
    const self = () => { let got = 0; for (let w = 0; w < 600; w += 1) got += weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, undefined, 'us-ny-newyork', 5).length; return got / 3000; };
    const free = self();
    career.sites = { 'casting-networks': { until: sim.now + 5_000 * MS_DAY, renews: true } };
    career.reelAt = sim.now;
    const reel = self();
    delete career.reelAt;
    const bare = self();
    expect(reel).toBeCloseTo(ESTIMATE.selfSubmitCallback, 1);
    expect(free / reel).toBeGreaterThan(WORK_COSTS.freeSubmissionShare - 0.1);
    expect(free / reel).toBeLessThan(WORK_COSTS.freeSubmissionShare + 0.1);
    expect(bare / reel).toBeGreaterThan(1 - WORK_COSTS.wantReel - 0.1);
    expect(bare / reel).toBeLessThan(1 - WORK_COSTS.wantReel + 0.1);
    delete career.sites['casting-networks'];
    expect(submissionsAWeek(career, sim.now)).toBe(ESTIMATE.selfSubmitsAWeek);
    career.sites.backstage = { until: sim.now + MS_DAY, renews: false };
    expect(submissionsAWeek(career, sim.now)).toBe(ESTIMATE.selfSubmitsAWeek + WORK_COSTS.backstageSubmissions);
    career.sites['casting-networks'] = { until: sim.now + MS_DAY, renews: false };
    expect(submissionsAWeek(career, sim.now, 'us-ca-losangeles')).toBe(ESTIMATE.selfSubmitsAWeek + WORK_COSTS.backstageSubmissions + WORK_COSTS.castingNetworksSubmissions['us-ca-losangeles']);
    expect(submissionsAWeek(career, sim.now, 'us-ny-newyork')).toBe(ESTIMATE.selfSubmitsAWeek + WORK_COSTS.backstageSubmissions + WORK_COSTS.castingNetworksSubmissions.other);
    // In Los Angeles, Submit Yourself takes Casting Networks' five more.
    const la = pro('seen-la', 'us-ca-losangeles');
    careerOf(la.player).sites = { 'casting-networks': { until: la.now + 5_000 * MS_DAY, renews: true } };
    for (let n = 0; n < ESTIMATE.selfSubmitsAWeek + WORK_COSTS.castingNetworksSubmissions['us-ca-losangeles']; n += 1) expect(la.execute({ kind: 'career.self_submit', payload: {} }).ok).toBe(true);
    expect(la.execute({ kind: 'career.self_submit', payload: {} }).ok).toBe(false);
    // A reel takes screen footage.
    expect(sim.execute({ kind: 'career.reel', payload: {} })).toMatchObject({ ok: false, error: 'A reel is cut from footage, and you have none: a screen credit, a self-tape from class, or the school’s film monologue.' });
    career.credits.push({ roleId: 'lort-b', year: 2026, cityId: 'us-ny-newyork' });
    expect(sim.execute({ kind: 'career.reel', payload: {} }).ok).toBe(false);
    // The school's filmed monologues are footage too.
    const graduate = pro('filmed');
    graduate.player.school = { filmed: true } as unknown as NonNullable<typeof graduate.player.school>;
    expect(graduate.execute({ kind: 'career.reel', payload: {} }).ok).toBe(true);
    career.credits.push({ roleId: 'costar', year: 2026, cityId: 'us-ny-newyork' });
    expect(sim.execute({ kind: 'career.reel', payload: {} }).ok).toBe(true);
    expect(career.reelAt).toBe(sim.now);
    // The showcase's headshots, from when the business began, go out of date two years on.
    expect(staleHeadshots(career, sim.now + (WORK_COSTS.headshotsLastDays - 1) * MS_DAY)).toBe(false);
    expect(staleHeadshots(career, sim.now + (WORK_COSTS.headshotsLastDays + 1) * MS_DAY)).toBe(true);
    const agency = AGENCIES[0]!;
    const count = () => { let n = 0; for (let w = 0; w < 600; w += 1) n += weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, agency, 'us-ny-newyork', 0).length; return n; };
    career.headshotsAt = sim.now + 10_000 * MS_DAY;
    const fresh = count();
    career.headshotsAt = sim.now - (WORK_COSTS.headshotsLastDays + 1) * MS_DAY;
    const stale = count();
    expect(stale / fresh).toBeGreaterThan(WORK_COSTS.staleHeadshots - 0.1);
    expect(stale / fresh).toBeLessThan(WORK_COSTS.staleHeadshots + 0.1);
    expect(sim.execute({ kind: 'career.headshots', payload: {} }).ok).toBe(true);
    expect(career.headshotsAt).toBe(sim.now);
  }, 60_000);

  it('reads a tape a fifth worse without a kit, and books a coached audition a quarter more often', () => {
    const sim = pro('kit');
    const craft = { ...sim.player.craft! };
    const role = ROLES.find((r) => r.id === 'costar')!;
    expect(bookingChance(craft, role, 1, 'tape', false) / bookingChance(craft, role, 1, 'tape', true)).toBeCloseTo(WORK_COSTS.noKit, 6);
    expect(bookingChance(craft, role, 1, 'room', true, true) / bookingChance(craft, role, 1, 'room', true)).toBeCloseTo(WORK_COSTS.coached, 6);
    expect(sim.execute({ kind: 'career.buy_kit', payload: {} }).ok).toBe(true);
    expect(careerOf(sim.player).kit).toBe(true);
    expect(sim.execute({ kind: 'career.buy_kit', payload: {} })).toMatchObject({ ok: false, error: 'You have a kit.' });
    careerOf(sim.player).auditions.push({ id: 'x1', roleId: 'costar', at: sim.now + MS_DAY, mode: 'room', cityId: 'us-ny-newyork', status: 'ahead' });
    const t0 = sim.now;
    expect(sim.execute({ kind: 'career.coach', payload: { auditionId: 'x1' } }).ok).toBe(true);
    // The session is the hour it's paid for (from 2026-10-03).
    expect(sim.now - t0).toBe(60 * 60_000);
    expect(sim.execute({ kind: 'career.coach', payload: { auditionId: 'x1' } }).ok).toBe(false);
    // The kit is goods, and New York City's 8.875% is on top.
    expect(yearOf(sim.player, yearNow(sim)).jobCosts).toBe(Math.round(WORK_COSTS.kit * (1 + salesTaxRate('us-ny-newyork', sim.now, 'goods'))) + WORK_COSTS.coach);
    expect(withSalesTax(sim.player, sim.now, 100_00)).toBe(Math.round(100_00 * (1 + salesTaxRate('us-ny-newyork', sim.now, 'goods'))));
    expect(salesTaxRate('us-ny-newyork', sim.now, 'goods')).toBeGreaterThan(0.08);
    // Headshots: the session untaxed, the prints taxed.
    const before = yearOf(sim.player, yearNow(sim)).jobCosts!;
    sim.execute({ kind: 'career.headshots', payload: {} });
    expect(yearOf(sim.player, yearNow(sim)).jobCosts! - before).toBe(WORK_COSTS.headshots - WORK_COSTS.prints + withSalesTax(sim.player, sim.now, WORK_COSTS.prints));
  });

  it('bills a class each month and grows acting each week, against a life without it', () => {
    const sim = pro('class');
    const control = pro('class');
    expect(sim.execute({ kind: 'career.class', payload: { on: true } }).ok).toBe(true);
    const start = sim.now;
    const until = start + 40 * MS_DAY;
    for (const s of [sim, control]) while (s.now < until) s.advanceTo(Math.min(until, s.now + 6 * 3_600_000));
    expect(sim.player.craft!.scene).toBeGreaterThan(control.player.craft!.scene);
    const months = new Set([zonedParts(start, NY).month, zonedParts(until, NY).month]).size;
    expect(yearOf(sim.player, yearNow(sim)).jobCosts ?? 0).toBeGreaterThanOrEqual(WORK_COSTS.classMonthly * (months - 1));
    expect(sim.execute({ kind: 'career.class', payload: { on: false } }).ok).toBe(true);
    expect(careerOf(sim.player).scene).toBeUndefined();
  }, 120_000);

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
