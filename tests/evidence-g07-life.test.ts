/**
 * Evidence for seven life rows the review of 2026-10-13 left partial (verification group g07-life): readiness, the
 * weather a workout is had in, the flu in its season, the holidays, injuries, the conditions carried, and the body.
 * Each row's gaps are closed here through the command its screen sends or the clock that runs it, and each consequence
 * is read where the row says it's read, against figures worked out from the rule's own numbers or a published source,
 * never from the helper the engine computes them with.
 *
 * - readiness: twins of one life, the seven dials set alike but for energy (90 against 10, so the dials' factors come
 *   to 1.08 × 1.05 × 1.05 × 1.03 ÷ 1.35 = readiness 90.85 against 0.52 × … = 43.74), take the same hour of practice,
 *   the same step of the scene, the same play read, the same brief broken down and the same part learned: what grows
 *   unclamped grows 1.08/0.52 = 27/13 as much, and what's held to focus 0.5–1.1 grows 1.1/0.5468 as much. A workout's
 *   fitness is 0.6 × (0.4 + 0.8 × readiness/100) at the readiness its hour leaves, 0.6629 against 0.5231. Profile's
 *   Current Condition is rendered at each.
 * - weather/trainingAt: on New Haven's days the clock reaches, a dry hour under freezing (Saturday 9 January 2027,
 *   −2 °C) and a humid afternoon under 32 °C whose heat index is over it (Thursday 27 August 2026, 30 °C at 73%,
 *   35.8 °C as it feels by the National Weather Service's regression, worked here) are Work Outs indoors: the menu
 *   says so, and the hour builds what indoors builds, burns at MET 3.5 and rolls a gym's chance; a mild dry hour is a
 *   run, a tenth more, MET 9.3 and a run's chance.
 * - seasons/flu: a health week on Monday 2 November 2026 draws an unseen flu by the clock: five days of it, 25
 *   condition, the judged work that week meeting it ill, Work Out refused in its words, a sick day taken, Profile's
 *   For Work held back. The same kind of draw on 7 September brings none: New Haven's flu weeks are its cold ones.
 *   Two defects, failing when written until they were fixed on 2026-10-13: the unseen flu was never told, and Profile
 *   said the flu held back only the voice.
 * - holidays: a debit payment the day before Thanksgiving posts on the Monday after it; the Calendar shows the day;
 *   England's repeat prescription waits out Good Friday and Easter Monday (LIFE FIXTURE, London); a doctor's visit
 *   whose wait ends on a Saturday goes to the Monday. One defect, failing when written until it was fixed on
 *   2026-10-13: a visit whose wait ended on Thanksgiving was booked for Thanksgiving Day.
 * - injuries: a workout that pulls a muscle adds 6 stress and takes 4 morale against the same workout unhurt, and each
 *   midnight 1 more; the next workout is refused in its words, across a reload, until it mends. An everyday injury
 *   drawn at midnight bills its care, due in 30 days, and is paid then (LIFE FIXTURE, uninsured). A work-study shift's
 *   injury is work: workers' compensation's.
 * - chronic: a condition begins at the month's turn for a heavy body of fifty, said and filled; a healthy-weight twin
 *   of the same draws doesn't begin it. A month's care unpaid leaves depression lapsed and takes 3 morale at the next
 *   week (LIFE FIXTURE, uninsured: Yale Health leaves a student's care at nothing, so nothing of hers can lapse).
 *   Asthma let go takes a student to the emergency room on a week her twin who kept it up isn't. A review 13 months
 *   on, a month past NICE's year, is booked at a New Haven practice and kept.
 * - body: five broke days leave a student lighter than her fed twin by 5 × habit × 36/76 ÷ 12,585 kcal a kilogram;
 *   two days ordered in leave one heavier by 2 × 134 ÷ 12,585; a 170 cm body starved past BMI 12 by the clock ends
 *   its life; the person look prints the body. One defect, failing when written until it was fixed on 2026-10-13: a
 *   150 cm body was held at 30 kg, gained overnight from 27.3, and never reached the end.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York, an actor at Yale in New
 * Haven from Monday 24 August 2026 at 7:30 AM, every personality axis at the middle and no traits, as the creation
 * screen can set them, so every personality knob reads 1 and the rules' own figures are the figures. The clock alone
 * plays her to each moment named. LIFE FIXTURES, said where used: a New Haven life outside the school (`quickSave`,
 * scraping, uninsured) for a bill and a lapse a student's cover never leaves, and a London life for England's repeat.
 * Seeds were chosen by reading the engine's own random stream for the draw a test needs (`rngFor`, as the engine keys
 * it). Where a test stands on one draw (the flu's, an emergency's, an injury's, a week left clear for a review), it
 * asserts the draw it chose for against the rule's chance, so a change to the stream fails there, saying so; where it
 * stands on an hour's weather, it asserts the weather.
 *
 * TEST SETUP, said again where it's done: dials set before an action; the calendar cleared of what wants the player;
 * balances set by a posting against a test equity line, and cards locked by their own command; a chronic condition, a
 * weight or a doctor's visit owed put on the record; an injury's chance made certain (its kind left to the engine's
 * own draw); the US and UK holiday files read from disk, as the app fetches them when a save opens; a dropdown's open
 * state on the top bar.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { Fragment, createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Personality } from '@/engine/domain/model';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { rngFor } from '@/engine/core/rng';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { healthOf } from '@/engine/systems/health';
import { weatherAt } from '@/engine/systems/weather';
import { developmentOf, levelOf } from '@/engine/systems/attributes';
import { courseworkOf } from '@/engine/systems/coursework';
import { activity } from '@/engine/systems/statements';
import { overdraftHeadroom } from '@/engine/systems/lending';
import { END_KIND } from '@/engine/systems/mortality';
import { addCountryHolidays } from '@/engine/content/holidays';
import { BRIEFS } from '@/engine/content/briefs/index';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: an injury's chance made certain, the kind still the engine's own draw. */
  force: false,
  rolls: [] as { source: string; chance: number }[],
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value. */
  states: [] as unknown[],
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
}));

// Each injury roll, recorded on its way through `mayHurt`, which is called unchanged but for the chance where forced.
vi.mock('@/engine/systems/injury', async (orig) => {
  const real = await orig<typeof import('@/engine/systems/injury')>();
  const mayHurt: typeof real.mayHurt = (sim, person, source, chance, at, work) => {
    h.rolls.push({ source, chance });
    return real.mayHurt(sim, person, source, h.force ? 1 : chance, at, work);
  };
  return { ...real, mayHurt };
});

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    if (h.states.length === 0) return [value, set];
    return [h.states.shift(), set];
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
    toast: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { TimeControls } = await import('@/ui/shell/TimeControls');
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { CalendarWorkspace } = await import('@/ui/workspaces/CalendarWorkspace');
await import('@/ui/looks/all');
const { resolveLook } = await import('@/ui/looks/registry');
const { at: subject } = await import('@/ui/looks/subject');

// TEST SETUP: the holiday files the app fetches for a save's countries when it opens (`loadPlacesFor`), read from disk.
addCountryHolidays('us', readFileSync('public/holidays/us.tsv', 'utf8'));
addCountryHolidays('uk', readFileSync('public/holidays/uk.tsv', 'utf8'));

// ---------------------------------------------------------------------------
// Lives, moments, and the screens over them
// ---------------------------------------------------------------------------

const MIDDLE: Personality = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 };
const student = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personality: MIDDLE, personalityTraits: [], ...extra });
/** LIFE FIXTURE: a New Haven life outside the school, getting by, uninsured. */
const townLife = (seed: string): Simulation =>
  quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth: 'scraping', personality: MIDDLE, personalityTraits: [] }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const ID = 'person_000001';
/** The engine's own stream for a draw, as it keys it: what a seed was chosen by. */
const draws = (seed: string, stream: string, key: string, n: number): number[] => { const r = rngFor(seed, stream, ID, key); return Array.from({ length: n }, () => r.next()); };

/** TEST SETUP: nothing on the calendar that wants the player, canceled by hand. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
/** TEST SETUP: an account's balance set, against a test equity line. */
function setBalance(sim: Simulation, accountId: string, to: number): void {
  const by = to - sim.universe.accounts[accountId]!.balance;
  if (by !== 0) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}
/**
 * TEST SETUP: nothing left to pay with: every account of hers emptied, the current account's overdraft drawn to its
 * limit, and the credit card locked by its own command.
 */
function broke(sim: Simulation): void {
  for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.kind !== 'credit_card' && a.kind !== 'loan' && a.balance > 0) setBalance(sim, a.id, 0);
  const current = sim.player.primaryAccountId!;
  setBalance(sim, current, -overdraftHeadroom(sim, sim.player));
  sim.execute({ kind: 'card.lock', payload: { which: 'credit', locked: true } });
}
/**
 * TEST SETUP: the seven dials readiness reads, all but energy at values whose factors are round: stress 24 (1.12 −
 * 0.5 × 0.24 = 1.00), no sleep owed (1.05), nourishment 100 (1.05), morale 60 (0.82 + 0.3 × 0.6 = 1.00), hygiene 100
 * (1.03), condition 100 (1.00). Readiness is then 100 × (0.45 + 0.7 × energy/100) × 1.135575 ÷ 1.35.
 */
const atOnce = (sim: Simulation, energy: number) => Object.assign(sim.player.wellbeing, { energy, stress: 24, sleepDebt: 0, nourishment: 100, morale: 60, hygiene: 100, condition: 100 });
/**
 * TEST SETUP: the same, for an action whose hour is lived before it reads readiness (a workout), with the waking day
 * begun now and no debt woken with. The hour then takes 3 energy (`ENERGY_DRAIN_PER_HOUR`), 0.35 stress, 2
 * nourishment and 1.6 hygiene, and adds 0.34 sleep owed: stress 24.35 comes to 24.
 */
function beforeAnHour(sim: Simulation, energy: number): void {
  Object.assign(sim.player.wellbeing, { energy, stress: 24.35, sleepDebt: 0, nourishment: 100, morale: 60, hygiene: 100, condition: 100 });
  sim.player.awakeSince = sim.now;
  sim.player.wokeWithDebt = 0;
}
/**
 * What a workout builds at the readiness its hour leaves, worked out from the dials above: energy E − 3, stress 24,
 * 0.34 owed (1.05 − 0.39 × 0.34/30 = 1.04558), nourishment 98 (0.78 + 0.27 × 0.98 = 1.0446), morale 60, hygiene 98.4
 * (0.92 + 0.11 × 0.984 = 1.02824), condition 100. At E = 90: readiness 100 × 1.059 × 1.04558 × 1.0446 × 1.02824 ÷ 1.35
 * = 88.0976, and 0.6 × (0.4 + 0.8 × 0.880976) = 0.662868 indoors. At E = 40: 0.709 × … = 58.9813, and 0.523110.
 */
const BUILT_AT_90 = 0.6628683804431881;
const BUILT_AT_40 = 0.5231101810521439;
/**
 * Focus for work: readiness ÷ 80 (`focusOf`), with no morning or evening trait to shift the hour: 90.846 ÷ 80 =
 * 1.135575, which what's held to 0.5–1.1 takes as 1.1, and 43.741 ÷ 80 = 0.546758.
 */
const FOCUS_AT_10 = 0.5467583333333333;

const notices = (sim: Simulation, title: string, since = 0) => sim.universe.notifications.filter((n) => n.title === title && n.at >= since);
/** What the player reads: the markup with every title attribute taken out, then every tag, and its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
function render(sim: Simulation, component: () => unknown, states: unknown[] = []): string {
  h.sim = sim;
  h.buttons = [];
  h.states = [...states];
  const html = renderToStaticMarkup(createElement(component as never));
  expect(h.states).toHaveLength(0);
  return onScreen(html);
}
/** Work Out on Look After Yourself, opened (TEST SETUP: its dropdown, the bar's fourth state): its words and its press. */
function workOutLine(sim: Simulation): { says: string; grayed: boolean; press: () => void } {
  render(sim, TimeControls, [false, false, null, true]);
  const b = h.buttons.find((x) => x.text.startsWith('Work Out'));
  expect(b, 'Work Out').toBeDefined();
  return { says: b!.text, grayed: b!.disabled === true, press: () => b!.onClick!() };
}
/** Profile's Current Condition: its For Work figure and the note under it. */
function forWork(sim: Simulation): string {
  const text = render(sim, ProfileWorkspace);
  const i = text.indexOf('For Work');
  expect(i, 'For Work on Profile').toBeGreaterThan(-1);
  return text.slice(i, text.indexOf('Energy, Stress', i));
}
/** The person look's body, rendered. */
function personLook(sim: Simulation): string {
  const found = resolveLook(sim, subject('person', sim.player.id)) as { body?: ReactNode };
  h.sim = sim;
  return onScreen(renderToStaticMarkup(createElement(Fragment, null, found.body)));
}
/** The weight in pounds and the body mass index as the person look should print them, by the international pound and the WHO's bands. */
function bodyWords(heightCm: number, weightKg: number): string {
  const inches = Math.round(heightCm / 2.54);
  const bmi = weightKg / (heightCm / 100) ** 2;
  const word = bmi < 18.5 ? 'underweight' : bmi < 25 ? 'healthy weight' : bmi < 30 ? 'overweight' : 'obese';
  return `${Math.floor(inches / 12)} ft ${inches % 12} in and ${Math.round(weightKg / 0.45359237)} lb, a body mass index of ${bmi.toFixed(1)}: ${word}`;
}
/** The heat index, the NWS's Rothfusz regression with its adjustments (wpc.ncep.noaa.gov/html/heatindex_equation.shtml), in °C. */
function nwsHeatIndexC(c: number, rh: number): number {
  const t = c * 9 / 5 + 32;
  let hi = 0.5 * (t + 61 + (t - 68) * 1.2 + rh * 0.094);
  if ((hi + t) / 2 >= 80) {
    hi = -42.379 + 2.04901523 * t + 10.14333127 * rh - 0.22475541 * t * rh - 0.00683783 * t * t - 0.05481717 * rh * rh + 0.00122874 * t * t * rh + 0.00085282 * t * rh * rh - 0.00000199 * t * t * rh * rh;
    if (rh < 13 && t >= 80 && t <= 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
    if (rh > 85 && t >= 80 && t <= 87) hi += ((rh - 85) / 10) * ((87 - t) / 5);
  }
  return (hi - 32) * 5 / 9;
}
/** Hall's pace: a kilogram is 23.9 kcal a day held for its half-life of 365 days over ln 2 (Hall et al., Lancet 2011). */
const KCAL_PER_KG = 23.9 * 365 / Math.LN2;

// ---------------------------------------------------------------------------
// readiness
// ---------------------------------------------------------------------------

describe('readiness', () => {
  it('PLAYER JOURNEY: an hour of practice builds Memory 27/13 as much at readiness 90.8 as at 43.7, and the tired hour is told so; Profile shows each', () => {
    const rested = student('g07-ready');
    const tired = student('g07-ready');
    atOnce(rested, 90); // TEST SETUP
    atOnce(tired, 10); // TEST SETUP
    // Profile's Current Condition, as each has it: 100 × 1.08 × 1.135575 ÷ 1.35 = 90.85, and 0.52 × … = 43.74, under 60.
    const r = forWork(rested);
    const t = forWork(tired);
    expect(render(rested, ProfileWorkspace)).toContain('Readiness 91');
    expect(render(tired, ProfileWorkspace)).toContain('Readiness 44');
    expect(r).toContain('Sufficient');
    expect(t).toContain('Held Back');
    expect(t).toContain('Under 60: fatigue holds back the work that reads it');
    const a = rested.must<{ gained: number; feedback: string }>({ kind: 'practice.exercise', payload: { exercise: 'recall-drill' } });
    const b = tired.must<{ gained: number; feedback: string }>({ kind: 'practice.exercise', payload: { exercise: 'recall-drill' } });
    expect(a.gained / b.gained).toBeCloseTo(1.08 / 0.52, 9);
    expect(b.feedback).toContain('A tired day: the hour counted for less than a rested one would.');
    expect(a.feedback).not.toContain('A tired day');
    // Kept: the level after a reload is the level the hour left.
    expect(levelOf(reload(rested), reload(rested).player, 'memory')).toBe(levelOf(rested, rested.player, 'memory'));
  });

  it('school.prepare: a step of the scene set by the clock moves the work by focus held to 0.5–1.1 and grows Focus by focus unheld', () => {
    const make = (energy: number) => {
      const sim = student('g07-ready');
      sim.advanceTo(Date.UTC(2026, 7, 31, 11)); // 7:00 AM on the first day of classes, two hours before them
      const scene = courseworkOf(sim, sim.player)!.assignments.find((x) => x.template === 'scene-study')!;
      expect(scene.setOn).toBe('2026-08-30');
      atOnce(sim, energy); // TEST SETUP
      const before = levelOf(sim, sim.player, 'focus');
      const step = sim.must<{ moved: number; dim: string }>({ kind: 'school.prepare', payload: { assignmentId: scene.id, activity: 'read' } });
      return { step, grew: levelOf(sim, sim.player, 'focus') - before };
    };
    const a = make(90);
    const b = make(10);
    expect(a.step.dim).toBe('familiarity');
    expect(a.step.moved / b.step.moved).toBeCloseTo(1.1 / FOCUS_AT_10, 9);
    expect(a.grew / b.grew).toBeCloseTo(1.08 / 0.52, 9);
  });

  it('plays.read and brief.prepare: Proof read and a brief broken down grow the script and Imagination 27/13 as much', () => {
    const at = Date.UTC(2026, 7, 28, 17); // 1:00 PM on Friday 28 August, the library's tour behind her
    const reading = (energy: number) => {
      const sim = student('g07-ready');
      sim.advanceTo(at);
      clearCalendar(sim); // TEST SETUP
      atOnce(sim, energy); // TEST SETUP
      const script = levelOf(sim, sim.player, 'script');
      const imagination = levelOf(sim, sim.player, 'imagination');
      sim.must({ kind: 'plays.read', payload: { playId: 'proof' } });
      return { script: levelOf(sim, sim.player, 'script') - script, imagination: levelOf(sim, sim.player, 'imagination') - imagination };
    };
    const ra = reading(90);
    const rb = reading(10);
    expect(ra.script / rb.script).toBeCloseTo(1.08 / 0.52, 9);
    expect(ra.imagination / rb.imagination).toBeCloseTo(1.08 / 0.52, 9);
    const brief = BRIEFS[0]!;
    const breaking = (energy: number) => {
      const sim = student('g07-ready');
      sim.advanceTo(at);
      clearCalendar(sim); // TEST SETUP
      atOnce(sim, energy); // TEST SETUP
      const imagination = levelOf(sim, sim.player, 'imagination');
      const step = sim.must<{ moved: number; part: string }>({ kind: 'brief.prepare', payload: { brief: brief.id, step: 'read' } });
      return { step, imagination: levelOf(sim, sim.player, 'imagination') - imagination };
    };
    const ba = breaking(90);
    const bb = breaking(10);
    expect(ba.step.part).toBe('interpretation');
    // The brief keeps its preparation to the thousandth (`r3`), so the share moved is near the ratio, not to the ninth place.
    expect(ba.step.moved / bb.step.moved).toBeCloseTo(1.1 / FOCUS_AT_10, 2);
    expect(ba.imagination / bb.imagination).toBeCloseTo(1.08 / 0.52, 9);
  });

  it('PLAYER JOURNEY: school.learn_part, the Carlotta part the clock casts her in by January, learned at the two readinesses', () => {
    const learn = (energy: number) => {
      const sim = student('g07-ready');
      sim.advanceTo(Date.UTC(2027, 0, 4, 14, 1)); // 9:01 AM on Monday 4 January 2027
      expect(sim.player.school!.casting?.production).toBe('Carlotta Festival Of New Plays');
      atOnce(sim, energy); // TEST SETUP
      const memory = levelOf(sim, sim.player, 'memory');
      const done = sim.must<{ lines: number }>({ kind: 'school.learn_part', payload: {} });
      return { lines: done.lines, memory: levelOf(sim, sim.player, 'memory') - memory };
    };
    const a = learn(90);
    const b = learn(10);
    // From none of it learned: the share moved is the share known, focus held to 0.5–1.1; Memory grows by focus unheld.
    expect(a.lines / b.lines).toBeCloseTo(1.1 / FOCUS_AT_10, 9);
    expect(a.memory / b.memory).toBeCloseTo(1.08 / 0.52, 9);
  });

  it('life.look_after exercise: a workout builds 0.6 × (0.4 + 0.8 × readiness/100), 0.6629 at 88.10 and 0.5231 at 58.98', () => {
    const workout = (energy: number) => {
      const sim = student('g07-wx');
      sim.advanceTo(Date.UTC(2026, 7, 27, 16, 30)); // 12:30 PM on Thursday 27 August, an hour indoors (below)
      clearCalendar(sim); // TEST SETUP
      beforeAnHour(sim, energy); // TEST SETUP
      const fitness = sim.player.wellbeing.fitness;
      sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
      expect(developmentOf(sim.player).history.at(-1)!.source).toBe('workout');
      return sim.player.wellbeing.fitness - fitness;
    };
    expect(workout(90)).toBeCloseTo(BUILT_AT_90, 9);
    expect(workout(40)).toBeCloseTo(BUILT_AT_40, 9);
  });
});

// ---------------------------------------------------------------------------
// weather/trainingAt
// ---------------------------------------------------------------------------

describe('weather/trainingAt', () => {
  /** A Work Out pressed on the menu at a moment, after dials set (TEST SETUP): what the line said and what the hour did. */
  function workOutAt(start: number) {
    const sim = student('g07-wx');
    sim.advanceTo(start);
    clearCalendar(sim); // TEST SETUP
    beforeAnHour(sim, 90); // TEST SETUP
    const hour = weatherAt(sim, sim.player.currentLocationId, start + MS_HOUR)!;
    const line = workOutLine(sim);
    const fitness = sim.player.wellbeing.fitness;
    const kg = sim.player.body!.weightKg;
    const extra = sim.player.body!.extra;
    h.rolls = [];
    line.press();
    expect(sim.now).toBe(start + MS_HOUR);
    return { hour, line, built: sim.player.wellbeing.fitness - fitness, kcal: sim.player.body!.extra - extra, kg, source: developmentOf(sim.player).history.at(-1)!.source, rolls: [...h.rolls] };
  }

  it('PLAYER JOURNEY: a dry hour under freezing is a Work Out indoors: Saturday 9 January 2027, −2 °C to 9:00 AM, against a mild dry hour’s run', () => {
    const cold = workOutAt(Date.UTC(2027, 0, 9, 13)); // 8:00 AM EST, played by the clock from August
    expect(cold.hour.temperatureC).toBe(-2);
    expect(cold.hour.condition).toBe('Partly Cloudy');
    expect(cold.hour.wetNow).toBe(false);
    expect(nwsHeatIndexC(cold.hour.temperatureC, cold.hour.humidity)).toBeLessThan(32);
    expect(cold.line.says).toContain('Indoors, the weather being no good for a run');
    expect(cold.line.grayed).toBe(false);
    expect(cold.source).toBe('workout');
    expect(cold.built).toBeCloseTo(BUILT_AT_90, 9);
    // An hour at MET 3.5 less the sedentary 1.4 a kilogram (2024 Adult Compendium), and a gym's 0.62 injuries a thousand hours.
    expect(cold.kcal).toBeCloseTo(2.1 * cold.kg, 6);
    expect(cold.rolls).toEqual([{ source: 'gym', chance: 1 - Math.exp(-0.62 / 1000) }]);
    // The control: Monday 24 August's first hour, 22 °C and overcast to 8:30 AM, is a run: a tenth more, MET 9.3, a run's 7.7.
    const mild = workOutAt(Date.UTC(2026, 7, 24, 11, 30));
    expect(mild.hour.temperatureC).toBe(22);
    expect(mild.hour.wetNow).toBe(false);
    expect(mild.line.says).toContain('A run in fine weather');
    expect(mild.source).toBe('workout:run');
    expect(mild.built).toBeCloseTo(1.1 * BUILT_AT_90, 9);
    expect(mild.kcal).toBeCloseTo(7.9 * mild.kg, 6);
    expect(mild.rolls).toEqual([{ source: 'run', chance: 1 - Math.exp(-7.7 / 1000) }]);
  });

  it('PLAYER JOURNEY: a humid afternoon under 32 °C that feels over it is indoors: Thursday 27 August 2026, 30 °C at 73% to 1:30 PM', () => {
    const hot = workOutAt(Date.UTC(2026, 7, 27, 16, 30)); // 12:30 PM EDT
    expect(hot.hour.temperatureC).toBe(30);
    expect(hot.hour.humidity).toBe(73);
    expect(hot.hour.wetNow).toBe(false);
    expect(hot.hour.condition).toBe('Overcast');
    // The air at 30 °C is under the 32 °C line; as it feels, by the NWS's regression, 35.8 °C, over it.
    expect(nwsHeatIndexC(30, 73)).toBeCloseTo(35.78, 2);
    expect(hot.line.says).toContain('Indoors, the weather being no good for a run');
    expect(hot.source).toBe('workout');
    expect(hot.built).toBeCloseTo(BUILT_AT_90, 9);
    expect(hot.kcal).toBeCloseTo(2.1 * hot.kg, 6);
    expect(hot.rolls).toEqual([{ source: 'gym', chance: 1 - Math.exp(-0.62 / 1000) }]);
  });
});

// ---------------------------------------------------------------------------
// seasons/flu
// ---------------------------------------------------------------------------

/** Monday 2 November 2026, 9:00 AM EST: the health week the flu seed's draw is for. */
const FLU_WEEK = Date.UTC(2026, 10, 2, 14);
const FLU_SEED = 'g07-flu-155';

describe('seasons/flu', () => {
  it('PLAYER JOURNEY: the clock’s health week brings the flu on 2 November: five days of it, 25 condition, and the work judged that week meets it ill', () => {
    // The seed: its 2 November draw is no stay, no emergency (at twice the year's 0.45 even), no visit, a flu at any
    // share of a cold week (under 1 − 0.911^0.0172, the year's 8.9% at the smallest share New Haven gives a November
    // week, before catching raises it), and not seen by a clinician (37% are, CDC).
    const [stay, emergency, visit, flu, seen] = draws(FLU_SEED, 'health.illness', String(FLU_WEEK), 5) as [number, number, number, number, number];
    expect(stay).toBeGreaterThan(1 - Math.exp(-0.04 / 52));
    expect(emergency).toBeGreaterThan(1 - Math.exp(-0.9 / 52));
    expect(visit).toBeGreaterThan(1 - Math.exp(-2 / 52));
    expect(flu).toBeLessThan(1 - 0.911 ** 0.0172);
    expect(seen).toBeGreaterThanOrEqual(0.37);
    const sim = student(FLU_SEED);
    sim.advanceTo(FLU_WEEK - 1000);
    expect(healthOf(sim.player).fluUntil).toBeUndefined();
    const condition = sim.player.wellbeing.condition;
    sim.advanceTo(FLU_WEEK + 1000);
    expect(healthOf(sim.player).fluUntil).toBe(Date.UTC(2026, 10, 7, 14));
    expect(sim.player.wellbeing.condition).toBeCloseTo(condition - 25, 6);
    // Unseen: nothing billed for it and nothing on the care log for it.
    expect(healthOf(sim.player).bills.filter((b) => b.at === FLU_WEEK)).toHaveLength(0);
    expect((healthOf(sim.player).careLog ?? []).filter((c) => c.at === FLU_WEEK)).toHaveLength(0);
    expect(healthOf(reload(sim).player).fluUntil).toBe(Date.UTC(2026, 10, 7, 14));
    sim.advanceTo(Date.UTC(2026, 10, 13, 12));
    const judged = (sim.player.work ?? []).filter((w) => w.at >= FLU_WEEK);
    const ill = judged.filter((w) => w.at < Date.UTC(2026, 10, 7, 14));
    expect(ill.length).toBeGreaterThanOrEqual(3);
    for (const w of ill) expect(w.inputs.condition.ill, `${w.task} on ${new Date(w.at).toISOString()}`).toBe(true);
    const after = judged.filter((w) => w.at >= Date.UTC(2026, 10, 7, 14));
    expect(after.length).toBeGreaterThan(0);
    for (const w of after) expect(w.inputs.condition.ill, `${w.task} on ${new Date(w.at).toISOString()}`).toBeUndefined();
  });

  it('with the flu, Work Out is refused in its words through the command, the save unchanged and across a reload; Profile holds the work back; once over, it’s taken', () => {
    const sim = student(FLU_SEED);
    sim.advanceTo(Date.UTC(2026, 10, 3, 12)); // 7:00 AM on Tuesday 3 November
    const was = serialise(sim.universe);
    const tried = sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } });
    expect(tried.ok).toBe(false);
    expect(tried.error).toBe('Not with the flu: rest until it passes.');
    expect(serialise(sim.universe)).toBe(was);
    expect(workOutLine(sim).grayed).toBe(true);
    expect(reload(sim).execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).error).toBe('Not with the flu: rest until it passes.');
    // Rested but for the flu's condition (TEST SETUP), the work is still held back, and by the flu alone.
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 90, morale: 70, hygiene: 90 });
    expect(forWork(sim)).toContain('Held Back');
    // Sunday 8 November, the flu over: taken.
    sim.advanceTo(Date.UTC(2026, 10, 8, 15));
    clearCalendar(sim); // TEST SETUP
    const fitness = sim.player.wellbeing.fitness;
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok).toBe(true);
    expect(sim.player.wellbeing.fitness).toBeGreaterThan(fitness);
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 90, morale: 70, hygiene: 90, condition: 95 }); // TEST SETUP
    expect(forWork(sim)).toContain('Sufficient');
  });

  it('school.call_in_sick is taken on the flu’s Wednesday at condition 55 or more, the day’s classes excused; once it’s passed, refused', () => {
    const sim = student(FLU_SEED);
    sim.advanceTo(Date.UTC(2026, 10, 4, 12)); // 7:00 AM on Wednesday 4 November, classes at nine
    expect(sim.player.wellbeing.condition).toBeGreaterThanOrEqual(55);
    const excused = sim.player.school!.tally.excused;
    sim.must({ kind: 'school.call_in_sick', payload: {} });
    expect(sim.player.school!.sickDay).toBe('2026-11-04');
    sim.advanceTo(Date.UTC(2026, 10, 4, 21));
    expect(sim.player.school!.tally.excused).toBe(excused + 1);
    expect((sim.player.work ?? []).filter((w) => w.at >= Date.UTC(2026, 10, 4, 5) && w.at < Date.UTC(2026, 10, 5, 5))).toHaveLength(0);
    // Monday 9 November, well and over 55: staying away would be unexcused.
    sim.advanceTo(Date.UTC(2026, 10, 9, 12));
    expect(sim.player.wellbeing.condition).toBeGreaterThanOrEqual(55);
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).error).toBe('You’re well enough to go: staying away would be an unexcused absence.');
  });

  it('New Haven’s flu weeks are its cold ones: a draw that is a flu in any November week brings none on 7 September', () => {
    const seed = 'g07-sep-100';
    const week = Date.UTC(2026, 8, 7, 13);
    const [stay, emergency, visit, flu] = draws(seed, 'health.illness', String(week), 4) as [number, number, number, number];
    expect(stay).toBeGreaterThan(1 - Math.exp(-0.04 / 52));
    expect(emergency).toBeGreaterThan(1 - Math.exp(-0.9 / 52));
    expect(visit).toBeGreaterThan(1 - Math.exp(-2 / 52));
    expect(flu).toBeLessThan(1 - 0.911 ** 0.0172);
    const sim = student(seed);
    sim.advanceTo(week - 1000);
    const condition = sim.player.wellbeing.condition;
    sim.advanceTo(week + 1000);
    expect(healthOf(sim.player).fluUntil).toBeUndefined();
    expect(sim.player.wellbeing.condition).toBeCloseTo(condition, 6);
  });

  it('an unseen flu is told, “You Have The Flu”, with nothing to pay', () => {
    const sim = student(FLU_SEED);
    sim.advanceTo(FLU_WEEK + 1000);
    expect(healthOf(sim.player).fluUntil).toBe(Date.UTC(2026, 10, 7, 14));
    const told = notices(sim, 'You Have The Flu', FLU_WEEK);
    expect(told).toHaveLength(1);
    expect(told[0]!.body).toContain('It costs nothing.');
  });

  it('Profile’s For Work reads Held Back in the flu, and its note says the flu holds back the body', () => {
    const sim = student(FLU_SEED);
    sim.advanceTo(Date.UTC(2026, 10, 3, 12));
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 90, morale: 70, hygiene: 90 }); // TEST SETUP
    const note = forWork(sim);
    expect(note).toContain('Held Back');
    // Since 2026-10-10 illness reaches movement, partnered and physical work's execution and consistency (content/tasks.ts).
    expect(note).toMatch(/The flu holds back[^.]*\bbody\b/);
  });
});

// ---------------------------------------------------------------------------
// holidays
// ---------------------------------------------------------------------------

describe('holidays', () => {
  it('PLAYER JOURNEY: a meal paid by debit card the day before Thanksgiving posts on Monday 30 November, the holiday no bank day; the Calendar shows it', () => {
    const sim = student('g07-hol');
    sim.advanceTo(Date.UTC(2026, 10, 25, 17)); // noon on Wednesday 25 November
    const n = sim.universe.transactions.length;
    sim.must({ kind: 'life.look_after', payload: { action: 'eat' } });
    const meal = sim.universe.transactions.slice(n).find((t) => t.memo === 'A meal')!;
    expect(meal.at).toBe(Date.UTC(2026, 10, 25, 17));
    // Chase's two business days: Thursday is Thanksgiving, the Federal Reserve's holiday, so Friday and Monday.
    expect(meal.postsAt).toBe(Date.UTC(2026, 10, 30, 17));
    const account = sim.universe.accounts[sim.player.primaryAccountId!]!;
    const line = (s: Simulation) => activity(s, s.universe.accounts[account.id]!, meal.at, meal.at + 1).lines.find((l) => l.id === meal.id)!;
    sim.advanceTo(Date.UTC(2026, 10, 27, 23)); // Friday evening: still pending
    expect(line(sim).pending).toBe(true);
    const again = reload(sim);
    expect(again.universe.transactions.find((t) => t.id === meal.id)!.postsAt).toBe(Date.UTC(2026, 10, 30, 17));
    again.advanceTo(Date.UTC(2026, 10, 30, 17) + 1000);
    expect(line(again).pending).toBeUndefined();
    // The Calendar, where she stands on 30 November, shows the month with its holiday.
    again.advanceTo(Date.UTC(2026, 10, 30, 18));
    expect(render(again, CalendarWorkspace)).toContain('Thanksgiving Day');
  });

  it('a doctor’s visit booked from Wednesday 4 November, 24 days on, a Saturday, goes to the Monday', () => {
    const sim = student('g07-hol-2');
    sim.advanceTo(Date.UTC(2026, 10, 4, 13)); // 8:00 AM EST
    for (const a of [...(healthOf(sim.player).appointments ?? [])]) sim.must({ kind: 'health.cancel_appointment', payload: { appointmentId: a.id } });
    healthOf(sim.player).owedVisit ??= 'A doctor’s visit'; // TEST SETUP
    // AMN Healthcare's 23.5 days for a town it doesn't survey, rounded: 28 November, a Saturday; 10:00 AM on Monday 30 November.
    expect(sim.must<{ at: number }>({ kind: 'health.book', payload: {} }).at).toBe(Date.UTC(2026, 10, 30, 15));
  });

  it('a doctor’s visit booked from Monday 2 November, 24 days on, isn’t put on Thanksgiving Day: it’s Friday 27 November', () => {
    const sim = student('g07-hol');
    sim.advanceTo(Date.UTC(2026, 10, 2, 13)); // 8:00 AM EST
    for (const a of [...(healthOf(sim.player).appointments ?? [])]) sim.must({ kind: 'health.cancel_appointment', payload: { appointmentId: a.id } });
    healthOf(sim.player).owedVisit ??= 'A doctor’s visit'; // TEST SETUP
    expect(sim.must<{ at: number }>({ kind: 'health.book', payload: {} }).at).toBe(Date.UTC(2026, 10, 27, 15));
  });

  it('LIFE FIXTURE (London): England’s repeat ordered on 30 March 2026 is ready on 8 April, past Good Friday and Easter Monday, and collected at the 13 April week', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'comfortable', personality: MIDDLE, personalityTraits: [] }, 'g07-london');
    sim.advanceTo(Date.UTC(2026, 2, 24, 12));
    // TEST SETUP: high blood pressure, its supply to run out on 10 April at the health week's hour.
    healthOf(sim.player).chronic = { ...(healthOf(sim.player).chronic ?? {}), hypertension: { treated: true, supplyUntil: Date.UTC(2026, 3, 10, 13), prescribedAt: sim.now } };
    const state = () => healthOf(sim.player).chronic!.hypertension!;
    // Monday 30 March, 9:00 AM in New York (2:00 PM in London), eleven days left: ordered from the GP, five working
    // days (nhs.uk): 31 March, 1 and 2 April, then past Good Friday (3 April) and Easter Monday (6 April), 7 and 8 April.
    sim.advanceTo(Date.UTC(2026, 2, 30, 13) + 1000);
    expect(state().orderedReadyAt).toBe(Date.UTC(2026, 3, 8, 13));
    // Monday 6 April's week: not ready, not collected; the supply runs out on the 10th.
    sim.advanceTo(Date.UTC(2026, 3, 6, 13) + 1000);
    expect(state().supplyUntil).toBe(Date.UTC(2026, 3, 10, 13));
    const again = reload(sim);
    // Monday 13 April's week: collected, 28 days from then (the Department of Health's routine repeat).
    again.advanceTo(Date.UTC(2026, 3, 13, 13) + 1000);
    expect(healthOf(again.player).chronic!.hypertension!.supplyUntil).toBe(Date.UTC(2026, 4, 11, 13));
    expect(healthOf(again.player).chronic!.hypertension!.orderedReadyAt).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// injuries
// ---------------------------------------------------------------------------

describe('injuries', () => {
  it('PLAYER JOURNEY: a workout that pulls a muscle adds 6 stress and takes 4 morale against the same workout unhurt, and the midnight 1 more of each', () => {
    const hurt = student('g07-hurt-1');
    const well = student('g07-hurt-1');
    h.force = true; // TEST SETUP: the chance made certain; the kind and its days are the engine's own draw
    hurt.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
    h.force = false;
    well.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
    expect(healthOf(well.player).injury).toBeUndefined();
    const injury = healthOf(hurt.player).injury!;
    expect(injury).toMatchObject({ kind: 'strain', at: Date.UTC(2026, 7, 24, 12, 30), until: Date.UTC(2026, 8, 14, 12, 30) });
    const told = notices(hurt, 'A Pulled Muscle');
    expect(told).toHaveLength(1);
    // Yale Health pays a student's care in full: no bill, and the notice names no cost.
    expect(told[0]!.body.trim()).toBe('21 days to mend.');
    expect(healthOf(hurt.player).bills).toHaveLength(0);
    const gap = () => ({ stress: hurt.player.wellbeing.stress - well.player.wellbeing.stress, morale: hurt.player.wellbeing.morale - well.player.wellbeing.morale });
    expect(gap().stress).toBeCloseTo(6, 9);
    expect(gap().morale).toBeCloseTo(-4, 9);
    expect(personLook(hurt)).toContain('Mending. A Pulled Muscle, till September 14, 2026.');
    expect(personLook(well)).not.toContain('Mending.');
    // Across the midnight that ends Monday 24 August, the day hurt weighs 1 on each (`INJURY.weighs`).
    for (const s of [hurt, well]) s.advanceTo(Date.UTC(2026, 7, 25, 4) - 1000);
    const evening = gap();
    for (const s of [hurt, well]) s.advanceTo(Date.UTC(2026, 7, 25, 4) + 1000);
    expect(healthOf(well.player).injury).toBeUndefined();
    expect(gap().stress - evening.stress).toBeCloseTo(1, 6);
    expect(gap().morale - evening.morale).toBeCloseTo(-1, 6);
  });

  it('the next Work Out is refused in trainingRefusal’s words through the command, the save unchanged and across a reload; mended, it’s taken', () => {
    const sim = student('g07-hurt-1');
    h.force = true; // TEST SETUP
    sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
    h.force = false;
    sim.advanceTo(Date.UTC(2026, 7, 25, 18)); // 2:00 PM on Tuesday 25 August
    clearCalendar(sim); // TEST SETUP
    sim.player.wellbeing.energy = 90; // TEST SETUP: rested, so only the injury stands in the way
    const words = 'Not with a pulled muscle; it has 20 days yet to mend.';
    const was = serialise(sim.universe);
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).error).toBe(words);
    expect(serialise(sim.universe)).toBe(was);
    expect(workOutLine(sim).says).toContain(words);
    const again = reload(sim);
    expect(again.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).error).toBe(words);
    // Mended on 14 September: after that day's classes, taken.
    again.advanceTo(Date.UTC(2026, 8, 14, 19, 30));
    clearCalendar(again); // TEST SETUP
    again.player.wellbeing.energy = 90; // TEST SETUP
    const fitness = again.player.wellbeing.fitness;
    expect(again.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok).toBe(true);
    expect(again.player.wellbeing.fitness).toBeGreaterThan(fitness);
  });

  it('LIFE FIXTURE (New Haven, uninsured): an everyday injury drawn at midnight by the clock bills its care, due in 30 days, and is paid then, once', () => {
    const seed = 'g07-ev-287';
    const midnight = Date.UTC(2026, 0, 6, 5);
    // The seed: a fall at 26.11 a thousand a year (NHIS), drawn on the first midnight.
    expect(draws(seed, 'health.injury', `fall-${midnight}`, 1)[0]).toBeLessThan(26.11 / 1000 / 365);
    const sim = townLife(seed);
    sim.advanceTo(midnight + 1000);
    const injury = healthOf(sim.player).injury!;
    expect(injury).toMatchObject({ kind: 'sprain', at: midnight, until: midnight + 10 * MS_DAY });
    const bills = healthOf(sim.player).bills;
    expect(bills).toHaveLength(1);
    // Urgent care and two sessions of therapy at an uninsured patient's price, $331.17 and $183.98 each (CARE.price's
    // $180 and $100, × 1.75 uninsured, grown to 2026).
    // Named in sentence case, as every other bill is, from 2026-10-13: until then “A Sprained Ankle: its care”.
    expect(bills[0]).toMatchObject({ what: 'A sprained ankle: its care', at: midnight, amount: 699_13, dueAt: Date.UTC(2026, 1, 5, 5) });
    expect(notices(sim, 'A Sprained Ankle')[0]!.body).toBe('10 days to mend. Its care comes to $699.13, due in 30 days.');
    sim.advanceTo(Date.UTC(2026, 0, 6, 15)); // 10:00 AM
    clearCalendar(sim); // TEST SETUP
    sim.player.wellbeing.energy = 90; // TEST SETUP
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).error).toBe('Not with a sprained ankle; it has 10 days yet to mend.');
    const again = reload(sim);
    setBalance(again, again.player.primaryAccountId!, 2_000_00); // TEST SETUP: enough in checking when it falls due
    again.advanceTo(Date.UTC(2026, 1, 5, 5) - 1000);
    expect(healthOf(again.player).bills.find((b) => b.what === 'A sprained ankle: its care')!.paid).toBeUndefined();
    again.advanceTo(Date.UTC(2026, 1, 5, 5) + 1000);
    expect(healthOf(again.player).bills.find((b) => b.what === 'A sprained ankle: its care')!.paid).toBe(true);
    const paid = again.universe.transactions.filter((t) => t.memo === 'Medical bill: A sprained ankle: its care');
    expect(paid).toHaveLength(1);
    expect(paid[0]!.at).toBe(Date.UTC(2026, 1, 5, 5));
    expect(paid[0]!.postings.find((x) => x.accountId === again.player.primaryAccountId)!.amount).toBe(-699_13);
    again.advanceTo(Date.UTC(2026, 1, 20));
    expect(again.universe.transactions.filter((t) => t.memo === 'Medical bill: A sprained ankle: its care')).toHaveLength(1);
  });

  it('PLAYER JOURNEY: a work-study crew shift that pulls a muscle is work: workers’ compensation pays the care, nothing is billed, and training is refused', () => {
    const seed = 'g07-crew-26';
    const shift = Date.UTC(2026, 8, 5, 14); // 10:00 AM on Saturday 5 September, six hours in the shops
    // The seed: a crew's 5.9 a thousand hours, halved, over six hours (BLS), drawn on the shift.
    expect(draws(seed, 'health.injury', `crew-${shift}`, 1)[0]).toBeLessThan(1 - Math.exp(-(5.9 / 2) * 6 / 1000));
    const sim = student(seed);
    sim.advanceTo(shift + 1000);
    expect(sim.player.school!.tally.worked).toBe(1);
    // Six hours at the Bulletin's $23.00 an hour is the week's wage the compensation would read.
    expect(healthOf(sim.player).injury).toEqual({ kind: 'strain', at: shift, until: shift + 20 * MS_DAY, atWork: { stateId: 'us-ct', weeklyWage: 138_00, paidDays: 0, noFica: true } });
    expect(notices(sim, 'A Pulled Muscle')[0]!.body).toBe('20 days to mend. It happened at work, so workers’ compensation pays the care.');
    expect(personLook(sim)).toContain('Mending. A Pulled Muscle, till September 25, 2026, on workers’ compensation.');
    expect(healthOf(sim.player).bills).toHaveLength(0);
    // Not off work, so no week of compensation is scheduled.
    expect(sim.universe.scheduled.filter((i) => i.kind === 'injury.comp')).toHaveLength(0);
    sim.advanceTo(Date.UTC(2026, 8, 6, 15));
    clearCalendar(sim); // TEST SETUP
    sim.player.wellbeing.energy = 90; // TEST SETUP
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).error).toBe('Not with a pulled muscle; it has 19 days yet to mend.');
  });
});

// ---------------------------------------------------------------------------
// chronic
// ---------------------------------------------------------------------------

describe('chronic', () => {
  it('PLAYER JOURNEY: a condition begins at the month’s turn by the clock for a body of BMI 32 at fifty: diabetes on 1 September, said, and filled; a healthy-weight twin of the same draws doesn’t begin it', () => {
    // 170 cm and 92.5 kg as creation takes them (BMI 32.0); born in 1976 (TEST SETUP: fifty, an age a drama student
    // seldom is, for the onset's rates by age).
    const heavy = student('g07-onset-231', { heightCm: 170, weightKg: 92.5, birthYear: 1976 });
    const lean = student('g07-onset-231', { heightCm: 170, weightKg: 63.6, birthYear: 1976 });
    expect(healthOf(heavy.player).chronic?.diabetes).toBeUndefined();
    const month = Date.UTC(2026, 8, 1, 4, 30); // 12:30 AM on 1 September, the health month
    for (const s of [heavy, lean]) s.advanceTo(month + 1000);
    expect(healthOf(heavy.player).chronic!.diabetes).toMatchObject({ treated: true, since: month });
    const told = notices(heavy, 'Diagnosed: Diabetes');
    expect(told).toHaveLength(1);
    expect(told[0]!.body).toBe('A doctor found it this month. Its care begins now, at what your plan leaves; Let It Go on Papers stops it.');
    expect(healthOf(lean.player).chronic?.diabetes).toBeUndefined();
    expect(notices(lean, 'Diagnosed: Diabetes')).toHaveLength(0);
    // The next health week fills its medicine, America's 30-day fill (CMS), kept across a reload.
    const again = reload(heavy);
    again.advanceTo(Date.UTC(2026, 8, 7, 13) + 1000);
    expect(healthOf(again.player).chronic!.diabetes!.supplyUntil).toBe(Date.UTC(2026, 9, 7, 13));
  });

  it('LIFE FIXTURE (New Haven, uninsured): a month’s care unpaid on 1 February leaves depression lapsed, and the next health week takes 3 morale from her and not from her twin who paid', () => {
    const paid = townLife('g07-q');
    const short = townLife('g07-q');
    for (const s of [paid, short]) healthOf(s.player).chronic = { ...(healthOf(s.player).chronic ?? {}), depression: { treated: true } }; // TEST SETUP
    for (const s of [paid, short]) s.advanceTo(Date.UTC(2026, 0, 31, 12));
    broke(short); // TEST SETUP
    const month = Date.UTC(2026, 1, 1, 5, 30); // 12:30 AM EST on 1 February
    for (const s of [paid, short]) s.advanceTo(month + 1000);
    expect(healthOf(paid.player).chronic!.depression!.lapsed).toBe(false);
    expect(paid.universe.transactions.filter((t) => t.memo === 'Care for depression' && t.at === month)).toHaveLength(1);
    expect(healthOf(short.player).chronic!.depression!.lapsed).toBe(true);
    expect(short.universe.transactions.filter((t) => t.memo === 'Care for depression' && t.at === month)).toHaveLength(0);
    const shortAgain = reload(short);
    const week = Date.UTC(2026, 1, 2, 14); // 9:00 AM EST on Monday 2 February
    for (const s of [paid, shortAgain]) s.advanceTo(week - 1000);
    const before = [paid.player.wellbeing.morale, shortAgain.player.wellbeing.morale];
    for (const s of [paid, shortAgain]) s.advanceTo(week + 1000);
    const fell = [before[0]! - paid.player.wellbeing.morale, before[1]! - shortAgain.player.wellbeing.morale];
    expect(fell[1]! - fell[0]!).toBeCloseTo(3, 6);
    expect(fell[0]).toBeCloseTo(0, 2);
  });

  it('PLAYER JOURNEY: asthma let go doubles the emergencies: on the health week of 7 September the student who let it go is taken to the emergency room, her twin who kept it up isn’t', () => {
    const seed = 'g07-er-178';
    const week = Date.UTC(2026, 8, 7, 13); // 9:00 AM EDT on Monday 7 September
    // The seed: asthma drawn at creation (10.1%, after depression's draw), and an emergency draw between a week's
    // 0.45 a year and twice it (CDC NHAMCS), with no stay before it.
    const [, asthma] = draws(seed, 'health.chronic', 'carried', 2) as [number, number];
    expect(asthma).toBeLessThan(0.101);
    const [stay, emergency] = draws(seed, 'health.illness', String(week), 2) as [number, number];
    expect(stay).toBeGreaterThan(1 - Math.exp(-0.04 / 52));
    expect(emergency).toBeGreaterThanOrEqual(1 - Math.exp(-0.45 / 52));
    expect(emergency).toBeLessThan(1 - Math.exp(-0.9 / 52));
    const kept = student(seed);
    const letGo = student(seed);
    expect(healthOf(letGo.player).chronic?.asthma?.treated).toBe(true);
    letGo.must({ kind: 'health.treat', payload: { condition: 'asthma', on: false } }); // Let It Go, on Papers
    for (const s of [kept, letGo]) s.advanceTo(week - 1000);
    const before = [kept, letGo].map((s) => ({ ...s.player.wellbeing }));
    for (const s of [kept, letGo]) s.advanceTo(week + 1000);
    expect(notices(kept, 'The Emergency Room')).toHaveLength(0);
    expect(healthOf(kept.player).inHospitalUntil).toBeUndefined();
    expect(kept.player.wellbeing.condition).toBeCloseTo(before[0]!.condition, 6);
    const er = notices(letGo, 'The Emergency Room');
    expect(er).toHaveLength(1);
    expect(er[0]!.body).toBe('The emergency room, Yale New Haven Hospital, York Street Campus Emergency Department. Your share is $50.00, due in 30 days.');
    // Connecticut's median 189 minutes in the department (CMS), and the emergency's toll of 20 on condition and energy.
    expect(healthOf(letGo.player).inHospitalUntil).toBe(week + 189 * 60_000);
    expect(letGo.player.wellbeing.condition).toBeCloseTo(before[1]!.condition - 20, 6);
    expect(before[1]!.energy - letGo.player.wellbeing.energy - (before[0]!.energy - kept.player.wellbeing.energy)).toBeCloseTo(20, 6);
  });

  it('PLAYER JOURNEY: high blood pressure last reviewed 13 months ago is booked for its review at a New Haven practice at the first health week, and the clock keeps it', () => {
    const seed = 'g07-review';
    const week = Date.UTC(2026, 7, 31, 13); // 9:00 AM EDT on Monday 31 August
    // The seed: no stay, emergency or doctor's visit drawn that week, which would book or keep her first.
    const [stay, emergency, visit] = draws(seed, 'health.illness', String(week), 3) as [number, number, number];
    expect(stay).toBeGreaterThan(1 - Math.exp(-0.04 / 52));
    expect(emergency).toBeGreaterThan(1 - Math.exp(-0.9 / 52));
    expect(visit).toBeGreaterThan(1 - Math.exp(-2 / 52));
    const sim = student(seed);
    const lastYear = sim.now - 13 * 30.44 * MS_DAY;
    healthOf(sim.player).chronic = { ...(healthOf(sim.player).chronic ?? {}), hypertension: { treated: true, since: lastYear, reviewedAt: lastYear } }; // TEST SETUP
    sim.advanceTo(week + 1000);
    const booked = healthOf(sim.player).appointments ?? [];
    expect(booked).toHaveLength(1);
    // NICE's yearly review; AMN's 23.5 days for New Haven, rounded to 24: Thursday 24 September at 10:00 AM.
    expect(booked[0]).toMatchObject({ what: 'A review of your high blood pressure', at: Date.UTC(2026, 8, 24, 14) });
    expect(booked[0]!.clinicId).toBeDefined();
    expect(healthOf(sim.player).owedVisit).toBeUndefined();
    expect(notices(sim, 'A Doctor’s Appointment')[0]!.body.startsWith('A review of your high blood pressure: booked at ')).toBe(true);
    const again = reload(sim);
    again.advanceTo(Date.UTC(2026, 8, 24, 14) + 1000);
    expect(healthOf(again.player).chronic!.hypertension!.reviewedAt).toBe(Date.UTC(2026, 8, 24, 14));
    expect(healthOf(again.player).appointments ?? []).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// body
// ---------------------------------------------------------------------------

describe('body', () => {
  it('PLAYER JOURNEY: five broke days leave her lighter than her fed twin by 5 × habit × 36/76 ÷ 12,585 kg, and the person look prints both bodies', () => {
    const fed = student('g07-body', { heightCm: 170, weightKg: 65 });
    const poor = student('g07-body', { heightCm: 170, weightKg: 65 });
    expect(personLook(fed)).toContain('5 ft 7 in and 143 lb, a body mass index of 22.5: healthy weight');
    broke(poor); // TEST SETUP
    // Midnight 25 August buys the day ahead or doesn't; each midnight after weighs the day just gone. Midnight 30
    // August has weighed five broke days, 25 to 29 August.
    const from = poor.now;
    for (const s of [fed, poor]) s.advanceTo(Date.UTC(2026, 7, 30, 4) + 1000);
    const groceries = (s: Simulation) => s.universe.transactions.filter((t) => t.memo === 'Groceries' && t.at > from);
    expect(groceries(fed)).toHaveLength(6);
    expect(groceries(poor)).toHaveLength(0);
    // Said again each midnight while unread, and brought up to the last (`notify`).
    expect(notices(poor, 'No Money For Food Today').map((n) => n.at)).toEqual([Date.UTC(2026, 7, 30, 4)]);
    expect(notices(fed, 'No Money For Food Today')).toHaveLength(0);
    const habit = poor.player.body!.habitKcal;
    expect(fed.player.body!.habitKcal).toBe(habit);
    // A broke day eats 40/76 of the habit (BODY.shortDay), so 36/76 of it short, at Hall's pace.
    const expected = 5 * habit * (36 / 76) / KCAL_PER_KG;
    expect(fed.player.body!.weightKg - poor.player.body!.weightKg).toBeCloseTo(expected, 2);
    expect(Math.abs(fed.player.body!.weightKg - poor.player.body!.weightKg - expected)).toBeLessThan(0.005);
    expect(personLook(poor)).toContain(bodyWords(170, poor.player.body!.weightKg));
  });

  it('two days ordered in leave her heavier than her twin who ate in by 2 × 134 ÷ 12,585 kg, a restaurant’s extra (USDA ERS)', () => {
    const out = student('g07-order', { heightCm: 170, weightKg: 65 });
    const home = student('g07-order', { heightCm: 170, weightKg: 65 });
    for (const day of [24, 25]) {
      for (const s of [out, home]) s.advanceTo(Date.UTC(2026, 7, day, 18)); // 2:00 PM
      out.must({ kind: 'life.look_after', payload: { action: 'order' } });
      home.must({ kind: 'life.look_after', payload: { action: 'eat' } });
    }
    for (const s of [out, home]) s.advanceTo(Date.UTC(2026, 7, 26, 4) + 1000);
    expect(out.player.body!.weightKg - home.player.body!.weightKg).toBeCloseTo(2 * 134 / KCAL_PER_KG, 2);
    expect(Math.abs(out.player.body!.weightKg - home.player.body!.weightKg - 2 * 134 / KCAL_PER_KG)).toBeLessThan(0.003);
  });

  it('PLAYER JOURNEY: a 170 cm body starving loses weight each broke midnight, and the first under BMI 12 (34.68 kg) ends the life, starved', () => {
    const sim = student('g07-starve', { heightCm: 170, weightKg: 65 });
    sim.player.body!.weightKg = 35; // TEST SETUP: BMI 12.1, just over the survival limit
    broke(sim); // TEST SETUP
    expect(personLook(sim)).toContain('5 ft 7 in and 77 lb, a body mass index of 12.1: underweight');
    const weights: number[] = [];
    let ended: number | undefined;
    for (let d = 1; d <= 30 && ended === undefined; d += 1) {
      sim.advanceTo(Date.UTC(2026, 7, 24 + d, 4) + 1000);
      weights.push(sim.player.body!.weightKg);
      if (sim.universe.scheduled.some((i) => i.kind === END_KIND && i.payload.cause === 'starved')) ended = d;
    }
    expect(ended).toBeDefined();
    expect(weights.length).toBeGreaterThan(3);
    // The first midnight weighs the fed 24 August, a gain at 35 kg on a 65 kg body's habit; every one after, a broke
    // day, is lighter than the one before.
    expect(weights[0]!).toBeGreaterThan(35);
    for (let i = 1; i < weights.length; i += 1) expect(weights[i]!).toBeLessThan(weights[i - 1]!);
    const limit = 12 * 1.7 ** 2;
    expect(weights.at(-1)!).toBeLessThan(limit);
    expect(weights.at(-2)!).toBeGreaterThanOrEqual(limit);
    sim.advanceTo(sim.now + 5 * 60_000);
    expect(sim.universe.meta.endedAt).toBeDefined();
  });

  it('a 150 cm body starving isn’t held at 30 kg: from 27.3 kg (BMI 12.1) it stays under 27.4 kg overnight, and its starved end is set within thirty days, as a 170 cm body’s is', () => {
    const sim = student('g07-starve-150', { heightCm: 150, weightKg: 50 });
    sim.player.body!.weightKg = 27.3; // TEST SETUP
    broke(sim); // TEST SETUP
    sim.advanceTo(Date.UTC(2026, 7, 25, 4) + 1000);
    // A fed day at 27.3 kg eats the 50 kg body's habit, about 545 kcal over what it spends: 0.043 kg at most, never 2.7.
    expect(sim.player.body!.weightKg).toBeLessThan(27.4);
    let ended = false;
    for (let d = 2; d <= 30 && !ended; d += 1) {
      sim.advanceTo(Date.UTC(2026, 7, 24 + d, 4) + 1000);
      ended = sim.universe.scheduled.some((i) => i.kind === END_KIND && i.payload.cause === 'starved');
    }
    expect(ended).toBe(true);
  });
});
