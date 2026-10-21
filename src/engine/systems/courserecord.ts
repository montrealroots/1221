/**
 * SLATE — each course's record: passed, incomplete or failed, and what the degree needs of them (from 2026-10-10).
 *
 * Until then a term's evaluation read attendance and growth across the term, and the degree came after six terms in
 * standing, whatever had become of any one course. The Bulletin (2026–27, research-yale-student-policies.json): the
 * acting courses are Pass/Fail; the degree is recommended by the faculty for a student who has completed the course
 * work and every requirement (p.151); an Incomplete is due within a month of the term's end, or it becomes a Permanent
 * Incomplete with no credit (p.152); a student with one outstanding takes no part in Commencement (p.26); and the
 * degree must be finished within nine semesters (p.194). SLATE counts the semesters enrolled (`enrolledTerms`), which
 * a repeated year or an additional term can bring to nine, and refuses either past them (`EXTENDED_STUDY` in
 * `content/school.ts`, read in `systems/leave.ts`). A leave doesn't count toward them, as the term it begins in isn't
 * one enrolled in, and has its own limit, three terms in all (`LEAVE_RULES.maxTerms`). Until 2026-10-12 this said
 * SLATE's three years didn't reach the nine.
 *
 * - **A course's meetings** are counted as they happen (`noteMeeting`): there, excused (a sick day, a hospital stay or
 *   a lay-up) or missed. The labs, DRAM 50a, 51b and 363a, are courses too, Pass/Fail, and count here; a lab missed
 *   without excuse is a call missed too, among the casting pool's missed calls (`LAB_KIND`, `systems/school.ts`), as
 *   the tutorial and the guide say. Until 2026-10-12 this said labs didn't count there, the productions' calls alone
 *   (SLATE's reading of p.146); the code had counted them all along.
 * - **At the term's evaluation** (`settleCourses`): a course is failed where the unexcused absences took attendance
 *   under the line, or half or more of its work due wasn't shown; incomplete where only excused absences did; passed
 *   otherwise. The line, three quarters of the meetings, is SLATE's estimate: the Bulletin says the faculty judge.
 * - **An Incomplete** is made up in sessions with the course's teachers (`school.make_up`, two hours each, SLATE's
 *   estimate), a week's work of the course each, by its month; extendable once by another month, as the Bulletin
 *   lets an Incomplete be extended (`school.extend_incomplete`). Past it, a Permanent Incomplete. Until a measured
 *   run on 2026-10-10 a session made up one meeting's work and nothing extended it: a student ill for half a spring
 *   owed 62 sessions in a month across nine courses, and lost the degree for it.
 * - **The degree** needs every course passed (`degreeShortfall`). A failed course or a Permanent Incomplete withholds
 *   it; one still incomplete at Commencement holds it until it's made up, or its month runs out. From 2026-10-10 a
 *   year with a course failed can be repeated (`school.request_repeat`), and what the last year left unpassed retaken
 *   in an additional term (`school.request_extra_term`), both in `systems/leave.ts` and refused past nine semesters;
 *   each attempt keeps its own record, and the degree reads the best. Until 2026-10-12 this said SLATE modeled no
 *   repeated course and no added semester, and that the screen said so.
 */
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatDate, formatTime, MS_DAY, type Instant } from '../core/time';
import { spokenList } from '../core/text';
import { startRefusal } from './life';
import type { SchoolRecord } from './school';

export interface CourseRecord {
  term: number;
  /**
   * Where in the program it was taken: its calendar term less the leave or repeated year before it (from 2026-10-10).
   * A year-long course's halves share a code, so a requirement is its code in its program term. Absent, the term.
   */
  academic?: number;
  code: string;
  name: string;
  meetings: number;
  attended: number;
  excused: number;
  /**
   * Absent, still running; `permanent`, an Incomplete not made up in its month; `withdrawn`, left unfinished by a leave
   * begun in its term (from 2026-10-10), taken again on return. Each attempt is its own record, by calendar term.
   */
  result?: 'pass' | 'incomplete' | 'fail' | 'permanent' | 'withdrawn';
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
  // A retake in an additional term is an attempt at its own program term's requirement (`SchoolRecord.extra`).
  const retake = school.extra?.term === term ? school.extra.courses.find((c) => c.code === code)?.academic : undefined;
  const r = (all[keyOf(term, code)] ??= { term, academic: retake ?? term - (school.offset ?? 0), code, name, meetings: 0, attended: 0, excused: 0 });
  if (r.result !== undefined) return;
  r.meetings += 1;
  if (how === 'attended') r.attended += 1;
  else if (how === 'excused') r.excused += 1;
}

/**
 * A term's courses settled at its evaluation: passed, incomplete or failed, each once. `shownShare` gives the share of
 * a course's work due in the term that was shown, or nothing where none was due. An Incomplete is told here; a Fail
 * after the standing (`tellFails`).
 */
export function settleCourses(sim: Simulation, person: Person, term: number, shownShare: (code: string) => { due: number; notShown: number }, perWeek: (code: string) => number = () => 1, held: (code: string) => boolean = () => false): CourseRecord[] {
  const school = person.school!;
  const settled: CourseRecord[] = [];
  for (const r of Object.values(coursesOf(school))) {
    // A course held past its term's review (`held`): the final term's Actor Showcase, settled after its last day
    // (`systems/proshowcase.ts`, from 2026-10-21).
    if (r.term !== term || r.result !== undefined || r.meetings === 0 || held(r.code)) continue;
    const counted = r.meetings - r.excused;
    const work = shownShare(r.code);
    if (counted > 0 && r.attended / counted < COURSE_RULES.passFloor) {
      r.result = 'fail';
      r.why = `you came to ${r.attended} of the ${counted} classes you weren’t excused from`;
    } else if (work.due >= 2 && work.notShown * 2 >= work.due) {
      r.result = 'fail';
      r.why = `${work.notShown} of its ${work.due} pieces weren’t shown`;
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
  // The term's Incompletes told in one notice where there are several (from 2026-10-20, brief 17): they share a deadline,
  // and until then each was told in its own notice with the same seventy words of instruction, nine of them at once for
  // brief 17's student under pressure (seed v17-1, April 23, 2027). One course is told as it was, but "ill or hurt": an
  // excused meeting is a sick day, a stay in hospital or a lay-up (`offSick`), and until then it said "ill" of an injury.
  const incompletes = settled.filter((x) => x.result === 'incomplete');
  if (person.id === sim.universe.playerId && incompletes.length === 1) {
    const r = incompletes[0]!;
    sim.notify({ category: 'school', title: `Incomplete: ${r.name}`, body: `You were ill or hurt for ${r.excused} of its ${r.meetings} classes, so it’s an Incomplete for now. To complete it, make up ${sessionsWords(r.owed ?? 0)} with its teachers by ${formatDate(r.dueBy!, sim.zone)}, each covering a week of the course: press Make Up A Session on the Standing And Craft tab. If you need longer, press Ask For A Month More, once. If it isn’t made up in time, it becomes a Permanent Incomplete: no credit, and the degree can’t be completed without it.`, importance: 80, route: '/workspace/school' });
  } else if (person.id === sim.universe.playerId && incompletes.length > 1) {
    const owed = incompletes.reduce((n, r) => n + (r.owed ?? 0), 0);
    sim.notify({ category: 'school', title: `Incompletes In ${countTitle(incompletes.length)} Courses`, body: `You were ill or hurt for too many of their classes to pass ${countWord(incompletes.length)} courses yet, so each is an Incomplete for now. To complete them, make up ${sessionsWords(owed)} with their teachers by ${formatDate(incompletes[0]!.dueBy!, sim.zone)}, each covering a week of its course: ${spokenList(incompletes.map((r) => `${r.name} (${countWord(r.owed ?? 0)})`))}. Press Make Up A Session beside each on the Standing And Craft tab. If you need longer for one, press Ask For A Month More beside it, once. A course not made up in time becomes a Permanent Incomplete: no credit, and the degree can’t be completed without it.`, importance: 80, route: '/workspace/school' });
  }
  return settled;
}

/**
 * The term's Fails, told once the evaluation has settled the standing (from 2026-10-15), so that the year's end is
 * offered only where a repeat can still be asked for it: not where this evaluation ended the School (a dismissal, by
 * the faculty's review or the warning unmet, or a degree withheld, as it always is for a retake failed in an additional
 * term), nor where a repeat would take the degree past the nine semesters the Bulletin allows (`room`, the caller's
 * count as the year's end makes it: after any repeat granted, that is every year, the year repeated with the rest), as
 * `repeatRefusal` refuses them. Until 2026-10-15 `settleCourses`
 * told them before the evaluation read them, and every Fail was told to ask at the year's end, which, after an
 * additional term or a dismissal, “You’re not at school.” refused (found by the current scope's acceptance). Told after
 * the standing's own notice, at the same instant, so a dismissal or a withholding reads before the Fails it came with.
 * tests/scope-school.test.ts plays both dismissals, the review's and the warning unmet, against Fails that are offered,
 * and a second year's fall Fail after the first year's repeat, at concern, offered nothing.
 */
export function tellFails(sim: Simulation, person: Person, term: number, ended: boolean, room: (academic: number) => boolean = () => true, later: () => boolean = () => false): void {
  if (person.id !== sim.universe.playerId) return;
  const school = person.school!;
  // Until 2026-10-15 this also refused a Fail in an additional term (`school.extra?.term !== term`), which `ended`
  // already settled: an additional term's evaluation is a last one (`evaluate`, systems/school.ts), so a retake failed
  // in it ends the School, withheld (the year's end offered and refused beside the additional term, `offerRepeat`) or
  // dismissed. `room` doesn't settle it alone: a retake of a first year's course counts thirteen semesters, a second's
  // eleven, but a third's nine, which the nine allow (tests/scope-school.test.ts's played Movement Invention III, read
  // in play that day). A mutation removing the clause survived that day, and it was removed.
  for (const r of Object.values(coursesOf(school)).filter((x) => x.term === term && x.result === 'fail')) sim.notify({ category: 'school', title: `Not Passed: ${r.name}`, body: `You didn’t pass ${r.name}: ${r.why}. The degree needs every course passed.${ended ? '' : ` ${remedy(r, room, later)}`}`, importance: 85, route: '/workspace/school' });
}

/**
 * What's left for a course not passed, said with it (`tellFails`, the Permanent Incomplete): the year's end where a
 * repeat of its year can still be asked; otherwise an additional term after the last year's evaluation, where one is
 * still to be had (`later`, `extraLater` in systems/school.ts); otherwise that nothing is. From 2026-10-16, the owner's
 * brief's “no dead-end warning”: until then a Fail or a Permanent Incomplete whose year couldn't be repeated (any after a
 * repeat granted) was told only that the degree needs every course passed, while the last year's end would offer an
 * additional term for it (played: tests/remaining-school.test.ts, a second fall's Fail after a first year's repeat).
 */
function remedy(r: CourseRecord, room: (academic: number) => boolean, later: () => boolean): string {
  if (repeatOpen(r, room)) return 'At the year’s end, you can ask to repeat the year on the Standing And Craft tab.';
  if (later()) return 'You can’t repeat its year: that would go past the nine semesters the Bulletin allows. Instead, after your last year’s term review, you can ask on the Standing And Craft tab for an additional term to retake it, unless that review puts you on academic warning.';
  return 'There’s no way left to retake it: neither a repeat of its year nor an additional term fits in the nine semesters the Bulletin allows.';
}

/**
 * Whether the year a course was taken in could still be repeated for it: with room in the nine semesters for the spring
 * that ends it. Earlier on 2026-10-15 it also refused a year in `repeatedYears`; that clause was removed the same day,
 * when `room` came to count the terms still to be taken, as no state was left where it decided anything: a year
 * repeated means a repeat granted, and the count is then ten or more (`repeatRoom`, systems/school.ts).
 */
function repeatOpen(r: CourseRecord, room: (academic: number) => boolean): boolean {
  const academic = r.academic ?? r.term;
  return room(academic % 2 === 0 ? academic + 1 : academic);
}

/** A count as prose says it, and as a title does: one, two, 12; One, Two, 12. */
const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const countWord = (n: number): string => COUNT_WORDS[n] ?? String(n);
const countTitle = (n: number): string => countWord(n).replace(/^\w/, (c) => c.toUpperCase());

/** Sessions, counted as prose says them: one session, two sessions, 12 sessions. */
const sessionsWords = (n: number, noun = 'session'): string => `${countWord(n)} ${n === 1 ? noun : `${noun}s`}`;

/** An Incomplete's reminder a week before its deadline, and the deadline. */
function scheduleDue(sim: Simulation, person: Person, r: CourseRecord): void {
  const key = keyOf(r.term, r.code);
  for (const i of sim.universe.scheduled) if (i.status === 'pending' && i.kind === INCOMPLETE_DUE_KIND && i.payload.key === key && i.payload.personId === person.id) sim.timeline.cancel(i.id, sim.now);
  sim.schedule({ at: r.dueBy! - COURSE_RULES.remindDays * MS_DAY, kind: INCOMPLETE_DUE_KIND, label: `${r.name}: An Incomplete Due`, category: 'school', priority: 34, payload: { personId: person.id, key, remind: true } });
  sim.schedule({ at: r.dueBy!, kind: INCOMPLETE_DUE_KIND, label: `${r.name}: An Incomplete Due`, category: 'school', priority: 34, payload: { personId: person.id, key } });
}

/** Why an Incomplete can't be extended now, or nothing: once, before its month runs out. */
export function extendRefusal(_sim: Simulation, person: Person, key: string): string | undefined {
  const r = person.school ? coursesOf(person.school)[key] : undefined;
  if (!r || r.result !== 'incomplete') return 'There’s no Incomplete in that course.';
  // The School’s words for a student who has left it, as a repeat, an additional term, a conversion and a day called in
  // sick have them (from 2026-10-13: until then a student who had withdrawn was given a month more, and the deadline the
  // School’s end had called off went back on their calendar; found by that day’s evidence pass). `endedAt` is set exactly
  // when the School ends (`setStanding`), which it was already doing when the course record came in.
  if (person.school!.endedAt !== undefined) return 'You’re not at school.';
  if (r.extended) return 'You’ve already had your one extra month.';
  // “Its month has run out.” went on 2026-10-13: at school the deadline makes the course a Permanent Incomplete at its
  // hour, a leave keeps the deadline (`kept`, `systems/leave.ts`), and only the School’s end calls it off, refused above.
  return undefined;
}

/**
 * What still stands between them and the degree: each course with no attempt passed, by its latest attempt, failed (a
 * Fail, a Permanent Incomplete, or left on a leave and not taken again) or incomplete. Until 2026-10-10 every record
 * counted, and a course failed and then passed on a repeated year would still have withheld the degree.
 */
export function degreeShortfall(school: SchoolRecord): { failed: CourseRecord[]; incomplete: CourseRecord[] } {
  const latest = new Map<string, CourseRecord>();
  const passed = new Set<string>();
  for (const r of Object.values(school.courses ?? {})) {
    const req = requirementOf(r);
    if (r.result === 'pass') passed.add(req);
    const was = latest.get(req);
    if (!was || r.term > was.term) latest.set(req, r);
  }
  const open = [...latest.values()].filter((r) => !passed.has(requirementOf(r)));
  return { failed: open.filter((r) => r.result === 'fail' || r.result === 'permanent' || r.result === 'withdrawn'), incomplete: open.filter((r) => r.result === 'incomplete') };
}

/** The requirement a record is an attempt at: its code in its term of the program. */
export const requirementOf = (r: CourseRecord): string => `${r.academic ?? r.term}:${r.code}`;

/** Every Fail on the record, each attempt, for the Bulletin's disqualification (`disqualified`, `systems/leave.ts`). */
export const failsOf = (school: SchoolRecord): CourseRecord[] => Object.values(school.courses ?? {}).filter((r) => r.result === 'fail');

/** Why a make-up session can't be done now, or nothing. */
export function makeUpRefusal(sim: Simulation, person: Person, key: string): string | undefined {
  const r = person.school ? coursesOf(person.school)[key] : undefined;
  if (!r || r.result !== 'incomplete') return 'There’s no Incomplete in that course to make up.';
  // As `extendRefusal` (from 2026-10-13: until then a student who had withdrawn was let make one up, and the course was
  // passed for them; found by that day’s evidence pass). “Its month has run out.” went with it, reached as little here.
  if (person.school!.endedAt !== undefined) return 'You’re not at school.';
  // A session its month can't hold (from 2026-10-13: until then one begun an hour before the deadline was taken, the
  // deadline made the course a Permanent Incomplete inside it, and the session then passed it; found by that day's
  // evidence pass).
  if (r.dueBy !== undefined && sim.now + COURSE_RULES.makeUpMinutes * 60_000 > r.dueBy) return `Its deadline is at ${formatTime(r.dueBy, sim.zone)}, and there isn’t time for a session before then.`;
  // “Its teachers are in New Haven.” went on 2026-10-13, reached by no play: a life is enrolled only where it begins in
  // New Haven (`populateWorld`, `engine/index.ts`), and nothing moves one after it begins.
  return startRefusal(sim, person, COURSE_RULES.makeUpMinutes, true);
}

/** `onComplete` runs when an Incomplete becomes a pass, for the degree waiting on it. */
export function registerCourseRecord(sim: Simulation, onComplete: (s: Simulation, person: Person, r: CourseRecord) => void, onPermanent: (s: Simulation, person: Person, r: CourseRecord) => void, room: (person: Person, academic: number) => boolean = () => true, later: (person: Person) => boolean = () => false): void {
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
      if (person.id !== s.universe.playerId) return;
      // The Incompletes still open on the same deadline are reminded together, by the first of them (from 2026-10-20,
      // brief 17): each reminder fires at the same hour, and until then each said its own notice. One extended has a
      // deadline of its own, and is reminded on its own.
      const left = (x: CourseRecord) => (x.owed ?? 0) - (x.madeUp ?? 0);
      const together = Object.entries(coursesOf(person.school!)).filter(([, x]) => x.result === 'incomplete' && x.dueBy === r.dueBy).sort(([a], [b]) => a.localeCompare(b));
      if (together.length > 1) {
        if (together[0]![0] !== String(item.payload.key)) return;
        const longer = together.some(([k]) => !extendRefusal(s, person, k));
        s.notify({ category: 'school', title: `A Week Left: ${countTitle(together.length)} Incompletes`, body: `You still have ${sessionsWords(together.reduce((n, [, x]) => n + left(x), 0), 'make-up session')} to do, by ${formatDate(r.dueBy!, s.zone)}: ${spokenList(together.map(([, x]) => `${x.name} (${countWord(left(x))})`))}. Press Make Up A Session beside each on the Standing And Craft tab.${longer ? ' If you need longer for one, press Ask For A Month More beside it.' : ''}`, importance: 75, route: '/workspace/school' });
        return;
      }
      s.notify({ category: 'school', title: `A Week Left: ${r.name}`, body: `You still have ${sessionsWords(left(r), 'make-up session')} to do, by ${formatDate(r.dueBy!, s.zone)}. Press Make Up A Session on the Standing And Craft tab.${extendRefusal(s, person, String(item.payload.key)) ? '' : ' If you need longer, press Ask For A Month More.'}`, importance: 75, route: '/workspace/school' });
      return;
    }
    r.result = 'permanent';
    r.why = 'an Incomplete not made up in time';
    // A degree waiting on it is withheld with it (`onPermanent`), which ends the School and every request with it, so the
    // year’s end is offered only where none waits; read before `onPermanent` takes the wait away (from 2026-10-13: until
    // then a student whose degree it withheld was told to ask to repeat the year, which nothing then let them ask; found
    // by that day’s evidence pass).
    // Nor where a repeat would pass the nine semesters, which after any repeat granted it always would, the year repeated
    // with the rest (`repeatOpen`, as `tellFails`; from 2026-10-15: until then a Permanent Incomplete in a repeated
    // year, or in any year after a repeat, was told to ask, as the Fail notice was).
    // What's left otherwise, an additional term or nothing, as the Fail's notice says it (`remedy`, from 2026-10-16). A
    // degree waiting on it is withheld at once, and that notice says what stands.
    const ask = person.school!.awaitingDegree ? '' : ` ${remedy(r, (a) => room(person, a), () => later(person))}`;
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: `Permanent Incomplete: ${r.name}`, body: `The time to make it up ran out, so ${r.name} carries no credit, and the degree can’t be completed without it.${ask}`, importance: 85, route: '/workspace/school' });
    onPermanent(s, person, r);
  });
}
