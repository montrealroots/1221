/**
 * Home's What Needs You, the top bar and the guide, pressed as the player presses them (from 2026-10-21, the owner's
 * brief 20: C1 and C2, "remembered" and "not contradicted", and D1's "UI controls connected to the wrong action"; the
 * guide area's audit, `docs/verification/audit-2026-10-21/areas/guide/`).
 *
 * What it holds:
 * - a question's answer on Home does what its button says, to the thing its row is about: with two offers waiting, the
 *   second row's Accept The Offer accepts the second offer and leaves the first standing, and the first row's Decline The
 *   Offer declines the first;
 * - an answer can't be given twice: the row leaves Home, and the same answer sent again is refused in the game's words
 *   with nothing done again;
 * - an answer that can't be done says why and leaves the question open, as “What Needs You” says;
 * - Dismiss takes the row off and the game then refuses an answer to it, and a second Dismiss, in its own words, while
 *   what it was about still stands on its own screen;
 * - Mark N Read marks every unread notice read, N of them, and a notice read stays read through a save and a load; a
 *   notice said again word for word while unread isn't said twice;
 * - Go There on a notice goes to the route the notice names, and the provider keeps the tab a route names;
 * - the top bar's Play and Pause, and the Sleep dialog's Sleep N Hours, run the command the button names with what it
 *   says; and the guide's I’ve Read It reads the chapter on the page, offered only on the next chapter.
 *
 * Drawn with react-dom/server as tests/evidence2-b01.test.ts draws them: every button's own handler is kept on its way
 * through the JSX runtime and pressed as the player presses it, with `useGame`'s `run` the save's own `execute` (a
 * refusal toasted, as the provider's `run` toasts it) and `navigate` written down. A component's open state is given
 * through its own useState (FIXTURE), in render order.
 *
 * TEST SETUP, said again where it's made: the body kept fed and rested as the clock moves (`tended`); two offers made
 * as tests/pro-opportunities-screen.test.ts makes one (the opportunity as casting's draw leaves it), each raised as a
 * question with the answers the work loop's own `makeOffer` gives it (`systems/projobs.ts`), since the draw that makes an
 * offer is the career's and played in its own tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot } from 'react-dom/client';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { openDecisions, unreadNotifications } from '@/engine/world/world';
import { CHAPTERS } from '@/engine/content/tutorial';
import { READ_KIND } from '@/engine/world/tutorial';
import { PROJECTS } from '@/engine/content/careerwork';
import { payTermsOf } from '@/engine/systems/projobs';
import { readiness } from '@/engine/systems/life';
import { STANDING_LABEL, rankIn } from '@/engine/systems/school';
import { coverLabel } from '@/engine/systems/health';
import { ordinal } from '@/engine/core/text';
import { formatTime } from '@/engine/core/time';
import type { Opportunity } from '@/engine/systems/pro';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  live: undefined as unknown,
  /** FIXTURE: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  toasts: [] as string[],
  went: [] as string[],
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
    // As the provider's `run`: the save's own `execute`, a refusal said in a toast unless it's silent.
    run: (kind: string, payload: Record<string, unknown> = {}, options: { silent?: boolean } = {}) => {
      const r = h.sim.execute({ kind, payload });
      if (!r.ok && !options.silent) h.toasts.push(r.error ?? '');
      return r;
    },
    toast: (message: string) => { h.toasts.push(message); },
    navigate: (route: string) => { h.went.push(route); },
    route: '/home', breadcrumbs: [], recent: [], favourites: [], toasts: [], saving: false, saveError: undefined, standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => h.live ?? game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { Home } = await import('@/ui/screens/Home');
await import('@/ui/looks/all');
const { resolveLook } = await import('@/ui/looks/registry');
const { at: subject } = await import('@/ui/looks/subject');
const { kept } = await import('@/ui/kept');
const { tabKey } = await import('@/ui/shell/sections');
const { TimeControls } = await import('@/ui/shell/TimeControls');
const { GuideProvider } = await import('@/ui/guide/Guide');
const provider = await vi.importActual<typeof import('@/app/game-context')>('@/app/game-context');

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const student = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

/** A screen as the player has it, its buttons kept with their own handlers; `states` (FIXTURE) given in render order. */
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

/**
 * TEST SETUP: an offer standing for a role, as casting's draw leaves it, raised as a question with the work loop's own
 * answers (`makeOffer`, `systems/projobs.ts`), its urgency and its date.
 */
function offered(sim: Simulation, projectId: string, posted: number, urgency: number): Opportunity {
  const t = PROJECTS.find((x) => x.id === projectId)!;
  const terms = payTermsOf({ projectId, postedAt: posted });
  const o: Opportunity = {
    id: sim.nextId('pro'), projectId, via: 'open', status: 'offered', postedAt: posted, submitBy: posted + 7 * MS_DAY, history: [], counts: {},
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units },
  };
  sim.player.pro!.opportunities.push(o);
  sim.requireDecision({
    urgency, category: 'career', title: `An Offer For ${t.role.part}`, dueAt: o.offer!.until, route: '/workspace/career', refType: 'pro.offer', refId: o.id,
    detail: `An offer for ${t.role.part}.`,
    actions: [
      { label: 'Accept The Offer', commandKind: 'pro.accept_offer', payload: { opportunityId: o.id } },
      { label: 'Decline The Offer', commandKind: 'pro.decline_offer', payload: { opportunityId: o.id } },
    ],
  });
  return o;
}

/** Two offers waiting on Home, the second more urgent, so it's drawn first. */
function twoOffers(seed: string, extra: Partial<NewSaveConfig> = {}) {
  const sim = student(seed, extra);
  tended(sim, at(2026, 12, 14, 12));
  const first = offered(sim, 'eastview', at(2026, 12, 14), 70);
  const second = offered(sim, 'paper-moons-ivy', at(2026, 12, 14), 80);
  const rows = openDecisions(sim);
  const rowOf = (o: Opportunity) => rows.find((d) => d.refId === o.id)!;
  // The second, more urgent, is drawn above the first.
  expect(rows.map((d) => d.refId)).toEqual([second.id, first.id]);
  return { sim, first, second, rowOf };
}

describe('a question’s answers on Home', () => {
  it('PLAYER JOURNEY: with two offers waiting, the second row’s Accept The Offer accepts the second offer and leaves the first standing; the first row’s Decline The Offer declines the first', () => {
    const { sim, first, second, rowOf } = twoOffers('b20-guide-two-offers');
    const home = drawn(sim, Home);
    // Each row draws its answers as its own buttons, in the row's order: the second offer's row first.
    expect(home.all('Accept The Offer')).toHaveLength(2);
    expect(home.all('Decline The Offer')).toHaveLength(2);
    expect(home.press('Accept The Offer', 0).toasts).toEqual([]);
    expect(second.status).toBe('booked');
    expect(sim.player.pro!.engagements.map((e) => e.opportunityId)).toEqual([second.id]);
    expect(first.status).toBe('offered');
    expect(rowOf(second).resolvedAt).toBe(sim.now);
    expect(rowOf(first).resolvedAt).toBeUndefined();

    // Drawn again, the answered row is gone and one row is left, the first offer's: its Decline declines it.
    const again = drawn(sim, Home);
    expect(again.all('Accept The Offer')).toHaveLength(1);
    expect(again.text).not.toContain('An Offer For Ivy');
    again.press('Decline The Offer');
    expect(first.status).toBe('declined');
    expect(rowOf(first).resolvedAt).toBe(sim.now);
    expect(sim.player.pro!.engagements).toHaveLength(1);
    expect(openDecisions(sim)).toEqual([]);
  });

  it('PLAYER JOURNEY: an answer given can’t be given again: the row has left Home, the same answer sent again is refused in the game’s words, and nothing is booked twice', () => {
    const { sim, second, rowOf } = twoOffers('b20-guide-once');
    drawn(sim, Home).press('Accept The Offer', 0);
    const booked = JSON.stringify(sim.player.pro!.engagements);
    const row = rowOf(second);
    const twice = sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: row.id, actionIndex: 0 } });
    expect(twice.ok).toBe(false);
    expect(twice.error).toBe('That question is already settled: it was answered, or its date passed.');
    expect(JSON.stringify(sim.player.pro!.engagements)).toBe(booked);
    // Its other answer is refused the same way: settled is settled.
    expect(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: row.id, actionIndex: 1 } }).error).toBe('That question is already settled: it was answered, or its date passed.');
    expect(second.status).toBe('booked');
    // Kept through a save: opened again, it's still settled and still refused.
    const back = reload(sim);
    expect(back.universe.decisions[row.id]!.resolvedAt).toBe(row.resolvedAt);
    expect(back.execute({ kind: 'world.take_decision_action', payload: { decisionId: row.id, actionIndex: 0 } }).error).toBe('That question is already settled: it was answered, or its date passed.');
  });

  it('PLAYER JOURNEY: an answer that can’t be done says why and leaves the question open, as “What Needs You” says: an F-1 student’s Accept The Offer in term', () => {
    const { sim, second, rowOf } = twoOffers('b20-guide-f1', { homeRegionId: 'uk-eng-london' });
    const said = drawn(sim, Home).press('Accept The Offer', 0).toasts;
    expect(said).toHaveLength(1);
    expect(said[0]).toMatch(/^Your F-1 /);
    expect(second.status).toBe('offered');
    expect(rowOf(second).resolvedAt).toBeUndefined();
    expect(openDecisions(sim).map((d) => d.refId)).toContain(second.id);
    expect(drawn(sim, Home).all('Accept The Offer')).toHaveLength(2);
  });

  it('PLAYER JOURNEY: Dismiss takes the row off Home; the game then refuses an answer to it and a second Dismiss, in its own words, and the offer still stands on the Career screen', () => {
    const { sim, second, rowOf } = twoOffers('b20-guide-dismiss');
    const home = drawn(sim, Home);
    expect(home.all('Dismiss')).toHaveLength(2);
    home.press('Dismiss', 0);
    const row = rowOf(second);
    expect(row.dismissedAt).toBe(sim.now);
    expect(row.resolvedAt).toBeUndefined();
    expect(openDecisions(sim).map((d) => d.refId)).not.toContain(second.id);
    expect(drawn(sim, Home).all('Dismiss')).toHaveLength(1);
    expect(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: row.id, actionIndex: 0 } }).error).toBe('You dismissed that question, so it can’t be answered from What Needs You.');
    expect(sim.execute({ kind: 'world.dismiss_decision', payload: { decisionId: row.id } }).error).toBe('You’ve already dismissed that question.');
    expect(second.status).toBe('offered');
    // What it was about still stands: the offer is accepted on its own tab, which sends the command directly.
    expect(sim.execute({ kind: 'pro.accept_offer', payload: { opportunityId: second.id } }).ok).toBe(true);
    expect(second.status).toBe('booked');
    // A dismissal is kept through a save.
    expect(reload(sim).universe.decisions[row.id]!.dismissedAt).toBe(row.dismissedAt);
  });
});

describe('notices on Home', () => {
  it('PLAYER JOURNEY: Mark N Read marks every unread notice read, N of them, the ones past the panel’s six too, and they stay read through a save and a load', () => {
    const sim = student('b20-guide-mark');
    tended(sim, at(2026, 8, 29, 18));
    const unread = unreadNotifications(sim);
    expect(unread.length).toBeGreaterThan(6);
    const home = drawn(sim, Home);
    const mark = home.buttons.filter((b) => /^Mark \d+ Read$/.test(b.text));
    expect(mark.map((b) => b.text)).toEqual([`Mark ${unread.length} Read`]);
    home.press(`Mark ${unread.length} Read`);
    expect(unreadNotifications(sim)).toEqual([]);
    expect(sim.universe.notifications.filter((n) => unread.some((u) => u.id === n.id)).every((n) => n.read)).toBe(true);
    // Saved and opened again: still read, nothing on Home, and the notice's own page says it's been read.
    const back = reload(sim);
    expect(unreadNotifications(back)).toEqual([]);
    expect(back.universe.notifications.map((n) => [n.id, n.read])).toEqual(sim.universe.notifications.map((n) => [n.id, n.read]));
    const home2 = drawn(back, Home);
    expect(home2.buttons.some((b) => /^Mark \d+ Read$/.test(b.text))).toBe(false);
    const looked = resolveLook(back, subject('notification', unread[0]!.id));
    expect(looked && !('gone' in looked) ? looked.summary : '').toMatch(/^You’ve read this notice\./);
    // And it stays read as the clock goes on: a day later, none of them is unread again.
    tended(back, back.now + MS_DAY);
    expect(back.universe.notifications.filter((n) => unread.some((u) => u.id === n.id)).every((n) => n.read)).toBe(true);
  });

  it('a notice said again word for word while the first is unread isn’t said twice; once read, the same words are a new notice', () => {
    const sim = quickSave({}, 'b20-guide-twice');
    const say = () => sim.notify({ category: 'life', title: 'A Test Of The Same Words', body: 'The same words.', importance: 50 });
    say();
    sim.advanceTo(sim.now + MS_HOUR);
    say();
    expect(sim.universe.notifications.filter((n) => n.title === 'A Test Of The Same Words')).toHaveLength(1);
    sim.must({ kind: 'world.mark_read', payload: {} });
    say();
    expect(sim.universe.notifications.filter((n) => n.title === 'A Test Of The Same Words').map((n) => n.read)).toEqual([true, false]);
  });

  it('PLAYER JOURNEY: Go There on a notice goes to the route it names; the provider opens that screen at the tab the route names, and a route with none leaves the tab as it was', () => {
    const sim = student('b20-guide-go-there');
    tended(sim, at(2026, 8, 25, 12));
    // TEST SETUP: two notices with the routes the engine gives its own, one naming a tab (the pay's), one only a screen.
    sim.notify({ category: 'career', title: 'Paid For A Test', body: 'Paid.', importance: 99, route: '/workspace/career?tab=work' });
    sim.notify({ category: 'school', title: 'A School Test', body: 'A school notice.', importance: 98, route: '/workspace/school' });
    const home = drawn(sim, Home);
    const there = home.all('Go There');
    expect(there.length).toBeGreaterThanOrEqual(2);
    // The two most important notices are drawn first, each with its own Go There.
    expect(home.press('Go There', 0).went).toEqual(['/workspace/career?tab=work']);
    expect(home.press('Go There', 1).went).toEqual(['/workspace/school']);
  });
});

describe('the provider’s way to a screen and its tab', () => {
  const page = globalThis as Record<string, unknown>;
  const was = { window: page.window, document: page.document, act: page.IS_REACT_ACT_ENVIRONMENT };
  beforeEach(() => {
    const listens = { addEventListener: () => undefined, removeEventListener: () => undefined };
    // FIXTURE: the page's window and document, which a node test has none of.
    Object.assign(globalThis, {
      IS_REACT_ACT_ENVIRONMENT: true,
      window: { ...listens, setInterval: () => 0, clearInterval: () => undefined, setTimeout: () => 0, location: { hash: '' }, history: { replaceState: () => undefined, pushState: () => undefined, back: () => undefined }, HTMLIFrameElement: class {} },
      document: { ...listens, visibilityState: 'visible', activeElement: null },
    });
  });
  afterEach(() => {
    h.live = undefined;
    for (const key of ['window', 'document'] as const) { if (was[key] === undefined) delete page[key]; else page[key] = was[key]; }
    if (was.act === undefined) delete page.IS_REACT_ACT_ENVIRONMENT; else page.IS_REACT_ACT_ENVIRONMENT = was.act;
  });

  it('PLAYER JOURNEY: a notice’s route with a tab opens its screen on that tab; one with none opens the screen where it was left', () => {
    const sim = quickSave({ paused: true }, 'b20-guide-provider');
    const Child = () => { h.live = provider.useGame(); return null; };
    const element = { nodeType: 1, tagName: 'DIV', namespaceURI: 'http://www.w3.org/1999/xhtml', textContent: '', addEventListener: () => undefined, removeEventListener: () => undefined, ownerDocument: { addEventListener: () => undefined, removeEventListener: () => undefined } };
    const root = createRoot(element as never);
    act(() => root.render(createElement(provider.GameProvider, { sim, adapter: { save: async () => undefined } as never, onExit: () => undefined, children: createElement(Child) })));
    const live = () => h.live as import('@/app/game-context').GameContextValue;
    act(() => live().navigate('/workspace/career?tab=work', 'Career'));
    expect(live().route).toBe('/workspace/career');
    expect(kept(tabKey('/workspace/career'))).toBe('work');
    act(() => live().navigate('/workspace/school', 'School'));
    expect(live().route).toBe('/workspace/school');
    expect(kept(tabKey('/workspace/career'))).toBe('work');
    expect(kept(tabKey('/workspace/school'))).toBeUndefined();
    act(() => root.unmount());
  });
});

describe('Home’s panels and the ways off them', () => {
  it('PLAYER JOURNEY: How You Are shows the energy, stress and readiness the life holds; Where You Are the town, its local time and daylight; the lines in Your Affairs what the save holds', () => {
    const sim = student('b20-guide-panels');
    tended(sim, at(2026, 9, 2, 16, 20));
    sim.player.wellbeing.energy = 47.4;
    sim.player.wellbeing.stress = 22.6;
    const { text } = drawn(sim, Home);
    expect(text).toContain(`Energy ${Math.round(47.4)} Stress ${Math.round(22.6)} Readiness ${Math.round(readiness(sim.player))}`);
    expect(text).toContain(`Local Time ${formatTime(sim.now, sim.zone)} EDT`);
    expect(text).toMatch(/Where You Are How This Works New Haven , Connecticut · United States/);
    const school = sim.player.school!;
    expect(text).toContain(`School Year 1, ${STANDING_LABEL[school.standing].toLowerCase()}, ${ordinal(rankIn(sim.player))} of 16 in the class.`);
    expect(text).toContain(`Cover: ${coverLabel(sim.player, sim.now)}.`);
  });

  it('PLAYER JOURNEY: Open Calendar goes to the calendar, the bank’s own name to Money, Yale to the School and Papers to Papers', () => {
    const sim = student('b20-guide-ways');
    tended(sim, at(2026, 8, 26, 12));
    const home = drawn(sim, Home);
    const bank = sim.universe.accounts[sim.player.primaryAccountId!]!.institution!;
    expect(home.press('Open Calendar').went).toEqual(['/workspace/calendar']);
    expect(home.press(bank).went).toEqual(['/workspace/bank']);
    expect(home.press('Yale').went).toEqual(['/workspace/school']);
    expect(home.press('Papers').went).toEqual(['/workspace/papers']);
  });
});

describe('the top bar', () => {
  it('PLAYER JOURNEY: Play on a paused save starts the clock (world.set_preferences, live), and Pause stops it', () => {
    const sim = student('b20-guide-play', { paused: true });
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    drawn(sim, TimeControls).press('Play');
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    drawn(sim, TimeControls).press('Pause');
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
  });

  it('PLAYER JOURNEY: the Sleep dialog’s Sleep 8 Hours sleeps eight hours: the clock moves on by eight and energy comes back', () => {
    const sim = student('b20-guide-sleep');
    tended(sim, at(2026, 8, 24, 22));
    Object.assign(sim.player.wellbeing, { energy: 30, sleepDebt: 2 });
    const before = { now: sim.now, energy: sim.player.wellbeing.energy };
    // FIXTURE: the dialog open (the bar's first state), its hours at eight (the dialog's own state, after the two menus').
    const bar = drawn(sim, TimeControls, [true, h.keep, h.keep, h.keep, h.keep, 8]);
    expect(bar.all('Sleep 8 Hours')).toHaveLength(1);
    expect(bar.press('Sleep 8 Hours').toasts).toEqual([]);
    expect(sim.now).toBe(before.now + 8 * MS_HOUR);
    expect(sim.player.wellbeing.energy).toBeGreaterThan(before.energy + 30);
  });
});

describe('the guide', () => {
  it('PLAYER JOURNEY: I’ve Read It reads the chapter on the page, which opens what it names; a later chapter offers no I’ve Read It', () => {
    const sim = quickSave({ tutorial: true, paused: true }, 'b20-guide-read');
    expect(sim.universe.tutorial!.read).toEqual([]);
    // FIXTURE: the guide open at its first chapter (the provider's own state), the dialog's own left as they start.
    const first = drawn(sim, () => createElement(GuideProvider, null), [CHAPTERS[0]!.id]);
    expect(first.all('Later')).toHaveLength(1);
    first.press('I’ve Read It');
    expect(sim.universe.tutorial!.read).toEqual([CHAPTERS[0]!.id]);
    expect(sim.execute({ kind: READ_KIND, payload: { chapterId: CHAPTERS[0]!.id } }).error).toBe(`You’ve already read “${CHAPTERS[0]!.title}”.`);
    // Opened at a chapter two on: Close and Next Unread, and no I’ve Read It.
    const later = drawn(sim, () => createElement(GuideProvider, null), [CHAPTERS[3]!.id]);
    expect(later.all('I’ve Read It')).toEqual([]);
    expect(later.all('Close')).toHaveLength(1);
    expect(later.all(`Next Unread: ${CHAPTERS[1]!.title}`)).toHaveLength(1);
    later.press(`Next Unread: ${CHAPTERS[1]!.title}`);
    expect(sim.universe.tutorial!.read).toEqual([CHAPTERS[0]!.id]);
  });
});
