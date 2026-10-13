/**
 * Coursework defects left by the round of 2026-10-12 (group R2), each held here (`systems/coursework.ts`):
 * - what a partner says after a rehearsal (`peerNote`) read the raw `prep.interpretation`, which on a scene whose table
 *   work is the answers alone the showing never reads and nothing moves, so a partner on Scene Study always said your
 *   choices weren't clear, however you'd made them;
 * - both readings tried at a rehearsal kept stopped moving that figure there (tests/defects-g8-10.test.ts), which left
 *   the partner's words after it with nothing of the choices to read until `peerNote` read the answers;
 * - a showing kept `parts` (the preparation summed by `weightsOf`, the craft, the readiness, the partner part), which
 *   nothing in the game read.
 * TEST SETUP throughout: assignments written onto the coursework, as tests/defects-g8-10.test.ts does, the clock's own
 * commitments cleared where a rehearsal is booked, and the partner's reliability set to 1 so the evening is kept (the
 * draw of whether they come is the subject of tests/partners.test.ts, not of these).
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { PREP_DIMS, templateById } from '@/engine/content/coursework';
import { courseworkOf, interpretationOf, mateRecord, questionsFor, show, type Assignment, type PartnerRehearsal } from '@/engine/systems/coursework';

const zone = 'America/New_York';
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

/** Scene Study on The Seagull, every part but the table work prepared, the raw `prep.interpretation` at 0. */
function work(sim: Simulation, template = 'scene-study', sceneId = 'seagull-4'): Assignment {
  const a: Assignment = {
    id: `r2-${template}`, course: 'DRAM 403a/b', template, term: 1, setOn: '2026-08-24', dueOn: '2026-12-01', sceneId, role: 0, partner: 0,
    prep: { ...Object.fromEntries(PREP_DIMS.map((d) => [d, 0])), familiarity: 0.9, memorization: 0.9, rehearsal: 0.9 } as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
  };
  courseworkOf(sim, sim.player)!.assignments.push(a);
  mateRecord(sim.player.school!.classmates[0]!).met = sim.now;
  return a;
}

/** Every question answered as the text supports it, or against it (left unanswered where it cuts against none). */
function answer(a: Assignment, supported: boolean): void {
  for (const { q, options } of questionsFor(a)) {
    const o = options.find((x) => x.supported === supported);
    if (o) a.answers[q.id] = o.id;
    else delete a.answers[q.id];
  }
}

/** A rehearsal with the partner asked for an evening they're free, and kept. */
function keep(sim: Simulation, a: Assignment): PartnerRehearsal {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  mateRecord(sim.player.school!.classmates[0]!).reliability = 1;
  for (let day = 24; day <= 40; day += 1) {
    const when = instantFromZoned({ year: 2026, month: 8, day: 1, hour: 19 }, zone) + (day - 1) * 24 * MS_HOUR;
    if (when < sim.now + 3 * MS_HOUR) continue;
    const asked = sim.must<{ accepted: boolean; rehearsalId?: string }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: when } });
    if (!asked.accepted) continue;
    tended(sim, when + 3 * MS_HOUR);
    const r = a.rehearsals.find((x) => x.id === asked.rehearsalId)!;
    expect(r.status).toBe('kept');
    return r;
  }
  throw new Error('No evening the partner was free by September 9.');
}

const first = (sim: Simulation) => sim.player.school!.classmates[0]!.name.split(' ')[0]!;

describe('what a partner says after a rehearsal kept, of the choices', () => {
  it('reads the answers at the table where the table work is the answers alone', () => {
    expect(templateById('scene-study')!.activities.some((x) => x.dim === 'interpretation')).toBe(false);
    // The choices made as the text supports them: the rest prepared, it's coming together.
    const made = life('r2-said-made');
    const a = work(made);
    answer(a, true);
    expect(interpretationOf(a)).toBe(1);
    expect(keep(made, a).said).toBe(`${first(made)} says it’s coming together.`);
    // The same evening, the choices made against the text: they weren't clear.
    const against = life('r2-said-made');
    const b = work(against);
    answer(b, false);
    expect(interpretationOf(b)).toBe(0);
    expect(keep(against, b).said).toMatch(/what you’re playing for: your choices weren’t clear/);
    // And none made yet: the same.
    const none = life('r2-said-made');
    expect(keep(none, work(none)).said).toMatch(/what you’re playing for/);
  });

  it('reads the step’s half too, where the course has a step at the table', () => {
    const sim = life('r2-said-scan');
    const a = work(sim, 'classical-scene', 'muchado-4-1');
    answer(a, true);
    // Answers supported, nothing scanned: half the table work, under what a partner calls clear.
    expect(interpretationOf(a)).toBeCloseTo(0.5, 12);
    expect(keep(sim, a).said).toMatch(/what you’re playing for/);
    a.prep.interpretation = 1;
    expect(keep(sim, a).said).toBe(`${first(sim)} says it’s coming together.`);
  });
});

describe('both readings tried at a rehearsal kept, where the table work is the answers alone', () => {
  it('move no figure, and leave the partner’s words to the answers', () => {
    const sim = life('r2-both');
    const a = work(sim);
    answer(a, true);
    // TEST SETUP: a reading held apart, then both agreed to be tried (`school.respond`, `systems/classmates.ts`).
    a.readsApart = 'objective';
    a.tryBoth = true;
    const r = keep(sim, a);
    expect(a.tryBoth).toBeUndefined();
    expect(a.readsApart).toBeUndefined();
    expect(a.prep.interpretation).toBe(0);
    expect(r.said).toBe(`${first(sim)} says it’s coming together.`);
  });
});

describe('a showing', () => {
  it('keeps no parts, which nothing read', () => {
    const sim = life('r2-parts');
    const a = work(sim);
    answer(a, true);
    const s = show(sim, sim.player, a, '2026-10-01', instantFromZoned({ year: 2026, month: 10, day: 1, hour: 10 }, zone));
    expect(s).not.toHaveProperty('parts');
    expect(a.shown).not.toHaveProperty('parts');
    // What it keeps is read: the band and the score on the feedback's heading (CourseworkPane), the strengths.
    expect(typeof s.score).toBe('number');
    expect(s.band).toBeDefined();
  });
});
