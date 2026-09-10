/**
 * Where you stand with somebody, and what moves it.
 *
 * The rule the whole thing rests on is that nobody sets a bond. It moves
 * because of what happened: you were there, you were not, or a stretch of time
 * went by and neither of you did anything about it. So these tests are mostly
 * about the arithmetic being honest — that skipping a month costs what living
 * it costs, that turning up is worth less than not turning up costs, and that
 * a bond left alone settles at what living alongside somebody is worth rather
 * than falling to nothing.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import type { Id, SaveUniverse } from '@/engine/domain/model';
import {
  DRIFT_PER_DAY, MISSED_COOLS, MORALE_FROM_STANDING, RESTING_APART,
  RESTING_UNDER_ONE_ROOF, STANDING_BANDS, TOGETHER_WARMS,
  bondFor, bondsOf, driftBonds, moralePullOf, moveBond, otherIn,
  restingLevel, standingSaid, standingWord,
} from '@/engine/world/standing';
import { MOST_PEOPLE_ON_A_PLAN } from '@/engine/world/plans';

interface Answer { ok: boolean; id?: string; error?: string }

const put = (sim: Simulation, payload: Record<string, unknown>): Answer =>
  sim.execute<Answer>({ kind: 'calendar.schedule', payload }).value!;

const withTwin = {
  mother: { firstName: 'Halla', ageAtBirth: 29, role: 'the company' as const },
  father: { firstName: 'Jón', ageAtBirth: 31, role: 'the lot' as const },
  twin: { firstName: 'Katla', gender: 'female' as const, identical: false, role: 'the house' as const },
};

const idOf = (universe: SaveUniverse, first: string): Id =>
  Object.values(universe.people).find((one) => one.firstName === first)!.id;

const closeness = (sim: Simulation, first: string): number =>
  bondFor(sim.universe, sim.universe.playerId, idOf(sim.universe, first))!.closeness;

describe('turning up', () => {
  it('warms where you stand with everybody who was there', () => {
    const sim = quickSave({ family: withTwin }, 'standing-kept');
    const before = closeness(sim, 'Halla');

    const answer = put(sim, {
      title: 'Dinner', at: sim.now + 2 * MS_HOUR, durationMinutes: 90,
      withIds: [idOf(sim.universe, 'Halla')],
    });
    expect(answer.ok).toBe(true);

    sim.advanceTo(sim.now + 3 * MS_HOUR);
    expect(closeness(sim, 'Halla')).toBeCloseTo(before + TOGETHER_WARMS, 5);
  });

  it('leaves everybody who was not there exactly where they were', () => {
    const sim = quickSave({ family: withTwin }, 'standing-untouched');
    const before = closeness(sim, 'Jón');
    put(sim, {
      title: 'Dinner', at: sim.now + 2 * MS_HOUR,
      withIds: [idOf(sim.universe, 'Halla')],
    });
    sim.advanceTo(sim.now + 3 * MS_HOUR);
    expect(closeness(sim, 'Jón')).toBe(before);
  });

  it('records the day, so the world knows when you last saw them', () => {
    const sim = quickSave({ family: withTwin }, 'standing-last-seen');
    const halla = idOf(sim.universe, 'Halla');
    const when = sim.now + 2 * MS_HOUR;
    put(sim, { title: 'Dinner', at: when, withIds: [halla] });
    sim.advanceTo(sim.now + 3 * MS_HOUR);
    // The moment you were together, not the moment the clock stopped after.
    expect(bondFor(sim.universe, sim.universe.playerId, halla)!.lastTogetherAt).toBe(when);
  });
});

describe('not turning up', () => {
  it('costs more than turning up is worth', () => {
    expect(MISSED_COOLS).toBeGreaterThan(TOGETHER_WARMS);
  });

  it('cools where you stand with everybody who was waiting', () => {
    const sim = quickSave({ family: withTwin }, 'standing-missed');
    const before = closeness(sim, 'Katla');
    put(sim, {
      title: 'Her Birthday', at: sim.now + 2 * MS_HOUR,
      locationId: 'us-ca-losangeles',
      withIds: [idOf(sim.universe, 'Katla')],
    });
    sim.advanceTo(sim.now + 3 * MS_HOUR);
    expect(closeness(sim, 'Katla')).toBeCloseTo(before - MISSED_COOLS, 5);
  });

  it('says who was left waiting, by name', () => {
    const sim = quickSave({ family: withTwin }, 'standing-missed-said');
    put(sim, {
      title: 'Her Birthday', at: sim.now + 2 * MS_HOUR,
      locationId: 'us-ca-losangeles',
      withIds: [idOf(sim.universe, 'Katla'), idOf(sim.universe, 'Halla')],
    });
    sim.advanceTo(sim.now + 3 * MS_HOUR);
    const said = sim.universe.notifications.map((one) => one.body).join(' ');
    expect(said).toContain('Katla and Halla noticed.');
  });

  it('says nothing about people when the plan was with nobody', () => {
    const sim = quickSave({}, 'standing-missed-alone');
    put(sim, {
      title: 'An Audition', at: sim.now + 2 * MS_HOUR,
      locationId: 'us-ca-losangeles',
    });
    sim.advanceTo(sim.now + 3 * MS_HOUR);
    const said = sim.universe.notifications.map((one) => one.body).join(' ');
    expect(said).toContain('You Missed'.slice(0, 0) + 'and you were in');
    expect(said).not.toContain('noticed');
  });
});

describe('what the calendar will not take', () => {
  const reason = (sim: Simulation, withIds: unknown): string | undefined =>
    put(sim, { title: 'Dinner', at: sim.now + MS_HOUR, withIds }).error;

  it('refuses a plan you made with yourself', () => {
    const sim = quickSave({ family: withTwin }, 'standing-refuse-self');
    expect(reason(sim, [sim.universe.playerId]))
      .toBe('You’re already going. That’s what makes it your plan.');
  });

  it('refuses somebody who is not in the save', () => {
    const sim = quickSave({ family: withTwin }, 'standing-refuse-stranger');
    expect(reason(sim, ['person_ffffff'])).toBe('You don’t know anybody by that name.');
  });

  it('refuses the same person twice on one plan', () => {
    const sim = quickSave({ family: withTwin }, 'standing-refuse-double');
    const halla = idOf(sim.universe, 'Halla');
    expect(reason(sim, [halla, halla])).toBe('Somebody is on that list twice.');
  });

  it('refuses more people than one plan can hold', () => {
    const sim = quickSave({ family: withTwin }, 'standing-refuse-crowd');
    const crowd = Array.from({ length: MOST_PEOPLE_ON_A_PLAN + 1 }, (_, i) => `person_${i}`);
    expect(reason(sim, crowd)).toMatch(/Make it two plans/);
  });

  it('takes a plan with nobody on it, because most plans are', () => {
    const sim = quickSave({}, 'standing-refuse-none');
    expect(put(sim, { title: 'An Audition', at: sim.now + MS_HOUR }).ok).toBe(true);
  });
});

describe('a stretch of time with nothing in it', () => {
  it('pulls a warm bond back down toward ordinary, and no further', () => {
    const sim = quickSave({ family: withTwin }, 'standing-drift-down');
    const halla = idOf(sim.universe, 'Halla');
    moveBond(sim.universe, sim.universe.playerId, halla, 25, sim.now);
    const high = closeness(sim, 'Halla');

    driftBonds(sim.universe, sim.now + 400 * MS_DAY);
    const settled = closeness(sim, 'Halla');
    expect(settled).toBeLessThan(high);
    expect(settled).toBeCloseTo(RESTING_UNDER_ONE_ROOF, 1);
  });

  it('pulls a cold bond back up, because you still live with them', () => {
    const sim = quickSave({ family: withTwin }, 'standing-drift-up');
    const halla = idOf(sim.universe, 'Halla');
    moveBond(sim.universe, sim.universe.playerId, halla, -60, sim.now);
    const low = closeness(sim, 'Halla');

    driftBonds(sim.universe, sim.now + 400 * MS_DAY);
    expect(closeness(sim, 'Halla')).toBeGreaterThan(low);
    expect(closeness(sim, 'Halla')).toBeCloseTo(RESTING_UNDER_ONE_ROOF, 1);
  });

  it('costs the same whether you live the month or skip it', () => {
    const lived = quickSave({ family: withTwin }, 'standing-drift-lived').universe;
    const skipped = quickSave({ family: withTwin }, 'standing-drift-skipped').universe;
    const start = lived.now;

    for (let day = 1; day <= 30; day += 1) driftBonds(lived, start + day * MS_DAY);
    driftBonds(skipped, start + 30 * MS_DAY);

    const both = (universe: SaveUniverse): number[] =>
      Object.values(universe.bonds).map((bond) => Math.round(bond.closeness * 1e6));
    expect(both(lived)).toEqual(both(skipped));
  });

  it('charges nothing at all for less than a whole day', () => {
    const sim = quickSave({ family: withTwin }, 'standing-drift-hours');
    const before = closeness(sim, 'Halla');
    driftBonds(sim.universe, sim.now + 23 * MS_HOUR);
    expect(closeness(sim, 'Halla')).toBe(before);
  });

  it('never runs a bond past the ends of the scale', () => {
    const sim = quickSave({ family: withTwin }, 'standing-bounds');
    const halla = idOf(sim.universe, 'Halla');
    moveBond(sim.universe, sim.universe.playerId, halla, 999, sim.now);
    expect(closeness(sim, 'Halla')).toBe(100);
    moveBond(sim.universe, sim.universe.playerId, halla, -999, sim.now);
    expect(closeness(sim, 'Halla')).toBe(0);
  });

  it('says how far a bond really moved, not how far it was pushed', () => {
    const sim = quickSave({ family: withTwin }, 'standing-moved');
    const halla = idOf(sim.universe, 'Halla');
    moveBond(sim.universe, sim.universe.playerId, halla, 999, sim.now);
    expect(moveBond(sim.universe, sim.universe.playerId, halla, 20, sim.now)).toBe(0);
  });
});

describe('where a bond settles', () => {
  it('is higher for somebody you live with than somebody you do not', () => {
    expect(RESTING_UNDER_ONE_ROOF).toBeGreaterThan(RESTING_APART);
  });

  it('follows the house rather than the name', () => {
    const sim = quickSave({ family: withTwin }, 'standing-resting');
    const bond = bondFor(sim.universe, sim.universe.playerId, idOf(sim.universe, 'Halla'))!;
    expect(restingLevel(sim.universe, bond)).toBe(RESTING_UNDER_ONE_ROOF);

    // The same mother, once she no longer wakes up in the same house.
    sim.universe.people[idOf(sim.universe, 'Halla')]!.householdId = 'household_elsewhere';
    expect(restingLevel(sim.universe, bond)).toBe(RESTING_APART);
  });

  it('drifts by a real fraction of the gap each day', () => {
    expect(DRIFT_PER_DAY).toBeGreaterThan(0);
    expect(DRIFT_PER_DAY).toBeLessThan(0.2);
  });
});

describe('what the people around you do to your days', () => {
  it('lifts morale when you are getting on with them', () => {
    const sim = quickSave({ family: withTwin }, 'standing-morale-up');
    for (const bond of Object.values(sim.universe.bonds)) bond.closeness = 100;
    expect(moralePullOf(sim.universe, sim.universe.playerId)).toBeCloseTo(MORALE_FROM_STANDING, 5);
  });

  it('costs morale when you are not', () => {
    const sim = quickSave({ family: withTwin }, 'standing-morale-down');
    for (const bond of Object.values(sim.universe.bonds)) bond.closeness = 0;
    expect(moralePullOf(sim.universe, sim.universe.playerId)).toBeCloseTo(-MORALE_FROM_STANDING, 5);
  });

  it('is nothing either way when everybody is exactly even', () => {
    const sim = quickSave({ family: withTwin }, 'standing-morale-even');
    for (const bond of Object.values(sim.universe.bonds)) bond.closeness = 50;
    expect(moralePullOf(sim.universe, sim.universe.playerId)).toBe(0);
  });

  it('averages them, so one good one does not cover a bad house', () => {
    const sim = quickSave({ family: withTwin }, 'standing-morale-average');
    const player = sim.universe.playerId;
    for (const bond of bondsOf(sim.universe, player)) bond.closeness = 10;
    bondsOf(sim.universe, player)[0]!.closeness = 100;
    expect(moralePullOf(sim.universe, player)).toBeLessThan(0);
  });

  it('actually reaches morale as the days pass', () => {
    // Sleep, rest and an ordinary day all pull on morale too, so the reading
    // that means anything is two identical weeks that differ only in this.
    const week = (closenessEach: number): number => {
      const sim = quickSave({ family: withTwin }, 'standing-morale-lands');
      for (const bond of Object.values(sim.universe.bonds)) {
        bond.closeness = closenessEach;
        bond.lastDriftedAt = sim.now + 400 * MS_DAY;
      }
      sim.player.wellbeing.morale = 50;
      sim.advanceTo(sim.now + 7 * MS_DAY);
      return sim.player.wellbeing.morale;
    };
    const good = week(100);
    const bad = week(0);
    expect(good).toBeGreaterThan(bad);
    // Seven days of it, both ways from even, is worth about that much.
    expect(good - bad).toBeCloseTo(2 * MORALE_FROM_STANDING * 7, 0);
  });
});

describe('saying it out loud', () => {
  it('has a word and a sentence for every number on the scale', () => {
    for (let n = 0; n <= 100; n += 1) {
      expect(standingWord(n), `nothing to say at ${n}`).toBeTruthy();
      expect(standingSaid(n), `nothing to say at ${n}`).toMatch(/\.$/);
    }
  });

  it('never gets warmer as the number gets colder', () => {
    const seen: string[] = [];
    for (let n = 100; n >= 0; n -= 1) {
      const word = standingWord(n);
      if (seen[seen.length - 1] !== word) seen.push(word);
    }
    expect(seen).toEqual(STANDING_BANDS.map((band) => band.word));
  });

  it('never says a number, because nobody says a number', () => {
    for (const band of STANDING_BANDS) {
      expect(band.said, band.word).not.toMatch(/\d/);
    }
  });
});

describe('reading a bond back', () => {
  it('finds the same bond from either end', () => {
    const sim = quickSave({ family: withTwin }, 'standing-either-end');
    const halla = idOf(sim.universe, 'Halla');
    expect(bondFor(sim.universe, sim.universe.playerId, halla))
      .toBe(bondFor(sim.universe, halla, sim.universe.playerId));
  });

  it('lists everybody somebody has a standing with, warmest first', () => {
    const sim = quickSave({ family: withTwin }, 'standing-list');
    const mine = bondsOf(sim.universe, sim.universe.playerId);
    expect(mine).toHaveLength(3);
    for (let i = 1; i < mine.length; i += 1) {
      expect(mine[i - 1]!.closeness).toBeGreaterThanOrEqual(mine[i]!.closeness);
    }
    // The twin, who has been beside you longest, comes first.
    expect(otherIn(mine[0]!, sim.universe.playerId)).toBe(idOf(sim.universe, 'Katla'));
  });
});
