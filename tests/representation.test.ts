/**
 * Seeking other representation (`systems/representation.ts`, from
 * 2026-10-08): an approach, its answer, a meeting, an offer's terms, signing
 * at once or from a contract's end, declining, withdrawing, the limits on
 * asking again, and the commission each booking keeps through a change. What
 * isn't a command is marked SETUP.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { AGENCIES } from '@/engine/content/career';
import { beginCareer, careerOf, represent, rosterFit, standing, takesBack, weekOfAuditions, type Booking } from '@/engine/systems/career';
import { APPROACH, agencyOutlook, answerOf, approachesOf, offersAfterMeeting, representationReview } from '@/engine/systems/representation';
import { attributesOf } from '@/engine/systems/attributes';
import { evenCraft } from '@/engine/systems/school';

const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
/** SETUP: a graduate in New York with headshots, of a craft, signed with an agency where one's named, as the business would have it. */
function actor(seed: string, craft: number, agencyId?: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  sim.player.school!.standing = 'graduated';
  sim.player.craft = evenCraft(craft);
  beginCareer(sim, sim.player);
  sim.player.currentLocationId = 'us-ny-newyork';
  careerOf(sim.player).headshotsAt = sim.now;
  if (agencyId) represent(sim, sim.player, { agencyId, cityId: 'us-ny-newyork', until: sim.now });
  return sim;
}
/** SETUP: the body kept going while the clock runs. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
/** An approach whose answer and meeting go the way wanted, found among seeds (the draws are the decider's, `career.approach`). */
function find(craft: number, agencyId: string, want: 'offer' | 'passed', from?: string): Simulation {
  for (let n = 0; n < 200; n += 1) {
    const sim = actor(`rep-${want}-${n}`, craft, from);
    const id = `ap${careerOf(sim.player).seq + 1}`;
    const a = { id, agencyId, via: 'submission' as const };
    const answer = answerOf(sim, sim.player, a);
    if (want === 'passed' ? answer === 'passed' : answer === 'meeting' && offersAfterMeeting(sim, sim.player, a)) return sim;
  }
  throw new Error('no seed');
}

describe('approaching an agency', () => {
  it('a capable actor with Independent Artist Group approaches CAA: an answer by its date, a meeting kept, terms shown, signed from the contract’s end', () => {
    let sim = find(88, 'caa', 'offer', 'iag');
    const signedAt = careerOf(sim.player).signedAt!;
    const termEnds = careerOf(sim.player).termEnds!;
    const r = sim.must<{ answerBy: number }>({ kind: 'career.approach_agency', payload: { agencyId: 'caa' } });
    expect(r.answerBy - sim.now).toBe(APPROACH.answerDays.submission * MS_DAY);
    sim = reload(sim);
    tended(sim, r.answerBy + MS_HOUR);
    const a = approachesOf(sim.player)[0]!;
    expect(a.status).toBe('meeting');
    const meeting = sim.universe.scheduled.find((x) => x.kind === 'career.agency_meeting' && x.status === 'pending')!;
    expect([meeting.requiresPlayer, meeting.locationId]).toEqual([true, 'us-ny-newyork']);
    sim = reload(sim);
    tended(sim, a.meetingAt! + 2 * MS_HOUR);
    const offer = careerOf(sim.player).offers.find((o) => o.agencyId === 'caa')!;
    // In a first contract's first 151 days, with offers coming, they aren't free to leave: it begins when this one ends.
    expect(offer.terms).toMatchObject({ commission: 0.1, years: 1, exclusive: true, effective: termEnds });
    expect(sim.universe.decisions && Object.values(sim.universe.decisions).some((d) => d.refType === 'agency-offer' && !d.resolvedAt)).toBe(true);
    sim = reload(sim);
    sim.must({ kind: 'career.sign', payload: { agencyId: 'caa', cityId: 'us-ny-newyork' } });
    // Two contracts never at once: still Independent Artist Group's, CAA's to follow, no renewal.
    expect(careerOf(sim.player).agencyId).toBe('iag');
    expect(careerOf(sim.player).nextAgency?.agencyId).toBe('caa');
    expect(careerOf(sim.player).renewal?.state).toBe('declined');
    sim = reload(sim);
    tended(sim, termEnds + MS_HOUR);
    const c = careerOf(sim.player);
    expect(c.agencyId).toBe('caa');
    expect(c.signedAt).toBeGreaterThan(signedAt);
    expect(c.nextAgency).toBeUndefined();
    // Left properly: Independent Artist Group isn't an enemy, it takes them back after a year, not two.
    expect(c.ended).toMatchObject({ agencyId: 'iag', left: true, moved: true });
    expect(takesBack(sim, sim.player, 'iag')).toBe(false);
    // No renewal was offered while CAA waited to follow.
    expect(Object.values(sim.universe.decisions).filter((d) => d.refType === 'agency-renewal')).toEqual([]);
    tended(sim, c.ended!.at + 366 * MS_DAY);
    expect(takesBack(sim, sim.player, 'iag')).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('turned down: a pass by the date, and the same agency not again for a year, with the date said', () => {
    const sim = find(55, 'caa', 'passed');
    expect(agencyOutlook(sim, sim.player).find((o) => o.agency.id === 'caa')!.chance).toBe('Out Of Reach');
    const r = sim.must<{ answerBy: number }>({ kind: 'career.approach_agency', payload: { agencyId: 'caa' } });
    tended(sim, r.answerBy + MS_HOUR);
    expect(approachesOf(sim.player)[0]!.status).toBe('passed');
    expect(sim.universe.notifications.some((n) => n.title === 'CAA Passed')).toBe(true);
    expect(sim.execute({ kind: 'career.approach_agency', payload: { agencyId: 'caa' } }).error).toMatch(/^CAA passed on .*: approach them again from /);
    tended(sim, sim.now + (APPROACH.again.passed + 1) * MS_DAY);
    expect(sim.execute({ kind: 'career.approach_agency', payload: { agencyId: 'caa' } }).error).toBeUndefined();
  });

  it('can’t be made an exploit: three open at once, one agency once at a time, a withdrawal waits ninety days, and an introduction needs a friend there', () => {
    const sim = actor('rep-limits', 75);
    const us = AGENCIES.filter((a) => (a.countryId ?? 'us') === 'us').slice(0, 4).map((a) => a.id);
    for (const id of us.slice(0, 3)) sim.must({ kind: 'career.approach_agency', payload: { agencyId: id } });
    expect(sim.execute({ kind: 'career.approach_agency', payload: { agencyId: us[3] } }).error).toBe('3 approaches at once at most: wait for an answer, or withdraw one.');
    expect(sim.execute({ kind: 'career.approach_agency', payload: { agencyId: us[0] } }).error).toMatch(/You’ve approached .*: they answer by /);
    sim.must({ kind: 'career.withdraw_approach', payload: { agencyId: us[0] } });
    expect(sim.execute({ kind: 'career.approach_agency', payload: { agencyId: us[0] } }).error).toMatch(/heard you withdraw on .*: approach them again from /);
    // The withdrawn answer doesn't come.
    tended(sim, sim.now + 30 * MS_DAY);
    expect(approachesOf(sim.player).find((a) => a.agencyId === us[0])!.status).toBe('withdrawn');
    expect(sim.execute({ kind: 'career.approach_agency', payload: { agencyId: us[3], via: 'referral' } }).error).toMatch(/^Nobody close to you is with /);
  });

  it('staying is a choice: an offer declined leaves the agency as it was, and the offer gone', () => {
    let sim = find(88, 'wme', 'offer', 'iag');
    sim.must({ kind: 'career.approach_agency', payload: { agencyId: 'wme' } });
    tended(sim, approachesOf(sim.player)[0]!.answerAt + MS_HOUR);
    tended(sim, approachesOf(sim.player)[0]!.meetingAt! + 2 * MS_HOUR);
    sim = reload(sim);
    const before = JSON.stringify({ a: careerOf(sim.player).agencyId, t: careerOf(sim.player).termEnds });
    sim.must({ kind: 'career.decline_agency', payload: { agencyId: 'wme' } });
    expect(JSON.stringify({ a: careerOf(sim.player).agencyId, t: careerOf(sim.player).termEnds })).toBe(before);
    expect(careerOf(sim.player).offers.some((o) => o.agencyId === 'wme')).toBe(false);
    expect(approachesOf(sim.player)[0]!.status).toBe('declined');
    expect(sim.execute({ kind: 'career.sign', payload: { agencyId: 'wme', cityId: 'us-ny-newyork' } }).error).toBe('That agency hasn’t an offer standing.');
    expect(Object.values(sim.universe.decisions).filter((d) => d.refType === 'agency-offer' && !d.resolvedAt)).toEqual([]);
    expect(sim.execute({ kind: 'career.approach_agency', payload: { agencyId: 'wme' } }).error).toMatch(/^WME was turned down on /);
  });

  it('an offer let lapse is gone at its date, its decision closed', () => {
    const sim = find(88, 'uta', 'offer', 'iag');
    sim.must({ kind: 'career.approach_agency', payload: { agencyId: 'uta' } });
    tended(sim, approachesOf(sim.player)[0]!.answerAt + MS_HOUR);
    tended(sim, approachesOf(sim.player)[0]!.meetingAt! + 2 * MS_HOUR);
    const until = approachesOf(sim.player)[0]!.offerUntil!;
    tended(sim, until + MS_HOUR);
    expect(approachesOf(sim.player)[0]!.status).toBe('lapsed');
    expect(careerOf(sim.player).offers).toEqual([]);
    expect(Object.values(sim.universe.decisions).filter((d) => d.refType === 'agency-offer' && !d.resolvedAt)).toEqual([]);
  });

  it('a meeting missed ends it, costs a little reputation, and the agency waits a year', () => {
    const sim = find(88, 'caa', 'offer', 'iag');
    sim.must({ kind: 'career.approach_agency', payload: { agencyId: 'caa' } });
    tended(sim, approachesOf(sim.player)[0]!.answerAt + MS_HOUR);
    // SETUP: some standing to lose; away in Los Angeles that day.
    attributesOf(sim, sim.player).reputation = 20;
    sim.player.currentLocationId = 'us-ca-losangeles';
    const meetingAt = approachesOf(sim.player)[0]!.meetingAt!;
    tended(sim, meetingAt - 60_000);
    // Across the meeting alone (auditions missed away cost their own).
    const rep = attributesOf(sim, sim.player).reputation;
    sim.advanceTo(meetingAt + 60_000);
    expect(approachesOf(sim.player)[0]!.status).toBe('missed');
    expect(attributesOf(sim, sim.player).reputation).toBeCloseTo(rep + APPROACH.missedMeeting, 6);
    sim.player.currentLocationId = 'us-ny-newyork';
    expect(sim.execute({ kind: 'career.approach_agency', payload: { agencyId: 'caa' } }).error).toMatch(/was stood up on/);
  });
});

describe('moving, and the work it leaves', () => {
  it('free to leave, the move is at once; work offered before keeps its agent’s commission, and work offered unrepresented none', () => {
    const sim = actor('rep-move', 88, 'iag');
    const c = careerOf(sim.player);
    // SETUP: a renewal, out of the first contract's 151 days, with little work: free to leave.
    c.initialTerm = false;
    c.signedAt = sim.now - 400 * MS_DAY;
    const job = (id: string, agentId: string | null): Booking => ({ id, roleId: 'costar', cityId: 'us-ny-newyork', starts: sim.now + 20 * MS_DAY, units: 1, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 5 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0, agentId });
    c.bookings.push(job('withIag', 'iag'));
    expect(representationReview(sim, sim.player)!.mayLeave.ok).toBe(true);
    let found = false;
    for (let n = 0; n < 200 && !found; n += 1) {
      const copy = reload(sim);
      const cc = careerOf(copy.player);
      cc.seq += n;
      const a = { id: `ap${cc.seq + 1}`, agencyId: 'caa', via: 'submission' as const };
      if (answerOf(copy, copy.player, a) !== 'meeting' || !offersAfterMeeting(copy, copy.player, a)) continue;
      found = true;
      copy.must({ kind: 'career.approach_agency', payload: { agencyId: 'caa' } });
      tended(copy, approachesOf(copy.player)[0]!.answerAt + MS_HOUR);
      tended(copy, approachesOf(copy.player)[0]!.meetingAt! + 2 * MS_HOUR);
      const offer = careerOf(copy.player).offers.find((o) => o.agencyId === 'caa')!;
      expect(offer.terms!.effective).toBeLessThanOrEqual(copy.now);
      copy.must({ kind: 'career.sign', payload: { agencyId: 'caa', cityId: 'us-ny-newyork' } });
      const k = careerOf(copy.player);
      expect(k.agencyId).toBe('caa');
      expect(k.ended).toMatchObject({ agencyId: 'iag', moved: true });
      // The job Independent Artist Group got stays its to commission; nothing re-offered or canceled.
      expect(k.bookings.find((b) => b.id === 'withIag')).toMatchObject({ agentId: 'iag', status: 'offered' });
    }
    expect(found).toBe(true);
  });

  it('commission follows the booking: offered unrepresented and paid after signing, no commission; offered represented, the agency’s ten percent', () => {
    const pay = (agentId: string | null | undefined) => {
      const sim = actor('rep-pay', 80);
      const c = careerOf(sim.player);
      const b: Booking = { id: 'p1', roleId: 'costar', cityId: 'us-ny-newyork', starts: sim.now + 10 * MS_DAY, units: 1, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 5 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0, ...(agentId !== undefined ? { agentId } : {}) };
      c.bookings.push(b);
      sim.must({ kind: 'career.accept', payload: { bookingId: 'p1' } });
      // Signed with Gersh after the offer, before the work and the pay.
      represent(sim, sim.player, { agencyId: 'gersh', cityId: 'us-ny-newyork', until: sim.now });
      const calls = sim.universe.scheduled.filter((x) => x.kind === 'career.work' && x.payload.bookingId === 'p1');
      for (const call of calls) { tended(sim, call.at - 60_000); sim.player.awakeSince = sim.now; sim.advanceTo(call.at + 60_000); }
      tended(sim, sim.now + 21 * MS_DAY);
      const acct = sim.nominalAccount('expense', 'Agent Commission').id;
      return sim.universe.transactions.flatMap((t) => t.postings).filter((x) => x.accountId === acct).reduce((n, x) => n + x.amount, 0);
    };
    expect(pay(null)).toBe(0);
    expect(pay('iag')).toBeGreaterThan(0);
    // A booking from a save before this, with no agent kept, is commissioned as it was: by the agency of the day.
    expect(pay(undefined)).toBe(pay('iag'));
  });
});

describe('the choice matters, and isn’t only upward', () => {
  it('years with Independent Artist Group: CAA can now be approached, and its attention to a client below its roster is less than IAG’s', () => {
    const sim = actor('rep-iag', 72, 'iag');
    // SETUP: decades on with the same agency, as the replay's New York life.
    careerOf(sim.player).signedAt = sim.now - 30 * 365 * MS_DAY;
    careerOf(sim.player).initialTerm = false;
    const caa = agencyOutlook(sim, sim.player).find((o) => o.agency.id === 'caa')!;
    expect(caa.refusal).toBeUndefined();
    const score = standing(sim, sim.player);
    const iag = AGENCIES.find((a) => a.id === 'iag')!;
    const big = AGENCIES.find((a) => a.id === 'caa')!;
    expect(rosterFit(score, big)).toBeLessThan(rosterFit(score, iag));
    // Weeks of auditions sent by each, from the same standing: CAA's reach is wider, its attention to them less.
    const sent = (agency: typeof iag) => Array.from({ length: 200 }, (_, w) => weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, agency, 'us-ny-newyork', 0).length).reduce((a, b) => a + b, 0) / 200;
    expect(Math.abs(sent(big) - sent(iag))).toBeLessThan(big.auditionsPerWeek);
    expect(sent(big) / big.auditionsPerWeek).toBeLessThan(sent(iag) / iag.auditionsPerWeek);
  });
});

describe('a save from before', () => {
  it('without approaches or a booking’s agent loads, and approaches from nothing', () => {
    const sim = actor('rep-old', 80, 'iag');
    const raw = JSON.parse(serialise(sim.universe));
    for (const p of Object.values(raw.people) as { career?: { approaches?: unknown; nextAgency?: unknown } }[]) if (p.career) { delete p.career.approaches; delete p.career.nextAgency; }
    const old = loadSave(deserialise(JSON.stringify(raw)) as never);
    expect(old.execute({ kind: 'career.approach_agency', payload: { agencyId: 'caa' } }).ok).toBe(true);
    expect(breaches(old.universe)).toEqual([]);
  });
});
