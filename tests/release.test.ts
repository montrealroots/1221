/**
 * Letting a picture out, and the two properties that make it a run rather than a payout.
 *
 * **Reckoned once.** The figure is settled the day it opens and nothing revises it, so
 * what a player is shown is what they get. A model that re-derived the total each
 * month would move money that had already been counted, and a receipt that explains a
 * reckoning which keeps changing explains nothing.
 *
 * **Paid slowly.** The deleted production system got this exactly wrong in the other
 * direction — it posted a whole picture's life in one transaction on the release date,
 * so a year of earnings arrived in an afternoon. Both halves matter, and both are
 * tested here.
 *
 * The third thing worth guarding is that what has been paid is **counted off the
 * ledger** rather than tracked beside it. There is a case that pays a run twice from
 * the same instant and expects the second call to do nothing, because a counter would
 * quietly pay it again.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { addMonths } from '@/engine/core/time';
import {
  CRAFT_REACHES, LUCK_SWINGS, PAYS_FOR_MONTHS, PAYS_IN, SCOPE_PULLS, SHARES_TOTAL,
  SPECTACLE_PULLS, reckon, whatItCouldReach,
} from '@/engine/content/release';
import { BEST_TEAM, DEPARTMENTS, monthsFor, rateFor } from '@/engine/content/departments';
import {
  craftOf, monthsPaid, onRelease, payWhatIsDue, stillPaying, takenSoFar,
} from '@/engine/world/release';
import { walkTheMonth } from '@/engine/world/production';
import { engagementsOf, holdingsOf, projectsOf, parentCompany } from '@/engine/world/company';
import { somebodyAt } from '@/engine/world/people';

type Said = { ok: boolean; error?: string; takeCents?: number };

const ran = (sim: ReturnType<typeof quickSave>, kind: string, payload: Record<string, unknown>) => {
  const done = sim.execute({ kind, payload });
  const said = done.value as Said | undefined;
  return { ok: said?.ok ?? done.ok, why: said?.error ?? done.error ?? '', took: said?.takeCents };
};

function fund(sim: ReturnType<typeof quickSave>, cents: number) {
  const company = parentCompany(sim.universe)!;
  const cash = Object.values(sim.universe.accounts)
    .find((one) => one.ownerId === company.id && one.kind === 'company_cash' && !one.closedAt)
    ?? sim.ledger.open({
      id: `acct:${company.id}:cash`,
      saveId: sim.universe.meta.id,
      kind: 'company_cash',
      name: 'Cash',
      ownerId: company.id,
      balance: 0,
      openedAt: sim.now,
      nominal: false,
      category: 'business',
    });
  if (!sim.ledger.tryAccount('equity:capital')) {
    sim.ledger.open({
      id: 'equity:capital',
      saveId: sim.universe.meta.id,
      kind: 'equity',
      name: 'Capital',
      ownerId: 'world',
      balance: 0,
      openedAt: sim.now,
      nominal: true,
      category: 'business',
    });
  }
  const short = cents - cash.balance;
  if (short > 0) {
    sim.post({
      memo: 'Capital In',
      category: 'business',
      postings: [{ accountId: 'equity:capital', amount: -short }, { accountId: cash.id, amount: short }],
    });
  }
}

/** A picture made all the way through and sitting finished. */
function aFinishedPicture(seed: string, best = false) {
  const sim = quickSave({}, seed);
  sim.execute({ kind: 'company.option', payload: { title: `Something For ${seed}` } });
  const holding = holdingsOf(sim.universe)[0]!;
  sim.execute({ kind: 'company.develop', payload: { title: holding.title, holdingId: holding.id } });
  const project = projectsOf(sim.universe).find((one) => one.title === holding.title)!;
  fund(sim, 900_000_000_00);

  if (best) {
    for (const d of DEPARTMENTS) {
      if (monthsFor(d, holding.demands) <= 0) continue;
      const who = somebodyAt(
        sim, engagementsOf(sim.universe), d.id, BEST_TEAM, sim.now, sim.now,
      );
      if (who) ran(sim, 'company.staff', { projectId: project.id, departmentId: d.id, personId: who.id });
    }
  }
  ran(sim, 'company.lock_budget', { projectId: project.id });
  ran(sim, 'company.greenlight', { projectId: project.id });

  // Walk it to the end so it is genuinely finished rather than declared so.
  let at = project.greenlitAt!;
  for (let m = 0; m < 60 && project.stage !== 'delivered'; m += 1) {
    at = addMonths(at, 1, sim.homeZone);
    walkTheMonth(sim, at);
  }
  expect(project.stage).toBe('delivered');
  return { sim, holding, project, at };
}

describe('what may be let out', () => {
  it('refuses one that was never made', () => {
    const sim = quickSave({}, 'rel-unmade');
    sim.execute({ kind: 'company.option', payload: { title: 'Not Made' } });
    const holding = holdingsOf(sim.universe)[0]!;
    sim.execute({ kind: 'company.develop', payload: { title: holding.title, holdingId: holding.id } });
    const project = projectsOf(sim.universe).find((one) => one.title === holding.title)!;
    const done = ran(sim, 'company.release', { projectId: project.id });
    expect(done.ok).toBe(false);
    expect(done.why).toContain('not been made');
  });

  it('refuses one still being made, and says which it is', () => {
    const sim = quickSave({}, 'rel-inflight');
    sim.execute({ kind: 'company.option', payload: { title: 'Still Going' } });
    const holding = holdingsOf(sim.universe)[0]!;
    sim.execute({ kind: 'company.develop', payload: { title: holding.title, holdingId: holding.id } });
    const project = projectsOf(sim.universe).find((one) => one.title === holding.title)!;
    fund(sim, 900_000_000_00);
    ran(sim, 'company.lock_budget', { projectId: project.id });
    ran(sim, 'company.greenlight', { projectId: project.id });
    const done = ran(sim, 'company.release', { projectId: project.id });
    expect(done.ok).toBe(false);
    expect(done.why).toContain('still being made');
  });

  it('will not let the same one out twice', () => {
    const { sim, project } = aFinishedPicture('rel-twice');
    expect(ran(sim, 'company.release', { projectId: project.id }).ok).toBe(true);
    expect(ran(sim, 'company.release', { projectId: project.id }).ok).toBe(false);
  });
});

describe('reckoned once', () => {
  it('settles the figure on the day it opens and stores it', () => {
    const { sim, project } = aFinishedPicture('rel-once');
    const done = ran(sim, 'company.release', { projectId: project.id });
    expect(done.ok, done.why).toBe(true);
    expect(project.takeCents).toBe(done.took);
    expect(project.releasedAt).toBe(sim.now);
  });

  it('never revises it, however long the run goes on', () => {
    const { sim, project } = aFinishedPicture('rel-stable');
    ran(sim, 'company.release', { projectId: project.id });
    const settled = project.takeCents!;
    let at = sim.now;
    for (let m = 0; m < PAYS_FOR_MONTHS + 3; m += 1) {
      at = addMonths(at, 1, sim.homeZone);
      payWhatIsDue(sim, project, at);
    }
    expect(project.takeCents).toBe(settled);
  });
});

describe('and paid slowly', () => {
  it('does not hand over the whole run on the opening day', () => {
    const { sim, project } = aFinishedPicture('rel-slow');
    ran(sim, 'company.release', { projectId: project.id });
    expect(takenSoFar(sim, project.id)).toBeLessThan(project.takeCents!);
    expect(monthsPaid(sim, project.id)).toBe(1);
  });

  it('pays the whole of it by the end and no more', () => {
    const { sim, project } = aFinishedPicture('rel-whole');
    ran(sim, 'company.release', { projectId: project.id });
    let at = sim.now;
    for (let m = 0; m < PAYS_FOR_MONTHS + 4; m += 1) {
      at = addMonths(at, 1, sim.homeZone);
      payWhatIsDue(sim, project, at);
    }
    expect(monthsPaid(sim, project.id)).toBe(PAYS_FOR_MONTHS);
    // Rounding per month against the total, across ten months.
    const out = takenSoFar(sim, project.id);
    expect(Math.abs(out - project.takeCents!) / project.takeCents!).toBeLessThan(0.001);
    expect(stillPaying(sim, project)).toBe(false);
  });

  it('counts what has been paid off the ledger, so paying twice pays once', () => {
    const { sim, project } = aFinishedPicture('rel-idem');
    ran(sim, 'company.release', { projectId: project.id });
    const after = addMonths(sim.now, 3, sim.homeZone);
    payWhatIsDue(sim, project, after);
    const once = takenSoFar(sim, project.id);
    payWhatIsDue(sim, project, after);
    payWhatIsDue(sim, project, after);
    expect(takenSoFar(sim, project.id)).toBe(once);
  });

  it('catches up a month that was missed rather than losing it', () => {
    const { sim, project } = aFinishedPicture('rel-catchup');
    ran(sim, 'company.release', { projectId: project.id });
    // Nothing ran for five months, and then something did.
    payWhatIsDue(sim, project, addMonths(sim.now, 5, sim.homeZone));
    expect(monthsPaid(sim, project.id)).toBe(6);
  });

  it('is on release until it is out', () => {
    const { sim, project } = aFinishedPicture('rel-list');
    expect(onRelease(sim)).toHaveLength(0);
    ran(sim, 'company.release', { projectId: project.id });
    expect(onRelease(sim).map((one) => one.id)).toContain(project.id);
  });
});

describe('what decides the figure', () => {
  it('spreads the whole run and loses none of it', () => {
    expect(PAYS_IN).toHaveLength(PAYS_FOR_MONTHS);
    expect(Math.abs(SHARES_TOTAL - 1)).toBeLessThan(0.0001);
  });

  it('returns more for better craft, on the same reach and the same luck', () => {
    const poor = reckon(10_000_000_00, 0, 0.5);
    const good = reckon(10_000_000_00, 1, 0.5);
    expect(good).toBeGreaterThan(poor);
  });

  it('collects the floor of the reach at the worst craft and all of it at the best', () => {
    expect(reckon(10_000_000_00, 0, 0.5)).toBe(Math.round(10_000_000_00 * CRAFT_REACHES));
    expect(reckon(10_000_000_00, 1, 0.5)).toBe(10_000_000_00);
  });

  it('never lets a picture out-earn the audience its material could find', () => {
    // The ceiling is the point of the model. Best craft, luckiest draw there is: still
    // bounded by the reach, times what the draw is allowed to add and no more.
    const reach = 10_000_000_00;
    const luckiest = reckon(reach, 1, 1);
    expect(luckiest).toBe(Math.round(reach * (1 + LUCK_SWINGS)));
  });

  it('never returns a negative run, whatever it is handed', () => {
    expect(reckon(0, 0, 0)).toBe(0);
    expect(reckon(1_000_000_00, -5, -5)).toBeGreaterThanOrEqual(0);
  });

  it('reads the craft that was actually hired, weighted by how long it worked', () => {
    const cheap = aFinishedPicture('rel-craft-low');
    const dear = aFinishedPicture('rel-craft-high', true);
    expect(craftOf(dear.sim, dear.project)).toBeGreaterThan(craftOf(cheap.sim, cheap.project));
  });
});

/**
 * The ceiling, which is the claim that makes hiring a decision.
 *
 * Before this, a take was a multiple of a budget, so spending more returned more with
 * no bound and the best team was correct on every picture ever made — measured over
 * five-year careers in `tools/career.mjs`, not guessed at. Reach is what stops that:
 * the audience is fixed by the material before anybody is hired, and the crew decides
 * only how much of it gets collected.
 */
describe('the ceiling is the material, not the money', () => {
  const at = (scope: number, spectacle: number, period: number) => ({ scope, spectacle, period });
  const costOf = (demands: { scope: number; spectacle: number; period: number }, level: number) =>
    DEPARTMENTS.reduce((sum, one) => sum + rateFor(one, level) * monthsFor(one, demands), 0);

  it('reaches further for more scope and for more spectacle', () => {
    expect(whatItCouldReach(at(4, 2, 2))).toBeGreaterThan(whatItCouldReach(at(2, 2, 2)));
    expect(whatItCouldReach(at(2, 4, 2))).toBeGreaterThan(whatItCouldReach(at(2, 2, 2)));
  });

  it('weighs scope above spectacle, because size is what a wide audience turns up for', () => {
    expect(SCOPE_PULLS).toBeGreaterThan(SPECTACLE_PULLS);
    expect(whatItCouldReach(at(4, 2, 2))).toBeGreaterThan(whatItCouldReach(at(2, 4, 2)));
  });

  it('charges for period and reaches nobody with it, which is what makes it a trap', () => {
    // The sharpest claim in the model, and the one most worth a test: building a world
    // rather than borrowing one is paid for in design and on the floor, and does not
    // put a single person in a seat. Change `PERIOD_PULLS` and this is the case that
    // says so.
    const plain = at(3, 3, 1);
    const dressed = at(3, 3, 5);
    expect(whatItCouldReach(dressed)).toBe(whatItCouldReach(plain));
    expect(costOf(dressed, 3)).toBeGreaterThan(costOf(plain, 3));
  });

  it('makes the best team wrong on small material and right on large', () => {
    // The crossover, stated as the two cases that bracket it. Both are played at the
    // median draw, so the only thing differing is the hiring and the property.
    const draw = 0.5;
    const profit = (d: { scope: number; spectacle: number; period: number }, level: number) => {
      const craft = (level - 1) / 4;
      return reckon(whatItCouldReach(d), craft, draw) - costOf(d, level);
    };
    const small = at(1, 1, 3);
    const large = at(5, 4, 1);
    expect(profit(small, 5)).toBeLessThan(profit(small, 1));
    expect(profit(large, 5)).toBeGreaterThan(profit(large, 1));
  });
});
