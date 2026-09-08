/**
 * The track.
 *
 * What a test can hold about the one sport in the game: real events at their
 * real distances, real records with the people who set them, real meets in
 * real towns, and a time that comes out of what somebody can do rather than
 * out of a dice cup. And the honest half of it — that nobody real is ever in
 * the next lane, and that no time in this game is anybody's but the player's.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  ATHLETICS_NOTE, CATEGORY_NOTE, ENTRY_STANDARDS, EVENTS, EVENT_BY_ID, LEVELS, MEETS_NOTE,
  NAMED_MEETS, RECORDS_NOTE, RIVAL_FIRST, RIVAL_LAST, SEASON_LADDERS, TIER_WEIGHT, TRACK_FROM_AGE,
  WIND_LIMIT, WORLD_RECORDS, endsFor, eventsFor, ladderFor, ladderIsCountrys, levelOf, qualityOf,
  recordFor, roundsAt, schoolWords, schoolsRunTrack, standardFor, timeAt, timeForLevel, windLegal,
} from '@/engine/content/athletics';
import {
  abilityFor, bestEventsFor, describeSeason, ensureRunning, formNow, formatSeconds, formatWind,
  isInjured, nextMeet, ordinal, predict, qualifiedFor, runningOf, seasonOf, seasonsOf,
} from '@/engine/systems/athletics';
import { SKILLS } from '@/engine/domain/skills';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import { ageOf } from '@/engine/systems/lifespan';
import type { Simulation } from '@/engine/core/simulation';

/** Somebody old enough to be put in a lane, where you say. */
function aRunner(seed: string, birthYear = 2008, cityId = 'us-ca-losangeles'): Simulation {
  return quickSave({ birthYear, startLocationId: cityId, homeRegionId: cityId }, seed);
}

/** Get them on a team, or say why not. */
function join(sim: Simulation): { onTheTeam: boolean; note: string } | undefined {
  const res = sim.execute<{ onTheTeam: boolean; note: string }>({ kind: 'track.join', payload: {} });
  return res.ok ? res.value : undefined;
}

// ---------------------------------------------------------------------------

describe('the events, which are real', () => {
  it('runs each one over its real distance, on the surface it is really run on', () => {
    for (const event of EVENTS) {
      expect(event.metres, event.label).toBeGreaterThanOrEqual(60);
      expect(event.surfaces.length, event.label).toBeGreaterThan(0);
      expect(event.about.length).toBeGreaterThan(19);
    }
    expect(EVENT_BY_ID['100m']!.metres).toBe(100);
    expect(EVENT_BY_ID['110mh']!.metres).toBe(110);
    expect(EVENT_BY_ID['60m']!.surfaces).toEqual(['indoor']);
  });

  it('decides every event with a share of one runner, out of real skills', () => {
    const skillIds = new Set(SKILLS.map((one) => one.id));
    for (const event of EVENTS) {
      const total = Object.values(event.weights).reduce((sum, one) => sum + one, 0);
      expect(Math.abs(total - 1), event.label).toBeLessThan(0.001);
      for (const key of Object.keys(event.weights)) expect(skillIds.has(key), key).toBe(true);
    }
    // A hundred meters is mostly top speed and a four hundred mostly is not.
    expect(EVENT_BY_ID['100m']!.weights.top_speed).toBeGreaterThan(EVENT_BY_ID['400m']!.weights.top_speed!);
    expect(EVENT_BY_ID['400m']!.weights.speed_endurance).toBeGreaterThan(EVENT_BY_ID['100m']!.weights.speed_endurance!);
  });

  it('runs the high hurdles in one category and the women’s in the other', () => {
    expect(EVENT_BY_ID['110mh']!.category).toBe('mens');
    expect(EVENT_BY_ID['100mh']!.category).toBe('womens');
    expect(eventsFor('womens').map((one) => one.id)).not.toContain('110mh');
    expect(eventsFor('mens').map((one) => one.id)).not.toContain('100mh');
    expect(eventsFor('mens').length).toBeGreaterThan(7);
    expect(eventsFor('womens').length).toBeGreaterThan(7);
  });

  it('reads a wind gauge in the events that have one, and only outdoors', () => {
    expect(WIND_LIMIT).toBe(2.0);
    expect(windLegal('100m', 2.0)).toBe(true);
    expect(windLegal('100m', 2.1)).toBe(false);
    // A four hundred and an indoor race do not read one at all.
    expect(windLegal('400m', 6)).toBe(true);
    expect(windLegal('60m', 6)).toBe(true);
    for (const event of EVENTS) {
      if (event.windRead) expect(event.surfaces, event.label).toContain('outdoor');
    }
  });
});

describe('the records, which are real', () => {
  it('carries one record per event and category, with who set it and when', () => {
    const seen = new Set<string>();
    for (const record of WORLD_RECORDS) {
      const key = `${record.eventId}:${record.category}:${record.surface}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
      expect(EVENT_BY_ID[record.eventId], record.eventId).toBeDefined();
      expect(record.holder.length).toBeGreaterThan(2);
      expect(record.place.length).toBeGreaterThan(2);
      expect(record.year).toBeGreaterThan(1911);
      expect(record.year).toBeLessThanOrEqual(2026);
    }
    expect(WORLD_RECORDS.length).toBeGreaterThan(15);
  });

  it('holds the two everybody knows', () => {
    expect(recordFor('100m', 'mens', 'outdoor')!.seconds).toBe(9.58);
    expect(recordFor('100m', 'mens', 'outdoor')!.holder).toBe('Usain Bolt');
    expect(recordFor('100m', 'womens', 'outdoor')!.seconds).toBe(10.49);
  });

  it('says out loud that a record set since is not in here', () => {
    expect(RECORDS_NOTE).toMatch(/real/);
    expect(RECORDS_NOTE).toMatch(/not in here/);
  });
});

describe('what a time is worth', () => {
  it('reads the same line forwards and backwards', () => {
    for (const seconds of [9.9, 10.4, 11.2, 12.5]) {
      const back = timeAt(qualityOf(seconds, '100m', 'mens'), '100m', 'mens')!;
      expect(Math.abs(back - seconds)).toBeLessThan(0.02);
    }
  });

  it('calls the world record world class and a first day a first day', () => {
    expect(levelOf(9.58, '100m', 'mens').id).toBe('world');
    expect(levelOf(13.8, '100m', 'mens').id).toBe('first_day');
    expect(levelOf(12.2, '100m', 'mens').id).toBe('team');
  });

  it('holds the ladder in order, and easier for a woman than the same ratio', () => {
    let last = 99;
    for (const level of LEVELS) {
      expect(level.ratio, level.label).toBeLessThan(last);
      last = level.ratio;
      expect(level.womens).toBeGreaterThanOrEqual(level.ratio);
      expect(level.about.length).toBeGreaterThan(14);
    }
    // And the ladder is a real set of times in every event.
    for (const category of ['mens', 'womens'] as const) {
      for (const event of eventsFor(category)) {
        const world = timeForLevel('world', event.id, category)!;
        const team = timeForLevel('team', event.id, category)!;
        expect(team, `${event.label} ${category}`).toBeGreaterThan(world);
        expect(world).toBeGreaterThan(endsFor(event.id, category)!.best);
      }
    }
  });

  it('sets the entry standards inside the range a real standard sits in', () => {
    for (const [eventId, byCategory] of Object.entries(ENTRY_STANDARDS)) {
      for (const [category, seconds] of Object.entries(byCategory)) {
        if (seconds === 0) continue;
        const record = recordFor(eventId, category as 'mens' | 'womens', 'outdoor')!;
        expect(seconds, `${category} ${eventId}`).toBeGreaterThan(record.seconds);
        const level = levelOf(seconds, eventId, category as 'mens' | 'womens').id;
        expect(['national', 'world'], `${category} ${eventId}`).toContain(level);
      }
    }
    expect(standardFor('110mh', 'womens')).toBeUndefined();
    expect(standardFor('100m', 'mens')).toBe(10.0);
  });
});

describe('the meets, which are real', () => {
  it('holds each one in a real town, in a country the geography has, in its own month', () => {
    const seen = new Set<string>();
    for (const meet of NAMED_MEETS) {
      expect(seen.has(meet.id), meet.id).toBe(false);
      seen.add(meet.id);
      expect(COUNTRIES.get(meet.countryId), meet.name).toBeDefined();
      if (meet.cityId) expect(CITIES.get(meet.cityId), meet.name).toBeDefined();
      expect(meet.month).toBeGreaterThan(0);
      expect(meet.month).toBeLessThan(13);
      expect(meet.town.length).toBeGreaterThan(3);
      expect(meet.about.length).toBeGreaterThan(19);
    }
    expect(NAMED_MEETS.length).toBeGreaterThan(50);
  });

  it('carries the ones everybody has heard of', () => {
    for (const id of ['penn_relays', 'champs', 'prefontaine', 'world_champs', 'olympics']) {
      expect(NAMED_MEETS.some((one) => one.id === id), id).toBe(true);
    }
  });

  it('never puts an indoor meet in the middle of the summer', () => {
    for (const meet of NAMED_MEETS) {
      if (meet.surface === 'indoor') expect([12, 1, 2, 3], meet.name).toContain(meet.month);
    }
  });
});

describe('a season', () => {
  it('runs the ladder that country really runs, and a general one where it does not', () => {
    expect(ladderIsCountrys('school', 'indoor', 'us')).toBe(true);
    expect(ladderIsCountrys('school', 'indoor', 'uk')).toBe(false);
    const general = ladderFor('school', 'outdoor', 'mn');
    expect(general).toBeDefined();
    expect(general!.countryIds).toHaveLength(0);
    for (const ladder of SEASON_LADDERS) {
      const weights = ladder.rungs.map((one) => TIER_WEIGHT[one.tier]);
      expect(Math.min(...weights), `${ladder.stage} ${ladder.surface}`).toBe(weights[0]);
      expect(ladder.rungs[0]!.qualifyBy).toBeUndefined();
    }
  });

  it('runs three rounds of a championship hundred and one race at a dual meet', () => {
    expect(roundsAt('global', '100m')).toEqual(['heat', 'semi', 'final']);
    expect(roundsAt('dual', '100m')).toEqual(['final']);
    expect(roundsAt('global', '4x100m')).toEqual(['final']);
    expect(roundsAt('global', '400m')).toEqual(['heat', 'final']);
  });

  it('deals a schedule that moves forward and is named', () => {
    const sim = aRunner('season-deal');
    const made = join(sim);
    if (!made?.onTheTeam) return;
    const season = seasonOf(sim)!;
    expect(season.meets.length).toBeGreaterThan(4);
    let previous = 0;
    for (const meet of season.meets) {
      expect(meet.at).toBeGreaterThan(previous);
      previous = meet.at;
      expect(meet.name.length).toBeGreaterThan(3);
      expect(meet.eventIds.length).toBeGreaterThan(0);
    }
    expect(describeSeason(sim, season)).toMatch(/Next:/);
  });

  it('does not deal a second schedule when you ask twice', () => {
    const sim = aRunner('season-twice');
    if (!join(sim)?.onTheTeam) return;
    const first = seasonOf(sim)!.id;
    const again = sim.execute({ kind: 'track.join', payload: {} });
    expect(again.ok).toBe(false);
    expect(seasonOf(sim)!.id).toBe(first);
    expect(seasonsOf(sim)).toHaveLength(1);
  });

  it('refuses a meet that has not come round yet, and says when it is', () => {
    const sim = aRunner('season-early');
    if (!join(sim)?.onTheTeam) return;
    const res = sim.execute({ kind: 'track.race', payload: {} });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Not yet/);
  });

  it('runs a meet, writes the times down and keeps the best of them', () => {
    const sim = aRunner('season-race');
    if (!join(sim)?.onTheTeam) return;
    const season = seasonOf(sim)!;
    const meet = nextMeet(season)!;
    sim.advanceTo(meet.at);
    const res = sim.execute<{ note: string }>({ kind: 'track.race', payload: {} });
    expect(res.ok, res.error).toBe(true);
    expect(meet.run).toBe(true);
    expect(meet.results.length).toBeGreaterThan(0);
    for (const result of meet.results) {
      expect(result.seconds).toBeGreaterThan(0);
      expect(result.place).toBeGreaterThan(0);
      expect(result.place).toBeLessThanOrEqual(result.of);
      expect(result.lane).toBeGreaterThan(0);
    }
    const running = runningOf(sim)!;
    expect(running.bests.length).toBeGreaterThan(0);
    for (const mark of running.bests) expect(mark.legal).toBe(true);
  });

  it('will not let somebody at the rung below into the rung above', () => {
    const sim = aRunner('season-qualify');
    if (!join(sim)?.onTheTeam) return;
    const season = seasonOf(sim)!;
    const gated = season.meets.find((one) => !qualifiedFor(season, one).yes);
    if (!gated) return;
    expect(qualifiedFor(season, gated).why.length).toBeGreaterThan(10);
  });

  it('lets somebody sit one out, and lets them walk away', () => {
    const sim = aRunner('season-quit');
    if (!join(sim)?.onTheTeam) return;
    const season = seasonOf(sim)!;
    const skipped = sim.execute({ kind: 'track.skip_meet', payload: {} });
    expect(skipped.ok).toBe(true);
    expect(season.meets[0]!.run).toBe(true);
    expect(season.meets[0]!.results).toHaveLength(0);
    const left = sim.execute({ kind: 'track.leave', payload: {} });
    expect(left.ok).toBe(true);
    expect(season.endedAt).toBeDefined();
    expect(seasonOf(sim)).toBeUndefined();
  });
});

describe('a time has to be earned', () => {
  it('holds a child under the same curve everything else uses', () => {
    const child = aRunner('curve-child', 2014);
    const grown = aRunner('curve-grown', 2002);
    expect(ageOf(child)).toBeLessThan(14);
    expect(abilityFor(child, child.player, '100m')).toBeLessThan(abilityFor(grown, grown.player, '100m'));
    expect(abilityFor(child, child.player, '100m')).toBeGreaterThan(0);
  });

  it('starts everybody with no form, and builds it a session at a time', () => {
    const sim = aRunner('form');
    const running = ensureRunning(sim);
    expect(running.form).toBeLessThan(35);
    const before = formNow(sim, running);
    const res = sim.execute({ kind: 'track.train', payload: { kind: 'speed' } });
    expect(res.ok, res.error).toBe(true);
    expect(formNow(sim, running)).toBeGreaterThan(before);
    expect(running.sessions).toBe(1);
  });

  it('lets form go off when nothing is put in', () => {
    const sim = aRunner('form-off');
    const running = ensureRunning(sim);
    running.form = 90;
    running.formAt = sim.now;
    expect(formNow(sim, running)).toBe(90);
    sim.advanceTo(sim.now + 21 * 24 * 60 * 60_000);
    expect(formNow(sim, running)).toBeLessThan(60);
  });

  it('runs faster on form than off it', () => {
    const sim = aRunner('form-time');
    const running = ensureRunning(sim);
    running.eventIds = ['100m'];
    running.form = 5;
    running.formAt = sim.now;
    const unfit = predict(sim, sim.player, '100m', running)!;
    running.form = 95;
    running.formAt = sim.now;
    const fit = predict(sim, sim.player, '100m', running)!;
    expect(fit).toBeLessThan(unfit);
  });

  it('will not put a small child in a lane', () => {
    const small = aRunner('too-young', 2018);
    expect(ageOf(small)).toBeLessThan(TRACK_FROM_AGE);
    const res = small.execute({ kind: 'track.join', payload: {} });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/before/);
  });

  it('will not let somebody race or train while they are hurt', () => {
    const sim = aRunner('hurt');
    if (!join(sim)?.onTheTeam) return;
    const running = runningOf(sim)!;
    running.injuredUntil = sim.now + 14 * 24 * 60 * 60_000;
    running.injury = 'A hamstring.';
    expect(isInjured(sim, running)).toBe(true);
    expect(sim.execute({ kind: 'track.train', payload: { kind: 'speed' } }).ok).toBe(false);
    const meet = nextMeet(seasonOf(sim)!)!;
    sim.advanceTo(meet.at);
    expect(sim.execute({ kind: 'track.race', payload: {} }).ok).toBe(false);
  });

  it('enters somebody in the events they are best at, and no more than three', () => {
    const sim = aRunner('events');
    const running = ensureRunning(sim);
    const best = bestEventsFor(sim, sim.player, running, 'outdoor', 2);
    expect(best).toHaveLength(2);
    const tooMany = sim.execute({ kind: 'track.enter', payload: { eventIds: ['100m', '200m', '400m', '400mh'] } });
    expect(tooMany.ok).toBe(false);
    const fine = sim.execute({ kind: 'track.enter', payload: { eventIds: ['100m', '200m'] } });
    expect(fine.ok).toBe(true);
    expect(runningOf(sim)!.eventIds).toEqual(['100m', '200m']);
  });
});

describe('what is SLATE’s own, and says so', () => {
  it('never puts a real record holder in the next lane', () => {
    const holders = new Set(WORLD_RECORDS.map((one) => one.holder.toLowerCase()));
    for (const first of RIVAL_FIRST) {
      for (const last of RIVAL_LAST) {
        expect(holders.has(`${first} ${last}`.toLowerCase()), `${first} ${last}`).toBe(false);
      }
    }
  });

  it('calls the school across town what that country calls a school', () => {
    expect(schoolWords('us')).not.toContain('Comprehensive');
    expect(schoolWords('uk')).toContain('Comprehensive');
    expect(schoolWords('de')).toContain('Gymnasium');
    expect(schoolWords('mn')).toEqual(schoolWords('zz'));
  });

  it('only runs a school season where a country’s schools really run one', () => {
    expect(schoolsRunTrack('us')).toBe(true);
    expect(schoolsRunTrack('jm')).toBe(true);
    expect(schoolsRunTrack('mc')).toBe(false);
  });

  it('says out loud which half of the track is real', () => {
    expect(ATHLETICS_NOTE).toMatch(/SLATE/);
    expect(ATHLETICS_NOTE).toMatch(/no results feed/);
    expect(MEETS_NOTE).toMatch(/real meet in a real town/);
    expect(CATEGORY_NOTE).toMatch(/own choice/);
  });

  it('writes a time the way a track writes it', () => {
    expect(formatSeconds(10.42)).toBe('10.42');
    expect(formatSeconds(174.29)).toBe('2:54.29');
    expect(formatSeconds(65.4)).toBe('1:05.40');
    expect(formatWind(1.6)).toBe('+1.6');
    expect(formatWind(-0.8)).toBe('-0.8');
    expect(ordinal(1)).toBe('1st');
    expect(ordinal(2)).toBe('2nd');
    expect(ordinal(3)).toBe('3rd');
    expect(ordinal(11)).toBe('11th');
    expect(ordinal(22)).toBe('22nd');
  });
});
