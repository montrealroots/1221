/**
 * Evidence for seven screen rows the review of 2026-10-13 left partial (verification group g32-ui): the Player Profile's
 * Current Condition, its School Journey with Your Work So Far and Development History, and Home's head, Calendar, What
 * Needs You, How You Are, and Where You Are with the Weather. The review found each drawn by some test and read by none,
 * or read only as the engine function the panel calls. Here each is drawn as the player has it and read for its words
 * and its controls, its buttons pressed and the screen read again, and each figure set against one worked out here from
 * the rule's own numbers or a published source, never asked of the helper the engine computes it with.
 *
 * - `p-condition`: Readiness, its figure at the hour's fit, For Work and Energy, Stress with the sleep owed, for a rested
 *   afternoon (88, from the seven ranges of `readinessParts` multiplied and over 1.35, worked here), an early riser at
 *   nine and at six (1.1 and 0.88 bent inside [0.8, 1.2]: 96 and 79), a day kept up until it's under the line of 60, a
 *   night's sleep after it, a bone broken on the first morning's run, and the flu, a concussion and a cut, each Held
 *   Back in its own words in the panel's order.
 * - `p-journey-history`: an hour of practice at the top of Development History, newest first, the change to three
 *   places as the ability's own figure moved; a first year played to the Carlotta Festival: its half-years and All Of It
 *   counted here from the work kept, the latest work first and Show Older Work, the part running, the credit from the
 *   next casting, Your School going to /workspace/school, and Your Work So Far's count and kinds. Found on the way, and
 *   held by a test that fails until it's fixed: once the run has closed, its milestone on the same panel, School Journey
 *   still says the part "is running", until the next term's casting files its credit (`JourneyPanel`).
 * - `h-head`: the weekday date, the noun, "Good <part of day>, <name>.", the time, the city, the zone, the season and
 *   the sky, each opening its look; the part of day at every boundary as the clock reaches it; the name a player goes
 *   by; and a January in New Haven.
 * - `h-calendar`: a plan two days out as the next commitment, a second under it, both called off; a call in Los Angeles
 *   on its own clock with "you’re not in Los Angeles", and the notice when it's missed, on the call’s clock too (until
 *   2026-10-13 on the home clock with no zone); Open Calendar pressed; the
 *   section and its button locked until their chapters; a plan across a reload.
 * - `h-needs`: a student from abroad's 2026 return on 1 February 2027, with its notices, Go There, Dismiss and Mark N
 *   Read pressed to All Clear; File It refused in the guide's words and then filing; the return left unfiled, Overdue at
 *   midnight, gone two days on, and weighing what it owed and 5% of it (IRC §6651); each other sentence of what weighs;
 *   and more than six questions.
 * - `h-how`: the summary and the three meters at the dials' own figures, Readiness by hand; a meal moving them; the tone
 *   at EMPTY and OVERWROUGHT and fifteen inside each; each summary; each meter opening its look at the same figure.
 * - `h-where-weather`: New Haven, Connecticut · United States, Home., 130K people, its clock and its daylight against the
 *   sunrise equation; the weather in °F and mph, the climate, the five days ahead, each the day the clock then brings; a
 *   London life in °C and km/h. The away line ("… from home in …") wasn't reached: Home profiles the city the player is
 *   in, and since the scope reset of 2026-10-09 that's their home too (`homeCityOf`, `world/place.ts`).
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, she/her, an actress at Yale in New Haven
 * from Monday 24 August 2026 at 7:30 AM, born in New York: the birthplace a player picks on Identity, which
 * `newLifeConfig` leaves empty and `createSave` won't make a life without. For What Needs You, the same life born in
 * London, a student from abroad, who has a US return to file. `quickSave` makes the two lives a student's doesn't reach:
 * January in New Haven (it begins on 5 January 2026), and a life in London; each says so where it's made. Seeds:
 * r8-a for a first year played through (tests/defects-r8-1.test.ts), g09-run-1668 for a run on the first morning that
 * breaks a bone (tests/evidence-g09-life.test.ts).
 *
 * The screens are drawn as the player has them (react-dom/server), `useGame` standing in for the provider: `run` is the
 * save's own `execute`, and `navigate` is kept for the test to read. A button pressed is the component's own onClick,
 * kept on its way through the JSX runtime; what a press sets in React state (a look opened, a list let longer) is kept
 * by the order its useState is called in and given back on the next render, as React would.
 *
 * TEST SETUP, said again where it's done: the dials set by hand before a measured hour; the calendar cleared of what
 * wants the player; the flu and an injury set as tests/condition-reach.test.ts sets them; a balance set by a posting
 * against a test equity line, as tests/defects-g18-1.test.ts sets one, for each money trouble What Needs You weighs;
 * a card's missed payments and suspension; a filed return owing; and seven questions raised through `requireDecision`,
 * as their raisers raise them.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Wellbeing } from '@/engine/domain/model';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { instantFromZoned, zonedParts, MS_DAY, MS_HOUR } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { openDecisions } from '@/engine/world/world';
import { forecastFor, weatherAt } from '@/engine/systems/weather';
import { healthOf } from '@/engine/systems/health';
import { cardsOf } from '@/engine/systems/credit';
import { returnsOf, type TaxReturn } from '@/engine/systems/taxreturn';
import { identityOf } from '@/engine/systems/artistry';
import { developmentOf } from '@/engine/systems/attributes';
import { TASK_PROFILES } from '@/engine/content/tasks';

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
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { Home } = await import('@/ui/screens/Home');
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');

// ---------------------------------------------------------------------------
// Lives, the screens over them, and the figures worked out by hand
// ---------------------------------------------------------------------------

const NY = 'America/New_York';
const NEW_HAVEN = 'us-ct-newhaven';
/** An instant of New Haven's wall clock. */
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
/** Ada Cole at Yale, born in New York, as a new player makes her. */
const ada = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** The same life born in London: a student from abroad, with a US return to file each year. */
const fromAbroad = (seed: string, extra: Partial<NewSaveConfig> = {}) => ada(seed, { homeRegionId: 'uk-eng-london', ...extra });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/** The words a player reads: titles out, tags out, entities back, and no space before a full stop or a comma. */
const words = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();
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
/** The look a press opened: its kind, its name and its summary. */
function opened(html: string): string {
  const i = html.indexOf('<div class="look" data-depth');
  expect(i, 'a look opened').toBeGreaterThanOrEqual(0);
  return words(html.slice(i, html.indexOf('</p>', html.indexOf('look-summary', i))));
}
/** A meter as drawn: its tone and its figure. */
function meter(html: string, label: string): { tone: string; now: number } {
  const m = html.match(new RegExp(`<div class="meter meter-(\\w+)" role="meter" aria-valuenow="(\\d+)" aria-valuemin="0" aria-valuemax="100" aria-label="${label}">`));
  expect(m, `the ${label} meter`).not.toBeNull();
  return { tone: m![1]!, now: Number(m![2]) };
}
/** A date as the US writes it, by the platform's own calendar, not the engine's. */
const written = (instant: number) => new Intl.DateTimeFormat('en-US', { timeZone: NY, month: 'long', day: 'numeric', year: 'numeric' }).format(instant);

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
/** TEST SETUP: the dials set by hand, rested unless said otherwise. */
const dials = (sim: Simulation, set: Partial<Wellbeing> = {}) => Object.assign(sim.player.wellbeing, REST, set);
/** TEST SETUP: what the world booked that wants the player, canceled, so the screen's own plans are the only ones. */
const clearCalendar = (sim: Simulation) => { for (const i of sim.universe.scheduled) if (i.status === 'pending' && i.requiresPlayer) sim.timeline.cancel(i.id, sim.now); };
/**
 * The save as it stands, less the three records the Player Profile's first drawing settles as empty on a new life
 * (`developmentOf`, `experienceOf` and `journeyOf` write their empty default when first read): with nothing in them,
 * they change nothing a rule reads. Measured on 2026-10-13: a new life's first drawing of the Profile added exactly
 * these three, `{ day: '', counts: {}, history: [] }`, `{ features: {}, approaches: {}, exercises: {} }` and
 * `{ totals: {}, byTerm: {}, milestones: [] }`; Home's drawing adds nothing.
 */
function asSaved(sim: Simulation): string {
  const u = JSON.parse(serialise(sim.universe)) as { people: Record<string, Record<string, unknown>> };
  const empty: Record<string, string> = {
    development: JSON.stringify({ day: '', counts: {}, history: [] }),
    experience: JSON.stringify({ features: {}, approaches: {}, exercises: {} }),
    journey: JSON.stringify({ totals: {}, byTerm: {}, milestones: [] }),
  };
  for (const person of Object.values(u.people)) for (const [k, v] of Object.entries(empty)) if (JSON.stringify(person[k]) === v) delete person[k];
  return JSON.stringify(u);
}

beforeEach(() => {
  h.given = new Map();
  h.went = [];
});

// ---------------------------------------------------------------------------
// p-condition
// ---------------------------------------------------------------------------

describe('p-condition: Current Condition on the Player Profile', () => {
  const condition = (sim: Simulation) => between(drawn(sim, ProfileWorkspace).text, 'Readiness Today', 'Sources And Estimates');

  it('PLAYER JOURNEY: a rested afternoon reads Readiness 88, 88 at this hour’s fit, For Work Sufficient with nothing holding it back, and Energy, Stress 95, 15; drawing it changes nothing', () => {
    const sim = ada('g32-condition');
    sim.advanceTo(at(2026, 8, 24, 14));
    dials(sim); // TEST SETUP
    // 1.115 × 1.045 × 1.05 × 0.996 × 1.000 × 1.008 × 0.970 = 1.19144, over 1.35: 88.25. Between noon and five the hour
    // suits everybody the same (`hourFit`), so the hour's figure is the day's.
    expect(Math.round(byHand(sim.player.wellbeing))).toBe(88);
    const before = asSaved(sim);
    const { html } = drawn(sim, ProfileWorkspace);
    expect(condition(sim)).toBe('Readiness Today Whether anything holds your work back today Readiness 88 88 at this hour For Work Sufficient Today, nothing holds your work back Energy, Stress 95, 15 No sleep owed');
    expect(html).toContain('<span class="stat-label">For Work</span><span class="stat-value">Sufficient</span>');
    expect(asSaved(sim)).toBe(before);
  });

  it('says the sleep owed in whole hours, one hour singular and none as none (a defect until 2026-10-17: “Sleep owed 1 hours”)', () => {
    const sim = ada('g32-condition-owed');
    sim.advanceTo(at(2026, 8, 24, 14));
    dials(sim); // TEST SETUP
    const owed = (hours: number) => { sim.player.wellbeing.sleepDebt = hours; return condition(sim); }; // TEST SETUP: the debt set by hand
    expect(owed(1)).toContain('Energy, Stress 95, 15 1 hour of sleep owed');
    expect(owed(1)).not.toContain('1 hours');
    expect(owed(1.4)).toContain(' 1 hour of sleep owed');
    expect(owed(3)).toContain(' 3 hours of sleep owed');
    expect(owed(0.3)).toContain(' No sleep owed');
  });

  it('PLAYER JOURNEY: an early riser at nine reads 96 at this hour’s fit against her 88, and at six in the evening 79', () => {
    const sim = ada('g32-condition-early', { personalityTraits: ['early_riser'] });
    sim.advanceTo(at(2026, 8, 24, 9));
    dials(sim); // TEST SETUP
    // Early Riser's mornings at 1.1 and evenings at 0.88, bent inside the knob's [0.8, 1.2] (exp(L·tanh(ln v / L))):
    // 1.09142 and 0.89095, times 88.255.
    expect(condition(sim)).toContain('Readiness 88 96 at this hour');
    sim.advanceTo(at(2026, 8, 24, 18));
    dials(sim); // TEST SETUP
    expect(condition(sim)).toContain('Readiness 88 79 at this hour');
    sim.advanceTo(at(2026, 8, 25, 14));
    dials(sim); // TEST SETUP
    expect(condition(sim)).toContain('Readiness 88 88 at this hour');
  });

  it('PLAYER JOURNEY: a day kept up hour by hour falls under the line of 60 and For Work is Held Back by fatigue, the figures the dials’ own; a night’s sleep and it’s Sufficient again', () => {
    const sim = ada('g32-condition-kept');
    // An hour at a time, so no night is slept on the way, until the rule worked by hand puts her under 60.
    let hours = 0;
    while (byHand(sim.player.wellbeing) >= 60 && hours < 16) { sim.advanceTo(sim.now + MS_HOUR); hours += 1; }
    const w = sim.player.wellbeing;
    const ready = Math.round(byHand(w));
    expect(ready).toBeLessThan(60);
    const hour = zonedParts(sim.now, NY).hour;
    expect(hour >= 12 && hour < 17, 'an hour that suits everybody the same').toBe(true);
    const { html } = drawn(sim, ProfileWorkspace);
    expect(condition(sim)).toBe(`Readiness Today Whether anything holds your work back today Readiness ${ready} ${ready} at this hour For Work Held Back Under 60: tiredness holds your work back Energy, Stress ${Math.round(w.energy)}, ${Math.round(w.stress)} ${Math.round(w.sleepDebt) ? `${Math.round(w.sleepDebt)} ${Math.round(w.sleepDebt) === 1 ? 'hour' : 'hours'} of sleep owed` : 'No sleep owed'}`);
    expect(html).toContain('<span class="stat-label">For Work</span><span class="stat-value warning">Held Back</span>');
    // Kept up to ten, then a night's sleep to seven.
    while (zonedParts(sim.now, NY).hour < 22) sim.advanceTo(sim.now + MS_HOUR);
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: (at(2026, 8, 25, 7) - sim.now) / MS_HOUR } }).ok).toBe(true);
    expect(byHand(sim.player.wellbeing)).toBeGreaterThanOrEqual(60);
    expect(condition(sim)).toContain(`Readiness ${Math.round(byHand(sim.player.wellbeing))}`);
    expect(condition(sim)).toContain('For Work Sufficient Today, nothing holds your work back');
  });

  it('PLAYER JOURNEY: a run on the first morning breaks a bone, and For Work is Held Back, An injury holds back the body, over the line; the twin who didn’t run is Sufficient; a reload keeps it; mended, it holds nothing back', () => {
    const run = createSave(1, 'g09-run-1668', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personalityTraits: [] });
    const twin = createSave(1, 'g09-run-1668', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personalityTraits: [] });
    expect(run.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok).toBe(true);
    const injury = healthOf(run.player).injury!;
    expect(injury.kind).toBe('fracture');
    const ready = Math.round(byHand(run.player.wellbeing));
    expect(ready).toBeGreaterThanOrEqual(60);
    expect(condition(run)).toContain(`Readiness ${ready} ${ready} at this hour For Work Held Back An injury holds back your physical work`);
    twin.advanceTo(run.now);
    expect(condition(twin)).toContain('For Work Sufficient Today, nothing holds your work back');
    expect(condition(reload(run))).toContain('For Work Held Back An injury holds back your physical work');
    run.advanceTo(injury.until + MS_HOUR);
    dials(run); // TEST SETUP: the day rested, so the bone is what's measured.
    expect(condition(run)).toContain('For Work Sufficient Today, nothing holds your work back');
  });

  it('the flu, an injury, a concussion and the line, each said in its own words and in the panel’s order, and a cut holds nothing back (TEST SETUP: each set by hand, as tests/condition-reach.test.ts sets them)', () => {
    const sim = ada('g32-condition-causes');
    sim.advanceTo(at(2026, 8, 24, 14));
    dials(sim); // TEST SETUP
    const forWork = () => between(condition(sim), 'For Work', 'Energy, Stress');
    const hurt = (kind: 'sprain' | 'concussion' | 'cut') => { healthOf(sim.player).injury = { kind, at: sim.now, until: sim.now + 10 * MS_DAY }; };
    healthOf(sim.player).fluUntil = sim.now + 5 * MS_DAY; // TEST SETUP
    expect(forWork()).toBe('For Work Held Back The flu holds back your voice and body work');
    hurt('sprain'); // TEST SETUP: the flu is said before an injury.
    expect(forWork()).toBe('For Work Held Back The flu holds back your voice and body work');
    delete healthOf(sim.player).fluUntil;
    expect(forWork()).toBe('For Work Held Back An injury holds back your physical work');
    healthOf(sim.player).fluUntil = sim.now + 5 * MS_DAY;
    hurt('concussion'); // TEST SETUP: a concussion before the flu.
    expect(forWork()).toBe('For Work Held Back A concussion holds back all your work');
    dials(sim, { energy: 5 }); // TEST SETUP: 38 by hand, under the line, said before all of them.
    expect(Math.round(byHand(sim.player.wellbeing))).toBe(38);
    expect(forWork()).toBe('For Work Held Back Under 60: tiredness holds your work back');
    dials(sim);
    delete healthOf(sim.player).fluUntil;
    hurt('cut'); // TEST SETUP: a deep cut limits nothing.
    expect(forWork()).toBe('For Work Sufficient Today, nothing holds your work back');
  });

  it('a life with no craft draws the Profile’s empty state, which says why, and none of its panels (brief 15)', () => {
    const sim = ada('g32-no-craft');
    delete sim.player.craft; // TEST SETUP: every life begins at the school; one without its training is drawn to read the words.
    const { text } = drawn(sim, ProfileWorkspace);
    expect(text).toContain('You didn’t start at drama school, so there are no acting abilities or techniques to show.');
    expect(text).not.toContain('Readiness Today');
  });
});

// ---------------------------------------------------------------------------
// p-journey-history
// ---------------------------------------------------------------------------

describe('p-journey-history: School Journey, Your Work So Far and Development History on the Player Profile', () => {
  const journeyHtml = (html: string) => html.slice(html.indexOf('>School Journey<'), html.indexOf('>Your Work So Far<'));
  const tables = (html: string) => [...html.matchAll(/<table>([\s\S]*?)<\/table>/g)]
    .map((t) => [...t[1]!.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1]!.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => words(c[1]!))));
  const historyItems = (html: string) => [...html.slice(html.indexOf('>Development History<')).matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => words(m[1]!));
  /** A task's id from the label the table heads its column with. */
  const taskOf = (label: string) => Object.keys(TASK_PROFILES).find((t) => (TASK_PROFILES[t]?.label ?? t) === label) ?? label;
  /** The half-year a piece falls in by New Haven's calendar: January to June the spring, July to December the fall. */
  const half = (instant: number) => { const p = zonedParts(instant, NY); return `${p.year} ${p.month <= 6 ? 'Spring' : 'Fall'}`; };
  /** Counted here from the work kept: how many, their mean and their best, as the table writes them. */
  const tally = (xs: number[], best: boolean) => `${xs.length} at ${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)}${best ? `, best ${Math.max(...xs).toFixed(1)}` : ''}`;

  it('PLAYER JOURNEY: an hour of Circles Of Attention puts its changes at the top of Development History, newest first: the day, the ability, the change its figure made to three places, and the hour’s words; a reload keeps them, once', () => {
    const sim = ada('g32-history');
    clearCalendar(sim); // TEST SETUP
    dials(sim); // TEST SETUP
    expect(between(drawn(sim, ProfileWorkspace).text, 'Development History')).toBe('Development History Your last 400 changes, newest first No changes yet. The history begins with your first class, preparation step or hour of practice.');
    const before = { focus: sim.player.attrs!.focus!, discipline: sim.player.attrs!.discipline! };
    expect(sim.execute({ kind: 'practice.exercise', payload: { exercise: 'concentration', focus: 'steady' } }).ok).toBe(true);
    const moved = { focus: (sim.player.attrs!.focus! - before.focus).toFixed(3), discipline: (sim.player.attrs!.discipline! - before.discipline).toFixed(3) };
    expect(Number(moved.focus)).toBeGreaterThan(0);
    expect(Number(moved.discipline)).toBeGreaterThan(0);
    // The day's discipline was counted after the hour's focus, so it's first.
    const said = [`August 24, 2026: Discipline +${moved.discipline}, A day of practice kept`, `August 24, 2026: Focus +${moved.focus}, Circles Of Attention`];
    expect(historyItems(drawn(sim, ProfileWorkspace).html)).toEqual(said);
    expect(historyItems(drawn(reload(sim), ProfileWorkspace).html)).toEqual(said);
  });

  it('PLAYER JOURNEY: a first year played to 10 May 2027, the Carlotta Festival on: the part running, each half-year’s work by task and All Of It as the work kept counts them, the latest work first, and Show Older Work letting twenty more in', () => {
    const sim = ada('r8-a');
    sim.advanceTo(at(2027, 5, 10, 12));
    const school = sim.player.school!;
    const casting = school.casting as NonNullable<typeof school.casting> & { closed?: number };
    expect(casting.performed).toBe(3);
    expect(casting.closed).toBeUndefined();
    expect(school.standing).toBe('warning');
    let { html, text } = drawn(sim, ProfileWorkspace);
    expect(`${between(text, 'School Journey', '. School')}.`).toBe('School Journey Year 1 of 3, academic warning How This Works No production finished yet; A Leading Part In A New Play in Carlotta Festival Of New Plays is running.');
    const [halves, work] = tables(journeyHtml(html));
    // Counted here, by task and by half-year, from every piece the save keeps (all of them: fewer than its 160).
    const kept = sim.player.work!;
    expect(kept.length).toBeLessThan(160);
    const tasks = halves![0]!.slice(1).map(taskOf);
    expect(new Set(tasks)).toEqual(new Set(kept.map((w) => w.task)));
    const of = (task: string, inHalf?: string) => kept.filter((w) => w.task === task && (inHalf === undefined || half(w.at) === inHalf)).map((w) => w.overall);
    const halvesSeen = [...new Set(kept.map((w) => half(w.at)))].sort();
    expect(halves!.slice(1, -1).map((r) => r[0])).toEqual(halvesSeen);
    for (const row of halves!.slice(1, -1)) expect(row.slice(1), row[0]).toEqual(tasks.map((t) => (of(t, row[0]).length ? tally(of(t, row[0]), false) : '—')));
    expect(halves!.at(-1)).toEqual(['All Of It', ...tasks.map((t) => tally(of(t), true))]);
    // The latest work first, ten of them, by date: the newest piece is the one played last.
    const newest = [...kept].sort((a, b) => b.at - a.at);
    expect(newest[0]!.at).toBeGreaterThan(newest[1]!.at);
    expect(work![0]).toEqual(['Work', 'What', 'Whole', 'Band', 'When']);
    expect(work!.length - 1).toBe(10);
    const first = work![1]!;
    expect([first[0], first[1], first[2], first[4]]).toEqual([newest[0]!.what, newest[0]!.taskLabel, newest[0]!.overall.toFixed(1), written(newest[0]!.at)]);
    const dates = work!.slice(1).map((r) => Date.parse(r[4]!));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    press(button('Show Older Work'));
    ({ html, text } = drawn(sim, ProfileWorkspace));
    expect(tables(journeyHtml(html))[1]!.length - 1).toBe(30);
    expect(text).toContain('Show Older Work');
  });

  it('PLAYER JOURNEY: once the run has closed, its last night played and its average a milestone on the same panel, School Journey says she was on stage in it, not that it is running', () => {
    const sim = ada('r8-a');
    sim.advanceTo(at(2027, 6, 5, 12));
    const casting = sim.player.school!.casting as NonNullable<NonNullable<typeof sim.player.school>['casting']> & { closed?: number };
    expect(casting.performed).toBe(4);
    expect(casting.closed).toBeDefined();
    expect(casting.note).toBeDefined();
    // The run's four nights, averaged here from the work kept: what the milestone says.
    const nights = sim.player.work!.filter((w) => w.task === 'performance' && w.what === casting.production);
    expect(nights).toHaveLength(4);
    const mean = (nights.reduce((a, w) => a + w.overall, 0) / 4).toFixed(1);
    const journey = between(drawn(sim, ProfileWorkspace).text, 'School Journey', 'Your Work So Far');
    // And each night's band by its line (`EVALUATION.bands`: solid from 50), counted here: two and two until 2026-10-16, one
    // solid and three off from then, the nights weighed as the play demands (`BASE_INPUTS`) at 50.7, 49.0, 49.3 and 49.9;
    // two and two again from brief 10 later that day, a lead's new play of 100 minutes drained by its workload where it
    // was a whole evening's load, at 50.9, 49.1, 49.4 and 50.0.
    const solid = nights.filter((w) => w.overall >= 50).length;
    expect(solid).toBe(2);
    // Its nights by band in words (from 2026-10-20, brief 17): until then as the milestone keeps them, "(2 solid, 2 off)".
    expect(journey).toContain(`${written(casting.closed!)}: A Leading Part In A New Play, Carlotta Festival Of New Plays, the run averaged ${mean} (${solid} solid nights, ${4 - solid} off nights)`);
    // DEFECT: the run closed on 12 May, and until the next term's casting files its credit (September) the panel said it
    // was running, under its own milestone.
    expect(journey).not.toContain('is running');
    expect(journey).toContain('On stage: A Leading Part In A New Play in Carlotta Festival Of New Plays, 2027.');
  });

  it('PLAYER JOURNEY: from the next casting, on 15 September 2027, the credit: On stage, the part, the production and its year; Your School goes to /workspace/school; a reload keeps it all, once', () => {
    const sim = ada('r8-a');
    sim.advanceTo(at(2027, 9, 15, 12));
    const { text } = drawn(sim, ProfileWorkspace);
    const journey = between(text, 'School Journey', 'Your Work So Far');
    expect(`${between(journey, 'School Journey', '. School')}.`).toBe('School Journey Year 2 of 3, academic warning How This Works On stage: A Leading Part In A New Play in Carlotta Festival Of New Plays, 2027.');
    press(button('School'));
    expect(h.went).toEqual(['/workspace/school']);
    expect(between(drawn(reload(sim), ProfileWorkspace).text, 'School Journey', 'Your Work So Far')).toBe(journey);
    expect(journey.split('On stage:').length - 1).toBe(1);
  });

  it('PLAYER JOURNEY: Your Work So Far is early days on a new life and, a year on, read from the pieces judged: their count, their kinds, and each line with what it rests on', () => {
    const fresh = ada('g32-work-so-far');
    expect(between(drawn(fresh, ProfileWorkspace).text, 'Your Work So Far', 'How This Works')).toBe('Your Work So Far Early days: 0 pieces judged. Patterns are named once 6 are.');
    const sim = ada('r8-a');
    sim.advanceTo(at(2027, 9, 15, 12));
    const shown = between(drawn(sim, ProfileWorkspace).text, 'Your Work So Far', 'Development History');
    const kept = sim.player.work!;
    expect(shown).toContain(`Your Work So Far From ${kept.length} pieces judged, the material you’ve met and the choices you’ve made`);
    expect(shown).toContain(`Range ${new Set(kept.map((w) => w.task)).size} kinds of work judged`);
    const id = identityOf(sim.player);
    expect(id.strengths.length + id.weaknesses.length).toBeGreaterThan(0);
    for (const x of [...id.strengths, ...id.weaknesses]) expect(shown).toContain(`${x.line} From: ${x.evidence.join('; ')}.`);
  });

  it('PLAYER JOURNEY: Development History, a year on, lists the latest fifteen changes newest first, and Show Earlier Changes lets thirty more in', () => {
    const sim = ada('r8-a');
    sim.advanceTo(at(2027, 9, 15, 12));
    const kept = developmentOf(sim.player).history;
    expect(kept).toHaveLength(400);
    let items = historyItems(drawn(sim, ProfileWorkspace).html);
    expect(items).toHaveLength(15);
    const latest = Math.max(...kept.map((x) => x.at));
    expect(items[0]!.startsWith(`${written(latest)}: `)).toBe(true);
    const dates = items.map((x) => Date.parse(x.split(': ')[0]!));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    press(button('Show Earlier Changes'));
    items = historyItems(drawn(sim, ProfileWorkspace).html);
    expect(items).toHaveLength(45);
  });
});

// ---------------------------------------------------------------------------
// h-head
// ---------------------------------------------------------------------------

describe('h-head: the head of Home', () => {
  const head = (sim: Simulation) => { const { text } = drawn(sim, Home); return text.slice(0, text.indexOf('Calendar')).trim(); };

  it('PLAYER JOURNEY: on the first morning it reads Monday, August 24, 2026 · Actress, Good Morning, Ada., and 7:30 AM in New Haven · EDT · Summer with the sky as it is; each opens its look, and none of it changes the save', () => {
    const sim = ada('g32-head');
    const before = serialise(sim.universe);
    const w = weatherAt(sim, NEW_HAVEN)!;
    const shown = head(sim);
    expect(shown.startsWith('Monday, August 24, 2026 · Actress Good Morning, Ada. 7:30 AM in New Haven · EDT · Summer · ')).toBe(true);
    expect(shown.endsWith(` ${w.temperature}°F ${w.condition}`)).toBe(true);
    // Each word is the way into its thing: pressed, the thing opens under the head.
    const looks: [string, string][] = [
      ['Monday, August 24, 2026', 'The Day Monday, August 24 Close It’s 7:30 AM in New Haven on Monday, August 24'],
      ['Actress', 'Yourself Ada Cole Close'],
      ['Ada', 'Yourself Ada Cole Close'],
      ['New Haven', 'Where You Live New Haven Close This is where you live. It’s 7:30 AM'],
      ['EDT', 'Where You Live New Haven Close'],
      ['Summer', 'Season Summer Close It’s summer in New Haven. Here it runs through June, July and August.'],
      [`${w.temperature}°F ${w.condition}`, `Weather Now Weather In New Haven Close It’s ${w.temperature}°F and ${w.condition.toLowerCase()} where you are, with a high of ${w.high}°F and a low of ${w.low}°F today.`],
    ];
    for (const [word, look] of looks) {
      h.given = new Map();
      drawn(sim, Home);
      press(button(word));
      expect(opened(drawn(sim, Home).html), word).toContain(look);
    }
    expect(serialise(sim.universe)).toBe(before);
  });

  it('PLAYER JOURNEY: the greeting follows the clock: Morning to 11:59, Afternoon from noon to 5:59, Evening from six, Night from midnight to 4:59, Morning again at five, and the date and time with it', () => {
    const sim = ada('g32-head-clock');
    const greeted = (hm: [number, number, number]) => {
      sim.advanceTo(at(2026, 8, hm[0], hm[1], hm[2]));
      return head(sim);
    };
    expect(greeted([24, 11, 59])).toContain('Good Morning, Ada. 11:59 AM in New Haven');
    expect(greeted([24, 12, 0])).toContain('Good Afternoon, Ada. 12:00 PM in New Haven');
    expect(greeted([24, 17, 59])).toContain('Good Afternoon, Ada. 5:59 PM');
    expect(greeted([24, 18, 0])).toContain('Good Evening, Ada. 6:00 PM');
    expect(greeted([24, 23, 59])).toContain('Good Evening, Ada. 11:59 PM');
    const midnight = greeted([25, 0, 0]);
    expect(midnight).toContain('Tuesday, August 25, 2026 · Actress Good Night, Ada. 12:00 AM');
    expect(greeted([25, 4, 59])).toContain('Good Night, Ada. 4:59 AM');
    expect(greeted([25, 5, 0])).toContain('Good Morning, Ada. 5:00 AM');
  });

  it('greets her by the name she goes by where it’s neither her full name nor her first and last, and by her first name otherwise; the noun is the pronouns’', () => {
    expect(head(ada('g32-head-addie', { displayName: 'Addie' }))).toContain('Good Morning, Addie.');
    expect(head(ada('g32-head-full', { middleName: 'Mae', displayName: 'Ada Mae Cole' }))).toContain('Good Morning, Ada.');
    expect(head(ada('g32-head-plain', { middleName: 'Mae', displayName: 'Ada Cole' }))).toContain('Good Morning, Ada.');
    const sam = head(ada('g32-head-sam', { firstName: 'Sam', lastName: 'Okafor', pronouns: 'he/him' }));
    expect(sam).toContain('Monday, August 24, 2026 · Actor Good Morning, Sam.');
  });

  it('in January in New Haven (a life made with quickSave, which begins on 5 January 2026: a student’s begins in August) the date, the zone and the season follow: Monday, January 5, 2026 · EST · Winter', () => {
    const sim = quickSave({ startLocationId: NEW_HAVEN, homeRegionId: NEW_HAVEN, livesWhereBorn: true, wealth: 'comfortable' }, 'g32-head-winter');
    const shown = head(sim);
    expect(shown.startsWith('Monday, January 5, 2026 · ')).toBe(true);
    expect(shown).toMatch(/ in New Haven · EST · Winter · /);
  });
});

// ---------------------------------------------------------------------------
// h-calendar
// ---------------------------------------------------------------------------

describe('h-calendar: the Calendar section of Home', () => {
  const calendar = (sim: Simulation) => between(drawn(sim, Home).text, 'Calendar', 'What Needs You');
  const plan = (sim: Simulation, payload: Record<string, unknown>) => sim.must<{ ok: boolean; id?: string; error?: string }>({ kind: 'calendar.schedule', payload });

  it('PLAYER JOURNEY: a plan made two days out is the next commitment with its time to go, its title and its date; a second is listed under it; called off, the day is hers; a time gone by is refused in its own words', () => {
    const sim = ada('g32-calendar');
    clearCalendar(sim); // TEST SETUP
    expect(calendar(sim)).toContain('No plans or commitments ahead. The day is yours.');
    const read = plan(sim, { title: 'table read', at: sim.now + 2 * MS_DAY, durationMinutes: 120 });
    expect(read.ok).toBe(true);
    let shown = calendar(sim);
    expect(shown.startsWith('Calendar What’s coming up, and when. Open Calendar How This Works in 2 days Table Read August 26, 2026 at 7:30 AM')).toBe(true);
    const coffee = plan(sim, { title: 'Coffee With Sam', at: sim.now + 3 * MS_DAY + 2 * MS_HOUR, durationMinutes: 60 });
    shown = calendar(sim);
    expect(shown).toContain('in 2 days Table Read August 26, 2026 at 7:30 AM');
    expect(shown).toContain('Coffee With Sam in 3d 2h');
    expect(shown.split('Table Read').length - 1).toBe(1);
    expect(shown.split('Coffee With Sam').length - 1).toBe(1);
    const late = plan(sim, { title: 'Too Late', at: sim.now - MS_HOUR });
    expect(late).toEqual({ ok: false, error: 'That time has already passed. Pick a time that’s still to come.' });
    expect(calendar(sim)).toBe(shown);
    expect(sim.must<{ ok: boolean }>({ kind: 'calendar.cancel', payload: { entryId: read.id } }).ok).toBe(true);
    expect(sim.must<{ ok: boolean }>({ kind: 'calendar.cancel', payload: { entryId: coffee.id } }).ok).toBe(true);
    shown = calendar(sim);
    expect(shown).toContain('No plans or commitments ahead. The day is yours.');
    expect(shown).not.toContain('Table Read');
    expect(shown).not.toContain('Coffee With Sam');
  });

  it('PLAYER JOURNEY: a call wanting her in Los Angeles is told on its own clock, 4:30 AM PDT, and that she’s not in Los Angeles; missed when it comes; one in New Haven is on the home clock with no zone', () => {
    const sim = ada('g32-calendar-la');
    clearCalendar(sim); // TEST SETUP
    // 7:30 AM in New Haven (UTC−4 in August) is 4:30 AM in Los Angeles (UTC−7).
    const call = plan(sim, { title: 'Call With The Agent', at: at(2026, 8, 27, 7, 30), durationMinutes: 30, locationId: 'us-ca-losangeles' });
    expect(calendar(sim)).toContain('Call With The Agent August 27, 2026 at 4:30 AM PDT · you’re not in Los Angeles');
    sim.advanceTo(at(2026, 8, 27, 8));
    expect(sim.timeline.get(call.id!)?.status).toBe('missed');
    // The notice gives the call’s own clock, as Home did. Until 2026-10-13 it gave the home clock with no zone, “at 7:30
    // AM”, and this held it (found by that day’s third round).
    expect(sim.universe.notifications.filter((n) => n.title === 'You Missed Call With The Agent').map((n) => n.body)).toEqual(['It was in Los Angeles at 4:30 AM PDT, and you were in New Haven. Missing a plan of your own costs nothing else.']);
    plan(sim, { title: 'Lunch With Theo', at: at(2026, 8, 28, 13), durationMinutes: 60 });
    const shown = calendar(sim);
    expect(shown).toContain('Lunch With Theo August 28, 2026 at 1:00 PM');
    expect(shown).not.toMatch(/1:00 PM E[DS]T/);
    expect(shown).not.toContain('you’re not in');
  });

  it('Open Calendar, pressed, goes to /workspace/calendar; a guided life keeps the section locked until “What’s Coming” is read, and the button until “Your Own Plans”', () => {
    const sim = ada('g32-calendar-open');
    drawn(sim, Home);
    press(button('Open Calendar'));
    expect(h.went).toEqual(['/workspace/calendar']);
    const guided = ada('g32-calendar-guided', { tutorial: true });
    const read = (id: string) => expect(guided.execute({ kind: 'tutorial.read', payload: { chapterId: id } }).ok, id).toBe(true);
    expect(drawn(guided, Home).text).toContain('Calendar Locked This opens when you read “What’s Coming” in the guide');
    read('welcome');
    read('calendar');
    const { text } = drawn(guided, Home);
    expect(text).not.toContain('Calendar Locked Opens with');
    expect(between(text, 'Calendar', 'What Needs You')).toContain('Open Calendar Locked');
    h.went = [];
    press(button('Open CalendarLocked'));
    expect(h.went).toEqual([]);
    for (const id of ['clock', 'advance', 'needs', 'body', 'sleep', 'looking-after', 'plans']) read(id);
    drawn(guided, Home);
    press(button('Open Calendar'));
    expect(h.went).toEqual(['/workspace/calendar']);
  });

  it('PLAYER JOURNEY: a plan holds across a save and a reload, on the calendar once', () => {
    const sim = ada('g32-calendar-reload');
    clearCalendar(sim); // TEST SETUP
    plan(sim, { title: 'Table Read', at: sim.now + 2 * MS_DAY, durationMinutes: 120 });
    const back = reload(sim);
    const shown = calendar(back);
    expect(shown).toContain('in 2 days Table Read August 26, 2026 at 7:30 AM');
    expect(shown.split('Table Read').length - 1).toBe(1);
    expect(back.universe.scheduled.filter((i) => i.label === 'Table Read' && i.status === 'pending')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// h-needs
// ---------------------------------------------------------------------------

describe('h-needs: What Needs You on Home', () => {
  const needs = (sim: Simulation) => between(drawn(sim, Home).text, 'What Needs You', 'How You Are');
  const unread = (sim: Simulation) => sim.universe.notifications.filter((n) => !n.read).length;
  const ALL_CLEAR = 'All Clear You owe nobody anything past due, the bank and the card are in order, and the calendar doesn’t clash. Go and do something you want to do.';
  /** The IRS's day for a 2026 return with wages: 15 April 2027 at 11:59 PM, Emancipation Day falling on the Friday after. */
  const APRIL_15 = at(2027, 4, 15, 23, 59);

  it('PLAYER JOURNEY: on 1 February 2027 her 2026 return is waiting: its title and when it’s due, its detail, its stripe and its buttons, the notices under it, and Mark N Read counting them; Go There goes where each says', () => {
    const sim = fromAbroad('g32-needs');
    sim.advanceTo(at(2027, 2, 1, 12));
    const r = returnsOf(sim.player)['2026']!;
    expect(r.due).toBe(APRIL_15);
    const decision = openDecisions(sim)[0]!;
    expect(openDecisions(sim)).toHaveLength(1);
    const n = unread(sim);
    expect(n).toBeGreaterThan(6);
    const { html } = drawn(sim, Home);
    const shown = needs(sim);
    // 15 April at 11:59 PM is 73 days and twelve hours on: two months, as a month is 30.44 days.
    expect(shown.startsWith(`What Needs You 1 open Mark ${n} Read How This Works Your 2026 Tax Return in 2 months ${decision.detail} File It Go There Dismiss`)).toBe(true);
    expect(decision.detail).toContain('File it by April 15, 2027.');
    // Urgency 70: past the 65 that's high, short of the 85 that's critical.
    expect(html.match(/data-urgency="\w+"/g)).toEqual(['data-urgency="high"']);
    expect(html.match(/<div class="list-item list-static">/g)).toHaveLength(6);
    drawn(sim, Home);
    press(button('Go There', 0));
    expect(h.went).toEqual(['/workspace/papers']);
    const newest = [...sim.universe.notifications].filter((x) => !x.read).sort((a, b) => b.importance - a.importance || b.at - a.at)[0]!;
    expect(newest.route).toBeDefined();
    press(button('Go There', 1));
    expect(h.went).toEqual(['/workspace/papers', newest.route]);
  });

  it('PLAYER JOURNEY: Dismiss and Mark N Read, pressed on the panel: the row goes, then the notices, and with nothing weighing it’s All Clear; a reload keeps it so, and the return still files', () => {
    const sim = fromAbroad('g32-needs');
    sim.advanceTo(at(2027, 2, 1, 12));
    const decision = openDecisions(sim)[0]!;
    const n = unread(sim);
    drawn(sim, Home);
    expect(press(button('Dismiss'))).toMatchObject({ ok: true, value: { dismissed: true } });
    expect(sim.universe.decisions[decision.id]!.dismissedAt).toBe(sim.now);
    let shown = needs(sim);
    expect(shown.startsWith(`What Needs You No questions are waiting on you. Mark ${n} Read`)).toBe(true);
    expect(shown).not.toContain('Your 2026 Tax Return');
    expect(shown).not.toContain('All Clear');
    expect(press(button(`Mark ${n} Read`))).toMatchObject({ ok: true, value: { read: n } });
    shown = needs(sim);
    expect(shown).toBe(`What Needs You No questions are waiting on you. How This Works ${ALL_CLEAR}`);
    const back = reload(sim);
    expect(needs(back)).toBe(shown);
    expect(openDecisions(back)).toHaveLength(0);
    expect(back.execute({ kind: 'tax.file', payload: { year: 2026 } }).ok).toBe(true);
  });

  /**
   * DEFECT (brief 13's interface playthroughs, 2026-10-17, `tools/playthroughs-ui.mjs normal`, Home's first morning): a
   * notice's or a question's title, pressed, opened its look under the year grouped as a count, "Welcome To The Class Of
   * 2,029" and "Your 2,026 Tax Return". The look's name grouped every run of four digits or more by thousands, a census
   * tract's reading, and each such run a title carries is a year.
   */
  it('PLAYER JOURNEY: the first morning’s Welcome To The Class Of 2029 and February’s Your 2026 Tax Return, each title pressed on Home, open their looks under the year as it’s written, never as a count', () => {
    const sim = fromAbroad('g32-needs');
    drawn(sim, Home);
    press(button('Welcome To The Class Of 2029'));
    let shown = needs(sim);
    expect(shown).toContain('Notice Welcome To The Class Of 2029 Close It came in');
    expect(shown).not.toContain('2,029');
    sim.advanceTo(at(2027, 2, 1, 12));
    h.given = new Map();
    drawn(sim, Home);
    press(button('Your 2026 Tax Return'));
    shown = needs(sim);
    expect(shown).toMatch(/ Your 2026 Tax Return Close /);
    expect(shown).not.toContain('2,026');
  });

  /**
   * DEFECT (brief 13's interface playthroughs, 2026-10-17, `tools/playthroughs-ui.mjs normal`, the first Saturday): the
   * panel drew the six heaviest unread notices and said nothing of the rest, and Mark N Read marked them all, so a notice
   * past the sixth was never on any screen. A new life has fourteen unread by its first Saturday, and The Courses And What
   * They Ask, the orientation session that sets the term's work, was the thirteenth.
   */
  it('PLAYER JOURNEY: more unread than the panel’s six: it says how many more wait and offers Show All; pressed, every one is drawn with its Go There, the seventh heaviest among them; Show The Heaviest Six puts it back; Mark N Read still marks every one', () => {
    const sim = fromAbroad('g32-needs');
    sim.advanceTo(at(2027, 2, 1, 12));
    const n = unread(sim);
    expect(n).toBeGreaterThan(6);
    const seventh = [...sim.universe.notifications].filter((x) => !x.read).sort((a, b) => b.importance - a.importance || b.at - a.at)[6]!;
    const rows = (html: string) => html.match(/<div class="list-item list-static">/g)?.length ?? 0;
    expect(rows(drawn(sim, Home).html)).toBe(6);
    expect(needs(sim)).toContain(`These six are the most important. ${n - 6} more are unread. Show All ${n}`);
    expect(needs(sim)).not.toContain(seventh.body);
    drawn(sim, Home);
    press(button(`Show All ${n}`));
    expect(rows(drawn(sim, Home).html)).toBe(n);
    expect(needs(sim)).toContain(seventh.body);
    expect(needs(sim)).toContain(`All ${n} unread, the most important first. Show The Six Most Important`);
    drawn(sim, Home);
    expect(h.buttons.filter((b) => b.text === 'Go There').length).toBe(1 + sim.universe.notifications.filter((x) => !x.read && x.route).length);
    press(button('Show The Six Most Important'));
    expect(rows(drawn(sim, Home).html)).toBe(6);
    expect(press(button(`Mark ${n} Read`))).toMatchObject({ ok: true, value: { read: n } });
    expect(rows(drawn(sim, Home).html)).toBe(0);
    expect(needs(sim)).not.toContain('more are unread');
  });

  it('PLAYER JOURNEY: File It, pressed in a guided life that hasn’t read “Cover, Benefits And Returns”, is refused in the guide’s words and the row stays; read, it files the return and pays what the row said was owed', () => {
    const sim = fromAbroad('g32-needs', { tutorial: true });
    const read = (id: string) => expect(sim.execute({ kind: 'tutorial.read', payload: { chapterId: id } }).ok, id).toBe(true);
    for (const id of ['welcome', 'calendar', 'clock', 'advance', 'needs']) read(id);
    sim.advanceTo(at(2027, 2, 1, 12));
    const decision = openDecisions(sim)[0]!;
    drawn(sim, Home);
    expect(press(button('File It'))).toEqual({ ok: false, error: 'Read “Cover, Benefits And Returns” in the guide first. The chapters open in order, and “How You Are” is next: press Guide, at the top of the screen.' });
    expect(needs(sim)).toContain(`Your 2026 Tax Return in 2 months ${decision.detail} File It Go There Dismiss`);
    expect(sim.universe.decisions[decision.id]!.resolvedAt).toBeUndefined();
    for (const id of ['body', 'sleep', 'looking-after', 'plans', 'weather', 'school', 'profile', 'papers']) read(id);
    const owed = returnsOf(sim.player)['2026']!.figures.balance;
    expect(decision.detail).toContain(`You owe $${(owed / 100).toFixed(2)}`);
    const checking = () => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const before = checking();
    drawn(sim, Home);
    expect(press(button('File It'))).toMatchObject({ ok: true, value: { ok: true } });
    expect(returnsOf(sim.player)['2026']!.filedAt).toBe(sim.now);
    expect(sim.universe.decisions[decision.id]!.resolvedAt).toBe(sim.now);
    expect(before - checking()).toBe(owed);
    expect(needs(sim)).not.toContain('Your 2026 Tax Return');
  });

  it('PLAYER JOURNEY: a return left unfiled past 15 April is Overdue in red at midnight, gone at the world’s look two days on, and then No Decisions Waiting says it’s past its day: what it owed and 5% for a month or part of one late (IRC §6651), across a reload', () => {
    const sim = fromAbroad('g32-needs');
    sim.advanceTo(APRIL_15 + 90_000);
    const r = returnsOf(sim.player)['2026']!;
    expect(r.filedAt).toBeUndefined();
    expect(r.figures.owedTo).toEqual({ irs: r.figures.balance, states: {} });
    const decision = openDecisions(sim)[0]!;
    expect(decision.title).toBe('Your 2026 Tax Return');
    const { html } = drawn(sim, Home);
    expect(needs(sim)).toContain('Your 2026 Tax Return Overdue');
    expect(html).toContain('<span class="xs negative"><button type="button" class="link" aria-expanded="false">Overdue</button></span>');
    drawn(sim, Home);
    press(button(/^Mark \d+ Read$/));
    sim.advanceTo(at(2027, 4, 18, 12));
    expect(sim.universe.decisions[decision.id]!.resolvedAt).toBeDefined();
    expect(openDecisions(sim)).toHaveLength(0);
    sim.must({ kind: 'world.mark_read', payload: {} });
    // 4.5% for filing late and 0.5% for paying late, the first month or part of one: 5% of what it owed, to the dollar.
    const late = `$${Math.round((r.figures.balance * 1.05) / 100)}`;
    const said = `What Needs You No questions are waiting on you. How This Works No Questions Waiting A tax return is past its due date and not filed yet. You owe ${late}, including the penalty so far.`;
    expect(needs(sim)).toBe(said);
    expect(needs(reload(sim))).toBe(said);
  });

  describe('what weighs once nothing is open or unread, each in its own sentence', () => {
    /** A new life with its welcome read on the panel, All Clear: the falsifiability test's other side. */
    const clear = (seed: string) => {
      const sim = ada(seed);
      drawn(sim, Home);
      press(button('Mark 1 Read'));
      expect(needs(sim)).toContain(ALL_CLEAR);
      return sim;
    };
    const weighs = (sim: Simulation) => needs(sim).replace('What Needs You No questions are waiting on you. How This Works ', '');
    /** TEST SETUP: an account set to a balance by a posting against a test equity line, as tests/defects-g18-1.test.ts sets one. */
    const setBalance = (sim: Simulation, id: string, to: number) => {
      const a = sim.universe.accounts[id]!;
      sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: id, amount: to - a.balance }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: a.balance - to }] });
    };
    /** TEST SETUP: a debt of a kind, opened as the engine opens one, owing so much. */
    const debt = (sim: Simulation, category: string, name: string, owed: number) => {
      const a = sim.openAccount({ id: sim.nextId('account'), kind: 'loan', category, name, ownerId: sim.player.id, institution: 'TEST SETUP', openedAt: sim.now } as never);
      setBalance(sim, a.id, -owed);
    };
    const card = (sim: Simulation) => cardsOf(sim, sim.player)[0]!;

    it('something gone unpaid: You owe $120 that went unpaid.', () => {
      const sim = clear('g32-weigh-owed');
      debt(sim, 'arrears', 'Bills Owed', 120_00); // TEST SETUP
      expect(weighs(sim)).toBe('No Questions Waiting You owe $120 that went unpaid.');
    });

    it('the current account overdrawn: Your current account is $250 overdrawn.', () => {
      const sim = clear('g32-weigh-overdrawn');
      setBalance(sim, sim.player.primaryAccountId!, -250_00); // TEST SETUP
      expect(weighs(sim)).toBe('No Questions Waiting Your account is $250 overdrawn.');
    });

    it('the card at nine-tenths of its limit and over: Your card is nearly at its limit, owing $59,000; under it, nothing', () => {
      const sim = clear('g32-weigh-card');
      // The wealthy profile's 60,000 € limit at SLATE's 0.92 to the dollar: $65,217; nine-tenths of it $58,695.30.
      expect(card(sim).creditLimit).toBe(65_217_00);
      setBalance(sim, card(sim).id, -58_000_00); // TEST SETUP
      expect(weighs(sim)).toBe(ALL_CLEAR);
      setBalance(sim, card(sim).id, -59_000_00); // TEST SETUP
      expect(weighs(sim)).toBe('No Questions Waiting Your card is nearly at its limit, owing $59,000.');
    });

    it('the card behind: a payment, and suspended', () => {
      const sim = clear('g32-weigh-behind');
      setBalance(sim, card(sim).id, -500_00); // TEST SETUP
      expect(weighs(sim)).toBe(ALL_CLEAR);
      Object.assign(sim.player.credit!, { missed: 1 }); // TEST SETUP
      expect(weighs(sim)).toBe('No Questions Waiting Your card is a payment behind, owing $500.');
      // Until 2026-10-13 two missed and unsuspended read “Your card is 2 payments behind”, set here by hand: no played life
      // reaches it, the second miss suspending the card (`SUSPEND_AFTER`), and the words went.
      Object.assign(sim.player.credit!, { missed: 0, suspended: true }); // TEST SETUP
      expect(weighs(sim)).toBe('No Questions Waiting Your card is suspended, owing $500.');
    });

    it('PLAYER JOURNEY: with a second card, applied for at Capital One and arrived a week on, the card behind is named: The Platinum from Capital One is a payment behind', () => {
      const sim = ada('g32-weigh-two-cards');
      expect(sim.must<{ approved: boolean }>({ kind: 'card.apply', payload: { bankId: 'us-capital-one' } }).approved).toBe(true);
      sim.advanceTo(sim.now + 8 * MS_DAY);
      const cards = cardsOf(sim, sim.player);
      expect(cards.map((c) => c.name)).toEqual(['Chase Freedom Unlimited', 'Platinum from Capital One']);
      sim.must({ kind: 'world.mark_read', payload: {} });
      expect(weighs(sim)).toBe(ALL_CLEAR);
      setBalance(sim, cards[1]!.id, -80_00); // TEST SETUP
      Object.assign(sim.player.credit!.cards![cards[1]!.id]!, { missed: 1 }); // TEST SETUP
      expect(weighs(sim)).toBe('No Questions Waiting The Platinum from Capital One is a payment behind, owing $80.');
    });

    it('medical care owed, and a debt with collections', () => {
      const sim = clear('g32-weigh-medical');
      debt(sim, 'medical', 'Owed For Medical Care', 350_00); // TEST SETUP
      expect(weighs(sim)).toBe('No Questions Waiting You owe $350 for medical care.');
      debt(sim, 'collections', 'In Collections', 800_00); // TEST SETUP
      expect(weighs(sim)).toBe('No Questions Waiting You owe $350 for medical care. $800 you owe is with a collection agency.');
    });

    it('income tax owed on a return filed: You owe $1,234 of income tax.', () => {
      const sim = clear('g32-weigh-tax');
      // TEST SETUP: a 2026 return filed before its day, $1,234 of it owed and nothing charged on it yet.
      returnsOf(sim.player)['2026'] = { year: 2026, due: APRIL_15, filedAt: sim.now, figures: { income: 50_000_00, balance: 1_234_00, owedTo: { irs: 1_234_00, states: {} } }, owed: 1_234_00, parts: { tax: 1_234_00, penalty: 0, interest: 0 }, base: 1_234_00, accruedAt: sim.now } as unknown as TaxReturn;
      expect(weighs(sim)).toBe('No Questions Waiting You owe $1,234 of income tax.');
    });

    it('PLAYER JOURNEY: two of her plans a week out wanting her at once: the calendar clashes; the same two a month and a day out don’t weigh yet', () => {
      const sim = clear('g32-weigh-clash');
      sim.must({ kind: 'calendar.schedule', payload: { title: 'Rehearsal With Theo', at: at(2026, 8, 31, 19), durationMinutes: 120 } });
      sim.must({ kind: 'calendar.schedule', payload: { title: 'Dinner With Sam', at: at(2026, 8, 31, 20), durationMinutes: 60 } });
      expect(weighs(sim)).toBe('No Questions Waiting Two things on your calendar in the next month are at the same time.');
      const later = clear('g32-weigh-clash-later');
      later.must({ kind: 'calendar.schedule', payload: { title: 'Rehearsal With Theo', at: at(2026, 9, 24, 19), durationMinutes: 120 } });
      later.must({ kind: 'calendar.schedule', payload: { title: 'Dinner With Sam', at: at(2026, 9, 24, 20), durationMinutes: 60 } });
      expect(weighs(later)).toBe(ALL_CLEAR);
    });
  });

  it('more than six questions: six rows and 1 more waiting, an overdue one first, the stripes at 85 and 65, and Go There only where a row has somewhere to go (TEST SETUP: raised through requireDecision, as a raiser raises one; a life reaches three kinds, never seven at once)', () => {
    const sim = ada('g32-needs-many');
    sim.must({ kind: 'world.mark_read', payload: {} });
    const urgencies = [90, 85, 84, 65, 64, 50, 40];
    urgencies.forEach((urgency, i) => sim.requireDecision({
      urgency, category: 'test', title: `question ${i + 1}`, detail: `Detail ${i + 1}.`, refType: 'test', refId: String(i),
      // Every row is dated (from 2026-10-14, when requireDecision took no row without one): the fifth past its date, the
      // rest thirty days on, so the order past the overdue one is the urgency's.
      ...(i === 0 ? { route: '/workspace/bank' } : {}), dueAt: i === 4 ? sim.now - MS_HOUR : sim.now + 30 * MS_DAY,
    }));
    const { html } = drawn(sim, Home);
    const shown = needs(sim);
    expect(shown).toContain('What Needs You 7 open');
    // The overdue one first, then by urgency; the seventh not drawn.
    expect([...shown.matchAll(/Question (\d)/g)].map((m) => m[1])).toEqual(['5', '1', '2', '3', '4', '6']);
    expect(shown).toContain('Question 5 Overdue Detail 5.');
    expect(html.match(/data-urgency="\w+"/g)).toEqual(['normal', 'critical', 'critical', 'high', 'high', 'normal'].map((u) => `data-urgency="${u}"`));
    expect(shown).toContain('1 more waiting. Each one comes up here as one above it closes.');
    expect(h.buttons.filter((b) => b.text === 'Go There')).toHaveLength(1);
    press(button('Go There'));
    expect(h.went).toEqual(['/workspace/bank']);
    expect(h.buttons.filter((b) => b.text === 'Dismiss')).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// h-how
// ---------------------------------------------------------------------------

describe('h-how: How You Are on Home', () => {
  const how = (sim: Simulation) => between(drawn(sim, Home).text, 'How You Are', 'Where You Are');

  it('PLAYER JOURNEY: on the first morning it reads Rested, steady and ready for a real day. and three meters at the dials’ own figures: Energy 82, Stress 18, Readiness 79 worked out by hand', () => {
    const sim = ada('g32-how');
    const w = sim.player.wellbeing;
    expect(w).toMatchObject({ energy: 82, stress: 18, sleepDebt: 0, nourishment: 75, morale: 62, hygiene: 80, condition: 88 });
    // 1.024 × 1.030 × 1.05 × 0.9825 × 1.006 × 1.008 × 0.964 = 1.06364, over 1.35: 78.79.
    expect(Math.round(byHand(w))).toBe(79);
    const { html } = drawn(sim, Home);
    expect(how(sim)).toBe('How You Are How This Works Rested, steady and ready for a real day. Energy 82 Stress 18 Readiness 79');
    expect(meter(html, 'Energy')).toEqual({ tone: 'positive', now: 82 });
    expect(meter(html, 'Stress')).toEqual({ tone: 'positive', now: 18 });
    expect(meter(html, 'Readiness')).toEqual({ tone: 'positive', now: 79 });
  });

  it('PLAYER JOURNEY: a meal, eaten through Look After Yourself, fills her and the meters move: Readiness to what the dials then make it, and up', () => {
    const sim = ada('g32-how-meal');
    const before = meter(drawn(sim, Home).html, 'Readiness').now;
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } }).ok).toBe(true);
    const w = sim.player.wellbeing;
    expect(w.nourishment).toBe(100);
    const { html } = drawn(sim, Home);
    expect(meter(html, 'Readiness').now).toBe(Math.round(byHand(w)));
    expect(meter(html, 'Readiness').now).toBeGreaterThan(before);
    expect(meter(html, 'Energy').now).toBe(Math.round(w.energy));
    expect(meter(html, 'Stress').now).toBe(Math.round(w.stress));
  });

  it('Energy is red under 15 and amber the fifteen above it; Stress red over 75 and amber the fifteen under; each summary said for the dial that’s out (TEST SETUP: the dials set by hand at each line)', () => {
    const sim = ada('g32-how-lines');
    const shown = (set: Partial<Wellbeing>) => { dials(sim, set); const { html } = drawn(sim, Home); return { html, summary: between(how(sim), 'How This Works', 'Energy').replace('How This Works ', '') }; };
    let s = shown({ energy: 14.6 });
    expect(meter(s.html, 'Energy')).toEqual({ tone: 'negative', now: 15 });
    expect(s.summary).toBe('Running on empty. You need sleep before anything else.');
    expect(meter(shown({ energy: 15 }).html, 'Energy').tone).toBe('warning');
    expect(meter(shown({ energy: 29.9 }).html, 'Energy')).toEqual({ tone: 'warning', now: 30 });
    expect(meter(shown({ energy: 30 }).html, 'Energy').tone).toBe('positive');
    s = shown({ stress: 75.4 });
    expect(meter(s.html, 'Stress')).toEqual({ tone: 'negative', now: 75 });
    expect(meter(shown({ stress: 75 }).html, 'Stress').tone).toBe('warning');
    expect(meter(shown({ stress: 60.5 }).html, 'Stress').tone).toBe('warning');
    expect(meter(shown({ stress: 60 }).html, 'Stress').tone).toBe('positive');
    expect(shown({ sleepDebt: 21 }).summary).toBe('Badly short on sleep. Everything is harder than it should be.');
    expect(shown({ stress: 79 }).summary).toBe('Stretched very thin. Something is going to give.');
    expect(shown({ nourishment: 24 }).summary).toBe('Hungry, and it’s starting to show.');
    expect(shown({ energy: 70, morale: 29 }).summary).toBe('Feeling low, though the day itself is going fine.');
    expect(shown({ energy: 70, stress: 40 }).summary).toBe('Holding up, with nothing out of the ordinary to worry about.');
    // Readiness has no line of its own: red under a quarter, amber under a half. Every dial at its worst is
    // 0.45 × 0.62 × 0.66 × 0.78 × 0.82 × 0.92 × 0.7 = 0.07585, over 1.35: 5.6, red; at 40 by hand, amber.
    s = shown({ energy: 0, stress: 100, sleepDebt: 30, nourishment: 0, morale: 0, hygiene: 0, condition: 0 });
    expect(Math.round(byHand(sim.player.wellbeing))).toBe(6);
    expect(meter(s.html, 'Readiness')).toEqual({ tone: 'negative', now: 6 });
    s = shown({ energy: 10, stress: 60, sleepDebt: 10 });
    expect(byHand(sim.player.wellbeing)).toBeGreaterThanOrEqual(25);
    expect(byHand(sim.player.wellbeing)).toBeLessThan(50);
    expect(meter(s.html, 'Readiness')).toEqual({ tone: 'warning', now: Math.round(byHand(sim.player.wellbeing)) });
  });

  it('PLAYER JOURNEY: each meter opens its look at the same figure: Readiness How Well You Would Do Today at 79, Energy One Of Eight at 82, Stress at 18; looking changes nothing', () => {
    const sim = ada('g32-how-looks');
    const before = serialise(sim.universe);
    const looks: [string, string][] = [
      ['Readiness', 'How Ready You Are Today Readiness Close 79.'],
      ['Energy', 'Your Wellbeing Energy Close 82.'],
      ['Stress', 'Stress Close 18'],
    ];
    for (const [label, look] of looks) {
      h.given = new Map();
      drawn(sim, Home);
      press(button(label));
      expect(opened(drawn(sim, Home).html), label).toContain(look);
    }
    expect(serialise(sim.universe)).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// h-where-weather
// ---------------------------------------------------------------------------

describe('h-where-weather: Where You Are and the Weather on Home', () => {
  const where = (text: string) => between(text, 'Where You Are', 'Its money, costs, taxes and languages');
  const weather = (text: string) => between(text, 'Weather How This Works', 'Your Affairs');
  /**
   * Sunrise and sunset by the sunrise equation (Wikipedia, "Sunrise equation", its complete calculation), with the
   * sun's center 0.833° under the horizon: not the NOAA series `core/sun.ts` sums. Each to the minute, in UTC.
   */
  function sunByHand(year: number, month: number, day: number, lat: number, lon: number): { rise: number; set: number } {
    const rad = Math.PI / 180;
    const n = Math.round(Date.UTC(year, month - 1, day, 12) / MS_DAY + 2440587.5 - 2451545.0);
    const js = n - lon / 360;
    const m = (357.5291 + 0.98560028 * js) % 360;
    const c = 1.9148 * Math.sin(m * rad) + 0.02 * Math.sin(2 * m * rad) + 0.0003 * Math.sin(3 * m * rad);
    const lambda = (m + c + 180 + 102.9372) % 360;
    const transit = 2451545.0 + js + 0.0053 * Math.sin(m * rad) - 0.0069 * Math.sin(2 * lambda * rad);
    const decl = Math.asin(Math.sin(lambda * rad) * Math.sin(23.4397 * rad));
    const w = Math.acos((Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl))) / rad;
    const toMs = (jd: number) => (jd - 2440587.5) * MS_DAY;
    return { rise: toMs(transit - w / 360), set: toMs(transit + w / 360) };
  }
  /** Minutes past midnight on a clock 4 hours behind UTC, as New Haven's is in August. */
  const edtMinutes = (utc: number) => { const d = new Date(utc - 4 * MS_HOUR); return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60; };
  const clockMinutes = (said: string) => { const [, hh, mm, half] = said.match(/^(\d+):(\d+) ([AP]M)$/)!; return (Number(hh) % 12 + (half === 'PM' ? 12 : 0)) * 60 + Number(mm); };

  it('PLAYER JOURNEY: on the first morning Where You Are names New Haven, Connecticut · United States, says Home. 130K people., Local Time 7:30 AM EDT, and Daylight within two minutes of the sunrise equation’s at each end', () => {
    const sim = ada('g32-where');
    const shown = where(drawn(sim, Home).text);
    // 130,322 people, to the thousand.
    expect(shown.startsWith('Where You Are How This Works New Haven, Connecticut · United States Your home. 130K people. Local Time 7:30 AM EDT Daylight ')).toBe(true);
    const [, rise, set, hours, minutes] = shown.match(/Daylight (\d+:\d+ AM) – (\d+:\d+ PM) (\d+)h (\d+)m of daylight$/)!;
    // New Haven at 41.3081° N, 72.9282° W.
    const sun = sunByHand(2026, 8, 24, 41.3081, -72.9282);
    expect(Math.abs(clockMinutes(rise!) - edtMinutes(sun.rise))).toBeLessThanOrEqual(2);
    expect(Math.abs(clockMinutes(set!) - edtMinutes(sun.set))).toBeLessThanOrEqual(2);
    expect(Math.abs(Number(hours) * 60 + Number(minutes) - (sun.set - sun.rise) / 60_000)).toBeLessThanOrEqual(4);
    // Each name opens its place: the region and the country under it.
    for (const name of ['Connecticut', 'United States']) {
      h.given = new Map();
      drawn(sim, Home);
      press(button(name));
      expect(opened(drawn(sim, Home).html), name).toContain(name);
    }
  });

  it('PLAYER JOURNEY: the Weather is the sky now in °F with its high and low, humidity, the wind in miles an hour, the climate, and the five days ahead; the next morning, Tuesday is what the strip said, and the strip begins on Wednesday', () => {
    const sim = ada('g32-weather');
    const w = weatherAt(sim, NEW_HAVEN)!;
    // A kilometer is 0.621371 of a mile. The sky's picture before the figure is for the eye alone (aria-hidden).
    const said = weather(drawn(sim, Home).text);
    expect(said.replace(/^Weather How This Works \S+ /, '').startsWith(`${w.temperature}°F ${w.condition} · High ${w.high}°F · Low ${w.low}°F Humidity ${w.humidity}% · Wind ${Math.round(w.windKph * 0.621371)} mph · Continental `)).toBe(true);
    const strip = [...said.matchAll(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \S+(?: \S+)? (\d+)° \/ (\d+)°/g)].map((m) => ({ day: m[1], high: Number(m[2]), low: Number(m[3]) }));
    expect(strip.map((d) => d.day)).toEqual(['Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(strip.map(({ high, low }) => ({ high, low }))).toEqual(forecastFor(sim, NEW_HAVEN, 6).slice(1).map(({ high, low }) => ({ high, low })));
    sim.advanceTo(at(2026, 8, 25, 7, 30));
    const tuesday = weather(drawn(sim, Home).text);
    expect(tuesday).toContain(`High ${strip[0]!.high}°F · Low ${strip[0]!.low}°F`);
    expect([...tuesday.matchAll(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun) /g)].map((m) => m[1])).toEqual(['Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('PLAYER JOURNEY: a day in the strip opens its forecast: Tue opens Tomorrow Tuesday, its low to its high', () => {
    const sim = ada('g32-weather-day');
    const tue = forecastFor(sim, NEW_HAVEN, 6)[1]!;
    drawn(sim, Home);
    press(button('Tue'));
    const look = opened(drawn(sim, Home).html);
    expect(look).toMatch(new RegExp(`Tomorrow Tuesday Close [A-Z][a-z ]+ in New Haven tomorrow, ${tue.low}°F to ${tue.high}°F\\.`));
  });

  it('Home profiles where she is: a life in London (quickSave: no student’s life is lived there) reads London, England · United Kingdom, Home. with the city’s own tags, 7:30 AM GMT, its short January daylight by the sunrise equation, and the sky in °C with the wind in km/h', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'comfortable' }, 'g32-london');
    expect(zonedParts(sim.now, 'Europe/London')).toMatchObject({ year: 2026, month: 1, day: 5, hour: 7, minute: 30 });
    const { text } = drawn(sim, Home);
    const w = weatherAt(sim, 'uk-eng-london')!;
    const shown = where(text);
    // Tags where SLATE keeps them, in place of the kind and the size New Haven reads; "Theater" as the player reads it
    // (until 2026-10-13 the tag was spelled the British way, and this read it so).
    expect(shown.startsWith('Where You Are How This Works London, England · United Kingdom Your home. Theater · Production Hub · International. Local Time 7:30 AM GMT Daylight ')).toBe(true);
    // London at 51.51° N, 0.13° W, its January clock on UTC.
    const [, rise, set] = shown.match(/Daylight (\d+:\d+ AM) – (\d+:\d+ PM) /)!;
    const sun = sunByHand(2026, 1, 5, 51.51, -0.13);
    const gmtMinutes = (utc: number) => { const d = new Date(utc); return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60; };
    expect(Math.abs(clockMinutes(rise!) - gmtMinutes(sun.rise))).toBeLessThanOrEqual(2);
    expect(Math.abs(clockMinutes(set!) - gmtMinutes(sun.set))).toBeLessThanOrEqual(2);
    expect(weather(text).replace(/^Weather How This Works \S+ /, '').startsWith(`${w.temperature}°C ${w.condition} · High ${w.high}°C · Low ${w.low}°C Humidity ${w.humidity}% · Wind ${w.windKph} km/h · `)).toBe(true);
  });
});
