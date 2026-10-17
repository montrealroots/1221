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
import { createSave, quickSave, refreshMeta } from '@/engine';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { courseworkOf, trustOf } from '@/engine/systems/coursework';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate, formatDateTime, formatTime, instantFromZoned } from '@/engine/core/time';
import { skipTargets } from '@/engine/world/calendar';

const h = vi.hoisted(() => ({
  /** Each useState in render order: its number this render, what a press set, and what's given back next render. */
  calls: 0,
  /** What each useState started at, this render, by its number. */
  inits: [] as unknown[],
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
    h.inits[i] = value;
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
const { TimeControls } = await import('@/ui/shell/TimeControls');
const { SaveSlots } = await import('@/ui/saves/SaveSlots');
const { GameShell } = await import('@/ui/shell/GameShell');
const { LocalSaveAdapter } = await import('@/engine/persistence/local');
const { PersistenceError, serialise } = await import('@/engine/persistence/adapter');
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
function drawn(sim: Simulation, screen: FunctionComponent = () => null, adapter: unknown = { save: async () => undefined }): { html: string; text: string; game: Game } {
  h.calls = 0;
  h.inits = [];
  h.sets = [];
  h.buttons = [];
  let game: Game | undefined;
  const Child = () => { game = useGame(); return createElement(screen); };
  const html = renderToStaticMarkup(createElement(GameProvider, { sim, adapter: adapter as never, onExit: () => undefined, children: createElement(Child) as ReactNode }))
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

/** A button just drawn, by its words or a pattern (the nth of them); fails if it isn't there. */
function button(said: string | RegExp, nth = 0) {
  const found = h.buttons.filter((b) => (typeof said === 'string' ? b.text === said : said.test(b.text)))[nth];
  expect(found, `a button “${String(said)}”`).toBeDefined();
  return found!;
}
/** Pressed: its own onClick, and what it set given back on the next render. */
function press(b: { onClick?: () => unknown }): void {
  h.sets = [];
  b.onClick!();
  for (const one of h.sets) h.given.set(one.at, one.value);
}
/** The words of the dialog drawn, from its title to the end of its foot. */
function dialog(html: string, name: string): string {
  const i = html.indexOf(`aria-label="${name}"`);
  expect(i, `a dialog “${name}”`).toBeGreaterThanOrEqual(0);
  return words(html.slice(html.lastIndexOf('<div class="overlay"', i)));
}
/** The calendar cleared of what wants the player, and a plan of the player's own put on it. TEST SETUP. */
function withPlan(seed: string, title: string, inHours: number): { sim: Simulation; at: number } {
  const sim = quickSave({}, seed);
  for (const i of sim.universe.scheduled) if (i.status === 'pending' && i.requiresPlayer) sim.timeline.cancel(i.id, sim.now);
  const at = sim.now + inHours * MS_HOUR;
  sim.must({ kind: 'calendar.schedule', payload: { title, at, durationMinutes: 60 } });
  return { sim, at };
}

describe('the top bar’s dialogs', () => {
  it('On The Way says how many commitments the clock stops at and what each stop offers, for one and for two', () => {
    const { sim } = withPlan('frame-on-the-way', 'Dinner', 30);
    drawn(sim, TimeControls);
    press(button('Advance ▾'));
    drawn(sim, TimeControls);
    press(button(/^One Week/));
    let said = dialog(drawn(sim, TimeControls).html, 'On The Way');
    const week = sim.now + 7 * MS_DAY;
    expect(said).toContain(`Moving the clock to One Week (${formatDateTime(week, sim.zone)}) passes one commitment, and the clock stops at each one. At each, you can go, or press Stand Here and the clock waits. A plan of your own can also be skipped, and a rehearsal with a partner called off, though at short notice that costs their trust.`);
    expect(said).toMatch(/Dinner — /);
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Gym', at: sim.now + 40 * MS_HOUR, durationMinutes: 60 } });
    h.given = new Map();
    drawn(sim, TimeControls);
    press(button('Advance ▾'));
    drawn(sim, TimeControls);
    press(button(/^One Week/));
    said = dialog(drawn(sim, TimeControls).html, 'On The Way');
    expect(said).toContain('passes two commitments, and the clock stops at each one.');
    expect(h.buttons.map((b) => b.text)).toEqual(expect.arrayContaining(['Cancel', 'Advance']));
  });

  it('the stop says it needs you now, what going takes, and what a plan of your own and the world’s own each offer', () => {
    const { sim, at } = withPlan('frame-due-now', 'Dinner', 2);
    let { game } = drawn(sim, TimeControls);
    h.sets = [];
    game.advanceTo(at + 3 * MS_HOUR);
    for (const one of h.sets) h.given.set(one.at, one.value);
    let shown = drawn(sim, TimeControls);
    let said = dialog(shown.html, 'Dinner');
    expect(said).toContain(`It’s ${formatTime(at, sim.zone)} on ${formatDate(at, sim.zone)}, and this needs you now. Going takes 1 hour, and the clock moves on to ${formatDateTime(at + 3 * MS_HOUR, sim.zone)}.`);
    expect(h.buttons.map((b) => b.text)).toEqual(expect.arrayContaining(['Stand Here', 'Skip It', 'Go']));
    expect(said).not.toContain('Only a plan of your own can be skipped.');

    // An appointment's kind of stop, the world's own: nothing to skip. TEST SETUP: an item that wants the player, as a
    // paper visit or a doctor's appointment does.
    const other = quickSave({}, 'frame-due-now-world');
    for (const i of other.universe.scheduled) if (i.status === 'pending' && i.requiresPlayer) other.timeline.cancel(i.id, other.now);
    other.onSchedule('test.visit', () => undefined);
    const visit = other.now + 2 * MS_HOUR;
    other.schedule({ at: visit, kind: 'test.visit', label: 'A Visit To The Passport Office', category: 'personal', priority: 30, requiresPlayer: true, durationMinutes: 30, payload: {} });
    h.given = new Map();
    ({ game } = drawn(other, TimeControls));
    h.sets = [];
    game.advanceTo(visit + MS_HOUR);
    for (const one of h.sets) h.given.set(one.at, one.value);
    shown = drawn(other, TimeControls);
    said = dialog(shown.html, 'A Visit To The Passport Office');
    expect(said).toContain('Going takes 30 minutes');
    expect(said).toContain('Only a plan of your own can be skipped. Go, or press Stand Here and the clock waits. Whatever moves the clock next runs this, with you there if you’re awake and in the right city.');
    expect(h.buttons.map((b) => b.text)).not.toContain('Skip It');
    expect(said).not.toContain('The school’s');
  });

  it('Skip To Event says what the clock stops at on the way and what else happens, for none, one and several', () => {
    const { sim } = withPlan('frame-skip', 'Dinner', 30);
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Gym', at: sim.now + 50 * MS_HOUR, durationMinutes: 60 } });
    drawn(sim, TimeControls);
    press(button('Advance ▾'));
    drawn(sim, TimeControls);
    press(button(/^Choose An Event…/));
    const html = drawn(sim, TimeControls).html;
    const said = dialog(html, 'Skip To Event');
    const first = skipTargets(sim, 14)[0]!;
    expect(said).toContain('On The Way');
    if (first.missed.length === 0) expect(said).toContain('You have no commitments before it.');
    expect(said).toMatch(first.crossed.length === 0 ? /It’s the next thing on your calendar\./ : /(One thing|\w+ things) on your calendar happens? on the way, in order\. The clock only moves forward\./);
    // Picked: Gym, with Dinner on the way.
    const gym = skipTargets(sim, 14).find((t) => t.entry.title === 'Gym')!;
    press(button(/^Gym/));
    const picked = dialog(drawn(sim, TimeControls).html, 'Skip To Event');
    expect(gym.missed.map((e) => e.title)).toContain('Dinner');
    expect(picked).toContain(`The clock will stop at ${gym.missed.length === 1 ? 'one commitment' : `${['', 'one', 'two', 'three', 'four', 'five'][gym.missed.length]} commitments`} on the way and ask what you want to do:`);
    expect(picked).toMatch(/on your calendar happens? on the way, in order\. The clock only moves forward\./);
  });

  it('Sleep names the hours on its button, one and many, and when you’d wake', () => {
    const sim = quickSave({}, 'frame-sleep');
    drawn(sim, TimeControls);
    press(button('Sleep'));
    let html = drawn(sim, TimeControls).html;
    let said = dialog(html, 'Sleep');
    expect(said).toMatch(/Sleep [\d.]+ Hours/);
    expect(said).toContain('You’d Wake At');
    // The hours set to one, as the slider sets them.
    const at = h.inits.findIndex((v, i) => i > 8 && typeof v === 'number' && h.buttons.some((b) => b.text === `Sleep ${v} Hours`));
    expect(at).toBeGreaterThan(0);
    h.given.set(at, 1);
    html = drawn(sim, TimeControls).html;
    said = dialog(html, 'Sleep');
    expect(h.buttons.map((b) => b.text)).toContain('Sleep 1 Hour');
    expect(said).toContain(`You’d Wake At ${formatTime(sim.now + MS_HOUR, sim.zone)}, ${formatDate(sim.now + MS_HOUR, sim.zone)}`);
  });
});

describe('a rehearsal with a partner, at its hour', () => {
  /** A first fall played a day at a time, kept rested and fed (TEST SETUP, as tests/partners.test.ts keeps it), until a partner asks. */
  const day = (sim: Simulation, until: number) => {
    while (sim.now < until) {
      Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
      sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
      sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
    }
  };
  it('PLAYER JOURNEY: the stop says the partner is expecting you and what calling off costs; Call It Off pressed says it cost their trust, and it did', () => {
    const zone = 'America/New_York';
    const sim = createSave(1, 'pa-yes', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const asked = () => { for (const a of courseworkOf(sim, sim.player)!.assignments) { const k = a.asks?.find((x) => x.status === 'open'); if (k) return { a, k }; } return undefined; };
    for (let d = 31; !asked() && d < 61; d += 1) day(sim, instantFromZoned({ year: 2026, month: 8, day: 1, hour: 16 }, zone) + (d - 1) * 24 * MS_HOUR);
    const { a, k } = asked()!;
    sim.must({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: true } });
    day(sim, k.at - MS_HOUR);
    const mate = sim.player.school!.classmates[a.partner!]!;
    const trust = trustOf(mate);
    const { game } = drawn(sim, TimeControls);
    h.sets = [];
    game.advanceTo(k.at + 4 * MS_HOUR);
    for (const one of h.sets) h.given.set(one.at, one.value);
    const html = drawn(sim, TimeControls).html;
    const name = /aria-label="([^"]*Rehears[^"]*)"/.exec(html)?.[1];
    expect(name, 'the stop at the rehearsal').toBeDefined();
    expect(dialog(html, name!)).toContain('Your partner is expecting you. You can go or call it off, but at this short notice calling it off costs their trust, and they’ll remember it.');
    h.sets = [];
    button('Call It Off').onClick!();
    expect(toasted().at(-1)).toEqual({ message: 'Rehearsal called off. At this short notice, it costs your partner’s trust.', tone: 'neutral' });
    expect(trustOf(sim.player.school!.classmates[a.partner!]!)).toBeLessThan(trust);
  });
});

describe('the save slots', () => {
  /** A device's storage, kept in a map; `fail` makes a write throw as a browser's storage does. TEST SETUP. */
  const device = (fail?: 'full' | 'broken') => {
    const kept = new Map<string, string>();
    const store = {
      getItem: async (k: string) => kept.get(k) ?? null,
      setItem: async (k: string, v: string) => {
        if (fail === 'full') throw Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError' });
        if (fail === 'broken') throw new Error('IDBDatabase: the connection is closing.');
        kept.set(k, v);
      },
      removeItem: async (k: string) => { kept.delete(k); },
    };
    return { kept, adapter: new LocalSaveAdapter(store) };
  };
  const shown = (adapter: InstanceType<typeof LocalSaveAdapter>, slots: Awaited<ReturnType<InstanceType<typeof LocalSaveAdapter>['listSlots']>>) => {
    h.calls = 0; h.inits = []; h.sets = []; h.buttons = [];
    const html = renderToStaticMarkup(createElement(SaveSlots, { adapter, initialSlots: slots, onNew: () => undefined, onContinue: () => undefined })).replace(/<!-- -->/g, '');
    return { html, text: words(html) };
  };

  it('says what each slot holds: one empty, one a life saved by an older version, and the delete that keeps a backup or doesn’t', async () => {
    const { adapter } = device();
    const sim = quickSave({}, 'frame-slots');
    refreshMeta(sim);
    await adapter.save(sim.universe);
    // An older version's save in slot 2, as one is on a device that played before this build. TEST SETUP.
    const older = JSON.parse(serialise(sim.universe)) as typeof sim.universe;
    older.meta.slot = 2; older.meta.schemaVersion = SAVE_SCHEMA_VERSION - 1;
    await adapter.save(older);
    const slots = await adapter.listSlots();
    let { text } = shown(adapter, slots);
    expect(text).toContain('Three slots, three separate lives. What happens in one never touches the others.');
    expect(text).toContain('Slot 3 An empty slot. Press New Save to start a life here. New Save');
    expect(text).toContain(`Save Format ${SAVE_SCHEMA_VERSION - 1} · Updated When Opened`);
    expect(text).toContain(`Save Format ${SAVE_SCHEMA_VERSION} ·`);
    expect(text).toContain('Saved To This Device');
    // Delete pressed on slot 1: a readable save becomes its own backup on the way out.
    press(button('Delete'));
    ({ text } = shown(adapter, slots));
    expect(text).toContain('Delete Slot 1? This ends that universe. The character, everywhere they’ve been and everything that happened to them is gone from the slot. A backup is kept, so if you change your mind you can bring it back here with Restore Backup. Keep It Delete Slot 1');
    // An unreadable save with no backup can't be brought back.
    const broken = { slot: 1 as const, occupied: true, hasBackup: false, error: 'That save file is damaged and can’t be read.' };
    ({ text } = shown(adapter, [broken, ...slots.slice(1)]));
    expect(text).toContain('Slot 1 Unreadable Save That save file is damaged and can’t be read. Delete');
    expect(text).toContain('This slot has no backup, so it can’t be brought back afterwards.');
  });

  it('says a damaged save can’t be opened, its backup the way on, and what’s wrong behind a disclosure', async () => {
    h.given = new Map();
    const { adapter } = device();
    const sim = quickSave({}, 'frame-slots-damaged');
    refreshMeta(sim);
    await adapter.save(sim.universe);
    await adapter.save(sim.universe);
    // The player stood somewhere the world doesn't hold: the check refuses it. TEST SETUP.
    const bad = JSON.parse(serialise(sim.universe)) as typeof sim.universe;
    bad.people[bad.playerId]!.currentLocationId = 'xx-nowhere';
    await adapter.save(bad);
    const slots = await adapter.listSlots();
    shown(adapter, slots);
    h.sets = [];
    // The press starts the opening and returns; it's done when the busy slot is let go.
    button('Continue').onClick!();
    for (let i = 0; i < 200 && !h.sets.some((one) => one.value === null && h.sets.indexOf(one) > 2); i++) await new Promise((r) => setTimeout(r, 10));
    for (const one of h.sets) h.given.set(one.at, one.value);
    const { text } = shown(adapter, slots);
    expect(text).toContain('The save in Slot 1 is damaged, so it can’t be opened. Its backup can be restored instead: press Restore Backup. What’s Wrong With It Player is in an unknown location \'xx-nowhere\'.');
    expect(text).not.toContain('didn’t pass validation');
  });

  it('says a server that couldn’t be reached left the saves where they were, and that the next save tries again', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { Base44SaveAdapter } = await import('@/engine/persistence/base44');
    // A deployment that writes the save's record itself, with the platform down. TEST SETUP: a stand-in client.
    const down = async () => { throw new Error('Network Error'); };
    const adapter = new Base44SaveAdapter({ entities: { SlateSave: { filter: down, create: down, update: down } } } as never);
    await expect(adapter.listSlots()).rejects.toThrow('Your saves couldn’t be reached. They aren’t lost: check your connection, then try again.');
    await expect(adapter.save(quickSave({}, 'frame-server').universe)).rejects.toThrow('The save couldn’t reach the server. A copy is kept on this device, and the next save tries the server again.');
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });

  it('says what a browser that can’t keep or open saves lacks, and what to do', async () => {
    // No local storage, as a browser that blocks a site's storage has none: the store itself throws, and the slots say
    // they couldn't be read. FIXTURE: `localStorage` absent, as a node test has it.
    const sim = quickSave({}, 'frame-no-storage');
    expect(typeof (globalThis as { localStorage?: unknown }).localStorage).toBe('undefined');
    const { LOCAL_STORE } = await import('@/engine/persistence/local');
    const bare = new LocalSaveAdapter(LOCAL_STORE);
    await expect(bare.save(sim.universe)).rejects.toThrow('This browser has no storage SLATE can use, so saves can’t be kept here. Check that this site is allowed to store data.');
    expect((await bare.listSlots()).map((one) => one.error)).toEqual(Array(3).fill('This device’s storage couldn’t be read just now. Reload SLATE to try again.'));
    // A compressed save in a browser that can't decompress: FIXTURE, the streams taken away for the call.
    const { adapter, kept } = device();
    await adapter.save(sim.universe);
    const streams = { c: globalThis.CompressionStream, d: globalThis.DecompressionStream };
    Reflect.deleteProperty(globalThis, 'CompressionStream'); Reflect.deleteProperty(globalThis, 'DecompressionStream');
    try {
      expect([...kept.values()].some((v) => v.startsWith('slate.gz1:'))).toBe(true);
      await expect(adapter.load(sim.universe.meta.slot)).rejects.toThrow('This save is compressed, and this browser can’t open it. Open SLATE in an up-to-date browser.');
    } finally {
      Object.assign(globalThis, { CompressionStream: streams.c, DecompressionStream: streams.d });
    }
  });

  it('says a save the device couldn’t write left the slot as it was, full or broken, and the toast and the button say it', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const sim = quickSave({}, 'frame-slots-full');
    refreshMeta(sim);
    const ok = device();
    await ok.adapter.save(sim.universe);
    const before = ok.kept.get([...ok.kept.keys()].find((k) => k.includes('save'))!)!;
    for (const fail of ['full', 'broken'] as const) {
      const { kept, adapter } = device(fail);
      for (const [k, v] of ok.kept) kept.set(k, v);
      await expect(adapter.save(sim.universe)).rejects.toThrow(fail === 'full'
        ? 'There isn’t enough storage space on this device to save, so the slot still holds what it held before. Free some space, or delete a save you no longer want, then try again.'
        : 'The save couldn’t be written to this device, so the slot still holds what it held before. Try again in a moment.');
      expect(kept.get([...kept.keys()].find((k) => k.includes('save'))!)).toBe(before);
    }
    // The provider says it in the toast, and the top bar's save button says it failed.
    const failing = { save: async () => { throw new PersistenceError('The save couldn’t be written to this device, so the slot still holds what it held before. Try again in a moment.', true); } };
    h.given = new Map();
    const { game } = drawn(sim, () => null, failing);
    h.sets = [];
    await game.saveNow();
    expect(toasted().map((t) => t.message)).toEqual(['The save couldn’t be written to this device, so the slot still holds what it held before. Try again in a moment.']);
    for (const one of h.sets) h.given.set(one.at, one.value);
    drawn(sim, GameShell, failing);
    expect(h.buttons.map((b) => b.text)).toContain('Save Failed: Try Again');
    logged.mockRestore();
  });
});

const { CharacterCreation } = await import('@/ui/creation/CharacterCreation');
const { CARRIES_A_BALANCE } = await import('@/engine/systems/credit');

describe('creation, step by step', () => {
  /** A step drawn with a config, as the form keeps them in its first two states. */
  const step = (index: number, config: NewSaveConfig) => {
    h.given = new Map<number, unknown>([[0, index], [1, config]]);
    h.calls = 0; h.inits = []; h.sets = []; h.buttons = [];
    const html = renderToStaticMarkup(createElement(CharacterCreation, { slot: 1 as never, onCancel: () => undefined, onStart: () => undefined })).replace(/<!-- -->/g, '');
    return words(html);
  };
  const ada = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });

  it('says each step’s guidance in the player’s words, with what each choice does, and why Continue waits', () => {
    let text = step(0, ada());
    expect(text).toContain('Your legal name is the one on your documents. What people call you can be different.');
    expect(text).toContain('It’s what you say when someone asks, and it decides the citizenship you were born to.');
    expect(text).toMatch(/You’ll be \d+ when this life begins\./);
    expect(text).toContain('Any size or shape works. It’s cropped to a headshot and made small enough to keep in the save. It’s only shown: the game never looks at what’s in it.');
    expect(text).toContain('Choose as many as are true. It’s part of who your character is and nothing more: it changes no ability, nothing in the game uses it, and the game never guesses it from a name or a country.');
    text = step(0, ada({ pronouns: 'they/them', performerTitle: undefined }));
    expect(text).toContain('With They/Them, the choice is yours. Actor and Actress are two words for the same craft, and the game treats them as equals. Pick the one you want to be called: the game calls you by it, and at school you’re cast in parts written for it, or written for anyone.');
    expect(text).toContain('Choose whether you’re billed as an actor or an actress.');
    text = step(0, ada({ firstName: '', lastName: ' ' }));
    expect(text).toContain('Enter a first name. Enter a last name.');

    text = step(1, ada());
    expect(text).toContain('How you lean, not what you can do. Each one shapes a part of your life:');
    expect(text).toContain(`Risk Tolerance: over ${CARRIES_A_BALANCE}, your card’s autopay starts on the minimum payment, so you carry a balance.`);
    expect(text).toContain('Extraversion: how being watched as you perform, by an audience or a class, affects your stress.');
    expect(text).toContain('Composure is an ability your work is judged on. Apart from where Composure and Discipline start, none of these makes you better or worse at anything.');
    expect(text).toContain('Pick up to four. Traits come in opposing pairs, and you can’t hold both sides of a pair.');

    text = step(3, ada());
    expect(text).toContain('You’re a first-year in the MFA in Acting at the David Geffen School of Drama at Yale University, one of 16 actors admitted this year: among the strongest of them, but not ahead of everyone.');
    expect(text).toContain('Your money is kept in the dollar (USD), the currency where you start, and stays in it wherever you go.');
    expect(text).toContain('Leave them blank and your body is drawn from the averages where you were born.');

    text = step(4, ada());
    expect(text).toContain('Ready To Begin');
    expect(text).toMatch(/Food Each Month \$[\d,]+/);
    expect(text).toContain('You haven’t picked any traits. That’s fine: only the dispositions above will shape your sleep, your temper and your card.');
    expect(text).toContain('This life begins with the clock paused. Once you press Play, time passes a minute for every minute, and the calendar fills whether you’re watching or not.');
  });
});

describe('the Calendar screen', () => {
  it('says what the calendar holds, a clash in the next month, the legend’s kinds, and a day with nothing on it, still to come or gone', async () => {
    const { CalendarWorkspace } = await import('@/ui/workspaces/CalendarWorkspace');
    const { monthGrid } = await import('@/engine/world/calendar');
    const { canPlan } = await import('@/ui/workspaces/cell');
    const sim = createSave(1, 'frame-calendar', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork' });
    // Two plans of your own at the same hour tomorrow: a clash, which the calendar flags and allows.
    const at = sim.now + 26 * MS_HOUR;
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Dinner With Sam', at, durationMinutes: 120 } });
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Gym', at, durationMinutes: 60 } });

    const first = drawn(sim, CalendarWorkspace);
    expect(first.text).toContain('Calendar Your Plans And Commitments Everything on your calendar, and the holidays kept where you are. When two things you need to be at overlap, they’re flagged here as a clash.');
    expect(first.text).toContain('A clash in the next month.');
    // The legend's kinds, each with what it holds on hover; the World row, whose items are never drawn, isn't shown.
    expect(first.html).toContain('title="Your own plans, and your birthday, appointments and tax dates."');
    expect(first.html).not.toContain('Background world processing.');
    // A day's cell says what's on it in words: tomorrow holds the two plans, and more where the school booked it too.
    expect(first.html).toMatch(/aria-label="[A-Z][a-z]+ \d+, \d{4} (Two|Three|Four|Five) things on it\."/);
    expect(first.html).not.toMatch(/\d things on it/);

    // The screen's own state, in the order it asks for it: the month shown, then the day picked.
    const view = h.inits.findIndex((v) => v !== null && typeof v === 'object' && 'year' in (v as object) && 'month' in (v as object));
    expect(view).toBeGreaterThanOrEqual(0);
    const { year, month } = h.inits[view] as { year: number; month: number };
    const days = monthGrid(sim, year, month).filter((d) => d.inMonth && d.entries.length === 0);
    const ahead = days.find((d) => canPlan(d, sim.now, sim.homeZone));
    const gone = days.find((d) => !canPlan(d, sim.now, sim.homeZone));
    expect(ahead).toBeDefined();
    h.given = new Map<number, unknown>([[view, h.inits[view]], [view + 1, ahead!.key]]);
    expect(drawn(sim, CalendarWorkspace).text).toContain('No Plans You have nothing on that day. Press Put Something On It to add a plan.');
    expect(h.buttons.map((b) => b.text)).toContain('Put Something On It');
    if (gone) {
      h.given = new Map<number, unknown>([[view, h.inits[view]], [view + 1, gone.key]]);
      expect(drawn(sim, CalendarWorkspace).text).toContain('No Plans You had nothing on that day.');
    }
  });
});
