/**
 * The lock chain, and the one property that makes it a chain rather than a row of
 * switches.
 *
 * A lock that can always be undone is a suggestion. A lock that can never be undone
 * punishes a player for exploring. What is worth having is the third thing:
 * **reversibility that decays as commitment accumulates**, at a moment the player
 * chooses rather than on a timer.
 *
 * So the cases below come in pairs. Before the money goes out, the budget reopens at
 * a price. After it, it does not — and the player was told which door was closing
 * before they closed it. The second half of each pair is the one that would be lost
 * to a careless change, because everything still *works* without it; it just stops
 * costing anything to be sure.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { LOCKS, LOCK_BY_ID, canReopen, inOrder, readyFor, undoCosts, wouldForeclose } from '@/engine/content/locks';
import { DEPARTMENTS, monthsFor } from '@/engine/content/departments';
import { holdingsOf, projectsOf, companyCash, parentCompany } from '@/engine/world/company';

type Said = { ok: boolean; error?: string };

/** A company with money, a holding and a project on the slate. */
function aPicture(seed: string) {
  const sim = quickSave({}, seed);
  sim.execute({ kind: 'company.option', payload: { title: `Something For ${seed}` } });
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
  const said = done.value as Said | undefined;
  return { ok: said?.ok ?? done.ok, why: said?.error ?? done.error ?? '' };
};

/**
 * Enough in the company to greenlight whatever this picture costs.
 *
 * Finds the cash account the way `purse` does — by owner and kind — rather than by
 * guessing its id. The first version guessed, did not match, and quietly opened a
 * *second* company_cash account: `companyCash` summed both and saw the money while
 * `payFor` read the first and saw none. Four cases failed on a company that was rich
 * and broke at the same time.
 */
function fund(sim: ReturnType<typeof quickSave>, cents: number) {
  const company = parentCompany(sim.universe)!;
  const existing = Object.values(sim.universe.accounts)
    .find((one) => one.ownerId === company.id && one.kind === 'company_cash' && !one.closedAt);
  const cash = existing ?? sim.ledger.open({
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

describe('the chain has an order', () => {
  it('will not take a lock before the one below it is shut', () => {
    const budget = LOCK_BY_ID.budget!;
    const greenlit = LOCK_BY_ID.greenlit!;
    expect(readyFor(budget, [])).toBe(true);
    expect(readyFor(greenlit, [])).toBe(false);
    expect(readyFor(greenlit, ['budget'])).toBe(true);
  });

  it('refuses a greenlight while the budget is still open', () => {
    const { sim, project } = aPicture('lock-order');
    expect(ran(sim, 'company.greenlight', { projectId: project.id }).ok).toBe(false);
  });

  it('keeps the locks in a fixed order with no ties', () => {
    const orders = inOrder().map((one) => one.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(new Set(orders).size).toBe(LOCKS.length);
  });
});

describe('shutting the budget', () => {
  it('freezes who is hired', () => {
    const { sim, holding, project } = aPicture('lock-freeze');
    const department = DEPARTMENTS.find((d) => monthsFor(d, holding.demands) > 0)!;
    expect(ran(sim, 'company.staff', { projectId: project.id, departmentId: department.id, level: 3 }).ok)
      .toBe(true);

    expect(ran(sim, 'company.lock_budget', { projectId: project.id }).ok).toBe(true);
    const after = ran(sim, 'company.staff', { projectId: project.id, departmentId: department.id, level: 4 });
    expect(after.ok).toBe(false);
    expect(after.why).toContain('shut');
  });

  it('will not shut twice', () => {
    const { sim, project } = aPicture('lock-twice');
    expect(ran(sim, 'company.lock_budget', { projectId: project.id }).ok).toBe(true);
    expect(ran(sim, 'company.lock_budget', { projectId: project.id }).ok).toBe(false);
  });

  it('opens again at a price, and the price is a share of the budget', () => {
    const { sim, project } = aPicture('lock-reopen');
    fund(sim, 50_000_000_00);
    ran(sim, 'company.lock_budget', { projectId: project.id });

    const before = companyCash(sim.universe);
    const owed = undoCosts(LOCK_BY_ID.budget!, project.budgetCents ?? 0);
    expect(owed).toBeGreaterThan(0);

    expect(ran(sim, 'company.lock_budget', { projectId: project.id, off: true }).ok).toBe(true);
    expect(companyCash(sim.universe)).toBe(before - owed);
    expect(project.locked ?? []).not.toContain('budget');
  });

  it('lets hiring resume once it is open again', () => {
    const { sim, holding, project } = aPicture('lock-resume');
    fund(sim, 50_000_000_00);
    const department = DEPARTMENTS.find((d) => monthsFor(d, holding.demands) > 0)!;
    ran(sim, 'company.lock_budget', { projectId: project.id });
    ran(sim, 'company.lock_budget', { projectId: project.id, off: true });
    expect(ran(sim, 'company.staff', { projectId: project.id, departmentId: department.id, level: 4 }).ok)
      .toBe(true);
  });

  it('refuses to open one that was never shut', () => {
    const { sim, project } = aPicture('lock-notshut');
    expect(ran(sim, 'company.lock_budget', { projectId: project.id, off: true }).ok).toBe(false);
  });
});

describe('the greenlight, and what it forecloses', () => {
  it('says which reversal it is about to remove, before it removes it', () => {
    // The briefing rather than the warning. A player is told the budget stops being
    // reopenable, by name, while they can still decide not to.
    const about = wouldForeclose(LOCK_BY_ID.greenlit!, ['budget']);
    expect(about.map((one) => one.id)).toEqual(['budget']);
    // And nothing to say when the budget was never shut, because nothing is lost.
    expect(wouldForeclose(LOCK_BY_ID.greenlit!, [])).toEqual([]);
  });

  it('takes the money out of the company', () => {
    const { sim, project } = aPicture('green-pay');
    fund(sim, 500_000_000_00);
    ran(sim, 'company.lock_budget', { projectId: project.id });

    const before = companyCash(sim.universe);
    const cost = project.budgetCents!;
    expect(ran(sim, 'company.greenlight', { projectId: project.id }).ok).toBe(true);
    expect(companyCash(sim.universe)).toBe(before - cost);
  });

  it('records the one date and lets the rest be derived', () => {
    const { sim, project } = aPicture('green-date');
    fund(sim, 500_000_000_00);
    ran(sim, 'company.lock_budget', { projectId: project.id });
    ran(sim, 'company.greenlight', { projectId: project.id });
    expect(project.greenlitAt).toBe(sim.now);
    expect(project.stage).toBe('greenlit');
  });

  it('closes the budget for good, and says so rather than failing quietly', () => {
    const { sim, project } = aPicture('green-foreclose');
    fund(sim, 500_000_000_00);
    ran(sim, 'company.lock_budget', { projectId: project.id });
    expect(canReopen(LOCK_BY_ID.budget!, project.locked ?? [])).toBe(true);

    ran(sim, 'company.greenlight', { projectId: project.id });

    expect(canReopen(LOCK_BY_ID.budget!, project.locked ?? [])).toBe(false);
    const after = ran(sim, 'company.lock_budget', { projectId: project.id, off: true });
    expect(after.ok).toBe(false);
    expect(after.why).toContain('gone out');
  });

  it('refuses when the company cannot pay for it', () => {
    const { sim, project } = aPicture('green-broke');
    ran(sim, 'company.lock_budget', { projectId: project.id });
    const done = ran(sim, 'company.greenlight', { projectId: project.id });
    expect(done.ok).toBe(false);
    // And nothing moved: the picture is still only locked, not committed.
    expect(project.stage).not.toBe('greenlit');
    expect(project.greenlitAt).toBeUndefined();
  });

  it('will not greenlight the same picture twice', () => {
    const { sim, project } = aPicture('green-once');
    fund(sim, 500_000_000_00);
    ran(sim, 'company.lock_budget', { projectId: project.id });
    expect(ran(sim, 'company.greenlight', { projectId: project.id }).ok).toBe(true);
    expect(ran(sim, 'company.greenlight', { projectId: project.id }).ok).toBe(false);
  });
});

describe('what a lock is made of', () => {
  it('cannot be reopened when nothing reverses it', () => {
    expect(canReopen(LOCK_BY_ID.greenlit!, ['budget', 'greenlit'])).toBe(false);
  });

  it('prices reopening off the budget rather than a flat figure', () => {
    const lock = LOCK_BY_ID.budget!;
    expect(undoCosts(lock, 10_000_000_00)).toBeGreaterThan(undoCosts(lock, 1_000_000_00));
  });
});
