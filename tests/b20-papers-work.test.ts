/**
 * Brief 20's papers area, B1 and B3 for permission to work (docs/verification/audit-2026-10-21/criteria.md): two lives
 * alike in everything but where they were born, which creation reads for their citizenship. Ada Cole born in New York is
 * a US citizen; born in London she's British, at Yale on an F-1. The same seed, the same choices, the same clock and the
 * same offers of work, accepted through the command the Opportunities tab sends (`pro.accept_offer`), and the School's
 * own work-study through Take A Shift (`school.take_shift`).
 *
 * What the papers should change (the relevant side, asserted with its words and its figures): an F-1 student may work
 * only on campus, so outside work is refused her at acceptance while she's a student, in the recess as in term
 * (8 CFR 214.2(f)(9)(i), `usWorkAuthorized`); after the degree nothing is open to her until OPT, applied for from the
 * question Your US Status Is Ending raises at the program's end, is approved on its day; OPT opens outside work, counts
 * its days, and once it ends for days without work it closes again, and her status with it.
 *
 * What they mustn't change (the no-leak side, asserted equal): the roles posted to each, the School's work-study shift,
 * and, for the citizen, anything at all: her papers, her questions and her notices stay as they began.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), at Yale in New Haven from Monday 24 August 2026,
 * played by the clock (`advanceTo`) and the commands the screens send. Saved and opened (`loadSave` of its JSON) between
 * OPT's approval and its end, against the same life played straight through.
 *
 * TEST SETUP, said where it's done: the body kept fed, rested and awake as the clock moves (`tended`); an offer standing
 * for the same role on the same days in each life (`offered`), as casting's draw writes one, since which roles casting
 * offers is the draw's and is tested apart from the papers (tests/pro-work.test.ts, J5); a graduate made by the School's
 * own evaluation and Commencement handlers with Commencement brought forward to 3 September 2026, as
 * tests/fakes/career-work.ts makes one, and the F-1's program end moved to 1 October 2026 with its sixty days' grace
 * (a life's own runs to 31 May 2029), so OPT is played in months. None of it sets what's under test: acceptance, the
 * question, the fee, OPT's decision, its weeks and its end are the game's.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { answerStop } from '@/engine/world/clock';
import { COMMENCEMENT_KIND, EVALUATION_KIND } from '@/engine/systems/school';
import { documentsOf } from '@/engine/systems/documents';
import { businessDaysOn, f1Of, programEnd } from '@/engine/systems/permission';
import { datesOf, inSessionAt, payTermsOf, projectOf } from '@/engine/systems/projobs';
import { ensurePro, type Opportunity } from '@/engine/systems/pro';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const LONDON: Partial<NewSaveConfig> = { homeRegionId: 'uk-eng-london' };
const life = (seed: string, more: Partial<NewSaveConfig> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...more });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const papersNotices = (sim: Simulation) => sim.universe.notifications.filter((n) => n.route === '/workspace/papers').map((n) => `${n.at} ${n.title}`);

/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

/**
 * Played as a player plays it from the top bar: the clock moved six hours at a time, stopping at every commitment that
 * wants the player, and Go pressed at each (`answerStop`, the stop's own rule), as tests/pro-work.test.ts plays the work.
 * TEST SETUP: tended as it moves.
 */
function played(sim: Simulation, until: number): void {
  const tend = () => {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
  };
  while (sim.now < until) {
    tend();
    const wanted = Math.min(until, sim.now + 6 * MS_HOUR);
    let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    for (let n = 0; r.interruptedBy && n < 50; n += 1) {
      tend();
      r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!;
    }
  }
}

/**
 * TEST SETUP: an offer standing for a role, posted at noon on a day, as casting's draw writes one after the last round:
 * its days are the project's own (`datesOf`), its pay the rate's (`payTermsOf`), open three days.
 */
function offered(sim: Simulation, projectId: string, postedAt: number): Opportunity {
  const t = projectOf({ projectId });
  const terms = payTermsOf({ projectId, postedAt });
  const o: Opportunity = {
    id: sim.nextId('pro'), projectId, via: 'open', status: 'offered', postedAt, submitBy: postedAt + 7 * MS_DAY, history: [], counts: {},
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units },
  };
  ensurePro(sim, sim.player).opportunities.push(o);
  return o;
}

const accept = (sim: Simulation, o: Opportunity) => sim.execute<{ engagementId: string; days: number }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
const engagementOf = (sim: Simulation, o: Opportunity) => sim.player.pro!.engagements.find((e) => e.opportunityId === o.id);
const firstDay = (o: Opportunity) => formatDate(datesOf(o)[0]!.from, NY);
const NONE = 'There’s no permission to work in the US among your papers. Papers, under Permission To Work, shows what you hold.';

/**
 * TEST SETUP: a graduate of the class of 2029 by the School's own evaluation and Commencement handlers, Commencement
 * brought forward to 3 September 2026; an F-1's program end moved first to 1 October 2026, sixty days' grace after it.
 */
function graduate(seed: string, more: Partial<NewSaveConfig> = {}): Simulation {
  const sim = life(seed, more);
  tended(sim, at(2026, 9, 1, 18));
  const f1 = f1Of(sim.player);
  if (f1) f1.expiresAt = at(2026, 10, 1, 12) + 60 * MS_DAY;
  const school = sim.player.school!;
  Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } } as never;
  sim.schedule({ at: sim.now + 60_000, kind: EVALUATION_KIND, label: 'Spring Term 2029 Evaluation', category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, term: 5 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  const booked = sim.universe.scheduled.filter((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending');
  sim.timeline.cancel(booked[0]!.id, sim.now);
  sim.schedule({ at: at(2026, 9, 3, 10), kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 32, durationMinutes: 180, payload: booked[0]!.payload });
  tended(sim, at(2026, 9, 3, 13));
  expect(sim.player.school!.standing).toBe('graduated');
  return sim;
}

describe('B1: permission to work, a citizen against an F-1 student, at school', () => {
  it('PLAYER JOURNEY: the same offer of two days’ outside work in the winter recess is taken by the citizen and refused the F-1 student in the game’s words, nothing changed; the School books both the same work-study shift, and the same roles are posted to both', () => {
    const us = life('b20-papers-work');
    const f1 = life('b20-papers-work', LONDON);
    expect([us.player.citizenshipId, f1.player.citizenshipId]).toEqual(['us', 'uk']);
    expect(f1Of(us.player)).toBeUndefined();
    expect(f1Of(f1.player)?.status).toBe('valid');
    for (const sim of [us, f1]) tended(sim, at(2026, 11, 16, 10));

    // No leak: the roles posted are the same, project, moment and way, whatever the papers say.
    const posted = (sim: Simulation) => sim.player.pro!.opportunities.map((o) => [o.projectId, o.postedAt, o.via, o.submitBy]);
    expect(posted(us).length).toBeGreaterThan(3);
    expect(posted(f1)).toEqual(posted(us));

    // No leak: the School's work-study is on-campus work, the F-1's to take as the citizen's, the same evening.
    const shiftUs = us.must<{ at: number; hours: number }>({ kind: 'school.take_shift', payload: {} });
    const shiftF1 = f1.must<{ at: number; hours: number }>({ kind: 'school.take_shift', payload: {} });
    expect(shiftF1).toEqual(shiftUs);
    expect(shiftUs.hours).toBe(4);

    // The same offer in each: a non-union short's two days, Monday 21 and Tuesday 22 December, out of term.
    const ou = offered(us, 'eastview', at(2026, 11, 16, 12));
    const of = offered(f1, 'eastview', at(2026, 11, 16, 12));
    expect(datesOf(of)).toEqual(datesOf(ou));
    expect(firstDay(ou)).toBe('December 21, 2026');
    expect(datesOf(ou).some((d) => inSessionAt(us.player, d.from))).toBe(false);

    // The relevant side: the citizen takes it, booked with both days on her calendar.
    const took = accept(us, ou);
    expect(took.ok).toBe(true);
    expect(took.value!.days).toBe(2);
    expect(ou.status).toBe('booked');
    expect(engagementOf(us, ou)!.days.map((d) => d.from)).toEqual(datesOf(ou).map((d) => d.from));

    // The F-1 student is refused at acceptance, in words that say why and which day, and nothing changes.
    const before = serialise(f1.universe);
    const refused = accept(f1, of);
    expect(refused.ok).toBe(false);
    expect(refused.error).toBe('Your F-1 lets you work only on campus while you’re a student, so you can’t work for an employer outside the School. That rules out work on December 21, 2026.');
    expect(serialise(f1.universe)).toBe(before);
    expect(of.status).toBe('offered');
    expect(engagementOf(f1, of)).toBeUndefined();
  }, 60_000);
});

describe('B1 and B3: after the degree, OPT opens and closes outside work, through the clock', () => {
  it('PLAYER JOURNEY: refused before OPT, asked at the program’s end, approved on its thirtieth federal workday and open from then, closed again by its days without work with her status, once each across a save and a load; the citizen takes every offer and her papers never move', () => {
    const us = graduate('b20-papers-opt');
    const f1 = graduate('b20-papers-opt', LONDON);
    expect(programEnd(f1.player)).toBe(at(2026, 10, 1, 12));
    const usPapers = JSON.stringify(us.player.documents);

    // Before OPT: the same offer, two days in October, taken by the citizen and refused the graduate on an F-1.
    played(us, at(2026, 9, 7, 12));
    played(f1, at(2026, 9, 7, 12));
    const octUs = offered(us, 'eastview', at(2026, 9, 7, 12));
    const octF1 = offered(f1, 'eastview', at(2026, 9, 7, 12));
    expect(firstDay(octUs)).toBe('October 12, 2026');
    expect(accept(us, octUs).ok).toBe(true);
    expect(accept(f1, octF1).error).toBe(`${NONE} That rules out work on October 12, 2026.`);

    // The program's end is said at its hour, with what follows and the way to OPT; the citizen is asked nothing.
    played(us, at(2026, 10, 1, 13));
    played(f1, at(2026, 10, 1, 13));
    const asked = Object.values(f1.universe.decisions).filter((d) => d.refType === 'us-status');
    expect(asked).toHaveLength(1);
    const q = asked[0]!;
    expect(q.title).toBe('Your US Status Is Ending');
    // Sixty days of hours from noon on 1 October, eleven in the morning once the clocks have gone back.
    expect(q.dueAt).toBe(at(2026, 10, 1, 12) + 60 * MS_DAY);
    expect(q.dueAt).toBe(at(2026, 11, 30, 11));
    expect(q.detail).toBe('Your permission to work in the United States has ended, and your status ends November 30, 2026. You can still apply for OPT before then. If you’re still here after that, you’ll be out of status. In the game, that means you can’t work here, your US visa is canceled, and the Visa Waiver Program is closed to you from then on.');
    expect(q.actions.map((a) => a.label)).toEqual(['Apply For OPT', 'Apply For OPT, Premium Processing']);
    expect(q.route).toBe('/workspace/papers');
    expect(Object.values(us.universe.decisions).filter((d) => d.refType === 'us-status')).toEqual([]);

    // Premium processing pressed on Home: $470 and $1,780 leave her bank, once, and the question is settled.
    const applied = f1.now;
    const balance = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const was = balance(f1);
    expect(f1.must<{ ok: boolean }>({ kind: 'world.take_decision_action', payload: { decisionId: q.id, actionIndex: 1 } }).ok).toBe(true);
    expect(was - balance(f1)).toBe(2_250_00);
    expect(f1.universe.transactions.filter((t) => t.memo === 'Form I-765, (c)(3)(B), OPT, premium processing')).toHaveLength(1);
    expect(q.resolvedAt).toBe(applied);
    const opt = documentsOf(f1.player).find((d) => d.kind === 'permit' && d.name.includes('OPT'))!;
    expect(opt.status).toBe('pending');
    // Thirty days the Federal Government is open: Monday 16 November, Columbus Day and Veterans Day not counted.
    const decides = businessDaysOn(applied, 30, true);
    expect(formatDate(decides, NY)).toBe('November 16, 2026');

    // Pending, it opens nothing yet: an offer for 9 November is refused her as before.
    played(f1, at(2026, 10, 5, 12));
    const pending = offered(f1, 'eastview', at(2026, 10, 5, 12));
    expect(accept(f1, pending).error).toBe(`${NONE} That rules out work on November 9, 2026.`);

    // Decided on its day: approved, said, in force from that day for twelve months.
    played(f1, decides - MS_HOUR);
    expect(opt.status).toBe('pending');
    played(f1, decides + MS_HOUR);
    expect(opt.status).toBe('valid');
    expect(opt.issuedAt).toBe(decides);
    expect(titled(f1, 'OPT Approved').map((n) => n.body)).toEqual(['You may work in the United States from November 16, 2026 to November 16, 2027. Each day of professional work you’re booked for counts as a day worked, and OPT ends once you’ve had more than 90 days without work in total.']);

    // On OPT the same offer is hers to take, as it's the citizen's: two days in December, booked on OPT.
    played(us, at(2026, 11, 16, 15));
    played(f1, at(2026, 11, 16, 15));
    const decUs = offered(us, 'eastview', at(2026, 11, 16, 15));
    const decF1 = offered(f1, 'eastview', at(2026, 11, 16, 15));
    expect(firstDay(decF1)).toBe('December 21, 2026');
    expect(accept(us, decUs).ok).toBe(true);
    expect(accept(f1, decF1).ok).toBe(true);
    expect(engagementOf(f1, decF1)!.days).toHaveLength(2);

    // Saved and opened here, against the same life played straight through to March.
    const opened = reload(f1);
    for (const sim of [us, f1, opened]) played(sim, at(2027, 3, 1, 12));
    const optOf = (sim: Simulation) => documentsOf(sim.player).find((d) => d.kind === 'permit' && d.name.includes('OPT'))!;
    for (const sim of [f1, opened]) {
      const o = optOf(sim);
      // Its two days of work worked and counted, its days without work past ninety: ended, and her status with it, said
      // once each.
      expect(sim.player.pro!.engagements.find((e) => e.days[0]!.from === datesOf(decF1)[0]!.from)!.status).not.toBe('canceled');
      expect(o.workedDays).toBe(2);
      expect(o.idleDays).toBeGreaterThan(90);
      expect(o.status).toBe('cancelled');
      expect(titled(sim, 'OPT Ended')).toHaveLength(1);
      expect(titled(sim, 'Out Of Status')).toHaveLength(1);
      for (const title of ['OPT Approved', 'OPT Ended', 'Out Of Status']) expect(titled(sim, title)[0]!.route).toBe('/workspace/papers');
      expect(sim.player.usOutOfStatus).toBe(o.endedAt);
      expect(f1Of(sim.player)!.status).toBe('cancelled');
    }
    // Counted each Monday from 16 November: thirteen weeks are 91 days less the two worked, 89, and the fourteenth week's
    // count passes ninety, so it ended on Monday 22 February, played straight or saved and opened; the same notices.
    expect(optOf(f1).idleDays).toBe(96);
    expect(formatDate(optOf(f1).endedAt!, NY)).toBe('February 22, 2027');
    expect(optOf(opened).endedAt).toBe(optOf(f1).endedAt);
    expect(papersNotices(opened)).toEqual(papersNotices(f1));

    // Closed again: an offer for April is refused her, and the citizen takes it.
    const aprUs = offered(us, 'eastview', at(2027, 3, 1, 12));
    const aprF1 = offered(f1, 'eastview', at(2027, 3, 1, 12));
    expect(firstDay(aprF1)).toBe('April 5, 2027');
    expect(accept(f1, aprF1).error).toBe(`${NONE} That rules out work on April 5, 2027.`);
    expect(accept(us, aprUs).ok).toBe(true);

    // No leak: the citizen's papers are as they began, and nothing of the F-1's reached her.
    expect(JSON.stringify(us.player.documents)).toBe(usPapers);
    expect(Object.values(us.universe.decisions).filter((d) => d.refType === 'us-status')).toEqual([]);
    for (const title of ['OPT Approved', 'OPT Ended', 'Out Of Status']) expect(titled(us, title)).toEqual([]);
    expect(us.player.usOutOfStatus).toBeUndefined();
  }, 90_000);
});
