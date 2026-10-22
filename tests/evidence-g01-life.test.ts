/**
 * Evidence for seven life rows the review of 2026-10-13 left partial (verification group g01-life): Sleep, the five
 * things on Look After Yourself, and a plan of your own on the calendar. Each row's gaps are closed here through the
 * command its screen sends and the clock, and each consequence is read where the row says it's read, against figures
 * worked out from the rule's own numbers or its published source, never from the helper the engine computes them with.
 *
 * - `life.sleep`: a plan of your own slept through is missed quietly (the PLAN_KIND handler's asleep branch) and the
 *   night says so once, "You Slept Through 1 Commitment", and in the plural for two; a sleep inside a kept plan is
 *   refused in `occupiedAt`'s words; a start that isn't a number is refused "Say when to sleep."; the hours are held to
 *   half an hour and sixteen; the first classes read what a night chosen through Sleep left (`focusOf`), against the
 *   night the clock gives a player who chooses none. The Sleep dialog is rendered over the plan and its button pressed.
 * - `life.look_after` eat: the hunger a skipped meal costs (`applyElapsedWellbeing`'s hungry hours) is spared, by
 *   0.5 condition and 0.7 morale an hour under twenty; the first classes read the meal (`focusOf`), Acting I building
 *   the scene craft by the readiness it gave; $5.00, paid once across a reload; refused from a hospital bed, and taken
 *   once out of it. And what the row didn't say, the design as it stands: a meal adds nothing to the body's day, and
 *   the day's groceries are bought at midnight whether or not a meal was.
 * - order: a restaurant's 134 kcal (USDA ERS) goes on the day and onto the scale at midnight, at Hall's pace; it costs
 *   LendingTree's 21/3.03 of the meal; its lift is a meal's; refused in `spendRefusal`'s words when nothing can pay.
 * - wash: hygiene to a hundred, stress down a tenth of what it washed off, the grimy hours spared, and the first
 *   classes reading it; refused from a hospital bed and at 95.
 * - exercise: an injury a workout's own roll brings, its notice, its bill where the plan leaves one, the next workout
 *   refused in `trainingRefusal`'s words till it mends; refused from a hospital bed and with the flu; and sixteen
 *   mornings' workouts read by the first scene shown in class, its consistency through Stamina.
 * - unwind: the stress it takes off is read by the night's quality (0.24 a hundred of stress), by readiness, by the
 *   flu's odds (`catching`, 1.8 at full stress) and by the first classes; refused from a hospital bed and inside a
 *   kept plan.
 * - `calendar.schedule`: the Calendar's form makes the plan, and after a reload the clock stops at it and its handler
 *   keeps it; inside it, sleep, a shower, unwinding and a workout are refused in `occupiedAt`'s words, and a meal is
 *   still taken.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actor at Yale in
 * New Haven, starting Monday 24 August 2026 at 7:30 AM. The class-day twins are played by the clock alone to the first
 * day of classes, Monday 31 August, with Registration and the orientation week kept as the clock keeps them; the
 * workout twins are played the same way to the first scene shown, Tuesday 8 September. Unwind's lives are made with
 * every personality axis at the middle, as the creation screen can set them, so their stressRecovery and sleepQuality
 * read 1 and the rule's own 10 and 0.24 are the figures. One LIFE FIXTURE: an injury's bill is shown on a New Haven life
 * outside the school (`quickSave`, scraping), since Yale Health pays the student's care in full and no bill is raised
 * for it. The screens are rendered as the player has them (react-dom/server) with `useGame`'s `run` as the save's own
 * `execute`; a pressed button is the component's own onClick, kept on its way through the JSX runtime.
 *
 * TEST SETUP, said again where it's done: the calendar cleared of what wants the player (so the school's Registration
 * doesn't clash); dials set before an action (nourishment, hygiene, stress, energy); a hospital stay and the flu put on
 * the record; balances set by a posting against a test equity line; a credit card locked by its own command. And on
 * the screens, which a static render can't click or drag: a dropdown or dialog's open state, the Sleep slider's hours
 * and the Calendar form's fields, set through the component's own useState in its render order.
 */
import { describe, expect, it, vi } from 'vitest';
import { replay } from '@/engine/systems/evaluation';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { PIECE } from '@/engine/content/piece';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Personality, Wellbeing } from '@/engine/domain/model';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, formatDate } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { catching, healthOf } from '@/engine/systems/health';
import { readiness, trainingAt } from '@/engine/systems/life';
import { chanceOver } from '@/engine/systems/injury';
import { personalityOf } from '@/engine/systems/personality';
import { INJURY } from '@/engine/content/injury';
import { PLAN_KIND } from '@/engine/world/plans';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  toasts: [] as string[],
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

// Without the original: it imports the looks, which import it back. Nothing is standing at a stop.
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

// ---------------------------------------------------------------------------
// Lives, and the screens over them
// ---------------------------------------------------------------------------

const MIDDLE: Personality = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 };
const student = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** An instant of Monday 24 August 2026 in New Haven, on Eastern Daylight Time (UTC−4): worked out here, not by the engine. */
const NH = (hour: number, minute = 0): number => Date.UTC(2026, 7, 24, hour + 4, minute);
/** And of Monday 31 August 2026, the first day of classes. */
const AUG31 = (hour: number, minute = 0): number => Date.UTC(2026, 7, 31, hour + 4, minute);

/** TEST SETUP: nothing on the calendar that wants the player, canceled by hand. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
/** TEST SETUP: an account's balance set, against a test equity line. */
function setBalance(sim: Simulation, accountId: string, to: number): void {
  const by = to - sim.universe.accounts[accountId]!.balance;
  if (by !== 0) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}
const lookAfter = (sim: Simulation, action: string) => sim.execute<{ doneAt: number }>({ kind: 'life.look_after', payload: { action } });
const sleep = (sim: Simulation, payload: Record<string, unknown>) => sim.execute<{ wokeAt: number; quality: number }>({ kind: 'life.sleep', payload });
const checking = (sim: Simulation) => sim.player.primaryAccountId!;
/** What each purchase by this memo took from the checking account, in cents. */
const paid = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).map((t) => -t.postings.find((p) => p.accountId === checking(sim))!.amount);
const notices = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const balances = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal).map((a) => a.balance);

/** What the player reads: the markup with every title attribute taken out, then every tag, and its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

/** The top bar, drawn as the player has it, with the open states given (TEST SETUP) in its components' render order. */
function bar(sim: Simulation, states: unknown[]): { text: string; buttons: typeof h.buttons } {
  h.sim = sim;
  h.buttons = [];
  h.toasts = [];
  h.states = [...states];
  const html = renderToStaticMarkup(createElement(TimeControls));
  expect(h.states).toHaveLength(0);
  return { text: onScreen(html), buttons: h.buttons };
}
/** Look After Yourself, opened (TEST SETUP: its dropdown, the bar's fourth state), each item with its words and its press. */
function lookAfterMenu(sim: Simulation): Map<string, { says: string; grayed: boolean; press: () => void }> {
  const { buttons } = bar(sim, [false, false, null, true]);
  const items = new Map<string, { says: string; grayed: boolean; press: () => void }>();
  for (const label of ['Eat A Meal', 'Order In', 'Shower', 'Work Out', 'Unwind']) {
    const b = buttons.find((x) => x.text.startsWith(label))!;
    expect(b, label).toBeDefined();
    items.set(label, { says: b.text, grayed: b.disabled === true, press: () => b.onClick!() });
  }
  return items;
}

/** A plan of your own, kept: Gym from 10:30 AM to 12:30 PM, made through the command, gone to, and half an hour in (11:00 AM). */
function atGym(seed: string, extra: Partial<NewSaveConfig> = {}): { sim: Simulation; id: string } {
  const sim = student(seed, extra);
  expect(sim.now).toBe(NH(7, 30));
  clearCalendar(sim); // TEST SETUP
  const { id } = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Gym', at: NH(10, 30), durationMinutes: 120 } });
  const stop = sim.advanceTo(NH(10, 30), { stopOnPlayerRequired: true });
  expect(stop.interruptedBy?.id).toBe(id);
  sim.advanceTo(NH(11), { stopOnPlayerRequired: true });
  expect(sim.timeline.get(id)!.status).toBe('done');
  expect(sim.now).toBe(NH(11));
  return { sim, id };
}
const AT_GYM = 'You’re at Gym until 12:30 PM.';

/**
 * Twins of one new life, played by the clock alone from the first morning to 7:30 AM on the first day of classes:
 * Registration and the orientation week kept as the clock keeps them, nothing cleared and no dial set.
 */
function firstClassMorning(seed: string, extra: Partial<NewSaveConfig> = {}, until = AUG31(7, 30)): [Simulation, Simulation] {
  const twins: [Simulation, Simulation] = [student(seed, extra), student(seed, extra)];
  for (const sim of twins) {
    sim.advanceTo(until);
    expect(sim.player.school!.registeredAt).toBeDefined();
  }
  return twins;
}

/**
 * Readiness from its seven dials, each a straight line between the ends the rule gives it (`readinessParts` in
 * life.ts: energy 0.45 to 1.15, stress 1.12 to 0.62, a debt of thirty hours 1.05 to 0.66, nourishment 0.78 to 1.05,
 * morale 0.82 to 1.12, hygiene 0.92 to 1.03, condition 0.7 to 1), held to them, their product over 1.35. Worked out
 * here, so the expectation isn't the engine's own reckoning.
 */
const READINESS_ENDS: readonly (readonly [keyof Wellbeing, number, number, number])[] = [
  ['energy', 100, 0.45, 1.15], ['stress', 100, 1.12, 0.62], ['sleepDebt', 30, 1.05, 0.66], ['nourishment', 100, 0.78, 1.05],
  ['morale', 100, 0.82, 1.12], ['hygiene', 100, 0.92, 1.03], ['condition', 100, 0.7, 1],
];
function readinessFrom(w: Wellbeing): number {
  const product = READINESS_ENDS.reduce((p, [k, top, lo, hi]) => p * (lo + (hi - lo) * Math.min(1, Math.max(0, ((w[k] as number | undefined) ?? 80) / top))), 1);
  return Math.min(100, Math.max(5, (100 * product) / 1.35));
}

/**
 * The nine o'clock classes, stopped at as the screen stops at them and the dials read there; then the clock holds
 * them. What the scene craft gained: Acting I (DRAM 103a/b) is the one course that day that grows it.
 */
function atClasses(sim: Simulation): { dials: Wellbeing; built: number } {
  const stop = sim.advanceTo(AUG31(9, 1), { stopOnPlayerRequired: true });
  expect(stop.interruptedBy?.kind).toBe('school.classes');
  expect(sim.now).toBe(AUG31(9));
  const dials = { ...sim.player.wellbeing };
  const before = sim.player.craft!.scene;
  sim.advanceTo(AUG31(9, 1));
  return { dials, built: sim.player.craft!.scene - before };
}

/**
 * What a class builds is linear in its focus, readiness over 80 held to 0.3 and 1.2 (`focusOf`), at the same hour's
 * fit for both: so the twin who did something builds more than the twin who didn't by their readiness's ratio, as the
 * rule's ends give it from the dials the class met. Both inside focus's bounds, so neither is held.
 */
function classReads(did: { dials: Wellbeing; built: number }, didnt: { dials: Wellbeing; built: number }): number {
  const ratio = readinessFrom(did.dials) / readinessFrom(didnt.dials);
  for (const r of [readinessFrom(did.dials), readinessFrom(didnt.dials)]) {
    expect(r).toBeGreaterThan(0.3 * 80);
    expect(r).toBeLessThan(1.2 * 80);
  }
  expect(didnt.built).toBeGreaterThan(0);
  expect(did.built / didnt.built).toBeCloseTo(ratio, 9);
  return ratio;
}

// ---------------------------------------------------------------------------

describe('life.sleep', () => {
  it('PLAYER JOURNEY: the Sleep dialog over a plan shows it will be slept through; Sleep 8 Hours misses it quietly and says so once, across a reload', () => {
    const sim = student('g01-sleep-through');
    clearCalendar(sim); // TEST SETUP
    const { id } = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Gym', at: NH(9, 30), durationMinutes: 60 } });
    // TEST SETUP: the bar with Sleep open (its first state), the slider at 8 hours (the dialog's own state).
    const { text, buttons } = bar(sim, [true, false, null, false, false, 8]);
    // Up from the night at 7:30 AM, the suggestion is a nap's (from 2026-10-20, brief 19's D3): until then it was a night
    // cut short by the Gym, "“Gym” is in 2 hours. Getting up and there takes an hour and a half, so there isn’t time for a
    // full night.", at an hour the night was already behind. The Gym is still named beside it.
    // Until 2026-10-21 it went on "A sleep under six hours adds to the sleep you owe, so it’s best kept for the night.":
    // a sleep after the night adds no short night's debt since (brief 20's D3, `applySleep`).
    expect(text).toContain(`You’ve already slept since midnight, and with your energy at ${Math.round(sim.player.wellbeing.energy)} you don’t need more sleep yet.`);
    expect(text).not.toContain('adds to the sleep you owe');
    // The night before the Gym is behind her, so the line under the next commitment says nothing of a bedtime (brief 20).
    expect(text).toContain('Your next commitment is in 2 hours. You’d sleep through');
    expect(text).toContain('You’d Wake At 3:30 PM, August 24, 2026');
    expect(text).toContain('You’d sleep through one commitment: Gym — 9:30 AM');
    buttons.find((b) => b.text === 'Sleep 8 Hours')!.onClick!();

    expect(sim.now).toBe(NH(15, 30));
    expect(sim.player.lastSleptAt).toBe(NH(15, 30));
    // Missed, and quietly: the night says what it slept through, the plan's own handler doesn't say it again.
    expect(sim.timeline.get(id)!.status).toBe('missed');
    expect(notices(sim, 'You Slept Through 1 Commitment').map((n) => n.body)).toEqual(['You were asleep for Gym, so you missed it.']);
    expect(notices(sim, 'You Missed Gym')).toHaveLength(0);

    const again = reload(sim);
    again.advanceTo(again.now + 2 * MS_HOUR);
    expect(again.timeline.get(id)!.status).toBe('missed');
    expect(notices(again, 'You Slept Through 1 Commitment')).toHaveLength(1);
    expect(notices(again, 'You Missed Gym')).toHaveLength(0);
  });

  it('names every commitment a night runs over, in the plural for two', () => {
    const sim = student('g01-sleep-two');
    clearCalendar(sim); // TEST SETUP
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Gym', at: NH(9, 30), durationMinutes: 60 } });
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Lunch', at: NH(12), durationMinutes: 60 } });
    expect(sleep(sim, { hours: 8 }).ok).toBe(true);
    expect(notices(sim, 'You Slept Through 2 Commitments').map((n) => n.body)).toEqual(['You were asleep for Gym and Lunch, so you missed them.']);
    expect(notices(sim, 'You Slept Through 1 Commitment')).toHaveLength(0);
  });

  it('is refused inside a plan kept, in the plan’s own words, with the clock and the dials as they were; taken once it’s over', () => {
    const { sim } = atGym('g01-sleep-busy');
    const before = { now: sim.now, w: { ...sim.player.wellbeing } };
    const tried = sleep(sim, { hours: 8 });
    expect(tried.ok).toBe(false);
    expect(tried.error).toBe(AT_GYM);
    expect(sim.now).toBe(before.now);
    expect(sim.player.wellbeing).toEqual(before.w);
    // And after a reload, the same.
    expect(sleep(reload(sim), { hours: 8 }).error).toBe(AT_GYM);
    sim.advanceTo(NH(12, 30));
    expect(sleep(sim, { hours: 8 }).ok).toBe(true);
    expect(sim.now).toBe(NH(20, 30));
  });

  it('refuses a start that isn’t a number “Say when to sleep.”, and hours that aren’t “Say how long to sleep.”, moving nothing', () => {
    const sim = student('g01-sleep-nan');
    clearCalendar(sim); // TEST SETUP
    const start = sim.now;
    for (const startAt of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const tried = sleep(sim, { hours: 8, startAt });
      expect(tried.ok).toBe(false);
      expect(tried.error).toBe('Say when to sleep.');
    }
    expect(sleep(sim, { hours: 'eight' }).error).toBe('Say how long to sleep.');
    expect(sim.now).toBe(start);
    expect(sim.player.lastSleptAt).toBe(NH(7, 30));
  });

  it('PLAYER JOURNEY: a night chosen through Sleep before the first classes is read by them, Acting I building the scene craft by the readiness it left', () => {
    // Sunday 30 August at 10 PM; one twin sleeps nine hours through the command, the other is left to the night the
    // clock gives a player who chooses none.
    const [slept, twin] = firstClassMorning('g01-sleep-class', {}, AUG31(-2));
    expect(sleep(slept, { hours: 9 }).ok).toBe(true);
    expect(slept.now).toBe(AUG31(7));
    expect(slept.player.lastSleptAt).toBe(AUG31(7));
    twin.advanceTo(slept.now);
    const a = atClasses(slept);
    const b = atClasses(twin);
    // Nine hours pay off the day's debt (fifteen waking hours at 0.34 against 1.4 an effective hour and 2.2 past five
    // and a half), so what's owed at nine is the two hours up since seven at 0.34.
    expect(a.dials.sleepDebt).toBeCloseTo(2 * 0.34, 9);
    const ratio = classReads(a, b);
    expect(Math.abs(ratio - 1)).toBeGreaterThan(0.01);
  });

  it('holds the hours between half an hour and sixteen: −8 sleeps thirty minutes, 20 sleeps sixteen hours', () => {
    const short = student('g01-sleep-clamp');
    clearCalendar(short); // TEST SETUP
    expect(sleep(short, { hours: -8 }).ok).toBe(true);
    expect(short.now).toBe(NH(8));
    const long = student('g01-sleep-clamp');
    clearCalendar(long); // TEST SETUP
    expect(sleep(long, { hours: 20 }).ok).toBe(true);
    expect(long.now).toBe(NH(23, 30));
  });
});

describe('life.look_after:eat', () => {
  it('spares the hunger a skipped meal costs: ten hours on, condition 49/12 and morale 2 + 0.7 × 49/6 above a twin who went without', () => {
    const ate = student('g01-eat-toll');
    const went = student('g01-eat-toll');
    for (const sim of [ate, went]) { clearCalendar(sim); sim.player.wellbeing.nourishment = 25; } // TEST SETUP
    expect(lookAfter(ate, 'eat').ok).toBe(true);
    went.advanceTo(ate.now);
    expect(ate.now).toBe(NH(8, 10));
    // Forty minutes awake at 2 an hour: 25 − 4/3 for both, and fifty on top for the one who ate.
    expect(went.player.wellbeing.nourishment).toBeCloseTo(25 - 4 / 3, 9);
    expect(ate.player.wellbeing.nourishment).toBeCloseTo(25 - 4 / 3 + 50, 9);
    expect(ate.player.wellbeing.condition).toBe(went.player.wellbeing.condition);
    expect(ate.player.wellbeing.morale - went.player.wellbeing.morale).toBeCloseTo(50 * 0.04, 9);
    for (const sim of [ate, went]) sim.advanceTo(NH(18, 10));
    // The twin is fed for (23.67 − 20) / 2 = 11/6 hours of the ten and hungry for 49/6, each costing 0.5 condition and
    // 0.7 morale; the one who ate is never under twenty.
    expect(ate.player.wellbeing.condition - went.player.wellbeing.condition).toBeCloseTo(0.5 * 49 / 6, 6);
    expect(ate.player.wellbeing.morale - went.player.wellbeing.morale).toBeCloseTo(50 * 0.04 + 0.7 * 49 / 6, 6);
    expect(readiness(ate.player)).toBeGreaterThan(readiness(went.player));
  });

  it('PLAYER JOURNEY: a meal before the first classes is read by them, Acting I building the scene craft by the readiness it gave', () => {
    const [ate, twin] = firstClassMorning('g01-eat-class');
    expect(lookAfter(ate, 'eat').ok).toBe(true);
    twin.advanceTo(ate.now);
    expect(ate.now).toBe(AUG31(8, 10));
    const a = atClasses(ate);
    const b = atClasses(twin);
    // Filled to a hundred at 8:10 and down 2 an hour since: 100 − 5/3 at nine. The meal moved nourishment and the mood
    // and no other dial.
    expect(a.dials.nourishment).toBeCloseTo(100 - 5 / 3, 9);
    expect(b.dials.nourishment).toBeLessThan(90);
    expect(a.dials.morale).toBeGreaterThan(b.dials.morale);
    for (const k of ['energy', 'stress', 'sleepDebt', 'hygiene', 'condition'] as const) expect(a.dials[k], k).toBe(b.dials[k]);
    expect(classReads(a, b)).toBeGreaterThan(1.03);
  });

  it('PLAYER JOURNEY: Eat A Meal from the menu is paid $5.00 as it’s ordered, once, and a reload neither charges nor feeds it again', () => {
    const sim = student('g01-eat-menu');
    clearCalendar(sim); // TEST SETUP
    sim.player.wellbeing.nourishment = 25; // TEST SETUP
    const before = sim.universe.accounts[checking(sim)]!.balance;
    const eat = lookAfterMenu(sim).get('Eat A Meal')!;
    expect(eat.grayed).toBe(false);
    // $4 at the American average, at New Haven's cost of living (127 in the atlas) to the whole dollar, and Connecticut
    // leaves groceries untaxed: $5.00.
    expect(eat.says).toContain('40 minutes · $5.00');
    eat.press();
    expect(h.toasts).toEqual(['Eat A Meal: done at 8:10 AM.']);
    expect(paid(sim, 'A meal')).toEqual([500]);
    expect(sim.universe.accounts[checking(sim)]!.balance).toBe(before - 500);
    const again = reload(sim);
    expect(again.player.wellbeing.nourishment).toBeCloseTo(25 - 4 / 3 + 50, 9);
    again.advanceTo(again.now + MS_HOUR);
    expect(paid(again, 'A meal')).toEqual([500]);
  });

  it('adds nothing to the body’s day, and the day’s groceries are bought at midnight all the same, $10.00 for the one who ate and the twin who didn’t', () => {
    const ate = student('g01-eat-groceries');
    const twin = student('g01-eat-groceries');
    for (const sim of [ate, twin]) { clearCalendar(sim); sim.player.wellbeing.nourishment = 30; } // TEST SETUP
    expect(lookAfter(ate, 'eat').ok).toBe(true);
    expect(ate.player.body!.intake).toBe(0);
    for (const sim of [ate, twin]) sim.advanceTo(Date.UTC(2026, 7, 25, 5));
    // $8 a day at the American average, at New Haven's 127 to the whole dollar, untaxed: $10.00, the meal or not.
    const midnight = Date.UTC(2026, 7, 25, 4);
    const groceries = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'Groceries' && t.at > NH(8))
      .map((t) => ({ at: t.at, cents: -t.postings.find((p) => p.accountId === checking(sim))!.amount }));
    expect(groceries(ate)).toEqual([{ at: midnight, cents: 1000 }]);
    expect(groceries(twin)).toEqual([{ at: midnight, cents: 1000 }]);
  });

  it('is refused from a hospital bed, on the menu and by the command, taking nothing; out of it, eaten', () => {
    const sim = student('g01-eat-hospital');
    clearCalendar(sim); // TEST SETUP
    sim.player.wellbeing.nourishment = 25; // TEST SETUP
    healthOf(sim.player).inHospitalUntil = NH(11, 30); // TEST SETUP: a stay on the record
    const menu = lookAfterMenu(sim);
    for (const [label, item] of menu) {
      expect(item.grayed, label).toBe(true);
      expect(item.says, label).toContain('Not from a hospital bed.');
    }
    const was = { now: sim.now, money: balances(sim), n: sim.player.wellbeing.nourishment, tx: sim.universe.transactions.length };
    const tried = lookAfter(sim, 'eat');
    expect(tried.error).toBe('Not from a hospital bed.');
    expect({ now: sim.now, money: balances(sim), n: sim.player.wellbeing.nourishment, tx: sim.universe.transactions.length }).toEqual(was);
    sim.advanceTo(NH(11, 30));
    expect(lookAfter(sim, 'eat').ok).toBe(true);
    expect(paid(sim, 'A meal')).toEqual([500]);
  });
});

describe('life.look_after:order', () => {
  it('puts a restaurant’s 134 kcal on the day and on the scale at midnight, at LendingTree’s 21/3.03 of the meal, once across a reload', () => {
    const ordered = student('g01-order');
    const ate = student('g01-order');
    const idle = student('g01-order');
    for (const sim of [ordered, ate, idle]) { clearCalendar(sim); sim.player.wellbeing.nourishment = 30; } // TEST SETUP
    expect(lookAfter(ordered, 'order').ok).toBe(true);
    expect(lookAfter(ate, 'eat').ok).toBe(true);
    idle.advanceTo(ordered.now);
    expect(ordered.now).toBe(NH(8, 20));
    // The body's day: a meal ordered in is 134 kcal over the same at home (USDA ERS, Todd, Mancino & Lin, 2010).
    expect(ordered.player.body!.intake).toBe(134);
    expect(ate.player.body!.intake).toBe(0);
    // Its lift is a meal's: fifty eaten at 0.04.
    expect(ordered.player.wellbeing.morale - idle.player.wellbeing.morale).toBeCloseTo(50 * 0.04, 9);
    // The meal at $5.00 on the twin's ledger, delivered at $21.00 against $3.03 (LendingTree, October 2025).
    expect(paid(ate, 'A meal')).toEqual([500]);
    expect(paid(ordered, 'A meal delivered')).toEqual([Math.round(500 * 21 / 3.03)]);
    expect(paid(ordered, 'A meal delivered')).toEqual([3465]);

    const kept = reload(ordered);
    for (const sim of [ordered, kept, ate]) sim.advanceTo(Date.UTC(2026, 7, 25, 5));
    // Hall's rule (Lancet 2011): a day's gap goes into the weight over 23.9 × 365 / ln 2 kcal a kilogram; each weight is
    // kept to the gram, so the two differ by the gap's share within a gram.
    const gain = 134 / (23.9 * 365 / Math.LN2);
    expect(Math.abs(ordered.player.body!.weightKg - ate.player.body!.weightKg - gain)).toBeLessThanOrEqual(0.001);
    expect(ordered.player.body!.weightKg - ate.player.body!.weightKg).toBeGreaterThan(0);
    expect(kept.player.body!.weightKg).toBe(ordered.player.body!.weightKg);
    expect(kept.player.body!.intake).toBe(0);
    expect(paid(kept, 'A meal delivered')).toEqual([3465]);
  });

  it('refuses an order nothing can pay for, on the menu and by the command, in spend’s words and taking nothing; funded, it goes through', () => {
    const sim = student('g01-order-broke');
    clearCalendar(sim); // TEST SETUP
    sim.player.wellbeing.nourishment = 30; // TEST SETUP
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && (a.kind === 'checking' || a.kind === 'savings')) setBalance(sim, a.id, 0); // TEST SETUP
    sim.must({ kind: 'card.lock', payload: { which: 'credit', locked: true } }); // TEST SETUP, by the card's own command
    const order = lookAfterMenu(sim).get('Order In')!;
    expect(order.grayed).toBe(true);
    expect(order.says).toContain('You can’t afford it.');
    const was = { now: sim.now, money: balances(sim), tx: sim.universe.transactions.length, intake: sim.player.body!.intake, n: sim.player.wellbeing.nourishment };
    const tried = lookAfter(sim, 'order');
    expect(tried.ok).toBe(false);
    expect(tried.error).toBe('You can’t afford it.');
    expect({ now: sim.now, money: balances(sim), tx: sim.universe.transactions.length, intake: sim.player.body!.intake, n: sim.player.wellbeing.nourishment }).toEqual(was);
    setBalance(sim, checking(sim), 100_00); // TEST SETUP: a hundred dollars in
    expect(lookAfter(sim, 'order').ok).toBe(true);
    expect(sim.universe.accounts[checking(sim)]!.balance).toBe(100_00 - 3465);
    expect(sim.player.body!.intake).toBe(134);
  });
});

describe('life.look_after:wash', () => {
  it('cleans to a hundred and takes a tenth of what it washed off the stress, and spares the twin’s grimy hours: 0.4 morale each', () => {
    const washed = student('g01-wash');
    const twin = student('g01-wash');
    for (const sim of [washed, twin]) { clearCalendar(sim); Object.assign(sim.player.wellbeing, { hygiene: 40, stress: 50, energy: 80 }); } // TEST SETUP
    // Pressed on the menu, as the player has it.
    lookAfterMenu(washed).get('Shower')!.press();
    expect(h.toasts).toEqual(['Shower: done at 7:50 AM.']);
    twin.advanceTo(washed.now);
    // Twenty minutes soiling at 1.6 an hour: 40 − 8/15 for the twin; the shower washes off 100 − that.
    const soiled = 40 - 1.6 * 20 / 60;
    expect(twin.player.wellbeing.hygiene).toBeCloseTo(soiled, 9);
    expect(washed.player.wellbeing.hygiene).toBe(100);
    expect(twin.player.wellbeing.stress - washed.player.wellbeing.stress).toBeCloseTo((100 - soiled) * 0.1, 9);
    expect(readiness(washed.player)).toBeGreaterThan(readiness(twin.player));
    expect(washed.player.wellbeing.morale).toBe(twin.player.wellbeing.morale);
    for (const sim of [washed, twin]) sim.advanceTo(NH(15, 50));
    // Eight hours: all of them under fifty for the twin, none for the one who washed.
    expect(washed.player.wellbeing.morale - twin.player.wellbeing.morale).toBeCloseTo(8 * 0.4, 6);
  });

  it('PLAYER JOURNEY: a shower before the first classes is read by them, Acting I building the scene craft by the readiness it gave', () => {
    const [washed, twin] = firstClassMorning('g01-wash-class');
    expect(lookAfter(washed, 'wash').ok).toBe(true);
    twin.advanceTo(washed.now);
    expect(washed.now).toBe(AUG31(7, 50));
    const a = atClasses(washed);
    const b = atClasses(twin);
    // Clean at 7:50 and soiled 1.6 an hour since: 100 − 1.6 × 70/60 at nine. What it washed off is the twin's hygiene
    // seventy minutes before nine, and a tenth of that came off the stress, which both have recovered alike since.
    expect(a.dials.hygiene).toBeCloseTo(100 - 1.6 * 70 / 60, 9);
    const washedOff = 100 - (b.dials.hygiene! + 1.6 * 70 / 60);
    expect(b.dials.stress - a.dials.stress).toBeCloseTo(washedOff * 0.1, 9);
    for (const k of ['energy', 'sleepDebt', 'nourishment', 'morale', 'condition'] as const) expect(a.dials[k], k).toBe(b.dials[k]);
    expect(classReads(a, b)).toBeGreaterThan(1.02);
  });

  it('is refused at 95, “You’re already clean.”, and taken at 94', () => {
    const clean = student('g01-wash-clean');
    clearCalendar(clean); // TEST SETUP
    clean.player.wellbeing.hygiene = 95; // TEST SETUP
    const tried = lookAfter(clean, 'wash');
    expect(tried.error).toBe('You’re already clean.');
    expect(clean.now).toBe(NH(7, 30));
    const nearly = student('g01-wash-clean');
    clearCalendar(nearly); // TEST SETUP
    nearly.player.wellbeing.hygiene = 94; // TEST SETUP
    expect(lookAfter(nearly, 'wash').ok).toBe(true);
    expect(nearly.player.wellbeing.hygiene).toBe(100);
  });

  it('is refused from a hospital bed, the clock and hygiene as they were; out of it, taken', () => {
    const sim = student('g01-wash-hospital');
    clearCalendar(sim); // TEST SETUP
    sim.player.wellbeing.hygiene = 40; // TEST SETUP
    healthOf(sim.player).inHospitalUntil = NH(9); // TEST SETUP
    const tried = lookAfter(sim, 'wash');
    expect(tried.error).toBe('Not from a hospital bed.');
    expect(sim.now).toBe(NH(7, 30));
    expect(sim.player.wellbeing.hygiene).toBe(40);
    sim.advanceTo(NH(9));
    expect(lookAfter(sim, 'wash').ok).toBe(true);
    expect(sim.player.wellbeing.hygiene).toBe(100);
  });
});

/**
 * The labels a run's or a gym's injuries go by, their bills’ names, and their days to mend (Ekstrand et al. 2012, Costa
 * et al. 2012, AAFP 2025, AAOS). A bill is named in sentence case, as every other bill is, from 2026-10-13: until then it
 * took the label’s capitals, “A Sprained Ankle: its care”.
 */
// `care` is what the notice names the care as (from 2026-10-20, brief 17: until then a billed injury's notice didn't say).
const HURT: Record<string, { label: string; bill: string; days: [number, number]; care: string }> = {
  strain: { label: 'A Pulled Muscle', bill: 'A pulled muscle’s care', days: [17, 22], care: 'a visit to urgent care and two sessions of physical therapy' },
  back: { label: 'A Back Strain', bill: 'A back strain’s care', days: [28, 42], care: 'a doctor’s visit and four sessions of physical therapy' },
  sprain: { label: 'A Sprained Ankle', bill: 'A sprained ankle’s care', days: [5, 10], care: 'a visit to urgent care and two sessions of physical therapy' },
  fracture: { label: 'A Broken Bone', bill: 'A broken bone’s care', days: [42, 84], care: 'a trip to the emergency room and six sessions of physical therapy' },
};
/**
 * The first minute from now a workout started would end on a hurting roll. A search of the injury stream ahead, which
 * sets nothing: the workout is then had through the command, and the injury is what its own `mayHurt` draws.
 */
function hurtingStart(sim: Simulation, within = 3 * 24 * 60): number {
  for (let k = 0; k < within; k += 1) {
    const end = sim.now + MS_HOUR + k * 60_000;
    const source = trainingAt(sim, sim.player, end).where === 'run' ? 'run' : 'gym';
    if (sim.rng('health.injury', sim.player.id, `${source}-${end}`).next() < chanceOver(INJURY.perThousandHours[source], 1)) return sim.now + k * 60_000;
  }
  throw new Error('No hurting minute in three days.');
}

describe('life.look_after:exercise', () => {
  it('PLAYER JOURNEY: a workout that hurts puts the injury on record at its end, says so, and the next is refused till it mends, across a reload', () => {
    const sim = student('g01-hurt');
    clearCalendar(sim); // TEST SETUP
    sim.advanceTo(hurtingStart(sim));
    const started = sim.now;
    lookAfterMenu(sim).get('Work Out')!.press();
    expect(sim.now).toBe(started + MS_HOUR);
    const injury = healthOf(sim.player).injury!;
    expect(injury).toBeDefined();
    expect(injury.at).toBe(sim.now);
    const hurt = HURT[injury.kind]!;
    expect(hurt, injury.kind).toBeDefined();
    const days = Math.round((injury.until - injury.at) / MS_DAY);
    expect(days).toBeGreaterThanOrEqual(hurt.days[0]);
    expect(days).toBeLessThanOrEqual(hurt.days[1]);
    expect(notices(sim, hurt.label)).toHaveLength(1);
    expect(notices(sim, hurt.label)[0]!.body.startsWith(`It takes ${days} days to mend`)).toBe(true);
    // Yale Health pays a student's care in full: no bill, and the notice names no cost.
    expect(healthOf(sim.player).bills).toHaveLength(0);
    expect(notices(sim, hurt.label)[0]!.body).not.toContain('You owe');

    const words = `Not with ${hurt.label.toLowerCase()}; it has ${days} days yet to mend.`;
    Object.assign(sim.player.wellbeing, { energy: 90 }); // TEST SETUP: rested, so only the injury stands in the way
    const was = { now: sim.now, fitness: sim.player.wellbeing.fitness };
    const tried = lookAfter(sim, 'exercise');
    expect(tried.ok).toBe(false);
    expect(tried.error).toBe(words);
    expect({ now: sim.now, fitness: sim.player.wellbeing.fitness }).toEqual(was);
    const menu = lookAfterMenu(sim).get('Work Out')!;
    expect(menu.grayed).toBe(true);
    expect(menu.says).toContain(words);

    const again = reload(sim);
    expect(lookAfter(again, 'exercise').error).toBe(words);
    expect(notices(again, hurt.label)).toHaveLength(1);
    // Mended, it's taken again.
    again.advanceTo(injury.until);
    clearCalendar(again); // TEST SETUP
    Object.assign(again.player.wellbeing, { energy: 90 }); // TEST SETUP
    const fit = again.player.wellbeing.fitness;
    expect(lookAfter(again, 'exercise').ok).toBe(true);
    expect(again.player.wellbeing.fitness).toBeGreaterThan(fit);
  });

  it('bills an injury’s care where the plan leaves a share, due in 30 days (LIFE FIXTURE: a New Haven life outside the school)', () => {
    const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth: 'scraping' }, 'g01-hurt-bill');
    clearCalendar(sim); // TEST SETUP
    sim.advanceTo(hurtingStart(sim));
    clearCalendar(sim); // TEST SETUP
    sim.player.wellbeing.energy = Math.max(sim.player.wellbeing.energy, 60); // TEST SETUP
    expect(lookAfter(sim, 'exercise').ok).toBe(true);
    const injury = healthOf(sim.player).injury!;
    const hurt = HURT[injury.kind]!;
    const bills = healthOf(sim.player).bills;
    expect(bills).toHaveLength(1);
    const bill = bills[0]!;
    expect(bill.what).toBe(hurt.bill);
    expect(bill.at).toBe(sim.now);
    expect(bill.dueAt).toBe(sim.now + 30 * MS_DAY);
    expect(bill.amount).toBeGreaterThan(0);
    const dollars = `$${(bill.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    expect(notices(sim, hurt.label)[0]!.body).toContain(`You owe ${dollars} for its care, ${hurt.care}. It’s taken from your checking account on ${formatDate(bill.dueAt, sim.zone)}, and if there isn’t enough then, it becomes medical debt.`);
    expect(sim.universe.scheduled.filter((i) => i.label === `Medical Bill Due: ${hurt.bill}` && i.at === bill.dueAt)).toHaveLength(1);
    // Refused while it mends; reloaded, still one bill.
    expect(lookAfter(sim, 'exercise').error).toMatch(/^Not with /);
    expect(healthOf(reload(sim).player).bills).toHaveLength(1);
  });

  it('is refused from a hospital bed, and with the flu “rest until it passes”, the clock and fitness as they were', () => {
    const sim = student('g01-train-ill');
    clearCalendar(sim); // TEST SETUP
    const was = () => ({ now: sim.now, fitness: sim.player.wellbeing.fitness, energy: sim.player.wellbeing.energy });
    healthOf(sim.player).inHospitalUntil = NH(9); // TEST SETUP
    const before = was();
    expect(lookAfter(sim, 'exercise').error).toBe('Not from a hospital bed.');
    expect(was()).toEqual(before);
    sim.advanceTo(NH(9));
    healthOf(sim.player).fluUntil = NH(9) + 5 * MS_DAY; // TEST SETUP: down with the flu
    const sick = was();
    expect(lookAfter(sim, 'exercise').error).toBe(`Not with the flu: rest until it passes on ${formatDate(NH(9) + 5 * MS_DAY, sim.zone)}.`);
    expect(was()).toEqual(sick);
    // The flu keeps a body from training, not from resting.
    expect(lookAfter(sim, 'unwind').ok).toBe(true);
  });

  it('PLAYER JOURNEY: sixteen mornings’ workouts are read by the first scene shown in class, its second half drained less by Stamina, by the drain’s own rule', () => {
    // Twins of one new life, played by the clock alone; one works out every morning at seven (the first at 7:30, the
    // life's first minute) before the nine o'clock classes, through the command, sixteen days to Tuesday 8 September.
    const trained = student('g01-stamina');
    const idle = student('g01-stamina');
    const start = trained.now;
    const fitAtStart = idle.player.wellbeing.fitness;
    for (let d = 0; d < 16; d += 1) {
      for (const sim of [trained, idle]) sim.advanceTo(Math.max(sim.now, start + d * MS_DAY - 30 * 60_000));
      const done = lookAfter(trained, 'exercise');
      expect(done.ok, `day ${d}: ${done.error}`).toBe(true);
      for (const sim of [trained, idle]) sim.advanceTo(start + d * MS_DAY + 12 * MS_HOUR);
    }
    expect(healthOf(trained.player).injury).toBeUndefined();
    // The Scene Study scene, shown at nine on its day by the clock, judged and kept in each life's work.
    const shown = (sim: Simulation) => sim.player.work!.filter((w) => w.task === 'scene' && w.inputs.key.endsWith(':2026-09-08'));
    expect(shown(trained)).toHaveLength(1);
    expect(shown(idle)).toHaveLength(1);
    const t = shown(trained)[0]!;
    const i = shown(idle)[0]!;
    expect(t.what).toBe('Scene Study');
    expect(t.at).toBe(Date.UTC(2026, 8, 8, 13));
    expect(t.inputs.key).toBe(i.inputs.key);

    // Stamina is the fitness the workouts built, read as it stood at the showing; untrained, it fell 0.18 at each of
    // the fifteen midnights since the first morning (Mujika & Padilla's gentle end), none held without a workout.
    expect(t.inputs.abilities.stamina).toBe(trained.player.wellbeing.fitness);
    expect(i.inputs.abilities.stamina).toBeCloseTo(fitAtStart - 15 * 0.18, 9);
    expect(t.inputs.abilities.stamina! - i.inputs.abilities.stamina!).toBeGreaterThan(10);
    // Until 2026-10-16 this scene, of one tone, was judged whole, stamina an input of its consistency beside composure
    // and discipline, and this held the other four dimensions equal and consistency higher by stamina's share of its
    // inputs. From then every scene is judged in its tones or, with one, in two halves (`scenePiece`), stamina read
    // only as the drain through it, as a scene of two tones always was (phase 2a, step 4). So: the first half the same in
    // both, every dimension; the second half drained by each one's own stamina, by the rule; the whole higher trained.
    const spec = t.inputs.piece!;
    expect(spec.segments).toHaveLength(2);
    expect(i.inputs.piece).toEqual(spec);
    expect(t.inputs.prep).toEqual(i.inputs.prep);
    expect(t.inputs.difficulty).toBe(i.inputs.difficulty);
    for (const r of [t, i]) {
      expect(r.inputs.condition.readiness).toBeGreaterThanOrEqual(60);
      expect(r.inputs.condition.ill || r.inputs.condition.injured || r.inputs.condition.concussed).toBeFalsy();
    }
    const [tr, ir] = [replay(t, TASK_PROFILES.scene!)!, replay(i, TASK_PROFILES.scene!)!];
    expect(tr.overall).toBe(t.overall);
    expect(ir.overall).toBe(i.overall);
    // The first half is stamina's to leave alone: the trained twin's own scene, replayed with the idle twin's stamina,
    // the same in every dimension. Until 2026-10-16 this held the two twins' first halves equal, which they were to the
    // tenth; their other abilities differ by hundredths (a morning's run moves the day's growth in class), and from
    // then responsiveness, weighed as the scene demands (`BASE_INPUTS`), rounds those hundredths apart (22.1 and 22).
    const swapped = replay({ ...t, inputs: { ...t.inputs, abilities: { ...t.inputs.abilities, stamina: i.inputs.abilities.stamina! } } }, TASK_PROFILES.scene!)!;
    expect(swapped.piece!.segments[0]!.dims).toEqual(tr.piece!.segments[0]!.dims);
    expect(swapped.piece!.segments[1]!.drain).toBeLessThan(tr.piece!.segments[1]!.drain);
    const drained = (r: typeof t) => 1 - PIECE.drain * Math.min(1, spec.load) * (1 - Math.min(1, r.inputs.abilities.stamina! / r.inputs.fulls!.stamina!));
    expect(tr.piece!.segments[1]!.drain).toBeCloseTo(drained(t), 3);
    expect(ir.piece!.segments[1]!.drain).toBeCloseTo(drained(i), 3);
    expect(tr.piece!.segments[1]!.drain).toBeGreaterThan(ir.piece!.segments[1]!.drain);
    // On a scene this light on the body (its load under a fifth), sixteen mornings’ stamina is a few thousandths of the
    // second half: the whole, to a tenth, no lower, where until 2026-10-16 consistency read stamina as a fourth of its inputs.
    expect(t.overall).toBeGreaterThanOrEqual(i.overall);
    expect(spec.load).toBeLessThan(0.2);
  });
});

describe('life.look_after:unwind', () => {
  it('takes 10 off the stress, which the night reads (0.24 of quality a hundred), readiness reads, and the flu’s odds read (1.8 at full stress)', () => {
    const unwound = student('g01-unwind', { personality: MIDDLE });
    const twin = student('g01-unwind', { personality: MIDDLE });
    expect(personalityOf(unwound.player, 'stressRecovery')).toBe(1);
    expect(personalityOf(unwound.player, 'sleepQuality')).toBe(1);
    for (const sim of [unwound, twin]) { clearCalendar(sim); sim.player.wellbeing.stress = 80; } // TEST SETUP
    expect(lookAfter(unwound, 'unwind').ok).toBe(true);
    twin.advanceTo(unwound.now);
    expect(unwound.now).toBe(NH(8, 30));
    const s = { unwound: unwound.player.wellbeing.stress, twin: twin.player.wellbeing.stress };
    expect(s.twin - s.unwound).toBeCloseTo(10, 9);
    expect(readiness(unwound.player)).toBeGreaterThan(readiness(twin.player));
    // The flu's odds: 1 + 0.8 × stress / 100 with no debt to speak of (Cohen, Tyrrell and Smith, NEJM 1991, tempered).
    expect(unwound.player.wellbeing.sleepDebt).toBeLessThan(2);
    expect(catching(unwound.player)).toBeCloseTo(1 + 0.8 * s.unwound / 100, 9);
    expect(catching(twin.player)).toBeCloseTo(1 + 0.8 * s.twin / 100, 9);
    // The night after, through the command: (0.82 − 0.24 × stress / 100) at a morning bedtime, for a sleeper of the middle.
    const nights = [unwound, twin].map((sim) => sleep(sim, { hours: 8 }).value!.quality);
    expect(nights[0]).toBeCloseTo(0.82 - 0.24 * s.unwound / 100, 9);
    expect(nights[1]).toBeCloseTo(0.82 - 0.24 * s.twin / 100, 9);
    expect(nights[0]! - nights[1]!).toBeCloseTo(0.024, 9);
  });

  it('PLAYER JOURNEY: an hour unwound before the first classes is read by them, Acting I building the scene craft by the readiness it gave', () => {
    const [unwound, twin] = firstClassMorning('g01-unwind-class', { personality: MIDDLE });
    expect(lookAfter(unwound, 'unwind').ok).toBe(true);
    twin.advanceTo(unwound.now);
    expect(unwound.now).toBe(AUG31(8, 30));
    const a = atClasses(unwound);
    const b = atClasses(twin);
    // Ten off the stress and three on the mood, for a nature at the middle, and both recovered alike since.
    expect(b.dials.stress - a.dials.stress).toBeCloseTo(10, 9);
    expect(a.dials.morale - b.dials.morale).toBeCloseTo(3, 9);
    for (const k of ['energy', 'sleepDebt', 'nourishment', 'hygiene', 'condition'] as const) expect(a.dials[k], k).toBe(b.dials[k]);
    expect(classReads(a, b)).toBeGreaterThan(1.04);
  });

  it('is refused from a hospital bed and inside a kept plan, on the menu and by the command, the stress as it was; after, taken', () => {
    const hosp = student('g01-unwind-hospital', { personality: MIDDLE });
    clearCalendar(hosp); // TEST SETUP
    hosp.player.wellbeing.stress = 60; // TEST SETUP
    healthOf(hosp.player).inHospitalUntil = NH(9); // TEST SETUP
    expect(lookAfterMenu(hosp).get('Unwind')!.says).toContain('Not from a hospital bed.');
    expect(lookAfter(hosp, 'unwind').error).toBe('Not from a hospital bed.');
    expect(hosp.player.wellbeing.stress).toBe(60);
    expect(hosp.now).toBe(NH(7, 30));

    const { sim } = atGym('g01-unwind-gym', { personality: MIDDLE });
    sim.player.wellbeing.stress = 60; // TEST SETUP
    const unwind = lookAfterMenu(sim).get('Unwind')!;
    expect(unwind.grayed).toBe(true);
    expect(unwind.says).toContain(AT_GYM);
    expect(lookAfter(sim, 'unwind').error).toBe(AT_GYM);
    expect(sim.player.wellbeing.stress).toBe(60);
    expect(sim.now).toBe(NH(11));
    sim.advanceTo(NH(12, 30));
    const at = sim.player.wellbeing.stress;
    expect(lookAfter(sim, 'unwind').ok).toBe(true);
    // An hour's own recovery (0.35) and the unwinding's 10.
    expect(at - sim.player.wellbeing.stress).toBeCloseTo(10 + 0.35, 6);
  });
});

describe('calendar.schedule', () => {
  it('PLAYER JOURNEY: the Calendar’s form puts Gym on the day where the player is; after a reload the clock stops at it and its handler keeps it', () => {
    const sim = student('g01-plan-form');
    clearCalendar(sim); // TEST SETUP
    h.sim = sim;
    // TEST SETUP: the month as it opens, the day picked, nothing opened, the form open for it; then the form's title,
    // its start at 10:30 AM (630 minutes into the day) and Two Hours.
    const form = (title: string) => {
      h.buttons = [];
      h.states = [h.keep, '2026-08-24', null, '2026-08-24', title, 630, 120, undefined];
      const text = onScreen(renderToStaticMarkup(createElement(CalendarWorkspace)));
      expect(h.states).toHaveLength(0);
      return { text, put: h.buttons.find((b) => b.text === 'Put It On')! };
    };
    const blank = form('');
    expect(blank.text).toContain('Put Something On August 24, 2026');
    expect(blank.text).toContain('You’ll need to be in New Haven for it, and the clock stops when it’s time.');
    expect(blank.put.disabled).toBe(true);
    const named = form('Gym');
    expect(named.put.disabled).toBe(false);
    named.put.onClick!();

    const plans = sim.universe.scheduled.filter((i) => i.kind === PLAN_KIND);
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({ label: 'Gym', at: NH(10, 30), durationMinutes: 120, requiresPlayer: true, locationId: 'us-ct-newhaven', status: 'pending' });
    const again = reload(sim);
    const stop = again.advanceTo(NH(13), { stopOnPlayerRequired: true });
    expect(stop.interruptedBy?.label).toBe('Gym');
    expect(again.now).toBe(NH(10, 30));
    // Gone on from the stop, the reloaded save's handler keeps it: done, there in New Haven, with nothing to say.
    again.advanceTo(NH(13));
    const kept = again.universe.scheduled.find((i) => i.kind === PLAN_KIND)!;
    expect(kept.status).toBe('done');
    expect(notices(again, 'You Missed Gym')).toHaveLength(0);
  });

  it('inside a plan kept, refuses sleep, a shower, unwinding and a workout in its words and takes a meal; on the bar too, and after a reload', () => {
    const { sim } = atGym('g01-plan-kept');
    Object.assign(sim.player.wellbeing, { energy: 90, hygiene: 30, nourishment: 40 }); // TEST SETUP
    const { text } = bar(sim, []);
    expect(text).toContain(`Sleep: ${AT_GYM}`);
    const menu = lookAfterMenu(sim);
    for (const label of ['Shower', 'Unwind', 'Work Out']) {
      expect(menu.get(label)!.grayed, label).toBe(true);
      expect(menu.get(label)!.says, label).toContain(AT_GYM);
    }
    expect(menu.get('Eat A Meal')!.grayed).toBe(false);

    const was = { now: sim.now, w: { ...sim.player.wellbeing } };
    expect(sleep(sim, { hours: 8 }).error).toBe(AT_GYM);
    for (const action of ['wash', 'unwind', 'exercise']) expect(lookAfter(sim, action).error, action).toBe(AT_GYM);
    expect({ now: sim.now, w: { ...sim.player.wellbeing } }).toEqual(was);
    expect(lookAfter(reload(sim), 'wash').error).toBe(AT_GYM);
    // A meal fits in it, as a break does.
    expect(lookAfter(sim, 'eat').ok).toBe(true);
    expect(sim.now).toBe(NH(11, 40));
    // Once it's over, a shower is taken.
    sim.advanceTo(NH(12, 30));
    expect(lookAfter(sim, 'wash').ok).toBe(true);
    expect(sim.player.wellbeing.hygiene).toBe(100);
  });
});
