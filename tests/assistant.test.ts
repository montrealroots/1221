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
import { ASSISTANT_COMMANDS, CUSTOMIZE_COMMANDS, OFFERS_SHOWN, assistantState, checkProposal, checkSequence, takeSequence } from '@/engine/systems/assistant';
import { vehiclesOf } from '@/engine/systems/vehicles';
import { tireOfferRefusal } from '@/engine/systems/tires';
import { SERVICE, resetWorld, rowsFor, signIn, world } from './fakes/base44-sdk';
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

describe('proposals by role, by real offer, and in sequence (from 2026-10-06)', () => {
  it('refuses a proposal that isn’t the asking role’s to make', () => {
    const sim = life('asst-role');
    const move = { kind: 'home.move', payload: { kind: 'shared' }, why: 'x' };
    expect(checkProposal(sim, move, 'customize').refusal).toBe('That isn’t something the assistant may propose.');
    expect(checkProposal(sim, move, 'develop').refusal).toBe('That isn’t something the assistant may propose.');
    expect(checkProposal(sim, move, 'play').refusal).not.toBe('That isn’t something the assistant may propose.');
  });

  it('tells the assistant the offers that fit what the player owns, by their real ids, and none to the development role', () => {
    const sim = life('asst-offers');
    sim.must({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    const v = vehiclesOf(sim.player)[0]!;
    const before = serialise(sim.universe);
    const offers = assistantState(sim, 'customize').offers!;
    expect(JSON.parse(serialise(sim.universe))).toEqual(JSON.parse(before));
    const car = offers.vehicles.find((x) => x.vehicleId === v.id)!;
    expect(car.tires.length).toBeGreaterThan(0);
    expect(car.tires.length).toBeLessThanOrEqual(OFFERS_SHOWN);
    // Every tire offered is one the engine would fit to this car: its own size.
    expect(car.tires.filter((t) => tireOfferRefusal(v, t.offerId, false) !== undefined)).toEqual([]);
    expect(car.tires.map((t) => t.price)).toEqual([...car.tires.map((t) => t.price)].sort((a, b) => a - b));
    expect(assistantState(sim, 'develop').offers).toBeUndefined();
  });

  it('checks each proposal after the ones before it, and puts the world back', () => {
    const sim = life('asst-seq');
    sim.must({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    const v = vehiclesOf(sim.player)[0]!;
    const offerId = assistantState(sim).offers!.vehicles[0]!.tires[0]!.offerId;
    const tires = { kind: 'vehicle.replace_tires', payload: { vehicleId: v.id, offerId }, why: 'x' };
    const speakers = { kind: 'vehicle.audio', payload: { vehicleId: v.id, part: 'speakers' }, why: 'x' };
    const before = serialise(sim.universe);
    // Alone, speakers go in; after a first set, a second is refused, as it would be taken in order.
    expect(checkSequence(sim, [speakers], 'play')[0]!.ok).toBe(true);
    const [first, second] = checkSequence(sim, [speakers, speakers], 'play');
    expect(first!.ok).toBe(true);
    expect(second).toMatchObject({ ok: false, refusal: 'It has them.' });
    // One refused leaves the world as it was for the next: tires after it are still taken, and cost what they cost alone.
    const [, refused, after] = checkSequence(sim, [speakers, speakers, tires], 'play');
    expect(refused!.ok).toBe(false);
    expect(after!.ok).toBe(true);
    expect(after!.costs).toBe(checkProposal(sim, tires).costs);
    expect(JSON.parse(serialise(sim.universe))).toEqual(JSON.parse(before));
  });

  it('takes a sequence all or none: one refused puts back the ones before it', () => {
    const sim = life('asst-take');
    sim.must({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    const v = vehiclesOf(sim.player)[0]!;
    const offerId = assistantState(sim).offers!.vehicles[0]!.tires[0]!.offerId;
    const tires = { kind: 'vehicle.replace_tires', payload: { vehicleId: v.id, offerId }, why: 'x' };
    const bad = { kind: 'home.renovate', payload: { homeId: 'nope', projectId: 'roof-asphalt' }, why: 'x' };
    const before = serialise(sim.universe);
    expect(takeSequence(sim, [tires, bad], 'play')).toEqual({ ok: false, at: 1, error: 'You don’t own that home.' });
    expect(JSON.parse(serialise(sim.universe))).toEqual(JSON.parse(before));
    expect(takeSequence(sim, [tires, { kind: 'home.move', payload: { kind: 'shared' }, why: 'x' }], 'customize')).toMatchObject({ ok: false, at: 1 });
    expect(JSON.parse(serialise(sim.universe))).toEqual(JSON.parse(before));
    expect(takeSequence(sim, [tires], 'customize')).toEqual({ ok: true });
    expect(v.tires?.product).toBeDefined();
  });
});

const post = (body: unknown) => new Request('https://slate.test/fn', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('what the assistant may propose', () => {
  it('is every one a command the engine handles, so a proposal never names one that isn’t there (from 2026-10-05)', () => {
    const sim = life('assistant-allowlist');
    expect(Object.keys(ASSISTANT_COMMANDS).filter((kind) => !sim.hasCommand(kind))).toEqual([]);
  });
});

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

  it('as the development role, stores mechanics for the owner’s review and returns no command (requirement 57)', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    const fetched = vi.fn(async () => new Response(JSON.stringify({ content: [{ type: 'tool_use', name: 'propose_mechanics', input: { answer: 'One idea.', mechanics: [
      { title: 'Allergy Season', what: 'Pollen counts by town raise a sufferer\u2019s stress.', why: 'Truer springs.', sources: ['a national pollen service'], touches: ['health'] },
      { what: 'No title' },
    ], proposals: [{ kind: 'life.look_after', payload: { action: 'unwind' }, why: 'smuggled' }] } }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetched);
    const res = await askAssistant(post({ request: 'Something new for spring', role: 'develop', state: { commands: {} } }));
    const body = await res.json() as { ok: boolean; proposals: unknown[]; mechanics: { title: string }[] };
    expect(body.ok).toBe(true);
    expect(body.proposals).toEqual([]);
    expect(body.mechanics.map((m) => m.title)).toEqual(['Allergy Season']);
    expect(rowsFor('u1', 'SlateMechanicProposal').map((r) => [r.title, r.status])).toEqual([['Allergy Season', 'proposed']]);
    const sent = JSON.parse((fetched.mock.calls[0] as unknown as [string, { body: string }])[1].body) as { tool_choice: { name: string } };
    expect(sent.tool_choice.name).toBe('propose_mechanics');
  });

  it('as the customization role, is told only the customization commands', () => {
    const sim = life('assistant-customize');
    expect(Object.keys(assistantState(sim, 'customize').commands)).toEqual([...CUSTOMIZE_COMMANDS]);
    expect(assistantState(sim, 'develop').commands).toEqual({});
    expect(CUSTOMIZE_COMMANDS.every((k) => ASSISTANT_COMMANDS[k])).toBe(true);
  });

  it('stops every player at the month’s token allowance, counted from what the API reports (from 2026-10-06)', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    vi.stubEnv('SLATE_ASSISTANT_MONTHLY_TOKENS', '1000');
    const fetched = vi.fn(async () => new Response(JSON.stringify({ content: [], usage: { input_tokens: 600, output_tokens: 300, cache_read_input_tokens: 200 } }), { status: 200 }));
    vi.stubGlobal('fetch', fetched);
    expect((await askAssistant(post({ request: 'one', state: {} }))).status).toBe(200);
    expect(rowsFor(SERVICE, 'SlateAssistantMonth')[0]).toMatchObject({ tokens: 1_100, requests: 1 });
    // Another player, the same month: over the allowance, nothing is sent, and their day isn't counted.
    signIn('u2');
    const res = await askAssistant(post({ request: 'two', state: {} }));
    expect(res.status).toBe(429);
    expect(fetched).toHaveBeenCalledTimes(1);
    expect(rowsFor('u2', 'SlateAssistantUsage')).toEqual([]);
    // Players never see the month's row.
    expect(rowsFor('u1', 'SlateAssistantMonth')).toEqual([]);
  });

  it('stops a player at the day’s cap', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    vi.stubEnv('SLATE_ASSISTANT_DAILY', '1');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ content: [] }), { status: 200 })));
    expect((await askAssistant(post({ request: 'one', state: {} }))).status).toBe(200);
    expect((await askAssistant(post({ request: 'two', state: {} }))).status).toBe(429);
  });
});
