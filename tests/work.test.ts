/**
 * The day job: shifts on the calendar, paid at a real legal floor on the
 * country's payday with tax withheld, missed when asleep or away, and lost on
 * the third missed in four weeks.
 *
 * And a working year: with the café job every new save gets, on autopilot,
 * every trait and both ends of the three sliders that move anything, at
 * twenty-five and at sixty. Measured before these bars were set: lowest
 * condition 75.8 (a light sleeper at sixty), year-end morale 78.9 at worst,
 * stress 16.0 at worst. Some at sixty are on empty by midnight on a shift day,
 * which is what a seven-hour shift and a long evening do, and no bar here.
 */

import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig, loadSave, migrate, quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { CITIES, REGIONS, loadCountryCities } from '@/engine/content/geography';
import { MINIMUM_WAGES, minimumWageAt } from '@/engine/content/wages';
import { JOBS, jobFor, weeklyHours } from '@/engine/content/jobs';
import { PERSONALITY_TRAITS } from '@/engine/content/personality-traits';
import { defaultPersonality } from '@/engine/systems/personality';
import { SHIFT_KIND, hourlyWage, hoursOwed, nextPayday, withholdingRate } from '@/engine/systems/work';
import { lookAfterRefusal } from '@/engine/systems/life';
import { computeAnnualTax } from '@/engine/content/tax';
import { exchange } from '@/engine/content/currency';
import { MS_DAY, MS_HOUR, instantFromZoned, startOfNextDay, zonedParts } from '@/engine/core/time';

const shiftsOf = (sim: Simulation) => sim.timeline.pending().filter((i) => i.kind === SHIFT_KIND);
const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
const at = (sim: Simulation, y: number, m: number, d: number, hour = 0) =>
  instantFromZoned({ year: y, month: m, day: d, hour }, sim.zone);

describe('the job', () => {
  it('is the one their past leads to, with two weeks of its shifts on the calendar on its days and hours', () => {
    const sim = quickSave();
    expect(sim.player.job?.jobId).toBe('school');
    const job = jobFor('school');
    const shifts = shiftsOf(sim);
    // Thursday to Sunday for two weeks from a Monday.
    expect(shifts).toHaveLength(8);
    for (const shift of shifts) {
      const p = zonedParts(shift.at, sim.zone);
      expect(job.days).toContain(new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay());
      expect([p.hour, p.minute]).toEqual([job.startHour, 0]);
      expect(shift.durationMinutes).toBe(job.hours * 60);
      expect(shift.requiresPlayer).toBe(true);
    }
    // And a week on, the rota still runs two weeks ahead.
    sim.advanceTo(sim.now + 7 * MS_DAY);
    expect(Math.max(...shiftsOf(sim).map((s) => s.at)) - sim.now).toBeGreaterThan(12 * MS_DAY);
  });

  it('is somebody else’s past for somebody else, and nobody’s without a day job', () => {
    const builder = quickSave({ beforeActing: 'trades' }, 'trades');
    expect(builder.player.job?.jobId).toBe('trades');
    expect(shiftsOf(builder)[0]!.label).toBe('Construction Shift');
    const idle = quickSave({ dayJob: false }, 'no-job');
    expect(idle.player.job).toBeUndefined();
    expect(shiftsOf(idle)).toHaveLength(0);
  });
});

describe('the pay', () => {
  it('is the real floor where they work, times what the work pays over it', () => {
    const sim = quickSave();
    // Iceland's lowest agreement band from January 2026, in krónur.
    expect(hourlyWage(sim, sim.player)).toBe(2746_73);
    const trades = quickSave({ beforeActing: 'trades' }, 'trades-pay');
    expect(hourlyWage(trades, trades.player)).toBe(Math.round(2746_73 * JOBS.trades!.overMinimum));
    // From April the agreement's new band.
    sim.advanceTo(at(sim, 2026, 4, 2));
    expect(hourlyWage(sim, sim.player)).toBe(2748_39);
  });

  it('reads the deepest place that has a figure, on its dates, and says where it has none', async () => {
    await loadCountryCities('US');
    const la = [...CITIES.all()].find((c) => c.name === 'Los Angeles' && c.countryId === 'us')!;
    expect(minimumWageAt(la.id, Date.UTC(2026, 5, 1), 'USD')).toMatchObject({ hourly: 16_90, currency: 'USD', kind: 'statutory' });
    const tokyo = CITIES.require('jp-13-tokyo');
    expect(minimumWageAt(tokyo.id, Date.UTC(2026, 8, 1), 'JPY').hourly).toBe(1226_00);
    expect(minimumWageAt(tokyo.id, Date.UTC(2026, 9, 2), 'JPY').hourly).toBe(1280_00);
    // Hyōgo is the gazetteer's JP-13, and is paid the national average, not Tokyo's.
    await loadCountryCities('JP');
    const hyogo = CITIES.all().find((c) => c.countryId === 'jp' && c.parentId === 'jp-13')!;
    expect(minimumWageAt(hyogo.id, Date.UTC(2026, 8, 1), 'JPY').hourly).toBe(1121_00);
    const rome = [...CITIES.all()].find((c) => c.name === 'Rome' && c.countryId === 'it');
    if (rome) expect(minimumWageAt(rome.id, Date.UTC(2026, 5, 1), 'EUR').kind).toBe('estimate');
    // Every figure says where it came from.
    for (const one of MINIMUM_WAGES) expect(one.source, one.where).toMatch(/^https:\/\//);
  });

  it('pays each Canadian province its own floor, keyed as the gazetteer numbers them', () => {
    // The provinces were keyed CA-ON, CA-QC and CA-BC, which no town in the
    // gazetteer carries (Ontario is CA-08 there), so all three were paid the
    // federal rate until 2026-09-25.
    const at = Date.UTC(2026, 8, 25);
    expect(minimumWageAt('ca-on-toronto', at, 'CAD').hourly).toBe(17_60);
    expect(minimumWageAt('ca-qc-montreal', at, 'CAD').hourly).toBe(16_60);
    expect(minimumWageAt('ca-bc-vancouver', at, 'CAD').hourly).toBe(18_25);
    // And every regional key is a region the gazetteer really has.
    const keys = new Set(REGIONS.all().map((r) => r.jurisdictionCode));
    for (const one of MINIMUM_WAGES) {
      if (one.where.split('-').length === 2) expect(keys.has(one.where), one.where).toBe(true);
    }
  });

  it('comes on the country’s payday, less the tax the engine withholds, and the ledger balances', () => {
    const sim = quickSave();
    const before = checking(sim);
    // Iceland pays on the first for the month before.
    const payday = nextPayday(sim, sim.player, sim.now);
    expect(zonedParts(payday, sim.zone)).toMatchObject({ month: 2, day: 1, hour: 17 });
    sim.advanceTo(payday - MS_HOUR);
    // Fifteen shifts of seven hours from the eighth of January to the end of
    // the month. The one on the first of February waits for March: Iceland
    // pays for the month before.
    const hours = hoursOwed(sim.player, at(sim, 2026, 2, 1));
    expect(hours).toBe(105);
    expect(hoursOwed(sim.player)).toBe(112);
    const wage = hourlyWage(sim, sim.player);
    const rate = withholdingRate(sim, sim.player);
    const yearly = exchange(wage * weeklyHours(jobFor('school')) * 52, 'ISK', 'USD')!;
    expect(rate).toBeCloseTo(computeAnnualTax(yearly, sim.player.job!.cityId, sim.now).effectiveRate, 12);
    expect(rate).toBeGreaterThan(0.1);
    sim.advanceTo(payday + MS_HOUR);
    const gross = Math.round(hours * wage);
    // Read off the pay's own line: rent and food come out of the same account.
    const paid = sim.universe.transactions.filter((t) => t.category === 'salary').at(-1)!;
    expect(paid.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(gross - Math.round(gross * rate));
    void before;
    expect(hoursOwed(sim.player)).toBe(7);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('follows each country’s practice for when it comes', async () => {
    await loadCountryCities('US');
    const la = [...CITIES.all()].find((c) => c.name === 'Los Angeles' && c.countryId === 'us')!;
    const us = createSave(1, 'pay-us', { ...defaultConfig(), homeRegionId: la.id, startLocationId: la.id, livesWhereBorn: true });
    const first = nextPayday(us, us.player, us.now);
    const p = zonedParts(first, us.zone);
    expect(new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()).toBe(5);
    expect(zonedParts(nextPayday(us, us.player, first), us.zone).day - p.day).toBe(14);
  });
});

describe('a shift', () => {
  const nextShift = (sim: Simulation) => shiftsOf(sim).sort((a, b) => a.at - b.at)[0]!;

  it('worked, adds its hours and costs the body more than the hours going by', () => {
    const worker = quickSave({}, 'shift-cost');
    const idle = quickSave({ dayJob: false }, 'shift-cost');
    const shift = nextShift(worker);
    worker.advanceTo(shift.at + MS_HOUR);
    idle.advanceTo(shift.at + MS_HOUR);
    expect(hoursOwed(worker.player)).toBe(7);
    expect(idle.player.wellbeing.energy - worker.player.wellbeing.energy).toBeCloseTo(7, 5);
    expect(worker.player.wellbeing.stress).toBeGreaterThan(idle.player.wellbeing.stress + 3);
    expect(lookAfterRefusal(worker, 'unwind')).toMatch(/at work until 4:00 PM/);
  });

  it('is missed asleep, called in, and lost on the third in four weeks, and found again three weeks on', () => {
    const sim = quickSave({}, 'strikes');
    // Asleep through the first.
    const first = nextShift(sim);
    sim.advanceTo(first.at - 2 * MS_HOUR);
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 4 } }).ok).toBe(true);
    expect(sim.timeline.get(first.id)!.status).toBe('missed');
    expect(sim.player.job!.missed).toHaveLength(1);
    // Called in for the next two.
    // The clock stops at a shift, as it does for the player, and they don't go.
    for (let n = 0; n < 2; n += 1) {
      const shift = nextShift(sim);
      expect(sim.advanceTo(shift.at + MS_HOUR, { stopOnPlayerRequired: true }).interruptedBy?.id).toBe(shift.id);
      const answer = sim.execute<{ ok: boolean }>({ kind: 'calendar.skip', payload: { entryId: shift.id } });
      expect(answer.value?.ok).toBe(true);
    }
    expect(sim.player.job!.lookingUntil).toBeDefined();
    expect(shiftsOf(sim)).toHaveLength(0);
    // No pay comes in the three weeks, and then the work does.
    sim.advanceTo(sim.now + 20 * MS_DAY);
    expect(shiftsOf(sim)).toHaveLength(0);
    sim.advanceTo(startOfNextDay(sim.now + 2 * MS_DAY, sim.zone) + MS_HOUR);
    expect(sim.player.job!.lookingUntil).toBeUndefined();
    expect(shiftsOf(sim).length).toBeGreaterThan(0);
  });
});

describe('a working year on autopilot', () => {
  const singles = [
    { name: 'nobody', traits: [] as string[], personality: {} },
    ...PERSONALITY_TRAITS.filter((t) => t.systemMods).map((t) => ({ name: t.id, traits: [t.id], personality: {} })),
    ...(['emotionalStability', 'ambition', 'conscientiousness'] as const).flatMap((axis) => [
      { name: `${axis} at 5`, traits: [], personality: { [axis]: 5 } },
      { name: `${axis} at 95`, traits: [], personality: { [axis]: 95 } },
    ]),
  ];

  it('wears nobody down, at twenty-five or at sixty', () => {
    for (const birthYear of [2001, 1966]) {
      for (const c of singles) {
        const sim = quickSave({ personality: { ...defaultPersonality(), ...c.personality }, personalityTraits: c.traits, birthYear }, 'work-year');
        let lowest = 100;
        for (let d = 0; d < 365; d += 1) {
          sim.advanceTo(startOfNextDay(sim.now, sim.zone) + 7 * MS_HOUR);
          lowest = Math.min(lowest, sim.player.wellbeing.condition);
        }
        const who = `${c.name}, born ${birthYear}`;
        expect(lowest, who).toBeGreaterThan(72);
        expect(sim.player.wellbeing.morale, who).toBeGreaterThan(76);
        expect(sim.player.wellbeing.stress, who).toBeLessThan(20);
        expect(sim.ledger.audit(), who).toEqual([]);
      }
    }
  });
});

describe('a save from before the job', () => {
  it('is given the day job on the way in, with its rota and a payday, once', () => {
    const made = quickSave({ dayJob: false }, 'before-89');
    const old = JSON.parse(JSON.stringify(made.universe));
    old.meta.schemaVersion = 88;
    delete old.meta.currency;
    const result = migrate(old);
    expect(result.steps).toContain('Gave the character a day job.');
    const sim = loadSave(old);
    expect(sim.player.job?.jobId).toBe('school');
    expect(shiftsOf(sim).length).toBeGreaterThan(0);
    const paydays = () => sim.timeline.pending().filter((i) => i.kind === 'work.payday');
    expect(paydays()).toHaveLength(1);
    // Loaded again, nothing is put on the calendar twice.
    const again = loadSave(JSON.parse(JSON.stringify(sim.universe)));
    expect(again.timeline.pending().filter((i) => i.kind === 'work.payday')).toHaveLength(1);
    expect(shiftsOf(again)).toHaveLength(shiftsOf(sim).length);
    // A save from 89 that chose no day job is left without one.
    const chose = migrate(JSON.parse(JSON.stringify(made.universe)));
    expect(chose.steps).not.toContain('Gave the character a day job.');
  });
});
