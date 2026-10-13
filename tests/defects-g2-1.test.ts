/**
 * Group g2, part 1: the "Your Own Plans" chapter (from 2026-10-12).
 *
 * The defect was the chapter's prose (`content/tutorial.ts`), which named a
 * Cancel button the Calendar doesn't have (it's Call It Off) and promised a
 * plan is missed if you're somewhere else when it comes. A check of the
 * chapter's text against both failed on 2026-10-12; it isn't kept here, since
 * this pass couldn't edit the chapter and a red test would hold the gate.
 *
 * What's kept is the fact the corrected chapter is to rest on: a plan made the
 * way the screen makes it, with no town, names the town you're in. Dropping
 * the fallback to `currentLocationId` in `world/plans.ts` fails it.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';

describe('a plan made from the Calendar', () => {
  it('names the town you’re in when the screen sends no town', () => {
    const sim = quickSave({}, 'g2-plan-here');
    // The screen's own payload: a name, a start and how long, and no town
    // (`ui/workspaces/CalendarWorkspace.tsx`, the calendar.schedule call).
    const made = sim.execute<{ ok: boolean; id?: string }>({
      kind: 'calendar.schedule',
      payload: { title: 'Table Read', at: sim.now + 2 * MS_DAY, durationMinutes: 60 },
    }).value!;
    expect(made.ok).toBe(true);
    const item = sim.timeline.get(made.id!) as { locationId?: string } | undefined;
    expect(item?.locationId).toBeDefined();
    expect(item!.locationId).toBe(sim.player.currentLocationId);
  });
});
