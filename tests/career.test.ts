/**
 * The actor's working life (`systems/career.ts`, `content/career.ts`), against
 * the unions' and Yale's published figures, on played careers: the clock sent
 * on six hours at a time and stopping, as it does for a player, at each call.
 */
import { describe, expect, it } from 'vitest';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { computeAnnualTax } from '@/engine/content/tax';
import { AGE_ON_SCREEN, AGENCIES, AGENT_COMMISSION, EQUITY, ROLES, SAG_AFTRA, SHOWCASE_2029, WORK_COSTS, rateOn } from '@/engine/content/career';
import {
  AGENCY_TERM, DAY_TRIPS, AGENCY_TERM_KIND, AIRS_KIND, AUDITION_KIND, CAREER_WEEK_KIND, FILM_ROAD, DUES_KIND, FESTIVAL_KIND, PRESS_KIND, schedulePress, ESTIMATE, LEAVING, PAY_KIND, SHOWCASE_KIND, WORK_KIND,
  acceptRefusal, beginCareer, closeStaleBookings, billDues, jobsClash, pruneBookings, publicityFor, schoolClash, bookingChance, careerOf, mayLeave, mealPenalty, offersFor, overtimeFor, paycheck, roleById, showcaseScore, weekOfAuditions, workDays,
  type Booking,
} from '@/engine/systems/career';
import { actingOf, bindCeiling, evenCraft, repProduction, termAccount } from '@/engine/systems/school';
import { RIVALS } from '@/engine/systems/rivals';
import { ATTRIBUTES, attributesOf } from '@/engine/systems/attributes';
import { rehome } from '@/engine/systems/household';
import { healthOf } from '@/engine/systems/health';
import type { Simulation } from '@/engine/core/simulation';
import type { Craft } from '@/engine/systems/school';

const NY_ZONE = 'America/New_York';
import { yearOf } from '@/engine/systems/earnings';
import { TURNS } from '@/engine/systems/enjoyment';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, zone = NY) => instantFromZoned({ year, month, day, hour }, zone);
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
/** Played by somebody who looks after themselves: rested, fed and steady each time the clock moves, as a player keeps a character. Since 2026-09-28 a run of off nights falls short at the evaluation. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); } };
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending').sort((a, b) => a.at - b.at);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const craft = (level: number): Craft => (evenCraft(level));

/** An actor in New York, out of school, with the business begun. */
function pro(seed: string, level = 75): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = craft(level);
  beginCareer(sim, sim.player);
  return sim;
}
/** Represented by an agency of a reach, from its New York office. */
function signed(seed: string, tier: 1 | 2 | 3 = 2, level = 75): Simulation {
  const sim = pro(seed, level);
  const agency = AGENCIES.find((a) => a.tier === tier)!;
  careerOf(sim.player).offers.push({ agencyId: agency.id, cityId: 'us-ny-newyork', until: sim.now + MS_DAY });
  const morale = sim.player.wellbeing.morale;
  expect(sim.execute({ kind: 'career.sign', payload: { agencyId: agency.id, cityId: 'us-ny-newyork' } }).ok).toBe(true);
  // Signed, it's felt.
  expect(sim.player.wellbeing.morale).toBeGreaterThan(Math.min(100 - TURNS.signed.morale, morale));
  return sim;
}
/** An offer of a part, made now. */
function offer(sim: Simulation, roleId: string, units: number, rehearsalWeeks = 0, starts = sim.now + 7 * MS_DAY): Booking {
  const career = careerOf(sim.player);
  const b: Booking = { id: `t${career.bookings.length}`, roleId, cityId: 'us-ny-newyork', starts, units, rehearsalWeeks, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
  career.bookings.push(b);
  return b;
}

describe('the showcase', () => {
  it('is booked in the last spring, in New York and a week later in Los Angeles, on the estimated 2029 dates', () => {
    const sim = createSave(1, 'show', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    tended(sim, at(2029, 1, 8, 10));
    const shows = pending(sim, SHOWCASE_KIND);
    expect(shows.map((s) => s.payload.cityId)).toEqual(['us-ny-newyork', 'us-ca-losangeles']);
    expect(zonedParts(shows[0]!.at, NY)).toMatchObject({ year: 2029, month: 4, day: SHOWCASE_2029.newYork.day, hour: 17 });
    expect(zonedParts(shows[1]!.at, 'America/Los_Angeles')).toMatchObject({ month: 5, day: 1, hour: 13 });
    // The class's strongest by now, as a student who looked after themselves is (since 2026-09-28 the class competes, and one left to themselves can be outshone).
    sim.player.craft = evenCraft(88);
    play(sim, shows[1]!.at + MS_HOUR);
    const career = careerOf(sim.player);
    expect(career.showcases).toHaveLength(2);
    // The class's strongest actor reads high enough for the biggest agencies' bars.
    expect(Math.max(...career.showcases.map((s) => s.score))).toBeGreaterThan(74);
    expect(career.offers.length + (career.agencyId ? 1 : 0)).toBeGreaterThan(0);
    for (const o of career.offers) expect(AGENCIES.find((a) => a.id === o.agencyId)!.bar).toBeLessThanOrEqual(Math.max(...career.showcases.map((s) => s.score)));
    expect(Object.values(sim.universe.decisions).some((d) => d.category === 'career' && d.actions[0]?.commandKind === 'career.sign')).toBe(true);
    // The degree starts the business: the Monday after, the agency's week.
    expect(career.since).toBeUndefined();
    play(sim, at(2029, 6, 1, 12));
    expect(sim.player.school!.standing).toBe('graduated');
    // The class, known after it, every one of them, by name (`systems/people.ts`).
    expect(sim.player.contacts?.filter((c) => c.met.how === 'school').map((c) => c.name)).toEqual(sim.player.school!.classmates.map((c) => c.name));
    expect(career.since).toBeDefined();
    expect(pending(sim, CAREER_WEEK_KIND)).toHaveLength(1);
  }, 120_000);

  it('reads acting as much as the rest a scene shows together, and takes up to a fifth off for tiredness', () => {
    const c = { ...craft(60), scene: 90, character: 90, emotion: 90 };
    // Presence is a fifth of it, beside the craft; a classmate's is read at 50.
    expect(showcaseScore(c, 1)).toBeCloseTo(0.8 * (0.5 * 90 + 0.5 * ((90 * 3 + 60 * 5) / 8)) + 0.2 * 50, 10);
    expect(showcaseScore(c, 1, 80) - showcaseScore(c, 1, 50)).toBeCloseTo(0.2 * 30, 10);
    expect(showcaseScore(c, 0)).toBeCloseTo(0.8 * showcaseScore(c, 1), 10);
    expect(showcaseScore(c, 1.2)).toBe(showcaseScore(c, 1));
  });

  it('brings offers only from agencies whose bar the showing clears', () => {
    const sim = pro('bars');
    expect(offersFor(sim, sim.player, 59, 'x')).toEqual([]);
    let seen = 0;
    for (let n = 0; n < 30; n += 1) {
      const got = offersFor(sim, sim.player, 67.5, `k${n}`);
      for (const id of got) expect(AGENCIES.find((a) => a.id === id)!.bar).toBeLessThanOrEqual(67.5);
      seen += got.length;
    }
    // Four agencies' bars are cleared, and each wants the actor about three times in five.
    expect(seen / 30).toBeGreaterThan(4 * ESTIMATE.agencyInterest * 0.7);
    expect(seen / 30).toBeLessThan(4 * ESTIMATE.agencyInterest * 1.3);
  });
});

describe('the showcase, on the day', () => {
  /** A life at school, with a showcase in New York a minute from now. */
  function showing(seed: string) {
    const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    sim.player.craft = craft(90);
    sim.schedule({ at: sim.now + 60_000, kind: SHOWCASE_KIND, label: 'Actor Showcase, New York', category: 'school', priority: 30, payload: { personId: sim.player.id, cityId: 'us-ny-newyork' } });
    return sim;
  }

  it('gives a good showing to the reputation, as the room remembers it', () => {
    const sim = showing('remembered');
    sim.player.awakeSince = sim.now - MS_HOUR;
    sim.player.attrs!.reputation = 0;
    sim.advanceTo(sim.now + 2 * 60_000);
    const score = careerOf(sim.player).showcases[0]!.score;
    expect(score).toBeGreaterThan(50);
    expect(sim.player.attrs!.reputation).toBeCloseTo((score - 50) * ATTRIBUTES.reputation.showcasePer, 6);
  });

  it('sees nothing of an actor asleep through it', () => {
    const sim = showing('asleep');
    sim.player.awakeSince = sim.now + MS_DAY;
    sim.advanceTo(sim.now + 2 * 60_000);
    expect(careerOf(sim.player).offers).toEqual([]);
    expect(titled(sim, 'You Missed The Showcase In New York')).toHaveLength(1);
    expect(careerOf(sim.player).showcases[0]!.score).toBeCloseTo(0.8 * showcaseScore(craft(90), 1, attributesOf(sim, sim.player).presence), 6);
  });

  it('shows the class beside them: an agency takes its best two, and an actor with two better beside them isn’t taken', () => {
    const agency = AGENCIES[0]!;
    const every = (sim: Simulation, rivals: number[]) => { let n = 0; for (let k = 0; k < 200; k += 1) if (offersFor(sim, sim.player, 90, `k${k}`, rivals).includes(agency.id)) n += 1; return n; };
    const sim = pro('rivals');
    expect(every(sim, [])).toBeGreaterThan(0);
    // One better beside them: still in the two.
    expect(every(sim, [95])).toBe(every(sim, []));
    // Two better: out; two below its bar don't count.
    expect(every(sim, [95, 96])).toBe(0);
    expect(every(sim, [agency.bar - 1, agency.bar - 2])).toBe(every(sim, []));
    // On the day, a class that outshines them leaves them without an offer.
    const outshone = showing('outshone');
    for (const m of outshone.player.school!.classmates) m.craft = craft(100);
    outshone.advanceTo(outshone.now + 2 * 60_000);
    expect(careerOf(outshone.player).offers).toEqual([]);
  });

  it('brings no offers to an actor already signed', () => {
    const sim = showing('signed-already');
    careerOf(sim.player).agencyId = 'gersh';
    sim.advanceTo(sim.now + 2 * 60_000);
    expect(careerOf(sim.player).offers).toEqual([]);
    const fresh = showing('signed-not');
    fresh.advanceTo(fresh.now + 2 * 60_000);
    expect(careerOf(fresh.player).offers.length).toBeGreaterThan(0);
  });
});

/** An audition put on the calendar a minute from now. */
function audition(sim: Simulation, mode: 'tape' | 'room', self = false) {
  const career = careerOf(sim.player);
  const a = { id: `x${career.auditions.length}`, roleId: 'costar', at: sim.now + 60_000, mode, cityId: 'us-ny-newyork' as const, status: 'ahead' as const, ...(self ? { self } : {}) };
  career.auditions.push(a);
  sim.schedule({ at: a.at, kind: AUDITION_KIND, label: 'x', category: 'career', priority: 30, requiresPlayer: true, payload: { personId: sim.player.id, auditionId: a.id } });
  sim.advanceTo(a.at + 60_000);
  return careerOf(sim.player).auditions.find((one) => one.id === a.id)!;
}

describe('an audition, on the day', () => {
  it('for a voice, on tape, wants a quiet place: a booth at the town’s rate where there’s no soundproofed room (from 2026-10-04)', () => {
    const sim = signed('vo-booth', 2);
    const career = careerOf(sim.player);
    const a = { id: 'vo', roleId: 'commercial-vo', at: sim.now + 60_000, mode: 'tape' as const, cityId: 'us-ny-newyork' as const, status: 'ahead' as const };
    career.auditions.push(a);
    sim.schedule({ at: a.at, kind: AUDITION_KIND, label: 'x', category: 'career', priority: 30, requiresPlayer: true, payload: { personId: sim.player.id, auditionId: a.id } });
    sim.advanceTo(a.at + 60_000);
    expect(['done', 'booked']).toContain(career.auditions.find((x) => x.id === 'vo')!.status);
    expect(sim.universe.transactions.some((t) => t.memo === 'A voice-over booth, Open Jar Studios, Times Square')).toBe(true);
  });

  it('on tape is made anywhere; in the room, in its city or a day trip from it, the train paid', () => {
    const sim = signed('where', 2);
    sim.player.currentLocationId = 'us-ca-losangeles';
    expect(['done', 'booked']).toContain(audition(sim, 'tape').status);
    expect(audition(sim, 'room').status).toBe('missed');
    sim.player.currentLocationId = 'us-ny-newyork';
    expect(['done', 'booked']).toContain(audition(sim, 'room').status);
    // From New Haven, Metro-North's day pass to Grand Central and back: until 2026-09-28 the room was missed.
    sim.player.currentLocationId = 'us-ct-newhaven';
    const fares = () => sim.universe.transactions.filter((t) => t.memo.startsWith('The train to New York')).length;
    const before = fares();
    expect(['done', 'booked']).toContain(audition(sim, 'room').status);
    expect(fares()).toBe(before + 1);
    expect(DAY_TRIPS['us-ct-newhaven']!['us-ny-newyork']!.fare).toBe(46_75);
  });

  it('in the room, for an actor away on a job, is made on tape and takes no strike', () => {
    const sim = signed('on-set', 2);
    const job = offer(sim, 'costar', 5, 0, sim.now - MS_DAY);
    job.status = 'accepted';
    sim.player.currentLocationId = 'us-ca-losangeles';
    const done = audition(sim, 'room');
    expect(done.mode).toBe('tape');
    expect(['done', 'booked']).toContain(done.status);
    expect(careerOf(sim.player).missed).toBe(0);
  });

  it('missed in hospital, counts for nothing against the agency’s three', () => {
    const sim = signed('ward', 2);
    healthOf(sim.player).inHospitalUntil = sim.now + 30 * MS_DAY;
    expect(audition(sim, 'room').status).toBe('missed');
    expect(careerOf(sim.player).missed).toBe(0);
  });

  it('missed three times of the agency’s, and not before, ends the representation; missing your own counts for nothing', () => {
    const sim = signed('three', 2);
    sim.player.currentLocationId = 'us-ca-losangeles';
    audition(sim, 'room', true);
    expect(careerOf(sim.player).missed).toBe(0);
    audition(sim, 'room');
    audition(sim, 'room');
    expect(careerOf(sim.player)).toMatchObject({ missed: 2, agencyId: 'gersh' });
    const felt = { ...sim.player.wellbeing };
    sim.player.wellbeing.morale = 50;
    sim.player.wellbeing.stress = 30;
    audition(sim, 'room');
    // Let go, it's felt.
    expect(sim.player.wellbeing.morale).toBeLessThan(50 + TURNS.dropped.morale / 2);
    expect(sim.player.wellbeing.stress).toBeGreaterThan(30 + TURNS.dropped.stress / 2);
    void felt;
    expect(careerOf(sim.player).agencyId).toBeUndefined();
  });
});

describe('representation', () => {
  it('is signed only on a standing offer, from that office', () => {
    const sim = pro('sign');
    expect(sim.execute({ kind: 'career.sign', payload: { agencyId: 'caa', cityId: 'us-ny-newyork' } }).ok).toBe(false);
    careerOf(sim.player).offers.push({ agencyId: 'caa', cityId: 'us-ca-losangeles', until: sim.now - 1 });
    expect(sim.execute({ kind: 'career.sign', payload: { agencyId: 'caa', cityId: 'us-ca-losangeles' } }).ok).toBe(false);
    careerOf(sim.player).offers.push({ agencyId: 'caa', cityId: 'us-ca-losangeles', until: sim.now + MS_DAY });
    expect(sim.execute({ kind: 'career.sign', payload: { agencyId: 'caa', cityId: 'us-ca-losangeles' } }).ok).toBe(true);
    expect(careerOf(sim.player)).toMatchObject({ agencyId: 'caa', agencyCity: 'us-ca-losangeles', offers: [] });
  });

  it('starts the business on the Monday after school ends, at eight', () => {
    const sim = pro('monday');
    const week = pending(sim, CAREER_WEEK_KIND)[0]!;
    const p = zonedParts(week.at, NY);
    expect(new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()).toBe(1);
    expect(p.hour).toBe(8);
    expect(week.at - sim.now).toBeLessThan(8 * MS_DAY);
  });

  it('may be left on SAG-AFTRA’s terms: in a first contract’s first 151 days after 120 in a row with no offer, then under ten days’ work in 91', () => {
    const sim = signed('leave');
    const career = careerOf(sim.player);
    expect(mayLeave(sim, sim.player).ok).toBe(false);
    career.signedAt = sim.now - LEAVING.firstDays * MS_DAY;
    expect(mayLeave(sim, sim.player).ok).toBe(true);
    // An offer ten days in breaks the stretch: 115 days since it isn't 120.
    career.signedAt = sim.now - 125 * MS_DAY;
    offer(sim, 'costar', 1).offeredAt = career.signedAt + 10 * MS_DAY;
    expect(mayLeave(sim, sim.player).ok).toBe(false);
    // And the 91-day rule waits for the 151st: no work at all, and still bound.
    career.signedAt = sim.now - 150 * MS_DAY;
    career.bookings.at(-1)!.offeredAt = sim.now - 60 * MS_DAY;
    expect(mayLeave(sim, sim.player).ok).toBe(false);
    career.signedAt = sim.now - LEAVING.initialDays * MS_DAY;
    expect(mayLeave(sim, sim.player).ok).toBe(true);
    // A renewal is under the 91-day rule from its first day.
    career.signedAt = sim.now - MS_DAY;
    career.initialTerm = false;
    expect(mayLeave(sim, sim.player).ok).toBe(true);
    for (let n = 0; n < LEAVING.fewerThanDays; n += 1) careerOf(sim.player).days.push({ at: sim.now - (n + 1) * MS_DAY, hours: 10, pay: 1_283_00 });
    expect(mayLeave(sim, sim.player).ok).toBe(false);
    careerOf(sim.player).days.pop();
    expect(sim.execute({ kind: 'career.leave', payload: {} }).ok).toBe(true);
    expect(careerOf(sim.player)).toMatchObject({ ended: { agencyId: career.ended!.agencyId, left: true } });
    expect(careerOf(sim.player).agencyId).toBeUndefined();
  });

  it('runs a first contract a year, with a renewal of three offered in its last third to a client the agency booked', () => {
    const sim = signed('term');
    const career = careerOf(sim.player);
    const zone = 'America/New_York';
    const signedOn = zonedParts(career.signedAt!, zone);
    expect(zonedParts(career.termEnds!, zone)).toMatchObject({ year: signedOn.year + 1, month: signedOn.month, day: Math.min(signedOn.day, 28) });
    expect(career.initialTerm).toBe(true);
    const [window, end] = pending(sim, AGENCY_TERM_KIND);
    expect([window!.payload.stage, end!.payload.stage]).toEqual(['window', 'end']);
    expect(window!.at - career.signedAt!).toBeCloseTo((career.termEnds! - career.signedAt!) * AGENCY_TERM.renewFrom, -5);
    const ends = career.termEnds!;
    const at = (stage: string) => {
      sim.schedule({ at: sim.now + 60_000, kind: AGENCY_TERM_KIND, label: 'x', category: 'system', priority: 20, payload: { personId: sim.player.id, stage, termEnds: career.termEnds } });
      sim.advanceTo(sim.now + 2 * 60_000);
    };
    career.lastBookedAt = sim.now;
    at('window');
    expect(career.renewal?.state).toBe('offered');
    expect(Object.values(sim.universe.decisions).some((d) => d.refType === 'agency-renewal' && !d.resolvedAt)).toBe(true);
    expect(sim.must<{ termEnds: number }>({ kind: 'career.renew', payload: { accept: true } }).termEnds).toBe(career.termEnds);
    expect(zonedParts(career.termEnds!, zone).year).toBe(zonedParts(ends, zone).year + AGENCY_TERM.renewalYears);
    expect(career.initialTerm).toBe(false);
    expect(Object.values(sim.universe.decisions).some((d) => d.refType === 'agency-renewal' && !d.resolvedAt)).toBe(false);
    // The first term's end finds a renewed contract, and leaves it alone.
    sim.schedule({ at: sim.now + 60_000, kind: AGENCY_TERM_KIND, label: 'x', category: 'system', priority: 20, payload: { personId: sim.player.id, stage: 'end', termEnds: ends } });
    sim.advanceTo(sim.now + 2 * 60_000);
    expect(career.agencyId).toBeDefined();
  });

  it('lets a first contract run out when the agency booked nothing, or the client turned the renewal down', () => {
    for (const booked of [false, true]) {
      const sim = signed(`term-out-${booked}`);
      const career = careerOf(sim.player);
      const at = (stage: string) => {
        sim.schedule({ at: sim.now + 60_000, kind: AGENCY_TERM_KIND, label: 'x', category: 'system', priority: 20, payload: { personId: sim.player.id, stage, termEnds: career.termEnds } });
        sim.advanceTo(sim.now + 2 * 60_000);
      };
      if (booked) career.lastBookedAt = sim.now;
      at('window');
      expect(career.renewal?.state).toBe(booked ? 'offered' : 'not-offered');
      if (booked) expect(sim.execute({ kind: 'career.renew', payload: { accept: false } }).ok).toBe(true);
      // Turned down, it stays turned down.
      if (booked) expect([career.renewal?.state, sim.execute({ kind: 'career.renew', payload: { accept: true } }).ok]).toEqual(['declined', false]);
      else expect(sim.execute({ kind: 'career.renew', payload: { accept: true } }).ok).toBe(false);
      at('end');
      expect(career.agencyId).toBeUndefined();
      expect(career.ended?.left).toBe(booked);
    }
  });

  it('gives a contract signed before contracts had a term the one running now', () => {
    const sim = signed('term-old');
    const career = careerOf(sim.player);
    career.signedAt = sim.now - 400 * MS_DAY;
    career.lastBookedAt = sim.now - 10 * MS_DAY;
    delete career.termEnds;
    delete career.initialTerm;
    play(sim, pending(sim, CAREER_WEEK_KIND)[0]!.at + MS_HOUR);
    expect(zonedParts(career.termEnds!, 'America/New_York').year).toBe(zonedParts(career.signedAt, 'America/New_York').year + 2);
    expect(career.initialTerm).toBe(false);
  });

  it('is ended by the agency after a year with nothing booked', () => {
    const sim = signed('year');
    careerOf(sim.player).signedAt = sim.now - 366 * MS_DAY;
    careerOf(sim.player).since = sim.now - 366 * MS_DAY;
    play(sim, pending(sim, CAREER_WEEK_KIND)[0]!.at + MS_HOUR);
    expect(careerOf(sim.player).agencyId).toBeUndefined();
    expect(careerOf(sim.player).ended?.left).toBe(false);
  });
});

describe('auditions', () => {
  it('come each week by the agency’s reach, for the parts its reach sends clients to', () => {
    const sim = pro('reach');
    // A middling reputation, which neither adds to the agency's reach nor takes from it.
    attributesOf(sim, sim.player).reputation = 50;
    for (const tier of [1, 2, 3] as const) {
      const agency = AGENCIES.find((a) => a.tier === tier)!;
      let count = 0;
      for (let w = 0; w < 60; w += 1) {
        const week = weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, agency, 'us-ny-newyork', 0);
        count += week.length;
        for (const a of week) expect(roleById(a.roleId).tiers).toContain(tier);
      }
      expect(count / 60).toBeGreaterThan(agency.auditionsPerWeek * 0.75);
      // A count that varies, as weeks do: some bring none, some twice the usual.
      const counts = Array.from({ length: 200 }, (_, w) => weekOfAuditions(sim, sim.player, sim.now + (w + 100) * 7 * MS_DAY, agency, 'us-ny-newyork', 0).length);
      expect(counts).toContain(0);
      expect(Math.max(...counts)).toBeGreaterThanOrEqual(2 * agency.auditionsPerWeek);
      expect(count / 60).toBeLessThan(agency.auditionsPerWeek * 1.25);
    }
  });

  it('thin past sixty by the parts written for that age: film to 0.48, television to 0.42, a voice not at all', () => {
    expect(AGE_ON_SCREEN.film).toBeCloseTo(0.482, 3);
    expect(AGE_ON_SCREEN.tv).toBeCloseTo(0.418, 3);
    const sim = pro('ageing');
    attributesOf(sim, sim.player).reputation = 50;
    const agency = AGENCIES.find((a) => a.tier === 2)!;
    const tally = (age: number) => {
      const by = { film: 0, tv: 0, voice: 0 };
      for (let w = 0; w < 2000; w += 1) {
        // The same age each week: the part's draw reads the age at the week.
        const week = sim.now + w * 7 * MS_DAY;
        sim.player.birthInstant = week - age * 365.2425 * MS_DAY;
        for (const a of weekOfAuditions(sim, sim.player, week, agency, 'us-ny-newyork', 0)) {
          const role = roleById(a.roleId);
          if (role.medium === 'voice') by.voice += 1; else if (role.after?.kind === 'film') by.film += 1; else if (role.after?.kind === 'tv') by.tv += 1;
        }
      }
      return by;
    };
    const young = tally(30);
    const old = tally(70);
    expect(old.film / young.film).toBeGreaterThan(AGE_ON_SCREEN.film * 0.85);
    expect(old.film / young.film).toBeLessThan(AGE_ON_SCREEN.film * 1.15);
    expect(old.tv / young.tv).toBeGreaterThan(AGE_ON_SCREEN.tv * 0.93);
    expect(old.tv / young.tv).toBeLessThan(AGE_ON_SCREEN.tv * 1.07);
    if (young.voice > 20) expect(old.voice).toBeGreaterThan(young.voice * 0.8);
  });

  it('come to an unrepresented actor only from submitting themselves, for parts that take submissions', () => {
    const sim = pro('self');
    expect(weekOfAuditions(sim, sim.player, sim.now, undefined, 'us-ny-newyork', 0)).toEqual([]);
    let got = 0;
    for (let w = 0; w < 200; w += 1) {
      const week = weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, undefined, 'us-ny-newyork', 5);
      got += week.length;
      for (const a of week) { expect(a.self).toBe(true); expect(roleById(a.roleId).selfSubmit).toBe(true); }
    }
    // Free, half as often as with a paid site's headshot and reel.
    expect(got / 1000).toBeCloseTo(ESTIMATE.selfSubmitCallback * WORK_COSTS.freeSubmissionShare, 1);
    expect(sim.execute({ kind: 'career.self_submit', payload: {} }).ok).toBe(true);
    careerOf(sim.player).submitted = ESTIMATE.selfSubmitsAWeek;
    expect(sim.execute({ kind: 'career.self_submit', payload: {} }).ok).toBe(false);
  });

  it('can’t be submitted for while school holds them', () => {
    const sim = createSave(1, 'held', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    expect(sim.execute({ kind: 'career.self_submit', payload: {} }).ok).toBe(false);
  });

  it('book at about one in twenty at the part’s bar, more above, less tired or on tape', () => {
    const role = roleById('costar');
    expect(bookingChance(craft(role.bar), role, 1, 'room')).toBeCloseTo(ESTIMATE.bookAtBar, 10);
    expect(bookingChance(craft(role.bar + 10), role, 1, 'room')).toBeCloseTo(ESTIMATE.bookAtBar + 10 * ESTIMATE.bookPerPoint, 10);
    expect(bookingChance(craft(100), roleById('film-ulb'), 1, 'room')).toBe(ESTIMATE.bookCeiling);
    expect(bookingChance(craft(0), role, 1, 'room')).toBe(ESTIMATE.bookFloor);
    expect(bookingChance(craft(role.bar), role, 1, 'tape')).toBeCloseTo(ESTIMATE.bookAtBar * ESTIMATE.tapeFactor, 10);
    expect(bookingChance(craft(role.bar), role, 0.5, 'room')).toBeCloseTo(ESTIMATE.bookAtBar * 0.5, 10);
    // The stage reads the voice and the text; the screen, the camera.
    const stage = roleById('lort-b');
    expect(bookingChance({ ...craft(stage.bar), voice: 100 }, stage, 1, 'room')).toBeGreaterThan(bookingChance({ ...craft(stage.bar), screen: 100 }, stage, 1, 'room'));
  });

  it('in the room is missed away from the city; a tape is made anywhere; three missed and the agency lets them go', () => {
    const sim = signed('miss', 3);
    play(sim, pending(sim, CAREER_WEEK_KIND)[0]!.at + MS_HOUR);
    const career = careerOf(sim.player);
    sim.player.currentLocationId = 'us-ca-losangeles';
    const room = career.auditions.find((a) => a.mode === 'room');
    const tape = career.auditions.find((a) => a.mode === 'tape');
    let weeks = 0;
    while (careerOf(sim.player).agencyId && weeks < 12) { play(sim, sim.now + 7 * MS_DAY); weeks += 1; }
    if (room) expect(room.status).toBe('missed');
    if (tape) expect(['done', 'booked']).toContain(tape.status);
    expect(careerOf(sim.player).agencyId).toBeUndefined();
    expect(careerOf(sim.player).ended!.reason).toContain(String(ESTIMATE.dropAfterMissed));
  }, 60_000);

  it('from the agency, are tapes for a client who lives out of town, and rooms for one only away', () => {
    const sim = signed('moved-away', 1, 95);
    const agency = AGENCIES.find((a) => a.id === careerOf(sim.player).agencyId)!;
    const modes = () => Array.from({ length: 60 }, (_, w) => weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, agency, 'us-ny-newyork', 0)).flat().map((a) => a.mode);
    sim.player.currentLocationId = 'us-ca-losangeles';
    sim.player.home = { kind: 'shared', cityId: 'us-ca-losangeles', since: sim.now };
    const moved = modes();
    expect(moved.length).toBeGreaterThan(0);
    expect(moved.every((m) => m === 'tape')).toBe(true);
    sim.player.home = { kind: 'shared', cityId: 'us-ny-newyork', since: sim.now };
    expect(modes().some((m) => m === 'room')).toBe(true);
  });

  it('from out of town, are tapes when self-submitted', () => {
    const sim = pro('tapes');
    sim.player.currentLocationId = 'us-ct-newhaven';
    let n = 0;
    for (let w = 0; w < 100; w += 1) for (const a of weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, undefined, 'us-ny-newyork', 5)) { n += 1; expect(a.mode).toBe('tape'); }
    expect(n).toBeGreaterThan(0);
    sim.player.currentLocationId = 'us-ny-newyork';
    let rooms = 0;
    for (let w = 0; w < 100; w += 1) rooms += weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, undefined, 'us-ny-newyork', 5).filter((a) => a.mode === 'room').length;
    expect(rooms).toBeGreaterThan(0);
  });

  it('aren’t sent for a time the actor is booked on a job', () => {
    const sim = signed('booked-out', 2);
    const b = offer(sim, 'lort-b', 4, 6, sim.now + MS_DAY);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    play(sim, sim.now + 21 * MS_DAY);
    const days = workDays(b).map((d) => ({ from: d.at, to: d.at + (d.rehearsal ? 480 : 180) * 60_000 }));
    for (const a of careerOf(sim.player).auditions) {
      for (const d of days) expect(a.at + 60 * 60_000 <= d.from || a.at >= d.to).toBe(true);
    }
  });
});

describe('a booking', () => {
  it('is offered days after the audition, and lapses unanswered after two', () => {
    const sim = signed('lapse', 1, 95);
    let weeks = 0;
    const offerAt = () => sim.timeline.pending().find((i) => i.kind === 'career.offer')?.at;
    while (!offerAt() && weeks < 30) { play(sim, sim.now + 7 * MS_DAY); weeks += 1; }
    // Booked, it's felt.
    play(sim, offerAt()! - 60_000);
    sim.player.wellbeing.morale = 50;
    sim.advanceTo(offerAt()! + 60_000);
    expect(sim.player.wellbeing.morale).toBeGreaterThan(50 + TURNS.booked.morale / 2);
    const b = careerOf(sim.player).bookings[0]!;
    expect(b.status === 'offered' || b.status === 'lapsed').toBe(true);
    const booked = careerOf(sim.player).auditions.find((a) => a.status === 'booked')!;
    expect(b.offeredAt - booked.at).toBeGreaterThanOrEqual(ESTIMATE.offerAfterDays[0] * MS_DAY);
    expect(b.offeredAt - booked.at).toBeLessThanOrEqual((ESTIMATE.offerAfterDays[1] + 1) * MS_DAY);
    expect(b.dueAt - b.offeredAt).toBe(ESTIMATE.bookingOfferDays * MS_DAY);
    play(sim, b.dueAt + MS_HOUR);
    expect(b.status).toBe('lapsed');
    expect(titled(sim, 'An Offer Lapsed').length).toBeGreaterThan(0);
  }, 120_000);

  it('taken, puts a screen job’s days on consecutive weekdays at seven, and a stage job’s rehearsals and performances Tuesday to Sunday', () => {
    const sim = signed('days');
    const screen = offer(sim, 'guest-hour', 8, 0, at(2026, 10, 5, 8));
    expect(workDays(screen).map((d) => zonedParts(d.at, NY)).map((p) => `${p.day}@${p.hour}`)).toEqual(['5@7', '6@7', '7@7', '8@7', '9@7', '12@7', '13@7', '14@7']);
    const stage = offer(sim, 'lort-b', 1, 1, at(2026, 10, 5, 8));
    const days = workDays(stage);
    expect(days).toHaveLength(12);
    expect(days.filter((d) => d.rehearsal).map((d) => zonedParts(d.at, NY).hour)).toEqual([11, 11, 11, 11, 11, 11]);
    expect(days.filter((d) => !d.rehearsal).map((d) => zonedParts(d.at, NY))).toMatchObject([{ day: 13, hour: 19, minute: 30 }, { day: 14 }, { day: 15 }, { day: 16 }, { day: 17 }, { day: 18 }]);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: screen.id } }).ok).toBe(true);
    expect(pending(sim, WORK_KIND)).toHaveLength(8);
    // SAG-AFTRA pays the Thursday after the week's Saturday.
    expect(pending(sim, PAY_KIND).map((p) => zonedParts(p.at, NY)).map((p) => `${p.month}/${p.day}`)).toEqual(['10/15', '10/22']);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: stage.id } }).ok).toBe(false);
  });

  it('pays Equity each Friday, and a day not turned up for ends the job and the representation', () => {
    const sim = signed('walk');
    const stage = offer(sim, 'lort-b', 1, 1, at(2026, 10, 5, 8));
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: stage.id } }).ok).toBe(true);
    // A weekend's days are paid the Friday after.
    expect(pending(sim, PAY_KIND).map((p) => zonedParts(p.at, NY)).map((p) => `${p.month}/${p.day}`)).toEqual(['10/9', '10/16', '10/23']);
    play(sim, at(2026, 10, 8, 12));
    expect(stage.worked).toBe(3);
    sim.player.currentLocationId = 'us-ct-newhaven';
    play(sim, at(2026, 10, 9, 12));
    expect(stage.status).toBe('fired');
    expect(pending(sim, WORK_KIND)).toEqual([]);
    expect(careerOf(sim.player).agencyId).toBeUndefined();
    play(sim, at(2026, 10, 10, 12));
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('A Play, A LORT Theater')).length).toBe(1);
  });
});

describe('pay', () => {
  it('on SAG-AFTRA work at scale with an agent is scale plus 10%, the 10% the agency’s; without one, scale', () => {
    const role = roleById('costar');
    const args = { scale: 1_283_00, role, rehearsal: false, before: 0, cityId: 'us-ny-newyork', at: at(2026, 10, 1) };
    const agent = paycheck({ ...args, represented: true });
    expect(agent).toMatchObject({ gross: 1_411_30, commission: 128_30, dues: 0 });
    expect(agent.net).toBe(agent.gross - agent.commission - agent.withheld);
    expect(paycheck({ ...args, represented: false })).toMatchObject({ gross: 1_283_00, commission: 0 });
  });

  it('on Equity work takes 10% for the agency, 5% of a rehearsal week, and 2.5% working dues', () => {
    const role = roleById('lort-b');
    const args = { scale: 1_213_00, role, before: 0, cityId: 'us-ny-newyork', at: at(2026, 10, 1), represented: true };
    expect(paycheck({ ...args, rehearsal: false })).toMatchObject({ gross: 1_213_00, commission: 121_30, dues: Math.round(1_213_00 * EQUITY.workingDues) });
    expect(paycheck({ ...args, rehearsal: true }).commission).toBe(Math.round(1_213_00 * AGENT_COMMISSION.equityRehearsalRate));
  });

  it('withholds, over a year’s checks, the year’s tax on the year’s wages at the job’s town', () => {
    const role = roleById('costar');
    let before = 0;
    let withheld = 0;
    for (let n = 0; n < 40; n += 1) {
      const check = paycheck({ scale: 1_283_00, role, rehearsal: false, represented: false, before, cityId: 'us-ny-newyork', at: at(2026, 10, 1) });
      before += check.gross;
      withheld += check.withheld;
    }
    expect(withheld).toBe(computeAnnualTax(before, 'us-ny-newyork', at(2026, 10, 1)).total);
    expect(computeAnnualTax(before, 'us-ny-newyork', at(2026, 10, 1)).total).toBeGreaterThan(computeAnnualTax(before, 'us-tx-houston', at(2026, 10, 1)).total);
  });

  it('reaches the bank after the week, as wages, at the contract’s rate on the day', () => {
    const sim = signed('paid');
    const b = offer(sim, 'costar', 2, 0, at(2026, 10, 5, 8));
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    play(sim, at(2026, 10, 15, 18));
    const pay = sim.universe.transactions.filter((t) => t.memo.startsWith('Co-Star'));
    expect(pay).toHaveLength(1);
    expect(pay[0]!.category).toBe('salary');
    // Scale plus 10% for two days, and each day's overtime past eight hours.
    // Each day's overtime, and any meal it ran late to.
    const overtime = careerOf(sim.player).days.reduce((sum, d, n) => sum + overtimeFor(roleById('costar'), 1_283_00, 1_283_00, d.hours, '2026-10-05') + mealPenalty(sim, sim.player, `${b.id}-${n + 1}`), 0);
    expect(careerOf(sim.player).days.map((d) => d.hours).every((h) => h >= 10 && h <= 12)).toBe(true);
    expect(overtime).toBeGreaterThan(0);
    // And the fitting the day before, an hour at the day rate (`FITTING`), wages too.
    const fitting = Math.round(1_283_00 / 8);
    expect(-pay[0]!.postings.find((q) => q.amount < 0)!.amount).toBe(Math.round(2 * 1_283_00 * 1.1) + overtime + fitting);
    expect(b.status).toBe('worked');
    expect(careerOf(sim.player).credits).toEqual([{ roleId: 'costar', year: 2026, cityId: 'us-ny-newyork', productionId: `prod-${b.id}`, part: 'Your Part' }]);
    // A castmate known from it, in the town it was worked in (`systems/people.ts`).
    expect(sim.player.contacts?.map((c) => [c.met.how, c.cityId, c.hours])).toEqual([['work', 'us-ny-newyork', 0]]);
    expect(sim.player.earnings!.years['2026']!.sag).toBe(Math.round(2 * 1_283_00 * 1.1) + overtime + fitting);
  });

  it('follows each contract’s steps, and holds past the last', () => {
    const day = roleById('costar').steps;
    expect([rateOn(day, '2026-06-30'), rateOn(day, '2026-07-01'), rateOn(day, '2029-07-01'), rateOn(day, '2031-01-01')]).toEqual([1_246_00, 1_283_00, 1_402_00, 1_402_00]);
    // Top of show on an hour: SAG-AFTRA's $11,352 from 1 July 2025, and 3% on from 2026, SLATE's estimate.
    expect(rateOn(roleById('guest-hour').steps, '2025-07-01') * 8).toBeCloseTo(11_352_00, -1);
    expect(rateOn(roleById('guest-half').steps, '2025-07-01') * 5).toBeCloseTo(7_095_00, -1);
    expect(rateOn(roleById('guest-hour').steps, '2026-07-01') * 8).toBeCloseTo(11_693_00, -1);
    expect(rateOn(roleById('broadway').steps, '2026-09-28')).toBe(2_799_00);
    expect(rateOn(roleById('lort-b').steps, '2027-01-01')).toBe(1_213_00);
    for (const r of ROLES) expect(r.tiers.length).toBeGreaterThan(0);
  });
});

describe('the unions', () => {
  it('SAG-AFTRA: eligible on the first job, joined only for work thirty days on, and refused if the bank can’t cover it', () => {
    const sim = signed('sag');
    const first = offer(sim, 'costar', 1, 0, sim.now + 3 * MS_DAY);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: first.id } }).ok).toBe(true);
    expect(careerOf(sim.player).unions.sag).toEqual({ eligibleAt: sim.now });
    const soon = offer(sim, 'costar', 1, 0, sim.now + 10 * MS_DAY);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: soon.id } }).ok).toBe(true);
    expect(careerOf(sim.player).unions.sag!.joinedAt).toBeUndefined();
    careerOf(sim.player).unions.sag!.eligibleAt = sim.now - SAG_AFTRA.taftHartleyDays * MS_DAY;
    const later = offer(sim, 'costar', 1, 0, sim.now + 20 * MS_DAY);
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0) a.balance = 0;
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: later.id } }).ok).toBe(false);
    expect(later.status).toBe('offered');
  });

  it('SAG-AFTRA takes its initiation fee and half a year’s dues on joining', () => {
    const sim = signed('sag-join');
    careerOf(sim.player).unions.sag = { eligibleAt: sim.now - 31 * MS_DAY };
    const b = offer(sim, 'costar', 1);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    const fee = sim.universe.transactions.find((t) => t.memo.startsWith('SAG-AFTRA initiation'))!;
    expect(fee.postings.filter((q) => q.amount > 0).reduce((s, q) => s + q.amount, 0)).toBe(SAG_AFTRA.initiation + Math.round(SAG_AFTRA.basicDues / 2));
    expect(careerOf(sim.player).unions.sag!.joinedAt).toBe(sim.now);
  });

  it('Equity: a member on the first contract, $600 of the fee down', () => {
    const sim = signed('eq');
    const b = offer(sim, 'lort-b', 3, 4);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    expect(careerOf(sim.player).unions.equity).toEqual({ joinedAt: sim.now, initiationPaid: EQUITY.initiationNow });
    // The next bill is on the calendar from joining, on the first of May or November at nine.
    const bill = sim.universe.scheduled.filter((i) => i.kind === DUES_KIND && i.status === 'pending');
    expect(bill).toHaveLength(1);
    expect(zonedParts(bill[0]!.at, NY)).toMatchObject({ day: 1, hour: 9 });
    expect([5, 11]).toContain(zonedParts(bill[0]!.at, NY).month);
    const fee = sim.universe.transactions.find((t) => t.memo.startsWith('Actors’ Equity initiation'))!;
    expect(fee.postings.filter((q) => q.amount > 0).reduce((s, q) => s + q.amount, 0)).toBe(EQUITY.initiationNow + EQUITY.basicDues / 2);
  });

  it('bill dues each May and November: half the basic dues, and in May SAG-AFTRA’s work dues on last year and Equity’s next $600', () => {
    const sim = pro('dues');
    const career = careerOf(sim.player);
    career.unions = { sag: { eligibleAt: 0, joinedAt: 1 }, equity: { joinedAt: sim.now - 365 * MS_DAY, initiationPaid: EQUITY.initiationNow } };
    yearOf(sim.player, 2025).sag = 40_000_00;
    expect(billDues(sim, sim.player, 2026, 5)).toBe(Math.round(SAG_AFTRA.basicDues / 2) + Math.round(40_000_00 * SAG_AFTRA.workDues) + EQUITY.basicDues / 2 + EQUITY.initiationNow);
    expect(billDues(sim, sim.player, 2026, 5)).toBe(0);
    expect(billDues(sim, sim.player, 2026, 11)).toBe(Math.round(SAG_AFTRA.basicDues / 2) + EQUITY.basicDues / 2);
    expect(career.unions.equity!.initiationPaid).toBe(2 * EQUITY.initiationNow);
    // The installment comes in May, not November, however long it's been.
    const later = pro('dues-nov');
    careerOf(later.player).unions = { equity: { joinedAt: later.now - 400 * MS_DAY, initiationPaid: EQUITY.initiationNow } };
    expect(billDues(later, later.player, 2026, 11)).toBe(EQUITY.basicDues / 2);
    // Paid, they're dues on the return, on the ledger's Union Dues line.
    expect(yearOf(sim.player, 2026).dues).toBe(Math.round(SAG_AFTRA.basicDues / 2) + Math.round(40_000_00 * SAG_AFTRA.workDues) + EQUITY.basicDues / 2 + EQUITY.initiationNow + Math.round(SAG_AFTRA.basicDues / 2) + EQUITY.basicDues / 2);
    expect(sim.nominalAccount('expense', 'Union Dues').balance).toBeGreaterThan(0);
    // Bounced, they're owed, not on the return.
    const broke = pro('dues-broke');
    careerOf(broke.player).unions = { sag: { eligibleAt: 0, joinedAt: 1 } };
    for (const a of Object.values(broke.universe.accounts)) if (a.ownerId === broke.player.id && a.balance > 0 && a.kind !== 'escrow') a.balance = 0;
    broke.universe.accounts[broke.player.primaryAccountId!]!.balance = -100_000_00;
    expect(billDues(broke, broke.player, 2026, 11)).toBe(Math.round(SAG_AFTRA.basicDues / 2));
    expect(yearOf(broke.player, 2026).dues).toBe(0);
    expect(careerOf(broke.player).unions.owed).toBe(Math.round(SAG_AFTRA.basicDues / 2));
  });
});

describe('the work', () => {
  it('grows an actor toward how far they can grow, and never past it', () => {
    const sim = signed('work-ceiling', 2);
    const craft = sim.player.craft!;
    // A point of room left in every skill: the work comes near it and slows, and never passes it.
    const ceiling = Object.fromEntries(Object.entries(craft).map(([k, v]) => [k, v + 1])) as typeof craft;
    sim.player.craftCeiling = ceiling;
    bindCeiling(craft, ceiling);
    const before = { ...craft };
    const b = offer(sim, 'lort-b', 4, 4, sim.now + MS_DAY);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    tended(sim, workDays(b)[workDays(b).length - 1]!.at + MS_HOUR);
    const keys = Object.keys(craft) as (keyof typeof craft)[];
    expect(keys.some((k) => craft[k] > before[k])).toBe(true);
    for (const k of keys) expect(craft[k]).toBeLessThanOrEqual(ceiling[k] + 1e-9);
  });
});

describe('a stage run with nights the understudy played', () => {
  it('ends when its last call passes, the covered nights unpaid, and credits it', () => {
    // Until 2026-09-28 a night missed laid up left the run open for good, and the actor on a job for life.
    const sim = signed('covered', 2);
    const b = offer(sim, 'lort-b', 1, 1, sim.now + MS_DAY);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    const days = workDays(b);
    const credits = careerOf(sim.player).credits.length;
    // Laid up from the last three calls on.
    tended(sim, days[days.length - 3]!.at - MS_HOUR);
    healthOf(sim.player).injury = { kind: 'sprain', at: sim.now, until: sim.now + 30 * MS_DAY, offWorkUntil: sim.now + 30 * MS_DAY };
    sim.advanceTo(days[days.length - 1]!.at + MS_HOUR);
    expect(b.status).toBe('worked');
    expect(b.missedNights).toBe(3);
    expect(b.worked).toBe(days.length - 3);
    expect(careerOf(sim.player).credits.length).toBe(credits + 1);
  });

  it('ends on a night worked after nights covered in the middle of it', () => {
    const sim = signed('covered-middle', 2);
    const b = offer(sim, 'lort-b', 1, 1, sim.now + MS_DAY);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    const days = workDays(b);
    tended(sim, days[days.length - 5]!.at - MS_HOUR);
    // Laid up for two calls, then back for the last three.
    healthOf(sim.player).injury = { kind: 'sprain', at: sim.now, until: days[days.length - 3]!.at - MS_HOUR, offWorkUntil: days[days.length - 3]!.at - MS_HOUR };
    tended(sim, days[days.length - 1]!.at + MS_HOUR);
    expect(b.missedNights).toBe(2);
    expect(b.status).toBe('worked');
  });

  it('is closed on opening a save that holds one left open', () => {
    const sim = signed('left-open', 2);
    const b = offer(sim, 'lort-b', 1, 1, sim.now - 60 * MS_DAY);
    b.status = 'accepted';
    b.worked = 5;
    closeStaleBookings(sim, sim.player);
    expect(b.status).toBe('worked');
    expect(b.missedNights).toBe(workDays(b).length - 5);
  });
});

describe('a showcase missed', () => {
  it('says why: in hospital, or asleep', () => {
    for (const [seed, ward] of [['show-ward', true], ['show-asleep', false]] as const) {
      const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
      sim.schedule({ at: sim.now + MS_HOUR, kind: SHOWCASE_KIND, label: 'Actor Showcase', category: 'school', priority: 30, requiresPlayer: true, durationMinutes: 150, payload: { personId: sim.player.id, cityId: 'us-ny-newyork' } });
      if (ward) healthOf(sim.player).inHospitalUntil = sim.now + 2 * MS_HOUR;
      else sim.player.awakeSince = sim.now + 2 * MS_HOUR;
      sim.advanceTo(sim.now + 2 * MS_HOUR);
      const note = sim.universe.notifications.find((n) => n.title === 'You Missed The Showcase In New York')!;
      expect(note.body).toBe(ward ? 'In hospital that day, you weren’t seen.' : 'Asleep through it, you weren’t seen.');
    }
  });
});

describe('the dues by date', () => {
  it('bill a member on the first of May and November whatever the career week, a student\u2019s term included, and book the next', () => {
    const sim = pro('dues-dated');
    careerOf(sim.player).unions = { equity: { joinedAt: sim.now, initiationPaid: EQUITY.initiationNow } };
    // No career week to bill it: a student's term has none.
    for (const i of sim.universe.scheduled) if (i.kind === CAREER_WEEK_KIND && i.status === 'pending') sim.timeline.cancel(i.id, sim.now);
    sim.schedule({ at: sim.now + 60_000, kind: DUES_KIND, label: 'Union Dues', category: 'career', priority: 20, payload: { personId: sim.player.id } });
    const dues = () => sim.nominalAccount('expense', 'Union Dues').balance;
    const before = dues();
    sim.advanceTo(sim.now + 2 * 60_000);
    expect(dues() - before).toBe(EQUITY.basicDues / 2);
    const next = sim.universe.scheduled.filter((i) => i.kind === DUES_KIND && i.status === 'pending');
    expect(next).toHaveLength(1);
    expect(zonedParts(next[0]!.at, NY)).toMatchObject({ day: 1, hour: 9 });
  });
});

describe('a job over the school’s calls', () => {
  it('is refused where a school call or a showcase falls in its hours, and taken once it’s clear', () => {
    const sim = pro('clash');
    const b = offer(sim, 'costar', 1);
    const day = workDays(b)[0]!.at;
    const call = sim.schedule({ at: day + 2 * MS_HOUR, kind: 'school.summer', label: 'Summer Cabaret: Performance', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 150, payload: { personId: sim.player.id } });
    expect(schoolClash(sim, sim.player, b)?.id).toBe(call.id);
    const no = sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } });
    expect(no.ok).toBe(false);
    expect(no.error).toMatch(/clashes with Summer Cabaret: Performance/);
    // Twelve hours on set at seven: an evening at nine is clear, a job at home.
    sim.timeline.reschedule(call.id, day + 14 * MS_HOUR);
    expect(schoolClash(sim, sim.player, b)).toBeUndefined();
    // Away, the day before and the day after are held too.
    const away = offer(sim, 'costar', 1);
    away.cityId = 'us-ca-losangeles';
    const first = workDays(away)[0]!.at;
    sim.schedule({ at: first - 20 * MS_HOUR, kind: SHOWCASE_KIND, label: 'Actor Showcase', category: 'school', priority: 30, requiresPlayer: true, durationMinutes: 150, payload: { personId: sim.player.id } });
    expect(schoolClash(sim, sim.player, away)?.kind).toBe(SHOWCASE_KIND);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
  });
});

describe('the attributes at work', () => {
  const earned = (steps: number[], from = 0) => steps.reduce((r, s) => (s > 0 ? r + s * (1 - r / 100) : Math.max(0, r + s)), from);

  it('earns reputation by the day and the job, recognition by the screen, and composure on set', () => {
    const sim = pro('attr-work');
    const a = attributesOf(sim, sim.player);
    const composure = a.composure;
    const b = offer(sim, 'costar', 2, 0, at(2026, 10, 5, 8));
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    play(sim, at(2026, 10, 7, 12));
    expect(b.status).toBe('worked');
    expect(a.reputation).toBeCloseTo(earned([ATTRIBUTES.reputation.day, ATTRIBUTES.reputation.day, ATTRIBUTES.reputation.job]), 6);
    expect(a.composure).toBeGreaterThan(composure);
    // Recognition when the episode airs, by its audience: nothing at the wrap.
    expect(a.recognition).toBe(0);
    const airs = pending(sim, AIRS_KIND)[0]!;
    play(sim, airs.at + MS_HOUR);
    expect(a.recognition).toBeCloseTo(ATTRIBUTES.recognition.costar * Number(airs.payload.audience), 10);
  });

  it('sends a finished independent film to Tribeca in June if it gets in, to Brooklyn if not, or straight to streaming', () => {
    const roads = new Set<string>();
    for (const seed of ['attr-premiere', 'attr-premiere-2', 'attr-premiere-3', 'attr-premiere-4', 'attr-premiere-5', 'attr-premiere-6', 'attr-premiere-7', 'attr-premiere-8']) {
      const sim = pro(seed);
      const film = offer(sim, 'film-low', 1, 0, at(2026, 10, 5, 8));
      expect(sim.execute({ kind: 'career.accept', payload: { bookingId: film.id } }).ok).toBe(true);
      play(sim, at(2026, 10, 9, 12));
      expect(film.status).toBe('worked');
      const premiere = pending(sim, FESTIVAL_KIND)[0]!;
      const road = String(premiere.payload.road);
      roads.add(road);
      expect(premiere.locationId).toBe('us-ny-newyork');
      if (road === 'tribeca') expect(zonedParts(premiere.at, NY)).toMatchObject({ year: 2027, month: 6, day: 10, hour: 19 });
      if (road === 'brooklyn') expect(zonedParts(premiere.at, NY)).toMatchObject({ year: 2027, month: 6, day: 1, hour: 19 });
      if (road === 'streaming') expect(premiere.requiresPlayer).toBe(false);
    }
    expect(roads.size).toBeGreaterThan(1);
    // About one in five gets into Tribeca, over many films.
    const sim = pro('attr-roads');
    const n = 2000;
    const tribeca = Array.from({ length: n }, (_, k) => sim.rng('career.selection', sim.player.id, `f${k}`).next() < FILM_ROAD.tribeca).filter(Boolean).length;
    expect(tribeca / n).toBeGreaterThan(0.17);
    expect(tribeca / n).toBeLessThan(0.23);
  });

  it('puts a studio film’s weekly performer on a press day a week before it opens, and an independent’s on none', () => {
    const press = (there: boolean) => {
      const sim = pro('attr-press');
      const film = offer(sim, 'film-weekly', 1, 0, at(2026, 10, 5, 8));
      expect(sim.execute({ kind: 'career.accept', payload: { bookingId: film.id } }).ok).toBe(true);
      play(sim, at(2026, 10, 14, 12));
      expect(film.status).toBe('worked');
      const day = pending(sim, PRESS_KIND)[0]!;
      const premiere = pending(sim, FESTIVAL_KIND)[0]!;
      expect(zonedParts(day.at, 'America/Los_Angeles')).toMatchObject({ ...zonedParts(premiere.at - 7 * MS_DAY, 'America/Los_Angeles'), hour: 10, minute: 0 });
      expect(day).toMatchObject({ durationMinutes: 240, requiresPlayer: true, locationId: 'us-ca-losangeles' });
      sim.advanceTo(day.at - MS_HOUR);
      sim.player.currentLocationId = there ? 'us-ca-losangeles' : 'us-ny-newyork';
      const recognition = attributesOf(sim, sim.player).recognition;
      sim.advanceTo(day.at + MS_HOUR);
      return { gained: attributesOf(sim, sim.player).recognition - recognition, news: careerOf(sim.player).news?.[0]?.source };
    };
    const kept = press(true);
    expect(kept.gained).toBeCloseTo(RIVALS.press, 10);
    expect(kept.news).toBe('Press Day');
    expect(press(false).gained).toBe(0);
    // An independent film's day performer is asked to none.
    const sim = pro('attr-press-indie');
    const film = offer(sim, 'film-low', 1, 0, at(2026, 10, 5, 8));
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: film.id } }).ok).toBe(true);
    play(sim, at(2026, 10, 9, 12));
    expect(pending(sim, PRESS_KIND)).toHaveLength(0);
  });

  it('puts a series regular on a press day a week before it airs', () => {
    const sim = pro('attr-press-series');
    const series = offer(sim, 'series-half', 13, 0, at(2026, 10, 5, 8));
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: series.id } }).ok).toBe(true);
    tended(sim, at(2027, 1, 20, 12));
    expect(series.status).toBe('worked');
    const airs = pending(sim, AIRS_KIND)[0]!;
    const day = pending(sim, PRESS_KIND)[0]!;
    expect(zonedParts(day.at, NY)).toMatchObject({ ...zonedParts(airs.at - 7 * MS_DAY, NY), hour: 10, minute: 0 });
    // And none is put in the past: an opening under a week away has none.
    const late = pending(sim, PRESS_KIND).length;
    schedulePress(sim, sim.player, roleById('series-half'), sim.now + 3 * MS_DAY, 'us-ny-newyork');
    expect(pending(sim, PRESS_KIND)).toHaveLength(late);
  });

  it('loses reputation for a walk-off', () => {
    const sim = pro('attr-walk');
    const a = attributesOf(sim, sim.player);
    a.reputation = 30;
    const stage = offer(sim, 'lort-b', 1, 1, at(2026, 10, 5, 8));
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: stage.id } }).ok).toBe(true);
    play(sim, at(2026, 10, 8, 12));
    const before = a.reputation;
    sim.player.currentLocationId = 'us-ct-newhaven';
    play(sim, at(2026, 10, 9, 12));
    expect(stage.status).toBe('fired');
    expect(a.reputation).toBeCloseTo(before + ATTRIBUTES.reputation.fired, 6);
  });

  it('costs reputation for an audition the agency got and nobody went to, and puts nerves before one attended', () => {
    const sim = signed('attr-audition');
    const a = attributesOf(sim, sim.player);
    a.reputation = 10;
    const career = careerOf(sim.player);
    career.auditions.push({ id: 'aud-miss', roleId: 'costar', at: sim.now + 60_000, mode: 'room', cityId: 'us-ca-losangeles', status: 'ahead' });
    sim.schedule({ at: sim.now + 60_000, kind: AUDITION_KIND, label: 'Audition', category: 'career', priority: 30, requiresPlayer: true, durationMinutes: 60, payload: { personId: sim.player.id, auditionId: 'aud-miss' } });
    sim.advanceTo(sim.now + 2 * 60_000);
    expect(a.reputation).toBe(10 + ATTRIBUTES.reputation.missedAudition);
    sim.player.wellbeing.stress = 0;
    const composure = a.composure;
    career.auditions.push({ id: 'aud-go', roleId: 'costar', at: sim.now + 60_000, mode: 'room', cityId: 'us-ny-newyork', status: 'ahead' });
    sim.schedule({ at: sim.now + 60_000, kind: AUDITION_KIND, label: 'Audition', category: 'career', priority: 30, requiresPlayer: true, durationMinutes: 60, payload: { personId: sim.player.id, auditionId: 'aud-go' } });
    sim.player.awakeSince = sim.now - MS_HOUR;
    sim.advanceTo(sim.now + 2 * 60_000);
    expect(sim.player.wellbeing.stress).toBeGreaterThan(0);
    expect(a.composure).toBeGreaterThan(composure);
    // Worked on with a coach, the same nerves at half.
    const plain = sim.player.wellbeing.stress;
    sim.player.wellbeing.stress = 0;
    a.composure = composure;
    career.auditions.push({ id: 'aud-coached', roleId: 'costar', at: sim.now + 60_000, mode: 'room', cityId: 'us-ny-newyork', status: 'ahead', coached: true });
    sim.schedule({ at: sim.now + 60_000, kind: AUDITION_KIND, label: 'Audition', category: 'career', priority: 30, requiresPlayer: true, durationMinutes: 60, payload: { personId: sim.player.id, auditionId: 'aud-coached' } });
    sim.advanceTo(sim.now + 2 * 60_000);
    expect(sim.player.wellbeing.stress).toBeCloseTo(plain / 2, 1);
  });

  it('fades recognition in the first week of each month', () => {
    const sim = pro('attr-fade-week');
    const a = attributesOf(sim, sim.player);
    a.recognition = 40;
    for (let n = 0; n < 6; n += 1) {
      const week = pending(sim, CAREER_WEEK_KIND)[0]!;
      sim.advanceTo(week.at + 60_000);
      if (zonedParts(week.at, sim.homeZone).day <= 7) break;
      expect(a.recognition).toBe(40);
    }
    expect(a.recognition).toBeCloseTo(40 * (1 - ATTRIBUTES.recognition.fadePerMonth), 2);
    // With a publicist keeping the name out, half the fade.
    careerOf(sim.player).publicist = { paidFor: 'kept' };
    const r = a.recognition;
    for (let n = 0; n < 6; n += 1) {
      const week = pending(sim, CAREER_WEEK_KIND)[0]!;
      sim.advanceTo(week.at + 60_000);
      if (zonedParts(week.at, sim.homeZone).day <= 7) break;
    }
    // Its retainer's press lands twice on the way (a month paid, then the new month's), and the fade between is half.
    const press = publicityFor(sim, sim.player, sim.now);
    expect(a.recognition).toBeCloseTo((r + press) * (1 - ATTRIBUTES.recognition.fadePerMonth * ATTRIBUTES.build.publicity.fadeKept) + press, 1);
  });
});

describe('an offer that can’t be taken', () => {
  it('says why on Home and offers only a pass', () => {
    const sim = pro('offer-cannot');
    const busy = offer(sim, 'costar', 80);
    busy.status = 'accepted';
    const career = careerOf(sim.player);
    career.auditions.push({ id: 'aud-x', roleId: 'costar', at: sim.now, mode: 'room', cityId: 'us-ny-newyork', status: 'booked' });
    sim.schedule({ at: sim.now + 60_000, kind: 'career.offer', label: 'An Offer', category: 'system', priority: 20, payload: { personId: sim.player.id, auditionId: 'aud-x' } });
    sim.advanceTo(sim.now + 2 * 60_000);
    const made = career.bookings.find((b) => b.status === 'offered' && b.id !== busy.id)!;
    expect(acceptRefusal(sim, sim.player, made)).toMatch(/clashes with/);
    const decision = Object.values(sim.universe.decisions).find((d) => d.refType === 'booking' && d.refId === made.id)!;
    expect(decision.actions.map((a) => a.label)).toEqual(['Pass']);
    expect(decision.detail).toMatch(/You can’t take it: It clashes with/);
    // Free again, a new offer can be taken.
    busy.status = 'passed';
    expect(acceptRefusal(sim, sim.player, made)).toBeUndefined();
  });
});

describe('two jobs at once', () => {
  it('clash in one city only where their hours meet, and in two where the days away meet', () => {
    const sim = pro('clash-hours');
    const monday = workDays(offer(sim, 'costar', 1)).at(0)!.at;
    const shoot = offer(sim, 'costar', 1, 0, monday);
    // A location film starting the same morning an hour later: a day's journey either side.
    const film = offer(sim, 'film-low', 6, 0, monday);
    film.location = 'us-il-chicago';
    expect(jobsClash(sim.player, shoot, film)).toBe(true);
    // The next morning still clashes: the day before a location shoot is the journey out.
    const next = offer(sim, 'film-low', 6, 0, monday + MS_DAY);
    next.location = 'us-il-chicago';
    expect(workDays(next)[0]!.at - workDays(shoot)[0]!.at).toBeGreaterThan(20 * MS_HOUR);
    expect(jobsClash(sim.player, shoot, next)).toBe(true);
    // A week later it’s clear, the journey out the day before included.
    const later = offer(sim, 'film-low', 6, 0, monday + 7 * MS_DAY);
    later.location = 'us-il-chicago';
    expect(jobsClash(sim.player, shoot, later)).toBe(false);
    // In one city, a day on set meets a rehearsal that day, and not a performance that evening.
    const play = offer(sim, 'lort-b', 1, 1, monday);
    const rehearsal = workDays(play).find((d) => d.rehearsal)!.at;
    const performance = workDays(play).find((d) => !d.rehearsal)!.at;
    expect(jobsClash(sim.player, offer(sim, 'costar', 1, 0, rehearsal), play)).toBe(true);
    const evening = offer(sim, 'costar', 1, 0, performance);
    expect(zonedParts(workDays(evening)[0]!.at, NY).day).toBe(zonedParts(performance, NY).day);
    expect(jobsClash(sim.player, evening, play)).toBe(false);
  });
});

describe('the bookings kept', () => {
  it('prunes to forty from the oldest finished, never one still to come or under option', () => {
    const sim = pro('prune');
    const career = careerOf(sim.player);
    const live = offer(sim, 'costar', 1);
    live.status = 'accepted';
    const optioned = offer(sim, 'costar', 1);
    optioned.status = 'worked';
    career.option = { seriesId: optioned.id, decidedAt: sim.now + MS_DAY };
    const paying = offer(sim, 'costar', 1);
    paying.status = 'worked';
    sim.schedule({ at: sim.now + MS_DAY, kind: PAY_KIND, label: 'Paid', category: 'career', priority: 20, payload: { personId: sim.player.id, bookingId: paying.id } });
    for (let n = 0; n < 45; n += 1) offer(sim, 'costar', 1).status = 'passed';
    pruneBookings(sim, sim.player);
    expect(career.bookings).toHaveLength(40);
    expect(career.bookings.slice(0, 3)).toEqual([live, optioned, paying]);
  });
});

describe('where they live', () => {
  it('moves them, their home and their clock to New York or Los Angeles, and back', () => {
    const sim = pro('move');
    expect(sim.execute({ kind: 'career.relocate', payload: { cityId: 'us-ca-losangeles', kind: 'shared' } }).ok).toBe(true);
    expect(sim.player.currentLocationId).toBe('us-ca-losangeles');
    expect(sim.player.home).toMatchObject({ cityId: 'us-ca-losangeles', kind: 'shared' });
    expect(sim.universe.currentZone).toBe('America/Los_Angeles');
    expect(sim.execute({ kind: 'career.relocate', payload: { cityId: 'us-ca-losangeles', kind: 'shared' } }).ok).toBe(false);
    expect(sim.execute({ kind: 'career.relocate', payload: { cityId: 'us-tx-houston', kind: 'shared' } }).ok).toBe(false);
  });

  it('leaves them where they were when they can’t pay to move', () => {
    const sim = pro('broke');
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0) a.balance = 0;
    expect(sim.execute({ kind: 'career.relocate', payload: { cityId: 'us-ca-losangeles', kind: 'own' } }).ok).toBe(false);
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    expect(sim.universe.currentZone).toBe('America/New_York');
    expect(sim.universe.homeZone).toBe('America/New_York');
  });

  it('turns the day over on the new home’s clock, each date once, moving west and east', () => {
    const sim = pro('clock');
    const LA = 'America/Los_Angeles';
    const rolled = () => sim.universe.scheduled.filter((i) => i.kind === 'life.day_rollover' && i.status === 'done').map((i) => i.at);
    sim.advanceTo(instantFromZoned({ year: 2026, month: 10, day: 5, hour: 15 }, NY_ZONE));
    const before = rolled().length;
    expect(sim.execute({ kind: 'career.relocate', payload: { cityId: 'us-ca-losangeles', kind: 'shared' } }).ok).toBe(true);
    expect(sim.universe.homeZone).toBe(LA);
    // West: New York's midnight is passed over, and Los Angeles' is the next.
    sim.advanceTo(instantFromZoned({ year: 2026, month: 10, day: 7, hour: 12 }, LA));
    const west = rolled().slice(before);
    expect(west).toEqual([instantFromZoned({ year: 2026, month: 10, day: 6, hour: 0 }, LA), instantFromZoned({ year: 2026, month: 10, day: 7, hour: 0 }, LA)]);
    // East, at ten at night Pacific: New York's day has begun, and turns over at once.
    sim.advanceTo(instantFromZoned({ year: 2026, month: 10, day: 7, hour: 22 }, LA));
    expect(sim.execute({ kind: 'career.relocate', payload: { cityId: 'us-ny-newyork', kind: 'shared' } }).ok).toBe(true);
    const moved = sim.now;
    sim.advanceTo(instantFromZoned({ year: 2026, month: 10, day: 9, hour: 12 }, NY_ZONE));
    expect(rolled().slice(before + 2)).toEqual([moved, instantFromZoned({ year: 2026, month: 10, day: 9, hour: 0 }, NY_ZONE)]);
    // Inside the rollover, before the next is armed, the clock still moves.
    for (const one of sim.timeline.pending()) if (one.kind === 'life.day_rollover') sim.timeline.cancel(one.id, sim.now);
    rehome(sim, LA);
    expect(sim.universe.homeZone).toBe(LA);
  });
});

describe('the school’s later years', () => {
  it('cost more each year at the Bulletins’ growth', () => {
    const [y1, y2, y3] = [0, 2, 4].map((t) => termAccount('USD', true, t));
    expect(y1!.tuition).toBe(20_375_00);
    expect(y2!.tuition).toBe(Math.round(40_750_00 * 1.0322 / 2));
    expect(y3!.healthPlan).toBe(Math.round(3_764_00 * 1.081 ** 2 / 2));
    expect(y2!.livingScholarship).toBeGreaterThan(y1!.livingScholarship);
    expect(termAccount('USD', true, 1)).toEqual(y1);
  });

  it('go to Yale Rep on the slot its seasons keep, and a third-year strong enough is asked into a role', () => {
    expect(repProduction(1)).toMatchObject({ name: 'The Seagull', estimate: false });
    expect(repProduction(2)).toMatchObject({ name: 'Yale Rep’s October Production', run: { from: '2027-10-01', to: '2027-10-23' }, estimate: true });
    expect(repProduction(3).run.from).toBe('2028-03-03');
    // Rehearsals start no earlier than the term.
    expect(repProduction(2).rehearsals.from).toBe('2027-08-23');
    const sim = createSave(1, 'rep', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    tended(sim, at(2028, 8, 28, 10));
    const school = sim.player.school!;
    expect(school.rep?.production).toBe('Yale Rep’s October Production');
    expect(school.rep?.kind).toBe(actingOf(sim.player.craft!) >= 77 ? 'role' : 'understudy');
  }, 120_000);

  it('don’t ask a second-year into a role, however strong', () => {
    const sim = createSave(1, 'rep2', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    play(sim, at(2027, 8, 22, 12));
    Object.assign(sim.player.craft!, { scene: 95, character: 95, emotion: 95 });
    play(sim, at(2027, 8, 23, 12));
    expect(sim.player.school!.rep).toMatchObject({ production: 'Yale Rep’s October Production', kind: 'understudy' });
  }, 120_000);
});

describe('agencies calling later', () => {
  it('can follow a job worked while unrepresented', () => {
    let offered = 0;
    for (const seed of ['c1', 'c2', 'c3', 'c4']) {
      const sim = pro(seed, 90);
      const b = offer(sim, 'guest-hour', 8, 0, sim.now + 2 * MS_DAY);
      expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
      play(sim, workDays(b)[7]!.at + MS_HOUR);
      expect(b.status).toBe('worked');
      offered += careerOf(sim.player).offers.length;
    }
    expect(offered).toBeGreaterThan(0);
    // An audition there was never one of the agency's.
    expect(AUDITION_KIND).toBe('career.audition');
  });
});
