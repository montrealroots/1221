/**
 * SLATE — reception, the way it is actually counted.
 *
 * Reviews land in waves. The trades and the festival regulars write from the
 * premiere. The embargo lifts when the distributor says it does, which is
 * itself a signal: a confident studio lifts it a week out, a nervous one on
 * opening morning. Most reviews land on release, stragglers over the week
 * after, and the count keeps growing while the score settles. Audiences
 * arrive afterwards: CinemaScore polls the opening night of a wide release,
 * the audience score fills as people rate it, and the IMDb rating needs a
 * body of votes before it means anything.
 *
 * Every named review is from a real outlet writing in its own scale, with
 * its own taste, and no verdict is attributed to a named person. The
 * critics beyond the named outlets are counted, not named. A number that has
 * not been counted yet is absent, never guessed.
 */

import { buildFactors } from '../core/audit';
import { titleCaseLabel } from '../core/text';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, Project, Reception, Release, Review } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, formatDate, MS_DAY } from '../core/time';
import { AGGREGATOR_RULES, OUTLETS, cinemaScoreGrade, isFresh, metacriticBand, reviewTargets, scaleText, type Outlet } from '../content/critics';
import { computeFinalQuality } from './film';

type Rng = ReturnType<Simulation['rng']>;
type Wave = 'festival' | 'embargo' | 'release' | 'late' | 'cinemascore' | 'audience' | 'imdb';

const isTelevision = (p: Project) => p.format === 'series' || p.format === 'limited_series';

export function emptyReception(now: number): Reception {
  return { reviewCount: 0, freshCount: 0, topCriticCount: 0, topCriticFresh: 0, certifiedFresh: false, metacriticCount: 0, metacriticWeight: 0, mustSee: false, audienceCount: 0, imdbVotes: 0, waves: [], updatedAt: now };
}

function receptionOf(sim: Simulation, project: Project): Reception {
  if (!project.reception) project.reception = emptyReception(sim.now);
  return project.reception;
}

// ---------------------------------------------------------------------------
// What a film gives critics to work with
// ---------------------------------------------------------------------------

export interface Reads {
  quality: number;
  /** 50 is neutral: how much the film reads as craft and ambition. */
  prestige: number;
  /** 50 is neutral: how much it reads as a crowd-pleaser. */
  crowd: number;
  /** Positive when the campaign promised more than the film delivers. */
  expectationGap: number;
  /** Franchise fatigue, in points off. */
  fatigue: number;
  premiered: boolean;
  /** The director's standing, 0-100, or 50 when unknown. */
  standing: number;
}

const PRESTIGE_LEAN: Readonly<Record<string, number>> = { drama: 8, biography: 6, documentary: 8, experimental: 12, war: 4, romance: 1, mystery: 1, action: -6, comedy: -3, horror: -2, family: -6, adventure: -4, animation: -1, sport: -1 };
const CROWD_LEAN: Readonly<Record<string, number>> = { action: 8, comedy: 6, horror: 6, family: 8, adventure: 6, animation: 6, 'science fiction': 4, fantasy: 4, thriller: 3, musical: 2, documentary: -10, experimental: -14, drama: -4, biography: -3, war: -2 };

export function readsOf(sim: Simulation, project: Project): Reads {
  const quality = project.finalQuality ?? computeFinalQuality(sim, project);
  const lean = (table: Readonly<Record<string, number>>) => project.genres.reduce((s, g) => s + (table[g] ?? 0), 0) / Math.max(1, project.genres.length);
  const premiered = Object.values(sim.universe.festivalSubmissions).some((s) => s.projectId === project.id && ['selected', 'screened', 'won'].includes(String(s.status)));
  const cast = project.castIds.map((id) => sim.universe.people[id]).filter(Boolean);
  const starPower = cast.length > 0 ? cast.reduce((s, p) => s + (p?.reputation.publicFame ?? 0), 0) / cast.length : 30;
  const director = project.directorId ? sim.universe.people[project.directorId] : undefined;
  const campaign = Object.values(sim.universe.marketingCampaigns).find((c) => c.projectId === project.id);
  const franchise = project.franchiseId ? sim.universe.franchises[project.franchiseId] : undefined;
  return {
    quality,
    prestige: clamp(50 + lean(PRESTIGE_LEAN) + (premiered ? 10 : 0) + (quality - 50) * 0.3, 0, 100),
    crowd: clamp(50 + lean(CROWD_LEAN) + (starPower - 40) * 0.15, 0, 100),
    expectationGap: campaign ? clamp((campaign.intent - quality) / 3, -12, 12) : 0,
    fatigue: franchise ? (franchise.fatigue / 100) * 10 : 0,
    premiered,
    standing: director?.reputation.professionalReputation ?? 50,
  };
}

/** One outlet's verdict, 0-100, from its taste and the film. */
export function outletScore(outlet: Outlet, reads: Reads, genres: string[], rng: Rng): number {
  const genreLean = genres.reduce((s, g) => s + (outlet.genreLean[g] ?? outlet.genreLean[g.replace(' ', '_')] ?? 0), 0) / Math.max(1, genres.length);
  const prestigePull = ((outlet.prestigeBias - 50) / 50) * (reads.prestige - 50) * 0.4;
  const crowdPull = ((outlet.populism - 50) / 50) * (reads.crowd - 50) * 0.3;
  const standingPull = ((outlet.prestigeBias - 50) / 50) * (reads.standing - 50) * 0.1;
  const score = reads.quality + prestigePull + crowdPull + standingPull + genreLean + outlet.harshness - reads.expectationGap * 0.5 - reads.fatigue * 0.3 + rng.normal(0, outlet.variance);
  return clamp(Math.round(score), 0, 100);
}

/** The outlets that would review this at all. */
export function eligibleOutlets(project: Project, release: Release | undefined, reads: Reads): Outlet[] {
  const tv = isTelevision(project);
  const strategy = release?.strategy ?? project.releaseStrategy ?? 'limited_theatrical';
  const theaters = release?.theaterCount ?? 0;
  const wide = strategy === 'wide_theatrical' || theaters >= 600;
  const genre = project.genres.some((g) => ['horror', 'science fiction', 'fantasy', 'action', 'animation', 'thriller'].includes(g));
  const prestige = reads.prestige >= 58 || reads.premiered;
  const home = strategy === 'direct_to_video';
  return OUTLETS.all().filter((o) => {
    if (!o.formats.includes(tv ? 'tv' : 'film')) return false;
    if (o.onlyGenres && !project.genres.some((g) => o.onlyGenres!.includes(g))) return false;
    if (o.homeCountries && !o.homeCountries.includes(project.productionCountryId ?? 'us') && !(wide && o.homeCountries.includes('us'))) return false;
    if (o.coverage.includes('everything')) return true;
    if (tv) return o.coverage.includes('television');
    if (o.coverage.includes('wide') && wide) return true;
    if (o.coverage.includes('prestige') && prestige) return true;
    if (o.coverage.includes('genre') && genre) return true;
    if (o.coverage.includes('home') && home) return true;
    return false;
  });
}

// ---------------------------------------------------------------------------
// Counting
// ---------------------------------------------------------------------------

function addReview(sim: Simulation, project: Project, outlet: Outlet, score: number, wave: Review['wave']): Review {
  const reception = receptionOf(sim, project);
  const fresh = isFresh(outlet.scale, score);
  const review: Review = {
    id: sim.nextId('history'), saveId: sim.universe.meta.id, projectId: project.id,
    source: outlet.type === 'trade' ? 'trade' : 'critic', publicationName: outlet.name, criticName: undefined,
    score, quote: reviewQuote(score, project.title, sim.rng('quote', project.id, outlet.id)), at: sim.now,
    influence: outlet.topCritic ? 85 : 55, outletId: outlet.id, scaleText: scaleText(outlet.scale, score),
    verdict: fresh ? 'fresh' : 'rotten', topCritic: outlet.topCritic, wave,
  };
  sim.universe.reviews[review.id] = review;
  reception.reviewCount++;
  if (fresh) reception.freshCount++;
  if (outlet.topCritic) { reception.topCriticCount++; if (fresh) reception.topCriticFresh++; }
  const weight = AGGREGATOR_RULES.metacritic.tierWeights[outlet.metacriticTier];
  if (weight > 0) addMetacritic(reception, score, weight);
  return review;
}

function addMetacritic(reception: Reception, score: number, weight: number): void {
  const total = (reception.metascore ?? 0) * reception.metacriticWeight + score * weight;
  reception.metacriticWeight += weight;
  reception.metacriticCount++;
  reception.metascore = Math.round(total / reception.metacriticWeight);
}

/** The critics beyond the named outlets: counted, never named. */
function addCountedCritics(sim: Simulation, project: Project, count: number, meanScore: number, rng: Rng, metacriticShare: number): void {
  const reception = receptionOf(sim, project);
  for (let i = 0; i < count; i++) {
    const score = clamp(Math.round(meanScore + rng.normal(0, 13)), 0, 100);
    reception.reviewCount++;
    if (score >= AGGREGATOR_RULES.rottenTomatoes.freshAt) reception.freshCount++;
    if (rng.chance(metacriticShare)) addMetacritic(reception, score, AGGREGATOR_RULES.metacritic.tierWeights.standard);
  }
}

function settle(sim: Simulation, project: Project, certified: 'wide' | 'limited' | 'television'): void {
  const reception = receptionOf(sim, project);
  if (reception.reviewCount > 0) reception.tomatometer = Math.round((reception.freshCount / reception.reviewCount) * 100);
  if (reception.topCriticCount > 0) reception.topCriticsScore = Math.round((reception.topCriticFresh / reception.topCriticCount) * 100);
  const rule = AGGREGATOR_RULES.rottenTomatoes.certifiedFresh[certified];
  reception.certifiedFresh = (reception.tomatometer ?? 0) >= rule.score && reception.reviewCount >= rule.reviews && reception.topCriticCount >= rule.topCritics;
  const mc = AGGREGATOR_RULES.metacritic;
  reception.mustSee = (reception.metascore ?? 0) >= mc.mustSee.score && reception.metacriticCount >= mc.mustSee.reviews;
  if (reception.metacriticCount < mc.minimumReviews && reception.metascore !== undefined) {
    // Metacritic shows nothing until it has enough; SLATE keeps the number but the screen says it is early.
  }
  project.criticScore = reception.metascore ?? (reception.tomatometer !== undefined ? Math.round(remap(reception.tomatometer, 0, 100, 25, 90)) : project.criticScore);
  reception.updatedAt = sim.now;
}

/** How many reviews should have landed by the end of a wave, as a share of the target. */
const WAVE_SHARE: Readonly<Record<string, number>> = { festival: 0.06, embargo: 0.55, release: 0.86, late: 1 };

function runReviewWave(sim: Simulation, project: Project, wave: 'festival' | 'embargo' | 'release' | 'late'): void {
  const reception = receptionOf(sim, project);
  if (reception.waves.includes(wave)) return;
  const release = project.releaseId ? sim.universe.releases[project.releaseId] : undefined;
  const reads = readsOf(sim, project);
  const rng = sim.rng('critics', project.id, wave);
  const tv = isTelevision(project);
  const targets = reviewTargets(release?.strategy ?? project.releaseStrategy ?? 'limited_theatrical', release?.theaterCount ?? 0, tv);
  const reviewed = new Set(Object.values(sim.universe.reviews).filter((r) => r.projectId === project.id && r.outletId).map((r) => r.outletId));
  const pool = eligibleOutlets(project, release, reads).filter((o) => !reviewed.has(o.id));

  // Who writes now: the timing they keep, and a little of everyone who runs late.
  const now = pool.filter((o) => {
    if (wave === 'festival') return o.timing === 'festival';
    if (wave === 'embargo') return o.timing === 'festival' || o.timing === 'embargo' || (o.timing === 'release' && rng.chance(0.3));
    if (wave === 'release') return o.timing !== 'late' || rng.chance(0.5);
    return true;
  });
  const scores: number[] = [];
  for (const outlet of now) scores.push(addReview(sim, project, outlet, outletScore(outlet, reads, project.genres, rng), wave).score);

  // The counted critics beyond the named ones follow the named ones' lead.
  const namedMean = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : reads.quality;
  const due = Math.round(targets.total * (WAVE_SHARE[wave] ?? 1));
  const missing = Math.max(0, due - reception.reviewCount);
  const drift = wave === 'late' ? -2 : 0;
  addCountedCritics(sim, project, missing, namedMean + drift, rng, targets.metacritic / Math.max(1, targets.total));

  reception.waves.push(wave);
  settle(sim, project, targets.certified);

  if (wave === 'festival') {
    sim.notify({ category: 'release', title: `First Reviews For ${project.title}`, body: `${reception.reviewCount} reviews out of the premiere. ${reception.tomatometer}% positive so far.`, importance: 60, route: '/workspace/projects' });
  } else if (wave === 'embargo') {
    sim.notify({ category: 'release', title: `Reviews Are In For ${project.title}`, body: receptionLine(reception), importance: 70, route: '/workspace/projects' });
  } else if (wave === 'release') {
    explainReception(sim, project, reads, reception);
    if (reception.certifiedFresh) sim.notify({ category: 'release', title: `${project.title} Is Certified Fresh`, body: `${reception.tomatometer}% on ${reception.reviewCount} reviews, ${reception.topCriticCount} of them Top Critics.`, importance: 62, route: '/workspace/projects' });
    if (reception.mustSee) sim.notify({ category: 'release', title: `${project.title} Is A Metacritic Must-See`, body: `Metascore ${reception.metascore} from ${reception.metacriticCount} critics.`, importance: 62, route: '/workspace/projects' });
  }
  sim.emit('crit.wave', { projectId: project.id, wave, tomatometer: reception.tomatometer, metascore: reception.metascore, reviewCount: reception.reviewCount });
  if (wave === 'embargo' || wave === 'release') {
    sim.emit('rel.reviews_published', { projectId: project.id, criticScore: project.criticScore, audienceScore: project.audienceScore });
  }
}

export function receptionLine(r: Reception): string {
  const parts: string[] = [];
  if (r.tomatometer !== undefined) parts.push(`${r.tomatometer}% On ${r.reviewCount} Reviews${r.certifiedFresh ? ', Certified Fresh' : r.tomatometer >= AGGREGATOR_RULES.rottenTomatoes.freshAt ? ', Fresh' : ', Rotten'}`);
  if (r.metascore !== undefined && r.metacriticCount >= AGGREGATOR_RULES.metacritic.minimumReviews) parts.push(`Metascore ${r.metascore}${r.mustSee ? ', Must-See' : ''}`);
  if (r.cinemaScore) parts.push(`CinemaScore ${r.cinemaScore}`);
  if (r.audienceScore !== undefined) parts.push(`Audience ${r.audienceScore}%`);
  if (r.imdbRating !== undefined) parts.push(`IMDb ${r.imdbRating.toFixed(1)}`);
  return parts.join(' · ') || 'Nothing Counted Yet';
}

function explainReception(sim: Simulation, project: Project, reads: Reads, reception: Reception): void {
  const { factors, score } = buildFactors([
    { label: 'The Finished Film', detail: `Assembled quality is ${Math.round(reads.quality)} out of 100. Everything else moves the number a few points either way.`, weight: 0.6, value: reads.quality / 100 },
    { label: 'The Prestige Read', detail: reads.prestige >= 58 ? `It reads as serious work${reads.premiered ? ', and it premiered at a festival' : ''}. The prestige desks are warmer to that.` : reads.prestige <= 42 ? 'It reads as entertainment first. The prestige desks mark that down; the populist ones do not.' : 'Neither prestige nor popcorn, which nobody marks up.', weight: 0.12, value: reads.prestige / 100 },
    { label: 'The Crowd Read', detail: reads.crowd >= 58 ? 'A crowd-pleaser, which the mainstream desks reward and the art desks resent.' : 'Not built for the multiplex, which the mainstream desks notice.', weight: 0.1, value: reads.crowd / 100 },
    { label: 'The Campaign\'s Promise', detail: reads.expectationGap > 4 ? 'The campaign promised more than the film delivers, and critics review the gap.' : reads.expectationGap < -4 ? 'It plays better than the campaign suggested.' : 'The campaign set expectations the film meets.', weight: -0.1, value: remap(reads.expectationGap, -12, 12, 0, 1) },
    { label: 'Franchise Fatigue', detail: reads.fatigue > 2 ? `Another entry in a tiring franchise costs it about ${Math.round(reads.fatigue)} points.` : 'No franchise fatigue to pay for.', weight: -0.06, value: reads.fatigue / 10 },
    { label: 'Who Was Assigned It', detail: 'Which critic each desk sent, which nobody controls.', weight: 0.08, value: 0.5, knowable: false },
  ]);
  sim.audit({
    kind: 'crit.reception', subjectType: 'project', subjectId: project.id,
    question: `Why is ${project.title} at ${reception.tomatometer}% and a Metascore of ${reception.metascore}?`,
    summary: receptionLine(reception),
    factors, score, seed: `critics|${project.id}`, outcome: `${reception.tomatometer}% on ${reception.reviewCount}, Metascore ${reception.metascore}`,
  });
}

// ---------------------------------------------------------------------------
// Audiences
// ---------------------------------------------------------------------------

function audienceRead(reads: Reads, rng: Rng): number {
  // Audiences score against what they were promised and what they came for.
  return clamp(reads.quality + (reads.crowd - 50) * 0.35 - reads.expectationGap - reads.fatigue * 0.5 + rng.normal(0, 6), 0, 100);
}

function runCinemaScore(sim: Simulation, project: Project): void {
  const reception = receptionOf(sim, project);
  if (reception.waves.includes('cinemascore')) return;
  const release = project.releaseId ? sim.universe.releases[project.releaseId] : undefined;
  if (!release || release.theaterCount < AGGREGATOR_RULES.cinemaScore.minimumTheaters) return;
  const reads = readsOf(sim, project);
  const rng = sim.rng('cinemascore', project.id);
  // Opening-night crowds are the people who wanted to be there, so the poll runs warm.
  const read = audienceRead(reads, rng) + 8;
  reception.cinemaScore = cinemaScoreGrade(read);
  reception.waves.push('cinemascore');
  reception.updatedAt = sim.now;
  sim.audit({
    kind: 'crit.cinemascore', subjectType: 'project', subjectId: project.id,
    question: `Why did opening-night audiences grade ${project.title} ${reception.cinemaScore}?`,
    summary: `CinemaScore ${reception.cinemaScore} from opening-night audiences in ${release.theaterCount.toLocaleString('en-US')} theatres.`,
    factors: buildFactors([
      { label: 'The Film', detail: `Quality ${Math.round(reads.quality)}.`, weight: 0.5, value: reads.quality / 100 },
      { label: 'The Crowd It Drew', detail: 'Opening night is the people who wanted to be there. The poll runs warmer than the eventual audience score.', weight: 0.2, value: 0.7 },
      { label: 'What They Were Promised', detail: reads.expectationGap > 4 ? 'The campaign oversold it, and they grade the gap.' : 'The campaign set expectations the film meets.', weight: -0.2, value: remap(reads.expectationGap, -12, 12, 0, 1) },
      { label: 'Franchise Fatigue', detail: reads.fatigue > 2 ? 'A tired franchise draws a harder crowd.' : 'None.', weight: -0.1, value: reads.fatigue / 10 },
    ]).factors,
    score: read, outcome: reception.cinemaScore,
  });
  sim.notify({ category: 'release', title: `Opening-Night Audiences Gave ${project.title} ${reception.cinemaScore}`, body: `CinemaScore ${reception.cinemaScore}. ${reception.cinemaScore.startsWith('A') ? 'Word of mouth will carry it.' : reception.cinemaScore.startsWith('B') ? 'Solid, not electric.' : 'The second weekend will be hard.'}`, importance: 64, route: '/workspace/projects' });
  sim.emit('crit.cinemascore', { projectId: project.id, grade: reception.cinemaScore });
}

/** How many people have seen it so far, roughly: the pool the audience numbers draw from. */
function viewersSoFar(sim: Simulation, project: Project): number {
  const release = project.releaseId ? sim.universe.releases[project.releaseId] : undefined;
  if (!release) return 0;
  const admissions = (release.totalDomestic + release.totalInternational) / 11_50; // cents over an average ticket
  const streams = release.streamingResults?.starts ?? 0;
  return Math.round(admissions + streams);
}

function runAudienceWave(sim: Simulation, project: Project): void {
  const reception = receptionOf(sim, project);
  const reads = readsOf(sim, project);
  const rng = sim.rng('audience', project.id, reception.waves.filter((w) => w === 'audience').length);
  const viewers = viewersSoFar(sim, project);
  const read = audienceRead(reads, rng);
  // The share who rate it well, which is what the audience score is.
  const positiveShare = clamp(remap(read, 30, 85, 0.25, 0.95) + rng.normal(0, 0.03), 0.02, 0.99);
  const ratings = Math.max(60, Math.round(viewers * 0.004));
  reception.audienceScore = Math.round(positiveShare * 100);
  reception.audienceCount = ratings;
  project.audienceScore = reception.audienceScore;
  if (!reception.waves.includes('audience')) reception.waves.push('audience');
  reception.updatedAt = sim.now;
  sim.emit('crit.audience', { projectId: project.id, audienceScore: reception.audienceScore, count: ratings });
}

function runImdbTick(sim: Simulation, project: Project, tick: number): void {
  const reception = receptionOf(sim, project);
  const reads = readsOf(sim, project);
  const rng = sim.rng('imdb', project.id, tick);
  const viewers = viewersSoFar(sim, project);
  // Early voters are the fans; the rating regresses toward the film as the crowd widens.
  const settled = clamp(remap(reads.quality + (reads.crowd - 50) * 0.2 - reads.fatigue * 0.4, 20, 95, 4.2, 8.6), 1, 10);
  const early = clamp(settled + 0.9, 1, 10);
  const votes = Math.max(reception.imdbVotes, Math.round(viewers * 0.012 * (1 - Math.pow(0.6, tick + 1))) + rng.int(40, 300));
  const blend = clamp(votes / 4000, 0, 1);
  reception.imdbRating = Math.round((early * (1 - blend) + settled * blend + rng.normal(0, 0.08)) * 10) / 10;
  reception.imdbVotes = votes;
  if (!reception.waves.includes('imdb')) reception.waves.push('imdb');
  reception.updatedAt = sim.now;
}

// ---------------------------------------------------------------------------
// Scheduling: the embargo and the waves
// ---------------------------------------------------------------------------

/** When a distributor would lift the embargo: the more confident, the earlier. */
export function defaultEmbargo(sim: Simulation, project: Project, release: Release): number {
  const quality = project.finalQuality ?? computeFinalQuality(sim, project);
  const rng = sim.rng('embargo', project.id);
  const tv = isTelevision(project);
  const daysBefore = tv
    ? (quality >= 65 ? rng.int(2, 4) : 1)
    : quality >= 72 ? rng.int(7, 10) : quality >= 60 ? rng.int(3, 5) : quality >= 50 ? 1 : 0;
  const day = addDays(release.openingDate, -daysBefore, sim.homeZone);
  // Day-of embargoes lift in the morning, the rest at a civilised hour the day they lift.
  return daysBefore === 0 ? day + 9 * 60 * 60 * 1000 : day + 15 * 60 * 60 * 1000;
}

function scheduleWave(sim: Simulation, project: Project, wave: Wave, at: number, tick = 0): void {
  sim.schedule({
    at, kind: 'crit.wave', label: `${titleCaseLabel(project.title)} — ${WAVE_LABEL[wave]}`, category: 'release',
    payload: { projectId: project.id, wave, tick }, priority: 30, refType: 'project', refId: project.id,
  });
}

const WAVE_LABEL: Readonly<Record<Wave, string>> = { festival: 'Festival Reviews', embargo: 'Review Embargo Lifts', release: 'Release Reviews', late: 'Late Reviews', cinemascore: 'CinemaScore', audience: 'Audience Score', imdb: 'IMDb Rating' };

export function scheduleReception(sim: Simulation, project: Project, release: Release): void {
  const reception = receptionOf(sim, project);
  if (!reception.embargoAt || reception.embargoSetBy !== 'player') {
    reception.embargoAt = defaultEmbargo(sim, project, release);
    reception.embargoSetBy = 'distributor';
  }
  sim.universe.scheduled = sim.universe.scheduled.filter((item) => !(item.kind === 'crit.wave' && item.payload.projectId === project.id));
  const open = release.openingDate;
  scheduleWave(sim, project, 'embargo', Math.max(sim.now + 1, reception.embargoAt));
  scheduleWave(sim, project, 'release', open + 6 * 60 * 60 * 1000);
  scheduleWave(sim, project, 'late', addDays(open, 8, sim.homeZone));
  const theatrical = release.theaterCount > 0;
  if (theatrical && release.theaterCount >= AGGREGATOR_RULES.cinemaScore.minimumTheaters) scheduleWave(sim, project, 'cinemascore', addDays(open, 1, sim.homeZone) + 8 * 60 * 60 * 1000);
  scheduleWave(sim, project, 'audience', addDays(open, theatrical ? 3 : 4, sim.homeZone));
  scheduleWave(sim, project, 'audience', addDays(open, 14, sim.homeZone), 1);
  for (const [tick, days] of [[0, 4], [1, 7], [2, 14], [3, 21], [4, 28], [5, 42]] as [number, number][]) scheduleWave(sim, project, 'imdb', addDays(open, days, sim.homeZone), tick);
  reception.updatedAt = sim.now;
}

function runWave(sim: Simulation, projectId: Id, wave: Wave, tick: number): void {
  const project = sim.universe.projects[projectId];
  if (!project) return;
  switch (wave) {
    case 'festival': case 'embargo': case 'release': case 'late': runReviewWave(sim, project, wave); return;
    case 'cinemascore': runCinemaScore(sim, project); return;
    case 'audience': runAudienceWave(sim, project); return;
    case 'imdb': runImdbTick(sim, project, tick); return;
    default:
  }
}

// ---------------------------------------------------------------------------
// The world's own projects: counted the same way, without the paper trail
// ---------------------------------------------------------------------------

/** Reception for a project the world made, from the same reads and rules, with no review records to keep. */
export function quickReception(sim: Simulation, project: Project, rng: Rng): Reception {
  const reads = readsOf(sim, project);
  const tv = isTelevision(project);
  const strategy = project.releaseStrategy ?? 'limited_theatrical';
  const theaters = strategy === 'wide_theatrical' ? 3000 : strategy === 'limited_theatrical' ? 300 : 0;
  const targets = reviewTargets(strategy, theaters, tv);
  const outlets = eligibleOutlets(project, undefined, reads);
  const reception = emptyReception(sim.now);
  let sum = 0;
  for (const outlet of outlets) {
    const score = outletScore(outlet, reads, project.genres, rng);
    sum += score;
    reception.reviewCount++;
    if (isFresh(outlet.scale, score)) reception.freshCount++;
    if (outlet.topCritic) { reception.topCriticCount++; if (isFresh(outlet.scale, score)) reception.topCriticFresh++; }
    const weight = AGGREGATOR_RULES.metacritic.tierWeights[outlet.metacriticTier];
    if (weight > 0) addMetacritic(reception, score, weight);
  }
  const mean = outlets.length > 0 ? sum / outlets.length : reads.quality;
  const extra = Math.max(0, targets.total - reception.reviewCount);
  for (let i = 0; i < extra; i++) {
    const score = clamp(Math.round(mean + rng.normal(0, 13)), 0, 100);
    reception.reviewCount++;
    if (score >= AGGREGATOR_RULES.rottenTomatoes.freshAt) reception.freshCount++;
    if (rng.chance(targets.metacritic / Math.max(1, targets.total))) addMetacritic(reception, score, 1);
  }
  reception.tomatometer = Math.round((reception.freshCount / Math.max(1, reception.reviewCount)) * 100);
  if (reception.topCriticCount > 0) reception.topCriticsScore = Math.round((reception.topCriticFresh / reception.topCriticCount) * 100);
  const rule = AGGREGATOR_RULES.rottenTomatoes.certifiedFresh[targets.certified];
  reception.certifiedFresh = reception.tomatometer >= rule.score && reception.reviewCount >= rule.reviews && reception.topCriticCount >= rule.topCritics;
  reception.mustSee = (reception.metascore ?? 0) >= AGGREGATOR_RULES.metacritic.mustSee.score && reception.metacriticCount >= AGGREGATOR_RULES.metacritic.mustSee.reviews;
  const audience = audienceRead(reads, rng);
  reception.audienceScore = Math.round(clamp(remap(audience, 30, 85, 0.25, 0.95), 0.02, 0.99) * 100);
  reception.audienceCount = rng.int(400, 20_000);
  if (theaters >= AGGREGATOR_RULES.cinemaScore.minimumTheaters) reception.cinemaScore = cinemaScoreGrade(audience + 8);
  reception.imdbRating = Math.round(clamp(remap(reads.quality + (reads.crowd - 50) * 0.2, 20, 95, 4.2, 8.6), 1, 10) * 10) / 10;
  reception.imdbVotes = rng.int(2_000, 120_000);
  reception.waves = ['quick'];
  project.reception = reception;
  project.criticScore = reception.metascore ?? Math.round(remap(reception.tomatometer, 0, 100, 25, 90));
  project.audienceScore = reception.audienceScore;
  return reception;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerCritics(sim: Simulation): void {
  sim.onSchedule('crit.wave', (item) => runWave(sim, item.payload.projectId as Id, item.payload.wave as Wave, Number(item.payload.tick ?? 0)));

  // A release being set is when the distributor decides the embargo.
  sim.onEvent('rel.distribution_set', 'critics.schedule', (event, { sim: s }) => {
    const { projectId, releaseId } = event.payload as { projectId: Id; releaseId: Id };
    const project = s.universe.projects[projectId];
    const release = s.universe.releases[releaseId];
    if (project && release) scheduleReception(s, project, release);
  });

  // The trades write from the premiere.
  sim.onEvent('fest.screened', 'critics.festival', (event, { sim: s }) => {
    const project = s.universe.projects[(event.payload as { projectId: Id }).projectId];
    if (project) runReviewWave(s, project, 'festival');
  });

  // Only whoever controls the release sets its embargo.
  sim.onCommand<{ projectId: Id; at: number }, { embargoAt: number }>(
    'crit.set_embargo',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      const release = project.releaseId ? s.universe.releases[project.releaseId] : undefined;
      if (!release || release.status !== 'planned') throw new CommandError(`${project.title} has no release planned, or is already out.`);
      const company = project.ownerCompanyId ? s.universe.companies[project.ownerCompanyId] : undefined;
      const controls = !project.studioId || (company?.ownerships.some((o) => o.holderId === s.player.id && o.percent >= 50) ?? false);
      if (!controls) throw new CommandError(`${project.distributorName ?? 'The distributor'} sets the embargo on ${project.title}, not you.`);
      const earliest = addDays(release.openingDate, -21, s.homeZone);
      if (p.at < earliest || p.at > release.openingDate) throw new CommandError(`An embargo lifts between three weeks before opening and opening day. ${project.title} opens ${formatDate(release.openingDate, s.homeZone)}.`);
      if (p.at < s.now) throw new CommandError('That moment has passed.');
      const reception = receptionOf(s, project);
      reception.embargoAt = p.at;
      reception.embargoSetBy = 'player';
      scheduleReception(s, project, release);
      s.remember({ category: 'project', title: `Set the review embargo on ${project.title}`, detail: `Lifts ${formatDate(p.at, s.homeZone)}, ${Math.round((release.openingDate - p.at) / MS_DAY)} days before opening.`, refs: [{ type: 'project', id: project.id }], significance: 20, public: false });
      return { embargoAt: p.at };
    },
  );
}

/** The embargo wave, for review dates saved before the critics system existed. */
export function runEmbargoWave(sim: Simulation, projectId: Id): void {
  const project = sim.universe.projects[projectId];
  if (project) runReviewWave(sim, project, 'embargo');
}

/** Everything the screen needs about a project's reception. */
export function receptionSummary(sim: Simulation, projectId: Id) {
  const project = sim.universe.projects[projectId];
  if (!project) return undefined;
  const reception = project.reception;
  const reviews = Object.values(sim.universe.reviews).filter((r) => r.projectId === projectId).sort((a, b) => Number(b.topCritic ?? false) - Number(a.topCritic ?? false) || b.influence - a.influence);
  const band = reception?.metascore !== undefined ? metacriticBand(reception.metascore) : undefined;
  const status = !reception || reception.tomatometer === undefined ? 'Pending' : reception.certifiedFresh ? 'Certified Fresh' : reception.tomatometer >= AGGREGATOR_RULES.rottenTomatoes.freshAt ? 'Fresh' : 'Rotten';
  return { reception, reviews, band, status, line: reception ? receptionLine(reception) : 'Nothing counted yet.' };
}

function reviewQuote(score: number, title: string, rng: Rng): string {
  const band = score >= 88 ? 0 : score >= 74 ? 1 : score >= 60 ? 2 : score >= 45 ? 3 : score >= 28 ? 4 : 5;
  const lines: string[][] = [
    [`The best thing of its kind in years. ${title} is the real article.`, `A film that earns every minute. ${title} will be argued about for a long time.`, `Rare, confident, alive. ${title} does not put a foot wrong.`],
    ['Confident, controlled and genuinely moving in places.', `${title} knows exactly what it is, and is very good at it.`, 'Smart, well made and better than it needed to be.'],
    ['Works more often than it does not, and the cast carries the rest.', `${title} is uneven but likeable, and it lands its ending.`, 'Solid, sometimes more, and never less than watchable.'],
    ['Competent and forgettable. There is a better film buried in here.', `${title} keeps promising a film it never quite becomes.`, 'Handsome, professional, and strangely weightless.'],
    ['Handsomely mounted and completely inert.', `${title} mistakes noise for energy and length for depth.`, 'Nothing here works for long, and it knows it.'],
    ['A misfire from the first frame. Nobody involved is served by it.', `${title} is the kind of failure that takes talent to make.`, 'Dispiriting, and not even interestingly so.'],
  ];
  return rng.pick(lines[band] ?? lines[5] ?? ['']);
}
