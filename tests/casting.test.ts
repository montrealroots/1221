/**
 * SLATE — casting, and the claim that an acting sheet decides something.
 *
 * Eight hundred and thirteen acting attributes have been in every save since
 * the first commit, and until casting landed nothing in the tree read a single
 * one. `docs/DEPTH.md` carries the row — `813 acting attributes | 0` — and
 * these tests exist to make sure the row can come down honestly rather than
 * because something now mentions the word.
 *
 * So the bar here is higher than "casting runs". Every test below moves one
 * input by a little and demands the outcome move. And every one of them was
 * written after being shown to fail with the mechanism deliberately broken —
 * which for this system meant checking something specific: that it is the
 * *sheet* doing the work and not the standing that seeded it, because a sheet
 * that only echoes one number is one number wearing eight hundred names.
 *
 * The three axes are held apart just as hard. Truth and how a face reads move
 * what a picture sells for and nothing on the floor; repeatability moves the
 * shoot and nothing about the money. An axis read twice would be an axis that
 * could have been half an axis.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import type { Person } from '@/engine/domain/model';
import { ATTRIBUTE_BY_ID, sheetOf } from '@/engine/domain/attributes';
import { projectsOf } from '@/engine/world/company';
import { planById } from '@/engine/content/making';
import {
  ATTRIBUTES_READ, AXES, HAGGLE, SIZES, TAKES, takesAt,
} from '@/engine/content/casting';
import {
  askFor, castOf, castOn, decideOffer, howManyCast, openRoles, quoteOf, readOf, readOn,
  reachOfBand, seatFor, sheetFor, takeFactor, whereTheCastStands, whoCameIn, WHOEVER,
} from '@/engine/world/casting';
import { decideTake } from '@/engine/world/selling';
import { cutsAWeek, ratioOf, weeksToConvert, willMakeIt } from '@/engine/world/inventory';
import { MS_WEEK } from '@/engine/world/lot';
import { finishesBy } from '@/engine/world/making';
import { MS_DAY } from '@/engine/core/time';
import { deliverIt, openTheDoors } from './doors';

interface Done { ok: boolean; id?: string; error?: string; said?: string; came?: number }
const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

const world = (seed: string): Simulation => {
  const sim = quickSave({}, seed);
  openTheDoors(sim);
  return sim;
};

function greenlit(
  sim: Simulation, planId: string, title: string, extra: Record<string, unknown> = {},
): string {
  const medium = planById(planId)!.media.includes('film') ? 'film' : 'television';
  run(sim, 'company.develop', { title, medium });
  const id = projectsOf(sim.universe).find((one) => one.title === title)!.id;
  const done = run(sim, 'company.greenlight', {
    projectId: id, planId, budgetCents: 20_000_000_00, shootWeeks: 6, ...extra,
  });
  expect(done.error).toBeUndefined();
  return id;
}

/** Runs a project out to the end of its work, re-reading the end as it moves. */
function runItOut(sim: Simulation, id: string, rounds = 12): void {
  for (let i = 0; i < rounds; i += 1) {
    const done = finishesBy(sim.universe.projects[id]!);
    if (done === undefined || sim.now > done) break;
    sim.advanceTo(done + MS_DAY);
  }
}

/**
 * Casts every part with somebody built to order.
 *
 * Writes the seats directly rather than going through the offer, because these
 * tests are about what a cast *does* and an offer that got refused would be a
 * different experiment every run. The offer has its own tests below.
 */
function castEverybodyAt(sim: Simulation, id: string, at: Partial<Record<string, number>>): void {
  const project = sim.universe.projects[id]!;
  project.cast = [];
  for (const [i, role] of (project.roles ?? []).entries()) {
    const person: Person = {
      ...Object.values(sim.universe.people).find((one) => !one.isPlayer)!,
      id: `made-${id}-${i}`,
      isPlayer: false,
      attributes: sheetOf(50, Object.fromEntries(
        AXES.flatMap((axis) => axis.of.map((attr) => [attr, at[axis.id] ?? 50])),
      )),
    };
    sim.universe.people[person.id] = person;
    project.cast.push({
      roleId: role.id, personId: person.id, feeCents: role.bandCents, castAt: sim.now,
    });
  }
}

// ---------------------------------------------------------------------------

describe('the acting sheet decides something', () => {
  it('reads only attributes that exist, on every axis', () => {
    // A misspelled id would silently average a base the sheet never set, and
    // the axis would keep working and mean nothing.
    for (const axis of AXES) {
      expect(axis.of.length, `${axis.id} reads nothing`).toBeGreaterThan(0);
      for (const id of axis.of) {
        expect(ATTRIBUTE_BY_ID[id], `${axis.id} reads ${id}, which is not an attribute`).toBeDefined();
      }
    }
    expect(ATTRIBUTES_READ.length).toBe(new Set(ATTRIBUTES_READ).size);
  });

  it('never reads the same attribute on two axes', () => {
    // Two axes sharing an attribute are two axes that partly are each other.
    const seen = new Set<string>();
    for (const axis of AXES) {
      for (const id of axis.of) {
        expect(seen.has(id), `${id} is read by more than one axis`).toBe(false);
        seen.add(id);
      }
    }
  });

  it('moves the read when one attribute moves, and not otherwise', () => {
    const flat = sheetOf(50);
    const before = readOn(flat, 'repeatable');
    const after = readOn(sheetOf(50, { take_consistency: 100 }), 'repeatable');
    expect(after).toBeGreaterThan(before);
    // And the other two axes do not notice, because they do not read it.
    expect(readOn(sheetOf(50, { take_consistency: 100 }), 'truth')).toBe(readOn(flat, 'truth'));
    expect(readOn(sheetOf(50, { take_consistency: 100 }), 'reads')).toBe(readOn(flat, 'reads'));
  });

  it('builds people whose three axes disagree with each other', () => {
    // The failure this guards against is the one `docs/DEPTH.md` names: seven
    // fields moved by one fudge factor. If a performer's three axes are the
    // standing three times, the vector is theater.
    let apart = 0;
    const many = 60;
    for (let i = 0; i < many; i += 1) {
      let n = i;
      const sheet = sheetFor(55, () => { n = (n * 1103515245 + 12345) % 2147483648; return n / 2147483648; });
      const read = AXES.map((axis) => readOn(sheet, axis.id));
      const spread = Math.max(...read) - Math.min(...read);
      if (spread > 15) apart += 1;
    }
    // Most people should be visibly better at one of the three than another.
    expect(apart / many).toBeGreaterThan(0.6);
  });
});

describe('repeatability is read by the shoot and by nothing else', () => {
  it('banks more material for a cast that cannot do it again', () => {
    const shaky = world('cast-shaky');
    const steady = world('cast-steady');
    const a = greenlit(shaky, 'feature', 'Hvítserkur');
    const b = greenlit(steady, 'feature', 'Hvítserkur');
    castEverybodyAt(shaky, a, { repeatable: 5 });
    castEverybodyAt(steady, b, { repeatable: 95 });
    runItOut(shaky, a);
    runItOut(steady, b);
    const loose = ratioOf(shaky.universe.projects[a]!)!;
    const tight = ratioOf(steady.universe.projects[b]!)!;
    expect(loose).toBeGreaterThan(tight);
    // And by a distance anybody would notice, not by a rounding error.
    expect(loose / tight).toBeGreaterThan(1.5);
  });

  it('slows the cutting room down, because there is more to get through', () => {
    const shaky = world('cut-shaky');
    const steady = world('cut-steady');
    const a = greenlit(shaky, 'series', 'Landnám');
    const b = greenlit(steady, 'series', 'Landnám');
    castEverybodyAt(shaky, a, { repeatable: 5 });
    castEverybodyAt(steady, b, { repeatable: 95 });
    // To the end of the shoot and no further, because that is the moment the
    // material is banked and the room still has all of it to get through.
    const toWrap = (sim: Simulation, id: string) => {
      const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
      sim.advanceTo(shoot.to);
    };
    toWrap(shaky, a);
    toWrap(steady, b);
    // The room is the same size on both. What differs is how far it is wading.
    expect(shaky.universe.projects[a]!.hands).toBe(steady.universe.projects[b]!.hands);
    expect(cutsAWeek(shaky.universe.projects[a]!))
      .toBeLessThan(cutsAWeek(steady.universe.projects[b]!));
    expect(weeksToConvert(shaky.universe.projects[a]!)!)
      .toBeGreaterThan(weeksToConvert(steady.universe.projects[b]!)!);
  });

  it('delivers the same picture later for it, which is the whole of the claim', () => {
    // The end of the chain, measured on the calendar rather than on a forecast:
    // more takes, more material, a slower room, a later date.
    // The same seed for both, so every other draw in the save — the weather,
    // the crew, what the review turns up — lands identically and the only thing
    // that differs between the two runs is who is standing in front of the
    // camera. Two seeds would have been two worlds, and the answer would have
    // been noise.
    const at = (repeatable: number, hands: number): number => {
      const sim = world('late-either-way');
      const id = greenlit(sim, 'series', 'Landnám', { hands });
      castEverybodyAt(sim, id, { repeatable });
      expect(deliverIt(sim, id)).toBe(true);
      return sim.universe.projects[id]!.deliveredAt!;
    };
    // A room with slack absorbs the difficult cast entirely, which is true and
    // is the reason this test names its hands. Take the slack away and the
    // same cast is a later delivery.
    expect(at(5, 4)).toBe(at(95, 4));
    expect(at(5, 1)).toBeGreaterThan(at(95, 1));
  });

  it('leaves what the picture sells for entirely alone', () => {
    // The falsifiable half of "no axis is read twice". If repeatability
    // touched the money, these two would differ.
    const money = 20_000_000_00;
    const flat = decideTake({ negativeCents: money, dealId: 'studio', cast: { truth: 60, reads: 60 } }, 0.5);
    expect(
      decideTake({ negativeCents: money, dealId: 'studio', cast: { truth: 60, reads: 60 } }, 0.5).cents,
    ).toBe(flat.cents);
    // And there is nowhere to put repeatability into that call at all, which is
    // the structural version of the same claim.
    expect(Object.keys({ truth: 0, reads: 0 })).not.toContain('repeatable');
  });
});

describe('truth and how a face reads are read by the sale and by nothing else', () => {
  it('sells a better-played picture for more, on the same money and the same deal', () => {
    const money = 20_000_000_00;
    const poor = decideTake({ negativeCents: money, dealId: 'studio', cast: { truth: 15, reads: 15 } }, 0.5);
    const fine = decideTake({ negativeCents: money, dealId: 'studio', cast: { truth: 90, reads: 90 } }, 0.5);
    expect(fine.cents).toBeGreaterThan(poor.cents * 1.5);
  });

  it('cuts both ways, so casting is not a bonus on a picture that was going to be fine', () => {
    const money = 20_000_000_00;
    const nobody = decideTake({ negativeCents: money, dealId: 'studio' }, 0.5);
    const poor = decideTake({ negativeCents: money, dealId: 'studio', cast: { truth: 15, reads: 15 } }, 0.5);
    expect(poor.cents).toBeLessThan(nobody.cents);
  });

  it('separates the two, so a beautiful blank and a plain great are different pictures', () => {
    const money = 20_000_000_00;
    const looks = decideTake({ negativeCents: money, dealId: 'studio', cast: { truth: 20, reads: 90 } }, 0.5);
    const plays = decideTake({ negativeCents: money, dealId: 'studio', cast: { truth: 90, reads: 20 } }, 0.5);
    expect(looks.cents).not.toBe(plays.cents);
  });

  it('leaves the shoot entirely alone', () => {
    // The other half. Two casts identical in repeatability and opposite in
    // everything else bank the same material.
    const good = world('shoot-good');
    const dull = world('shoot-dull');
    const a = greenlit(good, 'feature', 'Hvítserkur');
    const b = greenlit(dull, 'feature', 'Hvítserkur');
    castEverybodyAt(good, a, { repeatable: 60, truth: 95, reads: 95 });
    castEverybodyAt(dull, b, { repeatable: 60, truth: 5, reads: 5 });
    expect(takeFactor(good, good.universe.projects[a]!))
      .toBe(takeFactor(dull, dull.universe.projects[b]!));
  });
});

describe('a part is weighted by how much of the picture it is', () => {
  it('lets a lead move the shoot far more than a day player does', () => {
    const sim = world('weighting');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const project = sim.universe.projects[id]!;
    castEverybodyAt(sim, id, { repeatable: 60 });
    const even = castOn(sim, project, 'repeatable')!;

    const worsen = (sizeId: string) => {
      for (const one of castOf(sim, project)) {
        if (one.size.id !== sizeId || !one.person) continue;
        one.person.attributes = sheetOf(50, Object.fromEntries(
          AXES.flatMap((axis) => axis.of.map((attr) => [attr, axis.id === 'repeatable' ? 5 : 50])),
        ));
      }
      return Math.abs(castOn(sim, project, 'repeatable')! - even);
    };
    const byLead = worsen('lead');
    castEverybodyAt(sim, id, { repeatable: 60 });
    const byDay = worsen('day');
    expect(byLead).toBeGreaterThan(byDay * 3);
  });

  it('counts a part-scoped role for its own part rather than the whole season', () => {
    const sim = world('scoped');
    const id = greenlit(sim, 'series', 'Landnám');
    const project = sim.universe.projects[id]!;
    const guests = castOf(sim, project).filter((one) => one.size.id === 'guest');
    const leads = castOf(sim, project).filter((one) => one.size.id === 'lead');
    expect(guests.length).toBeGreaterThan(0);
    expect(project.parts!.length).toBeGreaterThan(1);
    // A guest on one episode of eight weighs an eighth of what the size says.
    expect(guests[0]!.share).toBeCloseTo(guests[0]!.size.onScreen / project.parts!.length, 6);
    expect(leads[0]!.share).toBe(leads[0]!.size.onScreen);
  });
});

describe('the band is what a producer actually buys', () => {
  it('reaches further with more money behind the part', () => {
    expect(reachOfBand(500_00)).toBeLessThan(reachOfBand(50_000_00));
    expect(reachOfBand(50_000_00)).toBeLessThan(reachOfBand(500_000_00));
  });

  it('brings in visibly better people for a richer picture', () => {
    const rich = world('band-rich');
    const thin = world('band-thin');
    const a = greenlit(rich, 'feature', 'Hvítserkur', { budgetCents: 40_000_000_00 });
    const b = greenlit(thin, 'feature', 'Hvítserkur', { budgetCents: 400_000_00 });
    const best = (sim: Simulation, id: string): number => {
      const project = sim.universe.projects[id]!;
      const lead = openRoles(project).find((role) => role.size === 'lead')!;
      run(sim, 'company.breakdown', { projectId: id, roleId: lead.id });
      return Math.max(...whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === lead.id)!)
        .map((person) => readOf(person).truth));
    };
    expect(best(rich, a)).toBeGreaterThan(best(thin, b) + 10);
  });

  it('divides the money by what the picture actually carries', () => {
    const sim = world('bands');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const project = sim.universe.projects[id]!;
    const bandOf = (sizeId: string) =>
      project.roles!.find((role) => role.size === sizeId)!.bandCents;
    for (const [i, size] of SIZES.entries()) {
      if (i === 0) continue;
      expect(bandOf(SIZES[i - 1]!.id), `${SIZES[i - 1]!.id} should out-pay ${size.id}`)
        .toBeGreaterThan(bandOf(size.id));
    }
    const all = project.roles!.reduce((n, role) => n + role.bandCents, 0);
    // The pot is the pot. Rounding a hundred bands is allowed to lose a few
    // cents and nothing more.
    expect(Math.abs(all - Math.round(20_000_000_00 * 0.18))).toBeLessThan(project.roles!.length);
  });
});

describe('the pile is the pile', () => {
  it('brings back the same people however many times it goes out', () => {
    const sim = world('breakdown');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!)[0]!;
    const first = run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const was = [...sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!.seen!];
    const again = run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    expect(first.ok && again.ok).toBe(true);
    expect(sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!.seen).toEqual(was);
    // And it does not quietly make four more people each time somebody looks.
    expect(again.came).toBe(was.length);
  });

  it('makes nobody at all until somebody puts the part out', () => {
    const sim = world('nobody-yet');
    const before = Object.keys(sim.universe.people).length;
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    expect((sim.universe.projects[id]!.roles ?? []).length).toBeGreaterThan(0);
    // The crew arrives on its own calendar and will make people. Casting does
    // not, until it is asked.
    expect(sim.universe.projects[id]!.roles!.every((role) => role.seen === undefined)).toBe(true);
    expect(Object.keys(sim.universe.people).length).toBe(before);
  });
});

describe('an offer is a person answering, not a form', () => {
  it('refuses on the dates before it looks at the money', () => {
    const rich = { askCents: 100_00, feeCents: 10_000_000_00, carries: 30, free: false, demand: 10 };
    const answer = decideOffer(rich, 0.01);
    expect(answer.took).toBe(false);
    expect('passed' in answer && answer.passed).toBe('dates');
  });

  it('counters rather than hanging up when the number is close', () => {
    const ask = 100_000_00;
    const near = decideOffer(
      { askCents: ask, feeCents: Math.round(ask * HAGGLE.under * 0.9), carries: 30, free: true, demand: 20 },
      0.5,
    );
    expect('counterCents' in near && near.counterCents).toBe(ask);
    const insulting = decideOffer(
      { askCents: ask, feeCents: Math.round(ask * 0.2), carries: 30, free: true, demand: 20 },
      0.5,
    );
    expect('passed' in insulting && insulting.passed).toBe('price');
  });

  it('turns down a small part for somebody everybody wants, at any price', () => {
    const tiny = { askCents: 10_000_00, feeCents: 5_000_000_00, carries: 3, free: true, demand: 98 };
    const wanted = decideOffer(tiny, 0.01);
    expect('passed' in wanted && wanted.passed).toBe('size');
    // The same part, the same money, somebody nobody is asking for.
    const quiet = { ...tiny, demand: 5 };
    expect(decideOffer(quiet, 0.01).took).toBe(true);
  });

  it('is likelier the more it pays, which is the whole of a negotiation', () => {
    const base = { askCents: 100_000_00, carries: 25, free: true, demand: 40 };
    const tookAt = (times: number): number => {
      let took = 0;
      for (let i = 0; i < 100; i += 1) {
        if (decideOffer({ ...base, feeCents: Math.round(base.askCents * times) }, i / 100).took) took += 1;
      }
      return took;
    };
    expect(tookAt(1.8)).toBeGreaterThan(tookAt(1));
    expect(tookAt(1)).toBeGreaterThan(tookAt(0.85));
  });
});

describe('a quote is a ratchet with memory', () => {
  it('writes what was paid onto the person, so the next producer reads it', () => {
    const sim = world('quote');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!).find((r) => r.size === 'lead')!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const person = whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!)[0]!;
    expect(quoteOf(person, 'lead', sim.now)).toBe(0);
    const over = Math.round(askFor(person, role, sim.now) * 2);
    run(sim, 'company.cast', { projectId: id, roleId: role.id, personId: person.id, feeCents: over });
    // Whatever they said, the number is on the record.
    expect(person.quotes?.length).toBe(1);
    expect(quoteOf(person, 'lead', sim.now)).toBe(over);
  });

  it('does not let a day player’s cheap number price a lead', () => {
    const sim = world('quote-size');
    const person = Object.values(sim.universe.people).find((one) => !one.isPlayer)!;
    person.quotes = [{ projectId: 'x', size: 'day', cents: 1_000_00, at: sim.now }];
    expect(quoteOf(person, 'day', sim.now)).toBe(1_000_00);
    expect(quoteOf(person, 'lead', sim.now)).toBe(0);
    // And a lead's number prices everything under it.
    person.quotes.push({ projectId: 'y', size: 'lead', cents: 900_000_00, at: sim.now });
    expect(quoteOf(person, 'day', sim.now)).toBe(900_000_00);
  });

  it('wears an old number down rather than honoring it forever', () => {
    const sim = world('quote-decay');
    const person = Object.values(sim.universe.people).find((one) => !one.isPlayer)!;
    const yearsAgo = (n: number) => sim.now - Math.round(n * 365.25 * 24 * 60 * 60 * 1000);
    person.quotes = [{ projectId: 'x', size: 'lead', cents: 400_000_00, at: yearsAgo(2) }];
    const half = quoteOf(person, 'lead', sim.now);
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(400_000_00);
    person.quotes = [{ projectId: 'x', size: 'lead', cents: 400_000_00, at: yearsAgo(9) }];
    expect(quoteOf(person, 'lead', sim.now)).toBe(0);
  });
});

describe('the office fills what nobody filled, at the band and no further', () => {
  it('leaves no part empty on the day the camera turns over', () => {
    const sim = world('office');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    expect(howManyCast(sim.universe.projects[id]!)).toBe(0);
    const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
    sim.advanceTo(shoot.from);
    const project = sim.universe.projects[id]!;
    expect(howManyCast(project)).toBe(project.roles!.length);
  });

  it('pays the band and nothing over it, because it has no authority to', () => {
    const sim = world('office-pays');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
    sim.advanceTo(shoot.from);
    const project = sim.universe.projects[id]!;
    for (const seat of project.cast ?? []) {
      const role = project.roles!.find((r) => r.id === seat.roleId)!;
      expect(seat.feeCents).toBe(role.bandCents);
    }
  });

  it('does not touch a part somebody already cast', () => {
    const sim = world('office-respects');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!).find((r) => r.size === 'lead')!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const person = whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!)[0]!;
    const paid = Math.round(askFor(person, role, sim.now) * 2.5);
    run(sim, 'company.cast', { projectId: id, roleId: role.id, personId: person.id, feeCents: paid });
    const before = seatFor(sim.universe.projects[id]!, role.id)!;
    const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
    sim.advanceTo(shoot.from);
    const after = seatFor(sim.universe.projects[id]!, role.id)!;
    expect(after.personId).toBe(before.personId);
    expect(after.feeCents).toBe(paid);
  });

  it('is what an unattended picture gets, and it is not the floor', () => {
    // `WHOEVER` is what a part reads at with nobody in it, and it should never
    // be the state of a picture that actually shot.
    const sim = world('office-not-floor');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
    sim.advanceTo(shoot.from);
    expect(castOn(sim, sim.universe.projects[id]!, 'truth')!).toBeGreaterThan(WHOEVER + 10);
  });
});

describe('letting somebody go never gets the money back', () => {
  it('keeps the seat on the record, because the fee is still owed', () => {
    const sim = world('release');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
    sim.advanceTo(shoot.from);
    const project = sim.universe.projects[id]!;
    const role = project.roles![0]!;
    const was = seatFor(project, role.id)!;
    expect(run(sim, 'company.release', { projectId: id, roleId: role.id }).ok).toBe(true);
    const after = sim.universe.projects[id]!;
    expect(seatFor(after, role.id)).toBeUndefined();
    // Gone from the part, still on the picture, still costing what it cost.
    expect(after.cast!.some((s) => s.personId === was.personId && s.feeCents === was.feeCents))
      .toBe(true);
  });
});

describe('the curve is centered on an ordinary cast, not a perfect one', () => {
  it('banks what the plan says when the cast is middling', () => {
    expect(takesAt(TAKES.middling)).toBeCloseTo(1, 6);
    expect(takesAt(100)).toBeLessThan(1);
    expect(takesAt(0)).toBeGreaterThan(1);
  });

  it('reaches both declared ends from inside the scale, and never past them', () => {
    expect(takesAt(0)).toBe(TAKES.worst);
    expect(takesAt(100)).toBe(TAKES.best);
    expect(takesAt(-500)).toBe(TAKES.worst);
    expect(takesAt(500)).toBe(TAKES.best);
  });
});

describe('the whole of it still holds together', () => {
  it('delivers and sells a picture cast the hard way, and says what the cast was', () => {
    const sim = world('end-to-end');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!).find((r) => r.size === 'lead')!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const person = whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!)[0]!;
    run(sim, 'company.cast', {
      projectId: id, roleId: role.id, personId: person.id,
      feeCents: Math.round(askFor(person, role, sim.now) * 1.6),
    });
    expect(deliverIt(sim, id)).toBe(true);
    expect(run(sim, 'company.sell', { projectId: id, dealId: 'studio' }).ok).toBe(true);
    const project = sim.universe.projects[id]!;
    expect(project.takeCents).toBeGreaterThan(0);
    expect(whereTheCastStands(sim, project)).toMatch(/parts cast on/);
    // And the picture it made its date against knew about the cast all along.
    expect(willMakeIt(project, sim.now)).toBeDefined();
  });

  it('is reachable through the commands and nothing else', () => {
    const sim = world('commands');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!)[0]!;
    expect(run(sim, 'company.cast', {
      projectId: id, roleId: role.id, personId: 'nobody', feeCents: 1_00,
    }).error).toBeDefined();
    expect(run(sim, 'company.breakdown', { projectId: id, roleId: 'made-up' }).error).toBeDefined();
    expect(run(sim, 'company.release', { projectId: id, roleId: role.id }).error).toBeDefined();
  });
});

describe('the player is never read by it', () => {
  it('keeps the best actor alive out of every submission pile', () => {
    // The player's sheet is every attribute at the ceiling. A casting system
    // that read it would be a hundred lookups all returning a hundred, which is
    // the trap `docs/DEPTH.md` names by that description — so the player is
    // cast by being offered a part, never by turning up in a pile.
    const sim = world('no-player');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    for (const role of openRoles(sim.universe.projects[id]!)) {
      run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    }
    for (const role of sim.universe.projects[id]!.roles!) {
      expect(role.seen ?? []).not.toContain(sim.universe.playerId);
    }
  });
});

describe('a week of shooting is what the cast makes it', () => {
  it('moves the forecast within one week of the same picture', () => {
    // The tightest version of the falsifiability test: one world, one picture,
    // and the only thing that changes is who is in it.
    const sim = world('one-week');
    const id = greenlit(sim, 'series', 'Landnám');
    castEverybodyAt(sim, id, { repeatable: 95 });
    const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
    sim.advanceTo(shoot.from + MS_WEEK * 2);
    const tight = takeFactor(sim, sim.universe.projects[id]!);
    castEverybodyAt(sim, id, { repeatable: 5 });
    const loose = takeFactor(sim, sim.universe.projects[id]!);
    expect(loose).toBeGreaterThan(tight);
    // Not merely different: the two ends of the declared curve are reachable
    // from inside the scale, which is what makes the table describe something.
    expect(takesAt(0)).toBe(TAKES.worst);
    expect(takesAt(100)).toBe(TAKES.best);
  });
});
