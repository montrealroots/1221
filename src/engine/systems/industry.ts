/**
 * SLATE — the business outside the player's own career (from 2026-10-08):
 * the projects in development, casting, production and release, the
 * companies that make them (`content/industry.ts`), and the performers who
 * work in them. Every audition, booking, production and credit of the
 * player's, and every credit of a classmate's, is a part in one of these
 * projects, so a project has one identity from its announcement to its
 * release, and a person one filmography, wherever they're seen.
 *
 * **A project** (`Project`) is made when work needs one: an audition in a
 * town for a part nothing there is casting, a breakdown posted, a classmate's
 * job, or the month's announcements in the town the player works in. Its
 * company is one of the ten where it makes that kind of work there, at its
 * share (`MAJOR_SHARE`, `IndustryCompany.weight`), or an independent
 * producer. Its title and parts are SLATE's invention, and it says so.
 *
 * **Its life**, week by week (`INDUSTRY_WEEK_KIND`): development, casting
 * (its parts open, each by its route: an open breakdown, through an agent,
 * or by offer only), production, post, released; or canceled, its history
 * kept. A part not cast by the time it shoots goes to a classmate who fits
 * and is free, or to a performer from the town's pool who's free then
 * (`castPerformer`): a person with a name, commitments and credits, never
 * two parts at once. When the player's dates change, a performer they clash
 * with gives the part up to one who's free.
 *
 * **What a company does to the work**, by rule: a television job's episodes
 * are seen where its company shows them, on its network or its streaming
 * service, by the service's size (`afterlifeRule`); and a producer who's
 * worked with the actor before reads them a little more warmly (`KNOWN`).
 *
 * **Released**, a project draws a reception, SLATE's own and labelled so:
 * critics' and audiences' scores out of a hundred. Nothing here is any real
 * company's decision or any real title's result.
 *
 * **Bounded**: projects nobody touched leave the record a year after they're
 * released or canceled (`INDUSTRY.keepUntouchedDays`); anything the player
 * auditioned for, worked on, listed or rated stays.
 *
 * Every number here is SLATE's estimate unless it says otherwise.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, zonedParts, instantFromZoned, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { NAMES } from '../content/people';
import { ROLES, type CareerCity, type Role } from '../content/career';
import { COMPANIES, MAJOR_SHARE, TITLE_WORDS, companyById, type IndustryCompany } from '../content/industry';
import type { RealTitle } from '../world/database';
import { LOOKUP } from '../world/lookup';

export type ProjectFormat = 'film' | 'series' | 'play' | 'commercial' | 'animation' | 'game' | 'audiobook' | 'radio' | 'dub';
export type ProjectStatus = 'development' | 'casting' | 'production' | 'post' | 'released' | 'cancelled';
export type PartRoute = 'open' | 'agent' | 'offer';
export type PartSize = 'principal' | 'supporting' | 'featured' | 'understudy';
export type PartHolder = { kind: 'player' } | { kind: 'classmate'; i: number } | { kind: 'performer'; id: string };

export interface ProjectPart {
  id: string;
  roleId: string;
  /** What the part is, in the breakdown's words: a descriptor and a name, SLATE's invention. */
  name: string;
  size: PartSize;
  /** How it's cast: open to submissions, through agents, or by offer only. */
  via: PartRoute;
  status: 'open' | 'cast' | 'recast';
  holder?: PartHolder;
  /** Who held it before, where it was recast, and why. */
  was?: { holder: PartHolder; why: string }[];
}

export interface Project {
  id: string;
  title: string;
  format: ProjectFormat;
  medium: Role['medium'];
  /** One of the ten, or nobody SLATE names. */
  companyId?: string;
  producer: string;
  cityId: string;
  genre?: string;
  status: ProjectStatus;
  announced: Instant;
  castingUntil: Instant;
  shootFrom: Instant;
  shootUntil: Instant;
  releaseAt: Instant;
  parts: ProjectPart[];
  history: { at: Instant; what: string }[];
  /** SLATE's own reception, drawn at release: critics and audiences, out of 100. */
  reception?: { critics: number; audience: number };
  /** The player auditioned for it, worked on it, listed it or rated it: kept on the record for good. */
  touched?: true;
}

export interface IndustryPerformer {
  id: string;
  name: string;
  cityId: string;
  born: number;
  /** How they read for a part, against a part's bar (`Role.bar`). */
  level: number;
  commitments: { projectId: string; partId: string; from: Instant; until: Instant }[];
  credits: { projectId: string; partId: string; year: number }[];
}

export interface PlayerList { id: string; name: string; items: { kind: 'project' | 'title' | 'person' | 'company'; id: string; at: Instant }[] }

export interface IndustryState {
  seq: number;
  projects: Project[];
  performers: IndustryPerformer[];
  /** The player's watchlist, favorites and lists of their own. */
  lists: PlayerList[];
  /** What the player last looked at in the database, newest first. */
  viewed: { kind: string; id: string; at: Instant }[];
  /** The player's own ratings, out of 10, of titles and projects seen. */
  ratings: Record<string, { score: number; at: Instant }>;
  /** Companies the player has worked for: how often, and when last. */
  worked: Record<string, { jobs: number; lastAt: Instant }>;
  /** The month the last announcements were made, `YYYY-M`, by town. */
  announced: Record<string, string>;
  /** Real titles looked up on Wikidata while playing, each with the day it was fetched, and the people in them (`world/lookup.ts`, from 2026-10-08). */
  looked?: { titles: Record<string, RealTitle & { fetched: string }>; people: Record<string, string>; order: string[] };
}

export const INDUSTRY_WEEK_KIND = 'industry.week';

export const INDUSTRY = {
  /** A casting window: a project casts from its announcement's casting date for this many days. */
  castingDays: 28,
  /** Development before casting, by format, in days. */
  developmentDays: { film: 60, series: 45, play: 45, commercial: 7, animation: 60, game: 45, audiobook: 14, radio: 21, dub: 7 } as Record<ProjectFormat, number>,
  /** Post-production to release, by format, in days, before the career's own dates are known. */
  postDays: { film: 270, series: 150, play: 0, commercial: 30, animation: 300, game: 240, audiobook: 60, radio: 45, dub: 30 } as Record<ProjectFormat, number>,
  /** A month's projects announced in the town the player works in. */
  announcePerMonth: 3,
  /** Days between a month's announcements' castings. */
  announceApartDays: 21,
  /** Untouched projects leave the record this long after they end. */
  keepUntouchedDays: 365,
  /** At most this many projects on the record; the oldest untouched go first. */
  most: 600,
  /** A town's pool of performers at most, before a new one is only made where nobody's free. */
  poolPerTown: 80,
  /** How far below or above a part's bar a performer can read and be cast. */
  levelBand: 15,
  /** Things last looked at, kept. */
  viewedKept: 40,
  /** An agent's pitch for a part: the chance it brings an audition, times the agency's attention (`rosterFit`). */
  pitch: { chance: 0.45, perWeek: 2 },
} as const;

/** A producer who has worked with the actor before reads them this much more warmly. SLATE's estimate. */
export const KNOWN = { edge: 1.15 } as const;
/** Research into a project before its audition: a little better prepared. SLATE's estimate. */
export const RESEARCH = { minutes: 45, edge: 1.08 } as const;

export function industryOf(sim: Simulation): IndustryState {
  const u = sim.universe as typeof sim.universe & { industry?: IndustryState };
  u.industry ??= { seq: 0, projects: [], performers: [], lists: [{ id: 'watchlist', name: 'Watchlist', items: [] }, { id: 'favorites', name: 'Favorites', items: [] }], viewed: [], ratings: {}, worked: {}, announced: {} };
  return u.industry;
}

const nextId = (state: IndustryState, prefix: string) => `${prefix}${(state.seq += 1)}`;
export const projectById = (sim: Simulation, id: string | undefined): Project | undefined => (id ? industryOf(sim).projects.find((p) => p.id === id) : undefined);
export const performerById = (sim: Simulation, id: string | undefined): IndustryPerformer | undefined => (id ? industryOf(sim).performers.find((p) => p.id === id) : undefined);
const country = (cityId: string): keyof typeof NAMES => { const c = CITIES.get(cityId)?.countryId; return c === 'uk' || c === 'ie' || c === 'ca' || c === 'mx' ? c : 'us'; };

/** What kind of project a part is in. */
export function formatOf(role: Role): ProjectFormat {
  if (role.medium === 'stage') return 'play';
  if (role.after?.kind === 'commercial') return 'commercial';
  if (role.medium === 'voice') return /animation/.test(role.id) ? 'animation' : role.id === 'game' ? 'game' : role.id === 'audiobook' ? 'audiobook' : /radio/.test(role.id) ? 'radio' : /dubbing/.test(role.id) ? 'dub' : 'animation';
  if (role.series || role.arc || role.after?.kind === 'tv') return 'series';
  return 'film';
}

/** The companies that make this kind of work in this town, each with its weight there. */
export function companiesFor(format: ProjectFormat, cityId: string): { company: IndustryCompany; weight: number }[] {
  const screen = format === 'film' || format === 'series' || format === 'animation';
  return COMPANIES.filter((c) => c.markets.some((m) => m.cityId === cityId)).flatMap((c) => {
    if (format === 'radio') return c.id === 'bbc' ? [{ company: c, weight: 1 }] : [];
    if (!screen) return [];
    const share = format === 'series' ? c.formats.series : c.formats.film;
    return share > 0 ? [{ company: c, weight: c.weight * share }] : [];
  });
}

/** Who makes a project nobody SLATE names makes. */
const INDEPENDENT: Record<ProjectFormat, string> = {
  film: 'An independent producer', series: 'An independent producer', play: 'A theater company', commercial: 'A commercial production company',
  animation: 'An independent animation studio', game: 'A game studio', audiobook: 'A publisher of audiobooks', radio: 'A producer of audio drama', dub: 'A dubbing studio',
};

const pick = <T,>(xs: readonly T[], x: number): T => xs[Math.min(xs.length - 1, Math.floor(x * xs.length))]!;

/** A part's words: a descriptor and a first and family name from the town's country. */
function partName(size: PartSize, cityId: string, x: number, y: number, z: number): string {
  const names = NAMES[country(cityId)];
  const first = pick(x < 0.5 ? names.female : names.male, y);
  const family = pick(names.family, z);
  const what = pick(TITLE_WORDS.descriptor[size], (x * 7) % 1);
  return size === 'principal' ? `${first} ${family}` : size === 'understudy' ? 'The Understudy' : `${what} ${family}`;
}

/** The sizes of the parts a project casts beside the one it was made for, as a production casts them (`COMPANY.others`). */
const OTHERS: Record<Role['medium'], PartSize[]> = { stage: ['supporting', 'featured', 'understudy'], screen: ['supporting', 'featured'], voice: [] };

/** How a part is cast: open to a self-submission, through an agent, or by offer only. */
function routeFor(role: Role, size: PartSize): PartRoute {
  if (size === 'principal' && role.tiers.every((t) => t === 1)) return 'offer';
  return role.selfSubmit ? 'open' : 'agent';
}

/**
 * A new project in a town around a part (`industry.project`): its company, title, dates and other parts. `at` is when
 * its part's audition or casting is; the dates are the project's plan, which the player's own calls replace once
 * they're booked (`bookPart`).
 */
export function newProject(sim: Simulation, role: Role, cityId: string, at: Instant, seed: string, status: ProjectStatus = 'casting'): Project {
  const state = industryOf(sim);
  const rng = sim.rng('industry.project', cityId, seed);
  const format = formatOf(role);
  const offered = companiesFor(format, cityId);
  const x = rng.next();
  let company: IndustryCompany | undefined;
  if (offered.length && (x < MAJOR_SHARE || format === 'radio')) {
    let left = rng.next() * offered.reduce((n, o) => n + o.weight, 0);
    company = (offered.find((o) => (left -= o.weight) <= 0) ?? offered.at(-1)!).company;
  } else rng.next();
  const title = `${pick(['The ', '', '', 'A '], rng.next())}${pick(TITLE_WORDS.first, rng.next())} ${pick(TITLE_WORDS.second, rng.next())}`.replace(/^A ([AEIOU])/, 'An $1');
  const id = nextId(state, 'pj');
  const castingFrom = at - 7 * MS_DAY;
  const shootFrom = at + role.leadDays * MS_DAY;
  const span = role.medium === 'stage' ? ((role.rehearsalWeeks?.[1] ?? 4) + role.units[1]) * 7 : role.series ? role.series.weeks * 7 : Math.max(1, role.units[1]) * (role.arc ? 7 : 1.4);
  const shootUntil = shootFrom + span * MS_DAY;
  const parts: ProjectPart[] = [{ id: `${id}-0`, roleId: role.id, name: partName(role.series || role.medium === 'stage' ? 'principal' : 'supporting', cityId, rng.next(), rng.next(), rng.next()), size: role.series ? 'principal' : role.tiers.includes(3) ? 'featured' : 'supporting', via: 'agent', status: 'open' }];
  parts[0]!.via = routeFor(role, parts[0]!.size);
  // The part an audition or a breakdown is for is never offer-only: it's being read for.
  if (parts[0]!.via === 'offer') parts[0]!.via = 'agent';
  // The other parts are the same production's, on its contract: until the screens showed a LORT play cast beside a
  // Broadway and an off-Broadway one on 2026-10-08, each was drawn from any role of its medium in the town.
  for (const [k, size] of OTHERS[role.medium].entries()) {
    parts.push({ id: `${id}-${k + 1}`, roleId: role.id, name: partName(size, cityId, rng.next(), rng.next(), rng.next()), size, via: routeFor(role, size), status: 'open' });
  }
  const project: Project = {
    id, title, format, medium: role.medium, ...(company ? { companyId: company.id } : {}), producer: company?.short ?? INDEPENDENT[format], cityId,
    status, announced: Math.min(sim.now, castingFrom - INDUSTRY.developmentDays[format] * MS_DAY), castingUntil: castingFrom + INDUSTRY.castingDays * MS_DAY,
    shootFrom, shootUntil, releaseAt: format === 'play' ? shootFrom + (role.rehearsalWeeks?.[1] ?? 4) * 7 * MS_DAY : shootUntil + INDUSTRY.postDays[format] * MS_DAY, parts,
    history: [{ at: sim.now, what: status === 'development' ? 'Announced, in development' : 'Casting' }],
  };
  state.projects.push(project);
  prune(sim);
  return project;
}

/**
 * The project an audition, a breakdown or a classmate's job is a part in: one casting in the town with that part open
 * and its window still open, or a new one. Returns the project and the part.
 */
export function projectFor(sim: Simulation, role: Role, cityId: string, at: Instant, seed: string, others = false): { project: Project; part: ProjectPart } {
  // Somebody else's job (`others`) isn't put in a project the player is reading for: it would be the player's part.
  const open = industryOf(sim).projects.find((p) => p.cityId === cityId && p.status === 'casting' && p.castingUntil >= at && !(others && p.touched) && p.parts.some((x) => x.roleId === role.id && x.status === 'open' && x.via !== 'offer'));
  const project = open ?? newProject(sim, role, cityId, at, seed);
  const part = project.parts.find((x) => x.roleId === role.id && x.status === 'open' && x.via !== 'offer')!;
  return { project, part };
}

/** An audition put on a project: the part it's for, and the project kept on the record. */
export function attachAudition(sim: Simulation, audition: { id: string; roleId: string; cityId: string; at: Instant; projectId?: string; partId?: string }): void {
  if (audition.projectId && projectById(sim, audition.projectId)) return;
  const { project, part } = projectFor(sim, ROLES.find((r) => r.id === audition.roleId)!, audition.cityId, audition.at, `audition-${audition.id}`);
  audition.projectId = project.id;
  audition.partId = part.id;
  project.touched = true;
}

/** Who holds a part, in words: you, a classmate's name, a performer's. */
export function holderName(sim: Simulation, person: Person, holder: PartHolder | undefined): string {
  if (!holder) return 'Not cast yet';
  if (holder.kind === 'player') return person.displayName;
  if (holder.kind === 'classmate') return person.school?.classmates[holder.i]?.name ?? 'A classmate';
  return performerById(sim, holder.id)?.name ?? 'A performer';
}

/** Whether a performer is free over these dates. */
const freeBetween = (p: IndustryPerformer, from: Instant, until: Instant, except?: string) => !p.commitments.some((c) => c.projectId !== except && c.from <= until && c.until >= from);

/**
 * A performer from the town's pool for a part (`industry.casting`): one who reads near the part's level and is free
 * over its dates; where nobody is, a new one joins the pool. Committed to it from now.
 */
export function castPerformer(sim: Simulation, project: Project, part: ProjectPart, from: Instant, until: Instant, seed: string): IndustryPerformer {
  const state = industryOf(sim);
  const role = ROLES.find((r) => r.id === part.roleId)!;
  const rng = sim.rng('industry.casting', project.cityId, `${project.id}-${part.id}-${seed}`);
  const here = state.performers.filter((p) => p.cityId === project.cityId);
  // Free over the dates, and not already in another part of this one: until it was tested on 2026-10-08, one performer
  // could be cast in two parts of the same production, its own commitments to it not counted.
  const fit = here.filter((p) => Math.abs(p.level - role.bar) <= INDUSTRY.levelBand && freeBetween(p, from, until) && !p.commitments.some((c) => c.projectId === project.id));
  let performer: IndustryPerformer;
  const x = rng.next();
  if (fit.length && (here.length >= INDUSTRY.poolPerTown || x < 0.75)) performer = pick(fit, rng.next());
  else {
    const names = NAMES[country(project.cityId)];
    const female = rng.next() < 0.5;
    performer = {
      id: nextId(state, 'ip'), name: `${pick(female ? names.female : names.male, rng.next())} ${pick(names.family, rng.next())}`, cityId: project.cityId,
      born: zonedParts(sim.now, 'UTC').year - 22 - Math.floor(rng.next() * 40), level: Math.round(role.bar - INDUSTRY.levelBand + rng.next() * 2 * INDUSTRY.levelBand),
      commitments: [], credits: [],
    };
    state.performers.push(performer);
  }
  performer.commitments.push({ projectId: project.id, partId: part.id, from, until });
  return performer;
}

/** A part given to a holder, the one before it remembered with why, and the project's history told. */
export function castPart(project: Project, part: ProjectPart, holder: PartHolder, why?: string, at?: Instant): void {
  if (part.holder && why) {
    (part.was ??= []).push({ holder: part.holder, why });
    if (at !== undefined) project.history.push({ at, what: `${part.name}: recast, the one before ${why}` });
  }
  part.holder = holder;
  part.status = why ? 'recast' : 'cast';
}

/** A performer's commitment to a part ended early (recast, or the dates gone). */
export function release(sim: Simulation, project: Project, part: ProjectPart): void {
  if (part.holder?.kind !== 'performer') return;
  const p = performerById(sim, part.holder.id);
  if (p) p.commitments = p.commitments.filter((c) => !(c.projectId === project.id && c.partId === part.id));
}

/**
 * The player booked for a part: the project's dates become the job's, the part theirs, and the project kept. Its
 * company remembers it when the work's done (`workedFor`).
 */
export function bookPart(sim: Simulation, projectId: string | undefined, partId: string | undefined, from: Instant, until: Instant): Project | undefined {
  const project = projectById(sim, projectId);
  const part = project?.parts.find((x) => x.id === partId);
  if (!project || !part) return undefined;
  if (part.holder && part.holder.kind !== 'player') release(sim, project, part);
  castPart(project, part, { kind: 'player' });
  project.touched = true;
  if (project.status === 'development' || project.status === 'casting') {
    project.shootFrom = Math.min(project.shootFrom, from);
    project.shootUntil = Math.max(project.shootUntil, until);
    if (project.format !== 'play') project.releaseAt = Math.max(project.releaseAt, project.shootUntil + INDUSTRY.postDays[project.format] * MS_DAY);
  }
  project.history.push({ at: sim.now, what: `${part.name}: cast` });
  return project;
}

/** The work done for a project's company, remembered (`KNOWN`); and its release, where the career knows the date. */
export function workedFor(sim: Simulation, projectId: string | undefined, releaseAt?: Instant): void {
  const project = projectById(sim, projectId);
  if (!project) return;
  if (project.companyId) {
    const w = (industryOf(sim).worked[project.companyId] ??= { jobs: 0, lastAt: sim.now });
    w.jobs += 1;
    w.lastAt = sim.now;
  }
  if (releaseAt !== undefined && project.status !== 'released' && project.status !== 'cancelled') project.releaseAt = releaseAt;
}

/** A producer who's worked with the actor before: the edge their reading gets (`KNOWN`), or none. */
export function knownEdge(sim: Simulation, projectId: string | undefined): number {
  const company = projectById(sim, projectId)?.companyId;
  return company && (industryOf(sim).worked[company]?.jobs ?? 0) > 0 ? KNOWN.edge : 1;
}

/**
 * Where a television job's episodes are seen, by its company's rule: a streaming company's on its service, by its size;
 * a broadcaster's on its channels; a company with both, either, on its own service's size; nobody's, as drawn.
 */
export function afterlifeRule(sim: Simulation, projectId: string | undefined): { network?: boolean; size?: 'small' | 'middle' | 'large' } {
  const company = companyById(projectById(sim, projectId)?.companyId ?? '');
  if (!company) return {};
  if (company.release === 'streaming') return { network: false, ...(company.streamer ? { size: company.streamer.size } : {}) };
  if (company.release === 'broadcast') return { network: true };
  return company.streamer ? { size: company.streamer.size } : {};
}

/** A project's status by its dates, the career's own for the player's. */
function statusAt(p: Project, now: Instant): ProjectStatus {
  if (p.status === 'cancelled') return 'cancelled';
  if (now >= p.releaseAt) return 'released';
  if (now >= p.shootUntil) return 'post';
  if (now >= p.shootFrom) return 'production';
  if (now >= p.castingUntil - INDUSTRY.castingDays * MS_DAY) return 'casting';
  return 'development';
}

/** The parts still open when a project shoots: a classmate who fits and is free, or a performer from the pool. */
function castTheRest(sim: Simulation, person: Person, p: Project): void {
  for (const part of p.parts) {
    if (part.status !== 'open') continue;
    const performer = castPerformer(sim, p, part, p.shootFrom, p.shootUntil, 'shoot');
    castPart(p, part, { kind: 'performer', id: performer.id });
  }
  // Cast by its first day, whenever the week's tick comes to it.
  p.history.push({ at: Math.min(sim.now, p.shootFrom), what: 'Cast' });
  void person;
}

/** A part recast to a performer from the pool who's free then: the one before let go, and why. */
export function recastToPerformer(sim: Simulation, project: Project, part: ProjectPart, from: Instant, until: Instant, why: string): IndustryPerformer {
  release(sim, project, part);
  const performer = castPerformer(sim, project, part, from, until, `recast-${(part.was?.length ?? 0) + 1}`);
  castPart(project, part, { kind: 'performer', id: performer.id }, why, sim.now);
  return performer;
}

/**
 * A project's dates moved (`systems/rescheduling.ts`): each performer's commitment moved with it, and one who has
 * another part over the new dates gives this one up to a performer who's free. Returns what changed, in words.
 */
export function moveCommitments(sim: Simulation, project: Project, from: Instant, until: Instant): string[] {
  const out: string[] = [];
  project.shootFrom = Math.min(project.shootFrom, from);
  project.shootUntil = until;
  if (project.status !== 'released' && project.status !== 'cancelled' && project.format !== 'play') project.releaseAt = Math.max(project.releaseAt, until + INDUSTRY.postDays[project.format] * MS_DAY);
  for (const part of project.parts) {
    if (part.holder?.kind !== 'performer') continue;
    const performer = performerById(sim, part.holder.id);
    if (!performer) continue;
    if (freeBetween(performer, from, until, project.id)) {
      for (const c of performer.commitments) if (c.projectId === project.id && c.partId === part.id) { c.from = Math.min(c.from, from); c.until = until; }
      continue;
    }
    const next = recastToPerformer(sim, project, part, from, until, `couldn’t make the new dates`);
    out.push(`${performer.name} couldn’t make the new dates for ${part.name}; ${next.name} plays it`);
  }
  return out;
}

/** A project released: its reception drawn (`industry.reception`), its cast credited, and the player told if it's theirs or a friend's. */
function releaseProject(sim: Simulation, person: Person, p: Project): void {
  const rng = sim.rng('industry.reception', p.cityId, p.id);
  const critics = Math.round(35 + rng.next() * 55);
  const audience = Math.round(Math.max(20, Math.min(98, critics + (rng.next() - 0.5) * 30)));
  p.reception = { critics, audience };
  p.history.push({ at: p.releaseAt, what: p.format === 'play' ? 'Opened' : 'Released' });
  const year = zonedParts(p.releaseAt, 'UTC').year;
  for (const part of p.parts) {
    if (part.holder?.kind !== 'performer') continue;
    const performer = performerById(sim, part.holder.id);
    if (performer && !performer.credits.some((c) => c.projectId === p.id && c.partId === part.id)) performer.credits = [...performer.credits, { projectId: p.id, partId: part.id, year }].slice(-40);
  }
  const mine = p.parts.some((x) => x.holder?.kind === 'player');
  if (mine && person.id === sim.universe.playerId) {
    const where = companyById(p.companyId ?? '');
    sim.notify({ category: 'career', title: `${p.title} Is Out`, body: `${p.title}${where ? `, ${where.short}’s,` : ''} is ${p.format === 'play' ? 'open' : 'out'}. SLATE’s reception, this save’s own: critics ${critics}, audiences ${audience}.`, importance: 40, route: '/workspace/industry' });
  }
}

/** Projects nobody touched, a year past their end, leave the record; and the record kept to its size. */
function prune(sim: Simulation): void {
  const state = industryOf(sim);
  const ended = (p: Project) => p.status === 'released' || p.status === 'cancelled';
  const old = (p: Project) => !p.touched && ended(p) && sim.now - p.releaseAt > INDUSTRY.keepUntouchedDays * MS_DAY;
  if (state.projects.some(old)) state.projects = state.projects.filter((p) => !old(p));
  if (state.projects.length > INDUSTRY.most) {
    const drop = new Set(state.projects.filter((p) => !p.touched && ended(p)).sort((a, b) => a.releaseAt - b.releaseAt).slice(0, state.projects.length - INDUSTRY.most).map((p) => p.id));
    state.projects = state.projects.filter((p) => !drop.has(p.id));
  }
  // A performer's commitments to projects gone are let go; their credits stay, the title kept in words.
  const live = new Set(state.projects.map((p) => p.id));
  for (const p of state.performers) p.commitments = p.commitments.filter((c) => live.has(c.projectId) || c.until > sim.now);
}

/** The month's announcements in the town the player works in: a few projects in development, from the parts it casts. */
function announce(sim: Simulation, cityId: string, when: Instant): void {
  const state = industryOf(sim);
  const key = `${zonedParts(when, 'UTC').year}-${zonedParts(when, 'UTC').month}`;
  if (state.announced[cityId] === key) return;
  state.announced[cityId] = key;
  const here = ROLES.filter((r) => r.cities.includes(cityId as CareerCity));
  if (!here.length) return;
  const rng = sim.rng('industry.project', cityId, `announce-${key}`);
  // Spread over the months ahead: the first casting now, the others as their dates come. Until 2026-10-08 all three
  // waited out their development, and a new career had nothing through agents to be pitched for, for two months.
  for (let n = 0; n < INDUSTRY.announcePerMonth; n += 1) {
    const role = pick(here, rng.next());
    const p = newProject(sim, role, cityId, when + (7 + n * INDUSTRY.announceApartDays) * MS_DAY, `announce-${key}-${n}`, 'development');
    p.announced = when;
    p.status = statusAt(p, sim.now);
    p.history = [{ at: when, what: p.status === 'casting' ? 'Announced, and casting' : 'Announced, in development' }];
  }
}

/** The week: each project's status moved to its dates, the parts left cast as it shoots, releases, and the month's news. */
export function industryWeek(sim: Simulation, person: Person, cityId: string, when: Instant): void {
  const state = industryOf(sim);
  announce(sim, cityId, when);
  postBreakdowns(sim, cityId, when);
  for (const p of state.projects) {
    const next = statusAt(p, sim.now);
    if (next === p.status) continue;
    const was = p.status;
    p.status = next;
    if ((next === 'production' || next === 'post' || next === 'released') && (was === 'development' || was === 'casting')) castTheRest(sim, person, p);
    if (next === 'production') p.history.push({ at: p.shootFrom, what: p.format === 'play' ? 'In rehearsal' : 'In production' });
    if (next === 'released') releaseProject(sim, person, p);
    if (next === 'casting') p.history.push({ at: sim.now, what: 'Casting' });
  }
  prune(sim);
}

export function armIndustry(sim: Simulation): void {
  if (sim.universe.scheduled.some((i) => i.kind === INDUSTRY_WEEK_KIND && i.status === 'pending')) return;
  const zone = sim.homeZone;
  const p = zonedParts(sim.now + MS_DAY, zone);
  sim.schedule({ at: instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 6, minute: 0 }, zone), kind: INDUSTRY_WEEK_KIND, label: 'The Business’s Week', category: 'system', priority: 6, payload: {} });
}

/** Something looked at in the database, remembered at the top of the list. */
export function viewed(sim: Simulation, kind: string, id: string): void {
  const state = industryOf(sim);
  state.viewed = [{ kind, id, at: sim.now }, ...state.viewed.filter((v) => !(v.kind === kind && v.id === id))].slice(0, INDUSTRY.viewedKept);
}

export function registerIndustry(sim: Simulation): void {
  sim.onSchedule(INDUSTRY_WEEK_KIND, (item, s) => {
    const person = s.player;
    const cityId = person.career?.since !== undefined ? (person.career.agencyCity ?? person.home?.cityId ?? person.currentLocationId) : person.home?.cityId ?? person.currentLocationId;
    industryWeek(s, person, CITIES.get(cityId) ? cityId : 'us-ny-newyork', item.at);
    s.schedule({ at: item.at + 7 * MS_DAY, kind: INDUSTRY_WEEK_KIND, label: 'The Business’s Week', category: 'system', priority: 6, payload: {} });
  });

  sim.onCommand<{ list: string; kind: PlayerList['items'][number]['kind']; id: string; on: boolean }, { list: string; count: number }>('industry.list', (q, { sim: s }) => {
    const state = industryOf(s);
    const list = state.lists.find((l) => l.id === q?.list);
    if (!list) throw new CommandError('There’s no such list.');
    if (!['project', 'title', 'person', 'company'].includes(String(q.kind)) || !q.id) throw new CommandError('That can’t go on a list.');
    list.items = list.items.filter((x) => !(x.kind === q.kind && x.id === q.id));
    if (q.on) list.items.unshift({ kind: q.kind, id: String(q.id), at: s.now });
    if (q.kind === 'project') { const p = projectById(s, q.id); if (p) p.touched = true; }
    return { list: list.id, count: list.items.length };
  });

  sim.onCommand<{ name: string }, { list: string }>('industry.new_list', (q, { sim: s }) => {
    const state = industryOf(s);
    const name = String(q?.name ?? '').trim().slice(0, 40);
    if (!name) throw new CommandError('A list needs a name.');
    if (state.lists.length >= 20) throw new CommandError('Twenty lists at most.');
    if (state.lists.some((l) => l.name.toLowerCase() === name.toLowerCase())) throw new CommandError('You have a list by that name.');
    const id = nextId(state, 'list');
    state.lists.push({ id, name, items: [] });
    return { list: id };
  });

  sim.onCommand<{ key: string; score: number }, { score: number }>('industry.rate', (q, { sim: s }) => {
    const score = Math.round(Number(q?.score));
    if (!(score >= 1 && score <= 10)) throw new CommandError('A rating is 1 to 10.');
    const key = String(q?.key ?? '');
    const project = key.startsWith('project:') ? projectById(s, key.slice(8)) : undefined;
    if (key.startsWith('project:') && (!project || project.status !== 'released')) throw new CommandError('Only what’s been released can be rated.');
    const real = key.startsWith('title' + ':');
    if (!key.startsWith('project:') && !real) throw new CommandError('That can’t be rated.');
    industryOf(s).ratings[key] = { score, at: s.now };
    if (project) project.touched = true;
    return { score };
  });

  // Titles looked up on Wikidata, kept with the day they were fetched (`world/lookup.ts`). What's kept is checked for its
  // shape, not trusted: an id is a Wikidata id, a name a string of a sane length, a list a list.
  sim.onCommand<{ titles: RealTitle[]; people: Record<string, string>; fetched: string }, { kept: number }>('industry.keep_lookup', (q, { sim: s }) => {
    const titles = Array.isArray(q?.titles) ? q.titles : [];
    const fetched = String(q?.fetched ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fetched)) throw new CommandError('A lookup keeps the day it was fetched.');
    const isId = (x: unknown) => typeof x === 'string' && /^Q\d+$/.test(x);
    const isName = (x: unknown) => typeof x === 'string' && x.length > 0 && x.length <= 200;
    const ok = (t: RealTitle) => isId(t?.id) && isName(t.title) && Number.isFinite(t.year) && (t.kind === 'film' || t.kind === 'series' || t.kind === 'short')
      && Array.isArray(t.cast) && t.cast.every((c) => isId(c.person)) && Array.isArray(t.directors) && t.directors.every(isId);
    const good = titles.filter(ok).slice(0, LOOKUP.most);
    if (titles.length && !good.length) throw new CommandError('None of that is a title SLATE can keep.');
    const state = industryOf(s);
    const looked = (state.looked ??= { titles: {}, people: {}, order: [] });
    for (const t of good) {
      looked.titles[t.id] = { ...t, fetched };
      looked.order = [t.id, ...looked.order.filter((x) => x !== t.id)];
    }
    for (const [id, name] of Object.entries(q?.people ?? {})) if (isId(id) && isName(name)) looked.people[id] = name;
    // Kept to its size, the longest unlooked-at let go, and the people no kept title names with them.
    for (const gone of looked.order.splice(LOOKUP.kept)) delete looked.titles[gone];
    const named = new Set(Object.values(looked.titles).flatMap((t) => [...t.cast.map((c) => c.person), ...t.directors]));
    for (const id of Object.keys(looked.people)) if (!named.has(id)) delete looked.people[id];
    return { kept: good.length };
  });

  sim.onCommand<{ kind: string; id: string }, { viewed: number }>('industry.view', (q, { sim: s }) => {
    viewed(s, String(q?.kind), String(q?.id));
    return { viewed: industryOf(s).viewed.length };
  });

}

/** A series' next season picked up: the same project, its new dates, in production again when they come. */
export function newSeason(sim: Simulation, projectId: string | undefined, season: number, from: Instant, until: Instant): void {
  const project = projectById(sim, projectId);
  if (!project) return;
  project.history.push({ at: sim.now, what: `Season ${season} picked up` });
  project.status = 'casting';
  project.castingUntil = from;
  project.shootFrom = from;
  project.shootUntil = until;
  project.releaseAt = until + INDUSTRY.postDays[project.format] * MS_DAY;
  delete project.reception;
}

/** A series not picked up: its history says so; what was made stays released. */
export function seriesEnded(sim: Simulation, projectId: string | undefined, season: number): void {
  const project = projectById(sim, projectId);
  if (project) project.history.push({ at: sim.now, what: `Not picked up for season ${season}` });
}

/** A project called off: canceled, its performers let go of their commitments, its history kept. */
export function cancelProject(sim: Simulation, projectId: string | undefined, why: string): void {
  const project = projectById(sim, projectId);
  if (!project || project.status === 'released' || project.status === 'cancelled') return;
  project.status = 'cancelled';
  project.releaseAt = sim.now;
  project.history.push({ at: sim.now, what: `Called off: ${why}` });
  // Everybody committed to it is free of it, whether or not they'd been given a part yet.
  for (const p of industryOf(sim).performers) p.commitments = p.commitments.filter((c) => c.projectId !== project.id);
}

/** The project whose part a breakdown is, where one in the town is casting it open to a submission. Read only. */
export function openPart(sim: Simulation, roleId: string, cityId: string, route: PartRoute = 'open'): { project: Project; part: ProjectPart } | undefined {
  for (const project of industryOf(sim).projects) {
    if (project.cityId !== cityId || project.status !== 'casting' || project.castingUntil < sim.now) continue;
    const part = project.parts.find((x) => x.roleId === roleId && x.status === 'open' && x.via === route);
    if (part) return { project, part };
  }
  return undefined;
}

/** Every part posted to submit for in the town has a project casting it: one made where none is (`industry.project`). */
export function postBreakdowns(sim: Simulation, cityId: string, when: Instant): void {
  for (const role of ROLES) {
    if (!role.selfSubmit || !role.cities.includes(cityId as CareerCity) || openPart(sim, role.id, cityId)) continue;
    const made = newProject(sim, role, cityId, when + 7 * MS_DAY, `breakdown-${role.id}-${when}`);
    // Posted for submissions: its part is open to them.
    made.parts[0]!.via = 'open';
  }
}

/**
 * An agent's pitch for a part (`career.pitch`): why it can't be made now, or nothing. The agency sends clients to the
 * work its reach does (`Role.tiers`), in its own country; a part cast by offer isn't pitched for; two a week.
 */
export function pitchRefusal(sim: Simulation, person: Person, projectId: string, partId: string, agency: { tier: 1 | 2 | 3; countryId?: string; name: string } | undefined, pitched: readonly { projectId: string; partId: string; at: Instant }[], auditioned: boolean): string | undefined {
  const project = projectById(sim, projectId);
  const part = project?.parts.find((x) => x.id === partId);
  if (!project || !part) return 'There’s no such part.';
  if (!agency) return 'An agent pitches; you have none. A breakdown open to submissions you can submit for yourself.';
  if (project.status !== 'casting' || project.castingUntil < sim.now) return `${project.title} isn’t casting now.`;
  if (part.status !== 'open') return `${part.name} is cast.`;
  if (part.via === 'offer') return `${part.name} is cast by offer: the producers go to actors they already want.`;
  if ((CITIES.get(project.cityId)?.countryId ?? 'us') !== (agency.countryId ?? 'us')) return `${agency.name} works in another country.`;
  const role = ROLES.find((r) => r.id === part.roleId)!;
  if (!role.tiers.includes(agency.tier)) return `${agency.name} doesn’t send clients to that kind of work.`;
  if (auditioned || pitched.some((x) => x.projectId === projectId && x.partId === partId)) return 'You’re up for it already.';
  if (pitched.filter((x) => sim.now - x.at < 7 * MS_DAY).length >= INDUSTRY.pitch.perWeek) return `${INDUSTRY.pitch.perWeek} pitches a week at most.`;
  void person;
  return undefined;
}
