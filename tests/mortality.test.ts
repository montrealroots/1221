/**
 * A life has birthdays, and it ends.
 *
 * The chance of the end is the US 2024 life table, moved by the country's
 * life expectancy and the shape the person is in (`systems/mortality.ts`).
 * These tests hold it to the published figures it was built from, and hold
 * the game to what an ended life means: the clock doesn't run again, the
 * save keeps it, and the birthday on the way is said on the day.
 */

import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { ceilingAt } from '@/engine/content/lifespan';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import {
  END_KIND, chanceOfEndingYear, countryFactor, endBetween, frailty, tableChance,
} from '@/engine/systems/mortality';
import { BIRTHDAY_KIND, ageOn } from '@/engine/systems/birthdays';
import { checkConflicts, entriesBetween, skipTargets, upcoming } from '@/engine/world/calendar';

const MS_YEAR = 365.2425 * MS_DAY;

/** Life expectancy from an age, off the chances, with deaths mid-year. */
function expectancy(from: number, factor: number): number {
  let alive = 1;
  let years = 0;
  for (let age = from; age < 125; age += 1) {
    const q = Math.min(1, tableChance(age) * factor);
    years += alive * (1 - q / 2);
    alive *= 1 - q;
  }
  return from + years;
}

describe('the chance of the end', () => {
  it('is the US 2024 table at its own ages, and between them on the curve', () => {
    expect(tableChance(20)).toBeCloseTo(0.000714, 6);
    expect(tableChance(65)).toBeCloseTo(0.012723, 6);
    expect(tableChance(85)).toBeCloseTo(0.078467, 6);
    // Log-linear between them, the way the chance grows with age: 62 is two
    // fifths of the way from 60 to 65 by the logarithm, not by the number.
    expect(tableChance(62)).toBeCloseTo(0.008779 * (0.012723 / 0.008779) ** 0.4, 6);
    // Past a hundred it keeps rising, and it never makes a year certain.
    expect(tableChance(104)).toBeGreaterThan(0.36);
    expect(tableChance(130)).toBeLessThanOrEqual(0.75);
  });

  it('gives back each country\'s life expectancy from twenty, within half a year', () => {
    // Life expectancy at twenty, 2024: the US about 79.9 (NCHS), Japan about
    // 84.7 (MHLW), which the World Bank's figures at birth are a year or so under.
    expect(expectancy(20, countryFactor('us'))).toBeGreaterThan(79.4);
    expect(expectancy(20, countryFactor('us'))).toBeLessThan(80.4);
    expect(expectancy(20, countryFactor('jp'))).toBeGreaterThan(84.2);
    expect(expectancy(20, countryFactor('jp'))).toBeLessThan(85.2);
    expect(countryFactor('mx')).toBeGreaterThan(1);
    expect(countryFactor(undefined)).toBe(1);
  });

  it('is lighter for a body at its age\'s best and three times as heavy worn out', () => {
    expect(frailty(100, 30)).toBeCloseTo(0.8, 6);
    expect(frailty(0, 30)).toBeCloseTo(3, 6);
    expect(frailty(50, 30)).toBeGreaterThan(frailty(80, 30));
    // Slow to leave the best: a tenth off the age's ceiling, then half.
    const ceiling = ceilingAt(30).condition;
    expect(frailty(0.9 * ceiling, 30)).toBeCloseTo(0.87, 2);
    expect(frailty(0.5 * ceiling, 30)).toBeCloseTo(1.58, 2);
  });

  it('ends lives about as often as the table says, drawn one by one', () => {
    // Two thousand people of seventy in the US, at their best: the table's
    // 0.018 a year, times 0.8.
    const sim = quickSave({ dayJob: false }, 'end-count');
    const from = sim.now;
    let ended = 0;
    for (let i = 0; i < 2000; i += 1) {
      const person = {
        ...sim.player, id: `p${i}`, birthInstant: from - 70 * MS_YEAR, wellbeing: { ...sim.player.wellbeing, condition: 100 },
      };
      if (endBetween(sim, person, from, from + MS_YEAR) !== undefined) ended += 1;
    }
    const want = 2000 * chanceOfEndingYear({ ...sim.player, wellbeing: { ...sim.player.wellbeing, condition: 100 } }, 70, 'us');
    expect(want).toBeCloseTo(2000 * 0.018110 * 0.8, 0);
    // Three standard deviations of a binomial count.
    expect(Math.abs(ended - want)).toBeLessThan(3 * Math.sqrt(want));
  });

  it('draws the same for the same person and day, and a part of a year gets part of the chance', () => {
    const sim = quickSave({ dayJob: false }, 'end-same');
    const old = { ...sim.player, birthInstant: sim.now - 104 * MS_YEAR };
    expect(endBetween(sim, old, sim.now, sim.now + MS_YEAR)).toBe(endBetween(sim, old, sim.now, sim.now + MS_YEAR));
    let whole = 0;
    let tenth = 0;
    for (let i = 0; i < 400; i += 1) {
      const one = { ...old, id: `q${i}` };
      if (endBetween(sim, one, sim.now, sim.now + MS_YEAR) !== undefined) whole += 1;
      if (endBetween(sim, one, sim.now, sim.now + MS_YEAR / 10) !== undefined) tenth += 1;
    }
    expect(tenth).toBeLessThan(whole / 3);
  });
});

describe('a life in the game', () => {
  it('says a birthday on the day, with the age turned', () => {
    // Born 14 June 2001, started 5 January 2026: twenty-five in June.
    const sim = quickSave({ dayJob: false }, 'birthday');
    expect(sim.universe.scheduled.some((one) => one.kind === BIRTHDAY_KIND && one.status === 'pending')).toBe(true);
    sim.advanceBy(170 * MS_DAY);
    const said = sim.universe.notifications.find((n) => n.title.startsWith('Happy Birthday'));
    expect(said?.title).toBe('Happy Birthday: 25');
    // The day before, still twenty-four; the day itself, twenty-five.
    const day = sim.universe.scheduled.find((one) => one.kind === BIRTHDAY_KIND && one.status === 'done')!;
    expect(ageOn(sim, sim.player, day.at - MS_DAY)).toBe(24);
    expect(ageOn(sim, sim.player, day.at)).toBe(25);
  });

  it('ends, stops the clock for good, and keeps the ending through a save', () => {
    // A hundred and nine: the months to the first birthday end about one
    // life in five, so one of these worlds is one where it happens.
    let sim = quickSave({ dayJob: false, birthYear: 1916 }, 'end-0');
    for (let n = 1; n < 60 && !sim.universe.scheduled.some((one) => one.kind === END_KIND); n += 1) {
      sim = quickSave({ dayJob: false, birthYear: 1916 }, `end-${n}`);
    }
    const end = sim.universe.scheduled.find((one) => one.kind === END_KIND);
    expect(end).toBeDefined();
    const result = sim.advanceBy(2 * 365 * MS_DAY);
    expect(sim.universe.meta.endedAt).toBe(end!.at);
    expect(sim.now).toBe(end!.at);
    expect(result.to).toBe(end!.at);
    expect(sim.universe.meta.endedAge).toBeGreaterThanOrEqual(109);
    expect(sim.universe.notifications.some((n) => n.title === 'A Life, Ended')).toBe(true);

    // Nothing moves it after that.
    const again = sim.advanceBy(30 * MS_DAY);
    expect(again.itemsProcessed).toBe(0);
    expect(sim.now).toBe(end!.at);

    const back = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(back.universe.meta.endedAt).toBe(end!.at);
    back.advanceBy(MS_DAY);
    expect(back.now).toBe(end!.at);
  });

  it('never puts the end where a screen can see it', () => {
    let sim = quickSave({ dayJob: false, birthYear: 1916 }, 'end-0');
    for (let n = 1; n < 60 && !sim.universe.scheduled.some((one) => one.kind === END_KIND); n += 1) {
      sim = quickSave({ dayJob: false, birthYear: 1916 }, `end-${n}`);
    }
    const end = sim.universe.scheduled.find((one) => one.kind === END_KIND)!;
    // The calendar, the upcoming list, Advance's targets and what a day
    // would clash with: none of them has it.
    const seen = [
      ...entriesBetween(sim, sim.now, end.at + MS_DAY), ...upcoming(sim, 500), ...skipTargets(sim, 500),
      ...checkConflicts(sim, end.at, 60),
    ];
    expect(JSON.stringify(seen)).not.toContain(end.id);
    expect(entriesBetween(sim, sim.now, end.at + MS_DAY).length).toBeGreaterThan(0);
  });
});
