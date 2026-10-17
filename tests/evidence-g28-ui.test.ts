/**
 * Evidence for seven creation rows the review of 2026-10-13 left partial (verification group g28-ui): four of the
 * Dispositions sliders, the trait buttons, the genre chips and Your Body. The review found each one stored and said back,
 * and its consequence held only by a fixture: a reader called on a hand-built person, a field set after creation, or a
 * source scan of the page. Here every one is set the way a player sets it, on creation's own screens rendered with
 * react-dom/server, its slider, button, chip or field pressed through its own handler, Begin pressed, and the life made
 * from what Begin hands on as `SlateApp` makes it; and every consequence comes by a command (`sim.execute`/`sim.must`)
 * or by the clock (`sim.advanceTo`), in twin lives made alike but for the one thing chosen, and is read where the row
 * says it's read. The figures are the rules' own numbers worked here by hand and written as literals, never the
 * constant or the helper the engine computes them with.
 *
 * - c-disp-riskTolerance: 66 slid on the page starts the card's autopay on the minimum and 65 in full, with nothing
 *   edited after Begin, and the page, the Review, the Profile and the card all say so. Then the same groceries on the
 *   card each midnight: on Sunday 11 October the minimum life's autopay pays Chase's $40.00 floor of a $270.00
 *   statement, the card carries a balance from then on, its October statement is $270 − $40 + $300 = $530.00, and the
 *   November statement charges interest inside Chase's published 18.24% to 27.74%; the life at 65 pays $270.00 and
 *   $300.00 whole and is charged nothing. Across a save and a load, the interest is charged once.
 * - c-disp-extraversion: the first Cabaret curtain, 8 PM Thursday 24 September, adds a student at 50 the nerves'
 *   6 × (1 − composure/100) of stress, one at 5 that and 3.6 more and one at 95 that less 3.6 (DISPOSED.room 4 × 0.9):
 *   7.2 between the two ends, the same across a save and a load.
 * - c-disp-openness: the Cabaret's read-through, 6 PM Friday 11 September, and the Carlotta Festival's, 3 PM Tuesday
 *   13 April 2027, each lift an open student (95) 1.8 more than one at 50 and a conventional one (5) 1.8 less, stress
 *   alike; the festival's curtain, which the page's "rehearsing new work" leaves out, reads no openness. Of the review's
 *   other two findings, `WorkDay.away` was read and never set until it went on 2026-10-13, and the Cabaret's curtain
 *   read openness where the page says rehearsing until 2026-10-13, when it stopped (tests/evidence2-b10.test.ts,
 *   c-disp-openness).
 * - c-disp-agreeableness: Drama 50's first meeting, 3 PM Tuesday 8 September, takes 1.8 off a blunt student's morale
 *   (5), gives an accommodating one (95) 1.8 and one at 50 nothing, across a save and a load; the Cabaret's read-through
 *   the same 3.6 apart.
 * - c-traits: Early Riser held grays Night Owl with "Can’t be held with Early Riser."; four held gray every other button,
 *   a clashing one with its clash and the other twenty-seven with "You already hold four traits."; one put down opens
 *   them again; Begin makes the life with the four the page held, and the Review, the Profile and the looks say them
 *   back. createSave refuses what the page refuses. Frugal pressed on the page makes the first meal $4.29 where a plain
 *   twin's is $5.00, and lifts her mood 1.718 where the twin's lifts 2 (`mealMood`, the one knob no other evidence file
 *   reaches). And every knob a trait declares moves for a life made with it. The review's other finding stays open:
 *   tests/personality.test.ts still holds the declared knobs to a typed list, and `receipts` read nothing a student did
 *   until it went on 2026-10-14.
 * - c-genres: the 149 chips, the 17 a play's kinds name unmarked and the rest marked ·, a chip pressed, Select All and
 *   Clear These, Review and the Profile. Then, at a second-year's every call that reads a kind (a Rep understudy
 *   rehearsal, a thesis read-through, a night sent on as an understudy, a thesis curtain, the understudies'
 *   run-through), a life loving a kind of that play has 1.5 more morale and 1.5 less stress than an unread genre's
 *   twin, and a life loving a kind of the other play nothing: the engine fix of 2026-10-13 for the nights included.
 *   Eight days with rehearsals of one play, lived by the clock alone: its lover's days differ, and an unread genre's
 *   days are a no-genre life's to the last figure, where tests/traits-connected.test.ts's week had no call to read one.
 * - c-body: a height or a weight alone, or either out of range, gives the body drawn from the birthplace; both in range
 *   are kept; a run on the first morning takes (9.3 − 1.4) MET × the weight × 1 hour off at the first midnight, at Hall's
 *   23.9 kcal a kilogram a day over a 365-day half-life (12,585 kcal a kilogram), so a given weight changes the result;
 *   and Your Body says at once when a figure is out of range or one is missing, in feet and pounds for a New Yorker and
 *   in centimeters and kilograms for a Londoner.
 *
 * PLAYER JOURNEYS: a new life (`newLifeConfig`), Ada Cole, born in New York (the birthplace a player picks on Identity,
 * which `newLifeConfig` leaves empty) and an actor at Yale in New Haven from Monday 24 August 2026; born in London where
 * the row is about the fields in centimeters. Creation is rendered step by step as the player has it, each step drawn
 * from the config the last one's controls made, "I Know SLATE." chosen on Review and Begin pressed. The screens after
 * Begin are rendered with react-dom/server, `useGame` standing in for the provider, which needs a browser. The seeds
 * were chosen for what the clock draws on them, as a player's own life draws it: g28-body for a first-morning run and
 * not a gym, g28-oncall-5 for a night sent on as an understudy in October 2027.
 *
 * TEST SETUP, said again where it's done: the day's dials each six hours (`tended`), so the clock's consequences are
 * what's measured; the coursework done each midnight (`working`), so a student stays in good standing to the second
 * year's Rep; the calendar cleared and hunger set before a meal; and on the screen, the step and the config each step
 * is drawn from, which a static render can't click its way to.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { ScheduledItem } from '@/engine/core/scheduler';
import type { Personality } from '@/engine/domain/model';
import { MS_DAY, MS_HOUR, MS_MINUTE } from '@/engine/core/time';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { personalityOf } from '@/engine/systems/personality';
import { CABARET_KIND, CALL_KIND, LAB_KIND } from '@/engine/systems/school';
import { cardOf } from '@/engine/systems/credit';
import { courseworkOf } from '@/engine/systems/coursework';
import { PREP_DIMS } from '@/engine/content/coursework';
import { FILM_GENRES } from '@/engine/content/film-genres';
import { PERSONALITY_TRAITS, type PersonalityKnob } from '@/engine/content/personality-traits';
import { genresOfPlay } from '@/engine/content/plays';

type Control = { type: string; props: Record<string, unknown>; text: string; first: string; why: string };

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what the first useStates start at, in render order, in place of their own initial values. */
  states: [] as unknown[],
  /** What each setter was handed: a pressed control's own update, applied by the test to the config it was drawn from. */
  sets: [] as unknown[],
  controls: [] as { type: string; props: Record<string, unknown>; text: string; first: string; why: string }[],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value] = real.useState(initial);
    const v = h.states.length > 0 ? h.states.shift() : value;
    return [v, (next: unknown) => { h.sets.push(next); }];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

/** Every button and input the screens draw, with its words and its own handlers. */
const textOf = (c: unknown): string => (c == null || typeof c === 'boolean' ? '' : Array.isArray(c) ? c.map(textOf).join('') : typeof c === 'object' ? textOf((c as { props?: { children?: unknown } }).props?.children) : String(c));
const keepControls = (real: Record<string, unknown>) => {
  const grab = (make: (...a: unknown[]) => unknown) => (type: unknown, props: Record<string, unknown> | null, ...rest: unknown[]) => {
    if ((type === 'button' || type === 'input') && props) {
      const kids = props.children;
      h.controls.push({ type, props, text: textOf(kids), first: textOf(Array.isArray(kids) ? kids[0] : kids), why: Array.isArray(kids) ? textOf(kids[3]) : '' });
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

const { CharacterCreation } = await import('@/ui/creation/CharacterCreation');
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { BankCard } = await import('@/ui/bank/BankCard');
const { at } = await import('@/ui/looks');
const { resolveLook } = await import('@/ui/looks/registry');

// ---------------------------------------------------------------------------------------------------------------------
// Lives, the clock, and the screens over them
// ---------------------------------------------------------------------------------------------------------------------

/** Ada, as Identity leaves her: born in New York, named, she/her; everything else as a new life begins. */
const ada = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const student = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation => createSave(1, seed, ada(extra));
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** An instant in New Haven on Eastern Daylight Time (UTC−4), worked out here, not by the engine. */
const EDT = (year: number, month: number, day: number, hour: number, minute = 0): number => Date.UTC(year, month - 1, day, hour + 4, minute);
/** And on Eastern Standard Time (UTC−5). */
const EST = (year: number, month: number, day: number, hour: number, minute = 0): number => Date.UTC(year, month - 1, day, hour + 5, minute);

/** TEST SETUP: the clock moved six hours at a time with the body kept fed, rested and awake, as a player's meals and sleep keep it. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}
/** TEST SETUP: the coursework done each midnight, as a student who prepares keeps it, so the standing stays good. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
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

/** What the player reads: the markup with every tag taken out and its entities read. */
const onScreen = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  // A tag closed before a stop leaves a space the reader doesn't see.
  .replace(/ ([.,;:])/g, '$1');

const STEP = { dispositions: 1, genres: 2, starting: 3, review: 4 } as const;
interface Screen { text: string; controls: Control[]; started: () => NewSaveConfig | undefined }

/** A step of creation as the player has it, drawn from a config. */
function creation(step: number, config: NewSaveConfig): Screen {
  // TEST SETUP: CharacterCreation's first two states in render order, the step and the config: a static render can't
  // click its way from one step to the next, so each step is drawn from the config the last one's controls made.
  h.states = [step, config];
  h.controls = [];
  let started: NewSaveConfig | undefined;
  const html = renderToStaticMarkup(createElement(CharacterCreation, { slot: 1 as never, onCancel: () => undefined, onStart: (c: NewSaveConfig) => { started = c; } }));
  expect(h.states).toHaveLength(0);
  return { text: onScreen(html), controls: [...h.controls], started: () => started };
}
const buttonOf = (s: Screen, first: string): Control => {
  const found = s.controls.find((c) => c.type === 'button' && c.first === first);
  expect(found, `a button “${first}”`).toBeDefined();
  return found!;
};
const inputOf = (s: Screen, id: string): Control => {
  const found = s.controls.find((c) => c.type === 'input' && c.props.id === id);
  expect(found, `an input #${id}`).toBeDefined();
  return found!;
};
/** A control's own handler run, and the config its setter was handed, applied to the config the screen was drawn from. */
function after(config: NewSaveConfig, act: () => void): NewSaveConfig {
  h.sets = [];
  act();
  expect(h.sets).toHaveLength(1);
  const next = h.sets[0];
  return typeof next === 'function' ? (next as (c: NewSaveConfig) => NewSaveConfig)(config) : next as NewSaveConfig;
}
const press = (config: NewSaveConfig, s: Screen, first: string) => after(config, () => (buttonOf(s, first).props.onClick as () => void)());
const typeInto = (config: NewSaveConfig, s: Screen, id: string, value: string) =>
  after(config, () => (inputOf(s, id).props.onChange as (e: { target: { value: string } }) => void)({ target: { value } }));

/**
 * PLAYER JOURNEY: Review read, "I Know SLATE." chosen and Begin pressed; the life made from what Begin hands on, as
 * `SlateApp`'s `start` makes it (`createSave` with the guide as chosen and the clock paused).
 */
function begun(seed: string, config: NewSaveConfig): { sim: Simulation; review: string } {
  const review = creation(STEP.review, config);
  const radios = review.controls.filter((c) => c.type === 'input' && c.props.name === 'guide');
  expect(radios).toHaveLength(2);
  const chosen = after(config, () => (radios[1]!.props.onChange as () => void)());
  expect(chosen.tutorial).toBe(false);
  const ready = creation(STEP.review, chosen);
  (buttonOf(ready, 'Begin').props.onClick as () => void)();
  const started = ready.started();
  expect(started).toEqual(chosen);
  return { sim: createSave(1, seed, { ...started!, tutorial: started!.tutorial !== false, paused: true }), review: review.text };
}

const AXIS_LABEL: Partial<Record<keyof Personality, string>> = { riskTolerance: 'Risk Tolerance', extraversion: 'Extraversion', openness: 'Openness', agreeableness: 'Agreeableness' };
/** PLAYER JOURNEY: Ada through Dispositions & Traits with one slider moved, and on through Review to Begin. */
function slidTo(seed: string, axis: keyof Personality, value: number): { sim: Simulation; page: string; review: string } {
  const base = ada();
  const page = creation(STEP.dispositions, base);
  const slid = typeInto(base, page, `p-${axis}`, String(value));
  expect(slid.personality[axis]).toBe(value);
  expect({ ...slid, personality: base.personality }).toEqual(base);
  const again = creation(STEP.dispositions, slid);
  expect(inputOf(again, `p-${axis}`).props.value).toBe(value);
  const { sim, review } = begun(seed, slid);
  expect(review).toContain(`${AXIS_LABEL[axis]} ${value}/100`);
  expect(sim.player.personality[axis]).toBe(value);
  return { sim, page: page.text, review };
}

const profile = (sim: Simulation): string => { h.sim = sim; h.states = []; h.controls = []; return onScreen(renderToStaticMarkup(createElement(ProfileWorkspace))); };
const bankCard = (sim: Simulation): string => { h.sim = sim; h.states = []; h.controls = []; return onScreen(renderToStaticMarkup(createElement(BankCard, { bankId: 'us-chase' }))); };
/** A look as it opens: its name, its kind and its body's words. */
function look(sim: Simulation, kind: string, id: string): { name: string; kind: string; body: string } {
  h.sim = sim;
  h.states = [];
  const found = resolveLook(sim, at(kind, id));
  if (!found || 'gone' in found) throw new Error(`${kind}:${id} didn’t resolve`);
  return { name: found.name, kind: found.kind, body: onScreen(renderToStaticMarkup(createElement('div', null, found.body))) };
}

// ---------------------------------------------------------------------------------------------------------------------
// c-disp-riskTolerance
// ---------------------------------------------------------------------------------------------------------------------

describe('c-disp-riskTolerance', () => {
  const card = (sim: Simulation) => cardOf(sim, sim.player)!;
  /** What each transaction under a memo did to the card, in cents: a payment up, a charge down. */
  const onCard = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo)
    .map((t) => t.postings.filter((p) => p.accountId === card(sim).id).reduce((n, p) => n + p.amount, 0));
  const statements = (sim: Simulation) => sim.universe.notifications.filter((n) => n.title === 'Statement Ready: Chase Freedom Unlimited').map((n) => [n.at, n.body]);

  it('PLAYER JOURNEY: Risk Tolerance slid to 66 starts the card’s autopay on the minimum and slid to 65 in full, nothing edited after Begin; the page, the Review, the Profile and the card say so', () => {
    // The Profile says what the figure did: until 2026-10-13 it said the rule, “over 65, the card’s autopay starts on
    // the minimum”, at 65 as at 66, and this held that same line for both.
    for (const [risk, autopay, button, said] of [
      [66, 'minimum', 'Autopay: The Minimum', 'over 65, so your card’s autopay began on the minimum payment'],
      [65, 'full', 'Autopay: The Whole Statement', '65 or under, so your card’s autopay began on the whole statement'],
    ] as const) {
      const { sim, page } = slidTo(`g28-risk-page-${risk}`, 'riskTolerance', risk);
      // With a curly apostrophe from 2026-10-13, as the page’s other words have it; until then this held the straight one.
      expect(page).toContain('Risk Tolerance over 65 starts your card’s autopay on the minimum, so a balance is carried.');
      expect(sim.player.credit!.autopay, String(risk)).toBe(autopay);
      expect(profile(sim)).toContain(`Risk Tolerance ${risk}, ${said};`);
      const shown = bankCard(sim);
      expect(shown).toContain('Chase Freedom Unlimited');
      expect(shown).toContain(button);
    }
  });

  it('PLAYER JOURNEY: the same groceries on the card each midnight: at 66 autopay pays Chase’s $40.00 floor on 11 October and 10 November, the card carries what’s left and is charged interest on 20 November; at 65 each statement is paid whole and nothing is charged; across a save and a load, once', () => {
    const lives = { 66: slidTo('g28-risk', 'riskTolerance', 66).sim, 65: slidTo('g28-risk', 'riskTolerance', 65).sim } as Record<66 | 65, Simulation>;
    expect(lives[66].player.credit!.autopay).toBe('minimum');
    expect(lives[65].player.credit!.autopay).toBe('full');
    for (const sim of Object.values(lives)) sim.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
    // Saved and loaded between the first statement and its due date: what autopay pays is the save's.
    for (const risk of [66, 65] as const) { lives[risk].advanceTo(EDT(2026, 10, 1, 12)); lives[risk] = reload(lives[risk]); }
    for (const sim of Object.values(lives)) sim.advanceTo(EDT(2026, 10, 11, 13));
    // Sunday 20 September, 9 AM: twenty-seven midnights of New Haven's $10.00 of groceries, and Chase's minimum, 1% and
    // the month's interest, never under $40 (its published terms): $40.00.
    for (const sim of Object.values(lives)) expect(statements(sim)).toEqual([[EDT(2026, 9, 20, 9), '$270.00 to pay, at least $40.00.']]);
    // Noon on Sunday 11 October, 21 days on: autopay pays the minimum, or the whole statement.
    expect(onCard(lives[66], 'Paid Chase Freedom Unlimited')).toEqual([40_00]);
    expect(onCard(lives[65], 'Paid Chase Freedom Unlimited')).toEqual([270_00]);
    expect(lives[66].player.credit!.carrying).toBe(true);
    expect(lives[65].player.credit!.carrying).toBe(false);

    for (const sim of Object.values(lives)) sim.advanceTo(EST(2026, 11, 21, 9));
    // Tuesday 20 October: $270 − $40 + thirty more days of groceries, with no interest yet (the card's introductory 0%,
    // Chase's fifteen months, from an account opened before the first morning, ran to that day); the life at 65, the
    // thirty days alone. Friday 20 November: the life at 65, thirty-one days of groceries.
    expect(statements(lives[66]).slice(0, 2)).toEqual([[EDT(2026, 9, 20, 9), '$270.00 to pay, at least $40.00.'], [EDT(2026, 10, 20, 9), '$530.00 to pay, at least $40.00.']]);
    expect(statements(lives[65])).toEqual([
      [EDT(2026, 9, 20, 9), '$270.00 to pay, at least $40.00.'], [EDT(2026, 10, 20, 9), '$300.00 to pay, at least $40.00.'], [EST(2026, 11, 20, 9), '$310.00 to pay, at least $40.00.'],
    ]);
    expect(onCard(lives[66], 'Paid Chase Freedom Unlimited')).toEqual([40_00, 40_00]);
    expect(onCard(lives[65], 'Paid Chase Freedom Unlimited')).toEqual([270_00, 300_00]);
    // The same purchases on both cards, every midnight from Tuesday 25 August: eighty-nine of them, $10.00 each.
    const groceries = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'Groceries').map((t) => [t.at, t.postings.find((p) => p.accountId === card(sim).id)?.amount]);
    expect(groceries(lives[66])).toEqual(groceries(lives[65]));
    expect(groceries(lives[66])).toHaveLength(89);
    expect(groceries(lives[66]).every(([, amount]) => amount === -10_00)).toBe(true);

    // The interest: charged once, on the November statement, on a balance between $530 and $800 for the thirty-one days
    // from 21 October; so more than thirty days of $530 at the bottom of Chase's published 18.24% and less than
    // thirty-one of $800 compounded daily at its top, 27.74%: $7.95 and $19.07.
    const interest = interestOn(lives[66]);
    expect(interest.map(([when]) => when)).toEqual([EST(2026, 11, 20, 9)]);
    const charged = -interest[0]![1];
    expect(charged).toBeGreaterThan(Math.floor(530_00 * 0.1824 * 30 / 365));
    expect(charged).toBeLessThan(Math.ceil(800_00 * ((1 + 0.2774 / 365) ** 31 - 1)));
    expect(statements(lives[66])[2]).toEqual([EST(2026, 11, 20, 9), `$${((530_00 - 40_00 + 310_00 + charged) / 100).toFixed(2)} to pay, at least $40.00.`]);
    expect(lives[66].player.credit!.carrying).toBe(true);
    expect(interestOn(lives[65])).toEqual([]);
    expect(lives[65].player.credit!.carrying).toBe(false);
    // Saved and loaded after it, a day on: charged once.
    const again = reload(lives[66]);
    again.advanceTo(EST(2026, 11, 22, 9));
    expect(interestOn(again)).toEqual(interest);
  });
  function interestOn(sim: Simulation): [number, number][] {
    return sim.universe.transactions.filter((t) => t.memo === 'Interest').map((t) => [t.at, t.postings.filter((p) => p.accountId === card(sim).id).reduce((n, p) => n + p.amount, 0)]);
  }
});

// ---------------------------------------------------------------------------------------------------------------------
// c-disp-extraversion
// ---------------------------------------------------------------------------------------------------------------------

/** PLAYER JOURNEY: a student slid to one value on one axis, rested to Wednesday 2 September and in a Cabaret show. */
function inTheCabaret(seed: string, axis: keyof Personality, value: number): Simulation {
  const { sim } = slidTo(seed, axis, value);
  tended(sim, EDT(2026, 9, 2, 12));
  expect(sim.must<{ week: string }>({ kind: 'school.cabaret', payload: {} }).week).toBe('2026-09-24');
  return sim;
}

describe('c-disp-extraversion', () => {
  it('PLAYER JOURNEY: the first Cabaret curtain adds a reserved student (5) 3.6 more stress than one at 50 and an outgoing one (95) 3.6 less, 7.2 apart (DISPOSED.room 4 × 0.9), over the nerves’ 6 × (1 − composure/100); the same across a save and a load', () => {
    const night = (value: number, saved = false) => {
      let sim = inTheCabaret('g28-house', 'extraversion', value);
      const show = pendingOf(sim, CABARET_KIND).find((i) => i.payload.call === 'performance')!;
      // 8 PM Thursday 24 September.
      expect(show.at).toBe(EDT(2026, 9, 24, 20));
      tended(sim, show.at - 1);
      if (saved) sim = reload(sim);
      const before = { stress: sim.player.wellbeing.stress, composure: sim.player.attrs!.composure };
      sim.advanceTo(show.at);
      expect(sim.player.school!.cabaret!.performed).toBe(1);
      return { ...before, moved: sim.player.wellbeing.stress - before.stress };
    };
    const [reserved, middle, outgoing] = [night(5), night(50), night(95)];
    // Nothing else reads the slider: the three come to the curtain alike.
    expect(reserved.stress).toBe(middle.stress);
    expect(outgoing.stress).toBe(middle.stress);
    expect(reserved.composure).toBe(middle.composure);
    expect(outgoing.composure).toBe(middle.composure);
    // At 50 the house is neither: the nerves alone, a performance's weight of 6 by how unsettled, at no trait.
    expect(middle.moved).toBeCloseTo(6 * (1 - middle.composure / 100), 6);
    expect(reserved.moved - middle.moved).toBeCloseTo(3.6, 9);
    expect(middle.moved - outgoing.moved).toBeCloseTo(3.6, 9);
    expect(reserved.moved - outgoing.moved).toBeCloseTo(7.2, 9);
    // Saved and loaded a moment before the curtain, the slider still takes the house.
    expect(night(5, true).moved).toBeCloseTo(reserved.moved, 9);
  });

  it('PLAYER JOURNEY: says on Dispositions & Traits and on the Profile what Extraversion sets, how a house watching sits with you', () => {
    const { sim, page } = slidTo('g28-house-page', 'extraversion', 5);
    expect(page).toContain('Extraversion sets how a house watching you sits with you');
    expect(profile(sim)).toContain('Extraversion 5, how you feel with an audience watching;');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// c-disp-openness
// ---------------------------------------------------------------------------------------------------------------------

describe('c-disp-openness', () => {
  it('PLAYER JOURNEY: the Cabaret’s read-through, new work, lifts an open student (95) 1.8 more than one at 50 and a conventional one (5) 1.8 less, over the 0.2 the default agreeableness of 55 gives each; stress alike', () => {
    const readThrough = (value: number) => {
      const sim = inTheCabaret('g28-new-work', 'openness', value);
      const call = pendingOf(sim, CABARET_KIND).find((i) => i.payload.call === 'rehearsal')!;
      // 6 PM Friday 11 September.
      expect([call.at, call.label]).toEqual([EDT(2026, 9, 11, 18), 'Yale Cabaret: Read-Through']);
      return across(sim, call);
    };
    const [closed, middle, open] = [readThrough(5), readThrough(50), readThrough(95)];
    // DISPOSED.rehearsal 2 × (55 − 50)/50: the company of the rehearsal, the same for all three.
    expect(middle.morale).toBeCloseTo(0.2, 9);
    expect(open.morale - middle.morale).toBeCloseTo(1.8, 9);
    expect(middle.morale - closed.morale).toBeCloseTo(1.8, 9);
    expect(open.stress).toBe(middle.stress);
    expect(closed.stress).toBe(middle.stress);
  });

  it('PLAYER JOURNEY: the Carlotta Festival’s read-through, a festival’s new play, lifts the open student 3.6 more than the conventional twin; its curtain, not a rehearsal, reads no openness', () => {
    const festival = (value: number) => {
      const { sim } = slidTo('g28-festival', 'openness', value);
      // The spring's cast list, 9 AM Monday 4 January 2027.
      tended(sim, EST(2027, 1, 4, 11));
      expect(sim.player.school!.casting).toMatchObject({ production: 'Carlotta Festival Of New Plays', kind: 'carlotta' });
      const calls = pendingOf(sim, CALL_KIND).filter((i) => i.payload.which !== 'rep');
      const readThrough = calls.find((i) => i.payload.call === 'rehearsal')!;
      const curtain = calls.find((i) => i.payload.call === 'performance')!;
      // 3 PM Tuesday 13 April, and 8 PM Tuesday 4 May.
      expect([readThrough.at, readThrough.label]).toEqual([EDT(2027, 4, 13, 15), 'Carlotta Festival Of New Plays: Read-Through']);
      expect(curtain.at).toBe(EDT(2027, 5, 4, 20));
      return { rehearsal: across(sim, readThrough), curtain: across(sim, curtain) };
    };
    const [closed, open] = [festival(5), festival(95)];
    expect(open.rehearsal.morale - closed.rehearsal.morale).toBeCloseTo(3.6, 9);
    expect(open.rehearsal.stress).toBe(closed.rehearsal.stress);
    expect(open.curtain.morale).toBeCloseTo(closed.curtain.morale, 9);
    expect(open.curtain.stress).toBeCloseTo(closed.curtain.stress, 9);
  });

  it('PLAYER JOURNEY: Openness slid to 90 reads 90/100 on Review, and the page and the Profile say it’s how rehearsing new work does', () => {
    const { sim, page, review } = slidTo('g28-new-work-page', 'openness', 90);
    expect(page).toContain('Openness how rehearsing new work does, a festival’s new play or a Cabaret piece');
    expect(review).toContain('Openness 90/100');
    expect(profile(sim)).toContain('Openness 90, how rehearsing new work goes for you;');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// c-disp-agreeableness
// ---------------------------------------------------------------------------------------------------------------------

describe('c-disp-agreeableness', () => {
  it('PLAYER JOURNEY: Drama 50’s first meeting takes 1.8 off a blunt student’s morale (5), gives an accommodating one (95) 1.8 and one at 50 nothing (DISPOSED.rehearsal 2 × 0.9), stress alike, across a save and a load; the Cabaret’s read-through 3.6 apart', () => {
    const company = (value: number, saved = false) => {
      let sim = inTheCabaret('g28-company', 'agreeableness', value);
      let lab = pendingOf(sim, LAB_KIND)[0]!;
      // 3 PM Tuesday 8 September, the second week of classes.
      expect([lab.at, lab.label]).toEqual([EDT(2026, 9, 8, 15), 'Drama 50: The Theatrical Event']);
      tended(sim, lab.at - 1);
      if (saved) { sim = reload(sim); lab = pendingOf(sim, LAB_KIND)[0]!; }
      const atLab = across(sim, lab);
      const read = pendingOf(sim, CABARET_KIND).find((i) => i.payload.call === 'rehearsal')!;
      return { lab: atLab, cabaret: across(sim, read) };
    };
    const [blunt, middle, accommodating] = [company(5), company(50), company(95)];
    expect(blunt.lab.morale).toBeCloseTo(-1.8, 9);
    expect(middle.lab.morale).toBeCloseTo(0, 9);
    expect(accommodating.lab.morale).toBeCloseTo(1.8, 9);
    expect(blunt.lab.stress).toBe(middle.lab.stress);
    expect(accommodating.lab.stress).toBe(middle.lab.stress);
    expect(company(5, true).lab.morale).toBeCloseTo(-1.8, 9);
    expect(accommodating.cabaret.morale - blunt.cabaret.morale).toBeCloseTo(3.6, 9);
    expect(accommodating.cabaret.stress).toBeCloseTo(blunt.cabaret.stress, 9);
  });

  it('PLAYER JOURNEY: Agreeableness slid to 10 reads 10/100 on Review, and the page and the Profile say it’s how a rehearsal does', () => {
    const { sim, page, review } = slidTo('g28-company-page', 'agreeableness', 10);
    expect(page).toContain('and Agreeableness how a rehearsal does.');
    expect(review).toContain('Agreeableness 10/100');
    expect(profile(sim)).toContain('Agreeableness 10, how a rehearsal goes for you.');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// c-traits
// ---------------------------------------------------------------------------------------------------------------------

describe('c-traits', () => {
  const traitButtons = (s: Screen) => s.controls.filter((c) => c.type === 'button' && c.props.className === 'trait');

  /** PLAYER JOURNEY: Early Riser, Frugal, Resilient and Curious pressed, Curious put down, Even Tempered pressed. */
  function pressedFour(): { config: NewSaveConfig; pages: Screen[] } {
    let config = ada();
    const pages: Screen[] = [];
    let page = creation(STEP.dispositions, config);
    pages.push(page);
    for (const name of ['Early Riser', 'Frugal', 'Resilient', 'Curious', 'Curious', 'Even Tempered']) {
      config = press(config, page, name);
      page = creation(STEP.dispositions, config);
      pages.push(page);
    }
    return { config, pages };
  }

  it('PLAYER JOURNEY: Early Riser held grays Night Owl with its clash; four held gray every other button, a clashing one with its clash and the other twenty-seven with “You already hold four traits.”; one put down opens them again', () => {
    const { config, pages } = pressedFour();
    const [none, one, , , four, three, again] = pages as [Screen, Screen, Screen, Screen, Screen, Screen, Screen];
    // Thirty-five traits, none held, none grayed.
    expect(none.text).toContain('0 / 4');
    expect(traitButtons(none)).toHaveLength(35);
    expect(traitButtons(none).filter((b) => b.props.disabled || b.props['aria-pressed'] || b.why)).toEqual([]);
    // Early Riser: Night Owl alone grayed, saying why.
    expect(one.text).toContain('1 / 4');
    expect(buttonOf(one, 'Early Riser').props['aria-pressed']).toBe(true);
    expect(traitButtons(one).filter((b) => b.props.disabled).map((b) => [b.first, b.why])).toEqual([['Night Owl', 'Can’t be held with Early Riser.']]);
    // The page's own toggle keeps it out too, were the button pressed: nothing changes.
    expect(press(ada({ personalityTraits: ['early_riser'] }), one, 'Night Owl').personalityTraits).toEqual(['early_riser']);
    // Four held.
    expect(four.text).toContain('4 / 4');
    const HELD = ['Early Riser', 'Frugal', 'Resilient', 'Curious'];
    const CLASH: Record<string, string> = { 'Night Owl': 'Early Riser', Spender: 'Frugal', 'Burns Out': 'Resilient', 'Single Minded': 'Curious' };
    for (const b of traitButtons(four)) {
      const held = HELD.includes(b.first);
      expect([b.first, b.props.disabled, b.props['aria-pressed'], b.why]).toEqual([b.first, !held, held, held ? '' : CLASH[b.first] ? `Can’t be held with ${CLASH[b.first]}.` : 'You already hold four traits.']);
    }
    expect(traitButtons(four).filter((b) => b.why === 'You already hold four traits.')).toHaveLength(27);
    // A fifth pressed anyway: the toggle keeps four.
    const held4 = ada({ personalityTraits: ['early_riser', 'frugal', 'resilient', 'curious'] });
    expect(press(held4, four, 'Even Tempered').personalityTraits).toEqual(['early_riser', 'frugal', 'resilient', 'curious']);
    // Curious put down: three held, and only the three clashes grayed.
    expect(three.text).toContain('3 / 4');
    expect(traitButtons(three).filter((b) => b.props.disabled).map((b) => b.first).sort()).toEqual(['Burns Out', 'Night Owl', 'Spender']);
    expect(buttonOf(three, 'Single Minded').props.disabled).toBe(false);
    // And Even Tempered taken in its place.
    expect(again.text).toContain('4 / 4');
    expect(config.personalityTraits).toEqual(['early_riser', 'frugal', 'resilient', 'even_tempered']);
  });

  it('PLAYER JOURNEY: Begin makes the life with the four the page held, and the Review, the Profile, Yourself and the trait look say them back', () => {
    const { config } = pressedFour();
    const { sim, review } = begun('g28-traits', config);
    expect(review).toContain('Early Riser Up before anybody wants you, and the best hours of your day are over by ten.');
    expect(review).toContain('Frugal You know what everything costs, and the day’s food costs you less.');
    expect(sim.player.personalityTraits).toEqual(['early_riser', 'frugal', 'resilient', 'even_tempered']);
    expect(profile(sim)).toContain('Traits you chose. Early Riser, Frugal, Resilient, Even Tempered.');
    expect(look(sim, 'person', sim.player.id).body).toContain('Who you are. Early Riser, Frugal, Resilient and Even Tempered.');
    // Frugal's own 0.85 on what food costs, −15%; with all she is, 0.85 bent inside [0.7, 1.4], exp(L·tanh(ln 0.85 / L))
    // with L = −ln 0.7: 0.8589, −14%.
    const frugal = look(sim, 'trait', 'frugal');
    expect([frugal.name, frugal.kind]).toEqual(['Frugal', 'A Trait You Hold']);
    expect(frugal.body).toContain('What the day’s food costs you −15% −14% with all you are');
  });

  it('refuses in the engine what the page refuses: a clash, a repeat, an unknown trait and a fifth given to createSave are dropped, the first said kept', () => {
    const sim = student('g28-traits-engine', { personalityTraits: ['early_riser', 'night_owl', 'frugal', 'frugal', 'brave', 'resilient', 'curious', 'even_tempered'] });
    expect(sim.player.personalityTraits).toEqual(['early_riser', 'frugal', 'resilient', 'curious']);
  });

  it('PLAYER JOURNEY: Frugal pressed on the page makes the first meal $4.29 where a twin who pressed nothing pays $5.00, and lifts her mood 1.718 where the twin’s lifts 2', () => {
    const plainConfig = ada();
    const frugalConfig = press(plainConfig, creation(STEP.dispositions, plainConfig), 'Frugal');
    expect(frugalConfig.personalityTraits).toEqual(['frugal']);
    const meal = (config: NewSaveConfig) => {
      const { sim } = begun('g28-meal', config);
      // TEST SETUP: nothing on the calendar that wants the player, and hungry.
      for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
      sim.player.wellbeing.nourishment = 30;
      const ate = sim.must<{ changed: { morale?: number } }>({ kind: 'life.look_after', payload: { action: 'eat' } });
      const paid = sim.universe.transactions.filter((t) => t.memo === 'A meal').map((t) => t.postings.filter((p) => p.amount > 0).reduce((n, p) => n + p.amount, 0));
      return { paid, lift: ate.changed.morale, morale: sim.player.wellbeing.morale };
    };
    const [plain, frugal] = [meal(plainConfig), meal(frugalConfig)];
    // New Haven's $4 meal at its 127 cost of living, to the whole dollar: $5.00; at the knob, 500 × 0.8589 = 429.4.
    expect(plain.paid).toEqual([500]);
    expect(frugal.paid).toEqual([429]);
    // A meal of 50 eaten lifts the mood 0.04 a point: 2; Frugal's 0.85 on it, bent inside [0.7, 1.3] the same way to
    // 0.8589: 1.718. The rest of the hour the same in both.
    expect(plain.lift).toBeCloseTo(2, 9);
    expect(frugal.lift).toBeCloseTo(1.718, 3);
    expect(plain.morale - frugal.morale).toBeCloseTo(2 - 1.718, 3);
  });

  it('moves every knob a trait declares, for a life made with it, to the side the trait leans, against a plain twin made alike', () => {
    const plain = student('g28-knobs');
    let checked = 0;
    for (const trait of PERSONALITY_TRAITS) {
      const sim = student('g28-knobs', { personalityTraits: [trait.id] });
      expect(sim.player.personalityTraits).toEqual([trait.id]);
      for (const [knob, x] of Object.entries(trait.systemMods ?? {}) as [PersonalityKnob, number][]) {
        const mine = personalityOf(sim.player, knob);
        const theirs = personalityOf(plain.player, knob);
        if (x > 1) expect(mine, `${trait.id} ${knob}`).toBeGreaterThan(theirs);
        else expect(mine, `${trait.id} ${knob}`).toBeLessThan(theirs);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(35);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// c-genres
// ---------------------------------------------------------------------------------------------------------------------

/** The kinds the game's plays have, by their chips' names: the theses, Shakespeare, the Rep's and the summer's. */
const READ = ['Comedy', 'Coming Of Age', 'Domestic Drama', 'Drama', 'Fairy Tale', 'Farce', 'Historical Drama', 'Mystery', 'Political Drama', 'Romance', 'Romantic Comedy', 'Romantic Drama', 'Satire', 'Social Realism', 'Supernatural', 'Tragedy', 'Tragicomedy'];

/**
 * PLAYER JOURNEY: four second-years, alike but for the genre each loves, made on g28-oncall-5 and played by the clock to
 * 8 AM Wednesday 25 August 2027, the coursework done (`working`): a thesis in The Cherry Orchard (a tragicomedy and a
 * comedy), and Vivie Warren's understudy at the Rep in Mrs Warren’s Profession (a drama, and social realism). Kept as
 * saves, so each test loads its own copies.
 */
const secondYears = (() => {
  let kept: Record<string, string> | undefined;
  return (): Record<'drama' | 'comedy' | 'western' | 'none', Simulation> => {
    kept ??= Object.fromEntries((['drama', 'comedy', 'western', 'none'] as const).map((love) => {
      const sim = working(student('g28-oncall-5', { genres: love === 'none' ? [] : [love] }));
      tended(sim, EDT(2027, 8, 25, 8));
      return [love, serialise(sim.universe)];
    }));
    const load = (love: string) => working(loadSave(deserialise(kept![love]!) as never));
    return { drama: load('drama'), comedy: load('comedy'), western: load('western'), none: load('none') };
  };
})();

describe('c-genres', () => {
  const chips = (s: Screen) => s.controls.filter((c) => c.type === 'button' && c.props.className === 'chip');

  it('PLAYER JOURNEY: Genres & Background marks every chip no play’s kind names with ·, a chip pressed is chosen, Select All takes all 149 and Clear These puts them back; Review, the Profile and Yourself say the one loved back', () => {
    let config = ada();
    let page = creation(STEP.genres, config);
    expect(page.text).toContain('A rehearsal or a show of a play of that kind, a comedy or a tragedy, lifts your mood and eases your stress; it doesn’t make you any better in it. One marked · has no play of its kind here, and is said back only.');
    expect(chips(page)).toHaveLength(149);
    expect(chips(page).filter((c) => !c.text.endsWith(' ·')).map((c) => c.first)).toEqual(READ);
    const western = chips(page).find((c) => c.first === 'Western')!;
    expect([western.text, western.props.title]).toEqual(['Western ·', 'Said back on your page; nothing in a student’s life reads it now']);
    expect(chips(page).find((c) => c.first === 'Drama')!.props.title).toBeUndefined();
    expect(page.text).toContain('0 Chosen');

    config = press(config, page, 'Drama');
    expect(config.genres).toEqual(['drama']);
    page = creation(STEP.genres, config);
    expect(page.text).toContain('1 Chosen');
    expect(chips(page).filter((c) => c.props['aria-pressed']).map((c) => c.first)).toEqual(['Drama']);

    config = press(config, page, 'Select All');
    expect(config.genres).toEqual(FILM_GENRES.map((g) => g.id));
    page = creation(STEP.genres, config);
    expect(page.text).toContain('149 Chosen');
    expect(chips(page).every((c) => c.props['aria-pressed'] === true)).toBe(true);
    config = press(config, page, 'Clear These');
    expect(config.genres).toEqual([]);
    page = creation(STEP.genres, config);
    expect(page.text).toContain('0 Chosen');
    expect(buttonOf(page, 'Select All')).toBeDefined();

    config = press(config, page, 'Drama');
    const { sim, review } = begun('g28-loves', config);
    expect(review).toContain('Genres Drama');
    expect(sim.player.genres).toEqual(['drama']);
    const shown = profile(sim);
    expect(shown).toContain('1 loved;');
    expect(shown).toContain('You love: Drama. Drama is the one you love and know least, and no part asks for a kind yet.');
    expect(look(sim, 'person', sim.player.id).body).toContain('The films you love. Drama.');
  });

  it('PLAYER JOURNEY: at every second-year call that reads a play’s kind, its lover has 1.5 more morale and 1.5 less stress than an unread genre’s twin, the other play’s lover nothing, and the unread genre a no-genre life’s day; the last across a save and a load', () => {
    const lives = secondYears();
    const s = lives.drama.player.school!;
    expect([s.casting!.play, genresOfPlay(s.casting!.play)]).toEqual(['The Cherry Orchard', ['tragicomedy', 'comedy']]);
    expect([s.rep!.play, s.rep!.role, s.rep!.kind, genresOfPlay(s.rep!.play)]).toEqual(['Mrs Warren’s Profession', 'Vivie Warren', 'understudy', ['drama', 'social_realism']]);
    for (const sim of Object.values(lives)) expect([sim.player.school!.casting!.play, sim.player.school!.rep!.play]).toEqual([s.casting!.play, s.rep!.play]);

    type Moved = Record<'drama' | 'comedy' | 'western' | 'none', { morale: number; stress: number }>;
    const atEach = (pick: (sim: Simulation) => ScheduledItem, when: number, label: string, saved = false): Moved => {
      const out = {} as Moved;
      for (const love of ['drama', 'comedy', 'western', 'none'] as const) {
        let sim = lives[love];
        let item = pick(sim);
        expect([item.at, item.label]).toEqual([when, label]);
        if (saved) { tended(sim, item.at - 1); sim = lives[love] = working(reload(sim)); item = pick(sim); }
        out[love] = across(sim, item);
      }
      return out;
    };
    const lifts = (moved: Moved, lover: 'drama' | 'comedy', other: 'drama' | 'comedy') => {
      expect(moved[lover].morale - moved.western.morale).toBeCloseTo(1.5, 9);
      expect(moved[lover].stress - moved.western.stress).toBeCloseTo(-1.5, 9);
      // The other play's lover: no kind of this play, so the unread genre's call, to the float.
      expect(moved[other].morale).toBeCloseTo(moved.western.morale, 9);
      expect(moved[other].stress).toBeCloseTo(moved.western.stress, 9);
      expect(moved.western).toEqual(moved.none);
    };
    const call = (which: 'rep' | 'school', kind: string) => (sim: Simulation) => pendingOf(sim, CALL_KIND).find((i) => (i.payload.which === 'rep') === (which === 'rep') && i.payload.call === kind)!;

    // 3 PM Wednesday 25 August: the Rep's first understudy rehearsal, Mrs Warren’s Profession.
    lifts(atEach(call('rep', 'rehearsal'), EDT(2027, 8, 25, 15), 'Yale Rep’s October Production: Understudy Rehearsal'), 'drama', 'comedy');
    // 3 PM Tuesday 7 September: the thesis's read-through, The Cherry Orchard.
    lifts(atEach(call('school', 'rehearsal'), EDT(2027, 9, 7, 15), 'Directors’ Thesis Production I: Read-Through'), 'comedy', 'drama');
    // 5 PM Friday 8 October, the night's check: Vivie Warren's actor is out, and the understudy is sent on at 8.
    for (const sim of Object.values(lives)) {
      const check = pendingOf(sim, CALL_KIND).find((i) => i.payload.call === 'oncall' && i.payload.perfAt === EDT(2027, 10, 8, 20))!;
      expect(check.at).toBe(EDT(2027, 10, 8, 17));
      tended(sim, check.at);
      expect(sim.universe.notifications.filter((n) => n.at === check.at).map((n) => n.title)).toContain('You’re On Tonight As Vivie Warren');
    }
    lifts(atEach((sim) => pendingOf(sim, CALL_KIND).find((i) => i.payload.wentOn === true)!, EDT(2027, 10, 8, 20), 'Yale Rep’s October Production: You’re On As Vivie Warren'), 'drama', 'comedy');
    // 8 PM Saturday 9 October: the thesis's first curtain.
    lifts(atEach(call('school', 'performance'), EDT(2027, 10, 9, 20), 'Directors’ Thesis Production I: Performance'), 'comedy', 'drama');
    // 2 PM Monday 11 October: the understudies' run-through, each life saved and loaded a moment before it.
    lifts(atEach(call('rep', 'runthrough'), EDT(2027, 10, 11, 14), 'Yale Rep’s October Production: Understudy Run-Through', true), 'drama', 'comedy');
    // Loaded again after it and a minute on: played once.
    const again = reload(lives.drama);
    again.advanceTo(again.now + MS_MINUTE);
    expect(again.universe.scheduled.filter((i) => i.payload.call === 'runthrough' && i.status === 'done')).toHaveLength(1);
    expect(again.player.wellbeing.morale).toBeCloseTo(lives.drama.player.wellbeing.morale, 3);
  }, 60_000);

  it('PLAYER JOURNEY: eight days of Rep understudy rehearsals, lived by the clock alone, are different days for a lover of drama, and the same to the last figure for an unread genre’s life, a no-genre life and a lover of comedy, whose play isn’t called', () => {
    const lives = secondYears();
    for (const sim of Object.values(lives)) sim.advanceBy(8 * MS_DAY);
    // Wednesday 25 and Friday 27 August and Wednesday 1 September: three rehearsals of Mrs Warren’s Profession, kept.
    const kept = lives.drama.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which === 'rep' && i.payload.call === 'rehearsal' && i.status === 'done' && i.at >= EDT(2027, 8, 25, 8)).map((i) => i.at);
    expect(kept).toEqual([EDT(2027, 8, 25, 15), EDT(2027, 8, 27, 15), EDT(2027, 9, 1, 15)]);
    expect(lives.western.player.wellbeing).toEqual(lives.none.player.wellbeing);
    expect(lives.comedy.player.wellbeing).toEqual(lives.none.player.wellbeing);
    expect(lives.western.universe.transactions.length).toBe(lives.none.universe.transactions.length);
    expect(lives.drama.player.wellbeing.morale).toBeGreaterThan(lives.western.player.wellbeing.morale);
  }, 60_000);
});

// ---------------------------------------------------------------------------------------------------------------------
// c-body
// ---------------------------------------------------------------------------------------------------------------------

describe('c-body', () => {
  /** Hall's rule: 23.9 kcal a day for each kilogram, reached half the way in 365 days, so a kilogram a lasting 12,585 kcal. */
  const HALL = 23.9 * 365 / Math.LN2;
  /** A run's 9.3 MET past a sedentary day's 1.4 (the 2024 Adult Compendium; FAO/WHO/UNU 2004), a kilogram an hour. */
  const RUN = 9.3 - 1.4;
  const kg3 = (x: number) => Math.round(x * 1000) / 1000;

  it('takes a height and a weight only both given and in range: either alone, or either out of range, gives the body New York’s norms draw; both in range are kept as given', () => {
    const drawn = student('g28-body').player.body!;
    // The body drawn on this seed: 173.8 cm and 90.8 kg.
    expect(drawn).toMatchObject({ heightCm: 173.8, weightKg: 90.8 });
    for (const size of [{ heightCm: 171 }, { weightKg: 66 }, { heightCm: 241, weightKg: 90 }, { heightCm: 230.1, weightKg: 66 }, { heightCm: 119.9, weightKg: 66 }, { heightCm: 171, weightKg: 250.1 }, { heightCm: 171, weightKg: 34.9 }]) {
      expect(student('g28-body', size).player.body, JSON.stringify(size)).toEqual(drawn);
    }
    for (const [heightCm, weightKg] of [[171, 66], [230, 250], [120, 35]] as const) {
      expect(student('g28-body', { heightCm, weightKg }).player.body).toMatchObject({ heightCm, weightKg, startKg: weightKg, intake: 0, extra: 0 });
    }
  });

  it('PLAYER JOURNEY: the same run on the first morning takes 0.041 kg off a given 66 kg, 0.069 off a given 110 and 0.057 off the drawn 90.8 at the first midnight, a rested twin of each unchanged; across a save and a load, once', () => {
    const ran = (size: { heightCm?: number; weightKg?: number }) => {
      const sim = student('g28-body', size);
      sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
      return sim;
    };
    const SECOND_MORNING = EDT(2026, 8, 25, 6);
    for (const [size, weight] of [[{ heightCm: 171, weightKg: 66 }, 66], [{ heightCm: 171, weightKg: 110 }, 110], [{}, 90.8]] as const) {
      const sim = ran(size);
      // An hour's run, 7:30 to 8:30 on the first morning: (9.3 − 1.4) × the weight.
      expect(sim.player.body!.extra).toBeCloseTo(RUN * weight, 9);
      const rested = student('g28-body', size);
      for (const s of [sim, rested]) s.advanceTo(SECOND_MORNING);
      expect(sim.player.body!.weightKg).toBe(kg3(weight - RUN * weight / HALL));
      expect(rested.player.body!.weightKg).toBe(weight);
    }
    expect(kg3(66 - RUN * 66 / HALL)).toBe(65.959);
    expect(kg3(110 - RUN * 110 / HALL)).toBe(109.931);
    expect(kg3(90.8 - RUN * 90.8 / HALL)).toBe(90.743);
    // Saved and loaded with the run on the day's books: taken off at the midnight all the same, and once.
    const kept = reload(ran({ heightCm: 171, weightKg: 66 }));
    kept.advanceTo(SECOND_MORNING);
    expect(kept.player.body!.weightKg).toBe(65.959);
    const again = reload(kept);
    again.advanceTo(SECOND_MORNING + MS_HOUR);
    expect(again.player.body!.weightKg).toBe(65.959);
  });

  it('PLAYER JOURNEY: Your Body says at once, in feet and pounds for a New Yorker, when the size is out of range and when one is missing, and the life made from either is drawn; one in range is kept, and Yourself says it back', () => {
    const drawnTwin = begun('g28-body-page', ada()).sim.player.body!;
    let config = ada();
    let page = creation(STEP.starting, config);
    expect(page.text).toContain('Your Body');
    expect(page.controls.filter((c) => c.type === 'input' && ['height-ft', 'height-in', 'weight-lb', 'height-cm', 'weight-kg'].includes(c.props.id as string)).map((c) => c.props.id)).toEqual(['height-ft', 'height-in', 'weight-lb']);
    expect(page.text).not.toContain('Give both, or neither');
    // 7 feet: 84 inches, 213.4 cm; and 11 inches more, 95 inches, 241.3 cm; 198 pounds, 89.8 kg.
    config = typeInto(config, page, 'height-ft', '7');
    expect(config.heightCm).toBe(213.4);
    page = creation(STEP.starting, config);
    expect(page.text).toContain('Give both, or neither: with one of them, the body is drawn from where you were born.');
    config = typeInto(config, page, 'height-in', '11');
    expect(config.heightCm).toBe(241.3);
    page = creation(STEP.starting, config);
    config = typeInto(config, page, 'weight-lb', '198');
    expect(config.weightKg).toBe(89.8);
    page = creation(STEP.starting, config);
    // 120 cm is 47.2 inches, so 4′0″ the least whole; 230 cm, 90.6, so 7′6″ the most; 35 kg 77.2 pounds and 250 kg 551.2.
    expect(page.text).toContain('Out of range, so the body will be drawn instead: a height from 4′0″ to 7′6″, and a weight from 78 to 551 pounds.');
    expect(begun('g28-body-page', config).sim.player.body).toEqual(drawnTwin);
    config = typeInto(config, page, 'weight-lb', '');
    expect(config.weightKg).toBeUndefined();
    page = creation(STEP.starting, config);
    expect(page.text).toContain('Give both, or neither: with one of them, the body is drawn from where you were born.');
    expect(begun('g28-body-page', config).sim.player.body).toEqual(drawnTwin);

    // 5 feet 7, 67 inches, 170.2 cm; 145 pounds, 65.8 kg; 65.8 / 1.702² = 22.7.
    config = ada();
    page = creation(STEP.starting, config);
    config = typeInto(config, page, 'height-ft', '5');
    page = creation(STEP.starting, config);
    config = typeInto(config, page, 'height-in', '7');
    page = creation(STEP.starting, config);
    config = typeInto(config, page, 'weight-lb', '145');
    expect([config.heightCm, config.weightKg]).toEqual([170.2, 65.8]);
    page = creation(STEP.starting, config);
    expect(page.text).not.toContain('Out of range');
    expect(page.text).not.toContain('Give both, or neither');
    expect(page.text).toContain('A body mass index of 22.7.');
    const { sim } = begun('g28-body-page', config);
    expect(sim.player.body).toMatchObject({ heightCm: 170.2, weightKg: 65.8, startKg: 65.8 });
    expect(look(sim, 'person', sim.player.id).body).toContain('Your body. 5 ft 7 in and 145 lb, a body mass index of 22.7: healthy weight.');
  });

  // Until 2026-10-14 the Londoner was a London-born student at Yale, asked in the units of where she was born. Since the
  // owner's rule of that day (`bodyUnits`) the units are those of where the person lives, so a London-born student at
  // Yale is asked in feet and pounds (tests/need-paths.test.ts), and the Londoner here lives in London, a life outside
  // the school, which a test can make and the creation screen draws as it would.
  it('PLAYER JOURNEY: Your Body says it in centimeters and kilograms for a Londoner living in London, its index beside them, and the life made out of range is drawn', () => {
    const london = ada({ homeRegionId: 'uk-eng-london', school: undefined, startLocationId: 'uk-eng-london', livesWhereBorn: true });
    const drawnTwin = begun('g28-body-london', london).sim.player.body!;
    let config = london;
    let page = creation(STEP.starting, config);
    expect(page.controls.filter((c) => c.type === 'input' && ['height-ft', 'height-in', 'weight-lb', 'height-cm', 'weight-kg', 'bmi'].includes(c.props.id as string)).map((c) => c.props.id)).toEqual(['height-cm', 'weight-kg', 'bmi']);
    config = typeInto(config, page, 'height-cm', '241');
    page = creation(STEP.starting, config);
    config = typeInto(config, page, 'weight-kg', '90');
    page = creation(STEP.starting, config);
    expect(page.text).toContain('Out of range, so the body will be drawn instead: a height from 120 to 230 centimeters, and a weight from 35 to 250 kilograms.');
    // 90 / 2.41² = 15.5.
    expect(inputOf(page, 'bmi').props.value).toBe('15.5');
    expect(begun('g28-body-london', config).sim.player.body).toEqual(drawnTwin);
    config = typeInto(config, page, 'weight-kg', '');
    page = creation(STEP.starting, config);
    expect(page.text).toContain('Give both, or neither: with one of them, the body is drawn from where you were born.');
    expect(inputOf(page, 'bmi').props.value).toBe('');
  });
});
