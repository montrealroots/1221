/**
 * The agent's playthroughs (brief 19, `docs/verification/career-2026-10-20/criteria.md` V5 to V9 and V15, with G2, G3,
 * G5, G7, G8 and A2 they play): an incomplete submission and its remedy; no answer and a request for more; a pass, an
 * approach refused too soon and with nothing new, and a valid later one; a meeting missed, and one moved and kept; an
 * offer accepted, declined and let lapse; representation ending by its term, by agreement and by the 90 days; a save
 * and a load at each step with nothing noted twice; representation while enrolled. Each is played by the clock and the
 * commands, its notices and the panel's What's Next read in order, saved and loaded where it moves on (`cross`), and
 * every law of the world checked at the end (`breaches`). The rules, the factors and the draw are in
 * tests/pro-agent.test.ts.
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
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned } from '@/engine/core/time';
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
import { HISTORY_KEPT, activeAgreement, addCredit, currentOf, eligibilityOf, type Engagement, type Opportunity } from '@/engine/systems/pro';
import { MEETING_KIND, interestOf, newSince, nextStep, referrersOf, relationOf, sendRefusal, stillOwed, supplyRefusal } from '@/engine/systems/proagent';

const zone = 'America/New_York';
const BAND_RANK: Readonly<Record<Band, number>> = { unready: 0, working: 1, strong: 2, exceptional: 3 };
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
function seedWhere(prefix: string, ok: (d: (n: number, step: 'interest' | 'offer') => number) => boolean): string {
  for (let i = 0; i < 20_000; i += 1) {
    const seed = `${prefix}-${i}`;
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

/**
 * A save and a load where the journey moves on: the reopened save holds the same history, the same notices and every
 * law of the world, and play goes on from it.
 */
function cross(sim: Simulation): Simulation {
  const back = reload(sim);
  expect(rel(back).history).toEqual(rel(sim).history);
  expect(notices(back)).toEqual(notices(sim));
  expect(breaches(back.universe)).toEqual([]);
  return back;
}

describe('G2 and V5: the stages and the routes, an incomplete submission and its remedy', () => {
  it('PLAYER JOURNEY: the check refuses an incomplete submission with what’s missing, the remedy is made, an unsolicited approach is refused in the agency’s own words, and a referral opens the way', () => {
    let sim = graduate(seedWhere('agent-v5', (d) => d(1, 'interest') < SURE.meet));
    sim.must({ kind: 'pro.agent_notice', payload: {} });
    sim = cross(sim);
    // The incomplete submission: no headshots and no résumé, each in its practical words, with its next step.
    expect(run(sim, 'pro.agent_check').error).toBe('You have no headshots, and every submission starts with one. Press Book A Headshot Session on the Career screen’s Portfolio tab. You have no résumé. Press Make Your Résumé on the Career screen’s Portfolio tab: it takes an hour, from your record.');
    expect(rel(sim).stage).toBe('discovered');
    sim.must({ kind: 'pro.headshots', payload: {} });
    expect(run(sim, 'pro.agent_check').error).toBe('You have no résumé. Press Make Your Résumé on the Career screen’s Portfolio tab: it takes an hour, from your record.');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    // The remedy made, the check goes through, noted once, and the stage moves.
    expect(run(sim, 'pro.agent_check').ok).toBe(true);
    sim = cross(sim);
    expect(rel(sim).stage).toBe('checked');
    // What the check found, as it stood (from 2026-10-21, brief 19's app walk: until then the check's own instructions,
    // "Tape a practice brief on the Player Profile first.", were copied into the history).
    expect(rel(sim).history.at(-1)!.words).toBe('You checked your materials for an approach: headshots and a résumé were there, and you had no reel.');
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
    sim = cross(sim);
    expect(rel(sim)).toMatchObject({ stage: 'introduced', via: { route: 'referral', by: 'Pennick Casting' } });
    expect(sim.universe.notifications.at(-1)).toMatchObject({ title: 'Pennick Casting Referred You', body: 'Pennick Casting has referred you to Jordan Parente’s office at Stewart Talent, from your work as Nell in A House On Calder Street. You can send your materials now, from the Career screen’s Representation tab.' });
    expect(run(sim, 'pro.ask_referral', { engagementId: job.id }).error).toBe('Pennick Casting referred you on September 3, 2026.');
    // Sent: the materials go, the stage moves, and the answer is on the clock; no word comes from him on his own.
    sim.must({ kind: 'pro.update_resume', payload: {} });
    const sent = sim.must<{ approach: number; silenceAt: number }>({ kind: 'pro.send_materials', payload: {} });
    sim = cross(sim);
    expect(sent.approach).toBe(1);
    expect(rel(sim).stage).toBe('sent');
    expect(rel(sim).history.at(-1)!.words).toBe('You sent your headshots and your résumé to his office, on Pennick Casting’s referral.');
    expect(nextStep(sim, sim.player, AGENT)).toBe('His office usually answers within two weeks. If there’s no answer by October 15, 2026, that’s a no. Both times are assumed in the game.');
    expect(notices(sim)).toEqual([]);
    expect(run(sim, 'pro.send_materials').error).toBe('Your materials went to his office on September 3, 2026, and its answer is still to come.');
    // Every stage moved here is a state the save holds, and each step one event, keyed.
    expect(keys(sim)).toEqual(['discovered', 'checked:0', 'referral:' + job.id, 'sent:1']);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('G3: his office’s answers', () => {
  it('PLAYER JOURNEY: no answer: waiting once the usual two weeks go by, and a no once six weeks have, said then and held six months', () => {
    let { sim } = referredGraduate(seedWhere('agent-silence', (d) => unanswered(d(1, 'interest'))));
    sim.must({ kind: 'pro.send_materials', payload: {} });
    sim = cross(sim);
    tended(sim, at(2026, 9, 17, 12));
    sim = cross(sim);
    expect(rel(sim).stage).toBe('waiting');
    expect(notices(sim)).toEqual([]);
    expect(nextStep(sim, sim.player, AGENT)).toBe('His office hasn’t answered in the usual two weeks. If there’s no answer by October 15, 2026, that’s a no. Both times are assumed in the game.');
    tended(sim, at(2026, 10, 15, 12));
    sim = cross(sim);
    expect(rel(sim).stage).toBe('unanswered');
    // Each title names whose office (from 2026-10-21, brief 19's app walk: until then "His Office", which in What Needs You
    // named nobody).
    expect(notices(sim)).toEqual(['No Answer From Jordan Parente’s Office: Six weeks have gone by since you sent your materials to Jordan Parente’s office at Stewart Talent, with no answer. In the game no answer by then means no. A new approach can come from April 15, 2027, with something new for his office to consider. Fictional: his words and decisions here are invented.']);
    expect(rel(sim).cooldown).toMatchObject({ why: 'silence', needsNew: true });
    expect(sendRefusal(sim, sim.player, AGENT)).toBe('His office didn’t answer your last approach, and the six weeks ran out on October 15, 2026. In the game his office looks again only after six months, from April 15, 2027, and then only at something new.');
  });

  it('PLAYER JOURNEY: a request for more: what, by when, supplied in time, and the answer it brings; and in another life not supplied, decided on what it had', () => {
    // Interested at the first answer, so his office asks for the reel that's missing; then a meeting once it comes.
    const seed = seedWhere('agent-request', (d) => d(1, 'interest') < SURE.meet);
    let { sim } = referredGraduate(seed);
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 9, 17, 12));
    sim = cross(sim);
    expect(rel(sim).stage).toBe('requested');
    expect(rel(sim).request).toMatchObject({ what: ['reel'], by: at(2026, 10, 8, 17) });
    expect(notices(sim)).toEqual(['Jordan Parente’s Office Asked For More: Jordan Parente’s office at Stewart Talent has asked for a reel by October 8, 2026. Make it on the Career screen’s Portfolio tab, then press Send What His Office Asked For on the Representation tab. If it doesn’t come by then, his office decides on what it has. Fictional: his words and decisions here are invented.']);
    // Not yet there: said in its practical words, with the next step.
    expect(run(sim, 'pro.supply_material').error).toBe('You haven’t cut a reel yet. Cut A Reel is on the Portfolio tab.');
    reel(sim);
    sim.must({ kind: 'pro.supply_material', payload: {} });
    sim = cross(sim);
    expect(rel(sim).stage).toBe('sent');
    expect(rel(sim).history.at(-1)!.words).toBe('You sent a reel, as his office asked, by October 8, 2026.');
    tended(sim, at(2026, 9, 25, 12));
    sim = cross(sim);
    expect(rel(sim).stage).toBe('meeting');
    expect(rel(sim).meeting).toMatchObject({ where: 'office', moved: 0, status: 'set' });

    // The other life: the same approach, the reel never sent.
    let other = referredGraduate(seed).sim;
    other.must({ kind: 'pro.send_materials', payload: {} });
    tended(other, at(2026, 10, 8, 18));
    other = cross(other);
    // Filed as its own kind from 2026-10-21, `request-missed`: as a `problem` it was counted again with a job's
    // (brief 19's playthroughs).
    expect(rel(other).history.find((e) => e.kind === 'request-missed')!.words).toBe('What his office asked for by October 8, 2026 didn’t come: a reel.');
    expect(rel(other).history.filter((e) => e.kind === 'problem')).toEqual([]);
    expect(rel(other).why!.step).toBe('request-missed');
    expect(rel(other).why!.factors.find((f) => f.id === 'reliability')).toMatchObject({ level: 'near', words: 'You didn’t send what it asked for once.' });
  });
});

describe('G3: what a request for more refuses until it’s made', () => {
  it('PLAYER JOURNEY: a request for headshots more than two years old and an up-to-date résumé: Send What His Office Asked For refused for each while it stands, in words, and taken once both are new', () => {
    // From the audit's second reading (2026-10-21): with either refusal taken out, every test still passed, and no life
    // was asked for headshots. TEST SETUP: the headshots dated three years back, as if taken then; a second job finished
    // after the résumé, so the résumé is behind; a reel, so the reel isn't what's asked for.
    const seed = seedWhere('agent-request', (d) => d(1, 'interest') < SURE.meet);
    let { sim } = referredGraduate(seed);
    reel(sim);
    const shots = currentOf(sim.player.pro, 'headshot')!;
    shots.made -= 3 * 365 * MS_DAY;
    finishedJob(sim, 'strong', 'winter-ledger');
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 9, 21, 12));
    sim = cross(sim);
    expect(rel(sim).stage).toBe('requested');
    expect([...rel(sim).request!.what].sort()).toEqual(['headshot', 'resume']);
    const old = formatDate(shots.made, zone);
    const headshotsWords = `Your headshots are still the ones from ${old}. Book A Headshot Session on the Portfolio tab for new ones.`;
    const resumeWords = 'Your résumé is still behind your record. Update Your Résumé is on the Portfolio tab.';
    const refused = run(sim, 'pro.supply_material').error!;
    expect(refused).toContain(headshotsWords);
    expect(refused).toContain(resumeWords);
    sim.must({ kind: 'pro.update_resume', payload: {} });
    expect(run(sim, 'pro.supply_material').error).toBe(headshotsWords);
    sim.must({ kind: 'pro.headshots', payload: {} });
    expect(supplyRefusal(sim, sim.player, AGENT)).toBeUndefined();
    sim.must({ kind: 'pro.supply_material', payload: {} });
    expect(rel(sim).counts.supplied).toBe(1);
  });
});

describe('V6 and G4: a pass, an approach refused too soon or with nothing new, and a valid later one', () => {
  it('PLAYER JOURNEY: passed; a year’s hold said with its date; nothing new refused; a new credit lets the next approach through', () => {
    const seed = seedWhere('agent-v6', (d) => passes(d(1, 'interest')) && d(2, 'interest') < SURE.meet);
    let { sim } = referredGraduate(seed);
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 9, 17, 12));
    sim = cross(sim);
    expect(rel(sim).stage).toBe('passed');
    expect(notices(sim)).toEqual(['Jordan Parente’s Office Passed: Jordan Parente’s office at Stewart Talent has passed on representing you, on September 17, 2026. In the game it looks again only after a year, from September 17, 2027, and then only at something new: a new credit, a better reel or a referral. Why It Went This Way, on the Representation tab, gives the game’s reasons. Fictional: his words and decisions here are invented.']);
    // Too soon: refused with the date it can come from.
    expect(run(sim, 'pro.send_materials').error).toBe('His office passed on September 17, 2026. In the game his office looks again only after a year, from September 17, 2027, and then only at something new.');
    // A year on, the same record: nothing new to consider.
    tended(sim, at(2027, 9, 18, 12));
    sim = cross(sim);
    expect(run(sim, 'pro.send_materials').error).toBe('His office already looked at everything on your record, on September 17, 2026. In the game a new approach needs something new for it to consider: a new credit, a better reel or a referral.');
    // Something new: a new credit (TEST SETUP: a second job finished), and the résumé brought up to date.
    finishedJob(sim, 'strong', 'winter-ledger');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    expect(sendRefusal(sim, sim.player, AGENT)).toBeUndefined();
    // And a reel, so nothing his office could ask for is missing.
    reel(sim);
    const again = sim.must<{ approach: number }>({ kind: 'pro.send_materials', payload: {} });
    sim = cross(sim);
    expect(again.approach).toBe(2);
    tended(sim, at(2027, 10, 3, 12));
    sim = cross(sim);
    expect(rel(sim).stage).toBe('meeting');
    expect(keys(sim).filter((k) => k!.startsWith('sent:'))).toEqual(['sent:1', 'sent:2']);
  });

  it('PLAYER JOURNEY: a year on, a referral alone is something new for his office: the same record but for it is refused, and with it the next approach goes through', () => {
    // From the audit's second reading (2026-10-21): with the referral taken out of `caseKeys` every test still passed,
    // though the pass's notice tells the player a referral counts. TEST SETUP: a second job finished before the first
    // approach, so its credit is one his office has already considered, and only its referral is new.
    const seed = seedWhere('agent-v6', (d) => passes(d(1, 'interest')) && d(2, 'interest') < SURE.meet);
    let { sim } = referredGraduate(seed);
    const second = finishedJob(sim, 'strong', 'winter-ledger');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    reel(sim);
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 10, 1, 12));
    sim = cross(sim);
    expect(rel(sim).stage).toBe('passed');
    // Held: a referral waits with the approach (from the audit's third reading: with this refusal and the one while an
    // approach is under way taken out, every test still passed).
    expect(run(sim, 'pro.ask_referral', { engagementId: second.id }).error).toMatch(/^His office passed on September \d+, 2026\. In the game his office looks again only after a year, from September \d+, 2027, and then only at something new\.$/);
    tended(sim, at(2027, 10, 2, 12));
    sim = cross(sim);
    expect(sendRefusal(sim, sim.player, AGENT)).toMatch(/^His office already looked at everything on your record, on September \d+, 2026\. In the game a new approach needs something new for it to consider: a new credit, a better reel or a referral\.$/);
    sim.must({ kind: 'pro.ask_referral', payload: { engagementId: second.id } });
    expect(newSince(sim.player, rel(sim))).toEqual([`referral:${second.id}`]);
    expect(sendRefusal(sim, sim.player, AGENT)).toBeUndefined();
    expect(sim.must<{ approach: number }>({ kind: 'pro.send_materials', payload: {} }).approach).toBe(2);
    // Under way: refused with where the approach stands. TEST SETUP: a third job finished, judged Strong.
    const third = finishedJob(sim, 'strong', 'route-nine');
    expect(run(sim, 'pro.ask_referral', { engagementId: third.id }).error).toBe('Your materials went to his office on October 2, 2027, and its answer is still to come.');
  });

  it('PLAYER JOURNEY: a year on, a better reel alone is something new for his office: the same reel is refused, and one cut from a prepared tape lets the next approach through', () => {
    // From the audit's third reading (2026-10-21): with the reel's bands taken out of `caseKeys` every test still passed,
    // though the pass's notice tells the player a better reel counts. The reel is cut from a camera brief taped cold first,
    // then the same brief prepared on the Player Profile and taped again.
    const seed = seedWhere('agent-v6', (d) => passes(d(1, 'interest')) && d(2, 'interest') < SURE.meet);
    let { sim } = referredGraduate(seed);
    reel(sim);
    const cold = currentOf(sim.player.pro, 'reel')!.pieces![0]!.band;
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 10, 1, 12));
    sim = cross(sim);
    expect(rel(sim).stage).toBe('passed');
    tended(sim, at(2027, 10, 2, 12));
    sim = cross(sim);
    expect(sendRefusal(sim, sim.player, AGENT)).toMatch(/^His office already looked at everything on your record/);
    const brief = BRIEFS.find((x) => x.medium === 'camera')!;
    for (const step of ['read', 'lines', 'rehearse']) for (let i = 0; i < 12 && sim.execute({ kind: 'brief.prepare', payload: { brief: brief.id, step } }).ok; i += 1) tended(sim, sim.now + MS_HOUR);
    sim.must({ kind: 'practice.self_tape', payload: { genre: brief.kinds[0], brief: brief.id } });
    const take = sim.player.briefs![brief.id]!.takes.reduce((x, y) => (y.at > x.at ? y : x));
    sim.must({ kind: 'pro.cut_reel', payload: { pieces: [`tape:${brief.id}:${take.at}`] } });
    const better = currentOf(sim.player.pro, 'reel')!.pieces![0]!.band;
    expect(BAND_RANK[better!]).toBeGreaterThan(BAND_RANK[cold!]);
    expect(newSince(sim.player, rel(sim))).toEqual(expect.arrayContaining([`reel:${better}`]));
    expect(newSince(sim.player, rel(sim)).every((k) => k.startsWith('reel:'))).toBe(true);
    expect(sendRefusal(sim, sim.player, AGENT)).toBeUndefined();
  });
});

describe('V7: a meeting missed, and one moved and kept', () => {
  it('PLAYER JOURNEY: slept through, the meeting is missed and the approach closed; in another life Ask To Move at the stop moves it a week, once, and it’s kept', () => {
    const seed = seedWhere('agent-v7', (d) => d(1, 'interest') < SURE.meet);
    const prepared = () => { const { sim } = referredGraduate(seed); reel(sim); tended(sim, at(2026, 9, 4, 10)); sim.must({ kind: 'pro.send_materials', payload: {} }); return sim; };
    let sim = prepared();
    tended(sim, at(2026, 9, 18, 12));
    sim = cross(sim);
    const m = rel(sim).meeting!;
    expect(m).toMatchObject({ at: at(2026, 9, 25, 11), where: 'office', status: 'set' });
    const item = sim.universe.scheduled.find((i) => i.kind === MEETING_KIND && i.status === 'pending')!;
    expect(item).toMatchObject({ requiresPlayer: true, travelMinutes: 120, durationMinutes: 60, locationId: 'us-ny-newyork', category: 'career', label: 'Meeting At Stewart Talent' });
    expect(notices(sim).at(-1)).toBe('Jordan Parente’s Office Asked To Meet You: Jordan Parente’s office at Stewart Talent has asked to meet you: Friday, September 25, 2026 at 11:00 AM, at Stewart Talent’s New York office. It’s on your calendar with two hours to get there from New Haven, a time the game assumes. If you can’t make it, Ask To Move on the Representation tab moves it a week, once. Fictional: his words and decisions here are invented.');
    // Missed: asleep through it, by the player's own sleep.
    tended(sim, at(2026, 9, 25, 2));
    sim.must({ kind: 'life.sleep', payload: { hours: 12 } });
    sim = cross(sim);
    expect(rel(sim).meeting!.status).toBe('missed');
    expect(rel(sim).stage).toBe('passed');
    expect(notices(sim).at(-1)).toBe('You Missed The Meeting At Stewart Talent: You missed the meeting with Jordan Parente’s office at Stewart Talent at 11:00 AM on September 25, 2026. In the game a meeting comes before an offer, so his office closed your approach. It looks again only after a year, from September 25, 2027, and then only at something new. Fictional: his words and decisions here are invented.');
    expect(keys(sim).slice(-2)).toEqual([`meeting:${m.id}:missed`, `decision:${m.id}:passed`]);
    // The miss counts against Reliability in the decision it closed.
    expect(rel(sim).why!.factors.find((f) => f.id === 'reliability')).toMatchObject({ level: 'near', words: 'You missed one meeting.' });

    // The other life: the clock stops at the meeting, and Ask To Move there moves it a week and carries the jump on.
    let other = prepared();
    tended(other, at(2026, 9, 25, 8));
    const stop = other.advanceTo(at(2026, 9, 26, 9), { stopOnPlayerRequired: true });
    expect(stop.interruptedBy?.kind).toBe(MEETING_KIND);
    const [ask] = stopChoices(MEETING_KIND);
    expect(ask).toMatchObject({ label: 'Ask To Move', command: 'pro.ask_to_move', then: 'carry-on' });
    const moved = answerStop(other, { item: stop.interruptedBy!, wanted: at(2026, 9, 26, 9), sentFrom: at(2026, 9, 25, 8) }, ask!);
    expect(moved.refused).toBeUndefined();
    other = cross(other);
    expect(other.now).toBe(at(2026, 9, 26, 9));
    expect(rel(other).meeting).toMatchObject({ at: at(2026, 10, 2, 11), moved: 1, status: 'set' });
    expect(rel(other).history.at(-1)!.words).toBe('You asked to move the meeting from September 25, 2026 at 11:00 AM, and his office moved it to October 2, 2026 at 11:00 AM.');
    // Once: a second ask is refused, and the stop stays open.
    const again = other.advanceTo(at(2026, 10, 3, 9), { stopOnPlayerRequired: true });
    expect(again.interruptedBy?.kind).toBe(MEETING_KIND);
    expect(answerStop(other, { item: again.interruptedBy!, wanted: at(2026, 10, 3, 9), sentFrom: other.now }, ask!).refused).toBe('You moved this meeting once already. In the game his office moves a meeting once, and it stays on October 2, 2026 at 11:00 AM.');
    // Go: kept.
    answerStop(other, { item: again.interruptedBy!, wanted: at(2026, 10, 3, 9), sentFrom: other.now }, 'go');
    other = cross(other);
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
    const sim = cross(offered());
    expect(rel(sim).stage).toBe('offered');
    const a = sim.player.pro!.agreements[0]!;
    expect(a).toMatchObject({ agentId: AGENT.id, status: 'offered', offeredAt: at(2026, 9, 30, 10), standsUntil: at(2026, 10, 14, 10) });
    // Every term, with its basis, copied in when offered.
    expect(a.terms.map((t) => [t.id, t.basis])).toEqual(AGREEMENT_TERMS.map((t) => [t.id, t.basis]));
    expect(a.terms.map((t) => t.id)).toEqual(['scope', 'territory', 'excluded', 'exclusivity', 'commission', 'scale-plus-ten', 'duration', 'responsibilities', 'actor', 'payment', 'termination', 'continuing', 'offer']);
    expect(notices(sim).at(-1)).toBe('Jordan Parente Offered You Representation: Jordan Parente has offered to represent you at Stewart Talent: an agreement for one year. Every term is under The Agreement on the Career screen’s Representation tab, each marked as a published rule or the game’s own. The offer stands until October 14, 2026. Fictional: his words and decisions here are invented.');
    expect(activeAgreement(sim.player, sim.now)).toBeUndefined();
    // Why It Went This Way keeps the chance the offer was drawn against, an offer's, not a meeting's.
    expect(rel(sim).why).toMatchObject({ step: 'decision', outcome: 'offer' });
    expect(rel(sim).why!.chance).toBe(interestOf(sim, sim.player, AGENT, rel(sim).why!.at).offerChance);
    expect(rel(sim).why!.chance).not.toBe(interestOf(sim, sim.player, AGENT, rel(sim).why!.at).chance);
    let back = reload(sim);
    back.must({ kind: 'pro.accept_agreement', payload: {} });
    back = cross(back);
    const signed = back.player.pro!.agreements[0]!;
    expect(signed).toMatchObject({ status: 'accepted', signedAt: back.now, endsAt: at(2027, 9, 30, 12) });
    expect(rel(back)).toMatchObject({ stage: 'represented', agreementId: signed.id });
    expect(activeAgreement(back.player, back.now)?.id).toBe(signed.id);
    expect(run(back, 'pro.accept_agreement').error).toBe('He hasn’t offered you an agreement.');
    expect(run(back, 'pro.send_materials').error).toBe('Jordan Parente represents you already.');
    // The other life: declined, and held six months.
    let other = offered();
    other.must({ kind: 'pro.decline_agreement', payload: {} });
    other = cross(other);
    expect(other.player.pro!.agreements[0]!.status).toBe('declined');
    expect(rel(other).stage).toBe('declined');
    expect(sendRefusal(other, other.player, AGENT)).toBe('You declined his offer on September 30, 2026. In the game his office looks again only after six months, from March 31, 2027, and then only at something new.');
    expect(activeAgreement(other.player, other.now)).toBeUndefined();
    // A third: unanswered for fourteen days, it lapses.
    let third = offered();
    tended(third, at(2026, 10, 14, 12));
    third = cross(third);
    expect(third.player.pro!.agreements[0]!.status).toBe('lapsed');
    expect(notices(third).at(-1)).toBe('Jordan Parente’s Offer Lapsed: The agreement Jordan Parente offered stood until today, and it lapsed unanswered. In the game his office looks again only after six months, from April 14, 2027, and then only at something new. Fictional: his words and decisions here are invented.');
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
    expect(notices(sim).at(-1)).toBe('Your Agreement With Jordan Parente Ended: Your agreement with Jordan Parente at Stewart Talent ended on September 30, 2027, at the end of its year. No pay is still to come from contracts you made while it ran, so no commission is still owed on them. An offer he passed on while it ran that you accept within 60 days after it ended owes commission too. Fictional: his words and decisions here are invented.');
    expect(cross(sim).player.pro!.agreements[0]).toEqual(agreement);
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
    expect(cross(sim).player.pro!.agreements[0]).toEqual(agreement);
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
    cross(sim);
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
    cross(other);
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
    // From the work loop's merge (2026-10-21) the year represented also notes the roles he handled (`opp:` keys, G5's
    // opportunities handled), so the history rolls past its cap and the relationship's first steps leave the list; each
    // is still counted once. Until then this asserted the ten steps as the whole history.
    const steps = ['discovered', 'checked', 'referred', 'sent', 'meeting-set', 'meeting-kept', 'offer', 'accepted', 'represented', 'ended'] as const;
    for (const k of steps) expect(rel(reloaded).counts[k], k).toBe(1);
    expect(h.length).toBeLessThanOrEqual(HISTORY_KEPT);
    expect(h.filter((e) => !e.key?.startsWith('opp:')).map((e) => e.kind).at(-1)).toBe('ended');
    expect(new Set(h.map((e) => e.key)).size).toBe(h.length);
    expect(new Set(h.map((e) => e.id)).size).toBe(h.length);
    expect(h).toEqual(rel(straight).history);
    expect(rel(reloaded).counts).toEqual(rel(straight).counts);
    expect(notices(reloaded)).toEqual(notices(straight));
    expect(breaches(reloaded.universe)).toEqual([]);
  });
});

describe('A2: representation while enrolled', () => {
  it('PLAYER JOURNEY: a first-year introduced, met and signed is still enrolled in good standing, and permission to work says exactly what it said before', () => {
    const seed = seedWhere('agent-a2', (d) => d(1, 'interest') < SURE.meet && d(1, 'offer') < SURE.offer);
    let sim = student(seed);
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
    sim = cross(sim);
    expect(rel(sim).stage).toBe('represented');
    expect(sim.player.school!.standing).toBe('good');
    expect(sim.player.school!.endedAt).toBeUndefined();
    expect(usWorkAuthorized(sim.player, sim.now)).toBe(before.authorized);
    expect(eligibilityOf(sim.player, sim.now)).toEqual(before.eligibility);
    expect(sim.universe.scheduled.some((i) => i.kind.startsWith('school.') && i.status === 'pending')).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('nothing from him arrives unasked', () => {
  it('GUARD: a life that never approaches him hears nothing from him in a term; in a played approach each notice of his comes after the player’s own send and carries the fictional line', () => {
    const quiet = student('agent-quiet');
    tended(quiet, at(2026, 12, 1, 12));
    expect(notices(quiet)).toEqual([]);
    expect(relationOf(quiet.player, AGENT.id)).toBeUndefined();
    expect(quiet.universe.scheduled.some((i) => i.kind.startsWith('pro.agent_'))).toBe(false);
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
