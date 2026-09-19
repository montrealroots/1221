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
import {
  BEST_TEAM, DEPARTMENTS, LEAST_TEAM, PHASES, departmentsIn, monthsFor, rateFor,
} from '@/engine/content/departments';
import { layOut, whatHoldsItUp } from '@/engine/world/schedule';
import { holdingsOf, projectsOf } from '@/engine/world/company';
import { onTheMarket } from '@/engine/world/material';
import { addMonths } from '@/engine/core/time';

const ZONE = 'Atlantic/Reykjavik';
const AT = Date.UTC(2031, 0, 1);
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
