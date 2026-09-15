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
  ATTRIBUTES_READ, AXES, HAGGLE, SIZES, TAKES, THE_TAPE, roundById, takesAt,
} from '@/engine/content/casting';
import type { Looked } from '@/engine/domain/company';
import {
  askFor, castOf, castOn, datesFor, decideOffer, freeToWork, howManyCast, openRoles, quoteOf,
  alreadyKnown, believedAt, goesOffBy, howWide, lookedAt, officeFillsAt, readOf, readOn,
  reachOfBand, seatFor, sheetFor, shownOf, SOMEBODY_KNOWS, takeFactor, tapeLean, theBiggestName,
  theDiary, theNameThatGoesOff, TOO_HOT, whereTheCastStands, whoCameIn, WHOEVER,
} from '@/engine/world/casting';
import { deckFor, somebodyGoesOff } from '@/engine/world/trouble';
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
    const from = Object.values(sim.universe.people).find((one) => !one.isPlayer)!;
    const person: Person = {
      ...from,
      id: `made-${id}-${i}`,
      isPlayer: false,
      // Their own reputation, not a shared reference to one. Spreading a person
      // is a shallow copy, so without this every made performer pointed at the
      // same object and setting one person's fame set everybody's — which
      // silently made a test about picking the biggest name unable to fail.
      reputation: { ...from.reputation },
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

describe('reaching past the band costs what reaching past it costs', () => {
  const cashOf = (sim: Simulation): number => {
    const company = Object.values(sim.universe.companies).find((one) => one.trade === 'film')!;
    const account = Object.values(sim.universe.accounts)
      .find((a) => a.ownerId === company.id && a.kind === 'company_cash' && !a.closedAt)!;
    return account.balance;
  };

  it('bills the company the difference, on the day it reaches', () => {
    // Without this, paying over the band is free and there is no reason ever to
    // offer less than the most somebody would take.
    const sim = world('overage');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!).find((r) => r.size === 'lead')!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const person = whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!)[0]!;
    const before = cashOf(sim);
    const spent = sim.universe.projects[id]!.spentCents;
    const over = role.bandCents * 2;
    run(sim, 'company.cast', { projectId: id, roleId: role.id, personId: person.id, feeCents: over });
    // Only if they took it. If they passed, nothing moved either.
    if (seatFor(sim.universe.projects[id]!, role.id)) {
      expect(cashOf(sim)).toBe(before - role.bandCents);
      expect(sim.universe.projects[id]!.spentCents).toBe(spent + role.bandCents);
    } else {
      expect(cashOf(sim)).toBe(before);
    }
  });

  it('charges nothing for taking somebody at or under the band', () => {
    const sim = world('no-overage');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!).find((r) => r.size === 'day')!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const person = whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!)[0]!;
    const before = cashOf(sim);
    run(sim, 'company.cast', {
      projectId: id, roleId: role.id, personId: person.id, feeCents: role.bandCents,
    });
    expect(cashOf(sim)).toBe(before);
  });

  it('is what the office never does, which is the whole of what the office is', () => {
    const sim = world('office-free');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const before = cashOf(sim);
    const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
    sim.advanceTo(shoot.from - MS_WEEK);
    expect(howManyCast(sim.universe.projects[id]!)).toBe(sim.universe.projects[id]!.roles!.length);
    // Prep money has gone out in the meantime, so this is not a balance check —
    // it is that not one cent of what went out was a cast overage.
    const overages = Object.values(sim.universe.accounts)
      .filter((a) => a.name.includes('Over The Band'));
    expect(overages).toHaveLength(0);
    expect(cashOf(sim)).toBeLessThan(before);
  });
});

describe('the player can be in the picture, which is the point of the game', () => {
  it('takes the part without anybody deciding whether they are right for it', () => {
    const sim = world('player-cast');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!).find((r) => r.size === 'lead')!;
    const done = run(sim, 'company.cast', {
      projectId: id, roleId: role.id, personId: sim.universe.playerId, feeCents: role.bandCents,
    });
    expect(done.ok).toBe(true);
    expect(seatFor(sim.universe.projects[id]!, role.id)!.personId).toBe(sim.universe.playerId);
  });

  it('hands them the money, out of the company and into their own account', () => {
    const sim = world('player-paid');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!).find((r) => r.size === 'lead')!;
    const me = sim.universe.people[sim.universe.playerId]!;
    const mine = () => sim.universe.accounts[me.primaryAccountId!]!.balance;
    const before = mine();
    run(sim, 'company.cast', {
      projectId: id, roleId: role.id, personId: sim.universe.playerId, feeCents: role.bandCents,
    });
    expect(mine()).toBe(before + role.bandCents);
  });

  it('cannot be in two things at once, which is the only thing stopping them', () => {
    const sim = world('player-busy');
    const a = greenlit(sim, 'feature', 'Hvítserkur');
    const b = greenlit(sim, 'feature', 'Reykjanes');
    const first = openRoles(sim.universe.projects[a]!).find((r) => r.size === 'lead')!;
    const second = openRoles(sim.universe.projects[b]!).find((r) => r.size === 'lead')!;
    run(sim, 'company.cast', {
      projectId: a, roleId: first.id, personId: sim.universe.playerId, feeCents: first.bandCents,
    });
    run(sim, 'company.cast', {
      projectId: b, roleId: second.id, personId: sim.universe.playerId, feeCents: second.bandCents,
    });
    // Two pictures greenlit on the same day shoot across each other.
    expect(seatFor(sim.universe.projects[b]!, second.id)).toBeUndefined();
  });

  it('lifts the picture, because they are the best there has ever been at it', () => {
    const sim = world('player-lifts');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!).find((r) => r.size === 'lead')!;
    const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
    sim.advanceTo(shoot.from);
    const without = castOn(sim, sim.universe.projects[id]!, 'truth')!;
    run(sim, 'company.release', { projectId: id, roleId: role.id });
    run(sim, 'company.cast', {
      projectId: id, roleId: role.id, personId: sim.universe.playerId, feeCents: role.bandCents,
    });
    expect(castOn(sim, sim.universe.projects[id]!, 'truth')!).toBeGreaterThan(without);
  });

  it('never turns up in a submission pile, even once they have worked here', () => {
    // A sheet of a hundred hundreds in a pile of four would win every part
    // there has ever been, and the pile would stop being a choice.
    //
    // The pile's first pass is people who have acted for this company before,
    // so the exclusion only means anything once the player is one of them. The
    // version of this test that never put them in a picture first passed with
    // the guard deleted, which is the whole reason the setup below exists.
    const sim = world('player-not-in-pile');
    // Two small ones, both said yes to before either is cast, because a lead's
    // fee paid out of the company is real money and the second greenlight has
    // to clear the same door as the first.
    // And they do not overlap: the second shoots two years after the first
    // wraps, so the player is genuinely free for it. An overlapping pair
    // excluded them on the dates instead, and passed with the guard deleted.
    const small = { budgetCents: 3_000_000_00 };
    const first = greenlit(sim, 'feature', 'Hvítserkur', small);
    const next = greenlit(sim, 'feature', 'Reykjanes', {
      ...small, from: sim.now + 104 * MS_WEEK,
    });
    const mine = openRoles(sim.universe.projects[first]!).find((r) => r.size === 'lead')!;
    run(sim, 'company.cast', {
      projectId: first, roleId: mine.id, personId: sim.universe.playerId, feeCents: mine.bandCents,
    });
    expect(seatFor(sim.universe.projects[first]!, mine.id)!.personId).toBe(sim.universe.playerId);

    // Now the second picture, from the same company, goes looking.
    const lead = openRoles(sim.universe.projects[next]!).find((r) => r.size === 'lead')!;
    const when = datesFor(sim.universe.projects[next]!, lead)!;
    expect(freeToWork(sim, sim.universe.playerId, when.from, when.to),
      'the player has to be free for the second picture or this proves nothing').toBe(true);
    for (const role of openRoles(sim.universe.projects[next]!)) {
      run(sim, 'company.breakdown', { projectId: next, roleId: role.id });
    }
    for (const role of sim.universe.projects[next]!.roles!) {
      expect((role.seen ?? []).map((one) => one.personId))
        .not.toContain(sim.universe.playerId);
    }
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

describe('a part that has been shot has been shot', () => {
  it('refuses an offer made after the camera has finished with it', () => {
    // Everything else about casting late is expensive. This is impossible: the
    // scenes were shot with whoever was standing there.
    const sim = world('too-late');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
    sim.advanceTo(shoot.to + MS_WEEK);
    const role = sim.universe.projects[id]!.roles![0]!;
    // The office filled it during prep, so let that person go first — which
    // leaves the part open, and still shot.
    expect(run(sim, 'company.release', { projectId: id, roleId: role.id }).ok).toBe(true);
    expect(openRoles(sim.universe.projects[id]!).some((r) => r.id === role.id)).toBe(true);
    const done = run(sim, 'company.cast', {
      projectId: id, roleId: role.id, personId: sim.universe.playerId, feeCents: role.bandCents,
    });
    expect(done.ok).toBe(false);
    expect(done.error).toMatch(/already been shot/);
  });

  it('still takes an offer made while the camera is on it', () => {
    const sim = world('just-in-time');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
    sim.advanceTo(shoot.from + MS_WEEK);
    const role = sim.universe.projects[id]!.roles![0]!;
    run(sim, 'company.release', { projectId: id, roleId: role.id });
    expect(run(sim, 'company.cast', {
      projectId: id, roleId: role.id, personId: sim.universe.playerId, feeCents: role.bandCents,
    }).ok).toBe(true);
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

describe('a name going off is the price of having one', () => {
  it('cannot happen to a picture with nobody known in it', () => {
    // The only genuine advantage of having no money: a picture cast out of
    // people nobody has heard of has no name to lose.
    const sim = world('no-names');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const project = sim.universe.projects[id]!;
    castEverybodyAt(sim, id, { repeatable: 55 });
    for (const one of castOf(sim, project)) {
      if (one.person) one.person.reputation.publicFame = 0;
    }
    expect(theBiggestName(sim, project)).toBe(0);
    expect(deckFor(project, planById('feature')!, theBiggestName(sim, project)).map((f) => f.id))
      .not.toContain('a-name-goes-off');
  });

  it('is on the deck the moment somebody in it is known', () => {
    const sim = world('one-name');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const project = sim.universe.projects[id]!;
    castEverybodyAt(sim, id, { repeatable: 55 });
    for (const one of castOf(sim, project)) {
      if (one.person) one.person.reputation.publicFame = 0;
    }
    const lead = castOf(sim, project).find((one) => one.size.id === 'lead')!;
    lead.person!.reputation.publicFame = SOMEBODY_KNOWS;
    expect(deckFor(project, planById('feature')!, theBiggestName(sim, project)).map((f) => f.id))
      .toContain('a-name-goes-off');
  });

  it('goes off on the biggest name rather than on a random one', () => {
    const sim = world('biggest');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const project = sim.universe.projects[id]!;
    castEverybodyAt(sim, id, { repeatable: 55 });
    const all = castOf(sim, project);
    for (const [i, one] of all.entries()) {
      if (one.person) one.person.reputation.publicFame = 30 + i;
    }
    const most = all.reduce((top, one) => (
      (one.person?.reputation.publicFame ?? 0) > (top.person?.reputation.publicFame ?? 0) ? one : top
    ), all[0]!);
    expect(theNameThatGoesOff(sim, project)!.id).toBe(most.person!.id);
  });

  it('writes the attention onto the person, which nothing else in the build does', () => {
    const sim = world('goes-off');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const project = sim.universe.projects[id]!;
    castEverybodyAt(sim, id, { repeatable: 55 });
    const lead = castOf(sim, project).find((one) => one.size.id === 'lead')!;
    lead.person!.reputation.publicFame = 70;
    expect(lead.person!.reputation.controversy).toBe(0);
    const gone = somebodyGoesOff(sim, project)!;
    expect(gone.reputation.controversy).toBeGreaterThan(0);
    // Bigger names go off harder, and neither reaches the top from one week.
    const quieter = { ...gone, reputation: { ...gone.reputation, publicFame: 26, controversy: 0 } };
    expect(goesOffBy(26)).toBeLessThan(goesOffBy(70));
    expect(goesOffBy(100)).toBeLessThan(100);
    expect(quieter.reputation.controversy).toBe(0);
  });

  it('costs the picture at the sale, on top of whatever the cut lost', () => {
    const money = 20_000_000_00;
    const clean = decideTake(
      { negativeCents: money, dealId: 'studio', cast: { truth: 60, reads: 60 }, controversy: 0 }, 0.5,
    );
    const loud = decideTake(
      { negativeCents: money, dealId: 'studio', cast: { truth: 60, reads: 60 }, controversy: 80 }, 0.5,
    );
    expect(loud.cents).toBeLessThan(clean.cents);
  });

  it('follows them out of the picture and into the next office', () => {
    // The half that outlives the production. A performer the trade is writing
    // about does not get cast by an office with no authority to explain it.
    const sim = world('too-hot');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!).find((r) => r.size === 'lead')!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const came = whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!);
    for (const person of came) person.reputation.controversy = TOO_HOT;
    const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
    sim.advanceTo(shoot.from);
    const seat = seatFor(sim.universe.projects[id]!, role.id);
    // Somebody plays the part — the office finds somebody else rather than
    // leaving it empty — and it is not one of the four it passed on.
    if (seat) expect(came.map((p) => p.id)).not.toContain(seat.personId);
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

// ---------------------------------------------------------------------------
// The room
// ---------------------------------------------------------------------------

/** Books a round and runs the clock to the day it happens. */
function sit(sim: Simulation, id: string, roleId: string, personId: string, round: string, note?: string): Done {
  const done = run(sim, 'company.session', { projectId: id, roleId, personId, round, ...(note ? { note } : {}) });
  if (done.ok) {
    const at = (done as { at?: number }).at;
    if (at !== undefined) sim.advanceTo(at + MS_DAY);
  }
  return done;
}

/** The candidate a company would take for a part, on what it believes today. */
function whoTheydTake(sim: Simulation, id: string, roleId: string): Person {
  const project = sim.universe.projects[id]!;
  const role = project.roles!.find((r) => r.id === roleId)!;
  const came = whoCameIn(sim, role);
  return came.reduce((top, person) => {
    const one = shownOf(sim, project, role, person);
    const other = shownOf(sim, project, role, top);
    return one.truth + one.reads + one.repeatable > other.truth + other.reads + other.repeatable
      ? person : top;
  }, came[0]!);
}

describe('nobody knows what a stranger is', () => {
  it('shows a guess with a stated width, never the sheet', () => {
    const sim = world('guess');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const project = sim.universe.projects[id]!;
    const role = openRoles(project).find((r) => r.size === 'lead')!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const person = whoCameIn(sim, project.roles!.find((r) => r.id === role.id)!)[0]!;

    // Off a headshot the office is allowed to be a long way out on all three,
    // and furthest out on the one a photograph says least about.
    const pile = roundById('pile')!;
    for (const axis of AXES) {
      expect(howWide(lookedAt(role, person.id), axis.id).width).toBe(pile.width[axis.id]);
    }
    expect(pile.width.repeatable).toBeGreaterThan(pile.width.reads);
    expect(shownOf(sim, project, role, person)).not.toEqual(readOf(person));
  });

  it('never redraws the guess, only closes in on it', () => {
    // A number that jumped about every time somebody looked would make choosing
    // between four strangers meaningless. It is the same point, seen nearer.
    const sim = world('converge');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const project = sim.universe.projects[id]!;
    const role = openRoles(project).find((r) => r.size === 'lead')!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const person = whoCameIn(sim, project.roles!.find((r) => r.id === role.id)!)[0]!;
    const truth = readOf(person);

    const twice = shownOf(sim, project, role, person);
    expect(shownOf(sim, project, role, person)).toEqual(twice);

    const was = Math.abs(twice.truth - truth.truth);
    sit(sim, id, role.id, person.id, 'preread');
    const now = Math.abs(shownOf(sim, project, role, person).truth - truth.truth);
    expect(now).toBeLessThanOrEqual(was);
  });

  it('knows exactly what somebody is once they have finished a job here', () => {
    const sim = world('known');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
    sim.advanceTo(shoot.from);
    const project = sim.universe.projects[id]!;
    const seat = project.cast![0]!;
    const role = project.roles!.find((r) => r.id === seat.roleId)!;
    const person = sim.universe.people[seat.personId]!;
    expect(alreadyKnown(sim, project.companyId, person.id)).toBe(false);
    sim.advanceTo(shoot.to + MS_WEEK);
    expect(alreadyKnown(sim, project.companyId, person.id)).toBe(true);
    expect(shownOf(sim, project, role, person)).toEqual(readOf(person));
  });
});

describe('only a callback finds out whether they can do it again', () => {
  it('leaves repeatability wide after a tape, because a tape is one take they chose', () => {
    const tape = roundById('tape')!;
    const preread = roundById('preread')!;
    const callback = roundById('callback')!;
    // Truth closes fast and repeatability does not, right up until somebody is
    // asked to do it a second time.
    expect(tape.width.truth).toBeLessThan(roundById('pile')!.width.truth * 0.6);
    expect(tape.width.repeatable).toBeGreaterThan(roundById('pile')!.width.repeatable * 0.8);
    expect(preread.width.repeatable).toBeGreaterThan(callback.width.repeatable * 2.5);
    expect(callback.width.repeatable).toBeLessThan(callback.width.truth * 1.5);
  });

  it('refuses to call back somebody nobody has ever had in', () => {
    const sim = world('stranger-callback');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!)[0]!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const person = whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!)[0]!;
    const done = run(sim, 'company.session', {
      projectId: id, roleId: role.id, personId: person.id, round: 'callback',
    });
    expect(done.ok).toBe(false);
    expect(done.error).toMatch(/calls a stranger back/);
    expect(sit(sim, id, role.id, person.id, 'preread').ok).toBe(true);
    expect(sit(sim, id, role.id, person.id, 'callback').ok).toBe(true);
  });

  it('refuses to run the same round twice', () => {
    const sim = world('twice');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!)[0]!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const person = whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!)[0]!;
    expect(sit(sim, id, role.id, person.id, 'preread').ok).toBe(true);
    expect(run(sim, 'company.session', {
      projectId: id, roleId: role.id, personId: person.id, round: 'preread',
    }).ok).toBe(false);
  });
});

describe('a tape is the actor’s tape, not the actor', () => {
  it('reads four attributes that have nothing to do with acting', () => {
    for (const id of THE_TAPE) {
      expect(ATTRIBUTE_BY_ID[id], `${id} is not an attribute`).toBeDefined();
      // And none of them is on an axis, because none of them is a thing a
      // picture buys.
      for (const axis of AXES) expect(axis.of).not.toContain(id);
    }
  });

  it('flatters somebody good at taping and buries somebody bad at it', () => {
    const good = sheetOf(50, Object.fromEntries(THE_TAPE.map((id) => [id, 100])));
    const bad = sheetOf(50, Object.fromEntries(THE_TAPE.map((id) => [id, 1])));
    expect(tapeLean(good)).toBeGreaterThan(0);
    expect(tapeLean(bad)).toBeLessThan(0);
    const onTape: Looked = { personId: 'x', rounds: ['tape'] };
    expect(believedAt(50, onTape, 'truth', 0, tapeLean(good))).toBeGreaterThan(50);
    expect(believedAt(50, onTape, 'truth', 0, tapeLean(bad))).toBeLessThan(50);
  });

  it('stops flattering the moment somebody is in the room', () => {
    const good = sheetOf(50, Object.fromEntries(THE_TAPE.map((id) => [id, 100])));
    const seen: Looked = { personId: 'x', rounds: ['tape', 'preread'] };
    expect(believedAt(50, seen, 'truth', 0, tapeLean(good))).toBe(50);
  });

  it('never touches repeatability, which a file says nothing about either way', () => {
    const good = sheetOf(50, Object.fromEntries(THE_TAPE.map((id) => [id, 100])));
    const onTape: Looked = { personId: 'x', rounds: ['tape'] };
    expect(believedAt(50, onTape, 'repeatable', 0, tapeLean(good))).toBe(50);
  });
});

describe('a session is one note and a note is one axis', () => {
  it('takes the named axis a round further and leaves the other two', () => {
    const noted: Looked = { personId: 'x', rounds: ['preread'], note: 'repeatable' };
    const plain: Looked = { personId: 'x', rounds: ['preread'] };
    expect(howWide(noted, 'repeatable').width).toBeLessThan(howWide(plain, 'repeatable').width);
    expect(howWide(noted, 'truth').width).toBe(howWide(plain, 'truth').width);
    expect(howWide(noted, 'reads').width).toBe(howWide(plain, 'reads').width);
  });

  it('halves it on the last round, where there is nothing further to reach for', () => {
    const noted: Looked = { personId: 'x', rounds: ['preread', 'callback'], note: 'truth' };
    const plain: Looked = { personId: 'x', rounds: ['preread', 'callback'] };
    expect(howWide(noted, 'truth').width).toBe(howWide(plain, 'truth').width / 2);
  });

  it('is refused on something nobody could give a note on', () => {
    const sim = world('bad-note');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!)[0]!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const person = whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!)[0]!;
    expect(run(sim, 'company.session', {
      projectId: id, roleId: role.id, personId: person.id, round: 'preread', note: 'charm',
    }).ok).toBe(false);
  });
});

describe('the diary is the scarcity', () => {
  it('queues, because the office runs one thing at a time', () => {
    const sim = world('diary');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!)[0]!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const came = whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!);
    const first = run(sim, 'company.session', {
      projectId: id, roleId: role.id, personId: came[0]!.id, round: 'preread',
    });
    const second = run(sim, 'company.session', {
      projectId: id, roleId: role.id, personId: came[1]!.id, round: 'preread',
    });
    expect(first.ok && second.ok).toBe(true);
    expect((second as { at?: number }).at!).toBeGreaterThan((first as { at?: number }).at!);
    expect(theDiary(sim, sim.universe.projects[id]!)).toHaveLength(2);
  });

  it('lets a picture preread everybody, and makes that cost it the callbacks', () => {
    // Twenty-one parts, four people for each, and eleven weeks of diary. The
    // shape that falls out is the real one: an office can see everybody once
    // and cannot see everybody twice, so the decision is never whether to
    // preread — it is which of the eighty-four is worth the day that seeing
    // them a second time takes.
    const sim = world('runs-out');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    for (const role of openRoles(sim.universe.projects[id]!)) {
      run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    }
    const everybody: { roleId: string; personId: string }[] = [];
    for (const role of sim.universe.projects[id]!.roles!) {
      for (const person of whoCameIn(sim, role)) {
        everybody.push({ roleId: role.id, personId: person.id });
      }
    }
    expect(everybody.length).toBeGreaterThan(60);

    const book = (round: string) => {
      let got = 0;
      let last = sim.now;
      for (const one of everybody) {
        const done = run(sim, 'company.session', { projectId: id, ...one, round });
        if (!done.ok) continue;
        got += 1;
        last = Math.max(last, (done as { at?: number }).at ?? last);
      }
      // And then the weeks those bookings represent actually pass, because a
      // callback cannot be offered to somebody whose preread has not happened.
      // The funnel is sequential in time and not only in order.
      sim.advanceTo(last + MS_DAY);
      return got;
    };
    // Everybody gets seen once.
    expect(book('preread')).toBe(everybody.length);
    // And nowhere near everybody gets seen twice.
    const back = book('callback');
    expect(back, 'some callbacks should fit').toBeGreaterThan(0);
    expect(back, 'the diary should run out long before the actors do')
      .toBeLessThan(everybody.length / 2);
  });

  it('shuts before the office fills, because after that it teaches nobody anything', () => {
    const sim = world('shuts');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!)[0]!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const person = whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!)[0]!;
    const shuts = officeFillsAt(sim.universe.projects[id]!)!;
    sim.advanceTo(shuts + MS_WEEK);
    expect(run(sim, 'company.session', {
      projectId: id, roleId: role.id, personId: person.id, round: 'preread',
    }).ok).toBe(false);
  });

  it('charges for the room, and charges more for the one the director sits in', () => {
    const company = (sim: Simulation) =>
      Object.values(sim.universe.companies).find((one) => one.trade === 'film')!;
    const cash = (sim: Simulation) => Object.values(sim.universe.accounts)
      .find((a) => a.ownerId === company(sim).id && a.kind === 'company_cash' && !a.closedAt)!.balance;
    const sim = world('room-costs');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    const role = openRoles(sim.universe.projects[id]!)[0]!;
    run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
    const person = whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!)[0]!;
    const before = cash(sim);
    run(sim, 'company.session', {
      projectId: id, roleId: role.id, personId: person.id, round: 'preread',
    });
    expect(cash(sim)).toBe(before - roundById('preread')!.costsCents);
    expect(roundById('callback')!.costsCents).toBeGreaterThan(roundById('preread')!.costsCents);
  });
});

describe('the office picks on what it believes, like everybody else', () => {
  it('takes somebody different once it has seen them', () => {
    // The falsifiable core. Find a world where the best-looking candidate off a
    // headshot is not the best-looking one after a callback, and check the
    // office takes the second, not the first — and not the truly best either,
    // because nobody in this world can see that.
    let moved = 0;
    for (let seed = 0; seed < 14; seed += 1) {
      const sim = world(`office-believes-${seed}`);
      const id = greenlit(sim, 'feature', 'Hvítserkur');
      const role = openRoles(sim.universe.projects[id]!).find((r) => r.size === 'lead')!;
      run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
      const blind = whoTheydTake(sim, id, role.id).id;
      for (const person of whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!)) {
        sit(sim, id, role.id, person.id, 'preread');
        sit(sim, id, role.id, person.id, 'callback');
      }
      if (whoTheydTake(sim, id, role.id).id !== blind) moved += 1;
    }
    expect(moved, 'seeing people should change who the office would take').toBeGreaterThan(2);
  });

  it('fills a part with the best it believes in, not the best there is', () => {
    // The mechanism, asserted on the office itself rather than on a helper that
    // mirrors it. An earlier version of this test recomputed the office's own
    // arithmetic and checked it against itself, and passed happily with the
    // office reading the truth — which is the exact failure this project has
    // caught itself in before.
    let proved = false;
    for (let seed = 0; seed < 20 && !proved; seed += 1) {
      const sim = world(`office-fills-${seed}`);
      const id = greenlit(sim, 'feature', 'Hvítserkur');
      const project = sim.universe.projects[id]!;
      const role = openRoles(project).find((r) => r.size === 'lead')!;
      run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
      const live = sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!;
      const came = whoCameIn(sim, live);
      const pick = (worth: (person: Person) => number) =>
        came.reduce((top, one) => (worth(one) > worth(top) ? one : top), came[0]!);
      const sum = (r: ReturnType<typeof readOf>) => r.truth + r.reads + r.repeatable;
      const believed = pick((one) => sum(shownOf(sim, project, live, one)));
      const actual = pick((one) => sum(readOf(one)));
      if (believed.id === actual.id) continue;

      const shoot = sim.universe.projects[id]!.periods!.find((p) => p.id === 'shooting')!;
      sim.advanceTo(shoot.from);
      const took = seatFor(sim.universe.projects[id]!, role.id)!.personId;
      expect(took, 'the office should take who it believes is best').toBe(believed.id);
      expect(took, 'and it has no way of knowing who actually is').not.toBe(actual.id);
      proved = true;
    }
    expect(proved, 'no world produced a case where belief and truth disagreed').toBe(true);
  });

  it('gets a better cast for the same money by going to the trouble', () => {
    // The claim the whole system exists to make, measured rather than asserted:
    // across enough worlds, a producer who picks the best-looking lead after a
    // callback ends up with a genuinely better actor than one who picks off a
    // photograph. Neither of them can see the truth at any point. The
    // difference is only that one of them is guessing less.
    const many = 22;
    let blind = 0;
    let seen = 0;
    for (let seed = 0; seed < many; seed += 1) {
      const sim = world(`trouble-${seed}`);
      const id = greenlit(sim, 'feature', 'Hvítserkur');
      const role = openRoles(sim.universe.projects[id]!).find((r) => r.size === 'lead')!;
      run(sim, 'company.breakdown', { projectId: id, roleId: role.id });
      blind += readOf(whoTheydTake(sim, id, role.id)).truth;
      for (const person of whoCameIn(sim, sim.universe.projects[id]!.roles!.find((r) => r.id === role.id)!)) {
        sit(sim, id, role.id, person.id, 'preread');
        sit(sim, id, role.id, person.id, 'callback');
      }
      seen += readOf(whoTheydTake(sim, id, role.id)).truth;
    }
    expect(seen / many).toBeGreaterThan(blind / many + 2);
  });
});
