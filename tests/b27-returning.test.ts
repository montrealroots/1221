/**
 * Brief 27, the series, releases and market cluster (2026-10-25): Part 13's "Guest work leading to a recurring
 * engagement", "A recurring character receiving a larger role" and "Revival or a distributor change where plausible"
 * (`INVITE`, `GROW`, `systems/continuity.ts`; `PICKUP`, `systems/series.ts`). Held here: a guest part played Exceptional,
 * weighed by its producers before the next season and brought back as a recurring character, offered without an audition
 * on a new contract, its guest part posted to the actor no more that season; the twin, the same part played as the engine
 * judged it, never weighed and posted again; a recurring part grown at its option, more episodes and more pay, read from
 * the work and the season's audience, and the twin judged Working, carried on as it was; and a canceled series back on
 * another network, said so, renewed from that network's chance, named on its page and on a credit for work in it.
 *
 * PLAYER JOURNEYS: a graduate's Desk Clerk and Assistant DA Whitlock on The Calloway Files in its 2026 season, each offer
 * accepted through the command and played by the clock; then the clock to the producers' word. Each save is the first of
 * its kind whose own draws give its case, found by reading the draws, never forced. TEST SETUP, said where it's done:
 * SAG-AFTRA membership, as tests/b27-revival.test.ts sets it; the offers on the record as casting's draws would leave
 * them; a day's band as a judge would have left it; an agent representing the actor; and a series of the game's whose
 * order ran out in 2012, kept as the save keeps a slate series, for the pickup.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { projectById } from '@/engine/content/careerwork';
import { SERIES, addSeries, seasonWindow } from '@/engine/content/series';
import { ensurePro, type Engagement } from '@/engine/systems/pro';
import { clauseOf, OPTION_RAISE } from '@/engine/systems/contracts';
import { postingTimes, postingsAt } from '@/engine/systems/projobs';
import { GROW, INVITE, RECUR_KIND, atWrap, audienceRatio, growChance, inviteAt, recurringPart } from '@/engine/systems/continuity';
import { PICKUP, decisionWords, decisionsTo, networkOf, optionDrawn, pickupOf, renewChance } from '@/engine/systems/series';
import { pageOf } from '@/engine/systems/reference';
import type { Simulation } from '@/engine/core/simulation';
import { at, graduate, notices, played } from './fakes/career-world';
import { represent } from './fakes/b20-career';
import { offered } from './fakes/b27-series';

const CALLOWAY = SERIES[0]!;
const CLERK = projectById('calloway-files')!;
const WHITLOCK = projectById('calloway-files-whitlock')!;
const sag = (sim: Simulation) => { ensurePro(sim, sim.player).sag = { eligibleSince: sim.now - 60 * MS_DAY, memberSince: sim.now - 30 * MS_DAY }; };

/** A Calloway Files part accepted for its 2026 season and played to its end, the first day's band set where given. */
function playedPart(seed: string, id: string, firstBand?: 'exceptional' | 'strong' | 'working'): { sim: Simulation; e: Engagement } {
  const sim = graduate(seed);
  sag(sim);
  const o = offered(sim, projectById(id)!, at(2026, 9, 7));
  const eid = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
  const e = sim.player.pro!.engagements.find((x) => x.id === eid)!;
  played(sim, e.days[0]!.to + 2 * MS_HOUR);
  // TEST SETUP: the first day's band, as a judge would have left it.
  if (firstBand) e.log![0]!.band = firstBand;
  played(sim, e.days.at(-1)!.to + 2 * MS_HOUR);
  return { sim, e };
}

describe('a guest part brought back as a recurring character', () => {
  it('PLAYER JOURNEY: played Exceptional, weighed before the next season and offered back without an audition on a new contract; the twin played as judged is never weighed, and its part comes round again', () => {
    let found: { sim: Simulation; e: Engagement } | undefined;
    let seed = '';
    for (let k = 0; k < 8 && !found; k += 1) {
      seed = `b27-returning-guest-${k}`;
      const run = playedPart(seed, CLERK.id, 'exceptional');
      expect(run.e.status).toBe('finished');
      // Put before the producers for the next season, six weeks before it, since it's already ordered.
      const item = run.sim.universe.scheduled.find((i) => i.kind === RECUR_KIND && i.refId === run.e.id && i.status === 'pending')!;
      expect(item.at).toBe(inviteAt(CALLOWAY, 2027));
      expect(inviteAt(CALLOWAY, 2027)).toBe(seasonWindow(CALLOWAY, 2027).from - 42 * MS_DAY);
      if (run.sim.rng('pro.recurring', run.e.id, 2027).next() < INVITE.chance.exceptional) found = run;
    }
    expect(found).toBeDefined();
    const { sim, e } = found!;
    sim.advanceTo(inviteAt(CALLOWAY, 2027) + MS_HOUR);
    expect(e.invite).toEqual({ year: 2027, invited: true });
    const rt = recurringPart(CLERK, 2027);
    const o = sim.player.pro!.opportunities.find((x) => x.projectId === rt.id)!;
    expect(o.status).toBe('offered');
    expect(o.direct).toEqual(expect.objectContaining({ engagementId: e.id, returning: true }));
    expect(o.direct!.words).toContain('Your work as Desk Clerk in the eighth season of The Calloway Files was Exceptional, and its producers want Desk Clerk back as a recurring character in its new season');
    const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
    const next = sim.player.pro!.engagements.find((x) => x.id === id)!;
    expect(next.contract!.series).toMatchObject({ id: CALLOWAY.id, year: 2027 });
    expect(clauseOf(next.contract, 'episodes')!.numbers.length).toBe(INVITE.guaranteed);
    expect(clauseOf(next.contract, 'option')).toMatchObject({ year: 2028, status: 'open' });
    expect(sim.player.pro!.projects![rt.id]).toBeDefined();
    // Its guest part isn't posted to the actor in that season; the twin's is.
    represent(sim);
    const mondays = postingTimes(at(2027, 6, 7), at(2028, 3, 1));
    const posted = (s: Simulation) => mondays.filter((m) => postingsAt(s, s.player, m).some((p) => p.project.id === CLERK.id)).length;
    expect(posted(sim)).toBe(0);
    // The falsifiability twin: the same save, the part as the engine judged it, never weighed and nothing offered.
    const twin = playedPart(seed, CLERK.id);
    expect(['exceptional', 'strong']).not.toContain(twin.e.log!.map((l) => l.band).find(Boolean));
    expect(twin.sim.universe.scheduled.some((i) => i.kind === RECUR_KIND)).toBe(false);
    twin.sim.advanceTo(inviteAt(CALLOWAY, 2027) + MS_HOUR);
    expect(twin.e.invite).toBeUndefined();
    expect(twin.sim.player.pro!.opportunities.some((x) => x.projectId === rt.id)).toBe(false);
    represent(twin.sim);
    expect(posted(twin.sim)).toBeGreaterThan(0);
  }, 1_200_000);
});

describe('a recurring part grown at its option', () => {
  it('PLAYER JOURNEY: taken up with more episodes guaranteed and more pay, read from the work and the season’s audience; the twin judged Working is carried on as it was', () => {
    // A save whose engagement's draws take the option up for Strong and Working work, and grow the part for Strong only.
    let seed = '';
    for (let k = 0; k < 12 && !seed; k += 1) {
      const { sim, e } = playedPart(`b27-returning-grow-${k}`, WHITLOCK.id, 'strong');
      const u = sim.rng('pro.grow', e.id, 2027).next();
      const ratio = audienceRatio(sim, CALLOWAY, 2026);
      const work = e.log!.map((l) => l.band);
      const asWorking = { ...e, log: e.log!.map((l) => ({ ...l, band: 'working' as const })) };
      if (optionDrawn(sim, e) && optionDrawn(sim, asWorking) && u < growChance('strong', ratio) && u >= growChance('working', ratio) && !work.includes('exceptional')) seed = `b27-returning-grow-${k}`;
    }
    expect(seed).not.toBe('');
    const { sim, e } = playedPart(seed, WHITLOCK.id, 'strong');
    played(sim, at(2027, 6, 1));
    const option = clauseOf(e.contract, 'option')!;
    const old = sim.player.pro!.opportunities.find((x) => x.id === e.opportunityId)!.offer!.amount!;
    sim.advanceTo(option.by + MS_HOUR);
    expect(option.status).toBe('exercised');
    const next = sim.player.pro!.engagements.find((x) => x.id === option.settled!.engagementId)!;
    expect(next.contract!.grew).toEqual({ episodes: GROW.episodes, raise: GROW.raise });
    const ep = clauseOf(next.contract, 'episodes')!;
    expect([ep.numbers.length, ep.guaranteed]).toEqual([WHITLOCK.schedule.kind === 'episodes' ? WHITLOCK.schedule.guaranteed + GROW.episodes : 0, ep.numbers.length]);
    expect(next.contract!.rate).toBe(Math.round(old * (1 + OPTION_RAISE + GROW.raise)));
    expect(notices(sim).some((n) => n.includes('The production wrote more for the part: two more episodes guaranteed, and 10% more a day on top of the option’s raise.'))).toBe(true);
    // The falsifiability twin: the same save, the season's days judged Working.
    const twin = playedPart(seed, WHITLOCK.id, 'working');
    for (const l of twin.e.log!) if (l.band) l.band = 'working';
    played(twin.sim, at(2027, 6, 1));
    for (const l of twin.e.log!) if (l.band) l.band = 'working';
    const o2 = clauseOf(twin.e.contract, 'option')!;
    twin.sim.advanceTo(o2.by + MS_HOUR);
    expect(o2.status).toBe('exercised');
    const n2 = twin.sim.player.pro!.engagements.find((x) => x.id === o2.settled!.engagementId)!;
    expect(n2.contract!.grew).toBeUndefined();
    expect(clauseOf(n2.contract, 'episodes')!.numbers.length).toBe(WHITLOCK.schedule.kind === 'episodes' ? WHITLOCK.schedule.guaranteed : 0);
  }, 1_200_000);
});

describe('a canceled series back on another network', () => {
  it('comes back on another of its kind about half the time, renewed from that network’s chance, said so and named on its page and its credits', () => {
    const sim = graduate('b27-returning-pickup');
    let picked = 0;
    let own = 0;
    let differs = 0;
    for (let n = 0; n < 80; n += 1) {
      const s = { ...CALLOWAY, id: `test-pickup-${n}`, firstSeason: 2018, orderedThrough: 2020 };
      const all = decisionsTo(sim, s, 2040);
      for (const d of all.filter((x) => x.what === 'revived')) {
        expect(d.network).toBe(pickupOf(sim, s, d.year));
        if (d.network) {
          picked += 1;
          expect(d.network).toMatch(/ (Television|Network)$/);
          expect(decisionWords(sim, s, d)).toContain(`${d.network}, a network invented for the game, picked up ${s.title} after its cancellation`);
          expect(networkOf(sim, s, d.year)).toEqual({ name: d.network, since: d.year });
          // Renewed from the new network's chance after: the next word follows that chance.
          const next = all.find((x) => x.year === d.year + 1);
          if (next) expect(next.what === 'renewed').toBe(sim.rng('pro.series', s.id, d.year + 1).next() < renewChance(sim, s, d.year + 1, PICKUP.renew));
          if (renewChance(sim, s, d.year + 1, PICKUP.renew) !== renewChance(sim, s, d.year + 1)) differs += 1;
        } else own += 1;
      }
    }
    expect(differs).toBeGreaterThan(0);
    expect(picked).toBeGreaterThan(5);
    expect(own).toBeGreaterThan(5);
    expect(Math.abs(picked / (picked + own) - PICKUP.chance)).toBeLessThan(0.15);
    // TEST SETUP: a series of the game's, kept as the save keeps a slate series, picked up before now.
    let s = CALLOWAY;
    for (let n = 0; n < 200; n += 1) {
      const x = { ...CALLOWAY, id: `g1.test.${n}`, title: `The Harrow Line ${n}`, company: 'Corbin Gate Television', firstSeason: 2010, orderedThrough: 2012 };
      if (decisionsTo(sim, x, 2026).some((d) => d.network && d.at < sim.now)) { s = x; break; }
    }
    expect(s).not.toBe(CALLOWAY);
    addSeries([s]);
    (ensurePro(sim, sim.player).series ??= {})[s.id] = s;
    const back = decisionsTo(sim, s, 2026).filter((d) => d.network && d.at < sim.now).pop()!;
    const page = pageOf(sim, sim.player, { kind: 'series', id: s.id })!;
    const facts = page.sections.flatMap((x) => x.facts);
    const now = networkOf(sim, s, new Date(sim.now).getUTCFullYear());
    expect(now.since).toBe(back.year);
    expect(facts.find((f) => f.label === 'Seen On')).toEqual(expect.objectContaining({ words: `${back.network}, invented for the game, which picked it up for the season beginning in ${back.year}`, known: 'simulated' }));
    // A credit for work in a season after it carries the network.
    const t = { ...WHITLOCK, id: `${s.id}.part`, series: s.id };
    const c = ensurePro(sim, sim.player).credits;
    c.push({ id: 'test-credit', kind: 'screen', project: s.title, role: 'Ivy', company: s.company, year: back.year, medium: 'television', status: 'shot', at: seasonWindow(s, back.year).from + 30 * MS_DAY });
    atWrap(sim, sim.player, { id: 'test-e', opportunityId: 'x', projectId: t.id, role: 'Ivy', status: 'finished', days: [], pay: [], history: [], counts: {} }, t, 'test-credit');
    expect(c.find((x) => x.id === 'test-credit')!.network).toBe(networkOf(sim, s, back.year).name);
  });
});
