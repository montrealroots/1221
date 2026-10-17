/**
 * Brief 14's cross-area pass (2026-10-17, the owner's "Complete Player-Facing Language And Tutorial Overhaul"): the
 * functional defects the writing areas found and couldn't settle alone, each fixed here and held
 * (`docs/verification/language-2026-10-17/crossarea/defects.md`).
 *
 * - The live clock, when a tick of it throws, pauses the save, says so, and offers Play; until then it stopped without a
 *   word and the top bar kept offering Pause (frame `defects.md` 1).
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actress at Yale in New Haven from Monday
 * 24 August 2026 at 7:30 AM. The page's live clock is the real `GameProvider` in a real React root (react-dom/client),
 * its commits run by React's own `act`, as `tests/evidence2-b01.test.ts` holds it; the top bar is drawn under the real
 * provider (react-dom/server). FIXTURE: the page's window, its document and the element React mounts into, which a node
 * test has none of (`environment: 'node'`), and the page's timers, faked; a fault in a move of the clock, a reactor of
 * time's passing registered to throw (`onPassage`), since no reactor the game has throws on a played life.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot } from 'react-dom/client';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { GameProvider, useGame, useWorld, type GameContextValue } from '@/app/game-context';
import { TimeControls } from '@/ui/shell/TimeControls';

const student = (seed: string): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** What the player reads: the markup with every title attribute taken out, then every tag, and its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------------------
// The live clock that throws
// ---------------------------------------------------------------------------

describe('the live clock when a tick throws', () => {
  const page = globalThis as Record<string, unknown>;
  const kept = { window: page.window, document: page.document, act: page.IS_REACT_ACT_ENVIRONMENT };
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
    const listens = { addEventListener: () => undefined, removeEventListener: () => undefined };
    // FIXTURE: the page's window and document. React's commit asks the window for the frame element it checks the focus
    // against, and the provider asks it for its timers, its address and its history.
    Object.assign(globalThis, {
      IS_REACT_ACT_ENVIRONMENT: true,
      window: {
        ...listens,
        setInterval: (f: () => void, ms: number) => setInterval(f, ms),
        clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
        setTimeout: (f: () => void, ms: number) => setTimeout(f, ms),
        location: { hash: '' },
        history: { replaceState: () => undefined, pushState: () => undefined, back: () => undefined },
        HTMLIFrameElement: class {},
      },
      document: { ...listens, visibilityState: 'visible', activeElement: null },
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    for (const key of ['window', 'document'] as const) {
      if (kept[key] === undefined) delete page[key]; else page[key] = kept[key];
    }
    if (kept.act === undefined) delete page.IS_REACT_ACT_ENVIRONMENT; else page.IS_REACT_ACT_ENVIRONMENT = kept.act;
  });

  /**
   * The real provider over a save in a real React root, as the page holds it; `live` is its value as its children have
   * it, `shown` every toast it has put up, by its id, as a toast is taken down again seven seconds on, and `read` the
   * clock as a screen reads the world (`useWorld`).
   */
  function onPage(sim: Simulation): { live: () => GameContextValue; shown: () => { message: string; tone: string }[]; read: () => number; wait: (ms: number) => void; unmount: () => void } {
    let live: GameContextValue | undefined;
    let read = Number.NaN;
    const shown = new Map<number, { message: string; tone: string }>();
    const Child = () => {
      live = useGame();
      read = useWorld((s) => s.now);
      for (const t of live.toasts) shown.set(t.id, { message: t.message, tone: t.tone });
      return null;
    };
    const listens = { addEventListener: () => undefined, removeEventListener: () => undefined };
    const element = { nodeType: 1, tagName: 'DIV', namespaceURI: 'http://www.w3.org/1999/xhtml', textContent: '', ...listens, ownerDocument: { ...listens } };
    const root = createRoot(element as never);
    act(() => root.render(createElement(GameProvider, { sim, adapter: { save: async () => undefined } as never, onExit: () => undefined, children: createElement(Child) })));
    return {
      live: () => live!,
      shown: () => [...shown.values()],
      read: () => read,
      // A second at a time, each tick's render committed before the next, as a browser runs React's work between them.
      wait: (ms: number) => { for (let s = 0; s < ms; s += 1_000) act(() => { vi.advanceTimersByTime(1_000); }); },
      unmount: () => act(() => root.unmount()),
    };
  }
  /** The top bar's words, drawn under the real provider over the save as it stands. */
  const bar = (sim: Simulation) => onScreen(renderToStaticMarkup(createElement(GameProvider, { sim, adapter: { save: async () => undefined } as never, onExit: () => undefined, children: createElement(TimeControls) })));
  const SAID = 'An error in the game stopped the clock, so it’s paused. Anything that happened before it stopped still stands. You can press Play to try again.';

  it('PLAYER JOURNEY: a tick that throws pauses the save, says so once, and the top bar offers Play; Play pressed is one more try, a second failure pauses it again with one more toast and no loop, and a third press runs the clock', () => {
    const sim = student('xarea-clock');
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    // FIXTURE: a reactor of time's passing that throws on the next move of the clock while `faults` is above nothing.
    let faults = 0;
    sim.onPassage('test.fault', () => { if (faults > 0) { faults -= 1; throw new Error('boom'); } });
    const start = sim.now;
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    const held = onPage(sim);
    held.wait(3_000);
    expect(sim.now).toBe(start + 3_000);
    expect(bar(sim)).toMatch(/^Pause Sleep /);

    // The fourth second's move throws, and the fifth second's tick comes before React has drawn the pause: the clock is
    // where the fourth's move left it, the screens read it there, and a minute on it hasn't moved.
    faults = 1;
    act(() => { vi.advanceTimersByTime(2_000); });
    const stoppedAt = sim.now;
    expect(stoppedAt).toBe(start + 4_000);
    expect(held.read()).toBe(stoppedAt);
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    expect(held.shown()).toEqual([{ message: SAID, tone: 'negative' }]);
    expect(logged.mock.calls.map((c) => String(c[0]))).toEqual(['Error: boom']);
    held.wait(60_000);
    expect(sim.now).toBe(stoppedAt);
    // The bar says Play, the way to try again, and Pause is gone from it.
    expect(bar(sim)).toMatch(/^Play Sleep /);
    expect(bar(sim)).not.toMatch(/\bPause\b/);

    // Play pressed, and the move throws again: paused again, one toast more, and a minute on, nothing more.
    faults = 1;
    act(() => { held.live().run('world.set_preferences', { timeSpeed: 'live' }, { silent: true }); });
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    held.wait(1_000);
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    held.wait(60_000);
    expect(held.shown().map((t) => t.message)).toEqual([SAID, SAID]);
    expect(logged.mock.calls).toHaveLength(2);
    expect(sim.now).toBe(stoppedAt + 1_000);

    // Play pressed with nothing wrong: the clock runs, a second a second, and nothing more is said.
    act(() => { held.live().run('world.set_preferences', { timeSpeed: 'live' }, { silent: true }); });
    held.wait(5_000);
    expect(sim.now).toBe(stoppedAt + 6_000);
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    expect(held.shown().map((t) => t.message)).toEqual([SAID, SAID]);
    held.unmount();
  });
});
