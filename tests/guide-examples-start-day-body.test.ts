/**
 * The guide's worked examples for getting started, the day and the clock, and looking after yourself, played (from
 * 2026-10-12; `src/engine/content/guide/start.ts`, `day.ts`, `body.ts`).
 *
 * The connected-journey map (docs/verification/CONNECTED-JOURNEY-MAP-2026-10-12.md §5) promised that every worked
 * example runs on a throwaway save that's never handed to an adapter, and that its figures are checked; nothing did
 * until this file. Each example is played here on a new life of its own (`createSave`), through the commands its steps
 * name, and the figures its rendered text states are read back out of that text (`GUIDE_BY_ID`) and set against what
 * the engine then holds. A rule's constant moved changes the words and the play together; a play that drifts from the
 * words, or a typed figure that drifts from the play, fails here.
 *
 * The clock is moved as the top bar moves it (`advanceTo` in `app/game-context.tsx`): every jump stops at what wants
 * the player and pauses there, and Go carries on the same jump through the commitment's own hours
 * (`TimeControls.tsx`). That's `jump` and `go` below. The pause at a stop is the provider's (`halt`), not the engine's,
 * so it's replayed here through the same command the provider sends. The live clock is replayed the same way: a
 * second of real time fed to the stepper the provider ticks (`createClockStepper`), each step through `advanceBy`. The
 * injury rolls are read on their way through `mayHurt`, which is called unchanged (`rolls`).
 *
 * TEST SETUP, said again where it's made:
 * - What Needs You's two unread notices: the older ones marked read through `world.mark_read`'s own ids, which the panel
 *   never sends. Five months of a life leave far more than two.
 *
 * Played: eleven of the twelve. Not run, and why:
 * - `start.find`, Finding Your Way: its example is the interface's alone, and the save holds none of it. H is a key
 *   the provider listens for (`app/game-context.tsx`); the breadcrumbs are the provider's React state, and the screen's
 *   address the browser's history; the tab a screen was left on is kept in memory for the session (`ui/kept.ts`, by
 *   `tabKey` in `ui/shell/sections.ts`). There's nothing in the engine to play, and these tests run with no page to
 *   drive (`environment: 'node'`, `vitest.config.ts`). Until later on 2026-10-12 this said all three were kept in the
 *   browser's storage, which none of them is: the app's own storage there is the saves, the favorites and a
 *   character-creation draft.
 *
 * Played on 2026-10-12, no example's figure was wrong against the engine, and no example's text changed.
 *
 * Found on the way, outside these files, and fixed later the same day (`drawnBody`, `tests/body-first-day.test.ts`):
 * until then a new life made without a height and a weight had no body on record until its first midnight (`bodyOf` runs at the rollover; `createUniverse` settles one only for a body given), so a workout on
 * its first day burned calories nobody counted (`exerts` returned with no body). Measured on this file's seed: a workout at
 * 7:30 on the first morning left `person.body` undefined. The weather example was played on the second morning for that
 * reason, and still is: it says nothing about which morning.
 *
 * And the examples leave a live save alone: one written out (`serialise`) before all of them are played beside it is
 * the same to the byte after.
 */

import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { createSave, type Simulation } from '@/engine';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at, type Subject } from '@/ui/looks/subject';
import { serialise } from '@/engine/persistence/adapter';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { CHAPTERS } from '@/engine/content/tutorial';
import { BODY } from '@/engine/content/body';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import type { ScheduledItem } from '@/engine/core/scheduler';
import { addDays, formatDate, formatDuration, formatTime, instantFromZoned, startOfDay, zonedParts, MS_HOUR, MS_MINUTE } from '@/engine/core/time';
import { titleCaseLabel } from '@/engine/core/text';
import { formatMoney } from '@/engine/core/money';
import { createClockStepper } from '@/engine/core/realclock';
import {
  ENERGY_DRAIN_PER_HOUR, FINE, LOOKING_AFTER, NOURISHMENT_DRAIN_PER_HOUR, TRAINING,
  lookAfterOptions, readiness, suggestedSleep, trainingAt, workoutBuilds, workoutCosts,
} from '@/engine/systems/life';
import { heatIndexC, weatherAt } from '@/engine/systems/weather';
import { CLASSES_KIND } from '@/engine/systems/school';
import { ORIENTATION_2026 } from '@/engine/content/school';
import { courseworkOf } from '@/engine/systems/coursework';
import { returnsOf } from '@/engine/systems/taxreturn';
import { missedBy } from '@/engine/world/calendar';
import { PLAN_KIND, PLAN_LENGTHS } from '@/engine/world/plans';
import { READ_KIND, chapterFor, isOpen, lockedBecause, nextChapter } from '@/engine/world/tutorial';
import { lifeSnapshot, openDecisions, unreadNotifications } from '@/engine/world/world';
import { placeProfile } from '@/engine/world/place';

/**
 * Each injury roll the engine makes, recorded on its way through: `mayHurt` itself, called through unchanged, so what
 * the weather example says of a run's chance against a gym's is read off the chance the engine rolled.
 */
const rolls = vi.hoisted(() => [] as { source: string; chance: number }[]);
vi.mock('@/engine/systems/injury', async (original) => {
  const real = await original<typeof import('@/engine/systems/injury')>();
  return {
    ...real,
    mayHurt: (...args: Parameters<typeof real.mayHurt>) => { rolls.push({ source: args[2], chance: args[3] }); return real.mayHurt(...args); },
  };
});

const SEED = 'guide-examples-start-day-body';
/** The mornings the weather example looks through for one whose workout hour is no good for a run. */
const INDOORS_WITHIN_DAYS = 30;

/** A new life at Yale, born in New York, as the guide's examples have one: a fresh save, never handed to an adapter. */
const life = (seed = SEED, extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });

const example = (id: string) => GUIDE_BY_ID[id]!.example;

type Groups = [string, string, string, string, string, string, string, string, string, string];
/** The groups a pattern finds in an example's text, up to ten; fails, naming both, when it finds none. */
function read(text: string, pattern: RegExp): Groups {
  const m = text.match(pattern);
  expect(m, `${pattern} in “${text}”`).not.toBeNull();
  return Array.from({ length: 10 }, (_, i) => m?.[i + 1] ?? '') as Groups;
}

/** A figure the text states, matched by the engine's own to the places the text gives it. */
function asStated(actual: number, stated: string): void {
  const places = (stated.split('.')[1] ?? '').length;
  expect(actual.toFixed(places), `stated ${stated}`).toBe(stated.replace('−', '-'));
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WORDS: Readonly<Record<string, number>> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const word = (w: string): number => { const n = WORDS[w.toLowerCase()]; expect(n, w).toBeDefined(); return n!; };

/** An hour of today, on the town's clock: what the Advance menu's lines are built from. */
function todayAt(sim: Simulation, hour: number, minute = 0): number {
  const t = zonedParts(sim.now, sim.zone);
  return instantFromZoned({ year: t.year, month: t.month, day: t.day, hour, minute, second: 0 }, sim.zone);
}
/** Advance's Tomorrow Morning: seven, a date on (`AdvanceMenu`). */
const tomorrowMorning = (sim: Simulation): number => addDays(todayAt(sim, 7), 1, sim.zone);

/** Go, at a stop: through the commitment's hours, on to where the jump was headed if that's later, as the same jump. */
const go = (sim: Simulation, item: ScheduledItem, wanted: number, sentFrom: number) =>
  sim.advanceTo(Math.max(wanted, item.at + (item.durationMinutes ?? 0) * MS_MINUTE), { stopOnPlayerRequired: true, resumes: sentFrom });

/** A jump from the top bar to `wanted`, paused at each stop as the provider pauses it and carried on with Go. */
function jump(sim: Simulation, wanted: number): ScheduledItem[] {
  const stops: ScheduledItem[] = [];
  let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
  while (r.interruptedBy) {
    stops.push(r.interruptedBy);
    sim.must({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } });
    r = go(sim, r.interruptedBy, wanted, r.sentFrom);
  }
  return stops;
}

/** What a name opens into; fails if it's gone or isn't a look. */
function look(sim: Simulation, subject: Subject): Looked {
  const found = resolveLook(sim, subject);
  expect(found && !('gone' in found), `${subject.kind}:${subject.id}`).toBe(true);
  return found as Looked;
}

/** A Stat's value in a look's body, by its label. */
function statOf(node: ReactNode, label: string): unknown {
  if (node === null || node === undefined || typeof node !== 'object') return undefined;
  if (Array.isArray(node)) {
    for (const one of node) { const v = statOf(one, label); if (v !== undefined) return v; }
    return undefined;
  }
  const props = (node as { props?: { label?: unknown; value?: unknown; children?: ReactNode } }).props;
  if (!props) return undefined;
  if (props.label === label && 'value' in props) return props.value;
  return statOf(props.children, label);
}

const dials = (sim: Simulation) => ({ ...sim.player.wellbeing, readiness: readiness(sim.player) });

// ---------------------------------------------------------------------------
// The plays. Each makes its own save and returns what the engine then holds.
// ---------------------------------------------------------------------------

function playHome() {
  const { setup, steps } = example('start.home');
  const [town, month] = read(setup, /in (.+), on an? (\w+) evening\./);
  const [pressed] = read(steps[1]!, /^Press (.+) in Where You Are\.$/);
  const [regionName, countryName] = read(steps[2]!, /press (.+), then (.+)\.$/);
  const sim = life();
  // This Evening, from the first morning: Registration on the way, gone to.
  const stops = jump(sim, todayAt(sim, 18));
  const before = serialise(sim.universe);
  // What Where You Are prints, as Home builds it: the snapshot's town, profiled (`ui/screens/Home.tsx`).
  const where = placeProfile(sim, lifeSnapshot(sim).city!.id)!;
  const place = look(sim, at('place', sim.player.currentLocationId));
  const region = look(sim, place.ways!.find((w) => w.label === regionName)!.to);
  const country = look(sim, region.ways!.find((w) => w.label === countryName)!.to);
  return { sim, town, month, pressed, regionName, countryName, stops, where, place, region, country, before, after: serialise(sim.universe) };
}

function playGuide() {
  const { setup, steps } = example('start.guide');
  const [howMany] = read(setup, /^A guided life, (\w+) chapters read/);
  const [opensAt, comesFirst] = read(steps[1]!, /the guide opens at “(.+?)”, and says “(.+?)” comes first/);
  const sim = life(SEED, { tutorial: true });
  const startedAt = sim.now;
  for (const chapter of CHAPTERS.slice(0, word(howMany))) sim.must({ kind: READ_KIND, payload: { chapterId: chapter.id } });
  const locked = { open: isOpen(sim, 'ui.look-after'), why: lockedBecause(sim, 'ui.look-after'), chapter: chapterFor('ui.look-after'), next: nextChapter(sim), refused: sim.guardedBecause({ kind: 'life.look_after', payload: { action: 'eat' } }) };
  // Read in order to it, I've Read It on each.
  for (const chapter of CHAPTERS) {
    if (sim.universe.tutorial!.read.includes(chapter.id)) continue;
    sim.must({ kind: READ_KIND, payload: { chapterId: chapter.id } });
    if (chapter.id === locked.chapter?.id) break;
  }
  return { sim, howMany, opensAt, comesFirst, startedAt, locked };
}

function playCalendar() {
  const sim = life();
  const startedAt = sim.now;
  const first = sim.timeline.next(sim.now, (i) => i.requiresPlayer === true)!;
  const wanted = tomorrowMorning(sim);
  const onTheWay = missedBy(sim, wanted);
  const r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
  const stop = r.interruptedBy!;
  const stoppedAt = sim.now;
  sim.must({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } });
  const after = go(sim, stop, wanted, r.sentFrom);
  // What they had at midnight: the same day on a save of its own, Registration gone to, then kept up to it.
  const kept = life();
  jump(kept, todayAt(kept, 18));
  keptUp(kept, startOfDay(wanted, kept.zone));
  return { sim, startedAt, first, wanted, onTheWay, stop, stoppedAt, after, atMidnight: kept.player.wellbeing.energy };
}

/** The clock moved on to `until` with One Hour at a time, an hour or less a step, so no night is slept on the way. */
function keptUp(sim: Simulation, until: number): void {
  for (let t = sim.now + MS_HOUR; sim.now < until; t += MS_HOUR) sim.advanceTo(Math.min(t, until), { stopOnPlayerRequired: true });
}

/** An hour of the day as the guide writes it, “8:30 AM”, on the 24-hour clock. */
function clockOf(said: string): { hour: number; minute: number } {
  const [h, m, half] = read(said, /^(\d+):(\d+) ([AP]M)$/);
  return { hour: (Number(h) % 12) + (half === 'PM' ? 12 : 0), minute: Number(m) };
}

/**
 * A new life taken to an hour of the first class day, the school's own date for it (`ORIENTATION_2026.classesBegin`),
 * in one jump from the first morning: the week's orientation gone to on the way.
 */
function onFirstClassDay(said: string): Simulation {
  const sim = life();
  jump(sim, instantFromZoned({ ...ORIENTATION_2026.classesBegin, ...clockOf(said), second: 0 }, sim.zone));
  return sim;
}

/** The real time the clock example waits, in minutes. */
function waited(): number {
  const [span] = read(example('day.clock').steps[1]!, /^Wait (half an hour|an hour|\d+ minutes) of real time\.$/);
  return span === 'half an hour' ? 30 : span === 'an hour' ? 60 : Number.parseInt(span, 10);
}

/** What the top bar's Play button says, read from the speed the save holds (`ui/shell/TimeControls.tsx`). */
const playButton = (sim: Simulation): string => (sim.universe.preferences.timeSpeed === 'paused' ? 'Play' : 'Pause');

function playClock() {
  const [startsAt] = read(example('day.clock').setup, /at (\d+:\d+ [AP]M), paused/);
  const sim = onFirstClassDay(startsAt);
  sim.must({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } });
  const pausedAt = sim.now;
  const button = { before: playButton(sim), running: '', after: '' };
  const before = { ...sim.player.wellbeing };
  const carried = sim.player.wokeWithDebt ?? 0;
  const next = sim.timeline.next(sim.now, (i) => i.requiresPlayer === true)!;
  // Play, and the real time waited a second at a time, as the provider ticks it (`TICK_MS`) while the save's speed is
  // live; at a stop the engine returns, its halt pauses it, and the ticking stops with it.
  sim.must({ kind: 'world.set_preferences', payload: { timeSpeed: 'live' } });
  button.running = playButton(sim);
  const stepper = createClockStepper(1);
  let stop: ScheduledItem | undefined;
  let haltedAt: number | undefined;
  for (let second = 0; second < waited() * 60 && sim.universe.preferences.timeSpeed === 'live'; second += 1) {
    const r = sim.advanceBy(stepper.feed(1_000), { stopOnPlayerRequired: true });
    if (r.interruptedBy) {
      stop = r.interruptedBy;
      haltedAt = sim.now;
      sim.must({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } });
    }
  }
  button.after = playButton(sim);
  return { sim, pausedAt, button, before, carried, next, stop, haltedAt, after: { ...sim.player.wellbeing } };
}

function playAdvance() {
  const [startsAt] = read(example('day.advance').setup, /^A weekday at (\d+:\d+ [AP]M),/);
  const firstClassEvening = () => onFirstClassDay(startsAt);
  const [sleptAt] = read(example('day.advance').result, /A Sleep chosen at (\w+) would have put back more\./);
  const sim = firstClassEvening();
  const startedAt = sim.now;
  const nextWanted = sim.timeline.next(sim.now, (i) => i.requiresPlayer === true)!;
  const wanted = tomorrowMorning(sim);
  const r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
  // What they had at midnight: the same evening kept up with One Hour at a time, an hour or less, so no night is slept.
  const kept = firstClassEvening();
  const midnight = startOfDay(wanted, kept.zone);
  keptUp(kept, midnight);
  // And a Sleep chosen at that hour of the evening instead, to the same seven o'clock.
  const slept = firstClassEvening();
  jump(slept, todayAt(slept, word(sleptAt) + 12));
  slept.must({ kind: 'life.sleep', payload: { hours: (tomorrowMorning(slept) - slept.now) / MS_HOUR } });
  return { sim, startedAt, nextWanted, wanted, r, midnight, atMidnight: kept.player.wellbeing.energy, sleptEnergy: slept.player.wellbeing.energy, sleptWoke: slept.now };
}

function playNeeds() {
  const { setup } = example('day.needs');
  const [month] = read(setup, /^(\w+), for a student from abroad/);
  // A student from abroad, who files every year (Form 8843 at least): until 2026-10-13 any student with income had a
  // return to file, and this example was played on a New York-born one; under the filing threshold and owing nothing,
  // they have none now.
  const sim = life(SEED, { homeRegionId: 'uk-eng-london' });
  const year = zonedParts(sim.now, sim.zone).year;
  // The first of the month after the first fall, at noon: in February, tax season opened that morning at nine.
  jump(sim, instantFromZoned({ year: year + 1, month: MONTHS.indexOf(month) + 1, day: 1, hour: 12, minute: 0, second: 0 }, sim.zone));
  // TEST SETUP: two unread notices, the newest two; the older ones marked read by their ids.
  const unread = unreadNotifications(sim).sort((a, b) => b.at - a.at);
  sim.must({ kind: 'world.mark_read', payload: { notificationIds: unread.slice(2).map((n) => n.id) } });
  const decision = openDecisions(sim).find((d) => d.title === `Your ${year} Tax Return`)!;
  const waiting = { decisions: openDecisions(sim).length, unread: unreadNotifications(sim).length };
  const countBefore = waiting.decisions + waiting.unread;
  sim.must({ kind: 'world.dismiss_decision', payload: { decisionId: decision.id } });
  const marked = sim.must<{ read: number }>({ kind: 'world.mark_read', payload: {} });
  const countAfter = openDecisions(sim).length + unreadNotifications(sim).length;
  const stillOpen = openDecisions(sim).some((d) => d.id === decision.id);
  const unreadAfter = unreadNotifications(sim).length;
  const owed = { ...returnsOf(sim.player)[String(year)]! };
  const dueItem = sim.universe.scheduled.find((i) => i.label === `Tax Return Due: ${year}`);
  const dueStillPending = dueItem?.status === 'pending';
  const filed = sim.execute({ kind: 'tax.file', payload: { year } });
  return { sim, month, year, decision, waiting, countBefore, marked, countAfter, stillOpen, unreadAfter, owed, dueItem, dueStillPending, filed, filedAt: returnsOf(sim.player)[String(year)]!.filedAt };
}

function playPlans(then: 'tonight' | 'tomorrow' | 'call off') {
  const { steps } = example('day.plans');
  const [title, hour, minute, half, length] = read(steps[1]!, /What Is It: (.+?)\. When It Starts: (\d+):(\d+) (AM|PM)\. How Long It Takes: (.+?)\./);
  const sim = life();
  // A free evening, at seven in the morning: Tomorrow Morning from the first, Registration gone to on the way.
  jump(sim, tomorrowMorning(sim));
  const morning = sim.now;
  const evening = sim.timeline.between(todayAt(sim, 18), todayAt(sim, 23, 59), (i) => i.requiresPlayer === true);
  const startsAt = todayAt(sim, (Number(hour) % 12) + (half === 'PM' ? 12 : 0), Number(minute));
  const minutes = PLAN_LENGTHS.find((l) => l.label === length)!.minutes;
  const made = sim.must<{ ok: boolean; id?: string; error?: string }>({ kind: 'calendar.schedule', payload: { title, at: startsAt, durationMinutes: minutes } });
  const plan = sim.timeline.get(made.id!)!;
  const kept = { notices: sim.universe.notifications.length, transactions: sim.universe.transactions.length, decisions: Object.keys(sim.universe.decisions).length };
  let calledOff: { ok: boolean; error?: string } | undefined;
  if (then === 'call off') calledOff = sim.must<{ ok: boolean; error?: string }>({ kind: 'calendar.cancel', payload: { entryId: plan.id } });
  const left = { notices: sim.universe.notifications.length, transactions: sim.universe.transactions.length, decisions: Object.keys(sim.universe.decisions).length };
  // This Evening, Meeting Your Class gone to on the way; then Tonight, or Tomorrow Morning.
  jump(sim, todayAt(sim, 18));
  const wanted = then === 'tomorrow' ? tomorrowMorning(sim) : todayAt(sim, 22);
  const r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
  const stop = r.interruptedBy;
  const stoppedAt = sim.now;
  const after = stop ? go(sim, stop, wanted, r.sentFrom) : undefined;
  const plans = look(sim, at('plans'));
  return { sim, title, morning, evening, startsAt, minutes, made, plan, kept, calledOff, left, wanted, stop, stoppedAt, after, plans };
}

/** A Work Out pressed: what it burned (`exerts`) and the injury chance the engine rolled for its hour (`mayHurt`). */
function workOut(sim: Simulation) {
  const burned = sim.player.body!.extra;
  const from = rolls.length;
  sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
  const rolled = rolls.slice(from);
  expect(rolled, 'one injury roll for the hour').toHaveLength(1);
  return { burned: sim.player.body!.extra - burned, rolled: rolled[0]!, record: sim.player.development!.history.at(-1)! };
}

function playWeather() {
  const mk = () => { const sim = life(); jump(sim, tomorrowMorning(sim)); return sim; };
  const sim = mk();
  const ends = sim.now + LOOKING_AFTER.exercise.minutes * MS_MINUTE;
  const now = weatherAt(sim, sim.player.currentLocationId, sim.now)!;
  const hour = weatherAt(sim, sim.player.currentLocationId, ends)!;
  const line = lookAfterOptions(sim).find((o) => o.action === 'exercise')!;
  const where = trainingAt(sim, sim.player, ends);
  const fitness = sim.player.wellbeing.fitness;
  const run = workOut(sim);
  // The same hour indoors: the same morning on a save of its own, the hour lived, and what a workout builds then.
  const twin = mk();
  twin.advanceTo(twin.now + LOOKING_AFTER.exercise.minutes * MS_MINUTE);
  const indoors = workoutBuilds(twin.player) * TRAINING.indoors;
  // A Work Out indoors, played: the same life on a save of its own, Tomorrow Morning pressed until a morning whose hour
  // is no good for a run, and Work Out pressed there.
  const wet = mk();
  const ahead = () => trainingAt(wet, wet.player, wet.now + LOOKING_AFTER.exercise.minutes * MS_MINUTE).where;
  for (let day = 0; day < INDOORS_WITHIN_DAYS && ahead() === 'run'; day += 1) jump(wet, tomorrowMorning(wet));
  const gym = workOut(wet);
  return { sim, now, hour, line, where, indoors, built: sim.player.wellbeing.fitness - fitness, run, gym, wetWeight: wet.player.body!.weightKg };
}

function playHow() {
  const sim = life();
  const first = dials(sim);
  const ready = look(sim, at('readiness'));
  const menu = lookAfterOptions(sim).find((o) => o.action === 'eat')!;
  const startedAt = sim.now;
  const done = sim.must<{ doneAt: number }>({ kind: 'life.look_after', payload: { action: 'eat' } });
  // What the meal's time costs alone: the same morning on a save of its own, its minutes lived and nothing eaten.
  const twin = life();
  twin.advanceTo(twin.now + LOOKING_AFTER.eat.minutes * MS_MINUTE);
  return { sim, first, ready, menu, startedAt, done, after: dials(sim), timeCost: first.readiness - readiness(twin.player) };
}

function playSleep(hours: number) {
  const [bedAt] = read(example('body.sleep').setup, /moved on to (\d+:\d+ [AP]M):/);
  const { hour, minute } = clockOf(bedAt);
  const sim = life();
  // Registration gone to at ten, on the way to the evening's hour.
  jump(sim, todayAt(sim, hour, minute));
  const sleptFrom = sim.now;
  const bedtime = dials(sim);
  const next = sim.timeline.next(sim.now, (i) => i.requiresPlayer === true)!;
  const suggestion = suggestedSleep(sim);
  sim.must({ kind: 'life.sleep', payload: { hours } });
  const woke = sim.now;
  const wake = dials(sim);
  const lastSleptAt = sim.player.lastSleptAt;
  // On to seven that morning, a jump of more than an hour, to see whether a night nobody chose comes after it.
  const debtAtWake = sim.player.wellbeing.sleepDebt;
  jump(sim, todayAt(sim, 7));
  return { sim, bedAt, sleptFrom, bedtime, next, suggestion, woke, wake, lastSleptAt, debtAtWake, lastSleptAfter: sim.player.lastSleptAt };
}

/** The sleep example's two nights, by the hours its text gives them: the one pressed, and the same evening's short one. */
function sleepHours(): { full: number; short: number } {
  const { steps, result } = example('body.sleep');
  const [full] = read(steps[1]!, /^Press Sleep (\d+) Hours\.$/);
  const [short] = read(result, /The same evening slept (\d+) hours wakes at/);
  return { full: Number(full), short: Number(short) };
}

function playLookAfter() {
  const sim = life();
  const first = dials(sim);
  const menu = lookAfterOptions(sim);
  const workoutEnergy = workoutCosts(sim.player);
  const startedAt = sim.now;
  const transactions = sim.universe.transactions.length;
  const done = sim.must<{ doneAt: number }>({ kind: 'life.look_after', payload: { action: 'eat' } });
  const paid = sim.universe.transactions.slice(transactions).filter((t) => t.memo === 'A meal');
  return { sim, first, menu, startedAt, done, paid, after: dials(sim), workoutEnergy };
}

// ---------------------------------------------------------------------------
// Getting started
// ---------------------------------------------------------------------------

describe('getting started', () => {
  it('start.home: New Haven opens under its line, Connecticut inside it, the country inside that, and the save is as it was', () => {
    const p = playHome();
    const { result } = example('start.home');
    expect(p.stops.map((s) => s.label)).toEqual(['Registration And Your Account']);
    expect(formatDate(p.sim.now, p.sim.zone)).toContain(p.month);
    expect(zonedParts(p.sim.now, p.sim.zone).hour).toBe(18);
    expect(p.place.name).toBe(p.town);
    // The word pressed is the one the panel prints from the save. Until later on 2026-10-12 it was set against the
    // setup's town, the example's text against itself.
    expect(p.where.city.name).toBe(p.pressed);
    // Its facts, under the line.
    expect(p.place.body).toBeDefined();
    expect(p.place.summary).toMatch(/\d/);
    expect(p.region.name).toBe(p.regionName);
    expect(p.country.name).toBe(p.countryName);
    // Each with more to press.
    for (const opened of [p.place, p.region, p.country]) expect(opened.ways!.length, opened.name).toBeGreaterThan(0);
    expect(result).toMatch(/nothing in the save has changed/);
    expect(p.after).toBe(p.before);
  });

  it('start.guide: two chapters read, Look After Yourself is Locked at its chapter with the next one first, and opens without the clock moving', () => {
    const p = playGuide();
    const { result } = example('start.guide');
    expect(p.locked.open).toBe(false);
    expect(p.locked.refused).toBeDefined();
    expect(p.locked.chapter!.title).toBe(p.opensAt);
    expect(p.locked.next!.title).toBe(p.comesFirst);
    expect(p.locked.why).toBe(`Read “${p.opensAt}” in the guide first. The chapters open in order, and “${p.comesFirst}” is next: press Guide, at the top of the screen.`);
    expect(result).toMatch(/^Look After Yourself opens\. The clock didn’t move while the guide was open\.$/);
    expect(isOpen(p.sim, 'ui.look-after')).toBe(true);
    expect(isOpen(p.sim, 'life.look_after')).toBe(true);
    expect(p.sim.guardedBecause({ kind: 'life.look_after', payload: { action: 'eat' } })).toBeUndefined();
    expect(p.sim.now).toBe(p.startedAt);
  });
});

// ---------------------------------------------------------------------------
// The day and the clock
// ---------------------------------------------------------------------------

describe('the day and the clock', () => {
  it('day.calendar: Tomorrow Morning stops at Registration, Go carries it through the night to seven, and the night alone stops at its ceiling', () => {
    const p = playCalendar();
    const { setup, steps, result } = example('day.calendar');
    const [startsAt, firstName, firstHour] = read(setup, /at (\d+:\d+ [AP]M), with (.+) at (\w+)\.$/);
    expect(formatTime(p.startedAt, p.sim.zone)).toBe(startsAt);
    expect(titleCaseLabel(p.first.label)).toBe(firstName);
    expect(zonedParts(p.first.at, p.sim.zone).hour).toBe(word(firstHour));
    const [onTheWay] = read(steps[1]!, /comes to (\d+) commitments?/);
    expect(p.onTheWay.length).toBe(Number(onTheWay));
    const [stopsAt, dialog, takes] = read(steps[2]!, /The clock stops at (\d+:\d+ [AP]M), and a dialog named (.+) says going takes (.+)\. Press Go\./);
    expect(formatTime(p.stoppedAt, p.sim.zone)).toBe(stopsAt);
    expect(titleCaseLabel(p.stop.label)).toBe(dialog);
    expect(formatDuration(p.stop.durationMinutes! * MS_MINUTE)).toBe(takes);
    // Registration runs with you there.
    expect(p.stop.status).toBe('done');
    expect(courseworkOf(p.sim, p.sim.player)!.orientation.done.register).toBeDefined();
    const [headed, energy] = read(result, /through the night to (\d+:\d+ [AP]M), where the jump was headed\. .* energy stands at (\d+)\.$/);
    expect(p.after.interruptedBy).toBeUndefined();
    expect(p.sim.now).toBe(p.wanted);
    expect(formatTime(p.sim.now, p.sim.zone)).toBe(headed);
    // The night alone lifted them to it and stopped there: under it at midnight, and at it to the point by seven. Until
    // later on 2026-10-12 the stated figure was set against `COASTING_ENERGY_CEILING`, the constant it's written from.
    expect(p.atMidnight).toBeLessThan(Number(energy));
    expect(p.sim.player.wellbeing.energy).toBe(Number(energy));
    // Slept on the way: the night from midnight.
    expect(p.sim.player.lastSleptAt).toBe(startOfDay(p.wanted, p.sim.zone));
  });

  it('day.clock: Play from 8:30 runs to nine, stops at Classes and pauses, the half hour charged on the way', () => {
    const p = playClock();
    const { setup, steps, result } = example('day.clock');
    const [startsAt, what, whenWord] = read(setup, /at (\d+:\d+ [AP]M), paused, with (\w+) at (\w+)\.$/);
    expect(formatTime(p.pausedAt, p.sim.zone)).toBe(startsAt);
    expect(p.next.kind).toBe(CLASSES_KIND);
    expect(p.next.label).toBe(what);
    expect(zonedParts(p.next.at, p.sim.zone).hour).toBe(word(whenWord));
    expect(steps[0]).toBe('Press Play.');
    const [stopsAt, dialog, button] = read(result, /^At (\d+:\d+ [AP]M) the clock stops by itself, the (\w+) dialog asks, and the button reads (\w+) again\./);
    expect(p.stop).toBeDefined();
    expect(p.stop!.id).toBe(p.next.id);
    expect(formatTime(p.sim.now, p.sim.zone)).toBe(stopsAt);
    expect(p.sim.now - p.pausedAt).toBe(waited() * MS_MINUTE);
    expect(p.stop!.label).toBe(dialog);
    // Standing at it: it hasn't run.
    expect(p.stop!.status).toBe('pending');
    // The button reads the speed the save holds: the stated word at 8:30, another while the clock ran, and the stated
    // word again once the halt paused it, at the engine's stop. The engine's part is the stop and holding the pause it's
    // sent; the pause itself is the provider's, replayed, since nothing in the engine pauses the clock. Until later on
    // 2026-10-12 the stated word was set against 'Play', and the speed against the pause this test had just sent.
    expect(p.haltedAt).toBe(p.next.at);
    expect(p.button.before).toBe(button);
    expect(p.button.running).not.toBe(button);
    expect(p.button.after).toBe(button);
    // Charged on the way: the time waited, awake, at the debt they woke with (`applyElapsedWellbeing`).
    const hours = waited() / 60;
    expect(p.before.energy - p.after.energy).toBeCloseTo(ENERGY_DRAIN_PER_HOUR * hours * (1 + (p.carried / 24) * 0.5), 9);
    expect(p.before.nourishment - p.after.nourishment).toBeCloseTo(NOURISHMENT_DRAIN_PER_HOUR * hours, 9);
    expect(result).toMatch(/The half hour was charged to your energy and food on the way\.$/);
  });

  it('day.advance: Tomorrow Morning from a weekday’s 9:30 PM runs the night with no stop, slept alone from midnight to the ceiling', () => {
    const p = playAdvance();
    const { setup, steps, result } = example('day.advance');
    const [startsAt, nextWhat, nextHour] = read(setup, /^A weekday at (\d+:\d+ [AP]M), with nothing booked until (\w+) at (\w+) the next morning\.$/);
    const day = zonedParts(p.startedAt, p.sim.zone);
    expect(day.weekday).toBeGreaterThanOrEqual(1);
    expect(day.weekday).toBeLessThanOrEqual(5);
    expect(formatTime(p.startedAt, p.sim.zone)).toBe(startsAt);
    expect(p.nextWanted.kind).toBe(CLASSES_KIND);
    expect(p.nextWanted.label.toLowerCase()).toBe(nextWhat);
    expect(zonedParts(p.nextWanted.at, p.sim.zone).hour).toBe(word(nextHour));
    expect(p.nextWanted.at).toBeGreaterThan(p.wanted);
    const [line] = read(steps[0]!, /Tomorrow Morning \((\d+:\d+ [AP]M)\)/);
    expect(formatTime(p.wanted, p.sim.zone)).toBe(line);
    expect(steps[1]).toMatch(/no stop/);
    expect(p.r.interruptedBy).toBeUndefined();
    const [wakes, energy] = read(result, /^At (\d+:\d+ [AP]M) your character has slept the night on their own from midnight, and stands at (\d+) energy, or at what they had at midnight if that was more\./);
    expect(formatTime(p.sim.now, p.sim.zone)).toBe(wakes);
    expect(p.sim.player.lastSleptAt).toBe(p.midnight);
    // The stated figure is the one played: they had less at midnight, so the night's is what they stand at. Until later
    // on 2026-10-12 it was set against `COASTING_ENERGY_CEILING`, the constant it's written from.
    expect(p.atMidnight).toBeLessThan(Number(energy));
    expect(p.sim.player.wellbeing.energy).toBe(Math.max(Number(energy), p.atMidnight));
    expect(result).toMatch(/A Sleep chosen at \w+ would have put back more\.$/);
    expect(p.sleptWoke).toBe(p.sim.now);
    expect(p.sleptEnergy).toBeGreaterThan(p.sim.player.wellbeing.energy);
  });

  it('day.needs: Dismiss and Mark 2 Read take the return’s question and both notices off, three off the count, and the return still files', () => {
    const p = playNeeds();
    const { setup, steps, result } = example('day.needs');
    const [, title, answer, unread] = read(setup, /^(\w+), for a student from abroad, who files a US return every year: (.+?) waiting under (.+?) and Dismiss, and (\w+) unread notices\.$/);
    expect(p.sim.player.citizenshipId).not.toBe('us');
    expect(formatDate(p.sim.now, p.sim.zone)).toContain(p.month);
    expect(p.decision).toBeDefined();
    expect(p.decision.title).toBe(title);
    expect(p.decision.actions.map((a) => a.label)).toEqual([answer]);
    expect(p.waiting.unread).toBe(word(unread));
    const [dismissed] = read(steps[0]!, /^Press Dismiss on (.+)\.$/);
    expect(dismissed).toBe(p.decision.title);
    const [marked] = read(steps[1]!, /^Press Mark (\d+) Read\.$/);
    expect(p.marked.read).toBe(Number(marked));
    const [fell] = read(result, /the count beside Home falls by (\w+)\./);
    expect(p.stillOpen).toBe(false);
    expect(p.unreadAfter).toBe(0);
    expect(p.countBefore - p.countAfter).toBe(word(fell));
    // Still due on its date, and Papers still files it.
    expect(result).toMatch(/The return is still due on its date, and Papers still files it\.$/);
    expect(p.owed.due).toBe(p.decision.dueAt);
    expect(p.owed.filedAt).toBeUndefined();
    expect(p.dueStillPending).toBe(true);
    expect(p.dueItem!.at).toBe(p.owed.due);
    expect(p.filed.ok, p.filed.error).toBe(true);
    expect(p.filedAt).toBe(p.sim.now);
  });

  it('day.plans: Dinner With Sam from eight to ten wants you in New Haven, stops the clock at eight, and Go takes it to ten', () => {
    const p = playPlans('tonight');
    const { setup, result } = example('day.plans');
    const [town, at7] = read(setup, /^A free evening in (.+), at (\d+:\d+ [AP]M)\.$/);
    expect(formatTime(p.morning, p.sim.zone)).toBe(at7);
    expect(p.evening).toEqual([]);
    expect(p.made.ok, p.made.error).toBe(true);
    const [name, from, to, wantedIn, stopsAt, goesTo] = read(result, /^(.+) is on the calendar from (\d+:\d+) to (\d+:\d+ [AP]M), wanting you in (.+?)\. At (\w+) the clock stops and asks, and Go takes the clock to (\w+),/);
    expect(p.plan.kind).toBe(PLAN_KIND);
    expect(p.plan.label).toBe(name);
    expect(formatTime(p.plan.at, p.sim.zone)).toMatch(new RegExp(`^${from} [AP]M$`));
    const ends = p.plan.at + p.plan.durationMinutes! * MS_MINUTE;
    expect(formatTime(ends, p.sim.zone)).toBe(to);
    expect(p.plan.durationMinutes).toBe(p.minutes);
    expect(p.plan.locationId).toBe(p.sim.player.currentLocationId);
    // The evening's town is where the save has them, and the plan's is the town it was made in. Until later on
    // 2026-10-12 the setup's town was set against the result's, the example's text against itself.
    expect(look(p.sim, at('place', p.sim.player.currentLocationId)).name).toBe(town);
    expect(look(p.sim, at('place', p.plan.locationId!)).name).toBe(wantedIn);
    // At eight the clock stops and asks; Go takes it to ten, the plan kept.
    expect(p.stop?.id).toBe(p.plan.id);
    expect(zonedParts(p.stoppedAt, p.sim.zone).hour % 12).toBe(word(stopsAt));
    expect(p.after?.interruptedBy).toBeUndefined();
    expect(zonedParts(p.sim.now, p.sim.zone).hour % 12).toBe(word(goesTo));
    expect(p.sim.now).toBe(ends);
    expect(p.plan.status).toBe('done');
  });

  it('day.plans: Go on a jump headed past ten carries the clock on to where it was headed', () => {
    const p = playPlans('tomorrow');
    expect(example('day.plans').result).toMatch(/or on to where it was headed if that’s later\./);
    expect(p.stop?.id).toBe(p.plan.id);
    expect(p.after?.interruptedBy).toBeUndefined();
    expect(p.sim.now).toBe(p.wanted);
    expect(p.wanted).toBeGreaterThan(p.plan.at + p.plan.durationMinutes! * MS_MINUTE);
    expect(p.plan.status).toBe('done');
  });

  it('day.plans: called off before eight, it counts as Called Off in Your Own Plans, and that’s all it leaves', () => {
    const p = playPlans('call off');
    const [before, counted, where] = read(example('day.plans').result, /Called off before (\w+), it counts as (.+?) in (.+?), and that’s all it leaves\.$/);
    expect(zonedParts(p.morning, p.sim.zone).hour).toBeLessThan(word(before) + 12);
    expect(p.calledOff?.ok, p.calledOff?.error).toBe(true);
    expect(p.plan.status).not.toBe('pending');
    expect(p.plans.name).toBe(where);
    expect(statOf(p.plans.body, counted)).toBe(1);
    expect(statOf(p.plans.body, 'Gone By')).toBe(0);
    expect(statOf(p.plans.body, 'Waiting')).toBe(0);
    // Nothing more: no notice, no money, no question, and the clock doesn't stop at eight.
    expect(p.left).toEqual(p.kept);
    expect(p.stop).toBeUndefined();
    expect(p.sim.universe.notifications.some((n) => n.title.includes(p.title))).toBe(false);
  });

  it('day.weather: a dry, mild hour’s Work Out is a run, said by its line first, and builds a tenth more than the hour indoors', () => {
    const p = playWeather();
    const { setup, steps, result } = example('day.weather');
    const [town] = read(setup, /^A mild, dry morning in (.+), with an hour free for Work Out\.$/);
    expect(look(p.sim, at('place', p.sim.player.currentLocationId)).name).toBe(town);
    expect(p.now.wetNow).toBe(false);
    expect(p.line.refused).toBeUndefined();
    // The next hour: dry, not freezing, not sweltering.
    expect(steps[1]).toBe('Check the next hour is dry, and not freezing or sweltering.');
    expect(p.hour.wetNow).toBe(false);
    expect(p.hour.temperatureC).toBeGreaterThanOrEqual(FINE.runLowC);
    expect(heatIndexC(p.hour.temperatureC, p.hour.humidity)).toBeLessThanOrEqual(FINE.highC);
    expect(p.where.where).toBe('run');
    const [more, said] = read(result, /^The hour was a run: (\d+)% more fitness than the same hour indoors, for more calories burned and a run’s higher chance of an injury\. The Work Out line had said so before you pressed it: “(.+?)\.?”$/);
    expect(p.line.why.startsWith(`${said}:`)).toBe(true);
    expect(p.run.record.source).toBe('workout:run');
    expect(p.built / p.indoors).toBeCloseTo(1 + Number(more) / 100, 9);
    expect(p.run.burned).toBeCloseTo((BODY.met.run - BODY.sedentary) * p.sim.player.body!.weightKg, 6);
    // More calories and a higher chance of an injury, played against a Work Out indoors by the same body: what each
    // hour burned, and the chance the engine rolled for it. Measured on this seed, the indoor hour came on September 6,
    // twelve mornings on, at the same 68.5 kilograms. Until later on 2026-10-12 these two were set against each other's
    // constants (`BODY.met`, `INJURY.perThousandHours`), nothing played.
    expect(p.gym.record.source).toBe('workout');
    expect(Math.abs(p.wetWeight - p.sim.player.body!.weightKg)).toBeLessThan(0.1);
    expect(p.gym.burned).toBeGreaterThan(0);
    expect(p.run.burned).toBeGreaterThan(p.gym.burned);
    expect(p.run.rolled.source).toBe('run');
    expect(p.gym.rolled.source).toBe('gym');
    expect(p.run.rolled.chance).toBeGreaterThan(p.gym.rolled.chance);
  });
});

// ---------------------------------------------------------------------------
// Looking after yourself
// ---------------------------------------------------------------------------

describe('looking after yourself', () => {
  it('body.how: the first morning’s readiness, and a meal’s rise less what its minutes cost', () => {
    const p = playHow();
    const { setup, result } = example('body.how');
    const [energy, stress, nourishment, morale] = read(setup, /energy (\d+), stress (\d+), nourishment (\d+), morale (\d+)\.$/);
    asStated(p.first.energy, energy);
    asStated(p.first.stress, stress);
    asStated(p.first.nourishment, nourishment);
    asStated(p.first.morale, morale);
    const [reads, rises, minutes] = read(result, /^Readiness reads (\d+)\. The meal fills you, and readiness rises by ([\d.]+) on what the meal does alone, less what its (\d+) minutes cost\.$/);
    asStated(p.first.readiness, reads);
    expect(p.ready.summary.startsWith(`${reads},`)).toBe(true);
    // The figure is the menu's own (`lookAfterOptions`).
    asStated(p.menu.gain, rises);
    expect(p.done.doneAt - p.startedAt).toBe(Number(minutes) * MS_MINUTE);
    expect(p.after.nourishment).toBe(100);
    // Played, the rise is the meal's less the minutes'; the two multiply in readiness, so it's near, not to the tenth.
    const rose = p.after.readiness - p.first.readiness;
    expect(rose).toBeGreaterThan(0);
    expect(rose).toBeLessThan(Number(rises));
    expect(Math.abs(rose - (Number(rises) - p.timeCost))).toBeLessThan(0.25);
  });

  it('body.sleep: the measured evening, eight hours to seven o’clock, and five to four with the night counted', () => {
    const hours = sleepHours();
    const night = playSleep(hours.full);
    const nap = playSleep(hours.short);
    const { setup, steps, result } = example('body.sleep');
    const [energy, stress, debt, condition, ready, next, nextHour] = read(setup, /moved on to \d+:\d+ [AP]M: energy ([\d.]+), stress ([\d.]+), sleep debt ([\d.]+) hours, condition ([\d.]+), readiness ([\d.]+), and (.+) at (\w+) the next morning\.$/);
    expect(formatTime(night.sleptFrom, night.sim.zone)).toBe(night.bedAt);
    expect(nap.sleptFrom).toBe(night.sleptFrom);
    asStated(night.bedtime.energy, energy);
    asStated(night.bedtime.stress, stress);
    asStated(night.bedtime.sleepDebt, debt);
    asStated(night.bedtime.condition, condition);
    asStated(night.bedtime.readiness, ready);
    expect(night.next.label).toBe(next);
    expect(zonedParts(night.next.at, night.sim.zone).hour).toBe(word(nextHour));
    const [suggested, reason] = read(steps[0]!, /The suggestion is (\d+) hours, “(.+)”/);
    expect(night.suggestion.hours).toBe(Number(suggested));
    expect(night.suggestion.reason).toBe(reason);
    expect(night.woke - night.sleptFrom).toBe(hours.full * MS_HOUR);
    const [wakes, e, zero, c, moraleFrom, moraleTo, r, shortWakes, mended] = read(result, /^At (\d+:\d+ [AP]M) energy is ([\d.]+), stress and sleep debt are ([\d.]+), condition is ([\d.]+), morale has risen from ([\d.]+) to ([\d.]+), and readiness is ([\d.]+)\. The same evening slept \d+ hours wakes at (\d+:\d+ [AP]M) with the night counted as slept: some sleep debt stays on the books, and condition falls where (\d+) hours mended it\.$/);
    expect(Number(mended)).toBe(hours.full);
    expect(formatTime(night.woke, night.sim.zone)).toBe(wakes);
    asStated(night.wake.energy, e);
    asStated(night.wake.stress, zero);
    asStated(night.wake.sleepDebt, zero);
    asStated(night.wake.condition, c);
    asStated(night.bedtime.morale, moraleFrom);
    asStated(night.wake.morale, moraleTo);
    asStated(night.wake.readiness, r);
    // The short night from the same evening.
    expect(formatTime(nap.woke, nap.sim.zone)).toBe(shortWakes);
    expect(nap.lastSleptAt).toBe(nap.woke);
    // Counted as the night: on to seven, no night nobody chose follows it.
    expect(nap.lastSleptAfter).toBe(nap.lastSleptAt);
    expect(nap.debtAtWake).toBeGreaterThan(0);
    expect(nap.wake.condition).toBeLessThan(nap.bedtime.condition);
    expect(night.wake.condition).toBeGreaterThan(night.bedtime.condition);
  });

  it('body.look-after: Eat A Meal first and Most Worth It, its time, price and lift, and the rest of the menu’s figures', () => {
    const p = playLookAfter();
    const { setup, steps, result } = example('body.look-after');
    const [town, energy, stress, nourishment, hygiene] = read(setup, /first morning in (.+): energy (\d+), stress (\d+), nourishment (\d+), hygiene (\d+)\.$/);
    expect(look(p.sim, at('place', p.sim.player.currentLocationId)).name).toBe(town);
    asStated(p.first.energy, energy);
    asStated(p.first.stress, stress);
    asStated(p.first.nourishment, nourishment);
    asStated(p.first.hygiene, hygiene);
    const [firstLine] = read(steps[1]!, /^(.+) is first, marked Most Worth It\. Press it\.$/);
    const top = p.menu[0]!;
    expect(top.label).toBe(firstLine);
    expect(top.action).toBe('eat');
    expect(top.refused).toBeUndefined();
    // Most Worth It: nothing urgent, and half a point or more (`LookAfterMenu`).
    expect(top.urgent).toBe(false);
    expect(top.gain).toBeGreaterThanOrEqual(0.5);
    const [minutes, price, fills, rises, unwind, shower, workout, costs] = read(result, /^It takes (\d+) minutes and (\$[\d.,]+): nourishment goes to (\d+), and readiness moves ([+−-]?[\d.]+) on what the meal does alone\. Unwind would have given about ([+−-]?[\d.]+) and a Shower ([+−-]?[\d.]+); Work Out, last, about ([+−-]?[\d.]+), for the (\d+) energy it costs today\.$/);
    expect(p.done.doneAt - p.startedAt).toBe(Number(minutes) * MS_MINUTE);
    expect(p.paid).toHaveLength(1);
    const charged = p.paid[0]!.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0);
    expect(formatMoney(charged, 'USD')).toBe(price);
    asStated(p.after.nourishment, fills);
    const gain = (action: string) => p.menu.find((o) => o.action === action)!.gain;
    asStated(gain('eat'), rises.replace('+', ''));
    asStated(gain('unwind'), unwind.replace('+', ''));
    asStated(gain('wash'), shower.replace('+', ''));
    asStated(gain('exercise'), workout.replace('+', ''));
    expect(p.menu.at(-1)!.action).toBe('exercise');
    asStated(p.workoutEnergy, costs);
  });
});

// ---------------------------------------------------------------------------
// The live save
// ---------------------------------------------------------------------------

describe('a live save', () => {
  it('is the same to the byte after every example here is played beside it', () => {
    const live = life('guide-examples-start-day-body-live');
    jump(live, live.now + 3 * MS_HOUR);
    const before = serialise(live.universe);
    playHome(); playGuide(); playCalendar(); playClock(); playAdvance(); playNeeds();
    playPlans('tonight'); playPlans('tomorrow'); playPlans('call off');
    playWeather(); playHow(); playSleep(sleepHours().full); playSleep(sleepHours().short); playLookAfter();
    expect(serialise(live.universe)).toBe(before);
  });
});
