/**
 * The first weeks at Yale as one connected life (the owner's acting-school
 * brief of 2026-10-07): arriving on 24 August 2026, the week's orientation
 * kept, the courses' first work set at its session; Acting I's scene read,
 * analyzed at the table, its lines learned by a saved routine and rehearsed
 * with the partner on an agreed evening; Voice I's sequence practiced on
 * successive days, refused twice in one; the scene shown once at its
 * meeting, the meeting's growth weighed by the showing in place of an
 * ordinary meeting's, and shown again with the note taken; and the next
 * scene set. Saved and loaded in the middle of each part; every law held.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { sceneById } from '@/engine/content/coursework';
import { ceilingOf, focusOf, sessionGain } from '@/engine/systems/school';
import { WORK, courseworkOf, openFor, questionsFor, trustOf } from '@/engine/systems/coursework';
import { routinesOf, runRoutine } from '@/engine/systems/routines';

const zone = 'America/New_York';
const at = (month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year: 2026, month, day, hour, minute }, zone);
const atKey = (key: string, hour: number, minute = 0) => { const [y, m, d] = key.split('-').map(Number); return instantFromZoned({ year: y!, month: m!, day: d!, hour, minute }, zone); };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
/** Kept rested and fed each step of the clock, as a player keeps a character; awake from now. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

describe('the first weeks at Yale', () => {
  it('arrives, is oriented, prepares a scene with a partner, shows it once, takes the note, and is set the next', () => {
    let sim = createSave(1, 'journey-school-week', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    expect(sim.player.school!.termsBegun).toBe(0);

    // The week's sessions kept, one by one, the class met on the 25th.
    tended(sim, at(8, 25, 14));
    sim = reload(sim);
    expect(courseworkOf(sim, sim.player)!.orientation.done.classmates).toBeDefined();
    tended(sim, at(8, 28, 13));
    const done = courseworkOf(sim, sim.player)!.orientation.done;
    expect(Object.keys(done).sort()).toEqual(['classmates', 'expectations', 'faculty', 'register', 'tour']);
    // Kept once: caught up again by hand, it's refused, nothing told or set twice.
    expect(sim.execute({ kind: 'school.orientation', payload: { task: 'expectations' } }).error).toMatch(/^Done on /);
    const acting = openFor(sim, sim.player, 'DRAM 103a/b')!;
    const voice = openFor(sim, sim.player, 'DRAM 113a/b')!;
    expect(acting).toBeDefined();
    expect(voice).toBeDefined();
    const scene = sceneById(acting.sceneId!)!;
    expect(scene.year).toBeGreaterThanOrEqual(1900);

    // Read, then the table work, each answer the text supports.
    sim.must({ kind: 'school.prepare', payload: { assignmentId: acting.id, activity: 'read' } });
    for (const { q, options } of questionsFor(acting)) sim.must({ kind: 'school.choose', payload: { assignmentId: acting.id, question: q.id, option: options.find((o) => o.supported)!.id } });

    // Lines learned by a routine saved for it, run as the screen runs it: each step a command of its own.
    const r = sim.must<{ routineId: string }>({ kind: 'routine.save', payload: { name: 'Lines, Twice', steps: [{ kind: 'school.prepare', payload: { course: 'DRAM 103a/b', activity: 'learn' } }, { kind: 'school.prepare', payload: { course: 'DRAM 103a/b', activity: 'learn' } }] } });
    expect(runRoutine(sim, r.routineId)).toEqual({ done: 2 });
    sim = reload(sim);
    const learned = openFor(sim, sim.player, 'DRAM 103a/b')!;
    expect(learned.prep.memorization).toBeGreaterThan(0.4);
    expect(routinesOf(sim.player)).toHaveLength(1);

    // Voice I: the sequence learned, practiced, and refused a second time the same day.
    sim.must({ kind: 'school.prepare', payload: { assignmentId: voice.id, activity: 'learn-sequence' } });
    sim.must({ kind: 'school.prepare', payload: { assignmentId: voice.id, activity: 'practice' } });
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: voice.id, activity: 'practice' } }).error).toBe('Done today already: it takes days, not one long session.');

    // An evening agreed with the partner; saved and loaded with it on the calendar, then kept or stood up.
    // A Sunday evening asked for, then called off with notice: no trust lost, nothing rehearsed.
    const sunday = sim.must<{ rehearsalId: string }>({ kind: 'school.ask_partner', payload: { assignmentId: acting.id, at: at(8, 30, 15) } });
    expect(sim.must<{ late: boolean }>({ kind: 'school.cancel_rehearsal', payload: { assignmentId: acting.id, rehearsalId: sunday.rehearsalId } }).late).toBe(false);
    const ask = sim.must<{ accepted: boolean }>({ kind: 'school.ask_partner', payload: { assignmentId: acting.id, at: at(8, 29, 19) } });
    expect(ask.accepted).toBe(true);
    sim = reload(sim);
    tended(sim, at(8, 29, 21));
    const rehearsed = openFor(sim, sim.player, 'DRAM 103a/b')!;
    expect(rehearsed.rehearsals[0]!.status).toBe('cancelled');
    expect(['kept', 'missedByThem']).toContain(rehearsed.rehearsals[1]!.status);

    // Voice practiced again the next day, as it asks.
    tended(sim, at(8, 30, 19));
    const v2 = openFor(sim, sim.player, 'DRAM 113a/b')!;
    const before = v2.prep.rehearsal;
    sim.must({ kind: 'school.prepare', payload: { assignmentId: voice.id, activity: 'practice' } });
    expect(openFor(sim, sim.player, 'DRAM 113a/b')!.prep.rehearsal).toBeGreaterThan(before);

    // Rehearsed alone the evening before it's due.
    const dueKey = rehearsed.dueOn;
    tended(sim, atKey(dueKey, 19) - MS_DAY);
    for (let n = 0; n < 3; n += 1) sim.must({ kind: 'school.prepare', payload: { assignmentId: acting.id, activity: 'rehearse' } });

    // The day it's due: one meeting's growth in scene study, at the showing's weight, never two.
    tended(sim, atKey(dueKey, 8, 59));
    // The state the class is met in, read once, and the clock taken straight through nine.
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    const focus = focusOf(sim.player);
    const sceneBefore = sim.player.craft!.scene;
    const ceiling = ceilingOf(sim.player.craft!, 'scene');
    sim.advanceTo(atKey(dueKey, 9, 1));
    const shown = courseworkOf(sim, sim.player)!.assignments.find((a) => a.id === acting.id)!;
    expect(shown.shown).toBeDefined();
    expect(shown.shown!.band).not.toBe('unready');
    // Within half a percent (the minutes between the reading and nine drain a little energy): one meeting at the
    // showing’s weight, not an ordinary meeting’s (a tenth or more apart) and not two (twice).
    const ratio = (sim.player.craft!.scene - sceneBefore) / sessionGain(sceneBefore, focus, WORK.weight[shown.shown!.band], ceiling);
    expect(Math.abs(ratio - 1)).toBeLessThan(0.005);

    // The note read, worked on in the evening, and taken at the next meeting.
    tended(sim, atKey(dueKey, 19));
    if (shown.feedback) {
      sim.must({ kind: 'school.read_feedback', payload: { assignmentId: acting.id } });
      sim = reload(sim);
      for (let n = 0; n < 3; n += 1) sim.must({ kind: 'school.prepare', payload: { assignmentId: acting.id, activity: 'revise' } });
      const revisionKey = openFor(sim, sim.player, 'DRAM 103a/b')!.revision!.dueOn;
      tended(sim, atKey(revisionKey, 16));
      const revised = courseworkOf(sim, sim.player)!.assignments.find((a) => a.id === acting.id)!;
      expect(revised.status).toBe('done');
      expect(revised.revision!.applied).toBe(true);
      // The course's next scene, a different one, set at that meeting.
      const next = openFor(sim, sim.player, 'DRAM 103a/b')!;
      expect(next.id).not.toBe(acting.id);
      expect(next.sceneId).not.toBe(acting.sceneId);
    }
    const partner = sim.player.school!.classmates[acting.partner!]!;
    // Each ask of theirs left unanswered cost a little (`partnerAsks`, from 2026-10-07); nothing else of this week did.
    const lapsed = courseworkOf(sim, sim.player)!.assignments.filter((x) => x.partner === acting.partner).flatMap((x) => x.asks ?? []).filter((k) => k.status === 'lapsed').length;
    expect(trustOf(partner)).toBeGreaterThanOrEqual(WORK.trust.start - 1 + lapsed * WORK.ask.unanswered);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
