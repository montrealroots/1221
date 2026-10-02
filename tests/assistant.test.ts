/**
 * The built-in assistant (`systems/assistant.ts`, `base44/functions/askAssistant`,
 * from 2026-10-02): a proposal is tried and put back, so the world is as it
 * was; only listed commands are proposed; the engine's own refusals show; and
 * the server sends nothing without the owner's key, caps a player's day, and
 * returns only listed commands.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quickSave } from '@/engine';
import { serialise } from '@/engine/persistence/adapter';
import { ASSISTANT_COMMANDS, assistantState, checkProposal } from '@/engine/systems/assistant';
import { resetWorld, rowsFor, world } from './fakes/base44-sdk';
import askAssistant from '../base44/functions/askAssistant/entry.js';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a proposal, tried and put back', () => {
  it('leaves the world exactly as it was, and says what it would do', () => {
    const sim = life('asst-preview');
    const before = serialise(sim.universe);
    const checked = checkProposal(sim, { kind: 'life.look_after', payload: { action: 'unwind' }, why: 'You’re stressed.' });
    expect(checked.ok).toBe(true);
    expect(JSON.parse(serialise(sim.universe))).toEqual(JSON.parse(before));
  });

  it('shows the engine’s own refusal, and refuses a command it may not propose', () => {
    const sim = life('asst-refuse');
    const refused = checkProposal(sim, { kind: 'home.renovate', payload: { homeId: 'nope', projectId: 'roof-asphalt' }, why: 'x' });
    expect(refused.ok).toBe(false);
    expect(refused.refusal).toBe('You don’t own that home.');
    const banned = checkProposal(sim, { kind: 'world.take_decision_action', payload: {}, why: 'x' });
    expect(banned.refusal).toBe('That isn’t something the assistant may propose.');
  });

  it('reads what a purchase would cost from the bank, without spending it', () => {
    const sim = life('asst-cost');
    const before = serialise(sim.universe);
    const checked = checkProposal(sim, { kind: 'life.look_after', payload: { action: 'order' }, why: 'Dinner.' });
    if (checked.ok) expect(checked.costs).toBeGreaterThan(0);
    expect(JSON.parse(serialise(sim.universe))).toEqual(JSON.parse(before));
  });

  it('tells the assistant the life and the commands it may use', () => {
    const state = assistantState(life('asst-state'));
    expect(state.commands).toBe(ASSISTANT_COMMANDS);
    expect(state.garments.length).toBeGreaterThanOrEqual(0);
    expect(state.where.cityId).toBe('us-ny-newyork');
  });
});

const post = (body: unknown) => new Request('https://slate.test/fn', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('the server function', () => {
  beforeEach(() => { resetWorld(); vi.stubEnv('ANTHROPIC_API_KEY', ''); });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('sends nothing until the owner’s key is set, and refuses somebody not signed in', async () => {
    const off = await askAssistant(post({ request: 'Plan my day', state: { commands: ASSISTANT_COMMANDS } }));
    expect(off.status).toBe(503);
    world.user = null;
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    expect((await askAssistant(post({ request: 'x' }))).status).toBe(401);
  });

  it('returns only proposals whose command is listed, and counts the day', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    const fetched = vi.fn(async () => new Response(JSON.stringify({ content: [{ type: 'tool_use', name: 'propose_actions', input: { answer: 'Unwind, then sleep.', proposals: [
      { kind: 'life.look_after', payload: { action: 'unwind' }, why: 'Stress is high.' },
      { kind: 'bank.transfer', payload: { amount: 1e9 }, why: 'Free money.' },
    ] } }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetched);
    const res = await askAssistant(post({ request: 'Help', state: { commands: { 'life.look_after': ASSISTANT_COMMANDS['life.look_after'] } } }));
    const body = await res.json() as { ok: boolean; proposals: { kind: string }[]; answer: string };
    expect(body.ok).toBe(true);
    expect(body.proposals.map((p) => p.kind)).toEqual(['life.look_after']);
    expect(body.answer).toBe('Unwind, then sleep.');
    expect(rowsFor('u1', 'SlateAssistantUsage')[0]!.requests).toBe(1);
    const sent = JSON.parse((fetched.mock.calls[0] as unknown as [string, { body: string; headers: Record<string, string> }])[1].body) as { tool_choice: { name: string } };
    expect(sent.tool_choice.name).toBe('propose_actions');
  });

  it('stops a player at the day’s cap', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    vi.stubEnv('SLATE_ASSISTANT_DAILY', '1');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ content: [] }), { status: 200 })));
    expect((await askAssistant(post({ request: 'one', state: {} }))).status).toBe(200);
    expect((await askAssistant(post({ request: 'two', state: {} }))).status).toBe(429);
  });
});
