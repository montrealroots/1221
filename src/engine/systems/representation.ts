/**
 * SLATE — what an agency agreement covers and the actor's one ask to change it, the voice department's materials, and an
 * introduction at a festival (from 2026-10-25, the owner's brief 27: Part 6, "Scope, territory, medium, exclusivity, term,
 * and commission ... Negotiation"; Part 7's "Voice samples"; the supplement's loop 7, "A role or representative requires
 * materials", and loop 8, "review scope, term, commission, exclusivity, and obligations → negotiate where supported").
 *
 * **The terms were words until then.** Every agreement copied `AGREEMENT_TERMS` and ran `AGREEMENT.termDays` from signing;
 * K3's account said they weren't negotiated "since they're the unions' regulations as read", but only the commission's cap
 * is a regulation (SAG-AFTRA's and New York's ten percent, Equity's tiers, `content/careerwork.ts`). The term, the scope,
 * the territory and what's left out are the game's (`basis: 'simulation'`), and nothing read the scope or the territory:
 * the pay's `coveredWork` held its own copy of them, and the work loop's breakdowns read only the department's fields, so
 * an agent submitted the actor for a feature in London that the agreement said it didn't cover and took no commission on.
 *
 * **Now each agreement keeps its terms as versions** (`AgreementDeal` on `Agreement.deal`): the first as offered, from the
 * agent's department (`firstDeal`), and a second where the office agrees to the actor's ask. Three things read the current
 * one (`dealOf`): when it ends (the accept's `endsAt`), the commission (`coveredUnder`, read by `commissionOn` in
 * `systems/propay.ts`, and by the clause a voice part's contract carries on it, `contractFor` in `systems/contracts.ts`)
 * and the offers its agent handles (`makeOffer`, `systems/projobs.ts`), and which parts its agent submits the actor for
 * (`submitsFor`, read by `reachOf`). The words the player reads under The Agreement are built from it (`termsFor`), so the
 * term that says it and the rule that reads it can't part. The commission's cap stays as it is: no ask can touch it.
 *
 * **The ask** (`pro.ask_terms`): once, while the agreement is offered, the actor asks for a shorter term, for voice-over to be
 * added (only where the agency has a voice department in the game), or for work abroad to be added (where the game has work
 * abroad, the UK and Australia). The office answers two days on (`TERMS_KIND`), agreeing or keeping the terms as offered, a
 * draw (decider `pro.agent_terms`) against a chance that rises with how keen the office is: how many of the factors it
 * weighs are at the bar or beyond (`interestOf`). The chance is said before the ask, as the game's. The shorter term is
 * within every maximum the research found: Equity's one-year first term (S30, Rule A) and SAG-AFTRA's eighteen months
 * (S11, a search engine's copy); neither source sets a least.
 *
 * **The voice department.** An agent in a department whose fields include voice (the game's own agency's voice-over
 * department, `content/agents.ts`) is approached with a voice demo where a legit agent sees a reel (`sampleKind`), asks for one
 * where it's missing, and weighs its band as a reel's is weighed (`systems/proagent.ts`'s `interestOf`); its agreement's
 * first scope is voice-over.
 *
 * **The festival introduction** (`introduceAtFestival`): an agent whose routes include `festival` meets the actor at a
 * festival where their film was selected and screens, an introduction the approach reads as it reads the School's
 * follow-up or a referral (`AgentRelation.via`), with the film among the work the office has to go on. The festival's own
 * system calls it when the player attends the screening and does its press; this file builds what it leads to. The
 * festival is named from the entry's own institution (`institutionById`): until the review of 2026-10-25 a call that
 * named none said Sundance, whatever festival the entry was for.
 *
 * Every figure here is the game's ASSUMPTION, said where it's defined and where a player reads it.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatDate, formatTime, formatWeekdayDate, type Instant } from '../core/time';
import { countWords, spokenList } from '../core/text';
import { CITIES } from '../content/geography';
import { institutionById } from '../content/awards';
import { AGENTS, agencyCovers, agencyOf, agentById, departmentOf, type Agent, type AgentId } from '../content/agents';
import { AGREEMENT, AGREEMENT_TERMS, type AgreementTerm, type ProjectTemplate } from '../content/careerwork';
import type { MaterialKind, MaterialPurpose, Agreement, ProId } from './pro';
import { voiceOnly } from './workflow';
import { COVERED_MEDIA } from './propay';
import { inScope } from './projobs';
import {
  AGENT_TIMES, GATE, REPRESENTATION_ROUTE, ensureRelation, interestOf, note, offeredAgreement, officeOf, officeZone, onDayAt, relationOf, setStage,
  tooSoon, underWay,
} from './proagent';

// ---------------------------------------------------------------------------------------------------------------------
// The terms, as versions
// ---------------------------------------------------------------------------------------------------------------------

/** The work an agreement covers: stage, film and television on camera, and voice-over. */
export type DealScope = 'legit' | 'voice';
/** What the actor can ask for: a shorter term, voice-over added, or work abroad added. */
export type TermsAsk = 'shorter' | 'voice' | 'abroad';

/**
 * One version of an agreement's terms: what it covers, where (country ids), for how long, and from when. The first is the
 * terms as offered, a later one an ask the office agreed to (`Agreement.ask` says which). Until the review of 2026-10-25 a
 * version kept `how` and `ask` as well, which nothing read: the version's number and the agreement's ask said both.
 */
export interface DealVersion {
  version: number;
  at: Instant;
  scope: DealScope[];
  territory: string[];
  termDays: number;
}

/** An agreement's terms, every version kept, the last the one in force. */
export interface AgreementDeal {
  versions: DealVersion[];
}

/** The actor's one ask: what, when, when the office answers, the chance it was said at, and the answer once given. */
export interface AgreementAsk {
  what: TermsAsk;
  at: Instant;
  answerAt: Instant;
  chance: number;
  answer?: 'agreed' | 'kept';
  answeredAt?: Instant;
}

/** The office's answer to an ask, on the clock. */
export const TERMS_KIND = 'pro.agent_terms_answer';

/**
 * The figures an ask runs on. Every one an ASSUMPTION of the game's: no source gives how often an agency agrees to an
 * actor's ask, or how long it takes to answer.
 */
export const TERMS = {
  /** ASSUMPTION: the shorter term an actor can ask for, six months, within Equity's one year (S30) and SAG-AFTRA's eighteen months (S11). */
  shorterDays: 182,
  /** The territory as offered: the United States, as `AGREEMENT_TERMS`' Where has always said. */
  home: ['us'] as readonly string[],
  /**
   * ASSUMPTION: abroad, the countries where the game makes work and knows what permission it needs (`content/slate.ts`'s
   * markets abroad, `content/jurisdictions.ts`): the UK and Australia.
   */
  abroad: ['uk', 'au'] as readonly string[],
  /** ASSUMPTION: an office answers an ask two days on, at its usual hour. */
  answerDays: 2,
  /** ASSUMPTION: the chance an office agrees, by the ask, with the factors at the gate: a shorter term halves its hold on you, voice-over adds work it's paid on, work abroad is work it has to follow. */
  base: { shorter: 0.5, voice: 0.6, abroad: 0.45 } as Readonly<Record<TermsAsk, number>>,
  /** ASSUMPTION: each factor at the bar or beyond above the gate raises it a tenth, each below lowers it, never under the least or over the most. */
  perFactor: 0.1,
  least: 0.1,
  most: 0.9,
} as const;

const COUNTRY_WORDS: Readonly<Record<string, string>> = { us: 'the United States', uk: 'the UK', au: 'Australia' };
const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** A term's length in words: one year, six months. */
export const termWords = (days: number): string => (days === 365 ? 'one year' : days === TERMS.shorterDays ? 'six months' : `${days} days`);

/** The country a city is in, as the pay's `coveredWork` read it until 2026-10-25. */
export const countryOf = (cityId: string): string => CITIES.get(cityId)?.countryId ?? (cityId.startsWith('us-') ? 'us' : '');

/** Whether an agent works in a department that covers voice-over (from 2026-10-25, the game's own agency's). */
export const voiceDepartment = (agent: Agent): boolean => departmentOf(agent).fields.includes('voice');

/** The sample an approach to the agent sends with the headshots and the résumé: a voice demo to a voice department, else the reel. */
export const sampleKind = (agent: Agent): Extract<MaterialKind, 'reel' | 'demo'> => (voiceDepartment(agent) ? 'demo' : 'reel');
/** The sample in words: "reel", "voice demo". */
export const sampleName = (agent: Agent): string => (voiceDepartment(agent) ? 'voice demo' : 'reel');
/** What the materials check reads for an approach to the agent: the voice's for a voice department, else representation's. */
export const purposeOf = (agent: Agent): Extract<MaterialPurpose, 'representation' | 'voice'> => (voiceDepartment(agent) ? 'voice' : 'representation');

/** The terms an agent's office offers first: its department's work, in the US, for `AGREEMENT.termDays`. */
export function firstDeal(agent: Agent, at: Instant): DealVersion {
  return { version: 1, at, scope: [voiceDepartment(agent) ? 'voice' : 'legit'], territory: [...TERMS.home], termDays: AGREEMENT.termDays };
}

/**
 * The terms in force on an agreement: its last version, or, for an agreement from before 2026-10-25 that has none, the
 * terms its words were offered with (`firstDeal`).
 */
export function dealOf(a: Agreement): DealVersion {
  const kept = a.deal?.versions.at(-1);
  if (kept) return kept;
  const agent = agentById(a.agentId);
  return agent ? firstDeal(agent, a.offeredAt) : { version: 1, at: a.offeredAt, scope: ['legit'], territory: [...TERMS.home], termDays: AGREEMENT.termDays };
}

/** What a version covers, in words: "stage, film and television work", "voice-over work", or both. */
export function scopeWords(d: Pick<DealVersion, 'scope'>): string {
  const legit = d.scope.includes('legit');
  const voice = d.scope.includes('voice');
  return legit && voice ? 'stage, film, television and voice-over work' : voice ? 'voice-over work' : 'stage, film and television work';
}

/** Where a version covers, in words: "in the US", "in the US, the UK and Australia". */
export function territoryWords(d: Pick<DealVersion, 'territory'>): string {
  return d.territory.length === 1 && d.territory[0] === 'us' ? 'in the US' : `in ${spokenList(d.territory.map((c) => (c === 'us' ? 'the US' : COUNTRY_WORDS[c] ?? c)))}`;
}

/** The abroad the game has, in words: "the UK and Australia". */
const ABROAD_WORDS = (): string => spokenList(TERMS.abroad.map((c) => COUNTRY_WORDS[c] ?? c));

/**
 * The terms as the player reads them under The Agreement, built from a version: `AGREEMENT_TERMS` as they are for the
 * first terms of a legit department, and What It Covers, Where, What It Leaves Out, How Long and Ending It in the version's
 * own words otherwise. Copied into the agreement when offered and again when the office agrees, so a later build leaves
 * its words as they were.
 */
export function termsFor(d: DealVersion): AgreementTerm[] {
  const terms = JSON.parse(JSON.stringify(AGREEMENT_TERMS)) as AgreementTerm[];
  const set = (id: AgreementTerm['id'], words: string) => { const t = terms.find((x) => x.id === id); if (t) t.words = words; };
  const legit = d.scope.includes('legit');
  if (d.scope.includes('voice')) {
    // Who handles the voice-over work added to a legit agreement: the agent, with the agency's voice-over department (from
    // the review of 2026-10-25; until then the words said the department handled it, while the submissions it makes say
    // the agent submitted you).
    set('scope', legit ? 'Stage, film and television work, and voice-over work: animation, dubbing and narration, which your agent handles with the agency’s voice-over department.' : 'Voice-over work: animation, dubbing and narration, the work the agent’s department covers.');
    set('excluded', legit ? 'Commercials aren’t covered. An agency usually handles them in another department.' : 'Stage, film and television work on camera, and commercials, aren’t covered. The agency handles them in its other departments.');
  }
  if (d.territory.some((c) => !TERMS.home.includes(c))) set('territory', `Work anywhere in the United States, and in ${ABROAD_WORDS()}, where the game has work abroad.`);
  if (d.termDays !== AGREEMENT.termDays) {
    const length = termWords(d.termDays);
    set('duration', `${capital(length)} from the day you sign it, the shorter term you asked for.`);
    const end = terms.find((x) => x.id === 'termination');
    if (end) end.words = end.words.replace('when the year is up', `when its ${length} are up`);
  }
  return terms;
}

/**
 * Whether an agreement covers a project's work: by its version's scope (voice-over for the work `voiceOnly` records, stage,
 * film and television for the rest, `COVERED_MEDIA`) and territory. The pay's commission reads it (`commissionOn`), and the
 * work loop's offers (`makeOffer`). For the first terms of a legit department it's what the pay's `coveredWork` was, which
 * it replaced.
 */
export function coveredUnder(a: Agreement, t: Pick<ProjectTemplate, 'medium' | 'place'> & Partial<Pick<ProjectTemplate, 'format'>>): boolean {
  const d = dealOf(a);
  const voice = t.format !== undefined && voiceOnly({ format: t.format });
  const kind = voice ? d.scope.includes('voice') : d.scope.includes('legit') && COVERED_MEDIA.includes(t.medium);
  return kind && d.territory.includes(countryOf(t.place.cityId));
}

/**
 * Whether an agreement's agent submits the actor for a part (read by `reachOf`, `systems/projobs.ts`): work it covers,
 * and, on camera or on stage, a field the agent's own department covers (`inScope`). A voice part needs only the cover:
 * an agreement covers voice-over only where the agency has a voice-over department (`firstDeal`, `askRefusal`), which
 * puts the actor up for it. Until 2026-10-25 the department's fields alone decided, whatever the agreement said it covered.
 */
export function submitsFor(a: Agreement, t: ProjectTemplate): boolean {
  return coveredUnder(a, t) && (voiceOnly(t) || inScope(a.agentId, t));
}

/** Why an agreement doesn't cover a project's work, as a clause: "your agreement with <agency> leaves out voice-over work, and this is that". */
export function outsideWords(a: Agreement, t: Pick<ProjectTemplate, 'medium' | 'place'> & Partial<Pick<ProjectTemplate, 'format'>>, agency: string): string {
  const d = dealOf(a);
  const voice = t.format !== undefined && voiceOnly({ format: t.format });
  if (voice && !d.scope.includes('voice')) return `your agreement with ${agency} leaves out voice-over work, and this is that`;
  return `your agreement with ${agency} covers ${scopeWords(d)} ${territoryWords(d)}, and this isn’t that`;
}

/** Why the pay takes no commission on work an agreement doesn't cover, in a sentence (`commissionOn`). */
export const uncoveredWords = (a: Agreement, t: Pick<ProjectTemplate, 'medium' | 'place'> & Partial<Pick<ProjectTemplate, 'format'>>, agency: string): string => `No commission: ${outsideWords(a, t, agency)}.`;

// ---------------------------------------------------------------------------------------------------------------------
// The ask
// ---------------------------------------------------------------------------------------------------------------------

/** Each ask as its button names it. */
export const ASK_LABEL: Readonly<Record<TermsAsk, string>> = { shorter: 'Ask For A Shorter Term', voice: 'Ask To Add Voice-Over', abroad: 'Ask To Add Work Abroad' };
export const ASKS: readonly TermsAsk[] = ['shorter', 'voice', 'abroad'];

/** What an ask asks for, in words, against the terms it would change. */
export function askWords(ask: TermsAsk, d: DealVersion): string {
  if (ask === 'shorter') return `a term of ${termWords(TERMS.shorterDays)} instead of ${termWords(d.termDays)}`;
  if (ask === 'voice') return 'voice-over work to be covered too';
  return `work in ${ABROAD_WORDS()} to be covered too`;
}

/** An ask's chance, from how many of the office's factors are at the bar or beyond against the gate: never under `least`, never over `most`. */
export function termsChance(ask: TermsAsk, atOrBeyond: number, gate: number): number {
  return Math.round(Math.min(TERMS.most, Math.max(TERMS.least, TERMS.base[ask] + TERMS.perFactor * (atOrBeyond - gate))) * 100) / 100;
}

/** The chance the office agrees to an ask now, from its interest in the actor as it stands (`interestOf`). */
export function askChance(sim: Simulation, person: Person, agent: Agent, ask: TermsAsk): number {
  return termsChance(ask, interestOf(sim, person, agent, sim.now).atOrBeyond, GATE);
}

/** A chance as the player reads it: "about 6 in 10". */
export const chanceTenths = (chance: number): string => `about ${Math.round(chance * 10)} in 10`;

/** The draw an ask's answer is made with: one for each agreement, whatever was asked (decider `pro.agent_terms`). */
export function termsDraw(sim: Simulation, personId: string, agentId: AgentId, agreementId: ProId): number {
  return sim.rng('pro.agent_terms', personId, agentId, agreementId).next();
}

/** When the office answers an ask made now: two days on, at its usual hour on its own clock. */
const answerTime = (sim: Simulation, agent: Agent): Instant => onDayAt(sim.now, TERMS.answerDays, AGENT_TIMES.answerHour, officeZone(agent));

/**
 * What the game says of a real agent's answer (from the review of 2026-10-25): the agency's pages say nothing of its terms,
 * so whether the office agrees is the game's, as every chance an office takes you further is (`REAL_CHANCE_WORDS`).
 */
export const realTermsWords = (agent: Agent): string => `${agencyOf(agent).name}’s pages say nothing of the terms its agents agree to, so whether ${agent.words.office} agrees is the game’s invention, not a fact about ${agent.name}.`;

/** How an ask came out, in a sentence's end. */
const answerWords = (agent: Agent, answer: NonNullable<AgreementAsk['answer']>): string => (answer === 'agreed' ? `${agent.words.office} agreed` : `${agent.words.office} kept the terms as offered`);

/**
 * Why the actor can't ask for this now, or nothing: an offer standing and unanswered, asked once only, an ask that would
 * change something (voice-over where the agency has a voice department and the agreement leaves it out; work abroad where
 * the agreement covers work the game has abroad), and time for the answer before the offer lapses.
 */
export function askRefusal(sim: Simulation, person: Person, agent: Agent, ask: TermsAsk): string | undefined {
  const z = sim.zone;
  const a = offeredAgreement(person, agent);
  if (!a) return `${capital(agent.words.he)} hasn’t offered you an agreement.`;
  const d = dealOf(a);
  if (a.ask) {
    return a.ask.answer
      ? `You asked once already, on ${formatDate(a.ask.at, z)}, for ${askWords(a.ask.what, a.deal?.versions[0] ?? d)}, and ${answerWords(agent, a.ask.answer)}. In the game you ask once.`
      : `You asked for ${askWords(a.ask.what, d)} on ${formatDate(a.ask.at, z)}. ${capital(agent.words.office)} answers on ${formatWeekdayDate(a.ask.answerAt, z)} at ${formatTime(a.ask.answerAt, z)}.`;
  }
  if (ask === 'voice' && d.scope.includes('voice')) return `It covers voice-over work already: that’s what ${agent.words.department} does.`;
  if (ask === 'voice' && !agencyCovers(agent, 'voice')) return `The game knows of no voice-over department at ${agencyOf(agent).name}’s ${agencyOf(agent).office.city} office${agent.real ? ', since the pages it read name none' : ''}, so voice-over can’t be added to this agreement.`;
  if (ask === 'abroad' && !d.scope.includes('legit')) return `The game has no voice work abroad, so there’s nothing abroad for ${agent.words.office} to cover.`;
  if (answerTime(sim, agent) >= a.standsUntil) return `The offer stands until ${formatDate(a.standsUntil, z)}, and an answer takes ${countWords(TERMS.answerDays)} days, so there’s no time left to ask.`;
  return undefined;
}

/** Why the offered agreement can't be accepted yet, or nothing: an ask the office hasn't answered (read by `signRefusal`). */
export function askWaiting(sim: Simulation, person: Person, agent: Agent): string | undefined {
  const a = offeredAgreement(person, agent);
  const ask = a?.ask;
  if (!a || !ask || ask.answer) return undefined;
  return `You asked ${agent.words.office} for ${askWords(ask.what, dealOf(a))} on ${formatDate(ask.at, sim.zone)}, and it answers on ${formatWeekdayDate(ask.answerAt, sim.zone)} at ${formatTime(ask.answerAt, sim.zone)}. You can accept the agreement once it has, as it stands then.`;
}

/** The terms an agreed ask makes, from the version in force. */
function agreedVersion(d: DealVersion, ask: TermsAsk, at: Instant): DealVersion {
  return {
    version: d.version + 1, at,
    scope: ask === 'voice' ? [...d.scope, 'voice'] : [...d.scope],
    territory: ask === 'abroad' ? [...d.territory, ...TERMS.abroad.filter((c) => !d.territory.includes(c))] : [...d.territory],
    termDays: ask === 'shorter' ? TERMS.shorterDays : d.termDays,
  };
}

/** The office's answer to an ask, at its time: agreed, a new version kept and the words rebuilt, or the terms kept. */
function answerAsk(sim: Simulation, person: Person, agent: Agent, a: Agreement): void {
  const ask = a.ask!;
  const rel = relationOf(person, agent.id)!;
  const before = dealOf(a);
  const agreed = termsDraw(sim, person.id, agent.id, a.id) < ask.chance;
  ask.answer = agreed ? 'agreed' : 'kept';
  ask.answeredAt = sim.now;
  const z = sim.zone;
  if (agreed) {
    const next = agreedVersion(before, ask.what, sim.now);
    a.deal = { versions: [...(a.deal?.versions ?? [before]), next] };
    a.terms = termsFor(next);
    note(sim, rel, 'terms-agreed', `terms:${a.id}:agreed`, `${capital(agent.words.office)} agreed to ${askWords(ask.what, before)}. The agreement it offered now says so.`, a.id);
  } else {
    note(sim, rel, 'terms-kept', `terms:${a.id}:kept`, `${capital(agent.words.office)} kept the terms as offered, without ${askWords(ask.what, before)}.`, a.id);
  }
  if (person.id !== sim.universe.playerId) return;
  sim.notify({
    category: 'career', importance: 65, route: REPRESENTATION_ROUTE, refType: 'pro-agent', refId: agent.id,
    title: agreed ? `${agent.name}’s Office Agreed To Your Ask` : `${agent.name}’s Office Kept Its Terms`,
    body: `${agreed ? `${capital(officeOf(agent))} agreed to ${askWords(ask.what, before)}, and The Agreement on the Representation tab now says so.` : `${capital(officeOf(agent))} kept the agreement’s terms as it offered them, without ${askWords(ask.what, before)}.`} The offer stands until ${formatDate(a.standsUntil, z)}: accept it or decline it there.${agent.real ? ` ${realTermsWords(agent)}` : ''}`,
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// The introduction at a festival
// ---------------------------------------------------------------------------------------------------------------------

/**
 * An introduction at a festival, for the festival's system to call when the player attends their film's screening and
 * does its press (brief 27; the attendance is that system's): each agent whose routes include `festival` meets the actor
 * there, the film goes among the work the office has to go on (`AgentRelation.festivals`, read by `workSeen` and
 * `caseKeys`), and, where no approach is under way or held, the meeting is the introduction the approach needs
 * (`via`, read by `sendRefusal`), as the School's follow-up and a referral are. Once for each festival entry: a second
 * call for it, or one for an entry not selected, does nothing. Returns the agents it introduced. The festival is the
 * entry's own (`institutionById`), named as `festival` says where the caller gives a name; and the film "screened" there
 * once the entry says so, and was "in the official selection" before (until the review of 2026-10-25 an unnamed call said
 * Sundance and every call said "screened").
 *
 * ASSUMPTION, the game's: that an agent's office meets the actors of films it sees at a festival. A festival publishes its
 * films and its screenings, not who comes, and the notice says the meeting is the game's.
 */
export function introduceAtFestival(sim: Simulation, person: Person, entryId: ProId, festival?: string): AgentId[] {
  const entry = person.pro?.festivals?.find((f) => f.id === entryId);
  if (!entry || (entry.state !== 'selected' && entry.state !== 'screened')) return [];
  const film = person.pro?.credits.find((c) => c.id === entry.creditId);
  if (!film) return [];
  const name = festival ?? `the ${entry.year} ${institutionById(entry.institution).name}`;
  const shown = entry.state === 'screened' ? 'screened' : 'was in the official selection';
  const z = sim.zone;
  const introduced: AgentId[] = [];
  for (const agent of AGENTS.filter((a) => a.routes.includes('festival'))) {
    const rel = ensureRelation(sim, person, agent, 'introduced');
    if (rel.festivals?.some((f) => f.entryId === entry.id)) continue;
    const unread = rel.noticeShownAt === undefined;
    rel.noticeShownAt ??= sim.now;
    note(sim, rel, 'discovered', 'discovered', `You first heard of ${agent.words.him} at ${name}, where ${film.project} ${shown}.`);
    (rel.festivals ??= []).push({ entryId: entry.id, creditId: film.id, festival: name });
    const held = underWay(sim, agent, rel) ?? tooSoon(sim, rel);
    const key = `festival:${entry.id}`;
    const intro = unread ? ` ${agent.notice}` : '';
    const how = `In the game an agent’s office meets the actors of the films it sees at a festival. The festival publishes its films and screenings, not who comes, so the meeting is the game’s.`;
    const title = `${agent.name}’s Office Met You At The Festival`;
    if (held) {
      note(sim, rel, 'introduced', key, `You met ${agent.words.office} at ${name}, where ${film.project} ${shown}. Where you stood with it didn’t change, and it has the film to go on.`);
      if (person.id === sim.universe.playerId) sim.notify({ category: 'career', importance: 55, route: REPRESENTATION_ROUTE, refType: 'pro-agent', refId: agent.id, title, body: `You met ${officeOf(agent)} at ${name}, where ${film.project} ${shown}. Where you stand with it doesn’t change: ${held} It has the film to go on now.${intro} ${how}` });
      continue;
    }
    rel.via = { route: 'festival', at: sim.now, by: name };
    setStage(sim, rel, 'introduced');
    note(sim, rel, 'introduced', key, `${capital(agent.words.office)} met you at ${name}, where ${film.project} ${shown}: an introduction, so you could send it your materials.`);
    if (person.id === sim.universe.playerId) sim.notify({ category: 'career', importance: 60, route: REPRESENTATION_ROUTE, refType: 'pro-agent', refId: agent.id, title, body: `You met ${officeOf(agent)} at ${name}, on ${formatDate(sim.now, z)}, where ${film.project} ${shown}. It’s an introduction: you can send it your materials from the Career screen’s Representation tab, and it has the film to go on.${intro} ${how}` });
    introduced.push(agent.id);
  }
  return introduced;
}

// ---------------------------------------------------------------------------------------------------------------------
// The command and the answer
// ---------------------------------------------------------------------------------------------------------------------

/** The ask's command and its answer on the clock, registered with the agent's (`registerProAgent`). */
export function registerRepresentation(sim: Simulation): void {
  sim.onCommand<{ agentId?: string; ask?: string }, { answerAt: Instant; chance: number }>('pro.ask_terms', (p, { sim: s }) => {
    const person = s.player;
    const agent = agentById(String(p?.agentId ?? AGENTS[0]?.id ?? ''));
    if (!agent) throw new CommandError('There’s no such agent in the game.');
    const ask = ASKS.find((x) => x === p?.ask);
    if (!ask) throw new CommandError('Ask for a shorter term, for voice-over or for work abroad.');
    const no = askRefusal(s, person, agent, ask);
    if (no) throw new CommandError(no);
    const a = offeredAgreement(person, agent)!;
    const rel = relationOf(person, agent.id)!;
    const chance = askChance(s, person, agent, ask);
    const answerAt = answerTime(s, agent);
    a.ask = { what: ask, at: s.now, answerAt, chance };
    note(s, rel, 'terms-asked', `terms:${a.id}:asked`, `You asked ${agent.words.office} for ${askWords(ask, dealOf(a))} in the agreement it offered.`, a.id);
    s.schedule({ at: answerAt, kind: TERMS_KIND, label: `${agencyOf(agent).name} Answers Your Ask`, category: 'career', priority: 40, refType: 'pro-agreement', refId: a.id, payload: { personId: person.id, agentId: agent.id, agreementId: a.id } });
    return { answerAt, chance };
  });

  sim.onSchedule(TERMS_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const agent = agentById(String(item.payload.agentId));
    const a = person?.pro?.agreements.find((x) => x.id === item.payload.agreementId);
    // Only an ask puts this on the clock; declining the offer calls it off with the rest of its items, and the offer can't be
    // accepted or lapse before it comes.
    if (!person || !agent || !a) return;
    answerAsk(s, person, agent, a);
  });
}
