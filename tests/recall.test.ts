/**
 * What the save remembers.
 *
 * What a test can hold: that a thing that happened is written down, that a
 * thing that never happened is not, that the everyday folds into a week
 * rather than filling the memory a shower at a time, that what mattered is
 * still there years later, that a person only remembers what they were there
 * for, that the world does not say the same thing twice, and that a save
 * written before any of this existed loads without losing anything.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { NEVER_BELOW_HALF, RECALLBOOK } from '@/engine/content/recallbook';
import {
  MAX_RECOLLECTIONS, TEXTURE_BELOW, daysSince, describe as saidAs, lastTime, notSeenLately,
  openThreads, recall, recallStats, remember, timesEver, whatTheyKnow, worthNow,
} from '@/engine/systems/recall';
import { fingerprint, freshest, markPlayed, playedWithin, timesPlayed } from '@/engine/systems/freshness';
import { BEAT_COOLDOWN_DAYS, causeOf, keyOf, liveBeats, runTheDay } from '@/engine/systems/director';

describe('the book', () => {
  it('gives every rule a weight, a heading and something to say', () => {
    for (const rule of RECALLBOOK) {
      expect(rule.weight, rule.event).toBeGreaterThan(0);
      expect(rule.weight, rule.event).toBeLessThanOrEqual(100);
      expect(rule.tags.length, rule.event).toBeGreaterThan(0);
      expect(rule.what.length, rule.event).toBeGreaterThan(3);
    }
  });

  it('names each event once', () => {
    const seen = new Set(RECALLBOOK.map((one) => one.event));
    expect(seen.size).toBe(RECALLBOOK.length);
  });
});

describe('remembering what happened', () => {
  it('writes a memory when the world does the thing', () => {
    const sim = quickSave();
    const before = sim.universe.recall?.entries.length ?? 0;
    const outcome = sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(outcome.ok).toBe(true);
    expect(sim.universe.recall!.entries.length).toBeGreaterThan(before);
  });

  it('remembers nothing about a thing that did not happen', () => {
    const sim = quickSave();
    expect(recall(sim, { cause: 'rel.married' })).toHaveLength(0);
    expect(daysSince(sim, { cause: 'rel.married' })).toBeUndefined();
  });

  it('folds the everyday into one memory for the week, with the count on it', () => {
    const sim = quickSave();
    for (let i = 0; i < 6; i++) {
      remember(sim, {
        kind: 'did', cause: 'life.showered', what: 'Showered', weight: 6,
        halfLifeDays: 4, tags: ['body'], at: sim.now + i * MS_DAY,
      });
    }
    const held = sim.universe.recall!.entries.filter((one) => one.cause === 'life.showered');
    expect(held).toHaveLength(1);
    expect(held[0]!.times).toBe(6);
    expect(timesEver(sim, { cause: 'life.showered' })).toBe(6);
    expect(saidAs(sim, held[0]!)).toContain('6 times that week');
  });

  it('starts a new week once the week is over', () => {
    const sim = quickSave();
    remember(sim, {
      kind: 'did', cause: 'life.showered', what: 'Showered', weight: 6,
      halfLifeDays: 4, tags: ['body'],
    });
    remember(sim, {
      kind: 'did', cause: 'life.showered', what: 'Showered', weight: 6,
      halfLifeDays: 4, tags: ['body'], at: sim.now + 9 * MS_DAY,
    });
    expect(sim.universe.recall!.entries.filter((one) => one.cause === 'life.showered')).toHaveLength(2);
  });

  it('does not fold anything above the texture line', () => {
    const sim = quickSave();
    for (let i = 0; i < 3; i++) {
      remember(sim, {
        kind: 'did', cause: 'week.trained', what: 'Trained', weight: TEXTURE_BELOW + 8,
        halfLifeDays: 30, tags: ['training'], at: sim.now + i * MS_DAY,
      });
    }
    expect(sim.universe.recall!.entries.filter((one) => one.cause === 'week.trained')).toHaveLength(3);
  });
});

describe('what a memory is worth later', () => {
  it('fades an ordinary one', () => {
    const sim = quickSave();
    const one = remember(sim, {
      kind: 'did', cause: 'life.ate', what: 'Ate something', weight: 10,
      halfLifeDays: 4, tags: ['food'],
    });
    expect(worthNow(one, sim.now)).toBeCloseTo(10, 1);
    expect(worthNow(one, sim.now + 4 * MS_DAY)).toBeCloseTo(5, 1);
    expect(worthNow(one, sim.now + 40 * MS_DAY)).toBeLessThan(0.1);
  });

  it('never lets a big one fall below half, however long ago it was', () => {
    const sim = quickSave();
    const one = remember(sim, {
      kind: 'got', cause: 'rel.married', what: 'Got married', weight: 100,
      halfLifeDays: 365, tags: ['people'],
    });
    expect(one.weight).toBeGreaterThanOrEqual(NEVER_BELOW_HALF);
    expect(worthNow(one, sim.now + 50 * 365 * MS_DAY)).toBeGreaterThanOrEqual(50);
  });

  it('keeps what mattered when the memory is full and has to drop something', () => {
    const sim = quickSave();
    remember(sim, {
      kind: 'got', cause: 'rel.married', what: 'Got married', weight: 100,
      halfLifeDays: 0, tags: ['people'],
    });
    for (let i = 0; i < MAX_RECOLLECTIONS + 200; i++) {
      remember(sim, {
        kind: 'did', cause: `filler.${i}`, what: 'Something small', weight: 21,
        halfLifeDays: 4, tags: ['filler'], at: sim.now - i * 1000,
      });
    }
    expect(sim.universe.recall!.entries.length).toBeLessThanOrEqual(MAX_RECOLLECTIONS);
    expect(sim.universe.recall!.entries.some((one) => one.cause === 'rel.married')).toBe(true);
  });
});

describe('who knows what', () => {
  it('only lets somebody remember what they were there for', () => {
    const sim = quickSave();
    const people = Object.values(sim.universe.people).filter((one) => !one.isPlayer);
    const [there, elsewhere] = people;
    expect(there).toBeDefined();
    expect(elsewhere).toBeDefined();
    remember(sim, {
      kind: 'met', cause: 'rel.interaction', what: 'Spent time with somebody', weight: 40,
      halfLifeDays: 30, tags: ['people'], withIds: [there!.id],
    });
    expect(whatTheyKnow(sim, there!.id)).toHaveLength(1);
    expect(whatTheyKnow(sim, elsewhere!.id)).toHaveLength(0);
  });

  it('knows how long it has been since somebody was seen', () => {
    const sim = quickSave();
    const friend = Object.values(sim.universe.people).find((one) => !one.isPlayer && one.tier !== 'dormant');
    expect(friend).toBeDefined();
    remember(sim, {
      kind: 'met', cause: 'rel.interaction', what: 'Spent time with somebody', weight: 40,
      halfLifeDays: 30, tags: ['people'], withIds: [friend!.id], at: sim.now - 100 * MS_DAY,
    });
    const away = notSeenLately(sim, 45);
    expect(away.some((one) => one.personId === friend!.id)).toBe(true);
    expect(away.find((one) => one.personId === friend!.id)!.days).toBeGreaterThanOrEqual(99);
  });
});

describe('what is still hanging', () => {
  it('finds something booked and never done', () => {
    const sim = quickSave();
    remember(sim, {
      kind: 'did', cause: 'home.repair_booked', what: 'Booked a repair', weight: 22,
      halfLifeDays: 30, tags: ['home'], at: sim.now - 60 * MS_DAY,
    });
    expect(openThreads(sim).some((one) => one.opened.cause === 'home.repair_booked')).toBe(true);
  });

  it('stops calling it open once it was done', () => {
    const sim = quickSave();
    remember(sim, {
      kind: 'did', cause: 'home.repair_booked', what: 'Booked a repair', weight: 22,
      halfLifeDays: 30, tags: ['home'], at: sim.now - 60 * MS_DAY,
    });
    remember(sim, {
      kind: 'got', cause: 'home.repaired', what: 'Something was mended', weight: 30,
      halfLifeDays: 120, tags: ['home'], at: sim.now - 30 * MS_DAY,
    });
    expect(openThreads(sim).some((one) => one.opened.cause === 'home.repair_booked')).toBe(false);
  });
});

describe('the world does not repeat itself', () => {
  it('never hands back the same thing twice running while there is another', () => {
    const sim = quickSave();
    const options = ['a', 'b', 'c', 'd'];
    let previous: string | undefined;
    for (let i = 0; i < 40; i++) {
      const picked = freshest(sim, 'test', options, (one) => one, 3, i).chosen;
      expect(picked, `round ${i}`).not.toBe(previous);
      previous = picked;
      sim.advanceBy(MS_DAY);
    }
  });

  it('writes down what it played, and says so', () => {
    const sim = quickSave();
    expect(playedWithin(sim, 'probe', 1)).toBe(false);
    markPlayed(sim, 'probe');
    expect(playedWithin(sim, 'probe', 1)).toBe(true);
    expect(timesPlayed(sim, 'probe')!.n).toBe(1);
    markPlayed(sim, 'probe');
    expect(timesPlayed(sim, 'probe')!.n).toBe(2);
  });

  it('reaches for the least stale rather than saying nothing', () => {
    const sim = quickSave();
    const picked = freshest(sim, 'test', ['only'], (one) => one, 30, 1);
    expect(picked.chosen).toBe('only');
    const again = freshest(sim, 'test', ['only'], (one) => one, 30, 2);
    expect(again.chosen).toBe('only');
    expect(again.reachedFor).toBe(true);
  });

  it('names a beat the same way wherever it is raised', () => {
    expect(fingerprint('beat', 'a', undefined, 'b')).toBe('beat:a:b');
  });
});

describe('the day the world looks back', () => {
  it('raises nothing it cannot account for', () => {
    const sim = quickSave({ birthYear: 1996 });
    for (let day = 0; day < 400; day++) {
      for (const beat of liveBeats(sim)) {
        const cause = beat.becauseRecallId ?? beat.becauseHistoryId;
        expect(cause, beat.title).toBeDefined();
        expect(causeOf(sim, beat), beat.title).toBeDefined();
      }
      sim.advanceBy(MS_DAY);
    }
  });

  it('does not bring the same thing up twice inside its cooldown', () => {
    const sim = quickSave({ birthYear: 1996 });
    const seen = new Map<string, number>();
    for (let day = 0; day < 500; day++) {
      for (const beat of runTheDay(sim)) {
        const before = seen.get(keyOf(beat));
        if (before !== undefined) {
          expect(sim.now - before, beat.title).toBeGreaterThanOrEqual(BEAT_COOLDOWN_DAYS * MS_DAY);
        }
        seen.set(keyOf(beat), sim.now);
      }
      sim.advanceBy(MS_DAY);
    }
  });
});

describe('a save from before any of this', () => {
  it('loads, keeps its history, and starts remembering from here', () => {
    const sim = quickSave();
    const historyBefore = sim.universe.history.length;
    // A save written before the recall existed simply has no such field.
    delete (sim.universe as { recall?: unknown }).recall;
    expect(recall(sim)).toHaveLength(0);
    expect(lastTime(sim)).toBeUndefined();
    expect(recallStats(sim).entries).toBe(0);
    const outcome = sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(outcome.ok).toBe(true);
    expect(sim.universe.recall!.entries.length).toBeGreaterThan(0);
    expect(sim.universe.history.length).toBeGreaterThanOrEqual(historyBefore);
  });
});
