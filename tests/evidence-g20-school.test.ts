/**
 * Evidence for seven school rows the review of 2026-10-13 left partial (verification group g20-school). Each row's
 * action is reached the way a player reaches it, through the command its screen sends or through the clock, and each
 * consequence is read where the row says it is read: the next casting, a judged take, a step of preparation, the year's
 * earnings, a classmate's bond, the calendar. Figures are worked out here from the rules' own numbers and written as
 * literals; where a figure is the evaluation's own (a fit, a take), twins of one seed alike but for the action are
 * compared, so the action is the only thing that can have moved it.
 *
 * - `school.summer_cabaret`: refused for a student in concern in `summerRefusal`'s words, joined in the first spring,
 *   its three plays cast within the company by `castFit` (a mastered actress plays Maurya in Riders To The Sea, a
 *   floored one Cathleen, the supporting part written for a woman, and from 2026-10-14 the company’s unnamed part in
 *   the two that write a woman only leads); the first show's four nights (Friday, Saturday's
 *   two, Sunday; dark Monday) kept in the run record; the first Friday's $375 on the year's wages with FICA's 7.65%,
 *   $28.69, withheld and nothing for the IRS's income tax or Connecticut's on $375; the second fall's casting reading
 *   the three shows at half weight, min(nights, 8) × 0.5 = 2, 4 and 4, into the delivery the chair reads, once, across
 *   a save and a load; a twin who never joined read on the Carlotta alone; and the School screen's Casting tab, where
 *   Join The Summer Company is pressed.
 * - `plays.read` and `plays.research`: three lives alike but for the library, one reading all twenty-nine plays and
 *   one reading and researching them, differ in script and imagination alone, and the January casting reads each
 *   higher than the last; a read refused for an hour taken (`startRefusal`) and after a withdrawal (`copyAt`), with
 *   nothing moved; and Read It and Research It pressed on the Coursework tab, their notes toasted.
 * - `practice.exercise`: Sense Memory four hours a day for three days, each hour's gain the deliberate rule's own
 *   (0.42 × what's left of the level, floored at a quarter, × discipline's lift, × half for each repeat that day, the
 *   next day's first hour in full); a twin who didn't practice read lower by castFit and taped lower; discipline at
 *   90 against 10, 1.08 ÷ 0.92; each focus against a steady twin (precision 1.15, spaced 0.9 the first time and 1.1 a
 *   day on, variation and live 0.85, carrying 0.3 and 0.15 to their kin under `transfer:sense-memory`), and a tier
 *   below and above (0.75, 0.8); an action sent twice; and every refusal the command has that a player can meet, in
 *   its own words. Variation with nothing to carry over to is one none can: every exercise's design carries over to
 *   something (`EXERCISE_DESIGN`), so only a fixture would reach `focusRefusal`'s words for it, and none is made here.
 * - `practice.self_tape`: a classmate reading a camera brief with her, the take together Strong: her bond rises by
 *   `TOGETHER_BOND`, 1, and nobody else's, where a twin taped with the recording moves none; taped unprepared, the
 *   classmate slips and is covered, and her trust rises by `TOGETHER_COVERED`, 2, with no bond for a take under Strong;
 *   the callback earned, answered as its note asks, ends, across a save and a load; screen, voiceover and a staged
 *   technique grow under `self-tape`; and a take alone gives drama practice 10, which speeds a scene from Trifles by
 *   1 + 10/600.
 * - `genre.study`: two studies the same day come to 8 and 11.68 (100 × 0.08, then half of it on what's left), and
 *   speed a scene from Trifles and A Marriage Proposal's lines by 1 + 11.68/600, each against a twin who didn't
 *   study; and a third that day, after a save and a load, adds a quarter of the first's on what's left. A scene from
 *   Riders to the Sea, a tragedy by the game's own list, is sped by studies of tragedy. Until 2026-10-13 it wasn't at
 *   all: its title's small "to" missed the list's "Riders To The Sea" (`genresOfPlay`). Found by this pass, that test
 *   failed until the titles were compared without their case, the same day.
 * - `school.term`: the second fall's start puts the elective hours to nothing, carries the hours owed, drops the
 *   Saturdays booked, so the first class week's Saturday is booked again (6 hours, then 12), and pays the carried 4
 *   hours with the first Saturday's 6, 10 × $23; and its casting, reached in order by the clock, numbers every
 *   rehearsal call from 1 to the last, the technical and the dress last.
 *
 * PLAYER JOURNEYS: new lives (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity, which `newLifeConfig` leaves empty) and an actress at Yale in New Haven from Monday 24 August
 * 2026, played by the clock and the commands her screens send. Seeds were chosen for what they deal, as a player's own
 * save deals it: g20-summer for its three summer plays, g20-genre-2 for a first scene from Trifles, a drama and a
 * mystery, g20-tape for a classmate who agrees to read, g09-run-1668 for a run on the first morning that breaks a bone
 * (as tests/evidence-g09-life.test.ts found it).
 *
 * TEST SETUP, said again where it's done: the body kept fed, rested and awake at each step of the clock, as a player
 * keeps it; the seven dials set alike before a step two twins are compared on; good standing before the company is
 * joined, which a passive first spring doesn't keep; a craft mastered or floored before a casting or a take; the
 * discipline set before an hour; a hospital bed, a sleep, a tired body and a class gone, each before the refusal it
 * reaches; the year's elective and owed hours before the second fall; and on the screen, the tab, which a static
 * render can't click to.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CALL_KIND, SHIFT_KIND, castFit, evenCraft } from '@/engine/systems/school';
import { performerOf } from '@/engine/systems/evaluation';
import { attributesOf, abilityFull, developmentOf, levelOf } from '@/engine/systems/attributes';
import { yearOf } from '@/engine/systems/earnings';
import { courseworkOf, trustOf } from '@/engine/systems/coursework';
import { recordOf } from '@/engine/systems/briefs';
import { processOf } from '@/engine/systems/production';
import { healthOf } from '@/engine/systems/health';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { CONTEMPORARY_PLAYS } from '@/engine/content/contemporary';
import { genresOfPlay } from '@/engine/content/plays';
import { sceneById } from '@/engine/content/coursework';
import { MASTERED } from '@/engine/content/abilities';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tab: 'standing',
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  toasts: [] as string[],
}));

/** Every button the screen draws, with its words, whether it's grayed out, and its own onClick, to be pressed. */
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

// The School screen's kept tab, at the one the test asks for: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? h.tab : initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back. `run` is the save's own execute; a toast is kept.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');

// ---------------------------------------------------------------------------
// Lives, the clock, and the screen
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 12, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const life = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/** TEST SETUP: the body kept fed, rested and awake, as a player keeps it. */
const kept = (sim: Simulation) => {
  Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
  sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
};
/** TEST SETUP: the seven dials alike before a step two lives are compared on, so the day's readiness is the same in each. */
const dials = (sim: Simulation) => {
  Object.assign(sim.player.wellbeing, { energy: 80, stress: 20, sleepDebt: 0, nourishment: 70, morale: 60, hygiene: 90, condition: 100 });
  sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
};
/** The clock moved six hours at a time, the body kept at each step. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { kept(sim); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
/** Lives played alike: each step of the clock taken by all of them at once, each kept the same way at the same moment. */
const inStep = (lives: Simulation[], until: number) => {
  while (lives[0]!.now < until) {
    const to = Math.min(until, lives[0]!.now + 6 * MS_HOUR);
    for (const one of lives) { kept(one); one.advanceTo(to); }
  }
};
/** Every life brought to the latest clock among them. */
const level = (lives: Simulation[]) => { const to = Math.max(...lives.map((s) => s.now)); for (const one of lives) if (one.now < to) one.advanceTo(to); };
const say = <T,>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => sim.execute<T>({ kind, payload });
const fmt = (t: number) => { const p = zonedParts(t, NY); return `${p.year}-${p.month}-${p.day} ${p.hour}:${String(p.minute).padStart(2, '0')}`; };
const historyOf = (sim: Simulation) => developmentOf(sim.player).history;

/** What the player reads: the markup with every tag taken out and its entities read. */
const onScreen = (html: string) => html.replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
/** The School screen at a tab, as the player has it: the words, and the buttons with their own onClick. */
function schoolScreen(sim: Simulation, tab: string) {
  h.sim = sim;
  h.tab = tab;
  h.buttons = [];
  const html = renderToStaticMarkup(createElement(SchoolWorkspace));
  return { text: onScreen(html), buttons: [...h.buttons] };
}
/** A button pressed as the player presses it: its own onClick, and the toasts it gave. */
const press = (b: { onClick?: () => void } | undefined) => { expect(b?.onClick).toBeDefined(); h.toasts = []; b!.onClick!(); return [...h.toasts]; };

// ---------------------------------------------------------------------------
// school.summer_cabaret
// ---------------------------------------------------------------------------

describe('school.summer_cabaret', () => {
  /** The first spring played by the clock, to noon on Saturday 20 March 2027, a month before the company forms. */
  const spring = (seed = 'g20-summer') => { const sim = life(seed); tended(sim, at(2027, 3, 20)); return sim; };
  const shows = (sim: Simulation) => sim.player.school!.summer!.shows!.map((s) => [s.play, s.role, s.size]);

  it('PLAYER JOURNEY: joined in the first spring, its first show’s four nights go into the run record, its first Friday puts $375 on the year’s wages with $28.69 of FICA withheld, and the second fall’s casting reads its three shows at half weight into the delivery the chair reads, once, across a save and a load', () => {
    const sim = spring();
    const school = sim.player.school!;
    // A passive first spring leaves her in concern, and the company says why in its own words.
    expect(school.standing).toBe('concern');
    expect(say(sim, 'school.summer_cabaret').error).toBe('The Summer Cabaret’s company takes a student in good standing.');
    expect(school.summer).toBeUndefined();
    // TEST SETUP: good standing, which the company asks of a student; this is a test of the summer, not the year.
    school.standing = 'good';
    const joined = sim.must<{ from: number; until: number }>({ kind: 'school.summer_cabaret', payload: {} });
    // The first show opens Friday 25 June; its rehearsals begin three weeks before, at one: 4 June, 13:00 EDT (UTC−4).
    // The last closes Sunday 22 August, held to eleven that night.
    expect(joined).toEqual({ from: Date.UTC(2027, 5, 4, 17), until: Date.UTC(2027, 7, 23, 3) });
    expect(say(sim, 'school.summer_cabaret').error).toBe('You’re in this summer’s company.');
    expect(shows(sim)).toEqual([['A Marriage Proposal', 'Natalya Stepanovna', 'lead'], ['Trifles', 'Mrs Hale', 'lead'], ['Riders To The Sea', 'Maurya', 'lead']]);

    // The first Friday, 4 June at five: the week's $375. Federal income tax on $375 a year is nothing (the standard
    // deduction), and Connecticut's too (its personal exemption); FICA is 6.2% + 1.45% of it, $28.6875, so $28.69.
    const y0 = { ...yearOf(sim.player, 2027) };
    expect([y0.acting, y0.withheld, y0.withheldBy]).toEqual([0, 0, undefined]);
    tended(sim, Date.UTC(2027, 5, 4, 22));
    const y1 = yearOf(sim.player, 2027);
    expect(y1.acting).toBe(375_00);
    expect(y1.withheld).toBe(28_69);
    expect(y1.withheldBy).toEqual({ us: 28_69 });
    expect(y1.employers['yale-summer-cabaret']).toBe(375_00);
    const paid = sim.universe.transactions.filter((t) => t.memo === 'Yale Summer Cabaret stipend, the week');
    expect(paid).toHaveLength(1);
    const line = (name: string) => paid[0]!.postings.find((p) => sim.universe.accounts[p.accountId]!.name === name)!.amount;
    expect([line('Wages'), line('Tax Withheld')]).toEqual([-375_00, 28_69]);

    // The first show: Friday 25 June at eight, Saturday's matinee at two and night at eight, Sunday at eight; dark Monday.
    tended(sim, at(2027, 6, 28, 1));
    const summer = school.summer!;
    expect(summer.played).toEqual([4, 0, 0]);
    const first = (school.runs ?? []).filter((r) => r.source === 'summer');
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ production: 'Yale Summer Cabaret 2027, Show 1', play: 'A Marriage Proposal', role: 'Natalya Stepanovna', nights: 4, missed: 0 });
    // Each night's delivery is a share of what was prepared, so four nights deliver more than nothing and at most four.
    expect(first[0]!.delivered).toBeGreaterThan(0);
    expect(first[0]!.delivered).toBeLessThanOrEqual(4);
    expect(first[0]!.readAtCasting).toBeUndefined();
    expect(school.credits).toContainEqual({ production: 'A Marriage Proposal, Yale Summer Cabaret 2027', role: 'Natalya Stepanovna', kind: 'summer', year: 2027, wentOn: 4 });

    // Trifles, 23 July to 1 August, and Riders To The Sea, 13 to 22 August: nine evenings and two Saturday matinees each,
    // eleven, dark on the Monday between.
    tended(sim, at(2027, 8, 23, 8));
    expect(summer.played).toEqual([4, 11, 11]);
    const twin = reload(sim);
    for (const one of [sim, twin]) tended(one, at(2027, 8, 23, 10));
    for (const one of [sim, twin]) {
      const s = one.player.school!;
      expect(s.termsBegun).toBe(3);
      const last = s.lastWork!;
      // The record's weight is min(nights, 8), a summer's at half: 2, 4 and 4.
      const from = last.from!.filter((f) => f.source === 'summer');
      expect(from.map((f) => [f.what, f.nights, f.weight])).toEqual([['A Marriage Proposal', 4, 2], ['Trifles', 11, 4], ['Riders To The Sea', 11, 4]]);
      // Each run's delivery a night, kept to three places: the first show's its four nights' sum over four.
      expect(from[0]!.delivery).toBe(Math.round((first[0]!.delivered / 4) * 1000) / 1000);
      // The chair's delivery is the weighted mean of everything read (to two places here, each run's being kept to
      // three), and the evidence it stands on is capped at 12.
      const all = last.from!;
      const mean = all.reduce((n, f) => n + f.delivery! * f.weight!, 0) / all.reduce((n, f) => n + f.weight!, 0);
      expect(last.delivery!).toBeCloseTo(mean, 2);
      expect(last.weight).toBe(Math.min(12, all.reduce((n, f) => n + f.weight!, 0)));
      expect(s.runs!.filter((r) => r.source === 'summer').map((r) => r.readAtCasting)).toEqual([2, 2, 2]);
      // And the casting the chair made reads it: her row's delivery is the record's.
      expect(s.castRead!.rows.find((r) => r.you)!.delivery).toBe(last.delivery);
    }
    expect(twin.player.school!.lastWork).toEqual(sim.player.school!.lastWork);
    // Read once: the spring's casting, in January 2028, finds no summer run unread.
    tended(sim, at(2028, 1, 20));
    expect(school.termsBegun).toBe(4);
    expect(school.lastWork!.from!.some((f) => f.source === 'summer')).toBe(false);
    expect(school.runs!.filter((r) => r.source === 'summer').map((r) => r.readAtCasting)).toEqual([2, 2, 2]);
  });

  it('PLAYER JOURNEY: a twin who never joined comes to the second fall’s casting with the Carlotta alone on the record the chair reads', () => {
    const sim = spring();
    tended(sim, at(2027, 8, 23, 10));
    const last = sim.player.school!.lastWork!;
    expect(sim.player.school!.summer).toBeUndefined();
    expect(last.from!.map((f) => f.source)).toEqual(['school']);
    expect(last.from![0]!.what).toBe('Carlotta Festival Of New Plays');
    expect(last.weight).toBe(4);
  });

  it('casts its parts within the company by castFit: mastered, she plays the lead written for a woman in each play; floored, the supporting part where the play writes one for a woman, and the company’s unnamed part where it writes her only a lead', () => {
    const cast = (to: number) => {
      const sim = spring();
      sim.player.school!.standing = 'good'; // TEST SETUP: good standing, as above.
      // TEST SETUP: every technique and ability at one level, the class's best or its last, before the company casts.
      sim.player.craft = evenCraft(to);
      sim.player.attrs = { presence: to, composure: to, listening: to, imagination: to, focus: to, adaptability: to, discipline: to };
      sim.player.wellbeing.fitness = to === 100 ? abilityFull(sim, sim.player, 'stamina') : to;
      sim.must({ kind: 'school.summer_cabaret', payload: {} });
      return shows(sim);
    };
    // The casts as published (content/plays.ts): A Marriage Proposal and Trifles write a woman only leads, Riders To The
    // Sea writes Maurya, the lead, and Cathleen and Nora, supporting.
    expect(cast(100)).toEqual([['A Marriage Proposal', 'Natalya Stepanovna', 'lead'], ['Trifles', 'Mrs Hale', 'lead'], ['Riders To The Sea', 'Maurya', 'lead']]);
    // Floored, until 2026-10-14 she was given the one part each play wrote for a woman, a lead she hadn’t earned; the owner
    // settled that day that she takes the company’s unnamed part where the play writes her nothing below a lead.
    expect(cast(10)).toEqual([['A Marriage Proposal', 'In The Company', 'featured'], ['Trifles', 'In The Company', 'featured'], ['Riders To The Sea', 'Cathleen', 'supporting']]);
  });

  it('on the Casting tab, a student in concern is told why in words and offered nothing; in good standing, Join The Summer Company pressed puts her in the company, says so, and the panel lists the three plays, her parts and their dates, the button gone', () => {
    const sim = spring();
    const before = schoolScreen(sim, 'casting');
    expect(before.text).toContain('The Yale Summer Cabaret Three shows a summer in New Haven');
    expect(before.text).toContain('The Summer Cabaret’s company takes a student in good standing.');
    expect(before.buttons.filter((b) => b.text === 'Join The Summer Company')).toEqual([]);
    sim.player.school!.standing = 'good'; // TEST SETUP: good standing, as above.
    const offered = schoolScreen(sim, 'casting');
    const join = offered.buttons.filter((b) => b.text === 'Join The Summer Company');
    expect(join).toHaveLength(1);
    expect(join[0]!.disabled).toBeFalsy();
    expect(press(join[0])).toEqual(['In this summer’s company.']);
    expect(sim.player.school!.summer?.year).toBe(2027);
    const after = schoolScreen(sim, 'casting');
    expect(after.buttons.filter((b) => b.text === 'Join The Summer Company')).toEqual([]);
    expect(after.text).toContain('The Yale Summer Cabaret In the 2027 company, to August 22, 2027');
    expect(after.text).toContain('A Marriage Proposal , by Anton Chekhov: Natalya Stepanovna, June 25, 2027 to June 28, 2027, played 0.');
    expect(after.text).toContain('Trifles , by Susan Glaspell: Mrs Hale, July 23, 2027 to August 1, 2027, played 0.');
    expect(after.text).toContain('Riders To The Sea , by J. M. Synge: Maurya, August 13, 2027 to August 22, 2027, played 0.');
  });
});

// ---------------------------------------------------------------------------
// plays.read and plays.research
// ---------------------------------------------------------------------------

/**
 * Three lives of one seed kept alike from Saturday 5 September 2026 at six in the evening: one reads nothing; one reads
 * every one of the twenty-nine plays, each as soon as the hour allows (a read refused for a class coming or a shift
 * under way waits half an hour, in all three alike); one reads them and researches each. Then the clock to the spring
 * term's casting on Monday 4 January 2027.
 */
type Library = { plain: Simulation; read: Simulation; both: Simulation; fitThen: Record<'plain' | 'read' | 'both', number>; sources: Record<'read' | 'both', string[]> };
let LIBRARY: Library | undefined;
function library(): Library {
  if (LIBRARY) return LIBRARY;
  const lives = { plain: life('g20-plays-b'), read: life('g20-plays-b'), both: life('g20-plays-b') };
  const all = [lives.plain, lives.read, lives.both];
  inStep(all, at(2026, 9, 5, 18));
  const steps = [...CONTEMPORARY_PLAYS.map((p) => ['plays.read', p.id] as const), ...CONTEMPORARY_PLAYS.map((p) => ['plays.research', p.id] as const)];
  for (let i = 0; i < steps.length;) {
    const [kind, playId] = steps[i]!;
    for (const one of all) kept(one); // TEST SETUP: each kept alike.
    const who = kind === 'plays.read' ? [lives.read, lives.both] : [lives.both];
    const from = lives.both.now;
    const done = who.map((one) => say(one, kind, { playId }));
    expect(done.every((r) => r.ok) || done.every((r) => !r.ok), `${kind} ${playId} at ${fmt(from)}`).toBe(true);
    if (done[0]!.ok) { i += 1; level(all); continue; }
    for (const one of all) one.advanceTo(from + 30 * 60_000);
  }
  const fit = (one: Simulation) => castFit(one, performerOf(one, one.player), { script: 1 }, [], 'a play read for its text');
  const fitThen = { plain: fit(lives.plain), read: fit(lives.read), both: fit(lives.both) };
  // What the development history says grew them, read now: it keeps its last 400 changes, and the fall's classes push
  // these out before January.
  const grown = (one: Simulation) => historyOf(one).filter((e) => /^(read|research):/.test(e.source)).map((e) => `${e.id}<${e.source}`);
  const sources = { read: grown(lives.read), both: grown(lives.both) };
  inStep(all, at(2027, 1, 4, 10));
  LIBRARY = { ...lives, fitThen, sources };
  return LIBRARY;
}
const youIn = (sim: Simulation) => sim.player.school!.castRead!.rows.find((r) => r.you)!;
const techniques = (sim: Simulation) => ({ ...sim.player.craft! });

describe('plays.read', () => {
  it('PLAYER JOURNEY: every play read leaves her more script and imagination than a twin who read none, and nothing else, and castFit and the spring casting read her higher for it', () => {
    const { plain, read } = library();
    expect(Object.keys(read.player.plays ?? {})).toHaveLength(CONTEMPORARY_PLAYS.length);
    expect(Object.values(read.player.plays!).every((s) => s.reads === 1 && s.researchedAt === undefined)).toBe(true);
    // What differs is the text craft and imagination: every other technique and ability the same, to the last digit.
    const mine = techniques(read), theirs = techniques(plain);
    expect(Object.keys(mine).filter((k) => mine[k as keyof typeof mine] !== theirs[k as keyof typeof theirs])).toEqual(['script']);
    expect(mine.script).toBeGreaterThan(theirs.script);
    const a = attributesOf(read, read.player), b = attributesOf(plain, plain.player);
    expect(Object.keys(a).filter((k) => a[k as keyof typeof a] !== b[k as keyof typeof b])).toEqual(['imagination']);
    expect(a.imagination).toBeGreaterThan(b.imagination);
    // Each read is on the development history under its own play, script and imagination both, and nothing else.
    expect(library().sources.read).toEqual(CONTEMPORARY_PLAYS.flatMap((p) => [`script<read:${p.id}`, `imagination<read:${p.id}`]));
    // The casting's read of her for a play read for its text, and the chair's in January for the Carlotta's new plays.
    expect(library().fitThen.read).toBeGreaterThan(library().fitThen.plain);
    expect(youIn(read).fit).toBeGreaterThan(youIn(plain).fit);
  });

  it('PLAYER JOURNEY: refuses a read for an hour already taken, in startRefusal’s words, and moves nothing: not the clock, the energy, the record or the craft', () => {
    const sim = life('g20-plays-b');
    tended(sim, at(2026, 9, 8, 7, 45));
    const still = () => [sim.now, sim.player.wellbeing.energy, JSON.stringify(sim.player.plays ?? {}), sim.player.craft!.script, historyOf(sim).length];
    const was = still();
    // Tuesday 8 September: classes at nine, inside a two-hour read begun at a quarter to eight.
    expect(say(sim, 'plays.read', { playId: 'sweat' }).error).toBe('Classes starts at 9:00 AM: there isn’t the time before it.');
    expect(still()).toEqual(was);
    tended(sim, at(2026, 9, 8, 10));
    const during = still();
    expect(say(sim, 'plays.read', { playId: 'sweat' }).error).toBe('You’re at Classes until 3:00 PM.');
    expect(still()).toEqual(during);
  });

  it('PLAYER JOURNEY: after she withdraws from the School by its own command, there’s no copy to be had: a read and a research are refused in copyAt’s words', () => {
    const sim = life('g20-plays-b');
    tended(sim, at(2026, 9, 5, 18));
    sim.must({ kind: 'plays.read', payload: { playId: 'sweat' } });
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(sim.player.school!.standing).toBe('withdrawn');
    const no = 'A copy is borrowed from the Haas Arts Library, which lends to students.';
    expect(say(sim, 'plays.read', { playId: 'fleabag' }).error).toBe(no);
    expect(say(sim, 'plays.read', { playId: 'sweat' }).error).toBe(no);
    expect(say(sim, 'plays.research', { playId: 'sweat' }).error).toBe(no);
    expect(sim.player.plays!.sweat!.reads).toBe(1);
  });

  it('on the Coursework tab, Read It pressed reads the play and says its note; the row then offers Read It Again and Research It, and the note is among Your Latest Notes', () => {
    const sim = life('g20-plays-b');
    tended(sim, at(2026, 9, 5, 18));
    const reads = (s: ReturnType<typeof schoolScreen>) => s.buttons.filter((b) => b.text === 'Read It' || b.text === 'Read It Again');
    const first = schoolScreen(sim, 'coursework');
    expect(first.text).toContain('Plays To Read A Copy From The Haas Arts Library');
    const row = CONTEMPORARY_PLAYS.findIndex((p) => p.id === 'sweat');
    const button = reads(first)[row]!;
    expect(button.text).toBe('Read It');
    const t0 = sim.now;
    const note = 'Sweat, by Lynn Nottage, read through. It reads as a drama, based on interviews with residents. The cast as published: 3 women and 6 men. There’s a part in it for you. It’s set: Reading, Pennsylvania, the time not given.';
    expect(press(button)).toEqual([note]);
    expect(sim.now - t0).toBe(120 * 60_000);
    expect(sim.player.plays!.sweat!.reads).toBe(1);
    const after = schoolScreen(sim, 'coursework');
    expect(reads(after)[row]!.text).toBe('Read It Again');
    expect(after.buttons.filter((b) => b.text === 'Research It')).toHaveLength(1);
    expect(after.text).toContain(`Your Latest Notes September 5, 2026, Sweat: ${note}`);
  });
});

describe('plays.research', () => {
  it('PLAYER JOURNEY: every play read and researched leaves her more script than the twin who only read them, the same imagination, and castFit and the spring casting read her higher again', () => {
    const { read, both } = library();
    expect(Object.values(both.player.plays!).every((s) => s.reads === 1 && s.researchedAt !== undefined)).toBe(true);
    const mine = techniques(both), theirs = techniques(read);
    expect(Object.keys(mine).filter((k) => mine[k as keyof typeof mine] !== theirs[k as keyof typeof theirs])).toEqual(['script']);
    expect(mine.script).toBeGreaterThan(theirs.script);
    expect(attributesOf(both, both.player)).toEqual(attributesOf(read, read.player));
    // Each research once on the history, under its own play, and script alone.
    expect(library().sources.both).toEqual([...CONTEMPORARY_PLAYS.flatMap((p) => [`script<read:${p.id}`, `imagination<read:${p.id}`]), ...CONTEMPORARY_PLAYS.map((p) => `script<research:${p.id}`)]);
    expect(library().fitThen.both).toBeGreaterThan(library().fitThen.read);
    // The spring casting reads her script higher: strictly, by a tenth of the fit, until 2026-10-16, when a class began to
    // read discipline and keep half for a repeat (`grown`), and the fall’s classes closed the gap to about half a point of
    // script (54.52 against 53.96, measured), under the tenth the fit is shown to. Her script still stands higher.
    expect(youIn(both).fit).toBeGreaterThanOrEqual(youIn(read).fit);
    expect(both.player.craft!.script).toBeGreaterThan(read.player.craft!.script + 0.5);
    // A second research is refused in researchRefusal's words.
    expect(say(both, 'plays.research', { playId: 'sweat' }).error).toBe('Its first production is researched: there’s nothing more on record to find.');
  });

  it('on the Coursework tab, Research It pressed after a read says the first production, edition and licensor, and is gone from the row on the next render, which says Researched', () => {
    const sim = life('g20-plays-b');
    tended(sim, at(2026, 9, 5, 18));
    sim.must({ kind: 'plays.read', payload: { playId: 'sweat' } });
    const shown = schoolScreen(sim, 'coursework');
    const research = shown.buttons.filter((b) => b.text === 'Research It');
    expect(research).toHaveLength(1);
    const t0 = sim.now;
    expect(press(research[0])).toEqual(['First staged in 2015 at Oregon Shakespeare Festival. First published 2017, by Theatre Communications Group. Licensed for performance in the US by Dramatists Play Service.']);
    expect(sim.now - t0).toBe(90 * 60_000);
    const after = schoolScreen(sim, 'coursework');
    expect(after.buttons.filter((b) => b.text === 'Research It')).toEqual([]);
    expect(after.text).toContain('Once Researched');
  });
});

// ---------------------------------------------------------------------------
// practice.exercise
// ---------------------------------------------------------------------------

/** What's left of a level for deliberate practice to work on, floored at a quarter (`DEVELOPMENT.floor`). */
const left = (level: number) => Math.max(0.25, 1 - level / 100);
/** Discipline's lift on an hour: a tenth more at 100, a tenth less at 0 (`DEVELOPMENT.disciplineLift`). */
const lift = (discipline: number) => 1 + 0.1 * (discipline - 50) / 50;
const hourOf = (sim: Simulation, exercise: string, extra: Record<string, unknown> = {}) => say<{ gained: number; carried: { target: string; gained: number }[] }>(sim, 'practice.exercise', { exercise, ...extra });

describe('practice.exercise', () => {
  it('PLAYER JOURNEY: Sense Memory four hours a day for three days, each hour the deliberate rule’s (the same day’s next at half, the next day’s first in full), the fifth refused; a twin who didn’t differs only in emotional depth and discipline, and castFit and a brief taped at the same moment read the twin lower', () => {
    const ada = life('g20-practice'), twin = life('g20-practice');
    const hours: { gained: number; L: number; D: number }[][] = [];
    for (const day of [5, 6, 7]) {
      inStep([ada, twin], at(2026, 9, day, 17));
      const today: { gained: number; L: number; D: number }[] = [];
      for (let n = 0; n < 4; n += 1) {
        dials(ada); // TEST SETUP: the same readiness each hour, so the hour's focus is the same.
        const L = levelOf(ada, ada.player, 'emotionalDepth'), D = attributesOf(ada, ada.player).discipline;
        const r = hourOf(ada, 'sense-memory');
        expect(r.ok, r.error).toBe(true);
        today.push({ gained: r.value!.gained, L, D });
      }
      expect(hourOf(ada, 'sense-memory').error).toBe('You’ve practiced 4 hours today: past that, more stops helping. Tomorrow.');
      hours.push(today);
      level([ada, twin]);
    }
    // gain = 0.42 × focus × left(L) × lift(D) × 0.5^n: the focus is the same each hour, so ratios read the rule alone.
    for (const today of hours) {
      today.forEach((x, n) => expect(x.gained / today[0]!.gained, `hour ${n + 1}`).toBeCloseTo(0.5 ** n * (left(x.L) * lift(x.D)) / (left(today[0]!.L) * lift(today[0]!.D)), 9));
    }
    for (const today of hours.slice(1)) expect(today[0]!.gained / hours[0]![0]!.gained).toBeCloseTo((left(today[0]!.L) * lift(today[0]!.D)) / (left(hours[0]![0]!.L) * lift(hours[0]![0]!.D)), 9);
    const total = hours.flat().reduce((n, x) => n + x.gained, 0);
    expect(levelOf(ada, ada.player, 'emotionalDepth') - levelOf(twin, twin.player, 'emotionalDepth')).toBeCloseTo(total, 9);
    // Nothing else differs: the feeling's technique and discipline, grown once each day practiced.
    const mine = techniques(ada), theirs = techniques(twin);
    expect(Object.keys(mine).filter((k) => mine[k as keyof typeof mine] !== theirs[k as keyof typeof theirs])).toEqual(['emotion']);
    const a = attributesOf(ada, ada.player), b = attributesOf(twin, twin.player);
    expect(Object.keys(a).filter((k) => a[k as keyof typeof a] !== b[k as keyof typeof b])).toEqual(['discipline']);
    expect(historyOf(ada).filter((e) => e.source === 'practice-day')).toHaveLength(3);
    // Miss Julie's reads lean on the feeling: the chair would read her higher for it.
    const julie = { emotion: 2, scene: 2, intimacy: 1 };
    expect(castFit(ada, performerOf(ada, ada.player), julie, [], 'Miss Julie')).toBeGreaterThan(castFit(twin, performerOf(twin, twin.player), julie, [], 'Miss Julie'));
    // And a brief chosen, prepared the same two rounds at the desk and taped by each, from Tuesday 8 September at seven
    // in the evening: prepared, so the take reads the abilities and not only what wasn't done.
    inStep([ada, twin], at(2026, 9, 8, 19));
    const drama = BRIEF_BY_ID['brief-drama']!;
    const takes = [ada, twin].map((one) => {
      dials(one); // TEST SETUP: readiness alike in each twin before each step.
      one.must({ kind: 'brief.choose', payload: { brief: drama.id, reading: drama.readings[0]!.id } });
      for (let i = 0; i < 2; i += 1) for (const step of ['read', 'lines']) { dials(one); /* TEST SETUP */ one.must({ kind: 'brief.prepare', payload: { brief: drama.id, step } }); }
      dials(one); // TEST SETUP
      const r = say<{ overall: number }>(one, 'practice.self_tape', { genre: 'drama', brief: drama.id });
      expect(r.ok, r.error).toBe(true);
      return recordOf(one.player, drama.id).takes.at(-1)!;
    });
    expect(takes[0]!.prep).toEqual(takes[1]!.prep);
    expect(takes[0]!.expected, `against the twin's ${takes[1]!.expected} (drawn: ${takes[0]!.overall}, ${takes[1]!.overall})`).toBeGreaterThan(takes[1]!.expected);
    expect(takes[0]!.overall).toBeGreaterThan(takes[1]!.overall);
  });

  /** An hour of Sense Memory at ten on Sunday 6 September, its readiness set, and the levels it started from. */
  const sunday = (payload: Record<string, unknown> = {}, discipline?: number) => {
    const sim = life('g20-focus');
    tended(sim, at(2026, 9, 6, 10));
    if (discipline !== undefined) attributesOf(sim, sim.player).discipline = discipline; // TEST SETUP: the discipline.
    dials(sim); // TEST SETUP
    const levels = Object.fromEntries((['emotionalDepth', 'imagination', 'listening', 'adaptability'] as const).map((id) => [id, levelOf(sim, sim.player, id)])) as Record<'emotionalDepth' | 'imagination' | 'listening' | 'adaptability', number>;
    const r = hourOf(sim, 'sense-memory', payload);
    expect(r.ok, r.error).toBe(true);
    return { sim, gained: r.value!.gained, carried: r.value!.carried, levels };
  };

  it('counts an hour 1.08 ÷ 0.92 more at discipline 90 than at 10, the same hour otherwise', () => {
    expect(sunday({}, 90).gained / sunday({}, 10).gained).toBeCloseTo(1.08 / 0.92, 9);
  });

  it('spends the hour each way against a steady twin: precision rested 1.15, spaced the first time 0.9, variation and live 0.85 carrying 0.3 and 0.15 to their kin under transfer:sense-memory, a tier below 0.75 and above 0.8', () => {
    const steady = sunday();
    expect(steady.carried).toEqual([]);
    expect(sunday({ focus: 'precision' }).gained / steady.gained).toBeCloseTo(1.15, 9);
    expect(sunday({ focus: 'spaced' }).gained / steady.gained).toBeCloseTo(0.9, 9);
    // Her level puts her in the Developing tier (45 to 75): Foundation is a tier below, Advanced one above.
    expect(steady.levels.emotionalDepth).toBeGreaterThanOrEqual(45);
    expect(steady.levels.emotionalDepth).toBeLessThan(75);
    expect(sunday({ tier: 0 }).gained / steady.gained).toBeCloseTo(0.75, 9);
    expect(sunday({ tier: 2 }).gained / steady.gained).toBeCloseTo(0.8, 9);
    const varied = sunday({ focus: 'variation' });
    expect(varied.gained / steady.gained).toBeCloseTo(0.85, 9);
    // Carried at 0.3 of an hour to imagination (its design's kin), on what's left of imagination's level.
    expect(varied.carried.map((c) => c.target)).toEqual(['imagination']);
    expect(varied.carried[0]!.gained / varied.gained).toBeCloseTo((0.3 / 0.85) * left(varied.levels.imagination) / left(varied.levels.emotionalDepth), 9);
    expect(levelOf(varied.sim, varied.sim.player, 'imagination') - varied.levels.imagination).toBeCloseTo(varied.carried[0]!.gained, 9);
    expect(historyOf(varied.sim).filter((e) => e.source === 'transfer:sense-memory').map((e) => e.id)).toEqual(['imagination']);
    const live = sunday({ focus: 'live' });
    expect(live.gained / steady.gained).toBeCloseTo(0.85, 9);
    expect(live.carried.map((c) => c.target)).toEqual(['listening', 'adaptability']);
    for (const c of live.carried) expect(c.gained / live.gained).toBeCloseTo((0.15 / 0.85) * left(live.levels[c.target as 'listening' | 'adaptability']) / left(live.levels.emotionalDepth), 9);
    expect(historyOf(live.sim).filter((e) => e.source === 'transfer:sense-memory').map((e) => e.id)).toEqual(['listening', 'adaptability']);
  });

  it('spaces an hour taken a day after the last for 1.1 of a steady one', () => {
    const lives = [life('g20-focus'), life('g20-focus')];
    inStep(lives, at(2026, 9, 5, 17));
    for (const one of lives) { dials(one); /* TEST SETUP */ expect(hourOf(one, 'sense-memory').ok).toBe(true); }
    inStep(lives, at(2026, 9, 6, 17));
    const [steady, spaced] = lives.map((one, i) => { dials(one); /* TEST SETUP */ return hourOf(one, 'sense-memory', i ? { focus: 'spaced' } : {}).value!.gained; });
    expect(spaced! / steady!).toBeCloseTo(1.1, 9);
  });

  it('lives an hour sent twice with one action id once: the second refused in alreadyApplied’s words, the clock, the level and the history as they were, across a save and a load', () => {
    const sim = life('g20-focus');
    tended(sim, at(2026, 9, 6, 10));
    expect(hourOf(sim, 'sense-memory', { actionId: 'hour-1' }).ok).toBe(true);
    const was = [sim.now, levelOf(sim, sim.player, 'emotionalDepth'), historyOf(sim).length];
    expect(hourOf(sim, 'sense-memory', { actionId: 'hour-1' }).error).toBe('That was already done.');
    expect([sim.now, levelOf(sim, sim.player, 'emotionalDepth'), historyOf(sim).length]).toEqual(was);
    const back = reload(sim);
    expect(hourOf(back, 'sense-memory', { actionId: 'hour-1' }).error).toBe('That was already done.');
    expect([back.now, levelOf(back, back.player, 'emotionalDepth'), historyOf(back).length]).toEqual(was);
  });

  it('refuses in each rule’s own words, through the command, and moves nothing: no such exercise or tier, a class under way or coming, four hours done, a hospital bed, asleep, too tired for the feet, and a classmate wanted where there’s no class', () => {
    const sim = life('g20-focus');
    const still = () => [sim.now, historyOf(sim).length, JSON.stringify(sim.player.experience?.exercises ?? {})];
    const refused = (exercise: string, words: string, extra: Record<string, unknown> = {}) => {
      const was = still();
      expect(hourOf(sim, exercise, extra).error, exercise).toBe(words);
      expect(still()).toEqual(was);
    };
    tended(sim, at(2026, 9, 8, 8, 30));
    refused('sense-memory', 'Classes starts at 9:00 AM: there isn’t the time before it.');
    tended(sim, at(2026, 9, 8, 10));
    refused('sense-memory', 'You’re at Classes until 3:00 PM.');
    tended(sim, at(2026, 9, 8, 19));
    refused('the-method', 'There’s no such exercise.');
    refused('sense-memory', 'There’s no such tier.', { tier: 3 });
    // TEST SETUP: in a hospital bed until tomorrow.
    healthOf(sim.player).inHospitalUntil = sim.now + MS_DAY;
    refused('sense-memory', 'Not from a hospital bed.');
    delete healthOf(sim.player).inHospitalUntil; // TEST SETUP undone.
    // TEST SETUP: asleep, a night under way that wakes in an hour.
    sim.player.awakeSince = sim.now + MS_HOUR;
    refused('sense-memory', 'You’re asleep.');
    sim.player.awakeSince = sim.now; // TEST SETUP undone: awake.
    // TEST SETUP: spent, below the 25 the feet ask. The desk asks nothing of it.
    sim.player.wellbeing.energy = 20;
    refused('movement-work', 'You’re too tired to work on your feet. Sleep first.');
    expect(hourOf(sim, 'sense-memory').ok).toBe(true);
    // Until 2026-10-13 the class was taken away here by hand, which a student’s never is, and what wanted a classmate was
    // refused with “It takes a classmate, and you have no class to ask.”: a refusal no play reached, which went that day.
    dials(sim); // TEST SETUP: rested again.
    expect(hourOf(sim, 'concentration').ok).toBe(true);
    for (const e of ['recall-drill', 'adjustments']) { dials(sim); /* TEST SETUP */ expect(hourOf(sim, e).ok).toBe(true); }
    refused('voice-work', 'You’ve practiced 4 hours today: past that, more stops helping. Tomorrow.');
  });

  it('PLAYER JOURNEY: a run on the first morning breaks a bone, and an exercise on the feet is refused in trainingRefusal’s words while one at a desk is not', () => {
    // g09-run-1668: the seed tests/evidence-g09-life.test.ts found to break a bone on Monday 24 August's run.
    const sim = createSave(1, 'g09-run-1668', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personalityTraits: [] });
    expect(say(sim, 'life.look_after', { action: 'exercise' }).ok).toBe(true);
    expect(healthOf(sim.player).injury?.kind).toBe('fracture');
    tended(sim, at(2026, 8, 24, 18));
    const t0 = sim.now;
    expect(hourOf(sim, 'movement-work').error).toBe('Not with a broken bone; it has 43 days yet to mend.');
    expect(sim.now).toBe(t0);
    dials(sim); // TEST SETUP
    expect(hourOf(sim, 'sense-memory').ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// practice.self_tape
// ---------------------------------------------------------------------------

describe('practice.self_tape', () => {
  /** TEST SETUP: a craft mastered, every technique at mastery and every ability full, as tests/briefs.test.ts makes one. */
  const mastered = (sim: Simulation) => {
    const p = sim.player;
    p.craft = evenCraft(MASTERED);
    for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft[k] = 100;
    p.attrs = { presence: 100, composure: 100, listening: 100, imagination: 100, focus: 100, adaptability: 100, discipline: 100 };
    p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
  };
  const go = <T,>(sim: Simulation, kind: string, payload: Record<string, unknown>) => { kept(sim); const r = say<T>(sim, kind, payload); expect(r.ok, `${kind}: ${r.error}`).toBe(true); return r.value!; };
  const bonds = (sim: Simulation) => sim.player.school!.classmates.map((m) => m.bond ?? 0);
  const trusts = (sim: Simulation) => sim.player.school!.classmates.map((m) => trustOf(m));

  /** Sunday 6 September: brief-comedy chosen, read with a reader, prepared six rounds, comedy studied four times. */
  const comedy = (mate: number | 'alone') => {
    const sim = life('g20-tape');
    tended(sim, at(2026, 9, 6, 8));
    mastered(sim);
    const b = BRIEF_BY_ID['brief-comedy']!;
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    expect(go<{ reader: string }>(sim, 'brief.reader', { brief: b.id, mate }).reader).toBe(mate === 'alone' ? 'A Recording' : 'Maya Kim');
    for (let i = 0; i < 6; i += 1) for (const step of ['read', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: b.id, step });
    for (let i = 0; i < 4; i += 1) go(sim, 'genre.study', { genre: 'comedy' });
    return { sim, b };
  };

  it('PLAYER JOURNEY: a classmate reading a camera brief with her, the take together Strong, her bond rises by 1, the rule’s own, and nobody else’s; the twin taped with the recording moves no bond; the callback it earned, played as its note asks, is answered and ends, across a save and a load', () => {
    const { sim, b } = comedy(0);
    const rec = recordOf(sim.player, b.id);
    // She learned it with her: a classmate who rehearsed it has some of it.
    expect(rec.reader).toEqual({ mate: 0, prep: expect.any(Number) });
    expect(rec.reader!.prep).toBeGreaterThan(0);
    const bond0 = bonds(sim), trust0 = trusts(sim);
    const screen0 = sim.player.craft!.screen, comedy0 = sim.player.craft!.comedy;
    const taken = go<{ purpose: string; band: string }>(sim, 'practice.self_tape', { genre: 'comedy', brief: b.id });
    expect(taken.purpose).toBe('first');
    const take = rec.takes.at(-1)!;
    expect(take.together).toMatchObject({ reader: 'Maya Kim' });
    // Strong from 65, the evaluation's band (LAMDA's Merit); and Maya held her lines.
    expect(take.together!.overall).toBeGreaterThanOrEqual(65);
    expect(take.together!.slip).toBeUndefined();
    // TOGETHER_BOND, 1, as a player with no trait warms (`bondWarmth` 1); trust moves only for a slip covered, and none was.
    expect(bonds(sim).map((x, i) => x - bond0[i]!)).toEqual(bond0.map((_, i) => (i === 0 ? 1 : 0)));
    expect(trusts(sim)).toEqual(trust0);
    // The camera's technique and the one the scene stages, grown as it's taped, each on the history.
    const taped = historyOf(sim).filter((e) => e.source === 'self-tape');
    expect(taped.map((e) => e.id)).toEqual(['screen', 'comedy']);
    // The history keeps each change to three places.
    const r3 = (x: number) => Math.round(x * 1000) / 1000;
    expect([r3(sim.player.craft!.screen - screen0), r3(sim.player.craft!.comedy - comedy0)]).toEqual([taped[0]!.delta, taped[1]!.delta]);
    expect(taped.every((e) => e.delta > 0)).toBe(true);

    // The twin, the same in all but the reader: the recording reads with her, and nobody's bond moves.
    const twin = comedy('alone');
    const twinBonds = bonds(twin.sim);
    go(twin.sim, 'practice.self_tape', { genre: 'comedy', brief: b.id });
    expect(recordOf(twin.sim.player, b.id).takes.at(-1)!.together).toMatchObject({ reader: 'A Recording' });
    expect(bonds(twin.sim)).toEqual(twinBonds);

    // The callback: a harder pitch, its note on one side of an axis the brief doesn't settle. Played that way, answered.
    const cb = rec.callback!;
    expect(cb).toBeDefined();
    expect(b.allows?.[cb.axis]).toBeUndefined();
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id, [cb.axis]: cb.side });
    for (let i = 0; i < 3; i += 1) go(sim, 'brief.prepare', { brief: b.id, step: 'rehearse' });
    expect(go<{ purpose: string }>(sim, 'practice.self_tape', { genre: 'comedy', brief: b.id }).purpose).toBe('callback');
    expect(rec.takes.at(-1)!).toMatchObject({ callback: { axis: cb.axis, side: cb.side }, answered: true });
    expect(rec.callback).toBeUndefined();
    const back = reload(sim);
    expect(recordOf(back.player, b.id).callback).toBeUndefined();
    expect(recordOf(back.player, b.id).takes.map((t) => t.purpose)).toEqual(['first', 'callback']);
  });

  it('PLAYER JOURNEY: taped unprepared on Sunday morning with Maya reading, she slips in the third beat and the mastered student covers it all: Maya’s trust rises by 2, the rule’s own, and nobody’s bond moves, the take together under Strong', () => {
    const sim = life('g20-tape');
    tended(sim, at(2026, 9, 6, 8));
    mastered(sim);
    const b = BRIEF_BY_ID['brief-comedy']!;
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    go(sim, 'brief.reader', { brief: b.id, mate: 0 });
    const bond0 = bonds(sim), trust0 = trusts(sim);
    go(sim, 'practice.self_tape', { genre: 'comedy', brief: b.id });
    const together = recordOf(sim.player, b.id).takes.at(-1)!.together!;
    expect(together.reader).toBe('Maya Kim');
    // Covered in full: listening and adaptability at their full, a mastered student's.
    expect(together.slip).toEqual({ at: 'Beat 3', by: expect.any(Number), covered: 1 });
    expect(together.overall).toBeLessThan(65);
    // TOGETHER_COVERED, 2, to Maya alone; a take together under Strong warms nobody.
    expect(trusts(sim).map((x, i) => x - trust0[i]!)).toEqual(trust0.map((_, i) => (i === 0 ? 2 : 0)));
    expect(bonds(sim)).toEqual(bond0);
  });

  it('PLAYER JOURNEY: a voice brief taped grows voiceover twice under self-tape, the medium’s and the technique it stages, and leaves screen; a camera brief grows screen and the technique it stages', () => {
    const sim = life('g20-voice');
    tended(sim, at(2026, 9, 6, 8));
    const doc = BRIEF_BY_ID['brief-documentary']!;
    go(sim, 'brief.choose', { brief: doc.id, reading: doc.readings[0]!.id });
    const c0 = { ...sim.player.craft! };
    go(sim, 'practice.self_tape', { genre: 'documentary', brief: doc.id });
    const voice = historyOf(sim).filter((e) => e.source === 'self-tape');
    expect(voice.map((e) => e.id)).toEqual(['voiceover', 'voiceover']);
    // The medium's at half an hour's weight, then the technique's at a quarter: the second the smaller, and each kept on
    // the history to three places, so the two come within a thousandth of the rise.
    expect(voice.every((e) => e.delta > 0) && voice[1]!.delta < voice[0]!.delta).toBe(true);
    expect(Math.abs(sim.player.craft!.voiceover - c0.voiceover - (voice[0]!.delta + voice[1]!.delta))).toBeLessThanOrEqual(0.001);
    expect(sim.player.craft!.screen).toBe(c0.screen);
    const comedy = BRIEF_BY_ID['brief-comedy']!;
    go(sim, 'brief.choose', { brief: comedy.id, reading: comedy.readings[0]!.id });
    const c1 = { ...sim.player.craft! };
    go(sim, 'practice.self_tape', { genre: 'comedy', brief: comedy.id });
    const camera = historyOf(sim).filter((e) => e.source === 'self-tape').slice(2);
    expect(camera.map((e) => e.id)).toEqual(['screen', 'comedy']);
    const r3 = (x: number) => Math.round(x * 1000) / 1000;
    expect([r3(sim.player.craft!.screen - c1.screen), r3(sim.player.craft!.comedy - c1.comedy)]).toEqual([camera[0]!.delta, camera[1]!.delta]);
    expect(camera.every((e) => e.delta > 0)).toBe(true);
    expect(sim.player.craft!.voiceover).toBe(c1.voiceover);
  });

  it('PLAYER JOURNEY: one take of brief-drama, with no study, gives drama practice 10 (a tenth of what’s left, of 100), and the first read of a scene from Trifles moves 1 + 10/600 of an untaped twin’s', () => {
    const ada = life('g20-genre-2'), twin = life('g20-genre-2');
    for (const one of [ada, twin]) one.advanceTo(at(2026, 9, 5, 16, 5));
    const drama = BRIEF_BY_ID['brief-drama']!;
    dials(ada); // TEST SETUP
    ada.must({ kind: 'brief.choose', payload: { brief: drama.id, reading: drama.readings[0]!.id } });
    dials(ada); // TEST SETUP
    expect(say(ada, 'practice.self_tape', { genre: 'drama', brief: drama.id }).ok).toBe(true);
    expect(ada.player.engagement!.byGenre.drama).toMatchObject({ familiarity: 0, practice: 10 });
    expect(twin.player.engagement?.byGenre.drama).toBeUndefined();
    expect(sceneRead(ada) / sceneRead(twin)).toBeCloseTo(1 + 10 / 600, 9);
  });
});

/**
 * Read The Scene on her first scene for class at five past seven on Saturday 5 September 2026 (on g20-genre-2, from
 * Trifles, a mystery and a drama), its readiness set alike: how far the step moved the scene.
 */
function sceneRead(sim: Simulation): number {
  sim.advanceTo(at(2026, 9, 5, 19, 5));
  dials(sim); // TEST SETUP
  const a = courseworkOf(sim, sim.player)!.assignments[0]!;
  expect([a.template, a.sceneId, a.prep.familiarity]).toEqual(['scene-study', 'trifles', 0]);
  const r = say<{ moved: number; dim: string }>(sim, 'school.prepare', { assignmentId: a.id, activity: 'read' });
  expect(r.ok, r.error).toBe(true);
  expect(r.value!.dim).toBe('familiarity');
  return r.value!.moved;
}

// ---------------------------------------------------------------------------
// genre.study
// ---------------------------------------------------------------------------

describe('genre.study', () => {
  /** Two studies the same day: 100 × 0.08 = 8, then half of it on what's left, 4 × 0.92 = 3.68, to 11.68. */
  const FAMILIAR = 11.68;
  /** Studies of a genre through the command, each coming to the familiarity worked out for it. */
  const studies = (sim: Simulation, genre: string, to: readonly number[]) => {
    for (const each of to) {
      dials(sim); // TEST SETUP
      const r = say<{ familiarity: number }>(sim, 'genre.study', { genre });
      expect(r.ok, r.error).toBe(true);
      expect(r.value!.familiarity).toBe(each);
    }
  };
  const studyTwice = (sim: Simulation, genre: string) => studies(sim, genre, [8, FAMILIAR]);

  it('PLAYER JOURNEY: two studies of drama the same day come to 8 and then 11.68, and the first read of a scene from Trifles moves 1 + 11.68/600 of a twin’s who didn’t study; after a save and a load a third that day adds a quarter of the first’s on what’s left', () => {
    const ada = life('g20-genre-2'), twin = life('g20-genre-2');
    for (const one of [ada, twin]) one.advanceTo(at(2026, 9, 5, 16, 5));
    studyTwice(ada, 'drama');
    expect(twin.player.engagement?.byGenre.drama).toBeUndefined();
    expect(sceneRead(ada) / sceneRead(twin)).toBeCloseTo(1 + FAMILIAR / 600, 9);
    // The day's count survives a reload: 2 × (1 − 0.1168) = 1.7664 more, to 13.45 at two places.
    const back = reload(ada);
    dials(back); // TEST SETUP
    expect(say<{ familiarity: number }>(back, 'genre.study', { genre: 'drama' }).value!.familiarity).toBe(13.45);
  });

  /**
   * Found by this pass: a scene's play was matched to the plays the game knows by kind by its exact title
   * (`genresOfPlay`, content/plays.ts), and four scenes spell theirs with a small "of", "for" or "to" where the play
   * lists spell it with a capital: Riders to the Sea, The Importance of Being Earnest, The Playboy of the Western World
   * and Measure for Measure. Until the titles were compared without their case on 2026-10-13, their kinds were never
   * found, so a study of their genre sped nothing in them. Riders to
   * the Sea was set in the first fall on every one of fifty-two seeds played; on g20-riders-6, on Wednesday 9 September,
   * after Suppressed Desires. Its material met in that scene already speeds it 1.0278 (`featureSpeed`), the better of the
   * two being taken, so the studies here go past it: two a day for two days come to 22 (8, 11.68, then 8 × 0.8832 and
   * 4 × 0.8125 more), and for three to 31.11 (6.24 and 2.8704 more), each a speed of 1 + familiarity/600 above 1.0278.
   */
  it('PLAYER JOURNEY: a scene for class from Riders to the Sea, which the game knows as a tragedy, is sped by studies of tragedy as Trifles is by drama: the first read after three days’ studies moves (1 + 31.11/600) ÷ (1 + 22/600) of one after two days’, and one after two days’ more than a twin’s who didn’t study', () => {
    const DAYS = [[8, FAMILIAR], [18.75, 22], [28.24, 31.11]] as const;
    const read = (days: number) => {
      const sim = life('g20-riders-6');
      for (let d = 0; d < 3; d += 1) {
        tended(sim, at(2026, 9, 9 + d, 18));
        if (d < days) studies(sim, 'tragedy', DAYS[d]!);
      }
      sim.advanceTo(at(2026, 9, 11, 21));
      const a = courseworkOf(sim, sim.player)!.assignments.find((x) => x.sceneId === 'riders-sea')!;
      expect([a.template, a.setOn, a.prep.familiarity]).toEqual(['scene-study', '2026-09-09', 0]);
      dials(sim); // TEST SETUP
      const r = say<{ moved: number; dim: string }>(sim, 'school.prepare', { assignmentId: a.id, activity: 'read' });
      expect(r.ok, r.error).toBe(true);
      expect(r.value!.dim).toBe('familiarity');
      return r.value!.moved;
    };
    const [none, two, three] = [read(0), read(2), read(3)];
    expect(three / two).toBeCloseTo((1 + 31.11 / 600) / (1 + 22 / 600), 9);
    expect(two).toBeGreaterThan(none);
  });

  it('finds the kinds of every scene’s play the lists know, whatever the case of its small words, and The Proposal’s as A Marriage Proposal’s', () => {
    // The four scenes the pass found, and Chekhov’s one act, which the scene calls The Proposal (tr. Julius West).
    expect(genresOfPlay(sceneById('riders-sea')!.play)).toEqual(['tragedy']);
    for (const id of ['earnest-2', 'playboy-3', 'measure-2-4']) expect(genresOfPlay(sceneById(id)!.play), id).toBeDefined();
    expect(sceneById('proposal')!.play).toBe('The Proposal');
    expect(genresOfPlay('The Proposal')).toEqual(['comedy', 'farce']);
  });

  it('PLAYER JOURNEY: in the Summer Cabaret’s company, two studies of comedy speed A Marriage Proposal’s lines through Learn The Part by 1 + 11.68/600 of a twin’s who didn’t study', () => {
    const lines = (study: boolean) => {
      const sim = life('g20-summer');
      tended(sim, at(2027, 3, 20));
      sim.player.school!.standing = 'good'; // TEST SETUP: good standing, which the company asks.
      sim.must({ kind: 'school.summer_cabaret', payload: {} });
      expect(sim.player.school!.summer!.shows![0]!.play).toBe('A Marriage Proposal');
      sim.advanceTo(at(2027, 3, 21, 10));
      if (study) studyTwice(sim, 'comedy');
      sim.advanceTo(at(2027, 3, 21, 13));
      dials(sim); // TEST SETUP
      const show = sim.player.school!.summer!.shows![0]!;
      const r = say<{ lines: number }>(sim, 'school.learn_part', { which: 'summer' });
      expect(r.ok, r.error).toBe(true);
      expect(processOf(show).lines).toBe(r.value!.lines);
      return r.value!.lines;
    };
    expect(lines(true) / lines(false)).toBeCloseTo(1 + FAMILIAR / 600, 9);
  });
});

// ---------------------------------------------------------------------------
// school.term
// ---------------------------------------------------------------------------

describe('school.term', () => {
  it('PLAYER JOURNEY: the second fall’s start begins the year’s work-study again: elective hours to nothing, the hours owed carried and paid with the first Saturday’s, 10 × $23, and the class weeks’ Saturdays booked again from 6 hours, the same across a save and a load', () => {
    const sim = life('g20-term');
    tended(sim, at(2027, 8, 23, 8));
    const school = sim.player.school!;
    expect(school.termsBegun).toBe(2);
    // The first year's Saturdays booked: 24 of them, 144 of the 150 assigned hours.
    expect(school.workStudy.assignedBooked).toBe(144);
    // TEST SETUP: two elective evenings asked for and one worked and not yet paid, four hours, as a spring's last week
    // could leave them; a passive year leaves none.
    school.workStudy.electiveHours = 8;
    school.workStudy.owedHours = 4;
    tended(sim, at(2027, 8, 23, 10));
    expect(school.termsBegun).toBe(3);
    expect(school.workStudy).toEqual({ electiveHours: 0, owedHours: 4 });
    const twin = reload(sim);
    const saturdays = (one: Simulation) => one.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && i.payload.personId === one.player.id && i.at >= at(2027, 8, 23, 0))
      .sort((a, b) => a.at - b.at).map((i) => [fmt(i.at), i.status, i.payload.elective]);
    for (const one of [sim, twin]) {
      // Classes from Monday 30 August; the Sunday before books the week's Saturday, 4 September at ten.
      tended(one, at(2027, 9, 4, 9));
      expect(saturdays(one)).toEqual([['2027-9-4 10:00', 'pending', false]]);
      expect(one.player.school!.workStudy.assignedBooked).toBe(6);
      tended(one, at(2027, 9, 11, 9));
      expect(saturdays(one)).toEqual([['2027-9-4 10:00', 'done', false], ['2027-9-11 10:00', 'pending', false]]);
      expect(one.player.school!.workStudy).toEqual({ electiveHours: 0, owedHours: 0, assignedBooked: 12 });
      // Paid the Friday after, 10 September at five: the four carried and the Saturday's six, at $23 an hour.
      const pay = one.universe.transactions.filter((t) => t.memo.startsWith('Work-study wages') && t.at >= at(2027, 8, 23, 0));
      expect(pay.map((t) => [fmt(t.at), t.memo])).toEqual([['2027-9-10 17:00', 'Work-study wages, 10 hours: David Geffen School of Drama at Yale University']]);
      expect(pay[0]!.postings.find((p) => one.universe.accounts[p.accountId]!.name === 'Wages')!.amount).toBe(-230_00);
    }
  });

  it('PLAYER JOURNEY: the second fall’s casting, reached in order by the clock, numbers every rehearsal call it books from 1 to the last, the read-through first and the technical and the dress last', () => {
    const sim = life('g20-term');
    tended(sim, at(2027, 8, 23, 10));
    const school = sim.player.school!;
    expect(school.casting).toMatchObject({ production: 'Directors’ Thesis Production I', play: 'Ghosts', role: 'Mrs. Alving', size: 'lead', term: 2 });
    const calls = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.personId === sim.player.id && i.payload.which !== 'rep').sort((a, b) => a.at - b.at);
    const rehearsals = calls.filter((c) => c.payload.call === 'rehearsal');
    expect(rehearsals).toHaveLength(20);
    expect(rehearsals.map((c) => [c.payload.n, c.payload.of])).toEqual(rehearsals.map((_, i) => [i + 1, 20]));
    expect(rehearsals.map((c) => c.payload.stage)).toEqual(['read', ...Array(7).fill('blocking'), ...Array(10).fill('work'), 'tech', 'dress']);
    expect(calls.filter((c) => c.payload.call === 'performance')).toHaveLength(8);
    // Each rehearsal after the last: the calls in order.
    expect(rehearsals.every((c, i) => i === 0 || c.at > rehearsals[i - 1]!.at)).toBe(true);
  });
});
