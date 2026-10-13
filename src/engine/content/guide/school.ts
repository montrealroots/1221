/**
 * SLATE — the guide's reference: staying at school (from 2026-10-12; `content/guide/types.ts`).
 *
 * Seven entries: the School screen and the term's evaluation, a sick day, orientation, a leave and the ways out, a
 * course not passed and the ways to put it right, the Yale account, and work-study. Every rule figure is imported from
 * the rule that sets it (`content/school.ts`, `systems/school.ts`, `systems/courserecord.ts`, `systems/coursework.ts`,
 * and from its verification on 2026-10-12 `systems/permission.ts` for an F-1's grace), and the worked examples count
 * the fall of 2026 on the school's own calendar (`classPeriod`, `labDays`), so a change to a rule or a date changes
 * what these say. The verification also found a make-up session's two hours, the thirty days to ask after a last year
 * and the six terms of tuition support written out in words where the rule exports them; they're read from it now.
 *
 * A few figures the systems keep as bare numbers, exported by nothing, are written out in words here and would drift
 * from their rule unnoticed: classes from nine to three and the evaluation at five on the last class day, the six-hour
 * Saturday shift from ten and the four-hour evening from seven, pay at five on Friday, the Sunday-evening week ahead, a
 * withdrawal's fifteen days and its thirty days of cover (`systems/health.ts`), a leave's reminder two weeks before its
 * notice is due, the dean's decision the next working day, and a conversion processed on the fifteenth.
 *
 * The prose pass later on 2026-10-12 read each entry against the systems as the day's fixes left them. Until then a sick
 * day was said to leave a partner rehearsal, a Cabaret call and a Summer Cabaret call standing (`rehearsalOutcome`,
 * `CABARET_KIND` and `SUMMER_KIND` excuse all three), Call In Sick was said to stay grayed once you'd left, an elective
 * shift was said to be worked on a leave (`shiftRefusal` refuses it), a grave breach was said to dismiss at its term's
 * evaluation on its own, only a missed rehearsal was said to take you out of the casting pool, Yale Health's assessment
 * was said to find the same whether you came or not, a returned scholarship was said to have no due date, a hold's
 * notice was said to send you to the Standing tab, the Terms panel was said to show On Your Yale Account for a waived
 * term, a withdrawal was said to cancel cover back to a spring's insurance term, Call Off The Request was said to act
 * on its first press, and the nine semesters were said to be "in all", where a leave's terms aren't among them.
 *
 * From later on 2026-10-12 the worked examples are played (`tests/guide-examples-school.test.ts`), each on a save of its
 * own through the commands its steps name, and every figure each states is read out of its words and set against what
 * the engine then holds; a floor no save holds, the attendance the faculty ask and a course's pass, is set against the
 * engine's verdicts either side of it. That reaches the few of the bare-number figures above that an example states,
 * classes at nine, the Saturday shift at ten for six hours, the evening from seven to eleven and pay at five on Friday,
 * which no longer drift there unnoticed; where the other parts of an entry write them out, they still can. Every
 * example's figures held against the engine when they were first played, and none of their words changed then. Until
 * the test's review that day this said every figure was read when some weren't: the standing example's days, excused
 * days and calls and shifts and the attendance its result opens with, the hour a sick day is called in and the condition
 * its result says again, the hour registration was slept through, the Incomplete example's pass floor, the meetings and
 * the week its sessions are reckoned from, and the seventh term and its season could each have drifted unnoticed, and
 * the meetings a course needs were held against the guide's own sum where the engine's verdicts now hold them. The review
 * also had the Incomplete example's sessions to press said in words, "twice", where they were "2 times", and its week laid
 * up played, where the flu alone had been.
 */

import { COURSES, EXTENDED_STUDY, LABS, LEAVE_RULES, MANDATORY_LEAVE, ORIENTATION_2026, REQUIRED_PPE, SKILLS, TERM_STARTS_2026_27, WORK_LIMITS, WORK_STUDY, YALE_DRAMA, type SchoolDate } from '../school';
import { CHAPTER_BY_ID } from '../tutorial';
import { formatMoney } from '../../core/money';
import {
  CEILING, DEGREE_DATES, ESTIMATE, NONRESIDENT_SCHOLARSHIP_RATE, STANDING_LABEL, classPeriod, coursesOn, isClassDay, isShiftDay, keyOf, labDays, termAccount, termStart,
} from '../../systems/school';
import { COURSE_RULES } from '../../systems/courserecord';
import { ORIENTATION } from '../../systems/coursework';
import { STATUS_GRACE_DAYS } from '../../systems/permission';
import type { GuideEntry } from './types';

const CHAPTER = CHAPTER_BY_ID['school']!.title;
const OPENED = `From the guide’s chapter “${CHAPTER}”`;
const LOCKED = `Locked, on a guided life, until “${CHAPTER}” has been read.`;
const ROUTE = '/workspace/school';
/** The School screen's tabs (`ui/shell/sections.ts`). */
const TAB = { standing: 'standing', classes: 'classes', coursework: 'coursework', work: 'work', terms: 'terms' } as const;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ORDINAL = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'];
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const word = (n: number): string => WORDS[n] ?? String(n);
/** How many times, in words: once, twice, three times. */
const times = (n: number): string => (n === 1 ? 'once' : n === 2 ? 'twice' : `${word(n)} times`);
const upper = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
/** The terms the tuition scholarship supports, and the first past them, in words. */
const SIX = word(EXTENDED_STUDY.supportedTerms);
const SEVENTH_WORD = ORDINAL[EXTENDED_STUDY.supportedTerms + 1] ?? `${EXTENDED_STUDY.supportedTerms + 1}th`;
/** A make-up session's length, in hours where it's whole. */
const MAKE_UP = (COURSE_RULES.makeUpMinutes as number) === 60 ? 'an hour' : COURSE_RULES.makeUpMinutes % 60 === 0 ? `${word(COURSE_RULES.makeUpMinutes / 60)} hours` : `${COURSE_RULES.makeUpMinutes} minutes`;
const usd = (cents: number): string => formatMoney(cents, 'USD', { cents: cents % 100 !== 0 });
const pct = (share: number): string => `${Math.round(share * 1000) / 10}%`;
const clock = (hour: number): string => (hour === 12 ? 'noon' : hour < 12 ? `${hour} a.m.` : `${hour - 12} p.m.`);
const plusDays = (d: SchoolDate, days: number): SchoolDate => {
  const t = new Date(Date.UTC(d.year, d.month - 1, d.day + days));
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
};
const dated = (d: SchoolDate, year = true): string => `${MONTHS[d.month - 1]} ${d.day}${year ? `, ${d.year}` : ''}`;
const season = (term: number): string => `the ${termStart(term).fall ? 'fall' : 'spring'} of ${termStart(term).date.year}`;

/** Every day of a term's class period, its first class day to its last. */
function classSpan(term: number): SchoolDate[] {
  const p = classPeriod(term);
  const days: SchoolDate[] = [];
  for (let d = p.from; keyOf(d) <= keyOf(p.to); d = plusDays(d, 1)) days.push(d);
  return days;
}

// The first fall, as the calendar has it: the class days, the work-study Saturdays and Drama 50's lab calls.
const FALL = classSpan(0);
const CLASS_DAYS = FALL.filter((d) => isClassDay(0, d)).length;
const SATURDAYS = FALL.filter((d) => isShiftDay(0, d)).length;
const YEAR_SATURDAYS = SATURDAYS + classSpan(1).filter((d) => isShiftDay(1, d)).length;
const LAB_CALLS = labDays(0, 0)?.days.length ?? 0;

// The standing example: days slept through and days called in sick, against the attendance floor.
const SICK_DAYS = 2;
const SLEPT = 8;
const ASKED = CLASS_DAYS - SICK_DAYS + LAB_CALLS + SATURDAYS;
const KEPT = ASKED - SLEPT;
const HOLDS = KEPT / ASKED >= ESTIMATE.attendanceFloor;
const STILL_HOLDS = (KEPT - 2) / ASKED >= ESTIMATE.attendanceFloor;

// The Incomplete example: Acting I's fall meetings, and the make-up sessions a run of excused ones leaves owed.
const ACTING = COURSES.find((c) => c.code === 'DRAM 103a/b') ?? COURSES[0]!;
const ACTING_MEETS = FALL.filter((d) => coursesOn(d).some((c) => c.code === ACTING.code)).length;
const EXCUSED = 15;
const ATTENDED = ACTING_MEETS - EXCUSED;
const PASS_AT = Math.ceil(COURSE_RULES.passFloor * ACTING_MEETS);
const OWED = Math.max(0, Math.ceil((PASS_AT - ATTENDED) / ACTING.perWeek));

// The sick-day example: a first-year's Monday with Acting I at nine and a Drama 50 call in the afternoon. Until its
// verification on 2026-10-12 it was an October Monday with Acting I and a rehearsal call, which no first-year has: the
// chair casts from the first spring.
const weekdayOf = (d: SchoolDate): number => new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
const LAB_MONDAY = labDays(0, 0)?.days.find((d) => weekdayOf(d) === 1 && coursesOn(d).some((c) => c.code === ACTING.code));

// A term's bill, without need: the first term's, and a seventh's, the first past the tuition scholarship's six.
const FIRST = termAccount('USD', false, 0);
const SEVENTH_TERM = YALE_DRAMA.terms;
const SEVENTH = termAccount('USD', false, SEVENTH_TERM);
const PAID_PART = 10_000_00;

// The leave example: a personal leave from the first spring, its length the rule's.
const LEAVE_FROM = 1;
const BACK = LEAVE_FROM + LEAVE_RULES.terms;
const NOTICE_BY = plusDays(termStart(BACK).date, -LEAVE_RULES.noticeWeeks * 7);
/** The fee credited against the cover: the leave's own term's, as `startLeave` credits it. */
const LEAVE_FEE = termAccount('USD', false, LEAVE_FROM).healthPlan;
const AFFILIATE_DUE = LEAVE_RULES.terms * LEAVE_RULES.affiliatePerTerm - LEAVE_FEE;
const FIRST_CLASS = TERM_STARTS_2026_27.fall.year + YALE_DRAMA.terms / 2;
const LENGTH_WORD = ['One Term', 'Two Terms', 'Three Terms'][LEAVE_RULES.terms - 1] ?? `${LEAVE_RULES.terms} Terms`;
const SHARE_WORD = (share: number): string => (share === 1 ? 'all of it' : share === 0.5 ? 'half' : share === 0.25 ? 'a quarter' : pct(share));
const REBATE = LEAVE_RULES.rebate.map(([upTo, share], i) => `${SHARE_WORD(share)} ${i === 0 ? 'within the first' : 'to'} ${pct(upTo)}`).join(', ');
const AFFILIATE_BY = (when: readonly number[]): string => `${MONTHS[when[0]! - 1]} ${when[1]}`;
/**
 * Whether a withdrawal by a term's fifteenth day of classes can reach back to its insurance term's start: only where
 * that start comes before the fifteenth day (`school.withdraw` reaches back only to a start already past). A fall's
 * 1 August does; a spring's 1 February falls after it, so the cover ends on the day.
 */
const insuredFrom = (term: number): SchoolDate => {
  const [m, d] = termStart(term).fall ? LEAVE_RULES.insuranceTermFrom.fall : LEAVE_RULES.insuranceTermFrom.spring;
  return { year: termStart(term).date.year, month: m, day: d };
};
const reachesBack = (term: number): boolean => keyOf(insuredFrom(term)) < keyOf(plusDays(classPeriod(term).from, 15));
const FALL_BACK = reachesBack(0);
const SPRING_BACK = reachesBack(1);
const INSURED_FALL = AFFILIATE_BY(LEAVE_RULES.insuranceTermFrom.fall);
const INSURED_SPRING = AFFILIATE_BY(LEAVE_RULES.insuranceTermFrom.spring);
const WITHDRAWN_EARLY = FALL_BACK && SPRING_BACK
  ? `it’s canceled back to the insurance term’s start, ${INSURED_FALL} or ${INSURED_SPRING}, and care since is billed as uninsured`
  : FALL_BACK
    ? `in a fall it’s canceled back to the insurance term’s start, ${INSURED_FALL}, and care since is billed as uninsured; a spring’s insurance term, from ${INSURED_SPRING}, begins after the fifteenth day, so there it ends that day and nothing is canceled back`
    : SPRING_BACK
      ? `in a spring it’s canceled back to the insurance term’s start, ${INSURED_SPRING}, and care since is billed as uninsured; a fall’s insurance term, from ${INSURED_FALL}, begins after the fifteenth day, so there it ends that day and nothing is canceled back`
      : 'it ends that day, each insurance term beginning after the fifteenth day, and nothing is canceled back';

// The Bulletin's disqualification, in words.
const BY_TERM = Object.entries(EXTENDED_STUDY.disqualify.byTerm).map(([n, most], i) => `${most} by ${i === 0 ? 'the end of the ' : 'the '}${ORDINAL[Number(n)]}${i === 0 ? ' term' : ''}`).join(', ');

// Orientation's sessions, by what each does.
const SESSION = Object.fromEntries(ORIENTATION.map((o) => [o.task, o])) as Record<(typeof ORIENTATION)[number]['task'], (typeof ORIENTATION)[number]>;
const ORIENT_MONTH = MONTHS[ORIENTATION_2026.begins.month - 1];
const FIRST_SESSION = `${ORIENT_MONTH} ${ORIENTATION[0]!.day}`;
const LAST_SESSION = `${ORIENT_MONTH} ${ORIENTATION[ORIENTATION.length - 1]!.day}`;
const CLASSES_BEGIN = dated(ORIENTATION_2026.classesBegin, false);

export const SCHOOL: readonly GuideEntry[] = [
  {
    id: 'school.standing',
    title: 'Your Standing And Classes',
    goal: 'school',
    covers: ['ui.school', 'look.school', 'look.course', 'look.skill'],
    synonyms: ['school screen', 'academic standing', 'term evaluation', 'attendance', 'academic warning', 'academic concern', 'craft against the class', 'class rank', 'timetable', 'skills', 'casting pool'],
    questions: ['How am I doing at school?', 'What does the end-of-term evaluation read?', 'Why did my standing drop?', 'How do I get back to good standing?', 'How do classes grow my craft?', 'Where do I stand against the class?'],
    where: { route: ROUTE, tab: TAB.standing, label: 'School, Standing And Craft' },
    available: `${OPENED}: the School line in Your Affairs on Home, and School on the menu.`,
    short: `The School screen is your place at the ${YALE_DRAMA.name}: your standing, this term’s attendance and growth against the floors the faculty judge, your ${SKILLS.length} skills against the class’s ${YALE_DRAMA.classSize - 1} others, and every evaluation so far. Classes run nine to three on class days, and each grows the skills its courses train. At five on the last day of each term’s classes the faculty evaluate you: fall short anywhere and your standing drops a step; meet everything and you’re back in good standing.`,
    steps: [
      `Open it from Home with the ${YALE_DRAMA.short} button on the School line in Your Affairs, or with School on the menu.`,
      'On Standing And Craft, Your Standing gives Standing, then Attendance This Term and Growth This Term, each with its floor, and a line on whether you’re in the casting pool.',
      'Your Craft Against The Class lists each skill with You, You Can Reach, Class Best, Class Median and Your Place. Press a skill to open it.',
      'Evaluations keeps every term’s result and its reason, and From Your Teachers the last term’s notes.',
      'Under Classes, Your Week is the timetable with the next classes, and the courses table lists each course, its teachers and what it trains. Press a course, or the school’s name at the top, to open it.',
    ],
    needs: ['A life that began at drama school; any other shows No School.', `On a guided life, “${CHAPTER}” read in the guide.`],
    costs: [
      { label: 'Time', value: 'None to read. Classes take nine to three on each class day', estimate: true },
      { label: 'Money', value: `None to read. Tuition, ${usd(FIRST.tuition)} a term in 2026–27, is met by the tuition scholarship for ${EXTENDED_STUDY.supportedTerms} terms` },
    ],
    reads: [
      { label: 'Attendance', value: `Class days, calls and assigned shifts kept, over those asked of you, an excused day left out; under ${pct(ESTIMATE.attendanceFloor)} falls short`, estimate: true },
      { label: 'Growth', value: `Your craft’s rise this term against the class’s middle, each measured by the room left to grow; under ${pct(ESTIMATE.growthFloor)} of the class’s pace falls short`, estimate: true },
      { label: 'Work On Stage', value: `A run with ${ESTIMATE.workNights} nights or more by the evaluation, its nights mostly off, falls short`, estimate: true },
      { label: 'Coursework', value: `With ${ESTIMATE.coursework.shown} or more pieces due, ${pct(ESTIMATE.coursework.unready)} or more of them unready or not shown falls short`, estimate: true },
      { label: 'A Course Failed', value: 'Any course failed in the term falls short' },
      { label: 'A Grave Breach', value: `A missed performance or understudy call: ${STANDING_LABEL.warning} at once, or dismissal from it` },
      { label: 'A Class Meeting', value: `Grows each skill its course trains, more when you come rested and less the nearer the skill is to your reach: each skill as you were admitted and ${CEILING.headroom} points more`, estimate: true },
    ],
    now: ['Opening the screen, a tab or an underlined word changes nothing in the world, and moves no clock.', 'A tab is kept while you’re elsewhere, and the screen opens on it next time.'],
    later: [
      'On each class day at nine, classes meet. Present, awake and in New Haven, each course grows its skills; asleep or away, it’s an absence, unexcused unless you called in sick, were in hospital or were laid up.',
      `At five on the last class day comes the evaluation. Short on any floor and your standing drops a step, ${STANDING_LABEL.good} to ${STANDING_LABEL.concern}, to ${STANDING_LABEL.warning}, to dismissal; meeting them all puts you back in ${STANDING_LABEL.good} and in the casting pool.`,
      'The same evaluation settles each course as passed, Incomplete or failed.',
      `After the last term, in good standing or with a concern and every course passed, the degree comes at Commencement, on the Monday before Memorial Day. A last term ending on warning, and the faculty don’t recommend it. A course not passed, and you have ${EXTENDED_STUDY.requestDays} days to ask to repeat the year or for an additional term before the degree is withheld.`,
      'Every Sunday at six, the next week’s classes and its Saturday shift go on the calendar.',
    ],
    interpret: [
      `Attendance This Term reads None Yet until something has been asked of you, and shows a warning under ${pct(ESTIMATE.attendanceFloor)}.`,
      'Growth This Term says whether you’re ahead of, in line with or behind the class for the room each of you had. Pace is what’s judged: the class’s strongest, near their reach, aren’t marked down for fewer points.',
      `Your Place counts the classmates above you, 1 to ${YALE_DRAMA.classSize}. Overall is the mean of all ${SKILLS.length} skills, and Acting is scene study twice with character work and emotional depth.`,
      'A line below the stats says whether you’re in the casting pool, or out of it after missed calls, until a good evaluation.',
      'Each Evaluations row has the term’s attendance, your growth and the class’s, and why the standing came out as it did.',
      `The school’s own look gives the year you’re in and Terms Begun, how many of the program’s ${YALE_DRAMA.terms} terms have begun: the calendar’s less those a leave or a repeated year took, which its note counts apart, as it does an additional term. On a leave it counts the terms before the one the leave began in, since that one is taken again when you’re back, and the year you’re in is read from the same count.`,
    ],
    unavailable: [
      'No School: this life didn’t begin at drama school.',
      LOCKED,
      'After a dismissal, a withdrawal or the degree, Classes has no classes ahead and Casting no production.',
    ],
    mistakes: [
      'Asleep or out of New Haven at nine is an unexcused absence. Unwell, Call In Sick before the classes run.',
      'Standing drops one step at an evaluation, and one term meeting every floor takes it back to good standing from concern or warning.',
      `A grave breach goes to ${STANDING_LABEL.warning} at once, or from it to dismissal, and keeps its term’s evaluation from good standing: on its own the evaluation leaves you on the warning it brought, and with anything else short it dismisses. Be in New Haven for every performance and night on call.`,
      `A rehearsal, a run-through or a lab missed unexcused, when the term’s missed calls reach ${ESTIMATE.missedCallsOut}, takes you out of the casting pool until a good evaluation, and a notice says so. A missed performance counts among them, and is a grave breach besides.`,
      'A dismissal is final: the Bulletin readmits nobody it dismissed.',
    ],
    related: ['school.sick', 'school.repeat', 'school.leave', 'craft.profile', 'productions.casting', 'coursework.feedback'],
    connections: [
      { to: 'school.sick', kind: 'evaluation', why: 'A day called in sick is left out of the attendance the evaluation reads.' },
      { to: 'productions.nights', kind: 'evaluation', why: `A run’s nights are read at the term’s evaluation once it has had ${ESTIMATE.workNights}.` },
      { to: 'coursework.feedback', kind: 'evaluation', why: `The term’s coursework, as shown, is read at the evaluation: with ${ESTIMATE.coursework.shown} or more pieces due, ${pct(ESTIMATE.coursework.unready)} or more unready or not shown falls short.` },
      { to: 'productions.casting', kind: 'immediate', why: 'A good evaluation puts you back in the pool the chair casts from.' },
      { to: 'school.repeat', kind: 'scheduled', why: 'The evaluation settles each course as passed, Incomplete or failed, and an Incomplete or a Fail is what making up and repeating put right.' },
      { to: 'craft.profile', kind: 'immediate', why: 'Each class grows its skills, and a share of the abilities they’re kin to.' },
      { to: 'body.how', kind: 'evaluation', why: 'How rested you come sets how much a class grows you.' },
    ],
    example: {
      setup: `Your first fall: ${CLASS_DAYS} class days, ${LAB_CALLS} Drama 50 lab calls and ${SATURDAYS} assigned Saturday shifts.`,
      steps: [
        `You sleep through ${SLEPT} class days, call in sick on ${SICK_DAYS}, and keep every lab and shift.`,
        `Asked of you: ${CLASS_DAYS} days less the ${SICK_DAYS} excused, and ${LAB_CALLS + SATURDAYS} calls and shifts, ${ASKED} in all. Kept: ${KEPT}.`,
        `Attendance comes to ${pct(KEPT / ASKED)}, against a floor of ${pct(ESTIMATE.attendanceFloor)}.`,
      ],
      result: `At ${pct(KEPT / ASKED)} the floor is ${HOLDS ? 'met' : 'missed'}. Sleep through two more days and it comes to ${pct((KEPT - 2) / ASKED)}, ${STILL_HOLDS ? 'still over it, and your standing holds' : `under it: with every other part met, your standing still drops a step, from ${STANDING_LABEL.good} to ${STANDING_LABEL.concern}`}.`,
    },
  },
  {
    id: 'school.sick',
    title: 'Calling In Sick',
    goal: 'school',
    covers: ['school.call_in_sick'],
    synonyms: ['sick day', 'call in sick', 'excused absence', 'flu', 'unwell', 'too ill for class'],
    questions: ['How do I call in sick?', 'Why can’t I call in sick today?', 'Does a sick day count against me?', 'What does a sick day excuse?'],
    where: { route: ROUTE, tab: TAB.classes, label: 'School, Classes, Your Week' },
    available: `${OPENED}, on any day with something at school, until it has run; not once you’ve left the School.`,
    short: `Call In Sick excuses today at school when you’re unwell. The day’s classes, rehearsal and performance calls, a night on call, labs, work-study shift, Cabaret and Summer Cabaret calls, and a rehearsal booked with a classmate are marked excused, and an excused day is left out of the attendance the faculty judge. It takes a body that’s unwell: condition under ${ESTIMATE.sickBelow}, the flu, or an injury that limits the work. Well enough to go, it’s refused, and staying away is an absence.`,
    steps: [
      'Open School, then Classes.',
      'Press Call In Sick on the Your Week panel. It shows on any day with something at school, until you’ve left the School; where it can’t be used it’s grayed, and its reason shows under the panel’s title.',
      'On a class day, press it before nine. If the clock stops at nine for the classes, press Stand Here, then Call In Sick.',
    ],
    needs: [
      `Unwell: condition under ${ESTIMATE.sickBelow}, the flu, or an injury that limits the body or the mind (a cut or a knock limits neither).`,
      'Something at school today: classes, a rehearsal or performance call, a lab, a shift, or a Cabaret or Summer Cabaret call.',
      'On a day with only classes, the classes not yet run; and no sick day called already today.',
    ],
    costs: [{ label: 'Time', value: 'None: a message to the School, and the clock doesn’t move' }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'Your Condition', value: `Under ${ESTIMATE.sickBelow} is unwell enough`, estimate: true },
      { label: 'The Flu', value: 'Down with it, you’re sick whatever your condition reads' },
      { label: 'An Injury', value: 'One that limits the body or the mind, as a doctor’s note would excuse' },
      { label: 'Today At School', value: 'What’s on your calendar today, by New Haven’s day, and whether the classes have run' },
    ],
    now: ['Today is kept as your sick day; the rest of it is yours.', 'A toast says you called in sick and today’s absence is excused.'],
    later: [
      'At nine the classes count you excused: each course marks the meeting excused and the term an excused day, and work due at that meeting moves to the course’s next one, or is excused if none is left this term.',
      'A rehearsal or performance call, a night on call or a lab that day is excused: not counted as missed, and no breach. Blocking set without you is still a gap in the book to catch up.',
      'Called in after the classes have run, on a day with a call still to come, it excuses the call and leaves the classes as they were counted.',
      'An assigned Saturday shift is excused, and its hours can be converted to grant aid if you’re on aid; an elective evening is dropped and its hours freed.',
      `Each class day missed ill counts toward Yale Health’s concern: ${pct(MANDATORY_LEAVE.excusedShare)} or more of a term’s class days, once ${MANDATORY_LEAVE.minClassDays} have passed, and it asks to assess you.`,
      'A Cabaret or Summer Cabaret call that day is excused as a School call is: the blocking an evening sets without you is still a gap to catch up, a show missed so isn’t held against your run record, and the summer company keeps you.',
      'A rehearsal booked with a classmate that day is excused: they’re told you’re ill, and don’t hold it against you.',
    ],
    interpret: [
      'Attendance This Term, on Standing And Craft, counts the day among the excused.',
      'A day in hospital, or laid up by an injury, is excused without calling in.',
      'Grayed, the button gives its reason under the panel’s title, and when you point at it: well enough to go, already called in, or the classes have run.',
    ],
    unavailable: [
      '“You’re not at school.”: the button stops showing once you’ve left.',
      '“You’ve called in sick today already.”',
      '“There’s nothing at school today to miss.”: the button doesn’t show on such a day.',
      '“Today’s classes have been and gone; calling in sick now excuses nothing.”',
      '“You’re well enough to go: staying away would be an unexcused absence.”',
      LOCKED,
    ],
    mistakes: [
      'Calling in after the classes have run, on a day with nothing else, is refused: they’ve already counted you. Call in first thing.',
      'Counting on a sick day for a rehearsal booked with a classmate on a day with nothing else at school: Call In Sick needs something else there, so the rehearsal stands unless you’re in hospital, laid up, or, for partner work in a studio, too hurt to train. Call it off on Coursework a day or more ahead, or it’s short notice and costs their trust.',
      'A sick day excuses the absence and doesn’t make you well. Rest and sleep do, and too many excused meetings leave a course Incomplete.',
    ],
    related: ['school.standing', 'body.how', 'papers.doctor', 'school.repeat', 'school.shifts', 'coursework.partners'],
    connections: [
      { to: 'body.how', kind: 'prerequisite', why: `Condition under ${ESTIMATE.sickBelow}, the flu or a limiting injury is what lets you call in.` },
      { to: 'school.standing', kind: 'evaluation', why: 'An excused day is left out of the attendance the term’s evaluation reads.' },
      { to: 'school.repeat', kind: 'history', why: 'Each meeting missed ill is kept as excused on the course’s record; enough of them make it Incomplete.' },
      { to: 'school.shifts', kind: 'scheduled', why: 'A Saturday shift that day is excused when it comes, and its hours can be converted to grant aid.' },
      { to: 'school.leave', kind: 'scheduled', why: 'Most of a term’s class days missed ill brings Yale Health’s assessment, which can end in a medical leave.' },
      { to: 'productions.part', kind: 'scheduled', why: 'A rehearsal call that day is excused when it comes, and still leaves the blocking set without you to catch up from the book.' },
      { to: 'coursework.partners', kind: 'scheduled', why: 'A rehearsal booked with a classmate that day is excused when it comes, and costs none of their trust.' },
    ],
    example: {
      setup: `A first-year’s Monday${LAB_MONDAY ? `, ${dated(LAB_MONDAY)}` : ''}, down with the flu at condition ${ESTIMATE.sickBelow + 15}, with a call for ${LABS.drama50.name} at ${clock(LABS.from)} after ${ACTING.name} and the day’s other classes at nine.`,
      steps: ['At eight, open School, Classes, and press Call In Sick.', 'Sleep the day through.'],
      result: `The classes count you excused, ${ACTING.name}’s meeting among them, and the lab call is excused, not counted as missed, and kept as excused on the lab’s own course record. Without the flu, at condition ${ESTIMATE.sickBelow + 15}, the button would have said you’re well enough to go.`,
    },
  },
  {
    id: 'school.orientation',
    title: 'Orientation Week',
    goal: 'school',
    covers: ['school.orientation'],
    synonyms: ['orientation', 'first week', 'registration', 'register for classes', 'meeting your class', 'catch up a session', 'building tour'],
    questions: ['What happens in the first week?', 'I missed a session: can I catch it up?', 'Why don’t my classes count me?', 'When am I registered?'],
    where: { route: ROUTE, tab: TAB.coursework, label: 'School, Coursework, Orientation' },
    available: `A first-year’s first week, ${FIRST_SESSION} to ${LAST_SESSION}, ${OPENED.charAt(0).toLowerCase()}${OPENED.slice(1)}; a life that starts after classes have begun has it behind it.`,
    short: `The first week has ${ORIENTATION.length} sessions in New Haven, one each morning from ${FIRST_SESSION} to ${LAST_SESSION}. Registration lets classes count you and work-study pay you; meeting your class lets you ask them to rehearse; the faculty set out what the School asks, kept on the screen either way; the tour opens the studios and the library to your preparation; and the courses session sets your first work. In New Haven and awake when one starts, it happens. Missed, Catch Up does it later, for the session’s length.`,
    steps: [
      'Be in New Haven and awake at each session: it’s on the calendar, and the clock stops at it and asks.',
      'Go, and it runs its length and says what it did.',
      'Missed one? Open School, then Coursework. The Orientation panel lists each session; press Catch Up beside one whose time has passed.',
    ],
    needs: [
      'A first-year who arrived before the sessions.',
      'For Catch Up: in New Haven, out of hospital, free now, and clear of anything you’re expected at before the session’s length would end.',
    ],
    costs: [
      { label: 'Time', value: `Each session’s length: ${ORIENTATION.map((o) => `${o.label}, ${o.minutes} minutes`).join('; ')}. Catch Up moves the clock on by the same`, estimate: true },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'Where You Are', value: 'In New Haven and awake when it starts; in hospital, it’s missed and waits to be caught up' },
      { label: 'The Session’s Time', value: 'Catch Up opens only once its time has passed' },
      { label: 'Your Calendar', value: 'Catch Up needs the session’s length clear of anything you’re expected at' },
    ],
    now: [
      `${SESSION.register.label}: you’re registered, so classes count you and shifts can be worked, and you’re told what tuition, Yale Health and work-study come to.`,
      `${SESSION.classmates.label}: you’ve met every classmate, and can ask any of them to rehearse.`,
      `${SESSION.faculty.label}: you meet the chair and your teachers, and they set out what the School asks. What The School Asks, on Standing And Craft, lists it whether you went or not; going adds the day it was set out, and changes nothing else.`,
      `${SESSION.tour.label}: the studios and the Haas Arts Library open to your preparation.`,
      `${SESSION.expectations.label}: the first-year fall courses set their first work, so you can start before classes.`,
    ],
    later: [
      `Unregistered when classes begin on ${CLASSES_BEGIN}, each class day counts you absent, unexcused, and a shift can’t be worked, until registration is caught up. From the second term on, every student counts as registered.`,
      'A classmate you haven’t met, you meet at the first class you’re at.',
      'A session done stays done.',
    ],
    interpret: [
      'Each line reads Done with its date, On The Calendar while it’s ahead, or Catch Up once it’s past and undone.',
      'A grayed Catch Up gives its reason beside it.',
      'A session’s notice, or Catch Up’s toast, says what it told you or arranged.',
    ],
    unavailable: [
      '“Orientation is behind you.”: the life began after the first week.',
      '“Done on …”',
      '“Its session is still ahead on the calendar.”',
      '“Orientation is in New Haven.”',
      '“Not from a hospital bed.”',
      'At something else, or due somewhere before it would end: it names what, and when.',
    ],
    mistakes: [
      `Sleeping through ${SESSION.register.label} costs most: classes don’t count you until it’s caught up. Catch it up before ${CLASSES_BEGIN}.`,
      'Catching up takes the session’s whole length, so leave room for it.',
    ],
    related: ['coursework.prepare', 'coursework.partners', 'school.standing', 'school.shifts'],
    connections: [
      { to: 'school.standing', kind: 'prerequisite', why: 'Until registration is done, every class day counts you absent, unexcused.' },
      { to: 'school.shifts', kind: 'prerequisite', why: 'Work-study’s I-9 is done at registration; unregistered, a shift is missed and can’t be converted.' },
      { to: 'coursework.partners', kind: 'prerequisite', why: 'A classmate you haven’t met can’t be asked to rehearse; meeting your class meets them all.' },
      { to: 'coursework.prepare', kind: 'immediate', why: 'The tour opens the studios and the library, and the courses session sets the first work.' },
      { to: 'day.calendar', kind: 'scheduled', why: 'Each session is a commitment on the calendar, and the clock stops at it.' },
    ],
    example: {
      setup: `A new life in New Haven, asleep at ${clock(SESSION.register.hour)} on ${FIRST_SESSION}.`,
      steps: [`The clock reaches ${SESSION.register.label} at ${clock(SESSION.register.hour)} while you sleep, so it’s missed.`, 'At noon, open School, Coursework, and press Catch Up beside it.'],
      result: `The clock moves on ${SESSION.register.minutes} minutes and you’re registered, so the classes from ${CLASSES_BEGIN} count you. Left undone, each of them would count you absent, unexcused.`,
    },
  },
  {
    id: 'school.leave',
    title: 'Leave, Withdrawal And Coming Back',
    goal: 'school',
    covers: ['school.request_leave', 'school.cancel_leave', 'school.return_notice', 'school.appeal_leave', 'school.reregister', 'school.buy_affiliate', 'school.withdraw'],
    synonyms: ['leave of absence', 'medical leave', 'personal leave', 'mandatory leave', 'withdraw from school', 'notice of return', 'affiliate cover', 'appeal to the dean', 'register again', 'drop out', 'time off'],
    questions: ['How do I take a leave of absence?', 'What happens to my health cover on leave?', 'How do I come back from a leave?', 'Can I appeal a leave the dean imposed?', 'What happens if I withdraw?', 'Why must I register again?'],
    where: { route: ROUTE, tab: TAB.standing, label: 'School, Standing And Craft, A Leave Of Absence' },
    available: `${OPENED}; a leave once your first term has begun, a withdrawal while you’re at school.`,
    short: `A leave takes you out of the program for a time and brings you back with the class a year below. Ask for a medical or a personal one, and the chair and the dean decide within ${LEAVE_RULES.decideWorkingDays} working days. On leave you have no aid, classes, calls or assigned shifts; Yale Health goes on for a medical leave, and a personal one can buy Affiliate cover. Give notice ${LEAVE_RULES.noticeWeeks} weeks before the term you return, or the leave ends in dismissal, then register again. Withdrawing gives up your place for good.`,
    steps: [
      'Open School, Standing And Craft. Under A Leave Of Absence, choose the Kind, Medical or Personal, then the Length and the Reason.',
      'Press Ask For A Leave…, read what it would do, and press Ask. Until it begins, Call Off The Leave… and then Call It Off keeps you as you are.',
      'On leave, press Give Notice Of Return before its date. On a personal leave, Buy Affiliate Cover… and then Buy It, before its deadline, to keep Yale Health.',
      'Back for the return term, press Register before classes.',
      'If the dean imposed a medical leave, press Appeal To The Dean while the appeal is open.',
      'To leave for good, press Withdraw From The School…, read what it does, and press Withdraw; Stay backs out.',
    ],
    needs: [
      'Your first term begun, and no leave asked for, granted or under way.',
      `A personal leave: a term completed, every course current (no Incomplete or failed course open), and not on an F-1. Asked by the ${LEAVE_RULES.personalByClassDay}th day of a term’s classes, it begins when granted; after that, with the next term.`,
      `A medical leave: something a Yale Health physician would see in the last ${LEAVE_RULES.medicalLookbackDays} days (an illness, an injury, care or a stay in hospital), or condition under ${ESTIMATE.sickBelow} now.`,
      `Leave left: the Bulletin allows ${LEAVE_RULES.maxTerms} terms in all, and a length must bring you back in the season you left.`,
      'Back from a medical leave: a physician’s clearance, so out of hospital, not laid up, past the flu and well enough.',
    ],
    costs: [
      { label: 'Asking', value: `None; decided within ${LEAVE_RULES.decideWorkingDays} working days, or by the term it begins with if that comes first`, estimate: true },
      { label: 'Affiliate Cover', value: `${usd(LEAVE_RULES.affiliatePerTerm)} a term for a personal leave, all paid at once, less the term’s Yale Health fee where the leave began after the first day of classes; the School pays on a medical leave` },
      { label: 'Aid Returned', value: `A leave begun mid-term charges the term’s living scholarship back to your Yale account on the rebate schedule, ${REBATE} of the term’s classes, and none after. It’s due ${EXTENDED_STUDY.dueDays} days after the leave begins, as a term’s bill is`, estimate: true },
      { label: 'Withdrawing', value: 'Free. Within fifteen days of a term’s first class day, a Yale Health premium paid from your bank comes back', estimate: false },
    ],
    reads: [
      { label: 'When It Begins', value: `Medical, when granted; personal, when granted if asked before classes or by the ${LEAVE_RULES.personalByClassDay}th class day, and after that with the next term; either, with the next term once the term’s evaluation is past` },
      { label: 'Its Length', value: 'One, two or three terms, back in the season you left, since the acting courses run fall to spring', estimate: true },
      { label: 'A Physician’s View', value: `Illness, injury, care or a hospital stay in the last ${LEAVE_RULES.medicalLookbackDays} days, or condition under ${ESTIMATE.sickBelow}`, estimate: true },
      { label: 'Your Status', value: 'On an F-1 a personal leave is refused; a medical leave extends the I-20 a year' },
      { label: 'Yale Health’s Concern', value: `${MANDATORY_LEAVE.stays} hospital stays in ${MANDATORY_LEAVE.lookbackDays} days, or ${pct(MANDATORY_LEAVE.excusedShare)} of at least ${MANDATORY_LEAVE.minClassDays} class days missed ill, looked at on each class day you miss ill`, estimate: true },
    ],
    now: [
      'Asking puts it with the chair and the dean, and the decision goes on the calendar.',
      'Calling it off ends the request, and you stay as you are.',
      'Notice given, you’re expected back, and the return term begins for you.',
      'Affiliate cover bought: Yale Health covers you back to the day student cover ended, and care had in between is billed again as Yale Health pays it.',
      'Registering lets classes count you again and shifts be worked.',
      'Withdrawing ends your place today: classes, calls, shifts and coursework stop, hours worked are still paid, and your class goes on without you.',
    ],
    later: [
      'Granted, a leave begins that day or with its term. Courses in progress are left unfinished, to take again; castings and any Cabaret show end; and on a personal leave Yale Health’s student cover ends the day it begins, or, begun by the end of the first day of classes, back to the insurance term’s start with the term’s fee refunded.',
      'A personal leave is decided on where you stand then: an Incomplete or a course not passed by the decision, and it’s refused.',
      `Notice is due ${LEAVE_RULES.noticeWeeks} weeks before the return term, with a reminder two weeks before that. Given, you’re back at the term’s start in the class a year below, and must register; not given, the leave ends in dismissal.`,
      `Affiliate cover for a personal leave can be bought until ${AFFILIATE_BY(LEAVE_RULES.affiliateBy.fall)} for a fall leave or ${AFFILIATE_BY(LEAVE_RULES.affiliateBy.spring)} for a spring one, or ${LEAVE_RULES.affiliateDays} days from asking, whichever is later.`,
      `Yale Health’s assessment comes ${MANDATORY_LEAVE.assessWorkingDays} working days after its concern is raised, for ${MANDATORY_LEAVE.assessMinutes} minutes. If you’re neither in New Haven and awake for it nor in hospital, it recommends a leave on that alone: the Bulletin names not coming as a ground of its own. If it recommends a leave, the dean decides the next working day. Where you came, nothing is imposed if you’re managing by then; where you didn’t, the leave is imposed however well you are. You then have ${MANDATORY_LEAVE.appealDays} days to appeal, decided in ${MANDATORY_LEAVE.appealDecideWorkingDays} working days.`,
      `Withdrawn within fifteen days of a term’s first class day, Yale Health’s cover ends: ${WITHDRAWN_EARLY}. Withdrawn later, Yale Health covers you thirty days more. On an F-1, ${STATUS_GRACE_DAYS.withdrawn} days’ grace and no OPT.`,
    ],
    interpret: [
      'Your Leave shows a leave while it’s With The Chair And The Dean, “Granted, Not Yet Begun” or On Leave. From and Back For give the terms. Once it’s over, Leaves Before keeps it with how it ended.',
      'A Length marked (Not Possible) says why under the choices: one or three terms would bring you back to the second halves of year-long courses.',
      `An appeal succeeds only if you’re cleared and at least ${pct(MANDATORY_LEAVE.resumeWithin)} of the term’s classes are still ahead; the leave stands while it’s heard.`,
      `Used, at the foot of the panel, counts the terms of leave you’ve had out of ${LEAVE_RULES.maxTerms}; Leaves Before keeps every leave and how it ended.`,
      'Yale Health’s assessment shows above the leave while it’s scheduled or being decided. Whether you came to it is kept on its finding: not coming is a finding of its own, “You didn’t come to the assessment, which the Bulletin names as a ground of its own.”, and the appeal is the way back from the leave it brings.',
    ],
    unavailable: [
      '“A leave is from the program, and your first term hasn’t begun.”',
      '“Your request is with the chair and the dean, decided by …”, “Your leave is granted, from …” or “You’re on leave.”',
      '“Your request to repeat the year is being decided.”, “Your terms are done; what’s left is the degree.” or “Your terms in the program are done.”',
      '“A personal leave comes after one term completed.”',
      '“A personal leave asks you to be current with your requirements…”, naming the Incomplete to make up or the course not passed.',
      '“The School doesn’t normally grant a leave to take on a professional commitment.”',
      '“On an F-1, a personal leave ends your status …”',
      `“A medical leave is on a Yale Health physician’s written recommendation, and nothing in the last ${LEAVE_RULES.medicalLookbackDays} days would bring one …”`,
      `“You’ve had N terms of leave; the Bulletin allows ${LEAVE_RULES.maxTerms} in all.”`,
      'Notice: “Its deadline has passed.”, or after a medical leave, why a physician can’t clear you yet.',
      'Register: “A financial hold stops registration: … is owed on your Yale account.”',
      'Affiliate cover: “The School pays for your Affiliate cover.” on a medical leave, or “It could be bought until …”.',
      'Appeal: “Only a leave the dean imposed can be appealed.” or “The appeal had to be in by …”.',
    ],
    mistakes: [
      'Missing the notice date is a dismissal, and a dismissal is final. Give notice as soon as you know; after a medical leave, be well enough to be cleared by then.',
      'A personal leave with no Affiliate cover leaves you uninsured, and care in that time is billed as uninsured until you buy it.',
      'Withdrawing can’t be undone here: the Bulletin lets a student who withdrew apply to come back, and SLATE doesn’t model it.',
      'A leave is refused while a repeat is being decided, or once your terms are done. Settle those first.',
      'Sleeping through Yale Health’s assessment, or being away from New Haven at its hour: on that alone it recommends a leave, and the dean imposes it however well you are. Only the appeal undoes it.',
    ],
    related: ['school.repeat', 'school.money', 'papers.health-cover', 'documents.work', 'school.standing'],
    connections: [
      { to: 'papers.health-cover', kind: 'immediate', why: 'A personal leave ends Yale Health’s student cover; Affiliate cover keeps it.' },
      { to: 'school.money', kind: 'immediate', why: 'A leave begun mid-term charges part of the term’s living scholarship back to your Yale account.' },
      { to: 'school.standing', kind: 'scheduled', why: 'No notice of return by its date, and the leave ends in dismissal.' },
      { to: 'school.repeat', kind: 'history', why: 'Courses left on a leave are kept as Left On Leave and taken again on return.' },
      { to: 'body.how', kind: 'prerequisite', why: `A medical leave needs a reason a physician would see, and coming back needs condition ${ESTIMATE.sickBelow} or more.` },
      { to: 'documents.work', kind: 'immediate', why: `On an F-1, a medical leave extends the I-20 a year once it begins, and withdrawing leaves ${STATUS_GRACE_DAYS.withdrawn} days’ grace and no OPT.` },
      { to: 'productions.casting', kind: 'immediate', why: 'A leave ends the term’s castings and any Cabaret show; what was played stays credited.' },
    ],
    example: {
      setup: `A first-year in ${season(LEAVE_FROM)}, no need found and every course passed, asks on the fifth class day for a personal leave.`,
      steps: [
        `Kind Personal, Length ${LENGTH_WORD}, Reason Personal; Ask For A Leave…, then Ask.`,
        `The chair and the dean grant it ${LEAVE_RULES.decideWorkingDays} working days later, and it begins that day.`,
        `Buy Affiliate Cover…: ${LEAVE_RULES.terms} terms at ${usd(LEAVE_RULES.affiliatePerTerm)}, less the ${usd(LEAVE_FEE)} Yale Health fee you paid for the term.`,
        `Give Notice Of Return by ${dated(NOTICE_BY)}.`,
      ],
      result: `The spring’s courses are left to take again, the cover costs ${usd(AFFILIATE_DUE)}, and you’re back on ${dated(termStart(BACK).date)} with the class of ${FIRST_CLASS + Math.round(LEAVE_RULES.terms / 2)}, registering before classes. Without the notice, the leave would have ended in dismissal on ${dated(NOTICE_BY, false)}.`,
    },
  },
  {
    id: 'school.repeat',
    title: 'Repeating, Extra Terms And Incompletes',
    goal: 'school',
    covers: ['school.request_repeat', 'school.cancel_repeat', 'school.request_extra_term', 'school.make_up', 'school.extend_incomplete'],
    synonyms: ['incomplete', 'make up a session', 'repeat the year', 'failed course', 'additional term', 'permanent incomplete', 'month more', 'retake a course', 'disqualification', 'degree withheld'],
    questions: ['What happens if I fail a course?', 'How do I make up an Incomplete?', 'Can I repeat a year?', 'What’s an additional term?', 'Why was my degree withheld?', 'Can an Incomplete be extended?'],
    where: { route: ROUTE, tab: TAB.standing, label: 'School, Standing And Craft, Courses And The Degree' },
    available: `${OPENED}: an Incomplete after a term’s evaluation, a repeat at a year’s end, an additional term after the last year’s.`,
    short: `Each course is settled at the term’s evaluation as passed, Incomplete or failed, and the degree needs every one passed. An Incomplete comes of classes missed excused: make it up in ${COURSE_RULES.makeUpMinutes}-minute sessions with its teachers within ${COURSE_RULES.incompleteDays} days, extendable once by as long, or it becomes a Permanent Incomplete. A failed course is put right by repeating its year, once, on the chair’s and the dean’s approval, or after the last year by an additional term that retakes only what’s unpassed. Repeating is SLATE’s faculty model: the Bulletin has no rule for it.`,
    steps: [
      'Open School, Standing And Craft. Courses And The Degree lists each Incomplete with its sessions left and its deadline.',
      'Press Make Up A Session for each session owed; Ask For A Month More moves the deadline once.',
      'At a year’s end with a course failed, Finishing The Degree offers Ask To Repeat The Year…: read what it would do, then press Ask. While it’s pending, Call Off The Request… says what calling it off would leave; Call It Off withdraws it, and Keep It keeps it.',
      'After the last year with a course unpassed, press Ask For An Additional Term to retake only those.',
      'Every Course, folded at the foot of Courses And The Degree, lists each attempt and how it ended.',
    ],
    needs: [
      `A make-up session: an Incomplete whose deadline is ${MAKE_UP} or more away, in New Haven, out of hospital, and ${MAKE_UP} free.`,
      `A repeat: the spring’s evaluation past and the next year not yet begun (after the last year, within ${EXTENDED_STUDY.requestDays} days of it), a course failed that year, no leave under way and no additional term asked for, that year not repeated before, and ${EXTENDED_STUDY.maxSemesters} semesters at most with the repeat’s two and the terms still to come, a leave’s terms not among them.`,
      `An additional term: after the last year’s evaluation and within its ${EXTENDED_STUDY.requestDays} days, a course unpassed, ${EXTENDED_STUDY.maxSemesters} semesters enrolled at most with it, and no disqualification standing.`,
    ],
    costs: [
      { label: 'A Make-Up Session', value: `${COURSE_RULES.makeUpMinutes} minutes, the clock moved on; each makes up a week of the course’s meetings`, estimate: true },
      { label: 'Asking', value: `None; decided in ${EXTENDED_STUDY.decideWorkingDays} working days`, estimate: true },
      { label: `A Term Past ${upper(SIX)}`, value: `Tuition and Yale Health billed to your Yale account: ${usd(SEVENTH.tuition)} and ${usd(SEVENTH.healthPlan)} in ${season(SEVENTH_TERM)}`, estimate: true },
    ],
    reads: [
      { label: 'A Course’s Pass', value: `${pct(COURSE_RULES.passFloor)} or more of the meetings you weren’t excused from, and, where two or more pieces were due, more than half of them shown`, estimate: true },
      { label: 'An Incomplete', value: `Passed on the meetings you weren’t excused from, but at under ${pct(COURSE_RULES.passFloor)} of all of them` },
      { label: 'Sessions Owed', value: `What it takes to reach ${pct(COURSE_RULES.passFloor)} of the meetings, a week’s meetings a session`, estimate: true },
      { label: 'Disqualification', value: `The Bulletin’s: ${EXTENDED_STUDY.disqualify.inOneTerm} Fails in a term, ${BY_TERM}, or ${EXTENDED_STUDY.disqualify.total} in all` },
      { label: 'Semesters', value: `The degree within ${EXTENDED_STUDY.maxSemesters} semesters enrolled, with tuition support for ${EXTENDED_STUDY.supportedTerms}. A leave’s terms aren’t enrolled ones and don’t count toward them: a leave has its own limit, ${LEAVE_RULES.maxTerms} terms in all` },
    ],
    now: [
      `A session made up moves the clock ${MAKE_UP} on; the course passes once every session owed is done.`,
      `Extended, the deadline moves ${COURSE_RULES.incompleteDays} days on, with a new reminder.`,
      'Asking to repeat, or for an additional term, puts it with the chair and the dean, and the decision goes on the calendar.',
      'Calling off a repeat ends the request at once.',
    ],
    later: [
      `A reminder comes ${COURSE_RULES.remindDays} days before an Incomplete is due; at the deadline it becomes a Permanent Incomplete, with no credit.`,
      'A repeat granted: from the next term you take that year’s courses again with the class a year below. What you did the first time stays on the record, and the degree reads the pass. On an F-1, the I-20 runs a year longer.',
      `A repeat refused, past ${EXTENDED_STUDY.maxSemesters} semesters or under a disqualification: after the last year, the degree is withheld.`,
      `An additional term granted: in it you take only the retakes, with the class then in that year. Passed in a fall, the degree comes at Yale’s December conferral on ${MONTHS[DEGREE_DATES.december[0] - 1]} ${DEGREE_DATES.december[1]}; in a spring, at Commencement.`,
      `After the last year’s evaluation with a course unpassed, you have ${EXTENDED_STUDY.requestDays} days to ask for either, or the degree is withheld. With neither open to you, it’s withheld at the evaluation.`,
      'At an evaluation where the Bulletin’s count of Fails is reached, with a Fail the faculty haven’t judged before, they review it. Already on warning, reviewed before, or with no room to repeat, you’re dismissed; otherwise you’re placed on warning, the year to be repeated, and the Fails they kept you through don’t stand against the repeat or an additional term.',
      'An Incomplete still open at Commencement keeps you from the ceremony, and the degree comes once it’s made up in time.',
    ],
    interpret: [
      'Each Incomplete reads how many of its make-up sessions are left, and by when.',
      'A failed course says why: the meetings you were at, or the work not shown.',
      'Every Course marks each attempt Passed, Incomplete, Not Passed, Permanent Incomplete, Left On Leave or In Progress.',
      'Finishing The Degree says where a request stands: with the chair and the dean, granted, refused and why, or called off.',
    ],
    unavailable: [
      '“There’s no Incomplete in that course to make up.”, “Its month has run out.” or “Its teachers are in New Haven.”',
      '“It’s been extended once already.”: Ask For A Month More then stops showing.',
      '“A year is repeated from its end, after the spring’s evaluation.”',
      '“Every course this year was passed: there’s nothing to repeat it for.”',
      '“SLATE’s faculty don’t approve year N a second time.”',
      '“Not with a leave under way.”',
      '“Repeating would make N semesters, past the nine the Bulletin allows for the degree.”, and for an additional term “It would make N semesters, past the nine the Bulletin allows.”: semesters enrolled, a leave’s terms left out.',
      '“The next year has begun.” or “Its thirty days have run out.”',
      '“An additional term comes after your last year’s evaluation, for what it left unpassed.”',
      '“The faculty’s disqualification stands against it.”',
    ],
    mistakes: [
      `Leaving make-up sessions to the last week: each takes ${MAKE_UP}, and a busy week leaves no room. Start as soon as the Incomplete is set.`,
      `Calling off a pending repeat without reading what Call Off The Request… says it leaves: after a middle year you go on with the course not passed, and the degree can’t be completed without it; after the last year, the degree is withheld unless you ask again within its ${EXTENDED_STUDY.requestDays} days.`,
      'A course left on a leave is taken again on return, so no repeat is asked for it.',
      `Missing the ${EXTENDED_STUDY.requestDays} days after the last year withholds the degree: ask for one path or the other in time.`,
    ],
    related: ['school.standing', 'school.sick', 'school.money', 'school.leave'],
    connections: [
      { to: 'school.standing', kind: 'evaluation', why: 'A course failed in a term keeps that term short of good standing.' },
      { to: 'school.money', kind: 'scheduled', why: `A repeated year or an additional term past ${SIX} terms is billed to your Yale account.` },
      { to: 'school.sick', kind: 'history', why: 'Meetings missed ill are kept as excused, and enough of them make an Incomplete, not a Fail.' },
      { to: 'school.leave', kind: 'optional', why: 'A leave is refused while a repeat is pending, and courses left on a leave are retaken on return.' },
      { to: 'documents.work', kind: 'scheduled', why: 'On an F-1, a repeat or an additional term extends the I-20 a year when it’s granted.' },
    ],
    example: {
      setup: `Laid up and then down with the flu, you’re excused from ${EXCUSED} of ${ACTING.name}’s ${ACTING_MEETS} fall meetings and come to the rest.`,
      steps: [
        `At the evaluation ${ACTING.name} has you at ${ATTENDED} of ${ACTING_MEETS}: every meeting you weren’t excused from, so it isn’t failed.`,
        `Under ${pct(COURSE_RULES.passFloor)} of all ${ACTING_MEETS}, it’s Incomplete. Reaching ${PASS_AT} needs ${PASS_AT - ATTENDED} more meetings, and at ${ACTING.perWeek} a week that comes to ${OWED} make-up sessions.`,
        `Press Make Up A Session ${times(OWED)} within ${COURSE_RULES.incompleteDays} days.`,
      ],
      result: `${ACTING.name} passes, made up after an Incomplete, and the degree no longer waits on it. Leave the sessions undone and at the deadline it becomes a Permanent Incomplete, which only a repeated year or an additional term puts right.`,
    },
  },
  {
    id: 'school.money',
    title: 'What You Owe The School',
    goal: 'school',
    covers: ['school.request_aid_review', 'school.pay_balance', 'school.request_conversion'],
    synonyms: ['yale account', 'financial hold', 'late fee', 'tuition bill', 'aid review', 'grant aid', 'convert hours', 'seventh term', 'balance owed'],
    questions: ['What do I owe Yale?', 'Why is there a hold on my account?', 'How do I pay my Yale account?', 'Will Yale pay for a seventh term?', 'Can missed work-study hours become aid?'],
    where: { route: ROUTE, tab: TAB.terms, label: 'School, Terms And Award, Your Yale Account' },
    available: `${OPENED}: the account once anything is billed to it, a review with a ${SEVENTH_WORD} term coming, conversion for a student on aid.`,
    short: `Tuition is met for ${EXTENDED_STUDY.supportedTerms} terms by the tuition scholarship, so your Yale account usually owes nothing. It’s charged for a term past those ${EXTENDED_STUDY.supportedTerms}, for a scholarship returned on a leave, and for late fees, and Pay From Your Bank settles it. Unpaid past its due date, a financial hold stops registration and the diploma, and a late fee is added each month. Ask For An Aid Review asks the aid office to support a term past ${EXTENDED_STUDY.supportedTerms}, and a student on aid can ask for work-study hours missed ill to be converted to grant aid.`,
    steps: [
      'Open School, Terms And Award. Your Yale Account shows what each term bills and credits and, once anything is billed, Owed On Your Yale Account, Financial Hold and Terms Enrolled.',
      'Type an amount in Pay (Blank Pays It All), or leave it blank, and press Pay From Your Bank.',
      `With a ${SEVENTH_WORD} term coming, press Ask For An Aid Review.`,
      'On Shifts And Pay, press Ask For Conversion To Grant Aid when Convertible To Grant Aid shows hours.',
    ],
    needs: [
      'To pay: something owed, no more than it, and a bank that can cover it.',
      `An aid review: ${SIX} terms enrolled, or a repeat or an additional term granted; one review a student.`,
      'Conversion: need found by Yale’s assessment, not on leave, and hours to convert.',
    ],
    costs: [
      { label: `A Term Past ${upper(SIX)}`, value: `${usd(SEVENTH.tuition)} tuition and ${usd(SEVENTH.healthPlan)} for Yale Health in ${season(SEVENTH_TERM)}, due in ${EXTENDED_STUDY.dueDays} days`, estimate: true },
      { label: 'Late Fee', value: `${usd(EXTENDED_STUDY.lateFee)} a month while it’s owed, to ${usd(EXTENDED_STUDY.lateFeeTermCap)} a term` },
      { label: 'Paying', value: 'From your bank, at once, with no time taken' },
      { label: 'Grant Aid', value: `${usd(WORK_STUDY.hourly)} for each hour converted, up to ${WORK_LIMITS.convertibleHours} hours a year, taxed as a scholarship` },
    ],
    reads: [
      { label: 'The Balance', value: 'The sum of the account’s postings: what was charged, less what was paid or credited' },
      { label: 'Need', value: 'Yale’s assessment of your family’s means; a family that rules need out leaves no living aid and no hours to convert' },
      { label: 'The Aid Office', value: `An exception to ${SIX} terms of tuition support only where you’ve had a medical leave; living aid, which meets the term’s Yale Health fee, kept only where need was found`, estimate: true },
      { label: 'Hours To Convert', value: `Assigned hours excused ill or hurt this year, and from the spring the hours never assigned (paid at May’s processing, not January’s), to ${WORK_LIMITS.convertibleHours} less any converted` },
    ],
    now: [
      'A payment moves from your bank onto the account at once; paid in full, a hold lifts, and a degree waiting on it is conferred.',
      `An aid review goes to the aid office, decided in ${EXTENDED_STUDY.decideWorkingDays} working days.`,
      `A conversion is booked for the next processing, the 15th of ${WORK_LIMITS.convertMonths.map((m) => MONTHS[m - 1]).join(' or ')}.`,
    ],
    later: [
      `Still owed ${EXTENDED_STUDY.dueDays} days after a term is billed, or after a leave returns a scholarship to it, the account goes on a financial hold with a ${usd(EXTENDED_STUDY.lateFee)} late fee, then another each month while it’s owed, to ${usd(EXTENDED_STUDY.lateFeeTermCap)} a term.`,
      'Held at a term’s start, you must register again once it’s paid; until then classes don’t count you and shifts can’t be worked.',
      'Held at Commencement, the diploma waits until it’s paid.',
      `The aid review’s answer is read when the next term begins. With an exception, its tuition isn’t billed and the term runs as one of the first ${SIX}; with need found, living aid goes on either way and meets the term’s Yale Health fee. A term billed before the answer isn’t credited back.`,
      `Converted hours are paid into your bank as grant aid on the processing day; for a nonresident on an F-1, ${pct(NONRESIDENT_SCHOLARSHIP_RATE)} is withheld for tax.`,
      'A credit left on the account is refunded to your bank.',
    ],
    interpret: [
      'Owed On Your Yale Account shows a warning when anything is owed; Financial Hold gives the day it began.',
      'The table lists the account’s last twelve lines, each charged, or paid or credited.',
      'Convertible To Grant Aid reads Not On Aid where no need was found; otherwise the hours, and what they’d come to.',
      `Each Term ends Paid To Your Bank where need was found and Paid From Your Bank where it wasn’t, a term past ${SIX} included where the aid office granted an exception. A term past ${SIX} without one shows On Your Yale Account: its tuition, and its Yale Health fee too unless the review kept your living aid, which then meets the fee, and the term ends Paid To Your Bank as well.`,
      `Terms Enrolled counts the terms you’ve been enrolled in, the figure the degree’s ${EXTENDED_STUDY.maxSemesters} semesters are read against; a leave’s terms aren’t among them.`,
      'A hold’s notice, and a held diploma’s, says to pay on the Terms And Award tab, where Your Yale Account and Pay From Your Bank are.',
      `A scholarship returned on a leave is due ${EXTENDED_STUDY.dueDays} days after the leave begins, as a term’s bill is, and the “Your Leave Has Begun” notice gives the date. Unpaid by then, it brings the hold and the late fee.`,
      'Figures here are the dollars Yale bills; the screen shows them in your save’s money.',
    ],
    unavailable: [
      '“Your Yale account owes no balance.”, “Pay something.”, “… is owed; pay that or less.” or “Your bank can’t cover it.”',
      '“Support past six terms is reviewed once a seventh is coming: you’re within the six.”',
      '“It’s with the aid office, decided by …” or “The aid office has reviewed your support.”',
      '“Conversion to grant aid is for students on financial aid, and no need was found for you.”',
      '“Not while on leave: a student on leave has no aid.”',
      '“Your request is in, for the next processing.”',
      '“No hours to convert: …”',
    ],
    mistakes: [
      `Leaving a term’s bill, or a scholarship a leave returned, past its ${EXTENDED_STUDY.dueDays} days: the hold stops registration at the next term and the diploma at the end. Pay before it’s due.`,
      `Asking for the aid review once the ${SEVENTH_WORD} term has begun: that term is already billed and isn’t credited back. Ask as soon as the extra term is granted.`,
      'A shift missed by staying away can’t be converted: only hours missed ill or hurt, or never assigned.',
    ],
    related: ['school.repeat', 'school.leave', 'school.shifts', 'bank.accounts', 'taxes.return'],
    connections: [
      { to: 'school.repeat', kind: 'prerequisite', why: `A repeated year or an additional term past ${SIX} terms is what bills tuition to the account.` },
      { to: 'school.leave', kind: 'evaluation', why: `The aid office grants tuition past ${SIX} terms only to a student who has had a medical leave.` },
      { to: 'school.shifts', kind: 'prerequisite', why: 'Assigned hours excused ill or hurt are the hours conversion turns into grant aid.' },
      { to: 'bank.accounts', kind: 'immediate', why: 'Payments come out of your bank, and grant aid and refunds go into it.' },
      { to: 'taxes.return', kind: 'history', why: 'Grant aid is a taxable scholarship, kept for the year’s return.' },
      { to: 'school.standing', kind: 'scheduled', why: 'A hold at a term’s start means registering again before classes count you.' },
    ],
    example: {
      setup: `A repeated third year puts you in a ${SEVENTH_WORD} term, ${season(SEVENTH_TERM)}, with no aid review asked for.`,
      steps: [
        `The term begins: ${usd(SEVENTH.tuition)} tuition and ${usd(SEVENTH.healthPlan)} for Yale Health go on your Yale account, due in ${EXTENDED_STUDY.dueDays} days.`,
        `You pay ${usd(PAID_PART)} from your bank, leaving ${usd(SEVENTH.tuition + SEVENTH.healthPlan - PAID_PART)}.`,
        'The due date passes.',
      ],
      result: `A financial hold begins with a ${usd(EXTENDED_STUDY.lateFee)} late fee, and another comes each month to ${usd(EXTENDED_STUDY.lateFeeTermCap)} for the term. Paying the rest lifts the hold at once.`,
    },
  },
  {
    id: 'school.shifts',
    title: 'Work-Study Shifts',
    goal: 'school',
    covers: ['school.take_shift', 'school.buy_ppe'],
    synonyms: ['work-study', 'front of house', 'elective shift', 'saturday crew', 'protective equipment', 'steel-toed shoes', 'payday', 'weekly hours cap'],
    questions: ['How does work-study pay?', 'How do I take an elective shift?', 'Do I need the protective equipment?', 'When am I paid?', 'What happens if I miss a shift?'],
    where: { route: ROUTE, tab: TAB.work, label: 'School, Shifts And Pay, Work-Study' },
    available: `${OPENED}, while you’re at school and not on a leave; an elective evening only while a term’s classes run.`,
    short: `Every student works. The School books you a six-hour shift on each Saturday of the class weeks, up to ${WORK_STUDY.assignedHours} assigned hours a year, and Take An Elective Shift books a four-hour evening front of house at Yale Rep, of which the Bulletin asks at least ${WORK_STUDY.electiveHours} hours a year. Hours are paid at ${usd(WORK_STUDY.hourly)} an hour on the Friday after, into your bank as wages. The Saturday crew needs the required protective equipment, ${usd(REQUIRED_PPE.cost)}, bought here or at your first shift.`,
    steps: [
      'Open School, then Shifts And Pay.',
      'Press Take An Elective Shift: it books the first free evening from tomorrow, seven to eleven, and the toast says when.',
      'Press Buy The Protective Equipment before your first Saturday, or it’s bought there from your bank.',
      'Be in New Haven and awake when a shift begins. The next six are listed under the stats; press one to open it.',
    ],
    needs: [
      'At school, not on a leave, and registered: unregistered, a shift can’t be worked.',
      `An elective evening: one free in the next two weeks, inside a term’s classes, clear of everything you’re expected at and of nights on call, and within Yale’s cap of ${WORK_LIMITS.weekHours} hours a week in term.`,
      `The Saturday crew: the protective equipment, or ${usd(REQUIRED_PPE.cost)} in the bank when the shift begins.`,
    ],
    costs: [
      { label: 'An Assigned Shift', value: 'A Saturday of the class weeks, 10 a.m. to 4 p.m., six hours', estimate: true },
      { label: 'An Elective Shift', value: 'An evening, 7 to 11 p.m., four hours', estimate: true },
      { label: 'Protective Equipment', value: `${usd(REQUIRED_PPE.cost)}, once` },
      { label: 'Energy', value: `${ESTIMATE.energy.shift} a shift`, estimate: true },
      { label: 'Pay', value: `${usd(WORK_STUDY.hourly)} an hour, by direct deposit` },
    ],
    reads: [
      { label: 'The Week’s Hours', value: `Work-study shifts booked and worked, Monday to Sunday, against Yale’s cap: ${WORK_LIMITS.weekHours} hours from a term’s first class day to its last, and ${WORK_LIMITS.recessWeekHours} outside them. The Monday-to-Sunday week is SLATE’s` },
      { label: 'Where You Are', value: 'In New Haven, awake and out of hospital when it begins' },
      { label: 'A Sick Day', value: 'Called in, or in hospital or laid up: the shift is excused' },
      { label: 'The Risk Of Injury', value: 'Each hour carries its work’s risk at BLS’s rates, the crew’s higher than front of house' },
    ],
    now: [
      'Booked: the evening goes on your calendar, and Elective Hours Asked For rises by four.',
      `Bought: ${usd(REQUIRED_PPE.cost)} from your bank, and Protective Equipment reads Bought.`,
    ],
    later: [
      'Worked, the hours go into Owed On Friday and are paid the Friday after at five, through Yale’s payroll, so your bank counts them as wages.',
      'An assigned shift missed asleep, away, or sent home without the equipment counts against your attendance at the evaluation.',
      'An elective evening missed is unpaid and frees its hours, and doesn’t count against you.',
      'A shift that would pass the week’s cap is worked to the cap, or called off if the week is full, and not held against you.',
      'Excused ill, an assigned shift’s hours can be converted to grant aid if you’re on aid.',
      'Leaving the School, on a leave or for good, hours already worked are still paid.',
    ],
    interpret: [
      `Assigned Hours Booked climbs as each Saturday is booked; the class weeks of 2026–27 hold ${YEAR_SATURDAYS} Saturdays.`,
      `Elective Hours Asked For counts the hours of evenings booked and not missed, from each fall. The Bulletin’s minimum is ${WORK_STUDY.electiveHours}; the screen shows the count, and no rule reads whether you reach it.`,
      'Owed On Friday is the hours worked since the last payday, at the rate.',
      'This Week’s Hours shows the week’s work-study shifts, booked and worked, against the cap. Its note says all Yale jobs together; work-study is the only one it counts.',
    ],
    unavailable: [
      '“You’re not at school.”: the button stops showing once you’ve left.',
      '“You’re on leave: no shifts until you’re back.”: on a leave it shows in place of the button.',
      `“No free evening in the next two weeks within Yale’s cap of ${WORK_LIMITS.weekHours} hours a week in term, across all your Yale jobs.”`,
      '“No free evening in the term in the next two weeks.”: outside a term’s classes, in the summer or between terms, the Rep is dark.',
      `Protective equipment: “It’s ${formatMoney(REQUIRED_PPE.cost, 'USD')}, which the bank can’t cover.” Bought already, or out of school, the button doesn’t show.`,
    ],
    mistakes: [
      'Counting on buying the equipment at the shift with an empty bank: the supervisor sends you home, and the shift counts as missed. Buy it when the money’s there.',
      'Booking on an evening you wanted: it takes the first free one, so check the date it gives. Leaving it unworked frees the hours, unpaid.',
      'A first-year who missed registration can’t work: catch it up under Orientation on Coursework.',
    ],
    related: ['school.money', 'school.standing', 'school.sick', 'bank.accounts', 'taxes.return'],
    connections: [
      { to: 'school.standing', kind: 'evaluation', why: 'Assigned shifts kept or missed are part of the attendance the term’s evaluation reads.' },
      { to: 'bank.accounts', kind: 'scheduled', why: 'Friday’s pay goes into your bank as wages, and the equipment comes out of it.' },
      { to: 'school.money', kind: 'optional', why: 'Assigned hours missed ill or hurt can be converted to grant aid by a student on aid.' },
      { to: 'taxes.return', kind: 'history', why: 'Work-study wages are income on the year’s return.' },
      { to: 'body.how', kind: 'immediate', why: `A shift takes ${ESTIMATE.energy.shift} energy, and can hurt you at its work’s rate.` },
      { to: 'school.orientation', kind: 'prerequisite', why: 'Registration does work-study’s I-9; unregistered, a shift is missed.' },
    ],
    example: {
      setup: 'Your first assigned Saturday, the equipment not yet bought, and a Tuesday evening booked on the Monday after.',
      steps: [
        `At ten on Saturday you’re in New Haven: the equipment is bought there, ${usd(REQUIRED_PPE.cost)} from your bank, and you work six hours.`,
        'Tuesday, seven to eleven, front of house: four hours.',
        'Friday at five is payday.',
      ],
      result: `Friday pays ${usd(10 * WORK_STUDY.hourly)} for the ten hours, into your bank as wages. With no money for the equipment on Saturday, you’d have been sent home, the shift missed and counted against your attendance.`,
    },
  },
];
