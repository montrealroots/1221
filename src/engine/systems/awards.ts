/**
 * SLATE — awards and festivals, the real ones.
 *
 * Every body here is the real one: the Academy Awards on the Academy's own
 * date, the Golden Globes with journalists voting, the Actor Awards with
 * actors voting, the Césars for French films, the Emmys on a June-to-May
 * window. Each body applies its own eligibility (format, release, window,
 * country, language, budget) and contests its own categories, each read for
 * what it judges: a lead actress, a screenplay, the picture, a craft.
 *
 * Nominations and winners come from a vote modelled on each electorate,
 * and every one of the player's results is explained in that body's terms:
 * what the film was, what the critics said, who else was in the year, what
 * the campaign bought, and what stays behind the ballot. Editions are
 * specific and finalised history never changes.
 *
 * Festivals are the real ones too, with their real premiere rules, strands
 * and prizes, and a jury that decides in a room against the rest of the
 * slate.
 */

import { categoryAdmits, performerTitleOf } from '../core/performer';
import { titleCaseLabel } from '../core/text';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { AwardEdition, AwardNomination, FestivalSubmission, Id, Project } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, addYears, ageOn, formatDate, instantFromZoned, parseDateKey, zonedParts, MS_DAY } from '../core/time';
import { applyRate, formatMoney, formatMoneyCompact, type Money } from '../core/money';
import { CITIES, COUNTRIES } from '../content/geography';
import { INDUSTRY_EVENTS, lookupEvent } from '../content/events-data';
import { occurrence, occurrenceTitle, type IndustryEventSpec, type Occurrence } from '../content/events';
import { AWARD_RULES, LEGACY_BODY_NAMES, NOT_CONTESTED } from '../content/award-bodies';
import { classifyCategory, isTelevisionKind, PERSON_KINDS, VOTER_PROFILES, type BodyRules, type CategoryKind, type VoterProfile } from '../content/award-rules';
import { FESTIVAL_RULES, LEGACY_FESTIVAL_NAMES, classifyPrize, type FestivalRules, type PrizeKind } from '../content/festival-rules';

// ---------------------------------------------------------------------------
// The bodies
// ---------------------------------------------------------------------------

export interface AwardBody {
  id: string;
  name: string;
  shortName: string;
  spec: IndustryEventSpec;
  rules: BodyRules;
}

/** The real bodies SLATE contests, in the order the events data lists them. */
export const AWARD_BODIES: readonly AwardBody[] = INDUSTRY_EVENTS
  .filter((e) => e.kind === 'awards' && AWARD_RULES[e.id])
  .map((e) => ({ id: e.id, name: e.name, shortName: e.shortName ?? e.name, spec: e, rules: AWARD_RULES[e.id] as BodyRules }));

export const AWARD_BODY_BY_ID: Readonly<Record<string, AwardBody>> = Object.fromEntries(AWARD_BODIES.map((b) => [b.id, b]));

/** The name of any body a save can refer to, the retired fictional ones included. */
export function bodyName(id: string): string {
  return AWARD_BODY_BY_ID[id]?.name ?? lookupEvent(id)?.name ?? LEGACY_BODY_NAMES[id] ?? id;
}

export function bodyShortName(id: string): string {
  return AWARD_BODY_BY_ID[id]?.shortName ?? lookupEvent(id)?.shortName ?? bodyName(id);
}

/** Why a body on the calendar is not contested, when it is not. */
export function whyNotContested(id: string): string | undefined {
  return NOT_CONTESTED[id];
}

export interface Contest {
  name: string;
  kind: CategoryKind;
}

const contestCache = new Map<string, Contest[]>();

/** The categories of a body the simulation can actually judge. */
export function contestsFor(bodyId: string): Contest[] {
  const cached = contestCache.get(bodyId);
  if (cached) return cached;
  const body = AWARD_BODY_BY_ID[bodyId];
  if (!body) return [];
  const seen = new Set<string>();
  const out: Contest[] = [];
  for (const name of body.spec.categories ?? []) {
    const kind = classifyCategory(name);
    if (!kind || kind === 'honorary' || kind === 'tv_guest' || seen.has(name)) continue;
    seen.add(name);
    out.push({ name, kind });
  }
  contestCache.set(bodyId, out);
  return out;
}

/** Every category the body lists, marked by whether SLATE contests it. */
export function categoriesOf(bodyId: string): { name: string; kind?: CategoryKind; contested: boolean }[] {
  const body = AWARD_BODY_BY_ID[bodyId];
  if (!body) return [];
  const contested = new Set(contestsFor(bodyId).map((c) => c.name));
  return (body.spec.categories ?? []).map((name) => {
    const kind = classifyCategory(name);
    return { name, ...(kind ? { kind } : {}), contested: contested.has(name) };
  });
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerAwards(sim: Simulation): void {
  sim.onSchedule('award.nominations', (item) => announceNominations(sim, item.payload.editionId as Id));
  sim.onSchedule('award.ceremony', (item) => holdCeremony(sim, item.payload.editionId as Id));
  sim.onSchedule('award.season_setup', () => {
    setUpSeason(sim, zonedParts(sim.now, sim.homeZone).year + 1);
    sim.schedule({
      at: addYears(sim.now, 1, sim.homeZone),
      kind: 'award.season_setup',
      label: 'Awards Season',
      category: 'system',
      priority: 80,
    });
  });
  sim.onSchedule('fest.decision', (item) => decideFestivalSubmission(sim, item.payload.submissionId as Id));
  sim.onSchedule('fest.screening', (item) => holdScreening(sim, item.payload.submissionId as Id));

  // --- Campaigning ---------------------------------------------------------

  sim.onCommand<{ projectId: Id; bodyId: string; categories: string[]; spend: Money; accountId?: Id }, { nominationIds: Id[]; spent: Money }>(
    'award.campaign',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      const body = AWARD_BODY_BY_ID[p.bodyId];
      if (!body) {
        const why = NOT_CONTESTED[p.bodyId];
        throw new CommandError(why ? `${bodyName(p.bodyId)} is not contested in SLATE. ${why}` : 'No such awards body.');
      }
      if (!body.rules.campaignable) {
        throw new CommandError(`${body.name} takes no campaigns. ${VOTER_PROFILES[body.rules.voters].responds}`);
      }

      const edition = currentEditionFor(s, p.bodyId);
      if (!edition) throw new CommandError(`There is no upcoming ${body.name} edition to campaign for.`);
      if (edition.finalised) throw new CommandError(`${editionName(edition.editionNumber, body.name)} is already decided. Finalised history does not change.`);

      const eligible = isEligible(s, project, edition);
      if (!eligible.ok) throw new CommandError(eligible.reason);

      const contests = contestsFor(body.id);
      for (const category of p.categories) {
        const contest = contests.find((c) => c.name === category);
        if (!contest) {
          const listed = (body.spec.categories ?? []).includes(category);
          throw new CommandError(listed
            ? `${body.name} lists "${category}", but SLATE does not contest it: it is an honour or something the simulation cannot judge.`
            : `${body.name} does not have a category called "${category}".`);
        }
        const fit = qualifiesForContest(s, project, contest.kind, body, edition, contest.name);
        if (!fit.ok) throw new CommandError(`${project.title} cannot be entered for ${category}: ${fit.reason}`);
      }

      const accountId = p.accountId
        ?? (project.ownerCompanyId ? s.universe.companies[project.ownerCompanyId]?.cashAccountId : undefined)
        ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to fund the campaign from.');
      if (s.ledger.availableFunds(accountId) < p.spend) {
        throw new CommandError(`An awards campaign at ${formatMoney(p.spend)} is more than you can currently fund.`);
      }
      s.expense(accountId, p.spend, `${body.shortName} campaign — ${project.title}`, 'marketing', { refType: 'project', refId: project.id });

      // Spend is split across the categories entered.
      const perCategory = Math.round(p.spend / Math.max(1, p.categories.length));
      const ids: Id[] = [];
      for (const category of p.categories) {
        const contest = contests.find((c) => c.name === category) as Contest;
        const existing = Object.values(s.universe.awardNominations).find(
          (n) => n.editionId === edition.id && n.category === category && n.projectId === project.id,
        );
        if (existing) {
          existing.campaignSpend += perCategory;
          ids.push(existing.id);
          continue;
        }
        // A campaign entry is not a nomination. It is a submission for consideration.
        const entry: AwardNomination = {
          id: s.nextId('nom'),
          saveId: s.universe.meta.id,
          editionId: edition.id,
          bodyId: body.id,
          category,
          kind: contest.kind,
          projectId: project.id,
          personId: pickNomineeFor(s, project, contest.kind),
          announcedAt: 0,
          campaignSpend: perCategory,
        };
        s.universe.awardNominations[entry.id] = entry;
        ids.push(entry.id);
      }

      s.emit('award.campaign_started', { projectId: project.id, bodyId: body.id, editionId: edition.id, spend: p.spend, categories: p.categories });
      return { nominationIds: ids, spent: p.spend };
    },
  );

  // --- Festivals -----------------------------------------------------------

  sim.onCommand<{ projectId: Id; festivalId: string; year?: number; accountId?: Id }, { submissionId: Id; decisionAt: number; fee: Money }>(
    'fest.submit',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      const festival = FESTIVAL_BY_ID[p.festivalId];
      if (!festival) throw new CommandError('No such festival.');
      if (!project.finalQuality) throw new CommandError(`${project.title} is not finished. Festivals need a completed film.`);

      const year = p.year ?? nextFestivalYear(s, festival);
      const occ = occurrence(festival.spec, year, lookupEvent);
      if (!occ) throw new CommandError(`${festival.name} does not have a ${year} edition.`);
      const existing = Object.values(s.universe.festivalSubmissions).find(
        (f) => f.projectId === project.id && f.festivalId === festival.id && f.year === year,
      );
      if (existing) throw new CommandError(`${project.title} is already submitted to that edition.`);

      const fit = festivalAdmits(s, project, festival);
      if (!fit.ok) throw new CommandError(fit.reason);

      const fee = festival.rules.feeCents;
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (fee > 0) {
        if (!accountId || s.ledger.availableFunds(accountId) < fee) {
          throw new CommandError(`The submission fee is ${formatMoney(fee)}.`);
        }
        s.expense(accountId, fee, `${festival.name} submission — ${project.title}`, 'marketing', { refType: 'project', refId: project.id });
      }

      const start = parseDateKey(occ.start, festival.spec.zone, 19);
      const decisionAt = occ.nominations ? parseDateKey(occ.nominations, festival.spec.zone, 10) : addDays(start, -45, s.homeZone);
      if (start < s.now) throw new CommandError(`${festival.name} ${year} has already happened.`);

      const submission: FestivalSubmission = {
        id: s.nextId('nom'),
        saveId: s.universe.meta.id,
        festivalId: festival.id,
        year,
        projectId: project.id,
        submittedAt: s.now,
        fee,
        status: 'under_review',
        awardsWon: [],
        acquisitionOffers: [],
      };
      s.universe.festivalSubmissions[submission.id] = submission;

      s.schedule({
        at: Math.min(Math.max(decisionAt, addDays(s.now, 21, s.homeZone)), addDays(start, -1, s.homeZone)),
        kind: 'fest.decision',
        label: `${titleCaseLabel(festival.name)} Decision — ${project.title}`,
        category: 'career',
        payload: { submissionId: submission.id },
        priority: 44,
        refType: 'project', refId: project.id,
      });

      s.emit('fest.submitted', { submissionId: submission.id, festivalId: festival.id, projectId: project.id, year });
      return { submissionId: submission.id, decisionAt, fee };
    },
  );

  sim.onCommand<{ submissionId: Id; offerIndex: number }, { accepted: boolean; amount: Money }>(
    'fest.accept_acquisition',
    (p, { sim: s }) => {
      const submission = s.universe.festivalSubmissions[p.submissionId];
      if (!submission) throw new CommandError('No such submission.');
      const offer = submission.acquisitionOffers[p.offerIndex];
      if (!offer) throw new CommandError('That offer is not on the table.');
      if (offer.accepted) throw new CommandError('That offer has already been accepted.');

      const project = s.universe.projects[submission.projectId];
      if (!project) throw new CommandError('No such project.');

      offer.accepted = true;
      const payee = project.ownerCompanyId
        ? s.universe.companies[project.ownerCompanyId]?.cashAccountId
        : s.universe.people[project.createdById]?.primaryAccountId;
      if (payee) {
        s.income(payee, offer.amount, `${offer.buyerName} — acquisition of ${project.title}`, 'royalty', { refType: 'project', refId: project.id });
      }
      project.distributorName = offer.buyerName;
      project.totalRevenue += offer.amount;

      s.resolveDecision('festival_submission', submission.id);
      s.remember({
        category: 'project',
        title: `${offer.buyerName} Acquired ${project.title}`,
        detail: `${formatMoneyCompact(offer.amount)} for ${offer.territories.join(', ')} out of ${festivalName(submission.festivalId)}.`,
        refs: [{ type: 'project', id: project.id }],
        significance: 76, public: true, amount: offer.amount,
      });
      s.emit('fest.acquired', { projectId: project.id, buyerName: offer.buyerName, amount: offer.amount });
      return { accepted: true, amount: offer.amount };
    },
  );
}

// ---------------------------------------------------------------------------
// Season setup
// ---------------------------------------------------------------------------

/** The eligibility window a body judges for a ceremony in `year`, in the body's own zone. */
function eligibilityWindow(body: AwardBody, year: number, ceremonyAt: number): { start: number; end: number } {
  const z = body.spec.zone;
  const day = (y: number, m: number, d: number, endOfDay = false) => instantFromZoned({ year: y, month: m, day: d, hour: endOfDay ? 23 : 0, minute: endOfDay ? 59 : 0 }, z);
  switch (body.rules.window) {
    case 'calendar': return { start: day(year - 1, 1, 1), end: day(year - 1, 12, 31, true) };
    case 'emmy': return { start: day(year - 1, 6, 1), end: day(year, 5, 31, true) };
    case 'bafta': return { start: day(year - 1, 1, 1), end: Math.min(day(year, 2, 15, true), ceremonyAt) };
    case 'same_year': return { start: addYears(ceremonyAt, -1, z), end: addDays(ceremonyAt, -1, z) };
  }
}

/** Creates the editions for a ceremony year, on the real dates. Idempotent. */
export function setUpSeason(sim: Simulation, ceremonyYear: number): void {
  for (const body of AWARD_BODIES) {
    const exists = Object.values(sim.universe.awardEditions).some((e) => e.bodyId === body.id && e.year === ceremonyYear);
    if (exists) continue;
    const occ = occurrence(body.spec, ceremonyYear, lookupEvent);
    if (!occ) continue;

    const ceremonyAt = parseDateKey(occ.start, body.spec.zone, 17);
    const nominationsAt = occ.nominations ? parseDateKey(occ.nominations, body.spec.zone, 5, 30) : addDays(ceremonyAt, -38, body.spec.zone);
    const window = eligibilityWindow(body, ceremonyYear, ceremonyAt);

    // A season that was already over when the save began is history, not
    // work. Nothing about who won was simulated, and the game never claims
    // otherwise.
    const concluded = ceremonyAt < sim.now;

    const edition: AwardEdition = {
      id: sim.nextId('award'),
      saveId: sim.universe.meta.id,
      bodyId: body.id,
      editionNumber: occ.edition ?? ceremonyYear,
      year: ceremonyYear,
      ceremonyAt,
      nominationsAnnouncedAt: nominationsAt,
      eligibilityStart: window.start,
      eligibilityEnd: window.end,
      status: concluded ? 'complete' : 'upcoming',
      finalised: concluded,
      ...(concluded ? { predatesSave: true } : {}),
    };
    sim.universe.awardEditions[edition.id] = edition;
    if (concluded) continue;

    // A label is Title Case, whatever the body calls itself in prose.
    const title = titleCaseLabel(occurrenceTitle(occ));
    sim.schedule({
      // Nominations that would land before the save opened are announced now
      // instead. The ceremony is still ahead, so the season can still run.
      at: Math.max(nominationsAt, sim.now),
      kind: 'award.nominations',
      label: body.rules.announcesWinnersDirectly ? `${title} Winners` : `${title} Nominations`,
      category: 'awards',
      payload: { editionId: edition.id },
      priority: 34,
      refType: 'award_edition', refId: edition.id,
    });
    const item = sim.schedule({
      at: ceremonyAt,
      kind: 'award.ceremony',
      label: title,
      category: 'awards',
      payload: { editionId: edition.id },
      priority: 22,
      refType: 'award_edition', refId: edition.id,
      requiresPlayer: false,
      durationMinutes: 240,
      ...(body.spec.cityId ? { locationId: body.spec.cityId } : {}),
    });
    edition.scheduledItemId = item.id;
  }
}

/** This year's and next year's editions exist. Safe to call on every load. */
export function ensureSeasons(sim: Simulation): void {
  const year = zonedParts(sim.now, sim.homeZone).year;
  setUpSeason(sim, year);
  setUpSeason(sim, year + 1);
}

export function currentEditionFor(sim: Simulation, bodyId: string): AwardEdition | undefined {
  return Object.values(sim.universe.awardEditions)
    .filter((e) => e.bodyId === bodyId && !e.finalised && e.ceremonyAt > sim.now)
    .sort((a, b) => a.ceremonyAt - b.ceremonyAt)[0];
}

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

const THEATRICAL = new Set(['wide_theatrical', 'limited_theatrical', 'platform', 'day_and_date']);
const TV_FORMATS = new Set(['series', 'limited_series', 'tv_movie', 'special']);

function isTelevision(project: Project): boolean {
  return TV_FORMATS.has(project.format);
}

function releaseStrategyOf(sim: Simulation, project: Project): string | undefined {
  return project.releaseStrategy ?? (project.releaseId ? sim.universe.releases[project.releaseId]?.strategy : undefined);
}

function episodeCount(project: Project): number {
  return (project.seasons ?? []).reduce((n, s) => n + s.episodeCount, 0);
}

/** The first public showing: a release, or a festival screening. */
function qualifyingDate(sim: Simulation, project: Project, allowFestival: boolean): number | undefined {
  if (project.releaseDate) return project.releaseDate;
  if (!allowFestival) return undefined;
  const screened = Object.values(sim.universe.festivalSubmissions)
    .filter((f) => f.projectId === project.id && f.status === 'screened' && f.screeningAt)
    .map((f) => f.screeningAt as number)
    .sort((a, b) => a - b)[0];
  return screened;
}

function ownerIsStudio(sim: Simulation, project: Project): boolean {
  const company = project.ownerCompanyId ? sim.universe.companies[project.ownerCompanyId] : undefined;
  return company?.kind === 'studio';
}

function countryName(id: string | undefined): string {
  return COUNTRIES.get(id ?? '')?.name ?? (id ?? 'nowhere');
}

/**
 * Whether a body will look at the project at all, and if not, why, in the
 * body's own terms. A project passes when at least one contested category
 * admits it: a French film is eligible at the Oscars for International
 * Feature even though it is not American, and an American film is eligible
 * at the Césars only for the foreign film category.
 */
export function isEligible(sim: Simulation, project: Project, edition: AwardEdition): { ok: true } | { ok: false; reason: string } {
  const body = AWARD_BODY_BY_ID[edition.bodyId];
  if (!body) return { ok: false, reason: `${bodyName(edition.bodyId)} is not contested in SLATE.` };
  const rules = body.rules;
  const title = editionName(edition.editionNumber, body.name);

  if (rules.formats && !rules.formats.includes(project.format as never)) {
    const tvBody = rules.formats.every((f) => TV_FORMATS.has(f));
    const filmBody = rules.formats.every((f) => !TV_FORMATS.has(f));
    return { ok: false, reason: tvBody ? `${body.name} is a television body. ${project.title} is a ${project.format.replace('_', ' ')}.` : filmBody ? `${body.name} is a film body. ${project.title} is television.` : `${body.name} does not judge a ${project.format.replace('_', ' ')}.` };
  }

  const strategy = releaseStrategyOf(sim, project);
  const when = qualifyingDate(sim, project, rules.release === 'festival_or_release');
  if (!when) {
    return { ok: false, reason: rules.release === 'festival_or_release'
      ? `${project.title} has neither been released nor screened at a festival, so it is not eligible for anything yet.`
      : `${project.title} has no release date, so it is not eligible for anything yet.` };
  }
  if (rules.release === 'theatrical' && !(strategy && THEATRICAL.has(strategy))) {
    return { ok: false, reason: `${body.name} requires a qualifying theatrical run. ${project.title} ${strategy ? `went out ${strategy.replace(/_/g, ' ')}` : 'had no theatrical release'}.` };
  }
  if (rules.release === 'television' && !isTelevision(project)) {
    return { ok: false, reason: `${body.name} is a television body. ${project.title} is a ${project.format}.` };
  }
  if (when < edition.eligibilityStart || when > edition.eligibilityEnd) {
    return {
      ok: false,
      reason: `${title} covers work ${rules.release === 'television' ? 'aired' : 'released'} between ${formatDate(edition.eligibilityStart, body.spec.zone)} and ${formatDate(edition.eligibilityEnd, body.spec.zone)}. ${project.title} ${project.releaseDate ? 'opened' : 'first screened'} ${formatDate(when, body.spec.zone)}.`,
    };
  }
  if (rules.maxBudget !== undefined && project.budget > rules.maxBudget) {
    return { ok: false, reason: `${body.name} is for films made for under ${formatMoneyCompact(rules.maxBudget)}. ${project.title} cost ${formatMoneyCompact(project.budget)}.` };
  }
  if (rules.notStudio && ownerIsStudio(sim, project)) {
    return { ok: false, reason: `${body.name} is for independent films. ${project.title} is a studio picture.` };
  }
  if (rules.genres && !project.genres.some((g) => rules.genres?.includes(g))) {
    return { ok: false, reason: `${body.name} honours ${rules.genres.slice(0, 4).join(', ')} and the like. ${project.title} is ${project.genres.join('/')}.` };
  }
  if (rules.animatedOnly && !project.genres.includes('animation')) {
    return { ok: false, reason: `${body.name} is for animation. ${project.title} is live action.` };
  }
  if (rules.documentaryOnly && project.format !== 'documentary' && !project.genres.includes('documentary')) {
    return { ok: false, reason: `${body.name} is for nonfiction. ${project.title} is fiction.` };
  }
  if (rules.window === 'emmy' && project.format === 'series' && episodeCount(project) > 0 && episodeCount(project) < 6) {
    return { ok: false, reason: `${body.name} needs a series to have at least six episodes. ${project.title} has ${episodeCount(project)}.` };
  }

  // Country and language decide which categories admit it, not whether the
  // body will look. A film from elsewhere competes as a foreign film.
  const admitted = contestsFor(body.id).some((c) => qualifiesForContest(sim, project, c.kind, body, edition, c.name).ok);
  if (!admitted) {
    if (rules.countries && !rules.countries.includes(project.productionCountryId ?? 'us')) {
      return { ok: false, reason: `${body.name} is for ${rules.countries.length === 1 ? countryName(rules.countries[0]) : 'its own region\'s'} productions, and it has no foreign film category that ${project.title}, a ${countryName(project.productionCountryId)} production, could enter.` };
    }
    if (rules.languages && !rules.languages.includes(project.language ?? 'en')) {
      return { ok: false, reason: `${body.name} is for ${rules.languages.join('/')}-language films. ${project.title} is in ${project.language ?? 'English'}.` };
    }
    return { ok: false, reason: `None of ${body.name}'s categories admits ${project.title} as it is.` };
  }
  return { ok: true };
}

/** The contests of an edition a project can be entered for. */
export function eligibleContests(sim: Simulation, project: Project, edition: AwardEdition): Contest[] {
  const body = AWARD_BODY_BY_ID[edition.bodyId];
  if (!body || !isEligible(sim, project, edition).ok) return [];
  return contestsFor(body.id).filter((c) => qualifiesForContest(sim, project, c.kind, body, edition, c.name).ok);
}

function isComedy(project: Project): boolean {
  return project.genres.some((g) => ['comedy', 'musical', 'romantic comedy'].includes(g));
}

function sourceIsOriginal(sim: Simulation, project: Project): boolean {
  const rights = project.rightsId ? sim.universe.rights[project.rightsId] : undefined;
  return !rights || rights.sourceKind === 'original';
}

function priorFeaturesBy(sim: Simulation, personId: Id | undefined, before: Project): number {
  if (!personId) return 0;
  return Object.values(sim.universe.projects).filter((p) => p.id !== before.id && p.directorId === personId && p.releaseDate && p.releaseDate < (before.releaseDate ?? Infinity) && !TV_FORMATS.has(p.format)).length;
}

const IBERO_AMERICA = ['es', 'pt', 'mx', 'br', 'ar', 'cl', 'co', 'pe', 've', 'uy', 'py', 'bo', 'ec', 'cu', 'do', 'gt', 'hn', 'sv', 'ni', 'cr', 'pa', 'pr'];
const EUROPE = ['uk', 'ie', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'be', 'lu', 'ch', 'at', 'dk', 'se', 'no', 'fi', 'is', 'pl', 'cz', 'sk', 'hu', 'ro', 'bg', 'gr', 'hr', 'si', 'rs', 'ba', 'me', 'mk', 'al', 'ee', 'lv', 'lt', 'ua', 'md', 'ge', 'am', 'tr', 'cy', 'mt', 'il'];

/**
 * What a body's foreign-film category asks for beyond "not from here": the
 * Hong Kong academy's is for Chinese-language films, the Goyas' for
 * Ibero-American or European ones, and so on. Read from the name.
 */
function internationalAdmits(name: string, project: Project): { ok: true } | { ok: false; reason: string } {
  const s = name.toLowerCase();
  const country = project.productionCountryId ?? 'us';
  const language = project.language ?? 'en';
  if (/chinese language|華語|华语/.test(s) && language !== 'zh') return { ok: false, reason: 'this is for Chinese-language films' };
  if (/iberoamerican|ibero-american|iberoamericana/.test(s) && !IBERO_AMERICA.includes(country)) return { ok: false, reason: 'this is for Ibero-American films' };
  if (/europea|european/.test(s) && !EUROPE.includes(country)) return { ok: false, reason: 'this is for European films' };
  if (/flamand|flemish/.test(s) && !(country === 'be' && language === 'nl')) return { ok: false, reason: 'this is for Flemish films' };
  return { ok: true };
}

/** Whether one category, read for what it judges, admits the project. */
export function qualifiesForContest(sim: Simulation, project: Project, kind: CategoryKind, body: AwardBody, _edition: AwardEdition, name = ''): { ok: true } | { ok: false; reason: string } {
  const rules = body.rules;
  const tv = isTelevision(project);
  const feature = project.format === 'feature';
  const country = project.productionCountryId ?? 'us';
  const language = project.language ?? 'en';
  const local = rules.countries ? rules.countries.includes(country) : true;
  const inLanguage = rules.languages ? rules.languages.includes(language) : true;
  const no = (reason: string) => ({ ok: false as const, reason });
  const yes = { ok: true as const };

  // National bodies: everything but the foreign category needs a local film.
  if (kind !== 'international' && (!local || !inLanguage)) {
    return no(rules.countries && !local
      ? `it is a ${countryName(country)} production and this category is for ${rules.countries.length === 1 ? countryName(rules.countries[0]) : 'the region\'s'} films`
      : `it is in ${language} and this category is for ${rules.languages?.join('/')}-language films`);
  }

  const television = isTelevisionKind(kind);
  if (television && !tv) return no('it is a film and this is a television category');
  if (!television && tv && !['audience', 'ensemble'].includes(kind)) return no('it is television and this is a film category');

  switch (kind) {
    case 'picture': return feature ? yes : no('this is for feature films');
    case 'picture_drama': return feature && !isComedy(project) ? yes : no('this is for dramas');
    case 'picture_comedy': return feature && isComedy(project) ? yes : no('this is for musicals and comedies');
    case 'animated': return project.genres.includes('animation') && feature ? yes : no('this is for animated features');
    case 'international': {
      const asks = internationalAdmits(name, project);
      if (!asks.ok) return asks;
      if (rules.countries) return !local ? yes : no(`this is for films from outside ${rules.countries.length === 1 ? countryName(rules.countries[0]) : 'the region'}`);
      return language !== 'en' && feature ? yes : no('this is for features in a language other than English');
    }
    case 'documentary': return project.format === 'documentary' || (feature && project.genres.includes('documentary')) ? yes : no('this is for documentary features');
    case 'short': return project.format === 'short' && !project.genres.includes('animation') && !project.genres.includes('documentary') ? yes : no('this is for live-action shorts');
    case 'short_animated': return project.format === 'short' && project.genres.includes('animation') ? yes : no('this is for animated shorts');
    case 'short_documentary': return project.format === 'short' && project.genres.includes('documentary') ? yes : no('this is for documentary shorts');
    case 'first_feature': return feature && priorFeaturesBy(sim, project.directorId, project) === 0 ? yes : no('this is for a director\'s first feature');
    case 'first_director': return feature && !!project.directorId && priorFeaturesBy(sim, project.directorId, project) === 0 ? yes : no('this is for a director\'s first feature');
    case 'independent': return feature && !ownerIsStudio(sim, project) && project.budget <= (rules.maxBudget ?? 30_000_000_00) ? yes : no('this is for independent films');
    case 'director': return project.directorId ? yes : no('it has no credited director');
    case 'screenplay': return project.writerIds.length > 0 ? yes : no('it has no credited writer');
    case 'screenplay_original': return project.writerIds.length > 0 && sourceIsOriginal(sim, project) ? yes : no('this is for original screenplays and it is adapted');
    case 'screenplay_adapted': return project.writerIds.length > 0 && !sourceIsOriginal(sim, project) ? yes : no('this is for adapted screenplays and it is original');
    case 'lead_actor': case 'lead_actress': case 'lead_performance':
    case 'supporting_actor': case 'supporting_actress': case 'supporting_performance':
    case 'tv_lead_actor_drama': case 'tv_lead_actress_drama': case 'tv_lead_actor_comedy': case 'tv_lead_actress_comedy':
    case 'tv_lead_actor_limited': case 'tv_lead_actress_limited': case 'tv_lead_performance': case 'tv_supporting_actor': case 'tv_supporting_actress': case 'tv_supporting_performance':
    case 'newcomer': case 'young_performer': case 'voice_performance':
    case 'worst_actor': case 'worst_actress': case 'worst_supporting_actor': case 'worst_supporting_actress': {
      if (kind.startsWith('worst_') && releaseStrategyOf(sim, project) !== 'wide_theatrical') return no('the Razzies name films that opened wide');
      if (kind.startsWith('tv_lead') && kind.endsWith('_comedy') && !isComedy(project)) return no('this is for comedy series');
      if (kind.startsWith('tv_lead') && kind.endsWith('_drama') && (isComedy(project) || project.format !== 'series')) return no('this is for drama series');
      if (kind.endsWith('_limited') && !['limited_series', 'tv_movie'].includes(project.format)) return no('this is for limited series and television movies');
      if (kind === 'voice_performance' && !project.genres.includes('animation')) return no('this is for voice work in animation');
      return pickNomineeFor(sim, project, kind) ? yes : no(`nobody in its cast is a ${kindLabel(kind)}`);
    }
    case 'ensemble': return project.castIds.length >= 3 ? yes : no('a cast award needs an ensemble of three or more');
    case 'tv_ensemble': return project.castIds.length >= 3 ? yes : no('an ensemble award needs three or more');
    case 'stunt_ensemble': case 'craft_stunts': return project.genres.some((g) => ['action', 'adventure', 'thriller', 'war', 'superhero'].includes(g)) ? yes : no('this is for action work');
    case 'craft_vfx': return project.genres.some((g) => ['science fiction', 'fantasy', 'action', 'animation', 'superhero', 'adventure', 'war', 'horror'].includes(g)) || project.budget >= 40_000_000_00 ? yes : no('it has no effects work to speak of');
    case 'craft_cinematography': case 'craft_editing': case 'craft_score': case 'craft_song': case 'craft_production_design':
    case 'craft_costume': case 'craft_makeup': case 'craft_sound': case 'craft_casting':
      return yes;
    case 'series_drama': return project.format === 'series' && !isComedy(project) ? yes : no('this is for drama series');
    case 'series_comedy': return project.format === 'series' && isComedy(project) ? yes : no('this is for comedy series');
    case 'series': return project.format === 'series' || project.format === 'limited_series' ? yes : no('this is for series');
    case 'limited_series': return project.format === 'limited_series' || project.format === 'tv_movie' ? yes : no('this is for limited series');
    case 'tv_movie': return project.format === 'tv_movie' ? yes : no('this is for television movies');
    case 'new_series': return project.format === 'series' && (project.seasons ?? []).length <= 1 ? yes : no('this is for a series\' first season');
    case 'animated_series': return project.genres.includes('animation') ? yes : no('this is for animated series');
    case 'tv_directing': return project.directorId ? yes : no('it has no credited director');
    case 'tv_writing': return project.writerIds.length > 0 ? yes : no('it has no credited writer');
    case 'tv_guest': return no('SLATE does not model guest roles');
    case 'audience': return yes;
    case 'worst_picture': case 'worst_combo': case 'worst_sequel': {
      const strategy = releaseStrategyOf(sim, project);
      if (!feature || strategy !== 'wide_theatrical') return no('the Razzies name films that opened wide');
      if (kind === 'worst_sequel') { const rights = project.rightsId ? sim.universe.rights[project.rightsId] : undefined; return rights && ['remake', 'sequel'].includes(rights.sourceKind) ? yes : no('this is for remakes, rip-offs and sequels'); }
      if (kind === 'worst_combo') return project.castIds.length >= 2 ? yes : no('a screen combo needs two people');
      return yes;
    }
    case 'worst_director': return project.directorId && releaseStrategyOf(sim, project) === 'wide_theatrical' ? yes : no('the Razzies name films that opened wide');
    case 'worst_screenplay': return project.writerIds.length > 0 && releaseStrategyOf(sim, project) === 'wide_theatrical' ? yes : no('the Razzies name films that opened wide');
    case 'honorary': return no('this is an honour, not a contest');
  }
}

/** "lead actress", "supporting actor", for a sentence. */
function kindLabel(kind: CategoryKind): string {
  return kind.replace(/^tv_/, '').replace(/_(drama|comedy|limited)$/, '').replace(/^worst_/, '').replace(/_/g, ' ');
}

/** The performer title a kind asks for, for gendered categories. */
function titleFor(kind: CategoryKind): 'Actor' | 'Actress' | 'Performance' {
  if (kind.endsWith('actor') || kind.includes('_actor_')) return 'Actor';
  if (kind.endsWith('actress') || kind.includes('_actress_')) return 'Actress';
  return 'Performance';
}

/**
 * Who a category goes to. A lead category reads the cast from the top; a
 * supporting category skips the lead; a newcomer is the cast member with the
 * fewest credits; the youngest is the youngest. A film whose lead is an
 * actress is not a Best Actor nominee however good it was.
 */
export function pickNomineeFor(sim: Simulation, project: Project, kind: CategoryKind): Id | undefined {
  if (kind === 'director' || kind === 'first_director' || kind === 'tv_directing' || kind === 'worst_director') return project.directorId;
  if (kind.startsWith('screenplay') || kind === 'tv_writing' || kind === 'worst_screenplay') return project.writerIds[0];
  if (!PERSON_KINDS.has(kind)) return undefined;

  const leads = project.attachments.filter((a) => a.role === 'lead').map((a) => a.personId);
  const ordered = [...new Set([...leads, ...project.castIds])];
  const admits = (id: Id) => { const person = sim.universe.people[id]; return !!person && categoryAdmits(titleFor(kind), performerTitleOf(person)); };
  const supporting = kind.includes('supporting');

  if (kind === 'newcomer') {
    return ordered.filter(admits).sort((a, b) => (sim.universe.people[a]?.creditIds.length ?? 0) - (sim.universe.people[b]?.creditIds.length ?? 0))[0];
  }
  if (kind === 'young_performer') {
    const young = ordered.filter((id) => { const p = sim.universe.people[id]; return p && ageOn(p.birthInstant, sim.now, sim.homeZone) < 21; });
    return young[0];
  }
  const pool = supporting ? ordered.slice(Math.min(1, ordered.length)) : ordered;
  return pool.find(admits);
}

// ---------------------------------------------------------------------------
// Voting
// ---------------------------------------------------------------------------

interface Ballot {
  score: number;
  factors: { label: string; detail: string; weight: number; contribution: number; knowable: boolean }[];
}

/**
 * How an electorate reads a nomination. The profile says what this kind of
 * voter responds to; the numbers are the film's, the nominee's and the
 * season's; and the answer carries its own explanation.
 */
function castBallot(sim: Simulation, nomination: AwardNomination, edition: AwardEdition, body: AwardBody): Ballot {
  const project = nomination.projectId ? sim.universe.projects[nomination.projectId] : undefined;
  if (!project) return { score: 0, factors: [] };
  const w: VoterProfile = VOTER_PROFILES[body.rules.voters];
  const kind = (nomination.kind as CategoryKind | undefined) ?? classifyCategory(nomination.category) ?? 'picture';

  const quality = project.finalQuality ?? 50;
  const critics = project.criticScore ?? quality;
  const audience = project.audienceScore ?? quality;
  const gross = project.boxOfficeDomestic + project.boxOfficeInternational;
  const boxOffice = clamp(remap(Math.log10(Math.max(1, gross)), 7, 10.5, 0, 100), 0, 100);

  const nominee = nomination.personId ? sim.universe.people[nomination.personId] : undefined;
  const standingOf = (id: Id | undefined) => { const p = id ? sim.universe.people[id] : undefined; return p ? p.reputation.prestige * 0.6 + p.reputation.professionalReputation * 0.4 : 50; };
  const standing = nominee ? standingOf(nominee.id) : standingOf(project.directorId);

  const precursorWins = Object.values(sim.universe.awardNominations).filter(
    (n) => n.projectId === project.id && n.won && n.bodyId !== edition.bodyId
      && Math.abs((sim.universe.awardEditions[n.editionId]?.year ?? 0) - edition.year) <= 1
      && (!nomination.personId || n.personId === nomination.personId || !n.personId),
  );
  const precursors = clamp(precursorWins.length * 28, 0, 100);
  const campaign = clamp(remap(Math.log10(nomination.campaignSpend / 100 + 1), 0, 6.5, 0, 100), 0, 100);

  const prestigeGenre = project.genres.some((g) => ['drama', 'biography', 'war', 'history', 'documentary'].includes(g)) ? w.prestigeGenre : 0;
  const populist = project.genres.some((g) => ['horror', 'comedy', 'action', 'superhero'].includes(g)) ? -w.populistPenalty : 0;
  const craftKind = kind.startsWith('craft_');
  // A craft body sees the craft, not the story; scale and spectacle count.
  const craftBonus = craftKind && body.rules.voters === 'craft_guild' ? clamp(remap(Math.log10(Math.max(1, project.budget)), 8, 10.5, -4, 10), -4, 10) : 0;
  // A performance category reads the nominee more than the film.
  const performanceKind = PERSON_KINDS.has(kind) && !kind.includes('director') && !kind.includes('screenplay') && !kind.includes('writing');
  const standingWeight = performanceKind ? w.standing * 1.6 : w.standing;

  const rng = sim.rng('voting', edition.id, nomination.id);
  const noise = rng.normal(0, w.noise);

  const contributions = [
    w.quality * quality,
    w.critics * critics,
    w.audience * audience,
    w.boxOffice * boxOffice,
    standingWeight * standing,
    w.precursors * precursors,
    w.campaign * campaign,
  ];
  const total = contributions.reduce((a, b) => a + b, 0) + prestigeGenre + populist + craftBonus + noise;

  const money = (n: number) => formatMoneyCompact(n);
  return {
    score: clamp(total, -50, 150),
    factors: [
      { label: 'The Work', detail: `Quality ${quality} out of 100. ${w.who.charAt(0).toUpperCase() + w.who.slice(1)} ${w.quality < 0 ? 'go looking for the worst' : 'put the work first'}.`, weight: Math.abs(w.quality), contribution: contributions[0] ?? 0, knowable: true },
      { label: 'The Reviews', detail: `Critics at ${critics} out of 100.`, weight: Math.abs(w.critics), contribution: contributions[1] ?? 0, knowable: true },
      { label: 'The Audience', detail: `Audience score ${audience}; ${gross > 0 ? `${money(gross)} at the box office` : 'no box office to speak of'}.`, weight: w.audience + w.boxOffice, contribution: (contributions[2] ?? 0) + (contributions[3] ?? 0), knowable: true },
      { label: nominee ? 'Standing' : 'The Director\'s Standing', detail: nominee ? `${nominee.displayName}'s prestige and reputation in the industry.` : 'How the director is regarded.', weight: standingWeight, contribution: contributions[4] ?? 0, knowable: true },
      { label: 'Precursors', detail: precursorWins.length > 0 ? `${precursorWins.length} win${precursorWins.length === 1 ? '' : 's'} elsewhere this season: ${[...new Set(precursorWins.map((n) => bodyShortName(n.bodyId)))].join(', ')}.` : 'Nothing won elsewhere this season yet.', weight: w.precursors, contribution: contributions[5] ?? 0, knowable: true },
      { label: 'The Campaign', detail: w.campaign > 0 ? `${money(nomination.campaignSpend)} behind this category. It helps at the margin; it cannot replace the work.` : `${body.name} takes no campaigns.`, weight: w.campaign, contribution: contributions[6] ?? 0, knowable: true },
      { label: 'The Taste Of The Room', detail: `${w.responds}${prestigeGenre ? ' A serious drama is in its favour.' : ''}${populist ? ' A crowd-pleaser is marked down here.' : ''}${craftBonus > 0 ? ' Scale shows in the craft.' : ''}`, weight: 0.1, contribution: prestigeGenre + populist + craftBonus, knowable: true },
      { label: 'The Ballots', detail: 'Individual votes are secret. Nobody sees the count.', weight: 0.1, contribution: noise, knowable: false },
    ],
  };
}

function slotsFor(body: AwardBody, kind: CategoryKind): number {
  const pictureLike = ['picture', 'picture_drama', 'picture_comedy', 'series_drama', 'series_comedy', 'series', 'limited_series'].includes(kind);
  return pictureLike && body.rules.pictureSlots ? body.rules.pictureSlots : body.rules.slots;
}

function announceNominations(sim: Simulation, editionId: Id): void {
  const edition = sim.universe.awardEditions[editionId];
  if (!edition || edition.status !== 'upcoming') return;
  const body = AWARD_BODY_BY_ID[edition.bodyId];
  if (!body) return;

  edition.status = 'nominated';
  const title = editionName(edition.editionNumber, body.name);

  // Everything eligible gets considered, campaigned or not.
  const contenders = Object.values(sim.universe.projects).filter((p) => isEligible(sim, p, edition).ok);
  const entries = Object.values(sim.universe.awardNominations).filter((n) => n.editionId === edition.id);

  for (const contest of contestsFor(body.id)) {
    const pool: AwardNomination[] = entries.filter((n) => n.category === contest.name);

    // The world nominates things the player never campaigned for.
    for (const project of contenders) {
      if (pool.some((n) => n.projectId === project.id)) continue;
      if (!qualifiesForContest(sim, project, contest.kind, body, edition, contest.name).ok) continue;
      const merit = (project.finalQuality ?? 0) * 0.6 + (project.criticScore ?? 0) * 0.4;
      const worst = contest.kind.startsWith('worst_');
      if (!worst && merit < 55) continue;
      if (worst && merit > 48) continue;
      const rng = sim.rng('auto_nom', edition.id, contest.name, project.id);
      if (!rng.chance(worst ? remap(48 - merit, 0, 30, 0.2, 0.9) : remap(merit, 55, 95, 0.12, 0.8))) continue;
      const personId = pickNomineeFor(sim, project, contest.kind);
      if (PERSON_KINDS.has(contest.kind) && !personId) continue;
      const auto: AwardNomination = {
        id: sim.nextId('nom'),
        saveId: sim.universe.meta.id,
        editionId: edition.id,
        bodyId: body.id,
        category: contest.name,
        kind: contest.kind,
        projectId: project.id,
        ...(personId ? { personId } : {}),
        announcedAt: 0,
        campaignSpend: 0,
      };
      sim.universe.awardNominations[auto.id] = auto;
      pool.push(auto);
    }
    if (pool.length === 0) continue;

    const ranked = pool
      .map((n) => ({ nomination: n, ballot: castBallot(sim, n, edition, body) }))
      .sort((a, b) => b.ballot.score - a.ballot.score);
    const slots = Math.min(slotsFor(body, contest.kind), ranked.length);
    const nominated = ranked.slice(0, slots);
    const missed = ranked.slice(slots);

    for (const { nomination, ballot } of nominated) {
      nomination.announcedAt = sim.now;
      const person = nomination.personId ? sim.universe.people[nomination.personId] : undefined;
      if (person && !person.nominationIds.includes(nomination.id)) person.nominationIds.push(nomination.id);

      if (involvesPlayer(sim, nomination)) {
        const project = nomination.projectId ? sim.universe.projects[nomination.projectId] : undefined;
        sim.notify({
          category: 'awards',
          title: `${body.shortName} Nomination: ${contest.name}`,
          body: `${project?.title ?? 'Your work'} is nominated at ${title}.`,
          importance: 88, route: '/workspace/awards',
        });
        sim.remember({
          category: 'award',
          title: `Nominated For ${contest.name}`,
          detail: `${title}${project ? ` for ${project.title}` : ''}.`,
          refs: [
            ...(nomination.projectId ? [{ type: 'project', id: nomination.projectId }] : []),
            ...(nomination.personId ? [{ type: 'person', id: nomination.personId }] : []),
          ],
          significance: 82, public: true,
        });
        sim.audit({
          kind: 'award.nominated', subjectType: 'nomination', subjectId: nomination.id,
          question: `Why was it nominated for ${contest.name}?`,
          summary: `It finished in the top ${slots} of ${ranked.length} contenders at ${title}, in the eyes of ${VOTER_PROFILES[body.rules.voters].who}.`,
          factors: ballot.factors, score: ballot.score, outcome: 'nominated',
        });
        if (person) person.reputation.prestige = clamp(person.reputation.prestige + remap(body.rules.prestige, 0, 100, 1, 6), 0, 100);
      }
    }

    // Entries that did not make the cut are removed, not left pending.
    for (const { nomination, ballot } of missed) {
      if (involvesPlayer(sim, nomination) && (nomination.campaignSpend > 0 || nomination.personId === sim.universe.playerId)) {
        const edge = nominated[nominated.length - 1];
        sim.audit({
          kind: 'award.not_nominated', subjectType: 'project', subjectId: nomination.projectId ?? '',
          question: `Why was it not nominated for ${contest.name}?`,
          summary: `It finished outside the ${slots} slots at ${title}${edge ? `, ${Math.round(edge.ballot.score - ballot.score)} points behind the last nominee` : ''}. ${VOTER_PROFILES[body.rules.voters].responds}`,
          factors: [
            ...ballot.factors,
            { label: 'The Other Contenders', detail: `${ranked.length} were considered; ${slots} got in.`, weight: 0.25, contribution: 0, knowable: false },
          ],
          score: ballot.score, outcome: 'not nominated',
        });
      }
      delete sim.universe.awardNominations[nomination.id];
    }

    // A critics' group announces its winners on the day it votes.
    if (body.rules.announcesWinnersDirectly) decideCategory(sim, edition, body, contest, nominated.map((n) => n.nomination));
  }

  sim.emit('award.nominations_announced', { editionId: edition.id, bodyId: body.id, year: edition.year });
}

function decideCategory(sim: Simulation, edition: AwardEdition, body: AwardBody, contest: Contest, nominations: AwardNomination[]): void {
  if (nominations.length === 0) return;
  const title = editionName(edition.editionNumber, body.name);
  const ranked = nominations
    .map((n) => ({ nomination: n, ballot: castBallot(sim, n, edition, body) }))
    .sort((a, b) => b.ballot.score - a.ballot.score);
  const winner = ranked[0];
  if (!winner) return;

  for (const { nomination } of ranked) {
    nomination.won = nomination.id === winner.nomination.id;
    nomination.decidedAt = sim.now;
  }

  const project = winner.nomination.projectId ? sim.universe.projects[winner.nomination.projectId] : undefined;
  const person = winner.nomination.personId ? sim.universe.people[winner.nomination.personId] : undefined;
  const prestige = body.rules.prestige;
  const worst = contest.kind.startsWith('worst_');

  // Winning changes a career materially. A Razzie does the opposite, a little.
  if (person && !worst) {
    person.reputation.prestige = clamp(person.reputation.prestige + remap(prestige, 40, 100, 6, 22), 0, 100);
    person.reputation.professionalReputation = clamp(person.reputation.professionalReputation + remap(prestige, 40, 100, 3, 12), 0, 100);
    person.reputation.industryDemand = clamp(person.reputation.industryDemand + remap(prestige, 40, 100, 4, 15), 0, 100);
    person.reputation.publicFame = clamp(person.reputation.publicFame + remap(prestige, 40, 100, 2, 9), 0, 100);
    if (prestige >= 88) person.quote = Math.round(person.quote * 1.25);
  } else if (person && worst) {
    person.reputation.prestige = clamp(person.reputation.prestige - 3, 0, 100);
    person.reputation.publicFame = clamp(person.reputation.publicFame + 1, 0, 100);
  }
  if (project && prestige >= 82 && !worst) {
    // A major win extends a theatrical run and lifts library value.
    project.totalRevenue += applyRate(project.totalRevenue, 0.06);
  }

  if (involvesPlayer(sim, winner.nomination)) {
    sim.notify({
      category: 'awards',
      title: worst ? `You Were Named ${contest.name}` : `You Won ${contest.name}`,
      body: `${title}${project ? ` for ${project.title}` : ''}.`,
      importance: 98, route: '/workspace/awards',
    });
    sim.remember({
      category: 'award',
      title: `${worst ? 'Named' : 'Won'} ${contest.name}`,
      detail: `${title}${project ? ` for ${project.title}` : ''}.`,
      refs: [
        ...(winner.nomination.projectId ? [{ type: 'project', id: winner.nomination.projectId }] : []),
        ...(winner.nomination.personId ? [{ type: 'person', id: winner.nomination.personId }] : []),
      ],
      significance: worst ? 40 : 96, public: true,
    });
    const runnerUp = ranked[1];
    sim.audit({
      kind: 'award.won', subjectType: 'nomination', subjectId: winner.nomination.id,
      question: 'Why did this win?',
      summary: `${contest.name} at ${title}, decided by ${VOTER_PROFILES[body.rules.voters].who}${runnerUp ? `, ${Math.round(winner.ballot.score - runnerUp.ballot.score)} points clear of the runner-up` : ''}.`,
      factors: winner.ballot.factors, score: winner.ballot.score, outcome: worst ? 'named' : 'won',
    });
  } else {
    const mine = ranked.find((r) => involvesPlayer(sim, r.nomination));
    if (mine) {
      sim.notify({
        category: 'awards',
        title: `${contest.name} Went To ${project?.title ?? 'Another Film'}`,
        body: `You were nominated at ${title} and did not win.`,
        importance: 70, route: '/workspace/awards',
      });
      sim.audit({
        kind: 'award.lost', subjectType: 'nomination', subjectId: mine.nomination.id,
        question: `Why did it lose ${contest.name}?`,
        summary: `${project?.title ?? 'The winner'} took it, ${Math.round(winner.ballot.score - mine.ballot.score)} points ahead in the eyes of ${VOTER_PROFILES[body.rules.voters].who}. ${VOTER_PROFILES[body.rules.voters].responds}`,
        factors: [
          ...mine.ballot.factors,
          { label: 'The Winner', detail: `${project?.title ?? 'It'}: quality ${project?.finalQuality ?? '—'}, critics ${project?.criticScore ?? '—'}.`, weight: 0.3, contribution: winner.ballot.score - mine.ballot.score, knowable: true },
        ],
        score: mine.ballot.score, outcome: 'lost',
      });
    }
  }

  sim.emit('award.won', {
    editionId: edition.id, bodyId: body.id, category: contest.name,
    projectId: winner.nomination.projectId, personId: winner.nomination.personId,
  });
}

function holdCeremony(sim: Simulation, editionId: Id): void {
  const edition = sim.universe.awardEditions[editionId];
  if (!edition || edition.finalised) return;
  const body = AWARD_BODY_BY_ID[edition.bodyId];
  if (!body) return;

  edition.status = 'complete';
  const nominations = Object.values(sim.universe.awardNominations).filter((n) => n.editionId === edition.id && n.announcedAt > 0);

  for (const contest of contestsFor(body.id)) {
    const inCategory = nominations.filter((n) => n.category === contest.name && n.won === undefined);
    decideCategory(sim, edition, body, contest, inCategory);
  }

  // Finalised history is immutable from here.
  edition.finalised = true;
  sim.emit('award.ceremony_complete', { editionId: edition.id, bodyId: body.id, year: edition.year });
}

function involvesPlayer(sim: Simulation, nomination: AwardNomination): boolean {
  return nomination.personId === sim.universe.playerId
    || (!!nomination.projectId && projectInvolvesPlayer(sim, nomination.projectId));
}

function projectInvolvesPlayer(sim: Simulation, projectId: Id): boolean {
  const project = sim.universe.projects[projectId];
  if (!project) return false;
  const playerId = sim.universe.playerId;
  return project.createdById === playerId
    || project.directorId === playerId
    || project.writerIds.includes(playerId)
    || project.producerIds.includes(playerId)
    || project.castIds.includes(playerId);
}

// ---------------------------------------------------------------------------
// Festivals
// ---------------------------------------------------------------------------

export interface FestivalBody {
  id: string;
  name: string;
  spec: IndustryEventSpec;
  rules: FestivalRules;
}

/** The real festivals SLATE takes submissions for. */
export const FESTIVALS: readonly FestivalBody[] = INDUSTRY_EVENTS
  .filter((e) => e.kind === 'festival' && FESTIVAL_RULES[e.id])
  .map((e) => ({ id: e.id, name: e.name, spec: e, rules: FESTIVAL_RULES[e.id] as FestivalRules }));

export const FESTIVAL_BY_ID: Readonly<Record<string, FestivalBody>> = Object.fromEntries(FESTIVALS.map((f) => [f.id, f]));

/** The name of any festival a save can refer to, the retired fictional ones included. */
export function festivalName(id: string): string {
  return FESTIVAL_BY_ID[id]?.name ?? lookupEvent(id)?.name ?? LEGACY_FESTIVAL_NAMES[id] ?? id;
}

function nextFestivalYear(sim: Simulation, festival: FestivalBody): number {
  const year = zonedParts(sim.now, sim.homeZone).year;
  for (const y of [year, year + 1, year + 2]) {
    const occ = occurrence(festival.spec, y, lookupEvent);
    if (occ && parseDateKey(occ.start, festival.spec.zone, 19) > addDays(sim.now, 30, sim.homeZone)) return y;
  }
  return year + 1;
}

const GENRE_FILMS = ['horror', 'science fiction', 'fantasy', 'thriller', 'action', 'superhero'];

/** Whether a festival will take the submission at all, and if not, why. */
export function festivalAdmits(sim: Simulation, project: Project, festival: FestivalBody): { ok: true } | { ok: false; reason: string } {
  const r = festival.rules;
  if (!r.formats.includes(project.format as never)) return { ok: false, reason: `${festival.name} does not programme a ${project.format.replace('_', ' ')}.` };
  if (r.focus === 'documentary' && project.format !== 'documentary' && !project.genres.includes('documentary')) return { ok: false, reason: `${festival.name} is a documentary festival. ${project.title} is fiction.` };
  if (r.focus === 'animation' && !project.genres.includes('animation')) return { ok: false, reason: `${festival.name} is an animation festival. ${project.title} is live action.` };
  if (r.focus === 'genre' && !project.genres.some((g) => GENRE_FILMS.includes(g))) return { ok: false, reason: `${festival.name} programmes genre cinema. ${project.title} is ${project.genres.join('/')}.` };
  if (r.focus === 'shorts' && project.format !== 'short') return { ok: false, reason: `${festival.name} is for short films.` };
  if (r.focus === 'television' && !isTelevision(project)) return { ok: false, reason: `${festival.name} is a series festival.` };
  if (r.countries && !r.countries.includes(project.productionCountryId ?? 'us')) return { ok: false, reason: `${festival.name}'s competition is for films from its own region. ${project.title} is a ${countryName(project.productionCountryId)} production.` };
  if (r.maxBudget !== undefined && r.maxBudget > 0 && project.budget > r.maxBudget) return { ok: false, reason: `${festival.name}'s competition is for films made for under ${formatMoneyCompact(r.maxBudget)}. ${project.title} cost ${formatMoneyCompact(project.budget)}.` };

  const screenings = Object.values(sim.universe.festivalSubmissions).filter((f) => f.projectId === project.id && f.status === 'screened');
  const released = !!project.releaseDate && project.releaseDate <= sim.now;
  if (r.premiere === 'world' && (released || screenings.length > 0)) {
    return { ok: false, reason: `${festival.name} requires a world premiere. ${project.title} has already ${released ? 'been released' : `screened at ${festivalName(screenings[0]?.festivalId ?? '')}`}.` };
  }
  if (r.premiere === 'international') {
    const abroad = screenings.some((f) => FESTIVAL_BY_ID[f.festivalId]?.spec.countryId !== (project.productionCountryId ?? 'us'));
    if (released || abroad) return { ok: false, reason: `${festival.name} requires an international premiere. ${project.title} has already ${released ? 'been released' : 'screened outside its own country'}.` };
  }
  if (r.premiere === 'north_american') {
    const northAmerica = screenings.some((f) => ['us', 'ca', 'mx'].includes(FESTIVAL_BY_ID[f.festivalId]?.spec.countryId ?? ''));
    const strategy = releaseStrategyOf(sim, project);
    if ((released && strategy !== 'festival_only') || northAmerica) return { ok: false, reason: `${festival.name} requires a North American premiere. ${project.title} has already ${released ? 'been released' : 'screened in North America'}.` };
  }
  if (r.focus === 'independent' && ownerIsStudio(sim, project)) return { ok: false, reason: `${festival.name} is for independent film. ${project.title} is a studio picture.` };
  return { ok: true };
}

function decideFestivalSubmission(sim: Simulation, submissionId: Id): void {
  const submission = sim.universe.festivalSubmissions[submissionId];
  if (!submission || submission.status !== 'under_review') return;
  const festival = FESTIVAL_BY_ID[submission.festivalId];
  const project = sim.universe.projects[submission.projectId];
  if (!festival || !project) return;
  const r = festival.rules;
  const occ = occurrence(festival.spec, submission.year, lookupEvent);
  if (!occ) return;

  const quality = project.finalQuality ?? 50;
  const rng = sim.rng('festival', submission.id);

  // What this festival programmes, against what this film is.
  const artHouse = project.genres.some((g) => ['drama', 'documentary', 'experimental', 'biography', 'history'].includes(g));
  const genre = project.genres.some((g) => GENRE_FILMS.includes(g));
  const taste = r.focus === 'genre' ? (genre ? 10 : -12) : r.focus === 'documentary' || r.focus === 'animation' ? 4 : artHouse ? 8 : genre ? -8 : 0;
  const starDraw = project.castIds.reduce((s, id) => s + (sim.universe.people[id]?.reputation.publicFame ?? 0), 0) / Math.max(1, project.castIds.length);
  const drawEffect = r.market ? remap(starDraw, 0, 100, 0, 8) : remap(starDraw, 0, 100, 0, 3);
  const firstFeature = priorFeaturesBy(sim, project.directorId, project) === 0 ? (r.focus === 'independent' ? 4 : 0) : 0;

  const merit = quality + taste + drawEffect + firstFeature;
  const probability = clamp(remap(merit - r.bar, -30, 25, 0.02, 0.92), 0.01, 0.94);
  const roll = rng.next();
  const selected = roll < probability;
  submission.decisionAt = sim.now;

  sim.audit({
    kind: 'fest.decision', subjectType: 'project', subjectId: project.id,
    question: `Why did ${festival.name} take it, or not?`,
    summary: selected ? `Selected for ${festival.name} ${submission.year}.` : `Not selected for ${festival.name} ${submission.year}. ${r.eligibility}`,
    factors: [
      { label: 'The Film', detail: `Quality ${quality} out of 100 against a bar of about ${r.bar} to have a fair chance here.`, weight: 0.55, contribution: quality - r.bar, knowable: true },
      { label: 'Programming Taste', detail: taste > 0 ? 'This kind of film is squarely what they programme.' : taste < 0 ? 'This is not really their sort of film.' : 'Neither for nor against it.', weight: 0.2, contribution: taste, knowable: true },
      { label: 'Cast Draw', detail: r.market ? 'A festival with buyers in the room needs films that sell tickets and press too.' : 'A smaller festival cares less about names.', weight: 0.1, contribution: drawEffect, knowable: true },
      { label: 'The Rest Of The Slate', detail: 'How many slots were left and what else was submitted.', weight: 0.15, contribution: 0, knowable: false },
    ],
    seed: `festival|${submission.id}`, roll, probability, score: merit,
    outcome: selected ? 'selected' : 'rejected',
  });

  if (!selected) {
    submission.status = 'rejected';
    sim.notify({
      category: 'career', title: `${festival.name} Passed On ${project.title}`,
      body: 'Not selected for this edition.',
      importance: 44, route: '/workspace/projects',
    });
    sim.emit('fest.rejected', { submissionId: submission.id, festivalId: festival.id, projectId: project.id });
    return;
  }

  submission.status = 'selected';
  submission.section = merit >= r.bar + 6 ? r.competition : r.secondStrand;
  const day = clamp(rng.int(1, Math.max(1, festival.spec.days - 2)), 1, Math.max(1, festival.spec.days - 1));
  const screeningAt = addDays(parseDateKey(occ.start, festival.spec.zone, 20), day, festival.spec.zone);
  submission.screeningAt = screeningAt;

  sim.schedule({
    at: screeningAt,
    kind: 'fest.screening',
    label: `${titleCaseLabel(festival.name)} — ${project.title} Premiere`,
    category: 'career',
    payload: { submissionId: submission.id },
    priority: 26,
    refType: 'project', refId: project.id,
    requiresPlayer: true,
    ...(festival.spec.cityId ? { locationId: festival.spec.cityId } : {}),
    durationMinutes: 300,
  });

  const city = festival.spec.cityId ? CITIES.get(festival.spec.cityId)?.name : festival.spec.city;
  sim.notify({
    category: 'career',
    title: `${project.title} Selected For ${festival.name}`,
    body: `${submission.section}. Screening ${formatDate(screeningAt, festival.spec.zone)} in ${city ?? festival.spec.city}.`,
    importance: 84, route: '/workspace/projects',
  });
  sim.remember({
    category: 'project',
    title: `${project.title} Selected For ${festival.name}`,
    detail: `${submission.section}, ${submission.year} edition.`,
    refs: [{ type: 'project', id: project.id }],
    significance: 68, public: true,
  });
  sim.emit('fest.selected', { submissionId: submission.id, festivalId: festival.id, projectId: project.id, section: submission.section });
}

/** The first prize of a kind the festival actually gives, by its real name. */
function prizeNamed(festival: FestivalBody, kind: PrizeKind): string | undefined {
  return (festival.spec.prizes ?? []).find((p) => classifyPrize(p) === kind);
}

function holdScreening(sim: Simulation, submissionId: Id): void {
  const submission = sim.universe.festivalSubmissions[submissionId];
  if (!submission || submission.status !== 'selected') return;
  const festival = FESTIVAL_BY_ID[submission.festivalId];
  const project = sim.universe.projects[submission.projectId];
  if (!festival || !project) return;
  const r = festival.rules;

  submission.status = 'screened';
  const quality = project.finalQuality ?? 50;
  const rng = sim.rng('screening', submission.id);
  const inCompetition = submission.section === r.competition;

  // The jury sees the film once, against the rest of the slate.
  const juryScore = clamp(quality + rng.normal(0, 10), 0, 100);
  const slateBest = clamp(rng.normal(r.bar + 12, 6), 40, 99);
  const slateSecond = slateBest - Math.abs(rng.normal(3, 2));
  const wins: string[] = [];
  const reasons: string[] = [];

  if (inCompetition) {
    if (juryScore > slateBest) {
      const top = prizeNamed(festival, 'top');
      if (top) { wins.push(top); reasons.push(`The jury put it above everything else in ${r.competition}.`); }
    } else if (juryScore > slateSecond) {
      const second = prizeNamed(festival, 'grand') ?? prizeNamed(festival, 'jury');
      if (second) { wins.push(second); reasons.push('The jury liked it second best, or wanted it recognised beside the winner.'); }
    }
    // One more prize at most: what the film does best.
    if (wins.length <= 1 && juryScore > r.bar) {
      const lead = pickNomineeFor(sim, project, 'lead_performance');
      const leadPerson = lead ? sim.universe.people[lead] : undefined;
      const candidates: { kind: PrizeKind; strength: number; why: string }[] = [
        { kind: 'director', strength: (project.directorId ? sim.universe.people[project.directorId]?.reputation.prestige ?? 40 : 0) * 0.5 + juryScore * 0.5, why: 'the direction was what the room talked about' },
        { kind: leadPerson && performerTitleOf(leadPerson) === 'actress' ? 'actress' : 'actor', strength: (leadPerson?.reputation.professionalReputation ?? 0) * 0.5 + juryScore * 0.5, why: 'the lead performance carried it' },
        { kind: 'screenplay', strength: project.scriptQuality * 0.6 + juryScore * 0.4, why: 'the script was the strongest thing in it' },
        { kind: 'first_feature', strength: priorFeaturesBy(sim, project.directorId, project) === 0 ? juryScore : 0, why: 'it was a first feature and the jury wanted to say so' },
      ];
      const options = candidates.filter((o) => o.strength > r.bar + 4);
      const best = options.sort((a, b) => b.strength - a.strength)[0];
      if (best && rng.chance(remap(best.strength, r.bar, 100, 0.2, 0.7))) {
        const name = prizeNamed(festival, best.kind) ?? (best.kind === 'actor' || best.kind === 'actress' ? prizeNamed(festival, 'performance') : undefined);
        if (name && !wins.includes(name)) { wins.push(name); reasons.push(`${name}: ${best.why}.`); }
      }
    }
  }
  // The audience votes for what it loved, in any strand.
  const audience = prizeNamed(festival, 'audience');
  if (audience && (project.audienceScore ?? quality) > 74 && rng.chance(remap(project.audienceScore ?? quality, 74, 100, 0.15, 0.6))) {
    wins.push(audience); reasons.push('The audience voted for it over the rest of the programme.');
  }
  submission.awardsWon = wins;

  sim.audit({
    kind: 'fest.jury', subjectType: 'project', subjectId: project.id,
    question: `What did the jury at ${festival.name} make of it?`,
    summary: wins.length > 0 ? `${wins.join(' and ')}. ${reasons.join(' ')}` : inCompetition ? `Nothing. The jury preferred other films in ${r.competition}.` : `No prize: ${submission.section} is not a competitive strand.`,
    factors: [
      { label: 'The Film', detail: `Quality ${quality}; the jury's reading of it on the day came out at ${Math.round(juryScore)}.`, weight: 0.5, contribution: juryScore - r.bar, knowable: true },
      { label: 'The Competition', detail: inCompetition ? `The strongest film in the room came out at about ${Math.round(slateBest)}.` : 'Out of competition.', weight: 0.35, contribution: inCompetition ? juryScore - slateBest : 0, knowable: false },
      { label: 'The Room', detail: VOTER_PROFILES.jury.responds, weight: 0.15, contribution: 0, knowable: false },
    ],
    seed: `screening|${submission.id}`, score: juryScore, outcome: wins.length > 0 ? 'won' : 'no prize',
  });

  // Buyers in the room, if the festival has a market.
  if (r.market && !project.releaseId) {
    const heat = clamp(quality * 0.6 + juryScore * 0.4 + (wins.length > 0 ? 12 : 0), 0, 110);
    const offerCount = clamp(Math.round(remap(heat, 45, 95, 0, 3)), 0, 3);
    for (let i = 0; i < offerCount; i++) {
      const amount = Math.round(project.totalCost * remap(heat, 45, 100, 0.35, 2.1) * rng.float(0.7, 1.3));
      submission.acquisitionOffers.push({
        buyerName: rng.pick(['Northgate Films', 'Brightline Pictures', 'Tessellate', 'Sable & Fox', 'Crestwood Studios']),
        amount: Math.max(150_000_00, amount),
        territories: rng.chance(0.5) ? ['worldwide'] : ['domestic'],
        at: sim.now,
        accepted: false,
      });
    }
    if (offerCount > 0) {
      const best = submission.acquisitionOffers.reduce((b, o) => (o.amount > b.amount ? o : b));
      sim.requireDecision({
        urgency: 82, category: 'business',
        title: `Acquisition Offers For ${project.title}`,
        detail: `${offerCount} offer${offerCount === 1 ? '' : 's'} out of ${festival.name}. Best is ${best.buyerName} at ${formatMoneyCompact(best.amount)} for ${best.territories.join(', ')}.`,
        route: '/workspace/projects',
        actions: submission.acquisitionOffers.map((o, index) => ({
          label: `${o.buyerName} — ${formatMoneyCompact(o.amount)}`,
          commandKind: 'fest.accept_acquisition',
          payload: { submissionId: submission.id, offerIndex: index },
        })),
        dueAt: addDays(sim.now, 6, sim.homeZone),
        refType: 'festival_submission', refId: submission.id,
      });
    }
  }

  // Prestige and press from the premiere itself.
  for (const personId of [...project.castIds, project.directorId].filter(Boolean) as Id[]) {
    const person = sim.universe.people[personId];
    if (!person) continue;
    person.reputation.prestige = clamp(person.reputation.prestige + remap(r.prestige, 40, 100, 1, 7) + wins.length * 4, 0, 100);
    person.reputation.publicFame = clamp(person.reputation.publicFame + remap(r.prestige, 40, 100, 0.5, 3), 0, 100);
  }

  if (wins.length > 0) {
    sim.notify({
      category: 'awards',
      title: `${project.title} Won At ${festival.name}`,
      body: wins.join(' and ') + '.',
      importance: 90, route: '/workspace/projects',
    });
    sim.remember({
      category: 'award',
      title: `Won ${wins.join(' And ')} At ${festival.name}`,
      detail: `${submission.year} edition, ${submission.section}.`,
      refs: [{ type: 'project', id: project.id }],
      significance: 88, public: true,
    });
  }

  sim.emit('fest.screened', { submissionId: submission.id, projectId: project.id, wins, offers: submission.acquisitionOffers.length });
}

// ---------------------------------------------------------------------------
// Read models
// ---------------------------------------------------------------------------

export function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/** "The 98th Academy Awards", never "98th The Academy Awards". */
export function editionName(n: number, name: string): string {
  return name.startsWith('The ') ? `The ${ordinal(n)} ${name.slice(4)}` : `${ordinal(n)} ${name}`;
}

/** Award history for a person, newest first. Finalised results never change. */
export function awardHistory(sim: Simulation, personId: Id) {
  return Object.values(sim.universe.awardNominations)
    .filter((n) => n.personId === personId && n.announcedAt > 0)
    .map((n) => ({
      nomination: n,
      edition: sim.universe.awardEditions[n.editionId],
      bodyName: bodyName(n.bodyId),
      project: n.projectId ? sim.universe.projects[n.projectId] : undefined,
    }))
    .sort((a, b) => (b.edition?.ceremonyAt ?? 0) - (a.edition?.ceremonyAt ?? 0));
}

/** Upcoming and recent ceremonies with their windows, for the awards workspace. */
export function awardsCalendar(sim: Simulation) {
  return Object.values(sim.universe.awardEditions)
    .sort((a, b) => a.ceremonyAt - b.ceremonyAt)
    .map((edition) => ({
      edition,
      body: AWARD_BODY_BY_ID[edition.bodyId],
      name: editionName(edition.editionNumber, bodyName(edition.bodyId)),
      nominations: Object.values(sim.universe.awardNominations).filter((n) => n.editionId === edition.id && n.announcedAt > 0),
      daysAway: Math.round((edition.ceremonyAt - sim.now) / MS_DAY),
    }));
}

export function festivalCalendar(sim: Simulation) {
  const out: { festival: FestivalBody; year: number; occurrence: Occurrence; at: number; city: ReturnType<typeof CITIES.get>; submissions: FestivalSubmission[] }[] = [];
  for (const festival of FESTIVALS) {
    const year = nextFestivalYear(sim, festival);
    // A festival with no announced edition ahead (an irregular one) is not offered.
    const occ = occurrence(festival.spec, year, lookupEvent);
    if (!occ) continue;
    out.push({
      festival,
      year,
      occurrence: occ,
      at: parseDateKey(occ.start, festival.spec.zone, 19),
      city: festival.spec.cityId ? CITIES.get(festival.spec.cityId) : undefined,
      submissions: Object.values(sim.universe.festivalSubmissions).filter((f) => f.festivalId === festival.id && f.year === year),
    });
  }
  return out.sort((a, b) => a.at - b.at);
}
