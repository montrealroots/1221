/**
 * Brief 27, the series, releases and market cluster (2026-10-25): Part 13's "Guest work leading to a recurring
 * engagement", "A recurring character receiving a larger role" and "Revival or a distributor change where plausible"
 * (`INVITE`, `GROW`, `systems/continuity.ts`; `PICKUP`, `systems/series.ts`). Held here: a guest part played Exceptional,
 * weighed by its producers before the next season and brought back as a recurring character, offered without an audition
 * on a new contract, its guest part posted to the actor no more that season; the twin, the same part played as the engine
 * judged it, never weighed and posted again; a recurring part grown at its option, more episodes and more pay, read from
 * the work and the season's audience, and the twin judged Working, carried on as it was; and a canceled series back on
 * another network, said so, named on its page and on a credit for work in it, each word after it said by that network
 * and drawn at the series' own chance, so a save told its seasons before the pickup was drawn reads them as it was told.
 *
 * From the review of 2026-10-25: a guest part played Exceptional in a series whose network cancels the next season is
 * never weighed, and the twin in a series renewed is; a part whose further days clash with work booked on them carries
 * on at its old size, its option taken up; a series back on its own network after another picked it up is seen on its
 * own again, said so. Until then the pickup renewed a series at a chance of the new network's own, which turned seasons
 * a save had been told were renewed into cancellations.
 *
 * PLAYER JOURNEYS: a graduate's Desk Clerk and Assistant DA Whitlock on The Calloway Files in its 2026 season, each offer
 * accepted through the command and played by the clock; then the clock to the producers' word. Each save is the first of
 * its kind whose own draws give its case, found by reading the draws, never forced. TEST SETUP, said where it's done:
 * SAG-AFTRA membership, as tests/b27-revival.test.ts sets it; the offers on the record as casting's draws would leave
 * them; a day's band as a judge would have left it; an agent representing the actor; and a series of the game's whose
 * order ran out in 2012, kept as the save keeps a slate series, for the pickup.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR, zonedParts } from '@/engine/core/time';
import { addProjects, projectById, type ProjectTemplate } from '@/engine/content/careerwork';
import { SERIES, addSeries, episodeDays, seasonWindow } from '@/engine/content/series';
import { ensurePro, type Engagement } from '@/engine/systems/pro';
import { clauseOf, OPTION_RAISE } from '@/engine/systems/contracts';
import { postingTimes, postingsAt } from '@/engine/systems/projobs';
import { GROW, INVITE, RECUR_KIND, atWrap, audienceRatio, growChance, inviteAt, recurringPart } from '@/engine/systems/continuity';
import { PICKUP, RENEW_WEIGHTS, decisionWords, decisionsTo, networkOf, optionDrawn, pickupOf, renewChance, seasonMade } from '@/engine/systems/series';
import { pageOf } from '@/engine/systems/reference';
import type { Simulation } from '@/engine/core/simulation';
import { at, graduate, notices, played, zone } from './fakes/career-world';
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

  it('PLAYER JOURNEY: played Exceptional in a series whose network cancels the next season, never weighed and nothing offered; the twin in a series its network renews is weighed', () => {
    const seed = 'b27-returning-cancel';
    const probe = graduate(seed);
    // TEST SETUP: two series of the game's with their 2026 season ordered, each kept as the save keeps a slate series:
    // one whose network's word on 2027 can only be a cancellation, its draw at or over the most any season's chance reaches
    // (`RENEW_WEIGHTS`), and one whose word can only be a renewal, under the least; found by reading the draws.
    const idFor = (canceled: boolean) => [...Array(400).keys()].map((n) => `g1.test.invite.${n}`).find((id) => { const u = probe.rng('pro.series', id, 2027).next(); return canceled ? u >= RENEW_WEIGHTS.most : u < RENEW_WEIGHTS.least; })!;
    const run = (canceled: boolean) => {
      const sim = graduate(seed);
      sag(sim);
      const s = { ...CALLOWAY, id: idFor(canceled), title: 'The Harrow Line', company: 'Corbin Gate Television', firstSeason: 2026, orderedThrough: 2026 };
      addSeries([s]);
      (ensurePro(sim, sim.player).series ??= {})[s.id] = s;
      // TEST SETUP: its guest part, the Desk Clerk's, kept as the save keeps a slate part.
      const t: ProjectTemplate = { ...CLERK, id: `${s.id}.desk-clerk`, series: s.id, project: s.title, company: s.company };
      addProjects([t]);
      (sim.player.pro!.projects ??= {})[t.id] = t;
      const o = offered(sim, t, at(2026, 9, 7));
      const eid = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
      const e = sim.player.pro!.engagements.find((x) => x.id === eid)!;
      played(sim, e.days[0]!.to + 2 * MS_HOUR);
      // TEST SETUP: the days judged Exceptional, as a judge would have left them.
      for (const l of e.log ?? []) if (l.status === 'worked') l.band = 'exceptional';
      played(sim, e.days.at(-1)!.to + 2 * MS_HOUR);
      expect(e.status).toBe('finished');
      // Put before its producers for 2027, after the network's word, since 2027 isn't ordered.
      expect(sim.universe.scheduled.some((i) => i.kind === RECUR_KIND && i.refId === e.id && i.status === 'pending' && i.at === inviteAt(s, 2027))).toBe(true);
      sim.advanceTo(inviteAt(s, 2027) + MS_HOUR);
      return { sim, s, t, e };
    };
    const gone = run(true);
    expect(seasonMade(gone.sim, gone.s, 2027)).toBe(false);
    expect(gone.e.invite).toBeUndefined();
    expect(gone.sim.player.pro!.opportunities.some((x) => x.projectId === recurringPart(gone.t, 2027).id)).toBe(false);
    expect(notices(gone.sim).some((n) => n.includes('as a recurring character'))).toBe(false);
    // The falsifiability twin: the same part played the same, in a series renewed for 2027, weighed by its producers.
    const kept = run(false);
    expect(seasonMade(kept.sim, kept.s, 2027)).toBe(true);
    expect(kept.e.invite).toEqual({ year: 2027, invited: kept.sim.rng('pro.recurring', kept.e.id, 2027).next() < INVITE.chance.exceptional });
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
    // The season's audience is read: over its outlet's bar the part grows more often, under it less, and a played season's
    // audience stands somewhere other than exactly at the bar.
    expect(growChance('strong', 1.5)).toBeGreaterThan(growChance('strong', 1));
    expect(growChance('strong', 0.5)).toBeLessThan(growChance('strong', 1));
    const { sim, e } = playedPart(seed, WHITLOCK.id, 'strong');
    expect(audienceRatio(sim, CALLOWAY, 2026)).not.toBe(1);
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

    // The same save as the grown one, with other work booked on the first further episode's day: the option is taken up
    // and the part carries on at its old size, since the production can't write more on a day the actor is booked.
    const clash = playedPart(seed, WHITLOCK.id, 'strong');
    played(clash.sim, at(2027, 6, 1));
    const guaranteed = WHITLOCK.schedule.kind === 'episodes' ? WHITLOCK.schedule.guaranteed : 0;
    const further = episodeDays(CALLOWAY, 2027, guaranteed + 1)[0]!;
    const days = (a: number) => { const p = zonedParts(a, zone); return Date.UTC(p.year, p.month - 1, p.day) / MS_DAY; };
    const postedAt = at(2027, 6, 1);
    // TEST SETUP: a one-off part near home whose first day is that day, offered as casting's draws would leave it.
    const other: ProjectTemplate = { ...CLERK, id: 'b27-returning-clash', series: undefined, project: 'The Errand Of Fenwick Pass', company: 'Corbin Hollow Pictures', role: { ...CLERK.role, part: 'Ivy' }, leadDays: days(further) - days(postedAt) };
    addProjects([other]);
    const oc = offered(clash.sim, other, postedAt);
    const bid = clash.sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: oc.id } }).engagementId;
    const booked = clash.sim.player.pro!.engagements.find((x) => x.id === bid)!;
    expect(days(booked.days[0]!.from)).toBe(days(further));
    const o3 = clauseOf(clash.e.contract, 'option')!;
    expect(o3.status).toBe('open');
    clash.sim.advanceTo(o3.by + MS_HOUR);
    expect(o3.status).toBe('exercised');
    const n3 = clash.sim.player.pro!.engagements.find((x) => x.id === o3.settled!.engagementId)!;
    expect(n3.contract!.grew).toBeUndefined();
    expect(clauseOf(n3.contract, 'episodes')!.numbers.length).toBe(guaranteed);
    expect(n3.contract!.rate).toBe(Math.round(old * (1 + OPTION_RAISE)));
  }, 1_200_000);
});

describe('a canceled series back on another network', () => {
  it('comes back on another of its kind about half the time, said so and named on its page and its credits; each word after it is that network’s, drawn at the series’ own chance, and a revival by its own network takes it home', () => {
    const sim = graduate('b27-returning-pickup');
    let picked = 0;
    let own = 0;
    let afterPickup = 0;
    let home = 0;
    for (let n = 0; n < 80; n += 1) {
      const s = { ...CALLOWAY, id: `test-pickup-${n}`, firstSeason: 2018, orderedThrough: 2020 };
      const all = decisionsTo(sim, s, 2045);
      // Every word drawn as it was before a pickup could be drawn: a renewal at the series' own chance, read from the last
      // season's audience and reviews, whoever picked it up. A save told these words before reads them the same.
      let on = true;
      for (const d of all) {
        const draw = sim.rng('pro.series', s.id, d.year).next();
        if (on) expect(d.what, `${s.id} ${d.year}`).toBe(draw < renewChance(sim, s, d.year) ? 'renewed' : 'canceled');
        else expect([d.what, draw < s.chance.revive]).toEqual(['revived', true]);
        on = d.what !== 'canceled';
      }
      for (const d of all.filter((x) => x.what === 'revived')) {
        expect(d.network).toBe(pickupOf(sim, s, d.year));
        if (d.network) {
          picked += 1;
          expect(d.network).toMatch(/ (Television|Network)$/);
          expect(decisionWords(sim, s, d)).toContain(`${d.network}, a network invented for the game, picked up ${s.title} after its cancellation`);
          expect(networkOf(sim, s, d.year)).toEqual({ name: d.network, since: d.year });
          // The next word is the new network's, said by its name.
          const next = all.find((x) => x.year === d.year + 1);
          if (next) { afterPickup += 1; expect(decisionWords(sim, s, next)).toContain(`, ${d.network} ${next.what} ${s.title}`); }
        } else {
          own += 1;
          // Back on its own network after another had it: seen on its own again, and said to be the one that first aired it.
          if (networkOf(sim, s, d.year - 1).since !== undefined) {
            home += 1;
            expect(networkOf(sim, s, d.year)).toEqual({ name: s.company });
            expect(decisionWords(sim, s, d)).toContain(`, the network that first aired it brought ${s.title} back`);
          }
        }
      }
    }
    expect(picked).toBeGreaterThan(5);
    expect(own).toBeGreaterThan(5);
    expect(afterPickup).toBeGreaterThan(5);
    expect(home).toBeGreaterThan(0);
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
