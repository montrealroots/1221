/**
 * The work loop (brief 19, `docs/verification/career-2026-10-20/criteria.md` J1 to J5, A3, A4, F4's work half, and the
 * playthroughs V2, V3, V10, V11's first half, V12, V13's loop half and V15): fictional roles posted each Monday, a
 * submission that reads the portfolio, auditions in person and on tape, a callback, casting decided apart from quality,
 * offers accepted and declined, work days on the calendar judged by the evaluation, the lasting credit, the promised
 * pay, the agent's part while an agreement is in force, and the School's rule on work in term.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole at Yale in New Haven, born in New York,
 * starting Monday 24 August 2026 at 7:30 AM, played by the clock and the commands a player sends, the notices and the
 * record read in order. TEST SETUP, said where it's done: the body kept fed, rested and awake as the clock moves
 * (`tended`); a graduate made through the School's own Commencement handler with the last term put on the clock, as
 * tests/pro-core.test.ts makes one; a skilled actor's craft, abilities and genre knowledge set as years of work would
 * leave them (`skilled`); an agreement signed with the agent, which is the agent builder's to make in play (`represent`);
 * and, where a casting draw decides, the first of a list of seeds whose draw goes the way the journey needs, the draw's
 * own spread being tested over seeds (J5).
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, startOfDay, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { answerStop } from '@/engine/world/clock';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { COMMENCEMENT_KIND, EVALUATION_KIND, evenCraft } from '@/engine/systems/school';
import { attributesOf } from '@/engine/systems/attributes';
import { genreState } from '@/engine/systems/engagement';
import { PROJECTS, RATES, projectById } from '@/engine/content/careerwork';
import { AGENTS } from '@/engine/content/agents';
import { type Agreement, type Opportunity, activeAgreement } from '@/engine/systems/pro';
import {
  AUDITION_KIND, CASTING, POSTING, WORK, WORK_DAY_KIND, acceptRefusal, acceptWarning, awayAt, castingDraw, chanceOf, conditionsFor, datesOf,
  classDaysIn, clashesAt, fitOf, inSessionAt, moveRefusal, payGroups, payTermsOf, postingTimes, postingsAt, projectOf, requestRefusal, roundToCome, submitRefusal, tapeRefusal,
} from '@/engine/systems/projobs';

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
/**
 * Played as a player plays it from the top bar: the clock moved six hours at a time, stopping at every commitment that
 * wants the player, and Go pressed at each (`answerStop`, the stop's own rule). TEST SETUP: tended as it moves.
 */
const played = (sim: Simulation, until: number) => {
  const tend = () => {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
  };
  while (sim.now < until) {
    tend();
    const wanted = Math.min(until, sim.now + 6 * MS_HOUR);
    let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    for (let n = 0; r.interruptedBy && n < 50; n += 1) {
      tend();
      r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!;
    }
  }
};
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const notices = (sim: Simulation, from = 0) => sim.universe.notifications.filter((n) => n.category === 'career' && n.at >= from).map((n) => `${n.title} | ${n.body}`);

/** TEST SETUP: a graduate of the class of 2029, by the School's own evaluation and Commencement, as tests/pro-core.test.ts makes one. */
function graduate(seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}) {
  const sim = student(seed, more);
  tended(sim, at(2026, 9, 1, 18));
  const school = sim.player.school!;
  Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } } as never;
  sim.schedule({ at: sim.now + 60_000, kind: EVALUATION_KIND, label: 'Spring Term 2029 Evaluation', category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, term: 5 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  const booked = sim.universe.scheduled.filter((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending');
  sim.timeline.cancel(booked[0]!.id, sim.now);
  sim.schedule({ at: at(2026, 9, 3, 10), kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 32, durationMinutes: 180, payload: booked[0]!.payload });
  tended(sim, at(2026, 9, 3, 13));
  expect(sim.player.school!.standing).toBe('graduated');
  return sim;
}

/** TEST SETUP: a skilled actor, as years of work would leave one: every technique at 92, every ability at 95, the projects' genres known. */
function skilled(sim: Simulation): void {
  sim.player.craft = evenCraft(92);
  const attrs = attributesOf(sim, sim.player) as unknown as Record<string, number>;
  for (const k of Object.keys(attrs)) if (typeof attrs[k] === 'number') attrs[k] = 95;
  for (const t of PROJECTS) for (const g of t.genres) genreState(sim.player, g).familiarity = 95;
}

/** TEST SETUP: a developing actor, a recent graduate's levels: techniques at 62, abilities at 62, the projects' genres half known. */
function developing(sim: Simulation): void {
  sim.player.craft = evenCraft(62);
  const attrs = attributesOf(sim, sim.player) as unknown as Record<string, number>;
  for (const k of Object.keys(attrs)) if (typeof attrs[k] === 'number') attrs[k] = 62;
  for (const t of PROJECTS) for (const g of t.genres) genreState(sim.player, g).familiarity = 50;
}

/** TEST SETUP: an agreement with the agent, signed now for a year: the agent builder's to reach in play. */
function represent(sim: Simulation): Agreement {
  const a: Agreement = { id: sim.nextId('pro'), agentId: AGENTS[0]!.id, offeredAt: sim.now - MS_DAY, standsUntil: sim.now + 13 * MS_DAY, status: 'accepted', terms: [], signedAt: sim.now, endsAt: sim.now + 365 * MS_DAY };
  sim.player.pro!.agreements.push(a);
  return a;
}

/** Headshots and a résumé, made through their own commands on the next weekday morning at ten. */
function portfolio(sim: Simulation): void {
  let ten = at(zonedParts(sim.now, zone).year, zonedParts(sim.now, zone).month, zonedParts(sim.now, zone).day, 10);
  if (ten <= sim.now) ten += MS_DAY;
  played(sim, ten);
  expect(sim.execute({ kind: 'pro.headshots', payload: {} }).error).toBeUndefined();
  played(sim, sim.now + 15 * 60_000);
  expect(sim.execute({ kind: 'pro.update_resume', payload: {} }).error).toBeUndefined();
}

/** The clock moved a week at a time until an open role posted to the actor matches. */
function waitFor(sim: Simulation, match: (o: Opportunity) => boolean, weeks = 30): Opportunity | undefined {
  for (let k = 0; k < weeks; k += 1) {
    const o = sim.player.pro!.opportunities.find((x) => x.status === 'open' && sim.now < x.submitBy && match(x));
    if (o) return o;
    played(sim, sim.now + 7 * MS_DAY);
  }
  return undefined;
}

/** The sides or the part prepared, each step pressed until it can do no more, the time between tended. */
function prepareAll(sim: Simulation, target: { opportunityId: string } | { engagementId: string }): void {
  for (let n = 0; n < 24; n += 1) {
    let any = false;
    for (const step of ['read', 'lines', 'rehearse']) {
      const r = sim.execute({ kind: 'pro.prepare', payload: { ...target, step } });
      if (r.ok) any = true;
      played(sim, sim.now + 30 * 60_000);
    }
    if (!any) break;
  }
}

/** A round played: the sides prepared, the tape taped or the audition attended, and the clock on to casting's word. */
function playRound(sim: Simulation, o: Opportunity): void {
  prepareAll(sim, { opportunityId: o.id });
  const r = roundToCome(o)!;
  // Taped at the first free hour before it's due, as a player picks one.
  if (r.form === 'self-tape') {
    for (let n = 0; n < 48 && tapeRefusal(sim, sim.player, o) && sim.now < r.at - 2 * MS_HOUR; n += 1) played(sim, sim.now + MS_HOUR);
    expect(sim.execute({ kind: 'pro.tape_audition', payload: { opportunityId: o.id } }).error).toBeUndefined();
  }
  const rounds = o.rounds!.length;
  for (let k = 0; k < 20 && (o.status === 'audition' || o.status === 'callback') && o.rounds!.length === rounds; k += 1) played(sim, sim.now + MS_DAY);
}

/** From a submission to casting's last word: each round played, until an offer, a pass or a lapse. */
function playToOffer(sim: Simulation, o: Opportunity): void {
  expect(sim.execute({ kind: 'pro.submit', payload: { opportunityId: o.id } }).error).toBeUndefined();
  played(sim, sim.now + 3 * MS_DAY);
  while (o.status === 'audition' || o.status === 'callback') playRound(sim, o);
}

/** The first of a list of seeds whose life reaches an offer for a role that matches (the draw's spread is J5's test). */
function offerIn(seeds: readonly string[], make: (seed: string) => Simulation, match: (o: Opportunity) => boolean): { sim: Simulation; o: Opportunity } {
  for (const seed of seeds) {
    const sim = make(seed);
    const o = waitFor(sim, match);
    if (!o) continue;
    playToOffer(sim, o);
    if (o.status === 'offered') return { sim, o };
  }
  throw new Error('No seed in the list reached an offer.');
}

describe('J1: fictional roles, posted on a schedule', () => {
  it('PLAYER JOURNEY: posts open roles each Monday at nine for a week, each with its project, role, dates, place and pay, and never an agent-only role to an actor nobody represents', () => {
    const sim = student('work-posting');
    tended(sim, at(2026, 11, 30, 12));
    const opps = sim.player.pro!.opportunities;
    expect(opps.length).toBeGreaterThan(3);
    for (const o of opps) {
      const t = projectOf(o);
      expect(t.fictional).toBe(true);
      expect(t.access.open).not.toBe(false);
      expect(o.via).toBe('open');
      const p = zonedParts(o.postedAt, zone);
      expect([p.weekday, p.hour, p.minute]).toEqual([1, 9, 0]);
      expect(o.submitBy - o.postedAt).toBe(7 * MS_DAY);
      const days = datesOf(o);
      expect(days.length).toBe(t.schedule.kind === 'shoot' ? t.schedule.days : (t.schedule.rehearsalWeeks * 5 + t.schedule.performanceWeeks * 6));
      expect(Math.round((startOfDay(days[0]!.from, zone) - startOfDay(o.postedAt, zone)) / MS_DAY)).toBeGreaterThanOrEqual(WORK.leadDays);
      expect(o.history[0]!.words).toBe(`${t.casting.charAt(0).toUpperCase()}${t.casting.slice(1)} posted ${t.role.part} in ${t.project}.`);
      // A project casts once a cycle: no second posting of it within ten weeks.
      expect(opps.filter((x) => x.projectId === o.projectId && Math.abs(x.postedAt - o.postedAt) < POSTING.againDays * MS_DAY)).toHaveLength(1);
    }
    // A window passed closes: lapsed, said in the record.
    const old = opps.find((o) => o.submitBy <= sim.now)!;
    expect(old.status).toBe('lapsed');
    expect(old.outcome).toMatch(/^Submissions for .+ closed on /);
    // The pay is the rate's: deferred for the student film, the union minimum or the estimate otherwise.
    for (const t of PROJECTS.filter((x) => x.access.open)) {
      const terms = payTermsOf(sim.player, { projectId: t.id, postedAt: at(2026, 9, 7) }, sim.now);
      expect(terms.deferred).toBe(t.kind === 'student-film');
      if (!terms.deferred) expect(terms.each).toBe(RATES[t.pay].amount);
    }
  });

  it('brings agent-only roles only through the agent while an agreement is in force, with his id and the agreement’s on each', () => {
    const sim = graduate('work-agent-postings');
    const before = postingTimes(sim.now, sim.now + 40 * 7 * MS_DAY).flatMap((b) => postingsAt(sim, sim.player, b));
    expect(before.some((x) => !x.project.access.open)).toBe(false);
    expect(before.every((x) => x.via === 'open')).toBe(true);
    const a = represent(sim);
    tended(sim, sim.now + 16 * 7 * MS_DAY);
    const through = sim.player.pro!.opportunities.filter((o) => o.via === 'agent');
    expect(through.length).toBeGreaterThan(0);
    for (const o of through) {
      expect(o.agentId).toBe(AGENTS[0]!.id);
      expect(o.agreementId).toBe(a.id);
      expect(projectOf(o).access.agent).toBe(true);
    }
    // Represented, a role open to both comes through him; an open-only one is posted openly still.
    expect(sim.player.pro!.opportunities.filter((o) => o.postedAt > a.signedAt! && o.via === 'open').every((o) => !projectOf(o).access.agent)).toBe(true);
  });
});

describe('F4 and J4: what a submission reads, and who can submit for what', () => {
  it('PLAYER JOURNEY: refuses a submission while the headshots or the résumé are missing, said in their practical words, and takes it once they’re made', () => {
    const sim = graduate('work-materials');
    const o = waitFor(sim, (x) => projectById(x.projectId)!.access.open === 'anyone')!;
    expect(submitRefusal(sim, sim.player, o)).toBe('You have no headshots, and every submission starts with one. Press Book A Headshot Session on the Career screen’s Portfolio tab.');
    const refused = sim.execute({ kind: 'pro.submit', payload: { opportunityId: o.id } });
    expect(refused.ok).toBe(false);
    expect(o.status).toBe('open');
    tended(sim, at(zonedParts(sim.now, zone).year, zonedParts(sim.now, zone).month, zonedParts(sim.now, zone).day, 10) + (zonedParts(sim.now, zone).hour >= 10 ? MS_DAY : 0));
    sim.must({ kind: 'pro.headshots', payload: {} });
    expect(submitRefusal(sim, sim.player, o)).toBe('You have no résumé. Press Make Your Résumé on the Career screen’s Portfolio tab: it takes an hour, from your record.');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    expect(submitRefusal(sim, sim.player, o)).toBeUndefined();
    sim.must({ kind: 'pro.submit', payload: { opportunityId: o.id } });
    expect(o.status).toBe('submitted');
    // What it sent, as each stood then: the headshots and the résumé, by id and date.
    expect(o.sent!.map((m) => m.kind).sort()).toEqual(projectOf(o).medium === 'stage' ? ['headshot', 'resume'] : ['headshot', 'resume']);
    expect(o.history.at(-1)!.words).toMatch(/^You submitted yourself for .+, sending your headshots from .+ and your résumé from .+\.$/);
  });

  it('says why an agent-only role and a members’ open call can’t be submitted for, and what an open call asks of a non-member', () => {
    const sim = graduate('work-access');
    const agentOnly = PROJECTS.find((t) => !t.access.open)!;
    const o: Opportunity = { id: 'test-o', projectId: agentOnly.id, via: 'open', status: 'open', postedAt: sim.now, submitBy: sim.now + 7 * MS_DAY, history: [], counts: {} };
    expect(submitRefusal(sim, sim.player, o)).toBe(`${agentOnly.casting} takes submissions only from agents, so you can’t submit yourself.`);
    // The graduate is an Equity member by the degree: the members' call takes them. A leaver isn't.
    const call = PROJECTS.find((t) => t.access.open === 'equity-members')!;
    const eq: Opportunity = { ...o, id: 'test-eq', projectId: call.id };
    portfolio(sim);
    expect(submitRefusal(sim, sim.player, eq)).toBeUndefined();
    delete sim.player.pro!.equity;
    expect(submitRefusal(sim, sim.player, eq)).toBe('It’s an open call for Equity members, and you aren’t one yet. The degree makes you a member, and so does a contract with an Equity company.');
  });
});

describe('J5: casting decided apart from quality', () => {
  const ids = Array.from({ length: 400 }, (_, n) => `seeded-${n}`);
  it('raises the chance with the band and the fit, never to certainty, and a developing actor books a role that suits them', () => {
    const sim = student('work-casting');
    const film = PROJECTS.find((t) => t.kind === 'student-film')!;
    const network = PROJECTS.find((t) => t.kind === 'network-drama')!;
    const yes = (projectId: string, band: 'unready' | 'working' | 'strong' | 'exceptional', fit: number) => ids.filter((id) => castingDraw(sim, { id, projectId }, 'final', band, fit).yes).length;
    // Change the band, the chance moves; so does the fit, and the field.
    expect(chanceOf('working', 0.5, 'student-film', 'final')).toBeLessThan(chanceOf('strong', 0.5, 'student-film', 'final'));
    expect(chanceOf('strong', 0.2, 'student-film', 'final')).toBeLessThan(chanceOf('strong', 0.9, 'student-film', 'final'));
    expect(chanceOf('strong', 0.9, 'network-drama', 'final')).toBeLessThan(chanceOf('strong', 0.9, 'student-film', 'final'));
    expect(yes(film.id, 'unready', 0.8)).toBeLessThan(yes(film.id, 'working', 0.8));
    expect(yes(film.id, 'working', 0.8)).toBeLessThan(yes(film.id, 'exceptional', 0.8));
    // The best audition, fitting perfectly, still loses some: never certain.
    expect(chanceOf('exceptional', 1, 'student-film', 'final')).toBeLessThanOrEqual(CASTING.most);
    expect(yes(network.id, 'exceptional', 1)).toBeLessThan(ids.length);
    expect(yes(film.id, 'exceptional', 1)).toBeLessThan(ids.length);
    // A developing actor, working band, in a role that suits them, books some.
    expect(yes(film.id, 'working', 0.8)).toBeGreaterThan(0);
    // The draw is the save's and the opportunity's own: the same again, the same answer.
    expect(ids.map((id) => castingDraw(sim, { id, projectId: film.id }, 'final', 'working', 0.8).yes)).toEqual(ids.map((id) => castingDraw(sim, { id, projectId: film.id }, 'final', 'working', 0.8).yes));
  });

  it('reads the role’s fit from the record: the genre known and the role’s techniques against the actor’s', () => {
    const sim = student('work-fit');
    const t = PROJECTS.find((x) => x.kind === 'non-union-short')!;
    const before = fitOf(sim.player, t);
    genreState(sim.player, t.genres[0]!).familiarity = 90;
    const known = fitOf(sim.player, t);
    expect(known.genre).toBeGreaterThan(before.genre);
    expect(known.demands).toBe(before.demands);
    sim.player.craft!.comedy = 90;
    expect(fitOf(sim.player, t).demands).toBeGreaterThan(known.demands);
  });

  it('PLAYER JOURNEY: over seeds, a skilled actor loses a role and a developing actor books one, each through the whole loop', () => {
    const outcomes = (make: (seed: string) => Simulation, seeds: readonly string[]) => seeds.map((seed) => {
      const sim = make(seed);
      const o = waitFor(sim, (x) => projectById(x.projectId)!.access.open === 'anyone');
      if (!o) return 'none';
      playToOffer(sim, o);
      return o.status;
    });
    const seeds = Array.from({ length: 30 }, (_, n) => `work-spread-${n}`);
    const strong = outcomes((s) => { const sim = graduate(s); skilled(sim); portfolio(sim); return sim; }, seeds);
    const growing = outcomes((s) => { const sim = graduate(s); developing(sim); portfolio(sim); return sim; }, seeds);
    expect(strong).toContain('passed');
    expect(strong).toContain('offered');
    expect(growing).toContain('offered');
    expect(growing).toContain('passed');
    // Skill raises the chance: the skilled actor is offered more of the same roles.
    expect(strong.filter((x) => x === 'offered').length).toBeGreaterThan(growing.filter((x) => x === 'offered').length);
  });
});


/** The record and what's pending, as a reload must keep them: the professional record, the work and the calendar's own items. */
const kept = (sim: Simulation) => JSON.stringify({ pro: sim.player.pro, work: sim.player.work?.length, pending: sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind.startsWith('pro.')).map((i) => [i.id, i.kind, i.at]) });
/** A save and a load at a stage: the reloaded save holds the same, and the journey goes on from the reloaded one. */
function saved(sim: Simulation): Simulation {
  const again = reload(sim);
  expect(kept(again)).toBe(kept(sim));
  return again;
}

describe('the whole loop, played', () => {
  const seeds = Array.from({ length: 20 }, (_, n) => `work-loop-${n}`);

  it('PLAYER JOURNEY (V10, V15, J2, J4): an unsigned graduate, from a posted student film to a booked, worked and credited part, saved and loaded at each stage with nothing settled twice', () => {
    let { sim, o } = offerIn(seeds, (seed) => { const s = graduate(seed); skilled(s); portfolio(s); return s; }, (x) => projectById(x.projectId)!.kind === 'student-film');
    const t = projectOf(o);
    // What the player read, in order: the casting office's answer, then the offer to decide on.
    expect(notices(sim)).toEqual([expect.stringMatching(/^An Audition For Theo \| The film’s director wants to see you for Theo in Paper Moons: an apartment in Brooklyn in New York, \w+day, \w+ \d+, 2026 at 11:00 AM\. Getting there takes about two hours each way\. Prepare the sides on the Career screen’s Opportunities tab before you go\.$/)]);
    expect(o.history.map((e) => e.kind)).toEqual(['opportunity', 'submitted', 'audition', 'audition', 'offer']);
    const decision = Object.values(sim.universe.decisions).find((d) => d.refId === o.id && !d.resolvedAt)!;
    expect(decision.title).toBe('An Offer For Theo');
    expect(decision.detail).toMatch(/^The film’s director offers you Theo in Paper Moons, a fictional student film\. The pay is deferred: a student film pays its actors only if it earns money later, so nothing is paid for its three days of work\. The work is from \w+ \d+, 2026 to \w+ \d+, 2026, in New York\. The offer stands until .+ at 5:00 PM\.$/);
    expect(decision.actions.map((a) => a.label)).toEqual(['Accept The Offer', 'Decline The Offer']);
    // The audition was judged by the evaluation, kept on the work record with its band, and casting read it apart from the fit and the field.
    const round = o.rounds![0]!;
    expect(sim.player.work!.some((w) => w.what === 'Theo, Paper Moons: Audition' && w.band === round.band)).toBe(true);
    expect(round.casting).toEqual({ at: expect.any(Number), chance: chanceOf(round.band!, round.casting!.fit, 'student-film', 'final'), fit: fitOf(sim.player, t).fit, yes: true });

    sim = saved(sim); o = sim.player.pro!.opportunities.find((x) => x.id === o.id)!;
    const txns = sim.universe.transactions.length;
    const a = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    expect(o.status).toBe('booked');
    expect(Object.values(sim.universe.decisions).find((d) => d.refId === o.id)!.resolvedAt).toBe(sim.now);
    let e = sim.player.pro!.engagements.find((x) => x.id === a.engagementId)!;
    // The pay is promised, a week's entry keyed by the engagement and the week, deferred, and nothing posted.
    expect(e.pay).toEqual([{ id: expect.any(String), key: `${e.id}:0`, promised: 0, currency: 'USD', promisedAt: sim.now, due: expect.any(Number), deferred: true }]);
    expect(zonedParts(e.pay[0]!.due, zone).weekday).toBe(4);
    expect(sim.universe.transactions.length).toBe(txns);
    // Three shoot days on the calendar, each wanting the player, with the trip to New York.
    const days = sim.universe.scheduled.filter((i) => i.kind === WORK_DAY_KIND && i.refId === e.id && i.status === 'pending');
    expect(days.map((i) => [i.label, i.requiresPlayer, i.travelMinutes, i.durationMinutes])).toEqual([1, 2, 3].map((n) => [`Paper Moons: Shoot Day ${n}`, true, 120, 660]));
    // The part, prepared: the sides kept half, and the steps on the part move it on.
    const half = { ...e.prep! };
    expect(half.memorization).toBeCloseTo(o.prep!.memorization * WORK.sidesKept, 2);
    prepareAll(sim, { engagementId: e.id });
    expect(e.prep!.memorization).toBeGreaterThan(half.memorization);

    sim = saved(sim); e = sim.player.pro!.engagements.find((x) => x.id === a.engagementId)!;
    played(sim, e.days[0]!.to + 60_000);
    expect(e.log).toEqual([{ day: 0, at: e.days[0]!.from, status: 'worked', band: expect.any(String), overall: expect.any(Number) }]);
    sim = saved(sim); e = sim.player.pro!.engagements.find((x) => x.id === a.engagementId)!;
    played(sim, e.days[2]!.to + MS_DAY);
    expect(e.status).toBe('finished');
    expect(e.log!.map((l) => l.status)).toEqual(['worked', 'worked', 'worked']);
    // Each day judged by the evaluation, on the work record.
    expect(sim.player.work!.filter((w) => w.what.startsWith('Theo, Paper Moons: Shoot Day')).length).toBe(3);
    // The lasting credit: a student film, shot, the best band of its days, and the résumé behind on it.
    const credit = sim.player.pro!.credits.find((c) => c.engagementId === e.id)!;
    expect(credit).toMatchObject({ kind: 'student-film', project: 'Paper Moons', role: 'Theo', status: 'shot', medium: 'film' });
    expect(credit.band).toBe((['exceptional', 'strong', 'working', 'unready'] as const).find((b) => e.log!.some((l) => l.band === b)));
    expect(sim.player.pro!.credits.filter((c) => c.engagementId === e.id)).toHaveLength(1);
    expect(notices(sim).at(-1)).toBe('You Wrapped Paper Moons | Paper Moons wrapped, and Theo is on your professional credits, not yet released. Its footage can go on a reel once it comes out, about six months on, estimated. Update your résumé on the Portfolio tab to add it.');
    sim = saved(sim);
    played(sim, sim.now + 200 * MS_DAY);
    const released = sim.player.pro!.credits.find((c) => c.engagementId === e.id)!;
    expect(released.status).toBe('released');
    expect(notices(sim)).toContain('Paper Moons Is Released | Paper Moons is out, so Theo shows as released on your credits, and its footage can go on your reel. Cut A Reel on the Portfolio tab lists it.');
    expect(breaches(sim.universe, sim.now)).toEqual([]);
    // Settled once: one engagement, one credit, one booked event, whatever the reloads.
    expect(sim.player.pro!.engagements.filter((x) => x.opportunityId === o.id)).toHaveLength(1);
    expect(sim.player.pro!.opportunities.find((x) => x.id === o.id)!.counts.booked).toBe(1);
  });
});

describe('a callback, a run and its nights', () => {
  it('PLAYER JOURNEY (V11, V15): an Equity open call with a callback, saved and loaded at each stage, to a booked run in Providence, its rehearsals and nights judged, the credit and the promised weekly pay', () => {
    const seeds = Array.from({ length: 30 }, (_, n) => `work-run-${n}`);
    let sim: Simulation | undefined;
    let id = '';
    for (const seed of seeds) {
      let s = graduate(seed);
      skilled(s);
      portfolio(s);
      const o = waitFor(s, (x) => projectById(x.projectId)!.kind === 'lort', 40);
      if (!o) continue;
      id = o.id;
      const of = (x: Simulation) => x.player.pro!.opportunities.find((y) => y.id === id)!;
      s.must({ kind: 'pro.submit', payload: { opportunityId: id } });
      s = saved(s);
      played(s, s.now + 3 * MS_DAY);
      s = saved(s);
      while (of(s).status === 'audition' || of(s).status === 'callback') { playRound(s, of(s)); s = saved(s); }
      if (of(s).status === 'offered' && of(s).rounds!.length === 2) { sim = s; break; }
    }
    expect(sim).toBeDefined();
    const s = sim!;
    const o = s.player.pro!.opportunities.find((y) => y.id === id)!;
    const t = projectOf(o);
    expect(t.kind).toBe('lort');
    // The audition, then the callback, each said, each judged, each read by casting with the role's fit and the field.
    expect(notices(s)).toEqual([
      expect.stringMatching(/^An Audition For Tobias Marsh \| Ostrander Vale Casting wants to see you for Tobias Marsh in The Winter Ledger: the company’s main stage in Providence, \w+day, .+ at 11:00 AM\. Getting there takes about two hours each way\./),
      expect.stringMatching(/^A Callback For Tobias Marsh \| Ostrander Vale Casting wants to see you again for Tobias Marsh in The Winter Ledger: the company’s main stage in Providence, \w+day, .+ at 2:00 PM\./),
    ]);
    expect(o.rounds!.map((r) => [r.round, r.form, r.status, r.casting?.yes])).toEqual([['audition', 'in-person', 'done', true], ['callback', 'in-person', 'done', true]]);
    expect(o.rounds![0]!.casting!.chance).toBe(chanceOf(o.rounds![0]!.band!, o.rounds![0]!.casting!.fit, 'lort', 'callback'));
    expect(o.rounds![1]!.casting!.chance).toBe(chanceOf(o.rounds![1]!.band!, o.rounds![1]!.casting!.fit, 'lort', 'final'));
    expect(o.offer).toMatchObject({ rate: 'lort-c', amount: RATES['lort-c'].amount, per: 'week', units: 9 });
    const a = s.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: id } });
    const e = s.player.pro!.engagements.find((x) => x.id === a.engagementId)!;
    // Nine weeks promised at the LORT C minimum, each due the Thursday after its week, none received.
    expect(e.pay.map((p) => [p.key, p.promised, p.currency, zonedParts(p.due, zone).weekday, p.received])).toEqual(Array.from({ length: 9 }, (_, w) => [`${e.id}:${w}`, RATES['lort-c'].amount, 'USD', 4, undefined]));
    expect(payGroups(e, t).map((g) => g.length)).toEqual([5, 5, 5, 5, 6, 6, 6, 6, 6]);
    for (const [w, g] of payGroups(e, t).entries()) expect(e.pay[w]!.due).toBeGreaterThan(e.days[g.at(-1)!]!.to);
    // The days in Providence, with the trip from New Haven.
    expect(s.universe.scheduled.filter((i) => i.kind === WORK_DAY_KIND && i.refId === e.id).map((i) => i.travelMinutes)).toEqual(Array(50).fill(120));
    const before = { ...e.prep! };
    played(s, e.days[19]!.to + 60_000);
    // Four weeks of rehearsal days attended move the part on, as a School production's calls do.
    expect(e.prep!.memorization).toBeGreaterThan(before.memorization);
    expect(e.prep!.rehearsal).toBeGreaterThan(before.rehearsal);
    expect(s.player.pro!.credits.some((c) => c.engagementId === e.id)).toBe(false);
    played(s, e.days[20]!.to + 60_000);
    // The first night: judged as a night on stage, and the credit is the part performed.
    const night = s.player.work!.find((w) => w.what === 'Tobias Marsh, The Winter Ledger: Performance')!;
    expect(night.task).toBe('performance');
    expect(s.player.pro!.credits.find((c) => c.engagementId === e.id)).toMatchObject({ kind: 'stage', status: 'performed', union: 'equity', company: 'Harrow Point Repertory Theater' });
    played(s, e.days.at(-1)!.to + MS_DAY);
    expect(e.status).toBe('finished');
    expect(e.log!.filter((l) => l.status === 'worked')).toHaveLength(50);
    expect(e.log!.filter((l) => l.band).length).toBe(30);
    expect(notices(s).at(-1)).toBe('The Winter Ledger Closed | The run of The Winter Ledger is over, and Tobias Marsh is on your professional credits. Update your résumé on the Portfolio tab to add it.');
    expect(breaches(s.universe, s.now)).toEqual([]);
  });
});

describe('J3: the agent’s part, while an agreement is in force', () => {
  it('PLAYER JOURNEY: his breakdown brings a role, he holds the submission while the headshots are missing and says why, submits once they’re made, passes on the answer and the offer at scale plus ten, and the booking carries his id and the agreement’s', () => {
    const agent = AGENTS[0]!;
    let found: { sim: Simulation; o: Opportunity; a: Agreement } | undefined;
    for (const seed of Array.from({ length: 30 }, (_, n) => `work-agent-${n}`)) {
      const sim = graduate(seed);
      skilled(sim);
      const a = represent(sim);
      // TEST SETUP: the relationship the agent builder keeps, at representation, so its history can be read.
      sim.player.pro!.relations[agent.id] = { agentId: agent.id, stage: 'represented', since: sim.now, stageAt: sim.now, agreementId: a.id, history: [], counts: {} };
      const o = waitFor(sim, (x) => x.via === 'agent' && x.projectId === 'route-nine', 40);
      if (!o) continue;
      // Held: no headshots, said in his procedural words, with the line that marks them invented.
      const held = notices(sim).find((n) => n.startsWith('Not Submitted For Jess'));
      expect(held).toBe(`Not Submitted For Jess | ${agent.name} didn’t submit you for Jess in Static On Route 9. You have no headshots, and every submission starts with one. Press Book A Headshot Session on the Career screen’s Portfolio tab. You have no résumé. Press Make Your Résumé on the Career screen’s Portfolio tab: it takes an hour, from your record. ${agent.name} can still submit you until ${new Intl.DateTimeFormat('en-US', { timeZone: zone, month: 'long', day: 'numeric', year: 'numeric' }).format(o.submitBy)}, once that’s put right. ${agent.fictional}`);
      // The player can't submit for him.
      expect(submitRefusal(sim, sim.player, o)).toBe(`${agent.name} submits you for this one: Brisbane Hall Casting takes submissions only from agents.`);
      portfolio(sim);
      played(sim, sim.now + 60_000);
      expect(o.status).toBe('submitted');
      // Said once: a problem put right brought no second message.
      expect(notices(sim).filter((n) => n.startsWith('Not Submitted For Jess'))).toHaveLength(1);
      expect(notices(sim).find((n) => n.startsWith('Submitted For Jess'))).toMatch(new RegExp(`^Submitted For Jess \\| ${agent.name} submitted you for Jess in Static On Route 9, sending your headshots from .+ and your résumé from .+\\. Brisbane Hall Casting answers on .+\\. ${agent.fictional}$`));
      played(sim, sim.now + 3 * MS_DAY);
      expect(notices(sim).find((n) => n.startsWith('A Self-Tape For Jess'))).toMatch(new RegExp(`^A Self-Tape For Jess \\| ${agent.name} passed this on: Brisbane Hall Casting asks for a self-tape for Jess in Static On Route 9, due .+\\. ${agent.fictional}$`));
      while (o.status === 'audition' || o.status === 'callback') playRound(sim, o);
      if (o.status === 'offered') { found = { sim, o, a }; break; }
    }
    expect(found).toBeDefined();
    const { sim, o, a } = found!;
    // He conveys the offer, at scale plus ten on SAG-AFTRA work at the minimum, the agreement's term.
    const each = Math.round(RATES['ultra-low-budget-day'].amount! * 1.1);
    expect(o.offer).toMatchObject({ amount: each, per: 'day', units: 4 });
    const d = Object.values(sim.universe.decisions).find((x) => x.refId === o.id)!;
    expect(d.detail).toContain(`${agent.name} passed on an offer. Brisbane Hall Casting offers you Jess in Static On Route 9, a fictional ultra-low-budget feature film. It pays $282.70 a day for four days, scale plus ten, as your agent asks on SAG-AFTRA work at the minimum.`);
    expect(d.detail.endsWith(agent.fictional)).toBe(true);
    const r = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = sim.player.pro!.engagements.find((x) => x.id === r.engagementId)!;
    expect([o.agentId, o.agreementId, e.agentId, e.agreementId]).toEqual([agent.id, a.id, agent.id, a.id]);
    expect(activeAgreement(sim.player, sim.now)?.id).toBe(a.id);
    // The promised pay is the offer's: four days at scale plus ten, in the weeks they fall in.
    expect(e.pay.reduce((n, p) => n + p.promised, 0)).toBe(each * 4);
    // The relationship's history holds what he handled, each once, keyed by the opportunity.
    const rel = sim.player.pro!.relations[agent.id]!;
    expect(rel.history.filter((x) => x.ref === o.id).map((x) => x.kind)).toEqual(['opportunity', 'problem', 'submitted', 'audition', 'audition', 'offer', 'booked']);
    expect(new Set(rel.history.map((x) => x.key)).size).toBe(rel.history.length);
  });
});

/** A first-year in the fall term of 2026, the clock moved on from orientation; skilled where the journey asks for an offer (TEST SETUP). */
function firstYear(seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}, skill = true): Simulation {
  const sim = student(seed, more);
  if (skill) skilled(sim);
  portfolio(sim);
  return sim;
}
/** A role whose days all fall in term for this student, of a kind. */
const inTerm = (sim: Simulation, kinds: readonly string[]) => (o: Opportunity) => kinds.includes(projectOf(o).kind) && datesOf(o).every((d) => inSessionAt(sim.player, d.from));

describe('A3: work while enrolled, by the Bulletin', () => {
  it('PLAYER JOURNEY (V2): a permitted request, approved by the dean and worked, its class days excused and the standing kept', () => {
    let found: { sim: Simulation; o: Opportunity } | undefined;
    for (const seed of Array.from({ length: 30 }, (_, n) => `work-approved-${n}`)) {
      const sim = firstYear(seed);
      const o = waitFor(sim, inTerm(sim, ['non-union-short']), 10);
      if (!o) continue;
      // The conditions, said before asking: each holds for two paid shoot days asked five weeks ahead.
      expect(conditionsFor(sim, sim.player, o, sim.now).map((c) => [c.id, c.holds])).toEqual([['standing', true], ['timely', true], ['short', true], ['meaningful', true], ['calls', true], ['classes', true]]);
      expect(requestRefusal(sim, sim.player, o)).toBeUndefined();
      const decides = sim.must<{ decides: number }>({ kind: 'pro.request_outside_work', payload: { opportunityId: o.id } }).decides;
      expect(sim.player.pro!.outsideWork).toEqual([expect.objectContaining({ opportunityId: o.id, workingDays: 2, classDays: classDaysIn(sim.player, datesOf(o), 'us-ny-newyork'), status: 'pending' })]);
      playToOffer(sim, o);
      if (o.status !== 'offered') continue;
      played(sim, Math.max(sim.now, decides + 60_000));
      found = { sim, o };
      break;
    }
    expect(found).toBeDefined();
    const { sim, o } = found!;
    expect(sim.player.pro!.outsideWork![0]!.status).toBe('approved');
    expect(notices(sim).find((n) => n.startsWith('The Dean Approves Your Outside Work'))).toMatch(/^The Dean Approves Your Outside Work \| The chair of Acting recommended your request, and the dean approved it in writing: Sam in Last Bus To Eastview, two working days\. You’re in good standing, as a request needs\. .+ It takes (one class day|two class days), within the two the game allows\. The class days it takes are excused\.$/);
    expect(acceptWarning(sim, sim.player, o)).toBe('The dean approved this work in term, so its class days are excused.');
    const r = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = sim.player.pro!.engagements.find((x) => x.id === r.engagementId)!;
    expect(e.school).toBe('approved');
    const tally = sim.player.school!.tally;
    const excused = tally.excused;
    const missedBefore = notices(sim).length;
    played(sim, e.days.at(-1)!.to + MS_DAY);
    expect(e.status).toBe('finished');
    // Away in New York for both days: the classes those days excused, as the approval arranged, and nothing unexcused said.
    expect(awayAt(sim.player, e.days[0]!.from + 2 * MS_HOUR)).toEqual({ label: e.days[0]!.label, approved: true });
    expect(sim.player.school!.tally.excused).toBe(excused + sim.player.pro!.outsideWork![0]!.classDays);
    expect(sim.universe.notifications.slice(missedBefore).filter((n) => n.title === 'You Missed Classes')).toEqual([]);
    expect(sim.player.school!.standing).toBe('good');
    expect(sim.player.pro!.unapproved).toBeUndefined();
    expect(sim.player.pro!.credits.find((c) => c.engagementId === e.id)).toMatchObject({ project: 'Last Bus To Eastview', status: 'shot' });
  });

  it('PLAYER JOURNEY: a request the dean refuses, said with the condition that failed: a student film isn’t professional work, and four class days are more than two', () => {
    const sim = firstYear('work-refused', {}, false);
    const film = waitFor(sim, inTerm(sim, ['student-film', 'ultra-low-budget']), 20)!;
    const t = projectOf(film);
    sim.must({ kind: 'pro.request_outside_work', payload: { opportunityId: film.id } });
    expect(requestRefusal(sim, sim.player, film)).toMatch(/^You’ve asked already\. The dean decides on /);
    played(sim, sim.now + 8 * MS_DAY);
    const req = sim.player.pro!.outsideWork![0]!;
    expect(req.status).toBe('refused');
    const why = t.kind === 'student-film' ? 'In the game’s reading of the rule, a student film isn’t the professional work it makes room for.' : 'It takes four class days, more than the two the game allows.';
    expect(req.why).toContain(why);
    expect(notices(sim).find((n) => n.startsWith('The Dean Doesn’t Approve Your Outside Work'))).toContain(`the dean didn’t approve it: ${t.role.part} in ${t.project}. ${why}`);
  });

  it('PLAYER JOURNEY: work taken in term without approval brings the academic warning at its first day, its classes missed unexcused; and a second time, dismissal', () => {
    let found: { sim: Simulation; o: Opportunity } | undefined;
    for (const seed of Array.from({ length: 30 }, (_, n) => `work-unapproved-${n}`)) {
      const sim = firstYear(seed);
      const o = waitFor(sim, inTerm(sim, ['non-union-short', 'ultra-low-budget', 'student-film']), 10);
      if (!o) continue;
      playToOffer(sim, o);
      if (o.status === 'offered') { found = { sim, o }; break; }
    }
    const { sim, o } = found!;
    expect(acceptWarning(sim, sim.player, o)).toMatch(/^This work falls in term, and the School hasn’t approved it\. You’d miss (two|three|four) class days\. Working in term without approval brings an academic warning the first time and dismissal the second, as the game reads the Bulletin’s “may lead to academic warning or dismissal”\.$/);
    const twin = reload(sim);
    const r = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = sim.player.pro!.engagements.find((x) => x.id === r.engagementId)!;
    expect(e.school).toBe('unapproved');
    expect(sim.player.school!.standing).toBe('good');
    played(sim, e.days[0]!.to + MS_HOUR);
    expect(e.school).toBe('reported');
    expect(sim.player.pro!.unapproved).toBe(1);
    expect(sim.player.school!.standing).toBe('warning');
    const t = projectOf(o);
    expect(sim.universe.notifications.find((n) => n.title === 'Academic Warning')!.body).toContain(`You took outside work in term without the School’s approval: ${t.role.part} in ${t.project}. The Bulletin treats it as a conflict of interest, which may lead to academic warning or dismissal.`);
    expect(sim.universe.notifications.some((n) => n.title === 'You Missed Classes' && n.at >= e.days[0]!.from - 3 * MS_HOUR)).toBe(true);
    // A second time: TEST SETUP, a first unapproved booking already on the record and a term review since back in good standing.
    twin.player.pro!.unapproved = 1;
    const o2 = twin.player.pro!.opportunities.find((x) => x.id === o.id)!;
    const r2 = twin.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o2.id } });
    const e2 = twin.player.pro!.engagements.find((x) => x.id === r2.engagementId)!;
    played(twin, e2.days[0]!.to + MS_HOUR);
    expect(twin.player.pro!.unapproved).toBe(2);
    expect(twin.player.school!.standing).toBe('dismissed');
    expect(twin.universe.notifications.find((n) => n.title === 'Dismissed From The School')!.body).toContain('You took outside work in term without the School’s approval');
  });

  it('keeps summer and the winter break the student’s own, and a graduate’s and a leaver’s days are never in term', () => {
    const sim = student('work-session');
    expect(inSessionAt(sim.player, at(2026, 10, 7, 12))).toBe(true);
    expect(inSessionAt(sim.player, at(2026, 12, 20, 12))).toBe(false);
    expect(inSessionAt(sim.player, at(2027, 2, 10, 12))).toBe(true);
    expect(inSessionAt(sim.player, at(2027, 5, 10, 12))).toBe(true);
    expect(inSessionAt(sim.player, at(2027, 7, 1, 12))).toBe(false);
    const g = graduate('work-session-grad');
    expect(inSessionAt(g.player, at(2026, 10, 7, 12))).toBe(false);
  });
});

describe('V13 (the loop’s half): permission to work, read at acceptance', () => {
  it('PLAYER JOURNEY: an F-1 student in term is refused at acceptance in words, and can’t ask the School either; nothing changes', () => {
    let found: { sim: Simulation; o: Opportunity } | undefined;
    for (const seed of Array.from({ length: 30 }, (_, n) => `work-f1-${n}`)) {
      const sim = firstYear(seed, { homeRegionId: 'uk-eng-london' });
      const o = waitFor(sim, inTerm(sim, ['non-union-short', 'ultra-low-budget', 'student-film']), 10);
      if (!o) continue;
      expect(requestRefusal(sim, sim.player, o)).toBe('Your F-1 doesn’t let you work for an employer outside the School while you’re a student, and the School can’t authorize it: Yale’s office for international students arranges training off campus only where every student in the program must do it, and Acting has no such training.');
      playToOffer(sim, o);
      if (o.status === 'offered') { found = { sim, o }; break; }
    }
    const { sim, o } = found!;
    const no = acceptRefusal(sim, sim.player, o)!;
    expect(no).toMatch(/^Your F-1 .+\. That rules out work on \w+ \d+, 2026\.$/);
    const before = serialise(sim.universe);
    const r = sim.execute({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(no);
    expect(serialise(sim.universe)).toBe(before);
    expect(o.status).toBe('offered');
  });

  it('PLAYER JOURNEY: a US citizen in the same term isn’t refused for permission, only told what the School’s rule brings', () => {
    const { sim, o } = offerIn(Array.from({ length: 30 }, (_, n) => `work-citizen-${n}`), (seed) => firstYear(seed), (x) => ['non-union-short', 'ultra-low-budget', 'student-film'].includes(projectOf(x).kind));
    expect(acceptRefusal(sim, sim.player, o)).toBeUndefined();
    expect(acceptWarning(sim, sim.player, o)).toMatch(/^This work falls in term, and the School hasn’t approved it\./);
  });
});

describe('V12: a scheduling conflict, said and handled', () => {
  it('PLAYER JOURNEY: an audition in person against a plan of your own is said to clash, and Ask For Another Time moves it once to a time clear of it, the plan kept', () => {
    let found: { sim: Simulation; o: Opportunity } | undefined;
    for (const seed of Array.from({ length: 20 }, (_, n) => `work-clash-${n}`)) {
      const sim = graduate(seed);
      portfolio(sim);
      const o = waitFor(sim, (x) => projectOf(x).stages.audition === 'in-person' && projectOf(x).access.open === 'anyone', 20);
      if (!o) continue;
      // A plan of your own every weekday morning for three weeks, made on the calendar before the answer comes.
      for (let d = 1; d <= 21; d += 1) {
        const day = sim.now + d * MS_DAY;
        const p = zonedParts(day, zone);
        if (p.weekday === 0 || p.weekday === 6) continue;
        expect(sim.execute({ kind: 'calendar.schedule', payload: { title: 'Tutoring At The Library', at: at(p.year, p.month, p.day, 10), durationMinutes: 180 } }).ok).toBe(true);
      }
      sim.must({ kind: 'pro.submit', payload: { opportunityId: o.id } });
      played(sim, sim.now + 3 * MS_DAY);
      if (o.status === 'audition') { found = { sim, o }; break; }
    }
    const { sim, o } = found!;
    const t = projectOf(o);
    const said = notices(sim).find((n) => n.startsWith(`An Audition For ${t.role.part}`))!;
    expect(said).toContain('It clashes with Tutoring At The Library at 10:00 AM. To ask for another time, press Ask For Another Time on the Opportunities tab, at least a day ahead. Casting moves it once.');
    const first = roundToCome(o)!.at;
    expect(moveRefusal(sim, sim.player, o)).toBeUndefined();
    const moved = sim.must<{ at: number }>({ kind: 'pro.move_audition', payload: { opportunityId: o.id } }).at;
    expect(moved).toBeGreaterThan(first);
    expect(zonedParts(moved, zone).hour).toBeGreaterThanOrEqual(14);
    expect(clashesAt(sim, sim.player, moved - 120 * 60_000, WORK.auditionMinutes + 240, sim.universe.scheduled.find((i) => i.kind === AUDITION_KIND && i.refId === o.id && i.status === 'pending')!.id)).toEqual([]);
    expect(moveRefusal(sim, sim.player, o)).toBe('You’ve already asked once, and casting is keeping the time it gave.');
    expect(o.history.at(-1)!.words).toMatch(new RegExp(`^At your asking, ${t.casting} moved your audition for ${t.role.part} from .+ at 11:00 AM to \\w+day, .+ at \\d:00 PM\\.$`, 'i'));
    played(sim, moved + MS_HOUR);
    expect(o.rounds![0]!.status).toBe('done');
    // The plan that morning was kept, not missed.
    expect(sim.universe.notifications.filter((n) => n.title === 'You Missed Tutoring At The Library')).toEqual([]);
  });

  it('PLAYER JOURNEY: a student’s audition in person in term clashes with classes, said; Ask For Another Time finds a time clear of them or says casting has none, and going at the first time counts the day’s classes missed', () => {
    let found: { sim: Simulation; o: Opportunity } | undefined;
    for (const seed of Array.from({ length: 20 }, (_, n) => `work-class-clash-${n}`)) {
      const sim = firstYear(seed, {}, false);
      const o = waitFor(sim, inTerm(sim, ['student-film']), 12);
      if (!o) continue;
      sim.must({ kind: 'pro.submit', payload: { opportunityId: o.id } });
      played(sim, sim.now + 3 * MS_DAY);
      if (o.status === 'audition' && notices(sim).some((n) => n.startsWith('An Audition For Theo') && n.includes('It clashes with'))) { found = { sim, o }; break; }
    }
    const { sim, o } = found!;
    expect(notices(sim).find((n) => n.startsWith('An Audition For Theo'))).toMatch(/It clashes with (Classes at 9:00 AM|your classes, from 9:00 AM)/);
    const first = roundToCome(o)!.at;
    const twin = reload(sim);
    // A first-year's weekdays run from nine to the afternoon's lab: casting has a time clear of them, or says it has none.
    const no = moveRefusal(sim, sim.player, o);
    if (no) expect(no).toBe('Casting has no other time clear of your calendar in the days it’s seeing actors.');
    else {
      const moved = sim.must<{ at: number }>({ kind: 'pro.move_audition', payload: { opportunityId: o.id } }).at;
      expect(clashesAt(sim, sim.player, moved - 120 * 60_000, WORK.auditionMinutes + 240, sim.universe.scheduled.find((i) => i.kind === AUDITION_KIND && i.refId === o.id && i.status === 'pending')!.id)).toEqual([]);
      played(sim, moved + MS_HOUR);
      expect(sim.universe.notifications.filter((n) => n.title === 'You Missed Classes' && Math.abs(n.at - moved) < 12 * MS_HOUR)).toEqual([]);
    }
    // Going at the first time: away from nine with the trip, so the School counts that day's classes missed, unexcused.
    const p = zonedParts(first, zone);
    expect(awayAt(twin.player, at(p.year, p.month, p.day, 9))).toEqual({ label: 'Audition: Theo', approved: false });
    played(twin, first + MS_HOUR);
    expect(twin.player.pro!.opportunities.find((x) => x.id === o.id)!.rounds![0]!.status).toBe('done');
    expect(twin.universe.notifications.filter((n) => n.title === 'You Missed Classes' && Math.abs(n.at - first) < 12 * MS_HOUR)).toHaveLength(1);
  });

  it('refuses another booking on the same days, and says the School’s calls an offer in summer would take', () => {
    const sim = graduate('work-booked');
    const t = PROJECTS.find((x) => x.kind === 'student-film')!;
    const posted = postingTimes(sim.now, sim.now + 8 * MS_DAY)[0]!;
    // TEST SETUP: two offers on the same days, as casting's draws would make them.
    const make = (id: string): Opportunity => ({ id, projectId: t.id, via: 'open', status: 'offered', postedAt: posted, submitBy: posted + 7 * MS_DAY, history: [], counts: {}, offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, per: 'day', units: 3 } });
    sim.player.pro!.opportunities.push(make('test-a'), make('test-b'));
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: 'test-a' } });
    expect(acceptRefusal(sim, sim.player, sim.player.pro!.opportunities.find((o) => o.id === 'test-b'))).toMatch(/^You’re booked for Paper Moons: Shoot Day 1 on \w+ \d+, 2026, so you can’t take this as well\.$/);
  });
});

describe('V3 and A4: a player who left before the degree', () => {
  it('PLAYER JOURNEY: withdraws through the School, keeps the record and says the training truly, and books, works and is credited for an open role, with no School rule on it', () => {
    const { sim, o } = offerIn(Array.from({ length: 30 }, (_, n) => `work-leaver-${n}`), (seed) => {
      const s = firstYear(seed);
      played(s, at(2026, 9, 9, 10));
      s.must({ kind: 'school.withdraw', payload: { confirm: true } });
      return s;
    }, (x) => projectOf(x).access.open === 'anyone');
    expect(sim.player.school!.standing).toBe('withdrawn');
    expect(acceptWarning(sim, sim.player, o)).toBeUndefined();
    expect(requestRefusal(sim, sim.player, o)).toBe('The School’s rule on outside work is for its students.');
    const r = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = sim.player.pro!.engagements.find((x) => x.id === r.engagementId)!;
    expect(e.school).toBeUndefined();
    played(sim, e.days.at(-1)!.to + MS_DAY);
    expect(e.status).toBe('finished');
    expect(sim.player.pro!.credits.find((c) => c.engagementId === e.id)!.status).toBe('shot');
    expect(sim.player.school!.standing).toBe('withdrawn');
    expect(breaches(sim.universe, sim.now)).toEqual([]);
  });
});

describe('what missing a step costs', () => {
  it('PLAYER JOURNEY: an audition slept through lapses the role, said; a self-tape not in by its time does too', () => {
    const sim = graduate('work-miss-audition');
    portfolio(sim);
    const o = waitFor(sim, (x) => projectOf(x).access.open === 'anyone')!;
    sim.must({ kind: 'pro.submit', payload: { opportunityId: o.id } });
    played(sim, sim.now + 3 * MS_DAY);
    const r = roundToCome(o)!;
    if (r.form === 'in-person') {
      played(sim, r.at - 4 * MS_HOUR);
      sim.must({ kind: 'life.sleep', payload: { hours: 8 } });
      expect(o.status).toBe('lapsed');
      expect(notices(sim).at(-1)).toMatch(/^You Missed The Audition For \w+ \| You missed the audition for \w+ on .+ at 11:00 AM, so .+ moved on without you\.$/);
    } else {
      played(sim, r.at + MS_HOUR);
      expect(o.status).toBe('lapsed');
      expect(notices(sim).at(-1)).toMatch(/^Your Self-Tape For \w+ Wasn’t In \| Your self-tape for \w+ wasn’t in by .+ at 6:00 PM, so .+ moved on without it\.$/);
    }
    expect(o.rounds![0]!.status).toBe('missed');
    expect(o.counts.problem).toBe(1);
  });

  it('PLAYER JOURNEY: a shoot day slept through replaces the actor, the days never worked come off the promised pay, and there’s no credit', () => {
    const { sim, o } = offerIn(Array.from({ length: 30 }, (_, n) => `work-miss-shoot-${n}`), (seed) => { const s = graduate(seed); skilled(s); portfolio(s); return s; }, (x) => projectOf(x).kind === 'ultra-low-budget' || projectOf(x).kind === 'non-union-short');
    const r = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = sim.player.pro!.engagements.find((x) => x.id === r.engagementId)!;
    const t = projectOf(o);
    played(sim, e.days[0]!.to + MS_HOUR);
    expect(e.log!.map((l) => l.status)).toEqual(['worked']);
    played(sim, e.days[1]!.from - 10 * MS_HOUR);
    sim.must({ kind: 'life.sleep', payload: { hours: 14 } });
    expect(e.status).toBe('canceled');
    expect(e.log!.map((l) => l.status)).toEqual(['worked', 'missed']);
    expect(sim.universe.scheduled.filter((i) => i.kind === WORK_DAY_KIND && i.refId === e.id && i.status === 'pending')).toEqual([]);
    // Promised only for the day worked.
    expect(e.pay.reduce((n, p) => n + p.promised, 0)).toBe(o.offer!.amount!);
    expect(sim.player.pro!.credits.some((c) => c.engagementId === e.id)).toBe(false);
    expect(notices(sim).at(-1)).toBe(`Replaced As ${t.role.part} | You missed a shoot day of ${t.project}, and ${t.company} replaced you as ${t.role.part}. The one day you worked is still paid, and the rest are called off. There’s no credit for it.`);
  });

  it('PLAYER JOURNEY: a performance missed brings the company manager’s written warning and the understudy on; a second and the company replaces the actor, who keeps the credit for the nights played', () => {
    const { sim, o } = offerIn(Array.from({ length: 30 }, (_, n) => `work-run-${n}`), (seed) => { const s = graduate(seed); skilled(s); portfolio(s); return s; }, (x) => projectOf(x).kind === 'lort');
    const r = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = sim.player.pro!.engagements.find((x) => x.id === r.engagementId)!;
    played(sim, e.days[20]!.to + MS_HOUR);
    played(sim, e.days[21]!.from - 2 * MS_HOUR);
    sim.must({ kind: 'life.sleep', payload: { hours: 4 } });
    expect(notices(sim).at(-1)).toBe('You Missed A Performance Of The Winter Ledger | You missed a performance of The Winter Ledger on ' + new Intl.DateTimeFormat('en-US', { timeZone: zone, month: 'long', day: 'numeric', year: 'numeric' }).format(e.days[21]!.from) + '. Your understudy went on. The company manager gave you a written warning: miss another day and the company replaces you.');
    expect(e.status).toBe('working');
    played(sim, e.days[22]!.from - 2 * MS_HOUR);
    sim.must({ kind: 'life.sleep', payload: { hours: 4 } });
    expect(e.status).toBe('canceled');
    expect(sim.player.pro!.credits.find((c) => c.engagementId === e.id)!.status).toBe('performed');
    // The weekly pay: the weeks with a day worked stay promised, the rest come off.
    expect(e.pay.length).toBe(5);
  });

  it('PLAYER JOURNEY: an offer not answered lapses, said; one declined is settled, and nothing is booked', () => {
    const { sim, o } = offerIn(Array.from({ length: 30 }, (_, n) => `work-loop-${n}`), (seed) => { const s = graduate(seed); skilled(s); portfolio(s); return s; }, (x) => projectOf(x).access.open === 'anyone');
    const twin = reload(sim);
    played(sim, o.offer!.until + MS_HOUR);
    expect(o.status).toBe('lapsed');
    expect(notices(sim).at(-1)).toMatch(/^The Offer For \w+ Lapsed \| You didn’t answer the offer for \w+ by .+ at 5:00 PM, so it lapsed\.$/);
    expect(Object.values(sim.universe.decisions).find((d) => d.refId === o.id)!.resolvedAt).toBeDefined();
    const o2 = twin.player.pro!.opportunities.find((x) => x.id === o.id)!;
    twin.must({ kind: 'pro.decline_offer', payload: { opportunityId: o2.id } });
    expect(o2.status).toBe('declined');
    expect(twin.player.pro!.engagements).toEqual([]);
    expect(twin.universe.scheduled.filter((i) => i.refId === o2.id && i.status === 'pending')).toEqual([]);
    expect(twin.execute({ kind: 'pro.decline_offer', payload: { opportunityId: o2.id } }).error).toBe('There’s no offer to decline.');
  });
});
