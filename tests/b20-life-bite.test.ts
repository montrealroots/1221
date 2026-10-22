/**
 * Brief 20's B1 and B3 for the body and time (docs/verification/audit-2026-10-21/criteria.md): two lives alike in
 * everything but one input, from the same save and the same clock, the input changed through the player's own command,
 * and the difference read where it should be and looked for where it shouldn't, through commands and the clock.
 *
 * - Sleep length: eight hours against three the night before moves the morning's energy, sleep debt and readiness, and a
 *   self-tape judged at eight reads it; six, which leaves readiness over the line the work reads, is judged as eight. It
 *   moves nothing of the money or the fitness.
 * - A meal, a shower and an hour unwinding each move the measures the menu names, and readiness with them, and leave the
 *   others where the twin who only let the same time pass has them.
 * - The weather: a workout in a dry, mild hour is a run and builds a tenth more fitness than one in a wet or cold hour,
 *   which is a workout indoors; what it costs and everything else it moves are alike.
 * - A holiday: Labor Day, kept where she lives, is a day with no classes on the School's calendar, between two class days.
 * - Illness and injury: the flu and a sprain keep her from a workout in their words until they pass, and a broken bone
 *   from classes, excused; once they've passed, the workout is taken and the classes are gone to.
 * - A plan of her own holds its hour: what would run into it is refused in its words, and taken once it has passed.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and an actor at Yale in New
 * Haven, from Monday 24 August 2026 at 7:30 AM; the clock moved as the top bar moves it, Go at every stop. TEST SETUP,
 * said where it's done: the flu and an injury given by hand (what's tested is what they keep her from, and their end).
 * The two weather lives are two seeds whose sky differs at two in the afternoon of the first day and nothing else, found
 * once and fixed here (`b20-wx-0`, a run, and `b20-wx-3`, indoors).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Wellbeing } from '@/engine/domain/model';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, MS_MINUTE, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { answerStop } from '@/engine/world/clock';
import { readiness, trainingAt, TRAINING, lookAfterOptions } from '@/engine/systems/life';
import { BODY } from '@/engine/content/body';
import { personalityOf } from '@/engine/systems/personality';
import { healthOf } from '@/engine/systems/health';
import { CLASSES_KIND } from '@/engine/systems/school';
import { addCountryHolidays, holidaysAcross } from '@/engine/content/holidays';
import { keptCalendars } from '@/engine/world/calendar';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { EVALUATION } from '@/engine/content/tasks';

const zone = 'America/New_York';
const at = (y: number, m: number, d: number, h = 9, mi = 0) => instantFromZoned({ year: y, month: m, day: d, hour: h, minute: mi }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
function go(sim: Simulation, to: number): void {
  let r = sim.advanceTo(to, { stopOnPlayerRequired: true });
  for (let n = 0; r.interruptedBy && n < 500; n += 1) r = answerStop(sim, { item: r.interruptedBy, wanted: to, sentFrom: r.sentFrom }, 'go').result!;
}
const balances = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id).map((a) => a.balance);
/** Every dial but the ones named, as the twin has them. */
const alikeBut = (a: Wellbeing, b: Wellbeing, but: (keyof Wellbeing)[]) => {
  for (const k of Object.keys(a) as (keyof Wellbeing)[]) if (!but.includes(k)) expect(a[k], k).toBeCloseTo(b[k] as number, 9);
};

describe('sleep length', () => {
  it('eight hours against three: more energy, less debt and more readiness at eight, and a self-tape judged better for it; six, still over the line work reads, is judged as eight; the money and the fitness alike', () => {
    const sim = student('b20-bite-sleep');
    go(sim, at(2026, 8, 24, 23));
    const [long, mid, short] = [reload(sim), reload(sim), reload(sim)];
    long.must({ kind: 'life.sleep', payload: { hours: 8 } });
    mid.must({ kind: 'life.sleep', payload: { hours: 6 } });
    short.must({ kind: 'life.sleep', payload: { hours: 3 } });
    for (const s of [long, mid, short]) go(s, at(2026, 8, 25, 8));
    const [l, sh] = [long.player.wellbeing, short.player.wellbeing];
    expect(l.energy).toBeGreaterThan(sh.energy + 40);
    expect(l.sleepDebt).toBeLessThan(sh.sleepDebt - 5);
    expect(readiness(long.player)).toBeGreaterThan(EVALUATION.sufficientReadiness);
    expect(readiness(mid.player)).toBeGreaterThan(EVALUATION.sufficientReadiness);
    expect(readiness(short.player)).toBeLessThan(EVALUATION.sufficientReadiness);
    // A judged piece: the same brief, read the same way, taped at the same hour.
    const brief = BRIEF_BY_ID['brief-comedy']!;
    const tape = (s: Simulation) => {
      s.must({ kind: 'brief.choose', payload: { brief: brief.id, reading: brief.readings[0]!.id } });
      return s.must<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: 'comedy', brief: brief.id } }).overall;
    };
    const [tl, tm, ts] = [tape(long), tape(mid), tape(short)];
    expect(tl).toBeGreaterThan(ts);
    // Readiness at or over the line is a sufficient day for any work (`EVALUATION.sufficientReadiness`): six hours' less
    // energy doesn't reach the judgment.
    expect(tm).toBe(tl);
    expect(balances(long)).toEqual(balances(short));
    expect(long.player.wellbeing.fitness).toBe(short.player.wellbeing.fitness);
  });
});

describe('a meal, a shower and an hour unwinding', () => {
  const twins = () => {
    const sim = student('b20-bite-care');
    go(sim, at(2026, 8, 24, 14));
    return [reload(sim), reload(sim)] as const;
  };

  it('Eat A Meal fills nourishment, lifts readiness and is paid; stress, hygiene and energy as the twin who let the forty minutes pass has them', () => {
    const [fed, twin] = twins();
    fed.must({ kind: 'life.look_after', payload: { action: 'eat' } });
    go(twin, twin.now + 40 * MS_MINUTE);
    expect(fed.now).toBe(twin.now);
    const n = twin.player.wellbeing.nourishment;
    expect(fed.player.wellbeing.nourishment).toBeCloseTo(n + Math.min(50, 100 - n), 9);
    expect(readiness(fed.player)).toBeGreaterThan(readiness(twin.player));
    alikeBut(fed.player.wellbeing, twin.player.wellbeing, ['nourishment', 'morale']);
    expect(balances(fed)[0]!).toBeLessThan(balances(twin)[0]!);
  });

  it('Shower puts hygiene at 100 and eases stress by a tenth of what it washed off; nourishment, energy and morale alike', () => {
    const [washed, twin] = twins();
    washed.must({ kind: 'life.look_after', payload: { action: 'wash' } });
    go(twin, twin.now + 20 * MS_MINUTE);
    const h = twin.player.wellbeing.hygiene;
    expect(washed.player.wellbeing.hygiene).toBe(100);
    expect(washed.player.wellbeing.stress).toBeCloseTo(Math.max(0, twin.player.wellbeing.stress - (100 - h) * 0.1), 9);
    alikeBut(washed.player.wellbeing, twin.player.wellbeing, ['hygiene', 'stress']);
    expect(balances(washed)).toEqual(balances(twin));
  });

  it('Unwind takes ten times her stress recovery off stress and lifts morale; nourishment, hygiene and energy alike', () => {
    const [eased, twin] = twins();
    eased.must({ kind: 'life.look_after', payload: { action: 'unwind' } });
    go(twin, twin.now + 60 * MS_MINUTE);
    expect(eased.player.wellbeing.stress).toBeCloseTo(Math.max(0, twin.player.wellbeing.stress - 10 * personalityOf(eased.player, 'stressRecovery')), 9);
    expect(eased.player.wellbeing.morale).toBeGreaterThan(twin.player.wellbeing.morale);
    alikeBut(eased.player.wellbeing, twin.player.wellbeing, ['stress', 'morale']);
  });
});

describe('the weather', () => {
  it('a workout in a dry, mild hour is a run and builds a tenth more fitness than one indoors in another sky; its cost and the rest alike', () => {
    const run = student('b20-wx-0');
    const indoors = student('b20-wx-3');
    for (const s of [run, indoors]) go(s, at(2026, 8, 24, 14));
    // The fixture's own check: the two lives stand alike but for the sky.
    alikeBut(run.player.wellbeing, indoors.player.wellbeing, []);
    expect(trainingAt(run, run.player, run.now + MS_HOUR).where).toBe('run');
    expect(trainingAt(indoors, indoors.player, indoors.now + MS_HOUR).where).toBe('indoors');
    // The menu says which it will be before it's pressed.
    expect(lookAfterOptions(run).find((o) => o.action === 'exercise')!.why).toMatch(/^A run in fine weather/);
    expect(lookAfterOptions(indoors).find((o) => o.action === 'exercise')!.why).toMatch(/^Indoors, since the weather’s no good for a run/);
    const before = run.player.wellbeing.fitness;
    for (const s of [run, indoors]) s.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
    const built = (s: Simulation) => s.player.wellbeing.fitness - before;
    expect(built(run) / built(indoors)).toBeCloseTo(TRAINING.run / TRAINING.indoors, 9);
    alikeBut(run.player.wellbeing, indoors.player.wellbeing, ['fitness']);
    // And burns more, a run's MET against a workout's, on the day's tally the scale reads at midnight (`exerts`).
    const perKg = (s: Simulation) => s.player.body!.extra / s.player.body!.weightKg;
    expect(perKg(run)).toBeCloseTo(BODY.met.run - BODY.sedentary, 9);
    expect(perKg(indoors)).toBeCloseTo(BODY.met.workout - BODY.sedentary, 9);
  });
});

describe('a holiday closes the School’s classes where its calendar says', () => {
  it('Labor Day, kept where she lives, has no classes, between the Friday’s and the Tuesday’s', () => {
    addCountryHolidays('us', readFileSync('public/holidays/us.tsv', 'utf8'));
    const sim = student('b20-bite-holiday');
    go(sim, at(2026, 9, 8, 16));
    const classesOn = (d: number) => sim.universe.scheduled.filter((i) => i.kind === CLASSES_KIND && i.payload.day === `2026-09-${String(d).padStart(2, '0')}`);
    expect(holidaysAcross(at(2026, 9, 7, 12), zone, keptCalendars(sim)).some((h) => h.name === 'Labor Day' && h.type === 'public')).toBe(true);
    expect(classesOn(7)).toEqual([]);
    expect(classesOn(4).map((i) => i.status)).toEqual(['done']);
    expect(classesOn(8).map((i) => i.status)).toEqual(['done']);
    expect(sim.player.school!.tally.classDays).toBe(sim.player.school!.tally.attended);
  });
});

describe('illness and injury keep her from what they say, and recovery gives it back', () => {
  it('the flu: no workout and a sick day excused while it lasts; the workout taken and no sick day once it has passed', () => {
    const sim = student('b20-bite-flu');
    go(sim, at(2026, 9, 1, 7));
    // TEST SETUP: the flu, for two days.
    healthOf(sim.player).fluUntil = at(2026, 9, 3, 7);
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).error).toBe('Not with the flu: rest until it passes on September 3, 2026.');
    sim.must({ kind: 'school.call_in_sick', payload: {} });
    go(sim, at(2026, 9, 1, 16));
    const tuesday = sim.universe.scheduled.find((i) => i.kind === CLASSES_KIND && i.payload.day === '2026-09-01')!;
    expect(tuesday.status).toBe('missed');
    expect(sim.player.school!.tally.excused).toBe(1);
    go(sim, at(2026, 9, 3, 7, 30));
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok).toBe(true);
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).error).toBe('You’re well enough to go. Staying away would count as an unexcused absence.');
  });

  it('a sprain: no workout until it mends, in its own words; a broken bone: the classes it lays her up for missed and excused; each gone once it mends', () => {
    const sim = student('b20-bite-hurt');
    go(sim, at(2026, 9, 1, 7));
    // TEST SETUP: a sprained ankle, mending in three days.
    healthOf(sim.player).injury = { kind: 'sprain', at: sim.now, until: sim.now + 3 * MS_DAY };
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).error).toBe('Not with a sprained ankle; it has 3 days yet to mend.');
    go(sim, at(2026, 9, 4, 7, 30));
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok).toBe(true);
    // TEST SETUP: a broken bone, laying her up to Monday.
    const laid = reload(sim);
    healthOf(laid.player).injury = { kind: 'fracture', at: laid.now, until: at(2026, 9, 8, 7), offWorkUntil: at(2026, 9, 8, 7) };
    const before = { ...laid.player.school!.tally };
    go(laid, at(2026, 9, 8, 16));
    const day = (d: string) => laid.universe.scheduled.find((i) => i.kind === CLASSES_KIND && i.payload.day === d)!.status;
    expect(day('2026-09-04')).toBe('missed');
    expect(day('2026-09-08')).toBe('done');
    expect(laid.player.school!.tally.excused - before.excused).toBe(1);
  });
});

describe('a class day slept through', () => {
  it('is an absence on the term’s tally the review reads, not excused, where the twin who woke for it attended', () => {
    const sim = student('b20-bite-slept');
    go(sim, at(2026, 8, 31, 1));
    const slept = reload(sim);
    const woke = reload(sim);
    slept.must({ kind: 'life.sleep', payload: { hours: 16 } });
    woke.must({ kind: 'life.sleep', payload: { hours: 7 } });
    for (const s of [slept, woke]) go(s, at(2026, 8, 31, 18));
    const day = (s: Simulation) => s.universe.scheduled.find((i) => i.kind === CLASSES_KIND && i.payload.day === '2026-08-31')!.status;
    expect([day(slept), day(woke)]).toEqual(['missed', 'done']);
    const t = (s: Simulation) => s.player.school!.tally;
    expect([t(slept).classDays, t(slept).attended, t(slept).excused]).toEqual([1, 0, 0]);
    expect([t(woke).classDays, t(woke).attended, t(woke).excused]).toEqual([1, 1, 0]);
    expect(slept.universe.notifications.some((n) => n.title === 'You Slept Through One Commitment' && n.body === 'You were asleep for Classes, so you missed it.')).toBe(true);
  });
});

describe('a plan of her own holds its hour', () => {
  it('half an hour before it, a workout, a meal and an hour’s practice are refused in its words, a shower taken; past it, the workout is taken', () => {
    const sim = student('b20-bite-plan');
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Coffee With Sam', at: at(2026, 8, 24, 15), durationMinutes: 60 } });
    go(sim, at(2026, 8, 24, 14, 30));
    const said = 'Coffee With Sam is at 3:00 PM, and there isn’t time.';
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).error).toBe(said);
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } }).error).toBe(said);
    expect(sim.execute({ kind: 'practice.exercise', payload: { exercise: 'concentration' } }).error).toBe('Coffee With Sam starts at 3:00 PM: there isn’t the time before it.');
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'wash' } }).ok).toBe(true);
    go(sim, at(2026, 8, 24, 16, 30));
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok).toBe(true);
  });
});
