/**
 * Brief 20's D3, consecutive career work days and fatigue (docs/verification/audit-2026-10-21/criteria.md; the owner's
 * brief 20: "Explicitly investigate ... whether consecutive career workdays cause excessive fatigue"). The measurement and
 * the decision are in docs/verification/audit-2026-10-21/areas/life/REPORT.md, with the figures before and after.
 *
 * Measured on a shoot week (`tests/fakes/shoot-week.ts`): a graduate in New Haven booked through `pro.accept_offer` for
 * five consecutive shoot days in New York, each a 7 AM call two hours away, the part prepared, played an hour at a time
 * with Go at every stop. What was found, and what each test here holds:
 *
 * - The body's figures were right: a player in bed at eight with the Sleep dialog's suggestion met every call at energy
 *   91 and readiness 95, the work judged the same each day. A player in bed at eleven had five-hour nights, which is what
 *   the dialog offered then, and wore down a day at a time, as short nights do.
 * - What made brief 19's actor fall to energy 0 and readiness 20 by the third day was a short night counted twice: the
 *   scripted player goes to bed at eleven or before five, so it took the half hour the dialog suggested at four, after a
 *   night of five, and every sleep under six hours was charged the short night's debt and wear. That half hour added 7.4
 *   hours of debt where staying up added 1.0, and took 4.2 condition and 7.3 morale. Now a short night's costs are the
 *   night's (`applySleep`, `life.sleep`).
 * - Nothing told the player when to go to bed for the call until the Sleep dialog, opened at bedtime, said there wasn't
 *   time for a full night. Now Home's Calendar, the Day look and the Sleep dialog say by when (`fullNightBefore`); this
 *   file holds the engine's figure, tests/b20-life-screens.test.ts the screens.
 * - A day of work took nothing from the body but its waking hours, where a School rehearsal call takes 8 energy on top of
 *   its own, and the Actor Showcase's rehearsals and performance take the same. Now a work day does too (`projobs.ts`).
 * - One night not slept before the first call (the craft area's question): kept up from her wake on Sunday through the
 *   night, looked after, she met the call at readiness 53.2, under the 60 the work reads, and the day was judged 91.0 to
 *   the rested twin's 94.5. But Go at the call, which carries the clock to the wrap, started a night nobody chose at
 *   seven, as if she'd slept on set, and she wrapped at energy 64.4 to the rested twin's 50.0. Now no night starts at a
 *   commitment she went to that runs past the night (`sleepAlone`, systems/life.ts).
 *
 * PLAYER JOURNEYS from TEST SETUP: the shoot week's (`shootWeek`), which sets the graduate, a skilled actor's craft and
 * the offer standing; everything after is commands and the clock.
 */
import { describe, expect, it } from 'vitest';
import { reload } from './fakes/career-work';
import { shootWeek, play, atHour, at, FIRST_CALL } from './fakes/shoot-week';
import { hour } from '../tools/career-player';
import { fullNightBefore, fullNightWords, readiness, suggestedSleep } from '@/engine/systems/life';
import { ESTIMATE } from '@/engine/systems/school';
import { WORK_DAY_KIND } from '@/engine/systems/projobs';
import { EVALUATION } from '@/engine/content/tasks';
import { GETTING_UP_MINUTES } from '@/engine/world/calendar';
import { MS_HOUR, MS_MINUTE } from '@/engine/core/time';
import { answerStop } from '@/engine/world/clock';
import type { Simulation } from '@/engine/core/simulation';

const base = shootWeek();
const END = at(2026, 9, 18, 20);
/** To bed in the hour the game names for a full night (`fullNightBefore`), with the Sleep dialog's suggestion. */
const advised = (s: Simulation) => { const n = fullNightBefore(s); return n !== undefined && s.now >= n.by - 30 * MS_MINUTE && s.now <= n.by; };

describe('D3: five shoot days in a row, a 7 AM call two hours away', () => {
  it('names a bedtime by the evening before, and a player in bed then meets every call rested, the work judged alike each day', () => {
    const s = reload(base);
    // Sunday at six: the first call is at seven tomorrow, two hours away; the dialog's full night is eight hours.
    const night = fullNightBefore(s)!;
    expect(night.item.at).toBe(FIRST_CALL);
    expect(night.by).toBe(FIRST_CALL - (GETTING_UP_MINUTES + 120) * MS_MINUTE - 8 * MS_HOUR);
    expect(fullNightWords(s, night)).toBe('A full night before it, with an hour to get up and two hours to get there, means being asleep by 8:00 PM.');
    const days = play(s, END, advised);
    expect(days.map((d) => d.label)).toEqual([1, 2, 3, 4, 5].map((n) => `Gull Season: Shoot Day ${n}`));
    for (const d of days) {
      expect(d.energy).toBeGreaterThan(85);
      expect(d.debt).toBeLessThan(2);
      expect(d.readiness).toBeGreaterThan(90);
      expect(d.tired).toBe(false);
    }
    // The fifth day is judged as the first was, within the draw's own spread.
    expect(Math.abs(days[4]!.overall! - days[0]!.overall!)).toBeLessThan(1);
  });

  it('a player in bed at eleven takes the five hours the dialog offers then, and wears down a day at a time, judged tired by the fourth', () => {
    const late = play(reload(base), END, atHour(23));
    const rested = play(reload(base), END, advised);
    for (let i = 1; i < 5; i += 1) expect(late[i]!.readiness).toBeLessThan(late[i - 1]!.readiness);
    expect(late.map((d) => d.tired)).toEqual([false, false, false, true, true]);
    expect(late[4]!.overall!).toBeLessThan(rested[4]!.overall! - 3);
    // Short nights, not a debt run away: what's left owed is the nights' shortfall, under ten hours by the fifth call.
    expect(late[4]!.debt).toBeLessThan(12);
  });

  it('brief 19’s scripted player, in bed at eleven or before five, no longer piles up debt or wears its body from the half hour it takes at four', () => {
    const s = reload(base);
    const debts: number[] = [];
    const conditions: number[] = [];
    while (s.now < END) hour(s, { stop: (x, item) => { if (item.kind === WORK_DAY_KIND) { debts.push(x.player.wellbeing.sleepDebt); conditions.push(x.player.wellbeing.condition); } return 'go'; } });
    expect(debts).toHaveLength(5);
    // Before 2026-10-21: 15.8 at the first call and 67.4 at the fifth (the report's table).
    expect(Math.max(...debts)).toBeLessThan(8);
    // And condition: 89.1 at the first call and 54.4 at the fifth with the debt counted once and the half hour still
    // charged the short night's wear; 97.5 and 94.5 since.
    expect(conditions[0]! - conditions[4]!).toBeLessThan(5);
  });
});

describe('D3: the short night’s costs are counted once', () => {
  it('half an hour at four, after a night of five, adds no debt and wears neither body nor mood: it clears what its sleep clears, and staying up adds the waking hour’s', () => {
    const s = reload(base);
    play(s, at(2026, 9, 13, 23), () => false);
    const d0 = s.player.wellbeing.sleepDebt;
    const q = (s.must<{ quality: number }>({ kind: 'life.sleep', payload: { hours: 5 } })).quality;
    // The night under six hours adds its 1.35 an hour short, and clears 1.4 for each hour of its rest.
    expect(s.player.wellbeing.sleepDebt).toBeCloseTo(Math.max(0, d0 - 5 * q * 1.4) + 1.35, 6);
    const awake = reload(s);
    const napped = reload(s);
    const d1 = s.player.wellbeing.sleepDebt;
    const nap = napped.must<{ quality: number }>({ kind: 'life.sleep', payload: { hours: 0.5 } }).quality;
    awake.advanceTo(awake.now + 30 * MS_MINUTE);
    expect(napped.player.wellbeing.sleepDebt).toBeCloseTo(Math.max(0, d1 - 0.5 * nap * 1.4), 6);
    expect(awake.player.wellbeing.sleepDebt).toBeCloseTo(d1 + 0.5 * 0.34, 6);
    expect(napped.player.wellbeing.sleepDebt).toBeLessThan(awake.player.wellbeing.sleepDebt);
    // The night's wear is the night's too (the journeys area's F1): until 2026-10-21 the half hour left condition 4.2
    // and morale 7.3 under the twin who stayed up. Now condition is the twin's, and morale only drifts a little towards
    // where it settles, as any sleep moves it.
    expect(napped.player.wellbeing.condition).toBeCloseTo(awake.player.wellbeing.condition, 6);
    expect(napped.player.wellbeing.morale).toBeGreaterThan(awake.player.wellbeing.morale - 1);
    expect(napped.player.wellbeing.energy).toBeGreaterThan(awake.player.wellbeing.energy);
  });
});

describe('D3: a day of work takes what a School rehearsal call takes', () => {
  it('a shoot day leaves the actor ESTIMATE.energy.rehearsal under a twin at a plan of their own of the same hours, judged at the call before it', () => {
    const booked = reload(base);
    const free = reload(base);
    // TEST SETUP: the twin's shoot days taken off the calendar, and a plan of the same hours put on in their place.
    for (const i of free.universe.scheduled.filter((x) => x.kind === WORK_DAY_KIND && x.status === 'pending')) free.timeline.cancel(i.id, free.now);
    free.must({ kind: 'calendar.schedule', payload: { title: 'A Long Day', at: FIRST_CALL, durationMinutes: 660 } });
    const atCall: Record<string, number> = {};
    for (const [name, sim] of [['booked', booked], ['free', free]] as const) {
      play(sim, FIRST_CALL - 60 * MS_MINUTE, atHour(20));
      const r = sim.advanceTo(FIRST_CALL + MS_HOUR, { stopOnPlayerRequired: true });
      expect(r.interruptedBy!.at).toBe(FIRST_CALL);
      atCall[name] = readiness(sim.player);
      answerStop(sim, { item: r.interruptedBy!, wanted: FIRST_CALL + MS_HOUR, sentFrom: r.sentFrom }, 'go');
    }
    expect(booked.now).toBe(free.now);
    expect(booked.player.wellbeing.energy).toBeCloseTo(free.player.wellbeing.energy - ESTIMATE.energy.rehearsal, 9);
    expect(booked.player.wellbeing.stress).toBeCloseTo(free.player.wellbeing.stress, 9);
    expect(booked.player.wellbeing.sleepDebt).toBeCloseTo(free.player.wellbeing.sleepDebt, 9);
    // Judged at the call, before the day's cost: the readiness it read is the one the twin had there.
    expect(atCall.booked).toBeCloseTo(atCall.free!, 9);
    const work = booked.player.work!.at(-1)!;
    expect(work.what).toBe('Wren, Gull Season: Shoot Day 1');
    expect((work.inputs.condition as { readiness: number }).readiness).toBeGreaterThan(EVALUATION.sufficientReadiness);
  });

  it('the Sleep dialog’s suggestion at the named bedtime is the full night itself, not one cut short', () => {
    const s = reload(base);
    play(s, at(2026, 9, 13, 20), () => false);
    expect(fullNightBefore(s)!.by).toBe(s.now);
    expect(suggestedSleep(s)).toEqual({ hours: 8, reason: 'A normal night.' });
    play(s, at(2026, 9, 13, 21), () => false);
    expect(suggestedSleep(s).reason).toMatch(/there isn’t time for a full night\.$/);
    expect(fullNightWords(s, fullNightBefore(s)!)).toBe('A full night before it, with an hour to get up and two hours to get there, needed you asleep by 8:00 PM.');
    // Once the night before it is slept, there's nothing to say of it.
    s.must({ kind: 'life.sleep', payload: { hours: suggestedSleep(s).hours } });
    expect(fullNightBefore(s)).toBeUndefined();
  });
});


describe('one night not slept before the first call (the craft area’s question of the life area, brief 20)', () => {
  // Kept up through it an hour at a time from Sunday at six, looked after as the menu urges, never put to bed; the twin
  // goes to bed when the game says. Played to Monday at eight in the evening, past the wrap.
  const END_OF_DAY_1 = at(2026, 9, 14, 20);

  it('costs the work: up since the morning before, she meets the call under the sufficient mark, and the day is judged tired and lower than rested', () => {
    const [up] = play(reload(base), END_OF_DAY_1, () => false);
    const [rested] = play(reload(base), END_OF_DAY_1, advised);
    expect(up!.readiness).toBeLessThan(EVALUATION.sufficientReadiness);
    expect([up!.tired, rested!.tired]).toEqual([true, false]);
    expect(up!.overall!).toBeLessThan(rested!.overall! - 2);
  });

  it('and the day on set isn’t a night: Go at the call carries her through it awake, so she wraps with less energy than the twin who slept, and no night is put on her record', () => {
    const s = reload(base);
    const slept = s.player.lastSleptAt;
    const [up] = play(s, END_OF_DAY_1, () => false);
    const [rested] = play(reload(base), END_OF_DAY_1, advised);
    // Until 2026-10-21 the jump through the day paid a night nobody chose from the call, at seven, as if she'd slept on
    // set: she wrapped at 64.4 to the rested twin's 50.0, and her record had her sleeping that morning.
    expect(up!.wrapEnergy!).toBeLessThan(rested!.wrapEnergy!);
    expect(up!.wrapEnergy!).toBeLessThan(up!.energy - ESTIMATE.energy.rehearsal);
    expect(s.player.lastSleptAt).toBe(slept);
  });
});
