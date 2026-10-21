/**
 * SLATE — the professional record: an actor's credits, materials, representation and work, kept apart from the School's
 * record and from the rolling detail of judged work (from 2026-10-20, the owner's brief 19, "Professional Career
 * Foundation And The First Individual Agent"; `docs/verification/career-2026-10-20/design.md`, The Record).
 *
 * The record is `person.pro`. The name `career` isn't free (`migrate` deletes `person.career`, the scope reset's), and
 * neither is a scheduled kind beginning `work.` (`migrate` drops them): every kind here is `pro.*`.
 *
 * **What it holds, and what it doesn't.** Professional and student-film credits (`ProCredit`), permanent and small; the
 * portfolio's materials (`Material`), each with where it came from, when it was made and what's in it; the agents and
 * their histories (`AgentRelation`); agreements, opportunities and engagements with their payments; the School's
 * showcase; requests for outside work; the unions. School credits stay in `school.credits` and are read from there as
 * school credits (`schoolCreditsOf`). Practice, the briefs and their self-tapes are never credits: a self-tape is a
 * recording, which a reel can be cut from (`reelSources`), and nothing more.
 *
 * **What's worked out, never stored.** The profile (`profileOf`): the professional name (the display name until one is
 * set, `pro.set_name`), training and education in true words, the two lists of credits, the skills on record, the
 * availability, the place and the permission to work, each read from where the game keeps it. A material's standing:
 * headshots over two years old read as out of date (ASSUMPTION, `HEADSHOTS.staleDays`), a résumé missing anything on
 * the record since it was made reads as behind, a reel with no screen material reads as tapes only (`materialsCheck`).
 *
 * **Bounded.** Each history is kept to its last `HISTORY_KEPT` events, its counts by kind kept whole (`noteEvent`);
 * resolved opportunities to the last `OPPORTUNITIES_KEPT`, finished engagements to the last `ENGAGEMENTS_KEPT` (their
 * credits stay for good); each kind of material to the current one and the `MATERIALS_KEPT` - 1 before it, the count
 * of all made kept (`keepBounded`). Credits and agreements are kept whole. The design kept every material; a headshot
 * session can be had as often as the bank pays for it, so the older versions are bounded too, and a history event that
 * names a material says what it needs in its own words.
 *
 * **Ids.** One namespace, `pro`, from `nextId`, for every credit, material, history event, agreement, opportunity,
 * engagement and payment: nothing resolved can come back under a new name.
 *
 * **Building it.** A new life's record begins with the life (`beginPro`, `populateWorld`), where a School life is
 * enrolled at the same moment. A save from before 2026-10-20 has its record built once on opening (`ONCE_ON_OPENING`'s
 * `pro.begun`, `buildOnOpening`): from what the save holds, nothing reset or invented, and a graduate's Equity
 * membership dated at the degree. The Bulletin: "Through work at Yale Repertory Theatre, those students who are not
 * members of Actors' Equity will attain membership to the union upon graduation" (`docs/research/career-2026-10-20/
 * yale.md`, B27 p.24); a life graduating later is given it at the degree (`setStanding`, `systems/school.ts`).
 *
 * Every cost and time here is the game's estimate, said where a player reads it: no source in the research prices a
 * headshot session, a résumé or a reel's edit.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { plural, spokenList } from '../core/text';
import { CITIES } from '../content/geography';
import { YALE_DRAMA, type Skill } from '../content/school';
import { MASTERED, TECHNIQUE_LABEL } from '../content/abilities';
import { BRIEF_BY_ID } from '../content/briefs';
import type { AgentId, AgentRoute } from '../content/agents';
import type { AgreementTerm, ProMedium, RateId } from '../content/careerwork';
import { UNIONS } from '../content/careerwork';
import type { Band } from './coursework';
import { BAND_LABEL } from './coursework';
import { bandOfQuality } from './evaluation';
import { at as schoolAt, classPeriod, countWords, leftWithout, schoolEnded, termStart, yearOfStudy } from './school';
import { enrolledTerms } from './leave';
import { startRefusal } from './life';
import { spend, spendRefusal } from './spending';
import { inSaveMoney } from './banking';
import { f1Of, usWorkAuthorized } from './permission';
import { citizenOf, documentsOf, inForce } from './documents';

// ---------------------------------------------------------------------------------------------------------------------
// The record's types: the contract every part of the career builds on
// ---------------------------------------------------------------------------------------------------------------------

/** An id in the `pro` namespace (`pro_00002a`). */
export type ProId = string;

/**
 * What a history event is about. The agent's, the work's and the showcase's systems name theirs here, so a history reads
 * the same everywhere; a kind can be added, never renamed (a save keeps it).
 */
export type ProEventKind =
  | 'discovered' | 'checked' | 'introduced' | 'referred' | 'sent' | 'silence' | 'requested' | 'supplied' | 'passed'
  | 'meeting-set' | 'meeting-kept' | 'meeting-missed' | 'meeting-moved' | 'promise' | 'offer' | 'accepted' | 'declined'
  | 'lapsed' | 'represented' | 'ended' | 'refused' | 'opportunity' | 'submitted' | 'audition' | 'callback' | 'booked'
  | 'worked' | 'paid' | 'success' | 'problem';

/** One event in a history: a stable id, when, what, its words as the player reads them, and what it's about. */
export interface ProEvent {
  id: ProId;
  at: Instant;
  kind: ProEventKind;
  words: string;
  /**
   * A stable key for what it records (`request:<opportunity>`, `meeting:<id>:kept`): an event noted again under a key
   * already in the history is the one there, not a new one. A key older than the kept events is forgotten, so a caller
   * keys on a record that outlives the history (an opportunity's or an agreement's own status) for anything older.
   */
  key?: string;
  /** The record it's about: an opportunity, an engagement, an agreement, a material. */
  ref?: ProId;
}

/** Anything that keeps a history: its last events, and every event counted by kind. */
export interface HasHistory {
  history: ProEvent[];
  counts: Partial<Record<ProEventKind, number>>;
}

export type CreditKind = 'stage' | 'screen' | 'student-film';
/** A stage credit is performed; a screen one shot, then released or not. */
export type CreditStatus = 'performed' | 'shot' | 'released' | 'unreleased';

/** A professional or student-film credit: the part actually played, for good. Practice, briefs and self-tapes never are. */
export interface ProCredit {
  id: ProId;
  kind: CreditKind;
  project: string;
  role: string;
  company: string;
  year: number;
  medium: ProMedium;
  status: CreditStatus;
  union?: 'equity' | 'sag-aftra';
  engagementId?: ProId;
  /** When it was first performed or shot: what a résumé made before it is behind on. */
  at: Instant;
  /** When a screen credit's work was released, and its footage could go on a reel (`releaseScreenCredit`). */
  releasedAt?: Instant;
  /** The best band its work was judged at, where it was judged. */
  band?: Band;
}

export type MaterialKind = 'headshot' | 'resume' | 'reel';

/** One recorded piece on a reel, copied in when it's cut, so it reads the same after its source has gone from the record. */
export interface MaterialPiece {
  ref: string;
  from: 'tape' | 'monologues' | 'footage';
  title: string;
  at: Instant;
  band?: Band;
  genre?: string;
}

/** A headshot set, a résumé or a reel, with its provenance: where it came from, when, and what's in it. */
export interface Material {
  id: ProId;
  kind: MaterialKind;
  made: Instant;
  /** Its number among its kind: the first résumé is 1. */
  version: number;
  /** Where it came from, in a sentence. */
  source: string;
  /** What's in it, a line each. */
  contains: string[];
  /** A reel's pieces. */
  pieces?: MaterialPiece[];
  /** A résumé's record when it was made, by key (`resumeNow`): what it's measured against. */
  keys?: string[];
  /** The name a résumé was made under. */
  name?: string;
  /** What it cost, in the save's currency. */
  cost?: Money;
}

/** Where a relationship with an agent stands (the design's The Relationship). */
export type RelationStage =
  | 'discovered' | 'checked' | 'introduced' | 'sent' | 'waiting' | 'requested' | 'meeting' | 'deciding' | 'offered'
  | 'represented' | 'passed' | 'declined' | 'ended';

export interface AgentRelation extends HasHistory {
  agentId: AgentId;
  stage: RelationStage;
  /** When the relation began, and when its stage last moved. */
  since: Instant;
  stageAt: Instant;
  /** When the fictional notice was first shown (`Agent.notice`). */
  noticeShownAt?: Instant;
  /** The route the player came by: the School's follow-up or a referral, with who made it. */
  via?: { route: AgentRoute; at: Instant; by?: string };
  /** A pass, a silence or a declined offer holds until a day, and a new approach needs something new to consider. */
  cooldown?: { until: Instant; why: 'pass' | 'silence' | 'declined'; needsNew: boolean };
  /** What the last decision considered, by key, so a new approach can be told from the same one again. */
  considered?: { at: Instant; keys: string[] };
  /** Material asked for, and by when. */
  request?: { id: ProId; at: Instant; what: MaterialKind[]; by: Instant };
  /** A meeting: when, where, how many times it moved, and how it went. */
  meeting?: { id: ProId; at: Instant; where: 'office' | 'video'; moved: number; status: 'set' | 'kept' | 'missed' };
  agreementId?: ProId;
}

export type AgreementStatus = 'offered' | 'accepted' | 'declined' | 'lapsed' | 'ended';
export type EndedHow = 'term' | 'agreement' | 'no-offer' | 'too-little-work';

/** An agreement offered by an agent, its terms copied in when offered so a later change to the content leaves it as it was. */
export interface Agreement {
  id: ProId;
  agentId: AgentId;
  offeredAt: Instant;
  standsUntil: Instant;
  status: AgreementStatus;
  terms: AgreementTerm[];
  signedAt?: Instant;
  /** The term's last day, from signing. */
  endsAt?: Instant;
  endedAt?: Instant;
  endedHow?: EndedHow;
}

export type OpportunityStatus =
  | 'open' | 'submitted' | 'audition' | 'callback' | 'offered' | 'booked' | 'passed' | 'declined' | 'lapsed' | 'withdrawn' | 'refused';

/** One role in one project the actor can be seen for (`content/careerwork.ts`'s templates), from posting to its outcome. */
export interface Opportunity extends HasHistory {
  id: ProId;
  projectId: string;
  /** Put up by an agent, or the actor's own submission. */
  via: 'agent' | 'open';
  agentId?: AgentId;
  status: OpportunityStatus;
  postedAt: Instant;
  submitBy: Instant;
  auditionAt?: Instant;
  callbackAt?: Instant;
  offer?: { at: Instant; until: Instant; rate: RateId; amount?: Money; per: 'day' | 'week'; units: number };
  /** When it was settled, booked or not, and why, in the player's words. */
  resolvedAt?: Instant;
  outcome?: string;
  engagementId?: ProId;
}

/** A payment owed for work: promised when the contract's accepted, received only when it's posted. */
export interface ProPayment {
  id: ProId;
  /** Unique for the engagement and its week or day (`<engagement>:<week>`), so no reload or jump pays it twice. */
  key: string;
  promised: Money;
  currency: string;
  promisedAt: Instant;
  due: Instant;
  /** Deferred pay is shown as deferred and never posted. */
  deferred?: true;
  /** `dues`: the union's working dues taken from it, where it's union work and they're a member (`systems/propay.ts`). */
  received?: { at: Instant; gross: Money; withheld: Money; commission: Money; net: Money; via: 'trust' | 'direct'; txnId?: string; dues?: Money };
  /**
   * Paid by the production into the agency's client trust account (`systems/propay.ts`, from 2026-10-21): when, by which
   * agency, its transaction, the day it's passed on, and its figures: what the account holds of it is the gross less
   * what was withheld and the dues, and the commission comes off that when it's passed on. Kept once it's received.
   */
  inTrust?: { at: Instant; agency: string; txnId: string; releaseAt: Instant; gross: Money; withheld: Money; dues: Money; commission: Money; held: Money };
}

/**
 * What permission to work read for an engagement's dates when it was booked (`systems/propay.ts`, `schedulePay`, from
 * 2026-10-21): kept, so Papers says what was read then, not what holds now.
 */
export interface EligibilityRead {
  at: Instant;
  authorized: boolean;
  basis: 'citizen' | 'green-card' | 'opt' | 'student' | 'none';
  words: string;
  /** The first of its dates permission didn't cover, where one wasn't. */
  refusedFrom?: Instant;
}

/** A union's bill: keyed, so it's charged once, and kept with how it was settled (`systems/propay.ts`, from 2026-10-21). */
export interface UnionBill {
  key: string;
  union: 'equity' | 'sag-aftra';
  /** What it's for, as the Work tab lists it. */
  what: string;
  /** In the save's currency. */
  amount: Money;
  due: Instant;
  /** Paid from the bank, or, where the bank couldn't cover it, owed in Bills Owed: either way posted once. */
  settled?: { at: Instant; how: 'paid' | 'owed'; txnId?: string };
}

/** Work booked: its days on the calendar, its pay, and the credit it leaves. */
export interface Engagement extends HasHistory {
  id: ProId;
  opportunityId: ProId;
  projectId: string;
  role: string;
  status: 'booked' | 'preparing' | 'working' | 'finished' | 'canceled';
  days: { from: Instant; to: Instant; label: string }[];
  agreementId?: ProId;
  agentId?: AgentId;
  pay: ProPayment[];
  creditId?: ProId;
  finishedAt?: Instant;
  /** What permission to work read for its dates when it was booked (`EligibilityRead`). */
  eligibility?: EligibilityRead;
}

/** The School's Actor Showcase (DRAM 793b) in the final term: its scenes, the performances, and the follow-up. */
export interface ShowcaseRecord {
  term: number;
  eligible?: boolean;
  scenes: { id: string; chosenAt?: Instant; prep?: number }[];
  performed: { city: string; at: Instant; band?: Band; overall?: number }[];
  followUp?: { at: Instant; agents: AgentId[] };
}

/** A request to the School for outside work in session (the Bulletin's written proposal), and its decision. */
export interface OutsideWorkRequest {
  id: ProId;
  opportunityId: ProId;
  at: Instant;
  firstDay: Instant;
  workingDays: number;
  classDays: number;
  status: 'pending' | 'approved' | 'refused';
  decidedAt?: Instant;
  why?: string;
}

export interface ProRecord {
  /** When the record began: the life's start, or the opening that built it. */
  since: Instant;
  /** The professional name; the display name until one is set. */
  name?: string;
  /** Professional and student-film credits only: school credits are `school.credits`. */
  credits: ProCredit[];
  materials: Material[];
  /** Every material made, by kind, whatever's been trimmed. */
  made?: Partial<Record<MaterialKind, number>>;
  relations: Record<AgentId, AgentRelation>;
  agreements: Agreement[];
  /** Live, and the last `OPPORTUNITIES_KEPT` resolved. */
  opportunities: Opportunity[];
  /** Live, and the last `ENGAGEMENTS_KEPT` finished. Their credits stay. */
  engagements: Engagement[];
  showcase?: ShowcaseRecord;
  outsideWork?: OutsideWorkRequest[];
  /** In-session work done without the School's approval. */
  unapproved?: number;
  /** Equity membership: since when, and how it came. */
  equity?: { since: Instant; how: 'degree' | 'contract' | 'open-access' };
  sag?: { eligibleSince?: Instant; memberSince?: Instant };
  /** The unions' bills, each charged once (`systems/propay.ts`): the unsettled, and the last `BILLS_KEPT` settled. */
  unionBills?: UnionBill[];
  /** How many resolved opportunities and finished engagements were trimmed. */
  trimmed?: { opportunities: number; engagements: number };
}

// ---------------------------------------------------------------------------------------------------------------------
// The rules: bounds, and the materials' times and costs
// ---------------------------------------------------------------------------------------------------------------------

/** The design's bounds (The Record, Bounded), and the materials' kept versions (this file's header). */
export const HISTORY_KEPT = 80;
export const OPPORTUNITIES_KEPT = 40;
export const ENGAGEMENTS_KEPT = 20;
export const MATERIALS_KEPT = 6;

/**
 * A headshot session. ASSUMPTION, every figure: no source here prices one. $700 is the old line's estimate of a New York
 * session with retouched images (git history, `content/career.ts` before the scope reset); four hours with getting
 * there and back; a photographer's day, starting from 9 AM to 4 PM; and headshots over two years old read as out of date
 * (the design's assumption).
 */
export const HEADSHOTS = { cost: 700_00, minutes: 240, from: 9, until: 16, staleDays: 730 } as const;
/** An hour on the clock as a player reads it: 9 AM, 4 PM. */
export const clockWords = (hour: number): string => `${hour % 12 || 12} ${hour < 12 || hour === 24 ? 'AM' : 'PM'}`;
/** When a session can start, in words, from `HEADSHOTS`. */
export const SESSION_HOURS = `between ${clockWords(HEADSHOTS.from)} and ${clockWords(HEADSHOTS.until)}`;
/** A résumé, made from the record at your own desk: an hour. ASSUMPTION. */
export const RESUME = { minutes: 60 } as const;
/** A reel: two hours choosing and reviewing with an editor, $250 for the edit (the old line's estimate, $150 to $400), four pieces at most. ASSUMPTION. */
export const REEL = { cost: 250_00, minutes: 120, most: 4 } as const;
/** The techniques a résumé lists as special skills, and the level from which it lists one. ASSUMPTION: the game's line. */
export const SPECIAL_SKILLS: readonly Skill[] = ['accents', 'combat', 'singing', 'dance', 'improv', 'clown', 'voiceover', 'classical', 'comedy', 'intimacy', 'screen'];
export const SKILL_LISTED_AT = 60;
/** The DRAM 473b course whose filmed monologues the School posts at the end of the final term (yale.md, B27 p.33). */
export const MONOLOGUES_COURSE = 'DRAM 473b';

// ---------------------------------------------------------------------------------------------------------------------
// The record: accessors, building it, its history and its bounds
// ---------------------------------------------------------------------------------------------------------------------

/** A record begun at a moment, with nothing in it. */
export function freshPro(at: Instant): ProRecord {
  return { since: at, credits: [], materials: [], relations: {}, agreements: [], opportunities: [], engagements: [] };
}

/** The record, where the person has one. */
export const proOf = (person: Person): ProRecord | undefined => person.pro;

/** The record, begun now if the person has none. */
export function ensurePro(sim: Simulation, person: Person): ProRecord {
  return (person.pro ??= freshPro(sim.now));
}

/** A new life's record, begun with the life (`populateWorld`). */
export function beginPro(sim: Simulation, person: Person): ProRecord {
  return ensurePro(sim, person);
}

/**
 * An older save's record, built once on its first opening from 2026-10-20 (`pro.begun` in `ONCE_ON_OPENING`): the
 * player's, from what the save holds. Its school credits stay where they are, read as school credits; a graduate joins
 * Equity at the degree, dated then; nothing else is given or reset. Returns whether one was built.
 */
export function buildOnOpening(sim: Simulation): boolean {
  const person = sim.universe.people[sim.universe.playerId];
  if (!person || person.pro) return false;
  const pro = ensurePro(sim, person);
  const school = person.school;
  if (school?.standing === 'graduated' && school.endedAt !== undefined) pro.equity = { since: school.endedAt, how: 'degree' };
  return true;
}

/**
 * Notes an event in a history: a stable id from the `pro` namespace, counted by kind, the oldest dropped past
 * `HISTORY_KEPT`. Noted again under a key the history still holds, it's the one there, unchanged.
 */
export function noteEvent(sim: Simulation, holder: HasHistory, e: { kind: ProEventKind; words: string; key?: string; ref?: ProId; at?: Instant }): ProEvent {
  if (e.key !== undefined) {
    const had = holder.history.find((x) => x.key === e.key);
    if (had) return had;
  }
  const event: ProEvent = { id: sim.nextId('pro'), at: e.at ?? sim.now, kind: e.kind, words: e.words, ...(e.key !== undefined ? { key: e.key } : {}), ...(e.ref !== undefined ? { ref: e.ref } : {}) };
  holder.history.push(event);
  holder.counts[e.kind] = (holder.counts[e.kind] ?? 0) + 1;
  if (holder.history.length > HISTORY_KEPT) holder.history.splice(0, holder.history.length - HISTORY_KEPT);
  return event;
}

/** How many events of a kind a history has had, kept or trimmed. */
export const countOf = (holder: HasHistory, kind: ProEventKind): number => holder.counts[kind] ?? 0;

/**
 * The agreement in force at `at`, if one was: signed by then, and neither ended nor past its term's last day. The one
 * rule the agent's relationship, the work's submissions and the pay's commission read for "represented on this date"
 * (from 2026-10-21, written into the core before those three were built apart, so they couldn't each keep their own).
 * An agreement ended since is still the one in force for a date inside its term, as a payment's commission needs.
 */
export function activeAgreement(person: Person, at: Instant): Agreement | undefined {
  // Only a signed agreement has `signedAt`: one offered, declined or let lapse never does.
  return person.pro?.agreements.find((a) => a.signedAt !== undefined && a.signedAt <= at && at < Math.min(a.endedAt ?? Infinity, a.endsAt ?? Infinity));
}

const RESOLVED: readonly OpportunityStatus[] = ['booked', 'passed', 'declined', 'lapsed', 'withdrawn', 'refused'];
export const resolved = (o: Opportunity): boolean => RESOLVED.includes(o.status);
export const finished = (e: Engagement): boolean => e.status === 'finished' || e.status === 'canceled';

/**
 * The record kept to its bounds: resolved opportunities to the last `OPPORTUNITIES_KEPT` by when each was settled,
 * finished engagements to the last `ENGAGEMENTS_KEPT`, each kind of material to the last `MATERIALS_KEPT`. What's live
 * is never trimmed, and the counts of what was are kept.
 */
export function keepBounded(pro: ProRecord): void {
  const trimmed = (pro.trimmed ??= { opportunities: 0, engagements: 0 });
  const done = pro.opportunities.filter(resolved).sort((a, b) => (a.resolvedAt ?? a.postedAt) - (b.resolvedAt ?? b.postedAt));
  const dropO = new Set(done.slice(0, Math.max(0, done.length - OPPORTUNITIES_KEPT)));
  if (dropO.size) { pro.opportunities = pro.opportunities.filter((o) => !dropO.has(o)); trimmed.opportunities += dropO.size; }
  const over = pro.engagements.filter(finished).sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0));
  const dropE = new Set(over.slice(0, Math.max(0, over.length - ENGAGEMENTS_KEPT)));
  if (dropE.size) { pro.engagements = pro.engagements.filter((e) => !dropE.has(e)); trimmed.engagements += dropE.size; }
  for (const kind of ['headshot', 'resume', 'reel'] as const) {
    const all = pro.materials.filter((m) => m.kind === kind).sort((a, b) => a.made - b.made);
    if (all.length <= MATERIALS_KEPT) continue;
    const drop = new Set(all.slice(0, all.length - MATERIALS_KEPT));
    pro.materials = pro.materials.filter((m) => !drop.has(m));
  }
}

/** The current material of a kind: the latest made. */
export function currentOf(pro: ProRecord | undefined, kind: MaterialKind): Material | undefined {
  return pro?.materials.filter((m) => m.kind === kind).sort((a, b) => b.made - a.made)[0];
}

/** A material added to the record, numbered among its kind, and the record kept to its bounds. */
function addMaterial(sim: Simulation, pro: ProRecord, m: Omit<Material, 'id' | 'version'>): Material {
  const made = (pro.made ??= {});
  made[m.kind] = (made[m.kind] ?? pro.materials.filter((x) => x.kind === m.kind).length) + 1;
  const material: Material = { id: sim.nextId('pro'), version: made[m.kind]!, ...m };
  pro.materials.push(material);
  keepBounded(pro);
  return material;
}

/**
 * A credit added to the record (the work system's, when a part is performed or shot): its id from the `pro` namespace.
 * A credit is never a practice brief, a self-tape or a class piece.
 */
export function addCredit(sim: Simulation, person: Person, c: Omit<ProCredit, 'id'>): ProCredit {
  const credit: ProCredit = { id: sim.nextId('pro'), ...c };
  ensurePro(sim, person).credits.push(credit);
  return credit;
}

/**
 * A screen credit's work released (the work system calls this when the project comes out): its footage can go on a
 * reel from then (`reelSources`). Returns the credit, or nothing where there's no such screen credit.
 */
export function releaseScreenCredit(sim: Simulation, person: Person, creditId: ProId, at: Instant = sim.now): ProCredit | undefined {
  const credit = person.pro?.credits.find((c) => c.id === creditId && c.medium !== 'stage');
  if (!credit) return undefined;
  credit.status = 'released';
  credit.releasedAt ??= at;
  return credit;
}

// ---------------------------------------------------------------------------------------------------------------------
// The profile, worked out from the record
// ---------------------------------------------------------------------------------------------------------------------

/** Where a person lives, and its zone: the town they're in. */
function placeOf(person: Person): { cityId: string; city: string; zone: string } {
  const city = CITIES.get(person.currentLocationId);
  return { cityId: person.currentLocationId, city: city?.name ?? 'Unknown', zone: city?.timeZone ?? 'America/New_York' };
}

export interface Training {
  status: 'completed' | 'candidate' | 'left' | 'none';
  /** In a sentence, true to the record. */
  words: string;
  /** As a résumé's line says it. */
  short: string;
}

const SCHOOL_NAME = YALE_DRAMA.name;

/**
 * Training and education, as the record has them: the MFA completed and its year; a candidate in year N; or studied N
 * terms and left without it. A student who left lists the program and the years and claims no degree (yale.md, an
 * ASSUMPTION: no Yale rule says how).
 */
export function trainingOf(person: Person): Training {
  const school = person.school;
  if (!school) return { status: 'none', words: 'No drama school training is on your record.', short: 'No drama school training' };
  const zone = placeOf(person).zone;
  if (school.standing === 'graduated') {
    const year = school.endedAt !== undefined ? zonedParts(school.endedAt, zone).year : school.classOf;
    return { status: 'completed', words: `You completed the ${YALE_DRAMA.degree} in ${YALE_DRAMA.program} at the ${SCHOOL_NAME} in ${year}.`, short: `${YALE_DRAMA.degree} in ${YALE_DRAMA.program}, ${SCHOOL_NAME}, ${year}` };
  }
  if (leftWithout(school.standing)) {
    const terms = enrolledTerms(school).length;
    const from = termStart(0).date.year;
    const to = school.endedAt !== undefined ? zonedParts(school.endedAt, zone).year : from;
    const years = to > from ? `${from} to ${to}` : String(from);
    const counted = `${countWords(terms)} ${terms === 1 ? 'term' : 'terms'}`;
    return { status: 'left', words: `You studied ${YALE_DRAMA.program.toLowerCase()} in the ${YALE_DRAMA.degree} program at the ${SCHOOL_NAME} for ${counted}, ${years}, and didn’t complete the degree.`, short: `${YALE_DRAMA.program}, ${SCHOOL_NAME}, ${years} (${counted}, no degree)` };
  }
  const year = yearOfStudy(person);
  const away = school.leave?.status === 'on' ? ', on a leave of absence' : '';
  return { status: 'candidate', words: `You’re an ${YALE_DRAMA.degree} candidate in ${YALE_DRAMA.program} at the ${SCHOOL_NAME}, in year ${countWords(year)} of three${away}.`, short: `${YALE_DRAMA.degree} in ${YALE_DRAMA.program} (candidate, year ${year} of 3), ${SCHOOL_NAME}` };
}

/** A school credit as the profile and a résumé list it. */
export interface SchoolCreditLine {
  key: string;
  production: string;
  role: string;
  venue: string;
  year: number;
  understudy: boolean;
  wentOn: number;
}

const VENUE: Readonly<Record<string, string>> = {
  understudy: 'Yale Repertory Theatre', role: 'Yale Repertory Theatre', cabaret: 'Yale Cabaret', summer: 'Yale Summer Cabaret',
};

/**
 * The School credits: what `school.credits` files, and a run closed and not yet filed (its last night played), as the
 * Player Profile's School Journey reads them. Read, never copied into the professional record.
 */
export function schoolCreditsOf(person: Person): SchoolCreditLine[] {
  const school = person.school;
  if (!school) return [];
  const filed = school.credits ?? [];
  const closed = [school.casting, school.rep]
    .filter((c): c is NonNullable<typeof c> => !!c && c.performed > 0 && (c as { closed?: number }).closed !== undefined)
    .filter((c) => !filed.some((f) => f.production === c.production && f.role === c.role))
    .map((c) => ({ production: c.production, role: c.role, kind: c.kind as string, year: termStart(c.term).date.year, wentOn: c.performed }));
  return [...filed, ...closed].map((c) => ({
    key: `school:${c.production}|${c.role}|${c.year}`, production: c.production, role: c.role, venue: VENUE[c.kind] ?? SCHOOL_NAME, year: c.year,
    understudy: c.kind === 'understudy', wentOn: c.wentOn,
  }));
}

/** A school credit as one line: the part, the production, where and when. */
export const schoolCreditWords = (c: SchoolCreditLine): string => `${c.role}${c.understudy ? ` (understudy, went on ${plural(c.wentOn, 'time')})` : ''}, ${c.production}, ${c.venue}, ${c.year}`;
/** A professional credit as one line. */
export const proCreditWords = (c: ProCredit): string => `${c.role}, ${c.project}, ${c.company}, ${c.year}${c.status === 'unreleased' ? ' (unreleased)' : c.status === 'shot' ? ' (not yet released)' : ''}`;

/** The special skills on record: a technique from the résumé's list at `SKILL_LISTED_AT` or more. */
export function skillsOf(person: Person): { skill: Skill; label: string; level: number; mastered: boolean }[] {
  const craft = person.craft;
  if (!craft) return [];
  return SPECIAL_SKILLS.filter((s) => (craft[s] ?? 0) >= SKILL_LISTED_AT)
    .map((s) => ({ skill: s, label: TECHNIQUE_LABEL[s], level: Math.round(craft[s]), mastered: craft[s] >= MASTERED }))
    .sort((a, b) => b.level - a.level);
}

/** The unions, as the record holds them, in a sentence. */
export function unionsOf(person: Person, zone: string): { equity?: Instant; sagEligible?: Instant; sagMember?: Instant; words: string } {
  const pro = person.pro;
  const equity = pro?.equity?.since;
  const sagMember = pro?.sag?.memberSince;
  const sagEligible = pro?.sag?.eligibleSince;
  const said = [
    equity !== undefined ? `You joined ${UNIONS.equity.name}${pro?.equity?.how === 'degree' ? ' with the degree' : ''} on ${formatDate(equity, zone)}.` : '',
    sagMember !== undefined ? `You joined SAG-AFTRA on ${formatDate(sagMember, zone)}.` : sagEligible !== undefined ? `You’ve been eligible to join SAG-AFTRA since ${formatDate(sagEligible, zone)}.` : '',
  ].filter(Boolean);
  return { equity, sagEligible, sagMember, words: said.length ? said.join(' ') : 'Neither actors’ union counts you as a member yet.' };
}

/** Whether they may work in the US for an employer now, and why, in a sentence (`usWorkAuthorized`, `systems/permission.ts`). */
export function eligibilityOf(person: Person, at: Instant): { authorized: boolean; words: string } {
  const zone = placeOf(person).zone;
  const authorized = usWorkAuthorized(person, at);
  if (authorized && citizenOf(person, 'US')) return { authorized, words: 'You’re a US citizen, so you can work for any employer in the US.' };
  if (authorized) {
    const permit = documentsOf(person).filter((d) => d.kind === 'permit' && d.destination === 'US' && d.status === 'valid' && inForce(d, at)).sort((a, b) => (b.expiresAt ?? 0) - (a.expiresAt ?? 0))[0];
    return { authorized, words: permit ? `Your ${permit.name} lets you work for any employer in the US${permit.expiresAt !== undefined ? ` until ${formatDate(permit.expiresAt, zone)}` : ''}.` : 'You can work for any employer in the US.' };
  }
  const studying = person.school !== undefined && !schoolEnded(person.school.standing);
  if (f1Of(person) && studying) return { authorized, words: 'Your F-1 lets you work only on campus while you’re a student, so you can’t work for an employer outside the School.' };
  return { authorized, words: 'There’s no permission to work in the US among your papers. Papers, under Permission To Work, shows what you hold.' };
}

/** Whether they're at school now, and until when, and the days booked for work. */
export function availabilityOf(person: Person, at: Instant): { inSchool: boolean; words: string; booked: { from: Instant; to: Instant; label: string }[] } {
  const zone = placeOf(person).zone;
  const school = person.school;
  const inSchool = school !== undefined && !schoolEnded(school.standing);
  const booked = (person.pro?.engagements ?? []).filter((e) => !finished(e)).flatMap((e) => e.days).filter((d) => d.to > at).sort((a, b) => a.from - b.from);
  const bookedWords = booked.length ? ` You’re booked: ${spokenList(booked.map((d) => `${d.label}, ${formatDate(d.from, zone)}${zonedParts(d.to, zone).day !== zonedParts(d.from, zone).day ? ` to ${formatDate(d.to, zone)}` : ''}`))}.` : '';
  if (inSchool && school.leave?.status === 'on') return { inSchool, words: `You’re on a leave of absence from the School.${bookedWords}`, booked };
  if (inSchool) {
    const year = school.classOf + Math.ceil((school.offset ?? 0) / 2);
    return { inSchool, words: `You’re at the School until the degree, expected in May ${year}.${bookedWords}`, booked };
  }
  return { inSchool, words: booked.length ? bookedWords.trim() : 'Free for work, with nothing booked.', booked };
}

/**
 * The way the life is on, from the School's record, as the Career screen's Overview says it. Early graduation isn't one:
 * the Bulletin lets the faculty reduce residency "on rare occasions", never below two years, and publishes no way to ask
 * (yale.md §2).
 */
export function pathwayOf(person: Person): { id: 'degree' | 'graduate' | 'left' | 'none'; heading: string; words: string } {
  const t = trainingOf(person);
  if (t.status === 'candidate') return { id: 'degree', heading: 'Completing The Degree', words: `Year ${countWords(yearOfStudy(person))} of the ${YALE_DRAMA.degree}: the degree comes at Commencement after your sixth term, and everything on your record goes on with you.` };
  if (t.status === 'completed') return { id: 'graduate', heading: 'A Graduate', words: `You’ve completed the ${YALE_DRAMA.degree}. Your training, the parts you played at the School and the portfolio you make go on with you.` };
  if (t.status === 'left') return { id: 'left', heading: 'Left Without The Degree', words: 'Leaving without the degree keeps what you did: your training stays on your record as it was, and so do the parts you played there.' };
  return { id: 'none', heading: 'Without A Drama School', words: 'Without a drama school behind you, your portfolio is built from what you do from here.' };
}

export interface ProProfile {
  name: string;
  /** Whether a professional name was set, or it's the display name. */
  nameSet: boolean;
  training: Training;
  schoolCredits: SchoolCreditLine[];
  proCredits: ProCredit[];
  skills: ReturnType<typeof skillsOf>;
  availability: ReturnType<typeof availabilityOf>;
  location: { cityId: string; city: string };
  eligibility: ReturnType<typeof eligibilityOf>;
  unions: ReturnType<typeof unionsOf>;
}

/** The profile, worked out from the record at a moment: never stored, so it can't disagree with what it reads. */
export function profileOf(person: Person, at: Instant): ProProfile {
  const place = placeOf(person);
  return {
    name: person.pro?.name ?? person.displayName,
    nameSet: person.pro?.name !== undefined,
    training: trainingOf(person),
    schoolCredits: schoolCreditsOf(person),
    proCredits: [...(person.pro?.credits ?? [])].sort((a, b) => b.at - a.at),
    skills: skillsOf(person),
    availability: availabilityOf(person, at),
    location: { cityId: place.cityId, city: place.city },
    eligibility: eligibilityOf(person, at),
    unions: unionsOf(person, place.zone),
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// The résumé
// ---------------------------------------------------------------------------------------------------------------------

/** What a résumé made now would say, a line each, and the record behind it by key. */
export function resumeNow(person: Person, at: Instant): { name: string; lines: string[]; keys: string[]; labels: Record<string, string> } {
  const p = profileOf(person, at);
  const lines: string[] = [p.name];
  const keys: string[] = [`name:${p.name}`];
  const labels: Record<string, string> = { [`name:${p.name}`]: `your name as ${p.name}` };
  const add = (key: string, line: string, label: string) => { lines.push(line); keys.push(key); labels[key] = label; };
  if (p.unions.equity !== undefined) add('union:equity', UNIONS.equity.name, 'your Equity membership');
  if (p.unions.sagMember !== undefined) add('union:sag', 'SAG-AFTRA', 'your SAG-AFTRA membership');
  else if (p.unions.sagEligible !== undefined) add('union:sag-eligible', 'SAG-AFTRA Eligible', 'your SAG-AFTRA eligibility');
  add(`training:${p.training.status}:${p.training.short}`, `Training: ${p.training.short}`, `your training as it stands now (${p.training.short})`);
  for (const c of p.proCredits) add(`pro:${c.id}`, proCreditWords(c), `${c.role} in ${c.project} (${c.year})`);
  for (const c of p.schoolCredits) add(c.key, schoolCreditWords(c), `${c.role} in ${c.production} (${c.year})`);
  for (const s of p.skills) add(`skill:${s.skill}${s.mastered ? ':mastered' : ''}`, `Special skill: ${s.label}${s.mastered ? ', mastered' : ''}`, `${s.label}${s.mastered ? ' at mastery' : ''}`);
  return { name: p.name, lines, keys, labels };
}

/** What the current résumé is missing against the record now, a phrase each; empty where it's up to date. */
export function resumeBehind(person: Person, at: Instant): string[] {
  const current = currentOf(person.pro, 'resume');
  if (!current) return [];
  const now = resumeNow(person, at);
  const had = new Set(current.keys ?? []);
  return now.keys.filter((k) => !had.has(k)).map((k) => now.labels[k]!);
}

// ---------------------------------------------------------------------------------------------------------------------
// What a reel can be cut from
// ---------------------------------------------------------------------------------------------------------------------

export interface ReelSource extends MaterialPiece {
  usable: boolean;
  /** Why it can't go on a reel, where it can't. */
  why?: string;
}

/**
 * Everything recorded that a reel could be cut from, newest first: the self-tapes the player taped (each brief's kept
 * takes), the School's filmed monologues once the final term's DRAM 473b is passed and posted (yale.md, B27 p.33: "posted
 * on the School website at the end of the final semester"), and a released screen credit's footage (`releaseScreenCredit`).
 * A night on stage, a class piece and a showcase scene are never recorded. A voice brief is a sound recording, with no
 * picture, and is listed as one that can't go on a reel.
 */
export function reelSources(person: Person, at: Instant): ReelSource[] {
  const out: ReelSource[] = [];
  for (const [id, rec] of Object.entries(person.briefs ?? {})) {
    const brief = BRIEF_BY_ID[id];
    if (!brief) continue;
    for (const t of rec.takes) {
      const usable = brief.medium === 'camera';
      out.push({ ref: `tape:${id}:${t.at}`, from: 'tape', title: `${brief.title}, A Self-Tape`, at: t.at, band: bandOfQuality(t.together?.overall ?? t.overall), genre: t.genre, usable, ...(usable ? {} : { why: 'It’s a voice recording with no picture, so it can’t go on a reel.' }) });
    }
  }
  const school = person.school;
  for (const r of Object.values(school?.courses ?? {})) {
    if (r.code !== MONOLOGUES_COURSE || r.result !== 'pass') continue;
    const posted = schoolAt(classPeriod(r.term).to, 17);
    if (posted > at) continue;
    const shown = (school?.coursework?.assignments ?? []).filter((a) => a.course === MONOLOGUES_COURSE && a.term === r.term && a.shown).map((a) => a.shown!.band);
    const best = (['exceptional', 'strong', 'working', 'unready'] as const).find((b) => shown.includes(b));
    out.push({ ref: `monologues:${r.term}`, from: 'monologues', title: `Your Filmed Monologues, ${r.name} (${MONOLOGUES_COURSE})`, at: posted, ...(best ? { band: best } : {}), usable: true });
  }
  for (const c of person.pro?.credits ?? []) {
    if (c.medium === 'stage' || c.status !== 'released' || c.releasedAt === undefined) continue;
    out.push({ ref: `footage:${c.id}`, from: 'footage', title: `${c.role}, ${c.project}`, at: c.releasedAt, ...(c.band ? { band: c.band } : {}), usable: true });
  }
  return out.sort((a, b) => b.at - a.at);
}

/** A reel's piece as a line: what it is, how it was judged, when. */
export const pieceWords = (p: MaterialPiece, zone: string): string => `${p.title}${p.band ? `, ${BAND_LABEL[p.band]}` : ''}, ${formatDate(p.at, zone)}`;

// ---------------------------------------------------------------------------------------------------------------------
// What's missing or unsuitable
// ---------------------------------------------------------------------------------------------------------------------

/** What a set of materials is for: approaching an agent, or a submission for stage or screen work. */
export type MaterialPurpose = 'representation' | 'stage' | 'screen';

export interface MaterialProblem {
  kind: MaterialKind;
  problem: 'missing' | 'out-of-date' | 'behind' | 'tapes-only' | 'newer-work';
  /** Whether it stops the purpose: a submission with no headshot or résumé isn't one. */
  blocking: boolean;
  /** The problem and what to do about it, in a sentence or two. */
  words: string;
}

/**
 * Each problem with the materials for a purpose, in practical words: headshots and a résumé are needed for every one;
 * a reel is asked of screen work and of an approach for representation, and is never needed for the stage. The agent's
 * and the work's systems read this before an approach or a submission, and the Career screen shows it.
 */
export function materialsCheck(person: Person, purpose: MaterialPurpose, at: Instant): MaterialProblem[] {
  const zone = placeOf(person).zone;
  const pro = person.pro;
  const out: MaterialProblem[] = [];
  const headshot = currentOf(pro, 'headshot');
  if (!headshot) out.push({ kind: 'headshot', problem: 'missing', blocking: true, words: 'You have no headshots, and every submission starts with one. Press Book A Headshot Session on the Career screen’s Portfolio tab.' });
  else if (at - headshot.made > HEADSHOTS.staleDays * MS_DAY) out.push({ kind: 'headshot', problem: 'out-of-date', blocking: false, words: `Your headshots are from ${formatDate(headshot.made, zone)}, more than two years ago, so they may not look like you now. A new session gives you current ones.` });
  const resume = currentOf(pro, 'resume');
  if (!resume) out.push({ kind: 'resume', problem: 'missing', blocking: true, words: 'You have no résumé. Press Make Your Résumé on the Career screen’s Portfolio tab: it takes an hour, from your record.' });
  else {
    const behind = resumeBehind(person, at);
    if (behind.length) out.push({ kind: 'resume', problem: 'behind', blocking: false, words: `Your résumé from ${formatDate(resume.made, zone)} doesn’t have ${spokenList(behind)}. Press Update Your Résumé to bring it up to date.` });
  }
  if (purpose === 'stage') return out;
  const reel = currentOf(pro, 'reel');
  const sources = reelSources(person, at).filter((s) => s.usable);
  if (!reel) {
    out.push({ kind: 'reel', problem: 'missing', blocking: false, words: sources.length ? `You have no reel, and screen casting often asks for one. You have ${plural(sources.length, 'recorded piece')} to cut one from.` : 'You have no reel, and nothing recorded to cut one from yet. Tape a practice brief on the Player Profile first.' });
    return out;
  }
  const pieces = reel.pieces ?? [];
  if (pieces.length && pieces.every((p) => p.from === 'tape')) out.push({ kind: 'reel', problem: 'tapes-only', blocking: false, words: 'Your reel holds only self-tapes. Work filmed at the School or on a set shows more of what you can do.' });
  const newer = sources.filter((s) => s.at > reel.made && !pieces.some((p) => p.ref === s.ref));
  if (newer.length) out.push({ kind: 'reel', problem: 'newer-work', blocking: false, words: `You’ve recorded more since you cut your reel on ${formatDate(reel.made, zone)}: ${spokenList(newer.slice(0, 3).map((s) => s.title))}${newer.length > 3 ? `, and ${plural(newer.length - 3, 'more piece')}` : ''}.` });
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Making and updating the materials: each command's refusal, said before it's pressed, and the command
// ---------------------------------------------------------------------------------------------------------------------

/** A session's cost in the save's money. */
export const headshotCost = (sim: Simulation): Money => inSaveMoney(sim, HEADSHOTS.cost, 'USD');
/** A reel's edit in the save's money. */
export const reelCost = (sim: Simulation): Money => inSaveMoney(sim, REEL.cost, 'USD');

/** The money refusal: before it's pressed, what can't be covered; once pressed, what didn't happen too (docs/STYLE.md). */
function moneyRefusal(sim: Simulation, person: Person, cost: Money, what: string, pressed: boolean): string | undefined {
  if (!spendRefusal(sim, person, cost, 'career')) return undefined;
  const money = formatMoney(cost, saveCurrency(sim.universe));
  return pressed ? `Your bank can’t cover ${money}, so nothing was charged.` : `Your bank can’t cover the ${money} ${what}.`;
}

/** Why a headshot session can't be had now, or nothing. */
export function headshotRefusal(sim: Simulation, person: Person, pressed = false): string | undefined {
  const busy = startRefusal(sim, person, HEADSHOTS.minutes, true);
  if (busy) return busy;
  const hour = zonedParts(sim.now, sim.zone).hour;
  if (hour < HEADSHOTS.from || hour >= HEADSHOTS.until) return `Photographers work by day: a session starts ${SESSION_HOURS}.`;
  return moneyRefusal(sim, person, headshotCost(sim), 'session', pressed);
}

/** Why the résumé can't be made or updated now, or nothing. */
export function resumeRefusal(sim: Simulation, person: Person): string | undefined {
  const current = currentOf(person.pro, 'resume');
  if (current && !resumeBehind(person, sim.now).length) return `Your résumé from ${formatDate(current.made, sim.zone)} already has everything on your record.`;
  return startRefusal(sim, person, RESUME.minutes);
}

/** Why a reel can't be cut from these pieces now, or nothing. */
export function reelRefusal(sim: Simulation, person: Person, pieces: readonly string[], pressed = false): string | undefined {
  const sources = reelSources(person, sim.now);
  if (!sources.some((s) => s.usable)) return 'You have nothing recorded to cut a reel from. Tape a practice brief on the Player Profile first.';
  if (!pieces.length) return 'Choose at least one recorded piece to cut it from.';
  if (new Set(pieces).size !== pieces.length) return 'Each piece goes on a reel once.';
  if (pieces.length > REEL.most) return `A reel holds ${countWords(REEL.most)} pieces at most.`;
  for (const ref of pieces) {
    const s = sources.find((x) => x.ref === ref);
    if (!s) return 'That piece isn’t among your recorded material.';
    if (!s.usable) return s.why!;
  }
  const current = currentOf(person.pro, 'reel');
  if (current && current.pieces?.length === pieces.length && pieces.every((r) => current.pieces!.some((p) => p.ref === r))) return 'Your reel already holds exactly these pieces.';
  const busy = startRefusal(sim, person, REEL.minutes);
  if (busy) return busy;
  return moneyRefusal(sim, person, reelCost(sim), 'edit', pressed);
}

/** The longest professional name the record keeps. */
export const NAME_MOST = 40;

/** Why a professional name can't be set to this, or nothing. An empty one, or the display name, goes back to the display name. */
export function nameRefusal(person: Person, name: string): string | undefined {
  const n = name.trim().replace(/\s+/g, ' ');
  const current = person.pro?.name;
  if (n.length > NAME_MOST) return `A professional name is ${NAME_MOST} characters at most.`;
  if (n && !/^\p{L}[\p{L}\p{M} .’'-]*$/u.test(n)) return 'A professional name is letters, with spaces, hyphens, apostrophes and periods between them.';
  if ((!n || n === person.displayName) && current === undefined) return 'You’re already working under your own name.';
  if (n && n === current) return 'That’s already your professional name.';
  return undefined;
}

export function registerPro(sim: Simulation): void {
  sim.onCommand<{ name: string }, { name: string; set: boolean }>('pro.set_name', (p, { sim: s }) => {
    const person = s.player;
    const raw = String(p?.name ?? '');
    const no = nameRefusal(person, raw);
    if (no) throw new CommandError(no);
    const pro = ensurePro(s, person);
    const n = raw.trim().replace(/\s+/g, ' ');
    if (!n || n === person.displayName) delete pro.name;
    else pro.name = n;
    return { name: pro.name ?? person.displayName, set: pro.name !== undefined };
  });

  sim.onCommand<Record<string, never>, { id: ProId; cost: Money; made: Instant }>('pro.headshots', (_p, { sim: s }) => {
    const person = s.player;
    const no = headshotRefusal(s, person, true);
    if (no) throw new CommandError(no);
    const pro = ensurePro(s, person);
    const cost = headshotCost(s);
    const start = s.now;
    if (!spend(s, person, cost, 'Headshot session', 'career')) throw new CommandError(`Your bank can’t cover ${formatMoney(cost, saveCurrency(s.universe))}, so nothing was charged.`);
    s.advanceTo(start + HEADSHOTS.minutes * 60_000);
    const m = addMaterial(s, pro, {
      kind: 'headshot', made: start, cost,
      source: `A session with a photographer, ${formatMoney(cost, saveCurrency(s.universe))} and four hours, both estimated.`,
      contains: [`Retouched photographs of you as you looked on ${formatDate(start, s.zone)}, for submissions and your résumé.`],
    });
    return { id: m.id, cost, made: m.made };
  });

  sim.onCommand<Record<string, never>, { id: ProId; version: number; lines: number }>('pro.update_resume', (_p, { sim: s }) => {
    const person = s.player;
    const no = resumeRefusal(s, person);
    if (no) throw new CommandError(no);
    const pro = ensurePro(s, person);
    const start = s.now;
    const r = resumeNow(person, start);
    s.advanceTo(start + RESUME.minutes * 60_000);
    const m = addMaterial(s, pro, { kind: 'resume', made: start, name: r.name, source: `Made from your record on ${formatDate(start, s.zone)}, in an hour at your own desk.`, contains: r.lines, keys: r.keys });
    return { id: m.id, version: m.version, lines: m.contains.length };
  });

  sim.onCommand<{ pieces: string[] }, { id: ProId; cost: Money; pieces: number }>('pro.cut_reel', (p, { sim: s }) => {
    const person = s.player;
    const refs = Array.isArray(p?.pieces) ? p.pieces.map(String) : [];
    const no = reelRefusal(s, person, refs, true);
    if (no) throw new CommandError(no);
    const pro = ensurePro(s, person);
    const cost = reelCost(s);
    const start = s.now;
    const sources = reelSources(person, start);
    const pieces: MaterialPiece[] = refs.map((ref) => { const { usable: _u, why: _w, ...piece } = sources.find((x) => x.ref === ref)!; return piece; });
    if (!spend(s, person, cost, 'A reel, edited', 'career')) throw new CommandError(`Your bank can’t cover ${formatMoney(cost, saveCurrency(s.universe))}, so nothing was charged.`);
    s.advanceTo(start + REEL.minutes * 60_000);
    const m = addMaterial(s, pro, {
      kind: 'reel', made: start, cost, pieces,
      source: `Cut by an editor from your recorded work on ${formatDate(start, s.zone)}, ${formatMoney(cost, saveCurrency(s.universe))} and two hours, both estimated.`,
      contains: pieces.map((x) => pieceWords(x, s.zone)),
    });
    return { id: m.id, cost, pieces: pieces.length };
  });
}
