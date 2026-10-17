/**
 * Evidence for seven trait rows the review of 2026-10-13 left partial (verification group g30-ui): what Orderly and
 * Chaotic do to hygiene, what the temperaments do to the mood, what the money traits pay for food, what Resilient
 * takes off an illness and an injury, how a classmate's bond moves for the people traits, what friends in a cast are
 * worth, and what an appetite does to the weight. Each knob is reached the way a player reaches it, through the command
 * the screen sends or through the clock, in lives made alike but for a trait, and each consequence is read where the row
 * says it's read, against figures worked out from the trait's own number bent inside its knob's limits
 * (`exp(L·tanh(ln v / L))`, L the log of the limit the lean goes toward, `KNOB_LIMITS`), worked here by hand and written
 * as literals, never asked of `personalityOf`.
 *
 * - `trait-hygieneDrift` (orderly 0.8 → 0.8294, chaotic 1.3 → 1.2351, inside [0.75, 1.35]): six hours on the clock from
 *   95 leave 87.04, 85.40 and 83.14, the same across a save and a load at the third hour; the Look After menu then
 *   offers each a Shower from where it stands, its readiness gain worked here from the seven dials, and the shower
 *   pressed takes a tenth of what it washed off the stress; from 58 the hours past 50 cost the mood 0.4 an hour, none
 *   for the orderly, one for the plain twin and 1.95 for the chaotic one, and the menu says so; a workout through
 *   `life.look_after` takes 17.92, 21.6 and 26.68 (its hour's 1.6 and its sweat's 20, by the knob), where the review
 *   found only a fixture that ignored the direction; and three hours after a shower the orderly and plain bodies are
 *   refused another in the command's words, You’re already clean., where the chaotic one showers.
 * - `trait-moraleSwing` (self critical 1.2 → 1.1768, self assured 0.78 → 0.7992, inside [0.65, 1.35]): a four-hour
 *   night through `life.sleep` (1.6 a short hour, less the night's return), a ten-hour one (the gaps in the knobs'
 *   ratio), six hungry hours on the clock (0.7 an hour), a workout (3) and one that sprains an ankle (3 less the
 *   injury's 4), the fall's evaluation of a concern on the clock (`TURNS.concern`'s 3, `feel` by way of `setStanding`),
 *   the spring cast list with a lead of her own (`CAST_LIST.ownLead`'s 2), and a midnight overdrawn (`WORRY_MORALE`'s
 *   2, once a midnight across a save and a load): each by the swing. And the six hungry hours for each of the nine
 *   traits that declare a swing, by its own.
 * - `trait-spending` (frugal 0.85 → 0.8589, spender 1.25 → 1.2157, generous 1.1 → 1.0973, inside [0.7, 1.4]): the
 *   Look After menu prices Eat A Meal at $4.29, $5.00, $6.08 and $5.49, and pressed it posts that; the midnight's
 *   groceries are $8.59, $10.00, $12.16 and $10.97, once a midnight across a save and a load; a meal ordered in is
 *   LendingTree's 21/3.03 of each; on $5.50 the spender is refused in `spendRefusal`'s words and grayed on the menu
 *   where the generous life eats to its last cent; and creation's Review shows Going Out A Month as $261, $304, $370
 *   and $334.
 * - `trait-illnessToll` (resilient 0.6 → 0.6474, inside [0.5, 1.5]): the same first-morning workout sprains the same
 *   ankle, seven days to mend for a plain body and four for a resilient one, and Work Out is refused in
 *   `trainingRefusal`'s words till each mends, across a reload; the clock's weekly draw gives both the flu on Monday
 *   14 December and takes the flu's 25 condition and 30 energy from the plain body and 16.18 and 19.42 from the
 *   resilient one, once, across a reload, its five days the same for both.
 * - `trait-bondWarmth-bondWound` (detached 0.8545, generous 1.0973 and an open book 1.1414 warm, inside [0.6, 1.4];
 *   holds grudges 1.2906, an open book 1.1439, forgiving 0.7348 and a peacemaker 0.7705 wound, inside [0.6, 1.5]): the
 *   spring cast list on the clock, a classmate helped through `school.respond`, an evening of running lines agreed
 *   there and kept or slept through on the clock, and a rehearsal booked through `school.ask_partner` and kept or
 *   slept through: each classmate's bond moves by the rule's figure by the trait. And every one of the seven traits
 *   that declare a warmth, helping Julian, and of the seven that declare a wound, an evening slept through, by its own.
 * - `trait-company` (needs people 1.6 → 1.4773, guarded 1.3 → 1.2792, restless 1.2 → 1.1933, homebody 0.8 → 0.8035,
 *   independent 0.5 → 0.5568, inside [0.4, 1.8]): on the first Carlotta night a friend in the cast lifts each by the
 *   knob, four lift each three times that, and a cast without one costs who needs people 0.955, the guarded 0.558 and
 *   the restless 0.387, and nobody else anything.
 * - `trait-appetite` (disciplined 0.97 → 0.9708, indulgent 1.05 → 1.0460, inside [0.9, 1.1]): sixty days on the clock
 *   move a body given at creation as 180 cm and 80.9 kg as Hall's rule worked day by day here has it, the same gram
 *   across a save and a load; the indulgent body crosses a body mass index of 25, into the Global BMI Mortality
 *   Collaboration's 1.07, read by the band (`bmiHazard`) on the body the clock moved, and the person look says so.
 *
 * READ RATHER THAN SEEN: the BMI's risks are a year's chance of the end (`chanceOfEndingYear`) and of a condition's
 * onset, each a draw at its time, and no deterministic outcome of a played life shows a hazard of 1.07 against 1.0; so
 * the band is read on the body the clock moved, as the review's todo asked, rather than seen in an end.
 *
 * LEFT OPEN, AND CLOSED LATER: Review's comment at CharacterCreation.tsx:1023 named an engine sum, `costsAt`, that
 * doesn't exist (`monthOf` reads `foodAt`); this file couldn't change it, and the second round of 2026-10-13 corrected it.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity, which `newLifeConfig` leaves empty) and an actor at Yale in New Haven, starting Monday 24 August
 * 2026 at 7:30 AM, played by the clock alone or through the commands the screens send, to where each knob is read. The
 * seeds were chosen for what the clock draws on them, as a player's own life draws it: g30-run-624 for a first-morning
 * workout that sprains an ankle, g30-flu-38 for the flu at the week's draw of Monday 14 December, g30-cast for the
 * spring's Carlotta Festival with Ada in a lead, g30-mates for the first classes' moments. The Look After menu and
 * creation's Review are rendered as the player has them (react-dom/server), and a pressed button is the component's own
 * onClick, kept on its way through the JSX runtime; the person look is rendered from the looks' registry.
 *
 * TEST SETUP, said again where it's done: the calendar cleared of what wants the player where a stretch is to be
 * measured on its own; dials set before a stretch or an action (hygiene, energy, nourishment, morale); a balance set
 * by a posting against a test equity line, savings and cash emptied the same way, and the credit card locked by its own
 * command; classmates' bonds set to a friend's 30 before a curtain; and on the screens, which a static render can't
 * click to, a dropdown's open state, creation's step and its config, given through the component's own useState in its
 * render order.
 */
import { describe, expect, it, vi } from 'vitest';
import { Fragment, createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Wellbeing } from '@/engine/domain/model';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { healthOf } from '@/engine/systems/health';
import { courseworkOf } from '@/engine/systems/coursework';
import { momentsOf } from '@/engine/systems/classmates';
import { bmiHazard } from '@/engine/content/body';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  toasts: [] as string[],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    if (h.states.length === 0) return [value, set];
    const v = h.states.shift();
    return [v === h.keep ? value : v, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

/** Every button the screens draw, with its words, whether it's grayed out, and its own onClick. */
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

// Without the original: it imports the looks, which import it back. Nothing is standing at a stop.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { TimeControls } = await import('@/ui/shell/TimeControls');
const { CharacterCreation } = await import('@/ui/creation/CharacterCreation');
await import('@/ui/looks/all');
const { resolveLook } = await import('@/ui/looks/registry');
const { at: subject } = await import('@/ui/looks/subject');

// ---------------------------------------------------------------------------
// Lives, and the screens over them
// ---------------------------------------------------------------------------

const config = (traits: string[], extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personalityTraits: traits, ...extra });
const life = (seed: string, traits: string[] = [], extra: Partial<NewSaveConfig> = {}): Simulation => createSave(1, seed, config(traits, extra));
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** An instant in New Haven on Eastern Daylight Time (UTC−4) in 2026, worked out here, not by the engine. */
const EDT = (month: number, day: number, hour: number, minute = 0): number => Date.UTC(2026, month - 1, day, hour + 4, minute);

/** TEST SETUP: nothing on the calendar that wants the player, canceled by hand. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
/** TEST SETUP: an account's balance set, against a test equity line. */
function setBalance(sim: Simulation, accountId: string, to: number): void {
  const by = to - sim.universe.accounts[accountId]!.balance;
  if (by !== 0) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}
/** What each purchase under a memo cost, in cents: the expense side of its transaction. */
const bought = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo)
  .map((t) => t.postings.filter((p) => p.amount > 0).reduce((n, p) => n + p.amount, 0));
const lookAfter = (sim: Simulation, action: string) => sim.execute<{ doneAt: number }>({ kind: 'life.look_after', payload: { action } });
const notices = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const bonds = (sim: Simulation) => sim.player.school!.classmates.map((m) => m.bond);

/** What the player reads: the markup with every title attribute taken out, then every tag, and its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

/** Look After Yourself, opened (TEST SETUP: its dropdown, the bar's fourth state), each item with its words and its press. */
function lookAfterMenu(sim: Simulation): Map<string, { says: string; grayed: boolean; press: () => void }> {
  h.sim = sim;
  h.buttons = [];
  h.toasts = [];
  h.states = [false, false, null, true];
  renderToStaticMarkup(createElement(TimeControls));
  expect(h.states).toHaveLength(0);
  const items = new Map<string, { says: string; grayed: boolean; press: () => void }>();
  for (const label of ['Eat A Meal', 'Order In', 'Shower', 'Work Out', 'Unwind']) {
    const b = h.buttons.find((x) => x.text.startsWith(label))!;
    expect(b, label).toBeDefined();
    items.set(label, { says: b.text, grayed: b.disabled === true, press: () => b.onClick!() });
  }
  return items;
}

/**
 * The knobs' values, each the trait's number bent inside its knob's limits by hand: exp(L·tanh(ln v / L)), L = ln of
 * the high limit for a lean up and −ln of the low limit for a lean down (`KNOB_LIMITS`). None of these traits shares a
 * knob with another trait held, and no disposition leans these knobs, so each is the trait's alone.
 */
const K = {
  orderly: 0.8293994450, // hygieneDrift 0.8 in [0.75, 1.35]
  chaotic: 1.2350736326, // hygieneDrift 1.3 in [0.75, 1.35]
  selfCritical: 1.1767681831, // moraleSwing 1.2 in [0.65, 1.35]
  selfAssured: 0.7992021501, // moraleSwing 0.78 in [0.65, 1.35]
  frugal: 0.8588737440, // spending 0.85 in [0.7, 1.4]
  spender: 1.2156941679, // spending 1.25 in [0.7, 1.4]
  generous: 1.0972864365, // spending 1.1 in [0.7, 1.4], and bondWarmth 1.1 in [0.6, 1.4]: a lean up reads only the high limit
  resilient: 0.6473831208, // illnessToll 0.6 in [0.5, 1.5]
  detached: 0.8544913846, // bondWarmth 0.85 in [0.6, 1.4]
  openWarmth: 1.1413850568, // bondWarmth 1.15 in [0.6, 1.4]
  openWound: 1.1439391194, // bondWound 1.15 in [0.6, 1.5]
  holdsGrudges: 1.2906331440, // bondWound 1.35 in [0.6, 1.5]
  forgiving: 0.7348030542, // bondWound 0.7 in [0.6, 1.5]
  peacemaker: 0.7705215001, // bondWound 0.75 in [0.6, 1.5]
  needsPeople: 1.4772551629, // company 1.6 in [0.4, 1.8]
  guarded: 1.2791874183, // company 1.3 in [0.4, 1.8]
  independent: 0.5568252587, // company 0.5 in [0.4, 1.8]
  disciplined: 0.9707968070, // appetite 0.97 in [0.9, 1.1]
  indulgent: 1.0459569607, // appetite 1.05 in [0.9, 1.1]
} as const;

/**
 * Readiness from its seven dials, each a straight line between the ends the rule gives it (`readinessParts` in
 * life.ts: energy 0.45 to 1.15, stress 1.12 to 0.62, a debt of thirty hours 1.05 to 0.66, nourishment 0.78 to 1.05,
 * morale 0.82 to 1.12, hygiene 0.92 to 1.03, condition 0.7 to 1), held to them, their product over 1.35, held to 5 and
 * 100. Worked out here, so the expectation isn't the engine's own reckoning.
 */
const READINESS_ENDS: readonly (readonly [keyof Wellbeing, number, number, number])[] = [
  ['energy', 100, 0.45, 1.15], ['stress', 100, 1.12, 0.62], ['sleepDebt', 30, 1.05, 0.66], ['nourishment', 100, 0.78, 1.05],
  ['morale', 100, 0.82, 1.12], ['hygiene', 100, 0.92, 1.03], ['condition', 100, 0.7, 1],
];
function readinessFrom(w: Wellbeing): number {
  const product = READINESS_ENDS.reduce((p, [k, top, lo, hi]) => p * (lo + (hi - lo) * Math.min(1, Math.max(0, ((w[k] as number | undefined) ?? 80) / top))), 1);
  return Math.min(100, Math.max(5, (100 * product) / 1.35));
}

// ---------------------------------------------------------------------------
// trait-hygieneDrift
// ---------------------------------------------------------------------------

describe('trait-hygieneDrift', () => {
  const TRAITS = { orderly: ['orderly'], plain: [], chaotic: ['chaotic'] } as const;
  const KNOB = { orderly: K.orderly, plain: 1, chaotic: K.chaotic } as const;
  type Who = keyof typeof TRAITS;
  const WHO = Object.keys(TRAITS) as Who[];

  /** The first morning, the calendar cleared and the dials set (TEST SETUP), so only the hours and the trait move hygiene. */
  const morning = (who: Who, hygiene: number) => {
    const sim = life('g30-hygiene', [...TRAITS[who]]);
    clearCalendar(sim); // TEST SETUP
    sim.player.wellbeing.hygiene = hygiene; // TEST SETUP
    sim.player.wellbeing.energy = 95; // TEST SETUP: nowhere near empty, so stress moves alike in each
    return sim;
  };

  it('soils an orderly body 1.327 an hour on the clock, a plain one 1.6 and a chaotic one 1.976: from 95, six hours leave 87.04, 85.40 and 83.14, the same across a save and a load at the third hour', () => {
    for (const who of WHO) {
      const straight = morning(who, 95);
      straight.advanceBy(6 * MS_HOUR);
      const broken = morning(who, 95);
      broken.advanceBy(3 * MS_HOUR);
      const kept = reload(broken);
      kept.advanceBy(3 * MS_HOUR);
      // 1.6 an hour awake, by the knob: 95 − 9.6 × 0.8294 = 87.0378, 95 − 9.6 = 85.4, 95 − 9.6 × 1.2351 = 83.1433.
      expect(straight.player.wellbeing.hygiene, who).toBeCloseTo(95 - 9.6 * KNOB[who], 9);
      expect(kept.player.wellbeing.hygiene, who).toBeCloseTo(straight.player.wellbeing.hygiene!, 9);
    }
    const six = Object.fromEntries(WHO.map((who) => { const s = morning(who, 95); s.advanceBy(6 * MS_HOUR); return [who, s.player.wellbeing.hygiene!]; })) as Record<Who, number>;
    expect(six.orderly).toBeGreaterThan(six.plain);
    expect(six.plain).toBeGreaterThan(six.chaotic);
    // The review's probe, to the hundredth.
    expect([six.orderly, six.plain, six.chaotic].map((x) => Math.round(x * 100) / 100)).toEqual([87.04, 85.4, 83.14]);
    // What fell, in the knobs' own ratio.
    expect((95 - six.orderly) / (95 - six.plain)).toBeCloseTo(K.orderly, 9);
    expect((95 - six.chaotic) / (95 - six.plain)).toBeCloseTo(K.chaotic, 9);
  });

  it('PLAYER JOURNEY: six hours on, the Look After menu offers each a Shower from where its hygiene stands, readiness by the dials; pressed, it takes a tenth of what it washed off the stress, more for the chaotic', () => {
    const after: Record<Who, { stress: number; hygiene: number }> = {} as never;
    for (const who of WHO) {
      const sim = morning(who, 95);
      sim.advanceBy(6 * MS_HOUR);
      const w = { ...sim.player.wellbeing };
      const shower = lookAfterMenu(sim).get('Shower')!;
      expect(shower.grayed, who).toBe(false);
      expect(shower.says, who).toContain('20 minutes');
      expect(shower.says, who).toContain(`Hygiene ${Math.round(w.hygiene!)} → 100`);
      // Readiness reads hygiene: the menu's gain is what hygiene at 100 and stress eased by a tenth of the wash give,
      // worked here from the seven dials.
      const gain = Math.round((readinessFrom({ ...w, hygiene: 100, stress: w.stress - (100 - w.hygiene!) * 0.1 }) - readinessFrom(w)) * 10) / 10;
      expect(shower.says, who).toContain(`readiness +${gain.toFixed(1)}`);
      shower.press();
      expect(h.toasts, who).toEqual(['Shower: done at 1:50 PM.']);
      expect(sim.player.wellbeing.hygiene, who).toBe(100);
      after[who] = { stress: sim.player.wellbeing.stress, hygiene: sim.player.wellbeing.hygiene! };
    }
    // At the shower's end, 6⅓ hours from 95: what it washed off is 5 + 10.13 × the knob, and a tenth of it comes off the
    // stress. Before it the three were alike, so the stress after differs by a tenth of the hygiene's gap.
    expect(after.orderly.stress - after.plain.stress).toBeCloseTo(0.1 * (19 / 3) * 1.6 * (1 - K.orderly), 9);
    expect(after.chaotic.stress - after.plain.stress).toBeCloseTo(0.1 * (19 / 3) * 1.6 * (1 - K.chaotic), 9);
    expect(after.chaotic.stress).toBeLessThan(after.plain.stress);
    expect(after.plain.stress).toBeLessThan(after.orderly.stress);
  });

  it('costs the mood 0.4 an hour once hygiene falls past 50: from 58, six hours cost an orderly body nothing, a plain one 0.4 and a chaotic one 0.781, and the menu says the plain and chaotic need a shower', () => {
    const out = {} as Record<Who, { lost: number; hygiene: number; says: string }>;
    for (const who of WHO) {
      const sim = morning(who, 58);
      const before = sim.player.wellbeing.morale;
      sim.advanceBy(6 * MS_HOUR);
      out[who] = { lost: before - sim.player.wellbeing.morale, hygiene: sim.player.wellbeing.hygiene!, says: lookAfterMenu(sim).get('Shower')!.says };
    }
    // The hours past 50: orderly 8 / 1.3270 = 6.03 h to get there, so none; plain 8 / 1.6 = 5 h, so one; chaotic
    // 8 / 1.9761 = 4.048 h, so 1.952. Orderly and Chaotic don't move the mood's swing, so 0.4 an hour as it is.
    expect(out.orderly.hygiene).toBeCloseTo(58 - 9.6 * K.orderly, 9);
    expect(out.orderly.hygiene).toBeGreaterThan(50);
    expect(out.orderly.lost).toBeCloseTo(0, 9);
    expect(out.plain.lost).toBeCloseTo(0.4 * (6 - 8 / 1.6), 9);
    expect(out.chaotic.lost).toBeCloseTo(0.4 * (6 - 8 / (1.6 * K.chaotic)), 9);
    expect(out.chaotic.lost).toBeCloseTo(0.78066336, 7);
    // The menu reads it too: the Shower is needed now for the two past the line, and not for the orderly body.
    expect(out.orderly.says).not.toContain('wears on the mood');
    expect(out.plain.says).toContain('Hygiene at 48: every hour under 50 wears on the mood.');
    expect(out.chaotic.says).toContain('Hygiene at 46: every hour under 50 wears on the mood.');
  });

  it('takes 17.92 hygiene off an orderly body with a workout through life.look_after, 21.6 off a plain one and 26.68 off a chaotic one: the hour’s 1.6 and the sweat’s 20, by the knob', () => {
    const drop = {} as Record<Who, number>;
    for (const who of WHO) {
      const sim = life('g30-hygiene', [...TRAITS[who]]);
      clearCalendar(sim); // TEST SETUP
      const before = sim.player.wellbeing.hygiene!;
      expect(before).toBe(80);
      const r = lookAfter(sim, 'exercise');
      expect(r.ok, r.error).toBe(true);
      drop[who] = before - sim.player.wellbeing.hygiene!;
      expect(drop[who], who).toBeCloseTo(21.6 * KNOB[who], 8);
    }
    // The direction the review found unasserted: the orderly sweat least and the chaotic most.
    expect(drop.orderly).toBeLessThan(drop.plain);
    expect(drop.plain).toBeLessThan(drop.chaotic);
    expect(drop.orderly).toBeCloseTo(17.915028, 6);
    expect(drop.chaotic).toBeCloseTo(26.677590, 6);
  });

  it('PLAYER JOURNEY: three hours after a shower, an orderly or plain body is refused another in the command’s words, You’re already clean., grayed on the menu, where a chaotic one at 94.07 showers', () => {
    const showered = (who: Who) => {
      const sim = life('g30-hygiene', [...TRAITS[who]]);
      clearCalendar(sim); // TEST SETUP
      lookAfterMenu(sim).get('Shower')!.press();
      expect(sim.player.wellbeing.hygiene).toBe(100);
      expect(sim.now).toBe(EDT(8, 24, 7, 50));
      sim.advanceBy(3 * MS_HOUR);
      // 100 − 4.8 × the knob: 96.02, 95.2 and 94.07, against the 95 a shower is refused at.
      expect(sim.player.wellbeing.hygiene, who).toBeCloseTo(100 - 4.8 * KNOB[who], 9);
      return sim;
    };
    for (const who of ['orderly', 'plain'] as const) {
      const sim = showered(who);
      const shower = lookAfterMenu(sim).get('Shower')!;
      expect(shower.grayed, who).toBe(true);
      expect(shower.says, who).toContain('You’re already clean.');
      const was = { now: sim.now, w: { ...sim.player.wellbeing } };
      const tried = lookAfter(sim, 'wash');
      expect(tried.ok).toBe(false);
      expect(tried.error).toBe('You’re already clean.');
      expect({ now: sim.now, w: { ...sim.player.wellbeing } }).toEqual(was);
    }
    const chaotic = showered('chaotic');
    const shower = lookAfterMenu(chaotic).get('Shower')!;
    expect(shower.grayed).toBe(false);
    shower.press();
    expect(h.toasts).toEqual(['Shower: done at 11:10 AM.']);
    expect(chaotic.player.wellbeing.hygiene).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// trait-moraleSwing
// ---------------------------------------------------------------------------

describe('trait-moraleSwing', () => {
  const TRAITS = { harsh: ['self_critical'], plain: [], sure: ['self_assured'] } as const;
  const KNOB = { harsh: K.selfCritical, plain: 1, sure: K.selfAssured } as const;
  type Who = keyof typeof TRAITS;
  const WHO = Object.keys(TRAITS) as Who[];

  /** A night through `life.sleep` at 11 PM on the first day, the day played by the clock, the mood set to 50 (TEST SETUP). */
  const night = (who: Who, hours: number) => {
    const sim = life('g30-night', [...TRAITS[who]]);
    clearCalendar(sim); // TEST SETUP
    sim.advanceTo(EDT(8, 24, 23));
    sim.player.wellbeing.morale = 50; // TEST SETUP
    const r = sim.execute<{ quality: number; wokeAt: number }>({ kind: 'life.sleep', payload: { hours } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.wokeAt).toBe(EDT(8, 24, 23) + hours * MS_HOUR);
    return { morale: sim.player.wellbeing.morale, quality: r.value!.quality };
  };

  it('brings a self-critical mood 0.421 lower out of a four-hour night through life.sleep than a plain twin’s, and a self-assured one 0.478 higher: 1.6 a short hour by the swing, less the night’s return', () => {
    const out = Object.fromEntries(WHO.map((who) => [who, night(who, 4)])) as Record<Who, { morale: number; quality: number }>;
    // The night is the same night in each: none of these traits moves its quality.
    expect(out.harsh.quality).toBe(out.plain.quality);
    expect(out.sure.quality).toBe(out.plain.quality);
    // Four hours at that quality is (4q − 5) hours short of five, 1.6 of mood an hour by the swing; the night then brings
    // the mood back towards where it settles, MORALE_RETURNS' 0.35 × 4/8 of the way, the same place in each.
    const short = (4 * out.plain.quality - 5) * 1.6 * (1 - 0.35 * 4 / 8);
    expect(short).toBeLessThan(0);
    expect(out.harsh.morale - out.plain.morale).toBeCloseTo(short * (K.selfCritical - 1), 9);
    expect(out.sure.morale - out.plain.morale).toBeCloseTo(short * (K.selfAssured - 1), 9);
    expect(out.harsh.morale).toBeLessThan(out.plain.morale);
    expect(out.plain.morale).toBeLessThan(out.sure.morale);
  });

  it('lifts a self-critical mood further out of a ten-hour night than a plain twin’s, and a self-assured one less, the gaps in the swings’ own ratio', () => {
    const out = Object.fromEntries(WHO.map((who) => [who, night(who, 10)])) as Record<Who, { morale: number; quality: number }>;
    expect(out.harsh.morale).toBeGreaterThan(out.plain.morale);
    expect(out.plain.morale).toBeGreaterThan(out.sure.morale);
    // Both gaps are the same night's lift times (knob − 1), so they stand in the ratio 0.1768 : −0.2008.
    expect((out.harsh.morale - out.plain.morale) / (out.sure.morale - out.plain.morale)).toBeCloseTo((K.selfCritical - 1) / (K.selfAssured - 1), 9);
  });

  it('costs a self-critical mood 4.942 for six hungry hours on the clock, a plain one 4.2 and a self-assured one 3.357: 0.7 an hour by the swing', () => {
    for (const who of WHO) {
      const sim = life('g30-hunger', [...TRAITS[who]]);
      clearCalendar(sim); // TEST SETUP
      sim.player.wellbeing.nourishment = 10; // TEST SETUP: under the 20 where hunger starts
      const before = { ...sim.player.wellbeing };
      sim.advanceBy(6 * MS_HOUR);
      expect(before.morale - sim.player.wellbeing.morale, who).toBeCloseTo(6 * 0.7 * KNOB[who], 9);
      // The body's half of hunger is nobody's temperament: 0.5 condition an hour in each.
      expect(before.condition - sim.player.wellbeing.condition, who).toBeCloseTo(3, 9);
    }
  });

  it('costs each of the nine temperaments that declare a swing its own share of six hungry hours on the clock: 4.2 by Even Tempered’s 0.8146 up to Highly Strung’s 1.2086', () => {
    // Each trait's declared moraleSwing bent inside [0.65, 1.35], by hand.
    const SWING = {
      even_tempered: 0.8145513041, highly_strung: 1.2085871798, unshakeable: 0.7581930985, sentimental: 1.1393564986,
      indulgent: 1.0966169700, needs_people: 1.1767681831, open_book: 1.0966169700, self_critical: 1.1767681831, self_assured: 0.7992021501,
    } as const;
    for (const [trait, swing] of Object.entries(SWING)) {
      const sim = life('g30-hunger', [trait]);
      clearCalendar(sim); // TEST SETUP
      sim.player.wellbeing.nourishment = 10; // TEST SETUP
      const before = sim.player.wellbeing.morale;
      sim.advanceBy(6 * MS_HOUR);
      expect(before - sim.player.wellbeing.morale, trait).toBeCloseTo(4.2 * swing, 8);
    }
  });

  it('lifts a self-critical mood 3.530 with a workout through life.look_after, a plain one 3 and a self-assured one 2.398; the workout that sprains an ankle on g30-run-624 nets −1.177, −1 and −0.799, the injury’s 4 by the swing', () => {
    for (const who of WHO) {
      const fine = life('g30-run-0', [...TRAITS[who]]);
      const m0 = fine.player.wellbeing.morale;
      expect(lookAfter(fine, 'exercise').ok).toBe(true);
      expect(healthOf(fine.player).injury).toBeUndefined();
      expect(fine.player.wellbeing.morale - m0, who).toBeCloseTo(3 * KNOB[who], 9);

      const hurt = life('g30-run-624', [...TRAITS[who]]);
      const m1 = hurt.player.wellbeing.morale;
      expect(lookAfter(hurt, 'exercise').ok).toBe(true);
      expect(healthOf(hurt.player).injury?.kind).toBe('sprain');
      expect(notices(hurt, 'A Sprained Ankle')).toHaveLength(1);
      expect(hurt.player.wellbeing.morale - m1, who).toBeCloseTo((3 - 4) * KNOB[who], 9);
    }
  });

  it('takes 3.530 off a self-critical mood at the fall’s evaluation on the clock, a concern for each, 3 off a plain one and 2.398 off a self-assured one: TURNS.concern’s 3 by the swing', () => {
    // 5 PM on Friday 11 December 2026, Eastern Standard Time (UTC−5): the fall term's evaluation.
    const EVAL = Date.UTC(2026, 11, 11, 22);
    for (const who of WHO) {
      const sim = life('g30-eval', [...TRAITS[who]]);
      sim.advanceTo(EVAL - 1);
      expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.at === EVAL && i.kind === 'school.evaluation')).toBe(true);
      expect(sim.player.school!.standing).toBe('good');
      const before = sim.player.wellbeing.morale;
      sim.advanceTo(EVAL + 1);
      expect(sim.player.school!.standing, who).toBe('concern');
      expect(sim.player.school!.history.at(-1)?.standing).toBe('concern');
      expect(before - sim.player.wellbeing.morale, who).toBeCloseTo(3 * KNOB[who], 6);
    }
  });

  it('lifts a self-critical mood 2.354 when the spring cast list goes up with a lead of her own, a plain one 2 and a self-assured one 1.598: CAST_LIST.ownLead’s 2 by the swing', () => {
    // 9 AM on Monday 4 January 2027 (UTC−5): the spring term begins and its cast list with it.
    const CAST = Date.UTC(2027, 0, 4, 14);
    for (const who of WHO) {
      const sim = life('g30-cast', [...TRAITS[who]]);
      sim.advanceTo(CAST - 1);
      const before = sim.player.wellbeing.morale;
      sim.advanceTo(CAST + 1);
      expect(sim.player.school!.casting!.size, who).toBe('lead');
      // No friend yet has a lead (no bond reaches 25 at a first cast), so the list lifts the mood by her own lead alone.
      expect(bonds(sim).every((b) => (b ?? 0) < 25)).toBe(true);
      expect(sim.player.wellbeing.morale - before, who).toBeCloseTo(2 * KNOB[who], 6);
    }
  });

  it('weighs 2.354 on a self-critical mood for a midnight overdrawn, 2 on a plain one and 1.598 on a self-assured one, against twins with money: WORRY_MORALE by the swing, once a midnight across a save and a load', () => {
    const MIDNIGHT = EDT(8, 25, 0);
    for (const who of WHO) {
      const at = (overdrawn: boolean) => {
        const sim = life('g30-worry', [...TRAITS[who]]);
        clearCalendar(sim); // TEST SETUP
        sim.advanceTo(EDT(8, 24, 23));
        if (overdrawn) setBalance(sim, sim.player.primaryAccountId!, -50_00); // TEST SETUP: $50 overdrawn
        return sim;
      };
      const flush = at(false);
      const short = at(true);
      const kept = reload(short);
      for (const s of [flush, short, kept]) s.advanceTo(MIDNIGHT + 1);
      expect(flush.player.wellbeing.morale - short.player.wellbeing.morale, who).toBeCloseTo(2 * KNOB[who], 9);
      expect(kept.player.wellbeing.morale, who).toBeCloseTo(short.player.wellbeing.morale, 9);
      // The day's food was still bought, on the card: only the worry differs.
      expect(bought(short, 'Groceries')).toEqual([1000]);
      // Saved and loaded just after it, the midnight isn't felt again.
      const after = reload(short);
      after.advanceTo(MIDNIGHT + 60_000);
      short.advanceTo(MIDNIGHT + 60_000);
      expect(after.player.wellbeing.morale).toBeCloseTo(short.player.wellbeing.morale, 9);
    }
  });
});

// ---------------------------------------------------------------------------
// trait-spending
// ---------------------------------------------------------------------------

describe('trait-spending', () => {
  const TRAITS = { frugal: ['frugal'], plain: [], spender: ['spender'], generous: ['generous'] } as const;
  type Who = keyof typeof TRAITS;
  const WHO = Object.keys(TRAITS) as Who[];
  /**
   * New Haven's $4 meal and $8 day at its 127 cost of living, to the whole dollar, and Connecticut leaves groceries
   * untaxed: $5.00 and $10.00. Each at the knob, to the cent: 500 × 0.8589 = 429.4, × 1.2157 = 607.8, × 1.0973 = 548.6;
   * 1000 × the same, 858.9, 1215.7 and 1097.3.
   */
  const MEAL = { frugal: 429, plain: 500, spender: 608, generous: 549 } as const;
  const DAY = { frugal: 859, plain: 1000, spender: 1216, generous: 1097 } as const;
  const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  /** The first morning, hungry (TEST SETUP: the calendar cleared, nourishment 30). */
  const hungry = (who: Who, seed = 'g30-spend') => {
    const sim = life(seed, [...TRAITS[who]]);
    clearCalendar(sim); // TEST SETUP
    sim.player.wellbeing.nourishment = 30; // TEST SETUP
    return sim;
  };

  it('PLAYER JOURNEY: Look After Yourself prices Eat A Meal at $4.29 for a frugal life, $5.00 plain, $6.08 for a spender and $5.49 for a generous one; pressed, it posts that much from checking', () => {
    for (const who of WHO) {
      const sim = hungry(who);
      expect(MEAL.plain).toBe(500);
      expect(MEAL[who]).toBe(Math.round(500 * ({ frugal: K.frugal, plain: 1, spender: K.spender, generous: K.generous })[who]));
      const checking = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
      const eat = lookAfterMenu(sim).get('Eat A Meal')!;
      expect(eat.grayed, who).toBe(false);
      expect(eat.says, who).toContain(`40 minutes · ${dollars(MEAL[who])}`);
      eat.press();
      expect(h.toasts, who).toEqual(['Eat A Meal: done at 8:10 AM.']);
      expect(bought(sim, 'A meal'), who).toEqual([MEAL[who]]);
      expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance, who).toBe(checking - MEAL[who]);
    }
  });

  it('buys the day’s groceries at midnight at $8.59 frugal, $10.00 plain, $12.16 for a spender and $10.97 for a generous one, once a midnight across a save and a load', () => {
    const midnights = [EDT(8, 25, 0), EDT(8, 26, 0)];
    for (const who of WHO) {
      const sim = life('g30-groceries', [...TRAITS[who]]);
      sim.advanceTo(EDT(8, 24, 23));
      const kept = reload(sim);
      for (const s of [sim, kept]) {
        s.advanceTo(EDT(8, 26, 1));
        expect(s.universe.transactions.filter((t) => t.memo === 'Groceries').map((t) => t.at), who).toEqual(midnights);
        expect(bought(s, 'Groceries'), who).toEqual([DAY[who], DAY[who]]);
      }
    }
  });

  it('orders a meal in at LendingTree’s $21.00 against $3.03 of each one’s meal: $29.73 frugal, $34.65 plain, $42.14 for a spender and $38.05 for a generous one', () => {
    // 429 × 21 / 3.03 = 2973.3; 500 × … = 3465.3; 608 × … = 4213.9; 549 × … = 3805.0.
    const DELIVERED = { frugal: 2973, plain: 3465, spender: 4214, generous: 3805 } as const;
    for (const who of WHO) {
      const sim = hungry(who);
      expect(DELIVERED[who]).toBe(Math.round(MEAL[who] * 21 / 3.03));
      const r = lookAfter(sim, 'order');
      expect(r.ok, r.error).toBe(true);
      expect(bought(sim, 'A meal delivered'), who).toEqual([DELIVERED[who]]);
    }
  });

  it('on $5.50 feeds a plain and a generous life, the generous to its last cent, where a spender is refused in spendRefusal’s words and grayed on the menu, taking nothing', () => {
    const onFiveFifty = (who: Who) => {
      const sim = hungry(who, 'g30-spend-short');
      // TEST SETUP: $5.50 in checking and nothing in savings or in hand; the credit card locked by its own command.
      for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && (a.kind === 'savings' || a.kind === 'cash')) setBalance(sim, a.id, 0);
      setBalance(sim, sim.player.primaryAccountId!, 550);
      sim.must({ kind: 'card.lock', payload: { which: 'credit', locked: true } });
      return sim;
    };
    const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    for (const who of ['plain', 'generous'] as const) {
      const sim = onFiveFifty(who);
      const eat = lookAfterMenu(sim).get('Eat A Meal')!;
      expect(eat.grayed, who).toBe(false);
      eat.press();
      expect(checking(sim), who).toBe(550 - MEAL[who]);
      expect(sim.player.wellbeing.nourishment, who).toBeGreaterThan(30);
    }
    // The generous meal, $5.49, leaves a cent.
    expect(550 - MEAL.generous).toBe(1);
    const spender = onFiveFifty('spender');
    const eat = lookAfterMenu(spender).get('Eat A Meal')!;
    expect(eat.grayed).toBe(true);
    expect(eat.says).toContain('You can’t afford it.');
    const was = { now: spender.now, tx: spender.universe.transactions.length, n: spender.player.wellbeing.nourishment, checking: checking(spender) };
    const tried = lookAfter(spender, 'eat');
    expect(tried.ok).toBe(false);
    expect(tried.error).toBe('You can’t afford it.');
    expect({ now: spender.now, tx: spender.universe.transactions.length, n: spender.player.wellbeing.nourishment, checking: checking(spender) }).toEqual(was);
  });

  it('shows Going Out A Month on creation’s Review as $261 for a frugal pick, $304 for none, $370 for a spender and $334 for a generous one', () => {
    const review = (traits: string[]) => {
      // TEST SETUP: CharacterCreation's states in render order: the step (Review, the fifth), the config, and the two it keeps.
      h.states = [4, config(traits), h.keep, h.keep];
      const text = onScreen(renderToStaticMarkup(createElement(CharacterCreation, { slot: 1 as never, onCancel: () => undefined, onStart: () => undefined })));
      expect(h.states).toHaveLength(0);
      return text;
    };
    const month = (text: string) => text.match(/Going Out A Month \$([\d,]+)/)?.[1];
    // A day's $10.00 of groceries in New Haven at the knob, 365/12 days: $261.24, $304.17, $369.77 and $333.76, to the dollar.
    expect(month(review(['frugal']))).toBe('261');
    expect(month(review([]))).toBe('304');
    expect(month(review(['spender']))).toBe('370');
    const generous = review(['generous']);
    expect(month(generous)).toBe('334');
    expect(generous).toContain('Generous');
  });
});

// ---------------------------------------------------------------------------
// trait-illnessToll
// ---------------------------------------------------------------------------

describe('trait-illnessToll', () => {
  it('mends the ankle the same first-morning workout sprains in 4 days for a resilient body where a plain one takes 7, and refuses Work Out in trainingRefusal’s words till each mends, across a reload', () => {
    const ran = (traits: string[]) => {
      const sim = life('g30-run-624', traits);
      const r = lookAfter(sim, 'exercise');
      expect(r.ok, r.error).toBe(true);
      return sim;
    };
    const RAN_AT = EDT(8, 24, 8, 30);
    const plain = ran([]);
    const resilient = ran(['resilient']);
    const injury = (sim: Simulation) => healthOf(sim.player).injury!;
    for (const sim of [plain, resilient]) {
      expect(injury(sim).kind).toBe('sprain');
      expect(injury(sim).at).toBe(RAN_AT);
    }
    // The draw is 7 days for the plain body, so somewhere in [6.5, 7.5); at 0.6474 that is [4.21, 4.86): 4 days.
    expect((injury(plain).until - RAN_AT) / MS_DAY).toBe(7);
    expect((injury(resilient).until - RAN_AT) / MS_DAY).toBe(4);
    expect(notices(plain, 'A Sprained Ankle').map((n) => n.body)[0]).toContain('It takes 7 days to mend, and you can’t work out until then.');
    expect(notices(resilient, 'A Sprained Ankle').map((n) => n.body)[0]).toContain('It takes 4 days to mend, and you can’t work out until then.');
    expect(lookAfter(plain, 'exercise').error).toBe('Not with a sprained ankle; it has 7 days yet to mend.');
    expect(lookAfter(resilient, 'exercise').error).toBe('Not with a sprained ankle; it has 4 days yet to mend.');

    // Saved and loaded at 6 PM on Wednesday 26 August: 4 days 14½ hours left, and 1 day 14½ hours.
    for (const sim of [plain, resilient]) sim.advanceTo(EDT(8, 26, 18));
    const [plainKept, resilientKept] = [reload(plain), reload(resilient)];
    expect(lookAfter(plainKept, 'exercise').error).toBe('Not with a sprained ankle; it has 5 days yet to mend.');
    expect(lookAfter(resilientKept, 'exercise').error).toBe('Not with a sprained ankle; it has 2 days yet to mend.');

    // 6 PM on Friday 28 August, the resilient ankle mended that morning at 8:30: its workout goes ahead; the plain one,
    // mended on Monday 31 August at 8:30 AM, has 2 days 14½ hours to go.
    for (const sim of [plainKept, resilientKept]) sim.advanceTo(EDT(8, 28, 18));
    const worked = lookAfter(resilientKept, 'exercise');
    expect(worked.ok, worked.error).toBe(true);
    expect(lookAfter(plainKept, 'exercise').error).toBe('Not with a sprained ankle; it has 3 days yet to mend.');
  });

  it('takes the flu’s 25 condition and 30 energy from a plain body at the clock’s weekly draw on Monday 14 December, 16.18 and 19.42 from a resilient one, once across a reload, the five days alike', () => {
    // On g30-flu-38 the week's draw at 9 AM on Monday 14 December 2026 (UTC−5) gives both bodies the flu.
    const AT = Date.UTC(2026, 11, 14, 14);
    const draw = (traits: string[]) => {
      const sim = life('g30-flu-38', traits);
      sim.advanceTo(AT - 1);
      expect(sim.universe.scheduled.filter((i) => i.status === 'pending' && i.at === AT).map((i) => i.kind)).toEqual(['health.week']);
      expect(notices(sim, 'You Have The Flu')).toHaveLength(0);
      const before = { ...sim.player.wellbeing };
      sim.advanceTo(AT + 1);
      expect(notices(sim, 'You Have The Flu').map((n) => n.body)).toEqual(['You have the flu. It lasts until December 19, 2026, and it has cost you some condition and energy. Work Out waits until it passes, and Call In Sick, on School, excuses a day of classes. You didn’t see a doctor, so there’s nothing to pay.']);
      return { sim, condition: before.condition - sim.player.wellbeing.condition, energy: before.energy - sim.player.wellbeing.energy };
    };
    const plain = draw([]);
    const resilient = draw(['resilient']);
    // The flu's toll (`CARE.toll.flu`) is 25 condition and 30 energy; two milliseconds awake drain a few millionths of energy.
    expect(plain.condition).toBeCloseTo(25, 9);
    expect(plain.energy).toBeCloseTo(30, 4);
    // 25 × 0.6474 = 16.1846; 30 × 0.6474 = 19.4215.
    expect(resilient.condition).toBeCloseTo(25 * K.resilient, 8);
    expect(resilient.energy).toBeCloseTo(30 * K.resilient, 4);
    // The five days the flu keeps somebody home are the CDC's, for anybody.
    for (const { sim } of [plain, resilient]) expect(healthOf(sim.player).fluUntil).toBe(AT + 5 * MS_DAY);
    // Saved and loaded after the draw, the flu isn't had again; Work Out is refused till it passes and taken after.
    for (const { sim } of [plain, resilient]) {
      const kept = reload(sim);
      const condition = kept.player.wellbeing.condition;
      kept.advanceTo(AT + 3 * MS_HOUR);
      expect(notices(kept, 'You Have The Flu')).toHaveLength(1);
      // Nothing like the toll a second time: three hours awake move condition by less than a point.
      expect(Math.abs(kept.player.wellbeing.condition - condition)).toBeLessThan(1);
      expect(lookAfter(kept, 'exercise').error).toBe('Not with the flu: rest until it passes.');
      kept.advanceTo(AT + 5 * MS_DAY + 3 * MS_HOUR);
      expect(notices(kept, 'You Have The Flu')).toHaveLength(1);
      const worked = lookAfter(kept, 'exercise');
      expect(worked.ok, worked.error).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// trait-bondWarmth-bondWound
// ---------------------------------------------------------------------------

describe('trait-bondWarmth-bondWound', () => {
  it('warms a detached player 8.545 to each lead sharing the spring cast where a plain twin warms 10, cuts one who holds grudges 2.581 where the plain twin is cut 2, and moves an open book both ways, 11.414 and 2.288; reloaded after, nothing moves again', () => {
    // The spring term begins at 9 AM on Monday 4 January 2027 (UTC−5), and its cast list with it.
    const CAST = Date.UTC(2027, 0, 4, 14);
    const TRAITS = { plain: [], detached: ['detached'], grudges: ['holds_grudges'], open: ['open_book'] } as const;
    const lives = Object.fromEntries(Object.entries(TRAITS).map(([who, traits]) => {
      const sim = life('g30-cast', [...traits]);
      sim.advanceTo(CAST - 1);
      expect(bonds(sim).every((b) => b === undefined)).toBe(true);
      sim.advanceTo(CAST + 60_000);
      return [who, sim];
    })) as Record<keyof typeof TRAITS, Simulation>;
    // The same cast in each: the Carlotta Festival, with Ada in one of its three leads.
    const list = lives.plain.player.school!.around!.list;
    for (const sim of Object.values(lives)) expect(sim.player.school!.around!.list).toEqual(list);
    expect(lives.plain.player.school!.casting!.production).toBe('Carlotta Festival Of New Plays');
    expect(lives.plain.player.school!.casting!.size).toBe('lead');
    // The rule's own figures: ten toward a friend for a production shared, twelve back for a lead that went to the other.
    // Ada's lead is one a classmate in a smaller part could have had; the other two leads lose nothing to her.
    const mates = lives.plain.player.school!.classmates.map((m) => m.name);
    const leadOf = (name: string) => list.some((x) => x.name === name && x.production === 'Carlotta Festival Of New Plays' && x.size === 'lead');
    const plainMove = mates.map((name) => (leadOf(name) ? 10 : 10 - 12));
    expect(plainMove.filter((m) => m === 10)).toHaveLength(2);
    expect(bonds(lives.plain)).toEqual(plainMove);
    const moved = (sim: Simulation, warmth: number, wound: number) => {
      expect(bonds(sim)).toHaveLength(15);
      bonds(sim).forEach((b, i) => expect(b).toBeCloseTo(plainMove[i]! > 0 ? 10 * warmth : -2 * wound, 9));
    };
    moved(lives.detached, K.detached, 1);
    moved(lives.grudges, 1, K.holdsGrudges);
    moved(lives.open, K.openWarmth, K.openWound);
    // Saved and loaded after the list went up, the two days after it move no bond again: the list is read once.
    const kept = reload(lives.grudges);
    for (const sim of [kept, lives.grudges]) sim.advanceTo(CAST + 2 * MS_DAY);
    expect(bonds(kept)).toEqual(bonds(lives.grudges));
  });

  /** On g30-mates Julian Donovan asks for help with his lines in the first class, Monday 31 August. */
  const helpJulian = (traits: string[]) => {
    const sim = life('g30-mates', traits);
    sim.advanceTo(EDT(8, 31, 9, 30));
    const open = momentsOf(courseworkOf(sim, sim.player)!).filter((m) => m.status === 'open');
    expect(open.map((m) => ({ kind: m.kind, mate: sim.player.school!.classmates[m.mate]!.name }))).toEqual([{ kind: 'help', mate: 'Julian Donovan' }]);
    sim.advanceTo(EDT(8, 31, 17));
    const julian = sim.player.school!.classmates[open[0]!.mate]!;
    const before = julian.bond ?? 0;
    const r = sim.execute<{ done: string }>({ kind: 'school.respond', payload: { momentId: open[0]!.id, choice: 'help' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.done).toBe('You ran Julian’s lines with them.');
    const moved = julian.bond! - before;
    // Asked again, the moment is answered, and the bond holds.
    const again = sim.execute({ kind: 'school.respond', payload: { momentId: open[0]!.id, choice: 'help' } });
    expect(again.error).toBe('You’ve answered it.');
    expect(julian.bond! - before).toBe(moved);
    return moved;
  };

  it('warms a generous player 3.292 and an open book 3.424 for helping Julian with his lines through school.respond, where a plain twin and one who holds grudges warm 3; asked again, You’ve answered it.', () => {
    expect(helpJulian([])).toBe(3);
    expect(helpJulian(['generous'])).toBeCloseTo(3 * K.generous, 9);
    expect(helpJulian(['open_book'])).toBeCloseTo(3 * K.openWarmth, 9);
    expect(helpJulian(['holds_grudges'])).toBe(3);
  });

  it('warms each of the seven traits that declare a warmth by its own, helping Julian: 3 by Guarded’s 0.7705 up to An Open Book’s 1.1414', () => {
    // Each trait's declared bondWarmth bent inside [0.6, 1.4], by hand.
    const WARMTH = {
      even_tempered: 0.8544913846, detached: 0.8544913846, disciplined_body: 0.9013231287, generous: 1.0972864365,
      independent: 0.8106200456, guarded: 0.7705215001, open_book: 1.1413850568,
    } as const;
    for (const [trait, warmth] of Object.entries(WARMTH)) expect(helpJulian([trait]), trait).toBeCloseTo(3 * warmth, 9);
  });

  /** Aaliyah Brooks asks to run lines at 7 PM on Friday 4 September; agreed through school.respond, then kept or slept through. */
  const runLines = (traits: string[], keep: boolean) => {
    const sim = life('g30-mates', traits);
    sim.advanceTo(EDT(9, 3, 9, 30));
    const open = momentsOf(courseworkOf(sim, sim.player)!).filter((m) => m.status === 'open' && m.kind === 'study');
    expect(open.map((m) => ({ mate: sim.player.school!.classmates[m.mate]!.name, when: m.when }))).toEqual([{ mate: 'Aaliyah Brooks', when: EDT(9, 4, 19) }]);
    sim.advanceTo(EDT(9, 3, 17));
    expect(sim.execute({ kind: 'school.respond', payload: { momentId: open[0]!.id, choice: 'yes' } }).ok).toBe(true);
    const aaliyah = sim.player.school!.classmates[open[0]!.mate]!;
    sim.advanceTo(EDT(9, 4, 18));
    const before = aaliyah.bond ?? 0;
    // Slept through: three hours from six, across the seven o'clock she asked for.
    expect(keep || sim.execute({ kind: 'life.sleep', payload: { hours: 3 } }).ok).toBe(true);
    sim.advanceTo(EDT(9, 4, 22));
    expect(notices(sim, 'Aaliyah Waited For You')).toHaveLength(keep ? 0 : 1);
    return aaliyah.bond! - before;
  };

  it('warms a generous player 2.195 for an evening of running lines kept, where a plain twin warms 2; slept through, it cuts one who holds grudges 3.872, a forgiving one 2.204 and the plain twin 3', () => {
    expect(runLines([], true)).toBe(2);
    expect(runLines(['generous'], true)).toBeCloseTo(2 * K.generous, 9);
    expect(runLines([], false)).toBe(-3);
    expect(runLines(['holds_grudges'], false)).toBeCloseTo(-3 * K.holdsGrudges, 9);
    expect(runLines(['forgiving'], false)).toBeCloseTo(-3 * K.forgiving, 9);
  });

  it('cuts each of the seven traits that declare a wound by its own, the evening of running lines slept through: 3 by Forgiving’s 0.7348 up to Holds Grudges’ 1.2906', () => {
    // Each trait's declared bondWound bent inside [0.6, 1.5], by hand.
    const WOUND = {
      quick_tempered: 1.2598480187, keeps_accounts: 1.0981123666, loyal: 0.8106200456, open_book: 1.1439391194,
      peacemaker: 0.7705215001, holds_grudges: 1.2906331440, forgiving: 0.7348030542,
    } as const;
    for (const [trait, wound] of Object.entries(WOUND)) expect(runLines([trait], false), trait).toBeCloseTo(-3 * wound, 9);
  });

  /** A rehearsal with the first scene's partner, Mateo Abara, asked for through school.ask_partner at 7 PM on Saturday 5 September. */
  const rehearse = (traits: string[], keep: boolean) => {
    const sim = life('g30-mates', traits);
    sim.advanceTo(EDT(9, 3, 17));
    const a = courseworkOf(sim, sim.player)!.assignments[0]!;
    const mate = sim.player.school!.classmates[a.partner!]!;
    expect(mate.name).toBe('Mateo Abara');
    const asked = sim.execute<{ accepted: boolean; rehearsalId?: string; reason?: string }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: EDT(9, 5, 19) } });
    expect(asked.ok, asked.error).toBe(true);
    expect(asked.value!.accepted, asked.value!.reason).toBe(true);
    sim.advanceTo(EDT(9, 5, 18));
    const before = mate.bond ?? 0;
    expect(keep || sim.execute({ kind: 'life.sleep', payload: { hours: 3 } }).ok).toBe(true);
    sim.advanceTo(EDT(9, 5, 22));
    expect(a.rehearsals.find((r) => r.id === asked.value!.rehearsalId)!.status).toBe(keep ? 'kept' : 'missedByYou');
    return mate.bond! - before;
  };

  it('warms a generous player 2.195 for a rehearsal booked through school.ask_partner and kept, where a plain twin warms 2; slept through, it cuts a peacemaker 3.853 and one who holds grudges 6.453 for the plain twin’s 5', () => {
    expect(rehearse([], true)).toBe(2);
    expect(rehearse(['generous'], true)).toBeCloseTo(2 * K.generous, 9);
    expect(rehearse([], false)).toBe(-5);
    expect(rehearse(['peacemaker'], false)).toBeCloseTo(-5 * K.peacemaker, 9);
    expect(rehearse(['holds_grudges'], false)).toBeCloseTo(-5 * K.holdsGrudges, 9);
  });
});

// ---------------------------------------------------------------------------
// trait-company
// ---------------------------------------------------------------------------

describe('trait-company', () => {
  it('lifts a plain player 1 for a friend in the cast on the first Carlotta night, one who needs people 1.477, a guarded one 1.279, a restless one 1.193, a homebody 0.803 and an independent one 0.557, and four friends three times that; a cast without one costs who needs people 0.955, the guarded 0.558 and the restless 0.387, nobody else anything', () => {
    // The first night, 8 PM on Tuesday 4 May 2027 (Eastern Daylight Time).
    const CURTAIN = Date.UTC(2027, 4, 5, 0);
    const night = (traits: string[]) => {
      const sim = life('g30-cast', traits);
      sim.advanceTo(CURTAIN - 1);
      expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.at === CURTAIN && i.kind === 'school.call' && i.payload.call === 'performance')).toBe(true);
      const cast = sim.player.school!.casting!.cast!;
      expect(cast).toHaveLength(15);
      expect(cast.every((c) => (sim.player.school!.classmates.find((m) => m.name === c.name)!.bond ?? 0) < 25)).toBe(true);
      // The same life saved and loaded the moment before the curtain three times: no friend in the cast, one, and four.
      const lift = (friends: number) => {
        const s = reload(sim);
        for (const c of s.player.school!.casting!.cast!.slice(0, friends)) s.player.school!.classmates.find((m) => m.name === c.name)!.bond = 30; // TEST SETUP: a friend
        const before = s.player.wellbeing.morale;
        s.advanceTo(CURTAIN + 1);
        expect(s.player.school!.casting!.performed).toBe(1);
        return s.player.wellbeing.morale - before;
      };
      return { none: lift(0), one: lift(1), four: lift(4) };
    };
    // Homebody 0.8 → 0.8035 and Restless 1.2 → 1.1933, the other two that declare a company, inside [0.4, 1.8].
    const COMPANY = { plain: 1, needs: K.needsPeople, guarded: K.guarded, independent: K.independent, homebody: 0.8034547113, restless: 1.1932621799 } as const;
    const nights = {
      plain: night([]), needs: night(['needs_people']), guarded: night(['guarded']), independent: night(['independent']),
      homebody: night(['homebody']), restless: night(['restless']),
    };
    for (const who of Object.keys(COMPANY) as (keyof typeof COMPANY)[]) {
      const k = COMPANY[who];
      // A friend is a point by the knob; four are held to BONDS.most's three; none weighs 2 × (k − 1) on somebody whose
      // company is worth more than nobody's, and nothing on anybody else.
      expect(nights[who].one, who).toBeCloseTo(k, 9);
      expect(nights[who].four, who).toBeCloseTo(3 * k, 9);
      expect(nights[who].none, who).toBeCloseTo(k > 1 ? -2 * (k - 1) : 0, 9);
    }
    expect(nights.needs.one).toBeGreaterThan(nights.guarded.one);
    expect(nights.guarded.one).toBeGreaterThan(nights.plain.one);
    expect(nights.plain.one).toBeGreaterThan(nights.independent.one);
    expect(nights.needs.none).toBeCloseTo(-0.9545103258, 9);
    expect(nights.guarded.none).toBeCloseTo(-0.5583748366, 9);
  });
});

// ---------------------------------------------------------------------------
// trait-appetite
// ---------------------------------------------------------------------------

describe('trait-appetite', () => {
  // A body given at creation (Identity's height and weight, a player's own choice): 180 cm and 80.9 kg, a body mass index
  // of 80.9 / 1.8² = 24.97, a tenth of a kilogram under 25.
  const BODY = { heightCm: 180, weightKg: 80.9 } as const;
  const TRAITS = { disciplined: ['disciplined_body'], plain: [], indulgent: ['indulgent'] } as const;
  const APPETITE = { disciplined: K.disciplined, plain: 1, indulgent: K.indulgent } as const;
  type Who = keyof typeof TRAITS;
  const WHO = Object.keys(TRAITS) as Who[];
  const midnight = (n: number) => EDT(8, 24 + n, 0);
  const MS_YEAR = 365.2425 * MS_DAY;
  /** Hall's kilograms a kilocalorie a day: 23.9 kcal a kilogram, half of the way in 365 days. */
  const PER_KG = 23.9 * 365 / Math.LN2;
  /** Mifflin–St Jeor's resting day at the middle of its two sexes' constants (+5 and −161), at the sedentary 1.4. */
  const sedentaryDay = (kg: number, years: number) => 1.4 * (10 * kg + 6.25 * BODY.heightCm - 5 * years + (5 - 161) / 2);

  /**
   * Hall's rule worked day by day here: the habit is the day that held 80.9 kg at her age at the start, and each
   * midnight the gap between the habit at the appetite and what the day spent, the sedentary day at the weight and the
   * age then plus Hall's 23.9 kcal a day for each kilogram gained since less the 14 the sedentary day already counts,
   * goes into the weight, which is kept to the gram.
   */
  function hall(birth: number, from: number, appetite: number, days: number): number {
    const habit = sedentaryDay(BODY.weightKg, (from - birth) / MS_YEAR);
    let kg: number = BODY.weightKg;
    for (let n = 1; n <= days; n += 1) {
      const spent = sedentaryDay(kg, (midnight(n) - birth) / MS_YEAR) + (23.9 - 14) * (kg - BODY.weightKg);
      kg = Math.round((kg + (habit * appetite - spent) / PER_KG) * 1000) / 1000;
    }
    return kg;
  }

  it('moves the body sixty days on the clock to 80.589 kg disciplined, 80.9 plain and 81.404 indulgent, as Hall’s rule worked day by day here has it; a save and a load at day thirty ends on the same gram', () => {
    const kg = {} as Record<Who, number>;
    for (const who of WHO) {
      const sim = life('g30-body', [...TRAITS[who]], BODY);
      const birth = sim.player.birthInstant;
      const from = sim.now;
      expect(sim.player.body!.weightKg).toBe(80.9);
      // The habit is Mifflin–St Jeor's day at her age, worked here: what held 80.9 kg.
      expect(sim.player.body!.habitKcal).toBeCloseTo(sedentaryDay(80.9, (from - birth) / MS_YEAR), 6);
      const kept = life('g30-body', [...TRAITS[who]], BODY);
      kept.advanceTo(midnight(30) + 1);
      const loaded = reload(kept);
      for (const s of [sim, loaded]) s.advanceTo(midnight(60) + MS_HOUR);
      expect(sim.player.body!.weightKg, who).toBe(hall(birth, from, APPETITE[who], 60));
      expect(loaded.player.body!.weightKg, who).toBe(sim.player.body!.weightKg);
      kg[who] = sim.player.body!.weightKg;
    }
    expect(kg).toEqual({ disciplined: 80.589, plain: 80.9, indulgent: 81.404 });
  });

  it('takes the indulgent body past a body mass index of 25 in those sixty days, into the Collaboration’s 1.07 where the disciplined and plain bodies stay at 1.0, and the person look says so', () => {
    const lives = Object.fromEntries(WHO.map((who) => {
      const sim = life('g30-body', [...TRAITS[who]], BODY);
      sim.advanceTo(midnight(60) + MS_HOUR);
      return [who, sim];
    })) as Record<Who, Simulation>;
    // The Global BMI Mortality Collaboration's hazards (Lancet 2016): 1.0 from 22.5 to 25, 1.07 from 25 to 27.5.
    const HAZARD = { disciplined: 1.0, plain: 1.0, indulgent: 1.07 } as const;
    // 80.589 / 3.24 = 24.873; 80.9 / 3.24 = 24.969; 81.404 / 3.24 = 25.125.
    const WORDS = {
      disciplined: '5 ft 11 in and 178 lb, with a body mass index of 24.9, in the healthy weight range',
      plain: '5 ft 11 in and 178 lb, with a body mass index of 25.0, in the healthy weight range',
      indulgent: '5 ft 11 in and 179 lb, with a body mass index of 25.1, in the overweight range',
    } as const;
    for (const who of WHO) {
      const sim = lives[who];
      const body = sim.player.body!;
      expect(bmiHazard(body.weightKg / (body.heightCm / 100) ** 2), who).toBe(HAZARD[who]);
      const found = resolveLook(sim, subject('person', sim.player.id)) as { body?: ReactNode };
      h.sim = sim;
      expect(onScreen(renderToStaticMarkup(createElement(Fragment, null, found.body))), who).toContain(WORDS[who]);
    }
  });
});
