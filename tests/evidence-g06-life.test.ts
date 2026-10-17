/**
 * Evidence for the seven body dials the review of 2026-10-13 left partial (verification group g06-life): energy,
 * condition, fitness, nourishment, hygiene, stress and morale. Each row's gaps are closed here through what moves the
 * dial as a player moves it (Sleep, Look After Yourself, a card locked, the clock an hour at a time or sent through a
 * night, the health week) and each consequence is read where the row says it's read, against figures worked out from
 * the rule's own numbers (an hour's 3 energy, 2 nourishment and 1.6 hygiene, a night's 13.5 and 4.2, the age's
 * ceilings and recovery from `AGING`, CARE's tolls, the injury's 6 and 4 and 1 a day), never from the helper the engine
 * computes them with.
 *
 * Every row's last test is the same reader: the first classes, at nine on Monday 31 August, build the scene craft in
 * proportion to readiness (`focusOf`), so twins of that morning with one dial set apart build it in the ratio of their
 * readiness as the rule's seven ends give it from the dials the class met. Until 2026-10-13 readiness was read for
 * every dial only through `readinessParts` on a hand-built person.
 *
 * - energy: fourteen hours by the clock leave the 82 a new life wakes with at 40, and Home's How You Are and the Energy
 *   look show 40; twenty-five leave 7, Home says "Running on empty", and stress has climbed 1.6 an hour, less the 0.35
 *   it would have cleared, for the hours past fifteen. The workout's gate at 25 lets a workout through at exactly 25
 *   and refuses one at 22, "You’re too tired to train. Sleep first.", and Movement Work with it. A night chosen at
 *   3:30 AM puts back its exact figure (quality, debt, wear and the age's 0.995), where the old test asked for over 60.
 *   A stay and an emergency drawn by the health week take CARE's 40 and 20 less the 6 the twin's classes took, which
 *   the hospital kept them from; the flu, drawn in New Haven's season (nought until the middle of October), CARE's 30;
 *   Home shows each, and the flu refuses a workout the next morning in its own words.
 * - condition: five-hour nights chosen through Sleep take a new life under 55 by Monday 14 September, where a sick day
 *   is excused and the class tally counts it, and stands across a reload, while a twin on eight-hour nights is refused
 *   then and on the Friday before; a worn body gets 0.9 of a night's energy, and its morale settles lower by 45 of the
 *   condition it's short, over the age's 99.8, times the night's pull; a stay moves the body a band, the midnight draws
 *   the year's end again, the end stands while the band holds and is canceled when the mending body leaves it.
 * - fitness: a workout costs 13 energy at fitness 20 and 7 at 80, as the Fitness look says beforehand; rest mends an
 *   untrained body no further than 91, seventy and 0.6 of 35; a sprain the workout's own draw brings refuses the next
 *   in `trainingRefusal`'s words, "1 day" on its last morning; fitness is held three midnights after a New Haven workout
 *   and then falls 0.18 a day; Stamina is read by the scene shown in class, a piece in its units (in two halves until
 *   evaluation-10), through its drain on every dimension tiredness reaches, consistency among them.
 * - nourishment: both cards locked through `card.lock`, the day's groceries go unbought at midnight, "No Money For
 *   Food Today" says why, and the morning starts at exactly 40 against the fed twin's 76; the hungry hours from five
 *   cost 0.5 condition and 0.7 morale an hour against the fed twin, and Home and the look say so; unlocked, a meal is
 *   paid and eaten. A meal sent twice with one actionId is eaten and paid once, across a reload, and so is an order.
 * - hygiene: a workout at eight takes a student under fifty by half past two, and the hours under it wear 0.4 of
 *   morale an hour against a twin who showered at nine; a shower at six puts it back to 100 and eases stress by a
 *   tenth of what it put back. And the midnight floor of 82, as it stands, for a body never showered.
 * - stress: a night's quality is 0.144 lower at stress 70 than at 10, as Sleep reports it, and puts back that much
 *   less energy; a night nobody chose is 0.72 hours shorter; a sprain brings 6 and 1 more at each midnight while it
 *   mends, and none once it has; over 75 it costs condition 0.25 an hour, as Home's bar and the Stress look show; it
 *   makes the week's flu 1.8 times likelier; money worry adds 4 at the midnight, which the row's entry left out.
 * - morale: a night clears 4.2 × hours × quality × 0.28 more stress at morale 90 than at 20, as the Morale look says it
 *   will; a meal needed lifts it 2, one on a fuller stomach by what it puts back; a sprain takes 4 and a point each
 *   midnight while it mends.
 *
 * A defect this file showed, failing when written, until the code was fixed on 2026-10-13: the Condition look decided
 * its sick-day line on the figure it shows, rounded (src/ui/looks/wellbeing.tsx 288), where the school reads the
 * condition itself (`sickRefusal`, school.ts 170). A student worn to 54.8 by five-hour nights was excused a sick day and
 * the look, showing 55, didn’t say so.
 *
 * Left as it stands, and not a defect: the morning's floor of 82 for hygiene, which a body kept up through midnight
 * gets too, so a day without a shower costs nothing past that midnight; and model.ts 71-75, which still says hygiene
 * falls "twice as fast on set or on stage (`setGrime`)" and that "Rooms notice", though nothing in src does either. The
 * comment is src's to correct, which this file can't.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York and a first-year at Yale
 * in New Haven from 7:30 AM on Monday 24 August 2026, every personality axis at the middle as the creation screen can
 * set them, so every knob the dials read (stress gain and recovery, mood swing, hygiene drift, sleep quality, energy
 * recovery, illness toll, meal mood) reads 1 and the rule's own figures are the expectations. Twins are one save loaded
 * twice (`loadSave(deserialise(serialise(…)))`), so they share every draw. "By the hour" is the clock moved an hour at
 * a time, as One Hour moves it, with the player there, so no night is slept that wasn't chosen; "sent" is a longer
 * jump, which sleeps the night nobody chose. Home and the looks are rendered as the player has them (react-dom/server);
 * a look is opened by giving its region the subject its word opens (the region's own state, its first in render).
 *
 * TEST SETUP, said again where it's done: a dial set before an action, on both twins where twins are compared; a draw
 * forced on one save (the week's illness, an injury, the year's end), as the deciders' sweep forces one, numbers given
 * and a "no" after them; a current account overdrawn by a posting against a test line. The year's end is drawn by the
 * engine's own redraw at the midnight a band moves; only the draw's numbers are forced, since a 24-year-old's year
 * ends in under a thousandth of the saves a seed search would have to try.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Personality, Wellbeing } from '@/engine/domain/model';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { HEALTH_WEEK_KIND, healthOf } from '@/engine/systems/health';
import { END_KIND } from '@/engine/systems/mortality';
import { CARE } from '@/engine/content/safetynet';
import { fluByWeek, weekOfYear } from '@/engine/systems/seasons';
import { at as subject } from '@/ui/looks/subject';
import '@/ui/looks/all';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value. */
  states: [] as unknown[],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    if (h.states.length === 0) return [value, set];
    return [h.states.shift(), set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

// A screen's kept tab: the store it's kept in has no server snapshot to render from.
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
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { Home } = await import('@/ui/screens/Home');
const { LookRegion } = await import('@/ui/looks/Look');

// ---------------------------------------------------------------------------
// Lives, the clock, and the screens over them
// ---------------------------------------------------------------------------

const MIDDLE: Personality = { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 };
const student = (seed: string): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personality: MIDDLE });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/**
 * An instant on New Haven's clock on Eastern Daylight Time (UTC−4), which every instant here is on: August to the end
 * of October 2026, and June 2027. Worked out here, not by the engine; an hour past 23 or a day past the month's end
 * rolls on, so the 41st of August is the 10th of September.
 */
const nh = (month: number, day: number, hour: number, minute = 0): number => Date.UTC(2026, month - 1, day, hour + 4, minute);
const START = nh(8, 24, 7, 30);

/** One life played by the clock alone to an instant, kept once as a save and loaded afresh each time: twins share every draw. */
const kept = new Map<string, string>();
function lifeAt(seed: string, until: number): Simulation {
  const key = `${seed}@${until}`;
  if (!kept.has(key)) {
    const sim = student(seed);
    if (until > sim.now) sim.advanceTo(until);
    kept.set(key, serialise(sim.universe));
  }
  return loadSave(deserialise(kept.get(key)!) as never);
}

/** The clock moved an hour at a time, as One Hour moves it with the player there, so no night is slept that wasn't chosen. */
function byTheHour(sim: Simulation, until: number): void {
  while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + MS_HOUR));
}

const sleep = (sim: Simulation, hours: number) => sim.execute<{ wokeAt: number; quality: number; recovered: number }>({ kind: 'life.sleep', payload: { hours } });
const lookAfter = (sim: Simulation, action: string, actionId?: string) =>
  sim.execute<{ doneAt: number; changed: Partial<Wellbeing> }>({ kind: 'life.look_after', payload: actionId ? { action, actionId } : { action } });
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const memos = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo);
const dials = (sim: Simulation): Wellbeing => ({ ...sim.player.wellbeing });

/**
 * TEST SETUP: draws forced on one save, as the deciders' sweep forces one: a stream's numbers for one key given in
 * order, and then 0.999, a "no" to every chance after them. A reloaded save draws its own again.
 */
function forcing(sim: Simulation): (stream: string, key: (string | number)[], values: number[]) => void {
  const forced = new Map<string, number[]>();
  const real = sim.rng.bind(sim);
  const rng = (stream: string, ...keys: (string | number)[]) => {
    const values = forced.get([stream, ...keys].join('|'));
    const drawn = real(stream, ...keys);
    if (!values) return drawn;
    let i = 0;
    return { ...drawn, next: () => values[i++] ?? 0.999 };
  };
  Object.assign(sim, { rng });
  return (stream, key, values) => { forced.set([stream, ...key].join('|'), values); };
}
/** The week's draw in `illnessWeek`'s order: a stay; an emergency; a visit; the flu, and whether it's seen at urgent care. */
const WEEK = { stay: [0], emergency: [0.999, 0], flu: [0.999, 0.999, 0.999, 0, 0], nothing: [0.999] } as const;
/**
 * The first health week, nine on Monday 31 August; and one in New Haven's flu season, Monday 26 October, week 42 of
 * the year, where the town's share of a season's flu is over nought (it's nought from April to the middle of October).
 */
const SUMMER_WEEK = nh(8, 31, 9);
const FLU_WEEK = nh(10, 26, 9);
/**
 * Twins of one life played by the clock alone to an hour before a health week, each with the week's draw forced
 * (TEST SETUP), and the clock a minute past it.
 */
function weekTwins<K extends string>(week: number, draws: Record<K, readonly number[]>): Record<K, Simulation> {
  const out = {} as Record<K, Simulation>;
  for (const [name, draw] of Object.entries(draws) as [K, readonly number[]][]) {
    const sim = lifeAt('g06-week', week - MS_HOUR);
    const item = sim.universe.scheduled.find((i) => i.kind === HEALTH_WEEK_KIND && i.status === 'pending' && i.payload.personId === sim.player.id)!;
    expect(item.at).toBe(week);
    forcing(sim)('health.illness', [sim.player.id, String(week)], [...draw]);
    sim.advanceTo(week + 60_000);
    out[name] = sim;
  }
  return out;
}

/**
 * Readiness from its seven dials, each a straight line between the ends the rule gives it (`readinessParts` in
 * life.ts: energy 0.45 to 1.15, stress 1.12 to 0.62, a debt of thirty hours 1.05 to 0.66, nourishment 0.78 to 1.05,
 * morale 0.82 to 1.12, hygiene 0.92 to 1.03, condition 0.7 to 1), held to them, their product over 1.35. Worked out
 * here, so the expectation isn't the engine's own reckoning.
 */
const READINESS_ENDS: readonly (readonly [keyof Wellbeing, number, number, number])[] = [
  ['energy', 100, 0.45, 1.15], ['stress', 100, 1.12, 0.62], ['sleepDebt', 30, 1.05, 0.66], ['nourishment', 100, 0.78, 1.05],
  ['morale', 100, 0.82, 1.12], ['hygiene', 100, 0.92, 1.03], ['condition', 100, 0.7, 1],
];
function readinessFrom(w: Wellbeing): number {
  const product = READINESS_ENDS.reduce((p, [k, top, lo, hi]) => p * (lo + (hi - lo) * Math.min(1, Math.max(0, ((w[k] as number | undefined) ?? 80) / top))), 1);
  return Math.min(100, Math.max(5, (100 * product) / 1.35));
}

/** The morning of the first classes, 7:30 AM on Monday 31 August, one life played to it by the clock alone. */
const CLASS_MORNING = nh(8, 31, 7, 30);
/**
 * The nine o'clock classes, stopped at as the screen stops at them and the dials read there; then the clock holds
 * them. What the scene craft gained: Acting I is the one course that day that grows it.
 */
function atClasses(sim: Simulation): { dials: Wellbeing; built: number } {
  const stop = sim.advanceTo(nh(8, 31, 9, 1), { stopOnPlayerRequired: true });
  expect(stop.interruptedBy?.kind).toBe('school.classes');
  expect(sim.now).toBe(nh(8, 31, 9));
  const read = dials(sim);
  const before = sim.player.craft!.scene;
  sim.advanceTo(nh(8, 31, 9, 1));
  return { dials: read, built: sim.player.craft!.scene - before };
}
/**
 * Twins of the class morning, one dial set worse in one and better in the other (TEST SETUP) at 7:30, the classes at
 * nine reading them. What a class builds is linear in its focus, readiness over 80 held to 0.3 and 1.2 (`focusOf`), so
 * the better twin builds more by the ratio of their readiness as the rule's ends give it from the dials the class met.
 */
function classesRead(dial: keyof Wellbeing, worse: number, better: number): number {
  const [a, b] = [lifeAt('g06-class', CLASS_MORNING), lifeAt('g06-class', CLASS_MORNING)];
  Object.assign(a.player.wellbeing, { [dial]: worse }); // TEST SETUP
  Object.assign(b.player.wellbeing, { [dial]: better }); // TEST SETUP
  const lo = atClasses(a);
  const hi = atClasses(b);
  // Nothing the week drew at nine, in either: the dials the class met are the ones set and the hour and a half since.
  for (const sim of [a, b]) expect(healthOf(sim.player).fluUntil ?? healthOf(sim.player).inHospitalUntil).toBeUndefined();
  for (const r of [readinessFrom(lo.dials), readinessFrom(hi.dials)]) {
    expect(r).toBeGreaterThan(0.3 * 80);
    expect(r).toBeLessThan(1.2 * 80);
  }
  const ratio = readinessFrom(hi.dials) / readinessFrom(lo.dials);
  expect(lo.built).toBeGreaterThan(0);
  expect(hi.built / lo.built).toBeCloseTo(ratio, 9);
  return ratio;
}

/** What the player reads: the markup with every title attribute taken out, then every tag, and its entities read. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/** Home's How You Are, drawn as the player has it: its words, and each bar's figure and color. */
function howYouAre(sim: Simulation): { text: string; bars: Record<string, { shows: number; tone: string }> } {
  h.sim = sim;
  h.states = [];
  const html = renderToStaticMarkup(createElement(Home));
  const from = html.indexOf('>How You Are<');
  expect(from).toBeGreaterThan(0);
  const next = html.indexOf('<h2', from);
  const panel = html.slice(from, next > 0 ? next : undefined);
  const bars: Record<string, { shows: number; tone: string }> = {};
  for (const m of panel.matchAll(/class="meter meter-(\w+)" role="meter" aria-valuenow="(\d+)"[^>]*aria-label="(\w+)"/g)) bars[m[3]!] = { shows: Number(m[2]), tone: m[1]! };
  return { text: onScreen(panel), bars };
}

/**
 * A look opened as its word opens it, into the region it's named in (TEST SETUP: the region's own state, its first):
 * its name, and the sentence under it.
 */
function look(sim: Simulation, kind: string, id: string): { name: string; says: string } {
  h.sim = sim;
  h.states = [subject(kind, id)];
  const html = renderToStaticMarkup(createElement(LookRegion, { children: null }));
  expect(h.states).toHaveLength(0);
  const name = /<h3 class="look-name">(.*?)<\/h3>/.exec(html);
  const says = /<p class="look-summary">(.*?)<\/p>/.exec(html);
  expect(name && says).toBeTruthy();
  return { name: onScreen(name![1]!), says: onScreen(says![1]!) };
}
/** One of the eight dials' looks, as Home's bar or your own page opens it. */
const dial = (sim: Simulation, key: keyof Wellbeing) => look(sim, 'dial', `${sim.player.id}/${key}`);

/** The age's ceilings at 24 (`AGING`, content/lifespan.ts): from twenty, 0.05 of condition a year and 0.12 of fitness, five years to the tenth; and a night banks 1 − 5 × 0.001 of itself. */
const CEILING = { condition: 99.8, fitness: 99.4 };
const BANKED = 0.995;

// ---------------------------------------------------------------------------
// energy
// ---------------------------------------------------------------------------

describe('energy', () => {
  it('PLAYER JOURNEY: fourteen hours by the clock leave the 82 a new life wakes with at 40, and Home and the Energy look show 40; twenty-five leave 7, Home says “Running on empty”, and stress has climbed for the hours past fifteen', () => {
    const sim = student('g06-energy');
    expect(sim.now).toBe(START);
    expect(dials(sim)).toMatchObject({ energy: 82, stress: 18, sleepDebt: 0 });
    byTheHour(sim, START + 14 * MS_HOUR);
    // Three an hour, raised by nothing: the debt woken with is none.
    expect(sim.player.wellbeing.energy).toBeCloseTo(82 - 3 * 14, 9);
    const evening = howYouAre(sim);
    expect(evening.bars.Energy).toEqual({ shows: 40, tone: 'positive' });
    expect(evening.text).toContain('Holding up, with nothing out of the ordinary to worry about.');
    expect(dial(sim, 'energy')).toEqual({ name: 'Energy', says: '40. You’re running down, and it shows in everything else.' });

    // On to 8:30 the next morning, kept up an hour at a time: the tank passes fifteen at 82 − 15 = 67 / 3 = 22⅓ hours.
    byTheHour(sim, START + 25 * MS_HOUR);
    expect(sim.player.wellbeing.energy).toBeCloseTo(82 - 3 * 25, 9);
    // Stress clears 0.35 an hour while there's something left and climbs 1.6 an hour, less that 0.35, past it.
    const empty = 67 / 3;
    const stress = 18 - 0.35 * empty + (1.6 - 0.35) * (25 - empty);
    expect(sim.player.wellbeing.stress).toBeCloseTo(stress, 9);
    const morning = howYouAre(sim);
    expect(morning.text).toContain('Running on empty. You need sleep before anything else.');
    expect(morning.bars.Energy).toEqual({ shows: 7, tone: 'negative' });
    expect(morning.bars.Stress).toEqual({ shows: Math.round(stress), tone: 'positive' });
    expect(dial(sim, 'energy').says).toBe('7. You’re running down, and it shows in everything else.');
    // And the same after a reload.
    expect(howYouAre(reload(sim)).bars.Energy).toEqual({ shows: 7, tone: 'negative' });
  });

  it('holds the workout’s gate at 25 as the clock reaches it: taken at exactly 25, refused at 22 “You’re too tired to train. Sleep first.” with the save as it was, and the on-the-feet exercises with it', () => {
    const sim = student('g06-energy');
    byTheHour(sim, START + 19 * MS_HOUR);
    expect(sim.player.wellbeing.energy).toBeCloseTo(25, 9);
    const at25 = reload(sim);
    expect(lookAfter(at25, 'exercise').ok).toBe(true);

    byTheHour(sim, START + 20 * MS_HOUR);
    expect(sim.player.wellbeing.energy).toBeCloseTo(22, 9);
    const was = { now: sim.now, w: dials(sim), applied: sim.player.development?.workout };
    const tried = lookAfter(sim, 'exercise');
    expect(tried.error).toBe('You’re too tired to train. Sleep first.');
    expect({ now: sim.now, w: dials(sim), applied: sim.player.development?.workout }).toEqual(was);
    const feet = sim.execute({ kind: 'practice.exercise', payload: { exercise: 'movement-work' } });
    expect(feet.error).toBe('You’re too tired to work on your feet. Sleep first.');
    expect({ now: sim.now, w: dials(sim) }).toEqual({ now: was.now, w: was.w });
  });

  it('a night chosen at 3:30 AM puts back 8 × quality × 13.5 × 0.995, less what the debt holds back and what the body’s wear does', () => {
    const sim = student('g06-energy');
    byTheHour(sim, START + 20 * MS_HOUR);
    const bed = dials(sim);
    expect(bed.energy).toBeCloseTo(22, 9);
    const slept = sleep(sim, 8);
    expect(slept.ok).toBe(true);
    // Quality: 0.82 less 0.24 a hundred of stress, less 0.08 for a bedtime between one and five.
    const quality = 0.82 - 0.0024 * bed.stress - 0.08;
    expect(slept.value!.quality).toBeCloseTo(quality, 9);
    // The debt holds back 0.62 of a night at thirty hours; wear a fifth at nought against what the fitness lets rest
    // mend to, seventy and 0.6 of it, under the age's 99.8.
    const owing = 1 - (bed.sleepDebt / 30) * 0.62;
    const mends = Math.min(CEILING.condition, 70 + 0.6 * bed.fitness);
    const worn = 0.8 + 0.2 * Math.min(1, bed.condition / mends);
    const back = 8 * quality * 13.5 * BANKED * owing * worn;
    expect(slept.value!.recovered).toBeCloseTo(back, 9);
    expect(sim.player.wellbeing.energy).toBeCloseTo(22 + back, 9);
  });

  it('a stay and an emergency drawn by the health week take CARE’s 40 and 20 against a twin, less the 6 the twin’s classes took, on Home too, and the hospital bed refuses a workout', () => {
    const { stay, emergency, well } = weekTwins(SUMMER_WEEK, { stay: WEEK.stay, emergency: WEEK.emergency, well: WEEK.nothing });
    expect(healthOf(stay.player).inHospitalUntil).toBe(SUMMER_WEEK + 3 * MS_DAY);
    expect(healthOf(emergency.player).inHospitalUntil).toBeGreaterThan(SUMMER_WEEK + MS_HOUR);
    expect(healthOf(well.player).inHospitalUntil).toBeUndefined();
    // CARE.toll, at an illness toll of 1; the twin went to the nine o'clock classes, a day of which takes 6
    // (`ESTIMATE.energy.classes`), and the hospital kept the other two from them, excused.
    const classes = (sim: Simulation) => sim.universe.scheduled.find((i) => i.kind === 'school.classes' && i.at === SUMMER_WEEK)!.status;
    expect([classes(well), classes(stay), classes(emergency)]).toEqual(['done', 'missed', 'missed']);
    expect(well.player.wellbeing.energy - stay.player.wellbeing.energy).toBeCloseTo(40 - 6, 9);
    expect(well.player.wellbeing.energy - emergency.player.wellbeing.energy).toBeCloseTo(20 - 6, 9);
    expect(well.player.wellbeing.condition - stay.player.wellbeing.condition).toBeCloseTo(40, 9);
    expect(well.player.wellbeing.condition - emergency.player.wellbeing.condition).toBeCloseTo(20, 9);
    expect(howYouAre(well).bars.Energy!.shows - howYouAre(stay).bars.Energy!.shows).toBe(34);
    expect(howYouAre(well).bars.Energy!.shows - howYouAre(emergency).bars.Energy!.shows).toBe(14);
    expect(lookAfter(stay, 'exercise').error).toBe('Not from a hospital bed.');
  });

  it('the flu drawn by the health week in its season takes CARE’s 30 against a twin, on Home too, and the next morning refuses a workout “rest until it passes” where the twin trains', () => {
    const { flu, well } = weekTwins(FLU_WEEK, { flu: WEEK.flu, well: WEEK.nothing });
    expect(healthOf(flu.player).fluUntil).toBe(FLU_WEEK + 5 * MS_DAY);
    expect(healthOf(well.player).fluUntil).toBeUndefined();
    expect(well.player.wellbeing.energy - flu.player.wellbeing.energy).toBeCloseTo(30, 9);
    expect(well.player.wellbeing.condition - flu.player.wellbeing.condition).toBeCloseTo(25, 9);
    expect(howYouAre(well).bars.Energy!.shows - howYouAre(flu).bars.Energy!.shows).toBe(30);
    // Tuesday at seven, before classes, past the gate at 25 after the night: refused for the flu itself.
    for (const sim of [flu, well]) sim.advanceTo(FLU_WEEK + 22 * MS_HOUR);
    expect(flu.player.wellbeing.energy).toBeGreaterThanOrEqual(25);
    const was = { now: flu.now, w: dials(flu) };
    expect(lookAfter(flu, 'exercise').error).toBe('Not with the flu: rest until it passes.');
    expect({ now: flu.now, w: dials(flu) }).toEqual(was);
    expect(lookAfter(reload(flu), 'exercise').error).toBe('Not with the flu: rest until it passes.');
    expect(lookAfter(well, 'exercise').ok).toBe(true);
  });

  it('readiness reads it: the first classes build the scene craft by the readiness energy 30 and 90 give', () => {
    expect(classesRead('energy', 30, 90)).toBeGreaterThan(1.2);
  });
});

// ---------------------------------------------------------------------------
// condition
// ---------------------------------------------------------------------------

const WELL_ENOUGH = 'You’re well enough to go: staying away would be an unexcused absence.';
let nights: { short: string; full: string } | undefined;
/**
 * PLAYER JOURNEY: twins of a new life, to bed at eleven every night through Sleep from Monday 24 August, one for five
 * hours and one for eight, twenty-one nights, to seven on Monday 14 September; nothing set. On Friday 11 September, a
 * class day, the short sleeper is worn but still over 55, and refused a sick day as the twin is. Played once and kept.
 */
function shortNights(): { short: Simulation; full: Simulation } {
  if (!nights) {
    const lives = { short: student('g06-short'), full: student('g06-short') };
    const nightsFrom = (sim: Simulation, hours: number, first: number, last: number) => {
      for (let day = first; day <= last; day += 1) {
        sim.advanceTo(nh(8, day, 23));
        const night = sleep(sim, hours);
        expect(night.ok, `${hours} hours, the night of the ${day}th: ${night.error}`).toBe(true);
      }
    };
    for (const [which, sim] of Object.entries(lives)) {
      const hours = which === 'short' ? 5 : 8;
      // 24 August to the night of 10 September (the 41st of August, counted on).
      nightsFrom(sim, hours, 24, 41);
      sim.advanceTo(nh(9, 11, 7));
      expect(sim.player.wellbeing.condition).toBeGreaterThanOrEqual(55);
      expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).error).toBe(WELL_ENOUGH);
      nightsFrom(sim, hours, 42, 44);
      sim.advanceTo(nh(9, 14, 7));
    }
    nights = { short: serialise(lives.short.universe), full: serialise(lives.full.universe) };
  }
  return { short: loadSave(deserialise(nights.short) as never), full: loadSave(deserialise(nights.full) as never) };
}

describe('condition', () => {
  it('the Condition look gives the sick-day line to a student the school excuses, at a condition under 55 that rounds to 55', () => {
    const { short } = shortNights();
    const condition = short.player.wellbeing.condition;
    expect(condition).toBeLessThan(55);
    expect(condition).toBeGreaterThanOrEqual(54.5);
    // The school reads the condition itself (`sickRefusal`, school.ts 170): under 55, the sick day is excused.
    expect(reload(short).execute({ kind: 'school.call_in_sick', payload: {} }).ok).toBe(true);
    // The look says what the dial decides; until 2026-10-13 it read the figure rounded to show it (wellbeing.tsx 288),
    // and said nothing; fixed that day.
    expect(dial(short, 'condition').says).toContain(' Under 55, a day off classes called in sick is excused. ');
  });

  it('PLAYER JOURNEY: five-hour nights chosen through Sleep take a new life under 55 by Monday 14 September, where a sick day is excused and counted; a twin on eight-hour nights is refused “You’re well enough to go”', () => {
    const { short, full } = shortNights();
    expect(short.player.wellbeing.condition).toBeLessThan(55);
    expect(full.player.wellbeing.condition).toBeGreaterThan(95);
    const tally = (sim: Simulation) => ({ ...sim.player.school!.tally });
    const [ts, tf] = [tally(short), tally(full)];
    expect(short.execute({ kind: 'school.call_in_sick', payload: {} }).ok).toBe(true);
    expect(full.execute({ kind: 'school.call_in_sick', payload: {} }).error).toBe(WELL_ENOUGH);
    expect(dial(full, 'condition').says).not.toContain('Under 55');
    const again = reload(short);
    expect(again.execute({ kind: 'school.call_in_sick', payload: {} }).error).toBe('You’ve called in sick today already.');
    for (const sim of [short, full, again]) sim.advanceTo(nh(9, 14, 18));
    expect(short.player.school!.tally.excused - ts.excused).toBe(1);
    expect(again.player.school!.tally.excused - ts.excused).toBe(1);
    expect(full.player.school!.tally.excused - tf.excused).toBe(0);
    expect(full.player.school!.tally.attended - tf.attended).toBe(1);
  });

  it('a worn body gets 0.9 of a night’s energy at half what rest can mend it to, and its morale settles 45 × 47/99.8 of the night’s pull lower; the look says 90%', () => {
    const base = lifeAt('g06-worn', nh(8, 24, 23));
    const [sound, worn] = [reload(base), reload(base)];
    for (const sim of [sound, worn]) sim.player.wellbeing.fitness = 40; // TEST SETUP: rest mends this body to 70 + 0.6 × 40 = 94
    sound.player.wellbeing.condition = 94; // TEST SETUP
    worn.player.wellbeing.condition = 47; // TEST SETUP
    expect(dial(worn, 'condition').says).toBe('47, under the 94 your fitness lets rest mend you to. A night puts back 90% of the energy it would, and each midnight settles it a little toward 94. Under 55, a day off classes called in sick is excused. The lower it is, the likelier a year is to be your last.');
    const before = { sound: dials(sound), worn: dials(worn) };
    const a = sleep(sound, 5);
    const b = sleep(worn, 5);
    expect(a.value!.quality).toBe(b.value!.quality);
    expect(b.value!.recovered / a.value!.recovered).toBeCloseTo(0.9, 9);
    // Morale settles 40 + 45 of condition over the age's 99.8, pulled 0.35 of the way for eight hours, 5/8 of that for five.
    const pull = 0.35 * (5 / 8);
    expect(before.sound.morale).toBe(before.worn.morale);
    expect(sound.player.wellbeing.morale - worn.player.wellbeing.morale).toBeCloseTo(45 * ((94 - 47) / CEILING.condition) * pull, 9);
  });

  it('a stay drawn by the health week moves the body a band and that midnight draws the year’s end again; while the band holds the end stands, and when the mending body leaves it the end is canceled', () => {
    // TEST SETUP: the year's end, drawn at the first midnight after the week, forced to come halfway to the birthday
    // (Monday 14 June 2027 at nine, born 14 June 2002).
    const midnight = nh(9, 1, 0);
    const birthday = nh(6 + 12, 14, 9);
    const { ill, well } = weekTwins(SUMMER_WEEK, { ill: WEEK.stay, well: WEEK.nothing });
    forcing(ill)('life.end', [ill.player.id, String(midnight)], [0, 0.5]);
    forcing(well)('life.end', [well.player.id, String(midnight)], [0, 0.5]);
    /** The band as the rule gives it: frailty 0.8 + 2.2 × (1 − condition / 99.8)^1.5, to the nearest quarter. */
    const band = (c: number) => Math.round((0.8 + 2.2 * Math.max(0, 1 - c / CEILING.condition) ** 1.5) / 0.25) * 0.25;
    const ends = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === END_KIND && i.payload.personId === sim.player.id);
    expect(ends(ill)).toEqual([]);
    const was = healthOf(ill.player).endBand;
    expect(was).toBe(band(well.player.wellbeing.condition));
    for (const sim of [ill, well]) sim.advanceTo(midnight + 7 * MS_HOUR);
    const moved = healthOf(ill.player).endBand!;
    expect(moved).toBe(band(ill.player.wellbeing.condition));
    expect(moved).toBeGreaterThan(was!);
    expect(healthOf(well.player).endBand).toBe(was);
    const drawn = ends(ill);
    expect(drawn.map((i) => [i.status, i.at])).toEqual([['pending', midnight + Math.floor(0.5 * (birthday - midnight))]]);
    // The twin's body didn't move a band, so its midnight drew nothing, forced or not.
    expect(ends(well)).toEqual([]);
    // Mending by the clock: each midnight the band is read again, and the end stands while it holds.
    let day = 2;
    while (healthOf(ill.player).endBand === moved && day < 30) {
      expect(drawn[0]!.status).toBe('pending');
      ill.advanceTo(nh(9, day, 7));
      day += 1;
    }
    expect(healthOf(ill.player).endBand).toBeLessThan(moved);
    expect(ill.universe.scheduled.find((i) => i.id === drawn[0]!.id)!.status).toBe('cancelled');
    expect(ends(ill).filter((i) => i.status === 'pending')).toEqual([]);
  });

  it('readiness reads it: the first classes build the scene craft by the readiness condition 50 and 99 give', () => {
    expect(classesRead('condition', 50, 99)).toBeGreaterThan(1.1);
  });
});

// ---------------------------------------------------------------------------
// fitness
// ---------------------------------------------------------------------------

describe('fitness', () => {
  it('a workout costs 13 energy at fitness 20 and 7 at 80, on top of the hour’s 3, as the Fitness look says beforehand', () => {
    const [low, high] = [student('g06-fit'), student('g06-fit')];
    low.player.wellbeing.fitness = 20; // TEST SETUP
    high.player.wellbeing.fitness = 80; // TEST SETUP
    expect(dial(low, 'fitness').says).toBe('20. Rest can mend you to 82, and a workout costs 13 energy. This is what an everyday life keeps without training. At 24, the most a body can be trained to is 99. The body is at its best and stays there.');
    expect(dial(high, 'fitness').says).toBe('80. Rest can mend you to 100, and a workout costs 7 energy. At 24, the most a body can be trained to is 99. The body is at its best and stays there.');
    const a = lookAfter(low, 'exercise');
    const b = lookAfter(high, 'exercise');
    expect(a.value!.changed.energy).toBeCloseTo(-13, 9);
    expect(b.value!.changed.energy).toBeCloseTo(-7, 9);
    expect(low.player.wellbeing.energy).toBeCloseTo(82 - 3 - 13, 9);
    expect(high.player.wellbeing.energy).toBeCloseTo(82 - 3 - 7, 9);
  });

  it('rest mends an untrained body no further than 91, seventy and 0.6 of fitness 35, where a fit one goes on mending', () => {
    const base = lifeAt('g06-mend', nh(8, 24, 23));
    const [unfit, fit] = [reload(base), reload(base)];
    unfit.player.wellbeing.fitness = 35; // TEST SETUP
    fit.player.wellbeing.fitness = 80; // TEST SETUP
    for (const sim of [unfit, fit]) sim.player.wellbeing.condition = 90.5; // TEST SETUP
    const a = sleep(unfit, 9);
    const b = sleep(fit, 9);
    expect(a.value!.quality).toBe(b.value!.quality);
    // Midnight in the night pulls 2% toward what rest mends to; the wake mends 0.9 × 0.995 a restful hour past five,
    // no further than that mark: 91 for the untrained body, the age's 99.8 for the fit one.
    const restful = 9 * a.value!.quality - 5;
    expect(unfit.player.wellbeing.condition).toBeCloseTo(91, 9);
    expect(fit.player.wellbeing.condition).toBeCloseTo(90.5 + (CEILING.condition - 90.5) * 0.02 + restful * 0.9 * BANKED, 9);
    expect(fit.player.wellbeing.condition).toBeGreaterThan(91.5);
  });

  it('a sprain the workout’s own draw brings refuses the next, “Not with a sprained ankle; it has 5 days yet to mend.”, the save as it was; on its last morning “1 day”, and taken once it has mended', () => {
    const { hurt } = sprained('g06-sprain');
    const was = { now: hurt.now, w: dials(hurt), injury: { ...healthOf(hurt.player).injury! } };
    expect(lookAfter(hurt, 'exercise').error).toBe('Not with a sprained ankle; it has 5 days yet to mend.');
    expect({ now: hurt.now, w: dials(hurt), injury: { ...healthOf(hurt.player).injury! } }).toEqual(was);
    expect(lookAfter(reload(hurt), 'exercise').error).toBe('Not with a sprained ankle; it has 5 days yet to mend.');
    hurt.advanceTo(nh(8, 29, 8));
    expect(lookAfter(hurt, 'exercise').error).toBe('Not with a sprained ankle; it has 1 day yet to mend.');
    hurt.advanceTo(nh(8, 29, 9));
    expect(lookAfter(hurt, 'exercise').ok).toBe(true);
  });

  it('PLAYER JOURNEY: a New Haven workout holds fitness through three midnights and then it falls 0.18 a day, where the untrained twin falls every one', () => {
    const [trained, idle] = [student('g06-held'), student('g06-held')];
    expect(lookAfter(trained, 'exercise').ok).toBe(true);
    const built = trained.player.wellbeing.fitness;
    expect(built).toBeGreaterThan(50);
    const read = (sim: Simulation, day: number) => { sim.advanceTo(nh(8, day, 12)); return sim.player.wellbeing.fitness; };
    // The workout ended at 8:30 on the 24th: the midnights of the 25th, 26th and 27th are within three days of it.
    for (const day of [25, 26, 27]) expect(read(trained, day)).toBe(built);
    expect(read(trained, 28)).toBeCloseTo(built - 0.18, 9);
    expect(read(trained, 29)).toBeCloseTo(built - 0.36, 9);
    for (const day of [25, 26, 27, 28, 29]) expect(read(idle, day)).toBeCloseTo(50 - 0.18 * (day - 24), 9);
  });

  it('Stamina is read by the scene shown in class, a piece in its units: at 35 every dimension tiredness reaches is lower than at 99.4, the age’s full, consistency among them, and interpretation, which it doesn’t reach, the same', () => {
    const morning = nh(9, 8, 7, 30);
    const [unfit, fit] = [lifeAt('g06-class', morning), lifeAt('g06-class', morning)];
    unfit.player.wellbeing.fitness = 35; // TEST SETUP
    fit.player.wellbeing.fitness = CEILING.fitness; // TEST SETUP
    for (const sim of [unfit, fit]) sim.advanceTo(nh(9, 8, 12));
    const shown = (sim: Simulation) => sim.player.work!.filter((w) => w.task === 'scene' && w.inputs.key.endsWith(':2026-09-08'));
    expect(shown(fit)).toHaveLength(1);
    expect(shown(unfit)).toHaveLength(1);
    const t = shown(fit)[0]!;
    const i = shown(unfit)[0]!;
    expect(t.inputs.abilities.stamina).toBe(CEILING.fitness);
    expect(i.inputs.abilities.stamina).toBe(35);
    expect(t.inputs.fulls!.stamina).toBe(CEILING.fitness);
    expect(t.inputs.abilities.composure).toBe(i.inputs.abilities.composure);
    expect(t.inputs.abilities.discipline).toBe(i.inputs.abilities.discipline);
    expect(t.inputs.condition).toEqual(i.inputs.condition);
    // A piece in segments reads stamina through its drain (`systems/piece.ts`): nothing in the first, and in each after it
    // 0.4 (0.3 until later on 2026-10-16) × the piece's load × its place × (1 − stamina over its full), on each dimension
    // tiredness reaches (`conditions` in content/tasks.ts: all of a scene's but interpretation). Full, it drains nothing.
    // From evaluation-10 the scene is its units, its one tone cut at its two turns, three; until then it was its two halves.
    expect(t.inputs.piece!.segments.map((s: { label: string }) => s.label)).toEqual(['The Opening', 'The Middle', 'The Close']);
    for (const d of ['believability', 'connection', 'execution', 'consistency', 'responsiveness'] as const) expect(t.dims[d]!, d).toBeGreaterThan(i.dims[d]!);
    expect(t.dims.interpretation).toBe(i.dims.interpretation);
  });
});

/**
 * PLAYER JOURNEY with TEST SETUP: twins of a new life at 7:30 on its first morning, stress at 50 in both so neither
 * reaches the floor; both work out through the command, and in one the workout's own injury draw is forced (a hurt,
 * then a sprain from a run's or a gym's mix, five days to mend).
 */
function sprained(seed: string): { hurt: Simulation; twin: Simulation } {
  const [hurt, twin] = [lifeAt(seed, START), lifeAt(seed, START)];
  for (const sim of [hurt, twin]) sim.player.wellbeing.stress = 50; // TEST SETUP
  const force = forcing(hurt);
  const ends = START + MS_HOUR;
  force('health.injury', [hurt.player.id, `run-${ends}`], [0, 0.7, 0]); // TEST SETUP: a run's mix, strain 0.5 then sprain 0.4
  force('health.injury', [hurt.player.id, `gym-${ends}`], [0, 0.95, 0]); // TEST SETUP: a gym's, strain 0.5, back 0.4, then sprain
  for (const sim of [hurt, twin]) expect(lookAfter(sim, 'exercise').ok).toBe(true);
  expect(healthOf(hurt.player).injury).toMatchObject({ kind: 'sprain', at: ends, until: ends + 5 * MS_DAY });
  expect(healthOf(twin.player).injury).toBeUndefined();
  return { hurt, twin };
}

// ---------------------------------------------------------------------------
// nourishment
// ---------------------------------------------------------------------------

describe('nourishment', () => {
  it('PLAYER JOURNEY: both cards locked, the groceries go unbought at midnight and the morning starts at exactly 40; from five the hungry hours cost 0.5 condition and 0.7 morale an hour against a fed twin; unlocked, a meal is paid and eaten', () => {
    const [locked, fed] = [student('g06-hungry'), student('g06-hungry')];
    for (const which of ['debit', 'credit']) expect(locked.execute({ kind: 'card.lock', payload: { which, locked: true } }).ok).toBe(true);
    for (const sim of [locked, fed]) {
      sim.advanceTo(nh(8, 24, 22));
      // Sent through the night nobody chose, to seven: the day's food is bought, or not, at midnight.
      sim.advanceTo(nh(8, 25, 7));
    }
    expect(titled(locked, 'No Money For Food Today').map((n) => n.body)).toEqual([expect.stringContaining('Your debit card is locked, and there isn’t enough on the credit card or in cash.')]);
    expect(titled(fed, 'No Money For Food Today')).toEqual([]);
    expect(locked.player.wellbeing.nourishment).toBe(40);
    expect(fed.player.wellbeing.nourishment).toBe(76);
    const morning = { locked: dials(locked), fed: dials(fed) };
    expect(morning.locked.condition).toBe(morning.fed.condition);
    expect(morning.locked.morale).toBe(morning.fed.morale);
    expect(lookAfter(locked, 'eat').error).toBe('Your debit card is locked, and there isn’t enough on the credit card or in cash.');

    // Kept up by the hour to eight in the evening: two an hour from 40 is twenty at five, and hungry from there.
    for (const sim of [locked, fed]) byTheHour(sim, nh(8, 25, 20));
    expect(locked.player.wellbeing.nourishment).toBeCloseTo(40 - 2 * 13, 9);
    expect(fed.player.wellbeing.nourishment).toBeCloseTo(76 - 2 * 13, 9);
    expect(fed.player.wellbeing.condition - locked.player.wellbeing.condition).toBeCloseTo(0.5 * 3, 9);
    expect(fed.player.wellbeing.morale - locked.player.wellbeing.morale).toBeCloseTo(0.7 * 3, 9);
    expect(howYouAre(locked).text).toContain('Hungry, and it’s starting to show.');
    expect(dial(locked, 'nourishment').says).toBe('14. Hungry, and it’s costing condition and mood by the hour. Each morning the day’s meals take it to 76 at least, or to 40 on a day the food can’t be paid for.');

    expect(locked.execute({ kind: 'card.lock', payload: { which: 'debit', locked: false } }).ok).toBe(true);
    const meal = lookAfter(locked, 'eat');
    expect(meal.ok).toBe(true);
    expect(meal.value!.changed.nourishment).toBeCloseTo(50, 9);
    expect(memos(locked, 'A meal')).toHaveLength(1);
  });

  it('a meal sent twice with one actionId is eaten and paid once, “That was already done.”, across a reload; and so is an order', () => {
    const sim = student('g06-retry');
    sim.player.wellbeing.nourishment = 30; // TEST SETUP
    const first = lookAfter(sim, 'eat', 'meal-1');
    expect(first.ok).toBe(true);
    // Forty minutes at two an hour, then the meal's fifty.
    expect(sim.player.wellbeing.nourishment).toBeCloseTo(30 - 2 * (40 / 60) + 50, 9);
    const was = { now: sim.now, w: dials(sim), paid: memos(sim, 'A meal').length };
    expect(lookAfter(sim, 'eat', 'meal-1').error).toBe('That was already done.');
    expect({ now: sim.now, w: dials(sim), paid: memos(sim, 'A meal').length }).toEqual({ ...was, paid: 1 });
    const again = reload(sim);
    expect(lookAfter(again, 'eat', 'meal-1').error).toBe('That was already done.');
    expect(memos(again, 'A meal')).toHaveLength(1);

    again.player.wellbeing.nourishment = 30; // TEST SETUP
    expect(lookAfter(again, 'order', 'order-1').ok).toBe(true);
    const ordered = { now: again.now, n: again.player.wellbeing.nourishment };
    expect(lookAfter(again, 'order', 'order-1').error).toBe('That was already done.');
    expect(lookAfter(reload(again), 'order', 'order-1').error).toBe('That was already done.');
    expect({ now: again.now, n: again.player.wellbeing.nourishment }).toEqual(ordered);
    expect(memos(again, 'A meal delivered')).toHaveLength(1);
  });

  it('readiness reads it: the first classes build the scene craft by the readiness nourishment 15 and 95 give', () => {
    expect(classesRead('nourishment', 15, 95)).toBeGreaterThan(1.1);
  });
});

// ---------------------------------------------------------------------------
// hygiene
// ---------------------------------------------------------------------------

describe('hygiene', () => {
  it('PLAYER JOURNEY: a workout at eight takes a student under fifty by half past two, and the hours under it wear 0.4 of morale an hour against a twin who showered at nine; a shower at six puts it back to 100 and eases stress a tenth of that', () => {
    const base = student('g06-grime');
    base.advanceTo(nh(8, 24, 23));
    expect(sleep(base, 8).ok).toBe(true);
    expect(base.now).toBe(nh(8, 25, 7));
    // The midnight in the night floored it at 82.
    expect(base.player.wellbeing.hygiene).toBe(82);
    base.player.wellbeing.stress = 40; // TEST SETUP: stress enough that what a shower eases shows
    const [grimy, clean] = [reload(base), reload(base)];
    for (const sim of [grimy, clean]) {
      byTheHour(sim, nh(8, 25, 8));
      expect(lookAfter(sim, 'exercise').ok).toBe(true);
      expect(healthOf(sim.player).injury).toBeUndefined();
    }
    // 1.6 an hour for two hours, and the workout's 20.
    expect(grimy.player.wellbeing.hygiene).toBeCloseTo(82 - 1.6 * 2 - 20, 9);
    const shower = lookAfter(clean, 'wash');
    expect(shower.ok).toBe(true);
    const washedOff = 100 - (58.8 - 1.6 / 3);
    expect(shower.value!.changed.hygiene).toBeCloseTo(washedOff, 9);
    expect(shower.value!.changed.stress).toBeCloseTo(-0.1 * washedOff, 9);
    for (const sim of [grimy, clean]) byTheHour(sim, nh(8, 25, 18));
    // Under fifty from (58.8 − 50) / 1.6 = 5.5 hours after nine: three and a half grimy hours by six.
    expect(grimy.player.wellbeing.hygiene).toBeCloseTo(58.8 - 1.6 * 9, 9);
    expect(clean.player.wellbeing.morale - grimy.player.wellbeing.morale).toBeCloseTo(0.4 * 3.5, 9);
    expect(dial(grimy, 'hygiene').says).toBe('44. Under fifty it wears on your mood by the hour. A shower puts it back. The morning’s shower takes it to 82 at least.');
    expect(dial(clean, 'hygiene').says).toBe('86. Clean enough that it isn’t wearing on you. The morning’s shower takes it to 82 at least.');
    const stressBefore = grimy.player.wellbeing.stress;
    const late = lookAfter(grimy, 'wash');
    expect(late.ok).toBe(true);
    const back = 100 - (58.8 - 1.6 * 9 - 1.6 / 3);
    expect(grimy.player.wellbeing.hygiene).toBe(100);
    expect(late.value!.changed.hygiene).toBeCloseTo(back, 9);
    expect(late.value!.changed.stress).toBeCloseTo(-0.1 * back, 9);
    expect(stressBefore - 0.35 / 3 - grimy.player.wellbeing.stress).toBeCloseTo(0.1 * back, 9);
  });

  it('as it stands: the midnight floors it at 82 for a body kept up through it and never showered, so a day’s grime doesn’t outlive the day', () => {
    const sim = student('g06-floor');
    byTheHour(sim, nh(8, 24, 23, 30));
    expect(sim.player.wellbeing.hygiene).toBeCloseTo(80 - 1.6 * 16, 9);
    byTheHour(sim, nh(8, 25, 0, 30));
    expect(sim.player.wellbeing.hygiene).toBeCloseTo(82 - 1.6 * 0.5, 9);
  });

  it('readiness reads it: the first classes build the scene craft by the readiness hygiene 20 and 100 give', () => {
    expect(classesRead('hygiene', 20, 100)).toBeGreaterThan(1.05);
  });
});

// ---------------------------------------------------------------------------
// stress
// ---------------------------------------------------------------------------

describe('stress', () => {
  it('a night at stress 70 is 0.144 poorer than at 10, as Sleep reports it, and puts back that much less energy', () => {
    const base = lifeAt('g06-night', nh(8, 24, 23));
    const [calm, tense] = [reload(base), reload(base)];
    calm.player.wellbeing.stress = 10; // TEST SETUP
    tense.player.wellbeing.stress = 70; // TEST SETUP
    const a = sleep(calm, 6);
    const b = sleep(tense, 6);
    expect(a.value!.quality).toBeCloseTo(0.82 - 0.024, 9);
    expect(b.value!.quality).toBeCloseTo(0.82 - 0.168, 9);
    expect(b.value!.recovered / a.value!.recovered).toBeCloseTo((0.82 - 0.168) / (0.82 - 0.024), 9);
  });

  it('a night nobody chose is 0.72 hours shorter at stress 70 than at 10: 7.8 less 0.012 an hour of stress', () => {
    const base = lifeAt('g06-night', nh(8, 24, 23));
    const [calm, tense] = [reload(base), reload(base)];
    calm.player.wellbeing.stress = 10; // TEST SETUP
    tense.player.wellbeing.stress = 70; // TEST SETUP
    for (const sim of [calm, tense]) sim.advanceTo(nh(8, 25, 10));
    // An hour to midnight clears 0.35 of it; the night starts at midnight and they're up when a sound sleeper would be.
    const midnight = nh(8, 25, 0);
    expect(Math.abs(calm.player.awakeSince! - (midnight + (7.8 - 0.012 * 9.65) * MS_HOUR))).toBeLessThanOrEqual(1);
    expect(Math.abs(tense.player.awakeSince! - (midnight + (7.8 - 0.012 * 69.65) * MS_HOUR))).toBeLessThanOrEqual(1);
    expect(Math.abs(calm.player.awakeSince! - tense.player.awakeSince! - 0.72 * MS_HOUR)).toBeLessThanOrEqual(1);
  });

  it('a sprain brings 6 at once and 1 more at each midnight while it mends, and none once it has', () => {
    const { hurt, twin } = sprained('g06-sprain');
    expect(hurt.player.wellbeing.stress - twin.player.wellbeing.stress).toBeCloseTo(6, 9);
    const jumps = midnightJumps(hurt, twin);
    expect(jumps.map((j) => j.stress)).toEqual([1, 1, 0].map((x) => expect.closeTo(x, 9)));
  });

  it('over 75 it costs condition 0.25 an hour: stress 90 against 50 for nine waking hours is 2.25 of condition, as Home and the Stress look show it', () => {
    const [high, low] = [lifeAt('g06-wrought', START), lifeAt('g06-wrought', START)];
    high.player.wellbeing.stress = 90; // TEST SETUP
    low.player.wellbeing.stress = 50; // TEST SETUP
    for (const sim of [high, low]) byTheHour(sim, START + 9 * MS_HOUR);
    // Clearing 0.35 an hour, still over 75 at the end: all nine hours overwrought.
    expect(high.player.wellbeing.stress).toBeCloseTo(90 - 0.35 * 9, 9);
    expect(low.player.wellbeing.condition - high.player.wellbeing.condition).toBeCloseTo(0.25 * 9, 9);
    expect(low.player.wellbeing.condition).toBe(88);
    expect(howYouAre(high).bars.Stress).toEqual({ shows: 87, tone: 'negative' });
    expect(howYouAre(low).bars.Stress).toEqual({ shows: 47, tone: 'positive' });
    expect(dial(high, 'stress').says).toBe('87. High enough that sleep is going badly and it feeds itself.');
  });

  it('it makes the week’s flu 1.8 times likelier: a draw at 1.5 times a calm body’s chance is the flu at stress 100 and nothing at 0', () => {
    const week = FLU_WEEK;
    const z = zonedParts(week, 'America/New_York');
    /** The week's chance for a rested, easy body: CDC's 8.9% a season, over this week's share of New Haven's flu. */
    const p = 1 - (1 - CARE.flu) ** fluByWeek('us-ct-newhaven')[weekOfYear(z.month, z.day)]!;
    expect(p).toBeGreaterThan(0);
    const caught = (stress: number) => {
      const sim = lifeAt('g06-week', week - MS_HOUR);
      const force = forcing(sim);
      force('health.illness', [sim.player.id, String(week)], [0.999, 0.999, 0.999, 1.5 * p, 0.999]);
      sim.advanceTo(week - 60_000);
      Object.assign(sim.player.wellbeing, { sleepDebt: 0, stress }); // TEST SETUP
      sim.advanceTo(week + 60_000);
      return healthOf(sim.player).fluUntil !== undefined;
    };
    expect([caught(100), caught(0)]).toEqual([true, false]);
  });

  it('money worry adds 4 at the midnight, and takes 2 of morale, for a current account overdrawn', () => {
    const [worried, easy] = [lifeAt('g06-worry', nh(8, 24, 22)), lifeAt('g06-worry', nh(8, 24, 22))];
    const current = worried.universe.accounts[worried.player.primaryAccountId!]!;
    const by = -current.balance - 100_00;
    worried.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: current.id, amount: by }, { accountId: worried.nominalAccount('expense', 'Test').id, amount: -by }] }); // TEST SETUP
    const [w, e] = [{ ...worried.player.wellbeing }, { ...easy.player.wellbeing }];
    for (const sim of [worried, easy]) byTheHour(sim, nh(8, 25, 0, 30));
    const jump = (sim: Simulation, from: Wellbeing) => ({ stress: sim.player.wellbeing.stress - from.stress, morale: sim.player.wellbeing.morale - from.morale });
    expect(jump(worried, w).stress - jump(easy, e).stress).toBeCloseTo(4, 9);
    expect(jump(worried, w).morale - jump(easy, e).morale).toBeCloseTo(-2, 9);
  });

  it('readiness reads it: the first classes build the scene craft by the readiness stress 80 and 10 give', () => {
    expect(classesRead('stress', 80, 10)).toBeGreaterThan(1.2);
  });
});

/**
 * Each midnight the sprain's twins meet, kept up by the hour through it, read a minute either side: what the hurt one
 * gained over the twin across it. The 25th and the 26th while it mends; the 30th after it has, on the 29th at 8:30.
 * Between them, a night chosen through Sleep and then the clock sent on, the same in both.
 */
function midnightJumps(hurt: Simulation, twin: Simulation): { stress: number; morale: number }[] {
  const out: { stress: number; morale: number }[] = [];
  for (const [month, day] of [[8, 25], [8, 26], [8, 30]] as const) {
    const midnight = nh(month, day, 0);
    for (const sim of [hurt, twin]) {
      if (sim.now < midnight - 2 * MS_HOUR) sim.advanceTo(midnight - 2 * MS_HOUR);
      byTheHour(sim, midnight - 60_000);
    }
    const before = [dials(hurt), dials(twin)];
    for (const sim of [hurt, twin]) byTheHour(sim, midnight + 60_000);
    const after = [dials(hurt), dials(twin)];
    out.push({
      stress: (after[0]!.stress - before[0]!.stress) - (after[1]!.stress - before[1]!.stress),
      morale: (after[0]!.morale - before[0]!.morale) - (after[1]!.morale - before[1]!.morale),
    });
    for (const sim of [hurt, twin]) {
      byTheHour(sim, midnight + 30 * 60_000);
      expect(sleep(sim, 8).ok).toBe(true);
    }
  }
  expect(healthOf(twin.player).injury).toBeUndefined();
  return out;
}

// ---------------------------------------------------------------------------
// morale
// ---------------------------------------------------------------------------

describe('morale', () => {
  it('a night clears 4.2 × hours × quality × 0.28 more of the day’s stress at morale 90 than at 20, as the Morale look says beforehand', () => {
    const base = lifeAt('g06-settle', nh(8, 24, 23));
    const [low, high] = [reload(base), reload(base)];
    for (const sim of [low, high]) sim.player.wellbeing.stress = 60; // TEST SETUP
    low.player.wellbeing.morale = 20; // TEST SETUP
    high.player.wellbeing.morale = 90; // TEST SETUP
    // The Morale look says it, before the night: where the nights bring it, 40 and 45 of condition over the age's 99.8.
    const settles = Math.round(40 + 45 * Math.min(1, low.player.wellbeing.condition / CEILING.condition));
    expect(dial(low, 'morale')).toEqual({ name: 'Morale', says: `20. Flat, and the nights bring it back toward ${settles}. Down like this, a night clears less of the day’s stress than usual.` });
    expect(dial(high, 'morale').says).toBe(`90. The day feels worth it, and the nights bring it back toward ${settles}. Up like this, a night clears more of the day’s stress than usual.`);
    const a = sleep(low, 8);
    const b = sleep(high, 8);
    const quality = 0.82 - 0.0024 * 60;
    expect(a.value!.quality).toBeCloseTo(quality, 9);
    expect(b.value!.quality).toBeCloseTo(quality, 9);
    // A quarter less at nought and a sixth more at a hundred: 0.83 at twenty, 1.11 at ninety.
    expect(low.player.wellbeing.stress - high.player.wellbeing.stress).toBeCloseTo(4.2 * 8 * quality * (1.11 - 0.83), 9);
    expect(high.player.wellbeing.stress).toBeCloseTo(60 - 4.2 * 8 * quality * 1.11, 9);
  });

  it('a meal needed lifts it 2, fifty eaten at 0.04; one on a fuller stomach by what it puts back', () => {
    const [hungry, full] = [lifeAt('g06-meal', START), lifeAt('g06-meal', START)];
    hungry.player.wellbeing.nourishment = 30; // TEST SETUP
    full.player.wellbeing.nourishment = 80; // TEST SETUP
    const a = lookAfter(hungry, 'eat');
    const b = lookAfter(full, 'eat');
    expect(a.value!.changed.morale).toBeCloseTo(50 * 0.04, 9);
    expect(b.value!.changed.morale).toBeCloseTo((100 - (80 - 2 * (40 / 60))) * 0.04, 9);
  });

  it('a sprain takes 4 at once and a point at each midnight while it mends, and none once it has', () => {
    const { hurt, twin } = sprained('g06-sprain');
    expect(twin.player.wellbeing.morale - hurt.player.wellbeing.morale).toBeCloseTo(4, 9);
    const jumps = midnightJumps(hurt, twin);
    expect(jumps.map((j) => j.morale)).toEqual([-1, -1, 0].map((x) => expect.closeTo(x, 9)));
  });

  it('readiness reads it: the first classes build the scene craft by the readiness morale 20 and 90 give', () => {
    expect(classesRead('morale', 20, 90)).toBeGreaterThan(1.15);
  });
});
