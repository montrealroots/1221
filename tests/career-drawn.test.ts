/**
 * Parts the game draws from real productions (brief 25, `docs/verification/career-world-2026-10-23/criteria.md`,
 * Module 2, C8 to C12; the register's CAT-13, CAT-14, PROV-04, PROV-06, PROV-08, PROV-09 and T61): each a new character
 * in a season the game imagines, saying it's the game's own wherever it's shown; no casting director, deal or salary
 * the sources don't give; a trip from home to Los Angeles under the US rule; casting keyed by the posting, so a part
 * added to the game moves no other part's casting; and a represented life put up for one, taped, decided, booked, flown
 * out, worked, paid and flown home.
 *
 * PLAYER JOURNEYS: a new life played by the clock and the commands a player sends (tests/fakes/career-world.ts); TEST
 * SETUP, said where it's done: the graduate, the skilled actor's levels, and the agreement written as the agent's system
 * writes one (tests/fakes/career-work.ts).
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MS_DAY, MS_HOUR, zonedParts } from '@/engine/core/time';
import { PROJECTS, RATES, projectById } from '@/engine/content/careerwork';
import { CATALOG, companiesAs, productionById, productionWords } from '@/engine/content/catalog';
import { ensurePro, type Opportunity } from '@/engine/systems/pro';
import { f1Of } from '@/engine/systems/permission';
import { WORK, acceptRefusal, acceptWarning, castingDraw, drawnWords, fieldOf, kindPhrase, projectOf, reachWords, roleWords } from '@/engine/systems/projobs';
import { planTrip, tripOf, tripRead, visaRefusal, whereAt } from '@/engine/systems/worktrip';
import { at, graduate, notices, played, playRound, portfolio, reload, skilled, student, tended } from './fakes/career-world';
import { signed } from './fakes/career-work';

// The Career screen drawn over the journey's save, as tests/pro-opportunities-screen.test.ts draws it: `useGame` standing
// in for the provider, the kept tab answered from `h.tab`.
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

const DRAWN = PROJECTS.filter((t) => t.drawn);
const LA = 'America/Los_Angeles';

describe('C8 and C9: a drawn part is the game’s own, in a real production it names truly', () => {
  it('draws two parts, each from a series on the air, a new character, cast by the production’s office unnamed, at the union minimum', () => {
    expect(DRAWN.map((t) => t.id)).toEqual(['nine-one-one-guest', 'abbott-guest']);
    const characters = new Set(CATALOG.flatMap((p) => p.cast.flatMap((c) => (c.character.kind === 'read' ? [c.character.value] : []))));
    for (const t of DRAWN) {
      const p = productionById(t.drawn!.production)!;
      expect(p.format, t.id).toBe('series');
      expect(t.fictional).toBe(false);
      expect(characters.has(t.role.part), t.role.part).toBe(false);
      expect(t.casting).toBe('the production’s casting office');
      expect(t.company).toBe(companiesAs(p, 'producer').join(' and '));
      expect(RATES[t.pay]).toBeDefined();
      expect(t.access).toEqual({ agent: true, open: false });
    }
    // No part from a film announced or released, from Severance (no season ahead in its pages) or from Slow Horses (the
    // UK's rules and pay aren't in the game).
    const from = new Set(DRAWN.map((t) => t.drawn!.production));
    for (const p of CATALOG) if (p.format === 'film') expect(from.has(p.id), p.title).toBe(false);
    expect([from.has('severance'), from.has('slow-horses')]).toEqual([false, false]);
  });

  it('says so on the role and the offer, and names the broadcaster its page gives', () => {
    const nine = projectById('nine-one-one-guest')!;
    expect(kindPhrase(nine)).toBe('a network television drama on ABC, in a part the game made up');
    expect(roleWords(nine)).toBe('Reese Pike in 9-1-1, a network television drama on ABC, in a part the game made up');
    expect(drawnWords(nine)).toBe('Reese Pike is the game’s own character, in a season of 9-1-1 the game imagines, after its tenth. It isn’t a real casting notice, and no one at the real production is casting it. The game sets this part’s shoot in Los Angeles: no page it read says where 9-1-1 films.');
    expect(kindPhrase(projectById('abbott-guest')!)).toBe('a network television comedy on ABC, in a part the game made up');
    expect(kindPhrase(projectById('calloway-files')!)).toBe('a fictional network television drama');
    // Filed as television for an agent's department, by its medium, as network drama is.
    expect(fieldOf(projectById('abbott-guest')!)).toBe('television');
  });
});

describe('C10: Los Angeles is a trip from home, under the US rule', () => {
  it('flies New Haven to Los Angeles direct, says the trip door to door, needs no visa, and reads the US rule', () => {
    const days = [0, 1].map((k) => ({ from: at(2027, 3, 8 + k, 10) , to: at(2027, 3, 8 + k, 19) }));
    const plan = planTrip('us-ct-newhaven', 'us-ca-losangeles', days)!;
    expect(plan.legs.map((l) => `${l.way} ${l.mode} ${l.from}>${l.to}`)).toEqual([
      'out car us-ct-newhaven>us-ny-newyork', 'out flight us-ny-newyork>us-ca-losangeles', 'out car us-ca-losangeles>us-ca-losangeles',
      'back car us-ca-losangeles>us-ca-losangeles', 'back flight us-ca-losangeles>us-ny-newyork', 'back car us-ny-newyork>us-ct-newhaven',
    ]);
    const sim = graduate('drawn-la');
    const nine = projectById('nine-one-one-guest')!;
    expect(reachWords(sim.player, nine, days)).toMatch(/^It’s a trip the production books: about \d+ hours door to door each way, by car and by air, landing at least 36 hours before the first call\.$/);
    expect(reachWords(sim.player, projectById('calloway-files')!, days)).toBe('Getting there takes about two hours each way from where you live.');
    const read = tripRead(sim.player, 'us', days, undefined, sim.now);
    expect(read).toMatchObject({ authorized: true, basis: 'citizen' });
    const e = { id: 'x', status: 'booked', days } as never;
    expect(visaRefusal(sim.player, e, nine, sim.now)).toBe('Work in the US needs no visa, only your permission to work here.');
  });

  it('refuses an F-1 student by the US rule, as work at home, never by a country’s', () => {
    const sim = student('drawn-f1', { homeRegionId: 'uk-eng-london' });
    expect(f1Of(sim.player)).toBeDefined();
    tended(sim, at(2026, 9, 14));
    // TEST SETUP: an offer for the drawn part, written as casting writes one.
    const o: Opportunity = { id: sim.nextId('pro'), projectId: 'nine-one-one-guest', via: 'agent', status: 'offered', postedAt: sim.now, submitBy: sim.now + 7 * MS_DAY, offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: 'sag-tv-day', amount: 1_402_00, per: 'day', units: 2 }, history: [], counts: {} };
    ensurePro(sim, sim.player).opportunities.push(o);
    expect(acceptRefusal(sim, sim.player, o)).toMatch(/^Your F-1 lets you work only on campus.* That rules out work on \w+ \d+, \d{4}\.$/);
  });
});

describe('C11: casting keyed by the posting', () => {
  it('decides a posting the same whatever its opportunity’s number in the save, and two postings apart', () => {
    const sim = graduate('drawn-key');
    const posting = { projectId: 'nine-one-one-guest', postedAt: at(2029, 6, 4) };
    const a = castingDraw(sim, { ...posting, id: 'pro-1' } as Pick<Opportunity, 'projectId' | 'postedAt'>, 'final', 'strong', 0.8);
    const b = castingDraw(sim, { ...posting, id: 'pro-999' } as Pick<Opportunity, 'projectId' | 'postedAt'>, 'final', 'strong', 0.8);
    expect(a).toEqual(b);
    // Forty postings a week apart are forty draws, not one.
    const yes = Array.from({ length: 40 }, (_, n) => castingDraw(sim, { projectId: 'nine-one-one-guest', postedAt: posting.postedAt + n * 7 * MS_DAY }, 'final', 'strong', 0.8).yes);
    expect(new Set(yes).size).toBe(2);
  });
});

const isDrawn = (o: Pick<Opportunity, 'projectId'>) => !!projectById(o.projectId)?.drawn;

/** The first seed whose represented, skilled graduate is offered a drawn part, through the agent's breakdowns. */
function offeredDrawn(): { sim: ReturnType<typeof graduate>; o: Opportunity } {
  for (let n = 0; n < 40; n += 1) {
    const sim = graduate(`drawn-${n}`);
    skilled(sim);
    portfolio(sim);
    signed(sim, sim.now); // TEST SETUP: an agreement in force, as the agent's system writes one
    for (let w = 0; w < 30; w += 1) {
      const o = sim.player.pro!.opportunities.find((x) => isDrawn(x) && (x.status === 'audition' || x.status === 'callback'));
      if (o) {
        while (o.status === 'audition' || o.status === 'callback') playRound(sim, o);
        if (o.status === 'offered') return { sim, o };
        break;
      }
      played(sim, sim.now + 7 * MS_DAY);
    }
  }
  throw new Error('No seed reached an offer for a drawn part.');
}

describe('C12: a drawn part played', () => {
  it('PLAYER JOURNEY: put up by the agent, taped, offered with the game’s notice, accepted, flown to Los Angeles, worked, paid less commission and flown home; saved and loaded on the way', () => {
    const { sim, o } = offeredDrawn();
    const t = projectOf(o);
    expect(o.via).toBe('agent');
    const q = Object.values(sim.universe.decisions).find((d) => d.refId === o.id)!;
    expect(q.detail).toContain(drawnWords(t)!);
    // Where the player reads it: the role says it's the game's own and gives the real production as its pages had it.
    const opp = shown(sim, 'opportunities');
    expect(opp).toContain(`The Game’s Own Part ${drawnWords(t)}`);
    expect(opp).toContain(`${t.project}, As Its Pages Had It ${productionWords(productionById(t.drawn!.production)!).join(' ')}`);
    expect(opp).toContain(`${t.project}, ${kindPhrase(t)}, by ${t.company}, cast by the production’s casting office.`);
    expect(opp).not.toContain('Every project, company and casting office here is invented');
    expect(acceptRefusal(sim, sim.player, o)).toBeUndefined();
    expect(acceptWarning(sim, sim.player, o)).toMatch(new RegExp(`^This work is in Los Angeles\\. You’d be away from \\w+ \\d+, \\d{4} to \\w+ \\d+, \\d{4}\\. ${t.trip!.words.replace(/[.]/g, '\\.')}`));
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = sim.player.pro!.engagements.find((x) => x.opportunityId === o.id)!;
    const trip = tripOf(sim.player, e)!;
    expect(trip.country).toBe('us');
    expect(trip.legs.map((l) => l.mode)).toEqual(['car', 'flight', 'car', 'car', 'flight', 'car']);
    const twin = reload(sim);
    played(sim, trip.legs[2]!.arrives + MS_HOUR);
    expect(whereAt(sim.player, sim.now)).toMatchObject({ kind: 'away', cityId: 'us-ca-losangeles' });
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');
    played(sim, trip.legs[trip.legs.length - 1]!.arrives + MS_HOUR);
    played(twin, trip.legs[trip.legs.length - 1]!.arrives + MS_HOUR);
    expect(e.log!.map((l) => l.status)).toEqual(['worked', 'worked']);
    // Each call at the shoot's hour in Los Angeles, the town's own clock, as a shoot in New York is at New York's.
    for (const d of e.days) expect(zonedParts(d.from, LA)).toMatchObject({ hour: WORK.shoot.hour, minute: 0 });
    expect(trip.status).toBe('home');
    expect(notices(sim).some((n) => n.startsWith('You’re Home From Los Angeles'))).toBe(true);
    const work = shown(sim, 'work');
    expect(work).toContain(drawnWords(t)!);
    // The agreement names the real company and says nothing of fiction, the notice above it having said what's the game's.
    expect(work).toContain(`Who ${t.company}, ${t.contract}. Where`);
    expect(work).not.toContain('Fictional');
    const credit = sim.player.pro!.credits.find((c) => c.engagementId === e.id)!;
    expect(credit).toMatchObject({ project: t.project, role: t.role.part, company: t.company });
    played(sim, Math.max(...e.pay.map((p) => p.due)) + 8 * MS_DAY);
    played(twin, Math.max(...e.pay.map((p) => p.due)) + 8 * MS_DAY);
    for (const p of e.pay) expect(p.received?.via).toBe('trust');
    const e2 = twin.player.pro!.engagements.find((x) => x.id === e.id)!;
    expect(e2.pay.map((p) => p.received?.net)).toEqual(e.pay.map((p) => p.received?.net));
  });
});
