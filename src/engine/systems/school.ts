/**
 * SLATE — school.
 *
 * The years of a life that a game about a career usually skips, and which
 * are where a career like this one actually starts. A week with six periods
 * a day in it, subjects that are the subjects, marks that move on whether you
 * turned up and whether you did the work, a team you have to try out for, and
 * a school play.
 *
 * The play is the point. A part in one is the first thing on anybody's
 * record, it is where the acting attributes first move, and where somebody is
 * good enough it is what gets them noticed by people outside the school.
 *
 * What is real here is the structure: the stages, what a year is called where
 * you are, the exam at the end of it, and the ages the law compels. The
 * school itself, the timetable and every mark are SLATE's own, and the room
 * says so. Sport is not here at all: there is one sport in this game, it is
 * the track, and it lives in the athletics module.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, Lesson, Person, SchoolPart, Schooling, SubjectMark } from '../domain/model';
import { clamp } from '../core/rng';
import type { Instant } from '../core/time';
import { MS_MINUTE, addDays, addYears, formatDate, zonedParts } from '../core/time';
import { plural } from '../core/text';
import { countryOfCity } from '../content/geography';
import { placesIn, type Place } from '../content/places';
import {
  ACADEMIC_SCHOLARSHIP, CLUB_BY_ID, LEAD_TAKES, NOTICED_AT, PART_LABEL, PERIODS_A_DAY,
  PERIOD_MINUTES, SCHOOL_DAYS, SCHOOL_PLAYS, SCHOOL_STARTS_HOUR, SUBJECTS, SUBJECT_BY_ID,
  UNIVERSITY_LOOKS_AT, type EducationSystem, type Stage,
  markLabel, mustAttend, stageForAge, systemIn, yearLabel,
} from '../content/schooling';
import { ageOf, youthFactor } from './lifespan';
import { attributesOf } from '../domain/attributes';

// ---------------------------------------------------------------------------
// Where you are in it
// ---------------------------------------------------------------------------

/** The education system where this person lives. */
export function systemFor(sim: Simulation, person: Person = sim.player): EducationSystem {
  return systemIn(countryOfCity(person.currentLocationId) ?? person.citizenshipId);
}

/** The stage of school somebody of this age is in, or none if they are past it. */
export function stageFor(sim: Simulation, person: Person = sim.player): Stage | undefined {
  return stageForAge(systemFor(sim, person), ageOf(sim, person));
}

/** What their year is called where they are: Year 11, Grade 10, Seconde. */
export function yearFor(sim: Simulation, person: Person = sim.player): string {
  const stage = stageFor(sim, person);
  return stage ? yearLabel(stage, ageOf(sim, person)) : '';
}

/** Whether the law where they are requires them to be at school. */
export function schoolIsCompulsory(sim: Simulation, person: Person = sim.player): boolean {
  return mustAttend(systemFor(sim, person), ageOf(sim, person));
}

/** The schools in a city, by which stage they take. */
export function schoolsIn(sim: Simulation, secondary: boolean, cityId: string = sim.player.currentLocationId): Place[] {
  const kind = secondary ? 'secondary_school' : 'primary_school';
  return placesIn(cityId).filter((one) => one.kind === kind);
}

/** The school somebody is at, if they are at one. */
export function schoolingOf(sim: Simulation, personId: Id = sim.player.id): Schooling | undefined {
  return Object.values(sim.universe.schooling ?? {})
    .find((one) => one.personId === personId && !one.endedAt);
}

/** Everything they have ever been enrolled in, newest first. */
export function schoolHistoryOf(sim: Simulation, personId: Id = sim.player.id): Schooling[] {
  return Object.values(sim.universe.schooling ?? {})
    .filter((one) => one.personId === personId)
    .sort((a, b) => b.startedAt - a.startedAt);
}

// ---------------------------------------------------------------------------
// The week
// ---------------------------------------------------------------------------

/** The subjects on a timetable at this age. */
export function subjectsAt(age: number): typeof SUBJECTS[number][] {
  return SUBJECTS.filter((one) => age >= one.fromAge);
}

/**
 * A week, built once and then it is the week.
 *
 * Six periods a day, five days, with the core subjects appearing more often
 * than the rest, because that is what a timetable looks like. Generated from
 * the seed so the same year at the same school is the same week every time.
 */
export function buildTimetable(sim: Simulation, person: Person, placeId: string, age: number): Lesson[] {
  const rng = sim.rng('school.timetable', person.id, placeId, age);
  const available = subjectsAt(age);
  const core = available.filter((one) => ['language', 'mathematics', 'science'].includes(one.id));
  const rest = available.filter((one) => !core.includes(one));

  // Build the week as a quota first — the core subjects five times, everything
  // else twice — and then deal it out. Drawing each period at random gave a
  // seven year old three periods of games in one day, which is not a
  // timetable, it is a coincidence.
  const slots = SCHOOL_DAYS.length * PERIODS_A_DAY;
  const week: string[] = [];
  for (const one of core) for (let i = 0; i < 5; i++) week.push(one.id);
  for (const one of rest) for (let i = 0; i < 2; i++) week.push(one.id);
  while (week.length < slots) week.push(rng.pick(core.length > 0 ? core : available).id);
  const dealt = rng.shuffle(week).slice(0, slots);

  // And no subject twice running or more than twice in a day, which is the
  // constraint a real timetable is built under.
  const out: Lesson[] = [];
  const perDay = new Map<string, number>();
  const queue = [...dealt];
  for (const day of SCHOOL_DAYS) {
    let last = '';
    for (let period = 1; period <= PERIODS_A_DAY; period++) {
      let picked = -1;
      for (let i = 0; i < queue.length; i++) {
        const id = queue[i]!;
        if (id === last) continue;
        if ((perDay.get(`${day}:${id}`) ?? 0) >= 2) continue;
        picked = i;
        break;
      }
      if (picked < 0) picked = 0;
      const subjectId = queue.splice(picked, 1)[0] ?? available[0]!.id;
      perDay.set(`${day}:${subjectId}`, (perDay.get(`${day}:${subjectId}`) ?? 0) + 1);
      last = subjectId;
      out.push({ day, period, subjectId });
    }
  }
  return out;
}

/** What is on today, in order. */
export function todaysLessons(sim: Simulation, schooling: Schooling): Lesson[] {
  const day = zonedParts(sim.now, sim.homeZone).weekday;
  return schooling.timetable.filter((one) => one.day === day).sort((a, b) => a.period - b.period);
}

/** Whether today is a school day at all. */
export function isASchoolDay(sim: Simulation): boolean {
  return SCHOOL_DAYS.includes(zonedParts(sim.now, sim.homeZone).weekday);
}

/** When the school day starts and ends today. */
export function schoolHours(sim: Simulation): { from: Instant; to: Instant } {
  const day = zonedParts(sim.now, sim.homeZone);
  const midnight = sim.now - ((day.hour * 60 + day.minute) * 60_000);
  const from = midnight + SCHOOL_STARTS_HOUR * 60 * 60_000;
  return { from, to: from + PERIODS_A_DAY * PERIOD_MINUTES * MS_MINUTE + 60 * MS_MINUTE };
}

// ---------------------------------------------------------------------------
// Marks
// ---------------------------------------------------------------------------

/** The mark in one subject, or the starting one. */
export function markFor(schooling: Schooling, subjectId: string): SubjectMark {
  return schooling.marks.find((one) => one.subjectId === subjectId)
    ?? { subjectId, mark: 55, attended: 0, missed: 0 };
}

/** The average across everything on the timetable, out of a hundred. */
export function averageMark(schooling: Schooling): number {
  if (schooling.marks.length === 0) return 55;
  const total = schooling.marks.reduce((sum, one) => sum + one.mark, 0);
  return Math.round((total / schooling.marks.length) * 10) / 10;
}

/** How much of school they have actually turned up to, as a percentage. */
export function attendance(schooling: Schooling): number {
  const sat = schooling.marks.reduce((sum, one) => sum + one.attended, 0);
  const missed = schooling.marks.reduce((sum, one) => sum + one.missed, 0);
  if (sat + missed === 0) return 100;
  return Math.round((sat / (sat + missed)) * 100);
}

/** Whether these marks would open a university, and whether they pay for it. */
export function standingOn(schooling: Schooling): { university: boolean; scholarship: boolean; label: string } {
  const average = averageMark(schooling);
  return {
    university: average >= UNIVERSITY_LOOKS_AT,
    scholarship: average >= ACADEMIC_SCHOLARSHIP,
    label: markLabel(average),
  };
}

/** How well somebody is naturally suited to a subject, out of a hundred. */
function aptitudeFor(sim: Simulation, person: Person, subjectId: string): number {
  const subject = SUBJECT_BY_ID[subjectId];
  const rng = sim.rng('school.aptitude', person.id, subjectId);
  const base = rng.int(38, 76);
  if (!subject?.feeds) return base;
  // Not through the youth curve. That curve is about what a young body and a
  // young judgement can deliver in a room full of adults, and school is not
  // that: a fifteen year old can and does top the year. Holding school marks
  // under it would have made university unreachable for anybody who went
  // through school, which is the wrong end of the stick entirely.
  if (subject.feeds.kind === 'attribute') {
    const held = attributesOf(person)[subject.feeds.key] ?? 0;
    return clamp(Math.round(base * 0.6 + held * 0.4), 5, 98);
  }
  const held = person.skills?.[subject.feeds.key] ?? 0;
  return clamp(Math.round(base * 0.6 + held * 0.4), 5, 98);
}

// ---------------------------------------------------------------------------
// Starting, and moving up
// ---------------------------------------------------------------------------

/**
 * Put somebody in the school they would be at.
 *
 * Idempotent: somebody already enrolled and still in the right stage stays
 * where they are. Somebody who has moved up a stage is enrolled at the next
 * school and their old record is closed with the result they leave with.
 */
export function ensureSchooling(sim: Simulation, person: Person = sim.player): Schooling | undefined {
  sim.universe.schooling ??= {};
  const system = systemFor(sim, person);
  const age = ageOf(sim, person);
  const stage = stageForAge(system, age);
  const current = schoolingOf(sim, person.id);

  if (!stage) {
    // Past school age. Close whatever was open, with what they left with.
    if (current) finishStage(sim, current, 'left school');
    return undefined;
  }
  if (current && current.stageId === stage.id) {
    current.yearLabel = yearLabel(stage, age);
    return current;
  }
  if (current) finishStage(sim, current, 'moved up');

  const secondary = stage.from >= 11;
  const options = schoolsIn(sim, secondary, person.currentLocationId);
  const fallback = schoolsIn(sim, !secondary, person.currentLocationId);
  // A thirteen year old does not go to a high school if the town has anything
  // else, because a high school is not what a thirteen year old attends.
  const middle = /middle|junior/i.test(stage.label);
  const suits = options.find((one) => (middle ? !/high school/i.test(one.name) : true));
  const place = suits ?? options[0] ?? fallback[0];
  if (!place) return undefined;

  const schooling: Schooling = {
    id: sim.nextId('school'),
    saveId: sim.universe.meta.id,
    personId: person.id,
    systemId: system.id,
    placeId: place.id,
    placeName: place.name,
    stageId: stage.id,
    yearLabel: yearLabel(stage, age),
    timetable: buildTimetable(sim, person, place.id, age),
    marks: subjectsAt(age).map((one) => ({
      subjectId: one.id,
      mark: aptitudeFor(sim, person, one.id),
      attended: 0,
      missed: 0,
    })),
    clubs: [],
    parts: [],
    results: current?.results ? [...current.results] : [],
    startedAt: sim.now,
  };
  sim.universe.schooling[schooling.id] = schooling;
  if (person.isPlayer) {
    sim.notify({
      title: `You Start At ${place.name}`,
      body: `${stage.label}, ${schooling.yearLabel}. ${plural(schooling.timetable.length, 'lesson')} a week.`,
      category: 'personal',
      importance: 48,
      route: '/workspace/education',
      refType: 'place', refId: place.id,
    });
  }
  return schooling;
}

/** Close a stage, writing down whatever qualification it ends with. */
function finishStage(sim: Simulation, schooling: Schooling, reason: string): void {
  const system = systemIn(countryOfCity(sim.player.currentLocationId) ?? sim.player.citizenshipId);
  const stage = system.stages.find((one) => one.id === schooling.stageId);
  const average = averageMark(schooling);
  if (stage?.exam) {
    schooling.results.push({ name: stage.exam.name, stageId: stage.id, average, at: sim.now });
    if (schooling.personId === sim.player.id) {
      sim.remember({
        category: 'life',
        title: `Got ${stage.exam.name}`,
        detail: `${markLabel(average)}, averaging ${average} across the year at ${schooling.placeName}.`,
        refs: [{ type: 'person', id: schooling.personId }],
        significance: 6,
        public: false,
      });
    }
  }
  schooling.endedAt = sim.now;
  schooling.endReason = reason;
}

/**
 * The school an adult already went to.
 *
 * Somebody who starts life at twenty two was never enrolled by SLATE and would
 * otherwise be carrying nothing at all, which a university reads as never
 * having been to school rather than as having left it. This writes the record
 * they would have: the last stage of their country's system, the marks their
 * own aptitude and application would have got them, the qualification that
 * stage awards, and the year they finished. Idempotent, and it never touches
 * anybody who has a record already or who is still of school age.
 */
export function ensureSchoolLeaver(sim: Simulation, person: Person = sim.player): Schooling | undefined {
  sim.universe.schooling ??= {};
  if (schoolHistoryOf(sim, person.id).length > 0) return undefined;
  const system = systemFor(sim, person);
  const age = ageOf(sim, person);
  const last = system.stages[system.stages.length - 1];
  // Still of school age, so it is the enrolment that belongs to them, not this.
  if (!last || age <= last.to) return undefined;

  const place = schoolsIn(sim, true, person.currentLocationId)[0]
    ?? schoolsIn(sim, false, person.currentLocationId)[0];
  if (!place) return undefined;

  // How the years went. Some people worked at it and some did not, and by the
  // time somebody is an adult that is already decided.
  const rng = sim.rng('school.leaver', person.id);
  const applied = rng.int(-6, 14);
  const zone = sim.homeZone;
  const started = addYears(person.birthInstant, last.from, zone);
  const ended = addYears(person.birthInstant, last.to + 1, zone);
  const marks = subjectsAt(last.to).map((one) => ({
    subjectId: one.id,
    mark: clamp(aptitudeFor(sim, person, one.id) + applied, 5, 99),
    attended: 0,
    missed: 0,
  }));
  const average = marks.length === 0
    ? 55
    : Math.round((marks.reduce((sum, one) => sum + one.mark, 0) / marks.length) * 10) / 10;

  const schooling: Schooling = {
    id: sim.nextId('school'),
    saveId: sim.universe.meta.id,
    personId: person.id,
    systemId: system.id,
    placeId: place.id,
    placeName: place.name,
    stageId: last.id,
    yearLabel: yearLabel(last, last.to),
    timetable: [],
    marks,
    clubs: [],
    parts: [],
    results: last.exam
      ? [{ name: last.exam.name, stageId: last.id, average, at: ended }]
      : [],
    startedAt: started,
    endedAt: ended,
    endReason: 'left school',
  };
  sim.universe.schooling[schooling.id] = schooling;
  return schooling;
}

/** Every qualification somebody holds, oldest first. */
export function qualificationsOf(sim: Simulation, personId: Id = sim.player.id): { name: string; average: number; at: Instant }[] {
  return schoolHistoryOf(sim, personId)
    .flatMap((one) => one.results)
    .sort((a, b) => a.at - b.at)
    .map(({ name, average, at }) => ({ name, average, at }));
}

// ---------------------------------------------------------------------------
// The play
// ---------------------------------------------------------------------------

/** How good somebody would be in an audition, out of a hundred. */
export function auditionStrength(sim: Simulation, person?: Person): number {
  const who = person ?? sim.player;
  const a = attributesOf(who);
  const craft = ((a.emotional_truth ?? 30) + (a.improvisation ?? 30) + (a.memorization ?? 30)) / 3;
  const voice = ((a.projection ?? 30) + (a.diction ?? 30)) / 2;
  const screen = a.charisma ?? 30;
  const raw = craft * 0.5 + voice * 0.25 + screen * 0.25;
  // Through the years they have actually had. A gifted twelve year old is a
  // gifted twelve year old.
  return clamp(Math.round(raw * youthFactor(sim, who)), 1, 100);
}

/**
 * What is in there, before the years have got at it.
 *
 * The difference between this and the number above is the whole point of
 * being young: a fourteen year old cannot yet do what they will be able to
 * do, but somebody who knows what they are looking at can see it. This is
 * what a scout in the back of a school hall is reading, which is why a child
 * gets found at all.
 */
export function rawTalent(sim: Simulation, person?: Person): number {
  const who = person ?? sim.player;
  const a = attributesOf(who);
  const craft = ((a.emotional_truth ?? 30) + (a.improvisation ?? 30) + (a.memorization ?? 30)) / 3;
  const voice = ((a.projection ?? 30) + (a.diction ?? 30)) / 2;
  const screen = a.charisma ?? 30;
  return clamp(Math.round(craft * 0.5 + voice * 0.25 + screen * 0.25), 1, 100);
}

/** The play this school is doing this year. */
export function productionFor(sim: Simulation, schooling: Schooling): typeof SCHOOL_PLAYS[number] {
  const year = zonedParts(sim.now, sim.homeZone).year;
  return sim.rng('school.play', schooling.placeId, year).pick(SCHOOL_PLAYS);
}

/** The part somebody has in this year's play, if they auditioned. */
export function partThisYear(sim: Simulation, schooling: Schooling): SchoolPart | undefined {
  const year = zonedParts(sim.now, sim.homeZone).year;
  return schooling.parts.find((one) => zonedParts(one.auditionedAt, sim.homeZone).year === year);
}

/** How a part reads. */
export function describePart(part: SchoolPart): string {
  const what = PART_LABEL[part.part] ?? 'A Part';
  if (part.verdict === undefined) return `${what} in ${part.title}.`;
  const how = part.verdict >= 80 ? 'It went very well.'
    : part.verdict >= 60 ? 'It went well enough.'
      : part.verdict >= 40 ? 'It was fine.' : 'It was not your night.';
  return `${what} in ${part.title}. ${how}${part.noticed ? ' Somebody outside the school was watching.' : ''}`;
}

// ---------------------------------------------------------------------------
// The commands
// ---------------------------------------------------------------------------

export function registerSchool(sim: Simulation): void {
  /** A day of it. Six periods, and what you get out of them. */
  sim.onCommand<
    { effort?: 'coast' | 'normal' | 'hard' },
    { lessons: number; learned: number; average: number; note: string }
  >(
    'school.attend',
    (p, { sim: s }) => {
      const schooling = ensureSchooling(s);
      if (!schooling) throw new CommandError('You are not at school.');
      if (!isASchoolDay(s)) throw new CommandError('There is no school today.');
      const hours = schoolHours(s);
      if (s.now > hours.to) throw new CommandError('School is over for today.');
      const today = todaysLessons(s, schooling);
      if (today.length === 0) throw new CommandError('There is nothing on your timetable today.');

      const effort = p.effort ?? 'normal';
      const put = effort === 'hard' ? 1.55 : effort === 'coast' ? 0.45 : 1;
      const tired = s.player.wellbeing.energy < 30 ? 0.6 : 1;
      const rng = s.rng('school.day', schooling.id, s.now);

      let learned = 0;
      for (const lesson of today) {
        const mark = markFor(schooling, lesson.subjectId);
        const aptitude = aptitudeFor(s, s.player, lesson.subjectId);
        // A mark moves toward what you are capable of, at the speed you are
        // working. Nothing jumps: a term is a lot of days.
        const toward = clamp(aptitude + (effort === 'hard' ? 12 : effort === 'coast' ? -8 : 0), 5, 99);
        const step = (toward - mark.mark) * 0.035 * put * tired + rng.float(-0.4, 0.4);
        mark.mark = clamp(Math.round((mark.mark + step) * 10) / 10, 0, 100);
        mark.attended += 1;
        learned += step;
        const existing = schooling.marks.find((one) => one.subjectId === lesson.subjectId);
        if (!existing) schooling.marks.push(mark);
      }

      // What the day itself costs.
      s.advanceTo(Math.max(s.now, hours.to));
      s.player.wellbeing.energy = clamp(
        s.player.wellbeing.energy - (effort === 'hard' ? 26 : effort === 'coast' ? 12 : 18), 0, 100,
      );
      s.player.wellbeing.stress = clamp(
        s.player.wellbeing.stress + (effort === 'hard' ? 8 : effort === 'coast' ? 1 : 4), 0, 100,
      );

      const average = averageMark(schooling);
      const note = effort === 'hard'
        ? `${plural(today.length, 'lesson')}, and you worked. ${markLabel(average)} overall.`
        : effort === 'coast'
          ? `${plural(today.length, 'lesson')}, mostly spent elsewhere. ${markLabel(average)} overall.`
          : `${plural(today.length, 'lesson')}. ${markLabel(average)} overall.`;
      s.emit('school.attended', { schoolingId: schooling.id, lessons: today.length, effort });
      return { lessons: today.length, learned: Math.round(learned * 10) / 10, average, note };
    },
  );

  /** Not going. It costs the marks and somebody notices. */
  sim.onCommand<{ reason?: string }, { missed: number; attendance: number; note: string }>(
    'school.skip',
    (p, { sim: s }) => {
      const schooling = ensureSchooling(s);
      if (!schooling) throw new CommandError('You are not at school.');
      if (!isASchoolDay(s)) throw new CommandError('There is no school today to miss.');
      const today = todaysLessons(s, schooling);
      if (today.length === 0) throw new CommandError('There is nothing on today.');

      for (const lesson of today) {
        const mark = markFor(schooling, lesson.subjectId);
        mark.missed += 1;
        mark.mark = clamp(Math.round((mark.mark - 0.9) * 10) / 10, 0, 100);
        if (!schooling.marks.find((one) => one.subjectId === lesson.subjectId)) schooling.marks.push(mark);
      }
      const rate = attendance(schooling);
      s.advanceTo(schoolHours(s).to);
      // Below four fifths somebody rings home, which is how it works.
      const note = rate < 80
        ? `${plural(today.length, 'lesson')} missed. Attendance is ${rate}%, and the school has been in touch with home.`
        : `${plural(today.length, 'lesson')} missed. Attendance is ${rate}%.`;
      if (rate < 80 && s.player.isPlayer) {
        s.notify({
          title: 'The School Called Home',
          body: `Attendance is down to ${rate}%. Somebody wants a word.`,
          category: 'personal',
          importance: 58,
          route: '/workspace/education',
        });
      }
      s.emit('school.skipped', { schoolingId: schooling.id, lessons: today.length, reason: p.reason });
      return { missed: today.length, attendance: rate, note };
    },
  );

  /** Joining something that meets after school. */
  sim.onCommand<{ clubId: string }, { clubId: string; note: string }>(
    'school.join_club',
    (p, { sim: s }) => {
      const schooling = ensureSchooling(s);
      if (!schooling) throw new CommandError('You are not at school.');
      const club = CLUB_BY_ID[p.clubId];
      if (!club) throw new CommandError('The school does not run that.');
      const age = ageOf(s);
      if (age < club.fromAge) throw new CommandError(`${club.label} is for ${club.fromAge} and up. You are ${age}.`);
      if (schooling.clubs.includes(club.id)) throw new CommandError(`You are already in ${club.label}.`);
      if (schooling.clubs.length >= 3) throw new CommandError('Three is as many as anybody can actually keep up.');

      schooling.clubs.push(club.id);
      s.remember({
        category: 'life',
        title: `Joined ${club.label}`,
        detail: `${club.about} At ${schooling.placeName}.`,
        refs: [{ type: 'person', id: s.player.id }],
        significance: 3,
        public: false,
      });
      s.emit('school.joined_club', { schoolingId: schooling.id, clubId: club.id });
      return { clubId: club.id, note: club.about };
    },
  );

  /**
   * Auditioning for the school play.
   *
   * The one that matters. What part you get is what you can actually do, and
   * a lead in front of a hall is where somebody outside the school first sees
   * you.
   */
  sim.onCommand<Record<string, never>, { part: string; title: string; performsAt: Instant; note: string }>(
    'school.audition',
    (_p, { sim: s }) => {
      const schooling = ensureSchooling(s);
      if (!schooling) throw new CommandError('You are not at school.');
      if (!schooling.clubs.includes('drama')) {
        throw new CommandError('The play is cast out of the drama club. Join it first.');
      }
      if (partThisYear(s, schooling)) throw new CommandError('You have already auditioned this year.');

      const production = productionFor(s, schooling);
      const strength = auditionStrength(s, s.player);
      const rng = s.rng('school.audition', schooling.id, production.id);
      const onTheDay = clamp(strength + rng.int(-14, 14), 0, 100);
      const part = onTheDay >= LEAD_TAKES ? 'lead'
        : onTheDay >= 52 ? 'supporting'
          : onTheDay >= 32 ? 'ensemble' : 'crew';

      const record: SchoolPart = {
        id: s.nextId('part'),
        productionId: production.id,
        title: production.title,
        part,
        auditionedAt: s.now,
        performsAt: addDays(s.now, rng.int(48, 92), s.homeZone),
      };
      schooling.parts.push(record);
      s.advanceTo(s.now + 75 * MS_MINUTE);

      s.schedule({
        at: record.performsAt,
        kind: 'school.performance',
        label: `${production.title} — ${schooling.placeName}`,
        category: 'personal',
        payload: { schoolingId: schooling.id, partId: record.id },
        priority: 60,
        requiresPlayer: true,
        refType: 'place', refId: schooling.placeId,
      });

      const note = `${PART_LABEL[part]} in ${production.title}. ${production.about} `
        + `On ${formatDate(record.performsAt, s.homeZone)}.`;
      s.emit('school.cast', { schoolingId: schooling.id, partId: record.id, part });
      return { part, title: production.title, performsAt: record.performsAt, note };
    },
  );

  // --- The night itself ----------------------------------------------------

  sim.onSchedule('school.performance', (item, s) => {
    const payload = item.payload as { schoolingId: Id; partId: Id };
    const schooling = s.universe.schooling?.[payload.schoolingId];
    const part = schooling?.parts.find((one) => one.id === payload.partId);
    if (!schooling || !part || part.verdict !== undefined) return;

    const rng = s.rng('school.night', part.id);
    const strength = auditionStrength(s, s.player);
    const weight = part.part === 'lead' ? 1 : part.part === 'supporting' ? 0.75 : part.part === 'ensemble' ? 0.4 : 0.15;
    const verdict = clamp(Math.round(strength * weight + rng.int(-10, 16)), 0, 100);
    part.verdict = verdict;

    // Somebody outside the school only sees you if you had a real part, were
    // good in it on the night, and have the thing itself in you — which is
    // read raw rather than through your age, because that is what somebody
    // sitting at the back of a school hall is actually looking for. It is how
    // a fourteen year old gets found, and it is still a narrow doorway.
    const noticed = (part.part === 'lead' || part.part === 'supporting')
      && rawTalent(s) >= NOTICED_AT
      && verdict >= 55
      && rng.chance(0.42);
    part.noticed = noticed;
    part.note = noticed
      ? 'Somebody from outside was in the hall, and asked afterward who you were.'
      : undefined;

    // What it does to a young actor: the craft moves, and a little standing.
    const gain = Math.round(verdict / 22);
    s.player.attributes ??= {};
    for (const key of ['emotional_truth', 'projection', 'memorization']) {
      s.player.attributes[key] = clamp((s.player.attributes[key] ?? 0) + gain, 0, 100);
    }
    if (noticed) {
      s.player.reputation.professionalReputation = clamp(s.player.reputation.professionalReputation + 6, 0, 100);
    }

    s.notify({
      title: noticed ? `${part.title}, And Somebody Was Watching` : `${part.title} Went Up`,
      body: describePart(part),
      category: 'personal',
      importance: noticed ? 74 : 44,
      route: '/workspace/education',
      refType: 'place', refId: schooling.placeId,
    });
    s.remember({
      category: 'life',
      title: `${PART_LABEL[part.part]} in ${part.title}`,
      detail: describePart(part),
      refs: [{ type: 'person', id: s.player.id }],
      significance: noticed ? 7 : 4,
      public: noticed,
    });
    s.emit('school.performed', { partId: part.id, verdict, noticed });
  });
}
