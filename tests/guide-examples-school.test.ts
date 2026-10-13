/**
 * The guide's worked examples on staying at school, played (from 2026-10-12; `content/guide/school.ts`).
 *
 * The connected-journey map (docs/verification/CONNECTED-JOURNEY-MAP-2026-10-12.md §5) promised that every worked
 * example runs on a throwaway save that's never handed to an adapter, and that its figures are checked; nothing did
 * until this file. Each of the seven is played here on a fresh save of its own (`createSave`), through the commands its
 * steps name, on the school's own calendar, and every figure its rendered text states is read back out of that text
 * (`GUIDE_BY_ID`) and set against what the engine then holds: change a rule's constant and the words and the play move
 * together; change the play, or a figure the words compute for themselves, and this fails. A floor no save holds, the
 * attendance the faculty ask and the share of a course's meetings that passes it, is set against the engine's verdicts
 * either side of it, and pinned between them by the constant the rule reads (`ESTIMATE.attendanceFloor` in `evaluate`,
 * `COURSE_RULES.passFloor` in `settleCourses`). Until the review later on 2026-10-12 this said every figure was read
 * when some weren't, and they could have drifted with this still passing: the standing example's days, excused days
 * and calls and shifts, and the attendance its result opens with; the hour a sick day is called in, on which the
 * example turns, and the condition its result says again; the hour registration was slept through; the Incomplete
 * example's pass floor, its meetings said again, and the week its sessions are reckoned by; and the seventh term and its
 * season. The attendance floor was then held against a typed 90, and the meetings it takes to pass against the guide's
 * own sum (`Math.ceil(passFloor × meetings)`), which can't disagree with the words. A twin, where an example says what
 * would have happened otherwise, is the same save copied in memory (`loadSave` of a JSON copy), never written anywhere.
 *
 * TEST SETUP, said again where it's made:
 * - a student who looks after themselves: rested, fed, steady and awake each time the clock moves, as
 *   tests/school.test.ts and tests/leave.test.ts play one, so nothing but the example's own steps keeps them from class;
 * - the coursework prepared each midnight (`doTheWork`, as tests/school.test.ts has it), so a term's evaluation reads
 *   the attendance an example is about and not a student who never prepares;
 * - the flu, for a day called in sick: illness comes by the draw, and Call In Sick takes a body that's unwell;
 * - an injury that keeps them off work, for the Incomplete example's first week laid up: injuries come by the draw too.
 *   Until the review later on 2026-10-12 that example was played with the flu alone, where its words have you laid up
 *   first;
 * - the bank emptied, for the twin sent home from work-study, as tests/school-everyday.test.ts empties it.
 *
 * Every example is played; none is left unrun. The longest, What You Owe The School, plays three years and a term: the
 * third year's spring is failed in one course by sleeping through its meetings (`life.sleep`), the repeat is asked for
 * (`school.request_repeat`), and the seventh term is billed when it begins. None of the seven's figures was wrong
 * against the engine when this was first run.
 *
 * Isolation: a live save, made and played before any example runs, is serialized (`serialise`) at the start and again
 * after every example has been played; the two are the same to the byte.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, zonedParts, type Instant } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { serialise } from '@/engine/persistence/adapter';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { PREP_DIMS } from '@/engine/content/coursework';
import { COURSES, LABS, REQUIRED_PPE, WORK_STUDY, type SchoolDate } from '@/engine/content/school';
import {
  CLASSES_KIND, ESTIMATE, EVALUATION_KIND, LAB_KIND, PAYDAY_KIND, SHIFT_KIND, STANDING_LABEL, at, classPeriod, coursesOn, hasNeed, isClassDay, keyOf, registered,
  termGrowth, termLabel, termStart, timetable,
} from '@/engine/systems/school';
import { COURSE_RULES, degreeShortfall } from '@/engine/systems/courserecord';
import { ORIENTATION_KIND, courseworkOf } from '@/engine/systems/coursework';
import { ACCOUNT_DUE_KIND, accountOwed } from '@/engine/systems/leave';
import { businessDaysOn } from '@/engine/systems/permission';
import { healthOf } from '@/engine/systems/health';
import { overdraftHeadroom } from '@/engine/systems/lending';

// --- the live save, before anything runs ------------------------------------------------------------------------------

const LIVE = quickSave(undefined, 'guide-examples-school-live');
LIVE.advanceTo(LIVE.now + 30 * MS_HOUR);
const LIVE_BEFORE = serialise(LIVE.universe);

// --- the life and the clock -------------------------------------------------------------------------------------------

const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** A copy kept in memory, for what an example says would have happened otherwise. */
const twinOf = (sim: Simulation) => loadSave(JSON.parse(JSON.stringify(sim.universe)) as never);

/** TEST SETUP: the work done each midnight, every open piece's every part prepared. */
const working = (sim: Simulation) => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tend = (sim: Simulation, until: Instant) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
/** TEST SETUP: down with the flu until the day's out, which is what lets Call In Sick through. */
const flu = (sim: Simulation) => { healthOf(sim.player).fluUntil = sim.now + MS_DAY; };
/** TEST SETUP: laid up until a moment, by an injury that keeps you off work (`laidUp`), as a concussion does. */
const layUp = (sim: Simulation, until: Instant) => { healthOf(sim.player).injury = { kind: 'concussion', at: sim.now, until, offWorkUntil: until }; };

const plusDays = (d: SchoolDate, days: number): SchoolDate => {
  const t = new Date(Date.UTC(d.year, d.month - 1, d.day + days));
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
};
const weekdayOf = (d: SchoolDate) => new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
const dayOf = (when: Instant): SchoolDate => { const p = zonedParts(when, 'America/New_York'); return { year: p.year, month: p.month, day: p.day }; };
const hourOf = (when: Instant) => zonedParts(when, 'America/New_York').hour;
/** A term's class days, first to last. */
function classDays(term: number): SchoolDate[] {
  const p = classPeriod(term);
  const out: SchoolDate[] = [];
  for (let d = p.from; keyOf(d) <= keyOf(p.to); d = plusDays(d, 1)) if (isClassDay(term, d)) out.push(d);
  return out;
}
/** How many of the days fall in each week, Monday to Sunday. */
const weekCounts = (days: readonly SchoolDate[]): number[] => {
  const weeks = new Map<string, number>();
  for (const d of days) { const monday = keyOf(plusDays(d, -((weekdayOf(d) + 6) % 7))); weeks.set(monday, (weeks.get(monday) ?? 0) + 1); }
  return [...weeks.values()];
};
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((x) => x.title === title);
const itemsOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.payload.personId === sim.player.id);
/** A calendar item as the save holds it now: a refused command puts the save back as it was, in new objects. */
const itemNow = (sim: Simulation, id: string) => sim.universe.scheduled.find((i) => i.id === id)!;
/** Anything of the day's work due at a meeting: a piece, or a piece shown again. */
const workDue = (sim: Simulation, d: SchoolDate, except?: string) => (courseworkOf(sim, sim.player)?.assignments ?? [])
  .some((a) => a.course !== except && ((a.status === 'open' && a.dueOn === keyOf(d)) || (a.status === 'revising' && a.revision?.dueOn === keyOf(d))));
/** Anything the player is expected at, other than the classes, from one moment to another. */
const expectedAt = (sim: Simulation, from: Instant, to: Instant) => sim.universe.scheduled
  .some((i) => i.status === 'pending' && i.requiresPlayer && i.kind !== CLASSES_KIND && i.at < to && i.at + (i.durationMinutes ?? 0) * 60_000 > from);
/** Asleep from one in the morning to eleven: the day's classes at nine slept through, by the command a player uses. */
const sleepThrough = (sim: Simulation, d: SchoolDate) => {
  tend(sim, at(d, 1));
  sim.must({ kind: 'life.sleep', payload: { hours: 10 } });
};

// --- the words ----------------------------------------------------------------------------------------------------------

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const ORDINALS = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

/** The example's words, as the guide renders them. */
function example(id: string): { setup: string; steps: readonly string[]; result: string } {
  const e = GUIDE_BY_ID[id];
  if (!e) throw new Error(`no guide entry ${id}`);
  return e.example;
}
/** The groups a pattern takes from a piece of the example's words; it fails the test if the words no longer say it. */
function said(text: string, re: RegExp): string[] {
  const m = text.match(re);
  expect(m, `the example no longer says ${re}: “${text}”`).not.toBeNull();
  return m!.slice(1);
}
const n = (s: string) => (/^\d+$/.test(s) ? Number(s) : WORDS.indexOf(s.toLowerCase()));
/** How many times, as the guide words it: once, twice, three times. */
const timesSaid = (s: string) => (s === 'once' ? 1 : s === 'twice' ? 2 : n(s.replace(/ times$/, '')));
/** A dollar figure as the words give it, a sentence's comma or period after it left off. */
const cents = (s: string) => Math.round(Number(s.replace(/[$,]/g, '').replace(/\.$/, '')) * 100);
const dateSaid = (month: string, day: string, year: string): SchoolDate => ({ year: Number(year), month: MONTHS.indexOf(month) + 1, day: Number(day) });
const MONTH = `(${MONTHS.join('|')})`;
/** A share as the guide writes it, to a tenth of a percent. */
const pct = (share: number) => Math.round(share * 1000) / 10;

/** Each example played once, whichever test asks first; the isolation test asks for all of them. */
function once<T>(play: () => T): () => T {
  let done: { value: T } | undefined;
  return () => (done ??= { value: play() }).value;
}

// --- Your Standing And Classes ------------------------------------------------------------------------------------------

/**
 * The first fall with `slept` class days slept through and `sick` called in sick, every lab and shift kept. The days
 * slept through are spread across the weekdays and weeks, and none falls on a day with work due, so no course fails
 * for them and the evaluation reads attendance alone: "with every other part met".
 */
function playStanding(slept: number, sick: number) {
  const sim = working(student('gx-standing'));
  const days = classDays(0);
  // Called in sick on the first class days, at eight, unwell.
  const sickDays = days.slice(0, sick);
  for (const d of sickDays) {
    tend(sim, at(d, 8));
    flu(sim);
    sim.must({ kind: 'school.call_in_sick', payload: {} });
  }
  // Slept through: at most one a week and two on any weekday, from the second week.
  const perWeekday = new Map<number, number>();
  const weeks = new Set<number>();
  const sleptDays: SchoolDate[] = [];
  for (const d of days) {
    if (sleptDays.length >= slept) break;
    const week = Math.floor((Date.UTC(d.year, d.month - 1, d.day) - Date.UTC(days[0]!.year, days[0]!.month - 1, days[0]!.day)) / (7 * MS_DAY));
    const wd = weekdayOf(d);
    if (week === 0 || weeks.has(week) || (perWeekday.get(wd) ?? 0) >= 2) continue;
    tend(sim, at(d, 1));
    if (workDue(sim, d) || expectedAt(sim, at(d, 1), at(d, 11))) continue;
    sleepThrough(sim, d);
    sleptDays.push(d);
    weeks.add(week);
    perWeekday.set(wd, (perWeekday.get(wd) ?? 0) + 1);
  }
  const evaluation = itemsOf(sim, EVALUATION_KIND).find((i) => i.payload.term === 0)!;
  tend(sim, evaluation.at - MS_HOUR);
  const tally = { ...sim.player.school!.tally };
  tend(sim, evaluation.at + MS_HOUR);
  const review = sim.player.school!.history.find((h) => h.term === 0)!;
  return { sim, tally, review, sleptDays, sickDays, growth: termGrowth(sim.player) };
}
const standing = once(() => {
  const ex = example('school.standing');
  const slept = n(said(ex.steps[0]!, /You sleep through (\w+) class days/)[0]!);
  const sick = n(said(ex.steps[0]!, /call in sick on (\w+)/)[0]!);
  const more = n(said(ex.result, /Sleep through (\w+) more days/)[0]!);
  return { slept, sick, more, asWritten: playStanding(slept, sick), twoMore: playStanding(slept + more, sick) };
});

// --- Calling In Sick ----------------------------------------------------------------------------------------------------

const sickDay = once(() => {
  const ex = example('school.sick');
  const [month, day, year] = said(ex.setup, new RegExp(`Monday, ${MONTH} (\\d+), (\\d{4})`));
  const monday = dateSaid(month!, day!, year!);
  const condition = n(said(ex.setup, /at condition (\d+)/)[0]!);
  // Called in at the hour the first step gives: after nine the classes would have run and counted you.
  const calledAt = n(said(ex.steps[0]!, /^At (\w+), open School, Classes, and press Call In Sick/)[0]!);
  const sim = working(student('gx-sick'));
  tend(sim, at(monday, calledAt));
  const classesId = itemsOf(sim, CLASSES_KIND).find((i) => i.payload.day === keyOf(monday))?.id;
  const labId = itemsOf(sim, LAB_KIND).find((i) => keyOf(dayOf(i.at)) === keyOf(monday))?.id;
  // TEST SETUP: the condition the example gives, first without the flu, then with it.
  sim.player.wellbeing.condition = condition;
  const well = sim.execute({ kind: 'school.call_in_sick', payload: {} });
  flu(sim);
  const called = sim.execute({ kind: 'school.call_in_sick', payload: {} });
  const callsBefore = sim.player.school!.tally.calls;
  // Asleep through the day, as the example's second step.
  sim.must({ kind: 'life.sleep', payload: { hours: 10 } });
  tend(sim, at(monday, 20));
  return { sim, monday, condition, calledAt, classes: classesId ? itemNow(sim, classesId) : undefined, lab: labId ? itemNow(sim, labId) : undefined, well, called, callsBefore };
});

// --- Orientation Week ---------------------------------------------------------------------------------------------------

function playOrientation(catchUp: boolean) {
  const ex = example('school.orientation');
  const [hour] = said(ex.setup, /asleep at (\d+) a\.m\./);
  const [month, day] = said(ex.setup, new RegExp(`on ${MONTH} (\\d+)`));
  const sim = working(student('gx-orientation'));
  const session = itemsOf(sim, ORIENTATION_KIND).find((i) => i.payload.task === 'register')!;
  const year = dayOf(sim.now).year;
  const sessionDay: SchoolDate = { year, month: MONTHS.indexOf(month!) + 1, day: Number(day) };
  // Asleep from the life's first morning to noon, by the command a player uses.
  expect(ex.steps[1]).toMatch(/^At noon/);
  const noon = at(sessionDay, 12);
  sim.must({ kind: 'life.sleep', payload: { hours: (noon - sim.now) / MS_HOUR } });
  const missed = { status: itemNow(sim, session.id).status, registered: registered(sim.player.school, courseworkOf(sim, sim.player)) };
  let moved = 0;
  if (catchUp) {
    const before = sim.now;
    sim.must({ kind: 'school.orientation', payload: { task: 'register' } });
    moved = (sim.now - before) / 60_000;
  }
  const isRegistered = registered(sim.player.school, courseworkOf(sim, sim.player));
  const [cbMonth, cbDay] = said(ex.result, new RegExp(`the classes from ${MONTH} (\\d+)`));
  const first: SchoolDate = { year, month: MONTHS.indexOf(cbMonth!) + 1, day: Number(cbDay) };
  tend(sim, at(first, 16));
  const classes = itemsOf(sim, CLASSES_KIND).find((i) => i.payload.day === keyOf(first))!;
  return { sim, session, sessionHour: Number(hour), sessionDay, missed, moved, isRegistered, first, classes };
}
const orientation = once(() => ({ caughtUp: playOrientation(true), leftUndone: playOrientation(false) }));

// --- Leave, Withdrawal And Coming Back -----------------------------------------------------------------------------------

const leave = once(() => {
  const ex = example('school.leave');
  const sim = working(student('gx-leave'));
  const [ordinal] = said(ex.setup, /asks on the (\w+) class day/);
  const askOn = classDays(1)[ORDINALS.indexOf(ordinal!) - 1]!;
  tend(sim, at(askOn, 12));
  const fallPassed = Object.values(sim.player.school!.courses ?? {}).filter((r) => r.term === 0);
  const asked = sim.must<{ decideAt: Instant; firstTerm: number; startsNow: boolean }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'personal', terms: n(said(ex.steps[0]!, /Length (\w+) Terms?/)[0]!) } });
  const askedAt = sim.now;
  tend(sim, asked.decideAt + MS_HOUR);
  const l = { ...sim.player.school!.leave! };
  const bought = sim.must<{ cost: number; credit: number }>({ kind: 'school.buy_affiliate', payload: { confirm: true } });
  const springCourses = Object.values(sim.player.school!.courses ?? {}).filter((r) => r.term === 1);
  const noNotice = twinOf(sim);
  sim.must({ kind: 'school.return_notice', payload: {} });
  const back = termStart(l.returnTerm).date;
  tend(sim, at(back, 12));
  const returned = { leave: sim.player.school!.leaves!.at(-1)!, classOf: sim.player.school!.classOf, mustRegister: sim.player.school!.mustRegister };
  sim.must({ kind: 'school.reregister', payload: {} });
  const firstClass = classDays(l.returnTerm)[0]!;
  tend(sim, at(firstClass, 16));
  const attendedBack = sim.player.school!.tally.attended;
  tend(noNotice, l.noticeBy! + MS_HOUR);
  return { sim, askOn, askedAt, asked, fallPassed, leave: l, bought, springCourses, back, returned, attendedBack, noNotice };
});

// --- Repeating, Extra Terms And Incompletes --------------------------------------------------------------------------------

const ACTING = COURSES.find((c) => c.code === 'DRAM 103a/b')!;
/**
 * Acting I's fall with `excused` of its meetings excused, as the example has it: laid up through the first week's
 * meetings, then down with the flu and called in sick at eight on every other meeting after, until the count is reached.
 * The term's evaluation settles the course.
 */
function playIncomplete(excused: number) {
  const sim = working(student('gx-incomplete'));
  const key = `0:${ACTING.code}`;
  const actingDays = classDays(0).filter((d) => coursesOn(d).some((c) => c.code === ACTING.code));
  // Laid up from the evening before the first meeting to the morning after the first week's last.
  const firstWeek = actingDays.filter((d) => keyOf(d) < keyOf(plusDays(actingDays[0]!, 7)));
  const upUntil = at(plusDays(firstWeek.at(-1)!, 1), 8);
  tend(sim, at(plusDays(actingDays[0]!, -1), 20));
  layUp(sim, upUntil);
  tend(sim, upUntil);
  const laidUp = { ...sim.player.school!.courses![key]! };
  let called = 0;
  for (const [i, d] of actingDays.slice(firstWeek.length).entries()) {
    if (laidUp.excused + called >= excused || i % 2 === 1) continue;
    tend(sim, at(d, 8));
    flu(sim);
    sim.must({ kind: 'school.call_in_sick', payload: {} });
    called += 1;
  }
  const evaluation = itemsOf(sim, EVALUATION_KIND).find((i) => i.payload.term === 0)!;
  tend(sim, evaluation.at + MS_HOUR);
  return { sim, key, actingDays, laidUp, called, evaluationAt: evaluation.at, settled: { ...sim.player.school!.courses![key]! } };
}
const incomplete = once(() => {
  const ex = example('school.repeat');
  const [excused] = said(ex.setup, /excused from (\d+) of/);
  const { sim, key, actingDays, laidUp, called, evaluationAt, settled } = playIncomplete(Number(excused));
  const lapsed = twinOf(sim);
  // The make-up sessions, on the Monday after, each its two hours.
  tend(sim, at(plusDays(dayOf(evaluationAt), 3), 10));
  const sessions: { madeUp: number; owed: number; passed: boolean; minutes: number }[] = [];
  for (let k = 0; k < (settled.owed ?? 0); k += 1) {
    const before = sim.now;
    const r = sim.must<{ madeUp: number; owed: number; passed: boolean }>({ kind: 'school.make_up', payload: { key } });
    sessions.push({ ...r, minutes: (sim.now - before) / 60_000 });
  }
  tend(lapsed, settled.dueBy! + MS_HOUR);
  // The meetings the words say reaching the floor takes, against the engine's own verdicts either side of them: the
  // same fall played at that many meetings, the rest excused, and at one fewer. The floor is in no save, and the sum the
  // words make of it is the one `settleCourses` makes for its sessions, so only a verdict can disagree with them.
  const reaching = Number(said(ex.steps[1]!, /Reaching (\d+) needs/)[0]);
  const atFloor = playIncomplete(settled.meetings - reaching).settled;
  const belowFloor = playIncomplete(settled.meetings - reaching + 1).settled;
  return { sim, key, actingDays, laidUp, called, settled, sessions, evaluationAt, lapsed, reaching, atFloor, belowFloor };
});

// --- What You Owe The School ------------------------------------------------------------------------------------------------

/**
 * Three years played, and the third year's spring failed in one course: the once-a-week course whose weekday has no
 * other once-a-week course, slept through on enough of its meetings, on days with no other course's work due and
 * nothing else to be at, so only it fails. The repeat asked for, granted, and the seventh term begun.
 */
const owed = once(() => {
  const sim = working(student('gx-owed'));
  const spring = 5;
  const week = timetable(3, 'spring');
  const wd = week.findIndex((day) => day.filter((c) => c.perWeek === 1).length === 1);
  const course = week[wd]!.find((c) => c.perWeek === 1)!;
  const meetings = classDays(spring).filter((d) => coursesOn(d).some((c) => c.code === course.code));
  const toMiss = meetings.length - Math.ceil(COURSE_RULES.passFloor * meetings.length) + 1;
  const missed: SchoolDate[] = [];
  for (const d of meetings) {
    if (missed.length >= toMiss) break;
    tend(sim, at(d, 1));
    if (workDue(sim, d, course.code) || expectedAt(sim, at(d, 1), at(d, 11))) continue;
    sleepThrough(sim, d);
    missed.push(d);
  }
  const evaluation = itemsOf(sim, EVALUATION_KIND).find((i) => i.payload.term === spring)!;
  tend(sim, evaluation.at + MS_HOUR);
  const school = sim.player.school!;
  const after = { standing: school.standing, failed: degreeShortfall(school).failed.map((r) => r.code), repeatBy: school.repeatBy };
  const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_repeat', payload: {} });
  tend(sim, asked.decideAt + MS_HOUR);
  const repeat = { ...school.repeat! };
  // The seventh term begins, and is billed.
  const seventh = termStart(6).date;
  tend(sim, at(seventh, 9) + MS_HOUR);
  // The terms the engine counts enrolled as it bills, the one begun last among them.
  const enrolled = [...(school.enrolled ?? [])];
  const billed = accountOwed(sim, sim.player);
  const charged = (memo: (m: string) => boolean) => sim.universe.transactions.filter((t) => memo(t.memo)).map((t) => t.postings.find((p) => p.amount > 0)!.amount);
  const tuition = charged((m) => m.startsWith(`Tuition, ${termLabel(6)}:`));
  const healthFee = charged((m) => m === `Yale Health fee, ${termLabel(6)}`);
  const due = itemsOf(sim, ACCOUNT_DUE_KIND).find((i) => i.status === 'pending')!;
  const ex = example('school.money');
  const paid = cents(said(ex.steps[1]!, /You pay (\$[\d,.]+)/)[0]!);
  sim.must({ kind: 'school.pay_balance', payload: { amount: paid } });
  const left = accountOwed(sim, sim.player);
  // The due date passes, and the months after it.
  tend(sim, due.at + MS_HOUR);
  const held = { hold: school.hold, owed: accountOwed(sim, sim.player) };
  const monthly: number[] = [];
  for (let m = 1; m <= 3; m += 1) { tend(sim, due.at + m * 30 * MS_DAY + MS_HOUR); monthly.push(accountOwed(sim, sim.player)); }
  const lifted = sim.must<{ owed: number; held: boolean }>({ kind: 'school.pay_balance', payload: {} });
  return { sim, course, meetings, missed, toMiss, after, repeat, enrolled, billed, tuition, healthFee, due, billedAt: at(seventh, 9), left, held, monthly, lifted, school };
});

// --- Work-Study Shifts --------------------------------------------------------------------------------------------------------

/** The first assigned Saturday, the equipment not yet bought; `broke`, with the bank emptied first. */
function playSaturday(broke: boolean) {
  const sim = working(student('gx-shifts'));
  tend(sim, at(classPeriod(0).from, 8));
  const saturday = itemsOf(sim, SHIFT_KIND).filter((i) => i.status === 'pending' && i.payload.elective === false).sort((a, b) => a.at - b.at)[0]!;
  tend(sim, saturday.at - MS_HOUR);
  const ppeBefore = sim.player.school!.ppe;
  const tallyBefore = { ...sim.player.school!.tally };
  if (broke) drain(sim);
  tend(sim, saturday.at + 7 * MS_HOUR);
  const afterSaturday = { status: itemNow(sim, saturday.id).status, ppe: sim.player.school!.ppe, worked: sim.player.school!.tally.worked - tallyBefore.worked, shifts: sim.player.school!.tally.shifts - tallyBefore.shifts, owedHours: sim.player.school!.workStudy.owedHours };
  return { sim, saturday, ppeBefore, afterSaturday };
}
/** The Saturday, an evening booked the Monday after, and the Friday's pay. */
function playShifts() {
  const { sim, saturday, ppeBefore, afterSaturday } = playSaturday(false);
  tend(sim, at(plusDays(dayOf(saturday.at), 2), 12));
  const booked = sim.must<{ at: Instant; hours: number }>({ kind: 'school.take_shift', payload: {} });
  const payday = () => itemsOf(sim, PAYDAY_KIND).find((i) => i.status === 'pending');
  const paydayAt = payday()!.at;
  tend(sim, paydayAt + MS_HOUR);
  const wages = sim.universe.transactions.filter((t) => /^Work-study wages/.test(t.memo));
  const ppePaid = sim.universe.transactions.filter((t) => t.memo === 'Required protective equipment for work-study');
  return { sim, saturday, ppeBefore, afterSaturday, booked, paydayAt, wages, ppePaid };
}
/**
 * TEST SETUP: everything in the bank and the wallet spent elsewhere, and the overdraft's room too, each posted; a card's
 * limit is set to nothing, the one thing here set and not posted. Until the review later on 2026-10-12 this said all of
 * it was posted, never set.
 */
function drain(sim: Simulation) {
  const mine = Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt);
  for (const a of mine) if (a.kind === 'credit_card') a.creditLimit = 0;
  for (const a of mine) if (a.balance > 0 && a.kind !== 'credit_card') sim.post({ memo: 'Spent elsewhere', category: 'other', postings: [{ accountId: sim.nominalAccount('expense', 'Other').id, amount: a.balance }, { accountId: a.id, amount: -a.balance }] });
  const current = sim.player.primaryAccountId ? sim.universe.accounts[sim.player.primaryAccountId] : undefined;
  const room = overdraftHeadroom(sim, sim.player);
  if (current && room > 0) sim.post({ memo: 'Spent elsewhere', category: 'other', postings: [{ accountId: sim.nominalAccount('expense', 'Other').id, amount: room }, { accountId: current.id, amount: -room }] });
}
const shifts = once(() => ({ paid: playShifts(), sentHome: playSaturday(true) }));

// --- the tests -------------------------------------------------------------------------------------------------------------

const LONG = 600_000;

describe('the guide’s worked examples on staying at school, played', () => {
  it('Your Standing And Classes: the first fall’s days, calls and shifts, and the attendance the evaluation reads', () => {
    const ex = example('school.standing');
    const [classDaysSaid, labs, saturdays] = said(ex.setup, /(\d+) class days, (\d+) .+ lab calls and (\d+) assigned Saturday shifts/).map(Number);
    const [daysSaid, excusedSaid, callsAndShiftsSaid, askedSaid, keptSaid] = said(ex.steps[1]!, /^Asked of you: (\d+) days less the (\d+) excused, and (\d+) calls and shifts, (\d+) in all\. Kept: (\d+)\./).map(Number);
    const [attendanceSaid, floorSaid] = said(ex.steps[2]!, /Attendance comes to ([\d.]+)%, against a floor of ([\d.]+)%/).map(Number);
    const [atSaid, metSaid] = said(ex.result, /^At ([\d.]+)% the floor is (met|missed)\./);
    const [twoMoreSaid] = said(ex.result, /it comes to ([\d.]+)%/).map(Number);
    const { slept, sick, more, asWritten, twoMore } = standing();
    expect(asWritten.sleptDays).toHaveLength(slept);
    expect(asWritten.sickDays).toHaveLength(sick);
    // The fall as the engine counted it.
    expect(asWritten.tally.classDays).toBe(classDaysSaid);
    expect(asWritten.tally.calls).toBe(labs);
    expect(asWritten.tally.shifts).toBe(saturdays);
    expect(asWritten.tally.excused).toBe(sick);
    expect(asWritten.tally.attended).toBe(classDaysSaid! - sick - slept);
    expect(asWritten.tally.answered).toBe(labs);
    expect(asWritten.tally.worked).toBe(saturdays);
    // What was asked and kept, each part of the sum as the engine counted it.
    expect(asWritten.tally.classDays).toBe(daysSaid);
    expect(asWritten.tally.excused).toBe(excusedSaid);
    expect(asWritten.tally.calls + asWritten.tally.shifts).toBe(callsAndShiftsSaid);
    const asked = asWritten.tally.classDays - asWritten.tally.excused + asWritten.tally.calls + asWritten.tally.shifts;
    const kept = asWritten.tally.attended + asWritten.tally.answered + asWritten.tally.worked;
    expect(asked).toBe(askedSaid);
    expect(kept).toBe(keptSaid);
    // The evaluation's own figure, and its result.
    expect(asWritten.review.attendance).toBeCloseTo(kept / asked, 10);
    expect(pct(asWritten.review.attendance)).toBe(attendanceSaid);
    expect(pct(asWritten.review.attendance)).toBe(Number(atSaid));
    expect(asWritten.review.standing).toBe('good');
    expect(metSaid).toBe('met');
    // The floor, which no save holds: between the engine's verdicts either side of it, the standing kept at the one
    // attendance and dropped at the other, and pinned between them by the floor `evaluate` reads.
    expect(twoMore.review.standing).not.toBe(asWritten.review.standing);
    expect(asWritten.review.attendance).toBeGreaterThanOrEqual(floorSaid! / 100);
    expect(twoMore.review.attendance).toBeLessThan(floorSaid! / 100);
    expect(floorSaid).toBe(pct(ESTIMATE.attendanceFloor));
    // Two days more slept through: the figure, and a step down with every other part met.
    expect(twoMore.sleptDays).toHaveLength(slept + more);
    expect(twoMore.tally.attended).toBe(asWritten.tally.attended - more);
    expect(pct(twoMore.review.attendance)).toBe(twoMoreSaid);
    const [from, to] = said(ex.result, /from ([A-Z][\w ]+?) to ([A-Z][\w ]+?)\./);
    expect(STANDING_LABEL.good).toBe(from);
    expect(STANDING_LABEL[twoMore.review.standing]).toBe(to);
    const school = twoMore.sim.player.school!;
    expect(Object.values(school.courses ?? {}).filter((r) => r.term === 0 && r.result !== 'pass')).toEqual([]);
    expect(twoMore.growth.grewTooLittle).toBe(false);
    expect(twoMore.review.work).toBeUndefined();
    // The coursework short of nothing: under the pieces the faculty count, or under their share unready, as `evaluate`
    // reads them, and its reason says nothing of unready work.
    const cw = twoMore.review.coursework ?? { shown: 0, unready: 0, strong: 0 };
    expect(cw.shown < ESTIMATE.coursework.shown || cw.unready < ESTIMATE.coursework.unready * cw.shown).toBe(true);
    expect(twoMore.review.reason).not.toMatch(/unready or not shown/);
    expect(school.tally.breaches).toBe(0);
    expect(twoMore.review.reason).toMatch(new RegExp(`You were at ${Math.round(twoMore.review.attendance * 100)}% of what was asked of you`));
  }, LONG);

  it('Calling In Sick: a first-year’s Monday with the flu excuses the classes and the lab call', () => {
    const ex = example('school.sick');
    const { sim, monday, condition, calledAt, classes: classesFound, lab: labFound, well, called, callsBefore } = sickDay();
    // The day as the example sets it: a Monday, Acting I among the classes at nine, and the lab's call after them.
    expect(weekdayOf(monday)).toBe(1);
    expect(classesFound).toBeDefined();
    expect(labFound).toBeDefined();
    const classes = classesFound!;
    const lab = labFound!;
    expect(hourOf(classes.at)).toBe(n(said(ex.setup, /the day’s other classes at (\w+)\./)[0]!));
    // Called in at the hour the first step gives, before the classes ran.
    expect(at(monday, calledAt)).toBeLessThan(classes.at);
    expect(coursesOn(monday).map((c) => c.name)).toContain(said(ex.setup, /after ([\w ]+?) and the day’s other classes/)[0]);
    expect(hourOf(lab.at)).toBe(LABS.from);
    expect(ex.setup).toContain(`${LABS.from - 12} p.m.`);
    expect(ex.setup).toContain(LABS.drama50.name);
    // Without the flu, at the example's condition, the button says you're well enough to go.
    expect(well.ok).toBe(false);
    expect(well.error).toMatch(/^You’re well enough to go/);
    expect(ex.result).toMatch(/the button would have said you’re well enough to go/);
    expect(n(said(ex.result, /Without the flu, at condition (\d+), the button/)[0]!)).toBe(condition);
    expect(called.ok).toBe(true);
    // The classes count you excused, Acting I among them.
    const school = sim.player.school!;
    expect(classes.status).toBe('missed');
    expect(school.tally.excused).toBe(1);
    for (const c of coursesOn(monday)) expect(school.courses![`0:${c.code}`]!.excused, c.name).toBe(1);
    expect(school.courses![`0:${ACTING.code}`]!.excused).toBe(1);
    expect(titled(sim, 'You Missed Classes')).toEqual([]);
    // The lab call: excused, not counted as missed, kept as excused on the lab's own record.
    expect(lab.status).toBe('missed');
    expect(school.tally.calls).toBe(callsBefore);
    expect(school.tally.calls - school.tally.answered).toBe(0);
    expect(school.courses!['0:DRAM 50a']!.excused).toBe(1);
  }, LONG);

  it('Orientation Week: registration slept through, caught up at noon, and the first classes count you', () => {
    const ex = example('school.orientation');
    const { caughtUp, leftUndone } = orientation();
    // The session as the example has it.
    expect(caughtUp.session.payload.task).toBe('register');
    expect(hourOf(caughtUp.session.at)).toBe(caughtUp.sessionHour);
    expect(keyOf(dayOf(caughtUp.session.at))).toBe(keyOf(caughtUp.sessionDay));
    expect(ex.steps[0]).toContain(caughtUp.session.label);
    expect(hourOf(caughtUp.session.at)).toBe(n(said(ex.steps[0]!, /at (\d+) a\.m\. while you sleep/)[0]!));
    // Slept through, it's missed.
    expect(caughtUp.missed).toEqual({ status: 'missed', registered: false });
    // Caught up at noon: the clock moves on by the session's length, and you're registered.
    expect(caughtUp.moved).toBe(Number(said(ex.result, /The clock moves on (\d+) minutes/)[0]));
    expect(caughtUp.isRegistered).toBe(true);
    // The first classes, on the day the example names, count you.
    expect(keyOf(caughtUp.first)).toBe(keyOf(classPeriod(0).from));
    expect(caughtUp.classes.status).not.toBe('missed');
    expect(caughtUp.sim.player.school!.tally.attended).toBe(1);
    // Left undone: absent, unexcused.
    expect(leftUndone.isRegistered).toBe(false);
    expect(leftUndone.classes.status).toBe('missed');
    expect(leftUndone.sim.player.school!.tally).toMatchObject({ classDays: 1, attended: 0, excused: 0 });
    for (const c of coursesOn(leftUndone.first)) expect(leftUndone.sim.player.school!.courses![`0:${c.code}`]).toMatchObject({ meetings: 1, attended: 0, excused: 0 });
    expect(titled(leftUndone.sim, 'Not Registered')).toHaveLength(1);
    expect(ex.result).toMatch(/each of them would count you absent, unexcused/);
  }, LONG);

  it('Leave, Withdrawal And Coming Back: a personal leave from the first spring, its cover, its notice, and the class it comes back to', () => {
    const ex = example('school.leave');
    const r = leave();
    // A first-year with no need found and every fall course passed.
    expect(hasNeed(r.sim.player)).toBe(false);
    expect(ex.setup).toMatch(/no need found and every course passed/);
    expect(r.fallPassed.length).toBeGreaterThan(0);
    expect(r.fallPassed.filter((c) => c.result !== 'pass')).toEqual([]);
    expect(ex.setup).toContain(`the spring of ${termStart(1).date.year}`);
    // Asked on the fifth class day, it begins when granted, the decision so many working days on.
    expect(r.asked.firstTerm).toBe(1);
    expect(r.asked.startsNow).toBe(true);
    expect(r.asked.decideAt).toBe(businessDaysOn(r.askedAt, Number(said(ex.steps[1]!, /grant it (\d+) working days later/)[0])));
    expect(r.leave.status).toBe('on');
    expect(keyOf(dayOf(r.leave.startedAt!))).toBe(keyOf(dayOf(r.asked.decideAt)));
    expect(r.leave.terms).toBe(n(said(ex.steps[0]!, /Length (\w+) Terms?/)[0]!));
    // Affiliate cover: the leave's terms at the term's rate, less the fee paid for the spring.
    const [terms, rate, fee] = said(ex.steps[2]!, /(\d+) terms at (\$[\d,.]+), less the (\$[\d,.]+) Yale Health fee/);
    expect(r.bought.credit).toBe(cents(fee!));
    expect(r.bought.cost).toBe(Number(terms) * cents(rate!) - cents(fee!));
    expect(r.bought.cost).toBe(cents(said(ex.result, /the cover costs (\$[\d,.]+)/)[0]!));
    // The spring's courses are left to take again.
    expect(r.springCourses.length).toBeGreaterThan(0);
    expect(r.springCourses.filter((c) => c.result !== 'withdrawn')).toEqual([]);
    // Notice by the date the example gives.
    const [nm, nd, ny] = said(ex.steps[3]!, new RegExp(`by ${MONTH} (\\d+), (\\d{4})`));
    expect(keyOf(dayOf(r.leave.noticeBy!))).toBe(keyOf(dateSaid(nm!, nd!, ny!)));
    // Back on the day the example gives, with the class it names, and registering before classes.
    const [bm, bd, by, classOf] = said(ex.result, new RegExp(`back on ${MONTH} (\\d+), (\\d{4}) with the class of (\\d{4})`));
    expect(keyOf(r.back)).toBe(keyOf(dateSaid(bm!, bd!, by!)));
    expect(r.returned.leave.status).toBe('returned');
    expect(keyOf(dayOf(r.returned.leave.returnedAt!))).toBe(keyOf(r.back));
    expect(r.returned.classOf).toBe(Number(classOf));
    expect(r.returned.mustRegister).toBe(true);
    expect(registered(r.sim.player.school, courseworkOf(r.sim, r.sim.player))).toBe(true);
    expect(r.attendedBack).toBeGreaterThan(0);
    // Without the notice, dismissed on the notice's date.
    const [dm, dd] = said(ex.result, new RegExp(`dismissal on ${MONTH} (\\d+)`));
    const twin = r.noNotice.player.school!;
    expect(twin.standing).toBe('dismissed');
    expect(keyOf(dayOf(twin.endedAt!))).toBe(keyOf({ year: dayOf(r.leave.noticeBy!).year, month: MONTHS.indexOf(dm!) + 1, day: Number(dd) }));
    expect(twin.leaves!.at(-1)!.status).toBe('dismissed');
  }, LONG);

  it('Repeating, Extra Terms And Incompletes: Acting I excused fifteen times is Incomplete, and two sessions make it up', () => {
    const ex = example('school.repeat');
    const r = incomplete();
    const [excusedSaid, name, meetingsSaid] = said(ex.setup, /^Laid up and then down with the flu, you’re excused from (\d+) of ([\w ]+)’s (\d+) fall meetings/);
    const [excused, meetings] = [Number(excusedSaid), Number(meetingsSaid)];
    const [attended, ofMeetings] = said(ex.steps[0]!, /has you at (\d+) of (\d+)/).map(Number);
    const [floorSaid, ofAll] = said(ex.steps[1]!, /^Under ([\d.]+)% of all (\d+), it’s Incomplete\./).map(Number);
    const [passAt, more, perWeek, sessions] = said(ex.steps[1]!, /Reaching (\d+) needs (\d+) more meetings, and at (\d+) a week that comes to (\d+) make-up sessions/).map(Number);
    // Laid up through the first week's meetings, and then the flu, called in sick on enough of the rest.
    expect(r.laidUp.excused).toBeGreaterThan(0);
    expect(r.laidUp.excused + r.called).toBe(excused);
    // The fall's meetings, as the calendar holds them and the course's record counted them.
    expect(r.settled.name).toBe(name);
    expect(r.actingDays).toHaveLength(meetings);
    expect(r.settled).toMatchObject({ meetings, excused, attended });
    expect(ofMeetings).toBe(r.settled.meetings);
    expect(ofAll).toBe(r.settled.meetings);
    // At every meeting not excused, so not failed: Incomplete.
    expect(r.settled.attended).toBe(r.settled.meetings - r.settled.excused);
    expect(r.settled.result).toBe('incomplete');
    // Reaching the floor: the engine passes the fall at the meetings the words give, and leaves it Incomplete at one fewer.
    expect(r.reaching).toBe(passAt);
    expect(r.atFloor).toMatchObject({ meetings: r.settled.meetings, attended: passAt, result: 'pass' });
    expect(r.belowFloor).toMatchObject({ meetings: r.settled.meetings, attended: passAt! - 1, result: 'incomplete' });
    expect(passAt! - r.settled.attended).toBe(more);
    // The floor, between those two verdicts, and pinned there by the floor `settleCourses` reads.
    expect(r.atFloor.attended / r.atFloor.meetings).toBeGreaterThanOrEqual(floorSaid! / 100);
    expect(r.belowFloor.attended / r.belowFloor.meetings).toBeLessThan(floorSaid! / 100);
    expect(floorSaid).toBe(pct(COURSE_RULES.passFloor));
    // A session makes up a week's meetings: the most Acting I meets in any week of the engine's calendar.
    expect(Math.max(...weekCounts(r.actingDays))).toBe(perWeek);
    expect(r.settled.owed).toBe(sessions);
    expect(timesSaid(said(ex.steps[2]!, /^Press Make Up A Session (once|twice|\w+ times) within/)[0]!)).toBe(sessions);
    // Due within the days the example gives.
    expect(r.settled.dueBy).toBe(r.evaluationAt + Number(said(ex.steps[2]!, /within (\d+) days/)[0]) * MS_DAY);
    // Made up: each session its two hours, and the course passes on the last.
    expect(r.sessions.map((s) => s.minutes)).toEqual(Array(sessions).fill(COURSE_RULES.makeUpMinutes));
    expect(r.sessions.map((s) => s.passed)).toEqual([...Array(sessions! - 1).fill(false), true]);
    const made = r.sim.player.school!.courses![r.key]!;
    expect(made.result).toBe('pass');
    expect(made.why).toBe('made up after an Incomplete');
    expect(ex.result).toContain('made up after an Incomplete');
    expect(degreeShortfall(r.sim.player.school!).incomplete.map((c) => c.code)).not.toContain(ACTING.code);
    expect(degreeShortfall(r.sim.player.school!).failed.map((c) => c.code)).not.toContain(ACTING.code);
    // Left undone: a Permanent Incomplete at the deadline, which the degree reads as not passed.
    const lapsed = r.lapsed.player.school!.courses![r.key]!;
    expect(lapsed.result).toBe('permanent');
    expect(degreeShortfall(r.lapsed.player.school!).failed.map((c) => c.code)).toContain(ACTING.code);
    expect(titled(r.lapsed, `Permanent Incomplete: ${ACTING.name}`)).toHaveLength(1);
  }, LONG);

  it('What You Owe The School: a repeated third year’s seventh term billed, part paid, held, and lifted', () => {
    const ex = example('school.money');
    const r = owed();
    // The third year's spring: one course failed, and the repeat offered, asked for and granted.
    expect(r.missed).toHaveLength(r.toMiss);
    expect(r.after.failed).toEqual([r.course.code]);
    expect(r.after.standing).toBe('concern');
    expect(r.after.repeatBy).toBeDefined();
    expect(r.repeat).toMatchObject({ status: 'granted', year: 3 });
    expect(r.school.offset).toBe(2);
    expect(r.school.aidReview).toBeUndefined();
    expect(ex.setup).toMatch(/with no aid review asked for/);
    // The term it puts you in, as the engine counted the terms enrolled when it billed, and its season.
    const [nth, seasonSaid, yearSaid] = said(ex.setup, /puts you in a (\w+) term, the (fall|spring) of (\d{4})/);
    expect(r.enrolled).toHaveLength(ORDINALS.indexOf(nth!));
    const begun = termStart(r.enrolled.at(-1)!);
    expect(begun.fall ? 'fall' : 'spring').toBe(seasonSaid);
    expect(begun.date.year).toBe(Number(yearSaid));
    // Billed when it begins: the tuition and the Yale Health fee the example gives, due in its days.
    const [tuition, health, dueDays] = said(ex.steps[0]!, /(\$[\d,.]+) tuition and (\$[\d,.]+) for Yale Health go on your Yale account, due in (\d+) days/);
    expect(r.tuition).toEqual([cents(tuition!)]);
    expect(r.healthFee).toEqual([cents(health!)]);
    expect(r.billed).toBe(cents(tuition!) + cents(health!));
    expect(r.due.at).toBe(r.billedAt + Number(dueDays) * MS_DAY);
    // Part paid.
    const [, leftSaid] = said(ex.steps[1]!, /You pay (\$[\d,.]+) from your bank, leaving (\$[\d,.]+)/);
    expect(r.left).toBe(cents(leftSaid!));
    // The due date passed: a hold, and the late fee; another each month to the term's cap.
    const [fee, cap] = said(ex.result, /with a (\$[\d,.]+) late fee, and another comes each month to (\$[\d,.]+) for the term/);
    expect(r.held.hold).toBeDefined();
    expect(r.held.owed).toBe(r.left + cents(fee!));
    expect(r.monthly).toEqual([r.left + 2 * cents(fee!), r.left + cents(cap!), r.left + cents(cap!)]);
    // Paying the rest lifts the hold at once.
    expect(r.lifted).toEqual({ owed: 0, held: false });
    expect(r.school.hold).toBeUndefined();
    expect(titled(r.sim, 'The Financial Hold Is Lifted')).toHaveLength(1);
  }, LONG);

  it('Work-Study Shifts: the first Saturday with the equipment bought there, a Tuesday evening, and Friday’s pay', () => {
    const ex = example('school.shifts');
    const { paid, sentHome } = shifts();
    // The first assigned Saturday, at ten, six hours, the equipment not yet bought. The hours are written out in words
    // where the rule keeps them as bare numbers (`planWeek`, `school.take_shift`, `bookPayday`), so they're read here.
    expect(weekdayOf(dayOf(paid.saturday.at))).toBe(6);
    expect(hourOf(paid.saturday.at)).toBe(n(said(ex.steps[0]!, /^At (\w+) on Saturday/)[0]!));
    expect(paid.saturday.payload.hours).toBe(n(said(ex.steps[0]!, /you work (\w+) hours/)[0]!));
    expect(paid.ppeBefore).toBeUndefined();
    // Bought there, from the bank, and worked.
    expect(paid.afterSaturday.ppe?.cost).toBe(cents(said(ex.steps[0]!, /the equipment is bought there, (\$[\d,.]+) from your bank/)[0]!));
    expect(paid.afterSaturday.ppe?.cost).toBe(REQUIRED_PPE.cost);
    expect(paid.ppePaid).toHaveLength(1);
    expect(paid.afterSaturday).toMatchObject({ status: 'done', worked: 1, shifts: 1 });
    // The Monday after, the evening booked is Tuesday's, seven to eleven.
    const [from, to] = said(ex.steps[1]!, /^Tuesday, (\w+) to (\w+), front of house/).map(n);
    expect(weekdayOf(dayOf(paid.booked.at))).toBe(2);
    expect(hourOf(paid.booked.at)).toBe(from! + 12);
    expect(paid.booked.hours).toBe(n(said(ex.steps[1]!, /front of house: (\w+) hours/)[0]!));
    expect(from! + paid.booked.hours).toBe(to);
    // Friday at five pays the ten hours, as wages.
    expect(weekdayOf(dayOf(paid.paydayAt))).toBe(5);
    expect(hourOf(paid.paydayAt)).toBe(n(said(ex.steps[2]!, /^Friday at (\w+) is payday/)[0]!) + 12);
    expect(paid.wages).toHaveLength(1);
    const hours = n(said(ex.result, /for the (\w+) hours/)[0]!);
    expect(paid.wages[0]!.memo).toMatch(new RegExp(`^Work-study wages, ${hours} hours`));
    expect(paid.wages[0]!.category).toBe('salary');
    const into = paid.wages[0]!.postings.find((p) => p.amount > 0)!;
    expect(into.amount).toBe(cents(said(ex.result, /Friday pays (\$[\d,.]+)/)[0]!));
    expect(into.amount).toBe(hours * WORK_STUDY.hourly);
    // With no money for the equipment: sent home, the shift missed and counted against attendance.
    expect(sentHome.afterSaturday).toMatchObject({ status: 'missed', worked: 0, shifts: 1 });
    expect(sentHome.afterSaturday.ppe).toBeUndefined();
    expect(titled(sentHome.sim, 'Sent Home From Work-Study')).toHaveLength(1);
  }, LONG);
});

describe('isolation', () => {
  it('leaves a live save byte for byte as it was, every example played', () => {
    standing(); sickDay(); orientation(); leave(); incomplete(); owed(); shifts();
    expect(serialise(LIVE.universe)).toBe(LIVE_BEFORE);
  }, LONG);
});

afterAll(() => {
  // Nothing an example made was ever written anywhere: no slot, no adapter.
  expect(serialise(LIVE.universe)).toBe(LIVE_BEFORE);
});
