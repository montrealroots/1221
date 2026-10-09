/**
 * SLATE — the school, its courses, and the skills they train.
 *
 * The School screen names a school, a year’s courses and twenty-one skills,
 * and until 2026-10-02 none of them opened. They are things: the school is a
 * real one in a real town, each course is the Bulletin’s with its own code
 * and teachers, and each skill is a number the classes grow and the chair
 * casts by. So the school opens into the year’s courses and the town; a course
 * into the skills it trains and the next day it meets; a skill into where you
 * stand in it against the class and every course that trains it.
 *
 * Every figure is the school system’s own (`systems/school.ts`): the craft,
 * the reach the ceiling allows, the class’s best and middle, and your place.
 */

import { dateKey, formatDate, instantFromZoned, zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { COURSES, SKILLS, YALE_DRAMA, type Course, type Skill } from '@/engine/content/school';
import {
  STANDING_LABEL, ceilingOf, coursesOn, meanCraft, nextClasses, rankIn, termLabel, termOf, termStart, yearOfStudy,
} from '@/engine/systems/school';
import type { Person } from '@/engine/domain/model';
import { templateById, type PrepDim } from '@/engine/content/coursework';
import { BAND_LABEL, assignmentById, courseworkOf, preparedParts, weightsOf, type Assignment } from '@/engine/systems/coursework';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, lookExists, type Way } from './registry';
import { at } from './subject';
import { spokenList } from './words';

const YEAR_WORD = ['', 'First', 'Second', 'Third'] as const;
const schoolZone = () => CITIES.require(YALE_DRAMA.cityId).timeZone;
const skillLabel = (id: Skill) => SKILLS.find((s) => s.id === id)?.label ?? id;
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] ?? 0; };

/** The player, while they have a school and a craft to read. */
function student(sim: Simulation): Person | undefined {
  const person = sim.universe.people[sim.universe.playerId];
  return person?.school && person.craft ? person : undefined;
}

/** "3rd", for a place in the class. */
function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'}`;
}

/** The term a moment falls in, by New Haven’s calendar. */
function termNow(sim: Simulation): number {
  const p = zonedParts(sim.now, schoolZone());
  return Math.min(termOf({ year: p.year, month: p.month, day: p.day }), YALE_DRAMA.terms - 1);
}

/** The next day, within six weeks, a course meets, as an instant at nine in New Haven. */
function nextMeeting(sim: Simulation, course: Course): number | undefined {
  const start = new Date(sim.now);
  for (let n = 0; n < 42; n += 1) {
    const t = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + n));
    const day = { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
    const nine = instantFromZoned({ ...day, hour: 9 }, schoolZone());
    if (nine <= sim.now) continue;
    if (coursesOn(day).some((c) => c.code === course.code)) return nine;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// The school
// ---------------------------------------------------------------------------

/**
 * The school is a real one in a real town whether or not this life went to
 * it, so it resolves either way; what it says about you is what differs. A
 * life that began somewhere else sees the school as a stranger would: its
 * degree, its town, its courses, and nothing of yours.
 */
interface TheSchool { person: Person | undefined }

defineLook<TheSchool>('school', {
  gone: 'There’s no such school in this world.',
  resolve: (sim, id) => (id === YALE_DRAMA.id ? { person: student(sim) } : undefined),
  seeds: () => [YALE_DRAMA.id],
  look: ({ person }, { sim }) => {
    const school = person?.school;
    const done = !school || school.standing === 'graduated' || school.standing === 'dismissed';
    const year = person ? yearOfStudy(person) : 1;
    const term = termNow(sim);
    const season = termStart(term).fall ? 'fall' : 'spring';
    const courses = COURSES.filter((c) => c.year === year && (school ? c.terms.includes(season) : true));
    const rank = person ? rankIn(person) : 0;
    const next = done ? undefined : nextClasses(sim.now);
    const city = CITIES.get(YALE_DRAMA.cityId);
    const player = sim.universe.playerId;

    const ways: Way[] = (school && done) ? [] : courses.map((c) => ({
      to: at('course', c.code),
      label: c.name,
      detail: `${c.perWeek === 1 ? 'Once' : `${c.perWeek} times`} a week with ${c.teachers}, training ${spokenList(c.skills.map((s) => skillLabel(s).toLowerCase()))}`,
    }));
    if (next !== undefined) {
      ways.push({ to: at('day', dateKey(next, sim.homeZone)), label: `Next Classes ${formatDate(next, schoolZone())}`, detail: 'Nine to three on the next class day, and what else is on it' });
    }
    if (city && lookExists(sim, at('place', city.id))) {
      ways.push({ to: at('place', city.id), label: city.name, detail: school ? 'Where the school stands, and where you have to be at nine on a class day' : 'Where the school stands, and the life of the town around it' });
    }
    if (school) ways.push({ to: at('person', player), label: 'You', detail: 'Your life beside the school, all of it' });

    const summary = !school
      ? `You never studied here; it takes ${YALE_DRAMA.classSize} actors a year into its ${YALE_DRAMA.degree} in ${YALE_DRAMA.program}.`
      : school.standing === 'graduated'
        ? `You graduated with the ${YALE_DRAMA.degree} in ${YALE_DRAMA.program}, ${ordinal(rank)} of ${YALE_DRAMA.classSize} in the class overall.`
        : school.standing === 'dismissed'
          ? 'The school dismissed you, and you left without the degree.'
          : `You’re in your ${YEAR_WORD[year]?.toLowerCase() ?? 'last'} year of three, in ${STANDING_LABEL[school.standing].toLowerCase()} standing, and ${ordinal(rank)} of ${YALE_DRAMA.classSize} in the class overall.`;

    return {
      name: YALE_DRAMA.name,
      kind: !school ? 'A Drama School' : done ? 'Where You Trained' : 'Where You Train',
      parent: school ? at('person', player) : undefined,
      summary,
      body: (
        <>
          <p className="small">
            The {YALE_DRAMA.degree} in {YALE_DRAMA.program}{school ? `, class of ${school.classOf},` : ''} in {city?.name ?? 'New Haven'}, over {YALE_DRAMA.terms} terms. {YALE_DRAMA.dean.name} is the dean, and {YALE_DRAMA.actingChair.name}, the chair of acting, casts every student.
            {school && !done ? ` This is ${termLabel(term)}, and ${courses.length} courses meet in it for your year.` : ''}
            {!school ? ` It teaches ${courses.length} courses in the first year, each training part of an actor’s craft.` : ''}
          </p>
          {school && person?.craft && (
            <div className="grid grid-3">
              <Stat label="Standing" value={STANDING_LABEL[school.standing]} note={school.castable ? 'In the casting pool' : 'Out of the casting pool'} />
              <Stat label="Terms Begun" value={`${school.termsBegun} of ${YALE_DRAMA.terms}`} note={`Class of ${school.classOf}`} />
              <Stat label="Your Place" value={`${ordinal(rank)} of ${YALE_DRAMA.classSize}`} note={`Overall craft ${meanCraft(person.craft).toFixed(1)}`} />
            </div>
          )}
        </>
      ),
      ways,
      provenance: 'The school, its courses and its teachers are the Yale Bulletin’s; how often each meets is SLATE’s estimate.',
    };
  },
});

// ---------------------------------------------------------------------------
// One course
// ---------------------------------------------------------------------------

interface TheCourse { course: Course; person: Person | undefined }

defineLook<TheCourse>('course', {
  gone: 'That course isn’t one the school teaches, so there’s nothing to sit in on.',
  resolve: (sim, id) => {
    const course = COURSES.find((c) => c.code === id);
    return course ? { course, person: student(sim) } : undefined;
  },
  look: ({ course, person }, { sim }) => {
    const craft = person?.craft;
    const school = person?.school;
    const year = person ? yearOfStudy(person) : 0;
    const season = termStart(termNow(sim)).fall ? 'fall' : 'spring';
    const enrolled = !!school && school.standing !== 'graduated' && school.standing !== 'dismissed';
    const taking = enrolled && course.year === year && course.terms.includes(season);
    const next = taking ? nextMeeting(sim, course) : undefined;
    const terms = course.terms.length === 2 ? 'the fall and the spring' : `the ${course.terms[0]}`;
    const often = course.perWeek === 1 ? 'once' : `${course.perWeek} times`;

    const ways: Way[] = course.skills.map((s) => ({
      to: at('skill', s),
      label: skillLabel(s),
      detail: craft ? `You’re at ${craft[s].toFixed(1)} in it, and can reach ${ceilingOf(craft, s).toFixed(1)}` : 'Part of an actor’s craft, and every course that trains it',
    }));
    if (next !== undefined) {
      ways.push({ to: at('day', dateKey(next, sim.homeZone)), label: `Meets Next ${formatDate(next, schoolZone())}`, detail: 'Its next class day on the timetable, and what else is on it' });
    }
    // Its work set and open, each opening into how far it’s prepared (from 2026-10-09).
    for (const a of person ? (courseworkOf(sim, person)?.assignments ?? []).filter((x) => x.course === course.code && (x.status === 'open' || x.status === 'revising')) : []) {
      ways.push({ to: at('assignment', a.id), label: templateById(a.template)?.title ?? 'Work Set', detail: `Set for this course, due ${a.status === 'revising' && a.revision ? a.revision.dueOn : a.dueOn}, and how far it’s prepared` });
    }
    ways.push({ to: at('school', YALE_DRAMA.id), label: YALE_DRAMA.short, detail: school ? 'Where it’s taught, and where you stand there' : 'Where it’s taught, and in what town' });

    return {
      name: course.name,
      kind: `A ${YEAR_WORD[course.year]}-Year Course`,
      parent: at('school', YALE_DRAMA.id),
      summary: taking
        ? `You’re taking it this term, ${often} a week, with ${course.teachers}.`
        : !school
          ? `It’s taught ${often} a week in ${terms} of the ${YEAR_WORD[course.year].toLowerCase()} year, by ${course.teachers}, and you never sat in it.`
          : course.year > year && enrolled
            ? `You take it in your ${YEAR_WORD[course.year].toLowerCase()} year, in ${terms}, with ${course.teachers}.`
            : `You aren’t taking it this term; it runs in ${terms} of the ${YEAR_WORD[course.year].toLowerCase()} year, with ${course.teachers}.`,
      body: (
        <>
          <p className="small">
            {course.code} trains {spokenList(course.skills.map((s) => skillLabel(s).toLowerCase()))}. A class you come to, rested and in New Haven at nine, grows them; the nearer a skill is to what you can reach, the less each class adds.
          </p>
          {craft && (
            <div className="grid grid-3">
              {course.skills.map((s) => (
                <Stat key={s} label={skillLabel(s)} value={craft[s].toFixed(1)} note={`Of a reach of ${ceilingOf(craft, s).toFixed(1)}`} />
              ))}
            </div>
          )}
        </>
      ),
      ways,
      provenance: 'Its code, its name and its teachers are the Bulletin’s; the week it’s placed in is SLATE’s estimate.',
    };
  },
});

// ---------------------------------------------------------------------------
// One skill
// ---------------------------------------------------------------------------

interface TheSkill { skill: Skill; label: string; person: Person | undefined }

defineLook<TheSkill>('skill', {
  gone: 'That isn’t part of an actor’s craft as the school reads it.',
  resolve: (sim, id) => {
    const found = SKILLS.find((s) => s.id === id);
    return found ? { skill: found.id, label: found.label, person: student(sim) } : undefined;
  },
  look: ({ skill, label, person }) => {
    const craft = person?.craft;
    const training = COURSES.filter((c) => c.skills.includes(skill));
    const ways: Way[] = [
      ...training.map((c) => ({
        to: at('course', c.code),
        label: c.name,
        detail: `${YEAR_WORD[c.year]} year, ${c.perWeek === 1 ? 'once' : `${c.perWeek} times`} a week, with ${c.teachers}`,
      })),
      { to: at('school', YALE_DRAMA.id), label: YALE_DRAMA.short, detail: craft ? 'Whose classes grow it, and where you stand there' : 'Whose classes train it, and in what town' },
    ];
    const taught = training.length
      ? `${training.length === 1 ? 'One course trains' : `${training.length} courses train`} it over the three years.`
      : 'No course trains it.';

    if (!craft || !person?.school) {
      return {
        name: label,
        kind: 'Part Of An Actor’s Craft',
        parent: at('school', YALE_DRAMA.id),
        summary: `Nobody has measured you in it, since you never trained at the school, where ${training.length === 1 ? 'one course teaches' : `${training.length} courses teach`} it.`,
        body: <p className="small">{taught} Rehearsals, performances and the work grow it too, in an actor who has been measured in it.</p>,
        ways,
      };
    }

    const mine = craft[skill];
    const reach = ceilingOf(craft, skill);
    const theirs = person.school.classmates.map((m) => m.craft[skill]);
    const best = theirs.length ? Math.max(...theirs) : mine;
    const rank = rankIn(person, skill);
    return {
      name: label,
      kind: 'Part Of Your Craft',
      parent: at('school', YALE_DRAMA.id),
      summary: `You’re at ${mine.toFixed(1)} in it, ${ordinal(rank)} of ${YALE_DRAMA.classSize} in the class, with room to grow to ${reach.toFixed(1)}.`,
      body: (
        <>
          <p className="small">
            {taught} Rehearsals, performances and later the work grow it too, more when you come rested and less the nearer you are to what you can reach.
          </p>
          <div className="grid grid-3">
            <Stat label="You" value={mine.toFixed(1)} note={`Can reach ${reach.toFixed(1)}`} />
            <Stat label="Class Best" value={best.toFixed(1)} note={`Middle of the class ${median(theirs).toFixed(1)}`} />
            <Stat label="Your Place" value={`${ordinal(rank)} of ${YALE_DRAMA.classSize}`} note="Among the class" />
          </div>
        </>
      ),
      ways,
      provenance: 'How much a session adds, and the scale, are SLATE’s; the ceiling is fitted to published studies of practice.',
    };
  },
});

// ---------------------------------------------------------------------------
// A piece of coursework (from the connected world of 2026-10-09)
// ---------------------------------------------------------------------------

interface TheWork { person: Person; a: Assignment }

const STATUS_WORD: Record<Assignment['status'], string> = { open: 'Open', revising: 'To Show Again', done: 'Shown', missed: 'Missed', lapsed: 'Let Lapse' };

defineLook<TheWork>('assignment', {
  gone: 'That work isn’t set, or was never yours.',
  resolve: (sim, id) => {
    const person = student(sim);
    const a = person ? assignmentById(sim, person, id) : undefined;
    return person && a ? { person, a } : undefined;
  },
  seeds: (sim) => { const p = student(sim); return p ? (courseworkOf(sim, p)?.assignments ?? []).slice(-3).map((a) => a.id) : []; },
  look: ({ person, a }) => {
    const t = templateById(a.template)!;
    const course = COURSES.find((c) => c.code === a.course);
    const due = a.status === 'revising' && a.revision ? a.revision.dueOn : a.dueOn;
    const parts = preparedParts(person, a, due);
    const weights = weightsOf(a);
    const dims = (Object.keys(t.dims) as PrepDim[]).filter((d) => t.dims[d]);
    const [y, m, d] = due.split('-').map(Number);
    const dueAt = instantFromZoned({ year: y!, month: m!, day: d!, hour: 9 }, schoolZone());
    const ways: Way[] = [];
    if (course) ways.push({ to: at('course', course.code), label: course.name, detail: 'The course that set it, and what it trains' });
    ways.push({ to: at('day', due), label: `Due ${formatDate(dueAt, schoolZone())}`, detail: 'The day it’s shown, and what else is on it' });
    ways.push({ to: at('readiness', person.id), label: 'Readiness', detail: 'How sharp you come to the work, which each step of preparing it reads' });
    return {
      name: `${course?.name ?? a.course}: ${t.title}`,
      kind: 'A Piece Of Coursework',
      summary: `${STATUS_WORD[a.status]}. ${t.deliverable}, due ${formatDate(dueAt, schoolZone())}.${a.shown ? ` Shown: ${BAND_LABEL[a.shown.band]}.` : ''}`,
      parent: course ? at('course', course.code) : undefined,
      body: (
        <table>
          <thead><tr><th scope="col">Part</th><th scope="col" className="num">Prepared</th><th scope="col" className="num">Of The Showing</th></tr></thead>
          <tbody>
            {dims.map((k) => (
              <tr key={k}>
                <td className="small">{t.dims[k]!.label}</td>
                <td className="num mono">{Math.round((parts[k] ?? a.prep[k] ?? 0) * 100)}%</td>
                <td className="num mono dim">{Math.round((weights[k] ?? 0) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
      ways,
      provenance: 'Prepared is how far each part stands on the day it’s due, what fades by then taken off; the showing weighs each part by its share. The steps that prepare it are on the School’s coursework.',
    };
  },
});
