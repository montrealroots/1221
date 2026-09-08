/**
 * SLATE — running track.
 *
 * A time is not a dice roll. It comes out of what a runner can do, how much
 * work is in their legs, how old they are, and what kind of day it is — in
 * that order. The two ends of the line are the world record, which is real,
 * and a first day at the track, which is SLATE's calibration; everything in
 * this game happens between them.
 *
 * Every rival in every lane is SLATE's own, and so is every time run here.
 * There is no results feed, and a made-up time attached to a real athlete
 * would be a claim about somebody real.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, Mark, MeetEntry, Person, RaceResult, Running, TrackSeason } from '../domain/model';
import { clamp } from '../core/rng';
import { MS_DAY, MS_MINUTE, addDays, formatDate, zonedParts } from '../core/time';
import { plural } from '../core/text';
import { countryOfCity } from '../content/geography';
import {
  ATHLETICS_NOTE, CATEGORY_LABEL, EVENT_BY_ID, EVENTS, LEVELS, MEET_BY_ID, MEET_FIRST,
  MEET_SECOND, NAMED_MEETS, OPPONENT_FIRST, RIVAL_FIRST, RIVAL_LAST, ROUND_LABEL, TIER_LABEL,
  TIER_WEIGHT,
  TRACK_FROM_AGE, WIND_LIMIT, type Round, type RunnerCategory, type Stage, type Surface,
  type Tier, type TrackEvent, endsFor, eventsFor, individualEvents, ladderFor, levelOf,
  qualityOf, recordFor, roundsAt, schoolWords, schoolsRunTrack, standardFor, timeAt,
  timeForLevel, windLegal,
} from '../content/athletics';
import { ageOf, youthFactor } from './lifespan';
import { schoolingOf } from './school';
import { studiesOf } from './university';

// ---------------------------------------------------------------------------
// Saying a time out loud
// ---------------------------------------------------------------------------

/** A time the way a track writes it: 10.42, or 2:54.29 once it is over a minute. */
export function formatSeconds(seconds: number): string {
  if (seconds < 60) return seconds.toFixed(2);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return `${minutes}:${rest < 10 ? '0' : ''}${rest.toFixed(2)}`;
}

/** A wind reading the way a results sheet writes it. */
export function formatWind(wind: number): string {
  return `${wind >= 0 ? '+' : ''}${wind.toFixed(1)}`;
}

/** A mark, with the wind on it where the wind is read. */
export function describeMark(mark: Mark): string {
  const wind = mark.wind === undefined ? '' : ` (${formatWind(mark.wind)})`;
  const flag = mark.legal ? '' : ' · Wind Assisted';
  return `${formatSeconds(mark.seconds)}${wind}${flag}`;
}

// ---------------------------------------------------------------------------
// Who is running, and in what
// ---------------------------------------------------------------------------

/** The category somebody would compete in unless they say otherwise. */
export function categoryFor(person: Person): RunnerCategory {
  return person.gender === 'female' ? 'womens' : 'mens';
}

/** The running record, if this person has one. */
export function runningOf(sim: Simulation, personId: Id = sim.player.id): Running | undefined {
  return Object.values(sim.universe.running ?? {}).find((one) => one.personId === personId);
}

/** How much form is left, given how long it is since any was put in. */
export function formNow(sim: Simulation, running: Running): number {
  const days = Math.max(0, (sim.now - running.formAt) / MS_DAY);
  // Form goes off. A fortnight away costs about a quarter of it, which is
  // roughly what a fortnight away really costs.
  return clamp(Math.round(running.form - days * 1.8), 0, 100);
}

/** Start running, or return the record they already have. */
export function ensureRunning(
  sim: Simulation, category?: RunnerCategory, person: Person = sim.player,
): Running {
  sim.universe.running ??= {};
  const existing = runningOf(sim, person.id);
  if (existing) {
    if (category && category !== existing.category) existing.category = category;
    return existing;
  }
  const running: Running = {
    id: sim.nextId('running'),
    saveId: sim.universe.meta.id,
    personId: person.id,
    category: category ?? categoryFor(person),
    eventIds: [],
    stage: 'school',
    form: 20,
    formAt: sim.now,
    sessions: 0,
    bests: [],
    seasonBests: [],
    startedAt: sim.now,
  };
  sim.universe.running[running.id] = running;
  return running;
}

/** The best they have ever run at this, on this surface. */
export function bestFor(running: Running, eventId: string, surface: string): Mark | undefined {
  return running.bests.find((one) => one.eventId === eventId && one.surface === surface);
}

/** The best they have run at this since the season started. */
export function seasonBestFor(running: Running, eventId: string, surface: string): Mark | undefined {
  return running.seasonBests.find((one) => one.eventId === eventId && one.surface === surface);
}

/** Every event they could enter, in the category they run in. */
export function eventsOpenTo(sim: Simulation, running: Running, surface?: Surface): TrackEvent[] {
  const age = ageOf(sim, sim.universe.people[running.personId] ?? sim.player);
  return eventsFor(running.category as RunnerCategory, surface)
    // Nobody under thirteen is racing a flat lap at full effort.
    .filter((one) => one.metres < 400 || age >= 13);
}

// ---------------------------------------------------------------------------
// What somebody can actually run
// ---------------------------------------------------------------------------

/**
 * The ability behind a time, out of a hundred.
 *
 * The weighted sheet for the event, held under the youth curve, because a
 * twelve year old with a perfect sheet is a gifted twelve year old rather
 * than the fastest person alive.
 */
export function abilityFor(
  sim: Simulation, person: Person, eventId: string,
): number {
  const event = EVENT_BY_ID[eventId];
  if (!event) return 0;
  let total = 0;
  for (const [skillId, weight] of Object.entries(event.weights)) {
    total += (person.skills?.[skillId] ?? 0) * weight;
  }
  return clamp(Math.round(total * youthFactor(sim, person)), 0, 100);
}

/**
 * What the body brings, out of a hundred.
 *
 * Fitness and condition, and how well the frame suits a sprint. Height helps
 * a little over a hundred and hurts a little over sixty; neither is worth
 * anything like as much as the work is.
 */
export function physioFor(person: Person, eventId: string): number {
  const event = EVENT_BY_ID[eventId];
  const wellbeing = person.wellbeing;
  const base = (wellbeing.fitness ?? 50) * 0.6 + (wellbeing.condition ?? 50) * 0.4;
  const height = person.adultHeightCm ?? 175;
  // A tall runner takes longer to get going and travels further per stride.
  const tall = clamp((height - 175) / 25, -1, 1);
  const shift = event && event.metres <= 60 ? -tall * 5 : tall * 4;
  return clamp(Math.round(base + shift), 0, 100);
}

/** Everything that decides a time, as one number between nothing and one. */
export function qualityFor(sim: Simulation, person: Person, eventId: string, running?: Running): number {
  const ability = abilityFor(sim, person, eventId);
  const form = running ? formNow(sim, running) : 0;
  const physio = physioFor(person, eventId);
  return clamp((ability * 0.55 + form * 0.30 + physio * 0.15) / 100, 0, 1);
}

/** What this person would run today, on current form and no luck either way. */
export function predict(sim: Simulation, person: Person, eventId: string, running?: Running): number | undefined {
  const record = running ?? runningOf(sim, person.id);
  const category = (record?.category ?? categoryFor(person)) as RunnerCategory;
  return timeAt(qualityFor(sim, person, eventId, record), eventId, category);
}

/** What a time is worth, said in words. */
export function standingOf(seconds: number, eventId: string, category: RunnerCategory): string {
  return levelOf(seconds, eventId, category).label;
}

/** Whether a time is inside the entry standard for a global championship. */
export function insideStandard(seconds: number, eventId: string, category: RunnerCategory): boolean {
  const standard = standardFor(eventId, category);
  return standard !== undefined && seconds <= standard;
}

// ---------------------------------------------------------------------------
// A season
// ---------------------------------------------------------------------------

/** The season somebody is in the middle of, if there is one. */
export function seasonOf(sim: Simulation, personId: Id = sim.player.id): TrackSeason | undefined {
  return Object.values(sim.universe.seasons ?? {})
    .find((one) => one.personId === personId && !one.endedAt);
}

/** Every season they have run, newest first. */
export function seasonsOf(sim: Simulation, personId: Id = sim.player.id): TrackSeason[] {
  return Object.values(sim.universe.seasons ?? {})
    .filter((one) => one.personId === personId)
    .sort((a, b) => b.startedAt - a.startedAt);
}

/** The next meet that has not been run. */
export function nextMeet(season: TrackSeason): MeetEntry | undefined {
  return season.meets.find((one) => !one.run);
}

/** The meets still to come. */
export function meetsLeft(season: TrackSeason): MeetEntry[] {
  return season.meets.filter((one) => !one.run);
}

/** The best place they have taken this season, which is what qualifies them. */
function bestPlaceAt(season: TrackSeason, tier: string): number | undefined {
  const places = season.meets
    .filter((one) => one.tier === tier && one.run && one.place !== undefined)
    .map((one) => one.place!);
  return places.length > 0 ? Math.min(...places) : undefined;
}

/** The class above this one, for a meet whose field is better than its rung. */
function harderThan(levelId: string): string {
  const index = LEVELS.findIndex((one) => one.id === levelId);
  return index >= 0 && index < LEVELS.length - 1 ? LEVELS[index + 1]!.id : levelId;
}

/** What a tier of meet is worth in class, so the field can be built for it. */
function levelIdFor(tier: Tier): string {
  const weight = TIER_WEIGHT[tier];
  if (weight >= 85) return 'world';
  if (weight >= 70) return 'national';
  if (weight >= 45) return 'collegiate';
  if (weight >= 35) return 'schools';
  if (weight >= 15) return 'county';
  return 'team';
}

/**
 * The schedule, dealt once.
 *
 * The rungs are the ladder that country really runs at that stage. A rung
 * with a real named meet on it gets the real one; the rest are SLATE's own,
 * because a dual meet against the school across town does not have a name
 * anybody publishes.
 */
function buildSchedule(
  sim: Simulation, seed: string, stage: Stage, surface: Surface, countryId: string,
): MeetEntry[] {
  const ladder = ladderFor(stage, surface, countryId);
  if (!ladder) return [];
  const rng = sim.rng('track.schedule', seed);
  const now = zonedParts(sim.now, sim.homeZone);

  // The season opens on the next of its own months.
  const opensIn = ladder.months.find((month) => month >= now.month) ?? ladder.months[0]!;
  const monthsAway = opensIn >= now.month ? opensIn - now.month : 12 - now.month + opensIn;
  let at = sim.now + Math.max(5, monthsAway * 30) * MS_DAY;

  const real = NAMED_MEETS.filter(
    (one) => one.stages.includes(stage) && one.surface === surface
      && (one.countryId === countryId || one.tier === 'global'),
  );
  const usedReal = new Set<string>();
  const usedNames = new Set<string>();
  const out: MeetEntry[] = [];

  for (const rung of ladder.rungs) {
    at = addDays(at, rung.daysAfter, sim.homeZone);
    for (let i = 0; i < rung.count; i++) {
      // The real meet for this rung is the one held nearest the time of year
      // the rung falls in, so the Texas Relays stay in March.
      const month = zonedParts(at, sim.homeZone).month;
      const named = real
        .filter((one) => one.tier === rung.tier && !usedReal.has(one.id))
        .sort((a, b) => Math.abs(a.month - month) - Math.abs(b.month - month))[0];
      if (named) {
        usedReal.add(named.id);
        out.push({
          at, name: named.name, town: named.town, cityId: named.cityId, meetId: named.id,
          tier: rung.tier, eventIds: [], run: false, results: [],
        });
      } else if (rung.tier === 'dual') {
        // A dual meet is one afternoon against one other school, so it is
        // called after them rather than after itself.
        let against = '';
        let guard = 0;
        do {
          against = `${rng.pick(OPPONENT_FIRST)} ${rng.pick(schoolWords(countryId))}`;
        } while (usedNames.has(against) && guard++ < 20);
        usedNames.add(against);
        out.push({
          at,
          name: i % 2 === 0 ? `${against}, At Home` : `Away At ${against}`,
          town: '',
          tier: rung.tier,
          eventIds: [],
          run: false,
          results: [],
        });
      } else if (rung.tier !== 'invitational' && rung.tier !== 'circuit') {
        // A championship rung is one meet and it is called what it is, not
        // something invented that happens to fall on that weekend.
        out.push({
          at, name: TIER_LABEL[rung.tier], town: '', tier: rung.tier,
          eventIds: [], run: false, results: [],
        });
      } else {
        let name = '';
        let guard = 0;
        do {
          name = `${rng.pick(MEET_FIRST)} ${rng.pick(MEET_SECOND)}`;
        } while (usedNames.has(name) && guard++ < 20);
        usedNames.add(name);
        out.push({ at, name, town: '', tier: rung.tier, eventIds: [], run: false, results: [] });
      }
      if (i < rung.count - 1) at = addDays(at, 7, sim.homeZone);
    }
  }
  return out;
}

/**
 * Start a season, or return the one already running.
 *
 * Idempotent: asking twice in the same year does not deal a second schedule.
 */
export function startSeason(
  sim: Simulation, stage: Stage, surface: Surface, teamName: string, eventIds: readonly string[],
  person: Person = sim.player,
): TrackSeason | undefined {
  sim.universe.seasons ??= {};
  const running = ensureRunning(sim, undefined, person);
  const already = seasonOf(sim, person.id);
  if (already && already.surface === surface && already.stage === stage) return already;
  if (already) endSeason(sim, already, 'the end of it');

  const countryId = countryOfCity(person.currentLocationId) ?? person.citizenshipId;
  const year = zonedParts(sim.now, sim.homeZone).year;
  const meets = buildSchedule(sim, `${person.id}:${stage}:${surface}:${year}`, stage, surface, countryId);
  if (meets.length === 0) return undefined;

  const entered = eventIds.length > 0 ? [...eventIds] : running.eventIds;
  for (const meet of meets) {
    meet.eventIds = entered.filter((id) => EVENT_BY_ID[id]?.surfaces.includes(surface));
  }

  const season: TrackSeason = {
    id: sim.nextId('season'),
    saveId: sim.universe.meta.id,
    personId: person.id,
    stage,
    surface,
    teamName,
    countryId,
    year,
    eventIds: entered,
    meets,
    startedAt: sim.now,
  };
  sim.universe.seasons[season.id] = season;
  // A new season is a new set of season bests.
  running.seasonBests = [];
  running.stage = stage;
  running.teamName = teamName;

  if (person.isPlayer) {
    const ladder = ladderFor(stage, surface, countryId);
    sim.notify({
      title: `The ${surface === 'indoor' ? 'Indoor' : 'Outdoor'} Season`,
      body: `${plural(meets.length, 'meet')} for ${teamName}. ${ladder?.about ?? ''}`,
      category: 'personal',
      importance: 44,
      route: '/workspace/education',
    });
  }
  sim.emit('track.season_started', { seasonId: season.id, stage, surface, meets: meets.length });
  return season;
}

/** Close a season and write down how far it went. */
function endSeason(sim: Simulation, season: TrackSeason, reached: string): void {
  season.endedAt = sim.now;
  season.reached = reached;
  if (sim.player.id !== season.personId) return;
  const running = runningOf(sim, season.personId);
  const best = running?.seasonBests[0];
  sim.remember({
    category: 'life',
    title: `The ${season.year} ${season.surface === 'indoor' ? 'Indoor' : 'Outdoor'} Season`,
    detail: best
      ? `${season.teamName}. ${formatSeconds(best.seconds)} for the ${EVENT_BY_ID[best.eventId]?.label ?? best.eventId}, and it ended ${reached}.`
      : `${season.teamName}, and it ended ${reached}.`,
    refs: [{ type: 'person', id: season.personId }],
    significance: 5,
    public: false,
  });
  sim.emit('track.season_ended', { seasonId: season.id, reached });
}

/** How the season reads right now. */
export function describeSeason(sim: Simulation, season: TrackSeason): string {
  const surface = season.surface === 'indoor' ? 'Indoor' : 'Outdoor';
  const run = season.meets.filter((one) => one.run).length;
  if (season.endedAt) {
    return `${season.year} ${surface}. ${plural(run, 'meet')} for ${season.teamName}, and it ended ${season.reached}.`;
  }
  const next = nextMeet(season);
  const upcoming = next
    ? ` Next: ${next.name}, ${formatDate(next.at, sim.homeZone)}.`
    : ' The season is done.';
  return `${season.year} ${surface} for ${season.teamName}. ${run} of ${season.meets.length} run.${upcoming}`;
}

// ---------------------------------------------------------------------------
// The race itself
// ---------------------------------------------------------------------------

/** One lane of a race. Everybody in it but the player is SLATE's own. */
export interface Lane {
  name: string;
  lane: number;
  seconds: number;
  player: boolean;
}

/** How much the wind is worth, per meter a second, in this event. */
function windWorth(event: TrackEvent): number {
  if (!event.windRead) return 0;
  if (event.metres <= 100) return 0.05;
  if (event.metres <= 110) return 0.05;
  return 0.06;
}

/** The rest of the field, drawn around what this tier of meet is worth. */
function buildField(
  sim: Simulation, seed: string, tier: Tier, eventId: string, category: RunnerCategory,
  round: Round, size: number, named = false,
): Lane[] {
  const rng = sim.rng('track.field', seed, round);
  // A meet with a real name draws a real field: Arcadia and the Texas Relays
  // are invitationals, but the people in them are the best in the country.
  const centre = timeForLevel(named ? harderThan(levelIdFor(tier)) : levelIdFor(tier), eventId, category)
    ?? timeForLevel('team', eventId, category) ?? 12;
  // A final is the fast end of a heat, so the field tightens as the rounds go.
  const shift = round === 'final' ? 0.985 : round === 'semi' ? 0.993 : 1;
  const spread = centre * (round === 'final' ? 0.014 : 0.028);
  const out: Lane[] = [];
  for (let i = 0; i < size; i++) {
    const seconds = Math.max(
      centre * 0.9,
      Math.round(rng.normal(centre * shift, spread) * 100) / 100,
    );
    out.push({
      name: `${rng.pick(RIVAL_FIRST)} ${rng.pick(RIVAL_LAST)}`,
      lane: 0,
      seconds,
      player: false,
    });
  }
  return out;
}

/** What the player runs today, in this round, in these conditions. */
function playerTime(
  sim: Simulation, person: Person, running: Running, event: TrackEvent, tier: Tier,
  round: Round, roundsToday: number, wind: number, seed: string,
): number {
  const category = running.category as RunnerCategory;
  const base = timeAt(qualityFor(sim, person, event.id, running), event.id, category) ?? 99;
  const rng = sim.rng('track.race', seed, round);

  // The day you are having, which is worth about a per cent either way.
  let time = base * (1 + rng.normal(0, 0.010));
  // A third race in an afternoon is not the first one.
  const legs = (person.skills?.speed_endurance ?? 0) + (person.skills?.athletic_recovery ?? 0);
  time += base * roundsToday * (0.010 - Math.min(0.007, legs / 200 * 0.007));
  // A full stadium, and whether that helps or not.
  if (TIER_WEIGHT[tier] >= 55) {
    const nerve = (person.skills?.competitive_nerve ?? 0) - 50;
    time -= base * (nerve / 100) * 0.006;
  }
  // Tired legs before you start.
  const energy = person.wellbeing.energy ?? 100;
  if (energy < 45) time += base * ((45 - energy) / 45) * 0.02;
  // The wind, which is only read in some events.
  time -= wind * windWorth(event);

  const both = endsFor(event.id, category);
  const floor = both ? both.best * 0.985 : 0;
  return Math.max(floor, Math.round(time * 100) / 100);
}

/** How many go through from a round. */
function throughFrom(round: Round): number {
  return round === 'final' ? 0 : 3;
}

/** Run one round, and say what happened in it. */
function runRound(
  sim: Simulation, running: Running, person: Person, event: TrackEvent, tier: Tier,
  round: Round, roundsToday: number, surface: Surface, seed: string, named = false,
): { result: RaceResult; field: Lane[] } {
  const category = running.category as RunnerCategory;
  const rng = sim.rng('track.race', seed, round, 'wind');
  const wind = event.windRead && surface === 'outdoor'
    ? Math.round(clamp(rng.normal(0.4, 1.3), -3.5, 4.5) * 10) / 10
    : undefined;

  const seconds = playerTime(sim, person, running, event, tier, round, roundsToday, wind ?? 0, seed);
  const field = buildField(sim, seed, tier, event.id, category, round, 7, named);
  field.push({ name: person.displayName, lane: 0, seconds, player: true });
  field.sort((a, b) => a.seconds - b.seconds);
  field.forEach((one, i) => { one.lane = i + 1; });

  const place = field.findIndex((one) => one.player) + 1;
  const legal = wind === undefined || windLegal(event.id, wind);
  const best = bestFor(running, event.id, surface);
  const seasonBest = seasonBestFor(running, event.id, surface);
  const personalBest = legal && (!best || seconds < best.seconds);
  const isSeasonBest = legal && (!seasonBest || seconds < seasonBest.seconds);

  return {
    result: {
      round,
      eventId: event.id,
      lane: field.find((one) => one.player)!.lane,
      seconds,
      wind,
      legal,
      place,
      of: field.length,
      through: round !== 'final' && place <= throughFrom(round),
      personalBest,
      seasonBest: isSeasonBest,
    },
    field,
  };
}

/** Write a mark into the record, where it is one worth keeping. */
function recordMark(
  sim: Simulation, running: Running, result: RaceResult, surface: Surface, where: string,
): void {
  const mark: Mark = {
    eventId: result.eventId,
    surface,
    seconds: result.seconds,
    wind: result.wind,
    legal: result.legal,
    at: sim.now,
    where,
  };
  if (!result.legal) return;
  const best = bestFor(running, result.eventId, surface);
  if (!best || result.seconds < best.seconds) {
    running.bests = running.bests.filter(
      (one) => !(one.eventId === result.eventId && one.surface === surface),
    );
    running.bests.push(mark);
  }
  const seasonBest = seasonBestFor(running, result.eventId, surface);
  if (!seasonBest || result.seconds < seasonBest.seconds) {
    running.seasonBests = running.seasonBests.filter(
      (one) => !(one.eventId === result.eventId && one.surface === surface),
    );
    running.seasonBests.push(mark);
  }
}

/** Whether this pulled something, and for how long. */
function checkInjury(sim: Simulation, running: Running, person: Person, seed: string, strain: number): string | undefined {
  const rng = sim.rng('track.injury', seed);
  const care = ((person.skills?.athletic_recovery ?? 0) + (person.skills?.training_discipline ?? 0)) / 2;
  const tired = 100 - (person.wellbeing.energy ?? 100);
  const age = ageOf(sim, person);
  const old = age > 30 ? (age - 30) * 0.4 : 0;
  const risk = clamp(strain + tired * 0.06 + old - care * 0.05, 0.2, 22);
  if (rng.float(0, 100) > risk) return undefined;
  const what = rng.pick([
    'A hamstring, and you felt it go.',
    'A tight calf that turned into a torn one.',
    'A quad strain, pulled up at sixty meters.',
    'A hip flexor, and it has been sore for a fortnight.',
    'An achilles, which is the one nobody wants.',
  ]);
  const weeks = rng.int(2, 8);
  running.injuredUntil = sim.now + weeks * 7 * MS_DAY;
  running.injury = what;
  running.form = clamp(running.form - 25, 0, 100);
  running.formAt = sim.now;
  return `${what} ${plural(weeks, 'week')} out.`;
}

// ---------------------------------------------------------------------------
// A meet, from the first heat to the last final
// ---------------------------------------------------------------------------

/** What the rung before this one was, in the ladder this season runs. */
function rungBefore(season: TrackSeason, meet: MeetEntry): { tier: Tier; qualifyBy?: number } | undefined {
  const ladder = ladderFor(season.stage as Stage, season.surface as Surface, season.countryId);
  if (!ladder) return undefined;
  const index = ladder.rungs.findIndex((one) => one.tier === meet.tier);
  if (index <= 0) return undefined;
  const here = ladder.rungs[index]!;
  return { tier: ladder.rungs[index - 1]!.tier, qualifyBy: here.qualifyBy };
}

/** Whether they have earned the right to be at this one. */
export function qualifiedFor(season: TrackSeason, meet: MeetEntry): { yes: boolean; why: string } {
  const before = rungBefore(season, meet);
  if (!before || before.qualifyBy === undefined) return { yes: true, why: '' };
  const place = bestPlaceAt(season, before.tier);
  if (place === undefined) {
    return { yes: false, why: `You did not run ${TIER_LABEL[before.tier].toLowerCase()}, so there is no way in.` };
  }
  if (place > before.qualifyBy) {
    return {
      yes: false,
      why: `The top ${before.qualifyBy} at ${TIER_LABEL[before.tier].toLowerCase()} go through, and you were ${place}.`,
    };
  }
  return { yes: true, why: '' };
}

/** Run the next meet on the schedule, every round of it. */
export function runMeet(
  sim: Simulation, season: TrackSeason, meet: MeetEntry, running: Running, person: Person,
): { note: string; injury?: string } {
  const surface = season.surface as Surface;
  const tier = meet.tier as Tier;
  const entered = meet.eventIds
    .map((id) => EVENT_BY_ID[id])
    .filter((one): one is TrackEvent => Boolean(one) && one!.surfaces.includes(surface));

  let roundsToday = 0;
  let bestPlace: number | undefined;
  const lines: string[] = [];

  for (const event of entered) {
    const rounds = roundsAt(tier, event.id);
    for (const round of rounds) {
      const seed = `${season.id}:${meet.at}:${event.id}`;
      const { result } = runRound(
        sim, running, person, event, tier, round, roundsToday, surface, seed, Boolean(meet.meetId),
      );
      roundsToday += 1;
      meet.results.push(result);
      recordMark(sim, running, result, surface, meet.name);
      if (round === 'final') {
        bestPlace = bestPlace === undefined ? result.place : Math.min(bestPlace, result.place);
        lines.push(
          `${event.label}: ${formatSeconds(result.seconds)}`
          + `${result.wind === undefined ? '' : ` (${formatWind(result.wind)})`}`
          + `, ${ordinal(result.place)}${result.personalBest ? ', and a personal best' : ''}`
          + `${result.legal ? '' : ', wind assisted'}.`,
        );
      } else if (!result.through) {
        lines.push(
          `${event.label}: out in ${ROUND_LABEL[round].toLowerCase()}, `
          + `${formatSeconds(result.seconds)}, ${ordinal(result.place)}.`,
        );
      }
      if (!result.through && round !== 'final') break;
    }
  }

  meet.run = true;
  meet.place = bestPlace;

  // What a day of it costs, and what it does for you.
  sim.advanceTo(Math.max(sim.now, meet.at) + 6 * 60 * MS_MINUTE);
  person.wellbeing.energy = clamp((person.wellbeing.energy ?? 100) - 16 - roundsToday * 7, 0, 100);
  running.form = clamp(running.form + 2, 0, 100);
  running.formAt = sim.now;
  const injury = checkInjury(sim, running, person, `${season.id}:${meet.at}`, 3 + roundsToday * 1.2);

  // What is worth remembering: a best, or a title.
  if (person.isPlayer) {
    for (const result of meet.results.filter((one) => one.round === 'final')) {
      const event = EVENT_BY_ID[result.eventId];
      if (result.personalBest) {
        sim.remember({
          category: 'life',
          title: `${formatSeconds(result.seconds)} For The ${event?.label ?? result.eventId}`,
          detail: `${meet.name}. ${standingOf(result.seconds, result.eventId, running.category as RunnerCategory)}.`,
          refs: [{ type: 'person', id: person.id }],
          significance: TIER_WEIGHT[tier] >= 70 ? 7 : 4,
          public: TIER_WEIGHT[tier] >= 55,
        });
      }
      if (result.place === 1 && TIER_WEIGHT[tier] >= 45) {
        sim.remember({
          category: 'life',
          title: `Won The ${event?.label ?? result.eventId} At ${meet.name}`,
          detail: `${formatSeconds(result.seconds)}, and nobody in the field was closer.`,
          refs: [{ type: 'person', id: person.id }],
          significance: TIER_WEIGHT[tier] >= 85 ? 9 : 6,
          public: true,
        });
      }
    }
  }

  sim.emit('track.meet_run', { seasonId: season.id, tier, place: bestPlace, races: meet.results.length });
  const note = lines.length > 0 ? lines.join(' ') : 'Nothing was run.';
  return { note: `${meet.name}. ${note}`, injury };
}

/** First, second, third, and so on. */
export function ordinal(place: number): string {
  const tens = place % 100;
  if (tens >= 11 && tens <= 13) return `${place}th`;
  const ones = place % 10;
  return `${place}${ones === 1 ? 'st' : ones === 2 ? 'nd' : ones === 3 ? 'rd' : 'th'}`;
}


// ---------------------------------------------------------------------------
// The work
// ---------------------------------------------------------------------------

export interface SessionKind {
  id: string;
  label: string;
  /** What it puts into the sheet. */
  feeds: readonly string[];
  /** What it puts into form. */
  form: number;
  /** What it takes out of you. */
  energy: number;
  /** How long it takes, in minutes. */
  minutes: number;
  /** How likely it is to hurt you, before anything else is counted. */
  strain: number;
  about: string;
}

export const SESSIONS: readonly SessionKind[] = [
  {
    id: 'blocks', label: 'Starts And Blocks', feeds: ['block_start', 'reaction_time', 'drive_phase'],
    form: 5, energy: 20, minutes: 90, strain: 2.5,
    about: 'Set, gun, thirty meters, walk back. Twenty times, and the last one is the one that counts.',
  },
  {
    id: 'speed', label: 'Maximum Velocity', feeds: ['top_speed', 'sprint_mechanics', 'running_relaxation'],
    form: 7, energy: 30, minutes: 100, strain: 5,
    about: 'Flying thirties at full speed, which is the session that makes you fast and the one that pulls hamstrings.',
  },
  {
    id: 'endurance', label: 'Speed Endurance', feeds: ['speed_endurance', 'athletic_recovery'],
    form: 8, energy: 34, minutes: 110, strain: 4,
    about: 'Three by three hundred, and you will not enjoy the third one.',
  },
  {
    id: 'technique', label: 'Technical Work', feeds: ['sprint_mechanics', 'curve_running', 'finishing'],
    form: 4, energy: 16, minutes: 80, strain: 1.5,
    about: 'Drills, the bend, and the last ten meters, done slowly and then quickly.',
  },
  {
    id: 'hurdles', label: 'Over The Barriers', feeds: ['hurdle_technique', 'sprint_mechanics'],
    form: 5, energy: 22, minutes: 90, strain: 3,
    about: 'Lead leg, trail leg, three strides, and the one you clip teaches you the most.',
  },
  {
    id: 'handoff', label: 'Baton Work', feeds: ['baton_exchange', 'acceleration'],
    form: 3, energy: 14, minutes: 60, strain: 1,
    about: 'Twenty meters of changeover, again and again, until nobody has to look back.',
  },
  {
    id: 'gym', label: 'The Weights Room', feeds: ['acceleration', 'drive_phase', 'training_discipline'],
    form: 6, energy: 26, minutes: 90, strain: 2,
    about: 'Squats, cleans and the winter work that nobody sees and everybody needs.',
  },
  {
    id: 'recovery', label: 'Recovery', feeds: ['athletic_recovery'],
    form: 2, energy: -10, minutes: 50, strain: 0,
    about: 'A jog, a stretch and the physio table. It is a session, and skipping it is why people get hurt.',
  },
];

export const SESSION_BY_ID: Readonly<Record<string, SessionKind>> = Object.fromEntries(
  SESSIONS.map((one) => [one.id, one]),
);

// ---------------------------------------------------------------------------
// Where there is a track to run on
// ---------------------------------------------------------------------------

/**
 * Whether this particular school has a team.
 *
 * Not every school anywhere runs track, which is the honest half of running
 * at whatever school offers it. In a country where school track is ordinary
 * most schools have a team; everywhere else it is a club that runs it and the
 * school does not.
 */
export function schoolHasTrack(sim: Simulation, placeId: string, countryId: string): boolean {
  if (!schoolsRunTrack(countryId)) return false;
  const rng = sim.rng('track.school', placeId);
  const common = ['us', 'jm', 'tt', 'bs', 'bb', 'ke', 'et'].includes(countryId) ? 0.92 : 0.7;
  return rng.float(0, 1) < common;
}

/** The surface whose season comes round next, at this stage, here. */
export function nextSurfaceFor(sim: Simulation, stage: Stage, countryId: string): Surface | undefined {
  const month = zonedParts(sim.now, sim.homeZone).month;
  let soonest: { surface: Surface; away: number } | undefined;
  for (const surface of ['indoor', 'outdoor'] as const) {
    const ladder = ladderFor(stage, surface, countryId);
    if (!ladder) continue;
    const opensIn = ladder.months.find((one) => one >= month) ?? ladder.months[0]!;
    const away = opensIn >= month ? opensIn - month : 12 - month + opensIn;
    if (!soonest || away < soonest.away) soonest = { surface, away };
  }
  return soonest?.surface;
}

/** The events somebody is best at, which is what a coach would enter them in. */
export function bestEventsFor(
  sim: Simulation, person: Person, running: Running, surface: Surface, count = 2,
): string[] {
  return eventsOpenTo(sim, running, surface)
    .filter((one) => one.kind !== 'relay')
    .map((one) => ({ id: one.id, ability: abilityFor(sim, person, one.id) }))
    .sort((a, b) => b.ability - a.ability)
    .slice(0, count)
    .map((one) => one.id);
}

/** Whether somebody is hurt, and cannot run. */
export function isInjured(sim: Simulation, running: Running): boolean {
  return Boolean(running.injuredUntil && sim.now < running.injuredUntil);
}

/** How a runner reads, in a sentence. */
export function describeRunner(running: Running): string {
  const category = running.category as RunnerCategory;
  const best = [...running.bests].sort(
    (a, b) => qualityOf(b.seconds, b.eventId, category) - qualityOf(a.seconds, a.eventId, category),
  )[0];
  if (!best) return `${CATEGORY_LABEL[category]}, and nothing run in anger yet.`;
  const event = EVENT_BY_ID[best.eventId];
  return `${formatSeconds(best.seconds)} for the ${event?.label ?? best.eventId}. `
    + `${levelOf(best.seconds, best.eventId, category).label}.`;
}

/** The record a runner is chasing in an event, where there is one. */
export function chasing(eventId: string, category: RunnerCategory, surface: Surface): string | undefined {
  const record = recordFor(eventId, category, surface);
  if (!record) return undefined;
  return `The world record is ${formatSeconds(record.seconds)}, ${record.holder}, ${record.place} ${record.year}.`;
}

// ---------------------------------------------------------------------------
// The commands
// ---------------------------------------------------------------------------

export function registerAthletics(sim: Simulation): void {
  /** Trying out, at whatever school or university offers it. */
  sim.onCommand<
    { category?: string; eventIds?: string[] },
    { onTheTeam: boolean; stage: string; note: string }
  >(
    'track.join',
    (p, { sim: s }) => {
      const person = s.player;
      const age = ageOf(s);
      if (age < TRACK_FROM_AGE) {
        throw new CommandError(`Nobody is put in a lane before ${TRACK_FROM_AGE}. You are ${age}.`);
      }
      const running = ensureRunning(s, p.category as RunnerCategory | undefined);
      if (isInjured(s, running)) throw new CommandError('You are hurt. There is no trial to go to.');
      if (seasonOf(s)) throw new CommandError('You are in a season already.');

      const countryId = countryOfCity(person.currentLocationId) ?? person.citizenshipId;
      const studies = studiesOf(s);
      const schooling = studies ? undefined : schoolingOf(s);
      const stage: Stage = studies ? 'university' : schooling ? 'school' : 'professional';
      if (stage === 'professional' && !running.professional) {
        throw new CommandError('You are not at a school or a university. A club is the way in from here.');
      }

      const surface = nextSurfaceFor(s, stage, countryId);
      if (!surface) throw new CommandError('There is no season to join here.');

      let teamName = running.teamName ?? 'A Club';
      if (stage === 'school' && schooling) {
        if (!schoolHasTrack(s, schooling.placeId, countryId)) {
          throw new CommandError(
            `${schooling.placeName} does not run a track team. Not every school does, and this is one that does not.`,
          );
        }
        teamName = schooling.placeName;
      } else if (stage === 'university' && studies) {
        teamName = studies.universityName;
      }

      const eventIds = p.eventIds?.length ? p.eventIds : bestEventsFor(s, person, running, surface);
      const ability = Math.max(...eventIds.map((id) => abilityFor(s, person, id)), 0);
      const rng = s.rng('track.trial', running.id, `${stage}:${surface}`);
      // A university side is a different thing from a school one, and a place
      // won on the track is already a place on the team.
      const onScholarship = stage === 'university' && studies?.scholarship === 'athletic';
      const bar = stage === 'university' ? 62 : 40;
      const onTheTeam = onScholarship || ability + rng.int(-10, 10) >= bar;

      s.advanceTo(s.now + 100 * MS_MINUTE);
      person.wellbeing.energy = clamp((person.wellbeing.energy ?? 100) - 15, 0, 100);

      if (!onTheTeam) {
        s.emit('track.trial', { onTheTeam: false, stage });
        return {
          onTheTeam: false, stage,
          note: `You ran the trial and did not make the team. ${stage === 'university'
            ? 'A university squad is a different thing from a school one.'
            : 'There is next year, and there is the work between now and it.'}`,
        };
      }

      running.eventIds = eventIds;
      running.stage = stage;
      running.teamName = teamName;
      const season = startSeason(s, stage, surface, teamName, eventIds, person);
      const named = eventIds.map((id) => EVENT_BY_ID[id]?.label ?? id).join(' and ');
      s.emit('track.trial', { onTheTeam: true, stage, seasonId: season?.id });
      return {
        onTheTeam: true, stage,
        note: onScholarship
          ? `You are on the ${teamName} squad. That is what the place was for. ${named}.`
          : `You made the ${teamName} squad. ${named}.`,
      };
    },
  );

  /** Changing what you run. */
  sim.onCommand<{ eventIds: string[] }, { eventIds: string[]; note: string }>(
    'track.enter',
    (p, { sim: s }) => {
      const running = runningOf(s);
      if (!running) throw new CommandError('You do not run.');
      const surface = (seasonOf(s)?.surface ?? 'outdoor') as Surface;
      const open = new Set(eventsOpenTo(s, running, surface).map((one) => one.id));
      const chosen = p.eventIds.filter((id) => open.has(id));
      if (chosen.length === 0) throw new CommandError('None of those are events you can enter here.');
      if (chosen.length > 3) throw new CommandError('Three events at a meet is as many as anybody runs.');
      running.eventIds = chosen;
      const season = seasonOf(s);
      if (season) {
        season.eventIds = chosen;
        for (const meet of season.meets) {
          if (meet.run) continue;
          meet.eventIds = chosen.filter((id) => EVENT_BY_ID[id]?.surfaces.includes(season.surface as Surface));
        }
      }
      const named = chosen.map((id) => EVENT_BY_ID[id]?.label ?? id).join(', ');
      return { eventIds: chosen, note: `Entered in ${named}.` };
    },
  );

  /** A session. The winter work is where a season is made. */
  sim.onCommand<
    { kind?: string },
    { form: number; gained: string[]; note: string; injury?: string }
  >(
    'track.train',
    (p, { sim: s }) => {
      const running = runningOf(s);
      if (!running) throw new CommandError('You do not run. There is a trial first.');
      if (isInjured(s, running)) {
        throw new CommandError(`${running.injury ?? 'You are hurt.'} Nothing until it settles.`);
      }
      const session = SESSION_BY_ID[p.kind ?? 'speed'];
      if (!session) throw new CommandError('That is not a session.');
      const person = s.player;
      if ((person.wellbeing.energy ?? 100) < 20 && session.id !== 'recovery') {
        throw new CommandError('There is nothing in your legs. Recovery, or nothing.');
      }

      const rng = s.rng('track.session', running.id, running.sessions);
      const gained: string[] = [];
      for (const skillId of session.feeds) {
        const before = person.skills?.[skillId] ?? 0;
        if (before >= 100) continue;
        const step = rng.float(0.25, 0.95);
        person.skills[skillId] = clamp(Math.round((before + step) * 10) / 10, 0, 100);
        gained.push(skillId);
      }
      running.sessions += 1;
      running.form = clamp(formNow(s, running) + session.form, 0, 100);
      running.formAt = s.now;

      s.advanceTo(s.now + session.minutes * MS_MINUTE);
      person.wellbeing.energy = clamp((person.wellbeing.energy ?? 100) - session.energy, 0, 100);
      person.wellbeing.fitness = clamp((person.wellbeing.fitness ?? 50) + 0.8, 0, 100);
      const injury = session.strain > 0
        ? checkInjury(s, running, person, `${running.id}:${running.sessions}`, session.strain)
        : undefined;

      s.emit('track.trained', { kind: session.id, sessions: running.sessions });
      return {
        form: running.form,
        gained,
        note: injury
          ? `${session.label}. ${injury}`
          : `${session.label}. Form at ${running.form}.`,
        injury,
      };
    },
  );

  /** The next meet on the schedule, every round of it. */
  sim.onCommand<
    Record<string, never>,
    { note: string; place?: number; over: boolean; injury?: string }
  >(
    'track.race',
    (_p, { sim: s }) => {
      const season = seasonOf(s);
      if (!season) throw new CommandError('You are not in a season.');
      const running = runningOf(s)!;
      if (isInjured(s, running)) {
        throw new CommandError(`${running.injury ?? 'You are hurt.'} You are not racing.`);
      }
      const meet = nextMeet(season);
      if (!meet) throw new CommandError('There is nothing left on the schedule.');
      if (s.now < meet.at - 6 * 60 * 60_000) {
        throw new CommandError(`${meet.name} is on ${formatDate(meet.at, s.homeZone)}. Not yet.`);
      }
      const qualified = qualifiedFor(season, meet);
      if (!qualified.yes) {
        meet.run = true;
        meet.locked = true;
        endSeason(s, season, 'at the rung below it');
        return { note: `${meet.name}. ${qualified.why}`, over: true };
      }

      const outcome = runMeet(s, season, meet, running, s.player);
      let over = false;
      if (!nextMeet(season)) {
        endSeason(s, season, 'with the schedule run');
        over = true;
      }
      return { note: outcome.note, place: meet.place, over, injury: outcome.injury };
    },
  );

  /** Sitting one out. */
  sim.onCommand<Record<string, never>, { note: string }>(
    'track.skip_meet',
    (_p, { sim: s }) => {
      const season = seasonOf(s);
      if (!season) throw new CommandError('You are not in a season.');
      const meet = nextMeet(season);
      if (!meet) throw new CommandError('There is nothing left on the schedule.');
      meet.run = true;
      meet.locked = true;
      s.advanceTo(Math.max(s.now, meet.at) + 60 * MS_MINUTE);
      return { note: `You did not run at ${meet.name}.` };
    },
  );

  /** Walking away from a season. */
  sim.onCommand<Record<string, never>, { note: string }>(
    'track.leave',
    (_p, { sim: s }) => {
      const season = seasonOf(s);
      if (!season) throw new CommandError('You are not in a season.');
      endSeason(s, season, 'with you walking away from it');
      return { note: `You left the ${season.teamName} squad.` };
    },
  );
}

export {
  ATHLETICS_NOTE, EVENTS, EVENT_BY_ID, LEVELS, MEET_BY_ID, NAMED_MEETS, ROUND_LABEL, TIER_LABEL,
  WIND_LIMIT, eventsFor, individualEvents, ladderFor, levelOf, qualityOf, recordFor,
  schoolsRunTrack, standardFor, timeAt, timeForLevel,
};
