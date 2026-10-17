/**
 * Evidence for four rows the review of 2026-10-13 left partial (verification group g34-ui): the Decision Center's
 * dismissal and expiry, and the three rows that hold what the removal of the interests (2026-10-10, migration 94)
 * left behind. The review found each one held by a test that never reached the case it named, by a scan of a source
 * file's text instead of the screen the player has, or by nothing at all. Here every case is reached the way a player
 * reaches it: a command through `sim.execute`/`sim.must` (a button's own handler, where there is a button), the clock
 * through `sim.advanceTo`, and a save opened through `openSlot`, the path the game opens a slot by. The figures are the
 * rules' own numbers worked here by hand and written as literals, never the constant or the helper the engine computes
 * them with.
 *
 * - n-dismiss-expire: the tax season's row for a London-born student, Dismiss pressed on Home, takes it off What Needs
 *   You at once; a second press is refused with "You’ve already dismissed that question." ("It’s dismissed already."
 *   until 2026-10-17, brief 14) and the day of the first is kept, across a
 *   save and a load; through its due date nothing asks again; it's kept for 180 days from the dismissal and gone at the
 *   first world tick after, when the command says "That question isn’t in What Needs You any more." ("No such
 *   decision." until 2026-10-17). Until 2026-10-14 an undated row left alone was
 *   dismissed by the world at the first tick past 90 days, and a dismissed row dated 300 days on outlived the 180 until
 *   its date, rules no play reached, held here on rows raised by hand; the owner had both go that day, and a dismissed
 *   row dated 300 days on is gone at the first tick past its 180; and Home lists what's open overdue first, then by urgency, then
 *   by the soonest date, with nothing answered or waved away among it (the two tests of tests/simulation.test.ts that
 *   held the order and the absence looped over no rows at all).
 * - i-ui-text: creation's five steps, Genres & Background's controls and Review, the Profile, the person's look and the
 *   look registry, every guide entry and every chapter of the tutorial, rendered or read as the player has them on a
 *   new life, made since the interests went on 2026-10-10: none named anywhere, and every “interest” left is money’s. A
 *   save from before then shows one line more, “An interest, from before they were removed”, for a record an hour of
 *   one wrote, which tests/evidence2-b13.test.ts holds. tests/creation.test.ts held creation by matching one
 *   heading's exact markup in the source.
 * - i-stale-claims: READ_CRAFTS is named nowhere but the audit trail that records its correction; the two capability
 *   documents pair no interest with love or enjoyment; and in the five files whose prose the removal of 2026-10-10
 *   corrected, every sentence naming the interests is in the past. What this can't do the review asked for too: fail a new present-tense
 *   claim anywhere (no regex measured on 2026-10-13 could tell one, and this line has no claims tool), and correct the
 *   leftovers in tests/attributes-matrix.test.ts, tests/looks.test.ts and src/engine/index.ts, which are other files.
 * - i-genres-dispositions-intact: a save written under schema 93 by a life made with a disposition on every axis away
 *   from creation's start, a trait and a loved genre, opened through `openSlot`: its personality, traits and genres are
 *   the 93 save's to the figure, the interests gone, the migrated save written back over the slot and the 93 kept as
 *   its backup, and a second open changes nothing. Then on the opened saves, by the clock: Drama 50's first meeting and
 *   the Cabaret's read-through move the mood by its agreeableness and openness, the first Cabaret curtain the stress by
 *   its stability, ambition, trait and extraversion, and a second-year's first Rep rehearsal of Tartuffe lifts a comedy
 *   lover 1.5 over a western lover's twin; the card's autopay, starting discipline and composure are what creation set
 *   from them, and the autopay pays Chase's $40.00 floor of the first statement where a twin opened at creation's 50
 *   pays it whole. And, for new lives, starting discipline from conscientiousness at 5 and 95 and composure from
 *   stability at 10 and 90, which nothing tested.
 *
 * PLAYER JOURNEYS: a new life (`newLifeConfig`), Ada Cole, born in New York (the birthplace a player picks on Identity,
 * which `newLifeConfig` leaves empty) and an actor at Yale in New Haven from Monday 24 August 2026, "I Know SLATE."
 * chosen (`tutorial: false`) so Home's panels are open from the first morning; born in London where the row needs a
 * decision the game raises itself, because a London-born student files a US return every year and a New Yorker with
 * Ada's income has none to file. The screens are rendered with react-dom/server, `useGame` standing in for the
 * provider, and a button pressed through its own `onClick`.
 *
 * TEST SETUP, said again where it's done: a row raised with `requireDecision` where nothing a student's life reaches
 * raises one of that shape (dated 300 days on; every raiser in this build dates its row, none more than a
 * return's four and a half months ahead); a save rewritten as schema 93 wrote it (the interests and their record put back, the
 * version set to 93), as tests/migration-94.test.ts writes one; the day's dials each six hours (`tended`) and the
 * coursework each midnight (`working`), so what the clock does at a call is what's measured and a student stays in
 * good standing to the second year; and on creation's screens, the step and the config, which a static render can't
 * click its way to.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createSave, loadSave, openSlot } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { ScheduledItem } from '@/engine/core/scheduler';
import type { Personality, SaveUniverse } from '@/engine/domain/model';
import { MS_DAY, MS_HOUR, MS_MINUTE } from '@/engine/core/time';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { LOCAL_STORE, LocalSaveAdapter } from '@/engine/persistence/local';
import { openDecisions } from '@/engine/world/world';
import { CABARET_KIND, CALL_KIND, LAB_KIND } from '@/engine/systems/school';
import { courseworkOf } from '@/engine/systems/coursework';
import { PREP_DIMS } from '@/engine/content/coursework';
import { GUIDE } from '@/engine/content/guide';
import { CHAPTERS } from '@/engine/content/tutorial';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what the first useStates start at, in render order, in place of their own initial values. */
  states: [] as unknown[],
  controls: [] as { type: string; props: Record<string, unknown>; text: string }[],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    return [h.states.length > 0 ? h.states.shift() : value, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

/** Every control the screens draw, with its words and its own props and handlers. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepControls = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown> | null, ...rest: unknown[]) => {
    if (typeof type === 'string' && ['button', 'input', 'label', 'select', 'option', 'textarea'].includes(type) && props) {
      h.controls.push({ type, props, text: textOf(props.children) });
    }
    return make(type, props, ...rest);
  };
  return {
    ...real,
    ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}),
    ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}),
  };
};
vi.mock('react/jsx-runtime', async (orig) => keepControls(await orig<Record<string, unknown>>()));
vi.mock('react/jsx-dev-runtime', async (orig) => keepControls(await orig<Record<string, unknown>>()));

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { CharacterCreation } = await import('@/ui/creation/CharacterCreation');
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { Home } = await import('@/ui/screens/Home');
const { at } = await import('@/ui/looks');
const { hasKind, lookKinds, resolveLook } = await import('@/ui/looks/registry');

// ---------------------------------------------------------------------------------------------------------------------
// Lives, the clock, and the screens over them
// ---------------------------------------------------------------------------------------------------------------------

/** Ada, as Identity leaves her: born in New York, named, she/her, "I Know SLATE." chosen; else as a new life begins. */
const ada = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', tutorial: false, ...extra });
const student = (seed: string, extra: Partial<NewSaveConfig> = {}, slot: 1 | 2 | 3 = 1): Simulation => createSave(slot, seed, ada(extra));
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** An instant in New Haven on Eastern Daylight Time (UTC−4), worked out here, not by the engine. */
const EDT = (year: number, month: number, day: number, hour: number, minute = 0): number => Date.UTC(year, month - 1, day, hour + 4, minute);
/** And on Eastern Standard Time (UTC−5). */
const EST = (year: number, month: number, day: number, hour: number, minute = 0): number => Date.UTC(year, month - 1, day, hour + 5, minute);

/** TEST SETUP: the clock moved six hours at a time with the body kept fed, rested and awake, as a player's meals and sleep keep it. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}
/** TEST SETUP: the coursework done each midnight, as a student who prepares keeps it, so the standing stays good. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
const pendingOf = (sim: Simulation, kind: string): ScheduledItem[] => sim.universe.scheduled
  .filter((i) => i.status === 'pending' && i.kind === kind && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);
/** The dials an instant before an item and at it: what the item itself did. */
function across(sim: Simulation, item: ScheduledItem): { morale: number; stress: number } {
  tended(sim, item.at - 1);
  const was = { ...sim.player.wellbeing };
  sim.advanceTo(item.at);
  expect(item.status, item.label).toBe('done');
  return { morale: sim.player.wellbeing.morale - was.morale, stress: sim.player.wellbeing.stress - was.stress };
}

/** What the player reads: the markup with every tag taken out and its entities read. */
const onScreen = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  // A tag closed before a stop leaves a space the reader doesn't see.
  .replace(/ ([.,;:])/g, '$1');
interface Drawn { html: string; text: string; controls: { type: string; props: Record<string, unknown>; text: string }[] }
/** A screen as the player has it over a save: its markup, its words, and its controls. */
function drawn(sim: Simulation, screen: FunctionComponent): Drawn {
  h.sim = sim;
  h.states = [];
  h.controls = [];
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: onScreen(html), controls: [...h.controls] };
}
/** A step of creation as the player has it, drawn from a config. */
function creation(step: number, config: NewSaveConfig): Drawn {
  // TEST SETUP: CharacterCreation's first two states in render order, the step and the config: a static render can't
  // click its way from one step to the next.
  h.states = [step, config];
  h.controls = [];
  const html = renderToStaticMarkup(createElement(CharacterCreation, { slot: 1 as never, onCancel: () => undefined, onStart: () => undefined })).replace(/<!-- -->/g, '');
  expect(h.states).toHaveLength(0);
  return { html, text: onScreen(html), controls: [...h.controls] };
}
const headings = (html: string) => [...html.matchAll(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => onScreen(m[2]!).trim());
/** Home's What Needs You panel, from its heading to the next panel's. */
const needs = (text: string) => text.slice(text.indexOf('What Needs You'), text.indexOf('Your Affairs') > text.indexOf('What Needs You') ? text.indexOf('Your Affairs') : undefined);
const pressed = (d: Drawn, words: string) => {
  const found = d.controls.filter((c) => c.type === 'button' && c.text === words);
  expect(found, `one button “${words}”`).toHaveLength(1);
  return (found[0]!.props.onClick as () => unknown)();
};

// ---------------------------------------------------------------------------------------------------------------------
// n-dismiss-expire
// ---------------------------------------------------------------------------------------------------------------------

describe('n-dismiss-expire', () => {
  const dismiss = (sim: Simulation, decisionId: string) => sim.execute<{ dismissed: boolean }>({ kind: 'world.dismiss_decision', payload: { decisionId } });

  it('PLAYER JOURNEY: a London-born student’s 2026 return, Dismiss pressed on Home, leaves What Needs You at once; a second press is refused and the first day kept across a save and a load; nothing asks again past its date; kept 180 days, then gone, and the command says “No such decision.”', () => {
    // Born in London, at Yale on an F-1: a US return every year, so the tax season raises the row itself.
    let sim = student('g34-dismiss-london', { homeRegionId: 'uk-eng-london' });
    sim.advanceTo(EST(2027, 2, 1, 10));
    const rows = Object.values(sim.universe.decisions);
    expect(rows.map((d) => [d.title, d.refType, d.refId, d.createdAt])).toEqual([['Your 2026 Tax Return', 'return', '2026', EST(2027, 2, 1, 9)]]);
    const row = rows[0]!;
    // Due 11:59 PM on Thursday 15 April 2027, the IRS's deadline that year.
    expect(row.dueAt).toBe(EDT(2027, 4, 15, 23, 59));
    expect(row.actions).toEqual([{ label: 'File It', commandKind: 'tax.file', payload: { year: 2026 } }]);

    const before = drawn(sim, Home);
    expect(needs(before.text)).toContain('What Needs You 1 open');
    expect(needs(before.text)).toContain('Your 2026 Tax Return');
    expect(before.controls.filter((c) => c.type === 'button').map((c) => c.text)).toEqual(expect.arrayContaining(['File It', 'Go There', 'Dismiss']));

    // Pressed on Home: the button's own handler, which runs the command.
    const answer = pressed(before, 'Dismiss') as { ok: boolean };
    expect(answer.ok).toBe(true);
    expect(sim.universe.decisions[row.id]!.dismissedAt).toBe(EST(2027, 2, 1, 10));
    expect(sim.universe.decisions[row.id]!.resolvedAt).toBeUndefined();
    expect(openDecisions(sim)).toEqual([]);
    const after = drawn(sim, Home);
    expect(needs(after.text)).toContain('What Needs You No decision is waiting on you.');
    expect(after.text).not.toContain('Your 2026 Tax Return');
    expect(after.controls.some((c) => c.type === 'button' && c.text === 'Dismiss')).toBe(false);

    // Pressed again an hour on: refused in its own words, and the day it was dismissed is the first press's.
    sim.advanceTo(EST(2027, 2, 1, 11));
    const twice = dismiss(sim, row.id);
    expect([twice.ok, twice.error]).toEqual([false, 'You’ve already dismissed that question.']);
    expect(sim.universe.decisions[row.id]!.dismissedAt).toBe(EST(2027, 2, 1, 10));

    // Saved and loaded a month on: still dismissed, from the same day, and still refused.
    sim.advanceTo(EST(2027, 3, 1, 12));
    sim = reload(sim);
    expect(sim.universe.decisions[row.id]!.dismissedAt).toBe(EST(2027, 2, 1, 10));
    expect(dismiss(sim, row.id).error).toBe('You’ve already dismissed that question.');

    // Past its date: nothing asks again, the one row is the one dismissed, and it was never resolved.
    sim.advanceTo(EDT(2027, 4, 20, 12));
    expect(openDecisions(sim)).toEqual([]);
    expect(Object.values(sim.universe.decisions).filter((d) => d.refType === 'return').map((d) => [d.id, d.dismissedAt, d.resolvedAt])).toEqual([[row.id, EST(2027, 2, 1, 10), undefined]]);

    // 180 days from the dismissal, to the minute: kept. The world tick every second day is the one that lets it go, so
    // it's gone two days and an hour later.
    sim.advanceTo(EST(2027, 2, 1, 10) + 180 * MS_DAY);
    expect(sim.universe.decisions[row.id]).toBeDefined();
    sim.advanceTo(EST(2027, 2, 1, 10) + 182 * MS_DAY + MS_HOUR);
    expect(sim.universe.decisions[row.id], 'a dismissed row outlived 180 days and its date').toBeUndefined();
    const gone = dismiss(sim, row.id);
    expect([gone.ok, gone.error]).toEqual([false, 'That question isn’t in What Needs You any more.']);
    expect(dismiss(sim, 'decision_999999').error).toBe('That question isn’t in What Needs You any more.');
  }, 60_000);

  // Until 2026-10-14 a test here held a rule no play reached, on a row raised by hand with no date: an undated row left
  // alone was dismissed at the first tick past 90 days and deleted 180 days on. And the next kept a dismissed row dated
  // 300 days on to its date. The owner had both go that day; every raiser dates its row, which
  // tests/decisions-2026-10-14.test.ts holds through each raiser's own play.
  it('lets a dismissed row dated 300 days on go at the first tick past its 180 days, its date not come', () => {
    const sim = student('g34-far');
    const t0 = sim.now;
    const dueAt = t0 + 300 * MS_DAY + 3 * MS_HOUR;
    // TEST SETUP: a row dated 300 days on; nothing in this build dates one so far ahead.
    sim.requireDecision({ urgency: 60, category: 'personal', title: 'Renew The Lease', detail: 'Next summer.', dueAt, refType: 'g34', refId: 'far' });
    const id = Object.keys(sim.universe.decisions)[0]!;
    expect(dismiss(sim, id).ok).toBe(true);
    expect(sim.universe.decisions[id]!.dismissedAt).toBe(t0);

    sim.advanceTo(t0 + 180 * MS_DAY);
    expect(sim.universe.decisions[id]).toBeDefined();
    // Not reopened, not resolved: still the dismissal of the first morning.
    expect([sim.universe.decisions[id]!.dismissedAt, sim.universe.decisions[id]!.resolvedAt]).toEqual([t0, undefined]);
    sim.advanceTo(t0 + 182 * MS_DAY + MS_HOUR);
    expect(sim.universe.decisions[id], 'a dismissed row was kept past its 180 days, to its date').toBeUndefined();
  }, 60_000);

  it('lists on Home what is open, overdue first, then by urgency, then the soonest date; nothing answered or waved away is among it', () => {
    const sim = student('g34-order');
    const t0 = sim.now;
    // Four were undated until 2026-10-14, when requireDecision took no row without a date: dated twenty days on, the last
    // of the open ones still sorts after the two of its urgency with sooner dates.
    const raise = (title: string, urgency: number, dueAt = t0 + 20 * MS_DAY, actions?: { label: string; commandKind: string; payload: Record<string, unknown> }[]) => {
      // TEST SETUP: rows raised by hand, as tests/smoke.test.ts raises them; nothing raises seven in a first week.
      sim.requireDecision({ urgency, category: 'personal', title, detail: `${title}.`, dueAt, refType: 'g34', refId: title, ...(actions ? { actions } : {}) });
      return Object.values(sim.universe.decisions).find((d) => d.refId === title)!.id;
    };
    const planned = sim.must<{ ok: boolean; id: string }>({ kind: 'calendar.schedule', payload: { title: 'Dentist', at: t0 + 10 * MS_DAY } });
    raise('Elderberries', 50);
    raise('Cherries', 50, t0 + 3 * MS_DAY);
    raise('Apples', 20, t0 + MS_HOUR);
    const figs = raise('Figs', 99);
    raise('Bananas', 90);
    const grapes = raise('Grapes', 98, undefined, [{ label: 'Call It Off', commandKind: 'calendar.cancel', payload: { entryId: planned.id } }]);
    raise('Dates', 50, t0 + 10 * MS_DAY);
    // Two hours on: Apples is past its date and no world tick has come to close it (the first is Wednesday morning).
    sim.advanceTo(t0 + 2 * MS_HOUR);
    sim.must({ kind: 'world.dismiss_decision', payload: { decisionId: figs } });
    expect(sim.must<{ ok: boolean }>({ kind: 'world.take_decision_action', payload: { decisionId: grapes, actionIndex: 0 } }).ok).toBe(true);

    const shown = needs(drawn(sim, Home).text);
    expect(shown).toContain('What Needs You 5 open');
    const order = ['Apples', 'Bananas', 'Cherries', 'Dates', 'Elderberries'].map((t) => shown.indexOf(t));
    expect(order.every((n) => n >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(shown).not.toContain('Figs');
    expect(shown).not.toContain('Grapes');
    // The overdue row says so, and it's the first.
    expect(shown.slice(shown.indexOf('Apples'), shown.indexOf('Bananas'))).toContain('Overdue');
    expect(openDecisions(sim).map((d) => d.title)).toEqual(['Apples', 'Bananas', 'Cherries', 'Dates', 'Elderberries']);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// i-ui-text
// ---------------------------------------------------------------------------------------------------------------------

/** Money's words: any "interest" left in the guide must stand among them. */
const MONEY = /\b(?:rates?|apr|tax\w*|cards?|banks?|owed?|owing|paid|pay\w*|earn\w*|statements?|penalt\w*|deposits?|loans?|overdraft|balances?|plans?|accounts?|irs|fees?|returns?|money|savings|cds?|terms?|debts?|purchases?|transfers?|withdraw\w*|cash|rewards|accru\w*|compound\w*|connecticut|year)\b/i;

describe('i-ui-text', () => {
  it('PLAYER JOURNEY: creation’s five steps name no interests; Genres & Background is headed Genres and Background, and none of its controls or Review’s says interest', () => {
    const config = ada({ genres: ['comedy'] });
    const steps = [0, 1, 2, 3, 4].map((step) => creation(step, config));
    // The steps as the list at the top names them (each ampersand held to the word before it by a no-break space, which
    // the reader sees as a space).
    expect(steps[0]!.html.match(/<div class="creation-step"[^>]*>([^<]*)<\/div>/g)!.map((m) => onScreen(m).trim())).toEqual(['Identity', 'Dispositions & Traits', 'Genres & Background', 'Starting Point', 'Review']);
    for (const [n, s] of steps.entries()) {
      expect(s.text, `step ${n}`).not.toMatch(/\binterests?\b/i);
      for (const c of s.controls) {
        const said = [c.text, c.props.id, c.props.name, c.props.htmlFor, c.props['aria-label'], c.props.title, c.props.placeholder, c.props.value].filter((x) => typeof x === 'string').join(' ');
        expect(said, `step ${n}, a ${c.type}`).not.toMatch(/\binterests?\b/i);
      }
    }
    const personal = steps[2]!;
    // Your Family beside the background, from 2026-10-14 (the family a life comes from, `FamilyChoice`).
    expect(headings(personal.html).filter((t) => !t.startsWith('Who Are You'))).toEqual(['Genres', 'Background', 'Your Family']);
    expect(personal.controls.filter((c) => c.type === 'button' && c.props.className === 'chip')).toHaveLength(149);
    expect(personal.controls.find((c) => c.type === 'label' && c.props.htmlFor === 'background')?.text).toBe('In Your Own Words');
    // Review says back the genres and the background, under that one heading.
    // The family between them from 2026-10-14, as Review names it.
    expect(steps[4]!.text).toContain('Genres & Background Genres Comedy Family Wealthy, No Need Found In Your Own Words —');
  });

  it('PLAYER JOURNEY: the Profile, on the first morning and after a week lived, has no Interests section and no interest in its words or its controls; it says the genres back', () => {
    const sim = student('g34-profile', { genres: ['comedy'] });
    for (const when of ['first morning', 'a week on']) {
      if (when === 'a week on') tended(sim, sim.now + 7 * MS_DAY);
      const page = drawn(sim, ProfileWorkspace);
      expect(page.text, when).not.toMatch(/\binterests?\b/i);
      expect(headings(page.html).filter((t) => /interest/i.test(t)), when).toEqual([]);
      expect(page.controls.filter((c) => /interest/i.test([c.text, c.props.title, c.props['aria-label']].join(' '))), when).toEqual([]);
      expect(page.text, when).toContain('You love: Comedy.');
      // The panels it has, by their titles.
      expect(page.text).toContain('Identity And Background');
      expect(page.text).toContain('Attributes And Craft');
    }
  });

  it('has no interest look: the registry has no such kind, an older save’s pointer to one opens nothing, and the person’s look says the films and no interests', () => {
    const sim = student('g34-looks', { genres: ['comedy'] });
    expect(lookKinds().length).toBeGreaterThan(20);
    expect(lookKinds().filter((k) => /interest/i.test(k))).toEqual([]);
    expect(hasKind('interest')).toBe(false);
    expect(resolveLook(sim, at('interest', 'theatre'))).toBeUndefined();
    h.sim = sim;
    h.states = [];
    const found = resolveLook(sim, at('person', sim.player.id));
    if (!found || 'gone' in found) throw new Error('Ada’s own look didn’t resolve');
    const body = onScreen(renderToStaticMarkup(createElement('div', null, found.body)));
    expect(body).toContain('The films you love. Comedy.');
    expect(body).not.toMatch(/\binterests?\b/i);
  });

  it('has no interests in the guide or the tutorial: no entry’s or chapter’s words name them, and every “interest” there is money’s', () => {
    const strings = (o: unknown, path: string, out: [string, string][] = []): [string, string][] => {
      if (typeof o === 'string') out.push([path, o]);
      else if (Array.isArray(o)) o.forEach((x, i) => strings(x, `${path}[${i}]`, out));
      else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) strings(v, `${path}.${k}`, out);
      return out;
    };
    const guide = GUIDE.flatMap((entry) => strings(entry, entry.id).map(([p, s]) => [p, s, entry.goal] as const));
    const chapters = CHAPTERS.flatMap((chapter) => strings(chapter, chapter.id));
    // Enough read that an empty walk can't pass: every entry's title, short and steps, every chapter's words.
    expect(guide.length).toBeGreaterThan(GUIDE.length * 10);
    expect(chapters.length).toBeGreaterThan(CHAPTERS.length * 3);
    expect(guide.filter(([, s]) => /\binterests\b/i.test(s))).toEqual([]);
    expect(chapters.filter(([, s]) => /\binterests\b/i.test(s))).toEqual([]);
    // Each "interest" is in an entry under Money or Papers (the taxes are Papers'), and in a line that's about money.
    const named = guide.filter(([, s]) => /\binterest\b/i.test(s));
    expect(named.length).toBeGreaterThan(0);
    expect([...new Set(named.map(([, , goal]) => goal))].sort()).toEqual(['money', 'papers']);
    for (const [path, s] of [...named, ...chapters.filter(([, s]) => /\binterest\b/i.test(s))]) {
      // A label alone ("Interest", "Interest So Far") stands under its entry's money; anything longer says its money.
      if (/^(?:[A-Z][a-z’']*\s?){1,4}$/.test(s) || /^(?:a year of interest|the interest built so far)$/i.test(s)) continue;
      expect(`${path}: ${s}`).toMatch(MONEY);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// i-stale-claims
// ---------------------------------------------------------------------------------------------------------------------

describe('i-stale-claims', () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const posix = (p: string) => p.split('\\').join('/');
  const GONE = 'READ_CRAFTS';

  it('names READ_CRAFTS nowhere in the code, the tests or the docs, but in the audit trail that records its correction', () => {
    const files = [...walk('src'), ...walk('tests'), ...walk('docs')].map(posix).filter((f) => /\.(ts|tsx|mjs|js|json|md)$/.test(f));
    expect(files.length).toBeGreaterThan(300);
    const named = files.filter((f) => readFileSync(f, 'utf8').includes(GONE));
    // This file names it, to say what it looks for.
    expect(named.filter((f) => !f.startsWith('docs/verification/') && f !== 'docs/GAMEPLAY-COVERAGE.md' && f !== 'tests/evidence-g34-ui.test.ts')).toEqual([]);
  });

  it('has the capability documents pair no interest with love or enjoyment, and name no interests', () => {
    for (const f of ['docs/capabilities.json', 'docs/CAPABILITIES.md']) {
      const text = readFileSync(f, 'utf8');
      expect(text.length, f).toBeGreaterThan(10_000);
      expect(text, f).not.toMatch(/\binterests\b/i);
      expect(text, f).not.toMatch(/reading interest/i);
      expect(text.match(/[^.|"\n]*\binterest\b[^.|"\n]*/gi)?.filter((s) => /\blov(?:e|ed|es|ing)\b|enjoy/i.test(s)) ?? [], f).toEqual([]);
    }
  });

  it('keeps every sentence naming the interests in the past, in the five files whose prose the removal corrected', () => {
    const files = ['src/ui/looks/actor.tsx', 'src/engine/systems/life.ts', 'src/engine/systems/enjoyment.ts', 'src/ui/creation/CharacterCreation.tsx', 'src/ui/workspaces/ProfileWorkspace.tsx'];
    const NAMES = /\binterests?\b|byInterest|interest\.pursue|interestsRead/i;
    const PAST = /\b(?:until|went|removed|dropped|was|were|had|lifted|named|carried|kept|stood)\b|2026-10-10|from before/i;
    const found: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      // Comments and strings: what a reader of the code, or the player, reads. A one-word string is a key, not prose.
      const prose = [...src.matchAll(/\/\*[\s\S]*?\*\/|\/\/[^\n]*(?:\n[ \t]*\/\/[^\n]*)*|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g)]
        .map((m) => m[0]).filter((b) => !/^'[\w.-]*'$/.test(b))
        .map((b) => b.replace(/^\s*\/\*+|\*+\/\s*$/g, '').replace(/\n\s*\*\s?/g, ' ').replace(/\n\s*\/\/\s?/g, ' ').replace(/^\/\/\s?/, '').replace(/\s+/g, ' '));
      for (const s of prose.flatMap((p) => p.split(/(?<=[.!?])\s+/))) {
        if (!NAMES.test(s)) continue;
        found.push(f);
        expect(s, f).toMatch(PAST);
      }
    }
    // Every one of the five names them somewhere, so a walk that found nothing can't pass.
    expect([...new Set(found)].sort()).toEqual([...files].sort());
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// i-genres-dispositions-intact
// ---------------------------------------------------------------------------------------------------------------------

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(key: string) { return this.map.get(key) ?? null; }
  key(index: number) { return [...this.map.keys()][index] ?? null; }
  removeItem(key: string) { this.map.delete(key); }
  setItem(key: string, value: string) { this.map.set(key, value); }
}

/** A disposition on every axis away from where creation starts them (55, and 60 ambition, 50 risk). */
const AWAY: Personality = { openness: 80, conscientiousness: 20, extraversion: 90, agreeableness: 10, emotionalStability: 30, ambition: 70, riskTolerance: 90 };

describe('i-genres-dispositions-intact', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage');
  });

  /**
   * TEST SETUP: the save as 93 wrote it, as tests/migration-94.test.ts writes one: interests on the sheet and an hour of
   * one on record, the version 93; written to the device's store as the game writes a slot.
   */
  async function as93(sim: Simulation): Promise<LocalSaveAdapter> {
    const u = JSON.parse(serialise(sim.universe)) as SaveUniverse;
    const p = u.people[u.playerId] as unknown as Record<string, unknown> & { engagement?: Record<string, unknown> };
    p.interests = ['theatre', 'cooking'];
    // A life that hasn't studied a genre has no record of them yet; 92 gave everybody with a craft one.
    p.engagement ??= { byGenre: {} };
    p.engagement.byInterest = { theatre: { familiarity: 6, sessions: 1, satiation: 0.25, satiatedAt: sim.now, lastAt: sim.now } };
    u.meta.schemaVersion = 93;
    const adapter = new LocalSaveAdapter(LOCAL_STORE);
    await adapter.save(u);
    return adapter;
  }
  /** PLAYER JOURNEY: the slot opened as the game opens it, and the game loaded from what it hands back. */
  async function opened(sim: Simulation): Promise<Simulation> {
    const adapter = await as93(sim);
    const got = await openSlot(adapter, sim.universe.meta.slot);
    if ('error' in got) throw new Error(got.error);
    expect(got.migration.from).toBe(93);
    return loadSave(got.universe);
  }

  it('PLAYER JOURNEY: a 93 save opened through openSlot keeps the personality, the trait and the genres to the figure, drops the interests, writes the save back with the 93 as its backup, and a second open changes nothing', async () => {
    const sim = student('g34-m94', { genres: ['comedy'], personality: AWAY, personalityTraits: ['curious'] });
    sim.must({ kind: 'genre.study', payload: { genre: 'comedy' } });
    const byGenre = JSON.stringify(sim.player.engagement!.byGenre);
    expect(sim.player.engagement!.byGenre.comedy!.familiarity).toBeGreaterThan(0);
    const adapter = await as93(sim);

    const got = await openSlot(adapter, 1);
    if ('error' in got) throw new Error(got.error);
    expect([got.migration.from, got.migration.to, got.migration.migrated]).toEqual([93, 94, true]);
    expect(got.migration.steps).toContain('Let go of 1 person’s interests: the game no longer keeps them.');
    // Nobody given a personality this build can read: the one the save had was kept.
    expect(got.migration.steps.filter((s) => /personality/.test(s))).toEqual([]);
    const p = got.universe.people[got.universe.playerId]!;
    expect(p.personality).toEqual({ openness: 80, conscientiousness: 20, extraversion: 90, agreeableness: 10, emotionalStability: 30, ambition: 70, riskTolerance: 90 });
    expect(p.personalityTraits).toEqual(['curious']);
    expect(p.genres).toEqual(['comedy']);
    expect('interests' in p).toBe(false);
    expect('byInterest' in p.engagement!).toBe(false);
    expect(JSON.stringify(p.engagement!.byGenre)).toBe(byGenre);

    // Written back over the slot, at 94; the 93 kept as the backup.
    const slot = await adapter.load(1);
    expect(slot!.meta.schemaVersion).toBe(94);
    expect(slot!.people[slot!.playerId]!.personality).toEqual(p.personality);
    expect('interests' in slot!.people[slot!.playerId]!).toBe(false);
    // A second open: nothing to do, and the save as the first left it.
    const again = await openSlot(adapter, 1);
    if ('error' in again) throw new Error(again.error);
    expect([again.migration.migrated, again.migration.steps]).toEqual([false, []]);
    expect(serialise(again.universe)).toBe(serialise(slot!));
    const backup = await adapter.restoreBackup(1);
    expect(backup!.meta.schemaVersion).toBe(93);
    expect((backup!.people[backup!.playerId] as unknown as { interests: string[] }).interests).toEqual(['theatre', 'cooking']);

    // The game on the opened save: what creation set from the dispositions, and the page that says them.
    const game = loadSave(got.universe);
    // Risk tolerance 90, over 65: the card's autopay on the minimum.
    expect(game.player.credit!.autopay).toBe('minimum');
    // Discipline 30 + 0.5 × conscientiousness 20; composure 25 + 0.35 × stability 30.
    expect(game.player.attrs!.discipline).toBe(40);
    expect(game.player.attrs!.composure).toBe(35.5);
    const page = drawn(game, ProfileWorkspace).text;
    expect(page).toContain('Emotional Stability 30, how fast stress comes and clears, and where composure starts; Conscientiousness 20, how well a night’s sleep restores you, and where discipline starts; Ambition 70, how fast every stress comes; Risk Tolerance 90, over 65, so the card’s autopay started on the minimum; Extraversion 90, how a house watching sits with you; Openness 80, how rehearsing new work does; Agreeableness 10, how a rehearsal does.');
    expect(page).toContain('You love: Comedy.');
    expect(page).toContain('Discipline 40.0 ');
    expect(page).toContain('Composure 35.5 ');
  });

  it('PLAYER JOURNEY: on the opened save, the card’s autopay on the minimum, set by a risk tolerance of 90, pays Chase’s $40.00 floor of a $270.00 statement and carries the rest; a twin at creation’s 50 pays it whole', async () => {
    const card = (sim: Simulation) => sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === 'credit_card')!;
    const paid = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'Paid Chase Freedom Unlimited')
      .map((t) => t.postings.filter((p) => p.accountId === card(sim).id).reduce((n, p) => n + p.amount, 0));
    const statements = (sim: Simulation) => sim.universe.notifications.filter((n) => n.title === 'Statement Ready: Chase Freedom Unlimited').map((n) => [n.at, n.body]);
    const lives: Simulation[] = [];
    for (const [personality, slot] of [[AWAY, 1], [undefined, 2]] as const) {
      const sim = await opened(student('g34-card', { genres: ['comedy'], ...(personality ? { personality } : {}) }, slot));
      // The everyday spending on the card, as Payments on the Bank sets it.
      sim.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
      sim.advanceTo(EDT(2026, 10, 11, 13));
      lives.push(sim);
    }
    const [away, start] = lives as [Simulation, Simulation];
    expect([away.player.credit!.autopay, start.player.credit!.autopay]).toEqual(['minimum', 'full']);
    // Sunday 20 September, 9 AM: twenty-seven midnights of New Haven's $10.00 of groceries, from Tuesday 25 August; Chase's
    // minimum is 1% and the month's interest, never under $40 (its published terms).
    for (const sim of lives) expect(statements(sim)).toEqual([[EDT(2026, 9, 20, 9), '$270.00 to pay, at least $40.00.']]);
    // Sunday 11 October, 21 days on: the minimum, or the whole statement.
    expect(paid(away)).toEqual([40_00]);
    expect(paid(start)).toEqual([270_00]);
    expect([away.player.credit!.carrying, start.player.credit!.carrying]).toEqual([true, false]);
  }, 60_000);

  it('PLAYER JOURNEY: on opened saves, by the clock, Drama 50’s first meeting, the Cabaret’s read-through and its first curtain move the mood and the stress by the dispositions the 93 save held, not creation’s start', async () => {
    /** Ada at one personality, rested to Wednesday 2 September, in the Cabaret, written by 93 and opened. */
    const life = async (personality: Personality | undefined, traits: string[], slot: 1 | 2) => {
      const sim = student('g34-dispositions', { genres: ['comedy'], ...(personality ? { personality } : {}), personalityTraits: traits }, slot);
      tended(sim, EDT(2026, 9, 2, 12));
      expect(sim.must<{ week: string }>({ kind: 'school.cabaret', payload: {} }).week).toBe('2026-09-24');
      return opened(sim);
    };
    const away = await life(AWAY, ['curious'], 1);
    const start = await life(undefined, [], 2);
    expect(start.player.personality).toEqual({ openness: 55, conscientiousness: 55, extraversion: 55, agreeableness: 55, emotionalStability: 55, ambition: 60, riskTolerance: 50 });

    // 3 PM Tuesday 8 September, Drama 50: a rehearsal's company, 2 × (agreeableness − 50)/50.
    const lab = (sim: Simulation) => {
      const item = pendingOf(sim, LAB_KIND)[0]!;
      expect([item.at, item.label]).toEqual([EDT(2026, 9, 8, 15), 'Drama 50: The Theatrical Event']);
      return across(sim, item);
    };
    const [awayLab, startLab] = [lab(away), lab(start)];
    expect(awayLab.morale).toBeCloseTo(-1.6, 9);
    expect(startLab.morale).toBeCloseTo(0.2, 9);
    // And no stress: what moves in the millisecond across it is the day's own easing, by each one's stability.
    expect(awayLab.stress).toBeCloseTo(0, 6);
    expect(startLab.stress).toBeCloseTo(0, 6);

    // 6 PM Friday 11 September, the Cabaret's read-through: new work by openness, 2 × (80 − 50)/50 = 1.2, and the
    // company by agreeableness, −1.6; at creation's start 0.2 and 0.2.
    const read = (sim: Simulation) => {
      const item = pendingOf(sim, CABARET_KIND).find((i) => i.payload.call === 'rehearsal')!;
      expect([item.at, item.label]).toEqual([EDT(2026, 9, 11, 18), 'Yale Cabaret: Read-Through']);
      return across(sim, item);
    };
    const [awayRead, startRead] = [read(away), read(start)];
    expect(awayRead.morale).toBeCloseTo(-0.4, 9);
    expect(startRead.morale).toBeCloseTo(0.4, 9);

    // 8 PM Thursday 24 September, the first curtain: the nerves, a performance's 6 × (1 − composure/100) by how hard
    // stress comes, then the house taken by extraversion, 4 × (extraversion − 50)/50 off. How hard stress comes, worked
    // by hand from the rule: Curious's 1.1, times 1 − 0.3 × (stability − 50)/45 + 0.15 × (ambition − 50)/45, which is
    // 1 + 0.3 × 20/45 + 0.15 × 20/45 = 1.2 at stability 30 and ambition 70 (and 1 at 55 and 60), bent toward its
    // limit of 1.8 as exp(ln 1.8 × tanh(ln x / ln 1.8)).
    const curtain = (sim: Simulation) => {
      const show = pendingOf(sim, CABARET_KIND).find((i) => i.payload.call === 'performance')!;
      expect(show.at).toBe(EDT(2026, 9, 24, 20));
      tended(sim, show.at - 1);
      const composure = sim.player.attrs!.composure;
      const before = sim.player.wellbeing.stress;
      sim.advanceTo(show.at);
      expect(sim.player.school!.cabaret!.performed).toBe(1);
      return { composure, moved: sim.player.wellbeing.stress - before };
    };
    const gain = Math.exp(Math.log(1.8) * Math.tanh(Math.log(1.1 * 1.2) / Math.log(1.8)));
    expect(gain).toBeCloseTo(1.2952, 4);
    const [awayNight, startNight] = [curtain(away), curtain(start)];
    // To a millionth: the millisecond before the curtain eases a ten-millionth of stress by the day's own rate.
    expect(awayNight.moved).toBeCloseTo(6 * (1 - awayNight.composure / 100) * gain - 3.2, 6);
    expect(startNight.moved).toBeCloseTo(6 * (1 - startNight.composure / 100) - 0.4, 6);
    // Opened at creation's start instead, she'd have been moved as the twin was at her own composure: 1.67 more.
    expect(6 * (1 - awayNight.composure / 100) - 0.4 - awayNight.moved).toBeGreaterThan(1.5);

    // Saved and loaded after the curtain, and a minute on: played once.
    // The minute lived in the save it was loaded from, too: the two alike.
    const again = reload(away);
    again.advanceTo(again.now + MS_MINUTE);
    away.advanceTo(away.now + MS_MINUTE);
    expect(again.player.school!.cabaret!.performed).toBe(1);
    expect(again.player.wellbeing.stress).toBeCloseTo(away.player.wellbeing.stress, 9);
  }, 60_000);

  it('PLAYER JOURNEY: on second-year saves written by 93 and opened, the first Rep rehearsal of Tartuffe lifts the comedy lover 1.5 and eases her 1.5 more than her twin who loves westerns, once across a save and a load', async () => {
    /** Ada at the AWAY dispositions, a second-year by Wednesday 25 August 2027, written by 93 and opened. */
    const life = async (genre: string, slot: 1 | 2) => {
      const sim = working(student('g34-genres', { genres: [genre], personality: AWAY, personalityTraits: ['curious'] }, slot));
      tended(sim, EDT(2027, 8, 25, 8));
      return working(await opened(sim));
    };
    const comedy = await life('comedy', 1);
    const western = await life('western', 2);
    expect(comedy.player.genres).toEqual(['comedy']);
    expect(western.player.genres).toEqual(['western']);
    for (const sim of [comedy, western]) {
      expect(sim.player.personality).toEqual(AWAY);
      expect([sim.player.school!.rep!.play, sim.player.school!.rep!.kind]).toEqual(['Tartuffe', 'understudy']);
    }
    // 3 PM Wednesday 25 August: Yale Rep's Tartuffe, a comedy and a satire (Molière, 1664), its understudies' first rehearsal.
    const call = (sim: Simulation) => {
      const item = pendingOf(sim, CALL_KIND).find((i) => i.payload.which === 'rep' && i.payload.call === 'rehearsal')!;
      expect([item.at, item.label]).toEqual([EDT(2027, 8, 25, 15), 'Yale Rep’s October Production: Understudy Rehearsal']);
      return across(sim, item);
    };
    const [loved, unread] = [call(comedy), call(western)];
    expect(loved.morale - unread.morale).toBeCloseTo(1.5, 9);
    expect(loved.stress - unread.stress).toBeCloseTo(-1.5, 9);
    // The twin who loves westerns has the rehearsal's company alone, by her agreeableness of 10: 2 × (10 − 50)/50.
    expect(unread.morale).toBeCloseTo(-1.6, 9);

    // Saved and loaded after it, a minute on: the call was answered once.
    const again = working(reload(comedy));
    again.advanceTo(again.now + MS_MINUTE);
    comedy.advanceTo(comedy.now + MS_MINUTE);
    expect(again.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which === 'rep' && i.status === 'done' && i.at === EDT(2027, 8, 25, 15))).toHaveLength(1);
    expect(again.player.wellbeing.morale).toBeCloseTo(comedy.player.wellbeing.morale, 9);
    expect(again.player.wellbeing.stress).toBeCloseTo(comedy.player.wellbeing.stress, 9);
  }, 60_000);

  it('PLAYER JOURNEY: starts a new life’s discipline at 30 + conscientiousness ÷ 2 and its composure at 25 + 0.35 × stability, at both ends of the sliders, and the Profile says so; presence is drawn alike', () => {
    const low = student('g34-attrs', { personality: { ...AWAY, conscientiousness: 5, emotionalStability: 10 } });
    const high = student('g34-attrs', { personality: { ...AWAY, conscientiousness: 95, emotionalStability: 90 } });
    // 30 + 2.5 and 30 + 47.5; 25 + 3.5 and 25 + 31.5.
    expect([low.player.attrs!.discipline, high.player.attrs!.discipline]).toEqual([32.5, 77.5]);
    expect([low.player.attrs!.composure, high.player.attrs!.composure]).toEqual([28.5, 56.5]);
    // Presence is the draw's, the same seed's, whatever the sliders.
    expect(low.player.attrs!.presence).toBe(high.player.attrs!.presence);
    const [lowPage, highPage] = [drawn(low, ProfileWorkspace).text, drawn(high, ProfileWorkspace).text];
    expect(lowPage).toContain('Discipline 32.5 ');
    expect(lowPage).toContain('Composure 28.5 ');
    expect(highPage).toContain('Discipline 77.5 ');
    expect(highPage).toContain('Composure 56.5 ');
  });
});
