/**
 * SLATE — The studios and networks, live.
 *
 * Up to the day a save begins, a studio is its record. From that day it acts:
 * the titles it has dated open on the day and take their chances at the box
 * office beside the player's; the weekend is counted every Sunday night and
 * the year's market share with it; results move each studio's mood, strategy
 * and slate; seats change hands; what is pending on the record (a sale before
 * a court, a buyout, a wind-down) resolves inside the window the record gives
 * it; and every one of those things is a headline in the trades.
 *
 * The player is in the middle of it. Every studio keeps a standing with them
 * that moves with what they bring and what it does, and a studio that thinks
 * enough of a producer offers a first-look deal, as a network offers an
 * overall deal to a creator: overhead paid every year for the right to see
 * everything first. The terms of every offer live in the save; an acceptance
 * is charged once against the offer on record; nothing here trusts a caller.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { BoxOfficeEntry, Id, MarketingCampaign, Project, Release, StudioState, TalentDeal } from '../domain/model';
import type { WorldEvent } from '../core/events';
import type { Rng } from '../core/rng';
import { clamp, remap } from '../core/rng';
import { addDays, addYears, dateKey, daysBetween, endOfDay, instantFromZoned, parseDateKey, startOfDay, zonedParts, MS_MINUTE } from '../core/time';
import { formatMoney, formatMoneyCompact, type Money } from '../core/money';
import { buildFactors } from '../core/audit';
import { STUDIOS, type Studio } from '../content/studios';
import { NETWORKS, payOnePartner } from '../content/networks';
import { BUYERS, GENRE_APPETITE, GENRE_BUDGET_INDEX } from '../content/industry';
import { UPCOMING_SLATE, type UpcomingTitle } from '../content/upcoming-slate';
import { CORPORATE_EVENTS, corporateEvent, type CorporateEvent } from '../content/corporate-events';
import { primaryLanguageOf } from '../content/geography';
import { generatePersonName } from '../content/names';
import { titleCaseLabel } from '../core/text';
import { quickReception } from './critics';
import { bookingFootprint } from './release';
import {
  activeDeal, adjustStanding, effectiveStudio, isPlayersProject, liveLeadership, marketShare, networkState, recordNews, recordTrade, studioState, type CompanyKind,
} from './studio-state';

const WEEKEND_CAP = 60;
const TOP_ENTRIES = 20;

// ---------------------------------------------------------------------------
// Clocks
// ---------------------------------------------------------------------------

function nextSundayNight(sim: Simulation): number {
  const z = sim.homeZone;
  const parts = zonedParts(sim.now, z);
  const daysAhead = (7 - parts.weekday) % 7;
  let at = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour: 23, minute: 30 }, z);
  at = addDays(at, daysAhead, z);
  if (at <= sim.now) at = addDays(at, 7, z);
  return at;
}

function firstOfNextMonth(sim: Simulation): number {
  const z = sim.homeZone;
  const p = zonedParts(sim.now, z);
  const month = p.month === 12 ? 1 : p.month + 1;
  const year = p.month === 12 ? p.year + 1 : p.year;
  return instantFromZoned({ year, month, day: 1, hour: 4 }, z);
}

function nextJanuary(sim: Simulation): number {
  const z = sim.homeZone;
  return instantFromZoned({ year: zonedParts(sim.now, z).year + 1, month: 1, day: 3, hour: 5 }, z);
}

function hasPending(sim: Simulation, kind: string, match: (payload: Record<string, unknown>) => boolean = () => true): boolean {
  return sim.universe.scheduled.some((s) => s.kind === kind && s.status === 'pending' && match(s.payload));
}

/**
 * Puts the studios' clocks in the save: the weekend count, the monthly and
 * yearly reviews, every dated title still to come, and every pending event.
 * Idempotent, so a save can be loaded any number of times.
 */
export function ensureStudioSchedules(sim: Simulation): void {
  const z = sim.homeZone;
  if (!hasPending(sim, 'studio.weekend')) sim.schedule({ at: nextSundayNight(sim), kind: 'studio.weekend', label: 'Weekend Box Office', category: 'system', priority: 91 });
  if (!hasPending(sim, 'studio.month')) sim.schedule({ at: firstOfNextMonth(sim), kind: 'studio.month', label: 'The Studios, Monthly', category: 'system', priority: 92 });
  if (!hasPending(sim, 'studio.year')) sim.schedule({ at: nextJanuary(sim), kind: 'studio.year', label: 'The Studios, Yearly', category: 'system', priority: 93 });

  const today = dateKey(sim.now, z);
  const released = new Set(Object.values(sim.universe.projects).map((p) => p.catalogueQid).filter(Boolean));
  for (const title of primaryUpcoming()) {
    if (title.date < today || released.has(title.qid)) continue;
    if (hasPending(sim, 'studio.slate_release', (p) => p.qid === title.qid)) continue;
    sim.schedule({
      at: parseDateKey(title.date, z, 9), kind: 'studio.slate_release',
      label: `${titleCaseLabel(title.title)} Opens`, category: 'release', priority: 70,
      payload: { qid: title.qid, studioId: title.studioId },
    });
  }

  for (const event of CORPORATE_EVENTS) {
    if (event.to < today) continue;
    const state = event.subjectKind === 'studio' ? sim.universe.studios?.[event.subjectId] : sim.universe.networks?.[event.subjectId];
    if (state?.corporate.some((c) => c.eventId === event.id)) continue;
    if (hasPending(sim, 'studio.corporate_event', (p) => p.eventId === event.id)) continue;
    const from = parseDateKey(event.from < today ? today : event.from, z, 10);
    const to = parseDateKey(event.to, z, 10);
    const at = from >= to ? to : from + Math.floor(sim.rng('corporate', event.id, 'when').float(0, 1) * (to - from));
    sim.schedule({ at: Math.max(at, sim.now + MS_MINUTE), kind: 'studio.corporate_event', label: titleCaseLabel(event.label), category: 'system', priority: 85, payload: { eventId: event.id } });
  }
}

// ---------------------------------------------------------------------------
// The dated slate opens on the day
// ---------------------------------------------------------------------------

function estimateBudget(studio: Studio, genres: string[], franchise: boolean, strategy: StudioState['strategy'], rng: Rng): Money {
  const index = genres.reduce((s, g) => s + (GENRE_BUDGET_INDEX[g] ?? 0.8), 0) / Math.max(1, genres.length);
  const band = studio.budgetFloor + (studio.budgetCeiling - studio.budgetFloor) * clamp(remap(index, 0.2, 2.6, 0.1, 0.9), 0.05, 0.95);
  let budget = band * rng.float(0.75, 1.25);
  if (franchise) budget *= 1.35;
  if (strategy === 'cost_cutting') budget *= 0.85;
  return Math.round(clamp(budget, studio.budgetFloor * 0.6, studio.budgetCeiling * 1.3) / 100_000_00) * 100_000_00;
}

function estimateQuality(studio: Studio, rng: Rng): number {
  const rt = studio.stats?.rtMean ?? 60;
  return clamp(Math.round(remap(rt, 40, 85, 44, 72) + rng.normal(0, 11)), 18, 94);
}

function formatOf(kind: string): Project['format'] {
  return kind === 'series' ? 'series' : kind === 'limited_series' ? 'limited_series' : kind === 'documentary' ? 'documentary' : kind === 'tv_movie' ? 'tv_movie' : 'feature';
}

function releaseFromRecord(sim: Simulation, qid: string, studioId: string): void {
  const title = primaryUpcoming().find((t) => t.qid === qid) ?? UPCOMING_SLATE.find((t) => t.qid === qid && t.studioId === studioId);
  const studio = STUDIOS.get(title?.studioId ?? studioId);
  if (!title || !studio) return;
  // Once is once: a title already in the world is not opened again.
  if (Object.values(sim.universe.projects).some((p) => p.catalogueQid === qid)) return;
  const state = studioState(sim, studio.id);
  const live = effectiveStudio(sim, studio);
  if (live.closing) {
    recordNews(sim, 'studio', studio.id, { kind: 'slate', title: `${title.title} Shelved`, detail: `${studio.shortName} is not releasing anything new. The title stays on the shelf.` });
    recordTrade(sim, { kind: 'slate', headline: `${studio.shortName} shelves ${title.title}`, detail: 'A studio that has stopped taking on work does not open pictures.', studioId: studio.id });
    return;
  }

  const rng = sim.rng('slate', qid);
  const format = formatOf(title.kind);
  const genres = title.genres.length > 0 ? title.genres.slice(0, 3) : ['drama'];
  const budget = title.budget ? title.budget * 100 : estimateBudget(studio, genres, Boolean(title.franchise), live.strategy, rng);
  const quality = estimateQuality(studio, rng);
  const television = format === 'series' || format === 'limited_series' || format === 'tv_movie';
  const straightToStreaming = studio.type === 'streamer' || television;
  const strategy: Release['strategy'] = straightToStreaming ? 'streaming_exclusive'
    : budget >= 25_000_000_00 ? 'wide_theatrical'
    : budget >= 6_000_000_00 ? 'limited_theatrical'
    : 'platform';
  const openingDate = sim.now + MS_MINUTE;

  const project: Project = {
    id: sim.nextId('proj'),
    saveId: sim.universe.meta.id,
    title: title.title,
    format,
    genres,
    logline: `${studio.name} release, dated ${title.date} on the record.`,
    synopsis: `${title.title} is on ${studio.name}'s slate for ${title.date}. What it does from here is this universe's own story.`,
    phase: 'post',
    phaseHistory: [{ phase: 'post', enteredAt: sim.now }],
    createdById: sim.nextId('person'),
    productionCountryId: studio.countryId,
    language: primaryLanguageOf(studio.countryId),
    attachments: [], writerIds: [], producerIds: [], castIds: [], credits: [],
    budget, budgetLocked: true, spent: budget, contingency: 0,
    financingIds: [], scriptDraftIds: [],
    targetAudience: 'General audience', comparables: [],
    scriptQuality: quality, packageValue: 0,
    productionLocationIds: [], shootDayIds: [], scheduledShootDays: 0, completedShootDays: 0, postTaskIds: [],
    boxOfficeDomestic: 0, boxOfficeInternational: 0, streamingHoursViewed: 0, totalRevenue: 0, totalCost: budget,
    createdAt: sim.now,
    studioId: studio.id,
    distributorName: studio.name,
    catalogueQid: qid,
    finalQuality: quality,
    pictureLockedAt: sim.now,
    releaseDate: openingDate,
    releaseStrategy: strategy,
  };
  sim.universe.projects[project.id] = project;
  quickReception(sim, project, sim.rng('slate_reception', qid));

  // What the studio puts behind it: a campaign the size of the picture.
  const appetite = genres.reduce((s, g) => s + (GENRE_APPETITE[g] ?? 45), 0) / genres.length;
  const pAndA = Math.round(clamp(budget * (studio.type === 'major' ? 0.55 : 0.35), 1_500_000_00, 150_000_000_00));
  const awareness = clamp(Math.round(remap(pAndA, 1_500_000_00, 150_000_000_00, 30, 92) + (title.franchise ? 6 : 0) + (quality > 75 ? 3 : 0)), 15, 97);
  const intent = clamp(Math.round(remap(appetite, 40, 80, 20, 55) + (title.franchise ? 15 : 0) + remap(quality, 40, 85, -5, 10)), 8, 85);
  const campaign: MarketingCampaign = {
    id: sim.nextId('campaign'), saveId: sim.universe.meta.id, projectId: project.id,
    budget: pAndA, spent: pAndA, positioning: 'Studio Campaign', targetAudience: 'General audience',
    beats: [], awareness, intent, sentiment: 0, socialPostIds: [], startedAt: sim.now,
  };
  sim.universe.marketingCampaigns[campaign.id] = campaign;

  const theaterCount = bookingFootprint(project, strategy, Math.max(0.35, studio.distributionReach));
  const partner = payOnePartner(studio.id);
  const service = partner?.network.name ?? studio.name;
  const release: Release = {
    id: sim.nextId('release'), saveId: sim.universe.meta.id, projectId: project.id,
    strategy, distributorName: studio.name,
    streamingPartnerId: partner?.network.id, streamingPartnerName: partner?.network.name,
    distributorShare: 0.3, exhibitorShare: 0.5,
    openingDate, theaterCount, maxTheaterCount: Math.max(theaterCount, strategy === 'platform' ? 2400 : theaterCount),
    market: studio.countryId,
    territories: ['worldwide'], windows: [], dailyBoxOffice: [],
    totalDomestic: 0, totalInternational: 0, netToDistributor: 0, netToProducer: 0, status: 'planned',
  };
  sim.universe.releases[release.id] = release;
  sim.schedule({ at: openingDate, kind: 'rel.open', label: `${titleCaseLabel(title.title)} Opens`, category: 'release', payload: { releaseId: release.id }, priority: 72, refType: 'project', refId: project.id });

  const year = String(zonedParts(sim.now, sim.homeZone).year);
  const results = (state.yearResults[year] ??= { releases: 0, hits: 0, flops: 0 });
  results.releases++;
  const how = strategy === 'streaming_exclusive' ? `on ${service}` : `in ${theaterCount.toLocaleString('en-US')} theatres${studio.countryId !== 'us' ? ' at home' : ''}`;
  recordNews(sim, 'studio', studio.id, { kind: 'release', title: `${title.title} Opens`, detail: `${titleCaseLabel(genres.join(', '))}. ${how}, ${title.budget ? `budget ${formatMoneyCompact(budget)} on record` : `budget about ${formatMoneyCompact(budget)}, SLATE's estimate`}.`, projectId: project.id });
  recordTrade(sim, { kind: 'release', headline: `${studio.shortName} opens ${title.title}`, detail: `${titleCaseLabel(genres.join(', '))}, ${how}.${title.franchise ? ` The next ${titleCaseLabel(title.franchise.name)} entry.` : ''}`, studioId: studio.id, projectId: project.id });
}

/**
 * One studio per title. A film co-produced by a producer and released by a
 * distributor is on both catalogues; the distributor releases it, and the
 * more specific distributor (Searchlight over Disney, Focus over Universal)
 * is the one whose name is on it.
 */
let primary: UpcomingTitle[] | undefined;
export function primaryUpcoming(): readonly UpcomingTitle[] {
  if (primary) return primary;
  const byQid = new Map<string, UpcomingTitle[]>();
  for (const t of UPCOMING_SLATE) byQid.set(t.qid, [...(byQid.get(t.qid) ?? []), t]);
  const rank = (t: UpcomingTitle): number => {
    const studio = STUDIOS.get(t.studioId);
    if (!studio) return -1;
    return (studio.distributes ? 1000 : 0) + (1000 - Math.min(999, studio.slateSize));
  };
  primary = [...byQid.values()].map((group) => group.slice().sort((a, b) => rank(b) - rank(a))[0]!).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  return primary;
}

/** The real titles a studio still has dated ahead of today in the save. */
export function upcomingFor(sim: Simulation, studioId: string): UpcomingTitle[] {
  const today = dateKey(sim.now, sim.homeZone);
  const released = new Set(Object.values(sim.universe.projects).map((p) => p.catalogueQid).filter(Boolean));
  return primaryUpcoming().filter((t) => t.studioId === studioId && t.date >= today && !released.has(t.qid));
}

/** Everything dated across the industry from today, soonest first. */
export function releaseCalendar(sim: Simulation, days = 120): UpcomingTitle[] {
  const z = sim.homeZone;
  const today = dateKey(sim.now, z);
  const until = dateKey(addDays(sim.now, days, z), z);
  const released = new Set(Object.values(sim.universe.projects).map((p) => p.catalogueQid).filter(Boolean));
  return primaryUpcoming().filter((t) => t.date >= today && t.date <= until && !released.has(t.qid));
}

// ---------------------------------------------------------------------------
// The weekend
// ---------------------------------------------------------------------------

function fridayOf(sim: Simulation, at: number): number {
  const z = sim.homeZone;
  const weekday = zonedParts(at, z).weekday;
  const back = (weekday - 5 + 7) % 7;
  return startOfDay(addDays(at, -back, z), z);
}

function compileWeekend(sim: Simulation): void {
  const z = sim.homeZone;
  const fridayAt = fridayOf(sim, sim.now);
  const key = dateKey(fridayAt, z);
  const sundayEnd = endOfDay(addDays(fridayAt, 2, z), z);
  const box = sim.universe.boxOffice;
  if (box.weekends.some((w) => w.key === key)) {
    sim.schedule({ at: addDays(sim.now, 7, z), kind: 'studio.weekend', label: 'Weekend Box Office', category: 'system', priority: 91 });
    return;
  }

  const entries: BoxOfficeEntry[] = [];
  for (const release of Object.values(sim.universe.releases)) {
    if (release.dailyBoxOffice.length === 0) continue;
    const days = release.dailyBoxOffice.filter((d) => d.date >= fridayAt && d.date <= sundayEnd);
    if (days.length === 0) continue;
    const project = sim.universe.projects[release.projectId];
    if (!project) continue;
    const weekend = days.reduce((s, d) => s + d.domestic, 0);
    if (weekend <= 0) continue;
    entries.push({
      projectId: project.id, market: release.market ?? 'us', title: project.title, studioId: project.studioId, distributorName: release.distributorName,
      weekend, total: release.totalDomestic, theaters: days[days.length - 1]!.theaters,
      week: Math.max(1, Math.floor(daysBetween(release.openingDate, fridayAt, z) / 7) + 1),
      onRecord: Boolean(project.catalogueQid), yours: isPlayersProject(sim, project),
    });
  }
  for (const lump of box.pending.filter((p) => p.key === key)) entries.push(lump.entry);
  box.pending = box.pending.filter((p) => p.key > key);

  // Every market has its own chart; the top of each is kept.
  entries.sort((a, b) => b.weekend - a.weekend);
  const perMarket = new Map<string, number>();
  const top = entries.filter((e) => { const n = perMarket.get(e.market) ?? 0; perMarket.set(e.market, n + 1); return n < TOP_ENTRIES; });
  box.weekends.push({ key, fridayAt, entries: top });
  if (box.weekends.length > WEEKEND_CAP) box.weekends.splice(0, box.weekends.length - WEEKEND_CAP);

  const year = String(zonedParts(fridayAt, z).year);
  const ytd = (box.yearToDate[year] ??= {});
  for (const entry of entries) {
    const studioKey = entry.studioId && STUDIOS.get(entry.studioId) ? entry.studioId : 'other';
    const market = (ytd[entry.market] ??= {});
    market[studioKey] = (market[studioKey] ?? 0) + entry.weekend;
    if (studioKey !== 'other') {
      const state = studioState(sim, studioKey);
      state.yearGross[year] = (state.yearGross[year] ?? 0) + entry.weekend;
    }
  }

  const winner = top.find((e) => e.market === 'us') ?? top[0];
  if (winner) {
    const podium = top.slice(0, 3).map((e, i) => `${i + 1}. ${e.title} ${formatMoneyCompact(e.weekend)}`).join(' · ');
    recordTrade(sim, { kind: 'weekend', headline: `${winner.title} wins the weekend with ${formatMoneyCompact(winner.weekend)}`, detail: `${podium}.${winner.week === 1 ? ' An opening.' : ` Weekend ${winner.week}.`}`, studioId: winner.studioId, projectId: winner.projectId });
    if (winner.studioId && STUDIOS.get(winner.studioId)) {
      recordNews(sim, 'studio', winner.studioId, { kind: 'weekend', title: `${winner.title} Won The Weekend`, detail: `${formatMoneyCompact(winner.weekend)} Friday to Sunday, ${formatMoneyCompact(winner.total)} so far.`, projectId: winner.projectId });
    }
  }
  const yours = top.findIndex((e) => e.yours);
  if (yours >= 0) {
    const mine = top[yours]!;
    const ahead = top.filter((e) => e.market === mine.market).filter((e) => e.weekend > mine.weekend).map((e) => e.title);
    sim.notify({
      category: 'release',
      title: `${mine.title} finished #${ahead.length + 1} for the weekend`,
      body: `${formatMoneyCompact(mine.weekend)} Friday to Sunday${ahead.length > 0 ? `, behind ${ahead.slice(0, 2).join(' and ')}` : ', the biggest picture in the country'}.`,
      importance: 70, route: '/workspace/industry', refType: 'project', refId: mine.projectId,
    });
  }
  sim.emit('studio.weekend_counted', { key, entries: top.length, winner: winner?.title });
  sim.schedule({ at: addDays(sim.now, 7, z), kind: 'studio.weekend', label: 'Weekend Box Office', category: 'system', priority: 91 });
}

/**
 * The world's own lump-sum releases count too. Their gross arrives after the
 * fact, so it is spread across the four weekends from the opening and slotted
 * into the chart where it belongs.
 */
function countLumpRelease(sim: Simulation, project: Project): void {
  if (!project.releaseDate || project.boxOfficeDomestic <= 0) return;
  const theatrical = project.releaseStrategy === 'wide_theatrical' || project.releaseStrategy === 'limited_theatrical' || project.releaseStrategy === 'platform';
  if (!theatrical) return;
  const z = sim.homeZone;
  const box = sim.universe.boxOffice;
  const shares = [0.38, 0.22, 0.13, 0.08];
  const opening = fridayOf(sim, project.releaseDate);
  const theaters = project.releaseStrategy === 'wide_theatrical' ? 2600 : project.releaseStrategy === 'limited_theatrical' ? 600 : 40;
  let running = 0;
  shares.forEach((share, i) => {
    const fridayAt = addDays(opening, i * 7, z);
    const key = dateKey(fridayAt, z);
    const weekend = Math.round(project.boxOfficeDomestic * share);
    running += weekend;
    const entry: BoxOfficeEntry = {
      projectId: project.id, market: project.productionCountryId ?? 'us', title: project.title, studioId: project.studioId, distributorName: project.distributorName ?? 'Independent',
      weekend, total: running, theaters: Math.round(theaters * (1 - i * 0.18)), week: i + 1, onRecord: false, yours: false,
    };
    const counted = box.weekends.find((w) => w.key === key);
    if (counted) {
      counted.entries.push(entry);
      counted.entries.sort((a, b) => b.weekend - a.weekend);
      const seen = new Map<string, number>();
      counted.entries = counted.entries.filter((e) => { const n = seen.get(e.market) ?? 0; seen.set(e.market, n + 1); return n < TOP_ENTRIES; });
      const year = String(zonedParts(fridayAt, z).year);
      const ytd = (box.yearToDate[year] ??= {});
      const market = (ytd[entry.market] ??= {});
      const studioKey = entry.studioId && STUDIOS.get(entry.studioId) ? entry.studioId : 'other';
      market[studioKey] = (market[studioKey] ?? 0) + weekend;
      if (studioKey !== 'other') { const state = studioState(sim, studioKey); state.yearGross[year] = (state.yearGross[year] ?? 0) + weekend; }
    } else {
      box.pending.push({ key, entry });
    }
  });
  if (box.pending.length > 400) box.pending.splice(0, box.pending.length - 400);
}

// ---------------------------------------------------------------------------
// Results move the studios
// ---------------------------------------------------------------------------

function onResultsFinal(sim: Simulation, event: WorldEvent): void {
  const payload = event.payload as { projectId: Id; worldGross: Money; profit: Money; criticScore?: number };
  const project = sim.universe.projects[payload.projectId];
  if (!project?.studioId || !STUDIOS.get(project.studioId)) return;
  const state = studioState(sim, project.studioId);
  const year = String(zonedParts(sim.now, sim.homeZone).year);
  const results = (state.yearResults[year] ??= { releases: 0, hits: 0, flops: 0 });
  const gross = payload.worldGross;
  const hit = project.budget > 0 && gross >= project.budget * 2.5;
  const flop = project.budget > 0 && gross < project.budget * 1.2;
  if (hit) results.hits++;
  if (flop) results.flops++;
  if (isPlayersProject(sim, project)) {
    const roi = project.totalCost > 0 ? payload.profit / project.totalCost : 0;
    const critics = payload.criticScore ?? project.criticScore ?? 50;
    const delta = Math.round(clamp(remap(roi, -0.6, 1.5, -8, 8), -8, 8) + (critics >= 75 ? 3 : critics < 40 ? -2 : 0));
    adjustStanding(sim, 'studio', project.studioId, delta, delta >= 0 ? `${project.title} made them money.` : `${project.title} lost them money.`);
    if (project.networkId) adjustStanding(sim, 'network', project.networkId, Math.round(delta / 2), `${project.title} for them.`);
  } else if (project.catalogueQid) {
    recordNews(sim, 'studio', project.studioId, { kind: 'release', title: hit ? `${project.title} Was A Hit` : flop ? `${project.title} Lost Money` : `${project.title} Did Its Business`, detail: `${formatMoneyCompact(gross)} worldwide against ${formatMoneyCompact(project.budget)}.`, projectId: project.id });
    if (hit || flop) recordTrade(sim, { kind: 'release', headline: hit ? `${project.title} finishes as a hit for ${STUDIOS.get(project.studioId)?.shortName}` : `${project.title} will not recoup for ${STUDIOS.get(project.studioId)?.shortName}`, detail: `${formatMoneyCompact(gross)} worldwide against a ${formatMoneyCompact(project.budget)} budget.`, studioId: project.studioId, projectId: project.id });
  }
}

// ---------------------------------------------------------------------------
// Monthly: standing settles, deals expire, offers arrive
// ---------------------------------------------------------------------------

function dealFee(kind: TalentDeal['kind'], counterpartyId: string, standing: number): Money {
  const buyer = BUYERS.get(counterpartyId);
  const ceiling = buyer?.budgetCeiling ?? 50_000_000_00;
  const base = kind === 'first_look' ? clamp(ceiling * 0.004, 250_000_00, 3_000_000_00) : clamp(ceiling * 0.01, 400_000_00, 5_000_000_00);
  return Math.round(base * (1 + standing / 200) / 10_000_00) * 10_000_00;
}

function playerHits(sim: Simulation, television: boolean): number {
  return Object.values(sim.universe.projects).filter((p) => isPlayersProject(sim, p)
    && (p.phase === 'released' || p.phase === 'library')
    && (television ? p.format === 'series' || p.format === 'limited_series' : p.format === 'feature' || p.format === 'documentary')
    && ((p.criticScore ?? 0) >= 65 || (p.totalCost > 0 && p.totalRevenue > p.totalCost))).length;
}

function offerDeals(sim: Simulation): void {
  const openOffer = Object.values(sim.universe.decisions).some((d) => d.refType === 'deal' && !d.resolvedAt && !d.dismissedAt);
  if (openOffer) return;
  const z = sim.homeZone;
  for (const kind of ['first_look', 'overall'] as const) {
    if (activeDeal(sim, { kind })) continue;
    const television = kind === 'overall';
    if (playerHits(sim, television) < (television ? 1 : 2)) continue;
    const companyKind: CompanyKind = television ? 'network' : 'studio';
    const states = Object.values(television ? sim.universe.networks : sim.universe.studios).filter((s) => s.standing >= 68 && !s.closing).sort((a, b) => b.standing - a.standing);
    const suitor = states[0];
    if (!suitor) continue;
    const buyer = BUYERS.get(suitor.id);
    if (!buyer) continue;
    const fee = dealFee(kind, suitor.id, suitor.standing);
    const ref = `${kind}|${suitor.id}`;
    const terms = { kind, counterpartyKind: companyKind, counterpartyId: suitor.id, counterpartyName: buyer.name, annualFee: fee, exclusiveDays: 30, years: 2 };
    sim.requireDecision({
      urgency: 76, category: 'career',
      title: kind === 'first_look' ? `${buyer.name} offers you a first-look deal` : `${buyer.name} offers you an overall deal`,
      detail: `${formatMoney(fee)} a year in overhead for two years. ${buyer.name} sees every ${television ? 'series' : 'feature'} you develop first and has thirty days to say yes before anyone else may. Standing with them: ${Math.round(suitor.standing)}.`,
      route: '/workspace/industry',
      actions: [
        { label: 'Sign', commandKind: 'studio.accept_deal', payload: { offerRef: ref, ...terms } },
        { label: 'Pass', commandKind: 'studio.decline_deal', payload: { offerRef: ref } },
      ],
      dueAt: addDays(sim.now, 30, z),
      refType: 'deal', refId: ref,
    });
    recordNews(sim, companyKind, suitor.id, { kind: 'deal', title: `Offered You ${kind === 'first_look' ? 'A First-Look Deal' : 'An Overall Deal'}`, detail: `${formatMoney(fee)} a year for two years, thirty days of exclusivity on everything you develop.` });
    sim.emit('studio.deal_offered', { kind, counterpartyId: suitor.id, fee });
    return;
  }
}

function monthlyReview(sim: Simulation): void {
  const z = sim.homeZone;
  for (const state of [...Object.values(sim.universe.studios), ...Object.values(sim.universe.networks)]) {
    // Standing settles toward a stranger's, slowly, in both directions.
    state.standing = Math.round((state.standing + (30 - state.standing) * 0.02) * 10) / 10;
  }
  for (const deal of Object.values(sim.universe.talentDeals)) {
    if (deal.status === 'active' && deal.endsAt <= sim.now) {
      deal.status = 'expired';
      deal.endedReason = 'The term ran out.';
      recordNews(sim, deal.counterpartyKind, deal.counterpartyId, { kind: 'deal', title: 'Your Deal Ran Its Term', detail: `${deal.projectsShown} projects shown, ${formatMoneyCompact(deal.paidTotal)} paid in overhead.` });
      sim.notify({ category: 'career', title: `Your deal with ${deal.counterpartyName} ran its term`, body: 'They may come back with another if they still think enough of you.', importance: 55, route: '/workspace/industry' });
    }
  }
  offerDeals(sim);
  sim.schedule({ at: firstOfNextMonth(sim), kind: 'studio.month', label: 'The Studios, Monthly', category: 'system', priority: 92 });
  void z;
}

// ---------------------------------------------------------------------------
// Yearly: mood, strategy, seats
// ---------------------------------------------------------------------------

function yearlyReview(sim: Simulation): void {
  const z = sim.homeZone;
  const year = zonedParts(sim.now, z).year - 1;
  const key = String(year);
  const previous = String(year - 1);
  const rng = sim.rng('studio_year', year);

  for (const studio of STUDIOS.all()) {
    const state = studioState(sim, studio.id);
    const gross = state.yearGross[key] ?? 0;
    const before = state.yearGross[previous];
    const results = state.yearResults[key];
    const trend = before && before > 0 ? clamp(remap(gross / before, 0.6, 1.4, -15, 15), -15, 15) : 0;
    const hitRate = results && results.releases > 0 ? (results.hits - results.flops) / results.releases : 0;
    const settle = (55 - state.confidence) * 0.15;
    state.confidence = clamp(Math.round(state.confidence + trend + hitRate * 20 + settle), 5, 95);
    if (!state.closing) {
      const franchiseShare = results && results.releases > 0
        ? Object.values(sim.universe.projects).filter((p) => p.studioId === studio.id && p.catalogueQid && UPCOMING_SLATE.find((t) => t.qid === p.catalogueQid)?.franchise && p.releaseDate && zonedParts(p.releaseDate, z).year === year).length / results.releases
        : 0;
      const strategy: StudioState['strategy'] = state.confidence <= 35 ? 'cost_cutting'
        : state.confidence >= 70 ? 'expansion'
        : franchiseShare >= 0.5 ? 'franchise_first'
        : studio.prestigeBias >= 70 ? 'prestige'
        : studio.slateSize >= 20 ? 'volume'
        : 'steady';
      const changed = strategy !== state.strategy;
      state.strategy = strategy;
      state.slateMultiplier = strategy === 'cost_cutting' ? 0.8 : strategy === 'expansion' ? 1.15 : strategy === 'volume' ? 1.1 : 1;
      state.riskDrift = strategy === 'cost_cutting' ? -8 : strategy === 'expansion' ? 4 : Math.round(state.riskDrift / 2);
      state.prestigeDrift = strategy === 'prestige' ? 6 : Math.round(state.prestigeDrift / 2);
      if (changed && (gross > 0 || results)) {
        recordNews(sim, 'studio', studio.id, { kind: 'year', title: `${year}: ${STRATEGY_LABEL[strategy]}`, detail: `${formatMoneyCompact(gross)} domestic across ${results?.releases ?? 0} releases, ${results?.hits ?? 0} hits and ${results?.flops ?? 0} misses. Confidence ${state.confidence}.` });
      }
    }

    // A seat changes hands about one year in eight; more after a bad year.
    const hazard = state.closing ? 0.4 : state.confidence < 35 ? 0.28 : state.confidence > 70 ? 0.08 : 0.12;
    const roster = liveLeadership(sim, 'studio', studio.id);
    const leaving = roster.find(() => rng.chance(hazard));
    if (leaving && roster.length > 0) {
      const name = generatePersonName(rng);
      const successor = `${name.first} ${name.last}`;
      const reason = state.confidence < 35 ? 'after a difficult year' : state.closing ? 'as the studio wound down' : 'to move on';
      state.leadership = roster.map((l) => (l === leaving ? { name: successor, title: l.title, since: sim.now, generated: true } : l));
      state.leadershipChanges.push({ at: sim.now, left: leaving.name, title: leaving.title, successor, generated: true, reason });
      state.riskDrift += rng.int(-6, 6);
      state.prestigeDrift += rng.int(-6, 6);
      // New bosses do not know you.
      if (state.standing > 30) state.standing = Math.round((30 + (state.standing - 30) * 0.7) * 10) / 10;
      recordNews(sim, 'studio', studio.id, { kind: 'leadership', title: `${leaving.name} Leaves`, detail: `${leaving.title}, ${reason}. ${successor} takes the seat. SLATE's successor, not a real person.` });
      recordTrade(sim, { kind: 'leadership', headline: `${leaving.name} out at ${studio.shortName}`, detail: `${leaving.title}, ${reason}. ${successor} steps in. A simulated succession.`, studioId: studio.id });
    }
  }

  for (const network of NETWORKS.all()) {
    const state = sim.universe.networks[network.id];
    if (!state) continue;
    const roster = liveLeadership(sim, 'network', network.id);
    const leaving = roster.find(() => rng.chance(state.closing ? 0.4 : 0.1));
    if (leaving) {
      const name = generatePersonName(rng);
      const successor = `${name.first} ${name.last}`;
      state.leadership = roster.map((l) => (l === leaving ? { name: successor, title: l.title, since: sim.now, generated: true } : l));
      state.leadershipChanges.push({ at: sim.now, left: leaving.name, title: leaving.title, successor, generated: true, reason: 'to move on' });
      if (state.standing > 30) state.standing = Math.round((30 + (state.standing - 30) * 0.7) * 10) / 10;
      recordNews(sim, 'network', network.id, { kind: 'leadership', title: `${leaving.name} Leaves`, detail: `${leaving.title}. ${successor} takes the seat. SLATE's successor, not a real person.` });
      recordTrade(sim, { kind: 'leadership', headline: `${leaving.name} out at ${network.shortName}`, detail: `${leaving.title}. ${successor} steps in. A simulated succession.`, networkId: network.id });
    }
  }

  const table = marketShare(sim, year, 'us').filter((r) => r.studioId !== 'other').slice(0, 5);
  if (table.length > 0) {
    recordTrade(sim, { kind: 'year', headline: `${year} at the box office: ${STUDIOS.get(table[0]!.studioId)?.shortName} on top`, detail: table.map((r, i) => `${i + 1}. ${STUDIOS.get(r.studioId)?.shortName ?? r.name} ${formatMoneyCompact(r.gross)} (${Math.round(r.share * 100)}%)`).join(' · ') + '.', studioId: table[0]!.studioId });
  }
  sim.emit('studio.year_reviewed', { year });
  sim.schedule({ at: nextJanuary(sim), kind: 'studio.year', label: 'The Studios, Yearly', category: 'system', priority: 93 });
}

export const STRATEGY_LABEL: Readonly<Record<StudioState['strategy'], string>> = {
  steady: 'Steady As It Goes', franchise_first: 'Franchises First', prestige: 'Chasing Prestige', volume: 'Volume', cost_cutting: 'Cutting Costs', expansion: 'Expanding',
};

// ---------------------------------------------------------------------------
// What is pending on the record resolves
// ---------------------------------------------------------------------------

function resolveCorporateEvent(sim: Simulation, eventId: string): void {
  const event: CorporateEvent | undefined = corporateEvent(eventId);
  if (!event) return;
  const state = event.subjectKind === 'studio' ? studioState(sim, event.subjectId) : networkState(sim, event.subjectId);
  if (state.corporate.some((c) => c.eventId === event.id)) return;
  const company = event.subjectKind === 'studio' ? STUDIOS.get(event.subjectId) : NETWORKS.get(event.subjectId);
  if (!company) return;

  const rng = sim.rng('corporate', event.id, 'outcome');
  const roll = rng.next();
  let acc = 0;
  let outcome = event.outcomes[event.outcomes.length - 1]!;
  for (const o of event.outcomes) { acc += o.chance; if (roll < acc) { outcome = o; break; } }
  const fx = outcome.effects;

  if (fx.parent !== undefined) state.parentOverride = fx.parent;
  if (fx.status !== undefined) state.statusOverride = fx.status;
  if (fx.closing) state.closing = true;
  if (fx.confidence) state.confidence = clamp(state.confidence + fx.confidence, 5, 95);
  if (fx.standingMultiplier !== undefined) state.standing = Math.round(30 + (state.standing - 30) * fx.standingMultiplier);
  if (event.subjectKind === 'studio') {
    const s = state as StudioState;
    if (fx.ownership !== undefined) s.ownershipOverride = fx.ownership;
    if (fx.slateMultiplier !== undefined) s.slateMultiplier = fx.slateMultiplier;
    if (fx.strategy) s.strategy = fx.strategy;
  }
  for (const seat of fx.leaves ?? []) {
    const roster = liveLeadership(sim, event.subjectKind, event.subjectId);
    const leaving = roster.find((l) => l.name === seat.name);
    if (!leaving) continue;
    const generated = !seat.successor;
    const successor = seat.successor ?? (() => { const n = generatePersonName(rng); return `${n.first} ${n.last}`; })();
    state.leadership = roster.map((l) => (l === leaving ? { name: successor, title: seat.successorTitle ?? l.title, since: sim.now, generated } : l));
    state.leadershipChanges.push({ at: sim.now, left: leaving.name, title: leaving.title, successor, generated, reason: outcome.label.toLowerCase() });
  }
  state.corporate.push({ eventId: event.id, outcomeId: outcome.id, at: sim.now, note: outcome.note });

  sim.audit({
    kind: 'studio.corporate_event', subjectType: event.subjectKind, subjectId: event.subjectId,
    question: `How did ${event.label.toLowerCase()} end?`,
    summary: `${outcome.label}. ${outcome.note} This is the save's simulation of something the record left pending.`,
    factors: event.outcomes.map((o) => ({ label: o.label, detail: `${Math.round(o.chance * 100)}% on the day. ${o.note}`, weight: o.chance, contribution: o.id === outcome.id ? 1 : 0, knowable: true })),
    seed: `corporate|${event.id}`, roll, probability: outcome.chance,
    outcome: outcome.id,
  });
  recordNews(sim, event.subjectKind, event.subjectId, { kind: 'corporate', title: outcome.label, detail: `${outcome.note} Simulation, not record.` });
  recordTrade(sim, { kind: 'corporate', headline: `${company.shortName}: ${outcome.label.toLowerCase()}`, detail: `${event.record} In this universe: ${outcome.note}`, ...(event.subjectKind === 'studio' ? { studioId: event.subjectId } : { networkId: event.subjectId }) });
  const involved = state.standing >= 50 || Object.values(sim.universe.projects).some((p) => isPlayersProject(sim, p) && (p.studioId === event.subjectId || p.networkId === event.subjectId));
  if (involved) {
    sim.notify({ category: 'career', title: `${company.shortName}: ${outcome.label}`, body: outcome.note, importance: 60, route: '/workspace/industry' });
  }
  sim.emit('studio.corporate_resolved', { eventId: event.id, outcomeId: outcome.id, subjectId: event.subjectId });
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

function holderAccount(sim: Simulation, holderId: Id, holderKind: 'person' | 'company'): Id | undefined {
  return holderKind === 'company' ? sim.universe.companies[holderId]?.cashAccountId : sim.universe.people[holderId]?.primaryAccountId;
}

function payDealFee(sim: Simulation, dealId: Id): void {
  const deal = sim.universe.talentDeals[dealId];
  if (!deal || deal.status !== 'active') return;
  if (deal.endsAt <= sim.now) { deal.status = 'expired'; deal.endedReason = 'The term ran out.'; return; }
  const account = holderAccount(sim, deal.holderId, deal.holderKind);
  if (account) {
    sim.income(account, deal.annualFee, `${deal.counterpartyName} — overhead`, 'overhead', { refType: 'deal', refId: deal.id });
    deal.paidTotal += deal.annualFee;
  }
  sim.schedule({ at: addYears(sim.now, 1, sim.homeZone), kind: 'studio.deal_fee', label: `${deal.counterpartyName} Overhead`, category: 'business', priority: 30, payload: { dealId: deal.id }, refType: 'deal', refId: deal.id });
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerStudios(sim: Simulation): void {
  sim.onSchedule('studio.slate_release', (item) => releaseFromRecord(sim, item.payload.qid as string, item.payload.studioId as string));
  sim.onSchedule('studio.weekend', () => compileWeekend(sim));
  sim.onSchedule('studio.month', () => monthlyReview(sim));
  sim.onSchedule('studio.year', () => yearlyReview(sim));
  sim.onSchedule('studio.corporate_event', (item) => resolveCorporateEvent(sim, item.payload.eventId as string));
  sim.onSchedule('studio.deal_fee', (item) => payDealFee(sim, item.payload.dealId as Id));

  // What the player brings, and what it does, moves their standing.
  const payloadOf = (event: WorldEvent): Record<string, unknown> => (event.payload ?? {}) as Record<string, unknown>;
  sim.onEvent('film.pitch_interested', 'studios.standing', (event) => {
    const payload = payloadOf(event);
    const buyer = BUYERS.get(String(payload.buyerId));
    const project = sim.universe.projects[String(payload.projectId)];
    if (!buyer || !project) return;
    if (buyer.studioId) adjustStanding(sim, 'studio', buyer.studioId, 2, `Wanted ${project.title}.`);
    if (buyer.networkId) adjustStanding(sim, 'network', buyer.networkId, 2, `Wanted ${project.title}.`);
  });
  sim.onEvent('project.results_final', 'studios.results', (event) => onResultsFinal(sim, event));
  sim.onEvent('film.released', 'studios.lump', (event) => {
    const payload = payloadOf(event);
    if (!payload.background) return;
    const project = sim.universe.projects[String(payload.projectId)];
    if (project) countLumpRelease(sim, project);
  });
  sim.onEvent('ip.licensed', 'studios.licence', (event) => {
    const payload = payloadOf(event);
    adjustStanding(sim, 'studio', String(payload.studioId), 3, `Licensed ${titleCaseLabel(String(sim.universe.franchises[String(payload.franchiseId)]?.name ?? 'a franchise'))} to you.`);
  });
  sim.onEvent('fest.acquired', 'studios.festival', (event) => {
    const payload = payloadOf(event);
    const studioId = payload.studioId as string | undefined;
    if (studioId && STUDIOS.get(studioId)) adjustStanding(sim, 'studio', studioId, 3, `Bought ${sim.universe.projects[String(payload.projectId)]?.title ?? 'your film'} out of a festival.`);
  });
  sim.onEvent('award.won', 'studios.award', (event) => {
    const project = sim.universe.projects[String(payloadOf(event).projectId)];
    if (!project || !isPlayersProject(sim, project)) return;
    if (project.studioId) adjustStanding(sim, 'studio', project.studioId, 2, `${project.title} won for them.`);
    if (project.networkId) adjustStanding(sim, 'network', project.networkId, 2, `${project.title} won for them.`);
  });

  sim.onCommand<{ offerRef: string }, { dealId: Id; annualFee: Money }>(
    'studio.accept_deal',
    (p, { sim: s }) => {
      const offer = Object.values(s.universe.decisions).find((d) => d.refType === 'deal' && d.refId === p.offerRef && !d.resolvedAt && !d.dismissedAt);
      if (!offer) throw new CommandError('There is no offer standing.');
      const terms = offer.actions.find((a) => a.commandKind === 'studio.accept_deal')?.payload as { kind: TalentDeal['kind']; counterpartyKind: CompanyKind; counterpartyId: string; counterpartyName: string; annualFee: Money; exclusiveDays: number; years: number } | undefined;
      if (!terms) throw new CommandError('The offer carries no terms.');
      if (offer.dueAt && s.now > offer.dueAt) { s.resolveDecision('deal', p.offerRef); throw new CommandError('The offer has lapsed.'); }
      if (activeDeal(s, { kind: terms.kind })) { s.resolveDecision('deal', p.offerRef); throw new CommandError(`You already hold ${terms.kind === 'first_look' ? 'a first-look' : 'an overall'} deal. One at a time.`); }
      const holderId = s.player.id;
      const account = holderAccount(s, holderId, 'person');
      if (!account) throw new CommandError('No account to be paid into.');
      s.resolveDecision('deal', p.offerRef);
      const deal: TalentDeal = {
        id: s.nextId('deal'), saveId: s.universe.meta.id,
        kind: terms.kind, counterpartyKind: terms.counterpartyKind, counterpartyId: terms.counterpartyId, counterpartyName: terms.counterpartyName,
        holderId, holderKind: 'person',
        annualFee: terms.annualFee, exclusiveDays: terms.exclusiveDays,
        startsAt: s.now, endsAt: addYears(s.now, terms.years, s.homeZone), status: 'active', projectsShown: 0, paidTotal: 0,
      };
      s.universe.talentDeals[deal.id] = deal;
      s.income(account, deal.annualFee, `${deal.counterpartyName} — overhead`, 'overhead', { refType: 'deal', refId: deal.id });
      deal.paidTotal += deal.annualFee;
      s.schedule({ at: addYears(s.now, 1, s.homeZone), kind: 'studio.deal_fee', label: `${deal.counterpartyName} Overhead`, category: 'business', priority: 30, payload: { dealId: deal.id }, refType: 'deal', refId: deal.id });
      adjustStanding(s, terms.counterpartyKind, terms.counterpartyId, 5, 'Signed with them.');
      recordNews(s, terms.counterpartyKind, terms.counterpartyId, { kind: 'deal', title: 'You Signed', detail: `${formatMoney(deal.annualFee)} a year for ${terms.years} years. They see everything first.` });
      recordTrade(s, { kind: 'deal', headline: `${s.player.firstName} ${s.player.lastName} signs ${terms.kind === 'first_look' ? 'a first-look' : 'an overall'} deal at ${terms.counterpartyName}`, detail: `${terms.years} years. Terms not disclosed.`, ...(terms.counterpartyKind === 'studio' ? { studioId: terms.counterpartyId } : { networkId: terms.counterpartyId }) });
      s.remember({ category: 'career', title: `Signed ${terms.kind === 'first_look' ? 'a first-look' : 'an overall'} deal at ${terms.counterpartyName}`, detail: `${formatMoney(deal.annualFee)} a year in overhead. They see everything first.`, refs: [], significance: 75, public: true });
      s.emit('studio.deal_signed', { dealId: deal.id, kind: deal.kind, counterpartyId: deal.counterpartyId });
      return { dealId: deal.id, annualFee: deal.annualFee };
    },
  );

  sim.onCommand<{ offerRef: string }, { declined: boolean }>(
    'studio.decline_deal',
    (p, { sim: s }) => {
      const offer = Object.values(s.universe.decisions).find((d) => d.refType === 'deal' && d.refId === p.offerRef && !d.resolvedAt && !d.dismissedAt);
      if (!offer) throw new CommandError('There is no offer standing.');
      s.resolveDecision('deal', p.offerRef);
      return { declined: true };
    },
  );

  sim.onCommand<{ dealId: Id }, { ended: boolean }>(
    'studio.end_deal',
    (p, { sim: s }) => {
      const deal = s.universe.talentDeals[p.dealId];
      if (!deal || deal.status !== 'active') throw new CommandError('No active deal by that name.');
      if (deal.holderId !== s.player.id) throw new CommandError('That is not your deal to end.');
      deal.status = 'ended';
      deal.endedReason = 'You walked away.';
      adjustStanding(s, deal.counterpartyKind, deal.counterpartyId, -6, 'Walked away from the deal.');
      recordNews(s, deal.counterpartyKind, deal.counterpartyId, { kind: 'deal', title: 'You Walked Away', detail: `${deal.projectsShown} projects shown, ${formatMoneyCompact(deal.paidTotal)} paid.` });
      s.emit('studio.deal_ended', { dealId: deal.id });
      return { ended: true };
    },
  );

  // Asking the distributor to put more behind your picture.
  sim.onCommand<{ projectId: Id }, { granted: boolean; amount: Money }>(
    'studio.request_pa',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!isPlayersProject(s, project)) throw new CommandError('That is not your picture.');
      const studio = project.studioId ? STUDIOS.get(project.studioId) : undefined;
      if (!studio) throw new CommandError(`${project.title} has no studio behind it to ask.`);
      const campaign = Object.values(s.universe.marketingCampaigns).find((c) => c.projectId === project.id);
      if (!campaign) throw new CommandError('Plan the campaign first. There is nothing to add to.');
      if (campaign.studioPush) throw new CommandError(`You have already asked ${studio.shortName} once. They do not enjoy being asked twice.`);
      const release = Object.values(s.universe.releases).find((r) => r.projectId === project.id);
      if (release && release.status !== 'planned') throw new CommandError('It is already out. The campaign is spent.');

      const standing = studioState(s, studio.id).standing;
      const quality = project.finalQuality ?? 50;
      const tomatometer = project.reception?.tomatometer;
      const { factors, score } = buildFactors([
        { label: 'Your Standing With Them', detail: `${studio.shortName} reads you at ${Math.round(standing)} out of 100.`, weight: 0.4, value: standing / 100 },
        { label: 'What They Have Seen', detail: `The picture reads ${quality} out of 100 in the room.`, weight: 0.3, value: quality / 100 },
        { label: 'Early Reviews', detail: tomatometer !== undefined ? `Tomatometer at ${tomatometer}% so far.` : 'No reviews yet.', weight: 0.2, value: tomatometer !== undefined ? tomatometer / 100 : 0.5 },
        { label: 'How Much Is Already Committed', detail: `${formatMoneyCompact(campaign.budget)} in the campaign.`, weight: 0.1, value: clamp(1 - campaign.budget / (project.budget || 1), 0, 1) },
      ]);
      const rng = s.rng('pa_push', project.id);
      const probability = clamp(score * 1.1 - 0.15, 0.05, 0.9);
      const roll = rng.next();
      const granted = roll < probability;
      const amount = granted ? Math.round(campaign.budget * rng.float(0.2, 0.5) / 100_000_00) * 100_000_00 : 0;
      if (granted) {
        campaign.budget += amount;
        campaign.spent += amount;
        campaign.awareness = clamp(campaign.awareness + remap(amount, 0, 20_000_000_00, 4, 16), 0, 100);
        campaign.intent = clamp(campaign.intent + 3, 0, 100);
        adjustStanding(s, 'studio', studio.id, 1, `Bet more on ${project.title}.`);
      } else {
        adjustStanding(s, 'studio', studio.id, -2, `Pushed for money on ${project.title} they did not want to spend.`);
      }
      campaign.studioPush = { at: s.now, granted, amount };
      s.audit({
        kind: 'studio.pa_request', subjectType: 'project', subjectId: project.id,
        question: `Why did ${studio.shortName} ${granted ? 'put more behind' : 'hold the line on'} ${project.title}?`,
        summary: granted ? `${studio.shortName} added ${formatMoneyCompact(amount)} in prints and advertising.` : `${studio.shortName} kept the campaign where it was.`,
        factors, seed: `pa_push|${project.id}`, roll, probability, score, outcome: granted ? 'granted' : 'refused',
      });
      s.emit('studio.pa_requested', { projectId: project.id, studioId: studio.id, granted, amount });
      return { granted, amount };
    },
  );
}
