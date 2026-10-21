/**
 * The Career screen's Representation tab (brief 19, criteria G1, G2, G6, G7, G8, T1, T2): the agent's panel drawn over
 * real saves at each stage, as tests/pro-screen.test.ts draws Overview and Portfolio: react-dom/server, `useGame`
 * standing in for the provider with `run` the save's own `execute`, the kept tab and the kept drill-down answered from
 * `h`. Each reason is looked for in the words a player sees, every title attribute taken out first, so a tooltip can't
 * pass for it.
 *
 * PLAYER JOURNEYS play through the clock and the commands a player sends. TEST SETUP marks state set by hand: the body
 * kept tended as the clock moves; a finished job and its credit, as the work loop (built apart) leaves one; and the
 * life's seed, found by reading the game's own draw for the first approach, so the journey meets an offer.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { rngFor } from '@/engine/core/rng';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { CHAPTERS } from '@/engine/content/tutorial';
import { READ_KIND } from '@/engine/world/tutorial';
import { AGENTS, agencyOf } from '@/engine/content/agents';
import { AGREEMENT_TERMS, projectById } from '@/engine/content/careerwork';
import { BRIEFS } from '@/engine/content/briefs';
import { addCredit, type Engagement } from '@/engine/systems/pro';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tab: 'representation', reasons: false }));

vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return {
    ...real,
    useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/career' ? h.tab : key.startsWith('reasons:') ? h.reasons : initial) as T, () => undefined] as const,
  };
});

vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const AGENT = AGENTS[0]!;
const student = (seed: string, tutorial = false) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', tutorial });
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};

/** The Representation tab: its markup, and the words a player sees, every tooltip taken out before the tags. */
function drawn(sim: Simulation, reasons = false): { html: string; shown: string } {
  h.sim = sim;
  h.tab = 'representation';
  h.reasons = reasons;
  const html = renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })).replace(/<!-- -->/g, '');
  return { html, shown: html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&#x27;/g, '’').replace(/\s+/g, ' ') };
}
const button = (html: string, label: string) => [...html.matchAll(/<button([^>]*)>([^<]*)(?:<span class="lock-word">Locked<\/span>)?<\/button>/g)].filter((m) => m[2] === label).map((m) => ({ disabled: m[1]!.includes('disabled=""'), title: /title="([^"]*)"/.exec(m[1]!)?.[1]?.replace(/&quot;/g, '"'), locked: m[1]!.includes('is-locked') }));

/** TEST SETUP: a summer job finished, judged at `band`, as the work loop leaves one. */
function finishedJob(sim: Simulation, band: 'strong' | 'exceptional' = 'exceptional'): Engagement {
  const t = projectById('calder-street')!;
  const credit = addCredit(sim, sim.player, { kind: 'stage', project: t.project, role: t.role.part, company: t.company, year: 2026, medium: 'stage', status: 'performed', at: sim.now - MS_DAY, band });
  const e: Engagement = { id: sim.nextId('pro'), opportunityId: sim.nextId('pro'), projectId: t.id, role: t.role.part, status: 'finished', days: [{ from: sim.now - 10 * MS_DAY, to: sim.now - MS_DAY, label: t.project }], pay: [], history: [], counts: {}, creditId: credit.id, finishedAt: sim.now - MS_DAY };
  credit.engagementId = e.id;
  sim.player.pro!.engagements.push(e);
  return e;
}
/** TEST SETUP: the first seed of a prefix whose first approach the game's own draw takes to a meeting and then an offer. */
function offeringSeed(prefix: string): string {
  for (let i = 0; i < 20_000; i += 1) {
    const seed = `${prefix}-${i}`;
    const d = (step: string) => rngFor(seed, 'pro.agent', 'person_000001', AGENT.id, 'approach-1', step).next();
    if (d('interest') < 0.12 && d('offer') < 0.18) return seed;
  }
  throw new Error('no seed');
}
/** A first-year with a reel, a finished job, headshots and a résumé, the notice read and the check made, on a Sunday. */
function ready(seed: string) {
  const sim = student(seed);
  tended(sim, at(2026, 8, 30, 10));
  const brief = BRIEFS.find((b) => b.medium === 'camera')!;
  sim.must({ kind: 'brief.choose', payload: { brief: brief.id, reading: brief.readings[0]!.id } });
  sim.must({ kind: 'practice.self_tape', payload: { genre: brief.kinds[0], brief: brief.id } });
  sim.must({ kind: 'pro.cut_reel', payload: { pieces: [`tape:${brief.id}:${sim.player.briefs![brief.id]!.takes[0]!.at}`] } });
  const job = finishedJob(sim);
  sim.must({ kind: 'pro.headshots', payload: {} });
  sim.must({ kind: 'pro.update_resume', payload: {} });
  sim.must({ kind: 'pro.agent_notice', payload: {} });
  sim.must({ kind: 'pro.agent_check', payload: {} });
  return { sim, job };
}

describe('the Representation tab', () => {
  it('PLAYER JOURNEY: G1: where he first appears, the notice stands above all else with the fictional line, and once read it stays one press away', () => {
    const sim = student('rep-notice');
    const first = drawn(sim);
    expect(first.html).toContain('aria-controls="career-pane-representation"');
    expect(first.shown).toContain('Jordan Parente Agent, Legit Department, Stewart Talent, New York');
    expect(first.shown).toContain('Fictional: his words and decisions here are invented.');
    expect(first.html).toMatch(/<div class="callout callout-accent small col gap-2" role="note"><p[^>]*>Jordan Parente is a real agent at Stewart Talent in New York\./);
    expect(button(first.html, 'I’ve Read This')).toEqual([{ disabled: false, title: undefined, locked: false }]);
    expect(first.shown).toContain('Where You Stand With Him Not In Touch');
    expect(first.shown).toContain('What’s Next Read the notice at the top of his panel, then press I’ve Read This.');
    // The agency's published policy, quoted from its data.
    expect(first.shown).toContain(`Submissions Stewart Talent’s page for New York legit submissions says: “${agencyOf(AGENT).policy.quote}”`);
    // Nothing else is offered before it's read.
    expect(first.shown).not.toContain('How To Reach Him');
    expect(first.shown).not.toContain('Check Your Materials');
    sim.must({ kind: 'pro.agent_notice', payload: {} });
    const after = drawn(sim);
    expect(after.html).not.toContain('role="note"');
    expect(after.html).toMatch(/<details class="small"><summary>Read The Notice Again<\/summary><p[^>]*>Jordan Parente is a real agent/);
    expect(after.shown).toContain('Fictional: his words and decisions here are invented.');
    expect(after.shown).toContain('Where You Stand With Him Notice Read');
    // No contact detail of his or the agency's anywhere on the tab.
    expect(after.html).not.toMatch(/@|https?:\/\/|www\.|\(\d{3}\)|\d{3}-\d{4}/);
  });

  it('PLAYER JOURNEY: G2 and V5: the check and the send grayed with their reasons under them, then the agency’s own words for an unsolicited send', () => {
    const sim = student('rep-materials');
    sim.must({ kind: 'pro.agent_notice', payload: {} });
    const bare = drawn(sim);
    const missing = 'You have no headshots, and every submission starts with one. Press Book A Headshot Session on the Career screen’s Portfolio tab. You have no résumé. Press Make Your Résumé on the Career screen’s Portfolio tab: it takes an hour, from your record.';
    expect(button(bare.html, 'Check Your Materials')).toEqual([{ disabled: true, title: missing, locked: false }]);
    expect(bare.shown).toContain(`Check Your Materials: ${missing}`);
    expect(bare.shown).toContain('People You’ve Worked With None yet.');
    tended(sim, at(2026, 8, 30, 10));
    sim.must({ kind: 'pro.headshots', payload: {} });
    sim.must({ kind: 'pro.update_resume', payload: {} });
    sim.must({ kind: 'pro.agent_check', payload: {} });
    const checked = drawn(sim);
    const policy = `Stewart Talent’s page for New York legit submissions says: “${agencyOf(AGENT).policy.quote}” The game keeps to it: his office takes your materials only through the School’s follow-up after the showcase, or a referral from someone you’ve worked with.`;
    expect(button(checked.html, 'Send Your Materials')).toEqual([{ disabled: true, title: policy, locked: false }]);
    expect(checked.shown).toContain(`Send Your Materials: ${policy}`);
    expect(checked.shown).toContain('Where You Stand With Him Materials Checked');
    // A job judged well enough is listed with its referral, the button open.
    finishedJob(sim);
    const listed = drawn(sim);
    expect(listed.shown).toContain('Pennick Casting, from your work as Nell in A House On Calder Street, judged Exceptional');
    expect(button(listed.html, 'Ask For A Referral')).toEqual([{ disabled: false, title: undefined, locked: false }]);
    expect(listed.shown).toContain('History With His Office');
    expect(listed.shown).toContain('August 24, 2026: You read the notice about him');
  });

  it('PLAYER JOURNEY: G6 and G7: Why It Went This Way opens its seven factors, and the agreement shows every term with its basis before Accept and Decline', () => {
    const { sim, job } = ready(offeringSeed('rep-offer'));
    sim.must({ kind: 'pro.ask_referral', payload: { engagementId: job.id } });
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 9, 28, 12));
    expect(sim.player.pro!.relations[AGENT.id]!.stage).toBe('offered');
    const closed = drawn(sim);
    expect(button(closed.html, 'Show The Reasons')).toEqual([{ disabled: false, title: undefined, locked: false }]);
    expect(closed.html).not.toContain('At The Last Decision');
    const open = drawn(sim, true);
    expect(open.html).toContain('aria-expanded="true"');
    expect(open.shown).toContain('At The Last Decision');
    expect(open.shown).toContain('As Things Stand Now');
    for (const label of ['Your Work', 'Stage And Screen', 'Training And Experience', 'Fit With His Department', 'Availability', 'Room On His List (Assumed)', 'Reliability']) expect(open.html).toContain(`<h4 class="small strong" style="margin:0">${label}</h4>`);
    expect(open.shown).toContain('Reliability Beyond The Bar You kept one meeting with his office.');
    expect(open.shown).toMatch(/(Four of the seven|Five of the seven|Six of the seven|All seven) were at the bar or beyond, and an approach needs four\. Against the year’s other actors, the game gave an offer about a \d+% chance\./);
    // The agreement, every term, each with its basis.
    expect(open.shown).toContain('The Agreement How This Works He offered it on September 28, 2026, and the offer stands until October 12, 2026. Read every term before you answer.');
    for (const t of AGREEMENT_TERMS) expect(open.shown).toContain(`${t.heading} (${t.basis === 'verified' ? 'A Published Rule' : 'The Game’s Own Term'}) ${t.words}`);
    expect(button(open.html, 'Accept The Agreement')).toEqual([{ disabled: false, title: undefined, locked: false }]);
    // History With His Office, newest first, the steps of one moment too: the send after the referral, the check, the notice.
    const history = open.shown.slice(open.shown.indexOf('History With His Office'));
    const order = ['He offered you representation', 'You kept the meeting', 'His office asked to meet you', 'You sent your headshots', 'Pennick Casting referred you', 'You checked your materials', 'You read the notice about him'].map((x) => history.indexOf(x));
    expect(order.every((n) => n >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((x, y) => x - y));
    expect(button(open.html, 'Decline The Agreement')).toEqual([{ disabled: false, title: undefined, locked: false }]);
    // Accepted: the three ways to end it, each grayed with when it can.
    sim.must({ kind: 'pro.accept_agreement', payload: {} });
    const signed = drawn(sim);
    expect(signed.shown).toContain('You signed it on September 28, 2026. It runs until September 28, 2027.');
    expect(signed.shown).toContain('Where You Stand With Him Represented');
    expect(button(signed.html, 'End It By Agreement')).toEqual([{ disabled: false, title: undefined, locked: false }]);
    expect(button(signed.html, 'End It: No Offer In 90 Days')[0]).toMatchObject({ disabled: true, title: 'Equity’s rule lets you end it once 90 days go by with no real offer of covered work through him. You signed on September 28, 2026, so that’s from December 27, 2026.' });
    expect(button(signed.html, 'End It: Under Ten Days’ Work')[0]).toMatchObject({ disabled: true, title: 'SAG-AFTRA’s rule lets you end it this way only after 151 days, from February 26, 2027.' });
    // Ended by agreement: what it leaves owed.
    sim.must({ kind: 'pro.end_agreement', payload: { how: 'agreement' } });
    expect(drawn(sim).shown).toContain('It ended on September 28, 2026. No pay is still to come from contracts you made while it ran, so no commission is still owed on them.');
  });

  it('PLAYER JOURNEY: a meeting set shows when and where, with Ask To Move open until it’s used, then grayed with why', () => {
    const { sim, job } = ready(offeringSeed('rep-meeting'));
    sim.must({ kind: 'pro.ask_referral', payload: { engagementId: job.id } });
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 9, 14, 12));
    const set = drawn(sim);
    expect(set.shown).toContain('The Meeting How This Works When September 21, 2026 at 11:00 AM Where At Stewart Talent’s New York office Moved Not yet: it can be moved once');
    expect(button(set.html, 'Ask To Move')).toEqual([{ disabled: false, title: undefined, locked: false }]);
    sim.must({ kind: 'pro.ask_to_move', payload: { meetingId: sim.player.pro!.relations[AGENT.id]!.meeting!.id } });
    const moved = drawn(sim);
    expect(moved.shown).toContain('When September 28, 2026 at 11:00 AM');
    expect(button(moved.html, 'Ask To Move')[0]).toMatchObject({ disabled: true, title: 'You moved this meeting once already. In the game his office moves a meeting once, and it stays on September 28, 2026 at 11:00 AM.' });
  });

  it('PLAYER JOURNEY: in a guided life, the agent’s controls stay Locked until “Representation” is read, and open with it', () => {
    const sim = student('rep-guided', true);
    const readTo = (id: string) => { for (const c of CHAPTERS) { if (sim.universe.tutorial!.read.includes(c.id)) continue; sim.must({ kind: READ_KIND, payload: { chapterId: c.id } }); if (c.id === id) return; } };
    readTo('career');
    const shut = drawn(sim);
    expect(button(shut.html, 'I’ve Read This')[0]!.locked).toBe(true);
    readTo('representation');
    const open = drawn(sim);
    expect(button(open.html, 'I’ve Read This')[0]!.locked).toBe(false);
  });
});
