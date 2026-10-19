/**
 * Evidence for seven creation rows the review of 2026-10-13 left partial (verification group g27-ui): what the Identity
 * and Dispositions steps ask, each followed past the save into the part of the life that reads it. Every answer is
 * given the way the screen gives it (the config `createSave` is handed, and on the screen itself, the step rendered with
 * react-dom/server and its own controls pressed through their own handlers), and every consequence is reached through a
 * command (`sim.execute`) or the clock (`sim.advanceTo`) and read where the row says it's read. The figures are the
 * rules' own numbers worked here by hand and written as literals: a knob's lean bent inside its limits
 * (`exp(L·tanh(ln v / L))`, L the log of the limit it leans toward), the Bulletin's term figures, the aging bands, the
 * countries' adult heights; never asked of `personalityOf`, `ceilingAt` or the helper the engine computes them with.
 *
 * - `c-performerTitle`: twin lives, she/her and he/him on one seed, no title set by hand. The first spring's Yale Rep
 *   understudy is Nina for her and Konstantin for him; the Summer Cabaret, joined by its command that day, gives her
 *   Natalya Stepanovna, Maurya and Mrs Hale and him Ivan Lomov, Bartley and Sheriff Peters, each a part its play writes
 *   for their title. The second fall's casting, across a save and a load, gives her Frau Gabor in Spring Awakening (Frau
 *   Bergmann until evaluation-10)
 *   and him Hänschen Rilow (Ernst Röbel until then), and the Rep's understudy Elmire and Tartuffe; the lead-taken bond reads the title (the
 *   weeks shared 10 of bond, a lead written for your title taken while you're not a lead 12 off it): her bond with the
 *   classmate who took Wendla moves −2 and his +10, with the two who took Melchior and Moritz hers +10 and his −2. A
 *   play read through `plays.read` says there's a part in Fleabag for her and none for him. On the
 *   screen: Billed As settled by the pronouns, open under they/them with Continue refused in validate's words, Actress
 *   pressed, then the pronouns moved and the title with them; the slot, the Profile and Home say the title the save
 *   stored.
 * - `c-birthdate`: on the Identity step, 31 February 2002 refused in validate's words with Continue grayed and the day
 *   capped at 28, 29 February 2004 taken with the day capped at 29; 2006 refused and 2005 taken at Yale; 1930 refused as
 *   over 95. The entered day is the birth instant, 3 AM in New Haven, on the Profile as the age and the date; the clock
 *   gives the birthday on 28 February 2027, once, through a reload; a body of 80 starts at 45.8 fitness by the aging
 *   bands; and the clock ends a life of 95 on its fourth day where the same seed born in 2002 lives on.
 * - `c-birthplace`: one seed, one New Haven residence, born in Mosfellsbær, Tokyo or New York: the heights differ by the
 *   birth countries' adult means for the same side, and a Tokyo-born student's body is the one a Tokyo-born life in
 *   Tokyo draws; over sixty seeds the Iceland-born stand more than 5 cm taller. The Starting Point step's Your Body in
 *   feet, inches and pounds for the US-born and in centimeters and kilograms for the Tokyo-born, both living in New
 *   Haven. The papers: a license from the birth state (California, not Connecticut), and for the Tokyo-born a Japanese
 *   passport and an F-1 to 30 July 2029.
 * - `c-citizenship`: the Citizenship output on Identity follows the birthplace picked through the picker's own onPick
 *   (Japan, then United Kingdom), and reads a dash for a birthplace in no country, which Continue refuses and a save
 *   can't be made from; Review says it again. The save holds the birthplace's country, the papers it gives, the Profile's "A citizen of Japan", kept
 *   through a reload; and on the first morning the living-expense scholarship withholds 14% of its taxable part from a
 *   Tokyo-born student and nothing from a New York-born one, once.
 * - `c-disp-emotionalStability`: composure 26.8 and 58.3 at stability 5 and 95; the same performance, fired by the
 *   clock, takes stress from 20 to 25.330 and 21.463; two waking hours take it from 40 to 39.486 and 39.118, through a
 *   reload.
 * - `c-disp-conscientiousness`: discipline 32.5 and 77.5; the same hour of practice through `practice.exercise` grows
 *   1.0933 times as much for the conscientious; the same five hours through `life.sleep` sleep 1.2102 times as deep and
 *   put back 1.4606 times the energy.
 * - `c-disp-ambition`: the same performance takes stress to 22.339 and 23.321 at ambition 5 and 95, its nerves 1.3580
 *   times as hard; two hours on empty take it to 41.905 and 42.845; two hours with energy left clear it alike.
 * The Dispositions step's sentence and the Profile's Dispositions line are rendered for all three.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity, which `newLifeConfig` leaves empty) unless a row is about the birthplace, at Yale in New Haven from
 * Monday 24 August 2026 at 7:30 AM, played by the clock: to the Haas Library's tour on Thursday 27 August, the spring
 * casting of Monday 4 January 2027, a birthday on 28 February 2027, and the second fall's casting on Monday 23 August
 * 2027. The seeds were chosen for what the clock draws on them, as a player's own life draws it: g27-cast-2 for a second
 * fall in Spring Awakening, g27-end-65 for a life of 95 that ends in its first week, g27-papers for a license held. The
 * screens (CharacterCreation's steps, the Profile, Home) are rendered with react-dom/server as the player has them.
 *
 * TEST SETUP, said again where it's done: the coursework prepared each midnight for the lives played to a casting, as
 * tests/school.test.ts does (the chair reads the term's showings, and these are tests of the casting, not of a student
 * who never prepares); a stress or an energy set before a stretch of the clock, the same in both twins; a casting and
 * its performance put on the calendar by hand for the nerves, as tests/attributes.test.ts does; a family whose means
 * leave need, which a new life's wealthy family doesn't, for the scholarship; and on the screen, the step and the config
 * given through CharacterCreation's own useState in render order, which a static render can't click to.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave, refreshMeta } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { instantFromZoned, zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { courseworkOf } from '@/engine/systems/coursework';
import { PREP_DIMS } from '@/engine/content/coursework';
import { REP_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '@/engine/content/plays';
import { documentsOf } from '@/engine/systems/documents';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  /** What the screen asked its given states to become: each setter's argument, a value or an updater, in order. */
  sets: [] as unknown[],
  /** The controls drawn: each element of interest, with its props, so its own handler can be pressed. */
  els: [] as { type: string; props: Record<string, unknown>; text: string }[],
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

/** Every control the screens draw, with its words and its own props. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepControls = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    const name = typeof type === 'string' ? type : typeof type === 'function' ? (type as { name: string }).name : '';
    if (props && ['button', 'select', 'input', 'output', 'LocationPicker'].includes(name)) h.els.push({ type: name, props, text: textOf(props.children) });
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
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});

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

const { CharacterCreation } = await import('@/ui/creation/CharacterCreation');
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { Home } = await import('@/ui/screens/Home');

// ---------------------------------------------------------------------------
// Lives, and the screens over them
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
/** A minute of New Haven's clock. */
const ET = (year: number, month: number, day: number, hour = 9, minute = 0): number => instantFromZoned({ year, month, day, hour, minute }, NY);
/** Ada Cole's answers, as the screen sends them: a new life at Yale, born in New York unless the row says otherwise. */
const answers = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const ada = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation => createSave(1, seed, answers(extra));
/** The dispositions as the sliders leave them: newLifeConfig's, with one moved. */
const leaning = (axis: string, value: number): Partial<NewSaveConfig> => ({ personality: { ...newLifeConfig().personality, [axis]: value } });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const titled = (sim: Simulation, start: string) => sim.universe.notifications.filter((n) => n.title.startsWith(start));

/**
 * TEST SETUP: a student who does the coursework, its every part prepared before it's shown, each midnight, as
 * tests/school.test.ts has it. From 2026-10-10 the faculty read the term's showings; these are tests of the casting.
 */
const doTheWork = (sim: Simulation) => { for (const a of courseworkOf(sim, sim.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95); };
const working = (sim: Simulation): Simulation => { sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => doTheWork(s)); return sim; };

/** What the player reads: the markup with every title attribute taken out, then every tag, and its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

/** A game screen over a life, as the player has it. */
function drawn(sim: Simulation, screen: FunctionComponent): string {
  h.sim = sim;
  h.els = [];
  h.states = [];
  return onScreen(renderToStaticMarkup(createElement(screen)));
}

const STEP = { Identity: 0, Dispositions: 1, StartingPoint: 3, Review: 4 } as const;
/**
 * A creation step as the player has it. TEST SETUP: CharacterCreation's states in render order, the step and the config,
 * and the two it keeps (whether a draft was restored, and the tick a country's arrival gives).
 */
function creation(step: number, config: NewSaveConfig) {
  h.states = [step, config, h.keep, h.keep];
  h.sets = [];
  h.els = [];
  const html = renderToStaticMarkup(createElement(CharacterCreation, { slot: 1 as never, onCancel: () => undefined, onStart: () => undefined }));
  expect(h.states, 'every state given was taken').toHaveLength(0);
  const els = [...h.els];
  const button = (text: string) => { const b = els.find((e) => e.type === 'button' && e.text === text); expect(b, `${text} on the step`).toBeDefined(); return b!; };
  return {
    html,
    text: onScreen(html),
    els,
    button,
    continues: () => button('Continue').props.disabled !== true,
    /** Presses a control through its own handler, and gives the config the screen set from it. */
    press: (act: () => void): NewSaveConfig => {
      h.sets = [];
      act();
      expect(h.sets.length, 'the press set the config').toBeGreaterThan(0);
      return h.sets.reduce<NewSaveConfig>((c, s) => (typeof s === 'function' ? (s as (c: NewSaveConfig) => NewSaveConfig)(c) : s as NewSaveConfig), config);
    },
  };
}
/** The issues the step's callout lists under it, in validate's words. */
const issuesOn = (html: string) => [...html.matchAll(/<li class="small">([^<]*)<\/li>/g)].map((m) => m[1]!.replace(/&#x27;/g, '\''));

// ---------------------------------------------------------------------------
// c-performerTitle
// ---------------------------------------------------------------------------

describe('c-performerTitle', () => {
  const partOf = (list: readonly { title: string; parts: readonly { name: string; size: string; for: string }[] }[], play: string, part: string) =>
    list.find((p) => p.title === play)!.parts.find((x) => x.name === part)!;

  it('PLAYER JOURNEY: casts her as Nina and him as Konstantin at Yale Rep on 4 January 2027, and the Summer Cabaret gives each the parts its plays write for them', () => {
    const lives = (['she/her', 'he/him'] as const).map((pronouns) => working(ada('g27-cast-2', { pronouns })));
    for (const sim of lives) sim.advanceTo(ET(2027, 1, 4, 9, 1));
    const [her, him] = lives as [Simulation, Simulation];
    expect(her.player.performerTitle).toBe('actress');
    expect(him.player.performerTitle).toBe('actor');
    // The Seagull's understudies, as the Equity notice cast them: Nina for an actress, Konstantin for an actor.
    expect(her.player.school!.rep).toMatchObject({ production: 'The Seagull', role: 'Nina', kind: 'understudy', term: 1 });
    expect(him.player.school!.rep).toMatchObject({ production: 'The Seagull', role: 'Konstantin', kind: 'understudy', term: 1 });

    // The Summer Cabaret's company, joined the way the School tab joins it: each show a part written for the title or for
    // anyone (`companyPart`), and never one written for the other.
    for (const sim of lives) expect(sim.execute({ kind: 'school.summer_cabaret', payload: {} }).ok).toBe(true);
    const shows = (sim: Simulation) => sim.player.school!.summer!.shows!.map((s) => [s.play, s.role, s.size]);
    // Riders To The Sea's Maurya until 2026-10-16; from then a night, and so the company's read of her, weighs each ability
    // as the play demands (`BASE_INPUTS`), and she reads behind another actress for it: Cathleen, also written for one.
    expect(shows(her)).toEqual([['A Marriage Proposal', 'Natalya Stepanovna', 'lead'], ['Riders To The Sea', 'Cathleen', 'supporting'], ['Trifles', 'Mrs Hale', 'lead']]);
    expect(shows(him)).toEqual([['A Marriage Proposal', 'Ivan Lomov', 'lead'], ['Riders To The Sea', 'Bartley', 'supporting'], ['Trifles', 'Sheriff Peters', 'supporting']]);
    for (const [play, role] of shows(her)) expect(partOf(SUMMER_PLAYS, play!, role!).for, `${role}`).toBe('actress');
    for (const [play, role] of shows(him)) expect(partOf(SUMMER_PLAYS, play!, role!).for, `${role}`).toBe('actor');
    // Trifles writes its leads for two actresses: the actor's part in it is a supporting one, the actress's a lead.
    expect(partOf(SUMMER_PLAYS, 'Trifles', 'Mrs Hale')).toMatchObject({ size: 'lead', for: 'actress' });
    // Joined once: asked again, refused in its words, the parts as they were, through a reload.
    expect(her.execute({ kind: 'school.summer_cabaret', payload: {} }).error).toBe('You’re already in this summer’s company.');
    const kept = reload(her);
    expect(kept.player.performerTitle).toBe('actress');
    expect(shows(kept)).toEqual(shows(her));
  });

  it('PLAYER JOURNEY: in the second fall, across a save and a load, casts her as Frau Gabor and him as Hänschen Rilow, and the lead taken costs the bond of whoever took the lead written for their title', () => {
    const casts = (['she/her', 'he/him'] as const).map((pronouns) => {
      let sim = working(ada('g27-cast-2', { pronouns }));
      sim.advanceTo(ET(2027, 8, 1, 12));
      // Saved and opened again three weeks before the casting: the title read there is the one the save kept.
      sim = working(reload(sim));
      const term = sim.universe.scheduled.find((i) => i.kind === 'school.term' && i.status === 'pending' && i.payload.term === 2);
      expect(term?.at).toBe(ET(2027, 8, 23, 9));
      sim.advanceTo(ET(2027, 8, 23, 8, 59));
      const bond = (name: string) => sim.player.school!.classmates.find((m) => m.name === name)!.bond ?? 0;
      // Every classmate's bond, so the cost is read off whoever the casting gives each lead to.
      const names = sim.player.school!.classmates.map((m) => m.name);
      const before = names.map(bond);
      sim.advanceTo(ET(2027, 8, 23, 9, 1));
      return { sim, moved: Object.fromEntries(names.map((n, i) => [n, bond(n) - before[i]!])) };
    });
    const [her, him] = casts as [typeof casts[0], typeof casts[0]];
    const school = (sim: Simulation) => sim.player.school!;

    // Directors' Thesis Production I is Spring Awakening for this class; her part is written for an actress, his for an actor.
    // Frau Bergmann and Hänschen Rilow, and Aaliyah Kim as Wendla, until 2026-10-16, when casting's read of a night came
    // to weigh each ability as the play demands (`BASE_INPUTS`); her part was Frau Gabor from then until later that day,
    // when a stage's house came to weigh the voice and the body (`STAGE_LEAN`), and Frau Bergmann again until later still,
    // when evaluation-10 gave the play's night a long score by its six units (three tones, three turns; `demandsOf`), which
    // casting reads as the play demands, and Frau Gabor since, his Hänschen Rilow where it was Ernst Röbel: with the turns
    // left out of the demand they're Frau Bergmann and Ernst Röbel again (a mutation run in a copy, 2026-10-16). The parts
    // are still each written for the title cast, and neither is a lead.
    expect(school(her.sim).casting).toMatchObject({ play: 'Spring Awakening', role: 'Frau Gabor', size: 'featured' });
    expect(partOf(THESIS_PLAYS, 'Spring Awakening', 'Frau Bergmann').for).toBe('actress');
    expect(school(him.sim).casting).toMatchObject({ play: 'Spring Awakening', role: 'Hänschen Rilow', size: 'featured' });
    expect(partOf(THESIS_PLAYS, 'Spring Awakening', 'Frau Gabor').for).toBe('actress');
    expect(partOf(THESIS_PLAYS, 'Spring Awakening', 'Hänschen Rilow').for).toBe('actor');
    const castOf = (sim: Simulation) => Object.fromEntries((school(sim).casting!.cast ?? []).map((c) => [c.name, c.part]));
    // Who takes each lead is casting's read of the class; until later on 2026-10-16 (`STAGE_LEAN`) Grace Patel took
    // Wendla in both lives, as Daniel Walsh and Theo Rivera took Melchior and Moritz. The same classmates take them in
    // both lives, whoever they are.
    const holder = (sim: Simulation, part: string) => Object.entries(castOf(sim)).find(([, p]) => p === part)?.[0];
    for (const part of ['Wendla Bergmann', 'Melchior Gabor', 'Moritz Stiefel']) {
      expect(holder(her.sim, part), part).toBeDefined();
      expect(holder(him.sim, part)).toBe(holder(her.sim, part));
    }
    expect(partOf(THESIS_PLAYS, 'Spring Awakening', 'Wendla Bergmann')).toMatchObject({ size: 'lead', for: 'actress' });
    expect(partOf(THESIS_PLAYS, 'Spring Awakening', 'Melchior Gabor')).toMatchObject({ size: 'lead', for: 'actor' });
    expect(partOf(THESIS_PLAYS, 'Spring Awakening', 'Moritz Stiefel')).toMatchObject({ size: 'lead', for: 'actor' });
    // The weeks shared are 10 of bond (`BONDS.shared`); a lead written for your title taken by a classmate while you're not
    // a lead is 12 off it (`BONDS.leadTaken`), so 10 − 12 = −2. Wendla, an actress's lead, costs her and not him; Melchior
    // and Moritz, an actor's, cost him and not her.
    const r3 = (m: number) => Math.round(m * 1000) / 1000;
    const [wendla, melchior, moritz] = ['Wendla Bergmann', 'Melchior Gabor', 'Moritz Stiefel'].map((p) => holder(her.sim, p)!) as [string, string, string];
    expect([wendla, melchior, moritz].map((n) => r3(her.moved[n]!))).toEqual([-2, 10, 10]);
    expect([wendla, melchior, moritz].map((n) => r3(him.moved[n]!))).toEqual([10, -2, -2]);

    // The Rep's October production is Tartuffe: the understudy covers the lead written for each.
    expect(school(her.sim).rep).toMatchObject({ play: 'Tartuffe', role: 'Elmire', kind: 'understudy' });
    expect(school(him.sim).rep).toMatchObject({ play: 'Tartuffe', role: 'Tartuffe', kind: 'understudy' });
    expect(partOf(REP_PLAYS, 'Tartuffe', 'Elmire')).toMatchObject({ size: 'lead', for: 'actress' });
    expect(partOf(REP_PLAYS, 'Tartuffe', 'Tartuffe')).toMatchObject({ size: 'lead', for: 'actor' });
  });

  it('PLAYER JOURNEY: Fleabag, read through plays.read once the tour has shown the library, has a part for her and none for him', () => {
    const read = (pronouns: string) => {
      const sim = ada('g27-read', { pronouns });
      // Before the tour (Thursday 27 August), refused in its words.
      sim.advanceTo(ET(2026, 8, 26, 18));
      expect(sim.execute({ kind: 'plays.read', payload: { playId: 'fleabag' } }).error).toBe('You don’t know where the library is yet. Orientation’s building tour shows you: if you missed it, press Catch Up beside it under Orientation.');
      sim.advanceTo(ET(2026, 8, 27, 18));
      return sim.must<{ minutes: number; note: string }>({ kind: 'plays.read', payload: { playId: 'fleabag' } }).note;
    };
    // Its cast as Nick Hern Books publish it: one woman, no men.
    expect(read('she/her')).toBe('You read Fleabag, by Phoebe Waller-Bridge, all the way through. It reads as a monologue for a female performer (solo). The published cast is 1 woman. There’s a part in it for you.');
    expect(read('he/him')).toBe('You read Fleabag, by Phoebe Waller-Bridge, all the way through. It reads as a monologue for a female performer (solo). The published cast is 1 woman. Nothing in it is written for you now.');
  });

  it('PLAYER JOURNEY: Billed As is settled by she/her, open under they/them with Continue refused, Actress pressed, and moved with the pronouns; the slot, the Profile and Home say the title stored', () => {
    // Settled: the word said back, and nothing to pick.
    const settled = creation(STEP.Identity, answers());
    expect(settled.text).toContain('Billed As Actress Your pronouns decide this, so there’s nothing to pick.');
    expect(settled.text).toContain('Here you create the actress you’ll play.');
    expect(settled.els.some((e) => e.type === 'button' && (e.text === 'Actor' || e.text === 'Actress'))).toBe(false);
    expect(settled.continues()).toBe(true);

    // Open under they/them: both words offered, neither pressed, and Continue refused in validate's words.
    const open = creation(STEP.Identity, answers({ pronouns: 'they/them', performerTitle: undefined }));
    expect(open.button('Actor').props['aria-pressed']).toBe(false);
    expect(open.button('Actress').props['aria-pressed']).toBe(false);
    expect(open.text).toContain('at school you’re cast in parts written for it, or for anyone.');
    expect(issuesOn(open.html)).toEqual(['Choose whether you’re billed as an actor or an actress.']);
    expect(open.continues()).toBe(false);
    expect(open.text).toContain('Here you create the actor or actress you’ll play.');

    // Actress pressed: held, and Continue opens.
    const picked = open.press(() => (open.button('Actress').props.onClick as () => void)());
    expect(picked.performerTitle).toBe('actress');
    const chosen = creation(STEP.Identity, picked);
    expect(chosen.button('Actress').props['aria-pressed']).toBe(true);
    expect(chosen.button('Actor').props['aria-pressed']).toBe(false);
    expect(issuesOn(chosen.html)).toEqual([]);
    expect(chosen.continues()).toBe(true);

    // The pronouns moved to he/him settle it as Actor; back to they/them, the pick made before doesn't survive.
    const select = chosen.els.find((e) => e.type === 'select' && e.props.id === 'pronouns')!;
    const he = chosen.press(() => (select.props.onChange as (e: unknown) => void)({ target: { value: 'he/him' } }));
    expect(he).toMatchObject({ pronouns: 'he/him', performerTitle: 'actor' });
    expect(creation(STEP.Identity, he).text).toContain('Billed As Actor Your pronouns decide');
    const back = creation(STEP.Identity, he);
    const select2 = back.els.find((e) => e.type === 'select' && e.props.id === 'pronouns')!;
    const they = back.press(() => (select2.props.onChange as (e: unknown) => void)({ target: { value: 'they/them' } }));
    expect(they.performerTitle).toBeUndefined();
    expect(creation(STEP.Identity, they).continues()).toBe(false);

    // Begun from the pressed answers (they/them, Actress): the save, its slot, the Profile and Home say Actress.
    const sim = createSave(1, 'g27-billed', picked);
    expect(sim.player.performerTitle).toBe('actress');
    expect(sim.universe.meta.careerLabel).toBe('Actress');
    refreshMeta(sim);
    expect(sim.universe.meta.careerLabel).toBe('Actress, Yale Drama Year 1');
    expect(drawn(sim, ProfileWorkspace)).toContain('Pronouns they/them Billed as an actress');
    expect(drawn(sim, Home)).toContain('Monday, August 24, 2026 · Actress');
    const him = ada('g27-billed', { pronouns: 'he/him' });
    expect(drawn(him, ProfileWorkspace)).toContain('Pronouns he/him Billed as an actor');
    expect(drawn(him, Home)).toContain('Monday, August 24, 2026 · Actor');
  });
});

// ---------------------------------------------------------------------------
// c-birthdate
// ---------------------------------------------------------------------------

describe('c-birthdate', () => {
  it('refuses 31 February 2002 in validate’s words with Continue grayed and the day capped at 28, and takes 29 February 2004 with the day capped at 29', () => {
    const feb31 = creation(STEP.Identity, answers({ birthYear: 2002, birthMonth: 2, birthDay: 31 }));
    expect(issuesOn(feb31.html)).toEqual(['February 2002 has no day 31.']);
    expect(feb31.continues()).toBe(false);
    expect(feb31.els.find((e) => e.type === 'input' && e.props.id === 'birth-day')!.props.max).toBe(28);

    const leap = creation(STEP.Identity, answers({ birthYear: 2004, birthMonth: 2, birthDay: 29 }));
    expect(issuesOn(leap.html)).toEqual([]);
    expect(leap.continues()).toBe(true);
    expect(leap.els.find((e) => e.type === 'input' && e.props.id === 'birth-day')!.props.max).toBe(29);
    // 29 February 2004 to Monday 24 August 2026: 22, the birthday in February already had.
    expect(leap.text).toContain('You’ll be 22 when you start.');
    // And 30 April, which April hasn't.
    expect(issuesOn(creation(STEP.Identity, answers({ birthYear: 2002, birthMonth: 4, birthDay: 31 })).html)).toEqual(['April 2002 has no day 31.']);
  });

  it('refuses a birth after 2005 at Yale, whose MFA asks 21 by the year, and over 95; takes 2005 and 95', () => {
    // 2026 less 21: the year input's own top is 2005 too.
    const late = creation(STEP.Identity, answers({ birthYear: 2006 }));
    expect(issuesOn(late.html)).toEqual(['Your character can’t be born after 2005.']);
    expect(late.continues()).toBe(false);
    expect(late.els.find((e) => e.type === 'input' && e.props.id === 'birth-year')!.props.max).toBe(2005);
    const year = creation(STEP.Identity, answers({ birthYear: 2005, birthMonth: 12, birthDay: 31 }));
    expect(issuesOn(year.html)).toEqual([]);
    expect(year.text).toContain('You’ll be 20 when you start.');
    // 14 June 1930 is 96 on 24 August 2026; 14 June 1931 is 95.
    expect(issuesOn(creation(STEP.Identity, answers({ birthYear: 1930 })).html)).toEqual(['Your character would be over 95 at the start. Choose a later year of birth.']);
    expect(issuesOn(creation(STEP.Identity, answers({ birthYear: 1931 })).html)).toEqual([]);
    // Review says the date as it was entered.
    expect(creation(STEP.Review, answers({ birthYear: 2004, birthMonth: 2, birthDay: 29 })).text).toContain('Born February 29, 2004');
  });

  it('PLAYER JOURNEY: keeps the entered 29 February 2004 as the birth instant, says the age on the Profile, and gives the birthday on 28 February 2027 once, through a reload', () => {
    const sim = ada('g27-leap', { birthYear: 2004, birthMonth: 2, birthDay: 29 });
    // 3 AM in New Haven on the day entered, Eastern Standard Time (UTC−5): 08:00 UTC.
    expect(sim.player.birthInstant).toBe(Date.UTC(2004, 1, 29, 8));
    expect(zonedParts(sim.player.birthInstant, NY)).toMatchObject({ year: 2004, month: 2, day: 29, hour: 3 });
    expect(drawn(sim, ProfileWorkspace)).toContain('Age 22 Born February 29, 2004');
    sim.advanceTo(ET(2027, 2, 27, 12));
    expect(titled(sim, 'Happy Birthday')).toEqual([]);
    const kept = reload(sim);
    kept.advanceTo(ET(2027, 3, 1, 12));
    // 2027 has no 29 February: the birthday is the 28th, at 9 AM on New Haven's clock (EST, 14:00 UTC), and it's 23.
    expect(titled(kept, 'Happy Birthday').map((n) => [n.title, n.body, n.at])).toEqual([['Happy Birthday: 23', 'You’re 23 today.', Date.UTC(2027, 1, 28, 14)]]);
    expect(drawn(kept, ProfileWorkspace)).toContain('Age 23 Born February 29, 2004');
  });

  it('starts a body of 80 at 45.8 fitness by the aging bands and one of 24 at 50; and the clock ends a life of 95 in its first week where the same seed born in 2002 lives on', () => {
    // 14 June 1946 to 24 August 2026 is 80 years: the ceiling is 100 less 0.12 a year from 20 to 29, 0.35 to 39, 0.62
    // to 49, 0.95 to 59, 1.35 to 69, 1.80 to 79 and 2.30 at 80: 100 − 1.2 − 3.5 − 6.2 − 9.5 − 13.5 − 18 − 2.3 = 45.8.
    expect(ada('g27-age', { birthYear: 1946, birthMonth: 6, birthDay: 14 }).player.wellbeing.fitness).toBe(45.8);
    expect(ada('g27-age').player.wellbeing.fitness).toBe(50);

    // g27-end-65: the year drawn for a life of 95 at creation ends it on Friday 28 August; the same draw at 24 doesn't.
    const old = ada('g27-end-65', { birthYear: 1931, birthMonth: 6, birthDay: 14 });
    const young = ada('g27-end-65');
    const end = old.universe.scheduled.find((i) => i.kind === 'life.end' && i.status === 'pending');
    expect(end).toBeDefined();
    expect(end!.at).toBeLessThan(ET(2026, 8, 29, 0));
    expect(young.universe.scheduled.some((i) => i.kind === 'life.end' && i.status === 'pending')).toBe(false);
    old.advanceTo(ET(2026, 8, 29, 12));
    young.advanceTo(ET(2026, 8, 29, 12));
    expect(old.universe.meta.endedAt).toBe(end!.at);
    expect(old.universe.meta.endedAge).toBe(95);
    expect(titled(old, 'A Life, Ended')).toHaveLength(1);
    refreshMeta(old);
    expect(old.universe.meta.careerLabel).toBe('Actress, Yale Drama Year 1, Died At 95');
    expect(young.universe.meta.endedAt).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// c-birthplace
// ---------------------------------------------------------------------------

describe('c-birthplace', () => {
  it('PLAYER JOURNEY: draws the body from the birth country’s adults, not from New Haven where the life is lived: the heights apart by the countries’ means, the Tokyo-born the body a life in Tokyo draws', () => {
    // NCD-RisC's adults at 19 (Lancet 2020), each side: Iceland 182.1 and 168.9 cm, Japan 172.1 and 158.5, the US 176.9
    // and 163.3. One seed draws one side and one place in it, so two lives on it born apart stand apart by their
    // countries' means for that side: 10.0 or 10.4 cm Iceland over Japan, and 5.2 or 5.6 over the US, the side the same.
    const near = (x: number, to: number) => Math.abs(x - to) <= 0.1 + 1e-9;
    for (let i = 0; i < 20; i += 1) {
      const seed = `g27-body-${i}`;
      const is = ada(seed, { homeRegionId: 'is-39-mosfellsbr' });
      const jp = ada(seed, { homeRegionId: 'jp-13-tokyo' });
      const us = ada(seed, { homeRegionId: 'us-ny-newyork' });
      for (const sim of [is, jp, us]) expect(sim.player.currentLocationId).toBe('us-ct-newhaven');
      const overJp = is.player.body!.heightCm - jp.player.body!.heightCm;
      const overUs = is.player.body!.heightCm - us.player.body!.heightCm;
      const side = near(overJp, 10.0) ? 0 : near(overJp, 10.4) ? 1 : -1;
      expect(side, `${seed}: ${overJp.toFixed(2)} cm over the Tokyo-born`).not.toBe(-1);
      expect(near(overUs, side === 0 ? 5.2 : 5.6), `${seed}: ${overUs.toFixed(2)} cm over the New York-born`).toBe(true);
      // Born in Tokyo and living there (a life a New Haven student's doesn't reach, so `quickSave`): the same body.
      const home = quickSave({ startLocationId: 'jp-13-tokyo', homeRegionId: 'jp-13-tokyo', livesWhereBorn: true }, seed);
      expect([home.player.body!.heightCm, home.player.body!.weightKg]).toEqual([jp.player.body!.heightCm, jp.player.body!.weightKg]);
    }
    // And as the review asked it: sixty seeds each, the Iceland-born more than 5 cm taller on average.
    const mean = (homeRegionId: string) => {
      let sum = 0;
      for (let i = 0; i < 60; i += 1) sum += ada(`g27-mean-${i}`, { homeRegionId }).player.body!.heightCm;
      return sum / 60;
    };
    expect(mean('is-39-mosfellsbr')).toBeGreaterThan(mean('jp-13-tokyo') + 5);
  });

  // Until 2026-10-14 this asked the Tokyo-born student living in New Haven in centimeters and kilograms, the units of
  // where she was born. Since the owner's rule of that day (`bodyUnits`) they're the units of where the person lives:
  // both students at Yale are asked in feet and pounds, and the metric fields are a life in Tokyo's.
  it('asks Your Body in feet, inches and pounds of the US-born and the Tokyo-born living in New Haven, and in centimeters and kilograms of the Tokyo-born living in Tokyo', () => {
    // 177.8 cm is 70 inches, 5 feet 10; 72.6 kg is 160 pounds at 0.45359237 kg the pound; a body mass index of
    // 72.6 ÷ 1.778² = 22.97.
    const body = { heightCm: 177.8, weightKg: 72.6 };
    const us = creation(STEP.StartingPoint, answers({ homeRegionId: 'us-ny-newyork', ...body }));
    const input = (step: ReturnType<typeof creation>, id: string) => step.els.find((e) => e.type === 'input' && e.props.id === id)?.props.value;
    expect(us.text).toContain('Height (Feet)');
    expect(us.text).toContain('Weight (Pounds)');
    expect(us.text).not.toContain('Centimeters');
    expect([input(us, 'height-ft'), input(us, 'height-in'), input(us, 'weight-lb')]).toEqual([5, 10, 160]);
    expect(us.text).toContain('That’s a body mass index of 23.0.');
    const jpAtYale = creation(STEP.StartingPoint, answers({ homeRegionId: 'jp-13-tokyo', ...body }));
    expect(jpAtYale.text).toContain('Height (Feet)');
    expect([input(jpAtYale, 'height-ft'), input(jpAtYale, 'height-in'), input(jpAtYale, 'weight-lb')]).toEqual([5, 10, 160]);
    const jp = creation(STEP.StartingPoint, answers({ homeRegionId: 'jp-13-tokyo', school: undefined, startLocationId: 'jp-13-tokyo', livesWhereBorn: true, ...body }));
    expect(jp.text).toContain('Height (Centimeters)');
    expect(jp.text).toContain('Weight (Kilograms)');
    expect(jp.text).not.toContain('Feet');
    expect([input(jp, 'height-cm'), input(jp, 'weight-kg'), input(jp, 'bmi')]).toEqual([177.8, 72.6, '23.0']);
    // Six feet typed into the US-born's field: 6 feet 10 inches, 82 × 2.54 = 208.28 cm, kept to a tenth.
    const taller = us.press(() => (us.els.find((e) => e.type === 'input' && e.props.id === 'height-ft')!.props.onChange as (e: unknown) => void)({ target: { value: '6' } }));
    expect(taller.heightCm).toBe(208.3);
    // Left blank, the step says where the body comes from.
    expect(creation(STEP.StartingPoint, answers({ homeRegionId: 'jp-13-tokyo' })).text).toContain('Leave them blank and SLATE picks them at random, around the averages where you were born.');
  });

  it('PLAYER JOURNEY: gives a license from the birth state, California not Connecticut, and a Tokyo-born student a Japanese passport and an F-1 to 30 July 2029', () => {
    const papers = (homeRegionId: string) => documentsOf(ada('g27-papers', { homeRegionId }).player).map((d) => [d.kind, d.issuer]);
    // g27-papers draws a license for a US-born citizen (80.9% hold one, FHWA DL-20).
    expect(papers('us-ca-losangeles')).toEqual([['passport', 'US'], ['license', 'us-ca']]);
    expect(papers('us-ny-newyork')).toEqual([['passport', 'US'], ['license', 'us-ny']]);
    expect(papers('jp-13-tokyo')).toEqual([['passport', 'JP'], ['visa', 'US']]);
    const visa = documentsOf(ada('g27-papers', { homeRegionId: 'jp-13-tokyo' }).player).find((d) => d.kind === 'visa')!;
    // The class of 2029's degree in May, and the F-1's 60 days' grace after it (8 CFR 214.2(f)(5)(iv)): 30 July 2029.
    expect(visa.name).toBe('F-1 Student Visa');
    expect(new Date(visa.expiresAt!).toISOString().slice(0, 10)).toBe('2029-07-30');
  });
});

// ---------------------------------------------------------------------------
// c-citizenship
// ---------------------------------------------------------------------------

describe('c-citizenship', () => {
  it('PLAYER JOURNEY: says the citizenship back under the birthplace picked, Japan then United Kingdom, a dash for no country which Continue refuses, and Review says it again', () => {
    const step = creation(STEP.Identity, answers());
    expect(step.text).toContain('Citizenship United States You’re a citizen of the country you were born in, so there’s nothing to pick.');
    // Tokyo picked through the birthplace picker's own onPick, living in New Haven.
    const picker = () => step.els.find((e) => e.type === 'LocationPicker' && e.props.idPrefix === 'born')!;
    const tokyo = step.press(() => (picker().props.onPick as (c: unknown) => void)(CITIES.get('jp-13-tokyo')));
    expect(tokyo).toMatchObject({ homeRegionId: 'jp-13-tokyo', startLocationId: 'us-ct-newhaven' });
    const japan = creation(STEP.Identity, tokyo);
    expect(japan.text).toContain('Citizenship Japan You’re a citizen');
    expect(japan.continues()).toBe(true);
    const londonPicker = japan.els.find((e) => e.type === 'LocationPicker' && e.props.idPrefix === 'born')!;
    const london = japan.press(() => (londonPicker.props.onPick as (c: unknown) => void)(CITIES.get('uk-eng-london')));
    expect(creation(STEP.Identity, london).text).toContain('Citizenship United Kingdom You’re a citizen');
    // A birthplace in no country: nothing to say, and nobody to make.
    const nowhere = creation(STEP.Identity, answers({ homeRegionId: 'zz-1-nowhere' }));
    expect(nowhere.text).toContain('Citizenship — You’re a citizen');
    expect(issuesOn(nowhere.html)).toEqual(['Choose the town or city you were born in.']);
    expect(nowhere.continues()).toBe(false);
    expect(() => ada('g27-nowhere', { homeRegionId: 'zz-1-nowhere' })).toThrow('No country has a place with the id zz-1-nowhere.');
    expect(creation(STEP.Review, tokyo).text).toContain('Citizenship Japan');
  });

  it('PLAYER JOURNEY: holds Japan for a Tokyo-born student in New Haven, with the papers it gives and the Profile’s words, kept through a reload', () => {
    const sim = ada('g27-papers', { homeRegionId: 'jp-13-tokyo' });
    expect(sim.player.citizenshipId).toBe('jp');
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');
    expect(drawn(sim, ProfileWorkspace)).toContain('From Tokyo A citizen of Japan');
    expect(drawn(ada('g27-papers'), ProfileWorkspace)).toContain('From New York A citizen of the United States');
    const docs = documentsOf(sim.player);
    const kept = reload(sim);
    expect(kept.player.citizenshipId).toBe('jp');
    // The papers aren't drawn again when the save is opened: the same two, the same numbers.
    expect(documentsOf(kept.player).map((d) => [d.kind, d.issuer, d.number])).toEqual(docs.map((d) => [d.kind, d.issuer, d.number]));
    expect(drawn(kept, ProfileWorkspace)).toContain('From Tokyo A citizen of Japan');
  });

  it('PLAYER JOURNEY: withholds 14% of the first term’s taxable scholarship from a Tokyo-born student on an F-1, and nothing from a New York-born one, once', () => {
    // TEST SETUP: a family whose means leave need (no family money, scraping), which a new life's wealthy family doesn't;
    // the living-expense scholarship is what Yale pays a student in need, and its withholding is where the citizenship is
    // read on the first morning.
    const need = { family: undefined, wealth: 'scraping' } as const;
    const paid = (homeRegionId: string, reloadAt?: number) => {
      let sim = ada('g27-aid', { homeRegionId, ...need });
      if (reloadAt) { sim.advanceTo(reloadAt); sim = reload(sim); }
      sim.advanceTo(ET(2026, 8, 26, 12));
      const tx = sim.universe.transactions.filter((t) => t.memo.startsWith('Living-expense scholarship'));
      return tx.map((t) => ({ at: t.at, moved: Object.fromEntries(t.postings.map((p) => [sim.universe.accounts[p.accountId]!.nominal ? sim.universe.accounts[p.accountId]!.name : 'own', p.amount])) }));
    };
    // The Bulletin's 2026–27 year: living $28,028 with the $3,764 health plan in it, books $2,373. The term's half of the
    // living and the books is $15,200.50; the health plan's half, $1,882, is kept back: $13,318.50 paid. What the US taxes
    // is all but the books' half ($1,186.50): $14,014.00, and 14% of that, $1,961.96, is withheld from a nonresident alien
    // (IRC 1441(b), Form 1042-S).
    const term = ET(2026, 8, 24, 9);
    expect(paid('jp-13-tokyo', ET(2026, 8, 24, 8))).toEqual([{ at: term, moved: { own: 1_135_654, Scholarship: -1_331_850, 'Tax Withheld': 196_196 } }]);
    expect(paid('us-ny-newyork')).toEqual([{ at: term, moved: { own: 1_331_850, Scholarship: -1_331_850 } }]);
  });
});

// ---------------------------------------------------------------------------
// The dispositions: twins alike but for one slider
// ---------------------------------------------------------------------------

/**
 * TEST SETUP: a casting and its performance put on the calendar a minute ahead, as tests/attributes.test.ts does, and
 * the stress at 20 in both twins. The clock fires the call (`school.call`), whose nerves (`nerves`) read the composure
 * and the stressGain knob, and the house (`takeTheHouse`) takes 4 × (55 − 50) / 50 = 0.4 off for newLifeConfig's
 * extraversion of 55. The minute before it is waking time with energy to spare, 0.35 × stressRecovery ÷ 60 cleared.
 */
function performed(seed: string, axis: string, value: number): { sim: Simulation; stress: number } {
  const sim = ada(seed, leaning(axis, value));
  const p = sim.player;
  p.school!.casting = { production: 'A Test Play', role: 'A Part In A New Play', kind: 'carlotta', term: 0, performed: 0 };
  p.wellbeing.stress = 20;
  sim.schedule({ at: sim.now + 60_000, kind: 'school.call', label: 'A Test Play: Performance', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 150, payload: { personId: p.id, call: 'performance' } });
  sim.advanceTo(sim.now + 60_000);
  expect(p.school!.casting!.performed).toBe(1);
  return { sim, stress: p.wellbeing.stress };
}

/** The Dispositions step and the Profile's Dispositions line, for a config's sliders and the life made from it. */
function dispositionsShown(config: NewSaveConfig): { step: string; profile: string } {
  const step = creation(STEP.Dispositions, config);
  const profile = drawn(createSave(1, 'g27-shown', config), ProfileWorkspace);
  return { step: step.text, profile };
}

describe('c-disp-emotionalStability', () => {
  it('starts composure at 26.8 at stability 5 and at 58.3 at 95, as creation and the Profile say', () => {
    // 25 + 0.35 × stability, to a tenth: 26.75 → 26.8, and 58.25 → 58.3.
    expect(ada('g27-calm', leaning('emotionalStability', 5)).player.attrs!.composure).toBe(26.8);
    expect(ada('g27-calm', leaning('emotionalStability', 95)).player.attrs!.composure).toBe(58.3);
    const shown = dispositionsShown(answers(leaning('emotionalStability', 5)));
    expect(shown.step).toContain('Emotional Stability 5 Volatile Steady');
    expect(shown.step).toContain('Emotional Stability: how fast stress builds and clears, and how much Composure you start with.');
    expect(shown.step).toContain('Apart from your starting Composure and Discipline, none of these makes you a better or worse actor. Composure is one of the abilities your performances are judged on.');
    expect(shown.profile).toContain('Emotional Stability 5, how quickly stress builds and how quickly it clears, and where your Composure starts');
  });

  it('PLAYER JOURNEY: the same performance, fired by the clock, takes stress from 20 to 25.330 at stability 5 and to 21.463 at 95', () => {
    // stressGain at newLifeConfig's ambition of 60: 1 + 0.3 + 0.15 × 10/45 = 1.3333 bent in [0.5, 1.8] = 1.305672, and
    // 1 − 0.3 + 0.0333 = 0.7333 bent = 0.747524. stressRecovery 0.7 and 1.3 bent in [0.6, 1.5]: 0.734803 and 1.259848.
    // 20 − 0.35 × 0.734803 / 60 + 6 × (1 − 0.268) × 1.305672 − 0.4 = 25.33022, and with 0.583 and the steady knobs,
    // 21.46296.
    const volatile = performed('g27-show', 'emotionalStability', 5);
    const steady = performed('g27-show', 'emotionalStability', 95);
    expect(volatile.stress).toBeCloseTo(25.33022, 4);
    expect(steady.stress).toBeCloseTo(21.46296, 4);
    // And the nerves grew composure, from where the slider started it.
    expect(volatile.sim.player.attrs!.composure).toBeGreaterThan(26.8);
    expect(steady.sim.player.attrs!.composure).toBeGreaterThan(58.3);
  });

  it('PLAYER JOURNEY: two waking hours clear stress from 40 to 39.486 at stability 5 and to 39.118 at 95, through a save and a load', () => {
    // 0.35 an hour with energy left (`applyElapsedWellbeing`), by stressRecovery: 40 − 0.7 × 0.734803 = 39.48564 and
    // 40 − 0.7 × 1.259848 = 39.11811. Monday's first two hours: nothing else on the calendar touches stress.
    const cleared = (value: number) => {
      let sim = ada('g27-twin', leaning('emotionalStability', value));
      sim.player.wellbeing.stress = 40; // TEST SETUP: the same stress in both.
      sim.advanceTo(ET(2026, 8, 24, 8, 30));
      sim = reload(sim);
      sim.advanceTo(ET(2026, 8, 24, 9, 30));
      expect(sim.player.wellbeing.energy).toBe(76);
      return sim.player.wellbeing.stress;
    };
    expect(cleared(5)).toBeCloseTo(39.48564, 4);
    expect(cleared(95)).toBeCloseTo(39.11811, 4);
  });
});

describe('c-disp-conscientiousness', () => {
  it('starts discipline at 32.5 at conscientiousness 5 and at 77.5 at 95, as creation and the Profile say', () => {
    // 30 + 0.5 × conscientiousness.
    expect(ada('g27-order', leaning('conscientiousness', 5)).player.attrs!.discipline).toBe(32.5);
    expect(ada('g27-order', leaning('conscientiousness', 95)).player.attrs!.discipline).toBe(77.5);
    const shown = dispositionsShown(answers(leaning('conscientiousness', 95)));
    expect(shown.step).toContain('Conscientiousness 95 Loose Meticulous');
    expect(shown.step).toContain('Conscientiousness: how well you sleep, and how much Discipline you start with.');
    expect(shown.profile).toContain('Conscientiousness 95, how well you sleep, and where your Discipline starts');
  });

  it('PLAYER JOURNEY: the same hour of The Given Circumstances through practice.exercise grows imagination 1.0933 times as much at 95 as at 5', () => {
    // Every practice gain is lifted 0.1 × (discipline − 50) / 50 (`DEVELOPMENT.disciplineLift`): 1.055 at 77.5 and 0.965
    // at 32.5, 1.055 / 0.965 = 1.093264.
    const hour = (value: number) => ada('g27-night', leaning('conscientiousness', value)).must<{ gained: number }>({ kind: 'practice.exercise', payload: { exercise: 'given-circumstances' } }).gained;
    const loose = hour(5);
    const meticulous = hour(95);
    expect(loose).toBeGreaterThan(0);
    expect(meticulous / loose).toBeCloseTo(1.093264, 5);
  });

  it('PLAYER JOURNEY: the same five hours through life.sleep at 10 PM sleep 1.2102 times as deep and put back 1.4606 times the energy at 95 as at 5', () => {
    // sleepQuality 0.9 and 1.1 bent in [0.75, 1.25]: 0.904033 and 1.094074; energyRecovery in [0.8, 1.25]: 0.906494 and
    // 1.094074. A night's quality is (0.82 − 0.24 × stress / 100) × sleepQuality, and its energy goes with the quality
    // times energyRecovery, the rest of the night alike: (1.094074 × 1.094074) / (0.904033 × 0.906494) = 1.460643.
    const night = (value: number) => {
      const sim = ada('g27-night', leaning('conscientiousness', value));
      sim.advanceTo(ET(2026, 8, 24, 22));
      const bed = { ...sim.player.wellbeing };
      const r = sim.must<{ quality: number; recovered: number }>({ kind: 'life.sleep', payload: { hours: 5 } });
      return { bed, ...r, woke: sim.player.wellbeing.energy };
    };
    const loose = night(5);
    const meticulous = night(95);
    // The same evening in both: the slider moves nothing in a waking day.
    expect(meticulous.bed).toEqual(loose.bed);
    expect(loose.quality).toBeCloseTo((0.82 - 0.0024 * loose.bed.stress) * 0.9040329, 6);
    expect(meticulous.quality).toBeCloseTo((0.82 - 0.0024 * loose.bed.stress) * 1.0940737, 6);
    expect(meticulous.recovered / loose.recovered).toBeCloseTo(1.460643, 5);
    expect(meticulous.woke).toBeGreaterThan(loose.woke);
    expect(meticulous.woke).toBeLessThan(100);
  });
});

describe('c-disp-ambition', () => {
  it('PLAYER JOURNEY: the same performance takes stress to 22.339 at ambition 5 and to 23.321 at 95, its nerves 1.3580 times as hard', () => {
    // newLifeConfig's stability of 55: composure 44.3 in both. stressGain 1 − 0.0333 − 0.15 = 0.81667 and
    // 1 − 0.0333 + 0.15 = 1.11667, bent in [0.5, 1.8]: 0.821231 and 1.115240. stressRecovery at 55, 1.033260.
    // 20 − 0.35 × 1.033260 / 60 + 6 × 0.557 × 0.821231 − 0.4 = 22.33853; with 1.115240, 23.32110.
    const content = performed('g27-show', 'ambition', 5);
    const driven = performed('g27-show', 'ambition', 95);
    expect(content.stress).toBeCloseTo(22.33853, 4);
    expect(driven.stress).toBeCloseTo(23.32110, 4);
    // The nerves alone, what the house and the minute didn't take: in the ratio of the two knobs, 1.115240 / 0.821231.
    const nerves = (s: number) => s - 20 + 0.35 * 1.0332597 / 60 + 0.4;
    expect(nerves(driven.stress) / nerves(content.stress)).toBeCloseTo(1.358011, 5);
  });

  it('PLAYER JOURNEY: two hours on empty take stress from 40 to 41.905 at ambition 5 and to 42.845 at 95; two hours with energy left clear both alike, to 39.277', () => {
    // On empty, stress climbs 1.6 × stressGain less the 0.35 × stressRecovery it would clear: 40 + 2 × (1.6 × 0.821231 −
    // 0.35 × 1.033260) = 41.90466 and 40 + 2 × (1.6 × 1.115240 − 0.361641) = 42.84549.
    const empty = (value: number) => {
      const sim = ada('g27-empty', leaning('ambition', value));
      Object.assign(sim.player.wellbeing, { energy: 15, stress: 40 }); // TEST SETUP: at the line, the same in both.
      sim.advanceTo(ET(2026, 8, 24, 9, 30));
      return sim.player.wellbeing.stress;
    };
    expect(empty(5)).toBeCloseTo(41.90466, 4);
    expect(empty(95)).toBeCloseTo(42.84549, 4);
    // Ambition leans how stress arrives, not how it clears: 40 − 0.7 × 1.033260 = 39.27672 either way.
    const clears = (value: number) => {
      const sim = ada('g27-twin', leaning('ambition', value));
      sim.player.wellbeing.stress = 40; // TEST SETUP: the same stress in both.
      sim.advanceTo(ET(2026, 8, 24, 9, 30));
      return sim.player.wellbeing.stress;
    };
    expect(clears(5)).toBeCloseTo(39.27672, 4);
    expect(clears(95)).toBeCloseTo(39.27672, 4);
  });

  it('says what ambition does on the Dispositions step and the Profile, by the slider’s number', () => {
    const shown = dispositionsShown(answers(leaning('ambition', 95)));
    expect(shown.step).toContain('Ambition 95 Content Driven');
    expect(shown.step).toContain('Ambition: how fast stress builds, from work and from money alike.');
    expect(shown.profile).toContain('Ambition 95, how quickly stress builds, from work and from money alike');
  });
});
