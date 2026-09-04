/**
 * SLATE — the people of the industry.
 *
 * Everybody on the roster is a real person, and everything factual about them
 * here is the public record: date and place of birth, citizenship, every
 * credit, every award won and every nomination, who they belong to and what
 * they are attached to. That comes from Wikidata, which is CC0, and IMDb
 * ratings where the licence file is present.
 *
 * The attributes are not the record. Nobody has scored these people out of a
 * hundred; SLATE reads their body of work and derives a rating from it, and
 * every screen that shows one says so and shows the evidence it came from.
 * The derivation is deterministic and open: the same record always gives the
 * same number, and `explain` says which signals produced it.
 *
 * Nothing here is invented. A missing birthday stays missing, a person the
 * record does not hold is shown as unlisted, and no filmography is padded.
 */

import { type CraftAttributeDef, type CraftRole, attributesForRole } from './craft-attributes';
import { ATTRIBUTES } from '../domain/attributes';
import { clamp, remap } from '../core/rng';

// ---------------------------------------------------------------------------
// What the record holds
// ---------------------------------------------------------------------------

/** What SLATE counted from the record for one person doing one job. */
export interface RoleEvidence {
  credits: number;
  firstYear: number;
  lastYear: number;
  /** Credits inside the last eight years. */
  recent: number;
  ratedCount: number;
  /** Vote-weighted mean IMDb score across their work in this capacity, 0-10. */
  rating: number;
  /** Standard deviation of those scores: how consistent the work is. */
  spread: number;
  boxMean: number;
  boxCount: number;
  budgetMean: number;
  genreCount: number;
  /** The genres they work in most, as "genre:count". */
  topGenres: string[];
  franchises: string[];
  wins: number;
  noms: number;
  /** Weighted award points. The weights are SLATE's, for ordering. */
  winScore: number;
  nomScore: number;
  topAward: string;
  best: string[];
}

export interface PersonRecord {
  qid: string;
  name: string;
  /** The jobs they were listed under, and so the sheets they carry. */
  roles: CraftRole[];
  listedAs: string[];
  /** A real date of birth, only where the record is precise to the day. */
  birth?: string;
  /** The year of birth, where the record has one at all. Some records have only this. */
  birthYear?: string;
  death?: string;
  bornIn?: string;
  citizenship: string[];
  gender?: string;
  imdbId?: string;
  startYear?: string;
  occupations: string[];
  memberOf: string[];
  employers: string[];
  description?: string;
  creditCount: number;
  awardCount: number;
  evidence: Partial<Record<CraftRole, RoleEvidence>>;
}

export interface PersonCredit {
  personQid: string;
  workQid: string;
  title: string;
  year?: number;
  kind: string;
  roles: string[];
  genres: string[];
  franchise?: string;
  companies: string[];
  imdbId?: string;
  rating?: number;
  votes?: number;
  boxOffice?: number;
  budget?: number;
}

export interface PersonAward {
  personQid: string;
  award: string;
  outcome: 'won' | 'nominated';
  forWork?: string;
  year?: number;
  weight: number;
  roles: CraftRole[];
}

/** Somebody the roster named who is not in the public record under any spelling. */
export interface UnlistedPerson {
  name: string;
  roles: CraftRole[];
  note: string;
}

/**
 * Named on the roster, looked for, and not found. They are kept visible rather
 * than quietly dropped, and the game never invents a profile for them.
 */
export const NOT_IN_RECORD: readonly UnlistedPerson[] = [
  { name: 'Bart Nickerson', roles: ['showrunner'], note: 'Co-creator of Yellowjackets. No entry in the public record.' },
  { name: 'Marissa Jo Cerar', roles: ['showrunner'], note: 'No entry in the public record.' },
  { name: 'Little Marvin', roles: ['showrunner'], note: 'Creator of Them. No entry in the public record under that name.' },
  { name: 'Robert Levine', roles: ['showrunner'], note: 'Co-creator of Black Sails. The record holds other people of that name, none of them him.' },
  { name: 'Diana Olifirova', roles: ['cinematographer'], note: 'No entry in the public record.' },
  { name: 'Larry Blanford', roles: ['cinematographer'], note: 'No entry in the public record.' },
  { name: 'Christophe Nuyens', roles: ['cinematographer'], note: 'No entry in the public record.' },
  { name: 'Tomás Barreiro', roles: ['composer'], note: 'No entry in the public record.' },
];

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

const PEOPLE = new Map<string, PersonRecord>();
const BY_NAME = new Map<string, PersonRecord>();
const CREDITS = new Map<string, PersonCredit[]>();
const AWARDS = new Map<string, PersonAward[]>();
const CREDITS_BY_WORK = new Map<string, PersonCredit[]>();

let peopleLoaded = false;
let creditsLoaded = false;
let awardsLoaded = false;

const rows = (text: string): string[][] => text
  .split('\n')
  .filter((line) => line.trim() && !line.startsWith('#'))
  .slice(1)
  .map((line) => line.split('\t'));

const list = (value: string | undefined): string[] => (value ? value.split(';').filter(Boolean) : []);
const num = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

export function addPeople(text: string): number {
  for (const cells of rows(text)) {
    const [qid, name, roles, listedAs, birth, death, bornIn, citizenship, gender, imdbId,
      startYear, occupations, memberOf, employers, description, creditCount, awardCount, evidence, birthYear] = cells;
    if (!qid || !name) continue;
    let parsed: Partial<Record<CraftRole, RoleEvidence>> = {};
    try { parsed = evidence ? JSON.parse(evidence) : {}; } catch { parsed = {}; }
    const person: PersonRecord = {
      qid, name,
      roles: list(roles) as CraftRole[],
      listedAs: list(listedAs),
      birth: birth || undefined, birthYear: birthYear || birth?.slice(0, 4) || undefined,
      death: death || undefined, bornIn: bornIn || undefined,
      citizenship: list(citizenship), gender: gender || undefined, imdbId: imdbId || undefined,
      startYear: startYear || undefined, occupations: list(occupations),
      memberOf: list(memberOf), employers: list(employers),
      description: description || undefined,
      creditCount: num(creditCount) ?? 0, awardCount: num(awardCount) ?? 0,
      evidence: parsed,
    };
    PEOPLE.set(qid, person);
    BY_NAME.set(name.toLowerCase(), person);
  }
  peopleLoaded = PEOPLE.size > 0;
  return PEOPLE.size;
}

export function addPeopleCredits(text: string): number {
  let count = 0;
  for (const cells of rows(text)) {
    const [personQid, workQid, title, year, kind, roles, genres, franchise, companies, imdbId, rating, votes, box, budget] = cells;
    if (!personQid || !workQid) continue;
    const credit: PersonCredit = {
      personQid, workQid, title: title ?? '', year: num(year), kind: kind ?? '',
      roles: list(roles), genres: list(genres), franchise: franchise || undefined,
      companies: list(companies), imdbId: imdbId || undefined,
      rating: num(rating), votes: num(votes), boxOffice: num(box), budget: num(budget),
    };
    const forPerson = CREDITS.get(personQid) ?? [];
    forPerson.push(credit);
    CREDITS.set(personQid, forPerson);
    const forWork = CREDITS_BY_WORK.get(workQid) ?? [];
    forWork.push(credit);
    CREDITS_BY_WORK.set(workQid, forWork);
    count++;
  }
  for (const credits of CREDITS.values()) {
    credits.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));
  }
  creditsLoaded = count > 0;
  return count;
}

export function addPeopleAwards(text: string): number {
  let count = 0;
  for (const cells of rows(text)) {
    const [personQid, award, outcome, forWork, year, weight, roles] = cells;
    if (!personQid || !award) continue;
    const entry: PersonAward = {
      personQid, award, outcome: outcome === 'won' ? 'won' : 'nominated',
      forWork: forWork || undefined, year: num(year),
      weight: num(weight) ?? 1.5, roles: list(roles) as CraftRole[],
    };
    const forPerson = AWARDS.get(personQid) ?? [];
    forPerson.push(entry);
    AWARDS.set(personQid, forPerson);
    count++;
  }
  for (const awards of AWARDS.values()) {
    awards.sort((a, b) => (b.outcome === 'won' ? 1 : 0) - (a.outcome === 'won' ? 1 : 0)
      || b.weight - a.weight || (b.year ?? 0) - (a.year ?? 0));
  }
  awardsLoaded = count > 0;
  return count;
}

export const isPeopleLoaded = (): boolean => peopleLoaded;
export const isPeopleCreditsLoaded = (): boolean => creditsLoaded;
export const isPeopleAwardsLoaded = (): boolean => awardsLoaded;

async function fetchInto(file: string, add: (text: string) => number): Promise<number> {
  const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/';
  const response = await fetch(`${base}industry/${file}`);
  if (!response.ok) return 0;
  return add(await response.text());
}

export const loadPeople = (): Promise<number> => (peopleLoaded ? Promise.resolve(PEOPLE.size) : fetchInto('people.tsv', addPeople));
export const loadPeopleCredits = (): Promise<number> => (creditsLoaded ? Promise.resolve(CREDITS.size) : fetchInto('people-credits.tsv', addPeopleCredits));
export const loadPeopleAwards = (): Promise<number> => (awardsLoaded ? Promise.resolve(AWARDS.size) : fetchInto('people-awards.tsv', addPeopleAwards));

// ---------------------------------------------------------------------------
// Reading it back
// ---------------------------------------------------------------------------

export const allPeople = (): PersonRecord[] => [...PEOPLE.values()];
export const personByQid = (qid: string): PersonRecord | undefined => PEOPLE.get(qid);
export const personByName = (name: string): PersonRecord | undefined => BY_NAME.get(name.trim().toLowerCase());
export const creditsFor = (qid: string): PersonCredit[] => CREDITS.get(qid) ?? [];
export const awardsFor = (qid: string): PersonAward[] => AWARDS.get(qid) ?? [];
export const whoWorkedOn = (workQid: string): PersonCredit[] => CREDITS_BY_WORK.get(workQid) ?? [];

export function peopleInRole(role: CraftRole): PersonRecord[] {
  return allPeople().filter((person) => person.roles.includes(role));
}

/**
 * Age today, from the record's date of birth.
 *
 * A full date gives a real age. A year on its own gives an age that is right
 * to within a year, and `approximate` says so rather than letting a screen
 * present it as exact. Nothing is guessed when the record has neither.
 */
export function ageOf(person: PersonRecord, now: number): number | undefined {
  if (person.birth) {
    const born = Date.parse(person.birth);
    if (!Number.isNaN(born)) {
      const end = person.death ? Date.parse(person.death) : now;
      return Math.floor((end - born) / (365.2425 * 24 * 3600 * 1000));
    }
  }
  const year = Number(person.birthYear);
  if (!year) return undefined;
  const end = person.death ? Number(person.death.slice(0, 4)) : new Date(now).getUTCFullYear();
  const age = end - year;
  return age > 0 && age < 120 ? age : undefined;
}

/** Whether an age is exact or read off a year alone. */
export const ageIsApproximate = (person: PersonRecord): boolean => !person.birth && Boolean(person.birthYear);

/**
 * Every distinct title the roster is credited on, with the best metadata any
 * of those credits carries. This is the industry's own index of work: it is
 * loaded with the people, so the search has titles in it before any studio's
 * catalogue has been opened.
 */
export function allCreditedWorks(): {
  qid: string; title: string; year?: number; kind: string; franchise?: string;
  genres: string[]; rating?: number; votes?: number; boxOffice?: number; people: number;
}[] {
  const out = new Map<string, ReturnType<typeof allCreditedWorks>[number]>();
  for (const credits of CREDITS.values()) {
    for (const credit of credits) {
      const existing = out.get(credit.workQid);
      if (existing) {
        existing.people++;
        existing.rating ??= credit.rating;
        existing.votes ??= credit.votes;
        existing.boxOffice ??= credit.boxOffice;
        existing.franchise ??= credit.franchise;
        if (existing.genres.length === 0) existing.genres = credit.genres;
        continue;
      }
      out.set(credit.workQid, {
        qid: credit.workQid, title: credit.title, year: credit.year, kind: credit.kind,
        franchise: credit.franchise, genres: credit.genres, rating: credit.rating,
        votes: credit.votes, boxOffice: credit.boxOffice, people: 1,
      });
    }
  }
  return [...out.values()];
}

/** Every franchise this person is attached to, across everything they are on. */
export function franchisesOf(qid: string): string[] {
  const seen = new Map<string, number>();
  for (const credit of creditsFor(qid)) {
    if (!credit.franchise) continue;
    seen.set(credit.franchise, (seen.get(credit.franchise) ?? 0) + 1);
  }
  return [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

/** The companies whose work they turn up in most, which is who they are in with. */
export function companiesOf(qid: string, limit = 6): { name: string; titles: number }[] {
  const seen = new Map<string, number>();
  for (const credit of creditsFor(qid)) {
    for (const company of credit.companies) seen.set(company, (seen.get(company) ?? 0) + 1);
  }
  return [...seen.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, titles]) => ({ name, titles }));
}

// ---------------------------------------------------------------------------
// From a body of work to a set of numbers
// ---------------------------------------------------------------------------

/**
 * The readings SLATE takes off a body of work. Every one is a count or an
 * average from the record, scaled to 0-1 so the weights below are comparable.
 */
export type Signal =
  | 'volume' | 'acclaim' | 'nominated' | 'reception' | 'consistency' | 'scale' | 'budget'
  | 'breadth' | 'recency' | 'longevity' | 'franchise' | 'television'
  | 'action' | 'comedy' | 'drama' | 'musical' | 'horror' | 'romance' | 'animation' | 'documentary' | 'period';

export const SIGNAL_LABEL: Readonly<Record<Signal, string>> = {
  volume: 'How Much Work', acclaim: 'Awards Won', nominated: 'Awards Nominated',
  reception: 'How The Work Is Rated', consistency: 'How Consistent It Is',
  scale: 'The Size Of What They Are On', budget: 'What Those Things Cost',
  breadth: 'How Many Kinds Of Thing', recency: 'How Busy Lately', longevity: 'How Long At It',
  franchise: 'Franchise Work', television: 'Television Work',
  action: 'Action Work', comedy: 'Comedy Work', drama: 'Drama Work', musical: 'Musical Work',
  horror: 'Horror Work', romance: 'Romance Work', animation: 'Animation Work',
  documentary: 'Documentary Work', period: 'Period Work',
};

const GENRE_FAMILIES: Readonly<Record<string, RegExp>> = {
  action: /action|adventure|superhero|martial|war|spy|thriller|heist|disaster|western/i,
  comedy: /comedy|parody|satire|sitcom/i,
  drama: /drama|biograph|legal|medical|political|social/i,
  musical: /musical|music|dance|concert|opera/i,
  horror: /horror|slasher|zombie|monster|supernatural/i,
  romance: /romance|romantic/i,
  animation: /animat|anime|cartoon/i,
  documentary: /document|nonfiction|reality/i,
  period: /histor|period|epic|costume/i,
};

const clamp01 = (n: number): number => clamp(n, 0, 1);
const logScale = (value: number, ceiling: number): number =>
  (value <= 0 ? 0 : clamp01(Math.log10(1 + value) / Math.log10(1 + ceiling)));

/**
 * What counts as a lot, per job.
 *
 * A composer with a hundred and ninety scores and a showrunner with twelve
 * shows are both at the top of their trade; measuring them against the same
 * ceiling would say the showrunner had barely worked. The record also links
 * television people to far less of their own work than it does film people,
 * which is a gap in the record rather than a fact about them, so the ceilings
 * account for that too.
 */
const CEILINGS: Readonly<Record<CraftRole, { credits: number; wins: number; noms: number }>> = {
  actor: { credits: 55, wins: 40, noms: 30 },
  director: { credits: 28, wins: 40, noms: 26 },
  producer: { credits: 45, wins: 32, noms: 22 },
  showrunner: { credits: 12, wins: 22, noms: 16 },
  cinematographer: { credits: 45, wins: 30, noms: 20 },
  composer: { credits: 85, wins: 30, noms: 22 },
};

/** Every signal for one person in one job, from the evidence counted off the record. */
export function signalsOf(evidence: RoleEvidence | undefined, role: CraftRole = 'actor'): Record<Signal, number> {
  const out = Object.fromEntries(
    (Object.keys(SIGNAL_LABEL) as Signal[]).map((s) => [s, 0]),
  ) as Record<Signal, number>;
  if (!evidence) return out;

  const ceiling = CEILINGS[role];
  out.volume = logScale(evidence.credits, ceiling.credits);
  out.acclaim = clamp01(evidence.winScore / ceiling.wins);
  out.nominated = clamp01(evidence.nomScore / ceiling.noms);
  out.reception = evidence.ratedCount > 0 ? clamp01(remap(evidence.rating, 5.3, 8.1, 0, 1)) : 0.45;
  out.consistency = evidence.ratedCount > 2 ? clamp01(1 - evidence.spread / 1.7) : 0.5;
  out.scale = logScale(evidence.boxMean, 900_000_000);
  out.budget = logScale(evidence.budgetMean, 250_000_000);
  out.breadth = clamp01(evidence.genreCount / 30);
  out.recency = clamp01(evidence.recent / 7);
  out.longevity = clamp01((evidence.lastYear - evidence.firstYear) / 34);
  out.franchise = clamp01(evidence.franchises.length / 4);

  // The genre mix, as a share of everything they are credited on.
  const counts = new Map<string, number>();
  let total = 0;
  for (const entry of evidence.topGenres) {
    const [name, count] = entry.split(':');
    const n = Number(count) || 0;
    total += n;
    counts.set(name ?? '', n);
  }
  if (total > 0) {
    for (const [family, pattern] of Object.entries(GENRE_FAMILIES) as [Signal, RegExp][]) {
      let matched = 0;
      for (const [name, n] of counts) if (pattern.test(name)) matched += n;
      out[family] = clamp01((matched / total) * 1.8);
    }
  }
  return out;
}

type Weights = Partial<Record<Signal, number>>;

/**
 * The signals every sheet leans on before anything specific to the job. They
 * are added to whatever the attribute itself reads off, and the whole lot is
 * then normalised, so no attribute can be carried past the ceiling by weight
 * alone — a wall of ninety-nines says nothing about anybody.
 */
const BASE_WEIGHTS: Weights = { reception: 0.1, volume: 0.08, acclaim: 0.08, recency: 0.04 };

/** Where a sheet sits before any evidence moves it, and how far evidence can move it. */
const FLOOR = 18;
const SPAN = 88;

/**
 * What each attribute is read off. A weight of 1 means that signal alone can
 * carry the number from the floor to the ceiling; the rest is the base and the
 * common weights above. Anything not listed uses the group's default.
 */
const ROLE_DEFAULTS: Readonly<Record<CraftRole, Weights>> = {
  actor: { reception: 0.2, acclaim: 0.16, volume: 0.14, consistency: 0.08 },
  director: { reception: 0.24, acclaim: 0.2, volume: 0.12, consistency: 0.08 },
  producer: { volume: 0.22, scale: 0.16, acclaim: 0.14, reception: 0.12 },
  showrunner: { reception: 0.22, acclaim: 0.18, volume: 0.16, television: 0.1 },
  cinematographer: { reception: 0.22, acclaim: 0.2, volume: 0.14, budget: 0.08 },
  composer: { reception: 0.2, acclaim: 0.2, volume: 0.18, breadth: 0.06 },
};

/** Where an attribute wants something other than its job's default reading. */
const ATTRIBUTE_WEIGHTS: Readonly<Record<string, Weights>> = {
  // --- Director ---
  'director.visual_authorship': { reception: 0.3, acclaim: 0.25, longevity: 0.1 },
  'director.tonal_control': { reception: 0.28, consistency: 0.22 },
  'director.world_building': { scale: 0.2, budget: 0.16, action: 0.12, animation: 0.1 },
  'director.thematic_spine': { acclaim: 0.3, reception: 0.24 },
  'director.risk_appetite': { breadth: 0.28, acclaim: 0.12, franchise: -0.15 },
  'director.script_sense': { acclaim: 0.24, reception: 0.22, drama: 0.08 },
  'director.staging': { reception: 0.24, longevity: 0.14, acclaim: 0.14 },
  'director.coverage': { volume: 0.2, consistency: 0.2, television: 0.1 },
  'director.pace': { reception: 0.22, action: 0.12, comedy: 0.1 },
  'director.editing_instinct': { reception: 0.22, consistency: 0.16, acclaim: 0.12 },
  'director.set_pieces': { scale: 0.26, action: 0.2, budget: 0.14 },
  'director.action_staging': { action: 0.4, scale: 0.16, budget: 0.1 },
  'director.intimacy': { drama: 0.24, romance: 0.2, acclaim: 0.12, scale: -0.1 },
  'director.actor_direction': { acclaim: 0.3, drama: 0.16, reception: 0.16 },
  'director.casting_eye': { acclaim: 0.22, volume: 0.16, reception: 0.14 },
  'director.crew_leadership': { volume: 0.24, longevity: 0.18, scale: 0.1 },
  'director.collaboration': { volume: 0.2, longevity: 0.16, consistency: 0.12 },
  'director.set_temperament': { volume: 0.18, consistency: 0.18, recency: 0.1 },
  'director.scale_command': { scale: 0.34, budget: 0.24 },
  'director.budget_discipline': { volume: 0.2, consistency: 0.16, budget: -0.12 },
  'director.schedule_discipline': { volume: 0.24, television: 0.14, consistency: 0.12 },
  'director.resourcefulness': { budget: -0.28, reception: 0.2, volume: 0.12 },
  'director.studio_trust': { scale: 0.28, budget: 0.22, volume: 0.14 },
  'director.festival_standing': { acclaim: 0.34, reception: 0.2, scale: -0.12 },
  'director.audience_reach': { scale: 0.36, franchise: 0.16, budget: 0.12 },
  // --- Producer ---
  'producer.material_taste': { acclaim: 0.28, reception: 0.24 },
  'producer.ip_acquisition': { franchise: 0.3, scale: 0.16, volume: 0.14 },
  'producer.development_patience': { acclaim: 0.24, reception: 0.2, volume: -0.08 },
  'producer.packaging': { volume: 0.26, scale: 0.18, acclaim: 0.12 },
  'producer.financing': { budget: 0.3, volume: 0.2, scale: 0.14 },
  'producer.budget_control': { volume: 0.24, consistency: 0.16 },
  'producer.deal_making': { volume: 0.24, scale: 0.2, longevity: 0.12 },
  'producer.incentives': { volume: 0.22, budget: 0.16, breadth: 0.1 },
  'producer.risk_management': { volume: 0.26, longevity: 0.16 },
  'producer.physical_production': { scale: 0.24, budget: 0.2, volume: 0.16 },
  'producer.post_oversight': { volume: 0.22, reception: 0.16, consistency: 0.12 },
  'producer.crisis_handling': { volume: 0.24, longevity: 0.18 },
  'producer.schedule_command': { volume: 0.26, television: 0.14 },
  'producer.talent_relations': { volume: 0.24, longevity: 0.16, acclaim: 0.12 },
  'producer.studio_relations': { scale: 0.26, budget: 0.18, volume: 0.14 },
  'producer.agency_relations': { volume: 0.24, scale: 0.16, recency: 0.12 },
  'producer.political_capital': { acclaim: 0.24, scale: 0.22, longevity: 0.14 },
  'producer.marketing_sense': { scale: 0.3, franchise: 0.16 },
  'producer.release_strategy': { scale: 0.24, breadth: 0.14, volume: 0.14 },
  'producer.awards_campaigning': { acclaim: 0.36, nominated: 0.2 },
  'producer.franchise_stewardship': { franchise: 0.42, scale: 0.16 },
  'producer.slate_breadth': { breadth: 0.36, volume: 0.18 },
  // --- Showrunner ---
  'showrunner.premise_engine': { volume: 0.24, reception: 0.2, longevity: 0.14 },
  'showrunner.season_architecture': { reception: 0.28, acclaim: 0.2 },
  'showrunner.episode_structure': { volume: 0.24, consistency: 0.18, reception: 0.14 },
  'showrunner.serial_momentum': { reception: 0.26, drama: 0.12 },
  'showrunner.finale_landing': { acclaim: 0.26, consistency: 0.2 },
  'showrunner.tone_consistency': { consistency: 0.3, reception: 0.18 },
  'showrunner.character_voice': { acclaim: 0.24, reception: 0.22, drama: 0.1 },
  'showrunner.dialogue': { acclaim: 0.26, comedy: 0.14, reception: 0.18 },
  'showrunner.world_consistency': { consistency: 0.24, longevity: 0.16 },
  'showrunner.ensemble_balance': { reception: 0.22, volume: 0.16, drama: 0.1 },
  'showrunner.rewrite_speed': { volume: 0.3, television: 0.14 },
  'showrunner.room_leadership': { volume: 0.26, longevity: 0.18 },
  'showrunner.staffing': { volume: 0.24, acclaim: 0.14, longevity: 0.14 },
  'showrunner.delegation': { volume: 0.28, longevity: 0.14 },
  'showrunner.mentorship': { longevity: 0.3, volume: 0.18 },
  'showrunner.production_command': { volume: 0.26, budget: 0.14, scale: 0.12 },
  'showrunner.budget_per_episode': { budget: 0.26, scale: 0.16, consistency: 0.1 },
  'showrunner.casting': { acclaim: 0.22, reception: 0.2, volume: 0.14 },
  'showrunner.network_relations': { volume: 0.24, longevity: 0.18, recency: 0.12 },
  'showrunner.renewal_record': { longevity: 0.28, volume: 0.22 },
  'showrunner.critical_standing': { acclaim: 0.34, reception: 0.26 },
  'showrunner.audience_pull': { scale: 0.24, volume: 0.2, franchise: 0.12 },
  // --- Cinematographer ---
  'cinematographer.lighting_design': { acclaim: 0.3, reception: 0.24 },
  'cinematographer.natural_light': { acclaim: 0.2, drama: 0.16, budget: -0.12 },
  'cinematographer.night_work': { horror: 0.18, action: 0.14, acclaim: 0.16 },
  'cinematographer.contrast_control': { acclaim: 0.24, horror: 0.14, reception: 0.16 },
  'cinematographer.skin_tone': { acclaim: 0.2, drama: 0.16, reception: 0.16 },
  'cinematographer.composition': { acclaim: 0.32, reception: 0.24 },
  'cinematographer.lens_choice': { acclaim: 0.26, breadth: 0.14 },
  'cinematographer.camera_movement': { action: 0.2, scale: 0.16, acclaim: 0.16 },
  'cinematographer.handheld': { drama: 0.2, action: 0.16, budget: -0.1 },
  'cinematographer.long_take': { acclaim: 0.28, drama: 0.14 },
  'cinematographer.coverage_speed': { volume: 0.3, television: 0.16 },
  'cinematographer.palette': { acclaim: 0.26, reception: 0.2 },
  'cinematographer.grade_control': { acclaim: 0.22, budget: 0.14, recency: 0.12 },
  'cinematographer.format_command': { budget: 0.22, breadth: 0.18, acclaim: 0.16 },
  'cinematographer.vfx_integration': { budget: 0.3, scale: 0.22, action: 0.12 },
  'cinematographer.action_photography': { action: 0.36, scale: 0.18 },
  'cinematographer.landscape': { scale: 0.2, period: 0.16, acclaim: 0.16 },
  'cinematographer.intimate_photography': { drama: 0.26, romance: 0.14, acclaim: 0.14 },
  'cinematographer.director_partnership': { longevity: 0.26, volume: 0.2 },
  'cinematographer.crew_command': { volume: 0.26, scale: 0.16 },
  'cinematographer.resourcefulness': { budget: -0.3, reception: 0.22, volume: 0.12 },
  // --- Composer ---
  'composer.thematic_writing': { acclaim: 0.3, scale: 0.16, reception: 0.18 },
  'composer.harmonic_language': { acclaim: 0.28, reception: 0.22 },
  'composer.melodic_memory': { scale: 0.24, franchise: 0.18, acclaim: 0.16 },
  'composer.development': { acclaim: 0.24, longevity: 0.16, reception: 0.16 },
  'composer.restraint': { drama: 0.24, acclaim: 0.18, scale: -0.12 },
  'composer.orchestration': { budget: 0.24, acclaim: 0.22, scale: 0.14 },
  'composer.texture': { horror: 0.18, acclaim: 0.22, breadth: 0.12 },
  'composer.electronic': { recency: 0.24, action: 0.16, horror: 0.14 },
  'composer.orchestral': { budget: 0.26, scale: 0.2, period: 0.12 },
  'composer.hybrid': { recency: 0.26, action: 0.18, scale: 0.12 },
  'composer.vocal_writing': { musical: 0.28, period: 0.14, acclaim: 0.14 },
  'composer.source_music': { musical: 0.26, comedy: 0.14, breadth: 0.12 },
  'composer.tension': { horror: 0.3, action: 0.16 },
  'composer.emotion': { drama: 0.28, romance: 0.16, acclaim: 0.14 },
  'composer.propulsion': { action: 0.34, scale: 0.14 },
  'composer.spotting': { acclaim: 0.24, volume: 0.2, consistency: 0.12 },
  'composer.speed': { volume: 0.36, television: 0.14 },
  'composer.temp_resistance': { acclaim: 0.28, longevity: 0.14 },
  'composer.adaptability': { breadth: 0.34, volume: 0.16 },
  'composer.director_partnership': { longevity: 0.26, volume: 0.2 },
  'composer.signature': { acclaim: 0.26, franchise: 0.18, scale: 0.14 },
  'composer.critical_standing': { acclaim: 0.36, reception: 0.26 },
};

/** What an actor's 88 attributes are read off, by the group they belong to. */
const ACTOR_GROUP_WEIGHTS: Readonly<Record<string, Weights>> = {
  Craft: { acclaim: 0.3, reception: 0.24, drama: 0.1 },
  Voice: { acclaim: 0.2, longevity: 0.16, breadth: 0.14 },
  Physical: { action: 0.3, scale: 0.14, recency: 0.08 },
  Screen: { scale: 0.22, reception: 0.2, acclaim: 0.18 },
  Range: { breadth: 0.28, acclaim: 0.2, reception: 0.14 },
  Professionalism: { volume: 0.28, longevity: 0.18, consistency: 0.12 },
  Industry: { scale: 0.24, volume: 0.2, franchise: 0.14, recency: 0.1 },
};

/** Actor attributes that are about one specific thing rather than a whole group. */
const ACTOR_OVERRIDES: Readonly<Record<string, Weights>> = {
  singing: { musical: 0.45, acclaim: 0.1 },
  dance: { musical: 0.4, action: 0.12 },
  vocal_range: { musical: 0.32, breadth: 0.16 },
  voice_over: { animation: 0.4, volume: 0.16 },
  adr: { volume: 0.28, action: 0.12 },
  accent_retention: { breadth: 0.26, acclaim: 0.18, period: 0.12 },
  dialect_acquisition: { breadth: 0.26, acclaim: 0.2, period: 0.12 },
  screen_fighting: { action: 0.48 },
  stage_combat: { action: 0.4, period: 0.12 },
  stunt_aptitude: { action: 0.46, scale: 0.12 },
  weapons_handling: { action: 0.4, period: 0.14 },
  horsemanship: { period: 0.34, action: 0.2 },
  physical_comedy: { comedy: 0.44 },
  broad_comedy: { comedy: 0.46 },
  comedy_timing: { comedy: 0.44, acclaim: 0.1 },
  dry_comedy: { comedy: 0.36, acclaim: 0.14 },
  fear_terror: { horror: 0.42, action: 0.1 },
  menace: { horror: 0.24, action: 0.22, acclaim: 0.12 },
  romance: { romance: 0.44 },
  chemistry: { romance: 0.3, comedy: 0.14, reception: 0.14 },
  grief: { drama: 0.34, acclaim: 0.18 },
  tragedy: { drama: 0.32, acclaim: 0.2 },
  rage: { drama: 0.22, action: 0.2 },
  joy: { comedy: 0.3, musical: 0.14 },
  vulnerability: { drama: 0.3, acclaim: 0.18 },
  restraint: { drama: 0.26, acclaim: 0.22 },
  red_carpet_presence: { scale: 0.3, franchise: 0.18 },
  press_discipline: { scale: 0.24, longevity: 0.2 },
  networking: { volume: 0.28, longevity: 0.16 },
  career_strategy: { acclaim: 0.24, scale: 0.2, longevity: 0.16 },
  magnetism: { scale: 0.28, acclaim: 0.16, reception: 0.14 },
  charisma: { scale: 0.26, comedy: 0.14, reception: 0.16 },
  photogenic_quality: { scale: 0.26, romance: 0.12, recency: 0.12 },
};

/** A small, fixed wobble so two identical bodies of work are not identical sheets. */
function jitter(qid: string, attribute: string): number {
  let hash = 2166136261;
  const key = `${qid}|${attribute}`;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000 * 8 - 4;
}

export interface DerivedAttribute {
  id: string;
  name: string;
  group: string;
  description: string;
  value: number;
  /** The two or three signals that moved it most, strongest first. */
  because: { signal: Signal; label: string; contribution: number }[];
}

/** How thin the evidence is. A number built on two credits is not the same claim as one built on sixty. */
export function confidenceOf(evidence: RoleEvidence | undefined): number {
  if (!evidence) return 0;
  const rated = clamp01(evidence.ratedCount / 12);
  const counted = clamp01(evidence.credits / 15);
  return Math.round((counted * 0.55 + rated * 0.45) * 100);
}

/**
 * What one attribute reads, and which signals moved it.
 *
 * The weights are normalised by their own total, so an attribute that reads
 * off six signals is not automatically higher than one that reads off two:
 * the difference between them is what the record says, not how many things
 * were counted.
 */
function readingOf(weights: Weights, signals: Record<Signal, number>): { value: number; because: DerivedAttribute['because'] } {
  const entries = Object.entries(weights) as [Signal, number][];
  const total = entries.reduce((sum, [, weight]) => sum + Math.abs(weight), 0);
  if (total <= 0) return { value: FLOOR, because: [] };

  const because: DerivedAttribute['because'] = [];
  let reading = 0;
  for (const [signal, weight] of entries) {
    const share = weight / total;
    // A negative weight means the absence of the thing is the strength:
    // a cinematographer's resourcefulness is read off small budgets.
    const level = weight < 0 ? 1 - (signals[signal] ?? 0) : (signals[signal] ?? 0);
    const contribution = level * Math.abs(share) * SPAN;
    reading += contribution;
    if (contribution < 0.5) continue;
    because.push({ signal, label: SIGNAL_LABEL[signal], contribution: Number(contribution.toFixed(1)) });
  }
  // A soft ceiling near the top. Without it every strong record clips to the
  // same number and a sheet of ninety-nines says nothing about anybody; with
  // it the order is kept and the differences stay visible.
  const raw = FLOOR + reading;
  const value = raw <= 88 ? raw : 88 + (raw - 88) * 0.42;
  return { value, because: because.sort((a, b) => b.contribution - a.contribution) };
}

/**
 * The sheet for one person in one job.
 *
 * Nothing here is a fact about the person. It is a reading of what they have
 * made and how it was received, and every number can say which parts of that
 * record produced it.
 */
export function deriveSheet(person: PersonRecord, role: CraftRole): DerivedAttribute[] {
  const evidence = person.evidence[role];
  const signals = signalsOf(evidence, role);

  const build = (id: string, name: string, group: string, description: string, weights: Weights): DerivedAttribute => {
    // What the attribute itself reads off, or the job's default when it has
    // nothing of its own. The common signals are added, never multiplied in.
    const specific = Object.keys(weights).length > 0 ? weights : ROLE_DEFAULTS[role];
    const merged: Weights = { ...BASE_WEIGHTS, ...specific };
    const { value: reading, because } = readingOf(merged, signals);
    const thin = evidence ? 0 : 8;
    const value = clamp(Math.round(reading - thin + jitter(person.qid, id)), 12, 99);
    return { id, name, group, description, value, because: because.slice(0, 3) };
  };

  if (role === 'actor') {
    return ATTRIBUTES.map((def) => build(
      def.id, def.name, def.group, def.description,
      ACTOR_OVERRIDES[def.id] ?? ACTOR_GROUP_WEIGHTS[def.group] ?? {},
    ));
  }
  return attributesForRole(role).map((def: CraftAttributeDef) => build(
    def.id, def.name, def.group, def.description, ATTRIBUTE_WEIGHTS[def.id] ?? {},
  ));
}

/** One number for a person in one job, for sorting a list by it. */
export function overallFor(person: PersonRecord, role: CraftRole): number {
  const sheet = deriveSheet(person, role);
  if (sheet.length === 0) return 0;
  return Math.round(sheet.reduce((sum, attribute) => sum + attribute.value, 0) / sheet.length);
}

/**
 * The jobs a profile shows a sheet for.
 *
 * What they were listed under, plus anything the record credits them in often
 * enough to be a job rather than an appearance: a composer who turns up as
 * himself in thirteen documentaries is not an actor, and a director with
 * twenty-three acting credits is.
 */
export function rolesWithSheets(person: PersonRecord): CraftRole[] {
  const total = Object.values(person.evidence).reduce((sum, e) => sum + (e?.credits ?? 0), 0);
  const out: CraftRole[] = [...person.roles];
  for (const [role, evidence] of Object.entries(person.evidence) as [CraftRole, RoleEvidence | undefined][]) {
    if (!evidence || out.includes(role)) continue;
    const share = total > 0 ? evidence.credits / total : 0;
    if (evidence.credits >= 5 && share >= 0.25) out.push(role);
  }
  return out;
}

/** Their strongest job, which is what a profile leads with. */
export function primaryRole(person: PersonRecord): CraftRole {
  let best: CraftRole = person.roles[0] ?? 'actor';
  let bestScore = -1;
  for (const role of person.roles) {
    const evidence = person.evidence[role];
    const score = (evidence?.credits ?? 0) + (evidence?.winScore ?? 0) * 2;
    if (score > bestScore) { bestScore = score; best = role; }
  }
  return best;
}
