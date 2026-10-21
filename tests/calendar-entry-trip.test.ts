/**
 * The Calendar's entry, opened on a commitment that carries its own trip (from 2026-10-21, brief 19's second app walk):
 * the meeting's notice says it's "on your calendar with two hours to get there", and until then the entry the Calendar
 * opened showed when, how long, its kind and New York, and nothing of the trip. Drawn with react-dom/server, `useGame`
 * standing in for the provider, as the Career screen's tests draw it.
 *
 * TEST SETUP: the commitment scheduled as `scheduleMeeting` (`systems/proagent.ts`) schedules the meeting at an office,
 * its trip each way on it (`travelMinutes`), and a twin with none, as a video meeting has.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { entriesBetween } from '@/engine/world/calendar';
import { MEETING_KIND } from '@/engine/systems/proagent';
import { at, graduate } from './fakes/career-work';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { EntryDetail } = await import('@/ui/workspaces/CalendarWorkspace');

const words = (html: string) => html.replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

/** The entry the Calendar opens for a meeting at 11, its trip each way as given. */
function opened(sim: Simulation, travelMinutes: number): string {
  const when = at(2026, 9, 25, 11);
  const id = sim.schedule({ at: when, kind: MEETING_KIND, label: 'Meeting At Halberd Talent', category: 'career', priority: 30, requiresPlayer: true, durationMinutes: 60, travelMinutes, locationId: 'us-ny-newyork', payload: { personId: sim.player.id } }).id;
  const entry = entriesBetween(sim, when - MS_DAY, when + MS_DAY).find((e) => e.id === id)!;
  h.sim = sim;
  return words(renderToStaticMarkup(createElement(EntryDetail, { entry, onClose: () => undefined })));
}

describe('the Calendar’s entry for a commitment with its own trip', () => {
  it('says the trip each way and that it’s part of the commitment, as the meeting’s notice and the day’s look say; a commitment with no trip says none', () => {
    const shown = opened(graduate('calendar-trip'), 120);
    expect(shown).toContain('You need to be there. The clock stops when it’s time, so you can go. Getting there takes two hours each way, and the trip is part of it.');
    expect(shown).toContain('New York');
    const none = opened(graduate('calendar-trip-none'), 0);
    expect(none).toContain('You need to be there. The clock stops when it’s time, so you can go.');
    expect(none).not.toContain('Getting there');
  });
});
