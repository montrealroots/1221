/**
 * Why a time control is grayed out, said on screen in words (connected-journey map of 2026-10-12, critic item 14).
 *
 * Until 2026-10-12 the top bar's Sleep, grayed out while the player was at something, said why only in its tooltip,
 * which a phone never shows and a keyboard never reaches; and Skip To Event's Skip, grayed out with events on the list
 * and none picked, said nothing at all. Each now has a line in the house's words (`WhyNot`) beside or under it. The
 * menus' grayed-out items needed nothing: each item's own detail line already says why.
 *
 * PLAYER JOURNEYS: the bar and the dialog are rendered as the player has them, on saves played through the commands
 * and the clock the screens use. A TEST SETUP clears the calendar, as named where it's done; a FIXTURE sets what the
 * dialog's pick starts at, as a live clock going past the picked event leaves it, which a static render can't wait for.
 * Every line is read off the screen with each title attribute taken out first, so a tooltip can't pass for it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, formatTime } from '@/engine/core/time';
import { PLAN_KIND } from '@/engine/world/plans';
import { occupiedAt } from '@/engine/systems/life';
import { skipTargets } from '@/engine/world/calendar';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** FIXTURE: what the rendered component's first useState starts at, in place of its own initial value. */
  states: [] as unknown[],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    return h.states.length ? [h.states.shift(), set] : [value, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

// Without the original: it imports the looks, which import it back, and would get the original's hooks. Nothing is
// standing at a stop: the bar is drawn without the stop's dialog over it.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { TimeControls, SkipDialog } = await import('@/ui/shell/TimeControls');

/** What the player reads: the markup with every title attribute taken out, then every tag. */
function onScreen(html: string): string {
  return html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

function bar(sim: Simulation): { html: string; text: string } {
  h.sim = sim;
  const html = renderToStaticMarkup(createElement(TimeControls));
  return { html, text: onScreen(html) };
}

function skipDialog(sim: Simulation, picked?: string): { html: string; text: string } {
  h.sim = sim;
  h.states = picked === undefined ? [] : [picked];
  const html = renderToStaticMarkup(createElement(SkipDialog, { onClose: () => undefined, onSkip: () => undefined }));
  h.states = [];
  return { html, text: onScreen(html) };
}

/** The bar's Sleep button, grayed out or not. */
const sleepButton = (html: string) => /<button[^>]*>Sleep<\/button>/.exec(html)![0];
/** The dialog's Skip button, grayed out or not. */
const skipButton = (html: string) => /<button[^>]*>Skip[^<]*<\/button>/.exec(html)![0];

/** TEST SETUP: nothing on the calendar that wants the player, canceled by hand. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}

/**
 * Moving the clock as the screen's Advance does, stopping at whatever wants the player; at a stop, the next move runs
 * the thing with the player there, as pressing One Hour while standing at it does.
 */
const advance = (sim: Simulation, to: number) => sim.advanceTo(to, { stopOnPlayerRequired: true });

describe('Sleep, grayed out at a commitment', () => {
  it('says why under the bar’s controls, naming Sleep, at a plan of your own', () => {
    const sim = quickSave({}, 'whynot-time-plan');
    clearCalendar(sim); // TEST SETUP
    const at = sim.now + 3 * MS_HOUR;
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Gym', at, durationMinutes: 120 } });
    advance(sim, at);
    expect(sim.now).toBe(at);
    advance(sim, at + MS_HOUR);
    expect(occupiedAt(sim, sim.now)?.kind).toBe(PLAN_KIND);

    const { html, text } = bar(sim);
    const why = `You’re at Gym until ${formatTime(at + 2 * MS_HOUR, sim.zone)}.`;
    expect(sleepButton(html)).toContain('disabled=""');
    expect(sleepButton(html)).toContain(`title="${why}"`);
    expect(text).toContain(`Sleep: ${why}`);
  });

  it('says why at the school’s own commitment, the first a new life is stopped at', () => {
    const sim = createSave(1, 'whynot-time-school', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const stop = advance(sim, sim.now + 12 * MS_HOUR).interruptedBy!;
    expect(stop.category).toBe('school');
    // Half an hour in.
    advance(sim, sim.now + 30 * 60_000);
    const at = occupiedAt(sim, sim.now)!;
    expect(at.id).toBe(stop.id);

    const { html, text } = bar(sim);
    const why = `You’re at ${at.label} until ${formatTime(at.at + at.durationMinutes! * 60_000, sim.zone)}.`;
    expect(sleepButton(html)).toContain('disabled=""');
    expect(text).toContain(`Sleep: ${why}`);
  });

  it('says nothing, and isn’t grayed out, with the player at nothing', () => {
    const sim = quickSave({}, 'whynot-time-free');
    clearCalendar(sim); // TEST SETUP
    expect(occupiedAt(sim, sim.now)).toBeUndefined();
    const { html, text } = bar(sim);
    expect(sleepButton(html)).not.toContain('disabled');
    expect(text).not.toMatch(/Sleep: |Not now/);
  });
});

describe('Skip To Event’s Skip, grayed out', () => {
  /** A save with two plans of the player's own ahead, and the clock on their day. */
  function twoPlans(seed: string): { sim: Simulation; first: string; second: string } {
    const sim = quickSave({}, seed);
    clearCalendar(sim); // TEST SETUP
    const first = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Gym', at: sim.now + 2 * MS_HOUR, durationMinutes: 60 } }).id;
    const second = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Lunch', at: sim.now + 5 * MS_HOUR, durationMinutes: 60 } }).id;
    return { sim, first, second };
  }

  it('says to pick one, under the list, when the one picked has gone by', () => {
    const { sim, first, second } = twoPlans('whynot-time-skip-gone');
    // The dialog opened with Gym first and picked; the clock then went through it.
    expect(skipTargets(sim, 14)[0]!.item.id).toBe(first);
    const gym = sim.timeline.get(first)!;
    advance(sim, gym.at);
    advance(sim, gym.at + 90 * 60_000);
    expect(skipTargets(sim, 14).map((t) => t.item.id)).not.toContain(first);
    expect(skipTargets(sim, 14).map((t) => t.item.id)).toContain(second);

    // FIXTURE: the pick still Gym, as the open dialog kept it.
    const { html, text } = skipDialog(sim, first);
    expect(skipButton(html)).toContain('disabled=""');
    expect(text).toContain('Skip: Pick an event from the list.');
    expect(text).toContain('Lunch');
  });

  it('says nothing more with the first event picked, as it opens', () => {
    const { sim } = twoPlans('whynot-time-skip-open');
    const { html, text } = skipDialog(sim);
    expect(skipButton(html)).not.toContain('disabled');
    expect(skipButton(html)).toContain('Skip To Gym');
    expect(text).not.toMatch(/Skip: |Not now/);
  });

  it('says there’s nothing ahead, in the list’s place, once, with nothing on the calendar', () => {
    const sim = quickSave({}, 'whynot-time-skip-empty');
    // TEST SETUP: everything ahead that Skip To Event would offer, taken off the calendar.
    for (const t of skipTargets(sim, 1_000)) sim.timeline.cancel(t.item.id, sim.now);
    expect(skipTargets(sim, 14)).toEqual([]);
    const { html, text } = skipDialog(sim);
    expect(skipButton(html)).toContain('disabled=""');
    expect(text).toContain('There’s nothing on your calendar ahead of you.');
    expect(text.split('There’s nothing on your calendar ahead of you.').length - 1).toBe(1);
    expect(text).not.toMatch(/Skip: |Not now/);
  });
});
