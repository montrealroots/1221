/**
 * SLATE — Bringing a real person into your save.
 *
 * The roster is reference data: a record of who somebody is and what they have
 * made. It stays that way until you deal with them. The moment you offer
 * somebody a part, or try to attach a director, they become a person in this
 * save — with a quote, a diary, an opinion of you and the ability to say no.
 *
 * Two lines are drawn and neither is crossed.
 *
 * The record is theirs. Their name, their date of birth, where they are from,
 * what they have made and what they have won come from the public record and
 * are never edited by the game.
 *
 * Everything after the save begins is the save's. Whether they take your call,
 * what they charge you, what they think of you afterwards and what they do
 * next is simulation, it is labelled as simulation, and none of it is a claim
 * about the person.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { ContractKind, CraftApproach, Id, Person, Project, Role, RoleOffer } from '../domain/model';
import { clamp } from '../core/rng';
import { MS_DAY } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { buildFactors, type AuditFactor } from '../core/audit';
import { ATTRIBUTES, emptyAttributeSheet, type AttributeSheet } from '../domain/attributes';
import {
  allPeople, ageIsApproximate, ageOf, awardsFor, confidenceOf, creditsFor, deriveSheet,
  franchisesOf, overallFor, personByQid, primaryRole, rolesWithSheets, signalsOf,
  type PersonRecord,
} from '../content/people';
import { isScreenAward } from '../content/award-records';
import { CRAFT_ROLE_LABEL, type CraftRole } from '../content/craft-attributes';
import { CITIES, countryOfCity } from '../content/geography';
import { playerCompanies } from './company';
import { titleCaseLabel } from '../core/text';

// ---------------------------------------------------------------------------
// What somebody is worth
// ---------------------------------------------------------------------------

/**
 * What one job costs, in cents.
 *
 * Read off what their work does rather than off anything published: the size
 * of what they are on, how often they are on it, and what they have won. It is
 * SLATE's estimate of a market rate and the screens say so — nobody's real fee
 * is a matter of public record, and this is not a claim about one.
 */
export function quoteFor(record: PersonRecord, role: CraftRole = primaryRole(record)): Money {
  const evidence = record.evidence[role];
  if (!evidence) return 40_000_00;
  const signals = signalsOf(evidence, role);

  // A floor by trade, then multiplied by what their work actually does.
  const floor: Record<CraftRole, number> = {
    actor: 60_000_00, director: 150_000_00, producer: 120_000_00,
    showrunner: 200_000_00, cinematographer: 90_000_00, composer: 60_000_00,
  };
  const ceiling: Record<CraftRole, number> = {
    actor: 20_000_000_00, director: 15_000_000_00, producer: 8_000_000_00,
    showrunner: 6_000_000_00, cinematographer: 1_800_000_00, composer: 2_000_000_00,
  };

  const pull = signals.scale * 0.42 + signals.acclaim * 0.22 + signals.volume * 0.14
    + signals.recency * 0.12 + signals.franchise * 0.10;
  const value = floor[role] * Math.pow(ceiling[role] / floor[role], clamp(pull, 0, 1));
  // Rounded the way an offer is actually written.
  const step = value > 1_000_000_00 ? 250_000_00 : value > 200_000_00 ? 25_000_00 : 5_000_00;
  return Math.max(floor[role], Math.round(value / step) * step);
}

/** How busy they are, which is how hard they are to get. */
export function demandOf(record: PersonRecord, role: CraftRole = primaryRole(record)): number {
  const evidence = record.evidence[role];
  if (!evidence) return 20;
  const signals = signalsOf(evidence, role);
  return Math.round(clamp(
    18 + signals.recency * 34 + signals.scale * 24 + signals.acclaim * 18 + signals.volume * 10,
    5, 99,
  ));
}

/** How well known they are outside the industry. */
export function fameOf(record: PersonRecord, role: CraftRole = primaryRole(record)): number {
  const evidence = record.evidence[role];
  if (!evidence) return 8;
  const signals = signalsOf(evidence, role);
  const actorBonus = role === 'actor' ? 12 : 0;
  return Math.round(clamp(6 + signals.scale * 46 + signals.franchise * 16 + signals.volume * 12 + actorBonus, 2, 99));
}

// ---------------------------------------------------------------------------
// Bringing them in
// ---------------------------------------------------------------------------

/**
 * An index from the public record to this save's people, kept per universe.
 *
 * Casting asks this question once for every person on the roster every time
 * the world fills a part, and a scan of every person in the save each time is
 * quadratic over a long career. The index is rebuilt whenever the population
 * changes and every hit is verified against the save before it is trusted, so
 * a stale entry can only ever cost one rebuild, never a wrong answer.
 */
const recordIndex = new WeakMap<object, { size: number; byQid: Map<string, Id> }>();

function indexFor(sim: Simulation): Map<string, Id> {
  const people = sim.universe.people;
  const size = Object.keys(people).length;
  const cached = recordIndex.get(people);
  if (cached && cached.size === size) return cached.byQid;

  const byQid = new Map<string, Id>();
  for (const person of Object.values(people)) {
    if (person.recordQid && !byQid.has(person.recordQid)) byQid.set(person.recordQid, person.id);
  }
  recordIndex.set(people, { size, byQid });
  return byQid;
}

/** The person in this save who is that person on the record, if they are here yet. */
export function personForRecord(sim: Simulation, qid: string): Person | undefined {
  const id = indexFor(sim).get(qid);
  const found = id ? sim.universe.people[id] : undefined;
  if (found?.recordQid === qid) return found;
  if (!id) return undefined;
  // The index disagreed with the save, which means the population changed
  // without changing size. Rebuild from scratch and answer from the truth.
  recordIndex.delete(sim.universe.people);
  for (const person of Object.values(sim.universe.people)) {
    if (person.recordQid === qid) return person;
  }
  return undefined;
}

/** The record behind somebody in this save, when there is one. */
export function recordForPerson(person: Person): PersonRecord | undefined {
  return person.recordQid ? personByQid(person.recordQid) : undefined;
}

/**
 * The industry's own centre in each country the roster holds. Where somebody
 * works out of is not on the record — where they were born often is — so this
 * is the game placing them somewhere sensible rather than a claim about where
 * anybody lives.
 */
const CENTRE_BY_COUNTRY: Readonly<Record<string, string>> = {
  'United States': 'us-ca-losangeles', 'United Kingdom': 'uk-eng-london',
  England: 'uk-eng-london', Scotland: 'uk-eng-london', Wales: 'uk-eng-london',
  France: 'fr-idf-paris', Japan: 'jp-13-tokyo', 'South Korea': 'kr-11-seoul',
  India: 'in-16-mumbai', Canada: 'ca-on-toronto', Australia: 'au-nsw-sydney',
  Ireland: 'ie-lei-dublin', Germany: 'de-be-berlin', Spain: 'es-md-madrid',
  Italy: 'it-laz-rome', Mexico: 'mx-cmx-mexicocity', Brazil: 'br-27-saopaulo',
  'New Zealand': 'nz-akl-auckland', Sweden: 'se-26-stockholm', Denmark: 'dk-17-copenhagen',
  Norway: 'no-12-oslo', Netherlands: 'nl-07-amsterdam', Nigeria: 'ng-05-lagos',
  China: 'cn-23-shanghai', 'Hong Kong': 'hk-hongkong', Argentina: 'ar-07-buenosaires',
  Poland: 'pl-78-warsaw', Israel: 'il-05-telaviv', 'South Africa': 'za-06-johannesburg',
};

/**
 * Cities by name, built once.
 *
 * Both of the lookups below run for every person on the roster every time the
 * world casts anything, and a linear scan of the city registry each time is
 * the difference between a world that ticks and one that stalls. The index is
 * built on first use and never again; the first city of a name wins, which is
 * the biggest one, because the registry is ordered that way.
 */
let cityByName: Map<string, string> | undefined;
function cityNamed(name: string): string | undefined {
  if (!cityByName) {
    cityByName = new Map();
    for (const city of CITIES.all()) if (!cityByName.has(city.name)) cityByName.set(city.name, city.id);
  }
  return cityByName.get(name);
}

/** Where somebody works out of, as near as the record puts them. */
function homeCityFor(record: PersonRecord, fallback: string): string {
  const named = record.bornIn ? cityNamed(record.bornIn) : undefined;
  if (named) return named;
  const country = record.citizenship[0];
  const chosen = country ? CENTRE_BY_COUNTRY[country] : undefined;
  return chosen && CITIES.get(chosen) ? chosen : fallback;
}

/**
 * Which country's industry somebody belongs to, when the record says enough to
 * tell. Undefined rather than a guess when it does not.
 */
const countryMemo = new Map<string, string | undefined>();
export function countryIdForRecord(record: PersonRecord): string | undefined {
  const cached = countryMemo.get(record.qid);
  if (cached !== undefined || countryMemo.has(record.qid)) return cached;

  const born = record.bornIn ? cityNamed(record.bornIn) : undefined;
  const centre = record.citizenship[0] ? CENTRE_BY_COUNTRY[record.citizenship[0]] : undefined;
  const answer = born ? countryOfCity(born) : centre ? countryOfCity(centre) : undefined;
  countryMemo.set(record.qid, answer);
  return answer;
}

/** Their attribute sheet, mapped onto the eighty-eight an actor is scored on. */
function attributesFrom(record: PersonRecord): AttributeSheet {
  const sheet = emptyAttributeSheet(24);
  if (record.roles.includes('actor') || rolesWithSheets(record).includes('actor')) {
    for (const derived of deriveSheet(record, 'actor')) sheet[derived.id] = derived.value;
    return sheet;
  }
  // Somebody who is not an actor still has a level of craft, and the sheet has
  // to say something: their standing in their own trade, softened, so a
  // director who steps in front of a camera is not suddenly a great actor.
  const role = primaryRole(record);
  const overall = overallFor(record, role);
  for (const attribute of ATTRIBUTES) {
    sheet[attribute.id] = clamp(Math.round(overall * 0.45 + 18), 12, 72);
  }
  return sheet;
}

/** The skills of a craft, for somebody whose job is not acting. */
function skillsFrom(record: PersonRecord): Record<string, number> {
  const out: Record<string, number> = {};
  for (const role of rolesWithSheets(record)) {
    if (role === 'actor') continue;
    for (const derived of deriveSheet(record, role)) {
      // 'director.staging' becomes 'staging'; the sheet is flat.
      out[derived.id.split('.')[1] ?? derived.id] = derived.value;
    }
  }
  return out;
}

/**
 * Puts a real person into this save, once.
 *
 * Called the first time anything in the game needs them to be a person rather
 * than a record: an offer, an attachment, a contract. Idempotent — ask twice
 * and you get the same person.
 */
export function ensureRealPerson(sim: Simulation, qid: string): Person | undefined {
  const existing = personForRecord(sim, qid);
  if (existing) return existing;
  const record = personByQid(qid);
  if (!record) return undefined;

  const role = primaryRole(record);
  const parts = record.name.trim().split(/\s+/);
  const firstName = parts[0] ?? record.name;
  const lastName = parts.slice(1).join(' ') || parts[0] || record.name;
  const cityId = homeCityFor(record, sim.player.currentLocationId);
  const age = ageOf(record, sim.now) ?? 40;
  const evidence = record.evidence[role];
  const signals = signalsOf(evidence, role);
  const wins = awardsFor(qid).filter((a) => a.outcome === 'won' && isScreenAward(a.award)).length;

  const person: Person = {
    id: sim.nextId('person'),
    saveId: sim.universe.meta.id,
    isPlayer: false,
    firstName, lastName,
    displayName: record.name,
    stageName: record.name,
    // The record states a gender for many of them and says nothing about how
    // anybody wishes to be addressed. The game does not guess: it uses their
    // name, and they/them where a pronoun is unavoidable.
    pronouns: 'they/them',
    birthInstant: sim.now - age * 365.25 * MS_DAY,
    homeRegionId: cityId,
    citizenshipId: countryOfCity(cityId) ?? 'us',
    currentLocationId: cityId,
    personality: {
      openness: 55 + Math.round(signals.breadth * 30), conscientiousness: 60 + Math.round(signals.consistency * 25),
      extraversion: role === 'actor' ? 65 : 45, agreeableness: 55,
      emotionalStability: 55 + Math.round(signals.longevity * 20),
      ambition: 60 + Math.round(signals.acclaim * 30), riskTolerance: 45 + Math.round(signals.breadth * 25),
    },
    interests: [], goals: [],
    lifestyle: signals.scale > 0.6 ? 'lavish' : 'comfortable',
    background: `${CRAFT_ROLE_LABEL[role]}. ${record.description ?? ''}`.trim(),
    attributes: attributesFrom(record),
    traits: [],
    skills: skillsFrom(record),
    wellbeing: { energy: 72, stress: 45, sleepDebt: 4, morale: 72, condition: 76, fitness: 60, travelFatigue: 8, nourishment: 74, hygiene: 80 },
    reputation: {
      publicFame: fameOf(record, role),
      audienceAppeal: Math.round(clamp(45 + signals.reception * 45, 20, 96)),
      professionalReputation: overallFor(record, role),
      reliability: Math.round(clamp(60 + signals.consistency * 32, 30, 98)),
      prestige: Math.round(clamp(20 + signals.acclaim * 70 + Math.min(wins, 20), 8, 99)),
      industryDemand: demandOf(record, role),
      controversy: 0,
    },
    // The career tracks the game knows are not one per trade: a composer and a
    // cinematographer are both crew as far as an employment record goes.
    careerTrack: role === 'showrunner' ? 'showrunner'
      : role === 'cinematographer' || role === 'composer' ? 'crew'
      : role,
    representation: {},
    quote: quoteFor(record, role),
    creditIds: [], nominationIds: [],
    creditScore: 760,
    tier: 'active',
    industryRole: role,
    recordQid: qid,
    greenlightAuthority: role === 'producer' ? 2_000_000_00 : 0,
    createdAt: sim.now,
  };

  sim.universe.people[person.id] = person;
  sim.emit('people.record_entered', { personId: person.id, qid, role });
  return person;
}

// ---------------------------------------------------------------------------
// Whether they will do it
// ---------------------------------------------------------------------------

export interface Approach {
  /** Will they take it, at that money? */
  interested: boolean;
  probability: number;
  /** What they would want instead, when the money is the problem. */
  wants: Money;
  reasons: AuditFactor[];
  summary: string;
  /** The draw itself, so the answer can be shown with its working. */
  roll: number;
  score: number;
  seed: string;
}

/**
 * What a real person makes of an approach.
 *
 * The script, who else is on it, what you are, what it pays against what they
 * are worth, and whether the work is the kind of work they do. Everything the
 * player could know is knowable; the one thing they cannot see — what else is
 * on that person's desk this month — is marked unknowable and stays hidden in
 * the audit, the same as everywhere else in the game.
 */
export function considerApproach(
  sim: Simulation,
  record: PersonRecord,
  project: Project,
  role: CraftRole,
  offer: Money,
  attempt = 0,
): Approach {
  const evidence = record.evidence[role];
  const signals = signalsOf(evidence, role);
  const wants = quoteFor(record, role);
  const draft = project.currentDraftId ? sim.universe.scriptDrafts[project.currentDraftId] : undefined;
  const script = draft?.quality ?? project.scriptQuality;
  // The attempt is part of the seed, so coming back with real money is a fresh
  // answer rather than the same one read out again — and coming back with the
  // same money is not allowed to be an offer at all (see cast.offer_real).
  const rng = sim.rng('approach', project.id, record.qid, role, String(attempt));

  // How much of what they do is what this is. A comedy actor reading a horror
  // script is a harder yes than one reading a comedy.
  const theirGenres = new Set((evidence?.topGenres ?? []).map((entry) => entry.split(':')[0] ?? ''));
  const overlap = project.genres.filter((g) => [...theirGenres].some((their) => their.includes(g) || g.includes(their))).length;
  const fit = project.genres.length > 0 ? overlap / project.genres.length : 0.4;

  const standing = sim.player.reputation.professionalReputation;
  const money = wants > 0 ? clamp(offer / wants, 0, 2) : 1;
  const attached = project.attachments.length;
  // The industry runs on who you have already been in a room with.
  const history = historyWith(sim, record.qid);

  const { factors, score } = buildFactors([
    { label: 'The Script', detail: `It reads at ${Math.round(script)} out of 100.`, weight: 0.30, value: script / 100 },
    { label: 'The Money', detail: `${Math.round(money * 100)}% of what SLATE reckons they are worth for this.`, weight: 0.26, value: clamp(money / 1.15, 0, 1) },
    { label: 'Whether It Is Their Kind Of Thing', detail: overlap > 0 ? `They work in ${project.genres.slice(0, 2).join(' and ')}.` : 'Not what they usually do.', weight: 0.16, value: fit },
    { label: 'Who Else Is On It', detail: attached > 0 ? `${attached} attached already.` : 'Nobody else yet.', weight: 0.14, value: clamp(project.packageValue / 100, 0, 1) },
    { label: 'Whether They Have Heard Of You', detail: `Your professional standing reads ${Math.round(standing)} out of 100.`, weight: 0.20, value: standing / 100 },
    {
      label: 'Whether You Have Worked Together',
      detail: history.together === 0
        ? 'You have never made anything with them.'
        : `${history.together} thing${history.together === 1 ? '' : 's'} together, the best of which came out at ${Math.round(history.best)}.`,
      weight: 0.18,
      value: clamp(history.together / 3, 0, 1) * clamp(0.45 + history.best / 140, 0, 1),
    },
    { label: 'How Busy They Are', detail: `They are at ${demandOf(record, role)} out of 100 for demand.`, weight: -0.24, value: demandOf(record, role) / 100 },
    { label: 'What Else Is On Their Desk', detail: 'The other things they were sent this month, which you do not get to see.', weight: 0.14, value: rng.float(0, 1), knowable: false },
    // Asking again is not free. Somebody who has already passed once has said
    // what they think of it, and the second read starts from there.
    ...(attempt > 0
      ? [{ label: 'You Have Been Back Before', detail: `This is ask number ${attempt + 1}. They have already read it and passed.`, weight: -0.14, value: clamp(attempt / 3, 0, 1) }]
      : []),
  ]);

  const probability = clamp(score * 1.05 - 0.06, 0.01, 0.95);
  const roll = rng.next();
  const interested = roll < probability;
  void signals;

  return {
    interested,
    probability,
    wants,
    reasons: factors,
    summary: interested
      ? `${record.name} is in.`
      : money < 0.7
        ? `${record.name} passed. The money is the part that is wrong.`
        : `${record.name} passed.`,
    roll,
    score,
    seed: `approach|${project.id}|${record.qid}|${role}|${attempt}`,
  };
}

/**
 * What you and somebody have already made together, and how the best of it
 * turned out.
 *
 * Nothing is stored for this: it is read off the pictures you own, which means
 * it can never drift out of step with them and it survives every architecture
 * change the save has left in it.
 */
export function historyWith(sim: Simulation, qid: string): { together: number; best: number } {
  const person = personForRecord(sim, qid);
  if (!person) return { together: 0, best: 0 };
  const mine = new Set(playerCompanies(sim).map((company) => company.id));
  let together = 0;
  let best = 0;
  for (const project of Object.values(sim.universe.projects)) {
    const yours = project.createdById === sim.universe.playerId
      || (project.ownerCompanyId ? mine.has(project.ownerCompanyId) : false);
    if (!yours) continue;
    const theirs = project.castIds.includes(person.id)
      || project.attachments.some((attachment) => attachment.personId === person.id);
    if (!theirs) continue;
    together++;
    best = Math.max(best, project.finalQuality ?? project.scriptQuality ?? 0);
  }
  return { together, best };
}

/** Everybody on the record who could plausibly do this job, for a search. */
export function candidatesFor(role: CraftRole, options: { limit?: number; query?: string } = {}): PersonRecord[] {
  const query = options.query?.trim().toLowerCase();
  return allPeople()
    .filter((person) => rolesWithSheets(person).includes(role))
    .filter((person) => !query
      || person.name.toLowerCase().includes(query)
      || franchisesOf(person.qid).some((f) => f.toLowerCase().includes(query))
      || creditsFor(person.qid).some((c) => c.title.toLowerCase().includes(query)))
    .sort((a, b) => overallFor(b, role) - overallFor(a, role))
    .slice(0, options.limit ?? 60);
}

/** One line on what a person would cost and how likely they are, for a list. */
export function approachSummary(record: PersonRecord, role: CraftRole): {
  quote: Money; demand: number; standing: number; confidence: number;
} {
  return {
    quote: quoteFor(record, role),
    demand: demandOf(record, role),
    standing: overallFor(record, role),
    confidence: confidenceOf(record.evidence[role]),
  };
}

// ---------------------------------------------------------------------------
// Going to somebody by name
// ---------------------------------------------------------------------------

/** How many times one part can be taken back to the same person. */
const MAX_ASKS = 3;

/** How much more the money has to be before going back counts as a new offer. */
const RAISE_FLOOR = 1.1;

/** Every offer already put to one person on one part. */
function offersTo(role: Role, personId: Id): RoleOffer[] {
  return (role.offers ?? []).filter((offer) => offer.personId === personId);
}

/** Whether the player is the one making this picture. */
export function playerControls(sim: Simulation, project: Project): boolean {
  if (project.createdById === sim.universe.playerId) return true;
  if (!project.ownerCompanyId) return false;
  return playerCompanies(sim).some((company) => company.id === project.ownerCompanyId);
}

/**
 * What a real person is paid for a craft job, over the milestones that job is
 * actually paid over. A director is paid across prep, the shoot and delivery; a
 * composer is paid on spotting and on delivery, because there is nothing to
 * write until there is a cut.
 */
const CRAFT_TERMS: Record<Exclude<CraftRole, 'actor'>, {
  contract: ContractKind;
  attachment: string;
  milestones: { label: string; fraction: number; dueInDays: number }[];
}> = {
  director: {
    contract: 'directing', attachment: 'director',
    milestones: [
      { label: 'On Execution', fraction: 0.20, dueInDays: 0 },
      { label: 'On Commencement Of Principal Photography', fraction: 0.45, dueInDays: 60 },
      { label: 'On Delivery Of The Director’s Cut', fraction: 0.35, dueInDays: 260 },
    ],
  },
  producer: {
    contract: 'producing', attachment: 'producer',
    milestones: [
      { label: 'On Execution', fraction: 0.25, dueInDays: 0 },
      { label: 'On Commencement Of Principal Photography', fraction: 0.45, dueInDays: 60 },
      { label: 'On Delivery', fraction: 0.30, dueInDays: 300 },
    ],
  },
  showrunner: {
    contract: 'producing', attachment: 'showrunner',
    milestones: [
      { label: 'On Execution', fraction: 0.20, dueInDays: 0 },
      { label: 'On Delivery Of The Writers’ Room', fraction: 0.40, dueInDays: 90 },
      { label: 'On Completion Of The Season', fraction: 0.40, dueInDays: 300 },
    ],
  },
  cinematographer: {
    contract: 'crew', attachment: 'cinematographer',
    milestones: [
      { label: 'On Commencement Of Prep', fraction: 0.20, dueInDays: 30 },
      { label: 'Across Principal Photography', fraction: 0.65, dueInDays: 90 },
      { label: 'On Completion Of The Digital Intermediate', fraction: 0.15, dueInDays: 250 },
    ],
  },
  composer: {
    contract: 'crew', attachment: 'composer',
    milestones: [
      { label: 'On Spotting', fraction: 0.30, dueInDays: 200 },
      { label: 'On Delivery Of The Score', fraction: 0.50, dueInDays: 280 },
      { label: 'On The Dub', fraction: 0.20, dueInDays: 310 },
    ],
  },
};

export function registerRealPeople(sim: Simulation): void {
  // --- Taking a part to somebody ------------------------------------------

  sim.onCommand<
    { roleId: Id; qid: string; amount?: Money },
    { accepted: boolean; personId: Id; name: string; amount: Money; wanted: Money; reason: string; contractId?: Id }
  >(
    'cast.offer_real',
    (p, { sim: s }) => {
      const role = s.universe.roles[p.roleId];
      if (!role) throw new CommandError('No such part.');
      const project = s.universe.projects[role.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!playerControls(s, project)) throw new CommandError('That is not your picture to cast.');

      const record = personByQid(p.qid);
      if (!record) throw new CommandError('Nobody on the record by that name.');
      if (!rolesWithSheets(record).includes('actor')) {
        throw new CommandError(`${record.name} is not an actor on the record. Attach them to a craft instead.`);
      }

      // An answer already given is read back before anything else is checked,
      // and never re-rolled. This is what makes the command safe to retry: the
      // same ask can only ever produce the one contract, the one booking and
      // the one credit, and a retry after the part is filled reads the yes
      // rather than tripping over the part being filled by it.
      const accepted = (role.offers ?? []).find((offer) => offer.recordQid === p.qid && offer.answer === 'accepted');
      if (accepted) {
        return {
          accepted: true, personId: accepted.personId, name: record.name,
          amount: accepted.amount, wanted: accepted.wanted, reason: accepted.reason,
          contractId: role.contractId,
        };
      }

      if (role.status === 'cast') throw new CommandError('That part is already cast.');
      if (role.status === 'closed') throw new CommandError('That part is closed.');
      if (role.status === 'offer_out' && role.castPersonId) {
        const out = s.universe.people[role.castPersonId];
        throw new CommandError(`There is already an offer out on that part${out ? ` to ${out.displayName}` : ''}. It has to be answered first.`);
      }

      // Bringing them in is idempotent, so a retry that got this far the first
      // time does not create a second version of the same person.
      const person = ensureRealPerson(s, p.qid);
      if (!person) throw new CommandError('Nobody on the record by that name.');

      const already = offersTo(role, person.id);
      if (project.castIds.includes(person.id)) {
        throw new CommandError(`${record.name} is already in this picture. Nobody plays two parts in the same film.`);
      }
      if (already.length >= MAX_ASKS) {
        throw new CommandError(`${record.name} has passed ${already.length} times. Going back a fourth is not an offer, it is a nuisance.`);
      }

      const wanted = quoteFor(record, 'actor');
      const amount = Math.round(p.amount ?? Math.max(wanted, role.payLow));
      if (amount <= 0) throw new CommandError('An offer has to be for money.');
      const last = already[already.length - 1];
      if (last && amount < Math.round(last.amount * RAISE_FLOOR)) {
        throw new CommandError(
          `You offered ${formatMoney(last.amount)} and they passed. Going back needs at least ${formatMoney(Math.round(last.amount * RAISE_FLOOR))}.`,
        );
      }

      // Their real date of birth decides whether they are right for the part.
      // The record is theirs; what the part needs is yours.
      const age = ageOf(record, s.now);
      if (age !== undefined && (age < role.ageRange[0] - 6 || age > role.ageRange[1] + 8)) {
        throw new CommandError(
          `The part is written for ${role.ageRange[0]} to ${role.ageRange[1]}. ${record.name} is ${age}${ageIsApproximate(record) ? ' or thereabouts' : ''}.`,
        );
      }

      const answer = considerApproach(s, record, project, 'actor', amount, already.length);
      s.audit({
        kind: 'cast.real_offer_decided', subjectType: 'role', subjectId: role.id,
        question: `Why did ${record.name} take the part, or not?`,
        summary: answer.interested
          ? `${record.name} is in as ${role.characterName}.`
          : `${record.name} passed on ${role.characterName}. ${amount < wanted ? `SLATE reckons the part is worth ${formatMoney(wanted)} to them.` : 'The money was not the problem.'}`,
        factors: answer.reasons,
        seed: answer.seed, roll: answer.roll, probability: answer.probability, score: answer.score,
        outcome: answer.interested ? 'accepted' : 'declined',
      });

      const offer: RoleOffer = {
        personId: person.id, recordQid: record.qid, name: record.name,
        amount, offeredAt: s.now,
        answer: answer.interested ? 'accepted' : 'declined',
        reason: answer.summary, wanted,
      };
      role.offers ??= [];
      role.offers.push(offer);

      if (!answer.interested) {
        s.emit('cast.real_offer_declined', { roleId: role.id, projectId: project.id, personId: person.id, qid: record.qid, amount });
        return { accepted: false, personId: person.id, name: record.name, amount, wanted, reason: answer.summary };
      }

      // A yes goes through the one path a booking has ever gone through, so the
      // contract, the credit and the attachment are made exactly once and by
      // the same code as every other booking in the game.
      role.status = 'offer_out';
      role.castPersonId = person.id;
      const booked = s.execute<{ contractId?: Id; accepted: boolean }>({
        kind: 'cast.accept_offer',
        payload: { roleId: role.id, personId: person.id, amount, accept: true },
      });
      if (!booked.ok) {
        // Nothing was signed, so nothing is left half-done: the part goes back
        // to where it was and the offer is recorded as the failure it was.
        role.status = 'casting';
        role.castPersonId = undefined;
        offer.answer = 'declined';
        offer.reason = booked.error ?? 'The deal could not be closed.';
        throw new CommandError(booked.error ?? 'The deal could not be closed.');
      }

      s.remember({
        category: 'project',
        title: `${record.name} is playing ${role.characterName} in ${project.title}`,
        detail: `${titleCaseLabel(role.billing.replace(/_/g, ' '))}, ${role.shootDays} shoot days, ${formatMoney(amount)}.`,
        refs: [{ type: 'project', id: project.id }, { type: 'role', id: role.id }, { type: 'person', id: person.id }],
        significance: role.billing === 'lead' ? 82 : role.billing === 'supporting' ? 58 : 34,
        public: true, amount,
      });
      s.emit('cast.real_offer_accepted', { roleId: role.id, projectId: project.id, personId: person.id, qid: record.qid, amount });
      return {
        accepted: true, personId: person.id, name: record.name, amount, wanted,
        reason: answer.summary, contractId: booked.value?.contractId,
      };
    },
  );

  // --- Attaching a craft ---------------------------------------------------

  sim.onCommand<
    { projectId: Id; qid: string; role: Exclude<CraftRole, 'actor'>; amount?: Money },
    { attached: boolean; personId: Id; name: string; amount: Money; wanted: Money; reason: string; packageValue: number; contractId?: Id }
  >(
    'film.approach_real',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!playerControls(s, project)) throw new CommandError('That is not your picture to crew.');
      const terms = CRAFT_TERMS[p.role];
      if (!terms) throw new CommandError('That is not a craft you can attach.');

      const record = personByQid(p.qid);
      if (!record) throw new CommandError('Nobody on the record by that name.');
      if (!rolesWithSheets(record).includes(p.role)) {
        throw new CommandError(`${record.name} has no ${CRAFT_ROLE_LABEL[p.role].toLowerCase()} work on the record.`);
      }
      // A showrunner runs a series. A film has a director.
      const television = project.format === 'series' || project.format === 'limited_series';
      if (p.role === 'showrunner' && !television) throw new CommandError('Only a series has a showrunner.');

      // An answer already given is read back before anything else is checked,
      // exactly as it is on a part. This is what makes the command safe to
      // retry: one question, one answer, one attachment, one contract.
      const priorYes = (project.approaches ?? []).find(
        (entry) => entry.recordQid === p.qid && entry.role === terms.attachment && entry.answer === 'accepted',
      );
      if (priorYes) {
        return {
          attached: true, personId: priorYes.personId, name: record.name,
          amount: priorYes.amount, wanted: priorYes.wanted, reason: priorYes.reason,
          packageValue: project.packageValue,
        };
      }

      const person = ensureRealPerson(s, p.qid);
      if (!person) throw new CommandError('Nobody on the record by that name.');
      if (project.attachments.some((a) => a.personId === person.id && a.role === terms.attachment)) {
        return {
          attached: true, personId: person.id, name: record.name,
          amount: 0, wanted: quoteFor(record, p.role),
          reason: `${record.name} is already attached as ${CRAFT_ROLE_LABEL[p.role].toLowerCase()}.`,
          packageValue: project.packageValue,
        };
      }
      const seatTaken = p.role === 'director' ? project.directorId
        : p.role === 'showrunner' ? project.showrunnerId : undefined;
      if (seatTaken) {
        const sitting = s.universe.people[seatTaken];
        throw new CommandError(`${sitting?.displayName ?? 'Somebody'} already has that chair.`);
      }

      const wanted = quoteFor(record, p.role);
      const amount = Math.round(p.amount ?? wanted);
      if (amount <= 0) throw new CommandError('An offer has to be for money.');

      // Going back is the same negotiation a part has: three asks, each one at
      // least ten per cent above the last, and each a fresh answer rather than
      // the first one read out again.
      const asked = (project.approaches ?? []).filter(
        (entry) => entry.recordQid === p.qid && entry.role === terms.attachment,
      );
      if (asked.length >= MAX_ASKS) {
        throw new CommandError(`${record.name} has passed ${asked.length} times. Going back a fourth is not an offer, it is a nuisance.`);
      }
      const lastAsk = asked[asked.length - 1];
      if (lastAsk && amount < Math.round(lastAsk.amount * RAISE_FLOOR)) {
        throw new CommandError(
          `You offered ${formatMoney(lastAsk.amount)} and they passed. Going back needs at least ${formatMoney(Math.round(lastAsk.amount * RAISE_FLOOR))}.`,
        );
      }

      const answer = considerApproach(s, record, project, p.role, amount, asked.length);
      s.audit({
        kind: 'film.real_approach_decided', subjectType: 'project', subjectId: project.id,
        question: `Why did ${record.name} take it, or not?`,
        summary: answer.interested
          ? `${record.name} is attached as ${CRAFT_ROLE_LABEL[p.role].toLowerCase()}.`
          : `${record.name} passed on ${project.title}.`,
        factors: answer.reasons,
        seed: answer.seed, roll: answer.roll, probability: answer.probability, score: answer.score,
        outcome: answer.interested ? 'attached' : 'passed',
      });

      const record_: CraftApproach = {
        personId: person.id, recordQid: record.qid, name: record.name,
        role: terms.attachment, amount, approachedAt: s.now,
        answer: answer.interested ? 'accepted' : 'declined',
        reason: answer.summary, wanted,
      };
      project.approaches ??= [];
      project.approaches.push(record_);

      if (!answer.interested) {
        s.emit('film.real_approach_declined', { projectId: project.id, personId: person.id, qid: record.qid, role: p.role, amount });
        return {
          attached: false, personId: person.id, name: record.name, amount, wanted,
          reason: answer.summary, packageValue: project.packageValue,
        };
      }

      // The yes is already given, so the attachment path is told not to ask
      // again — one question, one answer, one attachment.
      const attached = s.execute<{ attached: boolean; packageValue: number }>({
        kind: 'film.attach_talent',
        payload: { projectId: project.id, personId: person.id, role: terms.attachment, confirmed: true, alreadyAgreed: true },
      });
      if (!attached.ok) throw new CommandError(attached.error ?? 'The attachment could not be made.');

      // Paper follows the handshake, but only once there is money to pay it
      // with. Attaching somebody in development is a deal memo, not a cheque.
      let contractId: Id | undefined;
      if (project.greenlitAt && project.financingIds.length > 0) {
        const paper = s.execute<{ contractId: Id }>({
          kind: 'film.execute_contract',
          payload: {
            kind: terms.contract,
            projectId: project.id,
            partyAId: project.ownerCompanyId ?? project.createdById,
            partyAKind: project.ownerCompanyId ? 'company' : 'person',
            partyBId: person.id,
            partyBKind: 'person',
            title: `${project.title} — ${CRAFT_ROLE_LABEL[p.role]}`,
            compensation: amount,
            milestones: terms.milestones,
            backendPoints: p.role === 'director' ? 0.05 : p.role === 'showrunner' ? 0.04 : undefined,
            backendKind: p.role === 'director' || p.role === 'showrunner' ? 'net' : undefined,
            obligations: [{ label: 'Publicity Days', kind: 'publicity', dueInDays: 400 }],
          },
        });
        if (!paper.ok) throw new CommandError(paper.error ?? 'The agreement could not be executed.');
        contractId = paper.value?.contractId;
      }

      s.remember({
        category: 'project',
        title: `${record.name} is ${p.role === 'cinematographer' ? 'shooting' : p.role === 'composer' ? 'scoring' : p.role === 'director' ? 'directing' : 'on'} ${project.title}`,
        detail: `${CRAFT_ROLE_LABEL[p.role]} at ${formatMoney(amount)}${contractId ? '.' : ', on a deal memo until the picture is funded.'}`,
        refs: [{ type: 'project', id: project.id }, { type: 'person', id: person.id }],
        significance: p.role === 'director' || p.role === 'showrunner' ? 74 : 48,
        public: true, amount,
      });
      s.emit('film.real_approach_accepted', { projectId: project.id, personId: person.id, qid: record.qid, role: p.role, amount });
      return {
        attached: true, personId: person.id, name: record.name, amount, wanted,
        reason: answer.summary, packageValue: attached.value?.packageValue ?? project.packageValue,
        contractId,
      };
    },
  );
}
