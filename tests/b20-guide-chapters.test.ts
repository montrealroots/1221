/**
 * The guide's twenty chapters, followed (from 2026-10-21, the owner's brief 20, C3: "tutorials explain actual behavior",
 * and D1's "notifications or tutorials describing nonexistent behavior"; the guide area's audit,
 * `docs/verification/audit-2026-10-21/areas/guide/`).
 *
 * Each chapter tells the player to do something and says what happens. Here each is read in a guided life, in order, as
 * the guide is read (`tutorial.read`), and then its instructions are done as the chapter says them, through the buttons
 * it names where those are drawn on the screens below (Home, the top bar, the guide) and otherwise through the command
 * the chapter's button sends (the list in `docs/verification/audit-2026-10-21/areas/guide/wiring.json` says which), and
 * the clock; and what the chapter says will happen is checked against what does, in the chapter's own example where it
 * gives one ("such as Mark 3 Read", "such as Sleep 8 Hours", "such as Comic Timing"). Reading in a guided life also holds
 * that each instruction is open once its chapter is read, as the guide promises: nothing a chapter tells the player to
 * press is refused for a chapter still to come.
 *
 * The finer figures each chapter's The Details gives, and the many conditions behind each part, are held by the tests
 * of the part itself, which each chapter's row names (`docs/verification/audit-2026-10-21/effects/guide.json`); this
 * file holds the instructions the chapter's body gives.
 *
 * Drawn with react-dom/server as tests/evidence2-b01.test.ts draws them: every button's own handler kept on its way
 * through the JSX runtime and pressed; `useGame`'s `run` the save's own `execute` (a refusal toasted), `advanceTo` the
 * provider's (the clock stopped at what wants the player, the save paused there and the stop kept as `standingAt`), and
 * `navigate` written down. A component's open state is given through its own useState (FIXTURE), in render order.
 *
 * TEST SETUP, said again where it's made: the body kept fed and rested as the clock moves (`tended`), where a chapter's
 * instruction isn't about the body; a dial set before a comparison where the chapter's claim is about that dial (two
 * lives alike in all else, from the same seed).
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { ScheduledItem } from '@/engine/core/scheduler';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, MS_MINUTE, formatTime, instantFromZoned, zoneAbbreviation, seasonOf, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CHAPTERS, CHAPTER_BY_ID } from '@/engine/content/tutorial';
import { READ_KIND, isOpen } from '@/engine/world/tutorial';
import { carryOnTo } from '@/engine/world/clock';
import { onTheWay } from '@/engine/foresight';
import { entriesBetween, skipTargets } from '@/engine/world/calendar';
import { createClockStepper } from '@/engine/core/realclock';
import { LONGEST_NIGHT, SHORTEST_SLEEP, lookAfterOptions, readiness, trainingAt } from '@/engine/systems/life';
import { fluByWeek } from '@/engine/systems/seasons';
import { weatherAt, forecastFor } from '@/engine/systems/weather';
import { PLAN_KIND } from '@/engine/world/plans';
import { YALE_DRAMA } from '@/engine/content/school';
import { CLASSES_KIND, ESTIMATE } from '@/engine/systems/school';
import { courseworkOf } from '@/engine/systems/coursework';
import { CONTEMPORARY_PLAYS } from '@/engine/content/contemporary';
import { AGENTS } from '@/engine/content/agents';
import { documentsOf } from '@/engine/systems/documents';
import { netWorth } from '@/engine/systems/finance';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { BIRTHDAY_KIND } from '@/engine/systems/birthdays';
import { briefFor } from '@/engine/systems/briefs';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  states: [] as unknown[],
  keep: Symbol('keep'),
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  toasts: [] as string[],
  went: [] as string[],
  standing: null as null | { item: import('@/engine/core/scheduler').ScheduledItem; wanted: number; sentFrom: number },
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    if (h.states.length === 0) return [value, set];
    const v = h.states.shift();
    return [v === h.keep ? value : v, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

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
    run: (kind: string, payload: Record<string, unknown> = {}, options: { silent?: boolean } = {}) => {
      const r = h.sim.execute({ kind, payload });
      if (!r.ok && !options.silent) h.toasts.push(r.error ?? '');
      return r;
    },
    // As the provider moves the clock from a screen: stopping at what wants the player, the save paused there (`halt`).
    advanceTo: (instant: number, resumes?: number) => {
      const r = h.sim.advanceTo(instant, { stopOnPlayerRequired: true, resumes });
      if (r.interruptedBy) {
        h.sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } });
        h.standing = { item: r.interruptedBy, wanted: instant, sentFrom: r.sentFrom };
      }
      return r;
    },
    get standingAt() { return h.standing; },
    clearStandingAt: () => { h.standing = null; },
    toast: (message: string) => { h.toasts.push(message); },
    navigate: (route: string) => { h.went.push(route); },
    route: '/home', breadcrumbs: [], recent: [], favourites: [], toasts: [], saving: false, saveError: undefined,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { Home } = await import('@/ui/screens/Home');
const { TimeControls, SkipDialog } = await import('@/ui/shell/TimeControls');
const { GuideProvider } = await import('@/ui/guide/Guide');
await import('@/ui/looks/all');
const { resolveLook } = await import('@/ui/looks/registry');
const { at: subject } = await import('@/ui/looks/subject');

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
/** A new life as the game makes one from the creation screen: with the guide, the clock paused (`SlateApp`). */
const guided = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', tutorial: true, paused: true, ...extra });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** The guide read in order, through the chapter named, as I’ve Read It reads each (`tutorial.read`). */
function readTo(sim: Simulation, id: string): void {
  for (const c of CHAPTERS) {
    if (sim.universe.tutorial!.read.includes(c.id)) { if (c.id === id) return; continue; }
    sim.must({ kind: READ_KIND, payload: { chapterId: c.id } });
    if (c.id === id) return;
  }
}
/** TEST SETUP: rested, fed, steady and awake. */
const tend = (sim: Simulation) => {
  Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90, hygiene: 90 });
  sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
};
/** A jump from the top bar to `wanted`, the player going to each stop on the way (Go), the body tended (TEST SETUP). */
function jump(sim: Simulation, wanted: number): ScheduledItem[] {
  const stops: ScheduledItem[] = [];
  tend(sim);
  let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
  while (r.interruptedBy) {
    stops.push(r.interruptedBy);
    tend(sim);
    r = sim.advanceTo(carryOnTo({ item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go')!, { stopOnPlayerRequired: true, resumes: r.sentFrom });
  }
  tend(sim);
  return stops;
}

function drawn(sim: Simulation, screen: FunctionComponent, states: unknown[] = []) {
  h.sim = sim;
  h.buttons = [];
  h.states = [...states];
  const html = renderToStaticMarkup(createElement(screen));
  expect(h.states, 'every state given was taken').toHaveLength(0);
  const buttons = [...h.buttons];
  const text = html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  const all = (words: string) => buttons.filter((b) => b.text === words);
  const press = (words: string, nth = 0) => {
    const found = all(words);
    expect(found.length, `“${words}” on the screen`).toBeGreaterThan(nth);
    expect(found[nth]!.disabled ?? false, `“${words}” isn’t grayed out`).toBe(false);
    h.toasts = [];
    h.went = [];
    found[nth]!.onClick!();
    return { toasts: [...h.toasts], went: [...h.went] };
  };
  return { html, text, buttons, all, press };
}
const guideAt = (chapterId: string, states: unknown[] = []) => () => { h.states.unshift(chapterId, ...states); return createElement(GuideProvider, null); };
const body = (id: string) => CHAPTER_BY_ID[id]!.body.join(' ');
const statusOf = (sim: Simulation, id: string) => sim.universe.scheduled.find((i) => i.id === id)?.status;

// ---------------------------------------------------------------------------------------------------------------------

describe('1. Your Life, Hour By Hour', () => {
  it('PLAYER JOURNEY: a new life starts paused on Home; the line under the greeting shows the time, the town, its zone, the season and the weather; a panel not yet open says Locked and names its chapter', () => {
    const sim = guided('b20-ch-welcome');
    expect(body('welcome')).toContain('A new life starts with the clock paused');
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    readTo(sim, 'welcome');
    const home = drawn(sim, Home);
    const city = 'New Haven';
    const weather = weatherAt(sim, sim.player.currentLocationId)!;
    const line = /Good \w+, [^.]+\. (.+?) Calendar/.exec(home.text)?.[1] ?? '';
    for (const part of [formatTime(sim.now, sim.zone), city, zoneAbbreviation(sim.now, sim.zone), seasonOf(sim.now, sim.zone, 41.3), `${weather.temperature}°F`]) expect(line, part).toContain(part);
    // The Calendar panel is still shut: Locked, its chapter named, and Read About It to go there.
    expect(home.text).toContain('Calendar Locked What’s coming up, and when. It opens when you read “What’s Coming” in the guide.');
    expect(home.all('Read About It').length).toBeGreaterThan(0);
  });

  it('PLAYER JOURNEY: I’ve Read It at a chapter’s foot opens what it covers, listed under What It Opens; Next names the chapter after it', () => {
    const sim = guided('b20-ch-welcome-guide');
    const page = drawn(sim, guideAt('welcome'));
    expect(page.text).toContain(`What It Opens ${CHAPTER_BY_ID.welcome!.names.join(' ')}`);
    page.press('I’ve Read It');
    for (const f of CHAPTER_BY_ID.welcome!.opens) expect(isOpen(sim, f), f).toBe(true);
    expect(isOpen(sim, 'ui.calendar')).toBe(false);
    // FIXTURE: the dialog as I’ve Read It leaves it, the chapter just opened (its own state).
    const opened = drawn(sim, guideAt('welcome', [h.keep, h.keep, 'welcome']));
    expect(opened.all('Try It')).toHaveLength(1);
    expect(opened.all(`Next: ${CHAPTERS[1]!.title}`)).toHaveLength(1);
  });

  it('PLAYER JOURNEY: Save & Exit and Continue pick the life up at the same moment, with what was read', () => {
    const sim = guided('b20-ch-welcome-save');
    readTo(sim, 'advance');
    jump(sim, at(2026, 8, 25, 14, 37));
    const back = reload(sim);
    expect(back.now).toBe(sim.now);
    expect(back.universe.tutorial).toEqual(sim.universe.tutorial);
    expect(back.universe.preferences).toEqual(sim.universe.preferences);
  });
});

describe('2. What’s Coming', () => {
  /** Monday's classes, the clock stopped at nine on the way to noon, as the top bar's Advance stops it. */
  function atClasses(seed: string, through = 'advance') {
    const sim = guided(seed);
    readTo(sim, through);
    jump(sim, at(2026, 8, 31, 8));
    h.standing = null;
    h.sim = sim;
    tend(sim);
    const r = sim.advanceTo(at(2026, 8, 31, 12), { stopOnPlayerRequired: true });
    expect(r.interruptedBy?.label).toBe('Classes');
    h.standing = { item: r.interruptedBy!, wanted: at(2026, 8, 31, 12), sentFrom: r.sentFrom };
    return { sim, item: r.interruptedBy! };
  }

  it('PLAYER JOURNEY: the Calendar panel shows the next thing and how soon, and up to five more', () => {
    const sim = guided('b20-ch-calendar-panel');
    readTo(sim, 'advance');
    jump(sim, at(2026, 8, 31, 8));
    const home = drawn(sim, Home);
    // The next thing, how soon and when, then the five after it.
    expect(home.text).toContain('Calendar What’s coming up, and when.');
    expect(home.text).toContain('in 1 hour Classes August 31, 2026 at 9:00 AM');
    const rows = (home.html.match(/<span class="small clamp-2"/g) ?? []).length;
    expect(rows).toBe(5);
  });

  it('PLAYER JOURNEY: the clock stops at Classes and a dialog named for it asks; Go is there for its hours, the clock running on through them, and it counts as attended', () => {
    const { sim, item } = atClasses('b20-ch-calendar-go');
    const stop = drawn(sim, TimeControls);
    expect(stop.text).toMatch(/Classes ✕ It’s 9:00 AM on August 31, 2026, and this needs you now\. Going takes 6 hours, and the clock moves on to August 31, 2026 at 3:00 PM\./);
    expect(stop.all('Skip It')).toEqual([]);
    expect(stop.text).toContain('Only a plan of your own can be skipped, so there’s no Skip It button here.');
    const attended = sim.player.school!.tally!.attended;
    stop.press('Go');
    expect(sim.now).toBe(item.at + item.durationMinutes! * MS_MINUTE);
    expect(statusOf(sim, item.id)).toBe('done');
    expect(sim.player.school!.tally!.attended).toBe(attended + 1);
    expect(h.standing).toBeNull();
  });

  it('PLAYER JOURNEY: Stand Here closes the dialog with the clock paused at nine; the class starts the next time the clock moves, here Advance’s One Hour', () => {
    const { sim, item } = atClasses('b20-ch-calendar-stand');
    const nine = sim.now;
    drawn(sim, TimeControls).press('Stand Here');
    expect(h.standing).toBeNull();
    expect(sim.now).toBe(nine);
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    expect(statusOf(sim, item.id)).toBe('pending');
    const attended = sim.player.school!.tally!.attended;
    sim.advanceTo(sim.now + MS_HOUR, { stopOnPlayerRequired: true });
    expect(statusOf(sim, item.id)).toBe('done');
    expect(sim.player.school!.tally!.attended).toBe(attended + 1);
  });

  it('PLAYER JOURNEY: you miss a commitment you’re asleep for: Stand Here, then Sleep, and the class is missed and said so', () => {
    const { sim, item } = atClasses('b20-ch-calendar-asleep', 'sleep');
    drawn(sim, TimeControls).press('Stand Here');
    sim.must({ kind: 'life.sleep', payload: { hours: 2 } });
    expect(statusOf(sim, item.id)).toBe('missed');
    // The count in words since brief 20's life area (F12, 2026-10-22); until then "You Slept Through 1 Commitment".
    expect(sim.universe.notifications.some((n) => n.title === 'You Slept Through One Commitment')).toBe(true);
  });

  it('PLAYER JOURNEY: a plan of your own offers Skip It; it marks the plan missed and carries the clock on, as Go does', () => {
    const sim = guided('b20-ch-calendar-skip');
    readTo(sim, 'plans');
    jump(sim, at(2026, 8, 25, 17));
    const made = sim.must<{ ok: boolean; id?: string }>({ kind: 'calendar.schedule', payload: { title: 'Dinner With Sam', at: at(2026, 8, 25, 19), durationMinutes: 60 } });
    const r = sim.advanceTo(at(2026, 8, 25, 22), { stopOnPlayerRequired: true });
    expect(r.interruptedBy?.id).toBe(made.id);
    h.standing = { item: r.interruptedBy!, wanted: at(2026, 8, 25, 22), sentFrom: r.sentFrom };
    drawn(sim, TimeControls).press('Skip It');
    expect(statusOf(sim, made.id!)).toBe('missed');
    expect(sim.now).toBe(at(2026, 8, 25, 22));
  });
});

describe('3. The Clock', () => {
  it('PLAYER JOURNEY: Play starts the clock and the button then says Pause; a minute of the game is a minute of yours; the clock stops by itself at a commitment', () => {
    const sim = guided('b20-ch-clock');
    readTo(sim, 'clock');
    expect(drawn(sim, TimeControls).all('Play')).toHaveLength(1);
    drawn(sim, TimeControls).press('Play');
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    expect(drawn(sim, TimeControls).all('Pause')).toHaveLength(1);
    // Live: the provider's stepper at Play's one to one (`SPEED_MULTIPLIER.live`), a minute of the wall for a minute.
    expect(createClockStepper(1).feed(60_000)).toBe(60_000);
    // Running on its own, the clock stops at the first thing that wants you: Registration, on the first morning.
    const r = sim.advanceBy(3 * MS_HOUR, { stopOnPlayerRequired: true });
    expect(r.interruptedBy?.requiresPlayer).toBe(true);
    expect(sim.now).toBe(r.interruptedBy!.at);
  });

  it('PLAYER JOURNEY: Sleep runs straight through what’s in its hours, and its dialog lists them first', () => {
    const sim = guided('b20-ch-clock-sleep');
    readTo(sim, 'sleep');
    jump(sim, at(2026, 8, 31, 6));
    // FIXTURE: the Sleep dialog open (the bar's first state), four hours chosen (the dialog's own, after the menus').
    const dialog = drawn(sim, TimeControls, [true, h.keep, h.keep, h.keep, h.keep, 4]);
    expect(dialog.text).toContain('You’d sleep through one commitment: Classes — 9:00 AM');
    dialog.press('Sleep 4 Hours');
    expect(sim.now).toBe(at(2026, 8, 31, 10));
    expect(sim.universe.scheduled.find((i) => i.label === 'Classes' && i.at === at(2026, 8, 31, 9))?.status).toBe('missed');
  });
});

describe('4. Moving Time On', () => {
  it('PLAYER JOURNEY: Advance lists One Hour, This Evening, Tonight, Tomorrow Morning, Next Event, Next Monday and One Week, each with the day and time it lands, and Choose An Event', () => {
    const sim = guided('b20-ch-advance');
    readTo(sim, 'advance');
    jump(sim, at(2026, 8, 26, 10));
    // FIXTURE: the Advance menu open (its own state, after the bar's three and Look After Yourself's).
    const menu = drawn(sim, TimeControls, [h.keep, h.keep, h.keep, h.keep, true]);
    const lines = menu.buttons.filter((b) => /^(One Hour|This Evening|Tonight|Tomorrow Morning|Next Event|Next Monday|One Week|Choose An Event…)/.test(b.text)).map((b) => b.text);
    expect(lines.map((t) => t.replace(/\d.*$|No plans.*$|Pick from.*$/, '').replace(/ ?[A-Z][a-z]+ · .*$/, '').trim()).filter(Boolean).length).toBe(8);
    expect(lines.find((t) => t.startsWith('This Evening'))).toContain('6:00 PM · Wednesday, August 26, 2026');
    expect(lines.find((t) => t.startsWith('Tonight'))).toContain('10:00 PM · Wednesday, August 26, 2026');
    expect(lines.find((t) => t.startsWith('Tomorrow Morning'))).toContain('7:00 AM · Thursday, August 27, 2026');
    expect(lines.find((t) => t.startsWith('Next Monday'))).toContain('9:00 AM · Monday, August 31, 2026');
    expect(lines.find((t) => t.startsWith('One Week'))).toContain(`${formatTime(sim.now, sim.zone)} · Wednesday, September 2, 2026`);
  });

  it('PLAYER JOURNEY: a jump past commitments asks first, in On The Way, how many it passes, those not on the calendar yet among them; Advance there goes on and stops at the first, Cancel stays', () => {
    const sim = guided('b20-ch-advance-way');
    readTo(sim, 'advance');
    jump(sim, at(2026, 8, 28, 18));
    const week = at(2026, 9, 4, 18);
    const missed = onTheWay(sim, week);
    expect(missed.some((w) => w.foreseen)).toBe(true);
    // FIXTURE: On The Way open for One Week (the bar's third state), as pressing One Week opens it.
    const asked = drawn(sim, TimeControls, [h.keep, h.keep, { at: week, label: 'One Week', missed }]);
    expect(asked.text).toContain(`Moving the clock to One Week`);
    expect(asked.text).toContain('not on your calendar yet');
    const now = sim.now;
    drawn(sim, TimeControls, [h.keep, h.keep, { at: week, label: 'One Week', missed }]).press('Cancel');
    expect(sim.now).toBe(now);
    h.standing = null;
    drawn(sim, TimeControls, [h.keep, h.keep, { at: week, label: 'One Week', missed }]).press('Advance');
    expect(h.standing).not.toBeNull();
    expect(sim.now).toBe(missed[0]!.item.at);
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
  });

  it('PLAYER JOURNEY: Choose An Event opens Skip To Event, the next fourteen at most, and Skip To with its name goes there; time only moves forward', () => {
    const sim = guided('b20-ch-advance-skip');
    readTo(sim, 'advance');
    jump(sim, at(2026, 8, 26, 10));
    const targets = skipTargets(sim, 14);
    expect(targets.length).toBeLessThanOrEqual(14);
    let went: number | undefined;
    h.sim = sim;
    h.buttons = [];
    renderToStaticMarkup(createElement(SkipDialog, { onClose: () => undefined, onSkip: (t: number) => { went = t; } }));
    const skip = h.buttons.filter((b) => b.text.startsWith('Skip To '));
    expect(skip).toHaveLength(1);
    skip[0]!.onClick!();
    expect(went).toBe(targets[0]!.item.at);
    expect(() => sim.advanceTo(sim.now - MS_MINUTE)).toThrow();
  });
});

describe('5. What Needs You', () => {
  it('PLAYER JOURNEY: Mark N Read counts the notices it clears (its example, Mark 3 Read, at three unread), and with nothing waiting the panel says what still needs attention, such as two commitments at once', () => {
    const sim = guided('b20-ch-needs');
    readTo(sim, 'plans');
    jump(sim, at(2026, 8, 26, 12));
    // TEST SETUP: all but the three newest notices read by their ids, which the panel never sends.
    const unread = sim.universe.notifications.filter((n) => !n.read).sort((a, b) => b.at - a.at);
    sim.must({ kind: 'world.mark_read', payload: { notificationIds: unread.slice(3).map((n) => n.id) } });
    const home = drawn(sim, Home);
    home.press('Mark 3 Read');
    expect(sim.universe.notifications.filter((n) => !n.read)).toEqual([]);
    // Two plans at one hour: nothing is waiting, and the panel says the clash.
    for (const title of ['Dinner With Sam', 'Call Home']) sim.must({ kind: 'calendar.schedule', payload: { title, at: at(2026, 8, 30, 19), durationMinutes: 60 } });
    expect(drawn(sim, Home).text).toContain('No Questions Waiting Two things on your calendar in the next month are at the same time.');
  });
});

describe('6. How You Are', () => {
  /** Two lives alike from the same seed, at the same Saturday hour, awake. */
  const twins = (seed: string) => {
    const a = guided(seed);
    const b = guided(seed);
    for (const s of [a, b]) { readTo(s, 'body'); jump(s, at(2026, 8, 29, 10)); }
    return [a, b] as const;
  };

  it('energy runs down every hour awake, faster with sleep owed, and only sleep brings it back; stress eases while energy lasts, climbs once it’s gone, and money owed adds to it at the day’s turn', () => {
    // Twins at eleven on Friday night: one sleeps eight hours, the other four, so she wakes owing sleep; both are then up
    // on Saturday from eight to eleven, nothing on the calendar.
    const [rested, owing] = [guided('b20-ch-body-energy'), guided('b20-ch-body-energy')];
    for (const s of [rested, owing]) { readTo(s, 'looking-after'); jump(s, at(2026, 8, 28, 23)); }
    rested.must({ kind: 'life.sleep', payload: { hours: 8 } });
    owing.must({ kind: 'life.sleep', payload: { hours: 4 } });
    for (const s of [rested, owing]) { s.advanceTo(at(2026, 8, 29, 8)); s.player.wellbeing.energy = 80; }
    expect(owing.player.wokeWithDebt ?? 0).toBeGreaterThan(rested.player.wokeWithDebt ?? 0);
    for (const s of [rested, owing]) s.advanceTo(at(2026, 8, 29, 11));
    expect(rested.player.wellbeing.energy).toBeLessThan(80);
    expect(80 - owing.player.wellbeing.energy).toBeGreaterThan(80 - rested.player.wellbeing.energy);
    // And nothing but sleep brings it back: a meal and an hour unwinding leave it where the hours put it.
    const before = rested.player.wellbeing.energy;
    rested.player.wellbeing.nourishment = 30;
    for (const action of ['eat', 'unwind']) rested.must({ kind: 'life.look_after', payload: { action } });
    expect(rested.player.wellbeing.energy).toBeLessThan(before);
    // Money owed adds to stress every day, at the day's turn (`spending.day`, on `world.day_rollover`): twins at eleven
    // on Friday night, one overdrawn by a purchase (TEST SETUP: the posting), both carried past midnight.
    const [square, owes] = [guided('b20-ch-body-owing'), guided('b20-ch-body-owing')];
    for (const s of [square, owes]) { readTo(s, 'body'); jump(s, at(2026, 8, 28, 23)); }
    const account = owes.universe.accounts[owes.player.primaryAccountId!]!;
    owes.post({ memo: 'A purchase', category: 'shopping', postings: [{ accountId: account.id, amount: -(account.balance + 500_00) }, { accountId: owes.nominalAccount('expense', 'Shopping').id, amount: account.balance + 500_00 }] });
    expect(account.balance).toBeLessThan(0);
    for (const s of [square, owes]) s.advanceTo(at(2026, 8, 29, 0, 30));
    expect(owes.player.wellbeing.stress).toBeGreaterThan(square.player.wellbeing.stress);
    const [fresh, spent] = twins('b20-ch-body-stress');
    for (const s of [fresh, spent]) s.player.wellbeing.stress = 40;
    spent.player.wellbeing.energy = 0;
    for (const s of [fresh, spent]) s.advanceTo(s.now + MS_HOUR);
    expect(fresh.player.wellbeing.stress).toBeLessThan(40);
    expect(spent.player.wellbeing.stress).toBeGreaterThan(40);
  });

  it('readiness comes from energy, stress and the rest but fitness; pressing Readiness names at most three dials costing it most', () => {
    const [a] = twins('b20-ch-body-ready');
    const base = readiness(a.player);
    a.player.wellbeing.fitness += 20;
    expect(readiness(a.player)).toBe(base);
    a.player.wellbeing.morale -= 30;
    expect(readiness(a.player)).toBeLessThan(base);
    a.player.wellbeing.hygiene = 10;
    a.player.wellbeing.nourishment = 10;
    a.player.wellbeing.stress = 80;
    const look = resolveLook(a, subject('readiness', a.player.id));
    const ways = look && !('gone' in look) ? look.ways ?? [] : [];
    // Four dials low, and the look names three, each a way to its dial.
    expect(ways.map((w) => w.to.kind)).toEqual(['dial', 'dial', 'dial']);
    expect(look && !('gone' in look) ? look.summary : '').toMatch(/^\d+\. .+ are holding you back most\.$/);
  });
});

describe('7. Sleep', () => {
  it('the dialog asks from the shortest sleep to the longest night; Sleep 8 Hours (its example) runs the clock on eight hours', () => {
    const sim = guided('b20-ch-sleep');
    readTo(sim, 'sleep');
    jump(sim, at(2026, 8, 28, 22));
    const dialog = drawn(sim, TimeControls, [true, h.keep, h.keep, h.keep, h.keep, 8]);
    expect(dialog.html).toContain(`min="${SHORTEST_SLEEP}" max="${LONGEST_NIGHT}"`);
    const now = sim.now;
    dialog.press('Sleep 8 Hours');
    expect(sim.now).toBe(now + 8 * MS_HOUR);
  });

  it('energy comes back, less the more sleep is owed; more than about five hours of rest mends condition and less wears it down; a night under six hours adds to what’s owed', () => {
    const lives = (seed: string, set: Partial<Simulation['player']['wellbeing']>) => {
      const s = guided(seed);
      readTo(s, 'sleep');
      jump(s, at(2026, 8, 28, 22));
      Object.assign(s.player.wellbeing, { energy: 30, condition: 70, sleepDebt: 0 }, set);
      return s;
    };
    const fresh = lives('b20-ch-sleep-debt', {});
    const owing = lives('b20-ch-sleep-debt', { sleepDebt: 12 });
    for (const s of [fresh, owing]) s.must({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(fresh.player.wellbeing.energy - 30).toBeGreaterThan(owing.player.wellbeing.energy - 30);
    const long = lives('b20-ch-sleep-mend', {});
    const short = lives('b20-ch-sleep-mend', {});
    long.must({ kind: 'life.sleep', payload: { hours: 7 } });
    short.must({ kind: 'life.sleep', payload: { hours: 4 } });
    expect(long.player.wellbeing.condition).toBeGreaterThan(70);
    expect(short.player.wellbeing.condition).toBeLessThan(70);
    expect(short.player.wellbeing.sleepDebt).toBeGreaterThan(0);
    expect(long.player.wellbeing.sleepDebt).toBe(0);
  });

  it('while you’re at a commitment Sleep is refused, and the top bar says when you’ll be free', () => {
    const sim = guided('b20-ch-sleep-busy');
    readTo(sim, 'sleep');
    jump(sim, at(2026, 8, 31, 8));
    // Stood at Classes, then an hour on: the class is under way, nine to three.
    const r = sim.advanceTo(at(2026, 8, 31, 12), { stopOnPlayerRequired: true });
    expect(r.interruptedBy?.label).toBe('Classes');
    sim.advanceTo(sim.now + MS_HOUR, { stopOnPlayerRequired: true });
    const refused = sim.execute({ kind: 'life.sleep', payload: { hours: 2 } });
    expect(refused.ok).toBe(false);
    const bar = drawn(sim, TimeControls);
    expect(bar.all('Sleep')[0]!.disabled).toBe(true);
    expect(bar.text).toContain('You’re at Classes until 3:00 PM.');
  });
});

describe('8. Looking After Yourself', () => {
  it('PLAYER JOURNEY: each line shows its time, cost and change before it’s pressed; pressing Eat A Meal moves the clock on by its time and says when it was done', () => {
    const sim = guided('b20-ch-look-after');
    readTo(sim, 'looking-after');
    jump(sim, at(2026, 8, 29, 12));
    sim.player.wellbeing.nourishment = 5;
    const options = lookAfterOptions(sim);
    expect(options[0]!.action).toBe('eat');
    expect(options[0]!.urgent).toBe(true);
    // FIXTURE: Look After Yourself open (its own state, after the bar's three).
    const menu = drawn(sim, TimeControls, [h.keep, h.keep, h.keep, true]);
    const line = menu.buttons.find((b) => b.text.startsWith('Eat A Meal'))!;
    expect(line.text).toContain('Needed Now');
    // Its time, its cost and what it would change, said before it's pressed.
    expect(line.text).toMatch(/^Eat A MealNeeded Now\d+ minutes · \$\d+\.\d\d · .+Nourishment \d+ → \d+/);
    const meal = options[0]!;
    const now = sim.now;
    const morale = sim.player.wellbeing.morale;
    h.toasts = [];
    line.onClick!();
    expect(sim.now).toBe(now + meal.minutes * MS_MINUTE);
    expect(h.toasts).toEqual([`Eat A Meal: done at ${formatTime(sim.now, sim.zone)}.`]);
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(5);
    expect(sim.player.wellbeing.morale).toBeGreaterThanOrEqual(morale);
  });

  it('Shower cleans and eases stress; Unwind eases stress and lifts morale; Work Out builds fitness, eases stress, costs energy, uses food and leaves you needing a shower', () => {
    const sim = guided('b20-ch-look-after-each');
    readTo(sim, 'looking-after');
    jump(sim, at(2026, 8, 29, 11));
    const w = sim.player.wellbeing;
    Object.assign(w, { stress: 50, hygiene: 40 });
    sim.must({ kind: 'life.look_after', payload: { action: 'wash' } });
    expect(w.hygiene).toBeGreaterThan(40);
    expect(w.stress).toBeLessThan(50);
    Object.assign(w, { stress: 50, morale: 50 });
    sim.must({ kind: 'life.look_after', payload: { action: 'unwind' } });
    expect(w.stress).toBeLessThan(50);
    expect(w.morale).toBeGreaterThan(50);
    Object.assign(w, { stress: 50, energy: 80, nourishment: 80, hygiene: 90 });
    const fitness = w.fitness;
    sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
    expect(w.fitness).toBeGreaterThan(fitness);
    expect(w.stress).toBeLessThan(50);
    expect(w.energy).toBeLessThan(80);
    expect(w.nourishment).toBeLessThan(80);
    expect(w.hygiene).toBeLessThan(90);
  });
});

describe('9. Your Own Plans', () => {
  it('PLAYER JOURNEY: Put It On puts a plan on the calendar or says why it can’t; two at one time are marked Clash; Call It Off takes one off; a plan slept through is missed', () => {
    const sim = guided('b20-ch-plans');
    readTo(sim, 'plans');
    jump(sim, at(2026, 8, 26, 10));
    const one = sim.must<{ ok: boolean; id?: string; error?: string }>({ kind: 'calendar.schedule', payload: { title: 'Dinner With Sam', at: at(2026, 8, 26, 20), durationMinutes: 120 } });
    expect(one.ok).toBe(true);
    const past = sim.must<{ ok: boolean; error?: string }>({ kind: 'calendar.schedule', payload: { title: 'Too Late', at: at(2026, 8, 26, 8), durationMinutes: 60 } });
    expect(past.ok).toBe(false);
    expect(past.error).toBeTruthy();
    const two = sim.must<{ ok: boolean; id?: string }>({ kind: 'calendar.schedule', payload: { title: 'Call Home', at: at(2026, 8, 26, 20), durationMinutes: 60 } });
    const evening = entriesBetween(sim, at(2026, 8, 26, 19), at(2026, 8, 26, 23)).filter((e) => [one.id, two.id].includes(e.id));
    expect(evening.map((e) => e.conflicted)).toEqual([true, true]);
    expect(sim.must<{ ok: boolean }>({ kind: 'calendar.cancel', payload: { entryId: two.id } }).ok).toBe(true);
    expect(sim.timeline.get(two.id!)?.status).not.toBe('pending');
    jump(sim, at(2026, 8, 26, 19));
    sim.must({ kind: 'life.sleep', payload: { hours: 4 } });
    expect(sim.timeline.get(one.id!)?.status).toBe('missed');
    expect(sim.timeline.get(one.id!)?.kind).toBe(PLAN_KIND);
  });
});

describe('10. Weather', () => {
  it('the weather comes from the town and the season, the same however often you look, and looking changes nothing; each day and each hour open', () => {
    const sim = guided('b20-ch-weather');
    readTo(sim, 'weather');
    const city = sim.player.currentLocationId;
    const saved = serialise(sim.universe);
    expect(weatherAt(sim, city)).toEqual(weatherAt(sim, city));
    expect(forecastFor(sim, city, 6)).toEqual(forecastFor(sim, city, 6));
    const day = forecastFor(sim, city, 2)[1]!;
    for (const s of [subject('weather', city), subject('forecastday', `${city}/${day.dateKey}`), subject('hours', `${city}/${day.dateKey}`)]) {
      const look = resolveLook(sim, s);
      expect(look && !('gone' in look) ? look.name : undefined, s.kind).toBeTruthy();
    }
    expect(serialise(sim.universe)).toBe(saved);
  });

  it('the day’s weather decides whether a workout is a run; the flu’s weeks follow the town’s climate and not the day’s weather, as the chapter says from 2026-10-21', () => {
    expect(body('weather')).toContain('The day’s weather decides whether a workout is a run outdoors. The weeks when the flu goes around follow your town’s climate, not the day’s weather.');
    // Two worlds of the same town, their skies drawn apart: a dry, mild hour for a run in one and not the other, found on
    // the first mornings both have, and the flu's weeks the same in both, being the town's.
    const a = guided('b20-ch-weather-a');
    const b = guided('b20-ch-weather-b');
    let found: number | undefined;
    for (let d = 1; d <= 60 && found === undefined; d += 1) {
      const t = at(2026, 8, 24, 8) + d * MS_DAY;
      if (trainingAt(a, a.player, t).where !== trainingAt(b, b.player, t).where) found = t;
    }
    expect(found, 'a morning the two skies differ on').toBeDefined();
    expect(trainingAt(a, a.player, found!).builds).not.toBe(trainingAt(b, b.player, found!).builds);
    expect(weatherAt(a, a.player.currentLocationId, found!)).not.toEqual(weatherAt(b, b.player.currentLocationId, found!));
    expect(fluByWeek(a.player.currentLocationId)).toEqual(fluByWeek(b.player.currentLocationId));
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The chapters on the School, the actor and the career: each read, then its instructions done through the commands its
// buttons send (wiring.json), on a first-year as a new life makes one.
// ---------------------------------------------------------------------------------------------------------------------

describe('11. Drama School', () => {
  it('PLAYER JOURNEY: the School line’s button opens the School; classes run nine to three; Call In Sick is refused when well with the reason and excuses the day when ill', () => {
    const sim = guided('b20-ch-school');
    readTo(sim, 'school');
    jump(sim, at(2026, 8, 31, 7));
    expect(drawn(sim, Home).press(YALE_DRAMA.short).went).toEqual(['/workspace/school']);
    const classes = sim.universe.scheduled.find((i) => i.kind === CLASSES_KIND && i.status === 'pending' && i.at === at(2026, 8, 31, 9))!;
    expect(classes.durationMinutes).toBe(6 * 60);
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).error).toBe('You’re well enough to go. Staying away would count as an unexcused absence.');
    // TEST SETUP: condition under the chapter's line, as illness leaves it.
    sim.player.wellbeing.condition = ESTIMATE.sickBelow - 5;
    sim.must({ kind: 'school.call_in_sick', payload: {} });
    const excused = sim.player.school!.tally!.excused;
    sim.advanceTo(at(2026, 8, 31, 16), { stopOnPlayerRequired: false });
    expect(sim.player.school!.tally!.excused).toBe(excused + 1);
  });

  it('PLAYER JOURNEY: a piece’s step (Read The Scene) takes its time on the clock and says what it added; Take An Elective Shift books the next free evening, seven to eleven; Research It waits for Read It', () => {
    const sim = guided('b20-ch-school-work');
    readTo(sim, 'school');
    jump(sim, at(2026, 8, 31, 16));
    const piece = courseworkOf(sim, sim.player)!.assignments.find((a) => a.status === 'open' || a.status === undefined)!;
    const now = sim.now;
    const step = sim.must<{ moved: number; minutes: number }>({ kind: 'school.prepare', payload: { assignmentId: piece.id, activity: 'read' } });
    expect(step.minutes).toBeGreaterThan(0);
    expect(step.moved).toBeGreaterThan(0);
    expect(sim.now).toBe(now + step.minutes * MS_MINUTE);
    const shift = sim.must<{ at: number; hours: number }>({ kind: 'school.take_shift', payload: {} });
    expect(zonedParts(shift.at, NY).hour).toBe(19);
    expect(shift.hours).toBe(4);
    expect(sim.universe.scheduled.find((i) => i.at === shift.at && i.status === 'pending' && i.requiresPlayer)?.durationMinutes).toBe(240);
    const play = CONTEMPORARY_PLAYS[0]!.id;
    expect(sim.execute({ kind: 'plays.research', payload: { playId: play } }).error).toBe('Read the play first. You need questions before you can research it.');
    sim.must({ kind: 'plays.read', payload: { playId: play } });
    expect(sim.execute({ kind: 'plays.research', payload: { playId: play } }).ok).toBe(true);
  });
});

describe('11. Drama School: rehearsing with a partner', () => {
  it('PLAYER JOURNEY: Ask with the partner’s name, at least two hours ahead, is answered at once, and a yes puts the rehearsal on the calendar; sooner is refused with the reason', () => {
    const sim = guided('b20-ch-school-partner');
    readTo(sim, 'school');
    jump(sim, at(2026, 8, 31, 16));
    const scene = courseworkOf(sim, sim.player)!.assignments.find((a) => a.partner !== undefined)!;
    expect(scene).toBeDefined();
    const soon = sim.execute({ kind: 'school.ask_partner', payload: { assignmentId: scene.id, at: sim.now + MS_HOUR } });
    expect(soon.error).toMatch(/^Ask at least \w+ hours ahead\.$/);
    // Evenings ahead, one at a time, until one is said yes to: each answered at once, yes or no with the reason.
    let yes: { accepted: boolean; rehearsalId?: string; reason?: string } | undefined;
    for (let d = 1; d <= 6 && !yes?.accepted; d += 1) {
      const when = at(2026, 8, 31, 19) + (d - 1) * MS_DAY;
      const answer = sim.must<{ accepted: boolean; rehearsalId?: string; reason?: string }>({ kind: 'school.ask_partner', payload: { assignmentId: scene.id, at: when } });
      expect(answer.accepted || Boolean(answer.reason)).toBe(true);
      if (answer.accepted) yes = answer;
    }
    expect(yes?.accepted).toBe(true);
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.payload.rehearsalId === yes!.rehearsalId && i.requiresPlayer)).toBe(true);
  });
});

describe('12. You As An Actor', () => {
  it('PLAYER JOURNEY: Practice An Hour at Comic Timing (its example) moves the clock an hour and builds the technique; Study It reads or watches for an hour and a half and builds Familiarity', () => {
    const sim = guided('b20-ch-profile');
    readTo(sim, 'profile');
    jump(sim, at(2026, 8, 29, 10));
    const now = sim.now;
    const comedy = sim.player.craft!.comedy;
    const hour = sim.must<{ gained: number }>({ kind: 'practice.exercise', payload: { exercise: 'comic-timing', tier: 0, focus: 'steady' } });
    expect(sim.now).toBe(now + 60 * MS_MINUTE);
    expect(hour.gained).toBeGreaterThan(0);
    expect(sim.player.craft!.comedy).toBeGreaterThan(comedy);
    tend(sim);
    const before = sim.now;
    const studied = sim.must<{ familiarity: number }>({ kind: 'genre.study', payload: { genre: 'comedy' } });
    expect(sim.now).toBe(before + 90 * MS_MINUTE);
    expect(studied.familiarity).toBeGreaterThan(0);
  });

  it('PLAYER JOURNEY: on a brief, Read It This Way chooses the reading, and Tape It takes an hour and gives the tape’s result', () => {
    const sim = guided('b20-ch-profile-tape');
    readTo(sim, 'profile');
    jump(sim, at(2026, 8, 29, 10));
    const brief = briefFor('comedy')!;
    expect(sim.execute({ kind: 'practice.self_tape', payload: { genre: 'comedy', brief: brief.id } }).error).toBe('Choose a reading first. A self-tape plays the scene one way, so decide which before the camera rolls.');
    sim.must({ kind: 'brief.choose', payload: { brief: brief.id, reading: brief.readings[0]!.id } });
    tend(sim);
    const now = sim.now;
    const tape = sim.must<{ band: string; overall: number }>({ kind: 'practice.self_tape', payload: { genre: 'comedy', brief: brief.id } });
    expect(sim.now).toBe(now + 60 * MS_MINUTE);
    expect(typeof tape.band).toBe('string');
    expect(tape.overall).toBeGreaterThan(0);
  });
});

describe('13. Your Career', () => {
  it('PLAYER JOURNEY: Use This Name sets the name the résumé uses, and blank goes back to your own; Make Your Résumé takes an hour; Book A Headshot Session takes four hours and costs about $700', () => {
    const sim = guided('b20-ch-career');
    readTo(sim, 'career');
    jump(sim, at(2026, 8, 29, 10));
    expect(sim.must<{ name: string; set: boolean }>({ kind: 'pro.set_name', payload: { name: 'Ada Cole-Marsh' } })).toEqual({ name: 'Ada Cole-Marsh', set: true });
    let now = sim.now;
    sim.must({ kind: 'pro.update_resume', payload: {} });
    expect(sim.now).toBe(now + 60 * MS_MINUTE);
    expect(sim.player.pro!.materials.find((m) => m.kind === 'resume')!.name).toBe('Ada Cole-Marsh');
    expect(sim.must<{ name: string; set: boolean }>({ kind: 'pro.set_name', payload: { name: '' } })).toEqual({ name: sim.player.displayName, set: false });
    tend(sim);
    now = sim.now;
    const shot = sim.must<{ cost: number }>({ kind: 'pro.headshots', payload: {} });
    expect(sim.now).toBe(now + 240 * MS_MINUTE);
    expect(shot.cost).toBeGreaterThan(500_00);
    expect(shot.cost).toBeLessThan(900_00);
    expect(body('career')).toContain('Book A Headshot Session takes four hours and costs about $700.00, both estimated');
  });
});

describe('14. Representation', () => {
  it('PLAYER JOURNEY: the panel opens on the notice and I’ve Read This; Check Your Materials says what’s missing; his office takes nothing it hasn’t asked for, so Send Your Materials says how it can be reached', () => {
    const sim = guided('b20-ch-representation');
    readTo(sim, 'representation');
    jump(sim, at(2026, 8, 29, 10));
    const agent = AGENTS[0]!.id;
    expect(sim.execute({ kind: 'pro.agent_check', payload: { agentId: agent } }).ok).toBe(false);
    sim.must({ kind: 'pro.agent_notice', payload: { agentId: agent } });
    const checked = sim.execute({ kind: 'pro.agent_check', payload: { agentId: agent } });
    expect(checked.ok).toBe(false);
    expect(checked.error).toMatch(/headshots|résumé/i);
    expect(sim.execute({ kind: 'pro.send_materials', payload: { agentId: agent } }).error).toContain('It sees your materials only through the School’s follow-up after the showcase, or a referral from someone you’ve worked with.');
  });
});

describe('15. Finding Work', () => {
  it('PLAYER JOURNEY: new roles go up on Monday morning, each taking submissions for seven days; Submit Yourself with nothing to send says what’s missing', () => {
    const sim = guided('b20-ch-finding-work');
    readTo(sim, 'finding-work');
    jump(sim, at(2026, 9, 7, 12));
    const posted = sim.player.pro!.opportunities.filter((o) => o.postedAt >= at(2026, 9, 7, 0));
    expect(posted.length).toBeGreaterThan(0);
    for (const o of posted) {
      expect(zonedParts(o.postedAt, NY).hour).toBe(9);
      expect(new Date(o.postedAt).getUTCDay()).toBe(1);
      expect(o.submitBy - o.postedAt).toBe(7 * MS_DAY);
    }
    const open = posted.find((o) => o.via === 'open')!;
    const refused = sim.execute({ kind: 'pro.submit', payload: { opportunityId: open.id } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/headshot|résumé/i);
  });
});

describe('16. Cover, Benefits And Returns', () => {
  it('PLAYER JOURNEY: Papers opens from its line; while you’re at school Yale Health covers you, which the line says', () => {
    const sim = guided('b20-ch-papers');
    readTo(sim, 'papers');
    jump(sim, at(2026, 8, 29, 10));
    const home = drawn(sim, Home);
    expect(home.text).toContain('Cover: Yale Health');
    expect(home.press('Papers').went).toEqual(['/workspace/papers']);
  });
});

describe('17. Passports And ID', () => {
  it('PLAYER JOURNEY: Apply For One pays the passport office’s fee and says when it should arrive; Report Lost cancels a document for good', () => {
    const sim = guided('b20-ch-documents', { homeRegionId: 'uk-eng-london' });
    readTo(sim, 'documents');
    jump(sim, at(2026, 8, 29, 10));
    const paid = sim.universe.transactions.length;
    const passport = documentsOf(sim.player).find((d) => d.kind === 'passport' && d.status === 'valid')!;
    expect(passport).toBeDefined();
    const applied = sim.must<{ readyAt: number; fee: number }>({ kind: 'documents.apply_passport', payload: { expedite: false } });
    expect(applied.fee).toBeGreaterThan(0);
    expect(applied.readyAt).toBeGreaterThan(sim.now);
    expect(sim.universe.transactions.length).toBeGreaterThan(paid);
    sim.must({ kind: 'documents.report_lost', payload: { documentId: passport.id } });
    expect(passport.status).toBe('lost');
    sim.advanceTo(sim.now + MS_DAY);
    expect(passport.status).toBe('lost');
  });
});

describe('18. Money', () => {
  it('PLAYER JOURNEY: the Money line shows the primary checking account and what you’re worth, what you have less what you owe', () => {
    const sim = guided('b20-ch-money');
    readTo(sim, 'money');
    jump(sim, at(2026, 8, 29, 10));
    // TEST SETUP: $400.00 of shopping on the card, as a day's spending on it would leave it.
    const card = sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === 'credit_card')!;
    sim.post({ memo: 'Shopping', category: 'shopping', postings: [{ accountId: card.id, amount: -400_00 }, { accountId: sim.nominalAccount('expense', 'Shopping').id, amount: 400_00 }] });
    const primary = sim.universe.accounts[sim.player.primaryAccountId!]!;
    const worth = netWorth(sim, sim.player.id);
    expect(worth.liabilities).toBe(400_00);
    // What you have, less what you owe.
    expect(worth.total).toBe(worth.cash + worth.held + worth.pension - 400_00);
    const cur = saveCurrency(sim.universe);
    const text = drawn(sim, Home).text;
    expect(text).toContain(`Money ${primary.name}:`);
    expect(text).toContain(`Worth ${formatMoney(worth.total, cur, { cents: false })}, after ${formatMoney(400_00, cur, { cents: false })} owed.`);
  });
});

describe('19. Your Bank', () => {
  it('PLAYER JOURNEY: Move Money between two accounts at the same bank moves at once', () => {
    const sim = guided('b20-ch-bank');
    readTo(sim, 'bank');
    jump(sim, at(2026, 8, 29, 10));
    const primary = sim.universe.accounts[sim.player.primaryAccountId!]!;
    const has = () => sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === 'savings' && a.bankId === primary.bankId && !a.closedAt);
    if (!has()) sim.must({ kind: 'bank.open_savings', payload: { bankId: primary.bankId } });
    const savings = sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === 'savings' && a.bankId === primary.bankId && !a.closedAt)!;
    const before = { from: primary.balance, to: savings.balance };
    sim.must({ kind: 'bank.transfer', payload: { fromId: primary.id, toId: savings.id, amount: 100_00 } });
    expect(primary.balance).toBe(before.from - 100_00);
    expect(savings.balance).toBe(before.to + 100_00);
  });
});

describe('20. A Whole Life', () => {
  it('PLAYER JOURNEY: your birthday comes every year at nine in the morning, and your name on Home opens your own page', () => {
    const sim = guided('b20-ch-life', { birthMonth: 9, birthDay: 12 } as Partial<NewSaveConfig>);
    readTo(sim, 'life');
    const birthday = sim.universe.scheduled.find((i) => i.kind === BIRTHDAY_KIND && i.status === 'pending')!;
    const p = zonedParts(birthday.at, sim.zone);
    expect([p.month, p.day, p.hour, p.minute]).toEqual([9, 12, 9, 0]);
    jump(sim, birthday.at + MS_HOUR);
    const next = sim.universe.scheduled.find((i) => i.kind === BIRTHDAY_KIND && i.status === 'pending')!;
    expect(zonedParts(next.at, sim.zone)).toMatchObject({ year: p.year + 1, month: 9, day: 12, hour: 9 });
    expect(drawn(sim, Home).html).toContain(sim.player.firstName);
    const look = resolveLook(sim, subject('person', sim.player.id));
    expect(look && !('gone' in look) ? look.name : undefined).toBe(sim.player.displayName);
  });
});
