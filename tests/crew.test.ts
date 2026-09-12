/**
 * SLATE — people, generated because a title needed them.
 *
 * What these hold, in order of how much they matter:
 *
 * A person exists because a production needed them. The save opens with a
 * family and nobody else; greenlighting a picture is what puts a gaffer in the
 * world, and she is still there when it is delivered.
 *
 * They come back. A company that keeps making pictures accumulates a crew, and
 * the next picture is staffed by people the last one found. If that ever stops
 * being true, hiring is a name generator and nothing about who you keep matters.
 *
 * And they arrive on a calendar rather than all at once, because a unit
 * production manager is on a picture ten weeks before the camera turns over and
 * a boom operator is on it for one.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { projectsOf } from '@/engine/world/company';
import { MS_WEEK } from '@/engine/world/lot';
import { POSTS, postById, prepScale } from '@/engine/content/crew';
import { MEN, WOMEN } from '@/engine/content/names';
import {
  crewOf, decideHire, endFor, freeAcross, heldBefore, onItAt, postsFor,
  standingReads, startFor, whereTheCrewStands,
} from '@/engine/world/crew';
import { finishesBy, heldUpBy, windowOf } from '@/engine/world/making';

interface Done { ok: boolean; id?: string; error?: string }

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

const world = (seed = 'crew'): Simulation => quickSave({}, seed);

/** Greenlights one and gives back its id. */
function makeIt(sim: Simulation, title: string, over: Record<string, unknown> = {}): string {
  run(sim, 'company.develop', { title, medium: 'film' });
  const id = projectsOf(sim.universe).find((one) => one.title === title)!.id;
  const done = run(sim, 'company.greenlight', {
    projectId: id, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 6, ...over,
  });
  expect(done.error).toBeUndefined();
  return id;
}

/** Runs a picture all the way to delivered. */
function deliver(sim: Simulation, id: string): void {
  for (let i = 0; i < 8; i += 1) {
    const done = finishesBy(sim.universe.projects[id]!)!;
    if (sim.now > done) break;
    sim.advanceTo(done + MS_DAY);
  }
  for (const element of heldUpBy(sim.universe.projects[id]!)) {
    run(sim, 'company.deliver', { projectId: id, elementId: element.id });
  }
}

const crewPeople = (sim: Simulation): string[] => Object.values(sim.universe.people)
  .filter((p) => p.careerTrack === 'crew').map((p) => p.id);

// ---------------------------------------------------------------------------

describe('a picture brings people into existence', () => {
  it('opens a save with a family and no industry at all', () => {
    const sim = world('empty');
    expect(crewPeople(sim)).toHaveLength(0);
  });

  it('puts people in the world once a picture has dates', () => {
    const sim = world('hired');
    const id = makeIt(sim, 'Hvítserkur');
    expect(crewPeople(sim)).toHaveLength(0);
    // The first arrivals are weeks out, so time has to pass.
    deliver(sim, id);
    expect(crewPeople(sim).length).toBeGreaterThan(0);
    expect(sim.universe.projects[id]!.crew!.length).toBeGreaterThan(0);
  });

  it('keeps them after the picture is delivered, because they are people', () => {
    const sim = world('persist');
    const id = makeIt(sim, 'Hvítserkur');
    deliver(sim, id);
    const after = crewPeople(sim);
    expect(sim.universe.projects[id]!.stage).toBe('delivered');
    expect(after.length).toBeGreaterThan(0);
    sim.advanceTo(sim.now + 400 * MS_DAY);
    expect(crewPeople(sim)).toEqual(after);
  });

  it('leaves the save sound through all of it', () => {
    const sim = world('sound');
    const id = makeIt(sim, 'Hvítserkur');
    deliver(sim, id);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
  });
});

describe('how many people a picture can afford', () => {
  it('carries more posts the more it costs', () => {
    const small = postsFor(200_000_00);
    const mid = postsFor(2_000_000_00);
    const big = postsFor(40_000_000_00);
    expect(small.length).toBeLessThan(mid.length);
    expect(mid.length).toBeLessThan(big.length);
    expect(big).toHaveLength(POSTS.length);
  });

  it('keeps the posts nothing can be made without, at any price', () => {
    // A picture with no money still has somebody running it, somebody running
    // the floor, somebody designing it and somebody pointing the camera.
    const bare = postsFor(0).map((p) => p.id);
    expect(bare).toContain('upm');
    expect(bare).toContain('firstad');
    expect(bare).toContain('designer');
    expect(bare).toContain('dp');
  });

  it('drops the second pair of hands first, not the head', () => {
    const lean = postsFor(500_000_00).map((p) => p.id);
    // The DP is there and operates the camera themselves.
    expect(lean).toContain('dp');
    expect(lean).not.toContain('operator');
    // The makeup key is there; the hair key is folded in.
    expect(lean).not.toContain('keyhair');
  });
});

describe('they arrive on a calendar', () => {
  it('starts the money and the design long before the camera', () => {
    const sim = world('calendar');
    const id = makeIt(sim, 'Hvítserkur');
    const project = sim.universe.projects[id]!;
    const shoot = windowOf(project, 'shooting')!;
    const upm = startFor(project, postById('upm')!, 0);
    const boom = startFor(project, postById('boom')!, 0);
    expect(upm).toBeLessThan(boom);
    expect(boom).toBeLessThanOrEqual(shoot.from);
  });

  it('does not bring everybody on at once', () => {
    const sim = world('stagger');
    const id = makeIt(sim, 'Hvítserkur');
    const project = () => sim.universe.projects[id]!;
    const shoot = windowOf(project(), 'shooting')!;

    // Part way through prep, some people are on and some are not.
    sim.advanceTo(shoot.from - 3 * MS_WEEK);
    const early = (project().crew ?? []).length;
    expect(early).toBeGreaterThan(0);
    expect(early).toBeLessThan(postsFor(project().budgetCents!).length);

    deliver(sim, id);
    expect((project().crew ?? []).length).toBe(postsFor(project().budgetCents!).length);
  });

  it('keeps the accountant on long after everybody else has gone', () => {
    const sim = world('tail');
    const id = makeIt(sim, 'Hvítserkur');
    const project = sim.universe.projects[id]!;
    const shoot = windowOf(project, 'shooting')!;
    const accountant = endFor(project, postById('accountant')!)!;
    const camera = endFor(project, postById('operator')!)!;
    expect(camera).toBeLessThanOrEqual(shoot.to + MS_WEEK);
    expect(accountant).toBeGreaterThan(camera);
  });

  it('compresses prep on a short picture and stretches it on a long one', () => {
    expect(prepScale(3)).toBeLessThan(prepScale(6));
    expect(prepScale(12)).toBeGreaterThan(prepScale(6));
    // And never to nothing, or a picture would hire everybody on day one.
    expect(prepScale(1)).toBeGreaterThan(0.3);
  });

  it('says who is on it on a given day, which is not everybody', () => {
    const sim = world('onit');
    const id = makeIt(sim, 'Hvítserkur');
    const project = () => sim.universe.projects[id]!;
    deliver(sim, id);
    const shoot = windowOf(project(), 'shooting')!;
    const onTheDay = onItAt(sim, project(), shoot.from + MS_DAY);
    const everybody = crewOf(sim, project());
    expect(onTheDay.length).toBeGreaterThan(0);
    expect(onTheDay.length).toBeLessThanOrEqual(everybody.length);
    // Months after wrap, almost nobody.
    const later = onItAt(sim, project(), shoot.to + 8 * MS_WEEK);
    expect(later.length).toBeLessThan(onTheDay.length);
  });
});

describe('they come back', () => {
  it('staffs a second picture partly with people the first one found', () => {
    const sim = world('again');
    const first = makeIt(sim, 'Hvítserkur');
    deliver(sim, first);
    const found = crewPeople(sim).length;
    expect(found).toBeGreaterThan(0);

    const second = makeIt(sim, 'Reykjadalur');
    deliver(sim, second);
    const secondCrew = (sim.universe.projects[second]!.crew ?? []).map((s) => s.personId);
    const firstCrew = new Set((sim.universe.projects[first]!.crew ?? []).map((s) => s.personId));
    const rehired = secondCrew.filter((id) => firstCrew.has(id));
    expect(rehired.length, 'nobody came back').toBeGreaterThan(0);
    // And the world did not double in size to staff it.
    expect(crewPeople(sim).length).toBeLessThan(found * 2);
  });

  it('remembers who held a post for the company', () => {
    const sim = world('memory');
    const id = makeIt(sim, 'Hvítserkur');
    deliver(sim, id);
    const project = sim.universe.projects[id]!;
    const seat = (project.crew ?? []).find((s) => s.postId === 'upm')!;
    expect(heldBefore(sim, project.companyId, 'upm')).toContain(seat.personId);
  });

  it('never puts the same person on two pictures at once', () => {
    const sim = world('clash');
    const first = makeIt(sim, 'Hvítserkur');
    // A second picture overlapping the first, so the dates genuinely collide.
    makeIt(sim, 'Reykjadalur', { from: windowOf(sim.universe.projects[first]!, 'prep')!.from });
    sim.advanceTo(sim.now + 600 * MS_DAY);

    const seats = Object.values(sim.universe.projects).flatMap((p) => p.crew ?? []);
    for (const seat of seats) {
      const others = seats.filter((o) => o !== seat && o.personId === seat.personId);
      for (const other of others) {
        const overlaps = other.from < seat.to && seat.from < other.to;
        expect(overlaps, `${seat.personId} is in two places at once`).toBe(false);
      }
    }
  });

  it('reports somebody as free only when they actually are', () => {
    const sim = world('free');
    const id = makeIt(sim, 'Hvítserkur');
    deliver(sim, id);
    const seat = (sim.universe.projects[id]!.crew ?? [])[0]!;
    expect(freeAcross(sim, seat.personId, seat.from, seat.to)).toBe(false);
    expect(freeAcross(sim, seat.personId, seat.to + 100 * MS_DAY, seat.to + 200 * MS_DAY)).toBe(true);
  });
});

describe('who gets the job', () => {
  it('keeps a head harder than anybody under them', () => {
    // At two prior pictures a hand is kept on a roll under 0.61 and a head on a
    // roll under 0.81, so the gap between those two is where the difference
    // lives. A roll of 0.5 rehires either of them and proves nothing.
    const head = (roll: number) =>
      decideHire({ returning: 2, negativeCents: 20_000_000_00, head: true }, roll).returning;
    const hand = (roll: number) =>
      decideHire({ returning: 2, negativeCents: 20_000_000_00, head: false }, roll).returning;
    expect(head(0.7)).toBe(true);
    expect(hand(0.7)).toBe(false);
    // And the same roll keeps both when it is low enough for anybody.
    expect(head(0.3)).toBe(true);
    expect(hand(0.3)).toBe(true);
  });

  it('reaches further on a bigger picture', () => {
    const small = decideHire({ returning: 0, negativeCents: 500_000_00, head: false }, 0.5);
    const big = decideHire({ returning: 0, negativeCents: 40_000_000_00, head: false }, 0.5);
    expect(big.standing).toBeGreaterThan(small.standing);
  });

  it('cannot rehire somebody who has never been here', () => {
    for (const roll of [0, 0.25, 0.5, 0.75, 0.99]) {
      expect(decideHire({ returning: 0, negativeCents: 20_000_000_00, head: true }, roll).returning)
        .toBe(false);
    }
  });

  it('bands a standing into words a person would use', () => {
    expect(standingReads(10)).toBe('unproven');
    expect(standingReads(99)).toBe('the best in the country');
    expect(standingReads(45)).not.toBe(standingReads(65));
  });
});

describe('the people are named like people from here', () => {
  it('builds a patronymic off a father rather than appending an s', () => {
    // Every genitive is written down because the rule is not a suffix. If this
    // ever becomes name + 's', Sigurður's children are called Sigurðursson.
    const sigurdur = MEN.find((m) => m.name === 'Sigurður')!;
    expect(sigurdur.of).toBe('Sigurðar');
    const arni = MEN.find((m) => m.name === 'Árni')!;
    expect(arni.of).toBe('Árna');
  });

  it('gives everybody a son or a dóttir name and a given name from the pool', () => {
    const sim = world('named');
    const id = makeIt(sim, 'Hvítserkur');
    deliver(sim, id);
    const given = new Set([...MEN.map((m) => m.name), ...WOMEN]);
    for (const person of Object.values(sim.universe.people)) {
      if (person.careerTrack !== 'crew') continue;
      expect(given.has(person.firstName), `${person.firstName} is not a name from the pool`).toBe(true);
      expect(person.lastName, person.displayName).toMatch(/(son|dóttir)$/);
      expect(person.displayName).toBe(`${person.firstName} ${person.lastName}`);
    }
  });

  it('draws a fresh name for every person instead of the same one repeatedly', () => {
    // A real bug a probe caught and these tests did not. `sim.rng` builds a new
    // generator on every call, so passing it as a closure handed back the same
    // first number forever: every given name equalled the father's name and a
    // crew of twenty-four came out as seven people called Sveinn Sveinsson.
    const sim = world('varied');
    const id = makeIt(sim, 'Hvítserkur');
    deliver(sim, id);
    const crew = crewOf(sim, sim.universe.projects[id]!);
    expect(crew.length).toBeGreaterThan(12);

    const names = new Set(crew.map((seat) => seat.person.displayName));
    expect(names.size, 'the same name came out more than twice').toBeGreaterThanOrEqual(crew.length - 2);

    // And nobody should be named off their own given name, which is what the
    // stuck generator produced every single time.
    const selfNamed = crew.filter((seat) => {
      const own = MEN.find((m) => m.name === seat.person.firstName);
      return own !== undefined && seat.person.lastName.startsWith(own.of);
    });
    expect(selfNamed.length).toBeLessThan(crew.length / 3);
  });

  it('leaves the craft sheet empty, because nothing reads a gaffer’s technique', () => {
    const sim = world('sheet');
    const id = makeIt(sim, 'Hvítserkur');
    deliver(sim, id);
    const one = Object.values(sim.universe.people).find((p) => p.careerTrack === 'crew')!;
    expect(one.traits).toEqual([]);
    expect(one.reputation.professionalReputation).toBeGreaterThan(0);
  });
});

describe('what the crew amounts to, said out loud', () => {
  it('says nobody is on it before anybody is', () => {
    const sim = world('said');
    const id = makeIt(sim, 'Hvítserkur');
    expect(whereTheCrewStands(sim, sim.universe.projects[id]!)).toContain('Nobody is on');
  });

  it('counts the posts filled once they are', () => {
    const sim = world('counted');
    const id = makeIt(sim, 'Hvítserkur');
    deliver(sim, id);
    const said = whereTheCrewStands(sim, sim.universe.projects[id]!);
    expect(said).toContain('posts filled');
  });
});
