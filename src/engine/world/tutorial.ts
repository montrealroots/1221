/**
 * SLATE — the tick that teaches, and the conditions it teaches from.
 *
 * `content/tutorial.ts` says what there is to teach and why it is shaped as
 * conditions rather than steps. This reads the world once a week, works out which
 * lessons are now worth saying, and says the most important one.
 *
 * ## Why it rides the weekly tick
 *
 * Because it is a question asked of tables that already exist. Every condition in
 * this file is a count of something the save already holds — registrations in
 * force, parts with nobody cast, whether a card is carrying a balance — and a
 * second heartbeat to ask it would be a second thing to keep in step with the
 * first. That is the same reasoning `whatIsGoing` gives for riding the world tick,
 * and it is the reason this file has no clock of its own.
 *
 * ## One a week, and why that is a rule rather than a throttle
 *
 * A player who incorporates, registers, signs, insures and greenlights in one
 * sitting satisfies a dozen conditions at once. Saying all twelve is not teaching.
 * So the tick takes the highest-importance eligible lesson and leaves the rest,
 * which has a second effect worth having: the order lessons arrive in becomes the
 * order of what matters, decided by the importance already written on each one
 * rather than by a list somebody maintained separately.
 *
 * ## What it will not do
 *
 * It does not pause the clock, block a command, or gate a screen. It cannot: it
 * has no way to. The only things this module writes are `tutorial.seen`,
 * `tutorial.dismissed`, and notifications — and a notification is the same object
 * every other system raises. A player who dismisses the lot plays a game that is
 * identical in every measurable respect, which is the point, and
 * `tests/tutorial.test.ts` proves it by playing two careers from one seed with the
 * teaching on and off and comparing the outcome.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../domain/model';
import { MS_DAY } from '../core/time';
import {
  LESSONS, LESSONS_A_WEEK, LESSON_CATEGORY,
  type Lesson, type LessonWorld,
} from '../content/tutorial';
import { isLiability } from '../core/ledger';
import { accountsOf } from './banking';
import { companiesOf } from './company';
import { DIVIDEND_MEMO } from '../content/sugar';

export const LEARNING_KIND = 'learning.week';

/** How far ahead a term counts as running out, matching the company's own warning. */
const RUNNING_OUT_DAYS = 60;

/**
 * Everything a lesson's condition is allowed to know, counted off the save.
 *
 * One pass, once a week, rather than each condition reaching into the world for
 * itself. Two reasons and both are about keeping this honest: a condition that can
 * see everything grows into a second rules engine beside the real one, and a
 * weekly tick that walks every table once is cheap where thirty-odd conditions
 * each walking their own is not.
 */
export function theLessonWorld(sim: Simulation): LessonWorld {
  const u = sim.universe;
  const me = u.people[u.playerId];
  const live = <T extends { endedAt?: number; lapsedAt?: number }>(all: Record<string, T>): number =>
    Object.values(all).filter((one) => one.endedAt === undefined && one.lapsedAt === undefined).length;

  // A picture's `stage` is the single word for where it has got to, and the
  // groupings below are the ones a player would recognize rather than the ones the
  // enum happens to list. Everything before a greenlight is "developing", because
  // the difference between an idea and a draft is not what any lesson turns on.
  const projects = Object.values(u.projects);
  const at = (...stages: readonly string[]): number =>
    projects.filter((one) => stages.includes(one.stage)).length;
  const counted = {
    developing: at('idea', 'optioned', 'writing', 'draft', 'packaged'),
    greenlit: at('greenlit', 'prep'),
    shooting: at('shooting', 'post'),
    finished: projects.filter((one) => one.stage === 'delivered' && one.soldAt === undefined).length,
    delivered: at('delivered'),
  };

  const mine = new Set(accountsOf(sim, u.playerId).map((one) => one.id));
  const cards = Object.values(u.accounts).filter((one) => mine.has(one.id) && isLiability(one.kind));
  const bookedNow = Object.values(u.bookings).filter(
    (one) => one.from <= sim.now && one.to >= sim.now,
  ).length;

  const house = u.properties[me?.residenceId ?? ''];


  const termsOut = [
    ...Object.values(u.registrations).map((one) => one.nextDueAt),
    ...Object.values(u.policies).map((one) => one.renewsAt),
    ...Object.values(u.holdings).map((one) => one.expiresAt),
  ].some((when) => when !== undefined && when > sim.now && when - sim.now <= RUNNING_OUT_DAYS * MS_DAY);

  return {
    week: Math.max(0, Math.floor((sim.now - u.meta.createdAt) / (7 * MS_DAY))),
    hasCompany: companiesOf(u).length > 0,
    registrations: live(u.registrations),
    holdings: live(u.holdings),
    projects: counted,
    stages: { built: Object.keys(u.stages).length, booked: bookedNow },
    houseNeedsWork: house !== undefined && house.condition < 80,
    tiredness: 100 - (me?.wellbeing?.energy ?? 100),
    owesOnACard: cards.some((one) => one.balance < 0),
    accounts: mine.size,
    decisionsOpen: Object.values(u.decisions).filter(
      (one) => one.resolvedAt === undefined && one.dismissedAt === undefined,
    ).length,
    termRunningOut: termsOut,
    // The real memo, imported rather than spelled again. The first version looked
    // for 'Distribution' and the memo says 'Dividend', so the lesson could never
    // fire — and a substring somebody typed is the kind of link that breaks
    // silently the day the memo is reworded.
    dividendPaid: u.transactions.some((one) => one.memo === DIVIDEND_MEMO),
  };
}

/**
 * When each lesson is worth saying.
 *
 * Kept here rather than in `content/tutorial.ts` because a condition is code and
 * the content file is data — the same split every other pair of files in this
 * engine uses. Each one is the first moment the thing it teaches is possible,
 * which is a stronger claim than it looks: a lesson that fires before the player
 * could act on it is worse than no lesson, because it teaches them the game
 * refuses things for no reason.
 *
 * Every id here must exist in `LESSONS` and every lesson there must appear here.
 * `tests/tutorial.test.ts` checks both directions, so neither list can drift.
 */
export const WHEN: Readonly<Record<string, (w: LessonWorld) => boolean>> = {
  // The first week. These are about the shell, so they are true immediately — and
  // `LESSONS_A_WEEK` is what stops all four arriving at once.
  clock: () => true,
  sleep: (w) => w.week >= 1,
  notices: (w) => w.week >= 1,
  decisions: (w) => w.decisionsOpen > 0,
  calendar: (w) => w.week >= 2,
  teaching: (w) => w.week >= 1,

  // The work. Being asked is the trigger for the first, having been in a room for
  // the second, and having a part in hand for the third — because a clash cannot
  // happen to somebody with nothing booked.

  // The body. Training after a week of the game, and the tiredness lesson only
  // when they are actually running down, which is the moment it means something.
  training: (w) => w.week >= 2,
  tired: (w) => w.tiredness >= 45,

  // The money. The card lesson waits for a balance on a card, and the tax lesson
  // for the middle of the first year, which is when the first return is settled.
  ledger: (w) => w.week >= 1,
  accounts: (w) => w.accounts >= 2,
  card: (w) => w.owesOnACard,
  tax: (w) => w.week >= 20,
  upkeep: (w) => w.houseNeedsWork,

  // The company, conditioned on the thing being *possible* rather than on it being
  // absent — and the difference is the largest defect this feature had.
  //
  // These were written as "a company and no registration", "a registration and no
  // signature", and so on, which reads as the tighter and more thoughtful version:
  // only tell somebody about a door that is still shut. It is a trap. A player who
  // incorporates, registers, signs, insures, fills the post and options material in
  // one sitting closes every one of those windows before the first weekly tick runs,
  // so none of the lessons ever fire — and because `posts` and `option` are what
  // `develop` waits for, and `develop` is what `greenlight` waits for, the whole
  // eight-lesson Making Pictures strand was unreachable. Measured, on a career that
  // greenlit nine pictures and delivered eight: nought of the eight lessons about
  // making pictures was ever said.
  //
  // So the condition is the capability, and the text of each lesson is written to be
  // worth reading whether or not the player has already done it — what a
  // registration is, that it costs a fee, and that it runs out, is useful to
  // somebody holding one.
  company: (w) => w.hasCompany,
  register: (w) => w.hasCompany,
  sign: (w) => w.registrations > 0,
  insure: (w) => w.registrations > 0,
  posts: (w) => w.hasCompany,
  option: (w) => w.hasCompany,

  // The pictures, walked in the order a picture walks.
  conceive: (w) => w.holdings > 0,
  crew: (w) => w.projects.greenlit > 0,

  // The production floor. Conditioned on the capability rather than on the step
  // being outstanding, for the reason set out above: somebody who shapes, engages
  // and commits in one sitting would otherwise close every window before the weekly
  // tick runs and be told none of it. `after` on each lesson keeps them in order;
  // the condition only says the subject has become relevant at all.
  write: (w) => w.projects.developing > 0,
  shape: (w) => w.projects.developing > 0,
  engage: (w) => w.projects.developing > 0,
  sell: (w) => w.projects.developing > 0,
  commit: (w) => w.projects.developing > 0,
  opening: (w) => w.projects.greenlit > 0 || w.projects.finished > 0,
  world: (w) => w.projects.developing > 0,
  again: (w) => w.projects.delivered > 0,

  // The lot and the estate.
  lot: (w) => w.stages.built > 0,
  'own-stage': (w) => w.stages.built > 0 && (w.projects.greenlit > 0 || w.projects.shooting > 0),
  rebate: (w) => w.stages.built > 0,
  overhead: (w) => w.stages.built > 0 && w.stages.booked === 0,

  // The year. Awards once something has been delivered, standing once they have
  // been seen for anything, sugar from the start because it is running whether the
  // player looks at it or not.
  awards: (w) => w.projects.delivered > 0,
  sugar: (w) => w.week >= 6,
  dividend: (w) => w.dividendPaid,

  // The one lesson keyed to a deadline rather than to a capability, and the reason
  // `termRunningOut` is counted at all: it fires when a registration, a policy or
  // an option is genuinely inside its sixty-day window, which is the only moment
  // telling somebody about renewals is worth anything.
  renewals: (w) => w.termRunningOut,
};

/** Whether the player has been told this already. */
export function seen(sim: Simulation, id: string): boolean {
  return sim.universe.tutorial?.seen?.[id] !== undefined;
}

/** Whether teaching is switched on at all. */
export function teaching(sim: Simulation): boolean {
  return sim.universe.tutorial?.dismissed !== true;
}

/**
 * Every lesson that could be said now, most important first.
 *
 * `after` is checked against what has actually been seen rather than against what
 * is currently true, because the point of it is the order of the sentences. A
 * player can perfectly well satisfy "cover has lapsed" before anybody has told
 * them what cover is, and in that case the cover lesson goes first and the lapse
 * waits a week.
 */
export function lessonsDue(sim: Simulation, world: LessonWorld): Lesson[] {
  return LESSONS
    .filter((one) => !seen(sim, one.id))
    .filter((one) => (one.after ?? []).every((need) => seen(sim, need)))
    .filter((one) => WHEN[one.id]?.(world) === true)
    .sort((a, b) => b.importance - a.importance || a.id.localeCompare(b.id));
}

/**
 * The route a lesson's screen actually has, where it has one.
 *
 * A lesson's `screen` is a subject — 'wellbeing', 'business', 'the estate' — and
 * most subjects in this build are drill-downs reached from Home rather than
 * addresses. Only three things have a route. So this maps the three and returns
 * nothing for the rest, because a notification carrying `route: 'wellbeing'` would
 * render a way through to a screen that does not exist, and a dead link in a lesson
 * about how the game works is worse than no link at all.
 */
function routeFor(screen: string | undefined): string | undefined {
  switch (screen) {
    case 'business': return '/workspace/business';
    case 'production': return '/workspace/production';
    case 'auditions': return '/workspace/auditions';
    case 'plans': return '/workspace/calendar';
    default: return undefined;
  }
}

/** Says one lesson, and records that it was said. */
export function teach(sim: Simulation, lesson: Lesson): void {
  const held = sim.universe.tutorial ?? { seen: {}, dismissed: false };
  held.seen[lesson.id] = sim.now;
  sim.universe.tutorial = held;
  const route = routeFor(lesson.screen);
  sim.notify({
    category: LESSON_CATEGORY,
    title: lesson.title,
    body: lesson.body,
    importance: lesson.importance,
    ...(route !== undefined ? { route } : {}),
    refType: 'lesson',
    refId: lesson.id as Id,
  });
}

/** The weekly pass: teach at most `LESSONS_A_WEEK` of whatever is due. */
export function theTeachingWeek(sim: Simulation): Lesson[] {
  if (!teaching(sim)) return [];
  const world = theLessonWorld(sim);
  const due = lessonsDue(sim, world).slice(0, LESSONS_A_WEEK);
  for (const lesson of due) teach(sim, lesson);
  return due;
}

/**
 * Registers the teaching.
 *
 * On the weekly tick, and after everything else on it, because a lesson about a
 * thing that happened this week should be said after the thing has happened. The
 * three commands are the only writers of tutorial state outside this file's own
 * tick: switch it off, switch it back on, and mark one read without waiting for
 * the notification list.
 */
export function registerTutorial(sim: Simulation): void {
  const week = (from: number): number => from + 7 * MS_DAY;
  const arm = (at: number): void => {
    sim.schedule({
      at,
      kind: LEARNING_KIND,
      label: 'Learning The Game',
      category: 'system',
      // Behind everything that actually happens, so a lesson about a thing arrives
      // after the thing. A player told about delivery in the same tick their
      // picture was delivered should read the two in that order.
      priority: 90,
    });
  };

  sim.onSchedule(LEARNING_KIND, () => {
    theTeachingWeek(sim);
    arm(week(sim.now));
  });

  if (!sim.universe.scheduled.some((one) => one.kind === LEARNING_KIND && one.status === 'pending')) {
    arm(week(sim.now));
  }

  sim.onCommand<{ off: boolean }, { ok: boolean; dismissed: boolean }>(
    'learning.set',
    (payload) => {
      const held = sim.universe.tutorial ?? { seen: {}, dismissed: false };
      held.dismissed = payload.off === true;
      sim.universe.tutorial = held;
      return { ok: true, dismissed: held.dismissed };
    },
  );

  // There was a third command here, `learning.seen`, which marked one lesson as
  // given without waiting for the tick. It is gone, and the reason is worth keeping
  // because it is the rule this whole feature is built to obey. Nothing needed it:
  // `teach` already records a lesson the moment it says one, and the only caller a
  // player could have had is a screen listing lessons they have not been given yet
  // — which this feature deliberately does not build, because it would be the same
  // words in two places. `tests/interface.test.ts` refused it for exactly that, and
  // the right answer to a command nobody can reach is to delete the command rather
  // than to invent a button.

  sim.onCommand<Record<string, never>, { ok: boolean; forgotten: number }>(
    'learning.again',
    () => {
      // Deliberately available. A player who dismissed the teaching in the first
      // week and then came back to the game two months later has no way to ask for
      // it again otherwise, and a tutorial you cannot restart is a tutorial with
      // one chance to have been useful.
      const held = sim.universe.tutorial ?? { seen: {}, dismissed: false };
      const forgotten = Object.keys(held.seen).length;
      sim.universe.tutorial = { seen: {}, dismissed: false };
      return { ok: true, forgotten };
    },
  );
}
