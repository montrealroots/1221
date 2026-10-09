/**
 * The craft's 21 skills (`content/school.ts`): listed in alphabetical order,
 * each trained by something and each read by an outcome: a part and its
 * genre, the audition itself, the showcase or the school's casting.
 */

import { createSave,loadSave } from '@/engine';
import { COURSES,SKILLS } from '@/engine/content/school';
import { meanCraft,rankIn,upgradeCraft } from '@/engine/systems/school';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { describe,expect,it } from 'vitest';

describe('the list', () => {
  it('is 21 skills in alphabetical order by name, with no name twice', () => {
    const labels = SKILLS.map((s) => s.label);
    expect(labels).toHaveLength(21);
    expect([...labels].sort((a, b) => a.localeCompare(b))).toEqual(labels);
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(21);
  });

  it('trains in Yale’s courses all but memorization, which rehearsals grow, and voice-over, which the school doesn’t teach', () => {
    const trained = new Set(COURSES.flatMap((c) => c.skills));
    expect(SKILLS.map((s) => s.id).filter((id) => !trained.has(id))).toEqual(['memorization', 'voiceover']);
  });
});

describe('a class day grows every skill its courses train', () => {
  it('grows scene study, character work and emotional access from Acting I, and improvisation from Play', () => {
    const sim = createSave(1, 'skills-class', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const before = { ...sim.player.craft! };
    while (sim.now < Date.UTC(2026, 8, 5)) sim.advanceTo(Math.min(Date.UTC(2026, 8, 5), sim.now + 6 * 3_600_000), { stopOnPlayerRequired: true });
    const after = sim.player.craft!;
    for (const k of ['scene', 'character', 'emotion', 'improv'] as const) expect(after[k], k).toBeGreaterThan(before[k]);
    expect(after.voiceover).toBe(before.voiceover);
  }, 120_000);
});

describe('acting at the heart of it', () => {

  it('ranks a student in acting by it, apart from the craft overall', () => {
    const sim = createSave(1, 'skills-rank', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const p = sim.player;
    Object.assign(p.craft!, { scene: 95, character: 95, emotion: 95 });
    expect(rankIn(p, 'acting')).toBe(1);
    Object.assign(p.school!.classmates[0]!.craft, { scene: 99, character: 99, emotion: 99 });
    expect(rankIn(p, 'acting')).toBe(2);
    expect(rankIn(p)).toBe(meanCraft(p.school!.classmates[0]!.craft) > meanCraft(p.craft!) ? 2 : 1);
  });
});

describe('a save from before the 21', () => {
  it('takes each skill from the area it grew out of, for the actor, the class and the term’s start', () => {
    const sim = createSave(1, 'skills-old', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const old = { acting: 70, voice: 61, speech: 62, body: 63, text: 64, singing: 65, screen: 66 };
    const p = sim.player;
    (p as unknown as { craft: unknown }).craft = { ...old };
    (p.school!.classmates[0] as unknown as { craft: unknown }).craft = { ...old };
    (p.school!.tally as unknown as { craftAtStart: unknown }).craftAtStart = { ...old };
    const back = loadSave(JSON.parse(JSON.stringify(sim.universe))).player;
    for (const c of [back.craft!, back.school!.classmates[0]!.craft, back.school!.tally.craftAtStart]) {
      expect(c).toMatchObject({ scene: 70, emotion: 70, memorization: 70, voice: 61, voiceover: 61, speech: 62, accents: 62, movement: 63, combat: 63, script: 64, classical: 64, singing: 65, screen: 66 });
      expect(Object.keys(c).sort()).toEqual(SKILLS.map((s) => s.id).sort());
    }
    expect(upgradeCraft(back.craft!)).toBe(false);
  });
});
