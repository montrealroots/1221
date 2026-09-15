/**
 * SLATE — the reimbursement on the family's own pictures.
 *
 * The lot has weighed Iceland's production reimbursement since the day it was
 * built, for productions enquiring from abroad. The family's own pictures, made
 * by an Icelandic company on Icelandic stages, claimed nothing at all. These
 * hold the claim, in the order the things in it matter:
 *
 * The deadline. An application closes on the first day of photography and never
 * reopens, so a producer who forgot has forgone a quarter of the negative and
 * the game says so plainly.
 *
 * What was spent here, which is not what was spent. Flights are bought abroad,
 * a share of an imported fee is paid where the person lives, a penalty is not
 * spend at all, and part of any negative is bought outside the country whatever
 * anybody decides. Every one of those comes off the certificate.
 *
 * And the cliff. The higher rate has four conditions under it and one of them
 * is a question about how many people the picture actually employs — which the
 * crew content has declared since it was written and nothing had ever counted.
 */

import { describe, expect, it } from 'vitest';
import { deliverIt, openTheBooks, openTheDoors } from './doors';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { companyCash, projectsOf } from '@/engine/world/company';
import { MS_WEEK } from '@/engine/world/lot';
import { REBATE } from '@/engine/content/incorporation';
import { LIMB_LABELS, REFUSALS, THE_CLAIM, shortOn } from '@/engine/content/rebate';
import { CROWD_RUNS, DEPARTMENTS, FULLY_STAFFED_AT, POSTS } from '@/engine/content/crew';
import { crewDaysOf, crowdIn, headcountOf, postsFor } from '@/engine/world/crew';
import { whereFromById } from '@/engine/content/casting';
import { performerNew } from '@/engine/world/casting';
import {
  applyForRebate, armTheClaim, auditorsFee, awayOnTheCast, certifiable, inKrona,
  limbsOf, payTheClaim, rateFor, shortOnFor, turnsOverOn, whereTheClaimStands,
  whyNot, worthToday,
} from '@/engine/world/rebate';

interface Done { ok: boolean; id?: string; error?: string }

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

const world = (seed = 'rebate'): Simulation => {
  const sim = quickSave({}, seed);
  openTheDoors(sim);
  openTheBooks(sim);
  return sim;
};

/** Puts a title on the slate and greenlights it. */
function makeIt(sim: Simulation, title = 'Hvítserkur', over: Record<string, unknown> = {}): string {
  run(sim, 'company.develop', { title, medium: 'film' });
  const id = projectsOf(sim.universe).find((one) => one.title === title)!.id;
  const done = run(sim, 'company.greenlight', {
    projectId: id, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 8, ...over,
  });
  expect(done.error).toBeUndefined();
  return id;
}

const projectIn = (sim: Simulation, id: string) => sim.universe.projects[id]!;

/**
 * Casts somebody from a named place into the first free part, and hands back
 * the fee they took.
 *
 * Whether an offer is taken is a draw keyed on the picture, the part and the
 * person, so this plants a fresh person on each attempt until one says yes.
 * Trying the same person twice would draw the same number forever.
 */
function castFrom(sim: Simulation, projectId: string, where: string): { personId: string; feeCents: number } {
  const project = projectIn(sim, projectId);
  const free = project.roles!.find((role) => !(project.cast ?? []).some((s) => s.roleId === role.id))!;
  const next = sim.rng('planting', where, free.id).next;
  for (let i = 0; i < 40; i += 1) {
    const person = performerNew(sim, 55, () => next(), whereFromById(where)!);
    const fee = Math.round(free.bandCents * 1.2);
    run(sim, 'company.cast', { projectId, roleId: free.id, personId: person.id, feeCents: fee });
    if ((projectIn(sim, projectId).cast ?? []).some((s) => s.personId === person.id)) {
      return { personId: person.id, feeCents: fee };
    }
  }
  throw new Error(`nobody from ${where} would take the part`);
}

// ---------------------------------------------------------------------------

describe('how many people are actually on a picture', () => {
  it('counts more than the posts, because a head is not a department', () => {
    const named = postsFor(20_000_000_00).length;
    expect(named).toBe(POSTS.length);
    expect(headcountOf(20_000_000_00)).toBeGreaterThan(named);
  });

  it('puts the head on first, and the crowd behind them only as the money climbs', () => {
    // Set decoration is one post and the post is expensive, so the department's
    // whole shape is visible in three budgets. Below its floor there is nobody
    // in it at all. At its floor there is a set decorator and nobody behind
    // them, which is what a small picture actually looks like. Well above it,
    // there is a department.
    expect(postsFor(1_199_000_00).some((post) => post.department === 'setdec')).toBe(false);
    expect(crowdIn('setdec', 1_199_000_00)).toBe(0);

    expect(postsFor(1_201_000_00).some((post) => post.department === 'setdec')).toBe(true);
    expect(crowdIn('setdec', 1_201_000_00)).toBe(0);

    expect(crowdIn('setdec', 8_000_000_00)).toBeGreaterThan(0);
    expect(crowdIn('setdec', FULLY_STAFFED_AT))
      .toBe(DEPARTMENTS.find((one) => one.id === 'setdec')!.crowd);
  });

  it('scales the crowd with the money, and a bigger picture employs more people', () => {
    expect(headcountOf(6_000_000_00)).toBeGreaterThan(headcountOf(3_000_000_00));
    expect(headcountOf(3_000_000_00)).toBeGreaterThan(headcountOf(1_000_000_00));
  });

  it('stops at fully staffed, because a bigger picture adds units and not bodies', () => {
    const full = headcountOf(FULLY_STAFFED_AT);
    expect(headcountOf(FULLY_STAFFED_AT * 10)).toBe(full);
    expect(full).toBe(POSTS.length + DEPARTMENTS.reduce((n, one) => n + one.crowd, 0));
  });

  it('puts the crowd on for the shoot and a week either side, and nothing like the accountant', () => {
    expect(crewDaysOf(8)).toBe((8 + CROWD_RUNS * 2) * 5);
    expect(crewDaysOf(8)).toBeGreaterThan(crewDaysOf(6));
  });
});

describe('what an auditor would certify', () => {
  it('certifies less than the picture has spent, because part of a negative is bought abroad', () => {
    const sim = world();
    const id = makeIt(sim);
    const project = projectIn(sim, id);
    sim.advanceTo(sim.now + 20 * MS_WEEK);
    expect(project.spentCents).toBeGreaterThan(0);
    expect(certifiable(sim, project)).toBeLessThan(project.spentCents);
  });

  it('never goes below nothing, however little has gone out', () => {
    const sim = world();
    const project = projectIn(sim, makeIt(sim));
    expect(certifiable(sim, project)).toBe(0);
  });

  it('keeps the flights and the fee apart, and counts each of them once', () => {
    const sim = world();
    const id = makeIt(sim);
    const here = castFrom(sim, id, 'here');
    const project = projectIn(sim, id);
    const localOnly = awayOnTheCast(sim, project);
    expect(localOnly).toBe(0);

    const away = castFrom(sim, id, 'uk');
    const both = awayOnTheCast(sim, projectIn(sim, id));
    const person = sim.universe.people[away.personId]!;
    const uk = whereFromById('uk')!;
    // The fee and only the fee. The flights are recorded against the picture as
    // they leave the country, so counting them here as well would take them off
    // the certificate twice.
    expect(both).toBe(Math.round(away.feeCents * THE_CLAIM.awayOfAFee));
    expect(projectIn(sim, id).notSpentHereCents)
      .toBe(Math.round(away.feeCents * uk.travel));
    expect(person.homeRegionId).toBe(uk.cityId);
    expect(here.feeCents).toBeGreaterThan(0);
  });

  it('certifies less the moment a part is filled from abroad, and exactly less', () => {
    const sim = world();
    const id = makeIt(sim, 'Askja');
    const project = projectIn(sim, id);
    // Stood at what a picture has spent by the middle of its shoot. Set here
    // instead of advanced to, because advancing also lets the office fill the
    // parts nobody cast, and then two things have moved and neither can be
    // read off the other.
    project.spentCents = 14_000_000_00;

    const wasLocal = certifiable(sim, project);
    const spentWas = project.spentCents;
    const here = castFrom(sim, id, 'here');
    // Somebody who lives here costs the certificate nothing at all: whatever
    // went out over the band went out in Iceland and is certified with the rest.
    expect(certifiable(sim, project)).toBe(wasLocal + (project.spentCents - spentWas));
    expect(here.feeCents).toBeGreaterThan(0);

    const before = certifiable(sim, project);
    const spentBefore = project.spentCents;
    const away = castFrom(sim, id, 'uk');
    const rose = project.spentCents - spentBefore;
    const travel = Math.round(away.feeCents * whereFromById('uk')!.travel);
    expect(travel).toBeGreaterThan(0);
    expect(certifiable(sim, project)).toBe(
      before + rose - travel - Math.round(away.feeCents * THE_CLAIM.awayOfAFee),
    );
    expect(certifiable(sim, project)).toBeLessThan(before + rose);
  });

  it('certifies none of a penalty, because a penalty is money gone and not spend', () => {
    const sim = world();
    const id = makeIt(sim);
    const project = projectIn(sim, id);
    expect(deliverIt(sim, id)).toBe(true);
    const fined = project.notSpentHereCents ?? 0;
    // A picture that delivered on the date is not fined, and one that ran late
    // is. Either way the two figures have to agree with each other.
    expect(certifiable(sim, project)).toBe(Math.max(0,
      project.spentCents - fined - awayOnTheCast(sim, project)
      - Math.round((project.budgetCents ?? 0) * THE_CLAIM.leaks)));
  });
});

describe('which of the two rates', () => {
  it('gives the higher rate to a picture that reaches all four conditions', () => {
    const sim = world();
    const project = projectIn(sim, makeIt(sim, 'Dettifoss', { shootWeeks: 8 }));
    expect(shortOnFor(sim, project, 'plan')).toEqual([]);
    expect(rateFor(sim, project, 'plan')).toBe(REBATE.higherShare);
  });

  it('drops to the lower rate when the crew is not on it for fifty days', () => {
    const sim = world();
    const project = projectIn(sim, makeIt(sim, 'Skógafoss', { shootWeeks: 6 }));
    expect(shortOnFor(sim, project, 'plan')).toEqual(['crewDays']);
    expect(rateFor(sim, project, 'plan')).toBe(REBATE.share);
  });

  it('drops to the lower rate when the picture does not employ fifty people', () => {
    const sim = world();
    const project = projectIn(sim, makeIt(sim, 'Reynisdrangar', {
      budgetCents: 3_000_000_00, shootWeeks: 8,
    }));
    expect(shortOnFor(sim, project, 'plan')).toEqual(['crew']);
    expect(rateFor(sim, project, 'plan')).toBe(REBATE.share);
  });

  it('names every condition a picture is short on, and not only the first', () => {
    const short = shortOn(
      { spendIsk: 1, workingDays: 1, shootingDays: 1, crew: 1, crewDays: 1 },
      REBATE.higherNeeds,
    );
    expect(short).toEqual(['spendIsk', 'workingDays', 'shootingDays', 'crew', 'crewDays']);
    expect(short.every((one) => LIMB_LABELS[one].length > 0)).toBe(true);
  });

  it('weighs the plan on what the picture was greenlit for and the books on what went out', () => {
    const sim = world();
    const id = makeIt(sim);
    const project = projectIn(sim, id);
    const planned = limbsOf(sim, project, 'plan');
    const books = limbsOf(sim, project, 'books');
    expect(planned.spendIsk).toBeGreaterThan(0);
    expect(books.spendIsk).toBe(0);
    expect(inKrona(100_00)).toBe(inKrona(100_00));
    expect(planned.crew).toBe(headcountOf(project.budgetCents ?? 0));
  });
});

describe('applying, which closes on the first day of photography', () => {
  it('takes an application before the camera turns over, and stamps the rate on it', () => {
    const sim = world();
    const id = makeIt(sim);
    const done = sim.execute<{ ok: boolean; shareAt?: number; error?: string }>(
      { kind: 'company.claim_rebate', payload: { projectId: id } },
    ).value!;
    expect(done.error).toBeUndefined();
    expect(done.shareAt).toBe(REBATE.higherShare);
    expect(projectIn(sim, id).rebate?.shareAt).toBe(REBATE.higherShare);
    expect(projectIn(sim, id).rebate?.appliedAt).toBe(sim.now);
  });

  it('closes on the first day of photography and not on the first day of prep', () => {
    const sim = world();
    const project = projectIn(sim, makeIt(sim));
    const shot = project.periods!.find((one) => one.id === 'shooting')!;
    expect(turnsOverOn(project)).toBe(shot.from);
    // Weeks of prep sit in front of it, and every one of them is still time to
    // apply. A deadline at the first date on the schedule would take them away.
    expect(turnsOverOn(project)!).toBeGreaterThan(project.periods![0]!.from);
  });

  it('refuses once the camera has turned over, and the money is simply gone', () => {
    const sim = world();
    const id = makeIt(sim);
    sim.advanceTo(turnsOverOn(projectIn(sim, id))! + MS_DAY);
    expect(whyNot(sim, projectIn(sim, id))).toBe('too-late');
    const done = applyForRebate(sim, id);
    expect(done.ok).toBe(false);
    expect(projectIn(sim, id).rebate).toBeUndefined();
    expect(whereTheClaimStands(sim, projectIn(sim, id))).toContain('never applied');
  });

  it('refuses a second application', () => {
    const sim = world();
    const id = makeIt(sim);
    expect(applyForRebate(sim, id).ok).toBe(true);
    expect(whyNot(sim, projectIn(sim, id))).toBe('already');
  });

  it('refuses a picture with no dates on it', () => {
    const sim = world();
    run(sim, 'company.develop', { title: 'Nothing Yet', medium: 'film' });
    const id = projectsOf(sim.universe).find((one) => one.title === 'Nothing Yet')!.id;
    expect(whyNot(sim, projectIn(sim, id))).toBe('no-dates');
  });

  it('refuses through a shut door, because the claim is audited', () => {
    const sim = quickSave({}, 'shut');
    openTheDoors(sim);
    const id = makeIt(sim);
    expect(whyNot(sim, projectIn(sim, id))).toBe('no-books');
    openTheBooks(sim);
    expect(whyNot(sim, projectIn(sim, id))).toBeUndefined();
  });

  it('refuses a shoot that starts after the scheme has ended in law', () => {
    const sim = world();
    const after = Date.UTC(REBATE.endsOn.year + 1, 5, 1);
    const id = makeIt(sim, 'Too Late For The Law', { from: after });
    expect(turnsOverOn(projectIn(sim, id))!).toBeGreaterThan(Date.UTC(REBATE.endsOn.year, 11, 31));
    expect(whyNot(sim, projectIn(sim, id))).toBe('scheme-ended');
  });

  it('says every refusal in the world’s own words', () => {
    expect(REFUSALS.map((one) => one.id).sort())
      .toEqual(['already', 'no-books', 'no-dates', 'scheme-ended', 'too-late']);
    for (const refusal of REFUSALS) expect(refusal.said.endsWith('.')).toBe(true);
  });

  it('charges the office for preparing the file, and it is on the picture', () => {
    const sim = world();
    const id = makeIt(sim);
    const before = projectIn(sim, id).spentCents;
    const cash = companyCash(sim.universe);
    expect(applyForRebate(sim, id).ok).toBe(true);
    // Both halves. The counter on the picture says what the picture cost, and
    // the account says the money actually went — and a version that moved one
    // without the other would look right from whichever side you looked.
    expect(projectIn(sim, id).spentCents).toBe(before + THE_CLAIM.filingCents);
    expect(companyCash(sim.universe)).toBe(cash - THE_CLAIM.filingCents);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('does not revise the rate afterwards, however the picture turns out', () => {
    const sim = world();
    const id = makeIt(sim, 'Stamped', { shootWeeks: 8 });
    expect(applyForRebate(sim, id).ok).toBe(true);
    const project = projectIn(sim, id);
    expect(project.rebate!.shareAt).toBe(REBATE.higherShare);
    // The picture shrinks to something that would never have qualified.
    project.budgetCents = 500_000_00;
    expect(rateFor(sim, project, 'plan')).toBe(REBATE.share);
    expect(project.rebate!.shareAt).toBe(REBATE.higherShare);
    expect(worthToday(sim, project)).toBe(Math.round(certifiable(sim, project) * REBATE.higherShare));
  });
});

describe('being paid, months after the picture is finished', () => {
  it('lands after delivery, pays the auditor and takes the state’s money in', () => {
    const sim = world();
    const id = makeIt(sim);
    expect(applyForRebate(sim, id).ok).toBe(true);
    expect(deliverIt(sim, id)).toBe(true);

    const project = projectIn(sim, id);
    expect(project.rebate!.paidAt).toBeUndefined();
    const spentBefore = project.spentCents;
    sim.advanceTo(sim.now + 30 * MS_WEEK);

    const claim = projectIn(sim, id).rebate!;
    expect(claim.paidAt).toBeDefined();
    expect(claim.certifiedCents).toBeGreaterThan(0);
    expect(claim.paidCents).toBe(Math.round(claim.certifiedCents! * claim.shareAt));
    // The certificate is paid for by the production, on the day it is issued,
    // and it goes on the picture like everything else the picture bought.
    expect(project.spentCents).toBe(spentBefore + auditorsFee(claim.certifiedCents!));
    expect(sim.ledger.audit()).toEqual([]);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
  });

  it('does not land early, because the state pays months after the fact', () => {
    const sim = world();
    const id = makeIt(sim);
    expect(applyForRebate(sim, id).ok).toBe(true);
    expect(deliverIt(sim, id)).toBe(true);
    // Half the wait. A picture whose money arrived the week after delivery
    // would be a grant and not a reimbursement, and the six-month gap is the
    // whole reason productions borrow against these in the real business.
    sim.advanceTo(sim.now + Math.round(REBATE.paidAfterMonths * 4.345 * MS_WEEK / 2));
    expect(projectIn(sim, id).rebate!.paidAt).toBeUndefined();
    sim.advanceTo(sim.now + 20 * MS_WEEK);
    expect(projectIn(sim, id).rebate!.paidAt).toBeDefined();
  });

  it('pays nothing at all to a picture that never applied', () => {
    const sim = world();
    const id = makeIt(sim);
    expect(deliverIt(sim, id)).toBe(true);
    sim.advanceTo(sim.now + 30 * MS_WEEK);
    expect(projectIn(sim, id).rebate).toBeUndefined();
    expect(sim.universe.scheduled.some((one) => one.kind === 'project.rebate')).toBe(false);
  });

  it('puts the auditor on a floor, so a very small claim is barely worth making', () => {
    expect(auditorsFee(0)).toBe(THE_CLAIM.auditFloorCents);
    expect(auditorsFee(1_000_000_00)).toBe(Math.round(1_000_000_00 * THE_CLAIM.auditedAt));
    expect(auditorsFee(1_000_000_00)).toBeGreaterThan(THE_CLAIM.auditFloorCents);
  });

  it('pays at the rate it was stamped at, and not at the one the books would give', () => {
    const sim = world();
    // Seven shooting weeks puts the crowd on it for forty-five days, five short
    // of what the higher rate wants, so this goes in at the lower one.
    const id = makeIt(sim, 'Ran Over', { shootWeeks: 7 });
    expect(shortOnFor(sim, projectIn(sim, id), 'plan')).toEqual(['crewDays']);
    expect(applyForRebate(sim, id).ok).toBe(true);
    const project = projectIn(sim, id);
    expect(project.rebate!.shareAt).toBe(REBATE.share);

    expect(deliverIt(sim, id)).toBe(true);

    // And then the shoot is a week longer than it was applied for, which is the
    // one direction a schedule ever moves. Written by hand after the picture is
    // finished rather than waited for out of the overrun draw: what is being
    // tested is that payment reads the stamp, and a stamp only ever tested
    // where the two agree is not tested at all.
    const shot = project.periods!.find((one) => one.id === 'shooting')!;
    shot.to += MS_WEEK;
    // On the books it now reaches all four, and it is still on the rate it was
    // accepted at. A rate recomputed at payment would be a rate nobody was ever
    // told, and building the picture to reach the conditions would stop meaning
    // anything before the shoot. Asked here rather than before delivery,
    // because a picture that has spent nothing yet is short on spend as well.
    expect(shortOnFor(sim, project, 'books')).toEqual([]);
    expect(rateFor(sim, project, 'books')).toBe(REBATE.higherShare);

    // And what the screen says it is worth reads the stamp too, which is the
    // same fact asked a second way and the one a producer actually looks at.
    expect(worthToday(sim, project))
      .toBe(Math.round(certifiable(sim, project) * REBATE.share));

    sim.advanceTo(sim.now + 30 * MS_WEEK);
    const claim = projectIn(sim, id).rebate!;
    expect(claim.shareAt).toBe(REBATE.share);
    expect(claim.certifiedCents).toBeGreaterThan(0);
    expect(claim.paidCents).toBe(Math.round(claim.certifiedCents! * REBATE.share));
  });

  it('pays once, however many times it is asked to', () => {
    const sim = world();
    const id = makeIt(sim);
    expect(applyForRebate(sim, id).ok).toBe(true);
    expect(deliverIt(sim, id)).toBe(true);
    sim.advanceTo(sim.now + 30 * MS_WEEK);

    const project = projectIn(sim, id);
    const paid = project.rebate!.paidCents!;
    const cash = companyCash(sim.universe);
    // Asked again directly, which is reachable: a picture can reach delivery
    // more than once, and the second delivery calls this whether or not the
    // first claim has landed.
    expect(payTheClaim(sim, project)).toBe(0);
    expect(project.rebate!.paidCents).toBe(paid);
    expect(companyCash(sim.universe)).toBe(cash);
  });

  it('puts one claim on the calendar and not one per delivery', () => {
    const sim = world();
    const id = makeIt(sim);
    expect(applyForRebate(sim, id).ok).toBe(true);
    expect(deliverIt(sim, id)).toBe(true);
    const on = () => sim.universe.scheduled
      .filter((one) => one.kind === 'project.rebate' && one.status === 'pending').length;
    expect(on()).toBe(1);
    armTheClaim(sim, projectIn(sim, id));
    expect(on()).toBe(1);
  });

  it('pays once and never twice', () => {
    const sim = world();
    const id = makeIt(sim);
    expect(applyForRebate(sim, id).ok).toBe(true);
    expect(deliverIt(sim, id)).toBe(true);
    sim.advanceTo(sim.now + 30 * MS_WEEK);
    const paid = projectIn(sim, id).rebate!.paidCents!;
    sim.advanceTo(sim.now + 60 * MS_WEEK);
    expect(projectIn(sim, id).rebate!.paidCents).toBe(paid);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('says where the claim stands, at every point it can stand anywhere', () => {
    const sim = world();
    const id = makeIt(sim);
    expect(whereTheClaimStands(sim, projectIn(sim, id))).toContain('has not applied yet');
    expect(applyForRebate(sim, id).ok).toBe(true);
    expect(whereTheClaimStands(sim, projectIn(sim, id))).toContain('35%');
    expect(deliverIt(sim, id)).toBe(true);
    sim.advanceTo(sim.now + 30 * MS_WEEK);
    expect(whereTheClaimStands(sim, projectIn(sim, id))).toContain('came back');
  });
});
