/**
 * The second round of 2026-10-13 for two rows of verification group g34-ui that the first round
 * (`tests/evidence-g34-ui.test.ts`) and its check left partial: what the interests, removed on 2026-10-10 (migration
 * 94), left on the screens and in the prose.
 *
 * - i-ui-text: the check found the one line the first round's renders couldn't reach. `sourceWords`
 *   (`src/ui/looks/actor.tsx`) says "An interest, from before they were removed" for a development record an hour of
 *   an interest wrote before 2026-10-10, and migration 94 kept the development history. The first round drew the
 *   Profile and the looks on new lives only, where no such record can be. Here a save written by 93 with an hour of
 *   the Sound Design interest on its record is opened through `openSlot`, and the Profile and the ability's look are
 *   drawn from it: that line is the only interest wording on either. Its twin without the hour has none at all.
 *   After an hour of practice the Listening column names the practice and the history still keeps the line. The
 *   person's look, which the check named, draws no development history, and has no interest wording on the same save.
 *   The guide's reference is drawn as the player opens it: every entry by its own address, the contents, and a
 *   search for "interests" and for "interest". So are the tutorial's chapters, in the guide's own dialog. The first
 *   round read the guide and the tutorial as data only.
 * - i-stale-claims: the first round's past-tense check took "was", "had", "kept" and "named" for the past, so "The
 *   interests are kept on the sheet and named on the Profile." passed it, and it read five files. Here, until
 *   2026-10-15, a sentence that named the removed interests passed if it carried a word taken for history (until,
 *   went, removed, dropped, deleted, gone, no longer, let go, from before, 2026-10-10, migration 94). "Interests lift
 *   a meal until they are removed." passed that too. From 2026-10-15 it is held to tests/evidence3-person.test.ts's
 *   stricter rule: dated by the removal in the past, with no clause that has the interests do something in the
 *   present, and the possessive and adjective singulars named. Otherwise it must be one of
 *   the sentences listed below, read here and found true in the present tense: a statement of absence, a test's
 *   title, a message a test fails with, a fixture's description, or a sentence already in the past. The rule
 *   is held twice: over the places the row corrected, and over all of src/, tests/ and docs/. The first passed when
 *   this was written. The second failed on four leftovers that nothing had caught. One of them was in the engine
 *   (migration 92's comment in src/engine/index.ts, "familiarity, sessions and interests begin at nothing"). The
 *   other three were in tests/attributes-matrix.test.ts, tests/looks.test.ts and docs/UNBITTEN.md. Each needed an
 *   edit to a file this round doesn't write, and the second test fails until each is put in the past. The research
 *   records and the audit trail are left out of the walk. So are the contacts' three interests of their own, which
 *   went in the owner's scope reset of 2026-10-09: that was another removal. docs/REQUIREMENTS.md still said them in
 *   the present on 2026-10-13.
 *
 * PLAYER JOURNEYS: a new life (`newLifeConfig`), Ada Cole, born in New York, an actor at Yale in New Haven from
 * Monday 24 August 2026, "I Know SLATE." chosen (`tutorial: false`), so every part of the game is open; for the
 * tutorial's chapters, the same Ada with the guide on (`tutorial: true`), as a new player has it. Her save is opened
 * through `openSlot`, the path the game opens a slot by. Practice is the Profile's own command (`practice.exercise`),
 * and the clock is `advanceTo`. The screens are drawn with react-dom/server, with `useGame` standing in for the
 * provider. The guide's entries are opened by their address (`#/home?help=<entry>`), the way a link opens them.
 *
 * TEST SETUP, said again where it's done: the save rewritten as 93 wrote it. The interests are put back on the sheet,
 * with the record of one, the version is set to 93, and for the life that had one, the development record an hour
 * of the Sound Design interest wrote. `interest.pursue` was the only writer of that record, and it went on
 * 2026-10-10. The day's dials are set each six hours (`tended`), as a player's meals and sleep keep them. A stand-in
 * for the page's window holds the address, since these run with no page. And for the reference's search, the trail
 * a player who typed into Search The Guide has, which a static render can't type.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { createSave, loadSave, openSlot } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { SaveUniverse } from '@/engine/domain/model';
import { MS_HOUR } from '@/engine/core/time';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { LOCAL_STORE, LocalSaveAdapter } from '@/engine/persistence/local';
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

const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { HelpProvider } = await import('@/ui/guide/Help');
const { GuideProvider } = await import('@/ui/guide/Guide');
const { at } = await import('@/ui/looks');
const { resolveLook } = await import('@/ui/looks/registry');

// ---------------------------------------------------------------------------------------------------------------------
// Lives, the clock, and the screens over them
// ---------------------------------------------------------------------------------------------------------------------

/** Ada, as Identity leaves her: born in New York, named, she/her, "I Know SLATE." chosen; else as a new life begins. */
const ada = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', tutorial: false, ...extra });
/** An instant in New Haven on Eastern Daylight Time (UTC−4), worked out here, not by the engine. */
const EDT = (year: number, month: number, day: number, hour: number, minute = 0): number => Date.UTC(year, month - 1, day, hour + 4, minute);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/** TEST SETUP: the clock moved six hours at a time with the body kept fed, rested and awake, as a player's meals and sleep keep it. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

/** What the player reads: the markup with every tag taken out and its entities read. */
const onScreen = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  // A tag closed before a stop leaves a space the reader doesn't see.
  .replace(/ ([.,;:])/g, '$1');
interface Drawn { html: string; text: string; controls: { type: string; props: Record<string, unknown>; text: string }[] }
/** A screen as the player has it over a save: its markup, its words, and its controls. */
function drawn(sim: Simulation, screen: FunctionComponent | ReactElement, states: unknown[] = []): Drawn {
  h.sim = sim;
  h.states = [...states];
  h.controls = [];
  const html = renderToStaticMarkup(typeof screen === 'function' ? createElement(screen) : screen).replace(/<!-- -->/g, '');
  expect(h.states, 'every state set up was asked for').toHaveLength(0);
  return { html, text: onScreen(html), controls: [...h.controls] };
}
/** The words of each block the markup draws (a paragraph, an item, a heading, a fact, a button), one by one. */
const blocks = (html: string) => html.split(/<\/?(?:p|li|dt|dd|h[1-6]|summary|button|div|ol|ul|dl|section|article|nav|label|form)\b[^>]*>/)
  .map((b) => onScreen(b).trim()).filter(Boolean);
const said = (c: Drawn['controls'][number]) => [c.text, c.props.id, c.props.name, c.props.htmlFor, c.props['aria-label'], c.props.title, c.props.placeholder, c.props.value].filter((x) => typeof x === 'string').join(' ');
const count = (text: string, words: string) => text.split(words).length - 1;

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(key: string) { return this.map.get(key) ?? null; }
  key(index: number) { return [...this.map.keys()][index] ?? null; }
  removeItem(key: string) { this.map.delete(key); }
  setItem(key: string, value: string) { this.map.set(key, value); }
}

// ---------------------------------------------------------------------------------------------------------------------
// i-ui-text
// ---------------------------------------------------------------------------------------------------------------------

/** The one line the screens still say of an interest, for a record from before 2026-10-10 (`sourceWords`). */
const THE_LINE = 'An interest, from before they were removed';
/** Thursday 27 August 2026, 9 PM: an hour of the Sound Design interest (a radio drama listened to, eyes closed), which 93 let be had at any hour. */
const SOUND_HOUR = EDT(2026, 8, 27, 21);
/** Money's words: any "interest" left in the guide must stand among them. */
const MONEY = /\b(?:rates?|apr|tax\w*|cards?|banks?|owed?|owing|paid|pay\w*|earn\w*|statements?|penalt\w*|deposits?|loans?|overdraft|overdrawn|balances?|plans?|accounts?|irs|fees?|returns?|money|savings|cds?|terms?|debts?|purchases?|transfers?|withdraw\w*|cash|rewards|accru\w*|compound\w*|connecticut|income|refund\w*|charg\w*|\$[\d,.]+)\b/i;

describe('i-ui-text', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true });
  });
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'localStorage');
    Reflect.deleteProperty(globalThis, 'window');
  });

  /**
   * TEST SETUP: the save as 93 wrote it, as tests/migration-94.test.ts writes one. The interests are back on the sheet
   * with the record of one, the version is 93, and with `hour`, the development record an hour of the Sound Design
   * interest wrote on Listening, as `interest.pursue` wrote it until 2026-10-10 (its source `interest:<id>`). The level
   * it grew is left as the life has it, since only the words are read here. Written to the device's store as the game
   * writes a slot.
   */
  async function written93(sim: Simulation, hour: boolean): Promise<LocalSaveAdapter> {
    const u = JSON.parse(serialise(sim.universe)) as SaveUniverse;
    const p = u.people[u.playerId] as unknown as Record<string, unknown> & {
      engagement?: Record<string, unknown>;
      development?: { day: string; counts: Record<string, number>; history: { at: number; id: string; delta: number; source: string }[] };
    };
    p.interests = ['sound_design', 'cooking'];
    p.engagement ??= { byGenre: {} };
    p.engagement.byInterest = { sound_design: { familiarity: 6, sessions: 1, satiation: 0.25, satiatedAt: SOUND_HOUR, lastAt: SOUND_HOUR } };
    if (hour) {
      p.development ??= { day: '', counts: {}, history: [] };
      p.development.history.push({ at: SOUND_HOUR, id: 'listening', delta: 0.12, source: 'interest:sound_design' });
    }
    u.meta.schemaVersion = 93;
    const adapter = new LocalSaveAdapter(LOCAL_STORE);
    await adapter.save(u);
    return adapter;
  }
  /** PLAYER JOURNEY: Ada's first days to Friday 28 August, 8 AM, written by 93, and the slot opened as the game opens it. */
  async function opened(seed: string, hour: boolean): Promise<Simulation> {
    const sim = createSave(1, seed, ada({ genres: ['comedy'] }));
    tended(sim, EDT(2026, 8, 28, 8));
    // A new life's development history is still empty by then.
    expect(sim.player.development?.history ?? []).toEqual([]);
    const got = await openSlot(await written93(sim, hour), 1);
    if ('error' in got) throw new Error(got.error);
    expect([got.migration.from, got.migration.to]).toEqual([93, 94]);
    expect(got.migration.steps).toContain('Let go of 1 person’s interests: the game no longer keeps them.');
    return loadSave(got.universe);
  }
  /** The Profile's Listening row, from its name to the next ability's. */
  const listeningRow = (text: string) => text.slice(text.indexOf('Listening And Responsiveness'), text.indexOf('Imagination', text.indexOf('Listening And Responsiveness')));
  /** The Profile's Development History panel, from its title to the end. */
  const historyPanel = (text: string) => text.slice(text.indexOf('Development History'));

  it('PLAYER JOURNEY: a 93 save with an hour of the Sound Design interest on its record, opened through openSlot, has the Profile and the ability’s look say that hour in the past tense, the one interest wording on either; its twin without the hour says none; an hour of practice takes the Listening column and the history keeps the line, across a save and a load', async () => {
    const game = await opened('b13-sound-hour', true);
    // Migration 94 dropped the interests and kept the development history whole.
    expect('interests' in game.player).toBe(false);
    expect(game.player.development!.history).toEqual([{ at: SOUND_HOUR, id: 'listening', delta: 0.12, source: 'interest:sound_design' }]);

    // The Profile, as she opens it that morning.
    const page = drawn(game, ProfileWorkspace);
    expect(page.text).toContain('Player Profile Ada Cole');
    // Attributes And Craft: Listening's last change is the hour, to two places.
    expect(listeningRow(page.text)).toContain(`+0.12, ${THE_LINE} `);
    // Development History, newest first: the day, the ability by name, to three places.
    expect(historyPanel(page.text)).toContain(`Development History The latest 400 changes, newest first August 27, 2026: Listening And Responsiveness +0.120, ${THE_LINE}`);
    // Twice, in those two places, and nothing else on the page or its controls says interest.
    expect(count(page.text, THE_LINE)).toBe(2);
    expect(page.text.split(THE_LINE).join('')).not.toMatch(/\binterests?\b/i);
    expect(page.controls.filter((c) => /interest/i.test(said(c)))).toEqual([]);

    // The ability's look, opened from Listening's name: the same hour, in its last change and its list.
    h.sim = game;
    const look = resolveLook(game, at('ability', 'listening'));
    if (!look || 'gone' in look) throw new Error('Listening’s look didn’t resolve');
    const body = onScreen(renderToStaticMarkup(createElement('div', null, look.body)));
    expect(body).toContain(`Last Change +0.12 ${THE_LINE}, August 27, 2026`);
    expect(body).toContain(`August 27, 2026: +0.120, ${THE_LINE}`);
    expect(count(body, THE_LINE)).toBe(2);
    expect(`${look.name} ${look.summary} ${body.split(THE_LINE).join('')}`).not.toMatch(/\binterests?\b/i);
    // The person's look draws no development history: on the same save it says no interest at all.
    const person = resolveLook(game, at('person', game.player.id));
    if (!person || 'gone' in person) throw new Error('Ada’s own look didn’t resolve');
    const own = onScreen(renderToStaticMarkup(createElement('div', null, person.body)));
    expect(own).toContain('The films you love. Comedy.');
    expect(`${person.summary} ${own}`).not.toMatch(/interest/i);

    // The twin, the same life and the same 93 save without the hour: no interest on the Profile at all.
    const twin = drawn(await opened('b13-sound-hour', false), ProfileWorkspace);
    expect(twin.text).not.toMatch(/interest/i);
    expect(listeningRow(twin.text)).toContain(' None yet ');
    expect(historyPanel(twin.text)).toContain('Nothing yet: the history begins with the first class, step or hour of practice.');

    // An hour of the Repetition Exercise at 1 PM, the Profile's Practice An Hour for Listening.
    tended(game, EDT(2026, 8, 28, 13));
    game.must({ kind: 'practice.exercise', payload: { exercise: 'repetition', tier: 0, focus: 'steady' } });
    const listened = game.player.development!.history.filter((x) => x.id === 'listening');
    expect(listened.map((x) => x.source)).toEqual(['interest:sound_design', 'practice:repetition']);
    const after = drawn(game, ProfileWorkspace);
    // The column says the practice now, and the line is gone from it.
    expect(listeningRow(after.text)).toMatch(/\+\d\.\d\d, The Repetition Exercise /);
    expect(listeningRow(after.text)).not.toContain(THE_LINE);
    // The history keeps the hour, under the practice, once.
    const history = historyPanel(after.text);
    expect(history.indexOf('The Repetition Exercise')).toBeGreaterThan(0);
    expect(history.indexOf(THE_LINE)).toBeGreaterThan(history.indexOf('The Repetition Exercise'));
    expect(count(after.text, THE_LINE)).toBe(1);

    // Saved and loaded: the record and the line are the save's.
    const again = drawn(reload(game), ProfileWorkspace);
    expect(historyPanel(again.text)).toContain(`August 27, 2026: Listening And Responsiveness +0.120, ${THE_LINE}`);
    expect(again.text.split(THE_LINE).join('')).not.toMatch(/\binterests?\b/i);
  }, 60_000);

  /** TEST SETUP: the page's window, holding the address the reference reads; these run with no page. */
  const address = (hash: string) => {
    Object.defineProperty(globalThis, 'window', {
      value: { location: { hash }, history: { state: null, replaceState: () => undefined }, addEventListener: () => undefined, removeEventListener: () => undefined },
      configurable: true, writable: true,
    });
  };

  it('PLAYER JOURNEY: the guide’s reference, every entry opened by its own address, its contents, and a search for “interests” and for “interest”, names no interests, and says “interest” only on money’s and the papers’ pages, in money’s words', () => {
    const sim = createSave(1, 'b13-help', ada());
    const named: { id: string; goal: string; block: string }[] = [];
    for (const e of GUIDE) {
      address(`#/home?help=${e.id}`);
      const page = drawn(sim, createElement(HelpProvider, null, null));
      // The entry, open: its title as the heading and the trail back to the contents.
      expect(page.html, e.id).toContain(`<h3 id="entry-${e.id}"`);
      expect(page.text, e.id).toContain(`Contents › ${e.title}`);
      expect(page.text, e.id).not.toMatch(/\binterests\b/i);
      expect(page.controls.filter((c) => /\binterests\b/i.test(said(c))), e.id).toEqual([]);
      for (const block of blocks(page.html)) if (/\binterest\b/i.test(block)) named.push({ id: e.id, goal: e.goal, block });
    }
    // Every entry was drawn, and enough of them say "interest" that the rule below reads something.
    expect(GUIDE.length).toBeGreaterThan(40);
    expect(new Set(named.map((n) => n.id)).size).toBeGreaterThan(8);
    // Only the Money and Papers goals' entries say it (the taxes are Papers').
    expect(named.filter((n) => n.goal !== 'money' && n.goal !== 'papers').map((n) => n.id)).toEqual([]);
    // Each one says it among money's words, or is a fact's name of seven words or fewer ("Interest So Far", "The IRS’s
    // Interest") under one of those entries.
    expect(named.filter((n) => !MONEY.test(n.block) && n.block.split(' ').length > 7).map((n) => `${n.id}: ${n.block}`)).toEqual([]);

    // The contents, as ? opens them: no interests among the goals and the entries' titles.
    address('#/home');
    const contents = drawn(sim, createElement(HelpProvider, null, null), [[{ kind: 'contents' }]]);
    expect(contents.text).toContain('The Guide’s Chapters.');
    expect(contents.text).not.toMatch(/\binterests\b/i);

    // TEST SETUP: the trail of a player who typed into Search The Guide. "interests" finds nothing.
    const none = drawn(sim, createElement(HelpProvider, null, null), [[{ kind: 'contents' }, { kind: 'search', q: 'interests' }]]);
    expect(none.text).toContain('Nothing matches “interests”. Try fewer words, or the contents.');
    // "interest" finds entries, each one money's or the papers'.
    const some = drawn(sim, createElement(HelpProvider, null, null), [[{ kind: 'contents' }, { kind: 'search', q: 'interest' }]]);
    const found = some.controls.filter((c) => c.type === 'button' && c.props.className === 'help-link strong').map((c) => c.text);
    expect(found.length).toBeGreaterThan(0);
    const goals = found.map((title) => GUIDE.find((e) => e.title === title)?.goal);
    expect(goals.filter((g) => g !== 'money' && g !== 'papers')).toEqual([]);
  }, 60_000);

  it('PLAYER JOURNEY: the tutorial’s chapters, each opened in the guide’s own dialog on a guided life, name no interests, and say “interest” only in the money chapters, in money’s words', () => {
    const sim = createSave(1, 'b13-guide', ada({ tutorial: true }));
    const named: { id: string; block: string }[] = [];
    for (const [i, c] of CHAPTERS.entries()) {
      // TEST SETUP: the chapter the guide shows, as pressing it in the contents sets it.
      const page = drawn(sim, createElement(GuideProvider, null, null), [c.id]);
      expect(page.text, c.id).toContain(`Chapter ${i + 1} Of ${CHAPTERS.length} ${c.title}`);
      expect(page.text, c.id).not.toMatch(/\binterests\b/i);
      expect(page.controls.filter((x) => /\binterests?\b/i.test(said(x))), c.id).toEqual([]);
      for (const block of blocks(page.html)) if (/\binterest\b/i.test(block)) named.push({ id: c.id, block });
    }
    expect(CHAPTERS.length).toBeGreaterThan(10);
    expect(named.length).toBeGreaterThan(0);
    // Your Bank, Money, and Cover, Benefits And Returns: the chapters about money.
    expect(named.filter((n) => !['bank', 'money', 'papers'].includes(n.id)).map((n) => n.id)).toEqual([]);
    expect(named.filter((n) => !MONEY.test(n.block)).map((n) => `${n.id}: ${n.block}`)).toEqual([]);
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------
// i-stale-claims
// ---------------------------------------------------------------------------------------------------------------------

// Until 2026-10-15 this file held its own rule: NAMES took the plural and a few singulars, and HISTORY took "until",
// "went", "removed", "dropped", "drops", "deleted", "gone", "no longer", "let go", "lets go" and "from before" for the past,
// so "Interests lift a meal until they are removed." passed it. From that day it holds the tree to the same rule as
// tests/evidence3-person.test.ts, written out again here, since a test file can't import another's without running it.
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

/**
 * The sentences that name the interests and aren't dated by the removal, each read and found true as it stands, with
 * why: here on 2026-10-13, and from 2026-10-15 the same list as tests/evidence3-person.test.ts's READ_TRUE, which the
 * stricter rule needs. Every one must still be where it's listed: one that's gone comes off this list.
 */
const READ_AND_TRUE: readonly (readonly [file: string, sentence: string, why: string])[] = [
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
  // The first round’s i-ui-text line, “… no interests anywhere, and every “interest” left is money’s.”, stood here
  // until 2026-10-13: the older save this file opens falsified it, and it was corrected to say new lives.
  // Its i-stale-claims line stood here too until 2026-10-13, quoting the constant it says is named nowhere, so that file’s
  // own test of it found it here; the line now dates the removal, which needs no vouching.
];

/** The places the row corrected on 2026-10-10 and the first round held. */
const CORRECTED = ['docs/capabilities.json', 'docs/CAPABILITIES.md', 'src/ui/looks/actor.tsx', 'src/engine/systems/life.ts', 'src/engine/systems/enjoyment.ts', 'src/ui/creation/CharacterCreation.tsx', 'src/ui/workspaces/ProfileWorkspace.tsx'];

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const posix = (p: string) => p.split('\\').join('/');
const tidy = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * What a reader reads in a file: a doc's paragraphs; a JSON file's strings; and a source file's comments (line
 * comments one under another as one passage), its strings, a template's text with the strings inside it, and the words
 * of its JSX, parsed by TypeScript so that a quote in a comment or a regular expression can't run a "string" on. A
 * string without a space is a key or a selector, not prose.
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
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, false, kind);
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
  visit(source);
  const merged: { pos: number; end: number; kind: ts.SyntaxKind }[] = [];
  for (const r of [...ranges.values()].sort((a, b) => a.pos - b.pos)) {
    const last = merged[merged.length - 1];
    if (last && r.kind === ts.SyntaxKind.SingleLineCommentTrivia && last.kind === ts.SyntaxKind.SingleLineCommentTrivia && /^\s*$/.test(text.slice(last.end, r.pos))) last.end = r.end;
    else merged.push({ pos: r.pos, end: r.end, kind: r.kind });
  }
  for (const r of merged) out.push(text.slice(r.pos, r.end).replace(/^\/\*+|\*+\/$/g, '').replace(/^\s*\*\s?/gm, ' ').replace(/^\s*\/\/\s?/gm, ' '));
  return out.map(tidy).filter((s) => /\s/.test(s));
}
/** Each sentence that names the removed interests, in each file given, with where it is. */
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
/** A sentence that names them in the present, unread: not dated by the removal, and not one read here and found true. */
const presentTense = ({ file, sentence }: { file: string; sentence: string }) => !dated(sentence) && !READ_AND_TRUE.some(([f, s]) => f === file && s === sentence);

describe('i-stale-claims', () => {
  it('tells a present-tense claim from its past-tense twin, where the first round’s check passed both', () => {
    const at = (sentence: string) => presentTense({ file: 'src/ui/workspaces/ProfileWorkspace.tsx', sentence });
    // The check's example, which the first round's words ("kept", "named") passed, and its twin in the past.
    expect(NAMES.test('The interests are kept on the sheet and named on the Profile.')).toBe(true);
    expect(at('The interests are kept on the sheet and named on the Profile.')).toBe(true);
    expect(at('The interests were kept on the sheet and named on the Profile until 2026-10-10.')).toBe(false);
    // The leftover in tests/attributes-matrix.test.ts names one interest beside the genres, and is found by it.
    expect(at('every interest and genre has its definition, every ability its saved place and reader.')).toBe(true);
    expect(at('every genre has its definition, and every interest had one until the interests went on 2026-10-10.')).toBe(false);
    // From 2026-10-15, what this file's own rule of 2026-10-13 passed: a present passive with a removal word, "went"
    // that isn't the removal, a word of history ("until", "gone", "drops") on a present claim, and a possessive's or an
    // adjective's singular. Each is found now, and its twin dated by the removal isn't.
    for (const present of ['An interest is dropped from the sheet when the term ends.', 'Interests lift a meal until they are removed.', 'Interests went into every meal.', 'Your interest lifts a meal.', 'A favorite interest lifts a meal.', 'The interests are gone from the sheet once the player drops them.']) {
      expect(at(present), present).toBe(true);
    }
    for (const past of ['An interest was dropped from the sheet when the term ended, until migration 94.', 'Interests lifted a meal until the owner removed them on 2026-10-10.', 'Your interest lifted a meal until the interests went on 2026-10-10.']) {
      expect(at(past), past).toBe(false);
    }
    // From the second pass of 2026-10-15, what the first pass of that day handled wrong: a plural verb outside its list
    // of 46, "went on" and "went in", a verb past a clause set off by commas, the future and two adjectives, all passed;
    // and the present perfect, flagged.
    for (const present of ['Interests shape a meal, and the owner removed the crafts.', 'Interests reward an hour, as removed crafts did.', 'Interests went on lifting a meal.', 'Interests went in the pot.', 'Interests went at full value into every meal.', 'The interests, removed by the owner, lift a meal.', 'Interests, which the owner removed, still lift a meal.', 'Interests will lift a meal until migration 94.', 'Each interest will have been removed by the term’s end.', 'Her own favo\u0075rite interest lifts a meal.']) {
      expect(at(present), present).toBe(true);
    }
    for (const past of ['Interests have been removed since 2026-10-10.', 'An interest has been removed since 2026-10-10.']) {
      expect(at(past), past).toBe(false);
    }
    // Money's interest, and the law's, aren't the interests.
    expect(NAMES.test('A statement paid in full draws no interest.')).toBe(false);
    expect(NAMES.test('Payments are applied in the best interests of the State.') && !OTHER.test('Payments are applied in the best interests of the State.')).toBe(false);
  });

  // Its title said "in the past, by a word only history uses" until 2026-10-15, of the HISTORY rule that went that day.
  it('keeps every sentence naming the interests in the places the row corrected dated by the removal with no clause in the present, or among the sentences read and found true', () => {
    const found = namingIn(CORRECTED);
    // Each of the five source files names them somewhere, so a walk that found nothing can't pass; the two capability
    // documents name none (the first round's test holds that they pair no interest with love or enjoyment).
    expect([...new Set(found.map((f) => f.file))].sort()).toEqual(CORRECTED.filter((f) => f.startsWith('src/')).sort());
    expect(found.length).toBeGreaterThan(10);
    expect(found.filter(presentTense).map((f) => `${f.file}: ${f.sentence}`)).toEqual([]);
    // The one sentence read and found true in these files is still there.
    expect(found.filter((f) => READ_AND_TRUE.some(([file, s]) => file === f.file && s === f.sentence)).map((f) => f.file)).toEqual(['src/engine/systems/enjoyment.ts']);
  });

  // Its title said "in the past, by a word only history uses" until 2026-10-15, of the HISTORY rule that went that day.
  it('keeps every sentence naming the interests in src/, tests/ and docs/ dated by the removal with no clause in the present, or among the sentences read and found true; the audit trail and the research records aside', () => {
    // The audit trail (docs/verification/, docs/GAMEPLAY-COVERAGE.md) quotes the leftovers it found; the research
    // records (docs/research/, docs/drill-down-research.json) are findings and readings of the code as of their own
    // dates; and this file quotes, as data, the sentences it lets stand. From 2026-10-14 tests/evidence3-person.test.ts is
    // aside too: it quotes the interests as data, a save as schema 93 wrote it among them, and holds the same tree to its
    // own walk, which leaves this file and itself aside.
    const files = [...walk('src'), ...walk('tests'), ...walk('docs')].map(posix)
      .filter((f) => /\.(ts|tsx|mjs|js|json|md)$/.test(f))
      // The banks' research as the engine reads it (`content/home-accounts.json`, from 2026-10-16) is set aside with the
      // research it's copied from: it quotes the banks' own terms, "the customer's legitimate interests" among them. Until
      // 2026-10-16 this copy of the rule read it, and failed on those quotes, while evidence3-person's set it aside.
      .filter((f) => !f.startsWith('docs/verification/') && f !== 'docs/GAMEPLAY-COVERAGE.md' && !f.startsWith('docs/research/') && f !== 'docs/drill-down-research.json' && f !== 'src/engine/content/home-accounts.json' && f !== 'tests/evidence2-b13.test.ts' && f !== 'tests/evidence3-person.test.ts');
    expect(files.length).toBeGreaterThan(600);
    const found = namingIn(files);
    expect(found.length).toBeGreaterThan(60);
    // Every sentence read and found true is still where it's listed.
    expect(READ_AND_TRUE.filter(([file, s]) => !found.some((f) => f.file === file && f.sentence === s)).map(([file, s]) => `${file}: ${s}`)).toEqual([]);
    // And nothing else names them in the present.
    expect(found.filter(presentTense).map((f) => `${f.file}: ${f.sentence}`)).toEqual([]);
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------
// health.enroll's work rules in the reference and the tutorial (brief 12, 2026-10-17)
// ---------------------------------------------------------------------------------------------------------------------

describe('health.enroll: the work rules in the guide and the tutorial, as the player meets them (brief 12)', () => {
  // Brief 12's health area (docs/verification/resolution-2026-10-17/health-criteria.md, H2): until 2026-10-17 the
  // reference and the tutorial named 80 hours' work first among what meets HUSKY D's work rules, which nobody off the
  // School can do in SLATE, and "school at least half-time" for the School. Each is drawn here as the player opens it.
  afterEach(() => { Reflect.deleteProperty(globalThis, 'window'); });

  it('PLAYER JOURNEY: Health Cover’s reference, opened by its own address, and the tutorial’s Cover, Benefits And Returns chapter, opened in the guide’s dialog, name the School, $580 of income and the exceptions for HUSKY D’s work rules, and no hours of work', () => {
    const sim = createSave(1, 'b13-work-rules', ada({ tutorial: true }));
    // TEST SETUP: the page's window, holding the address the reference reads, as the test above sets it.
    Object.defineProperty(globalThis, 'window', {
      value: { location: { hash: '#/workspace/papers?help=papers.health-cover' }, history: { state: null, replaceState: () => undefined }, addEventListener: () => undefined, removeEventListener: () => undefined },
      configurable: true, writable: true,
    });
    const entry = drawn(sim, createElement(HelpProvider, null, null));
    expect(entry.html).toContain('<h3 id="entry-papers.health-cover"');
    expect(entry.text).toContain('From 1 January 2027, some of the month before you enroll spent at the School, or $580 of income of any kind in it, or an exception: 65 or over, SNAP received under its work rules, or a stay in hospital you ask for.');
    expect(entry.text).toContain('A month meets them with any of it spent at the School (the month you leave it, on a leave, by withdrawing or with the degree, counts whole, and so does the month you come back), $580 of income of any kind (pay, an unemployment benefit, interest or a pension)');
    expect(entry.text).toContain('“From January 1, 2027, HUSKY D asks an applicant for $580.00 of income, time at the School or an exception in the month before, and last month had none of them.”');
    expect(entry.text).not.toMatch(/hours’ work|hours of work|half-time/);

    // TEST SETUP: the chapter the guide shows, as pressing it in the contents sets it.
    const i = CHAPTERS.findIndex((c) => c.id === 'papers');
    const chapter = drawn(sim, createElement(GuideProvider, null, null), [CHAPTERS[i]!.id]);
    expect(chapter.text).toContain(`Chapter ${i + 1} Of ${CHAPTERS.length} ${CHAPTERS[i]!.title}`);
    expect(chapter.text).toContain('From 2027 Medicaid asks for a month spent partly at the School, or one with $580 of income (pay, interest or a benefit counts), unless you’re 65 or over, on SNAP under its work rules or, if you ask, in hospital that month');
    expect(chapter.text).toContain('if you fit neither, or its work rules aren’t met, it ends at a month’s end');
    expect(chapter.text).not.toMatch(/hours’ work|hours of work|half-time/);
  }, 60_000);
});
