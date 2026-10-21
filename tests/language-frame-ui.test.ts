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
import { APPOINTMENT_KIND } from '@/engine/systems/appointments';
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
    // Only the choices the commitments on the way offer, and what the jump does after them (from 2026-10-20, brief 19's
    // D1): until then it named Call It Off too, with no rehearsal on the way, and nothing said the clock carries on.
    expect(said).toContain(`Moving the clock to One Week (${formatDateTime(week, sim.zone)}) passes one commitment. The clock stops at it so you can choose: press Go to be there and carry on, or Stand Here to stop the clock there. You can also skip a plan of your own, and the clock then carries on.`);
    expect(said).not.toContain('call off a rehearsal');
    expect(said).toMatch(/Dinner — /);
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Gym', at: sim.now + 40 * MS_HOUR, durationMinutes: 60 } });
    h.given = new Map();
    drawn(sim, TimeControls);
    press(button('Advance ▾'));
    drawn(sim, TimeControls);
    press(button(/^One Week/));
    said = dialog(drawn(sim, TimeControls).html, 'On The Way');
    expect(said).toContain('passes two commitments. The clock stops at each one so you can choose: press Go to be there and carry on, or Stand Here to stop the clock there.');
    expect(h.buttons.map((b) => b.text)).toEqual(expect.arrayContaining(['Cancel', 'Advance']));
  });

  // From 2026-10-20 (brief 17): On The Way says what each answer does to the move, so what each does is held here.
  it('PLAYER JOURNEY: at a stop on the way, Go is there and carries the move on to where it was headed, and Stand Here stops the clock at the stop, paused', () => {
    for (const answer of ['Go', 'Stand Here'] as const) {
      const { sim, at } = withPlan(`frame-on-the-way-${answer === 'Go' ? 'go' : 'stand'}`, 'Dinner', 30);
      const week = sim.now + 7 * MS_DAY;
      h.given = new Map();
      drawn(sim, TimeControls);
      press(button('Advance ▾'));
      drawn(sim, TimeControls);
      press(button(/^One Week/));
      drawn(sim, TimeControls);
      press(button('Advance'));
      expect(sim.now, 'the move stops at the commitment').toBe(at);
      dialog(drawn(sim, TimeControls).html, 'Dinner');
      press(button(answer));
      drawn(sim, TimeControls);
      if (answer === 'Go') {
        expect(sim.now, 'Go carries the move on to One Week').toBe(week);
      } else {
        expect(sim.now, 'Stand Here leaves the clock at the stop').toBe(at);
        expect(sim.universe.preferences.timeSpeed).toBe('paused');
      }
    }
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
    expect(said).not.toContain('You can only skip a plan of your own');

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
    // What starts and who's there (from 2026-10-20, brief 16): until then "It happens …, and you’re there if you’re awake
    // and in the right city", without the hospital and an injury, which `present` reads.
    expect(said).toContain('Press Go, or Stand Here to wait with the clock paused. A Visit To The Passport Office starts the next time the clock moves, and you’re there if you’re awake, in its town, and not in hospital or laid up with an injury. Only a plan of your own can be skipped, so there’s no Skip It button here.');
    expect(h.buttons.map((b) => b.text)).not.toContain('Skip It');
    expect(said).not.toContain('The school’s');

    // A doctor's appointment asks only that you're awake and out of hospital (`presentForCare`): an injury that keeps you
    // from class doesn't keep you from your own care. TEST SETUP: the appointment's kind with no appointment behind it,
    // which its handler passes by.
    const care = quickSave({}, 'frame-due-now-care');
    for (const i of care.universe.scheduled) if (i.status === 'pending' && i.requiresPlayer) care.timeline.cancel(i.id, care.now);
    const seen = care.now + 2 * MS_HOUR;
    care.schedule({ at: seen, kind: APPOINTMENT_KIND, label: 'A Visit To Your Doctor', category: 'health', priority: 30, requiresPlayer: true, durationMinutes: 30, payload: {} });
    h.given = new Map();
    ({ game } = drawn(care, TimeControls));
    h.sets = [];
    game.advanceTo(seen + MS_HOUR);
    for (const one of h.sets) h.given.set(one.at, one.value);
    said = dialog(drawn(care, TimeControls).html, 'A Visit To Your Doctor');
    expect(said).toContain('Press Go, or Stand Here to wait with the clock paused. A Visit To Your Doctor starts the next time the clock moves, and you’re there if you’re awake and out of hospital.');
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
    expect(text).toContain(`Delete Slot 1? This deletes ${sim.player.displayName}’s life from the slot, with everything that happened in it. SLATE keeps a backup, so if you change your mind, press Restore Backup on this slot to bring it back. Keep It Delete Slot 1`);
    // An unreadable save with no backup can't be brought back.
    const broken = { slot: 1 as const, occupied: true, hasBackup: false, error: 'That save file is damaged and can’t be read.' };
    ({ text } = shown(adapter, [broken, ...slots.slice(1)]));
    expect(text).toContain('Slot 1 Unreadable Save That save file is damaged and can’t be read. Delete');
    expect(text).toContain('This slot has no backup, so you can’t bring it back afterwards.');
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
    expect(text).toContain('The save in Slot 1 is damaged, so it can’t be opened. Press Restore Backup to open its backup instead. What’s Wrong With It Player is in an unknown location \'xx-nowhere\'.');
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
        ? 'There isn’t enough storage space on this device to save, so nothing in the slot changed. Free some space, or delete a save you no longer want, then try again.'
        : 'SLATE couldn’t save to this device, so nothing in the slot changed. Try again in a moment.');
      expect(kept.get([...kept.keys()].find((k) => k.includes('save'))!)).toBe(before);
    }
    // The provider says it in the toast, and the top bar's save button says it failed.
    const failing = { save: async () => { throw new PersistenceError('SLATE couldn’t save to this device, so nothing in the slot changed. Try again in a moment.', true); } };
    h.given = new Map();
    const { game } = drawn(sim, () => null, failing);
    h.sets = [];
    await game.saveNow();
    expect(toasted().map((t) => t.message)).toEqual(['SLATE couldn’t save to this device, so nothing in the slot changed. Try again in a moment.']);
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
    expect(text).toContain('Where you’re from, which isn’t always where you live now. It’s what you tell people when they ask, and it decides your citizenship.');
    expect(text).toMatch(/You’ll be \d+ when you start\./);
    expect(text).toContain('Any size or shape works. SLATE crops it to a headshot and keeps a small copy in the save. It’s only for show: the game never looks at what’s in it.');
    expect(text).toContain('Choose as many as are true. It’s part of who your character is and nothing more: it changes no ability, nothing in the game uses it, and the game never guesses it from a name or a country.');
    text = step(0, ada({ pronouns: 'they/them', performerTitle: undefined }));
    expect(text).toContain('With They/Them, you choose. Actor and Actress are two words for the same craft, and neither counts for more. The game calls you by the one you pick, and at school you’re cast in parts written for it, or for anyone.');
    expect(text).toContain('Choose whether you’re billed as an actor or an actress.');
    text = step(0, ada({ firstName: '', lastName: ' ' }));
    expect(text).toContain('Enter a first name. Enter a last name.');

    text = step(1, ada());
    expect(text).toContain('Your temperament, not your talent. Each one changes a part of your life:');
    expect(text).toContain(`Risk Tolerance: above ${CARRIES_A_BALANCE}, your card’s autopay starts out paying only the minimum, so you carry a balance.`);
    expect(text).toContain('Extraversion: whether performing in front of people, an audience or your class, raises your stress or eases it.');
    expect(text).toContain('Apart from your starting Composure and Discipline, none of these makes you a better or worse actor. Composure is one of the abilities your performances are judged on.');
    expect(text).toContain('Pick up to four. Traits come in opposing pairs, and you can’t have both of a pair. Between them, they change: how fast stress builds and clears; how well you sleep, and how much a night restores;');

    text = step(3, ada());
    expect(text).toContain('You’re a first-year in the MFA in Acting at the David Geffen School of Drama at Yale University, one of 16 actors admitted this year: among the strongest of them, but not ahead of everyone.');
    expect(text).toContain('Your money is kept in the currency where you start, the dollar (USD), and stays in it wherever you go.');
    expect(text).toContain('Leave them blank and SLATE picks them at random, around the averages where you were born.');

    text = step(4, ada());
    expect(text).toContain('Ready To Begin');
    expect(text).toMatch(/Food Each Month \$[\d,]+/);
    expect(text).toContain('You haven’t picked any traits. That’s fine: the dispositions above still shape your stress, your sleep, your morale and your card.');
    expect(text).toContain('Your life starts with the clock paused. Once you press Play, a minute passes in the game for every real minute, and the clock pauses itself at each commitment to ask what you want to do.');
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
    expect(first.text).toContain('Calendar Your Plans And Commitments Everything on your calendar, and the public holidays where you are. When two things you need to be at overlap, they’re marked Clash.');
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

/**
 * From 2026-10-19 (the owner's brief 15, "Complete Natural-Language Editorial Pass, Including All Retained Text"): the
 * words the startup sequence and opening a slot say, each held word for word in each variant, where until then only a
 * pattern held them, or nothing did.
 */
describe('opening and starting, said in words', () => {
  it('the startup sequence says what it found in each slot: damaged, with a backup or without, newer and older', async () => {
    const { STAGES } = await import('@/ui/startup/StartupSequence');
    const slots = [
      { slot: 1 as const, occupied: true, hasBackup: true, error: 'That save file is damaged and can’t be read.' },
      { slot: 2 as const, occupied: true, hasBackup: false, meta: { schemaVersion: SAVE_SCHEMA_VERSION + 1 } },
      { slot: 3 as const, occupied: true, hasBackup: false, meta: { schemaVersion: SAVE_SCHEMA_VERSION - 1 } },
    ];
    const context = { warnings: [] as string[], slots: slots as never };
    for (const stage of STAGES.filter((s) => s.id === 'validate' || s.id === 'migrations')) await stage.run(context);
    expect(context.warnings).toEqual([
      'Slot 1: That save file is damaged and can’t be read. Press Restore Backup on the slot to open its backup.',
      'Slot 2 was saved by a newer version of SLATE, so this version won’t open it. That keeps the save safe.',
      'Slot 3 was saved by an older version of SLATE. When you open it, SLATE keeps a backup and then updates it.',
    ]);
    const without = { warnings: [] as string[], slots: [{ ...slots[0]!, hasBackup: false }] as never };
    await STAGES.find((s) => s.id === 'validate')!.run(without);
    expect(without.warnings).toEqual(['Slot 1: That save file is damaged and can’t be read.']);
  });

  it('opening refuses a newer version’s save and one whose accounts don’t add up, and says it changed neither', async () => {
    const { openSlot, migrate } = await import('@/engine');
    const kept = new Map<string, string>();
    const adapter = new LocalSaveAdapter({ getItem: async (k) => kept.get(k) ?? null, setItem: async (k, v) => { kept.set(k, v); }, removeItem: async (k) => { kept.delete(k); } });
    const newer = quickSave({}, 'frame-open-newer');
    newer.universe.meta.schemaVersion = SAVE_SCHEMA_VERSION + 1;
    await adapter.save(newer.universe);
    const before = [...kept.entries()];
    const opened = await openSlot(adapter, newer.universe.meta.slot);
    expect('error' in opened && opened.error).toBe(`Slot ${newer.universe.meta.slot} was saved by a newer version of SLATE, so this version won’t open it. SLATE hasn’t changed anything in it.`);
    expect([...kept.entries()]).toEqual(before);
    expect(migrate(JSON.parse(serialise(newer.universe))).problems).toEqual(['This save was made by a newer version of SLATE, so this version won’t open it. SLATE hasn’t changed anything in it.']);
    // A balance that isn't the sum of its postings. TEST SETUP: one account's cached balance moved by a cent.
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const off = quickSave({}, 'frame-open-unbalanced');
    const account = Object.values(off.universe.accounts).find((a) => a.ownerId === off.universe.playerId)!;
    account.balance += 1;
    expect(migrate(JSON.parse(serialise(off.universe))).problems).toEqual(['This save’s accounts don’t add up, so SLATE can’t update it safely and hasn’t changed anything in it. If the slot has a backup, press Restore Backup to open that instead.']);
    logged.mockRestore();
  });

  it('a life where the game has no bank keeps a checking account by that name, and a home’s money given back says what it was', async () => {
    const { CITIES } = await import('@/engine/content/geography');
    const { banksFor } = await import('@/engine/systems/banking');
    const { migrate, loadSave } = await import('@/engine');
    // A town whose country no bank table covers. TEST SETUP: the first the gazetteer lists.
    const town = CITIES.all().find((c) => banksFor(c.id).length === 0)!;
    expect(town).toBeDefined();
    const far = quickSave({ startLocationId: town.id, homeRegionId: town.id }, 'frame-no-bank');
    const own = Object.values(far.universe.accounts).filter((a) => a.ownerId === far.universe.playerId && a.kind !== 'credit_card' && !a.nominal);
    expect(own.map((a) => a.name)).toContain('Checking Account');

    // A save at 90 with a home's deposit held and rent paid ahead. TEST SETUP, as the 91 migration test sets one up.
    const sim = quickSave({}, 'frame-home-money');
    const deposit = sim.openAccount({ id: sim.nextId('account'), kind: 'escrow', category: 'deposit', name: 'Rent Deposit', ownerId: sim.player.id, openedAt: sim.now });
    sim.post({ memo: 'Deposit held', category: 'rent', postings: [{ accountId: sim.player.primaryAccountId!, amount: -900_00 }, { accountId: deposit.id, amount: 900_00 }] });
    const universe = JSON.parse(serialise(sim.universe)) as typeof sim.universe;
    universe.meta.schemaVersion = 90;
    Object.assign(universe.people[universe.playerId]!.payments as object, { rentCredit: 500_00 });
    migrate(universe);
    const opened = loadSave(universe);
    const memos = opened.universe.transactions.map((t) => t.memo);
    expect(memos).toContain('Home deposit returned');
    expect(memos).toContain('Rent paid ahead, returned');
  });

  it('an empty slot with a backup says so, and a backup with no date says the date isn’t known', () => {
    const adapter = new LocalSaveAdapter({ getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined });
    h.calls = 0; h.inits = []; h.sets = []; h.buttons = [];
    const html = renderToStaticMarkup(createElement(SaveSlots, {
      adapter,
      initialSlots: [{ slot: 1, occupied: false, hasBackup: true }, { slot: 2, occupied: false, hasBackup: true, backupDateLabel: 'March 3, 2027' }, { slot: 3, occupied: false, hasBackup: false }],
      onNew: () => undefined, onContinue: () => undefined,
    })).replace(/<!-- -->/g, '');
    const text = words(html);
    // The button, then the note under it, in that order.
    expect(text).toMatch(/Slot 1 Empty, but there’s a backup of the save that was here\. New Save Restore Backup (B)ackup from an unknown date/);
    expect(text).toMatch(/Slot 2 Empty, but there’s a backup of the save that was here\. New Save Restore Backup (B)ackup from March 3, 2027/);
  });
});

/**
 * From 2026-10-19 (brief 15): creation's pickers and Before Yale, word for word in each variant. Before Yale's savings
 * line said "Your savings stay where you saved them" with Moved To chosen too, and "opens with nothing in it" beside a
 * current account the split had given its fees (frame `defects.md`, brief 15, 1).
 */
describe('creation’s pickers and Before Yale, said in words', () => {
  /** A component drawn with some of its state given, by the order its useState is called in. TEST SETUP. */
  const drawnWith = (el: ReturnType<typeof createElement>, given: [number, unknown][] = []) => {
    h.given = new Map(given);
    h.calls = 0; h.inits = []; h.sets = []; h.buttons = [];
    const html = renderToStaticMarkup(el).replace(/<!-- -->/g, '');
    return { html, text: words(html) };
  };

  it('the place picker says what a country has, and a search that finds nothing what to try', async () => {
    const { LocationPicker } = await import('@/ui/creation/LocationPicker');
    const { REGIONS } = await import('@/engine/content/geography');
    const picker = (given: [number, unknown][]) => drawnWith(createElement(LocationPicker, { cityId: '', map: false, onPick: () => undefined }), given).text;
    // Antarctica: no towns on record, and no states or regions. TEST SETUP: the country given as the picker's first state.
    let text = picker([[0, 'aq']]);
    expect(text).toContain('No towns or cities on record for this country.');
    expect(text).toContain('None');
    expect(text).toContain('There are no states or regions to choose from in this country.');
    expect(text).toContain('There’s no town or city on record there.');
    // A search in a state that finds nothing names the select's own way wider.
    const state = REGIONS.all().find((r) => r.parentId === 'us')!;
    text = picker([[0, 'us'], [1, state.id], [2, 'Zzyzxq']]);
    expect(text).toContain('No town or city matches “Zzyzxq” there. Try a different spelling, or choose Anywhere In The United States.');
    text = picker([[0, 'us'], [2, 'Zzyzxq']]);
    expect(text).toContain('No town or city matches “Zzyzxq” there. Try a different spelling.');
  });

  it('the map says a country with nothing on record can’t be picked, and the photo picker each refusal and what to do', async () => {
    const { readFileSync } = await import('node:fs');
    const { WorldMap } = await import('@/ui/creation/WorldMap');
    const map = JSON.parse(readFileSync('public/geo/world-map.json', 'utf8')) as unknown;
    const { html } = drawnWith(createElement(WorldMap, { countryId: 'us', onPick: () => undefined }), [[0, map]]);
    expect(html).toContain('<title>Antarctica: no towns or cities on record</title>');
    const { describeRejection, CANNOT_DECODE } = await import('@/ui/creation/portrait');
    expect(describeRejection({ type: 'application/pdf', size: 100, name: 'resume.pdf' })).toBe('resume.pdf isn’t an image. Choose a JPEG, PNG or WebP photo.');
    expect(describeRejection({ type: 'image/jpeg', size: 30 * 1024 * 1024, name: 'huge.jpg' })).toBe('That photo is 30.0MB, over the 24MB limit. Try a smaller one.');
    expect(describeRejection({ type: 'image/png', size: 0, name: 'empty.png' })).toBe('That file is empty. Choose a different photo.');
    expect(CANNOT_DECODE).toBe('That photo couldn’t be opened. It may be damaged, so try a different one.');
    // A photo being framed: what to do with it. TEST SETUP: an image given as the picker's first state.
    const { PortraitPicker } = await import('@/ui/creation/PortraitPicker');
    const framing = drawnWith(createElement(PortraitPicker, { portrait: undefined, name: 'Ada Cole', onChange: () => undefined }), [[0, { width: 800, height: 600 }]]).text;
    expect(framing).toContain('Drag the photo to move it in the frame, and use Zoom to size it.');
  });

  it('creation says what it’s for, a draft put back, each disposition and trait’s reach, the family’s card, and the guide’s choice', async () => {
    const { CharacterCreation: Creation, validate, StartingPointStep } = await import('@/ui/creation/CharacterCreation');
    const { withFamily } = await import('@/engine/world/bootstrap');
    const ada = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
    const at = (step: number, config: NewSaveConfig, restored = false) => drawnWith(createElement(Creation, { slot: 1 as never, onCancel: () => undefined, onStart: () => undefined }), [[0, step], [1, config], [2, restored]]).text;
    let text = at(0, ada(), true);
    expect(text).toContain('Who Are You Going To Be? SLATE is a life simulator. Here you create the actress you’ll play.');
    expect(text).toContain('You’d started filling this in before, so it’s back the way you left it. Start Over');
    text = at(1, ada());
    expect(text).toContain('Emotional Stability: how fast stress builds and clears, and how much Composure you start with.');
    expect(text).toContain('Conscientiousness: how well you sleep, and how much Discipline you start with.');
    expect(text).toContain('Ambition: how fast stress builds, from work and from money alike.');
    expect(text).toContain('Openness: whether rehearsing new work, a festival’s new play or a Cabaret piece, lifts your morale or lowers it.');
    expect(text).toContain('Agreeableness: whether a day of rehearsal lifts your morale or lowers it.');
    expect(text).toContain('how hard an illness hits; how sharp you are in the morning or the evening; which part of preparing a scene goes furthest; how you warm to classmates, and how much a slight from one hurts; and, for Frugal, Spender and Generous, what your food costs and how much a meal lifts you.');
    expect(text).toContain('A trait’s description and cost describe the whole person, but the game uses only the effects above. Once you’re playing, open a trait on your Player Profile to see exactly what it changes.');
    text = at(2, withFamily(ada(), 'scraping'));
    expect(text).toContain('Background Who you were before you arrived.');
    expect(text).toMatch(/in checking and \$[\d,]+ in savings, and a card with a \$[\d,]+ limit and \$[\d,]+ owed on it\./);
    text = at(2, withFamily(ada(), 'wealthy'));
    expect(text).toMatch(/, and a card with a \$[\d,]+ limit and nothing owed on it\./);
    text = at(4, ada());
    expect(text).toContain('Guide Me Through It. The game opens a part at a time, each with a short chapter of the guide that explains it. Recommended if you’re new.');
    expect(text).toContain('I Know SLATE. Everything is open from the start. The guide’s chapters and How This Works are there whenever you want them.');
    // Before Yale's three refusals of a time, as validate words them.
    const STARTING_POINT = 3;
    const before = (fromYear: number, fromMonth: number) => validate(ada({ priorResidence: { cityId: 'uk-eng-london', fromYear, fromMonth } }), STARTING_POINT);
    expect(before(2010, 13)).toContain('Choose the month and year you moved there.');
    expect(before(1990, 1)).toContain('You can’t have moved there before you were born.');
    expect(before(2027, 1)).toContain('That’s after you arrive at Yale. Choose an earlier month.');
    // Where the game has no bank, the money is in a plain checking account.
    const { CITIES } = await import('@/engine/content/geography');
    const { banksFor } = await import('@/engine/systems/banking');
    const town = CITIES.all().find((c) => banksFor(c.id).length === 0)!;
    text = drawnWith(createElement(StartingPointStep, { config: ada({ startLocationId: town.id, school: undefined }), set: (() => undefined) as never, setConfig: (() => undefined) as never })).text;
    expect(text).toContain('SLATE has no bank on record where you live, so your money is in a plain checking account.');
  });

  it('a trait’s look names what a session of preparation gets done, and how soon you need a shower, for each trait that moves one', async () => {
    const { resolveLook } = await import('@/ui/looks/registry');
    const { at: lookAt } = await import('@/ui/looks/subject');
    await import('@/ui/looks/all');
    const said = (trait: string) => {
      const sim = createSave(1, `frame-trait-${trait}`, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personalityTraits: [trait] });
      const found = resolveLook(sim, lookAt('trait', trait)) as { body?: unknown };
      return drawn(sim, () => found.body as never).text;
    };
    expect(said('curious')).toMatch(/How much a session on how to play a part gets done \+15%/);
    expect(said('single_minded')).toContain('How much a session learning the lines gets done');
    expect(said('scattered')).toContain('How much a session getting to know the play gets done');
    expect(said('scattered')).toContain('Most of them, anyway: something is always the one you dropped.');
    expect(said('self_critical')).toContain('How much a session revising after a note gets done');
    // A trait's description is on creation's Traits, where it's chosen.
    const { CharacterCreation: Creation } = await import('@/ui/creation/CharacterCreation');
    const traits = drawnWith(createElement(Creation, { slot: 1 as never, onCancel: () => undefined, onStart: () => undefined }), [[0, 1], [1, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' }]]).text;
    expect(traits).toContain('Self Critical You’re the harshest critic you’ll ever have, and a revision is better for it.');
    expect(traits).toContain('Curious The thing nobody asked you to read gets read, and you go deeper into how to play a part.');
    expect(said('chaotic')).toContain('How soon you need a shower');
    expect(said('unshakeable')).toContain('How fast stress clears while you’re awake, and with a workout or an hour unwinding');
  });

  it('Before Yale says where the savings go and what the account kept there opens with, for each choice', async () => {
    const { StartingPointStep } = await import('@/ui/creation/CharacterCreation');
    const { withFamily } = await import('@/engine/world/bootstrap');
    const life = (extra: Partial<NewSaveConfig>): NewSaveConfig => ({ ...withFamily(newLifeConfig(), 'modest'), homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase', ...extra });
    const step = (config: NewSaveConfig) => drawnWith(createElement(StartingPointStep, { config, set: (() => undefined) as never, setConfig: (() => undefined) as never })).text;
    // Barclays, savings kept: its current account opens at nothing (tests/home-account-creation.test.ts).
    let text = step(life({ priorResidence: { cityId: 'uk-eng-london', fromYear: 2008, fromMonth: 9 }, homeBankId: 'gb-barclays' }));
    expect(text).toContain('Your savings stay at Barclays. Your everyday money is in your account here, and your card stays with Chase. Your Barclays Bank Account opens with nothing in it.');
    // HSBC UK, savings moved: still nothing in the current account kept there.
    text = step(life({ priorResidence: { cityId: 'uk-eng-london', fromYear: 2008, fromMonth: 9 }, homeBankId: 'gb-hsbc', savingsAtHome: false }));
    expect(text).toContain('Your savings move to Chase. Your everyday money is in your account here, and your card stays with Chase.');
    expect(text).toMatch(/and your card stays with Chase\. Your [^.]+ opens with nothing in it\./);
    // MUFG, whose current account opens with its fees to graduation: the line doesn't say it opens with nothing.
    text = step(life({ homeRegionId: 'jp-13-tokyo', priorResidence: { cityId: 'jp-13-tokyo', fromYear: 2005, fromMonth: 4 }, homeBankId: 'jp-mufg' }));
    expect(text).toContain('Its 普通預金 (Ordinary Deposit) opens with ¥10,200 from your savings, what its fees come to until you graduate in May 2029');
    expect(text).toContain('Your savings stay at MUFG Bank. Your everyday money is in your account here, and your card stays with Chase.');
    expect(text).not.toContain('opens with nothing in it');
    expect(text).toContain('If you lived outside America just before Yale, say where, and whether you kept a bank account there.');
  });
});
