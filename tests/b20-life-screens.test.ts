/**
 * Brief 20's D3 on the screens: when a full night before the next commitment starts, said where the player is in the
 * evening (`fullNightBefore`, `fullNightWords`, systems/life.ts): Home's Calendar, the Day look for today and the Sleep
 * dialog. Until 2026-10-21 none of them said it, and the Sleep dialog, opened at eleven before a seven o'clock call two
 * hours away, said only that there wasn't time for a full night. And Home's next commitment, a shoot day in New York
 * that carries its own trip, said "you’re not in New York" in red from New Haven, where the entry it opens says the trip
 * is part of it; a plan elsewhere, which carries none, still says it.
 *
 * PLAYER JOURNEYS from TEST SETUP: the shoot week's (`tests/fakes/shoot-week.ts`), which sets the graduate, a skilled
 * actor's craft and the offer standing; the booking, the part and every hour after are commands and the clock.
 *
 * FIXTURE: as tests/evidence3-home.test.ts's: each useState given back by its place in the render, the game's provider
 * stood in for by the save, and a screen's kept tab given its first value.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Simulation } from '@/engine/core/simulation';
import { reload } from './fakes/career-work';
import { shootWeek, play, at } from './fakes/shoot-week';
import { dateKey } from '@/engine/core/time';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  calls: 0,
  given: new Map<number, unknown>(),
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const i = h.calls++;
    const [value] = real.useState(initial);
    return [h.given.has(i) ? h.given.get(i) : value, () => undefined];
  }) as unknown as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

// Without the original: it imports the looks, which import it back.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});

const { Home } = await import('@/ui/screens/Home');
const { TimeControls } = await import('@/ui/shell/TimeControls');
await import('@/ui/looks/all');
const { resolveLook } = await import('@/ui/looks/registry');
const { at: subject } = await import('@/ui/looks/subject');

/** The words a player reads: tags out, entities back, spaces closed up before a full stop or a comma. */
const words = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();
/** A screen as the player has it, with the first useStates given back as `given` says, in render order. */
function drawn(sim: Simulation, screen: FunctionComponent, given: unknown[] = []): string {
  h.sim = sim;
  h.calls = 0;
  h.given = new Map(given.map((v, i) => [i, v] as const).filter(([, v]) => v !== undefined));
  return words(renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, ''));
}
/** Today's Day look, its summary and body, as the look panel draws them. */
function today(sim: Simulation): string {
  h.sim = sim;
  const look = resolveLook(sim, subject('day', dateKey(sim.now, sim.homeZone)));
  if (!look || 'gone' in look) throw new Error('no Day look for today');
  return words(`${look.summary} ${renderToStaticMarkup(createElement('div', null, look.body))}`);
}

const base = shootWeek();
const BY_EIGHT = 'A full night before it, with an hour to get up and two hours to get there, means being asleep by 8:00 PM.';
const WAS_EIGHT = 'A full night before it, with an hour to get up and two hours to get there, needed you asleep by 8:00 PM.';

describe('the bedtime a full night asks for, said by the evening before', () => {
  it('Home’s Calendar says it under the shoot day, and doesn’t call New York a place she isn’t of a day that carries its own trip', () => {
    const s = reload(base);
    const text = drawn(s, Home);
    expect(text).toContain('Gull Season: Shoot Day 1');
    expect(text).toContain(BY_EIGHT);
    expect(text).not.toContain('you’re not in New York');
    // Past the bedtime, Home has nothing to tell her of it: the Sleep dialog says what's left.
    play(s, at(2026, 9, 13, 21), () => false);
    expect(drawn(s, Home)).not.toContain('asleep by');
  });

  it('a plan in another town, which carries no trip of its own, still says she isn’t there', () => {
    const s = reload(base);
    s.must({ kind: 'calendar.schedule', payload: { title: 'Dinner In Boston', at: at(2026, 9, 13, 19), durationMinutes: 60, locationId: 'us-ma-boston' } });
    expect(drawn(s, Home)).toContain('you’re not in Boston');
  });

  it('the Day look for today says it, and says nothing of it once the bedtime has passed', () => {
    const s = reload(base);
    expect(today(s)).toContain(`Gull Season: Shoot Day 1 is next, tomorrow at 7:00 AM. ${BY_EIGHT}`);
    play(s, at(2026, 9, 13, 21), () => false);
    expect(today(s)).not.toContain('asleep by');
  });

  it('the Sleep dialog says it beside the next commitment: by eight at six, and that it was by eight at nine, with the suggestion cut short', () => {
    const s = reload(base);
    // TEST SETUP: the bar with Sleep open, its first state.
    const six = drawn(s, TimeControls, [true]);
    expect(six).toContain(`Your next commitment is in 13 hours. ${BY_EIGHT}`);
    play(s, at(2026, 9, 13, 21), () => false);
    const nine = drawn(s, TimeControls, [true]);
    expect(nine).toContain(`Your next commitment is in 10 hours. ${WAS_EIGHT}`);
    expect(nine).toContain('so there isn’t time for a full night.');
  });
});
