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
 *
 * The guide’s audit of 2026-10-13 read the entries against that day’s fixes. Until then they left out a make-up session
 * refused when its month runs out before the session would end (`makeUpRefusal`), a repeat and an additional term each
 * refused beside the other (`repeatRefusal`, `extraRefusal`), and two of the three ways a conversion is refused for no
 * hours (`conversionRefusal`); they said a repeat’s semesters were those enrolled, where they count the year’s two again
 * and the program’s terms still to come (`withRepeat`), and that hours never assigned counted from the spring, where they
 * count only in May before its processing (`unassignedKnown`); Elective Hours Asked For still counted, as they read, an
 * evening a leave or leaving the School called off, which `callOff` takes out; and the injury row said nothing of the
 * workers’ compensation a shift’s injury brings, whose figures are read from Connecticut’s rule now.
 *
 * Later on 2026-10-13 a make-up session and a month more were refused a student who has left the School, in its words
 * (`makeUpRefusal`, `extendRefusal`), and “Its month has run out.” and “Its teachers are in New Haven.”, which no play
 * reached, went: until then the entry listed both and said a session needed New Haven, where every student is.
 * “Orientation is in New Haven.” went the same day (`orientationRefusal`), reached by no play either; until then the
 * orientation entry listed it, and said Catch Up needed New Haven.
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
import { WORKERS_COMP } from '../injury';
import type { GuideEntry } from './types';
import { FAMILIES, findsNeed, newLifeConfig, wealthIn, withFamily } from '../../world/bootstrap';

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
/** Workers’ compensation where a work-study shift is worked (`mayHurt`: New Haven is in Connecticut), as the productions entries read it. */
const CT_COMP = WORKERS_COMP.states['us-ct']!;
/**
 * Connecticut’s minimum, a fifth of its maximum, and the week under which it’s the share of the whole wage (CGS
 * 31-307(a); `compWeekly`). Until 2026-10-13 the entry said every week was paid after income tax, which it was until
 * that day’s fix of the minimum; a week of term’s 19 hours is under it.
 */
const CT_MINIMUM = Math.round(CT_COMP.max * (CT_COMP.minShareOfMax ?? 0));
const CT_MINIMUM_UNDER = Math.round(CT_MINIMUM / CT_COMP.share);
/**
 * The most a week of shifts pays: they’re booked only in a term’s class period (`isShiftDay`, `school.take_shift`), where
 * Yale’s cap is 19 hours, so $437 at $23, under the $473.60 below which Connecticut pays its share of the whole wage.
 * Until 2026-10-13 the entry went on to say a bigger week was paid after income tax, which no week of shifts reached
 * (found by that day’s third round of defects).
 */
const CT_WEEK_MOST = WORK_LIMITS.weekHours * WORK_STUDY.hourly;

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

// The family chosen at creation, beside the background (from 2026-10-14: until then every new life's was wealthy, and
// the entries said need as if a player could have it): which families Yale finds need for, by the rule `hasNeed` reads
// (`findsNeed`), and what each puts in the bank on the first morning.
const FAMILY_WORD = (w: string): string => upper(w);
const NEEDY = FAMILIES.filter((w) => findsNeed(withFamily(newLifeConfig(), w)));
const MEANS = FAMILIES.filter((w) => !NEEDY.includes(w));
const or = (words: readonly string[]): string => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} or ${words.at(-1)}`);
const AIDED = termAccount('USD', true, 0);
const FAMILY_MONEY = FAMILIES.map((w) => { const m = wealthIn(w, 'USD'); return `${FAMILY_WORD(w)}, ${formatMoney(m.checking, 'USD', { cents: false })} in checking and ${formatMoney(m.savings, 'USD', { cents: false })} in savings`; }).join('; ');

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
    short: `Your standing is how the faculty judge each term, and it decides whether you stay, whether you’re cast and whether you get your degree. Classes run nine to three on class days, and each grows the skills its course trains. At five on the last day of each term’s classes the faculty review the term. Fall short of anything they ask and your standing drops a step, from ${STANDING_LABEL.good} to ${STANDING_LABEL.concern}, then ${STANDING_LABEL.warning}, then dismissal; meet everything and you’re back in ${STANDING_LABEL.good}. The School screen shows where you stand, how this term is going, your ${SKILLS.length} skills against the other ${YALE_DRAMA.classSize - 1} students in your class, and every review so far.`,
    steps: [
      `Open School from the menu, or press ${YALE_DRAMA.short} on the School line in Your Affairs on Home.`,
      // Coursework This Term from 2026-10-16: until then the review's third measure had no figure on the tab.
      'Standing And Craft opens first. Under Your Standing are Standing, Attendance This Term, Growth This Term and Coursework This Term, each with what’s asked, and a line saying whether you’re in the casting pool.',
      'Your Craft Against The Class lists each skill with You, You Can Reach, Class Best, Class Median and Your Place. Press a skill to open it.',
      'Term Reviews keeps every term’s review: its standing, attendance, growth, coursework and why. From Your Teachers keeps last term’s notes, written by the game, not by the teachers.',
      'On the Classes tab, Your Week is the timetable with the next classes, and the courses table lists each course, its teachers and what it trains. Press a course, or the school’s name at the top, to open it.',
    ],
    needs: ['A life that began at drama school. Any other life shows No School.', `On a guided life, the guide’s chapter “${CHAPTER}” read first.`],
    costs: [
      { label: 'Time', value: 'None to read. Classes take nine to three on each class day', estimate: true },
      { label: 'Money', value: `None to read. Tuition, ${usd(FIRST.tuition)} a term in 2026–27, is met by the tuition scholarship for ${EXTENDED_STUDY.supportedTerms} terms` },
    ],
    reads: [
      { label: 'Attendance', value: `The class days, calls and assigned shifts you came to, out of those asked of you, leaving out days you were excused. Under ${pct(ESTIMATE.attendanceFloor)} is short`, estimate: true },
      { label: 'Growth', value: `How much your craft grew this term against the middle of the class, allowing for the room each of you had to grow. Under ${pct(ESTIMATE.growthFloor)} of the class’s pace is short`, estimate: true },
      { label: 'Work On Stage', value: `A run with ${ESTIMATE.workNights} nights or more by the review, most of them off, is short`, estimate: true },
      { label: 'Coursework', value: `Once ${ESTIMATE.coursework.shown} or more pieces are due, ${pct(ESTIMATE.coursework.unready)} or more of them Unready or not shown is short`, estimate: true },
      // Whose each rule is, said from 2026-10-16 (the owner's brief: “distinguish verified institutional policy from SLATE's
      // simulation design”): until then these two read as the School's own. From 2026-10-17 (brief 14) “the game’s rule”,
      // where they said “SLATE’s rule”.
      { label: 'A Course Failed', value: 'Any course failed in the term is short. This is the game’s rule; the Bulletin lets the faculty act on a student’s progress at any time' },
      { label: 'A Grave Breach', value: `A missed performance or understudy call, which the Bulletin calls a grave breach that may be grounds for dismissal, puts you on ${STANDING_LABEL.warning} at once, or dismisses you if you’re on it already. This is the game’s rule` },
      { label: 'A Class Meeting', value: `Grows each skill its course trains: more when you come rested, and less the nearer the skill is to your reach (the skill as you were admitted, plus ${CEILING.headroom} points)`, estimate: true },
    ],
    now: ['Opening the screen, a tab or an underlined word changes nothing and moves no clock.', 'The screen remembers the tab you were on, and opens on it next time.'],
    later: [
      'Classes meet at nine on each class day. If you’re there, awake and in New Haven, each course grows its skills. Asleep or away, it’s an absence, and an unexcused one unless you called in sick, were in hospital or were laid up.',
      `At five on the last class day the faculty review the term. Short on anything they ask and your standing drops a step, from ${STANDING_LABEL.good} to ${STANDING_LABEL.concern}, to ${STANDING_LABEL.warning}, to dismissal. Meeting everything puts you back in ${STANDING_LABEL.good} and in the casting pool.`,
      'The same review settles each course as passed, Incomplete or failed.',
      `After the last term, the degree is conferred at Commencement, on the Monday before Memorial Day, if you’ve passed every course and are in good standing or have a notice of concern. If the last term ends with you on academic warning, the faculty don’t recommend the degree. With a course not passed, you have ${EXTENDED_STUDY.requestDays} days to ask to repeat the year or for an additional term; if you don’t, the degree isn’t recommended.`,
      'Every Sunday at six, the next week’s classes and Saturday shift go on your calendar.',
    ],
    interpret: [
      `Attendance This Term reads None Yet until something has been asked of you, and shows a warning under ${pct(ESTIMATE.attendanceFloor)}.`,
      'Growth This Term says whether you’re ahead of, in line with or behind the class, allowing for the room each of you had to grow. It’s the pace that counts, so the strongest in the class, close to their reach, aren’t marked down for gaining fewer points.',
      `Your Place counts the classmates above you, from 1 to ${YALE_DRAMA.classSize}. Overall is the average of all ${SKILLS.length} skills, and Acting counts scene study twice, with character work and emotional depth.`,
      'A line under the figures says whether you’re in the casting pool, or out of it after missed calls until a review finds you in good standing.',
      `Coursework This Term counts this term’s pieces that were due, shown or missed without an excuse, and how many of them were Unready or not shown, as the review will count them. It shows a warning once ${ESTIMATE.coursework.shown} or more are due and half of them are.`,
      // From 2026-10-16 (brief 09's journeys): until then a graduate's tab read each figure “This Term” with its floor
      // ahead, “In the casting pool.”, and “Only the terms to come stand between you and the degree.”
      'Once the School has ended, by the degree, a withdrawal, a dismissal or the degree not recommended, the three figures read Last Term, each with what was asked, the casting pool’s line goes, and Courses And The Degree says how it ended: every course passed and the day the degree was conferred, or how you left and what you didn’t pass. You can’t ask for anything more. A course the School ended in the middle of reads Not Finished.',
      'Each Term Reviews row shows the term’s attendance, your growth and the class’s, its coursework as the review counted it, and why your standing came out as it did.',
      'Whose rules these are: the four standings, the faculty’s majority vote on the degree and no return after a dismissal are the Bulletin’s (2026–27 pp.151, 154, 157). One review a term at the end of its classes, what it asks, and a standing that moves one step at a time are the game’s reading of a Bulletin that has the faculty evaluate regularly and act at any time. The notices that tell you your standing are the game’s words for the faculty’s decision, not the School’s or its staff’s.',
      `The school’s own page gives the year you’re in and Terms Begun: how many of the program’s ${YALE_DRAMA.terms} terms have begun. It leaves out terms a leave or a repeated year took, which its note counts separately, as it does an additional term. On a leave it counts the terms before the one the leave began in, since you take that one again when you’re back, and the year you’re in comes from the same count.`,
    ],
    unavailable: [
      'No School: this life didn’t begin at drama school.',
      LOCKED,
      'After a dismissal, a withdrawal or the degree, Classes shows no classes ahead and Casting no production.',
    ],
    mistakes: [
      'Being asleep or out of New Haven at nine is an unexcused absence. If you’re unwell, press Call In Sick before the classes run.',
      'Your standing drops one step at a review, and one term that meets everything asked takes it back to good standing from a notice of concern or academic warning.',
      `A grave breach puts you on ${STANDING_LABEL.warning} at once, or dismisses you if you’re on it already, and stops that term’s review putting you back in good standing: on its own it leaves you on the warning it brought, and with anything else short the review dismisses you. Be in New Haven for every performance and every night on call.`,
      `A rehearsal, a run-through or a lab missed without an excuse is a missed call. When the term’s missed calls reach ${ESTIMATE.missedCallsOut}, you’re out of the casting pool until a review finds you in good standing, and a notice says so. A missed performance counts among them, and is a grave breach as well.`,
      'A dismissal is final: the Bulletin doesn’t readmit a dismissed student. Its notice, like the notice that the degree isn’t recommended, says what stays: every course and its result on your record, the productions you played on your Profile, the hours you worked paid; and that you can still practice, and tape the practice briefs, outside the School.',
      // Said from 2026-10-16: until then the Not Registered notice told a student under a hold to register, which the hold refused.
      // And from 2026-10-16 (brief 09's journeys) a term's living-expense scholarship pays the account first, lifting a hold it clears.
      'A term that begins under a financial hold counts you absent from classes until you register, and the hold stops you registering. Pay your Yale account on the Terms And Award tab first, then press Register on the Standing And Craft tab, or the term’s classes go by as unexcused absences. A term’s living-expense scholarship pays what the account owes before any of it reaches your bank, and a hold it clears lifts as the term begins. The Not Registered notice says what’s owed.',
    ],
    next: [
      'Be awake and in New Haven at nine on each class day, and press Call In Sick on the Classes tab when you’re unwell.',
      'Keep an eye on Coursework This Term, and prepare each piece on the Coursework tab before it’s due.',
      'If a notice of concern or a warning comes, read its reason under Term Reviews and work on what it names before the next review.',
    ],
    related: ['school.sick', 'school.repeat', 'school.leave', 'craft.profile', 'productions.casting', 'coursework.feedback'],
    connections: [
      { to: 'school.sick', kind: 'evaluation', why: 'A day you call in sick is left out of the attendance the review counts.' },
      { to: 'productions.nights', kind: 'evaluation', why: `Once a run has had ${ESTIMATE.workNights} nights, the term’s review counts how they went.` },
      { to: 'coursework.feedback', kind: 'evaluation', why: `The review counts the term’s coursework as shown: once ${ESTIMATE.coursework.shown} or more pieces are due, ${pct(ESTIMATE.coursework.unready)} or more Unready or not shown is short.` },
      { to: 'productions.casting', kind: 'immediate', why: 'A review that finds you in good standing puts you back in the pool the chair casts from.' },
      { to: 'school.repeat', kind: 'scheduled', why: 'The review settles each course as passed, Incomplete or failed, and making up or repeating is how you put an Incomplete or a failed course right.' },
      { to: 'craft.profile', kind: 'immediate', why: 'Each class grows its skills, and some of the abilities they’re related to.' },
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
    short: `When you’re unwell, Call In Sick excuses today at school, so the day doesn’t count against your attendance. It covers everything at school that day: classes, rehearsal and performance calls, a night on call, labs, a work-study shift, Cabaret and Summer Cabaret calls, and a rehearsal booked with a classmate. You have to be unwell for it: condition under ${ESTIMATE.sickBelow}, the flu, or an injury that limits the work. If you’re well enough to go, it’s refused, and staying away counts as an unexcused absence.`,
    steps: [
      'Open School, then the Classes tab.',
      'Press Call In Sick on the Your Week panel. It shows on any day with something at school, until you’ve left the School. When it can’t be used it’s grayed, with the reason under the panel’s title.',
      'On a class day, press it before nine. If the clock stops at nine for the classes, press Stand Here, then Call In Sick.',
    ],
    needs: [
      `To be unwell: condition under ${ESTIMATE.sickBelow}, the flu, or an injury that limits the body or the mind (a cut or a knock limits neither).`,
      'Something at school today: classes, a rehearsal or performance call, a lab, a shift, or a Cabaret or Summer Cabaret call.',
      'On a day with only classes, the classes not yet over; and not having called in sick already today.',
    ],
    costs: [{ label: 'Time', value: 'None: it’s a message to the School, and the clock doesn’t move' }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'Your Condition', value: `Under ${ESTIMATE.sickBelow} counts as unwell`, estimate: true },
      { label: 'The Flu', value: 'With the flu, you’re sick whatever your condition reads' },
      { label: 'An Injury', value: 'One that limits the body or the mind, as a doctor’s note would excuse' },
      { label: 'Today At School', value: 'What’s on your calendar today, by New Haven’s day, and whether the classes are over' },
    ],
    now: ['Today is marked as your sick day, and the rest of it is yours.', 'A message confirms you called in sick and that today’s absence is excused.'],
    later: [
      'At nine the classes count you as excused: each course marks the meeting excused, the term counts an excused day, and work due at that meeting moves to the course’s next one, or is excused if none is left this term.',
      'A rehearsal or performance call, a night on call or a lab that day is excused: it isn’t counted as missed, and isn’t a breach. Blocking set without you is still a gap in the book to catch up on.',
      'Called in after the classes are over, on a day with a call still to come, it excuses the call and leaves the classes as they were counted.',
      'An assigned Saturday shift is excused, and if you’re on aid you can convert its hours to grant aid. An elective evening is dropped and its hours freed.',
      `Each class day you miss ill counts toward Yale Health’s concern: once ${MANDATORY_LEAVE.minClassDays} class days have passed, missing ${pct(MANDATORY_LEAVE.excusedShare)} or more of a term’s class days brings a request to assess you.`,
      'A Cabaret or Summer Cabaret call that day is excused as a School call is: blocking an evening sets without you is still a gap to catch up on, a show missed this way isn’t held against your run, and the summer company keeps you.',
      'A rehearsal booked with a classmate that day is excused: they’re told you’re ill, and don’t hold it against you.',
    ],
    interpret: [
      'Attendance This Term, on Standing And Craft, counts the day among those excused.',
      'A day in hospital, or laid up by an injury, is excused without calling in.',
      'When the button is grayed, its reason shows under the panel’s title and when you point at it: you’re well enough to go, you’ve already called in, or the classes are over.',
    ],
    unavailable: [
      '“You’re not at school.”: the button stops showing once you’ve left.',
      '“You’ve called in sick today already.”',
      '“There’s nothing at school today to miss.”: the button doesn’t show on such a day.',
      '“Today’s classes are over, so calling in sick now wouldn’t excuse anything.”',
      '“You’re well enough to go. Staying away would count as an unexcused absence.”',
      LOCKED,
    ],
    mistakes: [
      'You can’t call in after the classes are over on a day with nothing else at school: the classes have already counted you. Call in first thing.',
      'Counting on a sick day for a rehearsal booked with a classmate on a day with nothing else at school: Call In Sick needs something else at school, so the rehearsal stands unless you’re in hospital, laid up, or too hurt to train for partner work in a studio. Call it off on the Coursework tab a day or more ahead, or it’s short notice and costs their trust.',
      'A sick day excuses the absence but doesn’t make you well. Rest and sleep do, and too many excused meetings leave a course Incomplete.',
    ],
    next: [
      'Rest: sleep, eat and look after yourself until your condition is back over the line.',
      'If you missed a rehearsal call, press Catch Up The Blocking on the Casting tab to learn it from the book.',
      'If many class days go by ill, watch the course record on Standing And Craft: an Incomplete is made up there.',
    ],
    related: ['school.standing', 'body.how', 'papers.doctor', 'school.repeat', 'school.shifts', 'coursework.partners'],
    connections: [
      { to: 'body.how', kind: 'prerequisite', why: `Condition under ${ESTIMATE.sickBelow}, the flu or a limiting injury is what lets you call in.` },
      { to: 'school.standing', kind: 'evaluation', why: 'An excused day is left out of the attendance the term’s review counts.' },
      { to: 'school.repeat', kind: 'history', why: 'Each meeting missed ill stays on the course’s record as excused, and enough of them make it Incomplete.' },
      { to: 'school.shifts', kind: 'scheduled', why: 'A Saturday shift that day is excused when it comes, and its hours can be converted to grant aid.' },
      { to: 'school.leave', kind: 'scheduled', why: 'Missing most of a term’s class days ill brings Yale Health’s assessment, which can end in a medical leave.' },
      { to: 'productions.part', kind: 'scheduled', why: 'A rehearsal call that day is excused when it comes, and the blocking set without you is still there to catch up on from the book.' },
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
    short: `Orientation is your first week in New Haven: ${ORIENTATION.length} sessions, one each morning from ${FIRST_SESSION} to ${LAST_SESSION}, that get you started. Registration lets classes count you and work-study pay you. Meeting your class lets you ask classmates to rehearse. The faculty set out what the School asks, which the screen keeps either way. The tour opens the studios and the library for your preparation, and the courses session sets your first work. Be in New Haven and awake when a session starts and it happens; if you miss one, Catch Up does it later, taking the session’s length.`,
    steps: [
      'Be in New Haven and awake for each session. It’s on your calendar, and the clock stops at it and asks.',
      'Go, and it runs its length and says what it did.',
      'Missed one? Open School, then the Coursework tab. The Orientation panel lists each session: press Catch Up beside one whose time has passed.',
    ],
    needs: [
      'To be a first-year who arrived before the sessions.',
      'For Catch Up: to be out of hospital, free now, and clear of anything you’re expected at before the session would end.',
    ],
    costs: [
      { label: 'Time', value: `Each session’s length: ${ORIENTATION.map((o) => `${o.label}, ${o.minutes} minutes`).join('; ')}. Catch Up moves the clock on by the same`, estimate: true },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'Where You Are', value: 'In New Haven and awake when it starts. In hospital, it’s missed, and waits to be caught up' },
      { label: 'The Session’s Time', value: 'Catch Up opens only once the session’s time has passed' },
      { label: 'Your Calendar', value: 'Catch Up needs the session’s length clear of anything you’re expected at' },
    ],
    now: [
      `${SESSION.register.label}: you’re registered, so classes count you and you can work shifts, and you’re told what tuition, Yale Health and work-study come to.`,
      `${SESSION.classmates.label}: you’ve met every classmate, and can ask any of them to rehearse.`,
      `${SESSION.faculty.label}: you meet the chair and your teachers, and they set out what the School asks. What The School Asks, on Standing And Craft, lists it whether you went or not; going adds the day it was set out, and changes nothing else.`,
      `${SESSION.tour.label}: the studios and the Haas Arts Library open for your preparation.`,
      `${SESSION.expectations.label}: the first-year fall courses set their first work, so you can start before classes.`,
    ],
    later: [
      `If you’re not registered when classes begin on ${CLASSES_BEGIN}, each class day counts as an unexcused absence and you can’t work a shift, until you catch up registration. From the second term on, every student counts as registered.`,
      'A classmate you haven’t met, you meet at the first class you go to.',
      'A session done stays done.',
    ],
    interpret: [
      'Each line reads Done with its date, On The Calendar while it’s still to come, or Catch Up once it’s past and not done.',
      'A grayed Catch Up gives its reason beside it.',
      'A session’s notice, or Catch Up’s message, says what it told you or arranged.',
    ],
    unavailable: [
      '“Orientation is over.”: the life began after the first week.',
      '“Done on …”',
      '“This session is still to come. It’s on your calendar.”',
      '“Not from a hospital bed.”',
      'At something else, or due somewhere before it would end: it names what, and when.',
    ],
    mistakes: [
      `Sleeping through ${SESSION.register.label} costs the most: classes count you absent until you catch it up. Catch it up before ${CLASSES_BEGIN}.`,
      'Catching up takes the session’s whole length, so leave room for it.',
    ],
    next: [
      'Once you’ve met your class, ask a scene partner to rehearse on the Coursework tab.',
      'Start your first pieces on the Coursework tab: the studios and the library are open to you after the tour.',
      'Check Your Week on the Classes tab for your first classes.',
    ],
    related: ['coursework.prepare', 'coursework.partners', 'school.standing', 'school.shifts'],
    connections: [
      { to: 'school.standing', kind: 'prerequisite', why: 'Until you’re registered, every class day counts as an unexcused absence.' },
      { to: 'school.shifts', kind: 'prerequisite', why: 'Work-study’s I-9 is done at registration. Unregistered, a shift is missed and can’t be converted.' },
      { to: 'coursework.partners', kind: 'prerequisite', why: 'You can’t ask a classmate you haven’t met to rehearse, and meeting your class meets them all.' },
      { to: 'coursework.prepare', kind: 'immediate', why: 'The tour opens the studios and the library, and the courses session sets your first work.' },
      { to: 'day.calendar', kind: 'scheduled', why: 'Each session is on your calendar, and the clock stops at it.' },
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
    short: `A leave of absence takes you out of the program for a time and brings you back with the class a year below yours. Ask for a medical or a personal leave, and the chair and the dean decide within ${LEAVE_RULES.decideWorkingDays} working days. On leave you have no aid, classes, calls or assigned shifts. Yale Health goes on for a medical leave, and on a personal one you can buy Affiliate cover. Give notice of your return ${LEAVE_RULES.noticeWeeks} weeks before the term you come back to, or the leave ends in dismissal, then press Register when you’re back. Withdrawing gives up your place for good.`,
    steps: [
      'Open School, Standing And Craft. Under A Leave Of Absence, choose the Kind, Medical or Personal, then the Length and the Reason.',
      // A leave the dean imposed has no Call Off from 2026-10-16: until then one granted from the next term drew it, and was called off.
      'Press Ask For A Leave…, read what it would do, and press Ask. Until the leave begins, Call Off The Leave… and then Call It Off keeps you as you are. A leave the dean imposed isn’t yours to call off: you appeal it instead.',
      'On leave, press Give Notice Of Return before its date. On a personal leave, press Buy Affiliate Cover… and then Buy It before its deadline to keep Yale Health.',
      'Back for the return term, press Register before classes.',
      'If the dean imposed a medical leave, press Appeal To The Dean while the appeal is open, from the dean’s decision, before the leave begins or during it.',
      'To leave for good, press Withdraw From The School…, read what it does, and press Withdraw. Stay backs out.',
    ],
    needs: [
      'Your first term begun, and no leave already asked for, granted or under way.',
      `For a personal leave: a term completed, every course current (no Incomplete or failed course open), and not being on an F-1. Asked by the ${LEAVE_RULES.personalByClassDay}th day of a term’s classes, it begins when granted; after that, with the next term.`,
      `For a medical leave: something a Yale Health physician would see in the last ${LEAVE_RULES.medicalLookbackDays} days (an illness, an injury, care or a stay in hospital), or condition under ${ESTIMATE.sickBelow} now.`,
      `Leave left to take: the Bulletin allows ${LEAVE_RULES.maxTerms} terms in all, and a leave’s length must bring you back in the season you left.`,
      'To come back from a medical leave: a physician’s clearance, so out of hospital, not laid up, past the flu and well enough.',
    ],
    costs: [
      { label: 'Asking', value: `Free. It’s decided within ${LEAVE_RULES.decideWorkingDays} working days, or by the term it begins with if that comes first`, estimate: true },
      { label: 'Affiliate Cover', value: `${usd(LEAVE_RULES.affiliatePerTerm)} a term for a personal leave, paid all at once, less the term’s Yale Health fee where the leave began after the first day of classes. The School pays on a medical leave` },
      { label: 'Aid Returned', value: `Where need was found (a family of ${or(NEEDY.map(FAMILY_WORD))} means), a leave begun mid-term charges the term’s living-expense scholarship back to your Yale account on the rebate schedule: ${REBATE} of the term’s classes, and none after. It’s due ${EXTENDED_STUDY.dueDays} days after the leave begins, as a term’s bill is`, estimate: true },
      { label: 'Withdrawing', value: 'Free. Within fifteen days of a term’s first class day, a Yale Health premium paid from your bank comes back', estimate: false },
    ],
    reads: [
      { label: 'When It Begins', value: `A medical leave, when granted. A personal leave, when granted if asked before classes or by the ${LEAVE_RULES.personalByClassDay}th class day, and after that with the next term. Either, with the next term once the term’s review is past` },
      { label: 'Its Length', value: 'One, two or three terms, back in the season you left, since the acting courses run fall to spring', estimate: true },
      { label: 'A Physician’s View', value: `Illness, injury, care or a hospital stay in the last ${LEAVE_RULES.medicalLookbackDays} days, or condition under ${ESTIMATE.sickBelow}`, estimate: true },
      { label: 'Your Status', value: 'On an F-1, a personal leave is refused, and a medical leave extends the I-20 a year' },
      { label: 'Yale Health’s Concern', value: `${MANDATORY_LEAVE.stays} hospital stays in ${MANDATORY_LEAVE.lookbackDays} days, or ${pct(MANDATORY_LEAVE.excusedShare)} of at least ${MANDATORY_LEAVE.minClassDays} class days missed ill, checked on each class day you miss ill`, estimate: true },
    ],
    now: [
      'Asking puts the request with the chair and the dean, and the decision goes on your calendar.',
      'Calling it off ends the request, and you stay as you are.',
      'Once you’ve given notice, you’re expected back, and the return term begins for you.',
      'Once you buy Affiliate cover, Yale Health covers you back to the day student cover ended, and care you had in between is billed again as Yale Health pays it.',
      'Registering lets classes count you again and lets you work shifts.',
      'Withdrawing ends your place today: classes, calls, shifts and coursework stop, the hours you worked are still paid, and your class goes on without you.',
    ],
    later: [
      'Once granted, a leave begins that day or with its term. Courses in progress are left unfinished, to take again; castings and any Cabaret show end. On a personal leave, Yale Health’s student cover ends the day it begins, or, if it begins by the end of the first day of classes, back at the insurance term’s start, with the term’s fee refunded.',
      'A personal leave is decided on where you stand at the decision: with an Incomplete or a course not passed by then, it’s refused.',
      `Notice is due ${LEAVE_RULES.noticeWeeks} weeks before the return term, with a reminder two weeks before that. Give it and you’re back at the term’s start in the class a year below, and must register; without it, the leave ends in dismissal.`,
      `You can buy Affiliate cover for a personal leave until ${AFFILIATE_BY(LEAVE_RULES.affiliateBy.fall)} for a fall leave or ${AFFILIATE_BY(LEAVE_RULES.affiliateBy.spring)} for a spring one, or ${LEAVE_RULES.affiliateDays} days from asking, whichever is later.`,
      `Yale Health’s assessment comes ${MANDATORY_LEAVE.assessWorkingDays} working days after its concern is raised, and takes ${MANDATORY_LEAVE.assessMinutes} minutes. If you’re neither in New Haven and awake for it nor in hospital, it recommends a leave on that alone: the Bulletin names not coming as a reason in itself. If it recommends a leave, the dean decides the next working day. If you came and you’re managing by then, nothing is imposed; if you didn’t come, the leave is imposed however well you are. You then have ${MANDATORY_LEAVE.appealDays} days to appeal, decided in ${MANDATORY_LEAVE.appealDecideWorkingDays} working days.`,
      `If you withdraw within fifteen days of a term’s first class day, Yale Health’s cover ends: ${WITHDRAWN_EARLY}. If you withdraw later, Yale Health covers you for thirty days more. On an F-1, you have a grace period of ${STATUS_GRACE_DAYS.withdrawn} days and no OPT.`,
    ],
    interpret: [
      'Your Leave shows a leave while it’s With The Chair And The Dean, Granted, Not Yet Begun, or On Leave. From and Back For give the terms. Once it’s over, Leaves Before keeps it with how it ended.',
      'A Length marked (Not Possible) says why under the choices: one or three terms would bring you back to the second halves of year-long courses.',
      // A leave not begun was turned down “The term it began in is over.” until 2026-10-16, of a term that hadn’t begun.
      `An appeal succeeds only if you’re cleared and at least ${pct(MANDATORY_LEAVE.resumeWithin)} of the term’s classes are still ahead; the leave stands while it’s heard. A leave granted from the next term, the dean having decided after the term’s review, has all of its term ahead: if you’re cleared, it’s overturned and called off before it begins, and you go on with that term as before. The Bulletin sets the appeal (in writing, within ${MANDATORY_LEAVE.appealDays} days); the game decides it.`,
      `Used, at the foot of the panel, counts the terms of leave you’ve had out of ${LEAVE_RULES.maxTerms}. Leaves Before keeps every leave and how it ended.`,
      'Yale Health’s assessment shows above the leave while it’s scheduled or being decided. Whether you came is kept with its finding: not coming is a finding in itself, “You didn’t come to the assessment, which the Bulletin names as a ground of its own.”, and an appeal is the way back from the leave it brings.',
    ],
    unavailable: [
      '“You can’t take a leave before your first term has begun.”',
      '“Your request is with the chair and the dean, decided by …”, “Your leave is granted, from …” or “You’re on leave.”',
      '“Your request to repeat the year is being decided.”, “Your terms are done. All that’s left is the degree.” or “Your terms in the program are done.”',
      '“You can take a personal leave only after you’ve completed one term.”',
      '“For a personal leave you need to be current with your requirements…”, naming the Incomplete to make up or the course not passed.',
      '“The School doesn’t normally grant a leave to take on a professional commitment.”',
      '“On an F-1, a personal leave ends your status …”',
      `“A medical leave needs a Yale Health physician’s written recommendation, and nothing in the last ${LEAVE_RULES.medicalLookbackDays} days would lead to one …”`,
      `“You’ve had … of leave, and the Bulletin allows ${WORDS[LEAVE_RULES.maxTerms]} in all.”`,
      'Notice: “Its deadline has passed.”, or after a medical leave, why a physician can’t clear you yet.',
      // On leave from 2026-10-17 (brief 11): until then Register was drawn on a leave and registered her for the term she'd left.
      'Register: “A financial hold stops registration: … is owed on your Yale account. Pay it on the Terms And Award tab.”, or on leave “You’re on leave: you register for the term you come back to, when it begins.”',
      // The bank's refusal from 2026-10-16, when Affiliate cover began to be paid from the savings beside the current account
      // too; until then it was “Your bank can’t cover it.”, and this list left it out.
      'Affiliate cover: “The School pays for your Affiliate cover.” on a medical leave, “It could only be bought until …”, or, as it’s paid in full, “Your checking account and your savings can cover only … of it now, so nothing was paid.”, going on “It’s paid in full, so move money into your checking account first.”, or “Your checking account and your savings can’t cover any of it, so nothing was paid. Move money into your checking account first.”',
      'Appeal: “Only a leave the dean imposed can be appealed.” or “The appeal had to be in by …”.',
      'Call It Off, on a leave the dean imposed: “The dean imposed this leave, so it isn’t yours to call off”, and while it can still be appealed, “appeal it in writing to the dean by …”.',
    ],
    mistakes: [
      'Missing the notice date means dismissal, and a dismissal is final. Give notice as soon as you know, and after a medical leave, be well enough to be cleared by then.',
      'A personal leave without Affiliate cover leaves you uninsured, and care in that time is billed as uninsured until you buy it.',
      'Withdrawing can’t be undone: the Bulletin lets a student who withdrew apply to come back, but the game doesn’t offer a return.',
      'A leave is refused while a request to repeat the year is being decided, or once your terms are done. Settle those first.',
      'Sleeping through Yale Health’s assessment, or being away from New Haven when it’s due: on that alone it recommends a leave, and the dean imposes it however well you are. Only an appeal undoes it.',
    ],
    next: [
      'While you wait for the decision, keep going to classes: nothing changes until the leave begins.',
      'On a personal leave, buy Affiliate cover before its deadline, then give notice of return as soon as you know you’re coming back.',
      'Back for the return term, press Register on Standing And Craft before classes, then check Your Week on the Classes tab.',
    ],
    related: ['school.repeat', 'school.money', 'papers.health-cover', 'documents.work', 'school.standing'],
    connections: [
      { to: 'papers.health-cover', kind: 'immediate', why: 'A personal leave ends Yale Health’s student cover, and Affiliate cover keeps it.' },
      { to: 'school.money', kind: 'immediate', why: 'A leave begun mid-term charges part of the term’s living-expense scholarship back to your Yale account.' },
      { to: 'school.standing', kind: 'scheduled', why: 'Without notice of return by its date, the leave ends in dismissal.' },
      { to: 'school.repeat', kind: 'history', why: 'Courses left on a leave stay on your record as Left On Leave, and you take them again when you’re back.' },
      { to: 'body.how', kind: 'prerequisite', why: `A medical leave needs a reason a physician would see, and coming back needs condition ${ESTIMATE.sickBelow} or more.` },
      { to: 'documents.work', kind: 'immediate', why: `On an F-1, a medical leave extends the I-20 a year once it begins, and withdrawing leaves a grace period of ${STATUS_GRACE_DAYS.withdrawn} days and no OPT.` },
      { to: 'productions.casting', kind: 'immediate', why: 'A leave ends the term’s castings and any Cabaret show; what you played stays credited.' },
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
    available: `${OPENED}: an Incomplete after a term’s review, a repeat at a year’s end, an additional term after the last year’s review.`,
    // Whose each rule is, said from 2026-10-16: until then the Incomplete's coming of excused absence and its one extension
    // read as the Bulletin's, which has a student ask the instructor for one and petition for an extension.
    short: `The degree needs every course passed, and each term’s review settles every course as passed, Incomplete or failed. To put an Incomplete right, make it up in sessions of ${MAKE_UP} with its teachers within ${COURSE_RULES.incompleteDays} days, the Bulletin’s month: press Make Up A Session on Standing And Craft. Left undone, it becomes a Permanent Incomplete. Ask For A Month More moves the deadline once, by as long again. To put a failed course right, ask to repeat its year at the year’s end, once, with the chair’s and the dean’s approval; or, after your last year, ask for an additional term that retakes only what you didn’t pass. Some of this is the game’s own rule, not the Bulletin’s: an Incomplete coming from classes you missed while excused (the Bulletin has the student ask the instructor for one), the limit of one extension, and the repeat and the additional term, for which the Bulletin has no rule.`,
    steps: [
      'Open School, Standing And Craft. Courses And The Degree lists each Incomplete with its sessions left and its deadline.',
      'Press Make Up A Session for each session owed. Ask For A Month More moves the deadline, once.',
      'At the end of a year with a failed course, Finishing The Degree offers Ask To Repeat The Year…: read what it would do, then press Ask. While it’s being decided, Call Off The Request… says what calling it off would leave; Call It Off withdraws it, and Keep It keeps it.',
      'After the last year, with a course not passed, press Ask For An Additional Term to retake only those.',
      'Every Course, folded at the foot of Courses And The Degree, lists each attempt and how it ended.',
    ],
    needs: [
      `For a make-up session: an Incomplete whose deadline is ${MAKE_UP} or more away, still being at the School, out of hospital, and ${MAKE_UP} free.`,
      // “A course failed that year” was false until 2026-10-15 after a leave begun at the year’s spring: its fall’s Fail,
      // three calendar terms back, wasn’t counted, and the repeat was refused (`repeatCourses`, systems/leave.ts).
      `To repeat a year: the spring’s review past and the next year not yet begun (after the last year, within ${EXTENDED_STUDY.requestDays} days of it); a course failed in that year’s fall or spring, with or without a leave between them; no leave under way and no additional term asked for; that year not repeated before; and ${EXTENDED_STUDY.maxSemesters} semesters at most, counting the repeat’s two and the terms still to come, but not a leave’s terms.`,
      `For an additional term: the last year’s review past and its ${EXTENDED_STUDY.requestDays} days not over, a course not passed, no repeat being decided, ${EXTENDED_STUDY.maxSemesters} semesters enrolled at most with it, and no disqualification standing.`,
    ],
    costs: [
      { label: 'A Make-Up Session', value: `${COURSE_RULES.makeUpMinutes} minutes, with the clock moved on. Each makes up a week of the course’s meetings`, estimate: true },
      { label: 'Asking', value: `Free. It’s decided in ${EXTENDED_STUDY.decideWorkingDays} working days`, estimate: true },
      { label: `A Term Past ${upper(SIX)}`, value: `Tuition and Yale Health billed to your Yale account: ${usd(SEVENTH.tuition)} and ${usd(SEVENTH.healthPlan)} in ${season(SEVENTH_TERM)}`, estimate: true },
    ],
    reads: [
      { label: 'A Course’s Pass', value: `Coming to ${pct(COURSE_RULES.passFloor)} or more of the meetings you weren’t excused from, and, where two or more pieces were due, showing more than half of them`, estimate: true },
      { label: 'An Incomplete', value: `Passed on the meetings you weren’t excused from, but at under ${pct(COURSE_RULES.passFloor)} of all of them. This is the game’s rule`, estimate: true },
      { label: 'Sessions Owed', value: `What it takes to reach ${pct(COURSE_RULES.passFloor)} of the meetings, a week’s meetings for each session`, estimate: true },
      { label: 'Disqualification', value: `The Bulletin’s: ${EXTENDED_STUDY.disqualify.inOneTerm} Failures in a term, ${BY_TERM}, or ${EXTENDED_STUDY.disqualify.total} in all` },
      { label: 'Semesters', value: `The degree within ${EXTENDED_STUDY.maxSemesters} semesters enrolled, with tuition support for ${EXTENDED_STUDY.supportedTerms}. A leave’s terms aren’t enrolled ones and don’t count: a leave has its own limit, ${LEAVE_RULES.maxTerms} terms in all` },
    ],
    now: [
      `Making up a session moves the clock ${MAKE_UP} on, and the course passes once every session owed is done.`,
      `Asking for a month more moves the deadline ${COURSE_RULES.incompleteDays} days on, with a new reminder.`,
      'Asking to repeat the year, or for an additional term, puts the request with the chair and the dean, and the decision goes on your calendar.',
      'Calling off a request to repeat ends it at once.',
    ],
    later: [
      `A reminder comes ${COURSE_RULES.remindDays} days before an Incomplete is due. At the deadline it becomes a Permanent Incomplete, with no credit.`,
      'If a repeat is granted, from the next term you take that year’s courses again with the class a year below. What you did the first time stays on your record, and the degree counts the pass. On an F-1, the I-20 runs a year longer.',
      // Until 2026-10-15 this said a repeat refused past the semesters or under a disqualification withholds the degree
      // after the last year: the decision's own refusals, which no request the asking takes reaches (`repeatRefusal`,
      // REPEAT_DECIDE_KIND), kept as guards.
      'A request you’re allowed to make is granted at its decision, as long as you’re still at the School and haven’t called it off: the chair and the dean decide on what let you ask.',
      'If you repeat the last year, its courses meet again the next fall and spring. Terms past six are billed to your Yale account, and with every course passed the degree comes at that year’s Commencement.',
      `If an additional term is granted, you take only the retakes in it, with the class then in that year. Passed in a fall, the degree comes at Yale’s December conferral on ${MONTHS[DEGREE_DATES.december[0] - 1]} ${DEGREE_DATES.december[1]}; in a spring, at Commencement. A retake not passed in it means the degree isn’t recommended at that review, and nothing more can be asked.`,
      `After the last year’s review, with a course not passed, you have ${EXTENDED_STUDY.requestDays} days to ask for either, or the degree isn’t recommended. If neither is open to you, it isn’t recommended at the review.`,
      'At a review where the Bulletin’s count of Failures is reached, with a Failure the faculty haven’t judged before, they review your record. Already on warning, reviewed before, or with no room to repeat, you’re dismissed; otherwise you’re placed on warning to repeat the year, and the Failures they kept you through don’t count against the repeat or an additional term. The count is the Bulletin’s, which says a student “may be” disqualified; the review and its outcomes are the game’s model of the faculty.',
      // From 2026-10-16 (the owner's brief's “no dead-end warning”): until then such a notice said only that the degree
      // needs every course passed.
      'A failed course or a Permanent Incomplete whose year can’t be repeated within the nine semesters (none can after a repeat has been granted) names what’s left instead: an additional term after the last year’s review, unless that review puts you on academic warning. Where neither is left, it says so.',
      'An Incomplete still open at Commencement keeps you from the ceremony, and the degree comes once it’s made up in time.',
    ],
    interpret: [
      'Each Incomplete shows how many of its make-up sessions are left, and by when.',
      // Until 2026-10-15 “only where that can still be asked” was false after a leave begun at the year’s spring: a fall
      // Fail or an Incomplete run out in the leave was offered the year’s end, which then refused it (`repeatCourses`).
      `A failed course says why: the meetings you came to, or the work not shown. Its notice comes after the review’s word on your standing, and offers the year’s end to ask to repeat the year only where you can still ask: not where the same review dismissed you or the degree wasn’t recommended (as when a retake isn’t passed in an additional term), and not where the repeat would take the degree past ${EXTENDED_STUDY.maxSemesters} semesters, counted as the year’s end will count them (after any repeat granted, that’s every year, the repeated one with the rest). There it names the additional term after the last year’s review instead. A Permanent Incomplete’s notice offers it on the same terms, and not where the degree is waiting on it.`,
      'Every Course marks each attempt Passed, Incomplete, Not Passed, Permanent Incomplete, Left On Leave or In Progress.',
      // Until 2026-10-15 this listed “refused and why” among them, which only the decision's guards draw.
      'Finishing The Degree says where a request stands: with the chair and the dean, granted, or called off.',
    ],
    unavailable: [
      '“There’s no Incomplete in that course to make up.” or “Its deadline is at …, and there isn’t time for a session before then.”',
      '“You’re not at school.”: Make Up A Session then stops showing.',
      '“You’re not at school.” or “You’ve already had your one extra month.”: Ask For A Month More then stops showing.',
      '“You can ask to repeat a year only at its end, after the spring’s term review.”',
      '“You passed every course this year, so there’s nothing to repeat it for.”',
      '“In the game, the faculty don’t approve repeating year N a second time.”',
      '“Your request for an additional term is with the chair and the dean, decided by …” or “Your additional term is …”: you can’t ask to repeat beside one; and for an additional term, “Your request to repeat the year is being decided.”',
      '“Not while a leave is under way.”',
      '“Repeating would make N semesters, past the nine the Bulletin allows for the degree.”, counting the semesters enrolled, the year’s two again and the program’s terms still to come after it; and for an additional term “It would make N semesters, past the nine the Bulletin allows.”, counting the semesters enrolled and the term itself. A leave’s terms are left out of both.',
      // Until 2026-10-13 this also named “Its thirty days have run out.”, which no play reaches since that day (`repeatRefusal`).
      '“The next year has begun.”',
      '“You can ask for an additional term after your last year’s term review, to retake what you didn’t pass.”',
      '“The faculty’s disqualification stands against it.”',
    ],
    mistakes: [
      `Leaving make-up sessions to the last week: each takes ${MAKE_UP}, and a busy week leaves no room. Start as soon as the Incomplete is set.`,
      `Calling off a request to repeat without reading what Call Off The Request… says it leaves: after a middle year you go on with the course not passed, and the degree can’t be completed without it; after the last year, the degree isn’t recommended unless you ask again within its ${EXTENDED_STUDY.requestDays} days.`,
      'A course left on a leave is taken again when you’re back, so you don’t ask to repeat it.',
      `Letting the ${EXTENDED_STUDY.requestDays} days after the last year run out means the degree isn’t recommended: ask for one path or the other in time.`,
    ],
    next: [
      'With an Incomplete: press Make Up A Session now, a session at a time, well before the deadline.',
      'With a failed course: ask to repeat the year at its end, or for an additional term after the last year, and watch Finishing The Degree for the decision.',
      'Once a repeat is granted, plan for the year’s courses again on the Classes tab, and for the bill on Terms And Award if it runs past six terms.',
    ],
    related: ['school.standing', 'school.sick', 'school.money', 'school.leave'],
    connections: [
      { to: 'school.standing', kind: 'evaluation', why: 'A course failed in a term keeps that term from good standing.' },
      { to: 'school.money', kind: 'scheduled', why: `A repeated year or an additional term past ${SIX} terms is billed to your Yale account.` },
      { to: 'school.sick', kind: 'history', why: 'Meetings missed ill stay excused on the record, and enough of them make an Incomplete, not a failed course.' },
      { to: 'school.leave', kind: 'optional', why: 'A leave is refused while a request to repeat is being decided, and courses left on a leave are taken again when you’re back.' },
      { to: 'documents.work', kind: 'scheduled', why: 'On an F-1, a repeat or an additional term extends the I-20 a year when it’s granted.' },
    ],
    example: {
      setup: `Laid up and then down with the flu, you’re excused from ${EXCUSED} of ${ACTING.name}’s ${ACTING_MEETS} fall meetings and come to the rest.`,
      steps: [
        `At the term review ${ACTING.name} has you at ${ATTENDED} of ${ACTING_MEETS}: every meeting you weren’t excused from, so it isn’t failed.`,
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
    short: `Your Yale account is what you owe the School. The tuition scholarship pays tuition for ${EXTENDED_STUDY.supportedTerms} terms, so the account usually owes nothing. It’s charged for a term past those ${EXTENDED_STUDY.supportedTerms}, for a scholarship returned on a leave, and for late fees, and Pay From Your Bank settles it. Unpaid past its due date, it brings a financial hold, which stops registration and the diploma, and a late fee each month. Ask For An Aid Review asks the aid office to support a term past ${EXTENDED_STUDY.supportedTerms}, and a student on aid can ask to convert work-study hours missed ill into grant aid.`,
    steps: [
      'Open School, Terms And Award. Your Yale Account shows what each term bills and credits and, once anything is billed, Owed On Your Yale Account, Financial Hold and Terms Enrolled.',
      'Type an amount in Pay (Blank Pays It All), or leave it blank, and press Pay From Your Bank.',
      `With a ${SEVENTH_WORD} term coming, press Ask For An Aid Review.`,
      'On Shifts And Pay, press Ask For Conversion To Grant Aid when Convertible To Grant Aid shows hours.',
    ],
    needs: [
      // Until 2026-10-16 the savings beside the current account counted only where linked to it.
      'To pay: something owed, no more than is owed, and that much in your checking account and your easy-access savings, since Yale takes a payment from a checking or savings account.',
      `For an aid review: ${SIX} terms enrolled, or a repeat or an additional term granted. Each student gets one review.`,
      'For conversion: need found by Yale’s assessment, not being on leave, and hours to convert.',
    ],
    costs: [
      { label: `A Term Past ${upper(SIX)}`, value: `${usd(SEVENTH.tuition)} tuition and ${usd(SEVENTH.healthPlan)} for Yale Health in ${season(SEVENTH_TERM)}, due in ${EXTENDED_STUDY.dueDays} days`, estimate: true },
      { label: 'Late Fee', value: `${usd(EXTENDED_STUDY.lateFee)} a month while it’s owed, up to ${usd(EXTENDED_STUDY.lateFeeTermCap)} a term` },
      { label: 'Paying', value: 'From your checking account, then your easy-access savings, at once, with no time taken' },
      { label: 'Grant Aid', value: `${usd(WORK_STUDY.hourly)} for each hour converted, up to ${WORK_LIMITS.convertibleHours} hours a year, taxed as a scholarship` },
      { label: 'Asking For Conversion', value: 'No time and no money. The grant comes at the processing it’s booked for' },
    ],
    reads: [
      { label: 'The Balance', value: 'The sum of the account’s entries: what was charged, less what was paid or credited' },
      { label: 'Need', value: `Yale’s assessment of your family’s means: the family you chose when you created the life, beside your background. ${or(NEEDY.map(FAMILY_WORD))}: need is found, and the living-expense scholarship, ${usd(AIDED.livingScholarship)} a term in 2026–27, pays the term’s Yale Health plan, ${usd(AIDED.healthPlan)}, and the rest, ${usd(AIDED.refund)}, into your bank each fall and spring; hours missed ill can be converted, and a leave begun mid-term returns part of the scholarship. ${or(MEANS.map(FAMILY_WORD))}: the family’s means rule need out, so there’s no living aid and no hours to convert, and the plan comes from your bank` },
      { label: 'Your Family’s Money', value: `What each family puts in your name on the first morning: ${FAMILY_MONEY}` },
      { label: 'The Aid Office', value: `Makes an exception to ${SIX} terms of tuition support only where you’ve had a medical leave, and keeps living aid, which pays the term’s Yale Health fee, only where need was found`, estimate: true },
      { label: 'Hours To Convert', value: `Assigned hours excused ill or hurt this year; and hours never assigned, counted in May until its processing, once the spring’s shifts are done, and paid only at May’s processing, never January’s; up to ${WORK_LIMITS.convertibleHours} less any already converted. A repeated year counts as a year of its own: its hours are counted and converted separately from the first time` },
    ],
    now: [
      'A payment moves from your bank onto the account at once. Paid in full, a hold lifts, and a degree waiting on it is conferred.',
      `An aid review goes to the aid office, and is decided in ${EXTENDED_STUDY.decideWorkingDays} working days.`,
      `A conversion is booked for the next processing, on the 15th of ${WORK_LIMITS.convertMonths.map((m) => MONTHS[m - 1]).join(' or ')}.`,
    ],
    later: [
      `If anything is still owed ${EXTENDED_STUDY.dueDays} days after a term is billed, or after a leave returns a scholarship to it, the account goes on a financial hold with a ${usd(EXTENDED_STUDY.lateFee)} late fee, then another each month while it’s owed, up to ${usd(EXTENDED_STUDY.lateFeeTermCap)} a term.`,
      'Under a hold at a term’s start, you must register again once it’s paid; until then you’re counted absent from classes and can’t work shifts. With need found, the term’s living-expense scholarship pays the account first, and only what’s left reaches your bank: a hold it clears lifts then, and “The Financial Hold Is Lifted” says so.',
      'Under a hold at Commencement, the diploma waits until it’s paid.',
      `The aid review’s answer is applied when the next term begins. With an exception, the term’s tuition isn’t billed and it runs as one of the first ${SIX}; with need found, living aid goes on either way and pays the term’s Yale Health fee. A term billed before the answer isn’t credited back.`,
      `Converted hours are paid into your bank as grant aid on the processing day. For a nonresident on an F-1, ${pct(NONRESIDENT_SCHOLARSHIP_RATE)} is withheld for tax.`,
      // From 2026-10-17 (brief 11): until then a credit that cleared the account left its hold, which only a payment or a
      // term's aid lifted.
      'A credit on the account (a leave’s tuition rebate or Yale Health fee refunded, or a scholarship restored on appeal) that leaves nothing owed lifts a hold as a payment does, and “The Financial Hold Is Lifted” says so. A credit left over is refunded to your bank.',
    ],
    interpret: [
      'Owed On Your Yale Account shows a warning when anything is owed, and Financial Hold gives the day it began.',
      'The table lists the account’s last twelve entries, each a charge, a payment or a credit.',
      'Convertible To Grant Aid reads Not On Aid where no need was found; otherwise it shows the hours, and what they’d come to.',
      `Each Term ends Paid To Your Bank where need was found and Paid From Your Bank where it wasn’t, including a term past ${SIX} where the aid office granted an exception. A term past ${SIX} without one shows On Your Yale Account: its tuition, and its Yale Health fee too unless the review kept your living aid, which then pays the fee and the tuition before any of it reaches your bank, as Applied To Your Yale Account shows, and the term ends Paid To Your Bank with what’s left, if anything.`,
      `Terms Enrolled counts the terms you’ve been enrolled in, the figure the degree’s ${EXTENDED_STUDY.maxSemesters} semesters are counted against. A leave’s terms aren’t among them.`,
      'A hold’s notice, and a held diploma’s, says to pay on the Terms And Award tab, where Your Yale Account and Pay From Your Bank are.',
      `A scholarship returned on a leave is due ${EXTENDED_STUDY.dueDays} days after the leave begins, as a term’s bill is, and the “Your Leave Has Begun” notice gives the date. Unpaid by then, it brings the hold and the late fee.`,
      'The figures here are the dollars Yale bills; the screen shows them in your save’s money.',
    ],
    unavailable: [
      // Until 2026-10-16 the last was “Your bank can’t cover it.”, said with savings at the bank that could: a payment to
      // Yale reached savings only where linked (`fromBankToYale`, systems/leave.ts).
      '“Your Yale account owes no balance.”, “Enter an amount to pay.”, “… is owed. Pay that or less.”, “Your checking account and your savings can cover only … of it now, so nothing was paid.”, going on “Pay that or less, or move money into your checking account first.”, or “Your checking account and your savings can’t cover any of it, so nothing was paid. Move money into your checking account first.”',
      '“Support past six terms is reviewed once a seventh is coming: you’re within the six.”',
      '“It’s with the aid office, decided by …” or “The aid office has reviewed your support.”',
      '“Converting hours to grant aid is only for students on financial aid, and the aid office found no need for you.”',
      '“You can’t while you’re on leave: a student on leave has no aid.”',
      '“Your request is already in for the next processing.”',
      '“There are no hours to convert. …”; before May, “There are no hours to convert yet. …”; and from May 15 to January 14, when the next processing is January’s, “There are no hours to convert at January’s processing. …”.',
    ],
    mistakes: [
      `Leaving a term’s bill, or a scholarship a leave returned, past its ${EXTENDED_STUDY.dueDays} days: the hold stops registration at the next term and the diploma at the end. Pay before it’s due.`,
      `Asking for the aid review once the ${SEVENTH_WORD} term has begun: that term is already billed and isn’t credited back. Ask as soon as the extra term is granted.`,
      'A shift you missed by staying away can’t be converted: only hours missed ill or hurt, or never assigned, can.',
    ],
    next: [
      'When a term is billed, pay it on Terms And Award before its due date, or plan the money to.',
      `With a ${SEVENTH_WORD} term granted, ask for the aid review straight away.`,
      'On aid, check Convertible To Grant Aid on Shifts And Pay after a shift missed ill, and ask for the conversion.',
    ],
    related: ['school.repeat', 'school.leave', 'school.shifts', 'bank.accounts', 'taxes.return'],
    connections: [
      { to: 'school.repeat', kind: 'prerequisite', why: `A repeated year or an additional term past ${SIX} terms is what bills tuition to the account.` },
      { to: 'school.leave', kind: 'evaluation', why: `The aid office grants tuition past ${SIX} terms only to a student who has had a medical leave.` },
      { to: 'school.shifts', kind: 'prerequisite', why: 'Assigned hours excused ill or hurt are the hours conversion turns into grant aid.' },
      { to: 'bank.accounts', kind: 'immediate', why: 'Payments come out of your bank, and grant aid and refunds go into it.' },
      { to: 'taxes.return', kind: 'history', why: 'Grant aid is a taxable scholarship, kept for the year’s tax return.' },
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
    short: `Work-study is paid work every student does for the School. You’re booked a six-hour shift on each Saturday of the class weeks, up to ${WORK_STUDY.assignedHours} assigned hours a year, and Take An Elective Shift books a four-hour evening front of house at Yale Rep; the Bulletin asks for at least ${WORK_STUDY.electiveHours} elective hours a year. Hours are paid at ${usd(WORK_STUDY.hourly)} an hour on the Friday after, into your bank as wages. The Saturday crew needs the required protective equipment, ${usd(REQUIRED_PPE.cost)}, which you buy here or at your first shift.`,
    steps: [
      'Open School, then Shifts And Pay.',
      'Press Take An Elective Shift. It books the first free evening from tomorrow, seven to eleven, and a message says when.',
      'Press Buy The Protective Equipment before your first Saturday, or it’s bought there, from your bank.',
      'Be in New Haven and awake when a shift begins. The next six are listed under the figures; press one to open it.',
    ],
    needs: [
      'To be at school, not on a leave, and registered: without registration, you can’t work a shift.',
      `For an elective evening: one free in the next two weeks, during a term’s classes, clear of everything you’re expected at and of nights on call, and within Yale’s cap of ${WORK_LIMITS.weekHours} hours a week in term.`,
      `For the Saturday crew: the protective equipment, or ${usd(REQUIRED_PPE.cost)} in the bank when the shift begins.`,
    ],
    costs: [
      { label: 'An Assigned Shift', value: 'A Saturday of the class weeks, 10 a.m. to 4 p.m., six hours', estimate: true },
      { label: 'An Elective Shift', value: 'An evening, 7 to 11 p.m., four hours', estimate: true },
      { label: 'Protective Equipment', value: `${usd(REQUIRED_PPE.cost)}, once` },
      { label: 'Energy', value: `${ESTIMATE.energy.shift} a shift`, estimate: true },
      { label: 'Pay', value: `${usd(WORK_STUDY.hourly)} an hour, by direct deposit` },
    ],
    reads: [
      { label: 'The Week’s Hours', value: `Work-study shifts booked and worked, Monday to Sunday, against Yale’s cap: ${WORK_LIMITS.weekHours} hours from a term’s first class day to its last, and ${WORK_LIMITS.recessWeekHours} outside them. The Monday-to-Sunday week is the game’s` },
      { label: 'Where You Are', value: 'In New Haven, awake and out of hospital when it begins' },
      { label: 'A Sick Day', value: 'Called in, or in hospital or laid up: the shift is excused' },
      { label: 'The Risk Of Injury', value: `Each hour carries its work’s risk at BLS’s rates, higher for the crew than front of house. If you’re hurt at a shift, workers’ compensation pays the care and, if you’re kept off work, Connecticut’s ${pct(CT_COMP.share)} of the week’s work-study wages up to that shift: ${CT_WEEK_MOST < CT_MINIMUM_UNDER ? `of the whole of it, as the state pays for a week under ${usd(CT_MINIMUM_UNDER)}, since shifts are worked only in a term’s class period, ${WORK_LIMITS.weekHours} hours a week at most, ${usd(CT_WEEK_MOST)}` : `of the whole of a week under ${usd(CT_MINIMUM_UNDER)}, the state’s minimum there, and of a bigger week after income tax, never under ${usd(CT_MINIMUM)}, with no payroll tax taken off, since work-study bears none`}. There’s no pay for the first ${word(CT_COMP.waitingDays)} days unless you’re off more than ${word(CT_COMP.retroAfterDays)}` },
    ],
    now: [
      'Booking puts the evening on your calendar, and Elective Hours Asked For rises by four.',
      `Buying the equipment takes ${usd(REQUIRED_PPE.cost)} from your bank, and Protective Equipment reads Bought.`,
    ],
    later: [
      'Once worked, the hours go into Owed On Friday and are paid the Friday after at five, through Yale’s payroll, so your bank counts them as wages.',
      'An assigned shift missed asleep, away, or sent home without the equipment counts against your attendance at the term’s review.',
      'An elective evening you miss is unpaid and frees its hours, and doesn’t count against you.',
      'A shift that would go past the week’s cap is worked up to the cap, or called off if the week is full, and isn’t held against you.',
      'An assigned shift excused because you were ill can be converted to grant aid if you’re on aid.',
      'If you leave the School, on a leave or for good, hours already worked are still paid, and an elective evening still ahead is called off, its hours freed as a missed one’s are.',
    ],
    interpret: [
      `Assigned Hours Booked climbs as each Saturday is booked; the class weeks of 2026–27 hold ${YEAR_SATURDAYS} Saturdays.`,
      `Elective Hours Asked For counts the hours of evenings booked since each fall, leaving out those missed or called off by a leave or by leaving the School. The Bulletin’s minimum is ${WORK_STUDY.electiveHours}; the screen shows the count, and nothing in the game checks whether you reach it.`,
      'Owed On Friday is the hours worked since the last payday, at the hourly rate.',
      'This Week’s Hours shows the week’s work-study shifts, booked and worked, against the cap. Its note says all Yale jobs count together; work-study is the only one it counts.',
    ],
    unavailable: [
      '“You’re not at school.”: the button stops showing once you’ve left.',
      '“You’re on leave, so there are no shifts until you’re back.”: on a leave it shows in place of the button.',
      `“There’s no free evening in the next two weeks within Yale’s cap of ${WORK_LIMITS.weekHours} hours a week in term, across all your Yale jobs.”`,
      '“There’s no free evening left in the term in the next two weeks.”: outside a term’s classes, in the summer or between terms, the Rep is dark.',
      `Protective equipment: “Your bank can’t cover ${formatMoney(REQUIRED_PPE.cost, 'USD')}, so nothing was charged.” Once bought, or once you’ve left the School, the button doesn’t show.`,
    ],
    mistakes: [
      'Counting on buying the equipment at the shift with an empty bank: the supervisor sends you home, and the shift counts as missed. Buy it when the money’s there.',
      'Booking when you wanted a particular evening: it takes the first free one, so check the date it gives. If you don’t work it, the hours are freed, unpaid.',
      'A first-year who missed registration can’t work: catch it up under Orientation on the Coursework tab.',
    ],
    next: [
      'Buy the protective equipment before your first Saturday, while the money’s there.',
      'Check your calendar for the evening Take An Elective Shift booked, and keep it clear.',
      'On Friday, look for the pay in your bank.',
    ],
    related: ['school.money', 'school.standing', 'school.sick', 'bank.accounts', 'taxes.return'],
    connections: [
      { to: 'school.standing', kind: 'evaluation', why: 'Assigned shifts kept or missed are part of the attendance the term’s review counts.' },
      { to: 'bank.accounts', kind: 'scheduled', why: 'Friday’s pay goes into your bank as wages, and the equipment comes out of it.' },
      { to: 'school.money', kind: 'optional', why: 'A student on aid can convert assigned hours missed ill or hurt into grant aid.' },
      { to: 'taxes.return', kind: 'history', why: 'Work-study wages are income on the year’s tax return.' },
      { to: 'body.how', kind: 'immediate', why: `A shift takes ${ESTIMATE.energy.shift} energy, and can hurt you at its work’s rate.` },
      { to: 'school.orientation', kind: 'prerequisite', why: 'Registration does work-study’s I-9; without it, a shift is missed.' },
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
