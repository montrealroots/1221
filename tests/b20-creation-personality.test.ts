/**
 * Brief 20, the creation area: every one of the thirty-five traits and every one of the seven dispositions, each
 * played as a twin of a life with nothing pressed and the sliders where creation leaves them, through the clock or a
 * command, and the knob it declares moving what that knob says it moves (`KNOB_READS`): a light sleeper's night puts
 * back less, a frugal student's meal costs less, an early riser's night puts back more, and so on, the direction
 * read off the trait's own figure. tests/evidence2-b10.test.ts holds each of the nineteen knobs to its reader through
 * one trait each, with the page pressed; this holds every trait and every slider to at least one, so none of them is
 * said back and nothing more.
 *
 * PLAYER JOURNEYS: a new life as Dispositions & Traits makes it, the trait pressed or the slider moved and nothing else
 * (tests/evidence2-b10.test.ts holds that the page makes exactly this config), Ada Cole, born in New York, at Yale from
 * 7:30 AM Monday 24 August 2026, begun as `SlateApp` begins it with "I Know SLATE." chosen. Seeds b20-c-p-* are this
 * file's; g09-probe is tests/evidence2-b10.test.ts's, kept for the classmates it draws (Maya asks for help on 3
 * September, Imani to run lines on the 10th).
 *
 * TEST SETUP, said again where it's done: the calendar's commitments that want the player canceled before an hour the
 * test measures; the dials set alike in every twin before one; and for the Cabaret, the dials kept each six hours on the
 * way to a call, as a player's meals and sleep keep them (`tended`). For preparation, the course's work set and its other
 * parts already in place, as tests/traits-connected.test.ts sets them.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Personality, Wellbeing } from '@/engine/domain/model';
import type { ScheduledItem } from '@/engine/core/scheduler';
import { newLifeConfig, withFamily, type NewSaveConfig } from '@/engine/world/bootstrap';
import { MS_HOUR } from '@/engine/core/time';
import { PERSONALITY_TRAITS, PERSONALITY_TRAIT_BY_ID, type PersonalityKnob } from '@/engine/content/personality-traits';
import { defaultPersonality } from '@/engine/systems/personality';
import { PREP_DIMS, type PrepDim } from '@/engine/content/coursework';
import { activitiesOf, courseworkOf, setWork } from '@/engine/systems/coursework';
import { momentsOf } from '@/engine/systems/classmates';
import { CABARET_KIND } from '@/engine/systems/school';

const EDT = (year: number, month: number, day: number, hour: number, minute = 0): number => Date.UTC(year, month - 1, day, hour + 4, minute);
const ada = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const begun = (seed: string, config: NewSaveConfig): Simulation => createSave(1, seed, { ...config, tutorial: false, paused: true });
/** A life with one trait pressed, or a slider moved, or neither. */
const withTrait = (seed: string, trait?: string, extra: Partial<NewSaveConfig> = {}) => begun(seed, ada({ personalityTraits: trait ? [trait] : [], ...extra }));
const withSlider = (seed: string, axis: keyof Personality, value: number, extra: Partial<NewSaveConfig> = {}) => begun(seed, ada({ personality: { ...defaultPersonality(), [axis]: value }, ...extra }));

/** TEST SETUP: nothing on the calendar that wants the player, canceled by hand. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
/** TEST SETUP: the dials set, and the debt the waking day drains by set to the debt they hold. */
function dials(sim: Simulation, w: Partial<Wellbeing>): void {
  Object.assign(sim.player.wellbeing, w);
  if (w.sleepDebt !== undefined) sim.player.wokeWithDebt = w.sleepDebt;
}

// ---------------------------------------------------------------------------------------------------------------------
// The probes: each a stretch of the clock or a command, measured the same way in every twin
// ---------------------------------------------------------------------------------------------------------------------

type Probe = (sim: Simulation) => number;
/** Two hours awake on empty, from stress 40: how much stress it ends at (`stressGain`, against `stressRecovery`). */
const onEmpty: Probe = (sim) => { clearCalendar(sim); dials(sim, { energy: 10, stress: 40 }); sim.advanceBy(2 * MS_HOUR); return sim.player.wellbeing.stress; };
/** Two hours awake with energy to spare, from stress 40: how much stress is left (`stressRecovery`). */
const awake: Probe = (sim) => { clearCalendar(sim); dials(sim, { energy: 80, stress: 40 }); sim.advanceBy(2 * MS_HOUR); return sim.player.wellbeing.stress; };
/** Four hours awake from a shower's 100: how clean they still are (`hygieneDrift`). */
const soiled: Probe = (sim) => { clearCalendar(sim); dials(sim, { energy: 80, hygiene: 100 }); sim.advanceBy(4 * MS_HOUR); return sim.player.wellbeing.hygiene!; };
/** A meal through Look After Yourself, hungry: what it lifted the mood by (`moraleSwing`, `mealMood`). */
const mealLift: Probe = (sim) => meal(sim).lift;
/** The same meal: what it cost, in cents (`spending`). */
const mealPaid: Probe = (sim) => meal(sim).paid;
function meal(sim: Simulation): { lift: number; paid: number } {
  clearCalendar(sim);
  dials(sim, { nourishment: 30 });
  const r = sim.execute<{ changed: Partial<Wellbeing> }>({ kind: 'life.look_after', payload: { action: 'eat' } });
  expect(r.ok, r.error).toBe(true);
  const paid = sim.universe.transactions.filter((t) => t.memo === 'A meal').flatMap((t) => t.postings.filter((p) => p.amount > 0)).reduce((n, p) => n + p.amount, 0);
  return { lift: r.value!.changed.morale!, paid };
}
/** Six hours' sleep through `life.sleep` at 11 PM from the same dials: the energy it put back (`sleepQuality`, `energyRecovery`). */
const night: Probe = (sim) => {
  clearCalendar(sim);
  sim.advanceTo(EDT(2026, 8, 24, 23));
  dials(sim, { energy: 30, stress: 30, sleepDebt: 10, morale: 62, condition: 88, fitness: 50, nourishment: 75, hygiene: 80 });
  const r = sim.execute<{ recovered: number }>({ kind: 'life.sleep', payload: { hours: 6 } });
  expect(r.ok, r.error).toBe(true);
  return r.value!.recovered;
};
/** A given 80 kg body at the first midnight: what the day's eating left it at (`appetite`). */
const weighed: Probe = (sim) => { sim.advanceTo(EDT(2026, 8, 25, 0, 1)); return sim.player.body!.weightKg; };
/** One step of preparation of a part, through `school.prepare`: how far the part moved (`readsAround`, `drills`, `skims`, `revises`). */
const prepared = (dim: PrepDim): Probe => (sim) => {
  clearCalendar(sim);
  dials(sim, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 70, morale: 60, hygiene: 90 });
  sim.player.awakeSince = sim.now - MS_HOUR;
  const cw = courseworkOf(sim, sim.player)!;
  for (const a of cw.assignments) if (a.status === 'open' || a.status === 'revising') a.status = 'done';
  // TEST SETUP: the course's work set, the parts a step may ask first already in place, and revising as work shown and noted.
  const a = setWork(sim, sim.player, dim === 'interpretation' ? 'DRAM 123a/b' : 'DRAM 103a/b', { year: 2026, month: 9, day: 28 })!;
  for (const d of PREP_DIMS) a.prep[d] = 0.45;
  a.prep[dim] = 0.2;
  if (dim === 'revision') a.status = 'revising';
  const act = activitiesOf(a).find((x) => x.dim === dim && !(x.needs ?? []).includes('partner'))!;
  expect(act, dim).toBeDefined();
  const before = a.prep[dim];
  const r = sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: act.id } });
  expect(r.ok, r.error).toBe(true);
  return a.prep[dim] - before;
};
/** Imani's evening to run lines, said yes to and slept through: how far her bond fell (`bondWound`), as a cut, positive. */
const slept: Probe = (sim) => {
  const EDTs = { help: EDT(2026, 9, 3, 9, 30), answer: EDT(2026, 9, 3, 17), ask: EDT(2026, 9, 9, 9, 30), bed: EDT(2026, 9, 10, 18) };
  sim.advanceTo(EDTs.help);
  const help = momentsOf(courseworkOf(sim, sim.player)!).find((m) => m.status === 'open' && m.kind === 'help')!;
  sim.advanceTo(EDTs.answer);
  expect(sim.execute({ kind: 'school.respond', payload: { momentId: help.id, choice: 'help' } }).ok).toBe(true);
  sim.advanceTo(EDTs.ask);
  const study = momentsOf(courseworkOf(sim, sim.player)!).find((m) => m.status === 'open' && m.kind === 'study')!;
  expect(study.when).toBe(EDT(2026, 9, 10, 19));
  const imani = sim.player.school!.classmates[study.mate]!;
  expect(sim.execute({ kind: 'school.respond', payload: { momentId: study.id, choice: 'yes' } }).ok).toBe(true);
  sim.advanceTo(EDTs.bed);
  const before = imani.bond ?? 0;
  expect(sim.execute({ kind: 'life.sleep', payload: { hours: 3 } }).ok).toBe(true);
  sim.advanceTo(EDT(2026, 9, 10, 22));
  return before - imani.bond!;
};

/** Which probe each trait is measured by, the knob it reads, and the seed. */
const BY: Record<string, { probe: Probe; knob: PersonalityKnob; seed?: string; extra?: Partial<NewSaveConfig> }> = {
  even_tempered: { probe: onEmpty, knob: 'stressGain' },
  quick_tempered: { probe: onEmpty, knob: 'stressGain' },
  highly_strung: { probe: onEmpty, knob: 'stressGain' },
  unshakeable: { probe: onEmpty, knob: 'stressGain' },
  sentimental: { probe: mealLift, knob: 'moraleSwing' },
  detached: { probe: onEmpty, knob: 'stressGain' },
  early_riser: { probe: night, knob: 'energyRecovery' },
  night_owl: { probe: night, knob: 'energyRecovery' },
  orderly: { probe: soiled, knob: 'hygieneDrift' },
  chaotic: { probe: soiled, knob: 'hygieneDrift' },
  homebody: { probe: night, knob: 'energyRecovery' },
  restless: { probe: night, knob: 'energyRecovery' },
  disciplined_body: { probe: weighed, knob: 'appetite', extra: { heightCm: 175, weightKg: 80 } },
  indulgent: { probe: weighed, knob: 'appetite', extra: { heightCm: 175, weightKg: 80 } },
  resilient: { probe: awake, knob: 'stressRecovery' },
  burns_out: { probe: awake, knob: 'stressRecovery' },
  light_sleeper: { probe: night, knob: 'sleepQuality' },
  sleeps_anywhere: { probe: night, knob: 'sleepQuality' },
  frugal: { probe: mealPaid, knob: 'spending' },
  spender: { probe: mealPaid, knob: 'spending' },
  generous: { probe: mealPaid, knob: 'spending' },
  keeps_accounts: { probe: slept, knob: 'bondWound', seed: 'g09-probe' },
  loyal: { probe: onEmpty, knob: 'stressGain' },
  independent: { probe: onEmpty, knob: 'stressGain' },
  needs_people: { probe: mealLift, knob: 'moraleSwing' },
  guarded: { probe: onEmpty, knob: 'stressGain' },
  open_book: { probe: mealLift, knob: 'moraleSwing' },
  peacemaker: { probe: onEmpty, knob: 'stressGain' },
  holds_grudges: { probe: onEmpty, knob: 'stressGain' },
  forgiving: { probe: awake, knob: 'stressRecovery' },
  curious: { probe: prepared('interpretation'), knob: 'readsAround' },
  single_minded: { probe: prepared('memorization'), knob: 'drills' },
  scattered: { probe: prepared('familiarity'), knob: 'skims' },
  self_critical: { probe: prepared('revision'), knob: 'revises' },
  self_assured: { probe: onEmpty, knob: 'stressGain' },
};

/**
 * Which way the measure goes when the knob is above 1: more stress on empty, less left awake (it cleared faster), a
 * cleaner body less soiled, a bigger lift, a dearer meal, more energy put back, a heavier body, a part further on and a
 * deeper cut.
 */
const UP: Map<Probe, 1 | -1> = new Map<Probe, 1 | -1>([[onEmpty, 1], [awake, -1], [soiled, -1], [mealLift, 1], [mealPaid, 1], [night, 1], [weighed, 1], [slept, 1]]);
const way = (probe: Probe): 1 | -1 => UP.get(probe) ?? 1;

describe('every trait moves what it says, through the clock or a command', () => {
  it('names a probe for all thirty-five, each by a knob the trait declares', () => {
    expect(Object.keys(BY).sort()).toEqual(PERSONALITY_TRAITS.map((t) => t.id).sort());
    for (const [id, { knob }] of Object.entries(BY)) expect(PERSONALITY_TRAIT_BY_ID[id]!.systemMods?.[knob], `${id} declares ${knob}`).toBeDefined();
  });

  for (const t of PERSONALITY_TRAITS) {
    it(`PLAYER JOURNEY: ${t.name}, by ${BY[t.id]!.knob}`, () => {
      const { probe, knob, seed = `b20-c-p-${t.id}`, extra = {} } = BY[t.id]!;
      const plain = probe(withTrait(seed, undefined, extra));
      const held = probe(withTrait(seed, t.id, extra));
      const mod = t.systemMods![knob]!;
      // The trait's own figure says which way: above 1 is more of what the knob names.
      const sign = Math.sign((held - plain) * way(probe));
      expect(sign, `${t.name}: ${plain} → ${held}`).toBe(mod > 1 ? 1 : -1);
    });
  }
});

// ---------------------------------------------------------------------------------------------------------------------
// The dispositions
// ---------------------------------------------------------------------------------------------------------------------

/** TEST SETUP: the clock moved six hours at a time with the body kept fed, rested and awake, as a player's meals and sleep keep it. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}
/** The dials an instant before an item and at it: what the item itself did. */
function across(sim: Simulation, item: ScheduledItem): { morale: number; stress: number } {
  tended(sim, item.at - 1);
  const was = { ...sim.player.wellbeing };
  sim.advanceTo(item.at);
  expect(item.status, item.label).toBe('done');
  return { morale: sim.player.wellbeing.morale - was.morale, stress: sim.player.wellbeing.stress - was.stress };
}
/** A Yale Cabaret show joined on 2 September, through `school.cabaret`: its read-through and its first curtain, each lived across. */
function cabaret(sim: Simulation): { readThrough: { morale: number; stress: number }; curtain: { morale: number; stress: number } } {
  tended(sim, EDT(2026, 9, 2, 12));
  const joined = sim.execute({ kind: 'school.cabaret', payload: {} });
  expect(joined.ok, joined.error).toBe(true);
  const calls = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === CABARET_KIND).sort((a, b) => a.at - b.at);
  const readThrough = calls.find((i) => i.payload.call === 'rehearsal')!;
  const curtain = calls.find((i) => i.payload.call === 'performance')!;
  expect(readThrough.label).toBe('Yale Cabaret: Read-Through');
  return { readThrough: across(sim, readThrough), curtain: across(sim, curtain) };
}

describe('every disposition moves what it says, through the clock or a command', () => {
  it('PLAYER JOURNEY: Emotional Stability: two hours on empty cost the volatile more stress than the steady; and composure starts by it, 26.8 at 5 and 58.3 at 95', () => {
    const [low, high] = [withSlider('b20-c-p-stable', 'emotionalStability', 5), withSlider('b20-c-p-stable', 'emotionalStability', 95)];
    expect([low.player.attrs!.composure, high.player.attrs!.composure]).toEqual([26.8, 58.3]);
    expect(onEmpty(low)).toBeGreaterThan(onEmpty(high));
    // And it clears faster in the steady, with energy left.
    expect(awake(withSlider('b20-c-p-stable2', 'emotionalStability', 95))).toBeLessThan(awake(withSlider('b20-c-p-stable2', 'emotionalStability', 5)));
  });

  it('PLAYER JOURNEY: Ambition: two hours on empty cost the driven more stress than the content, and nothing else at creation differs', () => {
    const [low, high] = [withSlider('b20-c-p-amb', 'ambition', 5), withSlider('b20-c-p-amb', 'ambition', 95)];
    expect(high.player.attrs).toEqual(low.player.attrs);
    expect(onEmpty(high)).toBeGreaterThan(onEmpty(low));
  });

  it('PLAYER JOURNEY: Conscientiousness: the same night puts back more for the orderly; and discipline starts by it, 32.5 at 5 and 77.5 at 95', () => {
    const [low, high] = [withSlider('b20-c-p-consc', 'conscientiousness', 5), withSlider('b20-c-p-consc', 'conscientiousness', 95)];
    expect([low.player.attrs!.discipline, high.player.attrs!.discipline]).toEqual([32.5, 77.5]);
    expect(night(high)).toBeGreaterThan(night(low));
  });

  it('PLAYER JOURNEY: Openness and Agreeableness: the Cabaret’s read-through lifts the open and the agreeable 3.6 more at 95 than at 5, the stress alike; Extraversion: its first curtain costs the introvert 7.2 more stress, the morale alike', () => {
    for (const axis of ['openness', 'agreeableness'] as const) {
      const [low, high] = [cabaret(withSlider('b20-c-p-cab', axis, 5)), cabaret(withSlider('b20-c-p-cab', axis, 95))];
      expect(high.readThrough.morale - low.readThrough.morale, axis).toBeCloseTo(3.6, 9);
      expect(high.readThrough.stress, axis).toBeCloseTo(low.readThrough.stress, 9);
      // The curtain isn't a rehearsal, and openness and agreeableness take nothing from it.
      expect(high.curtain.morale, axis).toBeCloseTo(low.curtain.morale, 9);
    }
    const [shy, bold] = [cabaret(withSlider('b20-c-p-cab', 'extraversion', 5)), cabaret(withSlider('b20-c-p-cab', 'extraversion', 95))];
    expect(shy.curtain.stress - bold.curtain.stress).toBeCloseTo(7.2, 9);
    expect(shy.readThrough).toEqual(bold.readThrough);
  });

  it('PLAYER JOURNEY: Risk Tolerance: over 65 the card’s autopay starts on the minimum, so a Scraping family’s $913 is paid down $40 on 11 October and the rest carried; at 50 it’s cleared', () => {
    const card = (risk: number) => {
      const sim = begun('b20-c-p-risk', withFamily(ada({ personality: { ...defaultPersonality(), riskTolerance: risk } }), 'scraping'));
      expect(sim.player.credit!.autopay).toBe(risk > 65 ? 'minimum' : 'full');
      sim.advanceTo(EDT(2026, 10, 12, 12));
      return Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'credit_card')!.balance;
    };
    expect(card(50)).toBe(0);
    expect(card(65)).toBe(0);
    expect(card(80)).toBe(-873_00);
  });
});
