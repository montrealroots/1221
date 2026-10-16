/**
 * The second round of 2026-10-13 for five rows the first round left partial (verification batch b11): what it closed,
 * what its skeptic found it hadn't, and what neither round could. Each row's gaps are closed through what the player
 * does (the command a screen sends, the screen's own button, or the clock), each consequence read where the row says
 * it's read, on the screen as the player has it (react-dom/server), against figures worked out here from the rule's
 * own numbers, never asked of the helper the engine computes them with.
 *
 * - `trait-spending`: the first round evidenced every behavior; what stayed open was a comment, Review's at
 *   CharacterCreation.tsx:1023, naming an engine sum (`costsAt`) that doesn't exist. Here the claim that comment exists
 *   to make is held instead: Going Out A Month on Review is the day's groceries the clock first posts for the same
 *   pick, 365/12 days of them, to the dollar ($261, $304, $370, $334 for 859, 1000, 1216 and 1097 cents). The comment
 *   itself needed a source change, and was reported; later on 2026-10-13 it was corrected to name `foodAt`, `spending`
 *   and `foodOf`.
 * - `p-abilities`: Stamina's Full, the one computed Full, at 99.4 for a woman of 24 (100 less 0.12 a year from twenty,
 *   `ceilingAt`'s band) and 99.3 the day the clock makes her 25, in the row and in the sentence under the table; Classes
 *   Reach worked from the craft as admitted (each skill and 26, the mean of a new ability's kin's), held while a week of
 *   classes moves Now, and "—" for the four classes don't grow; Today at 7 PM by readiness worked out here from the
 *   seven dials (54 plain, 48 for an early riser, 59 for a night owl), twelve rows each, and twelve “Nothing holds it
 *   back” at 8 AM; and Today under a sprain from the first morning’s run, which reaches the execution and the
 *   consistency of the tasks that list an injury, and of each ability only where one of those reads it. Until
 *   2026-10-13 Today named a cause on every dimension an ability shaped where any task listed the cause for it, and
 *   this held that: Emotional Depth tired in connection, and Vocal Expression and Discipline mending in both. Found on the way, and held by a test that failed until it was fixed later that day: the Current Condition panel’s
 *   fine print said fatigue reaches "execution, consistency and responsiveness", where Today on the same screen names
 *   believability and connection under it too, as `TASK_PROFILES` has it.
 * - `p-journey-history`: Your Work So Far at the end of a played school (r8-a, dismissed by 20 December 2027), every
 *   section worked out here from the records it reads (the work kept, the journey's tallies, the experience record, the
 *   school's calls and notes); How You Tend To Play It from five readings chosen one way, and not from four or from
 *   three of five; the milestones First strong work, First distinction-level work and First work at full mastery, each
 *   the first piece past 65, past 80 and at mastery; a closed run filed by the school's end said once, where the
 *   closed casting and its credit stand together; and a Rep run, which only a fixture reaches, the same.
 * - `h-needs`: the notices under the 2026 return, the six of 159 the panel draws (157 until 2026-10-16), each with its words and how long ago,
 *   worked here; a card payment missed through play, everyday spending put on the card and the current account emptied
 *   into savings before each due date: a payment behind owing $510, then suspended owing $850; and a return filed
 *   with nothing in the bank, You owe $166 of income tax, where its twin who could pay is All Clear.
 * - `h-where-weather`: a student from abroad, born in London, reads "Home." in New Haven as a New Yorker does: the away
 *   line ("… from home in …") was reached by no life since the scope of 2026-10-09 removed the home apart from where
 *   the player stands (`homeCityOf`); it was reported, and went later on 2026-10-13, with Local Time's hours from home.
 *
 * PLAYER JOURNEYS: new lives (`createSave` with `newLifeConfig`), Ada Cole, she/her, an actress at Yale in New Haven
 * from Monday 24 August 2026 at 7:30 AM, born in New York (the birthplace a player picks on Identity), or in London
 * for a student from abroad, played by the clock and by the commands the screens send. Seeds from the first round where
 * its lives are met again: r8-a for a school played through (tests/defects-r8-1.test.ts), g32-needs for the 2026
 * return, g31-today for the first evening, g30-run-624 for the first morning's run that sprains an ankle.
 *
 * TEST SETUP, said again where it's done: a bank emptied by a posting against a test equity line, as the first round
 * set balances, so a return files unpaid; the abilities and techniques set at full and the dials rested before a
 * taped brief, so the first strong, distinction-level and fully mastered pieces come in a week rather than in years
 * nobody plays here; a Rep run set closed on the record, which no played life here reaches; creation's step and its
 * config given through the component's own useState. A button pressed is the component's own onClick, kept on its way
 * through the JSX runtime, and what it sets is given back on the next render by its useState's place, as React would.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Person, Wellbeing } from '@/engine/domain/model';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { instantFromZoned, MS_DAY, MS_HOUR } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { cardsOf, stateOf } from '@/engine/systems/credit';
import { journeyOf } from '@/engine/systems/evaluation';
import { returnsOf } from '@/engine/systems/taxreturn';
import { openDecisions } from '@/engine/world/world';
import { FEATURE_LABEL } from '@/engine/systems/experience';
import { BRIEFS } from '@/engine/content/briefs';
import { BRIEF, genreKnown } from '@/engine/systems/briefs';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** Where `navigate` was sent. */
  went: [] as string[],
  /** Each useState in render order: its number this render, what a press set, and what's given back next render. */
  calls: 0,
  sets: [] as { at: number; value: unknown }[],
  given: new Map<number, unknown>(),
  /** The buttons drawn, with their words and their own onClick. */
  buttons: [] as { text: string; onClick?: () => unknown }[],
}));

// What a press sets is given back by the useState's place in the render, as React keeps it.
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const i = h.calls++;
    const [value] = real.useState(initial);
    const now = h.given.has(i) ? h.given.get(i) : value;
    const set = (action: unknown) => { h.sets.push({ at: i, value: typeof action === 'function' ? (action as (v: unknown) => unknown)(now) : action }); };
    return [now, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepButtons = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (type === 'button' && props) h.buttons.push({ text: textOf(props.children), onClick: props.onClick as (() => unknown) | undefined });
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

// Without the original: it imports the looks, which import it back.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: (to: string) => { h.went.push(to); },
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

// A screen's kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});

const { Home } = await import('@/ui/screens/Home');
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { CharacterCreation } = await import('@/ui/creation/CharacterCreation');

// ---------------------------------------------------------------------------
// Lives, the screens over them, and the figures worked out by hand
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
/** An instant of New Haven's wall clock. */
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const adaConfig = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** Ada Cole at Yale, born in New York, as a new player makes her. */
const ada = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation => createSave(1, seed, adaConfig(extra));
/** The same life born in London: a student from abroad, with a US return to file each year. */
const fromAbroad = (seed: string, extra: Partial<NewSaveConfig> = {}) => ada(seed, { homeRegionId: 'uk-eng-london', ...extra });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/** The words a player reads: titles out, tags out, entities back, and no space before a full stop or a comma. */
const words = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();
/** A screen as the player has it, with what a press set given back. */
function drawn(sim: Simulation, screen: FunctionComponent): { html: string; text: string } {
  h.sim = sim;
  h.calls = 0;
  h.sets = [];
  h.buttons = [];
  const html = renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
  return { html, text: words(html) };
}
/** A button just drawn, by its words (the nth of them); fails if it isn't there. */
function button(said: string | RegExp, nth = 0) {
  const found = h.buttons.filter((b) => (typeof said === 'string' ? b.text === said : said.test(b.text)))[nth];
  expect(found, `a button “${String(said)}”`).toBeDefined();
  return found!;
}
/** Pressed: its own onClick, and what it set given back on the next render. */
function press(b: { onClick?: () => unknown }): unknown {
  h.sets = [];
  const out = b.onClick!();
  for (const s of h.sets) h.given.set(s.at, s.value);
  return out;
}
/** The words from one heading to the next. */
function between(text: string, from: string, to?: string): string {
  const i = text.indexOf(from);
  expect(i, `“${from}” on the screen`).toBeGreaterThanOrEqual(0);
  const j = to ? text.indexOf(to, i + from.length) : -1;
  return text.slice(i, j < 0 ? undefined : j).trim();
}
/** A table's rows as the player reads them, each cell's words. */
const rowsOf = (html: string): string[][] => [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1]!.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => words(c[1]!)));
/** The Attributes And Craft table's twelve rows, by the ability's name. */
function abilityRows(html: string): Map<string, string[]> {
  const from = html.indexOf('>Attributes And Craft<');
  expect(from).toBeGreaterThanOrEqual(0);
  const to = html.indexOf('>Techniques<', from);
  const rows = rowsOf(html.slice(from, to)).slice(1);
  return new Map(rows.map((r) => [r[0]!, r]));
}
/** A date as the US writes it, by the platform's own calendar, not the engine's. */
const written = (instant: number) => new Intl.DateTimeFormat('en-US', { timeZone: NY, month: 'long', day: 'numeric', year: 'numeric' }).format(instant);
/** A tenth, as the engine's records round and the panels print a number that isn't fixed to a place. */
const r1 = (x: number) => Math.round(x * 10) / 10;

/**
 * Readiness worked out by hand from the rule's numbers (`readinessParts`, `systems/life.ts`): each dial carried on a
 * straight line between its two ends and held there, energy 0.45 to 1.15, stress 1.12 to 0.62, sleep debt 1.05 to 0.66
 * over thirty hours, nourishment 0.78 to 1.05, morale 0.82 to 1.12, hygiene 0.92 to 1.03 and condition 0.7 to 1;
 * multiplied, over 1.35, as a hundredth, held between 5 and 100.
 */
function byHand(w: Wellbeing): number {
  const line = (v: number, top: number, a: number, b: number) => a + (b - a) * Math.min(1, Math.max(0, v / top));
  const product = line(w.energy, 100, 0.45, 1.15) * line(w.stress, 100, 1.12, 0.62) * line(w.sleepDebt, 30, 1.05, 0.66)
    * line(w.nourishment, 100, 0.78, 1.05) * line(w.morale, 100, 0.82, 1.12) * line(w.hygiene ?? 80, 100, 0.92, 1.03) * line(w.condition, 100, 0.7, 1);
  return Math.min(100, Math.max(5, (100 * product) / 1.35));
}
const REST = { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, morale: 60, hygiene: 80, condition: 90 };

/**
 * Early Riser's morning 1.1 and evening 0.88 (Night Owl's the other way round), each bent inside the knob's [0.8, 1.2]
 * in log terms, exp(L·tanh(ln v / L)) with L = ln 1.2 above 1 and ln 1.25 below, worked by hand: 1.09142 and 0.89095.
 */
const SHARP = 1.09142;
const FLAT = 0.89095;

beforeEach(() => {
  h.given = new Map();
  h.went = [];
});

// ---------------------------------------------------------------------------
// trait-spending
// ---------------------------------------------------------------------------

describe('trait-spending', () => {
  it('PLAYER JOURNEY: Going Out A Month on creation’s Review is the day’s groceries the clock first posts for the same pick, a month of 365/12 days, to the dollar: $261, $304, $370 and $334', () => {
    const PICKS = { frugal: ['frugal'], plain: [], spender: ['spender'], generous: ['generous'] } as const;
    const posted: Record<string, number> = {};
    const shown: Record<string, string> = {};
    for (const [who, traits] of Object.entries(PICKS)) {
      const config = adaConfig({ personalityTraits: [...traits] });
      const sim = createSave(1, 'b11-month', config);
      // TEST SETUP: CharacterCreation's states in render order, the step (Review, the fifth) and the config.
      h.given = new Map<number, unknown>([[0, 4], [1, config]]);
      h.sim = sim;
      h.calls = 0;
      const text = words(renderToStaticMarkup(createElement(CharacterCreation, { slot: 1 as never, onCancel: () => undefined, onStart: () => undefined })).replace(/<!-- -->/g, ''));
      shown[who] = text.match(/Going Out A Month \$([\d,]+)/)![1]!;
      // The same pick played: the first midnight's groceries, as they went out of the bank.
      sim.advanceTo(at(2026, 8, 25, 1));
      const groceries = sim.universe.transactions.filter((t) => t.memo === 'Groceries');
      expect(groceries, who).toHaveLength(1);
      posted[who] = groceries[0]!.postings.filter((p) => p.amount > 0).reduce((n, p) => n + p.amount, 0);
    }
    // New Haven's $10.00 a day at each knob (the first round's literals): 858.9, 1000, 1215.7 and 1097.3 cents.
    expect(posted).toEqual({ frugal: 859, plain: 1000, spender: 1216, generous: 1097 });
    // A month of them, to the dollar: 859 × 365/12 = $261.28, $304.17, $369.87, $333.67.
    for (const who of Object.keys(PICKS)) expect(shown[who], who).toBe(String(Math.round((posted[who]! * 365) / 12 / 100)));
    expect(shown).toEqual({ frugal: '261', plain: '304', spender: '370', generous: '334' });
  });
});

// ---------------------------------------------------------------------------
// p-abilities
// ---------------------------------------------------------------------------

describe('p-abilities', () => {
  it('PLAYER JOURNEY: Stamina’s Full is the fitness a body her age can be brought to, 99.4 at 24 and 99.3 the day the clock makes her 25, in its row and under the table; every other Full is 100.0', () => {
    // Born on 31 August 2001: 24 on the first morning, 25 a week on. `ceilingAt`'s bands: nothing off a year to
    // nineteen, 0.12 a year from twenty: 100 − 5 × 0.12 = 99.4 at 24, 100 − 6 × 0.12 = 99.28 at 25, 99.3 to one place.
    const sim = ada('b11-birthday', { birthYear: 2001, birthMonth: 8, birthDay: 31 });
    const read = () => {
      const { html, text } = drawn(sim, ProfileWorkspace);
      const rows = abilityRows(html);
      expect(rows.size).toBe(12);
      return { rows, sentence: text.match(/It’s full at the most a body your age can be brought to, ([\d.]+) now/)?.[1], text };
    };
    let { rows, sentence, text } = read();
    expect(rows.get('Stamina')![2]).toBe('99.4');
    expect(sentence).toBe('99.4');
    const others = [...rows].filter(([name]) => name !== 'Stamina').map(([, row]) => row[2]);
    expect(others).toEqual(Array(11).fill('100.0'));
    expect(text).toContain('Age 24 Born August 31, 2001');
    sim.advanceTo(at(2026, 8, 30, 23));
    expect(read().rows.get('Stamina')![2]).toBe('99.4');
    sim.advanceTo(at(2026, 9, 1, 12));
    ({ rows, sentence, text } = read());
    expect(rows.get('Stamina')![2]).toBe('99.3');
    expect(sentence).toBe('99.3');
    expect(text).toContain('Age 25 Born August 31, 2001');
    expect(drawn(reload(sim), ProfileWorkspace).text).toContain('brought to, 99.3 now');
  });

  it('PLAYER JOURNEY: Classes Reach is the craft as admitted and 26 more, or the mean of a new ability’s kin’s, held while the first week of classes moves Now; Presence, Composure, Discipline and Stamina read —, classes don’t build them', () => {
    const sim = ada('b11-reach');
    const admitted = { ...sim.player.craft! } as Record<string, number>;
    // The ceiling a craft is admitted with (McDaniel, Schmidt & Hunter, as `CEILING` cites it): each skill and 26, under 100.
    const reach = (skill: string) => Math.min(100, Math.round((admitted[skill]! + 26) * 10) / 10);
    const mean = (...skills: string[]) => skills.reduce((s, k) => s + reach(k), 0) / skills.length;
    const EXPECTED: Record<string, string> = {
      'Emotional Depth': reach('emotion').toFixed(1),
      Presence: '—',
      'Listening And Responsiveness': mean('scene', 'improv').toFixed(1),
      Imagination: mean('character', 'script').toFixed(1),
      Focus: mean('script', 'coldReading').toFixed(1),
      Memory: reach('memorization').toFixed(1),
      Adaptability: reach('improv').toFixed(1),
      Composure: '—',
      'Vocal Expression': reach('voice').toFixed(1),
      'Physical Expression': reach('movement').toFixed(1),
      Discipline: '—',
      Stamina: '—',
    };
    let { html } = drawn(sim, ProfileWorkspace);
    let rows = abilityRows(html);
    expect(Object.fromEntries([...rows].map(([k, r]) => [k, r[3]]))).toEqual(EXPECTED);
    expect(html.split('title="Classes don’t build it"').length - 1).toBe(4);
    const nowBefore = Object.fromEntries([...rows].map(([k, r]) => [k, r[1]]));
    // A week of classes on the clock: Now moves, the reach doesn't.
    sim.advanceTo(at(2026, 9, 5, 12));
    ({ html } = drawn(sim, ProfileWorkspace));
    rows = abilityRows(html);
    expect(Object.fromEntries([...rows].map(([k, r]) => [k, r[3]]))).toEqual(EXPECTED);
    const moved = [...rows].filter(([k, r]) => r[1] !== nowBefore[k]).map(([k]) => k);
    expect(moved.length).toBeGreaterThanOrEqual(4);
  });

  it('PLAYER JOURNEY: at 7 PM on the first day Today says readiness worked out here from the seven dials, 54 for a plain twin, 48 for an early riser and 59 for a night owl, on every row fatigue reaches, with the dimensions a task that lists fatigue reads it in; at 8 AM all twelve hold nothing back', () => {
    /**
     * What fatigue reaches of each, task by task (`TASK_PROFILES`), in the order the tasks come: the dimensions in which
     * some task reads the ability and lists fatigue for that dimension. Emotional Depth’s connection is read only in
     * partnered work, which lists no condition for it.
     */
    const TIRED: Record<string, string> = {
      'Emotional Depth': 'believability', Imagination: 'believability', Presence: 'connection', 'Listening And Responsiveness': 'connection, responsiveness',
      Focus: 'execution, consistency', Memory: 'execution', Adaptability: 'responsiveness', Composure: 'consistency',
      'Vocal Expression': 'execution, consistency', 'Physical Expression': 'execution', Discipline: 'consistency, execution', Stamina: 'consistency',
    };
    const twins = [['early_riser'], [], ['night_owl']].map((traits) => {
      const sim = ada('g31-today', { personalityTraits: traits });
      sim.advanceTo(at(2026, 8, 24, 19));
      return { sim, rows: abilityRows(drawn(sim, ProfileWorkspace).html) };
    });
    // Nothing slept yet: the three are the same to the last digit, so only the hour's fit tells them apart.
    for (const t of twins) expect(t.sim.player.wellbeing).toEqual(twins[1]!.sim.player.wellbeing);
    const ready = byHand(twins[1]!.sim.player.wellbeing);
    expect(ready).toBeLessThan(60);
    const said = [Math.round(ready * FLAT), Math.round(ready), Math.round(ready * SHARP)];
    expect(said).toEqual([48, 54, 59]);
    twins.forEach(({ rows }, i) => {
      expect(rows.size).toBe(12);
      // Every row: Imagination too from 2026-10-16, read a little in believability (`BASE_INPUTS`), where until then it
      // was read in interpretation alone, which no task's conditions reach, and held nothing back.
      const named = [...rows];
      expect(named).toHaveLength(12);
      for (const [name, row] of named) {
        const m = /^Readiness (\d+), under 60: (.+)$/.exec(row[4]!);
        expect(m, `${name}: ${row[4]}`).not.toBeNull();
        expect(Number(m![1]), name).toBe(said[i]);
        expect(m![2], name).toBe(TIRED[name]);
      }
      // Emotional Depth shapes connection, in partnered work only, where it lists no condition: Today leaves it out.
      // Until 2026-10-13 it named it, and this held every dimension an ability shapes but interpretation.
      expect(rows.get('Emotional Depth')!.slice(4, 6)).toEqual([`Readiness ${said[i]}, under 60: believability`, 'Believability, Connection']);
    });
    // Rested at 8 AM, by the same hand over 60: nothing on any of the twelve.
    const morning = ada('g31-today');
    morning.advanceTo(at(2026, 8, 24, 8));
    expect(byHand(morning.player.wellbeing)).toBeGreaterThanOrEqual(60);
    const rows = abilityRows(drawn(morning, ProfileWorkspace).html);
    expect([...rows.values()].map((r) => r[4])).toEqual(Array(12).fill('Nothing holds it back'));
  });

  it('PLAYER JOURNEY: a run on the first morning sprains her ankle, and Today names an injury mending on the dimensions a task that lists injury reads the ability in, Vocal Expression’s execution and Discipline’s consistency alone; Emotional Depth, Presence, Listening, Imagination and Adaptability hold nothing back', () => {
    const sim = ada('g30-run-624', { personalityTraits: [] });
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok).toBe(true);
    // Over the line by hand, so fatigue isn't what's said.
    expect(byHand(sim.player.wellbeing)).toBeGreaterThanOrEqual(60);
    const rows = abilityRows(drawn(sim, ProfileWorkspace).html);
    expect(rows.size).toBe(12);
    // An injury limiting the body reaches what `TASK_PROFILES` lists it on, task by task: movement’s and partnered
    // work’s execution and consistency, a scene taped on its feet’s too, and a clown’s and a performance’s execution.
    // Each ability’s Today names the dimensions in which one of those reads it, in the order the tasks come. Until
    // 2026-10-13 it named every execution and consistency the ability shapes anywhere, and this held that: Vocal
    // Expression’s consistency, read only in voice work, which lists illness and fatigue, and Discipline’s execution,
    // read only in written work, which lists fatigue.
    const today = Object.fromEntries([...rows].map(([name, row]) => [name, row[4]!]));
    const mending = (dims: string) => `An injury mending: ${dims}`;
    const nothing = 'Nothing holds it back';
    expect(today).toEqual({
      'Emotional Depth': nothing,
      Presence: nothing,
      'Listening And Responsiveness': nothing,
      Imagination: nothing,
      Focus: mending('consistency, execution'),
      Memory: mending('execution'),
      Adaptability: nothing,
      Composure: mending('consistency'),
      'Vocal Expression': mending('execution'),
      'Physical Expression': mending('execution'),
      Discipline: mending('consistency'),
      Stamina: mending('consistency'),
    });
    // The two the column over-reported still shape both: the column It Shapes is every dimension, condition or none.
    expect(rows.get('Vocal Expression')![5]).toBe('Execution, Consistency');
    expect(rows.get('Discipline')![5]).toBe('Consistency, Execution');
    expect(rows.get('Stamina')![7]).toContain('Not with a sprained ankle; it has 7 days yet to mend.');
  });

  it('PLAYER JOURNEY: at 7 PM the Current Condition panel’s fine print names every dimension Today on the same screen says fatigue reaches, believability and connection among them', () => {
    const sim = ada('g31-today');
    sim.advanceTo(at(2026, 8, 24, 19));
    const { html, text } = drawn(sim, ProfileWorkspace);
    const fatigued = [...new Set([...abilityRows(html).values()].flatMap((r) => /^Readiness \d+, under 60: (.+)$/.exec(r[4]!)?.[1]?.split(', ') ?? []))].sort();
    expect(fatigued).toEqual(['believability', 'connection', 'consistency', 'execution', 'responsiveness']);
    const fine = between(text, 'Tired, an actor’s attention', 'An injury holds back');
    // Until 2026-10-13 the sentence named execution, consistency and responsiveness, and left out the two Today names.
    expect(fatigued.filter((d) => !fine.includes(d))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// p-journey-history
// ---------------------------------------------------------------------------

describe('p-journey-history', () => {
  const journey = (sim: Simulation) => between(drawn(sim, ProfileWorkspace).text, 'School Journey', 'Your School');

  /**
   * Your Work So Far worked out here from the records it reads, by the rule's own numbers (`ARTISTRY`: a pattern from
   * 6 pieces, a strength 4 points over the actor's own mean across the latest 40, a weakness from 3 pieces held back,
   * the top three by the points they cost; a feature familiar at 6 meetings, the top four; a note persistent at 3
   * givings; direction from 3 notes; reliability from 6 calls; playing with others from 3 pieces).
   */
  function workSoFar(p: Person): string {
    const j = journeyOf(p);
    const pieces = Object.values(j.totals).reduce((a, t) => a + (t?.n ?? 0), 0);
    const out: string[] = [`Your Work So Far Read from ${pieces} pieces judged, the material met and the choices made How This Works`];
    const section = (title: string, lines: { line: string; evidence: string[] }[]) => { if (lines.length) out.push(title, ...lines.map((l) => `${l.line} From: ${l.evidence.join('; ')}.`)); };
    // Strengths, over the latest forty.
    const work = [...(p.work ?? [])].sort((a, b) => a.at - b.at).slice(-40);
    const mean = work.reduce((a, w) => a + w.overall, 0) / work.length;
    const dims = new Map<string, { sum: number; n: number; q: { what: string; q: number }[] }>();
    for (const w of work) for (const [d, q] of Object.entries(w.dims)) { const x = dims.get(d) ?? { sum: 0, n: 0, q: [] }; x.sum += q as number; x.n += 1; x.q.push({ what: w.what, q: q as number }); dims.set(d, x); }
    section('What Your Work Shows Most', [...dims].filter(([, x]) => x.n >= 6 && x.sum / x.n - mean >= 4).sort(([a], [b]) => a.localeCompare(b))
      .map(([d, x]) => ({ line: `Your ${d} runs ahead of the rest: ${r1(x.sum / x.n)} on average across ${x.n} pieces, against ${r1(mean)} for the whole.`, evidence: x.q.sort((a, b) => b.q - a.q).slice(0, 3).map((b) => `${b.what}: ${r1(b.q)}`) })));
    // Weaknesses for life, and the note that keeps coming back.
    const KIND: Record<string, string> = { ability: 'An ability', technique: 'A technique', preparation: 'Preparation', condition: 'The day' };
    const weak = Object.entries(j.limits ?? {}).filter(([, t]) => t.n >= 3).sort((a, b) => b[1].whole - a[1].whole).slice(0, 3)
      .map(([k, t]) => ({ line: `${t.label} has held back ${t.n} pieces, about ${r1(t.whole / t.n)} points of the whole each.`, evidence: [`${KIND[k.split(':')[0]!] ?? 'The choice'}, ${r1(t.whole)} points in all`] }));
    const notes = ((p.school as { coursework?: { notes?: { key: string; status: string; given: number }[] } }).coursework?.notes ?? []).filter((n) => n.status === 'open' && n.given >= 3).sort((a, b) => b.given - a.given);
    // The class's name for a note on rehearsal: Time On Its Feet.
    expect(notes[0]!.key).toBe('dim:rehearsal');
    weak.push({ line: `The same note has been given ${notes[0]!.given} times and is still open: Time On Its Feet.`, evidence: ['The class’s notes: Time On Its Feet'] });
    section('What Keeps Holding It Back', weak);
    // Material met.
    const features = p.experience?.features ?? {};
    section('Material You Know', Object.entries(features).map(([f, x]) => ({ f, n: x.met + x.practiced, best: x.best })).filter((x) => x.n >= 6 && FEATURE_LABEL[x.f]).sort((a, b) => b.n - a.n).slice(0, 4)
      .map((x) => ({ line: `${FEATURE_LABEL[x.f]}: met or practised ${x.n} times${x.best !== undefined ? `, best ${r1(x.best)}` : ''}.`, evidence: [`The experience record: ${x.f}`] })));
    const unmet = Object.keys(FEATURE_LABEL).filter((f) => !((features[f]?.met ?? 0) + (features[f]?.practiced ?? 0)));
    out.push(`Not met yet: ${unmet.map((f) => FEATURE_LABEL[f]).join(', ')}. A brief built on one is suggested beside a brief.`);
    // Range.
    const kinds = Object.values(j.totals).filter((t) => (t?.n ?? 0) > 0).length;
    const genres = Object.values(p.engagement?.byGenre ?? {}).filter((g) => (g.practice ?? 0) > 0).length;
    section('Range', [{ line: `${kinds} kinds of work judged, ${genres} genres worked in, ${12 - unmet.length} of 12 kinds of material met.`, evidence: [`The journey’s kinds of work: ${kinds}`] }]);
    const dir = j.direction!;
    section('Taking Direction', [{ line: `Of ${dir.given} notes and requests on the craft, ${dir.answered} answered.`, evidence: [`Worked ${dir.worked}, answered ${dir.answered}`] }]);
    const school = p.school as unknown as { tally: { calls: number; answered: number }; callsBefore?: { calls: number; answered: number } };
    const calls = (school.callsBefore?.calls ?? 0) + school.tally.calls;
    const answered = (school.callsBefore?.answered ?? 0) + school.tally.answered;
    const kept = (p.school!.classmates as unknown as { kept?: number }[]).reduce((a, m) => a + (m.kept ?? 0), 0);
    section('Reliability', [{ line: `${answered} of ${calls} calls answered; ${kept} rehearsals with a partner kept.`, evidence: ['The school’s record of calls; your partners’ records'] }]);
    const tog = j.together!;
    section('Playing With Others', [{ line: `${tog.n} pieces played with a partner, a reader or a company came to ${r1(tog.sum / tog.n)} together on average; of ${tog.slips} slips by the others, you covered ${tog.covered}.`, evidence: [`Scenes, takes and nights together: ${tog.n}`] }]);
    return words(out.join(' '));
  }

  it('PLAYER JOURNEY: Your Work So Far at the end of a played school, dismissed by 20 December 2027: every section as the records it reads give it, worked out here, and a reload the same', () => {
    const sim = ada('r8-a');
    sim.advanceTo(at(2027, 12, 20, 12));
    expect(sim.player.school!.standing).toBe('dismissed');
    const shown = between(drawn(sim, ProfileWorkspace).text, 'Your Work So Far', 'Sources And Estimates');
    // The records it reads, as they stood: nine notes on the craft given and none answered.
    expect(journeyOf(sim.player).direction).toEqual({ given: 9, worked: 0, answered: 0, ways: {} });
    expect(shown).toBe(workSoFar(sim.player));
    // Each of the sections the first round didn't read is there, and the habit nobody chose isn't.
    for (const title of ['What Your Work Shows Most', 'What Keeps Holding It Back', 'Material You Know', 'Not met yet:', 'Range', 'Taking Direction', 'Reliability', 'Playing With Others']) expect(shown, title).toContain(title);
    expect(shown).not.toContain('How You Tend To Play It');
    expect(shown).toContain('Taking Direction Of 9 notes and requests on the craft, 0 answered. From: Worked 0, answered 0.');
    expect(shown).toContain('Reliability 68 of 68 calls answered; 0 rehearsals with a partner kept.');
    expect(between(drawn(reload(sim), ProfileWorkspace).text, 'Your Work So Far', 'Sources And Estimates')).toBe(shown);
  });

  it('PLAYER JOURNEY: How You Tend To Play It names a way chosen 5 times of 5, or 4 of 5; not 4 of 4, nor 3 of 5 (a habit from 5 choices, at 70%)', () => {
    const chose = (seed: string, ways: ('driven' | 'measured')[]) => {
      const sim = ada(seed);
      ways.forEach((pace, i) => {
        const b = BRIEFS[i]!;
        expect(sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id, pace } }).ok, b.id).toBe(true);
      });
      return between(drawn(sim, ProfileWorkspace).text, 'Your Work So Far', 'Sources And Estimates');
    };
    expect(chose('b11-habit-5', ['driven', 'driven', 'driven', 'driven', 'driven'])).toContain('How You Tend To Play It You play it driven: 5 of 5 choices on pace. From: Ways chosen: Measured 0, Driven 5; Shown in work: Measured 0, Driven 0.');
    expect(chose('b11-habit-41', ['driven', 'measured', 'driven', 'driven', 'driven'])).toContain('How You Tend To Play It You play it driven: 4 of 5 choices on pace. From: Ways chosen: Measured 1, Driven 4; Shown in work: Measured 0, Driven 0.');
    expect(chose('b11-habit-4', ['driven', 'driven', 'driven', 'driven'])).not.toContain('How You Tend To Play It');
    expect(chose('b11-habit-32', ['driven', 'measured', 'driven', 'measured', 'driven'])).not.toContain('How You Tend To Play It');
  });

  it('PLAYER JOURNEY: the milestones First strong work, First distinction-level work and First work at full mastery name the first taped piece past 65, past 80 and at mastery, once each (TEST SETUP: her abilities and techniques at full and the dials rested, as years of work would leave her)', () => {
    const sim = ada('b11-strong');
    // TEST SETUP: years nobody plays here, set at full: every technique, every ability, and her fitness at her age's 99.4.
    Object.assign(sim.player.craft!, Object.fromEntries(Object.keys(sim.player.craft!).map((k) => [k, 100])));
    Object.assign(sim.player.attrs!, { presence: 100, composure: 100, listening: 100, imagination: 100, focus: 100, adaptability: 100, discipline: 100 });
    const rest = () => Object.assign(sim.player.wellbeing, REST, { fitness: 99.4 }); // TEST SETUP
    rest();
    sim.advanceTo(at(2026, 8, 29, 13));
    const b = BRIEFS[0]!;
    const genre = b.kinds[0]!;
    const tape = () => { rest(); const r = sim.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre, brief: b.id } }); expect(r.ok, r.error).toBe(true); return r.value!.overall; };
    // Another brief, of another genre, taped before any preparation: under 65, and no milestone.
    const other = BRIEFS.find((x) => !x.kinds.includes(genre))!;
    expect(sim.execute({ kind: 'brief.choose', payload: { brief: other.id, reading: other.readings[0]!.id } }).ok).toBe(true);
    rest();
    const cold = sim.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: other.kinds[0]!, brief: other.id } });
    expect(cold.ok, cold.error).toBe(true);
    expect(cold.value!.overall).toBeLessThan(65);
    expect(sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id } }).ok).toBe(true);
    expect(journeyOf(sim.player).milestones).toEqual([]);
    // From 2026-10-16 a genre never met keeps three quarters of a take's interpretation (`EVALUATION.partFloor`), where it
    // kept 0.35 and held a master's prepared take under 80 until then; and it's known in full at 90, not 30. So the strong
    // take is now the one a step of each part leaves, the reading then changed, which keeps half the breakdown; the
    // distinction-level one the brief prepared with the genre still unknown; and mastery the genre studied once a day until
    // the brief counts it known. (Until then the strong take was the prepared one, held under 80 by the genre unknown.)
    const step = (s: string) => { rest(); expect(sim.execute({ kind: 'brief.prepare', payload: { brief: b.id, step: s } }).ok, s).toBe(true); };
    // From 2026-10-16 the genre's register leans the take too (`content/genre-register.ts`), and a step of each part with
    // the reading changed once came to 80.0, past the strong band: the reading is changed and changed back, each change
    // keeping half the breakdown (`BRIEF.readingKept`), so the strong take, 73.7, is a quarter of the breakdown in.
    for (const s of ['read', 'lines', 'rehearse']) step(s);
    for (const r of [1, 0]) expect(sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[r]!.id } }).ok).toBe(true);
    tape();
    for (const s of ['read', 'read', 'read', 'lines', 'lines', 'rehearse', 'rehearse', 'rehearse', 'rehearse']) step(s);
    for (let k = 0; k < 3; k++) tape();
    // Once a day, at the first hour the calendar leaves free.
    let studies = 0;
    for (let h = 0; h < 24 * 60 && genreKnown(sim.player, b) < BRIEF.complete.genre; h++) {
      rest();
      if (sim.execute({ kind: 'genre.study', payload: { genre } }).ok) { studies += 1; sim.advanceTo(sim.now + 20 * MS_HOUR); } else sim.advanceTo(sim.now + MS_HOUR);
    }
    // 100 × 0.08 of what's left, once a day: past 90 on the 28th at the soonest (0.92^28 = 0.097), more where two fell
    // on one day and the second kept half.
    expect(studies).toBeGreaterThanOrEqual(28);
    // The breakdown, two readings in, finished on a day of its own.
    step('read');
    for (let k = 0; k < 3; k++) { sim.advanceTo(sim.now + 2 * MS_HOUR); tape(); }
    // Found here in the work kept, by the bands' own lines (`EVALUATION.bands`: strong at 65, exceptional at 80).
    const work = [...sim.player.work!].sort((a, b2) => a.at - b2.at);
    const strong = work.find((w) => w.overall >= 65)!;
    const exceptional = work.find((w) => w.overall >= 80)!;
    const mastered = work.find((w) => w.mastery)!;
    expect(strong.overall).toBeLessThan(80);
    expect(exceptional.at).toBeGreaterThan(strong.at);
    expect(mastered.at).toBeGreaterThan(exceptional.at);
    expect(work.filter((w) => w.overall >= 80).length).toBeGreaterThan(2);
    expect(work.filter((w) => w.mastery).length).toBeGreaterThan(1);
    const shown = between(drawn(sim, ProfileWorkspace).text, 'School Journey', 'Work What Whole');
    const said = [
      `${written(mastered.at)}: First work at full mastery: ${mastered.what}, ${mastered.overall.toFixed(1)}`,
      `${written(exceptional.at)}: First distinction-level work: ${exceptional.what}, ${exceptional.overall.toFixed(1)}`,
      `${written(strong.at)}: First strong work: ${strong.what}, ${strong.overall.toFixed(1)}`,
    ];
    expect(shown).toContain(said.join(' '));
    expect(shown.split(': First ').length - 1).toBe(3);
  });

  it('PLAYER JOURNEY: dismissed in December 2027, her closed Woyzeck filed as a credit and still her casting, School Journey says each part she played once', () => {
    const sim = ada('r8-a');
    sim.advanceTo(at(2027, 12, 20, 12));
    const school = sim.player.school!;
    const casting = school.casting as NonNullable<typeof school.casting> & { closed?: number };
    // Both on the record at once: the run closed and kept as the casting, and filed by the dismissal (`keepCredit`).
    expect([casting.role, casting.production, casting.performed, casting.closed !== undefined]).toEqual(['Marie', 'Directors’ Thesis Production I', 8, true]);
    expect(school.credits!.map((c) => [c.role, c.production])).toEqual([['A Leading Part In A New Play', 'Carlotta Festival Of New Plays'], ['Marie', 'Directors’ Thesis Production I']]);
    const said = 'School Journey Left the school, dismissed How This Works On stage: A Leading Part In A New Play in Carlotta Festival Of New Plays, 2027; Marie in Directors’ Thesis Production I, 2027.';
    expect(journey(sim)).toBe(said);
    expect(journey(reload(sim))).toBe(said);
  });

  it('a Rep night closed is on stage beside the School’s run, and filed by a withdrawal still once (TEST SETUP: the Rep run set on the record: only a fixture reaches it here)', () => {
    const sim = ada('r8-a');
    sim.advanceTo(at(2027, 6, 5, 12));
    // TEST SETUP: an understudy's Rep run, The Seagull's, sent on once and closed on its last night.
    (sim.player.school as unknown as { rep: unknown }).rep = { production: 'The Seagull', role: 'Nina', kind: 'understudy', term: 1, performed: 1, closed: at(2027, 3, 27, 22) };
    expect(journey(sim)).toBe('School Journey Year 1 of three, academic warning How This Works On stage: A Leading Part In A New Play in Carlotta Festival Of New Plays, 2027; Nina in The Seagull, 2027.');
    expect(sim.execute({ kind: 'school.withdraw', payload: { confirm: true } }).ok).toBe(true);
    expect(sim.player.school!.credits!.map((c) => c.role)).toEqual(['A Leading Part In A New Play', 'Nina']);
    expect(journey(sim)).toBe('School Journey Left the school, withdrawn How This Works On stage: A Leading Part In A New Play in Carlotta Festival Of New Plays, 2027; Nina in The Seagull, 2027.');
  });
});

// ---------------------------------------------------------------------------
// h-needs
// ---------------------------------------------------------------------------

describe('h-needs', () => {
  const needs = (sim: Simulation) => between(drawn(sim, Home).text, 'What Needs You', 'How You Are');
  const unread = (sim: Simulation) => sim.universe.notifications.filter((n) => !n.read).length;
  /** Mark N Read, pressed on the panel, N counted here from the save. */
  const markRead = (sim: Simulation) => {
    const n = unread(sim);
    expect(n).toBeGreaterThan(0);
    drawn(sim, Home);
    expect(press(button(`Mark ${n} Read`))).toMatchObject({ ok: true, value: { read: n } });
  };
  /** How long ago, by the clock's own rule worked out here: days and hours to a fortnight, weeks to sixty days, then months of 30.44 days. */
  const ago = (then: number, now: number) => {
    const hours = Math.round((now - then) / MS_HOUR);
    const d = Math.floor(hours / 24);
    if (d < 14) return hours % 24 ? `${d}d ${hours % 24}h ago` : `${d} days ago`;
    if (d < 60) return `${Math.round(d / 7)} weeks ago`;
    return `${Math.round(d / 30.44)} months ago`;
  };

  it('PLAYER JOURNEY: on 1 February 2027 the notices under her return are the six most pressing of 159, each with its words and how long ago it came, a word on each term’s coursework among them', () => {
    const sim = fromAbroad('g32-needs');
    sim.advanceTo(at(2027, 2, 1, 12));
    // 157 until 2026-10-16, when a term whose pieces come out Unready was warned in the term (`termWarning`): this life
    // prepares nothing, and both its terms so far were warned.
    expect(unread(sim)).toBe(159);
    const { html, text } = drawn(sim, Home);
    expect(text).toContain('Mark 159 Read');
    const items = [...html.matchAll(/<div class="list-item list-static">([\s\S]*?)Go There<\/button><\/div>/g)].map((m) => words(m[1]!));
    // The most important first, the newest first among equals, worked out here from the notices themselves.
    const unreadNotes = sim.universe.notifications.filter((n) => !n.read && n.route);
    const order = [...unreadNotes].sort((x, y) => (y.importance ?? 0) - (x.importance ?? 0) || y.at - x.at);
    const seenTitles = new Set<string>();
    const top = order.filter((n) => { const k = `${n.title}|${n.body}`; if (seenTitles.has(k)) return false; seenTitles.add(k); return true; }).slice(0, 6);
    expect(items).toHaveLength(6);
    expect(top.slice(0, 3).map((n) => n.title)).toEqual(['A Notice Of Academic Concern', 'A Deep Cut', 'Welcome To The Class Of 2029']);
    expect(top.filter((n) => n.title === 'A Word On Your Coursework')).toHaveLength(2);
    expect(items).toEqual(top.map((n) => words(`${n.title} ${n.body} ${ago(n.at, sim.now)}`)));
    // Each has somewhere to go: the return's Go There and six more.
    expect(h.buttons.filter((b) => b.text === 'Go There')).toHaveLength(7);
    press(button('Go There', 3));
    expect(h.went).toEqual(['/workspace/school']);
  });

  it('PLAYER JOURNEY: her everyday spending put on the card and the current account moved into savings an hour before each due date, the autopay bounces: a payment behind owing $510, then suspended owing $850, said once the notices are read, across a reload', () => {
    const sim = ada('b11-card');
    const card = cardsOf(sim, sim.player)[0]!;
    expect(card.balance).toBe(0);
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
    const checking = sim.universe.accounts[sim.player.primaryAccountId!]!;
    const savings = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'savings')!;
    const nextDue = () => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === 'card.due').sort((a, b) => a.at - b.at)[0];
    const toDue = () => {
      // The statement comes first, and with it the due date the player reads on the card.
      for (let d = 0; d < 40 && !nextDue(); d++) sim.advanceTo(sim.now + MS_DAY);
      const due = nextDue()!;
      expect(due).toBeDefined();
      sim.advanceTo(due.at - MS_HOUR);
      expect(checking.balance).toBeGreaterThan(0);
      sim.must({ kind: 'bank.transfer', payload: { fromId: checking.id, toId: savings.id, amount: checking.balance } });
      sim.advanceTo(due.at + 60_000);
      return due.at;
    };
    const first = toDue();
    expect(written(first)).toBe('October 11, 2026');
    expect(needs(sim)).toContain('A Late Card Payment The minimum was $40.00 and only $0.00 went in. A $30.00 fee, and it goes on your record if it’s still short at the next due date, thirty days past due.');
    markRead(sim);
    // New Haven's $10.00 of groceries on the card each midnight from 25 August to 11 October, 48 of them, and the late
    // fee: Regulation Z's safe harbor, $30 for a first, never over the $40 minimum it was late on.
    expect(needs(sim)).toBe(`What Needs You No decision is waiting on you. How This Works No Decisions Waiting Your card is a payment behind, owing $${48 * 10 + 30}.`);
    const second = toDue();
    expect(written(second)).toBe('November 10, 2026');
    expect(needs(sim)).toContain('Your Card Is Suspended 2 payments missed in a row. Chase has stopped the Chase Freedom Unlimited until it’s brought up to date.'); // Until 2026-10-16 (brief 09's banking follow-up) this asserted the notice's straight apostrophe (\').
    markRead(sim);
    // 78 days of groceries to 10 November, the first fee and a repeat within six cycles: the safe harbor's $41, held to
    // the $40 minimum.
    const said = `What Needs You No decision is waiting on you. How This Works No Decisions Waiting Your card is suspended, owing $${78 * 10 + 30 + 40}.`;
    expect(needs(sim)).toBe(said);
    expect(stateOf(sim.player, card)).toMatchObject({ missed: 2, suspended: 'late' });
    expect(needs(reload(sim))).toBe(said);
  });

  it('PLAYER JOURNEY: File It pressed with nothing in the bank files her return unpaid, and once its notices are read What Needs You says You owe $166 of income tax, 10% of her $1,656; her twin who could pay is All Clear (TEST SETUP: the bank emptied)', () => {
    const filed = (empty: boolean) => {
      const sim = fromAbroad('g32-needs');
      sim.advanceTo(at(2027, 2, 1, 12));
      const decision = openDecisions(sim)[0]!;
      // $1,656 of income at the first bracket's 10%: $165.60, as the row says.
      expect(decision.detail).toContain('You owe $165.60 on $1,656.00 of income.');
      expect(Math.round(1656_00 * 0.1)).toBe(165_60);
      const mine = Object.values(sim.universe.accounts).filter((x) => x.ownerId === sim.player.id && !x.nominal && (x.kind === 'checking' || x.kind === 'savings'));
      expect(mine).toHaveLength(2);
      // TEST SETUP: for the one who can't pay, both accounts emptied by a posting against a test equity line.
      for (const a of empty ? mine : []) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: a.balance }] });
      drawn(sim, Home);
      expect(press(button('File It'))).toMatchObject({ ok: true, value: { ok: true } });
      expect(returnsOf(sim.player)['2026']!.filedAt).toBe(sim.now);
      expect(sim.universe.decisions[decision.id]!.resolvedAt).toBe(sim.now);
      markRead(sim);
      return sim;
    };
    const unpaid = filed(true);
    expect(returnsOf(unpaid.player)['2026']!.owed).toBe(165_60);
    expect(needs(unpaid)).toBe('What Needs You No decision is waiting on you. How This Works No Decisions Waiting You owe $166 of income tax.');
    unpaid.advanceTo(at(2027, 2, 1, 23));
    expect(needs(unpaid)).toContain('You owe $166 of income tax.');
    const paid = filed(false);
    expect(returnsOf(paid.player)['2026']!.owed).toBeUndefined();
    expect(needs(paid)).toBe('What Needs You No decision is waiting on you. How This Works All Clear You owe nobody anything past due, the bank and the card are in order, and the calendar doesn’t clash. Go and do something you want to do.');
  });
});

// ---------------------------------------------------------------------------
// h-where-weather
// ---------------------------------------------------------------------------

describe('h-where-weather', () => {
  const where = (sim: Simulation) => between(drawn(sim, Home).text, 'Where You Are', 'Daylight');

  it('PLAYER JOURNEY: a student from abroad, born in London, reads Home. in New Haven as a New Yorker does, with no distance or hours from home: Home is the city she lives in (`homeCityOf`), and London is where she’s from', () => {
    const london = fromAbroad('b11-where');
    const newYork = ada('b11-where');
    const said = 'Where You Are How This Works New Haven, Connecticut · United States Home. 130K people. Local Time 7:30 AM EDT';
    expect(where(london)).toBe(said);
    expect(where(newYork)).toBe(said);
    // Where she's from is kept, and read on the Profile: not where Home measures from.
    expect(drawn(london, ProfileWorkspace).text).toContain('From London A citizen of the United Kingdom');
    london.advanceTo(at(2026, 9, 14, 12));
    expect(where(london)).toBe('Where You Are How This Works New Haven, Connecticut · United States Home. 130K people. Local Time 12:00 PM EDT');
  });
});
