import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { quickSave, validateUniverse, migrate, loadSave } from '@/engine';
import type { Simulation } from '@/engine';
import { SAVE_SCHEMA_VERSION, type Person, type Wellbeing } from '@/engine/domain/model';
import { applySleep, settleTheBody, sleepQuality, sleepStandsForTheNight, startOfLocalDay, suggestedSleep, unattendedNight } from '@/engine/systems/life';
import { formatTime, instantFromZoned, MS_DAY, MS_HOUR, MS_MINUTE, startOfNextDay, zonedParts } from '@/engine/core/time';
import { skipTargets, checkConflicts, entriesBetween, monthGrid } from '@/engine/world/calendar';
import { openDecisions } from '@/engine/world/world';
import { createIdFactory, idAlreadyIssued, ID_NAMESPACES } from '@/engine/core/ids';
import { addCountryCities } from '@/engine/content/geography';

describe('time advancement', () => {
  it('refuses to run the clock backwards', () => {
    const sim = quickSave();
    expect(() => sim.advanceTo(sim.now - MS_HOUR)).toThrow(/backwards/);
  });

  it('processes due items in chronological order', () => {
    const sim = quickSave();
    const fired: number[] = [];
    sim.onSchedule('test.ordered', (item) => { fired.push(item.payload.index as number); });

    // Deliberately schedule out of order.
    for (const index of [3, 1, 4, 2, 0]) {
      sim.schedule({
        at: sim.now + (index + 1) * MS_HOUR,
        kind: 'test.ordered',
        label: `step ${index}`,
        category: 'system',
        payload: { index },
      });
    }
    sim.advanceTo(sim.now + 6 * MS_HOUR);
    expect(fired).toEqual([0, 1, 2, 3, 4]);
  });

  it('sets the clock to each item as it fires, not to the target', () => {
    const sim = quickSave();
    const seen: number[] = [];
    const target = sim.now + 5 * MS_HOUR;
    sim.onSchedule('test.clock', (item, s) => { seen.push(s.now - item.at); });
    for (let i = 1; i <= 4; i++) {
      sim.schedule({ at: sim.now + i * MS_HOUR, kind: 'test.clock', label: 'x', category: 'system' });
    }
    sim.advanceTo(target);
    // Every handler ran at exactly the moment it was due.
    expect(seen).toEqual([0, 0, 0, 0]);
    expect(sim.now).toBe(target);
  });

  it('lands exactly on the requested instant', () => {
    const sim = quickSave();
    const target = sim.now + 37 * MS_DAY + 11 * MS_HOUR + 13 * MS_MINUTE;
    sim.advanceTo(target);
    expect(sim.now).toBe(target);
  });

  it('catches a handler that schedules itself in a loop', () => {
    const sim = quickSave();
    sim.onSchedule('test.runaway', (_item, s) => {
      s.schedule({ at: s.now, kind: 'test.runaway', label: 'loop', category: 'system' });
    });
    sim.schedule({ at: sim.now + MS_MINUTE, kind: 'test.runaway', label: 'loop', category: 'system' });
    expect(() => sim.advanceTo(sim.now + MS_DAY)).toThrow(/exceeded/);
  });

  it('refuses to schedule a kind with no handler, rather than dropping it silently', () => {
    const sim = quickSave();
    expect(() => sim.schedule({
      at: sim.now + MS_HOUR, kind: 'nobody.handles.this', label: 'x', category: 'system',
    })).toThrow(/no handler is registered/);
  });

  it('says what the advance in progress was asked for and where it will stop, and nothing outside one', () => {
    const sim = quickSave();
    const start = sim.now;
    const seen: (number | undefined)[] = [];
    const asked: unknown[] = [];
    sim.onSchedule('test.where', (_item, s) => {
      seen.push(s.advancingTo);
      asked.push({ ...s.advancing });
    });
    sim.onSchedule('test.call', () => undefined);
    const where = (at: number, priority?: number) => {
      sim.schedule({ at, kind: 'test.where', label: 'Where', category: 'system', priority });
    };
    const call = (at: number) => {
      sim.schedule({ at, kind: 'test.call', label: 'A Call', category: 'personal', requiresPlayer: true });
    };
    expect(sim.advancingTo).toBeUndefined();
    // Asked to stop for the player, it stops at the call.
    where(start + MS_HOUR);
    call(start + 3 * MS_HOUR);
    expect(sim.advanceTo(start + 8 * MS_HOUR, { stopOnPlayerRequired: true }).interruptedBy?.kind).toBe('test.call');
    // Going on from the call, the call is not a stop: the advance only stops
    // for something after where it started, and never for something past
    // where it was asked to go. Carried on as the jump the call broke off, it
    // says where that jump was sent from.
    where(start + 3 * MS_HOUR, 50);
    call(start + 10 * MS_HOUR);
    const resumed = sim.advanceTo(start + 8 * MS_HOUR, { stopOnPlayerRequired: true, resumes: start });
    expect(resumed.sentFrom).toBe(start);
    // And not asked to stop, it runs to its target. A jump can only be
    // resumed from where it stopped or earlier, so one said to resume from
    // later is its own.
    where(start + 9 * MS_HOUR);
    expect(sim.advanceTo(start + 12 * MS_HOUR, { resumes: start + 9 * MS_HOUR }).sentFrom).toBe(start + 8 * MS_HOUR);
    expect(seen).toEqual([start + 3 * MS_HOUR, start + 8 * MS_HOUR, start + 12 * MS_HOUR]);
    expect(asked).toEqual([
      { from: start, target: start + 8 * MS_HOUR, sentFrom: start },
      { from: start + 3 * MS_HOUR, target: start + 8 * MS_HOUR, sentFrom: start },
      { from: start + 8 * MS_HOUR, target: start + 12 * MS_HOUR, sentFrom: start + 8 * MS_HOUR },
    ]);
    expect(sim.advancingTo).toBeUndefined();
    expect(sim.advancing).toBeUndefined();
  });
});

describe('sleep', () => {
  it('advances the world by exactly the hours slept', () => {
    const sim = quickSave();
    const before = sim.now;
    const result = sim.execute<{ wokeAt: number }>({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(result.ok).toBe(true);
    expect(sim.now).toBe(before + 8 * MS_HOUR);
  });

  it('restores energy and pays down sleep debt', () => {
    const sim = quickSave();
    sim.player.wellbeing.energy = 20;
    sim.player.wellbeing.sleepDebt = 12;
    sim.execute({ kind: 'life.sleep', payload: { hours: 9 } });
    expect(sim.player.wellbeing.energy).toBeGreaterThan(60);
    expect(sim.player.wellbeing.sleepDebt).toBeLessThan(12);
  });

  it('accrues debt when the night is short', () => {
    const sim = quickSave();
    sim.player.wellbeing.sleepDebt = 0;
    sim.execute({ kind: 'life.sleep', payload: { hours: 4 } });
    expect(sim.player.wellbeing.sleepDebt).toBeGreaterThan(0);
  });

  it('keeps processing the world while the player is unconscious', () => {
    const sim = quickSave();
    let fired = false;
    sim.onSchedule('test.overnight', () => { fired = true; });
    sim.schedule({
      at: sim.now + 4 * MS_HOUR,
      kind: 'test.overnight', label: 'a bill falls due', category: 'finance',
    });
    sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(fired).toBe(true);
  });

  it('lands on the right wall-clock time when sleeping across a DST change', () => {
    // 7 March 2026 at 11:30 PM in Los Angeles, sleeping eight hours across the
    // spring-forward transition, wakes at 8:30 AM rather than 7:30 AM.
    //
    // Los Angeles by name, not by default: home base is Reykjavík now and
    // Iceland keeps no daylight saving at all, so inheriting the home zone
    // left this testing a clock change that never happens.
    const sim = quickSave({
      startYear: 2026, startMonth: 3, startDay: 7, startLocationId: 'us-ca-losangeles',
    });
    const zone = sim.homeZone;
    const bedtime = sim.now;
    const parts = zonedParts(bedtime, zone);
    expect(parts.day).toBe(7);

    sim.advanceTo(bedtime + (23.5 - parts.hour - parts.minute / 60) * MS_HOUR);
    sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
    // Eight elapsed hours from 11:30 PM on the night the clocks go forward.
    expect(formatTime(sim.now, zone)).toBe('8:30 AM');
  });
});

describe('the waking day', () => {
  /** To bed at eleven for eight hours, so the save starts the day rested and owing nothing. */
  function rested(seed: string): Simulation {
    const sim = quickSave({}, seed);
    sim.advanceTo(next(sim, 23));
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
    expect(sim.player.wellbeing.sleepDebt).toBe(0);
    return sim;
  }

  it('charges the stretch up to something that stops the clock for the player', () => {
    // Every clock move the player makes stops early like this, and the stretch
    // up to the stop has to be charged there: nothing charges it later.
    const sim = rested('early-stop');
    sim.onSchedule('test.call', () => undefined);
    sim.schedule({ at: sim.now + 4 * MS_HOUR, kind: 'test.call', label: 'A Call', category: 'personal', requiresPlayer: true });
    const woke = sim.player.wellbeing.energy;
    expect(sim.advanceTo(sim.now + 8 * MS_HOUR, { stopOnPlayerRequired: true }).interruptedBy?.kind).toBe('test.call');
    expect(woke - sim.player.wellbeing.energy).toBeCloseTo(12, 9);
    sim.advanceTo(sim.now + 4 * MS_HOUR);
    expect(woke - sim.player.wellbeing.energy).toBeCloseTo(24, 9);
  });

  it('drains faster the more sleep debt somebody woke with', () => {
    const sim = rested('waking-debt');
    sim.player.wellbeing.sleepDebt = 24;
    sim.player.wokeWithDebt = 24;
    const woke = sim.player.wellbeing.energy;
    sim.advanceTo(sim.now + 2 * MS_HOUR);
    sim.advanceTo(sim.now + 2 * MS_HOUR);
    // Three an hour, and half as much again for a day's debt.
    expect(woke - sim.player.wellbeing.energy).toBeCloseTo(4 * 3 * 1.5, 9);
  });

  it('keeps the debt a short night left over sixty, and drains it the same by the minute as in one jump', () => {
    const make = () => {
      const sim = rested('over-sixty');
      sim.player.wellbeing.sleepDebt = 59;
      sim.player.wellbeing.energy = 80;
      expect(sim.execute({ kind: 'life.sleep', payload: { hours: 1 } }).ok).toBe(true);
      return sim;
    };
    const ticked = make();
    const jumped = make();
    const woke = ticked.player.wellbeing.sleepDebt;
    expect(woke).toBeGreaterThan(60);
    ticked.advanceTo(ticked.now + 1000);
    expect(ticked.player.wellbeing.sleepDebt).toBe(woke);
    for (let minute = 0; minute < 6 * 60; minute += 1) ticked.advanceTo(ticked.now + MS_MINUTE);
    jumped.advanceTo(jumped.now + 1000 + 6 * MS_HOUR);
    expect(ticked.player.wellbeing.energy).toBeCloseTo(jumped.player.wellbeing.energy, 6);
  });

  it('drains the same by the minute as in one jump when the debt reaches sixty while awake', () => {
    const make = () => {
      const sim = rested('reaching-sixty');
      sim.player.wellbeing.sleepDebt = 58;
      sim.player.wokeWithDebt = 58;
      return sim;
    };
    const ticked = make();
    const jumped = make();
    for (let minute = 0; minute < 12 * 60; minute += 1) ticked.advanceTo(ticked.now + MS_MINUTE);
    jumped.advanceTo(jumped.now + 12 * MS_HOUR);
    expect(ticked.player.wellbeing.sleepDebt).toBeCloseTo(60, 9);
    expect(ticked.player.wellbeing.energy).toBeCloseTo(jumped.player.wellbeing.energy, 6);
  });

  it('is charged as the clock moves, so energy falls through a day of play', () => {
    const sim = rested('waking-day');
    const woke = sim.player.wellbeing.energy;
    sim.advanceTo(sim.now + 4 * MS_HOUR);
    const noon = sim.player.wellbeing.energy;
    sim.advanceTo(sim.now + 4 * MS_HOUR);
    // Three an hour, with no debt carried out of the night to raise it.
    expect(woke - noon).toBeCloseTo(12, 9);
    expect(noon - sim.player.wellbeing.energy).toBeCloseTo(12, 9);
  });

  it('charges nothing at midnight: a minute either side of it costs what any two minutes do', () => {
    // The rollover charged the whole day ahead here, and staying up past it
    // took energy from a hundred to twenty-eight in one step.
    const sim = rested('waking-midnight');
    const midnight = next(sim, 0);
    sim.advanceTo(midnight - MS_MINUTE);
    const before = sim.player.wellbeing.energy;
    sim.advanceTo(midnight + MS_MINUTE);
    expect(before - sim.player.wellbeing.energy).toBeCloseTo(0.1, 9);
  });

  it('charges nothing while the player sleeps, and a midnight inside the night finds them in bed', () => {
    const sim = quickSave({}, 'waking-asleep');
    let during: number | undefined;
    let slept: number | undefined = -1;
    sim.onSchedule('test.overnight', (_item, s) => {
      during = s.player.wellbeing.energy;
      slept = s.player.lastSleptAt;
    });
    sim.advanceTo(next(sim, 23));
    const bedtime = sim.player.wellbeing.energy;
    sim.schedule({ at: next(sim, 3), kind: 'test.overnight', label: 'Three In The Morning', category: 'system' });
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
    expect(during).toBe(bedtime);
    // The night is on record from bedtime, as its wake. The first night
    // crossed midnight with no sleep on record yet, and was given a night
    // nobody chose on top of the one the player did.
    expect(slept).toBe(sim.now);
    expect(sim.player.lastSleptAt).toBe(sim.now);
    expect(sim.player.awakeSince).toBe(sim.now);
  });

  it('charges the hours up to a night booked ahead, and reads the night at the hour it starts', () => {
    // It used to read the night when it was booked: booked at eight for two
    // in the morning, it was slept as a night that started at eight.
    const sim = rested('waking-booked');
    sim.advanceTo(next(sim, 20));
    const evening = sim.player.wellbeing.energy;
    const atEight = sleepQuality(sim, sim.player);
    const two = next(sim, 2);
    const result = sim.execute<{ quality: number; recovered: number }>({ kind: 'life.sleep', payload: { hours: 8, startAt: two } });
    expect(result.ok, result.error).toBe(true);
    // Two in the morning is a late bedtime, which costs a night 0.08.
    expect(result.value!.quality).toBeCloseTo(atEight - 0.08, 9);
    expect(sim.player.lastSleptAt).toBe(two + 8 * MS_HOUR);
    expect(evening).toBeCloseTo(100 - 13 * 3, 9);
    // And every hour up to the bedtime is charged: nineteen from the wake at
    // seven. This used to be read at eight, before the hours it names.
    expect(sim.player.wellbeing.energy - result.value!.recovered).toBeCloseTo(100 - 19 * 3, 9);
  });

  /** Sleeps, and says what the night alone would have done, worked on a copy taken at bedtime. */
  function sleepAndCompare(sim: Simulation, hours: number): { got: Wellbeing; alone: Wellbeing } {
    const copy: Person = { ...sim.player, wellbeing: { ...sim.player.wellbeing } };
    const result = sim.execute<{ quality: number }>({ kind: 'life.sleep', payload: { hours } });
    expect(result.ok, result.error).toBe(true);
    applySleep(copy, hours, result.value!.quality, sim.now);
    return { got: sim.player.wellbeing, alone: copy.wellbeing };
  }

  it('sleeps a chosen night once, whether it crosses midnight, ends on it, or neither', () => {
    // A hard day behind them each time, so no dial a night moves sits at a
    // limit that would hide a second night. Four in the afternoon for eight
    // hours wakes on the stroke of midnight, where the rollover used to see
    // no sleep on record and give a night nobody chose on top.
    const dials = ['energy', 'sleepDebt', 'stress', 'morale'] as const;
    for (const bedtime of [23, 1, 16]) {
      const sim = quickSave({}, `waking-once-${bedtime}`);
      for (let night = 1; night <= 3; night += 1) {
        sim.advanceTo(next(sim, bedtime));
        Object.assign(sim.player.wellbeing, { energy: 10, sleepDebt: 20, stress: 50, morale: 50 });
        const { got, alone } = sleepAndCompare(sim, 8);
        for (const dial of dials) {
          expect(got[dial], `to bed at ${bedtime}, night ${night}: ${dial}`).toBe(alone[dial]);
        }
      }
    }
  });

  it('charges every hour of thirty awake once, the ones past midnight included', () => {
    // Hygiene falls 1.6 an hour awake for nobody in particular, a night does
    // not touch it, and midnight tops it up to 82: a clean count of hours.
    // The player stays up with them an hour at a time past eleven: one jump
    // to one in the afternoon would carry them through a night they sleep.
    const sim = rested('waking-thirty');
    expect(sim.player.wellbeing.hygiene).toBe(82);
    sim.advanceTo(next(sim, 23));
    expect(sim.player.wellbeing.hygiene).toBeCloseTo(82 - 16 * 1.6, 9);
    const one = next(sim, 13);
    while (sim.now < one) sim.advanceTo(Math.min(one, sim.now + MS_HOUR));
    expect(sim.player.wellbeing.hygiene).toBeCloseTo(82 - 13 * 1.6, 9);
  });

  it('costs the same in one-second ticks of live play as in one jump', () => {
    // Sixteen hours, seven to eleven, that run out of energy, go hungry and
    // get overwrought, so every rule that splits a stretch is crossed. They
    // were twenty and then eighteen, across a midnight, while a jump an hour
    // into the night still left them up with the player. A jump into the
    // night puts them to bed from midnight now, which ticks never do; what
    // midnight itself charges is the test above.
    const ticked = rested('waking-ticks');
    const jumped = rested('waking-ticks');
    for (const sim of [ticked, jumped]) Object.assign(sim.player.wellbeing, { energy: 30, nourishment: 30, stress: 70 });
    const condition = jumped.player.wellbeing.condition;
    const end = jumped.now + 16 * MS_HOUR;
    while (ticked.now < end) ticked.advanceBy(1_000);
    jumped.advanceTo(end);
    const w = jumped.player.wellbeing;
    expect(w.energy).toBe(0);
    expect(w.stress).toBeGreaterThan(75);
    expect(w.condition).toBeLessThan(condition);
    for (const [key, value] of Object.entries(w)) {
      expect(ticked.player.wellbeing[key as keyof typeof w], key).toBeCloseTo(value, 6);
    }
  });

  it('ends a day saved and loaded halfway where the same day played straight through does', () => {
    // Where the waking day began is in the save, so nothing about it is lost
    // on the way through storage.
    const straight = rested('waking-reload');
    const saved = loadSave(JSON.parse(JSON.stringify(straight.universe)));
    const bed = straight.now + 16 * MS_HOUR;
    straight.advanceTo(straight.now + 8.25 * MS_HOUR);
    saved.advanceTo(saved.now + 8.25 * MS_HOUR);
    const reloaded = loadSave(JSON.parse(JSON.stringify(saved.universe)));
    straight.advanceTo(bed);
    reloaded.advanceTo(bed);
    expect(reloaded.player.wellbeing).toEqual(straight.player.wellbeing);
    expect(reloaded.player.awakeSince).toBe(straight.player.awakeSince);
    expect(straight.player.wellbeing.energy).toBeLessThan(60);
  });

  it('starts a day nobody planned when a sound sleeper would wake', () => {
    // Skipped from the first morning to the next noon, so the clock carries
    // them through the night and they sleep it with nobody steering.
    const sim = quickSave({}, 'waking-unattended');
    const midnight = next(sim, 0);
    const noon = midnight + 12 * MS_HOUR;
    const inBed: { energy: number; debt: number }[] = [];
    sim.onSchedule('test.look', (_item, s) => {
      inBed.push({ energy: s.player.wellbeing.energy, debt: s.player.wellbeing.sleepDebt });
    });
    for (const hour of [1, 3]) {
      sim.schedule({ at: midnight + hour * MS_HOUR, kind: 'test.look', label: 'A Look', category: 'system' });
    }
    sim.advanceTo(noon);
    expect(sim.player.lastSleptAt).toBe(midnight);
    const wakes = sim.player.awakeSince!;
    expect(wakes).toBeGreaterThanOrEqual(midnight + 5.4 * MS_HOUR);
    expect(wakes).toBeLessThanOrEqual(midnight + 8.4 * MS_HOUR);
    // Charged nothing in bed, and from the wake on, every hour: hygiene falls
    // a flat 1.6 an hour awake from the 82 that midnight tops it up to. The
    // day drains at the debt the night left, which is what they woke with.
    expect(inBed[1]).toEqual(inBed[0]);
    expect(sim.player.wokeWithDebt).toBe(inBed[0]!.debt);
    expect(sim.player.wellbeing.hygiene).toBeCloseTo(82 - ((noon - wakes) / MS_HOUR) * 1.6, 9);
    // And the meals midnight puts back are the day's, two an hour from 76:
    // the night is slept before them, not out of them.
    expect(sim.player.wellbeing.nourishment).toBeCloseTo(76 - ((noon - wakes) / MS_HOUR) * 2, 9);
  });

  it('puts nobody to bed at a new save’s first midnight while the player is up with them', () => {
    // A new save had no night on record, so its first midnight owed it one
    // and gave it to a player who was watching: energy went up to 74 at
    // midnight and stood there until morning.
    const sim = quickSave({}, 'first-midnight-up');
    const created = sim.now;
    // Stepped the way the game steps it, with a plan days away that the clock
    // must not take for where it is going.
    expect(sim.execute({ kind: 'calendar.schedule', payload: { title: 'Lunch', at: created + 3 * MS_DAY } }).ok).toBe(true);
    const stop = { stopOnPlayerRequired: true };
    sim.advanceTo(next(sim, 22), stop);
    const ten = sim.player.wellbeing.energy;
    const three = next(sim, 3);
    while (sim.now < three) sim.advanceTo(Math.min(three, sim.now + MS_HOUR), stop);
    // Three an hour for the five hours up, midnight's included.
    expect(ten - sim.player.wellbeing.energy).toBeCloseTo(15, 9);
    expect(sim.player.lastSleptAt).toBe(created);
    expect(sim.player.awakeSince).toBe(created);
  });

  it('does not put a new save back to bed when it is skipped from its first morning', () => {
    // The world starts the morning after a night on record as ending then.
    // Without it, a save that starts before a sound sleeper would be up, and
    // is skipped at once, goes back to bed until the afternoon.
    const sim = quickSave({}, 'first-morning');
    const created = sim.now;
    expect(created - startOfLocalDay(sim)).toBeLessThan(unattendedNight(sim.player).sound * MS_HOUR);
    const woke = sim.player.wellbeing.energy;
    sim.advanceTo(created + 12 * MS_HOUR);
    expect(sim.player.lastSleptAt).toBe(created);
    expect(woke - sim.player.wellbeing.energy).toBeCloseTo(12 * 3, 9);
  });

  it('gives a week skipped the morning after a chosen night its first night at the first midnight', () => {
    // That midnight is seventeen hours after a seven o'clock wake, and a
    // night nobody chose was owed only twenty hours after the last one. The
    // first came at the second midnight, forty-one hours up, and the second
    // day ran out of energy.
    const sim = rested('week-skipped');
    const midnight = next(sim, 0);
    const looks: { slept?: number; awake?: number; energy: number }[] = [];
    sim.onSchedule('test.look', (_item, s) => {
      looks.push({ slept: s.player.lastSleptAt, awake: s.player.awakeSince, energy: s.player.wellbeing.energy });
    });
    for (const hour of [3, 23]) {
      sim.schedule({ at: midnight + hour * MS_HOUR, kind: 'test.look', label: 'A Look', category: 'system' });
    }
    sim.advanceTo(sim.now + 7 * MS_DAY);
    expect(looks[0]!.slept).toBe(midnight);
    expect(looks[0]!.awake).toBeGreaterThanOrEqual(midnight + 5.4 * MS_HOUR);
    expect(looks[0]!.awake).toBeLessThanOrEqual(midnight + 8.4 * MS_HOUR);
    expect(looks[1]!.energy).toBeGreaterThan(20);
  });

  it('puts somebody the player stayed up with to bed when the rest of the night is skipped', () => {
    const sim = rested('stayed-up');
    const midnight = next(sim, 0);
    const one = midnight + MS_HOUR;
    while (sim.now < one) sim.advanceTo(Math.min(one, sim.now + MS_HOUR));
    expect(sim.player.lastSleptAt).toBeLessThan(midnight);
    const bed: Person = structuredClone(sim.player);
    const quality = sleepQuality(sim, sim.player) * 0.95;
    sim.advanceTo(one + 12 * MS_HOUR);
    expect(sim.player.lastSleptAt).toBe(one);
    const wakes = sim.player.awakeSince!;
    expect(wakes).toBeGreaterThanOrEqual(one + 5.4 * MS_HOUR);
    expect(wakes).toBeLessThanOrEqual(one + 8.4 * MS_HOUR);
    // Put to bed before the clock charges the stretch, so the hours asleep
    // are not charged as awake: hygiene is down only for the hours since.
    expect(sim.player.wellbeing.hygiene).toBeCloseTo(bed.wellbeing.hygiene! - ((one + 12 * MS_HOUR - wakes) / MS_HOUR) * 1.6, 9);
    // A night read at one in the morning, a late bedtime, not at the one in
    // the afternoon the clock stopped at.
    applySleep(bed, unattendedNight(bed).hours, quality, one);
    expect(sim.player.wellbeing.morale).toBeCloseTo(bed.wellbeing.morale, 9);
  });

  it('wakes somebody where the clock stops, so the player never comes back to them asleep', () => {
    // Skipped to six, before a sound sleeper would be up: they are up when
    // the clock stops, and the night is slept in full. It was cut to the six
    // hours the clock had carried them, and then the hour the player chose to
    // look in at cost them sleep.
    const skippedToSix = (seed: string) => {
      const sim = quickSave({}, seed);
      const midnight = next(sim, 0);
      const six = midnight + 6 * MS_HOUR;
      let bed: Person | undefined;
      let quality = 0;
      sim.onSchedule('test.bed', (_item, s) => {
        bed = structuredClone(s.player);
        quality = sleepQuality(s, s.player) * 0.95;
      });
      // Ahead of the rollover at midnight, so it sees them before the night.
      sim.schedule({ at: midnight, kind: 'test.bed', label: 'Bedtime', category: 'system', priority: 1 });
      sim.advanceTo(six);
      return { sim, bed: bed!, quality, midnight, six, ends: midnight + Math.round(unattendedNight(bed!).sound * MS_HOUR) };
    };
    const { sim, bed, quality, midnight, six, ends } = skippedToSix('cut-short');
    expect(ends).toBeGreaterThan(six);
    expect(sim.player.lastSleptAt).toBe(midnight);
    expect(sim.player.awakeSince).toBe(six);
    // The whole night's worth, though they are up at six. On the body the
    // midnight settled first, since a night reads condition and the drift
    // comes ahead of it.
    settleTheBody(bed, midnight);
    applySleep(bed, unattendedNight(bed).hours, quality, midnight);
    expect(sim.player.wellbeing.morale).toBeCloseTo(bed.wellbeing.morale, 9);

    // Kept up from there by the player, they are charged every hour of the
    // twelve, at three an hour: the night cleared the debt.
    const up = sim.player.wellbeing.energy;
    while (sim.now < six + 12 * MS_HOUR) sim.advanceTo(sim.now + MS_HOUR);
    expect(sim.player.lastSleptAt).toBe(midnight);
    expect(sim.player.awakeSince).toBe(six);
    expect(sim.player.nightEndsAt).toBeUndefined();
    expect(up - sim.player.wellbeing.energy).toBeCloseTo(12 * 3, 9);

    // Carried on from six instead, they are back in bed until the night would
    // have ended, and charged from there. The morning the clock stopped at
    // was once the one stop that did not do this, and a plan in the hour
    // before seven then left them up earlier than no plan did.
    const skipped = skippedToSix('cut-short').sim;
    skipped.advanceTo(six + 12 * MS_HOUR);
    expect(skipped.player.lastSleptAt).toBe(midnight);
    expect(skipped.player.awakeSince).toBe(ends);
    expect(skipped.player.nightEndsAt).toBeUndefined();
    expect(up - skipped.player.wellbeing.energy).toBeCloseTo(((six + 12 * MS_HOUR - ends) / MS_HOUR) * 3, 9);

    // Kept up by the player for an hour and then sent on, they are back in bed
    // for what is left of it: a night already paid is theirs, and the hour
    // kept up is all keeping them up costs.
    const anHour = skippedToSix('cut-short').sim;
    anHour.advanceTo(six + MS_HOUR);
    expect(anHour.player.nightEndsAt).toBe(ends);
    anHour.advanceTo(six + 12 * MS_HOUR);
    expect(anHour.player.awakeSince).toBe(ends);
    expect(up - anHour.player.wellbeing.energy).toBeCloseTo((MS_HOUR + six + 12 * MS_HOUR - ends) / MS_HOUR * 3, 9);
  });

  it('tells a player who is there by how far they sent the clock, and pays a night once it has carried them an hour into it', () => {
    // An hour is the furthest the clock moves with the player there. It was
    // asked at first how far past the bedtime the clock would stop instead,
    // and a skip that stopped for something at one, an hour into the night,
    // left them up with a player who was not there: the night came at one,
    // late and poorer, and a plan at one every night wore twenty-seven of
    // the seventy-six people the calibration keeps down over a year.
    const from = (seed: string) => {
      const sim = rested(seed);
      sim.advanceTo(next(sim, 23) + 30 * MS_MINUTE);
      return { sim, midnight: next(sim, 0), up: sim.player.awakeSince };
    };

    // An hour from half past eleven is the player's, and they stay up.
    const there = from('sent-an-hour');
    there.sim.advanceTo(there.midnight + 30 * MS_MINUTE);
    expect(there.sim.player.awakeSince).toBe(there.up);
    expect(there.sim.player.nightEndsAt).toBeUndefined();
    expect(there.sim.player.lastSleptAt).toBeLessThan(there.midnight);
    // Sent on from there, the night starts at half past twelve, after the
    // day's meals, and eats 1.6 of them an hour.
    const late: Person = structuredClone(there.sim.player);
    there.sim.advanceTo(there.midnight + 7 * MS_HOUR);
    expect(there.sim.player.lastSleptAt).toBe(there.midnight + 30 * MS_MINUTE);
    expect(there.sim.player.wellbeing.nourishment).toBeCloseTo(late.wellbeing.nourishment - unattendedNight(late).hours * 1.6, 9);
    expect(there.sim.player.wellbeing.nourishment).toBeLessThan(76);

    // A minute more is a jump: in bed from midnight, and charged nothing past
    // it, but the night is not paid for thirty-one minutes of it.
    const jumped = from('sent-past-an-hour');
    const hygiene = jumped.sim.player.wellbeing.hygiene;
    jumped.sim.advanceTo(jumped.midnight + 31 * MS_MINUTE);
    expect(jumped.sim.player.awakeSince).toBe(jumped.midnight + 31 * MS_MINUTE);
    expect(jumped.sim.player.nightOwedFrom).toBe(jumped.midnight);
    expect(jumped.sim.player.lastSleptAt).toBeLessThan(jumped.midnight);
    expect(jumped.sim.player.wellbeing.hygiene).toBeCloseTo(Math.max(hygiene! - 0.5 * 1.6, 82), 9);

    // Carried on from there, the night is paid as if the skip had never
    // stopped: from midnight, and before the day's meals, as the rollover
    // pays it.
    const straight = from('sent-past-an-hour');
    const seven = straight.midnight + 7 * MS_HOUR;
    straight.sim.advanceTo(seven);
    jumped.sim.advanceTo(seven);
    expect(jumped.sim.player.lastSleptAt).toBe(jumped.midnight);
    expect(jumped.sim.player.nightOwedFrom).toBeUndefined();
    expect(jumped.sim.player.wellbeing).toEqual(straight.sim.player.wellbeing);
    expect(jumped.sim.player.awakeSince).toBe(straight.sim.player.awakeSince);

    // Kept up by the player for any of it, it is forfeit, and the next jump
    // puts them to bed from where the player left them. It was kept owed at
    // first, and the next jump paid it whole from midnight, so hours kept up
    // cost nothing: kept up to half past seven after a stop at half past
    // midnight, nightly, thirty of the seventy-six wore down.
    const ended: number[] = [];
    for (const hours of [1, 3, 6]) {
      const partway = from('sent-past-an-hour');
      partway.sim.advanceTo(partway.midnight + 31 * MS_MINUTE);
      for (let hour = 0; hour < hours; hour += 1) partway.sim.advanceTo(partway.sim.now + MS_HOUR);
      expect(partway.sim.player.nightOwedFrom, `${hours}`).toBeUndefined();
      const left = partway.sim.now;
      partway.sim.advanceTo(partway.midnight + 18 * MS_HOUR);
      expect(partway.sim.player.lastSleptAt, `${hours}`).toBe(left);
      ended.push(partway.sim.player.wellbeing.energy);
    }
    expect(new Set(ended).size).toBe(3);

    // And kept up to where it would have ended, it is never paid at all.
    const kept = from('sent-past-an-hour');
    kept.sim.advanceTo(kept.midnight + 31 * MS_MINUTE);
    const ends = kept.sim.player.nightEndsAt!;
    while (kept.sim.now < ends) kept.sim.advanceTo(Math.min(ends, kept.sim.now + MS_HOUR));
    expect(kept.sim.player.lastSleptAt).toBeLessThan(kept.midnight);
    kept.sim.advanceTo(ends + 12 * MS_HOUR);
    expect(kept.sim.player.lastSleptAt).toBeLessThan(kept.midnight);
    expect(kept.sim.player.nightEndsAt).toBeUndefined();
    expect(kept.sim.player.nightOwedFrom).toBeUndefined();
  });

  it('carries on a skip that something in the night’s first hour stopped as that skip, and charges only the stretch carried on', () => {
    // Skip To Event at half past eleven, to something at half past one, with
    // a call at half past twelve on the way. Go carries on to where the skip
    // was going. It was taken for the player keeping them up, being an hour,
    // and the night nobody chose was forfeit and started again at half past
    // one, late: a year of it wore nine of the seventy-six down, where main
    // and 0e80f13 wore none.
    const skip = (seed: string, withCall: boolean) => {
      const sim = rested(seed);
      sim.onSchedule('test.call', () => undefined);
      sim.advanceTo(next(sim, 23) + 30 * MS_MINUTE);
      const midnight = next(sim, 0);
      const target = midnight + 90 * MS_MINUTE;
      if (withCall) {
        sim.schedule({ at: midnight + 30 * MS_MINUTE, kind: 'test.call', label: 'A Call', category: 'personal', requiresPlayer: true });
      }
      const first = sim.advanceTo(target, { stopOnPlayerRequired: true });
      return { sim, midnight, target, first };
    };

    const straight = skip('a-call-on-the-way', false);
    const broken = skip('a-call-on-the-way', true);
    expect(broken.first.interruptedBy?.kind).toBe('test.call');
    expect(broken.sim.player.nightOwedFrom).toBe(broken.midnight);
    // Go: the same jump, carried on.
    broken.sim.advanceTo(broken.target, { stopOnPlayerRequired: true, resumes: broken.first.sentFrom });
    expect(broken.sim.player.nightOwedFrom).toBeUndefined();
    expect(broken.sim.player.lastSleptAt).toBe(broken.midnight);
    expect(broken.sim.player.nightEndsAt).toBe(straight.sim.player.nightEndsAt);

    // The same hour moved by the player themselves, One Hour, is theirs: the
    // night is forfeit, and the next jump starts one where they are.
    const own = skip('a-call-on-the-way', true);
    own.sim.advanceTo(own.target, { stopOnPlayerRequired: true });
    expect(own.sim.player.nightOwedFrom).toBeUndefined();
    expect(own.sim.player.nightEndsAt).toBeUndefined();

    // Sent on to the evening, the skip the call broke off reads as the skip
    // that nothing broke off, but for the hour they were up for the call:
    // back in bed until the night would have ended, and charged the hour.
    const evening = straight.midnight + 18 * MS_HOUR;
    for (const one of [straight, broken, own]) one.sim.advanceTo(evening, { stopOnPlayerRequired: true });
    expect(broken.sim.player.awakeSince).toBe(straight.sim.player.awakeSince);
    expect(broken.sim.player.wellbeing.condition).toBe(straight.sim.player.wellbeing.condition);
    expect(broken.sim.player.wellbeing.morale).toBe(straight.sim.player.wellbeing.morale);
    expect(broken.sim.player.wellbeing.energy).toBeCloseTo(straight.sim.player.wellbeing.energy - 3, 1);
    expect(own.sim.player.lastSleptAt).toBe(own.target);

    // Carried on to somewhere still in the night's first hour, it is what the
    // skip would have been: the night stays owed, to be paid when the clock
    // goes on, not paid for the fifty minutes the skip would have carried.
    const short = rested('a-call-on-a-short-skip');
    short.onSchedule('test.call', () => undefined);
    short.advanceTo(next(short, 23) + 30 * MS_MINUTE);
    const midnight = next(short, 0);
    short.schedule({ at: midnight + 20 * MS_MINUTE, kind: 'test.call', label: 'A Call', category: 'personal', requiresPlayer: true });
    const stopped = short.advanceTo(midnight + 50 * MS_MINUTE, { stopOnPlayerRequired: true });
    expect(stopped.interruptedBy?.kind).toBe('test.call');
    short.advanceTo(midnight + 50 * MS_MINUTE, { stopOnPlayerRequired: true, resumes: stopped.sentFrom });
    expect(short.player.nightOwedFrom).toBe(midnight);
    expect(short.player.lastSleptAt).toBeLessThan(midnight);
  });

  it('charges the time in bed before the stop to a player who keeps them up in a night not yet paid', () => {
    // Forfeit, the night reads as for a player who kept them up from the
    // start. The stretch from midnight to the stop was left uncharged at
    // first, as well as unpaid, and the two read the same only where the
    // next night reached the ceiling autopilot stops at and hid it: kept up
    // to half past six after a stop at half past twelve, a save played on
    // autopilot read 62.53 by six in the evening, where no stop read 60.86.
    for (const [seed, played] of [['kept-from-the-start', false], ['kept-on-autopilot', true]] as const) {
      const make = () => {
        const sim = played ? quickSave({}, seed) : rested(seed);
        if (played) for (let day = 0; day < 5; day += 1) sim.advanceTo(next(sim, 7), { stopOnPlayerRequired: true });
        sim.advanceTo(next(sim, 23) + 30 * MS_MINUTE);
        return { sim, midnight: next(sim, 0) };
      };
      const stopped = make();
      const kept = make();
      const sixThirty = stopped.midnight + 6.5 * MS_HOUR;
      stopped.sim.advanceTo(stopped.midnight + 31 * MS_MINUTE);
      expect(stopped.sim.player.nightOwedFrom, seed).toBe(stopped.midnight);
      for (const one of [stopped, kept]) {
        while (one.sim.now < sixThirty) one.sim.advanceTo(Math.min(sixThirty, one.sim.now + MS_HOUR));
        one.sim.advanceTo(one.midnight + 18 * MS_HOUR);
      }
      expect(stopped.sim.player.lastSleptAt, seed).toBe(sixThirty);
      // Charged in two pieces where the player kept them up in one, so equal
      // to the last few digits a float carries, not to the bit.
      for (const [key, value] of Object.entries(kept.sim.player.wellbeing)) {
        expect(stopped.sim.player.wellbeing[key as keyof Wellbeing], `${seed}: ${key}`).toBeCloseTo(value, 9);
      }
    }
  });

  it('forfeits a night not yet paid to live play as well as to One Hour', () => {
    // Play moves the clock a second a tick. A forfeit that only a longer move
    // made, or only one past the night's first hour, passed every test.
    const sim = rested('kept-up-by-play');
    sim.advanceTo(next(sim, 23) + 30 * MS_MINUTE);
    const midnight = next(sim, 0);
    sim.advanceTo(midnight + 31 * MS_MINUTE);
    expect(sim.player.nightOwedFrom).toBe(midnight);
    sim.advanceBy(1000, { stopOnPlayerRequired: true });
    expect(sim.player.nightOwedFrom).toBeUndefined();
    for (let second = 1; second < 60; second += 1) sim.advanceBy(1000, { stopOnPlayerRequired: true });
    const left = sim.now;
    sim.advanceTo(midnight + 18 * MS_HOUR);
    expect(sim.player.lastSleptAt).toBe(left);
  });

  it('drains a save from before 88 by the debt it woke with, through a night put to bed and not paid', () => {
    // Such a save works out the debt it woke with from the hours it has been
    // up, until its first wake writes it down. Put to bed from midnight by a
    // jump that stops too soon to pay the night, it would count its hours up
    // from where the jump stopped instead, and drain from the whole day's
    // debt as if it had woken owing it.
    const [kept, before88] = [rested('from-before-88'), rested('from-before-88')];
    delete before88.player.wokeWithDebt;
    for (const sim of [kept, before88]) {
      sim.advanceTo(next(sim, 23) + 30 * MS_MINUTE);
      const noon = next(sim, 12);
      sim.advanceTo(next(sim, 0) + 31 * MS_MINUTE);
      while (sim.now < noon) sim.advanceTo(Math.min(noon, sim.now + MS_HOUR));
    }
    expect(kept.player.wellbeing.sleepDebt).toBeGreaterThan(4);
    for (const [key, value] of Object.entries(kept.player.wellbeing)) {
      expect(before88.player.wellbeing[key as keyof Wellbeing], key).toBeCloseTo(value, 9);
    }
  });

  it('puts nobody to bed once a sound sleeper would be up, however long they would lie in', () => {
    // A light sleeper's lie-in is part of the night they get once in bed, not
    // more time in which to start one.
    const sim = quickSave({ personalityTraits: ['light_sleeper'] }, 'light-window');
    const eight = next(sim, 0) + 8 * MS_HOUR;
    while (sim.now < eight) sim.advanceTo(Math.min(eight, sim.now + MS_HOUR));
    const { sound, hours } = unattendedNight(sim.player);
    expect(sound).toBeLessThan(8);
    expect(hours).toBeGreaterThan(8);
    const slept = sim.player.lastSleptAt;
    sim.advanceTo(eight + 12 * MS_HOUR);
    expect(sim.player.lastSleptAt).toBe(slept);
  });

  it('puts nobody to bed in the day, even after a night kept up', () => {
    // A night nobody chose starts before a sound sleeper would be up from
    // it. Kept up all night and then skipped from nine, they stay up.
    const sim = rested('kept-up');
    sim.advanceTo(next(sim, 23));
    const nine = next(sim, 9);
    while (sim.now < nine) sim.advanceTo(Math.min(nine, sim.now + MS_HOUR));
    const slept = sim.player.lastSleptAt;
    sim.advanceTo(nine + 12 * MS_HOUR);
    expect(sim.player.lastSleptAt).toBe(slept);
  });

  it('sleeps somebody until what stops the clock for the player, has them up for it, and back to bed after', () => {
    // Sent on to the morning with something in the small hours: they sleep
    // until it and are up for it, and the rest of the skip puts them back to
    // bed without crediting the night twice. The rule first asked for five
    // hours and twenty-four minutes of night ahead of the clock, and a stop
    // from two to five left two pieces too short to sleep in: this save was
    // at 28 by seven, and somebody on autopilot sent on at ten was at 4.0.
    // Then the stop's night was the night slept, and they were up from the
    // call to the next midnight.
    for (const hour of [2, 3, 4, 5]) {
      const sim = rested(`stopped-for-${hour}`);
      sim.onSchedule('test.call', () => undefined);
      const midnight = next(sim, 0);
      const call = midnight + hour * MS_HOUR;
      const seven = midnight + 7 * MS_HOUR;
      sim.schedule({ at: call, kind: 'test.call', label: 'A Call', category: 'personal', requiresPlayer: true });
      expect(sim.advanceTo(seven, { stopOnPlayerRequired: true }).interruptedBy?.kind).toBe('test.call');
      expect(sim.now).toBe(call);
      expect(sim.player.lastSleptAt, `at ${hour}`).toBe(midnight);
      expect(sim.player.awakeSince, `at ${hour}`).toBe(call);
      const ends = sim.player.nightEndsAt!;
      expect(ends, `at ${hour}`).toBeGreaterThan(seven);
      sim.advanceTo(seven, { stopOnPlayerRequired: true });
      expect(sim.player.lastSleptAt, `at ${hour}`).toBe(midnight);
      // Asleep again from the call to the stop, and charged nothing for it.
      expect(sim.player.awakeSince, `at ${hour}`).toBe(seven);
      expect(sim.player.wellbeing.hygiene, `at ${hour}`).toBe(82);
      expect(sim.player.wellbeing.energy, `at ${hour}`).toBe(74);
      // And seven is a stop like any other: carried on from it, they are in
      // bed until the night would have ended.
      expect(sim.player.nightEndsAt, `at ${hour}`).toBe(ends);
      sim.advanceTo(seven + 12 * MS_HOUR, { stopOnPlayerRequired: true });
      expect(sim.player.awakeSince, `at ${hour}`).toBe(ends);
      expect(sim.player.nightEndsAt, `at ${hour}`).toBeUndefined();
    }
  });

  it('pays a sleep chosen in the middle of a night nobody chose that is paid already on top of it, and puts them back to bed after', () => {
    // Up for a call at half past one, an hour's sleep, and on to seven: the
    // night was paid at midnight, the hour is paid on top, and the rest of
    // the skip has them in bed until the night would have ended. Dropped at
    // the chosen sleep, the night left them up from half past two.
    const sim = rested('a-nap-in-the-night');
    sim.onSchedule('test.call', () => undefined);
    const midnight = next(sim, 0);
    const call = midnight + 90 * MS_MINUTE;
    const seven = midnight + 7 * MS_HOUR;
    sim.schedule({ at: call, kind: 'test.call', label: 'A Call', category: 'personal', requiresPlayer: true });
    expect(sim.advanceTo(seven, { stopOnPlayerRequired: true }).interruptedBy?.kind).toBe('test.call');
    const ends = sim.player.nightEndsAt!;
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 1 } }).ok).toBe(true);
    expect(sim.player.nightEndsAt).toBe(ends);
    sim.advanceTo(seven, { stopOnPlayerRequired: true });
    expect(sim.player.awakeSince).toBe(seven);
    expect(sim.player.wellbeing.hygiene).toBe(82);
    expect(sim.player.wellbeing.energy).toBeGreaterThan(80);
  });

  it('sleeps the same night however many times something stops the clock in it, and whenever', () => {
    // Nothing, a call on the stroke of one, a second past it, and two calls.
    // A stop an hour into the night or sooner leaves the night to be paid
    // when the clock goes on, from midnight; one later finds it paid. Either
    // way seven finds the night that nothing stopped. The stop on the stroke
    // of one used to put the night off to one, a late night and a poorer one.
    const atSeven = (calls: number[]) => {
      const sim = rested(`calls-${calls.join('-')}`);
      sim.onSchedule('test.call', () => undefined);
      const midnight = next(sim, 0);
      const seven = midnight + 7 * MS_HOUR;
      for (const at of calls) {
        sim.schedule({ at: midnight + at, kind: 'test.call', label: 'A Call', category: 'personal', requiresPlayer: true });
      }
      const paid: boolean[] = [];
      while (sim.advanceTo(seven, { stopOnPlayerRequired: true }).interruptedBy) {
        paid.push(sim.player.lastSleptAt === midnight);
        // Up for the call, and nothing more: the night is still there to go
        // back to.
        expect(sim.player.awakeSince).toBe(sim.now);
        expect(sim.player.nightEndsAt).toBeGreaterThan(seven);
      }
      expect(sim.player.lastSleptAt).toBe(midnight);
      expect(sim.player.awakeSince).toBe(seven);
      return { paid, wellbeing: sim.player.wellbeing };
    };
    const none = atSeven([]);
    expect(none.paid).toEqual([]);
    for (const [calls, paid] of [
      [[MS_HOUR], [false]],
      [[MS_HOUR + 1000], [true]],
      [[2 * MS_HOUR, 4 * MS_HOUR], [true, true]],
      [[30 * MS_MINUTE, 3 * MS_HOUR], [false, true]],
    ] as const) {
      const run = atSeven([...calls]);
      expect(run.paid, `${calls}`).toEqual(paid);
      expect(run.wellbeing, `${calls}`).toEqual(none.wellbeing);
    }
  });

  it('sleeps somebody skipped straight to something in the small hours until it', () => {
    // Next Event from ten at night to a five o'clock start.
    const sim = rested('skipped-to-five');
    sim.onSchedule('test.call', () => undefined);
    sim.advanceTo(next(sim, 22));
    const midnight = next(sim, 0);
    const five = midnight + 5 * MS_HOUR;
    sim.schedule({ at: five, kind: 'test.call', label: 'An Early Start', category: 'personal', requiresPlayer: true });
    expect(sim.advanceTo(five, { stopOnPlayerRequired: true }).interruptedBy?.kind).toBe('test.call');
    expect(sim.player.lastSleptAt).toBe(midnight);
    expect(sim.player.awakeSince).toBe(five);
    expect(sim.player.wellbeing.energy).toBe(74);
  });

  it('keeps what they had when a night nobody chose starts over the ceiling autopilot stops at', () => {
    // Asleep at six in the evening for five and a half hours, then sent on to
    // the morning: the night nobody chose at midnight took energy from 98.5
    // down to the 74 coasting is held under. The ceiling is on what the
    // night gives.
    const sim = rested('over-the-ceiling');
    sim.advanceTo(next(sim, 18));
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 5.5 } }).ok).toBe(true);
    const midnight = next(sim, 0);
    const looks: number[] = [];
    sim.onSchedule('test.look', (_item, s) => { looks.push(s.player.wellbeing.energy); });
    for (const at of [midnight - 1000, midnight + 1000]) {
      sim.schedule({ at, kind: 'test.look', label: 'A Look', category: 'system' });
    }
    sim.advanceTo(next(sim, 7), { stopOnPlayerRequired: true });
    expect(sim.player.lastSleptAt).toBe(midnight);
    expect(looks[0]).toBeGreaterThan(98);
    expect(looks[1]).toBeCloseTo(looks[0]!, 2);
  });

  it('holds the debt short nights leave, night after short night', () => {
    // A night under six hours adds 1.35 hours of debt for each hour it falls
    // short. Short night after short night added it again every time once
    // nothing pulled the debt back to sixty, and two-hour nights left 379.4
    // owed by the ninetieth. Past the ceiling waking runs it up to, a short
    // night leaves at most its own shortfall's worth above it.
    const sim = quickSave({}, 'short-nights');
    let most = 0;
    for (let night = 0; night < 90; night += 1) {
      const five = next(sim, 5);
      while (sim.now < five) sim.advanceTo(Math.min(five, sim.now + MS_HOUR));
      expect(sim.execute({ kind: 'life.sleep', payload: { hours: 2 } }).ok).toBe(true);
      most = Math.max(most, sim.player.wellbeing.sleepDebt);
    }
    expect(most).toBeGreaterThan(60);
    expect(most).toBeLessThanOrEqual(60 + (6 - 2) * 1.35 + 1e-9);
    // And the hold never takes debt off: a night just short of six, after a
    // nap has run the debt over the ceiling and its shortfall, leaves what
    // the night itself cleared.
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 0.5 } }).ok).toBe(true);
    const before = sim.player.wellbeing.sleepDebt;
    const night = sim.execute<{ quality: number }>({ kind: 'life.sleep', payload: { hours: 5.9 } });
    expect(night.ok, night.error).toBe(true);
    expect(before - 5.9 * night.value!.quality * 1.4).toBeGreaterThan(60 + (6 - 5.9) * 1.35);
    expect(sim.player.wellbeing.sleepDebt).toBeCloseTo(before - 5.9 * night.value!.quality * 1.4, 9);
  });

  it('says when a short sleep, under six hours, would be tonight’s night', () => {
    // A sleep the player chooses is the night of the day it ends in. The
    // Sleep dialog suggested three hours at half past eleven before a call at
    // three, and taken, they were up from half past two, at energy 10.9 and a
    // debt of 13.15 by eleven the next night, where moving the clock on
    // instead left 28.4 and 5.17. The dialog says so.
    const sim = rested('tonights-night');
    sim.onSchedule('test.call', () => undefined);
    sim.advanceTo(next(sim, 23) + 30 * MS_MINUTE);
    const midnight = next(sim, 0);
    sim.schedule({ at: midnight + 3 * MS_HOUR, kind: 'test.call', label: 'An Early Call', category: 'personal', requiresPlayer: true });
    // Two hours, keeping the hour and a half to get up and there: it was three until 2026-09-28, never less, which slept through a call under four and a half hours off.
    expect(suggestedSleep(sim).hours).toBe(2);
    expect(sleepStandsForTheNight(sim, 2)).toBe(true);
    expect(sleepStandsForTheNight(sim, 3)).toBe(true);
    // Six hours is not a short night, and a whole one is the night whenever
    // it ends.
    expect(sleepStandsForTheNight(sim, 6)).toBe(false);
    expect(sleepStandsForTheNight(sim, 5.5)).toBe(true);
    // And an evening nap ends before the night.
    const evening = rested('an-evening-nap');
    evening.advanceTo(next(evening, 20));
    expect(sleepStandsForTheNight(evening, 3)).toBe(false);
    expect(sleepStandsForTheNight(evening, 5)).toBe(true);
    // Nor is a nap the morning after a night kept up: that night is over.
    const morning = rested('a-morning-nap');
    const nine = next(morning, 9) + MS_DAY;
    while (morning.now < nine) morning.advanceTo(Math.min(nine, morning.now + MS_HOUR));
    expect(morning.player.lastSleptAt).toBeLessThan(startOfLocalDay(morning));
    expect(sleepStandsForTheNight(morning, 2)).toBe(false);

    // Taken, it is the night, and the rest of the skip leaves them up.
    const slept = rested('tonights-night');
    slept.onSchedule('test.call', () => undefined);
    slept.advanceTo(next(slept, 23) + 30 * MS_MINUTE);
    slept.schedule({ at: midnight + 3 * MS_HOUR, kind: 'test.call', label: 'An Early Call', category: 'personal', requiresPlayer: true });
    expect(slept.execute({ kind: 'life.sleep', payload: { hours: 3 } }).ok).toBe(true);
    // Another after it is not: the night is already the one they chose.
    expect(sleepStandsForTheNight(slept, 2)).toBe(false);
    while (slept.advanceTo(midnight + 7 * MS_HOUR, { stopOnPlayerRequired: true }).interruptedBy);
    slept.advanceTo(midnight + 12 * MS_HOUR);
    expect(slept.player.awakeSince).toBe(midnight + 2.5 * MS_HOUR);

    // Once the night is slept, a nap in it is not.
    expect(sim.advanceTo(midnight + 7 * MS_HOUR, { stopOnPlayerRequired: true }).interruptedBy?.label).toBe('An Early Call');
    expect(sim.player.lastSleptAt).toBe(midnight);
    expect(sleepStandsForTheNight(sim, 1)).toBe(false);

    // Nor while one is under way and not yet paid, woken by a call half an
    // hour into it: sent on after the sleep, the night is paid after it, and
    // they are in bed until it would have ended. The night is paid from its
    // bedtime and stops at the ceiling autopilot does, so it keeps the more
    // of what the sleep and the night give, not both: a nap too short to pass
    // that ceiling puts nothing back and costs what a short sleep costs.
    const woken = (seed: string, hours: number) => {
      const sim = rested(seed);
      sim.onSchedule('test.call', () => undefined);
      sim.advanceTo(next(sim, 23) + 30 * MS_MINUTE);
      sim.schedule({ at: midnight + 30 * MS_MINUTE, kind: 'test.call', label: 'A Late Call', category: 'personal', requiresPlayer: true });
      expect(sim.advanceTo(midnight + 7 * MS_HOUR, { stopOnPlayerRequired: true }).interruptedBy?.label).toBe('A Late Call');
      expect(sim.player.nightOwedFrom).toBe(midnight);
      expect(sleepStandsForTheNight(sim, 3)).toBe(false);
      const ends = sim.player.nightEndsAt;
      if (hours > 0) expect(sim.execute({ kind: 'life.sleep', payload: { hours } }).ok).toBe(true);
      // A sleep of an hour is a move of an hour, which the rule would take
      // for the player's own, but asleep in it they have not kept them up.
      expect(sim.player.nightOwedFrom, `${hours} h`).toBe(midnight);
      expect(sim.player.nightEndsAt, `${hours} h`).toBe(ends);
      sim.advanceTo(midnight + 7 * MS_HOUR);
      expect(sim.player.lastSleptAt, `${hours} h`).toBe(midnight);
      return sim;
    };
    const none = woken('woken-in-the-first-hour', 0);
    const nap = woken('woken-in-the-first-hour', 1);
    const three = woken('woken-in-the-first-hour', 3);
    expect(nap.player.wellbeing.energy).toBe(none.player.wellbeing.energy);
    expect(nap.player.wellbeing.sleepDebt).toBeGreaterThan(none.player.wellbeing.sleepDebt);
    expect(three.player.wellbeing.energy).toBeGreaterThan(none.player.wellbeing.energy);
    three.advanceTo(midnight + 12 * MS_HOUR);
    expect(three.player.awakeSince).toBeGreaterThan(midnight + 7 * MS_HOUR);
  });

  it('gives no night nobody chose on the way to a night booked for the morning', () => {
    // The night is on record from the booking, so the midnight between the
    // booking and the bedtime sees it. Put on record only as the night
    // begins, the ten hours up to a six o'clock bedtime would carry them
    // through a night of their own first.
    const sim = rested('booked-late');
    sim.advanceTo(next(sim, 20));
    const six = next(sim, 6);
    const awake: number[] = [];
    sim.onSchedule('test.look', (_item, s) => { awake.push(s.player.awakeSince!); });
    sim.schedule({ at: six - MS_HOUR, kind: 'test.look', label: 'A Look', category: 'system' });
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8, startAt: six } }).ok).toBe(true);
    expect(awake[0]).toBeLessThanOrEqual(six - MS_HOUR);
    expect(sim.player.lastSleptAt).toBe(six + 8 * MS_HOUR);
  });
});

describe('skip to event', () => {
  it('shows what would be crossed and missed before committing', () => {
    const sim = quickSave();
    // Nothing in the world books the player any more, so the commitments
    // being inspected are put on the calendar here.
    sim.onSchedule('test.meeting', () => {});
    sim.onSchedule('test.other', () => {});
    sim.schedule({ at: sim.now + 3 * MS_DAY, kind: 'test.meeting', label: 'A Meeting', category: 'personal', requiresPlayer: true });
    sim.schedule({ at: sim.now + 9 * MS_DAY, kind: 'test.other', label: 'Something Else', category: 'personal' });
    const targets = skipTargets(sim, 5);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(target.item.at).toBeGreaterThan(sim.now);
      // Nothing in the crossed list is after the target itself.
      for (const crossed of target.crossed) expect(crossed.at).toBeLessThan(target.item.at);
      expect(target.missed.every((m) => m.requiresPlayer)).toBe(true);
    }
  });

  it('does not mutate anything when only inspecting targets', () => {
    const sim = quickSave();
    const before = sim.now;
    const transactions = sim.universe.transactions.length;
    skipTargets(sim, 10);
    expect(sim.now).toBe(before);
    expect(sim.universe.transactions.length).toBe(transactions);
  });

  it('processes the skipped interval rather than just moving the clock', () => {
    const sim = quickSave();
    const target = skipTargets(sim, 20).find((t) => t.daysAway > 10);
    if (!target) return;
    const before = sim.universe.transactions.length;
    sim.advanceTo(target.item.at);
    expect(sim.universe.transactions.length).toBeGreaterThanOrEqual(before);
    expect(sim.now).toBe(target.item.at);
  });
});

describe('the calendar', () => {
  it('flags two commitments that overlap', () => {
    const sim = quickSave();
    sim.onSchedule('test.commitment', () => undefined);
    const at = sim.now + 3 * MS_DAY;
    sim.schedule({
      at, kind: 'test.commitment', label: 'Audition', category: 'career',
      requiresPlayer: true, durationMinutes: 120,
    });
    sim.schedule({
      at: at + 30 * MS_MINUTE, kind: 'test.commitment', label: 'Shift', category: 'work',
      requiresPlayer: true, durationMinutes: 120,
    });

    const conflicts = checkConflicts(sim, at + 30 * MS_MINUTE, 120);
    expect(conflicts.length).toBeGreaterThan(0);

    const entries = entriesBetween(sim, at - MS_HOUR, at + 6 * MS_HOUR);
    expect(entries.filter((e) => e.conflicted).length).toBeGreaterThanOrEqual(2);
  });

  it('does not treat back-to-back commitments as a collision', () => {
    // The only commitments are the test's own.
    const sim = quickSave({});
    sim.onSchedule('test.back_to_back', () => undefined);
    const at = sim.now + 5 * MS_DAY;
    sim.schedule({
      at, kind: 'test.back_to_back', label: 'First', category: 'career',
      requiresPlayer: true, durationMinutes: 60,
    });
    expect(checkConflicts(sim, at + 60 * MS_MINUTE, 60)).toHaveLength(0);
  });

  it('builds a month grid that always covers whole weeks', () => {
    const sim = quickSave();
    for (const month of [1, 2, 6, 12]) {
      const grid = monthGrid(sim, 2026, month);
      expect(grid.length % 7).toBe(0);
      expect(grid.filter((d) => d.inMonth).length).toBeGreaterThan(27);
      expect(grid[0]?.weekday).toBe(0);
    }
  });

  it('marks a leap day as in-month', () => {
    const sim = quickSave();
    const grid = monthGrid(sim, 2028, 2);
    expect(grid.filter((d) => d.inMonth)).toHaveLength(29);
  });
});

describe('commands', () => {
  it('rolls back completely when a command fails part-way', () => {
    const sim = quickSave();
    const accounts = sim.ledger.accountsOf(sim.player.id).length;
    const transactions = sim.universe.transactions.length;
    const now = sim.now;
    const energy = sim.player.wellbeing.energy;

    // A night that starts before the world does.
    const result = sim.execute({ kind: 'life.sleep', payload: { hours: 8, startAt: sim.now - MS_DAY } });
    expect(result.ok).toBe(false);

    // No moved clock, no orphan account, no orphan transaction, no half-slept night.
    expect(sim.now).toBe(now);
    expect(sim.player.wellbeing.energy).toBe(energy);
    expect(sim.ledger.accountsOf(sim.player.id)).toHaveLength(accounts);
    expect(sim.universe.transactions.length).toBe(transactions);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('rejects an unknown command instead of failing silently', () => {
    const sim = quickSave();
    const result = sim.execute({ kind: 'does.not.exist', payload: {} });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unknown command/);
  });

  it('surfaces a readable reason when a command is refused', () => {
    const sim = quickSave();
    const result = sim.execute({ kind: 'life.sleep', payload: { hours: 8, startAt: sim.now - MS_DAY } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/can’t go to sleep in the past/);
  });
});

describe('migrations and validation', () => {
  it('leaves a current save alone', () => {
    const sim = quickSave();
    const result = migrate(sim.universe);
    expect(result.migrated).toBe(false);
    expect(result.problems).toEqual([]);
  });

  it('refuses a save from a newer build rather than damaging it', () => {
    const sim = quickSave();
    sim.universe.meta.schemaVersion = SAVE_SCHEMA_VERSION + 5;
    const result = migrate(sim.universe);
    expect(result.migrated).toBe(false);
    expect(result.problems[0]).toMatch(/newer version/);
  });


  it('sheds at 91 what only the home, the career and a move home reached, keeping a rent paid ahead and the rest', () => {
    const sim = quickSave();
    const universe = JSON.parse(JSON.stringify(sim.universe)) as typeof sim.universe;
    universe.meta.schemaVersion = 90;
    const player = universe.people[universe.playerId]!;
    // Test setup: what a save at 90 kept on its player.
    Object.assign(player.payments as object, { rent: 'check', bills: 'card', checks: [], checkbookBought: true, rentCredit: 500_00 });
    Object.assign(player.health as object, { sag: { from: 0, until: 1 }, cobraOffer: { plan: 'sag', lostAt: 0, until: 1 }, lastUnion: 'sag' });
    Object.assign(player.attrs as object, { reputation: 12, recognition: 3 });
    Object.assign(player as object, { returnedHomeAt: 0, mobility: 'wheelchair', parkingPermit: { cityId: 'us-ny-newyork', at: 0 } });
    const year = Object.values(player.earnings?.years ?? {})[0] ?? ((player.earnings ??= { years: {}, quarters: {}, equityWeeks: [], months: {}, ukYears: {} }).years[2026] = { acting: 0, sag: 0, workStudy: 0, unemployment: 0, withheld: 0, commission: 0, dues: 0, employers: {}, byResidence: {}, elsewhere: {}, foreign: {} } as never);
    Object.assign(year as object, { homeInterest: 100_00, rentalRent: 50_00, farmRent: 1_00 });
    const presence = player.attrs!.presence;

    const result = migrate(universe);

    expect(result.migrated).toBe(true);
    expect(result.problems).toEqual([]);
    for (const k of ['rent', 'bills', 'checks', 'checkbookBought']) expect(k in player.payments!).toBe(false);
    expect((player.payments as unknown as { rentCredit?: number }).rentCredit).toBe(500_00);
    for (const k of ['sag', 'cobraOffer', 'lastUnion']) expect(k in player.health!).toBe(false);
    expect(player.attrs).toEqual({ presence, composure: player.attrs!.composure });
    for (const k of ['returnedHomeAt', 'mobility', 'parkingPermit']) expect(k in player).toBe(false);
    for (const k of ['homeInterest', 'rentalRent', 'farmRent']) expect(k in (year as object)).toBe(false);
    expect(universe.meta.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    // Opened, the rent paid ahead comes back, and the ledger balances.
    const opened = loadSave(universe);
    expect('rentCredit' in (opened.player.payments as object)).toBe(false);
    expect(opened.ledger.audit()).toEqual([]);
    expect(validateUniverse(opened.universe).ok).toBe(true);
  });

  it('drops the heritage and the height and weight a save no longer reads', () => {
    const sim = quickSave();
    sim.universe.meta.schemaVersion = 72;
    const player = sim.universe.people[sim.universe.playerId]!;
    const row = player as unknown as Record<string, unknown>;
    row.heritageId = 'english';
    row.parentHeritageIds = ['english', 'irish'];
    row.adultHeightCm = 175;
    row.adultWeightKg = 72;

    const result = migrate(sim.universe);

    expect(result.migrated).toBe(true);
    expect(row.heritageId).toBeUndefined();
    expect(row.parentHeritageIds).toBeUndefined();
    expect(row.adultHeightCm).toBeUndefined();
    expect(row.adultWeightKg).toBeUndefined();
    expect('heritageId' in row).toBe(false);
    // The rest of the person is untouched.
    expect(player.displayName).toBe(sim.universe.people[sim.universe.playerId]!.displayName);
    expect(validateUniverse(sim.universe).ok).toBe(true);
  });

  it('keeps the title a save from before 80 was made with, and names the slot by it', () => {
    const sim = quickSave({ pronouns: 'they/them', performerTitle: 'actress' }, 'title-79');
    const universe = sim.universe;
    universe.meta.schemaVersion = 79;
    const row = universe.people[universe.playerId] as unknown as Record<string, unknown>;
    row.careerTrack = 'actor';
    // The film career named the slot, and the summary carried its own copy.
    universe.meta.careerLabel = 'Writer';
    (universe.meta as unknown as Record<string, unknown>).performerTitle = 'actress';

    const result = migrate(universe);

    expect(result.migrated).toBe(true);
    expect(row.performerTitle).toBe('actress');
    expect('careerTrack' in row).toBe(false);
    expect(universe.meta.careerLabel).toBe('Actress');
    expect('performerTitle' in universe.meta).toBe(false);
    expect(result.steps.join(' ')).not.toMatch(/a title from their pronouns/);
    expect(validateUniverse(universe).ok).toBe(true);
  });

  it('gives a save written under 80 a title from its pronouns', () => {
    for (const [pronouns, title, word] of [
      ['she/her', 'actress', 'Actress'], ['he/him', 'actor', 'Actor'], ['they/them', 'actor', 'Actor'],
    ] as const) {
      const sim = quickSave({ pronouns }, `title-80-${pronouns}`);
      const universe = sim.universe;
      universe.meta.schemaVersion = 80;
      // 80 shed the title and left the career line empty.
      delete (universe.people[universe.playerId] as unknown as Record<string, unknown>).performerTitle;
      universe.meta.careerLabel = '';

      const result = migrate(universe);

      expect(result.migrated).toBe(true);
      expect(universe.people[universe.playerId]!.performerTitle, pronouns).toBe(title);
      expect(universe.meta.careerLabel, pronouns).toBe(word);
      expect(result.steps.join(' ')).toMatch(/Gave 1 person a title from their pronouns/);
      expect(validateUniverse(universe).ok).toBe(true);
    }
  });

  it('takes the player’s pick back from the premise record an 80 save still carries', () => {
    const sim = quickSave({ pronouns: 'they/them', performerTitle: 'actress' }, 'title-80-premise');
    const universe = sim.universe;
    universe.meta.schemaVersion = 80;
    // A save made under 79 and brought up to 80: the title shed from the
    // person, and the premise record left behind with the pick in it.
    const row = universe.people[universe.playerId] as unknown as Record<string, unknown>;
    delete row.performerTitle;
    universe.meta.careerLabel = '';
    (universe as unknown as Record<string, unknown>).premise = {
      kind: 'actor-actress-life-simulator', playerTitle: 'actress', playerTitleSource: 'stated',
    };

    const result = migrate(universe);

    expect(row.performerTitle).toBe('actress');
    expect(universe.meta.careerLabel).toBe('Actress');
    expect(result.steps.join(' ')).toMatch(/title the save recorded/);
    expect(result.steps.join(' ')).not.toMatch(/from their pronouns/);

    // A premise naming neither word is no help, and the pronouns decide.
    const other = quickSave({ pronouns: 'they/them', performerTitle: 'actress' }, 'title-80-bad-premise');
    other.universe.meta.schemaVersion = 80;
    delete (other.universe.people[other.universe.playerId] as unknown as Record<string, unknown>).performerTitle;
    (other.universe as unknown as Record<string, unknown>).premise = { playerTitle: 'star' };
    migrate(other.universe);
    expect(other.universe.people[other.universe.playerId]!.performerTitle).toBe('actor');
  });

  it('charges a save from before 88 from the next midnight, not twice for the rest of today', () => {
    // At 87 this afternoon would never be charged: a save's first day is not,
    // and a later day was charged by the midnight before it.
    const sim = quickSave({}, 'before-88');
    sim.advanceTo(sim.now + 6.5 * MS_HOUR);
    sim.universe.meta.schemaVersion = 87;
    delete sim.player.awakeSince;
    const midnight = nextMidnight(sim);
    migrate(sim.universe);
    const loaded = loadSave(sim.universe);
    expect(loaded.player.awakeSince).toBe(midnight);
    const energy = loaded.player.wellbeing.energy;
    loaded.advanceTo(midnight - MS_MINUTE);
    expect(loaded.player.wellbeing.energy).toBe(energy);
  });

  it('still gives a save from before 88 left on autopilot its night at the first midnight', () => {
    // Its waking day is counted from that midnight, which reads the same as a
    // night that ends there, and a night nobody chose must still come then:
    // its last one was the midnight before. A check that took a waking day
    // starting at midnight for somebody still asleep skipped that night, and
    // by eleven the save was at energy 0.
    const sim = quickSave({}, 'before-88-alone');
    const before = next(sim, 0);
    sim.advanceTo(before + 15 * MS_HOUR);
    expect(sim.player.lastSleptAt).toBe(before);
    sim.universe.meta.schemaVersion = 87;
    delete sim.player.awakeSince;
    const universe = JSON.parse(JSON.stringify(sim.universe));
    migrate(universe);
    const loaded = loadSave(universe);
    const midnight = nextMidnight(loaded);
    loaded.advanceTo(midnight + 23 * MS_HOUR);
    expect(loaded.player.lastSleptAt).toBe(midnight);
    expect(loaded.player.awakeSince).toBeGreaterThanOrEqual(midnight + 5.4 * MS_HOUR);
    expect(loaded.player.awakeSince).toBeLessThanOrEqual(midnight + 8.4 * MS_HOUR);
    expect(loaded.player.wellbeing.energy).toBeGreaterThan(20);
  });

  it('puts nobody from before 88 to bed while the day they are in is paid for', () => {
    // Saved in the small hours with no night since the midnight before, the
    // rest of that day was charged at that midnight. A night given on the
    // skip would start their waking day again at its wake and charge the
    // rest of the day twice.
    const sim = quickSave({}, 'before-88-small-hours');
    sim.advanceTo(next(sim, 23));
    const three = next(sim, 3);
    while (sim.now < three) sim.advanceTo(Math.min(three, sim.now + MS_HOUR));
    sim.universe.meta.schemaVersion = 87;
    delete sim.player.awakeSince;
    const universe = JSON.parse(JSON.stringify(sim.universe));
    migrate(universe);
    const loaded = loadSave(universe);
    const midnight = nextMidnight(loaded);
    const energy = loaded.player.wellbeing.energy;
    loaded.advanceTo(three + 9 * MS_HOUR);
    expect(loaded.player.awakeSince).toBe(midnight);
    expect(loaded.player.wellbeing.energy).toBe(energy);
  });

  it('re-stamps records that carry the wrong save id', () => {
    const sim = quickSave();
    sim.universe.meta.schemaVersion = 1;
    const person = Object.values(sim.universe.people)[0];
    if (person) person.saveId = 'some-other-save';

    const result = migrate(sim.universe);
    expect(result.steps.some((s) => s.includes('Re-stamped'))).toBe(true);
    expect(validateUniverse(sim.universe).ok).toBe(true);
  });

  it('catches a corrupted universe', () => {
    const sim = quickSave();
    sim.player.primaryAccountId = 'account_does_not_exist';
    const report = validateUniverse(sim.universe);
    expect(report.ok).toBe(false);
    expect(report.errors.some((e) => /does(n’t| not) exist/.test(e))).toBe(true);
  });
});

describe('the decision center', () => {
  it('sorts overdue items above everything else', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 120 * MS_DAY);
    const decisions = openDecisions(sim);
    const firstOverdue = decisions.findIndex((d) => d.dueAt !== undefined && d.dueAt < sim.now);
    const firstNotOverdue = decisions.findIndex((d) => d.dueAt === undefined || d.dueAt >= sim.now);
    if (firstOverdue >= 0 && firstNotOverdue >= 0) {
      expect(firstOverdue).toBeLessThan(firstNotOverdue);
    }
  });

  it('never shows a resolved or dismissed item', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 60 * MS_DAY);
    for (const decision of openDecisions(sim)) {
      expect(decision.resolvedAt).toBeUndefined();
      expect(decision.dismissedAt).toBeUndefined();
    }
  });
});

describe('an older save catches up with the build', () => {


  it('puts labels written by an older build into Title Case', () => {
    const sim = quickSave({}, 'relabel');
    sim.advanceTo(sim.now + 30 * MS_DAY);

    // Wind the save back to how an older build left it: schema behind, and
    // labels in the sentence case that build wrote.
    const universe = sim.universe;
    universe.meta.schemaVersion = 9;
    const item = universe.scheduled.find((s) => s.label.includes(' '));
    expect(item, 'no multi-word label to test with').toBeDefined();
    item!.label = 'New day';
    universe.notifications.push({
      id: 'notice_test', saveId: universe.meta.id, at: universe.now,
      category: 'system', title: 'a scheduled event could not be processed',
      body: 'Something went wrong.', importance: 40, read: false,
    } as (typeof universe.notifications)[number]);

    const result = migrate(universe);
    expect(result.migrated).toBe(true);
    expect(universe.scheduled.find((s) => s.id === item!.id)?.label).toBe('New Day');
    expect(universe.notifications.at(-1)?.title).toBe('A Scheduled Event Could Not Be Processed');
    expect(result.steps.join(' ')).toMatch(/Title Case/);
  });

  it('does not relabel a save that is already current', () => {
    const sim = quickSave({}, 'relabel-current');
    const before = sim.universe.scheduled.map((s) => s.label);
    const result = migrate(sim.universe);
    expect(result.migrated).toBe(false);
    expect(sim.universe.scheduled.map((s) => s.label)).toEqual(before);
  });
});

describe('ids are told apart by namespace', () => {
  // One counter for the whole save made an id in one namespace a function of
  // how much work every other namespace had done — and some of the engine's
  // seeded streams were keyed on an id, so posting a transaction anywhere in
  // the save changed what they drew. It cost six tests across three files
  // once, and an hour each time before it turned out to be this.

  const host = (): { __idCounter: number; __idCounters?: Record<string, number> } =>
    ({ __idCounter: 0, __idCounters: {} });

  it('does not move one namespace because another was used', () => {
    const one = createIdFactory(host() as never);
    expect(one('person')).toBe('person_000001');
    for (let i = 0; i < 50; i += 1) one('txn');
    expect(one('person'), 'fifty transactions moved the next person')
      .toBe('person_000002');
    // Fifty-one of them, counted in its own namespace and written in base 36
    // like every id in the save.
    expect(one('txn')).toBe(`txn_${(51).toString(36).padStart(6, '0')}`);
  });

  it('starts every namespace of a new world at one', () => {
    const next = createIdFactory(host() as never);
    for (const ns of ['person', 'txn', 'notice', 'decision'] as const) {
      expect(next(ns)).toBe(`${ns}_000001`);
    }
  });

  it('never hands the same id out twice, in any order', () => {
    const next = createIdFactory(host() as never);
    const seen = new Set<string>();
    const order = ['person', 'txn', 'person', 'notice', 'txn', 'txn', 'notice', 'person'] as const;
    for (let round = 0; round < 40; round += 1) {
      for (const ns of order) {
        const id = next(ns);
        expect(seen.has(id), `${id} came out twice`).toBe(false);
        seen.add(id);
      }
    }
    expect(seen.size).toBe(order.length * 40);
  });

  it('picks up a save written before the namespaces were told apart', () => {
    // Such a save carries one number that is at or above every id in it, so
    // every namespace has to start there. Anything lower would hand out an id
    // that is already on a record.
    const old = { __idCounter: 42 } as { __idCounter: number };
    const next = createIdFactory(old as never);
    expect(next('person')).toBe(`person_${(43).toString(36).padStart(6, '0')}`);
    expect(next('txn')).toBe(`txn_${(43).toString(36).padStart(6, '0')}`);
    expect(next('notice')).toBe(`notice_${(43).toString(36).padStart(6, '0')}`);
    expect(next('person')).toBe(`person_${(44).toString(36).padStart(6, '0')}`);
  });

  it('goes on counting every id it has issued, which is what an older save starts from', () => {
    const at = host();
    const next = createIdFactory(at as never);
    for (let i = 0; i < 7; i += 1) { next('person'); next('txn'); }
    expect(at.__idCounter).toBe(14);
    // The total is at or above every namespace's own count, and that is exactly
    // the property the pick-up above rests on: a save carrying only this number
    // can start each namespace here without handing out an id twice.
    for (const one of Object.values(at.__idCounters!)) {
      expect(at.__idCounter).toBeGreaterThanOrEqual(one);
    }
  });

  it('never walks a counter backwards when an id is claimed', () => {
    const at = host();
    idAlreadyIssued(at as never, 'person', 5);
    idAlreadyIssued(at as never, 'person', 2);
    expect(createIdFactory(at as never)('person')).toBe('person_000006');
  });

  it('keeps the player out of the way of the next person', () => {
    // `person_000001` is written by hand at boot, before there is a simulation
    // to ask for it.
    const sim = quickSave();
    expect(sim.universe.playerId).toBe('person_000001');
    expect(Object.keys(sim.universe.people)).toContain('person_000001');
    expect(sim.nextId('person')).not.toBe('person_000001');
  });

  it('holds a person still while the ledger fills up', () => {
    // The end of it, on a real save: the same seed, the same world, and one of
    // them posting a hundred transactions nobody asked about.
    const quiet = quickSave({}, 'still');
    const busy = quickSave({}, 'still');
    const account = busy.universe.people[busy.universe.playerId]!.primaryAccountId!;
    for (let i = 0; i < 100; i += 1) busy.post({ memo: 'Something Else Entirely', category: 'other', postings: [{ accountId: account, amount: 1_00 }, { accountId: busy.nominalAccount('income', 'Something Else Entirely').id, amount: -1_00 }] });
    expect(busy.nextId('person')).toBe(quiet.nextId('person'));
    expect(busy.nextId('decision')).toBe(quiet.nextId('decision'));
    expect(busy.nextId('txn')).not.toBe(quiet.nextId('txn'));
  });

  it('declares no namespace the game never asks for a name in', () => {
    // The list is a value rather than a union so `nextId` can walk it, and
    // `tools/wired.mjs` fails the gate on a namespace with no call site.
    expect(new Set(ID_NAMESPACES).size, 'the same noun is in the list twice')
      .toBe(ID_NAMESPACES.length);
  });
});

/**
 * Five home zones go from 23:59:59 straight to one in the morning on the day
 * their clocks go forward, so that day's first instant is one o'clock and its
 * rollover rightly runs then. The next one was armed a day on from it with
 * `addDays`, which keeps the wall-clock hour, so the day after rolled over at
 * one as well, and at 01:01 in Beirut and Cairo, whose days of the jump were
 * taken to start at 01:01: its night nobody chose started then, the hour
 * before it was charged as awake, and the night was read with the late-bedtime
 * penalty. From the day after that it was back at midnight. Measured on
 * autopilot at six the next evening, it cost 0.52 condition and 0.92 morale,
 * which lasted until both reached their ceilings, and left energy 3.01 higher,
 * because the waking day began an hour later.
 */
describe('the rollover where the clocks go forward at midnight', () => {
  /** Where a build before the fix armed the day after's rollover: this many minutes past one. */
  interface Jump { place: string; year: number; month: number; day: number; late?: number }
  const JUMPS: Jump[] = [
    { place: 'cu-02-havana', year: 2026, month: 3, day: 8, late: 0 },
    { place: 'lb-04-beirut', year: 2026, month: 3, day: 29, late: 1 },
    { place: 'cl-12-santiago', year: 2026, month: 9, day: 6, late: 0 },
    { place: 'eg-11-cairo', year: 2026, month: 4, day: 24, late: 1 },
    { place: 'pt-23-pontadelgada', year: 2026, month: 3, day: 29, late: 0 },
  ];

  // The Azores are Portuguese, and a country's towns are loaded when the
  // player picks it.
  beforeAll(() => { addCountryCities('pt', readFileSync('public/geo/pt.tsv', 'utf8')); });

  /** The instant the save's home clock reads `hour` on the day `offset` days from the jump. */
  function wall(sim: Simulation, jump: Jump, offset: number, hour: number, minute = 0): number {
    const d = new Date(Date.UTC(jump.year, jump.month - 1, jump.day + offset));
    return instantFromZoned(
      { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour, minute },
      sim.homeZone,
    );
  }

  /** A save at home in `jump.place`, starting at half past seven `offset` days from the jump. */
  function saveIn(jump: Jump, offset: number): Simulation {
    const d = new Date(Date.UTC(jump.year, jump.month - 1, jump.day + offset));
    const sim = quickSave({
      startYear: d.getUTCFullYear(), startMonth: d.getUTCMonth() + 1, startDay: d.getUTCDate(),
      startLocationId: jump.place,
    }, `spring-${jump.place}`);
    // The zone has to skip that midnight, or none of this tests anything.
    const first = zonedParts(wall(sim, jump, 0, 0), sim.homeZone);
    expect([first.day, first.hour, first.minute], `${jump.place} skips midnight on the ${jump.day}th`).toEqual([jump.day, 1, 0]);
    return sim;
  }

  /** The rollovers run so far and the one armed, as the home clock read them. */
  function rollovers(sim: Simulation): { ran: string[]; armed: string[] } {
    const read = (at: number) => {
      const p = zonedParts(at, sim.homeZone);
      return `${p.month}-${p.day} ${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
    };
    const mine = sim.universe.scheduled.filter((one) => one.kind === 'life.day_rollover');
    return {
      ran: mine.filter((one) => one.status === 'done').map((one) => read(one.resolvedAt ?? one.at)),
      armed: mine.filter((one) => one.status === 'pending').map((one) => read(one.at)),
    };
  }

  /** Moves the armed rollover to `at`, as a build before the fix would have armed it. */
  function armAt(sim: Simulation, at: number): void {
    const armed = sim.universe.scheduled.find((one) => one.kind === 'life.day_rollover' && one.status === 'pending')!;
    expect(sim.timeline.reschedule(armed.id, at)).toBe(true);
  }

  const day = (jump: Jump, offset: number) =>
    new Date(Date.UTC(jump.year, jump.month - 1, jump.day + offset)).getUTCDate();
  const month = (jump: Jump, offset: number) =>
    new Date(Date.UTC(jump.year, jump.month - 1, jump.day + offset)).getUTCMonth() + 1;
  const on = (jump: Jump, offset: number, time: string) => `${month(jump, offset)}-${day(jump, offset)} ${time}`;

  for (const jump of JUMPS) {
    const late = jump.late ?? 0;

    it(`rolls over at one on the day ${jump.place} skips midnight, and at midnight from the next day`, () => {
      const sim = saveIn(jump, -1);
      sim.advanceTo(wall(sim, jump, 1, 12));
      expect(rollovers(sim)).toEqual({
        ran: [on(jump, 0, '01:00'), on(jump, 1, '00:00')],
        armed: [on(jump, 2, '00:00')],
      });
      // The day after's night nobody chose starts at its midnight, not at one.
      expect(sim.player.lastSleptAt).toBe(wall(sim, jump, 1, 0));

      sim.advanceTo(wall(sim, jump, 2, 12));
      expect(rollovers(sim).ran.at(-1)).toBe(on(jump, 2, '00:00'));
      expect(rollovers(sim).armed).toEqual([on(jump, 3, '00:00')]);
    });

    it(`arms a save begun in ${jump.place} on the day of the jump for the next midnight`, () => {
      const sim = saveIn(jump, 0);
      expect(rollovers(sim)).toEqual({ ran: [], armed: [on(jump, 1, '00:00')] });
    });

    it(`arms a save loaded in ${jump.place} on the day of the jump for the next midnight`, () => {
      // A save whose rollover had fallen off, which loadSave puts back.
      const sim = saveIn(jump, -1);
      sim.advanceTo(wall(sim, jump, 0, 12));
      const universe = JSON.parse(JSON.stringify(sim.universe)) as typeof sim.universe;
      universe.scheduled = universe.scheduled.filter((one) => !(one.kind === 'life.day_rollover' && one.status === 'pending'));
      const loaded = loadSave(universe);
      expect(rollovers(loaded).armed).toEqual([on(jump, 1, '00:00')]);
    });

    it(`moves the rollover an earlier build armed late in ${jump.place} back to midnight`, () => {
      // Saved on the day of the jump by a build before the fix, the save
      // carries the next day's rollover at one, or at 01:01.
      const sim = saveIn(jump, -1);
      sim.advanceTo(wall(sim, jump, 0, 12));
      armAt(sim, wall(sim, jump, 1, 1, late));
      const loaded = loadSave(JSON.parse(JSON.stringify(sim.universe)));
      expect(rollovers(loaded).armed).toEqual([on(jump, 1, '00:00')]);
      loaded.advanceTo(wall(loaded, jump, 1, 12));
      expect(rollovers(loaded).ran.at(-1)).toBe(on(jump, 1, '00:00'));
      expect(loaded.player.lastSleptAt).toBe(wall(loaded, jump, 1, 0));
    });

    it(`moves the rollover a save from the day before ${jump.place}’s jump carries to the start of that day`, () => {
      // Beirut and Cairo's day of the jump was taken to start at 01:01, and a
      // save from the day before carries its rollover then.
      const sim = saveIn(jump, -1);
      sim.advanceTo(wall(sim, jump, -1, 12));
      armAt(sim, wall(sim, jump, 0, 1, late));
      const loaded = loadSave(JSON.parse(JSON.stringify(sim.universe)));
      expect(rollovers(loaded).armed).toEqual([on(jump, 0, '01:00')]);
      loaded.advanceTo(wall(loaded, jump, 1, 12));
      expect(rollovers(loaded).ran.slice(-2)).toEqual([on(jump, 0, '01:00'), on(jump, 1, '00:00')]);
    });

    it(`runs that rollover at once when ${jump.place}’s save was left between the midnight and one`, () => {
      const sim = saveIn(jump, -1);
      sim.advanceTo(wall(sim, jump, 0, 12));
      armAt(sim, wall(sim, jump, 1, 1, late));
      sim.advanceTo(wall(sim, jump, 1, 0, 30));
      const loaded = loadSave(JSON.parse(JSON.stringify(sim.universe)));
      expect(rollovers(loaded).armed).toEqual([on(jump, 1, '00:30')]);
      // A call at one stops the skip in the first hour of the night that
      // rollover starts, which is owed from half past twelve, and it stays so
      // through a save: it is not a minute past the start of the day.
      expect(loaded.execute({ kind: 'calendar.schedule', payload: { title: 'A Late Call', at: wall(loaded, jump, 1, 1) } }).ok).toBe(true);
      loaded.advanceTo(wall(loaded, jump, 1, 12), { stopOnPlayerRequired: true });
      expect(loaded.player.nightOwedFrom).toBe(wall(loaded, jump, 1, 0, 30));
      expect(loadSave(JSON.parse(JSON.stringify(loaded.universe))).player.nightOwedFrom).toBe(wall(loaded, jump, 1, 0, 30));
      loaded.advanceTo(wall(loaded, jump, 1, 12));
      expect(rollovers(loaded).ran.at(-1)).toBe(on(jump, 1, '00:30'));
      expect(rollovers(loaded).armed).toEqual([on(jump, 2, '00:00')]);
    });

    it(`keeps a night this build owes from 01:01 in ${jump.place} where it is, through a save`, () => {
      // One Hour from 23:01 lands on 01:01 on the day of the jump, a minute
      // past its start, and a skip from there stopped by a call in the first
      // hour of the night owes it from 01:01. This build ran the day's
      // rollover at 01:00, so nothing marks the night as an earlier build's.
      const sim = saveIn(jump, -1);
      sim.advanceTo(wall(sim, jump, -1, 23, 1));
      sim.advanceTo(sim.now + MS_HOUR);
      expect(sim.now).toBe(wall(sim, jump, 0, 1, 1));
      expect(sim.execute({ kind: 'calendar.schedule', payload: { title: 'A Late Call', at: wall(sim, jump, 0, 1, 30) } }).ok).toBe(true);
      sim.advanceTo(wall(sim, jump, 0, 7), { stopOnPlayerRequired: true });
      expect(sim.player.nightOwedFrom).toBe(wall(sim, jump, 0, 1, 1));
      const loaded = loadSave(JSON.parse(JSON.stringify(sim.universe)));
      expect(loaded.player.nightOwedFrom).toBe(wall(loaded, jump, 0, 1, 1));
      // Saved and loaded, the day ends where it does played straight through.
      sim.advanceTo(wall(sim, jump, 0, 18));
      loaded.advanceTo(wall(loaded, jump, 0, 18));
      expect(loaded.player.wellbeing).toEqual(sim.player.wellbeing);
    });

    it(`starts the waking day of a save from before 88 loaded in ${jump.place} on the day of the jump at the next midnight`, () => {
      // The rollover and the night nobody chose come at that midnight, so the
      // waking day has to be counted from it too. Counted from one, as it was
      // before the fix, against a rollover at midnight, the person is taken to
      // be asleep at that midnight, and the night waits for a later stop, if
      // one comes before a sound sleeper would wake.
      const sim = saveIn(jump, -1);
      sim.advanceTo(wall(sim, jump, 0, 15));
      sim.universe.meta.schemaVersion = 87;
      delete sim.player.awakeSince;
      const universe = JSON.parse(JSON.stringify(sim.universe));
      migrate(universe);
      const loaded = loadSave(universe);
      expect(loaded.player.awakeSince).toBe(wall(loaded, jump, 1, 0));
      loaded.advanceTo(wall(loaded, jump, 1, 23));
      expect(loaded.player.lastSleptAt).toBe(wall(loaded, jump, 1, 0));
    });

    if (late > 0) {
      it(`owes ${jump.place}’s night of the jump from one where an earlier build left it owed from 01:01`, () => {
        // A skip from the evening before, stopped by a call in the first hour
        // of the night, leaves that night owed from the start of the day.
        const sim = saveIn(jump, -1);
        sim.advanceTo(wall(sim, jump, -1, 22));
        expect(sim.execute({ kind: 'calendar.schedule', payload: { title: 'A Late Call', at: wall(sim, jump, 0, 1, 30) } }).ok).toBe(true);
        sim.advanceTo(wall(sim, jump, 0, 7), { stopOnPlayerRequired: true });
        expect(sim.now).toBe(wall(sim, jump, 0, 1, 30));
        expect(sim.player.nightOwedFrom).toBe(wall(sim, jump, 0, 1));
        const now = loadSave(JSON.parse(JSON.stringify(sim.universe)));
        // As the build before the fix left it: the day's rollover run at 01:01,
        // and the night owed from then and ending a minute later.
        const ran = sim.universe.scheduled.find((one) => one.kind === 'life.day_rollover' && one.at === wall(sim, jump, 0, 1))!;
        ran.at = wall(sim, jump, 0, 1, 1);
        ran.resolvedAt = ran.at;
        sim.player.nightOwedFrom = wall(sim, jump, 0, 1, 1);
        sim.player.nightEndsAt = sim.player.nightEndsAt! + MS_MINUTE;
        const before = loadSave(JSON.parse(JSON.stringify(sim.universe)));
        expect(before.player.nightOwedFrom).toBe(wall(before, jump, 0, 1));
        // Paid from there, with the day's meals after it, as if never saved.
        now.advanceTo(wall(now, jump, 0, 7));
        before.advanceTo(wall(before, jump, 0, 7));
        expect(before.player.wellbeing).toEqual(now.player.wellbeing);
      });
    }
  }

  it('leaves a rollover further off the start of its day where it was armed', () => {
    // A change in a zone's rules between the browser that armed a rollover and
    // the one that opens the save can leave it off the start of its day, and
    // it runs where it was armed, as it always did. Only as late as a build
    // before the fix armed one is it moved.
    const sim = quickSave({}, 'spring-off');
    sim.advanceTo(next(sim, 12));
    const tomorrow = startOfNextDay(sim.now, sim.homeZone);
    const read = (s: Simulation) => s.universe.scheduled.find((one) => one.kind === 'life.day_rollover' && one.status === 'pending')!.at;
    for (const [at, kept] of [
      [tomorrow - MS_HOUR, true], [tomorrow + MS_HOUR + 2 * MS_MINUTE, true],
      [tomorrow + MS_HOUR + MS_MINUTE, false], [tomorrow + MS_MINUTE, false],
    ] as const) {
      const armed = sim.universe.scheduled.find((one) => one.kind === 'life.day_rollover' && one.status === 'pending')!;
      sim.timeline.reschedule(armed.id, at);
      expect(read(loadSave(JSON.parse(JSON.stringify(sim.universe)))), String(at - tomorrow)).toBe(kept ? at : tomorrow);
    }
  });

  it('leaves a night owed from a minute past an ordinary midnight where it was', () => {
    // One Hour from 23:01 stops at 00:01, and a skip from there that stops in
    // the first hour of the night owes it from 00:01. Only a night owed from a
    // minute past the start of its day, where an earlier build ran that day's
    // rollover, is Beirut and Cairo's old start of the day of the jump.
    const sim = quickSave({}, 'spring-owed');
    sim.advanceTo(next(sim, 12));
    const owed = startOfNextDay(sim.now, sim.homeZone) + MS_MINUTE;
    sim.player.nightOwedFrom = owed;
    expect(loadSave(JSON.parse(JSON.stringify(sim.universe))).player.nightOwedFrom).toBe(owed);
  });

  it('rolls over once a day where the clocks go back, a midnight that comes twice included', () => {
    // Havana goes from 00:59:59 back to midnight on 1 November 2026, so that
    // midnight comes twice; Los Angeles and Santiago have a twenty-five-hour
    // day with midnight once.
    for (const back of [
      { place: 'cu-02-havana', year: 2026, month: 11, day: 1 },
      { place: 'us-ca-losangeles', year: 2026, month: 11, day: 1 },
      { place: 'cl-12-santiago', year: 2026, month: 4, day: 4 },
    ]) {
      const sim = quickSave({ startYear: back.year, startMonth: back.month, startDay: back.day - 1, startLocationId: back.place }, `fall-${back.place}`);
      sim.advanceTo(wall(sim, back, 2, 12));
      expect(rollovers(sim), back.place).toEqual({
        ran: [on(back, 0, '00:00'), on(back, 1, '00:00'), on(back, 2, '00:00')],
        armed: [on(back, 3, '00:00')],
      });
      // At the first of Havana's two midnights, an hour after the evening before's eleven.
      const midnight = wall(sim, back, 0, 0);
      expect(zonedParts(midnight - MS_HOUR, sim.homeZone).hour, back.place).toBe(23);
      expect(sim.universe.scheduled.some((one) => one.kind === 'life.day_rollover' && one.at === midnight), back.place).toBe(true);
    }
  });

  it('leaves a zone whose clocks go forward at two rolling over at midnight, as it always did', () => {
    const la: Jump = { place: 'us-ca-losangeles', year: 2026, month: 3, day: 8 };
    const sim = quickSave({ startYear: 2026, startMonth: 3, startDay: 7, startLocationId: la.place }, 'spring-la');
    sim.advanceTo(wall(sim, la, 2, 12));
    expect(rollovers(sim)).toEqual({ ran: ['3-8 00:00', '3-9 00:00', '3-10 00:00'], armed: ['3-11 00:00'] });
  });
});

/** The next time the save's clock reads this hour, strictly after now. */
function next(sim: Simulation, hour: number): number {
  const p = zonedParts(sim.now, sim.zone);
  let at = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour }, sim.zone);
  while (at <= sim.now) at += MS_DAY;
  return at;
}

/**
 * The first instant of tomorrow on the save's home clock. It added a day to
 * the start of today, which was one in the morning after a day whose clocks
 * skipped midnight; every save that asks keeps Reykjavík’s clock, which has no
 * daylight saving, so the answers are the same.
 */
function nextMidnight(sim: Simulation): number {
  return startOfNextDay(sim.now, sim.homeZone);
}
