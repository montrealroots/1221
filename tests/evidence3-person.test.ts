/**
 * Round three of 2026-10-14 for the person rows the second round left partial or deferred (c-traits, c-wealth,
 * c-family, l-person, i-stale-claims, l-trait, trait-receipts), after the day's changes: the family chosen on Genres &
 * Background (`withFamily`, `FAMILIES`), the units a body is said in by where the person lives (`bodyUnits`), and the
 * `receipts` knob gone with the return's line that read it and `recordJobCost`.
 *
 * - c-traits and trait-receipts: Keeps Accounts and Chaotic, the two traits that declared `receipts`, pressed on
 *   Dispositions & Traits; the life Begin makes holds both, their looks list only the knobs they still move, and played
 *   through the fall to the tax season a London-born student holding them is given the same 2026 1040-NR to the cent as
 *   her twin who pressed nothing, $165.60 on $1,656.00 of work-study: changing the traits changes no return, which the
 *   row said of the knob before it went and is now true of the traits. Every knob a
 *   trait declares is named in KNOB_READS and asked for by name at a reader in src, held by one test that reads no other
 *   test's state (evidence2-b10's coverage test filled a hand-typed set as its journeys passed, and ran only in order).
 * - l-trait: Spender and Generous held together. Spender's look says +25% of the food's price on its own and +28% with
 *   all she is; Generous's +10% and the same +28%; the meal through life.look_after costs $6.41 where her twin's costs
 *   $5.00, 1.282 times, and lifts the mood 2.273 for 2: the look's "with all you are" is what play charges.
 * - c-wealth: each of the six families chosen on the select: Starting Point's tiles (checking, savings, the credit record
 *   and the card) and its term callout, and the accounts, card and credit score Begin opens, to the whole dollar.
 * - c-family: Inherited chosen and then Nothing on the same select, so the means go back with the money; the Nothing
 *   family's student is paid the term's $13,318.50 at the fall's start where the Inherited one pays the $1,882 plan.
 * - l-person: a second Person, built the way bootstrap builds the player (TEST SETUP: no command adds a person, and play
 *   holds one), in the world of a played life: the look reads that person, not the player, in "their" words and in the
 *   units of where they live, and moving where they live moves the units. Their trait and their condition each open
 *   theirs, under their look; until 2026-10-14 both resolved against the player.
 * - i-stale-claims: a stricter rule than evidence2-b13's, over src/, tests/ and docs/: a sentence naming the removed
 *   interests, in the plural or the singular ("an interest", "each interest", "the interest look"), passes only with a
 *   word of the removal (removed, deleted, went, dropped, 2026-10-10, migration 93 or 94), or read here and listed true.
 *   "until", "gone", "no longer", "drops" and "lets go", which a present-tense sentence has, no longer pass alone.
 *   From 2026-10-15 it is stricter still. A removal word after a present or future auxiliary isn't the past ("is
 *   dropped", "are removed"), and "went" counts only where the removal ends a clause or says when ("went on
 *   2026-10-10", not "went into every meal"). A clause that has the interests do something in the present fails a
 *   sentence whatever else it says. A possessive's or an adjective's singular ("your interest", "a favorite interest")
 *   names them. The check of 2026-10-14 found each of those passed the rule of that day.
 *
 * The figures are the rules' own numbers worked here by hand and written as literals: a knob's lean bent inside its
 * limits, exp(L·tanh(ln v / L)) with L the log of the limit it leans toward (`KNOB_LIMITS`); the families' money the
 * profile's euros at SLATE's 0.92 to the dollar, to the whole dollar; the term's account from the Bulletin's 2026–27 cost
 * of attendance, as tests/need-paths.test.ts works it.
 *
 * PLAYER JOURNEYS: a new life (`newLifeConfig`), Ada Cole, born in New York, at Yale in New Haven from Monday 24 August
 * 2026 at 7:30 AM, made on the creation screens rendered with react-dom/server, their controls pressed through their own
 * handlers and Begin pressed on Review, then played by the clock and by commands. Seeds are this file's, e3-*, chosen
 * for nothing the clock draws.
 *
 * TEST SETUP, said again where it's done: on the screens, which a static render can't click to, the components' states
 * in render order and the config a control's own handler set, applied as React would on the next render; the calendar
 * cleared of what wants the player before a measured meal; the day's dials set each six hours on the way to the tax
 * season and the coursework prepared each midnight, the same in both twins; and the second Person put in the world, and a condition given them.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import type { Person } from '@/engine/domain/model';
import { MS_HOUR } from '@/engine/core/time';
import { createUniverse, newLifeConfig, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { courseworkOf } from '@/engine/systems/coursework';
import { PREP_DIMS } from '@/engine/content/coursework';
import { KNOB_READS, PERSONALITY_TRAITS } from '@/engine/content/personality-traits';

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

// Without the original: it imports the looks, which import it back, and its provider needs a browser.
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

// The screens' kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});

const { CharacterCreation } = await import('@/ui/creation/CharacterCreation');
const { at: lookAt } = await import('@/ui/looks');
const { resolveLook } = await import('@/ui/looks/registry');

// ---------------------------------------------------------------------------------------------------------------------
// The screens, the lives and the clock
// ---------------------------------------------------------------------------------------------------------------------

/** What the player reads: the markup with every tag taken out and its entities read. */
const onScreen = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

type Element = (typeof h.elements)[number];
interface Screen { html: string; text: string; elements: Element[]; started: () => NewSaveConfig | undefined }

const STEP = { dispositions: 1, background: 2, starting: 3, review: 4 } as const;

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
/** Trait buttons pressed one after another on Dispositions & Traits, each through its own onClick on the page as it stands. */
function pressed(config: NewSaveConfig, ...names: string[]): NewSaveConfig {
  let c = config;
  for (const name of names) {
    const page = creation(STEP.dispositions, c);
    const button = control(page, 'button', (e) => e.first === name, `a button “${name}”`);
    expect(button.props.disabled, `${name} can be pressed`).toBeFalsy();
    h.sets = [];
    (button.props.onClick as () => void)();
    c = applied(c, 1);
  }
  return c;
}
/** A family chosen on Genres & Background's select, through its own onChange. */
function chosen(config: NewSaveConfig, family: StartingWealth): NewSaveConfig {
  const page = creation(STEP.background, config);
  const select = control(page, 'select', (e) => e.props.id === 'family', 'the family select');
  h.sets = [];
  (select.props.onChange as (e: { target: { value: string } }) => void)({ target: { value: family } });
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
  const ready = applied(config, 1);
  const page = creation(STEP.review, ready);
  (control(page, 'button', (e) => e.text === 'Begin', 'Begin').props.onClick as () => void)();
  const started = page.started();
  expect(started).toEqual(ready);
  return createSave(1, seed, { ...started!, tutorial: started!.tutorial !== false, paused: true });
}

/** Ada, as Identity leaves her: born in New York, named, she/her; everything else as a new life begins. */
const ada = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });

const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** An instant in New Haven on Eastern Daylight or Standard Time, worked out here, not by the engine. */
const EDT = (year: number, month: number, day: number, hour: number, minute = 0): number => Date.UTC(year, month - 1, day, hour + 4, minute);
const EST = (year: number, month: number, day: number, hour: number, minute = 0): number => Date.UTC(year, month - 1, day, hour + 5, minute);

/** TEST SETUP: nothing on the calendar that wants the player, canceled by hand. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
/** TEST SETUP: the work done each midnight, every open piece's every part prepared, the same in every twin. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
/** TEST SETUP: rested, fed, steady, clean and awake each time the clock moves, six hours at a time. */
function tend(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90, hygiene: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}
const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
const mine = (sim: Simulation, kind: Account['kind']) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && a.kind === kind && !a.closedAt);
const notices = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** What each purchase under a memo cost, in cents: the expense side of its transactions. */
const bought = (sim: Simulation, memo: (m: string) => boolean) => sim.universe.transactions.filter((t) => memo(t.memo))
  .map((t) => t.postings.filter((p) => p.amount > 0).reduce((n, p) => n + p.amount, 0));

/** A look as it opens: its name, kind, ways and its body's words. */
function look(sim: Simulation, kind: string, id: string) {
  h.sim = sim;
  h.calls = 0;
  h.states = [];
  const found = resolveLook(sim, lookAt(kind, id));
  if (!found || 'gone' in found) throw new Error(`${kind}:${id} didn’t resolve`);
  const seen = found as { name: string; kind: string; ways?: { label: string; detail?: string; to: unknown }[]; body?: unknown; provenance?: string };
  return { ...seen, words: onScreen(renderToStaticMarkup(createElement('div', null, seen.body as never))) };
}
const source = (path: string) => readFileSync(path, 'utf8');
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const posix = (p: string) => p.split('\\').join('/');

// ---------------------------------------------------------------------------------------------------------------------
// c-traits and trait-receipts
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Chaotic's and Keeps Accounts' knobs held together, at newLifeConfig's dispositions (stressGain, hygieneDrift and
 * bondWound 1 from the sliders), bent by hand: hygieneDrift 1.3 in [0.75, 1.35] is 1.2350736326, +24%; stressGain 0.92
 * in [0.5, 1.8] is 0.9203679653, −8%; bondWound 1.1 in [0.6, 1.5] is 1.0981123666, +10%.
 */
describe('c-traits and trait-receipts: the receipts knob gone', () => {
  it('PLAYER JOURNEY: Keeps Accounts and Chaotic pressed on the page make a life holding both; each look lists only the knobs it still moves, its own and with all she is, and neither says a receipt', () => {
    const sim = begun('e3-receipts', pressed(ada(), 'Keeps Accounts', 'Chaotic'));
    expect(sim.player.personalityTraits).toEqual(['keeps_accounts', 'chaotic']);
    const accounts = look(sim, 'trait', 'keeps_accounts');
    expect(accounts.kind).toBe('Your Trait');
    expect(accounts.words).toContain('How hard a slight from a classmate cuts +10% +10% all told');
    const chaotic = look(sim, 'trait', 'chaotic');
    expect(chaotic.words).toContain('How soon you need a shower +30% +24% all told');
    expect(chaotic.words).toContain('How much stress a hard hour, a performance’s nerves or an injury adds −8% −8% all told');
    // Two rows for Chaotic and one for Keeps Accounts, and nothing about a receipt or a deduction in either.
    for (const [seen, rows] of [[accounts, 1], [chaotic, 2]] as const) {
      expect(seen.words.match(/ all told/g)).toHaveLength(rows);
      expect(seen.words).not.toMatch(/receipt|deduct|return/i);
    }
    // No trait the page offers says a receipt in its look, held or not.
    for (const t of PERSONALITY_TRAITS) expect(look(sim, 'trait', t.id).words, t.name).not.toMatch(/receipt|deduct/i);
  });

  it('declares no knob that isn’t named in KNOB_READS and asked for by name at a reader in src; receipts neither declared, described nor read', () => {
    const declared = [...new Set(PERSONALITY_TRAITS.flatMap((t) => Object.keys(t.systemMods ?? {})))].sort();
    expect(declared).toEqual(Object.keys(KNOB_READS).sort());
    expect(declared).toHaveLength(19);
    expect(declared).not.toContain('receipts');
    // A reader asks for its knob by name: `personalityOf(somebody, 'knob')`, outside the content, the knob's own
    // definition and the trait look, which lists every knob a trait declares.
    const readers = walk('src').map(posix).filter((f) => /\.(ts|tsx)$/.test(f) && !f.startsWith('src/engine/content/') && f !== 'src/engine/systems/personality.ts' && f !== 'src/ui/looks/wellbeing.tsx');
    const asked = new Set<string>();
    for (const f of readers) for (const m of source(f).matchAll(/personalityOf\([^()]*(?:\([^()]*\)[^()]*)*,\s*'([A-Za-z]+)'\)/g)) asked.add(m[1]!);
    expect(declared.filter((k) => !asked.has(k))).toEqual([]);
    expect(asked.has('receipts')).toBe(false);
    // And nothing in src still writes or reads the work's costs the knob multiplied: only comments that date them.
    const code = (f: string) => source(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(readers.filter((f) => /recordJobCost|jobCosts|RECEIPTS\b/.test(code(f)))).toEqual([]);
  });
});

/**
 * Twins on one seed, born in London (an F-1 student files every year, so a return is made whatever the income; an
 * American student's $1,670.59 of work-study and interest is under 2026's $16,100 and makes none), one with Keeps
 * Accounts and Chaotic pressed and one with nothing, played from the first morning to the tax season of 1 February 2027
 * at 9 AM, when the 2026 return is made, across a save and a load on 1 November.
 */
describe('trait-receipts: changing the two traits changes no return', () => {
  it('PLAYER JOURNEY: London-born twins, one holding Keeps Accounts and Chaotic, played to the tax season of 2027 with the same work each midnight, are given the same 2026 return to the cent, on income earned', () => {
    const born = { homeRegionId: 'uk-eng-london' };
    let plain = working(begun('e3-return', ada(born)));
    let held = working(begun('e3-return', pressed(ada(born), 'Keeps Accounts', 'Chaotic')));
    expect(held.player.personalityTraits).toEqual(['keeps_accounts', 'chaotic']);
    expect(plain.player.personalityTraits).toEqual([]);
    tend(plain, EST(2026, 11, 1, 9));
    tend(held, EST(2026, 11, 1, 9));
    plain = working(reload(plain));
    held = working(reload(held));
    tend(plain, EST(2027, 2, 1, 10));
    tend(held, EST(2027, 2, 1, 10));
    const a = plain.player.returns?.['2026'];
    const b = held.player.returns?.['2026'];
    expect(a, 'a 2026 return was made').toBeDefined();
    // A 1040-NR on the fall's work-study, 72 hours at $23.00, $1,656.00; the bank's $14.59 of interest isn't connected
    // income (IRC 871(i)), and the first bracket's 10% of $1,656.00 is $165.60, owed with nothing withheld.
    expect([a!.figures.form, a!.figures.workStudy, a!.figures.interest, a!.figures.income, a!.figures.federal, a!.figures.balance]).toEqual(['1040-NR', 1_656_00, 14_59, 1_656_00, 165_60, 165_60]);
    expect(b?.figures).toEqual(a!.figures);
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------
// l-trait
// ---------------------------------------------------------------------------------------------------------------------

describe('l-trait: the look’s figures are what play charges', () => {
  it('PLAYER JOURNEY: Spender and Generous held; their looks say +25% and +10% of the food’s price on their own and +28% with all she is, and the meal through life.look_after costs $6.41 for the plain twin’s $5.00, and lifts the mood 2.273 for 2', () => {
    const meal = (sim: Simulation) => {
      clearCalendar(sim); // TEST SETUP
      sim.player.wellbeing.nourishment = 30; // TEST SETUP: hungry, so the meal is a whole one of 50.
      const ate = sim.execute<{ changed: { morale?: number } }>({ kind: 'life.look_after', payload: { action: 'eat' } });
      expect(ate.ok, ate.error).toBe(true);
      return { lift: ate.value!.changed.morale!, paid: bought(sim, (m) => m === 'A meal') };
    };
    const held = begun('e3-meal', pressed(ada(), 'Spender', 'Generous'));
    expect(held.player.personalityTraits).toEqual(['spender', 'generous']);
    const spender = look(held, 'trait', 'spender');
    const generous = look(held, 'trait', 'generous');
    // spending 1.25 × 1.1 = 1.375, bent in [0.7, 1.4]: 1.2819393926, +28%; mealMood 1.15 in [0.7, 1.3]: 1.1364255057.
    expect(spender.words).toContain('What the day’s food costs you +25% +28% all told');
    expect(spender.words).toContain('How much a meal lifts your morale +15% +14% all told');
    expect(generous.words).toContain('What the day’s food costs you +10% +28% all told');
    expect(generous.words).toContain('How fast you warm to a classmate +10% +10% all told');
    const plain = meal(begun('e3-meal', ada()));
    const both = meal(held);
    // New Haven's $4 meal at its 127 cost of living, $5.00; at 1.2819394, 640.97 cents, $6.41: 1.282 times, the +28%.
    expect(plain.paid).toEqual([500]);
    expect(both.paid).toEqual([641]);
    expect(Math.round((641 / 500 - 1) * 100)).toBe(28);
    expect(plain.lift).toBeCloseTo(2, 9);
    expect(both.lift).toBeCloseTo(2 * 1.1364255057, 9);
    expect(Math.round((both.lift / plain.lift - 1) * 100)).toBe(14);
  });

  it('a trait not held opens as A Trait, its own figures and no “with all you are”; one held opens as A Trait You Hold, under her own look', () => {
    const sim = begun('e3-meal', pressed(ada(), 'Spender'));
    const frugal = look(sim, 'trait', 'frugal');
    expect(frugal.kind).toBe('A Trait');
    expect(frugal.words).toContain('What the day’s food costs you −15%');
    expect(frugal.words).not.toContain('all told');
    const spender = look(sim, 'trait', 'spender');
    expect(spender.kind).toBe('Your Trait');
    // Spender alone: 1.25 bent in [0.7, 1.4], 1.2156941679, +22%.
    expect(spender.words).toContain('What the day’s food costs you +25% +22% all told');
    expect(look(sim, 'person', sim.player.id).ways!.map((w) => w.label)).toContain('Spender');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// c-wealth and c-family
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Each family's first morning, worked by hand from the profile's euros at 0.92 to the dollar, to the whole dollar, with
 * the credit record the profile gives: what Starting Point's tiles say and Begin opens.
 */
const FIRST_MORNING: Record<StartingWealth, { checking: number; savings: number; score: number; card?: { limit: number; owed: number }; need: boolean }> = {
  nothing: { checking: 43, savings: 0, score: 520, need: true },
  scraping: { checking: 1_348, savings: 326, score: 610, card: { limit: 1_630, owed: 913 }, need: true },
  modest: { checking: 5_217, savings: 7_065, score: 690, card: { limit: 6_522, owed: 457 }, need: true },
  comfortable: { checking: 19_565, savings: 45_652, score: 748, card: { limit: 21_739, owed: 0 }, need: true },
  wealthy: { checking: 92_391, savings: 413_043, score: 795, card: { limit: 65_217, owed: 0 }, need: false },
  inherited: { checking: 260_870, savings: 2_608_696, score: 812, card: { limit: 163_043, owed: 0 }, need: false },
};
const dollars = (n: number) => `$${n.toLocaleString('en-US')}`;

describe('c-wealth: Starting Point’s tiles are what Begin opens, for every family', () => {
  for (const family of Object.keys(FIRST_MORNING) as StartingWealth[]) {
    it(`PLAYER JOURNEY: ${family} chosen on the select; What Is Yours shows it with no picker, and Begin opens the same checking, savings, card and credit score`, () => {
      const m = FIRST_MORNING[family];
      const config = chosen(ada(), family);
      expect(config.wealth).toBe(family);
      const step = creation(STEP.starting, config);
      expect(step.elements.some((e) => e.props.id === 'wealth'), 'no What You Are Starting With picker in a life at the school').toBe(false);
      expect(step.text).toContain(`Checking ${dollars(m.checking)} Savings ${dollars(m.savings)} Credit Record ${m.score}`);
      if (m.card) {
        expect(step.text).toContain(`Credit Card ${dollars(m.card.limit)} Limit${m.card.owed ? ` ${dollars(m.card.owed)} owed on it already` : ''}`);
        if (!m.card.owed) expect(step.text).not.toContain('owed on it already');
      } else expect(step.text).not.toContain('Credit Card');
      expect(step.text).toContain(m.need
        ? 'The school pays $13,318.50 into your bank at the start of each term, fall and spring, after your Yale Health plan.'
        : 'Each fall and spring, $1,882.00 comes out of your bank for that term’s Yale Health plan, and there’s no aid for living costs.');
      const sim = begun(`e3-family-${family}`, config);
      expect(primary(sim).balance).toBe(m.checking * 100);
      expect(mine(sim, 'savings').reduce((n, a) => n + a.balance, 0)).toBe(m.savings * 100);
      expect(sim.player.credit?.score).toBe(m.score);
      const cards = mine(sim, 'credit_card');
      expect(cards.map((c) => [c.creditLimit, c.balance + 0])).toEqual(m.card ? [[m.card.limit * 100, m.card.owed ? -m.card.owed * 100 : 0]] : []);
    });
  }
});

describe('c-family: the means go with the family the select last chose', () => {
  it('PLAYER JOURNEY: Inherited chosen, then Nothing: Review says Need Found, and at the fall term’s start Nothing’s student is paid $13,318.50 where Inherited’s pays the $1,882 plan from $260,870', () => {
    const rich = chosen(ada(), 'inherited');
    expect(creation(STEP.review, rich).text).toContain('Family Inherited Wealth, No Need Found');
    const poor = chosen(rich, 'nothing');
    expect(poor).toMatchObject({ wealth: 'nothing' });
    expect(poor.family).toBeUndefined();
    expect(creation(STEP.review, poor).text).toContain('Family Next To Nothing, Need Found');
    const need = begun('e3-need', poor);
    const without = begun('e3-need', rich);
    expect(need.player.family).toBeUndefined();
    expect(without.player.family).toBe('wealthy');
    tend(need, EDT(2026, 8, 24, 12));
    tend(without, EDT(2026, 8, 24, 12));
    // $43 and the scholarship's $13,318.50 left after the plan; $260,870 less the plan's $1,882.
    expect(primary(need).balance).toBe(1_336_150);
    expect(primary(without).balance).toBe(25_898_800);
    expect(notices(need, 'Fall Term 2026 Begins').map((n) => n.body)).toEqual(['Tuition, $20,375.00 a term, is covered by the tuition scholarship. Your living-expense scholarship of $15,200.50 paid this term’s Yale Health plan, $1,882.00, and $13,318.50 is in your Chase Total Checking.']);
    expect(notices(without, 'Fall Term 2026 Begins').map((n) => n.body)).toEqual(['Tuition, $20,375.00 a term, is covered by the tuition scholarship. Yale’s aid for living costs goes by need, and your family’s means rule it out, so this term’s Yale Health plan, $1,882.00, was paid from your bank, and living costs are yours.']);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// l-person
// ---------------------------------------------------------------------------------------------------------------------

/**
 * TEST SETUP: a second Person in the world of a played life. No command adds a person and play holds one, so Bea Lane is
 * made the way bootstrap makes the player (`createUniverse`, from a config of her own: born and living in London,
 * they/them, 160 cm and 55 kg, Curious) and put into the played world under the next id, not the player.
 */
function withBea(sim: Simulation): Person {
  const config: NewSaveConfig = {
    ...newLifeConfig(), school: undefined, homeRegionId: 'uk-eng-london', startLocationId: 'uk-eng-london', livesWhereBorn: true,
    firstName: 'Bea', lastName: 'Lane', pronouns: 'they/them', heightCm: 160, weightKg: 55, personalityTraits: ['curious'],
    background: 'Grew up over a shop in Hackney.', startYear: 2026, startMonth: 8, startDay: 24,
  };
  const made = createUniverse(1, 'e3-bea', config);
  const bea = { ...made.universe.people[made.playerId]!, id: 'person_000002', isPlayer: false, saveId: sim.universe.meta.id };
  bea.wellbeing = { ...bea.wellbeing, morale: 31 };
  sim.universe.people[bea.id] = bea;
  return bea;
}

describe('l-person: the look reads the person it is of', () => {
  it('a second Person in a played world opens as Somebody, in their words and the units of where they live, their own dials and trait, and no Your Own Plans; moved to New Haven, the units move', () => {
    const sim = begun('e3-person', ada({ heightCm: 170, weightKg: 65 }));
    tend(sim, EDT(2026, 8, 26, 9));
    const bea = withBea(sim);
    const them = look(sim, 'person', bea.id);
    expect([them.name, them.kind]).toEqual(['Bea Lane', 'Somebody']);
    expect(them.provenance).toBe('The same eight measures you have, moved by the same kinds of day.');
    // 55 ÷ 1.6² = 21.48.
    expect(them.words).toContain('Who they are. Curious.');
    expect(them.words).toContain('Their body. 160 cm and 55.0 kg, with a body mass index of 21.5, in the healthy weight range. In centimeters and kilograms, the units of the United Kingdom, where they live.');
    expect(them.words).toContain('On their papers. Pronouns they/them. A citizen of the United Kingdom.');
    expect(them.words).toContain('Where they come from. Grew up over a shop in Hackney.');
    expect(them.words).not.toMatch(/Your body|On your papers|Who you are/);
    const labels = them.ways!.map((w) => w.label);
    expect(labels).not.toContain('Your Own Plans');
    expect(labels).toContain('Curious');
    expect(them.ways!.find((w) => w.label === 'Morale')?.detail).toMatch(/^31\/100\. /);
    // Hers, in the same world, unchanged: her name, her units, her plans.
    const her = look(sim, 'person', sim.player.id);
    expect(her.kind).toBe('Yourself');
    expect(her.ways!.map((w) => w.label)).toContain('Your Own Plans');
    expect(her.ways!.find((w) => w.label === 'Morale')?.detail).not.toMatch(/^31\/100\. /);
    expect(her.words).toContain('Your body. 5 ft 7 in and 143 lb');
    // Moved to New Haven: 160 cm is 63 inches, 5 ft 3; 55 kg is 121 lb at 0.45359237 kg the pound.
    sim.universe.people[bea.id]!.currentLocationId = 'us-ct-newhaven'; // TEST SETUP: where they live, changed
    expect(look(sim, 'person', bea.id).words).toContain('Their body. 5 ft 3 in and 121 lb, with a body mass index of 21.5, in the healthy weight range. In feet, inches and pounds, the units of the United States, where they live.');
    // And the world still played on with them in it, across a save and a load.
    const again = reload(sim);
    expect(Object.keys(again.universe.people).sort()).toEqual([sim.player.id, bea.id].sort());
    expect(look(again, 'person', bea.id).kind).toBe('Somebody');
  });

  // From 2026-10-14. Until then the trait look resolved every trait against the player, so this opened as the player's
  // “A Trait”, not held, parented to her own look.
  it('the Curious way on Bea’s look opens Bea’s trait, held by them, with their figures, parented to their look; the player’s own look of it is unchanged', () => {
    const sim = begun('e3-person-trait', ada({ personalityTraits: ['frugal'] }));
    const bea = withBea(sim);
    expect(sim.player.personalityTraits).not.toContain('curious');
    const way = look(sim, 'person', bea.id).ways!.find((w) => w.label === 'Curious')!;
    h.sim = sim;
    const found = resolveLook(sim, way.to as never);
    if (!found || 'gone' in found) throw new Error('Bea’s Curious didn’t resolve');
    const theirs = found as { kind: string; parent?: unknown; provenance?: string };
    expect(theirs.kind).toBe('Their Trait');
    expect(theirs.parent).toEqual(lookAt('person', bea.id));
    expect(theirs.provenance).toMatch(/^Each figure is the trait’s own\. “All told” is their traits and dispositions taken together/);
    const mine = look(sim, 'trait', 'curious');
    expect(mine.kind).toBe('A Trait');
    expect((mine as { parent?: unknown }).parent).toEqual(lookAt('person', sim.player.id));
  });

  // From 2026-10-14. Until then the condition look resolved every condition against the player, as the trait look did
  // until earlier that day, so Bea’s Depression, the player carrying none, didn’t resolve at all.
  it('the Depression way on Bea’s look opens Bea’s, left alone, in their words, parented to their look; the player carrying none, her own look of it is gone, and her drawn High Blood Pressure still opens as hers', () => {
    const sim = begun('e3-person-condition', ada());
    const bea = withBea(sim);
    // TEST SETUP: Bea carries depression, left alone. The player carries what her life drew, high blood pressure.
    bea.health = { ...bea.health, chronic: { depression: { treated: false } } } as typeof bea.health;
    expect(Object.keys(sim.player.health?.chronic ?? {})).toEqual(['hypertension']);
    const way = look(sim, 'person', bea.id).ways!.find((w) => w.label === 'Depression')!;
    expect(way.detail).toBe('Left untreated, and what that does.');
    h.sim = sim;
    const found = resolveLook(sim, way.to as never);
    if (!found || 'gone' in found) throw new Error('Bea’s Depression didn’t resolve');
    const theirs = found as { name: string; kind: string; summary?: string; parent?: unknown; ways?: { to: unknown }[] };
    expect([theirs.name, theirs.kind]).toEqual(['Depression', 'A Long-Term Condition']);
    expect(theirs.summary).toBe('They’re leaving it untreated. That costs nothing, but it has the effects below.');
    expect(theirs.parent).toEqual(lookAt('person', bea.id));
    expect(theirs.ways!.map((w) => w.to)).toEqual([lookAt('dial', `${bea.id}/morale`)]);
    // The player’s own, by the bare id, still reads the player: no depression, and her own high blood pressure.
    const none = resolveLook(sim, lookAt('condition', 'depression'));
    expect(!none || 'gone' in none).toBe(true);
    const mine = look(sim, 'condition', 'hypertension');
    expect([mine.name, mine.kind]).toEqual(['High Blood Pressure', 'A Long-Term Condition']);
    expect((mine as { parent?: unknown }).parent).toEqual(lookAt('person', sim.player.id));
    expect(look(sim, 'person', sim.player.id).ways!.find((w) => w.label === 'High Blood Pressure')!.to).toEqual(lookAt('condition', 'hypertension'));
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// i-stale-claims
// ---------------------------------------------------------------------------------------------------------------------

const tidy = (s: string) => s.replace(/\s+/g, ' ').trim();
/**
 * What a reader reads in a file, as tests/evidence2-b13.test.ts reads it: a doc's paragraphs; a JSON file's strings;
 * and a source file's comments (line comments one under another as one passage), strings, template text and JSX words,
 * parsed by TypeScript. A string without a space is a key or a selector, not prose.
 */
function proseOf(file: string, text: string): string[] {
  if (file.endsWith('.md')) return text.split(/\n\s*\n/).map(tidy);
  if (file.endsWith('.json')) {
    const out: string[] = [];
    const take = (v: unknown): void => { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach(take); else if (v && typeof v === 'object') Object.values(v).forEach(take); };
    take(JSON.parse(text));
    return out.map(tidy);
  }
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : file.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  const src = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, false, kind);
  const ranges = new Map<number, ts.CommentRange>();
  const out: string[] = [];
  const note = (pos: number) => { for (const r of [...(ts.getLeadingCommentRanges(text, pos) ?? []), ...(ts.getTrailingCommentRanges(text, pos) ?? [])]) ranges.set(r.pos, r); };
  const stringsIn = (n: ts.Node): string[] => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return [n.text];
    const xs: string[] = [];
    n.forEachChild((c) => { xs.push(...stringsIn(c)); });
    return xs;
  };
  const visit = (n: ts.Node): void => {
    note(n.pos);
    note(n.end);
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) { out.push(n.text); return; }
    if (ts.isTemplateExpression(n)) {
      out.push(n.head.text + n.templateSpans.map((s) => stringsIn(s.expression).join(' / ') + s.literal.text).join(''));
      n.forEachChild((c) => { note(c.pos); note(c.end); });
      return;
    }
    if (ts.isJsxText(n)) { out.push(n.text); return; }
    n.forEachChild(visit);
  };
  visit(src);
  const merged: { pos: number; end: number; kind: ts.SyntaxKind }[] = [];
  for (const r of [...ranges.values()].sort((a, b) => a.pos - b.pos)) {
    const last = merged[merged.length - 1];
    if (last && r.kind === ts.SyntaxKind.SingleLineCommentTrivia && last.kind === ts.SyntaxKind.SingleLineCommentTrivia && /^\s*$/.test(text.slice(last.end, r.pos))) last.end = r.end;
    else merged.push({ pos: r.pos, end: r.end, kind: r.kind });
  }
  for (const r of merged) out.push(text.slice(r.pos, r.end).replace(/^\/\*+|\*+\/$/g, '').replace(/^\s*\*\s?/gm, ' ').replace(/^\s*\/\/\s?/gm, ' '));
  return out.map(tidy).filter((s) => /\s/.test(s));
}

/** Money's interest in a phrase of its own: a penalty, a rate, a charge, a transaction, interest-free. Read as money's. */
const MONEYS = /\binterest(?:[- ](?:penalty|penalties|reduction|free|transactions?|rates?|charges?|payments?|bearing|frequency|income)|DuringTerm)\b/gi;
/**
 * The adjectives a singular of theirs took after a possessive ("her own favorite interest"), and the fewer after "a" or
 * "the" ("a favorite interest"), where "the last interest day" is money's.
 */
const MOD = String.raw`(?:own|favou?rite|loved|chosen|new|first|second|last|single)`;
const A_MOD = String.raw`(?:favou?rite|loved|chosen|new|single)`;
/**
 * One of the removed interests in the singular: "an interest", "each interest", "that interest", and from 2026-10-15
 * a possessive's or an adjective's too ("your interest", "her own interest", "a favorite interest", "the loved
 * interest"), which the rule of 2026-10-14 passed. Up to two adjectives ("her own favorite interest"): until the second
 * pass of 2026-10-15 it took one, and the check of that day found "Her own favorite interest lifts a meal." passed
 * (in the British spelling, which the tests write with an escape, since tools/spelling.mjs corrects the word).
 * Money's interest is a mass noun ("the interest", "its interest", "no interest") and isn't counted; a possessive's
 * money ("their interest and their reports") is read and listed below.
 */
const ONE = String.raw`\b(?:(?:an|each|every|one|that|this|another|your|my|our|her|his|their)(?:\s+${MOD}){0,2}|(?:a|the)(?:\s+${A_MOD}){1,2})\s+interest\b`;
/**
 * A sentence naming the interests the owner removed: the plural, one of them in the singular (`ONE`), "the interest
 * look", "an interest's hour", or a name the code gave them.
 */
const NAMES = new RegExp(String.raw`\binterests\b|${ONE}|\binterest(?:'s|’s)\b|\binterest (?:looks?|hours?|lists?|sheets?|records?|kinds?|lines?)\b|byInterest|interest\.pursue|interestsRead|INTEREST_BY_ID|content\/interests|\binterest:[a-z_$\{]`, 'i');
/** The law's interests, and the contacts' three (`interestsOf`), which went on 2026-10-09 in a removal of their own. */
const OTHER = /best interests|three interests|interestsOf|beyond a job and interests/i;
/** A present or future auxiliary, which makes "removed" or "dropped" a present passive: "is dropped", "are removed". */
const AUX = String.raw`(?:is|are|am|be|being|get|gets|getting|will|would|can|could|may|might|must|shall|should|’s|'s|’re|'re)`;
/**
 * The removal's own words: its date, migration 93 or 94, or "removed", "deleted", "dropped" or "went" in the past.
 * From 2026-10-15 a verb after a present or future auxiliary, a word between them or not, isn't the past ("An interest
 * is dropped from the sheet", "until they are removed"). "went" is the removal's only where it ends a clause or goes on
 * to a date, a "that day" or a "when", or to what went with it ("went on 2026-10-10", "went that day", "went with
 * them", "With them went"). Until the second pass of 2026-10-15 "went" before "on", "in the" or "at" was the removal's
 * too, so "Interests went on lifting a meal." and "Interests went in the pot." passed. "until", "gone", "no longer",
 * "drops" and "lets go" aren't among them.
 */
const REMOVAL = new RegExp(String.raw`2026-10-10|migration 9[34]\b|(?<!\b${AUX}\s+(?:\w+\s+)?)\b(?:removed|deleted|dropped)\b|\bwith (?:them|it) went\b|(?<!\b${AUX}\s+(?:\w+\s+)?)\bwent(?=\s+(?:on\s+\d|with\b|that\s+(?:day|week|month|year)\b|when\b)|\s*[.,;:)]|\s*$)`, 'i');
/** A verb in the past, or a past participle: "-ed", and the irregular ones the tree's prose uses. */
const PAST = String.raw`(?:[a-z]+ed|went|were|was|had|did|grew|gave|kept|made|said|stood|came|took|brought|ran|fed|sat|held|paid|won|lost|read|left|got|became|began|felt|found|knew|led|meant|met|put|saw|set|sent|spent|told|thought|wrote|gone|been|done|given|taken|known|shown|grown)`;
/**
 * What follows "interests" and isn't a verb in the present: the past, a function word, a noun they compound with,
 * "too" ("it named the interests too until 2026-10-10") and "is", which a plural subject never takes ("every sentence
 * naming the interests is in the past"). Each was found in the tree's dated notes when the list of 46 went.
 */
const NOT_PRESENT = String.raw`(?:${PAST}|is|too|and|or|nor|but|of|in|on|at|to|for|with|from|by|into|onto|than|as|like|beside|besides|behind|around|within|without|across|against|toward|towards|during|except|above|below|off|out|that|which|who|whose|where|when|while|if|so|the|a|an|its|their|his|her|no|not|anywhere|again|aside|among|between|before|after|until|since|because|about|over|under|through|per|via|section|list|sheet|record|step|field|question|screen|look|hour|lists|sheets|records|steps|fields)`;
const ADV = String.raw`(?:still|also|now|only|never|always|all|then|just|both)`;
/** A clause set off by commas between the subject and its verb: "The interests, removed by the owner, lift a meal." */
const ASIDE = String.raw`(?:\s*,[^,.;:]{1,60},)?`;
/** The present perfect, which is the past's: "Interests have been removed since 2026-10-10." */
const PERFECT = String.raw`(?:have|has)\s+(?:${ADV}\s+)?${PAST}\b`;
/**
 * The removed interests as the subject of a verb in the present or the future, from 2026-10-15: "Interests lift a meal",
 * "An interest grows", "Your interest lifts", "Interests will lift". A sentence with one isn't dated by a removal word in
 * another clause ("Interests lift a meal, and the owner removed the crafts."). It's a heuristic over the words, not a
 * parser: it catches the shapes its tests name.
 *
 * Until the second pass of 2026-10-15 the plural's verb was one of a closed list of 46, and the check of that day found
 * "Interests shape a meal, and the owner removed the crafts." passed; any word after "interests" now counts but the past
 * and the words in `NOT_PRESENT`. Until then too a clause between subject and verb ("The interests, removed by the
 * owner, lift a meal.") and the future ("Interests will lift a meal until migration 94.") passed, and the present
 * perfect "Interests have been removed since 2026-10-10." was taken for the present.
 */
const PRESENT = new RegExp(String.raw`\binterests${ASIDE}(?:\s+${ADV})?\s+(?!${PERFECT})(?!${NOT_PRESENT}\b)[a-z]+\b|(?:${ONE}|\binterest (?:look|hour))${ASIDE}(?:\s+${ADV})?\s+(?!${PERFECT})(?:is|has|does|will|shall|can|may|must|would|could|might|should|(?!(?:was|has)\b)[a-z]+[^s'’]s)\b`, 'i');
/** Dated by the removal: one of its words, and no clause that names the interests in the present. */
const dated = (sentence: string) => REMOVAL.test(sentence) && !PRESENT.test(sentence.replace(MONEYS, ''));

/** Every sentence naming them without the removal's words, each read here on 2026-10-14 and found true, with why. */
const READ_TRUE: readonly (readonly [file: string, sentence: string, why: string])[] = [
  ['src/engine/index.ts', 'Let go of person’s interests / people’s interests: the game no longer keeps them.', 'migration 94’s message to an older save: what it did, and that the game keeps none now'],
  ['src/engine/systems/enjoyment.ts', 'The interests (cooking, theater, a stage\'s crafts, travel and some sixty more) lifted an hour of looking after yourself, a rehearsal among crafts they loved, a play read, a piece of coursework in a craft; and from 2026-10-09 each was also an hour of its own (`interest.pursue`).', 'past: “lifted”, “was”'],
  ['src/engine/systems/taxreturn.ts', 'Rounded so the parts add to the whole rounded once: the cent left over is the interest\'s.', 'money’s interest'],
  ['tests/attributes-matrix.test.ts', '## Interests', 'the heading the test holds gone'],
  ['tests/cohesion.test.ts', 'puts them on the player; only enjoyment reads them, and nothing reads interests but the migration that drops them', 'a title: absence'],
  ['tests/cohesion.test.ts', 'these read somebody’s interests out of a save', 'a failing test’s message'],
  ['tests/creation.test.ts', 'asks for genres and a background, no interests, and nothing with a number on it', 'a title: absence'],
  ['tests/creation.test.ts', 'the interests are back', 'a failing test’s message'],
  ['tests/creation.test.ts', 'carries the genres and the background, and no interests', 'a title: absence'],
  ['tests/creation.test.ts', 'Review shows interests again', 'a failing test’s message'],
  ['tests/evidence-g34-ui.test.ts', 'PLAYER JOURNEY: creation’s five steps name no interests; Genres & Background is headed Genres and Background, and none of its controls or Review’s says interest', 'a title: absence'],
  ['tests/evidence-g34-ui.test.ts', 'has no interest look: the registry has no such kind, an older save’s pointer to one opens nothing, and the person’s look says the films and no interests', 'a title: absence'],
  ['tests/evidence-g34-ui.test.ts', 'has no interests in the guide or the tutorial: no entry’s or chapter’s words name them, and every “interest” there is money’s', 'a title: absence'],
  ['tests/evidence-g34-ui.test.ts', 'PLAYER JOURNEY: the Profile, on the first morning and after a week lived, has no Interests section and no interest in its words or its controls; it says the genres back', 'a title: absence'],
  ['tests/evidence-g34-ui.test.ts', 'has the capability documents pair no interest with love or enjoyment, and name no interests', 'a title: absence'],
  ['tests/evidence-g34-ui.test.ts', 'keeps every sentence naming the interests in the past, in the five files whose prose the removal corrected', 'a title: what it holds'],
  ['tests/evidence-g34-ui.test.ts', 'PLAYER JOURNEY: a 93 save opened through openSlot keeps the personality, the trait and the genres to the figure, drops the interests, writes the save back with the 93 as its backup, and a second open changes nothing', 'a title: what a migration does to an older save'],
  ['tests/evidence-g34-ui.test.ts', 'Let go of 1 person’s interests: the game no longer keeps them.', 'migration 94’s message, expected'],
  ['tests/evidence-g34-ui.test.ts', '- i-genres-dispositions-intact: a save written under schema 93 by a life made with a disposition on every axis away from creation\'s start, a trait and a loved genre, opened through `openSlot`: its personality, traits and genres are the 93 save\'s to the figure, the interests gone, the migrated save written back over the slot and the 93 kept as its backup, and a second open changes nothing.', 'what a migration does to an older save'],
  ['tests/evidence-g34-ui.test.ts', 'TEST SETUP, said again where it\'s done: a row raised with `requireDecision` where nothing a student\'s life reaches raises one of that shape (dated 300 days on; every raiser in this build dates its row, none more than a return\'s four and a half months ahead); a save rewritten as schema 93 wrote it (the interests and their record put back, the version set to 93), as tests/migration-94.test.ts writes one; the day\'s dials each six hours (`tended`) and the coursework each midnight (`working`), so what the clock does at a call is what\'s measured and a student stays in good standing to the second year; and on creation\'s screens, the step and the config, which a static render can\'t click its way to.', 'a fixture, as 93 wrote it'],
  ['tests/evidence-g34-ui.test.ts', 'TEST SETUP: the save as 93 wrote it, as tests/migration-94.test.ts writes one: interests on the sheet and an hour of one on record, the version 93; written to the device\'s store as the game writes a slot.', 'a fixture, as 93 wrote it'],
  ['tests/migration-94.test.ts', 'drops the interests and their record, keeps the genres and the ledger, and says so', 'a title: what a migration does to an older save'],
  ['tests/migration-94.test.ts', 'gives a new life no interests to drop', 'a title: absence'],
  ['tests/migration-94.test.ts', 'A save as 93 wrote it: interests on the sheet, an hour of one on record, a genre studied, and a ticket paid.', 'a fixture, as 93 wrote it'],
  ['tests/migration-94.test.ts', 'The genre studied before is still known, and an hour of an interest is no command at all.', 'absence: the command is unknown'],
  // Found by this rule and not by the one before it, which took "an interest" only at a sentence's start. It stands
  // in Stage 7d, "done 2026-09-30", of a document whose head says it was retired in the scope reset of 2026-10-09, with
  // the boats it describes: a dated record of what was built, not a claim about the game.
  ['docs/WORLD.md', 'It does for the mood what sitting out does, SLATE\'s estimate, and an interest in nature or sport lifts it more.', 'a retired document’s stage log, dated 2026-09-30'],
  ['docs/UNBITTEN.md', 'The rest were marked · at creation as said back only (`interestsRead`).', 'past: “were marked”'],
  // Found by the possessive singulars of 2026-10-15 (`ONE`), and read that day: a scene’s brief, and money’s.
  ['src/engine/content/briefs/briefs-c.ts', 'Every beat holds the joke and the fear together, and the last turns the joke against her own interest.', 'a scene’s brief: a character acting against her own interest'],
  ['src/engine/content/briefs/briefs-e.ts', 'She’s working the inspector the whole scene, and his interest in the end is what she plays for.', 'a scene’s brief: what a character wants'],
  ['tests/evidence-g13-money.test.ts', 'asked to move the statement day every morning, it moves once a cycle: the statements, their due dates, their interest and their reports still come, and at day 125 the score has gained nothing on a twin’s who never moved it', 'money’s interest: a card statement’s'],
  ['tests/evidence-g13-money.test.ts', "- `credit score`: a statement day asked to move every morning moves once a cycle, so the statements, their due dates, their interest and their reports still come, and the score moves as a twin's who never moved it; a mark seven years old leaves at the month's end on the clock and gives 25 back, which a card application then reads, and the card's screen reprices; 80% of the limit used at a due date costs ten of the month's three points, 20% none; with no card open the record ages back 2 a month on the 1st to 680, and not with a payment late in the year; a Citi loan is priced by the record, 12.10% at 735 and 12.30% at 730.", 'money’s interest: a card statement’s'],
  ['tests/evidence3-lifepapers.test.ts', "These two failed before: the CD paid out, and the CD broken, posted their interest and left the year's record at nothing.", 'money’s interest: a CD’s'],
  // Found by the walk on 2026-10-16, in the banking area's prose of that day, and read by the coverage area: the ledger's
  // Interest line, money's, which NAMES takes for a line on the sheet the interests had. Both in the past, with no word of
  // the removal, since neither is about it. The second's command is written with its backticks escaped, so tools/devmap.mjs
  // doesn't take this file for a test that issues it.
  ['src/engine/systems/accountlife.ts', "That build posted a take as the primary account's net, the Interest line's gross and any Tax On Interest, under “Interest: <the term's name>”, a name every term at the bank shares, and nothing against the term.", 'money’s interest: the ledger’s Interest line'],
  ['tests/remaining-banking.test.ts', "That build's Take Interest posted the primary's net, the Interest line's gross and any tax, and nothing against the term (git show a4d05745^:src/engine/systems/accountlife.ts, \u0060bank.take_term_interest\u0060), and it kept no `opened`.", 'money’s interest: the ledger’s Interest line'],
];

/** Each sentence that names them, in each file given. */
function namingIn(files: readonly string[]): { file: string; sentence: string }[] {
  const found: { file: string; sentence: string }[] = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    if (!/interest/i.test(text)) continue;
    for (const passage of proseOf(file, text)) {
      for (const s of passage.split(/(?<=[.!?])\s+/)) {
        const sentence = s.trim();
        if (NAMES.test(sentence.replace(MONEYS, '')) && !OTHER.test(sentence)) found.push({ file, sentence });
      }
    }
  }
  return found;
}
const unread = ({ file, sentence }: { file: string; sentence: string }) => !dated(sentence) && !READ_TRUE.some(([f, s]) => f === file && s === sentence);

describe('i-stale-claims: a rule a present-tense claim can’t pass by “until” or the singular', () => {
  it('finds every present-tense claim the check of 2026-10-13 passed, and passes each one’s twin dated by the removal; money’s interest isn’t taken for them', () => {
    const at = (sentence: string) => NAMES.test(sentence.replace(MONEYS, '')) && !OTHER.test(sentence) && unread({ file: 'src/x.ts', sentence });
    for (const present of [
      'An interest grows an ability by an hour of it.',
      'The interest look opens from the Profile.',
      'A loved interest lifts a meal.',
      'Spend an hour on an interest.',
      'The interests are kept on the sheet until the player drops them.',
      'Each interest lets go of its hours when the term ends.',
      'An interest is gone from the sheet once the player lets go of it.',
      'The interests no longer cost money; they lift a meal.',
    ]) expect(at(present), present).toBe(true);
    for (const past of [
      'An interest grew an ability by an hour of it until the interests went on 2026-10-10.',
      'The interest look opened from the Profile until migration 94.',
      'A loved interest lifted a meal, until the owner removed them.',
    ]) expect(at(past), past).toBe(false);
    for (const money of [
      'Its interest builds each day.',
      'The interest built so far',
      'no option to withdraw early by paying an interest penalty.',
      'Only interest is paid from the books\' income in an interest transaction.',
      'Payments are applied in the best interests of the State.',
    ]) expect(at(money), money).toBe(false);
  });

  // From 2026-10-15. The check of 2026-10-14 ran this file's NAMES and REMOVAL and found each sentence below passed: a
  // removal word took a present passive for the past, "went" counted wherever it stood, and NAMES had no possessive or
  // adjective singular.
  it('finds the present passives, “went into”, the possessive and adjective singulars and a present clause beside a past one, which the check of 2026-10-14 passed; passes their dated twins and the dated notes in the tree', () => {
    const at = (sentence: string) => NAMES.test(sentence.replace(MONEYS, '')) && !OTHER.test(sentence) && unread({ file: 'src/x.ts', sentence });
    for (const present of [
      // The check's own examples.
      'An interest is dropped from the sheet when the term ends.',
      'Interests lift a meal until they are removed.',
      'Interests went into every meal.',
      'Your interest lifts a meal.',
      'A favorite interest lifts a meal.',
      // And their kin.
      'Her interest in cooking lifts a meal.',
      'Their favorite interest opens on the Profile.',
      'My interest grows each week.',
      'The interests are removed when a save opens.',
      'Each interest will be dropped at the term’s end.',
      'Interests are being removed from the sheet.',
      'An interest gets quietly deleted once it is dropped.',
      'Interests lift a meal, and the owner removed the crafts.',
      'The interests still lift a meal until 2026-10-10.',
      // A present passive in a clause after the interests' own verb in the past, which only REMOVAL's lookbehind on an
      // auxiliary finds: `PRESENT` reads "lifted" and "grew" as the past, so without it "are removed" and "is dropped"
      // dated these. Added on 2026-10-15, when a mutation dropping the lookbehind survived the examples above, each of
      // whose present passives has the interests for its subject and is found by `PRESENT` too.
      'Interests lifted a meal until they are removed.',
      'An interest grew an ability, until it is dropped from the sheet.',
    ]) expect(at(present), present).toBe(true);
    for (const past of [
      'An interest was dropped from the sheet when the term ended, until migration 94.',
      'Interests lifted a meal until the owner removed them.',
      'Interests went into every meal until 2026-10-10.',
      'Your interest lifted a meal until the owner removed the interests on 2026-10-10.',
      'A favorite interest was one more lift to a meal until migration 94 dropped it.',
      // The dated notes in the tree, as they stand there on 2026-10-15: src/engine/domain/model.ts,
      // src/engine/systems/enjoyment.ts, src/ui/looks/actor.tsx, tests/attributes-matrix.test.ts and docs/UNBITTEN.md.
      'Beside them until 2026-10-10 were their interests, which the owner removed with the question at creation; migration 94 dropped them from every save.',
      'With them went every list that existed only to be matched against them: the look-after menu\'s loves, the crafts at a stage, a rehearsal and a genre (`CRAFTS_AT`, `GENRE_CRAFTS`), a play read\'s, a template\'s (`Template.crafts`), and what creation said they moved (`interestsRead`).',
      'An interest was one too, until the interests went on 2026-10-10.',
      'The interests\' section went with them (2026-10-10).',
      '- **Thirty-seven interests read nothing until they went on 2026-10-10, and most genres still read nothing.** Connected where a student\'s life has the thing: the plays are filed by kind (`genresOfPlay`), and until 2026-10-10 coursework was filed by the craft it was done in (`Template.crafts`), a play read by Reading, and Reading and Politics joined an evening unwinding.',
      'On 2026-10-10 the owner removed the interests, with the crafts\' readers; the genres no play is of are still marked · (`genresRead`).',
    ]) expect(at(past), past).toBe(false);
    for (const money of [
      'Your interest rate goes up to the purchase rate.',
      'The interest is charged once.',
      'Its interest is paid on the first of the month.',
    ]) expect(at(money), money).toBe(false);
  });

  // From the second pass of 2026-10-15. The check of that day ran this file's own regular expressions in node and found
  // each sentence below handled wrong: a plural verb outside the closed list of 46, "went" before "on", "in the" or
  // "at", a clause between subject and verb, the future, two adjectives on a singular, and the present perfect.
  it('finds a present verb outside any list, “went on” and “went in”, a verb past a clause set off by commas, the future and two adjectives, which the first pass of 2026-10-15 passed; passes the present perfect, which it flagged', () => {
    const at = (sentence: string) => NAMES.test(sentence.replace(MONEYS, '')) && !OTHER.test(sentence) && unread({ file: 'src/x.ts', sentence });
    for (const present of [
      'Interests shape a meal, and the owner removed the crafts.',
      'Interests reward an hour, as removed crafts did.',
      'Interests went on lifting a meal.',
      'Interests went in the pot.',
      'Interests went at full value into every meal.',
      'The interests, removed by the owner, lift a meal.',
      'Interests, which the owner removed, still lift a meal.',
      'Interests will lift a meal until migration 94.',
      'Each interest will have been removed by the term’s end.',
      'Her own favo\u0075rite interest lifts a meal.',
      'Her own favorite interest lifts a meal.',
    ]) expect(at(present), present).toBe(true);
    for (const past of [
      'Interests have been removed since 2026-10-10.',
      'An interest has been removed since 2026-10-10.',
      'Interests shaped a meal until the owner removed the crafts.',
      'The interests, removed by the owner on 2026-10-10, lifted a meal before then.',
      'Interests went on 2026-10-10, and with them the crafts.',
      'Her own favorite interest lifted a meal until migration 94 dropped it.',
    ]) expect(at(past), past).toBe(false);
  });

  it('keeps every sentence naming the interests in src/, tests/ and docs/ dated by the removal, or read and listed true; the audit trail, the research records and the two files that quote them aside', () => {
    const files = [...walk('src'), ...walk('tests'), ...walk('docs')].map(posix)
      .filter((f) => /\.(ts|tsx|mjs|js|json|md)$/.test(f))
      // The banks' research as the engine reads it (`content/home-accounts.json`, from 2026-10-16) is set aside with the
      // research it's copied from: it quotes the banks' own terms, "the customer's legitimate interests" among them.
      .filter((f) => !f.startsWith('docs/verification/') && f !== 'docs/GAMEPLAY-COVERAGE.md' && !f.startsWith('docs/research/') && f !== 'docs/drill-down-research.json' && f !== 'src/engine/content/home-accounts.json' && f !== 'tests/evidence2-b13.test.ts' && f !== 'tests/evidence3-person.test.ts');
    expect(files.length).toBeGreaterThan(600);
    const found = namingIn(files);
    expect(found.length).toBeGreaterThan(60);
    expect(READ_TRUE.filter(([file, s]) => !found.some((f) => f.file === file && f.sentence === s)).map(([file, s]) => `${file}: ${s}`)).toEqual([]);
    expect(found.filter(unread).map((f) => `${f.file}: ${f.sentence}`)).toEqual([]);
  }, 60_000);
});
