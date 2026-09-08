/**
 * SLATE — university.
 *
 * The end of the school ladder and the last part of the life cycle before a
 * career. You apply with the marks you actually have, a place is offered or
 * it is not and you are told why, a scholarship may pay for some of it, and
 * three years later you come out with a class of degree that depends on what
 * you did while you were there.
 *
 * The universities are real, and so are the towns they stand in, the years
 * they were founded and the way each country charges for a degree. Whether
 * one would take you, what it costs you and what a term does to you are
 * SLATE's own, and the page says so.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, Person, Studies, UniversityApplication } from '../domain/model';
import { clamp } from '../core/rng';
import type { Instant } from '../core/time';
import { MS_DAY, addDays, formatDate } from '../core/time';
import { plural } from '../core/text';
import { formatMoney, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { costOfLiving } from '../content/tax';
import {
  ATHLETIC_SCHOLARSHIP_COUNTRIES, MAJOR_BY_ID, SCHOLARSHIP_SHARE, TERM_WEEKS,
  UNIVERSITIES, UNIVERSITY_BY_ID, type University,
  degreeClass, feesIn, majorsAt,
} from '../content/universities';
import { UNIVERSITY_LOOKS_AT, ACADEMIC_SCHOLARSHIP } from '../content/schooling';
import { ageOf, youthFactor } from './lifespan';
import { averageMark, schoolHistoryOf, schoolingOf } from './school';
import { attributesOf } from '../domain/attributes';

/** The earliest anybody is looked at by a university. */
export const APPLY_FROM_AGE = 16;
/** How long a university takes to answer, in days. */
export const DECISION_DAYS: readonly [number, number] = [24, 68];
/** How many places somebody may have open at once. */
export const MAX_OPEN_APPLICATIONS = 5;

// ---------------------------------------------------------------------------
// Where they are
// ---------------------------------------------------------------------------

/** Every university reached from a city. */
export function universitiesIn(cityId: string): University[] {
  return UNIVERSITIES.filter((one) => one.cityId === cityId);
}

/** Every university in a country. */
export function universitiesInCountry(countryId: string): University[] {
  return UNIVERSITIES.filter((one) => one.countryId === countryId);
}

/** Where a university stands, said the way a person would say it. */
export function whereItIs(university: University): string {
  const reachedFrom = CITIES.get(university.cityId)?.name;
  if (!reachedFrom || reachedFrom === university.town) return university.town;
  return `${university.town}, reached from ${reachedFrom}`;
}

// ---------------------------------------------------------------------------
// What you are carrying
// ---------------------------------------------------------------------------

/**
 * The marks a university would look at.
 *
 * The average from the last stage of school that carried an examination, or
 * the marks being carried now if school is not finished.
 */
export function marksOn(sim: Simulation, person: Person = sim.player): number {
  const current = schoolingOf(sim, person.id);
  if (current) return averageMark(current);
  const history = schoolHistoryOf(sim, person.id);
  const last = history.find((one) => one.results.length > 0);
  if (last) return last.results[last.results.length - 1]!.average;
  return history[0] ? averageMark(history[0]) : 0;
}

/** The best a person was at a school sport, out of a hundred. */
export function sportingRecord(sim: Simulation, person: Person = sim.player): { sportId?: string; ability: number; played: number } {
  let best = { sportId: undefined as string | undefined, ability: 0, played: 0 };
  for (const schooling of schoolHistoryOf(sim, person.id)) {
    for (const team of schooling.teams) {
      if (!team.onTheTeam) continue;
      if (team.ability > best.ability) best = { sportId: team.sportId, ability: team.ability, played: team.played };
    }
  }
  return best;
}

/** Applications this person has made, newest first. */
export function applicationsOf(sim: Simulation, personId: Id = sim.player.id): UniversityApplication[] {
  return Object.values(sim.universe.applications ?? {})
    .filter((one) => one.personId === personId)
    .sort((a, b) => b.appliedAt - a.appliedAt);
}

/** The degree they are reading, if they are reading one. */
export function studiesOf(sim: Simulation, personId: Id = sim.player.id): Studies | undefined {
  return Object.values(sim.universe.studies ?? {}).find((one) => one.personId === personId && !one.endedAt);
}

/** Everything they have ever read, newest first. */
export function studiesHistoryOf(sim: Simulation, personId: Id = sim.player.id): Studies[] {
  return Object.values(sim.universe.studies ?? {})
    .filter((one) => one.personId === personId)
    .sort((a, b) => b.startedAt - a.startedAt);
}

/** Degrees actually awarded. */
export function degreesOf(sim: Simulation, personId: Id = sim.player.id): { name: string; awardedClass: string; at: Instant }[] {
  return studiesHistoryOf(sim, personId)
    .filter((one) => one.awardedClass && one.awardedClass !== 'No Award')
    .map((one) => ({
      name: `${MAJOR_BY_ID[one.majorId]?.label ?? one.majorId}, ${one.universityName}`,
      awardedClass: one.awardedClass!,
      at: one.endedAt ?? one.startedAt,
    }));
}

// ---------------------------------------------------------------------------
// Whether they would take you
// ---------------------------------------------------------------------------

export interface Chance {
  /** Whether the marks clear the bar at all. */
  eligible: boolean;
  /** How likely an offer is, out of a hundred. */
  odds: number;
  /** What a scholarship would be offered on, or none. */
  scholarship?: 'academic' | 'athletic';
  /** What the applicant would be told. */
  reason: string;
}

/**
 * What this university would make of this applicant.
 *
 * The marks first, because they are the bar. Then how far above the bar they
 * are against how selective the place is. A conservatoire weighs what you can
 * do rather than what you scored, which is the honest difference between
 * applying to read law and auditioning for a drama school.
 */
export function chanceAt(sim: Simulation, university: University, majorId: string, person: Person = sim.player): Chance {
  const major = MAJOR_BY_ID[majorId];
  const marks = marksOn(sim, person);
  const audition = university.strengths.includes('drama') && major?.field === 'drama';

  if (marks < UNIVERSITY_LOOKS_AT && !audition) {
    return {
      eligible: false,
      odds: 0,
      reason: `${university.name} does not look below ${UNIVERSITY_LOOKS_AT}, and you are carrying ${marks.toFixed(0)}.`,
    };
  }

  // How far above the bar, against how far above it this place expects.
  const strength = audition
    ? clamp(Math.round(auditionRead(sim, person)), 0, 100)
    : clamp(Math.round(marks), 0, 100);
  // Matching what a place expects is a good chance rather than a certainty,
  // and being under it is long odds rather than none. A slope of two and a
  // half points of chance per mark made everything below the very top
  // effectively closed, which is not how admissions work.
  const gap = strength - university.selectivity;
  const odds = clamp(Math.round(60 + gap * 1.7), 3, 96);

  // A scholarship, where one is possible and earned.
  const sport = sportingRecord(sim, person);
  const athleticHere = ATHLETIC_SCHOLARSHIP_COUNTRIES.has(university.countryId);
  const scholarship = marks >= ACADEMIC_SCHOLARSHIP ? 'academic' as const
    : (athleticHere && sport.ability >= 72 && sport.played >= 3) ? 'athletic' as const
      : undefined;

  const reason = audition
    ? `${university.name} auditions rather than reads marks. On what you can do now, this is about ${odds} in a hundred.`
    : `${university.name} takes about ${odds} in a hundred of somebody carrying ${marks.toFixed(0)}.`;
  return { eligible: true, odds, scholarship, reason };
}

/** What a drama school is reading in an audition. */
function auditionRead(sim: Simulation, person: Person): number {
  const a = attributesOf(person);
  const craft = ((a.emotional_truth ?? 30) + (a.improvisation ?? 30) + (a.script_analysis ?? 30)) / 3;
  const voice = ((a.projection ?? 30) + (a.diction ?? 30)) / 2;
  const presence = a.charisma ?? 30;
  return (craft * 0.5 + voice * 0.25 + presence * 0.25) * youthFactor(sim, person);
}

/** What a year of this degree costs, here. */
export function feesFor(university: University, scholarship?: string): Money {
  const fees = feesIn(university.countryId);
  const gross = Math.round(fees.perYear * costOfLiving(university.cityId));
  const share = scholarship === 'academic' ? SCHOLARSHIP_SHARE.academic
    : scholarship === 'athletic' ? SCHOLARSHIP_SHARE.athletic : 0;
  return Math.max(0, Math.round(gross * (1 - share)));
}

/** How a degree in progress is doing, in a sentence. */
export function describeStudies(studies: Studies): string {
  const major = MAJOR_BY_ID[studies.majorId]?.label ?? studies.majorId;
  if (studies.awardedClass) return `${major}, ${studies.universityName}. ${studies.awardedClass}.`;
  return `${major} at ${studies.universityName}, year ${studies.year} of ${studies.years}. `
    + `${degreeClass(studies.average)} on current form.`;
}

// ---------------------------------------------------------------------------
// The commands
// ---------------------------------------------------------------------------

export function registerUniversity(sim: Simulation): void {
  /** Putting your name in. You may have five open at once. */
  sim.onCommand<
    { universityId: string; majorId: string },
    { applicationId: Id; odds: number; hearBy: Instant; note: string }
  >(
    'uni.apply',
    (p, { sim: s }) => {
      const age = ageOf(s);
      if (age < APPLY_FROM_AGE) {
        throw new CommandError(`Nobody applies before ${APPLY_FROM_AGE}. You are ${age}.`);
      }
      if (studiesOf(s)) throw new CommandError('You are already reading a degree.');
      const university = UNIVERSITY_BY_ID[p.universityId];
      if (!university) throw new CommandError('There is no such university.');
      const major = MAJOR_BY_ID[p.majorId];
      if (!major) throw new CommandError('There is no such course.');
      if (!majorsAt(university).some((one) => one.id === major.id)) {
        throw new CommandError(`${university.name} does not teach ${major.label}.`);
      }

      const open = applicationsOf(s).filter((one) => one.status === 'pending' || one.status === 'offer');
      if (open.length >= MAX_OPEN_APPLICATIONS) {
        throw new CommandError(`You have ${MAX_OPEN_APPLICATIONS} applications open, which is as many as anybody may have.`);
      }
      if (open.some((one) => one.universityId === university.id)) {
        throw new CommandError(`You have already applied to ${university.name}.`);
      }

      const chance = chanceAt(s, university, major.id);
      const rng = s.rng('uni.apply', university.id, major.id, s.now);
      const hearBy = addDays(s.now, rng.int(DECISION_DAYS[0], DECISION_DAYS[1]), s.homeZone);

      s.universe.applications ??= {};
      const application: UniversityApplication = {
        id: s.nextId('uniapp'),
        saveId: s.universe.meta.id,
        personId: s.player.id,
        universityId: university.id,
        majorId: major.id,
        onMarks: Math.round(marksOn(s) * 10) / 10,
        status: 'pending',
        reason: chance.reason,
        appliedAt: s.now,
      };
      s.universe.applications[application.id] = application;

      s.schedule({
        at: hearBy,
        kind: 'uni.decision',
        label: `${university.name} — An Answer`,
        category: 'personal',
        payload: { applicationId: application.id },
        priority: 55,
        requiresPlayer: true,
      });
      s.advanceTo(s.now + 45 * 60_000);
      s.emit('uni.applied', { applicationId: application.id, universityId: university.id, majorId: major.id });
      return {
        applicationId: application.id,
        odds: chance.odds,
        hearBy,
        note: `${chance.reason} You will hear by ${formatDate(hearBy, s.homeZone)}.`,
      };
    },
  );

  /** Taking a place. It closes the others. */
  sim.onCommand<{ applicationId: Id }, { studiesId: Id; feesAYear: Money; note: string }>(
    'uni.accept',
    (p, { sim: s }) => {
      const application = s.universe.applications?.[p.applicationId];
      if (!application) throw new CommandError('There is no such application.');
      if (application.status !== 'offer') throw new CommandError('That is not an offer you can accept.');
      const university = UNIVERSITY_BY_ID[application.universityId]!;
      const major = MAJOR_BY_ID[application.majorId]!;
      const feesAYear = feesFor(university, application.scholarship);

      const accountId = s.player.primaryAccountId;
      if (!accountId) throw new CommandError('You have no account to pay the fees from.');
      if (feesAYear > 0 && s.ledger.availableFunds(accountId) < feesAYear) {
        throw new CommandError(`The first year is ${formatMoney(feesAYear)} and you do not have it.`);
      }
      if (feesAYear > 0) {
        s.expense(accountId, feesAYear, `Tuition — ${university.name}`, 'personal', { refType: 'person', refId: s.player.id });
      }

      s.universe.studies ??= {};
      const studies: Studies = {
        id: s.nextId('degree'),
        saveId: s.universe.meta.id,
        personId: s.player.id,
        universityId: university.id,
        universityName: university.name,
        majorId: major.id,
        year: 1,
        years: major.years,
        average: clamp(Math.round(marksOn(s)), 0, 100),
        termsDone: 0,
        termsMissed: 0,
        scholarship: application.scholarship,
        paid: feesAYear,
        startedAt: s.now,
      };
      s.universe.studies[studies.id] = studies;

      application.status = 'accepted';
      application.decidedAt = s.now;
      // Taking one closes the rest, because that is how it works.
      for (const other of applicationsOf(s)) {
        if (other.id === application.id) continue;
        if (other.status === 'pending' || other.status === 'offer') {
          other.status = 'withdrawn';
          other.decidedAt = s.now;
          other.reason = `You took the place at ${university.name}.`;
        }
      }

      // Moving to the town it is in, because you have to be there.
      s.player.currentLocationId = university.cityId;
      s.player.currentPlaceId = undefined;

      s.remember({
        category: 'life',
        title: `Started At ${university.name}`,
        detail: `Reading ${major.label} at ${whereItIs(university)}. ${major.about}`,
        refs: [{ type: 'person', id: s.player.id }],
        significance: 7,
        public: true,
      });
      s.emit('uni.accepted', { studiesId: studies.id, universityId: university.id, majorId: major.id });
      const paid = feesAYear === 0
        ? 'There are no fees here.'
        : `${formatMoney(feesAYear)} for the first year${application.scholarship ? `, after the ${application.scholarship} award.` : '.'}`;
      return { studiesId: studies.id, feesAYear, note: `${major.label} at ${university.name}. ${paid}` };
    },
  );

  /** Saying no to one, which frees nothing but is honest. */
  sim.onCommand<{ applicationId: Id }, { declined: boolean }>(
    'uni.decline',
    (p, { sim: s }) => {
      const application = s.universe.applications?.[p.applicationId];
      if (!application) throw new CommandError('There is no such application.');
      if (application.status !== 'offer') throw new CommandError('That is not an offer you can decline.');
      application.status = 'declined';
      application.decidedAt = s.now;
      application.reason = 'You turned it down.';
      s.emit('uni.declined', { applicationId: application.id });
      return { declined: true };
    },
  );

  /** A term of it. Ten weeks, and how hard you worked decides what it was worth. */
  sim.onCommand<
    { effort?: 'coast' | 'normal' | 'hard' },
    { average: number; year: number; note: string; finished: boolean }
  >(
    'uni.term',
    (p, { sim: s }) => {
      const studies = studiesOf(s);
      if (!studies) throw new CommandError('You are not reading a degree.');
      const university = UNIVERSITY_BY_ID[studies.universityId]!;
      const major = MAJOR_BY_ID[studies.majorId]!;
      if (s.player.currentLocationId !== university.cityId) {
        throw new CommandError(`You have to be where ${university.name} is. It is in ${whereItIs(university)}.`);
      }

      const effort = p.effort ?? 'normal';
      const rng = s.rng('uni.term', studies.id, studies.termsDone);
      // Where the course can take you, given who you are and how you are
      // working. A degree is three years of this rather than one number.
      const aptitude = clamp(Math.round(50 + (university.selectivity - 50) * 0.35
        + (effort === 'hard' ? 16 : effort === 'coast' ? -14 : 0) + rng.int(-6, 6)), 5, 99);
      studies.average = clamp(
        Math.round((studies.average + (aptitude - studies.average) * 0.34) * 10) / 10, 0, 100,
      );
      studies.termsDone += 1;

      // A term is ten weeks, and it costs what ten weeks cost.
      s.advanceTo(s.now + Math.round((TERM_WEEKS / 3) * 7) * MS_DAY);
      s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - (effort === 'hard' ? 30 : 18), 0, 100);
      s.player.wellbeing.stress = clamp(s.player.wellbeing.stress + (effort === 'hard' ? 14 : 6), 0, 100);

      // What the course actually teaches you.
      const gain = effort === 'hard' ? 3 : effort === 'coast' ? 1 : 2;
      s.player.attributes ??= {};
      s.player.skills ??= {};
      for (const feed of major.feeds) {
        if (feed.kind === 'attribute') {
          s.player.attributes[feed.key] = clamp((s.player.attributes[feed.key] ?? 0) + gain, 0, 100);
        } else {
          s.player.skills[feed.key] = clamp((s.player.skills[feed.key] ?? 0) + gain, 0, 100);
        }
      }

      // Three terms to a year, and the fees for the next one when it turns.
      let finished = false;
      if (studies.termsDone % 3 === 0) {
        if (studies.year >= studies.years) {
          finished = true;
          award(s, studies);
        } else {
          studies.year += 1;
          const owed = feesFor(university, studies.scholarship);
          const accountId = s.player.primaryAccountId;
          if (owed > 0 && accountId) {
            if (s.ledger.availableFunds(accountId) < owed) {
              studies.endedAt = s.now;
              studies.endReason = 'could not pay the fees';
              s.notify({
                title: `You Have Left ${university.name}`,
                body: `Year ${studies.year} is ${formatMoney(owed)} and it is not there. The course is over.`,
                category: 'personal',
                importance: 76,
                route: '/workspace/education',
              });
              s.emit('uni.left', { studiesId: studies.id, reason: 'fees' });
              return { average: studies.average, year: studies.year, finished: false, note: 'You could not pay for the next year.' };
            }
            s.expense(accountId, owed, `Tuition — ${university.name}`, 'personal', { refType: 'person', refId: s.player.id });
            studies.paid += owed;
          }
        }
      }

      s.emit('uni.term_done', { studiesId: studies.id, term: studies.termsDone, effort });
      const note = finished
        ? `Finished. ${studies.awardedClass} in ${major.label}.`
        : `Term ${studies.termsDone} done. ${degreeClass(studies.average)} on current form.`;
      return { average: studies.average, year: studies.year, finished, note };
    },
  );

  /** Walking away from it. */
  sim.onCommand<{ why?: string }, { left: boolean; note: string }>(
    'uni.leave',
    (p, { sim: s }) => {
      const studies = studiesOf(s);
      if (!studies) throw new CommandError('You are not reading a degree.');
      studies.endedAt = s.now;
      studies.endReason = p.why?.trim().slice(0, 120) || 'left';
      s.remember({
        category: 'life',
        title: `Left ${studies.universityName}`,
        detail: `${plural(studies.termsDone, 'term')} in, and no degree at the end of it.`,
        refs: [{ type: 'person', id: s.player.id }],
        significance: 6,
        public: false,
      });
      s.emit('uni.left', { studiesId: studies.id, reason: studies.endReason });
      return { left: true, note: `${plural(studies.termsDone, 'term')} in, and nothing to show for it.` };
    },
  );

  // --- The answer ----------------------------------------------------------

  sim.onSchedule('uni.decision', (item, s) => {
    const application = s.universe.applications?.[(item.payload as { applicationId: Id }).applicationId];
    if (!application || application.status !== 'pending') return;
    const university = UNIVERSITY_BY_ID[application.universityId]!;
    const major = MAJOR_BY_ID[application.majorId]!;
    const chance = chanceAt(s, university, major.id);
    const rng = s.rng('uni.decision', application.id);
    const offered = chance.eligible && rng.int(1, 100) <= chance.odds;

    application.status = offered ? 'offer' : 'rejected';
    application.decidedAt = s.now;
    application.scholarship = offered ? chance.scholarship : undefined;

    if (offered) {
      const fees = feesFor(university, chance.scholarship);
      application.reason = chance.scholarship
        ? `A place, with a ${chance.scholarship} award against the fees. ${fees === 0 ? 'There are none to pay.' : `${formatMoney(fees)} a year after it.`}`
        : `A place. ${fees === 0 ? 'There are no fees here.' : `${formatMoney(fees)} a year.`}`;
    } else {
      application.reason = chance.eligible
        ? `Not this year. ${university.name} had more applicants than places and yours was not one of them.`
        : chance.reason;
    }

    s.notify({
      title: offered ? `${university.name} Said Yes` : `${university.name} Said No`,
      body: `${major.label}. ${application.reason}`,
      category: 'personal',
      importance: offered ? 82 : 58,
      route: '/workspace/education',
    });
    s.emit(offered ? 'uni.offered' : 'uni.rejected', { applicationId: application.id, universityId: university.id });
  });
}

/** Writing down what somebody left with. */
function award(sim: Simulation, studies: Studies): void {
  const major = MAJOR_BY_ID[studies.majorId];
  const awarded = degreeClass(studies.average);
  studies.awardedClass = awarded;
  studies.endedAt = sim.now;
  studies.endReason = 'graduated';
  sim.notify({
    title: awarded === 'No Award' ? `You Left ${studies.universityName} With Nothing` : `${awarded} From ${studies.universityName}`,
    body: `${major?.label ?? studies.majorId}, ${plural(studies.years, 'year')}. Averaging ${studies.average.toFixed(0)}.`,
    category: 'personal',
    importance: 86,
    route: '/workspace/education',
  });
  sim.remember({
    category: 'life',
    title: awarded === 'No Award' ? `Left ${studies.universityName}` : `${awarded} In ${major?.label ?? studies.majorId}`,
    detail: `${studies.universityName}, ${plural(studies.years, 'year')}, averaging ${studies.average.toFixed(0)}.`,
    refs: [{ type: 'person', id: sim.player.id }],
    significance: 8,
    public: true,
  });
  sim.emit('uni.graduated', { studiesId: studies.id, awardedClass: awarded, average: studies.average });
}

export { degreeClass, majorsAt, MAJORS, UNIVERSITIES } from '../content/universities';
