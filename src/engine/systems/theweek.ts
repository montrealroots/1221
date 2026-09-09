/**
 * SLATE — the week itself.
 *
 * Training in a real art with a real grading system, the classes that exist in
 * every town, and the hours around the lessons: a lunch hour, an hour in the
 * gym hall, an afternoon after school and a Saturday.
 *
 * The arts and their grading ladders are public record. Everything about a
 * particular person's progress through one — how long it takes, whether they
 * pass, what an hour is worth to a skill — is SLATE's own, and the room says
 * so.
 */

import { CommandError, type Simulation } from '../core/simulation';
import type { Id, Person, Training } from '../domain/model';
import { MS_DAY, MS_HOUR, zonedParts } from '../core/time';
import { clamp } from '../core/rng';
import { formatMoney } from '../core/money';
import { plural } from '../core/text';
import { ageOf } from './lifespan';
import { attributesOf } from '../domain/attributes';
import {
  ARTS_NOTE, ART_BY_ID, CEILING_DRAG, CHILD_CEILING, CHILD_NOTE, CLASS_BY_ID, CLASS_NOTE,
  DOING_BY_ID, GRADING_LABEL, GRADING_NOTE, LIFE_CLASSES, MARTIAL_ARTS, PER_HOUR, SESSIONS_A_WEEK,
  SESSION_HOURS, WEEK_NOTE, WHEN_LABEL, type Doing, type Grade, type LifeClass, type MartialArt,
  type When, classesAt, doingsAt,
} from '../content/theweek';

// ---------------------------------------------------------------------------
// What an hour is worth
// ---------------------------------------------------------------------------

/**
 * Putting an hour into something, and what an hour is actually worth.
 *
 * The last ten points of anything are far harder than the first ten, which is
 * the rule the rest of the game already works on. Everything that trains a
 * skill in here goes through this one function so that an hour is worth the
 * same wherever it was spent.
 */
export function putAnHourIn(
  person: Person, key: string, kind: 'skill' | 'attribute', hours: number, child: boolean,
): number {
  const sheet = kind === 'skill' ? (person.skills ??= {}) : attributesOf(person);
  const before = sheet[key] ?? 0;
  const ceiling = child ? CHILD_CEILING * 100 : 100;
  if (before >= ceiling) return 0;
  // Diminishing returns, and a child cannot reach an adult's ceiling however
  // hard they work, because they are a child.
  const room = 1 - (before / 100) * CEILING_DRAG;
  const step = PER_HOUR * hours * room;
  const after = clamp(Math.round((before + step) * 10) / 10, 0, ceiling);
  if (kind === 'skill') person.skills[key] = after;
  else person.attributes[key] = after;
  return Math.round((after - before) * 10) / 10;
}

/** How many friends somebody actually has, which some of a week needs. */
export function friendCount(sim: Simulation, personId: Id = sim.player.id): number {
  return Object.values(sim.universe.relationships ?? {})
    .filter((one) => (one.aId === personId || one.bId === personId)
      && one.type === 'friend' && !one.endedAt).length;
}

/** Whether somebody is young enough that the ceiling is a child's one. */
export function isAChild(sim: Simulation, person: Person = sim.player): boolean {
  return ageOf(sim, person) < 16;
}

// ---------------------------------------------------------------------------
// The dojo
// ---------------------------------------------------------------------------

/** Every art somebody of this age could start. */
export function artsOpenTo(sim: Simulation, person: Person = sim.player): MartialArt[] {
  const age = ageOf(sim, person);
  return MARTIAL_ARTS.filter((one) => age >= one.fromAge);
}

/** What somebody is training in, if they are training in anything. */
export function trainingOf(sim: Simulation, personId: Id = sim.player.id): Training[] {
  return Object.values(sim.universe.training ?? {})
    .filter((one) => one.personId === personId)
    .sort((a, b) => b.startedAt - a.startedAt);
}

/** The one they are still doing, of a given art. */
export function trainingIn(sim: Simulation, artId: string, personId: Id = sim.player.id): Training | undefined {
  return trainingOf(sim, personId).find((one) => one.artId === artId && !one.endedAt);
}

/** Everything they are still doing. */
export function trainingNow(sim: Simulation, personId: Id = sim.player.id): Training[] {
  return trainingOf(sim, personId).filter((one) => !one.endedAt);
}

/** The grade they hold, and the one above it. */
export function gradeOf(training: Training): { held?: Grade; next?: Grade } {
  const art = ART_BY_ID[training.artId];
  if (!art || art.grades.length === 0) return {};
  const at = art.grades.findIndex((one) => one.id === training.gradeId);
  return { held: art.grades[at], next: art.grades[at + 1] };
}

/**
 * Whether they are ready to be put up for the next grade.
 *
 * Two things have to be true and they are different things: the time a
 * federation publishes, which is a real rule, and the hours on the mat, which
 * is SLATE's own reading of what it actually takes.
 */
export function readyToGrade(
  sim: Simulation, training: Training, person: Person = sim.player,
): { next?: Grade; ready: boolean; why: string } {
  const art = ART_BY_ID[training.artId];
  if (!art) return { ready: false, why: 'That art is no longer carried.' };
  if (art.grading === 'none') {
    return { ready: false, why: `${art.name} grades nobody. There’s no belt to be given.` };
  }
  const { next } = gradeOf(training);
  if (!next) return { ready: false, why: 'There’s nothing above this one in the game.' };
  const age = ageOf(sim, person);
  if (age < next.fromAge) {
    return { next, ready: false, why: `${next.label} can’t be awarded before ${next.fromAge}. You are ${age}.` };
  }
  const monthsHeld = (sim.now - training.gradedAt) / (MS_DAY * 30.4);
  if (monthsHeld < next.minMonths) {
    const left = Math.ceil(next.minMonths - monthsHeld);
    return { next, ready: false, why: `${next.label} wants ${plural(next.minMonths, 'month')} at this grade. ${plural(left, 'month')} to go.` };
  }
  if (training.hours < next.hours) {
    return {
      next, ready: false,
      why: `${next.label} takes about ${plural(next.hours, 'hour')} on the mat and you have ${Math.round(training.hours)}.`,
    };
  }
  return { next, ready: true, why: `You’re being put up for ${next.label}.` };
}

/** How this reads in a sentence. */
export function describeTraining(training: Training): string {
  const art = ART_BY_ID[training.artId];
  if (!art) return 'An art the game no longer carries.';
  const { held } = gradeOf(training);
  const where = art.grading === 'none'
    ? `${plural(training.sessions, 'session')} in, and ${art.name} grades nobody`
    : `${held?.label ?? 'Unranked'}, ${plural(training.sessions, 'session')} in`;
  return `${art.name} at ${training.gymName}. ${where}. ${training.hours.toFixed(1)} hours on the mat.`;
}

/** What a gym is called, which is SLATE's own. */
const GYM_FIRST = [
  'Ironside', 'Northgate', 'Riverside', 'Union', 'Alliance', 'Foundation', 'Overlook', 'Fifth Street',
  'Old Mill', 'Carriage House', 'Harbor Road', 'Westfield', 'Redline', 'Sentinel', 'Anvil', 'Lantern',
];
const GYM_SECOND = [
  'Academy', 'Martial Arts', 'Combat Club', 'Training Center', 'Dojo', 'Gym', 'Fight Club', 'Institute',
];

/** Which gym in town teaches this, which is SLATE's own invention. */
export function gymFor(sim: Simulation, art: MartialArt, cityId: string): string {
  const rng = sim.rng('week.gym', cityId, art.id);
  return `${rng.pick(GYM_FIRST)} ${rng.pick(GYM_SECOND)}`;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export function registerTheWeek(sim: Simulation): void {
  /** Walking into a gym for the first time. */
  sim.onCommand<{ artId: string }, { art: string; gym: string; grade?: string; note: string }>(
    'week.start_training',
    (p, { sim: s }) => {
      const art = ART_BY_ID[p.artId];
      if (!art) throw new CommandError('There’s no such art.');
      const age = ageOf(s);
      if (age < art.fromAge) {
        throw new CommandError(`${art.name} takes children from ${art.fromAge}. You are ${age}.`);
      }
      if (trainingIn(s, art.id)) throw new CommandError(`You already train ${art.name}.`);
      if (trainingNow(s).length >= 2) {
        throw new CommandError('Two arts at once is already more than most people manage. Stop one first.');
      }
      const first = art.grades[0];
      const record: Training = {
        id: s.nextId('training'),
        saveId: s.universe.meta.id,
        personId: s.player.id,
        artId: art.id,
        gymName: gymFor(s, art, s.player.currentLocationId),
        gradeId: first?.id ?? '',
        gradedAt: s.now,
        sessions: 0,
        hours: 0,
        gradings: [],
        startedAt: s.now,
      };
      s.universe.training ??= {};
      s.universe.training[record.id] = record;
      s.remember({
        category: 'life',
        title: `Started ${art.name}`,
        detail: `${record.gymName}. ${art.about}`,
        refs: [{ type: 'person', id: s.player.id }],
        significance: 3,
        public: false,
      });
      s.emit('week.training_started', { artId: art.id, trainingId: record.id });
      return {
        art: art.name,
        gym: record.gymName,
        grade: first?.label,
        note: `You train ${art.name} at ${record.gymName}. `
          + `${art.grading === 'none' ? `${art.name} grades nobody, so there is no belt to chase.` : `${first?.label ?? 'Unranked'}, and a long way to go.`}`,
      };
    },
  );

  /** An hour and a half on the mat. */
  sim.onCommand<
    { artId?: string },
    { art: string; sessions: number; hours: number; gained: string[]; ready: boolean; note: string }
  >(
    'week.train',
    (p, { sim: s }) => {
      const record = p.artId ? trainingIn(s, p.artId) : trainingNow(s)[0];
      if (!record) throw new CommandError('You don’t train anything.');
      const art = ART_BY_ID[record.artId]!;
      if ((s.player.wellbeing.energy ?? 100) < art.demand * 0.4) {
        throw new CommandError('There’s nothing left in you. You’d get hurt.');
      }
      const week = Math.floor(s.now / (7 * MS_DAY));
      if (record.weekOf === week && (record.thisWeek ?? 0) >= SESSIONS_A_WEEK) {
        throw new CommandError(`${plural(SESSIONS_A_WEEK, 'session')} a week is already more than the body wants.`);
      }
      const accountId = s.player.primaryAccountId;
      if (art.fee > 0 && accountId) {
        if (s.ledger.availableFunds(accountId) < art.fee) {
          throw new CommandError(`A session is ${formatMoney(art.fee)} and it isn’t there.`);
        }
        s.expense(accountId, art.fee, `${record.gymName} — ${art.name}`, 'wellbeing', {
          refType: 'person', refId: s.player.id,
        });
      }
      const child = isAChild(s);
      const gained: string[] = [];
      for (const feed of art.feeds) {
        const moved = putAnHourIn(s.player, feed.key, feed.kind, SESSION_HOURS * feed.share, child);
        if (moved > 0) gained.push(feed.key);
      }
      record.sessions += 1;
      record.hours = Math.round((record.hours + SESSION_HOURS) * 10) / 10;
      record.weekOf = week;
      record.thisWeek = record.weekOf === week ? (record.thisWeek ?? 0) + 1 : 1;
      s.advanceTo(s.now + SESSION_HOURS * MS_HOUR);
      s.player.wellbeing.energy = clamp((s.player.wellbeing.energy ?? 100) - art.demand, 0, 100);
      s.player.wellbeing.stress = clamp((s.player.wellbeing.stress ?? 20) - 4, 0, 100);
      const ready = readyToGrade(s, record);
      s.emit('week.trained', { trainingId: record.id, artId: art.id, sessions: record.sessions });
      return {
        art: art.name,
        sessions: record.sessions,
        hours: record.hours,
        gained,
        ready: ready.ready,
        note: `${SESSION_HOURS} hours of ${art.name}. ${plural(record.sessions, 'session')} in, `
          + `${record.hours.toFixed(1)} hours on the mat. `
          + `${ready.ready ? ready.why : art.grading === 'none' ? '' : ready.why}`,
      };
    },
  );

  /** The grading itself, which can be failed. */
  sim.onCommand<
    { artId?: string },
    { art: string; grade: string; passed: boolean; note: string }
  >(
    'week.grade',
    (p, { sim: s }) => {
      const record = p.artId ? trainingIn(s, p.artId) : trainingNow(s)[0];
      if (!record) throw new CommandError('You don’t train anything.');
      const art = ART_BY_ID[record.artId]!;
      const ready = readyToGrade(s, record);
      if (!ready.next) throw new CommandError(ready.why);
      if (!ready.ready) throw new CommandError(ready.why);

      // How far past the minimum they are is what decides it, because a
      // grading is about whether the work is there rather than about luck.
      const over = record.hours / Math.max(1, ready.next.hours);
      const rng = s.rng('week.grading', record.id, ready.next.id);
      const passed = rng.float(0, 1) < clamp(0.45 + (over - 1) * 1.2, 0.35, 0.97);
      record.gradings = [...record.gradings, { gradeId: ready.next.id, at: s.now, passed }].slice(-24);
      s.advanceTo(s.now + 3 * MS_HOUR);
      s.player.wellbeing.energy = clamp((s.player.wellbeing.energy ?? 100) - 30, 0, 100);
      if (!passed) {
        s.player.wellbeing.stress = clamp((s.player.wellbeing.stress ?? 20) + 10, 0, 100);
        s.emit('week.graded', { trainingId: record.id, gradeId: ready.next.id, passed: false });
        return {
          art: art.name,
          grade: ready.next.label,
          passed: false,
          note: `Not this time. The panel wants more mat time before ${ready.next.label}, and they’re right.`,
        };
      }
      record.gradeId = ready.next.id;
      record.gradedAt = s.now;
      s.player.wellbeing.stress = clamp((s.player.wellbeing.stress ?? 20) - 8, 0, 100);
      s.remember({
        category: 'life',
        title: `${ready.next.label} In ${art.name}`,
        detail: `${record.gymName}, after ${plural(record.sessions, 'session')} and ${record.hours.toFixed(1)} hours. ${ready.next.about}`,
        refs: [{ type: 'person', id: s.player.id }],
        significance: ready.next.id.includes('dan') || ready.next.id === 'black' ? 7 : 4,
        public: false,
      });
      s.notify({
        title: `${ready.next.label}`,
        body: `${art.name} at ${record.gymName}. ${ready.next.about}`,
        category: 'personal',
        importance: 62,
        route: '/workspace/wellbeing',
      });
      s.emit('week.graded', { trainingId: record.id, gradeId: ready.next.id, passed: true });
      return {
        art: art.name,
        grade: ready.next.label,
        passed: true,
        note: `${ready.next.label} in ${art.name}. ${ready.next.about}`,
      };
    },
  );

  /** Stopping, which most people do. */
  sim.onCommand<{ artId: string }, { art: string; note: string }>(
    'week.stop_training',
    (p, { sim: s }) => {
      const record = trainingIn(s, p.artId);
      if (!record) throw new CommandError('You don’t train that.');
      const art = ART_BY_ID[record.artId]!;
      record.endedAt = s.now;
      s.emit('week.training_stopped', { trainingId: record.id, artId: art.id });
      return {
        art: art.name,
        note: `You stop going. ${plural(record.sessions, 'session')} and ${record.hours.toFixed(1)} hours, `
          + 'and the grade stays yours.',
      };
    },
  );

  /** A class, which is the other way of getting better at something. */
  sim.onCommand<
    { classId: string },
    { label: string; cost: number; gained: string[]; note: string }
  >(
    'week.take_class',
    (p, { sim: s }) => {
      const lesson = CLASS_BY_ID[p.classId];
      if (!lesson) throw new CommandError('There’s no such class.');
      const age = ageOf(s);
      if (age < lesson.fromAge) {
        throw new CommandError(`${lesson.label} takes people from ${lesson.fromAge}. You are ${age}.`);
      }
      if ((s.player.wellbeing.energy ?? 100) < 12) {
        throw new CommandError('There’s nothing left in you. Nothing would go in.');
      }
      const accountId = s.player.primaryAccountId;
      if (lesson.fee > 0 && accountId) {
        if (s.ledger.availableFunds(accountId) < lesson.fee) {
          throw new CommandError(`${lesson.label} is ${formatMoney(lesson.fee)} and it isn’t there.`);
        }
        s.expense(accountId, lesson.fee, lesson.label, 'education', {
          refType: 'person', refId: s.player.id,
        });
      }
      const child = isAChild(s);
      const gained: string[] = [];
      for (const feed of lesson.feeds) {
        const moved = putAnHourIn(s.player, feed.key, feed.kind, lesson.hours * feed.share, child);
        if (moved > 0) gained.push(feed.key);
      }
      s.advanceTo(s.now + lesson.hours * MS_HOUR);
      s.player.wellbeing.energy = clamp((s.player.wellbeing.energy ?? 100) - lesson.demand, 0, 100);
      s.emit('week.class_taken', { classId: lesson.id });
      return {
        label: lesson.label,
        cost: lesson.fee,
        gained,
        note: `${lesson.label}, ${plural(lesson.hours, 'hour')}.`
          + `${lesson.fee > 0 ? ` ${formatMoney(lesson.fee)}.` : ''}`
          + `${gained.length > 0 ? ' Something moved.' : ' Nothing left to move there.'}`,
      };
    },
  );

  /** And the hours around all of it. */
  sim.onCommand<
    { doingId: string },
    { label: string; cost: number; gained: string[]; note: string }
  >(
    'week.spend',
    (p, { sim: s }) => {
      const doing = DOING_BY_ID[p.doingId];
      if (!doing) throw new CommandError('There’s no such thing to do.');
      const age = ageOf(s);
      if (age < doing.fromAge || age > doing.toAge) {
        throw new CommandError(`${doing.label} isn’t something somebody your age does.`);
      }
      const parts = zonedParts(s.now, s.homeZone);
      const weekend = parts.weekday === 0 || parts.weekday === 6;
      if (doing.when === 'weekend' && !weekend) throw new CommandError(`${doing.label} is a weekend thing.`);
      if ((doing.when === 'lunch' || doing.when === 'gym_class' || doing.when === 'after_school') && weekend) {
        throw new CommandError('There’s no school today.');
      }
      if (doing.needsAFriend && friendCount(s) === 0) {
        throw new CommandError('There’s nobody to do that with yet.');
      }
      const accountId = s.player.primaryAccountId;
      if (doing.cost > 0 && accountId) {
        if (s.ledger.availableFunds(accountId) < doing.cost) {
          throw new CommandError(`That takes about ${formatMoney(doing.cost)} and it isn’t there.`);
        }
        s.expense(accountId, doing.cost, doing.label, 'lifestyle', {
          refType: 'person', refId: s.player.id,
        });
      }
      const child = isAChild(s);
      const gained: string[] = [];
      for (const feed of doing.feeds) {
        const moved = putAnHourIn(s.player, feed.key, feed.kind, doing.hours * feed.share * 0.6, child);
        if (moved > 0) gained.push(feed.key);
      }
      s.advanceTo(s.now + doing.hours * MS_HOUR);
      s.player.wellbeing.energy = clamp((s.player.wellbeing.energy ?? 100) - doing.demand, 0, 100);
      // Time with people is the thing that actually brings the stress down.
      s.player.wellbeing.stress = clamp(
        (s.player.wellbeing.stress ?? 20) - (doing.needsAFriend ? 9 : 4), 0, 100,
      );
      s.emit('week.spent', { doingId: doing.id, when: doing.when });
      return {
        label: doing.label,
        cost: doing.cost,
        gained,
        note: `${doing.label}. ${plural(doing.hours, 'hour')}.`
          + `${doing.cost > 0 ? ` ${formatMoney(doing.cost)}.` : ''}`,
      };
    },
  );
}

export {
  ARTS_NOTE, ART_BY_ID, CHILD_NOTE, CLASS_BY_ID, CLASS_NOTE, DOING_BY_ID, GRADING_LABEL,
  GRADING_NOTE, LIFE_CLASSES, MARTIAL_ARTS, SESSIONS_A_WEEK, SESSION_HOURS, WEEK_NOTE, WHEN_LABEL,
  classesAt, doingsAt, type Doing, type LifeClass, type MartialArt, type When,
};
