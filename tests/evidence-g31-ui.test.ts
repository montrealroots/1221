/**
 * Evidence for seven rows the review of 2026-10-13 left partial (verification group g31-ui): the Early Riser and Night
 * Owl traits, and six parts of the Player Profile. Each gap the review named is closed here through what the player
 * does: the screen rendered as they have it and its own controls pressed, the command a control sends, or the clock;
 * and each consequence is read where the row says it's read, against figures worked out here from the rule's own
 * numbers, never asked of the helper the engine computes them with.
 *
 * - `trait-morning-evening`: Early Riser's morning 1.1 and evening 0.88, Night Owl's the other way round, each bent
 *   inside the knob's limits [0.8, 1.2] in log terms (`exp(L·tanh(ln v / L))`, L = ln 1.2 above 1 and ln 1.25 below,
 *   worked here by hand): 1.1 is 1.09142 and 0.88 is 0.89095. An hour of Speech Drill at 8:30 AM grows an early riser's
 *   speech 1.09142 times a plain twin's and a night owl's 0.89095 times, at 2 PM all three alike, at 7 PM the other way
 *   round; the first Monday's nine o'clock classes, met by the clock, grow every skill they train by the same factors;
 *   and judged work reads the hour too (`conditionAt`, which the row didn't name): a brief taped at 7 PM is judged at
 *   readiness times the hour's fit, the night owl's take the best of the three and the early riser's the worst, where
 *   at 2 PM all three takes are judged alike.
 * - `p-identity`: every value the Identity And Background panel prints, for a life made with a middle name, a name
 *   called by, a background and a race and ethnicity given; and each changed by what the character was made with (the
 *   name called by it, billed as an actor, born in London, a birthday a week into the term the clock moves the age past,
 *   a portrait), by a year of the clock (the age, the school year and the standing the faculty gave), and by nothing
 *   else: a save and a reload show the same.
 * - `p-identity-buttons`: Money, $505,434 at the start (the wealthy profile's 85,000 € and 380,000 € at SLATE's 0.92
 *   to the dollar, $92,391 and $413,043, as tests/evidence-g29-ui.test.ts works them), the checking and the savings
 *   summed here from their postings; $200 from the ATM takes it to $505,234; Papers, Covered for a Yale student, and
 *   Papers, No Health Cover once she has withdrawn by the fifteenth day of classes, across a reload. Each pressed opens
 *   its screen; in a guided life each opens that screen as Locked until its chapter is read.
 * - `p-traits-line`: the seven dispositions as made, with what each does, and two of those words checked on the same
 *   screen against their rules (composure starts at 25 + 0.35 a point of stability, discipline at 30 + 0.5 a point of
 *   conscientiousness); a changed disposition changes the line; and Risk Tolerance’s words are what creation did: “over
 *   65, so the card’s autopay started on the minimum” at 70, and “65 or under, so the card’s autopay started on the
 *   whole statement” at 65 and 50. Until 2026-10-13 the line said the rule at every figure, “over 65, the card’s
 *   autopay starts on the minimum”, and this held it at 65.
 * - `p-abilities`: Circles Of Attention opened from Focus's row and an hour pressed: the hour spent, Focus up by the
 *   toast's gain, Now and Last Change and the subtitle's hours said again, discipline's day kept, across a reload;
 *   the Tier select pressed to Foundation and to Advanced, giving 0.75 and 0.8 of the matched hour (`TIER`) and the
 *   Advanced hour costing 3 more energy; Today said under fatigue at 7 PM for each dimension in which some task reads
 *   the ability and lists fatigue (until 2026-10-13, every dimension it shapes but interpretation, which named
 *   Emotional Depth’s connection, read only in partnered work, where it lists none), with the night owl’s and the early
 *   riser's readiness at the hour's fit, and nothing said at 8 AM; and Stamina's row: a workout refused in its words
 *   during orientation, falling 0.18 a day, and held three days after a run.
 * - `p-techniques`: the seventeen rows' Now, Classes Reach (each skill as admitted and 26 points more, as the guide
 *   says) and how far to 90; Speech Drill pressed from its row, Now up and To Go down by the gain and the reach held;
 *   and Scene Study at 89.95, which reads 90.0 with 0.0 To Go and isn't mastered, an hour of Scene Work pressed from
 *   its row taking it past 90 to Yes.
 * - `p-genres`: the search, every Show filter and the paging, sixteen at a time to the 149th; Study It pressed, its
 *   familiarity 8.0 (100 × 0.08) in its row; the genre to study said both ways, "the one you love and know least"
 *   before any part and "the kind your next part's play is" once the clock casts her in Major Barbara, each changed
 *   by a study; and Open Its Brief pressed, the pane's Tape It refused before a reading, Read It This Way and Tape It
 *   pressed, the take kept once and the genre's practice 10.0 (100 × 0.1) in its row across a reload, and Tape It
 *   refused by the clock half an hour before orientation.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity, which `newLifeConfig` leaves empty and `createSave` refuses empty), an actress at Yale in New
 * Haven, starting Monday 24 August 2026 at 7:30 AM with orientation's first session at 10 AM; played by the clock
 * and the commands, and on the Profile by its own controls. One life is born in London to show a citizenship New York
 * doesn't. The trait twins are made from one seed and differ only in the trait, and on the first day nothing has slept
 * yet, so their dials are the same to the last digit. The screen is the game's own ProfileWorkspace, and the router
 * the shell opens a screen with, rendered with react-dom/server: `useGame`'s `run` is the save's own `execute`, a
 * toast and a navigation are kept for the test to read, and a control pressed is the component's own onClick or
 * onChange, kept on its way through the JSX runtime. What it set is applied as React applies a state on the next
 * render: by the place its useState holds in render order.
 *
 * TEST SETUP, said again where it's done: the dials set the same in every twin before a class a week in, since the
 * week's nights read each trait's sleep quality; and Scene Study set at 89.95, where no new student stands.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { instantFromZoned, MS_DAY } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CHAPTERS } from '@/engine/content/tutorial';
import { FILM_GENRES } from '@/engine/content/film-genres';
import { developmentOf } from '@/engine/systems/attributes';
import { readiness } from '@/engine/systems/life';
import { studyRefusal } from '@/engine/systems/engagement';
import { BRIEF_BY_ID } from '@/engine/content/briefs';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** Each useState's place in render order, and what it started at in the last render. */
  calls: 0,
  inits: [] as unknown[],
  /** What a press set, by its useState's place in render order, applied as React would on the next render. */
  given: new Map<number, unknown>(),
  sets: [] as { at: number; action: unknown }[],
  /**
   * The buttons, selects and inputs the screen drew, with their own props, in the order they were made: a plain one when
   * the component holding it renders, one inside a component (Gated, Open) when that component renders, after.
   */
  elements: [] as { type: string; props: Record<string, unknown>; text: string }[],
  toasts: [] as { message: string; tone?: string }[],
  navigated: [] as unknown[][],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value] = real.useState(initial);
    const at = h.calls++;
    h.inits.push(value);
    const set = (action: unknown) => { h.sets.push({ at, action }); };
    return [h.given.has(at) ? h.given.get(at) : value, set];
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

// Without the original: it imports the looks, which import it back.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string, tone?: string) => { h.toasts.push({ message, ...(tone ? { tone } : {}) }); },
    navigate: (...a: unknown[]) => { h.navigated.push(a); },
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

// A screen's kept tab: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});

const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');

// ---------------------------------------------------------------------------
// Lives, and the screen over them
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 12, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const MS_HOUR = 3_600_000;
const ada = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const life = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation => createSave(1, seed, ada(extra));
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const one = (x: number) => x.toFixed(1);

/** What the player reads: the markup with every tag taken out and its entities read. */
const onScreen = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
/** A run of inline text as it reads: its tags taken out with nothing put in their place. */
const inline = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

/** A new screen: no state carried over from another life's. */
function fresh(): void { h.given = new Map(); h.sets = []; h.toasts = []; h.navigated = []; }
/** The Player Profile over a save, as markup, with every state a press set applied. */
function profile(sim: Simulation): string {
  h.sim = sim; h.calls = 0; h.inits = []; h.sets = []; h.elements = [];
  return renderToStaticMarkup(createElement(ProfileWorkspace));
}
/** A screen by its route, as the shell's router opens it: the screen, or Locked where its chapter isn't read. */
function screenAt(sim: Simulation, route: string): string {
  h.sim = sim; h.calls = 0; h.inits = []; h.sets = []; h.elements = [];
  const saved = h.given;
  h.given = new Map();
  try { return onScreen(renderToStaticMarkup(createElement(WorkspaceRouter, { route }))); } finally { h.given = saved; }
}
/** What the last press set, applied as React would before the next render: by its useState's place. */
function settle(): void {
  for (const { at: i, action } of h.sets) {
    const was = h.given.has(i) ? h.given.get(i) : h.inits[i];
    h.given.set(i, typeof action === 'function' ? (action as (x: unknown) => unknown)(was) : action);
  }
  h.sets = [];
}
/** The control the screen drew, by its words, the first after another (an anchor) where one is given. */
function control(text: string | RegExp, after?: (e: (typeof h.elements)[number]) => boolean): (typeof h.elements)[number] {
  const from = after ? h.elements.findIndex(after) : -1;
  if (after) expect(from, 'the anchor is drawn').toBeGreaterThanOrEqual(0);
  const found = h.elements.slice(from + 1).find((e) => e.type === 'button' && (typeof text === 'string' ? e.text === text : text.test(e.text)));
  expect(found, `${String(text)} is drawn`).toBeDefined();
  return found!;
}
/** A control pressed as the player presses it, enabled, and what it set applied. */
function press(text: string | RegExp, after?: (e: (typeof h.elements)[number]) => boolean): void {
  const b = control(text, after);
  expect(b.props.disabled, `${String(text)} isn't refused`).toBeFalsy();
  (b.props.onClick as () => void)();
  settle();
}
/** A select or an input changed as the player changes it, and what it set applied. */
function change(which: (e: (typeof h.elements)[number]) => boolean, value: string): void {
  const e = h.elements.find(which);
  expect(e, 'the field is drawn').toBeDefined();
  (e!.props.onChange as (x: unknown) => void)({ target: { value } });
  settle();
}
const findGenre = (e: (typeof h.elements)[number]) => e.type === 'input' && e.props.id === 'genres-find';
const showGenres = (e: (typeof h.elements)[number]) => e.type === 'select' && e.props.id === 'genres-show';
/** A genre's name in the table, under the search box: the anchor for its row's own controls. */
const listed = (name: string) => (e: (typeof h.elements)[number]) => e.type === 'button' && e.text === name && h.elements.indexOf(e) > h.elements.findIndex(findGenre);

/** The part of the Profile between one panel's title and the next's. */
function panel(html: string, title: string, next?: string): string {
  const from = html.indexOf(`>${title}<`);
  expect(from, title).toBeGreaterThanOrEqual(0);
  const to = next ? html.indexOf(`>${next}<`, from) : html.length;
  return html.slice(from, to > from ? to : html.length);
}
/** A table's rows as the player reads them: each cell's words, a comma kept against the word before it. */
const rowsOf = (html: string): string[][] => [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1]!.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => onScreen(c[1]!).replace(/ ,/g, ',').trim()));
const rowOf = (html: string, name: string): string[] => {
  const r = rowsOf(html).find((x) => x[0] === name || x[0]!.startsWith(`${name},`));
  expect(r, `${name}'s row`).toBeDefined();
  return r!;
};
const abilities = (html: string) => panel(html, 'Attributes And Craft', 'Techniques');
const techniques = (html: string) => panel(html, 'Techniques', 'Genres');
const genres = (html: string) => panel(html, 'Genres', 'Current Condition');
const identity = (html: string) => onScreen(panel(html, 'Identity And Background', 'Attributes And Craft'));

// ---------------------------------------------------------------------------
// trait-morning-evening
// ---------------------------------------------------------------------------

/**
 * The knob, worked by hand: 1.1 bent inside [0.8, 1.2] is exp(ln 1.2 · tanh(ln 1.1 / ln 1.2)) = exp(0.18232 · 0.47988)
 * = 1.09142; 0.88 is exp(−ln 1.25 · tanh(ln 0.88 / −ln 1.25)) = exp(−0.22314 · 0.51745) = 0.89095.
 */
const SHARP = 1.09142;
const FLAT = 0.89095;
const TWINS = [['early_riser'], [], ['night_owl']] as const;

describe('trait-morning-evening', () => {
  it('PLAYER JOURNEY: an hour of Speech Drill grows an early riser 1.09142 times a plain twin at 8:30 AM and a night owl 0.89095 times; at 2 PM alike; at 7 PM the other way round', () => {
    const hours = [[8, 30, SHARP, FLAT], [14, 0, 1, 1], [19, 0, FLAT, SHARP]] as const;
    for (const [hour, minute, early, owl] of hours) {
      const lives = TWINS.map((traits) => { const sim = life('g31-hour', { personalityTraits: [...traits] }); sim.advanceTo(at(2026, 8, 24, hour, minute)); return sim; });
      const plain = lives[1]!;
      // Matched: the same first day lived to the minute, nothing slept yet, so the dials and the skill are the same.
      for (const twin of lives) {
        expect(twin.player.wellbeing).toEqual(plain.player.wellbeing);
        expect(twin.player.craft!.speech).toBe(plain.player.craft!.speech);
      }
      const gained = lives.map((sim) => {
        const before = sim.player.craft!.speech;
        const r = sim.must<{ gained: number }>({ kind: 'practice.exercise', payload: { exercise: 'speech-drill' } });
        // The craft grown is what the hour said it grew, kept on the development history under the exercise.
        expect(sim.player.craft!.speech - before).toBeCloseTo(r.gained, 10);
        // At full precision from 2026-10-17 (brief 11, A5: `recordDevelopment`); to a thousandth until then.
        expect(developmentOf(sim.player).history.find((x) => x.id === 'speech')).toMatchObject({ source: 'practice:speech-drill', delta: r.gained });
        return r.gained;
      });
      expect(gained[0]! / gained[1]!, `${hour}:${minute}, early`).toBeCloseTo(early, 4);
      expect(gained[2]! / gained[1]!, `${hour}:${minute}, owl`).toBeCloseTo(owl, 4);
    }
  });

  it('PLAYER JOURNEY: the first Monday’s nine o’clock classes, met by the clock, grow every skill they train 1.09142 times for an early riser and 0.89095 times for a night owl', () => {
    const grown = TWINS.map((traits) => {
      const sim = life('g31-class', { personalityTraits: [...traits] });
      sim.advanceTo(at(2026, 8, 31, 8, 50));
      // TEST SETUP: the dials set the same in every twin: the week's nights read each trait's sleep quality, so they
      // differ by Monday, and the class is what's measured.
      Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 70, morale: 60, hygiene: 80, condition: 88 });
      const before = { ...sim.player.craft! };
      expect(sim.universe.scheduled.some((i) => i.kind === 'school.classes' && i.status === 'pending' && i.at === at(2026, 8, 31, 9))).toBe(true);
      sim.advanceTo(at(2026, 8, 31, 9, 5));
      const after = sim.player.craft!;
      return { before, grew: Object.fromEntries(Object.entries(after).map(([k, v]) => [k, v - before[k as keyof typeof before]]).filter(([, d]) => (d as number) > 0)) as Record<string, number> };
    });
    const [early, plain, owl] = grown;
    // The same skills, from the same levels, so the class's own weights are the same in every twin.
    expect(early!.before).toEqual(plain!.before);
    expect(owl!.before).toEqual(plain!.before);
    const skills = Object.keys(plain!.grew);
    expect(skills.length).toBeGreaterThan(0);
    expect(Object.keys(early!.grew).sort()).toEqual([...skills].sort());
    for (const k of skills) {
      expect(early!.grew[k]! / plain!.grew[k]!, k).toBeCloseTo(SHARP, 3);
      expect(owl!.grew[k]! / plain!.grew[k]!, k).toBeCloseTo(FLAT, 3);
    }
  });

  it('PLAYER JOURNEY: a brief taped at 7 PM is judged at readiness times the hour’s fit, the night owl’s take best and the early riser’s worst; at 2 PM all three are judged alike', () => {
    const b = BRIEF_BY_ID['brief-drama']!;
    const taped = (hour: number) => TWINS.map((traits) => {
      const sim = life('g31-tape', { personalityTraits: [...traits] });
      sim.must({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id } });
      sim.advanceTo(at(2026, 8, 24, hour));
      const r = sim.must<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: 'drama', brief: b.id } });
      const work = sim.player.work!.at(-1)!;
      expect(work.overall).toBe(r.overall);
      return { overall: r.overall, readiness: work.inputs.condition.readiness };
    });
    const evening = taped(19);
    const [early, plain, owl] = evening;
    // Under 60, sufficient readiness (`EVALUATION.sufficientReadiness`), where the hour's fit reaches the result.
    expect(plain!.readiness).toBeLessThan(60);
    expect(early!.readiness / plain!.readiness).toBeCloseTo(FLAT, 4);
    expect(owl!.readiness / plain!.readiness).toBeCloseTo(SHARP, 4);
    expect(owl!.overall).toBeGreaterThan(plain!.overall);
    expect(plain!.overall).toBeGreaterThan(early!.overall);
    // The falsifiability test: at 2 PM nobody's hour, the same take for all three.
    const afternoon = taped(14);
    for (const t of afternoon) expect(t).toEqual(afternoon[1]);
  });
});

// ---------------------------------------------------------------------------
// p-identity
// ---------------------------------------------------------------------------

describe('p-identity', () => {
  const made = { middleName: 'May', displayName: 'Addie', performerTitle: 'actress', background: 'Grew up backstage.', raceEthnicity: ['black', 'hispanic'], raceEthnicityOwn: 'Dominican' } as Partial<NewSaveConfig>;

  it('shows the name and the name called by, pronouns and billing, age and birth date, home and citizenship, school, the city lived in, background and race and ethnicity, as made', () => {
    fresh();
    const sim = life('g31-identity', made);
    const html = profile(sim);
    const shown = identity(html);
    expect(html).toContain('<h1>Addie</h1>');
    expect(shown).toContain('No portrait chosen');
    expect(shown).toContain('Full Name Ada May Cole Called Addie');
    expect(shown).toContain('Pronouns she/her Billed as an actress');
    // Born 14 June 2002 (newLifeConfig's), on Monday 24 August 2026: twenty-four.
    expect(shown).toContain('Age 24 Born June 14, 2002');
    expect(shown).toContain('From New York A citizen of the United States');
    // The class entering in 2026 graduates in 2029, after three years; nothing judged yet, in good standing.
    expect(shown).toContain('School Year 1 Class of 2029, good standing');
    expect(shown).toContain('Living In New Haven');
    expect(shown).toContain('In their own words. Grew up backstage.');
    expect(shown).toContain('Race and ethnicity, as given. Black Or African, Hispanic Or Latino, Dominican.');
  });

  it('changes with what the character was made with: called by the full name, billed as an actor, born in London a week into the term, a portrait', () => {
    fresh();
    const portrait = 'data:image/png;base64,iVBORw0KGgo=';
    const sim = life('g31-identity-other', { homeRegionId: 'uk-eng-london', pronouns: 'they/them', performerTitle: 'actor', birthMonth: 8, birthDay: 30, portrait });
    const html = profile(sim);
    const shown = identity(html);
    expect(shown).toContain('Full Name Ada Cole Called by it');
    expect(shown).toContain('Pronouns they/them Billed as an actor');
    expect(shown).toContain('From London A citizen of the United Kingdom');
    expect(shown).toContain('Living In New Haven');
    // Born 30 August 2002: twenty-three on 24 August 2026, and the clock takes the age past the birthday.
    expect(shown).toContain('Age 23 Born August 30, 2002');
    expect(html).toContain(`<img src="${portrait}" alt="Ada Cole’s portrait"`);
    expect(shown).not.toContain('No portrait chosen');
    expect(shown).not.toContain('In their own words.');
    expect(shown).not.toContain('Race and ethnicity, as given.');
    sim.advanceTo(at(2026, 8, 31, 8));
    expect(identity(profile(sim))).toContain('Age 24 Born August 30, 2002');
  });

  it('PLAYER JOURNEY: a year on, the clock moves the age, the school year and the standing the faculty gave; a save and a reload show the same', () => {
    fresh();
    const sim = life('g31-identity-year', made);
    sim.advanceTo(at(2027, 9, 10, 8));
    expect(sim.player.school!.termsBegun).toBe(3);
    // Nothing prepared all year: the faculty's reviews put her on academic warning (`STANDING_LABEL.warning`).
    expect(sim.player.school!.standing).toBe('warning');
    const shown = identity(profile(sim));
    expect(shown).toContain('Age 25 Born June 14, 2002');
    expect(shown).toContain('School Year 2 Class of 2029, academic warning');
    expect(shown).toContain('Full Name Ada May Cole Called Addie');
    expect(shown).toContain('Living In New Haven');
    expect(identity(profile(reload(sim)))).toBe(shown);
  });
});

// ---------------------------------------------------------------------------
// p-identity-buttons
// ---------------------------------------------------------------------------

/** The player's open current and savings accounts at a bank, each summed here from its postings. */
function postedAt(sim: Simulation, bankId: string): number {
  const ids = Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && (a.kind === 'checking' || a.kind === 'savings') && !a.closedAt && (a as { bankId?: string }).bankId === bankId).map((a) => a.id);
  expect(ids).toHaveLength(2);
  return sim.universe.transactions.flatMap((t) => t.postings).filter((p) => ids.includes(p.accountId)).reduce((s, p) => s + p.amount, 0);
}
const dollars = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`;

describe('p-identity-buttons', () => {
  it('PLAYER JOURNEY: Money is the Chase checking and savings summed from their postings, $505,434 at the start and $505,234 after $200 from the ATM; pressed, it opens Money', () => {
    fresh();
    const sim = life('g31-money');
    const posted = postedAt(sim, 'us-chase');
    expect(posted).toBe(505_434_00);
    profile(sim);
    expect(control(/^Money, /).text).toBe(`Money, ${dollars(posted)}`);
    expect(control(/^Money, /).text).toBe('Money, $505,434');
    const r = sim.must<{ fee: number }>({ kind: 'cash.withdraw', payload: { amount: 200_00, from: 'atm' } });
    expect(r.fee).toBe(0);
    expect(postedAt(sim, 'us-chase')).toBe(505_234_00);
    profile(sim);
    expect(control(/^Money, /).text).toBe('Money, $505,234');
    press('Money, $505,234');
    expect(h.navigated).toEqual([['/workspace/bank', 'Money']]);
    const bank = screenAt(sim, '/workspace/bank');
    expect(bank).not.toContain('Money, Locked');
    expect(bank).toContain('Chase Total Checking');
  });

  it('PLAYER JOURNEY: Papers, Covered for a Yale student; withdrawn by the fifteenth day of classes, Papers, No Health Cover, across a reload; pressed, it opens Papers', () => {
    fresh();
    const sim = life('g31-papers');
    sim.advanceTo(at(2026, 8, 24, 12, 30));
    profile(sim);
    expect(control(/^Papers, /).text).toBe('Papers, Covered');
    press('Papers, Covered');
    expect(h.navigated).toEqual([['/workspace/papers', 'Papers']]);
    expect(screenAt(sim, '/workspace/papers')).not.toContain('Papers, Locked');
    const before = postedAt(sim, 'us-chase');
    const r = sim.must<{ early: boolean; refund: number }>({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(r.early).toBe(true);
    const html = profile(sim);
    expect(control(/^Papers, /).text).toBe('Papers, No Health Cover');
    expect(identity(html)).toContain('School Left Class of 2029, withdrawn');
    // The term's premium back, where Registration took it from the bank, and the Money button says so.
    expect(postedAt(sim, 'us-chase')).toBe(before + r.refund);
    expect(control(/^Money, /).text).toBe(`Money, ${dollars(before + r.refund)}`);
    profile(reload(sim));
    expect(control(/^Papers, /).text).toBe('Papers, No Health Cover');
  });

  it('PLAYER JOURNEY: in a guided life, Money and Papers pressed on the Profile open Locked screens until their chapters are read, and the screens after', () => {
    fresh();
    const sim = life('g31-guided', { tutorial: true } as Partial<NewSaveConfig>);
    const index = (feature: string) => CHAPTERS.findIndex((c) => c.opens.includes(feature));
    const profileAt = index('ui.profile');
    expect(profileAt).toBeLessThan(index('ui.papers'));
    expect(index('ui.papers')).toBeLessThan(index('ui.bank'));
    for (const c of CHAPTERS.slice(0, profileAt + 1)) sim.must({ kind: 'tutorial.read', payload: { chapterId: c.id } });
    profile(sim);
    press(/^Money, /);
    press(/^Papers, /);
    expect(h.navigated).toEqual([['/workspace/bank', 'Money'], ['/workspace/papers', 'Papers']]);
    const bank = screenAt(sim, '/workspace/bank');
    expect(bank).toContain('Money, Locked');
    expect(bank).toContain(`It opens once you read “${CHAPTERS[index('ui.bank')]!.title}” in the guide. ${CHAPTERS[index('ui.bank')]!.lead}`);
    const papers = screenAt(sim, '/workspace/papers');
    expect(papers).toContain('Papers, Locked');
    expect(papers).toContain(`It opens once you read “${CHAPTERS[index('ui.papers')]!.title}” in the guide. ${CHAPTERS[index('ui.papers')]!.lead}`);
    for (const c of CHAPTERS.slice(profileAt + 1, index('ui.bank') + 1)) sim.must({ kind: 'tutorial.read', payload: { chapterId: c.id } });
    expect(screenAt(sim, '/workspace/bank')).not.toContain('Money, Locked');
    expect(screenAt(sim, '/workspace/papers')).not.toContain('Papers, Locked');
  });
});

// ---------------------------------------------------------------------------
// p-traits-line
// ---------------------------------------------------------------------------

/** The Dispositions line as it reads. */
const dispositions = (html: string) => inline(/<strong>Dispositions\.<\/strong>([\s\S]*?)<\/p>/.exec(html)?.[1] ?? '').trim();

describe('p-traits-line', () => {
  const personality = { emotionalStability: 72, conscientiousness: 40, ambition: 60, riskTolerance: 70, extraversion: 55, openness: 30, agreeableness: 80 };

  it('lists the seven dispositions as made, each with what it does, and two of those words hold on the same screen', () => {
    fresh();
    const sim = life('g31-dispositions', { personality, personalityTraits: ['early_riser', 'even_tempered'] });
    const html = profile(sim);
    expect(dispositions(html)).toBe('Emotional Stability 72, how fast stress comes and clears, and where composure starts; Conscientiousness 40, how well a night’s sleep restores you, and where discipline starts; Ambition 60, how fast every stress comes; Risk Tolerance 70, over 65, so the card’s autopay started on the minimum; Extraversion 55, how a house watching sits with you; Openness 30, how rehearsing new work does; Agreeableness 80, how a rehearsal does.');
    // Where composure starts: 25 and 0.35 a point of stability, 50.2 at 72. Where discipline starts: 30 and half a
    // point of conscientiousness, 50.0 at 40. Each as the Attributes table shows it.
    expect(rowOf(abilities(html), 'Composure')[1]).toBe('50.2');
    expect(rowOf(abilities(html), 'Discipline')[1]).toBe('50.0');
    // The traits chosen, each a way into its look in a life with no guide.
    expect(html).toMatch(/<strong>Chosen at the start\.<\/strong>[\s\S]*?<button[^>]*class="link"[^>]*>Early Riser<\/button>[\s\S]*?<button[^>]*class="link"[^>]*>Even Tempered<\/button>/);
  });

  it('changes when a disposition is made otherwise, and Risk Tolerance does what it says: the card’s autopay on the minimum over 65, in full at 65', () => {
    fresh();
    const risky = life('g31-risk-70', { personality });
    expect(risky.player.credit!.autopay).toBe('minimum');
    const at65 = life('g31-risk-65', { personality: { ...personality, riskTolerance: 65 } });
    expect(at65.player.credit!.autopay).toBe('full');
    // What the figure did, not the rule: until 2026-10-13 the line said “over 65, the card’s autopay starts on the
    // minimum” at 65 and at 50 alike, and this held it so.
    expect(dispositions(profile(risky))).toContain('Risk Tolerance 70, over 65, so the card’s autopay started on the minimum;');
    expect(dispositions(profile(at65))).toContain('Risk Tolerance 65, 65 or under, so the card’s autopay started on the whole statement;');
    const steadier = life('g31-stability-40', { personality: { ...personality, riskTolerance: 50, emotionalStability: 40, conscientiousness: 70 } });
    const html = profile(steadier);
    expect(dispositions(html)).toContain('Emotional Stability 40, how fast stress comes');
    expect(dispositions(html)).toContain('Conscientiousness 70, how well a night’s sleep');
    expect(dispositions(html)).toContain('Risk Tolerance 50, 65 or under, so the card’s autopay started on the whole statement;');
    // 25 + 0.35 × 40 = 39.0; 30 + 0.5 × 70 = 65.0.
    expect(rowOf(abilities(html), 'Composure')[1]).toBe('39.0');
    expect(rowOf(abilities(html), 'Discipline')[1]).toBe('65.0');
    // As made, and not edited: the same after a save and a reload.
    expect(dispositions(profile(reload(steadier)))).toBe(dispositions(html));
  });
});

// ---------------------------------------------------------------------------
// p-abilities
// ---------------------------------------------------------------------------

/**
 * What fatigue reaches of each ability, task by task, as the evaluation applies it (`TASK_PROFILES`, each task’s
 * dimension by its own conditions), worked out here from the tasks: the dimensions in which some task reads the
 * ability and lists fatigue for that dimension. Interpretation, “the choices made”, lists it in no task, so Imagination,
 * read in it alone until 2026-10-16, had nothing; from then a scene, a taped brief and a night read a little of it in
 * believability, the magic if (`BASE_INPUTS`), which fatigue reaches. Emotional Depth’s connection is read only in partnered work, which lists no condition
 * for it. Until 2026-10-13 this was every dimension the ability shapes but interpretation, which held the Profile’s
 * over-report: Emotional Depth tired in connection.
 */
const TIRED: Readonly<Record<string, readonly string[]>> = {
  'Emotional Depth': ['believability'],
  Presence: ['connection'],
  'Listening And Responsiveness': ['connection', 'responsiveness'],
  Imagination: ['believability'],
  Focus: ['execution', 'consistency'],
  Memory: ['execution'],
  Adaptability: ['responsiveness'],
  Composure: ['consistency'],
  'Vocal Expression': ['execution', 'consistency'],
  'Physical Expression': ['execution'],
  Discipline: ['consistency', 'execution'],
  // From 2026-10-17 (brief 11, A4) stamina is read in a task judged in parts as the drain on every dimension tiring
  // reaches (`abilityReaders`, systems/material.ts); until then this said consistency, the input a piece in parts takes out.
  Stamina: ['believability', 'connection', 'execution', 'consistency', 'responsiveness'],
};

describe('p-abilities', () => {
  it('PLAYER JOURNEY: Circles Of Attention opened from Focus’s row and an hour pressed: the hour spent, Focus up by the gain, Now, Last Change and today’s hours said again, across a reload', () => {
    fresh();
    const sim = life('g31-practice');
    sim.advanceTo(at(2026, 8, 24, 8));
    let html = profile(sim);
    const table = abilities(html);
    expect(onScreen(table)).toContain('Twelve abilities, 0 to 100; today’s practice 0 of 4 hours');
    expect(rowsOf(table).slice(1)).toHaveLength(12);
    const focus = rowOf(table, 'Focus');
    expect(focus.slice(1, 7)).toEqual([one(sim.player.attrs!.focus!), '100.0', focus[3], 'Nothing holds it back', 'Interpretation, Execution, Consistency', 'None yet']);
    // Classes reach Focus where they reach its kin, script analysis and cold reading: the mean of their reach.
    const kin = ['Script Analysis', 'Cold Reading'].map((t) => Number(rowOf(techniques(html), t)[2]));
    expect(Math.abs(Number(focus[3]) - (kin[0]! + kin[1]!) / 2)).toBeLessThanOrEqual(0.05);
    press('Circles Of Attention…');
    html = profile(sim);
    expect(onScreen(abilities(html))).toContain('Circles Of Attention.');
    const tier = h.elements.find((e) => e.type === 'select' && e.text.includes('Foundation'))!;
    expect(tier.props.value).toBe(1);
    expect(tier.text).toBe('FoundationDeveloping (Your Level)Advanced');
    const t0 = sim.now;
    const before = sim.player.attrs!.focus!;
    const energy = sim.player.wellbeing.energy;
    press('Practice An Hour');
    const after = sim.player.attrs!.focus!;
    expect(sim.now - t0).toBe(MS_HOUR);
    expect(after).toBeGreaterThan(before);
    expect(h.toasts).toEqual([{ message: `Circles Of Attention: +${(after - before).toFixed(2)}.`, tone: 'positive' }]);
    // At full precision from 2026-10-17 (brief 11, A5: `recordDevelopment`); to a thousandth until then.
    expect(developmentOf(sim.player).history.find((x) => x.id === 'focus')).toMatchObject({ source: 'practice:concentration', delta: after - before });
    expect(sim.player.wellbeing.energy).toBeLessThan(energy);
    html = profile(sim);
    const row = rowOf(abilities(html), 'Focus');
    expect(row[1]).toBe(one(after));
    expect(row[6]).toBe(`+${(after - before).toFixed(2)}, Circles Of Attention`);
    expect(onScreen(abilities(html))).toContain('today’s practice 1 of 4 hours');
    expect(onScreen(abilities(html))).toContain('Pitched where you are.');
    // A day of practice kept grows discipline once, said on its row and first in the history.
    expect(rowOf(abilities(html), 'Discipline')[6]).toMatch(/^\+\d+\.\d\d, A day of practice kept$/);
    const history = onScreen(panel(html, 'Development History'));
    expect(history).toMatch(/August 24, 2026: Discipline \+\d+\.\d{3}, A day of practice kept August 24, 2026: Focus \+\d+\.\d{3}, Circles Of Attention/);
    // A save and a reload: the same figures, and the hour counted once.
    const again = reload(sim);
    const reread = profile(again);
    expect(rowOf(abilities(reread), 'Focus')).toEqual(row);
    expect(onScreen(abilities(reread))).toContain('today’s practice 1 of 4 hours');
  });

  it('PLAYER JOURNEY: the Tier select pressed to Foundation gives 0.75 of the matched hour and says it went easily; to Advanced, 0.8 and three more energy, and says it was a struggle', () => {
    const hour = (tier?: string) => {
      fresh();
      const sim = life('g31-tier');
      sim.advanceTo(at(2026, 8, 24, 8));
      profile(sim);
      press('Circles Of Attention…');
      profile(sim);
      if (tier) { change((e) => e.type === 'select' && e.text.includes('Foundation'), tier); profile(sim); }
      const before = sim.player.attrs!.focus!;
      press('Practice An Hour');
      const words = onScreen(abilities(profile(sim)));
      return { gained: sim.player.attrs!.focus! - before, energy: sim.player.wellbeing.energy, words };
    };
    const matched = hour();
    const below = hour('0');
    const above = hour('2');
    // `TIER`: matched 1, below 0.75, above 0.8, and three more energy above.
    expect(below.gained / matched.gained).toBeCloseTo(0.75, 6);
    expect(above.gained / matched.gained).toBeCloseTo(0.8, 6);
    expect(matched.energy - above.energy).toBeCloseTo(3, 6);
    expect(below.energy).toBe(matched.energy);
    expect(matched.words).toContain('Developing: ');
    expect(matched.words).toContain('Pitched where you are.');
    expect(below.words).toContain('Foundation: ');
    expect(below.words).toContain('It went easily: you’re past it, and the developing tier would ask more.');
    expect(above.words).toContain('Advanced: ');
    expect(above.words).toContain('You struggled to hold it: the developing tier fits where you are now.');
  });

  it('PLAYER JOURNEY: at 7 PM on the first day, Today names what fatigue reaches of each ability, at readiness times the hour’s fit, Imagination’s believability among them', () => {
    const today = TWINS.map((traits) => {
      fresh();
      const sim = life('g31-today', { personalityTraits: [...traits] });
      sim.advanceTo(at(2026, 8, 24, 19));
      return { sim, rows: rowsOf(abilities(profile(sim))).slice(1) };
    });
    const r = readiness(today[1]!.sim.player);
    expect(r).toBeLessThan(60);
    const said = [Math.round(r * FLAT), Math.round(r), Math.round(r * SHARP)];
    today.forEach(({ rows }, i) => {
      expect(rows.map((row) => row[0]).sort()).toEqual(Object.keys(TIRED).sort());
      for (const row of rows) {
        const reached = TIRED[row[0]!]!;
        if (!reached.length) { expect(row[4], row[0]).toBe('Nothing holds it back'); continue; }
        const m = /^Readiness (\d+), under 60: (.+)$/.exec(row[4]!);
        expect(m, `${row[0]}: ${row[4]}`).not.toBeNull();
        expect(Number(m![1]), row[0]).toBe(said[i]);
        expect(m![2]!.split(', ').sort(), row[0]).toEqual([...reached].sort());
      }
    });
    // Imagination: believability, which fatigue reaches, where it was read in interpretation alone until 2026-10-16.
    expect(rowOf(abilities(profile(today[1]!.sim)), 'Imagination').slice(4, 6)).toEqual([`Readiness ${said[1]}, under 60: believability`, 'Believability, Interpretation']);
    // Rested, at 8 AM, nothing holds any of them back.
    fresh();
    const morning = life('g31-today');
    morning.advanceTo(at(2026, 8, 24, 8));
    for (const row of rowsOf(abilities(profile(morning))).slice(1)) expect(row[4], row[0]).toBe('Nothing holds it back');
  });

  it('PLAYER JOURNEY: Stamina’s row says a workout is refused during orientation, in its words, that fitness is falling 0.18 a day, and after a workout that it’s held three days', () => {
    fresh();
    const sim = life('g31-stamina');
    sim.advanceTo(at(2026, 8, 24, 10, 30));
    let row = rowOf(abilities(profile(sim)), 'Stamina');
    expect(row[7]).toBe('Work Out, under Look After Yourself You’re at Registration And Your Account until 12:00 PM. Falling 0.18 a day');
    sim.advanceTo(at(2026, 8, 24, 12, 30));
    const before = sim.player.wellbeing.fitness;
    row = rowOf(abilities(profile(sim)), 'Stamina');
    expect(row[7]).toBe('Work Out, under Look After Yourself Falling 0.18 a day');
    sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
    const after = sim.player.wellbeing.fitness;
    expect(after).toBeGreaterThan(before);
    // A workout taken as a run (`workout:run`), as the history keeps it and Last Change says it.
    expect(developmentOf(sim.player).history.at(-1)).toMatchObject({ id: 'stamina', source: 'workout:run' });
    row = rowOf(abilities(profile(sim)), 'Stamina');
    expect(row[1]).toBe(one(after));
    expect(row[6]).toBe(`+${(after - before).toFixed(2)}, A run`);
    // `FITNESS.heldDays`, three: from Monday 24 August, held until Thursday the 27th.
    expect(row[7]).toBe('Work Out, under Look After Yourself Held until August 27, 2026');
    expect(developmentOf(sim.player).workout!.at + 3 * MS_DAY).toBeGreaterThan(sim.now);
  });
});

// ---------------------------------------------------------------------------
// p-techniques
// ---------------------------------------------------------------------------

describe('p-techniques', () => {
  it('lists the seventeen with their level, the reach classes bring (each as admitted and 26 points more) and how far to 90, to one place', () => {
    fresh();
    const sim = life('g31-techniques');
    const html = profile(sim);
    const table = techniques(html);
    expect(onScreen(table)).toContain('Seventeen learned methods; mastered at 90');
    const rows = rowsOf(table).slice(1);
    expect(rows).toHaveLength(17);
    const craft = sim.player.craft!;
    const LABEL: Record<string, keyof typeof craft> = { 'Accents And Dialects': 'accents', 'Audition Technique': 'audition', 'Character Work': 'character', 'Classical Text': 'classical', 'Clown And Mask': 'clown', 'Cold Reading': 'coldReading', Comedy: 'comedy', Dance: 'dance', Improvisation: 'improv', Intimacy: 'intimacy', 'On Camera': 'screen', 'Scene Study': 'scene', 'Script Analysis': 'script', Singing: 'singing', Speech: 'speech', 'Stage Combat': 'combat', 'Voice-Over': 'voiceover' };
    expect(rows.map((r) => r[0])).toEqual(Object.keys(LABEL));
    for (const r of rows) {
      const level = craft[LABEL[r[0]!]!];
      expect(r.slice(1, 4), r[0]).toEqual([one(level), one(Math.min(100, level + 26)), `${one(90 - level)} To Go`]);
    }
    // An ability classes grow through one technique reaches where it does: Adaptability through improvisation.
    expect(rowOf(abilities(html), 'Adaptability')[3]).toBe(rowOf(table, 'Improvisation')[2]);
    // One kept in the craft reaches its own skill's: Vocal Expression, the voice.
    expect(rowOf(abilities(html), 'Vocal Expression')[3]).toBe(one(Math.min(100, craft.voice + 26)));
  });

  it('PLAYER JOURNEY: Speech Drill pressed from Speech’s row: Now rises by the hour’s gain, To Go falls by it, and the reach holds', () => {
    fresh();
    const sim = life('g31-speech');
    sim.advanceTo(at(2026, 8, 24, 8));
    let row = rowOf(techniques(profile(sim)), 'Speech');
    const before = sim.player.craft!.speech;
    expect(row.slice(1, 4)).toEqual([one(before), one(before + 26), `${one(90 - before)} To Go`]);
    press('Speech Drill…');
    profile(sim);
    press('Practice An Hour');
    const after = sim.player.craft!.speech;
    expect(h.toasts.at(-1)!.message).toBe(`Speech Drill: +${(after - before).toFixed(2)}.`);
    row = rowOf(techniques(profile(sim)), 'Speech');
    expect(row.slice(1, 4)).toEqual([one(after), one(before + 26), `${one(90 - after)} To Go`]);
    expect(Number(row[3]!.split(' ')[0])).toBeLessThan(90 - before);
  });

  it('TEST SETUP: Scene Study at 89.95 reads 90.0 with 0.0 To Go and isn’t mastered; an hour of Scene Work pressed from its row takes it past 90, and the row reads Yes', () => {
    fresh();
    const sim = life('g31-mastered');
    sim.advanceTo(at(2026, 8, 24, 8));
    // TEST SETUP: the skill set by hand a hair under mastery, where no new student stands.
    sim.player.craft!.scene = 89.95;
    let row = rowOf(techniques(profile(sim)), 'Scene Study');
    // The level, not its rounding, is mastered or not: the evaluation counts it at 89.95 of 90.
    expect(row.slice(1, 4)).toEqual(['90.0', row[2], '0.0 To Go']);
    press('Scene Work…');
    profile(sim);
    press('Practice An Hour');
    const after = sim.player.craft!.scene;
    expect(after).toBeGreaterThanOrEqual(90);
    row = rowOf(techniques(profile(sim)), 'Scene Study');
    expect(row[1]).toBe(one(after));
    expect(row[3]).toBe('Yes');
  });
});

// ---------------------------------------------------------------------------
// p-genres
// ---------------------------------------------------------------------------

describe('p-genres', () => {
  it('PLAYER JOURNEY: the search, Study It pressed (familiarity 8.0), every Show filter and the paging, sixteen at a time to the 149th', () => {
    fresh();
    const sim = life('g31-genres', { genres: ['drama'] });
    sim.advanceTo(at(2026, 8, 24, 8));
    expect(FILM_GENRES).toHaveLength(149);
    let html = profile(sim);
    expect(onScreen(genres(html))).toContain('1 loved; 0 of 149 studied or practiced');
    expect(onScreen(genres(html))).toContain('16 shown');
    change(findGenre, 'Comedy');
    html = profile(sim);
    let rows = rowsOf(genres(html)).slice(1);
    expect(rows.length).toBeGreaterThan(1);
    for (const r of rows) expect(r[0]!.toLowerCase()).toContain('comedy');
    expect(onScreen(genres(html))).toContain(`${rows.length} shown`);
    expect(rows.map((r) => r[0])).toContain('Comedy');
    const t0 = sim.now;
    // Comedy's own Study It: the first after its name in the table.
    press('Study It', listed('Comedy'));
    expect(h.toasts).toHaveLength(1);
    const first = 'Comedy';
    expect(h.toasts[0]!.message).toMatch(/^Comedy: an hour and a half with .+\. Familiarity 8\.0 of 100\.$/);
    expect(sim.now - t0).toBe(90 * 60_000);
    html = profile(sim);
    rows = rowsOf(genres(html)).slice(1);
    expect(rows.find((r) => r[0] === first)!.slice(2, 4)).toEqual(['8.0', '0.0']);
    expect(onScreen(genres(html))).toContain('1 loved; 1 of 149 studied or practiced');
    change(findGenre, '');
    profile(sim);
    change(showGenres, 'Loved');
    rows = rowsOf(genres(profile(sim))).slice(1);
    expect(rows.map((r) => r[0])).toEqual(['Drama, Loved']);
    expect(onScreen(genres(profile(sim)))).toContain('1 shown');
    change(showGenres, 'Studied Or Practiced');
    rows = rowsOf(genres(profile(sim))).slice(1);
    expect(rows.map((r) => r[0])).toEqual([first]);
    expect(rows[0]!.slice(2, 4)).toEqual(['8.0', '0.0']);
    change(showGenres, 'With Requirements');
    html = profile(sim);
    rows = rowsOf(genres(html)).slice(1);
    expect(rows.length).toBe(16);
    // Each asks for a technique, said with yours against mastery.
    for (const r of rows) expect(r[1], r[0]).toMatch(/^[A-Z][^()]+ \([A-Za-z -]+ \d+\.\d of 90\)(; [A-Z][^()]+ \([A-Za-z -]+ \d+\.\d of 90\))*$/);
    change(showGenres, 'All');
    html = profile(sim);
    rows = rowsOf(genres(html)).slice(1);
    expect(rows).toHaveLength(16);
    expect(rows.some((r) => r[1] === 'Nothing past the camera’s own')).toBe(true);
    // 149 genres: nine pages of sixteen, 144, then five more.
    for (let shown = 16; shown < 144; shown += 16) {
      expect(onScreen(genres(html))).toContain(`${shown} shown`);
      press('Show 16 More');
      html = profile(sim);
    }
    expect(onScreen(genres(html))).toContain('144 shown');
    press('Show 5 More');
    html = profile(sim);
    expect(rowsOf(genres(html)).slice(1)).toHaveLength(149);
    expect(onScreen(genres(html))).toContain('149 shown');
    expect(h.elements.some((e) => e.type === 'button' && /^Show \d+ More$/.test(e.text))).toBe(false);
  });

  it('PLAYER JOURNEY: the genre to study is the loved one known least before any part, and once the clock casts her in Major Barbara, its kind known least, each moved by a study', () => {
    fresh();
    const sim = life('g31-part', { genres: ['drama', 'comedy'] });
    sim.advanceTo(at(2026, 8, 24, 8));
    const sentence = (html: string) => inline(/You love: ([\s\S]*?)<\/p>/.exec(html)?.[1] ?? '');
    expect(sentence(profile(sim))).toBe('Drama, Comedy. Drama is the one you love and know least; no part asks for a kind yet.');
    sim.must({ kind: 'genre.study', payload: { genre: 'drama' } });
    expect(sentence(profile(sim))).toBe('Drama, Comedy. Comedy is the one you love and know least; no part asks for a kind yet.');
    // After orientation's first session, an hour and a half free again.
    sim.advanceTo(at(2026, 8, 24, 12, 30));
    sim.must({ kind: 'genre.study', payload: { genre: 'comedy' } });
    // A year on, the second fall's casting: Major Barbara, a comedy, a satire and a political drama.
    sim.advanceTo(at(2027, 9, 11, 8));
    // Barbara Undershaft until 2026-10-16, Lady Britomart from then, when casting's read came to weigh a night's abilities as
    // the play demands (`BASE_INPUTS`), and Barbara again from later that day, when a stage's house came to weigh the
    // voice and the body (`STAGE_LEAN`). The play, and so the kinds below, are the same.
    expect(sim.player.school!.casting).toMatchObject({ play: 'Major Barbara', role: 'Barbara Undershaft' });
    expect(sentence(profile(sim))).toBe('Drama, Comedy. Satire is the kind your next part’s play is, and the one of its kinds you know least.');
    expect(studyRefusal(sim, sim.player, 'satire')).toBeUndefined();
    sim.must({ kind: 'genre.study', payload: { genre: 'satire' } });
    expect(sentence(profile(sim))).toBe('Drama, Comedy. Political Drama is the kind your next part’s play is, and the one of its kinds you know least.');
  });

  it('PLAYER JOURNEY: Open Its Brief pressed, Tape It refused before a reading, Read It This Way and Tape It pressed: the take kept once and practice 1.5 in Drama’s row, a cold take’s share, across a reload; refused by the clock before orientation', () => {
    fresh();
    const sim = life('g31-brief', { genres: ['drama'] });
    sim.advanceTo(at(2026, 8, 24, 8));
    profile(sim);
    change(findGenre, 'Drama');
    profile(sim);
    // Drama's own Open Its Brief, which names its brief, The Spare Key, in its title. (A plain button is drawn as its
    // row is, before the Gated and Open beside it draw theirs, so it's known by its words, not by what's next to it.)
    const b = BRIEF_BY_ID['brief-drama']!;
    const open = h.elements.filter((e) => e.type === 'button' && e.text === 'Open Its Brief' && String(e.props.title).startsWith(`${b.title}: `));
    expect(open).toHaveLength(1);
    (open[0]!.props.onClick as () => void)();
    settle();
    let html = profile(sim);
    let words = onScreen(genres(html));
    expect(words).toContain('Drama: Its Brief');
    expect(words).toContain('The Spare Key');
    expect(control('Tape It (60 Min)').props.disabled).toBe(true);
    expect(words).toContain('Choose a reading first: a take is of the scene played one way, and you should know which before the camera rolls.');
    press('Read It This Way');
    expect(h.toasts.at(-1)).toEqual({ message: `Reading it as ${b.readings[0]!.label}.`, tone: 'positive' });
    expect(sim.player.briefs!['brief-drama']!.reading).toBe(b.readings[0]!.id);
    profile(sim);
    expect(control('Tape It (60 Min)').props.disabled).toBe(false);
    const kept = sim.player.work?.length ?? 0;
    const t0 = sim.now;
    press('Tape It (60 Min)');
    expect(sim.now - t0).toBe(MS_HOUR);
    expect(sim.player.work).toHaveLength(kept + 1);
    const take = sim.player.work!.at(-1)!;
    expect(h.toasts.at(-1)!.message).toMatch(new RegExp(`^Taped: ${take.overall.toFixed(1).replace('.', '\\.')}, .+\\.$`));
    html = profile(sim);
    words = onScreen(genres(html));
    expect(words.replace(/ ,/g, ',')).toContain(`The Last Take, August 24, 2026 ${take.overall.toFixed(1)},`);
    expect(words).toContain('Your Takes Of It');
    const takes = (page: string) => rowsOf(/<table data-takes="">([\s\S]*?)<\/table>/.exec(page)?.[1] ?? '').slice(1);
    expect(takes(html)).toHaveLength(1);
    expect(takes(html)[0]![0]).toBe('August 24, 2026');
    expect(takes(html)[0]![4]).toBe(take.overall.toFixed(1));
    // A take is practice in its genre: 100 × 0.1, shared by the brief's one kind, times the share of it a take this cold
    // credits (practiceShare, from 2026-10-16: 0.15, nothing prepared), 1.5. It was 10 until then.
    const drama = (page: string) => rowOf(genres(page).slice(genres(page).indexOf('genres-find')), 'Drama').slice(2, 4);
    expect(drama(html)).toEqual(['0.0', '1.5']);
    expect(words).toContain('1 loved; 1 of 149 studied or practiced');
    // A save and a reload: the take once, and its practice once, on the same screen.
    const again = reload(sim);
    expect(again.player.work).toHaveLength(kept + 1);
    const reread = profile(again);
    expect(takes(reread)).toEqual(takes(html));
    expect(drama(reread)).toEqual(['0.0', '1.5']);
    // Half an hour before orientation, the pane refuses the take, in its words, under the button.
    sim.advanceTo(at(2026, 8, 24, 9, 30));
    html = profile(sim);
    expect(control('Tape It (60 Min)').props.disabled).toBe(true);
    expect(onScreen(genres(html))).toContain('Registration And Your Account starts at 10:00 AM: there isn’t the time before it.');
  });
});
