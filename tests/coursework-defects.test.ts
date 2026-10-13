/**
 * Coursework defects found by the readings of 2026-10-12, each fixed and held here (`systems/coursework.ts`):
 * - asking a partner to rehearse skipped the partner activity's own rule (an intimacy scene's boundaries, a fight's
 *   choreography); a partner asked before it too;
 * - a rehearsal on a day called in sick was held against the player, though the guide says it isn't; and an injury
 *   that stops training didn't stop a drill on the feet with a partner;
 * - a note on a skill was taken by two steps of revision at the desk, whatever the skill did;
 * - a note on a choice, once resolved, could never be given again, and one given stayed open for ever.
 * TEST SETUP throughout: assignments written onto the coursework, as tests/ensemble.test.ts does, and the clock's own
 * commitments cleared where a rehearsal is booked.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { PREP_DIMS, templateById } from '@/engine/content/coursework';
import { SKILL_NOTE_RISE, askRefusal, courseworkOf, noteCandidates, noteTaken, notesOf, questionsFor, trustOf, type Assignment } from '@/engine/systems/coursework';
import { recordNote, resolveNote, mayGive } from '@/engine/systems/learning';
import { mateRecord } from '@/engine/systems/coursework';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

function work(sim: Simulation, template: string, prep: Partial<Record<string, number>> = {}, sceneId?: string): Assignment {
  const a: Assignment = {
    id: `d-${template}-${courseworkOf(sim, sim.player)!.assignments.length}`, course: 'DRAM 403a/b', template, term: 1, setOn: '2026-09-07', dueOn: '2026-12-01', ...(sceneId ? { sceneId, role: 0 as const } : {}), partner: 0,
    prep: { ...Object.fromEntries(PREP_DIMS.map((d) => [d, 0])), ...prep } as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
  };
  courseworkOf(sim, sim.player)!.assignments.push(a);
  mateRecord(sim.player.school!.classmates[0]!).met = sim.now;
  return a;
}

/** The first evening at seven, from tomorrow, that the partner is free and nothing refuses (`askRefusal`). */
function freeEvening(sim: Simulation, a: Assignment): number {
  const today = zonedParts(sim.now, 'America/New_York');
  const seven = instantFromZoned({ year: today.year, month: today.month, day: today.day, hour: 19 }, 'America/New_York');
  for (let d = 1; d <= 14; d += 1) {
    const when = seven + d * 24 * MS_HOUR;
    const q = askRefusal(sim, sim.player, a, when);
    if (!q.refused && !q.declines) return when;
  }
  throw new Error('No evening in two weeks the partner is free.');
}

describe('rehearsing with a partner, by the partner work’s own rule', () => {
  it('isn’t booked before an intimacy scene’s boundaries are agreed, and is once they are', () => {
    const sim = life('defect-intimacy');
    const req = templateById('intimacy-practice')!.activities.find((x) => x.dim === 'partner')!.requires!;
    const a = work(sim, 'intimacy-practice');
    const when = sim.now + 30 * MS_HOUR;
    expect(askRefusal(sim, sim.player, a, when).refused).toBe(req.why);
    a.prep[req.dim] = req.at;
    expect(askRefusal(sim, sim.player, a, when).refused).toBeUndefined();
  });

  it('excuses a rehearsal on a day called in sick, trust unchanged', () => {
    // Booked on an evening the partner is free (`askRefusal`), and accepted. Until 2026-10-12 this asked for a time
    // thirty hours on and returned early, passing having checked nothing, wherever the partner declined it.
    const booked = (sick: boolean) => {
      const sim = life('defect-sick');
      const a = work(sim, 'scene-study', { familiarity: 0.5, memorization: 0.5 }, 'seagull-4');
      for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
      const when = freeEvening(sim, a);
      expect(sim.must<{ accepted: boolean }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: when } }).accepted).toBe(true);
      const mate = sim.player.school!.classmates[0]!;
      const trust = trustOf(mate);
      // TEST SETUP: the day of the rehearsal called in sick.
      if (sick) sim.player.school!.sickDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(when));
      sim.advanceTo(when + 3 * MS_HOUR);
      return { status: a.rehearsals.at(-1)!.status, trust, after: trustOf(mate) };
    };
    const sick = booked(true);
    expect(sick.status).toBe('excused');
    expect(sick.after).toBe(sick.trust);
    // The same evening, not called in sick: not excused.
    expect(booked(false).status).not.toBe('excused');
  });
});

describe('a note on a skill', () => {
  it('is taken by the skill growing, not by revision at the desk', () => {
    const sim = life('defect-skill-note');
    const a = work(sim, 'scene-study', {}, 'seagull-4');
    const notes = notesOf(courseworkOf(sim, sim.player)!);
    const skill = 'scene' as const;
    const level = sim.player.craft![skill] / 100;
    recordNote(notes, { kind: 'skill', skill }, '2026-09-21', a.id, 'Acting I', level);
    a.feedback = { course: 'Acting I', teachers: 'x', text: 'x', focus: { kind: 'skill', skill } };
    a.prep.revision = 1;
    expect(noteTaken(sim.player, a, '2026-10-01')).toBe(false);
    sim.player.craft![skill] += SKILL_NOTE_RISE * 100;
    expect(noteTaken(sim.player, a, '2026-10-01')).toBe(true);
  });
});

describe('a note on a choice', () => {
  it('can be given again after it was resolved, where the choice is made against the text again', () => {
    const sim = life('defect-choice-note');
    const a = work(sim, 'scene-study', { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1 }, 'seagull-4');
    const q = questionsFor(a)[0]!;
    a.answers[q.q.id] = q.options.find((o) => !o.supported)!.id as never;
    const notes = notesOf(courseworkOf(sim, sim.player)!);
    recordNote(notes, { kind: 'choice', question: q.q.id }, '2026-09-21', 'earlier', 'Acting I');
    resolveNote(notes, `choice:${q.q.id}`, '2026-10-01', 'earlier', 'Acting I');
    expect(mayGive(notes, `choice:${q.q.id}`, undefined)).toBe(false);
    const candidates = noteCandidates(sim.player, a, { familiarity: 1 }, 0.6, notes);
    expect(candidates.some((c) => c.focus.kind === 'choice' && c.focus.question === q.q.id)).toBe(true);
  });
});
