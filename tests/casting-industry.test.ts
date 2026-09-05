/**
 * The casting reference has to be true.
 *
 * Everything in content/casting-industry is either how the business works or
 * a number the game owns and labels. This suite holds it to that: every
 * attribute a room weighs must exist, every stage a path names must exist,
 * every path must end in a booking, and no money in it may be presented as a
 * quoted union rate.
 */

import { describe, expect, it } from 'vitest';
import { ATTRIBUTES } from '@/engine/domain/attributes';
import {
  AGREEMENTS, AGREEMENT_BY_ID, BREAKDOWN_FIELDS, CASTING_MONEY_NOTE, CASTING_PATHS,
  CASTING_STAGES, CASTING_STAGE_BY_ID, DEAL_TERMS, ELIGIBILITY_ROUTES, ROLE_CATEGORIES,
  ROOM_SEATS, ROOM_SEAT_BY_ID, SELF_TAPE_SPEC, SIDES_KINDS, SPECIAL_SKILLS, SUBMISSION_CHANNELS,
} from '@/engine/content/casting-industry';
import {
  CASTING_DIRECTORS, CASTING_DIRECTOR_BY_ID, CASTING_RECORD_NOTE, castingDirectorsIn, workingCastingDirectors,
} from '@/engine/content/casting-people';
import { CITIES } from '@/engine/content/geography';

const attributeIds = new Set(ATTRIBUTES.map((a) => a.id));

describe('the room', () => {
  it('weighs attributes the game actually has', () => {
    for (const seat of ROOM_SEATS) {
      for (const [id, weight] of Object.entries(seat.weighs)) {
        expect(attributeIds.has(id), `${seat.name} weighs '${id}', which is not an attribute`).toBe(true);
        expect(weight).toBeGreaterThan(0);
        expect(weight).toBeLessThanOrEqual(1);
      }
      const total = Object.values(seat.weighs).reduce((sum, w) => sum + w, 0);
      if (Object.keys(seat.weighs).length > 0) expect(Math.abs(total - 1), `${seat.name} weights sum to ${total}`).toBeLessThan(0.02);
      expect(seat.watchingFor.length).toBeGreaterThan(30);
      expect(seat.sway).toBeGreaterThanOrEqual(0);
      expect(seat.sway).toBeLessThanOrEqual(1);
      expect(seat.pressure).toBeGreaterThanOrEqual(0);
      expect(seat.pressure).toBeLessThanOrEqual(1);
    }
  });

  it('has a reader who judges nobody and a network that judges hardest', () => {
    expect(ROOM_SEAT_BY_ID.reader.sway).toBe(0);
    expect(Object.keys(ROOM_SEAT_BY_ID.reader.weighs).length).toBe(0);
    expect(ROOM_SEAT_BY_ID.network_executive.pressure).toBe(1);
    // The people who can change what you are doing mid-room are the people who
    // would: the director, the writer, the showrunner and the office.
    const redirecting = ROOM_SEATS.filter((s) => s.redirects).map((s) => s.id).sort();
    expect(redirecting).toEqual(['casting_director', 'director', 'showrunner', 'writer']);
  });
});

describe('the sequence', () => {
  it('names only stages that exist, and seats that exist', () => {
    for (const stage of CASTING_STAGES) {
      expect(stage.what.length).toBeGreaterThan(25);
      for (const seat of stage.room) expect(ROOM_SEAT_BY_ID[seat], `${stage.name} seats '${seat}'`).toBeDefined();
      expect(stage.daysAfterPrevious[0]).toBeLessThanOrEqual(stage.daysAfterPrevious[1]);
    }
    for (const [path, stages] of Object.entries(CASTING_PATHS)) {
      expect(stages.length, path).toBeGreaterThan(1);
      for (const id of stages) expect(CASTING_STAGE_BY_ID[id], `${path} names '${id}'`).toBeDefined();
      expect(stages[stages.length - 1], `${path} does not end in a booking`).toBe('booked');
      expect(new Set(stages).size, `${path} repeats a stage`).toBe(stages.length);
    }
  });

  it('runs network television the way network television is run', () => {
    const network = CASTING_PATHS.network_series_regular!;
    const test = network.indexOf('network_test');
    const deal = network.indexOf('test_option');
    // The deal is signed before the test. That is the whole point of a test option.
    expect(deal).toBeGreaterThan(-1);
    expect(deal).toBeLessThan(test);
    expect(network.indexOf('studio_test')).toBeLessThan(test);
    // A streaming regular tests for the studio and there is no network room.
    expect(CASTING_PATHS.streaming_series_regular!).not.toContain('network_test');
    expect(CASTING_PATHS.streaming_series_regular!).toContain('test_option');
    // A co-star is a tape and a phone call; nobody screen-tests for two lines.
    expect(CASTING_PATHS.co_star!).not.toContain('callback');
    expect(CASTING_PATHS.co_star!).not.toContain('screen_test');
    // Somebody who is offer-only never reads.
    expect(CASTING_PATHS.offer_only!.some((id) => CASTING_STAGE_BY_ID[id].performerPresent)).toBe(false);
  });

  it('puts the right people in the right rooms', () => {
    // A pre-read is the office alone. That is what makes it a pre-read.
    expect(CASTING_STAGE_BY_ID.prescreen.room).not.toContain('director');
    expect(CASTING_STAGE_BY_ID.prescreen.room).not.toContain('producer');
    // A producer session has producers in it, and the network test has the network.
    expect(CASTING_STAGE_BY_ID.producer_session.room).toContain('producer');
    expect(CASTING_STAGE_BY_ID.network_test.room).toContain('network_executive');
    expect(CASTING_STAGE_BY_ID.studio_test.room).toContain('studio_executive');
    // A chemistry read needs somebody to have chemistry with.
    expect(CASTING_STAGE_BY_ID.chemistry_read.room).toContain('attached_lead');
    // An avail check happens without you in it, because it is a phone call to your agent.
    expect(CASTING_STAGE_BY_ID.avail_check.performerPresent).toBe(false);
    expect(CASTING_STAGE_BY_ID.offer.performerPresent).toBe(false);
  });
});

describe('what the part is hired as', () => {
  it('distinguishes the categories the way contracts do', () => {
    const byId = Object.fromEntries(ROLE_CATEGORIES.map((c) => [c.id, c]));
    // A series regular is contracted to the series, tested, and optioned.
    expect(byId.series_regular!.engagement).toBe('series_contract');
    expect(byId.series_regular!.tested).toBe(true);
    expect(byId.series_regular!.optioned).toBe(true);
    expect(byId.series_regular!.billing).toBe('main_title');
    // Recurring is not contracted to the series, which is the whole difference.
    expect(byId.recurring!.engagement).toBe('episodic');
    expect(byId.recurring!.optioned).toBe(false);
    // Background does not read and is not credited.
    expect(byId.background!.auditions).toBe(false);
    expect(byId.background!.billing).toBe('uncredited');
    for (const category of ROLE_CATEGORIES) expect(category.what.length).toBeGreaterThan(40);
  });
});

describe('the paperwork', () => {
  it('says who each term binds, and gets the famous ones right', () => {
    const byId = Object.fromEntries(DEAL_TERMS.map((t) => [t.id, t]));
    // An avail binds nobody. Anybody who says otherwise is misrepresenting it.
    expect(byId.avail!.binds).toBe('neither');
    expect(byId.hold!.binds).toBe('neither');
    // First refusal is an obligation on the performer.
    expect(byId.first_refusal!.binds).toBe('performer');
    // Pay or play binds the production, which is what makes it valuable.
    expect(byId.pay_or_play!.binds).toBe('production');
    // Options belong to the production, not to the actor.
    expect(byId.options!.binds).toBe('performer');
    for (const term of DEAL_TERMS) expect(term.what.length).toBeGreaterThan(30);
  });

  it('specifies a self-tape the way an office does, worst mistake first', () => {
    const deadline = SELF_TAPE_SPEC.find((r) => r.id === 'deadline')!;
    const costume = SELF_TAPE_SPEC.find((r) => r.id === 'no_costume')!;
    expect(deadline.costOfGettingItWrong).toBeGreaterThan(costume.costOfGettingItWrong);
    for (const rule of SELF_TAPE_SPEC) {
      expect(rule.rule.length).toBeGreaterThan(30);
      expect(rule.costOfGettingItWrong).toBeGreaterThan(0);
    }
    expect(SIDES_KINDS.length).toBeGreaterThanOrEqual(6);
    expect(SIDES_KINDS.map((s) => s.id)).toContain('fake_sides');
  });

  it('carries the fields a real breakdown carries', () => {
    const fields = BREAKDOWN_FIELDS.map((f) => f.field);
    for (const required of ['Union Status', 'Rate', 'Casting Director', 'Age Range', 'Character Description', 'Special Skills', 'Shoot Dates', 'Location']) {
      expect(fields, `a breakdown without ${required} is not a breakdown`).toContain(required);
    }
    expect(BREAKDOWN_FIELDS.filter((f) => f.required).length).toBeGreaterThan(8);
  });

  it('maps the skills a part can actually require onto attributes where the game has them', () => {
    for (const skill of SPECIAL_SKILLS) {
      if (skill.attributeId) expect(attributeIds.has(skill.attributeId), `${skill.name} → ${skill.attributeId}`).toBe(true);
    }
    expect(SPECIAL_SKILLS.length).toBeGreaterThanOrEqual(12);
  });
});

describe('the union', () => {
  it('models the agreements without quoting anybody’s rate as fact', () => {
    expect(AGREEMENTS.filter((a) => a.union).length).toBeGreaterThan(5);
    expect(AGREEMENT_BY_ID.non_union.union).toBe(false);
    expect(AGREEMENT_BY_ID.non_union.taftHartley).toBe(false);
    // Lower-budget agreements pay less. That is what they are for.
    expect(AGREEMENT_BY_ID.sag_ultra_low.dayScaleCalibration).toBeLessThan(AGREEMENT_BY_ID.sag_theatrical.dayScaleCalibration);
    expect(AGREEMENT_BY_ID.sag_modified_low.dayScaleCalibration).toBeLessThan(AGREEMENT_BY_ID.sag_low_budget.dayScaleCalibration);
    // A union job can Taft-Hartley somebody in; a non-union job has nothing to Taft-Hartley them into.
    for (const agreement of AGREEMENTS) expect(agreement.taftHartley).toBe(agreement.union);
    expect(ELIGIBILITY_ROUTES.map((r) => r.id)).toContain('taft_hartley');
    // And the money is labelled as the game's own, everywhere.
    expect(CASTING_MONEY_NOTE).toMatch(/nothing here is quoted as a current rate/);
  });

  it('knows where breakdowns go and who can answer them', () => {
    const byId = Object.fromEntries(SUBMISSION_CHANNELS.map((c) => [c.id, c]));
    // The work that matters goes to representation, not to a public board.
    expect(byId.breakdown_express!.selfSubmit).toBe(false);
    expect(byId.direct!.selfSubmit).toBe(false);
    expect(byId.offer_only!.selfSubmit).toBe(false);
    expect(byId.actors_access!.selfSubmit).toBe(true);
  });
});

describe('the casting directors', () => {
  it('are real people whose city is on the map and whose dates make sense', () => {
    expect(CASTING_DIRECTORS.length).toBeGreaterThan(25);
    expect(new Set(CASTING_DIRECTORS.map((c) => c.id)).size).toBe(CASTING_DIRECTORS.length);
    expect(new Set(CASTING_DIRECTORS.map((c) => c.qid)).size).toBe(CASTING_DIRECTORS.length);
    for (const person of CASTING_DIRECTORS) {
      expect(person.qid, person.name).toMatch(/^Q\d+$/);
      expect(person.where.length, person.name).toBeGreaterThan(3);
      // A city id is only carried when the map actually resolves it; anywhere
      // else stays in the record's own words rather than being relocated.
      for (const city of person.cityIds) expect(CITIES.get(city), `${person.name} works out of ${city}`).toBeDefined();
      expect(person.knownFor.length, person.name).toBeGreaterThan(20);
      expect(person.office.length, person.name).toBeGreaterThan(4);
      if (person.born !== undefined) {
        expect(person.born, person.name).toBeGreaterThan(1900);
        expect(person.born, person.name).toBeLessThan(2010);
      }
      if (person.died !== undefined && person.born !== undefined) {
        expect(person.died, person.name).toBeGreaterThan(person.born);
      }
    }
  });

  it('does not send the dead to your audition', () => {
    const working = workingCastingDirectors(2026).map((c) => c.id);
    expect(working).not.toContain('marion-dougherty');
    expect(working).not.toContain('lynn-stalmaster');
    expect(working).not.toContain('mali-finn');
    expect(working).toContain('nina-gold');
    expect(castingDirectorsIn('us-ny-newyork', { year: 2026 }).every((c) => c.died === undefined || c.died >= 2026)).toBe(true);
    expect(castingDirectorsIn('uk-eng-london', { year: 2026 }).length).toBeGreaterThan(2);
    expect(castingDirectorsIn('us-ca-losangeles', { year: 2026 }).length).toBeGreaterThan(3);
  });

  it('says where its facts came from', () => {
    expect(CASTING_RECORD_NOTE).toMatch(/public record/);
    expect(CASTING_RECORD_NOTE).toMatch(/simulation/);
    // The one office the record actually names is marked as the record's.
    const telsey = CASTING_DIRECTOR_BY_ID['bernard-telsey']!;
    expect(telsey.officeNamed).toBe(true);
    expect(telsey.office).toBe('Telsey + Company');
  });
});
