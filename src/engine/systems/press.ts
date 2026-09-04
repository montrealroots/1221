/**
 * SLATE — publishing.
 *
 * The bridge between something happening in the world and the trades writing
 * about it. It picks who covers a story, has each of them write it in their
 * own register, records what came out, and keeps the whole thing from ever
 * printing the same paragraph twice.
 *
 * Three rules hold here, and each is the reason a line of this file exists.
 *
 * Nothing published is presented as a real article. The outlets are real and
 * everything factual about them is the public record; the words are SLATE's
 * about SLATE's invented films, and the screens say so.
 *
 * Nothing is published that the player's character could not know. A story
 * runs only once the thing it is about has actually happened in public — a
 * greenlight is announced, a weekend is counted, a seat has changed. What is
 * still inside a company is not press.
 *
 * Nothing repeats. Every piece is checked against a window of what has already
 * been printed, and the assembler draws again when it lands inside it.
 */

import type { Simulation } from '../core/simulation';
import type { WorldEvent } from '../core/events';
import type { Id, PressItem, Project } from '../domain/model';
import { OUTLETS } from '../content/press';
import { coverEvent } from '../content/press-write';
import type { StoryFacts, StoryKind } from '../content/press-story';
import { genreName } from '../content/genres';
import { rating } from '../content/ratings';
import { CITIES } from '../content/geography';
import { bodyName } from './awards';
import { formatDate } from '../core/time';

/** How much press a save keeps. Old pieces fall off the bottom rather than growing without bound. */
const PRESS_CAP = 400;

/** How many recent pieces a new one is checked against for repetition. */
const REPEAT_WINDOW = 140;

/** What has been printed lately, as a set of headlines and opening lines. */
function recentText(sim: Simulation): Set<string> {
  const press = sim.universe.press ?? [];
  const window = press.slice(Math.max(0, press.length - REPEAT_WINDOW));
  const seen = new Set<string>();
  for (const item of window) {
    seen.add(item.headline);
    if (item.paragraphs[0]) seen.add(item.paragraphs[0]);
  }
  return seen;
}

/**
 * How many outlets pick a story up.
 *
 * A record gets covered everywhere; a day player being cast in a small film
 * gets one paragraph somewhere, if that. The player's own work always gets at
 * least one, because a career nobody writes about is not a career.
 */
function pickUp(kind: StoryKind, facts: StoryFacts): number {
  const big = kind === 'record' || kind === 'win' || kind === 'labour' || kind === 'executive';
  const medium = kind === 'greenlight' || kind === 'opening' || kind === 'nomination'
    || kind === 'cancellation' || kind === 'deal' || kind === 'collapse';
  const budget = facts.budget ?? 0;
  const scale = budget >= 80_000_000_00 ? 2 : budget >= 20_000_000_00 ? 1 : 0;
  const base = big ? 3 : medium ? 2 : 1;
  return Math.min(5, base + scale + (facts.aboutPlayer ? 1 : 0));
}

export interface PublishOptions {
  /** How many outlets run it. Left out, it is decided by how big the story is. */
  count?: number;
  /** Which market the story is from, so its own trades cover it hardest. */
  countryId?: string;
  /** What the piece is about, so a project or a person can find its own coverage. */
  projectId?: Id;
  personId?: Id;
  studioId?: string;
  networkId?: string;
}

/**
 * Publishes one event.
 *
 * Returns what actually ran, which can be nothing: a story the frames have no
 * honest way to write is not written, and inventing one is exactly what this
 * must not do.
 */
export function publish(sim: Simulation, facts: StoryFacts, options: PublishOptions = {}): PressItem[] {
  sim.universe.press ??= [];
  const taken = recentText(sim);
  const rng = sim.rng('press', facts.kind, facts.title ?? facts.person ?? facts.studio ?? 'x', String(sim.now));

  const stories = coverEvent(facts, rng, {
    count: options.count ?? pickUp(facts.kind, facts),
    countryId: options.countryId,
    taken: (text) => taken.has(text),
  });

  const published: PressItem[] = [];
  for (const story of stories) {
    // Two outlets running the identical headline on the same day is the one
    // thing that would give the whole system away.
    if (published.some((item) => item.headline === story.headline)) continue;
    const item: PressItem = {
      id: sim.nextId('press'),
      at: sim.now,
      outletId: story.outletId,
      outletName: story.outletName,
      kind: story.kind,
      desk: story.desk,
      register: story.register,
      headline: story.headline,
      standfirst: story.standfirst,
      paragraphs: story.paragraphs,
      projectId: options.projectId,
      personId: options.personId,
      studioId: options.studioId,
      networkId: options.networkId,
      aboutPlayer: facts.aboutPlayer,
    };
    sim.universe.press.push(item);
    published.push(item);
  }

  if (sim.universe.press.length > PRESS_CAP) {
    sim.universe.press.splice(0, sim.universe.press.length - PRESS_CAP);
  }
  if (published.length > 0) {
    sim.emit('press.published', { kind: facts.kind, count: published.length, outlets: published.map((p) => p.outletId) });
  }
  return published;
}

// ---------------------------------------------------------------------------
// Turning a project into facts a piece can be written from
// ---------------------------------------------------------------------------

/** A city as a piece would name it. */
function cityNameOf(cityId: string | undefined): string | undefined {
  return cityId ? CITIES.get(cityId)?.name : undefined;
}

/** A person's name as a piece would print it. */
function nameOf(sim: Simulation, id: Id | undefined): string | undefined {
  if (!id) return undefined;
  const person = sim.universe.people[id];
  return person?.stageName ?? person?.displayName;
}

/**
 * Everything about a project that a story could reasonably carry.
 *
 * Only what a published piece could contain: what has been announced, what has
 * been counted, and who is on it. Nothing internal — no script score before
 * anybody has read it, no budget before it is set.
 */
export function factsForProject(sim: Simulation, project: Project, kind: StoryKind): StoryFacts {
  const cast = project.castIds
    .map((id) => nameOf(sim, id))
    .filter((name): name is string => Boolean(name))
    .slice(0, 4);

  const facts: StoryFacts = {
    kind,
    title: project.title,
    format: project.format,
    // Genre names come out of the registry as labels — 'Science Fiction',
    // 'Children's' — and a sentence wants them as words. A headline puts the
    // capitals back (see headlineCase).
    genres: project.genres.map((id) => genreName(id).toLowerCase()),
    certificate: project.contentRating ? rating(project.contentRating)?.code ?? project.contentRating : undefined,
    runtimeMinutes: project.runtime,
    logline: project.logline,
    studio: project.distributorName,
    director: nameOf(sim, project.directorId),
    writer: project.writerIds[0] ? nameOf(sim, project.writerIds[0]) : undefined,
    cast: cast.length > 0 ? cast : undefined,
    budget: project.budget > 0 ? project.budget : undefined,
    shootDays: project.scheduledShootDays || undefined,
    city: cityNameOf(project.productionLocationIds[0]),
    countryId: project.productionCountryId,
    criticScore: project.criticScore,
    audienceScore: project.audienceScore,
    aboutPlayer: project.createdById === sim.universe.playerId
      || project.castIds.includes(sim.universe.playerId),
  };

  if (project.releaseDate) facts.dateLabel = formatDate(project.releaseDate, sim.homeZone);
  if (project.boxOfficeDomestic > 0) {
    facts.runningTotal = project.boxOfficeDomestic + project.boxOfficeInternational;
  }
  facts.year = new Date(project.releaseDate ?? sim.now).getUTCFullYear();
  return facts;
}

/** Every piece published about one project, newest first. */
export function pressForProject(sim: Simulation, projectId: Id): PressItem[] {
  return (sim.universe.press ?? []).filter((item) => item.projectId === projectId).reverse();
}

/** Every piece published about one person, newest first. */
export function pressForPerson(sim: Simulation, personId: Id): PressItem[] {
  return (sim.universe.press ?? []).filter((item) => item.personId === personId).reverse();
}

/** Everything one outlet has run, newest first. */
export function pressFromOutlet(sim: Simulation, outletId: string): PressItem[] {
  return (sim.universe.press ?? []).filter((item) => item.outletId === outletId).reverse();
}

/** The front page: everything, newest first. */
export function frontPage(sim: Simulation, limit = 60): PressItem[] {
  const press = sim.universe.press ?? [];
  return press.slice(Math.max(0, press.length - limit)).reverse();
}

/** How much of the press each outlet has actually written, for the profile pages. */
export function outletActivity(sim: Simulation): { outletId: string; name: string; pieces: number }[] {
  const counts = new Map<string, number>();
  for (const item of sim.universe.press ?? []) {
    counts.set(item.outletId, (counts.get(item.outletId) ?? 0) + 1);
  }
  return OUTLETS.all()
    .map((outlet) => ({ outletId: outlet.id, name: outlet.name, pieces: counts.get(outlet.id) ?? 0 }))
    .sort((a, b) => b.pieces - a.pieces);
}

// ---------------------------------------------------------------------------
// What the press actually covers
// ---------------------------------------------------------------------------

/**
 * The desk.
 *
 * Rather than a `publish` call scattered through every system — which drifts
 * the moment somebody adds an event — the press listens to what the world
 * already announces and writes from that. One consequence is that the press
 * can only ever know what the world made public, which is exactly the rule it
 * has to follow.
 *
 * What is deliberately not covered: anything still inside a company. A project
 * in development with no announcement, a script score nobody has seen, an
 * offer that has not been answered. Those are not news, and printing them
 * would be telling the player something their character could not know.
 */
export function registerPress(sim: Simulation): void {
  const project = (id: unknown): Project | undefined =>
    typeof id === 'string' ? sim.universe.projects[id] : undefined;

  const named = (id: unknown): string | undefined =>
    typeof id === 'string' ? nameOf(sim, id) : undefined;

  // --- Development ---------------------------------------------------------

  sim.onEvent('world.commissioned', 'press.commissioned', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const p = project(payload.projectId);
    if (!p) return;
    // Only what has scale enough to be reported. A small independent picture
    // being set up is not a story anybody outside it hears about.
    if (p.budget < 4_000_000_00) return;
    publish(sim, factsForProject(sim, p, 'setup'), {
      projectId: p.id, studioId: p.studioId, countryId: p.productionCountryId,
    });
  });

  sim.onEvent('project.greenlit', 'press.greenlit', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const p = project(payload.projectId);
    if (!p) return;
    publish(sim, factsForProject(sim, p, 'greenlight'), {
      projectId: p.id, studioId: p.studioId, countryId: p.productionCountryId,
    });
  });

  sim.onEvent('film.talent_attached', 'press.talent_attached', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const p = project(payload.projectId);
    const person = named(payload.personId);
    if (!p || !person) return;
    // Attaching yourself to your own film is not news.
    if (payload.personId === sim.universe.playerId) return;
    const facts = factsForProject(sim, p, 'attachment');
    facts.person = person;
    facts.personRole = String(payload.role ?? 'producer');
    publish(sim, facts, {
      projectId: p.id, personId: String(payload.personId), studioId: p.studioId,
      countryId: p.productionCountryId,
    });
  });

  sim.onEvent('film.real_approach_accepted', 'press.real_approach_accepted', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const p = project(payload.projectId);
    const person = named(payload.personId);
    if (!p || !person) return;
    const facts = factsForProject(sim, p, 'attachment');
    facts.person = person;
    facts.personRole = String(payload.role ?? 'director');
    facts.money = typeof payload.amount === 'number' ? payload.amount : undefined;
    publish(sim, facts, {
      projectId: p.id, personId: String(payload.personId), studioId: p.studioId,
      countryId: p.productionCountryId,
    });
  });

  const covered = (payload: Record<string, unknown>, kind: StoryKind) => {
    const p = project(payload.projectId);
    const person = named(payload.personId);
    if (!p || !person) return;
    const facts = factsForProject(sim, p, kind);
    facts.person = person;
    // A piece never says somebody joins a cast that already lists them: they
    // are the subject of the story, not part of the company they are joining.
    facts.cast = facts.cast?.filter((name) => name !== person);
    if (facts.cast?.length === 0) facts.cast = undefined;
    if (typeof payload.fee === 'number') facts.money = payload.fee;
    if (typeof payload.amount === 'number') facts.money = payload.amount;
    publish(sim, facts, {
      projectId: p.id, personId: String(payload.personId), studioId: p.studioId,
      countryId: p.productionCountryId,
    });
  };

  sim.onEvent('cast.role_filled', 'press.role_filled', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    // A day player is not a story. A lead always is.
    const billing = String(payload.billing ?? '');
    if (billing !== 'lead' && billing !== 'supporting') return;
    covered(payload, 'casting');
  });

  sim.onEvent('cast.real_offer_accepted', 'press.real_offer_accepted', (event: WorldEvent) => covered(event.payload as Record<string, unknown>, 'casting'));

  // --- Production ----------------------------------------------------------

  sim.onEvent('prod.photography_started', 'press.photography_started', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const p = project(payload.projectId);
    if (!p) return;
    publish(sim, factsForProject(sim, p, 'production_start'), {
      projectId: p.id, studioId: p.studioId, countryId: p.productionCountryId,
    });
  });

  sim.onEvent('prod.wrapped', 'press.wrapped', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const p = project(payload.projectId);
    if (!p) return;
    const facts = factsForProject(sim, p, 'wrap');
    if (typeof payload.days === 'number') facts.shootDays = payload.days;
    if (typeof payload.totalCost === 'number') facts.money = payload.totalCost;
    publish(sim, facts, { projectId: p.id, studioId: p.studioId, countryId: p.productionCountryId });
  });

  sim.onEvent('prod.tested', 'press.tested', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const p = project(payload.projectId);
    if (!p) return;
    const facts = factsForProject(sim, p, 'test_screening');
    if (typeof payload.score === 'number') facts.criticScore = payload.score;
    // A test screening leaks; it is not announced. One outlet, at most.
    publish(sim, facts, { count: 1, projectId: p.id, studioId: p.studioId });
  });

  // --- Release -------------------------------------------------------------

  sim.onEvent('fest.screened', 'press.screened', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const p = project(payload.projectId);
    if (!p) return;
    publish(sim, factsForProject(sim, p, 'festival_premiere'), {
      projectId: p.id, studioId: p.studioId, countryId: p.productionCountryId,
    });
  });

  sim.onEvent('rel.reviews_published', 'press.reviews_published', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const p = project(payload.projectId);
    if (!p) return;
    const facts = factsForProject(sim, p, 'reviews');
    if (typeof payload.criticScore === 'number') facts.criticScore = payload.criticScore;
    if (typeof payload.audienceScore === 'number') facts.audienceScore = payload.audienceScore;
    publish(sim, facts, { projectId: p.id, studioId: p.studioId });
  });

  sim.onEvent('rel.opening_weekend', 'press.opening_weekend', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const p = project(payload.projectId);
    if (!p) return;
    const facts = factsForProject(sim, p, 'opening');
    if (typeof payload.gross === 'number') facts.opening = payload.gross;
    if (typeof payload.theaters === 'number') facts.theatres = payload.theaters;
    publish(sim, facts, { projectId: p.id, studioId: p.studioId, countryId: p.productionCountryId });
  });

  // --- Television ----------------------------------------------------------

  sim.onEvent('net.upfront', 'press.upfront', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const renewed = Number(payload.renewed ?? 0);
    const cancelled = Number(payload.cancelled ?? 0);
    if (renewed + cancelled === 0) return;
    publish(sim, {
      kind: 'ratings',
      title: `The ${payload.season ?? ''} Season`.trim(),
      network: 'the networks',
      episodes: renewed + cancelled,
      rank: 1,
      note: `${renewed} shows came back and ${cancelled} did not. The holes are already being filled.`,
    }, { count: 2 });
  });

  // --- Awards --------------------------------------------------------------

  sim.onEvent('award.won', 'press.won', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const category = typeof payload.category === 'string' ? payload.category : '';
    const p = project(payload.projectId);
    const aboutPlayer = Boolean(p && (p.createdById === sim.universe.playerId || p.castIds.includes(sim.universe.playerId)))
      || payload.personId === sim.universe.playerId;

    // A ceremony hands out thirty of these in an evening and the trades do not
    // write thirty pieces. The categories that lead a night get covered, the
    // player's own win always gets covered, and the craft categories are a
    // line in somebody else's piece rather than a story of their own.
    if (!aboutPlayer && !LEADS_THE_NIGHT.test(category)) return;

    const facts: StoryFacts = p ? factsForProject(sim, p, 'win') : { kind: 'win' };
    facts.kind = 'win';
    facts.award = typeof payload.bodyId === 'string' ? bodyName(payload.bodyId) : undefined;
    facts.category = category || undefined;
    const person = named(payload.personId);
    if (person) facts.person = person;
    if (facts.award === undefined || (!facts.title && !facts.person)) return;
    publish(sim, facts, {
      count: aboutPlayer ? 3 : 1,
      projectId: p?.id, personId: typeof payload.personId === 'string' ? payload.personId : undefined,
      studioId: p?.studioId,
    });
  });

  // --- Business ------------------------------------------------------------

  sim.onEvent('studio.deal_signed', 'press.deal_signed', (event: WorldEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const player = sim.universe.people[sim.universe.playerId];
    if (!player) return;
    publish(sim, {
      kind: 'deal',
      person: player.stageName ?? player.displayName,
      studio: typeof payload.counterpartyId === 'string' ? payload.counterpartyId : undefined,
      note: `A ${String(payload.kind ?? 'first-look').replace(/_/g, '-')} deal.`,
      aboutPlayer: true,
    }, { count: 2, personId: player.id });
  });
}

/**
 * The categories a night is reported on.
 *
 * Everything else is real and is recorded in the awards system; it is simply
 * not what a trade writes a separate piece about. The player's own win is
 * covered whatever category it is in.
 */
const LEADS_THE_NIGHT = /\b(picture|film|director|directing|actor|actress|screenplay|writing|series|drama|comedy|animated feature|international feature|documentary feature|ensemble)\b/i;
