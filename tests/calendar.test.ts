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
import { editionName } from '@/engine/systems/awards';
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

  it('keeps other people\'s casting off your calendar until you submit', () => {
    const sim = quickSave({}, 'calendar-casting');
    const decisions = () => entriesBetween(sim, sim.now, sim.now + 60 * MS_DAY).filter((e) => e.title.startsWith('Casting Decision'));
    const open = Object.values(sim.universe.roles).filter((r) => r.status === 'casting' && r.decidesAt && r.decidesAt > sim.now);
    expect(open.length, 'the world should have roles being cast').toBeGreaterThan(0);
    expect(decisions()).toEqual([]);

    // Submit for the first role that will have the player.
    let submitted: string | undefined;
    for (const role of open) {
      const result = sim.execute({ kind: 'cast.submit', payload: { roleId: role.id } });
      if (result.ok) { submitted = role.id; break; }
    }
    expect(submitted, 'no role would take a submission').toBeDefined();
    const mine = decisions();
    expect(mine.length).toBe(1);
    expect(mine[0]!.refId).toBe(submitted);
    expect(mine[0]!.at).toBe(sim.universe.roles[submitted!]!.decidesAt);

    // Submitting again is refused, and the calendar does not double up.
    expect(sim.execute({ kind: 'cast.submit', payload: { roleId: submitted! } }).ok).toBe(false);
    expect(decisions().length).toBe(1);
  });
});

describe('an award edition', () => {
  it('puts the ordinal inside the name', () => {
    expect(editionName(97, 'The Vanguard Awards')).toBe('The 97th Vanguard Awards');
    expect(editionName(3, 'Sundown Festival')).toBe('3rd Sundown Festival');
    expect(editionName(11, 'The Beacon Awards')).toBe('The 11th Beacon Awards');
    expect(editionName(22, 'The Continental Awards')).toBe('The 22nd Continental Awards');
  });
});
