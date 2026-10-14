/**
 * The second round of 2026-10-13 on five rows the first round left partial (round two, batch b01): a meal ordered in,
 * dismissing a decision, the clock's speed, choosing a doctor, and the world's tick. The first round's files
 * (`evidence-g01-life`, `-g02`, `-g03`, `-g04`) closed most of each row; what a check of that round found still open is
 * closed here where a played life reaches it, through the command the row's screen sends and the clock, against
 * figures worked out from the rule's own published numbers, never from the helper the engine computes them with.
 *
 * - `life.look_after:order`: the weight a delivered meal adds is now followed to both of the readers the row names,
 *   on the clock that calls them. Until this round `onsetMonth` and `bmiHazard` were reached only by helpers called on
 *   a weight set by hand. A student made at 6′7″ and 222 lb, a body mass index of 24.9997, presses Order In on the
 *   rendered menu; the midnight's 11 grams carry her to 25.0024, and on 1 September the month's onset reads her as
 *   overweight and finds high blood pressure, which her twin who pressed Eat A Meal, still at 24.9997, isn't found
 *   with. And a student born on 26 August 1940 at 5′8″ and 263 lb, 39.9996, orders in on her first morning. At her
 *   birthday the year is drawn at the Global BMI Mortality Collaboration's 2.76 for 40 and over where her twin's is
 *   drawn at 1.94, and it ends her life on 1 September; the twin lives on. Until 2026-10-13 these said 24.99997,
 *   25.0027 and 39.99996, which weren't the figures: 100.7 kg at 200.7 cm is 24.9997, 100.711 kg is 25.0024, and
 *   119.3 kg at 172.7 cm is 39.9996.
 * - `world.dismiss_decision`: GameShell's count of what's waiting, the other reader of `openDecisions` the first
 *   round left unchecked, falls by the row Dismiss takes off Home. The row is the game's own, "Your US Status Is
 *   Ending", raised a minute after a London-born student withdraws.
 * - `world.set_preferences`: Pause stops the live clock on a page that holds the real `GameProvider` in a real React
 *   root, rendered again after the press and not mounted again. The first round's re-render compared each effect's
 *   dependencies across two server renders, where `halt` is a new function every time, so cutting the speed from the
 *   tick's dependencies survived it. Here the press goes through the provider's own `run`, Play starts the clock
 *   again, a paused save opens paused, and the clock's own stop at a plan pauses the save (`halt`).
 * - `health.choose_clinic`: for the New Haven student the choice decided nothing. Your Doctor offered one practice,
 *   Fair Haven, the one had with nothing chosen, and a twin who chose it was booked where one who didn't was. From
 *   2026-10-13 the box is drawn only where a town keeps two practices or more, and New Haven's Papers names Fair Haven
 *   with none to pick. Mexico City's twin who chose none is billed at a figure worked out from the rule's numbers, where
 *   the first round asked only that it be over MX$60. And in London a pay-as-you-go private GP chosen as her doctor was
 *   paid by the NHS, to nothing: its test, which asserts that the visit is billed, failed until `shareOf` billed a
 *   private practice's visit at its own price the same day, Bupa's £79.
 * - `world.tick`: a second real raiser through the tick. The status notice is dated fifteen days on, closed by the
 *   tick after its date, and dropped from Home, and the save forgets it 180 days later. Every raiser a played life
 *   meets dates its row inside a season, so the tick's ninety-day rule for an undated row, and its keeping a dismissed
 *   row to a date more than 180 days off, were reached by no played life; the owner had both go on 2026-10-14.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actress at Yale in
 * New Haven from Monday 24 August 2026 at 7:30 AM, with what creation lets a player choose: a height and weight in feet
 * and pounds, as an American's are asked; a birthday (26 August 1940); a birthplace (London, for an F-1 student);
 * dispositions all at the middle. Seeds were found by drawing the engine's own dice (`rngFor`) for the draw the test
 * is about, then played: 'b01-onset-3572' is the one whose September draw finds high blood pressure at 25 and not
 * under it, and 'b01-end-773' the one whose birthday draw ends the year at 2.76 and not at 1.94. LIFE FIXTURES
 * (`quickSave`), where no New Haven life can reach the rule: London, with a private GP; Mexico City, for a US citizen
 * IMSS doesn't cover. The screens are rendered as the player has them (react-dom/server) with `useGame`'s `run` as the
 * save's own `execute`; a pressed button or a changed select is the component's own handler, kept on its way through
 * the JSX runtime. The page's live clock is the real `GameProvider` in a real React root (react-dom/client), its
 * commits run by React's own `act`.
 *
 * TEST SETUP, said again where it's done: the body kept fed, rested and awake through the clock (`tended`), as a
 * player's meals and sleep keep it. FIXTURE: a dropdown's open state, set through the component's own useState in its
 * render order; the page's window, its document and the element React mounts into, which a node test has none of
 * (`environment: 'node'`), and the page's timers, faked.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement, useEffect, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot } from 'react-dom/client';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, MS_MINUTE, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { healthOf } from '@/engine/systems/health';
import { APPOINTMENT_KIND, appointmentsOf } from '@/engine/systems/appointments';
import { END_KIND } from '@/engine/systems/mortality';
import { openDecisions } from '@/engine/world/world';
import { tabKey } from '@/ui/shell/sections';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** The live provider's value, while a page holds one: the top bar's `useGame` reads it, as it does on the page. */
  live: undefined as unknown,
  /** FIXTURE: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  tabs: {} as Record<string, string>,
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  selects: [] as { id?: string; options: { value: string; text: string }[]; onChange?: (e: { target: { value: string } }) => void }[],
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

/** Every button and select the screens draw, with its words, its options, and its own handler. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const optionsOf = (c: unknown): { value: string; text: string }[] => (Array.isArray(c) ? c.flatMap(optionsOf) : c && typeof c === 'object' && (c as { type?: unknown }).type === 'option'
  ? [{ value: String((c as { props: { value?: unknown } }).props.value), text: textOf((c as { props: { children?: unknown } }).props.children) }] : []);
const keepControls = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children), disabled: props.disabled as boolean | undefined, onClick: props.onClick as (() => void) | undefined });
    if (type === 'select' && props) h.selects.push({ id: props.id as string | undefined, options: optionsOf(props.children), onChange: props.onChange as ((e: { target: { value: string } }) => void) | undefined });
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

// Without the original: it imports the looks, which import it back. Where a page holds the real provider, `useGame`
// is its value; elsewhere `run` is the save's own `execute`. The provider itself is the original, taken below.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
    route: '/home',
    breadcrumbs: [],
    recent: [],
    favourites: [],
    toasts: [],
    saving: false,
    saveError: undefined,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => h.live ?? game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { TimeControls } = await import('@/ui/shell/TimeControls');
const { Home } = await import('@/ui/screens/Home');
const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
const { GameShell } = await import('@/ui/shell/GameShell');
const provider = await vi.importActual<typeof import('@/app/game-context')>('@/app/game-context');

// ---------------------------------------------------------------------------
// Lives, the clock, and the screens over them
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const MIDDLE = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 };
const student = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const lifeIn = (city: string, seed: string, born = city): Simulation => quickSave({ startLocationId: city, homeRegionId: born, livesWhereBorn: born === city, wealth: 'comfortable' }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** An instant on New Haven's clock, Eastern Daylight Time worked out here: UTC−4 to 1 November 2026. */
const EDT = (y: number, m: number, d: number, hour: number, minute = 0) => Date.UTC(y, m - 1, d, hour + 4, minute);
const at = (year: number, month: number, day: number, hour = 9, minute = 0, zone = NY) => instantFromZoned({ year, month, day, hour, minute }, zone);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** What each purchase by this memo took from the checking account, in cents. */
const paid = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).map((t) => -t.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount);

/** TEST SETUP: the clock moved six hours at a time with the body kept fed, rested and awake, as a player's meals and sleep keep it. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

/** What the player reads: the markup with every title attribute taken out, then every tag, and its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/** A screen as the player has it, with its components' open states given (FIXTURE) in render order. */
function drawn(sim: Simulation, screen: FunctionComponent, states: unknown[] = [], tabs: Record<string, string> = {}) {
  h.sim = sim;
  h.buttons = [];
  h.selects = [];
  h.toasts = [];
  h.tabs = tabs;
  h.states = [...states];
  const html = renderToStaticMarkup(createElement(screen));
  expect(h.states, 'every state given was taken').toHaveLength(0);
  const buttons = [...h.buttons];
  const selects = [...h.selects];
  const press = (words: string) => {
    const found = buttons.filter((x) => x.text === words);
    expect(found.map((b) => b.text), `one “${words}” on the screen`).toEqual([words]);
    expect(found[0]!.disabled ?? false).toBe(false);
    h.toasts = [];
    found[0]!.onClick!();
    return [...h.toasts];
  };
  const select = (id: string) => {
    const found = selects.filter((s) => s.id === id);
    expect(found, `one select “${id}”`).toHaveLength(1);
    return found[0]!;
  };
  return { html, text: onScreen(html), buttons, press, select, has: (words: string) => buttons.some((x) => x.text === words) };
}
/** Look After Yourself, opened (FIXTURE: its dropdown, the top bar's fourth state), an item pressed as the player presses it. */
function orderFromMenu(sim: Simulation, label: 'Order In' | 'Eat A Meal'): string[] {
  const bar = drawn(sim, TimeControls, [false, false, null, true]);
  const item = bar.buttons.filter((b) => b.text.startsWith(label));
  expect(item, label).toHaveLength(1);
  expect(item[0]!.disabled ?? false, `${label} isn’t grayed out`).toBe(false);
  h.toasts = [];
  item[0]!.onClick!();
  return [...h.toasts];
}

// ---------------------------------------------------------------------------
// life.look_after:order
// ---------------------------------------------------------------------------

/**
 * Hall's rule (Lancet 2011), as the body keeps it: a day's gap goes into the weight over 23.9 × 365 / ln 2 kcal a
 * kilogram, kept to the gram. A meal ordered in is 134 kcal over the same eaten at home (USDA ERS, Todd, Mancino & Lin,
 * 2010): 0.010647 kg, the gram's 0.011.
 */
const DELIVERED_KG = Math.round((134 / (23.9 * 365 / Math.LN2)) * 1000) / 1000;
/** Creation's height and weight for an American, in feet and inches and in pounds, kept to a tenth of a centimeter and a kilogram. */
const cm = (inches: number) => Math.round(inches * 2.54 * 10) / 10;
const kg = (pounds: number) => Math.round(pounds * 0.45359237 * 10) / 10;
const bmi = (weightKg: number, heightCm: number) => weightKg / (heightCm / 100) ** 2;

describe('life.look_after:order', () => {
  it('PLAYER JOURNEY: Order In pressed at 6′7″ and 222 lb, a BMI of 24.9997, carries her past 25 at midnight; on 1 September the month’s onset finds high blood pressure, at the overweight’s 1.465 of the risk, where her twin who ate a meal isn’t found with it', () => {
    const body = { heightCm: cm(79), weightKg: kg(222), personality: MIDDLE };
    expect(body).toMatchObject({ heightCm: 200.7, weightKg: 100.7 });
    const ordered = student('b01-onset-3572', body);
    const ate = student('b01-onset-3572', body);
    for (const sim of [ordered, ate]) {
      expect(sim.now).toBe(EDT(2026, 8, 24, 7, 30));
      expect(healthOf(sim.player).chronic ?? {}).toEqual({});
    }
    expect(bmi(100.7, 200.7)).toBeLessThan(25);

    // Pressed on the rendered menu: delivered at LendingTree's $21.00 against $3.03 for the same at home (October
    // 2025), of New Haven's $5.00 meal, paid as it's ordered.
    expect(orderFromMenu(ordered, 'Order In')).toEqual(['Order In: done at 8:20 AM.']);
    expect(orderFromMenu(ate, 'Eat A Meal')).toEqual(['Eat A Meal: done at 8:10 AM.']);
    expect(paid(ordered, 'A meal delivered')).toEqual([Math.round(500 * 21 / 3.03)]);
    expect(paid(ordered, 'A meal delivered')).toEqual([34_65]);
    expect(paid(ate, 'A meal')).toEqual([5_00]);
    expect(ordered.player.body!.intake).toBe(134);
    expect(ate.player.body!.intake).toBe(0);

    // The midnight puts it on the scale: 100.7 + 0.011 = 100.711 kg, a BMI of 25.0024, and the twin's 100.7 as she was made.
    for (const sim of [ordered, ate]) sim.advanceTo(EDT(2026, 8, 25, 1));
    expect(DELIVERED_KG).toBe(0.011);
    expect(ordered.player.body!.weightKg).toBe(100.711);
    expect(ate.player.body!.weightKg).toBe(100.7);
    expect(bmi(ordered.player.body!.weightKg, 200.7)).toBeGreaterThanOrEqual(25);

    // The month's onset, at half past midnight on 1 September in New Haven.
    const month = EDT(2026, 9, 1, 0, 30);
    for (const sim of [ordered, ate]) sim.advanceTo(EDT(2026, 9, 1, 1));
    expect(ordered.player.body!.weightKg).toBeGreaterThanOrEqual(25 * 2.007 ** 2);
    expect(ate.player.body!.weightKg).toBeLessThan(25 * 2.007 ** 2);
    expect(titled(ordered, 'Diagnosed: High Blood Pressure').map((n) => [n.at, n.body])).toEqual([[month, 'A doctor found it this month. Its care begins now, at what your plan leaves; Let It Go on Papers stops it.']]);
    expect(healthOf(ordered.player).chronic).toEqual({ hypertension: { treated: true, lapsed: false, since: month } });
    expect(titled(ate, 'Diagnosed: High Blood Pressure')).toEqual([]);
    expect(healthOf(ate.player).chronic ?? {}).toEqual({});

    // Why, by the rule's own published figures: a year's onset at 18 to 29, 19.6% over Olmsted County's twenty years;
    // Guh et al.'s relative risk overweight (1.28 and 1.65) and obese (1.84 and 2.42), averaged; over NCD-RisC's mix of
    // US adults' weights (34.15%, 29.15%, 36.7%). A twelfth a month. Diabetes is drawn first, at 3.0 a thousand at 18 to
    // 44 and Guh's 2.4 and 3.92 overweight, 6.74 and 12.41 obese.
    const monthly = (rate: number, over: number, obese: number, mine: number) => (rate * mine) / (0.3415 + 0.2915 * over + 0.367 * obese) / 12;
    const hyper = { rate: 1 - (1 - 0.196) ** (1 / 20), over: (1.28 + 1.65) / 2, obese: (1.84 + 2.42) / 2 };
    const sugar = { rate: 0.003, over: (2.4 + 3.92) / 2, obese: (6.74 + 12.41) / 2 };
    const dice = ordered.rng('health.onset', ordered.player.id, String(month));
    const [diabetesDraw, hypertensionDraw] = [dice.next(), dice.next()];
    expect(diabetesDraw).toBeGreaterThanOrEqual(monthly(sugar.rate, sugar.over, sugar.obese, sugar.over));
    expect(hypertensionDraw).toBeGreaterThanOrEqual(monthly(hyper.rate, hyper.over, hyper.obese, 1));
    expect(hypertensionDraw).toBeLessThan(monthly(hyper.rate, hyper.over, hyper.obese, hyper.over));

    // And what the diagnosis begins: the first health week after fills its medicine at Yale Health's $10 generic.
    for (const sim of [ordered, ate]) sim.advanceTo(EDT(2026, 9, 7, 12));
    expect(paid(ordered, 'Medicine for high blood pressure')).toEqual([10_00]);
    expect(paid(ate, 'Medicine for high blood pressure')).toEqual([]);
  });

  it('PLAYER JOURNEY: born 26 August 1940 at 5′8″ and 263 lb, a BMI of 39.9996, she orders in on her first morning; her birthday draws the year at 2.76 for 40 and over, not the twin’s 1.94, and the year ends her life on 1 September; the twin lives on', () => {
    const body = { birthYear: 1940, birthMonth: 8, birthDay: 26, heightCm: cm(68), weightKg: kg(263), personality: MIDDLE };
    expect(body).toMatchObject({ heightCm: 172.7, weightKg: 119.3 });
    const ordered = student('b01-end-773', body);
    const ate = student('b01-end-773', body);
    expect(bmi(119.3, 172.7)).toBeLessThan(40);
    expect(orderFromMenu(ordered, 'Order In')).toEqual(['Order In: done at 8:20 AM.']);
    expect(orderFromMenu(ate, 'Eat A Meal')).toEqual(['Eat A Meal: done at 8:10 AM.']);

    const birthday = EDT(2026, 8, 26, 9);
    const ends = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === END_KIND && i.status === 'pending');
    for (const sim of [ordered, ate]) sim.advanceTo(birthday - MS_MINUTE);
    // 119.3 + 0.011, the gram's share of 134 kcal.
    expect(DELIVERED_KG).toBe(0.011);
    expect(ordered.player.body!.weightKg).toBe(119.311);
    expect(bmi(ordered.player.body!.weightKg, 172.7)).toBeGreaterThanOrEqual(40);
    expect(ate.player.body!.weightKg).toBe(119.3);
    for (const sim of [ordered, ate]) expect(ends(sim)).toEqual([]);

    for (const sim of [ordered, ate]) sim.advanceTo(birthday + MS_MINUTE);
    for (const sim of [ordered, ate]) expect(titled(sim, 'Happy Birthday: 86')).toHaveLength(1);
    // The year's chance at 86, by the rule's own figures: the US 2024 life table's 0.078467 at 85 and 0.138036 at 90,
    // log-linear between (CDC NCHS); the United States' own country factor, 1; a body at its age's ceiling, 0.8 of the
    // table (both at 55.6, 86's condition); and the weight's hazard against 22.5 to 25, 1.94 at 35 to 40 and 2.76 at 40
    // and over (Global BMI Mortality Collaboration, Lancet 2016). The draw is for the year to the next birthday, 365
    // days of a 365.2425-day year.
    for (const sim of [ordered, ate]) expect(sim.player.wellbeing.condition).toBeGreaterThanOrEqual(55.6);
    const table = 0.078467 * (0.138036 / 0.078467) ** (1 / 5);
    const share = 365 / 365.2425;
    const yearOf = (hazard: number) => 1 - (1 - table * 0.8 * hazard) ** share;
    const draw = ordered.rng('life.end', ordered.player.id, String(birthday)).next();
    expect(draw).toBeGreaterThanOrEqual(yearOf(1.94));
    expect(draw).toBeLessThan(yearOf(2.76));
    const drawnEnd = ends(ordered);
    expect(drawnEnd).toHaveLength(1);
    expect(drawnEnd[0]!.at).toBeGreaterThan(birthday);
    expect(drawnEnd[0]!.at).toBeLessThan(EDT(2027, 8, 26, 9));
    expect(ends(ate)).toEqual([]);

    // Played on: her life ends where the year drew it, on 1 September, and the twin's goes on.
    const endAt = drawnEnd[0]!.at;
    expect(endAt).toBeGreaterThanOrEqual(EDT(2026, 9, 1, 0));
    expect(endAt).toBeLessThan(EDT(2026, 9, 2, 0));
    for (const sim of [ordered, ate]) sim.advanceTo(EDT(2026, 9, 3, 12));
    expect(ordered.universe.meta.endedAt).toBe(endAt);
    expect(titled(ordered, 'A Life, Ended').map((n) => n.body)).toEqual(['Ada Cole died at 86.']);
    expect(ate.universe.meta.endedAt).toBeUndefined();
    expect(ate.now).toBe(EDT(2026, 9, 3, 12));
    expect(titled(ate, 'A Life, Ended')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// world.dismiss_decision
// ---------------------------------------------------------------------------

/**
 * A London-born student, at Yale on an F-1 visa, withdrawn on her first morning: a minute on, the status look raises
 * "Your US Status Is Ending", dated fifteen days on, the grace a withdrawal leaves an F-1 student.
 */
function statusEnding(seed: string): { sim: Simulation; decisionId: string; ends: number } {
  const sim = student(seed, { homeRegionId: 'uk-eng-london' });
  const t0 = sim.now;
  expect(t0).toBe(EDT(2026, 8, 24, 7, 30));
  sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
  expect(titled(sim, 'You Withdrew From The School').map((n) => n.body).join(' ')).toContain('fifteen days’ grace');
  sim.advanceTo(t0 + 2 * MS_MINUTE);
  const rows = openDecisions(sim).filter((d) => d.title === 'Your US Status Is Ending');
  expect(rows).toHaveLength(1);
  const ends = t0 + 15 * MS_DAY;
  expect(rows[0]!.createdAt).toBe(t0 + MS_MINUTE);
  expect(rows[0]!.dueAt).toBe(ends);
  return { sim, decisionId: rows[0]!.id, ends };
}
/**
 * The rail's count on GameShell, by its own label, or nothing where it shows none. FIXTURE: the page's address, which
 * the shell's help reads as it opens and a node test has none of.
 */
function railCount(sim: Simulation): number | undefined {
  const page = globalThis as Record<string, unknown>;
  const was = page.window;
  page.window = { location: { hash: '' }, addEventListener: () => undefined, removeEventListener: () => undefined };
  try {
    const m = /aria-label="(\d+) Waiting On You"/.exec(drawn(sim, GameShell).html);
    return m ? Number(m[1]) : undefined;
  } finally {
    if (was === undefined) delete page.window; else page.window = was;
  }
}

describe('world.dismiss_decision', () => {
  it('PLAYER JOURNEY: the rail’s count on GameShell is the status notice alone once the notices are read, and Dismiss on Home takes it to none; the row is refused after, and the status still ends on its date', () => {
    const { sim, decisionId, ends } = statusEnding('b01-dismiss');
    // What's unread is read first, by Home's own Mark N Read, so the rail counts what's waiting and nothing else.
    const home = drawn(sim, Home);
    const mark = home.buttons.filter((b) => /^Mark \d+ Read$/.test(b.text));
    expect(mark).toHaveLength(1);
    home.press(mark[0]!.text);
    expect(sim.universe.notifications.filter((n) => !n.read)).toEqual([]);
    expect(railCount(sim)).toBe(1);

    const before = drawn(sim, Home);
    expect(before.text).toContain('Your US Status Is Ending');
    before.press('Dismiss');
    expect(sim.universe.decisions[decisionId]!.dismissedAt).toBe(sim.now);
    expect(railCount(sim)).toBeUndefined();
    expect(drawn(sim, Home).text).not.toContain('Your US Status Is Ending');
    expect(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId, actionIndex: 0 } }).error).toBe('It’s dismissed.');
    expect(sim.execute({ kind: 'world.dismiss_decision', payload: { decisionId } }).error).toBe('It’s dismissed already.');

    // Waved off Home, the thing it was about stands: out of status on its date, said once.
    sim.advanceTo(ends + MS_HOUR);
    expect(sim.player.usOutOfStatus).toBe(ends);
    expect(titled(sim, 'Out Of Status').map((n) => n.at)).toEqual([ends]);
  });
});

// ---------------------------------------------------------------------------
// world.set_preferences
// ---------------------------------------------------------------------------

type Live = import('@/app/game-context').GameContextValue;

describe('world.set_preferences', () => {
  const page = globalThis as Record<string, unknown>;
  const kept = { window: page.window, document: page.document, act: page.IS_REACT_ACT_ENVIRONMENT };
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
    const listens = { addEventListener: () => undefined, removeEventListener: () => undefined };
    // FIXTURE: the page's window and document, which a node test has none of. React's commit asks the window for the
    // frame element it checks the focus against, and the provider asks it for its timers, its address and its history.
    Object.assign(globalThis, {
      IS_REACT_ACT_ENVIRONMENT: true,
      window: {
        ...listens,
        setInterval: (f: () => void, ms: number) => setInterval(f, ms),
        clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
        setTimeout: (f: () => void, ms: number) => setTimeout(f, ms),
        location: { hash: '' },
        history: { replaceState: () => undefined, pushState: () => undefined, back: () => undefined },
        HTMLIFrameElement: class {},
      },
      document: { ...listens, visibilityState: 'visible', activeElement: null },
    });
  });
  afterEach(() => {
    h.live = undefined;
    vi.useRealTimers();
    for (const key of ['window', 'document'] as const) {
      if (kept[key] === undefined) delete page[key]; else page[key] = kept[key];
    }
    if (kept.act === undefined) delete page.IS_REACT_ACT_ENVIRONMENT; else page.IS_REACT_ACT_ENVIRONMENT = kept.act;
  });

  /**
   * The real provider over a save, held in a real React root as the page holds it: mounted once, rendered again by its
   * own state as React renders it, its effects let go and run again by React's own rule (FIXTURE: the element it's
   * mounted into). `live` is its value as its children have it; `mounts` counts how often it was mounted.
   */
  function onPage(sim: Simulation): { live: () => Live; mounts: () => number; wait: (ms: number) => void; unmount: () => void } {
    let mounts = 0;
    const Child = () => {
      h.live = provider.useGame();
      useEffect(() => { mounts += 1; }, []);
      return null;
    };
    const listens = { addEventListener: () => undefined, removeEventListener: () => undefined };
    const element = { nodeType: 1, tagName: 'DIV', namespaceURI: 'http://www.w3.org/1999/xhtml', textContent: '', ...listens, ownerDocument: { ...listens } };
    const root = createRoot(element as never);
    act(() => root.render(createElement(provider.GameProvider, { sim, adapter: { save: async () => undefined } as never, onExit: () => undefined, children: createElement(Child) })));
    expect(mounts).toBe(1);
    return {
      live: () => h.live as Live,
      mounts: () => mounts,
      // A second at a time, each tick's render committed before the next, as a browser runs React's work between them.
      wait: (ms: number) => { for (let s = 0; s < ms; s += 1_000) act(() => { vi.advanceTimersByTime(1_000); }); },
      unmount: () => act(() => root.unmount()),
    };
  }
  /** The top bar over the page, a button pressed as the player presses it, and React's commit after it. */
  const pressOnBar = (sim: Simulation, words: string) => {
    const bar = drawn(sim, TimeControls);
    act(() => { bar.press(words); });
  };

  it('PLAYER JOURNEY: on a page holding the real provider, Pause pressed on the top bar stops the live clock, five seconds and nothing moves; Play starts it again, a second a second; the provider is mounted once throughout', () => {
    const sim = student('b01-clock');
    const start = sim.now;
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    const held = onPage(sim);
    held.wait(5_000);
    expect(sim.now).toBe(start + 5_000);
    expect(drawn(sim, TimeControls).has('Play')).toBe(false);

    pressOnBar(sim, 'Pause');
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    expect(held.live().sim.universe.preferences.timeSpeed).toBe('paused');
    held.wait(5_000);
    expect(sim.now).toBe(start + 5_000);
    held.wait(60_000);
    expect(sim.now).toBe(start + 5_000);

    pressOnBar(sim, 'Play');
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    held.wait(5_000);
    expect(sim.now).toBe(start + 10_000);
    // Rendered again by every press and every tick, never mounted again.
    expect(held.mounts()).toBe(1);
    held.unmount();
  });

  it('a paused save opens paused: the provider over it, reloaded, moves nothing in a minute; Play pressed, it runs', () => {
    const sim = student('b01-clock-reload');
    sim.must({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } });
    const again = reload(sim);
    expect(again.universe.preferences.timeSpeed).toBe('paused');
    const start = again.now;
    const held = onPage(again);
    held.wait(60_000);
    expect(again.now).toBe(start);
    pressOnBar(again, 'Play');
    held.wait(3_000);
    expect(again.now).toBe(start + 3_000);
    held.unmount();
  });

  it('the live clock’s own stop at a plan of your own pauses the save itself: standing at Call at 7:31, the top bar offers Play, and a minute on the plan is still waiting', () => {
    const sim = student('b01-clock-halt');
    const { id } = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Call', at: EDT(2026, 8, 24, 7, 31), durationMinutes: 30 } });
    const held = onPage(sim);
    held.wait(65_000);
    expect(sim.now).toBe(EDT(2026, 8, 24, 7, 31));
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    expect(held.live().standingAt?.item.id).toBe(id);
    held.wait(60_000);
    expect(sim.now).toBe(EDT(2026, 8, 24, 7, 31));
    expect(sim.timeline.get(id)!.status).toBe('pending');
    expect(drawn(sim, TimeControls).has('Play')).toBe(true);
    held.unmount();
  });
});

// ---------------------------------------------------------------------------
// health.choose_clinic
// ---------------------------------------------------------------------------

const HEALTH_TAB = { [tabKey('/workspace/papers')]: 'health' };

describe('health.choose_clinic', () => {
  it('for the New Haven student Papers offers Fair Haven and Yale Health’s Student Health on Your Doctor, each with what a visit costs her and how soon, and with nothing picked the week books her at Yale Health the next weekday at $0', () => {
    // Until 2026-10-13 this held that Your Doctor offered Fair Haven beside The Town’s First Practice, the same place, and
    // that a twin who chose it was booked where one who didn’t was, at the same $0: a choice that decided nothing. From
    // that day the box was drawn only where a town keeps two practices or more, and until 2026-10-15 this held that New
    // Haven drew none. From that day a Yale student has two: what picking Yale Health decides is in
    // tests/scope-health.test.ts.
    // Until later on 2026-10-15 this held the options as 'The Town’s First Practice' and the two practices' names alone,
    // and that with nothing picked the week booked her 24 days on at Fair Haven at $0. That day Yale Health's own rule
    // was kept, "All care must be obtained at the Yale Health Center at 55 Lock Street unless it is an emergency
    // situation…": with nothing picked a member's visit goes to Yale Health's practice, and one at Fair Haven isn't Yale
    // Health's to pay. Each option now says what a visit there costs her and how soon it's booked. Worked by hand: the
    // uninsured visit is SLATE's $100 of 2024 grown by the BLS physicians' services index from 417.93 to 439.389 (2026),
    // 10,513 cents, at 1.75, $183.98; Fair Haven publishes no wait, so New Haven's 23.5 days stand, 24; Yale Health
    // offers "same-day or next-day", the next.
    const sim = student('g03-37');
    const papers = drawn(sim, PapersWorkspace, [], HEALTH_TAB);
    expect(Math.round(Math.round(100_00 * 439.389 / 417.93) * 1.75)).toBe(183_98);
    expect(papers.select('own-doctor').options).toEqual([
      { value: '', text: 'As Your Cover Has It' },
      { value: 'us-ct-fhchc-grand', text: 'Fair Haven Community Health Care, A Visit $183.98, A 24-Day Wait' },
      { value: 'us-ct-yalehealth-studenthealth', text: 'Yale Health Center, Student Health, A Visit $0.00, The Next Weekday' },
    ]);
    // Your Pharmacy, America’s, is still drawn.
    expect(papers.select('own-pharmacy').options[0]).toEqual({ value: '', text: 'Any Pharmacy, At The Median' });
    // Until later on 2026-10-15 the line named Fair Haven, where her visit went with nothing picked.
    expect(papers.text).toContain('A doctor’s visit: Yale Health Center, Student Health');
    expect(/What it would cost you here now: a doctor’s visit (\$\d[\d,]*\.\d\d)/.exec(papers.text)?.[1]).toBe('$0.00');
    // The first health week, Monday 31 August, books her a doctor's visit the next weekday, Tuesday 1 September at ten, at
    // Yale Health. Until later on 2026-10-15 it was 24 days on, Thursday 24 September, at Fair Haven.
    tended(sim, at(2026, 8, 31, 12));
    expect(healthOf(sim.player).clinicId).toBeUndefined();
    expect(appointmentsOf(sim.player).map((a) => [a.at, a.what, a.clinicId])).toEqual([[at(2026, 9, 1, 10), 'A doctor’s visit', 'us-ct-yalehealth-studenthealth']]);
    expect(sim.universe.scheduled.filter((i) => i.kind === APPOINTMENT_KIND && i.status === 'pending').map((i) => i.label)).toEqual(['The Doctor, Yale Health Center, Student Health']);
  });

  it('LIFE FIXTURE (Mexico City, a US citizen IMSS doesn’t cover): the twin who chose no doctor is billed at IMSS’s practice MX$3,311.60, the uninsured price worked out from the rule’s own numbers, where the one who chose Similares is billed its MX$60', () => {
    const play = (choose: boolean) => {
      const sim = lifeIn('mx-cmx-mexicocity', 'g03-mex-38', 'us-ny-newyork');
      if (choose) sim.must({ kind: 'health.choose_clinic', payload: { clinicId: 'mx-cdmx-similares-consultorio' } });
      tended(sim, at(2026, 1, 13, 12));
      return healthOf(sim.player).bills.filter((b) => b.what.startsWith('A doctor’s visit')).map((b) => [b.at, b.what, b.amount]);
    };
    // SLATE's $100 visit of 2024, grown by the BLS's physicians' services CPI from 417.93 (2024) to 439.389 (2026), at
    // 18 pesos a dollar, at the uninsured's 1.75: MX$3,311.60.
    const uninsured = Math.round(Math.round(Math.round(100_00 * 439.389 / 417.93) * 18) * 1.75);
    expect(uninsured).toBe(3_311_60);
    expect(play(false)).toEqual([[at(2026, 1, 12), 'A doctor’s visit, IMSS Unidad de Medicina Familiar No. 1', uninsured]]);
    // Farmacias Similares' consulta, MX$60 (saludiario).
    expect(play(true)).toEqual([[at(2026, 1, 12), 'A doctor’s visit, Farmacias Similares with Dr. Simi consultorio (Consultorio Médico Similares)', 60_00]]);
  });

  it('LIFE FIXTURE (London): a visit at Bupa’s pay-as-you-go private GP, chosen as her doctor, is billed, since the NHS doesn’t pay a private GP; her twin at Soho Square’s NHS practice pays nothing', () => {
    const play = (choose: boolean) => {
      const sim = lifeIn('uk-eng-london', 'g03-lon-29');
      if (choose) drawn(sim, PapersWorkspace, [], HEALTH_TAB).select('own-doctor').onChange!({ target: { value: 'uk-ldn-bupa-gp' } });
      expect(healthOf(sim.player).clinicId).toBe(choose ? 'uk-ldn-bupa-gp' : undefined);
      // Monday 19 January's health week books a visit for Monday 26 January at ten; it's had on the clock.
      tended(sim, at(2026, 1, 27, 12, 0, 'Europe/London'));
      return {
        kept: titled(sim, 'A Doctor’s Visit').map((n) => n.body),
        bills: healthOf(sim.player).bills.filter((b) => b.what.startsWith('A doctor’s visit')).map((b) => [b.what, b.amount]),
      };
    };
    const nhs = play(false);
    expect(nhs).toEqual({ kept: ['A doctor’s visit, Soho Square General Practice. Nothing to pay.'], bills: [] });
    const bupa = play(true);
    expect(bupa.kept).toHaveLength(1);
    expect(bupa.kept[0]).toMatch(/^A doctor’s visit, Bupa Private GP \(pay-as-you-go\)\./);
    expect(bupa.kept[0]).not.toContain('Nothing to pay.');
    expect(bupa.bills).toHaveLength(1);
    expect(bupa.bills[0]![1]).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// world.tick
// ---------------------------------------------------------------------------

describe('world.tick', () => {
  it('PLAYER JOURNEY: the status notice a withdrawal raises, dated fifteen days on, is on Home until its date; the tick after closes it, Home drops it, and it’s gone 180 days after; its date was inside a season of its raising, as every raiser’s is', () => {
    const { sim, decisionId, ends } = statusEnding('b01-tick');
    // The raiser dated it, fifteen days on: inside the ninety days that quieted an undated row and the 180 a closed row
    // is kept, so neither the undated rule nor the keeping of a dismissed row to its date reached it, before both went
    // on 2026-10-14.
    const row = sim.universe.decisions[decisionId]!;
    expect(row.dueAt - row.createdAt).toBe(15 * MS_DAY - MS_MINUTE);
    expect(drawn(sim, Home).text).toContain('Your US Status Is Ending');
    let again = reload(sim);
    expect(again.universe.scheduled.filter((i) => i.kind === 'world.tick' && i.status === 'pending')).toHaveLength(1);
    again.advanceTo(ends - MS_HOUR);
    expect(openDecisions(again).map((d) => d.id)).toEqual([decisionId]);
    again.advanceTo(ends + 2 * MS_DAY + MS_HOUR);
    const closed = again.universe.decisions[decisionId]!;
    // Closed by the first tick after its date (the tick runs every two days), not waved away.
    expect(closed.resolvedAt! - ends).toBeGreaterThan(0);
    expect(closed.resolvedAt! - ends).toBeLessThanOrEqual(2 * MS_DAY);
    expect(closed.dismissedAt).toBeUndefined();
    expect(openDecisions(again)).toEqual([]);
    expect(drawn(again, Home).text).not.toContain('Your US Status Is Ending');
    expect(titled(again, 'Out Of Status').map((n) => n.at)).toEqual([ends]);
    // Kept 180 days after it closed, gone at the tick after.
    again = reload(again);
    again.advanceTo(closed.resolvedAt! + 179 * MS_DAY);
    expect(again.universe.decisions[decisionId]).toBeDefined();
    again.advanceTo(closed.resolvedAt! + 183 * MS_DAY);
    expect(again.universe.decisions[decisionId]).toBeUndefined();
  });
});

