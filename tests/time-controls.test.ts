/**
 * The top bar's time dialogs, pressed (from 2026-10-20, the owner's brief 19, D1, D2, D4 and D5, which are brief 18's
 * S1, S2, S4 and S5; the record is `docs/verification/career-2026-10-20/time/`). The real components are drawn under the
 * real `GameProvider` and their own handlers pressed, as `tests/help-mechanics.test.ts` draws the help.
 *
 * - D4: the Sleep dialog holds the live clock while it's open: a minute open moves nothing; Not Yet lets it go on from
 *   where it was; a sleep moves it as the night does, and the live clock goes on from the wake. On The Way and Skip To
 *   Event hold it too.
 * - D1: at a plan of your own the stop says what Skip It and Stand Here do to the jump, and does it: Skip It, pressed,
 *   carries the jump on to the next stop; a Skip It that's refused leaves the stop open and says why.
 * - D2: the Advance menu at 2 AM shows Tomorrow Morning landing at seven that same date, with its day, and lands there.
 * - D5: One Week from a Friday evening asks first, and lists the next week's classes, not on the calendar yet.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actor at Yale in New
 * Haven, from Monday 24 August 2026 at 7:30 AM, played on by the clock with every stop gone to (Go) before the bar is
 * drawn, and plans put on the calendar with `calendar.schedule`, as the Calendar's form puts them.
 *
 * FIXTURE: as `tests/help-mechanics.test.ts`'s, copied here: react-dom/server keeps no state and runs no effects, so
 * React's part is played by hand, each component's state and effects kept by its name and order, and the page's window
 * and timers are stand-ins (the timers faked).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_HOUR, formatDateTime, instantFromZoned } from '@/engine/core/time';
import { serialise } from '@/engine/persistence/adapter';
import { plural } from '@/engine/core/text';
import { suggestedSleep } from '@/engine/systems/life';
import { answerStop } from '@/engine/world/clock';
import { skipTargets } from '@/engine/world/calendar';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { CHAPTER_BY_ID } from '@/engine/content/tutorial';


type Deps = readonly unknown[] | undefined;

const h = vi.hoisted(() => {
  /** The component a hook was asked for by: the nearest frame on its call’s stack with a component’s name. */
  const caller = (): string => {
    for (const line of (new Error().stack ?? '').split('\n').slice(1)) {
      const m = /^\s*at (?:[\w$]+\.)*([A-Z][\w$]*) \(/.exec(line);
      if (m) return m[1]!;
    }
    return '?';
  };
  return {
    caller,
    sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
    /** FIXTURE: what React keeps between renders, by component and order. */
    states: new Map<string, unknown>(),
    setters: new Map<string, (next: unknown) => void>(),
    refs: new Map<string, { current: unknown }>(),
    memos: new Map<string, { value: unknown; deps: readonly unknown[] | undefined }>(),
    /** The state changes asked for since the last render, in order. */
    pending: [] as [string, unknown][],
    /** This render’s: the components in the order they were drawn, each one’s hooks asked so far, the keys used. */
    order: [] as string[],
    asked: new Map<string, number>(),
    used: new Set<string>(),
    effects: new Map<string, { from: string; run: () => unknown; deps: readonly unknown[] | undefined }>(),
    /** Every element drawn with a handler: its words, its label, its id and its props. */
    elements: [] as { type: string; text: string; label?: string; id?: string; props: Record<string, unknown> }[],
    /** What the help asked of the game: commands run, screens gone to, holds on the clock. */
    runs: [] as string[],
    navigated: [] as string[],
    held: [] as [string, boolean][],
    /** While set, `useGame` and `useWorld` are the real provider’s (`GameProvider`, taken with `importActual`). */
    real: undefined as undefined | { useGame: () => unknown; useWorld: (read: (s: never) => unknown, deps?: readonly unknown[]) => unknown },
    /** The element a menu’s anchor stands for (FIXTURE): it contains only what’s pressed inside it. */
    inside: { tagName: 'BUTTON' } as object,
  };
});

/** This hook’s key: the component asking, and how many it has asked before it in this render. */
const keyFor = (): [string, string] => {
  const from = h.caller();
  if (!h.order.includes(from)) h.order.push(from);
  const n = h.asked.get(from) ?? 0;
  h.asked.set(from, n + 1);
  const key = `${from}:${n}`;
  h.used.add(key);
  return [from, key];
};
const same = (a: Deps, b: Deps) => a !== undefined && b !== undefined && a.length === b.length && a.every((d, i) => Object.is(d, b[i]));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [first] = real.useState(initial);
    const [, key] = keyFor();
    if (!h.states.has(key)) h.states.set(key, first);
    let set = h.setters.get(key);
    if (!set) { set = (next: unknown) => { h.pending.push([key, next]); }; h.setters.set(key, set); }
    return [h.states.get(key), set];
  }) as typeof real.useState;
  const useRef = ((initial: unknown) => {
    const [, key] = keyFor();
    if (!h.refs.has(key)) h.refs.set(key, { current: initial });
    return h.refs.get(key);
  }) as typeof real.useRef;
  const memo = (make: () => unknown, deps: Deps) => {
    const [, key] = keyFor();
    const was = h.memos.get(key);
    if (was && same(was.deps, deps)) return was.value;
    const value = make();
    h.memos.set(key, { value, deps });
    return value;
  };
  const useMemo = memo as typeof real.useMemo;
  const useCallback = ((fn: unknown, deps: Deps) => memo(() => fn, deps)) as typeof real.useCallback;
  const useEffect = ((run: () => unknown, deps: Deps) => {
    const [from, key] = keyFor();
    h.effects.set(key, { from, run, deps });
  }) as typeof real.useEffect;
  const hooks = { useState, useRef, useMemo, useCallback, useEffect };
  return { ...real, ...hooks, default: { ...real, ...hooks } };
});

const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepElements = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (typeof type === 'string' && props && (props.onClick || props.onSubmit || props.onChange)) {
      h.elements.push({ type, text: textOf(props.children), label: props['aria-label'] as string | undefined, id: props.id as string | undefined, props });
    }
    // A menu’s anchor, given its stand-in element (FIXTURE).
    if (props?.className === 'menu-anchor' && props.ref && typeof props.ref === 'object') {
      (props.ref as { current: unknown }).current = { contains: (node: unknown) => node === h.inside };
    }
    return make(type, props, ...rest);
  };
  return {
    ...real,
    ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}),
    ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}),
  };
};
vi.mock('react/jsx-runtime', async (orig) => keepElements(await orig<Record<string, unknown>>()));
vi.mock('react/jsx-dev-runtime', async (orig) => keepElements(await orig<Record<string, unknown>>()));

// Without the original: it imports the looks, which import it back. `run` is counted and `navigate` recorded; the
// address moves as the provider’s own `navigate` moves it (`app/game-context.tsx`). While `h.real` is set, the real
// provider’s own hooks answer instead.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => { h.runs.push(kind); return h.sim.execute({ kind, payload }); },
    navigate: (to: string) => {
      h.navigated.push(to);
      const next = to.split('?')[0]!;
      const w = (globalThis as { window?: Window }).window;
      if (w && w.location.hash !== `#${next}`) w.history.pushState({ route: next }, '', `#${next}`);
    },
    hold: (key: string, on: boolean) => { h.held.push([key, on]); },
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return {
    useGame: () => (h.real ? h.real.useGame() : game()),
    useWorld: <T,>(read: (s: Simulation) => T, deps?: readonly unknown[]) => (h.real ? h.real.useWorld(read as never, deps) : read(h.sim)),
  };
});


const { HelpProvider } = await import('@/ui/guide/Help');
const { GuideProvider } = await import('@/ui/guide/Guide');
const { TimeControls } = await import('@/ui/shell/TimeControls');
const { useGame } = await import('@/app/game-context');
const actual = await vi.importActual<typeof import('@/app/game-context')>('@/app/game-context');
const { GameProvider } = actual;

// ---------------------------------------------------------------------------
// The page: its window, and React’s part
// ---------------------------------------------------------------------------

const page = globalThis as Record<string, unknown>;
const kept0 = { window: page.window, document: page.document, HTMLElement: page.HTMLElement };
let live = new Map<string, { deps: Deps; cleanup?: () => void }>();
afterEach(() => {
  for (const { cleanup } of live.values()) cleanup?.();
  live = new Map();
  for (const m of [h.states, h.setters, h.refs, h.memos]) m.clear();
  h.pending = []; h.runs = []; h.navigated = []; h.held = []; h.real = undefined;
  vi.useRealTimers();
  for (const key of ['window', 'document', 'HTMLElement'] as const) {
    if (kept0[key] === undefined) delete page[key]; else page[key] = kept0[key];
  }
});

type Listener = (event: unknown) => void;
/** The page’s window and document (FIXTURE), at an address: the history writes the address, the listeners are kept. */
function windowAt(hash: string) {
  const on = { window: new Map<string, Set<Listener>>(), document: new Map<string, Set<Listener>>() };
  const listens = (where: keyof typeof on) => ({
    addEventListener: (type: string, l: Listener) => { on[where].set(type, (on[where].get(type) ?? new Set()).add(l)); },
    removeEventListener: (type: string, l: Listener) => { on[where].get(type)?.delete(l); },
  });
  const location = { hash };
  const history = {
    state: null as unknown,
    replaceState(state: unknown, _title: string, url: string) { history.state = state; location.hash = url.slice(url.indexOf('#')); },
    pushState(state: unknown, _title: string, url: string) { history.state = state; location.hash = url.slice(url.indexOf('#')); },
    back: () => undefined,
  };
  Object.assign(globalThis, {
    window: {
      ...listens('window'), location, history,
      setInterval: (f: () => void, ms: number) => setInterval(f, ms),
      clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
      setTimeout: (f: () => void, ms: number) => setTimeout(f, ms),
    },
    document: { ...listens('document'), visibilityState: 'visible', activeElement: null, contains: () => false },
    HTMLElement: class {},
  });
  /** An event as the page sends it: to the document’s listeners, then the window’s, the way it bubbles. */
  const send = (type: string, event: Record<string, unknown>) => {
    const e = { target: null, metaKey: false, ctrlKey: false, altKey: false, stopPropagation: () => undefined, preventDefault: () => undefined, ...event };
    for (const l of [...(on.document.get(type) ?? [])]) l(e);
    for (const l of [...(on.window.get(type) ?? [])]) l(e);
  };
  return { location, history, send };
}

/** The tree drawn once: the elements it drew, the effects it asked for, and what’s no longer drawn forgotten. */
function draw(tree: () => ReactElement): string {
  h.order = []; h.asked.clear(); h.used.clear(); h.effects.clear(); h.elements = [];
  const html = renderToStaticMarkup(tree());
  for (const m of [h.states, h.setters, h.refs, h.memos]) for (const key of [...m.keys()]) if (!h.used.has(key)) m.delete(key);
  return html;
}

/** React’s commit: what’s gone or changed let go, then what’s new or changed run, a child’s effects before its parent’s. */
function commit(): void {
  const again = [...h.effects].filter(([key, e]) => !same(live.get(key)?.deps, e.deps));
  for (const [key, was] of [...live]) {
    if (h.effects.has(key) && !again.some(([k]) => k === key)) continue;
    was.cleanup?.();
    live.delete(key);
  }
  const rank = (from: string) => -h.order.indexOf(from);
  for (const [key, e] of again.sort(([, a], [, b]) => rank(a.from) - rank(b.from))) {
    const cleanup = e.run();
    live.set(key, { deps: e.deps, cleanup: typeof cleanup === 'function' ? cleanup as () => void : undefined });
  }
}

/** What the player reads: the markup with every tag taken out. */
const onScreen = (html: string) => html.replace(/<!-- -->/g, '').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** A tree mounted as a page mounts it, and pressed as a player presses it. */
function mounted(tree: () => ReactElement) {
  let html = '';
  const settle = () => {
    for (let i = 0; i < 20; i += 1) {
      for (const [key, next] of h.pending.splice(0)) {
        if (h.states.has(key)) h.states.set(key, typeof next === 'function' ? (next as (was: unknown) => unknown)(h.states.get(key)) : next);
      }
      html = draw(tree);
      commit();
      if (!h.pending.length) return;
    }
    throw new Error('the page never settled');
  };
  settle();
  const find = (words: string) => {
    const b = h.elements.find((e) => e.type === 'button' && (e.text === words || e.label === words));
    expect(b, `a button reading “${words}”`).toBeDefined();
    return b!;
  };
  return {
    get html() { return html; },
    get text() { return onScreen(html); },
    has: (words: string) => h.elements.some((e) => e.type === 'button' && (e.text === words || e.label === words)),
    press(words: string) { (find(words).props.onClick as (e: unknown) => void)({ stopPropagation: () => undefined }); settle(); },
    type(id: string, value: string) {
      const input = h.elements.find((e) => e.type === 'input' && e.id === id);
      expect(input, `a field #${id}`).toBeDefined();
      (input!.props.onChange as (e: unknown) => void)({ target: { value } });
      settle();
    },
    submit() {
      const form = h.elements.find((e) => e.type === 'form');
      expect(form, 'a form').toBeDefined();
      (form!.props.onSubmit as (e: unknown) => void)({ preventDefault: () => undefined });
      settle();
    },
    settle,
    unmount() { for (const { cleanup } of live.values()) cleanup?.(); live = new Map(); },
  };
}

const student = (seed: string): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** The real provider over a save, as the app holds it, its saves going nowhere. */
const provider = (sim: Simulation, children: ReactElement) =>
  createElement(GameProvider, { sim, adapter: { save: async () => undefined } as never, onExit: () => undefined, children });

const NY = 'America/New_York';
const at = (month: number, day: number, hour: number, minute = 0) => instantFromZoned({ year: 2026, month, day, hour, minute }, NY);
/** A jump to `wanted` with every stop gone to, as the bar's Go carries it on: where the life is before the bar is drawn. */
function jump(sim: Simulation, wanted: number): void {
  let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
  while (r.interruptedBy) r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!;
}
/** The bar over a life, under the real provider, the guide and the help, its timers faked. */
function bar(sim: Simulation) {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
  h.real = actual as never;
  h.sim = sim;
  windowAt('#/home');
  return mounted(() => provider(sim, createElement(GuideProvider, null, createElement(HelpProvider, null, createElement(TimeControls), createElement(Toasts)))));
}
/** The toasts the provider holds, as the shell lists them. */
function Toasts() {
  const { toasts } = useGame();
  return createElement('ul', { 'aria-label': 'Toasts' }, toasts.map((t) => createElement('li', { key: t.id }, `${t.tone}: ${t.message}`)));
}
/** A line of the Advance menu pressed, by how its name begins. */
function line(p: ReturnType<typeof mounted>, name: string): string {
  p.press('Advance ▾');
  const b = h.elements.find((e) => e.type === 'button' && e.text.startsWith(name));
  expect(b, `${name} on the Advance menu`).toBeDefined();
  const text = b!.text;
  (b!.props.onClick as () => void)();
  p.settle();
  return text;
}
/** The words of the dialog named `name`, from its title to the end of its foot. */
function dialog(html: string, name: string): string {
  const i = html.indexOf(`aria-label="${name}"`);
  expect(i, `a dialog “${name}”`).toBeGreaterThanOrEqual(0);
  return onScreen(html.slice(html.lastIndexOf('<div class="overlay"', i)));
}

describe('D4: the dialogs that move the clock hold it', () => {
  it('PLAYER JOURNEY: with the Sleep dialog open a minute passes and the clock and the save don’t move; Not Yet, and five seconds move it five; Sleep moves it the hours, and the live clock goes on from the wake', () => {
    const sim = student('time-ui-hold');
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    const p = bar(sim);
    const start = sim.now;
    vi.advanceTimersByTime(5_000);
    expect(sim.now).toBe(start + 5_000);

    p.press('Sleep');
    expect(p.text).toContain('You’d Wake At');
    const open = serialise(sim.universe);
    vi.advanceTimersByTime(60_000);
    expect(sim.now).toBe(start + 5_000);
    expect(serialise(sim.universe)).toBe(open);

    p.press('Not Yet');
    expect(p.text).not.toContain('You’d Wake At');
    vi.advanceTimersByTime(5_000);
    expect(sim.now).toBe(start + 10_000);

    p.press('Sleep');
    const hours = suggestedSleep(sim).hours;
    vi.advanceTimersByTime(30_000);
    p.press(`Sleep ${plural(hours, 'Hour')}`);
    expect(p.text).not.toContain('You’d Wake At');
    expect(sim.now).toBe(start + 10_000 + hours * MS_HOUR);
    vi.advanceTimersByTime(5_000);
    expect(sim.now).toBe(start + 10_000 + hours * MS_HOUR + 5_000);

    // On The Way, before a week's jump: held while it's asked, and Cancel lets the clock go on.
    line(p, 'One Week');
    expect(p.text).toContain('On The Way');
    const asked = sim.now;
    vi.advanceTimersByTime(60_000);
    expect(sim.now).toBe(asked);
    p.press('Cancel');
    vi.advanceTimersByTime(5_000);
    expect(sim.now).toBe(asked + 5_000);

    // Skip To Event the same.
    line(p, 'Choose An Event');
    expect(p.text).toContain('Skip To Event');
    const choosing = sim.now;
    vi.advanceTimersByTime(60_000);
    expect(sim.now).toBe(choosing);
    p.press('Cancel');
    vi.advanceTimersByTime(5_000);
    expect(sim.now).toBe(choosing + 5_000);
    p.unmount();
    // And the guide says so, where it said until then that the Sleep dialog didn't stop the clock.
    expect(GUIDE_BY_ID['day.clock']!.short).toContain('It waits while the guide, this help, or the Sleep, On The Way or Skip To Event dialog is open.');
    expect(CHAPTER_BY_ID.clock!.body.join(' ')).toContain('The clock also waits while the Sleep, On The Way or Skip To Event dialog is open, so nothing moves while you decide.');
    expect(CHAPTER_BY_ID.sleep!.body.join(' ')).toContain('The clock waits while it’s open, so Not Yet leaves it where it was.');
  });
});

describe('D1 and D2: the stop on a night of two plans, and Tomorrow Morning at 2 AM', () => {
  /** Thursday 9:00 PM, paused, with a plan from 11:30 PM to 12:30 AM and another at 2:00 AM. */
  function night(seed: string) {
    const sim = student(seed);
    sim.must({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } });
    jump(sim, at(8, 27, 21));
    const late = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Meet Sam At The Station', at: at(8, 27, 23, 30), durationMinutes: 60 } }).id;
    const call = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Call Home', at: at(8, 28, 2), durationMinutes: 30 } }).id;
    return { sim, late, call, p: bar(sim) };
  }

  it('PLAYER JOURNEY: On The Way names Skip It and that the jump carries on; the stop says what Skip It and Stand Here each do; Skip It carries the jump to the second plan; Stand Here ends it there; at 2 AM Tomorrow Morning says seven that Friday and lands there', () => {
    const { sim, late, call, p } = night('time-ui-night');
    expect(line(p, 'Tomorrow Morning')).toBe('Tomorrow Morning7:00 AM · Friday, August 28, 2026');
    expect(dialog(p.html, 'On The Way')).toContain(`Moving the clock to Tomorrow Morning (${formatDateTime(at(8, 28, 7), NY)}) passes two commitments. The clock stops at each one so you can choose: press Go to be there and carry on, or Stand Here to stop the clock there. You can also skip a plan of your own, and the clock then carries on.`);
    p.press('Advance');
    expect(sim.now).toBe(at(8, 27, 23, 30));
    expect(dialog(p.html, 'Meet Sam At The Station')).toContain('Skip It marks your plan missed, at no cost but the plan, and the clock carries on to August 28, 2026 at 7:00 AM, stopping at the next commitment on the way. Stand Here keeps the clock paused here, and Meet Sam At The Station starts the next time it moves.');

    p.press('Skip It');
    expect(sim.timeline.get(late)!.status).toBe('missed');
    expect(sim.now).toBe(at(8, 28, 2));
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    expect(dialog(p.html, 'Call Home')).toContain('It’s 2:00 AM on August 28, 2026, and this needs you now.');

    p.press('Stand Here');
    expect(p.html).not.toContain('aria-label="Call Home"');
    expect(sim.now).toBe(at(8, 28, 2));
    expect(sim.timeline.get(call)!.status).toBe('pending');

    // At 2 AM: the coming morning, that same Friday, said before it's pressed. Until 2026-10-20 it read "7:00 AM ·
    // August 29, 2026" and went there, past Friday's ten o'clock.
    expect(line(p, 'Tomorrow Morning')).toBe('Tomorrow Morning7:00 AM · Friday, August 28, 2026');
    // Standing at the call, the move runs it at once and stops at nothing else: there's no On The Way to answer.
    expect(p.html).not.toContain('aria-label="On The Way"');
    expect(sim.now).toBe(at(8, 28, 7));
    expect(sim.timeline.get(call)!.status).toBe('done');
    p.unmount();
    // And the guide says what the stop and the line do.
    expect(CHAPTER_BY_ID.advance!.body.join(' ')).toContain('Skip It, on a plan of your own, and Call It Off, on a rehearsal with a partner, carry the jump on too.');
    expect(GUIDE_BY_ID['day.calendar']!.now).toContain('Skip It: your plan is marked missed, a notice says you didn’t go, and the clock carries on to where it was headed, stopping at the next commitment on the way.');
    expect(GUIDE_BY_ID['day.advance']!.interpret).toContain('After midnight, Tomorrow Morning is that same date’s 7:00 AM, the next seven to come.');
  });

  it('a Skip It that’s refused leaves the stop open, the clock where it stopped, and says why', () => {
    const { sim, late, p } = night('time-ui-refused');
    line(p, 'Tomorrow Morning');
    p.press('Advance');
    expect(sim.now).toBe(at(8, 27, 23, 30));
    // TEST SETUP: the plan settled before the press, as a second tab would find it.
    sim.timeline.get(late)!.status = 'done';
    p.press('Skip It');
    expect(sim.now).toBe(at(8, 27, 23, 30));
    expect(dialog(p.html, 'Meet Sam At The Station')).toContain('Stand Here');
    expect(p.text).toContain('negative: That’s already over: it was kept, missed or called off.');
    p.unmount();
  });
});

describe('D5: One Week from a Friday evening asks first', () => {
  it('PLAYER JOURNEY: On The Way lists the next week’s classes, not on the calendar yet, and Cancel leaves the clock; Skip To Event counts them on the way to a later event', () => {
    const sim = student('time-ui-week');
    sim.must({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } });
    jump(sim, at(8, 28, 17, 30));
    const p = bar(sim);
    line(p, 'One Week');
    const words = dialog(p.html, 'On The Way');
    // As brief 14's banking journey reads it, step 8 (`tools/playthroughs-ui.mjs`).
    expect(words).toMatch(/passes \w+ commitments?\. The clock stops at (?:it|each one) so you can choose/);
    expect(words).toContain(`Classes — ${formatDateTime(at(8, 31, 9), NY)}, not on your calendar yet`);
    expect(words).toContain(`Classes — ${formatDateTime(at(9, 4, 9), NY)}, not on your calendar yet`);
    expect(words).toContain('What isn’t on your calendar yet goes on it as the clock moves, before it comes.');
    const before = sim.now;
    p.press('Cancel');
    expect(sim.now).toBe(before);

    // Skip To Event: an event after Monday's nine o'clock counts Monday's classes on the way.
    const later = skipTargets(sim, 14).find((t) => t.item.at > at(8, 31, 9));
    expect(later, 'an event after Monday morning among the fourteen').toBeDefined();
    line(p, 'Choose An Event');
    const row = h.elements.find((e) => e.type === 'button' && e.text.startsWith(later!.entry.title) && e.text.includes('on the way'));
    expect(row, 'its row counts what’s on the way').toBeDefined();
    (row!.props.onClick as () => void)();
    p.settle();
    expect(dialog(p.html, 'Skip To Event')).toContain('Classes — August 31, 2026, not on your calendar yet');
    p.unmount();
    expect(GUIDE_BY_ID['day.advance']!.steps[1]).toContain('It lists the ones not on your calendar yet too, such as next week’s classes before the School puts them on it.');
  });
});
