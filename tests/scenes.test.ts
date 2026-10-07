/**
 * The scene bank and the courses' work, checked whole (from 2026-10-08): every
 * scene's id unique, its fields in range, every question with a reading the
 * text supports and one it cuts against, each cut-against reading saying why;
 * the material each kind of course asks for there to be chosen from; and every
 * course of the Bulletin setting work, The Greeks with its Greek scenes.
 */
import { describe, expect, it } from 'vitest';
import { QUESTIONS, SCENES, TEMPLATES, sceneById, templateFor } from '@/engine/content/coursework';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { courseworkOf, questionsFor, setWork, show } from '@/engine/systems/coursework';
import { COURSES } from '@/engine/content/school';
import { scenesFor } from '@/engine/systems/learning';

describe('the scene bank', () => {
  it('holds sound scenes: unique, in range, every question both supported and cut against, with reasons', () => {
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(SCENES.length);
    for (const s of SCENES) {
      expect([1, 2, 3]).toContain(s.difficulty);
      expect(['comedy', 'drama', 'tragedy']).toContain(s.genre);
      // Public-domain plays to 1930; an original scene written for SLATE is of now, says so, and gives its facts.
      if (s.origin === 'original') { expect(s.by).toBe('An original scene written for SLATE'); expect(s.facts?.length).toBeGreaterThanOrEqual(4); } else expect(s.year).toBeLessThanOrEqual(1930);
      const sets = [s.circumstances, s.relationship, ...s.roles.flatMap((r) => [r.objective, r.obstacle, r.tactic])];
      for (const opts of sets) {
        expect(opts.some((o) => o.supported), `${s.id}: a supported reading`).toBe(true);
        expect(opts.some((o) => !o.supported), `${s.id}: a reading cut against`).toBe(true);
        for (const o of opts) if (!o.supported) expect(o.why?.length, `${s.id}/${o.id}: why`).toBeGreaterThan(10);
        expect(new Set(opts.map((o) => o.id)).size).toBe(opts.length);
      }
    }
    expect(QUESTIONS).toHaveLength(5);
  });

  it('has material for every kind of course, the Greeks’ only Greek, and several defensible readings where the text allows', () => {
    const kinds = { scene: SCENES.filter((s) => s.language === 'prose' && !s.tradition), verse: SCENES.filter((s) => s.language === 'verse' && !s.tradition), greek: SCENES.filter((s) => s.tradition === 'greek') };
    expect(kinds.scene.length).toBeGreaterThanOrEqual(18);
    expect(kinds.verse.length).toBeGreaterThanOrEqual(10);
    expect(kinds.greek.length).toBeGreaterThanOrEqual(6);
    const greek = scenesFor(templateFor('DRAM 293b', 'spring')!, 'DRAM 293b', [], 2);
    expect(greek.length).toBe(kinds.greek.length);
    expect(greek.every((s) => s.tradition === 'greek')).toBe(true);
    // The first term of Acting I has more than one scene's worth of twentieth-century plays to choose from.
    expect(scenesFor(templateFor('DRAM 103a/b', 'fall')!, 'DRAM 103a/b', [], 1).length).toBeGreaterThanOrEqual(8);
    const twoReadings = SCENES.filter((s) => s.roles.some((r) => r.objective.filter((o) => o.supported).length > 1)).length;
    expect(twoReadings).toBeGreaterThanOrEqual(20);
  });

  it('sets work in every course: the Greeks now, and spring Acting I its simulated rehearsals, not the fall’s format again', () => {
    for (const c of COURSES) {
      const set = c.terms.some((term) => templateFor(c.code, term));
      if (c.code === 'DRAM 293b') expect(templateFor(c.code, 'spring')!.id).toBe('greek-scene');
      // The Actor Showcase and the rest: every course of the Bulletin sets some work.
      expect(set, c.code).toBe(true);
    }
    expect(templateFor('DRAM 103a/b', 'fall')!.id).toBe('scene-study');
    expect(templateFor('DRAM 103a/b', 'spring')!.id).toBe('simulated-rehearsal');
    expect(TEMPLATES.find((t) => t.id === 'simulated-rehearsal')!.rounds).toHaveLength(3);
  });
});

describe('original material, through the work', () => {
  it('is set like any scene where the fitting public-domain ones are studied, its readings rest on its facts, and it’s shown, noted and revised', () => {
    const sim = createSave(1, 'orig-work', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const cw = courseworkOf(sim, sim.player)!;
    // Every fitting public-domain scene studied already, long ago: what's never studied comes first.
    const t = templateFor('DRAM 103a/b', 'fall')!;
    for (const s of scenesFor(t, 'DRAM 103a/b', [], 1).filter((x) => x.origin !== 'original')) cw.assignments.push({ id: `old-${s.id}`, course: 'X', template: 'scene-study', term: 0, setOn: '2026-01-01', dueOn: '2026-01-02', sceneId: s.id, role: 0, prep: { familiarity: 0, memorization: 0, interpretation: 0, rehearsal: 0, partner: 0, revision: 0 }, answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'done' });
    const a = setWork(sim, sim.player, 'DRAM 103a/b', { year: 2026, month: 9, day: 1 })!;
    const scene = sceneById(a.sceneId!)!;
    expect(scene.origin).toBe('original');
    expect(a.revisit).toBeUndefined();
    // A reading cut against: the note names why, from the scene's own facts.
    const q = questionsFor(a).find(({ options }) => options.some((o) => !o.supported))!;
    for (const { q: x, options } of questionsFor(a)) a.answers[x.id] = options.find((o) => o.supported)!.id;
    a.answers[q.q.id] = q.options.find((o) => !o.supported)!.id;
    for (const d of ['familiarity', 'memorization', 'rehearsal', 'partner'] as const) a.prep[d] = 0.95;
    show(sim, sim.player, a, '2026-10-01', sim.now);
    expect(a.feedback!.focus).toEqual({ kind: 'choice', question: q.q.id });
    expect(a.feedback!.text).toContain(q.options.find((o) => !o.supported)!.why!);
    expect(a.feedback!.text).toContain(`As ${scene.roles[a.role!].name} in ${scene.play}.`);
  });
});
