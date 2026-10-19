/**
 * The missed-work term (2026-10-16), the gap the sweep of that day left open (docs/verification/sweep-2026-10-16/README.md,
 * “Left Open”): no played term had missed a piece. The warning, the review and the course's pass had counted a piece missed
 * unexcused as due and Unready since the sweep, and tests/workload.test.ts held it by setting the misses by hand and
 * calling `termWarning`. Here a first fall is played through the commands and the clock on a new life.
 *
 * The term (seed mt-1, Ada Cole, born in New York, at Yale in New Haven from Monday 24 August 2026): every open piece's
 * parts prepared each midnight (TEST SETUP, as tests/scope-school.test.ts does it), and these choices made by the rule
 * below, not by date:
 * - asleep through the nine o’clock class (`life.sleep` at one in the morning for ten hours, the command a player uses)
 *   on the first class day after a piece has been due on which exactly one piece is due and nothing is to be shown
 *   again, and on the next such day: two pieces missed unexcused;
 * - asleep through the first day on which exactly one piece is to be shown again and none is due: a revision missed;
 * - called in sick (TEST SETUP: the flu, as illness comes by the draw) on the first day after that with exactly one piece
 *   due at a meeting its course has more of: the piece moves to that course's next meeting, and isn't counted then;
 * - called in sick again on the first day in December with a piece due at its course's last meeting of the term: that
 *   piece is excused, “Excused, Not Shown”, and counts for nothing (any other piece due that day moves on, as above);
 * - every other piece shown.
 *
 * Every count asserted is worked here from the term's own assignments by `countedAt`, which reads each piece's showing,
 * its rounds, its revision and its status: not by `termTally`, the engine's count that the warning and the review read.
 * The marks are the rule's, written as literals: the warning once six pieces have been due and the Unready or not shown
 * reach 0.35 of them (the review's half less 0.15, `TERM_CHECK`), the review at half of three or more
 * (`ESTIMATE.coursework`). Whether a piece shown came out Unready, Working or better is the judge's, which another
 * session was changing on 2026-10-16 in its own checkout: so no band, no overall and no count of Unready pieces is typed
 * here as a constant. Each is read from the played record, and the assertions say whether the warning, the screen, the
 * notices and the review agree with it. The misses are put early enough that the warning comes at the sixth piece due
 * whatever the judge makes of the pieces shown: three of the first six are missed or not shown again.
 *
 * Twins: one played straight, one reloaded (`loadSave` of its serialised save) just after the first miss, just after
 * the warning and just after the review; at the end the two are the same term.
 *
 * Found on the way, and fixed 2026-10-16 (each test below failed before its fix): Work Shown said nothing of a revision
 * missed, listing the piece at its first band while the review counted it Unready (`CourseworkPane.tsx` read the
 * revision only where `applied` was set, which a missed revision never sets); and the review's own count of the term's
 * coursework (`TermReview.coursework`) was written at every evaluation and read by nothing, so a term like this one,
 * short of the review's mark, showed its count nowhere. The Standing tab now has Coursework This Term beside attendance
 * and growth, and the Evaluations table a Coursework column. The Not Shown notice said only that the piece isn't taken
 * later; it now says how the review and the course count it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts, type Instant } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { PREP_DIMS } from '@/engine/content/coursework';
import { courseworkOf, type Assignment } from '@/engine/systems/coursework';
import { healthOf } from '@/engine/systems/health';
import { classPeriod, coursesOn, isClassDay, keyOf } from '@/engine/systems/school';
import { COURSES, type SchoolDate } from '@/engine/content/school';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tab: 'coursework',
}));

// The School screen's kept tab, at the one the test asks for: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? h.tab : initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, hour = 9, minute = 0): Instant => instantFromZoned({ year: y, month: m, day: d, hour, minute }, NY);
const onDay = (d: SchoolDate, hour: number): Instant => instantFromZoned({ ...d, hour }, NY);
const dayKey = (t: Instant) => { const p = zonedParts(t, NY); return keyOf({ year: p.year, month: p.month, day: p.day }); };

/** TEST SETUP: every open piece's parts prepared each midnight, as tests/scope-school.test.ts prepares them. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
const life = () => working(createSave(1, 'mt-1', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' }));
const reload = (sim: Simulation) => working(loadSave(deserialise(serialise(sim.universe))));
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tend = (sim: Simulation, until: Instant) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
const work = (sim: Simulation) => courseworkOf(sim, sim.player)!.assignments.filter((a) => a.term === 0);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

/** Fall Term 2026's class days, and the days each course meets on them. */
const plus = (d: SchoolDate, n: number): SchoolDate => { const t = new Date(Date.UTC(d.year, d.month - 1, d.day + n)); return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() }; };
const CLASS_DAYS: SchoolDate[] = [];
for (let d = classPeriod(0).from; keyOf(d) <= keyOf(classPeriod(0).to); d = plus(d, 1)) if (isClassDay(0, d)) CLASS_DAYS.push(d);
const meetsAfter = (code: string, key: string) => CLASS_DAYS.some((d) => keyOf(d) > key && coursesOn(d, 0).some((c) => c.code === code));

/**
 * The term's coursework as the rule counts it at a moment, worked from the assignments: each piece counted from its first
 * showing (a piece in rounds from its first round) or from the day it was missed; Unready where it was missed, where its
 * revision was missed, or at the band it stood at then (its latest round's, then its second showing's). Within a day the
 * pieces count in the order the day's courses meet (`coursesOn`), all at nine. `through` is a day and how many of that
 * day's courses have met.
 */
function countedAt(pieces: readonly Assignment[], day: string, courses = Number.POSITIVE_INFINITY) {
  const order = (key: string, code: string) => { const [y, m, d] = key.split('-').map(Number); return coursesOn({ year: y!, month: m!, day: d! }, 0).findIndex((c) => c.code === code); };
  const happened = (key: string, code: string) => key < day || (key === day && order(key, code) < courses);
  let due = 0, unready = 0, strong = 0;
  for (const a of pieces) {
    const first = a.roundsShown?.[0]?.on ?? (a.shown ? dayKey(a.shown.at) : a.status === 'missed' ? a.dueOn : undefined);
    if (first === undefined || !happened(first, a.course)) continue;
    due += 1;
    if (!a.shown) { unready += 1; continue; }
    let band = a.roundsShown?.length ? a.roundsShown.filter((r) => happened(r.on, a.course)).at(-1)!.band : a.shown.band;
    if (a.revision && happened(a.revision.dueOn, a.course)) band = a.revision.missed ? 'unready' : a.revision.band ?? band;
    if (band === 'unready') unready += 1;
    if (band === 'strong' || band === 'exceptional') strong += 1;
  }
  return { due, unready, strong };
}


/** The day a piece first counts: its first round's, its showing's, or the day it was missed. */
const firstDay = (a: Assignment): string | undefined => a.roundsShown?.[0]?.on ?? (a.shown ? dayKey(a.shown.at) : a.status === 'missed' ? a.dueOn : undefined);
const courseName = (code: string) => COURSES.find((c) => c.code === code)!.name;
const drawn = (sim: Simulation, tab: string) => { h.sim = sim; h.tab = tab; return renderToStaticMarkup(createElement(SchoolWorkspace)).replace(/<!-- -->/g, ''); };
const text = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

interface Played {
  sim: Simulation;
  missed: string[];
  revisionMissed: string;
  moved: { id: string; on: string };
  excused: { id: string; on: string };
  /** The School screen at noon on the first miss's day, its Coursework and Standing tabs; and Coursework at noon on the revision's. */
  screens: { missCoursework: string; missStanding: string; revisionCoursework: string };
}

/** The term played by the rule in the header, reloaded at the three moments where `reloads` asks. */
function play(reloads: boolean): Played {
  let sim = life();
  tend(sim, at(2026, 8, 30, 12));
  const missed: string[] = [];
  let revisionMissed = '';
  let moved: Played['moved'] | undefined;
  let excused: Played['excused'] | undefined;
  const screens = { missCoursework: '', missStanding: '', revisionCoursework: '' };
  let reloadedAtWarning = false;
  for (const d of CLASS_DAYS) {
    const key = keyOf(d);
    tend(sim, onDay(d, 1));
    const pieces = work(sim);
    const open = pieces.filter((a) => a.status === 'open' && a.dueOn === key);
    const again = pieces.filter((a) => a.status === 'revising' && a.revision?.dueOn === key);
    let firstMiss = false, revisionDay = false;
    if (missed.length < 2 && countedAt(pieces, key, 0).due >= 1 && open.length === 1 && again.length === 0) {
      sim.must({ kind: 'life.sleep', payload: { hours: 10 } });
      missed.push(open[0]!.id);
      firstMiss = missed.length === 1;
    } else if (missed.length === 2 && !revisionMissed && open.length === 0 && again.length === 1) {
      sim.must({ kind: 'life.sleep', payload: { hours: 10 } });
      revisionMissed = again[0]!.id;
      revisionDay = true;
    } else if (revisionMissed && !moved && open.length === 1 && again.length === 0 && meetsAfter(open[0]!.course, key)) {
      tend(sim, onDay(d, 8));
      healthOf(sim.player).fluUntil = sim.now + MS_DAY;
      sim.must({ kind: 'school.call_in_sick', payload: {} });
      moved = { id: open[0]!.id, on: key };
    } else if (moved && !excused && d.month === 12 && again.length === 0 && open.some((a) => !meetsAfter(a.course, key))) {
      tend(sim, onDay(d, 8));
      healthOf(sim.player).fluUntil = sim.now + MS_DAY;
      sim.must({ kind: 'school.call_in_sick', payload: {} });
      excused = { id: open.find((a) => !meetsAfter(a.course, key))!.id, on: key };
    }
    // Noon on every class day, in both twins alike, so a reload is the only difference between them.
    tend(sim, onDay(d, 12));
    if (firstMiss) { screens.missCoursework = drawn(sim, 'coursework'); screens.missStanding = drawn(sim, 'standing'); }
    if (revisionDay) screens.revisionCoursework = drawn(sim, 'coursework');
    if (reloads && firstMiss) sim = reload(sim);
    // Reloaded at noon on the morning the warning comes.
    if (reloads && !reloadedAtWarning && titled(sim, 'A Word On Your Coursework').length) { sim = reload(sim); reloadedAtWarning = true; }
  }
  // The faculty's review, Friday 11 December at five; reloaded just after it.
  tend(sim, at(2026, 12, 11, 18));
  if (reloads) sim = reload(sim);
  tend(sim, at(2026, 12, 14, 12));
  return { sim, missed, revisionMissed, moved: moved!, excused: excused!, screens };
}

const straight = (() => { let p: Played | undefined; return () => (p ??= play(false)); })();
const reloaded = (() => { let p: Played | undefined; return () => (p ??= play(true)); })();

/** The rule's marks, written from `TERM_CHECK` and `ESTIMATE.coursework` by hand: six due, and 0.5 − 0.15 of them. */
const WARNING_AFTER = 6;
const WARNING_SHARE = 0.35;

describe('the missed-work term, played', () => {
  it('PLAYER JOURNEY: two pieces missed unexcused, a revision missed and the pieces after shown: A Word On Your Coursework comes once, at the sixth piece due, with the counts the term’s own pieces give; at five the share was over the mark already', () => {
    const { sim, missed, revisionMissed } = straight();
    const pieces = work(sim);
    expect(missed).toHaveLength(2);
    expect(new Set(missed.map((id) => pieces.find((a) => a.id === id)!.course)).size).toBe(2);
    for (const id of missed) expect(pieces.find((a) => a.id === id)).toMatchObject({ status: 'missed' });
    for (const id of missed) expect(pieces.find((a) => a.id === id)!.shown).toBeUndefined();
    expect(pieces.find((a) => a.id === revisionMissed)!.revision).toMatchObject({ missed: true });
    expect(pieces.find((a) => a.id === revisionMissed)!.shown).toBeDefined();
    // Pieces were shown after the last of them, through to December.
    const lastMiss = pieces.find((a) => a.id === revisionMissed)!.revision!.dueOn;
    expect(pieces.filter((a) => a.shown && dayKey(a.shown.at) > lastMiss).length).toBeGreaterThan(20);
    expect(pieces.some((a) => a.shown && dayKey(a.shown.at) >= '2026-12-01')).toBe(true);

    // Each settlement in turn, day by day and course by course, to the first at which the rule is met.
    const warnings = titled(sim, 'A Word On Your Coursework');
    expect(warnings).toHaveLength(1);
    let when: { day: string; due: number; unready: number } | undefined;
    let before = { due: 0, unready: 0 };
    for (const d of CLASS_DAYS) {
      const key = keyOf(d);
      for (let k = 1; k <= coursesOn(d, 0).length && !when; k += 1) {
        const c = countedAt(pieces, key, k);
        if (c.due === before.due) continue;
        if (c.due >= WARNING_AFTER && c.unready >= WARNING_SHARE * c.due) when = { day: key, due: c.due, unready: c.unready };
        else before = c;
      }
      if (when) break;
    }
    expect(when).toBeDefined();
    // At the sixth piece due, not later, and only the count held it back at five.
    expect(when!.due).toBe(WARNING_AFTER);
    expect(before.due).toBe(WARNING_AFTER - 1);
    expect(before.unready).toBeGreaterThanOrEqual(WARNING_SHARE * before.due);
    expect(dayKey(warnings[0]!.at)).toBe(when!.day);
    expect(zonedParts(warnings[0]!.at, NY).hour).toBe(9);
    expect(warnings[0]!.body).toMatch(new RegExp(`^So far this term, ${when!.unready} of the ${WARNING_AFTER} pieces due were Unready or not shown\\. `));
    expect(warnings[0]!.body).toContain('This is a warning, not the term review: the faculty reviews the term on December 11, 2026. If half or more of the term’s pieces are Unready or not shown by then, the term falls short of what the program asks, and the review would give you a notice of academic concern.');
    expect(courseworkOf(sim, sim.player)!.warned).toEqual([0]);
  }, 300_000);

  it('PLAYER JOURNEY: each miss is told once, in words that say how it counts; the piece called in sick for moves to its course’s next meeting and isn’t counted on the day it left; the one due at its course’s last meeting is excused and never counted', () => {
    const { sim, missed, moved, excused } = straight();
    const pieces = work(sim);
    const told = sim.universe.notifications.filter((n) => n.title.startsWith('Not Shown: '));
    expect(told.map((n) => n.title)).toEqual(missed.map((id) => `Not Shown: ${courseName(pieces.find((a) => a.id === id)!.course)}`));
    for (const [i, n] of told.entries()) {
      const a = pieces.find((x) => x.id === missed[i])!;
      expect(dayKey(n.at)).toBe(a.dueOn);
      // The course's pieces due by then, shown or missed, and of them those not shown: worked from the pieces.
      const course = pieces.filter((x) => x.course === a.course && firstDay(x) !== undefined && firstDay(x)! <= a.dueOn);
      const notShown = course.filter((x) => !x.shown).length;
      expect(notShown).toBeGreaterThanOrEqual(1);
      expect(n.body).toBe(`You weren’t in class when it was due, and it can’t be shown later, so the term review counts it as Unready. You don’t pass a course if half or more of its pieces due in the term aren’t shown. In ${courseName(a.course)}, that’s ${notShown} of ${course.length} so far.`);
    }
    expect(sim.universe.notifications.filter((n) => n.title.startsWith('Not Shown Again: '))).toHaveLength(1);
    // Called in sick on its day: it went on to its course's next meeting and was shown there, counted from then.
    const m = pieces.find((a) => a.id === moved.id)!;
    expect(m.dueOn > moved.on).toBe(true);
    expect(m.shown).toBeDefined();
    expect(firstDay(m)).toBe(m.dueOn);
    // Its course's last meeting called in sick for: excused, told once, and nothing of it counted, ever.
    const e = pieces.find((a) => a.id === excused.id)!;
    expect(e).toMatchObject({ status: 'excused', dueOn: excused.on });
    expect(e.shown).toBeUndefined();
    expect(titled(sim, `Excused: ${courseName(e.course)}`).map((n) => n.body)).toEqual(['You were ill for the last class it could be shown at, so it won’t be shown this term. It isn’t held against you.']);
    expect(firstDay(e)).toBeUndefined();
  }, 300_000);

  it('PLAYER JOURNEY: the faculty’s review on 11 December counts the misses as due and Unready, as the warning did; its record and the Evaluations table say the term’s count, and its words say it where the mark is reached', () => {
    const { sim } = straight();
    const pieces = work(sim);
    const end = countedAt(pieces, '2026-12-31');
    expect(end.due).toBe(pieces.filter((a) => firstDay(a) !== undefined).length);
    const misses = pieces.filter((a) => (a.status === 'missed' && !a.shown) || a.revision?.missed).length;
    expect(misses).toBe(3);
    expect(end.unready).toBeGreaterThanOrEqual(misses);
    const review = sim.player.school!.history.find((r) => r.term === 0)!;
    expect(review.coursework).toEqual({ shown: end.due, unready: end.unready, strong: end.strong });
    // The review's mark, half of three or more, decides its words (`ESTIMATE.coursework`).
    const short = end.due >= 3 && end.unready >= 0.5 * end.due;
    if (short) expect(review.reason).toContain(`${end.unready} of the ${end.due} pieces due in class were Unready or not shown. That’s short of what the program asks.`);
    else expect(review.reason).not.toContain('pieces due in class were Unready');
    // On the screen: the Evaluations table's Coursework for Fall Term 2026, from the review's own count.
    const shown = text(drawn(sim, 'standing'));
    const row = shown.slice(shown.indexOf('Term Reviews'));
    expect(row).toContain(`Fall Term 2026`);
    expect(row).toContain(`${end.unready} of ${end.due} Unready or not shown`);
  }, 300_000);
});

describe('the missed-work term, on the screen', () => {
  it('DEFECT: after the first miss, every Shown Today line is an open piece’s, the missed one is in Work Shown as Not Shown, and the Standing tab’s Coursework This Term says the term’s count (until 2026-10-16 no tile said it)', () => {
    const { sim, missed, screens } = straight();
    const piece = work(sim).find((a) => a.id === missed[0])!;
    expect(screens.missCoursework).not.toContain(`data-shown-today="${piece.id}"`);
    const lines = [...screens.missCoursework.matchAll(/data-shown-today="([^"]+)"/g)].map((m) => m[1]!);
    expect(lines.length).toBeGreaterThan(0);
    expect(new Set(lines).size).toBe(lines.length);
    // Each line a piece that was open or to be shown again at that noon: none of them shown before it or missed.
    for (const id of lines) {
      const a = work(sim).find((x) => x.id === id)!;
      expect(id).not.toBe(piece.id);
      expect(firstDay(a) === undefined || firstDay(a)! > piece.dueOn || (a.revision !== undefined && a.revision.dueOn > piece.dueOn)).toBe(true);
    }
    const coursework = text(screens.missCoursework);
    expect(coursework.slice(coursework.indexOf('Work Shown'))).toContain(`${courseName(piece.course)} :`);
    expect(coursework).toContain('· Not Shown');
    // The term's count at that noon, from the pieces: those shown and the miss, as the review will read them.
    const c = countedAt(work(sim), piece.dueOn);
    expect(text(screens.missStanding)).toContain(`Coursework This Term ${c.unready} of ${c.due}`);
  }, 300_000);

  it('DEFECT: a revision missed reads Not Shown Again in Work Shown, where until 2026-10-16 the piece stood at its first band with nothing said', () => {
    const { sim, revisionMissed, screens } = straight();
    const a = work(sim).find((x) => x.id === revisionMissed)!;
    expect(a.revision!.applied).toBeUndefined();
    const shown = text(screens.revisionCoursework);
    const list = shown.slice(shown.indexOf('Work Shown'));
    expect(list).toContain('Not Shown Again');
  }, 300_000);
});

describe('the missed-work term, reloaded', () => {
  it('PLAYER JOURNEY: reloaded at the first miss, at the warning and at the review, the term is its twin’s played straight: the same pieces, bands and statuses, the same notices once each, the same review', () => {
    const a = straight();
    const b = reloaded();
    expect([b.missed, b.revisionMissed, b.moved, b.excused]).toEqual([a.missed, a.revisionMissed, a.moved, a.excused]);
    const shape = (sim: Simulation) => work(sim).map((x) => ({ id: x.id, course: x.course, status: x.status, dueOn: x.dueOn, band: x.shown?.band, rounds: x.roundsShown?.map((r) => r.band), revision: x.revision && { missed: x.revision.missed, band: x.revision.band, dueOn: x.revision.dueOn } }));
    expect(shape(b.sim)).toEqual(shape(a.sim));
    const said = (sim: Simulation) => sim.universe.notifications.filter((n) => n.category === 'school').map((n) => `${n.at} ${n.title} ${n.body}`);
    expect(said(b.sim)).toEqual(said(a.sim));
    expect(new Set(said(b.sim)).size).toBe(said(b.sim).length);
    expect(b.sim.player.school!.history).toEqual(a.sim.player.school!.history);
    expect(b.sim.player.school!.courses).toEqual(a.sim.player.school!.courses);
    expect(courseworkOf(b.sim, b.sim.player)!.warned).toEqual([0]);
    expect(titled(b.sim, 'A Word On Your Coursework')).toHaveLength(1);
  }, 600_000);
});
