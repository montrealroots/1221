/**
 * God mode.
 *
 * Sandbox used to be a stat editor. With god mode on the world stops saying no
 * to the player entirely: every audition books, every agency signs, and every
 * offer, greenlight, pitch and purchase goes through.
 *
 * The two things these tests care about most are the two easiest to get wrong.
 * One: nothing leaves the nought-to-a-hundred scale every formula in the game
 * is built for — god mode puts the player at the top of it, it does not raise
 * it. Two: none of it is hidden. Every override is logged, and a save played
 * this way can be recognised as one.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id } from '@/engine/domain/model';
import { AGENCIES } from '@/engine/content/industry';
import { PROFESSIONS } from '@/engine/content/professions';
import { ATTRIBUTES, TRAITS, effectiveAttributes } from '@/engine/domain/attributes';
import { SKILLS } from '@/engine/domain/skills';
import { REAL_CEILING, godMode, ratingLabel, transcend } from '@/engine/systems/sandbox';

function aGame(seed: string, { god = false } = {}) {
  const sim = quickSave({ wealth: 'inherited' }, seed);
  const run = <R>(kind: string, payload: Record<string, unknown> = {}): R => {
    const result = sim.execute<R>({ kind, payload });
    if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
    return result.value as R;
  };
  run('sandbox.toggle', { enabled: true });
  if (god) run('sandbox.god_mode', { enabled: true });
  return { sim, run };
}

describe('turning it on', () => {
  it('will not turn on with sandbox off', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'god-off');
    const refused = sim.execute({ kind: 'sandbox.god_mode', payload: { enabled: true } });
    expect(refused.ok).toBe(false);
    expect(sim.universe.sandbox.godMode).toBe(false);
  });

  it('does everything at once', () => {
    const { sim } = aGame('god-everything', { god: true });
    expect(godMode(sim)).toBe(true);

    for (const attribute of ATTRIBUTES) expect(sim.player.attributes[attribute.id]).toBe(REAL_CEILING);
    for (const skill of SKILLS) expect(sim.player.skills[skill.id]).toBe(REAL_CEILING);
    // Every trait that does not contradict one already held.
    expect(sim.player.traits.length).toBeGreaterThan(TRAITS.length / 2);
    for (const def of PROFESSIONS) expect(sim.player.professions?.[def.id]).toBeDefined();
    expect(sim.universe.sandbox.allProfessionsUnlocked).toBe(true);
  });

  it('opens every profession without spending the experience', () => {
    const { sim, run } = aGame('god-xp');
    const before = sim.player.industryXp ?? 0;
    const cheapest = Math.min(...PROFESSIONS.map((p) => p.unlockXp));
    expect(before).toBeLessThan(cheapest);
    run('sandbox.unlock_professions');
    expect(sim.player.industryXp ?? 0).toBe(before);
    for (const def of PROFESSIONS) expect(sim.player.professions?.[def.id]).toBeDefined();
  });

  it('turning it off puts the ceiling back and keeps what was given', () => {
    const { sim, run } = aGame('god-off-again', { god: true });
    const traits = sim.player.traits.length;
    run('sandbox.god_mode', { enabled: false });
    expect(godMode(sim)).toBe(false);
    // Unwinding a career is worse than having cheated at one.
    expect(sim.player.traits).toHaveLength(traits);
    for (const def of PROFESSIONS) expect(sim.player.professions?.[def.id]).toBeDefined();
  });
});

describe('it never leaves the scale the game is built for', () => {
  it('puts the player at the top of the real ceiling and no higher', () => {
    const { sim } = aGame('god-ceiling', { god: true });
    expect(transcend(sim, 12)).toBe(REAL_CEILING);
    const effective = effectiveAttributes(sim.player.attributes, sim.player.traits);
    for (const value of Object.values(effective)) expect(value).toBeLessThanOrEqual(REAL_CEILING);
  });

  it('keeps every score the player earns inside nought to a hundred', () => {
    const { sim, run } = aGame('god-inrange', { god: true });
    const staged = run<{ auditionId: Id }>('sandbox.stage_audition', {});
    run('cast.enter_room', { auditionId: staged.auditionId, prepHours: 0 });
    run('cast.leave_room', { auditionId: staged.auditionId });
    const audition = sim.universe.auditions[staged.auditionId]!;
    for (const value of [audition.performanceScore, audition.totalScore, audition.room?.verdict?.score]) {
      if (value === undefined) continue;
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(REAL_CEILING);
    }
    for (const occupant of audition.room!.occupants) {
      expect(occupant.impression).toBeLessThanOrEqual(REAL_CEILING);
    }
  });

  it('names the top of the scale, in Title Case like every other label', () => {
    expect(ratingLabel(REAL_CEILING, 'work')).toBe('Masterpiece');
    expect(ratingLabel(REAL_CEILING)).toBe('The Best There Is');
    for (const score of [0, 30, 45, 60, 75, 90, 100]) {
      for (const of of ['person', 'work'] as const) {
        for (const word of ratingLabel(score, of).split(' ')) {
          expect(word[0]).toBe(word[0]!.toUpperCase());
        }
      }
    }
  });

  it('changes nothing at all when god mode is off', () => {
    const { sim } = aGame('god-normal');
    expect(transcend(sim, 63)).toBe(63);
    expect(godMode(sim)).toBe(false);
  });
});

describe('nothing is refused', () => {
  it('signs the player to any agency, however far above them it is', () => {
    const { sim, run } = aGame('god-agency', { god: true });
    // The hardest list in the game to get on.
    const hardest = [...AGENCIES.all()].filter((a) => a.type === 'agency')
      .sort((a, b) => b.signingThreshold - a.signingThreshold)[0]!;
    const result = run<{ signed: boolean }>('cast.seek_representation', { agencyId: hardest.id });
    expect(result.signed).toBe(true);
    expect(sim.player.representation.agencyName).toBe(hardest.name);
  });

  it('books every audition the player is in', () => {
    const { sim, run } = aGame('god-audition', { god: true });
    const staged = run<{ auditionId: Id; roleId: Id }>('sandbox.stage_audition', {});
    const first = run<{ choices: { id: string }[] }>('cast.enter_room', { auditionId: staged.auditionId, prepHours: 0 });
    let choices = first.choices;
    let guard = 0;
    while (guard++ < 20) {
      const step: { done: boolean; next?: { choices: { id: string }[] } } =
        run('cast.play_beat', { auditionId: staged.auditionId, choiceId: choices[choices.length - 1]!.id });
      if (step.done) break;
      choices = step.next!.choices;
    }
    // Even taking the worst option at every beat.
    const audition = sim.universe.auditions[staged.auditionId]!;
    expect(audition.room!.verdict!.score).toBe(REAL_CEILING);
    expect(audition.totalScore).toBe(REAL_CEILING);
  });

  it('puts the player top of the field however good everyone else is', () => {
    const { sim, run } = aGame('god-field', { god: true });
    const staged = run<{ auditionId: Id; roleId: Id }>('sandbox.stage_audition', {});
    const role = sim.universe.roles[staged.roleId]!;
    sim.advanceTo(role.decidesAt! + 60 * 60 * 1000);
    const audition = sim.universe.auditions[staged.auditionId]!;
    expect(audition.stage).not.toBe('passed');
  });
});

describe('it never pretends any of it was earned', () => {
  it('writes every override into the log', () => {
    const { sim, run } = aGame('god-log', { god: true });
    const before = sim.universe.sandbox.log.length;
    const staged = run<{ auditionId: Id }>('sandbox.stage_audition', {});
    run('cast.enter_room', { auditionId: staged.auditionId, prepHours: 0 });
    run('cast.leave_room', { auditionId: staged.auditionId });
    const log = sim.universe.sandbox.log;
    expect(log.length).toBeGreaterThan(before);
    expect(log.some((entry) => entry.action.startsWith('God mode:'))).toBe(true);
  });

  it('keeps the honest number in the audit under the given one', () => {
    const { sim, run } = aGame('god-audit', { god: true });
    const staged = run<{ auditionId: Id }>('sandbox.stage_audition', {});
    run('cast.enter_room', { auditionId: staged.auditionId, prepHours: 0 });
    run('cast.leave_room', { auditionId: staged.auditionId });
    const audit = sim.historian.auditFor('audition', staged.auditionId);
    expect(audit).toBeDefined();
    expect(audit!.summary).toMatch(/without god mode/i);
    expect(audit!.outcome).toBe('god mode');
  });

  it('caps the log rather than growing it forever', () => {
    const { sim } = aGame('god-log-cap', { god: true });
    for (let i = 0; i < 500; i++) sim.universe.sandbox.log.push({ at: sim.now, action: `Filler ${i}` });
    sim.execute({ kind: 'sandbox.god_mode', payload: { enabled: false } });
    sim.execute({ kind: 'sandbox.god_mode', payload: { enabled: true } });
    expect(sim.universe.sandbox.log.length).toBeLessThanOrEqual(600);
  });

  it('says so in what the player remembers', () => {
    const { sim } = aGame('god-memory', { god: true });
    const remembered = sim.universe.history.filter((m) => m.title.includes('God Mode'));
    expect(remembered.length).toBeGreaterThan(0);
    expect(remembered[0]!.detail).toMatch(/none of it was earned/i);
  });

  it('survives a save and a load', () => {
    const { sim } = aGame('god-save', { god: true });
    const round = JSON.parse(JSON.stringify(sim.universe)) as typeof sim.universe;
    expect(validateUniverse(round).ok).toBe(true);
    expect(round.sandbox.godMode).toBe(true);
    expect(round.sandbox.allProfessionsUnlocked).toBe(true);
  });
});

describe('an ordinary save is untouched', () => {
  it('refuses things exactly as it always did', () => {
    const sim: Simulation = quickSave({ wealth: 'modest' }, 'no-god');
    expect(godMode(sim)).toBe(false);
    // The top agency does not sign an unknown.
    const hardest = [...AGENCIES.all()].filter((a) => a.type === 'agency')
      .sort((a, b) => b.signingThreshold - a.signingThreshold)[0]!;
    const attempt = sim.execute<{ signed: boolean }>({ kind: 'cast.seek_representation', payload: { agencyId: hardest.id } });
    expect(attempt.ok).toBe(true);
    expect(attempt.value!.signed).toBe(false);
  });
});
