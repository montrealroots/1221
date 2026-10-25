/**
 * Brief 27, representation (2026-10-25): Part 6's "Scope, territory, medium, exclusivity, term, and commission ...
 * Negotiation", Part 7's "Voice samples", and the supplement's loops 7 to 9 ("A role or representative requires
 * materials"; "review scope, term, commission, exclusivity, and obligations → negotiate where supported"; "Active
 * representative monitors suitable opportunities → submits"). `systems/representation.ts`.
 *
 * Held here: the actor's one ask for different terms on an offered agreement, answered by the office two days on at a
 * chance that reads how keen it is, the terms kept as versions and read by when the agreement ends, by the commission and
 * by which parts the agent submits the actor for; Halberd Talent's voice-over department, whose office asks for a voice
 * demo, weighs it as a legit office weighs a reel, offers an agreement for voice-over and puts the actor up for voice
 * parts; and an introduction at a festival, read by the approach as a referral is.
 *
 * PLAYER JOURNEYS: a graduate's life (tests/fakes/b20-career.ts), played by the clock and the commands a player sends,
 * each falsifiability twin the same save opened again (`twin`) with one input changed. TEST SETUP, said where it's done:
 * a finished job and its credit (`finishedJob`, as the work loop leaves one, and for a voice part the credit's `voice`
 * mark the work loop gives it); a booked engagement written as the work loop writes one, for the commission; the Sundance
 * entry the awards' system leaves on the record, for the festival introduction its own system will call. Each life's seed
 * is found by reading the game's own draws (`seedFor`): every outcome is the game's, decided by its rules on the facts;
 * the seed chooses which of the draw's answers a journey meets.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR, addDays, dateKey } from '@/engine/core/time';
import { rngFor } from '@/engine/core/rng';
import type { Simulation } from '@/engine/core/simulation';
import { AGENTS, agentById, type Agent } from '@/engine/content/agents';
import { AGREEMENT, AGREEMENT_TERMS, projectById, type ProjectTemplate } from '@/engine/content/careerwork';
import { BRIEFS } from '@/engine/content/briefs';
import { MARKETS } from '@/engine/content/slate';
import { CITIES } from '@/engine/content/geography';
import { addCredit, currentOf, type Agreement, type Engagement } from '@/engine/systems/pro';
import { GATE, caseKeys, interestOf, relationOf, sendRefusal, signRefusal } from '@/engine/systems/proagent';
import {
  TERMS, askChance, askRefusal, coveredUnder, dealOf, introduceAtFestival, submitsFor, termsChance, termsFor,
} from '@/engine/systems/representation';
import { commissionOn } from '@/engine/systems/propay';
import { DIRECT, askMoreRefusal, payTermsOf, postingTimes, postingsAt, reachOf } from '@/engine/systems/projobs';
import { keepProject, productionsOf } from '@/engine/systems/slate';
import { voiceOnly } from '@/engine/systems/workflow';
import { AGENT, SURE, at, finishedJob, graduate, played, portfolio, reel, represent, twin, zone } from './fakes/b20-career';
import { booked } from './fakes/career-work';
import { GUIDE_BY_ID } from '@/engine/content/guide';

const PERSON = 'person_000001';
const CELIA = agentById('celia-brannock')!;
const PATACK = agentById('dan-patack')!;
const VOICE_BRIEF = BRIEFS.find((b) => b.medium === 'voice')!;

/** The game's own draw for an approach's step to an agent's office, read for a seed as the game reads it (`drawOf`). */
const approachDraw = (seed: string, agent: Agent, n: number, step: 'interest' | 'offer') => rngFor(seed, 'pro.agent', PERSON, agent.id, `approach-${n}`, step).next();
/** The game's own draw for an ask's answer on an agreement, read as the game reads it (`termsDraw`). */
const termsDraw = (seed: string, agent: Agent, agreementId: string) => rngFor(seed, 'pro.agent_terms', PERSON, agent.id, agreementId).next();
/** TEST SETUP: the first seed of a prefix whose draws fall where a journey needs them. */
function seedFor(prefix: string, ok: (seed: string) => boolean): string {
  for (let i = 0; i < 20_000; i += 1) if (ok(`${prefix}-${i}`)) return `${prefix}-${i}`;
  throw new Error(`No seed for ${prefix}`);
}
/** Draws under these take an approach to a meeting and an offer whatever the room on the list (tests/journey-agent.test.ts). */
const offers = (seed: string, agent: Agent) => approachDraw(seed, agent, 1, 'interest') < SURE.meet && approachDraw(seed, agent, 1, 'offer') < SURE.offer;

const rel = (sim: Simulation, agent: Agent = AGENT) => relationOf(sim.player, agent.id)!;
const offered = (sim: Simulation, agent: Agent = AGENT): Agreement => sim.player.pro!.agreements.find((a) => a.agentId === agent.id && a.status === 'offered')!;
const notices = (sim: Simulation) => sim.universe.notifications.filter((n) => n.refType === 'pro-agent').map((n) => `${n.title}: ${n.body}`);
const days = (from: number, to: number) => Math.round((to - from) / MS_DAY);

/**
 * An agent's offer, reached as a player reaches it: the notice read, headshots and a résumé, a finished job judged Strong
 * and its referral, a reel, the materials sent, and the clock played on through the answer, the meeting kept and the
 * decision. For Thomas Ashgrove the offer comes on September 30, 2026.
 */
function offeredBy(seed: string, agent: Agent = AGENT): Simulation {
  const sim = graduate(seed);
  sim.must({ kind: 'pro.agent_notice', payload: { agentId: agent.id } });
  portfolio(sim);
  const job = finishedJob(sim, 'strong');
  sim.must({ kind: 'pro.update_resume', payload: {} });
  sim.must({ kind: 'pro.agent_check', payload: { agentId: agent.id } });
  sim.must({ kind: 'pro.ask_referral', payload: { agentId: agent.id, engagementId: job.id } });
  reel(sim);
  sim.must({ kind: 'pro.send_materials', payload: { agentId: agent.id } });
  for (let k = 0; k < 60 && rel(sim, agent).stage !== 'offered'; k += 1) played(sim, sim.now + MS_DAY);
  expect(rel(sim, agent).stage).toBe('offered');
  return sim;
}

/**
 * TEST SETUP: the first life of a prefix offered an agreement whose ask's draw, read with the agreement's own id as the game
 * reads it, falls where a journey needs it: under every chance, an office that agrees to any ask; over every chance, one
 * that keeps its terms.
 */
function lifeWhere(prefix: string, ok: (u: number) => boolean): Simulation {
  for (let i = 0; i < 20_000; i += 1) {
    const seed = `${prefix}-${i}`;
    if (!offers(seed, AGENT)) continue;
    const sim = offeredBy(seed);
    if (ok(termsDraw(seed, AGENT, offered(sim).id))) return sim;
  }
  throw new Error(`No life for ${prefix}`);
}

/** The offer in a life whose office agrees to any ask, played once and opened again for each journey (`twin`), as Continue opens a save. */
let yesLife: Simulation | undefined;
const yes = (): Simulation => twin(yesLife ??= lifeWhere('rep-yes', (u) => u < TERMS.least));

/** The ask, through its command, and the clock played on past its answer. */
function asked(sim: Simulation, ask: 'shorter' | 'voice' | 'abroad', agent: Agent = AGENT): { answerAt: number; chance: number } {
  const r = sim.must<{ answerAt: number; chance: number }>({ kind: 'pro.ask_terms', payload: { agentId: agent.id, ask } });
  played(sim, r.answerAt + MS_HOUR);
  return r;
}

describe('asking for different terms (Part 6, loop 8)', () => {
  it('PLAYER JOURNEY: a shorter term asked for and agreed two days on: the terms say six months, the first version kept, and it ends six months after signing, said; the twin who didn’t ask is held a year', () => {
    const sim = yes();
    const a = offered(sim);
    // As offered: a legit department's work in the US for a year, the words `AGREEMENT_TERMS` has always had.
    expect(a.deal!.versions).toEqual([{ version: 1, at: at(2026, 9, 30, 10), scope: ['legit'], territory: ['us'], termDays: AGREEMENT.termDays, how: 'offered' }]);
    expect(a.terms).toEqual(AGREEMENT_TERMS);
    // The chance is said before the ask: the shorter term's, read from the factors at the bar as things stand.
    const chance = askChance(sim, sim.player, AGENT, 'shorter');
    expect(chance).toBe(termsChance('shorter', interestOf(sim, sim.player, AGENT, sim.now).atOrBeyond, GATE));
    const r = sim.must<{ answerAt: number; chance: number }>({ kind: 'pro.ask_terms', payload: { ask: 'shorter' } });
    expect([r.answerAt, r.chance]).toEqual([at(2026, 10, 2, 10), chance]);
    expect(rel(sim).history.at(-1)!.words).toBe('You asked his office for a term of six months instead of one year in the agreement it offered.');
    // While it's unanswered: no accepting it, and no second ask, each refused in words.
    expect(signRefusal(sim, sim.player, AGENT)).toBe('You asked his office for a term of six months instead of one year on September 30, 2026, and it answers on Friday, October 2, 2026 at 10:00 AM. You can accept the agreement once it has, as it stands then.');
    expect(sim.execute({ kind: 'pro.accept_agreement', payload: {} }).error).toBe(signRefusal(sim, sim.player, AGENT));
    expect(sim.execute({ kind: 'pro.ask_terms', payload: { ask: 'voice' } }).error).toBe('You asked for a term of six months instead of one year on September 30, 2026. His office answers on Friday, October 2, 2026 at 10:00 AM.');
    // A save and a load while it waits: the answer still comes, at its time.
    const back = twin(sim);
    played(back, r.answerAt + MS_HOUR);
    const agreed = offered(back);
    expect(agreed.ask).toMatchObject({ what: 'shorter', answer: 'agreed', answeredAt: at(2026, 10, 2, 10) });
    expect(agreed.deal!.versions.map((v) => [v.version, v.termDays, v.how])).toEqual([[1, 365, 'offered'], [2, TERMS.shorterDays, 'agreed']]);
    expect(agreed.terms.find((t) => t.id === 'duration')!.words).toBe('Six months from the day you sign it, the shorter term you asked for.');
    expect(agreed.terms.find((t) => t.id === 'termination')!.words).toMatch(/Otherwise it ends when its six months are up\.$/);
    expect(notices(back).at(-1)).toBe('Thomas Ashgrove’s Office Agreed To Your Ask: Thomas Ashgrove’s office at Halberd Talent agreed to a term of six months instead of one year, and The Agreement on the Representation tab now says so. The offer stands until October 14, 2026: accept it or decline it there.');
    expect(back.execute({ kind: 'pro.ask_terms', payload: { ask: 'abroad' } }).error).toBe('You asked once already, on September 30, 2026, for a term of six months instead of one year, and his office agreed. In the game you ask once.');
    // Accepted, it runs the six months its terms say, and ends then on its own, said.
    back.must({ kind: 'pro.accept_agreement', payload: {} });
    const signed = back.player.pro!.agreements.find((x) => x.id === agreed.id)!;
    expect(signed.endsAt).toBe(addDays(signed.signedAt!, TERMS.shorterDays, zone));
    played(back, signed.endsAt! + MS_HOUR);
    expect(signed).toMatchObject({ status: 'ended', endedHow: 'term' });
    expect(notices(back).find((n) => n.startsWith('Your Agreement With Thomas Ashgrove Ended'))).toBe('Your Agreement With Thomas Ashgrove Ended: Your agreement with Thomas Ashgrove at Halberd Talent ended on April 2, 2027, at the end of its six months. No pay is still to come from contracts you made while it ran, so no commission is still owed on them. An offer he passed on while it ran that you accept within 60 days after it ended owes commission too.');
    // THE TWIN: the same offer, accepted at the same moment without the ask, runs a year.
    const other = yes();
    played(other, r.answerAt + MS_HOUR);
    other.must({ kind: 'pro.accept_agreement', payload: {} });
    const year = other.player.pro!.agreements.find((x) => x.id === agreed.id)!;
    expect(year.signedAt).toBe(signed.signedAt);
    expect(year.endsAt).toBe(addDays(year.signedAt!, AGREEMENT.termDays, zone));
    expect(days(signed.endsAt!, year.endsAt!)).toBeGreaterThan(180);
  }, 300_000);

  it('PLAYER JOURNEY: the same ask in a life whose office keeps its terms: the terms stay as offered, said, the one ask spent, and it runs a year', () => {
    const sim = lifeWhere('rep-no', (u) => u >= TERMS.most);
    asked(sim, 'shorter');
    const a = offered(sim);
    expect(a.ask).toMatchObject({ what: 'shorter', answer: 'kept' });
    expect(a.deal!.versions).toHaveLength(1);
    expect(a.terms).toEqual(AGREEMENT_TERMS);
    expect(rel(sim).history.at(-1)!.words).toBe('His office kept the terms as offered, without a term of six months instead of one year.');
    expect(notices(sim).at(-1)).toBe('Thomas Ashgrove’s Office Kept Its Terms: Thomas Ashgrove’s office at Halberd Talent kept the agreement’s terms as it offered them, without a term of six months instead of one year. The offer stands until October 14, 2026: accept it or decline it there.');
    expect(sim.execute({ kind: 'pro.ask_terms', payload: { ask: 'voice' } }).error).toBe('You asked once already, on September 30, 2026, for a term of six months instead of one year, and his office kept the terms as offered. In the game you ask once.');
    sim.must({ kind: 'pro.accept_agreement', payload: {} });
    const signed = sim.player.pro!.agreements[0]!;
    expect(signed.endsAt).toBe(addDays(signed.signedAt!, AGREEMENT.termDays, zone));
  }, 300_000);

  it('reads how keen the office is: each factor at the bar or beyond above the gate raises the chance a tenth, never past the most or under the least', () => {
    expect(termsChance('shorter', GATE, GATE)).toBe(TERMS.base.shorter);
    expect(termsChance('shorter', GATE + 2, GATE)).toBe(0.7);
    expect(termsChance('voice', GATE - 1, GATE)).toBe(0.5);
    expect(termsChance('abroad', 0, GATE)).toBe(TERMS.least);
    expect(termsChance('voice', 7, GATE)).toBe(TERMS.most);
    // On a played record: a missed meeting since would count against reliability, and the chance falls with it.
    const sim = yes();
    const before = askChance(sim, sim.player, AGENT, 'abroad');
    rel(sim).counts['meeting-missed'] = 2;
    expect(askChance(sim, sim.player, AGENT, 'abroad')).toBeLessThan(before);
  }, 300_000);

  it('refuses an ask with no offer, one too late for its answer, voice-over where it’s covered already or the agency has no department for it, and work abroad for voice work, each in words', () => {
    const sim = yes();
    // Too late: the answer would come after the offer lapses.
    const late = twin(sim);
    played(late, at(2026, 10, 12, 12));
    expect(late.execute({ kind: 'pro.ask_terms', payload: { ask: 'shorter' } }).error).toBe('The offer stands until October 14, 2026, and an answer takes two days, so there’s no time left to ask.');
    // No offer once it's accepted.
    sim.must({ kind: 'pro.accept_agreement', payload: {} });
    expect(sim.execute({ kind: 'pro.ask_terms', payload: { ask: 'shorter' } }).error).toBe('He hasn’t offered you an agreement.');
    expect(sim.execute({ kind: 'pro.ask_terms', payload: { ask: 'raise' } }).error).toBe('Ask for a shorter term, for voice-over or for work abroad.');
    // A real agent's office has no voice-over department the game knows of.
    const patack = offeredBy(seedFor('rep-patack', (s) => offers(s, PATACK)), PATACK);
    expect(askRefusal(patack, patack.player, PATACK, 'voice')).toBe('The game knows of no voice-over department at Stewart Talent’s New York office, since the pages it read name none, so voice-over can’t be added to this agreement.');
    expect(askRefusal(patack, patack.player, PATACK, 'abroad')).toBeUndefined();
  }, 300_000);
});

describe('what the terms cover, read by the commission and the agent’s submissions', () => {
  it('PLAYER JOURNEY: work abroad added: a London feature comes through the agent and its pay carries commission; in the twin that didn’t ask, it comes open and carries none', () => {
    const abroad = yes();
    asked(abroad, 'abroad');
    abroad.must({ kind: 'pro.accept_agreement', payload: {} });
    const home = yes();
    played(home, at(2026, 10, 2, 11));
    home.must({ kind: 'pro.accept_agreement', payload: {} });
    const withAbroad = abroad.player.pro!.agreements[0]!;
    const without = home.player.pro!.agreements[0]!;
    expect(dealOf(withAbroad).territory).toEqual(['us', 'uk', 'au']);
    expect(withAbroad.terms.find((t) => t.id === 'territory')!.words).toBe('Work anywhere in the United States, and in the UK and Australia, where the game has work abroad.');
    // A feature the slate makes in London, as the slate makes it.
    const london = firstPart(abroad, (t) => t.place.cityId === 'uk-eng-london' && t.access.agent);
    expect([reachOf(london, withAbroad), reachOf(london, without)]).toEqual(['agent', 'open']);
    expect([submitsFor(withAbroad, london), submitsFor(without, london)]).toEqual([true, false]);
    // TEST SETUP: the same booking under each, its pay promised, as the work loop writes one.
    const paid = (sim: Simulation, a: Agreement) => { const e = bookedUnder(sim, london, a); return commissionOn(sim, sim.player, e, e.pay[0]!, 9_000_00); };
    expect(paid(abroad, withAbroad)).toMatchObject({ how: 'term', rule: 'sag', amount: 900_00 });
    expect(paid(home, without)).toMatchObject({ how: 'uncovered', amount: 0, words: 'No commission: your agreement with Halberd Talent covers stage, film and television work in the US, and this isn’t that.' });
  }, 300_000);

  it(`career.agreement-terms > career.commission: “${GUIDE_BY_ID['career.agreement-terms']!.connections.find((c) => c.to === 'career.commission')!.why}”`, () => {
    const added = yes();
    asked(added, 'voice');
    added.must({ kind: 'pro.accept_agreement', payload: {} });
    const left = yes();
    played(left, at(2026, 10, 2, 11));
    left.must({ kind: 'pro.accept_agreement', payload: {} });
    const dub = projectById('salt-road')!;
    const owed = (sim: Simulation) => { const e = bookedUnder(sim, dub, sim.player.pro!.agreements[0]!); return commissionOn(sim, sim.player, e, e.pay[0]!, 9_000_00).amount; };
    expect([owed(added), owed(left)]).toEqual([900_00, 0]);
  }, 300_000);

  it('holds the abroad it adds to the markets the game makes work in abroad', () => {
    const abroadMarkets = [...new Set(MARKETS.map((m) => CITIES.get(m.cityId)!.countryId).filter((c) => c !== 'us'))].sort();
    expect([...TERMS.abroad].sort()).toEqual(abroadMarkets);
  });

  it('PLAYER JOURNEY: voice-over added at Halberd Talent: its voice-over department puts the actor up for a voice part, sending the voice demo, and the pay carries commission; the twin without it meets the same part open', () => {
    const voice = yes();
    asked(voice, 'voice');
    voice.must({ kind: 'pro.accept_agreement', payload: {} });
    const home = yes();
    played(home, at(2026, 10, 2, 11));
    home.must({ kind: 'pro.accept_agreement', payload: {} });
    const withVoice = voice.player.pro!.agreements[0]!;
    const without = home.player.pro!.agreements[0]!;
    expect(dealOf(withVoice).scope).toEqual(['legit', 'voice']);
    expect(withVoice.terms.find((t) => t.id === 'scope')!.words).toBe('Stage, film and television work, and voice-over work: animation, dubbing and narration, which the agency’s voice-over department handles.');
    expect(withVoice.terms.find((t) => t.id === 'excluded')!.words).toBe('Commercials aren’t covered. An agency usually handles them in another department.');
    const lantern = projectById('lantern-row')!;
    expect([reachOf(lantern, withVoice), reachOf(lantern, without)]).toEqual(['agent', 'open']);
    // On-camera work stays the agent's in both.
    const calloway = projectById('calloway-files')!;
    expect([reachOf(calloway, withVoice), reachOf(calloway, without)]).toEqual(['agent', 'agent']);
    const pay = (sim: Simulation, a: Agreement) => { const e = bookedUnder(sim, lantern, a); return commissionOn(sim, sim.player, e, e.pay[0]!, 9_000_00); };
    expect(pay(voice, withVoice)).toMatchObject({ how: 'term', rule: 'sag', amount: 900_00 });
    expect(pay(home, without)).toMatchObject({ how: 'uncovered', amount: 0, words: 'No commission: your agreement with Halberd Talent leaves out voice-over work, and this is that.' });
    // The voice demo a submission sends, mixed from a voice brief's take by the Portfolio tab's command.
    demo(voice);
    // The agency's submission for a slate voice part, at the Monday it's posted, played by the clock.
    const o = waitForPosting(voice, (t) => voiceOnly(t));
    expect(o.via).toBe('agent');
    expect(o.history.find((h) => h.kind === 'submitted')!.words).toMatch(/^Thomas Ashgrove submitted you for .+, sending your headshots from .+, your résumé from .+ and your voice demo from .+\.$/);
    expect(o.sent!.map((m) => m.kind)).toEqual(['headshot', 'resume', 'demo']);
    expect(o.sent!.find((m) => m.kind === 'demo')!.id).toBe(currentOf(voice.player.pro, 'demo')!.id);
  }, 600_000);
});

describe('the offers an agent handles, by what the agreement covers', () => {
  it('PLAYER JOURNEY: a voice part offered without an audition while the agreement leaves voice-over out: the actor’s own, at scale, with no ask for more; with voice-over covered, a voice part from the same office comes through the agent at scale plus ten', () => {
    // TEST SETUP: represented by Thomas Ashgrove under an agreement as the agent's builder writes one: his first terms.
    const legit = graduate('rep-offers');
    represent(legit);
    const own = directVoiceOffer(legit, 'open');
    const scale = payTermsOf(own).each!;
    expect([own.via, own.agreementId, own.offer!.amount]).toEqual(['open', undefined, scale]);
    expect(askMoreRefusal(legit, legit.player, own)).toBe('Thomas Ashgrove doesn’t negotiate this one: your agreement with Halberd Talent leaves out voice-over work, and this is that, so the offer is as it stands.');
    // THE TWIN: the same life with voice-over covered (TEST SETUP: the agreement's terms as the office's agreement to the ask leaves them).
    const voiced = graduate('rep-offers');
    const a = represent(voiced);
    a.deal = { versions: [{ version: 1, at: a.offeredAt, scope: ['legit'], territory: ['us'], termDays: 365, how: 'offered' }, { version: 2, at: a.offeredAt, scope: ['legit', 'voice'], territory: ['us'], termDays: 365, how: 'agreed', ask: 'voice' }] };
    const through = directVoiceOffer(voiced, 'agent');
    expect([through.via, through.agreementId]).toEqual(['agent', a.id]);
    expect(through.offer!.amount).toBe(Math.round(payTermsOf(through).each! * 1.1));
    expect(askMoreRefusal(voiced, voiced.player, through)).toBeUndefined();
  }, 300_000);
});

describe('Halberd Talent’s voice-over department (Part 6 medium, Part 7 voice samples, loop 7)', () => {
  it('PLAYER JOURNEY: Celia Brannock’s office, reached by a referral from a voice job, asks for the voice demo no legit office asks for, hears it, and offers an agreement for voice-over that puts the actor up for voice parts and not on-camera ones', () => {
    const seed = seedFor('rep-celia', (s) => offers(s, CELIA));
    const sim = graduate(seed);
    expect(CELIA.notice).toBe('Celia Brannock and Halberd Talent are invented for the game. She’s an agent in its voice-over department, for animation, dubbing and narration. Her office takes no submissions it hasn’t asked for: it hears your voice demo only through a referral from someone you’ve worked with. She never gets in touch first.');
    sim.must({ kind: 'pro.agent_notice', payload: { agentId: CELIA.id } });
    portfolio(sim);
    const job = finishedVoiceJob(sim);
    sim.must({ kind: 'pro.update_resume', payload: {} });
    // Unsolicited, refused in her office's own words.
    sim.must({ kind: 'pro.agent_check', payload: { agentId: CELIA.id } });
    expect(rel(sim, CELIA).history.at(-1)!.words).toBe('You checked your materials for an approach: headshots and a résumé were there, and you had no voice demo.');
    expect(sendRefusal(sim, sim.player, CELIA)).toBe('Her office takes no submissions it hasn’t asked for. It sees your materials only through a referral from someone you’ve worked with.');
    sim.must({ kind: 'pro.ask_referral', payload: { agentId: CELIA.id, engagementId: job.id } });
    sim.must({ kind: 'pro.send_materials', payload: { agentId: CELIA.id } });
    expect(rel(sim, CELIA).history.at(-1)!.words).toBe('You sent your headshots and your résumé to her office, on Hollis Reed Casting’s referral.');
    for (let k = 0; k < 20 && rel(sim, CELIA).stage === 'sent'; k += 1) played(sim, sim.now + MS_DAY);
    // Her office asks for the voice demo, the material a legit office never asks for.
    expect(rel(sim, CELIA).stage).toBe('requested');
    expect(rel(sim, CELIA).request!.what).toEqual(['demo']);
    expect(sim.execute({ kind: 'pro.supply_material', payload: { agentId: CELIA.id } }).error).toBe('You haven’t mixed a voice demo yet. Mix A Voice Demo is on the Portfolio tab.');
    const waiting = twin(sim);
    // Heard as a reel is seen: the demo's band is the work she has to go on; Thomas Ashgrove's office, which sees a reel,
    // reads the same record unchanged by it.
    const herBefore = interestOf(sim, sim.player, CELIA, sim.now).factors.find((f) => f.id === 'work')!;
    const hisBefore = interestOf(sim, sim.player, AGENT, sim.now).factors.find((f) => f.id === 'work')!;
    demo(sim);
    const herAfter = interestOf(sim, sim.player, CELIA, sim.now).factors.find((f) => f.id === 'work')!;
    expect(herBefore.words).not.toContain('your voice demo');
    expect(herAfter.words).toContain('your voice demo, at best');
    expect(interestOf(sim, sim.player, AGENT, sim.now).factors.find((f) => f.id === 'work')!).toEqual(hisBefore);
    expect(interestOf(sim, sim.player, CELIA, sim.now).factors.find((f) => f.id === 'relevance')).toMatchObject({ label: 'Voice Work', level: 'beyond' });
    expect(interestOf(sim, sim.player, CELIA, sim.now).factors.find((f) => f.id === 'fit')).toMatchObject({ label: 'Fit With Her Department', level: 'beyond' });
    sim.must({ kind: 'pro.supply_material', payload: { agentId: CELIA.id } });
    for (let k = 0; k < 40 && rel(sim, CELIA).stage !== 'offered'; k += 1) played(sim, sim.now + MS_DAY);
    expect(rel(sim, CELIA).stage).toBe('offered');
    const a = offered(sim, CELIA);
    expect(dealOf(a)).toMatchObject({ scope: ['voice'], territory: ['us'], termDays: 365 });
    expect(a.terms.find((t) => t.id === 'scope')!.words).toBe('Voice-over work: animation, dubbing and narration, the work the agent’s department covers.');
    expect(a.terms.find((t) => t.id === 'excluded')!.words).toBe('Stage, film and television work on camera, and commercials, aren’t covered. The agency handles them in its other departments.');
    expect(askRefusal(sim, sim.player, CELIA, 'voice')).toBe('It covers voice-over work already: that’s what her department does.');
    expect(askRefusal(sim, sim.player, CELIA, 'abroad')).toBe('The game has no voice work abroad, so there’s nothing abroad for her office to cover.');
    sim.must({ kind: 'pro.accept_agreement', payload: { agentId: CELIA.id } });
    const hers = sim.player.pro!.agreements.find((x) => x.agentId === CELIA.id)!;
    // Her agreement puts the actor up for voice parts, and leaves on-camera work agent-only parts unreached.
    expect(reachOf(projectById('lantern-row')!, hers)).toBe('agent');
    expect(reachOf(projectById('calloway-files')!, hers)).toBeUndefined();
    expect(coveredUnder(hers, projectById('gull-season')!)).toBe(false);
    // THE TWIN: the life that never mixed a demo lets the request's date pass, and her office notes it didn't come and
    // decides on what it had, its reliability counting it against the actor.
    const due = rel(waiting, CELIA).request!.by;
    played(waiting, due + MS_HOUR);
    expect(waiting.player.pro!.materials.some((m) => m.kind === 'demo')).toBe(false);
    expect(rel(waiting, CELIA).history.find((e) => e.kind === 'request-missed')!.words).toMatch(/^What her office asked for by .+ didn’t come: a voice demo\.$/);
    expect(interestOf(waiting, waiting.player, CELIA, waiting.now).factors.find((f) => f.id === 'reliability')!.level).toBe('near');
    expect(rel(sim, CELIA).history.some((e) => e.kind === 'request-missed')).toBe(false);
  }, 300_000);
});

describe('an introduction at a festival (AgentRoute festival)', () => {
  it('PLAYER JOURNEY: met at Sundance where the film screened: the office’s introduction opens the send its policy refused, the film is work it has to go on and something new; once an entry; the twin not introduced is still refused', () => {
    const sim = graduate('rep-festival');
    sim.must({ kind: 'pro.agent_notice', payload: {} });
    portfolio(sim);
    sim.must({ kind: 'pro.agent_check', payload: {} });
    expect(sendRefusal(sim, sim.player, AGENT)).toBe('His office takes no submissions it hasn’t asked for. It sees your materials only through the School’s follow-up after the showcase, a referral from someone you’ve worked with or an introduction at a festival where your film screens.');
    const entry = sundanceEntry(sim, 'screened');
    const unseen = twin(sim);
    // As the festival's system will call it, when the player attends the screening and does its press.
    expect(introduceAtFestival(sim, sim.player, entry.id)).toEqual([AGENT.id]);
    expect(rel(sim).via).toEqual({ route: 'festival', at: sim.now, by: 'the 2028 Sundance Film Festival' });
    expect(rel(sim).stage).toBe('introduced');
    expect(notices(sim).at(-1)).toMatch(/^Thomas Ashgrove’s Office Met You At The Festival: You met Thomas Ashgrove’s office at Halberd Talent at the 2028 Sundance Film Festival, on .+, where Last Bus To Eastview screened\. It’s an introduction: you can send it your materials from the Career screen’s Representation tab, and it has the film to go on\. In the game an agent’s office meets the actors of the films it sees at a festival\. The festival publishes its films and screenings, not who comes, so the meeting is the game’s\.$/);
    expect(interestOf(sim, sim.player, AGENT, sim.now).factors.find((f) => f.id === 'work')!.words).toContain('Last Bus To Eastview, which the 2028 Sundance Film Festival screened, at best Strong');
    expect(caseKeys(sim.player, rel(sim))).toContain(`festival:${entry.id}`);
    // Once for each entry; never a real agent, whose whereabouts the game doesn't invent, nor the voice-over office.
    expect(introduceAtFestival(sim, sim.player, entry.id)).toEqual([]);
    expect(rel(sim).festivals).toHaveLength(1);
    expect(AGENTS.filter((a) => a.id !== AGENT.id).map((a) => relationOf(sim.player, a.id))).toEqual(AGENTS.filter((a) => a.id !== AGENT.id).map(() => undefined));
    // A save and a load keep it, and the send the policy refused goes, saying how it came.
    const back = twin(sim);
    expect(sendRefusal(back, back.player, AGENT)).toBeUndefined();
    back.must({ kind: 'pro.send_materials', payload: {} });
    expect(rel(back).history.at(-1)!.words).toBe('You sent your headshots and your résumé to his office, after you met at the 2028 Sundance Film Festival.');
    // THE TWIN: the same life not introduced is still refused.
    expect(unseen.execute({ kind: 'pro.send_materials', payload: {} }).error).toBe(sendRefusal(unseen, unseen.player, AGENT));
    expect(relationOf(unseen.player, AGENT.id)!.via).toBeUndefined();
  }, 300_000);

  it('introduces no one for an entry the festival didn’t select, and changes nothing but the film it has to go on while an approach is under way', () => {
    const sim = graduate('rep-festival-held');
    sim.must({ kind: 'pro.agent_notice', payload: {} });
    portfolio(sim);
    expect(introduceAtFestival(sim, sim.player, sundanceEntry(sim, 'not-selected').id)).toEqual([]);
    expect(rel(sim).festivals).toBeUndefined();
    const job = finishedJob(sim, 'strong');
    sim.must({ kind: 'pro.update_resume', payload: {} });
    sim.must({ kind: 'pro.agent_check', payload: {} });
    sim.must({ kind: 'pro.ask_referral', payload: { engagementId: job.id } });
    sim.must({ kind: 'pro.send_materials', payload: {} });
    const entry = sundanceEntry(sim, 'screened');
    expect(introduceAtFestival(sim, sim.player, entry.id)).toEqual([]);
    expect([rel(sim).stage, rel(sim).via!.route]).toEqual(['sent', 'referral']);
    expect(rel(sim).festivals!.map((f) => f.entryId)).toEqual([entry.id]);
    expect(rel(sim).history.at(-1)!.words).toBe('You met his office at the 2028 Sundance Film Festival, where Last Bus To Eastview screened. Where you stood with it didn’t change, and it has the film to go on.');
  }, 300_000);
});

describe('an older save’s agreement', () => {
  it('reads as the words it was offered with: a legit department’s work in the US for a year, and a voice department’s voice-over', () => {
    const sim = graduate('rep-older');
    // TEST SETUP: an agreement written as the agent's builder wrote one before 2026-10-25, with no terms as versions.
    const a = represent(sim);
    expect(a.deal).toBeUndefined();
    expect(dealOf(a)).toMatchObject({ version: 1, scope: ['legit'], territory: ['us'], termDays: AGREEMENT.termDays });
    expect(termsFor(dealOf(a))).toEqual(AGREEMENT_TERMS);
    expect(dealOf({ ...a, agentId: CELIA.id }).scope).toEqual(['voice']);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------------------------------------------------

/** A voice brief taped and mixed into a voice demo, by the Player Profile's and the Portfolio tab's commands. */
function demo(sim: Simulation): void {
  sim.must({ kind: 'brief.choose', payload: { brief: VOICE_BRIEF.id, reading: VOICE_BRIEF.readings[0]!.id } });
  sim.must({ kind: 'practice.self_tape', payload: { genre: VOICE_BRIEF.kinds[0], brief: VOICE_BRIEF.id } });
  const takes = sim.player.briefs![VOICE_BRIEF.id]!.takes;
  for (let k = 0; k < 24; k += 1) {
    const r = sim.execute({ kind: 'pro.mix_demo', payload: { pieces: [`tape:${VOICE_BRIEF.id}:${takes.at(-1)!.at}`] } });
    if (r.ok) return;
    played(sim, sim.now + MS_HOUR);
  }
  throw new Error('no demo');
}

/** TEST SETUP: a voice job finished and credited, judged Strong, as the work loop leaves one (its credit marked voice). */
function finishedVoiceJob(sim: Simulation): Engagement {
  const e = finishedJob(sim, 'strong', 'lantern-row');
  sim.player.pro!.credits.find((c) => c.id === e.creditId)!.voice = true;
  return e;
}

/** TEST SETUP: a film credited and the Sundance entry the awards' system leaves for it, in a state. */
function sundanceEntry(sim: Simulation, state: 'screened' | 'not-selected') {
  const t = projectById('eastview')!;
  const credit = addCredit(sim, sim.player, { kind: 'screen', project: t.project, role: t.role.part, company: t.company, year: 2027, medium: 'film', status: 'shot', at: sim.now - MS_DAY, band: 'strong' });
  const entry = { id: sim.nextId('pro'), institution: 'sundance' as const, year: 2028, category: 'us-short' as never, creditId: credit.id, engagementId: 'none', state, noticeAt: sim.now - MS_DAY, ...(state === 'screened' ? { screenedAt: sim.now } : {}) };
  (sim.player.pro!.festivals ??= []).push(entry);
  return entry;
}

/** The first slate part, from now on, that a test needs. */
function firstPart(sim: Simulation, pick: (t: ProjectTemplate) => boolean): ProjectTemplate {
  for (let w = 1; w < 400; w += 1) for (const p of productionsOf(sim, sim.now + w * 7 * MS_DAY)) for (const t of p.parts) if (pick(t)) return t;
  throw new Error('no such part');
}

/** TEST SETUP: a booking of a part under an agreement, a week's pay promised well over scale, as the work loop writes one. */
function bookedUnder(sim: Simulation, t: ProjectTemplate, a: Agreement): Engagement {
  keepProject(sim.player, t);
  return booked(sim, { project: t.id, days: [sim.now + 30 * MS_DAY], amount: 9_000_00, per: 'week', agreementId: a.id });
}

/**
 * A slate voice part a casting office offers without an audition (`directOfferFor`), as the postings bring it: the first
 * Monday a voice part reaches the actor by `via` and its office's draw would offer it, a job for that office finished and
 * credited Strong beforehand (TEST SETUP: `finishedJob`, a part of the same office the slate makes), and the clock played to
 * that Monday, when the offer is made.
 */
function directVoiceOffer(sim: Simulation, via: 'agent' | 'open') {
  for (const monday of postingTimes(sim.now, sim.now + 150 * 7 * MS_DAY)) {
    const hit = postingsAt(sim, sim.player, monday).find((x) => x.via === via && voiceOnly(x.project) && x.project.role.size !== 'lead' && x.project.slate!.fate.kind === 'made'
      && rngFor(sim.universe.meta.seed, 'pro.direct', dateKey(monday, zone), x.project.id).next() < DIRECT.chance);
    if (!hit) continue;
    const before = firstPart(sim, (t) => t.casting === hit.project.casting && t.project !== hit.project.project);
    keepProject(sim.player, before);
    finishedJob(sim, 'strong', before.id);
    played(sim, monday + MS_HOUR);
    const o = sim.player.pro!.opportunities.find((x) => x.projectId === hit.project.id)!;
    expect([o.status, o.direct !== undefined]).toEqual(['offered', true]);
    return o;
  }
  throw new Error('no direct voice offer');
}

/** The clock played a week at a time until a part posted to the actor from now on matches, and that posting. */
function waitForPosting(sim: Simulation, match: (t: ProjectTemplate) => boolean) {
  const from = sim.now;
  for (let k = 0; k < 60; k += 1) {
    const o = sim.player.pro!.opportunities.find((x) => x.postedAt >= from && match(projectById(x.projectId)!));
    if (o) return o;
    played(sim, sim.now + 7 * MS_DAY);
  }
  throw new Error('no posting');
}
