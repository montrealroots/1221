/**
 * Round three of the school rows' evidence, 2026-10-14: what the final checks of 2026-10-13 left open on
 * `school.respond`, `school.take_shift`, the standing and term evaluation, `school.request_conversion` and
 * `school.pay_balance`, played here. `school.request_repeat` and `school.request_extra_term` have nothing here: what
 * stays open on them is a branch no played life reaches (the decision's own refusals, and the nine at the request and
 * the decision), and the reason is in round3/school.json, not in a test that would only reach them from a fixture again.
 *
 * - `school.respond`: until 2026-10-13 a leave called a classmate's moment off, and the moment stayed open for good.
 *   The withdrawal and the dismissal paths were shown since (tests/evidence2-b07.test.ts, tests/evidence-g21-school
 *   .test.ts); the leave's own path (`kept()` in systems/leave.ts) wasn't. Here an invitation brought at nine on
 *   20 January 2027 is open when a personal leave asked eight days before begins at ten, keeps its lapse at seven the
 *   next morning, and lapses then. “That evening has passed.” is a guard: this file said until 2026-10-15 that a save
 *   made before 2026-10-12 reached it, its moments waiting until ten the next evening, which was wrong (`answerHours` has
 *   been 22 since 2026-10-07; the saves under tests/fixtures lapse at seven, tests/scope-school.test.ts). The answer's
 *   hour is moved by hand here (TEST SETUP) to reach it, and said so.
 * - `school.take_shift`: Yale's cap of 19 hours a week in term at booking was evidenced only by shifts scheduled by hand
 *   and a message (tests/work-limits.test.ts). Here the button is pressed until the fourteen days hold no evening under
 *   the cap: a week with an assigned Saturday takes three evenings (6 + 12 = 18), one without takes four (16), the
 *   free evenings after them are passed by, and the refusal books nothing.
 * - the standing and term evaluation: the “behind” verdict was supported only by raw growth at twice the player's,
 *   which the rule (`termGrowth`) doesn't read. Here the pace is worked from the rule, growth over the room it had,
 *   (1 − start ⁄ reach)^1.5 and never under 0.02, against half the class's median; and two falls part it from raw
 *   points: begun at nine tenths of the reach, a fifth of the class's raw growth is ahead of the class; begun at four
 *   tenths in a class driven at 4, past half the class's raw growth is behind it.
 * - `school.request_conversion` and `school.pay_balance`: until 2026-10-14 no life made on the creation screen had need,
 *   and every accepted conversion and every balance a leave returns was reached by a family set by hand (`ON_AID` in
 *   tests/evidence-g26-school.test.ts and tests/evidence2-b09.test.ts). The family select now gives that same config
 *   for Scraping, and the same seeds open the same saves to the byte, so those tests play lives the screen makes. Played
 *   here on a screen-made life: a nonresident's two grants, January's for a Saturday called in sick and May's for hours
 *   never assigned, each with 14% withheld, on the year's earnings and on the 1040-NR filed; a leave calling a request
 *   off; and a balance a leave returns, refused, paid in part, held at its due date with the late fee, and settled on
 *   the drawn panel.
 *
 * Every figure is worked here from the rule's own numbers and written as a literal: $23.00 an hour, 14% withheld from
 * a nonresident's scholarship, $15,200.50 a term of living-expense scholarship of which the US taxes all but the
 * books' half, $1,186.50, so $14,014.00; Yale's 150 assigned hours a year in six-hour Saturdays; the rebate schedule's
 * whole share up to a tenth of the term's classes; a $125.00 late fee; five of Yale's working days to a leave's decision.
 *
 * PLAYER JOURNEYS: new lives made as the screen makes them (`createSave` with `newLifeConfig`, the family chosen on the
 * select's own change, as tests/need-paths.test.ts makes them), Ada Cole, born in New York unless a test says London,
 * at Yale in New Haven from Monday 24 August 2026, played by the clock. The seeds are arbitrary, none picked for what it
 * draws: e3-r1, e3-s1, e3-t1, e3-c1; and g26-*, b09-c0, the earlier files' own, to compare.
 *
 * TEST SETUP, said again where it's done:
 * - the coursework prepared each midnight and the student rested, fed and awake each time the clock moves, as
 *   tests/need-paths.test.ts plays one;
 * - the flu on the day a Saturday is called in sick, and for four days before a medical leave, as illness comes by the draw;
 * - a student begun at a share of each skill's reach, the term's starting craft with it, and a class driven at 4;
 * - an invitation's answer due at ten the next evening, which no save holds (a guard, reached by TEST SETUP).
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDateTime, instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeConfig, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { PREP_DIMS } from '@/engine/content/coursework';
import { courseworkOf, trustOf } from '@/engine/systems/coursework';
import { CONVERT_KIND, SHIFT_KIND, hasNeed } from '@/engine/systems/school';
import { MOMENT_KIND, STUDY_KIND, momentsOf } from '@/engine/systems/classmates';
import { ACCOUNT_DUE_KIND, accountOwed } from '@/engine/systems/leave';
import { healthOf } from '@/engine/systems/health';
import { earningsOf } from '@/engine/systems/earnings';
import { returnsOf } from '@/engine/systems/taxreturn';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  /** What the screen asked its given states to become: each setter's argument, a value or an updater, in order. */
  sets: [] as unknown[],
  /** The controls drawn: each select and input, with its props, so its own handler can be pressed. */
  els: [] as { type: string; props: Record<string, unknown> }[],
  /** The Gated buttons drawn, each with its feature, words, state and onClick. */
  clicks: [] as { feature: string; label: string; title?: string; disabled: boolean; onClick?: () => void }[],
  toasts: [] as string[],
  tabs: {} as Record<string, string>,
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    if (h.states.length === 0) return [value, set];
    const v = h.states.shift();
    if (v === h.keep) return [value, set];
    return [v, (next: unknown) => { h.sets.push(next); }];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

const keepControls = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (props && (type === 'select' || type === 'input')) h.els.push({ type: type as string, props });
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

// The screens' kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

// A Gated button drawn as it is, its feature, words, title, state and onClick kept so a test can press it as the player would.
vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  const words = (c: unknown): string => (Array.isArray(c) ? c.map(words).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : '');
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.clicks.push({ feature: props.feature, label: words(props.children), title: props.title, disabled: Boolean(props.disabled), onClick: props.onClick as never });
      return ce(real.Gated, props);
    },
  };
});

const { CharacterCreation } = await import('@/ui/creation/CharacterCreation');
const { YaleAccountPanel, WorkLimitsBlock } = await import('@/ui/components/StudyPlanPanels');
const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');

// ---------------------------------------------------------------------------
// The screens, the lives and the clock
// ---------------------------------------------------------------------------

const ZONE = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const STEP = { Background: 2, StartingPoint: 3, Review: 4 } as const;
/** Ada Cole's answers, as the screen sends them: a new life at Yale, born in New York unless a test says otherwise. */
const answers = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });

/**
 * A creation step as the player has it. TEST SETUP: CharacterCreation's states in render order, the step and the
 * config, and the two it keeps (whether a draft was restored, and the tick a country's arrival gives).
 */
function creation(step: number, config: NewSaveConfig) {
  h.states = [step, config, h.keep, h.keep];
  h.sets = [];
  h.els = [];
  const html = renderToStaticMarkup(createElement(CharacterCreation, { slot: 1 as never, onCancel: () => undefined, onStart: () => undefined }));
  expect(h.states, 'every state given was taken').toHaveLength(0);
  const els = [...h.els];
  const control = (id: string) => { const c = els.find((e) => e.props.id === id); expect(c, `#${id} on the step`).toBeDefined(); return c!; };
  return {
    html,
    text: onScreen(html),
    control,
    /** The select's own change, as the player makes it: the config the screen set from it. */
    choose: (id: string, value: string): NewSaveConfig => {
      h.sets = [];
      (control(id).props.onChange as (e: unknown) => void)({ target: { value } });
      expect(h.sets.length, 'the change set the config').toBeGreaterThan(0);
      return h.sets.reduce<NewSaveConfig>((c, s) => (typeof s === 'function' ? (s as (c: NewSaveConfig) => NewSaveConfig)(c) : s as NewSaveConfig), config);
    },
  };
}
/** The config a family chosen on Genres & Background gives, by the select's own change. */
const chosen = (family: StartingWealth, extra: Partial<NewSaveConfig> = {}): NewSaveConfig => creation(STEP.Background, answers(extra)).choose('family', family);

/** TEST SETUP: the work done each midnight, every open piece's every part prepared. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
const life = (seed: string, config: NewSaveConfig) => working(createSave(1, seed, config));
const freeze = (sim: Simulation): string => JSON.stringify(sim.universe);
const thaw = (snap: string): Simulation => working(loadSave(JSON.parse(snap) as never));
function once<T>(play: () => T): () => T {
  let done: { value: T } | undefined;
  return () => (done ??= { value: play() }).value;
}
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tend = (sim: Simulation, until: Instant) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);
const memos = (sim: Simulation, memo: RegExp) => sim.universe.transactions.filter((t) => memo.test(t.memo));
/** What a transaction moved into one account (negative out of it). */
const into = (t: { postings: { accountId: string; amount: number }[] }, accountId: string) => t.postings.filter((p) => p.accountId === accountId).reduce((s, p) => s + p.amount, 0);
const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;

/** A screen as the player has it: its markup and words; the Gated buttons it drew are in `h.clicks`. */
function drawn(sim: Simulation, screen: FunctionComponent, tabs: Record<string, string> = {}): { html: string; text: string } {
  h.sim = sim;
  h.clicks = [];
  h.states = [];
  h.tabs = tabs;
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: onScreen(html) };
}
const drew = (feature: string) => h.clicks.filter((c) => c.feature === feature);
/** A Gated button pressed by its own onClick: what it toasted. */
function press(feature: string): string[] {
  const b = drew(feature)[0];
  expect(b, `a ${feature} button`).toBeDefined();
  h.toasts = [];
  b!.onClick!();
  return h.toasts;
}
/** A Stat tile's figure and its note, by its label. */
const stat = (html: string, label: string) => {
  const m = html.match(new RegExp(`<span class="stat-label">${label}</span><span class="stat-value[^"]*">([^<]*)</span>(?:<span class="stat-note">([^<]*)</span>)?`));
  return m ? { value: m[1], note: m[2] } : undefined;
};

// ---------------------------------------------------------------------------
// school.respond
// ---------------------------------------------------------------------------

/** e3-r1, a Scraping family's student, on Tuesday 12 January 2027 at ten, the spring's second day of classes. */
const jan12 = once(() => { const sim = life('e3-r1', chosen('scraping')); tend(sim, at(2027, 1, 12, 10)); return freeze(sim); });

/**
 * The Evaluations table's Coursework cell, from the review's own count, as `SchoolWorkspace` draws it. The table gained the
 * column on 2026-10-16 (the school area: the review's count was written and read by nothing), and until later that day the
 * row asserted here ran from the class's growth straight to the review's words.
 */
const courseworkCell = (r: { coursework?: { shown: number; unready: number } }) => (r.coursework ? `${r.coursework.unready} of ${r.coursework.shown} unready or not shown` : 'None counted');

describe('school.respond', () => {

  it('PLAYER JOURNEY: an invitation open when a personal leave begins keeps its lapse at seven the next morning, and lapses then, costing the trust 1 an invitation left hanging costs, its answers refused, where everything else of the school’s is called off', () => {
    const sim = thaw(jan12());
    const twin = thaw(jan12());
    // Five of Yale's working days from Tuesday the 12th at ten: the 13th, 14th, 15th, 19th and 20th, Martin Luther King
    // Day (Monday the 18th) closed.
    const asked = sim.must<{ decideAt: Instant; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    expect(asked).toMatchObject({ decideAt: at(2027, 1, 20, 10), startsNow: true });
    tend(sim, at(2027, 1, 20, 10, 1));
    tend(twin, at(2027, 1, 20, 10, 1));
    expect(sim.player.school!.leave!.status).toBe('on');
    // The class at nine that morning brought an invitation, as it did to the twin who asked for nothing: the leave didn't
    // make it. Due 22 hours after the class, at seven the next morning.
    const opened = (s: Simulation) => momentsOf(courseworkOf(s, s.player)!).filter((m) => m.at === at(2027, 1, 20, 9));
    expect(opened(twin).map((m) => [m.kind, m.status, m.until])).toEqual([['study', 'open', at(2027, 1, 21, 7)]]);
    const [m] = opened(sim);
    expect([m!.kind, m!.mate, m!.status, m!.until]).toEqual(['study', opened(twin)[0]!.mate, 'open', at(2027, 1, 21, 7)]);
    // The leave called off the school's calendar, the assigned Saturdays with it, and kept the moment's lapse at its hour.
    expect(pendingOf(sim, SHIFT_KIND)).toHaveLength(0);
    expect(pendingOf(twin, SHIFT_KIND).length).toBeGreaterThan(0);
    expect(pendingOf(sim, MOMENT_KIND).map((i) => [i.at, i.payload.momentId])).toEqual([[at(2027, 1, 21, 7), m!.id]]);
    const mate = sim.player.school!.classmates[m!.mate]!;
    const trust = trustOf(mate);
    tend(sim, at(2027, 1, 21, 7, 1));
    const after = momentsOf(courseworkOf(sim, sim.player)!).find((x) => x.id === m!.id)!;
    expect(after.status).toBe('lapsed');
    // An invitation left unanswered costs the trust 1 (`CLASS.study.unanswered`), and nothing of the bond.
    expect(trustOf(sim.player.school!.classmates[m!.mate]!)).toBe(trust - 1);
    for (const choice of ['yes', 'no']) expect(sim.execute({ kind: 'school.respond', payload: { momentId: m!.id, choice } }).error).toBe('It’s too late to answer: the moment passed.');
    expect(pendingOf(sim, STUDY_KIND)).toHaveLength(0);
  }, 60_000);

  it('GUARD: “That evening has passed.”, reached only by moving an invitation’s answer to ten the next evening by hand, which no save holds: Say Yes after seven is refused so, Say No taken; the same save untouched lapsed at seven that morning', () => {
    // e3-r1 on Monday 31 August 2026 at ten: the class at nine brought an invitation for Tuesday at seven.
    const made = (() => { const sim = life('e3-r1', chosen('scraping')); tend(sim, at(2026, 8, 31, 10)); return freeze(sim); })();
    const now = thaw(made);
    const [m] = momentsOf(courseworkOf(now, now.player)!).filter((x) => x.status === 'open');
    expect([m!.kind, m!.at, m!.until, m!.when]).toEqual(['study', at(2026, 8, 31, 9), at(2026, 9, 1, 7), at(2026, 9, 1, 19)]);
    // TEST SETUP: the answer moved by hand to ten the next evening, its lapse with it (no save of any build holds it so).
    const old = JSON.parse(made) as { playerId: string; people: Record<string, { school: { coursework: { moments: { id: string; until: number }[] } } }>; scheduled: { kind: string; at: number; payload: Record<string, unknown> }[] };
    old.people[old.playerId]!.school.coursework.moments.find((x) => x.id === m!.id)!.until = at(2026, 9, 1, 22);
    old.scheduled.find((i) => i.kind === MOMENT_KIND && i.payload.momentId === m!.id)!.at = at(2026, 9, 1, 22);
    const before = thaw(JSON.stringify(old));
    for (const s of [before, now]) tend(s, at(2026, 9, 1, 19, 30));
    expect(before.execute({ kind: 'school.respond', payload: { momentId: m!.id, choice: 'yes' } }).error).toBe('That evening has passed.');
    expect(pendingOf(before, STUDY_KIND)).toHaveLength(0);
    before.must({ kind: 'school.respond', payload: { momentId: m!.id, choice: 'no' } });
    expect(momentsOf(courseworkOf(before, before.player)!).find((x) => x.id === m!.id)!.status).toBe('answered');
    expect(now.execute({ kind: 'school.respond', payload: { momentId: m!.id, choice: 'yes' } }).error).toBe('It’s too late to answer: the moment passed.');
  }, 60_000);
});

// ---------------------------------------------------------------------------
// school.take_shift
// ---------------------------------------------------------------------------

describe('school.take_shift', () => {
  it('PLAYER JOURNEY: Take An Elective Shift pressed nine times on the Work-Study tab books eight evenings, skips the free evenings a week’s 19 hours leave no room for, and the ninth is refused for the cap with nothing booked; all eight worked, none over it', () => {
    const sim = life('e3-s1', chosen('scraping'));
    tend(sim, at(2026, 9, 14, 8));
    const electives = () => sim.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && i.payload.personId === sim.player.id && i.payload.elective === true).sort((a, b) => a.at - b.at);
    const tab = { 'tab:/workspace/school': 'work' };
    const toasts: string[] = [];
    for (let n = 0; n < 8; n += 1) {
      drawn(sim, SchoolWorkspace, tab);
      toasts.push(...press('school.take_shift'));
    }
    const evenings = [at(2026, 9, 15, 19), at(2026, 9, 16, 19), at(2026, 9, 17, 19), at(2026, 9, 21, 19), at(2026, 9, 22, 19), at(2026, 9, 23, 19), at(2026, 9, 24, 19), at(2026, 9, 28, 19)];
    expect(toasts).toEqual(evenings.map((e) => `Front of house, ${formatDateTime(e, ZONE)}.`));
    expect(electives().map((i) => [i.at, i.payload.hours])).toEqual(evenings.map((e) => [e, 4]));
    // Each week's hours, Monday to Sunday, summed here from what's on the calendar: the week of the 14th has its assigned
    // Saturday, the 19th at ten, six hours, and three evenings, 6 + 3 × 4 = 18; a fourth would be 22, past 19. The week of
    // the 21st has no assigned Saturday: four evenings, 16; a fifth would be 20, past 19.
    const week = (monday: Instant) => sim.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && i.payload.personId === sim.player.id && i.status === 'pending' && i.at >= monday && i.at < monday + 7 * MS_DAY).map((i) => [i.at, Number(i.payload.hours)]);
    expect(week(at(2026, 9, 14, 0))).toEqual([[at(2026, 9, 15, 19), 4], [at(2026, 9, 16, 19), 4], [at(2026, 9, 17, 19), 4], [at(2026, 9, 19, 10), 6]]);
    expect(week(at(2026, 9, 21, 0)).map(([, h]) => h)).toEqual([4, 4, 4, 4]);
    // The evenings left: Friday to Sunday of each week had nothing on the calendar that wants the player from seven to
    // eleven, and are in the term's classes; the cap is what passed them by.
    for (const d of [18, 19, 20, 25, 26, 27]) expect(sim.timeline.conflicts(at(2026, 9, d, 19), 240).filter((x) => x.requiresPlayer), `the ${d}th`).toEqual([]);
    expect(sim.player.school!.workStudy.electiveHours).toBe(32);
    expect(drawn(sim, SchoolWorkspace, tab).text).toContain('Elective Hours Asked For 32');
    // The ninth: every evening of the next fourteen days is booked or past the week's cap.
    expect(press('school.take_shift')).toEqual([]);
    expect(sim.execute({ kind: 'school.take_shift', payload: {} }).error).toBe('No free evening in the next two weeks within Yale’s cap of 19 hours a week in term, across all your Yale jobs.');
    expect(electives()).toHaveLength(8);
    expect(sim.player.school!.workStudy.electiveHours).toBe(32);
    // Worked as booked: each evening done, and none called off at the door for the cap.
    tend(sim, at(2026, 9, 29, 8));
    expect(electives().map((i) => i.status)).toEqual(Array(8).fill('done'));
    expect(titled(sim, 'A Shift Over The Weekly Cap')).toHaveLength(0);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// standing/term evaluation
// ---------------------------------------------------------------------------

/** The rule's own pace, worked here: growth over the room it had, (1 − start ⁄ reach)^1.5, never under 0.02. */
const room = (start: number, reach: number) => Math.max(0.02, Math.max(0, 1 - start / reach) ** 1.5);
const mean = (c: Record<string, number>) => Object.values(c).reduce((s, x) => s + x, 0) / Object.values(c).length;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
/** The fall's figures as the faculty weighed them: the player's raw growth and paced growth, and the class's medians of each. */
function paces(sim: Simulation) {
  const school = sim.player.school!;
  const t = school.tally;
  const start = mean(t.craftAtStart as never);
  const growth = mean(sim.player.craft as never) - start;
  const classRaw = median(school.classmates.map((m, i) => mean(m.craft as never) - t.classAtStart[i]!));
  const paced = growth / room(start, mean(sim.player.craftCeiling as never));
  const classPace = median(school.classmates.map((m, i) => (mean(m.craft as never) - t.classAtStart[i]!) / room(t.classAtStart[i]!, mean(m.ceiling as never))));
  return { start, reach: mean(sim.player.craftCeiling as never), growth, classRaw, paced, classPace };
}
/** TEST SETUP: the student begins the fall at a share of each skill's reach, the term's starting craft with it. */
function startAt(sim: Simulation, share: number): Simulation {
  const craft = sim.player.craft as unknown as Record<string, number>;
  const reach = sim.player.craftCeiling as unknown as Record<string, number>;
  for (const k of Object.keys(craft)) craft[k] = Math.round(share * reach[k]! * 10) / 10;
  sim.player.school!.tally.craftAtStart = { ...sim.player.craft! };
  return sim;
}
/** Three falls from one new life (e3-t1), each played by the clock to the evaluation of 11 December and past it. */
const falls = once(() => {
  const plain = life('e3-t1', chosen('scraping'));
  const near = startAt(life('e3-t1', chosen('scraping')), 0.9);
  const far = startAt(life('e3-t1', chosen('scraping')), 0.4);
  // TEST SETUP: the far one's classmates at drive 4 (a classmate's runs 0.75 to 1.25), as tests/evidence2-b08.test.ts
  // drives a class at 3.
  for (const m of far.player.school!.classmates) m.drive = 4;
  for (const s of [plain, near, far]) tend(s, at(2026, 12, 12, 12));
  return { plain: freeze(plain), near: freeze(near), far: freeze(far) };
});

describe('standing/term evaluation', () => {
  it('PLAYER JOURNEY: a student who began the fall at nine tenths of their reach grows a fifth of the class’s raw points, under the half a raw rule would ask, and is weighed ahead of the class for the room they had, in good standing, on the Standing tab', () => {
    const near = thaw(falls().near);
    const plain = thaw(falls().plain);
    const [review, ...more] = near.player.school!.history;
    expect(more).toEqual([]);
    const p = paces(near);
    expect(p.start / p.reach).toBeCloseTo(0.9, 2);
    // The record's figures are the ones worked here.
    expect(review!.growth).toBeCloseTo(p.growth, 9);
    expect(review!.classGrowth).toBeCloseTo(p.classRaw, 9);
    // Raw points: under half the class's. For the room: past 1.1 times the class's pace, so ahead.
    expect(p.growth).toBeLessThan(0.5 * p.classRaw);
    expect(p.paced).toBeGreaterThanOrEqual(1.1 * p.classPace);
    expect(review).toMatchObject({ term: 0, attendance: 1, standing: 'good' });
    expect(review!.reason.startsWith(`You were at 100% of what was asked of you, and your craft grew ${p.growth.toFixed(1)} against the class’s ${p.classRaw.toFixed(1)}: for the room each of you had to grow, ahead of the class.`)).toBe(true);
    expect(near.player.school!.standing).toBe('good');
    expect(drawn(near, SchoolWorkspace, { 'tab:/workspace/school': 'standing' }).text).toContain(`Fall Term 2026 Good Standing 100% ${p.growth.toFixed(1)} ${p.classRaw.toFixed(1)} ${courseworkCell(review!)} ${review!.reason}`);
    // The twin as played began two thirds of the way and grew past half the class's raw points: the same fall otherwise.
    const q = paces(plain);
    expect(q.growth).toBeGreaterThan(0.5 * q.classRaw);
    expect(plain.player.school!.history[0]!.standing).toBe('good');
  }, 60_000);

  it('PLAYER JOURNEY: a student who began at four tenths of their reach, in a class driven at 4, grows past half the class’s raw points, where a raw rule asks no more, and is weighed behind it for the room each had: a concern for the pace alone, in its words, on the Standing tab', () => {
    const far = thaw(falls().far);
    const [review] = far.player.school!.history;
    const p = paces(far);
    expect(p.start / p.reach).toBeCloseTo(0.4, 2);
    expect(review!.growth).toBeCloseTo(p.growth, 9);
    expect(review!.classGrowth).toBeCloseTo(p.classRaw, 9);
    // Raw points: past half the class's median, where a raw rule would find nothing short. For the room: under half the
    // class's pace, so behind.
    expect(p.growth).toBeGreaterThan(0.5 * p.classRaw);
    expect(p.paced).toBeLessThan(0.5 * p.classPace);
    // Nothing else short: every class attended, under half the pieces unready, no course failed, no run, no breach.
    expect(review).toMatchObject({ term: 0, attendance: 1, standing: 'concern' });
    expect(review!.coursework!.unready * 2).toBeLessThan(review!.coursework!.shown);
    expect(Object.values(far.player.school!.courses ?? {}).filter((r) => r.result === 'fail')).toEqual([]);
    expect(review!.work).toBeUndefined();
    expect(review!.reason).toMatch(new RegExp(`^You were at 100% of what was asked of you, and your craft grew ${p.growth.toFixed(1)} against the class’s ${p.classRaw.toFixed(1)}: for the room each of you had to grow, behind the class\\.( The faculty noted your coursework: \\d+ of \\d+ pieces strong or better\\.)?$`));
    expect(far.player.school!.standing).toBe('concern');
    expect(drawn(far, SchoolWorkspace, { 'tab:/workspace/school': 'standing' }).text).toContain(`Fall Term 2026 Academic Concern 100% ${p.growth.toFixed(1)} ${p.classRaw.toFixed(1)} ${courseworkCell(review!)} ${review!.reason}`);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// school.request_conversion and school.pay_balance: the Scraping family, chosen on the screen
// ---------------------------------------------------------------------------

const LONDON = { homeRegionId: 'uk-eng-london' };
/** What tests/evidence-g26-school.test.ts and tests/evidence2-b09.test.ts built their lives with, `ON_AID` set by hand. */
const byHand = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra, family: undefined, wealth: 'scraping' });

describe('a need set by hand is the Scraping family chosen on the screen (school.request_conversion, school.pay_balance)', () => {
  it('the config the family select gives for Scraping is the one the earlier evidence set by hand, and each of their seeds opens the same save from either, to the byte', () => {
    expect(chosen('scraping')).toEqual(byHand());
    expect(chosen('scraping', LONDON)).toEqual(byHand(LONDON));
    for (const [seed, extra] of [['g26-paid', {}], ['g26-c0', {}], ['g26-c1', {}], ['g26-c2', LONDON], ['g26-c3', {}], ['b09-c0', {}]] as const) {
      expect(JSON.stringify(createSave(1, seed, chosen('scraping', extra)).universe), seed).toBe(JSON.stringify(createSave(1, seed, byHand(extra)).universe));
    }
  });
});

/** Yale's work-study rate for 2026–27, $23.00 an hour; a nonresident alien's scholarship withheld at 14%. */
const RATE = 23_00;
const grantsOf = (sim: Simulation) => memos(sim, /^Grant-in-aid: /);
const nominalId = (sim: Simulation, kind: 'income' | 'expense', name: string) => sim.nominalAccount(kind, name).id;
/** TEST SETUP: down with the flu for so many days, which lets Call In Sick through and a physician recommend a leave. */
const flu = (sim: Simulation, days = 1) => { healthOf(sim.player).fluUntil = sim.now + days * MS_DAY; };

/**
 * Ada Cole born in London, her family Scraping on the screen; her first assigned Saturday, 5 September 2026 at ten, called
 * in sick (TEST SETUP: the flu) and asked for on the drawn button; kept there, at 15 January 2027 past noon, and at
 * 3 May 2027 at noon.
 */
const london = once(() => {
  const sim = life('e3-c1', chosen('scraping', LONDON));
  expect(hasNeed(sim.player)).toBe(true);
  tend(sim, at(2026, 9, 1, 8));
  const sat = pendingOf(sim, SHIFT_KIND).filter((i) => i.payload.elective === false)[0]!;
  expect([sat.at, Number(sat.payload.hours)]).toEqual([at(2026, 9, 5, 10), 6]);
  tend(sim, sat.at - 2 * MS_HOUR);
  flu(sim);
  sim.must({ kind: 'school.call_in_sick', payload: {} });
  tend(sim, sat.at + MS_HOUR);
  expect(sim.player.school!.excusedHours).toEqual({ 0: 6 });
  const unasked = freeze(sim);
  const panel = drawn(sim, WorkLimitsBlock);
  expect(stat(panel.html, 'Convertible To Grant Aid')).toEqual({ value: '6 hours', note: '$138.00 at the rate; 0 converted' });
  expect(press('school.request_conversion')).toEqual(['Asked: processed January 15, 2027.']);
  const asked = freeze(sim);
  tend(sim, at(2027, 1, 15, 11));
  const jan15before = { bank: checking(sim).balance, withheld: earningsOf(sim.player).years[2027]!.withheld };
  tend(sim, at(2027, 1, 15, 13));
  const jan15 = freeze(sim);
  tend(sim, at(2027, 5, 3, 12));
  return { unasked, asked, jan15before, jan15, may3: freeze(sim) };
});

describe('school.request_conversion, for a nonresident the screen made with need', () => {
  it('PLAYER JOURNEY: January’s processing pays the Saturday called in sick, $138.00 with 14% withheld: $118.68 to the bank and $19.32 to the tax withheld, in the notice’s words', () => {
    const sim = thaw(london().jan15);
    const { jan15before } = london();
    // Six hours at $23.00 is $138.00; 14% of it, $19.32; the rest, $118.68.
    expect(grantsOf(sim).map((t) => [t.at, into(t, checking(sim).id), into(t, nominalId(sim, 'income', 'Scholarship')), into(t, nominalId(sim, 'expense', 'Tax Withheld'))])).toEqual([[at(2027, 1, 15, 12), 118_68, -138_00, 19_32]]);
    expect(checking(sim).balance - jan15before.bank).toBe(118_68);
    expect(earningsOf(sim.player).years[2027]!.withheld - jan15before.withheld).toBe(19_32);
    expect(sim.player.school!.convertedHours).toEqual({ 0: 6 });
    expect(titled(sim, 'Hours Converted To Grant Aid').map((n) => n.body)).toEqual(['6 work-study hours you couldn’t work became $138.00 of grant aid, paid into your Chase Total Checking, $19.32 withheld for tax. It’s a scholarship for living costs, which the US taxes.']);
  }, 60_000);

  it('PLAYER JOURNEY: in May the six hours never assigned, asked on the drawn button, are paid at May’s processing with 14% withheld again; the year’s scholarship is the spring’s $14,014.00 and both grants, $14,290.00, and its withholding $2,000.60', () => {
    let sim = thaw(london().may3);
    // Twenty-four assigned Saturdays of six hours booked, the one called in sick among them: 144 of the year's 150.
    expect(sim.player.school!.workStudy.assignedBooked).toBe(144);
    // Six excused and six never assigned, less the six converted in January: six.
    expect(stat(drawn(sim, WorkLimitsBlock).html, 'Convertible To Grant Aid')).toEqual({ value: '6 hours', note: '$138.00 at the rate; 6 converted' });
    expect(press('school.request_conversion')).toEqual(['Asked: processed May 15, 2027.']);
    expect(pendingOf(sim, CONVERT_KIND).map((i) => i.at)).toEqual([at(2027, 5, 15, 12)]);
    sim = thaw(freeze(sim));
    tend(sim, at(2027, 5, 15, 13));
    expect(grantsOf(sim).map((t) => [t.at, into(t, checking(sim).id), into(t, nominalId(sim, 'expense', 'Tax Withheld'))])).toEqual([[at(2027, 1, 15, 12), 118_68, 19_32], [at(2027, 5, 15, 12), 118_68, 19_32]]);
    expect(sim.player.school!.convertedHours).toEqual({ 0: 12 });
    // The notice in the same words, brought up to May's, once.
    expect(titled(sim, 'Hours Converted To Grant Aid').map((n) => n.at)).toEqual([at(2027, 5, 15, 12)]);
    // The spring's living-expense scholarship, $15,200.50 less the books' half the US doesn't tax, $1,186.50, is $14,014.00,
    // with 14% withheld, $1,961.96; and the two grants, $138.00 each, $19.32 withheld from each.
    expect(earningsOf(sim.player).years[2027]).toMatchObject({ scholarship: 14_290_00, withheld: 2_000_60 });
  }, 60_000);

  it('PLAYER JOURNEY: the 2027 return, filed in February 2028 on the 1040-NR, carries the two grants: $276.00 more scholarship and income and $38.64 more withheld than the twin who never asked', () => {
    const sim = thaw(london().may3);
    drawn(sim, WorkLimitsBlock);
    press('school.request_conversion');
    const twin = thaw(london().unasked);
    for (const s of [sim, twin]) {
      tend(s, at(2028, 2, 15, 12));
      s.must({ kind: 'tax.file', payload: { year: 2027 } });
    }
    expect(grantsOf(twin)).toHaveLength(0);
    const mine = returnsOf(sim.player)['2027']!.figures!;
    const theirs = returnsOf(twin.player)['2027']!.figures!;
    expect([mine.form, theirs.form]).toEqual(['1040-NR', '1040-NR']);
    expect((mine.scholarship ?? 0) - (theirs.scholarship ?? 0)).toBe(2 * 6 * RATE);
    expect(mine.income - theirs.income).toBe(2 * 6 * RATE);
    expect(mine.withheld - theirs.withheld).toBe(2 * 19_32);
  }, 60_000);

  it('PLAYER JOURNEY: a medical leave begun with the request in calls it off: refused on leave in its words, and nothing paid on 15 January', () => {
    const sim = thaw(london().asked);
    expect(pendingOf(sim, CONVERT_KIND)).toHaveLength(1);
    flu(sim, 4);
    const leave = sim.must<{ decideAt: Instant; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    expect(leave.startsNow).toBe(true);
    tend(sim, leave.decideAt + MS_HOUR);
    expect(sim.player.school!.leave!.status).toBe('on');
    expect(pendingOf(sim, CONVERT_KIND)).toHaveLength(0);
    expect(sim.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe('Not while on leave: a student on leave has no aid.');
    tend(sim, at(2027, 1, 15, 13));
    expect(grantsOf(sim)).toHaveLength(0);
    expect(sim.player.school!.convertedHours).toBeUndefined();
  }, 60_000);
});

// ---------------------------------------------------------------------------
// school.pay_balance
// ---------------------------------------------------------------------------

describe('school.pay_balance, for a balance a family chosen on the screen leaves', () => {
  it('PLAYER JOURNEY: the leave of 20 January returns the whole spring’s scholarship, $15,200.50; refused for nothing and for more, $100.00 paid by command, the rest left to its due date brings the hold and $125.00, and Pay From Your Bank, drawn and pressed, settles it and lifts the hold', () => {
    const sim = thaw(jan12());
    const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    tend(sim, asked.decideAt + MS_HOUR);
    // $15,200.50 a term, all of it returned on the rebate schedule: the spring's classes run from 11 January to 23 April
    // at eleven at night, and a tenth of that has passed only at about seven on the morning of the 21st.
    expect(sim.player.school!.leave!.aidReturned).toBe(15_200_50);
    expect(accountOwed(sim, sim.player)).toBe(15_200_50);
    expect(sim.execute({ kind: 'school.pay_balance', payload: { amount: 0 } }).error).toBe('Pay something.');
    expect(sim.execute({ kind: 'school.pay_balance', payload: { amount: 15_200_51 } }).error).toBe('$15,200.50 is owed; pay that or less.');
    const bank = checking(sim).balance;
    expect(sim.must({ kind: 'school.pay_balance', payload: { amount: 100_00 } })).toEqual({ owed: 15_100_50, held: false });
    expect(checking(sim).balance).toBe(bank - 100_00);
    const due = pendingOf(sim, ACCOUNT_DUE_KIND);
    expect(due).toHaveLength(1);
    tend(sim, due[0]!.at + MS_HOUR);
    expect(sim.player.school!.hold).toBeDefined();
    expect(accountOwed(sim, sim.player)).toBe(15_100_50 + 125_00);
    const panel = drawn(sim, YaleAccountPanel);
    expect(stat(panel.html, 'Owed On Your Yale Account')?.value).toBe('$15,225.50');
    const before = checking(sim).balance;
    expect(press('school.pay_balance')).toEqual(['Paid in full.']);
    expect(accountOwed(sim, sim.player)).toBe(0);
    expect(checking(sim).balance).toBe(before - 15_225_50);
    expect(sim.player.school!.hold).toBeUndefined();
    expect(titled(sim, 'The Financial Hold Is Lifted')).toHaveLength(1);
    expect(sim.execute({ kind: 'school.pay_balance', payload: {} }).error).toBe('Your Yale account owes no balance.');
  }, 60_000);
});
