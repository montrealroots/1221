/**
 * Brief 27, Area B and the UK's rules (2026-10-24): a slate part where the player meets it. The Career screen's role card
 * for a London part the slate made, the offer's warning, the Work tab's trip with its ETA asked for, paid for and granted
 * under the Creative Worker concession, and a production's fate in the notices. The words the text inventory's second
 * pass read for `systems/slate.ts`, `content/slate.ts`, the slate's lines in `systems/projobs.ts` and the UK's in
 * `systems/worktrip.ts` and `content/jurisdictions.ts` are held here as the player is shown them.
 *
 * PLAYER JOURNEYS: a graduate's life played by the clock and the commands a player sends (tests/fakes/career-world.ts);
 * TEST SETUP, said where it's done: the agreement (tests/fakes/b20-career.ts) and the offer put on the record as casting's
 * draws would leave one.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import type { ProjectTemplate } from '@/engine/content/careerwork';
import { AWAY_TRIP } from '@/engine/content/slate';
import { productionsOf, keepProject, seriesOfYear, seriesParts } from '@/engine/systems/slate';
import { seriesById } from '@/engine/content/series';
import type { Opportunity } from '@/engine/systems/pro';
import { acceptWarning, datesOf, kindPhrase, payTermsOf, reachWords, travels, writtenFor } from '@/engine/systems/projobs';
import { applicationFee, routeFor, tripOf } from '@/engine/systems/worktrip';
import { graduate, notices, played } from './fakes/career-world';
import { represent } from './fakes/b20-career';

// The Career screen drawn over the journey's save, as tests/career-drawn.test.ts draws it.
const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tab: 'opportunities' }));
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
/** A Career tab's words as a player sees them, every tooltip taken out before the tags. */
function shown(sim: import('@/engine/core/simulation').Simulation, tab: string): string {
  h.sim = sim; h.tab = tab;
  return renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })).replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

const WEEK = 7 * MS_DAY;

/** A London part the slate made, written for the graduate, its days inside three months: the concession's. */
function londonPart(sim: ReturnType<typeof graduate>): { t: ProjectTemplate; week: number } {
  for (let w = 1; w < 400; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) {
      if (p.market.id !== 'london') continue;
      for (const t of p.parts) if (t.trip && writtenFor(t, sim.player)) return { t, week };
    }
  }
  throw new Error('no London part');
}

/** TEST SETUP: an offer for a slate part, put on the record as casting's draws would leave one. */
function offered(sim: ReturnType<typeof graduate>, t: ProjectTemplate, postedAt: number, status: Opportunity['status']): Opportunity {
  keepProject(sim.player, t);
  const terms = payTermsOf({ projectId: t.id, postedAt });
  const o: Opportunity = {
    id: `test-${t.id}`, projectId: t.id, via: 'agent', status, postedAt, submitBy: postedAt + WEEK, history: [], counts: {},
    ...(status === 'offered' ? { offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units } } : {}),
  };
  sim.player.pro!.opportunities.push(o);
  return o;
}

describe('a London part the slate made, as the player meets it', () => {
  it('PLAYER JOURNEY: the role card says it’s the game’s own, the offer warns of the trip, the ETA is applied for and paid for, and granted the next day', () => {
    const sim = graduate('b27-slate-london');
    represent(sim);
    const { t, week } = londonPart(sim);
    played(sim, week);
    const o = offered(sim, t, week, 'open');
    // The role card: the title, the company, what it is, all of it the game's.
    const opp = shown(sim, 'opportunities');
    expect(opp).toContain(t.project);
    expect(kindPhrase(t)).toMatch(/^a fictional /);
    expect(opp).toContain(`${t.project}, ${kindPhrase(t)}, by ${t.company}`);
    expect(opp).toContain('The projects, companies and casting offices here are invented for the game');
    // The offer: the trip, who books it, and that the contract isn't permission to work.
    o.status = 'offered';
    const terms = payTermsOf({ projectId: t.id, postedAt: week });
    o.offer = { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units };
    const warning = acceptWarning(sim, sim.player, o)!;
    expect(warning).toMatch(/^This work is in London\. You’d be away from /);
    expect(warning).toContain(AWAY_TRIP.words);
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = sim.player.pro!.engagements.find((x) => x.opportunityId === o.id)!;
    const route = routeFor(sim.player, 'uk', e.days)!;
    expect(route.id).toBe('uk-creative-concession');
    expect(tripOf(sim.player, e)!.stay.place).toBe(AWAY_TRIP.hotel);
    // The Work tab: the trip to London, the ETA it asks for and what the concession asks.
    let work = shown(sim, 'work');
    expect(work).toContain('The Trip To London');
    expect(work).toContain('Permission, Flights And Hotel');
    expect(work).toContain('Apply For The ETA');
    expect(work).toContain(`What The ${route.short.replace(/\bvisa\b/, 'Visa')} Asks`);
    for (const c of route.conditions) expect(work).toContain(c.words);
    expect(work).toContain(`${AWAY_TRIP.hotel[0]!.toUpperCase()}${AWAY_TRIP.hotel.slice(1)}, `);
    // Applied for: £20 from the bank, an ETA pending in Papers, the Home Office deciding the next day.
    const fee = applicationFee(sim, route)!;
    expect(fee.words).toMatch(/^£20\.00/);
    const r = sim.must<{ readyAt: number }>({ kind: 'pro.apply_work_visa', payload: { engagementId: e.id } });
    expect(r.readyAt - sim.now).toBe(MS_DAY);
    work = shown(sim, 'work');
    expect(work).toMatch(/Applied \w+ \d+, \d{4}\. The Home Office decides on \w+ \d+, \d{4}\./);
    expect(work).not.toContain('Apply For The ETA');
    expect(e.history.find((x) => x.kind === 'visa-applied')!.words).toBe(`You applied for an ETA for ${t.project}, paying ${fee.words}.`);
    played(sim, r.readyAt + MS_HOUR);
    work = shown(sim, 'work');
    expect(work).toMatch(/Granted \w+ \d+, \d{4}, in force to \w+ \d+, \d{4}\./);
    expect(notices(sim).some((n) => n.includes('ETA'))).toBe(true);
  });

  it('a part in Los Angeles is a trip the production books for an actor in New Haven, and a part in New York a journey there and back', () => {
    const sim = graduate('b27-slate-away');
    const seen = { la: '', ny: '' };
    for (let w = 1; w < 80 && (!seen.la || !seen.ny); w += 1) {
      const week = sim.now + w * WEEK;
      for (const p of productionsOf(sim, week)) for (const t of p.parts) {
        keepProject(sim.player, t);
        const words = reachWords(sim.player, t, datesOf({ projectId: t.id, postedAt: week }));
        if (p.market.id === 'los-angeles') { expect(travels(sim.player, t), t.id).toBe(true); seen.la ||= words; }
        if (p.market.id === 'new-york') { expect(travels(sim.player, t), t.id).toBe(false); seen.ny ||= words; }
      }
    }
    expect(seen.la).toMatch(/^It’s a trip the production books: about \d+ hours door to door each way/);
    expect(seen.ny).toMatch(/^Getting there takes about (two|three) hours each way from where you live\.$/);
  });

  it('PLAYER JOURNEY: a recurring part in a series the slate made says on the Work tab that the series and its seasons are the game’s', () => {
    const sim = graduate('b27-slate-series-work');
    represent(sim);
    const s = seriesOfYear(sim, 2027).find((x) => seriesParts(sim, x, 2027).some((t) => t.schedule.kind === 'episodes' && writtenFor(t, sim.player)))!;
    const t = seriesParts(sim, s, 2027).find((x) => x.schedule.kind === 'episodes' && writtenFor(x, sim.player))!;
    const postedAt = sim.now + WEEK;
    played(sim, postedAt);
    keepProject(sim.player, t, seriesById(s.id));
    const o = offered(sim, t, postedAt, 'offered');
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = sim.player.pro!.engagements.find((x) => x.opportunityId === o.id)!;
    expect(e.contract?.series?.id).toBe(s.id);
    expect(shown(sim, 'work')).toContain(`${s.title} and ${s.company} are the game’s inventions, and so is each season: one was ordered, and the network says each year whether there’s another.`);
  });
});

describe('the unions and festivals two federations list, on the Charts And Awards tab', () => {
  it('says what FIA and FIAPF list where the actor lives, then every country either list names, each in its own name', async () => {
    const { PERFORMER_UNIONS, ACCREDITED_FESTIVALS } = await import('@/engine/content/industry');
    const sim = graduate('b27-industry-world');
    const page = shown(sim, 'industry');
    expect(page).toContain('Unions And Festivals Around The World');
    expect(page).toContain('Where you live, in the United States, FIA lists AEA – Actors’ Equity Association, AGMA – American Guild of Musical Artists and SAG-AFTRA – Screen Actors’ Guild – American Federation of Television and Radio Artists, and FIAPF accredits Fantastic Fest.');
    expect(page).toContain('Argentina : the union AAA – Asociación Argentina de Actores; the festival Mar del Plata International Film Festival.');
    const countries = new Set([...PERFORMER_UNIONS, ...ACCREDITED_FESTIVALS].map((x) => x.country));
    expect(page).toContain(`By Country: ${countries.size} Countries`);
    // The markup escapes an ampersand, as it does any name's.
    for (const x of [...PERFORMER_UNIONS, ...ACCREDITED_FESTIVALS]) expect(page).toContain(x.name.replace(/&/g, '&amp;'));
    expect(page).toContain('none of them has dealt with you');
  });
});

