/**
 * A phone turned upright (from 2026-10-23, the owner's brief 23, section 2; `src/ui/shell/turn.tsx`): the game paused
 * while it's upright and held there, paused when it's back on its side until Play, with the minutes upright never added
 * on, and nothing said of a clock that was already paused. The real provider's live clock is driven by faked timers, as
 * `tests/time-controls.test.ts` drives it, and the phone's turn is what the frame reads from the device
 * (`UprightContext`). What a phone is, and upright, is `readDevice`'s, read here from stand-in devices.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, from Monday 24 August 2026 at 7:30 AM, the
 * clock live, turned upright and back with the bar drawn.
 *
 * FIXTURE: `tests/time-controls.test.ts`'s, copied here: react-dom/server keeps no state and runs no effects, so React's
 * part is played by hand, and the page's window and timers are stand-ins (the timers faked).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { serialise } from '@/engine/persistence/adapter';

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
const { UprightContext, usePauseWhileUpright, readDevice, askLandscapeOnce, PAUSED_WHILE_UPRIGHT, PHONE_SHORT_SIDE } = await import('@/ui/shell/turn');
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

/** What the turn's frame tells the game: whether the phone is upright (`TurnFrame` reads it from the device). */
const turned = { upright: false };
/** The shell's part: the pause while upright (`GameShell` calls it). */
function Paused() { usePauseWhileUpright(); return null; }
/** The bar over a life, under the real provider, the guide and the help, its timers faked, the phone's turn given. */
function bar(sim: Simulation) {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
  h.real = actual as never;
  h.sim = sim;
  windowAt('#/home');
  return mounted(() => provider(sim, createElement(UprightContext.Provider, { value: turned.upright },
    createElement(GuideProvider, null, createElement(HelpProvider, null, createElement(Paused), createElement(TimeControls), createElement(Toasts))))));
}
/** The toasts the provider holds, as the shell lists them. */
function Toasts() {
  const { toasts } = useGame();
  return createElement('ul', { 'aria-label': 'Toasts' }, toasts.map((t) => createElement('li', { key: t.id }, `${t.tone}: ${t.message}`)));
}

describe('A phone upright pauses the game, and it stays paused until Play', () => {
  afterEach(() => { turned.upright = false; });

  it('PLAYER JOURNEY: live, turned upright: paused through the command and held, a minute upright moves nothing; turned back: still paused, said once; Play goes on from then, the minutes upright never added', () => {
    const sim = student('b23-turn-live');
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    const p = bar(sim);
    const start = sim.now;
    vi.advanceTimersByTime(5_000);
    expect(sim.now).toBe(start + 5_000);

    const sent = vi.spyOn(sim, 'execute');
    turned.upright = true;
    p.settle();
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    // Through the command Pause sends, once.
    expect(sent.mock.calls.filter(([c]) => c.kind === 'world.set_preferences').map(([c]) => c.payload)).toEqual([{ timeSpeed: 'paused' }]);
    const upright = serialise(sim.universe);
    vi.advanceTimersByTime(60_000);
    expect(sim.now).toBe(start + 5_000);
    expect(serialise(sim.universe)).toBe(upright);

    turned.upright = false;
    p.settle();
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    expect(p.text).toContain(PAUSED_WHILE_UPRIGHT);
    expect(p.has('Play')).toBe(true);
    vi.advanceTimersByTime(60_000);
    expect(sim.now).toBe(start + 5_000);

    p.press('Play');
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    vi.advanceTimersByTime(5_000);
    expect(sim.now).toBe(start + 10_000);
  });

  it('PLAYER JOURNEY: already paused by the player, turned upright and back: no command, nothing said, still paused', () => {
    const sim = student('b23-turn-paused');
    const p = bar(sim);
    p.press('Pause');
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    const sent = vi.spyOn(sim, 'execute');
    const was = sim.now;
    turned.upright = true;
    p.settle();
    vi.advanceTimersByTime(30_000);
    turned.upright = false;
    p.settle();
    expect(sent.mock.calls.filter(([c]) => c.kind === 'world.set_preferences')).toEqual([]);
    expect(p.text).not.toContain(PAUSED_WHILE_UPRIGHT);
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    expect(sim.now).toBe(was);
  });

  it('PLAYER JOURNEY: turned upright twice in a row: paused once, said once, and the second turn says nothing new', () => {
    const sim = student('b23-turn-twice');
    const p = bar(sim);
    turned.upright = true; p.settle();
    turned.upright = false; p.settle();
    const said = (p.text.match(/Paused while your phone was upright/g) ?? []).length;
    expect(said).toBe(1);
    turned.upright = true; p.settle();
    turned.upright = false; p.settle();
    expect((p.text.match(/Paused while your phone was upright/g) ?? []).length).toBe(said);
  });
});

describe('What a phone is, and upright, read from the device', () => {
  const device = (o: { coarse?: boolean; hover?: boolean; w: number; h: number; type?: string; angle?: number; portrait?: boolean }) => ({
    matchMedia: (q: string) => ({ matches: q === '(pointer: coarse)' ? !!o.coarse : q === '(hover: none)' ? !o.hover : q === '(orientation: portrait)' ? !!o.portrait : false }),
    screen: { width: o.w, height: o.h, ...(o.type ? { orientation: { type: o.type } } : {}) },
    ...(o.angle !== undefined ? { orientation: o.angle } : {}),
  });
  it('a phone on its side, upright, and as Safari reports it (the screen always upright in its figures)', () => {
    expect(readDevice(device({ coarse: true, w: 844, h: 390, type: 'landscape-primary' }))).toEqual({ phone: true, upright: false });
    expect(readDevice(device({ coarse: true, w: 390, h: 844, type: 'portrait-primary' }))).toEqual({ phone: true, upright: true });
    expect(readDevice(device({ coarse: true, w: 390, h: 844, type: 'landscape-secondary' }))).toEqual({ phone: true, upright: false });
    // Safari before 16.4: no screen.orientation, the older window.orientation.
    expect(readDevice(device({ coarse: true, w: 390, h: 844, angle: 90 }))).toEqual({ phone: true, upright: false });
    expect(readDevice(device({ coarse: true, w: 390, h: 844, angle: 0 }))).toEqual({ phone: true, upright: true });
    // Neither: the window's shape, the last resort.
    expect(readDevice(device({ coarse: true, w: 390, h: 844, portrait: true }))).toEqual({ phone: true, upright: true });
  });
  it('never a phone: a desktop window of any width, a tablet, a touch laptop, and a page that can’t say', () => {
    // A narrow desktop window: a fine pointer that hovers.
    expect(readDevice(device({ hover: true, w: 390, h: 844, type: 'portrait-primary' })).phone).toBe(false);
    // A tablet: touch, but its short side past a phone's.
    expect(readDevice(device({ coarse: true, w: 744, h: 1133, type: 'portrait-primary' })).phone).toBe(false);
    expect(readDevice(device({ coarse: true, w: PHONE_SHORT_SIDE + 1, h: 900, type: 'portrait-primary' })).phone).toBe(false);
    expect(readDevice(device({ coarse: true, w: PHONE_SHORT_SIDE, h: 900, type: 'portrait-primary' })).phone).toBe(true);
    // A touch laptop: a coarse pointer, and a laptop's screen.
    expect(readDevice(device({ coarse: true, hover: true, w: 1280, h: 800, type: 'landscape-primary' })).phone).toBe(false);
    // A phone with a stylus that hovers is still a phone.
    expect(readDevice(device({ coarse: true, hover: true, w: 412, h: 915, type: 'portrait-primary' }))).toEqual({ phone: true, upright: true });
    expect(readDevice(undefined)).toEqual({ phone: false, upright: false });
    expect(readDevice({})).toEqual({ phone: false, upright: false });
  });
  it('the keyboard up on a phone on its side changes nothing the read rests on', () => {
    // The window shorter by the keyboard, the screen and its orientation as they were.
    expect(readDevice(device({ coarse: true, w: 844, h: 390, type: 'landscape-primary', portrait: false })).upright).toBe(false);
  });
  it('the lock to landscape is asked for once, and its refusal is let go', async () => {
    const asked: string[] = [];
    const page = { screen: { orientation: { lock: (o: string) => { asked.push(o); return Promise.reject(new Error('not supported')); } } } };
    expect(askLandscapeOnce(page)).toBe(true);
    expect(askLandscapeOnce(page)).toBe(false);
    await Promise.resolve();
    expect(asked).toEqual(['landscape']);
  });
});
