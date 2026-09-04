/**
 * SLATE — Why the industry never makes the same year twice.
 *
 * A world that picks a genre at random produces mush: a flat, characterless
 * stream where every country makes the same thing and nothing means anything.
 * A world that picks by fixed weights is worse — it produces the same thing
 * forever. Both feel dead within an hour.
 *
 * So this does three things at once, and the interaction between them is what
 * keeps the place alive:
 *
 * 1. Every country has its own nature, taken from what it has actually made.
 *    Korea makes drama and romance, France makes comedy and drama in nearly
 *    equal measure, Ireland makes drama and very little else, Japan makes more
 *    animation than anywhere. That is the record, not an invention.
 *
 * 2. Heat moves. A hit warms its genre in that market and everybody piles in;
 *    the pile-on saturates it and the heat falls; the fall pulls it back
 *    toward the country's own nature. That cycle is why westerns died, why
 *    superheroes boomed and tired, and why horror comes back every decade.
 *    When heat runs far enough ahead, it gets a name and the trades call it a
 *    wave.
 *
 * 3. Novelty is enforced, not hoped for. Every genre carries a penalty that
 *    grows with how recently it was used, and no combination may repeat inside
 *    a window. The penalty is exponential, so a run of the same thing is not
 *    unlikely — it is arithmetically impossible. That is the guarantee, and
 *    tests/zeitgeist measures it rather than trusting it.
 *
 * The world's productions are real, so the ones near enough to the player to
 * be auditioned for put their parts out to be cast. What casting never does
 * any more is invent a film to hang a breakdown on: every breakdown belongs to
 * something this file actually commissioned.
 */

import type { Simulation } from '../core/simulation';
import type { Id, MarketMood, Project, Wave } from '../domain/model';
import type { WorldEvent } from '../core/events';
import type { Rng } from '../core/rng';
import { clamp, remap } from '../core/rng';
import { addDays, instantFromZoned, zonedParts, MS_DAY } from '../core/time';
import { formatMoneyCompact, type Money } from '../core/money';
import { COUNTRIES, countryOfCity, primaryLanguageOf } from '../content/geography';
import { MARKET_PROFILES, genreLift, type MarketProfile } from '../content/market-profiles';
import { canonicalGenre, genre, genreName, GENRES_FULL, suggestedPairings } from '../content/genres';
import { ratingsFor, suggestRating } from '../content/ratings';
import { STUDIOS } from '../content/studios';
import { NETWORKS } from '../content/networks';
import { titleCaseLabel } from '../core/text';
import { studioForBackgroundProject, networkForBackgroundProject, openWorldCasting } from './casting';
import { attachWorldCrew } from './industry-people';
import { buildPremise } from '../content/premise';
import { effectiveStudio, isPlayersProject, recordNews, recordTrade } from './studio-state';

/** How much of the player's own market puts its parts out where they could be seen. */
const OPEN_CASTING_SHARE = 0.65;
/** How many past commissions a market remembers when weighing novelty. */
const MEMORY = 26;
/** No combination may repeat inside this many commissions in the same market. */
const REPEAT_WINDOW = 14;
/** How hard recency counts against a genre. Above one, a repeat decays faster than linearly. */
const NOVELTY_EXPONENT = 1.7;
/** Heat above this starts a wave; below this one breaks. */
const WAVE_START = 76;
const WAVE_END = 55;
/** The world commissions this share of what each country really produces a year. */
const COMMISSION_RATE = 0.12;
/** Finished world productions kept before the oldest are let go. */
const LIBRARY_CAP = 260;

// ---------------------------------------------------------------------------
// The mood of a market
// ---------------------------------------------------------------------------

function store(sim: Simulation) {
  const u = sim.universe;
  u.zeitgeist ??= { markets: {}, lastTick: 0, history: [] };
  return u.zeitgeist;
}

/** The genres a country makes, and how much of its output each one is. */
export function profileOf(countryId: string): MarketProfile | undefined {
  return MARKET_PROFILES[countryId];
}

/**
 * A country's own nature as a heat baseline. A genre that is a third of what
 * it makes sits warm; one it never makes sits cold but never at zero, because
 * somebody somewhere is always making the thing nobody makes.
 */
function baselineHeat(profile: MarketProfile | undefined, genreId: string, countryId?: string): number {
  const share = profile?.genres[genreId] ?? 0;
  const lift = profile && countryId ? Math.min(genreLift(countryId, genreId), 3) : 1;
  return clamp(14 + share * 70 + lift * 16, 8, 90);
}

export function marketMood(sim: Simulation, countryId: string): MarketMood {
  const z = store(sim);
  const existing = z.markets[countryId];
  if (existing) return existing;
  const profile = profileOf(countryId);
  const heat: Record<string, number> = {};
  for (const g of GENRES_FULL) heat[g.id] = baselineHeat(profile, g.id, countryId);
  const mood: MarketMood = { countryId, heat, recent: [], recentGenres: [], commissioned: 0, waves: [] };
  z.markets[countryId] = mood;
  return mood;
}

export function heatOf(sim: Simulation, countryId: string, genreId: string): number {
  return marketMood(sim, countryId).heat[canonicalGenre(genreId)] ?? 30;
}

/** Every market the world is currently making things in, busiest first. */
export function marketsInPlay(): { countryId: string; name: string; profile: MarketProfile }[] {
  return Object.entries(MARKET_PROFILES)
    .map(([countryId, profile]) => ({ countryId, name: COUNTRIES.get(countryId)?.name ?? countryId, profile }))
    .sort((a, b) => b.profile.perYear - a.profile.perYear);
}

/** What a market is hot on now, warmest first, against its own nature. */
export function risingIn(sim: Simulation, countryId: string, count = 5): { genreId: string; name: string; heat: number; against: number }[] {
  const mood = marketMood(sim, countryId);
  const profile = profileOf(countryId);
  return Object.entries(mood.heat)
    .map(([genreId, heat]) => ({ genreId, name: genreName(genreId), heat: Math.round(heat), against: Math.round(heat - baselineHeat(profile, genreId, countryId)) }))
    .sort((a, b) => b.heat - a.heat)
    .slice(0, count);
}

export function activeWaves(sim: Simulation, countryId?: string): Wave[] {
  const z = store(sim);
  const all = Object.values(z.markets).flatMap((m) => m.waves.filter((w) => !w.endedAt));
  return countryId ? all.filter((w) => w.countryId === countryId) : all;
}

// ---------------------------------------------------------------------------
// Picking what gets made, so that it is never what was just made
// ---------------------------------------------------------------------------

const comboKey = (genres: readonly string[]): string => [...genres].sort().join('+');

/** How much a genre is held back by how recently this market used it. */
function novelty(mood: MarketMood, genreId: string): number {
  let seen = 0;
  for (let i = 0; i < mood.recentGenres.length; i++) {
    // The most recent use counts fully; older ones count less.
    if (mood.recentGenres[i] === genreId) seen += remap(i, 0, MEMORY, 0.35, 1);
  }
  return 1 / Math.pow(1 + seen, NOVELTY_EXPONENT);
}

function heatFactor(heat: number): number {
  return 0.35 + (clamp(heat, 0, 100) / 100) * 1.3;
}

function weightOf(mood: MarketMood, profile: MarketProfile | undefined, genreId: string, format: Project['format']): number {
  const def = genre(genreId);
  if (!def) return 0;
  if (!(def.formats as readonly string[]).includes(format)) return 0;
  const share = profile?.genres[genreId] ?? 0;
  // What a country is known for is not what it makes most of — everybody makes
  // drama — but what it makes more of than everywhere else. Share keeps the
  // staples present; lift is what makes Japan animation and Sweden thriller.
  const lift = Math.min(profile ? genreLift(mood.countryId, genreId) : 1, 3);
  // Multiplied rather than added: share says how much of this country's work a
  // genre is, lift says how much more of it they make than anywhere else. Added
  // together, a genre nobody makes much of anywhere wins on lift alone and every
  // market leads with something obscure. Multiplied, a staple stays a staple and
  // a signature still leads — Japan animation, India romance, Sweden thriller.
  const nature = (0.06 + share) * (0.55 + 0.45 * lift);
  return nature * heatFactor(mood.heat[genreId] ?? 30) * novelty(mood, genreId);
}

function weightedPick(rng: Rng, entries: { id: string; weight: number }[]): string | undefined {
  const total = entries.reduce((a, e) => a + e.weight, 0);
  if (total <= 0) return undefined;
  let roll = rng.float(0, total);
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.id;
  }
  return entries[entries.length - 1]?.id;
}

/**
 * The genres a market commissions next.
 *
 * The lead is drawn against heat, the country's nature and the novelty
 * penalty; the second is drawn from what conventionally pairs with it, under
 * the same penalty. A combination this market has used inside the repeat
 * window is thrown away and redrawn, so the same two genres cannot come round
 * again until fourteen other things have been made.
 */
export function pickGenres(sim: Simulation, countryId: string, rng: Rng, format: Project['format']): string[] {
  const mood = marketMood(sim, countryId);
  const profile = profileOf(countryId);
  const window = mood.recent.slice(-REPEAT_WINDOW);
  const candidates = GENRES_FULL
    .map((g) => ({ id: g.id, weight: weightOf(mood, profile, g.id, format) }))
    .filter((e) => e.weight > 0);
  if (candidates.length === 0) return ['drama'];

  for (let attempt = 0; attempt < 40; attempt++) {
    const lead = weightedPick(rng, candidates);
    if (!lead) break;
    const pairs = suggestedPairings([lead])
      .map((g) => ({ id: g.id, weight: weightOf(mood, profile, g.id, format) }))
      .filter((e) => e.weight > 0);
    const second = pairs.length > 0 && rng.chance(0.62) ? weightedPick(rng, pairs) : undefined;
    const chosen = second ? [lead, second] : [lead];
    if (!window.includes(comboKey(chosen))) return chosen;
  }
  // Forty draws all landed inside the window, which means the window is most
  // of what this market can make. Take the least recently used thing instead.
  const leastRecent = candidates
    .map((e) => ({ ...e, last: mood.recentGenres.lastIndexOf(e.id) }))
    .sort((a, b) => a.last - b.last || b.weight - a.weight)[0];
  return [leastRecent?.id ?? 'drama'];
}

function remember(mood: MarketMood, genres: readonly string[]): void {
  mood.recent.push(comboKey(genres));
  if (mood.recent.length > MEMORY) mood.recent.splice(0, mood.recent.length - MEMORY);
  for (const g of genres) mood.recentGenres.unshift(g);
  if (mood.recentGenres.length > MEMORY) mood.recentGenres.length = MEMORY;
  mood.commissioned++;
}

// ---------------------------------------------------------------------------
// Commissioning
// ---------------------------------------------------------------------------

/**
 * What shape the thing takes, from what this country actually makes. Animation
 * is a way of making a feature rather than a format of its own here, so its
 * share sits with features.
 *
 * `castable` drops documentary, which is the one format that has no parts to
 * put out: a production that is required to cast has to be one that can.
 */
function pickFormat(profile: MarketProfile | undefined, rng: Rng, castable = false): Project['format'] {
  const formats = profile?.formats ?? {};
  const entries: { id: string; weight: number }[] = [
    { id: 'feature', weight: (formats.feature ?? 0.6) + (formats.animated ?? 0) + 0.1 },
    { id: 'series', weight: (formats.series ?? 0.12) + 0.04 },
    { id: 'limited_series', weight: (formats.limited_series ?? 0.03) + 0.02 },
    { id: 'documentary', weight: castable ? 0 : (formats.documentary ?? 0.04) + 0.02 },
    { id: 'tv_movie', weight: (formats.tv_movie ?? 0.02) + 0.01 },
    { id: 'short', weight: (formats.short ?? 0.004) + 0.004 },
  ].filter((e) => e.weight > 0);
  return (weightedPick(rng, entries) ?? 'feature') as Project['format'];
}

function budgetFor(profile: MarketProfile | undefined, genres: readonly string[], format: Project['format'], rng: Rng): Money {
  // The country's median in dollars is the anchor; the genre moves it.
  const median = (profile?.budgetMedian ?? 6_000_000) * 100;
  const index = Math.max(...genres.map((g) => genre(g)?.budgetIndex ?? 0.8));
  const scale = format === 'series' ? 0.7 : format === 'limited_series' ? 0.6 : format === 'documentary' ? 0.12 : 1;
  const lognormal = Math.exp(rng.normal(0, 0.72));
  return Math.round(clamp(median * index * scale * lognormal, 150_000_00, 400_000_000_00) / 50_000_00) * 50_000_00;
}

/**
 * The world makes something. It is a production with a studio or a network
 * behind it, a certificate and a runtime, and it goes and gets released.
 *
 * If it shoots where the player is, it puts its parts out to be cast — that is
 * the only place casting breakdowns come from now. `openCasting` forces or
 * forbids that; left alone, distance and a coin decide it.
 */
export function commissionProject(
  sim: Simulation,
  countryId: string,
  seed: string | number,
  openCasting?: boolean,
): Project | undefined {
  const rng = sim.rng('commission', countryId, seed);
  const profile = profileOf(countryId);
  const format = pickFormat(profile, rng, openCasting === true);
  const genres = pickGenres(sim, countryId, rng, format);

  const made = sim.execute<{ projectId: Id }>({
    kind: 'film.create_project',
    payload: {
      format, genres,
      logline: `A ${COUNTRIES.get(countryId)?.name ?? 'local'} production.`,
      targetAudience: 'General audience',
    },
  });
  if (!made.ok || !made.value) return undefined;
  const project = sim.universe.projects[made.value.projectId];
  if (!project) return undefined;

  project.worldCommissioned = true;
  project.productionCountryId = countryId;
  project.language = primaryLanguageOf(countryId);
  project.scriptQuality = clamp(Math.round(rng.normal(60, 13)), 20, 95);
  project.budget = budgetFor(profile, genres, format, rng);
  const ladder = ratingsFor(countryId, format === 'series' || format === 'limited_series' || format === 'tv_movie');
  const severity = clamp(Math.round(rng.normal(genres.some((g) => ['horror', 'crime', 'thriller', 'war', 'gangster', 'slasher'].includes(g)) ? 62 : 38, 18)), 0, 95);
  const system = ladder[0]?.system;
  project.contentRating = system ? suggestRating(system, severity).id : undefined;
  project.contentSeverity = severity;

  const television = format === 'series' || format === 'limited_series' || format === 'tv_movie';
  const studio = studioForBackgroundProject(sim.rng('world_studio', String(seed), countryId), project, sim);
  if (studio) {
    project.studioId = studio.id;
    project.distributorName = studio.name;
  }
  if (television) {
    const network = networkForBackgroundProject(sim.rng('world_network', String(seed), countryId), project);
    if (network) {
      project.networkId = network.id;
      project.distributorName = network.name;
    }
  }
  project.greenlitAt = sim.now;
  project.phase = 'preproduction';
  project.phaseHistory.push({ phase: 'preproduction', enteredAt: sim.now });

  remember(marketMood(sim, countryId), genres);
  for (const wave of activeWaves(sim, countryId)) {
    if (genres.includes(wave.genreId)) wave.titles++;
  }

  sim.schedule({
    at: addDays(sim.now, rng.int(60, 150), sim.homeZone),
    kind: 'world.project_progress',
    label: `${titleCaseLabel(project.title)} — Production Start`,
    category: 'system',
    payload: { projectId: project.id },
    priority: 92,
    refType: 'project', refId: project.id,
  });
  // What it is about. The premise is built from the genre's own material and
  // assembled by the same grammar the player's logline builder uses, so a
  // world production reads like something somebody wrote rather than a label.
  const alreadyMade = new Set(Object.values(sim.universe.projects).map((p) => p.logline));
  const premise = buildPremise(genres, rng, (line) => alreadyMade.has(line));
  if (premise) {
    project.logline = premise.logline;
    project.synopsis = premise.logline;
  }

  // Where it shoots. Only a production in reach of the player casts in the
  // open, because a breakdown in a city they have never been to is not
  // something their character could know about.
  const player = sim.universe.people[sim.universe.playerId];
  const nearby = player && countryOfCity(player.currentLocationId) === countryId;
  if (nearby && player) project.productionLocationIds = [player.currentLocationId];
  // Who is making it. The director is the author of record, so the project
  // belongs to them rather than to a person-shaped identifier.
  attachWorldCrew(sim, project, countryId, sim.rng('world_crew', project.id));
  project.createdById = project.directorId ?? sim.nextId('person');

  if (openCasting ?? (nearby && rng.chance(OPEN_CASTING_SHARE))) {
    openWorldCasting(sim, project, sim.rng('world_cast', project.id));
  }

  sim.emit('world.commissioned', { projectId: project.id, countryId, genres, format });
  return project;
}

// ---------------------------------------------------------------------------
// The cycle
// ---------------------------------------------------------------------------

const WAVE_SHAPES = [
  (place: string, g: string) => `The ${place} ${g} Wave`,
  (place: string, g: string) => `The New ${place} ${g}`,
  (place: string, g: string) => `${place}'s ${g} Boom`,
  (place: string, g: string) => `The ${g} Turn In ${place}`,
  (place: string, g: string) => `A ${place} ${g} Moment`,
  (place: string, g: string) => `The ${g} Years In ${place}`,
  (place: string, g: string) => `${place} Goes ${g}`,
  (place: string, g: string) => `The Second Coming Of ${place} ${g}`,
  (place: string, g: string) => `${g} And The ${place} Slate`,
  (place: string, g: string) => `The ${place} ${g} Cycle`,
];

/** '2nd', '3rd', '11th' — a wave named after the ones before it. */
function ordinalWave(n: number): string {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

/**
 * What a movement gets called.
 *
 * Checked against every wave the save has ever named, so a country that goes
 * through the same genre four times gets four different names for it rather
 * than the same one back. The ordinal form is the fallback, and it is the one
 * the trades actually use for a repeat.
 */
function waveName(sim: Simulation, countryId: string, genreId: string, rng: Rng): string {
  const place = COUNTRIES.get(countryId)?.name ?? 'World';
  const g = genreName(genreId);
  const used = new Set(store(sim).history.map((w) => w.name));
  const history = store(sim).history.filter((w) => w.countryId === countryId && w.genreId === genreId).length;

  if (history === 0) {
    for (let attempt = 0; attempt < 40; attempt++) {
      const shape = WAVE_SHAPES[rng.int(0, WAVE_SHAPES.length - 1)]!;
      const candidate = shape(place, g);
      if (!used.has(candidate)) return candidate;
    }
  }
  // A repeat is named for being one, and the number makes it unique by itself.
  const nth = ordinalWave(Math.max(2, history + 1));
  const candidate = `The ${nth} ${place} ${g} Wave`;
  if (!used.has(candidate)) return candidate;
  for (let n = history + 2; n < history + 40; n++) {
    const next = `The ${ordinalWave(n)} ${place} ${g} Wave`;
    if (!used.has(next)) return next;
  }
  return `${place} ${g}, ${zonedParts(sim.now, sim.homeZone).year}`;
}

/** Heat moves once a month: hits warm a genre, saturation cools it, and everything settles toward the country's own nature. */
function tick(sim: Simulation): void {
  const z = store(sim);
  const rng = sim.rng('zeitgeist', zonedParts(sim.now, sim.homeZone).year, zonedParts(sim.now, sim.homeZone).month);

  for (const mood of Object.values(z.markets)) {
    const profile = profileOf(mood.countryId);
    // How much of what this market just made was each genre.
    const saturation = new Map<string, number>();
    for (const g of mood.recentGenres.slice(0, 12)) saturation.set(g, (saturation.get(g) ?? 0) + 1);

    for (const g of GENRES_FULL) {
      const baseline = baselineHeat(profile, g.id, mood.countryId);
      const current = mood.heat[g.id] ?? baseline;
      const settle = (baseline - current) * 0.1;
      const crowded = (saturation.get(g.id) ?? 0) * -3.2;
      const drift = rng.normal(0, 2.6);
      mood.heat[g.id] = clamp(current + settle + crowded + drift, 5, 100);
    }

    // A genre far enough ahead of itself becomes a movement with a name.
    for (const g of GENRES_FULL) {
      const heat = mood.heat[g.id] ?? 0;
      const running = mood.waves.find((w) => w.genreId === g.id && !w.endedAt);
      if (!running && heat >= WAVE_START && rng.chance(0.6)) {
        const wave: Wave = {
          id: sim.nextId('wave'), countryId: mood.countryId, genreId: g.id,
          name: waveName(sim, mood.countryId, g.id, rng), startedAt: sim.now, peak: Math.round(heat), titles: 0,
        };
        mood.waves.push(wave);
        z.history.push(wave);
        recordTrade(sim, {
          kind: 'slate', headline: `${wave.name} is under way`,
          detail: `${genreName(g.id)} is what ${COUNTRIES.get(mood.countryId)?.name ?? mood.countryId} is buying. Everybody has one in development.`,
        });
      } else if (running) {
        running.peak = Math.max(running.peak, Math.round(heat));
        if (heat <= WAVE_END) {
          running.endedAt = sim.now;
          const twin = z.history.find((w) => w.id === running.id);
          if (twin) { twin.endedAt = sim.now; twin.peak = running.peak; twin.titles = running.titles; }
          recordTrade(sim, {
            kind: 'slate', headline: `${running.name} is over`,
            detail: `${running.titles} title${running.titles === 1 ? '' : 's'} went out under it. The money has moved on.`,
          });
        }
      }
    }
    mood.waves = mood.waves.filter((w) => !w.endedAt || sim.now - w.endedAt < 400 * MS_DAY);
  }

  z.lastTick = sim.now;
  const next = (() => {
    const p = zonedParts(sim.now, sim.homeZone);
    const month = p.month === 12 ? 1 : p.month + 1;
    const year = p.month === 12 ? p.year + 1 : p.year;
    return instantFromZoned({ year, month, day: 2, hour: 6 }, sim.homeZone);
  })();
  sim.schedule({ at: next, kind: 'zeit.tick', label: 'What The Industry Wants', category: 'system', priority: 89 });
}

/** The world commissions a week's worth of films and television, spread across the markets that make them. */
function commissionWeek(sim: Simulation): void {
  const z = sim.homeZone;
  const rng = sim.rng('commission_week', Math.floor(sim.now / (7 * MS_DAY)));
  const home = countryOfCity(sim.universe.people[sim.universe.playerId]?.currentLocationId) ?? 'us';

  for (const { countryId, profile } of marketsInPlay()) {
    // What this country really makes in a year, scaled to what a save can hold,
    // with the player's own market always represented.
    const yearly = profile.perYear * COMMISSION_RATE * (countryId === home ? 1.6 : 1);
    const weekly = yearly / 52;
    const count = Math.floor(weekly) + (rng.next() < weekly % 1 ? 1 : 0);
    for (let i = 0; i < count; i++) commissionProject(sim, countryId, `${Math.floor(sim.now / MS_DAY)}-${i}`);
  }

  trimLibrary(sim);
  sim.schedule({ at: addDays(sim.now, 7, z), kind: 'zeit.commission', label: 'What The World Is Making', category: 'system', priority: 88 });
}

/**
 * The world's finished productions are let go once there are enough of them.
 * Anything the player touched, anything on the record, and anything still
 * running stays; the rest is the industry's back catalogue and does not need
 * to be carried forever.
 */
function trimLibrary(sim: Simulation): void {
  const universe = sim.universe;
  const spent = Object.values(universe.projects).filter((p) => p.worldCommissioned
    && (p.phase === 'library' || p.phase === 'shelved')
    && !p.catalogueQid
    && !isPlayersProject(sim, p));
  if (spent.length <= LIBRARY_CAP) return;

  const touched = new Set<Id>();
  for (const person of [sim.universe.people[sim.universe.playerId]].filter(Boolean)) {
    for (const id of person!.creditIds ?? []) touched.add(id);
  }
  for (const contract of Object.values(universe.contracts)) if (contract.projectId) touched.add(contract.projectId);
  for (const audition of Object.values(universe.auditions)) {
    const role = universe.roles[audition.roleId];
    if (role?.projectId) touched.add(role.projectId);
  }
  for (const nomination of Object.values(universe.awardNominations)) if (nomination.projectId) touched.add(nomination.projectId);
  for (const record of Object.values(universe.saveRecords ?? {}).flat()) if (record.projectId) touched.add(record.projectId);

  const droppable = spent
    .filter((p) => !touched.has(p.id))
    .sort((a, b) => (a.releaseDate ?? a.createdAt) - (b.releaseDate ?? b.createdAt));
  const toDrop = droppable.slice(0, Math.max(0, spent.length - LIBRARY_CAP));
  for (const project of toDrop) {
    for (const release of Object.values(universe.releases)) if (release.projectId === project.id) delete universe.releases[release.id];
    for (const campaign of Object.values(universe.marketingCampaigns)) if (campaign.projectId === project.id) delete universe.marketingCampaigns[campaign.id];
    for (const review of Object.values(universe.reviews)) if (review.projectId === project.id) delete universe.reviews[review.id];
    delete universe.projects[project.id];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function ensureZeitgeist(sim: Simulation): void {
  const pending = (kind: string) => sim.universe.scheduled.some((s) => s.kind === kind && s.status === 'pending');
  if (!pending('zeit.tick')) sim.schedule({ at: addDays(sim.now, 3, sim.homeZone), kind: 'zeit.tick', label: 'What The Industry Wants', category: 'system', priority: 89 });
  if (!pending('zeit.commission')) sim.schedule({ at: addDays(sim.now, 4, sim.homeZone), kind: 'zeit.commission', label: 'What The World Is Making', category: 'system', priority: 88 });
}

export function registerZeitgeist(sim: Simulation): void {
  sim.onSchedule('zeit.tick', () => tick(sim));
  sim.onSchedule('zeit.commission', () => commissionWeek(sim));

  // A result moves the heat where it happened. A hit is imitated; a flop is a
  // warning, and both are how a cycle turns.
  sim.onEvent('project.results_final', 'zeitgeist.heat', (event: WorldEvent) => {
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    const project = sim.universe.projects[String(payload.projectId)];
    if (!project) return;
    const countryId = project.productionCountryId ?? 'us';
    const mood = marketMood(sim, countryId);
    const cost = project.totalCost || project.budget;
    if (cost <= 0) return;
    const multiple = Number(payload.worldGross ?? project.totalRevenue) / cost;
    // Two and a half times cost is the line the business calls a hit.
    const move = clamp(remap(multiple, 0.6, 3.2, -7, 12), -7, 12);
    for (const g of project.genres.map(canonicalGenre)) {
      mood.heat[g] = clamp((mood.heat[g] ?? 30) + move, 5, 100);
    }
    if (move >= 9 && isPlayersProject(sim, project)) {
      recordTrade(sim, {
        kind: 'slate', headline: `Everyone wants ${project.genres.map(genreName).join(' and ')} after ${project.title}`,
        detail: `${formatMoneyCompact(Number(payload.worldGross ?? 0))} on a ${formatMoneyCompact(project.budget)} budget. Development slates are being rewritten this week.`,
        studioId: project.studioId, projectId: project.id,
      });
      if (project.studioId && STUDIOS.get(project.studioId)) {
        recordNews(sim, 'studio', project.studioId, { kind: 'slate', title: 'Chasing It', detail: `${project.title} has moved what this studio is looking for.`, projectId: project.id });
      }
    }
  });
}

/** What a market is doing, for the screen. */
export function marketReport(sim: Simulation, countryId: string) {
  const mood = marketMood(sim, countryId);
  const profile = profileOf(countryId);
  return {
    countryId,
    name: COUNTRIES.get(countryId)?.name ?? countryId,
    profile,
    commissioned: mood.commissioned,
    rising: risingIn(sim, countryId, 6),
    waves: mood.waves.filter((w) => !w.endedAt),
    pastWaves: store(sim).history.filter((w) => w.countryId === countryId && w.endedAt).slice(-6).reverse(),
    /** How many distinct genre combinations this market has used lately. */
    variety: new Set(mood.recent).size,
    windowSize: Math.min(mood.recent.length, MEMORY),
  };
}

/** Every network and studio that could carry what this market is making, for the screen. */
export function outletsFor(countryId: string): { studios: number; networks: number } {
  return {
    studios: STUDIOS.all().filter((s) => s.countryId === countryId).length,
    networks: NETWORKS.all().filter((n) => n.countryId === countryId).length,
  };
}

/** Whether the world's own films are still being commissioned, for a diagnostic. */
export function commissionHealth(sim: Simulation): { markets: number; commissioned: number; waves: number } {
  const z = store(sim);
  const markets = Object.values(z.markets);
  return {
    markets: markets.length,
    commissioned: markets.reduce((a, m) => a + m.commissioned, 0),
    waves: markets.reduce((a, m) => a + m.waves.filter((w) => !w.endedAt).length, 0),
  };
}

/** Kept so effectiveStudio stays reachable from here for the studio weighting. */
void effectiveStudio;
