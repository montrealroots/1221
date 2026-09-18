/**
 * SLATE — the year's judgement, and whether it decides anything.
 *
 * `docs/AWARDS.md` set this up as three pieces and was emphatic about the order.
 * Piece one, conduct moving controversy, was built with the seven dials. Piece two
 * is a season that names work off what exists. Piece three is giving prestige a
 * reader, and the document is blunt that it "must not be skipped, because piece
 * two on its own produces exactly the defect this document opens by describing" —
 * more writers for a field nothing reads.
 *
 * So the tests here are in that order and the last two are the ones that matter:
 * one for each reader. A season that named pictures and moved a number nobody
 * consults would pass everything above them and mean nothing.
 */

import { describe, expect, it } from 'vitest';
import { migrate, quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import type { Person, Project } from '@/engine/domain/model';
import {
  AWARDABLE, ELIGIBLE_ABOVE, IN_THE_CONVERSATION, NAMED_A_YEAR, NOTICED, WINS_A_YEAR,
} from '@/engine/content/awards';
import { eligible, forgottenPrestige, noticedOf, theSeason } from '@/engine/world/awards';
import { castsPrestige } from '@/engine/world/casting';
import { remembersYou } from '@/engine/world/audition';
import { decideTake } from '@/engine/world/selling';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';

const DAY = 24 * 60 * 60 * 1000;

/** A finished picture, written straight onto the save. */
function finished(
  sim: Simulation, planId: string, title: string, at: number, cast: Person[],
): Project {
  const id = sim.nextId('project');
  const project: Project = {
    id,
    saveId: sim.universe.meta.id,
    companyId: 'company_000001',
    title,
    medium: planId === 'feature' ? 'film' : 'television',
    stage: 'delivered',
    planId,
    budgetCents: 20_000_000_00,
    spentCents: 20_000_000_00,
    deliveredAt: at,
    delivered: [],
    createdAt: at,
    roles: cast.map((_one, i) => ({
      id: `${id}_role_${i}`, ordinal: i + 1, name: `Part ${i + 1}`, size: 'lead', bandCents: 100_000_00,
    })),
    cast: cast.map((one, i) => ({
      roleId: `${id}_role_${i}`, personId: one.id, feeCents: 100_000_00, castAt: at,
    })),
  } as unknown as Project;
  sim.universe.projects[id] = project;
  return project;
}

/** Somebody who reads however well the test needs them to. */
function performer(sim: Simulation, truth: number): Person {
  const person = Object.values(sim.universe.people).find((one) => !one.isPlayer && one.careerTrack === 'actor');
  const made: Person = JSON.parse(JSON.stringify(person ?? Object.values(sim.universe.people)[0]!)) as Person;
  made.id = sim.nextId('person');
  made.isPlayer = false;
  made.reputation = { ...made.reputation, prestige: 0 };
  for (const key of Object.keys(made.attributes.of ?? {})) delete made.attributes.of![key];
  made.attributes.base = truth;
  sim.universe.people[made.id] = made;
  return made;
}

describe('a season names work, off what was actually finished', () => {
  it('looks only at things a season would look at', () => {
    const sim = quickSave({}, 'awards-eligible');
    const now = sim.now;
    const cast = [performer(sim, 70)];

    const feature = finished(sim, 'feature', 'Hvítserkur', now, cast);
    expect(eligible(feature, now - DAY, now + DAY)).toBe(true);

    // Outside the window is somebody else's year.
    expect(eligible(feature, now + DAY, now + 2 * DAY)).toBe(false);

    // A commercial is not in the conversation, and neither is a job below the
    // floor — nothing in the business nominates a corporate video.
    const cheap = finished(sim, 'feature', 'A Job', now, cast);
    (cheap as { budgetCents: number }).budgetCents = ELIGIBLE_ABOVE - 1;
    expect(eligible(cheap, now - DAY, now + DAY)).toBe(false);

    const shelved = finished(sim, 'feature', 'Shelved', now, cast);
    (shelved as { shelvedAt?: number }).shelvedAt = now;
    expect(eligible(shelved, now - DAY, now + DAY)).toBe(false);
  });

  it('is decided by what is on the screen and not by what it cost', () => {
    // The money is deliberately absent from `NOTICED`. It buys scale, reach and a
    // campaign; it does not buy the opinion, and a build where the most expensive
    // picture won every year would say something false about the business.
    expect(Object.keys(NOTICED)).toEqual(['cast', 'form', 'draw']);
    expect(NOTICED.cast + NOTICED.form + NOTICED.draw).toBeCloseTo(1, 6);

    const sim = quickSave({}, 'awards-noticed');
    const good = finished(sim, 'feature', 'Good', sim.now, [performer(sim, 95)]);
    const poor = finished(sim, 'feature', 'Poor', sim.now, [performer(sim, 10)]);
    // Same draw both sides, so this is the cast and nothing else.
    expect(noticedOf(sim, good, 0.5)).toBeGreaterThan(noticedOf(sim, poor, 0.5));

    // And the form counts: a format season is not judged against a feature.
    expect(AWARDABLE.feature).toBeGreaterThan(AWARDABLE.unscripted!);
    const format = finished(sim, 'unscripted', 'The Arena', sim.now, [performer(sim, 95)]);
    expect(noticedOf(sim, format, 0.5)).toBeLessThan(noticedOf(sim, good, 0.5));
  });

  it('names five and gives one of them the award', () => {
    const sim = quickSave({}, 'awards-season');
    const now = sim.now;
    for (let i = 0; i < 9; i += 1) {
      finished(sim, 'feature', `Picture ${i}`, now, [performer(sim, 60 + i * 4)]);
    }
    const { named, won } = theSeason(sim, now - DAY, now + DAY);
    expect(named.length).toBeLessThanOrEqual(NAMED_A_YEAR);
    expect(won).toHaveLength(WINS_A_YEAR);
    expect(named[0]).toBe(won[0]);
    // Four fifths of the people named do not win, which is what makes being named
    // worth something on its own.
    expect(named.length).toBeGreaterThan(won.length);
  });

  it('names nothing in a year nothing was in the conversation', () => {
    const sim = quickSave({}, 'awards-quiet');
    finished(sim, 'unscripted', 'Nobody Watched', sim.now, [performer(sim, 5)]);
    const { named } = theSeason(sim, sim.now - DAY, sim.now + DAY);
    for (const one of named) expect(noticedOf(sim, one, 0.5)).toBeGreaterThanOrEqual(IN_THE_CONVERSATION);
  });
});

describe('prestige has readers, which is the piece that must not be skipped', () => {
  it('moves on being named and moves more on winning', () => {
    const sim = quickSave({}, 'awards-lift');
    const now = sim.now;
    const one = performer(sim, 90);
    finished(sim, 'feature', 'The Winner', now, [one]);
    expect(one.reputation.prestige).toBe(0);
    theSeason(sim, now - DAY, now + DAY);
    const afterWin = one.reputation.prestige;
    expect(afterWin, 'winning moved nothing').toBeGreaterThan(0);

    // Named without winning is worth less, on a fresh save so nothing carries.
    const other = quickSave({}, 'awards-lift-2');
    const at = other.now;
    const best = performer(other, 95);
    const also = performer(other, 90);
    finished(other, 'feature', 'The Winner', at, [best]);
    finished(other, 'feature', 'Also Named', at, [also]);
    const { won } = theSeason(other, at - DAY, at + DAY);
    expect(won[0]!.title).toBe('The Winner');
    expect(best.reputation.prestige).toBeGreaterThan(also.reputation.prestige);
    expect(also.reputation.prestige, 'being named was worth nothing').toBeGreaterThan(0);
  });

  it('fades, so it is not the fifth one-way ratchet', () => {
    const sim = quickSave({}, 'awards-fade');
    const one = performer(sim, 90);
    one.reputation.prestige = 60;
    forgottenPrestige(one, 365.2425, 365.2425);
    expect(one.reputation.prestige).toBeLessThan(60);
    // And never below nought, however long nothing happens.
    forgottenPrestige(one, 365.2425 * 50, 365.2425);
    expect(one.reputation.prestige).toBe(0);
  });

  it('READER ONE: an office that never met you has heard of the work', () => {
    const sim = quickSave({}, 'awards-office');
    const cold = remembersYou(sim, 'ruv_series');
    const me = sim.universe.people[sim.universe.playerId]!;
    me.reputation.prestige = 80;
    const warm = remembersYou(sim, 'ruv_series');
    expect(warm, 'prestige reaches no office, so the award is a sentence')
      .toBeGreaterThan(cold);
  });

  it('READER TWO: a buyer pays more for a picture people will talk about', () => {
    const sim = quickSave({}, 'awards-sale');
    const one = performer(sim, 70);
    const project = finished(sim, 'feature', 'Talked About', sim.now, [one]);
    expect(castsPrestige(sim, project)).toBe(0);

    const at = (prestige: number): number => decideTake(
      { negativeCents: 20_000_000_00, dealId: 'streamer_buyout', prestige }, 0.5,
    ).cents;
    expect(at(80), 'prestige moves nothing at the sale').toBeGreaterThan(at(0));

    // And it reads the cast, so an award on the people in it is what moves it.
    one.reputation.prestige = 80;
    expect(castsPrestige(sim, project)).toBeCloseTo(80, 6);
  });

  it('gives an old save the field back at nought rather than guessing one', () => {
    const { universe } = quickSave({}, 'awards-migrate');
    universe.meta.schemaVersion = SAVE_SCHEMA_VERSION - 1;
    for (const person of Object.values(universe.people)) {
      delete (person.reputation as unknown as Record<string, unknown>).prestige;
      person.reputation.publicFame = 90;
    }
    migrate(universe);
    for (const person of Object.values(universe.people)) {
      // Nought, and not seeded off fame — that would invent an award history for
      // somebody who was never named.
      expect(person.reputation.prestige).toBe(0);
    }
  });
});
