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
import { breaches } from '@/engine/core/invariants';
import { answerStop, stopChoices } from '@/engine/world/clock';
import { usWorkAuthorized } from '@/engine/systems/permission';
import { COMMENCEMENT_KIND, EVALUATION_KIND } from '@/engine/systems/school';
import { BRIEFS } from '@/engine/content/briefs';
import { AGENTS, agencyOf } from '@/engine/content/agents';
import { AGREEMENT_TERMS, projectById } from '@/engine/content/careerwork';
import type { Band } from '@/engine/systems/coursework';
import { activeAgreement, addCredit, eligibilityOf, type Engagement, type Opportunity } from '@/engine/systems/pro';
import {
  CHANCE, FOLLOW_UP_KIND, MEETING_KIND, chancesFor, drawOf, interestOf, nextStep, offerOutcome, referrersOf, relationOf,
  replyOutcome, roomLevel, rosterFor, scheduleShowcaseFollowUp, sendRefusal, stillOwed,
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
const keys = (sim: Simulation) => rel(sim).history.map((e) => e.key);

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
const unanswered = (u: number) => u >= 0.85;

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

/** A camera brief taped cold and cut into a reel, by the Player Profile's and the Portfolio tab's commands. */
function reel(sim: Simulation) {
  const brief = BRIEFS.find((b) => b.medium === 'camera')!;
  sim.must({ kind: 'brief.choose', payload: { brief: brief.id, reading: brief.readings[0]!.id } });
  sim.must({ kind: 'practice.self_tape', payload: { genre: brief.kinds[0], brief: brief.id } });
  sim.must({ kind: 'pro.cut_reel', payload: { pieces: [sim.player.briefs![brief.id]!.takes[0] ? `tape:${brief.id}:${sim.player.briefs![brief.id]!.takes[0]!.at}` : ''] } });
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
    expect(run(sim, 'pro.agent_check').error).toBe('Read the notice about Jordan Parente first: it’s at the top of his panel.');
    expect(run(sim, 'pro.send_materials').error).toBe('Read the notice about Jordan Parente first: it’s at the top of his panel.');
    expect(AGENT.notice).toBe('Jordan Parente is a real agent at Stewart Talent in New York. Everything he says and decides in this game is invented: he hasn’t seen your work, and he isn’t involved with the game. Stewart Talent’s New York legit department doesn’t accept unsolicited submissions, so please don’t contact the agency about the game.');
    sim.must({ kind: 'pro.agent_notice', payload: {} });
    const r = rel(sim);
    expect(r.stage).toBe('discovered');
    expect(r.noticeShownAt).toBe(sim.now);
    expect(r.history.map((e) => [e.kind, e.key, e.words])).toEqual([['discovered', 'discovered', 'You read the notice about him: a real agent, whose words and decisions in the game are invented.']]);
    // Read once: a second press is refused, and says where to read it again.
    expect(run(sim, 'pro.agent_notice').error).toBe('You read it on August 24, 2026. Read The Notice Again shows it whenever you want it.');
    expect(reload(sim).player.pro!.relations[AGENT.id]!.history).toEqual(r.history);
  });
});

describe('G2 and V5: the stages and the routes, an incomplete submission and its remedy', () => {
  it('PLAYER JOURNEY: the check refuses an incomplete submission with what’s missing, the remedy is made, an unsolicited approach is refused in the agency’s own words, and a referral opens the way', () => {
    const sim = graduate(seedWhere('agent-v5', (d) => d(1, 'interest') < SURE.meet));
    sim.must({ kind: 'pro.agent_notice', payload: {} });
    // The incomplete submission: no headshots and no résumé, each in its practical words, with its next step.
    expect(run(sim, 'pro.agent_check').error).toBe('You have no headshots, and every submission starts with one. Press Book A Headshot Session on the Career screen’s Portfolio tab. You have no résumé. Press Make Your Résumé on the Career screen’s Portfolio tab: it takes an hour, from your record.');
    expect(rel(sim).stage).toBe('discovered');
    sim.must({ kind: 'pro.headshots', payload: {} });
    expect(run(sim, 'pro.agent_check').error).toBe('You have no résumé. Press Make Your Résumé on the Career screen’s Portfolio tab: it takes an hour, from your record.');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    // The remedy made, the check goes through, noted once, and the stage moves.
    expect(run(sim, 'pro.agent_check').ok).toBe(true);
    expect(rel(sim).stage).toBe('checked');
    expect(rel(sim).history.at(-1)!.words).toBe('You checked your materials for an approach: headshots and a résumé are there. You have no reel, and nothing recorded to cut one from yet. Tape a practice brief on the Player Profile first.');
    expect(run(sim, 'pro.agent_check').error).toBe('Your materials passed the check on September 3, 2026.');
    // Unsolicited: refused in the agency's own published words, quoted from its data.
    const unsolicited = run(sim, 'pro.send_materials').error!;
    expect(unsolicited).toBe(`Stewart Talent’s page for New York legit submissions says: “${agencyOf(AGENT).policy.quote}” The game keeps to it: his office takes your materials only through the School’s follow-up after the showcase, or a referral from someone you’ve worked with.`);
    expect(unsolicited).toContain('“We do not accept unsolicited submissions at this time.”');
    expect(nextStep(sim, sim.player, AGENT)).toBe('His office takes materials only through the School’s follow-up after the showcase or a referral. Under How To Reach Him, ask someone you’ve worked with for a referral.');
    // A referral: from a finished job judged well enough, once, from the person who made it.
    const job = finishedJob(sim, 'strong');
    expect(referrersOf(sim, sim.player, AGENT)).toEqual([{ engagementId: job.id, by: 'Pennick Casting', job: 'Nell in A House On Calder Street', band: 'strong' }]);
    sim.must({ kind: 'pro.ask_referral', payload: { engagementId: job.id } });
    expect(rel(sim)).toMatchObject({ stage: 'introduced', via: { route: 'referral', by: 'Pennick Casting' } });
    expect(sim.universe.notifications.at(-1)).toMatchObject({ title: 'Pennick Casting Referred You', body: 'Pennick Casting has referred you to Jordan Parente’s office at Stewart Talent, from your work as Nell in A House On Calder Street. You can send your materials now, from the Career screen’s Representation tab.' });
    expect(run(sim, 'pro.ask_referral', { engagementId: job.id }).error).toBe('Pennick Casting referred you on September 3, 2026.');
    // Sent: the materials go, the stage moves, and the answer is on the clock; no word comes from him on his own.
    sim.must({ kind: 'pro.update_resume', payload: {} });
    const sent = sim.must<{ approach: number; silenceAt: number }>({ kind: 'pro.send_materials', payload: {} });
    expect(sent.approach).toBe(1);
    expect(rel(sim).stage).toBe('sent');
    expect(rel(sim).history.at(-1)!.words).toBe('You sent your headshots and your résumé to his office, on Pennick Casting’s referral.');
    expect(nextStep(sim, sim.player, AGENT)).toBe('His office usually answers within two weeks. If there’s no answer by October 15, 2026, that’s a no. Both times are assumed in the game.');
    expect(notices(sim)).toEqual([]);
    expect(run(sim, 'pro.send_materials').error).toBe('Your materials went to his office on September 3, 2026, and its answer is still to come.');
    // Every stage moved here is a state the save holds, and each step one event, keyed.
    expect(keys(sim)).toEqual(['discovered', 'checked:0', 'referral:' + job.id, 'sent:1']);
    expect(breaches(sim.universe, sim.now)).toEqual([]);
  });

  it('offers a referral only from a finished job judged well enough, saying why for each one it can’t', () => {
    const sim = graduate('agent-referrers');
    sim.must({ kind: 'pro.agent_notice', payload: {} });
    portfolio(sim);
    const working = finishedJob(sim, 'working');
    const unjudged = finishedJob(sim, null, 'eastview');
    const live = finishedJob(sim, 'exceptional', 'winter-ledger');
    live.status = 'working';
    expect(run(sim, 'pro.ask_referral', { engagementId: working.id }).error).toBe('Check your materials first: a referral passes them on.');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    sim.must({ kind: 'pro.agent_check', payload: {} });
    expect(run(sim, 'pro.ask_referral', { engagementId: working.id }).error).toBe('A referral needs work judged Strong or better in the game, and your work as Nell was Working.');
    expect(run(sim, 'pro.ask_referral', { engagementId: unjudged.id }).error).toBe('The work on that job wasn’t judged, so a referral has nothing to go on.');
    expect(run(sim, 'pro.ask_referral', { engagementId: live.id }).error).toBe('A referral comes from a job you’ve finished, and that isn’t one.');
    expect(rel(sim).referrals).toBeUndefined();
  });
});

describe('G3: his office’s answers', () => {
  it('PLAYER JOURNEY: no answer: waiting once the usual two weeks go by, and a no once six weeks have, said then and held six months', () => {
    const { sim } = referredGraduate(seedWhere('agent-silence', (d) => unanswered(d(1, 'interest'))));
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 9, 17, 12));
    expect(rel(sim).stage).toBe('waiting');
    expect(notices(sim)).toEqual([]);
    expect(nextStep(sim, sim.player, AGENT)).toBe('His office hasn’t answered in the usual two weeks. If there’s no answer by October 15, 2026, that’s a no. Both times are assumed in the game.');
    tended(sim, at(2026, 10, 15, 12));
    expect(rel(sim).stage).toBe('unanswered');
    expect(notices(sim)).toEqual(['No Answer From His Office: Six weeks have gone by since you sent your materials to Jordan Parente’s office at Stewart Talent, with no answer. In the game no answer by then means no. A new approach can come from April 15, 2027, with something new for his office to consider. Fictional: his words and decisions here are invented.']);
    expect(rel(sim).cooldown).toMatchObject({ why: 'silence', needsNew: true });
    expect(sendRefusal(sim, sim.player, AGENT)).toBe('His office didn’t answer your last approach, and the six weeks ran out on October 15, 2026. In the game his office looks again only after six months, from April 15, 2027, and then only at something new.');
  });

  it('PLAYER JOURNEY: a request for more: what, by when, supplied in time, and the answer it brings; and in another life not supplied, decided on what it had', () => {
    // Interested at the first answer, so his office asks for the reel that's missing; then a meeting once it comes.
    const seed = seedWhere('agent-request', (d) => d(1, 'interest') < SURE.meet);
    const { sim } = referredGraduate(seed);
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 9, 17, 12));
    expect(rel(sim).stage).toBe('requested');
    expect(rel(sim).request).toMatchObject({ what: ['reel'], by: at(2026, 10, 8, 17) });
    expect(notices(sim)).toEqual(['His Office Asked For More: Jordan Parente’s office at Stewart Talent has asked for a reel by October 8, 2026. Make it on the Career screen’s Portfolio tab, then press Send What His Office Asked For on the Representation tab. If it doesn’t come by then, his office decides on what it has. Fictional: his words and decisions here are invented.']);
    // Not yet there: said in its practical words, with the next step.
    expect(run(sim, 'pro.supply_material').error).toBe('You haven’t cut a reel yet. Cut A Reel is on the Portfolio tab.');
    reel(sim);
    sim.must({ kind: 'pro.supply_material', payload: {} });
    expect(rel(sim).stage).toBe('sent');
    expect(rel(sim).history.at(-1)!.words).toBe('You sent a reel, as his office asked, by October 8, 2026.');
    tended(sim, at(2026, 9, 25, 12));
    expect(rel(sim).stage).toBe('meeting');
    expect(rel(sim).meeting).toMatchObject({ where: 'office', moved: 0, status: 'set' });

    // The other life: the same approach, the reel never sent.
    const other = referredGraduate(seed).sim;
    other.must({ kind: 'pro.send_materials', payload: {} });
    tended(other, at(2026, 10, 8, 18));
    expect(rel(other).history.find((e) => e.kind === 'problem')!.words).toBe('What his office asked for by October 8, 2026 didn’t come: a reel.');
    expect(rel(other).why!.step).toBe('request-missed');
    expect(rel(other).why!.factors.find((f) => f.id === 'reliability')).toMatchObject({ level: 'near', words: 'You didn’t send what it asked for once.' });
  });
});

describe('V6 and G4: a pass, an approach refused too soon or with nothing new, and a valid later one', () => {
  it('PLAYER JOURNEY: passed; a year’s hold said with its date; nothing new refused; a new credit lets the next approach through', () => {
    const seed = seedWhere('agent-v6', (d) => passes(d(1, 'interest')) && d(2, 'interest') < SURE.meet);
    const { sim } = referredGraduate(seed);
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 9, 17, 12));
    expect(rel(sim).stage).toBe('passed');
    expect(notices(sim)).toEqual(['His Office Passed: Jordan Parente’s office at Stewart Talent has passed on representing you, on September 17, 2026. In the game it looks again only after a year, from September 17, 2027, and then only at something new: a new credit, a better reel or a referral. Why It Went This Way, on the Representation tab, gives the game’s reasons. Fictional: his words and decisions here are invented.']);
    // Too soon: refused with the date it can come from.
    expect(run(sim, 'pro.send_materials').error).toBe('His office passed on September 17, 2026. In the game his office looks again only after a year, from September 17, 2027, and then only at something new.');
    // A year on, the same record: nothing new to consider.
    tended(sim, at(2027, 9, 18, 12));
    expect(run(sim, 'pro.send_materials').error).toBe('His office already looked at everything on your record, on September 17, 2026. In the game a new approach needs something new for it to consider: a new credit, a better reel or a referral.');
    // Something new: a new credit (TEST SETUP: a second job finished), and the résumé brought up to date.
    finishedJob(sim, 'strong', 'winter-ledger');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    expect(sendRefusal(sim, sim.player, AGENT)).toBeUndefined();
    // And a reel, so nothing his office could ask for is missing.
    reel(sim);
    const again = sim.must<{ approach: number }>({ kind: 'pro.send_materials', payload: {} });
    expect(again.approach).toBe(2);
    tended(sim, at(2027, 10, 3, 12));
    expect(rel(sim).stage).toBe('meeting');
    expect(keys(sim).filter((k) => k!.startsWith('sent:'))).toEqual(['sent:1', 'sent:2']);
  });
});

describe('V7: a meeting missed, and one moved and kept', () => {
  it('PLAYER JOURNEY: slept through, the meeting is missed and the approach closed; in another life Ask To Move at the stop moves it a week, once, and it’s kept', () => {
    const seed = seedWhere('agent-v7', (d) => d(1, 'interest') < SURE.meet);
    const prepared = () => { const { sim } = referredGraduate(seed); reel(sim); tended(sim, at(2026, 9, 4, 10)); sim.must({ kind: 'pro.send_materials', payload: {} }); return sim; };
    const sim = prepared();
    tended(sim, at(2026, 9, 18, 12));
    const m = rel(sim).meeting!;
    expect(m).toMatchObject({ at: at(2026, 9, 25, 11), where: 'office', status: 'set' });
    const item = sim.universe.scheduled.find((i) => i.kind === MEETING_KIND && i.status === 'pending')!;
    expect(item).toMatchObject({ requiresPlayer: true, travelMinutes: 120, durationMinutes: 60, locationId: 'us-ny-newyork', category: 'career', label: 'Meeting At Stewart Talent' });
    expect(notices(sim).at(-1)).toBe('His Office Asked To Meet You: Jordan Parente’s office at Stewart Talent has asked to meet you: Friday, September 25, 2026 at 11:00 AM, at Stewart Talent’s New York office. It’s on your calendar with two hours to get there from New Haven, a time the game assumes. If you can’t make it, Ask To Move on the Representation tab moves it a week, once. Fictional: his words and decisions here are invented.');
    // Missed: asleep through it, by the player's own sleep.
    tended(sim, at(2026, 9, 25, 2));
    sim.must({ kind: 'life.sleep', payload: { hours: 12 } });
    expect(rel(sim).meeting!.status).toBe('missed');
    expect(rel(sim).stage).toBe('passed');
    expect(notices(sim).at(-1)).toBe('You Missed The Meeting: You missed the meeting with Jordan Parente’s office at Stewart Talent at 11:00 AM on September 25, 2026. In the game a meeting comes before an offer, so his office closed your approach. It looks again only after a year, from September 25, 2027, and then only at something new. Fictional: his words and decisions here are invented.');
    expect(keys(sim).slice(-2)).toEqual([`meeting:${m.id}:missed`, `decision:${m.id}:passed`]);

    // The other life: the clock stops at the meeting, and Ask To Move there moves it a week and carries the jump on.
    const other = prepared();
    tended(other, at(2026, 9, 25, 8));
    const stop = other.advanceTo(at(2026, 9, 26, 9), { stopOnPlayerRequired: true });
    expect(stop.interruptedBy?.kind).toBe(MEETING_KIND);
    const [ask] = stopChoices(MEETING_KIND);
    expect(ask).toMatchObject({ label: 'Ask To Move', command: 'pro.ask_to_move', then: 'carry-on' });
    const moved = answerStop(other, { item: stop.interruptedBy!, wanted: at(2026, 9, 26, 9), sentFrom: at(2026, 9, 25, 8) }, ask!);
    expect(moved.refused).toBeUndefined();
    expect(other.now).toBe(at(2026, 9, 26, 9));
    expect(rel(other).meeting).toMatchObject({ at: at(2026, 10, 2, 11), moved: 1, status: 'set' });
    expect(rel(other).history.at(-1)!.words).toBe('You asked to move the meeting from September 25, 2026 at 11:00 AM, and his office moved it to October 2, 2026 at 11:00 AM.');
    // Once: a second ask is refused, and the stop stays open.
    const again = other.advanceTo(at(2026, 10, 3, 9), { stopOnPlayerRequired: true });
    expect(again.interruptedBy?.kind).toBe(MEETING_KIND);
    expect(answerStop(other, { item: again.interruptedBy!, wanted: at(2026, 10, 3, 9), sentFrom: other.now }, ask!).refused).toBe('You moved this meeting once already. In the game his office moves a meeting once, and it stays on October 2, 2026 at 11:00 AM.');
    // Go: kept.
    answerStop(other, { item: again.interruptedBy!, wanted: at(2026, 10, 3, 9), sentFrom: other.now }, 'go');
    expect(rel(other).meeting!.status).toBe('kept');
    expect(rel(other).stage).toBe('deciding');
    expect(countKind(other, 'meeting-kept')).toBe(1);
  });
});

const countKind = (sim: Simulation, kind: string) => rel(sim).history.filter((e) => e.kind === kind).length;

describe('V8 and G7: the agreement, shown in full, accepted in one life and declined in another', () => {
  it('PLAYER JOURNEY: offered with every term and its basis; accepted, it sets the agreement and the relation; declined, it holds six months; let lapse, it lapses', () => {
    const seed = seedWhere('agent-v8', (d) => d(1, 'interest') < SURE.meet && d(1, 'offer') < SURE.offer);
    const offered = () => {
      const { sim } = referredGraduate(seed);
      reel(sim);
      tended(sim, at(2026, 9, 4, 10));
      sim.must({ kind: 'pro.send_materials', payload: {} });
      tended(sim, at(2026, 9, 30, 12));
      return sim;
    };
    const sim = offered();
    expect(rel(sim).stage).toBe('offered');
    const a = sim.player.pro!.agreements[0]!;
    expect(a).toMatchObject({ agentId: AGENT.id, status: 'offered', offeredAt: at(2026, 9, 30, 10), standsUntil: at(2026, 10, 14, 10) });
    // Every term, with its basis, copied in when offered.
    expect(a.terms.map((t) => [t.id, t.basis])).toEqual(AGREEMENT_TERMS.map((t) => [t.id, t.basis]));
    expect(a.terms.map((t) => t.id)).toEqual(['scope', 'territory', 'excluded', 'exclusivity', 'commission', 'scale-plus-ten', 'duration', 'responsibilities', 'actor', 'payment', 'termination', 'continuing', 'offer']);
    expect(notices(sim).at(-1)).toBe('He Offered You Representation: Jordan Parente has offered to represent you at Stewart Talent: an agreement for one year. Every term is under The Agreement on the Career screen’s Representation tab, each marked as a published rule or the game’s own. The offer stands until October 14, 2026. Fictional: his words and decisions here are invented.');
    expect(activeAgreement(sim.player, sim.now)).toBeUndefined();
    const back = reload(sim);
    back.must({ kind: 'pro.accept_agreement', payload: {} });
    const signed = back.player.pro!.agreements[0]!;
    expect(signed).toMatchObject({ status: 'accepted', signedAt: back.now, endsAt: at(2027, 9, 30, 12) });
    expect(rel(back)).toMatchObject({ stage: 'represented', agreementId: signed.id });
    expect(activeAgreement(back.player, back.now)?.id).toBe(signed.id);
    expect(run(back, 'pro.accept_agreement').error).toBe('He hasn’t offered you an agreement.');
    expect(run(back, 'pro.send_materials').error).toBe('Jordan Parente represents you already.');
    // The other life: declined, and held six months.
    const other = offered();
    other.must({ kind: 'pro.decline_agreement', payload: {} });
    expect(other.player.pro!.agreements[0]!.status).toBe('declined');
    expect(rel(other).stage).toBe('declined');
    expect(sendRefusal(other, other.player, AGENT)).toBe('You declined his offer on September 30, 2026. In the game his office looks again only after six months, from March 31, 2027, and then only at something new.');
    expect(activeAgreement(other.player, other.now)).toBeUndefined();
    // A third: unanswered for fourteen days, it lapses.
    const third = offered();
    tended(third, at(2026, 10, 14, 12));
    expect(third.player.pro!.agreements[0]!.status).toBe('lapsed');
    expect(notices(third).at(-1)).toBe('His Offer Lapsed: The agreement Jordan Parente offered stood until today, and it lapsed unanswered. In the game his office looks again only after six months, from April 14, 2027, and then only at something new. Fictional: his words and decisions here are invented.');
    expect(sendRefusal(third, third.player, AGENT)).toBe('You let his offer lapse on October 14, 2026. In the game his office looks again only after six months, from April 14, 2027, and then only at something new.');
  });
});

/** A graduate represented from September 30, 2026, for the endings. */
function represented(prefix: string) {
  const seed = seedWhere(prefix, (d) => d(1, 'interest') < SURE.meet && d(1, 'offer') < SURE.offer);
  const { sim, job } = referredGraduate(seed);
  reel(sim);
  tended(sim, at(2026, 9, 4, 10));
  sim.must({ kind: 'pro.send_materials', payload: {} });
  tended(sim, at(2026, 9, 30, 12));
  sim.must({ kind: 'pro.accept_agreement', payload: {} });
  return { sim, job, agreement: sim.player.pro!.agreements[0]! };
}

describe('V9 and G8: representation ends by its terms, with what it leaves owed', () => {
  it('PLAYER JOURNEY: by its term, a year on, on its own and said, with nothing more owed', () => {
    const { sim, agreement } = represented('agent-term');
    tended(sim, at(2027, 9, 30, 13));
    expect(agreement).toMatchObject({ status: 'ended', endedHow: 'term', endedAt: agreement.endsAt });
    expect(rel(sim).stage).toBe('ended');
    expect(activeAgreement(sim.player, sim.now)).toBeUndefined();
    // Still the one in force for a date inside its term, as a payment's commission needs.
    expect(activeAgreement(sim.player, at(2027, 3, 1))?.id).toBe(agreement.id);
    expect(notices(sim).at(-1)).toBe('Your Agreement Ended: Your agreement with Jordan Parente at Stewart Talent ended on September 30, 2027, at the end of its year. No pay is still to come from contracts you made while it ran, so no commission is still owed on them. An offer he passed on while it ran that you accept within 60 days after it ended owes commission too. Fictional: his words and decisions here are invented.');
  });

  it('PLAYER JOURNEY: by agreement, at any time; it says what commission stays owed on a contract made while it ran', () => {
    const { sim, agreement } = represented('agent-agreed');
    // TEST SETUP: covered work booked through him while it runs, its pay promised and not yet received, as the work loop and the pay leave it.
    const t = projectById('calloway-files')!;
    sim.player.pro!.engagements.push({ id: 'e-cov', opportunityId: 'o-cov', projectId: t.id, role: t.role.part, status: 'booked', days: [{ from: at(2026, 11, 2, 7), to: at(2026, 11, 3, 19), label: t.project }], agreementId: agreement.id, agentId: AGENT.id, pay: [{ id: 'p1', key: 'e-cov:1', promised: 2566_00, currency: 'USD', promisedAt: sim.now, due: at(2026, 11, 12) }], history: [], counts: {} });
    tended(sim, at(2026, 10, 10, 12));
    sim.must({ kind: 'pro.end_agreement', payload: { how: 'agreement' } });
    expect(agreement).toMatchObject({ status: 'ended', endedHow: 'agreement', endedAt: sim.now });
    expect(activeAgreement(sim.player, sim.now)).toBeUndefined();
    expect(stillOwed(sim.player, agreement)).toBe('Commission stays owed on the pay still to come from contracts you made while it ran: Desk Clerk in The Calloway Files. It comes out of that pay when it’s paid. An offer he passed on while it ran that you accept within 60 days after it ended owes commission too.');
    expect(sim.universe.scheduled.filter((i) => i.refId === agreement.id && i.status === 'pending')).toEqual([]);
    expect(run(sim, 'pro.end_agreement', { how: 'agreement' }).error).toBe('You’re not represented by him.');
  });

  it('PLAYER JOURNEY: by the player under Equity’s 90 days with no offer, refused before them with the date, and refused under SAG-AFTRA’s rule until 151 days and while ten days were worked', () => {
    const { sim, agreement } = represented('agent-ninety');
    expect(run(sim, 'pro.end_agreement', { how: 'no-offer' }).error).toBe('Equity’s rule lets you end it once 90 days go by with no real offer of covered work through him. You signed on September 30, 2026, so that’s from December 29, 2026.');
    expect(run(sim, 'pro.end_agreement', { how: 'too-little-work' }).error).toBe('SAG-AFTRA’s rule lets you end it this way only after 151 days, from February 28, 2027.');
    // TEST SETUP: an offer of covered work through him on November 2, as the work loop records one: the 90 days start again.
    const offer: Opportunity = { id: 'o-1', projectId: 'winter-ledger', via: 'agent', agentId: AGENT.id, status: 'declined', postedAt: at(2026, 10, 20), submitBy: at(2026, 10, 27), offer: { at: at(2026, 11, 2), until: at(2026, 11, 9), rate: 'lort-c', per: 'week', units: 9 }, resolvedAt: at(2026, 11, 9), history: [], counts: {} };
    sim.player.pro!.opportunities.push(offer);
    tended(sim, at(2026, 12, 29, 12));
    expect(run(sim, 'pro.end_agreement', { how: 'no-offer' }).error).toBe('Equity’s rule lets you end it once 90 days go by with no real offer of covered work through him. His last came on November 2, 2026, so that’s from January 31, 2027.');
    tended(sim, at(2027, 1, 31, 12));
    sim.must({ kind: 'pro.end_agreement', payload: { how: 'no-offer' } });
    expect(agreement).toMatchObject({ status: 'ended', endedHow: 'no-offer' });
    expect(notices(sim).at(-1)).toContain('ended on January 31, 2027, by you, under Equity’s rule, after 90 days with no real offer of covered work.');
    // SAG-AFTRA's: in another life, ten days worked in the last 91 hold it; with fewer, it goes.
    const { sim: other, agreement: a2 } = represented('agent-sag');
    tended(other, at(2027, 3, 1, 12));
    const t = projectById('calloway-files')!;
    // Ten dates, the last ending earlier in its day than the first began, as a night shoot's would.
    const ten: Engagement = { id: 'e-ten', opportunityId: 'o-ten', projectId: t.id, role: t.role.part, status: 'finished', days: [{ from: at(2027, 2, 1, 19), to: at(2027, 2, 10, 7), label: t.project }], agreementId: a2.id, agentId: AGENT.id, pay: [], history: [], counts: {}, finishedAt: at(2027, 2, 10, 7) };
    other.player.pro!.engagements.push(ten);
    expect(run(other, 'pro.end_agreement', { how: 'too-little-work' }).error).toBe('You’ve had 10 days of covered work in the last 91, and SAG-AFTRA’s rule needs fewer than ten.');
    ten.days[0]!.to = at(2027, 2, 9, 7);
    other.must({ kind: 'pro.end_agreement', payload: { how: 'too-little-work' } });
    expect(a2).toMatchObject({ status: 'ended', endedHow: 'too-little-work' });
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
    expect(f.roster!.words).toMatch(/^Assumed for 2026: room for .+\. Your record shows you as a lead, aged 24, so .+\. How many new actors his list takes on in a year, and of which types, is assumed in the game\. The game knows nothing of his real list and uses none of it\.$/);
    expect(i.gate).toBe(true);
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 9, 17, 12));
    expect(rel(sim).why).toMatchObject({ step: 'reply', outcome: 'pass', atOrBeyond: i.atOrBeyond, needed: 4 });
    expect(rel(sim).why!.factors.map((x) => x.level)).toEqual(i.factors.map((x) => x.level));
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

describe('G5 and V15: history with stable ids, nothing noted twice', () => {
  it('GUARD: replaying the same days across a reload at each step and a long jump notes each event once, with the same ids', () => {
    const seed = seedWhere('agent-guard', (d) => d(1, 'interest') < SURE.meet && d(1, 'offer') < SURE.offer);
    const play = (reloads: boolean) => {
      let { sim } = referredGraduate(seed);
      const step = (fn: () => void) => { fn(); if (reloads) sim = reload(sim); };
      step(() => reel(sim));
      step(() => tended(sim, at(2026, 9, 4, 10)));
      step(() => sim.must({ kind: 'pro.send_materials', payload: {} }));
      step(() => tended(sim, at(2026, 9, 18, 12)));
      step(() => tended(sim, at(2026, 9, 25, 13)));
      step(() => tended(sim, at(2026, 9, 30, 12)));
      step(() => sim.must({ kind: 'pro.accept_agreement', payload: {} }));
      // The long jump: past the term's end, in one move.
      step(() => { sim.player.awakeSince = sim.now; sim.advanceTo(at(2027, 10, 15, 12)); });
      return sim;
    };
    const straight = play(false);
    const reloaded = play(true);
    const h = rel(reloaded).history;
    expect(h.map((e) => e.kind)).toEqual(['discovered', 'checked', 'referred', 'sent', 'meeting-set', 'meeting-kept', 'offer', 'accepted', 'represented', 'ended']);
    expect(new Set(h.map((e) => e.key)).size).toBe(h.length);
    expect(new Set(h.map((e) => e.id)).size).toBe(h.length);
    expect(h).toEqual(rel(straight).history);
    expect(rel(reloaded).counts).toEqual(rel(straight).counts);
    expect(notices(reloaded)).toEqual(notices(straight));
    expect(breaches(reloaded.universe, reloaded.now)).toEqual([]);
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
    expect(said).toEqual([`The School’s Follow-Up After The Showcase: The School passed your showcase on to the agencies it follows up with, and Jordan Parente’s office at Stewart Talent asked the School to pass on a request to meet you. Press Send Your Materials on the Career screen’s Representation tab by October 6, 2026, and his office sets a time. ${AGENT.notice} In the game agencies follow the showcase up through the School. The School publishes the showcase’s dates and places, not who comes, and the game doesn’t say he was there. Fictional: his words and decisions here are invented.`]);
    expect(said[0]).not.toMatch(/\b(attended|saw you|was at the showcase)\b/);
    // The showcase is among the work his office has to go on, by its judged band.
    expect(rel(sim).why!.factors[0]).toMatchObject({ id: 'work', level: 'at', words: 'His office has your showcase scenes, as the School recorded them, at best Strong.' });
    sim.must({ kind: 'pro.agent_check', payload: {} });
    sim.must({ kind: 'pro.send_materials', payload: {} });
    expect(rel(sim).history.at(-1)!.words).toBe('You sent your headshots and your résumé to his office, after the School’s follow-up, answering its request to meet.');
    tended(sim, at(2026, 9, 13, 12));
    expect(rel(sim).stage).toBe('meeting');
    expect(notices(sim).at(-1)).toMatch(/^A Meeting Is Set: Jordan Parente’s office at Stewart Talent has set the meeting it asked the School to pass on: /);
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
    expect(notices(working)[0]).toMatch(/^The School’s Follow-Up After The Showcase: The School passed your showcase on to the agencies it follows up with\. Jordan Parente’s office at Stewart Talent sent no request to meet, but the follow-up is an introduction: you can send it your materials from the Career screen’s Representation tab\./);
    expect(rel(working).stage).toBe('introduced');
    const none = graduate(seed);
    none.player.pro!.showcase = { term: 5, scenes: [], performed: [] };
    scheduleShowcaseFollowUp(none, none.player, none.now);
    tended(none, at(2026, 9, 6, 12));
    expect(relationOf(none.player, AGENT.id)).toBeUndefined();
    expect(none.player.pro!.showcase!.followUp).toBeUndefined();
  });
});

describe('A2: representation while enrolled', () => {
  it('PLAYER JOURNEY: a first-year introduced, met and signed is still enrolled in good standing, and permission to work says exactly what it said before', () => {
    const seed = seedWhere('agent-a2', (d) => d(1, 'interest') < SURE.meet && d(1, 'offer') < SURE.offer);
    const sim = student(seed);
    tended(sim, at(2026, 8, 30, 10));
    reel(sim);
    // TEST SETUP: a summer's job finished and judged Exceptional, as the work loop would leave one.
    finishedJob(sim, 'exceptional');
    portfolio(sim);
    sim.must({ kind: 'pro.agent_notice', payload: {} });
    sim.must({ kind: 'pro.agent_check', payload: {} });
    const job = sim.player.pro!.engagements[0]!;
    sim.must({ kind: 'pro.ask_referral', payload: { engagementId: job.id } });
    const before = { standing: sim.player.school!.standing, authorized: usWorkAuthorized(sim.player, sim.now), eligibility: eligibilityOf(sim.player, sim.now) };
    expect(before.standing).toBe('good');
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 9, 21, 12));
    expect(rel(sim).meeting!.status).toBe('kept');
    tended(sim, at(2026, 9, 28, 12));
    sim.must({ kind: 'pro.accept_agreement', payload: {} });
    expect(rel(sim).stage).toBe('represented');
    expect(sim.player.school!.standing).toBe('good');
    expect(sim.player.school!.endedAt).toBeUndefined();
    expect(usWorkAuthorized(sim.player, sim.now)).toBe(before.authorized);
    expect(eligibilityOf(sim.player, sim.now)).toEqual(before.eligibility);
    expect(sim.universe.scheduled.some((i) => i.kind.startsWith('school.') && i.status === 'pending')).toBe(true);
    expect(breaches(sim.universe, sim.now)).toEqual([]);
  });
});

describe('nothing from him arrives unasked', () => {
  it('GUARD: a life that never approaches him hears nothing from him in a term; in a played approach each notice of his comes after the player’s own send and carries the fictional line', () => {
    const quiet = student('agent-quiet');
    tended(quiet, at(2026, 12, 1, 12));
    expect(notices(quiet)).toEqual([]);
    expect(relationOf(quiet.player, AGENT.id)).toBeUndefined();
    expect(quiet.universe.scheduled.some((i) => i.kind.startsWith('pro.agent.'))).toBe(false);
    const { sim } = represented('agent-unasked');
    const his = sim.universe.notifications.filter((n) => n.refType === 'pro-agent');
    const sentAt = rel(sim).history.find((e) => e.kind === 'sent')!.at;
    expect(his.length).toBeGreaterThan(1);
    for (const n of his) {
      expect(n.at).toBeGreaterThan(sentAt);
      expect(n.body.endsWith(AGENT.fictional)).toBe(true);
      expect(n.route).toBe('/workspace/career?tab=representation');
    }
    // No address, phone number, email or web link of his or the agency's in anything his system said.
    expect(his.some((n) => /@|https?:|www\.|\(\d{3}\)|\d{3}-\d{4}/.test(n.body))).toBe(false);
  });
});
