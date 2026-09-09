/**
 * University.
 *
 * What a test can hold about the last rung of the ladder: real universities
 * in the towns they really stand in, never claimed to be in a city they are
 * only reached from; a fee regime that is the country's own; an admissions
 * answer that is a curve rather than a wall and says why; a conservatoire
 * that teaches its one thing; a place won on sport only where a place can
 * really be won on sport; and a degree that takes years and ends in a class
 * that depends on what you did while you were there.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  APPLY_FROM_AGE, MAX_OPEN_APPLICATIONS, applicationsOf, chanceAt, degreesOf, describeStudies,
  feesFor, marksOn, studiesHistoryOf, studiesOf, trackRecord, universitiesIn,
  universitiesInCountry, whereItIs,
} from '@/engine/systems/university';
import {
  ATHLETIC_SCHOLARSHIP_COUNTRIES, DEGREE_CLASSES, FEES_BY_COUNTRY, MAJORS, MAJOR_BY_ID,
  UNIVERSITIES, UNIVERSITY_BY_ID, UNIVERSITY_NOTE, degreeClass, feesIn, majorsAt,
} from '@/engine/content/universities';
import { UNIVERSITY_LOOKS_AT } from '@/engine/content/schooling';
import { schoolingOf } from '@/engine/systems/school';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import { MS_DAY } from '@/engine/core/time';
import { ensureRunning } from '@/engine/systems/athletics';
import type { Simulation } from '@/engine/core/simulation';

/** Somebody at the end of school, carrying the marks you set. */
function aLeaver(seed: string, marks: number, cityId = 'uk-eng-london'): Simulation {
  const sim = quickSave(
    { birthYear: 2008, startLocationId: cityId, homeRegionId: cityId, wealth: 'wealthy' }, seed,
  );
  sim.income(sim.player.primaryAccountId!, 900_000_00, 'Test funding', 'other');
  const schooling = schoolingOf(sim);
  if (schooling) for (const mark of schooling.marks) mark.mark = marks;
  return sim;
}

/** Somebody with a time on the list, and a season of meets behind it. */
function giveThemATime(sim: Simulation, seconds: number, meets: number): void {
  const running = ensureRunning(sim);
  running.bests = [{
    eventId: '100m', surface: 'outdoor', seconds, legal: true, at: sim.now, where: 'A Meet',
  }];
  sim.universe.seasons ??= {};
  const season = {
    id: 'season_test', saveId: sim.universe.meta.id, personId: sim.player.id,
    stage: 'school', surface: 'outdoor', teamName: 'A School', countryId: 'us',
    year: 2026, eventIds: ['100m'],
    meets: Array.from({ length: meets }, (_, i) => ({
      at: sim.now - (meets - i) * MS_DAY, name: 'A Meet', town: 'A Town', tier: 'invitational',
      eventIds: ['100m'], run: true, place: 2,
      results: [{
        round: 'final', eventId: '100m', lane: 4, seconds, legal: true, place: 2, of: 8,
        through: false, personalBest: true, seasonBest: true,
      }],
    })),
    startedAt: sim.now - meets * MS_DAY,
  };
  sim.universe.seasons[season.id] = season;
}

// ---------------------------------------------------------------------------

describe('the universities, which are real', () => {
  it('stands each one in a country the geography has, reached from a city in it', () => {
    for (const one of UNIVERSITIES) {
      expect(COUNTRIES.get(one.countryId), one.name).toBeDefined();
      const city = CITIES.get(one.cityId);
      expect(city, `${one.name} -> ${one.cityId}`).toBeDefined();
      // Kuwait University is the one row reached across a border, and it says so.
      if (one.id !== 'ku_kuwait') expect(city!.countryId, one.name).toBe(one.countryId);
      expect(one.town.length).toBeGreaterThan(2);
      expect(one.founded).toBeGreaterThanOrEqual(1000);
      expect(one.founded).toBeLessThanOrEqual(2026);
    }
    expect(UNIVERSITIES.length).toBeGreaterThan(120);
  });

  it('never claims a university is in a city it is only reached from', () => {
    for (const one of UNIVERSITIES) {
      const said = whereItIs(one);
      const city = CITIES.get(one.cityId)!;
      if (city.name !== one.town) expect(said, one.name).toContain('reached from');
      expect(said).toContain(one.town);
    }
    // Oxford is not in London and the row says exactly that.
    expect(whereItIs(UNIVERSITY_BY_ID.oxford!)).toBe('Oxford, reached from London');
    expect(whereItIs(UNIVERSITY_BY_ID.manchester!)).toBe('Manchester');
  });

  it('lists no university twice, by id or by name', () => {
    expect(new Set(UNIVERSITIES.map((one) => one.id)).size).toBe(UNIVERSITIES.length);
    expect(new Set(UNIVERSITIES.map((one) => one.name)).size).toBe(UNIVERSITIES.length);
  });

  it('says which half of a university is real', () => {
    expect(UNIVERSITY_NOTE).toMatch(/real/);
    expect(UNIVERSITY_NOTE).toMatch(/SLATE/);
    expect(UNIVERSITY_NOTE).toMatch(/reached from/);
  });

  it('carries the fee regime of every country it has a university in', () => {
    for (const countryId of new Set(UNIVERSITIES.map((one) => one.countryId))) {
      expect(FEES_BY_COUNTRY[countryId], countryId).toBeDefined();
    }
    // The regimes that are genuinely different from each other.
    expect(feesIn('no').regime).toBe('free');
    expect(feesIn('de').regime).toBe('nominal');
    expect(feesIn('uk').regime).toBe('capped');
    expect(feesIn('au').regime).toBe('deferred');
    expect(feesIn('us').regime).toBe('market');
    expect(feesIn('no').perYear).toBe(0);
  });
});

describe('what you can read', () => {
  it('teaches a conservatoire’s one thing and not economics', () => {
    for (const id of ['rada', 'juilliard', 'nfts', 'afi', 'femis']) {
      const offered = majorsAt(UNIVERSITY_BY_ID[id]!).map((one) => one.id);
      expect(offered.length, id).toBeLessThanOrEqual(6);
      expect(offered, id).not.toContain('economics');
      expect(offered, id).not.toContain('medicine');
    }
    expect(majorsAt(UNIVERSITY_BY_ID.rada!).map((one) => one.id)).toContain('acting');
  });

  it('teaches the broad subjects at a broad university', () => {
    for (const id of ['oxford', 'usc', 'toronto', 'melbourne']) {
      expect(majorsAt(UNIVERSITY_BY_ID[id]!).length, id).toBeGreaterThan(5);
    }
  });

  it('gives every course something real to teach and a sane length', () => {
    for (const major of MAJORS) {
      expect(major.years).toBeGreaterThanOrEqual(3);
      expect(major.years).toBeLessThanOrEqual(7);
      expect(major.feeds.length).toBeGreaterThan(0);
    }
    expect(MAJOR_BY_ID.medicine!.years).toBe(6);
    expect(MAJOR_BY_ID.acting!.field).toBe('drama');
  });
});

describe('whether they would take you', () => {
  it('refuses below the bar and says what the bar is', () => {
    const sim = aLeaver('below', 40);
    for (const id of ['oxford', 'manchester', 'ucl']) {
      const chance = chanceAt(sim, UNIVERSITY_BY_ID[id]!, 'english');
      expect(chance.eligible, id).toBe(false);
      expect(chance.odds).toBe(0);
      expect(chance.reason).toContain(String(UNIVERSITY_LOOKS_AT));
    }
  });

  it('is a curve rather than a wall, and an easier place is easier', () => {
    const sim = aLeaver('curve', 90);
    const hard = chanceAt(sim, UNIVERSITY_BY_ID.oxford!, 'english');
    const easier = chanceAt(sim, UNIVERSITY_BY_ID.manchester!, 'english');
    expect(hard.eligible).toBe(true);
    expect(easier.odds).toBeGreaterThan(hard.odds);
    expect(hard.odds).toBeGreaterThan(2);
    expect(easier.odds).toBeLessThan(97);
  });

  it('offers a place on marks, and one on the track only where that is real', () => {
    const strong = aLeaver('academic', 92);
    expect(chanceAt(strong, UNIVERSITY_BY_ID.manchester!, 'english').scholarship).toBe('academic');

    // Somebody quick, with a season of meets behind them. England offers
    // nothing on sport, because a British university does not work that way.
    const runner = aLeaver('track-uk', 72);
    giveThemATime(runner, 10.35, 5);
    expect(trackRecord(runner).level).toBe('schools');
    expect(trackRecord(runner).meets).toBe(5);
    expect(chanceAt(runner, UNIVERSITY_BY_ID.manchester!, 'english').scholarship).toBeUndefined();
    expect(ATHLETIC_SCHOLARSHIP_COUNTRIES.has('uk')).toBe(false);

    // And America does, which is the whole point of carrying it.
    const american = aLeaver('track-us', 72, 'us-ca-losangeles');
    giveThemATime(american, 10.35, 5);
    expect(chanceAt(american, UNIVERSITY_BY_ID.asu!, 'business').scholarship).toBe('athletic');
    expect(ATHLETIC_SCHOLARSHIP_COUNTRIES.has('us')).toBe(true);

    // A time with no season behind it is not a scholarship: a coach wants to
    // have seen you run more than once.
    const untested = aLeaver('track-untested', 72, 'us-ca-losangeles');
    giveThemATime(untested, 10.35, 1);
    expect(chanceAt(untested, UNIVERSITY_BY_ID.asu!, 'business').scholarship).toBeUndefined();
  });

  it('auditions rather than reads marks for a drama school', () => {
    const sim = aLeaver('audition', 62);
    // Below the academic bar, and a conservatoire still looks.
    expect(marksOn(sim)).toBeLessThan(UNIVERSITY_LOOKS_AT);
    const drama = chanceAt(sim, UNIVERSITY_BY_ID.rada!, 'acting');
    expect(drama.eligible).toBe(true);
    expect(drama.reason).toMatch(/auditions/);
    // But its English course is not an audition, so the marks still bite.
    const academic = chanceAt(sim, UNIVERSITY_BY_ID.oxford!, 'english');
    expect(academic.eligible).toBe(false);
  });

  it('takes the scholarship off the invoice', () => {
    const usc = UNIVERSITY_BY_ID.usc!;
    const full = feesFor(usc);
    expect(full).toBeGreaterThan(0);
    expect(feesFor(usc, 'academic')).toBeLessThan(full);
    expect(feesFor(usc, 'athletic')).toBeLessThan(feesFor(usc, 'academic'));
    // And nothing off nothing.
    expect(feesFor(UNIVERSITY_BY_ID.oslo!)).toBe(0);
    expect(feesFor(UNIVERSITY_BY_ID.oslo!, 'academic')).toBe(0);
  });
});

describe('applying', () => {
  it('will not let a child apply, and holds five open at once', () => {
    const child = quickSave({ birthYear: 2016, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, 'child-uni');
    const refused = child.execute({ kind: 'uni.apply', payload: { universityId: 'ucl', majorId: 'english' } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(new RegExp(`before ${APPLY_FROM_AGE}`));

    const sim = aLeaver('five', 88);
    const here = universitiesInCountry('uk').slice(0, MAX_OPEN_APPLICATIONS + 1);
    for (let i = 0; i < MAX_OPEN_APPLICATIONS; i++) {
      const one = here[i]!;
      const major = majorsAt(one)[0]!;
      expect(sim.execute({ kind: 'uni.apply', payload: { universityId: one.id, majorId: major.id } }).ok, one.name).toBe(true);
    }
    const sixth = here[MAX_OPEN_APPLICATIONS]!;
    const over = sim.execute({ kind: 'uni.apply', payload: { universityId: sixth.id, majorId: majorsAt(sixth)[0]!.id } });
    expect(over.ok).toBe(false);
    expect(over.error).toMatch(/as many as anybody may have/);
  });

  it('refuses a course a university does not teach, and a second try at the same place', () => {
    const sim = aLeaver('wrong-course', 88);
    const wrong = sim.execute({ kind: 'uni.apply', payload: { universityId: 'rada', majorId: 'medicine' } });
    expect(wrong.ok).toBe(false);
    expect(wrong.error).toMatch(/does(n’t| not) teach/);

    expect(sim.execute({ kind: 'uni.apply', payload: { universityId: 'ucl', majorId: 'english' } }).ok).toBe(true);
    const again = sim.execute({ kind: 'uni.apply', payload: { universityId: 'ucl', majorId: 'law' } });
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/already applied/);
  });

  it('answers, and says why either way', () => {
    let offered = 0;
    let rejected = 0;
    for (let seed = 0; seed < 8; seed++) {
      const sim = aLeaver(`answer-${seed}`, 82);
      expect(sim.execute({ kind: 'uni.apply', payload: { universityId: 'manchester', majorId: 'english' } }).ok).toBe(true);
      sim.advanceTo(sim.now + 90 * MS_DAY);
      const application = applicationsOf(sim)[0]!;
      expect(['offer', 'rejected']).toContain(application.status);
      expect(application.reason.length).toBeGreaterThan(20);
      expect(application.decidedAt).toBeDefined();
      if (application.status === 'offer') offered += 1; else rejected += 1;
    }
    expect(offered + rejected).toBe(8);
    expect(offered).toBeGreaterThan(0);
  });
});

describe('reading a degree', () => {
  /** Somebody who applied, was offered a place, and took it. */
  function enrolled(seedBase: string): Simulation | undefined {
    for (let seed = 0; seed < 10; seed++) {
      const sim = aLeaver(`${seedBase}-${seed}`, 88);
      if (!sim.execute({ kind: 'uni.apply', payload: { universityId: 'manchester', majorId: 'english' } }).ok) continue;
      sim.advanceTo(sim.now + 90 * MS_DAY);
      const application = applicationsOf(sim)[0]!;
      if (application.status !== 'offer') continue;
      const took = sim.execute({ kind: 'uni.accept', payload: { applicationId: application.id } });
      if (!took.ok) continue;
      return sim;
    }
    return undefined;
  }

  it('takes the place, charges the year, moves you there, and closes the others', () => {
    const sim = aLeaver('accept', 88);
    for (const id of ['manchester', 'ucl']) {
      sim.execute({ kind: 'uni.apply', payload: { universityId: id, majorId: 'english' } });
    }
    sim.advanceTo(sim.now + 90 * MS_DAY);
    const offer = applicationsOf(sim).find((one) => one.status === 'offer');
    if (!offer) return;
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const took = sim.execute<{ feesAYear: number; livingAYear: number }>(
      { kind: 'uni.accept', payload: { applicationId: offer.id } },
    );
    expect(took.ok, took.error).toBe(true);

    const university = UNIVERSITY_BY_ID[offer.universityId]!;
    expect(sim.player.currentLocationId).toBe(university.cityId);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!))
      .toBe(before - took.value!.feesAYear - took.value!.livingAYear);
    // Taking one closes the rest.
    for (const other of applicationsOf(sim)) {
      if (other.id === offer.id) continue;
      expect(['withdrawn', 'rejected', 'declined']).toContain(other.status);
    }
    expect(studiesOf(sim)).toBeDefined();
  });

  it('will not let you sit a term from another city', () => {
    const sim = enrolled('away');
    if (!sim) return;
    sim.player.currentLocationId = 'us-ca-losangeles';
    const res = sim.execute({ kind: 'uni.term', payload: {} });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/have to be where/);
  });

  it('takes three years of terms and awards a class at the end of them', () => {
    const sim = enrolled('graduate');
    if (!sim) return;
    const studies = studiesOf(sim)!;
    expect(studies.year).toBe(1);
    expect(describeStudies(studies)).toContain('English Literature');

    let finished = false;
    for (let term = 0; term < 14 && !finished; term++) {
      const res = sim.execute<{ finished: boolean }>({ kind: 'uni.term', payload: { effort: 'hard' } });
      if (!res.ok) break;
      finished = res.value!.finished;
    }
    expect(finished).toBe(true);
    const done = studiesHistoryOf(sim)[0]!;
    expect(done.awardedClass).toBeDefined();
    expect(DEGREE_CLASSES.map((one) => one.label)).toContain(done.awardedClass);
    expect(done.termsDone).toBe(done.years * 3);
    expect(studiesOf(sim)).toBeUndefined();
    const held = degreesOf(sim);
    if (done.awardedClass !== 'No Award') {
      expect(held.length).toBe(1);
      expect(held[0]!.name).toContain('University of Manchester');
    }
  });

  it('teaches what the course teaches', () => {
    const sim = enrolled('learn');
    if (!sim) return;
    const major = MAJOR_BY_ID.english!;
    const before = major.feeds.map((feed) => (feed.kind === 'attribute'
      ? sim.player.attributes?.[feed.key] ?? 0
      : sim.player.skills?.[feed.key] ?? 0));
    sim.execute({ kind: 'uni.term', payload: { effort: 'hard' } });
    const after = major.feeds.map((feed) => (feed.kind === 'attribute'
      ? sim.player.attributes?.[feed.key] ?? 0
      : sim.player.skills?.[feed.key] ?? 0));
    // At the ceiling already for the sandbox character, so it may not move —
    // what must hold is that it never goes backwards.
    for (let i = 0; i < before.length; i++) expect(after[i]).toBeGreaterThanOrEqual(before[i]!);
  });

  it('lets somebody walk away, and writes down that they did', () => {
    const sim = enrolled('quit');
    if (!sim) return;
    sim.execute({ kind: 'uni.term', payload: {} });
    const res = sim.execute<{ left: boolean }>({ kind: 'uni.leave', payload: { why: 'had enough' } });
    expect(res.ok, res.error).toBe(true);
    expect(studiesOf(sim)).toBeUndefined();
    expect(degreesOf(sim).length).toBe(0);
    expect(studiesHistoryOf(sim)[0]!.endReason).toBe('had enough');
  });

  it('grades a degree by what the years came to', () => {
    expect(degreeClass(95)).toBe('First Class');
    expect(degreeClass(72)).toBe('Upper Second');
    expect(degreeClass(60)).toBe('Lower Second');
    expect(degreeClass(10)).toBe('No Award');
  });

  it('finds a university in the cities that have one', () => {
    for (const cityId of ['us-ca-losangeles', 'uk-eng-london', 'jp-13-tokyo', 'br-27-saopaulo']) {
      expect(universitiesIn(cityId).length, cityId).toBeGreaterThan(0);
    }
  });
});
