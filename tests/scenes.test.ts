/**
 * The scene bank and the courses' work, checked whole (from 2026-10-08): every
 * scene's id unique, its fields in range, every question with a reading the
 * text supports and one it cuts against, each cut-against reading saying why;
 * the material each kind of course asks for there to be chosen from; and every
 * course of the Bulletin setting work, The Greeks with its Greek scenes.
 */
import { describe, expect, it } from 'vitest';
import { QUESTIONS, SCENES, TEMPLATES, templateFor } from '@/engine/content/coursework';
import { COURSES } from '@/engine/content/school';
import { scenesFor } from '@/engine/systems/learning';

describe('the scene bank', () => {
  it('holds sound scenes: unique, in range, every question both supported and cut against, with reasons', () => {
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(SCENES.length);
    for (const s of SCENES) {
      expect([1, 2, 3]).toContain(s.difficulty);
      expect(['comedy', 'drama', 'tragedy']).toContain(s.genre);
      expect(s.year).toBeLessThanOrEqual(1930);
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
