/**
 * Brief 27, K3 (2026-10-24): the voice demo, Part 7's "Voice samples" and the lifecycle supplement's loop 7 ("A role or
 * representative requires materials → the player reviews what is missing or outdated → prepares or updates appropriate
 * materials → spends applicable time and resources → the engine evaluates relevant quality → materials become available
 * for submission → submissions reference a specific version ... earlier submissions and historical records remain
 * intact"). Held here: a voice recording a reel can't hold goes on a demo; a slate voice part's casting asks for one and
 * takes no submission without it; a submission sends the demo as it stood, and keeps naming it after another is mixed;
 * screen work still sends the reel; the Portfolio tab shows the demo and its control.
 *
 * PLAYER JOURNEYS: a graduate's life played by the commands a player sends (tests/fakes/career-world.ts); TEST SETUP,
 * said where it's done: the slate's voice part put on the record as a posting would leave it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MS_DAY } from '@/engine/core/time';
import type { ProjectTemplate } from '@/engine/content/careerwork';
import { BRIEFS } from '@/engine/content/briefs';
import { DEMO, currentOf, demoRefusal, demoSources, materialsCheck, reelSources, type Opportunity } from '@/engine/systems/pro';
import { keepProject, productionsOf } from '@/engine/systems/slate';
import { submitRefusal, travels, writtenFor } from '@/engine/systems/projobs';
import { voiceOnly } from '@/engine/systems/workflow';
import { graduate, played } from './fakes/career-world';

// The Career screen drawn over the save, as tests/career-drawn.test.ts draws it.
const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tab: 'portfolio' }));
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/career' ? h.tab : initial) as T, () => undefined] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: import('@/engine/core/simulation').Simulation) => T) => read(h.sim) };
});
const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');
function shown(sim: import('@/engine/core/simulation').Simulation, tab: string): string {
  h.sim = sim; h.tab = tab;
  return renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })).replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

const WEEK = 7 * MS_DAY;
const VOICE = BRIEFS.find((b) => b.medium === 'voice')!;
const CAMERA = BRIEFS.find((b) => b.medium === 'camera')!;

/** A take of a brief, by the Player Profile's commands. */
function tape(sim: ReturnType<typeof graduate>, brief: typeof VOICE): string {
  sim.must({ kind: 'brief.choose', payload: { brief: brief.id, reading: brief.readings[0]!.id } });
  sim.must({ kind: 'practice.self_tape', payload: { genre: brief.kinds[0], brief: brief.id } });
  const takes = sim.player.briefs![brief.id]!.takes;
  return `tape:${brief.id}:${takes[takes.length - 1]!.at}`;
}

/** The headshots and résumé every submission starts with, by the Portfolio tab's commands, in working hours. */
function basics(sim: ReturnType<typeof graduate>): void {
  sim.must({ kind: 'pro.headshots', payload: {} });
  played(sim, sim.now + 15 * 60_000);
  sim.must({ kind: 'pro.update_resume', payload: {} });
}

/** A slate voice part open to anyone, written for the graduate: its posting week. */
function voicePart(sim: ReturnType<typeof graduate>): { t: ProjectTemplate; week: number } {
  for (let w = 1; w < 200; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) for (const t of p.parts) if (voiceOnly(t) && t.access.open && writtenFor(t, sim.player) && !travels(sim.player, t)) return { t, week };
  }
  throw new Error('no voice part');
}

describe('the voice demo', () => {
  it('takes what a reel can’t: a voice brief’s take is a demo’s recording and a reel’s refusal that says where it can go', () => {
    const sim = graduate('b27-demo-sources');
    played(sim, sim.now + 2 * 60 * 60_000);
    const ref = tape(sim, VOICE);
    tape(sim, CAMERA);
    expect(demoSources(sim.player, sim.now).map((s) => s.ref)).toEqual([ref]);
    const onReel = reelSources(sim.player, sim.now).find((s) => s.ref === ref)!;
    expect([onReel.usable, onReel.why]).toEqual([false, 'It’s a voice recording with no picture, so it can’t go on a reel. It can go on a voice demo.']);
    expect(demoRefusal(sim, sim.player, [])).toBe('Choose at least one recording to mix it from.');
    expect(demoRefusal(sim, sim.player, ['tape:nothing:1'])).toBe('That isn’t among your voice recordings.');
    expect(demoRefusal(sim, sim.player, Array.from({ length: DEMO.most + 1 }, () => ref))).toBe('Each recording goes on a demo once.');
  });

  it('PLAYER JOURNEY: a slate voice part takes no submission without a demo; mixed, the submission sends it, and keeps naming it after another is mixed', () => {
    const sim = graduate('b27-demo-journey');
    played(sim, sim.now + 2 * 60 * 60_000);
    basics(sim);
    const { t, week } = voicePart(sim);
    expect(t.requirements.sends).toEqual(['headshot', 'resume', 'demo']);
    played(sim, week);
    // TEST SETUP: the posting on the record as the week's postings would leave it.
    keepProject(sim.player, t);
    const o: Opportunity = { id: `test-${t.id}`, projectId: t.id, via: 'open', status: 'open', postedAt: week, submitBy: week + WEEK, history: [], counts: {} };
    sim.player.pro!.opportunities.push(o);
    const casting = t.casting;
    expect(submitRefusal(sim, sim.player, o)).toBe(`${casting} asks for a voice demo with every submission, and you have none. You have nothing of your voice recorded yet: tape a voice brief on the Player Profile first.`);
    const first = tape(sim, VOICE);
    expect(submitRefusal(sim, sim.player, o)).toBe(`${casting} asks for a voice demo with every submission, and you have none. You have one recording of your voice to mix a demo from: press Mix A Voice Demo on the Career screen’s Portfolio tab.`);
    const before = sim.player.pro!.materials.length;
    const r = sim.must<{ id: string; version: number; pieces: number }>({ kind: 'pro.mix_demo', payload: { pieces: [first] } });
    expect([r.version, r.pieces, sim.player.pro!.materials.length - before]).toEqual([1, 1, 1]);
    expect(submitRefusal(sim, sim.player, o)).toBeUndefined();
    sim.must({ kind: 'pro.submit', payload: { opportunityId: o.id } });
    const sent = sim.player.pro!.opportunities.find((x) => x.id === o.id)!.sent!;
    expect(sent.map((m) => m.kind)).toEqual(['headshot', 'resume', 'demo']);
    expect(sent.find((m) => m.kind === 'demo')!.id).toBe(r.id);
    // A second demo, mixed later from a newer take: the submission still names the first, which the record keeps.
    played(sim, sim.now + 60 * 60_000);
    const second = tape(sim, VOICE);
    expect(materialsCheck(sim.player, 'voice', sim.now).find((p) => p.kind === 'demo')?.problem).toBe('newer-work');
    const r2 = sim.must<{ id: string; version: number }>({ kind: 'pro.mix_demo', payload: { pieces: [second, first] } });
    expect(r2.version).toBe(2);
    expect(currentOf(sim.player.pro, 'demo')!.id).toBe(r2.id);
    expect(sim.player.pro!.opportunities.find((x) => x.id === o.id)!.sent!.find((m) => m.kind === 'demo')!.id).toBe(r.id);
    expect(sim.player.pro!.materials.some((m) => m.id === r.id)).toBe(true);
  });

  it('leaves screen work sending the reel, never the demo (the falsifiability test: change the part’s kind, and what’s sent changes)', () => {
    const sim = graduate('b27-demo-screen');
    played(sim, sim.now + 2 * 60 * 60_000);
    basics(sim);
    const ref = tape(sim, VOICE);
    sim.must({ kind: 'pro.mix_demo', payload: { pieces: [ref] } });
    const screen = materialsCheck(sim.player, 'screen', sim.now);
    expect(screen.some((p) => p.kind === 'demo')).toBe(false);
    expect(screen.find((p) => p.kind === 'reel')?.problem).toBe('missing');
    expect(materialsCheck(sim.player, 'voice', sim.now).some((p) => p.kind === 'reel')).toBe(false);
  });

  it('shows the demo and its control on the Portfolio tab, with what’s on it', () => {
    const sim = graduate('b27-demo-screenshot');
    played(sim, sim.now + 2 * 60 * 60_000);
    let page = shown(sim, 'portfolio');
    expect(page).toContain('Voice Demo');
    expect(page).toContain('You have no voice demo yet.');
    expect(page).toContain('You haven’t recorded your voice yet. Tape a voice brief on the Player Profile, and it’s here to mix from.');
    const ref = tape(sim, VOICE);
    page = shown(sim, 'portfolio');
    expect(page).toContain('Voice Recordings To Mix From');
    expect(page).toContain(`${VOICE.title}, A Voice Recording`);
    sim.must({ kind: 'pro.mix_demo', payload: { pieces: [ref] } });
    page = shown(sim, 'portfolio');
    expect(page).toMatch(/Mixed \w+ \d+, \d{4}, the first/);
    expect(page).toContain('Mixed by an engineer from your voice recordings on');
  });
});
