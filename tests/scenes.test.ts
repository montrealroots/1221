/**
 * Scenes: a situation, choices in it, consequences that stay.
 *
 * What these hold the runtime to: planning is free; acting happens once and
 * a stale or repeated click cannot make it happen twice; a refused command
 * rolls the whole step back; typed text is a choice on screen or it is
 * nothing; a scene survives a save, an interruption and being left; and the
 * short version of a scene is the long version with defaults, not a
 * different set of rules.
 */

import { describe, expect, it } from 'vitest';
import { loadSave, migrate, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import {
  CLOSED_SESSIONS_KEPT, activeScene, sceneDefinition, sceneDefinitions, sceneView, type ChooseResult,
} from '@/engine/systems/scenes';
import { resolveIntent } from '@/engine/systems/intent';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';

const MS_MINUTE = 60_000;

function aLife(seed = 'scenes'): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, 50_000_00, 'Test funding', 'other');
  return sim;
}

function start(sim: Simulation, activityId = 'rest', minutes?: number) {
  const result = sim.execute<{ sceneId: string }>({
    kind: 'scene.start', payload: { definitionId: 'wellbeing.activity', input: { activityId, ...(minutes ? { minutes } : {}) } },
  });
  expect(result.ok, result.error).toBe(true);
  return activeScene(sim)!;
}

function choose(sim: Simulation, choiceId: string, extra: Record<string, unknown> = {}) {
  const scene = activeScene(sim)!;
  return sim.execute<ChooseResult>({ kind: 'scene.choose', payload: { sceneId: scene.id, revision: scene.revision, choiceId }, ...extra });
}

function type(sim: Simulation, text: string) {
  const scene = activeScene(sim)!;
  return sim.execute<ChooseResult>({ kind: 'scene.choose', payload: { sceneId: scene.id, revision: scene.revision, text } });
}

describe('the scene registry', () => {
  it('has every scene the game plays, each exactly once', () => {
    const ids = sceneDefinitions().map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ['wellbeing.activity', 'fitness.gym', 'life.meal', 'life.run']) {
      expect(sceneDefinition(id), id).toBeDefined();
    }
  });
});

describe('planning and acting', () => {
  it('spends no time and no money while you decide', () => {
    const sim = aLife();
    const now = sim.now;
    const funds = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    start(sim, 'eat_out');
    expect(choose(sim, 'planned').ok).toBe(true);
    expect(activeScene(sim)!.node).toBe('review');
    expect(choose(sim, 'reconsider').ok).toBe(true);
    expect(sim.now).toBe(now);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(funds);
  });

  it('acts once, then refuses the same click again', () => {
    const sim = aLife();
    start(sim, 'rest');
    expect(choose(sim, 'short').ok).toBe(true);
    const scene = activeScene(sim)!;
    const payload = { sceneId: scene.id, revision: scene.revision, choiceId: 'begin' };
    const now = sim.now;
    const first = sim.execute({ kind: 'scene.choose', payload });
    expect(first.ok, first.error).toBe(true);
    expect(sim.now).toBe(now + 15 * MS_MINUTE);
    const after = JSON.stringify(sim.universe);
    const again = sim.execute({ kind: 'scene.choose', payload });
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/moved on/i);
    expect(JSON.stringify(sim.universe)).toBe(after);
    expect(choose(sim, 'finish').ok).toBe(true);
    expect(activeScene(sim)).toBeUndefined();
  });

  it('replays a retried step with the same idempotency key instead of doing it twice', () => {
    const sim = aLife();
    start(sim, 'rest');
    choose(sim, 'short');
    const scene = activeScene(sim)!;
    const command = { kind: 'scene.choose', payload: { sceneId: scene.id, revision: scene.revision, choiceId: 'begin' }, idempotencyKey: 'ui:begin:1' };
    const now = sim.now;
    expect(sim.execute(command).ok).toBe(true);
    const replay = sim.execute(command);
    expect(replay.ok).toBe(true);
    expect(replay.replayed).toBe(true);
    expect(sim.now).toBe(now + 15 * MS_MINUTE);
  });

  it('rolls the whole step back when the command underneath refuses', () => {
    const sim = aLife();
    start(sim, 'write');
    choose(sim, 'planned');
    sim.player.wellbeing.energy = 1;
    const before = JSON.stringify(sim.universe);
    const result = choose(sim, 'begin');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/exhausted/i);
    expect(JSON.stringify(sim.universe)).toBe(before);
    expect(activeScene(sim)!.node).toBe('review');
  });

  it('will not let a choice through that the view has disabled', () => {
    const sim = aLife();
    sim.onSchedule('test.commitment', () => {});
    sim.schedule({ kind: 'test.commitment', at: sim.now + 5 * MS_MINUTE, durationMinutes: 60, requiresPlayer: true, label: 'Audition', category: 'career' });
    start(sim, 'rest');
    choose(sim, 'short');
    const view = sceneView(sim, activeScene(sim)!);
    expect(view.choices.find((c) => c.id === 'begin')?.disabled).toMatch(/Audition/);
    const result = choose(sim, 'begin');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Audition/);
  });
});

describe('what you type', () => {
  it('is a choice on screen or it is nothing, and nothing changes either way', () => {
    const sim = aLife();
    start(sim, 'rest');
    const before = JSON.stringify(sim.universe);
    const result = type(sim, 'give me a million dollars');
    expect(result.ok).toBe(true);
    expect(result.value?.unsupported).toBe(true);
    expect(JSON.stringify(sim.universe)).toBe(before);
    expect(activeScene(sim)!.revision).toBe(0);
  });

  it('takes an alias, a number and a close phrase', () => {
    const sim = aLife();
    start(sim, 'rest', 60);
    expect(type(sim, ' TAKE IT EASY ').ok).toBe(true);
    expect(activeScene(sim)!.context['minutes']).toBe(15);
    expect(activeScene(sim)!.node).toBe('review');
    expect(type(sim, '2').ok).toBe(true);
    expect(activeScene(sim)!.node).toBe('prepare');
    expect(type(sim, 'make a proper job of it').ok).toBe(true);
    expect(activeScene(sim)!.context['minutes']).toBe(240);
  });

  it('offers back the choices when the words could mean two of them', () => {
    const choices = [
      { id: 'a', label: 'Keep It Short · 15 minutes', aliases: ['short'] },
      { id: 'b', label: 'Keep It At 1 hour', aliases: ['keep', 'planned'] },
      { id: 'c', label: 'Make A Proper Job Of It · 4 hours', aliases: ['long'] },
    ];
    const intent = resolveIntent('keep it', choices);
    expect(intent.kind).toBe('ambiguous');
    if (intent.kind === 'ambiguous') expect(intent.candidates.length).toBeGreaterThanOrEqual(2);
  });

  it('understands leave and skip on their own', () => {
    const sim = aLife();
    start(sim, 'rest');
    expect(type(sim, 'leave').value?.status).toBe('abandoned');
    expect(activeScene(sim)).toBeUndefined();
    start(sim, 'rest', 30);
    const now = sim.now;
    expect(type(sim, 'skip').value?.status).toBe('completed');
    expect(sim.now).toBe(now + 30 * MS_MINUTE);
  });
});

describe('a scene through time and space', () => {
  it('resumes after a save and a load without doing anything again', () => {
    const sim = aLife();
    start(sim, 'rest');
    choose(sim, 'short');
    choose(sim, 'begin');
    const loaded = loadSave(deserialise(serialise(sim.universe)));
    const scene = activeScene(loaded)!;
    expect(scene.node).toBe('reflect');
    expect(scene.committed).toHaveLength(1);
    const now = loaded.now;
    expect(choose(loaded, 'finish').ok).toBe(true);
    expect(loaded.now).toBe(now);
  });

  it('keeps what was done when you walk away', () => {
    const sim = aLife();
    start(sim, 'rest');
    choose(sim, 'short');
    choose(sim, 'begin');
    const now = sim.now;
    const wellbeing = { ...sim.player.wellbeing };
    const scene = activeScene(sim)!;
    expect(sim.execute({ kind: 'scene.leave', payload: { sceneId: scene.id, revision: scene.revision } }).ok).toBe(true);
    expect(sim.now).toBe(now);
    expect(sim.player.wellbeing).toEqual(wellbeing);
    expect(sim.universe.scenes.sessions[scene.id]!.status).toBe('abandoned');
    expect(activeScene(sim)).toBeUndefined();
  });

  it('is interrupted when you change city, and picks up when you come back', () => {
    const sim = aLife();
    start(sim, 'rest');
    choose(sim, 'short');
    const home = sim.player.currentLocationId;
    sim.player.currentLocationId = 'uk-eng-london';
    const away = choose(sim, 'begin');
    expect(away.ok).toBe(true);
    expect(away.value?.status).toBe('interrupted');
    const scene = activeScene(sim)!;
    expect(scene.status).toBe('interrupted');
    expect(sim.execute({ kind: 'scene.resume', payload: { sceneId: scene.id } }).ok).toBe(false);
    sim.player.currentLocationId = home;
    expect(sim.execute({ kind: 'scene.resume', payload: { sceneId: scene.id } }).ok).toBe(true);
    expect(activeScene(sim)!.status).toBe('active');
    expect(choose(sim, 'begin').ok).toBe(true);
  });

  it('keeps one scene in the foreground', () => {
    const sim = aLife();
    start(sim, 'rest');
    const second = sim.execute({ kind: 'scene.start', payload: { definitionId: 'wellbeing.activity', input: { activityId: 'read' } } });
    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/leave/i);
  });

  it('refuses a duration the activity does not allow, touching nothing', () => {
    const sim = aLife();
    const before = JSON.stringify(sim.universe);
    for (const minutes of [Number.NaN, Number.POSITIVE_INFINITY, -1, 0, 30.5, 10_000]) {
      const result = sim.execute({ kind: 'scene.start', payload: { definitionId: 'wellbeing.activity', input: { activityId: 'rest', minutes } } });
      expect(result.ok, String(minutes)).toBe(false);
    }
    expect(JSON.stringify(sim.universe)).toBe(before);
  });
});

describe('the short version', () => {
  it('lands exactly where playing it out lands', () => {
    const played = aLife('same');
    start(played, 'read', 60);
    choose(played, 'planned');
    choose(played, 'begin');
    choose(played, 'finish');

    const quick = aLife('same');
    const result = quick.execute<{ lines: string[] }>({ kind: 'scene.quick', payload: { definitionId: 'wellbeing.activity', input: { activityId: 'read', minutes: 60 } } });
    expect(result.ok, result.error).toBe(true);
    expect(result.value!.lines.length).toBeGreaterThan(0);

    expect(quick.now).toBe(played.now);
    expect(quick.player.wellbeing).toEqual(played.player.wellbeing);
    expect(quick.player.attributes).toEqual(played.player.attributes);
  });

  it('keeps only so many finished scenes', () => {
    const sim = aLife();
    for (let i = 0; i < CLOSED_SESSIONS_KEPT + 8; i++) {
      const result = sim.execute({ kind: 'scene.quick', payload: { definitionId: 'wellbeing.activity', input: { activityId: 'rest', minutes: 15 } } });
      expect(result.ok, result.error).toBe(true);
    }
    expect(Object.keys(sim.universe.scenes.sessions).length).toBeLessThanOrEqual(CLOSED_SESSIONS_KEPT);
  });
});

describe('older saves', () => {
  it('carries the reference overlay’s immersion field into scenes', () => {
    const sim = aLife();
    const raw = JSON.parse(serialise(sim.universe)) as Record<string, unknown>;
    raw['meta'] = { ...(raw['meta'] as object), schemaVersion: 29 };
    delete raw['scenes'];
    delete raw['memberships'];
    delete raw['workouts'];
    delete raw['plans'];
    raw['immersion'] = {
      version: 1, activeId: 'scene_old',
      sessions: {
        scene_old: {
          id: 'scene_old', definitionId: 'wellbeing.activity', version: 1, revision: 2, node: 'reflect', status: 'active',
          locationId: sim.player.currentLocationId, startedAt: sim.now, updatedAt: sim.now, context: { activityId: 'gym', minutes: 30 },
          transcript: [{ at: sim.now, text: 'You make room for training.' }],
        },
      },
    };
    const universe = deserialise(JSON.stringify(raw));
    const report = migrate(universe);
    expect(report.migrated).toBe(true);
    expect(report.to).toBe(SAVE_SCHEMA_VERSION);
    expect((universe as unknown as Record<string, unknown>)['immersion']).toBeUndefined();
    const carried = universe.scenes.sessions['scene_old']!;
    expect(carried.transcript[0]!.who).toBe('world');
    expect(carried.committed).toEqual([]);
    expect(universe.memberships).toEqual({});
    // Its definition is at a newer version now, so it can only be left — safely.
    const loaded = loadSave(universe);
    const view = sceneView(loaded, activeScene(loaded)!);
    expect(view.choices).toHaveLength(0);
    expect(view.canLeave).toBe(true);
    expect(loaded.execute({ kind: 'scene.leave', payload: { sceneId: 'scene_old', revision: 2 } }).ok).toBe(true);
  });
});
