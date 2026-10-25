/**
 * SLATE — the agent: the relationship, his office's interest, the agreement and its end, and the School's follow-up after
 * the showcase (from 2026-10-21, the owner's brief 19, G1 to G8, W3 and A2; `docs/verification/career-2026-10-20/
 * design.md`, The Agent, The Agent's Interest, The Relationship and The Agreement).
 *
 * **He's invented** (`content/agents.ts`), as his agency is. Until 2026-10-21 he was a real agent in a real agency's New
 * York legit department, the game holding only what was published (`docs/research/career-2026-10-20/agent.md`), each
 * message carrying a line that his words and decisions were invented; the owner chose a fictional agent that day. He
 * never seeks the player out, the game's rule, kept from the real agency's warning that people posing as its
 * representatives approach unrepresented actors (agent.md): nothing from him arrives unasked. The School's follow-up comes from the School, a referral from the person who made it, and his
 * office's answers come only to an approach the player made. An unsolicited submission is refused in the agency's rule,
 * `agencyOf(agent).policy.words`, never copied. No engine code names him: everything here runs for whichever agents
 * `AGENTS` holds.
 *
 * **The stages** (`RelationStage`, `systems/pro.ts`), each step an event with a stable key in the relation's history
 * (`noteEvent`), so a reload or a jump notes nothing twice: discovered (the notice read, `pro.agent_notice`) → checked
 * (the eligibility and materials check, `pro.agent_check`, which refuses while a submission would be incomplete) →
 * introduced (the School's follow-up, `scheduleShowcaseFollowUp`, or a referral, `pro.ask_referral`) → sent
 * (`pro.send_materials`) → an answer: a request for more (requested, `pro.supply_material`), a meeting (meeting, kept,
 * missed or moved once with `pro.ask_to_move`, then deciding), a pass (passed), or none (waiting once the usual two weeks
 * go by, unanswered once six weeks have) → offered (`AGREEMENT_TERMS`, shown in full) → represented
 * (`pro.accept_agreement`), declined (`pro.decline_agreement`, or let lapse) → ended (`pro.end_agreement`, or the term).
 *
 * **His office's interest, factor by factor** (`interestOf`): the work it has to go on, its stage and screen breadth,
 * training and experience, fit with his department's published fields, availability (`availabilityOf`,
 * `eligibilityOf`), room on his list (the game's roster assumption, drawn for each year, `rosterFor`) and reliability
 * from real events. Each has a level against a bar the game sets, never his: short of it, near it, at it or beyond it.
 * No single score decides. An approach is taken further only with enough of them at the bar or beyond (`GATE`), and
 * then against the year's other actors in a draw (decider `pro.agent`, `src/engine/decided.ts`) whose chance rises with
 * the work's band and the room on the list, and is never certain (`CHANCE.most`). The draw is keyed by the person, the
 * agent, the approach's number and the step, so the same approach on the same facts answers the same way through any
 * reload, and a new approach needs a cooling-off time and something new before it can be drawn again (`COOLDOWN_DAYS`,
 * `caseKeys`).
 *
 * Every time and threshold here is an ASSUMPTION of the game's, said where a player reads it: no source gives an
 * agency's response time, a bar, or a share of approaches answered (representation.md, "What a game may assume", 2 and
 * 4). The agreement's terms are the core's (`AGREEMENT`, `AGREEMENT_TERMS`, `content/careerwork.ts`), each verified with
 * its source or marked a simulation term; ending it reads Equity's 90 days (S29) and SAG-AFTRA's 151 and 91 days (S2,
 * its help center, read directly: the design called it a snippet, and the research quotes the page itself).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { ScheduledItem } from '../core/scheduler';
import type { Person } from '../domain/model';
import { MS_DAY, MS_MINUTE, addDays, formatDate, formatDateTime, formatTime, formatWeekdayDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { countWords, spokenList } from '../core/text';
import { CITIES } from '../content/geography';
import { YALE_DRAMA } from '../content/school';
import { BRIEF_BY_ID } from '../content/briefs';
import { AGENTS, FIELD_LABEL, agencyOf, agentById, type Agent, type AgentField, type AgentId, type RosterOpening } from '../content/agents';
import { AGREEMENT, AGREEMENT_TERMS, projectById, type ProjectKind } from '../content/careerwork';
import type { PartSize } from '../content/plays';
import { BAND_LABEL, type Band } from './coursework';
import { inHospital } from './health';
import { laidUp } from './injury';
import { yearsSince } from './life';
import { defineStop } from '../world/clock';
import {
  activeAgreement, availabilityOf, countOf, currentOf, eligibilityOf, ensurePro, finished, honorsOf, materialsCheck, noteEvent, trainingOf,
  type Agreement, type AgentMaterial, type AgentRelation, type EndedHow, type MaterialKind, type MaterialProblem, type ProEvent, type ProEventKind, type ProId, type RelationStage,
} from './pro';
import { yearOfStudy } from './school';
import { attendedAcross } from './projobs';

// ---------------------------------------------------------------------------------------------------------------------
// The rules: kinds, times, bars and chances (every one an ASSUMPTION, said where a player reads it)
// ---------------------------------------------------------------------------------------------------------------------

export const REPLY_KIND = 'pro.agent_reply';
export const SILENCE_KIND = 'pro.agent_silence';
export const REQUEST_DUE_KIND = 'pro.agent_request_due';
export const MEETING_KIND = 'pro.agent_meeting';
export const DECISION_KIND = 'pro.agent_decision';
export const OFFER_LAPSE_KIND = 'pro.agent_offer_lapse';
export const TERM_END_KIND = 'pro.agent_term_end';
export const FOLLOW_UP_KIND = 'pro.agent_follow_up';
/**
 * The last day of his office's request to meet, passed on by the School (`askedStandsDays` after the follow-up; from
 * 2026-10-22, brief 20's journeys, F10). With no materials sent by then the request lapses, said and kept on the record;
 * an approach after it is an ordinary one. Until then the date the follow-up's notice gave went by with nothing said.
 */
export const ASK_LAPSE_KIND = 'pro.agent_ask_lapse';

/** The Career screen's Representation tab, where every notice of this system sends the player. */
export const REPRESENTATION_ROUTE = '/workspace/career?tab=representation';

/**
 * The times, in days and on the office's clock. ASSUMPTION, every one: an office answers an introduced approach in two
 * weeks, and no answer in six counts as no; material asked for is due in three weeks, and once sent the answer comes a
 * week later; a meeting is set on a weekday a week or more on, at eleven, for an hour, and moved once, a week on; the
 * decision comes five days after it; the School follows the showcase up three days after its last performance, and a
 * request to meet it passes on stands for thirty days.
 */
export const AGENT_TIMES = {
  replyDays: 14, silenceDays: 42, requestDays: 21, afterSupplyDays: 7, answerHour: 10,
  meetingAfterDays: 7, meetingHour: 11, meetingMinutes: 60, moveDays: 7, movesAllowed: 1,
  decisionDays: 5, followUpDays: 3, askedStandsDays: 30,
} as const;

/** The rules' times in words, for the sentences that say them: two weeks, six weeks, a week. */
const weeksWords = (days: number): string => (days === 7 ? 'a week' : days % 7 === 0 ? `${countWords(days / 7)} weeks` : `${days} days`);
const REPLY_WORDS = weeksWords(AGENT_TIMES.replyDays);
const SILENCE_WORDS = weeksWords(AGENT_TIMES.silenceDays);
const MOVE_WORDS = weeksWords(AGENT_TIMES.moveDays);
/** The same, for the screen and the help: the answer's usual time, the silence's, and a meeting's move. */
export const TIME_WORDS = { reply: REPLY_WORDS, silence: SILENCE_WORDS, move: MOVE_WORDS, request: weeksWords(AGENT_TIMES.requestDays), afterSupply: weeksWords(AGENT_TIMES.afterSupplyDays) } as const;

/** ASSUMPTION: after a pass, a year before his office looks again; after no answer or a declined offer, six months. */
export const COOLDOWN_DAYS = { pass: 365, silence: 182, declined: 182 } as const;
export const COOLDOWN_WORDS = { pass: 'a year', silence: 'six months', declined: 'six months' } as const;

/** ASSUMPTION: the trip to his office for a meeting, in minutes, from where the player's based; a video call from elsewhere. */
export const TRAVEL_MINUTES: Readonly<Record<string, number>> = { [YALE_DRAMA.cityId]: 120, 'us-ny-newyork': 30 };

/** ASSUMPTION: a job's work judged this band or better is judged well enough for its director or casting office to refer you. */
export const REFERRAL_BAND: Band = 'strong';

/** ASSUMPTION: an approach goes further only with this many of the seven factors at the bar or beyond. */
export const GATE = 4;

/**
 * The competitive draw's chances, ASSUMPTION every figure. By the best band of the work his office has to go on, for
 * being taken further (a meeting) and, after a meeting kept, for an offer; times the room on his list; never above
 * `most`, so high skill is never certain. Of the approaches not taken further, `unanswered` get no answer at all.
 */
export const CHANCE = {
  interest: { exceptional: 0.6, strong: 0.4, working: 0.15, unready: 0.04 } as Readonly<Record<Band, number>>,
  offer: { exceptional: 0.75, strong: 0.6, working: 0.35, unready: 0.15 } as Readonly<Record<Band, number>>,
  room: { beyond: 1.25, at: 1, near: 0.6, short: 0.3 } as Readonly<Record<Level, number>>,
  most: 0.85,
  unanswered: 0.3,
} as const;

const BAND_RANK: Readonly<Record<Band, number>> = { unready: 0, working: 1, strong: 2, exceptional: 3 };
const BANDS: readonly Band[] = ['unready', 'working', 'strong', 'exceptional'];
/** A count with its noun, the number in words under ten as prose has it: one meeting, two credits, 12 days. */
const counted = (n: number, one: string, many = `${one}s`): string => `${countWords(n)} ${n === 1 ? one : many}`;

const bestBand = (bands: readonly (Band | undefined)[]): Band | undefined =>
  bands.filter((b): b is Band => b !== undefined).sort((a, b) => BAND_RANK[b] - BAND_RANK[a])[0];

// ---------------------------------------------------------------------------------------------------------------------
// Who he is, and the relation
// ---------------------------------------------------------------------------------------------------------------------

/** The agents an approach can be made to: every one in `AGENTS`. */
export const agentsOpen = (): readonly Agent[] => AGENTS;

/** His office, as a sentence names it: his name and his agency's, "<name>’s office at <agency>". */
export const officeOf = (agent: Agent): string => `${agent.name}’s office at ${agencyOf(agent).name}`;

/**
 * The agent in the player's words (from 2026-10-24, brief 25's Module 3, A7): the game's own agent by his pronouns
 * (`agent.words`), a real one, whose pronouns the pages don't give, by name: "Dan Patack has offered", "How To Reach Dan
 * Patack", "Send What The Office Asked For". Until then every sentence here said "he" and "his office" of the one agent.
 */
const hasDone = (agent: Agent): string => (agent.real ? `${agent.name} has` : 'He’s');
/**
 * The ways in an agent's office takes, in words: the School's follow-up and a referral for the game's own agent, a
 * referral alone for a real one, which of the showcase's audience the pages don't say (Module 3, A4).
 */
const shows = (agent: Agent): boolean => agent.routes.includes('showcase');
export const routesWords = (agent: Agent): string => (shows(agent) ? 'the School’s follow-up after the showcase, or a referral from someone you’ve worked with' : 'a referral from someone you’ve worked with');
export const himTitle = (agent: Agent): string => (agent.real ? agent.name : 'Him');
export const officeTitle = (agent: Agent): string => (agent.real ? 'The Office' : 'His Office');

/** The relation with an agent, where there is one. */
export const relationOf = (person: Person, agentId: AgentId): AgentRelation | undefined => person.pro?.relations[agentId];

function ensureRelation(sim: Simulation, person: Person, agent: Agent, stage: RelationStage): AgentRelation {
  const pro = ensurePro(sim, person);
  return (pro.relations[agent.id] ??= { agentId: agent.id, stage, since: sim.now, stageAt: sim.now, history: [], counts: {} });
}

function setStage(sim: Simulation, rel: AgentRelation, stage: RelationStage): void {
  rel.stage = stage;
  rel.stageAt = sim.now;
}

/** How many approaches have been sent: the approach a send makes is the next one. */
const approachesOf = (rel: AgentRelation | undefined): number => (rel ? countOf(rel, 'sent') : 0);

/** The office's clock: its city's zone. */
const officeZone = (agent: Agent): string => CITIES.get(agencyOf(agent).office.cityId)?.timeZone ?? 'America/New_York';

/** A day so many on, at an hour on that clock; a weekday where asked, moved on past a weekend. */
function onDayAt(at: Instant, days: number, hour: number, zone: string, weekday = false): Instant {
  let d = addDays(at, days, zone);
  let p = zonedParts(d, zone);
  while (weekday && (p.weekday === 0 || p.weekday === 6)) { d = addDays(d, 1, zone); p = zonedParts(d, zone); }
  return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour, minute: 0, second: 0 }, zone);
}

/**
 * A notice to the player, on the Representation tab, carrying the agent's fictional line. Its title names him or his
 * agency (`whose`, `atAgency`): until 2026-10-21 eight titles said "His Office" or "He", which in What Needs You, among the
 * School's notices, named nobody, and a classmate can be called Jordan too (brief 19's app walk).
 */
const whose = (agent: Agent): string => `${agent.name}’s Office`;
const atAgency = (agent: Agent): string => agencyOf(agent).name;
// Until 2026-10-21 each body ended with the agent's line that his words and decisions were invented, which a real agent
// needed; a fictional one doesn't, as no other character the game invents carries one, and the notice says so once.
function tell(sim: Simulation, person: Person, agent: Agent, title: string, body: string, importance = 60): void {
  if (person.id !== sim.universe.playerId) return;
  sim.notify({ category: 'career', title, body, importance, route: REPRESENTATION_ROUTE, refType: 'pro-agent', refId: agent.id });
}

/** An event in the relation's history, keyed so it's noted once. */
const note = (sim: Simulation, rel: AgentRelation, kind: ProEventKind, key: string, words: string, ref?: ProId): ProEvent =>
  noteEvent(sim, rel, { kind, key, words, ...(ref !== undefined ? { ref } : {}) });

// ---------------------------------------------------------------------------------------------------------------------
// The factors
// ---------------------------------------------------------------------------------------------------------------------

export type Level = 'short' | 'near' | 'at' | 'beyond';
export const LEVELS: readonly Level[] = ['short', 'near', 'at', 'beyond'];
const LEVEL_RANK: Readonly<Record<Level, number>> = { short: 0, near: 1, at: 2, beyond: 3 };
/** Each level as the drill-down shows it. The bar is the game's, never his. */
export const LEVEL_LABEL: Readonly<Record<Level, string>> = { short: 'Short Of The Bar', near: 'Near The Bar', at: 'At The Bar', beyond: 'Beyond The Bar' };
const raised = (l: Level, by: number): Level => LEVELS[Math.max(0, Math.min(3, LEVEL_RANK[l] + by))]!;
const ofBand = (b: Band | undefined): Level => (b === 'exceptional' ? 'beyond' : b === 'strong' ? 'at' : b === 'working' ? 'near' : 'short');

export type FactorId = 'work' | 'relevance' | 'training' | 'fit' | 'availability' | 'roster' | 'reliability';
export interface Factor { id: FactorId; label: string; level: Level; words: string }

export const FACTOR_LABEL: Readonly<Record<FactorId, string>> = {
  work: 'Your Work', relevance: 'Stage And Screen', training: 'Training And Experience', fit: 'Fit With His Department',
  availability: 'Availability', roster: 'Room On His List (Assumed)', reliability: 'Reliability',
};
/** A factor's label for an agent: a real one's department is "the department", and a real one has no room assumed. */
export const factorLabel = (agent: Agent, id: FactorId): string => (agent.real && id === 'fit' ? 'Fit With The Department' : FACTOR_LABEL[id]);

/**
 * ASSUMPTION, the game's, and the same for every real agent, never a fact about one: with no list known, the chances
 * read room as at the bar (`CHANCE.room.at`), and the room isn't a factor (from 2026-10-24, brief 25's Module 3, A5).
 */
export const REAL_ROOM: Level = 'at';
export const REAL_CHANCE_WORDS = 'How likely an office is to take you further is the game’s assumption, the same for every real agent in it: it isn’t a fact about this one, whose list the game doesn’t know.';

export interface Interest {
  factors: Factor[];
  /** How many factors are at the bar or beyond, and how many an approach needs. */
  atOrBeyond: number;
  needed: number;
  gate: boolean;
  /** The best band of the work his office has to go on. */
  band?: Band;
  /** The chance of being taken further against the year's other actors, and of an offer after a meeting kept. */
  chance: number;
  offerChance: number;
}

/** A piece of work his office has to go on: what it is, how it was judged, and whether it's stage or screen. */
interface Seen { what: string; band?: Band; medium: 'stage' | 'screen' }

/**
 * The work his office has to go on: the showcase's scenes as the School recorded them, once the School has followed
 * them up; the reel sent, or the current one; each job a referral came from. A night on stage he wasn't told of, and
 * a class piece, are never among them.
 */
function workSeen(person: Person, rel: AgentRelation | undefined, reelId?: ProId): Seen[] {
  const pro = person.pro;
  const out: Seen[] = [];
  const showcase = pro?.showcase;
  if (showcase?.followUp && showcase.performed.length) out.push({ what: 'your showcase scenes, as the School recorded them', band: bestBand(showcase.performed.map((p) => p.band)), medium: 'stage' });
  const reel = (reelId ? pro?.materials.find((m) => m.id === reelId && m.kind === 'reel') : undefined) ?? currentOf(pro, 'reel');
  if (reel?.pieces?.length) out.push({ what: 'your reel', band: bestBand(reel.pieces.map((p) => p.band)), medium: 'screen' });
  for (const r of rel?.referrals ?? []) {
    const e = pro?.engagements.find((x) => x.id === r.engagementId);
    const medium = e ? projectById(e.projectId)?.medium : undefined;
    out.push({ what: `your work as ${r.job}, which ${r.by} referred you from`, band: r.band, medium: medium === 'stage' ? 'stage' : 'screen' });
  }
  return out;
}

/** The field of his department a project's kind is in. */
const FIELD_OF: Readonly<Record<ProjectKind, AgentField>> = {
  'off-broadway': 'off-broadway', lort: 'regional', 'network-drama': 'television', 'low-budget': 'film', 'ultra-low-budget': 'film', 'student-film': 'film', 'non-union-short': 'film', 'overseas-feature': 'film', 'network-comedy': 'television',
  // From 2026-10-24 (brief 25's Module 5), the kinds the workflows brought, by their medium, a musical as a regional theater's.
  'multicam-comedy': 'television', 'animated-series': 'television', 'animated-feature': 'film', dub: 'television', 'capture-feature': 'film', documentary: 'television',
  musical: 'regional', 'action-feature': 'film', 'limited-series': 'television', 'serialized-drama': 'television', 'serialized-comedy': 'television', anthology: 'television', 'tv-movie': 'television',
};

/** The billing the record shows the player in: the biggest part among the School's credits and the jobs, a featured one with none. */
export function billingOf(person: Person): PartSize {
  const sizes: PartSize[] = [];
  for (const c of person.school?.credits ?? []) if (c.size) sizes.push(c.size);
  for (const e of person.pro?.engagements ?? []) { const t = projectById(e.projectId); if (t) sizes.push(t.role.size === 'co-star' ? 'featured' : t.role.size); }
  return sizes.includes('lead') ? 'lead' : sizes.includes('supporting') ? 'supporting' : 'featured';
}

const BILLING_WORDS: Readonly<Record<PartSize, string>> = { lead: 'a lead', supporting: 'a supporting actor', featured: 'a featured actor' };

/**
 * A year's room on his list, as simulation data: from one to three openings across the roster's types, drawn for the
 * agent and the year (decider `pro.roster`). The game's assumption, never his (`agent.roster.words`).
 */
export function rosterFor(sim: Simulation, agent: Agent, year: number): RosterOpening[] {
  const roster = agent.roster;
  // A real agent's list isn't known, so there's nothing to draw (Module 3, REP-10).
  if (!roster) return [];
  const rng = sim.rng('pro.agent', agent.id, 'roster', year);
  const [least, most] = roster.openingsPerYear;
  const n = least + Math.floor(rng.next() * (most - least + 1));
  const counts = new Map<number, number>();
  for (let i = 0; i < n; i += 1) { const k = Math.floor(rng.next() * roster.types.length); counts.set(k, (counts.get(k) ?? 0) + 1); }
  return [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([k, count]) => ({ year, type: roster.types[k]!, count }));
}

/** An opening in words: "one lead aged 22 to 30". */
const openingWords = (o: RosterOpening): string => `${o.count === 1 ? 'one' : o.count === 2 ? 'two' : 'three'} ${o.type.billing === 'lead' ? (o.count === 1 ? 'lead' : 'leads') : o.type.billing === 'supporting' ? (o.count === 1 ? 'supporting actor' : 'supporting actors') : (o.count === 1 ? 'featured actor' : 'featured actors')} aged ${o.type.ages[0]} to ${o.type.ages[1]}`;

/** How the year's openings meet a billing and an age: two or more that fit are beyond the bar, one at it, one of the age but another billing near it. */
export function roomLevel(openings: readonly RosterOpening[], age: number, billing: PartSize): Level {
  const ages = (o: RosterOpening) => age >= o.type.ages[0] && age <= o.type.ages[1];
  const fits = openings.filter((o) => ages(o) && o.type.billing === billing).reduce((n, o) => n + o.count, 0);
  return fits >= 2 ? 'beyond' : fits === 1 ? 'at' : openings.some(ages) ? 'near' : 'short';
}

/** The degree's expected day: Commencement in May of the class's year, as the profile's availability says it. */
function degreeExpected(person: Person, zone: string): Instant | undefined {
  const school = person.school;
  if (!school) return undefined;
  const year = school.classOf + Math.ceil((school.offset ?? 0) / 2);
  return instantFromZoned({ year, month: 5, day: 18, hour: 12, minute: 0, second: 0 }, zone);
}

/** ASSUMPTION: the last months at the School, when an office counts a student as nearly free: 150 days before the degree. */
const FINAL_MONTHS_DAYS = 150;

/**
 * His office's interest, factor by factor, on the record at `at`: each a level and its words. `reelId` is the reel that
 * was sent, where one was.
 */
export function interestOf(sim: Simulation, person: Person, agent: Agent, at: Instant, reelId?: ProId): Interest {
  const pro = person.pro;
  const rel = relationOf(person, agent.id);
  const agency = agencyOf(agent);
  const zone = officeZone(agent);
  const factors: Factor[] = [];
  const add = (id: FactorId, level: Level, words: string) => factors.push({ id, label: factorLabel(agent, id), level, words });

  // 1. The work his office has to go on, by its best band; and, from 2026-10-25 (brief 27's K7, loop 47: "appropriate
  // representatives and casting processes can consider it"), the work's recognition, which raises it a level once, however
  // many nominations, wins and selections there are, so the same award never stacks.
  const seen = workSeen(person, rel, reelId);
  const band = bestBand(seen.map((s) => s.band));
  const said = seen.map((s) => `${s.what}${s.band ? `, at best ${BAND_LABEL[s.band]}` : ', not judged'}`);
  const honors = honorsOf(person);
  const recognized = honors.length ? ` It can see your recognition too: ${honors[0]!.what}${honors.length > 1 ? `, and ${honors.length === 2 ? 'one other' : `${countWords(honors.length - 1)} others`}` : ''}.` : '';
  add('work', honors.length ? raised(ofBand(band), 1) : ofBand(band), (seen.length === 1 ? `${capital(agent.words.office)} has ${said[0]}.`
    : seen.length ? `${capital(agent.words.office)} has ${countWords(seen.length)} things to go on: ${said.slice(0, -1).join('; ')}; and ${said.at(-1)}.`
      : `${capital(agent.words.office)} has none of your work to go on yet. ${shows(agent) ? 'A reel, the School’s follow-up after the showcase or a referral would give it some.' : 'A reel or a referral would give it some.'}`) + recognized);

  // 2. Stage and screen: how much of his department's two sides the record shows.
  const credits = pro?.credits ?? [];
  const professional = credits.filter((c) => c.kind !== 'student-film');
  const stage = seen.some((s) => s.medium === 'stage') || (person.school?.credits?.length ?? 0) > 0 || credits.some((c) => c.medium === 'stage');
  const screen = seen.some((s) => s.medium === 'screen') || credits.some((c) => c.medium !== 'stage');
  add('relevance', stage && screen ? (professional.length ? 'beyond' : 'at') : stage || screen ? 'near' : 'short',
    stage && screen ? `Your record shows stage and screen work${professional.length ? ', with professional credits' : ''}: both sides of ${agent.words.department}.`
      : stage ? `Your record shows stage work so far. Recorded screen work on a reel would show the other side of ${agent.words.department}.`
        : screen ? `Your record shows screen work so far. Stage work would show the other side of ${agent.words.department}.`
          : 'Your record shows no stage or screen work yet.');

  // 3. Training and experience: the degree as the record has it, raised a level for each professional credit.
  const training = trainingOf(person);
  const base: Level = training.status === 'completed' ? 'at' : training.status === 'candidate' ? (yearOfStudy(person) >= 3 ? 'near' : 'short') : training.status === 'left' ? 'near' : 'short';
  add('training', raised(base, Math.min(2, professional.length)), `${training.words} ${professional.length ? `You have ${counted(professional.length, 'professional credit')}.` : 'You have no professional credits yet.'}`);

  // 4. Fit with his department's published fields: a professional credit in them, or training as an actor for them.
  const fields = agency.department.fields;
  const inFields = professional.filter((c) => {
    const kind = c.engagementId ? projectById(pro?.engagements.find((e) => e.id === c.engagementId)?.projectId ?? '')?.kind : undefined;
    const field: AgentField = kind ? FIELD_OF[kind] : c.medium === 'stage' ? 'regional' : c.medium;
    return fields.includes(field);
  });
  const tapes = Object.entries(person.briefs ?? {}).flatMap(([id, r]) => r.takes.map(() => BRIEF_BY_ID[id]?.medium));
  const voiceOnly = tapes.length > 0 && tapes.every((m) => m !== 'camera') && !person.school && !credits.length;
  const fieldsSaid = spokenList(fields.map((f) => FIELD_LABEL[f]));
  add('fit', inFields.length ? 'beyond' : person.school ? 'at' : voiceOnly ? 'short' : 'near',
    inFields.length ? `You have professional work in ${agent.words.department}’s fields (${fieldsSaid}).`
      : person.school ? `Your training as an actor is for the fields ${agent.words.department} covers: ${fieldsSaid}.`
        : voiceOnly ? `Your recorded work is voice work, which ${agent.words.department} doesn’t cover.`
          : `${capital(agent.words.department)} covers ${fieldsSaid}, and your record has no work in them yet.`);

  // 5. Availability: at the School until the degree or free, permission to work, and where you're based.
  const free = availabilityOf(person, at);
  const permit = eligibilityOf(person, at);
  const degree = degreeExpected(person, zone);
  const finalMonths = free.inSchool && degree !== undefined && degree - at <= FINAL_MONTHS_DAYS * MS_DAY;
  const based = person.currentLocationId;
  const near = TRAVEL_MINUTES[based] !== undefined;
  const availability: Level = !permit.authorized ? (free.inSchool && !finalMonths ? 'short' : 'near') : !free.inSchool ? (near ? 'beyond' : 'at') : finalMonths ? 'at' : 'near';
  const where = CITIES.get(based)?.name ?? 'somewhere else';
  add('availability', availability, `${free.words} ${permit.words} You’re based in ${where}${near ? `, within reach of ${agent.words.office} in ${agency.office.city}` : `, away from ${agent.words.office} in ${agency.office.city}`}.`);

  // 6. Room on his list: this year's openings, as the game assumes them, against your billing and age. A real agent's
  // list isn't known, so for one it's no factor and the chances read `REAL_ROOM`.
  const year = zonedParts(at, zone).year;
  const openings = rosterFor(sim, agent, year);
  const age = Math.floor(yearsSince(person.birthInstant, at));
  const billing = billingOf(person);
  const ages = (o: RosterOpening) => age >= o.type.ages[0] && age <= o.type.ages[1];
  const fits = openings.filter((o) => ages(o) && o.type.billing === billing).reduce((n, o) => n + o.count, 0);
  const roster = agent.roster ? roomLevel(openings, age, billing) : REAL_ROOM;
  if (agent.roster) add('roster', roster, `Assumed for ${year}: room for ${spokenList(openings.map(openingWords))}. Your record shows you as ${BILLING_WORDS[billing]}, aged ${age}, so ${fits ? `${fits === 1 ? 'one opening fits' : `${countWords(fits)} openings fit`}` : openings.some(ages) ? 'an opening fits your age but not your billing' : 'none of them fits'}. ${agent.roster.words}`);

  // 7. Reliability, from real events: meetings kept or missed, material sent when asked, auditions he set up and missed,
  // problems on a job. Until 2026-10-21 `late` counted every `problem` on the relationship, where the work loop also
  // copies a missed work day and the problems on his submissions, so one missed day counted twice, the second time as
  // material not sent (found by the playthroughs). Each is counted once now, from where it's kept.
  const kept = rel ? countOf(rel, 'meeting-kept') : 0;
  const missed = rel ? countOf(rel, 'meeting-missed') : 0;
  const supplied = rel ? countOf(rel, 'supplied') : 0;
  const late = rel ? countOf(rel, 'request-missed') : 0;
  const auditions = (pro?.opportunities ?? []).filter((o) => o.via === 'agent' && o.agentId === agent.id && o.history.some((h) => h.kind === 'problem' && h.key?.endsWith(':missed'))).length;
  const onJobs = (pro?.engagements ?? []).reduce((n, e) => n + countOf(e, 'problem'), 0);
  const against = missed + late + auditions + onJobs;
  const reliability: Level = against >= 2 ? 'short' : against === 1 ? 'near' : kept + supplied > 0 ? 'beyond' : 'at';
  const events = [
    kept ? `kept ${counted(kept, 'meeting')} with ${agent.words.office}` : '', missed ? `missed ${counted(missed, 'meeting')}` : '',
    supplied ? `sent what it asked for ${supplied === 1 ? 'once' : counted(supplied, 'time')}, on time` : '', late ? `didn’t send what it asked for ${late === 1 ? 'once' : counted(late, 'time')}` : '',
    auditions ? `missed ${counted(auditions, 'audition')} ${agent.words.he} set up` : '', onJobs ? `had ${counted(onJobs, 'problem')} on a job` : '',
  ].filter(Boolean);
  add('reliability', reliability, events.length ? `You ${spokenList(events)}.` : `You haven’t had a meeting or a request from ${agent.words.office} yet, and your record has no problems on a job.`);

  const atOrBeyond = factors.filter((f) => LEVEL_RANK[f.level] >= LEVEL_RANK.at).length;
  return { factors, atOrBeyond, needed: GATE, gate: atOrBeyond >= GATE, ...(band ? { band } : {}), ...chancesFor(band, roster) };
}

/** The competition's chances, from the work's best band and the room on his list: never certain, and none with no work. */
export function chancesFor(band: Band | undefined, room: Level): { chance: number; offerChance: number } {
  if (!band) return { chance: 0, offerChance: 0 };
  return { chance: Math.min(CHANCE.most, CHANCE.interest[band] * CHANCE.room[room]), offerChance: Math.min(CHANCE.most, CHANCE.offer[band] * CHANCE.room[room]) };
}

// ---------------------------------------------------------------------------------------------------------------------
// The draws, and the decisions they make
// ---------------------------------------------------------------------------------------------------------------------

/** The draw for an approach's step: the same person, agent, approach and step always draw the same number. */
export function drawOf(sim: Simulation, person: Person, agent: Agent, approach: number, step: 'interest' | 'offer'): number {
  return sim.rng('pro.agent', person.id, agent.id, `approach-${approach}`, step).next();
}

export type ReplyOutcome = 'meeting' | 'request' | 'pass' | 'silence';

/**
 * His office's answer to an approach: a meeting where the School passed on its request; otherwise, with enough factors
 * at the bar, the draw against the chance takes it further, to a request for what's missing first where something is,
 * or a meeting. What isn't taken further is a pass, or, for the last `CHANCE.unanswered` of the draw's range, no answer.
 */
export function replyOutcome(interest: Interest, u: number, o: { asked?: boolean; requestable: readonly AgentMaterial[] }): ReplyOutcome {
  if (o.asked) return 'meeting';
  if (interest.gate && u < interest.chance) return o.requestable.length ? 'request' : 'meeting';
  const p = interest.gate ? interest.chance : 0;
  return u >= p + (1 - p) * (1 - CHANCE.unanswered) ? 'silence' : 'pass';
}

/** After a meeting kept: an offer, with enough at the bar and the draw under the offer's chance, or a pass. */
export const offerOutcome = (interest: Interest, u: number): 'offer' | 'pass' => (interest.gate && u < interest.offerChance ? 'offer' : 'pass');

/** Whether his office asks the School to pass on a request to meet, from the follow-up's factors and the draw. */
export const followUpAsks = (interest: Interest, u: number): boolean => interest.gate && u < interest.chance;

/** What the materials check says his office could ask for: a missing reel, old headshots, a résumé behind the record. */
function requestable(person: Person, at: Instant): AgentMaterial[] {
  return materialsCheck(person, 'representation', at)
    .filter((p) => !p.blocking && ((p.kind === 'reel' && p.problem === 'missing') || (p.kind === 'headshot' && p.problem === 'out-of-date') || (p.kind === 'resume' && p.problem === 'behind')))
    .map((p) => p.kind as AgentMaterial);
}

const KIND_WORDS: Readonly<Record<AgentMaterial, string>> = { headshot: 'new headshots', resume: 'an up-to-date résumé', reel: 'a reel' };

/** A problem the materials check found, as the history says it afterwards. */
const FOUND: Readonly<Record<MaterialProblem['problem'], (kind: MaterialKind) => string>> = {
  missing: (kind) => (kind === 'reel' ? 'you had no reel' : kind === 'headshot' ? 'you had no headshots' : 'you had no résumé'),
  'out-of-date': () => 'your headshots were more than two years old',
  behind: () => 'your résumé was behind your record',
  'tapes-only': () => 'your reel held only self-tapes',
  'newer-work': () => 'you’d recorded more since you cut your reel',
};

/** Copies the decision's reasons into the relation, for Why It Went This Way. */
function keepWhy(sim: Simulation, rel: AgentRelation, step: string, outcome: string, interest: Interest): void {
  rel.why = {
    at: sim.now, step, outcome,
    factors: interest.factors.map((f) => ({ id: f.id, label: f.label, level: f.level, words: f.words })),
    // The chance the step drew against: an offer's after a meeting, being taken further before one.
    atOrBeyond: interest.atOrBeyond, needed: interest.needed, ...(interest.gate ? { chance: step === 'decision' ? interest.offerChance : interest.chance } : {}),
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Something new, and the cooling-off time
// ---------------------------------------------------------------------------------------------------------------------

/**
 * What an approach puts before his office, by key: each professional credit, the reel's best band and every band below
 * it (so a better reel is new and an equal one isn't), each referral, the training's standing, and the showcase once the
 * School has followed it up. A new approach needs a key the last decision didn't have (ASSUMPTION, the design's rule).
 */
export function caseKeys(person: Person, rel: AgentRelation | undefined): string[] {
  const pro = person.pro;
  const keys = (pro?.credits ?? []).map((c) => `credit:${c.id}`);
  const reel = bestBand((currentOf(pro, 'reel')?.pieces ?? []).map((p) => p.band));
  if (reel) for (const b of BANDS.slice(0, BAND_RANK[reel] + 1)) keys.push(`reel:${b}`);
  for (const r of rel?.referrals ?? []) keys.push(`referral:${r.engagementId}`);
  keys.push(`training:${trainingOf(person).status}`);
  if (pro?.showcase?.followUp && pro.showcase.performed.length) keys.push(`showcase:${pro.showcase.term}`);
  return keys;
}

/** What's on the record now that the last decision didn't consider. */
export const newSince = (person: Person, rel: AgentRelation): string[] => {
  const had = new Set(rel.considered?.keys ?? []);
  return caseKeys(person, rel).filter((k) => !had.has(k));
};

function closeApproach(sim: Simulation, person: Person, rel: AgentRelation, stage: RelationStage, why: 'pass' | 'silence' | 'declined' | undefined): void {
  setStage(sim, rel, stage);
  delete rel.request;
  rel.considered = { at: sim.now, keys: caseKeys(person, rel) };
  if (why) rel.cooldown = { until: addDays(sim.now, COOLDOWN_DAYS[why], officeZone(agentById(rel.agentId)!)), why, needsNew: true };
}

// ---------------------------------------------------------------------------------------------------------------------
// The refusals: each said under its control before it's pressed, and thrown in the same words by its command
// ---------------------------------------------------------------------------------------------------------------------

const mustRead = (agent: Agent) => `Read the notice about ${agent.name} first: it’s at the top of ${agent.words.his} panel.`;

/** Why the notice can't be marked read: it already is. */
export function noticeRefusal(sim: Simulation, person: Person, agent: Agent): string | undefined {
  const rel = relationOf(person, agent.id);
  return rel?.noticeShownAt !== undefined ? `You read it on ${formatDate(rel.noticeShownAt, sim.zone)}. Read The Notice Again shows it whenever you want it.` : undefined;
}

/** Why an approach is under way or held, in words, or nothing. */
function underWay(sim: Simulation, agent: Agent, rel: AgentRelation): string | undefined {
  const z = sim.zone;
  if (rel.stage === 'represented') return `${agent.name} represents you already.`;
  if (rel.stage === 'sent' || rel.stage === 'waiting') return `Your materials went to ${agent.words.office} on ${formatDate(rel.stageAt, z)}, and its answer is still to come.`;
  if (rel.stage === 'requested') return `${capital(agent.words.office)} has asked for more. Send What ${officeTitle(agent)} Asked For sends it.`;
  if (rel.stage === 'meeting') return `${capital(agent.words.office)} has a meeting set with you.`;
  if (rel.stage === 'deciding') return `${capital(agent.words.office)} is deciding, after your meeting.`;
  if (rel.stage === 'offered') return `${hasDone(agent)} offered you an agreement. Read it under The Agreement.`;
  return undefined;
}

/** The cooling-off time still to run, in words, or nothing. */
function tooSoon(sim: Simulation, rel: AgentRelation): string | undefined {
  const agent = agentById(rel.agentId)!;
  const c = rel.cooldown;
  if (!c || sim.now >= c.until) return undefined;
  const z = sim.zone;
  const lapsed = rel.history.some((e) => e.kind === 'lapsed' && e.at >= rel.stageAt);
  const what = c.why === 'pass' ? `${capital(agent.words.office)} passed on ${formatDate(rel.stageAt, z)}`
    : c.why === 'silence' ? `${capital(agent.words.office)} didn’t answer your last approach, and the ${SILENCE_WORDS} ran out on ${formatDate(rel.stageAt, z)}`
      : lapsed ? `You let ${agent.words.his} offer lapse on ${formatDate(rel.stageAt, z)}` : `You declined ${agent.words.his} offer on ${formatDate(rel.stageAt, z)}`;
  return `${what}. In the game ${agent.words.office} looks again only after ${COOLDOWN_WORDS[c.why]}, from ${formatDate(c.until, z)}, and then only at something new.`;
}

/** Nothing new since the last decision, in words, or nothing. */
function nothingNew(sim: Simulation, person: Person, rel: AgentRelation): string | undefined {
  if (!rel.considered || newSince(person, rel).length) return undefined;
  const agent = agentById(rel.agentId)!;
  return `${capital(agent.words.office)} already looked at everything on your record, on ${formatDate(rel.considered.at, sim.zone)}. In the game a new approach needs something new for it to consider: a new credit, a better reel or a referral.`;
}

const blocking = (person: Person, at: Instant): string | undefined => {
  const b = materialsCheck(person, 'representation', at).filter((p) => p.blocking);
  return b.length ? b.map((p) => p.words).join(' ') : undefined;
};

/** Why the materials check can't be made now, or nothing: an incomplete submission is refused with what's missing. */
export function checkRefusal(sim: Simulation, person: Person, agent: Agent): string | undefined {
  const rel = relationOf(person, agent.id);
  if (rel?.noticeShownAt === undefined) return mustRead(agent);
  const busy = underWay(sim, agent, rel);
  if (busy) return busy;
  const done = rel.history.find((e) => e.key === `checked:${approachesOf(rel)}`);
  if (done) return `Your materials passed the check on ${formatDate(done.at, sim.zone)}.`;
  return blocking(person, sim.now);
}

/** The jobs a referral could come from: each finished engagement, its referrer, and why it can't refer you, where it can't. */
export function referrersOf(sim: Simulation, person: Person, agent: Agent): { engagementId: ProId; by: string; job: string; band?: Band; why?: string }[] {
  const rel = relationOf(person, agent.id);
  return (person.pro?.engagements ?? []).filter((e) => e.status === 'finished').map((e) => {
    const t = projectById(e.projectId);
    const credit = person.pro?.credits.find((c) => c.id === e.creditId);
    const band = credit?.band;
    const by = t?.casting ?? 'the production';
    const job = `${e.role} in ${t?.project ?? 'a project'}`;
    const used = rel?.referrals?.find((r) => r.engagementId === e.id);
    const why = used ? `${capital(used.by)} referred you on ${formatDate(used.at, sim.zone)}.`
      : !band ? 'The work on that job wasn’t judged, so a referral has nothing to go on.'
        : BAND_RANK[band] < BAND_RANK[REFERRAL_BAND] ? `A referral needs work judged ${BAND_LABEL[REFERRAL_BAND]} or better in the game, and your work as ${e.role} was ${BAND_LABEL[band]}.` : undefined;
    return { engagementId: e.id, by, job, ...(band ? { band } : {}), ...(why ? { why } : {}) };
  });
}

const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Why a referral can't be asked for from this job now, or nothing. */
export function referralRefusal(sim: Simulation, person: Person, agent: Agent, engagementId: string): string | undefined {
  const rel = relationOf(person, agent.id);
  if (rel?.noticeShownAt === undefined) return mustRead(agent);
  if (!countOf(rel, 'checked')) return 'Check your materials first. A referral passes them on.';
  const busy = underWay(sim, agent, rel);
  if (busy) return busy;
  const soon = tooSoon(sim, rel);
  if (soon) return soon;
  const job = referrersOf(sim, person, agent).find((r) => r.engagementId === engagementId);
  if (!job) return 'A referral comes from a job you’ve finished, and that isn’t one.';
  // The materials aren't checked again here: a referral needs a passed check, and materials are never taken away (the
  // core keeps the last six of each kind), so a check here could never refuse; its mutation survived, and it went.
  return job.why;
}

/** Whether the School's passed-on request to meet still stands for this agent, and until when. */
export function askedToMeet(person: Person, agent: Agent, at: Instant): Instant | undefined {
  const f = person.pro?.showcase?.followUp;
  if (!f || !f.agents.includes(agent.id)) return undefined;
  const rel = relationOf(person, agent.id);
  if (rel?.via?.route !== 'showcase' || approachesOf(rel) > 0) return undefined;
  const until = addDays(f.at, AGENT_TIMES.askedStandsDays, officeZone(agent));
  return at < until ? until : undefined;
}

/** Why materials can't be sent to his office now, or nothing. An unsolicited one is refused in the agency's rule. */
export function sendRefusal(sim: Simulation, person: Person, agent: Agent): string | undefined {
  const rel = relationOf(person, agent.id);
  if (rel?.noticeShownAt === undefined) return mustRead(agent);
  const busy = underWay(sim, agent, rel);
  if (busy) return busy;
  if (!rel.via) {
    const agency = agencyOf(agent);
    return `${agency.policy.words} It sees your materials only through ${routesWords(agent)}.`;
  }
  if (!countOf(rel, 'checked')) return 'Check your materials first. Check Your Materials says whether an approach has what it needs.';
  // No materials check here either, for the referral's reason: a send needs a passed check, and nothing takes the
  // headshots or the résumé away again.
  return tooSoon(sim, rel) ?? nothingNew(sim, person, rel);
}

/** Why what his office asked for can't be sent yet, or nothing. */
export function supplyRefusal(sim: Simulation, person: Person, agent: Agent): string | undefined {
  const rel = relationOf(person, agent.id);
  const r = rel?.request;
  if (!rel || rel.stage !== 'requested' || !r) return `${capital(agent.words.office)} hasn’t asked you for anything.`;
  const pro = person.pro;
  const short: string[] = [];
  for (const kind of r.what) {
    if (kind === 'reel' && !currentOf(pro, 'reel')) short.push('You haven’t cut a reel yet. Cut A Reel is on the Portfolio tab.');
    if (kind === 'headshot' && (currentOf(pro, 'headshot')?.made ?? 0) < r.at) short.push(`Your headshots are still the ones from ${formatDate(currentOf(pro, 'headshot')?.made ?? r.at, sim.zone)}. Book A Headshot Session on the Portfolio tab for new ones.`);
    if (kind === 'resume' && materialsCheck(person, 'representation', sim.now).some((p) => p.kind === 'resume')) short.push('Your résumé is still behind your record. Update Your Résumé is on the Portfolio tab.');
  }
  return short.length ? short.join(' ') : undefined;
}

/** The meeting set with his office, where there is one, and its item on the calendar. */
export function meetingOf(sim: Simulation, person: Person, agent: Agent): { meeting: NonNullable<AgentRelation['meeting']>; item?: ScheduledItem } | undefined {
  const m = relationOf(person, agent.id)?.meeting;
  if (!m) return undefined;
  const item = sim.universe.scheduled.find((i) => i.kind === MEETING_KIND && i.status === 'pending' && i.refId === m.id);
  return { meeting: m, ...(item ? { item } : {}) };
}

/** Why the meeting can't be moved, or nothing: once, before it happens. */
export function moveRefusal(sim: Simulation, person: Person, meetingId: string): string | undefined {
  const agent = AGENTS.find((a) => relationOf(person, a.id)?.meeting?.id === meetingId);
  const found = agent ? meetingOf(sim, person, agent) : undefined;
  if (!agent || !found || found.meeting.status !== 'set') return `There’s no meeting with ${agent?.words.office ?? 'an agent’s office'} to move.`;
  if (!found.item) return 'That meeting has already happened.';
  if (found.meeting.moved >= AGENT_TIMES.movesAllowed) return `You moved this meeting once already. In the game ${agent.words.office} moves a meeting once, and it stays on ${formatDateTime(found.meeting.at, sim.zone)}.`;
  return undefined;
}

/** The agreement he's offered and the player hasn't answered, where there is one. */
export const offeredAgreement = (person: Person, agent: Agent): Agreement | undefined =>
  person.pro?.agreements.find((a) => a.agentId === agent.id && a.status === 'offered');

/** The agreement with him in force now, where there is one (the core's one rule). */
export const agreementInForce = (person: Person, agent: Agent, at: Instant): Agreement | undefined => {
  const a = activeAgreement(person, at);
  return a?.agentId === agent.id && a.status === 'accepted' ? a : undefined;
};

/** Why the offered agreement can't be accepted or declined now, or nothing. */
export function answerRefusal(sim: Simulation, person: Person, agent: Agent): string | undefined {
  const a = offeredAgreement(person, agent);
  if (!a) return `${capital(agent.words.he)} hasn’t offered you an agreement.`;
  if (sim.now >= a.standsUntil) return `The offer stood until ${formatDate(a.standsUntil, sim.zone)}.`;
  return undefined;
}

/**
 * Why the offered agreement can't be signed now, or nothing: the answer's own refusal, then one agent at a time (from
 * 2026-10-24, brief 25's Module 3, A6, REP-11). Every agent in the game covers the same fields from New York, so two
 * agreements in force would both claim commission on the same work; the work loop and the pay read one
 * (`activeAgreement`), and this keeps it one. Declining it is never held up by another.
 */
export function signRefusal(sim: Simulation, person: Person, agent: Agent): string | undefined {
  const no = answerRefusal(sim, person, agent);
  if (no) return no;
  const a = activeAgreement(person, sim.now);
  if (!a || a.agentId === agent.id) return undefined;
  const other = agentById(a.agentId);
  return `${other ? `${other.name} at ${agencyOf(other).name}` : 'Another agent'} represents you until ${formatDate(a.endsAt!, sim.zone)}, for the same kinds of work. In the game you have one agent at a time, so this agreement can’t start while that one runs. You can decline it, or end the other first.`;
}

/** The last bona fide offer of covered work through him in the agreement's term, from the work's record. */
function lastOffer(person: Person, agreement: Agreement, at: Instant): Instant | undefined {
  const offers = (person.pro?.opportunities ?? [])
    .filter((o) => o.via === 'agent' && o.agentId === agreement.agentId && o.offer && o.offer.at >= (agreement.signedAt ?? Infinity) && o.offer.at <= at)
    .map((o) => o.offer!.at);
  return offers.length ? Math.max(...offers) : undefined;
}

/** Days of covered work under the agreement in the window, counted by calendar day from the engagements' days. */
export function coveredDays(person: Person, agreement: Agreement, from: Instant, to: Instant, zone: string): number {
  const days = new Set<string>();
  const key = (t: Instant) => { const p = zonedParts(t, zone); return `${p.year}-${p.month}-${p.day}`; };
  for (const e of person.pro?.engagements ?? []) {
    if (e.agreementId !== agreement.id || e.status === 'canceled') continue;
    for (const d of e.days) {
      const start = Math.max(d.from, from);
      const end = Math.min(d.to, to);
      if (start > end) continue;
      // Each calendar date the span touches, its last among them whatever the hour it ends.
      const last = key(end);
      for (let t = start; ; t = addDays(t, 1, zone)) { const k = key(t); days.add(k); if (k === last || t > end) break; }
    }
  }
  return days.size;
}

/**
 * Calendar days in the window she was employed on covered work under the agreement, each engagement from its first work
 * day to its last, days between them included: Equity's 90 days are extended by them (S29). From 2026-10-21 (the
 * audit's fourth reading): until then the 90 days ran from the last offer whatever the employment, so once a long run
 * ended its actor could end the agreement sooner than the rule lets them. A canceled engagement counts none, as in
 * `coveredDays`. ASSUMPTION: S29's other extensions, while unavailable or incapacitated, aren't counted.
 */
function employedDays(person: Person, agreement: Agreement, from: Instant, to: Instant, zone: string): number {
  const days = new Set<string>();
  const key = (t: Instant) => { const p = zonedParts(t, zone); return `${p.year}-${p.month}-${p.day}`; };
  for (const e of person.pro?.engagements ?? []) {
    if (e.agreementId !== agreement.id || e.status === 'canceled' || !e.days.length) continue;
    const start = Math.max(e.days[0]!.from, from);
    const end = Math.min(e.days.at(-1)!.to, to);
    if (start > end) continue;
    const last = key(end);
    for (let t = start; ; t = addDays(t, 1, zone)) { const k = key(t); days.add(k); if (k === last || t > end) break; }
  }
  return days.size;
}

/**
 * Whether she's employed now on covered work under the agreement, from its first work day until it's finished: Equity's
 * rule doesn't let it be ended then ("You may not terminate if you are currently employed", S27). Until 2026-10-21 this
 * read only a work day's own hours, which the clock passes whole once the player goes at its stop, so no player could
 * meet the refusal (found by the audit's third reading, its mutation R9 surviving). ASSUMPTION: the employment begins on
 * the first work day, not at the booking.
 */
const workingNow = (person: Person, agreement: Agreement, at: Instant): boolean =>
  (person.pro?.engagements ?? []).some((e) => e.agreementId === agreement.id && !finished(e) && (e.days[0]?.from ?? Infinity) <= at);

export type EndHow = Exclude<EndedHow, 'term'>;

/**
 * Why the agreement can't be ended this way now, or nothing. By agreement, at any time (S2, ASSUMPTION that his office
 * agrees to a release asked for); with no bona fide offer of covered work through him in 90 days, extended by the days
 * employed on covered work (`employedDays`), and not while working (Equity's, S29 and S27: "You may not terminate if you
 * are currently employed"); after 151 days, with fewer than ten
 * days of covered work in the last 91 (SAG-AFTRA's, S2). Equity's rule asks the offer to be for four weeks at the
 * actor's usual salary: the agreement's own words say a real offer of covered work through him, and the game counts any
 * he secured. Until 2026-10-21 its Ending It term and the ending's record left out "through him", which the refusal and
 * the guide said, so the term promised more than the button read (the app's second walk): an offer on the actor's own
 * submission, passed on by him, doesn't count, as S29's "the Agent fails to secure" has it.
 */
export function endRefusal(sim: Simulation, person: Person, agent: Agent, how: EndHow): string | undefined {
  const a = agreementInForce(person, agent, sim.now);
  if (!a) return `You’re not represented by ${agent.words.him}.`;
  const z = sim.zone;
  const zone = officeZone(agent);
  if (how === 'no-offer') {
    if (workingNow(person, a, sim.now)) return 'You’re doing covered work now, and Equity’s rule doesn’t let you end it while you are.';
    const last = lastOffer(person, a, sim.now);
    const since = last ?? a.signedAt!;
    const employed = employedDays(person, a, since, sim.now, zone);
    const from = addDays(since, AGREEMENT.noOfferDays + employed, zone);
    if (sim.now < from) return `Equity’s rule lets you end it once ${AGREEMENT.noOfferDays} days go by with no real offer of covered work through ${agent.words.him}. ${last ? `${capital(agent.words.his)} last came on ${formatDate(last, z)}` : `You signed on ${formatDate(a.signedAt!, z)}`}${employed ? `, and the ${counted(employed, 'day')} you were employed on covered work since don’t count toward them` : ''}, so that’s from ${formatDate(from, z)}.`;
  }
  if (how === 'too-little-work') {
    const from = addDays(a.signedAt!, AGREEMENT.sag.waitDays, zone);
    if (sim.now < from) return `SAG-AFTRA’s rule lets you end it this way only after ${AGREEMENT.sag.waitDays} days, from ${formatDate(from, z)}.`;
    const n = coveredDays(person, a, sim.now - AGREEMENT.sag.windowDays * MS_DAY, sim.now, zone);
    if (n >= AGREEMENT.sag.fewerThanDays) return `You’ve had ${counted(n, 'day')} of covered work in the last ${AGREEMENT.sag.windowDays}, and SAG-AFTRA’s rule needs fewer than ${TEN}.`;
  }
  return undefined;
}

/** What an ended agreement leaves owed, in words (the pay's system computes the figures from the engagement's agreement). */
export function stillOwed(person: Person, agreement: Agreement): string {
  const agent = agentById(agreement.agentId)!;
  const live = (person.pro?.engagements ?? []).filter((e) => e.agreementId === agreement.id && e.pay.some((p) => !p.received && !p.deferred));
  const owed = live.length
    ? `Commission stays owed on the pay still to come from contracts you made while it ran: ${spokenList(live.map((e) => `${e.role} in ${projectById(e.projectId)?.project ?? 'a project'}`))}. It comes out of that pay when it’s paid.`
    : 'No pay is still to come from contracts you made while it ran, so no commission is still owed on them.';
  return `${owed} An offer ${agent.words.he} passed on while it ran that you accept within ${AGREEMENT.tailDays} days after it ended owes commission too.`;
}

/** SAG-AFTRA's fewer than ten days, in words. */
export const TEN = AGREEMENT.sag.fewerThanDays === 10 ? 'ten' : countWords(AGREEMENT.sag.fewerThanDays);
const endedWords = (agent: Agent): Readonly<Record<EndedHow, string>> => ({
  term: 'at the end of its year',
  agreement: 'by agreement',
  'no-offer': `by you, under Equity’s rule, after ${AGREEMENT.noOfferDays} days with no real offer of covered work through ${agent.words.him}`,
  'too-little-work': `by you, under SAG-AFTRA’s rule, with fewer than ${TEN} days of covered work in the last ${AGREEMENT.sag.windowDays}`,
});

// ---------------------------------------------------------------------------------------------------------------------
// Where it stands, in words, for the panel
// ---------------------------------------------------------------------------------------------------------------------

export const STAGE_LABEL: Readonly<Record<RelationStage | 'none', string>> = {
  none: 'Not In Touch', discovered: 'Notice Read', checked: 'Materials Checked', introduced: 'Introduced', sent: 'Materials Sent',
  waiting: 'Waiting', requested: 'Asked For More', meeting: 'Meeting Set', deciding: 'Deciding', offered: 'Agreement Offered',
  represented: 'Represented', passed: 'Passed', declined: 'Declined', ended: 'Ended', unanswered: 'No Answer',
};

/** When no answer counts as no, for the approach under way. */
function silenceDate(sim: Simulation, rel: AgentRelation): Instant | undefined {
  const item = sim.universe.scheduled.find((i) => (i.kind === SILENCE_KIND || i.kind === REPLY_KIND) && i.status === 'pending' && i.refId === rel.agentId);
  return item ? (item.payload.silenceAt as number | undefined) : undefined;
}

/** What to do next, in a sentence or two, for where the relation stands. */
export function nextStep(sim: Simulation, person: Person, agent: Agent): string {
  const rel = relationOf(person, agent.id);
  const z = sim.zone;
  if (rel?.noticeShownAt === undefined) return `Read the notice at the top of ${agent.words.his} panel, then press I’ve Read This.`;
  const asked = askedToMeet(person, agent, sim.now);
  switch (rel.stage) {
    case 'discovered': return 'Press Check Your Materials. It says whether an approach has what it needs.';
    case 'checked':
    case 'introduced':
      if (!rel.via) return `${capital(agent.words.office)} takes materials only through ${shows(agent) ? 'the School’s follow-up after the showcase or a referral' : 'a referral'}. Under How To Reach ${himTitle(agent)}, ask someone you’ve worked with for a referral.`;
      return asked ? `${capital(agent.words.office)} asked the School to pass on a request to meet you. Press Send Your Materials by ${formatDate(asked, z)}, and ${agent.words.office} sets a time.` : 'Press Send Your Materials.';
    case 'sent':
    case 'waiting': {
      const by = silenceDate(sim, rel);
      return `${rel.stage === 'sent' ? `${capital(agent.words.office)} usually answers within ${REPLY_WORDS}.` : `${capital(agent.words.office)} hasn’t answered in the usual ${REPLY_WORDS}.`}${by ? ` If there’s no answer by ${formatDate(by, z)}, that’s a no.` : ''} Both times are assumed in the game.`;
    }
    case 'requested': return `${capital(agent.words.office)} asked for ${spokenList(rel.request!.what.map((k) => KIND_WORDS[k]))} by ${formatDate(rel.request!.by, z)}. Make it on the Portfolio tab, then press Send What ${officeTitle(agent)} Asked For.`;
    case 'meeting': return `Be at the meeting on ${formatDateTime(rel.meeting!.at, z)}.${rel.meeting!.moved < AGENT_TIMES.movesAllowed ? ` If you can’t, Ask To Move moves it ${MOVE_WORDS}, once.` : ''}`;
    case 'deciding': {
      const d = sim.universe.scheduled.find((i) => i.kind === DECISION_KIND && i.status === 'pending' && i.refId === agent.id);
      return d ? `${capital(agent.words.office)} tells you its decision on ${formatDate(d.at, z)}.` : `${capital(agent.words.office)} is deciding.`;
    }
    case 'offered': { const a = offeredAgreement(person, agent); return a ? `Read the agreement under The Agreement, then accept or decline it by ${formatDate(a.standsUntil, z)}.` : 'Read the agreement under The Agreement.'; }
    case 'represented': { const a = agreementInForce(person, agent, sim.now); return a ? `${capital(agent.words.he)} represents you until ${formatDate(a.endsAt!, z)}. The Agreement says how it can end sooner.` : `${capital(agent.words.he)} represents you.`; }
    default: {
      const held = tooSoon(sim, rel) ?? nothingNew(sim, person, rel);
      return held ?? `You can approach ${agent.words.office} again: press Send Your Materials.`;
    }
  }
}

/** The history, newest first. */
export const historyOf = (person: Person, agent: Agent): ProEvent[] => [...(relationOf(person, agent.id)?.history ?? [])].reverse().sort((a, b) => b.at - a.at);

// ---------------------------------------------------------------------------------------------------------------------
// What happens: the steps the commands and the handlers share
// ---------------------------------------------------------------------------------------------------------------------

/** His office's answer, decided now on the record and the approach's draw, and everything it sets going. */
function answer(sim: Simulation, person: Person, agent: Agent, rel: AgentRelation, p: { approach: number; step: 'first' | 'after-request' | 'request-missed'; asked?: boolean; reelId?: ProId; from: Instant; silenceAt: Instant }): void {
  const z = sim.zone;
  const zone = officeZone(agent);
  const office = officeOf(agent);
  const interest = interestOf(sim, person, agent, sim.now, p.reelId);
  const u = drawOf(sim, person, agent, p.approach, 'interest');
  const outcome = replyOutcome(interest, u, { ...(p.asked ? { asked: true } : {}), requestable: p.step === 'first' ? requestable(person, sim.now) : [] });
  keepWhy(sim, rel, p.step === 'first' ? (p.asked ? 'asked' : 'reply') : p.step, outcome, interest);
  const key = `answer:${p.approach}:${p.step}`;
  if (outcome === 'request') {
    const what = requestable(person, sim.now);
    const by = onDayAt(sim.now, AGENT_TIMES.requestDays, 17, zone);
    rel.request = { id: sim.nextId('pro'), at: sim.now, what, by };
    setStage(sim, rel, 'requested');
    const words = spokenList(what.map((k) => KIND_WORDS[k]));
    note(sim, rel, 'requested', key, `${capital(agent.words.office)} asked for ${words} by ${formatDate(by, z)}.`, rel.request.id);
    sim.schedule({ at: by, kind: REQUEST_DUE_KIND, label: `Material Due At ${agencyOf(agent).name}`, category: 'career', priority: 40, refType: 'pro-agent', refId: agent.id, payload: { personId: person.id, agentId: agent.id, requestId: rel.request.id, approach: p.approach, reelId: p.reelId ?? null, silenceAt: p.silenceAt } });
    tell(sim, person, agent, `${whose(agent)} Asked For More`, `${capital(office)} has asked for ${words} by ${formatDate(by, z)}. Make ${what.length === 1 ? 'it' : 'them'} on the Career screen’s Portfolio tab, then press Send What ${officeTitle(agent)} Asked For on the Representation tab. If ${what.length === 1 ? 'it doesn’t' : 'they don’t'} come by then, ${agent.words.office} decides on what it has.`);
    return;
  }
  if (outcome === 'meeting') {
    const where = TRAVEL_MINUTES[person.currentLocationId] !== undefined ? 'office' : 'video';
    const at = onDayAt(sim.now, AGENT_TIMES.meetingAfterDays, AGENT_TIMES.meetingHour, zone, true);
    rel.meeting = { id: sim.nextId('pro'), at, where, moved: 0, status: 'set' };
    setStage(sim, rel, 'meeting');
    scheduleMeeting(sim, person, agent, rel);
    const place = where === 'office' ? `at ${agencyOf(agent).name}’s ${agencyOf(agent).office.city} office` : 'by video';
    note(sim, rel, 'meeting-set', key, `${capital(agent.words.office)} ${p.asked ? 'set the meeting it asked for' : 'asked to meet you'}: ${formatWeekdayDate(at, z)} at ${formatTime(at, z)}, ${place}.`, rel.meeting.id);
    const trip = where === 'office' ? ` It’s on your calendar with ${tripWords(TRAVEL_MINUTES[person.currentLocationId]!)} to get there from ${CITIES.get(person.currentLocationId)?.name ?? 'where you are'}, a time the game assumes.` : ' It’s on your calendar.';
    tell(sim, person, agent, p.asked ? `A Meeting Is Set At ${atAgency(agent)}` : `${whose(agent)} Asked To Meet You`, `${capital(office)} ${p.asked ? 'has set the meeting it asked the School to pass on' : 'has asked to meet you'}: ${formatWeekdayDate(at, z)} at ${formatTime(at, z)}, ${place}.${trip} If you can’t make it, Ask To Move on the Representation tab moves it ${MOVE_WORDS}, once.`, 70);
    return;
  }
  if (outcome === 'pass') {
    closeApproach(sim, person, rel, 'passed', 'pass');
    note(sim, rel, 'passed', key, `${capital(agent.words.office)} passed${p.step === 'request-missed' ? ', deciding on what it had' : ''}.`);
    tell(sim, person, agent, `${whose(agent)} Passed`, `${capital(office)} has passed on representing you, on ${formatDate(sim.now, z)}. In the game it looks again only after a year, from ${formatDate(rel.cooldown!.until, z)}, and then only at something new: a new credit, a better reel or a referral. Why It Went This Way, on the Representation tab, gives the game’s reasons.`);
    return;
  }
  // No answer: said nothing now. Waiting from here, and once the six weeks run out, it's a no.
  setStage(sim, rel, 'waiting');
  sim.schedule({ at: p.silenceAt, kind: SILENCE_KIND, label: 'No Answer', category: 'system', priority: 40, refType: 'pro-agent', refId: agent.id, payload: { personId: person.id, agentId: agent.id, approach: p.approach, silenceAt: p.silenceAt } });
}

function scheduleMeeting(sim: Simulation, person: Person, agent: Agent, rel: AgentRelation): void {
  const m = rel.meeting!;
  const agency = agencyOf(agent);
  sim.schedule({
    at: m.at, kind: MEETING_KIND, label: `Meeting At ${agency.name}`, category: 'career', priority: 30, requiresPlayer: true,
    durationMinutes: AGENT_TIMES.meetingMinutes, travelMinutes: m.where === 'office' ? TRAVEL_MINUTES[person.currentLocationId]! : 0,
    ...(m.where === 'office' ? { locationId: agency.office.cityId } : {}),
    refType: 'pro-meeting', refId: m.id, payload: { personId: person.id, agentId: agent.id, meetingId: m.id },
  });
}

/** A trip's minutes in words: half an hour, two hours. */
export const tripWords = (minutes: number): string => (minutes === 30 ? 'half an hour' : minutes % 60 === 0 ? `${['no', 'one', 'two', 'three', 'four'][minutes / 60] ?? minutes / 60} ${minutes === 60 ? 'hour' : 'hours'}` : `${minutes} minutes`);

/** Whether they're there for an appointment at a moment: awake, out of hospital and not laid up by an injury. */
function present(person: Person, at: Instant): boolean {
  const asleep = person.awakeSince !== undefined && person.awakeSince > at;
  return !asleep && !inHospital(person, at) && !laidUp(person, at);
}

/**
 * The agreement he offered or signed before, in a sentence, where there was one: a second offer says what came of the
 * first (from 2026-10-21, brief 20's D1: until then an offer after one declined, let lapse or ended read word for word as
 * the first had, as if none had been).
 */
export function agreementBefore(sim: Simulation, person: Person, agent: Agent): string | undefined {
  const z = sim.zone;
  const before = (person.pro?.agreements ?? []).filter((a) => a.agentId === agent.id && a.status !== 'offered').sort((a, b) => b.offeredAt - a.offeredAt)[0];
  if (!before) return undefined;
  if (before.status === 'declined') return `${capital(agent.words.he)} offered you one before, on ${formatDate(before.offeredAt, z)}, and you declined it.`;
  if (before.status === 'lapsed') return `${capital(agent.words.he)} offered you one before, on ${formatDate(before.offeredAt, z)}, and you let it lapse.`;
  if (before.signedAt !== undefined) return `${capital(agent.words.he)} represented you before, from ${formatDate(before.signedAt, z)}${before.endedAt !== undefined ? ` until ${formatDate(before.endedAt, z)}` : ''}.`;
  return undefined;
}

function offerAgreement(sim: Simulation, person: Person, agent: Agent, rel: AgentRelation, key: string): Agreement {
  const z = sim.zone;
  const before = agreementBefore(sim, person, agent);
  const agreement: Agreement = {
    id: sim.nextId('pro'), agentId: agent.id, offeredAt: sim.now,
    standsUntil: addDays(sim.now, AGREEMENT.offerStandsDays, officeZone(agent)), status: 'offered',
    // Copied in when offered, so a later change to the content leaves this offer as it was.
    terms: JSON.parse(JSON.stringify(AGREEMENT_TERMS)),
  };
  ensurePro(sim, person).agreements.push(agreement);
  setStage(sim, rel, 'offered');
  note(sim, rel, 'offer', key, `${capital(agent.words.he)} offered you representation${before ? ' again' : ''}: an agreement for one year, standing until ${formatDate(agreement.standsUntil, z)}.${before ? ` ${before}` : ''}`, agreement.id);
  sim.schedule({ at: agreement.standsUntil, kind: OFFER_LAPSE_KIND, label: `Last Day Of The Offer From ${agencyOf(agent).name}`, category: 'career', priority: 40, refType: 'pro-agreement', refId: agreement.id, payload: { personId: person.id, agentId: agent.id, agreementId: agreement.id } });
  tell(sim, person, agent, `${agent.name} Offered You Representation${before ? ' Again' : ''}`, `${agent.name} has offered to represent you at ${agencyOf(agent).name}: an agreement for one year.${before ? ` ${before}` : ''} Every term is under The Agreement on the Career screen’s Representation tab, each marked as a published rule or the game’s own. The offer stands until ${formatDate(agreement.standsUntil, z)}.`, 75);
  return agreement;
}

// ---------------------------------------------------------------------------------------------------------------------
// The School's follow-up after the showcase (W3)
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Puts the School's follow-up on the calendar, three days after the showcase's last performance at ten in the morning
 * (ASSUMPTION: "in the week after"). The showcase's system calls this where its last performance is judged. Once a
 * showcase: a second call, or one for a showcase already followed up, puts nothing on.
 */
export function scheduleShowcaseFollowUp(sim: Simulation, person: Person, after: Instant): ScheduledItem | undefined {
  const showcase = person.pro?.showcase;
  if (!showcase || showcase.followUp) return undefined;
  if (sim.universe.scheduled.some((i) => i.kind === FOLLOW_UP_KIND && i.status === 'pending' && i.payload.personId === person.id)) return undefined;
  const zone = CITIES.get(YALE_DRAMA.cityId)?.timeZone ?? 'America/New_York';
  const at = onDayAt(after, AGENT_TIMES.followUpDays, AGENT_TIMES.answerHour, zone);
  if (at <= sim.now) return undefined;
  return sim.schedule({ at, kind: FOLLOW_UP_KIND, label: 'The School’s Showcase Follow-Up', category: 'career', priority: 40, payload: { personId: person.id, term: showcase.term } });
}

function followUp(sim: Simulation, person: Person): void {
  const pro = person.pro;
  const showcase = pro?.showcase;
  if (!pro || !showcase || showcase.followUp || !showcase.performed.length) return;
  const z = sim.zone;
  // Recorded before the factors are read, so the showcase is among the work his office has to go on.
  showcase.followUp = { at: sim.now, agents: [] };
  for (const agent of AGENTS.filter((a) => a.routes.includes('showcase'))) {
    const rel = ensureRelation(sim, person, agent, 'introduced');
    const unread = rel.noticeShownAt === undefined;
    rel.noticeShownAt ??= sim.now;
    note(sim, rel, 'discovered', 'discovered', `You first heard of ${agent.words.him} through the School’s follow-up after the showcase.`);
    const held = underWay(sim, agent, rel) ?? tooSoon(sim, rel);
    const key = `follow-up:${showcase.term}`;
    const office = officeOf(agent);
    const intro = unread ? ` ${agent.notice}` : '';
    const how = `In the game agencies follow the showcase up through the School. The School publishes the showcase’s dates and places, not who comes, and the game doesn’t say ${agent.words.he} was there.`;
    if (held) {
      note(sim, rel, 'introduced', key, `The School followed up on your showcase. Where you stood with ${agent.words.office} didn’t change.`);
      tell(sim, person, agent, 'The School’s Follow-Up After The Showcase', `The School passed your showcase on to the agencies it follows up with. Where you stand with ${office} doesn’t change: ${held}${intro} ${how}`);
      continue;
    }
    rel.via = { route: 'showcase', at: sim.now, by: 'the School' };
    setStage(sim, rel, 'introduced');
    const n = approachesOf(rel) + 1;
    const interest = interestOf(sim, person, agent, sim.now);
    const asks = followUpAsks(interest, drawOf(sim, person, agent, n, 'interest'));
    keepWhy(sim, rel, 'follow-up', asks ? 'asked' : 'introduced', interest);
    if (asks) showcase.followUp.agents.push(agent.id);
    const until = addDays(sim.now, AGENT_TIMES.askedStandsDays, officeZone(agent));
    if (asks) sim.schedule({ at: until, kind: ASK_LAPSE_KIND, label: `Last Day Of The Request To Meet From ${agencyOf(agent).name}`, category: 'career', priority: 40, refType: 'pro-agent', refId: agent.id, payload: { personId: person.id, agentId: agent.id } });
    note(sim, rel, 'introduced', key, asks ? `The School passed on a request from ${agent.words.office} to meet you, standing until ${formatDate(until, z)}.` : `The School’s follow-up introduced you to ${agent.words.office}. It sent no request to meet.`);
    tell(sim, person, agent, 'The School’s Follow-Up After The Showcase', asks
      ? `The School passed your showcase on to the agencies it follows up with, and ${office} asked the School to pass on a request to meet you. Press Send Your Materials on the Career screen’s Representation tab by ${formatDate(until, z)}, and ${agent.words.office} sets a time.${intro} ${how}`
      : `The School passed your showcase on to the agencies it follows up with. ${capital(office)} sent no request to meet, but the follow-up is an introduction: you can send it your materials from the Career screen’s Representation tab.${intro} ${how}`, asks ? 70 : 55);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// The stop's choice for a meeting: Ask To Move, which carries the jump on (`world/clock.ts`)
// ---------------------------------------------------------------------------------------------------------------------

defineStop(MEETING_KIND, [{
  label: 'Ask To Move',
  command: 'pro.ask_to_move',
  payload: (item) => ({ meetingId: item.payload.meetingId }),
  then: 'carry-on',
  // The stop's words are one for every agent, so they name none (from 2026-10-24; until then "his office").
  does: `asks the agent’s office to move the meeting ${MOVE_WORDS} on, which it does once`,
  ahead: 'ask an agent’s office to move a meeting, once',
  done: `The office moved the meeting ${MOVE_WORDS} on.`,
}]);

// ---------------------------------------------------------------------------------------------------------------------
// The commands and the handlers
// ---------------------------------------------------------------------------------------------------------------------

const agentIn = (payload: { agentId?: unknown } | undefined): Agent => {
  const agent = agentById(String(payload?.agentId ?? AGENTS[0]?.id ?? ''));
  if (!agent) throw new CommandError('There’s no such agent in the game.');
  return agent;
};

const personIn = (sim: Simulation, item: ScheduledItem): Person | undefined => sim.universe.people[String(item.payload.personId)];

export function registerProAgent(sim: Simulation): void {
  sim.onCommand<{ agentId?: string }, { at: Instant }>('pro.agent_notice', (p, { sim: s }) => {
    const person = s.player;
    const agent = agentIn(p);
    const no = noticeRefusal(s, person, agent);
    if (no) throw new CommandError(no);
    const rel = ensureRelation(s, person, agent, 'discovered');
    rel.noticeShownAt = s.now;
    note(s, rel, 'discovered', 'discovered', `You read the notice about ${agent.words.him} and ${agencyOf(agent).name}.`);
    return { at: s.now };
  });

  sim.onCommand<{ agentId?: string }, { stage: RelationStage }>('pro.agent_check', (p, { sim: s }) => {
    const person = s.player;
    const agent = agentIn(p);
    const no = checkRefusal(s, person, agent);
    if (no) throw new CommandError(no);
    const rel = relationOf(person, agent.id)!;
    const notes = materialsCheck(person, 'representation', s.now);
    // What it found, said as it stood: until 2026-10-21 the history copied the check's own sentences, instructions and all
    // ("Press Update Your Résumé to bring it up to date."), which read as still to do after they were done.
    note(s, rel, 'checked', `checked:${approachesOf(rel)}`, notes.length
      ? `You checked your materials for an approach: headshots and a résumé were there, and ${spokenList(notes.map((x) => FOUND[x.problem](x.kind)))}.`
      : 'You checked your materials for an approach: headshots, a résumé and a reel, all current.');
    if (rel.stage === 'discovered') setStage(s, rel, 'checked');
    return { stage: rel.stage };
  });

  sim.onCommand<{ agentId?: string; engagementId?: string }, { by: string }>('pro.ask_referral', (p, { sim: s }) => {
    const person = s.player;
    const agent = agentIn(p);
    const engagementId = String(p?.engagementId ?? '');
    const no = referralRefusal(s, person, agent, engagementId);
    if (no) throw new CommandError(no);
    const rel = relationOf(person, agent.id)!;
    const job = referrersOf(s, person, agent).find((r) => r.engagementId === engagementId)!;
    (rel.referrals ??= []).push({ engagementId, by: job.by, job: job.job, at: s.now, ...(job.band ? { band: job.band } : {}) });
    rel.via = { route: 'referral', at: s.now, by: job.by };
    setStage(s, rel, 'introduced');
    note(s, rel, 'referred', `referral:${engagementId}`, `${capital(job.by)} referred you to ${agent.words.office}, from your work as ${job.job}.`);
    // From the person who made it, never from him: he never seeks the player out (the module's note).
    // A production's producers referring you take a plural verb (from 2026-10-24, brief 25's Module 5, when a documentary's
    // producers first did: "The film’s producers has referred you").
    if (person.id === s.universe.playerId) s.notify({ category: 'career', title: `${titled(job.by)} Referred You`, body: `${capital(job.by)} ${/\bproducers$/i.test(job.by) ? 'have' : 'has'} referred you to ${officeOf(agent)}, from your work as ${job.job}. You can send your materials now, from the Career screen’s Representation tab.`, importance: 60, route: REPRESENTATION_ROUTE, refType: 'pro-referral', refId: engagementId });
    return { by: job.by };
  });

  sim.onCommand<{ agentId?: string }, { approach: number; silenceAt: Instant }>('pro.send_materials', (p, { sim: s }) => {
    const person = s.player;
    const agent = agentIn(p);
    const no = sendRefusal(s, person, agent);
    if (no) throw new CommandError(no);
    const rel = relationOf(person, agent.id)!;
    const asked = askedToMeet(person, agent, s.now) !== undefined;
    const pro = person.pro!;
    const reel = currentOf(pro, 'reel');
    const n = approachesOf(rel) + 1;
    const zone = officeZone(agent);
    const silenceAt = onDayAt(s.now, AGENT_TIMES.silenceDays, AGENT_TIMES.answerHour, zone);
    delete rel.cooldown;
    rel.considered = { at: s.now, keys: caseKeys(person, rel) };
    setStage(s, rel, 'sent');
    const sent = spokenList(['your headshots', 'your résumé', ...(reel ? ['your reel'] : [])]);
    const via = rel.via!.route === 'showcase' ? 'after the School’s follow-up' : `on ${rel.via!.by}’s referral`;
    note(s, rel, 'sent', `sent:${n}`, `You sent ${sent} to ${agent.words.office}, ${via}${asked ? ', answering its request to meet' : ''}.`, reel?.id);
    const at = onDayAt(s.now, asked ? AGENT_TIMES.afterSupplyDays : AGENT_TIMES.replyDays, AGENT_TIMES.answerHour, zone);
    s.schedule({ at, kind: REPLY_KIND, label: 'An Answer', category: 'system', priority: 40, refType: 'pro-agent', refId: agent.id, payload: { personId: person.id, agentId: agent.id, approach: n, step: 'first', asked, reelId: reel?.id ?? null, from: s.now, silenceAt } });
    return { approach: n, silenceAt };
  });

  sim.onCommand<{ agentId?: string }, { at: Instant }>('pro.supply_material', (p, { sim: s }) => {
    const person = s.player;
    const agent = agentIn(p);
    const no = supplyRefusal(s, person, agent);
    if (no) throw new CommandError(no);
    const rel = relationOf(person, agent.id)!;
    const r = rel.request!;
    const due = s.universe.scheduled.find((i) => i.kind === REQUEST_DUE_KIND && i.status === 'pending' && i.payload.requestId === r.id);
    if (due) s.timeline.cancel(due.id, s.now);
    const reel = currentOf(person.pro, 'reel');
    rel.considered = { at: s.now, keys: caseKeys(person, rel) };
    note(s, rel, 'supplied', `supplied:${r.id}`, `You sent ${spokenList(r.what.map((k) => KIND_WORDS[k]))}, as ${agent.words.office} asked, by ${formatDate(r.by, s.zone)}.`, reel?.id);
    delete rel.request;
    setStage(s, rel, 'sent');
    const zone = officeZone(agent);
    const n = approachesOf(rel);
    s.schedule({ at: onDayAt(s.now, AGENT_TIMES.afterSupplyDays, AGENT_TIMES.answerHour, zone), kind: REPLY_KIND, label: 'An Answer', category: 'system', priority: 40, refType: 'pro-agent', refId: agent.id, payload: { personId: person.id, agentId: agent.id, approach: n, step: 'after-request', reelId: reel?.id ?? null, from: s.now, silenceAt: onDayAt(s.now, AGENT_TIMES.silenceDays, AGENT_TIMES.answerHour, zone) } });
    return { at: s.now };
  });

  sim.onCommand<{ meetingId?: string }, { at: Instant }>('pro.ask_to_move', (p, { sim: s }) => {
    const person = s.player;
    const meetingId = String(p?.meetingId ?? '');
    const no = moveRefusal(s, person, meetingId);
    if (no) throw new CommandError(no);
    const agent = AGENTS.find((a) => relationOf(person, a.id)?.meeting?.id === meetingId)!;
    const rel = relationOf(person, agent.id)!;
    const { meeting, item } = meetingOf(s, person, agent)!;
    const was = meeting.at;
    meeting.at = addDays(was, AGENT_TIMES.moveDays, officeZone(agent));
    meeting.moved += 1;
    s.timeline.reschedule(item!.id, meeting.at);
    note(s, rel, 'meeting-moved', `meeting:${meeting.id}:moved`, `You asked to move the meeting from ${formatDateTime(was, s.zone)}, and ${agent.words.office} moved it to ${formatDateTime(meeting.at, s.zone)}.`, meeting.id);
    return { at: meeting.at };
  });

  sim.onCommand<{ agentId?: string }, { id: ProId; endsAt: Instant }>('pro.accept_agreement', (p, { sim: s }) => {
    const person = s.player;
    const agent = agentIn(p);
    const no = signRefusal(s, person, agent);
    if (no) throw new CommandError(no);
    const rel = relationOf(person, agent.id)!;
    const a = offeredAgreement(person, agent)!;
    a.status = 'accepted';
    a.signedAt = s.now;
    a.endsAt = addDays(s.now, AGREEMENT.termDays, officeZone(agent));
    s.timeline.cancelFor('pro-agreement', a.id, s.now);
    rel.agreementId = a.id;
    setStage(s, rel, 'represented');
    note(s, rel, 'accepted', `agreement:${a.id}:accepted`, `You accepted ${agent.words.his} agreement.`, a.id);
    note(s, rel, 'represented', `represented:${a.id}`, `${capital(agent.words.he)} represents you from ${formatDate(s.now, s.zone)} until ${formatDate(a.endsAt, s.zone)}.`, a.id);
    s.schedule({ at: a.endsAt, kind: TERM_END_KIND, label: `Your Agreement With ${agencyOf(agent).name} Ends`, category: 'career', priority: 40, refType: 'pro-agreement', refId: a.id, payload: { personId: person.id, agentId: agent.id, agreementId: a.id } });
    return { id: a.id, endsAt: a.endsAt };
  });

  sim.onCommand<{ agentId?: string }, { id: ProId }>('pro.decline_agreement', (p, { sim: s }) => {
    const person = s.player;
    const agent = agentIn(p);
    const no = answerRefusal(s, person, agent);
    if (no) throw new CommandError(no);
    const rel = relationOf(person, agent.id)!;
    const a = offeredAgreement(person, agent)!;
    a.status = 'declined';
    s.timeline.cancelFor('pro-agreement', a.id, s.now);
    closeApproach(s, person, rel, 'declined', 'declined');
    note(s, rel, 'declined', `agreement:${a.id}:declined`, `You declined ${agent.words.his} agreement.`, a.id);
    return { id: a.id };
  });

  sim.onCommand<{ agentId?: string; how?: EndHow }, { endedAt: Instant }>('pro.end_agreement', (p, { sim: s }) => {
    const person = s.player;
    const agent = agentIn(p);
    const how: EndHow = p?.how === 'no-offer' || p?.how === 'too-little-work' ? p.how : 'agreement';
    const no = endRefusal(s, person, agent, how);
    if (no) throw new CommandError(no);
    const rel = relationOf(person, agent.id)!;
    endAgreement(s, person, agent, rel, agreementInForce(person, agent, s.now)!, how);
    return { endedAt: s.now };
  });

  sim.onSchedule(FOLLOW_UP_KIND, (item, s) => {
    const person = personIn(s, item);
    if (person) followUp(s, person);
  });

  sim.onSchedule(REPLY_KIND, (item, s) => {
    const person = personIn(s, item);
    const agent = agentById(String(item.payload.agentId));
    const rel = person && agent ? relationOf(person, agent.id) : undefined;
    // An answer to an approach that's still the one under way: anything else was settled another way.
    if (!person || !agent || !rel || rel.stage !== 'sent' || approachesOf(rel) !== item.payload.approach) return;
    answer(s, person, agent, rel, { approach: Number(item.payload.approach), step: item.payload.step === 'after-request' ? 'after-request' : 'first', asked: item.payload.asked === true, ...(typeof item.payload.reelId === 'string' ? { reelId: item.payload.reelId } : {}), from: Number(item.payload.from), silenceAt: Number(item.payload.silenceAt) });
  });

  sim.onSchedule(ASK_LAPSE_KIND, (item, s) => {
    const person = personIn(s, item);
    const agent = agentById(String(item.payload.agentId));
    const rel = person && agent ? relationOf(person, agent.id) : undefined;
    // Answered already (materials sent), or reached him some other way since: the request has nothing left to lapse.
    if (!person || !agent || !rel || rel.via?.route !== 'showcase' || approachesOf(rel) > 0) return;
    const z = s.zone;
    note(s, rel, 'ask-lapsed', `ask-lapsed:${agent.id}`, `${capital(agent.words.office)}’s request to meet, passed on by the School, lapsed on ${formatDate(item.at, z)}: no materials came.`);
    tell(s, person, agent, `The Request To Meet From ${atAgency(agent)} Lapsed`, `You didn’t send your materials to ${officeOf(agent)} by ${formatDate(item.at, z)}, so the request to meet that it passed on through the School after the showcase has lapsed. You can still send them from the Representation tab. It’s then an ordinary approach, which ${agent.words.office} answers in its usual time.`);
  });

  sim.onSchedule(REQUEST_DUE_KIND, (item, s) => {
    const person = personIn(s, item);
    const agent = agentById(String(item.payload.agentId));
    const rel = person && agent ? relationOf(person, agent.id) : undefined;
    const r = rel?.request;
    if (!person || !agent || !rel || !r || rel.stage !== 'requested' || r.id !== item.payload.requestId) return;
    note(s, rel, 'request-missed', `request-missed:${r.id}`, `What ${agent.words.office} asked for by ${formatDate(r.by, s.zone)} didn’t come: ${spokenList(r.what.map((k) => KIND_WORDS[k]))}.`);
    setStage(s, rel, 'sent');
    answer(s, person, agent, rel, { approach: Number(item.payload.approach), step: 'request-missed', ...(typeof item.payload.reelId === 'string' ? { reelId: item.payload.reelId } : {}), from: s.now, silenceAt: Number(item.payload.silenceAt) });
  });

  sim.onSchedule(SILENCE_KIND, (item, s) => {
    const person = personIn(s, item);
    const agent = agentById(String(item.payload.agentId));
    const rel = person && agent ? relationOf(person, agent.id) : undefined;
    if (!person || !agent || !rel || rel.stage !== 'waiting' || approachesOf(rel) !== item.payload.approach) return;
    closeApproach(s, person, rel, 'unanswered', 'silence');
    note(s, rel, 'silence', `silence:${item.payload.approach}`, `${capital(SILENCE_WORDS)} went by with no answer from ${agent.words.office}, and in the game that counts as no.`);
    tell(s, person, agent, `No Answer From ${whose(agent)}`, `${capital(SILENCE_WORDS)} have gone by since you sent your materials to ${officeOf(agent)}, with no answer. In the game no answer by then means no. A new approach can come from ${formatDate(rel.cooldown!.until, s.zone)}, with something new for ${agent.words.office} to consider.`);
  });

  sim.onSchedule(MEETING_KIND, (item, s) => {
    const person = personIn(s, item);
    const agent = agentById(String(item.payload.agentId));
    const rel = person && agent ? relationOf(person, agent.id) : undefined;
    const m = rel?.meeting;
    if (!person || !agent || !rel || !m || m.id !== item.payload.meetingId || m.status !== 'set') return;
    const z = s.zone;
    // At an audition in person whose trip meets the meeting's (`attendedAcross`, from 2026-10-21), it's missed, as a
    // round is missed for a meeting kept.
    const trip = (item.travelMinutes ?? 0) * MS_MINUTE;
    const elsewhere = present(person, item.at) ? attendedAcross(person, item.at - trip, item.at + AGENT_TIMES.meetingMinutes * MS_MINUTE + trip, m.id) : undefined;
    if (present(person, item.at) && !elsewhere) {
      m.status = 'kept';
      setStage(s, rel, 'deciding');
      note(s, rel, 'meeting-kept', `meeting:${m.id}:kept`, `You kept the meeting with ${agent.words.office}, ${m.where === 'office' ? `at ${agencyOf(agent).name}’s ${agencyOf(agent).office.city} office` : 'by video'}.`, m.id);
      const at = onDayAt(s.now, AGENT_TIMES.decisionDays, AGENT_TIMES.answerHour, officeZone(agent), true);
      s.schedule({ at, kind: DECISION_KIND, label: 'A Decision', category: 'system', priority: 40, refType: 'pro-agent', refId: agent.id, payload: { personId: person.id, agentId: agent.id, meetingId: m.id, approach: approachesOf(rel) } });
      tell(s, person, agent, `You Met ${whose(agent)}`, `You met ${officeOf(agent)} on ${formatDate(item.at, z)}. It tells you its decision by ${formatDate(at, z)}.`, 50);
      return;
    }
    m.status = 'missed';
    note(s, rel, 'meeting-missed', `meeting:${m.id}:missed`, `${elsewhere ? `You were at ${elsewhere}, so you missed` : 'You missed'} the meeting with ${agent.words.office} at ${formatTime(item.at, z)} on ${formatDate(item.at, z)}.`, m.id);
    const interest = interestOf(s, person, agent, s.now);
    keepWhy(s, rel, 'meeting-missed', 'pass', interest);
    closeApproach(s, person, rel, 'passed', 'pass');
    note(s, rel, 'passed', `decision:${m.id}:passed`, `${capital(agent.words.office)} closed your approach after the missed meeting.`);
    tell(s, person, agent, `You Missed The Meeting At ${atAgency(agent)}`, `${elsewhere ? `You were at ${elsewhere}, so you missed` : 'You missed'} the meeting with ${officeOf(agent)} at ${formatTime(item.at, z)} on ${formatDate(item.at, z)}. In the game a meeting comes before an offer, so ${agent.words.office} closed your approach. It looks again only after a year, from ${formatDate(rel.cooldown!.until, z)}, and then only at something new.`, 70);
  });

  sim.onSchedule(DECISION_KIND, (item, s) => {
    const person = personIn(s, item);
    const agent = agentById(String(item.payload.agentId));
    const rel = person && agent ? relationOf(person, agent.id) : undefined;
    const m = rel?.meeting;
    if (!person || !agent || !rel || !m || rel.stage !== 'deciding' || m.id !== item.payload.meetingId) return;
    const interest = interestOf(s, person, agent, s.now);
    const outcome = offerOutcome(interest, drawOf(s, person, agent, Number(item.payload.approach), 'offer'));
    keepWhy(s, rel, 'decision', outcome, interest);
    if (outcome === 'offer') { offerAgreement(s, person, agent, rel, `decision:${m.id}:offer`); return; }
    closeApproach(s, person, rel, 'passed', 'pass');
    note(s, rel, 'passed', `decision:${m.id}:passed`, `After the meeting, ${agent.words.office} passed.`);
    tell(s, person, agent, `${whose(agent)} Passed`, `After your meeting, ${officeOf(agent)} has passed on representing you, on ${formatDate(s.now, s.zone)}. In the game it looks again only after a year, from ${formatDate(rel.cooldown!.until, s.zone)}, and then only at something new. Why It Went This Way, on the Representation tab, gives the game’s reasons.`);
  });

  sim.onSchedule(OFFER_LAPSE_KIND, (item, s) => {
    const person = personIn(s, item);
    const agent = agentById(String(item.payload.agentId));
    const rel = person && agent ? relationOf(person, agent.id) : undefined;
    const a = person?.pro?.agreements.find((x) => x.id === item.payload.agreementId);
    if (!person || !agent || !rel || !a || a.status !== 'offered') return;
    a.status = 'lapsed';
    closeApproach(s, person, rel, 'declined', 'declined');
    note(s, rel, 'lapsed', `agreement:${a.id}:lapsed`, `${capital(agent.words.his)} offer lapsed, unanswered.`, a.id);
    tell(s, person, agent, `${agent.name}’s Offer Lapsed`, `The agreement ${agent.name} offered stood until today, and it lapsed unanswered. In the game ${agent.words.office} looks again only after six months, from ${formatDate(rel.cooldown!.until, s.zone)}, and then only at something new.`);
  });

  sim.onSchedule(TERM_END_KIND, (item, s) => {
    const person = personIn(s, item);
    const agent = agentById(String(item.payload.agentId));
    const rel = person && agent ? relationOf(person, agent.id) : undefined;
    const a = person?.pro?.agreements.find((x) => x.id === item.payload.agreementId);
    if (!person || !agent || !rel || !a || a.status !== 'accepted') return;
    endAgreement(s, person, agent, rel, a, 'term');
  });
}

/** Ends an agreement: its end and how, the relation ended, the term's item called off, and what it leaves owed said. */
function endAgreement(sim: Simulation, person: Person, agent: Agent, rel: AgentRelation, a: Agreement, how: EndedHow): void {
  a.status = 'ended';
  a.endedAt = how === 'term' ? a.endsAt! : sim.now;
  a.endedHow = how;
  sim.timeline.cancelFor('pro-agreement', a.id, sim.now);
  closeApproach(sim, person, rel, 'ended', undefined);
  delete rel.cooldown;
  note(sim, rel, 'ended', `ended:${a.id}`, `Your agreement ended on ${formatDate(a.endedAt, sim.zone)}, ${endedWords(agent)[how]}.`, a.id);
  tell(sim, person, agent, `Your Agreement With ${agent.name} Ended`, `Your agreement with ${agent.name} at ${agencyOf(agent).name} ended on ${formatDate(a.endedAt, sim.zone)}, ${endedWords(agent)[how]}. ${stillOwed(person, a)}`, 65);
}

/** A referrer's name as a notice's title has it: every word capitalised. */
const titled = (s: string): string => s.replace(/(^|\s)(\S)/g, (_m, sp: string, c: string) => sp + c.toUpperCase());
