/**
 * The department engine, held to the claims it makes about itself.
 *
 * A budget that is a product rather than a figure has to be able to prove it, and the
 * proof is that every input moves the outcome in a direction somebody can name. So
 * these are mostly paired: change one thing, hold the rest still, and check that what
 * moved is what the design said would move — and, just as often, that what should not
 * have moved did not.
 *
 * The two that matter most are the ones about **max rather than sum**. A phase being
 * as long as its longest department is the whole reason a critical path exists, and it
 * is the property a careless refactor would quietly turn into an addition.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Demands } from '@/engine/content/material';
import type { Project } from '@/engine/domain/company';
import {
  BEST_TEAM, DEPARTMENTS, LEAST_TEAM, PHASES, departmentsIn, monthsFor, rateFor,
} from '@/engine/content/departments';
import { layOut, staffingOf, whatHoldsItUp } from '@/engine/world/schedule';
import {
  companyCash, engagementsOf, holdingsOf, parentCompany, projectsOf,
} from '@/engine/world/company';
import {
  signsPayOrPlay, somebodyAt, standingOn, theTrade, working, worksAboveOn,
} from '@/engine/world/people';
import { wantsPayOrPlay, worksAboveFor } from '@/engine/content/people';
import { walkTheMonth } from '@/engine/world/production';
import { onTheMarket } from '@/engine/world/material';
import { addMonths } from '@/engine/core/time';

const ZONE = 'Atlantic/Reykjavik';
const AT = Date.UTC(2031, 0, 1);

/** Money in, so a signing fee has something to come out of. */
function fund(sim: ReturnType<typeof quickSave>, cents: number) {
  const company = parentCompany(sim.universe)!;
  const cash = Object.values(sim.universe.accounts)
    .find((one) => one.ownerId === company.id && one.kind === 'company_cash' && !one.closedAt)!;
  if (!sim.ledger.tryAccount('equity:capital')) {
    sim.ledger.open({
      id: 'equity:capital', saveId: sim.universe.meta.id, kind: 'equity', name: 'Capital',
      ownerId: 'world', balance: 0, openedAt: sim.now, nominal: true, category: 'business',
    });
  }
  const short = cents - cash.balance;
  if (short > 0) {
    sim.post({
      memo: 'Capital In', category: 'business',
      postings: [{ accountId: 'equity:capital', amount: -short }, { accountId: cash.id, amount: short }],
    });
  }
}
const plain = (over: Partial<Demands> = {}): Demands =>
  ({ scope: 3, spectacle: 3, period: 3, ...over });

describe('what a department costs', () => {
  it('charges more for a better team and takes exactly as long', () => {
    const demands = plain();
    const cheap = layOut(demands, {}, AT, ZONE);
    const dear = layOut(
      demands,
      Object.fromEntries(DEPARTMENTS.map((d) => [d.id, BEST_TEAM])),
      AT, ZONE,
    );
    expect(dear.budgetCents).toBeGreaterThan(cheap.budgetCents);
    expect(dear.months).toBe(cheap.months);
    expect(dear.deliversAt).toBe(cheap.deliversAt);
  });

  it('takes longer and costs more when the material asks for more', () => {
    const small = layOut(plain({ scope: 1 }), {}, AT, ZONE);
    const large = layOut(plain({ scope: 5 }), {}, AT, ZONE);
    expect(large.months).toBeGreaterThan(small.months);
    expect(large.budgetCents).toBeGreaterThan(small.budgetCents);
  });

  it('is a rate times a duration and nothing else', () => {
    const laid = layOut(plain(), { unit: 4 }, AT, ZONE);
    for (const phase of laid.phases) {
      for (const line of phase.lines) {
        expect(line.costCents).toBe(line.rateCents * line.months);
        expect(line.rateCents).toBe(rateFor(line.department, line.level));
      }
    }
  });

  it('clamps a team to the levels that exist', () => {
    const d = DEPARTMENTS[0]!;
    expect(rateFor(d, 0)).toBe(rateFor(d, LEAST_TEAM));
    expect(rateFor(d, 99)).toBe(rateFor(d, BEST_TEAM));
  });
});

describe('costs add and durations do not', () => {
  it('makes a phase as long as its longest department, not the sum of them', () => {
    const laid = layOut(plain({ scope: 5, spectacle: 1, period: 1 }), {}, AT, ZONE);
    for (const phase of laid.phases) {
      const longest = Math.max(...phase.lines.map((one) => one.months));
      const added = phase.lines.reduce((sum, one) => sum + one.months, 0);
      expect(phase.months).toBe(longest);
      if (phase.lines.length > 1) expect(phase.months).toBeLessThan(added);
    }
  });

  it('makes a phase cost the sum of its departments', () => {
    const laid = layOut(plain(), { design: 3 }, AT, ZONE);
    for (const phase of laid.phases) {
      expect(phase.costCents).toBe(phase.lines.reduce((sum, one) => sum + one.costCents, 0));
    }
  });

  it('makes the budget the sum of the phases', () => {
    const laid = layOut(plain({ spectacle: 5 }), { finishing: 5 }, AT, ZONE);
    expect(laid.budgetCents).toBe(laid.phases.reduce((sum, one) => sum + one.costCents, 0));
    expect(laid.months).toBe(laid.phases.reduce((sum, one) => sum + one.months, 0));
  });

  it('names the department a phase is waiting on', () => {
    const laid = layOut(plain({ scope: 5, spectacle: 1 }), {}, AT, ZONE);
    for (const phase of laid.phases) {
      const binding = phase.lines.find((one) => one.department.id === phase.bindingId);
      expect(binding).toBeDefined();
      expect(binding!.months).toBe(phase.months);
    }
  });

  it('names the one department holding the whole picture up', () => {
    const laid = layOut(plain({ scope: 5, spectacle: 1, period: 1 }), {}, AT, ZONE);
    const worst = whatHoldsItUp(laid)!;
    for (const phase of laid.phases) {
      for (const line of phase.lines) expect(line.months).toBeLessThanOrEqual(worst.months);
    }
  });

  it('saves money and no time when a department that was never binding is cut back', () => {
    // The consequence the max is there to produce, and the one a careless rewrite
    // would lose: shortening the wrong thing buys nothing.
    const heavy = plain({ scope: 5, spectacle: 1, period: 1 });
    const before = layOut(heavy, {}, AT, ZONE);
    const after = layOut({ ...heavy, spectacle: 1 }, { effects: BEST_TEAM }, AT, ZONE);
    expect(after.months).toBe(before.months);
    expect(after.budgetCents).toBeGreaterThan(before.budgetCents);
  });
});

describe('a department a picture does not need is not there', () => {
  it('leaves out anything whose months round to nothing', () => {
    const laid = layOut(plain({ spectacle: 0 }), {}, AT, ZONE);
    const ids = laid.phases.flatMap((p) => p.lines.map((l) => l.department.id));
    const zeroed = DEPARTMENTS.filter((d) => monthsFor(d, plain({ spectacle: 0 })) <= 0);
    for (const d of zeroed) expect(ids).not.toContain(d.id);
  });

  it('keeps a phase out entirely when nothing in it is needed', () => {
    // Every prep department reads period or scope, so a picture that asks nothing of
    // either has no prep at all and starts shooting.
    const none: Demands = { scope: 0, spectacle: 0, period: 0 };
    const prepNeeded = departmentsIn('prep').some((d) => monthsFor(d, none) > 0);
    const laid = layOut(none, {}, AT, ZONE);
    expect(laid.phases.some((p) => p.phase === 'prep')).toBe(prepNeeded);
  });
});

describe('the dates it hands back', () => {
  it('runs the phases one after another with no gap', () => {
    const laid = layOut(plain(), {}, AT, ZONE);
    expect(laid.phases[0]!.from).toBe(AT);
    for (let i = 1; i < laid.phases.length; i += 1) {
      expect(laid.phases[i]!.from).toBe(laid.phases[i - 1]!.to);
    }
    expect(laid.deliversAt).toBe(laid.phases[laid.phases.length - 1]!.to);
  });

  it('agrees with the calendar rather than counting thirty-day months', () => {
    const laid = layOut(plain(), {}, AT, ZONE);
    expect(laid.deliversAt).toBe(addMonths(AT, laid.months, ZONE));
  });

  it('keeps the phases in their fixed order', () => {
    const laid = layOut(plain(), {}, AT, ZONE);
    const order = laid.phases.map((one) => PHASES.indexOf(one.phase));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe('and it reaches a project', () => {
  it('gives budgetCents its first writer, off the material it is made from', () => {
    const sim = quickSave({}, 'sched-budget');
    // Option something from the market so the holding carries real demands.
    let at = sim.now;
    let listed = onTheMarket(sim, at);
    for (let i = 0; i < 24 && listed.length === 0; i += 1) {
      at = addMonths(at, 1, sim.homeZone);
      listed = onTheMarket(sim, at);
    }
    expect(listed.length).toBeGreaterThan(0);

    const took = sim.execute({ kind: 'company.option', payload: { listingId: listed[0]!.id } });
    expect(took.ok).toBe(true);
    const holding = holdingsOf(sim.universe)[0]!;
    expect(holding.demands).toBeDefined();

    const made = sim.execute({
      kind: 'company.develop',
      payload: { title: holding.title, holdingId: holding.id },
    });
    expect(made.ok).toBe(true);

    const project = projectsOf(sim.universe).find((one) => one.title === holding.title)!;
    expect(project.budgetCents).toBeGreaterThan(0);
    expect(project.budgetCents).toBe(layOut(holding.demands, {}, sim.now, sim.homeZone).budgetCents);
  });

  it('gives a typed title demands of its own, the same ones every time', () => {
    const sim = quickSave({}, 'sched-typed');
    sim.execute({ kind: 'company.option', payload: { title: 'A Thing I Thought Of' } });
    const first = holdingsOf(sim.universe)[0]!.demands;

    const again = quickSave({}, 'sched-typed');
    again.execute({ kind: 'company.option', payload: { title: 'A Thing I Thought Of' } });
    expect(holdingsOf(again.universe)[0]!.demands).toEqual(first);
  });
});

describe('putting somebody on a department is the other half of the budget', () => {
  /** A save with a project that has real material under it. */
  function aPicture(seed: string) {
    const sim = quickSave({}, seed);
    // A typed title rather than something off the market, deliberately. These cases
    // are about staffing and a holding from either route carries demands, so drawing
    // from the pool would only make them fail on seeds for reasons about the market.
    //
    // The first version did search the pool, forward through months until it found
    // something — and then optioned that id against `sim.now`. `listingById` resolves
    // against the current month because the market churns, so a listing from six
    // months ahead correctly did not exist yet and the option was refused. The API was
    // right and the test was wrong.
    fund(sim, 50_000_000_00);
    sim.execute({ kind: 'company.option', payload: { title: `Something For ${seed}` } });
    const holding = holdingsOf(sim.universe)[0]!;
    sim.execute({
      kind: 'company.develop',
      payload: { title: holding.title, holdingId: holding.id },
    });
    const project = projectsOf(sim.universe).find((one) => one.title === holding.title)!;
    return { sim, holding, project };
  }

  const staff = (sim: ReturnType<typeof quickSave>, payload: Record<string, unknown>) => {
    const done = sim.execute({ kind: 'company.staff', payload });
    const said = done.value as { ok: boolean; error?: string } | undefined;
    return { ok: said?.ok ?? done.ok, why: said?.error ?? done.error ?? '' };
  };

  /** A department this picture actually needs, so the case is never vacuous. */
  const needed = (holding: { demands: Demands }) =>
    DEPARTMENTS.find((d) => monthsFor(d, holding.demands) > 0)!;

  /**
   * Somebody plain at a rung who will actually take this picture.
   *
   * Steps down when the rung asked for will not have it, which is what a player does
   * and what the minimum-budget term is for: a small picture cannot have the best
   * designer at any price. Without the stepping these cases asked for the top rung on
   * a typed original and were correctly refused.
   */
  const someone = (
    sim: ReturnType<typeof quickSave>, project: Project, discipline: string, standing: number,
  ) => {
    const holding = sim.universe.holdings[project.holdingId!]!;
    for (let rung = standing; rung >= LEAST_TEAM; rung -= 1) {
      const who = somebodyAt(
        sim, engagementsOf(sim.universe), discipline, rung, sim.now, sim.now,
      );
      if (!who) continue;
      const at = standingOn(who, sim.now, sim.homeZone);
      const would = layOut(
        holding.demands, { ...staffingOf(project), [discipline]: at }, sim.now, sim.homeZone,
      ).budgetCents;
      if (worksAboveOn(who, sim.now, sim.homeZone) <= would) return who;
    }
    throw new Error(`nobody in ${discipline} will take this one`);
  };

  it('raises what it costs when a better person is put on it', () => {
    // This case used to assert that the months did *not* move, and that was true of a
    // bare rung: hiring up bought quality and never time. It stopped being true when
    // rungs became people, because a temperament moves the months as well as the rate.
    // The claim that survives is the one about money, and the months became the
    // subject of their own case below rather than a clause in this one.
    const { sim, holding, project } = aPicture('staff-cost');
    const d = needed(holding);
    staff(sim, {
      projectId: project.id, departmentId: d.id, personId: someone(sim, project, d.id, LEAST_TEAM).id,
    });
    const cheap = project.budgetCents!;

    const dear = someone(sim, project, d.id, BEST_TEAM);
    const done = staff(sim, { projectId: project.id, departmentId: d.id, personId: dear.id });
    expect(done.ok, done.why).toBe(true);
    expect(project.budgetCents!).toBeGreaterThan(cheap);
  });

  it('lets a temperament move the months, which a rung never could', () => {
    // The falsifiability test for temperament. Same picture, same rung, and the
    // schedule has to disagree — otherwise `takes` is a number nothing reads and the
    // distinction between what somebody can do and what they are like is decoration.
    const demands = { scope: 3, spectacle: 3, period: 3 };
    const plain = layOut(demands, { unit: { level: 3, spends: 1, takes: 1, lifts: 0 } }, AT, ZONE);
    const slow = layOut(demands, { unit: { level: 3, spends: 1, takes: 1.2, lifts: 0 } }, AT, ZONE);
    const quick = layOut(demands, { unit: { level: 3, spends: 1, takes: 0.85, lifts: 0 } }, AT, ZONE);
    expect(slow.months).toBeGreaterThan(plain.months);
    expect(quick.months).toBeLessThanOrEqual(plain.months);
    expect(slow.deliversAt).toBeGreaterThan(plain.deliversAt);
  });

  it('charges more for somebody who spends more, at the very same rung', () => {
    const demands = { scope: 3, spectacle: 3, period: 3 };
    const thrifty = layOut(demands, { unit: { level: 3, spends: 1, takes: 1, lifts: 0 } }, AT, ZONE);
    const loose = layOut(demands, { unit: { level: 3, spends: 1.25, takes: 1, lifts: 0 } }, AT, ZONE);
    expect(loose.budgetCents).toBeGreaterThan(thrifty.budgetCents);
    expect(loose.months).toBe(thrifty.months);
  });

  it('reads the work at a rung the money did not buy', () => {
    // `spends` and `takes` reach the ledger and the calendar. `lifts` reaches neither:
    // it moves the rung the craft is read at, which is what a picture's take reads.
    // Without this an exacting hire would cost more, take longer and be worth nothing
    // for either.
    const demands = { scope: 3, spectacle: 3, period: 3 };
    const steady = layOut(demands, { unit: { level: 3, spends: 1, takes: 1, lifts: 0 } }, AT, ZONE);
    const exacting = layOut(demands, { unit: { level: 3, spends: 1, takes: 1, lifts: 0.5 } }, AT, ZONE);
    const unit = (one: typeof steady) => one.phases
      .flatMap((phase) => phase.lines).find((each) => each.department.id === 'unit')!;
    expect(unit(exacting).reads).toBeGreaterThan(unit(steady).reads);
    expect(unit(exacting).level).toBe(unit(steady).level);
  });

  it('recomputes rather than adjusting, so hiring twice is not hiring twice over', () => {
    const { sim, holding, project } = aPicture('staff-twice');
    const d = needed(holding);
    const who = someone(sim, project, d.id, BEST_TEAM);
    staff(sim, { projectId: project.id, departmentId: d.id, personId: who.id });
    const once = project.budgetCents!;
    staff(sim, { projectId: project.id, departmentId: d.id, personId: who.id });
    expect(project.budgetCents!).toBe(once);
  });

  it('comes back down when somebody cheaper is put on instead', () => {
    const { sim, holding, project } = aPicture('staff-down');
    const d = needed(holding);
    staff(sim, {
      projectId: project.id, departmentId: d.id, personId: someone(sim, project, d.id, BEST_TEAM).id,
    });
    const dear = project.budgetCents!;
    staff(sim, {
      projectId: project.id, departmentId: d.id, personId: someone(sim, project, d.id, LEAST_TEAM).id,
    });
    expect(project.budgetCents!).toBeLessThan(dear);
  });

  it('will not put the same person on two pictures across the same months', () => {
    // The whole reason an engagement carries dates. A pool where nobody is ever
    // unavailable is a price list with names on it.
    const { sim, holding, project } = aPicture('staff-clash');
    const d = needed(holding);
    const who = someone(sim, project, d.id, BEST_TEAM);
    expect(staff(sim, { projectId: project.id, departmentId: d.id, personId: who.id }).ok)
      .toBe(true);

    sim.execute({ kind: 'company.option', payload: { title: 'The Other One' } });
    const other = holdingsOf(sim.universe).find((one) => one.title === 'The Other One')!;
    sim.execute({
      kind: 'company.develop',
      payload: { title: other.title, holdingId: other.id },
    });
    const second = projectsOf(sim.universe).find((one) => one.title === other.title)!;
    if (monthsFor(d, other.demands) > 0) {
      const clash = staff(sim, { projectId: second.id, departmentId: d.id, personId: who.id });
      expect(clash.ok).toBe(false);
      expect(clash.why).toContain('working');
    }
  });

  it('refuses somebody who does not run this department', () => {
    const { sim, holding, project } = aPicture('staff-wrongtrade');
    const d = needed(holding);
    const elsewhere = DEPARTMENTS.find((one) => one.id !== d.id)!;
    const who = someone(sim, project, elsewhere.id, 3);
    expect(staff(sim, { projectId: project.id, departmentId: d.id, personId: who.id }).ok)
      .toBe(false);
  });

  it('refuses a department that does not exist', () => {
    const { sim, project } = aPicture('staff-nodept');
    expect(staff(sim, { projectId: project.id, departmentId: 'catering', personId: 'unit:0' }).ok)
      .toBe(false);
  });

  it('refuses somebody the trade has never heard of', () => {
    const { sim, holding, project } = aPicture('staff-nobody');
    const d = needed(holding).id;
    expect(staff(sim, { projectId: project.id, departmentId: d, personId: 'nobody:99' }).ok)
      .toBe(false);
  });

  it('refuses a department this picture asks nothing of', () => {
    const { sim, holding, project } = aPicture('staff-unneeded');
    const spare = DEPARTMENTS.find((d) => monthsFor(d, holding.demands) <= 0);
    if (spare) {
      const who = someone(sim, project, spare.id, 3);
      expect(staff(sim, { projectId: project.id, departmentId: spare.id, personId: who.id }).ok)
        .toBe(false);
    }
  });

  it('refuses a picture with no material under it to cost', () => {
    const sim = quickSave({}, 'staff-bare');
    sim.execute({ kind: 'company.develop', payload: { title: 'Nothing Behind It' } });
    const bare = projectsOf(sim.universe).find((one) => one.title === 'Nothing Behind It')!;
    expect(staff(sim, {
      projectId: bare.id, departmentId: DEPARTMENTS[0]!.id, personId: 'unit:0',
    }).ok).toBe(false);
  });
});

/**
 * The two terms that are not a price, and the state they finally made reachable.
 *
 * A contract in this build had been money and nothing else: a rate, a fee. These are
 * the first two terms that transfer something other than cash, and each was chosen
 * because something already in the build could read it.
 *
 * **What somebody will not do at any price** is the hard edge of the decision the
 * ceiling on the take created. Matching the team to the material was an argument about
 * arithmetic, and a player with deep pockets could simply eat being wrong. A minimum
 * budget makes the small picture *unable* to have the best designer.
 *
 * **Pay-or-play** is what gives stopping a price. `Project.shelvedAt` had been read in
 * six places and written by nothing since before the first teardown — five guards
 * against a state no input could reach — and the reason to write it now rather than
 * then is that there is finally something for it to cost.
 */
describe('a contract is more than a price', () => {

  it('asks nothing of the bottom rung and a great deal of the top', () => {
    expect(worksAboveFor(LEAST_TEAM, 0.5)).toBe(0);
    expect(worksAboveFor(BEST_TEAM, 0.5)).toBeGreaterThan(worksAboveFor(3, 0.5));
    expect(worksAboveFor(3, 0.5)).toBeGreaterThan(worksAboveFor(2, 0.5));
  });

  it('lets two people at the same rung insist on different things', () => {
    // Without this the term is a second name for standing, and a shortlist of four
    // would offer four identical answers to the only question it asks.
    expect(worksAboveFor(BEST_TEAM, 0)).toBeLessThan(worksAboveFor(BEST_TEAM, 1));
  });

  it('refuses somebody who will not work on a picture this small', () => {
    // The falsifiability test for the term: it has to be able to stop a hire that
    // money alone would have bought.
    const sim = quickSave({}, 'terms-small');
    fund(sim, 900_000_000_00);
    sim.execute({ kind: 'company.option', payload: { title: 'A Very Small One' } });
    const holding = holdingsOf(sim.universe)[0]!;
    sim.execute({
      kind: 'company.develop',
      payload: { title: holding.title, holdingId: holding.id },
    });
    const project = projectsOf(sim.universe).find((one) => one.title === holding.title)!;
    const d = DEPARTMENTS.find((one) => monthsFor(one, holding.demands) > 0)!;

    // Whoever in this trade insists on the most, against the smallest possible
    // picture. If nobody insists on more than it costs, there is nothing to assert.
    const free = theTrade(sim, d.id)
      .filter((one) => working(one, sim.now, sim.homeZone));
    const fussiest = free.reduce((most, one) => (
      worksAboveOn(one, sim.now, sim.homeZone) > worksAboveOn(most, sim.now, sim.homeZone)
        ? one : most
    ));
    // The picture at their standard, which is the figure the command judges by —
    // not the budget as it stands. Asking the old way made this case disagree with
    // the command about what a picture costs, and it was the case that was wrong.
    const at = standingOn(fussiest, sim.now, sim.homeZone);
    const scale: Record<string, number> = {};
    for (const one of DEPARTMENTS) {
      if (monthsFor(one, holding.demands) > 0) scale[one.id] = at;
    }
    const would = layOut(holding.demands, scale, sim.now, sim.homeZone).budgetCents;

    if (worksAboveOn(fussiest, sim.now, sim.homeZone) > would) {
      const done = sim.execute({
        kind: 'company.staff',
        payload: { projectId: project.id, departmentId: d.id, personId: fussiest.id },
      });
      const said = done.value as { ok: boolean; error?: string } | undefined;
      expect(said?.ok).toBe(false);
      expect(said?.error).toContain('under');
    }
  });

  it('signs pay-or-play at the top far more often than at the bottom', () => {
    const share = (standing: number) => Array.from({ length: 200 }, (_, i) => i / 200)
      .filter((t) => wantsPayOrPlay(standing, t)).length / 200;
    expect(share(BEST_TEAM)).toBeGreaterThan(share(LEAST_TEAM));
    expect(share(LEAST_TEAM)).toBeLessThan(0.2);
  });
});

describe('taking one off the slate', () => {
  /** A picture with one department staffed, and the money to have done it. */
  function aStaffedPicture(seed: string) {
    const sim = quickSave({}, seed);
    fund(sim, 900_000_000_00);
    sim.execute({ kind: 'company.option', payload: { title: `Dropping ${seed}` } });
    const holding = holdingsOf(sim.universe)[0]!;
    sim.execute({
      kind: 'company.develop',
      payload: { title: holding.title, holdingId: holding.id },
    });
    const project = projectsOf(sim.universe).find((one) => one.title === holding.title)!;
    return { sim, holding, project };
  }

  const ran = (sim: ReturnType<typeof quickSave>, kind: string, payload: Record<string, unknown>) => {
    const done = sim.execute({ kind, payload });
    const said = done.value as { ok: boolean; error?: string; owedCents?: number } | undefined;
    return {
      ok: said?.ok ?? done.ok,
      why: said?.error ?? done.error ?? '',
      owed: said?.owedCents,
    };
  };

  it('writes the one field on a project that nothing could ever write', () => {
    // Six things read `shelvedAt` and nothing set it, which is a guard against a
    // state the save could not reach. This is the writer.
    const { sim, project } = aStaffedPicture('drop-writes');
    expect(project.shelvedAt).toBeUndefined();
    expect(ran(sim, 'company.shelve', { projectId: project.id }).ok).toBe(true);
    expect(project.shelvedAt).toBe(sim.now);
  });

  it('takes it out of the slate the rest of the build reads', () => {
    const { sim, project } = aStaffedPicture('drop-gone');
    expect(projectsOf(sim.universe).some((one) => one.id === project.id)).toBe(true);
    ran(sim, 'company.shelve', { projectId: project.id });
    expect(projectsOf(sim.universe).some((one) => one.id === project.id)).toBe(false);
  });

  it('costs nothing when nobody was promised it would happen', () => {
    const { sim, project } = aStaffedPicture('drop-free');
    const before = companyCash(sim.universe);
    const done = ran(sim, 'company.shelve', { projectId: project.id });
    expect(done.ok, done.why).toBe(true);
    expect(done.owed).toBe(0);
    expect(companyCash(sim.universe)).toBe(before);
  });

  it('costs real money when somebody on it signed pay-or-play', () => {
    // The whole point of the term. What stopping costs has to depend on who is
    // attached, or it is a flat cancellation fee wearing a better name.
    const { sim, holding, project } = aStaffedPicture('drop-owed');
    const d = DEPARTMENTS.find((one) => monthsFor(one, holding.demands) > 0)!;
    const signed = theTrade(sim, d.id).find((one) => (
      working(one, sim.now, sim.homeZone)
      && signsPayOrPlay(one, sim.now, sim.homeZone)
      && worksAboveOn(one, sim.now, sim.homeZone) === 0
    ));
    // Only assertable where the trade actually offers such a person for this
    // department, which is most seeds and is checked rather than assumed.
    if (!signed) return;

    const hired = ran(sim, 'company.staff', {
      projectId: project.id, departmentId: d.id, personId: signed.id,
    });
    expect(hired.ok, hired.why).toBe(true);
    expect(project.hires?.[d.id]?.payOrPlay).toBe(true);

    const before = companyCash(sim.universe);
    const done = ran(sim, 'company.shelve', { projectId: project.id });
    expect(done.ok, done.why).toBe(true);
    expect(done.owed!).toBeGreaterThan(0);
    expect(companyCash(sim.universe)).toBe(before - done.owed!);
  });

  it('will not drop the same one twice', () => {
    const { sim, project } = aStaffedPicture('drop-twice');
    expect(ran(sim, 'company.shelve', { projectId: project.id }).ok).toBe(true);
    expect(ran(sim, 'company.shelve', { projectId: project.id }).ok).toBe(false);
  });

  it('refuses one that is finished, because that is a release and not a drop', () => {
    const { sim, project } = aStaffedPicture('drop-done');
    ran(sim, 'company.lock_budget', { projectId: project.id });
    ran(sim, 'company.greenlight', { projectId: project.id });
    let at = project.greenlitAt!;
    for (let m = 0; m < 60 && project.stage !== 'delivered'; m += 1) {
      at = addMonths(at, 1, sim.homeZone);
      walkTheMonth(sim, at);
    }
    expect(project.stage).toBe('delivered');
    const done = ran(sim, 'company.shelve', { projectId: project.id });
    expect(done.ok).toBe(false);
    expect(done.why).toContain('finished');
  });
});
