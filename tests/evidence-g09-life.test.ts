/**
 * Evidence for four trait-knob rows the review of 2026-10-13 left partial (verification group g09-life). Each knob is
 * reached the way a player reaches it, through the command the screen sends or through the clock, in twin lives made
 * alike but for a trait; each consequence is read where the row says it is read, against figures worked out from the
 * trait's own number bent inside its knob's limits (`exp(L·tanh(ln v / L))`, L the log of the limit the lean goes
 * toward), worked here by hand and written as literals, never asked of `personalityOf`.
 *
 * - `knob:spending` (frugal 0.85 → 0.8589, spender 1.25 → 1.2157, inside [0.7, 1.4]): a meal eaten (`life.look_after`
 *   eat) costs $4.29, $5.00 and $6.08, and the next midnight's groceries $8.59, $10.00 and $12.16; a meal ordered in
 *   costs LendingTree's 21/3.03 of each one's meal; on the same $4.50 the frugal life eats and the plain twin is refused
 *   in `spendRefusal`'s words; the price holds across a save and a load and the groceries are bought once a midnight;
 *   and creation's Review, rendered as the player has it, shows Food Each Month (Going Out A Month until 2026-10-17) as $261, $304 and $370.
 * - `knob:illnessToll` (resilient 0.6 → 0.6474, inside [0.5, 1.5]): the same fall on the same morning's run breaks a
 *   bone that mends in 43 days for a plain body and 28 for a resilient one; Work Out is refused in `trainingRefusal`'s
 *   words till each mends, across a reload; laid up (`laidUp`), the plain twin is excused from the classes of Monday
 *   21 September and sent on a medical leave by the dean, where the resilient one is back in class; and the clock's
 *   weekly care draw takes an emergency's 20 condition and 20 energy from a plain body and 12.95 of each from a
 *   resilient one.
 * - `knob:appetite` (disciplined 0.97 → 0.9708, indulgent 1.05 → 1.0460, inside [0.9, 1.1]): each midnight's
 *   `dailyRollover` moves the weight by the day's appetite, 100.994 and 101.010 kg from 101 on the first, and thirty
 *   days follow Hall's rule worked day by day here; a save and a load either side of a midnight ends on the same gram,
 *   and a midnight is applied once.
 * - `knob:receipts|bondWarmth|bondWound|company|morning|evening|readsAround|drills|skims|revises`: an early riser's
 *   9 AM `school.prepare` moves a scene 1.0914 times a plain twin's and a night owl's 0.8909, the other way round at
 *   7 PM, and alike at 4 PM; the spring cast list (`cast`, school.ts) warms a detached player 8.545 to each lead
 *   sharing the cast where a plain twin warms 10, and cuts one who keeps accounts 2.196 where the plain twin is cut 2;
 *   a classmate's request for help answered (`school.respond`) warms the detached 2.563 for the plain twin's 3; an
 *   evening of running lines slept through cuts one who keeps accounts 3.294 for the plain twin's 3; a rehearsal kept
 *   with a scene partner warms the detached 1.709 for the plain twin's 2; and on the first Carlotta night a friend in
 *   the cast lifts a restless player 1.193, a homebody 0.803 and a plain one 1, where a friendless cast costs the
 *   restless 0.387 and the others nothing; and each of the four ways a part is prepared (scattered, single minded,
 *   curious, self critical: 1.15 → 1.1364, inside [0.8, 1.3]) moves its own part 1.1364 times a plain twin's step, a
 *   scene read, its lines learned, a speech transcribed and a note worked on, to nine places where the review found
 *   the earlier test held it to one, and the other three parts as the plain twin's. Receipts stayed open (nothing in
 *   play wrote the job costs it multiplied) until 2026-10-14, when the owner had the knob go.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York (the birthplace a player
 * picks on Identity, which `newLifeConfig` leaves empty) and an actor at Yale in New Haven, starting Monday 24 August
 * 2026 at 7:30 AM, played by the clock alone to where each row's knob is read: the first midnight; Saturday 5
 * September; the first scene shown, on Tuesday 8 September, and its note; the first classes' moments; Labor Day's
 * weekly health draw; the spring term's cast list on Monday 4 January 2027; the Carlotta Festival's first night,
 * Tuesday 4 May 2027. The seeds were chosen for what the clock draws on them, as a player's own life draws it:
 * g09-run-1668 for a run on the first morning that breaks a bone, g09-ill-408 for an emergency at the Labor Day draw.
 * Creation's Review is rendered with react-dom/server, its step and its config given through the component's own
 * useState in render order.
 *
 * TEST SETUP, said again where it's done: the calendar cleared of what wants the player before a meal; dials set
 * before a meal (hunger) and before a step of preparation (all seven, so readiness is the same in each twin and only
 * the hour's fit or the trait differs); balances set against a test equity line and the credit card locked by its own
 * command for the refusal; a classmate's bond set to a friend's 30 on the night before a curtain; and on the screen,
 * the step and the config, which a static render can't click to.
 */
import { describe, expect, it, vi } from 'vitest';
import { attributesOf } from '@/engine/systems/attributes';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_DAY } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { healthOf } from '@/engine/systems/health';
import { courseworkOf, type Assignment } from '@/engine/systems/coursework';
import type { PrepDim } from '@/engine/content/coursework';
import { momentsOf } from '@/engine/systems/classmates';

const h = vi.hoisted(() => ({
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value; `keep` keeps it. */
  states: [] as unknown[],
  keep: Symbol('keep'),
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

const { CharacterCreation } = await import('@/ui/creation/CharacterCreation');

// ---------------------------------------------------------------------------
// Lives
// ---------------------------------------------------------------------------

const config = (traits: string[]): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personalityTraits: traits });
const life = (seed: string, traits: string[] = []): Simulation => createSave(1, seed, config(traits));
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** An instant in New Haven on Eastern Daylight Time (UTC−4), worked out here, not by the engine. */
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
const bought = (sim: Simulation, memo: string, after = 0) => sim.universe.transactions.filter((t) => t.memo === memo && t.at >= after)
  .map((t) => t.postings.filter((p) => p.amount > 0).reduce((n, p) => n + p.amount, 0));
const lookAfter = (sim: Simulation, action: string) => sim.execute({ kind: 'life.look_after', payload: { action } });
const notices = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const bonds = (sim: Simulation) => sim.player.school!.classmates.map((m) => m.bond);

/** What the player reads: the markup with every tag taken out and its entities read. */
const onScreen = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

/**
 * The knobs' values, each the trait's number bent inside its knob's limits by hand: exp(L·tanh(ln v / L)), L = ln of
 * the high limit for a lean up and −ln of the low limit for a lean down (`KNOB_LIMITS`).
 */
const K = {
  frugal: 0.8588737440, // 0.85 in [0.7, 1.4]
  spender: 1.2156941679, // 1.25 in [0.7, 1.4]
  resilient: 0.6473831208, // 0.6 in [0.5, 1.5]
  disciplined: 0.9707968070, // 0.97 in [0.9, 1.1]
  indulgent: 1.0459569607, // 1.05 in [0.9, 1.1]
  sharp: 1.0914233737, // 1.1 in [0.8, 1.2]: an early riser's morning, a night owl's evening
  flat: 0.8909476954, // 0.88 in [0.8, 1.2]: a night owl's morning, an early riser's evening
  detached: 0.8544913846, // bondWarmth 0.85 in [0.6, 1.4]
  keepsAccounts: 1.0981123666, // bondWound 1.1 in [0.6, 1.5]
  restless: 1.1932621799, // company 1.2 in [0.4, 1.8]
  homebody: 0.8034547113, // company 0.8 in [0.4, 1.8]
  leans: 1.1364255057, // 1.15 in [0.8, 1.3]: readsAround (curious), drills (single minded), skims (scattered), revises (self critical)
} as const;

// ---------------------------------------------------------------------------
// knob:spending
// ---------------------------------------------------------------------------

describe('knob:spending', () => {
  /** A meal eaten at 7:30 on the first morning, hungry (TEST SETUP: the calendar cleared, nourishment 30). */
  const ate = (traits: string[], action: 'eat' | 'order') => {
    const sim = life('g09-spend', traits);
    clearCalendar(sim); // TEST SETUP
    sim.player.wellbeing.nourishment = 30; // TEST SETUP
    const r = lookAfter(sim, action);
    expect(r.ok, r.error).toBe(true);
    return sim;
  };

  it('prices a frugal life’s meal at $4.29 and the midnight’s groceries at $8.59, a plain one’s at $5.00 and $10.00, a spender’s at $6.08 and $12.16', () => {
    const [frugal, plain, spender] = [ate(['frugal'], 'eat'), ate([], 'eat'), ate(['spender'], 'eat')];
    // New Haven's $4 meal and $8 day at its 127 cost of living, to the whole dollar and untaxed: $5.00 and $10.00. Each
    // at the knob, to the cent: 500 × 0.8589 = 429.4, 500 × 1.2157 = 607.8; 1000 × 0.8589 = 858.9, 1000 × 1.2157 = 1215.7.
    expect(bought(frugal, 'A meal')).toEqual([429]);
    expect(bought(plain, 'A meal')).toEqual([500]);
    expect(bought(spender, 'A meal')).toEqual([608]);
    // The day's groceries are bought at its midnight, 12:00 AM Tuesday 25 August, at the knob too.
    for (const sim of [frugal, plain, spender]) sim.advanceTo(EDT(8, 25, 1));
    const midnight = EDT(8, 25, 0);
    expect(frugal.universe.transactions.filter((t) => t.memo === 'Groceries').map((t) => t.at)).toEqual([midnight]);
    expect(bought(frugal, 'Groceries')).toEqual([859]);
    expect(bought(plain, 'Groceries')).toEqual([1000]);
    expect(bought(spender, 'Groceries')).toEqual([1216]);
  });

  it('prices a meal ordered in at LendingTree’s $21.00 against $3.03 of each one’s meal: $29.73, $34.65 and $42.14', () => {
    // 429 × 21 / 3.03 = 2973.3; 500 × 21 / 3.03 = 3465.3; 608 × 21 / 3.03 = 4213.9.
    expect(bought(ate(['frugal'], 'order'), 'A meal delivered')).toEqual([2973]);
    expect(bought(ate([], 'order'), 'A meal delivered')).toEqual([3465]);
    expect(bought(ate(['spender'], 'order'), 'A meal delivered')).toEqual([4214]);
  });

  it('feeds a frugal life on $4.50 where the plain and spending twins are refused in spendRefusal’s words, taking nothing', () => {
    const lives = [life('g09-spend-short', ['frugal']), life('g09-spend-short'), life('g09-spend-short', ['spender'])];
    for (const sim of lives) {
      clearCalendar(sim); // TEST SETUP
      sim.player.wellbeing.nourishment = 30; // TEST SETUP
      // TEST SETUP: $4.50 in checking and nothing in savings or in hand; the credit card locked by its own command.
      for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && (a.kind === 'savings' || a.kind === 'cash')) setBalance(sim, a.id, 0);
      setBalance(sim, sim.player.primaryAccountId!, 450);
      sim.must({ kind: 'card.lock', payload: { which: 'credit', locked: true } });
    }
    const [frugal, plain, spender] = lives as [Simulation, Simulation, Simulation];
    expect(lookAfter(frugal, 'eat').ok).toBe(true);
    expect(frugal.universe.accounts[frugal.player.primaryAccountId!]!.balance).toBe(450 - 429);
    expect(frugal.player.wellbeing.nourishment).toBeGreaterThan(30);
    for (const sim of [plain, spender]) {
      const was = { now: sim.now, tx: sim.universe.transactions.length, n: sim.player.wellbeing.nourishment, checking: sim.universe.accounts[sim.player.primaryAccountId!]!.balance };
      const tried = lookAfter(sim, 'eat');
      expect(tried.ok).toBe(false);
      expect(tried.error).toBe('You can’t afford it.');
      expect({ now: sim.now, tx: sim.universe.transactions.length, n: sim.player.wellbeing.nourishment, checking: sim.universe.accounts[sim.player.primaryAccountId!]!.balance }).toEqual(was);
    }
  });

  it('keeps a frugal life’s price across a save and a load: each midnight’s groceries $8.59, bought once a midnight', () => {
    const sim = life('g09-spend-kept', ['frugal']);
    const twin = life('g09-spend-kept', ['frugal']);
    sim.advanceTo(EDT(8, 25, 1));
    twin.advanceTo(EDT(8, 25, 1));
    const kept = reload(sim);
    kept.advanceTo(EDT(8, 27, 1));
    twin.advanceTo(EDT(8, 27, 1));
    expect(kept.universe.transactions.filter((t) => t.memo === 'Groceries').map((t) => t.at)).toEqual([EDT(8, 25, 0), EDT(8, 26, 0), EDT(8, 27, 0)]);
    expect(bought(kept, 'Groceries')).toEqual([859, 859, 859]);
    expect(bought(twin, 'Groceries')).toEqual([859, 859, 859]);
  });

  it('shows Going Out A Month on creation’s Review as $261 for a frugal pick, $304 for none and $370 for a spender', () => {
    const review = (traits: string[]) => {
      // TEST SETUP: CharacterCreation's states in render order: the step (Review, the fifth), the config, and the two it keeps.
      h.states = [4, config(traits), h.keep, h.keep];
      const text = onScreen(renderToStaticMarkup(createElement(CharacterCreation, { slot: 1 as never, onCancel: () => undefined, onStart: () => undefined })));
      expect(h.states).toHaveLength(0);
      return text;
    };
    const month = (text: string) => text.match(/Food Each Month \$([\d,]+)/)?.[1];
    // A day's $10.00 of groceries in New Haven at the knob, 365/12 days: $261.24, $304.17 and $369.77, to the dollar.
    const frugal = review(['frugal']);
    expect(month(frugal)).toBe('261');
    expect(frugal).toContain('Frugal');
    expect(frugal).toContain('You know what everything costs, and the day’s food costs you less.');
    expect(month(review([]))).toBe('304');
    expect(month(review(['spender']))).toBe('370');
  });
});

// ---------------------------------------------------------------------------
// knob:illnessToll
// ---------------------------------------------------------------------------

describe('knob:illnessToll', () => {
  /** The first morning's run, the same on both: on g09-run-1668 it breaks a bone. */
  const ran = (traits: string[]) => {
    const sim = life('g09-run-1668', traits);
    const r = lookAfter(sim, 'exercise');
    expect(r.ok, r.error).toBe(true);
    return sim;
  };
  const RAN_AT = EDT(8, 24, 8, 30);

  it('mends the same broken bone in 28 days for a resilient body where a plain one takes 43, and refuses Work Out in trainingRefusal’s words till each mends, across a reload', () => {
    const plain = ran([]);
    const resilient = ran(['resilient']);
    const injury = (sim: Simulation) => healthOf(sim.player).injury!;
    expect(injury(plain).kind).toBe('fracture');
    expect(injury(resilient).kind).toBe('fracture');
    expect(injury(plain).at).toBe(RAN_AT);
    expect(injury(resilient).at).toBe(RAN_AT);
    // The draw is 43 days for the plain body, so somewhere in [42.5, 43.5); at 0.6474 that is [27.51, 28.16): 28 days.
    expect((injury(plain).until - RAN_AT) / MS_DAY).toBe(43);
    expect((injury(resilient).until - RAN_AT) / MS_DAY).toBe(28);
    // Kept off work as long: a broken bone is time off (`INJURY_KIND`).
    expect(injury(plain).offWorkUntil).toBe(injury(plain).until);
    expect(injury(resilient).offWorkUntil).toBe(injury(resilient).until);
    expect(notices(plain, 'A Broken Bone').map((n) => n.body)[0]).toContain('It takes 43 days to mend, until October 6, 2026. You’re laid up until then, kept from classes, work and training.');
    expect(notices(resilient, 'A Broken Bone').map((n) => n.body)[0]).toContain('It takes 28 days to mend, until September 21, 2026. You’re laid up until then, kept from classes, work and training.');
    expect(lookAfter(plain, 'exercise').error).toBe('Not with a broken bone; it has 43 days yet to mend.');
    expect(lookAfter(resilient, 'exercise').error).toBe('Not with a broken bone; it has 28 days yet to mend.');

    // A save and a load on Tuesday 1 September at 6 PM: 34 days 14½ hours left, and 19 days 14½ hours.
    for (const sim of [plain, resilient]) sim.advanceTo(EDT(9, 1, 18));
    const [plainKept, resilientKept] = [reload(plain), reload(resilient)];
    expect(lookAfter(plainKept, 'exercise').error).toBe('Not with a broken bone; it has 35 days yet to mend.');
    expect(lookAfter(resilientKept, 'exercise').error).toBe('Not with a broken bone; it has 20 days yet to mend.');

    // Monday 21 September at 6 PM, the resilient body mended that morning at 8:30: its workout goes ahead, and the plain
    // twin, mended on Tuesday 6 October at 8:30 AM, still has 14 days 14½ hours to go.
    for (const sim of [plainKept, resilientKept]) sim.advanceTo(EDT(9, 21, 18));
    const worked = lookAfter(resilientKept, 'exercise');
    expect(worked.ok, worked.error).toBe(true);
    expect(lookAfter(plainKept, 'exercise').error).toBe('Not with a broken bone; it has 15 days yet to mend.');
  });

  it('lays a resilient body up 28 days, not 43: back in class on Monday 21 September, where the plain twin is excused and sent on a medical leave by the dean', () => {
    const plain = ran([]);
    const resilient = ran(['resilient']);
    const tally = (sim: Simulation) => ({ attended: sim.player.school!.tally.attended, excused: sim.player.school!.tally.excused });
    // Laid up from the first class on Monday 31 August to the last before 21 September: fourteen days of classes excused.
    for (const sim of [plain, resilient]) sim.advanceTo(EDT(9, 21, 8, 59));
    expect(tally(plain)).toEqual({ attended: 0, excused: 14 });
    expect(tally(resilient)).toEqual({ attended: 0, excused: 14 });
    // The nine o'clock classes: the resilient body was cleared at 8:30 and is in the room; the plain one is still laid up.
    for (const sim of [plain, resilient]) sim.advanceTo(EDT(9, 21, 9, 30));
    expect(tally(resilient)).toEqual({ attended: 1, excused: 14 });
    expect(tally(plain)).toEqual({ attended: 0, excused: 15 });
    // Laid up past what excused absences can carry, the plain twin is put on leave; the resilient one is given modifications.
    expect(plain.player.school!.leave?.status).toBe('on');
    expect(plain.player.school!.leave?.kind).toBe('medical');
    expect(plain.player.school!.leave?.mandatory?.why).toContain('before October 6, 2026');
    expect(notices(plain, 'A Medical Leave, By The Dean’s Decision')).toHaveLength(1);
    expect(resilient.player.school!.leave).toBeUndefined();
    expect(notices(resilient, 'A Medical Leave, By The Dean’s Decision')).toHaveLength(0);
    expect(notices(resilient, 'Yale Health’s Assessment: Modifications')).toHaveLength(1);
  });

  it('takes an emergency’s 20 condition and 20 energy from a plain body at the clock’s Labor Day health draw, and 12.95 of each from a resilient one', () => {
    // On g09-ill-408 the week's draw at 9 AM on Monday 7 September, Labor Day and no classes, is the emergency room.
    const AT = EDT(9, 7, 9);
    const drop = (traits: string[]) => {
      const sim = life('g09-ill-408', traits);
      sim.advanceTo(AT - 1);
      expect(sim.universe.scheduled.filter((i) => i.status === 'pending' && i.at === AT).map((i) => i.kind)).toEqual(['health.week']);
      const before = { ...sim.player.wellbeing };
      sim.advanceTo(AT + 1);
      expect(healthOf(sim.player).inHospitalUntil).toBeGreaterThan(AT);
      return { condition: before.condition - sim.player.wellbeing.condition, energy: before.energy - sim.player.wellbeing.energy, until: healthOf(sim.player).inHospitalUntil };
    };
    const plain = drop([]);
    const resilient = drop(['resilient']);
    // The emergency's toll (`CARE.toll.emergency`) is 20 and 20; two milliseconds awake drain a few millionths of energy.
    expect(plain.condition).toBeCloseTo(20, 9);
    expect(plain.energy).toBeCloseTo(20, 4);
    // 20 × 0.6474 = 12.9477, each half.
    expect(resilient.condition).toBeCloseTo(12.947662416, 8);
    expect(resilient.energy).toBeCloseTo(12.947662416, 4);
    // The stay itself, the emergency department's time, is nobody's trait.
    expect(resilient.until).toBe(plain.until);
  });
});

// ---------------------------------------------------------------------------
// knob:appetite
// ---------------------------------------------------------------------------

describe('knob:appetite', () => {
  // g09-probe draws Ada at 181.8 cm and 101 kg, her habit what held 101 kg at her age then.
  const SEED = 'g09-probe';
  const midnight = (n: number) => EDT(8, 24 + n, 0);
  /** Hall's kilograms a kilocalorie a day: 23.9 kcal a kilogram, half of the way in 365 days. */
  const PER_KG = 23.9 * 365 / Math.LN2;
  const MS_YEAR = 365.2425 * MS_DAY;

  /**
   * Hall's rule worked day by day here: each midnight the gap between the habit at the appetite and what the day
   * spent, the habit's own spending plus 23.9 kcal a day for each kilogram gained since and less Mifflin–St Jeor's
   * 5 kcal a year of age at the sedentary 1.4, goes into the weight, which is kept to the gram.
   */
  function hall(start: { kg: number; habit: number; from: number }, appetite: number, days: number): number {
    let kg = start.kg;
    for (let n = 1; n <= days; n += 1) {
      const spent = start.habit + 23.9 * (kg - start.kg) - 5 * 1.4 * (midnight(n) - start.from) / MS_YEAR;
      kg = Math.round((kg + (start.habit * appetite - spent) / PER_KG) * 1000) / 1000;
    }
    return kg;
  }

  it('moves the weight at the first midnight by the day’s appetite: 100.994 kg disciplined, 101 plain, 101.010 indulgent', () => {
    const [disciplined, plain, indulgent] = [life(SEED, ['disciplined_body']), life(SEED), life(SEED, ['indulgent'])];
    for (const sim of [disciplined, plain, indulgent]) {
      expect(sim.player.body!.weightKg).toBe(101);
      expect(sim.player.body!.habitKcal).toBeCloseTo(2726.18, 2);
      sim.advanceTo(midnight(1) - 1);
      expect(sim.player.body!.weightKg).toBe(101);
      sim.advanceTo(midnight(1) + 60_000);
    }
    // 2,726.18 kcal × (0.9708 − 1) = −79.6 kcal, −0.0063 kg; × (1.0460 − 1) = +125.3 kcal, +0.0100 kg.
    expect(disciplined.player.body!.weightKg).toBe(100.994);
    expect(plain.player.body!.weightKg).toBe(101);
    expect(indulgent.player.body!.weightKg).toBe(101.01);
  });

  it('drifts thirty days as Hall’s rule has it, the indulgent heavier and the disciplined lighter, the plain held; a reload at day fifteen ends on the same gram', () => {
    const TRAITS = { disciplined: ['disciplined_body'], plain: [], indulgent: ['indulgent'] };
    const three = (made: (traits: string[]) => Simulation) => ({ disciplined: made(TRAITS.disciplined), plain: made(TRAITS.plain), indulgent: made(TRAITS.indulgent) });
    const lives = three((traits) => life(SEED, traits));
    const start = { kg: 101, habit: lives.plain.player.body!.habitKcal, from: lives.plain.now };
    // The same lives saved and loaded at day fifteen, a millisecond either side of its midnight.
    const before = three((traits) => { const s = life(SEED, traits); s.advanceTo(midnight(15) - 1); return reload(s); });
    const after = three((traits) => { const s = life(SEED, traits); s.advanceTo(midnight(15) + 1); return reload(s); });
    for (const set of [lives, after, before]) for (const s of Object.values(set)) s.advanceTo(midnight(30) + 60_000);
    const kg = (set: typeof lives) => ({ disciplined: set.disciplined.player.body!.weightKg, plain: set.plain.player.body!.weightKg, indulgent: set.indulgent.player.body!.weightKg });
    const unbroken = kg(lives);
    // Hall's rule, worked here day by day: 100.820 kg, 101 and 101.297, to the gram.
    expect(hall(start, K.disciplined, 30)).toBe(100.82);
    expect(hall(start, 1, 30)).toBe(101);
    expect(hall(start, K.indulgent, 30)).toBe(101.297);
    expect(unbroken).toEqual({ disciplined: 100.82, plain: 101, indulgent: 101.297 });
    // Saved and loaded either side of a midnight, the same gram.
    expect(kg(after)).toEqual(unbroken);
    expect(kg(before)).toEqual(unbroken);
  });

  it('applies a midnight once: the day after it, a reload, and the clock run on to the next midnight’s eve leave the weight where it was', () => {
    const sim = life(SEED, ['indulgent']);
    sim.advanceTo(midnight(1) + 1);
    const kg = sim.player.body!.weightKg;
    expect(kg).toBe(101.01);
    const kept = reload(sim);
    kept.advanceTo(midnight(2) - 1);
    sim.advanceTo(midnight(2) - 1);
    expect(kept.player.body!.weightKg).toBe(kg);
    expect(sim.player.body!.weightKg).toBe(kg);
    // And the second midnight once in each, by the same day's appetite again.
    kept.advanceTo(midnight(2) + 1);
    sim.advanceTo(midnight(2) + 1);
    expect(kept.player.body!.weightKg).toBe(sim.player.body!.weightKg);
    expect(sim.player.body!.weightKg - kg).toBeGreaterThan(0.009);
    expect(sim.player.body!.weightKg - kg).toBeLessThan(0.011);
  });
});

// ---------------------------------------------------------------------------
// knob:receipts|bondWarmth|bondWound|company|morning|evening|readsAround|drills|skims|revises
// ---------------------------------------------------------------------------

describe('knob:receipts|bondWarmth|bondWound|company|morning|evening|readsAround|drills|skims|revises', () => {
  /** TEST SETUP: the same seven dials in every twin before a step, so readiness is alike and only the trait differs. */
  const dials = (sim: Simulation) => {
    Object.assign(sim.player.wellbeing, { energy: 80, stress: 20, sleepDebt: 0, nourishment: 70, morale: 60, hygiene: 90, condition: 100 });
    // And the four abilities a step reads at 50, where each speeds it by exactly 1 (`stepSpeed`, from 2026-10-16): until
    // then no step read an ability, and a twin's grew apart a hair by the day the step is taken.
    Object.assign(attributesOf(sim, sim.player), { focus: 50, imagination: 50, adaptability: 50 }); sim.player.craft!.memorization = 50;
  };

  /** A first step on the first scene, Read The Scene, at an hour of Saturday 5 September, its readiness set alike. */
  const readAt = (traits: string[], hour: number, minute = 0) => {
    const sim = life('g09-hours', traits);
    sim.advanceTo(EDT(9, 5, hour, minute));
    dials(sim); // TEST SETUP: only the hour's fit differs.
    const a = courseworkOf(sim, sim.player)!.assignments[0]!;
    expect(a.template).toBe('scene-study');
    expect(a.prep.familiarity).toBe(0);
    const r = sim.execute<{ moved: number; dim: string }>({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.dim).toBe('familiarity');
    expect(a.prep.familiarity).toBe(r.value!.moved);
    return r.value!.moved;
  };

  it('moves an early riser’s 9 AM read of a scene 1.0914 times a plain twin’s, and a night owl’s 0.8909 times', () => {
    const plain = readAt([], 9);
    expect(readAt(['early_riser'], 9) / plain).toBeCloseTo(K.sharp, 9);
    expect(readAt(['night_owl'], 9) / plain).toBeCloseTo(K.flat, 9);
  });

  it('moves a night owl’s 7 PM read 1.0914 times a plain twin’s, and an early riser’s 0.8909 times', () => {
    const plain = readAt([], 19);
    expect(readAt(['night_owl'], 19) / plain).toBeCloseTo(K.sharp, 9);
    expect(readAt(['early_riser'], 19) / plain).toBeCloseTo(K.flat, 9);
  });

  it('moves the three alike at 4 PM, nobody’s hour, and a plain twin alike at nine, four and seven', () => {
    const plain = readAt([], 16, 5);
    expect(readAt(['early_riser'], 16, 5)).toBe(plain);
    expect(readAt(['night_owl'], 16, 5)).toBe(plain);
    // The plain twin's step is the hour's alone: the same at nine, four and seven.
    expect(readAt([], 9)).toBe(plain);
    expect(readAt([], 19)).toBe(plain);
  });

  /**
   * The four ways a part is prepared, each the step a player takes: on Saturday 5 September at 4:05 PM, nobody's hour,
   * the first scene read and its lines learned, and the speech drill transcribed; and in a life of its own, the scene
   * shown with nothing prepared on the morning of Tuesday 8 September, its note read (`school.read_feedback`) and worked
   * on at 6:05 PM, after the day's last class. How far each step moved its part.
   */
  const prepared = (traits: string[]): Record<'familiarity' | 'memorization' | 'interpretation' | 'revision', number> => {
    const step = (sim: Simulation, a: Assignment, activity: string, dim: PrepDim) => {
      dials(sim); // TEST SETUP
      expect(a.prep[dim]).toBe(0);
      const r = sim.execute<{ moved: number; dim: string }>({ kind: 'school.prepare', payload: { assignmentId: a.id, activity } });
      expect(r.ok, r.error).toBe(true);
      expect(r.value!.dim).toBe(dim);
      expect(a.prep[dim]).toBe(r.value!.moved);
      return r.value!.moved;
    };
    const sim = life('g09-hours', traits);
    sim.advanceTo(EDT(9, 5, 16, 5));
    const work = courseworkOf(sim, sim.player)!.assignments;
    expect([work[0]!.template, work[2]!.template]).toEqual(['scene-study', 'speech-drill']);
    const familiarity = step(sim, work[0]!, 'read', 'familiarity');
    const memorization = step(sim, work[0]!, 'learn', 'memorization');
    const interpretation = step(sim, work[2]!, 'transcribe', 'interpretation');
    const shown = life('g09-hours', traits);
    shown.advanceTo(EDT(9, 8, 18, 5));
    const scene = courseworkOf(shown, shown.player)!.assignments[0]!;
    expect(scene.template).toBe('scene-study');
    expect(scene.status).toBe('revising');
    const seen = shown.execute({ kind: 'school.read_feedback', payload: { assignmentId: scene.id } });
    expect(seen.ok, seen.error).toBe(true);
    return { familiarity, memorization, interpretation, revision: step(shown, scene, 'revise', 'revision') };
  };

  it('moves each part 1.1364 times a plain twin’s for the trait that prepares it that way, read, learned, transcribed or revised through school.prepare, and the other three parts as the plain twin’s', () => {
    const plain = prepared([]);
    const leans = { familiarity: 'scattered', memorization: 'single_minded', interpretation: 'curious', revision: 'self_critical' } as const;
    const dims = Object.keys(leans) as (keyof typeof leans)[];
    for (const dim of dims) {
      const moved = prepared([leans[dim]]);
      // Its own part by the lean, to nine places (the review found it held to one); the other three the plain twin's.
      for (const d of dims) expect(moved[d] / plain[d], `${leans[dim]} on ${d}`).toBeCloseTo(d === dim ? K.leans : 1, 9);
    }
  });

  it('warms a detached player 8.545 to each lead sharing the spring cast where a plain twin warms 10, and cuts one who keeps accounts 2.196 where the plain twin is cut 2', () => {
    // The spring term begins at 9 AM on Monday 4 January 2027 (Eastern Standard Time, UTC−5), and its cast list with it.
    const CAST = Date.UTC(2027, 0, 4, 14);
    const lives = { plain: life('g09-cast'), detached: life('g09-cast', ['detached']), keeps: life('g09-cast', ['keeps_accounts']) };
    for (const sim of Object.values(lives)) {
      sim.advanceTo(CAST - 1);
      expect(bonds(sim).every((b) => b === undefined)).toBe(true);
      sim.advanceTo(CAST + 60_000);
    }
    // The same cast in each: the Carlotta Festival, with the player in a lead.
    const list = lives.plain.player.school!.around!.list;
    expect(lives.detached.player.school!.around!.list).toEqual(list);
    expect(lives.keeps.player.school!.around!.list).toEqual(list);
    expect(lives.plain.player.school!.casting!.production).toBe('Carlotta Festival Of New Plays');
    expect(lives.plain.player.school!.casting!.size).toBe('lead');
    // The rule's own figures: ten toward a friend for a production shared, twelve back for a lead that went to the other.
    // Ada's lead is one a classmate in a smaller part could have had; the other leads lose nothing to her.
    const mates = lives.plain.player.school!.classmates.map((m) => m.name);
    const leadOf = (name: string) => list.some((x) => x.name === name && x.production === 'Carlotta Festival Of New Plays' && x.size === 'lead');
    const plainMove = mates.map((name) => (leadOf(name) ? 10 : 10 - 12));
    expect(plainMove.filter((m) => m === 10)).toHaveLength(2);
    expect(bonds(lives.plain)).toEqual(plainMove);
    // Detached: closer by 0.8545 of it; a slight is cut as anybody's.
    expect(bonds(lives.detached)).toHaveLength(15);
    expect(bonds(lives.keeps)).toHaveLength(15);
    bonds(lives.detached).forEach((b, i) => expect(b).toBeCloseTo(plainMove[i]! > 0 ? 10 * K.detached : -2, 9));
    // Keeps accounts: closer as anybody; a slight cut 1.0981 deeper.
    bonds(lives.keeps).forEach((b, i) => expect(b).toBeCloseTo(plainMove[i]! > 0 ? 10 : -2 * K.keepsAccounts, 9));
  });

  /** The first class moments on g09-probe: Maya asks for help on Thursday 3 September, Imani to run lines on the 9th. */
  const helped = (traits: string[]) => {
    const sim = life('g09-probe', traits);
    sim.advanceTo(EDT(9, 3, 9, 30));
    const open = momentsOf(courseworkOf(sim, sim.player)!).filter((m) => m.status === 'open');
    expect(open.map((m) => ({ kind: m.kind, mate: sim.player.school!.classmates[m.mate]!.name.split(' ')[0] }))).toEqual([{ kind: 'help', mate: 'Maya' }]);
    sim.advanceTo(EDT(9, 3, 17));
    const before = sim.player.school!.classmates[open[0]!.mate]!.bond ?? 0;
    const r = sim.execute<{ done: string }>({ kind: 'school.respond', payload: { momentId: open[0]!.id, choice: 'help' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.done).toBe('You ran Maya’s lines with them.');
    return { sim, moved: sim.player.school!.classmates[open[0]!.mate]!.bond! - before };
  };

  it('warms a detached player 2.563 for helping Maya with her lines where a plain twin warms 3, answered through school.respond', () => {
    expect(helped([]).moved).toBe(3);
    expect(helped(['detached']).moved).toBeCloseTo(3 * K.detached, 9);
    expect(helped(['keeps_accounts']).moved).toBe(3);
  });

  it('cuts one who keeps accounts 3.294 for an evening of running lines slept through, where a plain twin is cut 3', () => {
    const missed = (traits: string[]) => {
      const { sim } = helped(traits);
      sim.advanceTo(EDT(9, 9, 9, 30));
      const open = momentsOf(courseworkOf(sim, sim.player)!).filter((m) => m.status === 'open');
      expect(open.map((m) => ({ kind: m.kind, when: m.when }))).toEqual([{ kind: 'study', when: EDT(9, 10, 19) }]);
      const imani = sim.player.school!.classmates[open[0]!.mate]!;
      expect(imani.name.split(' ')[0]).toBe('Imani');
      expect(sim.execute({ kind: 'school.respond', payload: { momentId: open[0]!.id, choice: 'yes' } }).ok).toBe(true);
      // Asleep from six on Thursday 10 September for three hours, across the seven o'clock she asked for.
      sim.advanceTo(EDT(9, 10, 18));
      const before = imani.bond ?? 0;
      const slept = sim.execute({ kind: 'life.sleep', payload: { hours: 3 } });
      expect(slept.ok, slept.error).toBe(true);
      sim.advanceTo(EDT(9, 10, 22));
      expect(notices(sim, 'Imani Waited For You')).toHaveLength(1);
      return imani.bond! - before;
    };
    expect(missed([])).toBe(-3);
    expect(missed(['keeps_accounts'])).toBeCloseTo(-3 * K.keepsAccounts, 9);
    expect(missed(['detached'])).toBe(-3);
  });

  it('warms a detached player 1.709 for a rehearsal kept with the scene partner where a plain twin warms 2, booked through school.ask_partner', () => {
    const kept = (traits: string[]) => {
      const sim = life('g09-probe', traits);
      sim.advanceTo(EDT(9, 3, 17));
      const a = courseworkOf(sim, sim.player)!.assignments[0]!;
      expect(a.partner).toBe(0);
      const asked = sim.execute<{ accepted: boolean; rehearsalId?: string; reason?: string }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: EDT(9, 4, 19) } });
      expect(asked.ok, asked.error).toBe(true);
      expect(asked.value!.accepted, asked.value!.reason).toBe(true);
      const mate = sim.player.school!.classmates[0]!;
      const before = mate.bond ?? 0;
      sim.advanceTo(EDT(9, 4, 21));
      expect(a.rehearsals.find((r) => r.id === asked.value!.rehearsalId)!.status).toBe('kept');
      return mate.bond! - before;
    };
    expect(kept([])).toBe(2);
    expect(kept(['detached'])).toBeCloseTo(2 * K.detached, 9);
  });

  it('lifts a restless player 1.193 for a friend in the cast on the first Carlotta night, a homebody 0.803 and a plain one 1; a friendless cast costs the restless 0.387 and the others nothing', () => {
    // The first night, 8 PM on Tuesday 4 May 2027 (Eastern Daylight Time).
    const CURTAIN = Date.UTC(2027, 4, 5, 0);
    const night = (traits: string[]) => {
      const sim = life('g09-cast', traits);
      sim.advanceTo(CURTAIN - 1);
      expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.at === CURTAIN && i.kind === 'school.call' && i.payload.call === 'performance')).toBe(true);
      // The same life saved and loaded twice the moment before the curtain: one with a friend in the cast, one without.
      const [withFriend, without] = [reload(sim), reload(sim)];
      const cast = withFriend.player.school!.casting!.cast!;
      expect(cast.every((c) => (withFriend.player.school!.classmates.find((m) => m.name === c.name)!.bond ?? 0) < 25)).toBe(true);
      withFriend.player.school!.classmates.find((m) => m.name === cast[0]!.name)!.bond = 30; // TEST SETUP: a friend
      const lift = (s: Simulation) => { const m = s.player.wellbeing.morale; s.advanceTo(CURTAIN + 1); expect(s.player.school!.casting!.performed).toBe(1); return s.player.wellbeing.morale - m; };
      return { friend: lift(withFriend), none: lift(without) };
    };
    const plain = night([]);
    const restless = night(['restless']);
    const homebody = night(['homebody']);
    // A friend in the cast is a point, by how much the company is worth to them.
    expect(plain.friend - plain.none).toBeCloseTo(1, 9);
    // Restless: 1.1933 for the friend against −2 × 0.1933 for nobody, so 1.1933 + 0.3865 between the two.
    expect(restless.friend - restless.none).toBeCloseTo(K.restless + 2 * (K.restless - 1), 9);
    expect(homebody.friend - homebody.none).toBeCloseTo(K.homebody, 9);
    // The rest of the night is the same in each life: a friendless cast weighs only on the restless, by 2 × 0.1933.
    expect(restless.none - plain.none).toBeCloseTo(-2 * (K.restless - 1), 9);
    expect(homebody.none - plain.none).toBeCloseTo(0, 9);
  });
});
