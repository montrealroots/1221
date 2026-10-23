/**
 * The second round of 2026-10-13 for five creation rows the first round left partial (batch b10 of the verification
 * gaps): what the first round's own files (tests/evidence-g27-ui.test.ts, -g28-ui, -g29-ui) left open, what the check
 * on them found weak, and the defects that a test can show and only the engine or its words can close. Every life is
 * made the way a player makes one, on creation's own screens rendered with react-dom/server and their controls pressed
 * through their own handlers, Begin taken as `SlateApp` takes it; every consequence is reached through a command
 * (`sim.execute`/`sim.must`) or the clock (`sim.advanceTo`), and read where the row says it is read. The figures are the
 * rules' own numbers worked here by hand and written as literals: a knob's lean bent inside its limits,
 * exp(L·tanh(ln v / L)) with L the log of the limit it leans toward (`KNOB_LIMITS`), never asked of `personalityOf`.
 *
 * - `c-disp-ambition`: the round before showed a performance's nerves and two hours on empty. Here the page's "work's and
 *   money's alike" is held for money: a midnight overdrawn adds 4 × the knob, 3.285 at Ambition 5 and 4.461 at 95, its
 *   morale 2 alike; and the bone a first morning's run breaks adds 6 × the knob, stress 14.300 and 16.064, where a run
 *   that hurts nothing ends both at 9.372. The `systems/personality.ts` header still says ambition leans "how much
 *   running on empty costs": a test reads it, and fails until it says what these lives show.
 * - `c-disp-openness`: the Cabaret's read-through takes openness, 3.6 between 5 and 95, and its first curtain, which
 *   the page's "rehearsing new work" and the festival's curtain leave out, took it too until later on 2026-10-13, and
 *   the test holding the curtain to the page failed until then. `WorkDay.away`, read and never set, is held by a test
 *   that every field `WorkDay` declares is set by some call of `enjoyWork`; it fails on `away`.
 * - `c-traits`: in place of tests/personality.test.ts's typed list, every knob a trait declares is held to its reader
 *   for a life made with the trait pressed on Dispositions & Traits, against a twin who pressed nothing: on empty, awake,
 *   soiling, a meal and its price, a night's depth and what it puts back, a midnight's weight, a bone's mending, the
 *   morning's and the evening's work, the four ways of preparing, a classmate warmed and cut, and a friend in the cast.
 *   Only `receipts` reached no reader in play (nothing wrote the work's costs it multiplied), and the page's sentence on
 *   Keeps Accounts, which said it changed a deduction and no more, was held to its own look's "decides nothing now"; it
 *   failed until later on 2026-10-13, when the sentence said its receipts decide nothing for a student. On 2026-10-14
 *   the owner had the knob go: every knob a trait declares is held to a reader here, and Keeps Accounts' look and the
 *   page say its slights alone.
 * - `c-wealth`: what tests/school.test.ts's 'comes from a wealthy family, with its money in the bank, and has no
 *   birthplace chosen for it' said and didn’t check (its title, from later on 2026-10-13, says only what it asserts): Identity drawn from a new life asks for a birthplace and holds
 *   Continue, Begin's life is the wealthy family's with $92,391 and $413,043 at Chase, and the term's Yale Health plan,
 *   the $1,882 What Is Yours says goes each term (half Yale Health's published $3,764 for 2026–27), comes out of that
 *   checking at 9 AM. Found here: a plan the bank couldn’t pay was dropped, not owed, and the test of it failed, until
 *   later on 2026-10-13.
 * - `c-tutorial`: the built-app journey the review asked for, "I Know SLATE." chosen and Begin pressed, rendered as
 *   `SlateApp`'s playing phase shows it: no control, panel or screen locked, every destination on the rail and each of
 *   their five screens open, Play shown with the clock paused, and Play pressed sending it live. Play and Pause carry no
 *   pressed state: until 2026-10-13 Play was shown pressed, and a screen reader said so with the clock stopped. The guided life
 *   beside it: four controls and eight of Home's panels locked, Play and Sleep among them, the rail holding Home alone,
 *   each screen held shut, and Play pressed opening the guide at its chapter with the clock still paused.
 *
 * PLAYER JOURNEYS: a new life (`newLifeConfig`), Ada Cole, born in New York (the birthplace a player picks on Identity,
 * which `newLifeConfig` leaves empty), at Yale in New Haven from Monday 24 August 2026 at 7:30 AM, made on the creation
 * screens: Dispositions & Traits with a slider moved or a trait pressed, Review with "I Know SLATE." chosen, Begin; the
 * life made as `SlateApp`'s `start` makes it (`tutorial: config.tutorial !== false, paused: true`) on a seed of the
 * test's, where `SlateApp`'s own is the clock's and would draw a different life each run. For `c-wealth` and
 * `c-tutorial` SlateApp itself is rendered, its Begin pressed and the save it makes and hands its adapter played on.
 * Seeds kept from the round before for what the clock draws on them: g09-run-1668 (a first morning's run breaks a bone),
 * g09-probe (Maya asks for help on 3 September, Imani to run lines on the 10th; 101 kg), g09-hours (the first scenes),
 * g09-cast (the spring cast list and the Carlotta Festival), g28-new-work (the Cabaret); the rest, b10-*, are this
 * file's, chosen for nothing the clock draws but b10-run-sound, a first morning's run that hurts nothing.
 *
 * TEST SETUP, said again where it's done: on the screens, which a static render can't click to, the components' states
 * in render order and the config a control's own handler set, applied as React would on the next render; the calendar
 * cleared of what wants the player before a measured hour, meal or night; the dials set before one, the same in every
 * twin; the day's dials each six hours on the way to a Cabaret call (`tended`); a checking account overdrawn by a
 * posting against a test equity line; a classmate's bond set to a friend's 30 the moment before a curtain; and for the
 * game shell, the browser's address at Home, which the help it holds reads for an entry it names.
 */
import { describe, expect, it, vi } from 'vitest';
import { attributesOf } from '@/engine/systems/attributes';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { ScheduledItem } from '@/engine/core/scheduler';
import type { Account } from '@/engine/core/ledger';
import type { Personality, SaveUniverse, Wellbeing } from '@/engine/domain/model';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CABARET_KIND } from '@/engine/systems/school';
import { courseworkOf, type Assignment } from '@/engine/systems/coursework';
import { momentsOf } from '@/engine/systems/classmates';
import { healthOf } from '@/engine/systems/health';
import type { PrepDim } from '@/engine/content/coursework';
import { PERSONALITY_TRAITS, type PersonalityKnob } from '@/engine/content/personality-traits';
import { DESTINATIONS, RAIL_DESTINATIONS } from '@/ui/shell/destinations';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  /** Each useState's setter, numbered in render order, records what it was given, for the next render to apply. */
  calls: 0,
  sets: [] as { at: number; action: unknown }[],
  /** The buttons, selects and inputs a screen drew: their own props, their words, and their first child's words. */
  elements: [] as { type: string; props: Record<string, unknown>; text: string; first: string }[],
  /** Every save `createSave` made, and the config it was given. */
  made: [] as { sim: import('@/engine/core/simulation').Simulation; config: import('@/engine/world/bootstrap').NewSaveConfig }[],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value] = real.useState(initial);
    const at = h.calls++;
    const set = (action: unknown) => { h.sets.push({ at, action }); };
    if (h.states.length === 0) return [value, set];
    const v = h.states.shift();
    return [v === h.keep ? value : v, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepElements = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if ((type === 'button' || type === 'select' || type === 'input') && props) {
      const kids = props.children;
      h.elements.push({ type, props, text: textOf(kids), first: textOf(Array.isArray(kids) ? kids[0] : kids) });
    }
    return make(type, props, ...rest);
  };
  return {
    ...real,
    ...(real.jsx ? { jsx: grab(real.jsx as never), jsxs: grab(real.jsxs as never) } : {}),
    ...(real.jsxDEV ? { jsxDEV: grab(real.jsxDEV as never) } : {}),
  };
};
vi.mock('react/jsx-runtime', async (orig) => keepElements(await orig<Record<string, unknown>>()));
vi.mock('react/jsx-dev-runtime', async (orig) => keepElements(await orig<Record<string, unknown>>()));

// Without the original: it imports the looks, which import it back, and its provider needs a browser. The shell reads
// the route, the breadcrumbs, the toasts and the save's state from it; commands go to the save as the provider's do.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    standingAt: null,
    route: '/home',
    breadcrumbs: [],
    toasts: [],
    saving: false,
    saveError: null,
    unsaved: () => false,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim), GameProvider: ({ children }: { children: unknown }) => children };
});

// The screens' kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});

// The engine's own createSave, with the save it makes kept for the test: SlateApp makes it and keeps it in its state.
vi.mock('@/engine', async (orig) => {
  const real = await orig<typeof import('@/engine')>();
  return {
    ...real,
    createSave: (slot: 1 | 2 | 3, seed: string, config: NewSaveConfig) => {
      const sim = real.createSave(slot, seed, config);
      h.made.push({ sim, config });
      return sim;
    },
  };
});

const { SlateApp } = await import('@/app/SlateApp');
const { CharacterCreation } = await import('@/ui/creation/CharacterCreation');
const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');
const { at: lookAt } = await import('@/ui/looks');
const { resolveLook } = await import('@/ui/looks/registry');

// ---------------------------------------------------------------------------------------------------------------------
// The screens
// ---------------------------------------------------------------------------------------------------------------------

/** What the player reads: the markup with every tag taken out and its entities read. */
const onScreen = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

type Element = (typeof h.elements)[number];
interface Screen { html: string; text: string; elements: Element[]; started: () => NewSaveConfig | undefined }

const STEP = { identity: 0, dispositions: 1, starting: 3, review: 4 } as const;

/**
 * A step of creation as the player has it. TEST SETUP: CharacterCreation's states in render order, the step, the config,
 * and the two it keeps (whether a draft was restored, and the tick a country's arrival gives).
 */
function creation(step: number, config: NewSaveConfig): Screen {
  h.calls = 0;
  h.sets = [];
  h.elements = [];
  h.states = [step, config, h.keep, h.keep];
  let started: NewSaveConfig | undefined;
  const html = renderToStaticMarkup(createElement(CharacterCreation, { slot: 1 as never, onCancel: () => undefined, onStart: (c: NewSaveConfig) => { started = c; } }));
  expect(h.states).toHaveLength(0);
  return { html, text: onScreen(html), elements: [...h.elements], started: () => started };
}
/** TEST SETUP: the config a control's own handler gave the setter at `index`, applied as React would on the next render. */
function applied(config: NewSaveConfig, index: number): NewSaveConfig {
  const set = h.sets.filter((s) => s.at === index);
  expect(set).toHaveLength(1);
  const action = set[0]!.action;
  return typeof action === 'function' ? (action as (c: NewSaveConfig) => NewSaveConfig)(config) : action as NewSaveConfig;
}
const control = (s: Screen, type: string, match: (e: Element) => boolean, what: string): Element => {
  const found = s.elements.find((e) => e.type === type && match(e));
  expect(found, what).toBeDefined();
  return found!;
};
/** A button pressed through its own onClick, on a step drawn from `config`: the config it sets. */
function press(config: NewSaveConfig, s: Screen, first: string): NewSaveConfig {
  const button = control(s, 'button', (e) => e.first === first, `a button “${first}”`);
  h.sets = [];
  (button.props.onClick as () => void)();
  return applied(config, 1);
}
/** A slider moved through its own onChange. */
function slide(config: NewSaveConfig, s: Screen, axis: keyof Personality, value: number): NewSaveConfig {
  const input = control(s, 'input', (e) => e.props.id === `p-${axis}`, `the ${axis} slider`);
  h.sets = [];
  (input.props.onChange as (e: { target: { value: string } }) => void)({ target: { value: String(value) } });
  return applied(config, 1);
}

/**
 * PLAYER JOURNEY: Review read, "I Know SLATE." chosen and Begin pressed; the life made from what Begin hands on as
 * `SlateApp`'s `start` makes it (the guide as chosen and the clock paused), on the test's seed.
 */
function begun(seed: string, config: NewSaveConfig): Simulation {
  const review = creation(STEP.review, config);
  const radios = review.elements.filter((e) => e.type === 'input' && e.props.name === 'guide');
  expect(radios).toHaveLength(2);
  h.sets = [];
  (radios[1]!.props.onChange as () => void)();
  const chosen = applied(config, 1);
  expect(chosen.tutorial).toBe(false);
  const ready = creation(STEP.review, chosen);
  (control(ready, 'button', (e) => e.text === 'Begin', 'Begin').props.onClick as () => void)();
  const started = ready.started();
  expect(started).toEqual(chosen);
  return createSave(1, seed, { ...started!, tutorial: started!.tutorial !== false, paused: true });
}

/** Ada, as Identity leaves her: born in New York, named, she/her; everything else as a new life begins. */
const ada = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** PLAYER JOURNEY: Ada through Dispositions & Traits with one slider moved, and on to Begin. */
function slidTo(seed: string, axis: keyof Personality, value: number): Simulation {
  const base = ada();
  const slid = slide(base, creation(STEP.dispositions, base), axis, value);
  expect(slid).toEqual({ ...base, personality: { ...base.personality, [axis]: value } });
  return begun(seed, slid);
}
/** PLAYER JOURNEY: the config with one trait pressed on Dispositions & Traits, from a page drawn with none held. */
const pressedOnce = (() => {
  const plain = ada();
  let page: Screen | undefined;
  return (name: string): NewSaveConfig => {
    page ??= creation(STEP.dispositions, plain);
    return press(plain, page, name);
  };
})();
/** A life with a trait pressed on the page, or none, begun on a seed. */
const withTrait = (seed: string, name?: string): Simulation => begun(seed, name ? pressedOnce(name) : ada());

const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** An instant in New Haven on Eastern Daylight Time (UTC−4), worked out here, not by the engine. */
const EDT = (year: number, month: number, day: number, hour: number, minute = 0): number => Date.UTC(year, month - 1, day, hour + 4, minute);

/** TEST SETUP: nothing on the calendar that wants the player, canceled by hand. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
/** TEST SETUP: the dials set, and the debt the waking day drains by set to the debt they hold. */
function dials(sim: Simulation, w: Partial<Wellbeing>): void {
  Object.assign(sim.player.wellbeing, w);
  if (w.sleepDebt !== undefined) sim.player.wokeWithDebt = w.sleepDebt;
}
/** TEST SETUP: the clock moved six hours at a time with the body kept fed, rested and awake, as a player's meals and sleep keep it. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}
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
const lookAfter = (sim: Simulation, action: string) => sim.execute<{ doneAt: number; changed: Partial<Wellbeing> }>({ kind: 'life.look_after', payload: { action } });
const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const mine = (sim: Simulation, kind: Account['kind']) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && a.kind === kind && !a.closedAt);
/** What each purchase under a memo cost, in cents: the expense side of its transactions. */
const bought = (sim: Simulation, memo: (m: string) => boolean) => sim.universe.transactions.filter((t) => memo(t.memo))
  .map((t) => t.postings.filter((p) => p.amount > 0).reduce((n, p) => n + p.amount, 0));
const notices = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

/** A source file of the engine's, as written. */
const source = (path: string) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8');

// ---------------------------------------------------------------------------------------------------------------------
// c-disp-ambition
// ---------------------------------------------------------------------------------------------------------------------

/**
 * stressGain at newLifeConfig's emotional stability of 55: 1 − 0.3 × 5/45 + 0.15 × (ambition − 50)/45, bent inside
 * [0.5, 1.8]: at 5, 0.816667 → 0.8212305835; at 95, 1.116667 → 1.1152400722. stressRecovery at 55, 1.033333 bent inside
 * [0.6, 1.5]: 1.0332596653, the same at either end, which ambition doesn't lean.
 */
const AMBITION = { content: 0.8212305835, driven: 1.1152400722, recovery: 1.0332596653 } as const;

describe('c-disp-ambition', () => {
  it('PLAYER JOURNEY: money’s worry, a midnight overdrawn, adds 3.285 stress at Ambition 5 and 4.461 at 95 (4 × the knob), and its 2 of morale alike', () => {
    const midnight = (value: number, overdrawn: boolean) => {
      const sim = slidTo('b10-worry', 'ambition', value);
      expect(sim.player.personality.ambition).toBe(value);
      sim.advanceTo(EDT(2026, 8, 24, 22));
      if (overdrawn) {
        // TEST SETUP: the checking account overdrawn by $100, by a posting against a test equity line.
        const by = -primary(sim).balance - 100_00;
        sim.post({ memo: 'Test', category: 'test', postings: [{ accountId: primary(sim).id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
        expect(primary(sim).balance).toBe(-100_00);
      }
      sim.advanceTo(EDT(2026, 8, 24, 23, 59));
      const before = { ...sim.player.wellbeing };
      sim.advanceTo(EDT(2026, 8, 25, 0, 1));
      return { stress: sim.player.wellbeing.stress - before.stress, morale: sim.player.wellbeing.morale - before.morale, at: before.stress };
    };
    const content = { worried: midnight(5, true), easy: midnight(5, false) };
    const driven = { worried: midnight(95, true), easy: midnight(95, false) };
    // The four come to the midnight alike: ambition leans how stress arrives, and none has arrived since the morning.
    expect(driven.easy.at).toBe(content.easy.at);
    expect(content.worried.at).toBe(content.easy.at);
    // The worry is 4 of stress by the knob (`spending.day`), what the easy twin's midnight doesn't have.
    expect(content.worried.stress - content.easy.stress).toBeCloseTo(4 * AMBITION.content, 9);
    expect(driven.worried.stress - driven.easy.stress).toBeCloseTo(4 * AMBITION.driven, 9);
    expect(4 * AMBITION.content).toBeCloseTo(3.284922334, 9);
    expect(4 * AMBITION.driven).toBeCloseTo(4.4609602888, 9);
    // Its 2 of morale by moraleSwing, which no disposition leans: the same at either end.
    expect(content.worried.morale - content.easy.morale).toBeCloseTo(-2, 9);
    expect(driven.worried.morale - driven.easy.morale).toBeCloseTo(-2, 9);
  });

  it('PLAYER JOURNEY: the bone a first morning’s run breaks adds 6 × the knob, stress 14.300 at Ambition 5 and 16.064 at 95; a run that hurts nothing leaves both at 9.372', () => {
    const ran = (seed: string, value: number) => {
      const sim = slidTo(seed, 'ambition', value);
      const r = lookAfter(sim, 'exercise');
      expect(r.ok, r.error).toBe(true);
      return { stress: sim.player.wellbeing.stress, hurt: notices(sim, 'A Broken Bone').length };
    };
    // From the fresh 18: the hour lived clears 0.35 and the workout 8, each by stressRecovery (8.35 × 1.0332597 =
    // 8.627718), and the break (`mayHurt`, injury.ts) adds 6 × stressGain: 18 − 8.627718 + 4.927384 and + 6.691440.
    const [contentHurt, drivenHurt] = [ran('g09-run-1668', 5), ran('g09-run-1668', 95)];
    expect([contentHurt.hurt, drivenHurt.hurt]).toEqual([1, 1]);
    // To eight places: the knobs are written here to ten, and the run multiplies them by up to 8.35.
    expect(contentHurt.stress).toBeCloseTo(18 - 8.35 * AMBITION.recovery + 6 * AMBITION.content, 8);
    expect(drivenHurt.stress).toBeCloseTo(18 - 8.35 * AMBITION.recovery + 6 * AMBITION.driven, 8);
    expect(contentHurt.stress).toBeCloseTo(14.29966530, 8);
    expect(drivenHurt.stress).toBeCloseTo(16.06372223, 8);
    // The same run on a seed that draws no hurt: the slider moves nothing, for nothing arrived.
    const [contentSound, drivenSound] = [ran('b10-run-sound', 5), ran('b10-run-sound', 95)];
    expect([contentSound.hurt, drivenSound.hurt]).toEqual([0, 0]);
    expect(contentSound.stress).toBeCloseTo(9.3722818, 7);
    expect(drivenSound.stress).toBe(contentSound.stress);
  });

  it('says in the personality header what these lives show ambition leaning: every stress, not only what running on empty costs', () => {
    // The file's first comment, which says what each disposition leans.
    const header = source('src/engine/systems/personality.ts').match(/^\/\*\*[\s\S]*?\*\//)![0].replace(/\s*\*\s*/g, ' ');
    expect(header).toContain('Three of the seven lean a knob');
    expect(header).not.toMatch(/ambition how much running on empty costs/);
    expect(header).toMatch(/ambition[^,;]* every stress/);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// c-disp-openness
// ---------------------------------------------------------------------------------------------------------------------

/** PLAYER JOURNEY: Openness slid on the page, Begin, the term begun, and the Yale Cabaret joined as the School screen joins it. */
function inTheCabaret(seed: string, value: number): Simulation {
  const sim = slidTo(seed, 'openness', value);
  tended(sim, EDT(2026, 9, 2, 12));
  expect(sim.must<{ week: string }>({ kind: 'school.cabaret', payload: {} }).week).toBe('2026-09-24');
  return sim;
}

describe('c-disp-openness', () => {
  it('PLAYER JOURNEY: the Cabaret’s read-through takes openness, 3.6 between 5 and 95; its first curtain, not a rehearsal, moves the two alike, as the page’s “rehearsing new work” and the festival’s curtain have it', () => {
    const company = (value: number) => {
      const sim = inTheCabaret('g28-new-work', value);
      const calls = pendingOf(sim, CABARET_KIND);
      const readThrough = calls.find((i) => i.payload.call === 'rehearsal')!;
      const curtain = calls.find((i) => i.payload.call === 'performance')!;
      // 6 PM Friday 11 September, and 8 PM Thursday 24 September.
      expect([readThrough.at, readThrough.label]).toEqual([EDT(2026, 9, 11, 18), 'Yale Cabaret: Read-Through']);
      expect(curtain.at).toBe(EDT(2026, 9, 24, 20));
      return { rehearsal: across(sim, readThrough), curtain: across(sim, curtain) };
    };
    const [closed, open] = [company(5), company(95)];
    // A rehearsal of new work, DISPOSED.away 2 × (95 − 5)/50: the same two lives differ where the page says they do.
    expect(open.rehearsal.morale - closed.rehearsal.morale).toBeCloseTo(3.6, 9);
    expect(open.rehearsal.stress).toBe(closed.rehearsal.stress);
    expect(open.curtain.stress).toBeCloseTo(closed.curtain.stress, 9);
    // The curtain is a performance, which the page leaves out, and which the Carlotta Festival's curtain doesn't read
    // (tests/evidence-g28-ui.test.ts): the open and the conventional student come off it alike.
    expect(open.curtain.morale - closed.curtain.morale).toBeCloseTo(0, 9);
  });

  it('declares no WorkDay field that no call of enjoyWork sets', () => {
    const enjoyment = source('src/engine/systems/enjoyment.ts');
    const block = enjoyment.match(/export interface WorkDay \{([\s\S]*?)\n\}/)![1]!;
    const declared = [...block.matchAll(/^\s*(\w+)\?:/gm)].map((m) => m[1]!);
    expect(declared).toEqual(expect.arrayContaining(['genres', 'novel', 'rehearsal']));
    // Every call of enjoyWork in the engine and the keys its day is given.
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.tsx?$/.test(name)) files.push(path);
      }
    };
    walk(fileURLToPath(new URL('../src', import.meta.url)));
    const calls = files.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/enjoyWork\(\s*\w+\s*,\s*\{([^}]*)\}/g)].map((m) => m[1]!));
    expect(calls.length).toBeGreaterThan(5);
    const set = new Set(calls.flatMap((c) => [...c.matchAll(/(\w+)\s*:/g)].map((m) => m[1]!)));
    // A declared word nothing sets is read for nothing: `away`, the road, which no day in the game is.
    expect(declared.filter((field) => !set.has(field))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// c-traits
// ---------------------------------------------------------------------------------------------------------------------

/**
 * The knobs, each its trait's number, times the dispositions newLifeConfig's sliders leave (emotional stability and
 * conscientiousness 55, ambition 60: stressGain 1, stressRecovery 1.033333, sleepQuality and energyRecovery 1.011111),
 * bent inside the knob's limits by hand.
 */
const K = {
  recoveryPlain: 1.0332596653, // stressRecovery 1.033333 in [0.6, 1.5]
  detachedGain: 0.8524805473, // stressGain 0.85 in [0.5, 1.8]
  resilientRecovery: 1.2177066610, // stressRecovery 1.2 × 1.033333 = 1.24
  chaoticHygiene: 1.2350736326, // hygieneDrift 1.3 in [0.75, 1.35]
  sentimentalSwing: 1.1393564986, // moraleSwing 1.15 in [0.65, 1.35]
  spenderSpending: 1.2156941679, // spending 1.25 in [0.7, 1.4]
  spenderMeal: 1.1364255057, // mealMood 1.15 in [0.7, 1.3]
  sleepPlain: 1.0111019879, // sleepQuality 1.011111 in [0.75, 1.25]; energyRecovery the same in [0.8, 1.25]
  lightSleeper: 0.8348401227, // sleepQuality 0.8 × 1.011111 = 0.808889
  homebodyEnergy: 1.1404128781, // energyRecovery 1.15 × 1.011111 = 1.162778
  indulgent: 1.0459569607, // appetite 1.05 in [0.9, 1.1]
  resilientToll: 0.6473831208, // illnessToll 0.6 in [0.5, 1.5]
  sharp: 1.0914233737, // morning or evening 1.1 in [0.8, 1.2]
  leans: 1.1364255057, // readsAround, drills, skims, revises 1.15 in [0.8, 1.3]
  detachedWarmth: 0.8544913846, // bondWarmth 0.85 in [0.6, 1.4]
  keepsWound: 1.0981123666, // bondWound 1.1 in [0.6, 1.5]
  restlessCompany: 1.1932621799, // company 1.2 in [0.4, 1.8]
} as const;

/** The knobs these journeys held to their readers, as each passed. */
const HELD = new Set<PersonalityKnob>();

describe('c-traits', () => {
  it('PLAYER JOURNEY: the hours, for a trait pressed on the page: Detached on empty 42.005 for the plain twin’s 42.477, Resilient awake 39.148 for 39.277, Chaotic soiled to 92.096 for 93.6', () => {
    const hours = (name: string | undefined, w: Partial<Wellbeing>, span: number) => {
      const sim = withTrait('b10-hours', name);
      clearCalendar(sim);
      dials(sim, w); // TEST SETUP: the same in both twins.
      sim.advanceBy(span);
      return sim.player.wellbeing;
    };
    // stressGain: on empty from the start, 40 + 2 × (1.6 × k − 0.35 × 1.0332597) (`applyElapsedWellbeing`).
    const empty = { energy: 10, stress: 40 };
    expect(hours(undefined, empty, 2 * MS_HOUR).stress).toBeCloseTo(42.4767182343, 9);
    expect(hours('Detached', empty, 2 * MS_HOUR).stress).toBeCloseTo(40 + 2 * (1.6 * K.detachedGain - 0.35 * K.recoveryPlain), 9);
    expect(hours('Detached', empty, 2 * MS_HOUR).stress).toBeCloseTo(42.0046559857, 9);
    // stressRecovery: with energy left, 40 − 2 × 0.35 × r.
    const awake = { energy: 80, stress: 40 };
    expect(hours(undefined, awake, 2 * MS_HOUR).stress).toBeCloseTo(39.2767182343, 9);
    expect(hours('Resilient', awake, 2 * MS_HOUR).stress).toBeCloseTo(40 - 0.7 * K.resilientRecovery, 9);
    expect(hours('Resilient', awake, 2 * MS_HOUR).stress).toBeCloseTo(39.1476053373, 9);
    // hygieneDrift: four waking hours from 100, 1.6 an hour by the knob.
    const clean = { energy: 80, hygiene: 100 };
    expect(hours(undefined, clean, 4 * MS_HOUR).hygiene).toBeCloseTo(93.6, 9);
    expect(hours('Chaotic', clean, 4 * MS_HOUR).hygiene).toBeCloseTo(100 - 6.4 * K.chaoticHygiene, 9);
    expect(hours('Chaotic', clean, 4 * MS_HOUR).hygiene).toBeCloseTo(92.0955287514, 9);
    for (const knob of ['stressGain', 'stressRecovery', 'hygieneDrift'] as const) HELD.add(knob);
  });

  it('PLAYER JOURNEY: the meal, through life.look_after: Sentimental lifted 2.279 for the plain twin’s 2, Spender charged $6.08 for $5.00 and lifted 2.273', () => {
    const meal = (name?: string) => {
      const sim = withTrait('b10-meal', name);
      clearCalendar(sim); // TEST SETUP
      sim.player.wellbeing.nourishment = 30; // TEST SETUP: hungry, so the meal is a whole one of 50.
      const ate = lookAfter(sim, 'eat');
      expect(ate.ok, ate.error).toBe(true);
      return { lift: ate.value!.changed.morale!, paid: bought(sim, (m) => m === 'A meal') };
    };
    const [plain, sentimental, spender] = [meal(), meal('Sentimental'), meal('Spender')];
    // A meal of 50 lifts the mood 0.04 a point by moraleSwing and mealMood: 2 for the plain twin.
    expect(plain.lift).toBeCloseTo(2, 9);
    expect(sentimental.lift).toBeCloseTo(2 * K.sentimentalSwing, 9);
    expect(sentimental.lift).toBeCloseTo(2.2787129972, 9);
    expect(spender.lift).toBeCloseTo(2 * K.spenderMeal, 9);
    // New Haven's $4 meal at its 127 cost of living, to the whole dollar: $5.00; at the spender's 1.2157, 607.8 → 608.
    expect(plain.paid).toEqual([500]);
    expect(sentimental.paid).toEqual([500]);
    expect(spender.paid).toEqual([608]);
    for (const knob of ['moraleSwing', 'mealMood', 'spending'] as const) HELD.add(knob);
  });

  it('PLAYER JOURNEY: the night, through life.sleep at 11 PM: a Light Sleeper sleeps 0.624 deep for the plain twin’s 0.756, and a Homebody at the plain depth is put back 1.1279 of the plain twin’s energy', () => {
    const night = (name?: string) => {
      const sim = withTrait('b10-night', name);
      clearCalendar(sim); // TEST SETUP
      sim.advanceTo(EDT(2026, 8, 24, 23));
      // TEST SETUP: the same dials in every twin at bedtime.
      dials(sim, { energy: 30, stress: 30, sleepDebt: 10, morale: 62, condition: 88, fitness: 50, nourishment: 75, hygiene: 80 });
      const r = sim.execute<{ quality: number; recovered: number }>({ kind: 'life.sleep', payload: { hours: 6 } });
      expect(r.ok, r.error).toBe(true);
      return r.value!;
    };
    const [plain, light, homebody] = [night(), night('Light Sleeper'), night('Homebody')];
    // The night's depth is (0.82 − 0.24 × 30/100) × sleepQuality: 0.748 × 1.0111020 and 0.748 × 0.8348401.
    expect(plain.quality).toBeCloseTo(0.748 * K.sleepPlain, 9);
    expect(plain.quality).toBeCloseTo(0.7563042869, 9);
    expect(light.quality).toBeCloseTo(0.6244604118, 9);
    expect(homebody.quality).toBeCloseTo(plain.quality, 9);
    // What it puts back goes with the depth times energyRecovery, the rest of the night alike.
    expect(homebody.recovered / plain.recovered).toBeCloseTo(K.homebodyEnergy / K.sleepPlain, 9);
    expect(homebody.recovered / plain.recovered).toBeCloseTo(1.1278910454, 9);
    expect(light.recovered / plain.recovered).toBeCloseTo(K.lightSleeper / K.sleepPlain, 9);
    for (const knob of ['sleepQuality', 'energyRecovery'] as const) HELD.add(knob);
  });

  it('PLAYER JOURNEY: the first midnight weighs an Indulgent student 101.010 kg where the plain twin stays at 101, and a bone broken on the first morning’s run mends in 28 days for a Resilient one where the plain twin’s takes 43', () => {
    const weighed = (name?: string) => {
      const sim = withTrait('g09-probe', name);
      expect(sim.player.body!.weightKg).toBe(101);
      sim.advanceTo(EDT(2026, 8, 25, 0, 1));
      return sim.player.body!.weightKg;
    };
    // The day's habit, 2,726.18 kcal, by the appetite: × (1.0459570 − 1) = +125.29 kcal, over Hall's 12,585 kcal a
    // kilogram (23.9 a day over a 365-day half-life) = +0.00996 kg, kept to the gram.
    expect(weighed()).toBe(101);
    expect(weighed('Indulgent')).toBe(101.01);
    const mends = (name?: string) => {
      const sim = withTrait('g09-run-1668', name);
      const r = lookAfter(sim, 'exercise');
      expect(r.ok, r.error).toBe(true);
      const injury = healthOf(sim.player).injury!;
      expect(injury.kind).toBe('fracture');
      return (injury.until - injury.at) / MS_DAY;
    };
    // The draw is 43 days for the plain body, somewhere in [42.5, 43.5); by 0.6473831 that is [27.51, 28.16): 28.
    expect(mends()).toBe(43);
    expect(mends('Resilient')).toBe(28);
    expect(42.5 * K.resilientToll).toBeGreaterThan(27.5);
    expect(43.5 * K.resilientToll).toBeLessThan(28.5);
    for (const knob of ['appetite', 'illnessToll'] as const) HELD.add(knob);
  });

  it('PLAYER JOURNEY: the work, through school.prepare: an Early Riser’s 9 AM read and a Night Owl’s 7 PM read go 1.0914 times the plain twin’s, and each way of preparing moves its own part 1.1364 times and the other three alike', () => {
    /** TEST SETUP: the same seven dials in every twin before a step, so readiness is alike and only the trait differs. */
    const ready = (sim: Simulation) => {
      dials(sim, { energy: 80, stress: 20, sleepDebt: 0, nourishment: 70, morale: 60, hygiene: 90, condition: 100 });
      // And the four abilities a step reads at 50, where each speeds it by exactly 1 (`stepSpeed`, from 2026-10-16): until
    // then no step read an ability, and a twin's grew apart a hair by the day the step is taken.
      Object.assign(attributesOf(sim, sim.player), { focus: 50, imagination: 50, adaptability: 50 }); sim.player.craft!.memorization = 50;
    };
    const step = (sim: Simulation, a: Assignment, activity: string, dim: PrepDim) => {
      ready(sim);
      expect(a.prep[dim]).toBe(0);
      const r = sim.execute<{ moved: number; dim: string }>({ kind: 'school.prepare', payload: { assignmentId: a.id, activity } });
      expect(r.ok, r.error).toBe(true);
      expect(r.value!.dim).toBe(dim);
      expect(a.prep[dim]).toBe(r.value!.moved);
      return r.value!.moved;
    };
    /** The first scene read at an hour of Saturday 5 September. */
    const readAt = (name: string | undefined, hour: number) => {
      const sim = withTrait('g09-hours', name);
      sim.advanceTo(EDT(2026, 9, 5, hour));
      const a = courseworkOf(sim, sim.player)!.assignments[0]!;
      expect(a.template).toBe('scene-study');
      return step(sim, a, 'read', 'familiarity');
    };
    expect(readAt('Early Riser', 9) / readAt(undefined, 9)).toBeCloseTo(K.sharp, 9);
    expect(readAt('Night Owl', 19) / readAt(undefined, 19)).toBeCloseTo(K.sharp, 9);
    expect(K.sharp).toBeCloseTo(1.0914233737, 9);
    HELD.add('morning');
    HELD.add('evening');

    // At 4:05 PM, nobody's hour, the first scene read and learned and the speech drill transcribed; in a life of its
    // own, the scene shown with nothing prepared on Tuesday 8 September, its note read and worked on at 6:05 PM.
    const prepared = (name?: string): Record<'familiarity' | 'memorization' | 'interpretation' | 'revision', number> => {
      const sim = withTrait('g09-hours', name);
      sim.advanceTo(EDT(2026, 9, 5, 16, 5));
      const work = courseworkOf(sim, sim.player)!.assignments;
      expect([work[0]!.template, work[2]!.template]).toEqual(['scene-study', 'speech-drill']);
      const familiarity = step(sim, work[0]!, 'read', 'familiarity');
      const memorization = step(sim, work[0]!, 'learn', 'memorization');
      const interpretation = step(sim, work[2]!, 'transcribe', 'interpretation');
      const shown = withTrait('g09-hours', name);
      shown.advanceTo(EDT(2026, 9, 8, 18, 5));
      const scene = courseworkOf(shown, shown.player)!.assignments[0]!;
      expect(scene.status).toBe('revising');
      expect(shown.execute({ kind: 'school.read_feedback', payload: { assignmentId: scene.id } }).ok).toBe(true);
      return { familiarity, memorization, interpretation, revision: step(shown, scene, 'revise', 'revision') };
    };
    const plain = prepared();
    const ways = { familiarity: ['Scattered', 'skims'], memorization: ['Single Minded', 'drills'], interpretation: ['Curious', 'readsAround'], revision: ['Self Critical', 'revises'] } as const;
    for (const dim of Object.keys(ways) as (keyof typeof ways)[]) {
      const moved = prepared(ways[dim][0]);
      for (const d of Object.keys(ways) as (keyof typeof ways)[]) expect(moved[d] / plain[d], `${ways[dim][0]} on ${d}`).toBeCloseTo(d === dim ? K.leans : 1, 9);
      HELD.add(ways[dim][1]);
    }
  });

  it('PLAYER JOURNEY: the classmates: Detached warmed 2.563 for helping Maya where the plain twin warms 3, Keeps Accounts cut 3.294 for Imani’s evening slept through where the plain twin is cut 3, and Restless lifted 1.580 more by a friend in the Carlotta cast than by none, the plain twin 1', () => {
    /** Maya asks for help on Thursday 3 September; answered at 5 PM through school.respond. */
    const helped = (name?: string) => {
      const sim = withTrait('g09-probe', name);
      sim.advanceTo(EDT(2026, 9, 3, 9, 30));
      const open = momentsOf(courseworkOf(sim, sim.player)!).filter((m) => m.status === 'open');
      expect(open.map((m) => [m.kind, sim.player.school!.classmates[m.mate]!.name.split(' ')[0]])).toEqual([['help', 'Maya']]);
      sim.advanceTo(EDT(2026, 9, 3, 17));
      const mate = sim.player.school!.classmates[open[0]!.mate]!;
      const before = mate.bond ?? 0;
      expect(sim.execute({ kind: 'school.respond', payload: { momentId: open[0]!.id, choice: 'help' } }).ok).toBe(true);
      return { sim, moved: mate.bond! - before };
    };
    expect(helped().moved).toBe(3);
    expect(helped('Detached').moved).toBeCloseTo(3 * K.detachedWarmth, 9);
    expect(3 * K.detachedWarmth).toBeCloseTo(2.5634741538, 9);
    HELD.add('bondWarmth');

    /** Imani asks to run lines at 7 PM on Thursday 10 September; said yes to, and slept through from six. */
    const missed = (name?: string) => {
      const { sim } = helped(name);
      sim.advanceTo(EDT(2026, 9, 9, 9, 30));
      const open = momentsOf(courseworkOf(sim, sim.player)!).filter((m) => m.status === 'open');
      expect(open.map((m) => [m.kind, m.when])).toEqual([['study', EDT(2026, 9, 10, 19)]]);
      const imani = sim.player.school!.classmates[open[0]!.mate]!;
      expect(imani.name.split(' ')[0]).toBe('Imani');
      expect(sim.execute({ kind: 'school.respond', payload: { momentId: open[0]!.id, choice: 'yes' } }).ok).toBe(true);
      sim.advanceTo(EDT(2026, 9, 10, 18));
      const before = imani.bond ?? 0;
      expect(sim.execute({ kind: 'life.sleep', payload: { hours: 3 } }).ok).toBe(true);
      sim.advanceTo(EDT(2026, 9, 10, 22));
      expect(notices(sim, 'Imani Waited For You')).toHaveLength(1);
      return imani.bond! - before;
    };
    expect(missed()).toBe(-3);
    expect(missed('Keeps Accounts')).toBeCloseTo(-3 * K.keepsWound, 9);
    expect(-3 * K.keepsWound).toBeCloseTo(-3.2943370998, 9);
    HELD.add('bondWound');

    /** The Carlotta Festival's first night, 8 PM Tuesday 4 May 2027, with a friend in the cast and without. */
    const CURTAIN = EDT(2027, 5, 4, 20);
    const night = (name?: string) => {
      const sim = withTrait('g09-cast', name);
      sim.advanceTo(CURTAIN - 1);
      expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.at === CURTAIN && i.kind === 'school.call' && i.payload.call === 'performance')).toBe(true);
      const [withFriend, without] = [reload(sim), reload(sim)];
      const cast = withFriend.player.school!.casting!.cast!;
      expect(cast.every((c) => (withFriend.player.school!.classmates.find((m) => m.name === c.name)!.bond ?? 0) < 25)).toBe(true);
      withFriend.player.school!.classmates.find((m) => m.name === cast[0]!.name)!.bond = 30; // TEST SETUP: a friend
      const lift = (s: Simulation) => { const m = s.player.wellbeing.morale; s.advanceTo(CURTAIN + 1); expect(s.player.school!.casting!.performed).toBe(1); return s.player.wellbeing.morale - m; };
      return lift(withFriend) - lift(without);
    };
    // A friend is a point by the company knob; a cast without one costs 2 × (k − 1) of somebody who needs company more.
    expect(night()).toBeCloseTo(1, 9);
    expect(night('Restless')).toBeCloseTo(K.restlessCompany + 2 * (K.restlessCompany - 1), 9);
    expect(K.restlessCompany + 2 * (K.restlessCompany - 1)).toBeCloseTo(1.5797865397, 9);
    HELD.add('company');
  });

  // Until 2026-10-14 this held every knob but `receipts`, which multiplied the work's costs a return deducted, where the
  // one writer of those costs (`recordJobCost`) was called by nothing. The owner had the knob go that day, with it.
  it('holds every knob a trait declares to a reader in the journeys above', () => {
    const declared = new Set(PERSONALITY_TRAITS.flatMap((t) => Object.keys(t.systemMods ?? {}) as PersonalityKnob[]));
    expect([...declared].filter((k) => !HELD.has(k)).sort()).toEqual([]);
    expect([...HELD].filter((k) => !declared.has(k))).toEqual([]);
    expect(HELD.size).toBe(19);
  });

  // Until 2026-10-14 both said its receipts decided nothing for a student; the knob went that day.
  it('says of Keeps Accounts on Dispositions & Traits what its own look says: how a slight cuts, and no receipt', () => {
    const sim = withTrait('b10-accounts', 'Keeps Accounts');
    expect(sim.player.personalityTraits).toEqual(['keeps_accounts']);
    h.sim = sim;
    h.calls = 0;
    h.states = [];
    const found = resolveLook(sim, lookAt('trait', 'keeps_accounts'));
    if (!found || 'gone' in found) throw new Error('the Keeps Accounts look didn’t resolve');
    const look = onScreen(renderToStaticMarkup(createElement('div', null, found.body)));
    expect(look).toContain('How hard a slight from a classmate cuts');
    expect(look).not.toMatch(/receipt|deduct/i);
    const page = creation(STEP.dispositions, ada()).text;
    // The page names no deduction, and says the slight among what the traits change.
    expect(page).not.toMatch(/Keeps Accounts how much|deduct/);
    expect(page).toContain('how you warm to classmates, and how much a slight from one hurts');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// c-wealth and c-tutorial: SlateApp itself
// ---------------------------------------------------------------------------------------------------------------------

const saved: SaveUniverse[] = [];
const adapter = { save: async (universe: SaveUniverse) => { saved.push(universe); }, listSlots: async () => [] };
/** CharacterCreation's config is the fourth useState SlateApp's render calls: SlateApp's phase and error, then the step. */
const APP_CONFIG = 3;

/** SlateApp in its Creation phase for slot 1, at a step, with a config. */
function app(step: number, config: NewSaveConfig): Screen {
  h.calls = 0;
  h.sets = [];
  h.elements = [];
  // TEST SETUP: SlateApp's states in render order (the phase, Creation for slot 1; no error), then CharacterCreation's.
  h.states = [{ kind: 'creation', startup: { adapter, slots: [] }, slot: 1 }, h.keep, step, config, h.keep, h.keep];
  const html = renderToStaticMarkup(createElement(SlateApp));
  expect(h.states).toHaveLength(0);
  return { html, text: onScreen(html), elements: [...h.elements], started: () => undefined };
}

/** Begin pressed on SlateApp's Review: the save it makes and hands its adapter, the config, and the phase it goes to. */
async function appBegin(screen: Screen): Promise<{ sim: Simulation; config: NewSaveConfig; phase: unknown }> {
  const made = h.made.length;
  const kept = saved.length;
  const button = control(screen, 'button', (e) => e.text === 'Begin', 'Begin');
  expect(button.props.disabled).toBe(false);
  h.sets = [];
  (button.props.onClick as () => void)();
  await vi.waitFor(() => expect(h.sets.filter((s) => s.at === 0)).toHaveLength(1));
  expect(saved.length).toBe(kept + 1);
  // SlateApp's error state (its second useState) was never set: the save was made.
  expect(h.sets.filter((s) => s.at === 1)).toEqual([]);
  expect(h.made.length).toBe(made + 1);
  expect(saved[kept]).toBe(h.made[made]!.sim.universe);
  return { ...h.made[made]!, phase: h.sets.find((s) => s.at === 0)!.action };
}

/**
 * SlateApp in the phase Begin set, as React draws it next: the game shell over the save. TEST SETUP: the browser's
 * address, at Home, which the help the shell holds reads for an entry it names.
 */
function playing(phase: unknown, sim: Simulation): Screen {
  h.sim = sim;
  h.calls = 0;
  h.sets = [];
  h.elements = [];
  h.states = [phase, h.keep];
  const g = globalThis as { window?: unknown };
  g.window = { location: { hash: '#/home' } };
  try {
    const html = renderToStaticMarkup(createElement(SlateApp));
    expect(h.states).toHaveLength(0);
    return { html, text: onScreen(html), elements: [...h.elements], started: () => undefined };
  } finally {
    delete g.window;
  }
}

/** A screen by its route, as the shell's router opens it over a save: the screen, or Locked where its chapter isn't read. */
function screenAt(sim: Simulation, route: string): string {
  h.sim = sim;
  h.calls = 0;
  h.states = [];
  return renderToStaticMarkup(createElement(WorkspaceRouter, { route }));
}

describe('c-wealth', () => {
  it('PLAYER JOURNEY: comes from a wealthy family, with its money in the bank, and has no birthplace chosen for it: Identity asks for one, Begin opens $92,391 and $413,043 at Chase, and the term’s Yale Health plan, $1,882, comes out of that checking at 9 AM', async () => {
    // No birthplace chosen: Identity, drawn from a new life's own config, asks for one and holds Continue.
    expect(newLifeConfig().homeRegionId).toBe('');
    const identity = creation(STEP.identity, { ...newLifeConfig(), firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    expect(identity.text).toContain('Choose the town or city you were born in.');
    expect(control(identity, 'button', (e) => e.text === 'Continue', 'Continue').props.disabled).toBe(true);
    const born = creation(STEP.identity, ada());
    expect(born.text).not.toContain('Choose the town or city you were born in.');
    expect(control(born, 'button', (e) => e.text === 'Continue', 'Continue').props.disabled).toBe(false);

    // The family's money, said on Starting Point, with what the term takes of it.
    const point = app(STEP.starting, ada());
    expect(point.text).toContain('Checking $92,391');
    expect(point.text).toContain('Savings $413,043');
    expect(point.text).toContain('Each fall and spring, $1,882.00 comes out of your bank for that term’s Yale Health plan, and there’s no aid for living costs.');
    const { sim, config } = await appBegin(app(STEP.review, ada()));
    expect(config.family).toBe('wealthy');
    expect(sim.player.family).toBe('wealthy');
    // In the bank: 85,000 € and 380,000 € at SLATE's 0.92 € to the dollar, to the whole dollar.
    expect([primary(sim).institution, primary(sim).balance]).toEqual(['Chase', 92_391_00]);
    expect(mine(sim, 'savings').map((a) => [a.name, a.balance])).toEqual([['Chase Savings', 413_043_00]]);
    // The fall term begins at 9 AM: Yale Health's 2026–27 student plan, $3,764 a year, half a term, from that checking.
    sim.advanceTo(EDT(2026, 8, 24, 9, 1));
    expect(bought(sim, (m) => m.startsWith('Yale Health plan'))).toEqual([1_882_00]);
    expect(primary(sim).balance).toBe(92_391_00 - 1_882_00);
    expect(mine(sim, 'savings')[0]!.balance).toBe(413_043_00);
  });

  it('PLAYER JOURNEY: charges the term’s Yale Health plan when the money has been moved to savings before 9 AM: owed, not dropped', () => {
    const term = (moved: boolean) => {
      const sim = begun('b10-plan', ada());
      if (moved) {
        // Money's own move, at 7:30 on the first morning: everything in checking into savings.
        const r = sim.execute<{ moved: number }>({ kind: 'bank.transfer', payload: { fromId: primary(sim).id, toId: mine(sim, 'savings')[0]!.id, amount: primary(sim).balance } });
        expect(r.ok, r.error).toBe(true);
        expect(r.value!.moved).toBe(92_391_00);
      }
      sim.advanceTo(EDT(2026, 8, 24, 9, 1));
      return bought(sim, (m) => m.startsWith('Yale Health plan')).reduce((a, b) => a + b, 0);
    };
    const [kept, moved] = [term(false), term(true)];
    expect(kept).toBe(1_882_00);
    // The same term, the same plan: where the bank can't pay it, it's owed, as every other bill the bank can't pay.
    expect(moved).toBe(1_882_00);
  });

  it('PLAYER JOURNEY: the plan the bank couldn’t take is said to be owed, comes out of savings at the next midnight, and on a withdrawal in the first fifteen days of classes comes back, as a plan paid does', () => {
    const term = (moved: boolean) => {
      const sim = begun('b10-plan', ada());
      if (moved) sim.must({ kind: 'bank.transfer', payload: { fromId: primary(sim).id, toId: mine(sim, 'savings')[0]!.id, amount: primary(sim).balance } });
      sim.advanceTo(EDT(2026, 8, 24, 9, 1));
      return sim;
    };
    const [paid, owed] = [term(false), term(true)];
    const owing = (sim: Simulation) => mine(sim, 'loan').filter((a) => a.name === 'Bills Owed').reduce((n, a) => n - a.balance, 0);
    const said = (sim: Simulation) => notices(sim, 'Fall Term 2026 Begins').map((n) => n.body.split('your family’s means rule it out, so ')[1]);
    expect(said(paid)).toEqual(['this term’s Yale Health plan, $1,882.00, was paid from your bank, and living costs are yours.']);
    expect(said(owed)).toEqual(['this term’s Yale Health plan, $1,882.00, and living costs are yours. Your bank couldn’t cover the plan, so it’s owed: it comes out of your bank the first day there’s money for it.']);
    expect([owing(paid), owing(owed)]).toEqual([0, 1_882_00]);
    // The next midnight, what's owed is paid back, out of savings as far as checking can't.
    for (const sim of [paid, owed]) sim.advanceTo(EDT(2026, 8, 25, 0, 1));
    expect(owing(owed)).toBe(0);
    expect(bought(owed, (m) => m === 'Paid back what was owed')).toEqual([1_882_00]);
    // Withdrawn on Tuesday 1 September, the second day of classes: the plan comes back to checking, owed or paid alike.
    const refunds = (sim: Simulation) => {
      sim.advanceTo(EDT(2026, 9, 1, 12));
      sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
      return bought(sim, (m) => m === 'Refund: Yale Health plan, the fall term of 2026, withdrawn');
    };
    expect([refunds(paid), refunds(owed)]).toEqual([[1_882_00], [1_882_00]]);
  });
});

describe('c-tutorial', () => {
  const choose = (config: NewSaveConfig, which: 0 | 1): NewSaveConfig => {
    const review = app(STEP.review, config);
    const radios = review.elements.filter((e) => e.type === 'input' && e.props.name === 'guide');
    expect(radios).toHaveLength(2);
    h.sets = [];
    (radios[which]!.props.onChange as () => void)();
    return applied(config, APP_CONFIG);
  };

  /** The marks of something locked in a screen's markup: a control (`Gated`), a panel (`LockedPanel`), a screen held shut. */
  const locks = (html: string) => ({
    controls: html.split('is-locked').length - 1,
    panels: html.split('panel-locked').length - 1,
    screens: html.split(', Locked<').length - 1,
  });

  it('PLAYER JOURNEY: “I Know SLATE.” chosen and Begin pressed opens the game with no control locked, every destination on the rail and Play shown with the clock paused, no pressed state on it; Play pressed sends it live, and Pause shows, with none either', async () => {
    const chosen = choose(ada(), 1);
    expect(chosen.tutorial).toBe(false);
    const { sim, config, phase } = await appBegin(app(STEP.review, chosen));
    expect([config.tutorial, config.paused]).toEqual([false, true]);
    expect(phase).toMatchObject({ kind: 'playing', sim });

    const shell = playing(phase, sim);
    // Nothing locked: no control, panel or screen, and no lock's word on a control.
    expect(locks(shell.html)).toEqual({ controls: 0, panels: 0, screens: 0 });
    expect(shell.html).not.toContain('lock-word');
    // The rail: every destination it offers, open.
    const rail = shell.elements.filter((e) => e.type === 'button' && e.props.className === 'rail-item').map((e) => e.first);
    expect(rail).toEqual(['Home', ...RAIL_DESTINATIONS.flatMap((g) => g.items.map((i) => i.label))]);
    // Career under Your Work from 2026-10-20 (brief 19), between School and Money; the rail had four destinations until then.
    // The Calendar and Updates were under Your Day for part of 2026-10-23 (brief 23), and Home's again from brief 24 the
    // same day, by Up Next's Open Calendar and Recent Updates' View All Updates.
    expect(rail).toEqual(['Home', 'Player Profile', 'School', 'Career', 'Money', 'Papers']);
    // Time Controls: Play, the clock paused. Its words say what a press does, with no pressed state: until 2026-10-13
    // this held `aria-pressed` true on it, and a screen reader said “Play, pressed” with the clock stopped (WAI-ARIA
    // Authoring Practices, Button pattern: a toggle’s label doesn’t change with its state, and one that changes needs no
    // `aria-pressed`).
    const play = control(shell, 'button', (e) => e.first === 'Play', 'Play');
    expect(play.text).toBe('Play');
    expect(play.props['aria-pressed']).toBeUndefined();
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    (play.props.onClick as () => void)();
    expect(sim.universe.preferences.timeSpeed).toBe('live');
    // Drawn again with the clock live: Pause, and no pressed state either.
    const pause = control(playing(phase, sim), 'button', (e) => e.first === 'Pause', 'Pause');
    expect(pause.text).toBe('Pause');
    expect(pause.props['aria-pressed']).toBeUndefined();
    // Every screen a destination opens, the calendar too, is open.
    const routes = DESTINATIONS.flatMap((g) => g.items.map((i) => i.route));
    // Seven with the Updates from 2026-10-23 (brief 23); six with the Career's from 2026-10-20 (brief 19); five until then.
    expect(routes).toHaveLength(7);
    for (const route of routes) expect(locks(screenAt(sim, route)), route).toEqual({ controls: 0, panels: 0, screens: 0 });
  });

  it('PLAYER JOURNEY: Begin on the default, Guide Me Through It, opens the game with Play locked and the rail holding only Home; Play pressed asks the guide and the clock stays paused', async () => {
    const chosen = choose(ada({ tutorial: false }), 0);
    expect(chosen.tutorial).toBe(true);
    const { sim, phase } = await appBegin(app(STEP.review, chosen));
    expect(sim.universe.tutorial).toEqual({ read: [] });
    const shell = playing(phase, sim);
    // Six controls locked (Play and Sleep among them, and Today's Where You Are and Weather) and three of Home's panels,
    // each opening with its chapter. Until 2026-10-23 (brief 23) four controls and eight panels: Where You Are and the
    // Weather were panels, and Your Affairs' Money, School and Papers lines locked panels too.
    expect(locks(shell.html)).toEqual({ controls: 6, panels: 3, screens: 0 });
    const rail = shell.elements.filter((e) => e.type === 'button' && e.props.className === 'rail-item').map((e) => e.first);
    expect(rail).toEqual(['Home']);
    const play = control(shell, 'button', (e) => e.first === 'Play', 'Play');
    expect(play.text).toBe('PlayLocked');
    expect(String(play.props.className)).toContain('is-locked');
    expect(String(control(shell, 'button', (e) => e.first === 'Sleep', 'Sleep').props.className)).toContain('is-locked');
    h.sets = [];
    (play.props.onClick as () => void)();
    // Pressed, it opens the guide at the chapter that opens it, and the clock isn't moved.
    expect(h.sets.map((x) => x.action)).toEqual(['clock']);
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    for (const route of DESTINATIONS.flatMap((g) => g.items.map((i) => i.route))) expect(locks(screenAt(sim, route)), route).toEqual({ controls: 0, panels: 0, screens: 1 });
  });
});
