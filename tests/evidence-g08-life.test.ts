/**
 * Evidence for seven life rows the review of 2026-10-13 left partial (verification group g08-life): the end of a life,
 * and the six personality knobs a day is lived through. Each row's gaps are closed here through the command a player
 * sends or the clock that carries them, and each consequence is read where the row says it's read, against figures
 * worked out from the rule's own numbers or its published source, never from the helper the engine computes them with.
 *
 * - mortality: at a New Haven student's ninety-fifth birthday the year to the next is drawn from her body as it is
 *   then, the US 2024 table's 0.225491 at ninety-five times 0.8 for a body at its age's best and 3 for one worn to
 *   nothing (`frailty`), times the Lancet 2016 band of her weight (2.76 from a BMI of 40), times her country's
 *   e^-0.085 a year of the World Bank's life expectancy over the US 78.89. The twins of a seed share the day's draw, so
 *   every sound twin's end is her worn twin's too. A drawn end holds through a reload and a midnight her body keeps
 *   its band, and is called off and drawn again at the first midnight after she falls a band, and again after she
 *   recovers. The end that comes stops the clock for good, and the save opens onto A Life, Ended, rendered as the
 *   player has it: her name, the dates, Aged 95, New Haven, the work-study she earned at the Bulletin's $23 an hour,
 *   what she left, and Back To The Slots, pressed.
 * - knob:stressGain: three hours on empty, a day overdrawn, a Cabaret night's nerves (the figure Your Composure shows),
 *   a workout that hurts, the fall evaluation's concern and a rival's lead on the spring cast list, each for twins
 *   alike but for the knob: a detached trait, the ambition slider and the emotional-stability slider.
 * - knob:stressRecovery: an hour unwinding, a workout and four waking hours, for resilient, burns-out and steady twins,
 *   and the night's quality that reads the stress they leave.
 * - knob:sleepQuality and knob:energyRecovery: four hours through Sleep, the night nobody chose (which wakes a poor
 *   sleeper when a sound sleeper wakes and lies her in longer to make up part of it), and the Sleep dialog's
 *   suggestion and reason, rendered and pressed; the conscientiousness slider leans both.
 * - knob:hygieneDrift: four waking hours, a workout's sweat, the grimy hours' morale, and Shower's "already clean".
 * - knob:moraleSwing: a short night, Unwind, Work Out, a meal, hungry hours, a day overdrawn, a workout that hurts, the
 *   fall concern, and the cast list's own lead and a friend's.
 *
 * Found by the review of 2026-10-13, and settled here rather than in the review's todo: the night nobody chose doesn't
 * wake a poor sleeper later. `sleepAlone` keeps the day a sound sleeper's (`awakeSince` at the sound sleeper's wake) on
 * purpose, and the longer night is in the hours `creditNightAlone` pays, which these tests read as the energy it puts
 * back: √0.8294 of a plain twin's for a light sleeper, where a night not lengthened would give 0.8294.
 *
 * Left open here, since it's src's to change and not this file's: `ui/shell/LifeEnded.tsx` still says the Earned
 * figure is acting's wages "residuals among them". Nothing has recorded a residual since the career went on
 * 2026-10-09; what the record keeps as acting wages is the Summer Cabaret's stipend, and what the life tested here
 * earned is work-study's.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actress at Yale in
 * New Haven, from Monday 24 August 2026 at 7:30 AM. The knob twins are made with every disposition slider at the
 * middle, as the creation screen can set them, so that only the trait or the one slider a test names leans a knob.
 * The mortality lives are the same student born on 25 August 1931, 160 cm and 60 kg as creation takes them, turning
 * 95 the next morning. One LIFE FIXTURE: the country's weight is drawn for lives in Tokyo and Mexico City
 * (`quickSave`), which a New Haven life can't reach. The screens are rendered as the player has them
 * (react-dom/server) with `useGame`'s `run` as the save's own `execute`; a pressed button is the component's own
 * onClick, kept on its way through the JSX runtime.
 *
 * TEST SETUP, said again where it's done: dials set before an action or a birthday (condition, energy, stress,
 * sleep debt, morale, hygiene, nourishment), and kept rested through the weeks before a Cabaret night; the calendar
 * cleared of what wants the player where a sleep or a workout would cross it; an account overdrawn by a posting against
 * a test equity line; classmates' bonds set before the spring cast list goes up; and the Sleep dialog's open state, set
 * through the component's own useState in its render order, which a static render can't click.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Personality } from '@/engine/domain/model';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { healthOf } from '@/engine/systems/health';
import { trainingAt } from '@/engine/systems/life';
import { chanceOver } from '@/engine/systems/injury';
import { INJURY } from '@/engine/content/injury';
import { END_KIND } from '@/engine/systems/mortality';
import { BIRTHDAY_KIND } from '@/engine/systems/birthdays';
import { CABARET_KIND, EVALUATION_KIND, TERM_KIND } from '@/engine/systems/school';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
  buttons: [] as { text: string; disabled?: boolean; onClick?: () => void }[],
  exits: 0,
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

/** Every button a screen draws, with its words, whether it's grayed out, and its own onClick. */
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

// Without the original: it imports the looks, which import it back. Back To The Slots is `exitToMenu`, counted here.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    exitToMenu: () => { h.exits += 1; },
    navigate: noop,
    route: '/home',
    breadcrumbs: [],
    toasts: [],
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { GameShell } = await import('@/ui/shell/GameShell');
const { TimeControls } = await import('@/ui/shell/TimeControls');
const { AttributesPanel } = await import('@/ui/components/AttributesPanel');

// ---------------------------------------------------------------------------
// Lives, and the screens over them
// ---------------------------------------------------------------------------

/** Every disposition at the middle of its slider, where none leans a knob (creation's sliders reach 5 to 95). */
const MIDDLE: Personality = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 };
/** A new life: Ada Cole, born in New York, an actress at Yale in New Haven from Monday 24 August 2026, 7:30 AM. */
const student = (seed: string, traits: string[] = [], lean: Partial<Personality> = {}, extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personality: { ...MIDDLE, ...lean }, personalityTraits: traits, ...extra });
/** The same student born on 25 August 1931, 160 cm and 60 kg (BMI 23.4, the Lancet's 1.0 band): ninety-five the next morning. */
const elder = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation =>
  student(seed, [], {}, { birthYear: 1931, birthMonth: 8, birthDay: 25, heightCm: 160, weightKg: 60, ...extra });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** An instant in New Haven in August 2026, on Eastern Daylight Time (UTC−4), worked out here, not by the engine. */
const NH = (day: number, hour: number, minute = 0): number => Date.UTC(2026, 7, day, hour + 4, minute);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending');
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

/** TEST SETUP: nothing on the calendar that wants the player, canceled by hand. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
/** TEST SETUP: an account's balance set, by a posting against a test equity line, so the ledger still balances. */
function setBalance(sim: Simulation, accountId: string, to: number): void {
  const by = to - sim.universe.accounts[accountId]!.balance;
  if (by !== 0) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId, amount: by }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -by }] });
}
/** TEST SETUP: dials set by hand before an action. */
const dials = (sim: Simulation, set: Partial<Simulation['player']['wellbeing']>) => Object.assign(sim.player.wellbeing, set);
/** TEST SETUP: played by somebody who looks after themselves, awake through the evening, as tests/leave.test.ts plays one. */
const tended = (sim: Simulation, until: number, step = 6 * MS_HOUR) => {
  while (sim.now < until) {
    dials(sim, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + step));
  }
};
const lookAfter = (sim: Simulation, action: string) => sim.must<{ doneAt: number }>({ kind: 'life.look_after', payload: { action } });
const sleep4 = (sim: Simulation) => sim.must<{ wokeAt: number; quality: number; recovered: number }>({ kind: 'life.sleep', payload: { hours: 4 } });
const once = <T,>(make: () => T): (() => T) => { let kept: T | undefined; return () => (kept ??= make()); };

/** What the player reads: the markup with every title attribute taken out, then every tag, and its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
/** A screen as the player has it, with the open states given (TEST SETUP) in its components' render order. */
function drawn(sim: Simulation, screen: FunctionComponent, states: unknown[] = []): { text: string; buttons: typeof h.buttons } {
  h.sim = sim;
  h.buttons = [];
  h.states = [...states];
  const html = renderToStaticMarkup(createElement(screen));
  expect(h.states).toHaveLength(0);
  return { text: onScreen(html), buttons: h.buttons };
}

/**
 * Each knob's figure for a life that leans it, worked out by hand from the trait's or the slider's own number and the
 * knob's soft limits (`KNOB_LIMITS`), bent as the rule says: exp(L·tanh(ln v / L)), L the log of the limit on v's side.
 * A slider at 95 leans its knobs fully: emotional stability 1 − 0.3 on stressGain and 1 + 0.3 on stressRecovery,
 * ambition 1 + 0.15 on stressGain, conscientiousness 1 + 0.1 on sleepQuality and energyRecovery.
 */
const K = {
  detachedGain: 0.85248, //    detached, 0.85 in [0.5, 1.8]
  ambitiousGain: 1.14704, //   ambition 95, 1.15 in [0.5, 1.8]
  steadyGain: 0.72021, //      emotional stability 95, 0.7 in [0.5, 1.8]
  steadyRecovery: 1.25985, //  emotional stability 95, 1.3 in [0.6, 1.5]
  resilientRecovery: 1.18643, // resilient, 1.2 in [0.6, 1.5]
  burnsOutRecovery: 0.79409, // burns out, 0.78 in [0.6, 1.5]
  lightDepth: 0.8294, //       light sleeper, 0.8 in [0.75, 1.25]
  orderedDepth: 1.09407, //    conscientiousness 95, 1.1 in [0.75, 1.25]
  orderedRestores: 1.09407, // conscientiousness 95, 1.1 in [0.8, 1.25]
  homebodyRestores: 1.13197, // homebody, 1.15 in [0.8, 1.25]
  restlessRestores: 0.90649, // restless, 0.9 in [0.8, 1.25]
  orderlyDrift: 0.8294, //     orderly, 0.8 in [0.75, 1.35]
  chaoticDrift: 1.23507, //    chaotic, 1.3 in [0.75, 1.35]
  sentimentalSwing: 1.13936, // sentimental, 1.15 in [0.65, 1.35]
  assuredSwing: 0.7992, //     self assured, 0.78 in [0.65, 1.35]
} as const;

// ---------------------------------------------------------------------------
// mortality
// ---------------------------------------------------------------------------

/** Her ninety-fifth birthday, nine in the morning of Tuesday 25 August 2026 in New Haven, and the next one. */
const BIRTHDAY = NH(25, 9);
const NEXT_BIRTHDAY = Date.UTC(2027, 7, 25, 13);
/** The US 2024 life table's chance of dying within the year at ninety-five (CDC NCHS, United States Life Tables, 2024). */
const AT_95 = 0.225491;
/** The odds a year carries, from a body at its age's best (0.8 of the table) to one worn to nothing (3 times it). */
const SOUND = 0.8;
const WORN = 3;
const SEEDS = 120;

interface Draw { seed: string; endedBefore: boolean; ends: number[]; band: number | undefined; said: number }
/** Her birthday reached by the clock, her condition set a minute before it (TEST SETUP), and what the year drew. */
function birthdayDraw(seed: string, condition: number, extra: Partial<NewSaveConfig> = {}): { sim: Simulation; draw: Draw } {
  const sim = elder(seed, extra);
  expect(pendingOf(sim, BIRTHDAY_KIND).map((i) => i.at)).toEqual([BIRTHDAY]);
  sim.advanceTo(BIRTHDAY - 60_000);
  const endedBefore = sim.universe.meta.endedAt !== undefined;
  sim.player.wellbeing.condition = condition; // TEST SETUP: the shape she's in as the birthday comes
  sim.advanceTo(BIRTHDAY + 60_000);
  const ends = pendingOf(sim, END_KIND).filter((i) => i.at > BIRTHDAY && i.at < NEXT_BIRTHDAY).map((i) => i.at);
  return { sim, draw: { seed, endedBefore, ends, band: healthOf(sim.player).endBand, said: titled(sim, 'Happy Birthday: 95').length } };
}
/** The sound and worn twins of each seed, drawn once for the tests that read them. */
const twinDraws = once(() => Array.from({ length: SEEDS }, (_, n) => ({
  sound: birthdayDraw(`g08-end-${n}`, 100).draw,
  worn: birthdayDraw(`g08-end-${n}`, 0).draw,
})));
/** Within three standard deviations of a binomial count. */
function aboutAsOften(count: number, n: number, p: number): void {
  expect(Math.abs(count - n * p), `${count} of ${n} against ${(n * p).toFixed(1)}`).toBeLessThan(3 * Math.sqrt(n * p * (1 - p)));
}
/** The band of the year's odds a condition at ninety-five gives, by `frailty`'s published shape: 0.8 + 2.2·short^1.5. */
const bandAt95 = (condition: number) => Math.round((0.8 + 2.2 * Math.max(0, 1 - Math.min(1, condition / 39.8)) ** 1.5) / 0.25) * 0.25;

describe('mortality', () => {
  it('PLAYER JOURNEY: a New Haven student’s 95th birthday draws the year ahead from her condition then: worn twins end about 0.677 of the time, sound ones 0.180, and every sound twin’s end is her worn twin’s too', () => {
    const draws = twinDraws();
    for (const { sound, worn } of draws) {
      for (const d of [sound, worn]) {
        expect(d.endedBefore, d.seed).toBe(false);
        // The birthday is said on the day, once, and the year's draw is at most one end.
        expect(d.said, d.seed).toBe(1);
        expect(d.ends.length, d.seed).toBeLessThanOrEqual(1);
      }
      // The band each was drawn at: 0.8 rounds to the quarter 0.75, three is three.
      expect(sound.band).toBe(0.75);
      expect(worn.band).toBe(3);
    }
    // One draw for the day, the same for both: whatever ends the sound twin's year ends the worn twin's, on the day.
    const soundEnded = draws.filter((d) => d.sound.ends.length);
    expect(soundEnded.length).toBeGreaterThan(0);
    for (const d of soundEnded) expect(d.worn.ends, d.sound.seed).toEqual(d.sound.ends);
    const sound = soundEnded.length;
    const worn = draws.filter((d) => d.worn.ends.length).length;
    aboutAsOften(sound, SEEDS, AT_95 * SOUND);
    aboutAsOften(worn, SEEDS, AT_95 * WORN);
    expect(worn).toBeGreaterThan(sound);
  });

  it('PLAYER JOURNEY: weighs the year by her weight: at 160 cm and 105 kg (BMI 41, the Lancet 2016’s 2.76 from 40) twins end about 0.498 of the time, and every 60 kg twin’s end is hers too', () => {
    const draws = twinDraws();
    const heavy = draws.map((_, n) => {
      const { sim, draw } = birthdayDraw(`g08-end-${n}`, 100, { weightKg: 105 });
      expect(draw.endedBefore).toBe(false);
      // Still past 40 on the day: 160 cm and what a day did to 105 kg.
      expect(sim.player.body!.weightKg / 1.6 ** 2).toBeGreaterThan(40);
      return draw;
    });
    // The same day's draw: whatever ends the 60 kg twin's year ends the 105 kg twin's.
    const lightEnded = draws.map((d, n) => [d.sound, heavy[n]!] as const).filter(([sound]) => sound.ends.length);
    expect(lightEnded.length).toBeGreaterThan(0);
    for (const [sound, heavier] of lightEnded) expect(heavier.ends, sound.seed).toEqual(sound.ends);
    const ended = heavy.filter((d) => d.ends.length).length;
    aboutAsOften(ended, SEEDS, AT_95 * SOUND * 2.76);
    expect(ended).toBeGreaterThan(lightEnded.length);
  });

  it('weighs it by the country she lives in: aged 95 and worn, Tokyo ends about 0.437 of lives and Mexico City 0.921 (World Bank 2024 life expectancy, e^0.085 a year from the US 78.89) (LIFE FIXTURE: lives in Tokyo and Mexico City, which New Haven can’t reach)', () => {
    // Born 7 January 1931; the clock starts on Monday 5 January 2026, and she is ninety-five at nine on the Wednesday.
    const birthdays = { 'jp-13-tokyo': [Date.UTC(2026, 0, 7, 0), Date.UTC(2027, 0, 7, 0)], 'mx-cmx-mexicocity': [Date.UTC(2026, 0, 7, 15), Date.UTC(2027, 0, 7, 15)] } as const;
    const ended: Record<string, number> = {};
    const reached: Record<string, number> = {};
    for (const [city, [day, next]] of Object.entries(birthdays)) {
      ended[city] = 0;
      reached[city] = 0;
      for (let n = 0; n < 100; n += 1) {
        const sim = quickSave({ startLocationId: city, homeRegionId: city, birthYear: 1931, birthMonth: 1, birthDay: 7, heightCm: 160, weightKg: 60 }, `g08-abroad-${n}`);
        expect(pendingOf(sim, BIRTHDAY_KIND).map((i) => i.at)).toEqual([day]);
        sim.advanceTo(day - 60_000);
        // The two days from the first morning are a share of a year drawn too: a life they end has no birthday draw.
        if (sim.universe.meta.endedAt !== undefined) continue;
        reached[city] += 1;
        sim.player.wellbeing.condition = 0; // TEST SETUP: worn to nothing as the birthday comes
        sim.advanceTo(day + 60_000);
        if (pendingOf(sim, END_KIND).some((i) => i.at > day && i.at < next)) ended[city] += 1;
      }
      // Two days of a year at ninety-five end about one life in a thousand at the table's rate: nearly all reach it.
      expect(reached[city]!, city).toBeGreaterThanOrEqual(97);
    }
    // Japan's 84.04 years: e^(−0.085 × 5.15) = 0.6455 of the US table; Mexico's 75.26: e^(0.085 × 3.63) = 1.3615.
    aboutAsOften(ended['jp-13-tokyo']!, reached['jp-13-tokyo']!, AT_95 * WORN * 0.64549);
    aboutAsOften(ended['mx-cmx-mexicocity']!, reached['mx-cmx-mexicocity']!, AT_95 * WORN * 1.36145);
    expect(ended['mx-cmx-mexicocity']!).toBeGreaterThan(ended['jp-13-tokyo']!);
  });

  it('PLAYER JOURNEY: a drawn end holds through a reload and a midnight her body keeps its band, and is called off and drawn again from the first midnight after she falls a band, and after she recovers', () => {
    /** A sound twin's drawn end, a reload, a midnight that keeps her band, then worn to nothing and a midnight on. */
    const played = (seed: string) => {
      const { sim } = birthdayDraw(seed, 100);
      const drawn = pendingOf(sim, END_KIND);
      // Saved and opened again: the same end, once, and the birthday's draw isn't made a second time.
      const back = reload(sim);
      const reloaded = { ends: pendingOf(back, END_KIND).map((i) => [i.id, i.at]), birthdays: pendingOf(back, BIRTHDAY_KIND).map((i) => i.at) };
      // The first midnight: held at her age's ceiling (39.8 at 95), still 0.8 of the table, the same band.
      back.advanceTo(NH(26, 0, 1));
      const kept = { band: healthOf(back.player).endBand, status: back.universe.scheduled.find((i) => i.id === drawn[0]?.id)?.status };
      // Worn to nothing (TEST SETUP), the next midnight sees the band move.
      back.player.wellbeing.condition = 0;
      back.advanceTo(NH(27, 0, 1));
      return { back, drawn, reloaded, kept, redrawn: pendingOf(back, END_KIND) };
    };
    // A seed whose sound twin's end is more than three days off, and whose worn redraw puts one on the calendar.
    const candidates = twinDraws().filter((d) => d.sound.ends.length && d.sound.ends[0]! > BIRTHDAY + 3 * MS_DAY).map((d) => d.sound.seed);
    expect(candidates.length).toBeGreaterThan(0);
    const life = candidates.map(played).find((x) => x.redrawn.length > 0)!;
    expect(life, 'a worn redraw that ends the year').toBeDefined();
    const { back, drawn, reloaded, kept, redrawn } = life;
    expect(drawn).toHaveLength(1);
    expect(reloaded.ends).toEqual([[drawn[0]!.id, drawn[0]!.at]]);
    expect(reloaded.birthdays).toEqual([NEXT_BIRTHDAY]);
    expect(kept).toEqual({ band: 0.75, status: 'pending' });
    // The band moved: the end is called off, and the rest of the year to the birthday drawn again, from that midnight.
    const worn = healthOf(back.player).endBand!;
    expect(worn).toBe(bandAt95(back.player.wellbeing.condition));
    expect(worn).toBeGreaterThanOrEqual(2.5);
    expect(back.universe.scheduled.find((i) => i.id === drawn[0]!.id)!.status).toBe('cancelled');
    expect(redrawn).toHaveLength(1);
    expect(redrawn[0]!.id).not.toBe(drawn[0]!.id);
    expect(redrawn[0]!.at).toBeGreaterThan(NH(27, 0));
    expect(redrawn[0]!.at).toBeLessThan(NEXT_BIRTHDAY);
    // Recovered (TEST SETUP), the next midnight moves her back to the sound band, and the worn draw's end is called
    // off with it.
    back.player.wellbeing.condition = 100;
    back.advanceTo(NH(28, 0, 1));
    expect(healthOf(back.player).endBand).toBe(0.75);
    expect(back.universe.scheduled.find((i) => i.id === redrawn[0]!.id)!.status).toBe('cancelled');
  });

  it('PLAYER JOURNEY: the end, reached by the clock, stops it for good, and the save opens onto A Life, Ended: her name, the dates, Aged 95, New Haven, the work-study she earned at $23 an hour, what she left, and Back To The Slots', () => {
    // The first sound twin whose drawn end comes, played through the year that birthday drew, up to the next one.
    let played: { sim: Simulation; to: number } | undefined;
    for (const d of twinDraws().filter((x) => x.sound.ends.length)) {
      const life = birthdayDraw(d.sound.seed, 100).sim;
      const { to } = life.advanceTo(NEXT_BIRTHDAY - 60_000);
      played = { sim: life, to };
      if (life.universe.meta.endedAt !== undefined) break;
    }
    expect(played?.sim.universe.meta.endedAt, 'a sound twin whose drawn end came').toBeDefined();
    const s = played!.sim;
    // The clock went no further than the end.
    expect(played!.to).toBe(s.universe.meta.endedAt);
    const came = s.universe.scheduled.filter((i) => i.kind === END_KIND && i.status === 'done');
    expect(came).toHaveLength(1);
    const end = came[0]!.at;
    expect(s.universe.meta.endedAt).toBe(end);
    expect(s.now).toBe(end);
    expect(end).toBeLessThan(NEXT_BIRTHDAY);
    expect(s.universe.meta.endedAge).toBe(95);
    expect(titled(s, 'A Life, Ended').map((n) => n.body)).toEqual(['Ada Cole died at 95.']);
    // For good: thirty days asked for, nothing moves.
    expect(s.advanceBy(30 * MS_DAY).itemsProcessed).toBe(0);
    expect(s.now).toBe(end);

    // What the screen should say, worked out here: the dates in New Haven's calendar, the months from the first
    // morning (7:30 AM, 24 August 2026), the work-study hours her payslips name at $23.00 (Yale Bulletin 2026–2027),
    // and every account of hers, what she owes taken off.
    const dated = (at: number) => new Date(at).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' });
    const months = Math.round(((end - NH(24, 7, 30)) / (365.2425 * MS_DAY)) * 12);
    const hours = s.universe.transactions.map((t) => /^Work-study wages, (\d+(?:\.\d+)?) hours/.exec(t.memo)?.[1]).filter(Boolean).reduce((sum, x) => sum + Number(x), 0);
    const left = Object.values(s.universe.accounts).filter((a) => a.ownerId === s.player.id && !a.nominal).reduce((sum, a) => sum + a.balance, 0);
    const dollars = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

    for (const opened of [s, reload(s)]) {
      // Opened again, the clock still doesn't move, and the end is said once.
      opened.advanceBy(MS_DAY);
      expect(opened.now).toBe(end);
      expect(titled(opened, 'A Life, Ended')).toHaveLength(1);
      h.exits = 0;
      const { text, buttons } = drawn(opened, GameShell);
      expect(text).toContain('A Life, Ended');
      expect(text).toContain('Ada Cole');
      expect(text).toContain(`August 25, 1931 – ${dated(end)} · Aged 95 · Actress · New Haven`);
      expect(text).toContain(`Years In The World ${months} Months`);
      expect(text).toContain(`Earned ${dollars(Math.round(hours * 2300))} Wages, before tax Left Behind`);
      expect(text).toContain(`Left Behind ${dollars(left)} Their net worth at the end`);
      // Nothing of the shell: no rail, no clock, no Save & Exit. The one way on is back to the slots.
      expect(text).not.toContain('Save & Exit');
      expect(text).not.toContain('Skip To Content');
      expect(buttons.map((b) => b.text)).toEqual(['Back To The Slots']);
      buttons[0]!.onClick!();
      expect(h.exits).toBe(1);
    }
    expect(hours).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// The knobs: lives alike but for one, shared by the rows that read them
// ---------------------------------------------------------------------------

/**
 * The twins the stress and mood rows compare: plain; detached (stressGain 0.85, and bondWarmth, which no test here
 * reads); the ambition slider at 95, which leans stressGain and nothing else; and sentimental, moraleSwing alone.
 */
const TWINS = {
  plain: [[], {}],
  detached: [['detached'], {}],
  ambitious: [[], { ambition: 95 }],
  sentimental: [['sentimental'], {}],
} as const satisfies Record<string, readonly [readonly string[], Partial<Personality>]>;
type Twin = keyof typeof TWINS;
const twin = (seed: string, who: Twin) => student(seed, [...TWINS[who][0]], TWINS[who][1]);

/** A day overdrawn, carried across the midnight into Tuesday 25 August, beside the same life not overdrawn: the change each saw. */
const worried = once(() => {
  const out = {} as Record<Twin, { calm: { stress: number; morale: number }; owing: { stress: number; morale: number }; after: { calm: number; owing: number } }>;
  for (const who of ['plain', 'detached', 'sentimental'] as const) {
    const seen = [false, true].map((overdrawn) => {
      const sim = twin('g08-worry', who);
      sim.advanceTo(NH(24, 23, 58));
      // TEST SETUP: fifty dollars overdrawn, inside the account's overdraft.
      if (overdrawn) setBalance(sim, sim.player.primaryAccountId!, -50_00);
      const before = { ...sim.player.wellbeing };
      sim.advanceTo(NH(25, 0, 2));
      const moved = { stress: sim.player.wellbeing.stress - before.stress, morale: sim.player.wellbeing.morale - before.morale };
      // Saved and opened again two minutes past midnight, and half an hour on: the day's worry isn't felt twice.
      const back = reload(sim);
      expect(back.universe.accounts[back.player.primaryAccountId!]!.balance).toBe(overdrawn ? -50_00 : sim.universe.accounts[sim.player.primaryAccountId!]!.balance);
      back.advanceTo(NH(25, 0, 32));
      return { moved, stress: back.player.wellbeing.stress };
    });
    out[who] = { calm: seen[0]!.moved, owing: seen[1]!.moved, after: { calm: seen[0]!.stress, owing: seen[1]!.stress } };
  }
  return out;
});

/** The first minute from now a workout started would end on a hurting roll: a search of the injury stream ahead, in the day. */
function hurtingStart(sim: Simulation): number {
  for (let k = 0; k < 4 * 24 * 60; k += 1) {
    const start = sim.now + k * 60_000;
    const hour = new Date(start).getUTCHours() - 4;
    if (hour < 9 || hour > 19) continue;
    const end = start + MS_HOUR;
    const source = trainingAt(sim, sim.player, end).where === 'run' ? 'run' : 'gym';
    if (sim.rng('health.injury', sim.player.id, `${source}-${end}`).next() < chanceOver(INJURY.perThousandHours[source], 1)) return start;
  }
  throw new Error('No hurting minute in four days.');
}
/** A workout that hurts, had through the command at the same minute by each twin, from the same dials. */
const hurt = once(() => {
  const out = {} as Record<Twin, { stress: number; morale: number; at: number; injuredAt: number | undefined }>;
  for (const who of ['plain', 'ambitious', 'sentimental'] as const) {
    const sim = twin('g08-hurt', who);
    clearCalendar(sim); // TEST SETUP
    sim.advanceTo(hurtingStart(sim));
    clearCalendar(sim); // TEST SETUP
    expect(sim.player.awakeSince!).toBeLessThanOrEqual(sim.now);
    dials(sim, { energy: 90, stress: 30, morale: 50, nourishment: 70, hygiene: 90 }); // TEST SETUP
    const started = sim.now;
    lookAfter(sim, 'exercise');
    out[who] = { stress: sim.player.wellbeing.stress, morale: sim.player.wellbeing.morale, at: started, injuredAt: healthOf(sim.player).injury?.at };
  }
  return out;
});

/**
 * A first year's fall played by the clock alone, the seed one where she's given a lead in the spring: the change at the
 * fall evaluation's instant (Friday 11 December, 5 PM), and at the spring term's (Monday 4 January, 9 AM), where the
 * cast list goes up, with every classmate a rival or every classmate a friend (TEST SETUP, set a moment before it).
 */
const terms = once(() => {
  const out = {} as Record<Twin, {
    standing: string; evaluation: { stress: number; morale: number };
    rivals: { stress: number; morale: number; youLead: boolean; theirLeads: number };
    friends: { stress: number; morale: number; youLead: boolean; theirLeads: number };
  }>;
  for (const who of ['plain', 'ambitious', 'sentimental'] as const) {
    const sim = twin('g08-lead-0', who);
    sim.advanceTo(NH(31, 12));
    const [evaluation] = pendingOf(sim, EVALUATION_KIND);
    expect(evaluation!.at).toBe(Date.UTC(2026, 11, 11, 22));
    sim.advanceTo(evaluation!.at - 1);
    const e0 = { ...sim.player.wellbeing };
    sim.advanceTo(evaluation!.at);
    const evaluated = { stress: sim.player.wellbeing.stress - e0.stress, morale: sim.player.wellbeing.morale - e0.morale };
    const standing = sim.player.school!.standing;
    const [spring] = pendingOf(sim, TERM_KIND);
    expect(spring!.at).toBe(Date.UTC(2027, 0, 4, 14));
    sim.advanceTo(spring!.at - 1);
    const kept = serialise(sim.universe);
    const castWith = (life: Simulation, bond: number) => {
      for (const mate of life.player.school!.classmates) mate.bond = bond; // TEST SETUP
      const w0 = { ...life.player.wellbeing };
      life.advanceTo(spring!.at);
      const list = life.player.school!.around!.list;
      return {
        stress: life.player.wellbeing.stress - w0.stress, morale: life.player.wellbeing.morale - w0.morale,
        youLead: list.some((x) => x.name === 'You' && x.size === 'lead'),
        theirLeads: list.filter((x) => x.name !== 'You' && x.size === 'lead').length,
      };
    };
    out[who] = {
      standing,
      evaluation: evaluated,
      rivals: castWith(sim, -60),
      friends: castWith(loadSave(deserialise(kept) as never), 35),
    };
  }
  return out;
});

/** A Cabaret night: joined in September, its first show (Thursday 15 October, 8 PM), the panel read just before it. */
const cabaret = once(() => {
  const out = {} as Record<'plain' | 'ambitious' | 'steady', { composure: number; panel: string; nerves: number }>;
  for (const [who, lean] of [['plain', {}], ['ambitious', { ambition: 95 }], ['steady', { emotionalStability: 95 }]] as const) {
    const sim = student('g08-cab', [], lean);
    tended(sim, Date.UTC(2026, 8, 20, 13)); // TEST SETUP: rested through the weeks before
    sim.must({ kind: 'school.cabaret', payload: {} });
    const show = pendingOf(sim, CABARET_KIND).filter((i) => i.payload.call === 'performance').sort((a, b) => a.at - b.at)[0]!;
    expect(show.at).toBe(Date.UTC(2026, 9, 16, 0));
    tended(sim, show.at - 2 * MS_HOUR, MS_HOUR); // TEST SETUP
    sim.advanceTo(show.at - 1);
    dials(sim, { stress: 30, morale: 50, energy: 80 }); // TEST SETUP
    const composure = sim.player.attrs!.composure;
    const panel = drawn(sim, AttributesPanel).text;
    sim.advanceTo(show.at);
    expect(sim.player.school!.cabaret!.performed).toBe(1);
    out[who] = { composure, panel, nerves: sim.player.wellbeing.stress - 30 };
  }
  return out;
});

describe('knob:stressGain', () => {
  it('PLAYER JOURNEY: three hours on empty add 3.75 stress to a plain student, 3.042 to a detached twin, 4.456 to an ambitious one and 2.134 to a steady one (1.6·k − 0.35·r an hour), and the night after reads it', () => {
    const want: Record<string, number> = {
      plain: 3 * (1.6 - 0.35),
      detached: 3 * (1.6 * K.detachedGain - 0.35),
      ambitious: 3 * (1.6 * K.ambitiousGain - 0.35),
      steady: 3 * (1.6 * K.steadyGain - 0.35 * K.steadyRecovery),
    };
    const lives = { plain: twin('g08-empty', 'plain'), detached: twin('g08-empty', 'detached'), ambitious: twin('g08-empty', 'ambitious'), steady: student('g08-empty', [], { emotionalStability: 95 }) };
    for (const [who, sim] of Object.entries(lives)) {
      clearCalendar(sim); // TEST SETUP: so the night after isn't refused as Registration's hours
      dials(sim, { energy: 5, stress: 20 }); // TEST SETUP: run down past empty, at 20 stress
      sim.advanceBy(3 * MS_HOUR);
      expect(sim.player.wellbeing.energy, who).toBe(0);
      expect(sim.player.wellbeing.stress - 20, who).toBeCloseTo(want[who]!, 3);
      // Read by the night: 0.24 off its quality for a hundred of stress, from 0.82.
      expect(sleep4(sim).quality, who).toBeCloseTo(0.82 - 0.0024 * (20 + want[who]!), 4);
    }
    expect(lives.detached.player.wellbeing.stress).toBeLessThan(lives.plain.player.wellbeing.stress);
  });

  it('PLAYER JOURNEY: a day overdrawn, across midnight, adds 4 stress to a plain student and 3.410 to a detached twin, once: not again half an hour on, across a reload', () => {
    const w = worried();
    expect(w.plain.owing.stress - w.plain.calm.stress).toBeCloseTo(4, 3);
    expect(w.detached.owing.stress - w.detached.calm.stress).toBeCloseTo(4 * K.detachedGain, 3);
    // Untroubled, midnight brings nothing: four minutes awake, 0.35 an hour cleared.
    expect(w.plain.calm.stress).toBeCloseTo(-0.35 * 4 / 60, 3);
    // Reloaded and half an hour on, the twins are still a day's worry apart, and no more.
    expect(w.plain.after.owing - w.plain.after.calm).toBeCloseTo(4, 3);
    expect(w.detached.after.owing - w.detached.after.calm).toBeCloseTo(4 * K.detachedGain, 3);
  });

  it('PLAYER JOURNEY: a Cabaret night’s nerves add what Your Composure says they will, 6 × (1 − composure/100) × k: 3.45 plain, 3.957 ambitious, and less for a steady twin, whose slider gave her more composure too', () => {
    const c = cabaret();
    expect(c.plain.composure).toBe(c.ambitious.composure);
    expect(c.steady.composure).toBeGreaterThan(c.plain.composure);
    const k = { plain: 1, ambitious: K.ambitiousGain, steady: K.steadyGain } as const;
    for (const who of ['plain', 'ambitious', 'steady'] as const) {
      const nerves = 6 * (1 - c[who].composure / 100) * k[who];
      expect(c[who].nerves, who).toBeCloseTo(nerves, 3);
      expect(c[who].panel, who).toContain(`Composure ${Math.round(c[who].composure)} Nerves add ${Math.round(nerves * 10) / 10} stress before a performance`);
    }
    expect(c.plain.nerves).toBeCloseTo(3.45, 3);
    expect(c.ambitious.nerves).toBeCloseTo(3.45 * K.ambitiousGain, 3);
    expect(c.steady.nerves).toBeLessThan(c.plain.nerves);
  });

  it('PLAYER JOURNEY: a workout that hurts adds 6 × k stress on the hour’s and the workout’s: 27.65 plain, 28.532 ambitious', () => {
    const r = hurt();
    expect(r.ambitious.at).toBe(r.plain.at);
    for (const who of ['plain', 'ambitious'] as const) expect(r[who].injuredAt, who).toBe(r[who].at + MS_HOUR);
    expect(r.plain.stress).toBeCloseTo(30 - 0.35 - 8 + 6, 3);
    expect(r.ambitious.stress).toBeCloseTo(30 - 0.35 - 8 + 6 * K.ambitiousGain, 3);
  });

  it('PLAYER JOURNEY: the fall evaluation’s concern adds 3 × k stress, and each rival’s lead on the spring cast list 1.5 × k', () => {
    const t = terms();
    for (const who of ['plain', 'ambitious'] as const) {
      const k = who === 'plain' ? 1 : K.ambitiousGain;
      expect(t[who].standing, who).toBe('concern');
      expect(t[who].evaluation.stress, who).toBeCloseTo(3 * k, 3);
      expect(t[who].rivals.theirLeads, who).toBeGreaterThan(0);
      expect(t[who].rivals.stress, who).toBeCloseTo(1.5 * k * t[who].rivals.theirLeads, 3);
      // Friends' leads sting nobody.
      expect(t[who].friends.stress, who).toBeCloseTo(0, 6);
    }
  });
});

describe('knob:stressRecovery', () => {
  const R = { plain: 1, resilient: K.resilientRecovery, burnsOut: K.burnsOutRecovery, steady: K.steadyRecovery } as const;
  const life = (seed: string, who: keyof typeof R) => (who === 'resilient' ? student(seed, ['resilient']) : who === 'burnsOut' ? student(seed, ['burns_out']) : who === 'steady' ? student(seed, [], { emotionalStability: 95 }) : student(seed));

  it('PLAYER JOURNEY: an hour unwinding takes 10.35 × r stress off (10 for the hour’s ease, 0.35 for the hour awake): 10.35 plain, 12.280 resilient, 8.219 burns out, 13.039 steady, and the night after reads it', () => {
    const left: Record<string, number> = {};
    for (const who of Object.keys(R) as (keyof typeof R)[]) {
      const sim = life('g08-unwind', who);
      dials(sim, { energy: 90, stress: 60 }); // TEST SETUP
      lookAfter(sim, 'unwind');
      left[who] = sim.player.wellbeing.stress;
      expect(60 - left[who]!, who).toBeCloseTo(10.35 * R[who], 3);
      clearCalendar(sim); // TEST SETUP
      expect(sleep4(sim).quality, who).toBeCloseTo(0.82 - 0.0024 * left[who]!, 4);
    }
    expect(left.resilient).toBeLessThan(left.plain!);
    expect(left.burnsOut).toBeGreaterThan(left.plain!);
  });

  it('PLAYER JOURNEY: a workout takes 8.35 × r off, and four waking hours 1.4 × r', () => {
    for (const who of Object.keys(R) as (keyof typeof R)[]) {
      const trained = life('g08-unwind', who);
      dials(trained, { energy: 90, stress: 60 }); // TEST SETUP
      lookAfter(trained, 'exercise');
      expect(healthOf(trained.player).injury, who).toBeUndefined();
      expect(60 - trained.player.wellbeing.stress, who).toBeCloseTo(8.35 * R[who], 3);
      const waking = life('g08-unwind', who);
      dials(waking, { energy: 90, stress: 60 }); // TEST SETUP
      waking.advanceBy(4 * MS_HOUR);
      expect(60 - waking.player.wellbeing.stress, who).toBeCloseTo(1.4 * R[who], 3);
    }
  });
});

/**
 * Four hours through Sleep at 7:30 AM, from energy 30, stress 30 and no debt (TEST SETUP), with the calendar cleared, as
 * the night: no night on record since the morning before (TEST SETUP). A new life wakes with the night before on record
 * (`lastSleptAt`), and from 2026-10-21 (brief 20) a sleep after the night costs nothing a short night costs: until then
 * these four hours were short-night wear whenever they were taken.
 */
function shortNight(seed: string, traits: string[] = [], lean: Partial<Personality> = {}) {
  const sim = student(seed, traits, lean);
  clearCalendar(sim); // TEST SETUP
  dials(sim, { energy: 30, stress: 30, sleepDebt: 0, morale: 50 }); // TEST SETUP
  sim.player.lastSleptAt = NH(23, 7, 30); // TEST SETUP
  const night = sleep4(sim);
  expect(sim.player.wellbeing.energy).toBeCloseTo(30 + night.recovered, 9);
  return { ...night, morale: sim.player.wellbeing.morale };
}
/**
 * The night nobody chose, from midnight into Tuesday 25 August: the clock taken to midnight, then on to when a sound
 * sleeper wakes at the stress she went to bed with, 7.8 − 0.012 × stress hours (`unattendedNight`). Energy 2 and a
 * debt of 15 at midnight (TEST SETUP), so the night stays under the 74 an unchosen night stops at.
 */
function nightAlone(seed: string, traits: string[] = []) {
  const sim = student(seed, traits);
  sim.advanceTo(NH(25, 0));
  dials(sim, { energy: 2, sleepDebt: 15 }); // TEST SETUP
  const wake = NH(25, 0) + Math.round((7.8 - 0.012 * sim.player.wellbeing.stress) * MS_HOUR);
  sim.advanceTo(wake);
  return { wake, awakeSince: sim.player.awakeSince, gained: sim.player.wellbeing.energy - 2 };
}
/**
 * The Sleep dialog at 9 PM on the first evening, from stress 10 and no debt (TEST SETUP), with Meeting Your Class at
 * ten the next morning: the hours a normal night's 6.56 of rest asks over a 16-hour day, 9.84 / (quality × restores ×
 * 0.995 + 0.41), to the half hour (0.995: a night at twenty-four, the age table's). Pressed, its button sleeps them.
 */
function sleepDialog(seed: string, traits: string[] = []) {
  const sim = student(seed, traits);
  sim.advanceTo(NH(24, 21));
  dials(sim, { stress: 10, sleepDebt: 0 }); // TEST SETUP
  const { text, buttons } = drawn(sim, TimeControls, [true, false, null, false, false, h.keep]);
  const press = buttons.find((b) => /^Sleep \d/.test(b.text))!;
  // Pressed in this life's dialog: `run` is the save's own `execute`, so the save it runs on is this one.
  return { text, says: press.text, press: () => { h.sim = sim; press.onClick!(); }, sim };
}

describe('knob:sleepQuality', () => {
  it('PLAYER JOURNEY: four hours of Sleep at stress 30 are 0.748 deep for a plain student (0.82 − 0.24 × 0.3), 0.620 for a light sleeper and 0.818 for an orderly one, and put back energy in that proportion', () => {
    const plain = shortNight('g08-sleep');
    const light = shortNight('g08-sleep', ['light_sleeper']);
    const ordered = shortNight('g08-sleep', [], { conscientiousness: 95 });
    expect(plain.quality).toBeCloseTo(0.748, 6);
    expect(light.quality).toBeCloseTo(0.748 * K.lightDepth, 4);
    expect(ordered.quality).toBeCloseTo(0.748 * K.orderedDepth, 4);
    expect(light.recovered / plain.recovered).toBeCloseTo(K.lightDepth, 4);
    // The slider leans both: the night's depth and what an hour of it restores.
    expect(ordered.recovered / plain.recovered).toBeCloseTo(K.orderedDepth * K.orderedRestores, 4);
  });

  it('PLAYER JOURNEY: the night nobody chose wakes a light sleeper when a sound sleeper wakes, and lies her in longer to make up part of it: energy back at √0.8294 = 0.911 of her plain twin’s, not 0.829', () => {
    const plain = nightAlone('g08-night');
    const light = nightAlone('g08-night', ['light_sleeper']);
    expect(light.wake).toBe(plain.wake);
    expect(plain.awakeSince).toBe(plain.wake);
    expect(light.awakeSince).toBe(plain.wake);
    expect(light.gained / plain.gained).toBeCloseTo(Math.sqrt(K.lightDepth), 3);
    expect(plain.gained + 2).toBeLessThan(74);
  });

  it('PLAYER JOURNEY: the Sleep dialog asks a light sleeper for 9 hours, “You don’t sleep deeply”, against her plain twin’s 8 and “A normal night.”, and its button sleeps them', () => {
    const plain = sleepDialog('g08-dialog');
    const light = sleepDialog('g08-dialog', ['light_sleeper']);
    // 9.84 / (0.796 × 0.995 + 0.41) = 8.19, to 8; 9.84 / (0.796 × 0.8294 × 0.995 + 0.41) = 9.22, to 9.
    expect(plain.says).toBe('Sleep 8 Hours');
    expect(plain.text).toContain('A normal night.');
    expect(light.says).toBe('Sleep 9 Hours');
    expect(light.text).toContain('You don’t sleep deeply, so a normal night takes longer.');
    light.press();
    expect(light.sim.now).toBe(NH(25, 6));
    expect(light.sim.player.lastSleptAt).toBe(NH(25, 6));
    plain.press();
    expect(plain.sim.now).toBe(NH(25, 5));
  });
});

describe('knob:energyRecovery', () => {
  it('PLAYER JOURNEY: four hours of Sleep put back 1.132 of a plain student’s energy for a homebody and 0.906 for a restless twin at the same depth, and 1.094 for each point of depth for an orderly one', () => {
    const plain = shortNight('g08-sleep');
    const homebody = shortNight('g08-sleep', ['homebody']);
    const restless = shortNight('g08-sleep', ['restless']);
    const ordered = shortNight('g08-sleep', [], { conscientiousness: 95 });
    expect(homebody.quality).toBe(plain.quality);
    expect(restless.quality).toBe(plain.quality);
    expect(homebody.recovered / plain.recovered).toBeCloseTo(K.homebodyRestores, 4);
    expect(restless.recovered / plain.recovered).toBeCloseTo(K.restlessRestores, 4);
    expect(homebody.recovered).toBeGreaterThan(plain.recovered);
    expect(restless.recovered).toBeLessThan(plain.recovered);
    // The conscientiousness slider: for each point of the night's depth, 1.094 of the energy back.
    expect((ordered.recovered / plain.recovered) / (ordered.quality / plain.quality)).toBeCloseTo(K.orderedRestores, 4);
  });

  it('PLAYER JOURNEY: the night nobody chose wakes a restless student when a sound sleeper wakes, and lies her in longer: energy back at √0.9065 = 0.952 of her plain twin’s, not 0.906', () => {
    const plain = nightAlone('g08-night');
    const restless = nightAlone('g08-night', ['restless']);
    expect(restless.awakeSince).toBe(plain.wake);
    expect(restless.gained / plain.gained).toBeCloseTo(Math.sqrt(K.restlessRestores), 3);
  });

  it('PLAYER JOURNEY: the Sleep dialog asks a restless student for 8.5 hours, “A night puts back less for you than for most”, and its button sleeps them', () => {
    const restless = sleepDialog('g08-dialog', ['restless']);
    // 9.84 / (0.796 × 0.90649 × 0.995 + 0.41) = 8.72, to the half hour 8.5.
    expect(restless.says).toBe('Sleep 8.5 Hours');
    expect(restless.text).toContain('A night puts back less for you than for most, so it takes longer.');
    restless.press();
    expect(restless.sim.now).toBe(NH(25, 5, 30));
  });
});

describe('knob:hygieneDrift', () => {
  const D = { plain: 1, orderly: K.orderlyDrift, chaotic: K.chaoticDrift } as const;
  const life = (seed: string, who: keyof typeof D) => student(seed, who === 'plain' ? [] : [who]);

  it('PLAYER JOURNEY: four waking hours take 6.4 × k hygiene: 6.4 plain, 5.308 orderly, 7.904 chaotic; and from 100, three hours on, Shower is still “already clean” for all but the chaotic twin', () => {
    for (const who of Object.keys(D) as (keyof typeof D)[]) {
      const sim = life('g08-hyg', who);
      dials(sim, { energy: 90, hygiene: 90 }); // TEST SETUP
      sim.advanceBy(4 * MS_HOUR);
      expect(90 - sim.player.wellbeing.hygiene!, who).toBeCloseTo(6.4 * D[who], 3);
      const fresh = life('g08-hyg', who);
      clearCalendar(fresh); // TEST SETUP
      dials(fresh, { energy: 90, hygiene: 100 }); // TEST SETUP
      fresh.advanceBy(3 * MS_HOUR);
      // 100 − 4.8 × k: 95.2 plain and 96.0 orderly, at or over the 95 a shower is refused at; 94.1 chaotic, under it.
      const r = fresh.execute({ kind: 'life.look_after', payload: { action: 'wash' } });
      expect(r.ok ? 'showered' : r.error, who).toBe(who === 'chaotic' ? 'showered' : 'You’re already clean.');
    }
  });

  it('PLAYER JOURNEY: a workout’s sweat takes 20 × k on the hour’s 1.6 × k: 21.6 plain, 17.915 orderly, 26.678 chaotic', () => {
    for (const who of Object.keys(D) as (keyof typeof D)[]) {
      const sim = life('g08-hyg', who);
      dials(sim, { energy: 90, hygiene: 90 }); // TEST SETUP
      lookAfter(sim, 'exercise');
      expect(90 - sim.player.wellbeing.hygiene!, who).toBeCloseTo(21.6 * D[who], 3);
    }
  });

  it('PLAYER JOURNEY: grimy hours from 54 cost 0.4 morale an hour once hygiene is under 50: 0.6 plain, 0.394 orderly, 0.790 chaotic', () => {
    for (const who of Object.keys(D) as (keyof typeof D)[]) {
      const sim = life('g08-hyg', who);
      dials(sim, { energy: 90, hygiene: 54, nourishment: 75, morale: 50 }); // TEST SETUP
      sim.advanceBy(4 * MS_HOUR);
      // Grimy for 4 − 4 / (1.6 × k) of the four hours.
      expect(50 - sim.player.wellbeing.morale, who).toBeCloseTo(0.4 * (4 - 4 / (1.6 * D[who])), 3);
    }
  });
});

describe('knob:moraleSwing', () => {
  it('PLAYER JOURNEY: four hours of Sleep, short of the five a night breaks even at, cost a sentimental student 0.369 more morale than her plain twin and a self-assured one 0.532 less', () => {
    const plain = shortNight('g08-mood');
    const sentimental = shortNight('g08-mood', ['sentimental']);
    const assured = shortNight('g08-mood', ['self_assured']);
    // (4 × 0.748 − 5) × 1.6 × s, then a sixth and more of the way back to where the body settles (0.35 × 4/8).
    const apart = (s: number) => (1 - 0.175) * (4 * 0.748 - 5) * 1.6 * (s - 1);
    expect(sentimental.morale - plain.morale).toBeCloseTo(apart(K.sentimentalSwing), 3);
    expect(assured.morale - plain.morale).toBeCloseTo(apart(K.assuredSwing), 3);
  });

  it('PLAYER JOURNEY: an hour unwinding and a workout lift morale 3 × s, a meal 0.04 × s for each point eaten, and three hungry hours cost 2.1 × s', () => {
    for (const [who, s] of [['plain', 1], ['sentimental', K.sentimentalSwing]] as const) {
      for (const action of ['unwind', 'exercise', 'eat'] as const) {
        const sim = twin('g08-mood', who);
        dials(sim, { energy: 90, stress: 30, hygiene: 90, morale: 50, nourishment: 40 }); // TEST SETUP
        lookAfter(sim, action);
        expect(healthOf(sim.player).injury).toBeUndefined();
        // The meal: 40 less its 40 minutes' hunger, 38.7, and fifty eaten.
        expect(sim.player.wellbeing.morale - 50, `${who} ${action}`).toBeCloseTo((action === 'eat' ? 50 * 0.04 : 3) * s, 3);
      }
      const hungry = twin('g08-mood', who);
      dials(hungry, { energy: 90, stress: 30, hygiene: 90, morale: 50, nourishment: 22 }); // TEST SETUP
      hungry.advanceBy(4 * MS_HOUR);
      // Fed for the first hour (22 to the 20 line at 2 an hour), hungry the other three, at 0.7 an hour.
      expect(50 - hungry.player.wellbeing.morale, who).toBeCloseTo(2.1 * s, 3);
    }
  });

  it('PLAYER JOURNEY: a day overdrawn costs 2 × s morale; a workout that hurts 4 × s against its 3 × s lift; the fall concern 3 × s; the cast list 2 × s for her own lead and 0.5 × s for each friend’s', () => {
    const w = worried();
    expect(w.plain.owing.morale - w.plain.calm.morale).toBeCloseTo(-2, 3);
    expect(w.sentimental.owing.morale - w.sentimental.calm.morale).toBeCloseTo(-2 * K.sentimentalSwing, 3);
    const r = hurt();
    expect(r.sentimental.at).toBe(r.plain.at);
    expect(r.sentimental.injuredAt).toBe(r.sentimental.at + MS_HOUR);
    expect(r.plain.morale).toBeCloseTo(50 + 3 - 4, 3);
    expect(r.sentimental.morale).toBeCloseTo(50 + (3 - 4) * K.sentimentalSwing, 3);
    const t = terms();
    for (const [who, s] of [['plain', 1], ['sentimental', K.sentimentalSwing]] as const) {
      expect(t[who].standing, who).toBe('concern');
      expect(t[who].evaluation.morale, who).toBeCloseTo(-3 * s, 3);
      expect(t[who].rivals.youLead, who).toBe(true);
      expect(t[who].rivals.morale, who).toBeCloseTo(2 * s, 3);
      expect(t[who].friends.youLead, who).toBe(true);
      expect(t[who].friends.theirLeads, who).toBeGreaterThan(0);
      expect(t[who].friends.morale, who).toBeCloseTo((2 + 0.5 * t[who].friends.theirLeads) * s, 3);
    }
  });
});
