/**
 * Brief 27, representation (2026-10-25), on the Career screen's Representation tab: Asking For Different Terms, its three
 * asks each with the game's chance and its refusal, the ask waiting and Accept grayed until it's answered, then the terms
 * as they stand and as first offered; and the voice-over agent's panel, her department, her office's rule and the
 * materials a voice department's approach sends. Drawn with react-dom/server over played saves, `useGame` standing in for
 * the provider with `run` the save's own `execute`, as tests/pro-representation-screen.test.ts draws the tab; every title
 * attribute taken out of the words a player sees, so a tooltip can't pass for one.
 *
 * PLAYER JOURNEYS: a graduate's life (tests/fakes/b20-career.ts) played by the clock and the commands a player sends. TEST
 * SETUP: a finished job and its credit, as the work loop leaves one; the life's seed found by reading the game's own draws.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { rngFor } from '@/engine/core/rng';
import { agentById } from '@/engine/content/agents';
import { TERMS, askChance, chanceTenths } from '@/engine/systems/representation';
import { relationOf, signRefusal } from '@/engine/systems/proagent';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { AGENT, SURE, finishedJob, graduate, played, portfolio, reel, twin } from './fakes/b20-career';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, agent: 'thomas-ashgrove' }));
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/career' ? 'representation' : key === 'representation:agent' ? h.agent : initial) as T, () => undefined] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');

const CELIA = agentById('celia-brannock')!;
const promise = (entry: string, to: string) => GUIDE_BY_ID[entry]!.connections.find((c) => c.to === to)!.why;
const PERSON = 'person_000001';

/** The Representation tab for an agent: its markup, and the words a player sees, every tooltip taken out before the tags. */
function drawn(sim: Simulation, agent = AGENT.id): { html: string; shown: string } {
  h.sim = sim;
  h.agent = agent;
  const html = renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })).replace(/<!-- -->/g, '');
  return { html, shown: html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&#x27;/g, '’').replace(/\s+/g, ' ') };
}
const button = (html: string, label: string) => [...html.matchAll(/<button([^>]*)>([^<]*)(?:<span class="lock-word">Locked<\/span>)?<\/button>/g)].filter((m) => m[2] === label).map((m) => ({ disabled: m[1]!.includes('disabled=""'), title: /title="([^"]*)"/.exec(m[1]!)?.[1]?.replace(/&quot;/g, '"') }));

/** TEST SETUP: the first life of a prefix whose office offers an agreement and agrees to any ask, read from the game's draws. */
function offeredAgreeing(prefix: string): Simulation {
  for (let i = 0; i < 20_000; i += 1) {
    const seed = `${prefix}-${i}`;
    const d = (step: 'interest' | 'offer') => rngFor(seed, 'pro.agent', PERSON, AGENT.id, 'approach-1', step).next();
    if (!(d('interest') < SURE.meet && d('offer') < SURE.offer)) continue;
    const sim = graduate(seed);
    sim.must({ kind: 'pro.agent_notice', payload: {} });
    portfolio(sim);
    const job = finishedJob(sim, 'strong');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    sim.must({ kind: 'pro.agent_check', payload: {} });
    sim.must({ kind: 'pro.ask_referral', payload: { engagementId: job.id } });
    reel(sim);
    sim.must({ kind: 'pro.send_materials', payload: {} });
    for (let k = 0; k < 60 && relationOf(sim.player, AGENT.id)!.stage !== 'offered'; k += 1) played(sim, sim.now + MS_DAY);
    const a = sim.player.pro!.agreements.find((x) => x.status === 'offered')!;
    if (rngFor(seed, 'pro.agent_terms', PERSON, AGENT.id, a.id).next() < TERMS.least) return sim;
  }
  throw new Error('no life');
}

describe('Asking For Different Terms, on the Representation tab', () => {
  it('PLAYER JOURNEY: three asks with their chances while the agreement is offered; asked, Accept grayed with why until the answer; agreed, the terms as they stand and as first offered', () => {
    const sim = offeredAgreeing('rep-screen');
    const before = drawn(sim);
    expect(before.shown).toContain('Asking For Different Terms How This Works As it stands, it covers stage, film and television work in the US, for one year from the day you sign it, as offered. Before you answer the offer, you can ask his office once to change it:');
    expect(before.shown).toContain(`Ask For A Shorter Term: a term of six months instead of one year. The game puts the chance his office agrees at ${chanceTenths(askChance(sim, sim.player, AGENT, 'shorter'))}.`);
    expect(before.shown).toContain(`Ask To Add Voice-Over: voice-over work to be covered too. The game puts the chance his office agrees at ${chanceTenths(askChance(sim, sim.player, AGENT, 'voice'))}.`);
    expect(before.shown).toContain(`Ask To Add Work Abroad: work in the UK and Australia to be covered too. The game puts the chance his office agrees at ${chanceTenths(askChance(sim, sim.player, AGENT, 'abroad'))}.`);
    for (const label of ['Ask For A Shorter Term', 'Ask To Add Voice-Over', 'Ask To Add Work Abroad']) expect(button(before.html, label)).toEqual([{ disabled: false, title: undefined }]);
    // Pressed, as the button presses it.
    const r = sim.must<{ answerAt: number }>({ kind: 'pro.ask_terms', payload: { agentId: AGENT.id, ask: 'shorter' } });
    const waiting = drawn(sim);
    expect(button(waiting.html, 'Ask For A Shorter Term')).toEqual([]);
    expect(waiting.shown).toContain('You asked for a term of six months instead of one year on September 30, 2026. His office answers on October 2, 2026 at 10:00 AM, and you can accept the agreement once it has.');
    expect(button(waiting.html, 'Accept The Agreement')).toEqual([{ disabled: true, title: signRefusal(sim, sim.player, AGENT) }]);
    expect(waiting.shown).toContain(`Accept The Agreement: ${signRefusal(sim, sim.player, AGENT)}`);
    const back = twin(sim);
    played(back, r.answerAt + MS_HOUR);
    const answered = drawn(back);
    expect(answered.shown).toContain('As it stands, it covers stage, film and television work in the US, for six months from the day you sign it, as his office agreed on October 2, 2026. As first offered, it covered stage, film and television work in the US, for one year. You asked for a term of six months instead of one year on September 30, 2026, and his office agreed on October 2, 2026.');
    expect(answered.shown).toContain('How Long (The Game’s Own Term) Six months from the day you sign it, the shorter term you asked for.');
    expect(button(answered.html, 'Accept The Agreement')).toEqual([{ disabled: false, title: undefined }]);
  }, 300_000);

  it(`career.agreement-terms > career.agreement: “${promise('career.agreement-terms', 'career.agreement')}”`, () => {
    const sim = offeredAgreeing('rep-screen-promise');
    const r = sim.must<{ answerAt: number }>({ kind: 'pro.ask_terms', payload: { agentId: AGENT.id, ask: 'abroad' } });
    expect(r.answerAt - sim.now).toBeLessThan(3 * MS_DAY);
    expect(drawn(sim).shown).toContain('Where (The Game’s Own Term) Work anywhere in the United States.');
    played(sim, r.answerAt + MS_HOUR);
    expect(drawn(sim).shown).toContain('Where (The Game’s Own Term) Work anywhere in the United States, and in the UK and Australia, where the game has work abroad.');
  }, 300_000);

  it('PLAYER JOURNEY: Celia Brannock’s panel gives her voice-over department, her office’s own rule, its one way in, and the voice demo her approach sends', () => {
    const sim = graduate('rep-screen-celia');
    sim.must({ kind: 'pro.agent_notice', payload: { agentId: CELIA.id } });
    sim.must({ kind: 'pro.agent_notice', payload: { agentId: AGENT.id } });
    portfolio(sim);
    const shown = drawn(sim, CELIA.id).shown;
    expect(shown).toContain('Celia Brannock Agent, Voice-Over Department, Halberd Talent, New York. Invented for the game. Notice Read.');
    expect(shown).toContain('Department Voice-Over, also called Voice: Voice-Over Submissions Her office takes no submissions it hasn’t asked for.');
    expect(shown).toContain('How To Reach Her How This Works Her office takes your materials one way in the game: a referral from someone you’ve worked with on a finished job. The game reads a referral as not unsolicited.');
    expect(shown).toContain('Your Materials For Her How This Works You have no voice demo, and nothing of your voice recorded to mix one from yet. Tape a voice brief on the Player Profile first.');
    // Thomas Ashgrove's panel, on the same record, asks about a reel.
    expect(drawn(sim).shown).toContain('You have no reel, and nothing recorded to cut one from yet.');
  }, 300_000);
});
