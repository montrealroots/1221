/**
 * The stage's remaining criteria, the integration pass of 2026-10-16 (docs/verification/integration-2026-10-16/st6.md and
 * README.md).
 *
 * - **ST4, drama on both sides.** Until 2026-10-16 the catalog's 25 drama scenes and plays were all private naturalist
 *   two-handers, and none suited playing expansive. Four drama scenes were added from public-domain plays, each read from
 *   its text before it was measured (`content/scenes-public.ts`): a quarrel between brothers, a strike leader before a
 *   board, a cross-examination in a crowded court, and a master and a weaver before the workers. Held here: drama now
 *   has scenes suiting each side, the new ones suit expansive by what their texts say (spoken to many, the conflict out
 *   loud) and say so on the screen, the 25 before them suit restraint as they did, and a student meets the new ones in
 *   play once fewer than four earlier scenes fit the draw as well.
 * - **Restraint's draw.** Restrained drew on emotional depth alone until 2026-10-16; it draws on composure and focus
 *   too since, the calm and the inner line that hold the feeling (Stanislavski, "Internal and External Control and the
 *   Finishing Touches"; `APPROACH_EFFECT`). So a restrained take of a class scene rises more with each than an expansive
 *   take of the same scene does (focus is read there too where a scene is built on timing, as Hedda's is).
 *
 * Every performer is TEST SETUP (levels set directly), the scene judged as `tools/interpretation.ts --stage` judges it.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { EvalContext, Performer } from '@/engine/systems/evaluation';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { PLAY_MATERIAL, SCENE_MATERIAL, type MaterialProfile } from '@/engine/content/material';
import { SCENES, templateById } from '@/engine/content/coursework';
import { PUBLIC_SCENES } from '@/engine/content/scenes-public';
import { CIRCUMSTANCE_AFFINITY } from '@/engine/content/interpretation';
import { difficultyOf } from '@/engine/systems/coursework';
import { materialContext, misfitOf } from '@/engine/systems/material';
import { judgePiece, loadOf, toneSegments } from '@/engine/systems/piece';
import { PIECE } from '@/engine/content/piece';
import { sceneOfMaterial, suitabilityOf } from '@/engine/systems/interpretation';
import { scenesFor, type Worked } from '@/engine/systems/learning';
import { MaterialDemands } from '@/ui/components/PlayingChooser';

const task = TASK_PROFILES.scene!;
const difficulty = difficultyOf(templateById('scene-study')!);
const byId = (id: string) => [...SCENE_MATERIAL, ...PLAY_MATERIAL].find((m) => m.id === id)!;
const judgeOn = (m: MaterialProfile, p: Performer, scale: 'restrained' | 'expansive') => {
  const read = materialContext(task, m, { scale, chosenAt: 0, prep: 1 });
  const prep = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1, approach: 1 };
  const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: `stage:${m.id}`, expected: true };
  return judgePiece('integration', p, ctx, { segments: toneSegments(m.tones, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') });
};
const actor = (ab: Record<string, number>): Performer => ({ ability: (id) => ab[id] ?? 55, full: () => 100, technique: () => 50 });
const suits = (m: MaterialProfile) => { const sc = sceneOfMaterial(m); return { r: suitabilityOf('restrained', m, sc), e: suitabilityOf('expansive', m, sc) }; };
const NEW = PUBLIC_SCENES.map((s) => s.id);
const drama = [...SCENE_MATERIAL, ...PLAY_MATERIAL].filter((m) => sceneOfMaterial(m).genre === 'drama' && !misfitOf('scale', 'restrained', m) && !misfitOf('scale', 'expansive', m));

describe('ST4: drama suits each side somewhere, from what its scenes are', () => {
  it('the catalog’s drama has scenes where restraint suits better and scenes where size does, and every one of the 25 before 2026-10-16 still suits restraint', () => {
    const before = drama.filter((m) => !NEW.includes(m.id));
    expect(before).toHaveLength(25);
    for (const m of before) { const { r, e } = suits(m); expect(r.s, m.id).toBeGreaterThan(e.s); }
    const added = drama.filter((m) => NEW.includes(m.id));
    expect(added.map((m) => m.id).sort()).toEqual([...NEW].sort());
    expect(added.filter((m) => { const { r, e } = suits(m); return e.s > r.s; }).length).toBeGreaterThanOrEqual(1);
  });

  it('a scene in a crowded court and one before the Board suit size for what they are, spoken to many and fought out loud, and the screen says so with each reason', () => {
    for (const id of ['justice-2', 'strife-1']) {
      const m = byId(id);
      const { r, e } = suits(m);
      expect(e.s - r.s, id).toBeGreaterThanOrEqual(0.25);
      // The side it suits rests on its circumstances, not on the house (which pulls no scale) or the genre's register,
      // which leans to restraint for drama.
      const top = e.signals.filter((g) => g.v > 0).map((g) => g.source);
      expect(top, id).toEqual(expect.arrayContaining([CIRCUMSTANCE_AFFINITY.address.label, CIRCUMSTANCE_AFFINITY.confrontation.label]));
      const html = renderToStaticMarkup(createElement(MaterialDemands, { material: m })).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      for (const c of ['address', 'confrontation'] as const) {
        expect(html).toContain(`data-circumstance="${c}"`);
        expect(html).toContain(m.why[c]!);
      }
    }
  });

  it('a student meets the new scenes in play: once every earlier prose scene of the kind is studied, Scene Study sets one of them', () => {
    const t = templateById('scene-study')!;
    const fresh = scenesFor(t, 'DRAM 103a', [], 3);
    // Appended last, so with nothing studied they come after every earlier scene that fits as well.
    const earlier = fresh.filter((s) => !NEW.includes(s.id));
    expect(fresh.slice(0, earlier.length).every((s) => !NEW.includes(s.id)) || fresh.findIndex((s) => NEW.includes(s.id)) > 0).toBe(true);
    const studied: Worked[] = earlier.map((s, i) => ({ id: `a${i}`, course: 'DRAM 103a', template: t.id, setOn: `2026-09-${String(1 + (i % 28)).padStart(2, '0')}`, sceneId: s.id, answers: {}, status: 'shown' }));
    const next = scenesFor(t, 'DRAM 103a', studied, 3);
    expect(NEW).toContain(next[0]!.id);
    expect(SCENES.filter((s) => NEW.includes(s.id)).every((s) => s.genre === 'drama' && s.language === 'prose')).toBe(true);
  });
});

describe('restraint draws on the calm and the line that hold the feeling', () => {
  it('on a class scene, a restrained take rises with focus and with composure, and more than an expansive take of the same scene does', () => {
    for (const id of ['hedda-2', 'enemy-2', 'trifles']) {
      const m = byId(id);
      const base = actor({});
      for (const a of ['focus', 'composure'] as const) {
        const up = actor({ [a]: 85 });
        const r = judgeOn(m, up, 'restrained').exact! - judgeOn(m, base, 'restrained').exact!;
        const e = judgeOn(m, up, 'expansive').exact! - judgeOn(m, base, 'expansive').exact!;
        expect(r, `${id} ${a} restrained`).toBeGreaterThan(0);
        expect(r, `${id} ${a}`).toBeGreaterThan(e);
      }
    }
  });
});
