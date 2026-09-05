/**
 * SLATE — being in the room.
 *
 * An audition you attend is played out rather than rolled for. You wait in a
 * corridor with the four other people up for it, you walk in, you see exactly
 * who is behind the table, and then you make a decision at every beat: how to
 * come in, how to play it, what to do with the note, what to say when they ask
 * what else you have on, and how to leave.
 *
 * Everybody in the room forms their own opinion, and they are watching for
 * different things. The director wants a performance that changes when it is
 * asked to. The producer wants somebody who will not be a problem at hour
 * thirteen. The network wants a face an audience will follow for six years.
 * The reader wants to go home. The same read lands differently depending on
 * who is sitting there, which is the truest thing about auditioning.
 *
 * What comes out of it is one round on the audition, scored the way every
 * other round is scored, so the decision that follows is the same decision
 * that was always being made.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type {
  Audition, AuditionRoomState, Id, Person, Project, Role, RoomOccupant,
} from '../domain/model';
import { clamp, remap } from '../core/rng';
import type { Rng } from '../core/rng';
import { MS_MINUTE } from '../core/time';
import { effectiveAttributes, systemModifier } from '../domain/attributes';
import { readiness } from './life';
import {
  CASTING_STAGE_BY_ID, ROOM_SEAT_BY_ID, type CastingStageId, type RoomSeatId,
} from '../content/casting-industry';
import {
  ADJUSTMENTS, BEAT_BY_ID, ROOM_VERDICTS, WAITING_ROOM_LINES,
  type Beat, type BeatChoice,
} from '../content/audition-beats';
import { CASTING_DIRECTOR_BY_ID, castingDirectorsIn, workingCastingDirectors } from '../content/casting-people';
import {
  afterReadFor, goodbyeFor, greetingFor, noteFor, readerLineFor, registerFor,
  roomNoiseFor, sceneFrameFor, settleFor, smallTalkFor,
} from '../content/room-dialogue';
import { generatePersonName } from '../content/names';
import { grantProfessionXp } from './professions';
import { REAL_CEILING, godMode, logOverride } from './sandbox';

// ---------------------------------------------------------------------------
// Filling the chairs
// ---------------------------------------------------------------------------

/** What each chair is called to somebody standing in front of it. */
function titleOf(seat: RoomSeatId): string {
  return ROOM_SEAT_BY_ID[seat].name;
}

/**
 * Who is actually in the room.
 *
 * The stage decides which chairs exist. The picture decides who is in them:
 * its own director, its producers, the studio behind it, the actor already
 * cast. The casting office is a real one, working in the city the picture is
 * casting in, and the same office keeps coming back — which is how a career
 * in this business is actually built.
 */
export function fillRoom(
  sim: Simulation, role: Role, project: Project, stage: CastingStageId, rng: Rng,
): RoomOccupant[] {
  const spec = CASTING_STAGE_BY_ID[stage];
  const occupants: RoomOccupant[] = [];
  const year = new Date(sim.now).getUTCFullYear();

  const add = (seat: RoomSeatId, name: string, extra: Partial<RoomOccupant> = {}) => {
    occupants.push({
      seat, name, title: titleOf(seat),
      watchingFor: ROOM_SEAT_BY_ID[seat].watchingFor,
      sway: ROOM_SEAT_BY_ID[seat].sway,
      impression: 50,
      notes: [],
      ...extra,
    });
  };

  for (const seat of spec.room) {
    switch (seat) {
      case 'casting_director': {
        const office = castingOfficeFor(sim, project, role, year, rng);
        if (office) add(seat, office.name, { castingDirectorId: office.id });
        else add(seat, generatedName(rng));
        break;
      }
      case 'director': {
        const person = project.directorId ? sim.universe.people[project.directorId] : undefined;
        if (person && !person.isPlayer) add(seat, person.stageName ?? person.displayName, { personId: person.id });
        else if (!person) add(seat, generatedName(rng));
        break;
      }
      case 'producer': {
        const attachment = project.attachments.find((a) => a.role === 'producer' && a.confirmed);
        const person = attachment ? sim.universe.people[attachment.personId] : undefined;
        add(seat, person && !person.isPlayer ? (person.stageName ?? person.displayName) : generatedName(rng), person && !person.isPlayer ? { personId: person.id } : {});
        break;
      }
      case 'writer': {
        const attachment = project.attachments.find((a) => a.role === 'writer' && a.confirmed);
        const person = attachment ? sim.universe.people[attachment.personId] : undefined;
        add(seat, person && !person.isPlayer ? (person.stageName ?? person.displayName) : generatedName(rng), person && !person.isPlayer ? { personId: person.id } : {});
        break;
      }
      case 'showrunner': {
        const attachment = project.attachments.find((a) => a.role === 'showrunner' && a.confirmed);
        const person = attachment ? sim.universe.people[attachment.personId] : undefined;
        // A showrunner only sits in a room on a series.
        if (project.format !== 'series' && project.format !== 'limited_series') break;
        add(seat, person && !person.isPlayer ? (person.stageName ?? person.displayName) : generatedName(rng), person && !person.isPlayer ? { personId: person.id } : {});
        break;
      }
      case 'attached_lead': {
        const lead = project.castIds.map((id) => sim.universe.people[id]).find((p): p is Person => Boolean(p) && !p!.isPlayer);
        if (lead) add(seat, lead.stageName ?? lead.displayName, { personId: lead.id });
        break;
      }
      default:
        add(seat, generatedName(rng));
        break;
    }
  }
  return occupants;
}

function generatedName(rng: Rng): string {
  const name = generatePersonName(rng);
  return `${name.first} ${name.last}`;
}

/**
 * The office running this picture's casting.
 *
 * A real one, working in the city it casts in and alive to see it. Once a
 * picture has an office it keeps it, so the same casting director sees you
 * across a career and remembers.
 */
export function castingOfficeFor(
  sim: Simulation, project: Project, role: Role, year: number, rng: Rng,
): { id: string; name: string } | undefined {
  void role;
  const existing = project.castingOfficeId ? CASTING_DIRECTOR_BY_ID[project.castingOfficeId] : undefined;
  if (existing) return { id: existing.id, name: existing.name };
  const city = project.productionLocationIds[0] ?? sim.player.currentLocationId;
  const local = castingDirectorsIn(city, { year });
  const pool = local.length > 0 ? local : workingCastingDirectors(year);
  if (pool.length === 0) return undefined;
  const chosen = pool[rng.int(0, pool.length - 1)]!;
  project.castingOfficeId = chosen.id;
  return { id: chosen.id, name: chosen.name };
}

// ---------------------------------------------------------------------------
// Which beats this room runs
// ---------------------------------------------------------------------------

/** The beats a given room actually has in it. */
export function beatsFor(stage: CastingStageId, options: { taped: boolean; sidesChanged: boolean; directorPresent: boolean; secondRead: boolean }): string[] {
  const beats: string[] = ['waiting'];
  if (options.sidesChanged) beats.push('sides_change');
  beats.push('walk_in');
  if (options.taped) beats.push('slate');
  beats.push('first_read');
  if (options.directorPresent) beats.push('adjustment');
  if (options.secondRead) beats.push('second_read');
  beats.push('room_talk', 'walk_out');
  void stage;
  return beats;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerAuditionRoom(sim: Simulation): void {
  sim.onCommand<{ auditionId: Id; prepHours?: number }, { beat: string; name: string; what: string; choices: { id: string; label: string; detail: string }[]; room: { name: string; title: string; watchingFor: string }[]; nerves: number }>(
    'cast.enter_room',
    (p, { sim: s }) => {
      const audition = s.universe.auditions[p.auditionId];
      if (!audition) throw new CommandError('No such audition.');
      if (!audition.isPlayer) throw new CommandError('That is not your audition.');
      if (audition.decidedAt) throw new CommandError('That one is already decided.');
      if (audition.room && !audition.room.finishedAt) return currentBeat(s, audition);
      if (audition.room?.finishedAt) throw new CommandError('You have already been in that room.');
      if (audition.format === 'self_tape' || audition.stage === 'self_tape') {
        throw new CommandError('That one is a tape. There is no room to walk into.');
      }
      const role = s.universe.roles[audition.roleId];
      const project = s.universe.projects[audition.projectId];
      if (!role || !project) throw new CommandError('That part is gone.');
      if (audition.locationId && s.player.currentLocationId !== audition.locationId) {
        throw new CommandError('The room is in another city and you are not in it. Get there first.');
      }

      // The hours you put into it before you got here. They are spent before
      // the door opens, and they are in the room with you at every beat.
      const prepHours = clamp(Math.round(p.prepHours ?? 0), 0, 24);
      if (prepHours > 0) {
        if (s.player.wellbeing.energy < 8) throw new CommandError('You are too tired to prepare. Go in cold or sleep first.');
        s.advanceTo(s.now + prepHours * 60 * 60 * 1000);
        s.player.wellbeing.energy = clamp(s.player.wellbeing.energy - prepHours * 3, 0, 100);
        s.player.attributes['preparation'] = clamp((s.player.attributes['preparation'] ?? 20) + prepHours * 0.12, 0, 100);
      }

      const rng = s.rng('room', audition.id);
      const stage: CastingStageId = audition.stage === 'callback' ? 'callback'
        : audition.stage === 'screen_test' ? 'screen_test'
          : audition.stage === 'chemistry_read' ? 'chemistry_read'
            : 'first_read';
      const occupants = fillRoom(s, role, project, stage, rng);
      const directorPresent = occupants.some((o) => o.seat === 'director' || o.seat === 'showrunner');
      const taped = rng.chance(0.8);
      const sidesChanged = rng.chance(0.18);
      const room: AuditionRoomState = {
        stage,
        occupants,
        beats: beatsFor(stage, { taped, sidesChanged, directorPresent, secondRead: rng.chance(0.45) }),
        index: 0,
        nerves: clamp(startingNerves(s, occupants) - prepHours * 1.8, 0, 100),
        taped,
        hasReader: occupants.some((o) => o.seat === 'reader'),
        readerQuality: rng.int(20, 95),
        sidesChanged,
        otherActors: rng.int(2, 7),
        waitingRoomLine: WAITING_ROOM_LINES[rng.int(0, WAITING_ROOM_LINES.length - 1)]!,
        played: [],
        prepHours,
        startedAt: s.now,
      };
      // How this room talks. A horror room does not sound like a comedy room,
      // and the note a director gives is written for the picture it is for.
      const register = registerFor(project.genres);
      room.register = register;
      room.greeting = greetingFor(rng);
      room.settle = settleFor(rng);
      room.sceneFrame = sceneFrameFor(register, rng);
      room.readerLine = readerLineFor(room.readerQuality);
      room.smallTalk = smallTalkFor(rng);
      room.goodbye = goodbyeFor(rng);
      if (directorPresent) {
        room.adjustment = noteFor(register, rng);
        room.adjustmentTests = ADJUSTMENTS[rng.int(0, ADJUSTMENTS.length - 1)]!.tests;
      }
      audition.room = room;
      s.emit('cast.room_entered', { auditionId: audition.id, roleId: role.id, stage, seats: occupants.length });
      return currentBeat(s, audition);
    },
  );

  sim.onCommand<
    { auditionId: Id; choiceId: string },
    { score: number; note: string; said?: string; reactions: { name: string; note: string; delta: number }[]; done: boolean; verdict?: { score: number; line: string }; next?: { beat: string; name: string; what: string; choices: { id: string; label: string; detail: string }[] } }
  >(
    'cast.play_beat',
    (p, { sim: s }) => {
      const audition = s.universe.auditions[p.auditionId];
      if (!audition?.isPlayer) throw new CommandError('That is not your audition.');
      const room = audition.room;
      if (!room || room.finishedAt) throw new CommandError('You are not in that room.');
      const beatId = room.beats[room.index];
      if (!beatId) throw new CommandError('That room is finished.');
      const beat = BEAT_BY_ID[beatId as keyof typeof BEAT_BY_ID];
      if (!beat) throw new CommandError('No such beat.');
      const choice = choicesFor(beat, room).find((c) => c.id === p.choiceId);
      if (!choice) throw new CommandError('That is not something you can do here.');

      const result = playBeat(s, audition, room, beat, choice);
      room.index += 1;
      const done = room.index >= room.beats.length;
      if (done) finishRoom(s, audition, room);
      return {
        score: result.score,
        note: result.note,
        said: result.said,
        reactions: result.reactions,
        done,
        verdict: room.verdict,
        next: done ? undefined : beatPayload(room),
      };
    },
  );

  sim.onCommand<{ auditionId: Id }, { verdict: { score: number; line: string } }>(
    'cast.leave_room',
    (p, { sim: s }) => {
      const audition = s.universe.auditions[p.auditionId];
      if (!audition?.isPlayer) throw new CommandError('That is not your audition.');
      const room = audition.room;
      if (!room || room.finishedAt) throw new CommandError('You are not in that room.');
      // Walking out of an audition is a thing people do, and it is remembered.
      room.walkedOut = true;
      for (const occupant of room.occupants) {
        occupant.impression = clamp(occupant.impression - 22, 0, 100);
        occupant.notes.push({ at: s.now, beat: 'walk_out', note: 'They left in the middle of it.', delta: -22 });
      }
      finishRoom(s, audition, room);
      s.player.reputation.reliability = clamp(s.player.reputation.reliability - 6, 0, 100);
      return { verdict: room.verdict! };
    },
  );
}

// ---------------------------------------------------------------------------
// The room, working
// ---------------------------------------------------------------------------

/** How wound up you are before anybody has said anything. */
function startingNerves(sim: Simulation, occupants: RoomOccupant[]): number {
  const pressure = occupants.reduce((sum, o) => sum + (ROOM_SEAT_BY_ID[o.seat as RoomSeatId]?.pressure ?? 0), 0);
  const player = sim.player;
  const sheet = effectiveAttributes(player.attributes, player.traits);
  const steady = ((sheet['pressure_tolerance'] ?? 35) + (sheet['screen_test_composure'] ?? 30) + (sheet['audition_technique'] ?? 25)) / 3;
  return clamp(Math.round(20 + pressure * 14 - steady * 0.45), 0, 100);
}

/** The choices this room actually offers right now. */
export function choicesFor(beat: Beat, room: AuditionRoomState): BeatChoice[] {
  return beat.choices.filter((choice) => {
    switch (choice.requires) {
      case 'taped': return room.taped;
      case 'reader': return room.hasReader;
      case 'director_present': return room.occupants.some((o) => o.seat === 'director' || o.seat === 'showrunner');
      case 'other_actors': return room.otherActors > 0;
      case 'sides_changed': return room.sidesChanged;
      default: return true;
    }
  });
}

function beatPayload(room: AuditionRoomState) {
  const beatId = room.beats[room.index]!;
  const beat = BEAT_BY_ID[beatId as keyof typeof BEAT_BY_ID];
  return {
    beat: beatId,
    name: beat.name,
    what: beatId === 'waiting' ? `${beat.what} ${room.waitingRoomLine}`
      : beatId === 'adjustment' && room.adjustment ? `${beat.what} “${room.adjustment}”`
        : beat.what,
    choices: choicesFor(beat, room).map((c) => ({ id: c.id, label: c.label, detail: c.detail })),
  };
}

function currentBeat(_sim: Simulation, audition: Audition) {
  const room = audition.room!;
  return {
    ...beatPayload(room),
    room: room.occupants.map((o) => ({ name: o.name, title: o.title, watchingFor: o.watchingFor })),
    nerves: room.nerves,
  };
}

/**
 * One beat, played.
 *
 * What you did is scored on what it asks of you, dragged down by nerves and
 * pushed around by how brave it was. Then everybody in the room reads it
 * their own way: somebody who weighs the attributes it needed moves further
 * than somebody who does not care, and the seats that particularly love or
 * hate that choice move further still.
 */
function playBeat(
  sim: Simulation, audition: Audition, room: AuditionRoomState, beat: Beat, choice: BeatChoice,
): { score: number; note: string; said?: string; reactions: { name: string; note: string; delta: number }[] } {
  const player = sim.player;
  const sheet = effectiveAttributes(player.attributes, player.traits);
  const rng = sim.rng('beat', audition.id, beat.id, choice.id);

  // What the choice asked of you.
  const weights = Object.entries(choice.weighs);
  const totalWeight = weights.reduce((sum, [, w]) => sum + w, 0) || 1;
  // Preparation is not a stat you have, it is hours you put in, and the room
  // reads the sum of both.
  const prepared = clamp((sheet['preparation'] ?? 20) + (room.prepHours ?? 0) * 2.4, 0, 100);
  const craft = weights.reduce((sum, [id, w]) => sum + (id === 'preparation' ? prepared : sheet[id] ?? 20) * w, 0) / totalWeight;

  // Nerves cost you, and a brave choice swings further in both directions.
  const nervePenalty = remap(room.nerves, 0, 100, 0, 22);
  const ready = readiness(player);
  const variance = 6 + choice.risk * 22 * systemModifier(player.traits, 'auditionVariance');
  const score = clamp(craft * 0.72 + ready * 0.18 + 10 - nervePenalty + rng.normal(0, variance), 0, 100);

  // A flat reader makes everything harder, and there is nothing you can do.
  const readerDrag = beat.id === 'first_read' || beat.id === 'second_read'
    ? remap(room.readerQuality, 0, 100, -6, 2) : 0;
  const finalScore = clamp(score + readerDrag, 0, 100);

  room.nerves = clamp(room.nerves + choice.nerves + (finalScore > 65 ? -6 : finalScore < 40 ? 8 : 0), 0, 100);
  sim.advanceTo(sim.now + choice.minutes * MS_MINUTE);

  // Everybody reads it their own way.
  const reactions: { name: string; note: string; delta: number }[] = [];
  for (const occupant of room.occupants) {
    const seat = ROOM_SEAT_BY_ID[occupant.seat as RoomSeatId];
    if (!seat || seat.sway === 0) continue;
    // How much this chair cares about what the choice was made of.
    const care = Object.entries(choice.weighs).reduce((sum, [id, w]) => sum + (seat.weighs[id] ?? 0) * w, 0);
    const interest = clamp(0.35 + care * 2.2, 0.35, 1.4);
    const favour = choice.favouredBy?.[occupant.seat as RoomSeatId] ?? 0;
    const frown = choice.frownedOnBy?.[occupant.seat as RoomSeatId] ?? 0;
    const delta = Math.round(((finalScore - 50) / 5) * interest + favour - frown);
    if (delta === 0) continue;
    occupant.impression = clamp(occupant.impression + delta, 0, 100);
    const note = reactionNote(sim, occupant, delta, choice, beat.id, audition.id);
    occupant.notes.push({ at: sim.now, beat: beat.id, note, delta });
    reactions.push({ name: occupant.name, note, delta });
  }

  const note = beatNote(sim, beat, choice, finalScore, room, audition.id);
  const said = spokenAt(beat, room, finalScore, rng);
  room.played.push({ beat: beat.id, choiceId: choice.id, label: choice.label, score: Math.round(finalScore), note, said, at: sim.now });

  // The room is practice, whatever else it is.
  player.attributes['audition_technique'] = clamp((player.attributes['audition_technique'] ?? 20) + 0.25, 0, 100);
  if (beat.id === 'adjustment') player.attributes['direction_absorption'] = clamp((player.attributes['direction_absorption'] ?? 20) + 0.4, 0, 100);

  sim.emit('cast.beat_played', { auditionId: audition.id, beat: beat.id, choiceId: choice.id, score: Math.round(finalScore) });
  return { score: Math.round(finalScore), note, said, reactions };
}

/**
 * What is actually said out loud at this beat.
 *
 * Composed for the kind of picture it is, so the same beat in a horror room
 * and a comedy room are two different rooms.
 */
function spokenAt(beat: Beat, room: AuditionRoomState, score: number, rng: Rng): string | undefined {
  switch (beat.id) {
    case 'waiting': return roomNoiseFor(rng);
    case 'walk_in': return room.greeting;
    case 'slate': return room.settle;
    case 'first_read': return `${room.sceneFrame ?? ''} ${afterReadFor(score, rng)}`.trim();
    case 'adjustment': return room.adjustment;
    case 'second_read': return afterReadFor(score, rng);
    case 'room_talk': return room.smallTalk;
    case 'walk_out': return room.goodbye;
    default: return undefined;
  }
}

/**
 * What one person behind the table visibly did, in four bands.
 *
 * Several of each for the same reason the beat notes have several: there are
 * up to eleven people in the room and nine beats to get through, so one line
 * per band would have the whole table doing the identical thing all afternoon.
 */
const REACTIONS: Readonly<Record<'up_strong' | 'up' | 'down_strong' | 'down', readonly string[]>> = {
  up_strong: [
    '{who} sat forward.',
    '{who} stopped writing and watched.',
    '{who} looked at the person next to them.',
    '{who} smiled at something you did and tried not to.',
    '{who} put the sheet down.',
    '{who} underlined something and circled it.',
    '{who} said “again” before you had finished, and meant it as a compliment.',
  ],
  up: [
    '{who} made a note.',
    '{who} nodded, once.',
    '{who} wrote something short next to your name.',
    '{who} looked up for the first time.',
    '{who} made a small sound of approval and went back to the page.',
    '{who} ticked something.',
  ],
  down_strong: [
    '{who} looked at the sheet in front of them instead of at you.',
    '{who} checked the time.',
    '{who} started reading the next name on the list.',
    '{who} crossed something out.',
    '{who} sat back and folded their arms.',
    '{who} looked at the door.',
  ],
  down: [
    '{who} did not react to {what}.',
    '{who} wrote nothing at all.',
    '{who} kept the same expression they came in with.',
    '{who} shifted in their seat.',
    '{who} was already thinking about the next one.',
  ],
};

function reactionNote(sim: Simulation, occupant: RoomOccupant, delta: number, choice: BeatChoice, beatId: string, auditionId: Id): string {
  const strong = Math.abs(delta) >= 7;
  const band = delta > 0 ? (strong ? 'up_strong' : 'up') : (strong ? 'down_strong' : 'down');
  const bank = REACTIONS[band];
  const line = bank[sim.rng('reaction', auditionId, beatId, occupant.name).int(0, bank.length - 1)]!;
  return line.replace('{who}', occupant.name).replace('{what}', choice.label.toLowerCase());
}

/**
 * How a beat felt, in the five bands a beat can land in.
 *
 * Several ways of saying each, because a room is nine beats long and an actor
 * having a good day would otherwise be told the same sentence nine times
 * running. Each is a tail on the choice the player made, so the line reads as
 * one sentence about one moment rather than a verdict pasted underneath it.
 */
const BEAT_TAILS: Readonly<Record<'best' | 'good' | 'flat' | 'poor' | 'bad', readonly string[]>> = {
  best: [
    'and it was the best thing you have done in a room this year.',
    'and the room went quiet in the way you want it to.',
    'and for a second nobody behind the table was taking notes.',
    'and it was better than it had ever been in your kitchen.',
    'and you knew it while it was happening, which almost never happens.',
    'and somebody behind the table sat forward.',
    'and it was the version of it you had been chasing all week.',
    'and there was nothing in it you would take back.',
  ],
  good: [
    'and it landed.',
    'and it did what it was supposed to do.',
    'and the room stayed with you the whole way through.',
    'and it was honest, which is most of it.',
    'and nothing in it got in its own way.',
    'and you got out of the scene’s way, which is harder than it sounds.',
    'and it held.',
  ],
  flat: [
    'Fine. Nobody in the room changed their mind either way.',
    'It was competent, and competent is not why anybody is in there.',
    'Nothing wrong with it. Nothing in it either.',
    'It went by. That is the whole review.',
    'Perfectly all right, which in a room of twelve people is not enough.',
    'Neither better nor worse than the last person through the door.',
  ],
  poor: [
    'and you felt it not working while you were doing it.',
    'and you could hear yourself doing it, which is the end of it.',
    'and you were a beat behind the whole way.',
    'and the version in your head never arrived.',
    'and you pushed, and pushing shows.',
    'and it stayed on the page.',
  ],
  bad: [
    'and it came apart.',
    'and there was no getting it back after that.',
    'and everybody in the room was politely waiting for it to end.',
    'and you lost the scene about four lines in.',
    'and it was the worst it has ever been, including the first time you read it.',
  ],
};

function beatNote(sim: Simulation, beat: Beat, choice: BeatChoice, score: number, room: AuditionRoomState, auditionId: Id): string {
  if (beat.id === 'first_read' && room.readerQuality < 40) {
    return score > 65
      ? 'The reader gave you nothing and you played it anyway.'
      : 'The reader was flat and it took the scene with it.';
  }
  const band = score > 78 ? 'best' : score > 62 ? 'good' : score > 45 ? 'flat' : score > 28 ? 'poor' : 'bad';
  const bank = BEAT_TAILS[band];
  const tail = bank[sim.rng('beat_note', auditionId, beat.id, String(room.index)).int(0, bank.length - 1)]!;
  // The flat band is written as its own sentence, because "X. Fine." reads
  // better than "X, and fine."
  return band === 'flat' ? `${choice.label}. ${tail}` : `${choice.label}, ${tail}`;
}

/**
 * The door shuts.
 *
 * The room's opinion is everybody's opinion, weighted by whose it is, and it
 * goes onto the audition as a round like any other — so the decision that
 * follows is made on the whole history, the way it always was.
 */
function finishRoom(sim: Simulation, audition: Audition, room: AuditionRoomState): void {
  room.finishedAt = sim.now;
  const weighted = room.occupants.filter((o) => o.sway > 0);
  const totalSway = weighted.reduce((sum, o) => sum + o.sway, 0) || 1;
  const honest = clamp(Math.round(weighted.reduce((sum, o) => sum + o.impression * o.sway, 0) / totalSway), 0, 100);
  // In god mode the room was never going to go any other way, and the log says
  // so. Everybody behind the table is put at the top of their own scale too,
  // so nothing downstream reads a room of doubters who somehow loved it.
  const cheated = godMode(sim);
  if (cheated) {
    for (const occupant of room.occupants) occupant.impression = 100;
    logOverride(sim, `The room could not have gone better. Without god mode it read ${honest}.`);
  }
  const score = cheated ? REAL_CEILING : honest;
  const line = cheated
    ? 'Nobody in that room has seen anything like it, and all of them said so.'
    : ROOM_VERDICTS.find((v) => honest >= v.floor)?.line ?? ROOM_VERDICTS[ROOM_VERDICTS.length - 1]!.line;
  room.verdict = { score, line };

  const stage = audition.stage === 'submitted' ? 'first_read' : audition.stage;
  audition.rounds ??= [];
  audition.rounds.push({
    stage: stage as Audition['stage'],
    at: sim.now,
    score,
    note: room.walkedOut ? 'They walked out of it.' : line,
  });
  audition.performanceScore = score;
  audition.totalScore = audition.rounds.reduce((sum, r) => sum + r.score, 0) / audition.rounds.length;

  const player = sim.player;
  player.wellbeing.energy = clamp(player.wellbeing.energy - 12, 0, 100);
  player.wellbeing.stress = clamp(player.wellbeing.stress + (room.walkedOut ? 14 : 7), 0, 100);
  grantProfessionXp(sim, player, 'creator', 0);

  const role = sim.universe.roles[audition.roleId];
  const project = sim.universe.projects[audition.projectId];
  sim.audit({
    kind: 'cast.room_held', subjectType: 'audition', subjectId: audition.id,
    question: 'How did that room go?',
    summary: cheated
      ? `${score} out of 100, given by sandbox. Without god mode it read ${honest}.`
      : `${score} out of 100. ${line}`,
    factors: room.occupants.filter((o) => o.sway > 0).map((o) => ({
      label: o.name,
      detail: `${o.title}. ${o.watchingFor} They left it at ${Math.round(o.impression)} out of 100.`,
      weight: o.sway,
      contribution: (o.impression / 100) * o.sway,
      knowable: false,
    })),
    score,
    outcome: cheated ? 'god mode' : score >= 70 ? 'strong' : score >= 50 ? 'mixed' : 'weak',
  });
  sim.remember({
    category: 'career',
    title: `Read for ${role?.characterName ?? 'a part'}`,
    detail: `${project?.title ?? 'A project'}. ${room.played.length} beats in the room with ${room.occupants.length} people. ${line}`,
    refs: role ? [{ type: 'role', id: role.id }] : [],
    significance: 30, public: false,
  });
  sim.resolveDecision('audition', audition.id);
  if (audition.scheduledItemId) sim.timeline.cancel(audition.scheduledItemId, sim.now);
  sim.emit('cast.room_finished', { auditionId: audition.id, score, walkedOut: room.walkedOut ?? false });
}

/** For the screen: the room as it stands, with nothing hidden that the player could see. */
export function roomView(sim: Simulation, auditionId: Id) {
  const audition = sim.universe.auditions[auditionId];
  const room = audition?.room;
  if (!audition || !room) return undefined;
  const beatId = room.beats[room.index];
  const beat = beatId ? BEAT_BY_ID[beatId as keyof typeof BEAT_BY_ID] : undefined;
  return {
    room,
    beat,
    // What is in front of you: who they are and what they are watching for.
    // Never their opinion of you, which is not something anybody can see.
    seats: room.occupants.map((o) => ({ name: o.name, title: o.title, watchingFor: o.watchingFor })),
    choices: beat ? choicesFor(beat, room) : [],
    finished: Boolean(room.finishedAt),
  };
}
