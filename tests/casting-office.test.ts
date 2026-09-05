/**
 * What the office made of you, and what any of it you actually get told.
 *
 * A casting office decides five things about somebody in the twenty seconds
 * after the door shuts, types one line next to their name, and files it. None
 * of that goes to the actor. Some of it comes back days later through their
 * agent, in whatever words the agent picks, and an actor with no agent mostly
 * hears nothing at all — which is the truest part of the whole system.
 *
 * What lasts is the relationship. These tests hold the office to that: it
 * remembers, it moves slowly, it starts calling you in once it likes you, and
 * it never tells you a number.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Audition, Id } from '@/engine/domain/model';
import { MS_DAY } from '@/engine/core/time';
import { CASTING_DIRECTOR_BY_ID, workingCastingDirectors } from '@/engine/content/casting-people';
import {
  PILE_LABEL, gradesFor, officeBook, officeStanding, officesThatWouldCall, readSession, recordSession,
} from '@/engine/systems/casting-office';
import { BREAKDOWNS_OPEN } from '@/engine/systems/casting';

interface Staged {
  sim: Simulation;
  auditionId: Id;
  roleId: Id;
  run: <R>(kind: string, payload?: Record<string, unknown>) => R;
}

function anAudition(seed: string, options: { strong?: boolean } = {}): Staged {
  const sim = quickSave({ wealth: 'inherited' }, seed);
  const run = <R>(kind: string, payload: Record<string, unknown> = {}): R => {
    const result = sim.execute<R>({ kind, payload });
    if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
    return result.value as R;
  };
  sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
  if (options.strong) run('sandbox.max_attributes', {});
  const staged = run<{ auditionId: Id; roleId: Id }>('sandbox.stage_audition', {});
  return { sim, auditionId: staged.auditionId, roleId: staged.roleId, run };
}

/** Walks the whole room, choosing by a rule, and returns the finished audition. */
function playRoom(s: Staged, pick: (choices: { id: string }[], beat: string) => string): Audition {
  const first = s.run<{ beat: string; choices: { id: string }[] }>('cast.enter_room', { auditionId: s.auditionId, prepHours: 6 });
  let current: { beat: string; choices: { id: string }[] } | undefined = first;
  let guard = 0;
  while (current && guard++ < 20) {
    const result: { done: boolean; next?: { beat: string; choices: { id: string }[] } } = s.run('cast.play_beat', {
      auditionId: s.auditionId, choiceId: pick(current.choices, current.beat),
    });
    if (result.done) break;
    current = result.next;
  }
  return s.sim.universe.auditions[s.auditionId]!;
}

/** The best available choice at every beat, which is how a good room goes. */
const best = (choices: { id: string }[]) => choices[0]!.id;
/** The worst available, which is how a bad one goes. */
const worst = (choices: { id: string }[]) => choices[choices.length - 1]!.id;

describe('the office reads the session', () => {
  it('has a real casting office behind every part that goes out', () => {
    const s = anAudition('office-real');
    const audition = s.sim.universe.auditions[s.auditionId]!;
    const project = s.sim.universe.projects[audition.projectId]!;
    expect(project.castingOfficeId).toBeTruthy();
    const record = CASTING_DIRECTOR_BY_ID[project.castingOfficeId!];
    expect(record).toBeDefined();
    // Somebody who was actually alive and working when this room happened.
    // Not every one of them has a birth year on the public record, and a
    // record without one is not a record with one invented.
    const year = new Date(s.sim.now).getUTCFullYear();
    if (record!.born !== undefined) expect(record!.born).toBeLessThanOrEqual(year - 18);
    if (record!.died !== undefined) expect(record!.died).toBeGreaterThanOrEqual(year);
    expect(record!.qid).toMatch(/^Q\d+$/);
    expect(workingCastingDirectors(year).map((c) => c.id)).toContain(record!.id);
  });

  it('reads five axes off what actually happened in the room', () => {
    const s = anAudition('office-axes', { strong: true });
    const audition = playRoom(s, best);
    const read = audition.sessionRead;
    expect(read).toBeDefined();
    for (const axis of ['right', 'read', 'direction', 'inTheRoom', 'bringBack'] as const) {
      expect(read![axis]).toBeGreaterThanOrEqual(0);
      expect(read![axis]).toBeLessThanOrEqual(100);
      expect(Number.isInteger(read![axis])).toBe(true);
    }
    expect(Object.keys(PILE_LABEL)).toContain(read!.pile);
    expect(read!.note.length).toBeGreaterThan(3);
  });

  it('files the session in that office’s own notes, not in the actor’s', () => {
    const s = anAudition('office-files', { strong: true });
    const audition = playRoom(s, best);
    const officeId = s.sim.universe.projects[audition.projectId]!.castingOfficeId!;
    const standing = s.sim.universe.castingOffices?.[officeId];
    expect(standing).toBeDefined();
    expect(standing!.seen).toBe(1);
    expect(standing!.roomsHeld).toBe(1);
    expect(standing!.sessions).toHaveLength(1);
    expect(standing!.sessions[0]!.read.note).toBe(audition.sessionRead!.note);
  });

  it('puts a good room in a better pile than a bad one', () => {
    const good = playRoom(anAudition('office-good', { strong: true }), best);
    const bad = playRoom(anAudition('office-bad'), worst);
    expect(good.sessionRead!.read).toBeGreaterThan(bad.sessionRead!.read);
    expect(good.sessionRead!.bringBack).toBeGreaterThan(bad.sessionRead!.bringBack);
  });

  it('reads a walk-out as a no however good the work was', () => {
    const s = anAudition('office-walkout', { strong: true });
    s.run('cast.enter_room', { auditionId: s.auditionId, prepHours: 8 });
    s.run('cast.leave_room', { auditionId: s.auditionId });
    const audition = s.sim.universe.auditions[s.auditionId]!;
    expect(audition.room?.walkedOut).toBe(true);
    const read = readSession(s.sim, audition);
    expect(read.pile).toBe('no');
    expect(read.inTheRoom).toBeLessThan(10);
  });

  it('does not record anybody but the player, because the player is not told about them', () => {
    const s = anAudition('office-others', { strong: true });
    playRoom(s, best);
    const officeId = s.sim.universe.projects[s.sim.universe.auditions[s.auditionId]!.projectId]!.castingOfficeId!;
    const others = Object.values(s.sim.universe.auditions).filter((a) => !a.isPlayer);
    expect(others.length).toBeGreaterThan(0);
    for (const other of others) {
      expect(other.sessionRead).toBeUndefined();
      expect(other.relayedFeedback).toBeUndefined();
    }
    expect(s.sim.universe.castingOffices![officeId]!.sessions).toHaveLength(1);
  });
});

describe('what comes back, and through whom', () => {
  it('never reaches the player before the office has answered about the part', () => {
    const s = anAudition('office-order', { strong: true });
    playRoom(s, best);
    const pending = s.sim.timeline.pending().filter((i) => i.refId === s.auditionId);
    const answer = pending.find((i) => i.kind === 'cast.office_response');
    const feedback = pending.find((i) => i.kind === 'cast.feedback');
    expect(answer).toBeDefined();
    expect(feedback).toBeDefined();
    expect(feedback!.at).toBeGreaterThanOrEqual(answer!.at);
  });

  it('answers about the part at all after a room that was played out', () => {
    // The room cancels its own appointment, so without this the player reads
    // for something and never hears another word about it.
    const s = anAudition('office-answers', { strong: true });
    playRoom(s, best);
    s.sim.advanceTo(s.sim.now + 30 * MS_DAY);
    const audition = s.sim.universe.auditions[s.auditionId]!;
    expect(audition.officeResponse ?? audition.decidedAt).toBeTruthy();
  });

  it('relays it in words, with no number anywhere in it', () => {
    const s = anAudition('office-words', { strong: true });
    playRoom(s, best);
    s.sim.advanceTo(s.sim.now + 40 * MS_DAY);
    const relayed = s.sim.universe.auditions[s.auditionId]!.relayedFeedback;
    expect(relayed).toBeDefined();
    for (const grade of relayed!.grades ?? []) {
      expect(grade.grade).not.toMatch(/\d/);
      expect(grade.label).not.toMatch(/\d/);
    }
    expect(relayed!.body).not.toMatch(/\b\d{1,3} out of 100\b/);
  });

  it('gives a blunt agent the whole card and a kind one only part of it', () => {
    const read = { right: 30, read: 40, direction: 45, inTheRoom: 55, bringBack: 38, pile: 'no' as const, note: 'Not for this.' };
    expect(gradesFor(read, true)).toHaveLength(5);
    expect(gradesFor(read, false).length).toBeLessThan(5);
    // Good news is relayed in full, because there is nothing to protect anybody from.
    const strong = { ...read, pile: 'yes' as const, read: 88 };
    expect(gradesFor(strong, false)).toHaveLength(5);
  });

  it('leaves an actor with no agent hearing nothing, most of the time', () => {
    let silent = 0;
    let heard = 0;
    for (let i = 0; i < 24; i++) {
      const s = anAudition(`office-silence-${i}`, { strong: true });
      expect(s.sim.player.representation.agencyName).toBeUndefined();
      playRoom(s, best);
      s.sim.advanceTo(s.sim.now + 45 * MS_DAY);
      const relayed = s.sim.universe.auditions[s.auditionId]!.relayedFeedback;
      if (!relayed || relayed.from === 'Nobody') silent++; else heard++;
    }
    expect(silent + heard).toBe(24);
    expect(silent).toBeGreaterThan(heard);
  });

  it('never relays feedback for a session the office never had', () => {
    const s = anAudition('office-nosession');
    const audition = s.sim.universe.auditions[s.auditionId]!;
    expect(audition.sessionRead).toBeUndefined();
    s.sim.advanceTo(s.sim.now + 45 * MS_DAY);
    // The appointment may run itself and be scored, but nothing is relayed
    // from a room that was never played.
    const pending = s.sim.timeline.pending().some((i) => i.kind === 'cast.feedback' && i.refId === s.auditionId);
    if (!audition.sessionRead) expect(pending).toBe(false);
  });
});

describe('chasing them for an answer', () => {
  it('refuses when there is nothing to chase', () => {
    const s = anAudition('chase-nothing');
    const refused = s.sim.execute({ kind: 'cast.chase_feedback', payload: { auditionId: s.auditionId } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/not seen you/i);
  });

  it('pulls the answer forward', () => {
    const s = anAudition('chase-pulls', { strong: true });
    playRoom(s, best);
    const before = s.sim.timeline.pending().find((i) => i.kind === 'cast.feedback' && i.refId === s.auditionId)!;
    const wasAt = before.at;
    const result = s.run<{ chased: boolean; expectedInDays: number }>('cast.chase_feedback', { auditionId: s.auditionId });
    expect(result.chased).toBe(true);
    expect(result.expectedInDays).toBeGreaterThanOrEqual(1);
    const after = s.sim.timeline.pending().find((i) => i.kind === 'cast.feedback' && i.refId === s.auditionId)!;
    expect(after.at).toBeLessThanOrEqual(wasAt);
  });

  it('costs an unrepresented actor something the first time, and everybody by the second', () => {
    const s = anAudition('chase-costs', { strong: true });
    const audition = playRoom(s, best);
    const officeId = s.sim.universe.projects[audition.projectId]!.castingOfficeId!;
    const before = s.sim.universe.castingOffices![officeId]!.regard;
    // No agent: ringing a casting office about yourself is already a mark.
    expect(s.sim.player.representation.agencyName).toBeUndefined();
    s.run('cast.chase_feedback', { auditionId: s.auditionId });
    const once = s.sim.universe.castingOffices![officeId]!.regard;
    expect(once).toBeLessThan(before);
    expect(s.sim.universe.castingOffices![officeId]!.chasedAt).toHaveLength(1);
  });

  it('will not be chased twice for the same answer', () => {
    const s = anAudition('chase-twice', { strong: true });
    playRoom(s, best);
    s.run('cast.chase_feedback', { auditionId: s.auditionId });
    s.sim.advanceTo(s.sim.now + 60 * MS_DAY);
    const refused = s.sim.execute({ kind: 'cast.chase_feedback', payload: { auditionId: s.auditionId } });
    expect(refused.ok).toBe(false);
    // Either it has already come back, or there was never anything outstanding.
    expect(refused.error).toMatch(/already come back|no answer outstanding/i);
  });

  it('is refused on somebody else’s audition', () => {
    const s = anAudition('chase-others', { strong: true });
    playRoom(s, best);
    const other = Object.values(s.sim.universe.auditions).find((a) => !a.isPlayer)!;
    const refused = s.sim.execute({ kind: 'cast.chase_feedback', payload: { auditionId: other.id } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/not your audition/i);
  });

  it('leaves the world untouched when it is refused', () => {
    const s = anAudition('chase-atomic', { strong: true });
    const audition = playRoom(s, best);
    const officeId = s.sim.universe.projects[audition.projectId]!.castingOfficeId!;
    const before = JSON.stringify(s.sim.universe.castingOffices![officeId]);
    s.sim.execute({ kind: 'cast.chase_feedback', payload: { auditionId: 'audition-nope' } });
    expect(JSON.stringify(s.sim.universe.castingOffices![officeId])).toBe(before);
  });
});

describe('the relationship, which is the point', () => {
  it('moves slowly: one room does not make you a favourite', () => {
    const s = anAudition('office-slow', { strong: true });
    playRoom(s, best);
    const officeId = s.sim.universe.projects[s.sim.universe.auditions[s.auditionId]!.projectId]!.castingOfficeId!;
    const standing = s.sim.universe.castingOffices![officeId]!;
    expect(standing.list).not.toBe('favourite');
    expect(standing.regard).toBeLessThanOrEqual(61);
  });

  it('climbs on good sessions and falls on bad ones', () => {
    const s = anAudition('office-climb', { strong: true });
    const audition = playRoom(s, best);
    const officeId = s.sim.universe.projects[audition.projectId]!.castingOfficeId!;
    const standing = s.sim.universe.castingOffices![officeId]!;
    const after = standing.regard;

    // Four more strong sessions with the same office.
    for (let i = 0; i < 4; i++) recordSession(s.sim, audition, { ...audition.sessionRead!, bringBack: 92 });
    expect(s.sim.universe.castingOffices![officeId]!.regard).toBeGreaterThan(after);
    expect(s.sim.universe.castingOffices![officeId]!.list).toBe('favourite');

    // And back down again on bad ones.
    for (let i = 0; i < 8; i++) recordSession(s.sim, audition, { ...audition.sessionRead!, bringBack: 4 });
    expect(s.sim.universe.castingOffices![officeId]!.regard).toBeLessThan(45);
    expect(s.sim.universe.castingOffices![officeId]!.list).toBe('unknown');
  });

  it('starts calling you in once it likes you', () => {
    const s = anAudition('office-calls', { strong: true });
    const audition = playRoom(s, best);
    const officeId = s.sim.universe.projects[audition.projectId]!.castingOfficeId!;
    expect(officesThatWouldCall(s.sim)).toHaveLength(0);
    for (let i = 0; i < 4; i++) recordSession(s.sim, audition, { ...audition.sessionRead!, bringBack: 95 });
    const calling = officesThatWouldCall(s.sim);
    expect(calling.map((c) => c.castingDirectorId)).toContain(officeId);
  });

  it('counts a booking for far more than a good room', () => {
    const s = anAudition('office-books', { strong: true });
    const audition = playRoom(s, best);
    const officeId = s.sim.universe.projects[audition.projectId]!.castingOfficeId!;
    const before = s.sim.universe.castingOffices![officeId]!.regard;
    s.sim.emit('cast.role_filled', {
      roleId: audition.roleId, projectId: audition.projectId, personId: s.sim.universe.playerId, fee: 100000, billing: 'supporting',
    });
    const standing = s.sim.universe.castingOffices![officeId]!;
    expect(standing.booked).toBe(1);
    expect(standing.regard).toBe(Math.min(100, before + 14));
  });

  it('keeps the office’s private notes and its number out of what the screen gets', () => {
    const s = anAudition('office-book-view', { strong: true });
    playRoom(s, best);
    const officeId = s.sim.universe.projects[s.sim.universe.auditions[s.auditionId]!.projectId]!.castingOfficeId!;
    const kept = s.sim.universe.castingOffices![officeId]!;
    const book = officeBook(s.sim);
    expect(book).toHaveLength(1);
    const entry = book[0]!;
    expect(entry.name).toBeTruthy();
    expect(entry.howItStands).not.toMatch(/\d/);

    // Nothing the office wrote, and no score of any kind, survives the trip
    // out to the screen. This is the whole reason officeBook exists.
    const rendered = JSON.stringify(entry);
    expect(rendered).not.toContain(kept.sessions[0]!.read.note);
    expect(rendered).not.toContain('regard');
    expect(rendered).not.toContain('bringBack');
    expect(rendered).not.toContain('pile');
    expect(entry.lastSeen!.characterName).toBe(kept.sessions[0]!.characterName);
  });

  it('makes a standing out of nothing only once per office', () => {
    const s = anAudition('office-once', { strong: true });
    playRoom(s, best);
    const officeId = s.sim.universe.projects[s.sim.universe.auditions[s.auditionId]!.projectId]!.castingOfficeId!;
    const first = officeStanding(s.sim, officeId);
    const second = officeStanding(s.sim, officeId);
    expect(second).toBe(first);
    expect(Object.keys(s.sim.universe.castingOffices!)).toHaveLength(1);
  });
});

describe('the whole thing holds together', () => {
  it('is open for business', () => {
    expect(BREAKDOWNS_OPEN).toBe(true);
  });

  it('survives a save and a load with the standings intact', () => {
    const s = anAudition('office-save', { strong: true });
    playRoom(s, best);
    const officeId = s.sim.universe.projects[s.sim.universe.auditions[s.auditionId]!.projectId]!.castingOfficeId!;
    const before = s.sim.universe.castingOffices![officeId]!;
    const round = JSON.parse(JSON.stringify(s.sim.universe)) as typeof s.sim.universe;
    expect(validateUniverse(round).ok).toBe(true);
    expect(round.castingOffices![officeId]!.regard).toBe(before.regard);
    expect(round.castingOffices![officeId]!.sessions[0]!.read.pile).toBe(before.sessions[0]!.read.pile);
  });

  it('every pile has a label, and every label is Title Case', () => {
    for (const [pile, label] of Object.entries(PILE_LABEL)) {
      expect(pile).toBeTruthy();
      for (const word of label.split(' ')) {
        expect(word[0]).toBe(word[0]!.toUpperCase());
      }
    }
  });
});
