/**
 * What the calendar shows, and what it keeps to itself.
 *
 * Every entry is a label, so every entry is Title Case. And the calendar is
 * the player's: somebody else's casting is not on it until the player has
 * put themselves in the running.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { entriesBetween } from '@/engine/world/calendar';
import { titleCaseLabel } from '@/engine/core/text';
import { MS_DAY } from '@/engine/core/time';

describe('what the calendar shows', () => {
  it('writes every entry as a Title Case label, today and across a season', () => {
    const sim = quickSave({}, 'calendar-labels');
    const wrong = new Set<string>();
    const check = () => {
      for (const entry of entriesBetween(sim, sim.now - 30 * MS_DAY, sim.now + 120 * MS_DAY)) {
        if (titleCaseLabel(entry.title) !== entry.title) wrong.add(entry.title);
      }
    };
    check();
    sim.advanceTo(sim.now + 45 * MS_DAY);
    check();
    expect([...wrong], 'labels with a lowercase word').toEqual([]);
  });
});
