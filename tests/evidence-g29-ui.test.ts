/**
 * Evidence for seven rows the review of 2026-10-13 left partial (verification group g29-ui): three choices on the
 * creation screen and four trait knobs. Each gap the review named is closed here through what the player does, the
 * screen rendered as they have it and its own controls pressed, the command it sends, or the clock; and each consequence
 * is read where the row says it's read, against figures worked out here from the rule's own numbers, never asked of the
 * helper the engine computes them with.
 *
 * - `c-wealth`: a new life's money is the wealthy profile's euros at SLATE's 0.92 to the dollar, to the whole dollar:
 *   85,000 € in checking is $92,391, 380,000 € in savings $413,043, a 60,000 € card limit $65,217, and a credit score
 *   of 795. Starting Point shows those four tiles, a draft that asked for "nothing" is made a Nothing family's life
 *   (`newLifeFrom`, from 2026-10-14: until then it was made wealthy all the same, and this test held that) and the
 *   picker isn't drawn on Starting Point (`choosesWealth`: the family is chosen on Genres & Background); Begin opens exactly those accounts at Chase, the net worth on the
 *   save's slot reads $505K, and Money shows the two balances and the card's limit.
 * - `c-bank`: the Your Bank select lists the five US banks for a student born in New York and three for one born in
 *   London (Capital One and Citi open for US persons only, `OPENING`); the select's own change carries Wells Fargo to
 *   Review and Begin opens there, under Wells Fargo's account and card names; a Londoner's Capital One, and a bank id
 *   the build doesn't know, open at Chase; and the bank chosen sets what savings earns, 3.00% at Capital One paying
 *   $237.64 on $413,043 at August's month end where Chase's 0.01% pays $0.79, and what a low month costs, $15 and $5
 *   at Chase, nothing at Wells Fargo for somebody twenty-four (its ages 17 to 24) and nothing at Capital One, as
 *   Money's Statements tab reports the year's bank fees.
 * - `c-tutorial`: Review's "I Know SLATE" radio, then Begin, makes a life with no guide and the clock paused
 *   (SlateApp's `tutorial: config.tutorial !== false, paused: true`), every command and Money's screen open, and a
 *   reload keeps it so; "Guide Me Through It" makes a guided life, paused, that refuses Sleep naming its chapter and
 *   opens Money as Locked (`WorkspaceRouter`). And the guide's own
 *   guard, not one installed by hand, holds a decision's button: a student born in London, with the first five chapters
 *   read, is asked on 1 February 2027 to file her 2026 return, and "File It" is refused until “Cover, Benefits And
 *   Returns” is read, across a reload, and then files it once.
 * - `trait-stressGain`: highly strung (1.35 → 1.3185 inside [0.5, 1.8]) and detached (0.85 → 0.8525) against a plain
 *   twin, at all six of the knob's readers: two hours on an empty tank (`applyElapsedWellbeing`, 1.6 an hour), the
 *   injury a first morning's run brings (`mayHurt`, 6), nerves before a first Cabaret performance (`nerves`,
 *   6·(1 − composure/100), as the School screen's Your Composure says it to the tenth), the fall evaluation's concern
 *   (`feel`, 3), a rival's lead on the spring cast list (`castListRead`, 1.5 a lead), and a midnight overdrawn
 *   (`spending.day`, 4), once a midnight and the same after a reload.
 * - `trait-stressRecovery`: resilient (1.2 → 1.1864 inside [0.6, 1.5]) and burns out (0.78 → 0.7941) against a plain
 *   twin: three waking hours clear 0.35 an hour, an hour over the overwrought line costs condition 0.25 for as long as
 *   the knob keeps stress there, and `life.look_after` takes 10 off for an hour unwinding and 8 for a workout, each
 *   times the knob, the right way round, and the same after a reload.
 * - `trait-sleepQuality`: light sleeper (0.8 → 0.8294 inside [0.75, 1.25]) and sleeps anywhere (1.18 → 1.1510): six
 *   hours of `life.sleep` from 11 PM at stress 30 sleep at 0.748 times the knob, and put back energy and clear stress
 *   and debt by it; a night nobody chose, from midnight, lies in by 1/√k and still puts back √k of a plain night; and
 *   the Sleep dialog asks 10 hours of a light sleeper, saying they don't sleep deeply, and 8 of one who sleeps anywhere
 *   (`suggestedSleep`), and its button sleeps the ten.
 * - `trait-energyRecovery`: homebody (1.15 → 1.1320 inside [0.8, 1.25]) and restless (0.9 → 0.9065): the same six
 *   hours put back 1.1320 and 0.9065 of a plain twin's energy; the same two hours leave the homebody fit to train and
 *   the restless twin refused in `SPENT`'s words; a night nobody chose puts back √0.9065 of a plain one for the
 *   restless, who lie in for it; and the Sleep dialog asks 8 hours of a homebody and 9.5 of somebody restless, saying a
 *   night puts back less for them (`suggestedSleep`'s restores), and its button sleeps the nine and a half.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity, which `newLifeConfig` leaves empty) and an actor at Yale in New Haven, starting Monday 24 August
 * 2026 at 7:30 AM; for the F-1 paths, the same life born in London. The creation screen is the game's own: SlateApp in
 * its Creation phase for slot 1, rendered with react-dom/server, its Begin pressed through the component's own onClick
 * and the save it makes, the one SlateApp hands its adapter, played on. Money is BankWorkspace over that save. The trait
 * twins are made with every disposition at the middle, as the sliders can set them, so each knob is its trait's number
 * bent inside the knob's limits (`exp(L·tanh(ln v / L))`, worked here by hand), and played by the clock and the commands
 * on the first day, or on to where the knob is read: the Cabaret's first performance in September, joined from the
 * School screen once the term has begun; the fall evaluation in December; the spring term's first day, Monday 4
 * January 2027. The decision journey plays the clock to Monday 1 February 2027, when the tax season comes.
 * Seeds: g09-run-1668 (found by g09-life) for a first morning's run that breaks a bone, kept for what the clock draws on
 * it; g29-sg-term in place of g29-sg-cast, on which the plain twin's life ended on 25 December 2026 at the life table's
 * draw (`systems/mortality.ts`) and its clock stopped short of the cast list.
 *
 * TEST SETUP, said again where it's done: the calendar cleared of what wants the player before a measured hour or
 * night; the dials set before one (the same in every twin); balances set by a posting against a test equity line (a
 * checking overdrawn, low balances under the fee waivers); every classmate made a rival before the cast list; and on
 * the screens, which a static render can't click to, SlateApp's phase and CharacterCreation's step and config, given
 * through each component's own useState in render order, a draft put in the browser's storage, the config a control's
 * own change handler set, applied as React would on the next render, and the Money screen's kept tab.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import type { Personality, SaveUniverse, Wellbeing } from '@/engine/domain/model';
import { APP_VERSION, newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { instantFromZoned, MS_HOUR } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { netWorth } from '@/engine/systems/finance';
import { CHAPTERS } from '@/engine/content/tutorial';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  /** Each useState's setter, numbered in render order, records what it was given, for the next render to apply. */
  calls: 0,
  sets: [] as { at: number; action: unknown }[],
  /** The buttons, selects and inputs the screen drew, with their own props. */
  elements: [] as { type: string; props: Record<string, unknown>; text: string }[],
  /** Every save `createSave` made, and the config it was given. */
  made: [] as { sim: import('@/engine/core/simulation').Simulation; config: import('@/engine/world/bootstrap').NewSaveConfig }[],
  /** The Money screen's kept tab. */
  tab: undefined as string | undefined,
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
    if ((type === 'button' || type === 'select' || type === 'input') && props) h.elements.push({ type, props, text: textOf(props.children) });
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

// Without the original: it imports the looks, which import it back. SlateApp's provider only wraps the playing phase.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim), GameProvider: ({ children }: { children: unknown }) => children };
});

// The Money screen's kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [(h.tab ?? initial) as T, () => undefined] as const };
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
const { BankWorkspace } = await import('@/ui/workspaces/BankWorkspace');
const { AttributesPanel } = await import('@/ui/components/AttributesPanel');
const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');
const { TimeControls } = await import('@/ui/shell/TimeControls');

// ---------------------------------------------------------------------------
// The creation screen, as SlateApp shows it
// ---------------------------------------------------------------------------

/** What the player reads: the markup with every tag taken out and its entities read. */
const onScreen = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const saved: SaveUniverse[] = [];
const adapter = { save: async (universe: SaveUniverse) => { saved.push(universe); }, listSlots: async () => [] };

/** Creation's steps, as STEPS numbers them. */
const STARTING_POINT = 3;
const REVIEW = 4;
/** CharacterCreation's config is the fourth useState SlateApp's render calls: SlateApp's phase and error, then the step. */
const CONFIG_STATE = 3;

interface Screen { text: string; elements: typeof h.elements }

/** SlateApp in its Creation phase for slot 1, at a step, with a config or (`keep`) the one the component makes itself. */
function creation(step: number, config: NewSaveConfig | typeof h.keep): Screen {
  h.calls = 0;
  h.sets = [];
  h.elements = [];
  // TEST SETUP: SlateApp's states in render order (the phase, Creation for slot 1; no error), then CharacterCreation's
  // (the step, the config, whether a draft was restored, and the tick a country's arrival gives).
  h.states = [{ kind: 'creation', startup: { adapter, slots: [] }, slot: 1 }, h.keep, step, config, h.keep, h.keep];
  const html = renderToStaticMarkup(createElement(SlateApp));
  expect(h.states).toHaveLength(0);
  return { text: onScreen(html), elements: h.elements };
}

/** TEST SETUP: the config a control's change gave CharacterCreation's setter, applied as React would on the next render. */
function nextConfig(config: NewSaveConfig): NewSaveConfig {
  const set = h.sets.filter((s) => s.at === CONFIG_STATE);
  expect(set).toHaveLength(1);
  const action = set[0]!.action;
  return typeof action === 'function' ? (action as (c: NewSaveConfig) => NewSaveConfig)(config) : action as NewSaveConfig;
}

/** Begin pressed, as the player presses it: the save SlateApp makes and hands its adapter, and the config it was made from. */
async function begin(screen: Screen): Promise<{ sim: Simulation; config: NewSaveConfig }> {
  const made = h.made.length;
  const kept = saved.length;
  const button = screen.elements.find((e) => e.type === 'button' && e.text === 'Begin');
  expect(button, 'Begin is drawn').toBeDefined();
  expect(button!.props.disabled).toBe(false);
  (button!.props.onClick as () => void)();
  await vi.waitFor(() => expect(saved.length).toBe(kept + 1));
  // SlateApp's error state (its second useState) was never set: the save was made.
  expect(h.sets.filter((s) => s.at === 1)).toEqual([]);
  expect(h.made.length).toBe(made + 1);
  expect(saved[kept]).toBe(h.made[made]!.sim.universe);
  return h.made[made]!;
}

/** The Money screen over a save, as text, on a tab. */
function money(sim: Simulation, tab?: string): string {
  h.sim = sim;
  h.tab = tab;
  h.calls = 0;
  h.states = [];
  h.elements = [];
  const html = renderToStaticMarkup(createElement(BankWorkspace));
  h.tab = undefined;
  return onScreen(html);
}

/** A screen by its route, as the shell's router opens it over a save: the screen, or Locked where its chapter isn't read. */
function screenAt(sim: Simulation, route: string): string {
  h.sim = sim;
  h.calls = 0;
  h.states = [];
  return onScreen(renderToStaticMarkup(createElement(WorkspaceRouter, { route })));
}

/**
 * The Sleep dialog, open over a save as the top bar draws it, with its hours at what it suggests. TEST SETUP: the bar's
 * states in render order (Sleep open; Skip, its confirmation, and Look After Yourself's two dropdowns shut), then the
 * dialog's own hours kept at its suggestion.
 */
function sleepDialog(sim: Simulation): { text: string; press: () => void } {
  h.sim = sim;
  h.calls = 0;
  h.elements = [];
  h.states = [true, false, null, false, false, h.keep];
  const text = onScreen(renderToStaticMarkup(createElement(TimeControls)));
  expect(h.states).toHaveLength(0);
  const button = h.elements.find((e) => e.type === 'button' && /^Sleep [\d.]+ Hours?$/.test(e.text));
  expect(button, 'the dialog’s Sleep button').toBeDefined();
  return { text, press: button!.props.onClick as () => void };
}

// ---------------------------------------------------------------------------
// Lives
// ---------------------------------------------------------------------------

const ada = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const MIDDLE: Personality = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 };
/** A twin: every disposition at the middle, so a knob is its traits' number alone. */
const twin = (seed: string, traits: string[]): Simulation => createSave(1, seed, ada({ personality: MIDDLE, personalityTraits: traits }));
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 12, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);

const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const mine = (sim: Simulation, kind: Account['kind']) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && a.kind === kind && !a.closedAt);

/** TEST SETUP: nothing on the calendar that wants the player, canceled by hand. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
/** TEST SETUP: the dials set, and the debt the waking day drains by set to the debt they hold. */
function dials(sim: Simulation, w: Partial<Wellbeing>): void {
  Object.assign(sim.player.wellbeing, w);
  if (w.sleepDebt !== undefined) sim.player.wokeWithDebt = w.sleepDebt;
}
/** TEST SETUP: an account's balance set, against a test equity line. */
function setBalance(sim: Simulation, account: Account, to: number): void {
  const by = to - account.balance;
  if (by !== 0) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId: account.id, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}
const lookAfter = (sim: Simulation, action: string) => sim.execute<{ doneAt: number; changed: Partial<Wellbeing> }>({ kind: 'life.look_after', payload: { action } });
const sleep = (sim: Simulation, hours: number) => sim.execute<{ wokeAt: number; quality: number; recovered: number }>({ kind: 'life.sleep', payload: { hours } });

/**
 * The knobs, each its trait's number bent inside the knob's limits by hand, `exp(L·tanh(ln v / L))`, L the log of the
 * limit the lean goes toward (`KNOB_LIMITS`), and every disposition at the middle so they add nothing.
 */
const K = {
  highlyStrung: 1.3184900968, // stressGain 1.35 in [0.5, 1.8]
  detached: 0.8524805473, // stressGain 0.85
  resilient: 1.1864339004, // stressRecovery 1.2 in [0.6, 1.5]
  burnsOut: 0.7940887282, // stressRecovery 0.78
  lightSleeper: 0.8293994450, // sleepQuality 0.8 in [0.75, 1.25]
  sleepsAnywhere: 1.1509917667, // sleepQuality 1.18
  homebody: 1.1319717259, // energyRecovery 1.15 in [0.8, 1.25]
  restless: 0.9064936322, // energyRecovery 0.9
};

/**
 * A chosen night of six hours from 11 PM, from energy 30, stress 30, a debt of 10, morale 62, condition 88 and fitness
 * 50, at twenty-four (born 14 June 2002): the night's quality is (0.82 − 0.24·30/100) = 0.748 times sleepQuality,
 * and the energy it puts back 6·quality·13.5 times the age's 0.995 (a thousandth a year from twenty), the debt's
 * 1 − 10/30·0.62 = 0.79333, the body's 0.8 + 0.2·88/99.8 = 0.97635 (99.8 the condition twenty-four allows: 100 less
 * five years' 0.05, kept to the tenth) and energyRecovery: 46.6952 for a plain night. The stress it clears is
 * 6·quality·4.2 times the mood's 0.75 + 0.4·0.62. Worked first with the ceiling at 99.75, unrounded, the figures were
 * 0.0047 off every night (measured 2026-10-13): `ceilingAt` keeps it to the tenth, and 99.75 rounds to 99.8.
 */
const NIGHT = { quality: 0.748, gain: 46.6951885986, stressCleared: 18.8119008 };
const nightAt11 = (seed: string, traits: string[]): Simulation => {
  const sim = twin(seed, traits);
  clearCalendar(sim);
  sim.advanceTo(at(2026, 8, 24, 23));
  // TEST SETUP: the same dials in every twin at bedtime.
  dials(sim, { energy: 30, stress: 30, sleepDebt: 10, morale: 62, condition: 88, fitness: 50, nourishment: 75, hygiene: 80 });
  return sim;
};

/**
 * A night nobody chose, from midnight, after two hours up from 10 PM at energy 20, stress 30 and a debt of 20: the
 * drain is 3·(1 + 20/48) = 4.25 an hour, so midnight comes at energy 11.5, stress 30.6176 (0.35 an hour cleared to
 * the empty line at 15, then 1.6 − 0.35 an hour on it) and a debt of 20.68. Sound sleep is 7.8 − 0.012·stress = 7.4326
 * hours; the night is that over √(sleepQuality·energyRecovery, each held under 1), at 0.95 of the night's quality,
 * which midnight reads as (0.82 − 0.24·stress/100)·sleepQuality. A plain night puts back 39.6040: 7.4326·0.70919·13.5
 * times the age's 0.995, the debt's 1 − 20.68/30·0.62 and the body's 0.8 + 0.2·88.236/99.8 (midnight's drift
 * having moved condition a fiftieth of the way from 88 to 99.8 first). Read at 7 AM, before a sound sleeper wakes.
 */
const ALONE = { midnight: 11.5, gain: 39.6040060917 };
const nightAlone = (seed: string, traits: string[]): Simulation => {
  const sim = twin(seed, traits);
  clearCalendar(sim);
  sim.advanceTo(at(2026, 8, 24, 22));
  // TEST SETUP: the same dials in every twin at 10 PM, up since the morning.
  dials(sim, { energy: 20, stress: 30, sleepDebt: 20, morale: 62, condition: 88, fitness: 50, nourishment: 75, hygiene: 80 });
  sim.advanceTo(at(2026, 8, 25, 7));
  return sim;
};

// ---------------------------------------------------------------------------
// c-wealth
// ---------------------------------------------------------------------------

describe('c-wealth', () => {
  it('opens the game’s own new life with $92,391 in Chase checking, $413,043 in savings, a $65,217 Chase card owing nothing and a credit score of 795', () => {
    const sim = createSave(1, 'g29-wealth', ada());
    // The wealthy profile's euros at 0.92 € to the dollar, to the whole dollar: 85,000 / 0.92 = 92,391.30,
    // 380,000 / 0.92 = 413,043.48, 60,000 / 0.92 = 65,217.39.
    expect(primary(sim).balance).toBe(92_391_00);
    expect(primary(sim).institution).toBe('Chase');
    expect(mine(sim, 'savings').map((a) => [a.name, a.balance])).toEqual([['Chase Savings', 413_043_00]]);
    expect(mine(sim, 'credit_card').map((a) => [a.name, a.creditLimit, a.balance])).toEqual([['Chase Freedom Unlimited', 65_217_00, 0]]);
    expect(sim.player.credit!.score).toBe(795);
    // Net worth reads the same: $92,391 + $413,043 and nothing owed.
    expect(netWorth(sim, sim.player.id).total).toBe(505_434_00);
  });

  it('shows Starting Point’s tiles as the accounts Begin opens, with no picker, and Money shows the same balances', async () => {
    const config = ada();
    const point = creation(STARTING_POINT, config);
    expect(point.text).toContain('Your Money');
    expect(point.text).toContain('Checking $92,391');
    expect(point.text).toContain('Savings $413,043');
    expect(point.text).toContain('Credit Record 795');
    expect(point.text).toContain('Credit Card $65,217 Limit');
    // The family sets it (`choosesWealth`): no "What You Are Starting With", and no select for it.
    expect(point.text).not.toContain('What You Are Starting With');
    expect(point.elements.some((e) => e.type === 'select' && e.props.id === 'wealth')).toBe(false);

    const review = creation(REVIEW, config);
    expect(review.text).toContain('Checking $92,391');
    expect(review.text).toContain('Savings $413,043');
    expect(review.text).toContain('Card $65,217 limit, nothing owed');
    const { sim } = await begin(review);
    expect(primary(sim).balance).toBe(92_391_00);
    expect(mine(sim, 'savings')[0]!.balance).toBe(413_043_00);
    expect(mine(sim, 'credit_card')[0]!.creditLimit).toBe(65_217_00);
    expect(sim.player.credit!.score).toBe(795);
    // The slot's net worth, as SlateApp's refreshMeta writes it before the save: $505,434, compact.
    expect(sim.universe.meta.netWorthLabel).toBe('$505K');

    const accounts = money(sim);
    expect(accounts).toMatch(/Chase Total Checking .*Balance \$92,391 /);
    expect(accounts).toMatch(/Chase Savings .*Balance \$413,043 /);
    const cards = money(sim, 'cards');
    expect(cards).toContain('Chase Freedom Unlimited');
    expect(cards).toContain('Now $65,217');
  });

  // Until 2026-10-14 this was 'makes a draft that asked for nothing a wealthy life all the same', and held $92,391 and a
  // wealthy family: the draft's family was thrown away. Since then it's the family the player chose (tests/need-paths.test.ts).
  it('makes a draft that asked for nothing a Nothing family’s life, on the screen and in the bank', async () => {
    // TEST SETUP: the browser's storage, holding a draft from this build that says "nothing" and no family.
    const store = new Map<string, string>([['slate.draft.1', JSON.stringify({ build: `${APP_VERSION}/${SAVE_SCHEMA_VERSION}`, config: { ...ada(), wealth: 'nothing', family: undefined } })]]);
    const g = globalThis as { localStorage?: unknown };
    g.localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); } };
    try {
      // 40 € at 0.92 to the dollar, $43, and nothing in savings; no card, and a credit score of 520.
      const point = creation(STARTING_POINT, h.keep);
      expect(point.text).toContain('Checking $43');
      expect(point.text).toContain('Savings $0');
      expect(point.text).not.toContain('Credit Card');
      expect(point.text).not.toContain('What You Are Starting With');
      const { sim, config } = await begin(creation(REVIEW, h.keep));
      expect(config.wealth).toBe('nothing');
      expect(sim.player.family).toBeUndefined();
      expect(primary(sim).balance).toBe(43_00);
      expect(sim.player.credit!.score).toBe(520);
      // Begin cleared the draft.
      expect(store.has('slate.draft.1')).toBe(false);
    } finally {
      delete g.localStorage;
    }
  });
});

// ---------------------------------------------------------------------------
// c-bank
// ---------------------------------------------------------------------------

describe('c-bank', () => {
  const bankSelect = (screen: Screen) => {
    const select = screen.elements.find((e) => e.type === 'select' && e.props.id === 'bank');
    expect(select, 'Your Bank is drawn').toBeDefined();
    const options = [select!.props.children].flat(2) as { props: { value: string; children: unknown } }[];
    return { value: select!.props.value, options: options.map((o) => textOf(o.props.children)), change: select!.props.onChange as (e: unknown) => void };
  };

  it('lists the five US banks to a student born in New York, and the select’s own change opens the life at Wells Fargo', async () => {
    const config = ada();
    const point = creation(STARTING_POINT, config);
    const bank = bankSelect(point);
    // The dearest current account first: Chase and Wells Fargo $15, Bank of America $12, Citi $5, Capital One nothing.
    expect(bank.options).toEqual(['Chase', 'Wells Fargo', 'Bank of America', 'Citi', 'Capital One']);
    expect(bank.value).toBe('us-chase');
    expect(point.text).toContain('Chase Total Checking, $15 a month unless waived. Chase Savings, 0.01% a year.');

    bank.change({ target: { value: 'us-wells-fargo' } });
    const chosen = nextConfig(config);
    expect(chosen.bankId).toBe('us-wells-fargo');
    const again = creation(STARTING_POINT, chosen);
    expect(bankSelect(again).value).toBe('us-wells-fargo');
    expect(again.text).toContain('Everyday Checking, $15 a month unless waived. Way2Save Savings, 0.01% a year.');
    const review = creation(REVIEW, chosen);
    expect(review.text).toContain('Bank Wells Fargo');

    const { sim } = await begin(review);
    expect([primary(sim).institution, primary(sim).name, primary(sim).bankId]).toEqual(['Wells Fargo', 'Everyday Checking', 'us-wells-fargo']);
    expect(mine(sim, 'savings').map((a) => a.name)).toEqual(['Way2Save Savings']);
    expect(mine(sim, 'credit_card').map((a) => [a.name, a.institution])).toEqual([['Wells Fargo Active Cash Card', 'Wells Fargo']]);
    const accounts = money(sim);
    expect(accounts).toContain('Everyday Checking');
    expect(accounts).toContain('Way2Save Savings');
  });

  it('lists three banks to a student born in London, leaving out Capital One and Citi, and opens a Londoner’s Capital One at Chase', async () => {
    const config = ada({ homeRegionId: 'uk-eng-london', bankId: 'us-capital-one' });
    const point = creation(STARTING_POINT, config);
    const bank = bankSelect(point);
    // Capital One and Citi open online for US persons only (`OPENING`); an F-1 student isn't one.
    expect(bank.options).toEqual(['Chase', 'Wells Fargo', 'Bank of America']);
    expect(bank.value).toBe('us-chase');
    expect(creation(REVIEW, config).text).toContain('Bank Chase');
    const { sim } = await begin(creation(REVIEW, config));
    expect(sim.player.citizenshipId).not.toBe('us');
    expect([primary(sim).institution, primary(sim).name]).toEqual(['Chase', 'Chase Total Checking']);
    expect(mine(sim, 'credit_card').map((a) => a.name)).toEqual(['Chase Freedom Unlimited']);
    // The same pick by a student born in New York is taken.
    const us = createSave(1, 'g29-bank-us', ada({ bankId: 'us-capital-one' }));
    expect([primary(us).institution, primary(us).name]).toEqual(['Capital One', '360 Checking']);
    expect(mine(us, 'savings').map((a) => a.name)).toEqual(['360 Performance Savings']);
    expect(mine(us, 'credit_card').map((a) => a.name)).toEqual(['Platinum from Capital One']);
  });

  it('opens at Chase, the country’s first, for a bank id this build doesn’t know', () => {
    // A draft kept from another build can carry an id (`loadDraft` keeps the config's bankId); the screen offers none.
    const sim = createSave(1, 'g29-bank-none', ada({ bankId: 'nonsense' }));
    expect([primary(sim).institution, primary(sim).name]).toEqual(['Chase', 'Chase Total Checking']);
    const f1 = createSave(1, 'g29-bank-f1-citi', ada({ homeRegionId: 'uk-eng-london', bankId: 'us-citi' }));
    expect(primary(f1).institution).toBe('Chase');
  });

  it('pays savings the chosen bank’s rate: $237.64 at Capital One’s 3.00% and $0.79 at Chase’s 0.01% for August’s seven midnights', () => {
    const cap = createSave(1, 'g29-bank-rate', ada({ bankId: 'us-capital-one' }));
    const chase = createSave(1, 'g29-bank-rate', ada());
    cap.advanceTo(at(2026, 9, 1, 1));
    chase.advanceTo(at(2026, 9, 1, 1));
    // A day's interest on $413,043 is the rate over 365: $33.948739 at 3.00%, $0.113162 at 0.01%; seven midnights from
    // 25 August to 31 August build before August's month end at 11 PM on the 31st, paid in whole cents.
    const paid = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo)
      .map((t) => t.postings.find((p) => p.accountId === mine(sim, 'savings')[0]!.id)?.amount);
    expect(paid(cap, 'Interest: 360 Performance Savings')).toEqual([237_64]);
    expect(paid(chase, 'Interest: Chase Savings')).toEqual([79]);
    expect(mine(cap, 'savings')[0]!.balance).toBe(413_043_00 + 237_64);
    expect(mine(chase, 'savings')[0]!.balance).toBe(413_043_00 + 79);
  });

  it('charges the chosen bank’s monthly fees on low balances, and its statements say so: Chase $15 and $5, Wells Fargo nothing at twenty-four, Capital One nothing', () => {
    const low = (bankId: string) => {
      const sim = createSave(1, 'g29-bank-fee', ada({ bankId }));
      // TEST SETUP: $3,000 in checking and $200 in savings on the first morning; the fall's $1,882 Yale Health plan
      // comes out of checking at 9 AM, leaving it under every $1,500 balance waiver.
      setBalance(sim, primary(sim), 3_000_00);
      setBalance(sim, mine(sim, 'savings')[0]!, 200_00);
      sim.advanceTo(at(2026, 9, 1, 1));
      const fees = sim.universe.transactions.filter((t) => t.category === 'bank_fee').map((t) => [t.memo, -t.postings.find((p) => p.amount < 0)!.amount]);
      return { fees, statements: money(sim, 'statements') };
    };
    // chase.com: Total Checking $15 a month unless $500 of electronic deposits, a $1,500 daily balance or a $5,000
    // average across Chase accounts; Chase Savings $5 unless a $300 balance.
    const chase = low('us-chase');
    expect(chase.fees).toEqual([['Monthly fee: Chase Total Checking', 15_00], ['Monthly fee: Chase Savings', 5_00]]);
    expect(chase.statements).toContain('Your Bank Chase');
    expect(chase.statements).toContain('Bank Fees $20.00');
    // wellsfargo.com: Everyday Checking's $15 is waived for ages 17 to 24, and Ada is twenty-four; Way2Save has no fee.
    const wells = low('us-wells-fargo');
    expect(wells.fees).toEqual([]);
    expect(wells.statements).toContain('Your Bank Wells Fargo');
    expect(wells.statements).toContain('Bank Fees $0.00');
    // capitalone.com: 360 Checking has no monthly fee, and neither has 360 Performance Savings.
    const cap = low('us-capital-one');
    expect(cap.fees).toEqual([]);
    expect(cap.statements).toContain('Your Bank Capital One');
    expect(cap.statements).toContain('Bank Fees $0.00');
  });
});

// ---------------------------------------------------------------------------
// c-tutorial
// ---------------------------------------------------------------------------

describe('c-tutorial', () => {
  const radios = (screen: Screen) => screen.elements.filter((e) => e.type === 'input' && e.props.type === 'radio' && e.props.name === 'guide');

  it('makes a life with no guide and the clock paused when Review’s “I Know SLATE” is chosen, every command open, and keeps it so across a reload', async () => {
    const config = ada();
    const review = creation(REVIEW, config);
    expect(review.text.indexOf('Guide Me Through It.')).toBeLessThan(review.text.indexOf('I Know SLATE.'));
    const [guideMe, iKnow] = radios(review);
    // Guide Me Through It is the default.
    expect([guideMe!.props.checked, iKnow!.props.checked]).toEqual([true, false]);
    (iKnow!.props.onChange as () => void)();
    const chosen = nextConfig(config);
    expect(chosen.tutorial).toBe(false);
    const again = creation(REVIEW, chosen);
    expect(radios(again).map((r) => r.props.checked)).toEqual([false, true]);

    const { sim, config: made } = await begin(again);
    // SlateApp's mapping: the guide off as chosen, and the clock paused either way.
    expect([made.tutorial, made.paused]).toEqual([false, true]);
    expect(sim.universe.tutorial).toBeUndefined();
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    // The screens open too: Money, through the router that locks a screen whose chapter isn't read.
    const bank = screenAt(sim, '/workspace/bank');
    expect(bank).toContain('Your Bank Chase');
    expect(bank).not.toContain('Money, Locked');

    const kept = reload(sim);
    expect(kept.universe.tutorial).toBeUndefined();
    expect(kept.universe.preferences.timeSpeed).toBe('paused');
    // Everything open: what the first chapters hold shut in a guided life goes through here.
    expect(kept.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
    expect(kept.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'live' } }).ok).toBe(true);
    expect(kept.universe.preferences.timeSpeed).toBe('live');
    const read = kept.execute({ kind: 'tutorial.read', payload: { chapterId: CHAPTERS[0]!.id } });
    expect(read.ok).toBe(false);
    expect(read.error).toBe('You started without the guide, so everything is already open.');
  });

  it('makes a guided life, paused, when Begin is pressed on the default, and refuses Sleep naming its chapter and the first', async () => {
    const { sim, config } = await begin(creation(REVIEW, ada()));
    expect([config.tutorial, config.paused]).toEqual([true, true]);
    expect(sim.universe.tutorial).toEqual({ read: [] });
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    const refused = sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toBe('Read “Sleep” in the guide first. The chapters open in order, and “Your Life, Hour By Hour” is next: press Guide, at the top of the screen.');
    expect(sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'live' } }).ok).toBe(false);
    expect(sim.universe.preferences.timeSpeed).toBe('paused');
    // And Money opens as Locked, naming its chapter.
    const bank = screenAt(sim, '/workspace/bank');
    expect(bank).toContain('Money, Locked');
    expect(bank).toContain('Read “Your Bank” in the guide to open it.');
    expect(bank).not.toContain('Your Bank Chase');
  });

  it('holds a decision’s File It shut with the guide’s own guard until “Cover, Benefits And Returns” is read, across a reload, then files the return once', () => {
    // Born in London: an F-1 student files Form 8843 for each year present, so the tax season asks her for one.
    const sim = createSave(1, 'g29-guide-decision', ada({ homeRegionId: 'uk-eng-london', tutorial: true, paused: true }));
    const read = (s: Simulation, id: string) => expect(s.execute({ kind: 'tutorial.read', payload: { chapterId: id } }).ok, id).toBe(true);
    // The first five chapters, to “What Needs You”, which opens the Decision Center's buttons.
    for (const id of ['welcome', 'calendar', 'clock', 'advance', 'needs']) read(sim, id);
    for (let month = 9; month <= 13; month += 1) sim.advanceTo(at(month > 12 ? 2027 : 2026, month > 12 ? 1 : month, 1, 12));
    sim.advanceTo(at(2027, 2, 1, 10));
    const decision = Object.values(sim.universe.decisions).find((d) => d.title === 'Your 2026 Tax Return');
    expect(decision?.actions.map((a) => [a.label, a.commandKind])).toEqual([['File It', 'tax.file']]);
    const take = (s: Simulation) => s.execute({ kind: 'world.take_decision_action', payload: { decisionId: decision!.id, actionIndex: 0 } });

    const held = take(sim);
    expect(held.ok).toBe(false);
    expect(held.error).toBe('Read “Cover, Benefits And Returns” in the guide first. The chapters open in order, and “How You Are” is next: press Guide, at the top of the screen.');
    // The same command given directly is held in the same words.
    expect(sim.execute({ kind: 'tax.file', payload: { year: 2026 } }).error).toBe(held.error);

    const kept = reload(sim);
    const keptDecision = kept.universe.decisions[decision!.id]!;
    expect(keptDecision.resolvedAt).toBeUndefined();
    expect(take(kept).error).toBe(held.error);
    for (const id of CHAPTERS.slice(5, CHAPTERS.findIndex((c) => c.id === 'papers') + 1).map((c) => c.id)) read(kept, id);
    expect(take(kept).ok).toBe(true);
    expect(keptDecision.resolvedAt).toBe(kept.now);
    expect(kept.player.returns?.['2026']?.filedAt).toBe(kept.now);
    const again = take(kept);
    expect(again.ok).toBe(false);
    expect(again.error).toBe('That question is already settled: it was answered, or its date passed.');
  });
});

// ---------------------------------------------------------------------------
// trait-stressGain
// ---------------------------------------------------------------------------

describe('trait-stressGain', () => {
  it('runs an empty tank’s stress up 1.6 an hour times the knob: 43.519 highly strung, 42.5 plain and 42.028 detached after two hours from 40', () => {
    const rise = (traits: string[]) => {
      const sim = twin('g29-sg-empty', traits);
      clearCalendar(sim);
      // TEST SETUP: on empty from the start, the same in every twin.
      dials(sim, { energy: 10, stress: 40 });
      sim.advanceBy(2 * MS_HOUR);
      return sim.player.wellbeing.stress;
    };
    // 40 + (1.6·k − 0.35)·2, the hour's 0.35 cleared as ever (stressRecovery is 1 in all three).
    expect(rise(['highly_strung'])).toBeCloseTo(40 + (1.6 * K.highlyStrung - 0.35) * 2, 6);
    expect(rise([])).toBeCloseTo(42.5, 6);
    expect(rise(['detached'])).toBeCloseTo(40 + (1.6 * K.detached - 0.35) * 2, 6);
  });

  it('adds 6 times the knob when a first morning’s run breaks a bone: stress 17.561 highly strung, 15.65 plain, 14.765 detached', () => {
    const ran = (traits: string[]) => {
      // g09-run-1668: the first morning's run breaks a bone, whatever the trait (`mayHurt` draws on the seed and the hour).
      const sim = twin('g09-run-1668', traits);
      const r = lookAfter(sim, 'exercise');
      expect(r.ok, r.error).toBe(true);
      expect(sim.universe.notifications.filter((n) => n.category === 'health')).toHaveLength(1);
      return sim.player.wellbeing.stress;
    };
    // From the fresh 18: the hour lived clears 0.35, the workout 8, and the injury adds 6·k.
    expect(ran(['highly_strung'])).toBeCloseTo(18 - 0.35 - 8 + 6 * K.highlyStrung, 6);
    expect(ran([])).toBeCloseTo(15.65, 6);
    expect(ran(['detached'])).toBeCloseTo(18 - 0.35 - 8 + 6 * K.detached, 6);
  });

  it('adds 6·(1 − composure/100) times the knob in nerves before a first Cabaret performance, as the Composure panel says: 4.5 highly strung, 3.5 plain, 2.9 detached', () => {
    const nerves = (traits: string[]) => {
      const sim = twin('g29-sg-cabaret', traits);
      // The term begun on the first day of classes, the School screen's Join The Cabaret: a show three weeks or more
      // ahead, its evenings and its five performances.
      sim.advanceTo(at(2026, 8, 31, 18));
      const r = sim.execute<{ week: string }>({ kind: 'school.cabaret', payload: {} });
      expect(r.ok, r.error).toBe(true);
      const first = sim.universe.scheduled.filter((i) => i.kind === 'school.cabaret' && i.payload.call === 'performance').sort((a, b) => a.at - b.at)[0]!;
      sim.advanceTo(first.at - 1);
      // Composure as a life starts it, 25 + 0.35 of emotional stability at the middle: nothing has faced a house yet.
      expect(sim.player.attrs!.composure).toBe(42.5);
      // The School screen's Your Composure, as the player reads it before the curtain.
      h.sim = sim;
      h.states = [];
      const panel = onScreen(renderToStaticMarkup(createElement(AttributesPanel)));
      const before = sim.player.wellbeing.stress;
      sim.advanceTo(first.at);
      expect(sim.player.school!.cabaret!.performed).toBe(1);
      return { rise: sim.player.wellbeing.stress - before, says: panel.match(/Nerves add ([\d.]+) stress before a performance/)?.[1] };
    };
    // 6 · (1 − 42.5/100) = 3.45 at a stressGain of 1; a house is taken as nobody in particular takes it at extraversion
    // fifty, and a new piece of no genre they love lifts nothing. The panel says it to the tenth.
    const hs = nerves(['highly_strung']);
    const plain = nerves([]);
    const detached = nerves(['detached']);
    expect(hs.rise).toBeCloseTo(3.45 * K.highlyStrung, 5);
    expect(plain.rise).toBeCloseTo(3.45, 5);
    expect(detached.rise).toBeCloseTo(3.45 * K.detached, 5);
    expect([hs.says, plain.says, detached.says]).toEqual(['4.5', '3.5', '2.9']);
  });

  it('adds 3 times the knob when the fall’s evaluation brings a concern, and 1.5 for each rival’s lead on the spring’s cast list', () => {
    const term = (traits: string[]) => {
      const sim = twin('g29-sg-term', traits);
      sim.advanceTo(at(2026, 12, 1));
      const due = (kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at)[0]!;
      // The fall's evaluation, played to by the clock alone: a student on autopilot shows unready work in class.
      const evaluation = due('school.evaluation');
      sim.advanceTo(evaluation.at - 1);
      expect(sim.player.school!.standing).toBe('good');
      const beforeEvaluation = sim.player.wellbeing.stress;
      sim.advanceTo(evaluation.at);
      expect(sim.player.school!.standing).toBe('concern');
      const concern = sim.player.wellbeing.stress - beforeEvaluation;
      // The spring term's first day, when the chair's cast list goes up.
      const spring = due('school.term');
      sim.advanceTo(spring.at - 1);
      // TEST SETUP: every classmate a rival (a bond of −60, past the −20 that makes one), so any lead a classmate is
      // given on the list is a rival's.
      for (const mate of sim.player.school!.classmates) mate.bond = -60;
      const beforeList = sim.player.wellbeing.stress;
      sim.advanceTo(spring.at);
      expect(sim.universe.meta.endedAt).toBeUndefined();
      const leads = (sim.player.school!.around?.list ?? []).filter((one) => one.size === 'lead' && one.name !== 'You').length;
      expect(leads).toBeGreaterThan(0);
      return { concern, leads, list: sim.player.wellbeing.stress - beforeList };
    };
    // TURNS.concern, 3, and CAST_LIST.rivalLead, 1.5 a rival's lead, each times stressGain.
    const hs = term(['highly_strung']);
    const plain = term([]);
    const detached = term(['detached']);
    expect([hs.concern, plain.concern, detached.concern]).toEqual([expect.closeTo(3 * K.highlyStrung, 5), expect.closeTo(3, 5), expect.closeTo(3 * K.detached, 5)]);
    expect(hs.list).toBeCloseTo(hs.leads * 1.5 * K.highlyStrung, 5);
    expect(plain.list).toBeCloseTo(plain.leads * 1.5, 5);
    expect(detached.list).toBeCloseTo(detached.leads * 1.5 * K.detached, 5);
  });

  it('adds 4 times the knob at a midnight overdrawn, once a midnight, and the same after a reload', () => {
    const overdrawn = (traits: string[], seed = 'g29-sg-worry') => {
      const sim = twin(seed, traits);
      clearCalendar(sim);
      sim.advanceTo(at(2026, 8, 24, 23, 30));
      // TEST SETUP: the checking overdrawn by $100, and the dials the same in every twin.
      setBalance(sim, primary(sim), -100_00);
      dials(sim, { energy: 80, stress: 40, nourishment: 90 });
      return sim;
    };
    // An hour across midnight with the player up (no night alone): 0.35 cleared, and the worry 4·k.
    const hs = overdrawn(['highly_strung']);
    const plain = overdrawn([]);
    const detached = overdrawn(['detached']);
    for (const sim of [hs, plain, detached]) sim.advanceBy(MS_HOUR);
    expect(hs.player.wellbeing.stress).toBeCloseTo(40 - 0.35 + 4 * K.highlyStrung, 6);
    expect(plain.player.wellbeing.stress).toBeCloseTo(43.65, 6);
    expect(detached.player.wellbeing.stress).toBeCloseTo(40 - 0.35 + 4 * K.detached, 6);
    // A twin in funds isn't worried.
    const clean = twin('g29-sg-worry', ['highly_strung']);
    clearCalendar(clean);
    clean.advanceTo(at(2026, 8, 24, 23, 30));
    dials(clean, { energy: 80, stress: 40, nourishment: 90 });
    clean.advanceBy(MS_HOUR);
    expect(clean.player.wellbeing.stress).toBeCloseTo(39.65, 6);

    // Kept overdrawn through a reload, the next midnight worries once more, at the same knob.
    const kept = reload(hs);
    setBalance(kept, primary(kept), -100_00);
    kept.advanceTo(at(2026, 8, 25, 23, 30));
    dials(kept, { energy: 80, stress: 40 });
    kept.advanceBy(MS_HOUR);
    expect(kept.player.wellbeing.stress).toBeCloseTo(40 - 0.35 + 4 * K.highlyStrung, 6);
  });
});

// ---------------------------------------------------------------------------
// trait-stressRecovery
// ---------------------------------------------------------------------------

describe('trait-stressRecovery', () => {
  const ready = (seed: string, traits: string[]) => {
    const sim = twin(seed, traits);
    clearCalendar(sim);
    // TEST SETUP: the same dials in every twin, rested and fed, so no tank runs empty.
    dials(sim, { energy: 95, stress: 60, sleepDebt: 0, nourishment: 90, hygiene: 95 });
    return sim;
  };

  it('clears 0.35 an hour times the knob on the clock: 58.754 resilient, 58.95 plain and 59.166 burning out after three hours from 60', () => {
    const after = (traits: string[]) => {
      const sim = ready('g29-sr-clock', traits);
      sim.advanceBy(3 * MS_HOUR);
      return sim.player.wellbeing.stress;
    };
    expect(after(['resilient'])).toBeCloseTo(60 - 1.05 * K.resilient, 6);
    expect(after([])).toBeCloseTo(58.95, 6);
    expect(after(['burns_out'])).toBeCloseTo(60 - 1.05 * K.burnsOut, 6);
  });

  it('costs condition 0.25 an hour over the overwrought line for as long as the knob keeps stress there', () => {
    const condition = (traits: string[]) => {
      const sim = ready('g29-sr-over', traits);
      // TEST SETUP: a point over the line at 75.
      dials(sim, { stress: 76, condition: 88 });
      sim.advanceBy(4 * MS_HOUR);
      return sim.player.wellbeing.condition;
    };
    // Over the line for 1 / (0.35·k) hours: 2.408 resilient, 2.857 plain, 3.598 burning out.
    expect(condition(['resilient'])).toBeCloseTo(88 - 0.25 / (0.35 * K.resilient), 6);
    expect(condition([])).toBeCloseTo(88 - 0.25 / 0.35, 6);
    expect(condition(['burns_out'])).toBeCloseTo(88 - 0.25 / (0.35 * K.burnsOut), 6);
  });

  it('takes 10 times the knob off for an hour unwinding, and 8 for a workout, through Look After Yourself', () => {
    const done = (traits: string[], action: string) => {
      const sim = ready(`g29-sr-${action}`, traits);
      const r = lookAfter(sim, action);
      expect(r.ok, r.error).toBe(true);
      expect(sim.universe.notifications.filter((n) => n.category === 'health')).toEqual([]);
      return { stress: sim.player.wellbeing.stress, changed: r.value!.changed.stress };
    };
    // Unwinding: the hour clears 0.35·k, then 10·k: 47.720 resilient, 49.65 plain, 51.781 burning out.
    const unwound = [done(['resilient'], 'unwind'), done([], 'unwind'), done(['burns_out'], 'unwind')];
    expect(unwound.map((u) => u.changed)).toEqual([expect.closeTo(-10 * K.resilient, 6), expect.closeTo(-10, 6), expect.closeTo(-10 * K.burnsOut, 6)]);
    expect(unwound.map((u) => u.stress)).toEqual([expect.closeTo(60 - 10.35 * K.resilient, 6), expect.closeTo(49.65, 6), expect.closeTo(60 - 10.35 * K.burnsOut, 6)]);
    // A workout: the hour's 0.35·k, then 8·k.
    const trained = [done(['resilient'], 'exercise'), done([], 'exercise'), done(['burns_out'], 'exercise')];
    expect(trained.map((u) => u.changed)).toEqual([expect.closeTo(-8 * K.resilient, 6), expect.closeTo(-8, 6), expect.closeTo(-8 * K.burnsOut, 6)]);
    expect(trained.map((u) => u.stress)).toEqual([expect.closeTo(60 - 8.35 * K.resilient, 6), expect.closeTo(51.65, 6), expect.closeTo(60 - 8.35 * K.burnsOut, 6)]);
  });

  it('keeps the trait’s relief across a save and a load', () => {
    const kept = reload(ready('g29-sr-kept', ['resilient']));
    const r = lookAfter(kept, 'unwind');
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.changed.stress).toBeCloseTo(-10 * K.resilient, 6);
  });
});

// ---------------------------------------------------------------------------
// trait-sleepQuality
// ---------------------------------------------------------------------------

describe('trait-sleepQuality', () => {
  it('sleeps six hours from 11 PM at 0.748 times the knob, and puts back energy and clears stress and debt by it', () => {
    const slept = (traits: string[]) => {
      const sim = nightAt11('g29-sq-night', traits);
      const r = sleep(sim, 6);
      expect(r.ok, r.error).toBe(true);
      return { quality: r.value!.quality, recovered: r.value!.recovered, w: sim.player.wellbeing };
    };
    const light = slept(['light_sleeper']);
    const plain = slept([]);
    const anywhere = slept(['sleeps_anywhere']);
    expect(light.quality).toBeCloseTo(NIGHT.quality * K.lightSleeper, 9);
    expect(plain.quality).toBeCloseTo(0.748, 9);
    expect(anywhere.quality).toBeCloseTo(NIGHT.quality * K.sleepsAnywhere, 9);
    // Energy: 30 + 46.6952·k, so 68.729, 76.695 and 83.746.
    expect(light.w.energy).toBeCloseTo(30 + NIGHT.gain * K.lightSleeper, 6);
    expect(plain.w.energy).toBeCloseTo(30 + NIGHT.gain, 6);
    expect(anywhere.w.energy).toBeCloseTo(30 + NIGHT.gain * K.sleepsAnywhere, 6);
    expect(plain.recovered).toBeCloseTo(NIGHT.gain, 6);
    // Stress: 30 − 18.8119·k, so 14.397, 11.188 and 8.348.
    expect(light.w.stress).toBeCloseTo(30 - NIGHT.stressCleared * K.lightSleeper, 6);
    expect(plain.w.stress).toBeCloseTo(30 - NIGHT.stressCleared, 6);
    expect(anywhere.w.stress).toBeCloseTo(30 - NIGHT.stressCleared * K.sleepsAnywhere, 6);
    // The debt: 1.4 for each effective hour, and 2.2 more for each past five and a half: 4.789, 3.717 and 2.768.
    const debt = (q: number) => 10 - Math.max(0, 6 * q - 5.5) * 2.2 - 6 * q * 1.4;
    expect(light.w.sleepDebt).toBeCloseTo(debt(0.748 * K.lightSleeper), 6);
    expect(plain.w.sleepDebt).toBeCloseTo(3.7168, 6);
    expect(anywhere.w.sleepDebt).toBeCloseTo(debt(0.748 * K.sleepsAnywhere), 6);
  });

  it('lies a light sleeper in by 1/√k on a night nobody chose, and still puts back only √k of a plain night', () => {
    const light = nightAlone('g29-sq-alone', ['light_sleeper']);
    const plain = nightAlone('g29-sq-alone', []);
    const anywhere = nightAlone('g29-sq-alone', ['sleeps_anywhere']);
    // At 7 AM all three are still in bed: a sound sleeper's night runs to 7:25:57.
    expect(plain.player.wellbeing.energy).toBeCloseTo(ALONE.midnight + ALONE.gain, 6);
    expect(light.player.wellbeing.energy).toBeCloseTo(ALONE.midnight + ALONE.gain * Math.sqrt(K.lightSleeper), 6);
    // A good sleeper isn't kept in bed shorter for it, so its night is k of a plain one.
    expect(anywhere.player.wellbeing.energy).toBeCloseTo(ALONE.midnight + ALONE.gain * K.sleepsAnywhere, 6);
    expect(light.player.wellbeing.energy).toBeLessThan(plain.player.wellbeing.energy);
  });

  it('has the Sleep dialog ask 10 hours of a light sleeper, who doesn’t sleep deeply, 9 of a plain twin and 8 of one who sleeps anywhere, and its button sleeps them', () => {
    // The dialog's night, solved for: (24·0.41 + 0.1·owed) / (quality·energyRecovery·age + 0.41), 0.41 a waking hour's
    // share of a normal night (8·0.82 over 16) and owed the debt past a normal day's 5.44, so 10.296 over
    // (0.748·k·0.995 + 0.41): 10.02, 8.92 and 8.13, to the half hour. The reason is the share that stretched it most:
    // the depth's k for a light sleeper, stress's 0.748/0.82 for a plain twin, and none under 1 past eight hours.
    const light = nightAt11('g29-sq-dialog', ['light_sleeper']);
    const plain = nightAt11('g29-sq-dialog', []);
    const anywhere = nightAt11('g29-sq-dialog', ['sleeps_anywhere']);
    const l = sleepDialog(light);
    expect(l.text).toContain('You don’t sleep deeply, so a normal night takes longer.');
    expect(l.text).toContain('Sleep 10 Hours');
    // Pressed: ten hours from 11 PM, each putting back a sixth of six hours' 46.6952, times the knob.
    l.press();
    expect(light.now).toBe(at(2026, 8, 25, 9));
    expect(light.player.wellbeing.energy).toBeCloseTo(30 + NIGHT.gain / 6 * 10 * K.lightSleeper, 6);
    const p = sleepDialog(plain);
    expect(p.text).toContain('Stress is costing you sleep, so a normal night takes longer.');
    expect(p.text).toContain('Sleep 9 Hours');
    const a = sleepDialog(anywhere);
    expect(a.text).toContain('A normal night.');
    expect(a.text).toContain('Sleep 8 Hours');
  });
});

// ---------------------------------------------------------------------------
// trait-energyRecovery
// ---------------------------------------------------------------------------

describe('trait-energyRecovery', () => {
  it('puts back 1.1320 and 0.9065 of a plain twin’s six hours for a homebody and somebody restless, at the same quality', () => {
    const slept = (traits: string[]) => {
      const sim = nightAt11('g29-er-night', traits);
      const r = sleep(sim, 6);
      expect(r.ok, r.error).toBe(true);
      return { quality: r.value!.quality, recovered: r.value!.recovered, energy: sim.player.wellbeing.energy };
    };
    const home = slept(['homebody']);
    const plain = slept([]);
    const restless = slept(['restless']);
    expect([home.quality, restless.quality]).toEqual([expect.closeTo(0.748, 9), expect.closeTo(0.748, 9)]);
    // 30 + 46.6952·k: 82.858, 76.695 and 72.329.
    expect(home.energy).toBeCloseTo(30 + NIGHT.gain * K.homebody, 6);
    expect(plain.energy).toBeCloseTo(30 + NIGHT.gain, 6);
    expect(restless.energy).toBeCloseTo(30 + NIGHT.gain * K.restless, 6);
    expect(home.recovered / plain.recovered).toBeCloseTo(K.homebody, 9);
    expect(restless.recovered / plain.recovered).toBeCloseTo(K.restless, 9);
  });

  it('leaves a homebody fit to train after the same two hours that leave a restless twin refused in SPENT’s words', () => {
    const after = (traits: string[]) => {
      const sim = nightAt11('g29-er-spent', traits);
      // TEST SETUP: nearly spent at bedtime.
      dials(sim, { energy: 8.5 });
      const r = sleep(sim, 2);
      expect(r.ok, r.error).toBe(true);
      return { sim, energy: sim.player.wellbeing.energy };
    };
    // 8.5 + 2·0.748·13.5·0.995·0.79333·0.97635·k: 26.119 for a homebody, 24.065 plain, 22.610 restless; 25 to train.
    const home = after(['homebody']);
    const plain = after([]);
    const restless = after(['restless']);
    expect(plain.energy).toBeCloseTo(8.5 + 2 * 0.748 * 13.5 * 0.995 * (1 - 10 / 30 * 0.62) * (0.8 + 0.2 * 88 / 99.8), 6);
    expect(home.energy).toBeCloseTo(8.5 + (plain.energy - 8.5) * K.homebody, 6);
    expect(lookAfter(home.sim, 'exercise').ok).toBe(true);
    for (const tired of [plain.sim, restless.sim]) {
      const r = lookAfter(tired, 'exercise');
      expect(r.ok).toBe(false);
      expect(r.error).toBe('You’re too tired to train. Sleep first.');
    }
  });

  it('puts back √0.9065 of a plain night for somebody restless on a night nobody chose, and 1.1320 for a homebody', () => {
    const home = nightAlone('g29-er-alone', ['homebody']);
    const plain = nightAlone('g29-er-alone', []);
    const restless = nightAlone('g29-er-alone', ['restless']);
    expect(plain.player.wellbeing.energy).toBeCloseTo(ALONE.midnight + ALONE.gain, 6);
    expect(home.player.wellbeing.energy).toBeCloseTo(ALONE.midnight + ALONE.gain * K.homebody, 6);
    expect(restless.player.wellbeing.energy).toBeCloseTo(ALONE.midnight + ALONE.gain * Math.sqrt(K.restless), 6);
  });

  it('has the Sleep dialog ask 8 hours of a homebody, 9 of a plain twin and 9.5 of somebody restless, for whom a night puts back less, and its button sleeps them', () => {
    // 10.296 / (0.748·k·0.995 + 0.41), as for the depth: 8.22, 8.92 and 9.49, to the half hour.
    const home = nightAt11('g29-er-dialog', ['homebody']);
    const plain = nightAt11('g29-er-dialog', []);
    const restless = nightAt11('g29-er-dialog', ['restless']);
    const hd = sleepDialog(home);
    expect(hd.text).toContain('A normal night.');
    expect(hd.text).toContain('Sleep 8 Hours');
    const pd = sleepDialog(plain);
    expect(pd.text).toContain('Stress is costing you sleep, so a normal night takes longer.');
    expect(pd.text).toContain('Sleep 9 Hours');
    const rd = sleepDialog(restless);
    expect(rd.text).toContain('A night puts back less for you than for most, so it takes longer.');
    expect(rd.text).toContain('Sleep 9.5 Hours');
    rd.press();
    expect(restless.now).toBe(at(2026, 8, 25, 8, 30));
    expect(restless.player.wellbeing.energy).toBeCloseTo(30 + NIGHT.gain / 6 * 9.5 * K.restless, 6);
  });
});
