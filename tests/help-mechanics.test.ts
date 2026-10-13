/**
 * The guide’s reference, pressed (from 2026-10-13; `src/ui/guide/Help.tsx`, `HowItWorks.tsx`, `Guide.tsx`). The guide
 * audit of that day found its rules held only by a scan of the source for `run(` and by the engine’s readers called on
 * their own (`tests/guide.test.ts`), and the live clock’s hold by nothing in the gate. Here the real components are
 * drawn and their own handlers pressed.
 *
 * - Reading help runs no command and leaves the save as it was: How This Works, a link to a connected entry, Back, a
 *   search, Show Everything, Show Me Where, Back To Help and Close, on a live life. `run` is never called, the save
 *   (`serialise`) is the same to the byte and the clock (`sim.now`) to the millisecond. Show Me Where asks `navigate`
 *   once, for the entry’s own screen and tab, and Back To Help draws the trail it left, the entry on top.
 * - The address names the entry on top and keeps the screen. A reload or a link to a screen opens that screen, at the
 *   tab it names, with any entry it names open over it. Until 2026-10-13 the help’s address effect, which React runs
 *   before the game’s (a child’s before its parent’s), wrote Home over it, and Home opened.
 * - A top-bar menu that How This Works was opened from stays open under the help: the help’s Close, pressed, and
 *   Escape go to the help alone. Until 2026-10-13 either one closed the menu too.
 * - The live clock’s hold: the real `GameProvider` over a live save, the help open, holds `sim.now` and the save for a
 *   minute; closed, the clock moves five seconds in five. The same for the guide’s own dialog.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actor at Yale in
 * New Haven, played a day on the clock (`advanceTo`) before the help is opened.
 *
 * FIXTURE: these run with no page (`environment: 'node'`), and react-dom/server keeps no state between renders and
 * runs no effects, so React’s part is played here. Each component’s state, refs and memos are kept between renders by
 * the component that asked for them and the order it asked, as React keeps them by position (the component read off
 * the call’s stack), and dropped when it isn’t drawn; a press is the element’s own handler, its state changes applied
 * and the tree drawn again; the effects whose dependencies changed are let go and run again, a child’s before its
 * parent’s, as React’s commit runs them. The page’s window and document are stand-ins that hold the address, its
 * history and the listeners, and a menu’s anchor is given a stand-in element, which a server render never attaches.
 * Each component here is drawn once at a time, which the keeping by name relies on.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY } from '@/engine/core/time';
import { serialise } from '@/engine/persistence/adapter';
import { GUIDE_BY_ID, search } from '@/engine/content/guide';
import { kept } from '@/ui/kept';

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
const { HowItWorks } = await import('@/ui/guide/HowItWorks');
const { GuideProvider, GuideButton } = await import('@/ui/guide/Guide');
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
/** The help’s trail as it reads, breadcrumb by breadcrumb. */
const trailOf = (html: string) => onScreen(/<nav[^>]*aria-label="Help Trail"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? '');
const helpOpen = (html: string) => html.includes('The clock waits while you read.');

// ---------------------------------------------------------------------------

describe('reading help', () => {
  it('PLAYER JOURNEY: How This Works, a link, Back, a search, Show Everything, Show Me Where, Back To Help and Close run no command, leave the save and the clock as they were, and go to the entry’s own screen and tab', () => {
    const sim = student('help-journey');
    sim.advanceTo(sim.now + MS_DAY);
    h.sim = sim;
    const before = serialise(sim.universe);
    const at = sim.now;
    const { location } = windowAt('#/workspace/school');
    const p = mounted(() => createElement(GuideProvider, null, createElement(HelpProvider, null, createElement(HowItWorks, { help: 'coursework.partners' }))));
    expect(helpOpen(p.html)).toBe(false);
    expect(h.held.at(-1)).toEqual(['help', false]);

    // How This Works beside the partner’s rehearsals: the entry, over the screen, its name in the address.
    p.press('How This Works: Rehearsing With A Partner');
    expect(helpOpen(p.html)).toBe(true);
    expect(trailOf(p.html)).toBe('Contents › Rehearsing With A Partner');
    expect(location.hash).toBe('#/workspace/school?help=coursework.partners');
    expect(h.held.at(-1)).toEqual(['help', true]);

    // A connected entry, and Back.
    p.press('Preparing Coursework');
    expect(trailOf(p.html)).toBe('Contents › Rehearsing With A Partner › Preparing Coursework');
    expect(location.hash).toBe('#/workspace/school?help=coursework.prepare');
    p.press('Back');
    expect(trailOf(p.html)).toBe('Contents › Rehearsing With A Partner');

    // A search, from the entry, and its first finding.
    p.type('help-q', 'transfer');
    p.submit();
    expect(trailOf(p.html)).toBe('Contents › Rehearsing With A Partner › Search: transfer');
    expect(location.hash).toBe('#/workspace/school');
    p.press('A Card’s Offers');
    expect(trailOf(p.html)).toBe('Contents › Rehearsing With A Partner › Search: transfer › A Card’s Offers');
    p.press('Show Everything');
    expect(p.has('Fold It Up')).toBe(true);
    expect(p.html).toMatch(/<details class="help-section" open="">/);

    // Show Me Where: the entry’s screen and tab (Your Bank, The Cards Tab), once, the help closed and its trail kept.
    const trail = trailOf(p.html);
    p.press('Show Me Where');
    expect(h.navigated).toEqual(['/workspace/bank?tab=cards']);
    expect(helpOpen(p.html)).toBe(false);
    expect(location.hash).toBe('#/workspace/bank');
    expect(h.held.at(-1)).toEqual(['help', false]);
    p.press('Back To Help');
    expect(helpOpen(p.html)).toBe(true);
    expect(trailOf(p.html)).toBe(trail);
    expect(location.hash).toBe('#/workspace/bank?help=bank.card-offers');
    expect(p.has('Back To Help')).toBe(false);

    // Close, and nothing was asked of the world.
    p.press('Close');
    expect(helpOpen(p.html)).toBe(false);
    expect(p.has('Back To Help')).toBe(false);
    expect(location.hash).toBe('#/workspace/bank');
    expect(h.held.at(-1)).toEqual(['help', false]);
    expect(h.runs).toEqual([]);
    expect(h.navigated).toHaveLength(1);
    expect(sim.now).toBe(at);
    expect(serialise(sim.universe)).toBe(before);
  });

  // `tools/acceptance-ui.mjs` plays Show Me Where from Money’s Accounts tab to this entry, which “transfer” finds, and
  // states where it lands, as a plain script can’t read the guide. Held to the guide here.
  it('finds A Card’s Offers for “transfer”, on Your Bank’s Cards tab, as the acceptance run states', () => {
    expect(search('transfer').map((e) => e.title)).toContain('A Card’s Offers');
    expect(GUIDE_BY_ID['bank.card-offers']!.title).toBe('A Card’s Offers');
    expect(GUIDE_BY_ID['bank.card-offers']!.where).toMatchObject({ route: '/workspace/bank', tab: 'cards' });
  });

  describe('opened from a top-bar menu', () => {
    for (const [menu, name, how] of [
      ['Advance ▾', 'Advance Time', 'How This Works: Moving Time On'],
      ['Look After Yourself ▾', 'Look After Yourself', 'How This Works: Looking After Yourself'],
    ] as const) {
      it(`leaves the ${name} menu open under it: the help’s Close and Escape are the help’s alone`, () => {
        h.sim = student(`help-menu-${name}`);
        const { send } = windowAt('#/home');
        const p = mounted(() => createElement(GuideProvider, null, createElement(HelpProvider, null, createElement(TimeControls))));
        const menuOpen = () => p.html.includes(`role="menu" aria-label="${name}"`);
        p.press(menu);
        expect(menuOpen()).toBe(true);

        // Pressed: the mouse goes down on the help’s Close, outside the menu, and the click closes the help.
        p.press(how);
        expect(helpOpen(p.html)).toBe(true);
        send('mousedown', { target: {} });
        p.settle();
        expect(menuOpen()).toBe(true);
        p.press('Close');
        expect(helpOpen(p.html)).toBe(false);
        expect(menuOpen()).toBe(true);

        // Escape, the same.
        p.press(how);
        send('keydown', { key: 'Escape' });
        p.settle();
        expect(helpOpen(p.html)).toBe(false);
        expect(menuOpen()).toBe(true);

        // With no dialog over it, the menu is the one Escape and a press outside it close.
        send('keydown', { key: 'Escape' });
        p.settle();
        expect(menuOpen()).toBe(false);
        p.press(menu);
        send('mousedown', { target: h.inside });
        p.settle();
        expect(menuOpen()).toBe(true);
        send('mousedown', { target: {} });
        p.settle();
        expect(menuOpen()).toBe(false);
        p.unmount();
      });
    }
  });
});

describe('the address', () => {
  /** Where the real provider says the player is. */
  function Where() {
    const { route } = useGame();
    return createElement('p', null, `On ${route}`);
  }
  const game = (sim: Simulation) => () => provider(sim, createElement(GuideProvider, null, createElement(HelpProvider, null, createElement(Where))));

  it('PLAYER JOURNEY: a reload or a link to School’s Coursework opens School at Coursework, not Home', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
    h.real = actual as never;
    const sim = student('help-address');
    h.sim = sim;
    const { location, history } = windowAt('#/workspace/school?tab=coursework');
    const p = mounted(game(sim));
    expect(p.text).toContain('On /workspace/school');
    expect(location.hash).toBe('#/workspace/school');
    expect(history.state).toEqual({ route: '/workspace/school' });
    expect(kept('tab:/workspace/school')).toBe('coursework');
    expect(helpOpen(p.html)).toBe(false);
    p.unmount();
  });

  it('a link naming an entry opens School with Repeating, Extra Terms And Incompletes over it, and keeps both in the address', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
    h.real = actual as never;
    const sim = student('help-address-entry');
    h.sim = sim;
    const { location, history } = windowAt('#/workspace/school?help=school.repeat');
    const p = mounted(game(sim));
    expect(p.text).toContain('On /workspace/school');
    expect(helpOpen(p.html)).toBe(true);
    expect(trailOf(p.html)).toBe('Contents › Repeating, Extra Terms And Incompletes');
    expect(location.hash).toBe('#/workspace/school?help=school.repeat');
    expect(history.state).toEqual({ route: '/workspace/school' });
    // Closed, the address is the screen’s own.
    p.press('Close');
    expect(location.hash).toBe('#/workspace/school');
    expect(p.text).toContain('On /workspace/school');
    p.unmount();
  });
});

describe('a link to a place on the page', () => {
  /** Where the real provider says the player is. */
  function Where() {
    const { route } = useGame();
    return createElement('p', null, `On ${route}`);
  }

  it('PLAYER JOURNEY: an address that names no screen, as Skip To Content’s #main did, leaves School where it is, not Home', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
    h.real = actual as never;
    const sim = student('help-address-fragment');
    h.sim = sim;
    const { location, history, send } = windowAt('#/workspace/school');
    const p = mounted(() => provider(sim, createElement(GuideProvider, null, createElement(HelpProvider, null, createElement(Where)))));
    expect(p.text).toContain('On /workspace/school');
    // The browser's own move to a fragment: the address names a place on the page, and popstate comes with no state.
    location.hash = '#main';
    history.state = null;
    send('popstate', { state: null });
    p.settle();
    expect(p.text).toContain('On /workspace/school');
    expect(p.text).not.toContain('On /home');
    // Back to a screen the game wrote is still followed.
    location.hash = '#/home';
    history.state = { route: '/home' };
    send('popstate', { state: { route: '/home' } });
    p.settle();
    expect(p.text).toContain('On /home');
    p.unmount();
  });
});

describe('the live clock’s hold', () => {
  it('PLAYER JOURNEY: with the help open a minute passes and the clock and the save don’t move; closed, five seconds move it five; the guide’s own dialog the same', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
    h.real = actual as never;
    const sim = student('help-hold');
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    h.sim = sim;
    windowAt('#/home');
    const p = mounted(() => provider(sim,
      createElement(GuideProvider, null, createElement(HelpProvider, null, createElement(HowItWorks, { help: 'day.clock' }), createElement(GuideButton)))));
    const start = sim.now;

    // Live, nothing open: five seconds move it five.
    vi.advanceTimersByTime(5_000);
    expect(sim.now).toBe(start + 5_000);

    // The help open: a minute, and the clock and the save the same.
    p.press('How This Works: The Clock: Play And Pause');
    expect(helpOpen(p.html)).toBe(true);
    const open = serialise(sim.universe);
    vi.advanceTimersByTime(60_000);
    expect(sim.now).toBe(start + 5_000);
    expect(serialise(sim.universe)).toBe(open);

    // Closed: five seconds move it five.
    p.press('Close');
    expect(helpOpen(p.html)).toBe(false);
    vi.advanceTimersByTime(5_000);
    expect(sim.now).toBe(start + 10_000);

    // The guide’s own dialog: a minute held, and five seconds once it’s closed.
    p.press('Guide');
    expect(p.html).toContain('aria-label="Guide"');
    const reading = serialise(sim.universe);
    vi.advanceTimersByTime(60_000);
    expect(sim.now).toBe(start + 10_000);
    expect(serialise(sim.universe)).toBe(reading);
    p.press('Close');
    expect(p.html).not.toContain('aria-label="Guide"');
    vi.advanceTimersByTime(5_000);
    expect(sim.now).toBe(start + 15_000);
    p.unmount();
  });
});
