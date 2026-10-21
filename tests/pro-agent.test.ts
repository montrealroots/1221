/**
 * The agent (brief 19, `docs/verification/career-2026-10-20/criteria.md` G1 to G8, W3, A2 and the playthroughs V5 to
 * V9 and V15): the notice where he first appears, the stages his relation holds, the routes the agency's policy allows,
 * his office's answers, the cooling-off times and something new, the history with stable keys, the factors and the
 * draw, the agreement and its ends, and the School's follow-up after the showcase.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole at Yale in New Haven, born in New York in
 * 2002, starting Monday 24 August 2026, played by the clock and the commands a player sends, the notices and the panel's
 * words read in order. TEST SETUP, said where it's done:
 * - the body kept fed, rested and awake as the clock moves (`tended`), as tests/pro-core.test.ts keeps it;
 * - a graduate made by the School's own Commencement handler brought forward, as tests/pro-core.test.ts makes one;
 * - a finished professional engagement and its credit (`finishedJob`): the work loop builds engagements, and it's
 *   built apart from this part, so the data it leaves is put in by hand, as the core's own tests do;
 * - the showcase's performances (`performed`): the showcase's system is built apart too;
 * - the life's seed, found by reading the game's own draw for an approach (`seedWhere`): every outcome is the game's,
 *   decided by its own rules on the facts; the seed only chooses which of the draw's answers a journey meets.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { rngFor } from '@/engine/core/rng';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { COMMENCEMENT_KIND, EVALUATION_KIND } from '@/engine/systems/school';
import { AGENTS } from '@/engine/content/agents';
import { projectById } from '@/engine/content/careerwork';
import type { Band } from '@/engine/systems/coursework';
import { addCredit, noteEvent, type Engagement } from '@/engine/systems/pro';
import {
  CHANCE, FOLLOW_UP_KIND, chancesFor, drawOf, interestOf, nextStep, offerOutcome, relationOf, replyOutcome, roomLevel, rosterFor,
  scheduleShowcaseFollowUp,
} from '@/engine/systems/proagent';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const AGENT = AGENTS[0]!;
const PERSON = 'person_000001';
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => sim.execute({ kind, payload });
const rel = (sim: Simulation) => relationOf(sim.player, AGENT.id)!;
/** The notices of the agent's system, oldest first: what the player reads, in order. */
const notices = (sim: Simulation) => sim.universe.notifications.filter((n) => n.refType === 'pro-agent').map((n) => `${n.title}: ${n.body}`);

/** The game's own draw for an approach's step, read for a seed as the game reads it (`drawOf`). */
const draw = (seed: string, n: number, step: 'interest' | 'offer') => rngFor(seed, 'pro.agent', PERSON, AGENT.id, `approach-${n}`, step).next();
/** TEST SETUP: a life's seed whose draws fall where the journey needs them, the first of its prefix that does. */
let seedNow = '';
function seedWhere(prefix: string, ok: (d: (n: number, step: 'interest' | 'offer') => number) => boolean): string {
  for (let i = 0; i < 20_000; i += 1) {
    const seed = `${prefix}-${i}`;
    seedNow = seed;
    if (ok((n, step) => draw(seed, n, step))) return seed;
  }
  throw new Error(`No seed for ${prefix}`);
}
// Bounds that hold whatever the room on his list (CHANCE): with Strong work the chance to go further runs 0.12 to 0.5,
// and an offer's 0.18 to 0.75. Below the least, it's yes at any room; at or above the most, no.
const SURE = { meet: 0.12, offer: 0.18 };
const passes = (u: number) => u >= 0.5 && u < 0.736;

/**
 * TEST SETUP: a graduate of the class of 2029, made by the School's own handlers: the last term's state and its
 * evaluation put on the clock, Commencement brought forward to September 3, 2026, and the clock run through it, as
 * tests/pro-core.test.ts makes one; with a School credit (Viola in Twelfth Night).
 */
function graduate(seed: string) {
  const sim = student(seed);
  tended(sim, at(2026, 9, 1, 18));
  const school = sim.player.school!;
  Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } } as never;
  school.casting = { production: 'Shakespeare Repertory Project I', play: 'Twelfth Night', by: 'William Shakespeare', role: 'Viola', kind: 'shakespeare', term: 5, performed: 4, size: 'lead' };
  sim.schedule({ at: sim.now + 60_000, kind: EVALUATION_KIND, label: 'Spring Term 2029 Evaluation', category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, term: 5 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  const booked = sim.universe.scheduled.filter((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending');
  sim.timeline.cancel(booked[0]!.id, sim.now);
  sim.schedule({ at: at(2026, 9, 3, 10), kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 32, durationMinutes: 180, payload: booked[0]!.payload });
  // The day's class ran from nine to three, so the afternoon is free from three.
  tended(sim, at(2026, 9, 3, 15));
  expect(sim.player.school!.standing).toBe('graduated');
  return sim;
}

/**
 * TEST SETUP: a professional engagement finished, with its credit, as the work loop leaves one: A House On Calder
 * Street's Nell by default, its work judged at `band`.
 */
function finishedJob(sim: Simulation, band: Band | null = 'strong', projectId = 'calder-street'): Engagement {
  const t = projectById(projectId)!;
  const credit = addCredit(sim, sim.player, { kind: t.medium === 'stage' ? 'stage' : 'screen', project: t.project, role: t.role.part, company: t.company, year: 2026, medium: t.medium, status: t.medium === 'stage' ? 'performed' : 'shot', at: sim.now - MS_DAY, ...(band ? { band } : {}) });
  const e: Engagement = { id: sim.nextId('pro'), opportunityId: sim.nextId('pro'), projectId, role: t.role.part, status: 'finished', days: [{ from: sim.now - 10 * MS_DAY, to: sim.now - MS_DAY, label: t.project }], pay: [], history: [], counts: {}, creditId: credit.id, finishedAt: sim.now - MS_DAY };
  credit.engagementId = e.id;
  sim.player.pro!.engagements.push(e);
  return e;
}

/** The player's portfolio, made on a free afternoon by the Portfolio tab's commands: headshots, then a résumé. */
function portfolio(sim: Simulation) {
  sim.must({ kind: 'pro.headshots', payload: {} });
  sim.must({ kind: 'pro.update_resume', payload: {} });
}

/** A graduate with headshots, a résumé, a finished job judged at `band`, the notice read, the check made and the job's referral: ready to send. */
function referredGraduate(seed: string, band: Band = 'strong') {
  const sim = graduate(seed);
  run(sim, 'pro.agent_notice');
  portfolio(sim);
  const job = finishedJob(sim, band);
  sim.must({ kind: 'pro.update_resume', payload: {} });
  sim.must({ kind: 'pro.agent_check', payload: {} });
  sim.must({ kind: 'pro.ask_referral', payload: { engagementId: job.id } });
  return { sim, job };
}

describe('G1: the notice where he first appears', () => {
  it('PLAYER JOURNEY: his panel holds the notice until it’s read, notes it once, and keeps it to read again', () => {
    const sim = student('agent-notice');
    expect(relationOf(sim.player, AGENT.id)).toBeUndefined();
    expect(nextStep(sim, sim.player, AGENT)).toBe('Read the notice at the top of his panel, then press I’ve Read This.');
    // Every other step waits for it, said in words.
    expect(run(sim, 'pro.agent_check').error).toBe('Read the notice about Thomas Ashgrove first: it’s at the top of his panel.');
    expect(run(sim, 'pro.send_materials').error).toBe('Read the notice about Thomas Ashgrove first: it’s at the top of his panel.');
    expect(AGENT.notice).toBe('Thomas Ashgrove and Halberd Talent are invented for the game, as every agency, project and casting office in it is. His office takes no submissions it hasn’t asked for: it sees your materials through the School’s follow-up after the showcase, or a referral from someone you’ve worked with. He never gets in touch first.');
    sim.must({ kind: 'pro.agent_notice', payload: {} });
    const r = rel(sim);
    expect(r.stage).toBe('discovered');
    expect(r.noticeShownAt).toBe(sim.now);
    expect(r.history.map((e) => [e.kind, e.key, e.words])).toEqual([['discovered', 'discovered', 'You read the notice about him and Halberd Talent.']]);
    // Read once: a second press is refused, and says where to read it again.
    expect(run(sim, 'pro.agent_notice').error).toBe('You read it on August 24, 2026. Read The Notice Again shows it whenever you want it.');
    expect(reload(sim).player.pro!.relations[AGENT.id]!.history).toEqual(r.history);
  });
});

describe('G2: a referral’s rules', () => {
  it('offers a referral only from a finished job judged well enough, saying why for each one it can’t', () => {
    const sim = graduate('agent-referrers');
    sim.must({ kind: 'pro.agent_notice', payload: {} });
    portfolio(sim);
    const working = finishedJob(sim, 'working');
    const unjudged = finishedJob(sim, null, 'eastview');
    const live = finishedJob(sim, 'exceptional', 'winter-ledger');
    live.status = 'working';
    expect(run(sim, 'pro.ask_referral', { engagementId: working.id }).error).toBe('Check your materials first. A referral passes them on.');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    sim.must({ kind: 'pro.agent_check', payload: {} });
    expect(run(sim, 'pro.ask_referral', { engagementId: working.id }).error).toBe('A referral needs work judged Strong or better in the game, and your work as Nell was Working.');
    expect(run(sim, 'pro.ask_referral', { engagementId: unjudged.id }).error).toBe('The work on that job wasn’t judged, so a referral has nothing to go on.');
    expect(run(sim, 'pro.ask_referral', { engagementId: live.id }).error).toBe('A referral comes from a job you’ve finished, and that isn’t one.');
    expect(rel(sim).referrals).toBeUndefined();
  });
});

describe('G4 and G6: the factors, the draw, and a reload that can’t redraw', () => {
  it('works out each factor apart, with its level and its words, and keeps the last decision’s reasons for the drill-down', () => {
    const seed = seedWhere('agent-factors', (d) => passes(d(1, 'interest')));
    const { sim } = referredGraduate(seed);
    const i = interestOf(sim, sim.player, AGENT, sim.now);
    expect(i.factors.map((f) => f.id)).toEqual(['work', 'relevance', 'training', 'fit', 'availability', 'roster', 'reliability']);
    const f = Object.fromEntries(i.factors.map((x) => [x.id, x]));
    expect(f.work).toMatchObject({ level: 'at', words: 'His office has your work as Nell in A House On Calder Street, which Pennick Casting referred you from, at best Strong.' });
    expect(f.relevance).toMatchObject({ level: 'near', words: 'Your record shows stage work so far. Recorded screen work on a reel would show the other side of his department.' });
    expect(f.training).toMatchObject({ level: 'beyond', words: 'You completed the MFA in Acting at the David Geffen School of Drama at Yale University in 2026. You have one professional credit.' });
    expect(f.fit).toMatchObject({ level: 'beyond', words: 'You have professional work in his department’s fields (Television, Film, Broadway, Off-Broadway, National Tours and Regional Theater).' });
    expect(f.availability).toMatchObject({ level: 'beyond', words: 'Free for work, with nothing booked. You’re a US citizen, so you can work for any employer in the US. You’re based in New Haven, within reach of his office in New York.' });
    expect(f.reliability).toMatchObject({ level: 'at', words: 'You haven’t had a meeting or a request from his office yet, and your record has no problems on a job.' });
    expect(f.roster!.words).toMatch(/^Assumed for 2026: room for .+\. Your record shows you as a lead, aged 24, so .+\. How many new actors his list takes on in a year, and of which types, is assumed in the game\.$/);
    expect(i.gate).toBe(true);
    // A first-year with nothing his office could go on is short of the gate: four needed, fewer at the bar.
    const first = student('agent-first-year');
    const raw = interestOf(first, first.player, AGENT, first.now);
    expect(raw.factors.find((x) => x.id === 'work')).toMatchObject({ level: 'short' });
    expect(raw.atOrBeyond).toBeLessThan(4);
    expect(raw.gate).toBe(false);
    expect(raw.chance).toBe(0);
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 9, 17, 12));
    expect(rel(sim).why).toMatchObject({ step: 'reply', outcome: 'pass', atOrBeyond: i.atOrBeyond, needed: 4 });
    expect(rel(sim).why!.factors.map((x) => x.level)).toEqual(i.factors.map((x) => x.level));
  });

  it('GUARD: a missed work day under him counts once against reliability, as a problem on a job, and material his office didn’t get counts as that (found by brief 19’s playthroughs, 2026-10-21)', () => {
    const { sim, job } = referredGraduate(seedWhere('agent-reliable', (d) => passes(d(1, 'interest'))));
    const reliability = () => interestOf(sim, sim.player, AGENT, sim.now).factors.find((f) => f.id === 'reliability')!;
    // TEST SETUP: what the work loop writes for one missed work day on a job through him (`missDay`, systems/projobs.ts):
    // the job's problem, and the same day copied into the relationship.
    noteEvent(sim, job, { kind: 'problem', key: 'missed:0', words: 'You missed a shoot day.' });
    noteEvent(sim, rel(sim), { kind: 'problem', key: `eng:${job.id}:missed:0`, words: 'You missed a shoot day.', ref: job.id });
    expect(reliability()).toMatchObject({ level: 'near', words: 'You had one problem on a job.' });
    // TEST SETUP: his office's request let go by, as its due date writes it.
    noteEvent(sim, rel(sim), { kind: 'request-missed', key: 'request-missed:r0', words: 'What his office asked for didn’t come.' });
    expect(reliability()).toMatchObject({ level: 'short', words: 'You didn’t send what it asked for once and had one problem on a job.' });
    // TEST SETUP: an audition he set up and she missed, as the work loop notes a round missed on a role through him.
    const o = { id: 'o-missed', projectId: job.projectId, via: 'agent' as const, agentId: AGENT.id, status: 'passed' as const, postedAt: sim.now, submitBy: sim.now, history: [], counts: {} };
    sim.player.pro!.opportunities.push(o);
    noteEvent(sim, o, { kind: 'problem', key: 'audition:missed', words: 'You missed the audition.' });
    expect(reliability()).toMatchObject({ level: 'short', words: 'You didn’t send what it asked for once, missed one audition he set up and had one problem on a job.' });
    // The missed audition alone, in a twin: it moves the level as one problem does.
    const { sim: twin, job: twinJob } = referredGraduate(seedWhere('agent-reliable', (d) => passes(d(1, 'interest'))));
    const lone = { ...o, history: [], counts: {}, projectId: twinJob.projectId };
    twin.player.pro!.opportunities.push(lone);
    noteEvent(twin, lone, { kind: 'problem', key: 'audition:missed', words: 'You missed the audition.' });
    expect(interestOf(twin, twin.player, AGENT, twin.now).factors.find((f) => f.id === 'reliability')).toMatchObject({ level: 'near', words: 'You missed one audition he set up.' });
  });

  it('GUARD: a reload before the answer gives the same answer, the draw keyed by the approach and its step', () => {
    const seed = seedWhere('agent-redraw', (d) => passes(d(1, 'interest')));
    const { sim } = referredGraduate(seed);
    sim.must({ kind: 'pro.send_materials', payload: {} });
    const saved = serialise(sim.universe);
    tended(sim, at(2026, 9, 17, 12));
    for (let n = 0; n < 3; n += 1) {
      const again = loadSave(deserialise(saved) as never);
      tended(again, at(2026, 9, 17, 12));
      expect(rel(again).stage).toBe(rel(sim).stage);
      expect(rel(again).why).toEqual(rel(sim).why);
    }
    expect(drawOf(sim, sim.player, AGENT, 1, 'interest')).toBe(draw(seed, 1, 'interest'));
  });

  it('high skill raises the chance and never makes it certain: over seeds at the top band both answers come; and a better band moves the chance', () => {
    const interest = (band: Band, room: 'short' | 'near' | 'at' | 'beyond') => ({ factors: [], atOrBeyond: 7, needed: 4, gate: true, band, ...chancesFor(band, room) });
    const top = interest('exceptional', 'beyond');
    expect(top.chance).toBeLessThan(1);
    expect(top.offerChance).toBe(CHANCE.most);
    const answers = new Set<string>();
    const offers = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      answers.add(replyOutcome(top, draw(`top-${i}`, 1, 'interest'), { requestable: [] }));
      offers.add(offerOutcome(top, draw(`top-${i}`, 1, 'offer')));
    }
    expect(answers.has('meeting')).toBe(true);
    expect(answers.has('pass') || answers.has('silence')).toBe(true);
    expect([...offers].sort()).toEqual(['offer', 'pass']);
    // The falsifiability test: the same draws, a better band, more meetings; with every factor short of the gate, none.
    const meetings = (band: Band) => Array.from({ length: 400 }, (_, i) => replyOutcome(interest(band, 'at'), draw(`band-${i}`, 1, 'interest'), { requestable: [] })).filter((o) => o === 'meeting').length;
    const counts = (['unready', 'working', 'strong', 'exceptional'] as const).map(meetings);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(counts[3]! - counts[0]!).toBeGreaterThan(150);
    const shut = { ...interest('exceptional', 'beyond'), atOrBeyond: 3, gate: false };
    expect(Array.from({ length: 200 }, (_, i) => replyOutcome(shut, draw(`band-${i}`, 1, 'interest'), { requestable: [] })).filter((o) => o === 'meeting')).toEqual([]);
  });

  it('draws the room on his list for each year, one to three openings among the assumed types, the same for a year however often it’s asked', () => {
    const sim = student('agent-roster');
    const years = Array.from({ length: 12 }, (_, i) => rosterFor(sim, AGENT, 2026 + i));
    for (const y of years) {
      const n = y.reduce((s, o) => s + o.count, 0);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(3);
      for (const o of y) expect(AGENT.roster.types).toContainEqual(o.type);
    }
    expect(new Set(years.map((y) => JSON.stringify(y.map((o) => [o.type, o.count])))).size).toBeGreaterThan(1);
    expect(rosterFor(reload(sim), AGENT, 2027)).toEqual(years[1]);
  });
});

describe('W3: the School’s follow-up after the showcase', () => {
  /** TEST SETUP: the showcase performed, both cities judged at `band`, as the showcase's system records it. */
  const performed = (sim: Simulation, band: Band) => {
    sim.player.pro!.showcase = { term: 5, scenes: [], performed: [{ city: 'New York', at: sim.now - 2 * MS_DAY, band }, { city: 'Los Angeles', at: sim.now - MS_DAY, band }] };
  };

  it('PLAYER JOURNEY: put on once, it comes through the School, never claims he was there, and a request it passes on leads straight to a meeting', () => {
    const seed = seedWhere('agent-w3', (d) => d(1, 'interest') < SURE.meet);
    const sim = graduate(seed);
    portfolio(sim);
    performed(sim, 'strong');
    const item = scheduleShowcaseFollowUp(sim, sim.player, sim.now)!;
    expect(item).toMatchObject({ kind: FOLLOW_UP_KIND, at: at(2026, 9, 6, 10), label: 'The School’s Showcase Follow-Up', category: 'career' });
    expect(scheduleShowcaseFollowUp(sim, sim.player, sim.now)).toBeUndefined();
    tended(sim, at(2026, 9, 6, 12));
    expect(sim.player.pro!.showcase!.followUp).toEqual({ at: at(2026, 9, 6, 10), agents: [AGENT.id] });
    expect(rel(sim)).toMatchObject({ stage: 'introduced', via: { route: 'showcase', by: 'the School' }, noticeShownAt: at(2026, 9, 6, 10) });
    const said = notices(sim);
    expect(said).toEqual([`The School’s Follow-Up After The Showcase: The School passed your showcase on to the agencies it follows up with, and Thomas Ashgrove’s office at Halberd Talent asked the School to pass on a request to meet you. Press Send Your Materials on the Career screen’s Representation tab by October 6, 2026, and his office sets a time. ${AGENT.notice} In the game agencies follow the showcase up through the School. The School publishes the showcase’s dates and places, not who comes, and the game doesn’t say he was there.`]);
    expect(said[0]).not.toMatch(/\b(attended|saw you|was at the showcase)\b/);
    // The showcase is among the work his office has to go on, by its judged band.
    expect(rel(sim).why!.factors[0]).toMatchObject({ id: 'work', level: 'at', words: 'His office has your showcase scenes, as the School recorded them, at best Strong.' });
    // Introduced, but not sent until the materials are checked.
    expect(run(sim, 'pro.send_materials').error).toBe('Check your materials first. Check Your Materials says whether an approach has what it needs.');
    sim.must({ kind: 'pro.agent_check', payload: {} });
    sim.must({ kind: 'pro.send_materials', payload: {} });
    expect(rel(sim).history.at(-1)!.words).toBe('You sent your headshots and your résumé to his office, after the School’s follow-up, answering its request to meet.');
    tended(sim, at(2026, 9, 13, 12));
    expect(rel(sim).stage).toBe('meeting');
    expect(notices(sim).at(-1)).toMatch(/^A Meeting Is Set At Halberd Talent: Thomas Ashgrove’s office at Halberd Talent has set the meeting it asked the School to pass on: /);
  });

  it('asks from the factors, the showcase’s band among them, never for certain: a weaker showcase in the same life is no request, and a performance never made is no follow-up', () => {
    // A draw under the chance Strong work has against this life's room on his list, and at or over Working work's: the
    // room read from the game's own roster for the year, as `interestOf` reads it, for a graduate of 24 billed as a lead.
    const seed = seedWhere('agent-w3-band', (d) => {
      const room = roomLevel(rosterFor({ rng: (stream: string, ...k: (string | number)[]) => rngFor(seedNow, stream, ...k) } as unknown as Simulation, AGENT, 2026), 24, 'lead');
      const u = d(1, 'interest');
      return u < chancesFor('strong', room).chance && u >= chancesFor('working', room).chance;
    });
    const strong = graduate(seed);
    performed(strong, 'strong');
    scheduleShowcaseFollowUp(strong, strong.player, strong.now);
    tended(strong, at(2026, 9, 6, 12));
    expect(strong.player.pro!.showcase!.followUp!.agents).toEqual([AGENT.id]);
    const working = graduate(seed);
    performed(working, 'working');
    scheduleShowcaseFollowUp(working, working.player, working.now);
    tended(working, at(2026, 9, 6, 12));
    expect(working.player.pro!.showcase!.followUp!.agents).toEqual([]);
    expect(notices(working)[0]).toMatch(/^The School’s Follow-Up After The Showcase: The School passed your showcase on to the agencies it follows up with\. Thomas Ashgrove’s office at Halberd Talent sent no request to meet, but the follow-up is an introduction: you can send it your materials from the Career screen’s Representation tab\./);
    expect(rel(working).stage).toBe('introduced');
    const none = graduate(seed);
    none.player.pro!.showcase = { term: 5, scenes: [], performed: [] };
    scheduleShowcaseFollowUp(none, none.player, none.now);
    tended(none, at(2026, 9, 6, 12));
    expect(relationOf(none.player, AGENT.id)).toBeUndefined();
    expect(none.player.pro!.showcase!.followUp).toBeUndefined();
  });
});
