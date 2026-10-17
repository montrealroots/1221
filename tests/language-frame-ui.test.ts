/**
 * The frame's words on its screens, read as the player has them (from 2026-10-17, the owner's brief 14, "Complete
 * Player-Facing Language And Tutorial Overhaul": its frame area, `docs/verification/language-2026-10-17/frame/`).
 *
 * The screens are drawn under the real `GameProvider` (react-dom/server), so a press runs the save's own command through
 * the provider's own `run` and its toast. A button pressed is the component's own onClick, kept on its way through the
 * JSX runtime; what a press sets in React state (a dialog opened, a toast shown) is kept by the order its useState is
 * called in and given back on the next render, as React would. The words are held word for word in each variant.
 *
 * FIXTURE: the page's `window`, which a node test has none of (`environment: 'node'`): the provider's toast sets a timer
 * to take itself down, and nothing here waits for it.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';

const h = vi.hoisted(() => ({
  /** Each useState in render order: its number this render, what a press set, and what's given back next render. */
  calls: 0,
  sets: [] as { at: number; value: unknown }[],
  given: new Map<number, unknown>(),
  /** The buttons drawn, with their words and their own onClick. */
  buttons: [] as { text: string; onClick?: () => unknown; disabled?: boolean }[],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const i = h.calls++;
    const [value] = real.useState(initial);
    const now = h.given.has(i) ? h.given.get(i) : value;
    const set = (action: unknown) => { h.sets.push({ at: i, value: typeof action === 'function' ? (action as (v: unknown) => unknown)(now) : action }); };
    return [now, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepButtons = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children), onClick: props.onClick as (() => unknown) | undefined, disabled: Boolean(props.disabled) });
    return make(type, props, ...rest);
  };
  return {
    ...real,
    ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}),
    ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}),
  };
};
vi.mock('react/jsx-runtime', async (orig) => keepButtons(await orig<Record<string, unknown>>()));
vi.mock('react/jsx-dev-runtime', async (orig) => keepButtons(await orig<Record<string, unknown>>()));

const { GameProvider, useGame } = await import('@/app/game-context');
type Game = ReturnType<typeof useGame>;

const page = globalThis as unknown as Record<string, unknown>;
const kept = page.window;
beforeAll(() => { page.window = { setTimeout: () => 0, clearTimeout: () => undefined, location: { hash: '' }, history: { pushState: () => undefined } }; });
afterAll(() => { if (kept === undefined) delete page.window; else page.window = kept; });
beforeEach(() => { h.given = new Map(); });

/** The words a player reads: titles out, tags out, entities back, spaces closed. */
const words = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();

/** A screen under the real provider, with what a press set given back; and the provider's value as its children have it. */
function drawn(sim: Simulation, screen: FunctionComponent = () => null): { html: string; text: string; game: Game } {
  h.calls = 0;
  h.sets = [];
  h.buttons = [];
  let game: Game | undefined;
  const Child = () => { game = useGame(); return createElement(screen); };
  const html = renderToStaticMarkup(createElement(GameProvider, { sim, adapter: { save: async () => undefined } as never, onExit: () => undefined, children: createElement(Child) as ReactNode }))
    .replace(/<!-- -->/g, '');
  return { html, text: words(html), game: game! };
}
/** The toasts a call put up, from what it set. */
const toasted = (): { message: string; tone: string }[] => h.sets.flatMap((s) => (Array.isArray(s.value) && s.value.every((t) => t && typeof t === 'object' && 'message' in t) ? (s.value as { message: string; tone: string }[]).map(({ message, tone }) => ({ message, tone })) : []));

describe('the provider’s own words', () => {
  it('says a command’s fault in words, its detail in the console, and a refusal in the world’s own; and a clock that threw in words', () => {
    const sim = quickSave({}, 'frame-provider');
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    sim.onCommand('test.fault', () => { throw new Error('boom'); });
    let { game } = drawn(sim);
    h.sets = [];
    const r = game.run('test.fault');
    expect(r.ok).toBe(false);
    expect(toasted().at(-1)).toEqual({ message: 'That didn’t go through because of an error in the game. It changed nothing and charged you nothing, so you can carry on from here.', tone: 'negative' });
    expect(logged.mock.calls.map((c) => String(c[0]))).toEqual(['test.fault failed: boom']);

    ({ game } = drawn(sim));
    h.sets = [];
    game.run('world.set_preferences', { timeSpeed: 'fast' });
    expect(toasted().at(-1)).toEqual({ message: 'The clock can only be set to Play or Pause.', tone: 'negative' });

    // The clock asked backwards throws in the engine (`advanceTo`): the toast says it in words, the message goes to the console.
    ({ game } = drawn(sim));
    h.sets = [];
    const before = sim.now;
    expect(game.advanceTo(sim.now - 60_000)).toBeUndefined();
    expect(sim.now).toBe(before);
    expect(toasted().at(-1)).toEqual({ message: 'An error in the game stopped the clock. Anything that happened before it stopped still stands. You can try moving the clock again.', tone: 'negative' });
    expect(String(logged.mock.calls.at(-1)?.[0])).toMatch(/Refusing to move the world clock backwards/);
    logged.mockRestore();
  });
});
