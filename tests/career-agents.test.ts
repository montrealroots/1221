/**
 * Real agencies and their agents (brief 25, `docs/verification/career-world-2026-10-23/criteria.md`, Module 3, A1 to
 * A8; the register's REP-01 to REP-13 and PROV-05): agencies and agents as records apart, each real field held to the
 * words the register recorded from its page; Stewart Talent's four offices, each its own way in; the four New York
 * theatrical agents, with nothing said of them the page doesn't give and no pronoun; the other agencies as their pages
 * left them; a real agent's answer the game's own, with no list to read; one agent at a time; and a life referred to a
 * real agent, met, offered, signed and put up for work by the agent, saved and loaded on the way.
 *
 * PLAYER JOURNEYS: a new life played by the clock and the commands a player sends (tests/fakes/career-world.ts). TEST
 * SETUP, said where it's done: the graduate, a finished job and its credit (the work loop is built apart), an agreement
 * or an offer written as the agent's system writes one, and the life's seed, found by reading the game's own draw for an
 * approach, which only chooses which of the draw's answers the journey meets.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { rngFor } from '@/engine/core/rng';
import { AGENTS, AGENCIES, agencyOf, agentById } from '@/engine/content/agents';
import { AGENCY_RECORDS } from '@/engine/content/agencies';
import { AGREEMENT_TERMS, projectById } from '@/engine/content/careerwork';
import type { Field } from '@/engine/content/catalog';
import type { Band } from '@/engine/systems/coursework';
import { activeAgreement, addCredit, ensurePro, type Agreement, type Engagement } from '@/engine/systems/pro';
import { CHANCE, REAL_ROOM, answerRefusal, chancesFor, interestOf, nextStep, relationOf, sendRefusal, signRefusal } from '@/engine/systems/proagent';
import { graduate, played, portfolio, reload } from './fakes/career-world';
import { signed } from './fakes/career-work';

interface Source { id: string; status: string; retrieved: string | null; facts: { quote: string }[] }
const SOURCES: Source[] = JSON.parse(readFileSync('docs/verification/career-world-2026-10-23/sources.json', 'utf8')).sources;
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
const holds = (source: string, words: string) => {
  const s = SOURCES.find((x) => x.id === source);
  return !!s && s.status === 'read' && s.facts.some((f) => squash(f.quote).includes(squash(words)));
};
const REAL = AGENTS.filter((a) => a.real);
const PATACK = agentById('dan-patack')!;
const PERSON = 'person_000001';
/**
 * A gendered pronoun, which the pages give no real agent. "They" and "them" aren't counted: the panels use them of
 * things, the materials a referral passes on or the factors, never of the agent, whom they name.
 */
const PRONOUN = /\b(he|him|his|He|Him|His|she|her|hers|She|Her|Hers)\b/;

// The Career screen drawn over a save, as tests/pro-representation-screen.test.ts draws it: `useGame` standing in for the
// provider, the kept tab and the kept agent answered from `h`.
const h = vi.hoisted(() => ({ sim: undefined as unknown as Simulation, tab: 'representation', agent: 'dan-patack' }));
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/career' ? h.tab : key === 'representation:agent' ? h.agent : initial) as T, () => undefined] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');
/** The Representation tab's words as a player sees them, with `agent` chosen, every tooltip taken out before the tags. */
function shown(sim: Simulation, agent: string): string {
  h.sim = sim; h.agent = agent;
  return renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })).replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

/** TEST SETUP: a professional engagement finished, with its credit, as the work loop leaves one (tests/journey-agent.test.ts's). */
function finishedJob(sim: Simulation, band: Band = 'strong', projectId = 'calder-street'): Engagement {
  const t = projectById(projectId)!;
  const credit = addCredit(sim, sim.player, { kind: t.medium === 'stage' ? 'stage' : 'screen', project: t.project, role: t.role.part, company: t.company, year: 2026, medium: t.medium, status: t.medium === 'stage' ? 'performed' : 'shot', at: sim.now - MS_DAY, band });
  const e: Engagement = { id: sim.nextId('pro'), opportunityId: sim.nextId('pro'), projectId, role: t.role.part, status: 'finished', days: [{ from: sim.now - 10 * MS_DAY, to: sim.now - MS_DAY, label: t.project }], pay: [], history: [], counts: {}, creditId: credit.id, finishedAt: sim.now - MS_DAY };
  credit.engagementId = e.id;
  sim.player.pro!.engagements.push(e);
  return e;
}

describe('A1: agencies and agents are records apart, each real field a page’s words or unknown', () => {
  it('holds every read field of every agency to words the register recorded from that page, read on the day it says', () => {
    for (const r of AGENCY_RECORDS) {
      const fields: [string, Field<unknown>][] = [['about', r.about], ...r.offices.flatMap((o, i) => [[`${o.city ?? i} route`, o.route], [`${o.city ?? i} agents`, o.agents]] as [string, Field<unknown>][])];
      for (const [name, f] of fields) {
        if (f.kind === 'read') { expect(holds(f.source, f.words), `${r.name}, ${name}: ${f.source} “${f.words}”`).toBe(true); expect(r.sources, `${r.name} cites ${f.source}`).toContain(f.source); }
        if (f.kind === 'unknown') expect(f.why.length, `${r.name}, ${name}`).toBeGreaterThan(20);
      }
      expect(r.inGame.length).toBeGreaterThan(20);
    }
    // The six the brief names, each once, and none ranked: the order is the game's, and nothing says a rank.
    expect(AGENCY_RECORDS.map((r) => r.name).sort()).toEqual(['CAA', 'Curtis Brown', 'Stewart Talent', 'UTA', 'United Agents', 'WME']);
    expect(JSON.stringify(AGENCY_RECORDS)).not.toMatch(/\b(top|best|biggest|leading|ranked)\b/i);
  });

  it('holds each real agent and the office to the page: the name and role in its words, the office’s rule quoted, read on October 24', () => {
    expect(REAL.map((a) => a.id)).toEqual(['dan-patack', 'jay-schachter', 'rachel-grandizio', 'tim-marshall']);
    for (const a of REAL) {
      expect(holds(a.real!.source, a.real!.words), a.name).toBe(true);
      expect(a.real!.words).toBe(`${a.name} ${a.role}`);
      expect(SOURCES.find((s) => s.id === a.real!.source)!.retrieved).toBe(a.real!.read);
      expect(a.routes).toEqual(['referral']);
    }
    const office = agencyOf(PATACK);
    expect(office.real!.sources.every((s) => SOURCES.find((x) => x.id === s)?.status === 'read')).toBe(true);
    expect(holds('N05', 'We do not accept unsolicited submissions at this time.')).toBe(true);
    expect(office.policy.words).toContain('“We do not accept unsolicited submissions at this time.”');
    expect(holds('N11', 'film/tv/theatre')).toBe(true);
  });

  it('keeps the game’s own agent and agency, and says they’re invented', () => {
    const own = AGENTS.filter((a) => !a.real);
    expect(own.map((a) => a.id)).toEqual(['thomas-ashgrove']);
    expect(own[0]!.notice).toMatch(/^Thomas Ashgrove and Halberd Talent are invented for the game\. /);
    expect(AGENCIES.filter((a) => !a.real).map((a) => a.id)).toEqual(['halberd-talent']);
  });
});

describe('A2: Stewart Talent’s four offices, each its own way in, and no print route for an actor', () => {
  it('gives New York’s and Los Angeles’ refusal, Chicago’s open submissions, and Atlanta’s two undated pages as unknown', () => {
    const st = AGENCY_RECORDS.find((r) => r.id === 'stewart-talent')!;
    const by = Object.fromEntries(st.offices.map((o) => [o.city, o.route]));
    expect(by['New York']).toMatchObject({ kind: 'read', value: 'No unsolicited submissions', source: 'N05' });
    expect(by['Los Angeles']).toMatchObject({ kind: 'read', value: 'No unsolicited submissions', source: 'N06' });
    expect(by['Chicago']).toMatchObject({ kind: 'read', source: 'N07' });
    expect(by['Atlanta']!.kind).toBe('unknown');
    expect((by['Atlanta'] as { why: string }).why).toMatch(/only by referral.*by email from full-time residents of the Southeast/);
    expect([holds('N08', 'only accepting talent submissions via referrals'), holds('N09', 'accepts submissions only via email')]).toEqual([true, true]);
    // Print's form (S102) is a page the register read, and never an actor's route.
    const cited = AGENCY_RECORDS.flatMap((r) => r.offices.flatMap((o) => (o.route.kind === 'read' ? [o.route.source] : [])));
    expect(cited).not.toContain('S102');
    expect(SOURCES.find((s) => s.id === 'S102')!.status).toBe('read');
  });
});

describe('A3: the real agents, with nothing the page doesn’t give', () => {
  it('names the four New York theatrical agents the page names, leaves Jordan Parente out, and holds no list, client or preference for any', () => {
    // The page names five; the owner chose on 2026-10-21 not to depict Jordan Parente.
    expect(holds('N05', 'Jordan Parente Theatrical Agent')).toBe(true);
    expect(AGENTS.some((a) => a.name === 'Jordan Parente')).toBe(false);
    const ny = AGENCY_RECORDS.find((r) => r.id === 'stewart-talent')!.offices.find((o) => o.city === 'New York')!.agents;
    expect(ny.kind === 'read' && ny.value).toEqual(REAL.map((a) => a.name));
    for (const a of REAL) {
      expect(a.roster, a.name).toBeUndefined();
      expect(JSON.stringify(a)).not.toMatch(/client|prefer|special|roster|list of/i);
      expect([a.words.he, a.words.him, a.words.office]).toEqual([a.name, a.name, 'the office']);
    }
  });
});

describe('A4: the routes by office', () => {
  it('refuses an approach to a real New York agent without a referral in the office’s own words, and offers no showcase route', () => {
    const sim = graduate('agents-a4');
    sim.must({ kind: 'pro.agent_notice', payload: { agentId: PATACK.id } });
    portfolio(sim);
    sim.must({ kind: 'pro.agent_check', payload: { agentId: PATACK.id } });
    expect(sendRefusal(sim, sim.player, PATACK)).toBe('The office takes no unsolicited submissions, as its page says: “We do not accept unsolicited submissions at this time.” It sees your materials only through a referral from someone you’ve worked with.');
    expect(nextStep(sim, sim.player, PATACK)).toBe('The office takes materials only through a referral. Under How To Reach Dan Patack, ask someone you’ve worked with for a referral.');
    expect(REAL.some((a) => a.routes.includes('showcase'))).toBe(false);
  });

  it('puts no one in the game at WME, CAA, UTA, Curtis Brown or United Agents, each saying why', () => {
    const agencies = new Set(AGENTS.map((a) => agencyOf(a).name));
    for (const id of ['wme', 'caa', 'uta', 'curtis-brown', 'united-agents']) {
      const r = AGENCY_RECORDS.find((x) => x.id === id)!;
      expect(agencies.has(r.name), r.name).toBe(false);
      expect(r.inGame).toMatch(/no one/);
    }
    expect(AGENCY_RECORDS.find((r) => r.id === 'wme')!.offices[0]!.route).toMatchObject({ kind: 'read', source: 'N10' });
    expect(AGENCY_RECORDS.find((r) => r.id === 'united-agents')!.offices[0]!.route).toMatchObject({ kind: 'read', source: 'S99' });
    expect(AGENCY_RECORDS.find((r) => r.id === 'united-agents')!.inGame).toContain('work in the UK, which isn’t in the game yet');
  });
});

describe('A5: a real agent’s answer is the game’s, with no list to read', () => {
  it('reads six factors for a real agent and seven for the game’s own on the same record, and a real agent’s chance at the one assumed room', () => {
    const sim = graduate('agents-a5');
    portfolio(sim);
    finishedJob(sim, 'strong');
    const real = interestOf(sim, sim.player, PATACK, sim.now);
    const own = interestOf(sim, sim.player, AGENTS[0]!, sim.now);
    expect(real.factors.map((f) => f.id)).toEqual(['work', 'relevance', 'training', 'fit', 'availability', 'reliability']);
    expect(own.factors.map((f) => f.id)).toContain('roster');
    expect(real.factors.find((f) => f.id === 'fit')!.label).toBe('Fit With The Department');
    // The room read as at the bar, the multiplier 1: the band's own chance, the same for every real agent.
    expect(REAL_ROOM).toBe('at');
    // The reel's cold tape is the only work the office has to go on yet: the job counts once it refers you.
    expect(real.band).toBe('unready');
    expect({ chance: real.chance, offerChance: real.offerChance }).toEqual({ chance: CHANCE.interest.unready * CHANCE.room.at, offerChance: CHANCE.offer.unready * CHANCE.room.at });
    expect(chancesFor(real.band, REAL_ROOM)).toEqual({ chance: real.chance, offerChance: real.offerChance });
    for (const f of real.factors) expect(f.words, f.id).not.toMatch(PRONOUN);
  });
});

describe('A6: one agent at a time', () => {
  it('refuses a second agent’s agreement while one is in force, lets it be declined, and signs it once the first has ended', () => {
    const sim = graduate('agents-a6');
    const first = signed(sim, sim.now); // TEST SETUP: Thomas Ashgrove's agreement in force, as his system writes one
    // TEST SETUP: Dan Patack's offer standing, as the agent's system writes one.
    const offer: Agreement = { id: sim.nextId('pro'), agentId: PATACK.id, offeredAt: sim.now, standsUntil: sim.now + 14 * MS_DAY, status: 'offered', terms: [...AGREEMENT_TERMS] };
    ensurePro(sim, sim.player).agreements.push(offer);
    sim.player.pro!.relations[PATACK.id] = { agentId: PATACK.id, stage: 'offered', since: sim.now, stageAt: sim.now, history: [], counts: {}, noticeShownAt: sim.now };
    expect(signRefusal(sim, sim.player, PATACK)).toMatch(/^Thomas Ashgrove at Halberd Talent represents you until \w+ \d+, \d{4}, for the same kinds of work\. In the game you have one agent at a time, so this agreement can’t start while that one runs\. You can decline it, or end the other first\.$/);
    expect(sim.execute({ kind: 'pro.accept_agreement', payload: { agentId: PATACK.id } }).error).toBe(signRefusal(sim, sim.player, PATACK));
    expect(answerRefusal(sim, sim.player, PATACK)).toBeUndefined();
    // The first ended, the second signs, and the pay reads one agreement on any day: never two commissions.
    first.status = 'ended'; first.endedAt = sim.now; first.endedHow = 'agreement';
    expect(signRefusal(sim, sim.player, PATACK)).toBeUndefined();
    sim.must({ kind: 'pro.accept_agreement', payload: { agentId: PATACK.id } });
    expect(activeAgreement(sim.player, sim.now + MS_HOUR)?.agentId).toBe(PATACK.id);
    expect(sim.player.pro!.agreements.filter((a) => a.signedAt !== undefined && a.signedAt <= sim.now + MS_HOUR && sim.now + MS_HOUR < Math.min(a.endedAt ?? Infinity, a.endsAt ?? Infinity))).toHaveLength(1);
  });
});

describe('A7: a real agent’s panel carries no pronoun', () => {
  it('draws the Representation tab with Dan Patack chosen: the notice, the name in every heading, the office as “the office”, and no pronoun', () => {
    const sim = graduate('agents-a7');
    const first = shown(sim, PATACK.id);
    expect(first).toContain(PATACK.notice);
    expect(first).toContain('Where You Stand With Dan Patack Not In Touch');
    expect(first).toContain('Thomas Ashgrove Agent, Legit Department, Halberd Talent, New York. Invented for the game. Not In Touch. Show');
    expect(first).toContain('Dan Patack Theatrical Agent, Stewart Talent, New York. A real agent. Not In Touch. Shown Below');
    sim.must({ kind: 'pro.agent_notice', payload: { agentId: PATACK.id } });
    portfolio(sim);
    finishedJob(sim, 'strong');
    const read = shown(sim, PATACK.id);
    for (const heading of ['How To Reach Dan Patack', 'Your Materials For Dan Patack', 'History With The Office', 'Why It Went This Way']) expect(read).toContain(heading);
    // The agent's panels, from the chosen agent's name down to the agencies, read with no pronoun at all.
    const panels = read.slice(read.indexOf(`${PATACK.name} Theatrical Agent, Stewart Talent, New York`, read.indexOf('Shown Below')), read.indexOf('Agencies'));
    expect(panels.length).toBeGreaterThan(500);
    expect([...panels.matchAll(new RegExp(`.{0,90}${PRONOUN.source}.{0,60}`, "g"))].map((m) => m[0])).toEqual([]);
  });
});

/** The game's own draw for an approach's step to Dan Patack, read for a seed as the game reads it (`drawOf`). */
const draw = (seed: string, step: 'interest' | 'offer') => rngFor(seed, 'pro.agent', PERSON, PATACK.id, 'approach-1', step).next();
/** TEST SETUP: the first seed of a prefix whose first approach to Dan Patack is taken further and offered, at any band and room. */
function seedWhere(prefix: string): string {
  for (let i = 0; i < 20_000; i += 1) { const seed = `${prefix}-${i}`; if (draw(seed, 'interest') < 0.12 && draw(seed, 'offer') < 0.18) return seed; }
  throw new Error(`No seed for ${prefix}`);
}

describe('A8: a real agent, played', () => {
  it('PLAYER JOURNEY: referred to Dan Patack from a finished job, materials sent, met, offered, signed, and put up for work by the office; saved and loaded on the way', () => {
    let sim = graduate(seedWhere('agents-a8'));
    sim.must({ kind: 'pro.agent_notice', payload: { agentId: PATACK.id } });
    portfolio(sim);
    const job = finishedJob(sim, 'strong');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    sim.must({ kind: 'pro.agent_check', payload: { agentId: PATACK.id } });
    sim.must({ kind: 'pro.ask_referral', payload: { agentId: PATACK.id, engagementId: job.id } });
    sim.must({ kind: 'pro.send_materials', payload: { agentId: PATACK.id } });
    expect(relationOf(sim.player, PATACK.id)!.stage).toBe('sent');
    sim = reload(sim);
    // The answer: a meeting, at the office in New York.
    played(sim, sim.now + 15 * MS_DAY);
    const rel = () => relationOf(sim.player, PATACK.id)!;
    expect(rel().stage).toBe('meeting');
    expect(rel().history.at(-1)!.words).toMatch(/^The office asked to meet you: \w+day, \w+ \d+, \d{4} at 11:00 AM, at Stewart Talent’s New York office\.$/);
    sim = reload(sim);
    played(sim, rel().meeting!.at + 2 * MS_HOUR);
    expect(rel().stage).toBe('deciding');
    played(sim, sim.now + 8 * MS_DAY);
    expect(rel().stage).toBe('offered');
    expect(sim.universe.notifications.at(-1)!.title).toBe('Dan Patack Offered You Representation');
    sim.must({ kind: 'pro.accept_agreement', payload: { agentId: PATACK.id } });
    expect(rel().history.at(-1)!.words).toMatch(/^Dan Patack represents you from \w+ \d+, \d{4} until \w+ \d+, \d{4}\.$/);
    sim = reload(sim);
    expect(activeAgreement(sim.player, sim.now)?.agentId).toBe(PATACK.id);
    // The office's breakdowns: roles released to agents reach the player through Dan Patack.
    let found = undefined as undefined | { agentId?: string };
    for (let w = 0; w < 26 && !found; w += 1) {
      played(sim, sim.now + 7 * MS_DAY);
      found = sim.player.pro!.opportunities.find((o) => o.via === 'agent');
    }
    expect(found?.agentId).toBe(PATACK.id);
    // A real production's office is named by its role, without a second possessive (from 2026-10-24).
    const posted = rel().history.find((e) => e.words.includes('came to Dan Patack'));
    if (posted && /Reese Pike|Casey Marlow/.test(posted.words)) expect(posted.words).toMatch(/^The breakdown for (Reese Pike in 9-1-1|Casey Marlow in Abbott Elementary), from the production’s casting office, came to Dan Patack/);
    // Every word the relation kept names the agent or the office, never a pronoun.
    for (const e of rel().history) expect(e.words, e.key).not.toMatch(PRONOUN);
  });
});
