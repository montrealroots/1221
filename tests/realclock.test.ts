/**
 * A minute in a minute, an hour in an hour.
 *
 * The world clock is measured against real elapsed time and must not drift:
 * not by rounding, not by a dropped tick, not by a night away. These tests
 * feed the stepper real-time gaps and check the world advanced exactly that
 * much, to the millisecond.
 */

import { describe, expect, it } from 'vitest';
import { createClockStepper, MAX_STEP_MS } from '@/engine/core/realclock';
import { MS_HOUR, MS_MINUTE } from '@/engine/core/time';

describe('live time', () => {
  it('advances an hour of world time for an hour of real time, tick by tick', () => {
    const clock = createClockStepper(1);
    let advanced = 0;
    for (let i = 0; i < 3600; i++) advanced += clock.feed(1000);
    expect(advanced).toBe(MS_HOUR);
    expect(clock.backlog).toBe(0);
  });

  it('loses nothing to uneven ticks', () => {
    // Browsers do not fire intervals on schedule. 997ms, 1003ms, 1250ms …
    const clock = createClockStepper(1);
    const gaps = [997, 1003, 1250, 480, 1000, 2210, 60, 1000];
    let advanced = 0;
    for (const gap of gaps) advanced += clock.feed(gap);
    const total = gaps.reduce((s, g) => s + g, 0);
    expect(advanced + clock.backlog).toBe(total);
    expect(clock.backlog).toBeLessThan(1);
  });

  it('carries fractions of a millisecond rather than rounding them away', () => {
    const clock = createClockStepper(1);
    let advanced = 0;
    for (let i = 0; i < 10_000; i++) advanced += clock.feed(16.6667);
    expect(advanced + clock.backlog).toBeCloseTo(166_667, 3);
    expect(clock.backlog).toBeLessThan(1);
    expect(advanced).toBe(Math.floor(166_667 - clock.backlog + 1e-9));
  });

  it('pays a night away back in full, in bounded steps', () => {
    const clock = createClockStepper(1);
    const night = 8 * MS_HOUR;
    let advanced = 0;
    let ticks = 0;
    let step = clock.feed(night);
    while (step > 0) {
      expect(step).toBeLessThanOrEqual(MAX_STEP_MS);
      advanced += step;
      ticks++;
      step = clock.feed(0);
    }
    expect(advanced).toBe(night);
    expect(ticks).toBe(night / MAX_STEP_MS);
    expect(clock.backlog).toBe(0);
  });

  it('keeps counting real time while a backlog drains', () => {
    const clock = createClockStepper(1);
    let advanced = clock.feed(2 * MS_HOUR);
    advanced += clock.feed(1000);
    advanced += clock.feed(1000);
    // Two hours owed plus two seconds lived, none of it lost.
    let step = clock.feed(0);
    while (step > 0) { advanced += step; step = clock.feed(0); }
    expect(advanced).toBe(2 * MS_HOUR + 2000);
  });
});

describe('other speeds', () => {
  it('stands still when paused, whatever real time does', () => {
    const clock = createClockStepper(0);
    expect(clock.feed(MS_HOUR)).toBe(0);
    expect(clock.backlog).toBe(0);
  });

  it('runs a minute a second at the fast setting', () => {
    const clock = createClockStepper(60);
    expect(clock.feed(1000)).toBe(MS_MINUTE);
  });

  it('never runs backwards', () => {
    const clock = createClockStepper(1);
    expect(clock.feed(-5000)).toBe(0);
    expect(clock.feed(Number.NaN)).toBe(0);
    expect(createClockStepper(-1).feed(1000)).toBe(0);
  });
});
