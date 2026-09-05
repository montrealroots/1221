/**
 * SLATE — what the office made of you.
 *
 * In the twenty seconds after the door shuts, a casting office decides four
 * or five things about somebody and types one line next to their name. Were
 * they right for this. Was the work any good. Did it change when it was asked
 * to. What were they like in the room. Would we bring them in again.
 *
 * None of that reaches the actor directly, ever. It goes into the office's
 * own notes, and some of it comes back days later through their agent, in
 * whatever words the agent decides to use — which is usually kinder than what
 * was said and occasionally is not. An actor without representation mostly
 * hears nothing at all, which is the truest part of this.
 *
 * What does last is the relationship. An office that has liked you twice
 * starts bringing you in without a submission, and that is how a career in
 * this business is actually built.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Audition, CastingOfficeStanding, Id, SessionRead } from '../domain/model';
import { clamp, remap } from '../core/rng';
import type { Rng } from '../core/rng';
import { MS_DAY, addDays } from '../core/time';
import { CASTING_DIRECTOR_BY_ID } from '../content/casting-people';
import { ROLE_CATEGORY_BY_ID } from '../content/casting-industry';
import { registerFor } from '../content/room-dialogue';
import { effectiveAttributes } from '../domain/attributes';
import { roleCategoryOf } from './casting';

// ---------------------------------------------------------------------------
// The line typed next to your name
// ---------------------------------------------------------------------------

/**
 * Session notes, as offices actually write them: short, unsentimental, and
 * never meant to be read by the person they are about.
 */
const NOTES_YES: readonly string[] = [
  'Best of the day.',
  'That is the part. Get them back in front of {director}.',
  'Yes. Yes to all of it.',
  'Do not let this one go anywhere else.',
  'Booked it in the room, as far as I am concerned.',
  'Everything the {role} needs and something we had not thought of.',
  'Send to producers today.',
  'Nobody else has come near this.',
];
const NOTES_MAYBE: readonly string[] = [
  'Good. Not the best we have seen. Keep in the mix.',
  'Right feel, slightly light on the second scene.',
  'Solid. Would work if we cannot get the first choice.',
  'Nice actor. Not sure they are this person.',
  'Keep for the {role}, or for the other one.',
  'Fine. Fine is the problem.',
  'Better than the tape. Bring in again if we go another round.',
  'Interesting choice, did not entirely land it.',
];
const NOTES_NO: readonly string[] = [
  'Not for this.',
  'No. Pleasant, unprepared.',
  'Cannot take a note. Do not bring in again for {director}.',
  'Nothing wrong with it, nothing in it either.',
  'Too much. Every time, too much.',
  'Did the same thing twice after we asked for a change.',
  'Not at this level yet. Maybe in two years.',
  'No, and I am not sure who submitted them.',
];
const NOTES_WRONG: readonly string[] = [
  'Lovely. Wrong for this one — bring in for something else.',
  'Good actor, wrong part. Remember for the {register} thing.',
  'Reads too young for it. Keep on the list.',
  'Not this, but I want to use them.',
  'Right instincts, wrong character. File it.',
  'Would be perfect for the other one if it were still open.',
];

/** How an agent softens, or does not soften, what the office said. */
const RELAY_KIND: readonly string[] = [
  'They came back and they were lovely about you.',
  'Casting rang. It was a good room and they said so.',
  'Very warm feedback. They want to see you again.',
  'They said you were the best thing they saw that day, which is not something they say.',
  'Good news on that one — you are on their list now.',
];
const RELAY_MIXED: readonly string[] = [
  'They liked you. They are seeing more people.',
  'Positive but not decisive, which is most of them.',
  'They said good things and no dates, so make of that what you will.',
  'You are in the conversation. That is what I have.',
  'Nothing bad came back, which with that office is something.',
];
const RELAY_BLUNT: readonly string[] = [
  'I am going to tell you what they actually said, because you asked me to. {note}',
  'You want it straight: {note}',
  'Not what either of us wanted. {note}',
  'They were direct. {note}',
];
const RELAY_SOFT: readonly string[] = [
  'They went another way. That is all I have.',
  'Not this one. They were complimentary, for whatever that is worth.',
  'No on that. They have your details.',
  'It went to somebody with a name. It happens.',
  'They said it was close, which they say to everybody, but they did say it.',
];
const RELAY_NOTHING: readonly string[] = [
  'Nothing back yet. I have chased them twice.',
  'They have not returned the call. That is usually an answer.',
  'No word. Do not read anything into it, and also do read something into it.',
];

const pick = <T,>(bank: readonly T[], rng: Rng): T => bank[rng.int(0, bank.length - 1)]!;

// ---------------------------------------------------------------------------
// What the office decides
// ---------------------------------------------------------------------------

/**
 * The office's read on somebody, on the axes a session is actually sorted by.
 *
 * Everything here comes from what happened: what the part needed against what
 * the person has, how the read itself went, whether the performance changed
 * when the director asked, and how they were to have in the room.
 */
export function readSession(sim: Simulation, audition: Audition): SessionRead {
  const role = sim.universe.roles[audition.roleId];
  const project = sim.universe.projects[audition.projectId];
  const person = sim.universe.people[audition.personId];
  const room = audition.room;
  const rng = sim.rng('session_read', audition.id);

  // Right for it: what the part asked for against what they have, and the age.
  const attributes = person ? effectiveAttributes(person.attributes, person.traits) : {};
  const requirements = role?.requirements ?? [];
  const totalWeight = requirements.reduce((sum, r) => sum + r.weight, 0) || 1;
  const fit = requirements.length > 0
    ? requirements.reduce((sum, r) => sum + (attributes[r.attributeId] ?? 20) * r.weight, 0) / totalWeight
    : audition.fitScore ?? 50;
  const right = clamp(Math.round(fit * 0.8 + (audition.fitScore ?? fit) * 0.2), 0, 100);

  // The work: the room's verdict if they were in one, the score otherwise.
  const read = clamp(Math.round(room?.verdict?.score ?? audition.performanceScore ?? audition.totalScore ?? 40), 0, 100);

  // Direction: only knowable if somebody gave them a note.
  const adjustment = room?.played.find((entry) => entry.beat === 'adjustment');
  const direction = adjustment
    ? clamp(Math.round(adjustment.score - (adjustment.choiceId === 'same_again' ? 30 : 0)), 0, 100)
    : clamp(Math.round((attributes['direction_absorption'] ?? 40) * 0.7 + read * 0.3), 0, 100);

  // In the room: how they were as a person, from the beats that test it.
  const manners = room?.played.filter((entry) => ['walk_in', 'room_talk', 'walk_out', 'waiting'].includes(entry.beat)) ?? [];
  const inTheRoom = room?.walkedOut ? 4
    : manners.length > 0
      ? clamp(Math.round(manners.reduce((sum, m) => sum + m.score, 0) / manners.length), 0, 100)
      : clamp(Math.round((attributes['set_etiquette'] ?? 45) * 0.6 + (attributes['punctuality'] ?? 45) * 0.4), 0, 100);

  // Would we have them back: mostly the work and the person, not this part.
  const standing = person ? standingWithOffice(sim, project?.castingOfficeId, person.id) : 50;
  const bringBack = clamp(Math.round(read * 0.4 + inTheRoom * 0.3 + direction * 0.2 + standing * 0.1), 0, 100);

  const pile: SessionRead['pile'] = room?.walkedOut ? 'no'
    : read >= 72 && right >= 55 ? 'yes'
      : read >= 60 && right < 45 ? 'wrong_for_this'
        : read >= 50 ? 'maybe'
          : 'no';

  const bank = pile === 'yes' ? NOTES_YES : pile === 'maybe' ? NOTES_MAYBE : pile === 'wrong_for_this' ? NOTES_WRONG : NOTES_NO;
  const director = project?.directorId ? sim.universe.people[project.directorId] : undefined;
  const note = pick(bank, rng)
    .replace('{director}', director?.stageName ?? director?.displayName ?? 'the director')
    .replace('{role}', role ? ROLE_CATEGORY_BY_ID[roleCategoryOf(role, project)].name.toLowerCase() : 'part')
    .replace('{register}', project ? registerFor(project.genres) : 'other');

  return { right, read, direction, inTheRoom, bringBack, pile, note };
}

/** Where somebody stands with one office right now. */
export function standingWithOffice(sim: Simulation, castingDirectorId: string | undefined, personId: Id): number {
  if (!castingDirectorId || personId !== sim.universe.playerId) return 50;
  return sim.universe.castingOffices?.[castingDirectorId]?.regard ?? 50;
}

/** The office's own record of the player, made the first time they are seen. */
export function officeStanding(sim: Simulation, castingDirectorId: string): CastingOfficeStanding {
  sim.universe.castingOffices ??= {};
  const existing = sim.universe.castingOffices[castingDirectorId];
  if (existing) return existing;
  const made: CastingOfficeStanding = {
    castingDirectorId,
    seen: 0, roomsHeld: 0, sessions: [],
    list: 'unknown', regard: 50,
    firstSeenAt: sim.now, lastSeenAt: sim.now,
    broughtInDirectly: 0, booked: 0,
  };
  sim.universe.castingOffices[castingDirectorId] = made;
  return made;
}

/**
 * The session goes into the office's notes, and the relationship moves.
 *
 * Regard moves slowly and on the whole picture: one good room does not make
 * you a favourite and one bad one does not finish you, but four of either
 * decides how that office thinks of you for years.
 */
export function recordSession(sim: Simulation, audition: Audition, read: SessionRead): CastingOfficeStanding | undefined {
  const project = sim.universe.projects[audition.projectId];
  const officeId = project?.castingOfficeId;
  if (!officeId || !CASTING_DIRECTOR_BY_ID[officeId]) return undefined;
  if (audition.personId !== sim.universe.playerId) return undefined;

  const standing = officeStanding(sim, officeId);
  const role = sim.universe.roles[audition.roleId];
  standing.seen += 1;
  if (audition.room?.finishedAt) standing.roomsHeld += 1;
  standing.lastSeenAt = sim.now;
  standing.sessions.push({
    at: sim.now,
    projectTitle: project?.title ?? 'A project',
    characterName: role?.characterName ?? 'A part',
    read,
  });
  if (standing.sessions.length > 40) standing.sessions.splice(0, standing.sessions.length - 40);

  const move = remap(read.bringBack, 0, 100, -9, 11);
  standing.regard = clamp(Math.round(standing.regard + move), 0, 100);
  standing.list = standing.regard >= 78 && standing.seen >= 2 ? 'favourite'
    : standing.regard >= 62 ? 'shortlist'
      : standing.regard >= 45 ? 'watching'
        : 'unknown';

  sim.emit('cast.session_recorded', { auditionId: audition.id, officeId, pile: read.pile, regard: standing.regard });
  return standing;
}

// ---------------------------------------------------------------------------
// The grades an agent actually passes on
// ---------------------------------------------------------------------------

/**
 * What each axis is called when it is said out loud, and the words used for it.
 *
 * No office ever gives an actor a number, so neither does this. What an agent
 * relays is the sentence casting used, and these are those sentences, in the
 * bands they are used in.
 */
const AXIS_LABEL: Readonly<Record<'right' | 'read' | 'direction' | 'inTheRoom' | 'bringBack', string>> = {
  right: 'Right For It',
  read: 'The Read',
  direction: 'Taking A Note',
  inTheRoom: 'In The Room',
  bringBack: 'Bringing You Back',
};

const AXIS_WORDS: Readonly<Record<keyof typeof AXIS_LABEL, readonly [string, string, string, string, string]>> = {
  // Worst to best. The bands are 0-34, 35-49, 50-64, 65-79, 80-100.
  right: ['Not This One', 'Wrong Shape For It', 'Could Be Made To Work', 'Close To It', 'Exactly It'],
  read: ['Under It', 'Did Not Land', 'Fine', 'Strong', 'Best Thing They Saw'],
  direction: ['Did It The Same Again', 'Barely Moved', 'Took The Note', 'Changed It Properly', 'Different Scene Second Time'],
  inTheRoom: ['Hard Work', 'Nervy', 'No Trouble', 'Easy To Have In', 'They Liked You'],
  bringBack: ['Not Soon', 'Not For This Office', 'They Will Think About It', 'On Their List', 'In Without Asking'],
};

/** Which of the five words a score falls under. */
function band(score: number): 0 | 1 | 2 | 3 | 4 {
  return score >= 80 ? 4 : score >= 65 ? 3 : score >= 50 ? 2 : score >= 35 ? 1 : 0;
}

/**
 * The grades that reach the player, which is not all of them.
 *
 * A blunt agent gives you the whole card. A kind one gives you the work and
 * the room and leaves the rest, unless it went well enough that there is
 * nothing to protect you from. Nobody relays what they were not told.
 */
export function gradesFor(
  read: SessionRead, blunt: boolean,
): NonNullable<NonNullable<Audition['relayedFeedback']>['grades']> {
  const all = (['right', 'read', 'direction', 'inTheRoom', 'bringBack'] as const)
    .map((axis) => ({ axis, label: AXIS_LABEL[axis], grade: AXIS_WORDS[axis][band(read[axis])] }));
  if (blunt || read.pile === 'yes') return all;
  if (read.pile === 'wrong_for_this') return all.filter((g) => g.axis === 'right' || g.axis === 'read' || g.axis === 'bringBack');
  return all.filter((g) => g.axis === 'read' || g.axis === 'inTheRoom');
}

// ---------------------------------------------------------------------------
// What comes back
// ---------------------------------------------------------------------------

export function registerCastingOffice(sim: Simulation): void {
  sim.onSchedule('cast.feedback', (item) => relayFeedback(sim, item.payload.auditionId as Id));

  /**
   * Getting your side to ring them.
   *
   * Every actor does this and every actor knows they should not do it twice.
   * A represented actor has their agent make the call, which is normal and
   * costs nothing the first time; an actor with no agent is ringing a casting
   * office about themselves, which offices remember. Either way the answer
   * arrives sooner than it would have, and chasing the same office over and
   * over is the fastest way to be remembered for the wrong thing.
   */
  sim.onCommand<{ auditionId: Id }, { chased: boolean; through: string; expectedInDays: number; note: string }>(
    'cast.chase_feedback',
    (p, { sim: s }) => {
      const audition = s.universe.auditions[p.auditionId];
      if (!audition || !audition.isPlayer) throw new CommandError('That is not your audition.');
      if (audition.relayedFeedback) throw new CommandError('They have already come back on that one.');
      if (!audition.sessionRead) throw new CommandError('There is nothing to chase. They have not seen you for it yet.');

      const pending = s.timeline.pending().find((i) => i.kind === 'cast.feedback' && i.refId === audition.id);
      if (!pending) throw new CommandError('There is no answer outstanding on that one.');

      const project = s.universe.projects[audition.projectId];
      const officeId = project?.castingOfficeId;
      const record = officeId ? CASTING_DIRECTOR_BY_ID[officeId] : undefined;
      const agency = s.player.representation.agencyName;
      const through = agency ?? 'You, yourself';

      const rng = s.rng('chase', audition.id, s.counter('chases'));
      const days = rng.int(1, 4);
      const at = addDays(s.now, days, s.homeZone);
      if (at < pending.at) s.timeline.reschedule(pending.id, at);

      // The office's own view of being chased.
      let note = agency
        ? `${agency} rang ${record?.office ?? 'the office'}. They said they would come back.`
        : `You rang ${record?.office ?? 'the office'} yourself. They were polite about it.`;
      if (officeId && CASTING_DIRECTOR_BY_ID[officeId]) {
        const standing = officeStanding(s, officeId);
        standing.chasedAt ??= [];
        const recent = standing.chasedAt.filter((when) => s.now - when < 30 * MS_DAY).length;
        standing.chasedAt.push(s.now);
        if (standing.chasedAt.length > 20) standing.chasedAt.splice(0, standing.chasedAt.length - 20);
        // Once is normal. Without an agent it is already a mark against you.
        const cost = (agency ? 0 : 2) + (recent >= 1 ? 3 : 0) + (recent >= 3 ? 4 : 0);
        if (cost > 0) {
          standing.regard = clamp(standing.regard - cost, 0, 100);
          note += recent >= 1
            ? ' That is not the first time this month, and offices keep count.'
            : ' Casting offices would rather hear from an agent than from an actor.';
        }
      }

      s.notify({
        category: 'career', title: 'Chasing Casting',
        body: note, importance: 30, route: '/workspace/casting',
        refType: 'audition', refId: audition.id,
      });
      return { chased: true, through, expectedInDays: days, note };
    },
  );

  // Every room the player finishes is read by the office that ran it, and the
  // feedback is put in the post.
  sim.onEvent('cast.room_finished', 'office.read_the_room', (event, { sim: s }) => {
    const auditionId = (event.payload as { auditionId?: Id }).auditionId;
    const audition = auditionId ? s.universe.auditions[auditionId] : undefined;
    if (!audition?.isPlayer) return;
    const read = readSession(s, audition);
    audition.sessionRead = read;
    recordSession(s, audition, read);
    scheduleFeedback(s, audition);
  }, 80);

  // A tape is watched too, and read the same way.
  sim.onEvent('cast.tape_sent', 'office.watched_the_tape', (event, { sim: s }) => {
    const auditionId = (event.payload as { auditionId?: Id }).auditionId;
    const audition = auditionId ? s.universe.auditions[auditionId] : undefined;
    if (!audition?.isPlayer || audition.sessionRead) return;
    const read = readSession(s, audition);
    audition.sessionRead = read;
    recordSession(s, audition, read);
    scheduleFeedback(s, audition);
  }, 80);

  // Booking somebody is the strongest thing an office can say about them, and
  // it is the office's own reputation on the line if it goes badly. It counts
  // for far more than any single good room.
  sim.onEvent('cast.role_filled', 'office.booked_you', (event, { sim: s }) => {
    const { personId, projectId } = event.payload as { personId?: Id; projectId?: Id };
    if (personId !== s.universe.playerId || !projectId) return;
    const officeId = s.universe.projects[projectId]?.castingOfficeId;
    if (!officeId || !CASTING_DIRECTOR_BY_ID[officeId]) return;
    const standing = officeStanding(s, officeId);
    standing.booked += 1;
    standing.lastSeenAt = s.now;
    standing.regard = clamp(standing.regard + 14, 0, 100);
    standing.list = standing.regard >= 78 ? 'favourite' : standing.regard >= 62 ? 'shortlist' : 'watching';
  });
}

/**
 * Feedback takes days, and it goes to your agent rather than to you.
 *
 * It never arrives before the office's answer about the part, because in life
 * the two come in the same phone call or the feedback comes afterwards. An
 * agent does not ring to say you were wonderful and then ring a week later to
 * say they passed.
 */
function scheduleFeedback(sim: Simulation, audition: Audition): void {
  if (sim.timeline.pending().some((i) => i.kind === 'cast.feedback' && i.refId === audition.id)) return;
  const rng = sim.rng('feedback_when', audition.id);
  const answer = sim.timeline.pending().find((i) => i.kind === 'cast.office_response' && i.refId === audition.id);
  const at = answer
    ? addDays(answer.at, rng.int(0, 6), sim.homeZone)
    : addDays(sim.now, rng.int(3, 16), sim.homeZone);
  sim.schedule({
    at,
    kind: 'cast.feedback',
    label: 'Feedback',
    category: 'career',
    payload: { auditionId: audition.id },
    priority: 44,
    refType: 'audition', refId: audition.id,
  });
}

/**
 * Your agent rings.
 *
 * Whether there is anything to relay at all depends on having somebody to
 * relay it: an unrepresented actor mostly hears nothing, because the office
 * has nobody to tell. What they pass on depends on how good the news is and
 * on whether your agent is the kind who softens it.
 */
function relayFeedback(sim: Simulation, auditionId: Id): void {
  const audition = sim.universe.auditions[auditionId];
  if (!audition?.isPlayer || audition.relayedFeedback) return;
  const read = audition.sessionRead;
  if (!read) return;
  const project = sim.universe.projects[audition.projectId];
  const role = sim.universe.roles[audition.roleId];
  const player = sim.player;
  const rng = sim.rng('feedback', audition.id);

  const agency = player.representation.agencyName;
  const office = project?.castingOfficeId ? CASTING_DIRECTOR_BY_ID[project.castingOfficeId] : undefined;
  const from = agency ?? (office ? `${office.office}` : 'The office');

  // Without representation there is usually nobody for the office to call.
  if (!agency && !rng.chance(0.25)) {
    audition.relayedFeedback = { at: sim.now, from: 'Nobody', body: pick(RELAY_NOTHING, rng), blunt: false };
    sim.notify({
      category: 'career',
      title: `Nothing back on ${role?.characterName ?? 'that part'}`,
      body: `${project?.title ?? 'That one'}. Without an agent there is nobody for casting to ring, which is most of what having one is for.`,
      importance: 38, route: '/workspace/casting', refType: 'audition', refId: audition.id,
    });
    return;
  }

  // A blunt agent passes the note on. A kind one does not.
  const blunt = rng.chance(0.3);
  const body = read.pile === 'yes' ? pick(RELAY_KIND, rng)
    : read.pile === 'maybe' ? pick(RELAY_MIXED, rng)
      : blunt ? pick(RELAY_BLUNT, rng).replace('{note}', `“${read.note}”`)
        : pick(RELAY_SOFT, rng);

  audition.relayedFeedback = { at: sim.now, from, body, blunt, grades: gradesFor(read, blunt) };
  sim.notify({
    category: 'career',
    title: `Feedback: ${role?.characterName ?? 'a part'}`,
    body: `${from}. ${body}`,
    importance: read.pile === 'yes' ? 66 : 48,
    route: '/workspace/casting', refType: 'audition', refId: audition.id,
  });
  sim.remember({
    category: 'career',
    title: `Heard back on ${role?.characterName ?? 'a part'}`,
    detail: `${project?.title ?? 'A project'}. ${body}`,
    refs: [{ type: 'audition', id: audition.id }],
    significance: read.pile === 'yes' ? 34 : 18, public: false,
  });
  sim.emit('cast.feedback_relayed', { auditionId: audition.id, pile: read.pile, blunt });
}

// ---------------------------------------------------------------------------
// What the relationship is worth
// ---------------------------------------------------------------------------

/**
 * The offices that would bring the player in without a submission.
 *
 * This is the whole point of the relationship: once an office has liked you
 * twice, you stop competing for the door and start being called through it.
 */
export function officesThatWouldCall(sim: Simulation): CastingOfficeStanding[] {
  return Object.values(sim.universe.castingOffices ?? {})
    .filter((standing) => standing.list === 'shortlist' || standing.list === 'favourite')
    .sort((a, b) => b.regard - a.regard);
}

/**
 * For the screen: where you stand with everybody who has ever seen you.
 *
 * Deliberately not the standing itself. The office's private note and its
 * numbers stay in the save where the office keeps them; what comes out of here
 * is only what an actor could work out from how they have been treated —
 * whether the office calls, how many times they have been in, and for what.
 */
export function officeBook(sim: Simulation) {
  return Object.values(sim.universe.castingOffices ?? {})
    .map((standing) => {
      const record = CASTING_DIRECTOR_BY_ID[standing.castingDirectorId];
      const recent = standing.sessions[standing.sessions.length - 1];
      return {
        // Everything on this except the private notes, which nobody shows you.
        standing: {
          castingDirectorId: standing.castingDirectorId,
          seen: standing.seen,
          roomsHeld: standing.roomsHeld,
          list: standing.list,
          firstSeenAt: standing.firstSeenAt,
          lastSeenAt: standing.lastSeenAt,
          broughtInDirectly: standing.broughtInDirectly,
          booked: standing.booked,
        },
        name: record?.name ?? standing.castingDirectorId,
        office: record?.office ?? '',
        where: record?.where ?? '',
        knownFor: record?.knownFor ?? '',
        // What the player can tell: how it has gone, not the number behind it.
        howItStands: standing.list === 'favourite' ? 'They bring you in without being asked.'
          : standing.list === 'shortlist' ? 'You are on their list. They know your work.'
            : standing.list === 'watching' ? 'They know who you are.'
              : 'They have seen you. That is all you can say.',
        // What you were in for, and when. Not what they wrote about it.
        lastSeen: recent
          ? { at: recent.at, projectTitle: recent.projectTitle, characterName: recent.characterName }
          : undefined,
      };
    })
    .sort((a, b) => b.standing.lastSeenAt - a.standing.lastSeenAt);
}

/** What the player is shown instead of the office's private numbers. */
export const PILE_LABEL: Readonly<Record<SessionRead['pile'], string>> = {
  yes: 'Yes',
  maybe: 'Maybe',
  no: 'No',
  wrong_for_this: 'Wrong For This One',
};

