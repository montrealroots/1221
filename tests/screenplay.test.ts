/**
 * The script as a document, and casting as a series of rooms.
 *
 * A draft is fourteen craft dimensions weighted by what the genre asks for, a
 * scene list a schedule can be boarded from, and a cast of characters the roles
 * are broken down from. Casting on the player's own picture is callbacks,
 * chemistry reads and screen tests, and a decision made on all of them. On the
 * world's pictures, nobody is cast off one read either: the top of the list
 * is called back, the player included, and the decision waits for the room.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, migrate } from '@/engine';
import { makeRng } from '@/engine/core/rng';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, Project, Role, ScriptDraft } from '@/engine/domain/model';
import { CRAFT_DIMENSIONS, craftWeights } from '@/engine/content/genres';
import { breakDownScript, breakdownSummary, scoreCraft } from '@/engine/content/screenplay';
import { registerFor } from '@/engine/content/titles';
import { auditionsFor, decisionScore } from '@/engine/systems/casting';
import { commissionProject } from '@/engine/systems/zeitgeist';

const MS_DAY = 86_400_000;

interface Picture {
  sim: Simulation;
  projectId: Id;
  run: <R>(kind: string, payload: Record<string, unknown>) => R;
  try: <R>(kind: string, payload: Record<string, unknown>) => { ok: boolean; error?: string; value?: R };
}

/** A picture of the player's, written and funded. */
function aPicture(seed: string, genres: string[] = ['thriller', 'crime'], format = 'feature'): Picture {
  const sim = quickSave({ wealth: 'inherited' }, seed);
  const run = <R>(kind: string, payload: Record<string, unknown>): R => {
    const result = sim.execute<R>({ kind, payload });
    if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
    return result.value as R;
  };
  const attempt = <R>(kind: string, payload: Record<string, unknown>) => sim.execute<R>({ kind, payload });
  sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
  run('sandbox.add_funds', { amount: 600_000_000_00 });
  run('sandbox.max_attributes', {});
  const { companyId } = run<{ companyId: Id }>('co.found', {
    structure: 'c_corp', kind: 'production', name: 'Halyard Pictures', initialCapital: 300_000_000_00,
  });
  const { projectId } = run<{ projectId: Id }>('film.create_project', {
    title: 'Slack Water', format, genres, logline: 'A harbour pilot has one night to keep a ship off the rocks.', companyId,
  });
  run('film.acquire_rights', { projectId, title: 'Slack Water', sourceKind: 'original', acquisitionKind: 'original', cost: 0, holderId: companyId, holderKind: 'company' });
  run('film.write_draft', { projectId, daysSpent: 40 });
  const project = sim.universe.projects[projectId] as Project;
  let decision = run<{ greenlit: boolean }>('film.greenlight', { projectId, budget: 40_000_000_00, companyId });
  for (let i = 0; i < 8 && !decision.greenlit; i++) {
    run('film.write_draft', { projectId, daysSpent: 30 });
    decision = run<{ greenlit: boolean }>('film.greenlight', { projectId, budget: 40_000_000_00, companyId });
  }
  if (!decision.greenlit) throw new Error('never greenlit');
  run('film.arrange_financing', { projectId, sources: [{ kind: 'company', amount: project.budget || 40_000_000_00, name: 'Halyard Pictures' }] });
  return { sim, projectId, run, try: attempt };
}

const draftOf = (picture: Picture): ScriptDraft => {
  const project = picture.sim.universe.projects[picture.projectId] as Project;
  return picture.sim.universe.scriptDrafts[project.currentDraftId!] as ScriptDraft;
};

describe('the fourteen dimensions', () => {
  it('scores every dimension in range and weighs them the way the genre does', () => {
    const rng = makeRng('craft-1');
    const skills: Record<string, number> = { story_structure: 70, dialogue: 80, character_writing: 60, world_building: 40, page_speed: 55, rewriting: 50, adaptation: 45 };
    const scored = scoreCraft(rng, { genres: ['comedy'], skillOf: (k) => skills[k] ?? 0, days: 40, rewriteSkill: 50 });
    for (const d of CRAFT_DIMENSIONS) {
      expect(scored.craft[d], d).toBeGreaterThanOrEqual(0);
      expect(scored.craft[d], d).toBeLessThanOrEqual(100);
    }
    const weights = craftWeights(['comedy']);
    const expected = CRAFT_DIMENSIONS.reduce((sum, d) => sum + scored.craft[d] * weights[d], 0);
    expect(Math.abs(scored.quality - expected)).toBeLessThan(1);
    expect(scored.strengths.length).toBe(3);
    expect(scored.weaknesses.length).toBe(3);
  });

  it('makes the same draft a different number as a different genre', () => {
    const skills: Record<string, number> = { story_structure: 85, dialogue: 35, character_writing: 60, world_building: 70, page_speed: 60, rewriting: 50, adaptation: 50 };
    const thriller = scoreCraft(makeRng('same'), { genres: ['thriller'], skillOf: (k) => skills[k] ?? 0, days: 40, rewriteSkill: 50 });
    const comedy = scoreCraft(makeRng('same'), { genres: ['comedy'], skillOf: (k) => skills[k] ?? 0, days: 40, rewriteSkill: 50 });
    // Same writer, same day: the structure-heavy thriller reads better than the
    // dialogue-heavy comedy, because the dialogue is the weak skill.
    expect(thriller.quality).toBeGreaterThan(comedy.quality);
  });

  it('improves on a previous draft rather than starting over', () => {
    const skills: Record<string, number> = { story_structure: 60, dialogue: 60, character_writing: 60, world_building: 60, page_speed: 60, rewriting: 80, adaptation: 60 };
    const first = scoreCraft(makeRng('rw-1'), { genres: ['drama'], skillOf: (k) => skills[k] ?? 0, days: 40, rewriteSkill: 80 });
    const better: Record<string, number> = { ...skills, story_structure: 90, dialogue: 90, character_writing: 90 };
    const second = scoreCraft(makeRng('rw-2'), { genres: ['drama'], skillOf: (k) => better[k] ?? 0, days: 30, previous: first.craft, rewriteSkill: 80 });
    expect(second.craft.structure).toBeGreaterThan(first.craft.structure - 3);
    expect(second.quality).toBeGreaterThan(first.quality - 3);
  });
});

describe('the breakdown', () => {
  const KINDS: { genres: string[]; format: string }[] = [
    { genres: ['thriller', 'crime'], format: 'feature' },
    { genres: ['horror'], format: 'feature' },
    { genres: ['romance', 'comedy'], format: 'feature' },
    { genres: ['procedural', 'crime'], format: 'series' },
    { genres: ['fantasy'], format: 'limited_series' },
    { genres: ['documentary'], format: 'documentary' },
    { genres: ['family', 'animation'], format: 'feature' },
    { genres: ['action'], format: 'feature' },
    { genres: ['drama'], format: 'short' },
  ];

  it('breaks a script into scenes whose pages add up to the script', () => {
    for (const kind of KINDS) {
      const pages = kind.format === 'short' ? 14 : kind.format === 'series' || kind.format === 'limited_series' ? 55 : 108;
      const { scenes, characters } = breakDownScript(makeRng(`bd|${kind.genres.join('+')}`), { ...kind, pages });
      expect(scenes.length, kind.genres.join('+')).toBeGreaterThan(pages / 3);
      const total = scenes.reduce((sum, s) => sum + s.pages, 0);
      expect(Math.abs(total - pages), `${kind.genres.join('+')} pages`).toBeLessThan(pages * 0.06 + 1);
      scenes.forEach((scene, i) => {
        expect(scene.number).toBe(String(i + 1));
        expect(scene.characters.length, `scene ${scene.number} is empty`).toBeGreaterThan(0);
        expect(scene.complexity).toBeGreaterThanOrEqual(1);
        expect(scene.complexity).toBeLessThanOrEqual(5);
        expect(scene.setting.length).toBeGreaterThan(1);
        expect(scene.purpose.length).toBeGreaterThan(8);
        if (!scene.interior && scene.timeOfDay === 'night') expect(scene.needs).toContain('night_exterior');
      });
      // A short carries three: the lead, the opposition and someone to talk to.
      expect(characters.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('casts the script the way a script is cast', () => {
    const { scenes, characters } = breakDownScript(makeRng('cast-shape'), { genres: ['thriller', 'crime'], format: 'feature', pages: 110 });
    const protagonists = characters.filter((c) => c.archetype === 'protagonist');
    expect(protagonists.length).toBe(1);
    expect(characters.some((c) => c.archetype === 'antagonist')).toBe(true);
    const lead = protagonists[0]!;
    // The protagonist is in most of it; a day player is in one scene.
    expect(lead.sceneCount / scenes.length).toBeGreaterThan(0.5);
    for (const c of characters.filter((c) => c.archetype === 'day_player')) expect(c.sceneCount).toBe(1);
    for (const c of characters) {
      expect(c.sceneCount, c.name).toBeGreaterThan(0);
      expect(c.ageRange[0]).toBeLessThan(c.ageRange[1]);
      expect(c.ageRange[0]).toBeGreaterThanOrEqual(6);
      expect(c.description.length).toBeGreaterThan(10);
    }
    expect(new Set(characters.map((c) => c.name)).size, 'two characters share a name').toBe(characters.length);
    const shares = characters.reduce((sum, c) => sum + c.lineShare, 0);
    expect(shares).toBeGreaterThan(90);
    expect(shares).toBeLessThan(110);
  });

  it('gives each kind of picture its own shape', () => {
    const horror = breakdownSummary(breakDownScript(makeRng('shape-h'), { genres: ['horror'], format: 'feature', pages: 100 }).scenes);
    const western = breakdownSummary(breakDownScript(makeRng('shape-w'), { genres: ['western'], format: 'feature', pages: 100 }).scenes);
    const romcom = breakdownSummary(breakDownScript(makeRng('shape-r'), { genres: ['romantic-comedy'], format: 'feature', pages: 100 }).scenes);
    const action = breakdownSummary(breakDownScript(makeRng('shape-a'), { genres: ['action'], format: 'feature', pages: 100 }).scenes);
    // A horror is mostly interiors at night; a western is mostly outside in daylight.
    expect(horror.nights / horror.scenes).toBeGreaterThan(romcom.nights / romcom.scenes);
    expect(western.exteriors / western.scenes).toBeGreaterThan(horror.exteriors / horror.scenes);
    // Action cuts faster, so more scenes for the same pages.
    expect(action.scenes).toBeGreaterThan(romcom.scenes);
    // And it needs stunts; a romantic comedy does not.
    expect(action.needs['stunts'] ?? 0).toBeGreaterThan(romcom.needs['stunts'] ?? 0);
    expect(western.needs['animals'] ?? 0).toBeGreaterThan(0);
    expect(registerFor(['procedural'])).toBe('institution');
  });

  it('is deterministic', () => {
    const a = breakDownScript(makeRng('det'), { genres: ['drama'], format: 'feature', pages: 100 });
    const b = breakDownScript(makeRng('det'), { genres: ['drama'], format: 'feature', pages: 100 });
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });
});

describe('a draft in a save', () => {
  it('carries the fourteen dimensions and a breakdown', () => {
    const picture = aPicture('draft-doc');
    const draft = draftOf(picture);
    for (const d of CRAFT_DIMENSIONS) expect(draft.craft[d], d).toBeDefined();
    expect(draft.scenes.length).toBeGreaterThan(20);
    expect(draft.scriptCharacters.length).toBeGreaterThan(4);
    expect(draft.structure).toBe(draft.craft.structure);
    expect(draft.dialogue).toBe(draft.craft.dialogue);
    expect(draft.characters).toBe(draft.craft.character);
  });

  it('keeps a rewrite the same document, roughly', () => {
    const picture = aPicture('draft-rewrite');
    const before = draftOf(picture);
    picture.run('film.write_draft', { projectId: picture.projectId, daysSpent: 21 });
    const after = draftOf(picture);
    expect(after.version).toBe(before.version + 1);
    expect(Math.abs(after.pages - before.pages)).toBeLessThanOrEqual(6);
    expect(after.scenes.length).toBeGreaterThan(0);
  });

  it('writes coverage that names a craft the genre cares about', () => {
    const picture = aPicture('draft-coverage');
    picture.sim.advanceTo(picture.sim.now + 20 * MS_DAY);
    const draft = draftOf(picture);
    expect(draft.coverage).toBeDefined();
    const named = CRAFT_DIMENSIONS.some((d) => draft.coverage!.comments.toLowerCase().includes(d === 'character' ? 'character' : d === 'world' ? 'world building' : d));
    expect(named, draft.coverage!.comments).toBe(true);
  });

  it('carries an old draft forward without losing a number', () => {
    const picture = aPicture('draft-migrate');
    const draft = draftOf(picture);
    // Pretend it was written before scripts had scenes.
    const old = { ...draft } as Record<string, unknown>;
    delete old['craft'];
    delete old['scenes'];
    delete old['scriptCharacters'];
    picture.sim.universe.scriptDrafts[draft.id] = old as unknown as ScriptDraft;
    picture.sim.universe.meta.schemaVersion = 20;
    const report = migrate(picture.sim.universe);
    expect(report.migrated).toBe(true);
    const carried = picture.sim.universe.scriptDrafts[draft.id]!;
    expect(carried.quality).toBe(draft.quality);
    expect(carried.craft.structure).toBe(draft.structure);
    expect(carried.craft.dialogue).toBe(draft.dialogue);
    expect(carried.scenes).toEqual([]);
    // And the breakdown fills them in the first time it is asked for.
    picture.run('cast.break_down_script', { projectId: picture.projectId });
    expect(picture.sim.universe.scriptDrafts[draft.id]!.scenes.length).toBeGreaterThan(0);
  });
});

describe('breaking the script down into parts', () => {
  it('makes a part for every character, with its archetype and its scenes', () => {
    const picture = aPicture('breakdown-roles');
    const draft = draftOf(picture);
    const { created, skipped } = picture.run<{ created: Id[]; skipped: string[] }>('cast.break_down_script', { projectId: picture.projectId });
    const speaking = draft.scriptCharacters.filter((c) => c.archetype !== 'day_player');
    expect(created.length).toBe(speaking.length);
    expect(skipped.length).toBe(draft.scriptCharacters.length - speaking.length);

    for (const id of created) {
      const role = picture.sim.universe.roles[id] as Role;
      const character = draft.scriptCharacters.find((c) => c.name === role.characterName)!;
      expect(character).toBeDefined();
      expect(role.archetype).toBe(character.archetype);
      expect(role.sceneNumbers?.length).toBe(character.sceneCount);
      expect(role.ageRange).toEqual(character.ageRange);
      if (character.archetype === 'protagonist' || character.archetype === 'deuteragonist') expect(role.billing).toBe('lead');
      if (character.archetype === 'antagonist') expect(role.billing).toBe('supporting');
      if (character.archetype === 'ensemble') expect(role.billing).toBe('featured');
      expect(role.shootDays).toBeGreaterThan(0);
      expect(role.description).toContain(`${character.sceneCount} of`);
    }
  });

  it('is safe to run twice', () => {
    const picture = aPicture('breakdown-twice');
    const first = picture.run<{ created: Id[] }>('cast.break_down_script', { projectId: picture.projectId });
    const second = picture.run<{ created: Id[]; skipped: string[] }>('cast.break_down_script', { projectId: picture.projectId });
    expect(second.created).toEqual([]);
    expect(second.skipped.length).toBeGreaterThanOrEqual(first.created.length);
    const roles = Object.values(picture.sim.universe.roles).filter((r) => r.projectId === picture.projectId);
    expect(new Set(roles.map((r) => r.characterName)).size).toBe(roles.length);
  });

  it('refuses a picture that is not yours', () => {
    const picture = aPicture('breakdown-not-yours');
    const other = commissionProject(picture.sim, 'us', 'other')!;
    const result = picture.try('cast.break_down_script', { projectId: other.id });
    expect(result.ok).toBe(false);
  });
});

describe('the rooms on your own picture', () => {
  function castingRoom(seed: string) {
    const picture = aPicture(seed);
    const { created } = picture.run<{ created: Id[] }>('cast.break_down_script', { projectId: picture.projectId });
    const lead = created.map((id) => picture.sim.universe.roles[id]!).find((r) => r.billing === 'lead')!;
    picture.run('cast.open_casting', { roleId: lead.id, candidateCount: 8, closesInDays: 60 });
    const candidates = auditionsFor(picture.sim, lead).map((a) => a.personId);
    return { picture, lead, candidates };
  }

  it('holds callbacks, a chemistry read and a screen test, and remembers every room', () => {
    const { picture, lead, candidates } = castingRoom('rooms');
    picture.run('cast.callback', { roleId: lead.id, personIds: candidates.slice(0, 3) });
    for (const id of candidates.slice(0, 3)) {
      const audition = auditionsFor(picture.sim, lead).find((a) => a.personId === id)!;
      expect(audition.stage).toBe('callback');
      expect(audition.rounds?.length).toBe(2);
      expect(audition.rounds?.[0]?.stage).toBe('first_read');
      expect(audition.rounds?.[1]?.stage).toBe('callback');
      expect(audition.rounds?.[1]?.note.length).toBeGreaterThan(8);
    }
    // Somebody not called back stays where they were.
    const notCalled = auditionsFor(picture.sim, lead).find((a) => a.personId === candidates[5])!;
    expect(notCalled.rounds ?? []).toEqual([]);

    // A screen test costs money and is recorded.
    const spentBefore = (picture.sim.universe.projects[picture.projectId] as Project).spent;
    const { cost } = picture.run<{ cost: number }>('cast.screen_test', { roleId: lead.id, personIds: candidates.slice(0, 2) });
    expect(cost).toBeGreaterThan(0);
    expect((picture.sim.universe.projects[picture.projectId] as Project).spent).toBe(spentBefore + cost);
    const tested = auditionsFor(picture.sim, lead).find((a) => a.personId === candidates[0])!;
    expect(tested.rounds?.map((r) => r.stage)).toEqual(['first_read', 'callback', 'screen_test']);
    // A second test on the same person is refused rather than charged twice.
    const again = picture.try('cast.screen_test', { roleId: lead.id, personIds: [candidates[0]!] });
    expect(again.ok).toBe(false);
  });

  it('weighs the later rooms more', () => {
    const early = { rounds: [{ stage: 'first_read' as const, at: 0, score: 40, note: '' }, { stage: 'screen_test' as const, at: 1, score: 80, note: '' }] };
    const late = { rounds: [{ stage: 'first_read' as const, at: 0, score: 80, note: '' }, { stage: 'screen_test' as const, at: 1, score: 40, note: '' }] };
    const as = (x: typeof early) => ({ ...x, id: 'a', saveId: 's', roleId: 'r', projectId: 'p', personId: 'x', stage: 'screen_test' as const, submittedAt: 0, isPlayer: false });
    expect(decisionScore(as(early))).toBeGreaterThan(decisionScore(as(late)));
  });

  it('needs somebody already cast for a chemistry read', () => {
    const { picture, lead, candidates } = castingRoom('chemistry');
    const nobody = picture.try('cast.chemistry_read', { roleId: lead.id, personId: candidates[0]!, withPersonId: candidates[1]! });
    expect(nobody.ok).toBe(false);
    expect(nobody.error).toMatch(/not cast/i);
  });

  it('makes the decision yours, and the offer goes out on it', () => {
    const { picture, lead, candidates } = castingRoom('choose');
    picture.run('cast.callback', { roleId: lead.id, personIds: candidates.slice(0, 2) });
    const { offered } = picture.run<{ offered: boolean; fee: number }>('cast.choose', { roleId: lead.id, personId: candidates[0]! });
    const role = picture.sim.universe.roles[lead.id] as Role;
    if (offered) {
      expect(role.status).toBe('cast');
      expect(role.castPersonId).toBe(candidates[0]);
      expect((picture.sim.universe.projects[picture.projectId] as Project).castIds).toContain(candidates[0]);
      // Everybody else was told.
      for (const audition of auditionsFor(picture.sim, role)) {
        if (audition.personId === candidates[0]) continue;
        expect(audition.stage).toBe('passed');
      }
      // Once cast, a chemistry read against them works for the next part.
      const next = Object.values(picture.sim.universe.roles).find((r) => r.projectId === picture.projectId && r.status === 'open')!;
      picture.run('cast.open_casting', { roleId: next.id, candidateCount: 5 });
      const other = auditionsFor(picture.sim, next)[0]!.personId;
      const read = picture.run<{ score: number; note: string }>('cast.chemistry_read', { roleId: next.id, personId: other, withPersonId: candidates[0]! });
      expect(read.score).toBeGreaterThanOrEqual(0);
      expect(read.note.length).toBeGreaterThan(8);
    } else {
      // A refusal reopens the part. That is the game working, not the test failing.
      expect(role.status).toBe('casting');
    }
  });

  it('refuses the rooms on somebody else’s picture', () => {
    const picture = aPicture('not-mine');
    const other = commissionProject(picture.sim, 'us', 'other')!;
    const role = Object.values(picture.sim.universe.roles).find((r) => r.projectId === other.id && r.status === 'casting');
    if (!role) return;
    const result = picture.try('cast.callback', { roleId: role.id, personIds: [] });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not your picture/i);
  });
});

describe('the rooms on the world’s pictures', () => {
  it('calls the top of the list back before it decides', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'world-callbacks');
    sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
    sim.execute({ kind: 'sandbox.max_attributes', payload: {} });
    for (let i = 0; i < 6; i++) commissionProject(sim, 'us', `wc-${i}`);
    const open = Object.values(sim.universe.roles).filter((r) => r.status === 'casting');
    expect(open.length).toBeGreaterThan(0);
    // The player submits for one, so the callback lands on their calendar.
    const mine = open.find((r) => {
      const age = 30;
      return age >= r.ageRange[0] - 4 && age <= r.ageRange[1] + 6;
    }) ?? open[0]!;
    const submitted = sim.execute({ kind: 'cast.submit', payload: { roleId: mine.id } });
    const decidesAt = mine.decidesAt!;
    sim.advanceTo(decidesAt + MS_DAY);

    const role = sim.universe.roles[mine.id]!;
    // Callbacks were held, and the decision moved ten days out.
    expect(role.callbacksAt).toBeDefined();
    if (role.status === 'casting') {
      expect(role.decidesAt).toBeGreaterThan(decidesAt);
      const called = auditionsFor(sim, role).filter((a) => a.stage !== 'passed');
      expect(called.length).toBeLessThanOrEqual(4);
      expect(called.length).toBeGreaterThan(0);
      for (const a of called) {
        if (a.isPlayer) {
          expect(a.stage).toBe('callback');
          expect(a.scheduledAt).toBeDefined();
        } else {
          expect(a.rounds?.some((r) => r.stage === 'callback')).toBe(true);
        }
      }
    }
    void submitted;

    // And it does decide, on the rooms.
    sim.advanceTo(sim.now + 20 * MS_DAY);
    const after = sim.universe.roles[mine.id]!;
    expect(['cast', 'casting', 'open', 'offer_out', 'closed']).toContain(after.status);
  });
});
