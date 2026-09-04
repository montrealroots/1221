/**
 * The actor's side of the room.
 *
 * You ask for a tape or the room and the office decides what it will take;
 * a tape is sent in takes before it is due, or it is never sent; the room
 * needs you in the city; and days later the office gets back to you — a
 * callback, a hold, a release, or nothing at all, which is its own answer.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Audition, Id, Role } from '@/engine/domain/model';
import { auditionPolicyFor, auditionsFor } from '@/engine/systems/casting';
import { commissionProject } from '@/engine/systems/zeitgeist';
import { ageOn } from '@/engine/core/time';

const MS_DAY = 86_400_000;

function aWorld(seed: string, options: { strong?: boolean } = {}): { sim: Simulation; open: Role[] } {
  const sim = quickSave({ wealth: 'inherited' }, seed);
  sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
  if (options.strong ?? true) sim.execute({ kind: 'sandbox.max_attributes', payload: {} });
  for (let i = 0; i < 8; i++) commissionProject(sim, 'us', `${seed}-${i}`);
  const age = ageOn(sim.player.birthInstant, sim.now, sim.homeZone);
  const open = Object.values(sim.universe.roles).filter((r) => r.status === 'casting' && age >= r.ageRange[0] - 4 && age <= r.ageRange[1] + 6);
  return { sim, open };
}

const playerAudition = (sim: Simulation, role: Role): Audition => auditionsFor(sim, role).find((a) => a.isPlayer)!;

describe('what the office will take', () => {
  it('decides once per part, and holds you to it', () => {
    const { sim, open } = aWorld('policy');
    expect(open.length).toBeGreaterThan(3);
    const policies = new Set(open.map((r) => auditionPolicyFor(sim, r)));
    for (const role of open) expect(auditionPolicyFor(sim, role)).toBe(role.auditionPolicy);
    expect(policies.size).toBeGreaterThanOrEqual(2);

    const tapeOnly = open.find((r) => auditionPolicyFor(sim, r) === 'tape_only');
    const roomOnly = open.find((r) => auditionPolicyFor(sim, r) === 'in_person_only');
    const either = open.find((r) => auditionPolicyFor(sim, r) === 'either');
    if (tapeOnly) {
      const refused = sim.execute({ kind: 'cast.submit', payload: { roleId: tapeOnly.id, prefer: 'in_person' } });
      expect(refused.ok).toBe(false);
      expect(refused.error).toMatch(/only taking tapes/i);
      const ok = sim.execute<{ format: string }>({ kind: 'cast.submit', payload: { roleId: tapeOnly.id } });
      expect(ok.ok).toBe(true);
      expect(ok.value!.format).toBe('self_tape');
    }
    if (roomOnly) {
      const refused = sim.execute({ kind: 'cast.submit', payload: { roleId: roomOnly.id, prefer: 'tape' } });
      expect(refused.ok).toBe(false);
      expect(refused.error).toMatch(/in the room/i);
    }
    if (either) {
      const ok = sim.execute<{ format: string }>({ kind: 'cast.submit', payload: { roleId: either.id, prefer: 'in_person' } });
      expect(ok.ok).toBe(true);
      expect(ok.value!.format).toBe('in_person');
      const audition = playerAudition(sim, either);
      expect(audition.stage).toBe('first_read');
      expect(audition.format).toBe('in_person');
    }
  });
});

describe('the tape', () => {
  it('goes once, in takes that cost time, before it is due', () => {
    const { sim, open } = aWorld('tape');
    const role = open.find((r) => auditionPolicyFor(sim, r) !== 'in_person_only')!;
    const submitted = sim.execute<{ auditionId: Id; format: string }>({ kind: 'cast.submit', payload: { roleId: role.id, prefer: 'tape' } });
    expect(submitted.ok, submitted.error).toBe(true);
    const audition = playerAudition(sim, role);
    expect(audition.stage).toBe('self_tape');
    const before = sim.now;
    const energy = sim.player.wellbeing.energy;
    const sent = sim.execute<{ performanceScore: number; takes: number; note: string; sentAt: number }>({ kind: 'cast.send_tape', payload: { auditionId: audition.id, prepHours: 2, takes: 5 } });
    expect(sent.ok, sent.error).toBe(true);
    expect(sent.value!.takes).toBe(5);
    expect(sim.now - before).toBe(2 * 3_600_000 + 5 * 20 * 60_000);
    expect(sim.player.wellbeing.energy).toBeLessThan(energy);
    expect(audition.tapeSentAt).toBe(sim.now);
    expect(audition.totalScore).toBeGreaterThan(0);
    const again = sim.execute({ kind: 'cast.send_tape', payload: { auditionId: audition.id } });
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/already/i);
    // The office's answer is on the calendar, days out.
    const pending = sim.timeline.pending().find((i) => i.kind === 'cast.office_response' && i.refId === audition.id);
    const decidesSoon = role.decidesAt !== undefined && role.decidesAt <= sim.now + 22 * MS_DAY;
    if (!decidesSoon) {
      expect(pending).toBeDefined();
      expect(pending!.at).toBeGreaterThan(sim.now + 3 * MS_DAY);
    }
  });

  it('more takes make a better tape, up to a point', () => {
    // An ordinary actor, so the tape has room to get better.
    const one = aWorld('takes', { strong: false });
    const many = aWorld('takes', { strong: false });
    const pick = (w: { sim: Simulation; open: Role[] }) => w.open.find((r) => auditionPolicyFor(w.sim, r) !== 'in_person_only')!;
    const roleA = pick(one);
    const roleB = pick(many);
    expect(roleA.id).toBe(roleB.id);
    one.sim.execute({ kind: 'cast.submit', payload: { roleId: roleA.id, prefer: 'tape' } });
    many.sim.execute({ kind: 'cast.submit', payload: { roleId: roleB.id, prefer: 'tape' } });
    const a = one.sim.execute<{ performanceScore: number }>({ kind: 'cast.send_tape', payload: { auditionId: playerAudition(one.sim, roleA).id, takes: 1 } });
    const b = many.sim.execute<{ performanceScore: number }>({ kind: 'cast.send_tape', payload: { auditionId: playerAudition(many.sim, roleB).id, takes: 8 } });
    expect(b.value!.performanceScore).toBeGreaterThan(a.value!.performanceScore);
    expect(b.value!.performanceScore - a.value!.performanceScore).toBeLessThanOrEqual(7);
  });

  it('is a pass when it was never sent', () => {
    const { sim, open } = aWorld('unsent');
    const role = open.find((r) => auditionPolicyFor(sim, r) !== 'in_person_only')!;
    sim.execute({ kind: 'cast.submit', payload: { roleId: role.id, prefer: 'tape' } });
    const audition = playerAudition(sim, role);
    const reliability = sim.player.reputation.reliability;
    sim.advanceTo(audition.scheduledAt! + MS_DAY);
    expect(audition.stage).toBe('passed');
    expect(audition.feedback).toMatch(/never sent/i);
    expect(sim.player.reputation.reliability).toBeLessThan(reliability);
    expect(sim.universe.notifications.some((n) => /Tape never sent/.test(n.title))).toBe(true);
  });
});

describe('the room', () => {
  it('needs you in the city, and the office gets back to you after', () => {
    const { sim, open } = aWorld('room');
    const role = open.find((r) => auditionPolicyFor(sim, r) !== 'tape_only')!;
    sim.execute({ kind: 'cast.submit', payload: { roleId: role.id, prefer: 'in_person' } });
    const audition = playerAudition(sim, role);
    expect(audition.format).toBe('in_person');
    expect(audition.locationId).toBeDefined();
    // Elsewhere: the room refuses you.
    const home = sim.player.currentLocationId;
    sim.player.currentLocationId = audition.locationId === 'uk-eng-london' ? 'us-ca-losangeles' : 'uk-eng-london';
    const away = sim.execute({ kind: 'cast.perform_audition', payload: { auditionId: audition.id, prepHours: 1 } });
    expect(away.ok).toBe(false);
    expect(away.error).toMatch(/get there/i);
    // In the city: the read happens, and the answer is scheduled.
    sim.player.currentLocationId = audition.locationId!;
    const read = sim.execute<{ performanceScore: number; feedback: string }>({ kind: 'cast.perform_audition', payload: { auditionId: audition.id, prepHours: 2 } });
    expect(read.ok, read.error).toBe(true);
    expect(read.value!.feedback.length).toBeGreaterThan(5);
    sim.player.currentLocationId = home;
    const decidesSoon = role.decidesAt !== undefined && role.decidesAt <= sim.now + 15 * MS_DAY;
    if (!decidesSoon) {
      expect(sim.timeline.pending().some((i) => i.kind === 'cast.office_response' && i.refId === audition.id)).toBe(true);
    }
  });
});

describe('hearing back', () => {
  it('answers every tape one way or another, and the answer matches where you stood', () => {
    const outcomes = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const { sim, open } = aWorld(`hear-${i}`);
      const roles = open.filter((r) => auditionPolicyFor(sim, r) !== 'in_person_only').slice(0, 3);
      for (const role of roles) {
        const ok = sim.execute({ kind: 'cast.submit', payload: { roleId: role.id, prefer: 'tape' } });
        if (!ok.ok) continue;
        const audition = playerAudition(sim, role);
        sim.execute({ kind: 'cast.send_tape', payload: { auditionId: audition.id, takes: 3 } });
      }
      sim.advanceTo(sim.now + 30 * MS_DAY);
      for (const role of roles) {
        const audition = playerAudition(sim, role);
        if (!audition?.tapeSentAt) continue;
        const answer = audition.officeResponse;
        const decided = audition.decidedAt !== undefined || sim.universe.roles[role.id]?.status !== 'casting';
        // Either the office wrote, or the part decided first. Never limbo.
        expect(answer !== undefined || decided, `${role.characterName}: no answer and no decision`).toBe(true);
        if (answer) {
          outcomes.set(answer.kind, (outcomes.get(answer.kind) ?? 0) + 1);
          expect(answer.note.length).toBeGreaterThan(8);
          if (answer.kind === 'pass') {
            expect(audition.stage).toBe('passed');
            expect(audition.feedback).toBe(answer.note);
          }
          if (answer.kind === 'callback') {
            expect(['callback', 'offer', 'passed', 'screen_test', 'chemistry_read']).toContain(audition.stage);
          }
          if (answer.kind !== 'silence') {
            expect(sim.universe.notifications.some((n) => n.refId === audition.id)).toBe(true);
          }
        }
      }
    }
    // Across eighteen tapes the answers are not all the same one.
    expect(outcomes.size).toBeGreaterThanOrEqual(2);
  });

  it('never answers twice', () => {
    const { sim, open } = aWorld('once');
    const role = open.find((r) => auditionPolicyFor(sim, r) !== 'in_person_only')!;
    sim.execute({ kind: 'cast.submit', payload: { roleId: role.id, prefer: 'tape' } });
    const audition = playerAudition(sim, role);
    sim.execute({ kind: 'cast.send_tape', payload: { auditionId: audition.id, takes: 2 } });
    sim.advanceTo(sim.now + 40 * MS_DAY);
    const answers = sim.universe.notifications.filter((n) => n.refId === audition.id && /Callback|On hold|Released/.test(n.title));
    expect(answers.length).toBeLessThanOrEqual(1);
    const memories = sim.universe.history.filter((m) => /Casting got back to you|No word from casting/.test(m.title) && m.detail.includes(role.characterName));
    expect(memories.length).toBeLessThanOrEqual(1);
  });
});
