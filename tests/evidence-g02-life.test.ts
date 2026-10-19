/**
 * Evidence for seven life rows the review of 2026-10-13 left partial (verification group g02-life): calling off a plan
 * of your own, dismissing and acting on a decision, the clock's speed, reading the guide, appealing a denied claim and
 * applying for a hospital's financial assistance. Each row's gaps are closed here through the command its screen sends
 * and the clock, and each consequence is read where the row says it's read, against figures worked out from the rule's
 * own numbers, never from the helper the engine computes them with.
 *
 * - `calendar.cancel`: a Call ten minutes off refuses a shower in Look After's words ("Call is at 7:40 AM, and there
 *   isn’t time."); Call It Off, pressed on the Calendar's entry, takes it off the Next Thirty Days and the shower is
 *   taken; the clock runs past where it was, across a reload, where a twin that kept it stops. A second press, an
 *   unknown id, the world's own item and a plan already begun are refused in their words, and the world's item is
 *   offered no Call It Off.
 * - `world.dismiss_decision`: the real "Your 2026 Tax Return", raised on 1 February 2027, dismissed from Home's card;
 *   refused a second time and for an unknown id; across a reload its File It is refused "You dismissed that question,
 *   so it can’t be answered from What Needs You." ("It’s dismissed." until 2026-10-17, brief 14); the return
 *   is still unfiled and unpaid, comes late in April, and the IRS is set to file it; the row is kept 180 days and
 *   forgotten after. A dated row was kept until its date had passed, and an undated one not, until 2026-10-14, when the
 *   owner had the keeping and the undated row go: a dismissed row is forgotten 180 days on, its date ahead or not. A
 *   raiser asking again after a dismissal raises a fresh row, which is what `requireDecision` does (so `world.ts`'s note that a raiser
 *   reads a dismissal off a kept row was not true; it was corrected on 2026-10-13, and says so in the past tense).
 * - `world.take_decision_action`: File It pressed on Home files the return (`filedAt`) and pays its tax, 10% of the
 *   income on a 1040-NR; refused a second time with nothing filed or paid again, across a reload too, and nothing
 *   late in April; a row whose button calls off a plan (undated until 2026-10-14) is closed by the press itself and
 *   forgotten 180 days on; an unknown id and an index with no action are refused in their words, the row left open.
 * - `world.set_preferences`: a key that isn't a preference is refused in its words and nothing is kept; Pause on the
 *   top bar stops the page's live clock (`GameProvider`'s tick, `SPEED_MULTIPLIER` 0) and Play runs it a second a
 *   second, and a paused save opens paused.
 * - `tutorial.read`: every chapter read through the guide's own I’ve Read It; a finished guide missing chapters, as one
 *   added later would be, stays open (`isOpen`, `nextChapter`, the guard); a guide read to its end before 2026-10-12
 *   is marked finished on opening, and one a chapter short is not; an unknown chapter and a life with no guide are
 *   refused in their words. The top bar’s Guide button counts no chapters left on a finished guide; until 2026-10-13 it
 *   counted the ones added later, which the guide never lets be read, and its test failed when written; fixed that day.
 * - `health.appeal`: on the New Haven student, a marketplace claim denied (the student withdrawn and enrolled in
 *   October's open enrollment). Appeal It on Papers; a second appeal refused; overturned, the refund of what was paid
 *   over the plan's share, once, across a reload; upheld, the bill and the bank as they were; overturned after going
 *   to debt, the debt down to the share exactly; a denial 181 days old refused. A debt paid down past the share before
 *   an overturn gets back what was paid over it, and the bill is settled; until 2026-10-13 that was kept, and the bill
 *   read Owed As Debt, and its test failed when written; fixed that day.
 * - `health.apply_aid`: the student's $50 Yale New Haven emergency bill. With no income, Free Care: nothing paid when
 *   it falls due. At $60,000 a year, 67% off: $16.50 paid when it falls due, across a reload (a third of $50 to the
 *   cent; the review's todo said $17.00, which no rounding of $16.50 reaches). Applied for twice, and past due,
 *   refused in its words.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actor at Yale in
 * New Haven, starting Monday 24 August 2026 at 7:30 AM, played on the clock (`advanceTo`), never by calling a handler.
 * The tax return's question is played on the same life born in London, at Yale on an F-1 visa (`taxSeason`).
 * The screens are rendered as the player has them (react-dom/server) with `useGame`'s `run` as the save's own
 * `execute`; a pressed button is the component's own onClick, kept on its way through the JSX runtime. The page's
 * live clock is the real `GameProvider`, rendered the same way.
 *
 * TEST SETUP, said again where it's done: the calendar cleared of what wants the player; hygiene set before a shower;
 * a decision raised through `requireDecision` where the row is the raiser's, not the game's; the guide's read list cut
 * as a chapter added later would leave it, and a save's `finished` taken off as a save from before 2026-10-12 has it;
 * a month's or a year's earnings put on the record; a doctor's visit or an emergency billed through `careFor`, as the
 * week's draw bills one; balances emptied or put back by postings against a test equity line. FIXTURE: a dialog's or
 * a panel's open state, set through the component's own useState; the page's window, which these tests run without
 * (`environment: 'node'`); and React's commit, which a server render doesn't run: the provider's effects are run as a
 * page runs them once it mounts, and their cleanups as it unmounts.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_MINUTE, instantFromZoned } from '@/engine/core/time';
import { titleCaseLabel } from '@/engine/core/text';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { careFor, coverOn, healthOf, medicalDebtOf, type MedicalBill } from '@/engine/systems/health';
import { earningsOf } from '@/engine/systems/earnings';
import { returnsOf } from '@/engine/systems/taxreturn';
import { overdraftRoom } from '@/engine/systems/lending';
import { entriesBetween } from '@/engine/world/calendar';
import { PLAN_KIND } from '@/engine/world/plans';
import { openDecisions } from '@/engine/world/world';
import { isOpen, nextChapter } from '@/engine/world/tutorial';
import { CHAPTERS } from '@/engine/content/tutorial';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** FIXTURE: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  toasts: [] as string[],
  tabs: {} as Record<string, string>,
  /** While set, every effect a render asks for is kept, to be run as a page's commit runs it. */
  collecting: false,
  effects: [] as (() => unknown)[],
  /** Each kept effect's dependencies, as the render gave them. */
  deps: [] as (readonly unknown[] | undefined)[],
  /**
   * While set, each useCallback and useMemo gives back what it gave the render before, by its order, where its
   * dependencies are the same, as React keeps them across a page's renders (FIXTURE: a server render keeps nothing).
   */
  memo: undefined as undefined | { at: number; kept: { deps: readonly unknown[]; value: unknown }[] },
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    if (h.states.length === 0) return [value, set];
    const v = h.states.shift();
    return [v === h.keep ? value : v, set];
  }) as typeof real.useState;
  const useEffect = ((effect: () => unknown, deps?: readonly unknown[]) => {
    if (h.collecting) { h.effects.push(effect); h.deps.push(deps); }
    return real.useEffect(effect as never, deps);
  }) as typeof real.useEffect;
  const same = (a: readonly unknown[], b: readonly unknown[]) => a.length === b.length && a.every((d, i) => Object.is(d, b[i]));
  const kept = <T,>(deps: readonly unknown[], make: () => T): T => {
    const m = h.memo!;
    const i = m.at;
    m.at += 1;
    const was = m.kept[i];
    if (was && same(was.deps, deps)) return was.value as T;
    const value = make();
    m.kept[i] = { deps, value };
    return value;
  };
  const useCallback = ((fn: unknown, deps: readonly unknown[]) => (h.memo ? kept(deps, () => fn) : real.useCallback(fn as never, deps))) as typeof real.useCallback;
  const useMemo = ((make: () => unknown, deps: readonly unknown[]) => (h.memo ? kept(deps, make) : real.useMemo(make, deps))) as typeof real.useMemo;
  return { ...real, default: { ...real, useState, useEffect, useCallback, useMemo }, useState, useEffect, useCallback, useMemo };
});

/** Every button the screens draw, with its words, whether it's grayed out, and its own onClick. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepButtons = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children), disabled: props.disabled as boolean | undefined, onClick: props.onClick as (() => void) | undefined });
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

// The screens' kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back. Nothing is standing at a stop. The provider itself
// is the original, taken below with `importActual` for the live clock.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { TimeControls } = await import('@/ui/shell/TimeControls');
const { CalendarWorkspace } = await import('@/ui/workspaces/CalendarWorkspace');
const { Home } = await import('@/ui/screens/Home');
const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
const { GuideProvider, GuideButton, GuideStrip } = await import('@/ui/guide/Guide');
const { GameProvider } = await vi.importActual<typeof import('@/app/game-context')>('@/app/game-context');

// ---------------------------------------------------------------------------
// Lives, and the screens over them
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const student = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** An instant of Monday 24 August 2026 in New Haven, on Eastern Daylight Time (UTC−4): worked out here, not by the engine. */
const NH = (hour: number, minute = 0): number => Date.UTC(2026, 7, 24, hour + 4, minute);
/** Noon, or the hour given, of a day on New Haven's clock. */
const on = (year: number, month: number, day: number, hour = 12): number => instantFromZoned({ year, month, day, hour }, NY);

/** TEST SETUP: nothing on the calendar that wants the player, canceled by hand. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
/** TEST SETUP: an account's balance set, against a test equity line. */
function setBalance(sim: Simulation, accountId: string, to: number): void {
  const by = to - sim.universe.accounts[accountId]!.balance;
  if (by !== 0) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}
/** TEST SETUP: every account they could pay from emptied, and the current account overdrawn to its limit. */
function broke(sim: Simulation): void {
  for (const a of Object.values(sim.universe.accounts)) {
    if (a.ownerId !== sim.player.id || a.nominal || a.id === sim.player.primaryAccountId) continue;
    if (a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings' || a.kind === 'cash')) setBalance(sim, a.id, 0);
  }
  const current = sim.universe.accounts[sim.player.primaryAccountId!]!;
  setBalance(sim, current.id, -overdraftRoom(sim, sim.player, current));
}
const lookAfter = (sim: Simulation, action: string) => sim.execute({ kind: 'life.look_after', payload: { action } });
const decide = (sim: Simulation, payload: Record<string, unknown>) => sim.execute({ kind: 'world.take_decision_action', payload });
const dismiss = (sim: Simulation, decisionId: string) => sim.execute({ kind: 'world.dismiss_decision', payload: { decisionId } });
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** The transactions whose memo begins so. */
const memos = (sim: Simulation, start: string) => sim.universe.transactions.filter((t) => t.memo.startsWith(start));
/** What a transaction moved in or out of the player's own accounts, by account, in cents. */
const ownMoves = (sim: Simulation, t: { postings: { accountId: string; amount: number }[] }) =>
  t.postings.filter((p) => { const a = sim.universe.accounts[p.accountId]; return a !== undefined && a.ownerId === sim.player.id && !a.nominal; }).map((p) => ({ accountId: p.accountId, amount: p.amount }));

/** What the player reads: the markup with every title attribute taken out, then every tag. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/&#x27;/g, '\'').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** A screen as the player has it, with its components' open states given (FIXTURE) in render order. */
function drawn(sim: Simulation, screen: FunctionComponent, states: unknown[] = [], tabs: Record<string, string> = {}) {
  h.sim = sim;
  h.buttons = [];
  h.toasts = [];
  h.tabs = tabs;
  h.states = [...states];
  const html = renderToStaticMarkup(createElement(screen));
  expect(h.states, 'every state given was taken').toHaveLength(0);
  const buttons = [...h.buttons];
  const press = (words: string) => {
    const b = buttons.find((x) => x.text === words);
    expect(b, `a button reading “${words}”`).toBeDefined();
    h.toasts = [];
    b!.onClick!();
    return [...h.toasts];
  };
  return { html, text: onScreen(html), buttons, press, has: (words: string) => buttons.some((x) => x.text === words) };
}
/** A table row's words, found by words in it. */
const rowOf = (html: string, words: string): string => {
  const row = [...html.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((m) => onScreen(m[0])).find((r) => r.includes(words));
  expect(row, `a row with “${words}”`).toBeDefined();
  return row!;
};

// ---------------------------------------------------------------------------

describe('calendar.cancel', () => {
  /** A Call at 7:40 AM, half an hour long, made through the Calendar's command, with hygiene at 30 (TEST SETUP). */
  function withCall(seed: string): { sim: Simulation; id: string } {
    const sim = student(seed);
    expect(sim.now).toBe(NH(7, 30));
    clearCalendar(sim); // TEST SETUP
    sim.player.wellbeing.hygiene = 30; // TEST SETUP
    const made = sim.must<{ ok: boolean; id: string }>({ kind: 'calendar.schedule', payload: { title: 'Call', at: NH(7, 40), durationMinutes: 30 } });
    expect(made.ok).toBe(true);
    expect(sim.timeline.get(made.id)!.kind).toBe(PLAN_KIND);
    return { sim, id: made.id };
  }
  /** The Calendar with the entry opened (FIXTURE: the screen's third state, as pressing it in Next Thirty Days sets it). */
  const opened = (sim: Simulation, id: string) => {
    const entry = entriesBetween(sim, sim.now, sim.now + 30 * MS_DAY).find((e) => e.id === id)!;
    expect(entry, id).toBeDefined();
    return drawn(sim, CalendarWorkspace, [h.keep, null, entry, null, h.keep]);
  };
  const NEXT_30 = 'Call August 24, 2026 · 7:40 AM';

  it('PLAYER JOURNEY: a Call at 7:40 refuses a shower at 7:30 in its words; Call It Off on the Calendar takes it off the month, and the shower is taken', () => {
    const { sim, id } = withCall('g02-cancel');
    const refused = lookAfter(sim, 'wash');
    expect(refused.ok).toBe(false);
    expect(refused.error).toBe('Call is at 7:40 AM, and there isn’t time.');
    expect(sim.now).toBe(NH(7, 30));
    expect(sim.player.wellbeing.hygiene).toBe(30);

    const screen = opened(sim, id);
    expect(screen.text).toContain(NEXT_30);
    expect(screen.text).toContain('You need to be there. The clock stops when it comes round, so you can go. You put it there, so you can take it off again.');
    expect(screen.has('Leave It')).toBe(true);
    screen.press('Call It Off');

    const plan = sim.timeline.get(id)!;
    expect(plan.status).toBe('cancelled');
    expect(plan.resolvedAt).toBe(NH(7, 30));
    // Off the Next Thirty Days, which reads what still stands.
    expect(drawn(sim, CalendarWorkspace, [h.keep, null, null, null]).text).not.toContain(NEXT_30);
    // Called off, it clashes with nothing: the shower's twenty minutes, hygiene to a hundred.
    expect(lookAfter(sim, 'wash').ok).toBe(true);
    expect(sim.now).toBe(NH(7, 50));
    expect(sim.player.wellbeing.hygiene).toBe(100);
  });

  it('called off, the clock runs past 7:40 without stopping, across a reload; a twin that kept it stops there', () => {
    const { sim, id } = withCall('g02-cancel-clock');
    const kept = withCall('g02-cancel-clock');
    expect(sim.must<{ ok: boolean }>({ kind: 'calendar.cancel', payload: { entryId: id } }).ok).toBe(true);
    const again = reload(sim);
    expect(again.timeline.get(id)!.status).toBe('cancelled');
    const ran = again.advanceTo(NH(8), { stopOnPlayerRequired: true });
    expect(ran.interruptedBy).toBeUndefined();
    expect(again.now).toBe(NH(8));
    expect(again.timeline.get(id)!.status).toBe('cancelled');
    // Change the input: kept, the same clock stops at it.
    const stopped = kept.sim.advanceTo(NH(8), { stopOnPlayerRequired: true });
    expect(stopped.interruptedBy?.id).toBe(kept.id);
    expect(kept.sim.now).toBe(NH(7, 40));
  });

  it('refuses a second call-off, an unknown id, the world’s own item and a plan begun, each in its words, and offers the world’s item no Call It Off', () => {
    const sim = student('g02-cancel-refused');
    const registration = sim.timeline.pending().find((i) => i.requiresPlayer && i.label === 'Registration And Your Account')!;
    expect(registration).toBeDefined();
    const cancel = (entryId: string) => sim.must<{ ok: boolean; error?: string }>({ kind: 'calendar.cancel', payload: { entryId } });
    const { id } = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Call', at: NH(8), durationMinutes: 30 } });
    expect(cancel(id).ok).toBe(true);
    expect(cancel(id)).toEqual({ ok: false, error: 'That’s already over: it was kept, missed or called off.' });
    expect(sim.timeline.get(id)!.resolvedAt).toBe(NH(7, 30));
    expect(cancel('nothing-here')).toEqual({ ok: false, error: 'That isn’t on your calendar.' });
    expect(cancel(registration.id)).toEqual({ ok: false, error: 'Only a plan you made yourself can be called off here.' });
    expect(registration.status).toBe('pending');
    const world = opened(sim, registration.id);
    expect(world.has('Call It Off')).toBe(false);
    expect(world.text).not.toContain('You put it there, so you can take it off again.');
    // Begun: the clock stopped at it, standing in it.
    const { id: begun } = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Coffee', at: NH(9), durationMinutes: 30 } });
    expect(sim.advanceTo(NH(9, 30), { stopOnPlayerRequired: true }).interruptedBy?.id).toBe(begun);
    expect(cancel(begun)).toEqual({ ok: false, error: 'It’s already started, so it can’t be called off now.' });
    expect(sim.timeline.get(begun)!.status).toBe('pending');
  });
});

// ---------------------------------------------------------------------------

/**
 * The student's first February, born in London and at Yale on an F-1 visa: tax season opened at nine on the 1st, and
 * the clock at noon. A nonresident files Form 1040-NR with Form 8843 every year, so hers is always raised. The same
 * life born in New York was raised a return too until later on 2026-10-13, at $0 on $1,670.59 of work-study and
 * interest; the filing threshold left it none from then (`registerTaxReturn`), so the question is played here.
 */
function taxSeason(seed: string): { sim: Simulation; decisionId: string } {
  const sim = student(seed, { homeRegionId: 'uk-eng-london' });
  sim.advanceTo(on(2027, 2, 1));
  const question = openDecisions(sim).find((d) => d.title === 'Your 2026 Tax Return')!;
  expect(question).toBeDefined();
  expect(question.actions).toEqual([{ label: 'File It', commandKind: 'tax.file', payload: { year: 2026 } }]);
  expect(question.dueAt).toBe(on(2027, 4, 15, 23) + 59 * MS_MINUTE);
  const r = returnsOf(sim.player)['2026']!;
  expect(r.filedAt).toBeUndefined();
  expect(r.figures.form).toBe('1040-NR');
  // A nonresident takes no standard deduction: all of it is taxed in the first bracket, at 10%, to $11,925 in 2025
  // and higher in 2026 (IRS Rev. Proc. 2024-40, 2025-32). Nothing was withheld from her pay.
  expect(r.figures.income).toBeGreaterThan(0);
  expect(r.figures.income).toBeLessThan(11_925_00);
  expect(r.figures.balance).toBe(Math.round(r.figures.income * 0.1));
  return { sim, decisionId: question.id };
}
/** The payments of the 2026 federal tax, as `tax.file` makes one when the return is filed, by what they took. */
const taxPaid = (sim: Simulation) => memos(sim, 'Federal income tax, 2026').map((t) => ownMoves(sim, t));

describe('world.dismiss_decision', () => {
  it('PLAYER JOURNEY: Dismiss on Home’s card takes the return’s question off; refused again and for no id; across a reload File It is refused; the return still comes due', () => {
    const { sim, decisionId } = taxSeason('g02-dismiss');
    const home = drawn(sim, Home);
    expect(home.text).toContain('Your 2026 Tax Return');
    expect(home.has('File It')).toBe(true);
    home.press('Dismiss');
    const decision = sim.universe.decisions[decisionId]!;
    expect(decision.dismissedAt).toBe(on(2027, 2, 1));
    const after = drawn(sim, Home);
    expect(after.text).not.toContain('Your 2026 Tax Return');
    expect(after.has('File It')).toBe(false);
    expect(openDecisions(sim)).toEqual([]);

    // Once: the day it's kept from doesn't move.
    sim.advanceTo(sim.now + 60 * MS_MINUTE);
    expect(dismiss(sim, decisionId).error).toBe('You’ve already dismissed that question.');
    expect(decision.dismissedAt).toBe(on(2027, 2, 1));
    expect(dismiss(sim, 'decision_none').error).toBe('That question isn’t in What Needs You any more.');

    // Across a reload, its button is refused and nothing is filed.
    const again = reload(sim);
    const pressed = decide(again, { decisionId, actionIndex: 0 });
    expect(pressed.ok).toBe(false);
    expect(pressed.error).toBe('You dismissed that question, so it can’t be answered from What Needs You.');
    expect(returnsOf(again.player)['2026']!.filedAt).toBeUndefined();
    expect(taxPaid(again)).toEqual([]);
    // Dismissed isn't filed: the return comes due on its day unfiled, says so, and the IRS is set to file it for her.
    again.advanceTo(on(2027, 4, 16));
    expect(titled(again, 'Your 2026 Return Is Late')).toHaveLength(1);
    expect(again.timeline.pending().filter((i) => i.label === 'The IRS On Your 2026 Return')).toHaveLength(1);
    // Kept 180 days from the dismissal, its date past, and forgotten at the next world tick after.
    again.advanceTo(on(2027, 2, 1) + 179 * MS_DAY);
    expect(again.universe.decisions[decisionId]).toBeDefined();
    again.advanceTo(on(2027, 2, 1) + 183 * MS_DAY);
    expect(again.universe.decisions[decisionId]).toBeUndefined();
  });

  // Until 2026-10-14 this kept a dismissed row about a date not yet come until the date had passed, and forgot an undated
  // one 180 days on, both on rows raised by hand: no raiser dates a row more than 180 days ahead or leaves one undated,
  // and the owner had both rules go that day. A row dismissed is forgotten 180 days on, whatever its date.
  it('forgets a dismissed row 180 days on, its date ahead or not', () => {
    const sim = student('g02-dismiss-prune');
    const start = sim.now;
    // TEST SETUP: the raiser's call, as a system raises a row, dated past the 180 days no raiser reaches.
    sim.requireDecision({ urgency: 50, category: 'test', title: 'Dated', detail: 'A row raised by the test.', dueAt: start + 200 * MS_DAY, refType: 'test', refId: 'dated' });
    const dated = Object.values(sim.universe.decisions).find((d) => d.title === 'Dated')!.id;
    expect(dismiss(sim, dated).ok).toBe(true);
    sim.advanceTo(start + 179 * MS_DAY);
    expect(sim.universe.decisions[dated]).toBeDefined();
    sim.advanceTo(start + 185 * MS_DAY);
    expect(sim.universe.decisions[dated]).toBeUndefined();
  });

  it('is read by no raiser: the same row raised again after a dismissal is a fresh one, open on Home, and the dismissed one is kept as it was', () => {
    const sim = student('g02-dismiss-raise');
    const spec = { urgency: 60, category: 'test', title: 'Asked Again', detail: 'A row raised by the test.', dueAt: sim.now + 30 * MS_DAY, refType: 'test', refId: 'again' };
    sim.requireDecision(spec); // TEST SETUP: the raiser
    const first = openDecisions(sim)[0]!;
    expect(dismiss(sim, first.id).ok).toBe(true);
    sim.requireDecision(spec); // TEST SETUP: the raiser, asking again
    const open = openDecisions(sim);
    expect(open).toHaveLength(1);
    expect(open[0]!.id).not.toBe(first.id);
    expect(sim.universe.decisions[first.id]!.dismissedAt).toBe(NH(7, 30));
    expect(drawn(sim, Home).text).toContain('Asked Again');
  });
});

// ---------------------------------------------------------------------------

describe('world.take_decision_action', () => {
  it('PLAYER JOURNEY: File It on Home’s card files the 2026 return and closes the row; pressed again, refused with nothing filed twice, across a reload; no late notice in April; forgotten 180 days on', () => {
    const { sim, decisionId } = taxSeason('g02-take');
    const filedOn = on(2027, 2, 1);
    const owed = returnsOf(sim.player)['2026']!.figures.balance;
    drawn(sim, Home).press('File It');
    const decision = sim.universe.decisions[decisionId]!;
    expect(returnsOf(sim.player)['2026']!.filedAt).toBe(filedOn);
    expect(decision.resolvedAt).toBe(filedOn);
    // Filed, the tax it owes is paid from her account with it.
    const paid = [[{ accountId: sim.player.primaryAccountId!, amount: -owed }]];
    expect(taxPaid(sim)).toEqual(paid);
    expect(drawn(sim, Home).has('File It')).toBe(false);
    expect(openDecisions(sim)).toEqual([]);

    // An hour on, so a second filing would show in `filedAt`.
    sim.advanceTo(sim.now + 60 * MS_MINUTE);
    const twice = decide(sim, { decisionId, actionIndex: 0 });
    expect(twice.ok).toBe(false);
    expect(twice.error).toBe('That question is already settled: it was answered, or its date passed.');
    expect(returnsOf(sim.player)['2026']!.filedAt).toBe(filedOn);
    expect(decision.resolvedAt).toBe(filedOn);
    expect(taxPaid(sim)).toEqual(paid);

    const again = reload(sim);
    expect(decide(again, { decisionId, actionIndex: 0 }).error).toBe('That question is already settled: it was answered, or its date passed.');
    expect(returnsOf(again.player)['2026']!.filedAt).toBe(filedOn);
    // Filed, the due date passes quietly, and the tax was paid once.
    again.advanceTo(on(2027, 4, 16));
    expect(titled(again, 'Your 2026 Return Is Late')).toEqual([]);
    expect(again.timeline.pending().filter((i) => i.label === 'The IRS On Your 2026 Return')).toEqual([]);
    expect(taxPaid(again)).toEqual(paid);
    again.advanceTo(filedOn + 179 * MS_DAY);
    expect(again.universe.decisions[decisionId]).toBeDefined();
    again.advanceTo(filedOn + 183 * MS_DAY);
    expect(again.universe.decisions[decisionId]).toBeUndefined();
  });

  it('closes a row whose command doesn’t close it itself, and forgets it 180 days on; an unknown id and an index with no action are refused, the row left open', () => {
    const sim = student('g02-take-own');
    clearCalendar(sim); // TEST SETUP
    const { id: plan } = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Coffee', at: NH(9), durationMinutes: 30 } });
    // TEST SETUP: the raiser's call, a row whose button calls the plan off.
    sim.requireDecision({ urgency: 50, category: 'test', title: 'Coffee At Nine', detail: 'A row raised by the test.', dueAt: NH(9), refType: 'test', refId: plan, actions: [{ label: 'Call It Off', commandKind: 'calendar.cancel', payload: { entryId: plan } }] });
    const row = openDecisions(sim)[0]!;

    expect(decide(sim, { decisionId: 'decision_none', actionIndex: 0 }).error).toBe('That question isn’t in What Needs You any more.');
    const none = decide(sim, { decisionId: row.id, actionIndex: 9 });
    expect(none.ok).toBe(false);
    expect(none.error).toBe('That isn’t one of this question’s answers.');
    expect(row.resolvedAt).toBeUndefined();
    expect(sim.timeline.get(plan)!.status).toBe('pending');

    const home = drawn(sim, Home);
    expect(home.text).toContain('Coffee At Nine');
    home.press('Call It Off');
    expect(sim.timeline.get(plan)!.status).toBe('cancelled');
    expect(row.resolvedAt).toBe(NH(7, 30));
    expect(openDecisions(sim)).toEqual([]);
    expect(decide(sim, { decisionId: row.id, actionIndex: 0 }).error).toBe('That question is already settled: it was answered, or its date passed.');

    const again = reload(sim);
    again.advanceTo(NH(7, 30) + 179 * MS_DAY);
    expect(again.universe.decisions[row.id]).toBeDefined();
    again.advanceTo(NH(7, 30) + 183 * MS_DAY);
    expect(again.universe.decisions[row.id]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------

describe('world.set_preferences', () => {
  it('refuses a key that isn’t a preference in its words, alone or beside the speed, and keeps nothing of it', () => {
    const sim = student('g02-prefs');
    expect(sim.universe.preferences).toEqual({ timeSpeed: 'live' });
    const theme = sim.execute({ kind: 'world.set_preferences', payload: { theme: 'dark' } });
    expect(theme.ok).toBe(false);
    expect(theme.error).toBe('That isn’t a setting the game has.');
    const both = sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused', theme: 'dark' } });
    expect(both.error).toBe('That isn’t a setting the game has.');
    expect(sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'fast' } }).error).toBe('The clock can only be set to Play or Pause.');
    expect(sim.universe.preferences).toEqual({ timeSpeed: 'live' });
    expect(reload(sim).universe.preferences).toEqual({ timeSpeed: 'live' });
  });

  describe('the page’s live clock', () => {
    const page = globalThis as Record<string, unknown>;
    const kept = { window: page.window, document: page.document };
    afterEach(() => {
      vi.useRealTimers();
      for (const key of ['window', 'document'] as const) {
        if (kept[key] === undefined) delete page[key]; else page[key] = kept[key];
      }
    });

    /**
     * The real provider over a save, mounted as a page mounts it: rendered, then its effects run (FIXTURE: React's
     * commit, and the page's window, which a node test has none of). Returns the unmount.
     */
    function mount(sim: Simulation): () => void {
      h.effects = [];
      h.collecting = true;
      try {
        renderToStaticMarkup(createElement(GameProvider, { sim, adapter: { save: async () => undefined } as never, onExit: () => undefined, children: null }));
      } finally {
        h.collecting = false;
      }
      expect(h.effects.length).toBeGreaterThan(0);
      const cleanups = h.effects.map((run) => run()).filter((c): c is () => void => typeof c === 'function');
      return () => { for (const c of cleanups) c(); };
    }

    /**
     * The same provider as a page holds it after that: rendered again, as React renders it after a change, and each
     * effect whose dependencies changed let go and run again, the rest left running (FIXTURE: React's commit, as above).
     * Until 2026-10-13 Pause was followed by an unmount and a mount, which runs every effect again whatever its
     * dependencies, so the tick's dependency on the speed, which is what stops a running page, wasn't what was tested
     * (found by that day's check).
     */
    function held(sim: Simulation): { rerender: () => void; unmount: () => void } {
      // The page's own props, the same object each render, and its callbacks and memos kept across them, so an effect
      // runs again only where a dependency really changed (until a check of 2026-10-13 each render made them anew, and
      // every effect ran again as on a mount).
      const props = { sim, adapter: { save: async () => undefined } as never, onExit: () => undefined, children: null };
      const memo = { at: 0, kept: [] as { deps: readonly unknown[]; value: unknown }[] };
      const collect = () => {
        h.effects = [];
        h.deps = [];
        h.collecting = true;
        memo.at = 0;
        h.memo = memo;
        try {
          renderToStaticMarkup(createElement(GameProvider, props));
        } finally {
          h.collecting = false;
          h.memo = undefined;
        }
        return { effects: [...h.effects], deps: [...h.deps] };
      };
      let last = collect();
      expect(last.effects.length).toBeGreaterThan(0);
      const cleanups = last.effects.map((run) => run());
      return {
        rerender: () => {
          const next = collect();
          expect(next.effects).toHaveLength(last.effects.length);
          next.effects.forEach((run, i) => {
            const was = last.deps[i];
            const now = next.deps[i];
            const changed = !was || !now || was.length !== now.length || now.some((d, j) => !Object.is(d, was[j]));
            if (!changed) return;
            const c = cleanups[i];
            if (typeof c === 'function') c();
            cleanups[i] = run();
          });
          last = next;
        },
        unmount: () => { for (const c of cleanups) if (typeof c === 'function') c(); },
      };
    }

    it('PLAYER JOURNEY: Pause on the top bar stops it, five seconds and nothing moves; Play runs it a second a second; a paused save opens paused', () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
      const listens = { addEventListener: () => undefined, removeEventListener: () => undefined };
      Object.assign(globalThis, {
        window: {
          ...listens,
          setInterval: (f: () => void, ms: number) => setInterval(f, ms),
          clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
          setTimeout: (f: () => void, ms: number) => setTimeout(f, ms),
          location: { hash: '' },
          history: { replaceState: () => undefined, pushState: () => undefined, back: () => undefined },
        },
        document: { ...listens, visibilityState: 'visible', activeElement: null },
      });
      const sim = student('g02-clock');
      const start = sim.now;

      // Live, as a new life opens: the bar offers Pause, and the clock moves a second a second.
      const running = held(sim);
      vi.advanceTimersByTime(5_000);
      expect(sim.now).toBe(start + 5_000);
      const live = drawn(sim, TimeControls);
      expect(live.has('Play')).toBe(false);
      live.press('Pause');
      expect(sim.universe.preferences.timeSpeed).toBe('paused');

      // The running page rendered again with the new speed, not mounted again: its tick, whose speed changed, is let go.
      running.rerender();
      vi.advanceTimersByTime(5_000);
      expect(sim.now).toBe(start + 5_000);
      running.unmount();

      // Paused, saved and opened again: still paused, and the clock where it was.
      const again = reload(sim);
      expect(again.universe.preferences.timeSpeed).toBe('paused');
      const opened = mount(again);
      vi.advanceTimersByTime(5_000);
      expect(again.now).toBe(start + 5_000);
      opened();

      // Play on a paused page, rendered again, not mounted again: the tick starts, a second a second.
      const stopped = held(sim);
      vi.advanceTimersByTime(5_000);
      expect(sim.now).toBe(start + 5_000);
      const paused = drawn(sim, TimeControls);
      expect(paused.has('Pause')).toBe(false);
      paused.press('Play');
      expect(sim.universe.preferences.timeSpeed).toBe('live');
      stopped.rerender();
      vi.advanceTimersByTime(5_000);
      expect(sim.now).toBe(start + 10_000);
      stopped.unmount();
    });
  });
});

// ---------------------------------------------------------------------------

describe('tutorial.read', () => {
  /** The guide open at the next chapter (FIXTURE: the provider's state, empty for the next), its button pressed. */
  function readNext(sim: Simulation): string {
    const next = nextChapter(sim)!;
    const guide = drawn(sim, () => createElement(GuideProvider, { children: null }), ['', h.keep, h.keep, h.keep]);
    expect(guide.text).toContain(next.title);
    guide.press('I’ve Read It');
    return next.id;
  }
  /** A guided life with every chapter read, each through the guide's own I’ve Read It. */
  function readThrough(seed: string): Simulation {
    const sim = student(seed, { tutorial: true });
    expect(sim.universe.tutorial).toEqual({ read: [] });
    const read = CHAPTERS.map(() => readNext(sim));
    expect(read).toEqual(CHAPTERS.map((c) => c.id));
    expect(sim.universe.tutorial).toEqual({ read: CHAPTERS.map((c) => c.id), finished: true });
    return sim;
  }
  const [bank, life] = CHAPTERS.slice(-2);
  const alerts = (sim: Simulation) => sim.execute<{ alerts: { lowBalance?: number } }>({ kind: 'bank.set_alerts', payload: { lowBalance: 100_00 } });

  it('refuses an unknown chapter “There’s no such chapter.” and a life with no guide in its words, reading nothing', () => {
    const guided = student('g02-guide-refused', { tutorial: true });
    expect(guided.execute({ kind: 'tutorial.read', payload: { chapterId: 'nope' } }).error).toBe('There’s no such chapter.');
    expect(guided.universe.tutorial).toEqual({ read: [] });
    const open = student('g02-guide-none');
    expect(open.execute({ kind: 'tutorial.read', payload: { chapterId: CHAPTERS[0]!.id } }).error).toBe('This life was begun without the guide, so everything is already open.');
    expect(open.universe.tutorial).toBeUndefined();
  });

  it('PLAYER JOURNEY: read to its end, a guide missing chapters, as ones added later would be, stays open: their commands run, and no strip asks for them', () => {
    const sim = readThrough('g02-guide-finished');
    expect(bank!.title).toBe('Your Bank');
    expect(bank!.opens).toContain('bank.set_alerts');
    // TEST SETUP: the last two chapters taken off the read list, as a save read through before they were added has it.
    sim.universe.tutorial!.read = sim.universe.tutorial!.read.filter((id) => id !== bank!.id && id !== life!.id);
    expect(isOpen(sim, life!.opens[0]!)).toBe(true);
    expect(isOpen(sim, 'bank.set_alerts')).toBe(true);
    expect(nextChapter(sim)).toBeUndefined();
    expect(sim.guardedBecause({ kind: 'bank.set_alerts', payload: { lowBalance: 100_00 } })).toBeUndefined();
    const set = alerts(sim);
    expect(set.ok, set.error).toBe(true);
    expect(set.value!.alerts.lowBalance).toBe(100_00);
    expect(drawn(sim, GuideStrip).html).toBe('');
    // And across a reload.
    const again = reload(sim);
    expect(again.guardedBecause({ kind: 'bank.set_alerts', payload: {} })).toBeUndefined();
    // Change the input: not finished, the same save is held to the chapter.
    delete again.universe.tutorial!.finished; // TEST SETUP
    expect(alerts(again).error).toBe('Read “Your Bank” in the guide first. Press Guide, at the top of the screen, to read it.');
    expect(drawn(again, GuideStrip).text).toContain('Your Bank');
  });

  it('the top bar’s Guide button counts no chapters left on a finished guide, which takes none of them', () => {
    const sim = readThrough('g02-guide-button');
    expect(drawn(sim, GuideButton).text).toBe('Guide');
    // TEST SETUP: two chapters added after it was read through, as above.
    sim.universe.tutorial!.read = sim.universe.tutorial!.read.filter((id) => id !== bank!.id && id !== life!.id);
    // The guide opened at the one it counted until 2026-10-13: it offers no I’ve Read It, so nothing could have brought
    // that count down.
    const atBank = drawn(sim, () => createElement(GuideProvider, { children: null }), [bank!.id, h.keep, h.keep, h.keep]);
    expect(atBank.text).toContain('Your Bank');
    expect(atBank.has('I’ve Read It')).toBe(false);
    expect(drawn(sim, GuideButton).text).toBe('Guide');
  });

  // From 2026-10-13, as the Guide button was that day: until then the guide’s own list called such a chapter Later,
  // over What Reading It Opens, and the help’s contents counted it unread (“15 of 17 read: each opens a part of the
  // game.”), though on a finished guide it opens nothing and can’t be marked read (found by the guide audit of that
  // day). Each check failed when written.
  it('on a finished guide missing chapters, the guide’s list calls them Open, over what they cover, and the help’s contents counts none unread', async () => {
    const { HelpProvider } = await import('@/ui/guide/Help');
    const page = globalThis as Record<string, unknown>;
    const had = page.window;
    // FIXTURE: the page’s address, which the help reads for an entry to open; this one names none.
    page.window = { location: { hash: '#/home' } };
    try {
      const sim = readThrough('g02-guide-list');
      // TEST SETUP: two chapters added after it was read through, as above.
      sim.universe.tutorial!.read = sim.universe.tutorial!.read.filter((id) => id !== bank!.id && id !== life!.id);
      const guide = () => drawn(sim, () => createElement(GuideProvider, { children: null }), [bank!.id, h.keep, h.keep, h.keep]);
      // FIXTURE: the help open at its contents.
      const contents = () => drawn(sim, () => createElement(HelpProvider, { children: null }), [[{ kind: 'contents' }], h.keep, h.keep]);
      const atBank = guide();
      expect(atBank.html).toContain('aria-label="16. Your Bank, Open"');
      expect(atBank.html).toContain('aria-label="17. A Whole Life, Open"');
      expect(atBank.html).not.toMatch(/, Later"/);
      expect(atBank.text).toContain('What It Covers, Already Open');
      expect(atBank.text).not.toContain('What Reading It Opens');
      expect(contents().text).toContain('The Guide. Everything is open on this life. The chapters are there to read in any order.');
      // Change the input: not finished, the same save is a guide with two chapters to go, the next of them Your Bank.
      delete sim.universe.tutorial!.finished; // TEST SETUP
      const going = guide();
      expect(going.html).toContain('aria-label="16. Your Bank, Next"');
      expect(going.html).toContain('aria-label="17. A Whole Life, Later"');
      expect(going.text).toContain('What Reading It Opens');
      expect(going.has('I’ve Read It')).toBe(true);
      expect(contents().text).toContain('The Guide. You’ve read 15 of its 17 chapters. Each one you read opens a part of the game.');
    } finally {
      if (had === undefined) delete page.window; else page.window = had;
    }
  });

  it('marks a guide read to its end before 2026-10-12 finished on opening, and leaves one a chapter short as it was', () => {
    const sim = readThrough('g02-guide-migrate');
    // TEST SETUP: the save as written before `finished` was kept.
    const old = JSON.parse(serialise(sim.universe)) as { tutorial: { read: string[]; finished?: boolean } };
    delete old.tutorial.finished;
    const opened = loadSave(deserialise(JSON.stringify(old)) as never);
    expect(opened.universe.tutorial!.finished).toBe(true);
    // Finished on opening, a chapter added later doesn't shut it.
    opened.universe.tutorial!.read = opened.universe.tutorial!.read.filter((id) => id !== bank!.id && id !== life!.id); // TEST SETUP
    expect(alerts(opened).ok).toBe(true);
    // A chapter short, it isn't read to its end, and opening doesn't say it is.
    const short = { ...old, tutorial: { read: old.tutorial.read.filter((id) => id !== life!.id) } };
    const notYet = loadSave(deserialise(JSON.stringify(short)) as never);
    expect(notYet.universe.tutorial!.finished).toBeUndefined();
    expect(nextChapter(notYet)?.id).toBe(life!.id);
    expect(isOpen(notYet, life!.opens[0]!)).toBe(false);
  });
});

// ---------------------------------------------------------------------------

const HEALTH = { 'tab:/workspace/papers': 'health' };

/**
 * The student, withdrawn on 8 September and enrolled in a marketplace plan in October's open enrollment, seen for a
 * checkup on 2 November: the one way a New Haven student's claim is denied, since only a marketplace claim is. TEST
 * SETUP: September's earnings of $5,000 (a year's $60,000, near four times the poverty line), so the plan is the
 * marketplace's and not HUSKY D or Covered Connecticut; and the checkup billed through `careFor`. Each seed was chosen
 * for its outcome, which each test asserts outright. Open enrollment, not September: measured on 2026-10-13, the day of
 * the withdrawal `health.enroll` refused "Outside open enrollment, 23 October to 15 January, and not within 60 days of
 * losing cover.", since a withdrawal canceling Yale Health sets no `lostAt`; that's `health.enroll`'s row, not these.
 */
function deniedClaim(seed: string): { sim: Simulation; bill: MedicalBill } {
  const sim = student(seed);
  sim.advanceTo(on(2026, 9, 8));
  expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
  sim.advanceTo(on(2026, 10, 23));
  earningsOf(sim.player).months['2026-09'] = 5_000_00; // TEST SETUP
  expect(sim.must<{ kind: string; from: number }>({ kind: 'health.enroll', payload: {} })).toEqual({ kind: 'marketplace', from: on(2026, 11, 1, 0) });
  sim.advanceTo(on(2026, 11, 2));
  expect(coverOn(sim.player, sim.now)).toBe('marketplace');
  const bill = careFor(sim, sim.player, { care: 'visit', what: 'A checkup' }, sim.now)!; // TEST SETUP
  expect(bill.denied).toBeDefined();
  expect(bill.dueAt).toBe(on(2026, 12, 2));
  expect(titled(sim, 'A Claim Denied')).toHaveLength(1);
  return { sim, bill };
}
const billOf = (sim: Simulation, id: string) => healthOf(sim.player).bills.find((b) => b.id === id)!;
/** The Papers bills table's row for a bill. */
const paperRow = (sim: Simulation, bill: MedicalBill) => rowOf(drawn(sim, PapersWorkspace, [], HEALTH).html, titleCaseLabel(bill.what));
/** What paying the bill took from the player's own accounts, read off its 'Medical bill' posting. */
function paidFor(sim: Simulation, bill: MedicalBill): { accountId: string; amount: number } {
  const t = memos(sim, `Medical bill: ${bill.what}`);
  expect(t).toHaveLength(1);
  const moves = ownMoves(sim, t[0]!);
  expect(moves).toHaveLength(1);
  return { accountId: moves[0]!.accountId, amount: -moves[0]!.amount };
}

describe('health.appeal', () => {
  it('PLAYER JOURNEY: Appeal It on Papers; refused a second time; overturned 60 days on, what was paid over the plan’s share comes back once, across a reload', () => {
    const { sim, bill } = deniedClaim('g02-claim-1');
    const full = bill.amount;
    const share = bill.denied!.share;
    expect(full).toBeGreaterThan(share);
    const papers = drawn(sim, PapersWorkspace, [], HEALTH);
    expect(rowOf(papers.html, titleCaseLabel(bill.what))).toContain('Appeal It');
    expect(papers.press('Appeal It')).toEqual(['Appealed: decided in 60 days.']);
    expect(bill.denied!.appealedAt).toBe(on(2026, 11, 2));
    expect(paperRow(sim, bill)).toContain('Appealed');

    const twice = sim.execute({ kind: 'health.appeal', payload: { billId: bill.id } });
    expect(twice.ok).toBe(false);
    expect(twice.error).toBe('It’s been appealed.');
    expect(bill.denied!.appealedAt).toBe(on(2026, 11, 2));
    expect(sim.timeline.pending().filter((i) => i.kind === 'health.appeal_decided').map((i) => i.at)).toEqual([on(2026, 11, 2) + 60 * MS_DAY]);

    // Across a reload: paid in full when due, then decided.
    const again = reload(sim);
    again.advanceTo(on(2026, 12, 2) + MS_MINUTE);
    const mine = billOf(again, bill.id);
    expect(mine.paid).toBe(true);
    const paid = paidFor(again, mine);
    expect(paid.amount).toBe(full);
    again.advanceTo(on(2026, 11, 2) + 60 * MS_DAY + MS_MINUTE);
    expect(mine.denied!.outcome).toBe('overturned');
    expect(mine.amount).toBe(share);
    const won = memos(again, 'Appeal won');
    expect(won.map((t) => ownMoves(again, t))).toEqual([[{ accountId: paid.accountId, amount: paid.amount - share }]]);
    expect(titled(again, 'Appeal Won')).toHaveLength(1);
    expect(paperRow(again, mine)).toContain('Denial Overturned');
    expect(paperRow(again, mine)).toContain('$45.00');
    // Once: a month on, and opened again, no second refund.
    const later = reload(again);
    later.advanceTo(later.now + 30 * MS_DAY);
    expect(memos(later, 'Appeal won')).toHaveLength(1);
  });

  it('upheld, leaves the bill at the full price it was paid at, and the bank as the bill left it', () => {
    const { sim, bill } = deniedClaim('g02-claim-36');
    const full = bill.amount;
    sim.must({ kind: 'health.appeal', payload: { billId: bill.id } });
    sim.advanceTo(on(2026, 11, 2) + 60 * MS_DAY + MS_MINUTE);
    expect(bill.denied!.outcome).toBe('upheld');
    expect(bill.amount).toBe(full);
    expect(bill.paid).toBe(true);
    expect(paidFor(sim, bill).amount).toBe(full);
    expect(memos(sim, 'Appeal won')).toEqual([]);
    // The clinic named as it is written (from 2026-10-13: until then all of it was made small).
    expect(titled(sim, 'Appeal Lost').map((n) => n.body)).toEqual(['The plan kept its denial for a checkup, Fair Haven Community Health Care, so the full bill stands.']);
    expect(bill.what).toBe('A checkup, Fair Haven Community Health Care');
    expect(paperRow(sim, bill)).toContain('Denial Upheld');
  });

  it('overturned after going to debt, the debt comes down to the plan’s share exactly, and nothing goes to the bank', () => {
    const { sim, bill } = deniedClaim('g02-claim-1');
    const full = bill.amount;
    const share = bill.denied!.share;
    sim.must({ kind: 'health.appeal', payload: { billId: bill.id } });
    sim.advanceTo(on(2026, 12, 2) - 60 * MS_MINUTE);
    broke(sim); // TEST SETUP
    sim.advanceTo(on(2026, 12, 2) + MS_MINUTE);
    expect(bill.inDebt).toBe(true);
    const debt = medicalDebtOf(sim, sim.player)!;
    const owed = -debt.balance;
    expect(owed).toBe(full);
    setBalance(sim, sim.player.primaryAccountId!, 5_000_00); // TEST SETUP: money back, to live on
    sim.advanceTo(on(2026, 11, 2) + 60 * MS_DAY + MS_MINUTE);
    expect(bill.denied!.outcome).toBe('overturned');
    // What went to debt over the share comes off what was owed, to the cent, and the share is what's left.
    expect(debt.balance).toBe(-(owed - (full - share)));
    expect(debt.balance).toBe(-share);
    expect(memos(sim, 'Appeal won').map((t) => ownMoves(sim, t))).toEqual([[{ accountId: debt.id, amount: full - share }]]);
    expect(paperRow(sim, bill)).toContain('Denial Overturned');
  });

  it('overturned after a debt was paid down past the share, what was paid over the share comes back, and the bill is settled', () => {
    const { sim, bill } = deniedClaim('g02-claim-1');
    const full = bill.amount;
    const share = bill.denied!.share;
    sim.must({ kind: 'health.appeal', payload: { billId: bill.id } });
    sim.advanceTo(on(2026, 12, 2) - 60 * MS_MINUTE);
    broke(sim); // TEST SETUP
    sim.advanceTo(on(2026, 12, 2) + MS_MINUTE);
    expect(bill.inDebt).toBe(true);
    setBalance(sim, sim.player.primaryAccountId!, 5_000_00); // TEST SETUP: money back, to live on
    // $150 paid toward the debt: more than the $45 share it will turn out to be.
    expect(sim.must<{ paid: number }>({ kind: 'health.pay_bill', payload: { amount: 150_00 } }).paid).toBe(150_00);
    const debt = medicalDebtOf(sim, sim.player)!;
    expect(debt.balance).toBe(-(full - 150_00));
    sim.advanceTo(on(2026, 11, 2) + 60 * MS_DAY + MS_MINUTE);
    expect(bill.denied!.outcome).toBe('overturned');
    expect(debt.balance).toBe(0);
    // Owed the share alone, and $150 paid toward it: $105 comes back, and nothing is owed on the bill.
    const back = memos(sim, 'Appeal won').flatMap((t) => ownMoves(sim, t)).filter((m) => m.accountId !== debt.id);
    expect(back).toEqual([{ accountId: sim.player.primaryAccountId!, amount: 150_00 - share }]);
    expect(bill.inDebt).toBeUndefined();
    expect(bill.paid).toBe(true);
    expect(paperRow(sim, bill)).not.toContain('Owed As Debt');
  });

  it('refuses an appeal 181 days after the denial in its words, which Papers no longer offers; a claim never denied is refused too', () => {
    const { sim, bill } = deniedClaim('g02-claim-55');
    sim.advanceTo(bill.at + 179 * MS_DAY);
    expect(paperRow(sim, bill)).toContain('Appeal It');
    sim.advanceTo(bill.at + 181 * MS_DAY);
    const late = sim.execute({ kind: 'health.appeal', payload: { billId: bill.id } });
    expect(late.ok).toBe(false);
    expect(late.error).toBe('An appeal has to be filed within 180 days of the denial, and that time has passed.');
    expect(bill.denied!.appealedAt).toBeUndefined();
    expect(sim.timeline.pending().filter((i) => i.kind === 'health.appeal_decided')).toEqual([]);
    const row = paperRow(sim, bill);
    expect(row).toContain('Denied');
    expect(row).not.toContain('Appeal It');
    // Not denied: Yale Health's emergency bill from her first morning, on a twin.
    const twin = student('g02-claim-55');
    const yale = careFor(twin, twin.player, { care: 'emergency', what: 'A fall' }, twin.now)!; // TEST SETUP
    expect(twin.execute({ kind: 'health.appeal', payload: { billId: yale.id } }).error).toBe('That claim wasn’t denied.');
  });
});

// ---------------------------------------------------------------------------

describe('health.apply_aid', () => {
  /** The student's first morning: a fall, billed as Yale Health leaves an emergency, $50 (TEST SETUP: `careFor`). */
  function fallen(seed: string): { sim: Simulation; bill: MedicalBill } {
    const sim = student(seed);
    expect(coverOn(sim.player, sim.now)).toBe('yale');
    const bill = careFor(sim, sim.player, { care: 'emergency', what: 'A fall' }, sim.now)!; // TEST SETUP
    expect(bill).toMatchObject({ amount: 50_00, hospital: true, cityId: 'us-ct-newhaven', dueAt: NH(7, 30) + 30 * MS_DAY });
    expect(bill.aid).toBeUndefined();
    return { sim, bill };
  }
  const apply = (sim: Simulation, billId: string) => sim.execute<{ aid: string; amount: number }>({ kind: 'health.apply_aid', payload: { billId } });

  it('PLAYER JOURNEY: Apply For Assistance on Papers with no income makes it Free Care, settled; nothing is paid when it falls due, across a reload', () => {
    const { sim, bill } = fallen('g02-aid-free');
    const papers = drawn(sim, PapersWorkspace, [], HEALTH);
    expect(rowOf(papers.html, titleCaseLabel(bill.what))).toContain('Apply For Assistance');
    expect(papers.press('Apply For Assistance')).toEqual(['The hospital applied its financial assistance to this bill.']);
    expect(bill).toMatchObject({ aid: 'free', amount: 0, paid: true });
    const row = paperRow(sim, bill);
    expect(row).toContain('Free Care');
    expect(row).toContain('Settled');
    expect(row).toContain('$0.00');
    expect(apply(sim, bill.id).error).toBe('It’s already settled or past its due date.');

    const again = reload(sim);
    again.advanceTo(bill.dueAt + MS_DAY);
    expect(billOf(again, bill.id)).toMatchObject({ aid: 'free', amount: 0, paid: true });
    expect(memos(again, 'Medical bill')).toEqual([]);
  });

  it('at $60,000 a year takes 67% off, $16.50 left; refused a second time; $16.50 is what’s paid when it falls due, once, across a reload', () => {
    const { sim, bill } = fallen('g02-aid-discount');
    // TEST SETUP: a year's earnings of $60,000, July's: between 250% and 550% of a poverty line near $16,000.
    earningsOf(sim.player).months['2026-07'] = 60_000_00;
    expect(apply(sim, bill.id).value).toEqual({ aid: 'discount', amount: 16_50 });
    expect(bill).toMatchObject({ aid: 'discount', amount: 16_50 });
    expect(bill.paid).toBeUndefined();
    expect(apply(sim, bill.id).error).toBe('It’s already been put in for the hospital’s financial assistance.');
    expect(paperRow(sim, bill)).toContain('67% Off');

    const again = reload(sim);
    again.advanceTo(bill.dueAt + MS_MINUTE);
    const mine = billOf(again, bill.id);
    expect(mine.paid).toBe(true);
    expect(paidFor(again, mine)).toEqual({ accountId: again.player.primaryAccountId!, amount: 16_50 });
    again.advanceTo(again.now + 30 * MS_DAY);
    expect(memos(again, 'Medical bill')).toHaveLength(1);
  });

  it('refuses a bill past its day, gone unpaid to debt, “It’s settled or past due.”, and Papers offers it none', () => {
    const { sim, bill } = fallen('g02-aid-late');
    sim.advanceTo(bill.dueAt - 60 * MS_MINUTE);
    broke(sim); // TEST SETUP
    sim.advanceTo(bill.dueAt + MS_MINUTE);
    expect(bill.inDebt).toBe(true);
    expect(bill.paid).toBeFalsy();
    const late = apply(sim, bill.id);
    expect(late.ok).toBe(false);
    expect(late.error).toBe('It’s already settled or past its due date.');
    expect(bill.aid).toBeUndefined();
    expect(bill.amount).toBe(50_00);
    const row = paperRow(sim, bill);
    expect(row).toContain('Owed As Debt');
    expect(row).not.toContain('Apply For Assistance');
  });
});
