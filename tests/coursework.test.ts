/**
 * The work between classes (`systems/coursework.ts`, from 2026-10-07): the
 * first week's orientation, an Acting I scene assigned, read, learned,
 * analyzed and rehearsed with a partner, shown once at its meeting with
 * feedback, and shown again with the note taken; and the refusals, absences,
 * saves and the term's end around it. Played from arrival on 24 August 2026.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { SCENES, sceneById, templateById } from '@/engine/content/coursework';
import { ESTIMATE as SCHOOL, sessionGain } from '@/engine/systems/school';
import {
  ORIENTATION_KIND, PARTNER_KIND, WORK, answersScore, courseworkOf, mateRecord, meetingsFrom, openFor, questionsFor, trustOf, type Assignment,
} from '@/engine/systems/coursework';
import { routinesOf } from '@/engine/systems/routines';

const zone = 'America/New_York';
const at = (month: number, day: number, hour = 9, minute = 0, year = 2026) => instantFromZoned({ year, month, day, hour, minute }, zone);
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** Kept rested and fed each step of the clock, as a player keeps a character. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const acting = (sim: Simulation) => openFor(sim, sim.player, 'DRAM 103a/b');
const cw = (sim: Simulation) => courseworkOf(sim, sim.player)!;

describe('orientation', () => {
  it('puts the first week’s sessions on the calendar, each kept changing what’s known, once', () => {
    let sim = life('cw-orient');
    const sessions = sim.universe.scheduled.filter((i) => i.kind === ORIENTATION_KIND && i.status === 'pending');
    expect(sessions.length).toBeGreaterThanOrEqual(4);
    tended(sim, at(8, 25, 14));
    sim = reload(sim);
    expect(cw(sim).orientation.done.classmates).toBeDefined();
    expect(sim.player.school!.classmates.every((m) => mateRecord(m).met !== undefined)).toBe(true);
    // Done is done: caught up again, it's refused, and nothing is given twice.
    expect(sim.execute({ kind: 'school.orientation', payload: { task: 'classmates' } }).error).toMatch(/^Done on /);
    tended(sim, at(8, 28, 13));
    // The courses' session set the first work, so it can be started before classes.
    const first = acting(sim)!;
    expect(first).toBeDefined();
    expect(first.dueOn > '2026-08-31').toBe(true);
    expect(sceneById(first.sceneId!)!.year).toBeGreaterThanOrEqual(1900);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('a session missed can be caught up by hand, after it, in New Haven', () => {
    const sim = life('cw-orient-miss');
    // Away on the morning of the tour: it's missed.
    sim.advanceTo(at(8, 27, 8));
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(at(8, 27, 13));
    expect(cw(sim).orientation.done.tour).toBeUndefined();
    expect(sim.execute({ kind: 'school.orientation', payload: { task: 'tour' } }).error).toBe('Orientation is in New Haven.');
    sim.player.currentLocationId = 'us-ct-newhaven';
    const before = sim.now;
    sim.must({ kind: 'school.orientation', payload: { task: 'tour' } });
    expect(cw(sim).orientation.done.tour).toBeDefined();
    expect(sim.now - before).toBe(120 * 60_000);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('an Acting I scene, prepared', () => {
  const setUp = (seed: string) => { const sim = life(seed); tended(sim, at(8, 28, 13)); return sim; };

  it('reads before it learns, learns less each time, and trains its skill only so often', () => {
    const sim = setUp('cw-prepare');
    const a = acting(sim)!;
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'learn' } }).error).toBe('Read it first: lines are learned from a scene you know.');
    const t0 = sim.now;
    sim.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } });
    expect(sim.now - t0).toBe(40 * 60_000);
    const moves: number[] = [];
    const memo = sim.player.craft!.memorization;
    for (let n = 0; n < 5; n += 1) moves.push(sim.must<{ moved: number }>({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'learn' } }).moved);
    // Each step moves less of what's left.
    for (let n = 1; n < moves.length; n += 1) expect(moves[n]!).toBeLessThan(moves[n - 1]!);
    // The skill trained for three steps at most, not five.
    expect(acting(sim)!.trained).toBe(WORK.trainingSteps);
    expect(sim.player.craft!.memorization).toBeGreaterThan(memo);
    // The partner's work isn't done alone.
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'partner' } }).error).toMatch(/rehearsal you agree with them/);
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'nonsense' } }).error).toBe('That isn’t a step of this work.');
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: 'assignment-none', activity: 'read' } }).error).toBe('There’s no such assignment.');
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('answers the table work’s questions, counting only what the text supports', () => {
    const sim = setUp('cw-choose');
    const a = acting(sim)!;
    expect(sim.execute({ kind: 'school.choose', payload: { assignmentId: a.id, question: 'circumstances', option: questionsFor(a)[0]!.options[0]!.id } }).error).toMatch(/Read it first/);
    sim.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } });
    for (const { q, options } of questionsFor(a)) sim.must({ kind: 'school.choose', payload: { assignmentId: a.id, question: q.id, option: options.find((o) => o.supported)!.id } });
    expect(answersScore(acting(sim)!)).toBe(1);
    const wrong = questionsFor(a)[0]!.options.find((o) => !o.supported)!;
    expect(sim.must<{ supported: boolean }>({ kind: 'school.choose', payload: { assignmentId: a.id, question: 'circumstances', option: wrong.id } }).supported).toBe(false);
    expect(answersScore(acting(sim)!)).toBeCloseTo(4 / 5, 9);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a partner', () => {
  const setUp = (seed: string) => { const sim = life(seed); tended(sim, at(8, 28, 13)); return sim; };

  it('is asked within their day: not in class, not too late, not after it’s due', () => {
    const sim = setUp('cw-ask');
    const a = acting(sim)!;
    expect(sim.execute({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: sim.now + MS_HOUR } }).error).toMatch(/Ask at least 2 hours ahead/);
    const inClass = sim.must<{ accepted: boolean; reason?: string }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: at(9, 1, 10) } });
    expect(inClass.accepted).toBe(false);
    expect(inClass.reason).toMatch(/is in class until three/);
    expect(sim.execute({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: at(9, 30, 19) } }).error).toBe('That’s after it’s due.');
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('kept, the scene is worked together and they trust you more; missed by you, they remember it', () => {
    let sim = setUp('cw-rehearse');
    const a = acting(sim)!;
    const mate = sim.player.school!.classmates[a.partner!]!;
    const trust0 = trustOf(mate);
    const r1 = sim.must<{ accepted: boolean; rehearsalId: string }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: at(8, 29, 19) } });
    expect(r1.accepted).toBe(true);
    expect(sim.universe.scheduled.some((i) => i.kind === PARTNER_KIND && i.status === 'pending')).toBe(true);
    // Saved and loaded with it booked: still booked.
    sim = reload(sim);
    tended(sim, at(8, 29, 21));
    const after = openFor(sim, sim.player, a.course)!;
    const r = after.rehearsals[0]!;
    expect(['kept', 'missedByThem']).toContain(r.status);
    const m = sim.player.school!.classmates[a.partner!]!;
    if (r.status === 'kept') { expect(after.prep.partner).toBeGreaterThan(0); expect(trustOf(m)).toBe(trust0 + WORK.trust.kept); }
    else expect(mateRecord(m).stoodUp).toBe(1);
    // The next one, you're in New York.
    sim.must({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: at(8, 30, 15) } });
    sim.player.currentLocationId = 'us-ny-newyork';
    tended(sim, at(8, 30, 17));
    const missed = openFor(sim, sim.player, a.course)!.rehearsals[1]!;
    expect(missed.status).toBe('missedByYou');
    expect(mateRecord(sim.player.school!.classmates[a.partner!]!).log![0]!.what).toMatch(/^You didn’t come to rehearse/);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('called off with notice costs nothing; at short notice, a little trust; and nothing is rehearsed', () => {
    const sim = setUp('cw-cancel');
    const a = acting(sim)!;
    const mate = sim.player.school!.classmates[a.partner!]!;
    const t0 = trustOf(mate);
    const far = sim.must<{ rehearsalId: string }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: at(8, 30, 19) } });
    expect(sim.must<{ late: boolean }>({ kind: 'school.cancel_rehearsal', payload: { assignmentId: a.id, rehearsalId: far.rehearsalId } }).late).toBe(false);
    expect(trustOf(mate)).toBe(t0);
    const near = sim.must<{ rehearsalId: string }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: at(8, 28, 19) } });
    expect(sim.must<{ late: boolean }>({ kind: 'school.cancel_rehearsal', payload: { assignmentId: a.id, rehearsalId: near.rehearsalId } }).late).toBe(true);
    expect(trustOf(mate)).toBe(t0 + WORK.trust.lateCancel);
    expect(sim.execute({ kind: 'school.cancel_rehearsal', payload: { assignmentId: a.id, rehearsalId: near.rehearsalId } }).error).toBe('There’s no such rehearsal booked.');
    tended(sim, at(8, 30, 21));
    expect(acting(sim)!.prep.partner).toBe(0);
    expect(sim.universe.scheduled.filter((i) => i.kind === PARTNER_KIND && i.status === 'pending')).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('stood up often enough, would rather work alone', () => {
    const sim = setUp('cw-wary');
    const a = acting(sim)!;
    const m = mateRecord(sim.player.school!.classmates[a.partner!]!);
    m.trust = WORK.trust.wary - 1;
    const r = sim.must<{ accepted: boolean; reason?: string }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: at(8, 29, 19) } });
    expect(r.accepted).toBe(false);
    expect(r.reason).toMatch(/would rather work on it alone, after last time/);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('the showing', () => {
  /** A twin pair from one seed: one prepares fully, one does nothing. */
  const prepared = (sim: Simulation, a: Assignment) => {
    sim.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } });
    for (const { q, options } of questionsFor(a)) sim.must({ kind: 'school.choose', payload: { assignmentId: a.id, question: q.id, option: options.find((o) => o.supported)!.id } });
    for (let n = 0; n < 4; n += 1) sim.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'learn' } });
    for (let n = 0; n < 4; n += 1) sim.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'rehearse' } });
  };

  it('is shown once at its meeting, by what was prepared: the prepared twin shows better, and the meeting’s growth is weighed once', () => {
    const ready = life('cw-show');
    const idle = life('cw-show');
    tended(ready, at(8, 28, 13));
    tended(idle, at(8, 28, 13));
    const a = acting(ready)!;
    expect(acting(idle)!.dueOn).toBe(a.dueOn);
    prepared(ready, a);
    const [y, mo, d] = a.dueOn.split('-').map(Number);
    const due = at(mo!, d!, 9, 0, y);
    tended(ready, due + 7 * MS_HOUR);
    tended(idle, due + 7 * MS_HOUR);
    const shownReady = courseworkOf(ready, ready.player)!.assignments.find((x) => x.id === a.id)!;
    const shownIdle = courseworkOf(idle, idle.player)!.assignments.find((x) => x.dueOn === a.dueOn && x.course === a.course)!;
    expect(shownReady.shown).toBeDefined();
    expect(shownIdle.shown).toBeDefined();
    expect(shownReady.shown!.score).toBeGreaterThan(shownIdle.shown!.score);
    expect(shownIdle.shown!.band).toBe('unready');
    expect(shownReady.status).toBe('revising');
    // Shown once: the clock run over the day again shows nothing new.
    const at1 = shownReady.shown!.at;
    tended(ready, due + 9 * MS_HOUR);
    expect(courseworkOf(ready, ready.player)!.assignments.find((x) => x.id === a.id)!.shown!.at).toBe(at1);
    // The feedback names one thing, and is marked as the game's.
    expect(shownIdle.feedback!.text.length).toBeGreaterThan(10);
    expect(breaches(ready.universe)).toEqual([]);
  });

  it('weighs the meeting by how it went, in place of an ordinary meeting, never beside it', () => {
    // An unready showing's weight against an ordinary meeting's, and the gain a skill makes at each.
    expect(WORK.weight.unready).toBeLessThan(1);
    const level = 50;
    expect(sessionGain(level, 1, WORK.weight.unready)).toBeCloseTo(sessionGain(level, 1) * WORK.weight.unready, 12);
    expect(SCHOOL.sessionGain).toBeGreaterThan(0);
  });

  it('a new note stops preparation until it’s read, and the revision shows whether it was taken', () => {
    const sim = life('cw-revise');
    tended(sim, at(8, 28, 13));
    const a = acting(sim)!;
    sim.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'read' } });
    const [y, mo, d] = a.dueOn.split('-').map(Number);
    // The evening: the afternoon may be a lab's call.
    tended(sim, at(mo!, d!, 19, 0, y));
    const shown = openFor(sim, sim.player, a.course)!;
    expect(shown.status).toBe('revising');
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'revise' } }).error).toBe('There’s new feedback on this: read it first.');
    sim.must({ kind: 'school.read_feedback', payload: { assignmentId: a.id } });
    expect(sim.execute({ kind: 'school.read_feedback', payload: { assignmentId: a.id } }).error).toBe('Read already.');
    for (let n = 0; n < 3; n += 1) sim.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'revise' } });
    const [ry, rm, rd] = shown.revision!.dueOn.split('-').map(Number);
    tended(sim, at(rm!, rd!, 16, 0, ry));
    const done = courseworkOf(sim, sim.player)!.assignments.find((x) => x.id === a.id)!;
    expect(done.status).toBe('done');
    expect(done.revision!.applied).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('absence and the term', () => {
  it('called in sick on its day, the work moves to the next meeting; away unexcused, it’s missed and the partner minds', () => {
    const sick = life('cw-absent');
    tended(sick, at(8, 28, 13));
    const a = acting(sick)!;
    const dueOn = a.dueOn;
    const [y, mo, d] = dueOn.split('-').map(Number);
    tended(sick, at(mo!, d!, 7, 0, y));
    sick.player.wellbeing.condition = 40;
    sick.must({ kind: 'school.call_in_sick', payload: {} });
    tended(sick, at(mo!, d!, 16, 0, y));
    const moved = openFor(sick, sick.player, a.course)!;
    expect(moved.status).toBe('open');
    expect(moved.dueOn > dueOn).toBe(true);
    expect(moved.dueOn).toBe(meetingsFrom(a.course, { year: y!, month: mo!, day: d! + 1 })[0]);

    const away = life('cw-absent');
    tended(away, at(8, 28, 13));
    const b = acting(away)!;
    const trust0 = trustOf(away.player.school!.classmates[b.partner!]!);
    tended(away, at(mo!, d!, 7, 0, y));
    away.player.currentLocationId = 'us-ny-newyork';
    tended(away, at(mo!, d!, 16, 0, y));
    const gone = courseworkOf(away, away.player)!.assignments.find((x) => x.id === b.id)!;
    expect(gone.status).toBe('missed');
    // And any ask of theirs left unanswered meanwhile (`partnerAsks`, from 2026-10-07).
    const lapsed = courseworkOf(away, away.player)!.assignments.filter((x) => x.partner === b.partner).flatMap((x) => x.asks ?? []).filter((k) => k.status === 'lapsed').length;
    expect(trustOf(away.player.school!.classmates[b.partner!]!)).toBe(trust0 + WORK.trust.missed + lapsed * WORK.ask.unanswered);
    expect(breaches(away.universe)).toEqual([]);
  });

  it('work open at the term’s end lapses; a later save has orientation behind it', () => {
    const sim = life('cw-lapse');
    tended(sim, at(12, 12, 9));
    const lapsed = courseworkOf(sim, sim.player)!.assignments.filter((x) => x.term === 0 && x.status === 'lapsed');
    const open = courseworkOf(sim, sim.player)!.assignments.filter((x) => x.term === 0 && (x.status === 'open' || x.status === 'revising'));
    expect(open).toEqual([]);
    expect(lapsed.length + courseworkOf(sim, sim.player)!.assignments.filter((x) => x.term === 0 && x.status === 'done').length).toBeGreaterThan(0);
    // An old save, its school record from before coursework: the week is behind it.
    delete (sim.player.school as { coursework?: unknown }).coursework;
    expect(courseworkOf(sim, sim.player)!.orientation.behind).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('every scene the courses draw from names two parts, each question with an answer the text supports', () => {
    for (const s of SCENES) {
      for (const role of s.roles) for (const q of ['objective', 'obstacle', 'tactic'] as const) expect(role[q].some((o) => o.supported), `${s.id} ${role.name} ${q}`).toBe(true);
      expect(s.circumstances.some((o) => o.supported)).toBe(true);
      expect(s.relationship.some((o) => o.supported)).toBe(true);
      for (const o of [...s.circumstances, ...s.relationship, ...s.roles.flatMap((r) => [...r.objective, ...r.obstacle, ...r.tactic])]) if (!o.supported) expect(o.why, `${s.id} ${o.id}`).toBeTruthy();
    }
    expect(templateById('scene-study')!.materialFrom!['DRAM 103a/b']).toBe(1900);
  });
});

describe('a routine', () => {
  it('prepares the course’s open work by the same command, and stops at what the button would refuse', () => {
    const sim = life('cw-routine');
    tended(sim, at(8, 28, 13));
    const saved = sim.must<{ routineId: string }>({ kind: 'routine.save', payload: { name: 'Lines', steps: [{ kind: 'school.prepare', payload: { course: 'DRAM 103a/b', activity: 'read' } }, { kind: 'school.prepare', payload: { course: 'DRAM 103a/b', activity: 'learn' } }] } });
    expect(sim.execute({ kind: 'routine.save', payload: { name: 'Bad', steps: [{ kind: 'school.prepare', payload: { course: 'DRAM 103a/b', activity: 'fly' } }] } }).error).toBe('That isn’t a step of the course’s work.');
    expect(routinesOf(sim.player).some((r) => r.id === saved.routineId)).toBe(true);
    for (const step of routinesOf(sim.player)[0]!.steps) sim.must({ kind: step.kind, payload: step.payload });
    const a = acting(sim)!;
    expect(a.prep.familiarity).toBeGreaterThan(0);
    expect(a.prep.memorization).toBeGreaterThan(0);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
