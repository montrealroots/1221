/**
 * SLATE — Television, as a schedule rather than a list.
 *
 * A linear network is a week. Twenty-odd slots from eight to eleven, seven
 * nights, and a business built entirely around what sits in each of them.
 * Every week those slots air, every airing gets a number, and every May the
 * network stands up in front of the advertisers and says which of them are
 * coming back. That is the whole rhythm of the industry, and it is what this
 * runs.
 *
 * A streaming service has no slots, so it has a chart instead: what people
 * actually watched that week, in hours, ten deep, the way the services
 * publish it. A show does not get cancelled for a bad Tuesday; it gets
 * dropped for a bad month.
 *
 * The grids start from the real record — the series Wikidata says were airing
 * on each network when the save began — and everything after that is the
 * save's own. The interface says which is which.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type {
  Airing, Id, NetworkSchedule, NetworkState, Project, RecordCategory,
  SaveRecord, ScheduleSlot, StreamingChart, StreamingChartEntry,
} from '../domain/model';
import type { Rng } from '../core/rng';
import { clamp, remap } from '../core/rng';
import { addDays, dateKey, instantFromZoned, zonedParts, MS_MINUTE } from '../core/time';
import { formatMoneyCompact } from '../core/money';
import { NETWORKS, type Network } from '../content/networks';
import { appetiteOf, canonicalGenre, genre, genreName } from '../content/genres';
import { loadBroadcastSeries, isBroadcastSeriesLoaded, seriesOn, type BroadcastSeries } from '../content/filmography';
import { titleCaseLabel } from '../core/text';
import { isPlayersProject, networkState, recordNews, recordTrade } from './studio-state';

const AIRING_CAP = 300;
const CHART_CAP = 120;
const RECORDS_PER_CATEGORY = 10;

/** Primetime, as the American networks lay it out: three hours from eight. */
const PRIMETIME_SLOTS = [
  { start: 20 * 60, minutes: 60 },
  { start: 21 * 60, minutes: 60 },
  { start: 22 * 60, minutes: 60 },
] as const;

/**
 * What a night is worth relative to a Wednesday. Sunday is the biggest night
 * on television and Friday and Saturday are where a network puts what it has
 * stopped believing in.
 */
const NIGHT_WEIGHT: readonly number[] = [1.22, 1.02, 1.0, 1.0, 0.98, 0.62, 0.55];
const NIGHT_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** The hour inside the night: nine is the best of them, ten the worst. */
const HOUR_WEIGHT: Readonly<Record<number, number>> = { [20 * 60]: 0.95, [21 * 60]: 1.0, [22 * 60]: 0.82 };

/**
 * How young a genre plays, which is what turns a total audience into an
 * eighteen-to-forty-nine rating. A procedural is watched by everybody and
 * sells to nobody; a comedy is the other way round.
 */
const DEMO_SKEW: Readonly<Record<string, number>> = {
  procedural: 0.7, legal: 0.75, medical: 0.95, news: 0.5, 'soap-opera': 0.6,
  drama: 1.0, crime: 0.85, mystery: 0.8, western: 0.6, historical: 0.7,
  comedy: 1.9, 'romantic-comedy': 1.9, 'dark-comedy': 1.8, satire: 1.7, workplace: 1.8, mockumentary: 1.8,
  teen: 2.4, school: 2.2, 'coming-of-age': 2.0, animation: 1.9, children: 1.5,
  reality: 1.6, 'game-show': 0.9, 'talk-show': 1.1, variety: 1.4, cooking: 0.9,
  horror: 1.8, thriller: 1.3, 'science-fiction': 1.5, fantasy: 1.5, superhero: 1.7,
  sport: 1.4, documentary: 0.8, 'true-crime': 1.2,
};

// ---------------------------------------------------------------------------
// The season
// ---------------------------------------------------------------------------

/** The television season a date falls in, as the business writes it. */
export function seasonOf(sim: Simulation, at = sim.now): string {
  const p = zonedParts(at, sim.homeZone);
  const start = p.month >= 6 ? p.year : p.year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

/** Whether a network runs a week at all. A service does not. */
export function isLinear(network: Network): boolean {
  return network.type === 'broadcast' || network.type === 'cable' || network.type === 'premium';
}

function nextMonday(sim: Simulation, hour = 3): number {
  const z = sim.homeZone;
  const p = zonedParts(sim.now, z);
  const ahead = (8 - p.weekday) % 7 || 7;
  return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour }, z) + ahead * 24 * 60 * MS_MINUTE;
}

/** The upfronts: the third Monday of May, when the schedules are announced. */
function nextUpfront(sim: Simulation): number {
  const z = sim.homeZone;
  const year = zonedParts(sim.now, z).year;
  for (const y of [year, year + 1]) {
    const may = instantFromZoned({ year: y, month: 5, day: 1, hour: 11 }, z);
    const firstWeekday = zonedParts(may, z).weekday;
    const toMonday = (8 - firstWeekday) % 7;
    const at = addDays(may, toMonday + 14, z);
    if (at > sim.now) return at;
  }
  return addDays(sim.now, 365, z);
}

function hasPending(sim: Simulation, kind: string): boolean {
  return sim.universe.scheduled.some((s) => s.kind === kind && s.status === 'pending');
}

export function ensureNetworkSchedules(sim: Simulation): void {
  if (!hasPending(sim, 'net.week')) {
    sim.schedule({ at: nextMonday(sim), kind: 'net.week', label: 'The Television Week', category: 'system', priority: 90 });
  }
  if (!hasPending(sim, 'net.upfront')) {
    sim.schedule({ at: nextUpfront(sim), kind: 'net.upfront', label: 'The Upfronts', category: 'system', priority: 84 });
  }
}

// ---------------------------------------------------------------------------
// Building a grid
// ---------------------------------------------------------------------------

function slotKindOf(genres: readonly string[]): ScheduleSlot['kind'] {
  const ids = genres.map(canonicalGenre);
  if (ids.some((g) => g === 'news')) return 'news';
  if (ids.some((g) => g === 'sport')) return 'sport';
  if (ids.some((g) => ['reality', 'game-show', 'talk-show', 'variety', 'cooking'].includes(g))) return 'unscripted';
  return 'series';
}

/** Genres a real series on the record carries, in SLATE's vocabulary. */
function genresOfSeries(series: BroadcastSeries): string[] {
  const ids = (series.slateGenres ?? []).map(canonicalGenre).filter((g: string) => genre(g));
  return ids.length > 0 ? ids.slice(0, 3) : ['drama'];
}

/**
 * The grid a network starts the save with: what the record says was airing
 * there, arranged across the week the way a network arranges it — the
 * strongest returning shows in the best hours.
 */
function buildOpeningSchedule(sim: Simulation, network: Network, rng: Rng): NetworkSchedule {
  const year = zonedParts(sim.now, sim.homeZone).year;
  // What is actually in primetime. A show with hundreds of episodes is a
  // daytime strip, a soap or a nightly magazine — it is on this network every
  // afternoon, not at nine o'clock — so it does not go in the grid. The rest
  // are ordered by how recently they started, because a network leads with
  // what is new and buries what it has had for a decade.
  const DAYTIME_EPISODES = 800;
  const running = seriesOn(network.broadcasterNames)
    .filter((s) => !s.end || Number(s.end.slice(0, 4)) >= year - 1)
    .filter((s) => !s.start || Number(s.start.slice(0, 4)) <= year)
    .filter((s) => (s.episodes ?? 0) < DAYTIME_EPISODES)
    .filter((s) => !(s.slateGenres ?? []).map(canonicalGenre).includes('soap-opera'))
    .sort((a, b) => {
      const started = (x: BroadcastSeries) => Number((x.start ?? '1900').slice(0, 4));
      return started(b) - started(a) || (b.episodes ?? 0) - (a.episodes ?? 0);
    });

  const slots: ScheduleSlot[] = [];
  const nights = [0, 1, 2, 3, 4, 5, 6].sort((a, b) => (NIGHT_WEIGHT[b] ?? 1) - (NIGHT_WEIGHT[a] ?? 1));
  let index = 0;
  for (const day of nights) {
    for (const slot of PRIMETIME_SLOTS) {
      const series = running[index];
      index++;
      if (!series) continue;
      const genres = genresOfSeries(series);
      slots.push({
        day, start: slot.start, minutes: slot.minutes,
        title: series.title, kind: slotKindOf(genres), catalogueQid: series.qid, genres,
        season: Math.max(1, series.seasons ?? 1),
        episodesAired: series.episodes ?? 0,
        standing: 'safe',
      });
    }
  }
  // What is left of the week is what a network fills with: news, reruns and films.
  for (const day of [0, 1, 2, 3, 4, 5, 6]) {
    for (const slot of PRIMETIME_SLOTS) {
      if (slots.some((s) => s.day === day && s.start === slot.start)) continue;
      const filler = network.type === 'broadcast' && slot.start === 22 * 60 && day < 5
        ? { title: `${network.shortName} News`, kind: 'news' as const, genres: ['news'] }
        : rng.chance(0.4)
          ? { title: `${network.shortName} Movie Night`, kind: 'movie' as const, genres: ['drama'] }
          : { title: 'Repeats', kind: 'reruns' as const, genres: ['drama'] };
      slots.push({ day, start: slot.start, minutes: slot.minutes, ...filler, standing: 'safe' });
    }
  }
  slots.sort((a, b) => a.day - b.day || a.start - b.start);
  return { season: seasonOf(sim), announcedAt: sim.now, slots, renewed: [], cancelled: [], ordered: [] };
}

/** The grid a network is running now, built from the record the first time it is asked for. */
export function scheduleOf(sim: Simulation, networkId: string): NetworkSchedule | undefined {
  const network = NETWORKS.get(networkId);
  if (!network || !isLinear(network)) return undefined;
  const state = networkState(sim, networkId);
  if (state.schedule) return state.schedule;
  if (!isBroadcastSeriesLoaded()) return undefined;
  state.schedule = buildOpeningSchedule(sim, network, sim.rng('net_grid', networkId));
  return state.schedule;
}

/** The week as a grid: seven nights of slots, for the screen. */
export function weekGrid(schedule: NetworkSchedule): { day: number; name: string; slots: ScheduleSlot[] }[] {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day, name: NIGHT_NAME[day]!,
    slots: schedule.slots.filter((s) => s.day === day).sort((a, b) => a.start - b.start),
  }));
}

export function slotTime(start: number): string {
  const hour = Math.floor(start / 60);
  const minute = start % 60;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}${minute > 0 ? `:${String(minute).padStart(2, '0')}` : ''} ${suffix}`;
}

// ---------------------------------------------------------------------------
// A week of television
// ---------------------------------------------------------------------------

/** The audience a network can call on in an average primetime hour, in thousands. */
function baseAudience(network: Network): number {
  const reach = network.reach;
  if (!reach) return 900;
  if (reach.unit === 'primetime viewers') return reach.value / 1000;
  if (reach.unit === 'households') return (reach.value * 0.028) / 1000;
  if (reach.unit === 'subscribers' || reach.unit === 'monthly users') return (reach.value * 0.02) / 1000;
  return 900;
}

function demoSkewOf(genres: readonly string[]): number {
  const values = genres.map(canonicalGenre).map((g) => DEMO_SKEW[g]).filter((v): v is number => v !== undefined);
  return values.length === 0 ? 1.1 : values.reduce((a, b) => a + b, 0) / values.length;
}

/** What a slot did this week. */
function airSlot(sim: Simulation, network: Network, slot: ScheduleSlot, rng: Rng): Airing | undefined {
  if (slot.kind === 'reruns') return undefined;
  const project = slot.projectId ? sim.universe.projects[slot.projectId] : undefined;
  const quality = project?.finalQuality ?? project?.scriptQuality ?? 62;
  const appetite = appetiteOf(slot.genres);

  const night = NIGHT_WEIGHT[slot.day] ?? 1;
  const hour = HOUR_WEIGHT[slot.start] ?? 0.9;
  // A show wears out: the first season is the curiosity, the fourth is the habit,
  // and the ninth is the audience that has not left yet.
  const age = slot.season ?? 1;
  const maturity = age === 1 ? 0.92 : age <= 3 ? 1.06 : age <= 6 ? 1.0 : remap(age, 7, 15, 0.92, 0.7);
  const kindFactor = slot.kind === 'sport' ? 2.4 : slot.kind === 'news' ? 0.85 : slot.kind === 'movie' ? 0.7 : slot.kind === 'unscripted' ? 1.1 : 1;
  const qualityFactor = remap(quality, 30, 92, 0.7, 1.35);
  const appetiteFactor = remap(appetite, 25, 85, 0.78, 1.22);

  const viewers = Math.max(40, Math.round(
    baseAudience(network) * night * hour * maturity * kindFactor * qualityFactor * appetiteFactor * rng.float(0.88, 1.14),
  ));
  // The eighteen-to-forty-nine rating: a point is about one and three tenths
  // million people in the demographic, and which people watch depends on what it is.
  const demo = Number(clamp((viewers / 1000) * demoSkewOf(slot.genres) / 9, 0.02, 12).toFixed(2));
  // Share of the sets that were on, in an evening where about sixty million households are watching.
  const share = Number(clamp((viewers / 1.9) / 60_000 * 100, 0.1, 60).toFixed(1));

  slot.viewers = viewers;
  slot.demo = demo;
  slot.share = share;
  const aired = (slot.episodesAired ?? 0) + 1;
  slot.episodesAired = aired;
  const n = Math.max(1, aired - (slot.season === 1 ? 0 : (slot.episodesAired ?? 1) - 1));
  slot.seasonViewers = Math.round(((slot.seasonViewers ?? viewers) * (n - 1) + viewers) / n);
  slot.seasonDemo = Number((((slot.seasonDemo ?? demo) * (n - 1) + demo) / n).toFixed(2));

  return {
    at: sim.now, networkId: network.id, title: slot.title, projectId: slot.projectId,
    episode: aired, viewers, demo, share, yours: Boolean(slot.yours),
  };
}

function runTelevisionWeek(sim: Simulation): void {
  const z = sim.homeZone;
  const notable: Airing[] = [];
  let best: Airing | undefined;

  for (const network of NETWORKS.all()) {
    if (!isLinear(network)) continue;
    const state = networkState(sim, network.id);
    if (state.closing) continue;
    const schedule = scheduleOf(sim, network.id);
    if (!schedule) continue;
    const rng = sim.rng('net_week', network.id, dateKey(sim.now, z));
    for (const slot of schedule.slots) {
      const airing = airSlot(sim, network, slot, rng);
      if (!airing) continue;
      if (airing.yours) notable.push(airing);
      else if (!best || airing.viewers > best.viewers) best = airing;
      if (airing.yours) {
        recordFor(sim, 'viewers', { title: airing.title, projectId: airing.projectId, networkId: network.id, value: airing.viewers, yours: true, note: `${(airing.viewers / 1000).toFixed(2)}M watched on ${network.shortName}.` });
        recordFor(sim, 'demo', { title: airing.title, projectId: airing.projectId, networkId: network.id, value: airing.demo, yours: true, note: `A ${airing.demo.toFixed(2)} in the eighteen to forty-nine on ${network.shortName}.` });
      }
    }
  }
  if (best) {
    notable.push(best);
    recordFor(sim, 'viewers', { title: best.title, networkId: best.networkId, value: best.viewers, yours: false, note: `${(best.viewers / 1000).toFixed(2)}M watched on ${NETWORKS.get(best.networkId)?.shortName ?? best.networkId}.` });
  }

  const store = sim.universe;
  store.airings ??= [];
  store.airings.push(...notable);
  if (store.airings.length > AIRING_CAP) store.airings.splice(0, store.airings.length - AIRING_CAP);

  compileStreamingCharts(sim);

  const mine = notable.filter((a) => a.yours);
  if (mine.length > 0) {
    const top = mine.sort((a, b) => b.viewers - a.viewers)[0]!;
    sim.notify({
      category: 'release', title: `${top.title} did a ${top.demo.toFixed(2)} on ${NETWORKS.get(top.networkId)?.shortName ?? 'air'}`,
      body: `${(top.viewers / 1000).toFixed(2)} million watched, a ${top.share} share. That is the number the renewal is decided on.`,
      importance: 62, route: '/workspace/industry', refType: 'project', refId: top.projectId,
    });
  }
  sim.emit('net.week_aired', { airings: notable.length });
  sim.schedule({ at: addDays(sim.now, 7, z), kind: 'net.week', label: 'The Television Week', category: 'system', priority: 90 });
}

// ---------------------------------------------------------------------------
// The services publish a chart
// ---------------------------------------------------------------------------

function subscribersOf(network: Network): number {
  const reach = network.reach;
  if (!reach) return 20_000_000;
  if (reach.unit === 'subscribers' || reach.unit === 'monthly users') return reach.value;
  if (reach.unit === 'households') return reach.value;
  return reach.value * 10;
}

/** What each service's ten looked like this week, in hours viewed. */
function compileStreamingCharts(sim: Simulation): void {
  const z = sim.homeZone;
  const key = dateKey(sim.now, z);
  const store = sim.universe;
  store.streamingCharts ??= [];

  for (const network of NETWORKS.all()) {
    if (network.type !== 'streaming') continue;
    const state = networkState(sim, network.id);
    if (state.closing) continue;
    const rng = sim.rng('net_chart', network.id, key);
    const subscribers = subscribersOf(network);
    const previous = [...store.streamingCharts].reverse().find((c) => c.serviceId === network.id);

    const entries: StreamingChartEntry[] = [];
    // Everything of the player's, and everything the world made, that this service carries.
    const carried = Object.values(store.projects).filter((p) => {
      if (p.phase !== 'released' && p.phase !== 'library') return false;
      if (p.networkId === network.id) return true;
      const release = p.releaseId ? store.releases[p.releaseId] : undefined;
      return release?.streamingPartnerId === network.id;
    });
    for (const project of carried) {
      const weeksOut = project.releaseDate ? Math.max(0, Math.floor((sim.now - project.releaseDate) / (7 * 24 * 60 * MS_MINUTE))) : 0;
      if (weeksOut > 10) continue;
      const quality = project.finalQuality ?? 60;
      const audience = project.audienceScore ?? quality;
      const decay = Math.pow(0.58, weeksOut);
      const runtimeHours = project.format === 'feature' ? 1.9 : project.format === 'limited_series' ? 5.5 : 8.2;
      const startRate = remap(quality, 30, 92, 0.008, 0.085) * remap(audience, 30, 95, 0.7, 1.35) * decay * rng.float(0.8, 1.25);
      const hours = Math.round((subscribers * startRate * runtimeHours) / 1000);
      if (hours < 40) continue;
      const priorWeeks = previous?.entries.find((e) => e.projectId === project.id)?.weeks ?? 0;
      entries.push({
        title: project.title, projectId: project.id, hours, weeks: priorWeeks + 1,
        yours: isPlayersProject(sim, project), onRecord: Boolean(project.catalogueQid),
      });
    }
    // The library the service already had. Real titles, holding on.
    if (isBroadcastSeriesLoaded()) {
      for (const series of seriesOn(network.broadcasterNames).slice(0, 40)) {
        const seed = sim.rng('net_library', network.id, series.qid, key);
        if (!seed.chance(0.22)) continue;
        const hours = Math.round(subscribers * seed.float(0.004, 0.03) * 5.5 / 1000);
        if (hours < 40) continue;
        const priorWeeks = previous?.entries.find((e) => e.catalogueQid === series.qid)?.weeks ?? 0;
        entries.push({ title: series.title, catalogueQid: series.qid, hours, weeks: priorWeeks + 1, yours: false, onRecord: true });
      }
    }
    if (entries.length === 0) continue;
    entries.sort((a, b) => b.hours - a.hours);
    const chart: StreamingChart = { key, at: sim.now, serviceId: network.id, entries: entries.slice(0, 10) };
    store.streamingCharts.push(chart);

    const top = chart.entries[0]!;
    if (top.yours) {
      recordFor(sim, 'streaming_week', { title: top.title, projectId: top.projectId, networkId: network.id, value: top.hours, yours: true, note: `${(top.hours / 1000).toFixed(1)}M hours in a week on ${network.shortName}.` });
      sim.notify({
        category: 'release', title: `${top.title} is number one on ${network.shortName}`,
        body: `${(top.hours / 1000).toFixed(1)} million hours this week, week ${top.weeks} on the chart.`,
        importance: 68, route: '/workspace/industry', refType: 'project', refId: top.projectId,
      });
    }
  }
  if (store.streamingCharts.length > CHART_CAP) store.streamingCharts.splice(0, store.streamingCharts.length - CHART_CAP);
}

// ---------------------------------------------------------------------------
// The upfronts
// ---------------------------------------------------------------------------

/**
 * What a network does with a slot in May. A show is renewed on its number
 * against the rest of the schedule, not against a fixed line, because a 0.4
 * is a hit on one network and a cancellation on another.
 */
function decideRenewals(sim: Simulation, network: Network, state: NetworkState, schedule: NetworkSchedule, rng: Rng): { renewed: ScheduleSlot[]; cancelled: ScheduleSlot[] } {
  const scripted = schedule.slots.filter((s) => s.kind === 'series' || s.kind === 'unscripted');
  const rated = scripted.filter((s) => (s.seasonDemo ?? 0) > 0);
  const median = rated.length > 0
    ? [...rated].sort((a, b) => (a.seasonDemo ?? 0) - (b.seasonDemo ?? 0))[Math.floor(rated.length / 2)]!.seasonDemo ?? 0.4
    : 0.4;

  const renewed: ScheduleSlot[] = [];
  const cancelled: ScheduleSlot[] = [];
  for (const slot of scripted) {
    const demo = slot.seasonDemo ?? 0;
    const relative = median > 0 ? demo / median : 1;
    const age = slot.season ?? 1;
    // A first season gets more rope; a ninth is expensive and has to earn it.
    const rope = age === 1 ? 0.16 : age >= 8 ? -0.1 : 0;
    // A network that is doing well can afford patience.
    const patience = remap(state.confidence, 20, 85, -0.08, 0.1);
    const chance = clamp(remap(relative, 0.45, 1.35, 0.05, 0.96) + rope + patience, 0.02, 0.98);
    const keep = rng.next() < chance;
    if (keep) {
      slot.standing = relative < 0.8 ? 'bubble' : 'safe';
      slot.season = age + 1;
      renewed.push(slot);
    } else {
      slot.standing = 'cancelled';
      cancelled.push(slot);
    }
    if (slot.yours) {
      sim.audit({
        kind: 'net.renewal_decided', subjectType: 'project', subjectId: slot.projectId ?? slot.title,
        question: `Why did ${network.shortName} ${keep ? 'renew' : 'cancel'} ${slot.title}?`,
        summary: keep
          ? `Renewed for a ${age + 1}${age + 1 === 2 ? 'nd' : age + 1 === 3 ? 'rd' : 'th'} season on a ${demo.toFixed(2)} average.`
          : `Cancelled on a ${demo.toFixed(2)} average against a schedule median of ${median.toFixed(2)}.`,
        factors: [
          { label: 'Against The Schedule', detail: `A ${demo.toFixed(2)} where the middle of this network's week is ${median.toFixed(2)}. That is ${Math.round(relative * 100)}% of the median.`, weight: 0.6, contribution: relative, knowable: true },
          { label: 'How Old It Is', detail: age === 1 ? 'A first season gets a second look almost everywhere.' : age >= 8 ? `Season ${age}. The cast is expensive now and the network knows what it has.` : `Season ${age}, in the middle of its life.`, weight: 0.2, contribution: rope, knowable: true },
          { label: 'What Else They Have', detail: `${network.shortName}'s confidence reads ${Math.round(state.confidence)} out of 100. A network with nothing coming keeps what it has.`, weight: 0.2, contribution: patience, knowable: true },
        ],
        seed: `renewal|${network.id}|${slot.title}`, probability: chance,
        outcome: keep ? 'renewed' : 'cancelled',
      });
      sim.notify({
        category: 'career',
        title: keep ? `${slot.title} is coming back` : `${network.shortName} cancelled ${slot.title}`,
        body: keep
          ? `${network.shortName} has ordered another season on a ${demo.toFixed(2)} average.`
          : `A ${demo.toFixed(2)} average against a ${median.toFixed(2)} median was not enough.`,
        importance: keep ? 78 : 84, route: '/workspace/projects', refType: 'project', refId: slot.projectId,
      });
    }
  }
  return { renewed, cancelled };
}

function runUpfront(sim: Simulation): void {
  const z = sim.homeZone;
  const season = `${zonedParts(sim.now, z).year}-${String((zonedParts(sim.now, z).year + 1) % 100).padStart(2, '0')}`;
  let renewedTotal = 0;
  let cancelledTotal = 0;

  for (const network of NETWORKS.all()) {
    if (!isLinear(network)) continue;
    const state = networkState(sim, network.id);
    if (state.closing) continue;
    const schedule = scheduleOf(sim, network.id);
    if (!schedule) continue;
    const rng = sim.rng('net_upfront', network.id, season);
    const { renewed, cancelled } = decideRenewals(sim, network, state, schedule, rng);
    renewedTotal += renewed.length;
    cancelledTotal += cancelled.length;

    // A cancelled slot is a hole, and a hole is an order.
    const ordered: string[] = [];
    for (const slot of cancelled) {
      const index = schedule.slots.indexOf(slot);
      if (index < 0) continue;
      const wants = network.wants.length > 0 ? network.wants : ['drama'];
      const genres = [canonicalGenre(wants[rng.int(0, wants.length - 1)] ?? 'drama')];
      const title = newSeriesTitle(sim, network, rng);
      schedule.slots[index] = {
        day: slot.day, start: slot.start, minutes: slot.minutes,
        title, kind: slotKindOf(genres), genres, season: 1, episodesAired: 0, standing: 'new',
      };
      ordered.push(title);
    }

    const averages = schedule.slots.filter((s) => (s.seasonViewers ?? 0) > 0);
    const averageViewers = averages.length > 0 ? Math.round(averages.reduce((a, s) => a + (s.seasonViewers ?? 0), 0) / averages.length) : 0;
    const averageDemo = averages.length > 0 ? Number((averages.reduce((a, s) => a + (s.seasonDemo ?? 0), 0) / averages.length).toFixed(2)) : 0;
    state.seasons ??= {};
    state.seasons[schedule.season] = { averageViewers, averageDemo, renewed: renewed.length, cancelled: cancelled.length, ordered: ordered.length };

    schedule.season = season;
    schedule.announcedAt = sim.now;
    schedule.renewed = renewed.map((s) => s.title);
    schedule.cancelled = cancelled.map((s) => s.title);
    schedule.ordered = ordered;
    // A new season starts the counting again.
    for (const slot of schedule.slots) { slot.seasonViewers = undefined; slot.seasonDemo = undefined; if (slot.standing === 'cancelled') slot.standing = 'ended'; }

    if (renewed.length > 0 || cancelled.length > 0) {
      recordNews(sim, 'network', network.id, {
        kind: 'slate', title: `${season} Schedule Announced`,
        detail: `${renewed.length} renewed, ${cancelled.length} cancelled, ${ordered.length} new orders. The season averaged ${(averageViewers / 1000).toFixed(2)}M and a ${averageDemo.toFixed(2)}.`,
      });
    }
  }

  recordTrade(sim, {
    kind: 'slate', headline: `The ${season} upfronts: ${renewedTotal} renewed, ${cancelledTotal} cancelled`,
    detail: 'Every linear network stood up and said what is coming back. The holes are already being filled.',
  });
  sim.emit('net.upfront', { season, renewed: renewedTotal, cancelled: cancelledTotal });
  sim.schedule({ at: nextUpfront(sim), kind: 'net.upfront', label: 'The Upfronts', category: 'system', priority: 84 });
}

const TITLE_HEADS = ['The', 'Last', 'Second', 'Quiet', 'Hard', 'Open', 'Cold', 'Bright', 'Long', 'Near'];
const TITLE_TAILS = ['Precinct', 'Ward', 'Harbour', 'Practice', 'Division', 'County', 'Shift', 'Circuit', 'Station', 'Watch', 'Row', 'Line'];

function newSeriesTitle(sim: Simulation, network: Network, rng: Rng): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = `${TITLE_HEADS[rng.int(0, TITLE_HEADS.length - 1)]} ${TITLE_TAILS[rng.int(0, TITLE_TAILS.length - 1)]}`;
    const taken = Object.values(sim.universe.networks).some((n) => n.schedule?.slots.some((s) => s.title === candidate));
    if (!taken) return candidate;
  }
  return `${network.shortName} Pilot ${rng.int(100, 999)}`;
}

// ---------------------------------------------------------------------------
// Records set inside the save
// ---------------------------------------------------------------------------

/** Files a result against the best of its kind in this save, keeping the top ten. */
export function recordFor(sim: Simulation, category: RecordCategory, entry: Omit<SaveRecord, 'category' | 'at'>): boolean {
  const store = sim.universe;
  store.saveRecords ??= {};
  const list = (store.saveRecords[category] ??= []);
  const existing = list.findIndex((r) => r.title === entry.title && r.projectId === entry.projectId);
  if (existing >= 0) {
    if (list[existing]!.value >= entry.value) return false;
    list.splice(existing, 1);
  }
  list.push({ category, at: sim.now, ...entry });
  list.sort((a, b) => b.value - a.value);
  const wasFirst = list[0]?.title === entry.title;
  if (list.length > RECORDS_PER_CATEGORY) list.length = RECORDS_PER_CATEGORY;
  return wasFirst;
}

export const RECORD_LABEL: Readonly<Record<RecordCategory, string>> = {
  opening_weekend: 'Biggest Opening Weekend', domestic: 'Biggest Domestic Gross', worldwide: 'Biggest Worldwide Gross',
  per_theatre: 'Best Per-Theatre Average', viewers: 'Most Watched Airing', demo: 'Best Demo Rating',
  streaming_week: 'Biggest Streaming Week', streaming_total: 'Most Hours Viewed', tomatometer: 'Best Reviewed',
  imdb: 'Highest IMDb Rating', budget: 'Most Expensive', profit: 'Most Profitable',
};

export const RECORD_UNIT: Readonly<Record<RecordCategory, 'money' | 'thousands' | 'rating' | 'percent' | 'score'>> = {
  opening_weekend: 'money', domestic: 'money', worldwide: 'money', per_theatre: 'money',
  viewers: 'thousands', demo: 'rating', streaming_week: 'thousands', streaming_total: 'thousands',
  tomatometer: 'percent', imdb: 'score', budget: 'money', profit: 'money',
};

export function formatRecord(category: RecordCategory, value: number): string {
  switch (RECORD_UNIT[category]) {
    case 'money': return formatMoneyCompact(value);
    case 'thousands': return `${(value / 1000).toFixed(value >= 10_000 ? 1 : 2)}M`;
    case 'rating': return value.toFixed(2);
    case 'percent': return `${Math.round(value)}%`;
    default: return value.toFixed(1);
  }
}

/** Everything this save has set a record for, in the order the screen shows them. */
export function saveRecords(sim: Simulation): { category: RecordCategory; label: string; entries: SaveRecord[] }[] {
  const order: RecordCategory[] = ['opening_weekend', 'domestic', 'worldwide', 'per_theatre', 'profit', 'viewers', 'demo', 'streaming_week', 'tomatometer', 'imdb', 'budget'];
  return order
    .map((category) => ({ category, label: RECORD_LABEL[category], entries: sim.universe.saveRecords?.[category] ?? [] }))
    .filter((row) => row.entries.length > 0);
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerNetworks(sim: Simulation): void {
  sim.onSchedule('net.week', () => runTelevisionWeek(sim));
  sim.onSchedule('net.upfront', () => runUpfront(sim));

  // A series of the player's that a network takes goes into the grid.
  sim.onEvent('rel.distribution_set', 'networks.schedule', (event) => {
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    const project = sim.universe.projects[String(payload.projectId)];
    if (!project?.networkId) return;
    const television = project.format === 'series' || project.format === 'limited_series';
    if (!television) return;
    placeInSchedule(sim, project.networkId, project);
  });

  // Every finished picture is measured against the save's own records.
  sim.onEvent('project.results_final', 'networks.records', (event) => {
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    const project = sim.universe.projects[String(payload.projectId)];
    if (!project) return;
    const yours = isPlayersProject(sim, project);
    const release = project.releaseId ? sim.universe.releases[project.releaseId] : undefined;
    const note = `${project.title}${project.releaseDate ? `, ${zonedParts(project.releaseDate, sim.homeZone).year}` : ''}.`;
    const common = { title: project.title, projectId: project.id, studioId: project.studioId, yours, note };
    if (release && release.dailyBoxOffice.length >= 3) {
      const opening = release.dailyBoxOffice.slice(0, 3).reduce((s, d) => s + d.domestic, 0);
      if (recordFor(sim, 'opening_weekend', { ...common, value: opening }) && yours) {
        recordTrade(sim, { kind: 'weekend', headline: `${project.title} sets the biggest opening in your universe`, detail: `${formatMoneyCompact(opening)} across ${release.theaterCount.toLocaleString('en-US')} theatres.`, studioId: project.studioId, projectId: project.id });
      }
      if (release.theaterCount > 0) recordFor(sim, 'per_theatre', { ...common, value: Math.round(opening / release.theaterCount) });
      recordFor(sim, 'domestic', { ...common, value: release.totalDomestic });
      recordFor(sim, 'worldwide', { ...common, value: release.totalDomestic + release.totalInternational });
    }
    if (project.budget > 0) recordFor(sim, 'budget', { ...common, value: project.budget });
    const profit = project.totalRevenue - project.totalCost;
    if (profit > 0) recordFor(sim, 'profit', { ...common, value: profit });
    if (project.reception?.tomatometer !== undefined && (project.reception.reviewCount ?? 0) >= 20) {
      recordFor(sim, 'tomatometer', { ...common, value: project.reception.tomatometer });
    }
    if (project.streamingHoursViewed > 0) recordFor(sim, 'streaming_total', { ...common, value: Math.round(project.streamingHoursViewed / 1000) });
  });

  sim.onCommand<{ networkId: string; projectId: Id; day?: number; start?: number }, { day: number; start: number }>(
    'net.request_slot',
    (p, { sim: s }) => {
      const network = NETWORKS.get(p.networkId);
      if (!network) throw new CommandError('No such network.');
      if (!isLinear(network)) throw new CommandError(`${network.shortName} does not run a schedule. A service puts a thing up and lets it find its audience.`);
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!isPlayersProject(s, project)) throw new CommandError('That is not your show.');
      if (project.networkId !== p.networkId) throw new CommandError(`${network.shortName} has not commissioned ${project.title}.`);
      const placed = placeInSchedule(s, p.networkId, project, p.day, p.start);
      if (!placed) throw new CommandError(`${network.shortName} has no room in the week for it.`);
      return { day: placed.day, start: placed.start };
    },
  );
}

/** Puts a show in the week, in the best slot the network will give it. */
function placeInSchedule(sim: Simulation, networkId: string, project: Project, day?: number, start?: number): ScheduleSlot | undefined {
  const schedule = scheduleOf(sim, networkId);
  if (!schedule) return undefined;
  if (schedule.slots.some((s) => s.projectId === project.id)) return schedule.slots.find((s) => s.projectId === project.id);

  const yours = isPlayersProject(sim, project);
  const worth = (slot: ScheduleSlot) => (NIGHT_WEIGHT[slot.day] ?? 1) * (HOUR_WEIGHT[slot.start] ?? 1);

  // A network commissioned this, so it makes room. It uses a hole if it has
  // one, and otherwise it takes off the weakest thing it is running — which
  // is exactly how a mid-season replacement gets on the air.
  let target: ScheduleSlot | undefined;
  if (day !== undefined && start !== undefined) {
    target = schedule.slots.find((s) => s.day === day && s.start === start);
  } else {
    const holes = schedule.slots.filter((s) => s.kind === 'reruns' || s.kind === 'movie' || s.standing === 'ended' || s.standing === 'cancelled');
    target = holes.sort((a, b) => worth(b) - worth(a))[0];
    if (!target) {
      // Nothing spare. The lowest-rated thing that is not already yours comes off.
      const displaceable = schedule.slots.filter((s) => !s.yours && s.kind !== 'news' && s.kind !== 'sport');
      target = displaceable.sort((a, b) => (a.seasonDemo ?? a.demo ?? worth(a)) - (b.seasonDemo ?? b.demo ?? worth(b)))[0];
      if (target) {
        recordNews(sim, 'network', networkId, {
          kind: 'slate', title: `${titleCaseLabel(target.title)} Comes Off The Schedule`,
          detail: `Pulled from ${NIGHT_NAME[target.day]}s at ${slotTime(target.start)} to make room for ${titleCaseLabel(project.title)}.`,
        });
      }
    }
  }
  if (!target) return undefined;

  const index = schedule.slots.indexOf(target);
  const genres = project.genres.map(canonicalGenre);
  const slot: ScheduleSlot = {
    day: target.day, start: target.start, minutes: target.minutes,
    title: project.title, kind: slotKindOf(genres), projectId: project.id, genres,
    yours, season: 1, episodesAired: 0, standing: 'new',
  };
  schedule.slots[index] = slot;
  const network = NETWORKS.get(networkId);
  recordNews(sim, 'network', networkId, {
    kind: 'slate', title: `${titleCaseLabel(project.title)} Gets A Slot`,
    detail: `${NIGHT_NAME[slot.day]}s at ${slotTime(slot.start)}. ${genres.map(genreName).join(', ')}.`,
    projectId: project.id,
  });
  if (yours) {
    sim.notify({
      category: 'career', title: `${project.title} has a night`,
      body: `${network?.shortName ?? 'The network'} has put it on ${NIGHT_NAME[slot.day]}s at ${slotTime(slot.start)}.`,
      importance: 70, route: '/workspace/industry', refType: 'project', refId: project.id,
    });
  }
  return slot;
}

/** Loads the record's series so a grid can be built, for the interface. */
export async function ensureSeriesLoaded(): Promise<void> {
  if (!isBroadcastSeriesLoaded()) await loadBroadcastSeries();
}
