/**
 * Being in the room.
 *
 * You wait, you walk in, you see exactly who is behind the table, you make a
 * decision at every beat, and everybody in the room forms their own opinion.
 * What comes out is one round on the audition, scored the way every other
 * round is, so the decision that follows is the same decision it always was.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Audition, Id, Project, Role } from '@/engine/domain/model';
import { BEAT_BY_ID, BEATS } from '@/engine/content/audition-beats';
import { ROOM_SEAT_BY_ID } from '@/engine/content/casting-industry';
import { CASTING_DIRECTOR_BY_ID } from '@/engine/content/casting-people';
import { beatsFor, choicesFor, roomView } from '@/engine/systems/audition-room';

interface Staged {
  sim: Simulation;
  auditionId: Id;
  roleId: Id;
  run: <R>(kind: string, payload?: Record<string, unknown>) => R;
  try: <R>(kind: string, payload?: Record<string, unknown>) => { ok: boolean; error?: string; value?: R };
}

function anAudition(seed: string, options: { strong?: boolean; stage?: string } = {}): Staged {
  const sim = quickSave({ wealth: 'inherited' }, seed);
  const run = <R>(kind: string, payload: Record<string, unknown> = {}): R => {
    const result = sim.execute<R>({ kind, payload });
    if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
    return result.value as R;
  };
  const attempt = <R>(kind: string, payload: Record<string, unknown> = {}) => sim.execute<R>({ kind, payload });
  sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
  if (options.strong) run('sandbox.max_attributes', {});
  const staged = run<{ auditionId: Id; roleId: Id }>('sandbox.stage_audition', options.stage ? { stage: options.stage } : {});
  return { sim, auditionId: staged.auditionId, roleId: staged.roleId, run, try: attempt };
}

const roomOf = (s: Staged) => (s.sim.universe.auditions[s.auditionId] as Audition).room!;

/** Walks the whole room through, taking the first choice at every beat. */
function playThrough(s: Staged, pick: (choices: { id: string }[], beat: string) => string = (c) => c[0]!.id) {
  const first = s.run<{ beat: string; choices: { id: string }[] }>('cast.enter_room', { auditionId: s.auditionId });
  let current: { beat: string; choices: { id: string }[] } | undefined = first;
  let guard = 0;
  while (current && guard++ < 20) {
    const result: { done: boolean; next?: { beat: string; choices: { id: string }[] } } = s.run('cast.play_beat', {
      auditionId: s.auditionId, choiceId: pick(current.choices, current.beat),
    });
    if (result.done) break;
    current = result.next;
  }
  return roomOf(s);
}

describe('walking in', () => {
  it('puts real people in the chairs and tells you what each of them wants', () => {
    const staged = anAudition('room-1');
    const opened = staged.run<{ beat: string; room: { name: string; title: string; watchingFor: string }[]; nerves: number }>('cast.enter_room', { auditionId: staged.auditionId });
    expect(opened.beat).toBe('waiting');
    expect(opened.room.length).toBeGreaterThan(1);
    for (const seat of opened.room) {
      expect(seat.name.length).toBeGreaterThan(2);
      expect(seat.title.length).toBeGreaterThan(2);
      expect(seat.watchingFor.length).toBeGreaterThan(20);
    }
    // The office running it is a real one, and the picture keeps it.
    const room = roomOf(staged);
    const office = room.occupants.find((o) => o.seat === 'casting_director')!;
    expect(office).toBeDefined();
    if (office.castingDirectorId) {
      expect(CASTING_DIRECTOR_BY_ID[office.castingDirectorId]!.name).toBe(office.name);
      const project = staged.sim.universe.projects[(staged.sim.universe.roles[staged.roleId] as Role).projectId] as Project;
      expect(project.castingOfficeId).toBe(office.castingDirectorId);
    }
    expect(opened.nerves).toBeGreaterThanOrEqual(0);
    expect(opened.nerves).toBeLessThanOrEqual(100);
    // Nobody's opinion of you is on screen. It is not something you can see.
    expect(JSON.stringify(opened.room)).not.toMatch(/impression/);
  });

  it('runs the beats in the order a room runs them, and only the ones it has', () => {
    const staged = anAudition('room-2');
    staged.run('cast.enter_room', { auditionId: staged.auditionId });
    const room = roomOf(staged);
    expect(room.beats[0]).toBe('waiting');
    expect(room.beats[room.beats.length - 1]).toBe('walk_out');
    expect(room.beats).toContain('first_read');
    expect(room.beats.indexOf('walk_in')).toBeLessThan(room.beats.indexOf('first_read'));
    expect(room.beats.indexOf('first_read')).toBeLessThan(room.beats.indexOf('room_talk'));
    if (room.beats.includes('slate')) expect(room.taped).toBe(true);
    if (room.beats.includes('sides_change')) expect(room.sidesChanged).toBe(true);
    if (room.beats.includes('adjustment')) {
      expect(room.adjustment!.length).toBeGreaterThan(10);
      expect(room.occupants.some((o) => o.seat === 'director' || o.seat === 'showrunner')).toBe(true);
    }
    // Every beat named is a beat that exists, and no beat is run twice.
    expect(new Set(room.beats).size).toBe(room.beats.length);
    for (const id of room.beats) expect(BEAT_BY_ID[id as keyof typeof BEAT_BY_ID]).toBeDefined();
  });

  it('refuses a tape, a room in another city, and a room you have already been in', () => {
    const staged = anAudition('room-3');
    const audition = staged.sim.universe.auditions[staged.auditionId] as Audition;

    const was = audition.locationId;
    audition.locationId = 'uk-eng-london';
    const away = staged.try('cast.enter_room', { auditionId: staged.auditionId });
    expect(away.ok).toBe(false);
    expect(away.error).toMatch(/another city/i);
    audition.locationId = was;

    audition.format = 'self_tape';
    const tape = staged.try('cast.enter_room', { auditionId: staged.auditionId });
    expect(tape.ok).toBe(false);
    expect(tape.error).toMatch(/tape/i);
    audition.format = 'in_person';

    playThrough(staged);
    const again = staged.try('cast.enter_room', { auditionId: staged.auditionId });
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/already been/i);
  });
});

describe('playing it', () => {
  it('costs real time, moves your nerves, and writes down what you did', () => {
    const staged = anAudition('room-4');
    const before = staged.sim.now;
    const opened = staged.run<{ choices: { id: string }[] }>('cast.enter_room', { auditionId: staged.auditionId });
    const nervesBefore = roomOf(staged).nerves;
    const result = staged.run<{ score: number; note: string; reactions: { name: string; delta: number }[]; done: boolean }>('cast.play_beat', {
      auditionId: staged.auditionId, choiceId: opened.choices.find((c) => c.id === 'sit_still')?.id ?? opened.choices[0]!.id,
    });
    expect(staged.sim.now).toBeGreaterThan(before);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.note.length).toBeGreaterThan(10);
    expect(result.done).toBe(false);
    const room = roomOf(staged);
    expect(room.played.length).toBe(1);
    expect(room.played[0]!.beat).toBe('waiting');
    // Sitting with it settles you.
    expect(room.nerves).toBeLessThan(nervesBefore);
  });

  it('refuses a choice that is not on the table in this room', () => {
    const staged = anAudition('room-5');
    staged.run('cast.enter_room', { auditionId: staged.auditionId });
    const nonsense = staged.try('cast.play_beat', { auditionId: staged.auditionId, choiceId: 'do_a_backflip' });
    expect(nonsense.ok).toBe(false);
    expect(nonsense.error).toMatch(/not something you can do/i);
    const room = roomOf(staged);
    if (!room.sidesChanged) {
      // A beat that is not in this room cannot be played from another one.
      const wrongBeat = staged.try('cast.play_beat', { auditionId: staged.auditionId, choiceId: 'learn_fast' });
      expect(wrongBeat.ok).toBe(false);
    }
  });

  it('ends with a verdict, a round on the audition, and a tired actor', () => {
    const staged = anAudition('room-6');
    const energyBefore = staged.sim.player.wellbeing.energy;
    const room = playThrough(staged);
    expect(room.finishedAt).toBeDefined();
    expect(room.verdict).toBeDefined();
    expect(room.verdict!.score).toBeGreaterThanOrEqual(0);
    expect(room.verdict!.score).toBeLessThanOrEqual(100);
    expect(room.verdict!.line.length).toBeGreaterThan(15);
    expect(room.played.length).toBe(room.beats.length);

    // It becomes a round, which is what the decision is made on.
    const audition = staged.sim.universe.auditions[staged.auditionId] as Audition;
    expect(audition.rounds?.length).toBe(1);
    expect(audition.rounds![0]!.score).toBe(room.verdict!.score);
    expect(audition.performanceScore).toBe(room.verdict!.score);
    expect(staged.sim.player.wellbeing.energy).toBeLessThan(energyBefore);
    // And there is an honest account of it afterwards.
    const audit = staged.sim.historian.auditFor('audition', staged.auditionId);
    expect(audit?.kind).toBe('cast.room_held');
    expect(audit!.factors.every((f) => f.knowable === false)).toBe(true);
    expect(validateUniverse(staged.sim.universe).errors).toEqual([]);
  });

  it('lets you walk out, and remembers that you did', () => {
    const staged = anAudition('room-7');
    staged.run('cast.enter_room', { auditionId: staged.auditionId });
    const reliabilityBefore = staged.sim.player.reputation.reliability;
    const left = staged.run<{ verdict: { score: number } }>('cast.leave_room', { auditionId: staged.auditionId });
    const room = roomOf(staged);
    expect(room.walkedOut).toBe(true);
    expect(room.finishedAt).toBeDefined();
    expect(left.verdict.score).toBeLessThan(50);
    expect(staged.sim.player.reputation.reliability).toBeLessThan(reliabilityBefore);
    expect(room.occupants.every((o) => o.impression < 50)).toBe(true);
    const after = staged.try('cast.play_beat', { auditionId: staged.auditionId, choiceId: 'sit_still' });
    expect(after.ok).toBe(false);
  });
});

describe('what the room makes of you', () => {
  it('gives a better actor a better room, over and over', () => {
    const scores: { weak: number; strong: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const weak = anAudition(`compare-${i}`);
      const strong = anAudition(`compare-${i}`, { strong: true });
      scores.push({ weak: playThrough(weak).verdict!.score, strong: playThrough(strong).verdict!.score });
    }
    const weakAverage = scores.reduce((s, r) => s + r.weak, 0) / scores.length;
    const strongAverage = scores.reduce((s, r) => s + r.strong, 0) / scores.length;
    expect(strongAverage, `${strongAverage} against ${weakAverage}`).toBeGreaterThan(weakAverage);
  });

  it('punishes the one thing a callback cannot forgive', () => {
    // Doing the same thing again when you were asked to change it.
    let tested = 0;
    for (let i = 0; i < 8 && tested < 2; i++) {
      const staged = anAudition(`same-again-${i}`, { strong: true, stage: 'callback' });
      staged.run('cast.enter_room', { auditionId: staged.auditionId });
      const room = roomOf(staged);
      if (!room.beats.includes('adjustment')) continue;
      tested++;
      const obedient = playThrough(anAudition(`same-again-${i}`, { strong: true, stage: 'callback' }), (choices, beat) => (
        beat === 'adjustment' ? 'take_it_exactly' : choices[0]!.id
      ));
      const stubborn = playThrough(anAudition(`same-again-${i}`, { strong: true, stage: 'callback' }), (choices, beat) => (
        beat === 'adjustment' ? 'same_again' : choices[0]!.id
      ));
      expect(stubborn.verdict!.score, 'doing it the same way cost nothing').toBeLessThan(obedient.verdict!.score);
    }
    expect(tested, 'no room in eight tries had a director in it to give a note').toBeGreaterThan(0);
  });

  it('lets each chair read the same choice its own way', () => {
    // Playing against the text is the clearest case: a director leans in and
    // the office does not. It needs a room with a director in it to show.
    let checked = false;
    for (let i = 0; i < 10 && !checked; i++) {
      const staged = anAudition(`reactions-${i}`, { strong: true, stage: 'callback' });
      staged.run('cast.enter_room', { auditionId: staged.auditionId });
      if (!roomOf(staged).occupants.some((o) => o.seat === 'director')) continue;
      const played = anAudition(`reactions-${i}`, { strong: true, stage: 'callback' });
      playThrough(played, (choices, beat) => (beat === 'first_read' ? 'play_against' : choices[0]!.id));
      const room = roomOf(played);
      const director = room.occupants.find((o) => o.seat === 'director');
      const office = room.occupants.find((o) => o.seat === 'casting_director');
      if (!director || !office) continue;
      const directorRead = director.notes.find((n) => n.beat === 'first_read')?.delta ?? 0;
      const officeRead = office.notes.find((n) => n.beat === 'first_read')?.delta ?? 0;
      expect(directorRead, 'the director did not read it differently from the office').not.toBe(officeRead);
      expect(directorRead).toBeGreaterThan(officeRead);
      checked = true;
      // The reader has no opinion, because the reader is not judging you.
      const reader = room.occupants.find((o) => o.seat === 'reader');
      if (reader) expect(reader.notes.length).toBe(0);
      // And everybody who has an opinion wrote something down.
      expect(room.occupants.filter((o) => o.notes.length > 0).length).toBeGreaterThan(1);
    }
    expect(checked, 'no callback in ten tries had a director in the room').toBe(true);
  });
});

describe('the beats themselves', () => {
  it('offer only what the room can offer, and weigh only real attributes', () => {
    for (const beat of BEATS) {
      expect(beat.what.length).toBeGreaterThan(30);
      expect(beat.choices.length).toBeGreaterThan(1);
      for (const choice of beat.choices) {
        expect(choice.detail.length).toBeGreaterThan(10);
        const total = Object.values(choice.weighs).reduce((s, w) => s + w, 0);
        expect(Math.abs(total - 1), `${beat.id}/${choice.id} weights sum to ${total}`).toBeLessThan(0.02);
        for (const seat of Object.keys({ ...choice.favouredBy, ...choice.frownedOnBy })) {
          expect(ROOM_SEAT_BY_ID[seat as keyof typeof ROOM_SEAT_BY_ID], `${choice.id} names seat ${seat}`).toBeDefined();
        }
        expect(choice.minutes).toBeGreaterThan(0);
      }
    }
  });

  it('builds a room without an adjustment when there is nobody to give one', () => {
    const beats = beatsFor('prescreen', { taped: true, sidesChanged: false, directorPresent: false, secondRead: false });
    expect(beats).not.toContain('adjustment');
    expect(beats).toContain('slate');
    const withDirector = beatsFor('callback', { taped: false, sidesChanged: true, directorPresent: true, secondRead: true });
    expect(withDirector).toContain('adjustment');
    expect(withDirector).toContain('sides_change');
    expect(withDirector).not.toContain('slate');
  });

  it('hides the choices a room cannot give you', () => {
    const staged = anAudition('gating');
    staged.run('cast.enter_room', { auditionId: staged.auditionId });
    const room = roomOf(staged);
    const view = roomView(staged.sim, staged.auditionId)!;
    expect(view.finished).toBe(false);
    const waiting = choicesFor(BEAT_BY_ID.waiting, room).map((c) => c.id);
    if (room.otherActors === 0) expect(waiting).not.toContain('talk_to_them');
    else expect(waiting).toContain('talk_to_them');
  });
});

describe('the hours you put in', () => {
  it('are spent before the door opens and are in the room with you', () => {
    const cold = anAudition('prep-cold');
    const worked = anAudition('prep-cold');
    const before = cold.sim.now;
    const energyBefore = worked.sim.player.wellbeing.energy;

    cold.run('cast.enter_room', { auditionId: cold.auditionId, prepHours: 0 });
    const coldRoom = roomOf(cold);
    expect(cold.sim.now).toBe(before);

    worked.run('cast.enter_room', { auditionId: worked.auditionId, prepHours: 10 });
    const workedRoom = roomOf(worked);
    // Ten hours of it cost ten hours and real energy.
    expect(worked.sim.now).toBe(before + 10 * 60 * 60 * 1000);
    expect(worked.sim.player.wellbeing.energy).toBeLessThan(energyBefore);
    expect(workedRoom.prepHours).toBe(10);
    // And you walk in steadier for it.
    expect(workedRoom.nerves).toBeLessThan(coldRoom.nerves);
  });

  it('shows in what the room makes of you, across a run of them', () => {
    let coldTotal = 0;
    let workedTotal = 0;
    for (let i = 0; i < 5; i++) {
      const cold = anAudition(`prep-run-${i}`);
      const worked = anAudition(`prep-run-${i}`);
      cold.run('cast.enter_room', { auditionId: cold.auditionId, prepHours: 0 });
      worked.run('cast.enter_room', { auditionId: worked.auditionId, prepHours: 14 });
      const play = (s: Staged) => {
        let guard = 0;
        for (;;) {
          const room = roomOf(s);
          const beatId = room.beats[room.index];
          if (!beatId || guard++ > 20) break;
          const choices = choicesFor(BEAT_BY_ID[beatId as keyof typeof BEAT_BY_ID], room);
          const result = s.run<{ done: boolean }>('cast.play_beat', { auditionId: s.auditionId, choiceId: choices[0]!.id });
          if (result.done) break;
        }
        return roomOf(s).verdict!.score;
      };
      coldTotal += play(cold);
      workedTotal += play(worked);
    }
    expect(workedTotal / 5, `prepared ${workedTotal / 5} against cold ${coldTotal / 5}`).toBeGreaterThan(coldTotal / 5);
  });

  it('refuses to let somebody with nothing left prepare at all', () => {
    const staged = anAudition('prep-exhausted');
    staged.sim.player.wellbeing.energy = 4;
    const refused = staged.try('cast.enter_room', { auditionId: staged.auditionId, prepHours: 8 });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/too tired/i);
    // Going in cold is always allowed.
    const cold = staged.try('cast.enter_room', { auditionId: staged.auditionId, prepHours: 0 });
    expect(cold.ok).toBe(true);
  });
});

describe('the room talks like the picture it is for', () => {
  it('carries a register, a greeting, a scene frame and a note written for the genre', () => {
    const staged = anAudition('dialogue');
    staged.run('cast.enter_room', { auditionId: staged.auditionId });
    const room = roomOf(staged);
    expect(room.register).toBeTruthy();
    expect(room.greeting!.length).toBeGreaterThan(10);
    expect(room.settle!.length).toBeGreaterThan(10);
    expect(room.sceneFrame!.length).toBeGreaterThan(20);
    expect(room.readerLine!.length).toBeGreaterThan(20);
    expect(room.smallTalk!.length).toBeGreaterThan(8);
    expect(room.goodbye!.length).toBeGreaterThan(8);
    if (room.adjustment) {
      expect(room.adjustment.length).toBeGreaterThan(30);
      expect(room.adjustment).toMatch(/\.$/);
    }
  });

  it('says something out loud at every beat that has words in it', () => {
    const staged = anAudition('dialogue-2');
    const room = playThrough(staged);
    const spoken = room.played.filter((entry) => entry.said && entry.said.length > 0);
    expect(spoken.length).toBeGreaterThan(3);
    for (const entry of room.played) {
      if (entry.beat === 'sides_change') continue;
      expect(entry.said, `${entry.beat} said nothing`).toBeTruthy();
    }
  });

  it('does not put the same words in two different rooms', () => {
    const lines = new Set<string>();
    let total = 0;
    for (let i = 0; i < 6; i++) {
      const room = playThrough(anAudition(`variety-${i}`));
      for (const entry of room.played) {
        if (!entry.said) continue;
        total++;
        lines.add(entry.said);
      }
    }
    // Six rooms should not be reading from the same script.
    expect(lines.size).toBeGreaterThan(total * 0.6);
  });
});
