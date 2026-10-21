/**
 * The Career screen's Opportunities tab (brief 19, J1 to J5, A3, F4; `src/ui/career/OpportunitiesPane.tsx`), drawn over
 * real saves as tests/pro-screen.test.ts draws Overview and Portfolio: react-dom/server, `useGame` standing in for the
 * provider with `run` the save's own `execute`, and the kept tab answered from `h.tab`. Each reason is looked for in the
 * words a player sees, every title attribute taken out first, so a tooltip can't pass for it.
 *
 * PLAYER JOURNEYS play through the clock and the commands a player sends; TEST SETUP marks state set by hand: the body
 * tended as the clock moves, and an offer made as casting's draw would make it (the draw's own journeys are
 * tests/pro-work.test.ts's).
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { CHAPTERS } from '@/engine/content/tutorial';
import { READ_KIND } from '@/engine/world/tutorial';
import { PROJECTS } from '@/engine/content/careerwork';
import type { Opportunity } from '@/engine/systems/pro';
import { payTermsOf } from '@/engine/systems/projobs';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tab: 'opportunities' }));

vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/career' ? h.tab : initial) as T, () => undefined] as const };
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
const student = (seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...more });
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};

/** The clock moved a day at a time until an open role posted to the actor matches, for at most ten weeks. */
function untilOpen(sim: Simulation, match: (o: Opportunity) => boolean = () => true): Opportunity {
  for (let n = 0; n < 70; n += 1) {
    const o = sim.player.pro!.opportunities.find((x) => x.status === 'open' && x.via === 'open' && sim.now < x.submitBy - MS_DAY && match(x));
    if (o) return o;
    tended(sim, sim.now + MS_DAY);
  }
  throw new Error('No open role was posted.');
}

function drawn(sim: Simulation): { html: string; shown: string } {
  h.sim = sim;
  const html = renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })).replace(/<!-- -->/g, '');
  return { html, shown: html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
}
const button = (html: string, label: string) => [...html.matchAll(/<button([^>]*)>([^<]*)<\/button>/g)].filter((m) => m[2] === label).map((m) => ({ disabled: m[1]!.includes('disabled=""'), title: /title="([^"]*)"/.exec(m[1]!)?.[1], locked: m[1]!.includes('is-locked') }));

/** TEST SETUP: an offer standing for a role posted on a Monday, as casting's draw would make it. */
function offered(sim: Simulation, projectId: string, posted: number): Opportunity {
  const terms = payTermsOf(sim.player, { projectId, postedAt: posted }, sim.now);
  const o: Opportunity = {
    id: sim.nextId('pro'), projectId, via: 'open', status: 'offered', postedAt: posted, submitBy: posted + 7 * MS_DAY, history: [], counts: {},
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: PROJECTS.find((t) => t.id === projectId)!.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units },
  };
  sim.player.pro!.opportunities.push(o);
  return o;
}

describe('the Opportunities tab', () => {
  it('PLAYER JOURNEY: a first-year’s tab lists the open roles posted, each fictional with its facts, Submit Yourself grayed with what’s missing under it, and the School’s conditions for work in term', () => {
    const sim = student('opps-first-year');
    untilOpen(sim, (x) => PROJECTS.find((t) => t.id === x.projectId)!.access.open === 'anyone');
    const { html, shown } = drawn(sim);
    expect(html).toContain('aria-selected="true" aria-controls="career-pane-opportunities"');
    expect(shown).toContain('Every project, company and casting office here is invented for the game: no real production is casting.');
    const open = sim.player.pro!.opportunities.filter((o) => o.status === 'open' && o.via === 'open' && PROJECTS.find((t) => t.id === o.projectId)!.access.open === 'anyone');
    expect(open.length).toBeGreaterThan(0);
    const t = PROJECTS.find((x) => x.id === open[0]!.projectId)!;
    expect(shown).toContain(`${t.role.part}, ${t.project}`);
    expect(shown).toContain(`The Project ${t.project}, a fictional`);
    expect(shown).toContain(`The Part ${t.role.part}: ${t.role.about}`);
    expect(button(html, 'Submit Yourself')).toContainEqual({ disabled: true, title: 'You have no headshots, and every submission starts with one. Press Book A Headshot Session on the Career screen’s Portfolio tab.', locked: false });
    expect(shown).toContain('Not now: You have no headshots, and every submission starts with one.');
    // In term: what the dean looks at, each condition said, and the way to ask.
    expect(shown).toContain('In Term At The School');
    expect(shown).toContain('You’re in good standing, as a request needs.');
    expect(button(html, 'Ask The School').length).toBeGreaterThan(0);
    // The agent-only offices, said with why a player can't reach them alone.
    expect(shown).toContain('Some casting offices release their roles to agents only, so without an agent you can’t be seen for them: Pennick Casting for A House On Calder Street');
    expect(shown).toContain('Sources And Estimates');
  });

  it('PLAYER JOURNEY: a submission moves to In Progress, and the audition shows its time, the sides’ three steps with their minutes, and the control its form asks for', () => {
    const sim = student('opps-progress');
    tended(sim, at(2026, 8, 30, 10));
    sim.must({ kind: 'pro.headshots', payload: {} });
    sim.must({ kind: 'pro.update_resume', payload: {} });
    const o = untilOpen(sim, (x) => PROJECTS.find((t) => t.id === x.projectId)!.access.open === 'anyone');
    sim.must({ kind: 'pro.submit', payload: { opportunityId: o.id } });
    expect(drawn(sim).shown).toMatch(/Submitted\. .+ answers? soon\./);
    tended(sim, sim.now + 3 * MS_DAY);
    const { html, shown } = drawn(sim);
    const r = o.rounds![0]!;
    expect(shown).toContain(r.form === 'self-tape' ? 'A self-tape, due' : 'An audition in person at');
    expect(shown).toContain('Preparing the sides: the breakdown 0%, the lines 0%, rehearsal on your feet 0%.');
    expect(button(html, 'Break It Down (30 Minutes)')).toHaveLength(1);
    expect(button(html, 'Learn The Lines (30 Minutes)')).toHaveLength(1);
    expect(button(html, 'Rehearse It On Your Feet (45 Minutes)')[0]!.title).toBe('Learn some of the lines first: there’s nothing to rehearse without them.');
    expect(button(html, r.form === 'self-tape' ? 'Tape It' : 'Ask For Another Time')).toHaveLength(1);
    expect(html).toMatch(/<summary>What Happened \(3\)<\/summary>/);
  });

  it('PLAYER JOURNEY: an offer shows its terms; Accept The Offer is grayed for an F-1 student in term with the reason, and open to a citizen with what the School’s rule brings', () => {
    const f1 = student('opps-f1', { homeRegionId: 'uk-eng-london' });
    tended(f1, at(2026, 9, 14, 12));
    const film = PROJECTS.find((t) => t.kind === 'non-union-short')!;
    offered(f1, film.id, at(2026, 9, 14));
    const shut = drawn(f1);
    const no = button(shut.html, 'Accept The Offer')[0]!;
    expect(no.disabled).toBe(true);
    expect(no.title).toMatch(/^Your F-1 .+ That rules out work on October 19, 2026\.$/);
    expect(shut.shown).toContain('Pay It pays $125.00 a day for two days, an estimate.');
    expect(button(shut.html, 'Decline The Offer')[0]!.disabled).toBe(false);
    const us = student('opps-citizen');
    tended(us, at(2026, 9, 14, 12));
    offered(us, film.id, at(2026, 9, 14));
    const open = drawn(us);
    expect(button(open.html, 'Accept The Offer')[0]!.disabled).toBe(false);
    expect(open.shown).toMatch(/This work falls in term, and the School hasn’t approved it\. You’d miss (one class day|two class days)\. Working in term without approval brings an academic warning the first time and dismissal the second/);
    expect(open.shown).toContain('Missing a day: a shoot can’t wait, so the production replaces you.');
  });

  it('PLAYER JOURNEY: accepted, the work shows under Booked Work with its days, the part’s preparation and the pay promised, not yet paid', () => {
    const sim = student('opps-booked');
    tended(sim, at(2026, 12, 14, 12));
    const t = PROJECTS.find((x) => x.kind === 'non-union-short')!;
    const o = offered(sim, t.id, at(2026, 12, 14));
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const { html, shown } = drawn(sim);
    expect(shown).toMatch(/Booked Work .*Sam, Last Bus To Eastview two days to come, the next \w+day, \w+ \d+, 2027 at 7:00 AM, in New York\. Each stops the clock: press Go to be there\./);
    expect(shown).toContain('Promised: $250.00 over one week, each week due the Thursday after it. It’s promised, not yet paid.');
    expect(button(html, 'Break It Down (60 Minutes)')).toHaveLength(1);
    expect(shown).toContain('No offer stands now.');
  });

  it('PLAYER JOURNEY: in a guided life, the tab’s controls stay Locked until “Finding Work” is read', () => {
    const sim = student('opps-guided', { tutorial: true });
    tended(sim, at(2026, 8, 30, 10));
    for (const c of CHAPTERS) {
      sim.must({ kind: READ_KIND, payload: { chapterId: c.id } });
      if (c.id === 'career') break;
    }
    sim.must({ kind: 'pro.headshots', payload: {} });
    untilOpen(sim);
    const shut = drawn(sim);
    // Locked, the button carries its lock word and says which chapter opens it.
    expect(shut.html).toMatch(/<button type="button" class="btn btn-sm is-locked" title="[^"]*“Finding Work”[^"]*">Submit Yourself<span class="lock-word">Locked<\/span><\/button>/);
    sim.must({ kind: READ_KIND, payload: { chapterId: 'finding-work' } });
    expect(button(drawn(sim).html, 'Submit Yourself')[0]!.locked).toBe(false);
  });
});
