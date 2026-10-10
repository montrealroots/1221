/**
 * SLATE — the class as people, beyond the work they're partnered in (from
 * 2026-10-08; `systems/coursework.ts` keeps the partnering, `systems/school.ts`
 * the classmate and their bond, `systems/people.ts` the contact they become).
 *
 * **One record.** Everything here moves what the classmate already carries:
 * their trust in you as a partner (`trust`), the bond the class is known by
 * after school (`bond`), and their memory of what happened (`log`). Nothing
 * keeps a second copy of how they feel.
 *
 * **Who they are.** Each classmate has a priority, drawn once by their drive
 * (decider `school.classmates`): the work itself, the people in the room,
 * getting seen and working, or a life outside school. It shapes which
 * moments they bring and is the reason they give for them.
 *
 * **Moments.** In class, on about three days in ten (an ordinary day stays
 * ordinary), one classmate may bring something, never while another moment
 * of theirs waits for an answer, and the kind least recently had with them
 * first:
 * - a disagreement about your shared scene, from any partner: they read a
 *   question at the table another way. Keep your reading, take theirs, or try both at your next
 *   rehearsal. Two readings the text supports are two defensible choices, and
 *   keeping yours costs nothing; keeping one the text cuts against, against
 *   theirs that it supports, costs a little of their trust.
 * - an invitation to run lines together on an evening they're free: yes books
 *   it, and kept it moves your weakest lines; no costs nothing; no answer by
 *   its time costs a little.
 * - a request for help with their own lines: help (three quarters of an hour,
 *   then and there) and they trust you more and are closer; no costs nothing.
 * - encouragement after work of yours that went badly, from a friend only.
 * - an apology, after they didn't come to a rehearsal agreed: take it and
 *   you're closer; take it coolly and you're further apart.
 * - a boundary, after you've let them down twice without making it right:
 *   from then they'll rehearse only if asked a day ahead. Accept it and they
 *   trust you a little more; push back and you're further apart.
 * Making it right is yours to start (\`school.make_amends\`): twenty minutes,
 * in New Haven, for what's happened since you last did; it restores some of
 * their trust and lifts a boundary once three rehearsals have been kept since.
 *
 * Every number here is SLATE's estimate.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatDate, formatTime, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { YALE_DRAMA, type SchoolDate } from '../content/school';
import { sceneById } from '../content/coursework';
import { bondMove, keyOf, type Classmate } from './school';
import {
  WORK, courseworkOf, mateBusy, mateRecord, questionsFor, trustOf, type Assignment, type Coursework, type MateRecord,
} from './coursework';
import { occupiedAt } from './life';
import { exerts } from './body';

export const CLASS = {
  /** How likely a class day brings a moment, and how long before the same kind comes from the same classmate again. */
  chance: 0.3, sameKindDays: 21,
  /** An answer is due by ten the next evening. */
  answerHours: 22,
  /** What each answer does: to their trust in you, and to the bond (before your own warmth or wound, `bondMove`). */
  hold: { trust: 0, bond: 0 }, holdAgainstText: { trust: -1, bond: 0 }, theirs: { trust: 2, bond: 1 }, both: { trust: 3, bond: 1 },
  /**
   * And from 2026-10-10 an invitation turned down or left unanswered twice running stops a classmate asking for
   * `quietDays` after the second (SLATE's estimate): until then the answer was kept on them and read by nothing.
   */
  study: { minutes: 60, hour: 19, memorization: 0.2, kept: { trust: 2, bond: 2 }, missed: { trust: -6, bond: -3 }, unanswered: -1, declinedStop: 2, quietDays: 45 },
  /** A classmate you helped with their lines asks you to run lines in turn within `returnDays` (from 2026-10-10), whatever they care most about. */
  help: { minutes: 45, trust: 4, bond: 3, returnDays: 60 },
  encourage: { morale: 3, bondFrom: 10 },
  apology: { accept: 2, cool: -2 },
  /**
   * A boundary lifts after rehearsals kept since: two where it was accepted, four where it was pushed back on (from
   * 2026-10-10, SLATE's estimate; until then three either way, the answer read by nothing). A boundary set before then
   * keeps three.
   */
  boundary: { after: 2, noticeHours: 24, respect: 2, argue: { trust: -3, bond: -4 }, liftAfterKept: { accepted: 2, pushedBack: 4, before: 3 } },
  /**
   * Making it right gives back what each thing let down took, and no more: a meeting or rehearsal missed (trust 6, the
   * bond 2 of the 3 it cost), a plan called off late (the bond's 1; it took no trust). Until 2026-10-08 every one gave
   * trust 6 and bond 2 whatever it was, and the social journeys (`tools/social-lives.mjs`) found the student who called
   * off late and apologized ending school closer to the class than the one who kept every plan.
   */
  amends: { minutes: 20, missed: { trust: 6, bond: 2 }, lateCancel: { trust: 0, bond: 1 } },
  /** Trying both readings at the next rehearsal moves the table work this much of what's left. */
  bothGain: 0.15,
} as const;

export type Priority = 'craft' | 'people' | 'career' | 'home';
export const PRIORITY_WORDS: Record<Priority, string> = { craft: 'The Work Itself', people: 'The People In The Room', career: 'Getting Seen And Working', home: 'A Life Outside School' };

export type MomentKind = 'disagreement' | 'study' | 'help' | 'encouragement' | 'apology' | 'boundary';
export interface Moment {
  id: string;
  mate: number;
  kind: MomentKind;
  at: Instant;
  until: Instant;
  status: 'open' | 'answered' | 'lapsed' | 'said';
  /** What it's about: the shared work and the question, their reading; or the evening proposed. */
  assignmentId?: string;
  question?: string;
  theirs?: string;
  when?: Instant;
  choice?: string;
  text: string;
}

/** What the classmate carries beyond partnering: their priority, what's happened that wants making right, a boundary, and the moments had with you. */
export interface ClassmatePerson {
  priority?: Priority;
  incidents?: { at: Instant; kind: 'missed' | 'lateCancel'; repaired?: Instant }[];
  boundary?: { since: Instant; keptSince: number; /** Accepted, or pushed back on (from 2026-10-10). */ accepted?: boolean };
  moments?: { at: Instant; kind: MomentKind; choice?: string }[];
}
export const personOf = (mate: Classmate): MateRecord & ClassmatePerson => mate as Classmate & MateRecord & ClassmatePerson;

export const MOMENT_KIND = 'school.moment';
export const STUDY_KIND = 'school.study_session';

const zone = () => CITIES.require(YALE_DRAMA.cityId).timeZone;
const first = (mate: Classmate) => mate.name.split(' ')[0]!;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** A classmate's priority, drawn once: the driven care most for the work, the rest by the draw. */
export function priorityOf(sim: Simulation, person: Person, i: number): Priority {
  const p = personOf(person.school!.classmates[i]!);
  if (!p.priority) {
    const r = sim.rng('school.classmates', person.id, `priority-${i}`).next();
    const drive = person.school!.classmates[i]!.drive ?? 1;
    p.priority = r < 0.25 + 0.4 * Math.max(0, drive - 1) ? 'craft' : r < 0.55 ? 'people' : r < 0.8 ? 'career' : 'home';
  }
  return p.priority;
}

/** The record's moments, made where a save has none. */
export const momentsOf = (cw: Coursework): Moment[] => ((cw as Coursework & { moments?: Moment[] }).moments ??= []);

/** Something that happened that wants making right: kept on the classmate (`incidents`), until you do. */
export function noteIncident(mate: Classmate, at: Instant, kind: 'missed' | 'lateCancel'): void {
  const p = personOf(mate);
  (p.incidents ??= []).push({ at, kind });
  if (p.incidents.length > 20) p.incidents.splice(0, p.incidents.length - 20);
}
const unrepaired = (mate: Classmate) => (personOf(mate).incidents ?? []).filter((x) => !x.repaired);

function remember(sim: Simulation, mate: Classmate, what: string): void {
  const m = mateRecord(mate);
  (m.log ??= []).unshift({ at: sim.now, what });
  if (m.log.length > 20) m.log.length = 20;
}
function move(person: Person, mate: Classmate, trust: number, bond: number): void {
  const m = mateRecord(mate);
  m.trust = Math.max(0, Math.min(100, trustOf(mate) + trust));
  if (bond) mate.bond = Math.max(-100, Math.min(100, (mate.bond ?? 0) + bondMove(person, bond)));
}
function had(mate: Classmate, kind: MomentKind, at: Instant): void {
  const p = personOf(mate);
  (p.moments ??= []).unshift({ at, kind });
  if (p.moments.length > 20) p.moments.length = 20;
}

/** Whether a boundary asks for a day's notice of a rehearsal at a time, and the words if so (read by `askRefusal`). */
export function boundaryRefusal(mate: Classmate, now: Instant, when: Instant): string | undefined {
  if (!personOf(mate).boundary) return undefined;
  return when - now < CLASS.boundary.noticeHours * 3_600_000 ? `${first(mate)} asked to be asked a day ahead, after last time.` : undefined;
}

/** How many rehearsals kept lift a boundary: by how it was taken (`CLASS.boundary.liftAfterKept`). */
export function boundaryLiftsAfter(b: NonNullable<ClassmatePerson['boundary']>): number {
  const l = CLASS.boundary.liftAfterKept;
  return b.accepted === undefined ? l.before : b.accepted ? l.accepted : l.pushedBack;
}

/** A rehearsal kept with a classmate who set a boundary: enough kept since, and it's lifted. */
export function keptWith(mate: Classmate): void {
  const b = personOf(mate).boundary;
  if (!b) return;
  b.keptSince += 1;
  if (b.keptSince >= boundaryLiftsAfter(b)) delete personOf(mate).boundary;
}

/**
 * Whether a classmate has stopped asking you to run lines: their last `declinedStop` invitations turned down or
 * left unanswered, the latest within `quietDays`. Read from the answers kept on them (`moments`).
 */
export function stoppedAsking(mate: Classmate, now: Instant): boolean {
  const asked = (personOf(mate).moments ?? []).filter((m) => m.kind === 'study');
  const last = asked.slice(0, CLASS.study.declinedStop);
  return last.length === CLASS.study.declinedStop && last.every((m) => m.choice !== 'yes') && now - last[0]!.at < CLASS.study.quietDays * 86_400_000;
}

/** Whether you helped this classmate with their lines within `CLASS.help.returnDays`: they'll ask you to run lines in turn. */
export function owesYouLines(mate: Classmate, now: Instant): boolean {
  return (personOf(mate).moments ?? []).some((m) => m.kind === 'help' && m.choice === 'help' && now - m.at < CLASS.help.returnDays * 86_400_000);
}

type Candidate = { kind: MomentKind; mate: number; build: () => Omit<Moment, 'id' | 'mate' | 'kind' | 'at' | 'until' | 'status'> | undefined };

/**
 * In class on a day, maybe one classmate brings something: the candidates are
 * read from the record (an open shared scene they read differently, an evening
 * they're free, a showing of yours that went badly, a rehearsal they missed,
 * two of yours unmade right), the kind least recently had with each first, and
 * the priority of each weighs which comes.
 */
export function classMoment(sim: Simulation, person: Person, day: SchoolDate): Moment | undefined {
  const cw = courseworkOf(sim, person);
  const school = person.school;
  if (!cw || !school?.classmates.length) return undefined;
  // Each classmate met has their priority, drawn once, so a screen only ever reads it.
  school.classmates.forEach((mate, i) => { if (mateRecord(mate).met) priorityOf(sim, person, i); });
  const moments = momentsOf(cw);
  if (moments.some((m) => m.status === 'open')) return undefined;
  const rng = sim.rng('school.classmates', person.id, `moment-${keyOf(day)}`);
  if (rng.next() >= CLASS.chance) return undefined;
  const now = sim.now;
  const recent = (mate: Classmate, kind: MomentKind) => (personOf(mate).moments ?? []).some((m) => m.kind === kind && now - m.at < CLASS.sameKindDays * 86_400_000);
  const open = cw.assignments.filter((a) => (a.status === 'open' || a.status === 'revising') && a.partner !== undefined);
  const cands: Candidate[] = [];
  school.classmates.forEach((mate, i) => {
    if (!mateRecord(mate).met) return;
    const pr = priorityOf(sim, person, i);
    // A disagreement: your shared scene, a question you've answered, where they'd read it another way.
    const shared = open.find((a) => a.partner === i && questionsFor(a).some(({ q }) => a.answers[q.id]));
    if (shared && !recent(mate, 'disagreement')) cands.push({ kind: 'disagreement', mate: i, build: () => disagreement(shared, mate, rng.next()) });
    // An invitation to run lines, on an evening they're free.
    // Those who care for the work or the room ask; anyone you helped with their lines asks in turn; nobody who has
    // stopped asking (`stoppedAsking`) does.
    const returning = owesYouLines(mate, now);
    if (!recent(mate, 'study') && (pr === 'craft' || pr === 'people' || returning) && trustOf(mate) >= WORK.trust.wary && !stoppedAsking(mate, now)) cands.push({ kind: 'study', mate: i, build: () => studyEvening(person, i, day, returning) });
    // A request for help: those under pressure to be seen, or with a life outside, are behind.
    if (!recent(mate, 'help') && (pr === 'career' || pr === 'home')) cands.push({ kind: 'help', mate: i, build: () => ({ text: `${first(mate)} is behind on their lines and asks if you’d run them for three quarters of an hour now. ${pr === 'home' ? 'They’ve had a hard week away from school.' : 'They’re auditioning outside school and short of time.'}` }) });
    // Encouragement, from a friend only, after work of yours that went badly in the last days.
    const bad = cw.assignments.find((a) => a.shown?.band === 'unready' && now - a.shown.at < 3 * 86_400_000);
    if (bad && (mate.bond ?? 0) >= CLASS.encourage.bondFrom && !recent(mate, 'encouragement')) cands.push({ kind: 'encouragement', mate: i, build: () => ({ text: `${first(mate)} caught you after class: everyone has a showing like that, and yours will come back.`, assignmentId: bad.id }) });
    // An apology, after a rehearsal they didn't come to, once a time.
    const stood = (mateRecord(mate).stoodUp ?? 0) > (personOf(mate).moments ?? []).filter((m) => m.kind === 'apology').length;
    if (stood && !recent(mate, 'apology')) cands.push({ kind: 'apology', mate: i, build: () => ({ text: `${first(mate)} apologizes for not coming to rehearse: ${pr === 'home' ? 'something at home took the evening' : 'they lost track of the day'}.` }) });
    // A boundary, after you've let them down twice and not made it right.
    if (!personOf(mate).boundary && unrepaired(mate).length >= CLASS.boundary.after && !recent(mate, 'boundary')) cands.push({ kind: 'boundary', mate: i, build: () => ({ text: `${first(mate)} says that after the last times, they’ll only rehearse with you if you ask a day ahead.` }) });
  });
  if (!cands.length) return undefined;
  // The kind least recently had across the class first, then the classmate least recently had it with; among equals,
  // the draw. Until a first measured run chose among every (classmate, kind) pair at once, a kind every classmate could
  // bring crowded out one only a partner could: 90 days brought nine moments, every one an invitation or a request.
  const kindLast = (k: MomentKind) => Math.max(0, ...school.classmates.map((mate) => (personOf(mate).moments ?? []).find((m) => m.kind === k)?.at ?? 0));
  const kinds = [...new Set(cands.map((c) => c.kind))];
  const oldestKind = Math.min(...kinds.map(kindLast));
  const kindPool = kinds.filter((k) => kindLast(k) === oldestKind);
  const kind = kindPool[Math.floor(rng.next() * kindPool.length)]!;
  const lastHad = (c: Candidate) => (personOf(school.classmates[c.mate]!).moments ?? []).find((m) => m.kind === c.kind)?.at ?? 0;
  const ofKind = cands.filter((c) => c.kind === kind);
  const oldest = Math.min(...ofKind.map(lastHad));
  const pool = ofKind.filter((c) => lastHad(c) === oldest);
  const pick = pool[Math.floor(rng.next() * pool.length)]!;
  const built = pick.build();
  if (!built) return undefined;
  const mate = school.classmates[pick.mate]!;
  const said = pick.kind === 'encouragement';
  const m: Moment = { id: sim.nextId('rehearsal'), mate: pick.mate, kind: pick.kind, at: now, until: now + CLASS.answerHours * 3_600_000, status: said ? 'said' : 'open', ...built };
  moments.push(m);
  if (moments.length > 60) moments.splice(0, moments.length - 60);
  had(mate, pick.kind, now);
  if (said) {
    person.wellbeing.morale = Math.min(100, person.wellbeing.morale + CLASS.encourage.morale);
    remember(sim, mate, 'Encouraged you after a hard showing');
  } else sim.schedule({ at: m.until, kind: MOMENT_KIND, label: `Answer ${first(mate)}`, category: 'school', priority: 33, requiresPlayer: false, payload: { personId: person.id, momentId: m.id } });
  if (person.id === sim.universe.playerId) sim.notify({ category: 'school', title: `${first(mate)}: ${MOMENT_TITLE[pick.kind]}`, body: m.text, importance: said ? 40 : 55, route: '/workspace/school' });
  return m;
}

export const MOMENT_TITLE: Record<MomentKind, string> = { disagreement: 'A Different Reading', study: 'Run Lines Together?', help: 'Asks For Help', encouragement: 'A Word After Class', apology: 'An Apology', boundary: 'A Boundary' };

/** A disagreement over your shared scene: a question you answered, read their way (another the text supports where there is one). */
function disagreement(a: Assignment, mate: Classmate, draw: number): Omit<Moment, 'id' | 'mate' | 'kind' | 'at' | 'until' | 'status'> | undefined {
  const qs = questionsFor(a).filter(({ q, options }) => a.answers[q.id] && options.length > 1);
  if (!qs.length) return undefined;
  const { q, options } = qs[Math.floor(draw * qs.length)]!;
  const mine = options.find((o) => o.id === a.answers[q.id])!;
  const others = options.filter((o) => o.id !== mine.id);
  const theirs = others.find((o) => o.supported) ?? others[0]!;
  const scene = a.sceneId ? sceneById(a.sceneId)?.play : undefined;
  return { assignmentId: a.id, question: q.id, theirs: theirs.id, text: `${first(mate)} reads ${q.label.toLowerCase()} in ${scene ?? 'your scene'} another way: “${theirs.text}”, where you have “${mine.text}”.` };
}

/** An evening in the next three a classmate is free to run lines, at seven. */
function studyEvening(person: Person, i: number, day: SchoolDate, returning = false): Omit<Moment, 'id' | 'mate' | 'kind' | 'at' | 'until' | 'status'> | undefined {
  for (let n = 1; n <= 3; n += 1) {
    const d = new Date(Date.UTC(day.year, day.month - 1, day.day + n));
    const when = instantFromZoned({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: CLASS.study.hour, minute: 0 }, zone());
    if (mateBusy(person, i, when, CLASS.study.minutes)) continue;
    const mate = person.school!.classmates[i]!;
    return { when, text: `${first(mate)} asks if you’d run lines together on ${formatDate(when, zone())} at ${formatTime(when, zone())}, an hour.${returning ? ' You ran theirs when they were behind.' : ''}` };
  }
  return undefined;
}

/** The answers a moment takes. */
export const CHOICES: Record<MomentKind, readonly { id: string; label: string }[]> = {
  disagreement: [{ id: 'hold', label: 'Keep Your Reading' }, { id: 'theirs', label: 'Try Theirs' }, { id: 'both', label: 'Try Both Next Rehearsal' }],
  study: [{ id: 'yes', label: 'Say Yes' }, { id: 'no', label: 'Say No' }],
  help: [{ id: 'help', label: 'Help Now' }, { id: 'no', label: 'Say You Can’t' }],
  encouragement: [],
  apology: [{ id: 'accept', label: 'Accept It' }, { id: 'cool', label: 'Take It Coolly' }],
  boundary: [{ id: 'respect', label: 'Accept It' }, { id: 'argue', label: 'Push Back' }],
};

/** Why a moment can't be answered so, or nothing. */
export function respondRefusal(sim: Simulation, person: Person, m: Moment | undefined, choice: string): string | undefined {
  if (!m) return 'There’s no such conversation.';
  if (m.status === 'lapsed') return 'It’s too late to answer: the moment passed.';
  if (m.status !== 'open') return 'You’ve answered it.';
  if (!CHOICES[m.kind].some((c) => c.id === choice)) return 'That isn’t an answer to it.';
  const a = m.assignmentId ? courseworkOf(sim, person)?.assignments.find((x) => x.id === m.assignmentId) : undefined;
  if (m.kind === 'disagreement' && (!a || (a.status !== 'open' && a.status !== 'revising'))) return 'That work is finished.';
  if (m.kind === 'help' && choice === 'help') {
    if (person.currentLocationId !== YALE_DRAMA.cityId) return 'They’re in New Haven.';
    const busy = occupiedAt(sim, sim.now);
    if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  }
  if (m.kind === 'study' && choice === 'yes') {
    const when = m.when!;
    if (when <= sim.now) return 'That evening has passed.';
    const clash = sim.universe.scheduled.find((x) => x.status === 'pending' && x.requiresPlayer && x.durationMinutes && x.at < when + CLASS.study.minutes * 60_000 && x.at + x.durationMinutes * 60_000 > when);
    if (clash) return `You have ${clash.label} then: say no instead.`;
  }
  return undefined;
}

/** Why making amends with a classmate can't be done now, or nothing. */
export function amendsRefusal(sim: Simulation, person: Person, i: number): string | undefined {
  const mate = person.school?.classmates[i];
  if (!mate) return 'There’s no such classmate.';
  if (!unrepaired(mate).length) return 'There’s nothing between you to make right.';
  // In New Haven. After the degree they were in the town the person they are lived in (from 2026-10-08), until the
  // people they are went in the scope reset of 2026-10-09 (`systems/people.ts`).
  if (person.currentLocationId !== YALE_DRAMA.cityId) return `${first(mate)} is in ${CITIES.require(YALE_DRAMA.cityId).name}.`;
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  return undefined;
}

export function registerClassmates(sim: Simulation): void {
  sim.onCommand<{ momentId: string; choice: string }, { done: string }>('school.respond', (p, { sim: s }) => {
    const person = s.player;
    const cw = courseworkOf(s, person);
    const m = cw ? momentsOf(cw).find((x) => x.id === p?.momentId) : undefined;
    const choice = String(p?.choice);
    const no = respondRefusal(s, person, m, choice);
    if (no) throw new CommandError(no);
    const mate = person.school!.classmates[m!.mate]!;
    m!.status = 'answered';
    m!.choice = choice;
    const mo = personOf(mate).moments?.find((x) => x.at === m!.at && x.kind === m!.kind);
    if (mo) mo.choice = choice;
    for (const item of s.universe.scheduled) if (item.status === 'pending' && item.kind === MOMENT_KIND && item.payload.momentId === m!.id) s.timeline.cancel(item.id, s.now);
    const f = first(mate);
    switch (m!.kind) {
      case 'disagreement': {
        const a = cw!.assignments.find((x) => x.id === m!.assignmentId)!;
        const opts = questionsFor(a).find(({ q }) => q.id === m!.question)!.options;
        const mine = opts.find((o) => o.id === a.answers[m!.question as never]);
        const theirs = opts.find((o) => o.id === m!.theirs)!;
        if (choice === 'hold') {
          const against = mine && !mine.supported && theirs.supported;
          const e = against ? CLASS.holdAgainstText : CLASS.hold;
          move(person, mate, e.trust, e.bond);
          remember(s, mate, `Read the scene differently; you kept your reading`);
          return { done: against ? `You kept yours. ${f} isn’t persuaded, and the text is on their side.` : `You kept yours, and ${f} respects it: both readings stand.` };
        }
        if (choice === 'theirs') {
          a.answers[m!.question as never] = theirs.id as never;
          move(person, mate, CLASS.theirs.trust, CLASS.theirs.bond);
          remember(s, mate, 'You tried their reading of the scene');
          return { done: `You’ll play it ${f}’s way.` };
        }
        (a as Assignment & { tryBoth?: boolean }).tryBoth = true;
        move(person, mate, CLASS.both.trust, CLASS.both.bond);
        remember(s, mate, 'You agreed to try both readings at the next rehearsal');
        return { done: `You’ll try both at your next rehearsal with ${f}.` };
      }
      case 'study': {
        if (choice === 'no') { remember(s, mate, 'Asked you to run lines; you couldn’t'); return { done: `You told ${f} you can’t.` }; }
        s.schedule({ at: m!.when!, kind: STUDY_KIND, label: `Running Lines With ${f}`, category: 'school', priority: 32, requiresPlayer: true, durationMinutes: CLASS.study.minutes, locationId: YALE_DRAMA.cityId, payload: { personId: person.id, mate: m!.mate, momentId: m!.id } });
        return { done: 'On your calendar.' };
      }
      case 'help': {
        if (choice === 'no') { remember(s, mate, 'Asked for your help; you couldn’t'); return { done: `You told ${f} you can’t.` }; }
        s.advanceTo(s.now + CLASS.help.minutes * 60_000);
        exerts(person, WORK.met.desk, CLASS.help.minutes / 60);
        move(person, mate, CLASS.help.trust, CLASS.help.bond);
        remember(s, mate, 'You helped them with their lines when they were behind');
        return { done: `You ran ${f}’s lines with them.` };
      }
      case 'apology': {
        const by = choice === 'accept' ? CLASS.apology.accept : CLASS.apology.cool;
        move(person, mate, 0, by);
        remember(s, mate, choice === 'accept' ? 'Apologized; you accepted it' : 'Apologized; you took it coolly');
        return { done: choice === 'accept' ? `You told ${f} it’s fine.` : `You let ${f} know it mattered.` };
      }
      case 'boundary': {
        if (choice === 'respect') {
          personOf(mate).boundary = { since: s.now, keptSince: 0, accepted: true };
          move(person, mate, CLASS.boundary.respect, 0);
          remember(s, mate, 'Set a boundary; you accepted it');
          return { done: `From now, ask ${f} a day ahead; ${CLASS.boundary.liftAfterKept.accepted} rehearsals kept, and it lifts.` };
        }
        personOf(mate).boundary = { since: s.now, keptSince: 0, accepted: false };
        move(person, mate, CLASS.boundary.argue.trust, CLASS.boundary.argue.bond);
        remember(s, mate, 'Set a boundary; you pushed back');
        return { done: `${f} holds to it, and things are cooler between you: ${CLASS.boundary.liftAfterKept.pushedBack} rehearsals kept before it lifts.` };
      }
      default: return { done: '' };
    }
  });

  sim.onCommand<{ mate: number }, { repaired: number }>('school.make_amends', (p, { sim: s }) => {
    const person = s.player;
    const i = Number(p?.mate);
    const no = amendsRefusal(s, person, i);
    if (no) throw new CommandError(no);
    const mate = person.school!.classmates[i]!;
    const open = unrepaired(mate);
    s.advanceTo(s.now + CLASS.amends.minutes * 60_000);
    for (const x of open) x.repaired = s.now;
    move(person, mate, open.reduce((n, x) => n + CLASS.amends[x.kind].trust, 0), open.reduce((n, x) => n + CLASS.amends[x.kind].bond, 0));
    remember(s, mate, 'You made it right with them');
    return { repaired: open.length };
  });

  sim.onSchedule(MOMENT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const cw = person ? courseworkOf(s, person) : undefined;
    const m = cw ? momentsOf(cw).find((x) => x.id === item.payload.momentId) : undefined;
    if (!person || !m || m.status !== 'open') return;
    m.status = 'lapsed';
    const mate = person.school!.classmates[m.mate]!;
    // Unanswered: only an invitation left hanging costs anything.
    if (m.kind === 'study') move(person, mate, CLASS.study.unanswered, 0);
    remember(s, mate, 'Brought something to you, and heard nothing back');
  });

  sim.onSchedule(STUDY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person?.school) return;
    const mate = person.school.classmates[Number(item.payload.mate)]!;
    const here = person.currentLocationId === YALE_DRAMA.cityId && !(person.awakeSince !== undefined && person.awakeSince > item.at);
    if (!here) {
      item.status = 'missed';
      move(person, mate, CLASS.study.missed.trust, CLASS.study.missed.bond);
      noteIncident(mate, item.at, 'missed');
      remember(s, mate, 'You didn’t come to run lines');
      if (person.id === s.universe.playerId) s.notify({ category: 'school', title: `${first(mate)} Waited For You`, body: 'You didn’t come to run lines. They’ll remember it.', importance: 55, route: '/workspace/school' });
      return;
    }
    // Your open work with the least secure lines, moved as a step of learning lines would, without training a skill.
    const cw = courseworkOf(s, person)!;
    const open = cw.assignments.filter((a) => (a.status === 'open' || a.status === 'revising') && a.sceneId).sort((x, y) => x.prep.memorization - y.prep.memorization)[0];
    if (open) open.prep.memorization = clamp01(open.prep.memorization + CLASS.study.memorization * (1 - open.prep.memorization));
    exerts(person, WORK.met.desk, CLASS.study.minutes / 60);
    move(person, mate, CLASS.study.kept.trust, CLASS.study.kept.bond);
    remember(s, mate, 'Ran lines with you');
  });
}

/** The day's moment, as the class-day reckoning asks for it (a thin wrapper so `school.ts` names one call). */
export const momentInClass = (sim: Simulation, person: Person, when: Instant): Moment | undefined => {
  const p = zonedParts(when, zone());
  return classMoment(sim, person, { year: p.year, month: p.month, day: p.day });
};

