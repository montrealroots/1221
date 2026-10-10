/**
 * SLATE — each course's record: passed, incomplete or failed, and what the degree needs of them (from 2026-10-10).
 *
 * Until then a term's evaluation read attendance and growth across the term, and the degree came after six terms in
 * standing, whatever had become of any one course. The Bulletin (2026–27, research-yale-student-policies.json): the
 * acting courses are Pass/Fail; the degree is recommended by the faculty for a student who has completed the course
 * work and every requirement (p.151); an Incomplete is due within a month of the term's end, or it becomes a Permanent
 * Incomplete with no credit (p.152); a student with one outstanding takes no part in Commencement (p.26); and the
 * degree must be finished within nine semesters (p.194), which SLATE's three years don't reach.
 *
 * - **A course's meetings** are counted as they happen (`noteMeeting`): there, excused (a sick day, a hospital stay or
 *   a lay-up) or missed. The labs, DRAM 50a, 51b and 363a, are courses too, Pass/Fail, and count here; they don't
 *   count toward the casting pool's missed calls, which are the productions' (SLATE's reading of p.146).
 * - **At the term's evaluation** (`settleCourses`): a course is failed where the unexcused absences took attendance
 *   under the line, or half or more of its work due wasn't shown; incomplete where only excused absences did; passed
 *   otherwise. The line, three quarters of the meetings, is SLATE's estimate: the Bulletin says the faculty judge.
 * - **An Incomplete** is made up in sessions with the course's teachers (`school.make_up`, two hours each, SLATE's
 *   estimate), a week's work of the course each, by its month; extendable once by another month, as the Bulletin
 *   lets an Incomplete be extended (`school.extend_incomplete`). Past it, a Permanent Incomplete. Until a measured
 *   run on 2026-10-10 a session made up one meeting's work and nothing extended it: a student ill for half a spring
 *   owed 62 sessions in a month across nine courses, and lost the degree for it.
 * - **The degree** needs every course passed (`degreeShortfall`). A failed course or a Permanent Incomplete withholds
 *   it; one still incomplete at Commencement holds it until it's made up, or its month runs out. SLATE models no
 *   repeated course and no added semester: the Bulletin's nine semesters would allow one, and the screen says so.
 */
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatDate, MS_DAY, type Instant } from '../core/time';
import { YALE_DRAMA } from '../content/school';
import { startRefusal } from './life';
import type { SchoolRecord } from './school';

export interface CourseRecord {
  term: number;
  code: string;
  name: string;
  meetings: number;
  attended: number;
  excused: number;
  /** Absent, still running; `permanent`, an Incomplete not made up in its month. */
  result?: 'pass' | 'incomplete' | 'fail' | 'permanent';
  /** Why it failed, said on the screen. */
  why?: string;
  /** An Incomplete's make-up sessions owed (a week's work each), made up so far, its deadline, and whether it was extended. */
  owed?: number;
  madeUp?: number;
  dueBy?: Instant;
  extended?: boolean;
}

/** SLATE's estimates: the attendance a course needs, a make-up session's length; the Bulletin's month for an Incomplete. */
export const COURSE_RULES = { passFloor: 0.75, makeUpMinutes: 120, incompleteDays: 30, remindDays: 7 } as const;
export const INCOMPLETE_DUE_KIND = 'school.incomplete_due';

/** The labs' course numbers, by the term each falls in (Bulletin 2026–27 pp.31, 65, 99). */
export const LAB_CODES: Readonly<Record<number, string>> = { 0: 'DRAM 50a', 1: 'DRAM 51b', 5: 'DRAM 363a' };

export function coursesOf(school: SchoolRecord): Record<string, CourseRecord> {
  return (school.courses ??= {});
}

const keyOf = (term: number, code: string) => `${term}:${code}`;

/** A meeting of a course, as it went. */
export function noteMeeting(school: SchoolRecord, term: number, code: string, name: string, how: 'attended' | 'excused' | 'missed'): void {
  const all = coursesOf(school);
  const r = (all[keyOf(term, code)] ??= { term, code, name, meetings: 0, attended: 0, excused: 0 });
  if (r.result !== undefined) return;
  r.meetings += 1;
  if (how === 'attended') r.attended += 1;
  else if (how === 'excused') r.excused += 1;
}

/**
 * A term's courses settled at its evaluation: passed, incomplete or failed, each once. `shownShare` gives the share of
 * a course's work due in the term that was shown, or nothing where none was due.
 */
export function settleCourses(sim: Simulation, person: Person, term: number, shownShare: (code: string) => { due: number; notShown: number }, perWeek: (code: string) => number = () => 1): CourseRecord[] {
  const school = person.school!;
  const settled: CourseRecord[] = [];
  for (const r of Object.values(coursesOf(school))) {
    if (r.term !== term || r.result !== undefined || r.meetings === 0) continue;
    const counted = r.meetings - r.excused;
    const work = shownShare(r.code);
    if (counted > 0 && r.attended / counted < COURSE_RULES.passFloor) {
      r.result = 'fail';
      r.why = `you were at ${r.attended} of its ${counted} meetings you weren’t excused from`;
    } else if (work.due >= 2 && work.notShown * 2 >= work.due) {
      r.result = 'fail';
      r.why = `${work.notShown} of its ${work.due} pieces of work weren’t shown`;
    } else if (r.attended / r.meetings < COURSE_RULES.passFloor) {
      r.result = 'incomplete';
      // A session makes up a week of the course's meetings.
      r.owed = Math.ceil((Math.ceil(COURSE_RULES.passFloor * r.meetings) - r.attended) / Math.max(1, perWeek(r.code)));
      r.madeUp = 0;
      r.dueBy = sim.now + COURSE_RULES.incompleteDays * MS_DAY;
      scheduleDue(sim, person, r);
    } else r.result = 'pass';
    settled.push(r);
  }
  if (person.id === sim.universe.playerId) {
    for (const r of settled.filter((x) => x.result === 'incomplete')) sim.notify({ category: 'school', title: `Incomplete: ${r.name}`, body: `You were ill for ${r.excused} of its ${r.meetings} meetings. Make up ${r.owed} session${r.owed === 1 ? '' : 's'} of work with its teachers, a week's each, by ${formatDate(r.dueBy!, sim.zone)}, on the Standing tab (it can be extended once by a month), or it becomes a Permanent Incomplete, with no credit, and the degree can’t be completed without it.`, importance: 80, route: '/workspace/school' });
    for (const r of settled.filter((x) => x.result === 'fail')) sim.notify({ category: 'school', title: `Not Passed: ${r.name}`, body: `${r.name} wasn’t passed: ${r.why}. The degree needs every course passed, and SLATE models no repeated course.`, importance: 85, route: '/workspace/school' });
  }
  return settled;
}

/** An Incomplete's reminder a week before its deadline, and the deadline. */
function scheduleDue(sim: Simulation, person: Person, r: CourseRecord): void {
  const key = keyOf(r.term, r.code);
  for (const i of sim.universe.scheduled) if (i.status === 'pending' && i.kind === INCOMPLETE_DUE_KIND && i.payload.key === key && i.payload.personId === person.id) sim.timeline.cancel(i.id, sim.now);
  sim.schedule({ at: r.dueBy! - COURSE_RULES.remindDays * MS_DAY, kind: INCOMPLETE_DUE_KIND, label: `${r.name}: An Incomplete Due`, category: 'school', priority: 34, payload: { personId: person.id, key, remind: true } });
  sim.schedule({ at: r.dueBy!, kind: INCOMPLETE_DUE_KIND, label: `${r.name}: An Incomplete Due`, category: 'school', priority: 34, payload: { personId: person.id, key } });
}

/** Why an Incomplete can't be extended now, or nothing: once, before its month runs out. */
export function extendRefusal(sim: Simulation, person: Person, key: string): string | undefined {
  const r = person.school ? coursesOf(person.school)[key] : undefined;
  if (!r || r.result !== 'incomplete') return 'There’s no Incomplete in that course.';
  if (r.extended) return 'It’s been extended once already.';
  if (r.dueBy !== undefined && sim.now > r.dueBy) return 'Its month has run out.';
  return undefined;
}

/** What still stands between them and the degree: each course not passed, or incomplete. */
export function degreeShortfall(school: SchoolRecord): { failed: CourseRecord[]; incomplete: CourseRecord[] } {
  const all = Object.values(school.courses ?? {});
  return { failed: all.filter((r) => r.result === 'fail' || r.result === 'permanent'), incomplete: all.filter((r) => r.result === 'incomplete') };
}

/** Why a make-up session can't be done now, or nothing. */
export function makeUpRefusal(sim: Simulation, person: Person, key: string): string | undefined {
  const r = person.school ? coursesOf(person.school)[key] : undefined;
  if (!r || r.result !== 'incomplete') return 'There’s no Incomplete in that course to make up.';
  if (r.dueBy !== undefined && sim.now > r.dueBy) return 'Its month has run out.';
  if (person.currentLocationId !== YALE_DRAMA.cityId) return 'Its teachers are in New Haven.';
  return startRefusal(sim, person, COURSE_RULES.makeUpMinutes, true);
}

/** `onComplete` runs when an Incomplete becomes a pass, for the degree waiting on it. */
export function registerCourseRecord(sim: Simulation, onComplete: (s: Simulation, person: Person, r: CourseRecord) => void, onPermanent: (s: Simulation, person: Person, r: CourseRecord) => void): void {
  sim.onCommand<{ key: string }, { madeUp: number; owed: number; passed: boolean }>('school.make_up', (p, { sim: s }) => {
    const person = s.player;
    const key = String(p?.key);
    const no = makeUpRefusal(s, person, key);
    if (no) throw new CommandError(no);
    const r = coursesOf(person.school!)[key]!;
    s.advanceTo(s.now + COURSE_RULES.makeUpMinutes * 60_000);
    r.madeUp = (r.madeUp ?? 0) + 1;
    const passed = r.madeUp >= (r.owed ?? 0);
    if (passed) {
      r.result = 'pass';
      r.why = 'made up after an Incomplete';
      for (const i of s.universe.scheduled) if (i.status === 'pending' && i.kind === INCOMPLETE_DUE_KIND && i.payload.key === key && i.payload.personId === person.id) s.timeline.cancel(i.id, s.now);
      onComplete(s, person, r);
    }
    return { madeUp: r.madeUp, owed: r.owed ?? 0, passed };
  });

  sim.onCommand<{ key: string }, { dueBy: Instant }>('school.extend_incomplete', (p, { sim: s }) => {
    const person = s.player;
    const key = String(p?.key);
    const no = extendRefusal(s, person, key);
    if (no) throw new CommandError(no);
    const r = coursesOf(person.school!)[key]!;
    r.extended = true;
    r.dueBy = (r.dueBy ?? s.now) + COURSE_RULES.incompleteDays * MS_DAY;
    scheduleDue(s, person, r);
    return { dueBy: r.dueBy };
  });

  sim.onSchedule(INCOMPLETE_DUE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person?.school ? coursesOf(person.school)[String(item.payload.key)] : undefined;
    if (!person || !r || r.result !== 'incomplete') return;
    if (item.payload.remind === true) {
      if (person.id === s.universe.playerId) s.notify({ category: 'school', title: `A Week Left: ${r.name}`, body: `${(r.owed ?? 0) - (r.madeUp ?? 0)} make-up session${(r.owed ?? 0) - (r.madeUp ?? 0) === 1 ? '' : 's'} left, by ${formatDate(r.dueBy!, s.zone)}.`, importance: 75, route: '/workspace/school' });
      return;
    }
    r.result = 'permanent';
    r.why = 'an Incomplete not made up in its month';
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: `Permanent Incomplete: ${r.name}`, body: `Its month ran out, so ${r.name} carries no credit, and the degree can’t be completed without it. SLATE models no repeated course.`, importance: 85, route: '/workspace/school' });
    onPermanent(s, person, r);
  });
}
