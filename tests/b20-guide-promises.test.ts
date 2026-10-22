/**
 * The guide's Start entries' promises, each held (from 2026-10-21, the owner's brief 20, C3: "every promise the guide
 * makes between entries is held by a test"; `src/engine/content/guide/start.ts`'s `connections`, the guide area's
 * promises in `docs/verification/audit-2026-10-21/effects/guide.json`).
 *
 * - start.home > start.guide: a word becomes a link once you've read the chapter that covers it.
 * - start.home > day.weather: the weather beside Where You Are shows the same town, hour by hour.
 * - start.home > day.clock: the local time is the game's clock, so it moves when the clock does.
 * - start.guide > start.home: reading a chapter opens Home's panels and the underlined words it names.
 * - start.guide > day.calendar: "What's Coming" opens the calendar, and the dialog that asks what to do at a commitment.
 * - start.guide > day.clock: with the guide, the clock starts paused, and reading "The Clock" opens Play.
 * - start.find > start.guide: a place joins the menu once you've read its chapter.
 * - start.find > day.needs: Go There on a notice takes you to its screen, and to its tab where the notice names one (the
 *   provider's half, the tab kept, is tests/b20-guide-screens.test.ts's). Until 2026-10-21 it said "its screen and tab",
 *   though most notices name only a screen.
 *
 * Each is played on a guided life as the game makes one (the guide on, the clock paused), the chapters read through
 * `tutorial.read` as I've Read It reads them, the screens drawn with react-dom/server and their buttons kept on their
 * way through the JSX runtime, as tests/evidence2-b01.test.ts draws them. FIXTURE: the page's address and listeners,
 * which the shell's rail reads as it draws.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_HOUR, formatTime, instantFromZoned } from '@/engine/core/time';
import { CHAPTERS } from '@/engine/content/tutorial';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { READ_KIND } from '@/engine/world/tutorial';
import { weatherAt } from '@/engine/systems/weather';
import { placeProfile } from '@/engine/world/place';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  went: [] as string[],
  standing: null as null | { item: import('@/engine/core/scheduler').ScheduledItem; wanted: number; sentFrom: number },
}));

const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepControls = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children), disabled: props.disabled as boolean | undefined, onClick: props.onClick as (() => void) | undefined });
    return make(type, props, ...rest);
  };
  return { ...real, ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}), ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}) };
};
vi.mock('react/jsx-runtime', async (orig) => keepControls(await orig<Record<string, unknown>>()));
vi.mock('react/jsx-dev-runtime', async (orig) => keepControls(await orig<Record<string, unknown>>()));

vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    navigate: (route: string) => { h.went.push(route); },
    get standingAt() { return h.standing; },
    route: '/home', breadcrumbs: [], recent: [], favourites: [], toasts: [], saving: false, saveError: undefined,
    unsaved: () => false,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { Home } = await import('@/ui/screens/Home');
const { TimeControls } = await import('@/ui/shell/TimeControls');
const { GameShell } = await import('@/ui/shell/GameShell');
await import('@/ui/looks/all');
const { resolveLook } = await import('@/ui/looks/registry');
const { at: subject } = await import('@/ui/looks/subject');

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const guided = (seed: string): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', tutorial: true, paused: true });
function readTo(sim: Simulation, id: string): void {
  for (const c of CHAPTERS) {
    if (sim.universe.tutorial!.read.includes(c.id)) { if (c.id === id) return; continue; }
    sim.must({ kind: READ_KIND, payload: { chapterId: c.id } });
    if (c.id === id) return;
  }
}
function drawn(sim: Simulation, screen: FunctionComponent) {
  h.sim = sim;
  h.buttons = [];
  const html = renderToStaticMarkup(createElement(screen));
  const buttons = [...h.buttons];
  const text = html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  return { html, text, buttons, all: (w: string) => buttons.filter((b) => b.text === w) };
}
const promise = (entry: string, to: string) => GUIDE_BY_ID[entry]!.connections.find((c) => c.to === to)!.why;

const page = globalThis as Record<string, unknown>;
const was = { window: page.window, document: page.document };
beforeEach(() => {
  const listens = { addEventListener: () => undefined, removeEventListener: () => undefined };
  // FIXTURE: the page's address and listeners, which the shell reads as it draws.
  Object.assign(globalThis, { window: { ...listens, location: { hash: '' } }, document: { ...listens } });
});
afterEach(() => {
  for (const key of ['window', 'document'] as const) { if (was[key] === undefined) delete page[key]; else page[key] = was[key]; }
});

describe('Home And Where You Are', () => {
  it(`start.home > start.guide: “${promise('start.home', 'start.guide')}”`, () => {
    const sim = guided('b20-promise-links');
    const before = drawn(sim, Home);
    // The town's name and the date are words, not links, before the first chapter; after it, both open.
    expect(before.buttons.some((b) => b.text === 'New Haven')).toBe(false);
    expect(before.text).toContain('New Haven');
    readTo(sim, 'welcome');
    const after = drawn(sim, Home);
    expect(after.buttons.filter((b) => b.text === 'New Haven').length).toBeGreaterThan(0);
    // And a word whose chapter is still to come stays a word: the Energy dial, “How You Are”'s.
    expect(after.html).not.toMatch(/<button[^>]*class="link[^"]*"[^>]*>Energy/);
  });

  it(`start.home > day.weather: “${promise('start.home', 'day.weather')}”`, () => {
    const sim = guided('b20-promise-weather');
    readTo(sim, 'weather');
    const place = placeProfile(sim, sim.player.currentLocationId)!;
    const weather = weatherAt(sim, place.city.id)!;
    const home = drawn(sim, Home);
    // The panel beside it is the same town's weather, at this hour: its figure now, and the day's high and low.
    expect(home.text).toMatch(new RegExp(`Weather How This Works \\S+ ${weather.temperature}°F ${weather.condition} · High ${weather.high}°F · Low ${weather.low}°F`));
    // And it opens hour by hour: the weather's look has the hours of its day.
    const look = resolveLook(sim, subject('weather', place.city.id));
    const ways = look && !('gone' in look) ? look.ways ?? [] : [];
    expect(ways.some((w) => w.to.kind === 'hours' && w.to.id.startsWith(`${place.city.id}/`))).toBe(true);
  });

  it(`start.home > day.clock: “${promise('start.home', 'day.clock')}”`, () => {
    const sim = guided('b20-promise-local-time');
    readTo(sim, 'advance');
    const localTime = () => /Local Time (\d+:\d\d [AP]M)/.exec(drawn(sim, Home).text)?.[1];
    expect(localTime()).toBe(formatTime(sim.now, sim.zone));
    sim.advanceTo(sim.now + MS_HOUR);
    expect(localTime()).toBe(formatTime(sim.now, sim.zone));
  });
});

describe('The Guide And This Help', () => {
  it(`start.guide > start.home: “${promise('start.guide', 'start.home')}”`, () => {
    const sim = guided('b20-promise-panels');
    readTo(sim, 'needs');
    const shut = drawn(sim, Home);
    expect(shut.text).toContain('How You Are Locked');
    expect(shut.html).not.toMatch(/class="link[^"]*"[^>]*>Readiness/);
    readTo(sim, 'body');
    const open = drawn(sim, Home);
    expect(open.text).not.toContain('How You Are Locked');
    expect(open.text).toMatch(/How You Are How This Works .+ Energy \d+ Stress \d+ Readiness \d+/);
    expect(open.buttons.some((b) => b.text.startsWith('Readiness'))).toBe(true);
  });

  it(`start.guide > day.calendar: “${promise('start.guide', 'day.calendar')}”`, () => {
    const sim = guided('b20-promise-calendar');
    readTo(sim, 'welcome');
    // TEST SETUP: the clock stopped at the first commitment of the first morning, as the top bar would leave it.
    const r = sim.advanceTo(at(2026, 8, 24, 12), { stopOnPlayerRequired: true });
    h.standing = { item: r.interruptedBy!, wanted: at(2026, 8, 24, 12), sentFrom: r.sentFrom };
    expect(drawn(sim, Home).text).toContain('Calendar Locked What’s coming up, and when.');
    expect(drawn(sim, TimeControls).all('GoLocked')).toHaveLength(1);
    readTo(sim, 'calendar');
    expect(drawn(sim, Home).text).not.toContain('Calendar Locked What’s coming up, and when.');
    expect(drawn(sim, TimeControls).all('Go')).toHaveLength(1);
    h.standing = null;
  });

  it(`start.guide > day.clock: “${promise('start.guide', 'day.clock')}”`, () => {
    const sim = guided('b20-promise-play');
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    readTo(sim, 'calendar');
    const shut = drawn(sim, TimeControls);
    expect(shut.all('PlayLocked')).toHaveLength(1);
    expect(sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'live' } }).ok).toBe(false);
    readTo(sim, 'clock');
    const open = drawn(sim, TimeControls);
    expect(open.all('Play')).toHaveLength(1);
    open.all('Play')[0]!.onClick!();
    expect(sim.universe.preferences.timeSpeed).toBe('live');
  });
});

describe('Finding Your Way', () => {
  it(`start.find > start.guide: “${promise('start.find', 'start.guide')}”`, () => {
    const sim = guided('b20-promise-menu');
    // The rail's places, by their own buttons (`rail-item`), the Home it always has and You at its foot aside.
    const rail = () => [...drawn(sim, GameShell).html.matchAll(/<button class="rail-item"[^>]*><span class="grow truncate">([^<]+)<\/span>/g)].map((m) => m[1]).filter((x) => x !== 'Home');
    readTo(sim, 'weather');
    expect(rail()).toEqual([]);
    readTo(sim, 'school');
    expect(rail()).toEqual(['School']);
    readTo(sim, 'career');
    expect(rail()).toEqual(['Player Profile', 'School', 'Career']);
    readTo(sim, 'bank');
    expect(rail()).toEqual(['Player Profile', 'School', 'Career', 'Money', 'Papers']);
  });

  it(`start.find > day.needs: “${promise('start.find', 'day.needs')}”`, () => {
    expect(promise('start.find', 'day.needs')).toBe('Go There on a notice takes you to its screen, and to its tab where the notice names one.');
    const sim = guided('b20-promise-go-there');
    readTo(sim, 'needs');
    sim.notify({ category: 'career', title: 'A Notice Naming Its Tab', body: 'One.', importance: 99, route: '/workspace/career?tab=work' });
    sim.notify({ category: 'school', title: 'A Notice Naming Its Screen', body: 'Two.', importance: 98, route: '/workspace/school' });
    const home = drawn(sim, Home);
    const there = home.all('Go There');
    h.went = [];
    there[0]!.onClick!();
    there[1]!.onClick!();
    expect(h.went).toEqual(['/workspace/career?tab=work', '/workspace/school']);
  });
});
