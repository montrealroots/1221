/**
 * SLATE — ask the built-in assistant (Stage 14; `docs/AI-INTEGRATION.md`).
 *
 * The browser sends the player's request and a summary of their life
 * (`assistantState` in `src/engine/systems/assistant.ts`). This function asks
 * Claude, through the Claude API with the owner's key held here as a secret,
 * for proposals: commands from the summary's own list, each with a sentence
 * on why. It returns them; it never touches a save. The browser tries each
 * proposal and puts it back before the player sees it, and the player takes
 * it or leaves it.
 *
 * What the server enforces:
 *  - the caller is signed in;
 *  - nothing is sent anywhere unless the owner has set ANTHROPIC_API_KEY;
 *  - a player's requests are capped a day (SLATE_ASSISTANT_DAILY, 40 unless
 *    set), counted in SlateAssistantUsage;
 *  - the request and the summary are size-limited;
 *  - only proposals whose command is in the summary's list come back.
 *
 * Three roles (from 2026-10-05; requirements 55 and 57): "play", the default,
 * proposes commands; "customize" proposes only the customization commands the
 * browser lists for it (a wrap, a stereo, tires, an outfit, a lamp, paint),
 * each tried and put back like any other; "develop" proposes new mechanics
 * as written proposals, stored in SlateMechanicProposal for the owner to
 * review. A mechanic is never a command: nothing the develop role returns is
 * run, and nothing reaches a save.
 *
 * The model is SLATE_ASSISTANT_MODEL, or Claude Haiku 4.5 by default; check
 * the current ids and prices before activation.
 */

import { createClientFromRequest } from 'npm:@base44/sdk';

const API = 'https://api.anthropic.com/v1/messages';
const MAX_REQUEST = 2_000;
const MAX_STATE = 60_000;

const env = (name) => (typeof Deno !== 'undefined' ? Deno.env.get(name) : globalThis.process?.env?.[name]);
const reply = (body, status = 200) => Response.json(body, { status });

const SYSTEM = [
  'You are the assistant inside SLATE, a text-based life simulation where the player lives one life as an actor.',
  'You plan; you never act. Answer with the propose_actions tool: a short answer to the player, and proposals, each a command from the list you are given, its payload, and one sentence on why.',
  'Use only the commands and payload shapes listed in the state. Use ids that appear in the state; never invent an id, a price, an item the player does not own, money, a qualification or finished work.',
  'If what they ask cannot be done with the listed commands, say so plainly in the answer and propose nothing for it.',
  'The game checks every proposal and the player decides; keep proposals few and specific.',
].join(' ');

const DEVELOP = [
  'You are the development role of the assistant inside SLATE, a text-based life simulation of one life as an actor, built to reflect the real world wherever the character is.',
  'You never act on the game. Answer with the propose_mechanics tool: a short answer, and new mechanics the owner may review, each with what it would do, why, where its figures would come from, and which systems it would touch.',
  'Propose only mechanics whose figures can come from a real published source; name the source kind. Never invent a figure, a law, a price or a rate.',
  'A proposal is reviewed by the owner before anything is built. Keep them few and specific.',
].join(' ');

const MECHANICS_TOOL = {
  name: 'propose_mechanics',
  description: 'Answer and propose new game mechanics for the owner to review.',
  input_schema: {
    type: 'object',
    properties: {
      answer: { type: 'string' },
      mechanics: {
        type: 'array',
        maxItems: 4,
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            what: { type: 'string' },
            why: { type: 'string' },
            sources: { type: 'array', items: { type: 'string' } },
            touches: { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'what', 'why'],
        },
      },
    },
    required: ['answer', 'mechanics'],
  },
};

const TOOL = {
  name: 'propose_actions',
  description: 'Answer the player and propose game commands for them to take or leave.',
  input_schema: {
    type: 'object',
    properties: {
      answer: { type: 'string', description: 'What to tell the player, in plain words.' },
      proposals: {
        type: 'array',
        maxItems: 6,
        items: {
          type: 'object',
          properties: {
            kind: { type: 'string' },
            payload: { type: 'object' },
            why: { type: 'string' },
          },
          required: ['kind', 'payload', 'why'],
        },
      },
    },
    required: ['answer', 'proposals'],
  },
};

export default async function (req) {
  try {
    if (req.method !== 'POST') return reply({ ok: false, status: 405, error: 'This endpoint takes POST.' }, 405);
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return reply({ ok: false, status: 401, error: 'You are not signed in.' }, 401);

    const key = env('ANTHROPIC_API_KEY');
    if (!key) return reply({ ok: false, status: 503, error: 'The assistant isn’t switched on: it needs the owner’s Claude Console key.' }, 503);

    const body = await req.json().catch(() => null);
    const request = typeof body?.request === 'string' ? body.request.trim() : '';
    if (!request) return reply({ ok: false, status: 400, error: 'Ask it something.' }, 400);
    if (request.length > MAX_REQUEST) return reply({ ok: false, status: 400, error: 'That’s longer than the assistant takes.' }, 400);
    const state = JSON.stringify(body?.state ?? {});
    if (state.length > MAX_STATE) return reply({ ok: false, status: 413, error: 'The life is too large to send as it is.' }, 413);
    const allowed = new Set(Object.keys(body?.state?.commands ?? {}));
    const role = body?.role === 'develop' || body?.role === 'customize' ? body.role : 'play';

    // A player's requests today, capped.
    const day = new Date().toISOString().slice(0, 10);
    const cap = Number(env('SLATE_ASSISTANT_DAILY') ?? 40);
    const [usage] = await base44.entities.SlateAssistantUsage.filter({ user_id: user.id, day });
    if ((usage?.requests ?? 0) >= cap) return reply({ ok: false, status: 429, error: `That’s today’s ${cap} questions; it answers again tomorrow.` }, 429);
    if (usage) await base44.entities.SlateAssistantUsage.update(usage.id, { requests: usage.requests + 1 });
    else await base44.entities.SlateAssistantUsage.create({ user_id: user.id, day, requests: 1 });

    const res = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: env('SLATE_ASSISTANT_MODEL') ?? 'claude-haiku-4-5-20251001',
        max_tokens: 1_500,
        system: [{ type: 'text', text: role === 'develop' ? DEVELOP : SYSTEM, cache_control: { type: 'ephemeral' } }],
        tools: [role === 'develop' ? MECHANICS_TOOL : TOOL],
        tool_choice: { type: 'tool', name: role === 'develop' ? 'propose_mechanics' : 'propose_actions' },
        messages: [{ role: 'user', content: `The life as it stands:\n${state}\n\nThe player asks: ${request}` }],
      }),
    });
    if (!res.ok) return reply({ ok: false, status: 502, error: 'The assistant didn’t answer; try again in a moment.' }, 502);
    const data = await res.json();
    // The development role's mechanics, stored for the owner's review and returned; never a command.
    if (role === 'develop') {
      const dev = (data.content ?? []).find((c) => c.type === 'tool_use' && c.name === 'propose_mechanics')?.input ?? {};
      const strs = (xs, n) => (Array.isArray(xs) ? xs.filter((x) => typeof x === 'string').slice(0, n).map((x) => x.slice(0, 300)) : []);
      const mechanics = (Array.isArray(dev.mechanics) ? dev.mechanics : []).filter((m) => m && typeof m.title === 'string' && typeof m.what === 'string')
        .slice(0, 4).map((m) => ({ title: m.title.slice(0, 200), what: m.what.slice(0, 2_000), why: String(m.why ?? '').slice(0, 1_000), sources: strs(m.sources, 8), touches: strs(m.touches, 8) }));
      for (const m of mechanics) await base44.entities.SlateMechanicProposal.create({ user_id: user.id, request: request.slice(0, 2_000), ...m, status: 'proposed' });
      return reply({ ok: true, answer: String(dev.answer ?? '').slice(0, 2_000), proposals: [], mechanics });
    }
    const used = (data.content ?? []).find((c) => c.type === 'tool_use' && c.name === 'propose_actions');
    const input = used?.input ?? {};
    const proposals = (Array.isArray(input.proposals) ? input.proposals : [])
      .filter((p) => p && typeof p.kind === 'string' && allowed.has(p.kind) && p.payload && typeof p.payload === 'object' && !Array.isArray(p.payload))
      .map((p) => ({ kind: p.kind, payload: p.payload, why: String(p.why ?? '').slice(0, 300) }));
    return reply({ ok: true, answer: String(input.answer ?? '').slice(0, 2_000), proposals });
  } catch {
    return reply({ ok: false, status: 500, error: 'The assistant didn’t answer; try again in a moment.' }, 500);
  }
}
